const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// GET all conversations for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user.id,
        ...(search ? { title: { contains: search } } : {})
      },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      take: parseInt(limit),
      skip: parseInt(offset),
      include: { messages: { take: 1, orderBy: { createdAt: 'asc' }, select: { content: true } } }
    });
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// POST create conversation
router.post('/', authenticate, async (req, res) => {
  try {
    const { modelsUsed = [] } = req.body;
    const conversation = await prisma.conversation.create({
      data: { userId: req.user.id, modelsUsed, title: 'New Chat' }
    });
    res.status(201).json({ conversation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// GET single conversation with messages
router.get('/:id', authenticate, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
});

// PATCH update conversation (title, pin)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { title, pinned, modelsUsed } = req.body;
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(pinned !== undefined ? { pinned } : {}),
        ...(modelsUsed !== undefined ? { modelsUsed } : {}),
      }
    });
    res.json({ conversation: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update conversation.' });
  }
});

// DELETE conversation
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    await prisma.conversation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

// DELETE bulk
router.delete('/', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required.' });
    await prisma.conversation.deleteMany({
      where: { id: { in: ids }, userId: req.user.id }
    });
    res.json({ message: `${ids.length} conversations deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversations.' });
  }
});

module.exports = router;
