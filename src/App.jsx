import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2, PieChart, BarChart2,
  Tag, Clock, Calendar
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import confetti from 'canvas-confetti';
import './App.css';

const SOUND_BASE_URL = 'https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/';

const SOUNDS = [
  { id: 'rain', label: 'Rain', filename: 'rain.ogg' },
  { id: 'storm', label: 'Storm', filename: 'storm.ogg' },
  { id: 'wind', label: 'Wind', filename: 'wind.ogg' },
  { id: 'waves', label: 'Waves', filename: 'waves.ogg' },
  { id: 'stream', label: 'Stream', filename: 'stream.ogg' },
  { id: 'birds', label: 'Birds', filename: 'birds.ogg' },
  { id: 'summer-night', label: 'Night', filename: 'summer-night.ogg' },
  { id: 'fireplace', label: 'Fire', filename: 'fireplace.ogg' },
  { id: 'coffee-shop', label: 'Cafe', filename: 'coffee-shop.ogg' },
  { id: 'city', label: 'City', filename: 'city.ogg' },
  { id: 'train', label: 'Train', filename: 'train.ogg' },
  { id: 'boat', label: 'Boat', filename: 'boat.ogg' },
  { id: 'white-noise', label: 'White', filename: 'white-noise.ogg' },
  { id: 'pink-noise', label: 'Pink', filename: 'pink-noise.ogg' },
];

const THEMES = [
  { id: 'default', label: 'Zen Dark' },
  { id: 'nature', label: 'Forest' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'sea', label: 'Ocean' },
  { id: 'city', label: 'Night City' },
  { id: 'space', label: 'Starry Sky' },
  { id: 'cozy', label: 'Cozy Room' },
  { id: 'rain', label: 'Rainy Day' },
  { id: 'coffee', label: 'Coffee Shop' },
  { id: 'library', label: 'Library' },
  { id: 'desert', label: 'Desert' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'cyberpunk', label: 'Neon' },
];

const PROJECTS = ['Deep Focus', 'Coding', 'Design', 'Reading', 'Writing', 'Study'];

function App() {
  const [mode, setMode] = useState('FOCUS');
  const [durations, setDurations] = useState(() => {
    const saved = localStorage.getItem('podomodro-durations');
    return saved ? JSON.parse(saved) : { FOCUS: 25, SHORT: 5, LONG: 15 };
  });
  const [timeLeft, setTimeLeft] = useState(durations.FOCUS * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSounds, setActiveSounds] = useState({});
  const [soundVolumes, setSoundVolumes] = useState(
    SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: 0.5 }), {})
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentProject, setCurrentProject] = useState('Deep Focus');

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('podomodro-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [todoInput, setTodoInput] = useState('');

  // Stats State
  const [dailyStats, setDailyStats] = useState(() => {
    const saved = localStorage.getItem('podomodro-stats');
    return saved ? JSON.parse(saved) : {};
  });

  const soundInstances = useRef({});

  // Rain Effect Drops
  const [rainDrops] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.5 + Math.random() * 0.5}s`
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

  // Timer logic
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
    // Play sound
    new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'] }).play();

    // Confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#a1a1a1', '#525252']
    });

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
        soundInstances.current[soundId] = new Howl({
          src: [url],
          loop: true,
          volume: soundVolumes[soundId],
          format: ['ogg']
        });
      }
      soundInstances.current[soundId].play();
      setActiveSounds(prev => ({ ...prev, [soundId]: true }));
    }
  };

  const updateVolume = (soundId, volume) => {
    setSoundVolumes(prev => ({ ...prev, [soundId]: volume }));
    if (soundInstances.current[soundId]) {
      soundInstances.current[soundId].volume(volume);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats Data Prep
  const statsData = Object.entries(dailyStats).slice(-7).map(([date, data]) => ({
    name: date.split('-').slice(1).join('/'),
    count: data.count,
  }));

  const currentProjectData = dailyStats[new Date().toISOString().split('T')[0]]?.projects || {};
  const projectChartData = Object.entries(currentProjectData).map(([name, value]) => ({ name, value }));

  return (
    <div className="app-wrapper">
      <div className="rain-overlay">
        {rainDrops.map(drop => (
          <div
            key={drop.id}
            className="drop"
            style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
          />
        ))}
      </div>

      <section className="timer-section glass-section">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} style={{ color: '#fff' }}>Podomodro</motion.h1>

        <div className="mode-switcher">
          {Object.keys(durations).map((key) => (
            <button key={key} className={`mode-btn ${mode === key ? 'active' : ''}`} onClick={() => changeMode(key)}>
              {key === 'FOCUS' ? 'Focus' : key === 'SHORT' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 24, opacity: 0.6 }}>
          <select
            className="project-select"
            value={currentProject}
            onChange={(e) => setCurrentProject(e.target.value)}
          >
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <motion.div
          className="timer-display"
          animate={{ scale: isActive ? 1.05 : 1 }}
        >
          {formatTime(timeLeft)}
        </motion.div>

        <div className="timer-controls">
          <button className="icon-btn" onClick={resetTimer}><RotateCcw size={24} /></button>
          <button className="play-pause-btn" onClick={toggleTimer}>
            {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
          </button>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}><Settings size={24} /></button>
        </div>
      </section>

      <section className="secondary-grid">
        <div className="mixer-column glass-section">
          <h3 className="grid-title" style={{ color: '#fff', opacity: 0.8 }}>Atmosfera</h3>
          <div className="sound-list">
            {SOUNDS.map(sound => (
              <div key={sound.id} className={`sound-item ${activeSounds[sound.id] ? 'active' : ''}`}>
                <div className="sound-header" onClick={() => toggleSound(sound.id, sound.filename)}>
                  <span>{sound.label}</span>
                </div>
                {activeSounds[sound.id] && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <input
                      type="range" min="0" max="1" step="0.01"
                      className="volume-slider"
                      value={soundVolumes[sound.id]}
                      onChange={(e) => updateVolume(sound.id, parseFloat(e.target.value))}
                    />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="todo-column glass-section">
          <h3 className="grid-title" style={{ color: '#fff', opacity: 0.8 }}>Tasks</h3>
          <div className="todo-container">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (todoInput.trim()) {
                setTodos([{ id: Date.now(), text: todoInput, completed: false, project: currentProject }, ...todos]);
                setTodoInput('');
              }
            }} className="todo-add-group">
              <input
                className="todo-input"
                placeholder="Next goal..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
              />
              <button type="submit" className="icon-btn"><Plus size={20} /></button>
            </form>
            <div className="todo-list-minimal">
              <AnimatePresence initial={false}>
                {todos.map(todo => (
                  <motion.div key={todo.id} className={`todo-item-minimal ${todo.completed ? 'completed' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`todo-check-btn ${todo.completed ? 'checked' : ''}`} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))}>
                        {todo.completed && <Check size={12} color="black" />}
                      </div>
                      <span>{todo.text}</span>
                      <span className="project-tag">{todo.project}</span>
                    </div>
                    <button className="icon-btn" onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}><Trash2 size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-panel glass-section">
        <h3 className="grid-title" style={{ color: '#fff', opacity: 0.8 }}>Insights</h3>
        <div className="analytics-grid">
          <div className="stat-card">
            <span className="settings-label">Last 7 Days (Sessions)</span>
            <div style={{ height: 200, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <XAxis dataKey="name" hide />
                  <Tooltip
                    contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#ededed' }}
                  />
                  <Bar dataKey="count" fill="var(--text-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="stat-card">
            <span className="settings-label">Today by Project</span>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PROJECTS.map(p => {
                const count = currentProjectData[p] || 0;
                const max = Math.max(...Object.values(currentProjectData), 1);
                return (
                  <div key={p} style={{ fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{p}</span>
                      <span>{count} sessions</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        style={{ height: '100%', background: 'var(--text-primary)', borderRadius: 2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)}>
            <motion.div className="modal-content-minimal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Settings</h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={24} /></button>
              </div>

              <div className="settings-group">
                <span className="settings-label">Durations (min)</span>
                <div className="duration-inputs">
                  {Object.keys(durations).map(k => (
                    <div key={k} className="duration-field">
                      <label>{k}</label>
                      <input type="number" value={durations[k]} onChange={(e) => setDurations({ ...durations, [k]: parseInt(e.target.value) || 0 })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-label">Atmosphere</span>
                <div className="theme-grid">
                  {THEMES.map(theme => (
                    <div key={theme.id} className={`theme-opt ${currentTheme === theme.id ? 'active' : ''}`} onClick={() => setCurrentTheme(theme.id)}>{theme.label}</div>
                  ))}
                </div>
              </div>

              <button className="close-btn" style={{ width: '100%', padding: 16, background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: 12, fontWeight: 600, border: 'none' }} onClick={() => setIsSettingsOpen(false)}>Save</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
