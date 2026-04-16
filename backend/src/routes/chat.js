const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getModelById } = require('../models/registry');
const { streamFromModel } = require('../providers/adapters');
const { decrypt } = require('../utils/encryption');
const prisma = require('../utils/prisma');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Slow down a bit.' }
});

// Tiered rate limits for chat streaming
const guestChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.headers['x-guest-id'] || req.ip,
  message: { error: 'Rate limit reached. Please wait a moment or sign up for higher limits.', rateLimited: true }
});

const guestHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.headers['x-guest-id'] || req.ip,
  message: { error: 'Hourly limit reached. Sign up for higher limits.', rateLimited: true }
});

const authedChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Rate limit reached. Please wait a moment.', rateLimited: true }
});

/**
 * POST /api/chat/stream
 * Body: { modelId, messages, conversationId?, guestId? }
 * Streams SSE events back to client
 */
router.post('/stream', optionalAuth, async (req, res) => {
  const { modelId, messages, conversationId, guestId, systemPrompt } = req.body;

  if (!modelId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'modelId and messages array required.' });
  }

  // Apply tier-appropriate rate limit (middleware-style inline)
  // Note: actual rate limiting is handled by the middleware below

  const model = getModelById(modelId);
  if (!model) {
    return res.status(404).json({ error: `Model "${modelId}" not found.` });
  }

  // Get user's API key if they have one
  let userApiKey = null;
  let userAccountId = null;
  if (req.user) {
    const storedKey = await prisma.apiKey.findUnique({
      where: { userId_provider: { userId: req.user.id, provider: model.provider } }
    });
    if (storedKey) {
      try {
        userApiKey = decrypt(storedKey.encryptedKey);
        if (storedKey.encryptedAccId) {
          userAccountId = decrypt(storedKey.encryptedAccId);
        }
      } catch (decryptErr) {
        // Key was encrypted with a different ENCRYPTION_KEY — skip it
        // User needs to re-save their API key in Settings
      }
    }
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let fullResponse = '';
  const startTime = Date.now();

  sendEvent('start', { modelId, model: model.displayName });

  // Prepend system prompt if provided (e.g., language preference)
  const finalMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : [...messages];

  // Warn non-vision models about attachments they can't process
  const hasAttachments = messages.some(m => m.attachments?.length > 0 || (typeof m.content === 'object'));
  if (hasAttachments && !model.supportsVision) {
    finalMessages.unshift({
      role: 'system',
      content: 'Note: The user has attached images or files, but you do not have the capability to view or process visual content. Please let the user know politely that you cannot read images/files, and respond based only on the text portion of their message.'
    });
  }

  await streamFromModel(
    model,
    finalMessages,
    userApiKey,
    userAccountId,
    (token) => {
      fullResponse += token;
      sendEvent('token', { token, modelId });
    },
    (errorCode, errorMessage) => {
      if (res.writableEnded) return;
      sendEvent('error', { modelId, code: errorCode, message: errorMessage });
      res.end();
    },
    async () => {
      if (res.writableEnded) return;
      const responseTimeMs = Date.now() - startTime;
      sendEvent('done', { modelId, responseTimeMs, totalLength: fullResponse.length });

      // Save message to DB if user is logged in and conversation exists
      if (req.user && conversationId && fullResponse) {
        try {
          await prisma.message.create({
            data: {
              conversationId,
              role: 'assistant',
              modelId,
              content: fullResponse,
              responseTimeMs,
            }
          });
        } catch (err) {
          console.error('Failed to save assistant message:', err.message);
        }
      }

      if (!res.writableEnded) res.end();
    }
  );

  req.on('close', () => {
    res.end();
  });
});

/**
 * POST /api/chat/save-user-message
 * Saves the user's message before streaming
 */
router.post('/save-user-message', authenticate, async (req, res) => {
  try {
    const { conversationId, content, attachments } = req.body;
    if (!conversationId || !content) {
      return res.status(400).json({ error: 'conversationId and content required.' });
    }

    // Verify conversation belongs to user
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.user.id }
    });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    const message = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
        attachments: attachments || null,
      }
    });

    // Auto-generate title from first message
    if (conv.title === 'New Chat') {
      const title = content.slice(0, 60).replace(/\n/g, ' ');
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title, updatedAt: new Date() }
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
    }

    res.json({ message });
  } catch (err) {
    console.error('Save message error:', err);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

module.exports = router;
