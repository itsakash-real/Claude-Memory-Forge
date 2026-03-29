import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';
import { CheckCircle, Download, ArrowRight, RotateCcw } from 'lucide-react';

export default function DownloadPage() {
  const navigate = useNavigate();
  const { sessionId, preview } = useSession();

  function handleDownloadAgain() {
    if (!sessionId) return;
    const url = api.getDownloadUrl(sessionId);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'claude-memory-system.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalFiles = preview?.totalFiles || 20;

  return (
    <div className="download-page">
      <div className="glass-card glass-card--accent download-card">
        <div className="download-card__icon">
          <CheckCircle size={40} />
        </div>

        <h1 className="download-card__title">Your Memory System is Ready!</h1>
        <p className="download-card__subtitle">
          Your personalized Claude Code persistent memory system has been generated and downloaded.
        </p>

        <div className="download-card__stats">
          <div>
            <div className="download-card__stat-value">{totalFiles}+</div>
            <div className="download-card__stat-label">Files Generated</div>
          </div>
          <div>
            <div className="download-card__stat-value">4</div>
            <div className="download-card__stat-label">System Layers</div>
          </div>
          <div>
            <div className="download-card__stat-value">0</div>
            <div className="download-card__stat-label">Dependencies</div>
          </div>
        </div>

        <div className="download-card__actions">
          <button className="btn btn--primary btn--lg" onClick={handleDownloadAgain}>
            <Download size={18} />
            Download Again
          </button>
          <button className="btn btn--secondary" onClick={() => navigate('/')}>
            <RotateCcw size={16} />
            Start New Session
          </button>
        </div>

        {/* Quick setup guide */}
        <div style={{
          marginTop: 'var(--space-2xl)',
          padding: 'var(--space-lg)',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRight size={16} />
            Quick Setup
          </h3>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Extract the ZIP to your Claude workspace folder</li>
            <li>
              Run: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>
                python3 memory/memory_engine.py index
              </code>
            </li>
            <li>
              Run: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>
                python3 memory/memory_check.py
              </code>
            </li>
            <li>Set up MCP connectors with <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>claude mcp add-oauth</code></li>
            <li>Read <strong>QUICKSTART.md</strong> in the ZIP for full instructions</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
