import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

const EMPTY_PROJECT = { name: '', description: '', status: 'active', techStack: '', goals: '' };

export default function ProjectsStep() {
  const { sessionId, answers, saveAnswer, nextStep, prevStep, setLoading, setLoadingMessage, setError } = useSession();
  
  const saved = answers.projects?.projects || [];
  const [projects, setProjects] = useState(saved.length > 0 ? saved : [{ ...EMPTY_PROJECT }]);

  function addProject() {
    setProjects(prev => [...prev, { ...EMPTY_PROJECT }]);
  }

  function removeProject(index) {
    setProjects(prev => prev.filter((_, i) => i !== index));
  }

  function updateProject(index, field, value) {
    setProjects(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function handleNext() {
    const validProjects = projects.filter(p => p.name.trim());
    const answer = { projects: validProjects };
    saveAnswer('projects', answer);

    setLoading(true);
    setLoadingMessage('Organizing project files...');

    try {
      await api.submitAnswer(sessionId, 2, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 3 of 8 — Projects</div>
      <h2 className="step-title">Your Projects</h2>
      <p className="step-subtitle">
        What are you working on? Claude will create dedicated memory files for each project.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {projects.map((project, idx) => (
          <div key={idx} className="card animate-step">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>
                PROJECT {idx + 1}
              </div>
              {projects.length > 1 && (
                <button
                  onClick={() => removeProject(idx)}
                  className="tag-remove"
                  style={{ fontSize: '16px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project Name</label>
                <input placeholder="Project Atlas" value={project.name} onChange={e => updateProject(idx, 'name', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select value={project.status} onChange={e => updateProject(idx, 'status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="paused">Paused</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea placeholder="A data visualization dashboard for..." value={project.description} onChange={e => updateProject(idx, 'description', e.target.value)} rows={2} />
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tech Stack</label>
                <input placeholder="React, Node.js, PostgreSQL" value={project.techStack} onChange={e => updateProject(idx, 'techStack', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Goals</label>
                <input placeholder="Launch MVP by Q2" value={project.goals} onChange={e => updateProject(idx, 'goals', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        
        <div 
          onClick={addProject}
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
          + Add another project
        </div>
      </div>

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => { saveAnswer('projects', { projects: [] }); nextStep(); }}>
            Skip
          </button>
          <button className="btn-primary" onClick={handleNext}>
            Continue to Tools
          </button>
        </div>
      </div>
    </div>
  );
}
