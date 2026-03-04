import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
    this.offlineMode = !navigator.onLine;
    this.syncCallbacks = [];

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.offlineMode = true;
    });
  }

  onSync(callback) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  notifySync(status, data = null) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status, data);
      } catch (err) {
        console.error('Sync callback error:', err);
      }
    });
  }

  async syncAll(userId) {
    if (!isSupabaseConfigured() || this.offlineMode || !userId) {
      return { success: false, reason: 'not_configured_or_offline' };
    }

    this.notifySync('syncing');

    try {
      // Get local data
      const localData = this.getAllLocalData();

      // Fetch remote data
      const remoteData = await this.fetchRemoteData(userId);

      // Merge data (last-write-wins)
      const mergedData = this.mergeData(localData, remoteData);

      // Save locally
      this.saveLocalData(mergedData);

      // Push to remote
      await this.pushToRemote(userId, mergedData);

      // Update sync state
      await this.updateSyncState(userId);

      this.notifySync('synced', { timestamp: new Date().toISOString() });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Sync error:', error);
      this.notifySync('error', error);
      return { success: false, error: error.message };
    }
  }

  getAllLocalData() {
    return {
      projects: JSON.parse(localStorage.getItem('podomodro-projects') || '[]'),
      todos: JSON.parse(localStorage.getItem('podomodro-todos') || '[]'),
      durations: JSON.parse(localStorage.getItem('podomodro-durations') || '{}'),
      dailyStats: JSON.parse(localStorage.getItem('podomodro-stats') || '{}'),
      goals: JSON.parse(localStorage.getItem('podomodro-goals') || '{}'),
      achievements: JSON.parse(localStorage.getItem('podomodro-achievements') || '{}'),
      settings: JSON.parse(localStorage.getItem('podomodro-settings') || '{}'),
      soundPresets: JSON.parse(localStorage.getItem('podomodro-sound-presets') || '[]'),
      quickNotes: JSON.parse(localStorage.getItem('podomodro-quick-notes') || '[]'),
      currentProject: JSON.parse(localStorage.getItem('podomodro-current-project') || 'null'),
      _lastUpdated: localStorage.getItem('podomodro-last-updated') || new Date(0).toISOString(),
    };
  }

  saveLocalData(data) {
    const timestamp = new Date().toISOString();
    
    if (data.projects) localStorage.setItem('podomodro-projects', JSON.stringify(data.projects));
    if (data.todos) localStorage.setItem('podomodro-todos', JSON.stringify(data.todos));
    if (data.durations) localStorage.setItem('podomodro-durations', JSON.stringify(data.durations));
    if (data.dailyStats) localStorage.setItem('podomodro-stats', JSON.stringify(data.dailyStats));
    if (data.goals) localStorage.setItem('podomodro-goals', JSON.stringify(data.goals));
    if (data.achievements) localStorage.setItem('podomodro-achievements', JSON.stringify(data.achievements));
    if (data.settings) localStorage.setItem('podomodro-settings', JSON.stringify(data.settings));
    if (data.soundPresets) localStorage.setItem('podomodro-sound-presets', JSON.stringify(data.soundPresets));
    if (data.quickNotes) localStorage.setItem('podomodro-quick-notes', JSON.stringify(data.quickNotes));
    if (data.currentProject) localStorage.setItem('podomodro-current-project', JSON.stringify(data.currentProject));
    
    localStorage.setItem('podomodro-last-updated', timestamp);
  }

  async fetchRemoteData(userId) {
    const result = {
      tasks: [],
      sessions: [],
      settings: null,
      profile: null,
      _lastSynced: null,
    };

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profile) {
      result.profile = profile;
      result._lastSynced = profile.updated_at;
    }

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    result.tasks = tasks || [];

    // Fetch sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: sessions } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false });
    result.sessions = sessions || [];

    // Fetch settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    result.settings = settings;

    return result;
  }

  mergeData(local, remote) {
    const merged = { ...local };
    const localTime = new Date(local._lastUpdated || 0);
    const remoteTime = new Date(remote._lastSynced || 0);

    // Prefer remote if it's newer
    if (remoteTime > localTime) {
      if (remote.settings) {
        merged.durations = remote.settings.durations || local.durations;
        merged.goals = remote.settings.goals || local.goals;
        merged.settings = { ...local.settings, ...remote.settings.settings };
        merged.soundPresets = remote.settings.sound_presets || local.soundPresets;
        merged.theme = remote.settings.theme || local.theme;
      }
    }

    // Merge tasks
    if (remote.tasks && remote.tasks.length > 0) {
      const taskMap = new Map();
      
      // Add all local tasks
      local.todos.forEach(task => {
        taskMap.set(task.id, { ...task, source: 'local' });
      });

      // Merge remote tasks
      remote.tasks.forEach(remoteTask => {
        const localTask = taskMap.get(remoteTask.id);
        
        if (localTask) {
          // Task exists locally - compare timestamps
          const remoteTaskTime = new Date(remoteTask.updated_at || 0);
          const localTaskTime = new Date(localTask.updated_at || localTask.created_at || 0);
          
          if (remoteTaskTime > localTaskTime) {
            taskMap.set(remoteTask.id, {
              ...remoteTask,
              projectId: remoteTask.project_id,
              completedPomodoros: remoteTask.completed_pomodoros,
              estimatedPomodoros: remoteTask.estimated_pomodoros,
              source: 'remote',
            });
          }
        } else {
          // New task from remote
          taskMap.set(remoteTask.id, {
            ...remoteTask,
            projectId: remoteTask.project_id,
            completedPomodoros: remoteTask.completed_pomodoros,
            estimatedPomodoros: remoteTask.estimated_pomodoros,
            source: 'remote',
          });
        }
      });

      merged.todos = Array.from(taskMap.values());
    }

    // Merge sessions for stats
    if (remote.sessions && remote.sessions.length > 0) {
      const existingDates = Object.keys(local.dailyStats || {});
      const remoteStats = {};

      remote.sessions.forEach(session => {
        const date = session.completed_at.split('T')[0];
        if (!remoteStats[date]) {
          remoteStats[date] = { count: 0, projects: {}, hours: {} };
        }
        remoteStats[date].count++;
        
        const projectName = session.project_id || 'Unknown';
        remoteStats[date].projects[projectName] = (remoteStats[date].projects[projectName] || 0) + 1;
        
        const hour = new Date(session.completed_at).getHours();
        remoteStats[date].hours[hour] = (remoteStats[date].hours[hour] || 0) + 1;
      });

      // Merge stats (prefer local for same dates if local is newer)
      merged.dailyStats = { ...remoteStats, ...local.dailyStats };
    }

    return merged;
  }

  async pushToRemote(userId, data) {
    const timestamp = new Date().toISOString();

    // Upsert settings
    if (data.durations || data.goals || data.settings) {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        durations: data.durations || { FOCUS: 25, SHORT: 5, LONG: 15 },
        goals: data.goals || { daily: 8, weekly: 40 },
        settings: data.settings || {},
        sound_presets: data.soundPresets || [],
        theme: data.theme || 'default',
        updated_at: timestamp,
      }, { onConflict: 'user_id' });
    }

    // Sync tasks
    if (data.todos && data.todos.length > 0) {
      const tasksToUpsert = data.todos.map(task => ({
        id: task.id,
        user_id: userId,
        text: task.text,
        completed: task.completed,
        project_id: task.projectId || task.project_id,
        priority: task.priority || 'medium',
        estimated_pomodoros: task.estimatedPomodoros || 1,
        completed_pomodoros: task.completedPomodoros || 0,
        subtasks: task.subtasks || [],
        created_at: task.created_at || task.createdAt || timestamp,
        updated_at: task.updated_at || timestamp,
      }));

      // Batch upsert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < tasksToUpsert.length; i += chunkSize) {
        const chunk = tasksToUpsert.slice(i, i + chunkSize);
        await supabase.from('tasks').upsert(chunk, { onConflict: 'id' });
      }
    }

    // Note: Sessions are only pushed, never pulled for stats reconstruction
    // This is because sessions are created on completion and should be immutable
  }

  async updateSyncState(userId) {
    await supabase.from('sync_state').upsert({
      user_id: userId,
      last_synced_at: new Date().toISOString(),
      device_id: this.getDeviceId(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('podomodro-device-id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('podomodro-device-id', deviceId);
    }
    return deviceId;
  }

  async recordSession(userId, sessionData) {
    if (!isSupabaseConfigured() || !userId) {
      // Queue for later if offline
      this.addToQueue({ type: 'session', data: sessionData });
      return { success: false, queued: true };
    }

    try {
      const { error } = await supabase.from('pomodoro_sessions').insert({
        user_id: userId,
        project_id: sessionData.projectId,
        task_id: sessionData.taskId,
        duration: sessionData.duration,
        session_type: sessionData.type || 'focus',
        completed_at: sessionData.completedAt || new Date().toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to record session:', error);
      this.addToQueue({ type: 'session', data: sessionData });
      return { success: false, error: error.message, queued: true };
    }
  }

  addToQueue(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
    });
    this.saveQueue();
  }

  saveQueue() {
    localStorage.setItem('podomodro-sync-queue', JSON.stringify(this.syncQueue));
  }

  loadQueue() {
    const saved = localStorage.getItem('podomodro-sync-queue');
    if (saved) {
      this.syncQueue = JSON.parse(saved);
    }
  }

  async processQueue() {
    if (this.isProcessing || this.offlineMode || !isSupabaseConfigured()) {
      return;
    }

    this.loadQueue();
    if (this.syncQueue.length === 0) return;

    this.isProcessing = true;
    this.notifySync('processing_queue', { count: this.syncQueue.length });

    const processed = [];

    for (const operation of this.syncQueue) {
      try {
        if (operation.type === 'session') {
          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await this.recordSession(session.user.id, operation.data);
            processed.push(operation);
          }
        }
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        // Keep in queue if failed
      }
    }

    // Remove processed items
    this.syncQueue = this.syncQueue.filter(op => !processed.includes(op));
    this.saveQueue();

    this.isProcessing = false;
    this.notifySync('queue_processed', { processed: processed.length, remaining: this.syncQueue.length });
  }

  async exportData(userId) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Not configured or not authenticated');
    }

    const remoteData = await this.fetchRemoteData(userId);
    return {
      ...remoteData,
      localData: this.getAllLocalData(),
      exported_at: new Date().toISOString(),
    };
  }

  async clearCloudData(userId) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Not configured or not authenticated');
    }

    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('pomodoro_sessions').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('sync_state').delete().eq('user_id', userId);
  }
}

// Create singleton instance
export const syncService = new SyncService();

export default syncService;
