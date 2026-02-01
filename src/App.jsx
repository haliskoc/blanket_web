import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2, PieChart, BarChart2,
  Tag, Clock, Calendar, CloudRain, TreePine,
  Coffee, Wind, Moon, Sun, Library, Image as ImageIcon
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts';
import confetti from 'canvas-confetti';
import './App.css';

const SOUND_BASE_URL = 'https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/';

const SOUNDS = [
  { id: 'rain', label: 'Rain', filename: 'rain.ogg', icon: <CloudRain size={20} /> },
  { id: 'storm', label: 'Storm', filename: 'storm.ogg', icon: <Wind size={20} /> },
  { id: 'wind', label: 'Wind', filename: 'wind.ogg', icon: <Wind size={20} /> },
  { id: 'waves', label: 'Waves', filename: 'waves.ogg', icon: <ImageIcon size={20} /> },
  { id: 'stream', label: 'Stream', filename: 'stream.ogg', icon: <ImageIcon size={20} /> },
  { id: 'birds', label: 'Birds', filename: 'birds.ogg', icon: <TreePine size={20} /> },
  { id: 'fireplace', label: 'Fire', filename: 'fireplace.ogg', icon: <Sun size={20} /> },
  { id: 'coffee-shop', label: 'Cafe', filename: 'coffee-shop.ogg', icon: <Coffee size={20} /> },
  { id: 'city', label: 'City', filename: 'city.ogg', icon: <ImageIcon size={20} /> },
  { id: 'train', label: 'Train', filename: 'train.ogg', icon: <ImageIcon size={20} /> },
  { id: 'library', label: 'Library', filename: 'white-noise.ogg', icon: <Library size={20} /> },
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

const PROJECTS = ['Deep Focus', 'Coding', 'Design', 'Reading', 'Study'];

function App() {
  const [mode, setMode] = useState('FOCUS');
  const [durations, setDurations] = useState(() => {
    const saved = localStorage.getItem('podomodro-durations');
    return saved ? JSON.parse(saved) : { FOCUS: 25, SHORT: 5, LONG: 15 };
  });
  const [timeLeft, setTimeLeft] = useState(durations.FOCUS * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSounds, setActiveSounds] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentProject, setCurrentProject] = useState('Deep Focus');

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('podomodro-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [todoInput, setTodoInput] = useState('');

  const [dailyStats, setDailyStats] = useState(() => {
    const saved = localStorage.getItem('podomodro-stats');
    return saved ? JSON.parse(saved) : {};
  });

  const soundInstances = useRef({});

  const [rainDrops] = useState(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.6 + Math.random() * 0.4}s`
    }))
  );

  useEffect(() => {
    localStorage.setItem('podomodro-durations', JSON.stringify(durations));
    localStorage.setItem('podomodro-todos', JSON.stringify(todos));
    localStorage.setItem('podomodro-stats', JSON.stringify(dailyStats));
  }, [durations, todos, dailyStats]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

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
    new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'] }).play();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ff4d4d', '#ffffff'] });

    if (mode === 'FOCUS') {
      const today = new Date().toISOString().split('T')[0];
      setDailyStats(prev => {
        const newStats = { ...prev };
        if (!newStats[today]) newStats[today] = { count: 0, projects: {} };
        newStats[today].count += 1;
        newStats[today].projects[currentProject] = (newStats[today].projects[currentProject] || 0) + 1;
        return newStats;
      });
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(durations[mode] * 60);
  }, [mode, durations]);

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(durations[newMode] * 60);
  };

  const toggleSound = (soundId, filename) => {
    const url = SOUND_BASE_URL + filename;
    if (activeSounds[soundId]) {
      soundInstances.current[soundId].stop();
      setActiveSounds(prev => ({ ...prev, [soundId]: false }));
    } else {
      if (!soundInstances.current[soundId]) {
        soundInstances.current[soundId] = new Howl({ src: [url], loop: true, volume: 0.5, format: ['ogg'] });
      }
      soundInstances.current[soundId].play();
      setActiveSounds(prev => ({ ...prev, [soundId]: true }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statsData = Object.entries(dailyStats).slice(-7).map(([date, data]) => ({
    name: date.split('-')[2],
    count: data.count,
  }));

  return (
    <div className="app-wrapper">
      <div className="rain-overlay">
        {rainDrops.map(drop => (
          <div key={drop.id} className="drop" style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }} />
        ))}
      </div>

      <motion.div
        className="premium-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Tag size={16} color="#94a3b8" />
          <select
            className="project-select"
            value={currentProject}
            onChange={(e) => setCurrentProject(e.target.value)}
          >
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ width: 16 }} />
        </div>

        <div className="mode-switcher">
          {Object.keys(durations).map((key) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => changeMode(key)}
            >
              {key === 'FOCUS' ? 'Focus' : key === 'SHORT' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>

        <motion.div
          className="timer-display"
          animate={{ scale: isActive ? 1.02 : 1 }}
        >
          {formatTime(timeLeft)}
        </motion.div>

        <div className="timer-controls">
          <button className="icon-btn" onClick={resetTimer}><RotateCcw size={20} /></button>
          <button className="play-pause-btn" onClick={toggleTimer}>
            {isActive ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" style={{ marginLeft: 4 }} />}
          </button>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}><Settings size={20} /></button>
        </div>

        <div className="sound-list">
          {SOUNDS.map(sound => (
            <div key={sound.id} className={`sound-item ${activeSounds[sound.id] ? 'active' : ''}`} onClick={() => toggleSound(sound.id, sound.filename)}>
              {sound.icon}
              <span>{sound.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="secondary-section">
        <motion.div className="mini-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 className="section-title"><Check size={18} /> Tasks</h3>
          <div className="todo-input-group">
            <input
              className="todo-input"
              placeholder="What needs to be done?"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && todoInput.trim()) {
                  setTodos([{ id: Date.now(), text: todoInput, completed: false, project: currentProject }, ...todos]);
                  setTodoInput('');
                }
              }}
            />
          </div>
          <div className="todo-list">
            {todos.slice(0, 3).map(todo => (
              <div key={todo.id} className="todo-item-minimal">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`todo-check-btn ${todo.completed ? 'checked' : ''}`} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))} />
                  <span style={{ opacity: todo.completed ? 0.4 : 1, textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.text}</span>
                </div>
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="mini-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="section-title"><BarChart2 size={18} /> Performance</h3>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <Bar dataKey="count" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: '10px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)}>
            <motion.div className="modal-content-minimal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <h2>Settings</h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 30 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 15, textTransform: 'uppercase' }}>Focus Duration</p>
                <input
                  type="range" min="1" max="60"
                  value={durations.FOCUS}
                  onChange={(e) => setDurations({ ...durations, FOCUS: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <div style={{ textAlign: 'right', marginTop: 5 }}>{durations.FOCUS}m</div>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 15, textTransform: 'uppercase' }}>Themes</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {THEMES.map(t => (
                  <div
                    key={t.id}
                    className={`theme-opt ${currentTheme === t.id ? 'active' : ''}`}
                    onClick={() => setCurrentTheme(t.id)}
                    style={{ padding: '10px', fontSize: '0.7rem', border: '1px solid var(--card-border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              <button
                style={{ width: '100%', padding: '15px', marginTop: '30px', borderRadius: '15px', border: 'none', background: 'white', color: 'black', fontWeight: '600' }}
                onClick={() => setIsSettingsOpen(false)}
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
