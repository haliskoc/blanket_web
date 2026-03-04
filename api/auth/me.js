import { query } from '../_db.js';
import { authMiddleware } from '../_auth.js';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userResult = await query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const profileResult = await query(
      `SELECT username, display_name, avatar_url, bio, is_public
       FROM profiles WHERE user_id = $1`,
      [req.userId]
    );

    const profile = profileResult.rows[0] || {};

    const statsResult = await query(
      `SELECT total_pomodoros, total_focus_time, current_streak, 
              longest_streak, weekly_pomodoros, monthly_pomodoros
       FROM user_stats WHERE user_id = $1`,
      [req.userId]
    );

    const stats = statsResult.rows[0] || {};

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        isPublic: profile.is_public,
      },
      stats: {
        totalPomodoros: stats.total_pomodoros || 0,
        totalFocusTime: stats.total_focus_time || 0,
        currentStreak: stats.current_streak || 0,
        longestStreak: stats.longest_streak || 0,
        weeklyPomodoros: stats.weekly_pomodoros || 0,
        monthlyPomodoros: stats.monthly_pomodoros || 0,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware(handler);
