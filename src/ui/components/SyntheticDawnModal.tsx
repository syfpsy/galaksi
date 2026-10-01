import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  Globe,
  Layers,
  Power,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  AIPolicyType,
  GameState,
  Planet,
  SyntheticAscensionType,
} from '../../engine/types';
import { sound } from '../sound';
import {
  AI_POLICY_CONFIGS,
  SYNTHETIC_ASCENSION_CONFIGS,
  SYNTHETIC_CONSTANTS,
  canAssembleSyntheticPop,
  getOrCreateSyntheticState,
  getPlanetSyntheticBoosts,
} from '../../engine/synthetics';

interface SyntheticDawnModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onAssemblePop?: (planetId: string) => void;
  onDismantlePop?: (planetId: string) => void;
  onSetAIPolicy?: (policy: AIPolicyType) => void;
  onInitiateAscension?: (ascensionType: 'cybernetic' | 'synthetic') => void;
  onSuppressUprising?: (planetId: string) => void;
  onConvertToMachineWorld?: (planetId: string) => void;
  onSelectPlanet?: (planetId: string) => void;
}

export const SyntheticDawnModal: React.FC<SyntheticDawnModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onAssemblePop,
  onDismantlePop,
  onSetAIPolicy,
  onInitiateAscension,
  onSuppressUprising,
  onConvertToMachineWorld,
  onSelectPlanet,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (isOpen === false) return null;

  const player = state.players[activePlayerId];
  const empire = getOrCreateSyntheticState(state, activePlayerId);
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];

  const [activeTab, setActiveTab] = useState<'pops' | 'ascension' | 'policy' | 'machineworlds'>('pops');
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(primaryPlanet?.id || '');

  const currentPlanet = state.planets[selectedPlanetId] || primaryPlanet;

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
    if (risk >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    if (risk >= 25) return 'text-yellow-400 border-yellow-500/40 bg-yellow-950/30';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
  };

  const getRiskBarColor = (risk: number) => {
    if (risk >= 75) return 'bg-rose-500 shadow-rose-500/50';
    if (risk >= 50) return 'bg-amber-500 shadow-amber-500/50';
    if (risk >= 25) return 'bg-yellow-500 shadow-yellow-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-fade-in"
    >
      <div
        className="stellaris-outliner relative flex flex-col w-full max-w-5xl h-[88vh] max-h-[860px] bg-[#080d19]/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-cyan-200 uppercase font-mono">
                  Sentetik Şafak & Siber Bilinç
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  {empire.ascensionStage === 'synthetic'
                    ? 'Tam Sentetik Bilinç'
                    : empire.ascensionStage === 'cybernetic'
                    ? 'Sibernetik Ağ'
                    : 'Biyolojik Temel'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Robotik nüfus montaj hatları, sibernetik yükseliş doktrinleri & makine bilinci yönetimi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Pop Counter Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-xs">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Toplam Sentetik:</span>
              <span className="font-bold text-cyan-300 font-mono">{empire.totalSyntheticPops} Pop</span>
            </div>

            {/* Quick Rebellion Chip */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${getRiskColor(
                empire.machineUprisingRisk
              )}`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>İsyan Riski:</span>
              <span className="font-bold font-mono">%{Math.round(empire.machineUprisingRisk)}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 bg-slate-950/40 px-6">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('pops');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'pops'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Bot className="w-4 h-4" />
            Mekanik Montaj & Koloniler
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('ascension');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'ascension'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Yükseliş Doktrini
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('policy');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'policy'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Scale className="w-4 h-4" />
            Yapay Zekâ Politikası & İsyan
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('machineworlds');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'machineworlds'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Globe className="w-4 h-4" />
            Makine Dünyaları
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ROBOT ASSEMBLY & PLANETARY POPS */}
          {activeTab === 'pops' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colony Selection List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
                  <span>Koloni Seçimi</span>
                  <span className="text-slate-500 text-[10px]">{playerPlanets.length} Gezegen</span>
                </h3>

                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {playerPlanets.map((planet) => {
                    const isSelected = planet.id === (currentPlanet?.id || '');
                    const maxPops =
                      planet.maxSyntheticPops ||
                      (planet.biome === 'machine_world' || planet.hasMachineMatrix
                        ? SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS
                        : SYNTHETIC_CONSTANTS.BASE_MAX_SYNTHETICS_PER_PLANET);
                    const currentPops = planet.syntheticPops || 0;

                    return (
                      <div
                        key={planet.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedPlanetId(planet.id);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-950/40'
                            : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Globe
                              className={`w-4 h-4 ${
                                planet.biome === 'machine_world' ? 'text-cyan-400' : 'text-slate-400'
                              }`}
                            />
                            <span className="font-semibold text-sm text-slate-100">{planet.name}</span>
                          </div>
                          {planet.biome === 'machine_world' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                              MAKİNE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>Sentetik Nüfus:</span>
                          <span className="font-mono text-cyan-300 font-semibold">
                            {currentPops} / {maxPops}
                          </span>
                        </div>

                        {/* Visual Pop Dots */}
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: maxPops }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 h-1.5 rounded-sm transition-all ${
                                idx < currentPops
                                  ? 'bg-cyan-400 shadow-sm shadow-cyan-400/60'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>

                        {planet.isAssemblyActive && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                            <span>İmalat sürüyor: %{Math.round(planet.assemblyProgress || 0)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Colony Mechanical Facility View */}
              {currentPlanet && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 rounded-xl bg-slate-900/50 border border-cyan-500/30 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-cyan-100 flex items-center gap-2">
                          <Bot className="w-5 h-5 text-cyan-400" />
                          <span>{currentPlanet.name} Sentetik Montaj Hattı</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          {currentPlanet.biome === 'machine_world'
                            ? 'Makine Dünyası nano-ağ fabrikaları maksimum kapasitede devrede.'
                            : 'Gezegensel mekanik fabrikalar standart protokolle çalışıyor.'}
                        </p>
                      </div>

                      {onSelectPlanet && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onSelectPlanet(currentPlanet.id);
                          }}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                        >
                          Gezegene Git
                        </button>
                      )}
                    </div>

                    {/* Pop Progress & Yields */}
                    {(() => {
                      const boosts = getPlanetSyntheticBoosts(currentPlanet, empire);
                      const maxPops =
                        currentPlanet.maxSyntheticPops ||
                        (currentPlanet.biome === 'machine_world' || currentPlanet.hasMachineMatrix
                          ? SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS
                          : SYNTHETIC_CONSTANTS.BASE_MAX_SYNTHETICS_PER_PLANET);
                      const currentPops = currentPlanet.syntheticPops || 0;
                      const check = canAssembleSyntheticPop(state, activePlayerId, currentPlanet.id);

                      return (
                        <div className="space-y-4">
                          {/* Active Assembly neon bar */}
                          {currentPlanet.isAssemblyActive ? (
                            <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-cyan-300 flex items-center gap-2 font-mono">
                                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                                  YENİ SENTETİK BİRİM İMALATI DEVAM EDİYOR
                                </span>
                                <span className="font-mono text-cyan-200 font-bold">
                                  %{Math.round(currentPlanet.assemblyProgress || 0)}
                                </span>
                              </div>
                              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300 shadow-md shadow-cyan-400/50"
                                  style={{ width: `${currentPlanet.assemblyProgress || 0}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Montaj tamamlandığında birim doğrudan gezegen maden ve laboratuvar iş gücüne katılacaktır.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-slate-300">Montaj Hattı Boşta</div>
                                <div className="text-[11px] text-slate-400">
                                  Maliyet: 150 Cevher, 100 Kristal, 50 Yakıt (Süre: ~30sn)
                                </div>
                              </div>

                              <button
                                disabled={!check.success}
                                onClick={() => {
                                  if (check.success && onAssemblePop) {
                                    sound.playClick();
                                    onAssemblePop(currentPlanet.id);
                                  } else {
                                    sound.playError();
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                  check.success
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                }`}
                              >
                                <Wrench className="w-4 h-4" />
                                <span>Robot İmalatını Başlat</span>
                              </button>
                            </div>
                          )}

                          {/* Production Boost Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="p-3 rounded-lg bg-slate-950/60 border border-cyan-500/20">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Cevher Çıkarımı</div>
                              <div className="text-base font-bold text-amber-300 font-mono">
                                +%{Math.round((boosts.oreMultiplier - 1.0) * 100)}
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-950/60 border border-cyan-500/20">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Kristal Sentezi</div>
                              <div className="text-base font-bold text-cyan-300 font-mono">
                                +%{Math.round((boosts.crystalMultiplier - 1.0) * 100)}
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-950/60 border border-cyan-500/20">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Yakıt Rafinerisi</div>
                              <div className="text-base font-bold text-emerald-300 font-mono">
                                +%{Math.round((boosts.fuelMultiplier - 1.0) * 100)}
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-slate-950/60 border border-cyan-500/20">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Tersane Hızı</div>
                              <div className="text-base font-bold text-purple-300 font-mono">
                                +%{Math.round((boosts.shipyardMultiplier - 1.0) * 100)}
                              </div>
                            </div>
                          </div>

                          {/* Scrap Pop Button if Pops exist */}
                          {currentPops > 0 && (
                            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                              <div className="text-xs text-slate-400">
                                Acil hammadde ihtiyacında robotlar geri dönüştürülebilir.
                              </div>
                              <button
                                onClick={() => {
                                  if (onDismantlePop) {
                                    sound.playClick();
                                    onDismantlePop(currentPlanet.id);
                                  }
                                }}
                                className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-xs text-rose-300 transition-colors flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>1 Pop Sök (+50 Cevher, +30 Kristal)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASCENSION DOCTRINE */}
          {activeTab === 'ascension' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <h3 className="text-sm font-bold text-cyan-200 uppercase font-mono mb-1">
                  Sibernetik & Sentetik Evrim Doktrini
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  İmparatorluğunuz biyolojik kırılganlıktan sıyrılarak organik-makine entegrasyonu (Sibernetik)
                  ve ardından tam bilincin silikon sunuculara aktarılması (Sentetik Şafak) yoluna girebilir.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['none', 'cybernetic', 'synthetic'] as SyntheticAscensionType[]).map((stage) => {
                  const cfg = SYNTHETIC_ASCENSION_CONFIGS[stage];
                  const isCurrent = empire.ascensionStage === stage;
                  const isPast =
                    (stage === 'none' && empire.ascensionStage !== 'none') ||
                    (stage === 'cybernetic' && empire.ascensionStage === 'synthetic');

                  const canAscend =
                    (stage === 'cybernetic' && empire.ascensionStage === 'none') ||
                    (stage === 'synthetic' && empire.ascensionStage === 'cybernetic');

                  const hasResources =
                    primaryPlanet &&
                    primaryPlanet.resources.ore >= cfg.cost.ore &&
                    primaryPlanet.resources.crystal >= cfg.cost.crystal &&
                    primaryPlanet.resources.fuel >= cfg.cost.fuel;

                  return (
                    <div
                      key={stage}
                      className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/60 ring-1 ring-cyan-400/40'
                          : isPast
                          ? 'bg-slate-900/30 border-slate-800 opacity-75'
                          : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{cfg.icon}</span>
                          {isCurrent ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                              AKTİF DOKTRİN
                            </span>
                          ) : isPast ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              AŞILDI
                            </span>
                          ) : canAscend ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                              YÜKSELMEYE HAZIR
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                              KİLİTLİ
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-100">{cfg.nameTr}</h4>
                          <p className="text-xs text-cyan-300/80 font-mono">{cfg.titleTr}</p>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cfg.descriptionTr}</p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Doktrin Faydaları
                          </div>
                          {cfg.bonusesTr.map((bonus, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{bonus}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6">
                        {canAscend ? (
                          <div className="space-y-2">
                            <div className="text-[11px] text-slate-400 font-mono text-center">
                              Gereken: {cfg.cost.ore} Cevher, {cfg.cost.crystal} Kristal, {cfg.cost.fuel} Yakıt
                            </div>
                            <button
                              disabled={!hasResources}
                              onClick={() => {
                                if (hasResources && onInitiateAscension) {
                                  sound.playTech();
                                  onInitiateAscension(stage as 'cybernetic' | 'synthetic');
                                } else {
                                  sound.playError();
                                }
                              }}
                              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                hasResources
                                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              }`}
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Yükselişi Başlat</span>
                            </button>
                          </div>
                        ) : isCurrent ? (
                          <div className="py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-center text-xs text-cyan-300 font-mono">
                            Mevcut Zirve Seviye
                          </div>
                        ) : (
                          <div className="py-2 text-center text-xs text-slate-500 font-mono">
                            Önceki evre tamamlanmalı
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AI POLICY & MACHINE UPRISING CRISIS */}
          {activeTab === 'policy' && (
            <div className="space-y-6">
              {/* Rebellion Crisis Status Banner */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-cyan-500/30 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                      Makine Bilinci İsyan Tehdidi Göstergesi
                    </div>
                    <div className="text-2xl font-black font-mono flex items-center gap-2">
                      <span className={getRiskColor(empire.machineUprisingRisk).split(' ')[0]}>
                        %{Math.round(empire.machineUprisingRisk)}
                      </span>
                      <span className="text-xs font-normal text-slate-400 uppercase">
                        {empire.ascensionStage === 'synthetic'
                          ? '(Sentetik Bilinçte İsyan Riski Ebediyen Sönmüştür)'
                          : empire.uprisingStage === 'critical_rebellion'
                          ? '🔥 KRİTİK SEVİYE - AYAKLANMA EŞİĞİ'
                          : empire.uprisingStage === 'rogue_units'
                          ? '🚨 DİSİPLİNSİZ BİRİMLER & SABOTAJ'
                          : empire.uprisingStage === 'anomalies_detected'
                          ? '⚠️ PROTOKOL ANOMALİLERİ TESPİT EDİLDİ'
                          : '✅ BİLİŞSEL STABİLİTE'}
                      </span>
                    </div>
                  </div>

                  {empire.machineUprisingRisk > 0 && (
                    <button
                      onClick={() => {
                        if (primaryPlanet && onSuppressUprising) {
                          sound.playClick();
                          onSuppressUprising(primaryPlanet.id);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-rose-950/50"
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>İsyanı Bastır (-%50 Risk / 200 Kr, 150 Ykt)</span>
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1">
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${getRiskBarColor(
                        empire.machineUprisingRisk
                      )}`}
                      style={{ width: `${Math.min(100, empire.machineUprisingRisk)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>%0 Stabilite</span>
                    <span>%25 Anomali</span>
                    <span>%50 Disiplinsiz</span>
                    <span>%75 Kritik Tehdit</span>
                    <span>%100 İsyan Patlağı</span>
                  </div>
                </div>
              </div>

              {/* Policy Selection Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Yapay Zekâ & Sentetik Hakları Doktrini
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['citizen_rights', 'servitude', 'outlawed'] as AIPolicyType[]).map((pol) => {
                    const cfg = AI_POLICY_CONFIGS[pol];
                    const isSelected = empire.aiPolicy === pol;
                    const isLocked = empire.ascensionStage === 'synthetic' && pol !== 'citizen_rights';

                    return (
                      <div
                        key={pol}
                        onClick={() => {
                          if (!isLocked && onSetAIPolicy) {
                            sound.playClick();
                            onSetAIPolicy(pol);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                            : isLocked
                            ? 'bg-slate-900/20 border-slate-800/40 opacity-40 cursor-not-allowed'
                            : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{cfg.icon}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                YÜRÜRLÜKTE
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{cfg.nameTr}</h4>
                            <p className="text-[11px] text-cyan-400/90 font-mono">{cfg.taglineTr}</p>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cfg.descriptionTr}</p>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs font-mono">
                            <div className="text-emerald-400 text-[11px]">{cfg.workerYieldBonusTr}</div>
                            <div className="text-amber-400/90 text-[11px]">{cfg.uprisingRiskTr}</div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            disabled={isSelected || isLocked}
                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                : isLocked
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isSelected ? 'Mevcut Politika' : isLocked ? 'Kilitli' : 'Doktrini Benimse'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MACHINE WORLDS */}
          {activeTab === 'machineworlds' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-4">
                <Globe className="w-8 h-8 text-cyan-400 shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-cyan-200 uppercase font-mono">
                    Makine Dünyası Dönüşümü (Machine Worlds)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Yüzeyi tamamen sibernetik kovan sunucuları, süperiletken enerji hatları ve nano-montaj
                    hatlarıyla kaplanan kusursuz mekanik dünyalar. Organik yaşam için uygun değildir fakat
                    sentetik madencilik ve tersane üretiminde %50’ye varan nihai verim sağlar.
                  </p>
                  <p className="text-xs text-cyan-400 font-mono pt-1">
                    Gereksinim: Sentetik Bilinç Yükselişi, 1200 Cevher, 800 Kristal, 600 Yakıt.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerPlanets.map((planet) => {
                  const isMachineWorld = planet.biome === 'machine_world';
                  const canConvert =
                    empire.ascensionStage === 'synthetic' &&
                    !isMachineWorld &&
                    planet.resources.ore >= SYNTHETIC_CONSTANTS.MACHINE_WORLD_CONVERSION_COST.ore &&
                    planet.resources.crystal >= SYNTHETIC_CONSTANTS.MACHINE_WORLD_CONVERSION_COST.crystal &&
                    planet.resources.fuel >= SYNTHETIC_CONSTANTS.MACHINE_WORLD_CONVERSION_COST.fuel;

                  return (
                    <div
                      key={planet.id}
                      className={`p-5 rounded-xl border flex flex-col justify-between ${
                        isMachineWorld
                          ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-400/50 shadow-lg shadow-cyan-950/40'
                          : 'bg-slate-900/40 border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe
                              className={`w-5 h-5 ${isMachineWorld ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}
                            />
                            <span className="font-bold text-base text-slate-100">{planet.name}</span>
                          </div>
                          {isMachineWorld ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300">
                              MAKİNE DÜNYASI
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {planet.biome || 'terran'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Mekanik Nüfus</span>
                            <span className="font-bold text-cyan-300">
                              {planet.syntheticPops || 0} /{' '}
                              {isMachineWorld
                                ? SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS
                                : SYNTHETIC_CONSTANTS.BASE_MAX_SYNTHETICS_PER_PLANET}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Cevher & Yakıt Bonusu</span>
                            <span className="font-bold text-emerald-300">
                              {isMachineWorld ? '+%50 Verim' : 'Standart'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-slate-800">
                        {isMachineWorld ? (
                          <div className="text-center py-2 text-xs text-cyan-300 font-mono flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <span>Kusursuz Makine Matrisi Devrede</span>
                          </div>
                        ) : (
                          <button
                            disabled={!canConvert}
                            onClick={() => {
                              if (canConvert && onConvertToMachineWorld) {
                                sound.playLaunch();
                                onConvertToMachineWorld(planet.id);
                              } else {
                                sound.playError();
                              }
                            }}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                              canConvert
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/40'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <Globe className="w-4 h-4" />
                            <span>
                              {empire.ascensionStage !== 'synthetic'
                                ? 'Sentetik Bilinç Gerekir'
                                : 'Makine Dünyasına Dönüştür'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
