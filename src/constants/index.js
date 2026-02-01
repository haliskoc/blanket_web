import {
  CloudRain, Wind, Waves, TreePine, Sun, Coffee, Library,
  Image as ImageIcon, Moon, Ship, Activity, Droplets,
  Circle, AlertCircle, Flame
} from 'lucide-react';

export const SOUND_BASE_URL = 'https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/';

export const SOUNDS = [
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

export const ALARM_SOUNDS = [
  { id: 'bell', label: 'Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'chime', label: 'Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3' },
  { id: 'digital', label: 'Digital', url: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3' },
];

export const THEMES = [
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

export const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#10b981', icon: <Circle size={12} /> },
  { id: 'medium', label: 'Medium', color: '#f59e0b', icon: <AlertCircle size={12} /> },
  { id: 'high', label: 'High', color: '#ef4444', icon: <Flame size={12} /> },
];

export const BADGES = [
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

export const BREAK_ACTIVITIES = [
  { icon: '🚶', text: '5 min walk', duration: 5 },
  { icon: '💧', text: 'Drink water', duration: 2 },
  { icon: '👁️', text: 'Eye exercises', duration: 3 },
  { icon: '🧘', text: 'Breathing exercise', duration: 5 },
  { icon: '🤸', text: 'Stretching', duration: 5 },
];

export const DEFAULT_SOUND_PRESETS = [
  { id: 1, name: 'Rainy Cafe', sounds: ['rain', 'coffee-shop'] },
  { id: 2, name: 'Deep Focus', sounds: ['white-noise'] },
  { id: 3, name: 'Nature', sounds: ['birds', 'stream'] },
  { id: 4, name: 'Night Storm', sounds: ['storm', 'rain'] },
];
