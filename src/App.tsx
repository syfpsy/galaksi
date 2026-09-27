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
import { ArtGalleryModal } from './ui/components/ArtGalleryModal';
import { CombatReplayModal } from './ui/components/CombatReplayModal';
import { CommandPanel } from './ui/components/CommandPanel';
import { EventFeed } from './ui/components/EventFeed';
import { GalaxyMap } from './ui/components/GalaxyMap';
import { IncomingThreatBanner } from './ui/components/IncomingThreatBanner';
import { PlanetPanel } from './ui/components/PlanetPanel';
import { RelayModal } from './ui/components/RelayModal';
import { ResearchModal } from './ui/components/ResearchModal';
import { ShipyardModal } from './ui/components/ShipyardModal';
import { SystemInspectionModal } from './ui/components/SystemInspectionModal';
import { TopBar } from './ui/components/TopBar';
import { StellarisLeftRail } from './ui/components/StellarisLeftRail';
import { StellarisOutliner } from './ui/components/StellarisOutliner';
import { SelectedTarget } from './ui/types';
import { sound } from './ui/sound';

export function App() {
  // Engine Instance reference
  const engineRef = useRef<GameEngine | null>(null);
  const botsRef = useRef<IBotAgent[]>([]);
  const lastBotUpdateMsRef = useRef<number>(0);

  // Engine state mirror for React rendering
  const [engineState, setEngineState] = useState<GameEngine['state'] | null>(null);

  // Active user selection state
  const [activePlayerId, setActivePlayerId] = useState<string>('player_human');
  const [activePlanetId, setActivePlanetId] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);

  // Simulation controls (default 1x for real-time slow persistent pace, up to 300x)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [godMode, setGodMode] = useState<boolean>(false);

  // Drawers & Stellaris Layout
  const [isPlanetPanelOpen, setIsPlanetPanelOpen] = useState<boolean>(false);
  const [isCommandPanelOpen, setIsCommandPanelOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(sound.isMuted);

  // Modals
  const [isShipyardOpen, setIsShipyardOpen] = useState<boolean>(false);
  const [isResearchOpen, setIsResearchOpen] = useState<boolean>(false);
  const [isBattlesOpen, setIsBattlesOpen] = useState<boolean>(false);
  const [isRelayOpen, setIsRelayOpen] = useState<boolean>(false);
  const [isAllianceOpen, setIsAllianceOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [inspectedSystemId, setInspectedSystemId] = useState<string | null>(null);

  // Hotkeys for Stellaris navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'F1') {
        e.preventDefault();
        sound.playClick();
        setIsPlanetPanelOpen((prev) => !prev);
      } else if (e.key === 'F2') {
        e.preventDefault();
        sound.playClick();
        setIsShipyardOpen((prev) => !prev);
      } else if (e.key === 'F3') {
        e.preventDefault();
        sound.playClick();
        setIsResearchOpen((prev) => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        sound.playClick();
        setIsCommandPanelOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isPlanetPanelOpen || isCommandPanelOpen) {
          setIsPlanetPanelOpen(false);
          setIsCommandPanelOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlanetPanelOpen, isCommandPanelOpen]);

  // Initialize engine & players
  const initGame = useCallback((seed: number = 42) => {
    const engine = new GameEngine(seed);
    const bots: IBotAgent[] = [];

    // Human player
    const { homeworld: humanHw } = engine.addPlayer('player_human', 'Komutan Shepard', '#00f3ff');

    // 4 Archetype bots
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

    engineRef.current = engine;
    botsRef.current = bots;
    lastBotUpdateMsRef.current = 0;

    setActivePlanetId(humanHw.id);
    setSelectedTarget({ type: 'system', systemId: humanHw.systemId });
    setEngineState({ ...engine.state });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Main simulation tick loop
  useEffect(() => {
    if (!isPlaying) return;

    const realIntervalMs = 50; // 20 ticks per second
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const simDeltaMs = realIntervalMs * timeScale;
      engine.tick(simDeltaMs);

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

  if (!engineState) return null;

  // Active player owned planets
  const myPlanets = Object.values(engineState.planets).filter(
    (p) => p.ownerId === activePlayerId
  );
  const activePlanet = myPlanets.find((p) => p.id === activePlanetId) || myPlanets[0];
  const activePlayer = engineState.players[activePlayerId];

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
        onOpenShipyard={() => setIsShipyardOpen(true)}
        onOpenResearch={() => setIsResearchOpen(true)}
        onOpenBattles={() => setIsBattlesOpen(true)}
        onOpenRelay={() => setIsRelayOpen(true)}
        onOpenAlliance={() => setIsAllianceOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onToggleVacationMode={handleToggleVacationMode}
        onReset={() => initGame(Date.now())}
      />

      {/* Main Game Interface (Stellaris Left Rail, Wide Center Galaxy Map, Stellaris Outliner, Sliding Drawers) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost: Stellaris Vertical Navigation Icon Rail */}
        <StellarisLeftRail
          activePlayerColor={activePlayer?.color || '#00f3ff'}
          isPlanetPanelOpen={isPlanetPanelOpen}
          onTogglePlanetPanel={() => setIsPlanetPanelOpen(!isPlanetPanelOpen)}
          isCommandPanelOpen={isCommandPanelOpen}
          onToggleCommandPanel={() => setIsCommandPanelOpen(!isCommandPanelOpen)}
          onOpenShipyard={() => setIsShipyardOpen(true)}
          onOpenResearch={() => setIsResearchOpen(true)}
          onOpenBattles={() => setIsBattlesOpen(true)}
          onOpenRelay={() => setIsRelayOpen(true)}
          onOpenAlliance={() => setIsAllianceOpen(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
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

        {/* Planet Infrastructure Drawer (Floating next to Left Rail) */}
        {isPlanetPanelOpen && (
          <div className="absolute left-14 top-0 bottom-0 z-30 shadow-2xl animate-fade-in flex">
            <PlanetPanel
              planets={myPlanets}
              activePlanetId={activePlanet?.id || ''}
              onSelectPlanet={setActivePlanetId}
              onUpgradeBuilding={handleUpgradeBuilding}
              onSetStance={handleSetStance}
              currentTimeMs={engineState.timeMs}
              onOpenShipyard={() => setIsShipyardOpen(true)}
              onOpenResearch={() => setIsResearchOpen(true)}
              onClose={() => setIsPlanetPanelOpen(false)}
            />
          </div>
        )}

        {/* Center: Live Galaxy Vector Map & 2.5D Orrery (Occupies Full Center Stage!) */}
        <main className="flex-1 h-full relative overflow-hidden">
          {/* Incoming Threat Banner Alert */}
          <IncomingThreatBanner
            state={engineState}
            activePlayerId={activePlayerId}
            onTargetThreat={(threat) => {
              handleTargetThreat(threat);
              setIsCommandPanelOpen(true);
            }}
            onEvacuatePlanet={(pId) => {
              handleEvacuatePlanet(pId);
              setIsCommandPanelOpen(true);
            }}
          />

          <GalaxyMap
            state={engineState}
            activePlayerId={activePlayerId}
            selectedTarget={selectedTarget}
            godMode={godMode}
            onSelectSystem={(systemId) => {
              setSelectedTarget({ type: 'system', systemId });
            }}
            onSelectFleet={(fleetId) => {
              const fl = engineState.fleets[fleetId];
              if (fl) {
                setSelectedTarget({
                  type: 'fleet',
                  systemId: fl.targetSystemId,
                  fleetId,
                });
                setIsCommandPanelOpen(true);
              }
            }}
            onSelectPlanet={(systemId, planetId) => {
              setSelectedTarget({ type: 'planet', systemId, planetId });
              if (engineState.planets[planetId]?.ownerId === activePlayerId) {
                setActivePlanetId(planetId);
                setIsPlanetPanelOpen(true);
              } else {
                setIsCommandPanelOpen(true);
              }
            }}
            onInspectSystem={(systemId) => setInspectedSystemId(systemId)}
          />

          {/* Sector Real-Time Communications & Alerts Ticker */}
          <EventFeed events={engineState.eventLog} />
        </main>

        {/* Fleet Dispatch & Target Command Deck (Floating Slide-over Drawer) */}
        {isCommandPanelOpen && (
          <div className="absolute right-72 top-0 bottom-0 z-30 shadow-2xl animate-fade-in flex">
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
          onSelectPlanet={(pId) => {
            setActivePlanetId(pId);
            const p = engineState.planets[pId];
            if (p) {
              setSelectedTarget({ type: 'planet', systemId: p.systemId, planetId: p.id });
            }
            setIsPlanetPanelOpen(true);
          }}
          onSelectFleet={(fleetId) => {
            const fl = engineState.fleets[fleetId];
            if (fl) {
              setSelectedTarget({ type: 'fleet', systemId: fl.targetSystemId, fleetId: fl.id });
              setIsCommandPanelOpen(true);
            }
          }}
          onSelectSystem={(systemId) => {
            setSelectedTarget({ type: 'system', systemId });
          }}
          currentTimeMs={engineState.timeMs}
        />
      </div>

      {/* Shipyard Modal */}
      <ShipyardModal
        planet={activePlanet}
        isOpen={isShipyardOpen}
        onClose={() => setIsShipyardOpen(false)}
        onBuildShip={handleBuildShip}
        currentTimeMs={engineState.timeMs}
      />

      {/* Research Modal */}
      <ResearchModal
        player={activePlayer}
        homeworld={myPlanets.find((p) => p.isHomeworld) || myPlanets[0]}
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        onStartResearch={handleStartResearch}
        currentTimeMs={engineState.timeMs}
      />

      {/* Combat Replay Modal */}
      <CombatReplayModal
        reports={engineState.battleReports}
        isOpen={isBattlesOpen}
        onClose={() => setIsBattlesOpen(false)}
      />

      {/* Nexus Relay Modal */}
      <RelayModal
        state={engineState}
        isOpen={isRelayOpen}
        onClose={() => setIsRelayOpen(false)}
        onAssaultRelay={handleAssaultRelay}
      />

      {/* Alliance Modal */}
      <AllianceModal
        state={engineState}
        activePlayerId={activePlayerId}
        isOpen={isAllianceOpen}
        onClose={() => setIsAllianceOpen(false)}
        onCreateAlliance={handleCreateAlliance}
        onJoinAlliance={handleJoinAlliance}
        onLeaveAlliance={handleLeaveAlliance}
        onSupportAlly={handleSupportAlly}
      />

      {/* System Orbital Inspection Modal */}
      <SystemInspectionModal
        system={inspectedSystemId ? engineState.map.systems[inspectedSystemId] : null}
        state={engineState}
        activePlayerId={activePlayerId}
        isOpen={!!inspectedSystemId}
        onClose={() => setInspectedSystemId(null)}
        onSelectSlot={handleSelectSlot}
      />

      {/* Magnific Concept Art Gallery Modal */}
      <ArtGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
}
