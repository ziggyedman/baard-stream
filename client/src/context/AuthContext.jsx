/**
 * AuthContext — wraps the Express + PostgreSQL backend via /api
 *
 * Provides:
 *  user                  current user object or null
 *  loading               true while session is resolving on first load
 *  signInWithGoogle()    navigates to /api/auth/google (full-page redirect)
 *  signInWithEmail()     POST /api/auth/login
 *  signUp()              POST /api/auth/register
 *  signOut()             POST /api/auth/logout
 *  settings              current user settings object
 *  saveSettings(patch)   PUT /api/user/settings — partial update
 *  platformConnections   { [id]: { connected, connectedAt } }
 *  connectPlatform(id)
 *  revokePlatform(id)
 */

import {
  createContext, useCallback, useContext,
  useEffect, useReducer, useState,
} from 'react'
import { auth, user as userApi, platforms as platformsApi } from '../lib/api.js'
import { deleteToken } from '../lib/tokenStore.js'

/* ── Default shapes ───────────────────────────────────────────────────── */

const ALL_PLATFORMS = [
  'slack','discord','telegram','whatsapp','messenger',
  'instagram','linkedin','teams','x','imessage',
]

const emptyConnections = () =>
  Object.fromEntries(ALL_PLATFORMS.map(id => [id, { connected: false, connectedAt: null }]))

/* ── Context ──────────────────────────────────────────────────────────── */

const AuthCtx = createContext({
  user: null, loading: true,
  settings: null,
  signInWithGoogle: () => {},
  signInWithEmail:  async () => {},
  signUp:           async () => {},
  signOut:          async () => {},
  saveSettings:     async () => {},
  platformConnections: {},
  connectPlatform:  async () => {},
  revokePlatform:   async () => {},
})

export const useAuth = () => useContext(AuthCtx)

/* ── Provider ─────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [platformConnections, setPlatformConnections] = useState(emptyConnections)

  /* ── Load connections from API ──────────────────────────────────────── */
  const loadConnections = useCallback(async () => {
    try {
      const rows = await platformsApi.list()
      const map  = emptyConnections()
      for (const row of rows) {
        map[row.platform_id] = { connected: true, connectedAt: row.connected_at }
      }
      setPlatformConnections(map)
    } catch { /* silently ignore — user can retry */ }
  }, [])

  /* ── Bootstrap: check existing session on first load ───────────────── */
  useEffect(() => {
    ;(async () => {
      try {
        const { user: me, settings: s } = await auth.me()
        setUser(me)
        setSettings(s)
        await loadConnections()
      } catch {
        // 401 = not logged in — that's fine
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [loadConnections])

  /* ── signInWithGoogle ───────────────────────────────────────────────── */
  const signInWithGoogle = useCallback(() => {
    // Full-page redirect to Express → Google → back to /inbox
    window.location.href = auth.googleUrl()
  }, [])

  /* ── signInWithEmail ────────────────────────────────────────────────── */
  const signInWithEmail = useCallback(async ({ email, password }) => {
    const { user: me } = await auth.login({ email, password })
    setUser(me)
    const s = await userApi.getSettings()
    setSettings(s)
    await loadConnections()
    return me
  }, [loadConnections])

  /* ── signUp ─────────────────────────────────────────────────────────── */
  const signUp = useCallback(async ({ email, password, name }) => {
    const { user: me } = await auth.register({ email, password, name })
    setUser(me)
    const s = await userApi.getSettings()
    setSettings(s)
    setPlatformConnections(emptyConnections())
    return me
  }, [])

  /* ── signOut ─────────────────────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    try { await auth.logout() } catch { /* ignore */ }
    setUser(null)
    setSettings(null)
    setPlatformConnections(emptyConnections())
  }, [])

  /* ── saveSettings ────────────────────────────────────────────────────── */
  const saveSettings = useCallback(async (patch) => {
    const updated = await userApi.updateSettings(patch)
    setSettings(updated)
    return updated
  }, [])

  /* ── connectPlatform ─────────────────────────────────────────────────── */
  const connectPlatform = useCallback(async (id) => {
    await platformsApi.connect(id)
    setPlatformConnections(prev => ({
      ...prev,
      [id]: { connected: true, connectedAt: new Date().toISOString() },
    }))
  }, [])

  /* ── revokePlatform ──────────────────────────────────────────────────── */
  const revokePlatform = useCallback(async (id) => {
    // Optimistic: mark revoking
    setPlatformConnections(prev => ({
      ...prev,
      [id]: { ...prev[id], revoking: true },
    }))
    try {
      await platformsApi.revoke(id)
      await deleteToken(id).catch(() => {})
      setPlatformConnections(prev => ({
        ...prev,
        [id]: { connected: false, connectedAt: null, revoking: false },
      }))
    } catch (err) {
      // Revert on failure
      setPlatformConnections(prev => ({
        ...prev,
        [id]: { ...prev[id], revoking: false },
      }))
      throw err
    }
  }, [])

  return (
    <AuthCtx.Provider value={{
      user, loading, settings,
      signInWithGoogle, signInWithEmail, signUp, signOut,
      saveSettings,
      platformConnections, connectPlatform, revokePlatform,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}
