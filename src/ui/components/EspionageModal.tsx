import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Binary,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Database,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Radio,
  Rocket,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CounterEspionageStance,
  CovertOpType,
  CovertOperation,
  EspionageOpType,
  EspionageReport,
  GameState,
  Planet,
  ShipType,
  SpyAsset,
  SpyAssetType,
  SpyNetwork,
} from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { formatSimClock } from '../timeUtils';
import { sound } from '../sound';
import {
  COVERT_OP_CONFIGS,
  COUNTER_ESPIONAGE_CONFIGS,
  ESPIONAGE_CONSTANTS,
  SPY_ASSET_CONFIGS,
  calculateCounterIntelScore,
  calculateInfiltrationCap,
  calculateInfiltrationGrowthPerSec,
  getSpyNetworkKey,
  getTieredIntel,
} from '../../engine/espionage';

interface EspionageModalProps {
  state: GameState;
  activePlayerId: string;
  activePlanet: Planet | undefined;
  initialTargetPlanetId?: string | null;
  onClose: () => void;
  onLaunchOp: (
    originPlanetId: string,
    targetPlanetId: string,
    opType: EspionageOpType,
    scoutCount: number
  ) => void;
  onEstablishNetwork?: (targetPlayerId: string) => void;
  onRecallNetwork?: (networkId: string) => void;
  onAssignEnvoy?: (networkId: string, envoys: number) => void;
  onAcquireAsset?: (networkId: string, assetType: SpyAssetType) => void;
  onLaunchCovertOp?: (
    networkId: string,
    opType: CovertOpType,
    targetPlanetId?: string,
    assignedAssetId?: string
  ) => void;
  onCancelCovertOp?: (operationId: string) => void;
  onSetCounterStance?: (stance: CounterEspionageStance) => void;
}

export const EspionageModal: React.FC<EspionageModalProps> = ({
  state,
  activePlayerId,
  activePlanet,
  initialTargetPlanetId,
  onClose,
  onLaunchOp,
  onEstablishNetwork,
  onRecallNetwork,
  onAssignEnvoy,
  onAcquireAsset,
  onLaunchCovertOp,
  onCancelCovertOp,
  onSetCounterStance,
}) => {
  const [activeTab, setActiveTab] = useState<'networks' | 'operations' | 'assets' | 'counterIntel' | 'dossiers'>('networks');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState<string>('');
  const [selectedCovertOpType, setSelectedCovertOpType] = useState<CovertOpType>('gather_intel');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Legacy Scout Sonda states
  const [selectedLegacyOpType, setSelectedLegacyOpType] = useState<EspionageOpType>('infiltrate_intel');
  const [scoutCount, setScoutCount] = useState<number>(1);
  const [selectedTargetPlanetId, setSelectedTargetPlanetId] = useState<string>(() => {
    if (initialTargetPlanetId) return initialTargetPlanetId;
    const foreign = Object.values(state.planets).find((p) => p.ownerId !== activePlayerId);
    return foreign ? foreign.id : '';
  });

  const player = state.players[activePlayerId];
  const originPlanet = activePlanet || Object.values(state.planets).find((p) => p.ownerId === activePlayerId);

  // Active Spy Networks owned by player
  const mySpyNetworks = useMemo(() => {
    return Object.values(state.spyNetworks || {}).filter((n) => n.ownerId === activePlayerId);
  }, [state.spyNetworks, activePlayerId]);

  // Set default selected network if not set
  React.useEffect(() => {
    if (!selectedNetworkId && mySpyNetworks.length > 0) {
      setSelectedNetworkId(mySpyNetworks[0].id);
    }
  }, [selectedNetworkId, mySpyNetworks]);

  const activeNetwork = useMemo(() => {
    return mySpyNetworks.find((n) => n.id === selectedNetworkId) || mySpyNetworks[0];
  }, [mySpyNetworks, selectedNetworkId]);

  // Candidate foreign players without an active network
  const potentialTargets = useMemo(() => {
    return Object.values(state.players).filter((p) => {
      if (p.id === activePlayerId) return false;
      const key = getSpyNetworkKey(activePlayerId, p.id);
      return !state.spyNetworks?.[key];
    });
  }, [state.players, state.spyNetworks, activePlayerId]);

  React.useEffect(() => {
    if (!selectedTargetPlayerId && potentialTargets.length > 0) {
      setSelectedTargetPlayerId(potentialTargets[0].id);
    }
  }, [selectedTargetPlayerId, potentialTargets]);

  // Active Covert Operations involving player
  const myActiveCovertOps = useMemo(() => {
    return Object.values(state.covertOperations || {}).filter(
      (o) => o.infiltratorId === activePlayerId && o.status === 'in_progress'
    );
  }, [state.covertOperations, activePlayerId]);

  // Player's counter-espionage stance and score
  const myStance: CounterEspionageStance = player?.counterEspionageStance || 'relaxed';
  const myCounterIntelScore = useMemo(() => {
    return calculateCounterIntelScore(state, activePlayerId);
  }, [state, activePlayerId]);

  // Legacy reports
  const myReports = (player?.espionageReports || []).filter((r) => r.infiltratorId === activePlayerId);
  const securityAlerts = (player?.espionageReports || []).filter((r) => r.targetPlayerId === activePlayerId && r.detected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col stellaris-modal rounded-sm border border-[#2b4c63] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1b3a4b] bg-gradient-to-r from-[#0d1f2d] via-[#132c3f] to-[#0a1824]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-purple-600/40 to-slate-900 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="stellaris-gold font-display text-base font-bold tracking-wider flex items-center gap-2">
                GALAKTİK CASUSLUK & ÖRTÜLÜ OPERASYONLAR
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/70 border border-purple-500/50 px-2 py-0.5 rounded-sm font-normal">
                  FAZ 23
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sızma Ağları • Gizli Varlıklar • Sabotaj & Teknoloji Hırsızlığı • Karşı-İstihbarat Güvenliği
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1b3a4b] bg-[#08131d] overflow-x-auto">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('networks');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'networks'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            CASUS AĞLARI & SIZMA
            {mySpyNetworks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-purple-950 border border-purple-500/50 text-purple-300">
                {mySpyNetworks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('operations');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-rose-400 text-rose-300 bg-rose-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            GİZLİ OPERASYONLAR
            {myActiveCovertOps.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-950 border border-rose-500/50 text-rose-300 animate-pulse">
                {myActiveCovertOps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('assets');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            GİZLİ VARLIKLAR & AJANLAR
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('counterIntel');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'counterIntel'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            KARŞI İSTİHBARAT & GÜVENLİK
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dossiers');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'dossiers'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            İSTİHBARAT ARŞİVİ
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#050b14]/90 space-y-5">
          {/* TAB 1: CASUS AĞLARI & SIZMA */}
          {activeTab === 'networks' && (
            <div className="space-y-5">
              {/* Network Selector Cards */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#1b3a4b] pb-3">
                <span className="text-xs font-display text-slate-400 font-bold uppercase tracking-wider mr-2">
                  Aktif Ağlar:
                </span>
                {mySpyNetworks.map((net) => {
                  const targetEmpire = state.players[net.targetPlayerId];
                  const isSelected = activeNetwork?.id === net.id;
                  return (
                    <button
                      key={net.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedNetworkId(net.id);
                      }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-display font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md'
                          : 'bg-[#0d1e2e] border-[#22445e] text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: targetEmpire?.color || '#a855f7' }} />
                      {targetEmpire?.name || 'Hedef'}
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-900/40 px-1 py-0.2 rounded">
                        %{Math.round(net.infiltrationLevel)}
                      </span>
                    </button>
                  );
                })}

                {mySpyNetworks.length === 0 && (
                  <span className="text-xs text-slate-500 italic">Henüz kurulu bir casusluk ağınız bulunmuyor.</span>
                )}
              </div>

              {/* Active Network Detail View */}
              {activeNetwork && (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162e42] pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-sm flex items-center justify-center font-display font-bold text-white shadow-inner text-sm"
                        style={{ backgroundColor: state.players[activeNetwork.targetPlayerId]?.color || '#7c3aed' }}
                      >
                        {state.players[activeNetwork.targetPlayerId]?.name?.substring(0, 2).toUpperCase() || 'TR'}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-100 text-sm flex items-center gap-2">
                          {state.players[activeNetwork.targetPlayerId]?.name}
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                            {state.players[activeNetwork.targetPlayerId]?.botArchetype?.toUpperCase() || 'OYUNCU'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Hedef Karşı-İstihbarat Duruşu: <span className="font-semibold text-slate-200">{state.players[activeNetwork.targetPlayerId]?.counterEspionageStance || 'relaxed'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onRecallNetwork) {
                            sound.playClick();
                            onRecallNetwork(activeNetwork.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-sm border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-display font-bold tracking-wider transition-colors"
                      >
                        AĞI GERİ ÇEK & FESHET
                      </button>
                    </div>
                  </div>

                  {/* Infiltration Meter & Cap */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 p-3 rounded-sm border border-[#1b3a4b] bg-[#07131e]/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-display font-bold text-slate-300 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          SIZMA SEVİYESİ & TAVANI
                        </span>
                        <span className="font-mono text-purple-300 font-bold">
                          {activeNetwork.infiltrationLevel.toFixed(1)} / {activeNetwork.infiltrationCap} TAVAN
                        </span>
                      </div>

                      {/* Dual Progress Bar: Current level + Cap ceiling */}
                      <div className="relative w-full h-3 bg-slate-900 rounded-sm overflow-hidden border border-slate-700/60">
                        {/* Cap indicator */}
                        <div
                          className="absolute top-0 bottom-0 bg-slate-800/80 border-r-2 border-purple-400/80"
                          style={{ width: `${activeNetwork.infiltrationCap}%` }}
                        />
                        {/* Actual infiltration */}
                        <div
                          className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300"
                          style={{ width: `${activeNetwork.infiltrationLevel}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono">
                        <span className="flex items-center gap-1">
                          {calculateInfiltrationGrowthPerSec(state, activeNetwork) >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-400" />
                          )}
                          Hız: {calculateInfiltrationGrowthPerSec(state, activeNetwork) >= 0 ? '+' : ''}
                          {(calculateInfiltrationGrowthPerSec(state, activeNetwork) * 60).toFixed(1)} / dk
                        </span>
                        <span>Hedef Karşı-İstihbarat Direnci: {calculateCounterIntelScore(state, activeNetwork.targetPlayerId)}</span>
                      </div>
                    </div>

                    {/* Envoy Control */}
                    <div className="p-3 rounded-sm border border-[#1b3a4b] bg-[#07131e]/80 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-display font-bold text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            GÖREVLİ ELÇİLER
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">{activeNetwork.assignedEnvoys} / 3</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {activeNetwork.assignedEnvoys === 0
                            ? 'Elçi atanmadı (Sızma pasif olarak eriyor).'
                            : `${activeNetwork.assignedEnvoys} diplomatik ajan gizli sızmayı yönetiyor.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        {[0, 1, 2, 3].map((count) => (
                          <button
                            key={count}
                            onClick={() => {
                              if (onAssignEnvoy) {
                                sound.playClick();
                                onAssignEnvoy(activeNetwork.id, count);
                              }
                            }}
                            className={`flex-1 py-1 text-xs font-mono font-bold rounded-sm border transition-all ${
                              activeNetwork.assignedEnvoys === count
                                ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                                : 'bg-[#0d1e2e] border-[#1e3c54] text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tiered Intel Readout */}
                  {(() => {
                    const intel = getTieredIntel(state, activePlayerId, activeNetwork.targetPlayerId);
                    return (
                      <div className="p-3 rounded-sm border border-[#1b3a4b] bg-[#061019] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-display font-bold text-slate-200 flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 text-emerald-400" />
                            AÇILAN İSTİHBARAT KADEMESİ
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                            {intel.tier === 'full' && 'KADEME 4: TAM SIZMA (90+)'}
                            {intel.tier === 'high' && 'KADEME 3: YÜKSEK İSTİHBARAT (60+)'}
                            {intel.tier === 'medium' && 'KADEME 2: ORTA SEVİYE ANALİZ (30+)'}
                            {intel.tier === 'low' && 'KADEME 1: TEMEL KEŞİF (10+)'}
                            {intel.tier === 'none' && 'KADEME 0: SİS PERDESİ (<10)'}
                          </span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {intel.intelDetailsTr.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Establish New Network Section */}
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#091522]/90 space-y-3">
                <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  YENİ BİR HEDEFTE CASUSLUK AĞI KUR
                </h3>
                <p className="text-xs text-slate-400">
                  Rakip bir imparatorluk sınırları içine gizli operasyon hücreleri konuşlandırın (Maliyet: 60 Cevher, 40 Kristal, 40 Yakıt).
                </p>

                {potentialTargets.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={selectedTargetPlayerId}
                      onChange={(e) => setSelectedTargetPlayerId(e.target.value)}
                      className="bg-[#061019] border border-[#2b4c63] text-slate-200 text-xs px-3 py-2 rounded-sm flex-1 outline-none font-display"
                    >
                      {potentialTargets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.botArchetype || 'Oyuncu'})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        if (selectedTargetPlayerId && onEstablishNetwork) {
                          sound.playLaunch();
                          onEstablishNetwork(selectedTargetPlayerId);
                        }
                      }}
                      className="px-5 py-2 rounded-sm bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      GİZLİ HÜCRE OLUŞTUR
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Bilinen tüm imparatorluklarda zaten aktif bir casusluk şebekeniz mevcut.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GİZLİ OPERASYONLAR */}
          {activeTab === 'operations' && (
            <div className="space-y-5">
              {/* In-Progress Operations Strip */}
              {myActiveCovertOps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
                    YÜRÜTÜLEN GİZLİ OPERASYONLAR ({myActiveCovertOps.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myActiveCovertOps.map((op) => {
                      const cfg = COVERT_OP_CONFIGS[op.opType];
                      const targetEmpire = state.players[op.targetPlayerId];
                      return (
                        <div
                          key={op.id}
                          className="p-3 rounded-sm border border-rose-500/50 bg-rose-950/20 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-display font-bold text-slate-100 flex items-center gap-2">
                              <span>{cfg?.icon || '🕶️'}</span>
                              {cfg?.nameTr}
                            </span>
                            <span className="text-[10px] font-mono text-rose-300 font-bold">
                              %{Math.round(op.progressPercent)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Hedef: <span className="text-slate-200 font-semibold">{targetEmpire?.name}</span>
                          </p>

                          <div className="w-full h-2 bg-slate-900 rounded-sm overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                              style={{ width: `${op.progressPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Kalan Süre: {Math.max(0, Math.round((op.durationMs * (100 - op.progressPercent)) / 100000))} sn
                            </span>
                            <button
                              onClick={() => {
                                if (onCancelCovertOp) {
                                  sound.playClick();
                                  onCancelCovertOp(op.id);
                                }
                              }}
                              className="text-[10px] font-display text-rose-400 hover:text-rose-200 underline"
                            >
                              İptal Et
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Covert Operation Launch Suite */}
              {activeNetwork ? (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#162e42] pb-3">
                    <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-purple-400" />
                      GİZLİ OPERASYON SEVKİYATI ({state.players[activeNetwork.targetPlayerId]?.name})
                    </h3>
                    <span className="text-xs font-mono text-purple-300">
                      Mevcut Sızma: {activeNetwork.infiltrationLevel.toFixed(1)} / {activeNetwork.infiltrationCap}
                    </span>
                  </div>

                  {/* Operation Catalog Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(COVERT_OP_CONFIGS) as CovertOpType[]).map((opKey) => {
                      const cfg = COVERT_OP_CONFIGS[opKey];
                      const isSelected = selectedCovertOpType === opKey;
                      const hasInfiltration = activeNetwork.infiltrationLevel >= cfg.requiredInfiltration;

                      return (
                        <div
                          key={opKey}
                          onClick={() => {
                            sound.playClick();
                            setSelectedCovertOpType(opKey);
                          }}
                          className={`p-3 rounded-sm border cursor-pointer transition-all space-y-2 ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-400 shadow-md'
                              : 'bg-[#07131e] border-[#1b3a4b] hover:border-slate-500'
                          } ${!hasInfiltration ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                              <span>{cfg.icon}</span>
                              {cfg.nameTr}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                hasInfiltration
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              Gereken Sızma: {cfg.requiredInfiltration}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">{cfg.descriptionTr}</p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                            <span>Maliyet: -{cfg.infiltrationCost} Sızma</span>
                            <span>Süre: {Math.round(cfg.durationMs / 1000)} sn</span>
                            <span className="text-emerald-400">Temel Şans: %{Math.round(cfg.baseSuccessRate * 100)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Operative Asset Assignment & Launch Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#162e42]">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-display text-slate-400">Atanacak Varlık:</span>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="bg-[#061019] border border-[#2b4c63] text-slate-200 text-xs px-2.5 py-1.5 rounded-sm outline-none font-display flex-1"
                      >
                        <option value="">Atanmamış (Standart Ajan Hücresi)</option>
                        {activeNetwork.assets?.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        const cfg = COVERT_OP_CONFIGS[selectedCovertOpType];
                        if (activeNetwork.infiltrationLevel < cfg.requiredInfiltration) {
                          sound.playError();
                          return;
                        }
                        if (onLaunchCovertOp) {
                          sound.playLaunch();
                          onLaunchCovertOp(
                            activeNetwork.id,
                            selectedCovertOpType,
                            undefined,
                            selectedAssetId || undefined
                          );
                        }
                      }}
                      disabled={activeNetwork.infiltrationLevel < COVERT_OP_CONFIGS[selectedCovertOpType].requiredInfiltration}
                      className={`px-6 py-2.5 rounded-sm font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                        activeNetwork.infiltrationLevel >= COVERT_OP_CONFIGS[selectedCovertOpType].requiredInfiltration
                          ? 'bg-gradient-to-r from-rose-700 to-purple-700 hover:from-rose-600 hover:to-purple-600 text-white cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      OPERASYONU BAŞLAT
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-[#0a1824]/60 border border-[#1b3a4b] rounded-sm">
                  Operasyon başlatmak için önce bir casusluk ağı kurmalı veya seçmelisiniz.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GİZLİ VARLIKLAR & AJANLAR */}
          {activeTab === 'assets' && (
            <div className="space-y-5">
              {/* Existing Assets List */}
              {activeNetwork && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    DEVŞİRİLMİŞ GİZLİ VARLIKLAR ({state.players[activeNetwork.targetPlayerId]?.name})
                  </h3>

                  {activeNetwork.assets && activeNetwork.assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeNetwork.assets.map((asset) => {
                        const cfg = SPY_ASSET_CONFIGS[asset.type];
                        return (
                          <div
                            key={asset.id}
                            className="p-3 rounded-sm border border-amber-500/40 bg-amber-950/20 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                                <span>{cfg?.icon}</span>
                                {asset.name}
                              </span>
                              <span className="text-[10px] font-mono text-amber-300 uppercase bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                                {cfg?.nameTr}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">{asset.bonusDescriptionTr}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 border border-slate-800 bg-[#07131e] rounded-sm">
                      Bu ağda henüz devşirilmiş bir gizli varlık bulunmuyor. Aşağıdan yeni bir varlık istihdam edebilirsiniz.
                    </p>
                  )}
                </div>
              )}

              {/* Recruitment Catalog */}
              {activeNetwork && (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                  <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    YENİ GİZLİ VARLIK DEVŞİR ({state.players[activeNetwork.targetPlayerId]?.name})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(SPY_ASSET_CONFIGS) as SpyAssetType[]).map((typeKey) => {
                      const cfg = SPY_ASSET_CONFIGS[typeKey];
                      const alreadyOwned = activeNetwork.assets?.some((a) => a.type === typeKey);

                      return (
                        <div
                          key={typeKey}
                          className={`p-3 rounded-sm border space-y-2 transition-all ${
                            alreadyOwned
                              ? 'bg-slate-900/60 border-slate-700/60 opacity-60'
                              : 'bg-[#07131e] border-[#1b3a4b]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                              <span>{cfg.icon}</span>
                              {cfg.nameTr}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {cfg.cost.ore}C / {cfg.cost.crystal}K / {cfg.cost.fuel}Y
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">{cfg.bonusDescriptionTr}</p>

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                if (!alreadyOwned && onAcquireAsset) {
                                  sound.playTech();
                                  onAcquireAsset(activeNetwork.id, typeKey);
                                }
                              }}
                              disabled={alreadyOwned}
                              className={`w-full py-1.5 rounded-sm font-display text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                alreadyOwned
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-200'
                              }`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {alreadyOwned ? 'AĞA DAHİL EDİLDİ' : 'VARLIĞI DEVŞİR'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KARŞI İSTİHBARAT & GÜVENLİK */}
          {activeTab === 'counterIntel' && (
            <div className="space-y-5">
              {/* Defense Score Header Card */}
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-emerald-600/30 to-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-100 text-sm">
                      İMPARATORLUK KARŞI-İSTİHBARAT KALKANI
                    </h3>
                    <p className="text-xs text-slate-400">
                      Yabancı sızmalara karşı savunma puanınız: <span className="text-emerald-400 font-mono font-bold">{myCounterIntelScore} / 100</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400">GÜVENLİK PROTOKOLÜ:</span>
                  <div className="font-display font-bold text-xs uppercase text-emerald-300">
                    {COUNTER_ESPIONAGE_CONFIGS[myStance].nameTr}
                  </div>
                </div>
              </div>

              {/* Counter-Intelligence Stances Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(COUNTER_ESPIONAGE_CONFIGS) as CounterEspionageStance[]).map((stanceKey) => {
                  const cfg = COUNTER_ESPIONAGE_CONFIGS[stanceKey];
                  const isSelected = myStance === stanceKey;

                  return (
                    <div
                      key={stanceKey}
                      onClick={() => {
                        if (onSetCounterStance) {
                          sound.playClick();
                          onSetCounterStance(stanceKey);
                        }
                      }}
                      className={`p-4 rounded-sm border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-md'
                          : 'bg-[#07131e] border-[#1b3a4b] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          {cfg.nameTr}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                            AKTİF
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">{cfg.descriptionTr}</p>

                      <div className="text-[10px] text-slate-300 font-mono pt-2 border-t border-slate-800 space-y-0.5">
                        <div>Savunma Bonusu: +{cfg.counterIntelBonus}</div>
                        <div>Düşman Sızma Tavanı: -{cfg.enemyCapReduction}</div>
                        <div>Yakalanma Riski: +%{Math.round(cfg.detectionChanceBonus * 100)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Intercepted Dossiers */}
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-3">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  YAKALANAN DÜŞMAN CASUSLUK GİRİŞİMLERİ ({securityAlerts.length})
                </h3>

                {securityAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {securityAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-sm border border-rose-500/40 bg-rose-950/20 text-xs text-slate-300 space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-rose-300">
                            {alert.infiltratorName} casusu suçüstü yakalandı!
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{formatSimClock(alert.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{alert.detailsTr}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Kayıtlı herhangi bir güvenlik ihlali tespit edilmedi.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: İSTİHBARAT ARŞİVİ */}
          {activeTab === 'dossiers' && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                İMPARATORLUK İSTİHBARAT DOSYALARI ({myReports.length})
              </h3>

              {myReports.length > 0 ? (
                <div className="space-y-2">
                  {myReports.map((report) => {
                    const isExpanded = expandedReportId === report.id;
                    return (
                      <div
                        key={report.id}
                        className="rounded-sm border border-[#1b3a4b] bg-[#0a1824] overflow-hidden"
                      >
                        <div
                          onClick={() => {
                            sound.playClick();
                            setExpandedReportId(isExpanded ? null : report.id);
                          }}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#0f2436] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={report.success ? 'text-emerald-400' : 'text-rose-400'}>
                              {report.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            </span>
                            <div>
                              <div className="font-display font-bold text-xs text-slate-200">
                                {report.targetPlayerName} • {report.targetPlanetName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Operasyon: {report.opType} • Tarih: {formatSimClock(report.timestamp)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                report.success
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {report.success ? 'BAŞARILI' : 'BAŞARISIZ'}
                            </span>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 py-3 border-t border-[#162e42] bg-[#061019] text-xs text-slate-300 space-y-2">
                            <p>{report.detailsTr}</p>
                            {report.intelData && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
                                <div>Cevher: {report.intelData.resources?.ore}</div>
                                <div>Kristal: {report.intelData.resources?.crystal}</div>
                                <div>Yakıt: {report.intelData.resources?.fuel}</div>
                                <div>Garnizon: {report.intelData.garrison?.fighter || 0} Avcı</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-6 text-center border border-slate-800 bg-[#07131e] rounded-sm">
                  Arşivde henüz kayıtlı istihbarat dosyası bulunmuyor.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1b3a4b] bg-[#07131e] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2 font-mono text-[11px]">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Casusluk Protokolü: Sızma tavanı Karşı-İstihbarat ve Sensör seviyeleriyle sınırlıdır.
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-sm border border-[#2b4c63] hover:border-slate-400 text-slate-300 font-display text-xs font-bold transition-colors"
          >
            KAPAT
          </button>
        </div>
      </div>
    </div>
  );
};
