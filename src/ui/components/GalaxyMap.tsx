import React, { useMemo, useState } from 'react';
import {
  Compass,
  Crosshair,
  Flag,
  Globe,
  Maximize2,
  Minus,
  Navigation,
  Plus,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  TriangleAlert,
} from 'lucide-react';
import { getFleetCurrentPosition } from '../../engine/flight';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { Fleet, GameState, IntelLevel, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface GalaxyMapProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  godMode: boolean;
  onSelectSystem: (systemId: string) => void;
  onSelectFleet: (fleetId: string) => void;
  onInspectSystem?: (systemId: string) => void;
}

// Deterministic background starfield
const BACKGROUND_STARS = Array.from({ length: 80 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const x = (seed % 960) + 20;
  const y = (((seed * 7) % 760) + 20);
  const r = 0.6 + ((seed % 100) / 100) * 1.4;
  const delay = ((seed % 50) / 10).toFixed(1);
  const duration = (2.5 + ((seed % 40) / 10)).toFixed(1);
  const opacity = 0.2 + ((seed % 60) / 100) * 0.7;
  return { x, y, r, delay, duration, opacity };
});

export const GalaxyMap: React.FC<GalaxyMapProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  godMode,
  onSelectSystem,
  onSelectFleet,
  onInspectSystem,
}) => {
  const [zoom, setZoom] = useState(1);
  const activePlayer = state.players[activePlayerId];

  // Calculate sensor coverage for active player
  const sensorCoverage = useMemo(() => {
    return getPlayerSensorCoverage(state, activePlayerId);
  }, [state, activePlayerId]);

  // Systems intel mapping
  const systems = useMemo(() => {
    return Object.values(state.map.systems);
  }, [state.map.systems]);

  // Find player's primary homeworld for radar sweep origin
  const primaryHomeworld = useMemo(() => {
    const hwPlanet = Object.values(state.planets).find(
      (p) => p.ownerId === activePlayerId && p.isHomeworld
    );
    if (hwPlanet) return state.map.systems[hwPlanet.systemId];
    return systems[0];
  }, [state.planets, activePlayerId, systems, state.map.systems]);

  // Active lanes that currently have fleets traveling on them
  const activeTravelLanes = useMemo(() => {
    const activePairs = new Set<string>();
    Object.values(state.fleets).forEach((f) => {
      if (f.status === 'in_transit' || f.status === 'returning' || f.status === 'intercepting') {
        activePairs.add(`${f.originSystemId}->${f.targetSystemId}`);
        activePairs.add(`${f.targetSystemId}->${f.originSystemId}`);
      }
    });
    return activePairs;
  }, [state.fleets]);

  // Live positions of all moving fleets
  const movingFleets = useMemo(() => {
    return Object.values(state.fleets)
      .filter(
        (f) =>
          f.status === 'in_transit' || f.status === 'returning' || f.status === 'intercepting'
      )
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

        // Flagship class identification
        let dominantClass: 'battleship' | 'fighter' | 'transport' | 'scout' = 'scout';
        if (f.ships.battleship > 0) dominantClass = 'battleship';
        else if (f.ships.fighter > 0) dominantClass = 'fighter';
        else if (f.ships.transport > 0) dominantClass = 'transport';

        return {
          fleet: f,
          pos,
          owner,
          isOwn,
          isVisible,
          dominantClass,
        };
      });
  }, [
    state.fleets,
    state.timeMs,
    state.map.systems,
    state.players,
    activePlayerId,
    godMode,
    sensorCoverage,
  ]);

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden flex items-center justify-center select-none">
      {/* Dynamic 2D Cosmic Dust & Tactical HUD Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c2b53_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      {/* Atmospheric Cosmic Color Wash Behind Map */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-cyan-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute w-[550px] h-[550px] rounded-full bg-purple-950/25 blur-[100px] pointer-events-none" />

      {/* SVG Canvas for Galaxy Map */}
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-full max-w-[1300px] max-h-[950px] object-contain cursor-crosshair"
      >
        <defs>
          {/* Cyber Glow Filters */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-star-flare" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-relay" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
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

          {/* Star Radial Gradients */}
          {/* Sol Type (Yellow/Gold) */}
          <radialGradient id="star-sol" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fffbeb" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.4" />
          </radialGradient>

          {/* Rigel Type (Blue Giant) */}
          <radialGradient id="star-rigel" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#a5f3fc" />
            <stop offset="65%" stopColor="#06b6d4" />
            <stop offset="85%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.4" />
          </radialGradient>

          {/* Proxima Type (Red Dwarf) */}
          <radialGradient id="star-proxima" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fecdd3" />
            <stop offset="55%" stopColor="#f43f5e" />
            <stop offset="85%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#4c0519" stopOpacity="0.4" />
          </radialGradient>

          {/* Nexus Singularity Core (Tachyon Violet) */}
          <radialGradient id="star-nexus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#f3e8ff" />
            <stop offset="60%" stopColor="#c084fc" />
            <stop offset="85%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0.6" />
          </radialGradient>

          {/* Nebula Multi-Color Gradients */}
          <radialGradient id="nebula-cyan-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#0891b2" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="nebula-violet-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#7e22ce" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="nebula-amber-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#b45309" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
          </radialGradient>

          {/* Plasma Thruster Trail Gradients */}
          <linearGradient id="thruster-trail-cyan" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="thruster-trail-rose" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#e11d48" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#881337" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Zoomable Container */}
        <g
          transform={`scale(${zoom})`}
          style={{
            transformOrigin: '500px 400px',
            transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Layer 0: Distant Starfield with Twinkle Animation */}
          <g className="starfield pointer-events-none">
            {BACKGROUND_STARS.map((s, idx) => (
              <circle
                key={`bg_star_${idx}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill="#ffffff"
                opacity={s.opacity}
                style={{
                  animation: `twinkle-star ${s.duration}s ease-in-out infinite`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </g>

          {/* Layer 1: Ambient Dynamic Nebula Clouds */}
          <g className="nebulae pointer-events-none animate-nebula-drift">
            {/* Northwest Cyan Nebula */}
            <path
              d="M 120,80 Q 280,20 380,140 T 260,320 T 90,220 Z"
              fill="url(#nebula-cyan-grad)"
              filter="blur(30px)"
            />
            {/* Central Violet Relic Cloud */}
            <path
              d="M 420,320 Q 620,260 680,440 T 480,560 T 360,420 Z"
              fill="url(#nebula-violet-grad)"
              filter="blur(40px)"
            />
            {/* Southeast Amber Mineral Cloud */}
            <path
              d="M 640,480 Q 860,420 890,620 T 720,740 T 560,600 Z"
              fill="url(#nebula-amber-grad)"
              filter="blur(35px)"
            />
          </g>

          {/* Layer 2: Tactical Homeworld Radar Sensor Sweep */}
          {primaryHomeworld && (
            <g
              transform={`translate(${primaryHomeworld.x}, ${primaryHomeworld.y})`}
              className="pointer-events-none"
            >
              {/* Radar Distance Range Circles */}
              <circle r="90" fill="none" stroke="#00f3ff" strokeWidth="0.8" strokeDasharray="3,6" opacity="0.2" />
              <circle r="180" fill="none" stroke="#00f3ff" strokeWidth="0.6" strokeDasharray="4,8" opacity="0.12" />
              <circle r="270" fill="none" stroke="#00f3ff" strokeWidth="0.5" strokeDasharray="6,12" opacity="0.08" />

              {/* Rotating 45-degree Scan Sector Line */}
              <g className="animate-radar-sweep" style={{ transformOrigin: '0px 0px' }}>
                <line x1="0" y1="0" x2="270" y2="0" stroke="#00f3ff" strokeWidth="1.2" opacity="0.35" />
                <path
                  d="M 0,0 L 270,0 A 270,270 0 0,0 249,-103 Z"
                  fill="#00f3ff"
                  opacity="0.04"
                />
              </g>
            </g>
          )}

          {/* Layer 3: Dynamic Hyperlanes (Jump Lanes) */}
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

              const hasActiveFleet =
                activeTravelLanes.has(`${from.id}->${to.id}`) ||
                activeTravelLanes.has(`${to.id}->${from.id}`);

              return (
                <g key={lane.id}>
                  {/* Lane Base Conduit Line */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isSelected ? '#00f3ff' : isKnown ? '#1c2b53' : '#0a101f'}
                    strokeWidth={isSelected ? 2.5 : hasActiveFleet ? 2 : 1.5}
                    opacity={isKnown ? 0.75 : 0.3}
                  />

                  {/* Flowing Energy Pulse Stream */}
                  {isKnown && (
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={
                        hasActiveFleet
                          ? '#f59e0b'
                          : isSelected
                          ? '#00f3ff'
                          : '#0284c7'
                      }
                      strokeWidth={hasActiveFleet ? 2 : 1.2}
                      strokeDasharray={hasActiveFleet ? '4,8' : '3,10'}
                      opacity={hasActiveFleet ? 0.9 : isSelected ? 0.8 : 0.45}
                      className={hasActiveFleet ? 'animate-hyperlane-fast' : 'animate-hyperlane-flow'}
                    />
                  )}

                  {/* Junction Nodes at lane midpoints if active */}
                  {hasActiveFleet && (
                    <circle
                      cx={(from.x + to.x) / 2}
                      cy={(from.y + to.y) / 2}
                      r="2.5"
                      fill="#f59e0b"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Layer 4: Sensor Coverage Bubbles Overlay */}
          <g className="sensor-bubbles pointer-events-none">
            {systems.map((sys) => {
              const hasCover = sensorCoverage.has(sys.id);
              if (!hasCover || godMode) return null;

              return (
                <circle
                  key={`bubble_${sys.id}`}
                  cx={sys.x}
                  cy={sys.y}
                  r="75"
                  fill="none"
                  stroke="#00f3ff"
                  strokeWidth="0.8"
                  strokeDasharray="4,8"
                  opacity="0.22"
                />
              );
            })}
          </g>

          {/* Layer 5: Dynamic 2D Moving Fleets */}
          <g className="moving-fleets">
            {movingFleets.map(({ fleet, pos, owner, isOwn, isVisible, dominantClass }) => {
              if (!isVisible) return null;

              const isSelected = selectedTarget?.fleetId === fleet.id;
              const targetSys = state.map.systems[fleet.targetSystemId];
              const color = owner?.color || '#00f3ff';

              // Calculate angle for fleet vector
              const angle = targetSys
                ? (Math.atan2(targetSys.y - pos.y, targetSys.x - pos.x) * 180) / Math.PI
                : 0;

              const remainingMs = Math.max(0, fleet.arrivalTime - state.timeMs);
              const isRecallLocked = state.timeMs >= fleet.recallLockedAfterTime;
              const totalShips = Object.values(fleet.ships).reduce((a, b) => a + b, 0);

              return (
                <g
                  key={fleet.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    onSelectFleet(fleet.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Trajectory Guide Line to Target */}
                  {targetSys && (
                    <line
                      x1="0"
                      y1="0"
                      x2={targetSys.x - pos.x}
                      y2={targetSys.y - pos.y}
                      stroke={isRecallLocked ? '#f43f5e' : color}
                      strokeWidth="1.2"
                      strokeDasharray={isRecallLocked ? '4,3' : '3,4'}
                      opacity="0.6"
                    />
                  )}

                  {/* Selection Pulsing Reticle */}
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#00f3ff"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.75"
                    />
                  )}

                  {/* Rotated Ship Model & Plasma Thruster */}
                  <g transform={`rotate(${angle})`}>
                    {/* Dynamic Plasma Engine Exhaust Trail */}
                    <polygon
                      points="-10,0 -38,-5 -34,0 -38,5"
                      fill={isOwn ? 'url(#thruster-trail-cyan)' : 'url(#thruster-trail-rose)'}
                      className="animate-exhaust"
                    />

                    {/* Ship Vector Silhouette by Class */}
                    {dominantClass === 'battleship' ? (
                      /* Battleship Dreadnought: Heavy split prow, spinal groove, side pods */
                      <g filter="url(#glow-fleet)">
                        <polygon
                          points="16,0 4,-6 -2,-10 -10,-8 -12,-4 -8,0 -12,4 -10,8 -2,10 4,6"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <line x1="0" y1="0" x2="14" y2="0" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    ) : dominantClass === 'fighter' ? (
                      /* Fighter Interceptor: Sharp forward delta with wingtip cannons */
                      <g filter="url(#glow-fleet)">
                        <polygon
                          points="14,0 -6,-8 -4,-3 -10,-1 -10,1 -4,3 -6,8"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </g>
                    ) : dominantClass === 'transport' ? (
                      /* Heavy Transport: Hexagonal industrial container hauler */
                      <g filter="url(#glow-fleet)">
                        <polygon
                          points="11,-4 11,4 4,8 -6,8 -10,4 -10,-4 -6,-8 4,-8"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <rect x="-4" y="-5" width="8" height="10" fill="#070d1d" opacity="0.6" />
                      </g>
                    ) : (
                      /* Scout Recon: Sleek needle interceptor */
                      <g filter="url(#glow-fleet)">
                        <polygon
                          points="14,0 -6,-5 -3,0 -6,5"
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </g>
                    )}
                  </g>

                  {/* Tactical ETA & Composition Badge */}
                  <g transform="translate(0, 20)" className="pointer-events-none">
                    <rect
                      x="-60"
                      y="-10"
                      width="120"
                      height="20"
                      rx="4"
                      fill="#070d1d"
                      fillOpacity="0.9"
                      stroke={isOwn ? (isRecallLocked ? '#f43f5e' : '#00f3ff') : '#f43f5e'}
                      strokeWidth="0.9"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {isOwn
                        ? `${totalShips}G • ${formatDuration(remainingMs)}`
                        : `DÜŞMAN • ${formatDuration(remainingMs)}`}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Layer 6: Dynamic 2D Star Systems & Nexus Relay */}
          <g className="star-systems">
            {systems.map((sys, idx) => {
              const hasCover = sensorCoverage.has(sys.id);
              const storedIntel = activePlayer?.intel.discoveredSystems[sys.id];
              const isKnown = godMode || hasCover || (storedIntel && storedIntel !== 'unexplored');
              const isSelected = selectedTarget?.systemId === sys.id;

              // Check planet ownership
              const ownedPlanets = sys.slots
                .map((s) => state.planets[s.planetId])
                .filter((p) => p && p.ownerId);

              const hasOwnColony = ownedPlanets.some((p) => p.ownerId === activePlayerId);
              const enemyColony = ownedPlanets.find((p) => p.ownerId !== activePlayerId);
              const dominantColonyOwner = hasOwnColony
                ? activePlayer
                : enemyColony
                ? state.players[enemyColony.ownerId]
                : null;

              const isRelay = sys.hasRelay;
              const relayController =
                isRelay && state.relay.controllingPlayerId
                  ? state.players[state.relay.controllingPlayerId]
                  : null;

              // Deterministic star spectral type
              const spectralClass =
                isRelay
                  ? 'nexus'
                  : idx % 3 === 0
                  ? 'sol'
                  : idx % 3 === 1
                  ? 'rigel'
                  : 'proxima';

              const starGrad =
                spectralClass === 'nexus'
                  ? 'url(#star-nexus)'
                  : spectralClass === 'rigel'
                  ? 'url(#star-rigel)'
                  : spectralClass === 'proxima'
                  ? 'url(#star-proxima)'
                  : 'url(#star-sol)';

              return (
                <g
                  key={sys.id}
                  transform={`translate(${sys.x}, ${sys.y})`}
                  onClick={() => {
                    sound.playClick();
                    onSelectSystem(sys.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Territorial Influence Aura (Soft Faction Halo) */}
                  {dominantColonyOwner && isKnown && (
                    <circle
                      r="48"
                      fill={dominantColonyOwner.color}
                      opacity="0.12"
                      filter="blur(6px)"
                    />
                  )}

                  {/* Micro Planetary Orbital Paths Around Star */}
                  {isKnown && !isRelay && (
                    <g className="pointer-events-none opacity-40">
                      <circle r="18" fill="none" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2,3" />
                      <circle r="26" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="3,4" />

                      {/* Micro Planet 1 Rotating */}
                      <g className="animate-spin-medium" style={{ transformOrigin: '0px 0px' }}>
                        <circle cx="18" cy="0" r="1.8" fill="#38bdf8" />
                      </g>

                      {/* Micro Planet 2 Rotating */}
                      <g className="animate-spin-slow" style={{ transformOrigin: '0px 0px' }}>
                        <circle cx="-26" cy="0" r="2.2" fill="#fbbf24" />
                      </g>
                    </g>
                  )}

                  {/* Selection Tactical Reticle Brackets */}
                  {isSelected && (
                    <g className="text-cyber-cyan animate-tactical-bracket">
                      <circle r="36" fill="none" stroke="#00f3ff" strokeWidth="1" strokeDasharray="8,4" opacity="0.8" />
                      {/* Corner Ticks */}
                      <path d="M -30,-40 L -40,-40 L -40,-30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                      <path d="M 30,-40 L 40,-40 L 40,-30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                      <path d="M -30,40 L -40,40 L -40,30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                      <path d="M 30,40 L 40,40 L 40,30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                    </g>
                  )}

                  {/* Central Nexus Relay Megastructure */}
                  {isRelay ? (
                    <g filter="url(#glow-relay)">
                      {/* Radiating Tachyon Energy Pulse Wave */}
                      <circle
                        r="32"
                        fill="none"
                        stroke={relayController ? relayController.color : '#a855f7'}
                        strokeWidth="1.5"
                        className="animate-ping"
                        opacity="0.45"
                      />

                      {/* Outer Gyroscopic Ring (Rotating Clockwise) */}
                      <g className="animate-spin-slow" style={{ transformOrigin: '0px 0px' }}>
                        <circle
                          r="26"
                          fill="none"
                          stroke={relayController ? relayController.color : '#c084fc'}
                          strokeWidth="2"
                          strokeDasharray="14,6"
                        />
                        <rect x="-2" y="-28" width="4" height="4" fill="#ffffff" />
                        <rect x="-2" y="24" width="4" height="4" fill="#ffffff" />
                        <rect x="-28" y="-2" width="4" height="4" fill="#ffffff" />
                        <rect x="24" y="-2" width="4" height="4" fill="#ffffff" />
                      </g>

                      {/* Inner Ring (Rotating Counter-Clockwise) */}
                      <g className="animate-spin-reverse" style={{ transformOrigin: '0px 0px' }}>
                        <circle
                          r="18"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          strokeDasharray="6,4"
                        />
                      </g>

                      {/* Central Singularity Sphere */}
                      <circle r="12" fill="url(#star-nexus)" stroke="#ffffff" strokeWidth="1" />

                      {/* Core Crown Icon */}
                      <polygon
                        points="0,-7 5,-2 3,5 -3,5 -5,-2"
                        fill="#ffffff"
                        opacity="0.9"
                      />
                    </g>
                  ) : (
                    /* Standard Dynamic 2D Star */
                    <g>
                      {/* Coronal Flare Glow with Pulse */}
                      <circle
                        r={isSelected ? 22 : 18}
                        fill={starGrad}
                        opacity="0.4"
                        className="animate-corona-pulse"
                      />

                      {/* Solar Flare Prominence Rays */}
                      <g className="animate-flare-pulse" style={{ transformOrigin: '0px 0px' }}>
                        <polygon
                          points="0,-16 2,-11 7,-14 4,-8 11,-5 5,-2 8,2 3,3 4,9 0,5 -4,9 -3,3 -8,2 -5,-2 -11,-5 -4,-8 -7,-14 -2,-11"
                          fill={starGrad}
                          opacity="0.6"
                        />
                      </g>

                      {/* Colony Ownership Ring Badge */}
                      {dominantColonyOwner && (
                        <circle
                          r="15"
                          fill="none"
                          stroke={dominantColonyOwner.color}
                          strokeWidth="2"
                          strokeDasharray="6,2"
                        />
                      )}

                      {/* Radiant Star Core Sphere */}
                      <circle
                        r={isSelected ? 11 : 9}
                        fill={isKnown ? starGrad : '#475569'}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        className="transition-transform duration-200 group-hover:scale-125"
                      />
                    </g>
                  )}

                  {/* POI or Debris Field Indicator */}
                  {isKnown && sys.poi && !sys.poi.explored && (
                    <g transform="translate(16, -16)">
                      <circle r="8" fill="#f59e0b" className="animate-pulse" />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#030712"
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        ★
                      </text>
                    </g>
                  )}

                  {isKnown &&
                    sys.hasDebris &&
                    (sys.hasDebris.ore > 0 || sys.hasDebris.crystal > 0) && (
                      <g transform="translate(-16, -16)">
                        <circle r="8" fill="#f43f5e" className="animate-pulse" />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          ⚙
                        </text>
                      </g>
                    )}

                  {/* System Tactical Name Badge */}
                  <g transform="translate(0, 26)" className="pointer-events-none">
                    <rect
                      x="-50"
                      y="-10"
                      width="100"
                      height="20"
                      rx="4"
                      fill="#070d1d"
                      fillOpacity="0.88"
                      stroke={isSelected ? '#00f3ff' : '#1e293b'}
                      strokeWidth="0.9"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isKnown ? '#f8fafc' : '#94a3b8'}
                      fontSize="10"
                      fontWeight={isRelay ? 'bold' : '600'}
                      fontFamily="sans-serif"
                    >
                      {isKnown ? sys.name : '??? Bilinmeyen'}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Zoom Controls HUD (Top-Left) */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        <div className="flex items-center gap-1 bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-lg shadow-black/50">
          <button
            onClick={() => {
              sound.playClick();
              setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyber-cyan transition-colors"
            title="Yakınlaştır (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)));
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyber-cyan transition-colors"
            title="Uzaklaştır (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setZoom(1);
            }}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              zoom === 1 ? 'text-slate-400' : 'text-cyber-cyan font-bold bg-cyber-cyan/10'
            }`}
            title="Ölçeği Sıfırla (1x)"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>

        {/* Selected System Orbit Inspection Quick Button */}
        {selectedTarget?.systemId && onInspectSystem && (
          <button
            onClick={() => {
              sound.playClick();
              onInspectSystem(selectedTarget.systemId);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/50 text-cyber-cyan rounded-lg text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950/60"
            title="Seçili Sistemin Yörünge ve Gezegenlerini İncele"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Yörüngeyi İncele</span>
          </button>
        )}
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-4 bg-space-900/85 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 flex items-center gap-4 text-[11px] text-slate-300 pointer-events-none shadow-lg shadow-black/40">
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
