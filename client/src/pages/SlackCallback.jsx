import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../lib/tokenStore.js'
import { platforms as platformsApi } from '../lib/api.js'

export default function SlackCallback() {
  const navigate = useNavigate()
  const [error,  setError]  = useState(null)

  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const token  = params.get('t')
      const err    = params.get('error')

      // Clear hash immediately so token never sits in browser history
      window.history.replaceState(null, '', window.location.pathname)

      if (err || !token) {
        setError(err || 'access_denied')
        setTimeout(() => navigate('/connect', { replace: true }), 2000)
        return
      }

      try {
        await setToken('slack', token)
        await platformsApi.connect('slack')
        navigate('/connect', { replace: true })
      } catch (e) {
        console.error('SlackCallback error:', e)
        setError(e.message)
        setTimeout(() => navigate('/connect', { replace: true }), 2000)
      }
    }

    handle()
  }, [navigate])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: 'var(--font)', gap: 12 }}>
      {error ? (
        <div style={{ fontSize: 14, color: '#DC2626' }}>Connection failed — redirecting…</div>
      ) : (
        <>
          <div style={{ width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: '#E01E5A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <div style={{ fontSize: 13, color: 'var(--tx-faint)' }}>Connecting Slack…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}
    </div>
  )
}
