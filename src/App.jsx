import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2, Tag, CloudRain, TreePine,
  Coffee, Wind, Sun, Library, Image as ImageIcon,
  Zap, BarChart3, ListTodo
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip
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

  useEffect(() => {
    localStorage.setItem('podomodro-durations', JSON.stringify(durations));
    localStorage.setItem('podomodro-todos', JSON.stringify(todos));
    localStorage.setItem('podomodro-stats', JSON.stringify(dailyStats));
  }, [durations, todos, dailyStats]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme} ${isActive ? 'is-running' : ''}`;
  }, [currentTheme, isActive]);

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
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, colors: ['#ffffff', '#ff3b3b'] });

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statsData = Object.entries(dailyStats).slice(-7).map(([date, data]) => ({
    name: date.split('-')[2],
    count: data.count,
  }));

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="app-wrapper">
      <LayoutGroup>
        <motion.div
          className="premium-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, opacity: 0.5 }}>
            <motion.div layout className="project-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              <Zap size={14} />
              <select
                className="project-select"
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                style={{ border: 'none', background: 'none', color: 'inherit', padding: 0, cursor: 'pointer' }}
              >
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </motion.div>
          </div>

          <div className="mode-switcher">
            {Object.keys(durations).map((key) => (
              <motion.button
                key={key}
                className={`mode-btn ${mode === key ? 'active' : ''}`}
                onClick={() => setMode(key)}
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

          <div className="timer-controls">
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setTimeLeft(durations[mode] * 60)}>
              <RotateCcw size={18} />
            </motion.button>
            <motion.button
              className="play-pause-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimer}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
            </motion.button>
            <motion.button className="icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
            </motion.button>
          </div>

          <div className="sound-list">
            {SOUNDS.map(sound => (
              <motion.div
                key={sound.id}
                className={`sound-item ${activeSounds[sound.id] ? 'active' : ''}`}
                onClick={() => {
                  const url = SOUND_BASE_URL + sound.filename;
                  if (activeSounds[sound.id]) {
                    soundInstances.current[sound.id].stop();
                    setActiveSounds(prev => ({ ...prev, [sound.id]: false }));
                  } else {
                    if (!soundInstances.current[sound.id]) {
                      soundInstances.current[sound.id] = new Howl({ src: [url], loop: true, volume: 0.5, format: ['ogg'] });
                    }
                    soundInstances.current[sound.id].play();
                    setActiveSounds(prev => ({ ...prev, [sound.id]: true }));
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sound.icon}
                <span>{sound.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="secondary-section">
          <motion.div className="mini-card" variants={containerVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <h3 className="section-title"><ListTodo size={18} /> Tasks</h3>
            <div className="todo-input-group">
              <input
                className="todo-input"
                placeholder="What's next?"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && todoInput.trim()) {
                    setTodos([{ id: Date.now(), text: todoInput, completed: false }, ...todos]);
                    setTodoInput('');
                  }
                }}
              />
            </div>
            <AnimatePresence>
              {todos.slice(0, 3).map(todo => (
                <motion.div
                  key={todo.id}
                  className="todo-item-minimal"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  layout
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`todo-check-btn ${todo.completed ? 'checked' : ''}`} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))} />
                    <span style={{ opacity: todo.completed ? 0.3 : 0.8, textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.text}</span>
                  </div>
                  <button className="icon-btn" style={{ width: 24, height: 24, padding: 0, border: 'none' }} onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}><Trash2 size={12} /></button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <motion.div className="mini-card" variants={containerVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <h3 className="section-title"><BarChart3 size={18} /> Stats</h3>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <Bar dataKey="count" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ display: 'none' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)}>
            <motion.div
              className="modal-content-minimal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Settings</h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 40 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timer Duration</label>
                <input
                  type="range" min="1" max="60"
                  value={durations.FOCUS}
                  onChange={(e) => setDurations({ ...durations, FOCUS: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#fff' }}
                />
                <div style={{ textAlign: 'center', marginTop: 15, fontSize: '1.2rem', fontWeight: 600 }}>{durations.FOCUS} minutes</div>
              </div>

              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Themes</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {THEMES.map(t => (
                  <motion.div
                    key={t.id}
                    className={`theme-opt ${currentTheme === t.id ? 'active' : ''}`}
                    onClick={() => setCurrentTheme(t.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ padding: '15px 10px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    {t.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
