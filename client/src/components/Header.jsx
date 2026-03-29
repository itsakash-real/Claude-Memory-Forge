import { useSession } from '../context/SessionContext';
import GitHubStar from './GitHubStar';
import TwitterButton from './TwitterButton';
export default function Header() {
  const { currentStep, stepNames } = useSession();
  const totalBars = stepNames.length - 1;
  const isComplete = currentStep >= totalBars;

  return (
    <header style={{
      height: '58px',
      position: 'sticky',
      top: 0,
      background: 'rgba(5, 5, 5, 0.92)',
      backdropFilter: 'blur(24px) saturate(1.2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
        <div style={{
          width: '26px', height: '26px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1a0f08', fontSize: '13px', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(212,165,116,0.2)'
        }}>⬡</div>
        <div style={{ 
          fontFamily: 'var(--font-display)', fontSize: '20px',
          letterSpacing: '-0.3px', color: 'var(--text)'
        }}>
          Claude <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>Memory Forge</span>
        </div>
        <div style={{ marginLeft: '6px', display: 'flex', gap: '6px' }}>
          <TwitterButton compact={true} />
          <GitHubStar compact={true} />
        </div>
      </div>

      {/* Progress Track */}
      {!isComplete && (
        <>
          <div style={{
            flex: 1, display: 'flex', justifyContent: 'center',
            gap: '6px', maxWidth: '500px', margin: '0 auto'
          }}>
            {Array.from({ length: totalBars }).map((_, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{
                    height: '3px', width: '32px', borderRadius: '3px',
                    backgroundColor: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--border2)',
                    transition: 'all 0.4s ease',
                    boxShadow: isActive ? '0 0 10px var(--accent-glow)' : isDone ? '0 0 6px rgba(106,172,126,0.2)' : 'none'
                  }} />
                </div>
              );
            })}
          </div>

          <div style={{
            minWidth: '110px', textAlign: 'right',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: 'var(--text3)', whiteSpace: 'nowrap'
          }}>
            Step <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{currentStep + 1}</span>
            <span style={{ color: 'var(--border2)', margin: '0 4px' }}>/</span>
            {totalBars}
          </div>
        </>
      )}

      {isComplete && (
        <div style={{
          flex: 1, textAlign: 'right',
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px rgba(106,172,126,0.5)' }} />
          Build Complete
        </div>
      )}
    </header>
  );
}
