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

### 3. Diplomasi, İttifaklar ve Ortak Sensör Ağı (GDD Bölüm 13)
- **İttifak Sistemi (`src/engine/engine.ts`, `fog.ts`):**
  - `CREATE_ALLIANCE`, `JOIN_ALLIANCE`, `LEAVE_ALLIANCE` komutları devrede.
  - Müttefikler arası sensör füzyonu: Bir ittifak üyesinin sensör menzili, tüm müttefiklerin haritasında ortak görüş açar.
- **İttifak Yönetim Paneli (`src/ui/components/AllianceModal.tsx`):**
  - İttifak kurma, arama, katılma, ayrılma.
  - Üyelerin üsleri ve tek tıkla müttefik gezegenine destek filosu sevk etme.

### 4. Nexus Rölesi & Haftalık Sektör Hakimiyeti (GDD Bölüm 8)
- **Merkezi Röle Mekaniği (`RelayModal.tsx`, `engine.ts`):**
  - Merkezi röleyi ele geçiren oyuncu tüm komşu sektörlerde genişletilmiş radar görüşü ve haftalık kontrol puanı kazanır.
  - Canlı liderlik tablosu, elde tutma süresi sayacı ve hızlı sefer başlatma kısayolu.

### 5. Yörünge İnceleme, Tatil Modu ve Ses Sentetizörü
- **Sistem Yörünge İncelemesi (`SystemInspectionModal.tsx`):**
  - Seçilen sistemin yıldızını ve etrafındaki I-IV gezegen yuvalarını (Terran, Okyanus, Çöl, Buzul, Volkanik) 2D yörüngede görselleştirir. Kolonizasyon hedeflerini tek tıkla belirlemeyi sağlar.
- **OGame Tipi Tatil Modu (`TOGGLE_VACATION_MODE`):**
  - Dışarıda filosu olmayan oyuncular tatil moduna geçebilir. Üretim dondurulur, gelen ve giden saldırılar engellenir.
- **Web Audio Sentetizörü (`sound.ts`):**
  - Harici ses dosyası gerektirmeden osilatör ve kazanç düğümleriyle oluşturulmuş tıklama, warp ve alarm ses efektleri.
- **Vektör Harita Yakınlaştırma (Zoom HUD):**
  - Haritada `+`, `-`, `%100` yakınlaştırma kontrolleri ve seçili sistem yörünge inceleme butonu.

### 6. Doğrulama ve Testler
- `npm test`: 9/9 birim testi başarılı (İttifak mekanikleri, tatil modu dondurması, %50 geri çağırma kilidi, ağır uçuş süresi ölçekleri dahil).
- `npm run sim`: 4 saatlik hızlandırılmış maçta 34 filo sevk edildi, 12 savaş çözüldü, 960 QA istismar emri engellendi.
- `npm run build`: TypeScript ve Vite üretim paketi 0 hata ile derlendi.
- Dev sunucusu: Port `3007` üzerinde HMR ile kesintisiz çalışıyor.

