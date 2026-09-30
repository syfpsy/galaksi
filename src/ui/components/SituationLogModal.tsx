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

export const SituationLogModal: React.FC<SituationLogModalProps> = ({
  isOpen,
  isDocked = false,
  onClose,
  state,
  activePlayerId,
  onSelectSystem,
  onOpenAnomaly,
  onAssaultRelay,
}) => {
  const [activeTab, setActiveTab] = useState<'anomalies' | 'relay' | 'missions'>('anomalies');

  if (!isOpen) return null;

  const activePlayer = state.players[activePlayerId];
  const systems = Object.values(state.map.systems);

  // Extract all systems with POIs or Debris
  const systemsWithPoi = systems.filter((s) => s.poi);
  const systemsWithDebris = systems.filter(
    (s) => s.hasDebris && ((s.hasDebris.ore || 0) > 0 || (s.hasDebris.crystal || 0) > 0)
  );

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
            <div className="w-8 h-8 rounded bg-[#092233] border border-[#204963] flex items-center justify-center text-[#3ca8d1] shadow-inner">
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
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
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
                      className={`p-3 rounded border flex items-center justify-between transition-all ${
                        isExplored
                          ? 'bg-[#091522]/40 border-[#142633] opacity-60'
                          : 'stellaris-item-card border-[#1c3647] hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center border font-bold text-xs ${
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
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0a1826] border border-[#1b3449] text-[#3ca8d1]">
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
                          className="px-2.5 py-1 rounded stellaris-btn-metallic text-slate-200 text-xs font-mono transition-all flex items-center gap-1"
                        >
                          <Target className="w-3.5 h-3.5 text-[#3ca8d1]" />
                          <span>Haritada Bul</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playClick();
                            onOpenAnomaly(sys);
                          }}
                          className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
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
                      className="p-3 rounded stellaris-item-card border-[#1c3647] flex items-center justify-between transition-all hover:border-amber-400 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                          ⚙️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-100">
                              Savaş Enkazı Sahası (Kurtarılabilir Hurda)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0a1826] border border-[#1b3449] text-[#3ca8d1]">
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
                        className="px-2.5 py-1 rounded stellaris-btn-metallic text-amber-300 text-xs font-mono transition-all flex items-center gap-1"
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
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/60 transition-all shrink-0"
                >
                  <Swords className="w-4 h-4" />
                  <span>Röle Harekâtı Başlat</span>
                </button>
              </div>

              {/* Weekly Point Distribution */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-sm p-4 space-y-3">
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
                          className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-lg text-xs font-mono"
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
                <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-900/30 border border-slate-800 rounded-sm">
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
                        className="p-3 stellaris-item-card border-[#1c3647] flex items-center justify-between text-xs font-mono"
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
                            className="px-2.5 py-1 rounded stellaris-btn-metallic text-slate-200 text-[11px] transition-all"
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
