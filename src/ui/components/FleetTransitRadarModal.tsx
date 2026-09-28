import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Eye,
  Filter,
  Flame,
  Globe,
  Navigation,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Timer,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { Fleet, GameState, MissionType, ShipType } from '../../engine/types';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { getFleetCurrentPosition } from '../../engine/flight';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface FleetTransitRadarModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onFocusFleet: (fleetId: string) => void;
  onFocusSystem: (systemId: string) => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onRecallFleet?: (fleetId: string) => void;
  onOpenCommandPanel?: () => void;
}

export const FleetTransitRadarModal: React.FC<FleetTransitRadarModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  isDocked = true,
  onClose,
  onFocusFleet,
  onFocusSystem,
  onSelectPlanet,
  onRecallFleet,
  onOpenCommandPanel,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'friendly' | 'hostile'>('all');
  const [sortBy, setSortBy] = useState<'eta' | 'size' | 'threat'>('eta');

  // Sensor coverage for intel check
  const sensorCoverage = useMemo(() => {
    return getPlayerSensorCoverage(state, activePlayerId);
  }, [state, activePlayerId]);

  const myColonySystemIds = useMemo(() => {
    return new Set(
      Object.values(state.planets)
        .filter((p) => p.ownerId === activePlayerId)
        .map((p) => p.systemId)
    );
  }, [state.planets, activePlayerId]);

  // Extract all moving fleets
  const movingFleets = useMemo(() => {
    return Object.values(state.fleets)
      .filter(
        (f) =>
          f.status === 'in_transit' ||
          f.status === 'returning' ||
          f.status === 'intercepting'
      )
      .map((f) => {
        const isOwn = f.ownerId === activePlayerId;
        const owner = state.players[f.ownerId];
        const originSys = state.map.systems[f.originSystemId];
        const targetSys = state.map.systems[f.targetSystemId];
        const targetPlanet = f.targetPlanetId ? state.planets[f.targetPlanetId] : null;

        // Threat check: incoming hostile fleet targeting player's colony or system
        const isTargetingMe =
          !isOwn &&
          (myColonySystemIds.has(f.targetSystemId) ||
            (targetPlanet && targetPlanet.ownerId === activePlayerId));

        const isThreat = isTargetingMe && f.mission === 'attack';

        // Visibility check (visible if own, targeting me, or within sensor coverage)
        const isVisible =
          isOwn ||
          isThreat ||
          sensorCoverage.has(f.originSystemId) ||
          sensorCoverage.has(f.targetSystemId);

        const remainingMs = Math.max(0, f.arrivalTime - state.timeMs);
        const totalDurationMs = Math.max(1, f.arrivalTime - f.departureTime);
        const elapsedMs = Math.max(0, state.timeMs - f.departureTime);
        const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

        const isRecallLocked = state.timeMs >= f.recallLockedAfterTime;
        const remainingRecallWindowMs = Math.max(0, f.recallLockedAfterTime - state.timeMs);

        const totalShips = Object.values(f.ships).reduce((a, b) => a + (b || 0), 0);
        const totalCargo =
          (f.cargo?.ore || 0) + (f.cargo?.crystal || 0) + (f.cargo?.fuel || 0);

        return {
          fleet: f,
          isOwn,
          owner,
          originSys,
          targetSys,
          targetPlanet,
          isThreat,
          isVisible,
          remainingMs,
          progressPct,
          isRecallLocked,
          remainingRecallWindowMs,
          totalShips,
          totalCargo,
        };
      })
      .filter((item) => item.isVisible);
  }, [
    state.fleets,
    state.timeMs,
    state.planets,
    state.players,
    state.map.systems,
    activePlayerId,
    myColonySystemIds,
    sensorCoverage,
  ]);

  // Counts for tabs
  const friendlyCount = movingFleets.filter((item) => item.isOwn).length;
  const hostileCount = movingFleets.filter((item) => !item.isOwn).length;
  const threatCount = movingFleets.filter((item) => item.isThreat).length;

  // Filtered & Sorted List
  const displayedFleets = useMemo(() => {
    let list = movingFleets;
    if (filterMode === 'friendly') {
      list = list.filter((item) => item.isOwn);
    } else if (filterMode === 'hostile') {
      list = list.filter((item) => !item.isOwn);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'threat') {
        if (a.isThreat && !b.isThreat) return -1;
        if (!a.isThreat && b.isThreat) return 1;
      }
      if (sortBy === 'size') {
        return b.totalShips - a.totalShips;
      }
      return a.remainingMs - b.remainingMs;
    });
  }, [movingFleets, filterMode, sortBy]);

  if (!isOpen) return null;

  const getMissionBadge = (mission: MissionType, isReturning?: boolean) => {
    if (isReturning) {
      return {
        label: 'Geri Çekilme',
        icon: <RotateCcw className="w-3 h-3 text-purple-400" />,
        color: 'text-purple-300 bg-purple-950/70 border-purple-500/40',
      };
    }
    switch (mission) {
      case 'attack':
        return {
          label: 'Taarruz & Baskın',
          icon: <Swords className="w-3 h-3 text-rose-400" />,
          color: 'text-rose-300 bg-rose-950/70 border-rose-500/50',
        };
      case 'colonize':
        return {
          label: 'Kolonizasyon',
          icon: <Globe className="w-3 h-3 text-emerald-400" />,
          color: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/50',
        };
      case 'transport':
        return {
          label: 'İkmal & Nakliye',
          icon: <Truck className="w-3 h-3 text-amber-400" />,
          color: 'text-amber-300 bg-amber-950/70 border-amber-500/50',
        };
      case 'explore':
        return {
          label: 'Derin Uzay Keşfi',
          icon: <Radio className="w-3 h-3 text-cyan-400" />,
          color: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/50',
        };
      default:
        return {
          label: 'İntikal',
          icon: <Navigation className="w-3 h-3 text-blue-400" />,
          color: 'text-blue-300 bg-blue-950/70 border-blue-500/40',
        };
    }
  };

  return (
    <aside
      className={`w-[470px] min-w-[470px] max-w-[470px] shrink-0 h-full border-r border-[#1b314d] bg-[#070d1a]/98 backdrop-blur-xl flex flex-col z-30 select-none overflow-hidden shadow-2xl animate-fade-in ${
        isDocked ? '' : 'fixed left-14 top-0 bottom-0'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#091222]/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/50">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 font-display uppercase tracking-wider">
                Taktik İntikal Radarı
              </h2>
              {threatCount > 0 && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                  {threatCount} TEHDİT
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Hiper-hat intikalleri, filo rotaları ve radar izleme telemetrisi
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Radarı Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-[#060a14] flex items-center justify-between gap-2 text-xs font-mono">
        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.playClick();
              setFilterMode('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Tümü ({movingFleets.length})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setFilterMode('friendly');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              filterMode === 'friendly'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Bizim ({friendlyCount})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setFilterMode('hostile');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              filterMode === 'hostile'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Düşman ({hostileCount})</span>
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span>Sırala:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0c1524] border border-slate-700/80 rounded px-1.5 py-0.5 text-cyan-300 focus:outline-none cursor-pointer"
          >
            <option value="eta">Varış (ETA)</option>
            <option value="threat">Tehdit Seviyesi</option>
            <option value="size">Gemi Sayısı</option>
          </select>
        </div>
      </div>

      {/* Fleets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
        {displayedFleets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-space-900/30">
            <Radio className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 font-mono">
              İntikal Halinde Filo Bulunmuyor
            </span>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              {filterMode === 'hostile'
                ? 'Sensör menzilinizde hareket eden düşman veya korsan filosu tespit edilmedi.'
                : filterMode === 'friendly'
                ? 'Şu anda yolda olan bir dost filonuz yok. Tüm filolarınız yörüngelerde konuşlu.'
                : 'Şu anda sistemler arasında hareket eden aktif bir filo yok.'}
            </p>
            {onOpenCommandPanel && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenCommandPanel();
                }}
                className="mt-4 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/50"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Yeni Filo Seferi Düzenle</span>
              </button>
            )}
          </div>
        ) : (
          displayedFleets.map((item) => {
            const {
              fleet,
              isOwn,
              owner,
              originSys,
              targetSys,
              targetPlanet,
              isThreat,
              remainingMs,
              progressPct,
              isRecallLocked,
              remainingRecallWindowMs,
              totalShips,
              totalCargo,
            } = item;

            const missionInfo = getMissionBadge(fleet.mission, fleet.status === 'returning');

            return (
              <div
                key={fleet.id}
                className={`p-3 rounded-xl border transition-all relative overflow-hidden group ${
                  isThreat
                    ? 'bg-rose-950/30 border-rose-500/70 shadow-lg shadow-rose-950/40'
                    : isOwn
                    ? 'bg-[#0a1324]/80 border-slate-800 hover:border-cyan-500/50'
                    : 'bg-[#0e1629]/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Threat Top Banner */}
                {isThreat && (
                  <div className="mb-2 px-2 py-1 rounded bg-rose-600/20 border border-rose-500/50 flex items-center justify-between text-[10px] font-mono text-rose-300">
                    <div className="flex items-center gap-1 font-bold animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>🚨 TEHDİT: {targetPlanet?.name || targetSys?.name} ÜZERİNE BASKIN!</span>
                    </div>
                    <span>{formatDuration(remainingMs)} kaldı</span>
                  </div>
                )}

                {/* Fleet Header: Owner & Name & Mission Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: owner?.color || '#38bdf8' }}
                    />
                    <span className="font-bold text-slate-100 text-xs font-display">
                      {fleet.name || (isOwn ? 'Filo' : 'Düşman Taarruz Timi')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({owner?.name || 'Bilinmiyor'})
                    </span>
                  </div>

                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 font-semibold ${missionInfo.color}`}
                  >
                    {missionInfo.icon}
                    <span>{missionInfo.label}</span>
                  </span>
                </div>

                {/* Route Visualizer Schematic */}
                <div className="my-2.5 p-2 rounded-lg bg-black/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <div className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[170px]">
                      <span className="text-slate-500 text-[10px]">Kalkış:</span>
                      <span className="text-cyan-300">{originSys?.name || 'Bilinmeyen'}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                    <div className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[170px] justify-end">
                      <span className="text-slate-500 text-[10px]">Hedef:</span>
                      <span className={isThreat ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
                        {targetPlanet?.name || targetSys?.name || 'Bilinmeyen'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isThreat
                          ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                          : isOwn
                          ? 'bg-gradient-to-r from-cyan-600 to-emerald-400'
                          : 'bg-gradient-to-r from-purple-600 to-rose-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 mt-1">
                    <span>İlerleme: %{progressPct}</span>
                    <span className="text-slate-300 font-bold">
                      Kalan Süre: {formatDuration(remainingMs)}
                    </span>
                  </div>
                </div>

                {/* Ship Composition Badges */}
                <div className="flex flex-wrap items-center gap-1.5 my-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>{totalShips} Gemi</span>
                  </span>

                  {fleet.ships.battleship > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
                      🛡️ {fleet.ships.battleship} Kruvazör
                    </span>
                  )}
                  {fleet.ships.fighter > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300">
                      ⚔️ {fleet.ships.fighter} Avcı
                    </span>
                  )}
                  {fleet.ships.transport > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                      📦 {fleet.ships.transport} Nakliye
                    </span>
                  )}
                  {fleet.ships.scout > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
                      🔭 {fleet.ships.scout} İzci
                    </span>
                  )}

                  {totalCargo > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                      💎 {Math.round(totalCargo)} Kargo
                    </span>
                  )}
                </div>

                {/* Recall Status Bar (For Own Fleets) */}
                {isOwn && fleet.status !== 'returning' && (
                  <div className="mt-1 text-[9px] font-mono flex items-center justify-between border-t border-slate-800/60 pt-1.5 text-slate-400">
                    <span>Geri Dönüş Emniyet Penceresi:</span>
                    {!isRecallLocked ? (
                      <span className="text-emerald-400 font-bold">
                        Açık ({formatDuration(remainingRecallWindowMs)} kaldı)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        ⚠️ %50 Kilidi Devrede (Geri çağrılamaz)
                      </span>
                    )}
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFocusFleet(fleet.id);
                    }}
                    className="flex-1 py-1.5 px-2 bg-space-850 hover:bg-space-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-mono font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    title="Bu filoyu haritada seç ve kamerayı odakla"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Haritada Odaklan</span>
                  </button>

                  {/* Recall Button for Friendly Fleets */}
                  {isOwn && fleet.status !== 'returning' && onRecallFleet && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onRecallFleet(fleet.id);
                      }}
                      disabled={isRecallLocked}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        !isRecallLocked
                          ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 shadow-sm shadow-rose-950/50'
                          : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                      title={
                        !isRecallLocked
                          ? 'Filoyu derhal üssüne geri çağır'
                          : '%50 uçuş mesafesi aşıldı, geri çağrılamaz'
                      }
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Geri Çağır</span>
                    </button>
                  )}

                  {/* Threat Contextual Action */}
                  {isThreat && targetPlanet && onSelectPlanet && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectPlanet(fleet.targetSystemId, targetPlanet.id);
                      }}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-rose-950"
                      title="Saldırı altındaki gezegene git ve garnizonu hazırla"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Savunmayı Aç</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="p-2.5 border-t border-slate-800 bg-[#060a14] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Sensör Dizini: Aktif</span>
        </div>
        <span>{movingFleets.length} Toplam İntikal</span>
      </div>
    </aside>
  );
};
