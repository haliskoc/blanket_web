import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Settings, X,
  Plus, Check, Trash2, Tag, CloudRain, TreePine,
  Coffee, Wind, Sun, Library, Image as ImageIcon,
  Zap, BarChart3, ListTodo, Clock, FolderPlus, ChevronRight,
  Home, Folder
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
    localStorage.setItem('podomodro-current-project', JSON.stringify(currentProject));
  }, [projects, todos, durations, dailyStats, currentProject]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

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

  const addTodo = (text, projectId) => {
    const newTodo = { id: Date.now(), text, completed: false, projectId };
    setTodos([newTodo, ...todos]);
  };

  const toggleTodo = (todoId) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (todoId) => {
    setTodos(todos.filter(t => t.id !== todoId));
  };

  return (
    <AppContext.Provider value={{
      projects, setProjects, addProject, deleteProject,
      todos, setTodos, addTodo, toggleTodo, deleteTodo,
      durations, setDurations,
      dailyStats, setDailyStats,
      currentTheme, setCurrentTheme,
      currentProject, setCurrentProject,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Navbar Component
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Clock size={24} />
        <span>Podomodro</span>
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
    currentTheme, setCurrentTheme,
    currentProject, setCurrentProject
  } = React.useContext(AppContext);

  const [mode, setMode] = useState('FOCUS');
  const [timeLeft, setTimeLeft] = useState(durations.FOCUS * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSounds, setActiveSounds] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectPanelOpen, setIsProjectPanelOpen] = useState(false);

  const soundInstances = useRef({});

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
        newStats[today].projects[currentProject?.name || 'Unknown'] = (newStats[today].projects[currentProject?.name || 'Unknown'] || 0) + 1;
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

  // Get recent tasks for current project
  const recentTasks = todos.filter(t => t.projectId === currentProject?.id).slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="page-wrapper">
      <LayoutGroup>
        <motion.div
          className="premium-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
        >
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
                      <div 
                        className={`todo-check-btn ${todo.completed ? 'checked' : ''}`} 
                        style={{ borderColor: currentProject?.color, background: todo.completed ? currentProject?.color : 'transparent' }}
                      />
                      <span style={{ opacity: todo.completed ? 0.3 : 0.8, textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.text}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

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

// Tasks Page
function TasksPage() {
  const {
    projects, addProject, deleteProject,
    todos, addTodo, toggleTodo, deleteTodo
  } = React.useContext(AppContext);

  const [isAddProjectPanelOpen, setIsAddProjectPanelOpen] = useState(false);
  const [isAddTaskPanelOpen, setIsAddTaskPanelOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ff3b3b');
  const [newTaskText, setNewTaskText] = useState('');

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
      addTodo(newTaskText.trim(), selectedProject.id);
      setNewTaskText('');
      setIsAddTaskPanelOpen(false);
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
                  {projectTodos.map(todo => (
                    <motion.div
                      key={todo.id}
                      className="task-item"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      layout
                    >
                      <div 
                        className={`task-checkbox ${todo.completed ? 'checked' : ''}`}
                        style={{ borderColor: project.color, background: todo.completed ? project.color : 'transparent' }}
                        onClick={() => toggleTodo(todo.id)}
                      >
                        {todo.completed && <Check size={12} />}
                      </div>
                      <span className={todo.completed ? 'completed' : ''}>{todo.text}</span>
                      <motion.button
                        className="task-delete"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                      </motion.button>
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
        onClose={() => setIsAddTaskPanelOpen(false)}
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
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
            </Routes>
          </main>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
