import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';
import GitHubStar from '../components/GitHubStar';
import TwitterButton from '../components/TwitterButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setSessionId, setApiKey } = useSession();
  const [keyInput, setKeyInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [keyValid, setKeyValid] = useState(null);
  const [keyError, setKeyError] = useState('');
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    const saved = localStorage.getItem('forge_api_key');
    if (saved) {
      try {
        const { key, expires } = JSON.parse(saved);
        if (Date.now() < expires) {
          setKeyInput(key);
        } else {
          localStorage.removeItem('forge_api_key');
        }
      } catch (e) {
        // malformed
      }
    }
  }, []);

  async function handleValidateAndStart() {
    if (!keyInput.trim()) {
      setKeyError('Please enter your Gemini API key');
      return;
    }
    setValidating(true);
    setKeyError('');
    try {
      const validation = await api.validateKey(keyInput.trim());
      if (!validation.valid) {
        setKeyError('Invalid API key. Please check and try again.');
        setKeyValid(false);
        setValidating(false);
        return;
      }
      setKeyValid(true);
      setApiKey(keyInput.trim());
      
      // Save to localStorage for 24 hours to prevent re-typing
      localStorage.setItem('forge_api_key', JSON.stringify({
        key: keyInput.trim(),
        expires: Date.now() + 24 * 60 * 60 * 1000
      }));

      const session = await api.startSession(keyInput.trim());
      setSessionId(session.sessionId);
      setTimeout(() => navigate('/wizard'), 600);
    } catch (err) {
      setKeyError(err.message || 'Failed to connect. Is the server running?');
      setKeyValid(false);
    } finally {
      setValidating(false);
    }
  }

  const fileTree = [
    { name: 'CLAUDE.md', indent: 0, accent: true, label: 'master routing file' },
    { name: 'TASKS.md', indent: 0 },
    { name: 'memory/', indent: 0, folder: true },
    { name: 'memory_engine.py', indent: 1, label: 'SQLite search engine' },
    { name: 'assistant/', indent: 1, folder: true },
    { name: 'people/', indent: 1, folder: true, label: 'your team' },
    { name: 'projects/', indent: 1, folder: true, label: 'your work' },
    { name: 'hooks/', indent: 1, folder: true, label: 'session lifecycle' },
    { name: 'glossary.md', indent: 1 },
    { name: 'scheduled-tasks/', indent: 0, folder: true },
    { name: 'QUICKSTART.md', indent: 0, accent: true },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '30%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,165,116,0.04) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: 'floatGlow 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '20%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(106,172,126,0.03) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: 'floatGlow 10s ease-in-out infinite reverse'
      }} />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — Hero + Auth (full viewport)
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 40px', position: 'relative', zIndex: 1
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px',
          maxWidth: '1040px', width: '100%', alignItems: 'center'
        }}>

          {/* Left: Hero */}
          <div>
            {/* Logo */}
            <div className={mounted ? 'fade-up delay-1' : 'pre-anim'} style={{
              display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px'
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                borderRadius: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a0f08', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(212,165,116,0.25)',
                animation: mounted ? 'pulseGlow 4s ease-in-out infinite' : 'none'
              }}>⬡</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  Claude <em style={{ fontStyle: 'italic', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>Memory Forge</em>
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)',
                  background: 'var(--green-dim)', padding: '3px 10px', borderRadius: '20px',
                  border: '1px solid rgba(106,172,126,0.2)'
                }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
                  Online
                </div>
                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <TwitterButton compact={true} />
                  <GitHubStar compact={true} />
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className={mounted ? 'fade-up delay-2' : 'pre-anim'} style={{
              fontFamily: 'var(--font-display)', fontSize: '60px', color: 'var(--text)',
              lineHeight: 1.04, letterSpacing: '-2px', marginBottom: '22px'
            }}>
              Persistent Memory<br />
              <span style={{ color: 'var(--accent)' }}>for Claude Code.</span>
            </h1>

            {/* Subtitle */}
            <p className={mounted ? 'fade-up delay-3' : 'pre-anim'} style={{
              fontSize: '18px', color: 'var(--text2)', lineHeight: 1.65,
              marginBottom: '40px', maxWidth: '460px'
            }}>
              Claude Code forgets everything between sessions. This tool generates a complete{' '}
              <code style={{ fontSize: '15px' }}>.claude/</code> memory system — personalized to your role,
              team, projects, and tools — so Claude remembers <em>you</em>.
            </p>

            {/* Feature bullets */}
            <div className={mounted ? 'fade-up delay-4' : 'pre-anim'} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                ['Built for Claude Code users', 'Works with Claude Code\'s CLAUDE.md memory system.'],
                ['AI-personalized in 8 steps', 'Answer questions about your work, get a tailored config.'],
                ['Zero dependencies', 'Plain markdown + Python stdlib. No npm, no pip.'],
              ].map(([title, desc], i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', marginTop: '7px', flexShrink: 0,
                    background: 'var(--accent)',
                    boxShadow: '0 0 12px rgba(212,165,116,0.3)',
                    animation: `featurePulse 3s ease-in-out ${i * 0.5}s infinite`
                  }} />
                  <div>
                    <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500, marginBottom: '2px' }}>{title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text3)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth + File tree */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Auth Card */}
            <div className={mounted ? 'fade-up delay-3' : 'pre-anim'} style={{
              background: 'var(--bg2)',
              border: `1px solid ${focused ? 'rgba(212,165,116,0.3)' : 'var(--border)'}`,
              borderRadius: '16px', padding: '32px', position: 'relative',
              transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              boxShadow: focused
                ? '0 0 60px rgba(212,165,116,0.08), 0 0 0 1px rgba(212,165,116,0.1)'
                : '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.25), transparent)',
                animation: 'shimmerLine 4s ease-in-out infinite'
              }} />
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)',
                textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Authenticate
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text2)', marginBottom: '8px' }}>
                  Gemini API Key
                </label>
                <input type="password" placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={e => { setKeyInput(e.target.value); setKeyError(''); setKeyValid(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleValidateAndStart()}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{ width: '100%', padding: '14px 16px', fontSize: '15px' }}
                />
              </div>
              <button className="btn-primary" onClick={handleValidateAndStart} disabled={validating}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '15.5px' }}>
                {validating ? (
                  <>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(26,15,8,0.3)', borderTopColor: '#1a0f08', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                    Authenticating...
                  </>
                ) : keyValid ? <>✓ Launching wizard...</> : <>Authenticate & Start →</>}
              </button>
              {keyError && (
                <div style={{ color: 'var(--red)', fontSize: '14px', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', animation: 'shake 0.4s ease' }}>
                  <span>⚠</span> {keyError}
                </div>
              )}
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '20px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                Free key from{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', borderBottom: '1px solid rgba(212,165,116,0.3)', paddingBottom: '1px' }}>
                  Google AI Studio
                </a>{' '}· Never leaves your browser.
              </div>
            </div>

            {/* File tree */}
            <div className={mounted ? 'fade-up delay-5' : 'pre-anim'} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '18px 20px', fontFamily: 'var(--font-mono)', fontSize: '14px', lineHeight: 1.8,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.12), transparent)' }} />
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)', marginBottom: '12px' }}>
                Output Preview
              </div>
              <div style={{ color: 'var(--accent)', marginBottom: '4px' }}>.claude/</div>
              {fileTree.map((f, i) => (
                <div key={i} style={{
                  paddingLeft: `${f.indent * 16}px`, display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
                  transition: `all 0.3s ease ${0.6 + i * 0.05}s`
                }}>
                  <span style={{ color: f.accent ? 'var(--accent)' : f.folder ? 'var(--text2)' : 'var(--text3)' }}>
                    {f.folder ? '📁' : '·'} {f.name}
                  </span>
                  {f.label && <span style={{ color: 'var(--text3)', fontSize: '12px', opacity: 0.7 }}>← {f.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          animation: 'fadeUp 0.7s ease 1.5s forwards', opacity: 0
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text3)' }}>Learn more</span>
          <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, var(--text3), transparent)', animation: 'blink 2s infinite' }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — What is this & Who is it for
          ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '100px 40px', position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Section header */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            The Problem
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--text)',
            lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '24px'
          }}>
            Claude Code has <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>amnesia.</span>
          </h2>

          <p style={{ fontSize: '18px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '660px' }}>
            Every time you start a new Claude Code session, it forgets who you are, what you're working on,
            your preferences, your team, and your codebase conventions. You end up re-explaining the same
            context over and over.
          </p>

          <p style={{ fontSize: '18px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '48px', maxWidth: '660px' }}>
            <strong style={{ color: 'var(--text)' }}>Claude Memory Forge</strong> solves this by generating a{' '}
            <code style={{ fontSize: '15px' }}>.claude/</code> directory — a persistent memory system that Claude Code
            reads at the start of every session. It's like giving Claude a brain that survives between conversations.
          </p>

          {/* Who is it for */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '64px'
          }}>
            {[
              {
                icon: '🧑‍💻',
                title: 'Who is this for?',
                items: [
                  'Claude Code terminal users',
                  'Developers using Claude as a daily coding partner',
                  'Teams that want Claude to remember their conventions',
                  'Anyone tired of re-explaining context every session'
                ]
              },
              {
                icon: '⚡',
                title: 'What does it generate?',
                items: [
                  'CLAUDE.md — master context file Claude reads first',
                  'People profiles — your team and relationships',
                  'Project configs — what you\'re working on and how',
                  'A search engine — SQLite-powered memory retrieval'
                ]
              }
            ].map((card, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px',
                padding: '28px', position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.12), transparent)' }} />
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{card.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>{card.title}</div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {card.items.map((item, j) => (
                    <li key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '15px', color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Privacy / Trust strip */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px',
            padding: '24px 28px', marginBottom: '64px', position: 'relative',
            display: 'flex', gap: '20px', alignItems: 'flex-start'
          }}>
            <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(106,172,126,0.2), transparent)' }} />
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--green-dim)', border: '1px solid rgba(106,172,126,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Your API key is never stored.
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.65 }}>
                We don't have a database. There are no accounts, no sign-ups, no tracking.
                Your Gemini API key lives only in your browser session and is used solely to generate
                content via Google's API. Sessions auto-expire after 2 hours. Once you download your{' '}
                <code style={{ fontSize: '13px' }}>.claude/</code> ZIP, everything is gone from our servers. Completely stateless.
              </div>
            </div>
          </div>
          {/* How it works */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            How to Use
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--text)',
            lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '40px'
          }}>
            Three steps. <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Two minutes.</span>
          </h2>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                num: '01',
                title: 'Generate your memory system',
                desc: 'Answer 8 quick questions about your identity, team, projects, and preferences. Our AI crafts a personalized .claude/ memory architecture tailored to how you work.',
              },
              {
                num: '02',
                title: 'Download and extract to your project root',
                desc: 'Download the ZIP and extract it so the .claude/ folder sits at the root of your project. This is where Claude Code looks for its memory files.',
                code: 'unzip claude-memory.zip -d ~/your-project/'
              },
              {
                num: '03',
                title: 'Start Claude Code — it just works',
                desc: 'Claude Code automatically reads CLAUDE.md at session start. It now knows who you are, what you\'re building, your team, your tools, and your preferences. No setup needed.',
                code: 'claude  # opens with full memory context'
              }
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: '28px', padding: '32px 0',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 300,
                  color: 'var(--accent)', opacity: 0.4, lineHeight: 1, flexShrink: 0, width: '48px'
                }}>{step.num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.65, marginBottom: step.code ? '16px' : 0 }}>
                    {step.desc}
                  </div>
                  {step.code && (
                    <div style={{
                      background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px',
                      padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px',
                      color: 'var(--accent)', display: 'inline-block'
                    }}>
                      <span style={{ color: 'var(--text3)' }}>$</span> {step.code}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Project structure visual */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px',
            padding: '24px 28px', marginTop: '48px', position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.15), transparent)' }} />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '1px', color: 'var(--text3)', marginBottom: '16px'
            }}>
              Your project after setup
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', lineHeight: 2, color: 'var(--text2)' }}>
              <div>your-project/</div>
              <div style={{ paddingLeft: '20px' }}>├── <span style={{ color: 'var(--accent)' }}>.claude/</span> <span style={{ color: 'var(--text3)', fontSize: '13px' }}>← generated by Memory Forge</span></div>
              <div style={{ paddingLeft: '20px' }}>│   ├── <span style={{ color: 'var(--accent)' }}>CLAUDE.md</span> <span style={{ color: 'var(--text3)', fontSize: '13px' }}>← Claude reads this first</span></div>
              <div style={{ paddingLeft: '20px' }}>│   ├── memory/</div>
              <div style={{ paddingLeft: '20px' }}>│   └── scheduled-tasks/</div>
              <div style={{ paddingLeft: '20px' }}>├── src/</div>
              <div style={{ paddingLeft: '20px' }}>├── package.json</div>
              <div style={{ paddingLeft: '20px' }}>└── ...</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '64px' }}>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '24px' }}>
              Ready to give Claude a memory? It takes about 2 minutes.
            </p>
            <button className="btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ fontSize: '16px', padding: '16px 36px' }}>
              ↑ Scroll up to get started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text3)',
        position: 'relative', zIndex: 1
      }}>
        Open-source · Built for Claude Code · Zero dependencies · Plain markdown + SQLite
      </footer>
    </div>
  );
}
