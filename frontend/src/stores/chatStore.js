import { create } from 'zustand';
import api from '../lib/api';

// Default models to show on first load
const DEFAULT_ACTIVE_MODELS = [
  'google-gemini-31-flash-lite',
  'groq-llama4-scout',
  'cerebras-llama31-8b',
];

// Guest gets 3 lightweight defaults
const GUEST_DEFAULT_MODELS = [
  'google-gemini-31-flash-lite',
  'cerebras-llama31-8b',
  'groq-qwen3-32b',
];

const useChatStore = create((set, get) => ({
  // Active model IDs in columns (ordered)
  activeModelIds: DEFAULT_ACTIVE_MODELS,

  // Conversations list
  conversations: [],
  currentConversationId: null,

  // Messages per model: { [conversationId]: { [modelId]: Message[] } }
  // For multi-model: each modelId gets its own response thread
  // userMessages: shared across all models
  userMessages: [],   // { id, role:'user', content, attachments, timestamp }
  modelResponses: {}, // { [modelId]: { content, isStreaming, isDone, error, responseTime } }

  isStreaming: false,
  guestMessageCount: parseInt(localStorage.getItem('mirrasync_guest_count') || '0'),

  // ─── Model management ─────────────────────────────────────────
  addModel: (modelId) => {
    const { activeModelIds } = get();
    if (activeModelIds.includes(modelId)) return;
    if (activeModelIds.length >= 10) return;
    set({ activeModelIds: [...activeModelIds, modelId] });
  },

  removeModel: (modelId) => {
    set((s) => ({
      activeModelIds: s.activeModelIds.filter((id) => id !== modelId),
    }));
  },

  reorderModels: (newOrder) => set({ activeModelIds: newOrder }),

  toggleModel: (modelId) => {
    const { activeModelIds } = get();
    if (activeModelIds.includes(modelId)) {
      get().removeModel(modelId);
    } else {
      get().addModel(modelId);
    }
  },

  setActiveModels: (ids) => set({ activeModelIds: ids.slice(0, 10) }),

  // Load user's saved AI preferences for default models
  loadUserPreferences: async () => {
    try {
      const res = await api.get('/user/me/preferences');
      const prefs = res.data.preferences;
      if (prefs?.defaultModels?.length > 0) {
        set({ activeModelIds: prefs.defaultModels });
      }
    } catch {
      // Silently fail, keep current defaults
    }
  },

  // Set guest-appropriate defaults
  setGuestDefaults: () => {
    set({ activeModelIds: GUEST_DEFAULT_MODELS });
  },

  // ─── Conversations ─────────────────────────────────────────────
  loadConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data.conversations });
    } catch (err) {
      console.error('Failed to load conversations:', err.message);
    }
  },

  createConversation: async (modelIds) => {
    try {
      const res = await api.post('/conversations', { modelsUsed: modelIds });
      const conv = res.data.conversation;
      set((s) => ({ conversations: [conv, ...s.conversations], currentConversationId: conv.id }));
      return conv.id;
    } catch (err) {
      return null;
    }
  },

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  updateConversationTitle: (id, title) => {
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c))
    }));
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        currentConversationId: s.currentConversationId === id ? null : s.currentConversationId,
      }));
    } catch (err) {
      console.error('Failed to delete conversation:', err.message);
    }
  },

  renameConversation: async (id, title) => {
    try {
      await api.patch(`/conversations/${id}`, { title });
      get().updateConversationTitle(id, title);
    } catch (err) {}
  },

  togglePinConversation: async (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      await api.patch(`/conversations/${id}`, { pinned: !conv.pinned });
      set((s) => ({
        conversations: s.conversations.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c)
      }));
    } catch (err) {}
  },

  // ─── Messaging ────────────────────────────────────────────────
  clearCurrentChat: () => {
    set({ userMessages: [], modelResponses: {}, currentConversationId: null });
  },

  addUserMessage: (content, attachments = []) => {
    const msg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date(),
    };
    set((s) => ({ userMessages: [...s.userMessages, msg] }));
    return msg;
  },

  initModelResponse: (modelId) => {
    set((s) => ({
      modelResponses: {
        ...s.modelResponses,
        [modelId]: { content: '', isStreaming: true, isDone: false, error: null, responseTime: null }
      }
    }));
  },

  appendModelToken: (modelId, token) => {
    set((s) => ({
      modelResponses: {
        ...s.modelResponses,
        [modelId]: {
          ...s.modelResponses[modelId],
          content: (s.modelResponses[modelId]?.content || '') + token,
        }
      }
    }));
  },

  setModelDone: (modelId, responseTime) => {
    set((s) => ({
      modelResponses: {
        ...s.modelResponses,
        [modelId]: {
          ...s.modelResponses[modelId],
          isStreaming: false,
          isDone: true,
          responseTime,
        }
      }
    }));
  },

  setModelError: (modelId, errorCode, errorMessage) => {
    set((s) => ({
      modelResponses: {
        ...s.modelResponses,
        [modelId]: {
          content: '',
          isStreaming: false,
          isDone: false,
          error: { code: errorCode, message: errorMessage },
          responseTime: null,
        }
      }
    }));
  },

  clearModelResponse: (modelId) => {
    set((s) => {
      const updated = { ...s.modelResponses };
      delete updated[modelId];
      return { modelResponses: updated };
    });
  },

  setStreaming: (val) => set({ isStreaming: val }),

  incrementGuestCount: () => {
    const count = get().guestMessageCount + 1;
    localStorage.setItem('mirrasync_guest_count', count.toString());
    set({ guestMessageCount: count });
  },

  // Load conversation history for restoring
  loadConversationMessages: async (conversationId) => {
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      const { conversation } = res.data;
      const messages = conversation.messages || [];

      // Rebuild userMessages and modelResponses from DB
      const userMsgs = messages.filter((m) => m.role === 'user');
      const assistantMsgs = messages.filter((m) => m.role === 'assistant');

      const responses = {};
      for (const msg of assistantMsgs) {
        if (msg.modelId) {
          responses[msg.modelId] = {
            content: msg.content,
            isStreaming: false,
            isDone: true,
            error: msg.errorCode ? { code: msg.errorCode, message: 'Previous error' } : null,
            responseTime: msg.responseTimeMs,
          };
        }
      }

      set({
        currentConversationId: conversationId,
        userMessages: userMsgs.map((m) => ({
          id: m.id,
          role: 'user',
          content: m.content,
          attachments: m.attachments || [],
          timestamp: new Date(m.createdAt),
        })),
        modelResponses: responses,
        activeModelIds: Array.isArray(conversation.modelsUsed) ? conversation.modelsUsed : DEFAULT_ACTIVE_MODELS,
      });
    } catch (err) {
      console.error('Failed to load conversation messages:', err.message);
    }
  },
}));

export default useChatStore;
