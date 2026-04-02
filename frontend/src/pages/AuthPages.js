// ─── SIGNUP ──────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button, Input, Spinner } from '../components/ui';
import useAuthStore from '../stores/authStore';
import api from '../lib/api';
import { LOGO_URL } from '../lib/modelRegistry';

export function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must include uppercase';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must include a number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      await api.post('/auth/signup', { name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Check your email for verification code.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Aurora orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-orb aurora-orb-1" style={{ width: 480, height: 480, top: '-15%', right: '-8%', opacity: 0.4 }} />
        <div className="aurora-orb aurora-orb-3" style={{ width: 360, height: 360, bottom: '-10%', left: '-5%', opacity: 0.35 }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={LOGO_URL} alt="MirraSync" style={{ width: 36, height: 36, borderRadius: '50%', boxShadow: '0 0 24px rgba(0,229,200,0.2)' }} />
            <span style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #00e5c8, #4f8ef7, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px' }}>MirraSync</span>
          </Link>
          <p style={{ color: '#66669a', fontSize: 14, marginTop: 6 }}>Create your free account</p>
        </div>
        <div className="auth-card" style={{ background: 'rgba(10,10,19,0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 16px 64px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg, #00e5c8, #4f8ef7, #8b5cf6)' }} />
          {errors.general && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>⚠ {errors.general}</motion.div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full name" placeholder="John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus />
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            <Input label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
            <Input label="Confirm password" type="password" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            <Button type="submit" loading={loading} fullWidth size="lg">Create Account</Button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#66669a', marginTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { setAuth } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (newOtp.every(d => d)) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-email', { email, otp: code });
      setAuth(res.data.token, res.data.user);
      toast.success('Email verified! Welcome to MirraSync 🎉');
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
      setShake(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => { setShake(false); inputs.current[0]?.focus(); }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New code sent!');
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Animated background particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, 15 * (i % 2 === 0 ? 1 : -1), 0],
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          style={{
            position: 'absolute',
            width: 120 + i * 40,
            height: 120 + i * 40,
            borderRadius: '50%',
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(0,212,170,0.08), transparent 70%)'
              : 'radial-gradient(circle, rgba(14,165,233,0.06), transparent 70%)',
            top: `${15 + i * 12}%`,
            left: `${10 + i * 15}%`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo and branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <motion.img
              src={LOGO_URL} alt="MirraSync"
              style={{ width: 40, height: 40, borderRadius: '50%', boxShadow: '0 0 30px rgba(0,212,170,0.25)' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{ fontSize: 24, fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
          </Link>
          {/* Animated gradient bar */}
          <motion.div
            style={{ height: 3, background: 'linear-gradient(90deg, #00e5c8, #0ea5e9, #7c3aed, #00e5c8)', backgroundSize: '200% 100%', borderRadius: 2, margin: '12px auto 0', maxWidth: 200 }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            animate={{ rotateY: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 48, marginBottom: 12, display: 'inline-block' }}
          >
            📧
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We sent a 6-digit code to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong></p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="auth-card"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,212,170,0.08)' }}
        >
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>⚠ {error}</motion.p>}
          <motion.div
            animate={shake ? { x: [0, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="auth-otp-container"
            style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}
          >
            {otp.map((digit, i) => (
              <motion.input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="auth-otp-input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  width: 44, height: 52, textAlign: 'center',
                  fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${digit ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  boxShadow: digit ? 'var(--shadow-glow-teal)' : 'none',
                  flexShrink: 0,
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-teal)'; e.target.style.boxShadow = 'var(--shadow-glow-teal)'; }}
                onBlur={e => { if (!digit) { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; } }}
              />
            ))}
          </motion.div>
          <Button fullWidth size="lg" loading={loading} onClick={() => handleVerify(otp.join(''))} disabled={otp.some(d => !d)}>
            Verify Email
          </Button>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {resendCooldown > 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resend in {resendCooldown}s</p>
            ) : (
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Resend code
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Animated background particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.25, 0.1],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
          style={{
            position: 'absolute',
            width: 160 + i * 60,
            height: 160 + i * 60,
            borderRadius: '50%',
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(0,212,170,0.07), transparent 70%)'
              : 'radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)',
            top: `${20 + i * 15}%`,
            left: `${15 + i * 20}%`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo & title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <motion.img
              src={LOGO_URL} alt="MirraSync"
              style={{ width: 40, height: 40, borderRadius: '50%', boxShadow: '0 0 30px rgba(0,212,170,0.25)' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #00e5c8, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
          </Link>
          {/* Animated gradient bar */}
          <motion.div
            style={{ height: 3, background: 'linear-gradient(90deg, #00e5c8, #0ea5e9, #7c3aed, #00e5c8)', backgroundSize: '200% 100%', borderRadius: 2, margin: '12px auto 0', maxWidth: 200 }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>Reset your password</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0,212,170,0.08)' }}
        >
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '16px 0' }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 56, marginBottom: 16, display: 'inline-block' }}
              >
                ✅
              </motion.div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: 20, fontWeight: 800 }}>Check your inbox</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>If an account exists for <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>, a password reset link has been sent.</p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, color: 'var(--accent-teal)', fontSize: 14, fontWeight: 600 }}>← Back to login</Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 48, marginBottom: 12, display: 'inline-block' }}
                >
                  🔑
                </motion.div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Enter your email and we'll send you a reset link.</p>
              </div>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>⚠ {error}</motion.p>}
              <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <Button type="submit" loading={loading} fullWidth size="lg">Send Reset Link</Button>
              <Link to="/login" style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', display: 'block' }}>← Back to login</Link>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = require('react-router-dom').useParams();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get(`/auth/verify-reset-token/${token}`)
      .then(res => setValid(res.data.valid))
      .catch(() => setValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.password) errs.password = 'Required';
    else if (form.password.length < 8) errs.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include uppercase';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must include a number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password: form.password });
      setAuth(res.data.token, res.data.user);
      toast.success('Password reset! Welcome back.');
      navigate('/chat', { replace: true });
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Reset failed' });
    } finally {
      setLoading(false);
    }
  };

  if (validating) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}><Spinner size={32} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 24, fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-lg)' }}>
          {!valid ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Invalid or expired link</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>This password reset link has expired or already been used.</p>
              <Link to="/forgot-password"><Button>Request new link</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Set new password</h3>
              {errors.general && <p style={{ fontSize: 13, color: 'var(--danger)' }}>⚠ {errors.general}</p>}
              <Input label="New password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} autoFocus />
              <Input label="Confirm password" type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
              <Button type="submit" loading={loading} fullWidth size="lg">Reset Password</Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default SignupPage;
