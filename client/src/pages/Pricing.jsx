import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Logo from '../components/Logo.jsx'

const PLANS = [
  {
    id: 'free', name: 'Free', mo: 0, yr: 0,
    desc: 'Try baard with your top 3 platforms.',
    cta: 'Start for free', ctaPrimary: false,
    features: [
      [true,  '3 platform connections'],
      [true,  'Unlimited contacts'],
      [true,  'Person-centric unified inbox'],
      [true,  'Real-time relay — zero storage'],
      [true,  'Cross-platform replies'],
      [true,  'Browser notifications'],
      [false, 'All 10 platforms'],
      [false, 'AI reply suggestions'],
      [false, 'Custom notification rules'],
      [false, 'iMessage Mac bridge'],
    ],
  },
  {
    id: 'pro', name: 'Pro', mo: 12, yr: 9,
    desc: 'For power users who live in their DMs.',
    cta: 'Start 14-day trial', ctaPrimary: true, badge: 'Most popular',
    features: [
      [true,  'Everything in Free'],
      [true,  'All 10 platform connections'],
      [true,  'AI reply suggestions'],
      [true,  'Custom notification rules'],
      [true,  'Keyboard-first shortcuts'],
      [true,  'iMessage Mac bridge'],
      [true,  'Snooze & follow-up reminders'],
      [true,  'Priority inbox filter'],
      [false, 'CRM export'],
      [false, 'Analytics dashboard'],
    ],
  },
  {
    id: 'power', name: 'Power', mo: 24, yr: 18,
    desc: 'For solopreneurs who close deals in DMs.',
    cta: 'Start 14-day trial', ctaPrimary: false,
    features: [
      [true, 'Everything in Pro'],
      [true, 'CRM export (HubSpot, CSV)'],
      [true, 'Analytics dashboard'],
      [true, 'Contact tagging & notes'],
      [true, 'Team inbox sharing (up to 3)'],
      [true, 'Webhook API access'],
      [true, 'Advanced search'],
      [true, 'Priority support & onboarding'],
      [true, 'Early access to new platforms'],
      [true, 'Custom data retention policy'],
    ],
  },
]

const FAQ = [
  { q: 'Does baard store my messages?', a: 'Never. baard is a stateless relay — messages pass directly from each platform to your browser in real-time and are never written to any database.' },
  { q: 'Where are my OAuth tokens stored?', a: 'In your browser\'s encrypted IndexedDB, on your device only. Our relay server never persists them. You can revoke access from each platform\'s own settings at any time.' },
  { q: 'Which platforms are on the Free plan?', a: 'Any 3 of your choice from our full catalogue of 10 platforms. We recommend starting with Slack, Telegram, and WhatsApp.' },
  { q: 'How does iMessage work?', a: 'iMessage requires a lightweight Mac bridge app (included with Pro and Power). It runs locally and relays iMessages to baard via WebSocket. Your Mac needs to be on and connected.' },
  { q: 'Can I cancel at any time?', a: 'Yes — no contracts, no friction. Cancel from your account settings and you keep access until the end of your billing period.' },
]

function Check({ active, accent }) {
  if (!active) return <span style={{ color: 'var(--tx-faint)', fontSize: 14, lineHeight: 1 }}>—</span>
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill={accent + '20'} stroke={accent + '60'}/>
      <path d="M5 8l2.5 2.5L11 5.5" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ padding: '72px 40px 60px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Pricing
        </span>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--tx)', margin: '14px 0 12px' }}>
          Start free.<br/>Scale when ready.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--tx-mid)', lineHeight: 1.7, marginBottom: 36 }}>
          Transparent pricing. No hidden fees. Cancel any time.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-sunken)', borderRadius: 'var(--r-full)', padding: 3, border: '1px solid var(--line)', gap: 2 }}>
          {[['Monthly', false], ['Annual', true]].map(([label, val]) => (
            <button
              key={label}
              onClick={() => setAnnual(val)}
              style={{
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, border: 'none',
                padding: '6px 16px', borderRadius: 'var(--r-full)',
                background: annual === val ? 'var(--bg-raised)' : 'transparent',
                color: annual === val ? 'var(--tx)' : 'var(--tx-mid)',
                boxShadow: annual === val ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--fast) var(--ease)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {label}
              {val && (
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-fg)', background: 'var(--accent-bg)', borderRadius: 99, padding: '2px 6px' }}>
                  −25%
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
          {PLANS.map(plan => {
            const price = annual ? plan.yr : plan.mo
            const accent = plan.id === 'pro' ? 'var(--accent-fg)' : plan.id === 'power' ? 'var(--warm-fg)' : 'var(--tx-mid)'
            const accentRaw = plan.id === 'pro' ? '#6B3FD4' : plan.id === 'power' ? '#C4602A' : '#888'

            return (
              <div
                key={plan.id}
                style={{
                  background: plan.ctaPrimary ? 'var(--accent-bg)' : 'var(--bg-raised)',
                  border: `1px solid ${plan.ctaPrimary ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 'var(--r-xl)',
                  padding: '28px 24px',
                  position: 'relative',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#111', fontSize: 10, fontWeight: 700,
                    borderRadius: 99, padding: '3px 10px', fontFamily: 'var(--mono)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  {plan.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  {price > 0 && <span style={{ fontSize: 15, color: 'var(--tx-mid)', fontWeight: 400 }}>$</span>}
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--tx)', lineHeight: 1 }}>
                    {price === 0 ? 'Free' : price}
                  </span>
                  {price > 0 && <span style={{ fontSize: 13, color: 'var(--tx-mid)'}}>/mo</span>}
                </div>

                {annual && price > 0 && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-faint)', marginBottom: 4 }}>
                    ${price * 12} billed yearly
                  </div>
                )}

                <p style={{ fontSize: 13, color: 'var(--tx-mid)', marginBottom: 20, lineHeight: 1.5, marginTop: 8 }}>
                  {plan.desc}
                </p>

                <Link
                  to="/connect"
                  style={{
                    display: 'block', textAlign: 'center',
                    fontSize: 13, fontWeight: 600,
                    padding: '10px 0', borderRadius: 'var(--r-md)',
                    border: plan.ctaPrimary ? 'none' : '1px solid var(--line)',
                    background: plan.ctaPrimary ? 'var(--btn-bg)' : 'transparent',
                    color: plan.ctaPrimary ? 'var(--btn-fg)' : 'var(--tx-mid)',
                    marginBottom: 20,
                    transition: 'all var(--fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = plan.ctaPrimary ? 'var(--btn-hover)' : 'var(--bg-sunken)'; e.currentTarget.style.color = plan.ctaPrimary ? 'var(--btn-fg)' : 'var(--tx)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = plan.ctaPrimary ? 'var(--btn-bg)' : 'transparent'; e.currentTarget.style.color = plan.ctaPrimary ? 'var(--btn-fg)' : 'var(--tx-mid)' }}
                >
                  {plan.cta} →
                </Link>

                <div style={{ height: 1, background: 'var(--line)', marginBottom: 18 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map(([included, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Check active={included} accent={accentRaw} />
                      <span style={{ fontSize: 12, color: included ? 'var(--tx-mid)' : 'var(--tx-faint)', lineHeight: 1.4 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Trust row ── */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '32px 40px', background: 'var(--bg-raised)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 28 }}>
          {[
            ['🔒', 'Zero message storage', 'Messages never touch our DB'],
            ['↺',  'Cancel any time',       'No lock-in, no contracts'],
            ['✦',  '14-day free trial',      'Full Pro access, no card needed'],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-faint)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 40px', maxWidth: 640, margin: '0 auto' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FAQ</span>
        <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', margin: '14px 0 36px' }}>
          Common questions.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQ.map((item, i) => (
            <div
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                overflow: 'hidden', cursor: 'pointer',
                background: openFaq === i ? 'var(--bg-raised)' : 'transparent',
                transition: 'background var(--fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)', flex: 1 }}>{item.q}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform var(--fast)', flexShrink: 0 }}>
                  <path d="M2 4l4 4 4-4" stroke="var(--tx-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {openFaq === i && (
                <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--tx-mid)', lineHeight: 1.7, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Logo size="sm" />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-faint)' }}>© 2025 baard.cc</span>
      </footer>
    </div>
  )
}
