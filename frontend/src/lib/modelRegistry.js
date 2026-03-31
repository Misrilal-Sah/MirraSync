// ─── CLOUDINARY LOGO ─────────────────────────────────────────────
export const LOGO_URL = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1774035263/logo_k2bhoz_k21hch.png';

// ─── MODEL REGISTRY ─────────────────────────────────────────────
export const MODEL_REGISTRY = [
  // ── Free Models (24) ──────────────────────────────────────────
  { id: 'github-gpt-4o', displayName: 'GPT-4o', provider: 'github_models', providerLabel: 'GitHub Models', supportsVision: true, supportsReasoning: true, isFree: true, isPro: false, description: 'GPT-4o via GitHub Models', colorAccent: '#10a37f', category: 'frontier' },
  { id: 'github-grok-3', displayName: 'Grok 3', provider: 'github_models', providerLabel: 'GitHub Models', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: "xAI's flagship reasoning model", colorAccent: '#1d9bf0', category: 'frontier' },
  { id: 'github-deepseek-r1', displayName: 'DeepSeek R1', provider: 'github_models', providerLabel: 'GitHub Models', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Best open-source reasoning', colorAccent: '#4a90d9', category: 'reasoning' },
  { id: 'google-gemini-25-flash', displayName: 'Gemini 2.5 Flash', provider: 'google_ai', providerLabel: 'Google AI', supportsVision: true, supportsReasoning: true, isFree: true, isPro: false, description: 'Best free reasoning + vision', colorAccent: '#4285f4', category: 'reasoning' },
  { id: 'google-gemini-3-flash', displayName: 'Gemini 2.0 Flash', provider: 'google_ai', providerLabel: 'Google AI', supportsVision: true, supportsReasoning: false, isFree: true, isPro: false, description: 'Fast multimodal model', colorAccent: '#4285f4', category: 'fast' },
  { id: 'google-gemini-31-flash-lite', displayName: 'Gemini 2.0 Flash Lite', provider: 'google_ai', providerLabel: 'Google AI', supportsVision: true, supportsReasoning: false, isFree: true, isPro: false, description: 'Lightweight & efficient', colorAccent: '#4285f4', category: 'fast' },
  { id: 'groq-kimi-k2', displayName: 'Kimi K2', provider: 'groq', providerLabel: 'Groq', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Exclusive top-tier instruct model', colorAccent: '#f55036', category: 'reasoning' },
  { id: 'groq-llama4-scout', displayName: 'Llama 4 Scout', provider: 'groq', providerLabel: 'Groq', supportsVision: true, supportsReasoning: false, isFree: true, isPro: false, description: "Meta's best Llama 4 on Groq", colorAccent: '#f55036', category: 'fast' },
  { id: 'groq-qwen3-32b', displayName: 'Qwen3 32B', provider: 'groq', providerLabel: 'Groq', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Only 32B Qwen here', colorAccent: '#f55036', category: 'coding' },
  { id: 'cerebras-gpt-oss-120b', displayName: 'GPT-OSS 120B', provider: 'cerebras', providerLabel: 'Cerebras', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: "World's fastest inference", colorAccent: '#ff6b35', category: 'fast' },
  { id: 'cerebras-llama31-8b', displayName: 'Llama 3.1 8B', provider: 'cerebras', providerLabel: 'Cerebras', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Instant responses via Cerebras', colorAccent: '#ff6b35', category: 'fast' },
  { id: 'cohere-command-a-reasoning', displayName: 'Command A Reasoning', provider: 'cohere', providerLabel: 'Cohere', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Exclusive reasoning flagship', colorAccent: '#39594d', category: 'reasoning' },
  { id: 'cohere-command-a-vision', displayName: 'Command A Vision', provider: 'cohere', providerLabel: 'Cohere', supportsVision: true, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive vision model', colorAccent: '#39594d', category: 'vision' },
  { id: 'cohere-aya-expanse-32b', displayName: 'Aya Expanse 32B', provider: 'cohere', providerLabel: 'Cohere', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive multilingual (23+ langs)', colorAccent: '#39594d', category: 'multilingual' },
  { id: 'mistral-small-31', displayName: 'Mistral Small 3.1', provider: 'mistral', providerLabel: 'Mistral', supportsVision: true, supportsReasoning: false, isFree: true, isPro: false, description: 'Best open-source Mistral', colorAccent: '#ff7000', category: 'frontier' },
  { id: 'mistral-large', displayName: 'Mistral Large', provider: 'mistral', providerLabel: 'Mistral', supportsVision: true, supportsReasoning: true, isFree: true, isPro: false, description: 'Exclusive proprietary flagship', colorAccent: '#ff7000', category: 'frontier' },
  { id: 'mistral-codestral', displayName: 'Codestral', provider: 'mistral', providerLabel: 'Mistral', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Dedicated code model', colorAccent: '#ff7000', category: 'coding' },
  { id: 'openrouter-hermes-405b', displayName: 'Hermes 3 405B', provider: 'openrouter', providerLabel: 'OpenRouter', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive 405B Llama fine-tune', colorAccent: '#7c3aed', category: 'frontier' },
  { id: 'openrouter-step-35-flash', displayName: 'Step 3.5 Flash', provider: 'openrouter', providerLabel: 'OpenRouter', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive StepFun model', colorAccent: '#7c3aed', category: 'frontier' },
  { id: 'openrouter-qwen3-coder', displayName: 'Qwen3 Coder', provider: 'openrouter', providerLabel: 'OpenRouter', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Dedicated coding specialist', colorAccent: '#7c3aed', category: 'coding' },
  { id: 'cf-ibm-granite', displayName: 'IBM Granite 4.0', provider: 'cloudflare', providerLabel: 'Cloudflare AI', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive IBM enterprise model', colorAccent: '#f4a100', category: 'frontier' },
  { id: 'cf-qwen-qwq-32b', displayName: 'Qwen QwQ 32B', provider: 'cloudflare', providerLabel: 'Cloudflare AI', supportsVision: false, supportsReasoning: true, isFree: true, isPro: false, description: 'Reasoning specialist on CF', colorAccent: '#f4a100', category: 'reasoning' },
  { id: 'cf-glm-47-flash', displayName: 'GLM 4.7 Flash', provider: 'cloudflare', providerLabel: 'Cloudflare AI', supportsVision: false, supportsReasoning: false, isFree: true, isPro: false, description: 'Exclusive Chinese AI model', colorAccent: '#f4a100', category: 'multilingual' },

  // ── Pro Models (locked) ───────────────────────────────────────
  { id: 'pro-gpt-4o', displayName: 'GPT-4o', provider: 'openai', providerLabel: 'OpenAI', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'OpenAI multimodal flagship', colorAccent: '#10a37f', category: 'frontier' },
  { id: 'pro-claude-4-sonnet', displayName: 'Claude 4 Sonnet', provider: 'anthropic', providerLabel: 'Anthropic', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Best for coding & analysis', colorAccent: '#d4a574', category: 'coding' },
  { id: 'pro-claude-4-opus', displayName: 'Claude 4 Opus', provider: 'anthropic', providerLabel: 'Anthropic', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Anthropic flagship — most capable', colorAccent: '#d4a574', category: 'frontier' },
  { id: 'pro-gemini-25-pro', displayName: 'Gemini 2.5 Pro', provider: 'google_ai', providerLabel: 'Google AI', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Google\'s most powerful model', colorAccent: '#4285f4', category: 'frontier' },
  { id: 'pro-llama4-maverick', displayName: 'Llama 4 Maverick', provider: 'meta', providerLabel: 'Meta AI', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Meta\'s largest open model', colorAccent: '#0668E1', category: 'frontier' },
  { id: 'pro-mistral-large-3', displayName: 'Mistral Large 3', provider: 'mistral', providerLabel: 'Mistral', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Next-gen Mistral flagship', colorAccent: '#ff7000', category: 'frontier' },
  { id: 'pro-command-r-plus', displayName: 'Command R+', provider: 'cohere', providerLabel: 'Cohere', supportsVision: false, supportsReasoning: true, isFree: false, isPro: true, description: 'Enterprise-grade RAG model', colorAccent: '#39594d', category: 'reasoning' },
  { id: 'pro-phi-4', displayName: 'Phi-4', provider: 'microsoft', providerLabel: 'Microsoft', supportsVision: true, supportsReasoning: true, isFree: false, isPro: true, description: 'Compact powerhouse from Microsoft', colorAccent: '#00bcf2', category: 'reasoning' },
];

// Guest users can only use these 10 models (best free/light ones)
export const GUEST_FREE_IDS = [
  'github-gpt-5',
  'google-gemini-25-flash',
  'google-gemini-3-flash',
  'groq-llama4-scout',
  'groq-qwen3-32b',
  'cerebras-llama31-8b',
  'cohere-command-a-vision',
  'mistral-small-31',
  'openrouter-hermes-405b',
  'cf-qwen-qwq-32b',
];

// Max active models
export const GUEST_MAX_ACTIVE = 3;
export const USER_MAX_ACTIVE = 10;
export const PRO_MAX_ACTIVE = 20;

export const PROVIDER_COLORS = {
  github_models: '#10a37f',
  google_ai: '#4285f4',
  groq: '#f55036',
  cerebras: '#ff6b35',
  cohere: '#39594d',
  mistral: '#ff7000',
  openrouter: '#7c3aed',
  cloudflare: '#f4a100',
  openai: '#10a37f',
  anthropic: '#d4a574',
  meta: '#0668E1',
  microsoft: '#00bcf2',
};

export const PROVIDERS = [
  { id: 'github_models', label: 'GitHub Models', color: '#10a37f' },
  { id: 'google_ai', label: 'Google AI', color: '#4285f4' },
  { id: 'groq', label: 'Groq', color: '#f55036' },
  { id: 'cerebras', label: 'Cerebras', color: '#ff6b35' },
  { id: 'cohere', label: 'Cohere', color: '#39594d' },
  { id: 'mistral', label: 'Mistral', color: '#ff7000' },
  { id: 'openrouter', label: 'OpenRouter', color: '#7c3aed' },
  { id: 'cloudflare', label: 'Cloudflare AI', color: '#f4a100' },
];

export const CATEGORIES = ['frontier', 'reasoning', 'fast', 'coding', 'vision', 'multilingual'];

// ─── PROVIDER SVG ICONS ─────────────────────────────────────────
// Returns a mini inline SVG string for each provider
export function getProviderIcon(providerId, size = 16) {
  const icons = {
    github_models: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
    google_ai: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    groq: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#f55036"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="800" font-family="Arial">G</text></svg>`,
    cerebras: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#ff6b35"/><path d="M6 6h4v4H6zM10 10h4v4h-4zM14 6h4v4h-4zM6 14h4v4H6zM14 14h4v4h-4z" fill="white" opacity="0.9"/></svg>`,
    cohere: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#39594d"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="15" font-weight="800" font-family="Arial">C</text></svg>`,
    mistral: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="4" height="4" fill="#f7d046"/><rect x="10" y="4" width="4" height="4" fill="#f7d046"/><rect x="18" y="4" width="4" height="4" fill="#f7d046"/><rect x="2" y="10" width="4" height="4" fill="#ff7000"/><rect x="6" y="10" width="4" height="4" fill="#ff7000"/><rect x="10" y="10" width="4" height="4" fill="#ff7000"/><rect x="14" y="10" width="4" height="4" fill="#ff7000"/><rect x="18" y="10" width="4" height="4" fill="#ff7000"/><rect x="2" y="16" width="4" height="4" fill="#f24822"/><rect x="10" y="16" width="4" height="4" fill="#f24822"/><rect x="18" y="16" width="4" height="4" fill="#f24822"/></svg>`,
    openrouter: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#7c3aed"/><path d="M12 4l7 4v8l-7 4-7-4V8l7-4z" stroke="white" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>`,
    cloudflare: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#f4a100"/><path d="M16.5 16.5H6.5L8 11l2.5 1.5L14 9l2.5 7.5z" fill="white" opacity="0.9"/></svg>`,
    openai: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#10a37f"/><path d="M12 4a6.5 6.5 0 00-5.58 9.82L7.5 17.5h9l1.08-3.68A6.5 6.5 0 0012 4zm0 2a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" fill="white"/><circle cx="12" cy="8.5" r="1.5" fill="white"/><path d="M10 12h4" stroke="white" stroke-width="1.5"/></svg>`,
    anthropic: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#d4a574"/><path d="M12 5l6 14h-3l-1.2-3H10.2L9 19H6l6-14zm0 4.5L10.8 14h2.4L12 9.5z" fill="white"/></svg>`,
    meta: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#0668E1"/><path d="M4 12c0-2.5 1.2-5 3-5s2.5 2 4 5c1.5 3 2.2 5 4 5s3-2.5 3-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M4 12c0 2.5 1.2 5 3 5s2.5-2 4-5c1.5-3 2.2-5 4-5s3 2.5 3 5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/></svg>`,
    microsoft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" fill="#f25022"/><rect x="13" y="3" width="8" height="8" fill="#7fba00"/><rect x="3" y="13" width="8" height="8" fill="#00a4ef"/><rect x="13" y="13" width="8" height="8" fill="#ffb900"/></svg>`,
  };
  return icons[providerId] || `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.3"/></svg>`;
}

// Per-model icon overrides (for models that differ from their provider icon)
const MODEL_ICON_OVERRIDES = {
  'github-gpt-5': (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#10a37f"/><path d="M12 3.5L18.5 7.25v7.5L12 18.5 5.5 14.75v-7.5L12 3.5z" stroke="white" stroke-width="1.4" fill="none"/><circle cx="12" cy="11" r="3" stroke="white" stroke-width="1.3" fill="none"/><line x1="12" y1="14" x2="12" y2="17" stroke="white" stroke-width="1.3"/></svg>`,
  'github-grok-3': (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#15202B"/><path d="M5 5l5.5 7L5 19h1.5l4.75-6.15L15.5 19H19l-5.75-7.35L18.5 5H17l-4.25 5.5L8.5 5H5z" fill="white"/></svg>`,
  'github-deepseek-r1': (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#4a90d9"/><path d="M12 4C8.13 4 5 7.13 5 11c0 2.39 1.19 4.5 3 5.74V19h8v-2.26c1.81-1.24 3-3.35 3-5.74 0-3.87-3.13-7-7-7z" fill="white" opacity="0.9"/><path d="M9 13h6M9 10.5h6M12 8v7" stroke="#4a90d9" stroke-width="1.2" stroke-linecap="round"/></svg>`,
};

export function getModelIcon(modelId, providerId, size = 16) {
  const override = MODEL_ICON_OVERRIDES[modelId];
  if (override) return override(size);
  return getProviderIcon(providerId, size);
}

// API key validation rules per provider
export const API_KEY_VALIDATION = {
  github_models: { prefix: 'github_pat_', minLength: 20, label: 'GitHub PAT (starts with github_pat_)' },
  google_ai: { prefix: 'AIza', minLength: 30, label: 'Google AI key (starts with AIza)' },
  groq: { prefix: 'gsk_', minLength: 20, label: 'Groq key (starts with gsk_)' },
  cerebras: { prefix: 'csk-', minLength: 20, label: 'Cerebras key (starts with csk-)' },
  cohere: { prefix: null, minLength: 30, label: 'Cohere API key (min 30 chars)' },
  mistral: { prefix: null, minLength: 20, label: 'Mistral API key (min 20 chars)' },
  openrouter: { prefix: 'sk-or-', minLength: 20, label: 'OpenRouter key (starts with sk-or-)' },
  cloudflare: { prefix: null, minLength: 20, label: 'Cloudflare API token (min 20 chars)' },
};
