import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge.jsx'
import PrivacyBanner from '../components/PrivacyBanner.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { user as userApi } from '../lib/api.js'

/* ── Primitives ─────────────────────────────────────────────────────────── */

function Section({ title, description, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</h2>
        {description && <p style={{ fontSize: 13, color: 'var(--tx-mid)', lineHeight: 1.6 }}>{description}</p>}
      </div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--bg-raised)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, description, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '13px 18px', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', marginBottom: description ? 2 : 0 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--tx-faint)', lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange, color = 'var(--accent)' }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value} style={{ width: 38, height: 22, borderRadius: 11, border: 'none', background: value ? color : 'var(--line-mid)', position: 'relative', cursor: 'pointer', transition: 'background 200ms' }}>
      <span style={{ position: 'absolute', top: 3, left: value ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--tx)', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '6px 28px 6px 10px', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0A09A' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', minWidth: 140 }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function Inp({ value, onChange, type = 'text', placeholder, width = 220 }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--tx)', background: 'var(--bg-sunken)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 'var(--r-md)', padding: '7px 11px', outline: 'none', width, transition: 'border-color var(--fast)' }} />
  )
}

function Btn({ children, onClick, variant = 'default', danger }) {
  const [hov, setH] = useState(false)
  const s = {
    default: { bg: hov ? 'var(--bg-sunken)' : 'transparent', color: 'var(--tx-mid)', border: '1px solid var(--line)' },
    primary: { bg: hov ? 'var(--btn-hover)' : 'var(--btn-bg)', color: 'var(--btn-fg)', border: 'none' },
    accent:  { bg: hov ? 'var(--accent-bg)' : 'transparent', color: 'var(--accent-fg)', border: '1px solid var(--accent)' },
    danger:  { bg: hov ? '#FEE2E2' : 'transparent', color: '#DC2626', border: '1px solid #FECACA' },
  }
  const v = danger ? 'danger' : variant
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ fontFamily: 'var(--font)', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: '6px 14px', borderRadius: 'var(--r-md)', transition: 'all var(--fast)', background: s[v].bg, color: s[v].color, border: s[v].border }}>{children}</button>
  )
}

/* ── Save toast ─────────────────────────────────────────────────────────── */
function SaveToast({ show }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--tx)', color: 'var(--bg)', padding: '10px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-lg)', transition: 'all 0.3s', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(8px)', pointerEvents: 'none', zIndex: 100 }}>
      ✓ Settings saved
    </div>
  )
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'integrations',  label: 'Integrations',        icon: '⬡' },
  { id: 'privacy',       label: 'Privacy & Data',      icon: '🔒' },
  { id: 'profile',       label: 'Profile',             icon: '○' },
  { id: 'notifications', label: 'Notifications',       icon: '🔔' },
  { id: 'appearance',    label: 'Appearance',          icon: '◑' },
  { id: 'account',       label: 'Account & Plan',      icon: '◻' },
  { id: 'security',      label: 'Security',            icon: '⬡' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   PANELS
═══════════════════════════════════════════════════════════════════════════ */

function PrivacyPanel({ settings, onSave }) {
  const today = new Date().toISOString().split('T')[0]
  const [historyFrom, setHistoryFrom] = useState(settings?.history_from?.split('T')[0] || '2024-01-01')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await onSave({ history_from: historyFrom })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const quickSet = (days) => {
    const d = new Date(); d.setDate(d.getDate() - days)
    setHistoryFrom(d.toISOString().split('T')[0])
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}><PrivacyBanner /></div>

      <Section title="What baard stores" description="A precise breakdown of every data type.">
        {[
          { label: 'Your messages',          stored: false, note: 'Relayed live. Never written to disk.' },
          { label: 'Message content',         stored: false, note: 'Passes through memory only. Gone when you close the tab.' },
          { label: 'Platform OAuth tokens',   stored: false, note: 'Encrypted in your browser\'s IndexedDB. Never leaves your device.' },
          { label: 'Your account email',      stored: true,  note: 'Required to identify your account.' },
          { label: 'Platform connection IDs', stored: true,  note: 'e.g. your Slack workspace ID, so webhooks reach the right account.' },
          { label: 'Your preferences',        stored: true,  note: 'Settings, notification rules, appearance.' },
          { label: 'History start date',      stored: true,  note: 'Tells each platform how far back to pull.' },
          { label: 'Billing records',         stored: true,  note: 'Managed via Stripe. We store only your plan and status.' },
        ].map((item, i, arr) => (
          <Row key={item.label} label={item.label} description={item.note} last={i === arr.length - 1}>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: item.stored ? 'var(--bg-sunken)' : 'var(--accent-bg)', color: item.stored ? 'var(--tx-faint)' : 'var(--accent-fg)', border: `1px solid ${item.stored ? 'var(--line)' : 'var(--accent)'}` }}>
              {item.stored ? 'Stored' : 'Never stored'}
            </span>
          </Row>
        ))}
      </Section>

      <Section title="Message history window" description="baard only fetches messages from this date onwards. Enforced at the relay layer.">
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Load messages from</div>
              <input type="date" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--tx)', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '7px 11px', outline: 'none' }} />
            </div>
            <Btn variant="primary" onClick={save}>{saved ? '✓ Saved' : 'Save'}</Btn>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['Last 7 days', 7], ['Last 30 days', 30], ['Last 90 days', 90]].map(([l, d]) => (
              <button key={l} onClick={() => quickSet(d)} style={{ fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', padding: '3px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--tx-faint)', transition: 'all var(--fast)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-fg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--tx-faint)' }}
              >{l}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Your data rights">
        <Row label="Export account data" description="Download your account info, settings, and connection IDs as JSON.">
          <Btn>Export JSON</Btn>
        </Row>
        <Row label="Delete account" description="Permanently deletes your account and all stored data." last>
          <Btn danger>Request deletion</Btn>
        </Row>
      </Section>
    </div>
  )
}

function ProfilePanel({ onSave }) {
  const { user } = useAuth()
  const [name,  setName]  = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setError(null)
    try {
      await userApi.updateProfile({ name, email })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (err) { setError(err.message) }
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div>
      <Section title="Public profile">
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={name} style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--line)' }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'var(--accent-fg)', flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--tx-mid)', lineHeight: 1.6 }}>
            {user?.google_id ? 'Avatar synced from your Google account.' : 'Initials avatar — set a profile photo via Google sign-in.'}
          </div>
        </div>
        <Row label="Display name"><Inp value={name} onChange={setName} placeholder="Your name" /></Row>
        <Row label="Email address" last><Inp value={email} onChange={setEmail} type="email" placeholder="you@example.com" /></Row>
      </Section>
      {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="primary" onClick={save}>{saved ? '✓ Saved' : 'Save changes'}</Btn>
      </div>
    </div>
  )
}

// Platforms with working OAuth — others show "Coming soon"
const OAUTH_URLS = { slack: '/api/auth/slack' }

function IntegrationsPanel() {
  const { user, platformConnections, revokePlatform } = useAuth()
  const [confirming, setConfirming] = useState(null)
  const [error,      setError]      = useState(null)
  const connectedCount = Object.values(platformConnections).filter(c => c.connected).length

  const handleConnect = (id) => {
    if (OAUTH_URLS[id]) window.location.href = OAUTH_URLS[id]
  }

  const handleRevoke = async (id) => {
    setConfirming(null); setError(null)
    try { await revokePlatform(id) }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}><PrivacyBanner compact /></div>
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', fontSize: 13, color: '#DC2626', marginBottom: 14 }}>{error}</div>
      )}

      <Section title="Messaging platforms" description="Connect your accounts to bring all your DMs into one inbox. OAuth tokens are stored only in your browser — never on our servers.">
        {Object.entries(PLATFORMS).map(([id, pl], i, arr) => {
          const conn         = platformConnections[id] || { connected: false }
          const isAvailable  = !!OAUTH_URLS[id]
          const isLast       = i === arr.length - 1
          const isConfirming = confirming === id

          return (
            <div key={id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--line)', opacity: isAvailable ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px' }}>
                <PlatformBadge id={id} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{pl.name}</span>
                    {!isAvailable && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--tx-faint)', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 99, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Soon</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: conn.connected ? pl.color : 'var(--tx-faint)' }}>
                    {conn.connected
                      ? `Connected${conn.connectedAt ? ' · ' + new Date(conn.connectedAt).toLocaleDateString() : ''}`
                      : isAvailable ? 'Not connected' : 'Coming soon'}
                  </div>
                </div>

                {isAvailable && (
                  conn.revoking ? (
                    <span style={{ fontSize: 12, color: 'var(--tx-faint)' }}>Revoking…</span>
                  ) : conn.connected ? (
                    isConfirming ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--tx-mid)' }}>Disconnect?</span>
                        <Btn danger onClick={() => handleRevoke(id)}>Yes, revoke</Btn>
                        <Btn onClick={() => setConfirming(null)}>Cancel</Btn>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: pl.color }} />
                          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--tx-faint)' }}>Live</span>
                        </div>
                        <Btn onClick={() => setConfirming(id)}>Disconnect</Btn>
                      </div>
                    )
                  ) : (
                    <Btn variant="accent" onClick={() => handleConnect(id)}>Connect →</Btn>
                  )
                )}
              </div>

              {isConfirming && (
                <div style={{ margin: '0 18px 12px', padding: '9px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--tx-mid)', lineHeight: 1.6 }}>
                  baard will stop relaying messages from <strong>{pl.name}</strong>. Your messages on {pl.name} are untouched.
                </div>
              )}
            </div>
          )
        })}
      </Section>

      <Section title="Plan usage">
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < connectedCount ? 'var(--accent)' : 'var(--line)', transition: 'background var(--fast)' }} />
            ))}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--tx-faint)' }}>
            {connectedCount} of {user?.plan === 'free' ? 3 : 10} platforms connected ·{' '}
            {user?.plan === 'free' && <Link to="/pricing" style={{ color: 'var(--accent-fg)' }}>Upgrade to Pro →</Link>}
          </div>
        </div>
      </Section>
    </div>
  )
}

function NotificationsPanel({ settings, onSave }) {
  const s = settings || {}
  const [browser,     setBrowser]     = useState(s.notif_browser ?? true)
  const [sound,       setSound]       = useState(s.notif_sound ?? false)
  const [badge,       setBadge]       = useState(s.notif_badge ?? true)
  const [priority,    setPriority]    = useState(s.notif_priority || 'all')
  const [quietEn,     setQuietEn]     = useState(s.quiet_hours_enabled ?? false)
  const [quietStart,  setQuietStart]  = useState(s.quiet_hours_start || '22:00')
  const [quietEnd,    setQuietEnd]    = useState(s.quiet_hours_end || '08:00')
  const [perPlatform, setPerPlatform] = useState(s.notif_per_platform || {})

  const save = () => onSave({ notif_browser: browser, notif_sound: sound, notif_badge: badge, notif_priority: priority, quiet_hours_enabled: quietEn, quiet_hours_start: quietStart, quiet_hours_end: quietEnd, notif_per_platform: perPlatform })

  const hours = Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:00`])

  return (
    <div>
      <Section title="Browser notifications">
        <Row label="Enable browser notifications"><Toggle value={browser} onChange={v => { setBrowser(v); onSave({ notif_browser: v }) }} /></Row>
        <Row label="Notification sound"><Toggle value={sound} onChange={v => { setSound(v); onSave({ notif_sound: v }) }} /></Row>
        <Row label="Unread badge on tab" last><Toggle value={badge} onChange={v => { setBadge(v); onSave({ notif_badge: v }) }} /></Row>
      </Section>
      <Section title="Priority">
        <Row label="Notify me about" last>
          <Select value={priority} onChange={v => { setPriority(v); onSave({ notif_priority: v }) }} options={[['all','All messages'],['direct','Direct messages only'],['mentions','Mentions & keywords'],['none','Silent mode']]} />
        </Row>
      </Section>
      <Section title="Quiet hours">
        <Row label="Enable quiet hours"><Toggle value={quietEn} onChange={v => { setQuietEn(v); onSave({ quiet_hours_enabled: v }) }} /></Row>
        <Row label="Window" last>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: quietEn ? 1 : 0.4 }}>
            <Select value={quietStart} onChange={v => { setQuietStart(v); onSave({ quiet_hours_start: v }) }} options={hours} />
            <span style={{ fontSize: 12, color: 'var(--tx-faint)' }}>to</span>
            <Select value={quietEnd} onChange={v => { setQuietEnd(v); onSave({ quiet_hours_end: v }) }} options={hours} />
          </div>
        </Row>
      </Section>
      <Section title="Per-platform">
        {Object.entries(PLATFORMS).map(([id, pl], i, arr) => (
          <Row key={id} label={pl.name} last={i === arr.length - 1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlatformBadge id={id} size="xs" />
              <Toggle value={perPlatform[id] !== false} onChange={v => { const n = { ...perPlatform, [id]: v }; setPerPlatform(n); onSave({ notif_per_platform: n }) }} color={pl.color} />
            </div>
          </Row>
        ))}
      </Section>
    </div>
  )
}

function AppearancePanel({ settings, onSave }) {
  const { theme, toggle } = useTheme()
  const s = settings || {}
  const [density,    setDensity]    = useState(s.density || 'comfortable')
  const [fontSize,   setFontSize]   = useState(s.font_size || 'medium')
  const [sidebarW,   setSidebarW]   = useState(s.sidebar_width || 'medium')
  const [grouping,   setGrouping]   = useState(s.message_grouping || 'platform')
  const [timestamps, setTimestamps] = useState(s.timestamps_format || 'relative')

  const row = (label, val, setVal, key, opts) => (
    <Row label={label}>
      <Select value={val} onChange={v => { setVal(v); onSave({ [key]: v }) }} options={opts} />
    </Row>
  )

  return (
    <div>
      <Section title="Theme">
        <Row label="Colour mode">
          <div style={{ display: 'flex', gap: 6 }}>
            {[['light','☀ Light'],['dark','☾ Dark']].map(([val, label]) => (
              <button key={val} onClick={() => { if (theme !== val) toggle() }} style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '5px 12px', borderRadius: 'var(--r-md)', background: theme === val ? 'var(--bg-sunken)' : 'transparent', border: `1px solid ${theme === val ? 'var(--line-mid)' : 'var(--line)'}`, color: theme === val ? 'var(--tx)' : 'var(--tx-faint)', transition: 'all var(--fast)' }}>{label}</button>
            ))}
          </div>
        </Row>
        <Row label="Accent colour" description="Custom colours coming soon." last>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#D4BCFA', border: '1px solid var(--line)' }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx-faint)' }}>#D4BCFA</span>
          </div>
        </Row>
      </Section>
      <Section title="Layout">
        {row('Message density', density, setDensity, 'density', [['compact','Compact'],['comfortable','Comfortable'],['spacious','Spacious']])}
        {row('Font size', fontSize, setFontSize, 'font_size', [['small','Small'],['medium','Medium'],['large','Large']])}
        {row('Sidebar width', sidebarW, setSidebarW, 'sidebar_width', [['narrow','Narrow'],['medium','Medium'],['wide','Wide']])}
        <Row label="Message grouping" last>
          <Select value={grouping} onChange={v => { setGrouping(v); onSave({ message_grouping: v }) }} options={[['platform','By platform'],['time','By time'],['none','None']]} />
        </Row>
      </Section>
      <Section title="Timestamps">
        <Row label="Format" last>
          <Select value={timestamps} onChange={v => { setTimestamps(v); onSave({ timestamps_format: v }) }} options={[['relative','Relative (10 min ago)'],['time','Time only (14:32)'],['full','Full date + time']]} />
        </Row>
      </Section>
    </div>
  )
}

function AccountPanel() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [curPw,  setCurPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')
  const [pwMsg,  setPwMsg]  = useState(null)
  const [pwErr,  setPwErr]  = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)

  const changePassword = async () => {
    setPwErr(null); setPwMsg(null)
    try {
      await userApi.changePassword({ currentPassword: curPw, newPassword: newPw })
      setPwMsg('Password updated.'); setCurPw(''); setNewPw('')
    } catch (err) { setPwErr(err.message) }
  }

  const deleteAccount = async () => {
    try {
      await userApi.deleteAccount()
      await signOut()
      navigate('/', { replace: true })
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <Section title="Plan">
        <Row label="Current plan" description={`${user?.plan === 'free' ? 'Free — 3 platforms' : user?.plan === 'pro' ? 'Pro — all 10 platforms' : 'Power — full access'}`}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx-mid)', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 99, padding: '3px 10px', textTransform: 'uppercase' }}>{user?.plan}</span>
            {user?.plan === 'free' && <Link to="/pricing"><Btn variant="accent">Upgrade →</Btn></Link>}
          </div>
        </Row>
        <Row label="Member since" last>
          <span style={{ fontSize: 13, color: 'var(--tx-mid)', fontFamily: 'var(--mono)' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
        </Row>
      </Section>

      {!user?.google_id && (
        <Section title="Change password">
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
              <Inp value={curPw} onChange={setCurPw} type="password" placeholder="Current password" width={280} />
              <Inp value={newPw} onChange={setNewPw} type="password" placeholder="New password (min. 8 chars)" width={280} />
              {pwErr && <div style={{ fontSize: 12, color: '#DC2626' }}>{pwErr}</div>}
              {pwMsg && <div style={{ fontSize: 12, color: 'var(--accent-fg)' }}>{pwMsg}</div>}
              <div><Btn variant="primary" onClick={changePassword}>Update password</Btn></div>
            </div>
          </div>
        </Section>
      )}

      {user?.google_id && (
        <Section title="Sign-in method">
          <Row label="Google account" description={user.email} last>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--tx-faint)', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 99, padding: '3px 10px' }}>Managed by Google</span>
          </Row>
        </Section>
      )}

      <Section title="Danger zone">
        <Row label="Pause relays" description="Temporarily stop all platform relays. Account stays active.">
          <Btn>Pause</Btn>
        </Row>
        <Row label="Delete account" description="Permanently deletes your account and all data. Irreversible." last>
          {delConfirm ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn danger onClick={deleteAccount}>Yes, delete everything</Btn>
              <Btn onClick={() => setDelConfirm(false)}>Cancel</Btn>
            </div>
          ) : (
            <Btn danger onClick={() => setDelConfirm(true)}>Delete account</Btn>
          )}
        </Row>
      </Section>
    </div>
  )
}

function SecurityPanel() {
  return (
    <div>
      <Section title="Active sessions" description="Devices currently signed in. JWT sessions expire after 7 days.">
        <Row label="Current session" description={`This device · ${new Date().toLocaleDateString()}`} last>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent-fg)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 99, padding: '2px 8px' }}>Active</span>
        </Row>
      </Section>
      <Section title="Session security">
        <Row label="Session duration" description="You are automatically signed out after 7 days of inactivity." last>
          <span style={{ fontSize: 12, color: 'var(--tx-mid)', fontFamily: 'var(--mono)' }}>7 days</span>
        </Row>
      </Section>
      <Section title="Privacy reminders">
        {[
          'Messages are relayed live and never stored on baard servers.',
          'Platform OAuth tokens are encrypted in your browser only.',
          'Revoking a platform immediately stops the relay.',
          'Deleting your account removes all data within 24 hours.',
        ].map((tip, i, arr) => (
          <Row key={i} label={tip} last={i === arr.length - 1}>
            <span style={{ color: 'var(--accent-fg)', fontSize: 14 }}>✓</span>
          </Row>
        ))}
      </Section>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */

export default function Settings() {
  const location = useLocation()
  const [active, setActive]   = useState(location.state?.tab || 'integrations')
  const [toast,  setToast]    = useState(false)
  const { user, settings, signOut, saveSettings } = useAuth()
  const navigate = useNavigate()

  const handleSave = useCallback(async (patch) => {
    try {
      await saveSettings(patch)
      setToast(true); setTimeout(() => setToast(false), 2200)
    } catch (err) {
      console.error('Settings save error:', err)
    }
  }, [saveSettings])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const PANELS = {
    integrations:  () => <IntegrationsPanel />,
    privacy:       () => <PrivacyPanel settings={settings} onSave={handleSave} />,
    profile:       () => <ProfilePanel onSave={handleSave} />,
    notifications: () => <NotificationsPanel settings={settings} onSave={handleSave} />,
    appearance:    () => <AppearancePanel settings={settings} onSave={handleSave} />,
    account:       () => <AccountPanel />,
    security:      () => <SecurityPanel />,
  }

  const ActivePanel = PANELS[active]
  const userName = user?.name || user?.email || 'Account'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size="sm" />
          <span style={{ color: 'var(--line-mid)', fontSize: 16 }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-mid)' }}>Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>{userName}</span>
          <ThemeToggle />
          <button onClick={handleSignOut} style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-mid)', padding: '5px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font)' }}>Sign out</button>
          <Link to="/inbox" style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-mid)', padding: '6px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>← Inbox</Link>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 210, borderRight: '1px solid var(--line)', padding: '18px 10px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--tx-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', marginBottom: 4 }}>Settings</div>
          {SECTIONS.map(s => {
            const isActive = active === s.id
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 'var(--r-md)', background: isActive ? 'var(--bg-sunken)' : 'transparent', fontFamily: 'var(--font)', transition: 'background var(--fast)' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-sunken)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--tx)' : 'var(--tx-mid)', flex: 1 }}>{s.label}</span>
                {s.badge && <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--accent-fg)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 99, padding: '1px 5px', whiteSpace: 'nowrap' }}>{s.badge}</span>}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', maxWidth: 700 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--tx)', marginBottom: 4 }}>{SECTIONS.find(s => s.id === active)?.label}</h1>
          <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }} />
          <ActivePanel />
        </div>
      </div>

      <SaveToast show={toast} />
    </div>
  )
}
