import pool from '../db.js'
import { requireAuth } from '../_middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const payload = requireAuth(req, res)
  if (!payload) return

  try {
    const [rows] = await pool.query(`
      SELECT l.expires_at, l.product, ul.activated_at
      FROM user_licenses ul
      JOIN licenses l ON l.id = ul.license_id
      WHERE ul.user_id = ? AND l.expires_at > NOW()
      ORDER BY l.expires_at DESC LIMIT 1
    `, [payload.id])

    if (!rows.length) return res.status(200).json(null)
    return res.status(200).json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
