import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

export default function ReviewStep() {
  const navigate = useNavigate();
  const { sessionId, answers, prevStep, setLoading, setError, setPreview, preview } = useSession();
  
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPreview();
  }, []);

  async function loadPreview() {
    setLoadingPreview(true);
    try {
      // Submit review step (no Gemini call needed)
      await api.submitAnswer(sessionId, 7, {});
      const data = await api.getPreview(sessionId);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Trigger download
      const url = api.getDownloadUrl(sessionId);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'claude-memory.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // We don't need to navigate to download page anymore if this is the final UI.
      // The user can just stay here or close the window.
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleExport() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(answers, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = 'memory-forge-profile.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loadingPreview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid var(--border2)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)' }}>
          Finalizing system...
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', paddingTop: '40px' }}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        backgroundColor: 'var(--green-dim)', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto 24px',
        color: 'var(--green)'
      }}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '32px', height: '32px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h2 className="step-title">Memory System Built</h2>
      <p className="step-subtitle" style={{ margin: '0 auto 40px', maxWidth: '400px' }}>
        Your personalized Claude Code memory configuration is ready. {preview?.totalFiles || 0} files generated.
      </p>

      <div className="code-block" style={{ textAlign: 'left', margin: '0 auto 40px', maxWidth: '440px' }}>
        <div className="code-comment"># 1. Download the ZIP file</div>
        <div className="code-comment" style={{ marginBottom: '12px' }}># 2. Extract contents into your project root</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="code-cmd">unzip</span> claude-memory.zip -d your-project/
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button className="btn-secondary" onClick={prevStep} disabled={generating}>
          ← Back
        </button>
        <button className="btn-secondary" onClick={handleExport} disabled={generating}>
          💾 Save Profile
        </button>
        <button className="btn-download" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Downloading...' : `Download ZIP (${preview?.totalFiles || 0} files)`}
        </button>
      </div>
    </div>
  );
}
