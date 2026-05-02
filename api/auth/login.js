import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const user = rows[0]

    if (!user || !await bcrypt.compare(password, user.password_hash))
      return res.status(401).json({ message: 'Invalid email or password' })

    if (user.is_banned) return res.status(403).json({ message: 'Account banned' })

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: !!user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: !!user.is_admin,
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
