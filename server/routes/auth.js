const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: 'authenticated' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, ...metadata } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO auth_users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, $2, NOW(), $3)
       RETURNING id, email, raw_user_meta_data, created_at`,
      [email, hashedPassword, JSON.stringify(metadata)]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.encrypted_password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Update last sign in
    await pool.query('UPDATE auth_users SET last_sign_in_at = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, raw_user_meta_data FROM auth_users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({ user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data } });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh — re-issue JWT from existing valid token
router.post('/refresh', authMiddleware, (req, res) => {
  const token = generateToken(req.user);
  res.json({ token, user: { id: req.user.id, email: req.user.email } });
});

module.exports = router;
