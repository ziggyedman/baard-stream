/* Platform brand colours — used across all pages */
export const PLATFORMS = {
  slack:     { name: 'Slack',         color: '#E01E5A', abbr: 'SL' },
  discord:   { name: 'Discord',       color: '#5865F2', abbr: 'DC' },
  telegram:  { name: 'Telegram',      color: '#229ED9', abbr: 'TG' },
  whatsapp:  { name: 'WhatsApp',      color: '#25D366', abbr: 'WA' },
  messenger: { name: 'Messenger',     color: '#0084FF', abbr: 'MS' },
  instagram: { name: 'Instagram',     color: '#E1306C', abbr: 'IG' },
  linkedin:  { name: 'LinkedIn',      color: '#0A66C2', abbr: 'LI' },
  teams:     { name: 'MS Teams',      color: '#7B83EB', abbr: 'MT' },
  x:         { name: 'X',             color: '#888888', abbr: 'X'  },
  imessage:  { name: 'iMessage',      color: '#34C759', abbr: 'iM' },
}

/*
 * PlatformBadge
 * size: 'xs' | 'sm' | 'md'
 * showName: boolean
 */
export default function PlatformBadge({ id, size = 'sm', showName = false }) {
  const pl = PLATFORMS[id]
  if (!pl) return null

  const dim = { xs: 14, sm: 18, md: 22 }[size] ?? 18
  const fs  = { xs: 7,  sm: 8,  md: 9  }[size] ?? 8

  return (
    <span
      title={pl.name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: dim,
        padding: showName ? `0 6px 0 5px` : `0 ${(dim - fs * pl.abbr.length * 0.62) / 2}px`,
        borderRadius: showName ? 4 : dim / 3,
        background: pl.color + '18',
        border: `1px solid ${pl.color}40`,
        flexShrink: 0,
      }}
    >
      <span style={{
        fontFamily: 'var(--mono)',
        fontWeight: 500,
        fontSize: fs,
        color: pl.color,
        lineHeight: 1,
        letterSpacing: '0.01em',
      }}>
        {pl.abbr}
      </span>
      {showName && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: fs, fontWeight: 500, color: pl.color }}>
          {pl.name}
        </span>
      )}
    </span>
  )
}
