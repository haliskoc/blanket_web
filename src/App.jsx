import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('podomodro-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [todoInput, setTodoInput] = useState('');

  const soundInstances = useRef({});

  // Sync settings and todos
  useEffect(() => {
    localStorage.setItem('podomodro-durations', JSON.stringify(durations));
    localStorage.setItem('podomodro-todos', JSON.stringify(todos));
  }, [durations, todos]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Update timeLeft when durations or mode change
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
      new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'] }).play();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

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

  const updateDuration = (m, value) => {
    const newVal = parseInt(value) || 0;
    setDurations(prev => ({ ...prev, [m]: newVal }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const addTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    setTodos([{ id: Date.now(), text: todoInput, completed: false }, ...todos]);
    setTodoInput('');
  };

  return (
    <div className="app-wrapper">
      <section className="timer-section">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 0.5, y: 0 }}
        >
          Podomodro
        </motion.h1>

        <div className="mode-switcher">
          {Object.keys(durations).map((key) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => changeMode(key)}
            >
              {key === 'FOCUS' ? 'Focus' : key === 'SHORT' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        <motion.div
          className="timer-display"
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {formatTime(timeLeft)}
        </motion.div>

        <div className="timer-controls">
          <button className="icon-btn" onClick={resetTimer}>
            <RotateCcw size={24} />
          </button>
          <button className="play-pause-btn" onClick={toggleTimer}>
            {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
          </button>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={24} />
          </button>
        </div>
      </section>

      <section className="secondary-grid">
        <div className="mixer-column">
          <h3 className="grid-title">Mixer</h3>
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

        <div className="todo-column">
          <h3 className="grid-title">Tasks</h3>
          <div className="todo-container">
            <form onSubmit={addTodo} className="todo-add-group">
              <input
                className="todo-input"
                placeholder="Add a task..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
              />
              <button type="submit" className="icon-btn"><Plus size={20} /></button>
            </form>
            <div className="todo-list-minimal">
              <AnimatePresence initial={false}>
                {todos.map(todo => (
                  <motion.div
                    key={todo.id}
                    className={`todo-item-minimal ${todo.completed ? 'completed' : ''}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        className={`todo-check-btn ${todo.completed ? 'checked' : ''}`}
                        onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))}
                      >
                        {todo.completed && <Check size={12} color="black" />}
                      </div>
                      <span>{todo.text}</span>
                    </div>
                    <button className="icon-btn" onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}>
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              className="modal-content-minimal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Settings</h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={24} /></button>
              </div>

              <div className="settings-group">
                <span className="settings-label">Timer Durations (min)</span>
                <div className="duration-inputs">
                  <div className="duration-field">
                    <label>Focus</label>
                    <input type="number" value={durations.FOCUS} onChange={(e) => updateDuration('FOCUS', e.target.value)} />
                  </div>
                  <div className="duration-field">
                    <label>Short</label>
                    <input type="number" value={durations.SHORT} onChange={(e) => updateDuration('SHORT', e.target.value)} />
                  </div>
                  <div className="duration-field">
                    <label>Long</label>
                    <input type="number" value={durations.LONG} onChange={(e) => updateDuration('LONG', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="settings-group" style={{ marginBottom: 0 }}>
                <span className="settings-label">Background Experience</span>
                <div className="theme-grid">
                  {THEMES.map(theme => (
                    <div
                      key={theme.id}
                      className={`theme-opt ${currentTheme === theme.id ? 'active' : ''}`}
                      onClick={() => setCurrentTheme(theme.id)}
                    >
                      {theme.label}
                    </div>
                  ))}
                </div>
              </div>

              <button className="close-btn" style={{ marginTop: 40, width: '100%', padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setIsSettingsOpen(false)}>
                Save & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
