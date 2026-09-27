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







