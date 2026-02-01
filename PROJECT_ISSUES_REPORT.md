# Podomodro Proje Eksiklik ve Hata Raporu

**Tarih:** 1 Şubat 2026  
**Proje:** Podomodro - Pomodoro Timer & Ambient Sounds  
**İnceleyen:** Sisyphus

---

## 🚨 KRİTİK HATALAR (Düzeltilmeli)

### 1. `handleSessionComplete` Fonksiyon Tanımlama Hatası

**Konum:** `src/App.jsx`, Satır 414

**Sorun:**
```javascript
// Satır 405-417
useEffect(() => {
  let interval = null;
  if (isActive && timeLeft > 0) {
    interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  } else if (timeLeft === 0 && isActive) {
    clearInterval(interval);
    setIsActive(false);
    handleSessionComplete(); // ❌ TANIMLANMADAN ÖNCE KULLANILMIŞ
  }
  return () => clearInterval(interval);
}, [isActive, timeLeft]);

// Satır 419 - Fonksiyon burada tanımlanmış
const handleSessionComplete = () => {
  // ...
};
```

**ESLint Hatası:**
```
Error: Cannot access variable before it is declared
'react-hooks/immutability': handleSessionComplete is accessed before it is declared
'react-hooks/exhaustive-deps': React Hook useEffect has a missing dependency
```

**Önerilen Çözüm:**
- Fonksiyonu useEffect'ten önce tanımlamak veya
- useCallback ile wrap edip dependency array'e eklemek

---

### 2. `setGoals` Tanımlı Değil Hatası

**Konum:** `src/App.jsx`, Satır 774

**Sorun:**
```javascript
// TasksPage component içinde (Satır 886-924)
const TasksPage = () => {
  const {
    projects, addProject, deleteProject,
    todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos
    // ❌ setGoals buraya eklenmemiş ama kullanılıyor
  } = React.useContext(AppContext);
  
  // ...
  
  // Satır 774'te kullanımı:
  const handleAddTask = () => {
    // setGoals({ ...goals, daily: parseInt(e.target.value) || 8 })
    // Hedef güncelleme fonksiyonu çağrılıyor ama import edilmemiş
  };
};
```

**ESLint Hatası:**
```
'setGoals' is not defined (no-undef)
```

**Önerilen Çözüm:**
- AppContext'ten `setGoals`'i destructure etmek veya
- `goals` state'ini direkt olarak güncellemeden AppContext üzerinden yönetmek

---

### 3. Kullanılmayan Importlar

| Import | Satır | Kullanım | Öneri |
|--------|-------|----------|-------|
| `useCallback` | 1 | Kullanılmıyor | Kaldır |
| `motion` | 13 | Sadece `AnimatePresence`, `LayoutGroup`, `Reorder` kullanılıyor | `motion` importunu kaldır |
| `reorderTodos` | 889 | Atanmış ama kullanılmıyor | Kullan veya kaldır |

---

## ⚠️ EKSİK CSS SINIFLARI

Aşağıdaki CSS sınıfları `src/index.css`'te tanımlanmamış ama JSX'de kullanılıyor:

### Stats Page Eksik Stilleri

| Sınıf | Kullanım Yeri | Durum |
|-------|---------------|-------|
| `.stats-grid` | StatsPage (Satır 1418) | Tanımlı değil - Layout bozukluğu oluşturabilir |
| `.heatmap-container` | Heatmap bölümü (Satır 1504) | Tanımlı değil |
| `.heatmap-labels` | Gün isimleri (Satır 1505) | Tanımlı değil |
| `.heatmap-scale` | Renk skalası (Satır 1531) | Tanımlı değil |

### Achievements Page Eksik Stilleri

| Sınıf | Kullanım Yeri | Durum |
|-------|---------------|-------|
| `.achievements-header` | AchievementsPage (Satır 1553) | Tanımlı değil |
| `.achievement-stats` | İstatistikler (Satır 1561) | Tanımlı değil |
| `.achievement-stat` | Rozet sayacı | Tanımlı değil |
| `.overview-value` | Overview kart (Satır 1579) | Tanımlı değil |
| `.overview-label` | Overview kart (Satır 1580) | Tanımlı değil |
| `.badge-name` | Badge kart (Satır 1614) | Tanımlı değil |
| `.badge-description` | Badge kart (Satır 1615) | Tanımlı değil |
| `.badge-lock` | Badge kart (Satır 1616) | Tanımlı değil |

### Eksik `.stats-grid` CSS Önerisi:

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
```

---

## 🔧 FONKSİYONELLİK EKSİKLERİ

### 1. Ses Mikser Özelliği (README'de Var, Uygulanmamış)

**README'de Belirtilen:**
> **Mikser Özelliği:** Her sesin seviyesini ayrı ayrı ayarlayarak kendi ideal çalışma atmosferinizi yaratın.

**Mevcut Durum:**
- Sadece alarm sesi için volume kontrolü var (`settings.alarmVolume`)
- Ambient sesler (yağmur, rüzgar vb.) için ayrı volume yok
- Sadece ON/OFF mantığı var

**Gereken:**
- Her ses için ayrı volume slider
- Volume state yönetimi (activeSounds objesine volume eklenmesi)

---

### 2. Dynamic Rain Efekti (README'de Var, Uygulanmamış)

**README'de Belirtilen:**
> **Dynamic Zen Rain:** Yağmur temasında ekranda süzülen gerçek zamanlı dijital yağmur damlaları.

**Mevcut Durum:**
- `body.theme-rain` sınıfı var (CSS satır 79-82)
- `.rain-overlay` sınıfı tanımlanmış (CSS satır 861-886)
- Ancak JSX'de rain overlay component'i render edilmiyor
- Yağmur damlası animasyonu sadece CSS'te var, çalışmıyor

**Gereken:**
```jsx
// TimerPage component içine eklenmeli:
{currentTheme === 'rain' && (
  <div className="rain-overlay">
    {[...Array(50)].map((_, i) => (
      <div key={i} className="drop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s` }} />
    ))}
  </div>
)}
```

---

### 3. Eksik Ses Dosyaları

**README'de Listelenen 14 Ses:**
1. ✅ Yağmur (rain)
2. ✅ Fırtına (storm)
3. ✅ Rüzgar (wind)
4. ✅ Dalgalar (waves)
5. ✅ Akarsu (stream)
6. ✅ Kuşlar (birds)
7. ❌ **Yaz Gecesi** (summer-night) - Eksik
8. ✅ Şömine (fireplace)
9. ✅ Kafe (coffee-shop)
10. ✅ Şehir (city)
11. ✅ Tren (train)
12. ❌ **Tekne** (boat) - Eksik
13. ✅ Beyaz Gürültü (white-noise - library olarak adlandırılmış)
14. ❌ **Pembe Gürültü** (pink-noise) - Eksik

**Mevcut SOUNDS Array (Satır 22-34):**
```javascript
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
  // ❌ Eksik: summer-night, boat, pink-noise
];
```

**Blanket Proje Referans Linkleri:**
- Yaz Gecesi: https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/summer-night.ogg
- Tekne: https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/boat.ogg
- Pembe Gürültü: https://raw.githubusercontent.com/rafaelmardojai/blanket/master/data/resources/sounds/pink-noise.ogg

---

## 📁 EKSİK DOSYALAR

### 1. Favicon

**Referans:** `index.html` Satır 5 ve `App.jsx` Satır 238, 337
```html
<!-- index.html -->
<link rel="icon" type="image/svg+xml" href="/vite.svg" />

<!-- Notification icon referansı App.jsx içinde -->
icon: '/favicon.ico'
```

**Durum:**
- `/favicon.ico` dosyası mevcut değil
- Sadece `/vite.svg` var

**Öneri:**
- Favicon oluştur ve public klasörüne ekle
- Veya notification icon için `/vite.svg` kullan

---

### 2. Preview Görseli

**Referans:** `README.md` Satır 5
```markdown
![Podomodro Preview](https://github.com/haliskoc/blanket_web/raw/main/public/preview.png) *(Görsel eklendiğinde aktif olacaktır)*
```

**Durum:**
- `public/preview.png` dosyası mevcut değil
- README'de görsel placeholder olarak işaretlenmiş

---

### 3. PWA Manifest Dosyası

**Eksik:** `public/manifest.json`

**README'de Belirtilen:**
> Podomodro, gizliliğinize önem verir. Tüm veriler sadece tarayıcınızın Local Storage alanında saklanır.

Ancak PWA desteği için manifest.json gerekli.

**Önerilen manifest.json:**
```json
{
  "name": "Podomodro - Pomodoro Timer & Ambient Sounds",
  "short_name": "Podomodro",
  "description": "Minimalist Pomodoro timer with ambient sounds",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0c0c14",
  "theme_color": "#ff3b3b",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### 4. Service Worker

**Eksik:** PWA offline çalışma için service worker

**Öneri:**
- Vite PWA plugin kullanılabilir
- Veya manuel service worker yazılabilir

---

## 🔍 DİĞER İYİLEŞTİRME ÖNERİLERİ

### 1. Klavye Kısayolları

**Önerilen Kısayollar:**
- `Space`: Timer'ı başlat/durdur
- `R`: Timer'ı sıfırla
- `S`: Ayarları aç
- `T`: Görevler sayfasına git
- `1-9`: Sesleri aç/kapat

---

### 2. Veri Yedekleme/Dışa Aktarma

**Mevcut Durum:**
- Tüm veriler sadece localStorage'da
- Veri kaybı riski yüksek

**Öneri:**
- JSON olarak export/import özelliği
- Settings paneline "Export Data" ve "Import Data" butonları

---

### 3. Ses Preloading

**Mevcut Durum:**
- Sesler ilk tıklamada yükleniyor
- Gecikme yaşanıyor

**Öneri:**
- Howl instance'ları lazy load yerine preload yapılabilir
- Veya kullanıcı tıklamadan önce küçük bir buffer preload

---

### 4. Test Dosyaları

**Mevcut Durum:**
- Hiçbir test dosyası yok
- Test framework'ü yok

**Öneri:**
- Vitest veya Jest eklenebilir
- React Testing Library ile temel testler

---

### 5. TypeScript / PropTypes

**Mevcut Durum:**
- Hiç tip kontrolü yok
- Runtime hatalar riskli

**Öneri:**
- TypeScript'e geçiş veya
- En azından PropTypes kullanımı

---

### 6. Theme Değişimi Smooth Geçiş

**Mevcut Durum:**
- Theme değişimi ani oluyor

**Öneri:**
- CSS transition eklenmesi:
```css
body {
  transition: background 0.5s ease;
}
```

---

## ✅ OLUMLU TESPİTLER

- ✅ Modern React 19 kullanılıyor
- ✅ Vite ile hızlı geliştirme ortamı
- ✅ Framer Motion ile akıcı animasyonlar
- ✅ LocalStorage entegrasyonu çalışıyor
- ✅ Tema sistemi var ve çalışıyor
- ✅ Responsive tasarım mevcut
- ✅ React Router DOM ile SPA yapısı
- ✅ Howler.js ile güçlü ses yönetimi
- ✅ Recharts ile istatistik grafikleri
- ✅ Achievement/Badge sistemi
- ✅ Streak takibi
- ✅ Görev yönetimi alt görev desteğiyle

---

## 🎯 ÖNCELİK SIRALAMASI

### Yüksek Öncelik (Hemen Düzeltilmeli)
1. `handleSessionComplete` tanımlama hatası
2. `setGoals` import hatası
3. Kullanılmayan importları temizleme

### Orta Öncelik (Bu Sprintte)
4. Eksik CSS sınıflarını tanımlama
5. Eksik 3 sesi ekleme
6. Dynamic Rain efektini aktif etme
7. Ses mikseri (volume kontrolü)

### Düşük Öncelik (Gelecek Sprintlerde)
8. Favicon ve preview görseli
9. PWA manifest ve service worker
10. Test dosyaları
11. TypeScript geçişi
12. Keyboard shortcuts
13. Data export/import

---

## 📝 SONUÇ

Podomodro, modern teknolojiler kullanılarak geliştirilmiş şık bir Pomodoro uygulamasıdır. Temel fonksiyonlar çalışır durumda ancak bazı kritik hatalar ve eksik özellikler vardır. Özellikle ESLint hataları ve eksik CSS sınıfları kullanıcı deneyimini olumsuz etkileyebilir. Bu eksiklikler giderildiğinde uygulama çok daha stabil ve tam özellikli olacaktır.

---

**Rapor Hazırlayan:** Sisyphus  
**İnceleme Tarihi:** 1 Şubat 2026
