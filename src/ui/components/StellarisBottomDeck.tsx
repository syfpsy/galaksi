import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Crosshair,
  Crown,
  Eye,
  Globe,
  Maximize2,
  Navigation,
  Pickaxe,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Timer,
  Wrench,
  Zap,
} from 'lucide-react';
import { BUILDING_STATS, SHIP_STATS, GAME_CONSTANTS } from '../../engine/constants';
import { BuildingType, GameState, MissionType, ShipType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface StellarisBottomDeckProps {
  state: GameState;
  activePlayerId: string;
  currentTimeMs: number;
  viewMode: 'galaxy' | 'system';
  activeSystemName: string;
  showProjections: boolean;
  zoom: number;
  onToggleViewMode: () => void;
  onCycleSystem: (dir: 'next' | 'prev') => void;
  onToggleProjections: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectFleet?: (fleetId: string) => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onSelectSystem?: (systemId: string) => void;
  onRecallFleet?: (fleetId: string) => void;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onOpenTransitRadar?: () => void;
}

export const StellarisBottomDeck: React.FC<StellarisBottomDeckProps> = ({
  state,
  activePlayerId,
  currentTimeMs,
  viewMode,
  activeSystemName,
  showProjections,
  zoom,
  onToggleViewMode,
  onCycleSystem,
  onToggleProjections,
  onZoomIn,
  onZoomOut,
  onSelectFleet,
  onSelectPlanet,
  onSelectSystem,
  onRecallFleet,
  onOpenShipyard,
  onOpenResearch,
  onOpenTransitRadar,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'fleets' | 'shipyard' | 'buildings' | 'research'>('all');

  const myPlanets = useMemo(
    () => Object.values(state.planets).filter((p) => p.ownerId === activePlayerId),
    [state.planets, activePlayerId]
  );

  const activePlayer = state.players[activePlayerId];

  // 1. Building Upgrades across player colonies
  const activeBuildings = useMemo(() => {
    return myPlanets
      .filter((p) => p.buildingQueue)
      .map((p) => {
        const q = p.buildingQueue!;
        const totalDuration = Math.max(1, q.finishTime - q.startTime);
        const elapsed = Math.max(0, currentTimeMs - q.startTime);
        const progress = Math.min(1, elapsed / totalDuration);
        const remainingMs = Math.max(0, q.finishTime - currentTimeMs);
        return {
          planetId: p.id,
          systemId: p.systemId,
          planetName: p.name,
          type: q.type,
          nameTr: BUILDING_STATS[q.type].nameTr,
          targetLevel: q.targetLevel,
          progress,
          remainingMs,
        };
      })
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [myPlanets, currentTimeMs]);

  // 2. Shipyard Queues across player colonies
  const activeShipyardQueues = useMemo(() => {
    const list: Array<{
      planetId: string;
      systemId: string;
      planetName: string;
      shipType: ShipType;
      nameTr: string;
      count: number;
      completed: number;
      remainingMs: number;
      unitProgress: number;
    }> = [];

    myPlanets.forEach((p) => {
      p.shipyardQueue.forEach((q) => {
        const unitDuration = Math.max(1, q.unitBuildTimeMs);
        const unitElapsed = Math.max(0, unitDuration - (q.nextUnitFinishTime - currentTimeMs));
        const unitProgress = Math.min(1, Math.max(0, unitElapsed / unitDuration));
        const remainingThisUnit = Math.max(0, q.nextUnitFinishTime - currentTimeMs);
        const remainingTotal = remainingThisUnit + Math.max(0, q.count - q.completed - 1) * unitDuration;

        list.push({
          planetId: p.id,
          systemId: p.systemId,
          planetName: p.name,
          shipType: q.shipType,
          nameTr: SHIP_STATS[q.shipType].nameTr,
          count: q.count,
          completed: q.completed,
          remainingMs: remainingTotal,
          unitProgress,
        });
      });
    });

    return list.sort((a, b) => a.remainingMs - b.remainingMs);
  }, [myPlanets, currentTimeMs]);

  // 3. Active Player Fleets in Transit / Missions
  const activeFleetMissions = useMemo(() => {
    return Object.values(state.fleets)
      .filter(
        (f) =>
          f.ownerId === activePlayerId &&
          (f.status === 'in_transit' || f.status === 'intercepting' || f.status === 'returning')
      )
      .map((f) => {
        const totalDuration = Math.max(1, f.arrivalTime - f.departureTime);
        const elapsed = Math.max(0, currentTimeMs - f.departureTime);
        const progress = Math.min(1, elapsed / totalDuration);
        const remainingMs = Math.max(0, f.arrivalTime - currentTimeMs);
        const originSys = state.map.systems[f.originSystemId];
        const targetSys = state.map.systems[f.targetSystemId];
        const totalShips = Object.values(f.ships).reduce((a, b) => a + (b || 0), 0);
        const isRecallLocked =
          f.status === 'in_transit' &&
          elapsed > totalDuration * GAME_CONSTANTS.RECALL_LOCK_RATIO;
        const canRecall = (f.status === 'in_transit' || f.status === 'intercepting') && !isRecallLocked;

        return {
          fleet: f,
          originName: originSys?.name || 'Sistem',
          targetName: targetSys?.name || 'Sistem',
          totalShips,
          progress,
          remainingMs,
          canRecall,
          isRecallLocked,
        };
      })
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [state.fleets, state.map.systems, activePlayerId, currentTimeMs]);

  // 4. Research Queue
  const activeResearch = useMemo(() => {
    if (!activePlayer?.researchQueue) return null;
    const q = activePlayer.researchQueue;
    const totalDuration = Math.max(1, q.finishTime - q.startTime);
    const elapsed = Math.max(0, currentTimeMs - q.startTime);
    const progress = Math.min(1, elapsed / totalDuration);
    const remainingMs = Math.max(0, q.finishTime - currentTimeMs);

    const names: Record<string, string> = {
      engines: 'İyon İtki Motorları',
      weapons: 'Plazma & Lazer Silahları',
      sensors: 'Tanyon Sensör Dizinleri',
    };

    return {
      type: q.type,
      nameTr: names[q.type] || q.type,
      targetLevel: q.targetLevel,
      progress,
      remainingMs,
    };
  }, [activePlayer?.researchQueue, currentTimeMs]);

  const totalActiveOperations =
    activeBuildings.length +
    activeShipyardQueues.length +
    activeFleetMissions.length +
    (activeResearch ? 1 : 0);

  const missionBadges: Record<string, { label: string; color: string }> = {
    attack: { label: '⚔️ Taarruz', color: 'text-rose-400 bg-rose-950/40 border-rose-500/40' },
    explore: { label: '📡 Keşif', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40' },
    transport: { label: '📦 İkmal', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' },
    colonize: { label: '🏛️ Koloni', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' },
    intercept: { label: '🎯 Önleme', color: 'text-purple-400 bg-purple-950/40 border-purple-500/40' },
    support: { label: '🛡️ Destek', color: 'text-blue-400 bg-blue-950/40 border-blue-500/40' },
  };

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-25 flex flex-col items-center select-none pointer-events-auto transition-all duration-300">
      {/* EXPANDED FULL OPERATIONS DASHBOARD */}
      {isExpanded && (
        <div className="w-[94vw] max-w-5xl h-64 bg-[#070e1c]/98 border border-[#1b3454] rounded-t-sm stellaris-outliner shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden mb-1 animate-fade-in">
          {/* Dashboard Header Bar */}
          <div className="px-4 py-2 stellaris-outliner-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold stellaris-gold font-display uppercase tracking-widest">
                  Galaktik Üretim & Operasyon Konsolu
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  {totalActiveOperations} Aktif
                </span>
              </div>

              {/* Activity Category Tabs */}
              <div className="flex items-center gap-1 ml-4 stellaris-resource-pod p-0.5 rounded-sm text-[11px] font-mono">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('all');
                  }}
                  className={`px-2.5 py-0.5 rounded-sm transition-all ${
                    activeTab === 'all'
                      ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tümü ({totalActiveOperations})
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('fleets');
                  }}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeTab === 'fleets'
                      ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🛸 Seferler ({activeFleetMissions.length})
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('shipyard');
                  }}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeTab === 'shipyard'
                      ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚀 Tersane ({activeShipyardQueues.length})
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('buildings');
                  }}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeTab === 'buildings'
                      ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏗️ İnşaat ({activeBuildings.length})
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('research');
                  }}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeTab === 'research'
                      ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔬 Ar-Ge ({activeResearch ? 1 : 0})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenTransitRadar && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenTransitRadar();
                  }}
                  className="stellaris-btn-metallic !border-cyan-500/50 text-cyan-300 text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                  title="Detaylı Taktik İntikal Radarını Aç"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Taktik Radar</span>
                </button>
              )}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsExpanded(false);
                }}
                className="stellaris-btn-metallic px-2.5 py-1 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                title="Alt Paneli Daralt"
              >
                <span>Daralt</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dashboard Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
            {totalActiveOperations === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 py-8">
                <Timer className="w-8 h-8 text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">
                  Şu anda devam eden üretim, inşaat veya filo seferi bulunmuyor.
                </p>
                <span className="text-[11px] text-slate-500">
                  Kolonilerinizden bina yükseltebilir veya tersaneden yeni savaş filoları inşa edebilirsiniz.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* 1. Fleet Missions */}
                {(activeTab === 'all' || activeTab === 'fleets') &&
                  activeFleetMissions.map(({ fleet, originName, targetName, totalShips, progress, remainingMs, canRecall, isRecallLocked }) => {
                    const badge = missionBadges[fleet.mission] || { label: fleet.mission, color: 'text-slate-300' };

                    return (
                      <div
                        key={fleet.id}
                        onClick={() => onSelectFleet && onSelectFleet(fleet.id)}
                        className="stellaris-item-card p-2.5 rounded-sm hover:border-cyan-500/60 cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                              🛸 {fleet.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                            <span>{originName} ➔ <strong className="text-white">{targetName}</strong></span>
                            <span className="text-cyan-400 font-bold">{totalShips} Gemi</span>
                          </div>

                          {/* Progress Bar with 50% Recall Lock indicator */}
                          <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-[#1b3454]">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                            {/* 50% Threshold Mark */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/70" title="%50 Geri Dönüş Kilidi Eşiği" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1c3647] text-[10.5px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {formatDuration(remainingMs)}
                          </span>

                          {canRecall && onRecallFleet ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                onRecallFleet(fleet.id);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-[10px] transition-all cursor-pointer"
                              title="İlk %50 rota dolmadan filoyu üsse geri çağır"
                            >
                              Geri Çağır
                            </button>
                          ) : isRecallLocked ? (
                            <span className="text-rose-400 text-[10px]">Geri Dönüş Kilitli</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                {/* 2. Shipyard Queues */}
                {(activeTab === 'all' || activeTab === 'shipyard') &&
                  activeShipyardQueues.map((item, idx) => (
                    <div
                      key={`sy_${idx}`}
                      onClick={() => onSelectPlanet && onSelectPlanet(item.systemId, item.planetId)}
                      className="stellaris-item-card p-2.5 rounded-sm hover:border-amber-500/60 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                            🚀 {item.nameTr}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            {item.completed + 1} / {item.count} İmalat
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mb-1.5">
                          Tersane: <strong className="text-slate-200">{item.planetName}</strong>
                        </div>

                        {/* Unit Progress Bar */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-[#1b3454]">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${Math.round(item.unitProgress * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1c3647] text-[10.5px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Toplam Kalan: {formatDuration(item.remainingMs)}
                        </span>
                        <span className="text-amber-400 font-bold">%{Math.round(item.unitProgress * 100)}</span>
                      </div>
                    </div>
                  ))}

                {/* 3. Building Upgrades */}
                {(activeTab === 'all' || activeTab === 'buildings') &&
                  activeBuildings.map((item, idx) => (
                    <div
                      key={`bld_${idx}`}
                      onClick={() => onSelectPlanet && onSelectPlanet(item.systemId, item.planetId)}
                      className="stellaris-item-card p-2.5 rounded-sm hover:border-emerald-500/60 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                            🏗️ {item.nameTr}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            Seviye {item.targetLevel}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mb-1.5">
                          Dünya: <strong className="text-slate-200">{item.planetName}</strong>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-[#1b3454]">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1c3647] text-[10.5px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {formatDuration(item.remainingMs)}
                        </span>
                        <span className="text-emerald-400 font-bold">%{Math.round(item.progress * 100)}</span>
                      </div>
                    </div>
                  ))}

                {/* 4. Research */}
                {(activeTab === 'all' || activeTab === 'research') && activeResearch && (
                  <div className="stellaris-item-card p-2.5 rounded-sm hover:border-cyan-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          🔬 {activeResearch.nameTr}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          Seviye {activeResearch.targetLevel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mb-1.5">
                        İmparatorluk Teknoloji Laboratuvarı
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-[#1b3454]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.round(activeResearch.progress * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1c3647] text-[10.5px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {formatDuration(activeResearch.remainingMs)}
                      </span>
                      <span className="text-cyan-400 font-bold">%{Math.round(activeResearch.progress * 100)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPACT BOTTOM TRAY (Always Visible Deck) */}
      <div className="stellaris-deck-container rounded-sm p-1.5 flex items-center gap-2 text-xs font-mono">
        {/* Left Side: Live Empire Activity Chips (Clickable to Expand!) */}
        <div
          onClick={() => {
            sound.playClick();
            setIsExpanded(!isExpanded);
          }}
          className="stellaris-resource-pod flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm cursor-pointer transition-all group"
          title="Tüm Aktif İnşaat, Tersane ve Filo Seferlerini Gör (Genişlet)"
        >
          {totalActiveOperations > 0 ? (
            <div className="flex items-center gap-2 text-[11px]">
              {activeFleetMissions.length > 0 && (
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <span>🛸</span>
                  <span>{activeFleetMissions.length} Sefer</span>
                </span>
              )}
              {activeShipyardQueues.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span>🚀</span>
                  <span>{activeShipyardQueues.reduce((a, b) => a + (b.count - b.completed), 0)} Gemi</span>
                </span>
              )}
              {activeBuildings.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span>🏗️</span>
                  <span>{activeBuildings.length} İnşaat</span>
                </span>
              )}
              {activeResearch && (
                <span className="flex items-center gap-1 text-blue-400 font-bold">
                  <span>🔬</span>
                  <span>Ar-Ge</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-[10.5px]">Üretim Hatları Boşta</span>
          )}

          <div className="flex items-center gap-0.5 text-cyan-400 ml-1">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="h-6 w-px bg-[#18374b]" />

        {/* Center: Stellaris View Controls */}
        {viewMode === 'system' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onCycleSystem('prev')}
              className="stellaris-btn-metallic p-2 rounded-sm text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              title="Önceki Yıldız Sistemi"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleViewMode();
              }}
              className="stellaris-switcher-btn px-4 py-2 rounded-sm text-cyan-300 font-bold flex items-center gap-2 transition-all cursor-pointer group"
              title="Galaksi Haritasına Geç (M)"
            >
              <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span className="tracking-wider">🌌 GALAKSİ HARİTASI [M]</span>
            </button>

            <button
              onClick={() => onCycleSystem('next')}
              className="stellaris-btn-metallic p-2 rounded-sm text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              title="Sonraki Yıldız Sistemi"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playClick();
              onToggleViewMode();
            }}
            className="stellaris-switcher-btn px-4 py-2 rounded-sm text-[#e5c578] font-bold flex items-center gap-2 transition-all cursor-pointer group"
            title="Sistem Yörünge Haritasına Gir (M / Çift Tık)"
          >
            <Globe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wider">🪐 {activeSystemName.toUpperCase()} SİSTEMİ [M]</span>
          </button>
        )}

        {/* Projections Toggle (if system view) */}
        {viewMode === 'system' && (
          <button
            onClick={() => {
              sound.playClick();
              onToggleProjections();
            }}
            className={`stellaris-btn-metallic px-2.5 py-1.5 rounded-sm transition-all text-[11px] cursor-pointer ${
              showProjections
                ? '!border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Gelecek Yörünge Projeksiyonlarını Göster/Gizle"
          >
            🔭 Projeksiyon
          </button>
        )}

        {/* Zoom Controls */}
        <div className="stellaris-resource-pod flex items-center gap-0.5 rounded-sm p-0.5 text-[11px]">
          <button
            onClick={() => {
              sound.playClick();
              onZoomOut();
            }}
            className="w-6 h-6 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a384f] cursor-pointer"
            title="Uzaklaş"
          >
            -
          </button>
          <span className="px-1.5 text-[10px] text-[#e5c578] font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onZoomIn();
            }}
            className="w-6 h-6 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a384f] cursor-pointer"
            title="Yakınlaş"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
