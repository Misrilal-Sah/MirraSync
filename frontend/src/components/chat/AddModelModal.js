import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useChatStore from '../../stores/chatStore';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import { MODEL_REGISTRY, PROVIDERS, CATEGORIES, GUEST_FREE_IDS, GUEST_MAX_ACTIVE, USER_MAX_ACTIVE, PRO_MAX_ACTIVE, getProviderIcon, getModelIcon } from '../../lib/modelRegistry';
import { Badge, Search, X, Lock, Check } from '../ui';

export default function AddModelModal() {
  const { addModelModalOpen, closeAddModelModal } = useUIStore();
  const { activeModelIds, addModel, removeModel } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [hoveredLocked, setHoveredLocked] = useState(null);
  const [userKeys, setUserKeys] = useState([]);

  const isGuest = !user;
  const maxActive = isGuest ? GUEST_MAX_ACTIVE : USER_MAX_ACTIVE;

  // Fetch user's saved API keys to determine which Pro models can be unlocked
  useEffect(() => {
    if (user && addModelModalOpen) {
      api.get('/api-keys').then(res => setUserKeys(res.data.keys || [])).catch(() => {});
    }
  }, [user, addModelModalOpen]);

  // Check if user has a valid key for a provider
  const hasKeyForProvider = (provider) => userKeys.some(k => k.provider === provider && k.testPassed);

  const filtered = MODEL_REGISTRY.filter(m => {
    const matchSearch = !search || m.displayName.toLowerCase().includes(search.toLowerCase()) || m.providerLabel.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    const matchProvider = filterProvider === 'all' || m.provider === filterProvider;
    const matchCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchSearch && matchProvider && matchCategory;
  });

  // Determine lock state for each model
  const getModelState = (model) => {
    if (model.isPro) {
      // Pro models always require Pro subscription — never unlockable via API key
      return 'pro_locked';
    }
    if (isGuest && !GUEST_FREE_IDS.includes(model.id)) return 'login_locked';
    return 'available';
  };

  const handleToggle = (model) => {
    const state = getModelState(model);

    if (state === 'pro_locked') {
      toast('🔒 This model requires a Pro subscription', { icon: '💎', style: { borderLeftColor: '#7c3aed', borderLeftWidth: '3px' } });
      return;
    }
    if (state === 'login_locked') {
      toast('🔐 Sign in to unlock this model', { icon: '👤', style: { borderLeftColor: 'var(--accent-teal)', borderLeftWidth: '3px' } });
      return;
    }

    if (activeModelIds.includes(model.id)) {
      removeModel(model.id);
    } else {
      if (activeModelIds.length >= maxActive) {
        if (isGuest) {
          toast.error(`You can select max ${GUEST_MAX_ACTIVE} models as active. Sign in to select more!`);
        } else {
          toast.error(`You can select max ${USER_MAX_ACTIVE} active models. Upgrade to Pro for more!`);
        }
        return;
      }
      addModel(model.id);
    }
  };

  return (
    <AnimatePresence>
      {addModelModalOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeAddModelModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 780, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px' }}>Add AI Model</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    {activeModelIds.length}/{maxActive} active · {isGuest ? `${GUEST_FREE_IDS.length} models available` : `${MODEL_REGISTRY.filter(m => !m.isPro).length} models · ${MODEL_REGISTRY.filter(m => m.isPro).length} Pro`}
                  </p>
                </div>
                <button onClick={closeAddModelModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', fontSize: 20 }}>×</button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} />
                </span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
                  autoFocus
                  style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
                />
              </div>

              {/* Provider filter pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ id: 'all', label: 'All' }, ...PROVIDERS].map(p => (
                  <button key={p.id} onClick={() => setFilterProvider(p.id)}
                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${filterProvider === p.id ? 'var(--accent-teal)' : 'var(--border-subtle)'}`, background: filterProvider === p.id ? 'var(--accent-teal-dim)' : 'none', color: filterProvider === p.id ? 'var(--accent-teal)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', whiteSpace: 'nowrap', transition: 'all var(--transition-fast)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {p.id !== 'all' && <span style={{ display: 'flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getProviderIcon(p.id, 12) }} />}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <p>No models found matching "{search}"</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                  {filtered.map(model => {
                    const isActive = activeModelIds.includes(model.id);
                    const modelState = getModelState(model);
                    const isLocked = modelState !== 'available';
                    const isAtMax = !isActive && !isLocked && activeModelIds.length >= maxActive;

                    return (
                      <motion.button
                        key={model.id}
                        onClick={() => handleToggle(model)}
                        onMouseEnter={() => isLocked && setHoveredLocked(model.id)}
                        onMouseLeave={() => setHoveredLocked(null)}
                        whileHover={{ scale: (isAtMax || isLocked) ? 1 : 1.02 }}
                        whileTap={{ scale: (isAtMax || isLocked) ? 1 : 0.98 }}
                        style={{
                          background: isActive ? 'var(--accent-teal-dim)' : isLocked ? 'var(--bg-overlay)' : 'var(--bg-overlay)',
                          border: `1px solid ${isActive ? 'var(--accent-teal)' : isLocked ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px', textAlign: 'left',
                          cursor: isLocked ? 'not-allowed' : isAtMax ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.55 : isAtMax ? 0.5 : 1,
                          transition: 'all var(--transition-fast)',
                          display: 'flex', flexDirection: 'column', gap: 6,
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {/* Active checkmark */}
                        {isActive && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, background: 'var(--accent-teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={10} />
                          </div>
                        )}

                        {/* Lock icon for locked models */}
                        {isLocked && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, background: modelState === 'pro_locked' ? '#7c3aed' : 'var(--border-default)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={10} />
                          </div>
                        )}

                        {/* Hover tooltip for locked */}
                        {isLocked && hoveredLocked === model.id && (
                          <div style={{
                            position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 11,
                            color: modelState === 'pro_locked' ? '#a78bfa' : 'var(--accent-teal)',
                            whiteSpace: 'nowrap', zIndex: 10, boxShadow: 'var(--shadow-md)',
                            fontWeight: 600,
                          }}>
                            {modelState === 'pro_locked' ? (hasKeyForProvider ? '🔑 Add your API key to unlock' : '💎 Requires Pro subscription') : '🔐 Sign in to unlock'}
                          </div>
                        )}

                        {/* Provider icon + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'flex', flexShrink: 0, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: getModelIcon(model.id, model.provider, 18) }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.displayName}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{model.providerLabel}</span>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{model.description}</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                          {model.supportsVision && <Badge variant="teal" size="sm">👁 Vision</Badge>}
                          {model.supportsReasoning && <Badge variant="purple" size="sm">🧠 Reasoning</Badge>}
                          {model.isPro ? (
                            <Badge variant="purple" size="sm">💎 Pro</Badge>
                          ) : (
                            <Badge variant="green" size="sm">Free</Badge>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {activeModelIds.length} model{activeModelIds.length !== 1 ? 's' : ''} selected · max {maxActive}
                {isGuest && <span style={{ color: 'var(--accent-teal)', marginLeft: 8 }}>Sign in for more →</span>}
              </span>
              <button onClick={closeAddModelModal} style={{ padding: '8px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
