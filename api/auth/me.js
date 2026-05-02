import pool from '../db.js'
import { verifyToken } from '../_middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  const payload = verifyToken(req)
  if (!payload) return res.status(401).json({ message: 'Unauthorized' })

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, is_admin, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [payload.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
