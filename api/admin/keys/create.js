import pool from '../../db.js'
import { requireAdmin } from '../../_middleware.js'
import crypto from 'crypto'

function generateKey() {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const payload = requireAdmin(req, res)
  if (!payload) return

  const { product = 'GRIME:ALTV', days = 30 } = req.body
  if (!days || days < 1) return res.status(400).json({ message: 'Invalid days' })

  try {
    const rawKey = generateKey()
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const expiresAt = new Date(Date.now() + days * 86400000)

    await pool.query(
      `INSERT INTO licenses (license_key_hash, product, expires_at, is_banned, created_at, telegram_user_id)
       VALUES (?, ?, ?, 0, NOW(), ?)`,
      [keyHash, product, expiresAt, payload.id]
    )

    return res.status(201).json({ key: rawKey, expires_at: expiresAt, product })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
