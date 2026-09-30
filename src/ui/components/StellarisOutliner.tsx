import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Flame,
  Globe,
  Navigation,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { Fleet, GameState, Planet, ShipType } from '../../engine/types';
import { BUILDING_STATS, SHIP_STATS } from '../../engine/constants';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';
import { getPlanetAsset } from '../planetAssets';

interface StellarisOutlinerProps {
  state: GameState;
  activePlayerId: string;
  activePlanetId: string;
  selectedTarget: SelectedTarget | null;
  onSelectPlanet: (planetId: string) => void;
  onSelectFleet: (fleetId: string) => void;
  onSelectSystem: (systemId: string) => void;
  currentTimeMs: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onContextMenuTarget?: (target: { type: 'system' | 'planet' | 'fleet'; systemId: string; planetId?: string; fleetId?: string }) => void;
}

const StellarisOutlinerComponent: React.FC<StellarisOutlinerProps> = ({
  state,
  activePlayerId,
  activePlanetId,
  selectedTarget,
  onSelectPlanet,
  onSelectFleet,
  onSelectSystem,
  currentTimeMs,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  onContextMenuTarget,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const [sectionsOpen, setSectionsOpen] = useState({
    threats: true,
    planets: true,
    military: true,
    civilian: true,
    relay: true,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    sound.playClick();
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter player colonies
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);

  // Filter player fleets
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId);
  const militaryFleets = myFleets.filter((f) => (f.ships.fighter || 0) > 0 || (f.ships.battleship || 0) > 0);
  const civilianFleets = myFleets.filter(
    (f) => ((f.ships.scout || 0) > 0 || (f.ships.transport || 0) > 0) &&
           (f.ships.fighter || 0) === 0 && (f.ships.battleship || 0) === 0
  );

  const totalFleetShips = myFleets.reduce(
    (acc, f) => acc + Object.values(f.ships).reduce((a, b) => a + (b || 0), 0),
    0
  );
  const totalGarrisonShips = myPlanets.reduce(
    (acc, p) => acc + Object.values(p.garrison).reduce((a, b) => a + (b || 0), 0),
    0
  );
  const totalEmpireShips = totalFleetShips + totalGarrisonShips;

  // Filter incoming hostile threats targeting player's systems
  const mySystemIds = new Set(myPlanets.map((p) => p.systemId));
  const hostileThreats = Object.values(state.fleets).filter(
    (f) =>
      f.ownerId !== activePlayerId &&
      (f.status === 'in_transit' || f.status === 'intercepting') &&
      mySystemIds.has(f.targetSystemId)
  );

  // Relay data
  const relay = state.relay;
  const relaySys = state.map.systems[relay.systemId];
  const relayController = relay.controllingPlayerId ? state.players[relay.controllingPlayerId] : null;

  if (isCollapsed) {
    return (
      <div className="absolute right-0 top-16 bottom-0 z-20 flex items-start pointer-events-none">
        <button
          onClick={() => {
            sound.playClick();
            handleToggleCollapse();
          }}
          className="pointer-events-auto mt-4 bg-[#0a1120]/95 hover:bg-[#121e36] text-cyan-400 border-l border-y border-cyan-500/40 px-2 py-3 rounded-l-sm shadow-xl backdrop-blur-md flex flex-col items-center gap-2 group transition-all cursor-pointer"
          title="Çizelgeyi Aç (Outliner)"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-mono tracking-widest uppercase font-bold text-slate-300">
            Çizelge
          </span>
          {hostileThreats.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 h-full stellaris-outliner flex flex-col z-20 select-none overflow-hidden relative">
      {/* Outliner Header */}
      <div className="h-9 px-3 stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span className="text-[11px] font-display font-bold uppercase tracking-widest text-[#e6f4f8]">
            OUTLINER
          </span>
          <span className="stellaris-badge text-[#e5c578] border-[#1b3b50]">
            {myPlanets.length} Gezegen • {totalEmpireShips} Gemi
          </span>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            handleToggleCollapse();
          }}
          className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
          title="Çizelgeyi Gizle"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outliner Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-1.5 pb-6 space-y-1.5 text-xs font-mono scrollbar-none">
        {/* 1. Hostile Threats Alert (if any) */}
        {hostileThreats.length > 0 && (
          <div className="border border-rose-500/60 bg-rose-950/30 rounded-sm overflow-hidden shadow-lg shadow-rose-950/40">
            <button
              onClick={() => toggleSection('threats')}
              className="w-full px-2.5 py-1.5 bg-rose-950/60 flex items-center justify-between text-[10px] uppercase font-bold text-rose-300 tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>DÜŞMAN BASKINLARI ({hostileThreats.length})</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  sectionsOpen.threats ? '' : '-rotate-90'
                }`}
              />
            </button>

            {sectionsOpen.threats && (
              <div className="p-1 space-y-1">
                {hostileThreats.map((threat) => {
                  const targetSys = state.map.systems[threat.targetSystemId];
                  const remainingMs = Math.max(0, threat.arrivalTime - currentTimeMs);
                  const sender = state.players[threat.ownerId];

                  return (
                    <div
                      key={threat.id}
                      onClick={() => {
                        sound.playAlert();
                        onSelectFleet(threat.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sound.playClick();
                        if (onContextMenuTarget) {
                          onContextMenuTarget({
                            type: 'fleet',
                            systemId: threat.targetSystemId,
                            fleetId: threat.id,
                          });
                        }
                      }}
                      className="p-1.5 rounded-sm bg-rose-950/50 border border-rose-500/40 hover:border-rose-400 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-200">
                        <span>{sender?.name || 'Bilinmeyen Filo'}</span>
                        <span className="text-rose-400 text-[10px] animate-pulse">
                          {formatDuration(remainingMs)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-between">
                        <span>➔ {targetSys?.name}</span>
                        <span className="text-amber-400 font-bold">
                          {(threat.ships.fighter || 0) + (threat.ships.battleship || 0)} Muharip
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Colonies & Planets */}
        <div className="border border-[#18374a] bg-[#070e17]/80 rounded-sm overflow-hidden">
          <button
            onClick={() => toggleSection('planets')}
            className="stellaris-section-header w-full px-2.5 py-1 flex items-center justify-between text-[10px] uppercase font-bold text-slate-300 tracking-wider hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>GEZEGENLER VE SEKTÖRLER ({myPlanets.length})</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                sectionsOpen.planets ? '' : '-rotate-90'
              }`}
            />
          </button>

          {sectionsOpen.planets && (
            <div className="p-1 space-y-1">
              {myPlanets.map((planet) => {
                const isActive = planet.id === activePlanetId;
                const isSelected =
                  selectedTarget?.type === 'planet' && selectedTarget.planetId === planet.id;
                const totalGarrison = Object.values(planet.garrison).reduce((a, b) => a + (b || 0), 0);
                const isBuilding = !!planet.buildingQueue;

                const pSys = state.map.systems[planet.systemId];
                const pSlot = pSys?.slots.find((s) => s.planetId === planet.id || s.slotIndex === planet.slotIndex);
                const pAsset = getPlanetAsset(pSlot?.type);

                return (
                  <div
                    key={planet.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectPlanet(planet.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      sound.playClick();
                      if (onContextMenuTarget) {
                        onContextMenuTarget({
                          type: 'planet',
                          systemId: planet.systemId,
                          planetId: planet.id,
                        });
                      }
                    }}
                    className={`p-2 rounded-sm cursor-pointer stellaris-item-card transition-all group ${
                      isActive || isSelected
                        ? '!border-cyan-500/80 !bg-cyan-950/40 shadow-sm shadow-cyan-950/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0 w-4 h-4">
                          <img
                            src={pAsset.spaceImage}
                            alt={planet.name}
                            className="w-4 h-4 rounded-full object-cover border border-slate-600"
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-black ${
                              planet.isHomeworld ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                        <span className="font-semibold text-slate-100 text-[11px]">
                          {planet.name}
                        </span>
                        {planet.isHomeworld && (
                          <span className="text-[8px] px-1 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            ANA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            onSelectSystem(planet.systemId);
                          }}
                          className="p-1 rounded-sm text-slate-500 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Sisteme Odaklan"
                        >
                          <Navigation className="w-2.5 h-2.5" />
                        </button>
                        <span title={planet.stance === 'evade_safeguard' ? 'Filoyu Koru: Ağır baskında hafif gemiler kaçınır' : 'Konumu Tut: Garnizon sonuna kadar savunur'}>
                          {planet.stance === 'evade_safeguard' ? (
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-emerald-400" />
                          )}
                        </span>
                        <span className="text-[10px] text-cyan-300 font-bold">
                          {totalGarrison}
                        </span>
                      </div>
                    </div>

                    {/* Active Construction Indicator with Progress Bar */}
                    {isBuilding && planet.buildingQueue && (() => {
                      const bldg = planet.buildingQueue;
                      const bldgDuration = Math.max(1, bldg.finishTime - bldg.startTime);
                      const bldgElapsed = Math.max(0, currentTimeMs - bldg.startTime);
                      const bldgProgress = Math.min(100, Math.max(0, Math.round((bldgElapsed / bldgDuration) * 100)));
                      const remaining = Math.max(0, bldg.finishTime - currentTimeMs);
                      const bldgDef = BUILDING_STATS[bldg.type];

                      return (
                        <div className="mt-1.5 pt-1 border-t border-slate-800/70">
                          <div className="flex items-center justify-between text-[10px] text-cyan-400">
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Wrench className="w-2.5 h-2.5 animate-spin text-cyan-400 shrink-0" />
                              <span className="truncate">{bldgDef?.nameTr || bldg.type} (S{bldg.targetLevel})</span>
                            </span>
                            <span className="font-mono text-[9px] text-cyan-300 shrink-0">
                              {formatDuration(remaining)}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-[#0a141e] rounded-none mt-1 overflow-hidden border border-cyan-900/50">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                              style={{ width: `${bldgProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Shipyard Queue Indicator with Progress Bar */}
                    {planet.shipyardQueue && planet.shipyardQueue.length > 0 && (() => {
                      const queueItem = planet.shipyardQueue[0];
                      const unitDuration = Math.max(1, queueItem.unitBuildTimeMs || 10000);
                      const unitStart = queueItem.nextUnitFinishTime - unitDuration;
                      const unitElapsed = Math.max(0, currentTimeMs - unitStart);
                      const unitProgress = Math.min(100, Math.max(0, Math.round((unitElapsed / unitDuration) * 100)));
                      const remaining = Math.max(0, queueItem.nextUnitFinishTime - currentTimeMs);
                      const shipDef = SHIP_STATS[queueItem.shipType];

                      return (
                        <div className="mt-1.5 pt-1 border-t border-slate-800/70">
                          <div className="flex items-center justify-between text-[10px] text-amber-400">
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Rocket className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate">
                                {queueItem.count}x {shipDef?.nameTr || 'Gemi'}
                                {queueItem.completed > 0 && ` (${queueItem.completed}/${queueItem.count})`}
                              </span>
                            </span>
                            <span className="font-mono text-[9px] text-amber-300 shrink-0">
                              {formatDuration(remaining)}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-[#0a141e] rounded-none mt-1 overflow-hidden border border-amber-900/50">
                            <div
                              className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                              style={{ width: `${unitProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Military Fleets */}
        <div className="border border-[#18374b] bg-[#070e17]/80 rounded-sm overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('military')}
            className="w-full px-2.5 py-1.5 stellaris-section-header flex items-center justify-between text-[10px] uppercase font-bold text-[#e6f4f8] tracking-wider hover:text-rose-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>MUHARİP FİLOLAR ({militaryFleets.length})</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#c5a059] transition-transform ${
                sectionsOpen.military ? '' : '-rotate-90'
              }`}
            />
          </button>

          {sectionsOpen.military && (
            <div className="p-1 space-y-1">
              {militaryFleets.length === 0 ? (
                <div className="p-2 text-center text-slate-500 text-[10px]">
                  Aktif muharip filo yok.
                </div>
              ) : (
                militaryFleets.map((fleet) => {
                  const isSelected =
                    selectedTarget?.type === 'fleet' && selectedTarget.fleetId === fleet.id;
                  const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
                  const targetSys = state.map.systems[fleet.targetSystemId];
                  const remainingMs = Math.max(0, fleet.arrivalTime - currentTimeMs);
                  const isMoving = fleet.status === 'in_transit' || fleet.status === 'intercepting' || fleet.status === 'returning';
                  const totalDuration = Math.max(1, fleet.arrivalTime - fleet.departureTime);
                  const elapsed = Math.max(0, currentTimeMs - fleet.departureTime);
                  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                  const power = Math.round(
                    (fleet.ships.battleship || 0) * 140 +
                    (fleet.ships.fighter || 0) * 35 +
                    (fleet.ships.scout || 0) * 12 +
                    (fleet.ships.transport || 0) * 6
                  );
                  const formattedPower = power >= 1000 ? `${(power / 1000).toFixed(1)}K` : `${power}`;

                  return (
                    <div
                      key={fleet.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectFleet(fleet.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sound.playClick();
                        if (onContextMenuTarget) {
                          onContextMenuTarget({
                            type: 'fleet',
                            systemId: fleet.targetSystemId || fleet.originSystemId,
                            fleetId: fleet.id,
                          });
                        }
                      }}
                      className={`p-2 rounded-sm cursor-pointer stellaris-item-card group ${
                        isSelected
                          ? '!border-rose-500/80 !bg-rose-950/40 shadow-sm shadow-rose-950/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-[11px] truncate flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                          <span className="truncate">{fleet.name || 'Vurucu Filo'}</span>
                          <span className="text-[8.5px] px-1 py-0.5 rounded-sm bg-slate-900 border border-slate-700/60 text-slate-300 font-mono shrink-0">
                            {fleet.status === 'in_transit'
                              ? 'Rotada'
                              : fleet.status === 'returning'
                              ? 'Dönüş'
                              : fleet.status === 'intercepting'
                              ? 'Önleme'
                              : 'Yörünge'}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="stellaris-power text-[10.5px] font-mono">
                            ⚡ {formattedPower}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            ({totalShips}G)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className="truncate flex items-center gap-1 text-slate-300">
                          <span>➔</span>
                          <span>{targetSys?.name || 'Sistem'}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playClick();
                              onSelectSystem(fleet.targetSystemId || fleet.originSystemId);
                            }}
                            className="p-0.5 rounded-sm text-slate-500 hover:text-rose-300 hover:bg-rose-950/60 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title="Hedef Sisteme Odaklan"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                          </button>
                          {isMoving && (
                            <span className="text-cyan-300 font-mono text-[9.5px]">
                              {formatDuration(remainingMs)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transit Progress Bar */}
                      {isMoving && (
                        <div className="w-full h-1 bg-[#0a141e] rounded-full mt-1.5 overflow-hidden border border-[#162e3d]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              fleet.status === 'returning'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : fleet.status === 'intercepting'
                                ? 'bg-gradient-to-r from-rose-500 to-orange-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 4. Civilian & Transport Fleets */}
        <div className="border border-[#18374b] bg-[#070e17]/80 rounded-sm overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('civilian')}
            className="w-full px-2.5 py-1.5 stellaris-section-header flex items-center justify-between text-[10px] uppercase font-bold text-[#e6f4f8] tracking-wider hover:text-amber-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-amber-400" />
              <span>SİVİL & GÖREV FİLOLARI ({civilianFleets.length})</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#c5a059] transition-transform ${
                sectionsOpen.civilian ? '' : '-rotate-90'
              }`}
            />
          </button>

          {sectionsOpen.civilian && (
            <div className="p-1 space-y-1">
              {civilianFleets.length === 0 ? (
                <div className="p-2 text-center text-slate-500 text-[10px]">
                  Aktif sivil filo yok.
                </div>
              ) : (
                civilianFleets.map((fleet) => {
                  const isSelected =
                    selectedTarget?.type === 'fleet' && selectedTarget.fleetId === fleet.id;
                  const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
                  const targetSys = state.map.systems[fleet.targetSystemId];
                  const remainingMs = Math.max(0, fleet.arrivalTime - currentTimeMs);
                  const isMoving = fleet.status === 'in_transit' || fleet.status === 'intercepting' || fleet.status === 'returning';
                  const totalDuration = Math.max(1, fleet.arrivalTime - fleet.departureTime);
                  const elapsed = Math.max(0, currentTimeMs - fleet.departureTime);
                  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                  return (
                    <div
                      key={fleet.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectFleet(fleet.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sound.playClick();
                        if (onContextMenuTarget) {
                          onContextMenuTarget({
                            type: 'fleet',
                            systemId: fleet.targetSystemId || fleet.originSystemId,
                            fleetId: fleet.id,
                          });
                        }
                      }}
                      className={`p-2 rounded-sm cursor-pointer stellaris-item-card group ${
                        isSelected
                          ? '!border-amber-500/80 !bg-amber-950/40 shadow-sm shadow-amber-950/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-[11px] flex items-center gap-1">
                          {fleet.mission === 'colonize'
                            ? '🏛️ Koloni Seferi'
                            : fleet.mission === 'explore'
                            ? '📡 Keşif Seferi'
                            : fleet.mission === 'attack'
                            ? '⚔️ Taarruz'
                            : fleet.mission === 'intercept'
                            ? '🎯 Önleme'
                            : '📦 Nakliye/İkmal'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 font-mono">
                          {totalShips} Gemi
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className="truncate flex items-center gap-1 text-slate-300">
                          <span>➔</span>
                          <span>{targetSys?.name}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playClick();
                              onSelectSystem(fleet.targetSystemId || fleet.originSystemId);
                            }}
                            className="p-0.5 rounded-sm text-slate-500 hover:text-amber-300 hover:bg-amber-950/60 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title="Hedef Sisteme Odaklan"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                          </button>
                          {isMoving && (
                            <span className="text-cyan-300 font-mono text-[9.5px]">
                              {formatDuration(remainingMs)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transit Progress Bar */}
                      {isMoving && (
                        <div className="w-full h-1 bg-[#0a141e] rounded-full mt-1.5 overflow-hidden border border-[#162e3d]">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 5. Central Nexus Relay Status */}
        <div className="border border-[#18374b] bg-[#070e17]/80 rounded-sm overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('relay')}
            className="w-full px-2.5 py-1.5 stellaris-section-header flex items-center justify-between text-[10px] uppercase font-bold text-[#e6f4f8] tracking-wider hover:text-purple-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>NEXUS MEGASTRÜKTÜRÜ</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#c5a059] transition-transform ${
                sectionsOpen.relay ? '' : '-rotate-90'
              }`}
            />
          </button>

          {sectionsOpen.relay && (
            <div
              onClick={() => {
                sound.playClick();
                onSelectSystem(relay.systemId);
              }}
              className="p-2.5 cursor-pointer stellaris-item-card transition-all text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold">{relaySys?.name || 'Merkezi Röle'}</span>
                {relayController && (
                  <span
                    className="w-3 h-3 rounded-full border border-purple-400 shadow-[0_0_6px_#a855f7]"
                    style={{ backgroundColor: relayController.color }}
                    title={relayController.name}
                  />
                )}
              </div>
              <div className="text-[10px] text-purple-300 font-bold mt-1 flex items-center justify-between">
                <span>Hâkim: {relayController ? relayController.name : 'Tarafsız Savunma'}</span>
                <span className="text-purple-400 font-mono text-[9.5px]">F8</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export const StellarisOutliner = React.memo(StellarisOutlinerComponent);
