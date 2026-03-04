import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const SyncContext = createContext(null);

const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
  OFFLINE: 'offline',
  CONFLICT: 'conflict',
};

const SYNC_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 2000; // 2 seconds

export function SyncProvider({ children }) {
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isCloudEnabled, setIsCloudEnabled] = useState(() => {
    const saved = localStorage.getItem('podomodro-cloud-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [pendingChanges, setPendingChanges] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const syncTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const offlineQueueRef = useRef([]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isCloudEnabled && isAuthenticated) {
        processOfflineQueue();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(SYNC_STATUS.OFFLINE);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isCloudEnabled, isAuthenticated]);

  // Save cloud enabled preference
  useEffect(() => {
    localStorage.setItem('podomodro-cloud-enabled', JSON.stringify(isCloudEnabled));
  }, [isCloudEnabled]);

  // Auto sync when user changes
  useEffect(() => {
    if (!isConfigured || !isAuthenticated || !isCloudEnabled || !isOnline) {
      setSyncStatus(SYNC_STATUS.IDLE);
      return;
    }

    // Initial sync
    syncData();

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      if (pendingChanges > 0) {
        syncData();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConfigured, isAuthenticated, isCloudEnabled, isOnline, pendingChanges]);

  // Debounced sync trigger
  const triggerSync = useCallback(() => {
    if (!isCloudEnabled || !isAuthenticated || !isOnline) return;

    setPendingChanges(prev => prev + 1);
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncData();
    }, DEBOUNCE_DELAY);
  }, [isCloudEnabled, isAuthenticated, isOnline]);

  // Main sync function
  const syncData = useCallback(async () => {
    if (!isConfigured || !user || !isCloudEnabled || !isOnline) return;

    setSyncStatus(SYNC_STATUS.SYNCING);

    try {
      // Get local data
      const localData = getAllLocalData();
      
      // Fetch remote data
      const remoteData = await fetchRemoteData(user.id);
      
      // Resolve conflicts (last-write-wins strategy)
      const { mergedData, conflicts: detectedConflicts } = resolveConflicts(localData, remoteData);
      
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setSyncStatus(SYNC_STATUS.CONFLICT);
      }

      // Save merged data locally
      saveLocalData(mergedData);

      // Push to remote
      await pushToRemote(user.id, mergedData);

      setLastSyncedAt(new Date().toISOString());
      setPendingChanges(0);
      setSyncStatus(SYNC_STATUS.SYNCED);
      
      // Clear resolved conflicts
      if (detectedConflicts.length === 0) {
        setConflicts([]);
      }

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      
      // Add to offline queue if network error
      if (!navigator.onLine || error.message?.includes('network')) {
        addToOfflineQueue({ type: 'sync', timestamp: Date.now() });
        setSyncStatus(SYNC_STATUS.OFFLINE);
      }
    }
  }, [isConfigured, user, isCloudEnabled, isOnline]);

  // Get all local data
  const getAllLocalData = () => {
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
      _localUpdatedAt: localStorage.getItem('podomodro-last-updated') || new Date(0).toISOString(),
    };
  };

  // Save data to localStorage
  const saveLocalData = (data) => {
    const timestamp = new Date().toISOString();
    localStorage.setItem('podomodro-projects', JSON.stringify(data.projects || []));
    localStorage.setItem('podomodro-todos', JSON.stringify(data.todos || []));
    localStorage.setItem('podomodro-durations', JSON.stringify(data.durations || {}));
    localStorage.setItem('podomodro-stats', JSON.stringify(data.dailyStats || {}));
    localStorage.setItem('podomodro-goals', JSON.stringify(data.goals || {}));
    localStorage.setItem('podomodro-achievements', JSON.stringify(data.achievements || {}));
    localStorage.setItem('podomodro-settings', JSON.stringify(data.settings || {}));
    localStorage.setItem('podomodro-sound-presets', JSON.stringify(data.soundPresets || []));
    localStorage.setItem('podomodro-quick-notes', JSON.stringify(data.quickNotes || []));
    localStorage.setItem('podomodro-current-project', JSON.stringify(data.currentProject || null));
    localStorage.setItem('podomodro-last-updated', timestamp);
  };

  // Fetch data from Supabase
  const fetchRemoteData = async (userId) => {
    const tables = ['profiles', 'tasks', 'pomodoro_sessions', 'user_settings'];
    const remoteData = { _remoteUpdatedAt: new Date(0).toISOString() };

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      remoteData.profile = profile;
      remoteData._remoteUpdatedAt = profile.updated_at || remoteData._remoteUpdatedAt;
    }

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    remoteData.tasks = tasks || [];

    // Fetch sessions
    const { data: sessions } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId);
    remoteData.sessions = sessions || [];

    // Fetch settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    remoteData.userSettings = settings || {};

    return remoteData;
  };

  // Push data to Supabase
  const pushToRemote = async (userId, data) => {
    const timestamp = new Date().toISOString();

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: data.profile?.full_name || user?.user_metadata?.full_name || '',
      avatar_url: data.profile?.avatar_url || user?.user_metadata?.avatar_url || '',
      updated_at: timestamp,
    });

    // Sync tasks
    if (data.tasks && data.tasks.length > 0) {
      const tasksToUpsert = data.tasks.map(task => ({
        ...task,
        user_id: userId,
        updated_at: timestamp,
        created_at: task.created_at || timestamp,
      }));
      await supabase.from('tasks').upsert(tasksToUpsert, { onConflict: 'id' });
    }

    // Sync settings
    await supabase.from('user_settings').upsert({
      user_id: userId,
      durations: data.durations || { FOCUS: 25, SHORT: 5, LONG: 15 },
      goals: data.goals || { daily: 8, weekly: 40 },
      settings: data.settings || {},
      sound_presets: data.soundPresets || [],
      updated_at: timestamp,
    }, { onConflict: 'user_id' });
  };

  // Conflict resolution (last-write-wins)
  const resolveConflicts = (localData, remoteData) => {
    const conflicts = [];
    const mergedData = { ...localData };

    const localTime = new Date(localData._localUpdatedAt || 0);
    const remoteTime = new Date(remoteData._remoteUpdatedAt || 0);

    // If remote is newer, prefer remote data for settings
    if (remoteTime > localTime) {
      if (remoteData.userSettings) {
        mergedData.durations = remoteData.userSettings.durations || localData.durations;
        mergedData.goals = remoteData.userSettings.goals || localData.goals;
        mergedData.settings = { ...localData.settings, ...remoteData.userSettings.settings };
        mergedData.soundPresets = remoteData.userSettings.sound_presets || localData.soundPresets;
      }

      // Merge tasks (prefer remote for same IDs if remote is newer)
      if (remoteData.tasks) {
        const remoteTaskMap = new Map(remoteData.tasks.map(t => [t.id, t]));
        mergedData.todos = localData.todos.map(localTask => {
          const remoteTask = remoteTaskMap.get(localTask.id);
          if (remoteTask) {
            const remoteTaskTime = new Date(remoteTask.updated_at || 0);
            const localTaskTime = new Date(localTask.updated_at || localTask.created_at || 0);
            
            if (remoteTaskTime > localTaskTime) {
              return { ...remoteTask, projectId: remoteTask.project_id };
            } else if (localTaskTime > remoteTaskTime) {
              conflicts.push({
                type: 'task',
                id: localTask.id,
                local: localTask,
                remote: remoteTask,
              });
            }
          }
          return localTask;
        });

        // Add remote-only tasks
        const localTaskIds = new Set(localData.todos.map(t => t.id));
        remoteData.tasks.forEach(remoteTask => {
          if (!localTaskIds.has(remoteTask.id)) {
            mergedData.todos.push({ ...remoteTask, projectId: remoteTask.project_id });
          }
        });
      }
    }

    return { mergedData, conflicts };
  };

  // Offline queue management
  const addToOfflineQueue = (operation) => {
    offlineQueueRef.current.push(operation);
    localStorage.setItem('podomodro-offline-queue', JSON.stringify(offlineQueueRef.current));
  };

  const processOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('podomodro-offline-queue') || '[]');
    if (queue.length === 0) return;

    for (const operation of queue) {
      try {
        if (operation.type === 'sync') {
          await syncData();
        }
      } catch (error) {
        console.error('Failed to process offline operation:', error);
        return;
      }
    }

    offlineQueueRef.current = [];
    localStorage.removeItem('podomodro-offline-queue');
  };

  // Manual sync trigger
  const forceSync = useCallback(async () => {
    await syncData();
  }, [syncData]);

  // Resolve conflict manually
  const resolveConflict = useCallback((conflictId, resolution) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    if (resolution === 'local') {
      // Keep local, will be synced on next push
      triggerSync();
    } else if (resolution === 'remote') {
      // Apply remote version
      syncData();
    }
  }, [triggerSync, syncData]);

  // Clear all cloud data
  const clearCloudData = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('pomodoro_sessions').delete().eq('user_id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      
      setLastSyncedAt(null);
      setSyncStatus(SYNC_STATUS.IDLE);
    } catch (error) {
      console.error('Error clearing cloud data:', error);
      throw error;
    }
  }, [user]);

  // Export cloud data
  const exportCloudData = useCallback(async () => {
    if (!user) return null;
    
    try {
      const data = await fetchRemoteData(user.id);
      return {
        ...data,
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting cloud data:', error);
      throw error;
    }
  }, [user]);

  const value = {
    syncStatus,
    lastSyncedAt,
    isCloudEnabled,
    setIsCloudEnabled,
    pendingChanges,
    conflicts,
    isOnline,
    triggerSync,
    forceSync,
    resolveConflict,
    clearCloudData,
    exportCloudData,
    SYNC_STATUS,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === null) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export default SyncContext;
