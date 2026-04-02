import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Mic, MicOff, Paperclip, Send, Sparkles, X } from '../ui';

export default function PromptInput({ onSend, disabled, modelCount, isGuest }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanModal, setCleanModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const sh = Math.min(ta.scrollHeight, 160);
    ta.style.height = sh + 'px';
    ta.style.overflowY = sh >= 160 ? 'auto' : 'hidden';
  }, [text]);

  const handleSend = useCallback(() => {
    if (disabled || (!text.trim() && attachments.length === 0)) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, attachments, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Default behavior: new line
      } else {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (attachments.length + files.length > 5) { toast.error('Max 5 files per message'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAttachments(prev => [...prev, ...res.data.files]);
      toast.success(`${files.length} file(s) attached`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input not supported in your browser'); return; }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    let final = text;
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += (final ? ' ' : '') + t;
        else interim += t;
      }
      setText(final + (interim ? ' ' + interim : ''));
    };
    r.onend = () => setIsRecording(false);
    r.onerror = () => { setIsRecording(false); toast.error('Voice input error'); };
    recognitionRef.current = r;
    r.start(); setIsRecording(true);
    toast.success('Listening...', { duration: 2000 });
  };

  const handleCleanPrompt = async () => {
    if (!text.trim()) { toast.error('Enter a prompt first'); return; }
    setIsCleaning(true);
    try {
      const res = await api.post('/prompt-cleaner', { prompt: text });
      setCleanModal({ original: res.data.original, cleaned: res.data.cleaned });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prompt cleaning failed');
    } finally { setIsCleaning(false); }
  };

  const canSend = !disabled && (text.trim().length > 0 || attachments.length > 0);

  return (
    <>
      <AnimatePresence>
        {cleanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCleanModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 620, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 18, color: 'var(--accent-teal)' }}>✦</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Prompt Refined</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>ORIGINAL</p>
                  <div style={{ background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: 80 }}>{cleanModal.original}</div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 8, letterSpacing: '0.5px' }}>✦ IMPROVED</p>
                  <div style={{ background: 'var(--accent-teal-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, minHeight: 80 }}>{cleanModal.cleaned}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setCleanModal(null)} style={{ padding: '8px 18px', background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Keep Original</button>
                <button onClick={() => { setText(cleanModal.cleaned); setCleanModal(null); toast.success('Prompt refined ✦'); }}
                  style={{ padding: '8px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Apply ✦</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flexShrink: 0, padding: '10px 14px 14px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        {isGuest && (
          <div style={{ marginBottom: 8, padding: '6px 12px', background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>👋 Guest Mode · <a href="/signup" style={{ color: 'var(--accent-teal)', textDecoration: 'none', fontWeight: 600 }}>Sign up</a> for more models & features</span>
            <a href="/signup" style={{ color: 'var(--accent-teal)', fontWeight: 700, fontSize: 11 }}>Sign up free →</a>
          </div>
        )}

        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {attachments.map((att, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  {att.type === 'image'
                    ? <img src={att.url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                    : <div style={{ padding: '4px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {att.filename}</div>
                  }
                  <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{ display: 'flex', alignItems: 'flex-end', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '6px 6px 6px 10px', transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,200,0.08)'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <IBtn onClick={() => fileInputRef.current?.click()} title={isGuest ? 'Sign in to attach files' : 'Attach files'} loading={uploading} disabled={isGuest || uploading}>
            <Paperclip size={15} />
          </IBtn>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask all your AIs anything..."
            disabled={disabled}
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1.6, resize: 'none', padding: '4px 4px', minHeight: 28, maxHeight: 160, overflowY: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'var(--border-default) transparent', cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.6 : 1 }}
          />

          <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
            <IBtn onClick={handleCleanPrompt} title={isGuest ? 'Sign in for prompt cleaner' : 'Improve prompt with AI ✦'} loading={isCleaning} disabled={isGuest || !text.trim() || isCleaning} active={false}>
              <Sparkles size={14} />
            </IBtn>
            <IBtn onClick={toggleRecording} title={isRecording ? 'Stop recording' : (isGuest ? 'Sign in for voice input' : 'Voice input')} active={isRecording} disabled={isGuest} activeColor="var(--danger)">
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </IBtn>
            {(text || attachments.length > 0) && (
              <IBtn onClick={() => { setText(''); setAttachments([]); }} title="Clear"><X size={14} /></IBtn>
            )}
            <motion.button
              onClick={handleSend} disabled={!canSend}
              whileHover={{ scale: canSend ? 1.05 : 1 }} whileTap={{ scale: canSend ? 0.94 : 1 }}
              title="Send (Enter)"
              style={{ width: 34, height: 34, background: canSend ? 'var(--aurora-gradient)' : 'var(--bg-overlay)', border: 'none', borderRadius: 'var(--radius-md)', color: canSend ? '#fff' : 'var(--text-muted)', cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: canSend ? '0 2px 12px rgba(0,229,200,0.22)' : 'none', transition: 'all var(--transition-fast)' }}>
              {disabled
                ? <div style={{ width: 13, height: 13, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Send size={14} />
              }
            </motion.button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, padding: '0 2px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {modelCount > 0 ? `Sending to ${modelCount} model${modelCount !== 1 ? 's' : ''} · ` : ''}
            Enter to send, Shift+Enter for new line
          </span>
          {text.length > 500 && (
            <span style={{ fontSize: 11, color: text.length > 4000 ? 'var(--danger)' : 'var(--text-muted)' }}>{text.length.toLocaleString()}</span>
          )}
        </div>
      </div>
    </>
  );
}

function IBtn({ children, onClick, title, loading, disabled, active, activeColor }) {
  return (
    <motion.button
      onClick={disabled || loading ? undefined : onClick}
      whileHover={{ scale: disabled ? 1 : 1.1 }} whileTap={{ scale: disabled ? 1 : 0.9 }}
      title={title}
      style={{ width: 30, height: 30, background: active ? 'rgba(239,68,68,0.15)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: active ? (activeColor || 'var(--accent-teal)') : 'var(--text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-fast)', flexShrink: 0 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      {loading ? <div style={{ width: 11, height: 11, border: '2px solid transparent', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : children}
    </motion.button>
  );
}
