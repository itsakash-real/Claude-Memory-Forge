const REPO_URL = 'https://github.com/itsakash-real/Claude-Memory-Forge';

export default function GitHubStar({ compact = false }) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '6px' : '8px',
        padding: compact ? '5px 12px' : '7px 14px',
        background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        borderRadius: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: compact ? '12px' : '13px',
        color: 'var(--text2)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.background = 'var(--bg4)';
        e.currentTarget.style.boxShadow = '0 0 16px rgba(212,165,116,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border2)';
        e.currentTarget.style.color = 'var(--text2)';
        e.currentTarget.style.background = 'var(--bg3)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg width={compact ? 14 : 16} height={compact ? 14 : 16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      <span style={{ color: 'var(--accent)' }}>★</span>
      {compact ? 'Star' : 'Star on GitHub'}
    </a>
  );
}
