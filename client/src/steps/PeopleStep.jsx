import { useState } from 'react';
import { useSession } from '../context/SessionContext';

const EMPTY_PERSON = { name: '', role: '', company: '', relationship: '', notes: '' };

export default function PeopleStep() {
  const { answers, saveAnswer, submitAndPoll, nextStep, prevStep, setError } = useSession();
  
  const saved = answers.people?.people || [];
  const [people, setPeople] = useState(saved.length > 0 ? saved : [{ ...EMPTY_PERSON }]);

  function addPerson() {
    setPeople(prev => [...prev, { ...EMPTY_PERSON }]);
  }

  function removePerson(index) {
    setPeople(prev => prev.filter((_, i) => i !== index));
  }

  function updatePerson(index, field, value) {
    setPeople(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function handleNext() {
    const validPeople = people.filter(p => p.name.trim());
    const answer = { people: validPeople };
    try {
      await submitAndPoll(1, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 2 of 8 — People</div>
      <h2 className="step-title">Your People</h2>
      <p className="step-subtitle">
        Who do you work with? Claude will create memory files for each person so it remembers your relationships.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {people.map((person, idx) => (
          <div key={idx} className="card animate-step">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>
                PERSON {idx + 1}
              </div>
              {people.length > 1 && (
                <button
                  onClick={() => removePerson(idx)}
                  className="tag-remove"
                  style={{ fontSize: '16px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name</label>
                <input placeholder="Sarah Chen" value={person.name} onChange={e => updatePerson(idx, 'name', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <input placeholder="Lead Designer" value={person.role} onChange={e => updatePerson(idx, 'role', e.target.value)} />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company</label>
                <input placeholder="Acme Corp" value={person.company} onChange={e => updatePerson(idx, 'company', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Relationship</label>
                <select value={person.relationship} onChange={e => updatePerson(idx, 'relationship', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="colleague">Colleague</option>
                  <option value="manager">Manager</option>
                  <option value="report">Direct Report</option>
                  <option value="client">Client</option>
                  <option value="friend">Friend</option>
                  <option value="mentor">Mentor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Key context</label>
              <input placeholder="Working on Project Atlas together" value={person.notes} onChange={e => updatePerson(idx, 'notes', e.target.value)} />
            </div>
          </div>
        ))}
        
        <div 
          onClick={addPerson}
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
          + Add another person
        </div>
      </div>

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => { saveAnswer('people', { people: [] }); nextStep(); }}>
            Skip
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Continue to Projects
          </button>
        </div>
      </div>
    </div>
  );
}
