# Podomodro - Hemen Eklenebilecek Özellikler

Bu liste, hemen başlayabileceğin pratik ve faydalı özellikleri içeriyor.

---

## ✅ 1. Keyboard Shortcuts (Klavye Kısayolları)

**Ne işe yarar:** Mouse kullanmadan hızlı kontrol
**Zorluk:** Kolay (5 dk)

```javascript
// App.jsx içinde TimerPage component'ine ekle
useEffect(() => {
  const handleKeyPress = (e) => {
    // Space: Start/Pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      toggleTimer();
    }
    // R: Reset
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
      setTimeLeft(durations[mode] * 60);
      setIsActive(false);
    }
    // S: Settings
    if (e.code === 'KeyS') {
      setIsSettingsOpen(true);
    }
    // M: Mute/Unmute all sounds
    if (e.code === 'KeyM') {
      Object.keys(soundInstances.current).forEach(key => {
        soundInstances.current[key].mute(!soundInstances.current[key].muted);
      });
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isActive, mode, durations]);
```

---

## ✅ 2. Ses Mikseri (Volume Kontrolü)

**Ne işe yarar:** Her ses için ayrı ses seviyesi ayarı
**Zorluk:** Orta (20 dk)

### Adım 1: State Güncelleme
```javascript
// Aktif sesler state'ini güncelle
const [activeSounds, setActiveSounds] = useState({});
// →
const [activeSounds, setActiveSounds] = useState({}); // { rain: { playing: true, volume: 0.5 } }
```

### Adım 2: Volume Slider Ekleme
```jsx
// Sound item içine volume slider ekle
{activeSounds[sound.id]?.playing && (
  <input
    type="range"
    min="0"
    max="1"
    step="0.1"
    value={activeSounds[sound.id]?.volume || 0.5}
    onChange={(e) => {
      const vol = parseFloat(e.target.value);
      soundInstances.current[sound.id].volume(vol);
      setActiveSounds(prev => ({
        ...prev,
        [sound.id]: { ...prev[sound.id], volume: vol }
      }));
    }}
    onClick={e => e.stopPropagation()}
    style={{ width: '80%', marginTop: '8px' }}
  />
)}
```

---

## ✅ 3. Dynamic Rain Efekti

**Ne işe yarar:** Yağmur temasında animasyonlu damlalar
**Zorluk:** Kolay (10 dk)

### CSS (index.css'e ekle)
```css
.rain-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.rain-drop {
  position: absolute;
  width: 2px;
  height: 100px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3));
  animation: rain-fall linear infinite;
}

@keyframes rain-fall {
  to { transform: translateY(100vh); }
}
```

### Component (App.jsx'e ekle)
```jsx
// TimerPage return ifadesinin başına ekle
{currentTheme === 'rain' && (
  <div className="rain-container">
    {[...Array(100)].map((_, i) => (
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
```

---

## ✅ 4. Focus Mode (Odak Modu)

**Ne işe yarar:** Dikkat dağıtmayan minimal arayüz
**Zorluk:** Kolay (15 dk)

### State Ekleme
```javascript
const [isFocusMode, setIsFocusMode] = useState(false);
```

### Toggle Buton
```jsx
// Timer controls içine ekle
<motion.button 
  className="icon-btn"
  onClick={() => setIsFocusMode(!isFocusMode)}
  title="Focus Mode"
>
  {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
</motion.button>
```

### Focus Mode Stilleri
```css
.focus-mode .navbar,
.focus-mode .secondary-section,
.focus-mode .sound-list,
.focus-mode .daily-goal-section {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.focus-mode .premium-card {
  transform: scale(1.1);
  transition: transform 0.5s ease;
}
```

---

## ✅ 5. CSV Export (Veri Dışa Aktarma)

**Ne işe yarar:** Verileri yedekleme ve analiz
**Zorluk:** Kolay (10 dk)

### Export Fonksiyonu
```javascript
const exportData = () => {
  const data = {
    stats: dailyStats,
    achievements,
    projects,
    todos,
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
```

### Import Fonksiyonu
```javascript
const importData = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm('Bu işlem mevcut verilerin üzerine yazacak. Devam etmek istiyor musunuz?')) {
        setDailyStats(data.stats || {});
        setAchievements(data.achievements || {});
        setProjects(data.projects || []);
        setTodos(data.todos || []);
        alert('Veriler başarıyla yüklendi!');
      }
    } catch (err) {
      alert('Geçersiz dosya formatı!');
    }
  };
  reader.readAsText(file);
};
```

### Settings Paneline Ekleme
```jsx
<div className="settings-section">
  <label className="settings-label">Data Management</label>
  <div style={{ display: 'flex', gap: '10px' }}>
    <button className="submit-btn" onClick={exportData}>
      <Download size={18} /> Export Data
    </button>
    <label className="submit-btn" style={{ cursor: 'pointer' }}>
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
```

---

## ✅ 6. Eksik Sesleri Ekleme

**Ne işe yarar:** 11 ses → 14 tam ses
**Zorluk:** Çok Kolay (2 dk)

```javascript
// SOUNDS array'ine ekle
const SOUNDS = [
  // ... mevcut sesler
  { 
    id: 'summer-night', 
    label: 'Summer Night', 
    filename: 'summer-night.ogg', 
    icon: <Moon size={20} /> 
  },
  { 
    id: 'boat', 
    label: 'Boat', 
    filename: 'boat.ogg', 
    icon: <Ship size={20} /> 
  },
  { 
    id: 'pink-noise', 
    label: 'Pink Noise', 
    filename: 'pink-noise.ogg', 
    icon: <Waves size={20} /> 
  },
];
```

**Import ekle:**
```javascript
import { Moon, Ship, Waves } from 'lucide-react';
```

---

## ✅ 7. Mini Break Widget'ı

**Ne işe yarar:** Mola önerileri
**Zorluk:** Kolay (10 dk)

### Break Suggestions
```javascript
const BREAK_ACTIVITIES = [
  { icon: '🚶', text: '5 dk yürüyüş yap', duration: 5 },
  { icon: '💧', text: 'Su iç', duration: 2 },
  { icon: '👁️', text: 'Göz egzersizi yap', duration: 3 },
  { icon: '🧘', text: 'Nefes egzersizi', duration: 5 },
  { icon: '🤸', text: 'Esneme hareketleri', duration: 5 },
];
```

### Break Modal
```jsx
{mode !== 'FOCUS' && isActive && (
  <motion.div className="break-suggestions">
    <h4>💡 Mola Önerileri</h4>
    {BREAK_ACTIVITIES.slice(0, 2).map((activity, i) => (
      <div key={i} className="break-item">
        <span>{activity.icon}</span>
        <span>{activity.text}</span>
      </div>
    ))}
  </motion.div>
)}
```

---

## ✅ 8. Ses Preset'leri

**Ne işe yarar:** Favori ses kombinasyonlarını kaydetme
**Zorluk:** Orta (15 dk)

### State
```javascript
const [soundPresets, setSoundPresets] = useState(() => {
  const saved = localStorage.getItem('podomodro-sound-presets');
  return saved ? JSON.parse(saved) : [
    { id: 1, name: 'Rainy Cafe', sounds: ['rain', 'coffee-shop'] },
    { id: 2, name: 'Deep Focus', sounds: ['white-noise', 'library'] },
  ];
});
```

### Preset Butonları
```jsx
<div className="sound-presets">
  <span>Presets:</span>
  {soundPresets.map(preset => (
    <button 
      key={preset.id}
      onClick={() => applyPreset(preset.sounds)}
      className="preset-btn"
    >
      {preset.name}
    </button>
  ))}
</div>
```

---

## ✅ 9. Tema Zamanlayıcı

**Ne işe yarar:** Gün batımında otomatik tema değişimi
**Zorluk:** Kolay (10 dk)

```javascript
useEffect(() => {
  const checkTimeTheme = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      setCurrentTheme('nature'); // Gündüz teması
    } else if (hour >= 18 && hour < 21) {
      setCurrentTheme('sunset'); // Gün batımı
    } else {
      setCurrentTheme('space'); // Gece teması
    }
  };
  
  checkTimeTheme();
  const interval = setInterval(checkTimeTheme, 60000); // Her dk kontrol et
  return () => clearInterval(interval);
}, []);
```

---

## ✅ 10. Hızlı Not

**Ne işe yarar:** Pomodoro sırasında hızlı not alma
**Zorluk:** Kolay (15 dk)

```javascript
const [quickNote, setQuickNote] = useState('');
const [notes, setNotes] = useState([]);

const saveNote = () => {
  if (quickNote.trim()) {
    setNotes([...notes, { 
      text: quickNote, 
      timestamp: new Date().toISOString(),
      pomodoro: achievements.totalPomodoros + 1
    }]);
    setQuickNote('');
  }
};
```

---

## 🎯 Öncelik Sırası

| # | Özellik | Zorluk | Etki | Zaman |
|---|---------|--------|------|-------|
| 1 | Keyboard Shortcuts | ⭐ | ⭐⭐⭐⭐⭐ | 5 dk |
| 2 | Ses Mikseri | ⭐⭐ | ⭐⭐⭐⭐⭐ | 20 dk |
| 3 | Dynamic Rain | ⭐ | ⭐⭐⭐⭐ | 10 dk |
| 4 | Focus Mode | ⭐ | ⭐⭐⭐⭐ | 15 dk |
| 5 | CSV Export | ⭐ | ⭐⭐⭐ | 10 dk |
| 6 | Eksik Sesler | ⭐ | ⭐⭐⭐ | 2 dk |
| 7 | Break Widget | ⭐ | ⭐⭐⭐ | 10 dk |
| 8 | Ses Preset'leri | ⭐⭐ | ⭐⭐⭐ | 15 dk |
| 9 | Tema Zamanlayıcı | ⭐ | ⭐⭐ | 10 dk |
| 10 | Hızlı Not | ⭐ | ⭐⭐ | 15 dk |

---

## 🚀 Başlama Önerisi

1. **Bugün:** #1 (Keyboard) + #6 (Sesler) - Toplam 7 dk
2. **Yarın:** #3 (Rain) + #4 (Focus Mode) - Toplam 25 dk
3. **Bu Hafta:** #2 (Ses Mikseri) + #5 (Export) - Toplam 30 dk

Toplam: **~1 saat** çalışmayla uygulama çok daha kullanışlı hale gelir!

---

**Hazırlayan:** Sisyphus  
**Tarih:** 1 Şubat 2026
