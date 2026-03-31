const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// GET messages for a conversation
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const conv = await prisma.conversation.findFirst({
      where: { id: req.params.conversationId, userId: req.user.id }
    });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// GET models route (public)
router.get('/registry/all', (req, res) => {
  const { MODEL_REGISTRY } = require('../models/registry');
  res.json({ models: MODEL_REGISTRY.map(m => ({
    id: m.id,
    displayName: m.displayName,
    provider: m.provider,
    providerLabel: m.providerLabel,
    supportsVision: m.supportsVision,
    supportsFiles: m.supportsFiles,
    supportsReasoning: m.supportsReasoning,
    isFree: m.isFree,
    requiresUserKey: m.requiresUserKey,
    description: m.description,
    colorAccent: m.colorAccent,
    category: m.category,
  })) });
});

module.exports = router;
