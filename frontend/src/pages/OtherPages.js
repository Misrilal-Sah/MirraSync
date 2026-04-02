// â”€â”€â”€ HISTORY PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            <button onClick={() => navigate('/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0 }}>
              <ChevronLeft size={16} /> Back to Chat
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Chat History</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={14} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }} />
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
              <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ’¬</div>
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
                      {conv.pinned && 'ðŸ“Œ '}{conv.title || 'New Chat'}
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

// â”€â”€â”€ SETTINGS PAGE (standalone route, opens modal in chat) â”€â”€â”€â”€â”€
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

// â”€â”€â”€ LANDING PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      setNavScrolled(window.scrollY > 20);
    };
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
    { name: 'Qwen3 Coder', id: 'openrouter-qwen3-coder', provider: 'openrouter', label: 'OpenRouter', color: '#8b5cf6' },
    { name: 'GPT-OSS 120B', id: 'cerebras-gpt-oss-120b', provider: 'cerebras', label: 'Cerebras', color: '#ff6b35' },
    // Pro
    { name: 'GPT-4o', id: 'pro-gpt4o', provider: 'openai', label: 'OpenAI', color: '#10a37f', isPro: true },
    { name: 'Claude 4 Sonnet', id: 'pro-claude4s', provider: 'anthropic', label: 'Anthropic', color: '#d4a574', isPro: true },
    { name: 'Gemini 2.5 Pro', id: 'pro-gemini25p', provider: 'google_ai', label: 'Google', color: '#4285f4', isPro: true },
    { name: 'Llama 4 Maverick', id: 'pro-llama4m', provider: 'meta', label: 'Meta', color: '#0668E1', isPro: true },
  ];

  // Animated SVGs for features
  const featureSvgs = {
    sync: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="#00e5c8" stroke-width="1.5" opacity="0.3"/><circle cx="20" cy="20" r="12" stroke="#00e5c8" stroke-width="1.5" opacity="0.5"/><circle cx="20" cy="20" r="6" fill="#00e5c8" opacity="0.85"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/></circle><path d="M8 20h24M20 8v24" stroke="#00e5c8" stroke-width="1.5" opacity="0.4"/></svg>`,
    models: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="14" height="14" rx="3" fill="#8b5cf6" opacity="0.65"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/></rect><rect x="22" y="4" width="14" height="14" rx="3" fill="#4f8ef7" opacity="0.65"><animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/></rect><rect x="4" y="22" width="14" height="14" rx="3" fill="#f59e0b" opacity="0.65"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></rect><rect x="22" y="22" width="14" height="14" rx="3" fill="#00e5c8" opacity="0.65"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></rect></svg>`,
    key: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="14" cy="20" r="8" stroke="#f59e0b" stroke-width="2" fill="none"/><line x1="22" y1="20" x2="36" y2="20" stroke="#f59e0b" stroke-width="2"/><line x1="30" y1="16" x2="30" y2="24" stroke="#f59e0b" stroke-width="2"/><line x1="34" y1="16" x2="34" y2="24" stroke="#f59e0b" stroke-width="2"/><circle cx="14" cy="20" r="3" fill="#f59e0b" opacity="0.5"><animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
    vision: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="20" rx="16" ry="10" stroke="#4f8ef7" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="5" stroke="#4f8ef7" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="2" fill="#4f8ef7"><animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
    voice: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="16" y="6" width="8" height="18" rx="4" stroke="#00e5c8" stroke-width="2" fill="none"/><path d="M10 22c0 5.5 4.5 10 10 10s10-4.5 10-10" stroke="#00e5c8" stroke-width="2" fill="none"/><line x1="20" y1="32" x2="20" y2="36" stroke="#00e5c8" stroke-width="2"/><line x1="16" y1="12" x2="24" y2="12" stroke="#00e5c8" stroke-width="1" opacity="0.5"><animate attributeName="x1" values="16;14;16" dur="0.8s" repeatCount="indefinite"/></line></svg>`,
    clean: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M20 4l3 8h8l-6.5 5 2.5 8L20 19l-7 6 2.5-8L9 12h8l3-8z" stroke="#ec4899" stroke-width="2" fill="none"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></path><circle cx="20" cy="20" r="3" fill="#ec4899" opacity="0.4"><animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
  };

  const features = [
    { svg: featureSvgs.sync, title: 'Parallel AI Sync', desc: 'Run up to 10 models on the same prompt simultaneously and compare answers side by side.', topBorder: 'linear-gradient(90deg, #00e5c8, #4f8ef7)' },
    { svg: featureSvgs.models, title: '32 Free & Pro Models', desc: 'Access 24 free models from 8 providers. Upgrade to Pro for GPT-4o, Claude 4 & more.', topBorder: 'linear-gradient(90deg, #8b5cf6, #ec4899)' },
    { svg: featureSvgs.key, title: 'Bring Your Keys', desc: 'Add your own API keys to unlock higher rate limits and exclusive models.', topBorder: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
    { svg: featureSvgs.vision, title: 'Vision & Files', desc: 'Attach images, PDFs, documents and more. Vision-enabled models will analyze them.', topBorder: 'linear-gradient(90deg, #4f8ef7, #8b5cf6)' },
    { svg: featureSvgs.voice, title: 'Voice Input', desc: 'Speak your prompts. Real-time transcription, no setup needed.', topBorder: 'linear-gradient(90deg, #00e5c8, #22c55e)' },
    { svg: featureSvgs.clean, title: 'Prompt Cleaner', desc: 'AI rewrites your prompt for clarity before sending. See the diff.', topBorder: 'linear-gradient(90deg, #ec4899, #f59e0b)' },
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
    <div style={{ minHeight: '100vh', background: '#050509', color: '#f0f0ff', overflowX: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", position: 'relative' }}>

      {/* â”€â”€ Aurora Background â”€â”€ */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      {/* â”€â”€ Floating Navbar â”€â”€ */}
      <nav style={{
        position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', maxWidth: 1100, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
        background: navScrolled ? 'rgba(5,5,9,0.88)' : 'rgba(5,5,9,0.6)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: `1px solid ${navScrolled ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: navScrolled ? '0 4px 32px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <img src={LOGO_URL} alt="MirraSync" style={{ width: 30, height: 30, borderRadius: '50%' }} />
          <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg, #00e5c8, #4f8ef7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.3px' }}>MirraSync</span>
        </div>
        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {['Models', 'Features', 'Pricing', 'FAQ', 'Contact'].map(item => (
            <button key={item} onClick={() => scrollTo(item.toLowerCase())}
              style={{ background: 'none', border: 'none', color: '#a8a8cc', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '7px 13px', borderRadius: 10, transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#00e5c8'; e.currentTarget.style.background = 'rgba(0,229,200,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#a8a8cc'; e.currentTarget.style.background = 'none'; }}
            >{item}</button>
          ))}
        </div>
        <div className="landing-nav-auth" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button className="landing-nav-signin" onClick={() => navigate('/login')}
            style={{ padding: '7px 15px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#a8a8cc', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f0f0ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#a8a8cc'; }}
          >Sign In</button>
          <button className="landing-nav-get-started" onClick={() => navigate('/signup')}
            style={{ padding: '7px 16px', background: 'linear-gradient(135deg, #00e5c8, #4f8ef7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 0 16px rgba(0,229,200,0.18)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,200,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,229,200,0.18)'; e.currentTarget.style.transform = 'none'; }}
          >Get Started Free</button>
        </div>
      </nav>

      {/* â”€â”€ Hero â”€â”€ */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 'calc(86px + 5vw) 5vw 80px', maxWidth: 960, margin: '0 auto' }}>
        <motion.div className="landing-hero" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.18)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#00e5c8', marginBottom: 28, letterSpacing: '0.4px' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5c8', boxShadow: '0 0 8px #00e5c8', display: 'inline-block', animation: 'aurora-pulse 2s ease-in-out infinite' }} />
            32 AI MODELS · 12 PROVIDERS · 100% FREE
          </motion.div>

          <h1 style={{ fontSize: 'clamp(40px, 7vw, 82px)', fontWeight: 900, color: '#f0f0ff', margin: '0 0 24px', lineHeight: 1.06, letterSpacing: '-2.5px' }}>
            Run Every AI.<br />
            <span style={{ background: 'linear-gradient(135deg, #00e5c8 0%, #4f8ef7 38%, #8b5cf6 68%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              One Prompt.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#a8a8cc', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 40px' }}>
            Compare GPT-5, Gemini, Grok, DeepSeek and 30+ models simultaneously.<br />See which AI gives the best answer — free forever.
          </p>

          <div className="landing-hero-buttons" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')}
              style={{ padding: '14px 38px', background: 'linear-gradient(135deg, #00e5c8, #4f8ef7)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 32px rgba(0,229,200,0.25)', transition: 'all 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,229,200,0.38)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,229,200,0.25)'; }}
            >Start for Free →</button>
            <button onClick={() => navigate('/chat')}
              style={{ padding: '14px 38px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#a8a8cc', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a8a8cc'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >Try Without Login</button>
          </div>
          <p style={{ fontSize: 12, color: '#66669a', marginTop: 16, letterSpacing: '0.2px' }}>No credit card required · Unlimited messages · Sign up for 24 models</p>
        </motion.div>
      </section>

      {/* â”€â”€ Model Marquee â”€â”€ */}
      <section id="models" style={{ overflow: 'hidden', position: 'relative', zIndex: 1, padding: '0 0 60px', maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)' }}>
        <div style={{ display: 'flex', gap: 10, animation: 'marquee 65s linear infinite', width: 'max-content' }}>
          {[...models, ...models, ...models].map((m, i) => (
            <motion.div key={i} whileHover={{ scale: 1.06, boxShadow: `0 0 28px ${m.color}55` }}
              style={{ padding: '10px 18px', background: m.isPro ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.025)', border: `1px solid ${m.isPro ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'default', transition: 'box-shadow 0.3s ease' }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: getModelIcon(m.id, m.provider, 16) }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff' }}>{m.name}</span>
              <span style={{ fontSize: 11, color: '#66669a' }}>{m.label}</span>
              {m.isPro && <span style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 700, border: '1px solid rgba(139,92,246,0.3)', padding: '1px 6px', borderRadius: 6 }}>PRO</span>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ Model Grid â”€â”€ */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, textAlign: 'center', color: '#f0f0ff', marginBottom: 6, letterSpacing: '-0.5px' }}>All Models at a Glance</h2>
          <p style={{ textAlign: 'center', color: '#66669a', marginBottom: 32, fontSize: 14 }}>24 free models + 8 Pro models across 12 providers</p>
        </motion.div>
        <div className="landing-model-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {freeModels.slice(0, 12).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,200,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,229,200,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: getModelIcon(m.id, m.provider, 16) }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.displayName}</div>
                <div style={{ fontSize: 10, color: '#66669a' }}>{m.providerLabel}</div>
              </div>
              <span style={{ fontSize: 9, color: '#00e5c8', fontWeight: 800, letterSpacing: '0.3px' }}>FREE</span>
            </motion.div>
          ))}
          {proModels.slice(0, 4).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.05 }}
              style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: getProviderIcon(m.provider, 16) }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.displayName}</div>
                <div style={{ fontSize: 10, color: '#66669a' }}>{m.providerLabel}</div>
              </div>
              <span style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 700, border: '1px solid rgba(139,92,246,0.3)', padding: '1px 5px', borderRadius: 4 }}>PRO</span>
            </motion.div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#66669a', fontSize: 12, marginTop: 12 }}>+ {freeModels.length - 12} more free models and {proModels.length - 4} more Pro models</p>
      </section>

      {/* â”€â”€ Features â”€â”€ */}
      <section id="features" style={{ padding: '40px 5vw 100px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 50px)', fontWeight: 900, textAlign: 'center', color: '#f0f0ff', marginBottom: 10, letterSpacing: '-1.5px' }}>Everything you need</h2>
          <p style={{ textAlign: 'center', color: '#a8a8cc', marginBottom: 56, fontSize: 16, lineHeight: 1.7 }}>Built for power users who want the best answers, instantly</p>
        </motion.div>
        <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -4 }}
              style={{ padding: '28px 26px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, cursor: 'default', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = '0 16px 52px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: f.topBorder }} />
              <div style={{ marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: f.svg }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f0ff', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: '#a8a8cc', lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ Pricing â”€â”€ */}
      <section id="pricing" style={{ padding: '60px 5vw 100px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, textAlign: 'center', color: '#f0f0ff', marginBottom: 10, letterSpacing: '-1.5px' }}>Compare Plans</h2>
          <p style={{ textAlign: 'center', color: '#a8a8cc', marginBottom: 48, fontSize: 15 }}>Choose the right plan for your needs</p>
        </motion.div>
        <div className="landing-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Guest', price: 'Free', color: '#66669a', topBorder: null, bg: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.07)', features: ['Unlimited messages (rate limited)', '10 models available', '3 active models', 'No login required', 'No chat history', 'No file uploads'] },
            { name: 'Free Account', price: '$0/mo', color: '#00e5c8', highlight: true, topBorder: 'linear-gradient(90deg, #00e5c8, #4f8ef7, #8b5cf6)', bg: 'rgba(0,229,200,0.05)', border: 'rgba(0,229,200,0.2)', features: ['Unlimited messages (higher limits)', '24 models available', '10 active models', 'Full chat history', 'File & image uploads', 'Voice input', 'Custom API keys', 'Unlock Pro models with own key'] },
            { name: 'Pro', price: 'Coming Soon', color: '#8b5cf6', topBorder: 'linear-gradient(90deg, #8b5cf6, #ec4899)', bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.18)', features: ['Unlimited messages (highest limits)', 'All Free features included', '32+ models (GPT-4o, Claude 4...)', '20 active models', 'Full chat history', 'File & image uploads', 'Voice input', 'Custom API keys', 'Priority support', 'Team features', 'Early access to new models'] },
          ].map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '28px 22px', background: plan.bg, border: `1px solid ${plan.border}`, borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
              {plan.topBorder && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: plan.topBorder }} />}
              <h3 style={{ fontSize: 15, fontWeight: 800, color: plan.color, margin: '0 0 6px', letterSpacing: '-0.2px' }}>{plan.name}</h3>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#f0f0ff', margin: '0 0 22px', letterSpacing: '-1px' }}>{plan.price}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ fontSize: 13, color: '#a8a8cc', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: plan.color, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => plan.name === 'Guest' ? navigate('/chat') : plan.name === 'Pro' ? null : navigate('/signup')}
                style={{ width: '100%', marginTop: 22, padding: '11px 0', background: plan.highlight ? 'linear-gradient(135deg, #00e5c8, #4f8ef7)' : 'rgba(255,255,255,0.05)', border: plan.highlight ? 'none' : `1px solid ${plan.border}`, borderRadius: 12, color: plan.highlight ? '#fff' : plan.color, fontSize: 14, fontWeight: 700, cursor: plan.name === 'Pro' ? 'default' : 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: plan.highlight ? '0 4px 20px rgba(0,229,200,0.22)' : 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { if (plan.name !== 'Pro') { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
              >
                {plan.name === 'Guest' ? 'Try Now' : plan.name === 'Pro' ? 'Coming Soon' : 'Sign Up Free →'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ FAQ â”€â”€ */}
      <section id="faq" style={{ padding: '40px 5vw 80px', maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, textAlign: 'center', color: '#f0f0ff', marginBottom: 10, letterSpacing: '-1.5px' }}>Frequently Asked</h2>
          <p style={{ textAlign: 'center', color: '#a8a8cc', marginBottom: 48, fontSize: 15 }}>Everything you need to know</p>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${openFaq === i ? 'rgba(0,229,200,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s ease' }}
              onMouseEnter={e => { if (openFaq !== i) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { if (openFaq !== i) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="landing-faq-item"
                style={{ width: '100%', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f0f0ff', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left', letterSpacing: '-0.2px', gap: 12 }}>
                {faq.q}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#66669a', transition: 'transform 0.22s ease, color 0.2s ease', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', color: openFaq === i ? '#00e5c8' : '#66669a' }}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <p style={{ padding: '0 22px 18px', fontSize: 13.5, color: '#a8a8cc', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ CTA / Contact â”€â”€ */}
      <section id="contact" style={{ padding: '80px 5vw', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: 680, margin: '0 auto', padding: '56px 40px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 28, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00e5c8, #4f8ef7, #8b5cf6, #ec4899)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(0,229,200,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, color: '#f0f0ff', marginBottom: 14, letterSpacing: '-2px', position: 'relative', zIndex: 1 }}>
            Start syncing your AIs
          </h2>
          <p style={{ color: '#a8a8cc', marginBottom: 36, fontSize: 16, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>Free forever. No credit card. 32 models ready to go.</p>
          <button onClick={() => navigate('/signup')}
            style={{ padding: '15px 52px', background: 'linear-gradient(135deg, #00e5c8, #4f8ef7)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 32px rgba(0,229,200,0.28)', transition: 'all 0.25s ease', position: 'relative', zIndex: 1 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 52px rgba(0,229,200,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,229,200,0.28)'; }}
          >Create Free Account →</button>
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {[
              { label: 'Email', value: 'support@mirrasync.com', href: 'mailto:support@mirrasync.com', isLink: true },
              { label: 'Response Time', value: 'Within 24 hours' },
              { label: 'Availability', value: 'Worldwide, 24/7' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#a8a8cc', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.label}</p>
                {item.isLink
                  ? <a href={item.href} style={{ color: '#00e5c8', fontSize: 13, textDecoration: 'none' }}>{item.value}</a>
                  : <span style={{ color: '#66669a', fontSize: 13 }}>{item.value}</span>
                }
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer style={{ padding: '40px 5vw 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <div className="landing-footer-columns" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img src={LOGO_URL} alt="MirraSync" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <span style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(135deg, #00e5c8, #4f8ef7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MirraSync</span>
            </div>
            <p style={{ fontSize: 12, color: '#66669a', lineHeight: 1.75 }}>Sync Every Mind. One Prompt.<br />Compare AI models side by side.</p>
          </div>
          {[
            { title: 'Product', links: [{ l: 'Models', id: 'models' }, { l: 'Features', id: 'features' }, { l: 'Pricing', id: 'pricing' }], isScroll: true },
            { title: 'Support', links: [{ l: 'FAQ', id: 'faq' }, { l: 'Contact', id: 'contact' }, { l: 'Email Us', href: 'mailto:support@mirrasync.com' }], isScroll: true },
            { title: 'Legal', links: [{ l: 'Privacy Policy' }, { l: 'Terms of Service' }, { l: 'Cookie Policy' }], isScroll: false },
          ].map((col, ci) => (
            <div key={ci}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#a8a8cc', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '1px' }}>{col.title}</h4>
              {col.links.map((link, li) => (
                link.href
                  ? <a key={li} href={link.href} style={{ display: 'block', fontSize: 13, color: '#66669a', textDecoration: 'none', padding: '5px 0', transition: 'color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.color = '#00e5c8'} onMouseLeave={e => e.currentTarget.style.color = '#66669a'}>{link.l}</a>
                  : link.id
                    ? <button key={li} onClick={() => scrollTo(link.id)} style={{ display: 'block', background: 'none', border: 'none', padding: '5px 0', cursor: 'pointer', fontSize: 13, color: '#66669a', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.color = '#00e5c8'} onMouseLeave={e => e.currentTarget.style.color = '#66669a'}>{link.l}</button>
                    : <a key={li} href="#/" onClick={e => e.preventDefault()} style={{ display: 'block', fontSize: 13, color: '#66669a', textDecoration: 'none', padding: '5px 0', transition: 'color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.color = '#00e5c8'} onMouseLeave={e => e.currentTarget.style.color = '#66669a'}>{link.l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#66669a' }}>© {new Date().getFullYear()} MirraSync · Sync Every Mind. One Prompt.</span>
          <span style={{ fontSize: 12, color: '#66669a' }}>Made with love for everyone</span>
        </div>
      </footer>

      {/* â”€â”€ Scroll to top â”€â”€ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ position: 'fixed', bottom: 90, left: 24, zIndex: 9000, width: 44, height: 44, borderRadius: '50%', background: 'rgba(5,5,9,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#a8a8cc', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,200,0.4)'; e.currentTarget.style.color = '#00e5c8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#a8a8cc'; }}
          >↑</motion.button>
        )}
      </AnimatePresence>

      <ChatbotWidget />
    </div>
  );
}

export default HistoryPage;
