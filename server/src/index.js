import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionRoutes } from './routes/sessionRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

dotenv.config();

const app = express();

// CORS — allow Vercel deploys + local dev
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost and any .vercel.app domain
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
