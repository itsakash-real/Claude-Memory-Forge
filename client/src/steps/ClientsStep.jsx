import { useState } from 'react';
import { useSession } from '../context/SessionContext';

const EMPTY_CLIENT = { name: '', context: '', industry: '', relationship: '' };

export default function ClientsStep() {
  const { answers, saveAnswer, submitAndPoll, nextStep, prevStep, setError } = useSession();
  
  const saved = answers.clients?.clients || [];
  const [clients, setClients] = useState(saved.length > 0 ? saved : []);
  const [showForm, setShowForm] = useState(saved.length > 0);

  function addClient() {
    setClients(prev => [...prev, { ...EMPTY_CLIENT }]);
    setShowForm(true);
  }

  function removeClient(index) {
    setClients(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setShowForm(false);
      return next;
    });
  }

  function updateClient(index, field, value) {
    setClients(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }

  async function handleNext() {
    const validClients = clients.filter(c => c.name.trim());
    const answer = { clients: validClients };
    try {
      await submitAndPoll(4, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 5 of 8 — Clients</div>
      <h2 className="step-title">Your Clients</h2>
      <p className="step-subtitle">
        Do you work with external clients? This step is optional — skip if not applicable.
      </p>

      {!showForm && clients.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '24px', padding: '40px 0' }}>
          <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            No clients added yet.
          </div>
          <button className="btn-secondary" onClick={addClient}>
            + Add First Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {clients.map((client, idx) => (
            <div key={idx} className="card animate-step">
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>
                  CLIENT {idx + 1}
                </div>
                <button
                  onClick={() => removeClient(idx)}
                  className="tag-remove"
                  style={{ fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client Name</label>
                  <input placeholder="Acme Corp" value={client.name} onChange={e => updateClient(idx, 'name', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Industry</label>
                  <input placeholder="SaaS / Healthcare / Finance..." value={client.industry} onChange={e => updateClient(idx, 'industry', e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Relationship</label>
                  <select value={client.relationship} onChange={e => updateClient(idx, 'relationship', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="active-client">Active Client</option>
                    <option value="prospect">Prospect</option>
                    <option value="past-client">Past Client</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Context</label>
                  <input placeholder="Working on app redesign..." value={client.context} onChange={e => updateClient(idx, 'context', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <div 
            onClick={addClient}
            style={{
              padding: '16px',
              border: '1px dashed var(--border2)',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text2)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.backgroundColor = 'var(--accent-dim2)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--border2)';
              e.currentTarget.style.color = 'var(--text2)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            + Add another client
          </div>
        </div>
      )}

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => { saveAnswer('clients', { clients: [] }); nextStep(); }}>
            {clients.length === 0 ? 'Skip' : 'Skip Remaining'}
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Continue to Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
