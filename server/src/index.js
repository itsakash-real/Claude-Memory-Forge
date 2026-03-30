import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { sessionRoutes } from './routes/sessionRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { getRedis } from './services/redis.js';

const app = express();

// CORS — allow Vercel deploys + local dev
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Global rate limiting (all API routes)
app.use('/api', rateLimit);

// Routes
app.use('/api', sessionRoutes);

// ── Environment Validation ──────────────────────────────────────
if (!process.env.GEMINI_KEY_1) {
  console.error('🚨 CRITICAL: GEMINI_KEY_1 missing from environment variables!');
  console.error('   Get key: https://aistudio.google.com/apikey');
  console.error('   Local: Copy server/.env.example → server/.env and add GEMINI_KEY_1');
  console.error('   Vercel: vercel.com/[project]/settings/env → Add GEMINI_KEY_1');
  if (process.env.VERCEL === '1') {
    throw new Error('🚫 Missing GEMINI_KEY_1 environment variable');
  } else {
    console.warn('⚠️  Continuing in dev mode without Gemini (will crash on /answer)');
  }
}

const redisStatus = getRedis() ? '✅ UPSTASH_REDIS Connected' : '⚠️  Memory fallback - set UPSTASH_REDIS_REST_URL/TOKEN';
console.log(`[Startup] Gemini ready: ${!!process.env.GEMINI_KEY_1}, Redis: ${redisStatus}`);

// ── Enhanced Health Check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeys: !!process.env.GEMINI_KEY_1,
    redis: !!getRedis(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  };
  res.json(health);
});

// Error handling
app.use(errorHandler);

// Start server only in non-serverless environments
const PORT = process.env.PORT || 3001;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🔥 ClaudeForge API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });
}

export default app;
