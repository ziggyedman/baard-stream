import express from 'express'
import { query } from '../db/pool.js'

const router = express.Router()
// All routes are already protected by requireAuth in index.js

const VALID_PLATFORMS = [
  'slack','discord','telegram','whatsapp','messenger',
  'instagram','linkedin','teams','x','imessage',
]

const FREE_PLAN_LIMIT = 3

/**
 * GET /api/platforms
 * Returns all connections for the current user
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT platform_id, connected_at
       FROM platform_connections
       WHERE user_id = $1
       ORDER BY connected_at ASC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('Get platforms error:', err.message)
    res.status(500).json({ error: 'Could not load platform connections.' })
  }
})

/**
 * POST /api/platforms/:id/connect
 * Marks a platform as connected for the current user.
 * In production this is called after the OAuth token exchange
 * completes on the relay side.
 */
router.post('/:id/connect', async (req, res) => {
  const { id } = req.params

  if (!VALID_PLATFORMS.includes(id)) {
    return res.status(400).json({ error: 'Unknown platform.' })
  }

  try {
    // Enforce free plan limit
    if (req.user.plan === 'free') {
      const { rows } = await query(
        'SELECT COUNT(*) FROM platform_connections WHERE user_id = $1',
        [req.user.id]
      )
      if (parseInt(rows[0].count) >= FREE_PLAN_LIMIT) {
        return res.status(403).json({
          error: `Free plan allows up to ${FREE_PLAN_LIMIT} platforms. Upgrade to Pro for all 10.`,
          code: 'PLAN_LIMIT',
        })
      }
    }

    const { rows } = await query(
      `INSERT INTO platform_connections (user_id, platform_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, platform_id) DO UPDATE SET connected_at = NOW()
       RETURNING *`,
      [req.user.id, id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Connect platform error:', err.message)
    res.status(500).json({ error: 'Could not connect platform.' })
  }
})

/**
 * DELETE /api/platforms/:id
 * Revokes a platform connection.
 * The relay worker is responsible for invalidating any cached tokens.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  if (!VALID_PLATFORMS.includes(id)) {
    return res.status(400).json({ error: 'Unknown platform.' })
  }

  try {
    const { rowCount } = await query(
      'DELETE FROM platform_connections WHERE user_id = $1 AND platform_id = $2',
      [req.user.id, id]
    )

    if (!rowCount) {
      return res.status(404).json({ error: 'Platform not connected.' })
    }

    // TODO: notify relay worker to drop cached token
    // await fetch(`${process.env.RELAY_URL}/revoke/${id}`, {
    //   method: 'POST',
    //   headers: { 'X-User-Id': req.user.id, 'X-Internal-Key': process.env.RELAY_INTERNAL_KEY }
    // })

    res.json({ ok: true })
  } catch (err) {
    console.error('Revoke platform error:', err.message)
    res.status(500).json({ error: 'Could not revoke platform.' })
  }
})

export default router
