const express = require('express');
const { authenticate } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const { getModelsByProvider, MODEL_REGISTRY } = require('../models/registry');
const { streamFromModel } = require('../providers/adapters');
const prisma = require('../utils/prisma');

const router = express.Router();

// GET all API keys for user (masked)
router.get('/', authenticate, async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      select: { id: true, provider: true, testedAt: true, testPassed: true, createdAt: true }
    });
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API keys.' });
  }
});

// PUT save/update API key for a provider
router.put('/:provider', authenticate, async (req, res) => {
  try {
    const { provider } = req.params;
    const { apiKey, accountId } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'API key required.' });

    const validProviders = ['github_models', 'google_ai', 'groq', 'cerebras', 'cohere', 'mistral', 'openrouter', 'cloudflare'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider.' });
    }

    const encryptedKey = encrypt(apiKey);
    const encryptedAccId = accountId ? encrypt(accountId) : null;

    const key = await prisma.apiKey.upsert({
      where: { userId_provider: { userId: req.user.id, provider } },
      update: { encryptedKey, encryptedAccId, testPassed: null, testedAt: null },
      create: { userId: req.user.id, provider, encryptedKey, encryptedAccId }
    });

    res.json({ message: 'API key saved.', id: key.id, provider: key.provider });
  } catch (err) {
    console.error('Save API key error:', err);
    res.status(500).json({ error: 'Failed to save API key.' });
  }
});

// POST test API key connection
router.post('/:provider/test', authenticate, async (req, res) => {
  try {
    const { provider } = req.params;

    const storedKey = await prisma.apiKey.findUnique({
      where: { userId_provider: { userId: req.user.id, provider } }
    });
    if (!storedKey) return res.status(404).json({ error: 'No API key found for this provider.' });

    let decryptedKey, accountId;
    try {
      decryptedKey = decrypt(storedKey.encryptedKey);
      accountId = storedKey.encryptedAccId ? decrypt(storedKey.encryptedAccId) : null;
    } catch (e) {
      return res.status(400).json({ error: 'API key is corrupted. Please re-save it in Settings.' });
    }

    // Find a model from this provider to test with
    const testModel = MODEL_REGISTRY.find(m => m.provider === provider);
    if (!testModel) return res.status(404).json({ error: 'No test model found for provider.' });

    let testPassed = false;
    let errorMsg = null;
    let responseReceived = false;

    await streamFromModel(
      testModel,
      [{ role: 'user', content: 'Say "ok" in 1 word.' }],
      decryptedKey,
      accountId,
      (token) => { responseReceived = true; },
      (code, msg) => { errorMsg = msg; },
      () => { testPassed = responseReceived; }
    );

    await prisma.apiKey.update({
      where: { id: storedKey.id },
      data: { testedAt: new Date(), testPassed }
    });

    if (testPassed) {
      res.json({ success: true, message: 'Connection successful!' });
    } else {
      res.status(400).json({ success: false, message: errorMsg || 'Connection failed.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Test failed.' });
  }
});

// DELETE API key
router.delete('/:provider', authenticate, async (req, res) => {
  try {
    await prisma.apiKey.deleteMany({
      where: { userId: req.user.id, provider: req.params.provider }
    });
    res.json({ message: 'API key removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete API key.' });
  }
});

module.exports = router;
