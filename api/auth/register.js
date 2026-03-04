import { query, transaction } from '../_db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../_auth.js';
import { v4 as uuidv4 } from 'uuid';

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
      return res.status(400).json({ 
        error: 'Email, password, and username are required' 
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        error: 'Username must be between 3 and 30 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await query(
      'SELECT id FROM profiles WHERE username = $1',
      [username.toLowerCase()]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, email.toLowerCase(), passwordHash]
      );

      await client.query(
        `INSERT INTO profiles (user_id, username, display_name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, username.toLowerCase(), displayName || username]
      );

      await client.query(
        `INSERT INTO user_stats (user_id, created_at, updated_at)
         VALUES ($1, NOW(), NOW())`,
        [userId]
      );

      await client.query(
        `INSERT INTO user_settings (user_id, durations, goals, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [
          userId,
          JSON.stringify({ FOCUS: 25, SHORT: 5, LONG: 15 }),
          JSON.stringify({ daily: 8, weekly: 40 }),
          JSON.stringify({}),
        ]
      );
    });

    const token = generateToken(userId);

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        displayName: displayName || username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
