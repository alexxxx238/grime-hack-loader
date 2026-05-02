import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { username, email, password } = req.body
  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields required' })
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' })

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
    if (existing.length) return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, is_active, created_at) VALUES (?, ?, ?, 1, NOW())',
      [username, email, hash]
    )
    const userId = result.insertId

    const token = jwt.sign(
      { id: userId, email, is_admin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: { id: userId, username, email, is_admin: false }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
