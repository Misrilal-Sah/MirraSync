# MirraSync

**Sync Every Mind. One Prompt.**

Run GPT-5, Gemini, Grok, DeepSeek, Llama and 30+ AI models simultaneously on the same prompt. Compare answers side-by-side in real time. 100% free.


## Features

### Core
- **Multi-model parallel chat** — Run 1 to 20 AI models simultaneously on the same prompt
- **Real-time SSE streaming** — Responses stream token-by-token into independent columns
- **32+ AI models across 12 providers** — 24 free + 8 Pro models, no API keys required
- **Single model mode** — Classic chat UI when only one model is selected

### Input
- **File & image attachments** — Upload JPG, PNG, WEBP, GIF, PDF, TXT, MD, CSV, DOCX (max 10MB, max 5 files)
- **Voice input** — Browser Web Speech API with live transcription
- **Prompt Cleaner** — AI rewrites your prompt for clarity before sending (shows diff)
- **Markdown rendering** — Full GFM support with syntax-highlighted code blocks

### Authentication
- Email + password signup with OTP email verification
- Google OAuth one-click sign-in
- Forgot password / reset password via email link
- Custom branded email templates (dark theme)
- Guest access with rate-limited unlimited messages (no sign-up required)

### Subscription Tiers
| Feature | Guest | Free ($0/mo) | Pro (Coming Soon) |
|---|---|---|---|
| Messages | Unlimited (10/min) | Unlimited (20/min) | Unlimited (highest) |
| Available models | 10 | 24 | 32+ |
| Active models | 3 max | 10 max | 20 max |
| Chat history | ❌ | ✅ | ✅ |
| File uploads | ❌ | ✅ | ✅ |
| API keys | ❌ | ✅ | ✅ |
| Pro model unlock (own key) | ❌ | ✅ | Included |

### User Features
- Chat history stored in MySQL, grouped by date
- Rename, pin, delete conversations
- User settings: theme, language, AI preferences, API keys, profile
- Bring-your-own API keys (AES-256-GCM encrypted at rest)
- **Unlock Pro models with your own valid API key** for any provider
- Context window control

### Homepage
- **RAG Chatbot** — AI assistant trained on project knowledge (Groq API)
- **Scroll-to-top** button
- **Compare Plans** pricing table
- Model marquee with provider SVG icons
- Animated feature cards

### Design
- Dark mode by default, full light mode toggle (homepage always dark)
- Fully custom UI — no shadcn, no Tailwind defaults
- **Fully responsive** — mobile, tablet, desktop (300px to 4K)
- Framer Motion animations throughout
- Custom scrollbars, dropdowns, toggles, modals, toasts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + React Router v6 |
| Styling | CSS Variables (custom design tokens) |
| Animations | Framer Motion |
| State Management | Zustand |
| Backend Framework | Express.js (Node.js) |
| Database ORM | Prisma |
| Database | MySQL |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| OAuth | Google Identity Services |
| Email | Nodemailer (Gmail SMTP) |
| File Storage | Cloudinary |
| AI Streaming | Server-Sent Events (SSE) via native Node.js `https` |
| Encryption | Node.js `crypto` (AES-256-GCM) |
| Markdown | react-markdown + remark-gfm |
| Code Highlighting | react-syntax-highlighter (Prism) |

---

## Project Structure

```
mirrasync/
├── backend/
│   ├── src/
│   │   ├── server.js               
│   │   ├── routes/
│   │   │   ├── auth.js             
│   │   │   ├── user.js             
│   │   │   ├── conversations.js    
│   │   │   ├── messages.js         
│   │   │   ├── apiKeys.js          
│   │   │   ├── upload.js           
│   │   │   ├── chat.js             
│   │   │   ├── promptCleaner.js    
│   │   │   └── chatbot.js          
│   │   ├── knowledge/
│   │   │   └── project_knowledge.txt  
│   │   ├── providers/
│   │   │   └── adapters.js         
│   │   ├── models/
│   │   │   └── registry.js         
│   │   ├── middleware/
│   │   │   └── auth.js             
│   │   ├── services/
│   │   │   └── email.js            
│   │   └── utils/
│   │       ├── prisma.js           
│   │       ├── jwt.js              
│   │       └── encryption.js       
│   ├── prisma/
│   │   └── schema.prisma           
│   ├── .env.example                
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                  
│   │   ├── index.js                
│   │   ├── styles/
│   │   │   └── globals.css         
│   │   ├── lib/
│   │   │   ├── api.js              
│   │   │   └── modelRegistry.js    
│   │   ├── stores/
│   │   │   ├── authStore.js        
│   │   │   ├── chatStore.js        
│   │   │   └── uiStore.js          
│   │   ├── pages/
│   │   │   ├── LoginPage.js        
│   │   │   ├── AuthPages.js        
│   │   │   ├── ChatPage.js         
│   │   │   └── OtherPages.js       
│   │   └── components/
│   │       ├── ui/
│   │       │   └── index.js        
│   │       ├── chat/
│   │       │   ├── ModelColumn.js  
│   │       │   ├── PromptInput.js  
│   │       │   └── AddModelModal.js 
│   │       ├── ChatbotWidget.js    
│   │       ├── layout/
│   │       │   └── Sidebar.js      
│   │       └── settings/
│   │           └── SettingsModal.js 
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Quick Start

### Step 1 — Clone and install

```bash
# Clone the repository
git clone https://github.com/Misrilal-Sah/MirraSync.git
cd MirraSync

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Set up environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:
- `DATABASE_URL` — your MySQL connection string
- `JWT_SECRET` — any random 32+ character string
- `ENCRYPTION_KEY` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com)
- `SMTP_EMAIL` and `SMTP_PASSWORD` — Gmail address + [App Password](https://support.google.com/accounts/answer/185833)
- AI provider keys (see [Environment Variables](#environment-variables) section)

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

Open `frontend/.env` and set:
- `REACT_APP_API_URL=http://localhost:5000/api`
- `REACT_APP_GOOGLE_CLIENT_ID=` — same as backend Google Client ID

### Step 3 — Set up the database

```bash
cd backend

# Push the Prisma schema to your MySQL database (creates all tables)
npx prisma db push

# Optional: open Prisma Studio to browse the database
npx prisma studio
```

### Step 4 — Run the development servers

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

Visit **http://localhost:3000** to use MirraSync.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# ─── App ───────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# ─── JWT ───────────────────────────────────────────────────────
JWT_SECRET=your_random_32_char_secret_here
JWT_EXPIRES_IN=7d

# ─── Encryption ────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_key_here

# ─── Database ──────────────────────────────────────────────────
DATABASE_URL=mysql://root:password@localhost:3306/mirrasync

# ─── Google OAuth ──────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── Email (Gmail) ─────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=yourapp@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM_NAME=MirraSync

# ─── Cloudinary ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── GitHub Models ─────────────────────────────────────────────
# Get from: https://github.com/settings/tokens
GITHUB_MODELS_API_KEY=github_pat_xxxxxxxxxxxx
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference

# ─── Google AI Studio ──────────────────────────────────────────
# Get from: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=AIzaSy_xxxxxxxxxxxx
GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# ─── Groq ──────────────────────────────────────────────────────
# Get from: https://console.groq.com/keys
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GROQ_BASE_URL=https://api.groq.com/openai/v1

# ─── Cerebras ──────────────────────────────────────────────────
# Get from: https://cloud.cerebras.ai/
CEREBRAS_API_KEY=csk-xxxxxxxxxxxx
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

# ─── Cohere ────────────────────────────────────────────────────
# Get from: https://dashboard.cohere.com/api-keys
COHERE_API_KEY=your_cohere_key
COHERE_BASE_URL=https://api.cohere.com/v2

# ─── Mistral ───────────────────────────────────────────────────
# Get from: https://console.mistral.ai/api-keys/
MISTRAL_API_KEY=your_mistral_key
MISTRAL_BASE_URL=https://api.mistral.ai/v1

# ─── OpenRouter ────────────────────────────────────────────────
# Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# ─── Cloudflare Workers AI ─────────────────────────────────────
# Get from: https://dash.cloudflare.com/profile/api-tokens
# Account ID from: https://dash.cloudflare.com (right sidebar)
CLOUDFLARE_API_KEY=your_cloudflare_api_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_BASE_URL=https://api.cloudflare.com/client/v4/accounts
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## Database Setup

MirraSync uses MySQL with Prisma ORM. The schema lives at `backend/prisma/schema.prisma`.

### Tables

| Table | Description |
|---|---|
| `User` | Account info, theme, language preferences |
| `OtpToken` | Email verification + password reset tokens |
| `ApiKey` | Encrypted user-provided API keys per provider |
| `Conversation` | Chat threads with model list |
| `Message` | Individual messages (user + per-model AI responses) |
| `UserPreferences` | Default models, context size, model order |

### Commands

```bash
# Create tables (initial setup or schema changes)
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# Open database browser GUI
npx prisma studio

# Create a migration file (for production)
npx prisma migrate dev --name init

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Supported AI Models

All 24 models are free to use with server-side API keys. Users can also add their own keys for higher limits.

### GitHub Models
| Model | ID | Vision | Reasoning |
|---|---|---|---|
| GPT-5 | `openai/gpt-5` | ✅ | ✅ |
| Grok 3 | `xai/grok-3` | ❌ | ✅ |
| DeepSeek R1 0528 | `deepseek/deepseek-r1-0528` | ❌ | ✅ |

### Google AI Studio
| Model | ID | Vision | Reasoning |
|---|---|---|---|
| Gemini 2.5 Flash | `gemini-2.5-flash` | ✅ | ✅ |
| Gemini 3 Flash | `gemini-3-flash` | ✅ | ❌ |
| Gemini 3.1 Flash Lite | `gemini-3.1-flash-lite` | ✅ | ❌ |

### Groq
| Model | ID | Vision | Reasoning |
|---|---|---|---|
| Kimi K2 Instruct | `moonshotai/kimi-k2-instruct` | ❌ | ✅ |
| Llama 4 Scout | `meta-llama/llama-4-scout-17b-16e-instruct` | ✅ | ❌ |
| Qwen3-32B | `qwen/qwen3-32b` | ❌ | ✅ |

### Cerebras
| Model | ID | Speed |
|---|---|---|
| GPT-OSS 120B | `gpt-oss-120b` | Fastest inference anywhere |
| Llama 3.1 8B | `llama3.1-8b` | Instant responses |

### Cohere
| Model | ID | Special |
|---|---|---|
| Command A Reasoning | `command-a-reasoning-08-2025` | Exclusive reasoning |
| Command A Vision | `command-a-vision-07-2025` | Exclusive vision |
| Aya Expanse 32B | `c4ai-aya-expanse-32b` | 23+ languages |

### Mistral
| Model | ID | Vision |
|---|---|---|
| Mistral Small 3.1 | `mistral-small-2503` | ✅ |
| Mistral Large | `mistral-large-latest` | ✅ |
| Codestral | `codestral-latest` | ❌ |

### OpenRouter
| Model | ID | Special |
|---|---|---|
| Hermes 3 Llama 405B | `nousresearch/hermes-3-llama-3.1-405b` | Exclusive 405B |
| Step 3.5 Flash | `stepfun/step-3.5-flash` | Exclusive provider |
| Qwen3 Coder | `qwen/qwen3-coder` | Coding specialist |

### Cloudflare Workers AI
| Model | ID | Special |
|---|---|---|
| IBM Granite 4.0 | `@ibm/granite-3-8b-instruct` | Exclusive IBM |
| Qwen QwQ 32B | `@cf/qwen/qwq-32b` | Reasoning specialist |
| GLM 4.7 Flash | `@cf/zhipuai/glm-4-32b-0520` | Chinese AI |

---

## API Documentation

All API endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/signup` | Create account | No |
| POST | `/auth/login` | Login with email + password | No |
| POST | `/auth/verify-email` | Verify OTP code | No |
| POST | `/auth/resend-otp` | Resend verification OTP | No |
| POST | `/auth/forgot-password` | Request password reset email | No |
| POST | `/auth/reset-password` | Set new password with token | No |
| GET | `/auth/verify-reset-token/:token` | Validate reset token | No |
| POST | `/auth/google` | Authenticate with Google ID token | No |

### User

| Method | Endpoint | Description |
|---|---|---|
| GET | `/user/me` | Get current user profile |
| PATCH | `/user/me` | Update name, theme, language |
| PATCH | `/user/me/avatar` | Update avatar URL |
| PATCH | `/user/me/password` | Change password |
| DELETE | `/user/me` | Delete account |
| GET | `/user/me/preferences` | Get AI preferences |
| PUT | `/user/me/preferences` | Save AI preferences |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat/stream` | Stream AI response (SSE) |
| POST | `/chat/save-user-message` | Save user message to DB |

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/conversations` | List all conversations |
| POST | `/conversations` | Create new conversation |
| GET | `/conversations/:id` | Get conversation + messages |
| PATCH | `/conversations/:id` | Rename, pin, update models |
| DELETE | `/conversations/:id` | Delete conversation |
| DELETE | `/conversations` | Bulk delete (body: `{ ids: [] }`) |

### API Keys

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api-keys` | List saved provider keys (masked) |
| PUT | `/api-keys/:provider` | Save or update a key |
| POST | `/api-keys/:provider/test` | Test key connection |
| DELETE | `/api-keys/:provider` | Remove a key |

### Other

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload files to Cloudinary |
| POST | `/prompt-cleaner` | Improve a prompt with AI |
| POST | `/chatbot` | RAG chatbot (project queries only) |
| GET | `/messages/registry/all` | Get full model registry |
| GET | `/health` | Server health check |

### SSE Stream Format

The `/chat/stream` endpoint uses Server-Sent Events. Events sent:

```
event: start
data: {"modelId":"github-gpt-5","model":"GPT-5"}

event: token
data: {"token":"Hello","modelId":"github-gpt-5"}

event: done
data: {"modelId":"github-gpt-5","responseTimeMs":1234,"totalLength":450}

event: error
data: {"modelId":"github-gpt-5","code":"RATE_LIMIT","message":"Rate limit reached..."}
```

---

## Authentication

### Email + Password

1. User registers with name, email, password
2. A 6-digit OTP is emailed
3. User enters OTP on verify-email page
4. On success, JWT is issued and user is logged in

Passwords are hashed with bcrypt (12 salt rounds). JWTs expire in 7 days.

### Google OAuth

1. User clicks "Continue with Google"
2. Frontend receives a Google ID token
3. Backend verifies it with Google, creates or links account
4. JWT issued

**Setting up Google OAuth:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable the "Google+ API" or "Google Identity" service
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized origins: `http://localhost:3000`
6. Add authorized redirect URIs: `http://localhost:3000`
7. Copy Client ID to both `.env` files

### Setting up Gmail SMTP

1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new App Password for "Mail"
5. Use this 16-character password as `SMTP_PASSWORD`
6. Use your Gmail address as `SMTP_EMAIL`

---

## License

MIT License — free to use, modify, and distribute.

---

*MirraSync — Sync Every Mind. One Prompt.*
