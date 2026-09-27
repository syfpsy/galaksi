import { runHeadlessMatch } from './matchRunner';

console.log('=================================================================');
console.log('🌌 CANLI GALAKSİ - BAŞLANGIÇ FAZ A HIZLANDIRILMIŞ SİMÜLASYON TESTİ');
console.log('=================================================================\n');

const seed = 1042;
const durationHours = 4;
console.log(`Simülasyon Başlatılıyor: ${durationHours} Oyun Saati (Seed: ${seed})...`);

const result = runHeadlessMatch(seed, durationHours, 5);
const stats = result.stats;

console.log(`\n✅ Simülasyon Tamamlandı!`);
console.log(`⏱️  Gerçek Süre: ${(stats.elapsedRealTimeMs / 1000).toFixed(2)} saniye`);
console.log(`🚀 Toplam Sevk Edilen Filo: ${stats.totalFleetsDispatched}`);
console.log(`🛰️  İkinci Filo Emrini Veren Oyuncular: ${stats.secondFleetReachedPlayers.length} / 4 bot`);
console.log(`🪐 Kurulan Koloni Sayısı: ${stats.coloniesFounded}`);
console.log(`⚔️  Gerçekleşen Savaş / Önleme: ${stats.battlesCount}`);
console.log(`📡 Nexus Rölesi El Değiştirme: ${stats.relayTurnoverCount}`);
console.log(`🛡️  QA İstismar Önleme Kontrolleri (Engellenen Geçersiz Emir): ${stats.qaChecksPassed}`);

console.log('\n--- 🏆 OYUNCU SIRALAMASI VE PERFORMANS TABLOSU ---');
console.table(stats.playerRankings);

console.log('\n--- 📜 SON GERÇEKLEŞEN SAVAŞ RAPORLARI ---');
const recentBattles = result.engine.state.battleReports.slice(-3);
if (recentBattles.length === 0) {
  console.log('Bu tohumda çatışma eşiğine henüz ulaşılmadı.');
} else {
  for (const b of recentBattles) {
    console.log(`- [${b.context.toUpperCase()}] ${b.systemName}: ${b.attackerName} vs ${b.defenderName} -> Kazanan: ${b.winner.toUpperCase()}`);
    console.log(`  Yağma: ${Math.round(b.lootedResources.ore)} Cevher, ${Math.round(b.lootedResources.crystal)} Kristal`);
  }
}

console.log('\n=================================================================');
