import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

export default function PreferencesStep() {
  const { sessionId, answers, saveAnswer, nextStep, prevStep, setLoading, setLoadingMessage, setError } = useSession();

  const saved = answers.preferences || {};
  const [communicationStyle, setCommunicationStyle] = useState(saved.communicationStyle || '');
  const [technicalLevel, setTechnicalLevel] = useState(saved.technicalLevel || 'intermediate');
  const [workflowHabits, setWorkflowHabits] = useState(saved.workflowHabits || '');
  const [trackingPreferences, setTrackingPreferences] = useState(saved.trackingPreferences || '');
  const [decayPreference, setDecayPreference] = useState(saved.decayPreference || 'default');
  const [additionalPrefs, setAdditionalPrefs] = useState(saved.additionalPrefs || '');

  async function handleNext() {
    const answer = {
      communicationStyle, technicalLevel, workflowHabits,
      trackingPreferences, decayPreference, additionalPrefs
    };
    saveAnswer('preferences', answer);

    setLoading(true);
    setLoadingMessage('Calibrating your preferences...');

    try {
      await api.submitAnswer(sessionId, 5, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 6 of 8 — Preferences</div>
      <h2 className="step-title">Your Preferences</h2>
      <p className="step-subtitle">
        How do you like Claude to interact with you? These preferences shape its personality and behavior.
      </p>

      <div>
        <div className="form-group">
          <label className="form-label">Communication Style</label>
          <div className="mono-small" style={{ marginBottom: '8px' }}>How should Claude talk to you?</div>
          <select value={communicationStyle} onChange={e => setCommunicationStyle(e.target.value)}>
            <option value="">Select...</option>
            <option value="concise">Concise — Get to the point, minimal explanation</option>
            <option value="detailed">Detailed — Explain reasoning and trade-offs</option>
            <option value="friendly">Friendly — Warm and conversational tone</option>
            <option value="professional">Professional — Formal and structured</option>
            <option value="technical">Technical — Dense, assumes expertise</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Workflow Habits</label>
          <textarea
            placeholder="I usually work in 2-hour deep work blocks. I prefer PRs over direct commits. I like to plan before coding..."
            value={workflowHabits}
            onChange={e => setWorkflowHabits(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">What should Claude track?</label>
          <div className="mono-small" style={{ marginBottom: '8px' }}>What areas of your life should the memory system focus on?</div>
          <textarea
            placeholder="Projects, team interactions, deadlines, code decisions, tool preferences..."
            value={trackingPreferences}
            onChange={e => setTrackingPreferences(e.target.value)}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Memory Decay Speed</label>
          <div className="mono-small" style={{ marginBottom: '12px' }}>How quickly should unused memories fade?</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { value: 'slow', label: '🐢 Slow', desc: 'Remembers longer' },
              { value: 'default', label: '⚖️ Default', desc: 'Balanced decay' },
              { value: 'fast', label: '🐇 Fast', desc: 'Forgets quicker' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setDecayPreference(opt.value)}
                className="card"
                style={{
                  flex: 1, 
                  padding: '16px', 
                  cursor: 'pointer', 
                  textAlign: 'center',
                  borderColor: decayPreference === opt.value ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: decayPreference === opt.value ? 'var(--accent-dim2)' : 'var(--bg2)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>{opt.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text2)' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Any other preferences?</label>
          <textarea
            placeholder="Always use TypeScript over JavaScript. Never auto-format my code. Run tests before committing..."
            value={additionalPrefs}
            onChange={e => setAdditionalPrefs(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Glossary
        </button>
      </div>
    </div>
  );
}
