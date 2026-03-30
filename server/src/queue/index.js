import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.KV_URL || 'redis://localhost:6379';

// Lazy connection — only created when actually needed
let _connection = null;
let _queue = null;

export function getConnection() {
  if (_connection) return _connection;
  _connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    family: 0, // Force IPv4 to prevent Upstash DNS resolution connection resets on Vercel
  });
  _connection.on('error', (err) => console.error('[Redis] IORedis error:', err.message));
  _connection.on('connect', () => console.log('[Redis] IORedis connected.'));
  return _connection;
}

export function getQueue() {
  if (_queue) return _queue;
  _queue = new Queue('gemini-generation', {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
  return _queue;
}

// Legacy named export for the worker (which imports connection directly)
export { getConnection as connection };
