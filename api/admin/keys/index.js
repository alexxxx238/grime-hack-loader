import pool from '../../db.js'
import { requireAdmin } from '../../_middleware.js'

export default async function handler(req, res) {
  const payload = requireAdmin(req, res)
  if (!payload) return

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        'SELECT id, license_key_hash, product, hwid, expires_at, is_banned, created_at FROM licenses ORDER BY created_at DESC LIMIT 200'
      )
      return res.status(200).json(rows)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    const id = req.query.id
    if (!id) return res.status(400).json({ message: 'id required' })
    try {
      await pool.query('DELETE FROM user_licenses WHERE license_id = ?', [id])
      await pool.query('DELETE FROM licenses WHERE id = ?', [id])
      return res.status(200).json({ message: 'Key deleted' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
