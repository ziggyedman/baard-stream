import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cors from 'cors'
import passport from 'passport'
import { rateLimit } from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import { migrate } from './db/pool.js'
import requireAuth from './middleware/requireAuth.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import platformRoutes from './routes/platforms.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001
const PROD = process.env.NODE_ENV === 'production'
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist')

/* ── Security ────────────────────────────────────────────────────────────── */

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
      fontSrc:    ["'self'", 'fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://slack.com', process.env.RELAY_URL || ''].filter(Boolean),
    },
  },
}))

/* ── CORS (dev only — same origin in prod) ────────────────────────────────── */
if (!PROD) {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
}

/* ── Rate limiting ────────────────────────────────────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/* ── Body parsing ─────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(passport.initialize())

/* ── API Routes ───────────────────────────────────────────────────────────── */

// Auth endpoints — rate limited, no auth middleware
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth', authRoutes)

// Protected endpoints — require valid JWT cookie
app.use('/api/user',       requireAuth, userRoutes)
app.use('/api/platforms',  requireAuth, platformRoutes)

/* ── Health check ─────────────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now(), env: process.env.NODE_ENV })
})

/* ── Serve React app (production) ─────────────────────────────────────────── */
if (PROD) {
  app.use(express.static(CLIENT_DIST, {
    maxAge: '1y',
    etag: true,
    index: false,
  }))

  // SPA fallback — all non-API routes serve index.html
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

/* ── Global error handler ─────────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

/* ── Boot ─────────────────────────────────────────────────────────────────── */
async function start() {
  try {
    await migrate()
    app.listen(PORT, () => {
      console.log(`✓ baard server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
      if (!PROD) console.log(`  API: http://localhost:${PORT}/api`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
