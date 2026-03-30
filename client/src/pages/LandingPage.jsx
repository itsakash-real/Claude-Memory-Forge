import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';
import GitHubStar from '../components/GitHubStar';
import TwitterButton from '../components/TwitterButton';

/* ──────────────────────────────────────────────
   Animated terminal output for the demo section
   ────────────────────────────────────────────── */
const DEMO_LINES = [
  { delay: 0,    text: '$ claude-memory-forge generate', type: 'cmd' },
  { delay: 700,  text: '✔ Session started', type: 'success' },
  { delay: 1200, text: '◆ Personalizing identity...', type: 'info' },
  { delay: 2400, text: '◆ Building team profiles...', type: 'info' },
  { delay: 3400, text: '◆ Mapping your projects...', type: 'info' },
  { delay: 4200, text: '◆ Configuring preferences...', type: 'info' },
  { delay: 5100, text: '✔ Generated 14 files in .claude/', type: 'success' },
  { delay: 5700, text: '✔ Claude now remembers you across sessions.', type: 'success' },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState([]);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    setVisibleLines([]);
    const timers = DEMO_LINES.map((line) =>
      setTimeout(() => setVisibleLines(prev => [...prev, line]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [started]);

  return (
    <div ref={ref} style={{
      background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '14px',
      padding: '0', overflow: 'hidden', fontFamily: 'var(--font-mono)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)'
    }}>
      {/* Terminal title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 16px', borderBottom: '1px solid #1a1a1a',
        background: '#111'
      }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => (
          <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
        ))}
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#444' }}>memory-forge ~ bash</span>
      </div>

      {/* Terminal body */}
      <div style={{ padding: '20px 22px', minHeight: '200px' }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            fontSize: '13.5px', lineHeight: 1.8,
            color: line.type === 'cmd' ? '#e8e8e8'
                 : line.type === 'success' ? '#6aac7e'
                 : '#a8a29e',
            animation: 'stepIn 0.2s ease forwards'
          }}>
            {line.text}
            {i === visibleLines.length - 1 && visibleLines.length < DEMO_LINES.length && (
              <span style={{ animation: 'blink 0.8s infinite', marginLeft: '2px' }}>▌</span>
            )}
          </div>
        ))}
        {visibleLines.length === 0 && (
          <div style={{ color: '#333', fontSize: '13px' }}>Click "Start" or scroll down...</div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Stat counter with animation
   ────────────────────────────────────────────── */
const STATS = [
  { value: '14', label: 'Files Generated', suffix: '' },
  { value: '2', label: 'Min to Complete', suffix: '' },
  { value: '0', label: 'API Keys Needed', suffix: '' },
  { value: '100', label: 'Open Source', suffix: '%' },
];

/* ──────────────────────────────────────────────
   Features list
   ────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant AI Personalization',
    desc: 'Answer 8 quick questions. Our AI crafts a complete CLAUDE.md memory system in under 2 minutes.'
  },
  {
    icon: '🔐',
    title: 'Zero Data Storage',
    desc: 'We have no database. No accounts, no tracking. Sessions auto-expire after 2h. Completely stateless.'
  },
  {
    icon: '🏗️',
    title: 'Production-Grade Backend',
    desc: 'Queue-based Gemini API rotation with Redis-backed jobs. Smart failover handles rate limits silently.'
  },
  {
    icon: '📂',
    title: 'Full Memory Architecture',
    desc: 'Generates CLAUDE.md, people profiles, project configs, a glossary, and a SQLite search engine — all ready to use.'
  },
  {
    icon: '🔄',
    title: 'Regenerate Anything',
    desc: 'Not happy with a section? One click regenerates just that step without losing your other answers.'
  },
  {
    icon: '📦',
    title: 'Zero Dependencies to Run',
    desc: 'The output is plain markdown + Python stdlib. Drop it into any project. No npm, no pip, no setup.'
  },
];

const HOW_STEPS = [
  {
    num: '01', label: 'Answer 8 Questions',
    desc: 'Tell us about yourself, your team, projects, tools, and coding preferences.',
    code: null
  },
  {
    num: '02', label: 'AI Generates Your Memory',
    desc: 'Our queueing system generates 14 personalized files using Gemini with smart key rotation.',
    code: null
  },
  {
    num: '03', label: 'Download & Drop In',
    desc: 'Extract the ZIP at your project root so `.claude/` lives there.',
    code: 'unzip claude-memory.zip -d ~/your-project/'
  },
  {
    num: '04', label: 'Claude Remembers You',
    desc: 'Claude Code reads CLAUDE.md automatically at every session start. No setup, no re-explaining.',
    code: 'claude  # starts with full memory context'
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { setSessionId } = useSession();
  const [starting, setStarting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleStart() {
    setStarting(true);
    try {
      const savedId = localStorage.getItem('claudeforge_sessionId');
      if (savedId) {
        setSessionId(savedId);
        navigate('/wizard');
        return;
      }
      const session = await api.startSession();
      localStorage.setItem('claudeforge_sessionId', session.sessionId);
      setSessionId(session.sessionId);
      navigate('/wizard');
    } catch (err) {
      console.error(err);
      setStarting(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* ═══ Ambient glows ═══ */}
      <div style={{
        position: 'fixed', top: '-10%', left: '20%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,165,116,0.05) 0%, transparent 65%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: 'floatGlow 9s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(106,172,126,0.04) 0%, transparent 65%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: 'floatGlow 12s ease-in-out infinite reverse'
      }} />

      {/* ═══════════════════════════════════════════════
          NAV BAR
          ═══════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottom: '1px solid var(--border)',
        height: '58px', display: 'flex', alignItems: 'center',
        padding: '0 clamp(20px, 5vw, 48px)',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1a0f08', fontSize: '14px', fontWeight: 700,
            boxShadow: '0 4px 14px rgba(212,165,116,0.3)',
            animation: mounted ? 'pulseGlow 4s ease-in-out infinite' : 'none'
          }}>⬡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Claude <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Memory Forge</em>
          </span>
        </div>

        {/* Nav right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)',
            background: 'var(--green-dim)', padding: '4px 12px', borderRadius: '20px',
            border: '1px solid rgba(106,172,126,0.2)'
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
            Free
          </div>
          <div className="hide-mobile" style={{ display: 'flex', gap: '8px' }}>
            <TwitterButton compact={true} />
            <GitHubStar compact={true} />
          </div>
          <button
            id="nav-start-btn"
            className="btn-primary"
            onClick={handleStart}
            disabled={starting}
            style={{ padding: '9px 22px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {starting
              ? <><span style={{ width: '13px', height: '13px', border: '2px solid rgba(26,15,8,0.3)', borderTopColor: '#1a0f08', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Starting...</>
              : 'Start for Free →'
            }
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════ */}
      <section className="section-padding" style={{
        minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 'clamp(40px, 8vh, 80px) clamp(20px, 5vw, 60px)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '1060px', width: '100%' }}>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

            {/* Left: Copy */}
            <div>
              {/* Eyebrow */}
              <div className={mounted ? 'fade-up delay-1' : 'pre-anim'} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)',
                background: 'var(--accent-dim)', border: '1px solid rgba(212,165,116,0.2)',
                padding: '5px 14px', borderRadius: '20px', marginBottom: '28px',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}>
                <span>⬡</span> Built for Claude Code Users
              </div>

              {/* Headline */}
              <h1 className={mounted ? 'hero-title fade-up delay-2' : 'hero-title pre-anim'} style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 5vw, 64px)',
                color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '24px'
              }}>
                Give Claude Code<br />
                <span style={{ color: 'var(--accent)' }}>a permanent memory.</span>
              </h1>

              {/* Sub */}
              <p className={mounted ? 'hero-subtitle fade-up delay-3' : 'hero-subtitle pre-anim'} style={{
                fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text2)', lineHeight: 1.7,
                marginBottom: '40px', maxWidth: '480px'
              }}>
                Claude Code forgets everything between sessions. Memory Forge generates a complete{' '}
                <code style={{ fontSize: '15px' }}>.claude/</code> directory — personalized to your role, team,
                and tools — so Claude always knows who you are.
              </p>

              {/* CTA row */}
              <div className={mounted ? 'fade-up delay-4' : 'pre-anim'} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  id="hero-start-btn"
                  className="btn-primary"
                  onClick={handleStart}
                  disabled={starting}
                  style={{ fontSize: '16px', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {starting
                    ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(26,15,8,0.3)', borderTopColor: '#1a0f08', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Starting...</>
                    : 'Generate My Memory →'
                  }
                </button>
                <a href="https://github.com/itsakash-real/Claude-Memory-Forge" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                    color: 'var(--text2)', padding: '14px 22px',
                    border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  View Source
                </a>
              </div>

              {/* Trust strip */}
              <div className={mounted ? 'fade-up delay-5' : 'pre-anim'} style={{
                display: 'flex', gap: '20px', marginTop: '36px', flexWrap: 'wrap'
              }}>
                {['No API key required', 'Free & open source', 'Zero data stored'].map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text3)'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Demo terminal */}
            <div className={mounted ? 'fade-up delay-3' : 'pre-anim'}>
              <AnimatedTerminal />

              {/* Stats row below terminal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                {STATS.map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '14px 12px', textAlign: 'center'
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--accent)', letterSpacing: '-1px' }}>
                      {s.value}{s.suffix}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', marginTop: '4px', lineHeight: 1.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════ */}
      <section className="section-padding" style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)',
        borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            How it works
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4vw, 44px)',
            color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '48px'
          }}>
            Four steps. <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Under two minutes.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="responsive-flex" style={{
                display: 'flex', gap: '28px', padding: '32px 0',
                borderBottom: i < HOW_STEPS.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 300,
                  color: 'var(--accent)', opacity: 0.35, lineHeight: 1, flexShrink: 0, width: '44px'
                }}>{step.num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '19px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>{step.label}</div>
                  <div style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.65, marginBottom: step.code ? '14px' : 0 }}>{step.desc}</div>
                  {step.code && (
                    <div style={{
                      background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px',
                      padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px',
                      color: 'var(--accent)', display: 'inline-block'
                    }}>
                      <span style={{ color: 'var(--text3)' }}>$</span> {step.code}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES GRID
          ═══════════════════════════════════════════════ */}
      <section className="section-padding" style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)',
        borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            What you get
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4vw, 44px)',
            color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '48px'
          }}>
            Everything Claude needs. <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Nothing you don't.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '26px', position: 'relative',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,165,116,0.25)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,165,116,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.12), transparent)' }} />
                <div style={{ fontSize: '26px', marginBottom: '14px' }}>{f.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>{f.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRIVACY CALLOUT
          ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 60px)',
        borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: 'clamp(20px, 4vw, 36px)',
            display: 'flex', gap: '24px', alignItems: 'flex-start', position: 'relative', flexWrap: 'wrap'
          }}>
            <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(106,172,126,0.25), transparent)' }} />
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: 'var(--green-dim)', border: '1px solid rgba(106,172,126,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
                Privacy by design.
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.7 }}>
                We don't have a database. No accounts, no sign-ups, no tracking. Sessions auto-expire after 2 hours.
                Once you download your{' '}<code style={{ fontSize: '13px' }}>.claude/</code>{' '}ZIP, everything is gone from our servers.
                Completely stateless. Your API calls go directly to Google from our queue worker — we never see the content.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)',
        borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)',
            color: 'var(--text)', lineHeight: 1.12, letterSpacing: '-1.5px', marginBottom: '20px'
          }}>
            Ready to stop re-explaining yourself to Claude?
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text2)', marginBottom: '32px', lineHeight: 1.65 }}>
            Takes 2 minutes. No signup. No API key. Free forever.
          </p>
          <button
            id="cta-bottom-btn"
            className="btn-primary"
            onClick={handleStart}
            disabled={starting}
            style={{ fontSize: '17px', padding: '16px 44px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
          >
            {starting
              ? <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(26,15,8,0.3)', borderTopColor: '#1a0f08', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Starting...</>
              : 'Generate My Memory System →'
            }
          </button>
          <div style={{ marginTop: '20px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text3)' }}>
            Open source · MIT License ·{' '}
            <a href="https://github.com/itsakash-real/Claude-Memory-Forge" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', borderBottom: '1px solid rgba(212,165,116,0.3)', paddingBottom: '1px' }}>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(16px, 3vw, 24px) clamp(20px, 5vw, 48px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text3)',
        position: 'relative', zIndex: 1
      }}>
        <span>© 2025 Claude Memory Forge · MIT License</span>
        <span>Open-source · Built for Claude Code · Zero deps · Plain markdown + SQLite</span>
      </footer>
    </div>
  );
}
