import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const NAV_LINKS = [
  { label: 'Product',      to: '/#how'     },
  { label: 'Pricing',      to: '/pricing'  },
  { label: 'Open inbox',   to: '/inbox'    },
]

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--line)',
      padding: '0 40px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
    }}>
      <Logo />

      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_LINKS.map(({ label, to }) => {
          const active = pathname === to || (to.startsWith('/') && !to.includes('#') && pathname === to)
          return (
            <Link
              key={label}
              to={to}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: active ? 'var(--tx)' : 'var(--tx-mid)',
                padding: '6px 12px',
                borderRadius: 'var(--r-md)',
                transition: 'color var(--fast), background var(--fast)',
                background: active ? 'var(--bg-sunken)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--tx)'; e.currentTarget.style.background = 'var(--bg-sunken)' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--tx-mid)'; e.currentTarget.style.background = 'transparent' }}}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />
        <Link
          to="/connect"
          style={{
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--btn-bg)',
            color: 'var(--btn-fg)',
            padding: '7px 16px',
            borderRadius: 'var(--r-md)',
            transition: 'background var(--fast)',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--btn-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--btn-bg)'}
        >
          Get started
        </Link>
      </div>
    </header>
  )
}
