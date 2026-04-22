import { Link } from 'react-router-dom'

export default function Logo({ size = 'md', linkTo = '/' }) {
  const sizes = { sm: { font: 17, dot: 7 }, md: { font: 21, dot: 8 }, lg: { font: 28, dot: 10 } }
  const s = sizes[size] ?? sizes.md

  return (
    <Link to={linkTo} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
      <span style={{
        fontFamily: 'var(--font)',
        fontWeight: 700,
        fontSize: s.font,
        letterSpacing: '-0.04em',
        color: 'var(--tx)',
        lineHeight: 1,
      }}>
        baard
      </span>
      <span style={{
        width: s.dot,
        height: s.dot,
        borderRadius: '50%',
        background: 'var(--accent)',
        display: 'inline-block',
        marginLeft: 1,
        flexShrink: 0,
        marginBottom: 2,
      }} />
    </Link>
  )
}
