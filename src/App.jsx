import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2, Tag, CloudRain, TreePine,
  Coffee, Wind, Sun, Library, Image as ImageIcon,
  Zap, BarChart3, ListTodo, Clock, FolderPlus, ChevronRight,
  Home, Folder, Target, Flame, Trophy, Award, Star,
  TrendingUp, Calendar, Bell, BellOff, Volume2, ChevronDown,
  ChevronUp, GripVertical, AlertCircle, Circle,
  Moon, Ship, Waves, Maximize2, Minimize2, Download, Upload,
  StickyNote, Droplets, Eye, Activity
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence, LayoutGroup, Reorder } from 'framer-motion';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell
} from 'recharts';
import confetti from 'canvas-confetti';
import './App.css';

const SOUND_BASE_URL = 'https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/';

const SOUNDS = [
  { id: 'rain', label: 'Rain', filename: 'rain.ogg', icon: <CloudRain size={20} /> },
  { id: 'storm', label: 'Storm', filename: 'storm.ogg', icon: <Wind size={20} /> },
  { id: 'wind', label: 'Wind', filename: 'wind.ogg', icon: <Wind size={20} /> },
  { id: 'waves', label: 'Waves', filename: 'waves.ogg', icon: <Waves size={20} /> },
  { id: 'stream', label: 'Stream', filename: 'stream.ogg', icon: <Droplets size={20} /> },
  { id: 'birds', label: 'Birds', filename: 'birds.ogg', icon: <TreePine size={20} /> },
  { id: 'summer-night', label: 'Summer Night', filename: 'summer-night.ogg', icon: <Moon size={20} /> },
  { id: 'fireplace', label: 'Fire', filename: 'fireplace.ogg', icon: <Sun size={20} /> },
  { id: 'coffee-shop', label: 'Cafe', filename: 'coffee-shop.ogg', icon: <Coffee size={20} /> },
  { id: 'city', label: 'City', filename: 'city.ogg', icon: <ImageIcon size={20} /> },
  { id: 'train', label: 'Train', filename: 'train.ogg', icon: <ImageIcon size={20} /> },
  { id: 'boat', label: 'Boat', filename: 'boat.ogg', icon: <Ship size={20} /> },
  { id: 'white-noise', label: 'White Noise', filename: 'white-noise.ogg', icon: <Library size={20} /> },
  { id: 'pink-noise', label: 'Pink Noise', filename: 'pink-noise.ogg', icon: <Activity size={20} /> },
];

const BREAK_ACTIVITIES = [
  { icon: '🚶', text: '5 min walk', duration: 5 },
  { icon: '💧', text: 'Drink water', duration: 2 },
  { icon: '👁️', text: 'Eye exercises', duration: 3 },
  { icon: '🧘', text: 'Breathing exercise', duration: 5 },
  { icon: '🤸', text: 'Stretching', duration: 5 },
];

const DEFAULT_SOUND_PRESETS = [
  { id: 1, name: 'Rainy Cafe', sounds: ['rain', 'coffee-shop'] },
  { id: 2, name: 'Deep Focus', sounds: ['white-noise'] },
  { id: 3, name: 'Nature', sounds: ['birds', 'stream'] },
  { id: 4, name: 'Night Storm', sounds: ['storm', 'rain'] },
];

const ALARM_SOUNDS = [
  { id: 'bell', label: 'Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'chime', label: 'Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' },
  { id: 'digital', label: 'Digital', url: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3' },
];

const THEMES = [
  { id: 'default', label: 'Deep Zen' },
  { id: 'nature', label: 'Forest' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'sea', label: 'Ocean' },
  { id: 'city', label: 'Night City' },
  { id: 'space', label: 'Starry Sky' },
  { id: 'rain', label: 'Rainy Day' },
  { id: 'coffee', label: 'Coffee House' },
  { id: 'cyberpunk', label: 'Neon' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#10b981', icon: <Circle size={12} /> },
  { id: 'medium', label: 'Medium', color: '#f59e0b', icon: <AlertCircle size={12} /> },
  { id: 'high', label: 'High', color: '#ef4444', icon: <Flame size={12} /> },
];

const BADGES = [
  { id: 'first_pomodoro', name: 'First Step', description: 'Complete your first pomodoro', icon: '🎯', condition: (stats) => stats.totalPomodoros >= 1 },
  { id: 'ten_pomodoros', name: 'Getting Started', description: 'Complete 10 pomodoros', icon: '🌱', condition: (stats) => stats.totalPomodoros >= 10 },
  { id: 'fifty_pomodoros', name: 'Focused Mind', description: 'Complete 50 pomodoros', icon: '🧠', condition: (stats) => stats.totalPomodoros >= 50 },
  { id: 'hundred_pomodoros', name: 'Centurion', description: 'Complete 100 pomodoros', icon: '💯', condition: (stats) => stats.totalPomodoros >= 100 },
  { id: 'streak_3', name: 'On Fire', description: '3 day streak', icon: '🔥', condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', icon: '⚡', condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', description: '30 day streak', icon: '👑', condition: (stats) => stats.currentStreak >= 30 },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a pomodoro before 8 AM', icon: '🐦', condition: (stats) => stats.earlyBird },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a pomodoro after 10 PM', icon: '🦉', condition: (stats) => stats.nightOwl },
  { id: 'daily_goal', name: 'Goal Crusher', description: 'Reach daily goal 5 times', icon: '🏆', condition: (stats) => stats.dailyGoalsReached >= 5 },
];

// Context for shared state
const AppContext = React.createContext();

function AppProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('podomodro-projects');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Deep Focus', color: '#ff3b3b' },
      { id: 2, name: 'Coding', color: '#3b82f6' },
      { id: 3, name: 'Design', color: '#8b5cf6' },
    ];
  });

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('podomodro-todos');
    return saved ? JSON.parse(saved) : [];
  });

  const [durations, setDurations] = useState(() => {
    const saved = localStorage.getItem('podomodro-durations');
    return saved ? JSON.parse(saved) : { FOCUS: 25, SHORT: 5, LONG: 15 };
  });

  const [dailyStats, setDailyStats] = useState(() => {
    const saved = localStorage.getItem('podomodro-stats');
    return saved ? JSON.parse(saved) : {};
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('podomodro-goals');
    return saved ? JSON.parse(saved) : { daily: 8, weekly: 40 };
  });

  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('podomodro-achievements');
    return saved ? JSON.parse(saved) : { 
      unlockedBadges: [], 
      totalPomodoros: 0, 
      currentStreak: 0, 
      longestStreak: 0,
      lastActiveDate: null,
      earlyBird: false,
      nightOwl: false,
      dailyGoalsReached: 0
    };
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('podomodro-settings');
    return saved ? JSON.parse(saved) : {
      autoStartBreak: true,
      autoStartFocus: false,
      longBreakInterval: 4,
      notifications: true,
      alarmSound: 'bell',
      alarmVolume: 0.7
    };
  });

  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem('podomodro-current-project');
    return saved ? JSON.parse(saved) : projects[0];
  });

  useEffect(() => {
    localStorage.setItem('podomodro-projects', JSON.stringify(projects));
    localStorage.setItem('podomodro-todos', JSON.stringify(todos));
    localStorage.setItem('podomodro-durations', JSON.stringify(durations));
    localStorage.setItem('podomodro-stats', JSON.stringify(dailyStats));
    localStorage.setItem('podomodro-goals', JSON.stringify(goals));
    localStorage.setItem('podomodro-achievements', JSON.stringify(achievements));
    localStorage.setItem('podomodro-settings', JSON.stringify(settings));
    localStorage.setItem('podomodro-current-project', JSON.stringify(currentProject));
  }, [projects, todos, durations, dailyStats, goals, achievements, settings, currentProject]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Check and update streak
  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    setAchievements(prev => {
      let newStreak = prev.currentStreak;
      let newLongest = prev.longestStreak;
      
      if (prev.lastActiveDate === yesterday) {
        newStreak = prev.currentStreak + 1;
      } else if (prev.lastActiveDate !== today) {
        newStreak = 1;
      }
      
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }
      
      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today
      };
    });
  };

  const addProject = (name, color) => {
    const newProject = { id: Date.now(), name, color };
    setProjects([...projects, newProject]);
    return newProject;
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    setTodos(todos.filter(t => t.projectId !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(projects[0]);
    }
  };

  const addTodo = (text, projectId, priority = 'medium', estimatedPomodoros = 1, subtasks = []) => {
    const newTodo = { 
      id: Date.now(), 
      text, 
      completed: false, 
      projectId, 
      priority,
      estimatedPomodoros,
      completedPomodoros: 0,
      subtasks,
      createdAt: new Date().toISOString()
    };
    setTodos([newTodo, ...todos]);
  };

  const updateTodo = (todoId, updates) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, ...updates } : t));
  };

  const toggleTodo = (todoId) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (todoId) => {
    setTodos(todos.filter(t => t.id !== todoId));
  };

  const reorderTodos = (projectId, newOrder) => {
    const otherTodos = todos.filter(t => t.projectId !== projectId);
    setTodos([...newOrder, ...otherTodos]);
  };

  const checkBadges = () => {
    const stats = achievements;
    const newBadges = [];
    
    BADGES.forEach(badge => {
      if (!stats.unlockedBadges.includes(badge.id) && badge.condition(stats)) {
        newBadges.push(badge.id);
        // Show notification for new badge
        if (settings.notifications && 'Notification' in window) {
          new Notification('🎉 New Badge Unlocked!', {
            body: `${badge.icon} ${badge.name}: ${badge.description}`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    if (newBadges.length > 0) {
      setAchievements(prev => ({
        ...prev,
        unlockedBadges: [...prev.unlockedBadges, ...newBadges]
      }));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <AppContext.Provider value={{
      projects, setProjects, addProject, deleteProject,
      todos, setTodos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos,
      durations, setDurations,
      dailyStats, setDailyStats,
      goals, setGoals,
      achievements, setAchievements, updateStreak, checkBadges,
      settings, setSettings,
      currentTheme, setCurrentTheme,
      currentProject, setCurrentProject,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Navbar Component
function Navbar() {
  const { achievements, goals, dailyStats } = React.useContext(AppContext);
  const today = new Date().toISOString().split('T')[0];
  const todayStats = dailyStats[today] || { count: 0 };
  const progress = Math.min((todayStats.count / goals.daily) * 100, 100);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Clock size={24} />
        <span>Podomodro</span>
      </div>
      
      <div className="navbar-center">
        <div className="daily-progress-mini">
          <Target size={16} />
          <div className="progress-bar-mini">
            <div className="progress-fill-mini" style={{ width: `${progress}%` }} />
          </div>
          <span>{todayStats.count}/{goals.daily}</span>
        </div>
        {achievements.currentStreak > 0 && (
          <div className="streak-badge">
            <Flame size={16} />
            <span>{achievements.currentStreak}</span>
          </div>
        )}
      </div>

      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <Home size={18} />
          <span>Timer</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ListTodo size={18} />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Stats</span>
        </NavLink>
        <NavLink to="/achievements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} />
          <span>Badges</span>
        </NavLink>
      </div>
    </nav>
  );
}

// Sidebar Panel Component
function SidePanel({ isOpen, onClose, children, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="side-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="side-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="side-panel-header">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="side-panel-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Timer Page (Home)
function TimerPage() {
  const {
    projects, todos, durations, setDurations,
    dailyStats, setDailyStats,
    goals, setGoals, achievements, setAchievements, updateStreak, checkBadges,
    settings, setSettings,
    currentTheme, setCurrentTheme,
    currentProject, setCurrentProject
  } = React.useContext(AppContext);

  const [mode, setMode] = useState('FOCUS');
  const [timeLeft, setTimeLeft] = useState(durations.FOCUS * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSounds, setActiveSounds] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectPanelOpen, setIsProjectPanelOpen] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // New Feature States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundPresets, setSoundPresets] = useState(() => {
    const saved = localStorage.getItem('podomodro-sound-presets');
    return saved ? JSON.parse(saved) : DEFAULT_SOUND_PRESETS;
  });
  const [quickNote, setQuickNote] = useState('');
  const [quickNotes, setQuickNotes] = useState(() => {
    const saved = localStorage.getItem('podomodro-quick-notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [autoTheme, setAutoTheme] = useState(() => {
    const saved = localStorage.getItem('podomodro-auto-theme');
    return saved ? JSON.parse(saved) : false;
  });

  const soundInstances = useRef({});
  const alarmRef = useRef({});

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggleTimer();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            setTimeLeft(durations[mode] * 60);
            setIsActive(false);
          }
          break;
        case 'KeyS':
          setIsSettingsOpen(true);
          break;
        case 'KeyM':
          toggleMuteAll();
          break;
        case 'KeyF':
          setIsFocusMode(prev => !prev);
          break;
        case 'Escape':
          setIsSettingsOpen(false);
          setIsProjectPanelOpen(false);
          setShowNoteInput(false);
          setIsFocusMode(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, mode, durations]);

  // Toggle Mute All Sounds
  const toggleMuteAll = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    Object.keys(soundInstances.current).forEach(key => {
      if (soundInstances.current[key]) {
        soundInstances.current[key].mute(newMuted);
      }
    });
  };

  // Save Quick Notes to localStorage
  useEffect(() => {
    localStorage.setItem('podomodro-quick-notes', JSON.stringify(quickNotes));
  }, [quickNotes]);

  // Save Sound Presets to localStorage
  useEffect(() => {
    localStorage.setItem('podomodro-sound-presets', JSON.stringify(soundPresets));
  }, [soundPresets]);

  // Save Auto Theme setting
  useEffect(() => {
    localStorage.setItem('podomodro-auto-theme', JSON.stringify(autoTheme));
  }, [autoTheme]);

  // Auto Theme Timer
  useEffect(() => {
    if (!autoTheme) return;
    
    const checkTimeTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        setCurrentTheme('nature');
      } else if (hour >= 18 && hour < 21) {
        setCurrentTheme('sunset');
      } else {
        setCurrentTheme('space');
      }
    };
    
    checkTimeTheme();
    const interval = setInterval(checkTimeTheme, 60000);
    return () => clearInterval(interval);
  }, [autoTheme]);

  // Apply Sound Preset
  const applyPreset = (presetSounds) => {
    Object.keys(soundInstances.current).forEach(key => {
      if (soundInstances.current[key]) {
        soundInstances.current[key].stop();
      }
    });
    setActiveSounds({});
    
    presetSounds.forEach(soundId => {
      const sound = SOUNDS.find(s => s.id === soundId);
      if (sound) {
        const url = SOUND_BASE_URL + sound.filename;
        if (!soundInstances.current[soundId]) {
          soundInstances.current[soundId] = new Howl({ 
            src: [url], 
            loop: true, 
            volume: 0.5, 
            format: ['ogg'] 
          });
        }
        soundInstances.current[soundId].play();
        setActiveSounds(prev => ({ 
          ...prev, 
          [soundId]: { playing: true, volume: 0.5 } 
        }));
      }
    });
  };

  // Save Current Sounds as Preset
  const saveCurrentAsPreset = () => {
    const activeSoundIds = Object.keys(activeSounds).filter(id => activeSounds[id]?.playing || activeSounds[id] === true);
    if (activeSoundIds.length === 0) return;
    
    const name = prompt('Enter preset name:');
    if (name) {
      setSoundPresets(prev => [...prev, { 
        id: Date.now(), 
        name, 
        sounds: activeSoundIds 
      }]);
    }
  };

  // Add Quick Note
  const saveQuickNote = () => {
    if (quickNote.trim()) {
      setQuickNotes(prev => [...prev, {
        id: Date.now(),
        text: quickNote.trim(),
        timestamp: new Date().toISOString(),
        pomodoro: achievements.totalPomodoros + 1
      }]);
      setQuickNote('');
      setShowNoteInput(false);
    }
  };

  // Export Data
  const exportData = () => {
    const data = {
      dailyStats,
      achievements,
      projects,
      todos,
      settings,
      durations,
      goals,
      quickNotes,
      soundPresets,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podomodro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (window.confirm('This will overwrite your current data. Continue?')) {
          if (data.dailyStats) setDailyStats(data.dailyStats);
          if (data.achievements) setAchievements(data.achievements);
          if (data.durations) setDurations(data.durations);
          if (data.goals) setGoals(data.goals);
          if (data.settings) setSettings(data.settings);
          if (data.quickNotes) setQuickNotes(data.quickNotes);
          if (data.soundPresets) setSoundPresets(data.soundPresets);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid file format!');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    document.body.className = `theme-${currentTheme} ${isActive ? 'is-running' : ''} ${isFocusMode ? 'focus-mode' : ''}`;
  }, [currentTheme, isActive, isFocusMode]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(durations[mode] * 60);
    }
  }, [durations, mode, isActive]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = () => {
    // Play alarm sound
    const alarmSound = ALARM_SOUNDS.find(s => s.id === settings.alarmSound) || ALARM_SOUNDS[0];
    alarmRef.current = new Howl({ 
      src: [alarmSound.url], 
      volume: settings.alarmVolume 
    });
    alarmRef.current.play();
    
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, colors: ['#ffffff', '#ff3b3b'] });

    // Send browser notification
    if (settings.notifications && notificationPermission === 'granted') {
      const title = mode === 'FOCUS' ? '🎉 Focus session complete!' : '☕ Break is over!';
      const body = mode === 'FOCUS' ? 'Great work! Time for a break.' : 'Ready to focus again?';
      new Notification(title, { body, icon: '/favicon.ico' });
    }

    if (mode === 'FOCUS') {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();
      
      // Update daily stats
      setDailyStats(prev => {
        const newStats = { ...prev };
        if (!newStats[today]) newStats[today] = { count: 0, projects: {}, hours: {} };
        newStats[today].count += 1;
        newStats[today].projects[currentProject?.name || 'Unknown'] = (newStats[today].projects[currentProject?.name || 'Unknown'] || 0) + 1;
        newStats[today].hours[hour] = (newStats[today].hours[hour] || 0) + 1;
        return newStats;
      });

      // Update achievements
      setAchievements(prev => {
        const newAchievements = {
          ...prev,
          totalPomodoros: prev.totalPomodoros + 1,
          earlyBird: prev.earlyBird || hour < 8,
          nightOwl: prev.nightOwl || hour >= 22,
        };

        // Check if daily goal reached
        const todayCount = (dailyStats[today]?.count || 0) + 1;
        if (todayCount >= goals.daily && (dailyStats[today]?.count || 0) < goals.daily) {
          newAchievements.dailyGoalsReached = prev.dailyGoalsReached + 1;
        }

        return newAchievements;
      });

      updateStreak();
      setPomodoroCount(prev => prev + 1);

      // Auto start break
      if (settings.autoStartBreak) {
        const newPomodoroCount = pomodoroCount + 1;
        if (newPomodoroCount % settings.longBreakInterval === 0) {
          setMode('LONG');
          setTimeout(() => setIsActive(true), 2000);
        } else {
          setMode('SHORT');
          setTimeout(() => setIsActive(true), 2000);
        }
      }

      // Check for new badges
      setTimeout(checkBadges, 1000);
    } else {
      // Break finished, auto start focus if enabled
      if (settings.autoStartFocus) {
        setMode('FOCUS');
        setTimeout(() => setIsActive(true), 2000);
      }
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const today = new Date().toISOString().split('T')[0];
  const todayStats = dailyStats[today] || { count: 0 };
  const dailyProgress = Math.min((todayStats.count / goals.daily) * 100, 100);

  // Get recent tasks for current project
  const recentTasks = todos
    .filter(t => t.projectId === currentProject?.id && !t.completed)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className={`page-wrapper ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {currentTheme === 'rain' && (
        <div className="rain-container">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.1 + Math.random() * 0.4
              }}
            />
          ))}
        </div>
      )}
      <LayoutGroup>
        <motion.div
          className="premium-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
        >
          {/* Daily Goal Progress */}
          <div className="daily-goal-section">
            <div className="goal-header">
              <Target size={16} />
              <span>Daily Goal</span>
              <span className="goal-count">{todayStats.count}/{goals.daily}</span>
            </div>
            <div className="goal-progress-bar">
              <motion.div 
                className="goal-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div 
            className="project-selector"
            onClick={() => setIsProjectPanelOpen(true)}
          >
            <div className="project-badge" style={{ borderColor: currentProject?.color }}>
              <div className="project-dot" style={{ background: currentProject?.color }} />
              <span>{currentProject?.name || 'Select Project'}</span>
              <ChevronRight size={14} />
            </div>
          </div>

          <div className="mode-switcher">
            {Object.keys(durations).map((key) => (
              <motion.button
                key={key}
                className={`mode-btn ${mode === key ? 'active' : ''}`}
                onClick={() => { setMode(key); setIsActive(false); }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {key === 'FOCUS' ? 'Focus' : key === 'SHORT' ? 'Short' : 'Long'}
                {mode === key && (
                  <motion.div
                    layoutId="activeMode"
                    className="active-indicator"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 14, zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            className="timer-display"
            key={mode + timeLeft}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {formatTime(timeLeft)}
          </motion.div>

          {/* Pomodoro cycle indicator */}
          <div className="pomodoro-cycle">
            {[...Array(settings.longBreakInterval)].map((_, i) => (
              <div 
                key={i} 
                className={`cycle-dot ${i < (pomodoroCount % settings.longBreakInterval) ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div className="timer-controls">
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleMuteAll} title="Mute All (M)">
              {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
            </motion.button>
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setTimeLeft(durations[mode] * 60); setIsActive(false); }} title="Reset (R)">
              <RotateCcw size={18} />
            </motion.button>
            <motion.button
              className="play-pause-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimer}
              title="Start/Pause (Space)"
            >
              {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
            </motion.button>
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsFocusMode(!isFocusMode)} title="Focus Mode (F)">
              {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </motion.button>
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsSettingsOpen(true)} title="Settings (S)">
              <Settings size={18} />
            </motion.button>
          </div>

          {/* Sound Presets */}
          <div className="sound-presets">
            <span className="presets-label">Presets:</span>
            {soundPresets.map(preset => (
              <button 
                key={preset.id}
                className="preset-btn"
                onClick={() => applyPreset(preset.sounds)}
              >
                {preset.name}
              </button>
            ))}
            <button className="preset-btn save-preset" onClick={saveCurrentAsPreset} title="Save current as preset">
              <Plus size={14} />
            </button>
          </div>

          <div className="sound-list">
            {SOUNDS.map(sound => (
              <motion.div
                key={sound.id}
                className={`sound-item ${activeSounds[sound.id]?.playing || activeSounds[sound.id] === true ? 'active' : ''}`}
                onClick={() => {
                  const url = SOUND_BASE_URL + sound.filename;
                  const isPlaying = activeSounds[sound.id]?.playing || activeSounds[sound.id] === true;
                  if (isPlaying) {
                    soundInstances.current[sound.id].stop();
                    setActiveSounds(prev => ({ ...prev, [sound.id]: { playing: false, volume: 0.5 } }));
                  } else {
                    if (!soundInstances.current[sound.id]) {
                      soundInstances.current[sound.id] = new Howl({ src: [url], loop: true, volume: 0.5, format: ['ogg'] });
                    }
                    soundInstances.current[sound.id].play();
                    if (isMuted) soundInstances.current[sound.id].mute(true);
                    setActiveSounds(prev => ({ ...prev, [sound.id]: { playing: true, volume: 0.5 } }));
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sound.icon}
                <span>{sound.label}</span>
                {(activeSounds[sound.id]?.playing || activeSounds[sound.id] === true) && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={activeSounds[sound.id]?.volume || 0.5}
                    onChange={(e) => {
                      e.stopPropagation();
                      const vol = parseFloat(e.target.value);
                      soundInstances.current[sound.id]?.volume(vol);
                      setActiveSounds(prev => ({
                        ...prev,
                        [sound.id]: { ...prev[sound.id], volume: vol }
                      }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="sound-volume-slider"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Quick Note Button */}
          <motion.button 
            className="quick-note-btn"
            onClick={() => setShowNoteInput(!showNoteInput)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <StickyNote size={16} />
            Quick Note
          </motion.button>

          {showNoteInput && (
            <motion.div 
              className="quick-note-input"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                type="text"
                placeholder="Type a quick note..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveQuickNote()}
                autoFocus
              />
              <button onClick={saveQuickNote}><Check size={16} /></button>
            </motion.div>
          )}
        </motion.div>

        <div className="secondary-section">
          {mode !== 'FOCUS' && isActive && (
            <motion.div 
              className="mini-card break-widget"
              variants={containerVariants} 
              initial="hidden" 
              animate="visible"
            >
              <h3 className="section-title"><Activity size={18} /> Break Suggestions</h3>
              {BREAK_ACTIVITIES.slice(0, 3).map((activity, i) => (
                <div key={i} className="break-item">
                  <span className="break-icon">{activity.icon}</span>
                  <span>{activity.text}</span>
                  <span className="break-duration">{activity.duration}m</span>
                </div>
              ))}
            </motion.div>
          )}

          {recentTasks.length > 0 && (
            <motion.div className="mini-card" variants={containerVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <h3 className="section-title"><ListTodo size={18} /> Current Tasks</h3>
              <AnimatePresence>
                {recentTasks.map(todo => (
                  <motion.div
                    key={todo.id}
                    className="todo-item-minimal"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    layout
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`priority-indicator ${todo.priority}`} />
                      <span>{todo.text}</span>
                    </div>
                    <div className="pomodoro-estimate">
                      <Clock size={12} />
                      <span>{todo.completedPomodoros || 0}/{todo.estimatedPomodoros}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Streak Card */}
          <motion.div className="mini-card streak-card" variants={containerVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
            <div className="streak-content">
              <Flame size={32} className="streak-icon" />
              <div className="streak-info">
                <span className="streak-number">{achievements.currentStreak}</span>
                <span className="streak-label">Day Streak</span>
              </div>
              <div className="streak-best">
                <Trophy size={14} />
                <span>Best: {achievements.longestStreak}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </LayoutGroup>

      {/* Project Selection Side Panel */}
      <SidePanel 
        isOpen={isProjectPanelOpen} 
        onClose={() => setIsProjectPanelOpen(false)}
        title="Select Project"
      >
        <div className="project-list">
          {projects.map(project => (
            <motion.div
              key={project.id}
              className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentProject(project);
                setIsProjectPanelOpen(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="project-dot" style={{ background: project.color }} />
              <span>{project.name}</span>
              {currentProject?.id === project.id && <Check size={16} />}
            </motion.div>
          ))}
        </div>
      </SidePanel>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)}>
            <motion.div
              className="modal-content-minimal settings-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Settings</h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
              </div>

              {/* Timer Durations */}
              <div className="settings-section">
                <label className="settings-label">Timer Durations</label>
                <div className="duration-inputs">
                  <div className="duration-input">
                    <span>Focus</span>
                    <input
                      type="number" min="1" max="60"
                      value={durations.FOCUS}
                      onChange={(e) => setDurations({ ...durations, FOCUS: parseInt(e.target.value) || 25 })}
                    />
                    <span>min</span>
                  </div>
                  <div className="duration-input">
                    <span>Short</span>
                    <input
                      type="number" min="1" max="30"
                      value={durations.SHORT}
                      onChange={(e) => setDurations({ ...durations, SHORT: parseInt(e.target.value) || 5 })}
                    />
                    <span>min</span>
                  </div>
                  <div className="duration-input">
                    <span>Long</span>
                    <input
                      type="number" min="1" max="60"
                      value={durations.LONG}
                      onChange={(e) => setDurations({ ...durations, LONG: parseInt(e.target.value) || 15 })}
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="settings-section">
                <label className="settings-label">Daily Goal</label>
                <div className="goal-input">
                  <Target size={18} />
                  <input
                    type="number" min="1" max="20"
                    value={goals.daily}
                    onChange={(e) => setGoals({ ...goals, daily: parseInt(e.target.value) || 8 })}
                  />
                  <span>pomodoros per day</span>
                </div>
              </div>

              {/* Auto Start Options */}
              <div className="settings-section">
                <label className="settings-label">Automation</label>
                <div className="toggle-option">
                  <span>Auto-start break after focus</span>
                  <button 
                    className={`toggle-btn ${settings.autoStartBreak ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, autoStartBreak: !settings.autoStartBreak })}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
                <div className="toggle-option">
                  <span>Auto-start focus after break</span>
                  <button 
                    className={`toggle-btn ${settings.autoStartFocus ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, autoStartFocus: !settings.autoStartFocus })}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
                <div className="duration-input" style={{ marginTop: 12 }}>
                  <span>Long break after</span>
                  <input
                    type="number" min="2" max="8"
                    value={settings.longBreakInterval}
                    onChange={(e) => setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) || 4 })}
                  />
                  <span>pomodoros</span>
                </div>
              </div>

              {/* Notifications */}
              <div className="settings-section">
                <label className="settings-label">Notifications</label>
                <div className="toggle-option">
                  <span>Browser notifications</span>
                  {notificationPermission === 'granted' ? (
                    <button 
                      className={`toggle-btn ${settings.notifications ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    >
                      <div className="toggle-knob" />
                    </button>
                  ) : (
                    <button className="enable-btn" onClick={requestNotificationPermission}>
                      Enable
                    </button>
                  )}
                </div>
              </div>

              {/* Alarm Sound */}
              <div className="settings-section">
                <label className="settings-label">Alarm Sound</label>
                <div className="alarm-sounds">
                  {ALARM_SOUNDS.map(sound => (
                    <button
                      key={sound.id}
                      className={`alarm-option ${settings.alarmSound === sound.id ? 'active' : ''}`}
                      onClick={() => {
                        setSettings({ ...settings, alarmSound: sound.id });
                        new Howl({ src: [sound.url], volume: settings.alarmVolume }).play();
                      }}
                    >
                      <Volume2 size={14} />
                      {sound.label}
                    </button>
                  ))}
                </div>
                <div className="volume-slider">
                  <Volume2 size={16} />
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={settings.alarmVolume}
                    onChange={(e) => setSettings({ ...settings, alarmVolume: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              {/* Themes */}
              <div className="settings-section">
                <label className="settings-label">Themes</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {THEMES.map(t => (
                    <motion.div
                      key={t.id}
                      className={`theme-opt ${currentTheme === t.id ? 'active' : ''}`}
                      onClick={() => { setCurrentTheme(t.id); setAutoTheme(false); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {t.label}
                    </motion.div>
                  ))}
                </div>
                <div className="toggle-option" style={{ marginTop: 16 }}>
                  <span>Auto theme (by time of day)</span>
                  <button 
                    className={`toggle-btn ${autoTheme ? 'active' : ''}`}
                    onClick={() => setAutoTheme(!autoTheme)}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <label className="settings-label">Data Management</label>
                <div className="data-management-btns">
                  <button className="submit-btn secondary" onClick={exportData}>
                    <Download size={18} /> Export Data
                  </button>
                  <label className="submit-btn secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} /> Import Data
                    <input 
                      type="file" 
                      accept=".json" 
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files[0] && importData(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="settings-section keyboard-shortcuts-section">
                <label className="settings-label">Keyboard Shortcuts</label>
                <div className="shortcuts-list">
                  <div className="shortcut-item"><kbd>Space</kbd> Start/Pause</div>
                  <div className="shortcut-item"><kbd>R</kbd> Reset</div>
                  <div className="shortcut-item"><kbd>S</kbd> Settings</div>
                  <div className="shortcut-item"><kbd>M</kbd> Mute/Unmute</div>
                  <div className="shortcut-item"><kbd>F</kbd> Focus Mode</div>
                  <div className="shortcut-item"><kbd>Esc</kbd> Close</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tasks Page
function TasksPage() {
  const {
    projects, addProject, deleteProject,
    todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos
  } = React.useContext(AppContext);

  const [isAddProjectPanelOpen, setIsAddProjectPanelOpen] = useState(false);
  const [isAddTaskPanelOpen, setIsAddTaskPanelOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ff3b3b');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
  const [newSubtasks, setNewSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [expandedTask, setExpandedTask] = useState(null);

  const colors = ['#ff3b3b', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor);
      setNewProjectName('');
      setNewProjectColor('#ff3b3b');
      setIsAddProjectPanelOpen(false);
    }
  };

  const handleAddTask = () => {
    if (newTaskText.trim() && selectedProject) {
      addTodo(newTaskText.trim(), selectedProject.id, newTaskPriority, newTaskPomodoros, newSubtasks);
      setNewTaskText('');
      setNewTaskPriority('medium');
      setNewTaskPomodoros(1);
      setNewSubtasks([]);
      setIsAddTaskPanelOpen(false);
    }
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setNewSubtasks([...newSubtasks, { id: Date.now(), text: subtaskInput.trim(), completed: false }]);
      setSubtaskInput('');
    }
  };

  const toggleSubtask = (todoId, subtaskId) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      const updatedSubtasks = todo.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      updateTodo(todoId, { subtasks: updatedSubtasks });
    }
  };

  const openAddTaskPanel = (project) => {
    setSelectedProject(project);
    setIsAddTaskPanelOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="tasks-page">
      <motion.div 
        className="tasks-header"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1>Projects & Tasks</h1>
        <motion.button
          className="add-project-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddProjectPanelOpen(true)}
        >
          <FolderPlus size={18} />
          <span>New Project</span>
        </motion.button>
      </motion.div>

      <div className="projects-grid">
        {projects.map((project, index) => {
          const projectTodos = todos.filter(t => t.projectId === project.id);
          const sortedTodos = [...projectTodos].sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
          const completedCount = projectTodos.filter(t => t.completed).length;

          return (
            <motion.div
              key={project.id}
              className="project-card"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              <div className="project-card-header">
                <div className="project-card-title">
                  <div className="project-dot large" style={{ background: project.color }} />
                  <h3>{project.name}</h3>
                </div>
                <div className="project-card-actions">
                  <motion.button
                    className="icon-btn small"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openAddTaskPanel(project)}
                  >
                    <Plus size={16} />
                  </motion.button>
                  {projects.length > 1 && (
                    <motion.button
                      className="icon-btn small danger"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="project-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: projectTodos.length > 0 ? `${(completedCount / projectTodos.length) * 100}%` : '0%',
                      background: project.color 
                    }}
                  />
                </div>
                <span className="progress-text">{completedCount}/{projectTodos.length}</span>
              </div>

              <div className="project-tasks">
                <AnimatePresence>
                  {sortedTodos.map(todo => (
                    <motion.div
                      key={todo.id}
                      className={`task-item ${expandedTask === todo.id ? 'expanded' : ''}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      layout
                    >
                      <div className="task-main">
                        <div 
                          className={`task-checkbox ${todo.completed ? 'checked' : ''}`}
                          style={{ borderColor: project.color, background: todo.completed ? project.color : 'transparent' }}
                          onClick={() => toggleTodo(todo.id)}
                        >
                          {todo.completed && <Check size={12} />}
                        </div>
                        <div className={`priority-indicator ${todo.priority}`} title={todo.priority} />
                        <span className={todo.completed ? 'completed' : ''}>{todo.text}</span>
                        <div className="task-meta">
                          <div className="pomodoro-badge">
                            <Clock size={12} />
                            <span>{todo.completedPomodoros || 0}/{todo.estimatedPomodoros}</span>
                          </div>
                          {todo.subtasks?.length > 0 && (
                            <button 
                              className="expand-btn"
                              onClick={() => setExpandedTask(expandedTask === todo.id ? null : todo.id)}
                            >
                              {expandedTask === todo.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          <motion.button
                            className="task-delete"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteTodo(todo.id)}
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Subtasks */}
                      {expandedTask === todo.id && todo.subtasks?.length > 0 && (
                        <motion.div 
                          className="subtasks-list"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {todo.subtasks.map(subtask => (
                            <div key={subtask.id} className="subtask-item">
                              <div 
                                className={`subtask-checkbox ${subtask.completed ? 'checked' : ''}`}
                                onClick={() => toggleSubtask(todo.id, subtask.id)}
                              >
                                {subtask.completed && <Check size={10} />}
                              </div>
                              <span className={subtask.completed ? 'completed' : ''}>{subtask.text}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {projectTodos.length === 0 && (
                  <div className="no-tasks">
                    <ListTodo size={24} />
                    <p>No tasks yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Project Side Panel */}
      <SidePanel
        isOpen={isAddProjectPanelOpen}
        onClose={() => setIsAddProjectPanelOpen(false)}
        title="New Project"
      >
        <div className="form-group">
          <label>Project Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {colors.map(color => (
              <div
                key={color}
                className={`color-option ${newProjectColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => setNewProjectColor(color)}
              />
            ))}
          </div>
        </div>

        <motion.button
          className="submit-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddProject}
        >
          <FolderPlus size={18} />
          Create Project
        </motion.button>
      </SidePanel>

      {/* Add Task Side Panel */}
      <SidePanel
        isOpen={isAddTaskPanelOpen}
        onClose={() => { setIsAddTaskPanelOpen(false); setNewSubtasks([]); }}
        title={`Add Task to ${selectedProject?.name || ''}`}
      >
        <div className="form-group">
          <label>Task Description</label>
          <input
            type="text"
            className="form-input"
            placeholder="What needs to be done?"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <div className="priority-selector">
            {PRIORITIES.map(p => (
              <button
                key={p.id}
                className={`priority-option ${newTaskPriority === p.id ? 'active' : ''}`}
                style={{ '--priority-color': p.color }}
                onClick={() => setNewTaskPriority(p.id)}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Estimated Pomodoros</label>
          <div className="pomodoro-selector">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`pomodoro-option ${newTaskPomodoros === n ? 'active' : ''}`}
                onClick={() => setNewTaskPomodoros(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Subtasks</label>
          <div className="subtask-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="Add a subtask..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            />
            <button className="add-subtask-btn" onClick={addSubtask}>
              <Plus size={16} />
            </button>
          </div>
          {newSubtasks.length > 0 && (
            <div className="subtask-preview">
              {newSubtasks.map((st, i) => (
                <div key={st.id} className="subtask-preview-item">
                  <Circle size={12} />
                  <span>{st.text}</span>
                  <button onClick={() => setNewSubtasks(newSubtasks.filter((_, idx) => idx !== i))}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <motion.button
          className="submit-btn"
          style={{ background: selectedProject?.color }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddTask}
        >
          <Plus size={18} />
          Add Task
        </motion.button>
      </SidePanel>
    </div>
  );
}

// Stats Page
function StatsPage() {
  const { dailyStats, projects, goals } = React.useContext(AppContext);
  const [viewMode, setViewMode] = useState('week');

  const today = new Date();
  const getDateRange = () => {
    if (viewMode === 'week') {
      return [...Array(7)].map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
    } else {
      return [...Array(30)].map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });
    }
  };

  const dateRange = getDateRange();
  
  const chartData = dateRange.map(date => ({
    name: new Date(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' }),
    count: dailyStats[date]?.count || 0,
    goal: goals.daily
  }));

  // Calculate totals
  const totalPomodoros = dateRange.reduce((sum, date) => sum + (dailyStats[date]?.count || 0), 0);
  const avgPerDay = (totalPomodoros / dateRange.length).toFixed(1);
  const daysWithGoalMet = dateRange.filter(date => (dailyStats[date]?.count || 0) >= goals.daily).length;

  // Project breakdown
  const projectData = {};
  dateRange.forEach(date => {
    const dayProjects = dailyStats[date]?.projects || {};
    Object.entries(dayProjects).forEach(([name, count]) => {
      projectData[name] = (projectData[name] || 0) + count;
    });
  });

  const pieData = Object.entries(projectData).map(([name, value]) => {
    const project = projects.find(p => p.name === name);
    return { name, value, color: project?.color || '#888' };
  });

  // Most productive hours
  const hourData = {};
  Object.values(dailyStats).forEach(day => {
    if (day.hours) {
      Object.entries(day.hours).forEach(([hour, count]) => {
        hourData[hour] = (hourData[hour] || 0) + count;
      });
    }
  });

  const hourChartData = [...Array(24)].map((_, i) => ({
    hour: i,
    label: `${i}:00`,
    count: hourData[i] || 0
  }));

  const mostProductiveHour = Object.entries(hourData).sort((a, b) => b[1] - a[1])[0];

  // Heatmap data (last 12 weeks)
  const heatmapData = [];
  for (let week = 11; week >= 0; week--) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + (6 - day)));
      const dateStr = date.toISOString().split('T')[0];
      weekData.push({
        date: dateStr,
        count: dailyStats[dateStr]?.count || 0
      });
    }
    heatmapData.push(weekData);
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="stats-page">
      <motion.div 
        className="stats-header"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1>Statistics</h1>
        <div className="view-toggle">
          <button 
            className={viewMode === 'week' ? 'active' : ''} 
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={viewMode === 'month' ? 'active' : ''} 
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        className="stats-summary"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon"><Zap size={24} /></div>
          <div className="stat-value">{totalPomodoros}</div>
          <div className="stat-label">Total Pomodoros</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-value">{avgPerDay}</div>
          <div className="stat-label">Avg per Day</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Target size={24} /></div>
          <div className="stat-value">{daysWithGoalMet}</div>
          <div className="stat-label">Goals Met</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-value">{mostProductiveHour ? `${mostProductiveHour[0]}:00` : '-'}</div>
          <div className="stat-label">Peak Hour</div>
        </div>
      </motion.div>

      {/* Main Chart */}
      <motion.div 
        className="chart-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <h3>Daily Progress</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#ff3b3b" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="goal" stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="stats-grid">
        {/* Project Breakdown */}
        <motion.div 
          className="chart-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <h3>By Project</h3>
          {pieData.length > 0 ? (
            <>
              <div className="chart-container pie-chart">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend">
                {pieData.map((item, i) => (
                  <div key={i} className="legend-item">
                    <div className="legend-color" style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-data">No data yet</div>
          )}
        </motion.div>

        {/* Productive Hours */}
        <motion.div 
          className="chart-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <h3>Productive Hours</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourChartData}>
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  tickFormatter={(v) => v % 4 === 0 ? `${v}h` : ''}
                />
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelFormatter={(v) => `${v}:00`}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div 
        className="chart-card heatmap-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <h3>Activity Heatmap</h3>
        <div className="heatmap-container">
          <div className="heatmap-labels">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="heatmap">
            {heatmapData.map((week, wi) => (
              <div key={wi} className="heatmap-week">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="heatmap-day"
                    style={{
                      background: day.count === 0 
                        ? 'rgba(255,255,255,0.05)' 
                        : `rgba(255, 59, 59, ${Math.min(day.count / goals.daily, 1) * 0.8 + 0.2})`
                    }}
                    title={`${day.date}: ${day.count} pomodoros`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="heatmap-scale">
              {[0.1, 0.3, 0.5, 0.7, 1].map((opacity, i) => (
                <div key={i} style={{ background: `rgba(255, 59, 59, ${opacity})` }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Achievements Page
function AchievementsPage() {
  const { achievements } = React.useContext(AppContext);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="achievements-page">
      <motion.div 
        className="achievements-header"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1>Achievements</h1>
        <div className="achievement-stats">
          <div className="achievement-stat">
            <Trophy size={20} />
            <span>{achievements.unlockedBadges.length}/{BADGES.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="achievement-overview"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="overview-card">
          <Zap size={28} />
          <div className="overview-value">{achievements.totalPomodoros}</div>
          <div className="overview-label">Total Pomodoros</div>
        </div>
        <div className="overview-card">
          <Flame size={28} />
          <div className="overview-value">{achievements.currentStreak}</div>
          <div className="overview-label">Current Streak</div>
        </div>
        <div className="overview-card">
          <Award size={28} />
          <div className="overview-value">{achievements.longestStreak}</div>
          <div className="overview-label">Best Streak</div>
        </div>
        <div className="overview-card">
          <Target size={28} />
          <div className="overview-value">{achievements.dailyGoalsReached}</div>
          <div className="overview-label">Goals Reached</div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <div className="badges-grid">
        {BADGES.map((badge, index) => {
          const isUnlocked = achievements.unlockedBadges.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
            >
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-description">{badge.description}</div>
              {!isUnlocked && <div className="badge-lock"><Star size={16} /></div>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<TimerPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
