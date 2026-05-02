import pool from '../db.js'
import { requireAuth } from '../_middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const payload = requireAuth(req, res)
  if (!payload) return

  try {
    const [rows] = await pool.query(`
      SELECT ul.hwid FROM user_licenses ul
      JOIN licenses l ON l.id = ul.license_id
      WHERE ul.user_id = ? AND ul.hwid IS NOT NULL
      LIMIT 1
    `, [payload.id])

    return res.status(200).json({ hwid: rows[0]?.hwid || null })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
