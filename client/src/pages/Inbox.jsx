import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PlatformBadge, { PLATFORMS } from '../components/PlatformBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/* ── Mock messages (replaced by relay in production) ───────────────────── */
const CONTACTS = [
  {
    id: 1, name: 'Sarah Chen', init: 'SC', hue: '#D4BCFA',
    platforms: ['slack', 'whatsapp', 'instagram'], unread: 3,
    messages: [
      { id: 1, platform: 'slack',     text: 'Hey! Did you review the deck I sent?',        time: '10:32', in: true  },
      { id: 2, platform: 'slack',     text: 'Yes! Really strong. Tweaks on slide 4.',       time: '10:35', in: false },
      { id: 3, platform: 'whatsapp',  text: 'Can you hop on a quick call later?',           time: '11:02', in: true  },
      { id: 4, platform: 'instagram', text: 'Just posted something you\'d love 😄',         time: '11:45', in: true  },
      { id: 5, platform: 'whatsapp',  text: 'Sure, 3pm works perfectly!',                   time: '11:50', in: false },
      { id: 6, platform: 'slack',     text: 'Amazing. Sending a calendar invite.',           time: '12:10', in: true  },
      { id: 7, platform: 'whatsapp',  text: 'Running 10 mins late, sorry! 🙏',              time: '14:52', in: true  },
    ],
  },
  {
    id: 2, name: 'Marcus Rivera', init: 'MR', hue: '#FAC8B4',
    platforms: ['telegram', 'discord', 'x'], unread: 7,
    messages: [
      { id: 1, platform: 'discord',  text: 'The new update just dropped 🔥',               time: '09:15', in: true  },
      { id: 2, platform: 'x',        text: 'Thread already at 50k impressions!',            time: '09:45', in: true  },
      { id: 3, platform: 'telegram', text: 'Big announcement in the channel.',              time: '10:20', in: true  },
      { id: 4, platform: 'discord',  text: 'What\'s the announcement?!',                   time: '10:25', in: false },
      { id: 5, platform: 'telegram', text: 'Series A 🚀🚀🚀 We closed it!!',               time: '10:30', in: true  },
      { id: 6, platform: 'x',        text: 'Congrats!! This is huge.',                     time: '10:32', in: false },
      { id: 7, platform: 'discord',  text: 'Celebrating tonight — you coming?',            time: '11:00', in: true  },
    ],
  },
  {
    id: 3, name: 'Priya Sharma', init: 'PS', hue: '#B4E4FA',
    platforms: ['linkedin', 'teams', 'whatsapp'], unread: 1,
    messages: [
      { id: 1, platform: 'linkedin', text: 'Loved your article on AI trends!',             time: 'Yesterday', in: true  },
      { id: 2, platform: 'linkedin', text: 'Thank you! Working on part 2.',                time: 'Yesterday', in: false },
      { id: 3, platform: 'teams',    text: 'Joining the 9am standup?',                     time: '08:30',     in: true  },
      { id: 4, platform: 'teams',    text: 'Yes, will be there in 5.',                     time: '08:55',     in: false },
      { id: 5, platform: 'whatsapp', text: 'The client loved the proposal! 🎉',            time: '14:15',     in: true  },
    ],
  },
  {
    id: 4, name: 'Alex Thompson', init: 'AT', hue: '#FAC8B4',
    platforms: ['messenger', 'imessage'], unread: 0,
    messages: [
      { id: 1, platform: 'imessage',  text: 'Happy birthday!! 🎂',                         time: 'Mon', in: true  },
      { id: 2, platform: 'messenger', text: 'Thank you!! Best day 😊',                     time: 'Mon', in: false },
      { id: 3, platform: 'imessage',  text: 'We need to catch up soon.',                   time: 'Mon', in: true  },
      { id: 4, platform: 'messenger', text: 'Absolutely! Coffee next week?',               time: 'Mon', in: false },
      { id: 5, platform: 'imessage',  text: 'Saturday morning works!',                     time: 'Tue', in: true  },
    ],
  },
  {
    id: 5, name: 'Jordan Lee', init: 'JL', hue: '#D4BCFA',
    platforms: ['slack', 'teams', 'discord'], unread: 2,
    messages: [
      { id: 1, platform: 'teams',   text: 'Sprint review at 4pm today ✅',                time: '08:00', in: true  },
      { id: 2, platform: 'slack',   text: 'Can you drop the metrics in the channel?',     time: '09:30', in: true  },
      { id: 3, platform: 'slack',   text: 'Just shared it — #product-metrics',            time: '09:35', in: false },
      { id: 4, platform: 'discord', text: 'Game night Friday? Everyone\'s in 🎮',        time: '10:45', in: true  },
      { id: 5, platform: 'teams',   text: 'Q3 numbers look really solid 💪',             time: '13:00', in: true  },
    ],
  },
]

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
        borderLeft: msg.in ? `2px solid ${pl.color}80` : undefined,
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
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [contacts,       setContacts]       = useState(CONTACTS)
  const [selectedId,     setSelectedId]     = useState(1)
  const [msgsByContact,  setMsgsByContact]  = useState(Object.fromEntries(CONTACTS.map(c => [c.id, c.messages])))
  const [filter,         setFilter]         = useState('all')
  const [replyText,      setReplyText]      = useState('')
  const [replyPlatform,  setReplyPlatform]  = useState('slack')
  const [search,         setSearch]         = useState('')
  const [showInfo,       setShowInfo]       = useState(false)
  const endRef = useRef(null)

  const selected        = contacts.find(c => c.id === selectedId)
  const allMsgs         = msgsByContact[selectedId] || []
  const filteredMsgs    = filter === 'all' ? allMsgs : allMsgs.filter(m => m.platform === filter)
  const totalUnread     = contacts.reduce((s, c) => s + c.unread, 0)
  const visibleContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const userName  = user?.name || user?.email || 'Account'
  const userInit  = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const userEmail = user?.email || ''

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
    if (!replyText.trim()) return
    const msg = { id: Date.now(), platform: replyPlatform, text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), in: false }
    setMsgsByContact(p => ({ ...p, [selectedId]: [...(p[selectedId] || []), msg] }))
    setReplyText('')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--font)' }}>

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
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--tx-faint)', textTransform: 'uppercase', padding: '4px 4px', marginBottom: 6, fontFamily: 'var(--mono)' }}>People</div>
          {visibleContacts.map(c => (
            <ContactItem key={c.id} c={c} selected={selectedId === c.id} msgs={msgsByContact[c.id] || []} onClick={() => selectContact(c.id)} />
          ))}
        </div>

        {/* Footer — user info */}
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
                <div style={{ fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', marginTop: 3 }}>{selected.platforms.length} platforms</div>
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
      </div>
    </div>
  )
}
