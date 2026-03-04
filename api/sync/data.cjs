import { query, transaction } from '../_db.cjs';
import { authMiddleware } from '../_auth.cjs';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await getData(req, res);
    } else if (req.method === 'POST') {
      return await postData(req, res);
    } else {
      return res.status(405).cjson({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
}

async function getData(req, res) {
  const userId = req.userId;

  const [profileResult, tasksResult, sessionsResult, settingsResult, syncStateResult] = 
    await Promise.all([
      query('SELECT * FROM profiles WHERE user_id = $1', [userId]),
      query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query(
        `SELECT * FROM pomodoro_sessions 
         WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '30 days'
         ORDER BY completed_at DESC`,
        [userId]
      ),
      query('SELECT * FROM user_settings WHERE user_id = $1', [userId]),
      query('SELECT * FROM sync_state WHERE user_id = $1', [userId]),
    ]);

  const profile = profileResult.rows[0] || null;
  const tasks = tasksResult.rows || [];
  const sessions = sessionsResult.rows || [];
  const settings = settingsResult.rows[0] || null;
  const syncState = syncStateResult.rows[0] || null;

  const formattedTasks = tasks.map(task => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
    projectId: task.project_id,
    priority: task.priority,
    estimatedPomodoros: task.estimated_pomodoros,
    completedPomodoros: task.completed_pomodoros,
    subtasks: task.subtasks || [],
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }));

  return res.status(200).cjson({
    profile,
    tasks: formattedTasks,
    sessions,
    settings,
    syncState,
    serverTime: new Date().toISOString(),
  });
}

async function postData(req, res) {
  const userId = req.userId;
  const { tasks, settings, sessions, projects } = req.body;

  await transaction(async (client) => {
    if (settings) {
      await client.query(
        `INSERT INTO user_settings (user_id, durations, goals, settings, sound_presets, theme, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
         durations = EXCLUDED.durations,
         goals = EXCLUDED.goals,
         settings = EXCLUDED.settings,
         sound_presets = EXCLUDED.sound_presets,
         theme = EXCLUDED.theme,
         updated_at = NOW()`,
        [
          userId,
          JSON.stringify(settings.durations || { FOCUS: 25, SHORT: 5, LONG: 15 }),
          JSON.stringify(settings.goals || { daily: 8, weekly: 40 }),
          JSON.stringify(settings.settings || {}),
          JSON.stringify(settings.soundPresets || []),
          settings.theme || 'default',
        ]
      );
    }

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await client.query(
          `INSERT INTO tasks (id, user_id, text, completed, project_id, priority, 
                            estimated_pomodoros, completed_pomodoros, subtasks, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text,
           completed = EXCLUDED.completed,
           project_id = EXCLUDED.project_id,
           priority = EXCLUDED.priority,
           estimated_pomodoros = EXCLUDED.estimated_pomodoros,
           completed_pomodoros = EXCLUDED.completed_pomodoros,
           subtasks = EXCLUDED.subtasks,
           updated_at = EXCLUDED.updated_at`,
          [
            task.id,
            userId,
            task.text,
            task.completed,
            task.projectId || task.project_id,
            task.priority || 'medium',
            task.estimatedPomodoros || 1,
            task.completedPomodoros || 0,
            JSON.stringify(task.subtasks || []),
            task.createdAt || new Date().toISOString(),
            task.updatedAt || new Date().toISOString(),
          ]
        );
      }
    }

    if (projects && projects.length > 0) {
      for (const project of projects) {
        await client.query(
          `INSERT INTO projects (id, user_id, name, color, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           color = EXCLUDED.color,
           updated_at = EXCLUDED.updated_at`,
          [
            project.id,
            userId,
            project.name,
            project.color || '#6366f1',
            project.createdAt || new Date().toISOString(),
            project.updatedAt || new Date().toISOString(),
          ]
        );
      }
    }

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        await client.query(
          `INSERT INTO pomodoro_sessions (user_id, project_id, task_id, duration, session_type, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            userId,
            session.projectId,
            session.taskId,
            session.duration,
            session.type || 'focus',
            session.completedAt || new Date().toISOString(),
          ]
        );
      }
    }

    await client.query(
      `INSERT INTO sync_state (user_id, last_synced_at, device_id, updated_at)
       VALUES ($1, NOW(), $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       last_synced_at = NOW(),
       device_id = EXCLUDED.device_id,
       updated_at = NOW()`,
      [userId, req.headers['x-device-id'] || 'unknown']
    );
  });

  return res.status(200).cjson({
    success: true,
    timestamp: new Date().toISOString(),
  });
}

export default authMiddleware(handler);
