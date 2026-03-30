import { v4 as uuidv4 } from 'uuid';
import { getRedis } from './redis.js';

const STEP_NAMES = [
  'identity', 'people', 'projects', 'tools',
  'clients', 'preferences', 'glossary', 'review'
];

const SESSION_TTL = 7200; // 2 hours in seconds

// ─── In-Memory Fallback (for local dev without Redis) ───
class MemoryStore {
  constructor() { this.store = new Map(); }
  async get(key) { return this.store.get(key) || null; }
  async set(key, value, opts) { this.store.set(key, value); }
  async del(key) { this.store.delete(key); }
  async keys(pattern) {
    const prefix = pattern.replace('*', '');
    return [...this.store.keys()].filter(k => k.startsWith(prefix));
  }
}

// ─── Session Manager (Redis-backed, in-memory fallback) ───
class SessionManager {
  constructor() {
    this._store = null;
    this._isRedis = false;
  }

  _getStore() {
    if (this._store) return this._store;
    const redis = getRedis();
    if (redis) {
      this._store = redis;
      this._isRedis = true;
      console.log('✅ Using Upstash Redis for session storage');
    } else {
      this._store = new MemoryStore();
      this._isRedis = false;
      console.log('📦 Using in-memory session storage (local dev)');
    }
    return this._store;
  }

  _key(id) { return `session:${id}`; }

  async create() {
    const store = this._getStore();
    const id = uuidv4();
    const session = {
      id,
      currentStep: 0,
      totalSteps: STEP_NAMES.length,
      stepNames: STEP_NAMES,
      answers: {},
      generatedFiles: {},
      refinedSections: {},
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (this._isRedis) {
      await store.set(this._key(id), JSON.stringify(session), { ex: SESSION_TTL });
    } else {
      await store.set(this._key(id), session);
    }
    return session;
  }

  async get(id) {
    const store = this._getStore();
    let session;
    if (this._isRedis) {
      const raw = await store.get(this._key(id));
      session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } else {
      session = await store.get(this._key(id));
    }
    if (!session) {
      const error = new Error('Session not found or expired');
      error.name = 'SessionNotFound';
      throw error;
    }
    return session;
  }

  async _save(id, session) {
    const store = this._getStore();
    session.updatedAt = Date.now();
    if (this._isRedis) {
      await store.set(this._key(id), JSON.stringify(session), { ex: SESSION_TTL });
    } else {
      await store.set(this._key(id), session);
    }
  }

  async update(id, updates) {
    const session = await this.get(id);
    Object.assign(session, updates);
    await this._save(id, session);
    return session;
  }

  async saveAnswer(id, stepIndex, answer) {
    const session = await this.get(id);
    const stepName = STEP_NAMES[stepIndex];
    session.answers[stepName] = answer;
    session.currentStep = Math.max(session.currentStep, stepIndex + 1);
    await this._save(id, session);
    return session;
  }

  async saveGeneratedFile(id, filePath, content) {
    const session = await this.get(id);
    session.generatedFiles[filePath] = content;
    await this._save(id, session);
    return session;
  }

  async saveRefinedSection(id, sectionKey, content) {
    const session = await this.get(id);
    session.refinedSections[sectionKey] = content;
    await this._save(id, session);
    return session;
  }

  async getProgress(id) {
    const session = await this.get(id);
    return {
      currentStep: session.currentStep,
      totalSteps: session.totalSteps,
      stepNames: session.stepNames,
      completedSteps: Object.keys(session.answers),
      percentage: Math.round((Object.keys(session.answers).length / session.totalSteps) * 100)
    };
  }

  async delete(id) {
    const store = this._getStore();
    await store.del(this._key(id));
  }
}

export const sessionManager = new SessionManager();
export { STEP_NAMES };
