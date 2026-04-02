import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button, Input } from '../components/ui';
import useAuthStore from '../stores/authStore';
import api from '../lib/api';
import { LOGO_URL } from '../lib/modelRegistry';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  const callbackUrl = new URLSearchParams(location.search).get('callbackUrl') || '/chat';

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
        });
      }
    };

    // GIS script may not be loaded yet
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCredential = async (response) => {
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      setAuth(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(callbackUrl, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});
    if (!form.email) return setError({ email: 'Email is required' });
    if (!form.password) return setError({ password: 'Password is required' });

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setAuth(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(callbackUrl, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      const requiresVerification = err.response?.data?.requiresVerification;
      if (requiresVerification) {
        toast('Please verify your email first. A new code has been sent.', { icon: '📧' });
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
      } else {
        setError({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: show the one-tap button
          toast.error('Google sign-in popup was blocked. Please allow popups and try again.');
        }
      });
    } else {
      toast.error('Google Sign-in is not available. Please try again later.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050509',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Aurora background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-orb aurora-orb-1" style={{ width: 500, height: 500, top: '-15%', left: '-10%', opacity: 0.45 }} />
        <div className="aurora-orb aurora-orb-2" style={{ width: 400, height: 400, bottom: '-10%', right: '-8%', opacity: 0.35 }} />
        <div className="aurora-orb aurora-orb-3" style={{ width: 300, height: 300, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.3 }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={LOGO_URL} alt="MirraSync" style={{ width: 36, height: 36, borderRadius: '50%', boxShadow: '0 0 24px rgba(0,229,200,0.2)' }} />
            <span style={{
              fontSize: 26, fontWeight: 800,
              background: 'linear-gradient(135deg, #00e5c8, #4f8ef7, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '-0.5px',
            }}>MirraSync</span>
          </Link>
          <p style={{ color: '#66669a', fontSize: 14, marginTop: 6 }}>Welcome back</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(10, 10, 19, 0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '28px',
          boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg, #00e5c8, #4f8ef7, #8b5cf6)' }} />

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '11px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, transition: 'all var(--transition-fast)', marginBottom: 20,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error.general && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--danger-dim)', border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  fontSize: 13, color: 'var(--danger)',
                }}
              >
                ⚠ {error.general}
              </motion.div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={error.email}
              autoFocus
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={error.password}
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-teal)' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
