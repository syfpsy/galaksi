import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Navigation,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Target,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { GameState, StarSystem } from '../../engine/types';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface SituationLogModalProps {
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  state: GameState;
  activePlayerId: string;
  onSelectSystem: (systemId: string) => void;
  onOpenAnomaly: (system: StarSystem) => void;
  onAssaultRelay: () => void;
}

const SituationLogModalComponent: React.FC<SituationLogModalProps> = ({
  isOpen,
  isDocked = false,
  onClose,
  state,
  activePlayerId,
  onSelectSystem,
  onOpenAnomaly,
  onAssaultRelay,
}) => {
  const [activeTab, setActiveTab] = useState<'anomalies' | 'relay' | 'missions' | 'bounties'>('anomalies');

  if (!isOpen) return null;

  const activePlayer = state.players[activePlayerId];
  const systems = Object.values(state.map.systems);

  // Extract all systems with POIs or Debris
  const systemsWithPoi = systems.filter((s) => s.poi);
  const systemsWithDebris = systems.filter(
    (s) => s.hasDebris && ((s.hasDebris.ore || 0) > 0 || (s.hasDebris.crystal || 0) > 0)
  );
  const systemsWithPirates = systems.filter((s) => s.poi?.type === 'pirate_lair');

  // Extract active missions for the player
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId);

  // Nexus Relay status
  const relaySystem = state.map.systems[state.relay.systemId];
  const relayController = state.relay.controllingPlayerId
    ? state.players[state.relay.controllingPlayerId]
    : null;
  const isRelayMine = state.relay.controllingPlayerId === activePlayerId;

  const content = (
    <div className={isDocked ? "w-[660px] min-w-[660px] max-w-[660px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none relative" : "stellaris-outliner border border-[#1c3647] rounded-sm shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col text-slate-100 overflow-hidden relative"}>
        {/* Header */}
        <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-[#3ca8d1] shadow-inner">
              <Compass className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#3ca8d1] font-bold">
                  Galaktik Durum & Keşif Kütüğü (F5)
                </span>
              </div>
              <h2 className="text-sm font-bold font-display text-white">
                İmparatorluk Durum Günlüğü
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-[#18374b] bg-[#07131e]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('anomalies');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'anomalies'
                ? 'border-[#3ca8d1] text-cyan-300 bg-[#0a2336]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sektör Anomalileri & Enkazlar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d2638] border border-[#1b3d54] text-slate-300">
              {systemsWithPoi.length + systemsWithDebris.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('relay');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'relay'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Nexus Rölesi Megastrüktürü</span>
            {isRelayMine && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-bold border border-purple-500/40">
                Kontrol Sizde
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('missions');
            }}
            className={`px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'missions'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span>Aktif Seferler & İntikaller</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {myFleets.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('bounties');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'bounties'
                ? 'border-rose-400 text-rose-300 bg-rose-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>Korsan Sözleşmeleri & Ödül Avcılığı</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
              {systemsWithPirates.length}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 pb-6 space-y-4">
          {/* TAB 1: ANOMALIES & DEBRIS */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Keşif veya İkmal Bekleyen Sektör Olayları</span>
                <span className="text-slate-500">Detaylı tarama ve sevk için kartlara tıklayın</span>
              </div>

              {/* Anomalies List */}
              <div className="space-y-2.5">
                {systemsWithPoi.map((sys) => {
                  const poi = sys.poi!;
                  const isExplored = poi.explored;

                  const poiNames: Record<string, string> = {
                    derelict_cache: 'Terk Edilmiş Antik Kargo Gemisi',
                    alien_beacon: 'Yabancı Subspace Radyo Sinyali',
                    asteroid_rich: 'Nadir Cevher Asteroit Kuşağı',
                  };

                  return (
                    <div
                      key={`poi_${sys.id}`}
                      className={`p-3 rounded-sm border flex items-center justify-between transition-all ${
                        isExplored
                          ? 'bg-[#091522]/40 border-[#142633] opacity-60'
                          : 'stellaris-item-card border-[#1c3647] hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-sm flex items-center justify-center border font-bold text-xs ${
                            isExplored
                              ? 'bg-[#0b1723] border-[#182a3a] text-slate-500'
                              : 'bg-amber-950/60 border-amber-500/50 text-amber-400 animate-pulse'
                          }`}
                        >
                          ★
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-100">
                              {poiNames[poi.type] || 'Bilinmeyen Anomali'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0a1826] border border-[#1b3449] text-[#3ca8d1]">
                              {sys.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {isExplored ? (
                              <span className="text-emerald-400 font-semibold">
                                ✓ Keşfedildi — Kaynaklar Toplandı
                              </span>
                            ) : (
                              <span className="text-amber-400">
                                ● İncelenmedi — +{poi.reward?.ore || 0}C, +{poi.reward?.crystal || 0}K, +{poi.reward?.fuel || 0}Y
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sound.playClick();
                            onSelectSystem(sys.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-slate-200 text-xs font-mono transition-all flex items-center gap-1"
                        >
                          <Target className="w-3.5 h-3.5 text-[#3ca8d1]" />
                          <span>Haritada Bul</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playClick();
                            onOpenAnomaly(sys);
                          }}
                          className="px-3 py-1 rounded-sm bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span>Raporu Aç</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Debris Fields List */}
                {systemsWithDebris.map((sys) => {
                  const deb = sys.hasDebris!;
                  return (
                    <div
                      key={`debris_${sys.id}`}
                      className="p-3 rounded-sm stellaris-item-card border-[#1c3647] flex items-center justify-between transition-all hover:border-amber-400 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                          ⚙️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-100">
                              Savaş Enkazı Sahası (Kurtarılabilir Hurda)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0a1826] border border-[#1b3449] text-[#3ca8d1]">
                              {sys.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                            +{Math.round(deb.ore || 0)} Cevher • +{Math.round(deb.crystal || 0)} Kristal
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onSelectSystem(sys.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-amber-300 text-xs font-mono transition-all flex items-center gap-1"
                      >
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sisteme Git</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: NEXUS RELAY */}
          {activeTab === 'relay' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-500/40 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-sm bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                    <Crown className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-white">
                      Merkezi Nexus Rölesi — Sektör Egemenlik Noktası
                    </h3>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Mevcut Hakimiyet:{' '}
                      {relayController ? (
                        <span style={{ color: relayController.color }} className="font-bold">
                          {relayController.name} {isRelayMine && '(Siz)'}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">Tarafsız / Boşta</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onAssaultRelay();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/60 transition-all shrink-0"
                >
                  <Swords className="w-4 h-4" />
                  <span>Röle Harekâtı Başlat</span>
                </button>
              </div>

              {/* Weekly Point Distribution */}
              <div className="stellaris-item-card border border-[#1c3647] rounded-sm p-4 space-y-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Haftalık Röle Skor Tablosu</span>
                  <span className="text-slate-500">10 dakikada bir kontrol puanı dağıtılır</span>
                </div>

                <div className="space-y-2">
                  {Object.entries(state.relay.weeklyPoints || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([playerId, pts]) => {
                      const p = state.players[playerId];
                      return (
                        <div
                          key={playerId}
                          className="flex items-center justify-between bg-[#07131e] border border-[#18374b] px-3 py-2 rounded-sm text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: p?.color || '#00f3ff' }}
                            />
                            <span className="text-slate-200">{p?.name || playerId}</span>
                          </div>
                          <span className="text-amber-400 font-bold">{pts} Puan</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE MISSIONS */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>İmparatorluğunuza Ait Görevdeki Filolar</span>
                <span className="text-slate-500">{myFleets.length} Aktif Görev</span>
              </div>

              {myFleets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs stellaris-item-card border border-[#1c3647] rounded-sm">
                  Şu anda uzayda seyreden aktif bir filonuz bulunmuyor. Tersaneden gemi inşa edip sefer sevk edebilirsiniz.
                </div>
              ) : (
                <div className="space-y-2">
                  {myFleets.map((fl) => {
                    const targetSys = state.map.systems[fl.targetSystemId];
                    const remainingMs = Math.max(0, fl.arrivalTime - state.timeMs);

                    return (
                      <div
                        key={fl.id}
                        className="p-3 stellaris-item-card border-[#1c3647] rounded-sm flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <Navigation className="w-4 h-4 text-[#3ca8d1]" />
                          <div>
                            <span className="text-slate-100 font-bold block">{fl.name}</span>
                            <span className="text-slate-400 text-[11px]">
                              Hedef: {targetSys?.name || fl.targetSystemId} • {fl.mission.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(remainingMs)}
                          </span>

                          <button
                            onClick={() => {
                              sound.playClick();
                              onSelectSystem(fl.targetSystemId);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-slate-200 text-[11px] transition-all"
                          >
                            Odaklan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PIRATE BOUNTIES & MARAUDERS */}
          {activeTab === 'bounties' && (
            <div className="space-y-4">
              <div className="stellaris-item-card border-[#1c3647] p-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-rose-400" />
                      <span>Galaktik Güvenlik Ağı • Korsan Avcılığı Bürosu</span>
                    </span>
                    <span className="stellaris-badge text-[9px] text-amber-300 border-amber-500/40">
                      ÖDÜLLÜ
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    Sektör boyunca konuşlanmış haydut çeteleri ve korsan sığınakları maden konvoylarına pusu kuruyor. Bu sığınakları yok eden komutanlar yüksek miktarda Cevher, Kristal, Yakıt ve donanma tecrübe puanı (DP) kazanır.
                  </p>
                </div>
              </div>

              {systemsWithPirates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-mono stellaris-item-card border-[#1c3647] rounded-sm">
                  Sektörde tespit edilmiş aktif korsan sığınağı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {systemsWithPirates.map((sys) => {
                    const bounty = sys.poi?.bounty;
                    const reward = sys.poi?.reward;
                    const isClaimed = Boolean(bounty?.claimed);
                    const threatLevel = bounty?.threatLevel || 'medium';

                    const threatBadges: Record<string, { label: string; color: string; border: string }> = {
                      low: { label: 'DÜŞÜK TEHDİT', color: 'text-emerald-400', border: 'border-emerald-500/40 bg-emerald-950/40' },
                      medium: { label: 'ORTA TEHDİT', color: 'text-cyan-400', border: 'border-cyan-500/40 bg-cyan-950/40' },
                      high: { label: 'YÜKSEK TEHDİT', color: 'text-amber-400', border: 'border-amber-500/40 bg-amber-950/40' },
                      deadly: { label: 'ÖLÜMCÜL TEHDİT', color: 'text-rose-400', border: 'border-rose-500/50 bg-rose-950/60 animate-pulse' },
                    };

                    const badge = threatBadges[threatLevel] || threatBadges.medium;

                    return (
                      <div
                        key={sys.id}
                        className={`p-3.5 stellaris-item-card rounded-sm transition-all border ${
                          isClaimed
                            ? 'opacity-60 border-slate-700/50 bg-[#06101a]'
                            : 'border-[#1c3d52] hover:border-rose-500/50 bg-[#091522]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-sm bg-[#0c1b29] border border-[#1e445f] flex items-center justify-center text-xl shrink-0">
                              {isClaimed ? '🛡️' : '🏴‍☠️'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-100 text-sm font-display">
                                  {bounty?.titleTr || 'Uzay Korsanları'} — {sys.name}
                                </h3>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border font-bold ${badge.border} ${badge.color}`}>
                                  {badge.label}
                                </span>
                                {isClaimed && (
                                  <span className="stellaris-badge text-[9px] text-emerald-400 border-emerald-500/40 bg-emerald-950/40">
                                    İMHA EDİLDİ
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-300 mt-1">
                                {sys.name} sisteminde konuşlu haydut karargahı. Civardaki maden konvoylarını tehdit ediyor.
                              </p>

                              {/* Garrison & Defenses breakdown */}
                              {bounty?.pirateGarrison && (
                                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-300">
                                  <span className="text-slate-400">Korsan Filosu:</span>
                                  {bounty.pirateGarrison.fighter > 0 && (
                                    <span className="text-amber-300 font-bold">{bounty.pirateGarrison.fighter}x Avcı</span>
                                  )}
                                  {bounty.pirateGarrison.battleship > 0 && (
                                    <span className="text-rose-400 font-bold">{bounty.pirateGarrison.battleship}x Dretnot</span>
                                  )}
                                  {bounty.pirateGarrison.scout > 0 && (
                                    <span className="text-cyan-300">{bounty.pirateGarrison.scout}x Keşif</span>
                                  )}
                                </div>
                              )}

                              {/* Bounty Reward breakdown */}
                              {reward && (
                                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                                  <span className="text-slate-400">Galaktik Ödül:</span>
                                  <span className="text-slate-200 font-bold">{reward.ore} Cevher</span>
                                  <span>•</span>
                                  <span className="text-cyan-300 font-bold">{reward.crystal} Kristal</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-bold">{reward.fuel} Yakıt</span>
                                  <span>•</span>
                                  <span className="text-purple-300 font-bold">+{bounty?.rewardXP || 150} DP</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onSelectSystem(sys.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-sm stellaris-btn-metallic text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Sisteme Git</span>
                            </button>

                            {!isClaimed && (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onSelectSystem(sys.id);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider bg-rose-600/30 border border-rose-500/60 hover:bg-rose-600/50 text-rose-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                              >
                                <Swords className="w-3.5 h-3.5 text-rose-400" />
                                <span>Taarruz Et</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      {content}
    </div>
  );
};

export const SituationLogModal = React.memo(SituationLogModalComponent);
