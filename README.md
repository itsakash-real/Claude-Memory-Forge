<div align="center">
  
# ⬡ Claude Memory Forge

**A persistent memory generator for Claude Code.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fitsakash-real%2FClaude-Memory-Forge)
[![Follow on X](https://img.shields.io/twitter/follow/its_akashreal?style=social)](https://x.com/its_akashreal)
<br/>
[![React](https://img.shields.io/badge/React-19-000000?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-000000?style=flat&logo=vite&logoColor=646CFF)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-Serverless-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-000000?style=flat&logo=redis&logoColor=FF4438)](https://upstash.com/)
[![Gemini API](https://img.shields.io/badge/Google-Gemini_AI-000000?style=flat&logo=google&logoColor=4285F4)](https://ai.google.dev/)

*Stop re-explaining your stack and conventions every time you start a new CLI session.*

<br />


</div>

---

## ⚡ The Problem

Claude Code inherently resets its context between CLI sessions, requiring developers to repeatedly explain their role, team structure, and project conventions. 

**Memory Forge** solves this by utilizing the Gemini API to orchestrate a personalized, file-based memory system (`.claude/` directory). Once generated, Claude Code automatically reads this architecture at initialization, achieving persistent memory across all sessions.

## 🏗️ Architecture

This project is a monorepo designed specifically for **Vercel Serverless** deployment.

- **Frontend**: React 19 + Vite (`/client`) -> *Compiled to static assets*
- **Backend / API**: Express.js (`/server`) -> *Ported to Vercel Serverless (`/api/index.js`)*
- **Storage & State**: Upstash Redis (Serverless) -> *Session management and rate-limiting*
- **Generator Engine**: Google Gemini API via `@google/generative-ai` -> *Intelligence engine*

## 📂 Project Structure

```text
Claude-Memory-Forge/
├── client/           # React frontend (Vite)
│   ├── src/pages/    # Landing and Wizard steps
│   └── src/index.css # Design system & tokens (Matte Black / Amber)
├── server/           # Express backend
│   ├── src/routes/   # Session & Generation endpoints
│   ├── src/services/ # Gemini engine, ZIP generator
│   └── src/index.js  # Local express entry point
├── api/              # Vercel Serverless entry point (api/index.js)
├── vercel.json       # Vercel build & route configuration
└── package.json      
```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- A Google Gemini API Key
- *(Optional)* An Upstash Redis database url for session persistence. Without this, the server falls back to an in-memory `Map`.

### Installation

1. Install dependencies for all workspaces:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Configure environment variables in `server/.env`:
   ```env
   # Required for local testing of backend
   PORT=3001
   
   # Optional: For distributed session tracking & rate limiting
   # Get from console.upstash.com
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

3. Start the backend:
   ```bash
   cd server && npm run dev
   # Runs on http://localhost:3001
   ```

4. Start the frontend:
   ```bash
   cd client && npm run dev
   # Runs on http://localhost:5173
   ```

## 🚀 Vercel Deployment

The repository is pre-configured for Vercel. 

1. Import the repository in the Vercel Dashboard.
2. In the setup wizard, add the following Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   <br/>*(Without Redis, session data will be lost between serverless function invocations).*
3. Deploy.

**Vercel processes:**
- **Build command:** `cd server && npm install && cd ../client && npm install && npm run build` *(Handled automatically by `vercel.json`)*.
- **Output:** The React app is served as static files (`client/dist`). API requests to `/api/*` are intelligently routed to the Express application bundled as a Serverless Function.

## 🔒 Data & Privacy

This application is strictly stateless beyond the active session window.
- **No Database:** Generated files are temporarily mapped to a UUID session ID in Redis.
- **Auto-Expiry:** Redis keys are set to expire completely after **2 hours**.
- **Keys:** The user's Gemini API key is heavily restricted. It is supplied from the client on a per-request basis, used immediately by the backend, and **never logged or stored**.

---
<div align="center">
  <sub>Built for the Claude Code CLI. Open source.</sub>
</div>
