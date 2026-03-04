# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygun olarak hazırlanmıştır.

## [2.0.0] - 2026-03-04

### 🚀 Yeni Özellikler

#### PWA Desteği
- **Offline Çalışma** - Service Worker entegrasyonu ile internet bağlantısı olmadan kullanım
- **Manifest.json** - Native uygulama deneyimi için yapılandırma
- **Background Sync** - Çevrimdışı yapılan değişikliklerin otomatik senkronizasyonu
- **Push Bildirimleri** - Mola ve seans bildirimleri
- **Ana Ekrana Ekle** - iOS/Android desteği
- **Vite PWA Plugin** - Workbox entegrasyonu ile otomatik SW yönetimi

#### Supabase Entegrasyonu
- **Kimlik Doğrulama** - E-posta/şifre ve sosyal medya ile güvenli giriş
- **Bulut Senkronizasyonu** - Tüm cihazlarda veri senkronizasyonu
- **Gerçek Zamanlı Veritabanı** - Anlık istatistik ve görev güncellemeleri
- **Otomatik Yedekleme** - Veri kaybı riskini ortadan kaldırma
- **RLS (Row Level Security)** - Kullanıcı bazlı veri güvenliği

#### Gelişmiş Raporlama
- **CSV Export** - PapaParse ile veri dışa aktarımı
- **PDF Export** - jsPDF ve jsPDF-AutoTable ile profesyonel raporlar
- **Detaylı Metrikler** - Günlük/haftalık/aylık analizler
- **Grafikli Raporlar** - Görsel istatistik PDF'leri

#### Sosyal Özellikler
- **Arkadaş Sistemi** - Kullanıcıları arkadaş olarak ekleme
- **Liderlik Tablosu** - Global ve arkadaşlar arası sıralama
- **Odalar** - Grup çalışma odaları
- **Paylaşılabilir Profiller** - Sosyal medya entegrasyonu
- **Başarı Rozetleri** - Çalışma kilometre taşları

### 🛠️ Teknik Değişiklikler

#### Bağımlılıklar
```
+ jspdf@^4.2.0
+ jspdf-autotable@^5.0.7
+ papaparse@^5.5.3
+ @supabase/supabase-js@^2.x
+ vite-plugin-pwa@^1.2.0
+ workbox-window@^7.4.0
```

#### Altyapı
- React Router v7 entegrasyonu
- Service Worker kayıt ve yönetim sistemi
- Offline-first mimari
- Optimistik UI güncellemeleri

### 🐛 Düzeltmeler
- Ses senkronizasyonu iyileştirmeleri
- Mobil performans optimizasyonları
- Bellek sızıntısı düzeltmeleri

### 🎨 UI/UX İyileştirmeleri
- Yeni onboarding akışı
- Geliştirilmiş ayarlar paneli
- Dark mode optimizasyonları
- Erişilebilirlik (a11y) geliştirmeleri

## [1.0.0] - 2025-12-15

### İlk Sürüm

#### Temel Özellikler
- 🍅 Pomodoro zamanlayıcı (25/5/15 dk)
- 🔊 14 ortam sesi (Blanket entegrasyonu)
- 📊 Basit istatistikler
- 📝 Görev listesi
- 🎨 Zen tasarım
- 💾 Local Storage desteği

---

## Versiyonlama Notları

- **MAJOR**: Geriye dönük uyumsuz değişiklikler
- **MINOR**: Yeni özellikler (geriye dönük uyumlu)
- **PATCH**: Hata düzeltmeleri

[2.0.0]: https://github.com/haliskoc/blanket_web/releases/tag/v2.0.0
[1.0.0]: https://github.com/haliskoc/blanket_web/releases/tag/v1.0.0