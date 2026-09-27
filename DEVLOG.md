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

### 6. Amiral Bot Arketipi (`src/bots/admiral.ts` — GDD Bölüm 11)
- **Beşinci Bot Arketipi:** GDD Bölüm 11'deki "Amiral" arketipi geliştirildi.
- **Durumsal Karar Mekanizması:**
  - Görüş menzilindeki düşman filolarını tespit edip hız ve menzil üstünlüğü varsa rotada önleme (interception).
  - Sistemlerdeki enkaz alanlarını (debris) nakliye ve eskortlarla toplama.
  - Nexus Rölesi zayıf düştüğünde ağır filo ile taarruz ve kontrol noktası toplama.
  - Askeri duruma göre motor ve silah araştırmalarını dinamik dengeleme.

### 7. Taktik Muharebe Simülatörü & Risk Tahmini (`CommandPanel.tsx` — GDD Bölüm 7 & 15)
- **Sonuç ve Risk Tahmini:** Oyuncu saldırmadan önce filo güç oranına, kalkan/silah araştırmalarına ve düşman garnizonuna göre tahmini zafer ihtimalini (`%85 Zafer İhtimali`) görür.
- **Kısmi Bilgi / Belirsizlik:** Hedef sistem hakkında derin istihbarat yoksa tahmin aralık olarak verilir (`%45 - %75 İhtimal`) ve oyuncu keşif göndermeye yönlendirilir.
- **Savunma Duruşu Tespiti:** Hedefin "Filoyu Koru" duruşunda olduğu uyarısı yapılır.
- **Hızlı Enkaz Toplama Butonu:** Sistemde enkaz varsa gereken nakliye sayısını otomatik hesaplayıp tek tıkla sevk formunu hazırlar.

### 8. Acemi Koruması ve Anti-Bash Sınırı (`src/engine/engine.ts` — GDD Bölüm 10)
- **48 Saatlik Acemi Koruması:** Yeni komutanlar PvP baskınlarına karşı korunur ve koruma altındayken PvP başlatamaz.
- **Anti-Bash Kuralı:** Aynı hedefe 24 saat içinde en fazla 6 saldırı düzenlenebilir; 7. saldırı kural motoru tarafından reddedilir.

### 9. Doğrulama ve Testler
- `npm test`: 11/11 birim testi başarılı (Acemi koruması, Anti-Bash sınırı, ittifaklar, tatil modu ve ağır uçuş süreleri dahil).
- `npm run sim`: 4 saatlik hızlandırılmış maçta 5 bot yarıştı: 54 filo sevk edildi, 17 önleme savaşı çözüldü, 960 QA istismar emri engellendi.
- `npm run build`: TypeScript ve Vite üretim paketi 0 hata ile derlendi.
- Dev sunucusu: Port `3007` üzerinde HMR ile kesintisiz çalışıyor.

---

## [2026-09-27] — Faz C: Magnific AI Destekli Görsel Varlık Üretimi & Sanat Galerisi

### 1. Hard Sci-Fi Konsept Sanatı Üretimi (Magnific AI — Google Nano Banana Pro)
Kullanıcının *"Hem grafikleri hem de arayüzü çok daha iyi yapmalıyız. Yapabileceğin örneklerden Magnific kullanarak bir galeri hazırla ve sadece yapabileceğin detayda grafikler olsun ama sonra beraber bakalım"* direktifi doğrultusunda, oyunun görsel kalitesini AAA bilimkurgu seviyesine taşıyan 6 ana varlık Magnific MCP üzerinden üretildi:
1. **Keşif Gemisi (Vanguard Recon 7):**
   - Varlık: `public/assets/art/scout.png` (1.3 MB, 1024x1024)
   - Konsept: Karbon-kompozit mat radar soğurucu gövde, dönen tanyon sensör çanakları, turkuaz iyon itki egzozu, asteroid kuşağı arka planı.
2. **Ağır Nakliye Gemisi (Hephaestus):**
   - Varlık: `public/assets/art/transport.png` (1.9 MB, 1024x1024)
   - Konsept: Endüstriyel sınıf modüler konteyner blokları ("RAW ORE" ve "CRYSTAL CONTAINERS"), ağır manevra iticileri, turuncu uyarı flaşörleri ve vinç kolları.
3. **Plazma Avcı Gemisi (Interceptor):**
   - Varlık: `public/assets/art/fighter.png` (1.3 MB, 1024x1024)
   - Konsept: İleri delta kanat geometrisi, kanat uçlarında çift plazma raylı top, zırhlı kokpit kanopisi, eskort filosu arka planı.
4. **Savaş Gemisi / Dretnot (Dreadnought):**
   - Varlık: `public/assets/art/battleship.png` (1.5 MB, 1024x1024)
   - Konsept: Devasa omurga kütle hızlandırıcı raylı silahı, çoklu nokta savunma taretleri, hekzagonal deflektör enerji kalkanı ışıması ve komuta kulesi.
5. **Nexus Rölesi (Central Star Beacon):**
   - Varlık: `public/assets/art/nexus_relay.png` (1.5 MB, 1024x1024)
   - Konsept: Üçlü eşmerkezli jiroskopik dönen halkalar, mor tanyon ışıması yayan merkezi yıldız çekirdeği, orbital sensör kuleleri ve güneş panelleri.
6. **Yaşanabilir Terran Dünyası (Terran Planet):**
   - Varlık: `public/assets/art/terran_planet.png` (1.9 MB, 1024x1024)
   - Konsept: Yüksek yörüngeden gerçekçi gezegen küresi, yemyeşil kıtalar, derin mavi okyanuslar, dönen atmosferik bulutlar, gece tarafında şehir ışıkları.

### 2. Kalıcı Yerel Depolama & Performans
- Geçici CDN bağlantı süre aşımı riskini önlemek için tüm üretimler yerel diskte `public/assets/art/` klasörüne indirildi.
- Vite geliştirme sunucusunda ve üretim paketinde anında ve sıfır gecikmeyle servis edilmektedir.

### 3. İnteraktif Sanat & Konsept Galerisi (`src/ui/components/ArtGalleryModal.tsx`)
- **Çift Kolonlu Vitrin:** Sol panelde kategori hapları (Tümü, Gemiler, Yapılar, Gezegenler) ve varlık kartları; sağ panelde 1024x1024 kahraman görsel çerçevesi.
- **Teknik Özellikler & Oyun İçi Lore:** Her varlığın rolü, uçuş hızı, kalkan/gövde dayanımı, kargo kapasitesi ve oyun içi taktik önemi.
- **Lightbox Zoom & Magnific Bağlantısı:** Tam ekran inceleme ve orijinal Magnific stüdyo kayıt bağlantısı.

### 4. Oyun İçi Arayüz Entegrasyonları
- **Gemi Tersanesi (`ShipyardModal.tsx`):** Her gemi türünün üretim kartına yüksek çözünürlüklü konsept renderı yerleştirildi (hover zoom ve ışıma efektli).
- **Nexus Rölesi Paneli (`RelayModal.tsx`):** Kadim megastrüktür görseli, röle kontrol durumu ve sefer düğmesiyle bütünleşik kahraman afişi olarak eklendi.
- **Gezegen Paneli (`PlanetPanel.tsx`):** Gezegen başlığının yanına yüksek çözünürlüklü Terran küresi görsel rozeti eklendi.
- **Sistem İnceleme (`SystemInspectionModal.tsx`):** Yörünge slotlarında yaşanabilir Terran dünyaları mini küre renderı ile zenginleştirildi.
- **Üst Navigasyon (`TopBar.tsx`):** `Galeri` butonu eklendi.


