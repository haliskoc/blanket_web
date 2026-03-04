const { query } = require('../_db.cjs');
const { authMiddleware } = require('../_auth.cjs');

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).cjson({ error: 'Method not allowed' });
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.username, p.display_name, p.avatar_url, p.is_public,
        us.total_pomodoros, us.total_focus_time, us.current_streak, us.longest_streak
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_stats us ON u.id = us.user_id
      WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).cjson({ error: 'User not found' });
    }

    const user = result.rows[0];

    return res.status(200).cjson({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isPublic: user.is_public,
        stats: {
          totalPomodoros: user.total_pomodoros || 0,
          totalFocusTime: user.total_focus_time || 0,
          currentStreak: user.current_streak || 0,
          longestStreak: user.longest_streak || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
}

module.exports = authMiddleware(handler);
