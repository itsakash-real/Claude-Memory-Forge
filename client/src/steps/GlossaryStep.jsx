import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

export default function GlossaryStep() {
  const { sessionId, answers, saveAnswer, nextStep, prevStep, setLoading, setLoadingMessage, setError } = useSession();
  
  const saved = answers.glossary?.terms || [];
  const [terms, setTerms] = useState(saved.length > 0 ? saved : []);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');

  function addTerm() {
    if (newTerm.trim() && newDef.trim()) {
      setTerms(prev => [...prev, { term: newTerm.trim(), definition: newDef.trim() }]);
      setNewTerm('');
      setNewDef('');
    }
  }

  function removeTerm(index) {
    setTerms(prev => prev.filter((_, i) => i !== index));
  }

  async function handleNext() {
    const answer = { terms };
    saveAnswer('glossary', answer);

    setLoading(true);
    setLoadingMessage('Compiling your glossary...');

    try {
      await api.submitAnswer(sessionId, 6, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 7 of 8 — Glossary</div>
      <h2 className="step-title">Glossary & Terms</h2>
      <p className="step-subtitle">
        Domain-specific terms, abbreviations, or jargon that Claude should know. Optional but helpful.
      </p>

      <div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Term</label>
            <input placeholder="API" value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTerm()} />
          </div>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label className="form-label">Definition</label>
            <input placeholder="Application Programming Interface" value={newDef} onChange={e => setNewDef(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTerm()} />
          </div>
          <button className="btn-secondary" onClick={addTerm}>
            Add
          </button>
        </div>

        {terms.length > 0 ? (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Term</th>
                  <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Definition</th>
                  <th style={{ width: '40px' }} />
                </tr>
              </thead>
              <tbody>
                {terms.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>{t.term}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text2)' }}>{t.definition}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button className="tag-remove" onClick={() => removeTerm(idx)} style={{ fontSize: '16px' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            No terms added yet. This step is optional.
          </div>
        )}
      </div>

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => { saveAnswer('glossary', { terms: [] }); nextStep(); }}>
            Skip
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Finish building →
          </button>
        </div>
      </div>
    </div>
  );
}
