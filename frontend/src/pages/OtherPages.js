// ─── HISTORY PAGE ─────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useChatStore from '../stores/chatStore';
import useUIStore from '../stores/uiStore';
import Sidebar from '../components/layout/Sidebar';
import { Button, Spinner, Trash, ChevronLeft, Search } from '../components/ui';
import api from '../lib/api';
import { LOGO_URL, MODEL_REGISTRY, getProviderIcon, getModelIcon } from '../lib/modelRegistry';
import ChatbotWidget from '../components/ChatbotWidget';

export function HistoryPage() {
  const navigate = useNavigate();
  const { conversations, loadConversations, deleteConversation } = useChatStore();
  const { sidebarOpen } = useUIStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = conversations.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const deleteSelected = async () => {
    try {
      await api.delete('/conversations', { data: { ids: [...selected] } });
      await loadConversations();
      setSelected(new Set());
      toast.success(`${selected.size} conversations deleted`);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {sidebarOpen && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <button onClick={() => navigate('/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', padding: 0 }}>
              <ChevronLeft size={16} /> Back to Chat
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Chat History</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={14} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            {selected.size > 0 && (
              <Button variant="danger" size="sm" onClick={deleteSelected}>Delete {selected.size} selected</Button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{search ? 'No conversations found' : 'No conversations yet'}</p>
              {!search && <Button onClick={() => navigate('/chat')} style={{ marginTop: 16 }}>Start Chatting</Button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {filtered.map(conv => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  style={{ background: 'var(--bg-surface)', border: `1px solid ${selected.has(conv.id) ? 'var(--accent-teal)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', padding: '16px', cursor: 'pointer', transition: 'all var(--transition-fast)', position: 'relative' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {conv.pinned && '📌 '}{conv.title || 'New Chat'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(conv.id)} style={{ width: 18, height: 18, borderRadius: 3, border: `1px solid ${selected.has(conv.id) ? 'var(--accent-teal)' : 'var(--border-default)'}`, background: selected.has(conv.id) ? 'var(--accent-teal)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected.has(conv.id) && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
                      </button>
                      <button onClick={() => deleteConversation(conv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}>
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>
                  {conv.messages?.[0] && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.messages[0].content}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array.isArray(conv.modelsUsed) && conv.modelsUsed.slice(0, 4).map((_, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-teal)', opacity: 0.6 + i * 0.1 }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE (standalone route, opens modal in chat) ─────
export function SettingsPage() {
  const navigate = useNavigate();
  const { openSettings } = useUIStore();

  useEffect(() => {
    navigate('/chat');
    setTimeout(() => openSettings(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ─── LANDING PAGE ──────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const models = [
    { name: 'GPT-5', id: 'github-gpt-5', provider: 'github_models', label: 'GitHub Models', color: '#10a37f' },
    { name: 'Gemini 2.5 Flash', id: 'google-gemini-25-flash', provider: 'google_ai', label: 'Google AI', color: '#4285f4' },
    { name: 'Kimi K2', id: 'groq-kimi-k2', provider: 'groq', label: 'Groq', color: '#f55036' },
    { name: 'DeepSeek R1', id: 'github-deepseek-r1', provider: 'github_models', label: 'GitHub', color: '#4a90d9' },
    { name: 'Grok 3', id: 'github-grok-3', provider: 'github_models', label: 'GitHub', color: '#1d9bf0' },
    { name: 'Llama 4 Scout', id: 'groq-llama4-scout', provider: 'groq', label: 'Groq', color: '#f55036' },
    { name: 'Command A', id: 'cohere-command-a-reasoning', provider: 'cohere', label: 'Cohere', color: '#39594d' },
    { name: 'Mistral Large', id: 'mistral-large', provider: 'mistral', label: 'Mistral', color: '#ff7000' },
    { name: 'Qwen3 Coder', id: 'openrouter-qwen3-coder', provider: 'openrouter', label: 'OpenRouter', color: '#7c3aed' },
    { name: 'GPT-OSS 120B', id: 'cerebras-gpt-oss-120b', provider: 'cerebras', label: 'Cerebras', color: '#ff6b35' },
    // Pro
    { name: 'GPT-4o', id: 'pro-gpt4o', provider: 'openai', label: 'OpenAI', color: '#10a37f', isPro: true },
    { name: 'Claude 4 Sonnet', id: 'pro-claude4s', provider: 'anthropic', label: 'Anthropic', color: '#d4a574', isPro: true },
    { name: 'Gemini 2.5 Pro', id: 'pro-gemini25p', provider: 'google_ai', label: 'Google', color: '#4285f4', isPro: true },
    { name: 'Llama 4 Maverick', id: 'pro-llama4m', provider: 'meta', label: 'Meta', color: '#0668E1', isPro: true },
  ];

  // Animated SVGs for features
  const featureSvgs = {
    sync: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="#00d4aa" stroke-width="2" opacity="0.3"/><circle cx="20" cy="20" r="12" stroke="#00d4aa" stroke-width="2" opacity="0.5"/><circle cx="20" cy="20" r="6" fill="#00d4aa" opacity="0.8"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/></circle><path d="M8 20h24M20 8v24" stroke="#00d4aa" stroke-width="1.5" opacity="0.4"/></svg>`,
    models: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="14" height="14" rx="3" fill="#7c3aed" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/></rect><rect x="22" y="4" width="14" height="14" rx="3" fill="#0ea5e9" opacity="0.6"><animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/></rect><rect x="4" y="22" width="14" height="14" rx="3" fill="#f59e0b" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></rect><rect x="22" y="22" width="14" height="14" rx="3" fill="#00d4aa" opacity="0.6"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></rect></svg>`,
    key: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="14" cy="20" r="8" stroke="#f59e0b" stroke-width="2" fill="none"/><line x1="22" y1="20" x2="36" y2="20" stroke="#f59e0b" stroke-width="2"/><line x1="30" y1="16" x2="30" y2="24" stroke="#f59e0b" stroke-width="2"/><line x1="34" y1="16" x2="34" y2="24" stroke="#f59e0b" stroke-width="2"/><circle cx="14" cy="20" r="3" fill="#f59e0b" opacity="0.5"><animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
    vision: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="20" rx="16" ry="10" stroke="#3b82f6" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="5" stroke="#3b82f6" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="2" fill="#3b82f6"><animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
    voice: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="16" y="6" width="8" height="18" rx="4" stroke="#06b6d4" stroke-width="2" fill="none"/><path d="M10 22c0 5.5 4.5 10 10 10s10-4.5 10-10" stroke="#06b6d4" stroke-width="2" fill="none"/><line x1="20" y1="32" x2="20" y2="36" stroke="#06b6d4" stroke-width="2"/><line x1="14" y1="12" x2="26" y2="12" stroke="#06b6d4" stroke-width="1" opacity="0.5"><animate attributeName="x1" values="16;14;16" dur="0.8s" repeatCount="indefinite"/></line></svg>`,
    clean: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M20 4l3 8h8l-6.5 5 2.5 8L20 19l-7 6 2.5-8L9 12h8l3-8z" stroke="#f47200" stroke-width="2" fill="none"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></path><circle cx="20" cy="20" r="3" fill="#f47200" opacity="0.4"><animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
  };

  const features = [
    { svg: featureSvgs.sync, title: 'Parallel AI Sync', desc: 'Run up to 10 models on the same prompt simultaneously and compare answers side by side.', gradient: 'linear-gradient(135deg, #00d4aa15, #0ea5e920)' },
    { svg: featureSvgs.models, title: '32 Free & Pro Models', desc: 'Access 24 free models from 8 providers. Upgrade to Pro for GPT-4o, Claude 4 & more.', gradient: 'linear-gradient(135deg, #7c3aed15, #ec489920)' },
    { svg: featureSvgs.key, title: 'Bring Your Keys', desc: 'Add your own API keys to unlock higher rate limits and exclusive models.', gradient: 'linear-gradient(135deg, #f59e0b15, #ef444420)' },
    { svg: featureSvgs.vision, title: 'Vision & Files', desc: 'Attach images, PDFs, documents and more. Vision-enabled models will analyze them.', gradient: 'linear-gradient(135deg, #3b82f615, #8b5cf620)' },
    { svg: featureSvgs.voice, title: 'Voice Input', desc: 'Speak your prompts. Real-time transcription, no setup needed.', gradient: 'linear-gradient(135deg, #06b6d415, #10b98120)' },
    { svg: featureSvgs.clean, title: 'Prompt Cleaner', desc: 'AI rewrites your prompt for clarity before sending. See the diff.', gradient: 'linear-gradient(135deg, #f4720015, #f5503620)' },
  ];

  const faqs = [
    { q: 'How is MirraSync different from using each AI separately?', a: 'MirraSync lets you send one prompt to multiple AI models at once and compare their responses side-by-side. Instead of switching between tabs, you see all answers in a single view.' },
    { q: 'Can I choose which AI models to use?', a: 'Yes! Select from 24 free models (32+ with Pro) and activate up to 10 simultaneously. Guests can use up to 3 models at once.' },
    { q: 'How many messages do I get?', a: 'Guests get 5 free messages. Signed-up users get 20 chats per day with all 24 models. Pro subscribers get unlimited everything.' },
    { q: 'What is MirraSync Pro?', a: 'Pro unlocks premium models like GPT-4o, Claude 4, Gemini 2.5 Pro. Unlimited chats, unlimited active model slots, and priority support. Coming soon!' },
    { q: 'Is my data private?', a: 'Yes. API keys are AES-256 encrypted. We never log or share your conversations. Delete your data at any time.' },
    { q: 'Do I need API keys?', a: 'No! All 24 base models work without any API keys. Optionally bring your own keys for higher rate limits.' },
  ];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const freeModels = MODEL_REGISTRY.filter(m => !m.isPro);
  const proModels = MODEL_REGISTRY.filter(m => m.isPro);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0ff', overflow: 'hidden', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '50%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 5vw', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO_URL} alt="MirraSync" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
        </div>
        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '4px 6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['Models', 'Features', 'Pricing', 'FAQ', 'Contact'].map(item => (
            <button key={item} onClick={() => scrollTo(item.toLowerCase())} style={{ background: 'none', border: 'none', color: '#b0b0d0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", padding: '7px 14px', borderRadius: 20, transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#00d4aa'; e.currentTarget.style.background = 'rgba(0,212,170,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#b0b0d0'; e.currentTarget.style.background = 'none'; }}
            >{item}</button>
          ))}
        </div>
        <div className="landing-nav-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="landing-nav-signin" onClick={() => navigate('/login')} style={{ padding: '7px 18px', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#b0b0d0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Sign In</button>
          <button className="landing-nav-get-started" onClick={() => navigate('/signup')} style={{ padding: '7px 18px', background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 2px 12px rgba(0,212,170,0.2)' }}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 5vw 80px', maxWidth: 900, margin: '0 auto' }}>
        <motion.div className="landing-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'inline-block', padding: '5px 16px', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#00d4aa', marginBottom: 24, letterSpacing: '0.5px' }}>
            ✦ 32 AI MODELS · 12 PROVIDERS · 100% FREE
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, color: '#f0f0ff', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Run Every AI.<br />
            <span style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>One Prompt.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#b0b0d0', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 36px' }}>
            Compare GPT-5, Gemini, Grok, DeepSeek and 30+ models simultaneously. See which AI gives the best answer.
          </p>
          <div className="landing-hero-buttons" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', border: 'none', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 24px rgba(0,212,170,0.3)' }}>Start for Free →</button>
            <button onClick={() => navigate('/chat')} style={{ padding: '14px 36px', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, color: '#b0b0d0', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Try Without Login</button>
          </div>
          <p style={{ fontSize: 12, color: '#7878a0', marginTop: 14 }}>No credit card required · Unlimited messages · Sign up for 24 models</p>
        </motion.div>
      </section>

      {/* Model cards marquee with SVG icons */}
      <section id="models" style={{ overflow: 'hidden', position: 'relative', zIndex: 1, padding: '0 0 40px', maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
        <div style={{ display: 'flex', gap: 10, animation: 'marquee 60s linear infinite', width: 'max-content' }}>
          {[...models, ...models, ...models].map((m, i) => (
            <motion.div key={i} whileHover={{ scale: 1.08, boxShadow: `0 0 20px ${m.color}40` }}
              style={{ padding: '10px 16px', background: m.isPro ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${m.isPro ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'default', transition: 'box-shadow 0.3s ease' }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: getModelIcon(m.id, m.provider, 16) }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff' }}>{m.name}</span>
              <span style={{ fontSize: 11, color: '#7878a0' }}>{m.label}</span>
              {m.isPro && <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px', borderRadius: 4 }}>PRO</span>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Model Details Grid */}
      <section style={{ padding: '20px 5vw 60px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', color: '#f0f0ff', marginBottom: 6 }}>All Models at a Glance</h2>
          <p style={{ textAlign: 'center', color: '#7878a0', marginBottom: 28, fontSize: 14 }}>24 free models + 8 Pro models across 12 providers</p>
        </motion.div>
        <div className="landing-model-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {freeModels.slice(0, 12).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: getModelIcon(m.id, m.provider, 16) }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.displayName}</div>
                <div style={{ fontSize: 10, color: '#7878a0' }}>{m.providerLabel}</div>
              </div>
              <span style={{ fontSize: 9, color: '#00d4aa', fontWeight: 700 }}>FREE</span>
            </motion.div>
          ))}
          {proModels.slice(0, 4).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.05 }}
              style={{ padding: '10px 14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: getProviderIcon(m.provider, 16) }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.displayName}</div>
                <div style={{ fontSize: 10, color: '#7878a0' }}>{m.providerLabel}</div>
              </div>
              <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, border: '1px solid rgba(167,139,250,0.3)', padding: '1px 5px', borderRadius: 3 }}>PRO</span>
            </motion.div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#7878a0', fontSize: 12, marginTop: 12 }}>+ {freeModels.length - 12} more free models and {proModels.length - 4} more Pro models</p>
      </section>

      {/* Features grid */}
      <section id="features" style={{ padding: '40px 5vw 80px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, textAlign: 'center', color: '#f0f0ff', marginBottom: 8 }}>Everything you need</h2>
          <p style={{ textAlign: 'center', color: '#7878a0', marginBottom: 48, fontSize: 16 }}>Built for power users who want the best answers, instantly</p>
        </motion.div>
        <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}
              style={{ padding: '28px 24px', background: f.gradient, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, cursor: 'default', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: f.gradient, filter: 'blur(40px)', opacity: 0.5 }} />
              <div style={{ marginBottom: 14, position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: f.svg }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 8, position: 'relative', zIndex: 1 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#b0b0d0', lineHeight: 1.7, margin: 0, position: 'relative', zIndex: 1 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" style={{ padding: '60px 5vw 80px', maxWidth: 1000, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textAlign: 'center', color: '#f0f0ff', marginBottom: 8 }}>Compare Plans</h2>
          <p style={{ textAlign: 'center', color: '#7878a0', marginBottom: 36, fontSize: 14 }}>Choose the right plan for your needs</p>
        </motion.div>
        <div className="landing-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Guest', price: 'Free', color: '#7878a0', features: ['Unlimited messages (rate limited)', '10 models available', '3 active models', 'No login required', 'No chat history', 'No file uploads'] },
            { name: 'Free Account', price: '$0/mo', color: '#00d4aa', highlight: true, features: ['Unlimited messages (higher limits)', '24 models available', '10 active models', 'Full chat history', 'File & image uploads', 'Voice input', 'Custom API keys', 'Unlock Pro models with own key'] },
            { name: 'Pro', price: 'Coming Soon', color: '#a78bfa', features: ['Unlimited messages (highest limits)', 'All Free features included', '32+ models (GPT-4o, Claude 4...)', '20 active models', 'Full chat history', 'File & image uploads', 'Voice input', 'Custom API keys', 'Priority support', 'Team features', 'Early access to new models'] },
          ].map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '28px 24px', background: plan.highlight ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${plan.highlight ? 'rgba(0,212,170,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
              {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)' }} />}
              <h3 style={{ fontSize: 18, fontWeight: 800, color: plan.color, margin: '0 0 4px' }}>{plan.name}</h3>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#f0f0ff', margin: '0 0 20px' }}>{plan.price}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ fontSize: 13, color: '#b0b0d0', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: plan.color, fontSize: 12 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => plan.name === 'Guest' ? navigate('/chat') : plan.name === 'Pro' ? null : navigate('/signup')}
                style={{ width: '100%', marginTop: 20, padding: '10px', background: plan.highlight ? 'linear-gradient(135deg, #00d4aa, #0ea5e9)' : 'rgba(255,255,255,0.06)', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: plan.highlight ? '#fff' : '#b0b0d0', fontSize: 14, fontWeight: 700, cursor: plan.name === 'Pro' ? 'default' : 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                {plan.name === 'Guest' ? 'Try Now' : plan.name === 'Pro' ? '💎 Coming Soon' : 'Sign Up Free →'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '40px 5vw 60px', maxWidth: 800, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, textAlign: 'center', color: '#f0f0ff', marginBottom: 8 }}>Frequently Asked Questions</h2>
          <p style={{ textAlign: 'center', color: '#7878a0', marginBottom: 36, fontSize: 14 }}>Everything you need to know</p>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f0f0ff', fontSize: 14, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", textAlign: 'left' }}>
                {faq.q}
                <span style={{ fontSize: 14, color: '#7878a0', transition: 'transform 0.2s ease', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0, marginLeft: 12 }}>▼</span>
              </button>
              <motion.div initial={false} animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                <p style={{ padding: '0 20px 16px', fontSize: 13, color: '#b0b0d0', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '60px 5vw', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#f0f0ff', marginBottom: 12 }}>Start syncing your AIs today</h2>
          <p style={{ color: '#7878a0', marginBottom: 28, fontSize: 16 }}>Free forever. No credit card. 32 models ready to go.</p>
          <button onClick={() => navigate('/signup')} style={{ padding: '14px 48px', background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', border: 'none', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 24px rgba(0,212,170,0.3)' }}>
            Create Free Account →
          </button>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#b0b0d0', margin: '0 0 4px' }}>📧 Email</p>
              <a href="mailto:support@mirrasync.com" style={{ color: '#00d4aa', fontSize: 13, textDecoration: 'none' }}>support@mirrasync.com</a>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#b0b0d0', margin: '0 0 4px' }}>💬 Response Time</p>
              <span style={{ color: '#7878a0', fontSize: 13 }}>Within 24 hours</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#b0b0d0', margin: '0 0 4px' }}>🌍 Availability</p>
              <span style={{ color: '#7878a0', fontSize: 13 }}>Worldwide, 24/7</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 5vw 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="landing-footer-columns" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img src={LOGO_URL} alt="MirraSync" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <span style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
            </div>
            <p style={{ fontSize: 12, color: '#7878a0', lineHeight: 1.6 }}>Sync Every Mind. One Prompt.<br />Compare AI models side by side.</p>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Product</h4>
            {[{l:'Models',id:'models'},{l:'Features',id:'features'},{l:'Pricing',id:'pricing'}].map(item => (
              <button key={item.l} onClick={() => scrollTo(item.id)} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#7878a0', fontFamily: "'Space Grotesk', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'} onMouseLeave={e => e.currentTarget.style.color = '#7878a0'}
              >{item.l}</button>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Support</h4>
            {[{l:'FAQ',id:'faq'},{l:'Contact',id:'contact'}].map(item => (
              <button key={item.l} onClick={() => scrollTo(item.id)} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: 13, color: '#7878a0', fontFamily: "'Space Grotesk', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'} onMouseLeave={e => e.currentTarget.style.color = '#7878a0'}
              >{item.l}</button>
            ))}
            <a href="mailto:support@mirrasync.com" style={{ display: 'block', fontSize: 13, color: '#7878a0', textDecoration: 'none', padding: '4px 0' }}
              onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'} onMouseLeave={e => e.currentTarget.style.color = '#7878a0'}
            >Email Us</a>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Legal</h4>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#/" onClick={e => e.preventDefault()} style={{ display: 'block', fontSize: 13, color: '#7878a0', textDecoration: 'none', padding: '4px 0' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'} onMouseLeave={e => e.currentTarget.style.color = '#7878a0'}
              >{l}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#7878a0' }}>© {new Date().getFullYear()} MirraSync · Sync Every Mind. One Prompt.</span>
          <span style={{ fontSize: 12, color: '#7878a0' }}>Made with 💚 for everyone</span>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ position: 'fixed', bottom: 90, left: 24, zIndex: 9000, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#b0b0d0', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.2s ease' }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}

export default HistoryPage;

