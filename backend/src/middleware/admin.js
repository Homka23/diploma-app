import jwt  from 'jsonwebtoken';
import pool from '../db/index.js';

export async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [payload.userId]);
    if (!rows.length || rows[0].role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
