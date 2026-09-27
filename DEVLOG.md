# Canlı Galaksi — Geliştirme Günlüğü (DevLog)

Bu dosya, GDD v0.1.0 doğrultusunda yapılan tüm mimari kararların, aşamaların ve değişikliklerin özet hafızasıdır.

---

## [2026-09-27] — Faz A (Ekransız Çekirdek & Botlar) ve Faz B (İzlenebilir Sektör Arayüzü) Kurulumu

### 1. Mimari Kararlar ve Uygulama Özeti
- **Bağımsız Başsız (Headless) Motor:** `src/engine/` katmanı hiçbir DOM veya tarayıcı kütüphanesine bağımlı olmadan Node.js, CLI, Vitest ve React içinde deterministik olarak çalışacak şekilde inşa edildi.
- **Deterministik PRNG (`src/engine/prng.ts`):** Mulberry32 tabanlı deterministik rastgele sayı üreteci ile tohum bazlı harita ve savaş simülasyonları istemci ve sunucuda birebir aynı sonucu üretir.
- **Ekonomi & 3 Kaynak Modeli (`src/engine/constants.ts`):**
  - Cevher (Ore), Kristal (Crystal), Yakıt (Fuel).
  - Maden seviyelerine bağlı pasif üretim formülleri, depo tavanı ve yağmaya karşı korumalı depo kapasitesi.
  - Baskın tavanı (GDD Bölüm 10): Korunmasız stokun en fazla %20'si yağmalanabilir.
- **Gemi Rolleri ve Görevler:**
  - 4 Gemi: Keşif (Scout), Nakliye (Transport), Avcı (Fighter), Savaş Gemisi (Battleship).
  - 5 Bağlamsal Görev: Keşfet, Taşı/Topla, Saldır, Önle, Destekle, Kolonileştir.
- **Uçuş & Önleme Modeli (`src/engine/flight.ts`):**
  - Dijkstra ile hat ağı üzerinde rota ve mesafe hesabı.
  - En yavaş gemi ve motor araştırma seviyesine bağlı filo hızı.
  - `checkInterceptionFeasibility`: Hareket halindeki hedef filoya rota düğümünde yetişilip yetişilemeyeceğini önceden hesaplar.
  - Son yaklaşma kilidi: Yolculuğun ilk %50'sinde yakıt maliyetiyle geri çağırma açık, son %50'de kilitlenir.
- **Savaş Motoru & Enkaz Sahası (`src/engine/combat.ts`):**
  - 6 turlu çatışma simülasyonu, tur olay kayıtları, hasar dağılımı.
  - Kayıpların %30'undan salvage edilebilir enkaz sahası (debris field) oluşumu.
- **Sis ve Kısmi Bilgi Katmanı (`src/engine/fog.ts`):**
  - Sensör dizisi, keşif filoları ve Nexus Rölesi kontrolüne bağlı görüş menzilleri.
  - `filterGameStateForPlayer`: İstemciye düşman verileri filtrelenerek gönderilir.
- **Dört Bot Arketipi ve QA Ajanı (`src/bots/`):**
  - Sanayici (Industrialist), Akıncı (Raider), Muhafız (Guardian), Kâşif (Explorer).
  - QA Exploit Ajanı: Geçersiz komutları ve değişmezleri (negatif kaynak vb.) 7/24 denetler.
- **Hızlandırılmış Test Çalıştırıcısı (`src/sim/runMatch.ts`):**
  - 4 oyun saatini ~0.03 saniyede simüle eder, filo sevk, koloni, önleme ve röle istatistiklerini raporlar.

### 2. Faz B İzlenebilir Arayüz (React + Tailwind CSS)
- **Canlı 2D Vektörel Harita (`GalaxyMap.tsx`):**
  - Yıldız sistemleri, bağlantı hatları, merkezi Nexus Rölesi dalgaları.
  - Hareket halindeki filoların zaman damgalarına göre yumuşak vektörel interpolasyonu.
  - Sis kaplaması ve hedef seçim halkaları.
- **3 Sütunlu Komuta Düzeni:**
  - Üst Bar (`TopBar.tsx`): Kaynaklar, saatlik üretim, simülasyon zamanı (1x, 5x, 20x, 60x), perspektif seçici ve Hakim Görüş (God Mode) anahtarı.
  - Sol Panel (`PlanetPanel.tsx`): Gezegen altyapısı yükseltmeleri, sayaçlar, garnizon ve savunma duruşları ("Konumu Tut" / "Filoyu Koru").
  - Sağ Panel (`CommandPanel.tsx`): Hedef istihbaratı, bağlamsal görev seçimi, uçuş önizlemesi, önleme hesaplayıcısı ve yoldaki filoların geri çağırma kontrolü.
- **Taktik Pencereler:**
  - Tersane Penceresi (`ShipyardModal.tsx`): Gemi inşası ve kuyruk takibi.
  - Araştırma Penceresi (`ResearchModal.tsx`): İmparatorluk teknoloji ağacı.
  - Savaş Tekrar Oynatıcısı (`CombatReplayModal.tsx`): Taktik muharebe turları, hasar dökümü, yağma ve enkaz gösterimi.
  - Telsiz Bildirim Akışı (`EventFeed.tsx`): Sektör içi canlı olay akışı.

### 3. Doğrulama
- `npm test`: 6/6 test başarılı.
- `npm run sim`: 4 saatlik maçta 148 filo sevk edildi, 12 önleme/savaş çözüldü, 960 QA istismar testi engellendi.
- `npm run build`: TypeScript ve Vite derlemesi hatasız tamamlandı.
