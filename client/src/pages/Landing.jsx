import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Logo from '../components/Logo.jsx'
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge.jsx'

/* ── Shared primitives ──────────────────────────────────────────────────── */
function Tag({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)', color: 'var(--accent-fg)',
      background: 'var(--accent-bg)', border: `1px solid var(--accent)`,
      borderRadius: 'var(--r-full)', padding: '4px 12px',
    }}>
      {children}
    </span>
  )
}

function Chip({ children, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 500,
      color: color, background: color + '14', border: `1px solid ${color}36`,
      borderRadius: 'var(--r-full)', padding: '3px 10px',
    }}>
      {children}
    </span>
  )
}

/* ── Inbox preview (static mockup) ─────────────────────────────────────── */
function InboxPreview() {
  const BUBBLES = [
    { platform: 'slack',    text: 'Did you review the deck I sent?', incoming: true,  time: '10:32' },
    { platform: 'slack',    text: 'Yes! A few tweaks on slide 4.',    incoming: false, time: '10:35' },
    { platform: 'whatsapp', text: 'Can you hop on a call later?',     incoming: true,  time: '11:02' },
    { platform: 'instagram',text: 'Also check my latest post 😊',     incoming: true,  time: '11:45' },
    { platform: 'whatsapp', text: 'Sure — 3pm works perfectly.',      incoming: false, time: '11:50' },
  ]

  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: 680,
      margin: '0 auto',
    }}>
      {/* Window bar */}
      <div style={{
        borderBottom: '1px solid var(--line)',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-sunken)',
      }}>
        {['#FF5F57','#FEBC2E','#28C840'].map(c => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />
        ))}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-faint)', marginLeft: 8 }}>
          baard.cc — inbox
        </span>
      </div>

      <div style={{ display: 'flex', height: 300 }}>
        {/* Sidebar */}
        <div style={{ width: 180, borderRight: '1px solid var(--line)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {[
            { init: 'SC', name: 'Sarah Chen',    hue: '#D4BCFA', plats: ['slack','whatsapp','instagram'], unread: 3 },
            { init: 'MR', name: 'Marcus Rivera',  hue: '#FAC8B4', plats: ['discord','telegram'],          unread: 0 },
            { init: 'PS', name: 'Priya Sharma',   hue: '#B4E4FA', plats: ['linkedin','teams'],            unread: 1 },
          ].map((c, i) => (
            <div key={c.name} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '8px', borderRadius: 'var(--r-md)',
              background: i === 0 ? 'var(--bg-sunken)' : 'transparent',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: c.hue + '30', border: `1.5px solid ${c.hue}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: c.hue, position: 'relative',
              }}>
                {c.init}
                {c.unread > 0 && (
                  <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--bg-raised)', fontSize: 7, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)' }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? 'var(--tx)' : 'var(--tx-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                  {c.plats.slice(0,2).map(p => <PlatformBadge key={p} id={p} size="xs" />)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-bg)', border: `1.5px solid var(--accent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent-fg)' }}>SC</div>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--tx)' }}>Sarah Chen</span>
            <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
              {['slack','whatsapp','instagram'].map(p => <PlatformBadge key={p} id={p} size="xs" />)}
            </div>
          </div>

          {BUBBLES.map((b, i) => {
            const pl = PLATFORMS[b.platform]
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: b.incoming ? 'flex-start' : 'flex-end' }}>
                {(i === 0 || BUBBLES[i-1]?.platform !== b.platform) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, flexDirection: b.incoming ? 'row' : 'row-reverse' }}>
                    <PlatformBadge id={b.platform} size="xs" />
                    <span style={{ fontSize: 9, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>{b.time}</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '70%', padding: '7px 11px',
                  borderRadius: b.incoming ? '3px 10px 10px 10px' : '10px 3px 10px 10px',
                  background: b.incoming ? 'var(--bg-sunken)' : 'var(--accent-bg)',
                  border: `1px solid ${b.incoming ? 'var(--line)' : 'var(--accent)'}`,
                  borderLeft: b.incoming ? `2px solid ${pl.color}` : undefined,
                  borderRight: !b.incoming ? `2px solid ${pl.color}` : undefined,
                  fontSize: 12, color: 'var(--tx-mid)', lineHeight: 1.45,
                }}>
                  {b.text}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Landing page ───────────────────────────────────────────────────────── */
export default function Landing() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  const handleJoin = () => {
    if (!email.includes('@')) return
    setJoined(true)
  }

  return (
    <div>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ padding: '80px 40px 72px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <Tag>Private beta · baard.cc</Tag>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 68px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--tx)',
          lineHeight: 1.05,
          margin: '24px 0 18px',
        }}>
          Every message.<br />
          <span style={{ color: 'var(--accent-fg)' }}>One inbox.</span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--tx-mid)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 40px' }}>
          baard unifies your conversations from Slack, WhatsApp, Discord,
          and 7 more platforms — sorted by person, not by app.
        </p>

        {/* Waitlist */}
        {!joined ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 400, margin: '0 auto 14px' }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: 14,
                fontFamily: 'var(--font)',
                border: '1px solid var(--line-mid)',
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-raised)',
                color: 'var(--tx)',
                outline: 'none',
                transition: 'border-color var(--fast)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--line-mid)'}
            />
            <button
              onClick={handleJoin}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--btn-bg)',
                color: 'var(--btn-fg)',
                border: 'none',
                borderRadius: 'var(--r-md)',
                whiteSpace: 'nowrap',
                transition: 'background var(--fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--btn-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--btn-bg)'}
            >
              Join waitlist
            </button>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-bg)', border: `1px solid var(--accent)`,
            borderRadius: 'var(--r-md)', padding: '10px 18px', fontSize: 14,
            color: 'var(--accent-fg)', fontWeight: 500, margin: '0 auto 14px',
          }}>
            <span>✓</span> You're on the list — we'll be in touch.
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>
          Free plan available · No credit card required
        </p>

        {/* Platform row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 32 }}>
          {Object.entries(PLATFORMS).map(([id, pl]) => (
            <Chip key={id} color={pl.color}>{pl.name}</Chip>
          ))}
        </div>
      </section>

      {/* ── Inbox preview ── */}
      <section style={{ padding: '0 40px 80px' }}>
        <InboxPreview />
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: '80px 40px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Tag>How it works</Tag>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '20px 0 14px', color: 'var(--tx)' }}>
            Built differently.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--tx-mid)', maxWidth: 500, lineHeight: 1.7, marginBottom: 52 }}>
            Most aggregators are just tabbed browsers. baard actually understands who you're talking to.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)' }}>
            {[
              {
                n: '01', title: 'Connect platforms',
                body: 'Authorise via OAuth. Your tokens stay in your browser — encrypted in IndexedDB, never on our servers.',
                accent: 'var(--accent)',
              },
              {
                n: '02', title: 'Identity resolution',
                body: 'We match the same person across platforms by name, email, and phone. Sarah on Slack = Sarah on WhatsApp.',
                accent: 'var(--warm)',
              },
              {
                n: '03', title: 'One unified thread',
                body: 'All messages flow into a single chronological stream per person. Reply on any platform without leaving baard.',
                accent: 'var(--cool)',
              },
            ].map(({ n, title, body, accent }) => (
              <div key={n} style={{ background: 'var(--bg-raised)', padding: '32px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: accent, marginBottom: 16 }}>
                  {n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--tx-mid)', lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 40px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Tag>Features</Tag>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '20px 0 48px', color: 'var(--tx)' }}>
            Less noise. More signal.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { icon: '⬡', title: 'Person-first inbox',     body: 'Grouped by who, not where. One thread per human.' },
              { icon: '⚡', title: 'Real-time, zero storage', body: 'Messages relay live from platform to browser. Nothing written to disk.' },
              { icon: '↗', title: 'Reply anywhere',          body: 'Choose platform per reply. Switch mid-conversation.' },
              { icon: '🔔', title: 'Smart notifications',    body: 'One stream. Set rules by person, keyword, or platform.' },
              { icon: '🔍', title: 'Cross-platform search',  body: 'Search across every conversation, every platform, instantly.' },
              { icon: '✦', title: 'AI reply suggestions',    body: 'Context-aware replies across all your conversations. Pro feature.', highlight: true },
            ].map(({ icon, title, body, highlight }) => (
              <div key={title} style={{
                padding: '24px',
                border: `1px solid ${highlight ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 'var(--r-lg)',
                background: highlight ? 'var(--accent-bg)' : 'var(--bg-raised)',
              }}>
                <div style={{ fontSize: 20, marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--tx-mid)', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 40px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', marginBottom: 14 }}>
            Ready to simplify?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--tx-mid)', marginBottom: 32, lineHeight: 1.7 }}>
            Start free. No credit card. Upgrade when it clicks.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link
              to="/connect"
              style={{
                fontSize: 14, fontWeight: 600,
                background: 'var(--btn-bg)', color: 'var(--btn-fg)',
                padding: '11px 24px', borderRadius: 'var(--r-md)',
                transition: 'background var(--fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--btn-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--btn-bg)'}
            >
              Start for free →
            </Link>
            <Link
              to="/pricing"
              style={{
                fontSize: 14, fontWeight: 500,
                background: 'transparent', color: 'var(--tx-mid)',
                padding: '11px 20px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--line)',
                transition: 'all var(--fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--tx)'; e.currentTarget.style.borderColor = 'var(--line-mid)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-mid)'; e.currentTarget.style.borderColor = 'var(--line)' }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Status', 'Contact'].map(l => (
            <a key={l} style={{ fontSize: 13, color: 'var(--tx-faint)', transition: 'color var(--fast)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--tx-mid)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--tx-faint)'}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-faint)' }}>
          © 2025 baard.cc
        </span>
      </footer>
    </div>
  )
}
