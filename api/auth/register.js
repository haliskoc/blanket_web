import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../_db.js';
import { generateToken } from '../_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, username, displayName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (id, email, password_hash, username, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, email, hashedPassword, username]
    );

    await query(
      'INSERT INTO profiles (user_id, username, display_name, is_public) VALUES ($1, $2, $3, true)',
      [userId, username, displayName || username]
    );

    await query(
      'INSERT INTO user_stats (user_id, total_pomodoros, total_focus_time, current_streak, longest_streak, weekly_pomodoros, monthly_pomodoros) VALUES ($1, 0, 0, 0, 0, 0, 0)',
      [userId]
    );

    const token = generateToken(userId, email);

    return res.status(201).json({
      user: {
        id: userId,
        email,
        username,
        displayName: displayName || username,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
