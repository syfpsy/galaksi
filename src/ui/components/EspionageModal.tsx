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
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { EspionageOpType, EspionageReport, GameState, Planet, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { formatSimClock } from '../timeUtils';
import { sound } from '../sound';

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
}

interface OpTypeMeta {
  type: EspionageOpType;
  titleTr: string;
  badge: string;
  icon: React.ReactNode;
  descTr: string;
  rewardDescTr: string;
}

const OP_TYPES: OpTypeMeta[] = [
  {
    type: 'infiltrate_intel',
    titleTr: 'Taktik İstihbarat Sızması',
    badge: 'KEŞİF & ANALİZ',
    icon: <Search className="w-4 h-4 text-cyan-400" />,
    descTr: 'Düşman kolonisine sızarak tüm tesis seviyelerini, konuşlu filoyu, savunma platformlarını ve Ar-Ge durumunu deşifre eder.',
    rewardDescTr: 'Ayrıntılı askeri istihbarat dosyası elde edilir.',
  },
  {
    type: 'sabotage_shipyard',
    titleTr: 'Tersane & Savunma Sabotajı',
    badge: 'OPERASYONEL SABOTAJ',
    icon: <Wrench className="w-4 h-4 text-rose-400" />,
    descTr: 'Düşman tersanesine sızıp montaj hatlarını bozar, gemi veya savunma tareti inşasını 60 saniye geciktirir.',
    rewardDescTr: 'Hedefin askeri üretim hattı sekteye uğrar.',
  },
  {
    type: 'tech_espionage',
    titleTr: 'Teknoloji Hırsızlığı',
    badge: 'TERSİNE MÜHENDİSLİK',
    icon: <Binary className="w-4 h-4 text-purple-400" />,
    descTr: 'Düşman Ar-Ge sunucularından gizli askeri şemaları kopyalar ve üssünüze yüksek değerli kaynak aktarır.',
    rewardDescTr: '+350 Cevher, +250 Kristal, +150 Yakıt değerinde veri çalınır.',
  },
  {
    type: 'destabilize_production',
    titleTr: 'Üretim & Enerji Sabotajı',
    badge: 'KAYNAK SIZINTISI',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    descTr: 'Maden ve rafineri dağıtım şebekesini kısa devre yaptırarak hedef koloniden ciddi kaynak sızıntısına yol açar.',
    rewardDescTr: 'Hedefin depolanmış kaynaklarının %25\'e kadarı buharlaşır.',
  },
];

export const EspionageModal: React.FC<EspionageModalProps> = ({
  state,
  activePlayerId,
  activePlanet,
  initialTargetPlanetId,
  onClose,
  onLaunchOp,
}) => {
  const [activeTab, setActiveTab] = useState<'launch' | 'dossiers' | 'counterIntel'>('launch');
  const [selectedOpType, setSelectedOpType] = useState<EspionageOpType>('infiltrate_intel');
  const [scoutCount, setScoutCount] = useState<number>(1);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    if (initialTargetPlanetId) return initialTargetPlanetId;
    // Default to first foreign planet found
    const foreign = Object.values(state.planets).find(p => p.ownerId !== activePlayerId);
    return foreign ? foreign.id : '';
  });
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const player = state.players[activePlayerId];
  const originPlanet = activePlanet || Object.values(state.planets).find(p => p.ownerId === activePlayerId);
  const availableScouts = originPlanet?.garrison.scout || 0;
  const targetPlanet = state.planets[selectedTargetId];
  const targetPlayer = targetPlanet ? state.players[targetPlanet.ownerId] : null;

  // Potential targets list (all foreign planets)
  const foreignPlanets = useMemo(() => {
    return Object.values(state.planets).filter(p => p.ownerId !== activePlayerId);
  }, [state.planets, activePlayerId]);

  // Operational metrics
  const missionMetrics = useMemo(() => {
    if (!originPlanet || !targetPlanet) {
      return { distance: 0, fuelCost: 0, durationMs: 0, successChance: 50, detectionChance: 30 };
    }
    const originSys = state.map.systems[originPlanet.systemId];
    const targetSys = state.map.systems[targetPlanet.systemId];
    if (!originSys || !targetSys) {
      return { distance: 0, fuelCost: 0, durationMs: 0, successChance: 50, detectionChance: 30 };
    }
    const distance = Math.round(Math.hypot(targetSys.x - originSys.x, targetSys.y - originSys.y));
    const fuelCost = Math.max(15, Math.round(scoutCount * (15 + distance * 0.08)));

    const engineTech = player?.research?.engines || 0;
    const speed = SHIP_STATS.scout.speed * (1 + engineTech * 0.15);
    const durationMs = Math.max(2000, Math.round((distance / speed) * 1000));

    // Ratings
    const sensorArrayLvl = targetPlanet.buildings?.sensor_array || 0;
    const defenderSensorsTech = targetPlayer?.research?.sensors || 0;
    const counterIntelRating = (sensorArrayLvl * 15) + (defenderSensorsTech * 10);

    const infiltratorSensorsTech = player?.research?.sensors || 0;
    const stealthRating = 45 + (scoutCount * 8) + (infiltratorSensorsTech * 12);

    const successChance = Math.round(Math.max(0.15, Math.min(0.92, 0.60 + (stealthRating - counterIntelRating) / 100)) * 100);
    const detectionChance = Math.round(Math.max(0.10, Math.min(0.85, 0.35 + (counterIntelRating - stealthRating) / 100)) * 100);

    return { distance, fuelCost, durationMs, successChance, detectionChance, stealthRating, counterIntelRating };
  }, [originPlanet, targetPlanet, scoutCount, player, targetPlayer, state.map.systems]);

  const canAfford = originPlanet && originPlanet.resources.fuel >= missionMetrics.fuelCost && availableScouts >= scoutCount;

  const handleLaunch = () => {
    if (!originPlanet || !targetPlanet || !canAfford) {
      sound.playError();
      return;
    }
    sound.playClick();
    onLaunchOp(originPlanet.id, targetPlanet.id, selectedOpType, scoutCount);
    setActiveTab('dossiers');
  };

  const myReports = (player?.espionageReports || []).filter(r => r.infiltratorId === activePlayerId);
  const securityAlerts = (player?.espionageReports || []).filter(r => r.targetPlayerId === activePlayerId && r.detected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col stellaris-modal rounded-sm border border-[#2b4c63] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1b3a4b] bg-gradient-to-r from-[#0d1f2d] via-[#132c3f] to-[#0a1824]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-purple-600/30 to-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="stellaris-gold font-display text-base font-bold tracking-wider flex items-center gap-2">
                GİZLİ OPERASYONLAR & CASUSLUK ŞEBEKESİ
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/40 px-1.5 py-0.2 rounded-sm font-normal">
                  GÖLGE AĞI
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sessiz Keşif Sondaları • Tersane Sabotajı • Tersine Mühendislik • Karşı-İstihbarat Kalkanı
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
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1b3a4b] bg-[#08131d]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('launch');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'launch'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            GÖREV SEVKİ
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dossiers');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 relative ${
              activeTab === 'dossiers'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            İSTİHBARAT DOSYALARI
            {myReports.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                {myReports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('counterIntel');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 relative ${
              activeTab === 'counterIntel'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            KARŞI-İSTİHBARAT & GÜVENLİK
            {securityAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-950 border border-rose-500/50 text-rose-300">
                {securityAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* TAB 1: LAUNCH COVERT OP */}
          {activeTab === 'launch' && (
            <div className="space-y-4">
              
              {/* Target Colony Selector */}
              <div className="p-3.5 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
                <div className="flex items-center justify-between text-xs font-bold font-display text-slate-200 tracking-wider mb-2">
                  <span className="flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                    HEDEF YILDIZ SİSTEMİ VE KOLONİ SEÇİMİ
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Üs: <strong className="text-cyan-300">{originPlanet?.name}</strong> (Mevcut Keşif Sondası: <strong className="text-amber-300">{availableScouts}x</strong>)
                  </span>
                </div>

                {foreignPlanets.length === 0 ? (
                  <div className="p-4 text-center text-xs font-mono text-slate-500">
                    Galakside bilinen yabancı koloni bulunamadı. Önce keşif filoları sevk edin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {foreignPlanets.map((fp) => {
                      const isSelected = selectedTargetId === fp.id;
                      const owner = state.players[fp.ownerId];
                      const sys = state.map.systems[fp.systemId];

                      return (
                        <button
                          key={fp.id}
                          onClick={() => {
                            sound.playHover();
                            setSelectedTargetId(fp.id);
                          }}
                          className={`p-2.5 rounded-sm border text-left flex items-start justify-between transition-all ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500/60 shadow-md ring-1 ring-purple-500/40'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>{fp.name}</span>
                              {fp.isHomeworld && (
                                <span className="text-[8.5px] px-1 rounded bg-amber-950/60 text-amber-300 border border-amber-600/30">
                                  Ana Dünya
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: owner?.color || '#94a3b8' }}
                              />
                              <span>{owner?.name || 'Bilinmeyen'}</span>
                            </div>
                            <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                              Sistem: {sys?.name || 'Bilinmeyen'}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Covert Operation Types Selection */}
              <div className="p-3.5 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
                <div className="text-xs font-bold font-display text-slate-200 tracking-wider mb-2.5 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  GİZLİ OPERASYON DOKTRİNİ VE HEDEF GÖREVİ
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OP_TYPES.map((op) => {
                    const isSelected = selectedOpType === op.type;
                    return (
                      <div
                        key={op.type}
                        onClick={() => {
                          sound.playHover();
                          setSelectedOpType(op.type);
                        }}
                        className={`p-3 rounded-sm border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-500/80 shadow-md ring-1 ring-purple-500/30'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-slate-900 border border-slate-800">
                              {op.icon}
                            </div>
                            <span className="font-semibold text-xs text-white">{op.titleTr}</span>
                          </div>
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-1 py-0.2 rounded-sm">
                            {op.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug mb-1.5">{op.descTr}</p>
                        <div className="text-[10px] font-mono text-emerald-400 border-t border-slate-800/60 pt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{op.rewardDescTr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mission Parameters, Scout Allocation & Launch */}
              <div className="p-3.5 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  
                  {/* Scout Count */}
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>GÖREVLİ KEŞİF SONDASI</span>
                      <span className="text-amber-400 font-bold">{scoutCount}x Gemi</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => {
                            sound.playHover();
                            setScoutCount(cnt);
                          }}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                            scoutCount === cnt
                              ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cnt}x
                        </button>
                      ))}
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-500 mt-1.5">
                      Daha fazla sonda başarı ve gizlilik puanını artırır.
                    </div>
                  </div>

                  {/* Success Probability */}
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>BAŞARI OLASILIĞI</span>
                      <span className="text-emerald-400 font-bold">%{missionMetrics.successChance}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${missionMetrics.successChance}%` }}
                      />
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-500 mt-1.5 flex justify-between">
                      <span>Gizlilik: {missionMetrics.stealthRating}</span>
                      <span>Savunma: {missionMetrics.counterIntelRating}</span>
                    </div>
                  </div>

                  {/* Detection Risk & Fuel */}
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>TESPİT EDİLME RİSKİ</span>
                      <span className="text-rose-400 font-bold">%{missionMetrics.detectionChance}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div
                        className="h-full bg-rose-500 transition-all duration-300"
                        style={{ width: `${missionMetrics.detectionChance}%` }}
                      />
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-400 mt-1.5 flex justify-between">
                      <span>Yakıt: <strong className="text-amber-300">{missionMetrics.fuelCost}Y</strong></span>
                      <span>Süre: <strong className="text-cyan-300">{Math.round(missionMetrics.durationMs / 1000)} sn</strong></span>
                    </div>
                  </div>

                </div>

                {/* Launch Action Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    {availableScouts < scoutCount ? (
                      <span className="text-rose-400">⚠️ Kolonide yeterli keşif gemisi yok ({availableScouts}/{scoutCount}).</span>
                    ) : (originPlanet?.resources.fuel || 0) < missionMetrics.fuelCost ? (
                      <span className="text-rose-400">⚠️ Yetersiz yakıt ({Math.floor(originPlanet?.resources.fuel || 0)}/{missionMetrics.fuelCost}).</span>
                    ) : (
                      <span className="text-slate-300">
                        Operasyon onaylandığında sondalar sessiz moda geçerek fırlatılacaktır.
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!canAfford || !targetPlanet}
                    onClick={handleLaunch}
                    className={`px-5 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                      canAfford && targetPlanet
                        ? 'stellaris-btn-metallic text-purple-200 border-purple-500/60 shadow-lg hover:scale-105 active:scale-95'
                        : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-4 h-4 text-purple-400" />
                    Casusluk Görevini Başlat
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CLASSIFIED DOSSIERS */}
          {activeTab === 'dossiers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold font-display text-slate-200 tracking-wider mb-1">
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  ELE GEÇİRİLEN GİZLİ ASKERİ İSTİHBARAT DOSYALARI
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Toplam Rapor: {myReports.length}
                </span>
              </div>

              {myReports.length === 0 ? (
                <div className="p-8 text-center rounded-sm stellaris-outliner border border-slate-800 text-slate-500 text-xs font-mono">
                  Henüz tamamlanan bir casusluk görevi bulunmuyor. "GÖREV SEVKİ" sekmesinden yeni bir gizli operasyon başlatabilirsiniz.
                </div>
              ) : (
                <div className="space-y-2">
                  {myReports.map((rep) => {
                    const isExpanded = expandedReportId === rep.id;
                    const opMeta = OP_TYPES.find(o => o.type === rep.opType);

                    return (
                      <div
                        key={rep.id}
                        className={`rounded-sm border transition-all ${
                          rep.success
                            ? 'border-cyan-500/40 bg-[#08131d]'
                            : 'border-rose-500/40 bg-rose-950/10'
                        }`}
                      >
                        {/* Report Header Card */}
                        <div
                          onClick={() => {
                            sound.playClick();
                            setExpandedReportId(isExpanded ? null : rep.id);
                          }}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-sm border ${
                                rep.success
                                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {rep.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                            </div>

                            <div>
                              <div className="font-semibold text-xs text-white flex items-center gap-2">
                                <span>{rep.targetPlanetName}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-300">{rep.targetPlayerName}</span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {opMeta?.titleTr || rep.opType}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{rep.detailsTr}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-xs">
                            <div className="text-right text-[10px]">
                              <span className={rep.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {rep.success ? 'BAŞARILI' : 'BAŞARISIZ'}
                              </span>
                              <div className="text-slate-500">{formatSimClock(rep.timestamp)}</div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? 'rotate-180 text-cyan-400' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Detailed Intel Data Dossier */}
                        {isExpanded && rep.intelData && (
                          <div className="p-4 border-t border-slate-800/80 bg-[#050e17] space-y-3 animate-in fade-in duration-150">
                            
                            {/* Snapshot Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              
                              {/* 1. Facilities */}
                              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono">
                                <div className="font-bold text-amber-300 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                                  <span>GEZEGEN TESİSLERİ</span>
                                </div>
                                <div className="space-y-1 text-slate-300 text-[11px]">
                                  <div className="flex justify-between">
                                    <span>Maden:</span> <strong>L{rep.intelData.buildings.ore_mine}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Kristal:</span> <strong>L{rep.intelData.buildings.crystal_synth}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Rafineri:</span> <strong>L{rep.intelData.buildings.fuel_refinery}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tersane:</span> <strong>L{rep.intelData.buildings.shipyard}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Sensör:</span> <strong>L{rep.intelData.buildings.sensor_array}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Defenses & Fleet */}
                              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono">
                                <div className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>GARNİZON & SAVUNMA</span>
                                </div>
                                <div className="space-y-1 text-slate-300 text-[11px]">
                                  <div className="flex justify-between">
                                    <span>🚀 Füze Bataryası:</span> <strong className="text-cyan-300">{rep.intelData.defenses.missile_battery}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>🔥 Plazma Tareti:</span> <strong className="text-amber-300">{rep.intelData.defenses.plasma_turret}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>⚡ İyon Topu:</span> <strong className="text-purple-300">{rep.intelData.defenses.ion_cannon}</strong>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-800/60">
                                    <span>⚔️ Avcı Filosu:</span> <strong>{rep.intelData.garrison.fighter}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>🛡️ Kruvazör:</span> <strong>{rep.intelData.garrison.battleship}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Resources & Tech */}
                              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono">
                                <div className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                  <Binary className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>KAYNAKLAR & AR-GE</span>
                                </div>
                                <div className="space-y-1 text-slate-300 text-[11px]">
                                  <div className="flex justify-between">
                                    <span>Cevher:</span> <strong>{Math.floor(rep.intelData.resources.ore).toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Kristal:</span> <strong>{Math.floor(rep.intelData.resources.crystal).toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Yakıt:</span> <strong>{Math.floor(rep.intelData.resources.fuel).toLocaleString()}</strong>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-800/60">
                                    <span>Motorlar:</span> <strong>L{rep.intelData.research.engines}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Silahlar:</span> <strong>L{rep.intelData.research.weapons}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Sensörler:</span> <strong>L{rep.intelData.research.sensors}</strong>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Active Queues Alert */}
                            {rep.intelData.buildingQueue && (
                              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-center justify-between">
                                <span>🏗️ Devam Eden İnşaat: {rep.intelData.buildingQueue.type} Seviye {rep.intelData.buildingQueue.targetLevel}</span>
                                <span className="text-[10px] text-amber-400">Şu anda inşa halinde</span>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COUNTER-INTEL & DEFENSE */}
          {activeTab === 'counterIntel' && (
            <div className="space-y-4">
              
              {/* Colony Security Grid */}
              <div className="p-3.5 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
                <div className="text-xs font-bold font-display text-slate-200 tracking-wider mb-2.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  KOLONİ KARŞI-İSTİHBARAT KALKANI VE SENSÖR AĞI
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(state.planets)
                    .filter(p => p.ownerId === activePlayerId)
                    .map((p) => {
                      const sensorLvl = p.buildings.sensor_array || 0;
                      const researchLvl = player?.research.sensors || 0;
                      const rating = (sensorLvl * 15) + (researchLvl * 10);

                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-sm stellaris-item-card border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-1">
                              Sensör Dizilimi: <strong className="text-cyan-300">Seviye {sensorLvl}</strong> • Ar-Ge: <strong className="text-cyan-300">L{researchLvl}</strong>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {rating} Savunma Puanı
                            </span>
                            <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                              {rating >= 40 ? '🛡️ Güçlü Güvenlik' : '⚠️ Zayıf İstihbarat'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Detected Foreign Infiltrations */}
              <div className="p-3.5 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
                <div className="text-xs font-bold font-display text-slate-200 tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    YABANCI CASUSLUK VE SIZMA GİRİŞİMİ KAYITLARI
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Kayıt: {securityAlerts.length}
                  </span>
                </div>

                {securityAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-slate-500">
                    Sistem yörüngelerinizde yabancı bir casusluk veya sabotaj faaliyeti tespit edilmedi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {securityAlerts.map((al) => (
                      <div
                        key={al.id}
                        className="p-3 rounded-sm border border-rose-500/40 bg-rose-950/20 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <div className="font-bold text-rose-300">{al.detailsTr}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Hedef Koloni: {al.targetPlanetName} • Tehdit: {al.opType}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatSimClock(al.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1b3a4b] bg-[#091522] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Kısayol: <strong className="text-purple-300">F7</strong> ile açıp kapatabilirsiniz.</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
