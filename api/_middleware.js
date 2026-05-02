import jwt from 'jsonwebtoken'

export function verifyToken(req) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export function requireAuth(req, res) {
  const payload = verifyToken(req)
  if (!payload) { res.status(401).json({ message: 'Unauthorized' }); return null }
  return payload
}

export function requireAdmin(req, res) {
  const payload = requireAuth(req, res)
  if (!payload) return null
  if (!payload.is_admin) { res.status(403).json({ message: 'Forbidden' }); return null }
  return payload
}
