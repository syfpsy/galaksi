import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdmiralBot } from './bots/admiral';
import { ExplorerBot } from './bots/explorer';
import { GuardianBot } from './bots/guardian';
import { IndustrialistBot } from './bots/industrialist';
import { RaiderBot } from './bots/raider';
import { IBotAgent } from './bots/types';
import { GameEngine } from './engine/engine';
import {
  BuildingType,
  Fleet,
  MissionType,
  PlanetStance,
  ResearchType,
  Resources,
  ShipType,
} from './engine/types';
import { AllianceModal } from './ui/components/AllianceModal';
import { AnomalyEventModal } from './ui/components/AnomalyEventModal';
import { ArtGalleryModal } from './ui/components/ArtGalleryModal';
import { CombatReplayModal } from './ui/components/CombatReplayModal';
import { CommandPanel } from './ui/components/CommandPanel';
import { EventFeed } from './ui/components/EventFeed';
import { FleetCardHUD } from './ui/components/FleetCardHUD';
import { GalaxyMap } from './ui/components/GalaxyMap';
import { IncomingThreatBanner } from './ui/components/IncomingThreatBanner';
import { PlanetPanel } from './ui/components/PlanetPanel';
import { RelayModal } from './ui/components/RelayModal';
import { ResearchModal } from './ui/components/ResearchModal';
import { ShipyardModal } from './ui/components/ShipyardModal';
import { FleetTransitRadarModal } from './ui/components/FleetTransitRadarModal';
import { SystemInspectionModal } from './ui/components/SystemInspectionModal';
import { AdmiralsModal } from './ui/components/AdmiralsModal';
import { TopBar } from './ui/components/TopBar';
import { StellarisLeftRail } from './ui/components/StellarisLeftRail';
import { StellarisNotificationStrip } from './ui/components/StellarisNotificationStrip';
import { StellarisOutliner } from './ui/components/StellarisOutliner';
import { SituationLogModal } from './ui/components/SituationLogModal';
import { OrientationGuideModal } from './ui/components/OrientationGuideModal';
import { SelectedTarget } from './ui/types';
import { sound } from './ui/sound';

type LeftPanelType =
  | 'planets'
  | 'shipyard'
  | 'research'
  | 'transit_radar'
  | 'situation'
  | 'battles'
  | 'admirals'
  | 'alliance'
  | 'relay'
  | 'gallery'
  | null;

function createInitialGame(seed: number = 42) {
  const engine = new GameEngine(seed);
  const bots: IBotAgent[] = [];

  // Human player
  const { homeworld: humanHw } = engine.addPlayer('player_human', 'Komutan Shepard', '#00f3ff');

  // Archetype bots
  engine.addPlayer('bot_ind', 'Aethel Sanayi Konsorsiyumu', '#10b981', true, 'industrialist');
  bots.push(new IndustrialistBot('bot_ind'));

  engine.addPlayer('bot_raid', 'Kızıl Akın Filosu', '#f43f5e', true, 'raider');
  bots.push(new RaiderBot('bot_raid'));

  engine.addPlayer('bot_guard', 'Nexus Muhafızları', '#3b82f6', true, 'guardian');
  bots.push(new GuardianBot('bot_guard'));

  engine.addPlayer('bot_exp', 'Yıldız Kâşifleri Cemiyeti', '#ffaa00', true, 'explorer');
  bots.push(new ExplorerBot('bot_exp'));

  engine.addPlayer('bot_adm', 'Amiral Valerius Filosu', '#a855f7', true, 'admiral');
  bots.push(new AdmiralBot('bot_adm'));

  return { engine, bots, humanHw };
}

export function App() {
  const [initialData] = useState(() => createInitialGame(42));

  // Engine Instance reference
  const engineRef = useRef<GameEngine>(initialData.engine);
  const botsRef = useRef<IBotAgent[]>(initialData.bots);
  const lastBotUpdateMsRef = useRef<number>(0);

  // Engine state mirror for React rendering (immediately initialized)
  const [engineState, setEngineState] = useState<GameEngine['state']>(initialData.engine.state);

  // Active user selection state (immediately initialized to homeworld)
  const [activePlayerId, setActivePlayerId] = useState<string>('player_human');
  const [activePlanetId, setActivePlanetId] = useState<string>(initialData.humanHw.id);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>({
    type: 'system',
    systemId: initialData.humanHw.systemId,
  });

  // Simulation controls (default 1x for real-time slow persistent pace, up to 300x)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [godMode, setGodMode] = useState<boolean>(false);

  // Drawers & Stellaris Layout
  const [activeLeftPanel, setActiveLeftPanel] = useState<LeftPanelType>(null);
  const [isCommandPanelOpen, setIsCommandPanelOpen] = useState<boolean>(false);
  const [isOutlinerCollapsed, setIsOutlinerCollapsed] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(sound.isMuted);

  // Auxiliary inspection / anomaly dialogs & orientation
  const [inspectedSystemId, setInspectedSystemId] = useState<string | null>(null);
  const [anomalyModalSystemId, setAnomalyModalSystemId] = useState<string | null>(null);
  const [isOrientationOpen, setIsOrientationOpen] = useState<boolean>(() => {
    return !localStorage.getItem('galaksi_orientation_seen');
  });

  const activePlanetIdRef = useRef(activePlanetId);
  activePlanetIdRef.current = activePlanetId;

  const activePlayerIdRef = useRef(activePlayerId);
  activePlayerIdRef.current = activePlayerId;

  // Tactical Quick-Focus Handlers (Homeworld, Nexus Relay, Player Colonies)
  const handleFocusHomeworld = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const planets = Object.values(engine.state.planets).filter(
      (p) => p.ownerId === activePlayerIdRef.current
    );
    const hw = planets.find((p) => p.isHomeworld) || planets[0];
    if (hw) {
      sound.playClick();
      setActivePlanetId(hw.id);
      setSelectedTarget({ type: 'planet', systemId: hw.systemId, planetId: hw.id });
    }
  }, []);

  const handleFocusRelay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    sound.playClick();
    setSelectedTarget({ type: 'system', systemId: engine.state.relay.systemId });
  }, []);

  const handleCycleColonies = useCallback((direction: 'next' | 'prev' = 'next') => {
    const engine = engineRef.current;
    if (!engine) return;
    const planets = Object.values(engine.state.planets).filter(
      (p) => p.ownerId === activePlayerIdRef.current
    );
    if (planets.length === 0) return;
    sound.playClick();
    const curIdx = planets.findIndex((p) => p.id === activePlanetIdRef.current);
    const nextIdx = direction === 'next'
      ? (curIdx + 1) % planets.length
      : (curIdx - 1 + planets.length) % planets.length;
    const nextPlanet = planets[nextIdx];
    setActivePlanetId(nextPlanet.id);
    setSelectedTarget({ type: 'planet', systemId: nextPlanet.systemId, planetId: nextPlanet.id });
  }, []);

  // Hotkeys for Stellaris navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        sound.playClick();
        setIsPlaying((prev) => !prev);
      } else if (e.key === '1') {
        sound.playClick();
        setTimeScale(1);
      } else if (e.key === '2') {
        sound.playClick();
        setTimeScale(5);
      } else if (e.key === '3') {
        sound.playClick();
        setTimeScale(20);
      } else if (e.key === '4') {
        sound.playClick();
        setTimeScale(60);
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'Home') {
        e.preventDefault();
        handleFocusHomeworld();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleFocusRelay();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleCycleColonies(e.shiftKey ? 'prev' : 'next');
      } else if (e.key === 'F1') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'planets' ? null : 'planets'));
      } else if (e.key === 'F2') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'shipyard' ? null : 'shipyard'));
      } else if (e.key === 'F3') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'research' ? null : 'research'));
      } else if (e.key === 'F4') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'));
      } else if (e.key === 'F5') {
        e.preventDefault();
        sound.playClick();
        setIsCommandPanelOpen((prev) => !prev);
      } else if (e.key === 'F6') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'situation' ? null : 'situation'));
      } else if (e.key === 'F7') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'));
      } else if (e.key === 'F8') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'));
      } else if (e.key === 'F9') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'));
      } else if (e.key === 'F10') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'gallery' ? null : 'gallery'));
      } else if (e.key === 'Escape') {
        if (isOrientationOpen) {
          setIsOrientationOpen(false);
        } else if (activeLeftPanel) {
          setActiveLeftPanel(null);
        } else if (isCommandPanelOpen) {
          setIsCommandPanelOpen(false);
        } else if (inspectedSystemId) {
          setInspectedSystemId(null);
        } else if (anomalyModalSystemId) {
          setAnomalyModalSystemId(null);
        } else {
          setSelectedTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeLeftPanel,
    isCommandPanelOpen,
    isOrientationOpen,
    inspectedSystemId,
    anomalyModalSystemId,
    handleFocusHomeworld,
    handleFocusRelay,
    handleCycleColonies,
  ]);

  // Re-initialize engine & players on reset
  const initGame = useCallback((seed: number = 42) => {
    const { engine, bots, humanHw } = createInitialGame(seed);
    engineRef.current = engine;
    botsRef.current = bots;
    lastBotUpdateMsRef.current = 0;

    setActivePlanetId(humanHw.id);
    setSelectedTarget({ type: 'system', systemId: humanHw.systemId });
    setEngineState({ ...engine.state });
  }, []);

  const lastThreatsCountRef = useRef(0);

  // Main simulation tick loop
  useEffect(() => {
    if (!isPlaying) return;

    const realIntervalMs = 50; // 20 ticks per second
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const curPlayerId = activePlayerIdRef.current;
      const prevBattleCount = engine.state.battleReports.length;
      const prevResearchQ = engine.state.players[curPlayerId]?.researchQueue;
      const prevColoniesCount = Object.values(engine.state.planets).filter(
        (p) => p.ownerId === curPlayerId
      ).length;
      const prevBldgsInQueue = Object.values(engine.state.planets).filter(
        (p) => p.ownerId === curPlayerId && p.buildingQueue
      ).length;

      const simDeltaMs = realIntervalMs * timeScale;
      engine.tick(simDeltaMs);

      // 1. Battle Explosion SFX
      if (engine.state.battleReports.length > prevBattleCount) {
        sound.playExplosion();
      }

      // 2. Tech Breakthrough Resonant Chord SFX
      const curPlayer = engine.state.players[curPlayerId];
      if (prevResearchQ && !curPlayer?.researchQueue) {
        sound.playTech();
      }

      // 3. New Colony Established Chime SFX
      const curColoniesCount = Object.values(engine.state.planets).filter(
        (p) => p.ownerId === curPlayerId
      ).length;
      if (curColoniesCount > prevColoniesCount) {
        sound.playColonize();
      }

      // 4. Construction Upgrade Finished SFX
      const curBldgsInQueue = Object.values(engine.state.planets).filter(
        (p) => p.ownerId === curPlayerId && p.buildingQueue
      ).length;
      if (prevBldgsInQueue > curBldgsInQueue && !curPlayer?.vacationMode) {
        sound.playConstruction();
      }

      // 5. Incoming Threat Tactical Red Alert Alarm SFX
      const curThreatsCount = Object.values(engine.state.fleets).filter((f) => {
        if (f.ownerId === curPlayerId || f.status === 'destroyed') return false;
        if (f.targetPlanetId && engine.state.planets[f.targetPlanetId]?.ownerId === curPlayerId) {
          return f.mission === 'attack';
        }
        const isTargetSystemMyColony = Object.values(engine.state.planets).some(
          (p) => p.ownerId === curPlayerId && p.systemId === f.targetSystemId
        );
        return isTargetSystemMyColony && f.mission === 'attack';
      }).length;

      if (curThreatsCount > lastThreatsCountRef.current) {
        sound.playAlert();
      }
      lastThreatsCountRef.current = curThreatsCount;

      // In slow strategy, bots evaluate every 60 seconds of game time
      if (engine.state.timeMs - lastBotUpdateMsRef.current >= 60 * 1000) {
        lastBotUpdateMsRef.current = engine.state.timeMs;
        for (const bot of botsRef.current) {
          bot.update(engine);
        }
      }

      // Trigger UI re-render
      setEngineState({ ...engine.state });
    }, realIntervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, timeScale]);

  if (!engineState) {
    return (
      <div className="w-screen h-screen bg-[#030712] flex flex-col items-center justify-center font-mono text-cyan-400 select-none">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest animate-pulse">Sektör Matrisi Yükleniyor...</span>
      </div>
    );
  }

  // Active player owned planets
  const myPlanets = Object.values(engineState.planets).filter(
    (p) => p.ownerId === activePlayerId
  );
  const activePlanet = myPlanets.find((p) => p.id === activePlanetId) || myPlanets[0];
  const activePlayer = engineState.players[activePlayerId];

  // Active player moving fleets & incoming threats
  const movingFleetsCount = Object.values(engineState.fleets).filter(
    (f) =>
      f.ownerId === activePlayerId &&
      (f.status === 'in_transit' || f.status === 'returning' || f.status === 'intercepting')
  ).length;

  const threatsCount = Object.values(engineState.fleets).filter((f) => {
    if (f.ownerId === activePlayerId || f.status === 'destroyed') return false;
    if (f.targetPlanetId && engineState.planets[f.targetPlanetId]?.ownerId === activePlayerId) {
      return true;
    }
    const isTargetSystemMyColony = Object.values(engineState.planets).some(
      (p) => p.ownerId === activePlayerId && p.systemId === f.targetSystemId
    );
    return isTargetSystemMyColony && f.mission === 'attack';
  }).length;

  // Command handlers
  const handleUpgradeBuilding = (planetId: string, buildingType: BuildingType) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'UPGRADE_BUILDING',
      planetId,
      buildingType,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleStartResearch = (researchType: ResearchType) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'START_RESEARCH',
      researchType,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleBuildShip = (planetId: string, shipType: ShipType, count: number) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_SHIPS',
      planetId,
      shipType,
      count,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchFleet = (
    targetSystemId: string,
    targetPlanetId: string | undefined,
    targetFleetId: string | undefined,
    ships: Record<ShipType, number>,
    cargo: Partial<Resources>,
    mission: MissionType
  ) => {
    if (!engineRef.current || !activePlanet) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_FLEET',
      originPlanetId: activePlanet.id,
      targetSystemId,
      targetPlanetId,
      targetFleetId,
      ships,
      cargo,
      mission,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecallFleet = (fleetId: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECALL_FLEET',
      fleetId,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetStance = (planetId: string, stance: PlanetStance) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_PLANET_STANCE',
      planetId,
      stance,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleStepTick = () => {
    if (!engineRef.current) return;
    engineRef.current.tick(60 * 1000); // +1 min step
    setEngineState({ ...engineRef.current.state });
  };

  const handleFastForwardMinutes = (minutes: number) => {
    if (!engineRef.current) return;
    const deltaMs = minutes * 60 * 1000;
    engineRef.current.tick(deltaMs);
    for (const bot of botsRef.current) {
      bot.update(engineRef.current);
    }
    setEngineState({ ...engineRef.current.state });
  };

  // Tactical Reaction: Lock on incoming threat to launch intercept
  const handleTargetThreat = (threat: Fleet) => {
    setSelectedTarget({
      type: 'fleet',
      systemId: threat.targetSystemId,
      fleetId: threat.id,
    });
  };

  // Tactical Reaction: Evacuate resources (Fleet-save)
  const handleEvacuatePlanet = (planetId: string) => {
    setActivePlanetId(planetId);
    // Find closest safe system to jump to
    const p = engineState.planets[planetId];
    if (p) {
      const otherSys = Object.values(engineState.map.systems).find(
        (s) => s.id !== p.systemId && !s.hasRelay
      );
      if (otherSys) {
        setSelectedTarget({
          type: 'system',
          systemId: otherSys.id,
        });
      }
    }
  };

  const handleToggleVacationMode = () => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'TOGGLE_VACATION_MODE',
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleCreateAlliance = (name: string, tag: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CREATE_ALLIANCE',
      name,
      tag,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleJoinAlliance = (allianceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'JOIN_ALLIANCE',
      allianceId,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleLeaveAlliance = () => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LEAVE_ALLIANCE',
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleDonateToAlliance = (planetId: string, resources: { ore: number; crystal: number; fuel: number }) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DONATE_TO_ALLIANCE',
      planetId,
      resources,
    });
    if (res.success) {
      sound.playNotification();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleWithdrawFromAlliance = (planetId: string, resources: { ore: number; crystal: number; fuel: number }) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'WITHDRAW_FROM_ALLIANCE',
      planetId,
      resources,
    });
    if (res.success) {
      sound.playNotification();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleTransferToAlly = (
    sourcePlanetId: string,
    targetPlanetId: string,
    resources: { ore: number; crystal: number; fuel: number }
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ALLIANCE_TRANSFER_RESOURCES',
      sourcePlanetId,
      targetPlanetId,
      resources,
    });
    if (res.success) {
      sound.playLaunch();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssaultRelay = () => {
    if (!engineState) return;
    setSelectedTarget({
      type: 'system',
      systemId: engineState.relay.systemId,
    });
  };

  const handleSupportAlly = (targetSystemId: string, planetId: string) => {
    setSelectedTarget({
      type: 'planet',
      systemId: targetSystemId,
      planetId,
    });
  };

  const handleSelectSlot = (systemId: string, planetId: string) => {
    setSelectedTarget({
      type: 'planet',
      systemId,
      planetId,
    });
    setInspectedSystemId(null);
  };

  const handleContextMenuTarget = useCallback((target: { type: 'system' | 'planet' | 'fleet'; systemId: string; planetId?: string; fleetId?: string }) => {
    sound.playClick();
    setSelectedTarget({
      type: target.type,
      systemId: target.systemId,
      planetId: target.planetId,
      fleetId: target.fleetId,
    });
    setIsCommandPanelOpen(true);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-space-950 font-sans">
      {/* Top Bar Navigation & Resources */}
      <TopBar
        state={engineState}
        activePlayerId={activePlayerId}
        activePlanet={activePlanet}
        isPlaying={isPlaying}
        timeScale={timeScale}
        godMode={godMode}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSetTimeScale={setTimeScale}
        onStepTick={handleStepTick}
        onFastForwardMinutes={handleFastForwardMinutes}
        onToggleGodMode={() => setGodMode(!godMode)}
        onSelectPlayer={(id) => {
          setActivePlayerId(id);
          const firstP = Object.values(engineState.planets).find((p) => p.ownerId === id);
          if (firstP) setActivePlanetId(firstP.id);
        }}
        onOpenPlanetPanel={() => setActiveLeftPanel((prev) => (prev === 'planets' ? null : 'planets'))}
        onOpenShipyard={() => setActiveLeftPanel((prev) => (prev === 'shipyard' ? null : 'shipyard'))}
        onOpenResearch={() => setActiveLeftPanel((prev) => (prev === 'research' ? null : 'research'))}
        onOpenTransitRadar={() => setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'))}
        onOpenBattles={() => setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'))}
        onOpenRelay={() => setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'))}
        onOpenAlliance={() => setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'))}
        onOpenGallery={() => setActiveLeftPanel((prev) => (prev === 'gallery' ? null : 'gallery'))}
        onOpenOrientation={() => setIsOrientationOpen(true)}
        onToggleVacationMode={handleToggleVacationMode}
        onReset={() => initGame(Date.now())}
        isMuted={isAudioMuted}
        onToggleMute={() => {
          const nextMuted = sound.toggleMute();
          setIsAudioMuted(nextMuted);
        }}
      />

      {/* Main Game Interface (Stellaris Left Rail, Wide Center Galaxy Map, Stellaris Outliner, Sliding Drawers) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost: Stellaris Vertical Navigation Icon Rail */}
        <StellarisLeftRail
          activePlayerColor={activePlayer?.color || '#00f3ff'}
          activeLeftPanel={activeLeftPanel}
          isPlanetPanelOpen={activeLeftPanel === 'planets'}
          onTogglePlanetPanel={() => setActiveLeftPanel((prev) => (prev === 'planets' ? null : 'planets'))}
          isCommandPanelOpen={isCommandPanelOpen}
          onToggleCommandPanel={() => setIsCommandPanelOpen(!isCommandPanelOpen)}
          onOpenShipyard={() => setActiveLeftPanel((prev) => (prev === 'shipyard' ? null : 'shipyard'))}
          onOpenResearch={() => setActiveLeftPanel((prev) => (prev === 'research' ? null : 'research'))}
          onOpenTransitRadar={() => setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'))}
          onOpenSituationLog={() => setActiveLeftPanel((prev) => (prev === 'situation' ? null : 'situation'))}
          onOpenBattles={() => setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'))}
          onOpenAdmirals={() => setActiveLeftPanel((prev) => (prev === 'admirals' ? null : 'admirals'))}
          onOpenRelay={() => setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'))}
          onOpenAlliance={() => setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'))}
          onOpenGallery={() => setActiveLeftPanel((prev) => (prev === 'gallery' ? null : 'gallery'))}
          onOpenOrientation={() => setIsOrientationOpen(true)}
          movingFleetsCount={movingFleetsCount}
          threatsCount={threatsCount}
          unreadBattlesCount={engineState.battleReports.length}
          isRelayControlled={engineState.relay.controllingPlayerId === activePlayerId}
          planetsCount={myPlanets.length}
          godMode={godMode}
          onToggleGodMode={() => setGodMode(!godMode)}
          isMuted={isAudioMuted}
          onToggleMute={() => {
            const nextMuted = sound.toggleMute();
            setIsAudioMuted(nextMuted);
          }}
          onToggleVacationMode={handleToggleVacationMode}
        />

        {/* Docked Left Rail Drawer Panel: Never Leaves Map! */}
        {activeLeftPanel && (
          <div className="absolute left-14 top-0 bottom-0 z-30 shadow-2xl animate-fade-in flex">
            {activeLeftPanel === 'planets' && (
              <PlanetPanel
                planets={myPlanets}
                activePlanetId={activePlanet?.id || ''}
                state={engineState}
                onSelectPlanet={setActivePlanetId}
                onUpgradeBuilding={handleUpgradeBuilding}
                onSetStance={handleSetStance}
                currentTimeMs={engineState.timeMs}
                onOpenShipyard={() => setActiveLeftPanel('shipyard')}
                onOpenResearch={() => setActiveLeftPanel('research')}
                onClose={() => setActiveLeftPanel(null)}
              />
            )}

            {activeLeftPanel === 'shipyard' && (
              <ShipyardModal
                planet={activePlanet}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onBuildShip={handleBuildShip}
                currentTimeMs={engineState.timeMs}
              />
            )}

            {activeLeftPanel === 'research' && (
              <ResearchModal
                player={activePlayer}
                homeworld={myPlanets.find((p) => p.isHomeworld) || myPlanets[0]}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onStartResearch={handleStartResearch}
                currentTimeMs={engineState.timeMs}
              />
            )}

            {activeLeftPanel === 'transit_radar' && (
              <FleetTransitRadarModal
                state={engineState}
                activePlayerId={activePlayerId}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onFocusFleet={(fleetId) => {
                  const fl = engineState.fleets[fleetId];
                  if (fl) {
                    setSelectedTarget({
                      type: 'fleet',
                      systemId: fl.targetSystemId,
                      fleetId: fl.id,
                    });
                  }
                }}
                onFocusSystem={(sysId) => {
                  setSelectedTarget({ type: 'system', systemId: sysId });
                }}
                onSelectPlanet={(sysId, planetId) => {
                  setSelectedTarget({ type: 'planet', systemId: sysId, planetId });
                  setActivePlanetId(planetId);
                }}
                onRecallFleet={handleRecallFleet}
                onOpenCommandPanel={() => setIsCommandPanelOpen(true)}
              />
            )}

            {activeLeftPanel === 'situation' && (
              <SituationLogModal
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                state={engineState}
                activePlayerId={activePlayerId}
                onSelectSystem={(sysId) => {
                  setSelectedTarget({ type: 'system', systemId: sysId });
                }}
                onOpenAnomaly={(sys) => {
                  setAnomalyModalSystemId(sys.id);
                }}
                onAssaultRelay={handleAssaultRelay}
              />
            )}

            {activeLeftPanel === 'battles' && (
              <CombatReplayModal
                reports={engineState.battleReports}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onSelectSystem={(sysId) => {
                  sound.playClick();
                  setSelectedTarget({ type: 'system', systemId: sysId });
                }}
              />
            )}

            {activeLeftPanel === 'admirals' && (
              <AdmiralsModal
                state={engineState}
                activePlayerId={activePlayerId}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
              />
            )}

            {activeLeftPanel === 'alliance' && (
              <AllianceModal
                state={engineState}
                activePlayerId={activePlayerId}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onCreateAlliance={handleCreateAlliance}
                onJoinAlliance={handleJoinAlliance}
                onLeaveAlliance={handleLeaveAlliance}
                onSupportAlly={handleSupportAlly}
                onDonateToAlliance={handleDonateToAlliance}
                onWithdrawFromAlliance={handleWithdrawFromAlliance}
                onTransferToAlly={handleTransferToAlly}
              />
            )}

            {activeLeftPanel === 'relay' && (
              <RelayModal
                state={engineState}
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                onAssaultRelay={handleAssaultRelay}
              />
            )}

            {activeLeftPanel === 'gallery' && (
              <ArtGalleryModal
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
              />
            )}
          </div>
        )}

        {/* Center: Live Galaxy Vector Map & 2.5D Orrery (Occupies Full Center Stage!) */}
        <main className="flex-1 h-full relative overflow-hidden">
          {/* Incoming Threat Banner Alert */}
          <IncomingThreatBanner
            state={engineState}
            activePlayerId={activePlayerId}
            onOpenRadar={() => setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'))}
            onTargetThreat={(threat) => {
              handleTargetThreat(threat);
              setIsCommandPanelOpen(true);
            }}
            onEvacuatePlanet={(pId) => {
              handleEvacuatePlanet(pId);
              setIsCommandPanelOpen(true);
            }}
          />

          {/* Stellaris Empire Notification Alert Strip */}
          <StellarisNotificationStrip
            state={engineState}
            activePlayerId={activePlayerId}
            onFocusSystem={(sysId) => {
              setSelectedTarget({ type: 'system', systemId: sysId });
            }}
            onOpenBattles={() => setActiveLeftPanel('battles')}
            onOpenResearch={() => setActiveLeftPanel('research')}
            onOpenShipyard={() => setActiveLeftPanel('shipyard')}
            onOpenSituationLog={() => setActiveLeftPanel('situation')}
            onOpenTransitRadar={() => setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'))}
          />

          <GalaxyMap
            state={engineState}
            activePlayerId={activePlayerId}
            selectedTarget={selectedTarget}
            godMode={godMode}
            onSelectSystem={(systemId) => {
              setSelectedTarget({ type: 'system', systemId });
            }}
            onContextMenuTarget={handleContextMenuTarget}
            onSelectFleet={(fleetId) => {
              const fl = engineState.fleets[fleetId];
              if (fl) {
                setSelectedTarget({
                  type: 'fleet',
                  systemId: fl.targetSystemId,
                  fleetId,
                });
              }
            }}
            onSelectPlanet={(systemId, planetId) => {
              setSelectedTarget({ type: 'planet', systemId, planetId });
              if (engineState.planets[planetId]?.ownerId === activePlayerId) {
                setActivePlanetId(planetId);
                setActiveLeftPanel('planets');
              } else {
                setIsCommandPanelOpen(true);
              }
            }}
            onInspectSystem={(systemId) => setInspectedSystemId(systemId)}
            onRecallFleet={handleRecallFleet}
            onOpenShipyard={() => setActiveLeftPanel('shipyard')}
            onOpenResearch={() => setActiveLeftPanel('research')}
            onOpenTransitRadar={() => setActiveLeftPanel((prev) => (prev === 'transit_radar' ? null : 'transit_radar'))}
            onFocusHomeworld={handleFocusHomeworld}
            onFocusRelay={handleFocusRelay}
            onCycleColonies={handleCycleColonies}
            onOpenBattles={() => setActiveLeftPanel('battles')}
          />

          {/* Stellaris Fleet Inspector Bottom Card HUD */}
          {selectedTarget?.type === 'fleet' && selectedTarget.fleetId && (
            <FleetCardHUD
              state={engineState}
              fleetId={selectedTarget.fleetId}
              activePlayerId={activePlayerId}
              currentTimeMs={engineState.timeMs}
              onClose={() => setSelectedTarget(null)}
              onRecallFleet={handleRecallFleet}
              onOpenCommandPanel={() => setIsCommandPanelOpen(true)}
              onFocusFleetPosition={() => {
                if (selectedTarget.fleetId) {
                  const fl = engineState.fleets[selectedTarget.fleetId];
                  if (fl) {
                    const sysId = fl.targetSystemId || fl.originSystemId;
                    if (sysId) {
                      setSelectedTarget({ type: 'system', systemId: sysId });
                    }
                  }
                }
              }}
            />
          )}

          {/* Sector Real-Time Communications & Alerts Ticker */}
          <EventFeed events={engineState.eventLog} />
        </main>

        {/* Fleet Dispatch & Target Command Deck (Floating Slide-over Drawer) */}
        {isCommandPanelOpen && (
          <div className={`absolute ${isOutlinerCollapsed ? 'right-4' : 'right-72'} top-0 bottom-0 z-30 shadow-2xl animate-fade-in flex`}>
            <CommandPanel
              state={engineState}
              activePlayerId={activePlayerId}
              activePlanet={activePlanet}
              selectedTarget={selectedTarget}
              onDispatchFleet={handleDispatchFleet}
              onRecallFleet={handleRecallFleet}
              currentTimeMs={engineState.timeMs}
              onClose={() => setIsCommandPanelOpen(false)}
            />
          </div>
        )}

        {/* Rightmost: Stellaris Empire Outliner */}
        <StellarisOutliner
          state={engineState}
          activePlayerId={activePlayerId}
          activePlanetId={activePlanet?.id || ''}
          selectedTarget={selectedTarget}
          isCollapsed={isOutlinerCollapsed}
          onToggleCollapse={() => setIsOutlinerCollapsed(!isOutlinerCollapsed)}
          onSelectPlanet={(pId) => {
            setActivePlanetId(pId);
            const p = engineState.planets[pId];
            if (p) {
              setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId: p.id });
            }
            setActiveLeftPanel('planets');
          }}
          onSelectFleet={(fleetId) => {
            const fl = engineState.fleets[fleetId];
            if (fl) {
              setSelectedTarget({ type: 'fleet', systemId: fl.targetSystemId, fleetId: fl.id });
            }
          }}
          onSelectSystem={(systemId) => {
            setSelectedTarget({ type: 'system', systemId });
          }}
          currentTimeMs={engineState.timeMs}
          onContextMenuTarget={handleContextMenuTarget}
        />
      </div>

      {/* System Orbital Inspection Modal */}
      <SystemInspectionModal
        system={inspectedSystemId ? engineState.map.systems[inspectedSystemId] : null}
        state={engineState}
        activePlayerId={activePlayerId}
        isOpen={!!inspectedSystemId}
        onClose={() => setInspectedSystemId(null)}
        onSelectSlot={handleSelectSlot}
        onOpenAnomaly={(sys) => setAnomalyModalSystemId(sys.id)}
      />

      {/* Stellaris Situation Log / Anomaly Discovery Modal */}
      <AnomalyEventModal
        isOpen={!!anomalyModalSystemId}
        onClose={() => setAnomalyModalSystemId(null)}
        system={anomalyModalSystemId ? engineState.map.systems[anomalyModalSystemId] : null}
        onDispatchScout={(systemId) => {
          setSelectedTarget({ type: 'system', systemId });
          setIsCommandPanelOpen(true);
        }}
      />

      {/* Beginner / Orientation Walkthrough Guide */}
      <OrientationGuideModal
        isOpen={isOrientationOpen}
        onClose={() => setIsOrientationOpen(false)}
      />
    </div>
  );
}
