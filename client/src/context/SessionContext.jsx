import { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

const STEP_NAMES = [
  'identity',
  'people',
  'projects', 
  'tools',
  'clients',
  'preferences',
  'glossary',
  'review'
];

const STEP_LABELS = [
  'Identity',
  'People',
  'Projects',
  'Tools',
  'Clients',
  'Preferences',
  'Glossary',
  'Review'
];

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [apiKey, setApiKey] = useState('');
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

  const value = {
    sessionId, setSessionId,
    apiKey, setApiKey,
    currentStep, setCurrentStep,
    answers, saveAnswer,
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
