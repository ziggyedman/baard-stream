import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import * as slackApi from '../lib/slackApi.js'

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatSlackTime(ts) {
  const d   = new Date(parseFloat(ts) * 1000)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const yest = new Date(now - 86400000)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short' })
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ContactItem({ c, selected, msgs, onClick }) {
  const last = msgs.slice(-1)[0]
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 10, alignItems: 'center',
      padding: '9px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer',
      background: selected ? 'var(--bg-sunken)' : 'transparent',
      transition: 'background var(--fast)', marginBottom: 2,
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-sunken)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.hue + '25', border: `1.5px solid ${c.hue}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: c.hue }}>
          {c.init}
        </div>
        {c.unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, background: 'var(--accent)', color: '#111', width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', border: '1.5px solid var(--bg)' }}>
            {c.unread}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 600 : 500, color: c.unread > 0 ? 'var(--tx)' : 'var(--tx-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', flexShrink: 0, marginLeft: 6 }}>{last?.time}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{last?.text}</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {c.platforms.map(p => <PlatformBadge key={p} id={p} size="xs" />)}
        </div>
      </div>
    </div>
  )
}

function Bubble({ msg, showLabel }) {
  const pl = PLATFORMS[msg.platform]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.in ? 'flex-start' : 'flex-end', marginTop: showLabel ? 16 : 3 }}>
      {showLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexDirection: msg.in ? 'row' : 'row-reverse' }}>
          <PlatformBadge id={msg.platform} size="xs" />
          <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>{msg.time}</span>
        </div>
      )}
      <div style={{
        maxWidth: '65%', padding: '8px 12px', lineHeight: 1.5,
        borderRadius: msg.in ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
        background: msg.in ? 'var(--bg-raised)' : 'var(--accent-bg)',
        border: `1px solid ${msg.in ? 'var(--line)' : 'var(--accent)'}`,
        borderLeft:  msg.in  ? `2px solid ${pl.color}80` : undefined,
        borderRight: !msg.in ? `2px solid ${pl.color}80` : undefined,
        fontSize: 13.5, color: 'var(--tx-mid)',
      }}>
        {msg.text}
      </div>
    </div>
  )
}

/* ── Inbox page ─────────────────────────────────────────────────────────── */

export default function Inbox() {
  const { user, signOut, platformConnections } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [contacts,      setContacts]      = useState([])
  const [selectedId,    setSelectedId]    = useState(null)
  const [msgsByContact, setMsgsByContact] = useState({})
  const [filter,        setFilter]        = useState('all')
  const [replyText,     setReplyText]     = useState('')
  const [replyPlatform, setReplyPlatform] = useState('slack')
  const [search,        setSearch]        = useState('')
  const [showInfo,      setShowInfo]      = useState(false)
  const [slackLoading,  setSlackLoading]  = useState(false)
  const [slackSelf,     setSlackSelf]     = useState(null)
  const [successToast,  setSuccessToast]  = useState(location.state?.connected || null)
  const endRef = useRef(null)

  const slackConnected = platformConnections?.slack?.connected
  const anyConnected   = Object.values(platformConnections || {}).some(c => c.connected)

  const selected        = contacts.find(c => c.id === selectedId) ?? null
  const allMsgs         = msgsByContact[selectedId] || []
  const filteredMsgs    = filter === 'all' ? allMsgs : allMsgs.filter(m => m.platform === filter)
  const totalUnread     = contacts.reduce((s, c) => s + c.unread, 0)
  const visibleContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const userName  = user?.name || user?.email || 'Account'
  const userInit  = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const userEmail = user?.email || ''

  /* ── Load Slack DMs when connected ─────────────────────────────────────── */
  useEffect(() => {
    if (!slackConnected) {
      setContacts([])
      setSelectedId(null)
      setMsgsByContact({})
      setSlackSelf(null)
      return
    }

    let cancelled = false
    setSlackLoading(true)

    async function load() {
      try {
        const [self, { channels }] = await Promise.all([
          slackApi.getSelf(),
          slackApi.getDMs(),
        ])
        if (cancelled) return
        setSlackSelf(self)

        const userInfos = await Promise.all(
          channels.map(ch => slackApi.getUser(ch.user).catch(() => null))
        )
        if (cancelled) return

        const slackContacts = channels
          .map((ch, i) => {
            const u = userInfos[i]
            if (!u || u.deleted || u.is_bot) return null
            const name = u.profile.display_name || u.profile.real_name || u.name
            const init = name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
            return {
              id:        ch.id,
              name,
              init,
              hue:       '#E01E5A',
              platforms: ['slack'],
              unread:    ch.unread_count || 0,
            }
          })
          .filter(Boolean)

        if (cancelled) return
        setContacts(slackContacts)
        setSelectedId(slackContacts[0]?.id ?? null)
        setMsgsByContact({})
      } catch (err) {
        console.error('Failed to load Slack DMs:', err)
        if (!cancelled) { setContacts([]); setSelectedId(null) }
      } finally {
        if (!cancelled) setSlackLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slackConnected])

  /* ── Lazy-load messages when a Slack DM is selected ────────────────────── */
  useEffect(() => {
    if (!slackConnected || !selectedId || msgsByContact[selectedId] !== undefined || !slackSelf) return

    slackApi.getMessages(selectedId)
      .then(({ messages }) => {
        const formatted = messages
          .filter(m => m.type === 'message' && m.text && !m.subtype)
          .reverse()
          .map(m => ({
            id:       m.ts,
            platform: 'slack',
            text:     m.text,
            time:     formatSlackTime(m.ts),
            in:       m.user !== slackSelf.user_id,
          }))
        setMsgsByContact(prev => ({ ...prev, [selectedId]: formatted }))
      })
      .catch(err => console.error('Failed to load Slack messages:', err))
  }, [selectedId, slackConnected, slackSelf, msgsByContact])

  useEffect(() => {
    if (selected) setReplyPlatform(selected.platforms[0])
    setFilter('all')
  }, [selectedId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filteredMsgs.length, selectedId])

  const selectContact = id => {
    setSelectedId(id)
    setContacts(p => p.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  const send = () => {
    if (!replyText.trim() || !selected) return
    const text = replyText.trim()
    const msg  = { id: Date.now(), platform: replyPlatform, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), in: false }
    setMsgsByContact(p => ({ ...p, [selectedId]: [...(p[selectedId] || []), msg] }))
    setReplyText('')
    if (replyPlatform === 'slack' && slackConnected) {
      slackApi.sendMessage(selectedId, text).catch(err => console.error('Slack send failed:', err))
    }
  }

  useEffect(() => {
    if (!successToast) return
    const t = setTimeout(() => setSuccessToast(null), 4500)
    return () => clearTimeout(t)
  }, [successToast])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--font)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Success toast */}
      {successToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#059669', color: '#fff',
          padding: '11px 22px', borderRadius: 'var(--r-md)',
          fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
          boxShadow: '0 8px 30px rgba(5,150,105,.3)',
          zIndex: 200, whiteSpace: 'nowrap',
          animation: 'slideUp 0.25s ease',
        }}>
          ✓ Slack connected — loading your DMs
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width: 260, borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Logo size="sm" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {totalUnread > 0 && (
                <span style={{ background: 'var(--accent)', color: '#111', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 7px', fontFamily: 'var(--mono)' }}>{totalUnread}</span>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '6px 10px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="4" stroke="var(--tx-faint)" strokeWidth="1.3"/><path d="M8.5 8.5L11 11" stroke="var(--tx-faint)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--tx)', fontSize: 12, fontFamily: 'var(--font)', width: '100%' }} />
          </div>
        </div>

        {/* Contacts */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--tx-faint)', textTransform: 'uppercase', padding: '4px 4px', marginBottom: 6, fontFamily: 'var(--mono)' }}>
            Messages
          </div>

          {slackLoading ? (
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--line)', borderTopColor: '#E01E5A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>Loading…</span>
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--tx-faint)', marginBottom: anyConnected ? 0 : 10, lineHeight: 1.6 }}>
                {anyConnected ? 'No conversations yet' : 'No platforms connected'}
              </div>
              {!anyConnected && (
                <Link to="/settings" state={{ tab: 'integrations' }} style={{ fontSize: 11.5, color: 'var(--accent-fg)', textDecoration: 'none', fontWeight: 600 }}>
                  Get started →
                </Link>
              )}
            </div>
          ) : (
            visibleContacts.map(c => (
              <ContactItem key={c.id} c={c} selected={selectedId === c.id} msgs={msgsByContact[c.id] || []} onClick={() => selectContact(c.id)} />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={userName} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--line)' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent-fg)', flexShrink: 0 }}>
              {userInit}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Link to="/settings" title="Settings" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid transparent', color: 'var(--tx-faint)', transition: 'all var(--fast)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--tx)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-faint)' }}
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v1M7.5 13v1M1 7.5h1M13 7.5h1M2.93 2.93l.7.7M11.37 11.37l.7.7M2.93 12.07l.7-.7M11.37 3.63l.7-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </Link>
            <button onClick={handleSignOut} title="Sign out" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid transparent', background: 'transparent', color: 'var(--tx-faint)', cursor: 'pointer', transition: 'all var(--fast)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--tx)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-faint)' }}
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6M10 10.5L13.5 7.5 10 4.5M13.5 7.5H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
            {slackLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid var(--line)', borderTopColor: '#E01E5A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <div style={{ fontSize: 13, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>Loading conversations…</div>
              </div>
            ) : anyConnected ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--tx-faint)' }}>Select a conversation</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 400 }}>
                {/* Stacked platform icons */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 0 }}>
                  {[
                    { color: '#E01E5A', label: 'S', offset: -10, rotate: -6 },
                    { color: '#5865F2', label: 'D', offset:   0, rotate:  0 },
                    { color: '#25D366', label: 'W', offset:  10, rotate:  6 },
                  ].map(({ color, label, offset, rotate }) => (
                    <div key={label} style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: color + '18',
                      border: `1.5px solid ${color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color,
                      fontFamily: 'var(--mono)',
                      transform: `rotate(${rotate}deg) translateY(${Math.abs(offset) > 0 ? 5 : 0}px)`,
                      boxShadow: '0 4px 16px rgba(0,0,0,.07)',
                      marginLeft: offset < 0 ? 0 : -6,
                      zIndex: label === 'D' ? 2 : 1,
                      position: 'relative',
                    }}>{label}</div>
                  ))}
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', marginBottom: 10 }}>
                  One inbox for every DM
                </h2>
                <p style={{ fontSize: 14, color: 'var(--tx-mid)', lineHeight: 1.75, marginBottom: 28, maxWidth: 310, margin: '0 auto 28px' }}>
                  Connect your messaging accounts and reply to Slack, Discord, WhatsApp, and more — all from this window.
                </p>

                <Link
                  to="/settings"
                  state={{ tab: 'integrations' }}
                  style={{
                    display: 'inline-block', padding: '11px 26px',
                    background: 'var(--btn-bg)', color: 'var(--btn-fg)',
                    borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: 13.5,
                    textDecoration: 'none', letterSpacing: '-0.01em',
                  }}
                >
                  Connect a platform →
                </Link>

                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>
                  Slack available now · Discord, WhatsApp &amp; more coming soon
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: selected.hue + '25', border: `1.5px solid ${selected.hue}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: selected.hue, flexShrink: 0 }}>
                {selected.init}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx)', marginBottom: 3 }}>{selected.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selected.platforms.map(p => <PlatformBadge key={p} id={p} size="xs" showName />)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                {['all', ...selected.platforms].map(p => {
                  const active = filter === p
                  const pl = PLATFORMS[p]
                  return (
                    <button key={p} onClick={() => setFilter(p)} style={{
                      fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
                      borderRadius: 'var(--r-full)', padding: '3px 10px',
                      background: active ? (p === 'all' ? 'var(--bg-sunken)' : pl.color + '18') : 'transparent',
                      color: active ? (p === 'all' ? 'var(--tx)' : pl?.color) : 'var(--tx-faint)',
                      outline: active ? `1px solid ${p === 'all' ? 'var(--line)' : pl.color + '40'}` : 'none',
                      transition: 'all var(--fast)',
                    }}>
                      {p === 'all' ? 'All' : pl.name}
                    </button>
                  )
                })}
                <button onClick={() => setShowInfo(v => !v)} style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: showInfo ? 'var(--accent-bg)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke={showInfo ? 'var(--accent)' : 'var(--tx-faint)'} strokeWidth="1.2"/><path d="M6.5 5.5v4M6.5 4.5v.2" stroke={showInfo ? 'var(--accent)' : 'var(--tx-faint)'} strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>TODAY</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
                {filteredMsgs.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--tx-faint)', fontSize: 12, marginTop: 20 }}>No messages yet</div>
                )}
                {filteredMsgs.map((msg, i) => (
                  <Bubble key={msg.id} msg={msg}
                    showLabel={i === 0 || filteredMsgs[i-1]?.platform !== msg.platform || filteredMsgs[i-1]?.in !== msg.in}
                  />
                ))}
                <div ref={endRef} />
              </div>

              {/* Info panel */}
              {showInfo && (
                <div style={{ width: 220, borderLeft: '1px solid var(--line)', padding: '18px 16px', overflowY: 'auto', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--tx-faint)', textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 14 }}>Contact</div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: selected.hue + '25', border: `2px solid ${selected.hue}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: selected.hue, margin: '0 auto 10px' }}>{selected.init}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', marginTop: 3 }}>{selected.platforms.length} platform{selected.platforms.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--tx-faint)', textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 8 }}>Platforms</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
                    {selected.platforms.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                        <PlatformBadge id={p} size="sm" />
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-mid)', flex: 1 }}>{PLATFORMS[p].name}</span>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: PLATFORMS[p].color }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--tx-faint)', textTransform: 'uppercase', fontFamily: 'var(--mono)', marginBottom: 8 }}>Stats</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {[['Messages', allMsgs.length], ['Platforms', selected.platforms.length], ['Sent', allMsgs.filter(m => !m.in).length], ['Received', allMsgs.filter(m => m.in).length]].map(([l, v]) => (
                      <div key={l} style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '8px 10px' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', fontFamily: 'var(--mono)' }}>{v}</div>
                        <div style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply bar */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reply via</span>
                {selected.platforms.map(p => {
                  const pl = PLATFORMS[p]
                  const active = replyPlatform === p
                  return (
                    <button key={p} onClick={() => setReplyPlatform(p)} style={{
                      fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      padding: '4px 9px', borderRadius: 'var(--r-full)',
                      border: `1px solid ${active ? pl.color + '50' : 'transparent'}`,
                      background: active ? pl.color + '12' : 'transparent',
                      color: active ? pl.color : 'var(--tx-faint)',
                      display: 'flex', alignItems: 'center', gap: 5, transition: 'all var(--fast)',
                    }}>
                      <PlatformBadge id={p} size="xs" />
                      {pl.name}
                    </button>
                  )
                })}
              </div>
              <div style={{ background: 'var(--bg-raised)', border: `1px solid ${replyText ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 'var(--r-lg)', padding: '10px 12px', display: 'flex', alignItems: 'flex-end', gap: 10, transition: 'border-color var(--fast)' }}>
                <div style={{ width: 2.5, alignSelf: 'stretch', borderRadius: 2, background: PLATFORMS[replyPlatform]?.color + '80', flexShrink: 0 }} />
                <textarea rows={1} value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder={`Message via ${PLATFORMS[replyPlatform]?.name || ''}…`}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--tx)', fontSize: 13.5, lineHeight: 1.5, fontFamily: 'var(--font)', resize: 'none', maxHeight: 120, overflowY: 'auto' }}
                />
                <button onClick={send} style={{ width: 30, height: 30, borderRadius: 'var(--r-md)', border: 'none', background: replyText.trim() ? 'var(--btn-bg)' : 'var(--bg-sunken)', color: replyText.trim() ? 'var(--btn-fg)' : 'var(--tx-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'all var(--fast)', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M7.5 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>Enter to send · Shift+Enter for newline</span>
                <span style={{ fontSize: 10, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>baard.cc</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
