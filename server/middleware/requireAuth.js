import jwt from 'jsonwebtoken'
import { query } from '../db/pool.js'

/**
 * Verifies the JWT stored in the `baard_session` httpOnly cookie.
 * Attaches `req.user` to the request on success.
 * Returns 401 on failure.
 */
export default async function requireAuth(req, res, next) {
  const token = req.cookies?.baard_session

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch fresh user row so we always have current plan/status
    const { rows } = await query(
      'SELECT id, email, name, avatar_url, plan FROM users WHERE id = $1',
      [payload.userId]
    )

    if (!rows.length) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = rows[0]
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' })
  }
}
