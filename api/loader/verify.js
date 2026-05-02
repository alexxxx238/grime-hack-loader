import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Called by the C++ loader on startup
// POST /api/loader/verify
// Body: { email, password, hwid }
// Returns: { status, username, expires_at, token }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { email, password, hwid } = req.body
  if (!email || !password || !hwid)
    return res.status(400).json({ message: 'email, password and hwid required' })

  try {
    // 1. Verify credentials
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const user = users[0]
    if (!user || !await bcrypt.compare(password, user.password_hash))
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    if (user.is_banned)
      return res.status(403).json({ status: 'error', message: 'Account banned' })

    // 2. Check active subscription
    const [subs] = await pool.query(`
      SELECT ul.*, l.expires_at, l.product, l.hwid, l.is_banned as key_banned
      FROM user_licenses ul
      JOIN licenses l ON l.id = ul.license_id
      WHERE ul.user_id = ? AND l.expires_at > NOW() AND (l.is_banned = 0 OR l.is_banned IS NULL)
      ORDER BY l.expires_at DESC LIMIT 1
    `, [user.id])

    if (!subs.length)
      return res.status(403).json({ status: 'error', message: 'No active subscription' })

    const sub = subs[0]

    // 3. HWID check
    const hwidHash = crypto.createHash('sha256').update(hwid).digest('hex')

    if (sub.hwid && sub.hwid !== hwidHash)
      return res.status(403).json({ status: 'error', message: 'HWID mismatch. Contact support to reset.' })

    // 4. Bind HWID on first run
    if (!sub.hwid) {
      await pool.query('UPDATE licenses SET hwid = ? WHERE id = ?', [hwidHash, sub.license_id])
      await pool.query('UPDATE user_licenses SET hwid = ? WHERE id = ?', [hwidHash, sub.id])
    }

    // 5. Issue session token
    const token = jwt.sign(
      { id: user.id, email: user.email, license_id: sub.license_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])

    return res.status(200).json({
      status: 'ok',
      username: user.username,
      subscription_until: sub.expires_at,
      product: sub.product || 'GRIME:ALTV',
      token
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}
