import { query, transaction } from '../_db.js';
import { authMiddleware } from '../_auth.js';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getFriends(req, res);
      case 'POST':
        return await addFriend(req, res);
      case 'PUT':
        return await updateFriendship(req, res);
      case 'DELETE':
        return await removeFriend(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Friends error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getFriends(req, res) {
  const { status = 'accepted' } = req.query;

  const result = await query(
    `SELECT 
      f.id as friendship_id,
      f.user_id,
      f.friend_id,
      f.status,
      f.created_at,
      f.updated_at,
      CASE 
        WHEN f.user_id = $1 THEN f.friend_id 
        ELSE f.user_id 
      END as other_user_id,
      p.username,
      p.display_name,
      p.avatar_url,
      us.total_pomodoros,
      us.current_streak,
      us.total_focus_time
    FROM friendships f
    JOIN profiles p ON (
      CASE 
        WHEN f.user_id = $1 THEN f.friend_id 
        ELSE f.user_id 
      END
    ) = p.user_id
    LEFT JOIN user_stats us ON p.user_id = us.user_id
    WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = $2
    ORDER BY f.updated_at DESC`,
    [req.userId, status]
  );

  return res.status(200).json({
    friends: result.rows.map(row => ({
      friendshipId: row.friendship_id,
      userId: row.other_user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      status: row.status,
      isRequester: row.user_id === req.userId,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stats: {
        totalPomodoros: row.total_pomodoros || 0,
        currentStreak: row.current_streak || 0,
        totalFocusTime: row.total_focus_time || 0,
      },
    })),
  });
}

async function addFriend(req, res) {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const profileResult = await query(
    'SELECT user_id FROM profiles WHERE username = $1',
    [username.toLowerCase()]
  );

  if (profileResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const friendId = profileResult.rows[0].user_id;

  if (friendId === req.userId) {
    return res.status(400).json({ error: 'Cannot add yourself as friend' });
  }

  const existingResult = await query(
    `SELECT * FROM friendships 
     WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
    [req.userId, friendId]
  );

  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0];
    if (existing.status === 'accepted') {
      return res.status(409).json({ error: 'Already friends' });
    } else if (existing.status === 'pending') {
      return res.status(409).json({ error: 'Friend request already pending' });
    }
  }

  await query(
    `INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
     VALUES ($1, $2, 'pending', NOW(), NOW())`,
    [req.userId, friendId]
  );

  return res.status(201).json({ message: 'Friend request sent' });
}

async function updateFriendship(req, res) {
  const { friendshipId, action } = req.body;

  if (!friendshipId || !action) {
    return res.status(400).json({ error: 'Friendship ID and action are required' });
  }

  const friendshipResult = await query(
    'SELECT * FROM friendships WHERE id = $1',
    [friendshipId]
  );

  if (friendshipResult.rows.length === 0) {
    return res.status(404).json({ error: 'Friendship not found' });
  }

  const friendship = friendshipResult.rows[0];

  if (friendship.friend_id !== req.userId) {
    return res.status(403).json({ error: 'Can only respond to requests sent to you' });
  }

  if (action === 'accept') {
    await query(
      `UPDATE friendships 
       SET status = 'accepted', updated_at = NOW() 
       WHERE id = $1`,
      [friendshipId]
    );
    return res.status(200).json({ message: 'Friend request accepted' });
  } else if (action === 'reject') {
    await query(
      `UPDATE friendships 
       SET status = 'rejected', updated_at = NOW() 
       WHERE id = $1`,
      [friendshipId]
    );
    return res.status(200).json({ message: 'Friend request rejected' });
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }
}

async function removeFriend(req, res) {
  const { userId: friendId } = req.query;

  if (!friendId) {
    return res.status(400).json({ error: 'Friend ID is required' });
  }

  await query(
    `DELETE FROM friendships 
     WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
    [req.userId, friendId]
  );

  return res.status(200).json({ message: 'Friend removed' });
}

export default authMiddleware(handler);
