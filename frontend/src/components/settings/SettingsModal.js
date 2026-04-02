import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import { MODEL_REGISTRY, PROVIDERS, getProviderIcon, API_KEY_VALIDATION } from '../../lib/modelRegistry';
import { Toggle, Button, Input, Badge, Spinner, Key, User, CreditCard, Brain, Settings2, X, Eye, EyeOff, Check, Globe } from '../ui';
import api from '../../lib/api';

const TABS = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'ai', label: 'AI Preferences', icon: '🤖' },
  { id: 'keys', label: 'API Keys', icon: '🔑' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'subscription', label: 'Subscription', icon: '💎' },
  { id: 'logs', label: 'Logs', icon: '📝' },
];

export default function SettingsModal({ onClose }) {
  const { settingsTab, setSettingsTab } = useUIStore();
  const { user } = useAuthStore();

  const isGuest = !user;
  const visibleTabs = isGuest
    ? TABS.filter(t => t.id === 'general')
    : TABS.filter(t => t.id !== 'logs' || user?.isAdmin);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // If guest is somehow on a restricted tab, redirect
  useEffect(() => {
    if (isGuest && settingsTab !== 'general') {
      setSettingsTab('general');
    }
  }, [isGuest, settingsTab]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="settings-modal-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="settings-modal-container settings-modal-inner"
        style={{         background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 820, height: '85vh', maxHeight: 680, display: 'flex', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,200,0.05)', position: 'relative', }}
      >
        <div className="settings-header-mobile" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 24, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Left tabs */}
        <div className="settings-sidebar" style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '20px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          <div className="settings-header-desktop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 6px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Settings</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
          </div>
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: settingsTab === tab.id ? 'rgba(0,229,200,0.08)' : 'none', border: 'none', color: settingsTab === tab.id ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: 13, fontWeight: settingsTab === tab.id ? 700 : 500, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left', width: '100%', marginBottom: 2, transition: 'all var(--transition-fast)', borderLeft: `2px solid ${settingsTab === tab.id ? 'var(--accent-teal)' : 'transparent'}` }}
              onMouseEnter={e => { if (settingsTab !== tab.id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (settingsTab !== tab.id) e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="settings-content" style={{ flex: 1, overflow: 'auto', padding: '28px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={settingsTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              {settingsTab === 'general' && <GeneralTab />}
              {settingsTab === 'ai' && <AIPreferencesTab />}
              {settingsTab === 'keys' && <APIKeysTab />}
              {settingsTab === 'profile' && <ProfileTab />}
              {settingsTab === 'subscription' && <SubscriptionTab />}
              {settingsTab === 'logs' && <LogsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── GENERAL TAB ────────────────────────────────────────────── */
function GeneralTab() {
  const { theme, setTheme } = useUIStore();
  const { user, updateUser } = useAuthStore();
  const [lang, setLang] = useState(user?.language || localStorage.getItem('mirrasync_lang') || 'en');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    localStorage.setItem('mirrasync_lang', lang);
    if (!user) {
      toast.success('Language preference saved locally');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/user/me', { language: lang });
      updateUser({ language: lang });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>General</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Manage the look and feel of the platform</p>

      <Section title="Appearance">
        <div style={{ display: 'flex', gap: 8 }}>
          {['system', 'light', 'dark'].map(t => (
            <button key={t} onClick={() => setTheme(t)}
              style={{ flex: 1, padding: '10px 0', background: theme === t ? 'var(--accent-teal-dim)' : 'var(--bg-overlay)', border: `1px solid ${theme === t ? 'var(--accent-teal)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', color: theme === t ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all var(--transition-fast)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 16 }}>{t === 'system' ? '🖥' : t === 'light' ? '☀️' : '🌙'}</span>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Language Preferences" subtitle="AI models will respond in your selected language">
        <CustomDropdown
          value={lang}
          onChange={setLang}
          options={[
            { value: 'en', label: 'English', flag: '🇬🇧' },
            { value: 'es', label: 'Spanish', flag: '🇪🇸' },
            { value: 'fr', label: 'French', flag: '🇫🇷' },
            { value: 'de', label: 'German', flag: '🇩🇪' },
            { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
            { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
            { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
          ]}
        />
      </Section>

      <Button onClick={save} loading={saving}>Save Settings</Button>
    </div>
  );
}

/* ─── AI PREFERENCES TAB ─────────────────────────────────────── */
function AIPreferencesTab() {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/user/me/preferences').then(r => setPrefs(r.data.preferences)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/user/me/preferences', prefs);
      toast.success('AI preferences saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (!prefs) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>;

  const defaultModels = prefs.defaultModels || [];
  const toggleDefault = (id) => {
    const cur = defaultModels.includes(id) ? defaultModels.filter(m => m !== id) : defaultModels.length < 4 ? [...defaultModels, id] : defaultModels;
    setPrefs({ ...prefs, defaultModels: cur });
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>AI Preferences</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Configure default models and context settings</p>

      <Section title="Default Active Models (max 4)" subtitle="These models open automatically on every new chat">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {MODEL_REGISTRY.map(m => {
            const active = defaultModels.includes(m.id);
            return (
              <button key={m.id} onClick={() => toggleDefault(m.id)}
                style={{ padding: '8px 12px', background: active ? 'var(--accent-teal-dim)' : 'var(--bg-overlay)', border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8, cursor: m.isPro ? 'not-allowed' : 'pointer', transition: 'all var(--transition-fast)', opacity: m.isPro ? 0.5 : 1 }}>
                <span style={{ display: 'flex', flexShrink: 0, width: 14, height: 14, alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getProviderIcon(m.provider, 14) }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--accent-teal)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.displayName}</span>
                {m.isPro && <span style={{ fontSize: 9, color: '#a78bfa' }}>PRO</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Context Window">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="range" min={1} max={20} value={prefs.contextSize} onChange={e => setPrefs({ ...prefs, contextSize: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--accent-teal)' }} />
          <span style={{ fontSize: 13, color: 'var(--accent-teal)', fontWeight: 700, minWidth: 60 }}>{prefs.contextSize} messages</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>How many previous messages to include for context</p>
      </Section>

      <Section title="Context Inclusion">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Include conversation history</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Send previous messages as context to the AI</p>
          </div>
          <Toggle checked={prefs.contextEnabled} onChange={v => setPrefs({ ...prefs, contextEnabled: v })} />
        </div>
      </Section>

      <Button onClick={save} loading={saving}>Save Preferences</Button>
    </div>
  );
}

/* ─── API KEYS TAB ───────────────────────────────────────────── */
function APIKeysTab() {
  const [keys, setKeys] = useState({});
  const [savedKeys, setSavedKeys] = useState({});
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState({});
  const [visible, setVisible] = useState({});

  useEffect(() => {
    api.get('/api-keys').then(r => {
      const map = {};
      r.data.keys.forEach(k => { map[k.provider] = k; });
      setSavedKeys(map);
    }).catch(() => {});
  }, []);

  const saveKey = async (provider) => {
    const val = keys[provider];
    if (!val?.trim()) return;

    // Validate key format
    const rules = API_KEY_VALIDATION[provider];
    if (rules) {
      if (rules.prefix && !val.startsWith(rules.prefix) && !(rules.altPrefix && val.startsWith(rules.altPrefix))) {
        toast.error(`Invalid key format. ${rules.label}`);
        return;
      }
      if (val.length < rules.minLength) {
        toast.error(`Key too short. ${rules.label}`);
        return;
      }
    }

    setSaving(s => ({ ...s, [provider]: true }));
    try {
      await api.put(`/api-keys/${provider}`, { apiKey: val, accountId: keys[`${provider}_account`] });
      setSavedKeys(s => ({ ...s, [provider]: { provider, testPassed: null } }));
      toast.success('API key saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save key');
    } finally { setSaving(s => ({ ...s, [provider]: false })); }
  };

  const testKey = async (provider) => {
    setTesting(t => ({ ...t, [provider]: true }));
    try {
      await api.post(`/api-keys/${provider}/test`);
      setTestResults(t => ({ ...t, [provider]: 'success' }));
      setSavedKeys(s => ({ ...s, [provider]: { ...s[provider], testPassed: true } }));
      toast.success('Connection successful!');
    } catch (err) {
      setTestResults(t => ({ ...t, [provider]: 'error' }));
      toast.error(err.response?.data?.message || 'Connection failed');
    } finally { setTesting(t => ({ ...t, [provider]: false })); }
  };

  const deleteKey = async (provider) => {
    try {
      await api.delete(`/api-keys/${provider}`);
      setSavedKeys(s => { const n = { ...s }; delete n[provider]; return n; });
      setKeys(k => { const n = { ...k }; delete n[provider]; return n; });
      toast.success('Key removed');
    } catch { toast.error('Failed to remove key'); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>API Keys</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Add your own API keys to unlock more models or avoid rate limits</p>
      <div style={{ padding: '10px 14px', background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', marginBottom: 24, fontSize: 12, color: 'var(--warning)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        🔒 <span>Your API keys are AES-256 encrypted before being stored. They are never shared or logged.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PROVIDERS.map(provider => {
          const hasSaved = !!savedKeys[provider.id];
          const result = testResults[provider.id];
          const isCloudflare = provider.id === 'cloudflare';
          const models = MODEL_REGISTRY.filter(m => m.provider === provider.id);

          return (
            <div key={provider.id} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'flex', flexShrink: 0, width: 18, height: 18, alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getProviderIcon(provider.id, 18) }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{provider.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({models.map(m => m.displayName).join(', ')})</span>
                </div>
                {hasSaved && (
                  <Badge variant={savedKeys[provider.id]?.testPassed ? 'green' : 'gray'} size="sm">
                    {savedKeys[provider.id]?.testPassed ? '✓ Connected' : 'Saved'}
                  </Badge>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type={visible[provider.id] ? 'text' : 'password'}
                    placeholder={`Enter ${provider.label} API key...`}
                    value={keys[provider.id] || ''}
                    onChange={e => setKeys(k => ({ ...k, [provider.id]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 40px 8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-teal)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                  <button onClick={() => setVisible(v => ({ ...v, [provider.id]: !v[provider.id] }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {visible[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Button variant="secondary" size="sm" loading={saving[provider.id]} onClick={() => saveKey(provider.id)} disabled={!keys[provider.id]?.trim()}>Save</Button>
              </div>

              {isCloudflare && (
                <input
                  type="text"
                  placeholder="Cloudflare Account ID"
                  value={keys[`${provider.id}_account`] || ''}
                  onChange={e => setKeys(k => ({ ...k, [`${provider.id}_account`]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', marginBottom: 8 }}
                />
              )}

              {hasSaved && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Button variant="secondary" size="sm" loading={testing[provider.id]} onClick={() => testKey(provider.id)}>
                    {result === 'success' ? '✓ Test passed' : result === 'error' ? '✗ Test failed' : 'Test Connection'}
                  </Button>
                  <button onClick={() => deleteKey(provider.id)} style={{ padding: '5px 12px', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pro Models Section - Locked */}
      <Section title="Premium Models" subtitle="These models require a Pro subscription">
        <div style={{ display: 'grid', gap: 8 }}>
          {MODEL_REGISTRY.filter(m => m.isPro).map(m => (
            <div key={m.id} style={{ padding: '12px 14px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6, cursor: 'not-allowed', position: 'relative' }}
              title="🔒 Requires Pro subscription to configure API keys"
            >
              <span style={{ display: 'flex', flexShrink: 0, width: 18, height: 18, alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getProviderIcon(m.provider, 18) }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.displayName}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{m.providerLabel}</span>
              </div>
              <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, border: '1px solid rgba(167,139,250,0.3)', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>🔒 PRO</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── PROFILE TAB ────────────────────────────────────────────── */
function ProfileTab() {
  const { user, updateUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const saveName = async () => {
    setSaving(true);
    try {
      await api.patch('/user/me', { name });
      updateUser({ name });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.new) return toast.error('Fill all fields');
    if (pwForm.new !== pwForm.confirm) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await api.patch('/user/me/password', { currentPassword: pwForm.current, newPassword: pwForm.new });
      toast.success('Password changed!');
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setChangingPw(false); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return toast.error('Type DELETE to confirm');
    try {
      await api.delete('/user/me', { data: { confirmation: 'DELETE' } });
      logout();
      window.location.href = '/';
    } catch { toast.error('Failed to delete account'); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Profile</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Manage your account details</p>

      <Section title="Display Name">
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
          />
          <Button onClick={saveName} loading={saving} size="sm">Save</Button>
        </div>
      </Section>

      <Section title="Email Address">
        <div style={{ padding: '9px 14px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.email}
          {user?.googleId && <Badge variant="teal" size="sm">via Google</Badge>}
          <Badge variant="green" size="sm">✓ Verified</Badge>
        </div>
      </Section>

      {!user?.googleId && (
        <Section title="Change Password">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input label="Current password" type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
            <Input label="New password" type="password" value={pwForm.new} onChange={e => setPwForm({ ...pwForm, new: e.target.value })} />
            <Input label="Confirm new password" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
            <Button variant="secondary" onClick={changePassword} loading={changingPw} size="sm">Update Password</Button>
          </div>
        </Section>
      )}

      <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: 18, marginTop: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', margin: '0 0 6px' }}>⚠ Danger Zone</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>Permanently delete your account and all data. This cannot be undone.</p>
        <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Delete Account</Button>
      </div>

      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 400, width: '100%' }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: 12 }}>Delete Account?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>This will permanently delete all your conversations, settings, and data. Type <strong>DELETE</strong> to confirm.</p>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type DELETE here"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="danger" fullWidth onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'}>Delete Forever</Button>
                <Button variant="secondary" fullWidth onClick={() => setDeleteModal(false)}>Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── SUBSCRIPTION TAB ───────────────────────────────────────── */
function SubscriptionTab() {
  const proModels = MODEL_REGISTRY.filter(m => m.isPro);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Subscription</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Manage your MirraSync plan</p>

      <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 32 }}>🆓</span>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-teal)', margin: 0 }}>Free Plan</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>All 24 AI models · Unlimited messages · Full history</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Feature', 'Guest', 'Free ✓', 'Pro (Soon)'].map(h => (
              <th key={h} style={{ padding: '10px 14px', background: 'var(--bg-overlay)', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['Messages', '5 total', 'Unlimited', 'Unlimited'],
            ['Models', '3 max', '24 models', '32+ models'],
            ['Active Models', '3 max', '10 max', 'Unlimited'],
            ['Chat History', '✗', '✓', '✓'],
            ['File Uploads', '✗', '✓', '✓'],
            ['Voice Input', '✗', '✓', '✓'],
            ['Custom API Keys', '✗', '✓', '✓'],
            ['Priority Support', '✗', '✗', '✓'],
          ].map(([feat, guest, free, pro]) => (
            <tr key={feat} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '9px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{feat}</td>
              <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{guest}</td>
              <td style={{ padding: '9px 14px', color: 'var(--accent-teal)', fontWeight: 600 }}>{free}</td>
              <td style={{ padding: '9px 14px', color: 'var(--text-secondary)' }}>{pro}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pro Models Preview */}
      <Section title="Pro Models (included in Pro plan)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
          {proModels.map(m => (
            <div key={m.id} style={{ padding: '10px 14px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16, alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getProviderIcon(m.provider, 16) }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.displayName}</span>
              <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>PRO ✓</span>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ marginTop: 12, padding: '16px 20px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>MirraSync Pro</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Priority support, exclusive models, team features</p>
        </div>
        <button style={{ padding: '9px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'default', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Coming Soon
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{title}</h4>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>{subtitle}</p>}
      <div style={{ marginTop: subtitle ? 0 : 10 }}>{children}</div>
    </div>
  );
}

function CustomDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 14px', background: 'var(--bg-overlay)',
          border: `1px solid ${open ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14,
          fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'border-color 0.2s ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{selected.flag}</span>
          {selected.label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', zIndex: 50, boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden', transformOrigin: 'top',
            }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '9px 14px', background: value === opt.value ? 'var(--accent-teal-dim)' : 'transparent',
                  border: 'none', color: value === opt.value ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.1s ease',
                }}
                onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18 }}>{opt.flag}</span>
                {opt.label}
                {value === opt.value && <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── LOGS TAB ────────────────────────────────────────────── */
function LogsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>System Logs</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>View backend server logs (Admin Only)</p>
      
      <div style={{ background: 'var(--bg-overlay)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={16} color="var(--accent-teal)" /> Log Viewer
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          The server logs and error traces are available via the backend API. Clicking the button below will open the raw logs in a new browser tab.
        </p>
        <Button variant="secondary" onClick={() => window.open('/admin/logs', '_blank')}>
          Open Logs Tab
        </Button>
      </div>
    </div>
  );
}
