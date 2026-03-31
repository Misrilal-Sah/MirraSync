import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import Sidebar from '../components/layout/Sidebar';
import ModelColumn from '../components/chat/ModelColumn';
import PromptInput from '../components/chat/PromptInput';
import AddModelModal from '../components/chat/AddModelModal';
import SettingsModal from '../components/settings/SettingsModal';
import { MODEL_REGISTRY, getProviderIcon, getModelIcon, LOGO_URL } from '../lib/modelRegistry';
import { Button, Plus, Moon, Sun, Settings2, X, Menu } from '../components/ui';
import api from '../lib/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ChatPage() {
  const { conversationId: urlConvId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeModelIds, userMessages, modelResponses, isStreaming,
    addUserMessage, initModelResponse, appendModelToken, setModelDone,
    setModelError, setStreaming, createConversation, loadConversationMessages,
    clearCurrentChat, currentConversationId, loadConversations,
    loadUserPreferences, setGuestDefaults,
  } = useChatStore();
  const { sidebarOpen, theme, toggleTheme, openAddModelModal, addModelModalOpen, settingsOpen, openSettings, closeSettings, toggleSidebar } = useUIStore();

  const [expandedModel, setExpandedModel] = useState(null);
  const columnsRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadUserPreferences();
    } else {
      setGuestDefaults();
    }
  }, [user]);

  useEffect(() => {
    if (urlConvId && user) {
      if (String(urlConvId) !== String(currentConversationId)) {
        loadConversationMessages(urlConvId);
      }
    } else if (!urlConvId) {
      clearCurrentChat();
    }
  }, [urlConvId, user, currentConversationId, loadConversationMessages, clearCurrentChat]);

  const handleSend = useCallback(async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;
    if (isStreaming) return;

    // Guest model count check
    if (!user && activeModelIds.length > 3) {
      toast.error('Guests can use max 3 models. Sign up for more!');
      return;
    }

    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId && user) {
      convId = await createConversation(activeModelIds);
      // Use replaceState instead of navigate() to avoid switching between
      // /chat and /chat/:id routes which would remount this component and
      // wipe all in-flight streaming state.
      if (convId) window.history.replaceState(null, '', `/chat/${convId}`);
    }

    // Save user message (fire and forget to not delay streaming)
    const userMsg = addUserMessage(content, attachments);

    if (convId && user) {
      api.post('/chat/save-user-message', {
        conversationId: convId,
        content,
        attachments,
      }).catch(err => console.error('Failed to save user message:', err.message));
    }

    // Build message history for context
    const token = localStorage.getItem('mirrasync_token');
    const messages = userMessages.concat([userMsg]).map(m => ({
      role: m.role,
      content: m.content,
    }));

    setStreaming(true);

    // Get language preference
    const lang = user?.language || localStorage.getItem('mirrasync_lang') || 'en';
    const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', hi: 'Hindi', ja: 'Japanese', zh: 'Chinese' };
    const langSystem = lang !== 'en' ? `Please respond in ${langNames[lang] || 'English'}. ` : '';

    // Stream from each model in parallel
    const modelIds = expandedModel ? [expandedModel] : activeModelIds;

    await Promise.all(modelIds.map(async (modelId) => {
      initModelResponse(modelId);

      const eventSource = new EventSource(
        `${API_BASE}/chat/stream`,
        { withCredentials: true }
      );

      // SSE via fetch for POST support (EventSource only supports GET)
      try {
        const res = await fetch(`${API_BASE}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...((!user) ? { 'x-guest-id': localStorage.getItem('mirrasync_guest_id') || '' } : {}),
          },
          body: JSON.stringify({
            modelId,
            messages,
            conversationId: convId,
            guestId: localStorage.getItem('mirrasync_guest_id'),
            ...(langSystem ? { systemPrompt: langSystem } : {}),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.rateLimited) toast.error(data.error || 'Rate limit reached. Please wait.');
          setModelError(modelId, 'HTTP_ERROR', data.error || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const startTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              // handled below
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token !== undefined) {
                  appendModelToken(modelId, data.token);
                } else if (data.code && data.message) {
                  setModelError(modelId, data.code, data.message);
                } else if (data.responseTimeMs !== undefined) {
                  setModelDone(modelId, data.responseTimeMs);
                }
              } catch (e) {}
            }
          }
        }

        const responseTime = Date.now() - startTime;
        setModelDone(modelId, responseTime);

      } catch (err) {
        setModelError(modelId, 'NETWORK_ERROR', 'Connection failed. Check your internet.');
      }
    }));

    setStreaming(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModelIds, expandedModel, isStreaming, user, userMessages, currentConversationId]);

  const activeModels = MODEL_REGISTRY.filter(m => activeModelIds.includes(m.id));
  const visibleModels = expandedModel
    ? MODEL_REGISTRY.filter(m => m.id === expandedModel)
    : activeModels;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar — self-animates via CSS transition */}
      <Sidebar />

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '0 8px',
          gap: 4,
          overflowX: 'auto',
        }}>
          {/* Model Column Headers */}
          {/* Sidebar toggle button when closed */}
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              title="Open sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center', overflowX: 'auto', paddingRight: 8 }}>
            {activeModels.map((model) => (
              <ModelHeaderChip
                key={model.id}
                model={model}
                isExpanded={expandedModel === model.id}
                onExpand={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                onRemove={() => {
                  useChatStore.getState().removeModel(model.id);
                  if (expandedModel === model.id) setExpandedModel(null);
                }}
                response={modelResponses[model.id]}
              />
            ))}

            {/* Add Model Button */}
            {activeModelIds.length < 10 && (
              <button
                onClick={openAddModelModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', flexShrink: 0,
                  background: 'var(--accent-teal-dim)',
                  border: '1px dashed var(--accent-teal)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--accent-teal)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-teal-dim)'}
              >
                <Plus size={12} />
                Add Model
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={toggleTheme}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {user && (
              <button
                onClick={() => openSettings()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
              >
                <Settings2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Model Columns */}
        <div
          ref={columnsRef}
          style={{
            flex: 1,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            position: 'relative',
          }}
        >
          {activeModels.length === 0 ? (
            <EmptyState onAddModel={openAddModelModal} />
          ) : (
            visibleModels.map((model, idx) => (
              <ModelColumn
                key={model.id}
                model={model}
                userMessages={userMessages}
                response={modelResponses[model.id]}
                isSingle={visibleModels.length === 1}
                isLast={idx === visibleModels.length - 1}
                onRetry={() => {
                  if (userMessages.length > 0) {
                    const last = userMessages[userMessages.length - 1];
                    handleSend(last.content, last.attachments);
                  }
                }}
                onRemove={() => {
                  useChatStore.getState().removeModel(model.id);
                  if (expandedModel === model.id) setExpandedModel(null);
                }}
              />
            ))
          )}
        </div>

        {/* Prompt Input */}
        <PromptInput
          onSend={handleSend}
          disabled={isStreaming}
          modelCount={activeModelIds.length}
          isGuest={!user}
        />
      </div>

      {/* Modals */}
      <AddModelModal />
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
    </div>
  );
}

function ModelHeaderChip({ model, isExpanded, onExpand, onRemove, response }) {
  const isStreaming = response?.isStreaming;
  const hasError = !!response?.error;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 10px 5px 8px',
      background: isExpanded ? 'var(--accent-teal-dim)' : 'var(--bg-elevated)',
      border: `1px solid ${isExpanded ? 'var(--accent-teal)' : hasError ? 'var(--danger)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-full)',
      flexShrink: 0,
      transition: 'all var(--transition-fast)',
      cursor: 'default',
    }}>
      {/* Provider icon */}
      <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: getModelIcon(model.id, model.provider, 16) }} />
      {/* Name */}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {model.displayName}
      </span>
      {/* Streaming indicator */}
      {isStreaming && (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-teal)', animation: `wave 1.2s ease ${i * 0.15}s infinite` }} />
          ))}
        </div>
      )}
      {/* Expand button */}
      <button onClick={onExpand} title={isExpanded ? 'Collapse' : 'Expand'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', fontSize: 11 }}>
        {isExpanded ? '⊡' : '⊞'}
      </button>
      {/* Remove */}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}>
        <X size={12} />
      </button>
    </div>
  );
}

function EmptyState({ onAddModel }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🤖</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>No models selected</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 360 }}>Add at least one AI model to start chatting. You can run up to 10 models simultaneously!</p>
      <Button onClick={onAddModel} size="lg" icon={<Plus size={16} />}>Add Your First Model</Button>
    </div>
  );
}
