import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge.jsx'
import PrivacyBanner from '../components/PrivacyBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const PLATFORM_LIST = [
  { id: 'slack',     tier: 'free' },
  { id: 'discord',   tier: 'free' },
  { id: 'telegram',  tier: 'free' },
  { id: 'whatsapp',  tier: 'free' },
  { id: 'messenger', tier: 'pro'  },
  { id: 'instagram', tier: 'pro'  },
  { id: 'linkedin',  tier: 'pro'  },
  { id: 'teams',     tier: 'pro'  },
  { id: 'x',         tier: 'pro'  },
  { id: 'imessage',  tier: 'pro', note: 'Mac required' },
]

const STEPS = ['Welcome', 'Connect', 'Done']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((label, i) => {
        const done = i < current, active = i === current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? 'var(--accent)' : active ? 'var(--accent-bg)' : 'var(--bg-sunken)', border: `1.5px solid ${done || active ? 'var(--accent)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: done ? '#111' : active ? 'var(--accent-fg)' : 'var(--tx-faint)', fontFamily: 'var(--mono)', transition: 'all var(--mid)' }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: active ? 'var(--accent-fg)' : done ? 'var(--tx-mid)' : 'var(--tx-faint)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: done ? 'var(--accent)' : 'var(--line)', margin: '0 8px', marginBottom: 22, transition: 'background var(--mid)' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', disabled }) {
  const s = {
    primary:   { background: 'var(--btn-bg)',   color: 'var(--btn-fg)', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--tx-mid)', border: '1px solid var(--line)' },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14, padding: '11px 22px', borderRadius: 'var(--r-md)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all var(--fast)', ...s[variant] }}>
      {children}
    </button>
  )
}

function StepWelcome({ onNext }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 420 }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 20 }}>⬡</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', marginBottom: 10 }}>Connect your platforms</h1>
      <p style={{ fontSize: 14, color: 'var(--tx-mid)', lineHeight: 1.7, marginBottom: 24 }}>Choose which messaging apps feed into your baard inbox. You can add or remove them any time in Settings.</p>
      <div style={{ marginBottom: 24 }}><PrivacyBanner /></div>
      <Btn onClick={onNext} style={{ width: '100%' }}>Choose platforms →</Btn>
    </div>
  )
}

function StepConnect({ onNext }) {
  const { user, platformConnections, connectPlatform, revokePlatform } = useAuth()
  const [busy,  setBusy]  = useState(null)
  const [error, setError] = useState(null)

  const connectedCount = Object.values(platformConnections).filter(c => c.connected).length

  // Platforms that use OAuth — clicking connect redirects to their auth flow
  const OAUTH_URLS = { slack: '/api/auth/slack' }

  const toggle = async (id) => {
    setError(null)
    if (platformConnections[id]?.connected) {
      setBusy(id)
      try {
        await revokePlatform(id)
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(null)
      }
    } else if (OAUTH_URLS[id]) {
      window.location.href = OAUTH_URLS[id]
    } else {
      setBusy(id)
      try {
        await connectPlatform(id)
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(null)
      }
    }
  }

  return (
    <div style={{ maxWidth: 500, width: '100%' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--tx)', marginBottom: 6 }}>Connect platforms</h2>
      <p style={{ fontSize: 13, color: 'var(--tx-mid)', lineHeight: 1.6, marginBottom: 16 }}>
        Free plan: any 3 platforms. <Link to="/pricing" style={{ color: 'var(--accent-fg)' }}>Upgrade for all 10 →</Link>
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 600, color: 'var(--accent-fg)' }}>{connectedCount}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connected</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 600, color: 'var(--tx-faint)' }}>{Math.max(0, 3 - connectedCount)}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free slots left</div>
        </div>
      </div>
      {error && <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {PLATFORM_LIST.map(({ id, tier, note }) => {
          const pl = PLATFORMS[id]
          const isOn = platformConnections[id]?.connected
          const isLocked = tier === 'pro' && !isOn && connectedCount >= 3 && user?.plan === 'free'
          const isBusy = busy === id
          return (
            <div key={id} onClick={() => !isLocked && !isBusy && toggle(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 'var(--r-md)', background: isOn ? pl.color + '10' : 'var(--bg-raised)', border: `1px solid ${isOn ? pl.color + '50' : 'var(--line)'}`, cursor: isLocked || isBusy ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.4 : 1, transition: 'all var(--fast)' }}>
              <PlatformBadge id={id} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isOn ? pl.color : 'var(--tx)' }}>{pl.name}</div>
                {note && <div style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>{note}</div>}
              </div>
              {isBusy ? (
                <span style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--tx-mid)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
              ) : tier === 'pro' && !isOn ? (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent-fg)', background: 'var(--accent-bg)', borderRadius: 4, padding: '1px 5px' }}>PRO</span>
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${isOn ? pl.color : 'var(--line)'}`, background: isOn ? pl.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {isOn ? '✓' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Btn onClick={onNext} disabled={connectedCount < 1} style={{ width: '100%' }}>
        {connectedCount < 1 ? 'Connect at least 1 platform' : `Continue with ${connectedCount} platform${connectedCount > 1 ? 's' : ''} →`}
      </Btn>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function StepDone({ platformConnections }) {
  const connected = Object.entries(platformConnections).filter(([, c]) => c.connected).map(([id]) => id)
  return (
    <div style={{ textAlign: 'center', maxWidth: 380 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 18px', color: 'var(--accent-fg)' }}>✓</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', marginBottom: 10 }}>You're all set.</h2>
      <p style={{ fontSize: 14, color: 'var(--tx-mid)', lineHeight: 1.7, marginBottom: 22 }}>
        {connected.length} platform{connected.length !== 1 ? 's' : ''} connected. Your unified inbox is ready.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {connected.map(id => <PlatformBadge key={id} id={id} size="sm" showName />)}
      </div>
      <Link to="/inbox" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'var(--btn-bg)', color: 'var(--btn-fg)', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
        Open inbox →
      </Link>
    </div>
  )
}

export default function Connect() {
  const [step, setStep] = useState(0)
  const { platformConnections } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
      <div style={{ padding: '18px 32px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <ThemeToggle />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <StepBar current={step} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
            {step === 1 && <StepConnect onNext={() => setStep(2)} />}
            {step === 2 && <StepDone platformConnections={platformConnections} />}
          </div>
        </div>
      </div>
    </div>
  )
}
