import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CloudRain, TreePine, Coffee, Wind, Settings, X } from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MODES = {
  FOCUS: { label: 'Focus', minutes: 25, color: 'var(--accent-focus)' },
  SHORT: { label: 'Short Break', minutes: 5, color: 'var(--accent-break)' },
  LONG: { label: 'Long Break', minutes: 15, color: 'var(--accent-long)' },
};

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: <CloudRain />, url: 'https://assets.mixkit.co/active_storage/sfx/2418/2418-preview.mp3' },
  { id: 'forest', label: 'Forest', icon: <TreePine />, url: 'https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3' },
  { id: 'coffee', label: 'Cafe', icon: <Coffee />, url: 'https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3' },
  { id: 'wind', label: 'Wind', icon: <Wind />, url: 'https://assets.mixkit.co/active_storage/sfx/2445/2445-preview.mp3' },
];

const THEMES = [
  { id: 'default', label: 'Deep Ocean' },
  { id: 'cyberpunk', label: 'Neo Grid' },
  { id: 'nature', label: 'Deep Forest' },
  { id: 'mountain', label: 'High Peaks' },
  { id: 'sea', label: 'Calm Waves' },
  { id: 'city', label: 'Night City' },
  { id: 'geometry', label: 'Abstract' },
];

function App() {
  const [mode, setMode] = useState('FOCUS');
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSounds, setActiveSounds] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const soundInstances = useRef({});

  // Sync theme with body class
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'] }).play();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  }, [mode]);

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSound = (soundId, url) => {
    if (activeSounds[soundId]) {
      soundInstances.current[soundId].stop();
      setActiveSounds(prev => ({ ...prev, [soundId]: false }));
    } else {
      if (!soundInstances.current[soundId]) {
        soundInstances.current[soundId] = new Howl({
          src: [url],
          loop: true,
          volume: 0.5,
        });
      }
      soundInstances.current[soundId].play();
      setActiveSounds(prev => ({ ...prev, [soundId]: true }));
    }
  };

  return (
    <>
      <div className={`container glass ${isActive ? 'is-running' : ''}`}>
        <h1>Podomodro</h1>

        <div className="mode-switcher">
          {Object.entries(MODES).map(([key, value]) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => changeMode(key)}
              style={mode === key ? { borderBottom: `2px solid ${value.color}` } : {}}
            >
              {value.label}
            </button>
          ))}
        </div>

        <div className="timer-display" style={{ color: MODES[mode].color }}>
          {formatTime(timeLeft)}
        </div>

        <div className="controls">
          <button className="secondary-btn" onClick={resetTimer}>
            <RotateCcw size={20} />
          </button>
          <button className="main-btn" onClick={toggleTimer}>
            {isActive ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
          </button>
          <button className="secondary-btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
        </div>

        <div className="sound-grid">
          {SOUNDS.map((sound) => (
            <button
              key={sound.id}
              className={`sound-card glass ${activeSounds[sound.id] ? 'active' : ''}`}
              onClick={() => toggleSound(sound.id, sound.url)}
            >
              {sound.icon}
              <span>{sound.label}</span>
            </button>
          ))}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Stay focused, stay productive.
        </p>
      </div>

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
              className="modal-content glass"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Settings</h2>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Appearance</p>
                <div className="theme-options">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
                      onClick={() => setCurrentTheme(theme.id)}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Focus Sound</p>
                <p style={{ fontSize: '0.8rem' }}>Ambient sounds can be mixed in the main dashboard.</p>
              </div>

              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
