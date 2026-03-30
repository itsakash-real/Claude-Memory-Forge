import { createContext, useContext, useState, useCallback } from 'react';
import { api, pollJobUntilDone } from '../services/api';

const SessionContext = createContext(null);

const STEP_NAMES = [
  'identity', 'people', 'projects', 'tools',
  'clients', 'preferences', 'glossary', 'review'
];

const STEP_LABELS = [
  'Identity', 'People', 'Projects', 'Tools',
  'Clients', 'Preferences', 'Glossary', 'Review'
];

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [refinedKeys, setRefinedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const saveAnswer = useCallback((stepName, answer) => {
    setAnswers(prev => ({ ...prev, [stepName]: answer }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, STEP_NAMES.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Submit an answer: enqueue job → poll until done
  const submitAndPoll = useCallback(async (stepIndex, answer) => {
    if (!sessionId) throw new Error('No active session');
    setLoading(true);
    setLoadingMessage('Queuing your request...');
    try {
      // Enqueue job on the server
      const { jobId, stepName } = await api.submitAnswer(sessionId, stepIndex, answer);

      setLoadingMessage(`AI is generating your ${stepName} files...`);

      // Poll until the worker finishes
      await pollJobUntilDone(sessionId, jobId, {
        intervalMs: 3000,
        onStateChange: (state) => {
          if (state === 'active') setLoadingMessage('AI is actively generating your files...');
          if (state === 'waiting') setLoadingMessage('Job is queued, waiting to start...');
        }
      });

      saveAnswer(STEP_NAMES[stepIndex], answer);
      return { success: true };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [sessionId, saveAnswer]);

  // Import full profile (bulk submit without API key)
  const importProfile = useCallback(async (profileData) => {
    if (!sessionId) throw new Error('No active session to import into.');
    setLoading(true);
    setLoadingMessage('Synchronizing profile data...');
    try {
      for (let i = 0; i < STEP_NAMES.length - 1; i++) {
        const step = STEP_NAMES[i];
        if (profileData[step]) {
          const { jobId } = await api.submitAnswer(sessionId, i, profileData[step]);
          await pollJobUntilDone(sessionId, jobId, { intervalMs: 3000 });
        }
      }
      setAnswers(profileData);
    } catch (err) {
      throw new Error('Failed to import profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const value = {
    sessionId, setSessionId,
    currentStep, setCurrentStep,
    answers, saveAnswer, submitAndPoll, importProfile,
    refinedKeys, setRefinedKeys,
    loading, setLoading,
    loadingMessage, setLoadingMessage,
    error, setError, clearError,
    preview, setPreview,
    nextStep, prevStep, goToStep,
    stepNames: STEP_NAMES,
    stepLabels: STEP_LABELS,
    totalSteps: STEP_NAMES.length
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
}
