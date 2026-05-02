import pool from '../../db.js'
import { requireAdmin } from '../../_middleware.js'

export default async function handler(req, res) {
  const payload = requireAdmin(req, res)
  if (!payload) return

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, email, is_admin, is_active, is_banned, telegram_user_id, created_at, last_login FROM users ORDER BY created_at DESC'
      )
      return res.status(200).json(rows)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
