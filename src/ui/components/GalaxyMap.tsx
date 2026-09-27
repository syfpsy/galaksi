import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Eye,
  Flag,
  Globe,
  Maximize2,
  Minus,
  Navigation,
  Orbit,
  Plus,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { getFleetCurrentPosition } from '../../engine/flight';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { calculatePlanetOrbit, PlanetOrbitState } from '../../engine/orbital';
import { Fleet, GameState, IntelLevel, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';
import { GalaxyScene25D } from './GalaxyScene25D';

interface GalaxyMapProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  godMode: boolean;
  onSelectSystem: (systemId: string) => void;
  onSelectFleet: (fleetId: string) => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onInspectSystem?: (systemId: string) => void;
}

// Deterministic background starfield
const BACKGROUND_STARS = Array.from({ length: 90 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const x = (seed % 960) + 20;
  const y = ((seed * 7) % 760) + 20;
  const r = 0.6 + ((seed % 100) / 100) * 1.5;
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
  onSelectPlanet,
  onInspectSystem,
}) => {
  // View mode: 'galaxy' (Macro Sector / Cluster) or 'system' (2D Stellaris-Style In-System Orrery)
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>('galaxy');
  const [renderEngine, setRenderEngine] = useState<'webgl_25d' | 'vector_2d'>('webgl_25d');
  const [focusedSystemId, setFocusedSystemId] = useState<string>('sys_relay');
  const [showProjections, setShowProjections] = useState<boolean>(true);
  const [hoveredPlanetSlotId, setHoveredPlanetSlotId] = useState<string | null>(null);

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

  // Current focused system for system view
  const activeSystem = useMemo(() => {
    return state.map.systems[focusedSystemId] || systems[0];
  }, [state.map.systems, focusedSystemId, systems]);

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

  // Moving fleets with positions
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

        const isVisible =
          godMode ||
          isOwn ||
          sensorCoverage.has(f.originSystemId) ||
          sensorCoverage.has(f.targetSystemId);

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

  // Connected hyperlanes for focused system in system view
  const connectedLanes = useMemo(() => {
    return state.map.lanes.filter(
      (l) => l.fromSystemId === activeSystem.id || l.toSystemId === activeSystem.id
    );
  }, [state.map.lanes, activeSystem.id]);

  // Real-time planetary orbits for focused system
  const systemPlanetOrbits = useMemo(() => {
    return activeSystem.slots.map((slot) => {
      const orbit = calculatePlanetOrbit(
        activeSystem.id,
        slot.slotIndex,
        slot.planetId,
        state.timeMs
      );
      const planetObj = state.planets[slot.planetId];
      const owner = planetObj ? state.players[planetObj.ownerId] : null;
      return {
        slot,
        orbit,
        planetObj,
        owner,
      };
    });
  }, [activeSystem, state.timeMs, state.planets, state.players]);

  // Handle switching into system view
  const enterSystemView = (systemId: string) => {
    sound.playWarp();
    setFocusedSystemId(systemId);
    setViewMode('system');
    setZoom(1);
    onSelectSystem(systemId);
  };

  // Handle cycling between systems in system view
  const cycleSystem = (direction: 'next' | 'prev') => {
    sound.playClick();
    const currentIndex = systems.findIndex((s) => s.id === focusedSystemId);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= systems.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = systems.length - 1;
    const nextSys = systems[nextIndex];
    setFocusedSystemId(nextSys.id);
    onSelectSystem(nextSys.id);
  };

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden flex items-center justify-center select-none">
      {/* Dynamic 2D Cosmic Dust & Tactical HUD Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1c2b53_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

      {/* Atmospheric Cosmic Color Wash Behind Map */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-cyan-950/20 blur-[130px] pointer-events-none" />
      <div className="absolute w-[550px] h-[550px] rounded-full bg-purple-950/25 blur-[110px] pointer-events-none" />

      {/* 2.5D WebGL Three.js Scene Engine */}
      {renderEngine === 'webgl_25d' ? (
        <div className="absolute inset-0 z-0">
          <GalaxyScene25D
            state={state}
            activePlayerId={activePlayerId}
            selectedTarget={selectedTarget}
            godMode={godMode}
            focusedSystemId={focusedSystemId}
            viewMode={viewMode}
            showProjections={showProjections}
            zoom={zoom}
            onZoomChange={setZoom}
            sensorCoverage={sensorCoverage}
            onSelectSystem={(sysId) => {
              setFocusedSystemId(sysId);
              onSelectSystem(sysId);
            }}
            onEnterSystemView={enterSystemView}
            onExitSystemView={() => {
              sound.playClick();
              setViewMode('galaxy');
            }}
            onSelectPlanet={onSelectPlanet}
            onSelectFleet={onSelectFleet}
            onHoverPlanet={setHoveredPlanetSlotId}
          />
        </div>
      ) : (
        /* SVG Canvas for Galaxy / System View */
        <svg
          viewBox="0 0 1000 800"
          className="w-full h-full max-w-[1300px] max-h-[950px] object-contain cursor-crosshair"
          onDoubleClick={(e) => {
            if (viewMode === 'system') {
              sound.playClick();
              setViewMode('galaxy');
            }
          }}
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

          <filter id="glow-atmo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
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
            <feGaussianBlur stdDeviation="12" result="blur" />
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
          <radialGradient id="star-sol" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fffbeb" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="star-rigel" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#a5f3fc" />
            <stop offset="65%" stopColor="#06b6d4" />
            <stop offset="85%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="star-proxima" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fecdd3" />
            <stop offset="55%" stopColor="#f43f5e" />
            <stop offset="85%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#4c0519" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="star-nexus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#f3e8ff" />
            <stop offset="60%" stopColor="#c084fc" />
            <stop offset="85%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" stopOpacity="0.6" />
          </radialGradient>

          {/* Planetary Biome Spherical Shaders */}
          <radialGradient id="planet-shading-terran" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="70%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </radialGradient>

          <radialGradient id="planet-shading-ocean" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="75%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          <radialGradient id="planet-shading-desert" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="40%" stopColor="#d97706" />
            <stop offset="80%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>

          <radialGradient id="planet-shading-ice" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#bae6fd" />
            <stop offset="75%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          <radialGradient id="planet-shading-volcanic" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="35%" stopColor="#dc2626" />
            <stop offset="75%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
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

        {/* ========================================================================= */}
        {/* TIER 2: MACRO GALAXY CLUSTER VIEW                                         */}
        {/* ========================================================================= */}
        {viewMode === 'galaxy' && (
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

            {/* Macro Galactic Spiral Arms & Celestial Disk (Slow Cosmic Rotation) */}
            <g
              className="animate-galaxy-spin pointer-events-none opacity-25"
              style={{ transformOrigin: '500px 400px' }}
            >
              {/* Spiral Arm A */}
              <path
                d="M 500,400 Q 650,220 850,260 T 940,520"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="45"
                filter="blur(35px)"
                opacity="0.3"
              />
              {/* Spiral Arm B */}
              <path
                d="M 500,400 Q 350,580 150,540 T 60,280"
                fill="none"
                stroke="#c084fc"
                strokeWidth="45"
                filter="blur(35px)"
                opacity="0.3"
              />
            </g>

            {/* Sector Constellation Boundaries & Macro Structure */}
            <g className="sector-boundaries pointer-events-none opacity-20">
              {/* Core Sector */}
              <circle cx="500" cy="400" r="140" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="6,8" />
              <text x="500" y="275" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="monospace" letterSpacing="2">
                NEXUS ÇEKİRDEK SEKTÖRÜ
              </text>

              {/* Inner Constellation Ring */}
              <circle cx="500" cy="400" r="265" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="8,10" />
              <text x="500" y="150" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" letterSpacing="2">
                İÇ YILDIZ KUŞAĞI
              </text>

              {/* Outer Frontier Rim */}
              <circle cx="500" cy="400" r="410" fill="none" stroke="#64748b" strokeWidth="0.6" strokeDasharray="10,14" />
              <text x="500" y="30" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" letterSpacing="3">
                DIŞ FRONTIER SINIRI
              </text>
            </g>

            {/* Layer 1: Ambient Dynamic Nebula Clouds */}
            <g className="nebulae pointer-events-none animate-nebula-drift">
              <path
                d="M 120,80 Q 280,20 380,140 T 260,320 T 90,220 Z"
                fill="url(#nebula-cyan-grad)"
                filter="blur(30px)"
              />
              <path
                d="M 420,320 Q 620,260 680,440 T 480,560 T 360,420 Z"
                fill="url(#nebula-violet-grad)"
                filter="blur(40px)"
              />
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
                <circle r="90" fill="none" stroke="#00f3ff" strokeWidth="0.8" strokeDasharray="3,6" opacity="0.2" />
                <circle r="180" fill="none" stroke="#00f3ff" strokeWidth="0.6" strokeDasharray="4,8" opacity="0.12" />
                <circle r="270" fill="none" stroke="#00f3ff" strokeWidth="0.5" strokeDasharray="6,12" opacity="0.08" />

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
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={isSelected ? '#00f3ff' : isKnown ? '#1c2b53' : '#0a101f'}
                      strokeWidth={isSelected ? 2.5 : hasActiveFleet ? 2 : 1.5}
                      opacity={isKnown ? 0.75 : 0.3}
                    />

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

                    <g transform={`rotate(${angle})`}>
                      <polygon
                        points="-10,0 -38,-5 -34,0 -38,5"
                        fill={isOwn ? 'url(#thruster-trail-cyan)' : 'url(#thruster-trail-rose)'}
                        className="animate-exhaust"
                      />

                      {dominantClass === 'battleship' ? (
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
                        <g filter="url(#glow-fleet)">
                          <polygon
                            points="14,0 -6,-8 -4,-3 -10,-1 -10,1 -4,3 -6,8"
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                        </g>
                      ) : dominantClass === 'transport' ? (
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
                    onDoubleClick={() => {
                      enterSystemView(sys.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Territorial Influence Aura */}
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

                        <g className="animate-spin-medium" style={{ transformOrigin: '0px 0px' }}>
                          <circle cx="18" cy="0" r="1.8" fill="#38bdf8" />
                        </g>

                        <g className="animate-spin-slow" style={{ transformOrigin: '0px 0px' }}>
                          <circle cx="-26" cy="0" r="2.2" fill="#fbbf24" />
                        </g>
                      </g>
                    )}

                    {/* Selection Reticle Brackets */}
                    {isSelected && (
                      <g className="text-cyber-cyan animate-tactical-bracket">
                        <circle r="36" fill="none" stroke="#00f3ff" strokeWidth="1" strokeDasharray="8,4" opacity="0.8" />
                        <path d="M -30,-40 L -40,-40 L -40,-30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                        <path d="M 30,-40 L 40,-40 L 40,-30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                        <path d="M -30,40 L -40,40 L -40,30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                        <path d="M 30,40 L 40,40 L 40,30" fill="none" stroke="#00f3ff" strokeWidth="2" />
                      </g>
                    )}

                    {/* Central Nexus Relay Megastructure */}
                    {isRelay ? (
                      <g filter="url(#glow-relay)">
                        <circle
                          r="32"
                          fill="none"
                          stroke={relayController ? relayController.color : '#a855f7'}
                          strokeWidth="1.5"
                          className="animate-ping"
                          opacity="0.45"
                        />

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

                        <g className="animate-spin-reverse" style={{ transformOrigin: '0px 0px' }}>
                          <circle
                            r="18"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.2"
                            strokeDasharray="6,4"
                          />
                        </g>

                        <circle r="12" fill="url(#star-nexus)" stroke="#ffffff" strokeWidth="1" />
                        <polygon
                          points="0,-7 5,-2 3,5 -3,5 -5,-2"
                          fill="#ffffff"
                          opacity="0.9"
                        />
                      </g>
                    ) : (
                      /* Standard Dynamic 2D Star */
                      <g>
                        <circle
                          r={isSelected ? 22 : 18}
                          fill={starGrad}
                          opacity="0.4"
                          className="animate-corona-pulse"
                        />

                        <g className="animate-flare-pulse" style={{ transformOrigin: '0px 0px' }}>
                          <polygon
                            points="0,-16 2,-11 7,-14 4,-8 11,-5 5,-2 8,2 3,3 4,9 0,5 -4,9 -3,3 -8,2 -5,-2 -11,-5 -4,-8 -7,-14 -2,-11"
                            fill={starGrad}
                            opacity="0.6"
                          />
                        </g>

                        {dominantColonyOwner && (
                          <circle
                            r="15"
                            fill="none"
                            stroke={dominantColonyOwner.color}
                            strokeWidth="2"
                            strokeDasharray="6,2"
                          />
                        )}

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
        )}

        {/* ========================================================================= */}
        {/* TIER 1: STELLARIS-STYLE IN-SYSTEM 2D ORRERY VIEW                          */}
        {/* ========================================================================= */}
        {viewMode === 'system' && (
          <g
            transform={`scale(${zoom})`}
            style={{
              transformOrigin: '500px 400px',
              transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {/* Background System Space Ambience */}
            <g className="system-starfield pointer-events-none">
              {BACKGROUND_STARS.map((s, idx) => (
                <circle
                  key={`sys_star_${idx}`}
                  cx={s.x}
                  cy={s.y}
                  r={s.r * 1.2}
                  fill="#ffffff"
                  opacity={s.opacity * 0.7}
                />
              ))}
            </g>

            {/* Hyperlane Warp Boundary Buoys (At Perimeter 420px) */}
            <g className="hyperlane-buoys">
              {connectedLanes.map((lane) => {
                const otherSysId =
                  lane.fromSystemId === activeSystem.id ? lane.toSystemId : lane.fromSystemId;
                const otherSys = state.map.systems[otherSysId];
                if (!otherSys) return null;

                const angle = Math.atan2(otherSys.y - activeSystem.y, otherSys.x - activeSystem.x);
                const buoyDist = 410;
                const bx = 500 + Math.cos(angle) * buoyDist;
                const by = 400 + Math.sin(angle) * buoyDist * 0.85;

                return (
                  <g
                    key={lane.id}
                    transform={`translate(${bx}, ${by})`}
                    onClick={() => {
                      sound.playClick();
                      enterSystemView(otherSys.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Direction arrow line pointing out */}
                    <line
                      x1="0"
                      y1="0"
                      x2={Math.cos(angle) * 35}
                      y2={Math.sin(angle) * 35}
                      stroke="#00f3ff"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      className="animate-hyperlane-flow"
                    />

                    {/* Buoy Ring */}
                    <circle r="14" fill="#070d1d" stroke="#00f3ff" strokeWidth="1.5" />
                    <circle r="7" fill="#00f3ff" opacity="0.6" className="animate-ping" />
                    <Navigation
                      className="w-3.5 h-3.5 text-cyber-cyan absolute -translate-x-1.5 -translate-y-1.5"
                    />

                    {/* Buoy Label */}
                    <g transform="translate(0, 22)" className="pointer-events-none">
                      <rect
                        x="-45"
                        y="-8"
                        width="90"
                        height="16"
                        rx="3"
                        fill="#030712"
                        stroke="#00f3ff"
                        strokeWidth="0.8"
                        opacity="0.9"
                      />
                      <text x="0" y="3.5" textAnchor="middle" fill="#f1f5f9" fontSize="8.5" fontFamily="monospace">
                        ➔ {otherSys.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Central Radiant Sun at (500, 400) */}
            <g
              transform="translate(500, 400)"
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onSelectSystem(activeSystem.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onSelectSystem(activeSystem.id);
              }}
            >
              {activeSystem.hasRelay ? (
                /* Nexus Singularity Core */
                <g filter="url(#glow-relay)">
                  <circle r="60" fill="url(#star-nexus)" opacity="0.4" className="animate-corona-pulse" />
                  <circle r="45" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="16,8" className="animate-spin-slow" />
                  <circle r="32" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,6" className="animate-spin-reverse" />
                  <circle r="24" fill="url(#star-nexus)" stroke="#ffffff" strokeWidth="2" />
                </g>
              ) : (
                /* Radiant Star */
                <g filter="url(#glow-star-flare)">
                  {/* Outer Pulsing Corona */}
                  <circle r="65" fill="url(#star-sol)" opacity="0.3" className="animate-corona-pulse" />
                  {/* Solar Flare Prominence Rays */}
                  <g className="animate-flare-pulse" style={{ transformOrigin: '0px 0px' }}>
                    <polygon
                      points="0,-60 10,-45 28,-55 18,-35 48,-24 24,-12 36,10 16,14 20,44 0,26 -20,44 -16,14 -36,10 -24,-12 -48,-24 -18,-35 -28,-55 -10,-45"
                      fill="url(#star-sol)"
                      opacity="0.5"
                    />
                  </g>
                  {/* Core Star Sphere */}
                  <circle r="36" fill="url(#star-sol)" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}

              {/* Star Name Label */}
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                {activeSystem.hasRelay ? 'NEXUS ÇEKİRDEĞİ' : `${activeSystem.name} YILDIZI`}
              </text>
            </g>

            {/* Real Keplerian Planetary Orbits & Projections */}
            <g className="planetary-orbits">
              {systemPlanetOrbits.map(({ slot, orbit, planetObj, owner }) => {
                const isHovered = hoveredPlanetSlotId === slot.planetId;
                const isSelected = selectedTarget?.planetId === slot.planetId;

                const gradId =
                  slot.type === 'terran'
                    ? 'url(#planet-shading-terran)'
                    : slot.type === 'ocean'
                    ? 'url(#planet-shading-ocean)'
                    : slot.type === 'desert'
                    ? 'url(#planet-shading-desert)'
                    : slot.type === 'ice'
                    ? 'url(#planet-shading-ice)'
                    : 'url(#planet-shading-volcanic)';

                const planetRadius = 14 + (slot.size % 6);

                // Planet position on canvas
                const px = 500 + orbit.x;
                const py = 400 + orbit.y;

                return (
                  <g key={slot.planetId}>
                    {/* 1. Full Orbital Trajectory Ellipse */}
                    <ellipse
                      cx="500"
                      cy="400"
                      rx={orbit.orbitalRadius}
                      ry={orbit.orbitalRadius * 0.85}
                      fill="none"
                      stroke={isSelected ? '#00f3ff' : isHovered ? '#38bdf8' : '#334155'}
                      strokeWidth={isSelected ? 1.8 : isHovered ? 1.5 : 1}
                      strokeDasharray={isSelected ? '6,4' : '4,8'}
                      opacity={isSelected ? 0.9 : isHovered ? 0.75 : 0.4}
                    />

                    {/* Degree Guide Marks along orbit (0°, 90°, 180°, 270°) */}
                    <text
                      x={500 + orbit.orbitalRadius + 8}
                      y="403"
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      opacity="0.6"
                    >
                      0°
                    </text>
                    <text
                      x="500"
                      y={400 - orbit.orbitalRadius * 0.85 - 6}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      opacity="0.6"
                    >
                      90°
                    </text>
                    <text
                      x={500 - orbit.orbitalRadius - 16}
                      y="403"
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      opacity="0.6"
                    >
                      180°
                    </text>

                    {/* 2. Future Forecast Projections ("bunun projeksiyonunu görebiliyoruz") */}
                    {showProjections && (
                      <g className="projections opacity-75">
                        {/* Forecast trajectory arc connecting current position to +12h position */}
                        <path
                          d={`M ${px},${py} Q ${
                            500 + (orbit.x + orbit.projections[1].x) / 2
                          },${
                            400 + (orbit.y + orbit.projections[1].y) / 2
                          } ${500 + orbit.projections[2].x},${
                            400 + orbit.projections[2].y
                          }`}
                          fill="none"
                          stroke="#00f3ff"
                          strokeWidth="1.2"
                          strokeDasharray="3,5"
                          opacity="0.6"
                        />

                        {/* Ghost Projection Points at +2h, +6h, +12h */}
                        {orbit.projections.map((p) => {
                          const fx = 500 + p.x;
                          const fy = 400 + p.y;
                          return (
                            <g key={p.hoursAhead} transform={`translate(${fx}, ${fy})`}>
                              <circle
                                r={planetRadius * 0.7}
                                fill="none"
                                stroke="#00f3ff"
                                strokeWidth="0.8"
                                strokeDasharray="2,3"
                                opacity="0.4"
                              />
                              <text
                                x="0"
                                y="-6"
                                textAnchor="middle"
                                fill="#00f3ff"
                                fontSize="7.5"
                                fontFamily="monospace"
                                opacity="0.8"
                              >
                                +{p.hoursAhead}s
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* 3. Physical Planet Body at Current Angle */}
                    <g
                      transform={`translate(${px}, ${py})`}
                      onMouseEnter={() => setHoveredPlanetSlotId(slot.planetId)}
                      onMouseLeave={() => setHoveredPlanetSlotId(null)}
                      onClick={() => {
                        sound.playClick();
                        if (onSelectPlanet) {
                          onSelectPlanet(activeSystem.id, slot.planetId);
                        } else {
                          onSelectSystem(activeSystem.id);
                        }
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Selection / Hover Glowing Reticle */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={planetRadius + 8}
                          fill="none"
                          stroke="#00f3ff"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          className="animate-spin-slow"
                          style={{ transformOrigin: 'center' }}
                        />
                      )}

                      {/* Planetary Rings (Desert Worlds) */}
                      {slot.type === 'desert' && (
                        <ellipse
                          rx={planetRadius * 1.85}
                          ry={planetRadius * 0.55}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          opacity="0.65"
                          transform="rotate(-20)"
                        />
                      )}

                      {/* Atmospheric Outer Glow Rim */}
                      <circle
                        r={planetRadius + 3}
                        fill="none"
                        stroke="#00f3ff"
                        strokeWidth="1.2"
                        opacity={isHovered ? 0.9 : 0.4}
                        filter="url(#glow-atmo)"
                      />

                      {/* 2D Spherical Planet Body */}
                      <circle
                        r={planetRadius}
                        fill={gradId}
                        stroke={owner ? owner.color : '#ffffff'}
                        strokeWidth={owner ? 2.5 : 1}
                        className="transition-transform duration-300 group-hover:scale-120"
                      />

                      {/* Terran Swirling Clouds */}
                      {slot.type === 'terran' && (
                        <g className="pointer-events-none opacity-60">
                          <path
                            d={`M ${-planetRadius * 0.8},-3 Q 0,-7 ${planetRadius * 0.8},-2`}
                            stroke="#ffffff"
                            strokeWidth="1.6"
                            fill="none"
                          />
                          <path
                            d={`M ${-planetRadius * 0.7},4 Q 0,1 ${planetRadius * 0.7},5`}
                            stroke="#ffffff"
                            strokeWidth="1.4"
                            fill="none"
                          />
                        </g>
                      )}

                      {/* Dynamic Day/Night Terminator Crescent Shadow */}
                      {/* Shadow points away from central sun (500, 400) */}
                      <path
                        d={`M 0,${-planetRadius} A ${planetRadius},${planetRadius} 0 0,1 0,${planetRadius} A ${
                          planetRadius * 0.5
                        },${planetRadius} 0 0,1 0,${-planetRadius}`}
                        fill="#030712"
                        opacity="0.45"
                        transform={`rotate(${(orbit.currentAngleDeg + 90) % 360})`}
                        className="pointer-events-none"
                      />

                      {/* Orbiting Moon */}
                      <g
                        className="animate-spin-slow pointer-events-none"
                        style={{ transformOrigin: 'center' }}
                      >
                        <circle cx={planetRadius + 10} cy="0" r="2.2" fill="#e2e8f0" />
                      </g>

                      {/* Orbiting Defense Satellite / Shipyard (If Colonized) */}
                      {owner && (
                        <g
                          className="animate-spin-medium pointer-events-none"
                          style={{ transformOrigin: 'center' }}
                        >
                          <rect
                            x={-planetRadius - 8}
                            y="-2"
                            width="4"
                            height="4"
                            fill={owner.color}
                          />
                        </g>
                      )}

                      {/* Planet Name & Ownership Tag */}
                      <g transform={`translate(0, ${planetRadius + 14})`} className="pointer-events-none">
                        <rect
                          x="-45"
                          y="-8"
                          width="90"
                          height="16"
                          rx="3"
                          fill="#030712"
                          stroke={owner ? owner.color : '#334155'}
                          strokeWidth="0.8"
                          opacity="0.9"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill={owner ? owner.color : '#f1f5f9'}
                          fontSize="9"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                        >
                          {slot.name}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        )}
      </svg>
      )}

      {/* ========================================================================= */}
      {/* FLOATING HUD CONTROLS & STELLARIS-STYLE VIEW SWITCHER                    */}
      {/* ========================================================================= */}

      {/* Top Left: Navigation & Mode Switch */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        {/* Engine Selector: 2.5D WebGL vs 2D Vector */}
        <div className="flex items-center gap-1 bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg shadow-black/50">
          <button
            onClick={() => {
              sound.playClick();
              setRenderEngine('webgl_25d');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              renderEngine === 'webgl_25d'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Three.js 2.5D WebGL Uzay Motoru (PBR Küreler, Işıklandırma, İzometrik Derinlik)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>2.5D WebGL</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setRenderEngine('vector_2d');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              renderEngine === 'vector_2d'
                ? 'bg-cyber-cyan text-space-950 shadow-md shadow-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2D Taktik Vektör HUD Haritası"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2D Vektör</span>
          </button>
        </div>

        {/* Stellaris Navigation Bar: Breadcrumb to Galaxy or Enter System */}
        {viewMode === 'system' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('galaxy');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-space-900/95 border border-cyber-cyan/60 text-cyber-cyan hover:bg-cyber-cyan hover:text-space-950 transition-all font-mono font-bold text-xs shadow-lg shadow-cyan-950/40 group"
              title="Galaksi Haritasına Dön (Esc veya M tuşu / Boşluğa Çift Tıkla)"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Galaksi Haritası</span>
            </button>

            {/* System View Carousel Selector */}
            <div className="flex items-center bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl">
              <button
                onClick={() => cycleSystem('prev')}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Önceki Sistem"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold font-display text-cyber-cyan px-2">
                {activeSystem.name}
              </span>

              <button
                onClick={() => cycleSystem('next')}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Sonraki Sistem"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl shadow-black/60">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('galaxy');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all bg-cyber-cyan text-space-950 shadow-sm shadow-cyan-400"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Galaksi Kümesi</span>
            </button>

            <button
              onClick={() => {
                sound.playWarp();
                enterSystemView(focusedSystemId);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:text-cyber-cyan"
              title={`${activeSystem.name} Sisteminin Yörünge Düzlemine Gir (Çift Tıklayarak da girebilirsiniz)`}
            >
              <Orbit className="w-3.5 h-3.5 text-cyber-cyan/70" />
              <span>{activeSystem.name} Sistemine Gir</span>
            </button>
          </div>
        )}

        {/* Zoom & Projection Toggles */}
        <div className="flex items-center gap-1 bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg">
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

          {/* Projection Toggle (In System View) */}
          {viewMode === 'system' && (
            <button
              onClick={() => {
                sound.playClick();
                setShowProjections(!showProjections);
              }}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                showProjections
                  ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/15'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Yörünge Gelecek Projeksiyonunu Aç/Kapat"
            >
              Projeksiyon
            </button>
          )}
        </div>
      </div>

      {/* Top Right: In-System Planetary Telemetry HUD Card (When Hovering or Selected) */}
      {viewMode === 'system' && (hoveredPlanetSlotId || (selectedTarget?.type === 'planet' && selectedTarget.systemId === activeSystem.id)) && (
        <div className="absolute top-4 right-4 w-80 bg-space-900/95 backdrop-blur-md border border-cyber-cyan/40 rounded-xl p-3 shadow-2xl z-20 font-mono text-xs animate-in fade-in duration-150">
          {(() => {
            const targetId = hoveredPlanetSlotId || (selectedTarget?.type === 'planet' ? selectedTarget.planetId : null);
            const item = systemPlanetOrbits.find((p) => p.slot.planetId === targetId);
            if (!item) return null;
            const { slot, orbit, planetObj, owner } = item;
            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: owner?.color || '#38bdf8' }} />
                    <span className="font-bold text-slate-100 font-display text-sm">
                      {slot.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyber-cyan uppercase px-1.5 py-0.2 bg-cyber-cyan/10 rounded border border-cyber-cyan/30">
                    {slot.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Mevcut Yörünge Açısı</span>
                    <span className="font-bold text-amber-400">{orbit.currentAngleDeg}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Yörünge Periyodu</span>
                    <span className="text-slate-200">
                      {(orbit.orbitalPeriodMs / (3600 * 1000)).toFixed(0)} Saat
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Açısal Hız</span>
                    <span className="text-cyber-cyan">{orbit.speedDegPerHour}° / saat</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Yıldız Mesafesi</span>
                    <span className="text-slate-200">{orbit.auDistance} AU</span>
                  </div>
                </div>

                {/* 2h, 6h, 12h Orbital Forecast Table */}
                <div className="pt-1.5 border-t border-slate-800/80">
                  <span className="text-[9.5px] text-slate-400 block mb-1">🔭 Gelecek Yörünge Projeksiyonları</span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                    {orbit.projections.map((p) => (
                      <div key={`proj_${p.hoursAhead}`} className="bg-space-950/70 border border-slate-800/80 rounded py-1 px-0.5">
                        <span className="text-slate-500 block text-[9px]">+{p.hoursAhead}s</span>
                        <span className="text-cyber-cyan font-bold">{p.angleDeg}°</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Hakimiyet:</span>
                  <span style={{ color: owner?.color || '#10b981' }} className="font-bold">
                    {owner ? owner.name : 'Boş / Koloniye Uygun'}
                  </span>
                </div>

                {/* 1-Click Contextual Mission Action Button */}
                {!owner ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (onSelectPlanet) {
                        onSelectPlanet(activeSystem.id, slot.planetId);
                      }
                    }}
                    className="w-full mt-2 py-1.5 px-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50"
                  >
                    <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🏛️ Koloni Seferi Düzenle</span>
                  </button>
                ) : owner.id !== activePlayerId ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (onSelectPlanet) {
                        onSelectPlanet(activeSystem.id, slot.planetId);
                      }
                    }}
                    className="w-full mt-2 py-1.5 px-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 hover:border-rose-400 text-rose-300 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50"
                  >
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>⚔️ Taarruz / Baskın Düzenle</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (onSelectPlanet) {
                        onSelectPlanet(activeSystem.id, slot.planetId);
                      }
                    }}
                    className="w-full mt-2 py-1.5 px-2 bg-cyber-cyan/15 hover:bg-cyber-cyan/30 border border-cyber-cyan/50 text-cyber-cyan font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>📦 İkmal / Transfer Seferi</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bottom Center: Stellaris-Style Mode Bar */}
      <div className="absolute bottom-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 shadow-2xl">
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('galaxy');
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              viewMode === 'galaxy'
                ? 'bg-cyber-cyan text-space-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌌 Galaksi Haritası (12 Sistem)
          </button>

          <span className="text-slate-600">•</span>

          <button
            onClick={() => {
              enterSystemView(focusedSystemId);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              viewMode === 'system'
                ? 'bg-cyber-cyan text-space-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🪐 {activeSystem.name} Yörünge Sistemi
          </button>
        </div>
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
