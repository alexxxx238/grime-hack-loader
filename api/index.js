import pool from './db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// ── Auth helpers ──────────────────────────────────────────────────────────────
function verifyToken(req) {
  try {
    const h = req.headers.authorization || ''
    const t = h.startsWith('Bearer ') ? h.slice(7) : null
    return t ? jwt.verify(t, process.env.JWT_SECRET) : null
  } catch { return null }
}
function auth(req, res)  { const p = verifyToken(req); if (!p) res.status(401).json({ message: 'Unauthorized' }); return p }
function admin(req, res) { const p = auth(req, res);  if (p && !p.is_admin) { res.status(403).json({ message: 'Forbidden' }); return null } return p }

// ── Key generator ─────────────────────────────────────────────────────────────
function genKey() {
  const s = () => crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${s()}${s()}-${s()}${s()}-${s()}${s()}-${s()}${s()}`
}

// ── Main router ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const url = req.url.replace(/^\/api/, '').split('?')[0]

  try {
    // ── POST /auth/login ────────────────────────────────────────────────────
    if (url === '/auth/login' && req.method === 'POST') {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
      const user = rows[0]
      if (!user || !await bcrypt.compare(password, user.password_hash))
        return res.status(401).json({ message: 'Invalid email or password' })
      if (user.is_banned) return res.status(403).json({ message: 'Account banned' })
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])
      const token = jwt.sign({ id: user.id, email: user.email, is_admin: !!user.is_admin }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin } })
    }

    // ── POST /auth/register ─────────────────────────────────────────────────
    if (url === '/auth/register' && req.method === 'POST') {
      const { username, email, password } = req.body
      if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' })
      if (password.length < 6) return res.status(400).json({ message: 'Password min 6 chars' })
      const [ex] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
      if (ex.length) return res.status(409).json({ message: 'Email already registered' })
      const hash = await bcrypt.hash(password, 10)
      const [r] = await pool.query('INSERT INTO users (username, email, password_hash, is_active, created_at) VALUES (?, ?, ?, 1, NOW())', [username, email, hash])
      const token = jwt.sign({ id: r.insertId, email, is_admin: false }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return res.status(201).json({ token, user: { id: r.insertId, username, email, is_admin: false } })
    }

    // ── GET /auth/me ────────────────────────────────────────────────────────
    if (url === '/auth/me' && req.method === 'GET') {
      const p = auth(req, res); if (!p) return
      const [rows] = await pool.query('SELECT id, username, email, is_admin, is_active, created_at FROM users WHERE id = ? LIMIT 1', [p.id])
      if (!rows[0]) return res.status(404).json({ message: 'User not found' })
      const u = rows[0]
      return res.status(200).json({ user: { ...u, is_admin: !!u.is_admin } })
    }

    // ── POST /keys/activate ─────────────────────────────────────────────────
    if (url === '/keys/activate' && req.method === 'POST') {
      const p = auth(req, res); if (!p) return
      const { key } = req.body
      if (!key) return res.status(400).json({ message: 'Key required' })
      const kh = crypto.createHash('sha256').update(key.trim()).digest('hex')
      const [keys] = await pool.query('SELECT * FROM licenses WHERE license_key_hash = ? LIMIT 1', [kh])
      const lic = keys[0]
      if (!lic) return res.status(404).json({ message: 'Invalid key' })
      if (lic.is_banned) return res.status(403).json({ message: 'Key is banned' })
      if (new Date(lic.expires_at) < new Date()) return res.status(410).json({ message: 'Key expired' })
      const [ul] = await pool.query('SELECT * FROM user_licenses WHERE license_id = ? LIMIT 1', [lic.id])
      if (ul.length && ul[0].user_id !== p.id) return res.status(409).json({ message: 'Key used by another account' })
      if (ul.length && ul[0].user_id === p.id) return res.status(409).json({ message: 'Already activated' })
      await pool.query('INSERT INTO user_licenses (user_id, license_id, activated_at) VALUES (?, ?, NOW())', [p.id, lic.id])
      return res.status(200).json({ message: 'Key activated!', expires_at: lic.expires_at, product: lic.product || 'GRIME:ALTV' })
    }

    // ── POST /loader/verify ─────────────────────────────────────────────────
    if (url === '/loader/verify' && req.method === 'POST') {
      const { email, password, hwid } = req.body
      if (!email || !password || !hwid) return res.status(400).json({ message: 'email, password and hwid required' })
      const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
      const user = users[0]
      if (!user || !await bcrypt.compare(password, user.password_hash))
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
      if (user.is_banned) return res.status(403).json({ status: 'error', message: 'Account banned' })
      const [subs] = await pool.query(`
        SELECT ul.*, l.expires_at, l.product, l.hwid as key_hwid, l.is_banned as key_banned
        FROM user_licenses ul JOIN licenses l ON l.id = ul.license_id
        WHERE ul.user_id = ? AND l.expires_at > NOW() AND (l.is_banned = 0 OR l.is_banned IS NULL)
        ORDER BY l.expires_at DESC LIMIT 1`, [user.id])
      if (!subs.length) return res.status(403).json({ status: 'error', message: 'No active subscription' })
      const sub = subs[0]
      const hwidHash = crypto.createHash('sha256').update(hwid).digest('hex')
      if (sub.key_hwid && sub.key_hwid !== hwidHash)
        return res.status(403).json({ status: 'error', message: 'HWID mismatch. Contact support.' })
      if (!sub.key_hwid) {
        await pool.query('UPDATE licenses SET hwid = ? WHERE id = ?', [hwidHash, sub.license_id])
        await pool.query('UPDATE user_licenses SET hwid = ? WHERE id = ?', [hwidHash, sub.id])
      }
      const token = jwt.sign({ id: user.id, email: user.email, license_id: sub.license_id }, process.env.JWT_SECRET, { expiresIn: '12h' })
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])
      return res.status(200).json({ status: 'ok', username: user.username, subscription_until: sub.expires_at, product: sub.product || 'GRIME:ALTV', token })
    }

    // ── GET /dashboard/subscription ─────────────────────────────────────────
    if (url === '/dashboard/subscription' && req.method === 'GET') {
      const p = auth(req, res); if (!p) return
      const [rows] = await pool.query(`
        SELECT l.expires_at, l.product, ul.activated_at FROM user_licenses ul
        JOIN licenses l ON l.id = ul.license_id
        WHERE ul.user_id = ? AND l.expires_at > NOW() ORDER BY l.expires_at DESC LIMIT 1`, [p.id])
      return res.status(200).json(rows[0] || null)
    }

    // ── GET /dashboard/hwid ─────────────────────────────────────────────────
    if (url === '/dashboard/hwid' && req.method === 'GET') {
      const p = auth(req, res); if (!p) return
      const [rows] = await pool.query(`
        SELECT ul.hwid FROM user_licenses ul JOIN licenses l ON l.id = ul.license_id
        WHERE ul.user_id = ? AND ul.hwid IS NOT NULL LIMIT 1`, [p.id])
      return res.status(200).json({ hwid: rows[0]?.hwid || null })
    }

    // ── GET /admin/users ────────────────────────────────────────────────────
    if (url === '/admin/users' && req.method === 'GET') {
      const p = admin(req, res); if (!p) return
      const [rows] = await pool.query('SELECT id, username, email, is_admin, is_active, is_banned, telegram_user_id, created_at, last_login FROM users ORDER BY created_at DESC')
      return res.status(200).json(rows)
    }

    // ── POST /admin/users/ban ───────────────────────────────────────────────
    if (url === '/admin/users/ban' && req.method === 'POST') {
      const p = admin(req, res); if (!p) return
      const { user_id, banned } = req.body
      if (!user_id) return res.status(400).json({ message: 'user_id required' })
      await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [banned ? 1 : 0, user_id])
      return res.status(200).json({ message: banned ? 'User banned' : 'User unbanned' })
    }

    // ── GET /admin/keys ─────────────────────────────────────────────────────
    if (url === '/admin/keys' && req.method === 'GET') {
      const p = admin(req, res); if (!p) return
      const [rows] = await pool.query(`
        SELECT l.id, l.license_key_hash, l.encrypted_key, l.product, l.hwid, l.expires_at, l.is_banned, l.created_at,
               ul.user_id, u.username as bound_username
        FROM licenses l
        LEFT JOIN user_licenses ul ON ul.license_id = l.id
        LEFT JOIN users u ON u.id = ul.user_id
        WHERE l.product IN ('GRIME:ALTV','GRIME:RAGEMP')
        ORDER BY l.created_at DESC LIMIT 200
      `)
      return res.status(200).json(rows)
    }

    // ── POST /admin/keys/create ─────────────────────────────────────────────
    if (url === '/admin/keys/create' && req.method === 'POST') {
      const p = admin(req, res); if (!p) return
      const { product = 'GRIME:ALTV', days = 30 } = req.body
      const rawKey = genKey()
      const kh = crypto.createHash('sha256').update(rawKey).digest('hex')
      const expiresAt = new Date(Date.now() + days * 86400000)
      await pool.query('INSERT INTO licenses (license_key_hash, encrypted_key, product, expires_at, is_banned, created_at) VALUES (?, ?, ?, ?, 0, NOW())', [kh, rawKey, product, expiresAt])
      return res.status(201).json({ key: rawKey, expires_at: expiresAt, product })
    }

    // ── DELETE /admin/keys/:id ──────────────────────────────────────────────
    if (url.startsWith('/admin/keys/') && req.method === 'DELETE') {
      const p = admin(req, res); if (!p) return
      const id = url.split('/').pop()
      await pool.query('DELETE FROM user_licenses WHERE license_id = ?', [id])
      await pool.query('DELETE FROM licenses WHERE id = ?', [id])
      return res.status(200).json({ message: 'Key deleted' })
    }

    // ── POST /admin/hwid/reset ──────────────────────────────────────────────
    if (url === '/admin/hwid/reset' && req.method === 'POST') {
      const p = admin(req, res); if (!p) return
      const { user_id } = req.body
      if (!user_id) return res.status(400).json({ message: 'user_id required' })
      await pool.query(`
        UPDATE licenses l JOIN user_licenses ul ON ul.license_id = l.id
        SET l.hwid = NULL, ul.hwid = NULL WHERE ul.user_id = ?`, [user_id])
      return res.status(200).json({ message: 'HWID reset' })
    }

    return res.status(404).json({ message: 'Not found' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
