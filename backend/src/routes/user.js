const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// GET current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, avatarUrl: true, isAdmin: true,
        theme: true, language: true, fontSize: true, sidebarDefault: true,
        emailVerified: true, googleId: true, createdAt: true,
        preferences: true
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PATCH update profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, theme, language, fontSize, sidebarDefault } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(theme ? { theme } : {}),
        ...(language ? { language } : {}),
        ...(fontSize ? { fontSize } : {}),
        ...(sidebarDefault ? { sidebarDefault } : {}),
      },
      select: { id: true, name: true, email: true, avatarUrl: true, theme: true, language: true, fontSize: true, sidebarDefault: true }
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PATCH update avatar URL
router.patch('/me/avatar', authenticate, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ error: 'avatarUrl required.' });
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true }
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update avatar.' });
  }
});

// PATCH change password
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required.' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'New password must contain an uppercase letter.' });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'New password must contain a number.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.passwordHash) return res.status(400).json({ error: 'Cannot change password for Google accounts.' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// DELETE account
router.delete('/me', authenticate, async (req, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Type DELETE to confirm account deletion.' });
    }
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// GET/PUT user preferences
router.get('/me/preferences', authenticate, async (req, res) => {
  try {
    let prefs = await prisma.userPreferences.findUnique({ where: { userId: req.user.id } });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({ data: { userId: req.user.id } });
    }
    res.json({ preferences: prefs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences.' });
  }
});

router.put('/me/preferences', authenticate, async (req, res) => {
  try {
    const { defaultModels, modelOrder, contextSize, contextEnabled } = req.body;
    const prefs = await prisma.userPreferences.upsert({
      where: { userId: req.user.id },
      update: {
        ...(defaultModels !== undefined ? { defaultModels } : {}),
        ...(modelOrder !== undefined ? { modelOrder } : {}),
        ...(contextSize !== undefined ? { contextSize } : {}),
        ...(contextEnabled !== undefined ? { contextEnabled } : {}),
      },
      create: {
        userId: req.user.id,
        defaultModels: defaultModels || [],
        modelOrder: modelOrder || [],
        contextSize: contextSize || 10,
        contextEnabled: contextEnabled !== undefined ? contextEnabled : true,
      }
    });
    res.json({ preferences: prefs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

module.exports = router;
