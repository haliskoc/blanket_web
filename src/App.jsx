import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Settings, X,
  CloudRain, TreePine, Coffee, Wind,
  Bird, Ship, Building, Flame, Zap,
  Droplets, Moon, Train, Waves, Volume2
} from 'lucide-react';
import { Howl } from 'howler';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MODES = {
  FOCUS: { label: 'Focus', minutes: 25, color: 'var(--accent-focus)' },
  SHORT: { label: 'Short Break', minutes: 5, color: 'var(--accent-break)' },
  LONG: { label: 'Long Break', minutes: 15, color: 'var(--accent-long)' },
};

const SOUND_BASE_URL = 'https://raw.githubusercontent.com/rafaelmardojai/blanket/main/data/resources/sounds/';

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: <CloudRain />, filename: 'rain.ogg' },
  { id: 'storm', label: 'Storm', icon: <Zap />, filename: 'storm.ogg' },
  { id: 'wind', label: 'Wind', icon: <Wind />, filename: 'wind.ogg' },
  { id: 'waves', label: 'Waves', icon: <Waves />, filename: 'waves.ogg' },
  { id: 'stream', label: 'Stream', icon: <Droplets />, filename: 'stream.ogg' },
  { id: 'birds', label: 'Birds', icon: <Bird />, filename: 'birds.ogg' },
  { id: 'summer-night', label: 'Night', icon: <Moon />, filename: 'summer-night.ogg' },
  { id: 'fireplace', label: 'Fire', icon: <Flame />, filename: 'fireplace.ogg' },
  { id: 'coffee-shop', label: 'Cafe', icon: <Coffee />, filename: 'coffee-shop.ogg' },
  { id: 'city', label: 'City', icon: <Building />, filename: 'city.ogg' },
  { id: 'train', label: 'Train', icon: <Train />, filename: 'train.ogg' },
  { id: 'boat', label: 'Boat', icon: <Ship />, filename: 'boat.ogg' },
  { id: 'white-noise', label: 'White', icon: <Volume2 />, filename: 'white-noise.ogg' },
  { id: 'pink-noise', label: 'Pink', icon: <Volume2 />, filename: 'pink-noise.ogg' },
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
          volume: 0.5,
          format: ['ogg']
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
              onClick={() => toggleSound(sound.id, sound.filename)}
            >
              {sound.icon}
              <span>{sound.label}</span>
            </button>
          ))}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Mix your favorite sounds to stay focused.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>

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
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>About Podomodro</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  A premium pomodoro timer with integrated ambient sounds from the Blanket project.
                </p>
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
