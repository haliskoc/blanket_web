import { query } from '../_db.cjs';
import { optionalAuthMiddleware } from '../_auth.cjs';

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

  const { username } = req.query;

  if (!username) {
    return res.status(400).cjson({ error: 'Username is required' });
  }

  try {
    const profileResult = await query(
      `SELECT 
        p.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.bio,
        p.is_public,
        p.created_at,
        us.total_pomodoros,
        us.total_focus_time,
        us.current_streak,
        us.longest_streak,
        us.weekly_pomodoros,
        us.monthly_pomodoros
      FROM profiles p
      LEFT JOIN user_stats us ON p.user_id = us.user_id
      WHERE p.username = $1`,
      [username.toLowerCase()]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).cjson({ error: 'User not found' });
    }

    const profile = profileResult.rows[0];

    if (!profile.is_public) {
      const isFriend = await checkIsFriend(req.userId, profile.user_id);
      const isOwner = req.userId === profile.user_id;

      if (!isOwner && !isFriend) {
        return res.status(403).cjson({ 
          error: 'Private profile',
          isPrivate: true,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        });
      }
    }

    const recentSessionsResult = await query(
      `SELECT 
        ps.session_type,
        ps.duration,
        ps.completed_at,
        pr.name as project_name
      FROM pomodoro_sessions ps
      LEFT JOIN projects pr ON ps.project_id = pr.id
      WHERE ps.user_id = $1
      ORDER BY ps.completed_at DESC
      LIMIT 10`,
      [profile.user_id]
    );

    const achievementsResult = await query(
      `SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC`,
      [profile.user_id]
    );

    return res.status(200).cjson({
      profile: {
        id: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        isPublic: profile.is_public,
        createdAt: profile.created_at,
      },
      stats: {
        totalPomodoros: profile.total_pomodoros || 0,
        totalFocusTime: profile.total_focus_time || 0,
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        weeklyPomodoros: profile.weekly_pomodoros || 0,
        monthlyPomodoros: profile.monthly_pomodoros || 0,
      },
      recentSessions: recentSessionsResult.rows.map(s => ({
        type: s.session_type,
        duration: s.duration,
        completedAt: s.completed_at,
        projectName: s.project_name,
      })),
      achievements: achievementsResult.rows.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        earnedAt: a.earned_at,
      })),
      isOwnProfile: req.userId === profile.user_id,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
}

async function checkIsFriend(userId, otherUserId) {
  if (!userId) return false;

  const result = await query(
    `SELECT 1 FROM friendships 
     WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
     AND status = 'accepted'`,
    [userId, otherUserId]
  );

  return result.rows.length > 0;
}

export default optionalAuthMiddleware(handler);
