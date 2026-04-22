import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Wraps a route that requires authentication.
 * Unauthenticated users are sent to /login with the intended path
 * saved in location state so they are redirected back after sign-in.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: 8,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50%       { transform: translateY(-6px); opacity: 0.4; }
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
