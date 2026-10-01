import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdmiralBot } from './bots/admiral';
import { ExplorerBot } from './bots/explorer';
import { GuardianBot } from './bots/guardian';
import { IndustrialistBot } from './bots/industrialist';
import { RaiderBot } from './bots/raider';
import { IBotAgent } from './bots/types';
import { GameEngine } from './engine/engine';
import {
  Admiral,
  BuildingType,
  DefenseStructureType,
  EspionageOpType,
  Fleet,
  FleetDoctrine,
  MissionType,
  PlanetSpecialization,
  PlanetStance,
  ResearchType,
  ResourceType,
  Resources,
  SenateResolutionType,
  SenateVote,
  ShipType,
  StarbaseModuleType,
  TransmissionType,
} from './engine/types';
import { evaluatePlayerDirectives } from './engine/directives';
import { AllianceModal, AllianceTab } from './ui/components/AllianceModal';
import { AnomalyEventModal } from './ui/components/AnomalyEventModal';
import { ArtGalleryModal } from './ui/components/ArtGalleryModal';
import { CombatReplayModal } from './ui/components/CombatReplayModal';
import { CommandPanel } from './ui/components/CommandPanel';
import { StarbaseModal } from './ui/components/StarbaseModal';
import { SenateModal } from './ui/components/SenateModal';
import { EventFeed } from './ui/components/EventFeed';
import { FleetCardHUD } from './ui/components/FleetCardHUD';
import { GalaxyMap } from './ui/components/GalaxyMap';
import { IncomingThreatBanner } from './ui/components/IncomingThreatBanner';
import { PlanetPanel } from './ui/components/PlanetPanel';
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
import { TradeModal } from './ui/components/TradeModal';
import { EspionageModal } from './ui/components/EspionageModal';
import { VictoryModal } from './ui/components/VictoryModal';
import { TacticalBottomDock } from './ui/components/TacticalBottomDock';
import { SelectedTarget } from './ui/types';
import { sound } from './ui/sound';

type LeftPanelType =
  | 'planets'
  | 'shipyard'
  | 'research'
  | 'transit_radar'
  | 'market'
  | 'espionage'
  | 'situation'
  | 'battles'
  | 'admirals'
  | 'alliance'
  | 'senate'
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
  const [activeStarbaseSystemId, setActiveStarbaseSystemId] = useState<string | null>(null);
  const [anomalyModalSystemId, setAnomalyModalSystemId] = useState<string | null>(null);
  const [espionageTargetPlanetId, setEspionageTargetPlanetId] = useState<string | null>(null);
  const [allianceInitialTab, setAllianceInitialTab] = useState<AllianceTab>('members');
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isOrientationOpen, setIsOrientationOpen] = useState<boolean>(() => {
    return !localStorage.getItem('galaksi_orientation_seen');
  });

  // Automatically prompt victory modal when victory conditions are achieved
  useEffect(() => {
    if (engineState.victory) {
      setIsVictoryModalOpen(true);
    }
  }, [engineState.victory]);

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
        setActiveLeftPanel((prev) => (prev === 'market' ? null : 'market'));
      } else if (e.key === 'F7') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'espionage' ? null : 'espionage'));
      } else if (e.key === 'F8') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'situation' ? null : 'situation'));
      } else if (e.key === 'F9') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'));
      } else if (e.key === 'F10') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'admirals' ? null : 'admirals'));
      } else if (e.key === 'F11') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'));
      } else if (e.key === 'F12') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'));
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        sound.playClick();
        setIsOrientationOpen((prev) => !prev);
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

    lastThreatsCountRef.current = 0;
    lastTransmissionsCountRef.current = 0;
    lastCrisesCountRef.current = 0;
    lastVictoryAnnouncedRef.current = false;

    setActivePlanetId(humanHw.id);
    setSelectedTarget({ type: 'system', systemId: humanHw.systemId });
    setEngineState({ ...engine.state });
  }, []);

  const lastThreatsCountRef = useRef(0);
  const lastTransmissionsCountRef = useRef(0);
  const lastCrisesCountRef = useRef(0);
  const lastVictoryAnnouncedRef = useRef(false);

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

      // 6. Incoming Diplomatic Radio Transmission SFX
      const curTransmissions = Object.values(engine.state.transmissions || {}).filter(
        (t) => t.recipientId === 'all' || t.recipientId === curPlayerId
      ).length;
      if (curTransmissions > lastTransmissionsCountRef.current) {
        sound.playTransmission();
      }
      lastTransmissionsCountRef.current = curTransmissions;

      // 7. Dynamic Crisis Alert SFX
      const curActiveCrises = Object.values(engine.state.sectorEvents || {}).filter(
        (e) => !e.resolved && engine.state.timeMs < e.expiresAtMs
      ).length;
      if (curActiveCrises > lastCrisesCountRef.current) {
        sound.playCrisisAlert();
      }
      lastCrisesCountRef.current = curActiveCrises;

      // 8. Galactic Victory Fanfare SFX
      if (!lastVictoryAnnouncedRef.current && engine.state.victory) {
        sound.playVictoryFanfare();
        lastVictoryAnnouncedRef.current = true;
      } else if (!engine.state.victory) {
        lastVictoryAnnouncedRef.current = false;
      }

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

  const pendingTransmissionsCount = Object.values(engineState.transmissions || {}).filter(
    (t) => t.recipientId === activePlayerId && t.status === 'pending' && t.expiresAtMs > engineState.timeMs
  ).length;

  const myDirectives = evaluatePlayerDirectives(engineState, activePlayerId);
  const unclaimedDirectivesCount = myDirectives.filter((d) => d.isCompleted && !d.isClaimed).length;

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

  const handleBuildDefense = (planetId: string, defenseType: DefenseStructureType, count: number) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_DEFENSES',
      planetId,
      defenseType,
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
    mission: MissionType,
    admiralId?: string,
    doctrine?: FleetDoctrine
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
      admiralId,
      doctrine,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetFleetDoctrine = (fleetId: string, doctrine: FleetDoctrine) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_FLEET_DOCTRINE',
      fleetId,
      doctrine,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchSupplyConvoy = (colonyPlanetId: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_SUPPLY_CONVOY',
      colonyPlanetId,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecruitAdmiral = (candidate: Admiral, planetId: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECRUIT_ADMIRAL',
      planetId,
      name: candidate.name,
      title: candidate.title,
      avatar: candidate.avatar,
      traitId: candidate.traitId,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssignAdmiral = (admiralId: string, fleetId: string | null, planetId: string | null) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSIGN_ADMIRAL',
      admiralId,
      fleetId,
      planetId,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismissAdmiral = (admiralId: string) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMISS_ADMIRAL',
      admiralId,
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

  const handleSetSpecialization = (planetId: string, specialization: PlanetSpecialization) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_PLANET_SPECIALIZATION',
      planetId,
      specialization,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleClaimDirective = (directiveId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: directiveId as any,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleUpgradeStarbase = (systemId: string, planetId: string) => {
    if (!engineRef.current) return;
    const sb = engineRef.current.state.starbases?.[systemId];
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: sb ? 'UPGRADE_STARBASE' : 'BUILD_STARBASE',
      systemId,
      planetId,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleInstallStarbaseModule = (systemId: string, planetId: string, moduleType: StarbaseModuleType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'INSTALL_STARBASE_MODULE',
      systemId,
      planetId,
      moduleType,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismantleStarbaseModule = (systemId: string, moduleIndex: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMANTLE_STARBASE_MODULE',
      systemId,
      moduleIndex,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleProposeSenateResolution = (resolutionType: SenateResolutionType, targetPlayerId?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType,
      targetPlayerId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCastSenateVote = (vote: SenateVote) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CAST_SENATE_VOTE',
      vote,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCallEmergencySenateSession = (resolutionType: SenateResolutionType, targetPlayerId?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CALL_EMERGENCY_SENATE_SESSION',
      resolutionType,
      targetPlayerId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
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

  const handleSendTransmission = (
    recipientId: string,
    transmissionType: TransmissionType,
    title: string,
    message: string,
    systemId?: string,
    tradeOffer?: { give: Resources; receive: Resources },
    truceDurationMs?: number
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SEND_TRANSMISSION',
      recipientId,
      transmissionType,
      title,
      message,
      systemId,
      tradeOffer,
      truceDurationMs,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRespondTransmission = (transmissionId: string, accept: boolean) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RESPOND_TRANSMISSION',
      transmissionId,
      action: accept ? 'accept' : 'reject',
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleResetSeason = () => {
    if (!engineRef.current) return;
    const newSeed = Date.now();
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RESET_SEASON',
      seed: newSeed,
    });
    initGame(newSeed);
    setIsVictoryModalOpen(false);
  };

  const handleMarketTrade = (
    sellResource: ResourceType,
    buyResource: ResourceType,
    sellAmount: number
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'MARKET_TRADE',
      planetId: activePlanetId,
      sellResource,
      buyResource,
      sellAmount,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLaunchEspionageOp = (
    originPlanetId: string,
    targetPlanetId: string,
    opType: EspionageOpType,
    scoutCount: number
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LAUNCH_ESPIONAGE_OP',
      originPlanetId,
      targetPlanetId,
      opType,
      scoutCount,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
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
        onOpenMarket={() => setActiveLeftPanel((prev) => (prev === 'market' ? null : 'market'))}
        onOpenEspionage={() => setActiveLeftPanel((prev) => (prev === 'espionage' ? null : 'espionage'))}
        onOpenSituationLog={() => setActiveLeftPanel((prev) => (prev === 'situation' ? null : 'situation'))}
        onOpenBattles={() => setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'))}
        onOpenRelay={() => setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'))}
        onOpenAlliance={() => setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'))}
        onOpenVictory={() => setIsVictoryModalOpen(true)}
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
          onOpenMarket={() => setActiveLeftPanel((prev) => (prev === 'market' ? null : 'market'))}
          onOpenEspionage={() => setActiveLeftPanel((prev) => (prev === 'espionage' ? null : 'espionage'))}
          onOpenSituationLog={() => setActiveLeftPanel((prev) => (prev === 'situation' ? null : 'situation'))}
          onOpenBattles={() => setActiveLeftPanel((prev) => (prev === 'battles' ? null : 'battles'))}
          onOpenAdmirals={() => setActiveLeftPanel((prev) => (prev === 'admirals' ? null : 'admirals'))}
          onOpenRelay={() => setActiveLeftPanel((prev) => (prev === 'relay' ? null : 'relay'))}
          onOpenAlliance={() => setActiveLeftPanel((prev) => (prev === 'alliance' ? null : 'alliance'))}
          onOpenSenate={() => setActiveLeftPanel((prev) => (prev === 'senate' ? null : 'senate'))}
          onOpenGallery={() => setActiveLeftPanel((prev) => (prev === 'gallery' ? null : 'gallery'))}
          onOpenOrientation={() => setIsOrientationOpen(true)}
          movingFleetsCount={movingFleetsCount}
          threatsCount={threatsCount}
          unreadBattlesCount={engineState.battleReports.length}
          pendingTransmissionsCount={pendingTransmissionsCount}
          unclaimedDirectivesCount={unclaimedDirectivesCount}
          isRelayControlled={engineState.relay.controllingPlayerId === activePlayerId}
          isSenateSessionActive={!!engineState.senate?.currentSession}
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
                onSetSpecialization={handleSetSpecialization}
                currentTimeMs={engineState.timeMs}
                onOpenShipyard={() => setActiveLeftPanel('shipyard')}
                onOpenResearch={() => setActiveLeftPanel('research')}
                onOpenMarket={() => setActiveLeftPanel('market')}
                onOpenEspionage={(targetId) => {
                  setEspionageTargetPlanetId(targetId || null);
                  setActiveLeftPanel('espionage');
                }}
                onDispatchSupplyConvoy={handleDispatchSupplyConvoy}
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
                onBuildDefense={handleBuildDefense}
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
                hasTechHaven={myPlanets.some((p) => p.specialization === 'tech_haven')}
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
                onClaimDirective={handleClaimDirective}
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
                onRecruitAdmiral={handleRecruitAdmiral}
                onAssignAdmiral={handleAssignAdmiral}
                onDismissAdmiral={handleDismissAdmiral}
              />
            )}

            {activeLeftPanel === 'alliance' && (
              <AllianceModal
                state={engineState}
                activePlayerId={activePlayerId}
                isOpen={true}
                isDocked={true}
                initialTab={allianceInitialTab}
                onClose={() => setActiveLeftPanel(null)}
                onCreateAlliance={handleCreateAlliance}
                onJoinAlliance={handleJoinAlliance}
                onLeaveAlliance={handleLeaveAlliance}
                onSupportAlly={handleSupportAlly}
                onDonateToAlliance={handleDonateToAlliance}
                onWithdrawFromAlliance={handleWithdrawFromAlliance}
                onTransferToAlly={handleTransferToAlly}
                onSendTransmission={handleSendTransmission}
                onRespondTransmission={handleRespondTransmission}
              />
            )}

            {activeLeftPanel === 'market' && (
              <TradeModal
                state={engineState}
                activePlayerId={activePlayerId}
                activePlanet={activePlanet}
                onClose={() => setActiveLeftPanel(null)}
                onTrade={handleMarketTrade}
              />
            )}

            {activeLeftPanel === 'espionage' && (
              <EspionageModal
                state={engineState}
                activePlayerId={activePlayerId}
                activePlanet={activePlanet}
                initialTargetPlanetId={espionageTargetPlanetId}
                onClose={() => {
                  setEspionageTargetPlanetId(null);
                  setActiveLeftPanel(null);
                }}
                onLaunchOp={handleLaunchEspionageOp}
              />
            )}

            {activeLeftPanel === 'relay' && (
              <SituationLogModal
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                state={engineState}
                activePlayerId={activePlayerId}
                initialTab="relay"
                onSelectSystem={(sysId) => {
                  setSelectedTarget({ type: 'system', systemId: sysId });
                }}
                onOpenAnomaly={(sys) => {
                  setAnomalyModalSystemId(sys.id);
                }}
                onAssaultRelay={handleAssaultRelay}
                onClaimDirective={handleClaimDirective}
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
            onOpenAlliance={(tab) => {
              if (tab) setAllianceInitialTab(tab as AllianceTab);
              setActiveLeftPanel('alliance');
            }}
            onOpenSenate={() => setActiveLeftPanel('senate')}
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
            onOpenStarbase={(sysId) => setActiveStarbaseSystemId(sysId)}
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
              onSetDoctrine={handleSetFleetDoctrine}
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

          {/* Konsept B: Compact Tactical Bottom Dock (Fleet & Quick Orders) */}
          <TacticalBottomDock
            state={engineState}
            activePlayerId={activePlayerId}
            selectedTarget={selectedTarget}
            activePlanetId={activePlanetId}
            onOpenCommandPanel={() => setIsCommandPanelOpen(true)}
            onRecallFleet={handleRecallFleet}
            onOpenShipyard={() => setActiveLeftPanel('shipyard')}
            onOpenMarket={() => setActiveLeftPanel('market')}
            onFocusPlanet={(pId) => {
              setActivePlanetId(pId);
              const p = engineState.planets[pId];
              if (p) setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId: p.id });
            }}
            onFocusRelay={handleFocusRelay}
            onSetStance={handleSetStance}
          />

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
          onOpenStarbase={(sysId) => setActiveStarbaseSystemId(sysId)}
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
        onOpenStarbase={(sysId) => setActiveStarbaseSystemId(sysId)}
      />

      {/* Orbital Starbase Command Modal */}
      <StarbaseModal
        isOpen={!!activeStarbaseSystemId}
        systemId={activeStarbaseSystemId}
        state={engineState}
        activePlayerId={activePlayerId}
        onClose={() => setActiveStarbaseSystemId(null)}
        onUpgradeStarbase={handleUpgradeStarbase}
        onInstallModule={handleInstallStarbaseModule}
        onDismantleModule={handleDismantleStarbaseModule}
      />

      {/* Galactic Community & Senate Modal */}
      <SenateModal
        isOpen={activeLeftPanel === 'senate'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        onProposeResolution={handleProposeSenateResolution}
        onCastVote={handleCastSenateVote}
        onCallEmergencySession={handleCallEmergencySenateSession}
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

      {/* Galactic Victory & Endgame Season Recap Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        onClose={() => setIsVictoryModalOpen(false)}
        victory={engineState.victory}
        seasonHistory={engineState.seasonHistory}
        activePlayerId={activePlayerId}
        onResetSeason={handleResetSeason}
      />
    </div>
  );
}
