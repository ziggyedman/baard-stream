import express from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { query } from '../db/pool.js'

const router = express.Router()
// All routes in this file are already protected by requireAuth in index.js

/**
 * GET /api/user/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    )
    res.json(rows[0] || {})
  } catch (err) {
    console.error('Get settings error:', err.message)
    res.status(500).json({ error: 'Could not load settings.' })
  }
})

/**
 * PUT /api/user/settings
 * Body: any subset of settings columns
 */
router.put('/settings', async (req, res) => {
  const allowed = [
    'history_from', 'theme', 'density', 'font_size', 'sidebar_width',
    'message_grouping', 'timestamps_format', 'notif_browser', 'notif_sound',
    'notif_badge', 'notif_priority', 'quiet_hours_enabled', 'quiet_hours_start',
    'quiet_hours_end', 'notif_per_platform',
  ]

  const updates = {}
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key]
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No valid settings fields provided.' })
  }

  // Build SET clause: "key1 = $2, key2 = $3, ..."
  const setClauses = Object.keys(updates)
    .map((k, i) => `${k} = $${i + 2}`)
    .join(', ')
  const values = [req.user.id, ...Object.values(updates)]

  try {
    const { rows } = await query(
      `UPDATE user_settings SET ${setClauses}, updated_at = NOW()
       WHERE user_id = $1 RETURNING *`,
      values
    )
    res.json(rows[0])
  } catch (err) {
    console.error('Update settings error:', err.message)
    res.status(500).json({ error: 'Could not save settings.' })
  }
})

/**
 * GET /api/user/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, email, name, avatar_url, plan, google_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Could not load profile.' })
  }
})

/**
 * PUT /api/user/profile
 * Body: { name?, email? }
 */
router.put('/profile', [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  const { name, email } = req.body
  const updates = {}
  if (name)  updates.name  = name
  if (email) updates.email = email

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No fields to update.' })
  }

  // Check email uniqueness if changing
  if (email) {
    const { rows } = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    )
    if (rows.length) {
      return res.status(409).json({ error: 'Email already in use.' })
    }
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = [req.user.id, ...Object.values(updates)]

  try {
    const { rows } = await query(
      `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING id, email, name, avatar_url, plan`,
      values
    )
    res.json(rows[0])
  } catch (err) {
    console.error('Update profile error:', err.message)
    res.status(500).json({ error: 'Could not update profile.' })
  }
})

/**
 * PUT /api/user/password
 * Body: { currentPassword, newPassword }
 */
router.put('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }

  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const user = rows[0]

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Your account uses Google sign-in. No password to change.' })
    }

    const valid = await bcrypt.compare(req.body.currentPassword, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }

    const hash = await bcrypt.hash(req.body.newPassword, 12)
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('Password change error:', err.message)
    res.status(500).json({ error: 'Could not update password.' })
  }
})

/**
 * DELETE /api/user/account
 * Permanently deletes the user and all their data (CASCADE handles related rows)
 */
router.delete('/account', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.user.id])
    res.clearCookie('baard_session', { path: '/' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete account error:', err.message)
    res.status(500).json({ error: 'Could not delete account.' })
  }
})

export default router
