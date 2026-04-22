import { useTheme } from '../context/ThemeContext.jsx'

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12.07 2.93l-1.06 1.06M4 11l-1.07 1.07M12.07 12.07l-1.06-1.06M4 4 2.93 2.93" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7 2C4.24 2 2 4.24 2 7s2.24 5 5 5c2.38 0 4.37-1.67 4.87-3.9-.43.14-.89.22-1.37.22C8.01 8.32 6 6.31 6 3.82c0-.65.14-1.27.38-1.82C6.25 2.03 6.13 2 7 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        width: 34,
        height: 34,
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--line)',
        background: 'var(--bg-raised)',
        color: 'var(--tx-mid)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--fast) var(--ease)',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-mid)'; e.currentTarget.style.color = 'var(--tx)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--tx-mid)' }}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
