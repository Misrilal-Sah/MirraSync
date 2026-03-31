# MirraSync

**Sync Every Mind. One Prompt.**

Run GPT-5, Gemini, Grok, DeepSeek, Llama and 30+ AI models simultaneously on the same prompt. Compare answers side-by-side in real time. 100% free.

![MirraSync](https://img.shields.io/badge/version-1.1.0-teal) ![License](https://img.shields.io/badge/license-MIT-blue) ![Models](https://img.shields.io/badge/models-32+-green) ![Providers](https://img.shields.io/badge/providers-12-orange)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Supported AI Models](#supported-ai-models)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

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
│   │   ├── server.js               # Express app entry point
│   │   ├── routes/
│   │   │   ├── auth.js             # Signup, login, OTP, Google OAuth, reset password
│   │   │   ├── user.js             # Profile, preferences, password change
│   │   │   ├── conversations.js    # CRUD for conversations
│   │   │   ├── messages.js         # Message retrieval + model registry endpoint
│   │   │   ├── apiKeys.js          # Save/test/delete user API keys
│   │   │   ├── upload.js           # Cloudinary file upload
│   │   │   ├── chat.js             # SSE streaming endpoint (main AI route)
│   │   │   ├── promptCleaner.js    # AI prompt improvement endpoint
│   │   │   └── chatbot.js          # RAG chatbot endpoint (Groq API)
│   │   ├── knowledge/
│   │   │   └── project_knowledge.txt  # RAG knowledge base for chatbot
│   │   ├── providers/
│   │   │   └── adapters.js         # All 4 provider adapters (OpenAI-compat, Google, Cohere, Cloudflare)
│   │   ├── models/
│   │   │   └── registry.js         # 24-model registry with full metadata
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication middleware
│   │   ├── services/
│   │   │   └── email.js            # Nodemailer + branded email templates
│   │   └── utils/
│   │       ├── prisma.js           # Prisma client singleton
│   │       ├── jwt.js              # JWT sign/verify helpers
│   │       └── encryption.js       # AES-256-GCM encrypt/decrypt
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (User, Conversation, Message, ApiKey, OtpToken, Prefs)
│   ├── .env.example                # Template for all environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                  # Router + route guards
│   │   ├── index.js                # React root + Toaster config
│   │   ├── styles/
│   │   │   └── globals.css         # Design tokens, custom scrollbars, animations
│   │   ├── lib/
│   │   │   ├── api.js              # Axios instance with JWT interceptors
│   │   │   └── modelRegistry.js    # Frontend mirror of model metadata
│   │   ├── stores/
│   │   │   ├── authStore.js        # Auth state (Zustand)
│   │   │   ├── chatStore.js        # Chat state: models, messages, streaming
│   │   │   └── uiStore.js          # UI state: theme, sidebar, modals
│   │   ├── pages/
│   │   │   ├── LoginPage.js        # Login with Google + credentials
│   │   │   ├── AuthPages.js        # Signup, VerifyEmail, ForgotPassword, ResetPassword
│   │   │   ├── ChatPage.js         # Main multi-model chat interface
│   │   │   └── OtherPages.js       # Landing, History, Settings
│   │   └── components/
│   │       ├── ui/
│   │       │   └── index.js        # Button, Input, Toggle, Modal, Spinner, Badge, Tooltip, Dropdown, 30+ SVG icons
│   │       ├── chat/
│   │       │   ├── ModelColumn.js  # Individual AI response column with streaming + markdown
│   │       │   ├── PromptInput.js  # Full-featured input bar (file, voice, cleaner, send)
│   │       │   └── AddModelModal.js # Searchable model picker modal
│   │       ├── ChatbotWidget.js    # Floating RAG chatbot (Groq-powered)
│   │       ├── layout/
│   │       │   └── Sidebar.js      # Collapsible sidebar with conversation list
│   │       └── settings/
│   │           └── SettingsModal.js # 5-tab settings: General, AI, Keys, Profile, Subscription
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Make sure you have installed:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **MySQL** v8 or higher — [mysql.com](https://www.mysql.com) or use [PlanetScale](https://planetscale.com) (free tier)
- **npm** v9+ (comes with Node.js)

Optional but recommended:
- **Git** for version control
- **MySQL Workbench** or **TablePlus** to inspect the database

---

## Quick Start

### Step 1 — Clone and install

```bash
# Clone the repository
git clone https://github.com/yourusername/mirrasync.git
cd mirrasync

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

### Getting a Free MySQL Database

**Option A: Local MySQL**
```bash
# macOS with Homebrew
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE mirrasync;"
```

**Option B: PlanetScale (free cloud MySQL)**
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a database named `mirrasync`
3. Get the connection string from the dashboard
4. Paste into `DATABASE_URL` in `.env`

**Option C: Railway (free tier)**
1. Sign up at [railway.app](https://railway.app)
2. New Project → Add MySQL
3. Copy the connection string to `DATABASE_URL`

---

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

## Deployment

### Deploy Backend (Railway / Render / Fly.io)

**Railway (recommended):**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# In backend folder
cd backend
railway init
railway up

# Set environment variables in Railway dashboard
# Add all variables from .env.example with real values
```

**Environment Variables for Production:**
- Change `NODE_ENV=production`
- Change `FRONTEND_URL` to your deployed frontend URL
- Change `DATABASE_URL` to your production MySQL URL (Railway or PlanetScale)
- All other env vars remain the same

### Deploy Frontend (Vercel / Netlify)

**Vercel (recommended):**
```bash
npm install -g vercel
cd frontend
vercel

# Follow prompts
# Set environment variables in Vercel dashboard:
# REACT_APP_API_URL=https://your-backend-url.railway.app/api
# REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

**Build for production:**
```bash
cd frontend
npm run build
# Output in frontend/build/ — deploy this folder
```

### Update Google OAuth for Production

1. Go back to Google Cloud Console
2. Add your production frontend URL to authorized origins
3. Add it to authorized redirect URIs as well

---

## Adding New AI Models

1. Open `backend/src/models/registry.js`
2. Add a new model object following the existing pattern:

```javascript
{
  id: 'provider-model-name',           // unique ID used in frontend
  displayName: 'Model Name',           // shown in UI
  provider: 'provider_id',             // matches PROVIDERS list
  providerLabel: 'Provider Name',      // shown in UI
  modelId: 'exact-api-model-string',  // sent to API
  supportsVision: false,
  supportsFiles: false,
  supportsReasoning: true,
  isFree: true,
  requiresUserKey: false,
  description: 'Short description',
  colorAccent: '#hexcolor',
  adapterType: 'openai_compatible',    // openai_compatible | google_ai | cohere | cloudflare
  baseUrlEnv: 'PROVIDER_BASE_URL',    // env var name
  apiKeyEnv: 'PROVIDER_API_KEY',      // env var name
  category: 'frontier',               // frontier | reasoning | fast | coding | vision | multilingual
}
```

3. Mirror the model in `frontend/src/lib/modelRegistry.js`
4. Add the API key env var to `backend/.env.example` and your `.env`

---

## Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` format: `mysql://user:password@host:3306/dbname`
- Make sure MySQL is running: `brew services list` (macOS) or `sudo systemctl status mysql` (Linux)
- Try running `npx prisma db push` from the backend folder

### "Email not sending"
- Make sure you're using a **Gmail App Password**, not your regular Gmail password
- 2-Step Verification must be enabled on your Google account
- Check spam folder for test emails
- Verify `SMTP_EMAIL` matches the Google account you generated the app password for

### "Google login not working"
- Make sure `REACT_APP_GOOGLE_CLIENT_ID` in `frontend/.env` matches `GOOGLE_CLIENT_ID` in `backend/.env`
- Authorized origins must include `http://localhost:3000` exactly (no trailing slash)
- In the browser console, look for "Invalid origin" errors

### "AI models returning errors"
- Check the `.env` file has the correct API keys
- Verify the keys are not expired or over rate limits
- Check the backend console for detailed error messages
- Some models (like Gemini 3 Flash) may not be available yet — try a different model

### "File upload not working"
- Make sure Cloudinary credentials are set in `.env`
- Check the file size is under 10MB
- Check the file type is supported (jpg, png, webp, gif, pdf, txt, md, csv, docx)

### "Port already in use"
```bash
# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change the port in backend/.env
PORT=5001
```

### Testing on Mobile (same WiFi)
```bash
# Start frontend with network access:
HOST=0.0.0.0 npm start
# or on Windows:
set HOST=0.0.0.0 && npm start

# Find your PC IP:
# Windows: ipconfig → Wi-Fi IPv4
# macOS/Linux: ifconfig | grep inet

# Access from phone:
# Frontend: http://<YOUR_IP>:3000
# Backend: http://<YOUR_IP>:5000

# Note: Update frontend .env to use your IP instead of localhost:
# REACT_APP_API_URL=http://<YOUR_IP>:5000/api
```

### Prisma errors after schema changes
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## Scripts Reference

### Backend
```bash
npm run dev       # Start with nodemon (auto-restart on changes)
npm start         # Start production server
npm run db:push   # Push schema to database
npm run db:studio # Open Prisma database browser
```

### Frontend
```bash
npm start         # Start development server (http://localhost:3000)
npm run build     # Build for production
npm test          # Run tests
```

---

## License

MIT License — free to use, modify, and distribute.

---

## Credits

Built with:
- [React](https://react.dev) — UI framework
- [Express.js](https://expressjs.com) — Backend framework
- [Prisma](https://prisma.io) — Database ORM
- [Framer Motion](https://framer.com/motion) — Animations
- [Zustand](https://zustand-demo.pmnd.rs) — State management
- [React Markdown](https://github.com/remarkjs/react-markdown) — Markdown rendering
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) — Code blocks
- [react-hot-toast](https://react-hot-toast.com) — Toast notifications

AI providers: GitHub Models, Google AI Studio, Groq, Cerebras, Cohere, Mistral, OpenRouter, Cloudflare Workers AI

---

*MirraSync — Sync Every Mind. One Prompt.*
