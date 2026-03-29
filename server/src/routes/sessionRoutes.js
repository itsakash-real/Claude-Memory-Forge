import { Router } from 'express';
import { sessionManager, STEP_NAMES } from '../services/sessionManager.js';
import * as gemini from '../services/geminiService.js';
import { generateZip, getFilePreview } from '../services/zipGenerator.js';
import { geminiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// ── Validate API Key ─────────────────────────────────────────
router.post('/validate-key', async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    const result = await gemini.validateApiKey(apiKey);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── Create Session ───────────────────────────────────────────
router.post('/session/start', async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key is required' });
    }
    const session = await sessionManager.create(apiKey);
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
    res.json({
      ...progress,
      answers: session.answers,
      status: session.status
    });
  } catch (error) {
    next(error);
  }
});

// ── Submit Answer for Step ───────────────────────────────────
router.post('/session/:id/answer', geminiRateLimit, async (req, res, next) => {
  try {
    const { stepIndex, answer } = req.body;
    const session = await sessionManager.get(req.params.id);
    const apiKey = session.geminiApiKey;

    if (stepIndex < 0 || stepIndex >= STEP_NAMES.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }

    // Save the answer
    await sessionManager.saveAnswer(req.params.id, stepIndex, answer);

    // Build context from previous answers
    const existingContext = {
      name: session.answers.identity?.name || 'User',
      role: session.answers.identity?.role || '',
      company: session.answers.identity?.company || ''
    };

    // Call Gemini to refine the relevant templates
    const stepName = STEP_NAMES[stepIndex];
    let refinedData = {};

    try {
      switch (stepName) {
        case 'identity':
          refinedData = await gemini.refineIdentity(apiKey, answer);
          break;
        case 'people':
          refinedData = await gemini.refinePeople(apiKey, answer, existingContext);
          break;
        case 'projects':
          refinedData = await gemini.refineProjects(apiKey, answer, existingContext);
          break;
        case 'tools':
          refinedData = await gemini.refineTools(apiKey, answer, existingContext);
          break;
        case 'clients':
          refinedData = await gemini.refineClients(apiKey, answer, existingContext);
          break;
        case 'preferences':
          refinedData = await gemini.refinePreferences(apiKey, answer, existingContext);
          break;
        case 'glossary':
          refinedData = await gemini.refineGlossary(apiKey, answer, existingContext);
          break;
        case 'review':
          break;
      }
    } catch (error) {
      console.error(`⚠️ Gemini refinement failed for step ${stepName}:`, error.message);
      refinedData = {};
    }

    // Save refined sections
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
    if (!filePath) {
      return res.status(400).json({ error: 'Missing ?path= query parameter' });
    }
    const file = preview.files[filePath];
    if (!file) {
      return res.status(404).json({ error: 'File not found in preview' });
    }
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
      return res.status(400).json({ error: 'No answer found for this step. Please complete the step first.' });
    }

    const existingContext = {
      name: session.answers.identity?.name || 'User',
      role: session.answers.identity?.role || '',
      company: session.answers.identity?.company || ''
    };

    const apiKey = session.geminiApiKey;
    let refinedData = {};

    switch (stepName) {
      case 'identity':
        refinedData = await gemini.refineIdentity(apiKey, answer);
        break;
      case 'people':
        refinedData = await gemini.refinePeople(apiKey, answer, existingContext);
        break;
      case 'projects':
        refinedData = await gemini.refineProjects(apiKey, answer, existingContext);
        break;
      case 'tools':
        refinedData = await gemini.refineTools(apiKey, answer, existingContext);
        break;
      case 'clients':
        refinedData = await gemini.refineClients(apiKey, answer, existingContext);
        break;
      case 'preferences':
        refinedData = await gemini.refinePreferences(apiKey, answer, existingContext);
        break;
      case 'glossary':
        refinedData = await gemini.refineGlossary(apiKey, answer, existingContext);
        break;
    }

    for (const [key, value] of Object.entries(refinedData)) {
      await sessionManager.saveRefinedSection(req.params.id, key, value);
    }

    res.json({
      success: true,
      stepName,
      refinedKeys: Object.keys(refinedData)
    });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRoutes };
