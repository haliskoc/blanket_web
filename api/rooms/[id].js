import { query, transaction } from '../_db.js';
import { authMiddleware, optionalAuthMiddleware } from '../_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getRoom(req, res, id);
      case 'POST':
        return await joinRoom(req, res, id);
      case 'PUT':
        return await updateRoom(req, res, id);
      case 'DELETE':
        return await leaveRoom(req, res, id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Room detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getRoom(req, res, roomId) {
  const roomResult = await query(
    `SELECT 
      r.*,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_url as creator_avatar
    FROM rooms r
    JOIN profiles p ON r.created_by = p.user_id
    WHERE r.id = $1`,
    [roomId]
  );

  if (roomResult.rows.length === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const room = roomResult.rows[0];

  if (room.is_private && !req.userId) {
    return res.status(403).json({ error: 'Private room - authentication required' });
  }

  const participantsResult = await query(
    `SELECT 
      rp.user_id,
      rp.joined_at,
      rp.is_active,
      rp.is_host,
      rp.current_task,
      p.username,
      p.display_name,
      p.avatar_url,
      us.current_streak,
      us.total_pomodoros
    FROM room_participants rp
    JOIN profiles p ON rp.user_id = p.user_id
    LEFT JOIN user_stats us ON rp.user_id = us.user_id
    WHERE rp.room_id = $1 AND rp.left_at IS NULL
    ORDER BY rp.joined_at ASC`,
    [roomId]
  );

  const isParticipant = req.userId && participantsResult.rows.some(p => p.user_id === req.userId);

  return res.status(200).json({
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      isPrivate: room.is_private,
      maxParticipants: room.max_participants,
      status: room.status,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
      creator: {
        id: room.created_by,
        username: room.creator_username,
        displayName: room.creator_display_name,
        avatarUrl: room.creator_avatar,
      },
    },
    participants: participantsResult.rows.map(p => ({
      id: p.user_id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      joinedAt: p.joined_at,
      isActive: p.is_active,
      isHost: p.is_host,
      currentTask: p.current_task,
      currentStreak: p.current_streak || 0,
      totalPomodoros: p.total_pomodoros || 0,
    })),
    isParticipant,
  });
}

async function joinRoom(req, res, roomId) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { password } = req.body;

  const roomResult = await query(
    'SELECT * FROM rooms WHERE id = $1',
    [roomId]
  );

  if (roomResult.rows.length === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const room = roomResult.rows[0];

  if (room.status !== 'active') {
    return res.status(400).json({ error: 'Room is not active' });
  }

  const participantCountResult = await query(
    'SELECT COUNT(*) FROM room_participants WHERE room_id = $1 AND left_at IS NULL',
    [roomId]
  );

  const participantCount = parseInt(participantCountResult.rows[0].count);

  if (participantCount >= room.max_participants) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const existingParticipant = await query(
    'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
    [roomId, req.userId]
  );

  if (existingParticipant.rows.length > 0) {
    return res.status(200).json({ message: 'Already in room', joined: false });
  }

  if (room.is_private && room.password_hash && room.password_hash !== password) {
    return res.status(403).json({ error: 'Invalid room password' });
  }

  await query(
    `INSERT INTO room_participants (room_id, user_id, joined_at, is_active, is_host)
     VALUES ($1, $2, NOW(), true, false)
     ON CONFLICT (room_id, user_id) DO UPDATE SET
     left_at = NULL,
     is_active = true`,
    [roomId, req.userId]
  );

  return res.status(200).json({ message: 'Joined room successfully', joined: true });
}

async function updateRoom(req, res, roomId) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const participantResult = await query(
    'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
    [roomId, req.userId]
  );

  if (participantResult.rows.length === 0) {
    return res.status(403).json({ error: 'Only host can update room' });
  }

  const { name, description, status, maxParticipants } = req.body;

  const updates = [];
  const values = [];
  let paramIndex = 0;

  if (name !== undefined) {
    updates.push(`name = $${++paramIndex}`);
    values.push(name.trim());
  }
  if (description !== undefined) {
    updates.push(`description = $${++paramIndex}`);
    values.push(description);
  }
  if (status !== undefined) {
    updates.push(`status = $${++paramIndex}`);
    values.push(status);
  }
  if (maxParticipants !== undefined) {
    updates.push(`max_participants = $${++paramIndex}`);
    values.push(maxParticipants);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push(`updated_at = NOW()`);
  values.push(roomId);

  await query(
    `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${++paramIndex}`,
    values
  );

  return res.status(200).json({ message: 'Room updated successfully' });
}

async function leaveRoom(req, res, roomId) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  await query(
    `UPDATE room_participants 
     SET left_at = NOW(), is_active = false 
     WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, req.userId]
  );

  const remainingParticipants = await query(
    'SELECT COUNT(*) FROM room_participants WHERE room_id = $1 AND left_at IS NULL',
    [roomId]
  );

  if (parseInt(remainingParticipants.rows[0].count) === 0) {
    await query(
      `UPDATE rooms SET status = 'closed', updated_at = NOW() WHERE id = $1`,
      [roomId]
    );
  }

  return res.status(200).json({ message: 'Left room successfully' });
}
