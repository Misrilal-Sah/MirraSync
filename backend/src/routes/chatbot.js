const express = require('express');
const { rateLimit } = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Rate limit chatbot: 20 requests per minute
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many chatbot requests. Please wait a moment.' }
});

// Load knowledge base once at startup
const knowledgePath = path.join(__dirname, '..', 'knowledge', 'project_knowledge.txt');
let knowledgeBase = '';
try {
  knowledgeBase = fs.readFileSync(knowledgePath, 'utf-8');
} catch (err) {
  console.error('Failed to load knowledge base:', err.message);
  knowledgeBase = 'MirraSync is a multi-AI chat platform. No detailed knowledge available.';
}

const SYSTEM_PROMPT = `You are MirraSync Assistant, a helpful chatbot for the MirraSync platform. 
You ONLY answer questions about MirraSync — its features, pricing, models, how to use it, troubleshooting, etc.

Here is your knowledge base:
---
${knowledgeBase}
---

Rules:
1. ONLY answer questions related to MirraSync. If someone asks about unrelated topics, politely say: "I can only help with MirraSync-related questions. For other queries, please contact our team at support@mirrasync.com."
2. Be friendly, concise, and helpful.
3. Use emojis sparingly to make responses engaging.
4. If you don't know something specific, say so honestly and suggest contacting support.
5. Format responses with short paragraphs. Use bullet points for lists.
6. Never make up features that aren't in the knowledge base.
7. Keep responses under 200 words unless the question requires more detail.`;

/**
 * POST /api/chatbot
 * Body: { message, history? }
 * Uses Groq API to generate response with project knowledge context
 */
router.post('/', chatbotLimiter, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Chatbot is not configured. Please try again later.' });
    }

    // Build messages array with system prompt + history + user message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map(h => ({
        role: h.role,
        content: h.content.slice(0, 500) // Limit history message length
      })),
      { role: 'user', content: message.slice(0, 1000) }
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        temperature: 0.4,
        max_tokens: 512,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errData);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';

    res.json({ reply, model: 'meta-llama/llama-4-scout-17b-16e-instruct' });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
