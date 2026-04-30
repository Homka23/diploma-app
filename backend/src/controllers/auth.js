import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db/index.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 12;
const TOKEN_TTL = '7d';

export async function register(req, res) {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [username, email, password_hash, display_name ?? null]
    );

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    console.error('register:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];

    // Use the same generic message for both "not found" and "wrong password"
    // to avoid leaking whether an email is registered.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error('login:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function forgotPassword(req, res) {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'email and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    // Return the same response whether the email exists or not to avoid leaking user emails
    if (!user || !user.password_hash) {
      return res.json({ message: 'If this email is registered, the password has been updated' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    res.json({ message: 'If this email is registered, the password has been updated' });
  } catch (err) {
    console.error('forgotPassword:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account uses Google sign-in. Password change is not available.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({ error: 'New password must differ from the current one' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function googleAuth(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: google_id, email, name, picture } = ticket.getPayload();

    // Find existing user by google_id or email
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [google_id, email]
    );

    let user = rows[0];

    if (user) {
      // Link google_id if this email was registered without Google before
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1 WHERE id = $2',
          [google_id, user.id]
        );
        user.google_id = google_id;
      }
    } else {
      // New user — register automatically
      const { rows: created } = await pool.query(
        `INSERT INTO users (email, google_id, display_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [email, google_id, name ?? null]
      );
      user = created[0];
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    console.error('googleAuth:', err.message);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

export async function getMe(req, res) {
  const userId = req.user.userId;
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, display_name, streak_days, last_active_date, created_at
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateMe(req, res) {
  const userId = req.user.userId;
  const { display_name } = req.body;
  if (!display_name?.trim()) return res.status(400).json({ error: 'display_name is required' });
  try {
    const { rows } = await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2
       RETURNING id, username, email, display_name`,
      [display_name.trim(), userId],
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('updateMe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function ping(req, res) {
  const userId = req.user.userId;
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET streak_days = CASE
         WHEN last_active_date = CURRENT_DATE            THEN streak_days
         WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
         ELSE 1
       END,
       last_active_date = CURRENT_DATE
       WHERE id = $1
       RETURNING streak_days`,
      [userId],
    );
    res.json({ streakDays: rows[0].streak_days });
  } catch (err) {
    console.error('ping error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
