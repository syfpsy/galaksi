import React, { useMemo } from 'react';
import {
  Compass,
  Crosshair,
  Flag,
  Navigation,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  TriangleAlert,
} from 'lucide-react';
import { getFleetCurrentPosition } from '../../engine/flight';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { Fleet, GameState, IntelLevel, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';

interface GalaxyMapProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  godMode: boolean;
  onSelectSystem: (systemId: string) => void;
  onSelectFleet: (fleetId: string) => void;
}

export const GalaxyMap: React.FC<GalaxyMapProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  godMode,
  onSelectSystem,
  onSelectFleet,
}) => {
  const activePlayer = state.players[activePlayerId];

  // Calculate sensor coverage for active player
  const sensorCoverage = useMemo(() => {
    return getPlayerSensorCoverage(state, activePlayerId);
  }, [state, activePlayerId]);

  // Systems intel mapping
  const systems = useMemo(() => {
    return Object.values(state.map.systems);
  }, [state.map.systems]);

  // Live positions of all moving fleets
  const movingFleets = useMemo(() => {
    return Object.values(state.fleets)
      .filter((f) => f.status === 'in_transit' || f.status === 'returning' || f.status === 'intercepting')
      .map((f) => {
        const pos = getFleetCurrentPosition(f, state.timeMs, state.map.systems);
        const owner = state.players[f.ownerId];
        const isOwn = f.ownerId === activePlayerId;

        // Visibility in fog
        const isVisible =
          godMode ||
          isOwn ||
          sensorCoverage.has(f.originSystemId) ||
          sensorCoverage.has(f.targetSystemId);

        return {
          fleet: f,
          pos,
          owner,
          isOwn,
          isVisible,
        };
      });
  }, [state.fleets, state.timeMs, state.map.systems, state.players, activePlayerId, godMode, sensorCoverage]);

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden flex items-center justify-center select-none">
      {/* Background Starfield Grid & Cyber Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c2b53_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />

      {/* Center Sector Ambient Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyber-cyan/5 blur-3xl pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-violet/5 blur-2xl pointer-events-none" />

      {/* SVG Canvas for Galaxy Map */}
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-full max-w-[1200px] max-h-[900px] object-contain cursor-crosshair"
      >
        <defs>
          {/* Cyber Glow Filters */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-relay" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-fleet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Flight Lanes */}
        <g className="flight-lanes">
          {state.map.lanes.map((lane) => {
            const from = state.map.systems[lane.fromSystemId];
            const to = state.map.systems[lane.toSystemId];
            if (!from || !to) return null;

            const isKnown =
              godMode ||
              sensorCoverage.has(from.id) ||
              sensorCoverage.has(to.id) ||
              activePlayer?.intel.discoveredSystems[from.id] ||
              activePlayer?.intel.discoveredSystems[to.id];

            const isSelected =
              selectedTarget?.systemId === from.id || selectedTarget?.systemId === to.id;

            return (
              <g key={lane.id}>
                {/* Lane Base Line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isSelected ? '#00f3ff' : isKnown ? '#1c2b53' : '#0e172a'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  strokeDasharray={isSelected ? '6,3' : undefined}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </g>

        {/* 2. Sensor Bubble Overlay for Friendly Planets & Fleets */}
        <g className="sensor-bubbles pointer-events-none">
          {systems.map((sys) => {
            const hasCover = sensorCoverage.has(sys.id);
            if (!hasCover || godMode) return null;

            return (
              <circle
                key={`bubble_${sys.id}`}
                cx={sys.x}
                cy={sys.y}
                r="70"
                fill="none"
                stroke="#00f3ff"
                strokeWidth="1"
                strokeDasharray="4,6"
                opacity="0.18"
              />
            );
          })}
        </g>

        {/* 3. Moving Fleets */}
        <g className="moving-fleets">
          {movingFleets.map(({ fleet, pos, owner, isOwn, isVisible }) => {
            if (!isVisible) return null;

            const isSelected = selectedTarget?.fleetId === fleet.id;
            const targetSys = state.map.systems[fleet.targetSystemId];
            const color = owner?.color || '#00f3ff';

            // Calculate angle for fleet vector
            const angle = targetSys
              ? (Math.atan2(targetSys.y - pos.y, targetSys.x - pos.x) * 180) / Math.PI
              : 0;

            const remainingSec = Math.max(0, Math.round((fleet.arrivalTime - state.timeMs) / 1000));
            const totalShips = Object.values(fleet.ships).reduce((a, b) => a + b, 0);

            return (
              <g
                key={fleet.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFleet(fleet.id);
                }}
                className="cursor-pointer group"
              >
                {/* Vector trajectory line to target */}
                {targetSys && (
                  <line
                    x1="0"
                    y1="0"
                    x2={targetSys.x - pos.x}
                    y2={targetSys.y - pos.y}
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.4"
                  />
                )}

                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#00f3ff"
                    strokeWidth="1.5"
                    className="animate-ping"
                  />
                )}

                {/* Fleet Icon Shape */}
                <g transform={`rotate(${angle})`} filter="url(#glow-fleet)">
                  <polygon
                    points="12,0 -8,-7 -4,0 -8,7"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </g>

                {/* Fleet Label / ETA Tag */}
                <g transform="translate(0, 18)" className="pointer-events-none">
                  <rect
                    x="-40"
                    y="-8"
                    width="80"
                    height="16"
                    rx="3"
                    fill="#070d1d"
                    fillOpacity="0.9"
                    stroke={isOwn ? '#00f3ff' : '#f43f5e'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {isOwn ? `${totalShips}G • ${remainingSec}s` : `DÜŞMAN • ${remainingSec}s`}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* 4. Star Systems & Central Relay */}
        <g className="star-systems">
          {systems.map((sys) => {
            const hasCover = sensorCoverage.has(sys.id);
            const storedIntel = activePlayer?.intel.discoveredSystems[sys.id];
            const isKnown = godMode || hasCover || (storedIntel && storedIntel !== 'unexplored');
            const isSelected = selectedTarget?.systemId === sys.id;

            // Check if any planet in system is owned
            const ownedPlanets = sys.slots
              .map((s) => state.planets[s.planetId])
              .filter((p) => p && p.ownerId);

            const hasOwnColony = ownedPlanets.some((p) => p.ownerId === activePlayerId);
            const hasEnemyColony = ownedPlanets.some((p) => p.ownerId !== activePlayerId);

            const isRelay = sys.hasRelay;
            const relayController = isRelay && state.relay.controllingPlayerId
              ? state.players[state.relay.controllingPlayerId]
              : null;

            return (
              <g
                key={sys.id}
                transform={`translate(${sys.x}, ${sys.y})`}
                onClick={() => onSelectSystem(sys.id)}
                className="cursor-pointer group"
              >
                {/* Selection Reticle Brackets */}
                {isSelected && (
                  <g className="text-cyber-cyan animate-pulse">
                    <circle r="32" fill="none" stroke="#00f3ff" strokeWidth="1" strokeDasharray="8,4" />
                    <line x1="-36" y1="0" x2="-28" y2="0" stroke="#00f3ff" strokeWidth="2" />
                    <line x1="28" y1="0" x2="36" y2="0" stroke="#00f3ff" strokeWidth="2" />
                    <line x1="0" y1="-36" x2="0" y2="-28" stroke="#00f3ff" strokeWidth="2" />
                    <line x1="0" y1="28" x2="0" y2="36" stroke="#00f3ff" strokeWidth="2" />
                  </g>
                )}

                {/* Central Contested Relay Beacon Wave */}
                {isRelay && (
                  <g filter="url(#glow-relay)">
                    <circle
                      r="26"
                      fill="none"
                      stroke={relayController ? relayController.color : '#8b5cf6'}
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.4"
                    />
                    <circle
                      r="18"
                      fill="#070d1d"
                      stroke={relayController ? relayController.color : '#8b5cf6'}
                      strokeWidth="2"
                    />
                    {/* Crown / Relay Symbol */}
                    <polygon
                      points="0,-8 6,-2 4,6 -4,6 -6,-2"
                      fill={relayController ? relayController.color : '#8b5cf6'}
                    />
                  </g>
                )}

                {/* Standard Star Node */}
                {!isRelay && (
                  <g filter="url(#glow-cyan)">
                    {/* Colony Ring Indicator */}
                    {hasOwnColony && (
                      <circle r="18" fill="none" stroke="#10b981" strokeWidth="2" />
                    )}
                    {hasEnemyColony && !hasOwnColony && (
                      <circle r="18" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    )}

                    {/* Star Body */}
                    <circle
                      r={isSelected ? 11 : 9}
                      fill={isKnown ? '#ffaa00' : '#475569'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all duration-200 group-hover:scale-125"
                    />
                  </g>
                )}

                {/* POI or Debris Field Marker */}
                {isKnown && sys.poi && !sys.poi.explored && (
                  <g transform="translate(14, -14)">
                    <circle r="7" fill="#ffaa00" />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#030712"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                  </g>
                )}

                {isKnown && sys.hasDebris && (sys.hasDebris.ore > 0 || sys.hasDebris.crystal > 0) && (
                  <g transform="translate(-14, -14)">
                    <circle r="7" fill="#f43f5e" />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      ⚙
                    </text>
                  </g>
                )}

                {/* System Name Label */}
                <g transform="translate(0, 24)" className="pointer-events-none">
                  <rect
                    x="-45"
                    y="-9"
                    width="90"
                    height="18"
                    rx="3"
                    fill="#070d1d"
                    fillOpacity="0.85"
                    stroke={isSelected ? '#00f3ff' : '#1e293b'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isKnown ? '#f8fafc' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={isRelay ? 'bold' : 'normal'}
                    fontFamily="sans-serif"
                  >
                    {isKnown ? sys.name : '??? Bilinmeyen'}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-4 bg-space-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 flex items-center gap-4 text-[11px] text-slate-300 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>Koloniniz</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Düşman Gezegen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          <span>Nexus Rölesi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>Keşif POI</span>
        </div>
      </div>
    </div>
  );
};
