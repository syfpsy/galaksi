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
}

export const StellarisOutliner: React.FC<StellarisOutlinerProps> = ({
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
          className="pointer-events-auto mt-4 bg-[#0a1120]/95 hover:bg-[#121e36] text-cyan-400 border-l border-y border-cyan-500/40 px-2 py-3 rounded-l-lg shadow-xl backdrop-blur-md flex flex-col items-center gap-2 group transition-all"
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
    <aside className="w-72 h-full bg-[#080d19]/95 backdrop-blur-md border-l border-[#1a2942] flex flex-col z-20 select-none shadow-2xl overflow-hidden relative">
      {/* Outliner Header */}
      <div className="h-10 px-3 bg-[#0a1120] border-b border-[#1a2942] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-200">
            Sektör Çizelgesi
          </span>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            handleToggleCollapse();
          }}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all"
          title="Çizelgeyi Gizle"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Outliner Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-2 pb-32 space-y-2.5 text-xs font-mono scrollbar-none">
        {/* 1. Hostile Threats Alert (if any) */}
        {hostileThreats.length > 0 && (
          <div className="border border-rose-500/50 bg-rose-950/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('threats')}
              className="w-full px-2.5 py-1.5 bg-rose-950/40 flex items-center justify-between text-[10px] uppercase font-bold text-rose-300 tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Tehdit / Baskın ({hostileThreats.length})</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  sectionsOpen.threats ? '' : '-rotate-90'
                }`}
              />
            </button>

            {sectionsOpen.threats && (
              <div className="p-1.5 space-y-1">
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
                      className="p-2 rounded bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-200">
                        <span>{sender?.name || 'Bilinmeyen Filo'}</span>
                        <span className="text-rose-400 text-[10px] animate-pulse">
                          {formatDuration(remainingMs)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-between">
                        <span>➔ {targetSys?.name}</span>
                        <span className="text-amber-400">
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
        <div className="border border-[#1a2942] bg-[#0b1325]/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('planets')}
            className="w-full px-2.5 py-1.5 bg-[#0e172e] flex items-center justify-between text-[10px] uppercase font-bold text-slate-300 tracking-wider hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Koloniler ({myPlanets.length})</span>
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
                    className={`p-2 rounded-md border transition-all cursor-pointer ${
                      isActive || isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                        : 'bg-[#080e1c]/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
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
                          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            ANA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
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

                    {/* Active Construction Indicator */}
                    {isBuilding && planet.buildingQueue && (
                      <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-cyan-400">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <Wrench className="w-2.5 h-2.5 animate-spin" />
                          {BUILDING_STATS[planet.buildingQueue.type].nameTr}
                        </span>
                        <span>
                          {formatDuration(
                            Math.max(0, planet.buildingQueue.finishTime - currentTimeMs)
                          )}
                        </span>
                      </div>
                    )}

                    {/* Shipyard Queue Indicator */}
                    {planet.shipyardQueue && planet.shipyardQueue.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-amber-400">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <Rocket className="w-2.5 h-2.5" />
                          {planet.shipyardQueue[0].count}x {SHIP_STATS[planet.shipyardQueue[0].shipType]?.nameTr || 'Gemi'}
                        </span>
                        <span>
                          {formatDuration(
                            Math.max(0, planet.shipyardQueue[0].nextUnitFinishTime - currentTimeMs)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Military Fleets */}
        <div className="border border-[#1a2942] bg-[#0b1325]/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('military')}
            className="w-full px-2.5 py-1.5 bg-[#0e172e] flex items-center justify-between text-[10px] uppercase font-bold text-slate-300 tracking-wider hover:text-rose-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Muharip Filolar ({militaryFleets.length})</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
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

                  const statusLabels: Record<string, string> = {
                    in_transit: 'Rotada',
                    returning: 'Geri Dönüş',
                    intercepting: 'Önleme',
                    stationed: 'İstasyonda',
                  };

                  return (
                    <div
                      key={fleet.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectFleet(fleet.id);
                      }}
                      className={`p-2 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                          : 'bg-[#080e1c]/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-[11px] truncate">
                          {fleet.status === 'in_transit'
                            ? 'Rotada'
                            : fleet.status === 'returning'
                            ? 'Geri Dönüş'
                            : fleet.status === 'intercepting'
                            ? 'Önleme'
                            : 'Yörüngede'}
                        </span>
                        <span className="text-[10px] font-bold text-rose-400">
                          {totalShips} Gemi
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate">➔ {targetSys?.name || 'Sistem'}</span>
                        {fleet.status !== 'orbiting' && (
                          <span className="text-cyan-300 font-mono">
                            {formatDuration(remainingMs)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 4. Civilian & Transport Fleets */}
        <div className="border border-[#1a2942] bg-[#0b1325]/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('civilian')}
            className="w-full px-2.5 py-1.5 bg-[#0e172e] flex items-center justify-between text-[10px] uppercase font-bold text-slate-300 tracking-wider hover:text-amber-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-amber-400" />
              <span>Sivil & Keşif ({civilianFleets.length})</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
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

                  return (
                    <div
                      key={fleet.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectFleet(fleet.id);
                      }}
                      className={`p-2 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-sm'
                          : 'bg-[#080e1c]/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-[11px]">
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
                        <span className="text-[10px] font-bold text-amber-400">
                          {totalShips} Gemi
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate">➔ {targetSys?.name}</span>
                        <span className="text-cyan-300 font-mono">
                          {formatDuration(remainingMs)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 5. Central Nexus Relay Status */}
        <div className="border border-[#1a2942] bg-[#0b1325]/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('relay')}
            className="w-full px-2.5 py-1.5 bg-[#0e172e] flex items-center justify-between text-[10px] uppercase font-bold text-purple-300 tracking-wider hover:text-purple-200 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>Nexus Megastrüktürü</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
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
              className="p-2.5 cursor-pointer hover:bg-purple-950/20 transition-all text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{relaySys?.name || 'Merkezi Röle'}</span>
                {relayController && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: relayController.color }}
                    title={relayController.name}
                  />
                )}
              </div>
              <div className="text-[10px] text-purple-300 font-bold mt-1">
                Hâkim: {relayController ? relayController.name : 'Tarafsız Savunma'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
