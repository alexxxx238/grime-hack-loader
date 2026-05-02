import pool from '../../db.js'
import { requireAdmin } from '../../_middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const payload = requireAdmin(req, res)
  if (!payload) return

  const { user_id, banned } = req.body
  if (!user_id) return res.status(400).json({ message: 'user_id required' })

  try {
    await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [banned ? 1 : 0, user_id])
    return res.status(200).json({ message: banned ? 'User banned' : 'User unbanned' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
