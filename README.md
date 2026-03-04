# 🧘 Podomodro

**Podomodro**, derin odaklanma ve üretkenlik için tasarlanmış, minimalist bir Pomodoro zamanlayıcı ve ortam sesi karıştırıcısıdır. Göz yormayan "Zen" tasarımı, gerçekçi atmosferleri, bulut senkronizasyonu ve sosyal özellikleri ile çalışma alışkanlıklarınızı bir üst seviyeye taşır.

![Podomodro Preview](https://github.com/haliskoc/blanket_web/raw/main/public/preview.png) *(Görsel eklendiğinde aktif olacaktır)*

## ✨ Öne Çıkan Özellikler

### 🌑 Ultra-Minimalist "Zen" Tasarımı
Gereksiz tüm görsel kalabalıktan arındırılmış, tipografi odaklı ve akıcı animasyonlarla desteklenmiş premium bir arayüz.

### 📱 PWA Desteği
- **Offline Çalışma:** İnternet bağlantısı olmadan da odaklanmaya devam edin
- **Ana Ekrana Ekle:** iOS/Android'de native uygulama deneyimi
- **Push Bildirimleri:** Mola ve seans bildirimleri
- **Background Sync:** Çevrimdışıyken yapılan değişiklikler bağlantı gelince senkronize olur

### ☁️ Supabase Entegrasyonu
- **Güvenli Kimlik Doğrulama:** E-posta/sifre ve sosyal medya ile giriş
- **Bulut Senkronizasyonu:** Tüm cihazlarınızda verileriniz senkronize
- **Gerçek Zamanlı Veri:** Anlık istatistik güncellemeleri
- **Otomatik Yedekleme:** Veri kaybına son

### 🔊 14 Yüksek Kaliteli Ortam Sesi (Blanket Sounds)
[Blanket](https://github.com/rafaelmardojai/blanket) projesinden entegre edilen 14 farklı doğa ve şehir sesi.
- **Mikser Özelliği:** Her sesin seviyesini ayrı ayrı ayarlayarak kendi ideal çalışma atmosferinizi yaratın.
- **Sesler:** Yağmur, Fırtına, Rüzgar, Dalgalar, Akarsu, Kuşlar, Yaz Gecesi, Şömine, Kafe, Şehir, Tren, Tekne, Beyaz/Pembe Gürültü.

### 🖼️ Gerçekçi Atmosfer Temaları
- **Dynamic Zen Rain:** Yağmur temasında ekranda süzülen gerçek zamanlı dijital yağmur damlaları.
- **Zengin Kütüphane:** Yıldızlı Gökyüzü, Huzurlu Oda, Kütüphane, Gün Batımı gibi yüksek çözünürlüklü ve odaklanma dostu arka planlar.

### 📊 Gelişmiş Raporlama ve Analiz
- **Insights:** Son 7 günlük çalışma performansınızı gösteren bar grafikleri.
- **Proje Bazlı Dağılım:** Hangi projeye (Yazılım, Tasarım, Okuma vb.) ne kadar odaklandığınızı takip edin.
- **CSV/PDF Export:** Raporlarınızı dışa aktarın ve paylaşın
- **Detaylı Metrikler:** Günlük/haftalık/aylık odaklanma istatistikleri
- **Konfeti Kutlaması:** Her başarılı seans sonunda zarif bir kutlama efekti.

### 📝 Entegre Görev Listesi
- Görevlerinizi projelerle eşleştirin.
- Yerel depolama + bulut senkronizasyonu ile görevleriniz her zaman güvende

### 👥 Sosyal Özellikler (v2.0)
- **Arkadaşlar:** Arkadaşlarınızı ekleyin ve birlikte odaklanın
- **Liderlik Tablosu:** Global ve arkadaşlar arası sıralama
- **Odalar:** Ortak odalarda grup çalışmaları
- **Paylaşılabilir Profiller:** Başarılarınızı sosyal medyada paylaşın

## 🛠️ Teknoloji Yığını

- **Framework:** React + Vite
- **Animasyon:** Framer Motion
- **Ses Yönetimi:** Howler.js
- **Grafikler:** Recharts
- **İkonlar:** Lucide React
- **Efektler:** Canvas Confetti
- **PWA:** Vite PWA Plugin + Workbox
- **Backend:** Supabase (Auth + Database + Realtime)
- **Export:** jsPDF + PapaParse

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Supabase hesabı (bulut senkronizasyonu için)

### Yerel Kurulum

1. Depoyu klonlayın:
```bash
git clone https://github.com/haliskoc/blanket_web.git
```

2. Proje dizinine gidin:
```bash
cd blanket_web
```

3. Bağımlılıkları yükleyin:
```bash
npm install
```

4. Ortam değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

5. `.env` dosyasını Supabase bilgilerinizle güncelleyin:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

### Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Project Settings > API'den URL ve Anon Key bilgilerini alın
4. SQL Editor'de şema kurulumunu yapın:
   - `database/schema.sql` dosyasını çalıştırın
   - RLS politikalarını etkinleştirin

## 📱 PWA Kurulumu

### iOS (Safari)
1. Safari'de [podomodro.app](https://podomodro.app) adresine gidin
2. Paylaş butonuna tıklayın
3. "Ana Ekrana Ekle" seçeneğini seçin

### Android (Chrome)
1. Chrome'da [podomodro.app](https://podomodro.app) adresine gidin
2. Adres çubuğundaki üç noktaya tıklayın
3. "Ana ekrana ekle" veya "Uygulama yükle" seçeneğini seçin

### Desktop (Chrome/Edge)
1. Tarayıcıda uygulamayı açın
2. Adres çubuğundaki kurulum simgesine tıklayın
3. "Yükle" butonuna basın

## 📸 Ekran Görüntüleri

| Ana Sayfa | İstatistikler | Sosyal |
|-----------|--------------|---------|
| ![Ana Sayfa](./screenshots/home.png) | ![İstatistikler](./screenshots/stats.png) | ![Sosyal](./screenshots/social.png) |

*Ekran görüntüleri `screenshots/` klasörüne eklendiğinde görüntülenecektir.*

## 🔐 Gizlilik

Podomodro, gizliliğinize önem verir:
- **Local-First:** Tüm veriler önce yerel olarak saklanır
- **Şifreli Senkronizasyon:** Buluta aktarılan veriler şifrelenir
- **Veri Kontrolü:** Verilerinizi istediğiniz zaman silebilirsiniz
- **No Tracking:** Kullanıcı davranışları izlenmez, 3. parti çerezler kullanılmaz

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz!

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

*Halis Koç tarafından tutkuyla geliştirildi.*
