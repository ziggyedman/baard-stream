import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import PrivacyBanner from '../components/PrivacyBanner.jsx'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, error, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx-mid)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%', padding: '10px 12px',
          fontFamily: 'var(--font)', fontSize: 14, color: 'var(--tx)',
          background: 'var(--bg-raised)',
          border: `1px solid ${error ? '#EF4444' : focused ? 'var(--accent)' : 'var(--line-mid)'}`,
          borderRadius: 'var(--r-md)', outline: 'none',
          transition: 'border-color var(--fast)',
        }}
      />
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUp } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/inbox'

  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState(null)
  const [fieldErr, setFieldErr] = useState({})

  // Check for Google OAuth error param
  useEffect(() => {
    if (location.search.includes('error=google')) {
      setError('Google sign-in failed. Please try again.')
    }
  }, [location.search])

  // Already logged in → redirect
  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [user, loading, navigate, from])

  if (loading) return null

  const validate = () => {
    const errs = {}
    if (mode === 'register' && !name.trim()) errs.name = 'Name is required'
    if (!email.includes('@')) errs.email = 'Enter a valid email'
    if (password.length < 8) errs.password = 'Minimum 8 characters'
    setFieldErr(errs)
    return !Object.keys(errs).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await signInWithEmail({ email, password })
      } else {
        await signUp({ email, password, name: name.trim() })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError(null)
    setFieldErr({})
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top bar */}
      <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/pricing" style={{ fontSize: 13, color: 'var(--tx-mid)' }}>Pricing</Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>⬡</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--tx)', marginBottom: 6 }}>
              {mode === 'login' ? 'Sign in to baard' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--tx-mid)' }}>
              {mode === 'login' ? 'Welcome back.' : 'One inbox for every platform.'}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            disabled={busy}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 16px', marginBottom: 20,
              background: 'var(--bg-raised)', border: '1px solid var(--line-mid)',
              borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font)', color: 'var(--tx)', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', transition: 'border-color var(--fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-mid)'}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <Field label="Full name" value={name} onChange={setName}
                placeholder="Ada Lovelace" autoComplete="name" error={fieldErr.name} />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail}
              placeholder="you@example.com" autoComplete="email" error={fieldErr.email} />
            <Field label="Password" type="password" value={password} onChange={setPassword}
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              error={fieldErr.password} />

            {/* Global error */}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%', padding: '11px 0',
                background: busy ? 'var(--bg-sunken)' : 'var(--btn-bg)',
                color: busy ? 'var(--tx-faint)' : 'var(--btn-fg)',
                fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14,
                border: 'none', borderRadius: 'var(--r-md)', cursor: busy ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all var(--fast)',
              }}
            >
              {busy && (
                <span style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--tx-mid)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              )}
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--tx-mid)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} style={{ color: 'var(--accent-fg)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, padding: 0 }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>

          {/* Privacy note */}
          <div style={{ marginTop: 24 }}>
            <PrivacyBanner compact />
          </div>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--tx-faint)', fontFamily: 'var(--mono)', lineHeight: 1.7 }}>
            By signing in you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent-fg)' }}>Privacy Policy</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--accent-fg)' }}>Terms</a>
          </p>
        </div>
      </div>
    </div>
  )
}
