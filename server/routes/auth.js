import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { body, validationResult } from 'express-validator'
import { query, transaction } from '../db/pool.js'

const router = express.Router()

/* ── JWT helpers ─────────────────────────────────────────────────────────── */

const JWT_EXPIRY     = '7d'
const COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:    7 * 24 * 60 * 60 * 1000,   // 7 days in ms
  path:      '/',
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function setSessionCookie(res, userId) {
  res.cookie('baard_session', signToken(userId), COOKIE_OPTIONS)
}

/* ── DB helpers ──────────────────────────────────────────────────────────── */

/** Creates default settings row for a new user */
async function createDefaultSettings(client, userId) {
  await client.query(
    `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [userId]
  )
}

/** Finds or creates a user from a Google profile, returns the user row */
async function upsertGoogleUser({ googleId, email, name, avatarUrl }) {
  return transaction(async (client) => {
    // Try to find by google_id first
    let { rows } = await client.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    )
    if (rows.length) return rows[0]

    // Try to find by email (user may have registered with email first)
    ;({ rows } = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    ))
    if (rows.length) {
      // Link Google account to existing email account
      const { rows: updated } = await client.query(
        `UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2),
         name = COALESCE(name, $3), updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [googleId, avatarUrl, name, rows[0].id]
      )
      return updated[0]
    }

    // Create new user
    ;({ rows } = await client.query(
      `INSERT INTO users (email, google_id, name, avatar_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [email, googleId, name, avatarUrl]
    ))
    await createDefaultSettings(client, rows[0].id)
    return rows[0]
  })
}

/* ── Passport Google strategy ────────────────────────────────────────────── */
// Only registered when GOOGLE_CLIENT_ID is set.
// Email/password auth works fully without it.

const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

if (GOOGLE_ENABLED) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.APP_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await upsertGoogleUser({
          googleId:  profile.id,
          email:     profile.emails[0].value,
          name:      profile.displayName,
          avatarUrl: profile.photos?.[0]?.value ?? null,
        })
        done(null, user)
      } catch (err) {
        done(err)
      }
    }
  ))
  console.log('\u2713 Google OAuth enabled')
} else {
  console.log('\u2139 Google OAuth disabled (GOOGLE_CLIENT_ID not set) \u2014 email/password auth still works')
}

// Passport needs serialize/deserialize even though we use JWT, not sessions
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => done(null, { id }))

/* ── Routes ──────────────────────────────────────────────────────────────── */

/**
 * GET /api/auth/me
 * Returns the current user (checked via JWT middleware separately in index.js)
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
    const { rows: [settings] } = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    )
    res.json({ user: req.user, settings: settings || null })
  } catch (err) {
    console.error('Me error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * POST /api/auth/register
 * Body: { email, password, name }
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { email, password, name } = req.body

  try {
    // Check duplicate
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3) RETURNING *`,
        [email, passwordHash, name]
      )
      await createDefaultSettings(client, rows[0].id)
      return rows[0]
    })

    setSessionCookie(res, user.id)
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid email or password.' })
  }

  const { email, password } = req.body

  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    setSessionCookie(res, user.id)
    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, plan: user.plan },
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('baard_session', { path: '/' })
  res.json({ ok: true })
})

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  if (!GOOGLE_ENABLED) {
    return res.redirect('/login?error=google_not_configured')
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next)
})

/**
 * GET /api/auth/google/callback
 * Google redirects here after user consents
 */
router.get('/google/callback', (req, res, next) => {
  if (!GOOGLE_ENABLED) return res.redirect('/login?error=google_not_configured')
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' })(req, res, () => {
    setSessionCookie(res, req.user.id)
    res.redirect('/inbox')
  })
})

export default router
