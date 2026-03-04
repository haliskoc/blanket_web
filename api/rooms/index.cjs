import { query, transaction } from '../_db.cjs';
import { authMiddleware, optionalAuthMiddleware } from '../_auth.cjs';
import { v4 as uuidv4 } from 'uuid';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await getRooms(req, res);
    } else if (req.method === 'POST') {
      return await createRoom(req, res);
    } else {
      return res.status(405).cjson({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rooms error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
}

async function getRooms(req, res) {
  const { status = 'active', search, limit = 20, offset = 0 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const offsetNum = parseInt(offset) || 0;

  let sql = `
    SELECT 
      r.id,
      r.name,
      r.description,
      r.is_private,
      r.max_participants,
      r.created_at,
      r.created_by,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_url as creator_avatar,
      (SELECT COUNT(*) FROM room_participants WHERE room_id = r.id AND left_at IS NULL) as participant_count,
      (SELECT COUNT(*) FROM room_participants WHERE room_id = r.id AND is_active = true) as active_count
    FROM rooms r
    LEFT JOIN profiles p ON r.created_by = p.user_id
    WHERE r.status = $1
  `;

  const params = [status];
  let paramIndex = 1;

  if (search) {
    paramIndex++;
    sql += ` AND (r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
  }

  if (!req.userId) {
    sql += ` AND r.is_private = false`;
  }

  sql += ` ORDER BY r.created_at DESC LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
  params.push(limitNum, offsetNum);

  const result = await query(sql, params);

  const countResult = await query(
    `SELECT COUNT(*) FROM rooms r WHERE r.status = $1 ${!req.userId ? 'AND r.is_private = false' : ''}`,
    [status]
  );

  return res.status(200).cjson({
    rooms: result.rows.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      isPrivate: room.is_private,
      maxParticipants: room.max_participants,
      participantCount: parseInt(room.participant_count) || 0,
      activeCount: parseInt(room.active_count) || 0,
      createdAt: room.created_at,
      creator: {
        id: room.created_by,
        username: room.creator_username,
        displayName: room.creator_display_name,
        avatarUrl: room.creator_avatar,
      },
    })),
    pagination: {
      total: parseInt(countResult.rows[0].count) || 0,
      limit: limitNum,
      offset: offsetNum,
    },
  });
}

async function createRoom(req, res) {
  if (!req.userId) {
    return res.status(401).cjson({ error: 'Authentication required' });
  }

  const { name, description, isPrivate = false, maxParticipants = 10, password } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).cjson({ error: 'Room name must be at least 3 characters' });
  }

  const roomId = uuidv4();

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO rooms (id, name, description, is_private, password_hash, max_participants, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())`,
      [roomId, name.trim(), description || null, isPrivate, password || null, maxParticipants, req.userId]
    );

    await client.query(
      `INSERT INTO room_participants (room_id, user_id, joined_at, is_active, is_host)
       VALUES ($1, $2, NOW(), true, true)`,
      [roomId, req.userId]
    );
  });

  const roomResult = await query(
    `SELECT 
      r.*, 
      p.username as creator_username,
      p.display_name as creator_display_name
    FROM rooms r
    JOIN profiles p ON r.created_by = p.user_id
    WHERE r.id = $1`,
    [roomId]
  );

  const room = roomResult.rows[0];

  return res.status(201).cjson({
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      isPrivate: room.is_private,
      maxParticipants: room.max_participants,
      status: room.status,
      createdAt: room.created_at,
      creator: {
        id: room.created_by,
        username: room.creator_username,
        displayName: room.creator_display_name,
      },
    },
  });
}

export default optionalAuthMiddleware(handler);
