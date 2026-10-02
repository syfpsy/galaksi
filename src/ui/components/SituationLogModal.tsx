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
import { evaluatePlayerDirectives } from '../../engine/directives';
import { EMPIRE_ARTIFACTS } from '../../engine/artifacts';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface SituationLogModalProps {
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  state: GameState;
  activePlayerId: string;
  initialTab?: 'directives' | 'anomalies' | 'relay' | 'missions' | 'bounties';
  onSelectSystem: (systemId: string) => void;
  onOpenAnomaly: (system: StarSystem) => void;
  onAssaultRelay: () => void;
  onClaimDirective?: (directiveId: string) => void;
}

const SituationLogModalComponent: React.FC<SituationLogModalProps> = ({
  isOpen,
  isDocked = false,
  onClose,
  state,
  activePlayerId,
  initialTab = 'directives',
  onSelectSystem,
  onOpenAnomaly,
  onAssaultRelay,
  onClaimDirective,
}) => {
  const [activeTab, setActiveTab] = useState<'directives' | 'anomalies' | 'relay' | 'missions' | 'bounties'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const activePlayer = state.players[activePlayerId];
  const systems = Object.values(state.map.systems);

  // Empire Directives & Milestones
  const directives = evaluatePlayerDirectives(state, activePlayerId);
  const unclaimedDirectivesCount = directives.filter((d) => d.isCompleted && !d.isClaimed).length;

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
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-[#18374b] bg-[#07131e] overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('directives');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'directives'
                ? 'border-amber-400 text-amber-200 bg-amber-950/40'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>🎯 Direktifler</span>
            {unclaimedDirectivesCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold animate-pulse">
                +{unclaimedDirectivesCount} Ödül!
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d2638] border border-[#1b3d54] text-slate-200 font-bold">
                {directives.filter((d) => d.isClaimed).length}/{directives.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('anomalies');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'border-[#3ca8d1] text-cyan-200 bg-[#0a2336]'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Anomaliler</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0d2638] border border-[#1b3d54] text-slate-200 font-bold">
              {systemsWithPoi.length + systemsWithDebris.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('relay');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'relay'
                ? 'border-purple-400 text-purple-200 bg-purple-950/40'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Nexus Rölesi</span>
            {isRelayMine && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 font-bold border border-purple-500/50">
                Kontrol Sizde
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('missions');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'missions'
                ? 'border-emerald-400 text-emerald-200 bg-emerald-950/30'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seferler</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold">
              {myFleets.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('bounties');
            }}
            className={`px-3 py-2 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bounties'
                ? 'border-rose-400 text-rose-200 bg-rose-950/40'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>Korsanlar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-200 font-bold">
              {systemsWithPirates.length}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 pb-6 space-y-4">
          {/* TAB 0: EMPIRE DIRECTIVES */}
          {activeTab === 'directives' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-3.5 rounded-sm bg-gradient-to-r from-[#0d2538] to-[#07131f] border border-[#1b435f] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-amber-300">
                      Galaktik İmparatorluk Direktifleri & Hedefler
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Gelişim hedeflerini tamamlayarak devasa hammadde hibeleri, amiral tecrübesi ve Hegemonya Zafer Puanı kazanın.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Tamamlanan</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {directives.filter((d) => d.isClaimed).length} / {directives.length}
                  </div>
                </div>
              </div>

              {/* Grouped by Phase */}
              {[1, 2, 3].map((phaseNum) => {
                const phaseDirectives = directives.filter((d) => d.phase === phaseNum);
                const phaseTitles: Record<number, string> = {
                  1: 'Aşama I: Temel Altyapı, Kolonizasyon ve İlk Filo',
                  2: 'Aşama II: Savunma, İttifak, Korsanlar ve Genişleme',
                  3: 'Aşama III: Galaktik Hegemonya ve Zafer İlanı',
                };

                return (
                  <div key={`phase_${phaseNum}`} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[#1b3a52] pb-1.5">
                      <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-cyan-300">
                        {phaseTitles[phaseNum] || `Aşama ${phaseNum}`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({phaseDirectives.filter((d) => d.isClaimed).length}/{phaseDirectives.length})
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {phaseDirectives.map((directive) => {
                        const progressPct = Math.min(
                          100,
                          Math.round((directive.currentValue / directive.targetValue) * 100)
                        );

                        return (
                          <div
                            key={directive.id}
                            className={`p-3.5 rounded-sm border transition-all ${
                              directive.isClaimed
                                ? 'bg-[#091522]/50 border-[#142633] opacity-75'
                                : directive.isCompleted
                                ? 'bg-[#102436] border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                                : 'stellaris-item-card border-[#1c3647]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold font-display text-white">
                                    {directive.title}
                                  </span>
                                  {directive.isClaimed && (
                                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                                      ✓ TAMAMLANDI
                                    </span>
                                  )}
                                  {directive.isCompleted && !directive.isClaimed && (
                                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-amber-500 text-black animate-pulse">
                                      ÖDÜLÜ BEKLİYOR
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11.5px] text-slate-300 mt-1 leading-relaxed">
                                  {directive.description}
                                </p>

                                {/* Progress Bar */}
                                <div className="mt-2.5 flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-[#06101a] border border-[#1b3d54] rounded-none overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        directive.isClaimed
                                          ? 'bg-emerald-500'
                                          : directive.isCompleted
                                          ? 'bg-amber-400'
                                          : 'bg-cyan-400'
                                      }`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10.5px] font-mono font-bold text-slate-300 shrink-0">
                                    {directive.currentValue} / {directive.targetValue} (%{progressPct})
                                  </span>
                                </div>

                                {/* Rewards Badges */}
                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">ÖDÜL:</span>
                                  {directive.reward.ore && (
                                    <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#091826] border border-[#1b3b52] text-amber-300">
                                      ⛏️ +{directive.reward.ore} Cevher
                                    </span>
                                  )}
                                  {directive.reward.crystal && (
                                    <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#091826] border border-[#1b3b52] text-cyan-300">
                                      💎 +{directive.reward.crystal} Kristal
                                    </span>
                                  )}
                                  {directive.reward.fuel && (
                                    <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-[#091826] border border-[#1b3b52] text-yellow-300">
                                      ⚡ +{directive.reward.fuel} Yakıt
                                    </span>
                                  )}
                                  {directive.reward.hegemonyPoints && (
                                    <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-purple-950/80 border border-purple-500/50 text-purple-200">
                                      👑 +{directive.reward.hegemonyPoints} Zafer Puanı
                                    </span>
                                  )}
                                  {directive.reward.admiralXp && (
                                    <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-indigo-950/80 border border-indigo-500/50 text-indigo-200">
                                      🎖️ +{directive.reward.admiralXp} Amiral DP
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Claim / Status Button */}
                              <div className="shrink-0 flex items-center self-center">
                                {directive.isClaimed ? (
                                  <div className="px-3 py-1.5 rounded-sm bg-[#092233] border border-[#1b435f] text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Alındı</span>
                                  </div>
                                ) : directive.isCompleted ? (
                                  <button
                                    onClick={() => {
                                      sound.playNotification();
                                      if (onClaimDirective) onClaimDirective(directive.id);
                                    }}
                                    className="px-3.5 py-2 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse cursor-pointer"
                                  >
                                    <Award className="w-4 h-4" />
                                    <span>🎁 Ödülü Al</span>
                                  </button>
                                ) : (
                                  <div className="px-3 py-1.5 rounded-sm bg-[#09141f] border border-[#142633] text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Sürüyor</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 1: ANOMALIES & DEBRIS */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              {/* Imperial Relics Showcase Banner */}
              <div className="p-3.5 rounded-sm stellaris-outliner bg-gradient-to-r from-[#0d2538] to-[#07131f] border border-[#1b435f]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏛️</span>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-cyan-300">
                      Kazanılan Kadim Yadigarlar & Antik Teknolojiler
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold">
                    {activePlayer?.artifacts?.length || 0} / 4 Aktif
                  </span>
                </div>

                {(!activePlayer?.artifacts || activePlayer.artifacts.length === 0) ? (
                  <p className="text-[11px] text-slate-400 font-sans italic">
                    Henüz kadim bir yadigar keşfedilmedi. Sektördeki Öncü Kalıntıları, Savaş Dretnotu veya Uzay Yarığı sahalarına keşif filoları sevk ederek yadigarları toplayın.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {activePlayer.artifacts.map((artId) => {
                      const art = EMPIRE_ARTIFACTS[artId];
                      if (!art) return null;
                      return (
                        <div
                          key={`relic_${art.id}`}
                          className="stellaris-item-card p-2.5 flex items-center justify-between border-cyan-500/40 bg-[#091a29]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{art.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                                <span>{art.nameTr}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {art.categoryTr}
                              </div>
                            </div>
                          </div>
                          <span className="stellaris-badge text-emerald-300 border-emerald-500/40 text-[10px] font-mono shrink-0">
                            {art.effectTr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                    ancient_ruins: 'Kadim Öncü Uygarlık Kalıntıları',
                    derelict_dreadnought: 'Sürüklenen Kadim Savaş Dretnotu',
                    dark_matter_rift: 'Karanlık Madde Uzay-Zaman Yarığı',
                  };

                  const relic = poi.artifactId ? EMPIRE_ARTIFACTS[poi.artifactId] : null;

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
                          {relic ? relic.icon : '★'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-white">
                              {poiNames[poi.type] || 'Bilinmeyen Anomali'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0a1826] border border-[#1b3449] text-cyan-300 font-medium">
                              {sys.name}
                            </span>
                            {relic && !isExplored && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                                🏛️ Yadigar Sahası
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                            {isExplored ? (
                              <span className="text-emerald-400 font-semibold">
                                ✓ Keşfedildi — Kaynaklar Toplandı
                              </span>
                            ) : (
                              <span className="text-amber-300 font-medium">
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
                          className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-slate-200 hover:text-white text-xs font-mono transition-all flex items-center gap-1"
                        >
                          <Target className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Haritada Bul</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playClick();
                            onOpenAnomaly(sys);
                          }}
                          className="px-3 py-1 rounded-sm bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
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
                            <span className="text-xs font-bold font-mono text-white">
                              Savaş Enkazı Sahası (Kurtarılabilir Hurda)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0a1826] border border-[#1b3449] text-cyan-300 font-medium">
                              {sys.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 font-bold mt-0.5">
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
                        className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-amber-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1"
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
              {/* Hero Visual Banner of Nexus Relay */}
              <div className="relative w-full h-36 rounded-sm overflow-hidden border border-purple-500/40 bg-[#06101a] shadow-lg shadow-purple-950/40 flex items-center justify-center group">
                <img
                  src="/assets/art/nexus_relay.png"
                  alt="Nexus Relay Megastructure"
                  className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080d19] via-[#080d19]/60 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-purple-200 uppercase tracking-widest bg-purple-950/80 px-2 py-0.5 rounded-sm border border-purple-500/40 inline-block font-bold">
                      Kadim Öncü Megastrüktürü
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: relayController?.color || '#a855f7' }}
                      />
                      <span className="text-sm font-bold text-white font-display drop-shadow">
                        {relayController ? relayController.name : 'Tarafsız Savunma Garnizonu'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-950/30 border border-purple-500/40 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-sm bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                    <Crown className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-white">
                      Merkezi Nexus Rölesi — Sektör Egemenlik Noktası
                    </h3>
                    <div className="text-xs font-mono text-slate-300 mt-1">
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
                <div className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Haftalık Röle Skor Tablosu</span>
                  <span className="text-slate-400 font-normal">10 dakikada bir kontrol puanı dağıtılır</span>
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
                            <span className="text-white font-medium">{p?.name || playerId}</span>
                          </div>
                          <span className="text-amber-300 font-bold">{pts} Puan</span>
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
                <div className="p-8 text-center text-slate-400 font-mono text-xs stellaris-item-card border border-[#1c3647] rounded-sm">
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
                          <Navigation className="w-4 h-4 text-cyan-300" />
                          <div>
                            <span className="text-white font-bold block">{fl.name}</span>
                            <span className="text-slate-300 text-[11px]">
                              Hedef: <span className="text-cyan-300 font-medium">{targetSys?.name || fl.targetSystemId}</span> • {fl.mission.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-amber-300 font-bold flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(remainingMs)}
                          </span>

                          <button
                            onClick={() => {
                              sound.playClick();
                              onSelectSystem(fl.targetSystemId);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-sm stellaris-btn-metallic text-slate-200 hover:text-white text-[11px] transition-all font-medium"
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
                      low: { label: 'DÜŞÜK TEHDİT', color: 'text-emerald-300', border: 'border-emerald-500/40 bg-emerald-950/40' },
                      medium: { label: 'ORTA TEHDİT', color: 'text-cyan-300', border: 'border-cyan-500/40 bg-cyan-950/40' },
                      high: { label: 'YÜKSEK TEHDİT', color: 'text-amber-300', border: 'border-amber-500/40 bg-amber-950/40' },
                      deadly: { label: 'ÖLÜMCÜL TEHDİT', color: 'text-rose-300', border: 'border-rose-500/50 bg-rose-950/60 animate-pulse' },
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
                                <h3 className="font-bold text-white text-sm font-display">
                                  {bounty?.titleTr || 'Uzay Korsanları'} — {sys.name}
                                </h3>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border font-bold ${badge.border} ${badge.color}`}>
                                  {badge.label}
                                </span>
                                {isClaimed && (
                                  <span className="stellaris-badge text-[9px] text-emerald-300 border-emerald-500/40 bg-emerald-950/40 font-bold">
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
                                <div className="flex items-center gap-2.5 mt-2 text-[11px] font-mono">
                                  <span className="text-slate-400">Galaktik Ödül:</span>
                                  <span className="text-white font-bold">{reward.ore} Cevher</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-cyan-300 font-bold">{reward.crystal} Kristal</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-amber-300 font-bold">{reward.fuel} Yakıt</span>
                                  <span className="text-slate-500">•</span>
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
                              className="px-3 py-1.5 rounded-sm stellaris-btn-metallic text-slate-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                            >
                              <Navigation className="w-3.5 h-3.5 text-cyan-300" />
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
