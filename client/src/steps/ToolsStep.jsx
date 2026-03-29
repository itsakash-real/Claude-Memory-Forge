import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

const TOOL_GROUPS = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Ruby'],
  Frameworks: ['React', 'Next.js', 'Vue', 'Svelte', 'Angular', 'Express', 'Django', 'Tailwind CSS'],
  Databases: ['PostgreSQL', 'MongoDB', 'Redis', 'Supabase', 'MySQL', 'Prisma'],
  Infrastructure: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel', 'Netlify', 'Terraform'],
  'Tools & Editors': ['Git', 'GitHub', 'VS Code', 'Cursor', 'Figma', 'Webpack', 'Vite']
};

export default function ToolsStep() {
  const { sessionId, answers, saveAnswer, nextStep, prevStep, setLoading, setLoadingMessage, setError } = useSession();

  const saved = answers.tools || {};
  const [selectedTools, setSelectedTools] = useState(saved.tools || []);
  const [ides, setIdes] = useState(saved.ides || '');
  const [toolNotes, setToolNotes] = useState(saved.toolNotes || '');
  const [customTool, setCustomTool] = useState('');

  function toggleTool(tool) {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  }

  function addCustomTool() {
    if (customTool.trim() && !selectedTools.includes(customTool.trim())) {
      setSelectedTools(prev => [...prev, customTool.trim()]);
      setCustomTool('');
    }
  }

  async function handleNext() {
    const answer = { tools: selectedTools, ides, toolNotes };
    saveAnswer('tools', answer);

    setLoading(true);
    setLoadingMessage('Documenting your toolset...');

    try {
      await api.submitAnswer(sessionId, 3, answer);
      nextStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="step-eyebrow">Step 4 of 8 — Stack</div>
      <h2 className="step-title">Your Tools & Stack</h2>
      <p className="step-subtitle">
        What do you use daily? Claude will remember your tech stack and preferences.
      </p>

      <div style={{ marginBottom: '32px' }}>
        {Object.entries(TOOL_GROUPS).map(([groupName, tools]) => (
          <div key={groupName} style={{ marginBottom: '24px' }}>
            <div className="chip-group-label">{groupName}</div>
            <div className="chip-grid">
              {tools.map(tool => (
                <div
                  key={tool}
                  className={`chip ${selectedTools.includes(tool) ? 'on' : ''}`}
                  onClick={() => toggleTool(tool)}
                >
                  {tool}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Custom tools (not in the presets) */}
        {selectedTools.filter(t => !Object.values(TOOL_GROUPS).flat().includes(t)).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
             <div className="chip-group-label">Custom</div>
             <div className="chip-grid">
               {selectedTools.filter(t => !Object.values(TOOL_GROUPS).flat().includes(t)).map(tool => (
                  <div key={tool} className="chip on" onClick={() => toggleTool(tool)}>
                     {tool}
                  </div>
               ))}
             </div>
          </div>
        )}

        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label className="form-label">Add other tool</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. Bun, Deno..."
              value={customTool}
              onChange={e => setCustomTool(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTool()}
            />
            <button className="btn-secondary" style={{ padding: '0 16px' }} onClick={addCustomTool}>Add</button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Primary IDE / Editor</label>
        <input type="text" placeholder="VS Code with Vim keybindings" value={ides} onChange={e => setIdes(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Additional notes about your setup</label>
        <textarea
          placeholder="I use Docker for all local development. I have tmux set up for terminal multiplexing..."
          value={toolNotes}
          onChange={e => setToolNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="button-row flex-between">
        <button className="btn-secondary" onClick={prevStep}>← Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Clients
        </button>
      </div>
    </div>
  );
}
