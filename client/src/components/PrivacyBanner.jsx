export default function PrivacyBanner({ compact = false }) {
  return (
    <div style={{
      background: 'var(--accent-bg)',
      border: '1px solid var(--accent)',
      borderRadius: compact ? 'var(--r-md)' : 'var(--r-lg)',
      padding: compact ? '12px 16px' : '20px 24px',
      display: 'flex',
      gap: compact ? 12 : 16,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: compact ? 28 : 36,
        height: compact ? 28 : 36,
        borderRadius: 'var(--r-md)',
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 13 : 16,
        flexShrink: 0,
        color: '#111',
      }}>🔒</div>
      <div>
        <div style={{
          fontSize: compact ? 12 : 13,
          fontWeight: 700,
          color: 'var(--accent-fg)',
          marginBottom: 3,
        }}>
          baard never stores your messages
        </div>
        <div style={{
          fontSize: compact ? 11 : 12,
          color: 'var(--tx-mid)',
          lineHeight: 1.6,
        }}>
          Every message is fetched live from the source platform and relayed
          directly to your browser.
          {!compact && ' Nothing is written to any database. baard acts as a stateless bridge — when you close the tab, the messages are gone from our end.'}
        </div>
        {!compact && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              '✓ No message database',
              '✓ Tokens stored in your browser only',
              '✓ Relay is stateless',
              '✓ Revoke access any time',
            ].map(t => (
              <span key={t} style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: 'var(--accent-fg)',
                background: 'var(--accent)',
                borderRadius: 99,
                padding: '2px 8px',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
