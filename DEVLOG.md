# Canlı Galaksi — Geliştirme Günlüğü (DevLog)

Bu dosya, GDD v0.1.0 doğrultusunda yapılan tüm mimari kararların, aşamaların ve değişikliklerin özet hafızasıdır.

---

## [2026-09-28] — Arayüz Sadeleştirmesi & Taktik İntikal Radarı (HUD Overhaul)

Kullanıcının talebi doğrultusunda:
- *"Oyunun arayüzünü komple sadeleştirme yoluna gidebilir miyiz? Mümkün olan her şeyi tooltipler veya açılabilir ekstra pencereler veya genişletilebilir menüler şekilde tasarlayalım. Net olarak görebileceğimiz bazı şeyler olsun. Kaç tane gezegenimiz olduğu, kaç tane gemimiz olduğu ve bunlara kolayca ulaşabildiğimiz gibi şeyler mutlaka panellerde bulunsun. Hareket halindeki filoları görebileceğimiz yerler olsun. Hem bizim hem düşmanın tespit ettiğimiz hareket halinde filoları gösteren ayrı bir panel olmalı."*

### 1. Üst Bar Sadeleştirmesi & Canlı Çipler (`TopBar.tsx`)
- Ekranı kapatan statik buton kalabalığı kaldırıldı.
- **🪐 Koloni Çipi (`X/Y Koloni`):** Zengin hover tooltip'i (ana dünya, koloniler, yüzey tipleri, aktif inşaatlar). Tıklama ile `PlanetPanel` (`F1`) açılır.
- **⚔️ Donanma Çipi (`X Gemi`):** Zengin hover tooltip'i (Kruvazör, Avcı, Nakliye, Keşif dağılımı, garnizon vs intikal sayıları). Tıklama ile Tersane (`F2`) açılır.
- **🛸 İntikal Radarı Çipi (`X İntikal` / `🚨 1 TEHDİT!`):** Canlı hareket eden filo sayısını ve yaklaşan tehditleri gösterir. Tıklama ile Radarı (`F4`) açılır.
- **Kaynak Göstergeleri:** Saatlik gelir ve kapasite dökümü hover tooltip'lerine taşındı, üst bar minimalist ve okunaklı hale getirildi.

### 2. Taktik İntikal Radarı (`FleetTransitRadarModal.tsx` & `F4`)
- Tüm dost ve tespit edilen düşman uçuşlarını listeleyen dedicated panel.
- Canlı şematik rota (`[Kalkış] ──[% ilerleme]──▶ [Hedef]`), kalan süre, gemi kompozisyonu, %50 geri çağırma kilidi.
- `🎯 Haritada Odaklan`, `🔄 Geri Çağır` ve `🛡️ Savunmayı Aç` aksiyonları.

### 3. Haritayı Karartmayan Tehdit Şeridi (`IncomingThreatBanner.tsx`)
- Ekranın ortasını kapatan sabit şerit, sağ üstten küçültülebilir (`isMinimized`) hale getirildi.
- Küçültüldüğünde haritayı engellemeyen kompakt bir hap rozet olarak kalır. "Radarda İncele" butonu eklendi.

### 4. Alt Operasyon Paneli & Entegrasyonlar
- `StellarisBottomDeck`: Başlığa `[🛸 Taktik Radar]` butonu eklendi.
- `StellarisNotificationStrip`: Tehdit bildirimine tıklandığında doğrudan İntikal Radarı açılır.

---

## [2026-09-28] — Sürüklenebilir/Katlanabilir Filo Kartı (Floating HUD) & Galaksi/Sistem Rota Görünürlüğü

Kullanıcının talebi doğrultusunda:
- *"Bütün panelleri yani sağ sol alt paneller dursun. Ama onun dışında alttan açılan diğer panelleri hareket eden bir filonun detay paneli gibi. Bunun gibi panelleri tıklayınca pop-up gibi açılan kartlar yapalım."*
- *"Harita üzerinde mutlaka görelim rotalarıyla birlikte. Sistem haritasında mutlaka görelim. Sistemler arası hareket eden filoları da yine galakside görebilmeliyiz."*
- *"Açılan yeni koyacağımız açılan kart şeklindeki paneller sürüklenebilir, küçültülebilir, genişletilebilir, kollaps edilebilir, ekspant edilebilir ve sağ üst köşesine tıklayarak kapatılabilir olsun."*

### 1. Sürüklenebilir, Katlanabilir & Boyutlandırılabilir Filo Kartı (`FleetCardHUD.tsx`)
- **Sürüklenebilir (Draggable Floating Window):**
  - Başlık alanından mouse ve touch ile ekranın herhangi bir yerine serbestçe taşınabilir (`onMouseDown`, `onTouchStart`, `onTouchMove`, `onTouchEnd`).
  - Ekran sınırları dışına kaçmaması için pencere koordinatlarına otomatik sınırlama (clamping) uygulandı.
- **Kollaps / Ekspant (Katlanabilir):**
  - `ChevronDown` / `ChevronUp` butonuyla kart, haritayı kapatmayacak mini bir başlık çubuğuna (`w-[360px]`) katlanabilir. Katlanmış modda filo adı, kalan süre ve hızlı geri çağırma butonu yer alır.
- **Küçültülebilir / Genişletilebilir (Kompakt vs Geniş Görünüm):**
  - `Maximize2` / `Minimize2` butonuyla `430px` (Kompakt Taktik HUD) ile `560px` (Genişletilmiş Detay Dosyası) arasında geçiş yapılabilir.
- **Sağ Üst Köşeden Kapatma:**
  - Sağ üstte net 'X' kapatma butonu ile panel anında kapatılabilir.
- **Taktik Bilgi & Aksiyonlar:**
  - Uçuş ilerleme çubuğu üzerinde %50 Geri Çağırma Kilidi (Point of No Return) göstergesi.
  - Kargo yük dökümü (Cevher, Kristal, Yakıt).
  - Gemi bileşimi (Keşif, Nakliye, Avcı, Savaş Gemisi), toplam saldırı gücü ve dayanıklılık.
  - Geri Çağır (`RotateCcw`), Rota Önle (`Crosshair`) ve Emirlere Git (`Send`) butonları.

### 2. Galaksi Haritası Rota Görünürlüğü (`GalaxyMap.tsx` & `GalaxyScene25D.tsx`)
- **Tüm Uçuş Rotası Gösterimi:**
  - **Kat Edilen Yol (Trail):** Başlangıç sisteminden filonun anlık koordinatına kadar kesikli iz çizgisi ve kalkış işaretçisi.
  - **Kalan Uçuş Vektörü (Trajectory):** Filonun anlık koordinatından hedef sisteme kadar animasyonlu neon akış çizgisi.
  - **Varış Hedef Halkası:** Hedef sistem üzerinde puls yapan varış waypoint halkası.
  - Filonun altında anlık gemi sayısı ve kalan varış süresi göstergesi.

### 3. Sistem İçi Haritada Filoların & Rotaların Gösterilmesi (`GalaxyMap.tsx` & `GalaxyScene25D.tsx`)
- **Sistem İçi Filo Katmanı (`systemActiveFleets`):**
  - **Sisteme Gelen Filolar (Inbound):** İlgili sistemin kenarındaki hiperuzay atlama şamandırasından (jump gate) varış gezegenine doğru yaklaşma rotası ve anlık konumu.
  - **Sistemden Ayrılan Filolar (Outbound):** Kalkış gezegeninden hedef sisteme giden çıkış şamandırasına doğru kalkış rotası ve anlık konumu.
  - **Yörüngedeki Filolar (Orbiting):** İlgili gezegenin veya merkezi yıldızın etrafında devriye yörüngesi çizen filo konumu ve yörünge çemberi.
  - **Sistem İçi Uçuşlar (Intra-system):** Gezegenler arası intikal rotaları.
- **2D & 3D Etkileşim:**
  - Hem 2D Vektör SVG modunda hem de Three.js 2.5D WebGL modunda filolar görünür, thruster alev efektleriyle parlar, tıklanabilir durumdadır ve tıklandığında yüzen `FleetCardHUD` kartını açar.

---

## [2026-09-28] — Taşı/Topla Glitch Düzeltmesi & Sol Menü Görünürlük/Altta Kalma Revizyonu

Kullanıcının *"taşı topla butonu seçilince glitch oluyor. ayrıca bazı left rail menüleri altta kalıp okunmuyor, genel bir menu arkaplanı ve görünürlülük testi yap de bütün hataları düzelt"* talebi doğrultusunda:

### 1. `Taşı/Topla` (Transport) Görevi Glitch ve Genişlik Atlama Düzeltmesi (`CommandPanel.tsx`)
- **Geçersiz Tailwind `w-88` Sınıfı Giderildi:** Tailwind varsayılanında `w-88` bulunmadığından çekmece genişliği içerik değiştikçe (`width: auto`) sağa sola sıçrıyordu. Panel `w-[380px] min-w-[380px] max-w-[380px] shrink-0` olarak sabitlendi.
- **Otomatik Nakliye Gemisi Ataması:** Kullanıcı "Taşı/Topla" butonuna bastığında garnizonda nakliye gemisi varsa ve seçili sayısı 0 ise otomatik 1 adet nakliye seçilerek kapasitenin `0` kalması ve hata durumu engellendi.
- **Yük Girdileri & Kapasite Aşımı Koruması:**
  - Girdiler temizlendi (`placeholder="0"`), negatif veya depodaki kaynağı aşan değerler engellendi.
  - "Oto Doldur (Cevher+Kristal)" ve "Sıfırla" hızlı önayar butonları eklendi.
  - Kargo filo kapasitesini aştığında kırmızı uyarı (`⚠️ Kapasite Aşıldı: X / Y`) verilerek sevk butonu otomatik kilitlendi.

### 2. Sol Menü (Left Rail) Docked Panellerinin Altta Kalması ve Okunurluk Revizyonu
- **Sabit Genişlikler:** Docked moddaki tüm paneller flex konteynerinde bozulmayacak net genişliklere bağlandı:
  - `PlanetPanel`: `w-[390px]`
  - `ShipyardModal`: `w-[480px]`
  - `ResearchModal`: `w-[480px]`
  - `SituationLogModal`: `w-[680px]`
  - `CombatReplayModal`: `w-[820px]`
  - `AllianceModal`: `w-[540px]`
  - `RelayModal`: `w-[540px]`
  - `ArtGalleryModal`: `w-[860px]`
- **Alt Boşluk (`pb-32`):** Tüm kaydırılabilir panellerin iç konteynerlerine `pb-32` (128px) alt boşluk eklendi. Böylece en alttaki butonlar ("İnşa Et", "Araştır", "Garnizon Tablosu", "İttifak Kur", "Röle Liderliği") ekranın alt kenarında kesilmez veya alt operasyon güvertesinin arkasında kaybolmaz.
- **Yüksek Kontrastlı Stellaris Arka Planı:** Yarı saydam açık renkler yerine derin obsidyen mavi/siyah (`bg-[#080d19]/98 border-[#1b314d]`) ve kartlarda `bg-[#0b1426] border-[#1b314d]` kullanılarak galaksi haritası önünde metinlerin parıldayan yıldızlarla karışması engellendi.
- **Düşük Çözünürlük Koruması:** `StellarisLeftRail` buton alanına `overflow-y-auto overflow-x-hidden scrollbar-none` ve `StellarisOutliner` gövdesine `pb-32` eklendi.

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

---

## [2026-09-27] — Faz D: Canlı 2D Vektör Galaksi Haritası & Dinamik Arayüz Grafikleri

Kullanıcının *"Hazırladığım imajlar çok güzel görünüyor ama grafik derken bunlardan bahsetmiyordum. Oyunun kendi grafikleri arayüzü yani gezegenler sistemleri galaksinin geri kalanı gibi yerleri daha dinamik animasyonlu ve daha güzel yapmalıyız. Gerçek dünya gibi 3D değil ama 2D gibi ama çok daha kaliteli görünen bir iş yapmak istiyoruz"* geri bildirimi doğrultusunda, oyunun harita, yörünge ve arayüz grafikleri baştan aşağı dinamik 2D görsel efektlerle donatıldı:

### 1. Canlı 2D Galaksi Haritası (`src/ui/components/GalaxyMap.tsx` & `src/index.css`)
- **Kozmik Arka Plan & Nebulalar:**
  - Farklı derinliklerde ve periyotlarda yanıp sönen 80 deterministik yıldızdan oluşan yıldız tarlası (`twinkle-star`).
  - Haritanın arka planında süzülen çok katmanlı, renk geçişli kozmik gaz bulutları (Kuzeybatı Turkuaz Nebulası, Merkezi Mor Kalıntı Bulutu, Güneydoğu Kehribar Maden Bulutu - `animate-nebula-drift`).
- **Taktik Radar & Sensör Taraması:**
  - Komutanın ana gezegeninden uzaya yayılan 360 derecelik dönen radar tarama çizgisi ve 45 derecelik hafif tarama konisi (`animate-radar-sweep`).
- **Akışkan Hiperhatlar (Hyperlanes):**
  - Durgun çizgiler yerine içinden sürekli enerji darbesi akan dinamik atlama hatları (`animate-hyperlane-flow`).
  - Bir hat üzerinde hareket eden filo varsa hat turuncu/amber renkte parlar, daha hızlı enerji aktarır (`animate-hyperlane-fast`) ve merkezinde nabız atan bağlantı düğümü belirir.
- **Dinamik Yıldız Sistemleri & Mikro Yörüngeler:**
  - Deterministik spektral sınıflandırma (Sol tipi sarı cüce, Rigel tipi mavi dev, Proxima tipi kırmızı cüce).
  - Her yıldızın etrafında nabız atan korona aurası (`animate-corona-pulse`) ve dönen güneş patlama ışınları (`animate-flare-pulse`).
  - **Minyatür Yörünge Hareketi:** Her yıldızın etrafındaki minik yörünge izlerinde dönen mikro gezegenler (`animate-spin-slow` / `animate-spin-medium`).
  - **Fraksiyon Bölge Halesi:** Kolonisi olan sistemlerde ilgili fraksiyonun renginde yayılan yumuşak etki aurası.
- **Merkezi Nexus Rölesi (Kadim Megastrüktür):**
  - Eşmerkezli iki jiroskopik mekanik halka: Dış halka saat yönünde 4 güneş paneliyle dönerken (`animate-spin-slow`), iç halka ters yöne döner (`animate-spin-reverse`).
  - Merkezde mor takyon tekilliği ve belirli aralıklarla uzaya yayılan darbe dalgası (`beacon-wave` / `animate-ping`).
- **Gelişmiş Filo Uçuş Grafikleri & Plazma Egzoz Kuyruğu:**
  - Uçuş yönünün tersine uzanan, motor itişiyle titreyen konik plazma egzoz alevi (`animate-exhaust`).
  - Amiral gemisi sınıfına özel detaylı 2D vektör gövde silüetleri (Savaş Gemisi, Avcı, Nakliye, Keşif).
  - Rota hedef çizgisi, %50 geri çağırma sınırı uyarısı ve hedef kilitleme halkaları.

### 2. Güneş Sistemi Orrery Yörünge İncelemesi (`src/ui/components/SystemInspectionModal.tsx`)
- Düz daireler yerine derinlikli **2D Güneş Sistemi Simülatörü**:
  - Solda alevli güneş çekirdeği, korona patlamaları ve manyetik ilmikler.
  - Astronomik mesafe göstergeli (AU) eliptik yörünge yayları.
  - **Biyom Tabanlı Küresel Gezegenler:**
    - 3D küre etkisi veren merkez dışı radyal gradyanlar ve atmosferik ışıma halkaları (`glow`).
    - Terran dünyasında dönen atmosferik bulut şeritleri.
    - Çöl dünyasında eğik, gölge düşüren **halkalı gezegen sistemi** (planetary rings).
    - Yıldızdan uzak tarafta küresel derinlik katan gece/gündüz sonlandırıcı gölgesi (terminator crescent).
    - Her gezegenin çevresinde dönen mikro ay uydusu.
    - Kolonileştirilmiş dünyalarda yörüngede dönen savunma istasyonu.

### 3. Gezegen Paneli & Canlı Arayüz Dokunuşları (`src/ui/components/PlanetPanel.tsx`)
- Sol paneldeki gezegen başlığında yumuşak atmosferik ışıma ve çevresinde dönen yörünge savunma uydusu.
- Bina inşaatı devam ederken sağa doğru akan holografik lazer ışıması (`animate-pulse`) ile donatılmış ilerleme çubuğu.

---

## [2026-09-27] — Faz E: 2D Stellaris Mimarisi & Çok Kademeli Yörünge-Galaksi Simülasyonu

Kullanıcının *"Gerçek bir yıldız sistemi gibi düşün gezegenler çok yavaş bir şekilde dönüyorlar, belki günde bir döngü olabilir. Bunun projeksiyonunu görebiliyoruz. Aynı şekilde sistemin bir tier üst uzay ortamında (lokal grup, galaksi vs.) da böyle dinamik bir yapı olmalı. Çokça yakına zumlayabilmeliyiz, o açıdan 2D bir Stellaris gibi olmalı"* vizyonu doğrultusunda, oyun motoruna ve harita arayüzüne çok kademeli 2D uzay mimarisi kazandırıldı:

### 1. Astronomik Yörünge Mekaniği Motoru (`src/engine/orbital.ts`)
- **Ağır ve Gerçekçi Döngü:** Her gezegen yuvası slotuna göre kalibre edilmiş gerçek Keplerian yörünge sürelerine bağlandı:
  - 1. Yuva (İç Gezegen): 14 saat / tam tur (25.7° / saat).
  - 2. Yuva (Ana Dünya / Yaşanabilir Terran): **Tam 24 Saat (1 Galaktik Gün)** periyot (15.0° / saat).
  - 3. Yuva (Dış Gezegen): 46 saat periyot (7.8° / saat).
  - 4. Yuva (Uzak Gaz/Buzul): 76 saat periyot (4.7° / saat).
- **Zaman Tabanlı Açısal Konumlandırma:**
  - $\theta(t) = \theta_0 + \frac{2\pi \cdot t}{\text{orbitalPeriodMs}}$ formülü ile gezegenlerin gerçek zamanlı $(x, y)$ koordinatları 0.85 izometrik derinlikle hesaplanır.
- **Yörünge Rota Projeksiyonu:**
  - Mevcut konumdan +12 saat sonrasına uzanan kesikli projeksiyon yayı.
  - Gelecekteki +2s, +6s ve +12s pozisyonlarını önceden gösteren hayalet projeksiyon noktaları (*ghost forecasts*).

### 2. Tier 2: Makro Galaksi Kümesi Görünümü (`GalaxyMap.tsx` — Galaksi Modu)
- **Kozmik Spiral Kollar:** 180 saniyede bir dönen devasa galaktik spiral gaz kolları (`animate-galaxy-spin`).
- **Sektörel Hiyerarşi Çemberleri:**
  - Nexus Çekirdek Sektörü (Kütleçekim dalgaları ve takyon tekilliği).
  - İç Yıldız Kuşağı (Bağlantılı çekirdek koloniler).
  - Dış Frontier Sınırı (Uzak araştırma ve akın sistemleri).
- Çift tıklama veya seçimle anında o sistemin içine dalma olanağı.

### 3. Tier 1: Stellaris Stili Sistem İçi 2D Orrery Görünümü (`GalaxyMap.tsx` — Sistem Modu)
- Doğrudan ana harita tuvalinde merkezlenen devasa yıldız sistemi:
  - Merkezde sol prominences ve korona fışkırmalarıyla alev saçan güneş.
  - Eliptik yörünge izleri ve açısal kılavuzlar (0°, 90°, 180°).
  - Fiziksel olarak yörüngesinde dönen 2D küresel gezegenler, gece/gündüz sonlandırıcı hilal gölgesi ve dönen uydular.
  - Sistem çeperinde (410px mesafede) komşu sistemlere açılan **Hiperhat Atlama Şamandıraları** (*Hyperlane Warp Buoys*).
  - Gezegen üzerine gelindiğinde canlı **Yörünge Telemetri Kartı** (Açı, Hız, AU Mesafesi, Periyot, Hakimiyet).

### 4. Kesintisiz Stellaris Gezinme HUD'ı
- Haritanın altında yüzen mod çubuğu: `[ 🌌 Galaksi Haritası (12 Sistem) ]` | `[ 🪐 {Sistem} Yörünge Sistemi ]`.
- Hızlı sistemler arası geçiş sağlayan `< Önceki Sistem` ve `Sonraki Sistem >` okları.
- Yörünge gelecek projeksiyonlarını tek tıkla gizleme/gösterme anahtarı.

---

## [2026-09-27] — Faz F: Three.js ile 2.5D WebGL Uzay Motoru Entegrasyonu

Kullanıcının Unity yerine *"Web + Three.js (2.5D) açık ara en doğru yoldur"* stratejik kararı doğrultusunda, oyunun harita katmanı Three.js WebGL motoruyla gerçek 2.5D uzay ortamına kavuşturuldu:

### 1. 2.5D İzometrik Uzay Sahnesi (`src/ui/components/GalaxyScene25D.tsx`)
- **İzometrik Eğik Kamera Açısı:** 55 derecelik açıyla uzay düzlemine bakan dinamik perspektif kamera (Stellaris / Homeworld hissi).
- **Yıldız Merkezli Dinamik Işıklandırma (`PointLight`):**
  - Her yıldızın merkezine yerleştirilen ışık kaynağı, çevresindeki 3D gezegen kürelerini aydınlatır.
  - Gezegenlerin arkasında güneşten uzağa düşen gerçek fiziksel gölgeler oluşur.
- **3D Gezegen Küreleri & Biyom Malzemeleri:**
  - Terran: Okyanuslar, kıtalar ve üzerinde bağımsız dönen şeffaf 3D bulut küresi (`getTerranTexture()`, `getCloudTexture()`).
  - Çöl Gezegeni: Ekvatorunda 60 derece eğik yerleştirilmiş gerçek 3D gezegen halkası (`THREE.RingGeometry`).
  - Okyanus, Buzul ve Volkanik PBR malzemeleri.
- **1200 Parçacıklı 3D Derin Uzay Yıldız Tarlası:**
  - Derinlikte süzülen çok katmanlı yıldızlar.
- **İnteraktif Kontroller:**
  - Sol tıkla sürükleme: Serbest pan/kaydırma.
  - Fare tekerleği: Pürüzsüz yakınlaşma/uzaklaşma (zoom).
  - Tıklama: Işın dökümü (*Raycasting*) ile yıldız ve gezegen seçimi.

### 2. Sıfır Ağ Bağımlılıklı Prosedürel Doku Motoru (`src/ui/components/proceduralTextures.ts`)
- Harici dosya indirme gecikmesini önlemek için HTML5 Canvas üzerinde çalışan procedürel doku üreteçleri.
- Anında yüklenme, sıfır gecikme ve kalıcı önbellekleme (*texture caching*).

### 3. Çift Motorlu Hibrit Harita Deneyimi (`src/ui/components/GalaxyMap.tsx`)
- Sol üstteki `[ 🚀 2.5D WebGL ]` ve `[ 🛰️ 2D Vektör ]` düğmeleriyle oyuncu dilediği zaman 2.5D Three.js WebGL motoru ile 2D taktik SVG haritası arasında tek tıkla geçiş yapabilir.
- Tüm React arayüzü (Tersane, İttifak, Liderlik Tablosu, Komuta Paneli) 3D sahne üzerinde kesintisiz çalışmaya devam eder.

---

## [2026-09-27] — Faz G: 2.5D Makro Kozmik Dinamikler, 3D Filo Uçuşları & Derin Stellaris Yakınlaşması (Deep Zoom)

Kullanıcının *"Aynı şekilde sistemin bir tier üst uzay ortamında (lokal grup, galaksi vs.) da böyle dinamik bir yapı olmalı. Çokça yakına zumlayabilmeliyiz, o açıdan 2D bir Stellaris gibi olmalı"* direktifi doğrultusunda Three.js 2.5D motoru tam kapsamlı Stellaris deneyimine yükseltildi:

### 1. Makro Galaksi Katmanı: Dönen Spiral Kollar & Kozmik Gaz Bulutu
- **Merkezi Nexus Spiral Disk:**
  - Galaksi merkezindeki Nexus Röle İstasyonu çevresinde (500, 400) dönen iki kollu logaritmik spiral disk (`AdditiveBlending` ile 900 parçacıklı gaz tozu).
  - Merkeze yakın parlak mor/eflatun çekirdek, kollarda siyan/turkuaz ve dış sınırda koyu kobalt mavi renk tonlaması.
  - Galaksinin yaşayan bir kozmik organizma gibi hissettirmesi için sürekli çok yavaş rotasyon (`rotation.z += 0.00018`).
- **3D Takımyıldız ve Sektör Sınır Halkaları:**
  - Nexus Çekirdek Sektörü ($r=140$, mor halka), İç Yıldız Kuşağı ($r=265$, siyan halka) ve Dış Frontier Sınırı ($r=410$, çelik mavisi halka).

### 2. Dinamik Hiperhatlar & Akışkan Altuzay Enerji Paketleri
- Sistemler arası hiperhatlar boyunca sürekli hareket eden siyan altuzay enerji parçacıkları (`LanePulse`).
- Her hiperhattın sistem giriş-çıkış noktalarında dönen şamandıra portalları (`Warp Gate Buoys`).

### 3. 3D Dinamik Filo Uçuşları & Plazma İtki Konileri
- **Fiziksel 3D Gemi Gövdeleri:** Uçuş halindeki (`in_transit`, `returning`, `intercepting`) filolar rotaları boyunca gerçek zamanlı 3D koordinatlarında (`getFleetCurrentPosition`) modellenir.
- **Yönelme (Flight Vector):** Gemi burnu seyahat ettiği hedef yıldıza doğru otomatik olarak döner (`atan2`).
- **Plazma İtki Alevi:** Motorun arkasında gerçek zamanlı nabız gibi atan siyan/kırmızı plazma egzoz konisi (`thrusterCone`) ve parıltı sisi (`glowSprite`).
- **Işın Dökümü ile Filo Seçimi:** Oyuncu 3D uzayda uçan filolara tıkladığında telemetri kartı ve filo ayrıntıları anında açılır.

### 4. Derin Stellaris Yakınlaşması (Deep Zoom) & Kesintisiz LOD
- **Geniş Zoom Aralığı:** Makro galaksi görünümünden ($z=1350$) gezegen atmosferinin dibine kadar ($z=45$) kesintisiz yakınlaşabilme.
- **Çift Tıklama ile İniş (Stellaris Fly-In):**
  - Herhangi bir yıldıza çift tıklandığında kamera pürüzsüz bir eğriyle yıldız sistemine dalar ve sistem orrery modunu açar.
  - Herhangi bir gezegene çift tıklandığında kamera doğrudan o gezegenin yörüngesine kilitlenir ($z=65$).
- **Gezegen Çevresi 3D Detaylar:**
  - Doğal uydular (Moonlets) gezegenin çevresinde bağımsız yörüngede döner.
  - Oyuncuya ait kolonilerde gezegen yörüngesinde dönen 3D Yörünge Savunma İstasyonları / Yıldızüsleri.
  - Atmosferik ışıma hale spreyleri (`getAtmosphereTexture`).
- **Sıfır Çöp Toplayıcı (Zero GC Allocation):** Geometri ve malzemeler dinamik havuzda tutulur; her karede yeni geometri tahsis edilmeyerek yağ gibi akıcı 60 FPS garantilenir.

---

## [2026-09-27] — Faz H: Gezegen Telemetrisi, Yörünge Randevusu (Orbital Rendezvous) & 3D HUD İyileştirmeleri

Kullanıcının ağır tempolu ve dinamik astronomik yörünge mekaniği vizyonu (`Keplerian orbits + slow flight pacing`) doğrultusunda stratejik planlama derinleştirildi:

### 1. Sistem İçi Gezegen Telemetri HUD Kartı (`GalaxyMap.tsx`)
- Yalnızca fare üzerine gelindiğinde değil, 3D WebGL veya 2D modunda herhangi bir gezegen tıklandığında/seçildiğinde de anında açılır.
- **Canlı Yörünge Metrikleri:** Gezegenin anlık yörünge açısı ($\theta^\circ$), periyodu, açısal hızı ($^\circ/\text{saat}$), yıldız mesafesi (AU) ve kolonizasyon/hakimiyet durumu.
- **Projeksiyon Tablosu:** +2 saat, +6 saat ve +12 saat sonraki yörünge açıları kompakt bir tahmin kartında sunulur.

### 2. Astrodinamik Yörünge Randevusu Telemetrisi (`CommandPanel.tsx`)
- Komuta Panelinde hedef olarak bir gezegen seçildiğinde, filonun tahmini seyahat süresi boyunca gezegenin yörüngesinde kat edeceği açısal mesafe ($\Delta \theta = \omega \cdot \Delta t$) hesaplanır.
- **Varış Randevusu Göstergesi:**
  - Filo gezegene vardığında gezegenin bulunacağı tam açı ($\theta_{\text{varış}}^\circ$) ve uçuş boyunca kat edeceği yörünge ilerlemesi oyuncuya gösterilir.
  - Ağır tempolu uzay stratejisinde hareketli gezegen hedeflerine yönelik gerçekçi astrodinamik planlama hissi pekiştirildi.

---

## [2026-09-27] — Faz I: Otantik Stellaris İki Kademeli (Two-Tier) Harita Mimarisi

Kullanıcının *"tek sistemi görmeliyiz, diğer sistemlere geçmek için bir üst haritaya (galaxy map) geçip oradaki sistemleri ve birbirlerine nasıl bağlandıklarını görmeliyiz, stellaris gibi yani"* direktifi doğrultusunda harita mimarisi iki bağımsız ve birbirine bağlı kademeye ayrıldı:

### 1. İzole Sistem Görünümü (System View — Micro)
- **Görsel İzolasyon:** Sistem moduna geçildiğinde (`viewMode === 'system'`), makro galaksi katmanı (`galaxyMacroGroup`) tamamen gizlenir. Diğer sistemler, makro hiperhatlar ve sektör halkaları görüşten kaldırılır.
- **Merkezi Yıldız ve Keplerian Yörüngeler:** Odaklanılan sistem (500, 400) merkezine yerleştirilir. Merkezde 360° termal plazma konveksiyonuna sahip yıldız (`getSunTexture` veya mor Nexus çekirdeği), çevresinde gerçek zamanlı dönen yüksek detaylı gezegenler, bulut katmanları, uydular ve yörünge istasyonları yer alır.
- **Çevre Hiperhat Atlama Kapıları (Perimeter Jump Gates — $r=380$):**
  - Sistem dış sınırında, hiperhatla bağlı komşu sistemlerin galaktik açılarına yönelik 3D atlama şamandıraları (`buoy`) ve dışa dönük yönlendirme okları (`➔ Rigel`, `➔ Sol`) yer alır.
  - Bir atlama şamandırasına tıklandığında veya çift tıklandığında warp efektiyle anında o komşu sistemin yörünge görünümüne atlanır.

### 2. Üst Galaksi Haritası (Galaxy Map — Macro)
- **Tüm Sektör Görünümü:** 12 yıldız sistemi, aralarındaki hiperhat tüpleri ve enerji darbeleri (`LanePulse`), filolar, dönen spiral kollar ve sektör sınırları görünür.
- **Sisteme Giriş:** Herhangi bir yıldıza çift tıklandığında veya sol üst/alt bardaki `[🪐 Sisteme Gir]` butonuna tıklandığında doğrudan o sistemin izole yörünge görünümüne dalınır.

### 3. Hızlı ve Sezgisel Navigasyon Deneyimi
- **Ekmek Kırıntısı (Breadcrumb):** Sistem görünümündeyken sol üst köşede belirgin ve parlayan `[⬅ Galaksi Haritası (Esc / M)]` butonu yer alır.
- **Sistem Döngüsü:** Sistem görünümünde galaksiye dönmeden sistemler arasında gezebilmek için sol üstte `[◀ Önceki]` `{Sistem Adı}` `[Sonraki ▶]` döngü kontrolü sunulur.
- **Boş Uzaya Çift Tıklama:** Sistem görünümünde herhangi bir nesneye tıklanmadan boş uzay boşluğuna çift tıklandığında Stellaris'teki gibi doğrudan galaksi haritasına çıkılır.
- **Tekerlek Zoom Eşiği:** Sistem görünümünde fare tekeriyle dışarı zoom yapıldığında eşik ($z > 380$) aşıldığında pürüzsüzce galaksi haritasına dönülür.
- **Klavye Kısayolları (Hotkeys):** `Esc` veya `M` tuşlarına basıldığında iki harita kademesi arasında anında geçiş yapılır.

---

## [2026-09-27] — Faz J: Kozmik Ambiyans Sentetizörü, Yörünge Devriye Gemileri & Doğrudan Taktik Sefer Yönetimi

### 1. Web Audio API Tabanlı Prosedürel Kozmik Ambiyans ve Ses Efektleri (`sound.ts`, `TopBar.tsx`)
- **Prosedürel Derin Uzay Drone'u:**
  - Sıfır harici dosya yüküyle çalışan Web Audio çift osilatörlü (55 Hz sinüs + 55.5 Hz üçgen sub-bass shimmer) rezonanslı alçak geçiren filtre tasarımı.
  - Galakside derin yıldızlararası köprü hissi veren yumuşak 2 saniyelik fade-in ve fade-out dinamikleri.
- **TopBar Ses & Ambiyans Düğmesi:**
  - Oyuncu üst barda yer alan `[🔊 Ses: Açık]` / `[🔇 Ses: Kapalı]` butonuyla ses efektlerini ve ambiyansı tek tıkla açıp kapatabilir.
- **Taktik Ses Efektleri:**
  - Kolonizasyon ve seviye tamamlama için `C5-E5-G5-C6` zafer akoru (`playColonize`).
  - Çatışma ve lazer vuruşları için `playLaser`.

### 2. Kolonilerde 3D Yörünge Devriye Gemileri (`GalaxyScene25D.tsx`)
- Sistem görünümünde (`isSystemMode`) oyuncunun veya botların kolonize ettiği gezegenlerin etrafında eğik açılı yörüngelerde devriye gezen 3D delta gövdeli avcı gemileri ve parlayan iyon/plazma itki alevleri eklendi.
- Filonun ve gezegen garnizonunun varlığı görselleştirilerek kolonilerin yaşayan, korunan birer üs olduğu hissi güçlendirildi.

### 3. Telemetri Kartından Tek Tıkla Sefer Sevk Etme & Otomatik Görev Tespiti (`GalaxyMap.tsx`, `CommandPanel.tsx`)
- Sistem haritasında bir gezegen incelendiğinde telemetri kartının altında doğrudan bağlamsal operasyon butonları açılır:
  - **Boş Gezegen:** `[🏛️ Koloni Seferi Düzenle]` — Tek tıkla Komuta Panelinde kolonizasyon modunu açar, 1 nakliye gemisi ve gereken kaynakları otomatik doldurur.
  - **Düşman Kolonisi:** `[⚔️ Taarruz / Baskın Düzenle]` — Tek tıkla saldırı görevini seçip taktik kazanma ihtimalini hesaplar.
  - **Oyuncunun Kolonisi:** `[📦 İkmal / Transfer Seferi]` — Gezegenler arası ikmal görevini hazırlar.
- Komuta Paneli hedef değişimlerini otomatik dinleyerek (`useEffect`) oyuncuyu zahmetli menü geçişlerinden kurtarır.

---

## [2026-09-27] — Faz K: Harita Navigasyonu, Tıklama ve Zoom İyileştirmeleri (Bug Temizliği)

### 1. Yıldız Tıklama & Sistemde Kalma Garantisi
- **Kök Neden:** 
  - `systemOrreryGroup` içindeki merkezi yıldıza (`centralStarMesh`, `udata.type === 'star'`) tıklandığında veya çift tıklandığında bu nesne tipi `onDoubleClick` ve `onClick` içinde ayrıştırılmadığı için boşluğa çift tıklanmış gibi algılanıp galaksi haritasına geri dönülüyordu.
  - Ayrıca `raycaster` tüm sahneyi (`scene.children`) taradığı için arka plandaki makro yıldızlar ve dev korona sprite'ları tıklamayı yutabiliyordu.
- **Çözüm:**
  - Raycaster sorguları aktif kademeye sınırlandı (`isSystemMode ? systemOrreryGroup.children : galaxyMacroGroup.children`).
  - Merkezi yıldız (`type === 'star'`) tıklaması ve çift tıklaması özel olarak dinlendi; tıklandığında yalnızca ses çalar, yıldız/sistem seçilir ve sistem görünümünden asla çıkılmaz.
  - Sistem görünümünde yıldız seçildiğinde merkezi yıldızı çevreleyen taktiksel seçim retikülü (`reticleMesh`) eklendi.
  - Hem 2.5D WebGL hem de 2D SVG modunda merkezi yıldıza tıklanması güvene alındı.

### 2. Zoom Out ile Galaksiye Otomatik Geçişin Kaldırılması
- **Kullanıcı Talebi:** Zoom out yapıldığında galaksiye atmasın; serbestçe geriye zoom yapılabilmeli, galaksiye yalnızca bilinçli çift tıklama veya butonla geçilebilmelidir.
- **Çözüm:**
  - `onWheel` içerisindeki `targetCameraPos.z > 380` otomatik çıkış mekanizması tamamen kaldırıldı.
  - Sistem modundaki maksimum geri çekilme mesafesi (`maxZ`) 420'den 700'e çıkarılarak oyuncunun tüm sistemi, hiperkapıları ve derin uzayı rahatça geniş açıdan inceleyebilmesi sağlandı.
  - Galaksiye geri dönüş yalnızca boş uzaya çift tıklama, `Esc`/`M` tuşları veya arayüzdeki "Galaksi Haritası" butonuyla gerçekleştirilir hale getirildi.

### 3. Dekoratif Nesnelerin Raycast Yutma Engeli & Kamera Pan İyileştirmesi
- `animate()` döngüsündeki per-frame `targetLookAt.set(500, 400, 0)` sıfırlaması kaldırılarak fare ile sürükleyerek serbest kamera kaydırma (pan) hareketi pürüzsüz hale getirildi.

---

## [2026-09-28] — Faz L: Derin Cilalama (Görsel Zenginlik, Canlı Hover Telemetrisi, Gece Şehir Işıkları ve Hiperspace Warp Tüneli)

### 1. Kolonize Dünyalarda Gece Şehir Işıkları (`proceduralTextures.ts`, `GalaxyScene25D.tsx`)
- Kolonize edilmiş tüm gezegenlere (oyuncu ve botlar) procedural `getCityLightsTexture` emisif dokusu entegre edildi.
- Üslerin ve kolonilerin karanlık yarımküresinde (gece tarafında) metropol şehir ışık kümeleri altın/fraksiyonel renklerle parlar.
- Gezegen döndükçe şehir ışıkları gece-gündüz hattında (terminatör) belirip kaybolur; Stellaris kalitesinde yaşayan bir medeniyet hissi sunar.

### 2. Canlı 3D Hover & Telemetri Entegrasyonu (`GalaxyScene25D.tsx`, `GalaxyMap.tsx`)
- 2.5D WebGL sahnesinde fare hareketleri dinamik olarak raycast edilmeye başlandı (`onMouseMove`).
- Fare bir gezegenin, yıldızın, hiperkapının veya filonun üzerine geldiğinde imleç anında `pointer` haline gelir ve hassas bir mikro ses tonu (`sound.playHover()`) çalar.
- Fare bir 3D gezegenin üzerindeyken sağ üstteki "Gezegen Telemetrisi & Sefer Kartı" otomatik açılır; gerçek zamanlı yörünge açısı, hız, gelecek projeksiyonları ve tek tıkla sefer butonları gösterilir.
- Fare altındaki gezegeni vurgulayan yumuşak 3D siber retikül halkası (`hoverReticleMesh`) eklendi.

### 3. Hiperspace Warp Tüneli Geçiş Efekti (`GalaxyScene25D.tsx`)
- Galaksi haritasından bir sisteme girerken veya sistemler arası geçiş yaparken 160 iyonik hız çizgisinden oluşan hiperspace warp tüneli (`warpTunnel`) devreye girer.
- Kamera derinliğe doğru dalar veya geri çekilirken spiral şeklinde dönen siyan-mor warp izleri ve derin warp sesi (`sound.playWarp()`) ile geçiş sinematik bir his kazanır.

### 4. Taktik Filo Kalkış Sesi & Komuta Paneli Cilalaması (`sound.ts`, `CommandPanel.tsx`)
- Filo sevk edildiğinde derin plazma motoru ivmelenmesi ve alçak frekanslı roket ateşleme ses efekti (`sound.playLaunch()`) eklendi.
- Komuta panelinde sefer emri verildiğinde oyuncuya güçlü ve tatmin edici bir işitsel geri bildirim sunuldu.

---

## [2026-09-28] — Faz M: Sinematik Muharebe Tekrarı, Dokunsal İşitsel Geri Bildirim ve Entegre Altyapı Kısayolları

### 1. Sinematik Çatışma Tekrarı & Animasyonlu Lazer Koridoru (`CombatReplayModal.tsx`)
- **Otomatik Oynatma (Autoplay):** Savaş kayıtlarında turları otomatik olarak sırayla oynatan `[▶ OTOMATİK OYNAT]` ve `[⏸ DURAKLAT]` kontrolü eklendi.
- **Dinamik Lazer Ateşi Koridoru:** Saldırganın plazma atışları (sol-kızıl), savunucunun darbe lazeri (sağ-mavi) ve ortada parlayan enerji çarpışma çekirdeği ile her turun hasar takası animasyonlu bir koridorda görselleştirildi.
- **Tur Başı Lazer Ses Efekti:** Her tur değişiminde ve otomatik oynatmada `sound.playLaser()` tetiklenerek çatışma anının gerilimi artırıldı.

### 2. Gezegen Altyapısı Hızlı Kısayolları & Taktik Sesler (`PlanetPanel.tsx`, `App.tsx`)
- **Doğrudan Üretim & Teknoloji Kısayolları:** Gezegende Seviye 1+ Tersane veya Araştırma Laboratuvarı olduğunda, bina listesinde ilgili binanın yanında `[🚀 Tersane]` ve `[🧭 Ar-Ge]` hızlı erişim butonları belirdi.
- **Taktik Tıklama Geri Bildirimi:** Koloni hapları seçimi, savunma duruşu değişimleri (`Konumu Tut` / `Filoyu Koru`) ve bina yükseltmelerine anında `sound.playClick()` ses geri bildirimi bağlandı.

### 3. Tersane, Teknoloji & Röle Seferlerinde İşitsel Entegrasyon (`ShipyardModal.tsx`, `ResearchModal.tsx`, `RelayModal.tsx`)
- **Tersane Üretimi:** Gemi siparişi verildiğinde `sound.playClick()`.
- **Teknoloji Geliştirme:** Yeni bir tanyon motoru, plazma silahı veya sensör dizini araştırıldığında muzaffer `sound.playColonize()` akoru.
- **Röle Seferi:** Merkezi Nexus Megastrüktürüne sefer emri verildiğinde derin roket ateşleme sesi `sound.playLaunch()`.

### 4. Arayüz Ergonomisi & Katman Ayrıştırma (`EventFeed.tsx`)
- Ekranın sol altındaki olay bildirim akışı (`bottom-16 max-w-lg`) konumuna taşınarak haritanın alt-orta kısmındaki 2D/2.5D ve Sistem/Galaksi geçiş çubuğu ile çakışması önlendi.

---

## [2026-09-28] — Faz N: Stellaris Arayüz Revizyonu (Left Rail, Signature Outliner, Dynamic Drawers, Resource Clusters)

### 1. Sol Dikey Navigasyon Şeridi (`StellarisLeftRail.tsx`)
- Stellaris'in ikonik sol menü çubuğu oyuna uyarlandı:
  - Üstte aktif fraksiyonun rengiyle parlayan İmparatorluk Arması (Empire Crest).
  - Koloniler & Altyapı (`Globe`), Tersane (`Wrench`), Ar-Ge (`Activity`), Taktik Komuta (`Send`), Savaş Kayıtları (`Swords`), Nexus Rölesi (`Crown`), İttifak (`Users`), Sanat Galerisi (`Palette`).
  - Altta Tanrı Modu gözü, Ses Aç/Kapa ve Tatil modu butonları.
  - Kısayol tuşları entegre edildi: `F1` Koloniler, `F2` Tersane, `F3` Ar-Ge, `F4` Komuta, `Esc` açık çekmeceleri kapatma.

### 2. İmparatorluk Sektör Çizelgesi (`StellarisOutliner.tsx`)
- Stellaris'in vazgeçilmez sağ genel bakış çizelgesi (Outliner) geliştirildi:
  - **Koloniler:** Tüm oyuncu dünyaları, ana gezegen rozeti, garnizon sayısı, savunma duruşu ve anlık inşaat/yükseltme mini ilerleme çubukları.
  - **Muharip Filolar:** Avcı ve savaş gemisi filoları, anlık durumları (`Rotada`, `Geri Dönüş`, `Önleme`, `Yörüngede`), gemi sayısı ve kalan varış süresi.
  - **Sivil Filolar:** Koloni ve keşif seferleri rotaları ve süreleri.
  - **Nexus Megastrüktürü:** Merkezi röleyi elinde tutan güç ve haftalık skor.
  - **Düşman Harekâtı & Tehditler:** Oyuncunun sistemlerine yönelen düşman baskın filoları için nabız gibi atan kırmızı alarm kartları.
  - Tek tıkla genişletme/daraltma (`ChevronLeft` / `ChevronRight`) ve her bileşende işitsel geri bildirim.

### 3. Üst Barın Stellaris Mimarisine Yükseltilmesi (`TopBar.tsx`)
- **İmparatorluk Kimliği:** Fraksiyon arması, imparatorluk unvanı ve perspektif seçici.
- **Kaynak Kümeleri:** Cevher, Kristal ve Yakıt için anlık miktar, saatlik net üretim, depo doluluk gösterge çubuğu (`%xx`) ve depo sınırı.
- **Donanma Kapasitesi & Gücü:** İmparatorluk genelindeki toplam garnizon ve filo gemi adedi rozeti (`🛡️ Donanma: 24 Gemi`).
- **Kozmik Saat & Hız:** `YIL 2240 • GÜN 1 • 14:32:00` saati, Stellaris tarzı dokunsal hız butonları (`⏸`, `▶ 1x`, `▶▶ 5x`, `▶▶▶ 20x`, `+15dk`, `+1sa`).

### 4. Akışkan Sinematik Galaksi Sahnesi & Çekmece Mimarisi (`App.tsx`, `GalaxyScene25D.tsx`)
- 3 sütunlu katı düzen yerine harita ekranın merkezini devasa ve kesintisiz şekilde dolduracak şekilde yapılandırıldı.
- `PlanetPanel` ve `CommandPanel` ihtiyaç duyulduğunda açılan ve kapatılabilen (`[X]` butonlu) şık kayar çekmeceler (Drawers) haline getirildi.
- `GalaxyScene25D` bileşenine `ResizeObserver` eklenerek paneller açılıp kapandığında 3D WebGL kamerasının ve render alanının sıfır gecikmeyle pürüzsüzce ölçeklenmesi sağlandı.

---

## [2026-09-28] — Faz O: Stellaris Filo Denetim Kartı (Fleet Card HUD), Fraksiyon Hakimiyet Auraları, Sistem Durum Plakaları ve Anomali Olay Modülü

### 1. Stellaris Alt Filo Denetim Kartı (`FleetCardHUD.tsx`, `App.tsx`)
- **İkonik Alt Filo Paneli:** Haritadan veya sağ İmparatorluk Outliner'ından bir filo seçildiğinde ekranın alt ortasında beliren şık, saydam arka planlı Stellaris tarzı filo denetim kartı.
- **Komutan & Sancak Bilgisi:** Filo sahibi fraksiyonun renginde üst vurgu çizgisi, fraksiyon arması, filo adı ve sefer türü rozeti (`İkmal`, `Koloni`, `Keşif`, `Taarruz`, `Önleme`, `Destek`).
- **Muharebe Gücü & Gemi Dökümü:** Toplam saldırı ve dayanıklılık (gövde + kalkan) puanları; `Keşif`, `Nakliye`, `Avcı` ve `Savaş Gemisi` adetleri minyatür rozetlerle sergilendi.
- **Uçuş İlerlemesi & %50 Geri Çağırma Kilidi:** Çıkış-varış arasındaki uçuş yüzdesi, kalan varış süresi ve GDD kuralı olan %50 uçuş süresi aşıldığında devreye giren kilit göstergesi (`🔒 Geri Çağırma Kilitli`).
- **Taktik Hızlı Emirler:** Şartlar uygunsa tek tıkla `[Geri Çağır]`, `[Komut Güvertesini Aç]` (ayrıntılı filo sevk paneline geçiş) ve kapatma butonları.

### 2. Fraksiyon Hakimiyet Auraları & Sektör Sınırları (`GalaxyScene25D.tsx`, `GalaxyMap.tsx`, `proceduralTextures.ts`)
- **Prosedürel Hakimiyet Dokusu:** `getTerritoryInfluenceTexture(colorHex)` fonksiyonuyla yumuşak radyal ışık düşüşüne sahip yarı saydam fraksiyon etki alanı dokusu üretildi.
- **2.5D WebGL Katmanı:** Sistemlerin altına ($z = -2$) yerleştirilen additive blending özellikli territory mesh'leri sayesinde yıldız sistemleri etrafında Stellaris'teki gibi fraksiyon auraları oluşturuldu.
- **2D Vektör Katmanı:** SVG galaksi haritasında Layer 3.5'e fraksiyon renkli yumuşak sınır balonları eklenerek sistemlerin kime ait olduğu haritaya bakar bakmaz net biçimde anlaşıldı.

### 3. Zenginleştirilmiş Galaksi Sistem Durum Plakaları (`GalaxyScene25D.tsx`, `GalaxyMap.tsx`)
- **Stellaris Sistem Kartviziti:** Sistem etiketleri sadece sistem adından ibaret olmaktan çıkarılıp stratejik bilgi merkezine dönüştürüldü:
  - Hakim fraksiyonun renginde üst kenarlık çizgisi ve fraksiyon adı etiketi.
  - Kolonileştirilmiş gezegen sayısı (`🏛️ N`).
  - Koloniye uygun boş yuva sayısı (`🪐 N`).
  - İncelenmemiş anomali uyarısı (`★ KEŞİF`).
  - Çatışmalardan kalan hurda sahası (`⚙️ ENKAZ`).
  - Nexus merkezi için mor parıldayan (`⚡ RÖLE`) rozeti.

### 4. Anomali ve Durum Günlüğü Modülü (`AnomalyEventModal.tsx`, `SystemInspectionModal.tsx`)
- **Stellaris Durum Günlüğü / Olay Penceresi:** Sektörde karşılaşılan gizemli nesneler (`Terk Edilmiş Antik Kargo Gemisi`, `Yabancı Subspace Radyo Sinyali`, `Nadir Cevher Asteroit Kuşağı`) için lore metinleri, tarama analizleri ve ödül projeksiyonları içeren tam ekran olay diyaloğu geliştirildi.
- **Sistem Yörünge İncelemesi Entegrasyonu:** `SystemInspectionModal` içine anomali ve enkaz sahası tespit kartları eklendi. Oyuncu tek tıkla anomali raporunu açıp hızlı keşif seferi başlatabiliyor.

---

## [2026-09-28] — Faz P: Stellaris İmparatorluk Bildirim Rozetleri, Durum Günlüğü (Situation Log), Masaüstü Kısayolları ve Tersane Seri Üretim Sistemi

### 1. Stellaris İmparatorluk Bildirim Rozetleri Şeridi (`StellarisNotificationStrip.tsx`, `App.tsx`)
- **Dinamik Bildirim Çemberleri:** Üst kaynak çubuğunun altında beliren dairesel parlayan alarm rozetleri:
  - 🛡️/⚔️ Kırmızı Nabız: Düşman Baskını Uyarısı ve Muharebe Raporları
  - ⚡ Turkuaz: Tamamlanan Ar-Ge Teknolojileri
  - 🏛️ Zümrüt Yeşili: Yeni Kurulan Koloniler
  - 🚀 Mavi: Tersanede Üretimi Tamamlanan Gemi Partileri
  - ★ Kehribar: Keşfedilen Sektörler ve İncelenmemiş Anomaliler
  - ⚙️ Gri/Gül: Kurtarılabilir Savaş Enkazı Sahaları
  - 👑 Mor: Nexus Rölesi Hakimiyet Değişimleri
- **Taktik İpuçları & Etkileşim:** Rozet üzerine gelindiğinde zengin Stellaris stilinde tooltip kartı; Sol tık ile doğrudan ilgili sisteme/modala odaklanma; Sağ tık veya `[x]` butonu ile bildirimi arşivleme/kapatma.

### 2. Galaktik Durum & Keşif Kütüğü (`SituationLogModal.tsx`, `StellarisLeftRail.tsx`, `App.tsx`)
- **Stellaris F5 Durum Günlüğü:**
  - **Sekme 1 — Anomaliler & Enkazlar:** Sektördeki tüm POI'leri, araştırılma durumlarını ve toplanabilir ödülleri listeleyen; tek tıkla "Haritada Bul" veya "Raporu Aç" butonları sunan keşif konsolu.
  - **Sekme 2 — Nexus Rölesi Megastrüktürü:** Merkezi röleyi elinde tutan güç, haftalık yarışma puanı sıralaması ve doğrudan sefer başlatma emri.
  - **Sekme 3 — Aktif Seferler & İntikaller:** Oyuncunun seyir halindeki tüm filoları, hedefleri, görevleri ve canlı ETA geri sayımları.
- **Sol Şerit Entegrasyonu:** Sol dikey navigasyon rayına `Compass` simgesiyle F5 Durum Günlüğü butonu eklendi.

### 3. Otantik Stellaris Masaüstü Kısayolları (`App.tsx`)
- **Space (Boşluk Tuşu):** Simülasyonu anında duraklatma / devam ettirme (`Pause / Unpause`).
- **1, 2, 3, 4 Tuşları:** Simülasyon hız kademeleri (`1x`, `5x`, `20x`, `60x`).
- **F1 - F6 Fonksiyon Tuşları:**
  - `F1`: Koloniler & Gezegen Altyapısı
  - `F2`: Tersane & Gemi İnşası
  - `F3`: Ar-Ge & Teknoloji Ağacı
  - `F4`: Taktik Filo Sevk & Komuta
  - `F5`: Durum Günlüğü (Situation Log)
  - `F6`: Muharebe Raporları & Çatışma Tekrarı
- **Esc:** Açık olan tüm kayar çekmeceleri ve pencereleri tek tuşla kapatma.

### 4. Tersane Seri Üretim & Canlı İmalat İlerlemesi (`ShipyardModal.tsx`)
- **Hızlı Çarpan Preseleri:** Tek tek girmek yerine `+1x`, `+5x`, `+10x` ve mevcut kaynaklara göre anında hesaplanan `Maks (N)` butonları.
- **Canlı İmalat İlerleme Çubuğu:** Kuyruktaki gemiler için anlık tamamlanma yüzdesini gösteren parlayan turkuaz ilerleme çubuğu ve kalan süre sayacı.

---

## [Phase Q] — Tam Stellaris Arayüz Düzeni ve Pozisyonel Sadakat (TopBar, Left Rail F1-F9, Outliner, Bottom Deck)

### 1. Otantik Stellaris Üst Stratejik Kaynak Şeridi (`TopBar.tsx`)
- **Sol Köşe:** İmparatorluk Arması, Oyuncu / Otonom Bot perspektif seçicisi, İmparatorluk Ünvanı.
- **Orta Stratejik Kaynak Şeridi:**
  - ⚡ **Enerji / Yakıt:** Canlı rezerv, saatlik üretim (`+X`), depo doluluk çubuğu.
  - ⛏ **Cevher / Maden:** Canlı rezerv, saatlik üretim (`+X`), depo doluluk çubuğu.
  - 💎 **Nadir Kristaller:** Canlı rezerv, saatlik üretim (`+X`), depo doluluk çubuğu.
  - 🔬 **Ar-Ge / Bilim:** Aktif araştırma kuyruğu (`Motor L2`, `Silah L3`, `Sensör L1`) veya kümülatif teknoloji düzeyi. Tıklandığında doğrudan `F3` Teknoloji penceresini açar.
  - 🪐 **Koloniler:** `1/3` yuva sayısı. Tıklandığında doğrudan `F1` Gezegen Altyapı çekmecesini açar.
  - 🛡️ **Donanma Kapasitesi:** Toplam filolar + garnizon gemi sayısı (`14 / 30 Donanma`). Tıklandığında doğrudan `F2` Tersanesini açar.
  - 👑 **Nexus Rölesi Skoru:** Haftalık sektör kontrol puanı. Tıklandığında doğrudan `F8` Röle penceresini açar.
- **Sağ Köşe:**
  - Kozmik Güneş Saati (`YYYY.MM.DD`, örn: `2240.04.12`).
  - Duraklatma Butonu (`⏸ DURAKLATILDI` / `▶ ÇALIŞIYOR`, `Space`).
  - Hız Kademesi Seçici (`>`, `>>`, `>>>`, `>>>>`, `1-4`).
  - Hızlı Zaman Atlatıcı (`+15dk`, `+1sa`).
  - Ses, Sis / Gözlemci Modu ve Simülasyon Sıfırlama.

### 2. Sol Dikey Stellaris Navigasyon Şeridi & Zengin Hover Kartları (`StellarisLeftRail.tsx`, `App.tsx`)
- **F1 - F9 Kısayol Seti:** Her butonun üzerinde kalıcı/hover kısayol etiketi (`F1` - `F9`).
- **Taktik Floating Hover Tooltip'leri:** Her buton üzerine gelindiğinde anında açılan koyu cam metalik arka planlı Stellaris taktik hover kartı:
  - `F1`: Gezegenler & Sektörler (`Globe`) — Koloni altyapısı, madenler, santraller ve garnizon yönetimi.
  - `F2`: Tersane & Gemi İnşası (`Wrench`) — Avcı, kruvazör, keşif ve taşıma gemisi imalatı.
  - `F3`: Bilim & Teknoloji Ağacı (`Activity`) — İtki motorları, silahlar ve sensör dizinleri.
  - `F4`: Filo Komutası & Seferler (`Send`) — Taarruz, önleme, ikmal ve keşif seferlerinin sevk idaresi.
  - `F5`: Durum Kütüğü & Anomaliler (`Compass`) — Anomaliler, enkaz kurtarma ve sektör puan tablosu.
  - `F6`: Muharebe Kayıtları (`Swords`) — Geçmiş çatışmalar, hasar dağılımı ve savaş tekrarı.
  - `F7`: Galaktik İttifaklar (`Users`) — Diplomatik paktlar, ortak sensör görüşü ve savunma.
  - `F8`: Nexus Rölesi (`Crown`) — Merkezi megastrüktür kontrolü ve haftalık yarışma.
  - `F9`: AI Sanat Galerisi (`Palette`) — Magnific AI ile üretilen görsel atmosfer ve konsept sanatı.
- **Gelişmiş Escape Davranışı:** Açık pencere veya çekmece varsa onları kapatır; hepsi kapalıysa haritadaki hedef seçimini (`selectedTarget`) sıfırlar.

### 3. Sektör Çizelgesi Duyarlılığı & Canlı Tersane Kuyruğu (`StellarisOutliner.tsx`, `App.tsx`)
- **Dinamik Kenar Boşluğu:** Çizelge katlandığında Filo Komuta Çekmecesi ekran boşluğu bırakmadan sağ kenara (`right-4`) yanaşır; çizelge açıkken (`right-72`) hizasında durur.
- **Gezegen Kartlarında Canlı Tersane İlerlemesi:** Gezegenlerin altında sadece bina inşası değil, tersanedeki aktif gemi üretimi (`Rocket`, gemi tipi, adedi ve kalan süre) de canlı olarak izlenir.

### 4. Alt Merkez Galaksi / Sistem Gezinme Güvertesi (`GalaxyMap.tsx`)
- **Sistemler Arası Hızlı Döngü:** Sistem görünümündeyken `<` ve `>` butonlarıyla galaksi haritasına çıkmaya gerek kalmadan yıldız sistemleri arasında döngüsel geçiş.
- **Sistem Odaklama Seçicisi:** Galaksi haritasındayken doğrudan istenen yıldıza merkezlenme (`select`).
- **3D / 2D Motor Anahtarı:** `3D` (Three.js 2.5D) ve `2D` (SVG Canvas) motorları arasında anında geçiş.
- **Yörünge Projeksiyonları:** Gelecek gezegen konumlarını açıp kapatma (`🔭 Projeksiyon`).
- **Kamera Yakınlaştırma:** `-%+` butonlarıyla kontrollü zoom.

---

## 2026-09-28 — Faz R: Soldan Yanaşan Docked Paneller, Katlanabilir Alt Operasyon Güvertesi & Başlangıç Oryantasyon Rehberi

### 1. Haritadan Asla Ayrılmayan Sol Docked Yan Paneller (`isDocked` Mimarisi)
- **Problem:** Left Rail menüsündeki öğelere (Tersane, Ar-Ge, Durum Kütüğü, Savaş Kayıtları, İttifak, Röle, Galeri) tıklandığında tam ekran koyu overlay (`fixed inset-0 bg-black/80`) açılarak haritayı gizliyor ve oyuncuyu bağlamından koparıyordu.
- **Çözüm:** Tüm modal bileşenlerine (`ShipyardModal`, `ResearchModal`, `SituationLogModal`, `CombatReplayModal`, `RelayModal`, `AllianceModal`, `ArtGalleryModal`, `AnomalyEventModal`) `isDocked?: boolean` desteği eklendi.
- `App.tsx` içerisindeki birleşik `activeLeftPanel` state'i sayesinde butonlara basıldığında veya `F1-F9` tuşlarına basıldığında panel, `PlanetPanel` gibi sol rayın hemen yanında (`absolute left-14 top-0 bottom-0 z-30 w-[440px] md:w-[480px]`) pürüzsüzce açılır.
- Arka plan karartması tamamen kalktı; 3D/2D galaksi haritası, gezegen yörüngeleri, filo uçuşları ve zaman akışı panel açıkken bile arka planda tam olarak görünmeye ve etkileşime devam eder.

### 2. Katlanabilir ve Genişletilebilir Alt Operasyon Konsolu (`StellarisBottomDeck.tsx`)
- **Kompakt Mod (Collapsed):** Haritanın alt merkezinde her zaman görünür durumda olan ince operasyon çubuğu; aktif sefer sayısı (`🛸`), tersane üretimleri (`🚀`), koloni bina inşaatları (`🏗️`) ve devam eden teknoloji araştırmalarını (`🔬`) kompakt çipler ve geri sayımlarla gösterir.
- **Genişletilmiş Gösterge Paneli (Expanded):** Çipe tıklandığında yukarı doğru genişleyen tam operasyon konsolu:
  - **Filtre Sekmeleri:** `[Tümü | 🛸 Seferler | 🚀 Tersane | 🏗️ İnşaat | 🔬 Ar-Ge]`.
  - **Filo Sefer Takibi:** Uçuş rotası (`Kalkış ➔ Hedef`), toplam gemi sayısı, dinamik ilerleme çubuğu, varış süresi ve %50 sınırına kadar çalışan anında `Geri Çağır (Recall)` butonu.
  - **Tersane Kuyruğu:** Koloni adı, üretilen gemi tipi, tamamlanan/toplam gemi adedi, birim üretim ilerleme çubuğu ve toplam kalan süre.
  - **Bina İnşaatları:** Yükseltilen yapı adı, hedef seviye, ilerleme çubuğu ve tamamlanma süresi.
  - **Teknoloji / Ar-Ge:** Araştırılan teknoloji kategorisi, kalan süre ve yüzde çubuğu.
  - Tıklanan üretim veya koloniye tıklandığında harita ve paneller ilgili konuma doğrudan odaklanır.

### 3. İnteraktif Başlangıç & Filo Uçuş Oryantasyon Rehberi (`OrientationGuideModal.tsx`)
- Yeni oyuncuların oyunun derinlikli mekaniklerini ve filo intikal kurallarını kolayca öğrenebilmesi için 4 adımlı rehber:
  1. **Galaksi ve Sistem Haritaları:** `M` tuşu, çift tıklama ve makro/mikro navigasyon.
  2. **Filo Seferleri & %50 Geri Dönüş Kilidi (Recall Lock):** Filoların anında ışınlanmadığı, gerçek zamanlı hiper-hat uçuş süreleri, 4 sefer tipi ve yolculuğun ilk yarısından sonra devreye giren taktik geri dönüş kilidi kuralı.
  3. **Ekonomi, Koloni Binaları & Tersane:** 3 temel kaynak, maden/enerji santralleri yükseltme (`F1`) ve tersanede savaş filosu üretimi (`F2`).
  4. **Zaman Kontrolleri, Tehditler & Nexus Rölesi:** `Space` ve `1-4` simülasyon hızları, korsan akınları ve haftalık zafer puanı kazandıran merkezi Nexus Rölesi (`F8`).
- `localStorage` (`galaksi_orientation_seen`) ile ilk açılışta otomatik gösterim; sonrasında `TopBar` üzerindeki `❓ Rehber` butonu veya `StellarisLeftRail` altındaki soru işareti butonuyla istenildiğinde tekrar açılabilir.

---

## 2026-09-28 — Faz S: 2D Vektör Modunun Kaldırılması, Three.js 2.5D Tek Motor Standardı & Magnific Fotogerçekçi Gezegen Varlıkları (Uzay & Yüzey)

### 1. 2D SVG Vektör Görünümünün Kaldırılması & Kod Sadeleştirmesi
- `GalaxyMap.tsx` içerisindeki ~1500 satırlık eski SVG çizim blokları ve `renderEngine` ayrımı tamamen temizlendi.
- Oyun haritası artık münhasıran Three.js 2.5D WebGL uzay motoru (`GalaxyScene25D`) üzerinde çalışır.
- Alt konsoldaki (`StellarisBottomDeck`) ve sol üst HUD'daki 2D/3D motor geçiş butonları arayüzden kaldırıldı; harita motoru basitleştirildi ve `GalaxyMap.tsx` 2226 satırdan 326 satıra düşürüldü (-1822 satır kod temizliği).

### 2. Magnific AI ile 12 Adet AAA Fotogerçekçi Gezegen Görseli Üretimi
- Magnific MCP kullanılarak 6 temel biyom için hem 1:1 uzay küresi hem de 16:9 sinematik yüzey manzaraları üretilip `public/planets/` dizinine yerleştirildi:
  - **Terran (Dünya Benzeri):** `planet_terra_space.png` & `planet_terra_surface.png` (Geniş nehir vadileri, fütüristik kıyı limanları).
  - **Okyanus (Ocean):** `planet_ocean_space.png` & `planet_ocean_surface.png` (Biyolüminesans derin sular, yüzen teknoloji platformları).
  - **Çöl (Desert):** `planet_desert_space.png` & `planet_desert_surface.png` (Kristal kanyonlar, kum fırtınaları, antik maden tesisleri).
  - **Gaz Devi (Gas):** `planet_gas_space.png` & `planet_gas_surface.png` (Muazzam halkalar, girdaplar, üst atmosfer hidrokarbon rafinerileri).
  - **Buzul (Ice):** `planet_ice_space.png` & `planet_ice_surface.png` (Kriyosferik buz yarıkları, termal araştırma üsleri).
  - **Volkanik (Volcanic):** `planet_volcanic_space.png` & `planet_volcanic_surface.png` (Lav nehirleri, bazaltik kratere kurulu dökümhaneler).

### 3. Arayüz & 3D Sahne Entegrasyonu
- **`src/ui/planetAssets.ts`:** Gezegen türlerini görseller, Türkçe biyom isimleri, tema renkleri, atmosfer ışıması, yaşanabilirlik oranları ve lore açıklamalarıyla bağlayan merkezi katalog oluşturuldu.
- **`PlanetPanel.tsx`:**
  - Panelin üst kısmına 16:9 oranında sinematik yüzey manzarası kahraman afişi (`surfaceImage`) yerleştirildi.
  - Biyom türü ve yaşanabilirlik yüzdesi çipleri afişin üzerine zarifçe işlendi.
  - Savunma uydusunun etrafında döndüğü gezegen küre avatarı fotogerçekçi `spaceImage` ile yenilendi.
  - Koloni seçim haplarına minyatür gezegen uzay avatarları eklendi.
- **`SystemInspectionModal.tsx`:**
  - Yuva kartlarına hover edildiğinde arka planda sinematik yüzey manzarası yarı-saydam olarak belirir.
  - Standart renkli çemberler yerine atmosferik ışıma halkalı 52x52 uzay küre avatarları, yaşanabilirlik oranları ve bonus detayları eklendi.
- **`StellarisOutliner.tsx`:**
  - Sektör çizelgesindeki koloni listesinde her gezegenin soluna minyatür uzay avatarları ve ana gezegen/koloni göstergesi eklendi.
- **`GalaxyScene25D.tsx`:**
  - 3D sistem içi yörünge sahnesindeki gezegen küreleri artık Magnific tarafından üretilen yüksek çözünürlüklü dokuları (`planetTextureLoader` önbelleği ile) PBR materyalinde doğrudan kullanır.


