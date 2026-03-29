const X_URL = 'https://x.com/its_akashreal';

export default function TwitterButton({ compact = false }) {
  return (
    <a
      href={X_URL}
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
        e.currentTarget.style.borderColor = 'var(--text)';
        e.currentTarget.style.color = 'var(--bg)';
        e.currentTarget.style.background = 'var(--text)';
        e.currentTarget.style.boxShadow = '0 0 16px rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border2)';
        e.currentTarget.style.color = 'var(--text2)';
        e.currentTarget.style.background = 'var(--bg3)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 1200 1227" fill="currentColor">
        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
      </svg>
      {compact ? 'Follow' : 'Follow on X'}
    </a>
  );
}
