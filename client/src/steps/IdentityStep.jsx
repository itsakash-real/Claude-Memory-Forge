import { useState, useRef } from 'react';
import { useSession } from '../context/SessionContext';
import { PRESETS } from '../utils/presets';


export default function IdentityStep() {
  const { sessionId, answers, saveAnswer, submitStep, importProfile, nextStep, setLoading, setLoadingMessage, setError } = useSession();
  
  const saved = answers.identity || {};
  const [name, setName] = useState(saved.name || '');
  const [role, setRole] = useState(saved.role || '');
  const [company, setCompany] = useState(saved.company || '');
  const [location, setLocation] = useState(saved.location || '');
  const [claudeUsage, setClaudeUsage] = useState(saved.claudeUsage || '');
  const [devLevel, setDevLevel] = useState(saved.devLevel || 'intermediate');
  const [bio, setBio] = useState(saved.bio || '');

  const fileInputRef = useRef(null);

  function applyPreset(presetKey) {
    const data = PRESETS[presetKey];
    if (data) {
      importProfile(data).then(() => {
        const id = data.identity || {};
        if (id.role) setRole(id.role);
        if (id.claudeUsage) setClaudeUsage(id.claudeUsage);
        if (id.devLevel) setDevLevel(id.devLevel);
        if (id.bio) setBio(id.bio);
        // Jump down to Name input
        document.getElementById('focus-name')?.focus();
      }).catch(err => setError(err.message));
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await importProfile(json);
        const id = json.identity || {};
        setName(id.name || '');
        setRole(id.role || '');
        setCompany(id.company || '');
        setLocation(id.location || '');
        setClaudeUsage(id.claudeUsage || '');
        setDevLevel(id.devLevel || 'intermediate');
        setBio(id.bio || '');
      } catch (err) {
        setError('Invalid profile JSON file. Need help? Try deleting and making a new one.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  async function handleNext() {
    if (!name.trim() || !role.trim()) {
      setError('Name and role are required');
      return;
    }

    const answer = { name, role, company, location, claudeUsage, devLevel, bio };

    try {
      await submitStep(0, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 1 of 8 — Identity</div>
      <h2 className="step-title">Who Are You?</h2>
      <p className="step-subtitle" style={{ lineHeight: '1.6' }}>
        This becomes your <code className="mono-small" style={{ fontSize: '11px', padding: '2px 4px', background: 'var(--bg2)', borderRadius: '4px', border: '1px solid var(--border2)' }}>CLAUDE.md</code> identity section — how Claude calibrates every response in every session.
      </p>

      {/* QUICK ACTIONS */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '24px', marginBottom: '40px', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.12), transparent)' }} />
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>⚡ Quick Actions</span>
          <span style={{ color: 'var(--text3)', fontSize: '11px' }}>Skip the 8 steps</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => applyPreset('react')} style={{ padding: '10px 14px', fontSize: '14px', flex: 1, minWidth: '180px' }}>
            ⚛️ React Developer
          </button>
          <button className="btn-secondary" onClick={() => applyPreset('dataScience')} style={{ padding: '10px 14px', fontSize: '14px', flex: 1, minWidth: '180px' }}>
            🐍 Python Data Sci
          </button>
          <button className="btn-secondary" onClick={() => applyPreset('devOps')} style={{ padding: '10px 14px', fontSize: '14px', flex: 1, minWidth: '180px' }}>
            🐳 DevOps
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>OR</div>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', fontSize: '14px', width: '100%', background: 'transparent' }}>
            📂 Import memory-forge-profile.json
          </button>
        </div>
      </div>

      <div>
        <div className="form-row-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name *</label>
            <input id="focus-name" type="text" placeholder="Sarah Chen" value={name} onChange={e => setName(e.target.value)} />
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
