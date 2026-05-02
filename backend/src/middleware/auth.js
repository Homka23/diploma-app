import jwt  from 'jsonwebtoken';
import pool from '../db/index.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [payload.userId]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    if (rows[0].is_blocked) return res.status(403).json({ error: 'Account is blocked' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
