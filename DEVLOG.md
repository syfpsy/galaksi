# Canlı Galaksi — Geliştirme Günlüğü (DevLog)

Bu dosya, GDD v0.1.0 doğrultusunda yapılan tüm mimari kararların, aşamaların ve değişikliklerin özet hafızasıdır.

---

## [2026-09-27] — Faz A & B Kurulumu ve Ağır Strateji (Slow Persistent Strategy) Kalibrasyonu

### 1. Ağır Oynanış ve Uzun Sefer Kalibrasyonu (GDD Bölüm 1, 4, 10 ve 15 Uyumu)
Kullanıcı geribildirimi doğrultusunda oyunun temel karakteri olan **"ağır, asenkron ve uzun vadeli uzay stratejisi"** hissi kalibre edildi:
- **Uçuş Süreleri Ölçeklendi (`src/engine/flight.ts`):**
  - Komşu sistemler arası uçuşlar ~15–30 dakikaya, uzak sektör atlamaları 1–2.5 saate bağlandı.
  - Hızlı avcılar (hız 220) ve keşifler (hız 260), yola çıkmış ağır savaş gemilerini (hız 95) rotada takip edip önleyebilecek stratejik hız farkına kavuşturuldu.
- **İnşa ve Araştırma Süreleri (`src/engine/constants.ts`):**
  - İlk seviye madenler 1.5–3.5 dakika, ileri seviyeler saatler sürecek şekilde geometrik katsayılarla dengelendi.
  - Gemi üretim süreleri (Keşif 2 dk, Nakliye 4 dk, Avcı 3 dk, Savaş Gemisi 12 dk) tersane seviyesine göre hızlanacak biçimde uyarlandı.
  - Araştırmalar 7–9 dakika temel süreden başlayıp laboratuvar seviyesine göre hızlandırıldı.

### 2. Taktik Karşı Hamle ve Erken Uyarı Sistemi
- **Zaman Formatlama & Takvim Saati (`src/ui/timeUtils.ts`):**
  - Tüm arayüzde ham saniyeler yerine `formatDuration` (örn: `24 dk 15 sn`, `1 sa 40 dk`) ve `formatSimClock` (`Gün 1 • 14:28:10`) devreye alındı.
- **Yaklaşan Tehdit Alarmı (`IncomingThreatBanner.tsx`):**
  - Sensör menzilinde oyuncunun gezegenine doğru rota çizmiş bir düşman filosu tespit edildiğinde ekranın üstünde kırmızı taktik alarm paneli açılır.
  - Düşmanın varış saatini, kalan süresini ve son yaklaşma kilidi öncesindeki **önleme/karşı hamle penceresini** gösterir.
  - Tek tıkla `🎯 Önleme Hazırla` (hedef filoyu kilitler ve avcıları seçer) veya `📦 Tahliye / Fleet-Save` (boşta kalan korunmasız kaynakları nakliyeyle güvenli rotaya sevk eder) butonları sunar.
- **%50 Geri Çağırma Kilidi (Point of No Return) Görseli (`GalaxyMap.tsx`):**
  - Uçuş vektöründe filonun yolculuğunun ilk %50'sinde dönüş açık; son %50'sinde kilitlendiği haritada çizgi stili ve rozetle açıkça gösterilir.
- **Simülasyon Hız Kontrolü & "Gece Uykusu" Atlaması (`TopBar.tsx`):**
  - Varsayılan hız `1x (Reel Zaman)`.
  - Hızlı testler için `10x`, `60x`, `300x` hızlandırma seçenekleri.
  - `+15dk`, `+1sa` ve GDD Bölüm 15'te belirtilen 8 saatlik çevrimdışı kalma toparlanma dengesini sınamak için `+8sa (Gece Uykusu)` butonları eklendi.

### 3. Doğrulama
- `npm test`: 6/6 test başarılı.
- `npm run sim`: 4 saatlik maçta 34 filo sevk edildi, 12 önleme savaşı çözüldü, tüm QA testleri geçti.
- `npm run build`: Hatasız üretim derlemesi.
