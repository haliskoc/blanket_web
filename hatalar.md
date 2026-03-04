# Podomodro - Hata ve Eksiklik Raporu

**Tarih:** 4 Mart 2026  
**İnceleme Kapsamı:** Database hariç tüm proje yapısı

---

## 🔴 KRİTİK HATALAR (Build Engeli)

### 1. Eksik NPM Paketi: `@supabase/supabase-js`

| Özellik | Detay |
|---------|-------|
| **Konum** | `src/lib/supabaseClient.js` Satır 1 |
| **Sorun** | Paket `package.json`'da tanımlı değil |
| **Etki** | Build başarısız oluyor |
| **Kullanım** | 41+ dosyada Supabase client import ediliyor |

**Hata Mesajı:**
```
[vite]: Rollup failed to resolve import "@supabase/supabase-js" 
from "/home/lenovo/Desktop/blanket/blanket_web/src/lib/supabaseClient.js"
```

**Çözüm:**
```bash
npm install @supabase/supabase-js
```

---

### 2. Eksik PWA İkonları

| Dosya | Referans | Durum |
|-------|----------|-------|
| `/favicon.ico` | `index.html` Satır 23, `App.jsx` Satır 238, 337 | ❌ Eksik |
| `/icon-192x192.png` | PWA manifest gereksinimi | ❌ Eksik |
| `/icon-512x512.png` | PWA manifest gereksinimi | ❌ Eksik |

**Mevcut:**
- ✅ `/icon-192.svg`
- ✅ `/icon-512.svg`
- ✅ `/vite.svg`

**Çözüm:** PNG formatında ikonlar oluştur veya `.svg` dosyalarını `.png` olarak kopyala.

---

### 3. Güvenlik Açığı: Hassas Bilgiler Açıkta

| Dosya | İçerik | Risk |
|-------|--------|------|
| `neon.md` | Database connection string, password | 🔴 Yüksek |
| `.env.example` | Supabase URL/Key placeholder | 🟡 Düşük |

**neon.md içeriği:**
```
DATABASE_URL=postgresql://neondb_owner:npg_yjSR86NAqxir@...
POSTGRES_PASSWORD=npg_yjSR86NAqxir
```

**Çözüm:**
1. `neon.md` dosyasını `.gitignore`'a ekle
2. Veya hassas bilgileri temizle
3. `.gitignore`'a şunu ekle: `*.md` (neon.md gibi geçici dosyalar için)

---

## ⚠️ ÖNEMLİ EKSİKLİKLER

### 4. README'de Belirtilen Özellikler Uygulanmamış

#### 4.1 Dynamic Zen Rain Efekti

| Özellik | Durum |
|---------|-------|
| **README** | "Yağmur temasında ekranda süzülen gerçek zamanlı dijital yağmur damlaları" |
| **CSS** | `.rain-overlay` sınıfı tanımlı (index.css: 861-886) |
| **Component** | ❌ JSX'de render edilmiyor |

**Çözüm:** TimerPage component'ine rain overlay ekle:
```jsx
{currentTheme === 'rain' && (
  <div className="rain-container">
    {[...Array(100)].map((_, i) => (
      <div
        key={i}
        className="rain-drop"
        style={{
          left: `${Math.random() * 100}%`,
          animationDuration: `${0.5 + Math.random() * 0.5}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    ))}
  </div>
)}
```

---

#### 4.2 Ses Mikseri (Volume Kontrolü)

| Özellik | Durum |
|---------|-------|
| **README** | "Her sesin seviyesini ayrı ayrı ayarlayarak kendi ideal çalışma atmosferinizi yaratın" |
| **Mevcut** | Sadece ON/OFF toggle var |
| **Eksik** | Her ses için ayrı volume slider |

**Çözüm:** `activeSounds` state'ini güncelle:
```javascript
// Mevcut: { rain: true, wind: false }
// Hedef:  { rain: { playing: true, volume: 0.5 }, wind: { playing: false, volume: 0.3 } }
```

---

#### 4.3 Eksik Ses Dosyaları

README'de 14 ses belirtilmiş, ancak sadece 11 ses mevcut:

| Ses | ID | Dosya | Durum |
|-----|----|-------|-------|
| Yaz Gecesi | `summer-night` | `summer-night.ogg` | ❌ Eksik |
| Tekne | `boat` | `boat.ogg` | ❌ Eksik |
| Pembe Gürültü | `pink-noise` | `pink-noise.ogg` | ❌ Eksik |

**Kaynak:** https://github.com/rafaelmardojai/blanket/tree/master/data/resources/sounds

---

### 5. Eksik CSS Sınıfları

Aşağıdaki sınıflar JSX'de kullanılıyor ancak `index.css`'te tanımlı değil:

#### Stats Page
| Sınıf | Kullanım | Satır |
|-------|----------|-------|
| `.stats-grid` | StatsPage | 1418 |
| `.heatmap-container` | Heatmap | 1504 |
| `.heatmap-labels` | Gün isimleri | 1505 |
| `.heatmap-scale` | Renk skalası | 1531 |

#### Achievements Page
| Sınıf | Kullanım | Satır |
|-------|----------|-------|
| `.achievements-header` | AchievementsPage | 1553 |
| `.achievement-stats` | İstatistikler | 1561 |
| `.achievement-stat` | Rozet sayacı | 1562 |
| `.overview-value` | Overview kart | 1579 |
| `.overview-label` | Overview kart | 1580 |
| `.badge-name` | Badge kart | 1614 |
| `.badge-description` | Badge kart | 1615 |
| `.badge-lock` | Badge kart | 1616 |

**Önerilen CSS:**
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.achievements-header {
  text-align: center;
  margin-bottom: 32px;
}

.badge-name {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 8px;
}
```

---

### 6. PWA Manifest Dosyası

| Özellik | Durum |
|---------|-------|
| **Referans** | `index.html` Satır 21: `<link rel="manifest" href="/manifest.json" />` |
| **Dosya** | ❌ `public/manifest.json` mevcut değil |
| **Etki** | PWA "Ana Ekrana Ekle" özelliği çalışmayabilir |

**Çözüm:** `public/manifest.json` oluştur:
```json
{
  "name": "Podomodro - Premium Pomodoro Timer & Ambient Sounds",
  "short_name": "Podomodro",
  "description": "Minimalist Pomodoro timer with ambient sounds",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#ff3b3b",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 📋 EKSİK DOSYALAR ÖZETİ

| Dosya | Konum | Öncelik |
|-------|-------|---------|
| `@supabase/supabase-js` paketi | `package.json` | 🔴 Kritik |
| `public/favicon.ico` | `public/` | 🟡 Orta |
| `public/manifest.json` | `public/` | 🟡 Orta |
| `public/preview.png` | `public/` | 🟢 Düşük |
| Test dosyaları | `__tests__/` veya `*.test.jsx` | 🟢 Düşük |

---

## 🔧 KOD KALİTESİ SORUNLARI

### 7. Kullanılmayan Importlar

| Import | Dosya | Satır | Öneri |
|--------|-------|-------|-------|
| `useCallback` | `src/App.jsx` | 1 | Kaldır |
| `motion` (tamamı) | `src/App.jsx` | 13 | Sadece gerekli olanları import et |
| `reorderTodos` | `src/App.jsx` | 889 | Kullan veya kaldır |

**Düzeltme:**
```javascript
// Mevcut
import { useCallback, useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, LayoutGroup, Reorder } from 'framer-motion';

// Önerilen
import { useState, useEffect, useContext } from 'react';
import { AnimatePresence, LayoutGroup, Reorder } from 'framer-motion';
```

---

### 8. Fonksiyon Tanımlama Sırası

| Konum | Sorun |
|-------|-------|
| `src/App.jsx` Satır 414 | `handleSessionComplete()` çağrılıyor |
| `src/App.jsx` Satır 419 | Fonksiyon burada tanımlanmış |

**Sorun:** Fonksiyon kullanımdan sonra tanımlanmış. `useEffect` içinde erişilemiyor.

**Çözüm:**
```javascript
// Option 1: Fonksiyonu yukarı taşı
const handleSessionComplete = () => { ... };

useEffect(() => {
  // ...
  handleSessionComplete();
}, [isActive, timeLeft]);

// Option 2: useCallback kullan
const handleSessionComplete = useCallback(() => { ... }, [dependencies]);
```

---

## ✅ ÇALIŞAN ÖZELLİKLER

| Özellik | Durum |
|---------|-------|
| React 19 + Vite | ✅ Güncel |
| Framer Motion animasyonlar | ✅ Çalışıyor |
| LocalStorage entegrasyonu | ✅ Çalışıyor |
| React Router DOM | ✅ SPA yapısı düzgün |
| Tema sistemi | ✅ 6 tema mevcut |
| Pomodoro timer | ✅ Temel fonksiyonlar çalışıyor |
| Ambient sesler (11/14) | ✅ ON/OFF çalışıyor |
| Görev yönetimi | ✅ Proje/task sistemi var |
| İstatistikler | ✅ Recharts grafikleri mevcut |
| Achievements | ✅ Rozet sistemi var |
| Streak takibi | ✅ Günlük hedef takibi var |

---

## 🎯 ÖNCELİK SIRALAMASI

### Hemen (Build için gerekli)
1. ✅ `@supabase/supabase-js` paketini yükle
2. ✅ `neon.md` dosyasını `.gitignore`'a ekle veya temizle

### Bu Sprint
3. ✅ `public/manifest.json` oluştur
4. ✅ `public/favicon.ico` ekle
5. ✅ Eksik CSS sınıflarını tanımla
6. ✅ Kullanılmayan importları temizle
7. ✅ `handleSessionComplete` sırasını düzelt

### Sonraki Sprint
8. ✅ Dynamic Rain efektini aktif et
9. ✅ Ses Mikseri (volume kontrolü) ekle
10. ✅ Eksik 3 ses dosyasını ekle

### Gelecek İyileştirmeler
- Test dosyaları ekle
- TypeScript geçişi düşün
- Keyboard shortcuts ekle
- Data export/import özelliği

---

## 📊 ÖZET TABLOSU

| Kategori | Açık | Kapalı | Toplam |
|----------|------|--------|--------|
| Kritik Hatalar | 3 | 0 | 3 |
| Önemli Eksiklikler | 6 | 0 | 6 |
| Kod Kalitesi | 2 | 0 | 2 |
| Eksik Dosyalar | 5 | 0 | 5 |
| **TOPLAM** | **16** | **0** | **16** |

---

**Raporu Hazırlayan:** AI Assistant  
**İnceleme Tarihi:** 4 Mart 2026  
**Proje:** Podomodro v0.0.0
