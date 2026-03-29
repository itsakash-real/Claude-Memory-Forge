import { Redis } from '@upstash/redis';

let redis = null;

export function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('⚠️  Upstash Redis not configured — using in-memory fallback');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}
