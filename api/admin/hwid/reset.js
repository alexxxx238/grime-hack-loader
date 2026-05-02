import pool from '../../db.js'
import { requireAdmin } from '../../_middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const payload = requireAdmin(req, res)
  if (!payload) return

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ message: 'user_id required' })

  try {
    // Clear HWID from all licenses linked to this user
    await pool.query(`
      UPDATE licenses l
      JOIN user_licenses ul ON ul.license_id = l.id
      SET l.hwid = NULL, ul.hwid = NULL
      WHERE ul.user_id = ?
    `, [user_id])

    return res.status(200).json({ message: 'HWID reset successfully' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
