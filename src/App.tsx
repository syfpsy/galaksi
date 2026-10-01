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
  AscensionPerkId,
  BuildingType,
  CouncilPosition,
  DefenseStructureType,
  EmpireArtifactId,
  EspionageOpType,
  FactionType,
  Fleet,
  FleetDoctrine,
  MegastructureType,
  MissionType,
  PlanetBiome,
  PlanetaryDecisionId,
  PlanetSpecialization,
  PlanetStance,
  ResearchType,
  ResourceType,
  Resources,
  SenateResolutionType,
  SenateVote,
  ShipLoadout,
  ShipType,
  StarbaseModuleType,
  TraditionTier,
  TraditionTreeId,
  TransmissionType,
  TradePolicy,
  SubjectType,
  WarGoalType,
  FederationType,
  CounterEspionageStance,
  CovertOpType,
  SpyAssetType,
  CorporateCivicId,
  CorporateHoldingType,
  ColossusWeaponType,
  AIPolicyType,
  SyntheticAscensionType,
} from './engine/types';
import { evaluatePlayerDirectives } from './engine/directives';
import { AllianceModal, AllianceTab } from './ui/components/AllianceModal';
import { AnomalyEventModal } from './ui/components/AnomalyEventModal';
import { ArtGalleryModal } from './ui/components/ArtGalleryModal';
import { CombatReplayModal } from './ui/components/CombatReplayModal';
import { CommandPanel } from './ui/components/CommandPanel';
import { StarbaseModal } from './ui/components/StarbaseModal';
import { SenateModal } from './ui/components/SenateModal';
import { MegastructureModal } from './ui/components/MegastructureModal';
import { CouncilModal } from './ui/components/CouncilModal';
import { CrisisModal } from './ui/components/CrisisModal';
import { TraditionsModal } from './ui/components/TraditionsModal';
import { ArchaeologyModal } from './ui/components/ArchaeologyModal';
import { TerraformModal } from './ui/components/TerraformModal';
import { TradeRoutesModal } from './ui/components/TradeRoutesModal';
import { WarfareModal } from './ui/components/WarfareModal';
import { FederationModal } from './ui/components/FederationModal';
import { MegacorpModal } from './ui/components/MegacorpModal';
import { ColossusModal } from './ui/components/ColossusModal';
import { SyntheticDawnModal } from './ui/components/SyntheticDawnModal';
import { ParagonModal } from './ui/components/ParagonModal';
import { HyperRelayModal } from './ui/components/HyperRelayModal';
import { ShadowOpsModal } from './ui/components/ShadowOpsModal';
import { GroundInvasionModal } from './ui/components/GroundInvasionModal';
import { EnclavesModal } from './ui/components/EnclavesModal';
import { HyperRelayPolicy, SecretAgentTrait, ShadowOpType, ArmyType, BombardmentStance, EnclaveServiceId } from './engine/types';
import { EventFeed } from './ui/components/EventFeed';
import { FleetCardHUD } from './ui/components/FleetCardHUD';
import { GalaxyMap } from './ui/components/GalaxyMap';
import { DirectOrderPayload, TacticalPingResult } from './ui/components/GalaxyScene25D';
import { IncomingThreatBanner } from './ui/components/IncomingThreatBanner';
import { PlanetPanel } from './ui/components/PlanetPanel';
import { ResearchModal } from './ui/components/ResearchModal';
import { ShipyardModal } from './ui/components/ShipyardModal';
import { ShipDesignerModal } from './ui/components/ShipDesignerModal';
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
  | 'ship_designer'
  | 'research'
  | 'transit_radar'
  | 'market'
  | 'espionage'
  | 'situation'
  | 'battles'
  | 'admirals'
  | 'alliance'
  | 'senate'
  | 'megastructures'
  | 'council'
  | 'traditions'
  | 'archaeology'
  | 'terraform'
  | 'trade_routes'
  | 'warfare'
  | 'federation'
  | 'megacorp'
  | 'crisis'
  | 'colossus'
  | 'synthetics'
  | 'paragons'
  | 'hyperRelays'
  | 'shadowOps'
  | 'groundWarfare'
  | 'enclaves'
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

  // RTS Direct Fleet Dispatch HUD Controls & Toast feedback
  const [directDispatchMode, setDirectDispatchMode] = useState<'all' | 'half' | 'scout'>('all');
  interface TacticalToast {
    id: string;
    text: string;
    color: string;
    timestamp: number;
  }
  const [tacticalToasts, setTacticalToasts] = useState<TacticalToast[]>([]);

  useEffect(() => {
    if (tacticalToasts.length === 0) return;
    const timer = setTimeout(() => {
      setTacticalToasts((prev) => prev.slice(1));
    }, 4500);
    return () => clearTimeout(timer);
  }, [tacticalToasts]);

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
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        sound.playClick();
        setActiveLeftPanel((prev) => (prev === 'ship_designer' ? null : 'ship_designer'));
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

  const myColossus = activePlayer?.colossusId ? engineState.colossi?.[activePlayer.colossusId] : undefined;
  const isColossusActive = !!myColossus;
  const isColossusCharging = myColossus?.status === 'charging' || Object.values(engineState.colossi || {}).some((c) => c.status === 'charging');

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

  const handleSetShipLoadout = (shipType: ShipType, loadout: ShipLoadout) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_SHIP_LOADOUT',
      shipType,
      loadout,
    });
    setEngineState({ ...engineRef.current.state });
  };

  const handleRefitShips = (planetId: string, shipType: ShipType, count: number) => {
    if (!engineRef.current) return;
    engineRef.current.dispatchCommand(activePlayerId, {
      type: 'REFIT_SHIPS',
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

  const handleBuildMegastructure = (systemId: string, megaType: MegastructureType, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_MEGASTRUCTURE',
      systemId,
      megastructureType: megaType,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleUpgradeMegastructure = (megastructureId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'UPGRADE_MEGASTRUCTURE',
      megastructureId,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleConstructGateway = (systemId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CONSTRUCT_GATEWAY',
      systemId,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleActivateGateway = (systemId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ACTIVATE_GATEWAY',
      systemId,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAppointCouncilor = (leaderId: string, position: CouncilPosition) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'APPOINT_COUNCILOR',
      leaderId,
      position,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismissCouncilor = (position: CouncilPosition) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMISS_COUNCILOR',
      position,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecruitCouncilLeader = (candidateId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECRUIT_COUNCIL_LEADER',
      candidateId,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handlePromoteFactionAgenda = (factionType: FactionType, agendaId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PROMOTE_FACTION_AGENDA',
      factionType,
      agendaId,
      fundingPlanetId: planetId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handlePurifyPlanet = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PURIFY_INFESTED_PLANET',
      planetId,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDonateToGDF = (planetId: string, ships: Record<ShipType, number>) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DONATE_TO_GDF',
      planetId,
      ships,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchGDFFleet = (targetSystemId: string, ships: Record<ShipType, number>) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_GDF_FLEET',
      targetSystemId,
      ships,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssaultAnchor = (anchorId: string, fleetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSAULT_VOID_ANCHOR',
      anchorId,
      fleetId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssaultRift = (fleetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSAULT_VOID_RIFT',
      fleetId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleTriggerTestCrisis = () => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'TRIGGER_CRISIS_TEST',
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAdoptTradition = (treeId: TraditionTreeId, tier: TraditionTier) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ADOPT_TRADITION',
      treeId,
      tier,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSelectAscensionPerk = (perkId: AscensionPerkId) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SELECT_ASCENSION_PERK',
      perkId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleExcavateSite = (siteId: string, fleetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'EXCAVATE_SITE',
      siteId,
      fleetId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAbandonExcavation = (siteId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ABANDON_EXCAVATION',
      siteId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleResolveSiteChoice = (siteId: string, choiceIndex: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RESOLVE_ARCHAEOLOGY_CHOICE',
      siteId,
      choiceIndex,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleActivateRelicTriumph = (relicId: EmpireArtifactId) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ACTIVATE_RELIC_TRIUMPH',
      relicId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleReverseEngineer = (actionType: 'tech_boost' | 'cultural_festival', targetPlanetId?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'REVERSE_ENGINEER_ARTIFACTS',
      actionType,
      targetPlanetId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleStartTerraforming = (planetId: string, targetBiome: PlanetBiome) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'START_TERRAFORMING',
      planetId,
      targetBiome,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCancelTerraforming = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CANCEL_TERRAFORMING',
      planetId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleEnactDecision = (planetId: string, decisionId: PlanetaryDecisionId) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ENACT_PLANETARY_DECISION',
      planetId,
      decisionId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleClearBlocker = (planetId: string, blockerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CLEAR_PLANETARY_BLOCKER',
      planetId,
      blockerId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetTradePolicy = (policy: TradePolicy) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_TRADE_POLICY',
      policy,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleProposeCommercialPact = (targetPlayerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PROPOSE_COMMERCIAL_PACT',
      targetPlayerId,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleBreakCommercialPact = (targetPlayerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BREAK_COMMERCIAL_PACT',
      targetPlayerId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchPatrol = (originPlanetId: string, targetSystemId: string, fighters: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_FLEET',
      originPlanetId,
      targetSystemId,
      ships: { scout: 0, transport: 0, fighter: fighters, battleship: 0 },
      mission: 'patrol',
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDeclareWar = (targetPlayerId: string, warGoal: WarGoalType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DECLARE_WAR',
      targetPlayerId,
      warGoal,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleOfferPeace = (warId: string, proposalType: 'surrender' | 'status_quo' | 'white_peace') => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'OFFER_PEACE',
      warId,
      proposalType,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetSubjectTerms = (subjectId: string, subjectType: SubjectType, titheRate: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_SUBJECT_TERMS',
      subjectId,
      subjectType,
      titheRate,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleReleaseSubject = (subjectId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RELEASE_SUBJECT',
      subjectId,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleIntegrateSubject = (subjectId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'INTEGRATE_SUBJECT',
      subjectId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleFormFederation = (name: string, fedType: FederationType, invitedPlayerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'FORM_FEDERATION',
      name,
      fedType,
      invitedPlayerId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleInviteToFederation = (federationId: string, targetPlayerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'INVITE_TO_FEDERATION',
      federationId,
      targetPlayerId,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRespondFederationInvite = (federationId: string, accept: boolean) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RESPOND_FEDERATION_INVITE',
      federationId,
      accept,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLeaveFederation = (federationId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LEAVE_FEDERATION',
      federationId,
    });
    if (res.success) {
      sound.playNotification();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleProposeFederationLaw = (
    federationId: string,
    lawType: 'successionType' | 'warVoteType' | 'fleetContribution',
    proposedValue: string
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PROPOSE_FEDERATION_LAW',
      federationId,
      lawType,
      proposedValue,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleVoteFederationLaw = (federationId: string, vote: 'yes' | 'no') => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'VOTE_FEDERATION_LAW',
      federationId,
      vote,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssignFederationEnvoys = (federationId: string, envoys: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSIGN_FEDERATION_ENVOYS',
      federationId,
      envoys,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleBuildFederalShip = (
    federationId: string,
    planetId: string,
    shipType: ShipType,
    count: number
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_FEDERAL_SHIP',
      federationId,
      planetId,
      shipType,
      count,
    });
    if (res.success) {
      sound.playConstruction();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchFederalFleet = (
    federationId: string,
    originPlanetId: string,
    targetSystemId: string,
    ships: Record<ShipType, number>
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_FEDERAL_FLEET',
      federationId,
      originPlanetId,
      targetSystemId,
      ships,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleEstablishBranchOffice = (targetPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ESTABLISH_BRANCH_OFFICE',
      targetPlanetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCloseBranchOffice = (branchId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CLOSE_BRANCH_OFFICE',
      branchId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleBuildHolding = (branchId: string, holdingType: CorporateHoldingType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId,
      holdingType,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismantleHolding = (branchId: string, holdingIndex: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMANTLE_CORPORATE_HOLDING',
      branchId,
      holdingIndex,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handlePurchaseFutures = (resourceType: ResourceType, amount: number, durationMinutes: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'PURCHASE_COMMODITY_FUTURES',
      resourceType,
      amount,
      durationMinutes,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleClaimFutures = (contractId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CLAIM_COMMODITY_FUTURES',
      contractId,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleConvertToMegacorp = (civics: CorporateCivicId[]) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CONVERT_TO_MEGACORP',
      civics,
    });
    if (res.success) {
      sound.playVictoryFanfare();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleBuildColossus = (weaponType: ColossusWeaponType, originPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUILD_COLOSSUS',
      originPlanetId,
      weaponType,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleMoveColossus = (colossusId: string, targetSystemId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'MOVE_COLOSSUS',
      colossusId,
      targetSystemId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCommenceColossusCharging = (colossusId: string, targetPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'COMMENCE_COLOSSUS_CHARGING',
      colossusId,
      targetPlanetId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCancelColossusFiring = (colossusId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CANCEL_COLOSSUS_FIRING',
      colossusId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRefitColossusWeapon = (colossusId: string, weaponType: ColossusWeaponType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'REFIT_COLOSSUS_WEAPON',
      colossusId,
      newWeaponType: weaponType,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismantleColossus = (colossusId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMANTLE_COLOSSUS',
      colossusId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssembleSyntheticPop = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSEMBLE_SYNTHETIC_POP',
      planetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismantleSyntheticPop = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMANTLE_SYNTHETIC_POP',
      planetId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetAIPolicy = (policy: AIPolicyType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_AI_POLICY',
      policy,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleInitiateSyntheticAscension = (ascensionType: 'cybernetic' | 'synthetic') => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'INITIATE_SYNTHETIC_ASCENSION',
      ascensionType,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSuppressSyntheticUprising = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SUPPRESS_SYNTHETIC_UPRISING',
      planetId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleConvertToMachineWorld = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CONVERT_TO_MACHINE_WORLD',
      planetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecruitParagon = (paragonId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECRUIT_PARAGON',
      paragonId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssignParagon = (
    paragonId: string,
    assignment: { type: 'fleet' | 'planet' | 'council'; targetId: string }
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSIGN_PARAGON',
      paragonId,
      assignment,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleUnassignParagon = (paragonId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'UNASSIGN_PARAGON',
      paragonId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismissParagon = (paragonId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMISS_PARAGON',
      paragonId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCommissionParagonFlagship = (paragonId: string, planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'COMMISSION_PARAGON_FLAGSHIP',
      paragonId,
      planetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleConstructHyperRelay = (systemId: string, fundingPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CONSTRUCT_HYPER_RELAY',
      systemId,
      fundingPlanetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetHyperRelayPolicy = (systemId: string, policy: HyperRelayPolicy) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_HYPER_RELAY_POLICY',
      systemId,
      policy,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismantleHyperRelay = (systemId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMANTLE_HYPER_RELAY',
      systemId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleUpgradeDirectorate = (fundingPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'UPGRADE_INTELLIGENCE_DIRECTORATE',
      fundingPlanetId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecruitAgent = (fundingPlanetId: string, name: string, trait: SecretAgentTrait) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECRUIT_SECRET_AGENT',
      fundingPlanetId,
      name,
      trait,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssignAgent = (agentId: string, targetFactionId?: string, assignedOperationId?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSIGN_SECRET_AGENT',
      agentId,
      targetFactionId,
      assignedOperationId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismissAgent = (agentId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMISS_SECRET_AGENT',
      agentId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDispatchFalseFlagFleet = (fleetId: string, disguisedAsFactionId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISPATCH_FALSE_FLAG_FLEET',
      fleetId,
      disguisedAsFactionId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLaunchShadowOp = (
    targetFactionId: string,
    opType: ShadowOpType,
    assignedAgentId?: string,
    targetPlanetId?: string,
    targetStarbaseId?: string,
    fundingPlanetId?: string
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LAUNCH_SHADOW_OPERATION',
      targetFactionId,
      opType,
      assignedAgentId,
      targetPlanetId,
      targetStarbaseId,
      fundingPlanetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  // Phase 30: Ground Warfare, Bombardment & Invasions Handlers
  const handleRecruitArmy = (planetId: string, armyType: ArmyType, customName?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECRUIT_ARMY',
      planetId,
      armyType,
      customName,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleEmbarkArmies = (planetId: string, fleetId?: string, armyIds?: string[]) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'EMBARK_ARMIES',
      planetId,
      fleetId,
      armyIds,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLandArmies = (fleetId: string, targetPlanetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LAND_ARMIES',
      fleetId,
      targetPlanetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetBombardmentStance = (fleetId: string, stance: BombardmentStance, targetPlanetId?: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_BOMBARDMENT_STANCE',
      fleetId,
      stance,
      targetPlanetId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleDismissArmy = (armyId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'DISMISS_ARMY',
      armyId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLiberatePlanet = (planetId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LIBERATE_PLANET',
      planetId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  // Phase 31: Enclaves, Caravaneers & Shroud Factions Handlers
  const handleInteractEnclave = (enclaveId: string, serviceId: EnclaveServiceId) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'INTERACT_ENCLAVE',
      enclaveId,
      serviceId,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleBuyCaravanReliquary = (caravanId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'BUY_CARAVAN_RELIQUARY',
      caravanId,
    });
    if (res.success) {
      sound.playLaser();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleGambleCaravanSlots = (caravanId: string, betAmount: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'GAMBLE_CARAVAN_SLOTS',
      caravanId,
      betAmount,
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

  const handleEstablishSpyNetwork = (targetPlayerId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ESTABLISH_SPY_NETWORK',
      targetPlayerId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleRecallSpyNetwork = (networkId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'RECALL_SPY_NETWORK',
      networkId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAssignSpymasterEnvoy = (networkId: string, envoys: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ASSIGN_SPYMASTER_ENVOY',
      networkId,
      envoys,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleAcquireSpyAsset = (networkId: string, assetType: SpyAssetType) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'ACQUIRE_SPY_ASSET',
      networkId,
      assetType,
    });
    if (res.success) {
      sound.playTech();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleLaunchCovertOperation = (
    networkId: string,
    opType: CovertOpType,
    targetPlanetId?: string,
    assignedAssetId?: string
  ) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'LAUNCH_COVERT_OPERATION',
      networkId,
      opType,
      targetPlanetId,
      assignedAssetId,
    });
    if (res.success) {
      sound.playLaunch();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleCancelCovertOperation = (operationId: string) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'CANCEL_COVERT_OPERATION',
      operationId,
    });
    if (res.success) {
      sound.playClick();
    } else {
      sound.playError();
    }
    setEngineState({ ...engineRef.current.state });
  };

  const handleSetCounterEspionageStance = (stance: CounterEspionageStance) => {
    if (!engineRef.current) return;
    const res = engineRef.current.dispatchCommand(activePlayerId, {
      type: 'SET_COUNTER_ESPIONAGE_STANCE',
      stance,
    });
    if (res.success) {
      sound.playClick();
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

  const handleDirectOrder = useCallback(
    (target: DirectOrderPayload): boolean | TacticalPingResult => {
      if (!engineRef.current) return false;

      // 1. Resolve origin planet (activePlanet or first owned planet)
      const currentPlanet =
        activePlanet ||
        Object.values(engineState.planets).find((p) => p.ownerId === activePlayerId);

      if (!currentPlanet) {
        sound.playError();
        return false;
      }

      const garrison = currentPlanet.garrison || ({} as Record<ShipType, number>);
      const totalAvailable = Object.values(garrison).reduce((acc, count) => acc + (count || 0), 0);

      if (totalAvailable <= 0) {
        sound.playError();
        setTacticalToasts((prev) => [
          ...prev.slice(-3),
          {
            id: `toast_${Date.now()}`,
            text: `⚠️ [${currentPlanet.name}] Üssünde hazır gemi yok! Tersaneden gemi inşa edin.`,
            color: '#ef4444',
            timestamp: Date.now(),
          },
        ]);
        return false;
      }

      // 2. Select ships based on directDispatchMode
      const selectedShips: Record<ShipType, number> = {
        scout: 0,
        transport: 0,
        fighter: 0,
        battleship: 0,
      };

      if (directDispatchMode === 'scout') {
        const priority: ShipType[] = ['scout', 'fighter', 'transport', 'battleship'];
        for (const type of priority) {
          if ((garrison[type] || 0) > 0) {
            selectedShips[type] = 1;
            break;
          }
        }
      } else if (directDispatchMode === 'half') {
        for (const [st, count] of Object.entries(garrison)) {
          if (count && count > 0) {
            selectedShips[st as ShipType] = Math.ceil(count / 2);
          }
        }
      } else {
        // 'all'
        for (const [st, count] of Object.entries(garrison)) {
          if (count && count > 0) {
            selectedShips[st as ShipType] = count;
          }
        }
      }

      const totalSelected = Object.values(selectedShips).reduce((acc, c) => acc + c, 0);
      if (totalSelected <= 0) {
        sound.playError();
        return false;
      }

      // 3. Determine Contextual Smart Mission & Colors
      const targetSys = engineState.map.systems[target.systemId];
      const targetPlanet = target.planetId ? engineState.planets[target.planetId] : null;
      const targetFleet = target.fleetId ? engineState.fleets[target.fleetId] : null;

      let mission: MissionType = 'explore';
      let color = '#10b981'; // Emerald default
      let label = 'Keşif / Devriye';
      let targetName = targetSys?.name || 'Sektör';

      if (targetFleet && targetFleet.ownerId !== activePlayerId) {
        mission = 'intercept';
        color = '#ef4444';
        label = 'Düşman Filo Önleme';
        targetName = targetFleet.name || 'Düşman Filosu';
      } else if (targetPlanet && targetPlanet.ownerId && targetPlanet.ownerId !== activePlayerId) {
        mission = 'attack';
        color = '#ef4444';
        label = 'Kuşatma & Taarruz';
        targetName = targetPlanet.name;
      } else {
        const hostileColony = Object.values(engineState.planets).find(
          (p) => p.systemId === target.systemId && p.ownerId && p.ownerId !== activePlayerId
        );
        if (hostileColony) {
          mission = 'attack';
          color = '#ef4444';
          label = 'Düşman Kolonisine Taarruz';
          targetName = hostileColony.name;
        } else if (target.systemId === 'sys_relay' && engineState.relay?.controllingPlayerId !== activePlayerId) {
          mission = 'attack';
          color = '#f59e0b';
          label = 'Nexus Röle Harekâtı';
          targetName = 'Nexus Rölesi';
        } else if (targetSys?.hasDebris && ((targetSys.hasDebris.ore || 0) > 0 || (targetSys.hasDebris.crystal || 0) > 0 || (targetSys.hasDebris.fuel || 0) > 0)) {
          mission = 'explore';
          color = '#06b6d4';
          label = 'Enkaz Kurtarma';
          targetName = `${targetSys.name} Enkazı`;
        } else if (
          (targetPlanet && targetPlanet.ownerId === activePlayerId && targetPlanet.id !== currentPlanet.id) ||
          Object.values(engineState.planets).some(
            (p) => p.systemId === target.systemId && p.ownerId === activePlayerId && p.id !== currentPlanet.id
          )
        ) {
          mission = 'transport';
          color = '#38bdf8';
          label = 'Dost Koloniye İntikal';
          targetName = targetPlanet?.name || targetSys?.name || 'Koloni';
        } else if (!engineState.players[activePlayerId]?.intel?.discoveredSystems?.[target.systemId] ||
                   engineState.players[activePlayerId]?.intel?.discoveredSystems?.[target.systemId] === 'unexplored') {
          mission = 'explore';
          color = '#10b981';
          label = 'Sistem Keşfi';
          targetName = targetSys?.name || 'Bilinmeyen Sistem';
        } else {
          mission = 'explore';
          color = '#10b981';
          label = 'Devriye';
        }
      }

      // 4. Dispatch the fleet
      const res = engineRef.current.dispatchCommand(activePlayerId, {
        type: 'DISPATCH_FLEET',
        originPlanetId: currentPlanet.id,
        targetSystemId: target.systemId,
        targetPlanetId: target.planetId || targetPlanet?.id,
        targetFleetId: target.fleetId,
        ships: selectedShips,
        cargo: {},
        mission,
      });

      if (res.success) {
        if (mission === 'attack' || mission === 'intercept') {
          sound.playLaser();
        } else {
          sound.playLaunch();
        }

        setEngineState({ ...engineRef.current.state });

        setTacticalToasts((prev) => [
          ...prev.slice(-3),
          {
            id: `toast_${Date.now()}`,
            text: `🎯 [${currentPlanet.name}] ➔ [${targetName}]: ${totalSelected} Gemi Yola Çıktı (${label})`,
            color,
            timestamp: Date.now(),
          },
        ]);

        return {
          success: true,
          color,
          mission,
          label,
        };
      } else {
        sound.playError();
        setTacticalToasts((prev) => [
          ...prev.slice(-3),
          {
            id: `toast_${Date.now()}`,
            text: `❌ Sevk Hatası: ${res.error || 'İntikal Reddedildi'}`,
            color: '#ef4444',
            timestamp: Date.now(),
          },
        ]);
        return false;
      }
    },
    [engineState, activePlanet, activePlayerId, directDispatchMode]
  );

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
        onOpenTraditions={() => setActiveLeftPanel((prev) => (prev === 'traditions' ? null : 'traditions'))}
        onOpenArchaeology={() => setActiveLeftPanel((prev) => (prev === 'archaeology' ? null : 'archaeology'))}
        onOpenTerraform={() => setActiveLeftPanel((prev) => (prev === 'terraform' ? null : 'terraform'))}
        onOpenTradeRoutes={() => setActiveLeftPanel((prev) => (prev === 'trade_routes' ? null : 'trade_routes'))}
        onOpenWarfare={() => setActiveLeftPanel((prev) => (prev === 'warfare' ? null : 'warfare'))}
        onOpenFederation={() => setActiveLeftPanel((prev) => (prev === 'federation' ? null : 'federation'))}
        onOpenMegacorp={() => setActiveLeftPanel((prev) => (prev === 'megacorp' ? null : 'megacorp'))}
        onOpenColossus={() => setActiveLeftPanel((prev) => (prev === 'colossus' ? null : 'colossus'))}
        onOpenSynthetics={() => setActiveLeftPanel((prev) => (prev === 'synthetics' ? null : 'synthetics'))}
        onOpenParagons={() => setActiveLeftPanel((prev) => (prev === 'paragons' ? null : 'paragons'))}
        onOpenHyperRelays={() => setActiveLeftPanel((prev) => (prev === 'hyperRelays' ? null : 'hyperRelays'))}
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
          onOpenShipDesigner={() => setActiveLeftPanel((prev) => (prev === 'ship_designer' ? null : 'ship_designer'))}
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
          onOpenMegastructures={() => setActiveLeftPanel((prev) => (prev === 'megastructures' ? null : 'megastructures'))}
          onOpenCouncil={() => setActiveLeftPanel((prev) => (prev === 'council' ? null : 'council'))}
          onOpenTraditions={() => setActiveLeftPanel((prev) => (prev === 'traditions' ? null : 'traditions'))}
          onOpenArchaeology={() => setActiveLeftPanel((prev) => (prev === 'archaeology' ? null : 'archaeology'))}
          onOpenTerraform={() => setActiveLeftPanel((prev) => (prev === 'terraform' ? null : 'terraform'))}
          onOpenTradeRoutes={() => setActiveLeftPanel((prev) => (prev === 'trade_routes' ? null : 'trade_routes'))}
          onOpenWarfare={() => setActiveLeftPanel((prev) => (prev === 'warfare' ? null : 'warfare'))}
          onOpenFederation={() => setActiveLeftPanel((prev) => (prev === 'federation' ? null : 'federation'))}
          onOpenMegacorp={() => setActiveLeftPanel((prev) => (prev === 'megacorp' ? null : 'megacorp'))}
          onOpenColossus={() => setActiveLeftPanel((prev) => (prev === 'colossus' ? null : 'colossus'))}
          onOpenSynthetics={() => setActiveLeftPanel((prev) => (prev === 'synthetics' ? null : 'synthetics'))}
          onOpenParagons={() => setActiveLeftPanel((prev) => (prev === 'paragons' ? null : 'paragons'))}
          onOpenHyperRelays={() => setActiveLeftPanel((prev) => (prev === 'hyperRelays' ? null : 'hyperRelays'))}
          hyperRelaysCount={Object.values(engineState.hyperRelays || {}).filter((r) => r.ownerId === activePlayerId).length}
          activeHighwayLinksCount={(() => {
            const relays = engineState.hyperRelays || {};
            let count = 0;
            const proc = new Set<string>();
            for (const l of engineState.map.lanes) {
              const k = `${l.fromSystemId}_${l.toSystemId}`;
              if (proc.has(k)) continue;
              proc.add(k);
              proc.add(`${l.toSystemId}_${l.fromSystemId}`);
              if (relays[l.fromSystemId] && !relays[l.fromSystemId].isConstructing && relays[l.toSystemId] && !relays[l.toSystemId].isConstructing) {
                count++;
              }
            }
            return count;
          })()}
          onOpenShadowOps={() => setActiveLeftPanel((prev) => (prev === 'shadowOps' ? null : 'shadowOps'))}
          shadowOpsTier={engineState.intelligenceDirectorates?.[activePlayerId]?.tier || 1}
          activeShadowOpsCount={Object.values(engineState.shadowOperations || {}).filter((o) => o.initiatorId === activePlayerId).length}
          onOpenGroundWarfare={() => setActiveLeftPanel((prev) => (prev === 'groundWarfare' ? null : 'groundWarfare'))}
          activeGroundBattlesCount={Object.values(engineState.groundBattles || {}).filter((b) => b.status === 'active').length}
          totalArmiesCount={Object.values(engineState.armies || {}).filter((a) => a.ownerId === activePlayerId).length}
          onOpenEnclaves={() => setActiveLeftPanel((prev) => (prev === 'enclaves' ? null : 'enclaves'))}
          activeEnclaveContractsCount={activePlayer?.activeEnclaveContracts?.length || 0}
          hasShroudBoon={Boolean(activePlayer?.shroudBoon)}
          paragonsCount={activePlayer?.paragonIds?.length || 0}
          availableParagonsCount={engineState.galacticParagonPool?.length || 0}
          isColossusActive={isColossusActive}
          isColossusCharging={isColossusCharging}
          syntheticPopsCount={engineState.synthetics?.[activePlayerId]?.totalSyntheticPops || 0}
          syntheticUprisingRisk={engineState.synthetics?.[activePlayerId]?.machineUprisingRisk || 0}
          activeBranchOfficesCount={Object.values(engineState.branchOffices || {}).filter((b) => b.corporationId === activePlayerId).length}
          readyFuturesCount={Object.values(engineState.commodityFutures || {}).filter((f) => f.buyerId === activePlayerId && f.isDelivered && !f.isClaimed).length}
          federationLevel={activePlayer?.federationId ? engineState.federations?.[activePlayer.federationId]?.centralizationLevel : undefined}
          activeFederationVotesCount={activePlayer?.federationId && engineState.federations?.[activePlayer.federationId]?.activeVote ? 1 : 0}
          collectedTradeValue={engineState.tradeStates?.[activePlayerId]?.totalCollectedTV}
          hasTradePiracyThreat={Boolean((engineState.tradeStates?.[activePlayerId]?.totalLostTV || 0) > 0)}
          activeWarsCount={
            Object.values(engineState.wars || {}).filter(
              (w) => w.status === 'active' && (w.attackerId === activePlayerId || w.defenderId === activePlayerId)
            ).length
          }
          onOpenCrisis={() => setActiveLeftPanel((prev) => (prev === 'crisis' ? null : 'crisis'))}
          onOpenGallery={() => setActiveLeftPanel((prev) => (prev === 'gallery' ? null : 'gallery'))}
          onOpenOrientation={() => setIsOrientationOpen(true)}
          isCrisisActive={Boolean(engineState.crisis && engineState.crisis.stage !== 'dormant' && engineState.crisis.stage !== 'defeated')}
          crisisStage={engineState.crisis?.stage}
          movingFleetsCount={movingFleetsCount}
          threatsCount={threatsCount}
          unreadBattlesCount={engineState.battleReports.length}
          pendingTransmissionsCount={pendingTransmissionsCount}
          unclaimedDirectivesCount={unclaimedDirectivesCount}
          isRelayControlled={engineState.relay.controllingPlayerId === activePlayerId}
          isSenateSessionActive={!!engineState.senate?.currentSession}
          activeMegastructuresCount={Object.keys(engineState.megastructures || {}).length}
          stabilityPercent={engineState.councils?.[activePlayerId]?.stabilityPercent}
          availableTraditionPerksCount={engineState.traditions?.[activePlayerId]?.availablePerkSlots || 0}
          activeTerraformingCount={
            Object.values(engineState.planets).filter((p) => p.ownerId === activePlayerId && !!p.terraformingQueue).length
          }
          archaeologyPendingCount={
            Object.values(engineState.archaeologySites || {}).filter(
              (s) => s.status === 'choice_pending' && s.excavatingPlayerId === activePlayerId
            ).length
          }
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
                onOpenTerraform={() => setActiveLeftPanel('terraform')}
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
                myShipLoadouts={engineState.shipLoadouts?.[activePlayerId]}
                onSetShipLoadout={handleSetShipLoadout}
                onRefitShips={handleRefitShips}
                onOpenShipDesigner={() => setActiveLeftPanel('ship_designer')}
              />
            )}

            {activeLeftPanel === 'ship_designer' && (
              <ShipDesignerModal
                isOpen={true}
                isDocked={true}
                onClose={() => setActiveLeftPanel(null)}
                state={engineState}
                activePlayerId={activePlayerId}
                activePlanet={activePlanet}
                onSetShipLoadout={handleSetShipLoadout}
                onRefitShips={handleRefitShips}
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
                onEstablishNetwork={handleEstablishSpyNetwork}
                onRecallNetwork={handleRecallSpyNetwork}
                onAssignEnvoy={handleAssignSpymasterEnvoy}
                onAcquireAsset={handleAcquireSpyAsset}
                onLaunchCovertOp={handleLaunchCovertOperation}
                onCancelCovertOp={handleCancelCovertOperation}
                onSetCounterStance={handleSetCounterEspionageStance}
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
            onOpenCrisis={() => setActiveLeftPanel('crisis')}
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
            onDirectOrder={handleDirectOrder}
            activePlanetId={activePlanet?.id}
            onSelectPlanetById={(planetId) => {
              setActivePlanetId(planetId);
              const p = engineState.planets[planetId];
              if (p) {
                setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId: p.id });
              }
            }}
            directDispatchMode={directDispatchMode}
            onSetDirectDispatchMode={setDirectDispatchMode}
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

          {/* Tactical RTS Order Feedback Toast Overlay */}
          {tacticalToasts.length > 0 && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1.5 pointer-events-none items-center">
              {tacticalToasts.map((toast) => (
                <div
                  key={toast.id}
                  style={{ borderColor: `${toast.color}77` }}
                  className="px-3.5 py-1.5 rounded-sm bg-[#06101c]/95 border shadow-2xl backdrop-blur-md font-mono text-xs text-slate-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: toast.color }} />
                  <span className="font-semibold">{toast.text}</span>
                </div>
              ))}
            </div>
          )}

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

      {/* Megastructures & Subspace Gateway Network Modal */}
      <MegastructureModal
        isOpen={activeLeftPanel === 'megastructures'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        onBuildMegastructure={handleBuildMegastructure}
        onUpgradeMegastructure={handleUpgradeMegastructure}
        onConstructGateway={handleConstructGateway}
        onActivateGateway={handleActivateGateway}
      />

      {/* Imperial Council & Factions Modal (Phase 14) */}
      <CouncilModal
        isOpen={activeLeftPanel === 'council'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        onAppointCouncilor={handleAppointCouncilor}
        onDismissCouncilor={handleDismissCouncilor}
        onRecruitCouncilLeader={handleRecruitCouncilLeader}
        onPromoteFactionAgenda={handlePromoteFactionAgenda}
      />

      {/* Galactic Crisis & Void Incursions Modal (Phase 16) */}
      <CrisisModal
        isOpen={activeLeftPanel === 'crisis'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        activePlanetId={activePlanet?.id}
        onPurifyPlanet={handlePurifyPlanet}
        onDonateToGDF={handleDonateToGDF}
        onDispatchGDFFleet={handleDispatchGDFFleet}
        onAssaultAnchor={handleAssaultAnchor}
        onAssaultRift={handleAssaultRift}
        onTriggerTestCrisis={handleTriggerTestCrisis}
      />

      {/* Empire Traditions, Cultural Unity & Ascension Perks Modal (Phase 17) */}
      <TraditionsModal
        isOpen={activeLeftPanel === 'traditions'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        onAdoptTradition={handleAdoptTradition}
        onSelectAscensionPerk={handleSelectAscensionPerk}
      />

      {/* Archaeological Excavation Sites & Relic Triumphs Modal (Phase 18) */}
      <ArchaeologyModal
        isOpen={activeLeftPanel === 'archaeology'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        activePlayerId={activePlayerId}
        onExcavateSite={handleExcavateSite}
        onAbandonExcavation={handleAbandonExcavation}
        onResolveSiteChoice={handleResolveSiteChoice}
        onActivateRelicTriumph={handleActivateRelicTriumph}
        onReverseEngineer={handleReverseEngineer}
      />

      {/* Planetary Terraforming, Blocker Clearance & Ecological Decisions Modal (Phase 19) */}
      {activeLeftPanel === 'terraform' && (
        <TerraformModal
          state={engineState}
          activePlayerId={activePlayerId}
          initialPlanetId={activePlanet?.id}
          onClose={() => setActiveLeftPanel(null)}
          onStartTerraforming={handleStartTerraforming}
          onCancelTerraforming={handleCancelTerraforming}
          onEnactDecision={handleEnactDecision}
          onClearBlocker={handleClearBlocker}
        />
      )}

      {/* Galactic Trade Networks & Piracy Modal (Phase 20) */}
      {activeLeftPanel === 'trade_routes' && (
        <TradeRoutesModal
          isOpen={true}
          onClose={() => setActiveLeftPanel(null)}
          state={engineState}
          playerId={activePlayerId}
          onSetTradePolicy={handleSetTradePolicy}
          onProposeCommercialPact={handleProposeCommercialPact}
          onBreakCommercialPact={handleBreakCommercialPact}
          onDispatchPatrol={handleDispatchPatrol}
          onSelectSystem={(systemId) => {
            setSelectedTarget({ type: 'system', systemId });
            setActiveLeftPanel(null);
          }}
        />
      )}

      {/* Galactic Warfare, Casus Belli & Vassalage Modal (Phase 21) */}
      {activeLeftPanel === 'warfare' && (
        <WarfareModal
          isOpen={true}
          onClose={() => setActiveLeftPanel(null)}
          state={engineState}
          playerId={activePlayerId}
          onDeclareWar={handleDeclareWar}
          onOfferPeace={handleOfferPeace}
          onSetSubjectTerms={handleSetSubjectTerms}
          onReleaseSubject={handleReleaseSubject}
          onIntegrateSubject={handleIntegrateSubject}
          onSelectSystem={(systemId) => {
            setSelectedTarget({ type: 'system', systemId });
            setActiveLeftPanel(null);
          }}
        />
      )}

      {/* Galactic Federations, Federal Fleet, Cohesion & Laws Modal (Phase 22) */}
      {activeLeftPanel === 'federation' && (
        <FederationModal
          isOpen={true}
          onClose={() => setActiveLeftPanel(null)}
          state={engineState}
          playerId={activePlayerId}
          onFormFederation={handleFormFederation}
          onInviteToFederation={handleInviteToFederation}
          onRespondFederationInvite={handleRespondFederationInvite}
          onLeaveFederation={handleLeaveFederation}
          onProposeFederationLaw={handleProposeFederationLaw}
          onVoteFederationLaw={handleVoteFederationLaw}
          onAssignFederationEnvoys={handleAssignFederationEnvoys}
          onBuildFederalShip={handleBuildFederalShip}
          onDispatchFederalFleet={handleDispatchFederalFleet}
          onSelectSystem={(systemId) => {
            setSelectedTarget({ type: 'system', systemId });
            setActiveLeftPanel(null);
          }}
        />
      )}

      {/* Galactic Megacorporations, Branch Offices, Holdings & Commodity Futures Modal (Phase 24) */}
      {activeLeftPanel === 'megacorp' && (
        <MegacorpModal
          isOpen={true}
          onClose={() => setActiveLeftPanel(null)}
          state={engineState}
          playerId={activePlayerId}
          onEstablishBranchOffice={handleEstablishBranchOffice}
          onCloseBranchOffice={handleCloseBranchOffice}
          onBuildHolding={handleBuildHolding}
          onDismantleHolding={handleDismantleHolding}
          onPurchaseFutures={handlePurchaseFutures}
          onClaimFutures={handleClaimFutures}
          onConvertToMegacorp={handleConvertToMegacorp}
          onSelectPlanet={(planetId: string) => {
            const p = engineState.planets[planetId];
            if (p) {
              setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId });
              setActiveLeftPanel('planets');
            }
          }}
        />
      )}

      {/* Colossus Superweapons & World Killers Modal (Phase 25) */}
      <ColossusModal
        isOpen={activeLeftPanel === 'colossus'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onBuildColossus={handleBuildColossus}
        onMoveColossus={handleMoveColossus}
        onCommenceCharging={handleCommenceColossusCharging}
        onCancelFiring={handleCancelColossusFiring}
        onRefitWeapon={handleRefitColossusWeapon}
        onDismantleColossus={handleDismantleColossus}
        onSelectSystem={(systemId) => {
          setSelectedTarget({ type: 'system', systemId });
          setActiveLeftPanel(null);
        }}
      />

      {/* Synthetic Dawn, Cybernetic Ascension & Machine Consciousness Modal (Phase 26) */}
      <SyntheticDawnModal
        isOpen={activeLeftPanel === 'synthetics'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onAssemblePop={handleAssembleSyntheticPop}
        onDismantlePop={handleDismantleSyntheticPop}
        onSetAIPolicy={handleSetAIPolicy}
        onInitiateAscension={handleInitiateSyntheticAscension}
        onSuppressUprising={handleSuppressSyntheticUprising}
        onConvertToMachineWorld={handleConvertToMachineWorld}
        onSelectPlanet={(planetId) => {
          const p = engineState.planets[planetId];
          if (p) {
            setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId });
            setActiveLeftPanel('planets');
          }
        }}
      />

      {/* Paragon Leaders, Renowned Heroes & Council Destiny Modal (Phase 27) */}
      <ParagonModal
        isOpen={activeLeftPanel === 'paragons'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onRecruitParagon={handleRecruitParagon}
        onAssignParagon={handleAssignParagon}
        onUnassignParagon={handleUnassignParagon}
        onDismissParagon={handleDismissParagon}
        onCommissionFlagship={handleCommissionParagonFlagship}
      />

      {/* Hyper Relays, Transit Highway Networks & Subspace Logistics Modal (Phase 28) */}
      <HyperRelayModal
        isOpen={activeLeftPanel === 'hyperRelays'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onConstructRelay={handleConstructHyperRelay}
        onSetPolicy={handleSetHyperRelayPolicy}
        onDismantleRelay={handleDismantleHyperRelay}
      />

      {/* Galactic Intelligence Directorate, False Flag Operations & Shadow Coups Modal (Phase 29) */}
      <ShadowOpsModal
        isOpen={activeLeftPanel === 'shadowOps'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onUpgradeDirectorate={handleUpgradeDirectorate}
        onRecruitAgent={handleRecruitAgent}
        onAssignAgent={handleAssignAgent}
        onDismissAgent={handleDismissAgent}
        onDispatchFalseFlagFleet={handleDispatchFalseFlagFleet}
        onLaunchShadowOp={handleLaunchShadowOp}
      />

      {/* Planetary Invasions, Ground Armies & Orbital Bombardment Modal (Phase 30) */}
      <GroundInvasionModal
        isOpen={activeLeftPanel === 'groundWarfare'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onRecruitArmy={handleRecruitArmy}
        onEmbarkArmies={handleEmbarkArmies}
        onLandArmies={handleLandArmies}
        onSetBombardmentStance={handleSetBombardmentStance}
        onDismissArmy={handleDismissArmy}
        onLiberatePlanet={handleLiberatePlanet}
      />

      {/* Galactic Enclaves, Caravaneers & Shroud Factions Modal (Phase 31) */}
      <EnclavesModal
        isOpen={activeLeftPanel === 'enclaves'}
        onClose={() => setActiveLeftPanel(null)}
        state={engineState}
        playerId={activePlayerId}
        onInteractEnclave={handleInteractEnclave}
        onBuyCaravanReliquary={handleBuyCaravanReliquary}
        onGambleCaravanSlots={handleGambleCaravanSlots}
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
