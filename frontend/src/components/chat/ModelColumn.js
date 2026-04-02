import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import useUIStore from '../../stores/uiStore';
import { getModelIcon } from '../../lib/modelRegistry';
import { DotsLoader, Skeleton, Copy, RefreshCw, ThumbsUp, ThumbsDown, AlertTriangle, Check } from '../ui';

export default function ModelColumn({ model, userMessages, response, isSingle, isLast, onRetry, onRemove }) {
  const { theme } = useUIStore();
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const isStreaming = response?.isStreaming;
  const isDone = response?.isDone;
  const hasError = !!response?.error;
  const content = response?.content || '';

  // Track if user scrolled up manually
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setUserScrolledUp(!isNearBottom);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll only when user is near bottom
  useEffect(() => {
    if (isStreaming && !userScrolledUp && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [content, isStreaming, userScrolledUp]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div style={{
      flex: 1,
      minWidth: isSingle ? '100%' : 280,
      maxWidth: isSingle ? 800 : undefined,
      margin: isSingle ? '0 auto' : undefined,
      display: 'flex',
      flexDirection: 'column',
      borderRight: !isLast ? '1px solid var(--border-subtle)' : 'none',
      overflow: 'hidden',
    }}>
      {/* Column Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-surface)',
        flexShrink: 0,
        minHeight: 38,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Accent top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: isStreaming ? 'linear-gradient(90deg, var(--accent-teal), var(--accent-violet))' : isDone ? 'var(--accent-teal)' : 'transparent', transition: 'background 0.4s ease' }} />
        <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: getModelIcon(model.id, model.provider, 16) }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {model.displayName}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{model.providerLabel}</span>
        {isDone && response?.responseTime && (
          <span style={{ fontSize: 10, color: 'var(--success)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {(response.responseTime / 1000).toFixed(1)}s
          </span>
        )}
        {isStreaming && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-teal)', animation: `wave 1.2s ease ${i * 0.18}s infinite`, boxShadow: '0 0 4px var(--accent-teal)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', paddingBottom: 20 }}>
        {userMessages.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{getModelEmoji(model.category)}</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ready to chat</p>
          </div>
        )}

        {userMessages.map((msg, i) => (
          <div key={msg.id || i}>
            {/* User message */}
            <div style={{
              padding: '14px 14px 6px',
              display: 'flex',
              justifyContent: isSingle ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: isSingle ? '78%' : '100%',
                background: isSingle ? 'rgba(0,229,200,0.08)' : 'var(--bg-elevated)',
                border: `1px solid ${isSingle ? 'rgba(0,229,200,0.18)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '10px 14px',
              }}>
                {msg.attachments?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {msg.attachments.map((att, ai) => (
                      att.type === 'image' ? (
                        <img key={ai} src={att.url} alt={att.filename}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                      ) : (
                        <div key={ai} style={{ padding: '3px 8px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          📎 {att.filename}
                        </div>
                      )
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {msg.content}
                </p>
              </div>
            </div>

            {/* AI Response for last user message */}
            {i === userMessages.length - 1 && (
              <AIResponseBlock
                content={content}
                isStreaming={isStreaming}
                isDone={isDone}
                hasError={hasError}
                error={response?.error}
                onRetry={onRetry}
                onCopy={handleCopy}
                copied={copied}
                theme={theme}
                model={model}
              />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function AIResponseBlock({ content, isStreaming, isDone, hasError, error, onRetry, onCopy, copied, theme, model }) {
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
        transition={{ duration: 0.4 }}
        style={{ margin: '6px 14px 14px', padding: '12px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: 'var(--danger)', fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700, margin: '0 0 3px' }}>Model unavailable</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>{error?.message || 'An unexpected error occurred'}</p>
            <button onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'var(--danger)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <RefreshCw size={11} /> Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!content && !isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '6px 14px 14px' }}
    >
      {/* Thinking label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: model.colorAccent }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{model.displayName}</span>
        {isStreaming && !content && (
          <span style={{ fontSize: 11, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {model.supportsReasoning ? '🧠 Reasoning' : '✍ Generating'}
            <DotsLoader />
          </span>
        )}
      </div>

      {/* Skeleton while loading */}
      {isStreaming && !content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width="88%" height={13} />
          <Skeleton width="72%" height={13} />
          <Skeleton width="80%" height={13} />
        </div>
      )}

      {/* Actual content */}
      {content && (
        <div className={`markdown-content${isStreaming ? ' typing-cursor' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                if (!inline && (lang || String(children).includes('\n'))) {
                  return (
                    <div style={{ position: 'relative', margin: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', background: '#161b22', borderRadius: '8px 8px 0 0', border: '1px solid #30363d', borderBottom: 'none' }}>
                        <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{lang || 'code'}</span>
                        <CopyCodeButton code={String(children)} />
                      </div>
                      <SyntaxHighlighter
                        style={theme === 'dark' ? vscDarkPlus : vs}
                        language={lang || 'text'}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: 12, lineHeight: 1.6, border: '1px solid #30363d', borderTop: 'none', padding: '12px 16px' }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return <code className={className} style={{ fontFamily: 'JetBrains Mono, monospace' }} {...props}>{children}</code>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}

      {/* Actions when done */}
      {isDone && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}
        >
          <ActionBtn onClick={onCopy} title="Copy">
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </ActionBtn>
          <ActionBtn onClick={onRetry} title="Regenerate">
            <RefreshCw size={12} /> Regen
          </ActionBtn>
          <ActionBtn title="Good"><ThumbsUp size={12} /></ActionBtn>
          <ActionBtn title="Bad"><ThumbsDown size={12} /></ActionBtn>
        </motion.div>
      )}
    </motion.div>
  );
}

function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#3fb950' : '#8b949e', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function ActionBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 150ms' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      {children}
    </button>
  );
}

function getModelEmoji(cat) {
  return { frontier: '🚀', reasoning: '🧠', fast: '⚡', coding: '💻', vision: '👁', multilingual: '🌍' }[cat] || '🤖';
}
