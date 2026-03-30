import { Router } from 'express';
import { sessionManager, STEP_NAMES } from '../services/sessionManager.js';
import { generateZip, getFilePreview } from '../services/zipGenerator.js';
import { geminiRateLimit } from '../middleware/rateLimit.js';
import { processStep } from '../services/geminiService.js';

const router = Router();

// ── Create Session ───────────────────────────────────────────
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

// ── Submit Answer → Process with Gemini synchronously ────────
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
      name: session.answers.identity?.name || answer?.name || 'User',
      role: session.answers.identity?.role || answer?.role || '',
      company: session.answers.identity?.company || answer?.company || ''
    };

    // Process with Gemini synchronously
    const refinedData = await processStep(stepName, answer, existingContext);

    // Store refined sections in the session
    for (const [key, value] of Object.entries(refinedData)) {
      await sessionManager.saveRefinedSection(req.params.id, key, value);
    }

    const progress = await sessionManager.getProgress(req.params.id);
    res.json({
      success: true,
      stepName,
      refinedKeys: Object.keys(refinedData),
      ...progress
    });
  } catch (error) {
    console.error(`[Route] Step processing failed:`, error.message);
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

    // Process with Gemini synchronously
    const refinedData = await processStep(stepName, answer, existingContext);

    // Store refined sections
    for (const [key, value] of Object.entries(refinedData)) {
      await sessionManager.saveRefinedSection(req.params.id, key, value);
    }

    res.json({ success: true, stepName, refinedKeys: Object.keys(refinedData) });
  } catch (error) {
    console.error(`[Route] Regeneration failed:`, error.message);
    next(error);
  }
});

export { router as sessionRoutes };
