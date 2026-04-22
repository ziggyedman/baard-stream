import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider  } from './context/AuthContext.jsx'
import ProtectedRoute   from './components/ProtectedRoute.jsx'

export { useTheme } from './context/ThemeContext.jsx'

const Landing  = lazy(() => import('./pages/Landing.jsx'))
const Login    = lazy(() => import('./pages/Login.jsx'))
const Pricing  = lazy(() => import('./pages/Pricing.jsx'))
const Connect  = lazy(() => import('./pages/Connect.jsx'))
const Inbox    = lazy(() => import('./pages/Inbox.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))

function Spinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 6 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-6px);opacity:.4}}`}</style>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"        element={<Landing />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />

            <Route path="/connect"  element={<ProtectedRoute><Connect /></ProtectedRoute>} />
            <Route path="/inbox"    element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  )
}
