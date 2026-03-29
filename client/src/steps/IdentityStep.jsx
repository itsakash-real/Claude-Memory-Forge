import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

export default function IdentityStep() {
  const { sessionId, answers, saveAnswer, nextStep, setLoading, setLoadingMessage, setError } = useSession();
  
  const saved = answers.identity || {};
  const [name, setName] = useState(saved.name || '');
  const [role, setRole] = useState(saved.role || '');
  const [company, setCompany] = useState(saved.company || '');
  const [location, setLocation] = useState(saved.location || '');
  const [claudeUsage, setClaudeUsage] = useState(saved.claudeUsage || '');
  const [devLevel, setDevLevel] = useState(saved.devLevel || 'intermediate');
  const [bio, setBio] = useState(saved.bio || '');

  async function handleNext() {
    if (!name.trim() || !role.trim()) {
      setError('Name and role are required');
      return;
    }

    const answer = { name, role, company, location, claudeUsage, devLevel, bio };
    saveAnswer('identity', answer);

    setLoading(true);
    setLoadingMessage('Crafting identity profile...');

    try {
      await api.submitAnswer(sessionId, 0, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 1 of 8 — Identity</div>
      <h2 className="step-title">Who Are You?</h2>
      <p className="step-subtitle" style={{ lineHeight: '1.6' }}>
        This becomes your <code className="mono-small" style={{ fontSize: '11px', padding: '2px 4px', background: 'var(--bg2)', borderRadius: '4px', border: '1px solid var(--border2)' }}>CLAUDE.md</code> identity section — how Claude calibrates every response in every session.
      </p>

      <div>
        <div className="form-row-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name *</label>
            <input type="text" placeholder="Sarah Chen" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Role / Title *</label>
            <input type="text" placeholder="Senior Frontend Engineer" value={role} onChange={e => setRole(e.target.value)} />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Company / Organization</label>
            <input type="text" placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input type="text" placeholder="San Francisco, CA" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">How do you use Claude Code?</label>
          <div className="mono-small" style={{ marginBottom: '8px' }}>What kind of work do you do with it? Coding, writing, research, etc.</div>
          <textarea
            placeholder="I use Claude Code for full-stack development, debugging, and code reviews..."
            value={claudeUsage}
            onChange={e => setClaudeUsage(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Developer Comfort Level</label>
          <select value={devLevel} onChange={e => setDevLevel(e.target.value)}>
            <option value="beginner">Beginner — I need step-by-step explanations</option>
            <option value="intermediate">Intermediate — I know my way around code</option>
            <option value="advanced">Advanced — Skip the basics, just give me the code</option>
            <option value="non-developer">Non-developer — I'm not a coder</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Anything else Claude should know about you?</label>
          <textarea
            placeholder="I prefer concise responses. I work in a fast-paced startup. I'm a visual learner..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="button-row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={handleNext}>
          Continue to People
        </button>
      </div>
    </div>
  );
}
