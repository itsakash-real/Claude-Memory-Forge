import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '../services/redis.js';

let limiter = null;

function getLimiter() {
  if (limiter) return limiter;
  const redis = getRedis();
  if (!redis) return null; // No rate limiting in local dev without Redis

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
    analytics: true,
    prefix: 'ratelimit:api',
  });
  return limiter;
}

export function rateLimit(req, res, next) {
  const rl = getLimiter();
  if (!rl) return next(); // Skip in local dev

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

  rl.limit(ip)
    .then(({ success, limit, remaining, reset }) => {
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', reset);

      if (!success) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please slow down and try again in a moment.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        });
      }
      next();
    })
    .catch((err) => {
      console.error('Rate limit error:', err.message);
      next(); // Fail open — don't block requests if rate limiter fails
    });
}

// Stricter limiter for expensive Gemini API calls (10 per minute)
let geminiLimiter = null;

function getGeminiLimiter() {
  if (geminiLimiter) return geminiLimiter;
  const redis = getRedis();
  if (!redis) return null;

  geminiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 Gemini calls per minute per IP
    analytics: true,
    prefix: 'ratelimit:gemini',
  });
  return geminiLimiter;
}

export function geminiRateLimit(req, res, next) {
  const rl = getGeminiLimiter();
  if (!rl) return next();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

  rl.limit(ip)
    .then(({ success, remaining, reset }) => {
      if (!success) {
        return res.status(429).json({
          error: 'Gemini API rate limit exceeded',
          message: 'Too many AI generation requests. Please wait a moment before submitting.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        });
      }
      next();
    })
    .catch((err) => {
      console.error('Gemini rate limit error:', err.message);
      next();
    });
}
