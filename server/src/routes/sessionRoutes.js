import { Router } from 'express';
import { sessionManager, STEP_NAMES } from '../services/sessionManager.js';
import { generateZip, getFilePreview } from '../services/zipGenerator.js';
import { geminiRateLimit } from '../middleware/rateLimit.js';
import { getQueue } from '../queue/index.js';

const router = Router();
// Get queue lazily so it doesn't connect on import
const getJobQueue = () => getQueue();

// ── Create Session (no API key required — server owns the keys) ───
router.post('/session/start', async (req, res, next) => {
  try {
    const session = await sessionManager.create();
    res.json({
      sessionId: session.id,
      currentStep: session.currentStep,
      totalSteps: session.totalSteps,
      stepNames: session.stepNames
    });
  } catch (error) {
    next(error);
  }
});

// ── Get Session Status ───────────────────────────────────────
router.get('/session/:id/status', async (req, res, next) => {
  try {
    const session = await sessionManager.get(req.params.id);
    const progress = await sessionManager.getProgress(req.params.id);
    res.json({ ...progress, answers: session.answers, status: session.status });
  } catch (error) {
    next(error);
  }
});

// ── Submit Answer → Queues Gemini job → returns jobId ────────
router.post('/session/:id/answer', geminiRateLimit, async (req, res, next) => {
  try {
    const { stepIndex, answer } = req.body;
    const session = await sessionManager.get(req.params.id);

    if (stepIndex < 0 || stepIndex >= STEP_NAMES.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }

    // Save the raw answer immediately
    await sessionManager.saveAnswer(req.params.id, stepIndex, answer);

    const stepName = STEP_NAMES[stepIndex];

    // Build context from previous identity answers
    const existingContext = {
      name: session.answers.identity?.name || 'User',
      role: session.answers.identity?.role || '',
      company: session.answers.identity?.company || ''
    };

    // Enqueue Gemini job with proper options
    const job = await getJobQueue().add(
      `step-${stepName}`,
      { sessionId: req.params.id, stepName, answer, existingContext },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 45000,
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );

    const progress = await sessionManager.getProgress(req.params.id);
    res.json({ success: true, stepName, jobId: job.id, ...progress });
  } catch (error) {
    next(error);
  }
});

// ── Job Status Endpoint (frontend polls this) ────────────────
router.get('/session/:id/job/:jobId', async (req, res, next) => {
  try {
    const job = await getJobQueue().getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found', state: 'not_found' });
    }

    const state = await job.getState();     // waiting | active | completed | failed
    const progress = job.progress;
    const result = job.returnvalue;
    const failReason = job.failedReason;

    res.json({ jobId: job.id, state, progress, result, failReason });
  } catch (error) {
    next(error);
  }
});

// ── Preview Generated Files ──────────────────────────────────
router.get('/session/:id/preview', async (req, res, next) => {
  try {
    const session = await sessionManager.get(req.params.id);
    const preview = getFilePreview(session);
    res.json(preview);
  } catch (error) {
    next(error);
  }
});

// ── Get specific file preview ────────────────────────────────
router.get('/session/:id/file', async (req, res, next) => {
  try {
    const session = await sessionManager.get(req.params.id);
    const preview = getFilePreview(session);
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Missing ?path= query parameter' });
    const file = preview.files[filePath];
    if (!file) return res.status(404).json({ error: 'File not found in preview' });
    res.json(file);
  } catch (error) {
    next(error);
  }
});

// ── Download ZIP ─────────────────────────────────────────────
router.get('/session/:id/download', async (req, res, next) => {
  try {
    const session = await sessionManager.get(req.params.id);
    await generateZip(session, res);
  } catch (error) {
    next(error);
  }
});

// ── Regenerate Specific Step ─────────────────────────────────
router.post('/session/:id/regenerate-step', geminiRateLimit, async (req, res, next) => {
  try {
    const { stepIndex } = req.body;
    const session = await sessionManager.get(req.params.id);
    const stepName = STEP_NAMES[stepIndex];
    const answer = session.answers[stepName];

    if (!answer) {
      return res.status(400).json({ error: 'No answer found for this step.' });
    }

    const existingContext = {
      name: session.answers.identity?.name || 'User',
      role: session.answers.identity?.role || '',
      company: session.answers.identity?.company || ''
    };

    const job = await getJobQueue().add(
      `regen-${stepName}`,
      { sessionId: req.params.id, stepName, answer, existingContext },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 45000,
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );

    res.json({ success: true, stepName, jobId: job.id });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRoutes };
