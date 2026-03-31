/**
 * MirraSync Logs API
 * Admin-only endpoints for viewing system logs.
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * GET /api/logs
 * Query params: level, source, limit, offset, from, to
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { level, source, limit = 100, offset = 0, from, to } = req.query;

    const where = {};
    if (level) where.level = level;
    if (source) where.source = { contains: source };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.log.count({ where }),
    ]);

    res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

/**
 * GET /api/logs/:id
 * Full detail view of a single log entry
 */
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const log = await prisma.log.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: 'Log not found.' });
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch log.' });
  }
});

/**
 * DELETE /api/logs/cleanup
 * Delete logs older than 30 days
 */
router.delete('/cleanup', authenticate, requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.log.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });
    res.json({ message: `Deleted ${result.count} old logs.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cleanup logs.' });
  }
});

module.exports = router;
