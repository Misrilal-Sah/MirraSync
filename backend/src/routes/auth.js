const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { rateLimit } = require('express-rate-limit');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/email');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Strict rate limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again in 15 minutes.' }
});
const otpResendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: { error: 'Please wait 60 seconds before requesting a new code.' }
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SIGNUP ─────────────────────────────────────────────────────
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, emailVerified: false }
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpToken.create({
      data: { userId: user.id, token: otp, type: 'EMAIL_VERIFY', expiresAt }
    });

    await sendOtpEmail(email, name, otp);

    res.status(201).json({ message: 'Account created. Please check your email for the verification code.', email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// ─── VERIFY EMAIL ───────────────────────────────────────────────
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified.' });

    const token = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: otp,
        type: 'EMAIL_VERIFY',
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      prisma.otpToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
    ]);

    const authToken = generateToken({ userId: user.id });
    res.json({ message: 'Email verified successfully!', token: authToken, user: { id: user.id, name: user.name, email: user.email, theme: user.theme } });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ─── RESEND OTP ─────────────────────────────────────────────────
router.post('/resend-otp', otpResendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return res.status(400).json({ error: 'Cannot resend OTP.' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpToken.create({
      data: { userId: user.id, token: otp, type: 'EMAIL_VERIFY', expiresAt }
    });
    await sendOtpEmail(email, user.name, otp);
    res.json({ message: 'New verification code sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

// ─── LOGIN ──────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    if (!user.emailVerified) {
      // Resend OTP
      const otp = generateOtp();
      await prisma.otpToken.create({
        data: { userId: user.id, token: otp, type: 'EMAIL_VERIFY', expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
      });
      await sendOtpEmail(email, user.name, otp);
      return res.status(403).json({ error: 'Email not verified. A new code has been sent.', requiresVerification: true, email });
    }

    const token = generateToken({ userId: user.id });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, theme: user.theme, language: user.language, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── FORGOT PASSWORD ────────────────────────────────────────────
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    // Always respond same to prevent user enumeration
    const successMsg = 'If an account exists with this email, a reset link has been sent.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) return res.json({ message: successMsg });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otpToken.create({
      data: { userId: user.id, token: hashedToken, type: 'PASSWORD_RESET', expiresAt }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(email, user.name, resetUrl);

    res.json({ message: successMsg });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ─── RESET PASSWORD ─────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required.' });

    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one number.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const otpRecord = await prisma.otpToken.findFirst({
      where: { token: hashedToken, type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } }
    });

    if (!otpRecord) return res.status(400).json({ error: 'Invalid or expired reset link.' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: otpRecord.userId }, data: { passwordHash } }),
      prisma.otpToken.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } })
    ]);

    const user = await prisma.user.findUnique({ where: { id: otpRecord.userId } });
    const authToken = generateToken({ userId: user.id });
    res.json({ message: 'Password reset successfully!', token: authToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ─── VERIFY RESET TOKEN ─────────────────────────────────────────
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const otpRecord = await prisma.otpToken.findFirst({
      where: { token: hashedToken, type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } }
    });
    res.json({ valid: !!otpRecord });
  } catch (err) {
    res.json({ valid: false });
  }
});

// ─── GOOGLE AUTH ─────────────────────────────────────────────────
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link Google ID if not linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true, avatarUrl: user.avatarUrl || picture }
        });
      }
    } else {
      user = await prisma.user.create({
        data: { name, email, googleId, emailVerified: true, avatarUrl: picture }
      });
    }

    const token = generateToken({ userId: user.id });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, theme: user.theme, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed.' });
  }
});

module.exports = router;
