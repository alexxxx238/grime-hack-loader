import pool from '../db.js'
import { requireAuth } from '../_middleware.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const payload = requireAuth(req, res)
  if (!payload) return

  const { key } = req.body
  if (!key) return res.status(400).json({ message: 'Key required' })

  const keyHash = crypto.createHash('sha256').update(key.trim()).digest('hex')

  try {
    const [keys] = await pool.query(
      'SELECT * FROM licenses WHERE license_key_hash = ? LIMIT 1',
      [keyHash]
    )
    const lic = keys[0]

    if (!lic) return res.status(404).json({ message: 'Invalid key' })
    if (lic.is_banned) return res.status(403).json({ message: 'This key has been banned' })
    if (new Date(lic.expires_at) < new Date()) return res.status(410).json({ message: 'Key has expired' })

    // Check if already used by another user
    const [ul] = await pool.query(
      'SELECT * FROM user_licenses WHERE license_id = ? LIMIT 1',
      [lic.id]
    )
    if (ul.length && ul[0].user_id !== payload.id)
      return res.status(409).json({ message: 'Key is already activated by another account' })
    if (ul.length && ul[0].user_id === payload.id)
      return res.status(409).json({ message: 'You already activated this key' })

    await pool.query(
      'INSERT INTO user_licenses (user_id, license_id, activated_at) VALUES (?, ?, NOW())',
      [payload.id, lic.id]
    )

    return res.status(200).json({
      message: 'Key activated successfully!',
      expires_at: lic.expires_at,
      product: lic.product || 'GRIME:ALTV'
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
