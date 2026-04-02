import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { LOGO_URL } from '../lib/modelRegistry';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 I\'m MirraSync Assistant. Ask me anything about our platform — features, pricing, models, how to get started, and more!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot', {
        message: userMsg,
        history: messages.slice(-6),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble right now. Please try again or email support@mirrasync.com.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e5c8, #0ea5e9)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,212,170,0.4)',
          fontSize: 24, color: '#fff',
        }}
      >
        {open ? '✕' : '💬'}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 90, right: 24, zIndex: 9998,
              width: 380, maxHeight: 440,
              background: '#0f0f18',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(14,165,233,0.1))',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <img src={LOGO_URL} alt="MirraSync" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff' }}>MirraSync Assistant</div>
                <div style={{ fontSize: 11, color: '#66669a' }}>Ask me about MirraSync</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5c8', boxShadow: '0 0 8px rgba(0,212,170,0.6)' }} />
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflow: 'auto', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 10,
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #00e5c8, #0ea5e9)'
                      : 'rgba(255,255,255,0.05)',
                    color: msg.role === 'user' ? '#fff' : '#d0d0f0',
                    fontSize: 13, lineHeight: 1.6,
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    alignSelf: 'flex-start', padding: '10px 14px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#66669a', fontSize: 13,
                  }}
                >
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <motion.span key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5c8', display: 'inline-block' }}
                      />
                    ))}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about MirraSync..."
                disabled={loading}
                style={{
                  flex: 1, padding: '9px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, color: '#f0f0ff',
                  fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: input.trim() ? 'linear-gradient(135deg, #00e5c8, #0ea5e9)' : 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                ➤
              </button>
            </div>

            {/* Footer */}
            <div style={{
              padding: '6px 14px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 10, color: '#5858a0' }}>
                Powered by MirraSync AI · <a href="mailto:support@mirrasync.com" style={{ color: '#00e5c8', textDecoration: 'none' }}>Contact Support</a>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
