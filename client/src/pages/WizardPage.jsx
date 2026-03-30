import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

import Header from '../components/Header';
import PreviewPanel from '../components/PreviewPanel';

import IdentityStep from '../steps/IdentityStep';
import PeopleStep from '../steps/PeopleStep';
import ProjectsStep from '../steps/ProjectsStep';
import ToolsStep from '../steps/ToolsStep';
import ClientsStep from '../steps/ClientsStep';
import PreferencesStep from '../steps/PreferencesStep';
import GlossaryStep from '../steps/GlossaryStep';
import ReviewStep from '../steps/ReviewStep';

const STEP_COMPONENTS = [
  IdentityStep, PeopleStep, ProjectsStep, ToolsStep,
  ClientsStep, PreferencesStep, GlossaryStep, ReviewStep
];

export default function WizardPage() {
  const navigate = useNavigate();
  const { sessionId, setSessionId, currentStep, setAnswers, setCurrentStep, loading, loadingMessage, error, clearError } = useSession();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        let activeSessionId = sessionId;
        
        if (!activeSessionId) {
          activeSessionId = localStorage.getItem('claudeforge_sessionId');
        }

        if (activeSessionId) {
          try {
            const status = await api.getStatus(activeSessionId);
            if (!isMounted) return;
            setSessionId(activeSessionId);
            setAnswers(status.answers || {});
            if (Object.keys(status.answers || {}).length > 0) {
               setCurrentStep(status.currentStep || 0);
            }
            setRestoring(false);
            return;
          } catch (err) {
            localStorage.removeItem('claudeforge_sessionId');
            setSessionId(null);
            activeSessionId = null;
          }
        }
        
        if (!activeSessionId) {
          const s = await api.startSession();
          localStorage.setItem('claudeforge_sessionId', s.sessionId);
          if (!isMounted) return;
          setSessionId(s.sessionId);
          setRestoring(false);
        }
      } catch (err) {
        console.error('Failed to init session:', err);
        if (isMounted) navigate('/');
      }
    }
    
    if (restoring) {
      initSession();
    }
    return () => { isMounted = false; };
  }, [restoring, sessionId, setSessionId, setAnswers, setCurrentStep, navigate]);

  if (restoring || !sessionId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg)' }}>
      <Header />
      
      <div className="responsive-flex" style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Wizard Area */}
        <div className="wizard-area" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 64px 100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <div style={{ width: '100%', maxWidth: '580px', position: 'relative' }}>
            <div key={currentStep} className="animate-step">
              <StepComponent />
            </div>
          </div>
        </div>

        <PreviewPanel />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 5, 5, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '20px'
        }}>
          {/* Animated ring */}
          <div style={{ position: 'relative', width: '48px', height: '48px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px solid var(--border2)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
              boxShadow: '0 0 20px var(--accent-glow)'
            }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)' }}>
            {loadingMessage || 'Generating content...'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', animation: 'blink 1s infinite' }} />
            calling gemini api
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="toast-container">
        {error && (
          <div className="toast" onClick={clearError}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
            <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>Click to dismiss</div>
          </div>
        )}
      </div>
    </div>
  );
}
