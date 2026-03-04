const { query } = require('./_db.cjs');
const { optionalAuthMiddleware } = require('./_auth.cjs');

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
    const { period = 'weekly', category = 'pomodoros', type = 'global', limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);

    let result;

    if (type === 'friends' && req.userId) {
      result = await getFriendsLeaderboard(req.userId, period, category, limitNum);
    } else {
      result = await getGlobalLeaderboard(period, category, limitNum);
    }

    const userRank = req.userId ? await getUserRank(req.userId, period, category) : null;

    return res.status(200).cjson({
      leaderboard: result,
      userRank,
      period,
      category,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
}

async function getGlobalLeaderboard(period, category, limit) {
  const orderColumn = getOrderColumn(category, period);

  const result = await query(
    `SELECT 
      us.user_id,
      us.total_pomodoros,
      us.total_focus_time,
      us.current_streak,
      us.longest_streak,
      us.weekly_pomodoros,
      us.monthly_pomodoros,
      p.username,
      p.display_name,
      p.avatar_url
    FROM user_stats us
    JOIN profiles p ON us.user_id = p.user_id
    WHERE p.is_public = true
    ORDER BY us.\${orderColumn} DESC NULLS LAST
    LIMIT \$1`,
    [limit]
  );

  return result.rows.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id,
    username: entry.username,
    displayName: entry.display_name,
    avatarUrl: entry.avatar_url,
    totalPomodoros: entry.total_pomodoros || 0,
    totalFocusTime: entry.total_focus_time || 0,
    currentStreak: entry.current_streak || 0,
    longestStreak: entry.longest_streak || 0,
    weeklyPomodoros: entry.weekly_pomodoros || 0,
    monthlyPomodoros: entry.monthly_pomodoros || 0,
    value: getValueByCategory(entry, category, period),
  }));
}

async function getFriendsLeaderboard(userId, period, category, limit) {
  const orderColumn = getOrderColumn(category, period);

  const result = await query(
    `SELECT 
      us.user_id,
      us.total_pomodoros,
      us.total_focus_time,
      us.current_streak,
      us.longest_streak,
      us.weekly_pomodoros,
      us.monthly_pomodoros,
      p.username,
      p.display_name,
      p.avatar_url,
      CASE WHEN us.user_id = \$1 THEN true ELSE false END as is_current_user
    FROM user_stats us
    JOIN profiles p ON us.user_id = p.user_id
    WHERE us.user_id = \$1 
       OR us.user_id IN (
         SELECT CASE 
           WHEN user_id = \$1 THEN friend_id 
           ELSE user_id 
         END 
         FROM friendships 
         WHERE (user_id = \$1 OR friend_id = \$1) AND status = 'accepted'
       )
    ORDER BY us.\${orderColumn} DESC NULLS LAST
    LIMIT \$2`,
    [userId, limit]
  );

  return result.rows.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id,
    username: entry.username,
    displayName: entry.display_name,
    avatarUrl: entry.avatar_url,
    totalPomodoros: entry.total_pomodoros || 0,
    totalFocusTime: entry.total_focus_time || 0,
    currentStreak: entry.current_streak || 0,
    longestStreak: entry.longest_streak || 0,
    weeklyPomodoros: entry.weekly_pomodoros || 0,
    monthlyPomodoros: entry.monthly_pomodoros || 0,
    value: getValueByCategory(entry, category, period),
    isCurrentUser: entry.is_current_user,
  }));
}

async function getUserRank(userId, period, category) {
  const orderColumn = getOrderColumn(category, period);

  const result = await query(
    `SELECT 
      us.\${orderColumn} as user_value,
      (SELECT COUNT(*) + 1 
       FROM user_stats us2 
       JOIN profiles p2 ON us2.user_id = p2.user_id 
       WHERE p2.is_public = true AND us2.\${orderColumn} > us.\${orderColumn}
      ) as rank,
      (SELECT COUNT(*) 
       FROM user_stats us3 
       JOIN profiles p3 ON us3.user_id = p3.user_id 
       WHERE p3.is_public = true
      ) as total_users
    FROM user_stats us
    WHERE us.user_id = \$1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { rank: null, totalUsers: 0 };
  }

  return {
    rank: parseInt(result.rows[0].rank) || null,
    totalUsers: parseInt(result.rows[0].total_users) || 0,
    value: result.rows[0].user_value || 0,
  };
}

function getOrderColumn(category, period) {
  const columns = {
    pomodoros: period === 'weekly' ? 'weekly_pomodoros' : period === 'monthly' ? 'monthly_pomodoros' : 'total_pomodoros',
    focusTime: 'total_focus_time',
    streak: 'current_streak',
  };
  return columns[category] || 'total_pomodoros';
}

function getValueByCategory(entry, category, period) {
  switch (category) {
    case 'pomodoros':
      if (period === 'weekly') return entry.weekly_pomodoros || 0;
      if (period === 'monthly') return entry.monthly_pomodoros || 0;
      return entry.total_pomodoros || 0;
    case 'focusTime':
      return entry.total_focus_time || 0;
    case 'streak':
      return entry.current_streak || 0;
    default:
      return entry.total_pomodoros || 0;
  }
}

module.exports = optionalAuthMiddleware(handler);
