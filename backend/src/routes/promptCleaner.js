const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

const cleanerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many prompt clean requests.' }
});

router.post('/', optionalAuth, cleanerLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt text required.' });
    }

    // Use Groq (fastest) for prompt cleaning
    const apiKey = process.env.GROQ_API_KEY;
    const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

    if (!apiKey) {
      return res.status(503).json({ error: 'Prompt cleaner not configured.' });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a prompt engineering expert. Rewrite the user\'s prompt to be clearer, more specific, and more effective for AI language models. Preserve the original intent. Return ONLY the improved prompt with no explanation, no preamble, no quotes.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        stream: false,
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Prompt cleaner service unavailable.' });
    }

    const data = await response.json();
    const cleaned = data.choices?.[0]?.message?.content?.trim();

    if (!cleaned) {
      return res.status(500).json({ error: 'Failed to clean prompt.' });
    }

    res.json({ original: prompt, cleaned });
  } catch (err) {
    console.error('Prompt cleaner error:', err);
    res.status(500).json({ error: 'Prompt cleaning failed.' });
  }
});

module.exports = router;
