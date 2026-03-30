import { Worker } from 'bullmq';
import { getConnection } from './index.js';
import * as gemini from '../services/geminiService.js';
import { sessionManager } from '../services/sessionManager.js';

const worker = new Worker(
  'gemini-generation',
  async (job) => {
    const { sessionId, stepName, answer, existingContext } = job.data;
    console.log(`[Worker] Job ${job.id}: processing step "${stepName}" for session ${sessionId}`);

    let refinedData = {};
    switch (stepName) {
      case 'identity':
        refinedData = await gemini.refineIdentity(answer);
        break;
      case 'people':
        refinedData = await gemini.refinePeople(answer, existingContext);
        break;
      case 'projects':
        refinedData = await gemini.refineProjects(answer, existingContext);
        break;
      case 'tools':
        refinedData = await gemini.refineTools(answer, existingContext);
        break;
      case 'clients':
        refinedData = await gemini.refineClients(answer, existingContext);
        break;
      case 'preferences':
        refinedData = await gemini.refinePreferences(answer, existingContext);
        break;
      case 'glossary':
        refinedData = await gemini.refineGlossary(answer, existingContext);
        break;
      case 'review':
        break;
    }

    // Store refined sections in the session (Redis or in-memory)
    for (const [key, value] of Object.entries(refinedData)) {
      await sessionManager.saveRefinedSection(sessionId, key, value);
    }

    return { success: true, stepName, refinedKeys: Object.keys(refinedData) };
  },
  {
    connection: getConnection(),
    concurrency: 3,  // Max 3 Gemini calls in-flight at once
  }
);

worker.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} ✅ completed. Keys: ${result.refinedKeys?.join(', ')}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} ❌ failed: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err.message);
});

export default worker;
