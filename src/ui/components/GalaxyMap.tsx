import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Globe,
  Lock,
  Minus,
  Orbit,
  Pickaxe,
  Plus,
  Radio,
  Rocket,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { GameState, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import { sound } from '../sound';
import { GalaxyScene25D, MapMode, DirectOrderPayload, TacticalPingResult } from './GalaxyScene25D';

interface GalaxyMapProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  godMode: boolean;
  onSelectSystem: (systemId: string) => void;
  onSelectFleet: (fleetId: string) => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onInspectSystem?: (systemId: string) => void;
  onRecallFleet?: (fleetId: string) => void;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onOpenTransitRadar?: () => void;
  onContextMenuTarget?: (target: { type: 'system' | 'planet' | 'fleet'; systemId: string; planetId?: string; fleetId?: string }) => void;
  onDirectOrder?: (payload: DirectOrderPayload) => boolean | TacticalPingResult;
  activePlanetId?: string;
  onSelectPlanetById?: (planetId: string) => void;
  directDispatchMode?: 'all' | 'half' | 'scout';
  onSetDirectDispatchMode?: (mode: 'all' | 'half' | 'scout') => void;
  onFocusHomeworld?: () => void;
  onFocusRelay?: () => void;
  onCycleColonies?: () => void;
  onOpenBattles?: () => void;
  onOpenStarbase?: (systemId: string) => void;
}

export const GalaxyMap: React.FC<GalaxyMapProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  godMode,
  onSelectSystem,
  onSelectFleet,
  onSelectPlanet,
  onInspectSystem,
  onRecallFleet,
  onOpenShipyard,
  onOpenResearch,
  onOpenTransitRadar,
  onContextMenuTarget,
  onDirectOrder,
  activePlanetId,
  onSelectPlanetById,
  directDispatchMode = 'all',
  onSetDirectDispatchMode,
  onFocusHomeworld,
  onFocusRelay,
  onCycleColonies,
  onOpenBattles,
  onOpenStarbase,
}) => {
  const activePlayer = state.players[activePlayerId];

  // Research Gating: Deep Space Sensors Lv. 1 unlocks the interstellar galaxy map!
  const isGalaxyUnlocked = useMemo(() => {
    if (godMode) return true;
    if (!activePlayer) return true;
    if ((activePlayer.research?.sensors || 0) >= 1) return true;
    const totalSystems = Object.keys(state.map.systems).length;
    const discoveredCount = Object.values(activePlayer.intel?.discoveredSystems || {}).filter(
      (lvl) => lvl !== 'unexplored'
    ).length;
    if (discoveredCount >= totalSystems && totalSystems > 1) return true;
    return false;
  }, [godMode, activePlayer, state.map.systems]);

  // View mode: 'galaxy' (Macro Sector / Cluster) or 'system' (Three.js 2.5D In-System Orrery)
  // When galaxy is locked (no sensors researched), start strictly in system mode!
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>(() => {
    return isGalaxyUnlocked ? 'galaxy' : 'system';
  });

  const [focusedSystemId, setFocusedSystemId] = useState<string>(() => {
    return (
      selectedTarget?.systemId ||
      Object.values(state.planets).find((p) => p.ownerId === activePlayerId)?.systemId ||
      'sys_relay'
    );
  });

  const [showProjections, setShowProjections] = useState<boolean>(true);
  const [hoveredPlanetSlotId, setHoveredPlanetSlotId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('default');
  const [zoom, setZoom] = useState(1);

  // Live sensor tech unlock celebration tracking
  const prevSensorsRef = useRef<number>(activePlayer?.research?.sensors || 0);
  const [showSensorsUnlockedModal, setShowSensorsUnlockedModal] = useState<boolean>(false);
  const [showSensorLockedToast, setShowSensorLockedToast] = useState<boolean>(false);

  useEffect(() => {
    const curSensors = activePlayer?.research?.sensors || 0;
    if (curSensors >= 1 && prevSensorsRef.current < 1) {
      sound.playTech();
      sound.playWarp();
      setShowSensorsUnlockedModal(true);
    }
    prevSensorsRef.current = curSensors;
  }, [activePlayer?.research?.sensors]);

  // Enforce system view if galaxy map is locked
  useEffect(() => {
    if (!isGalaxyUnlocked && viewMode !== 'system') {
      setViewMode('system');
    }
  }, [isGalaxyUnlocked, viewMode]);

  useEffect(() => {
    if (showSensorLockedToast) {
      const timer = setTimeout(() => setShowSensorLockedToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showSensorLockedToast]);

  // Calculate sensor coverage for active player
  const sensorCoverage = useMemo(() => {
    return getPlayerSensorCoverage(state, activePlayerId);
  }, [state, activePlayerId]);

  // Active player colonies and fleet capacity for RTS Direct Orders
  const playerColonies = useMemo(() => {
    return Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  }, [state.planets, activePlayerId]);

  const activeColony = useMemo(() => {
    return (
      playerColonies.find((p) => p.id === activePlanetId) ||
      playerColonies[0] ||
      null
    );
  }, [playerColonies, activePlanetId]);

  const garrisonFleetCount = useMemo(() => {
    if (!activeColony || !activeColony.garrison) return 0;
    return Object.values(activeColony.garrison).reduce((acc, count) => acc + (count || 0), 0);
  }, [activeColony]);

  // Systems intel mapping
  const systems = useMemo(() => {
    return Object.values(state.map.systems);
  }, [state.map.systems]);

  // Current focused system for system view
  const activeSystem = useMemo(() => {
    return state.map.systems[focusedSystemId] || systems[0];
  }, [state.map.systems, focusedSystemId, systems]);

  // Real-time planetary orbits for focused system (for telemetry HUD card)
  const systemPlanetOrbits = useMemo(() => {
    if (viewMode !== 'system') return [];
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
  }, [viewMode, activeSystem, state.timeMs, state.planets, state.players]);

  // Handle switching into system view
  const enterSystemView = (systemId: string) => {
    sound.playWarp();
    setFocusedSystemId(systemId);
    setViewMode('system');
    setZoom(1);
    onSelectSystem(systemId);
  };

  // Sync focusedSystemId when selectedTarget changes externally
  useEffect(() => {
    if (selectedTarget?.systemId && selectedTarget.systemId !== focusedSystemId) {
      setFocusedSystemId(selectedTarget.systemId);
    }
  }, [selectedTarget?.systemId, focusedSystemId]);

  // Keyboard shortcut M: Toggle Galaxy View <-> System View (Stellaris standard)
  // Escape: Return to Galaxy View if currently in System View
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (!isGalaxyUnlocked) {
          sound.playWarning();
          setShowSensorLockedToast(true);
          return;
        }
        sound.playClick();
        if (viewMode === 'system') {
          setViewMode('galaxy');
        } else {
          enterSystemView(focusedSystemId);
        }
      } else if (e.key === 'Escape' && viewMode === 'system') {
        e.preventDefault();
        if (!isGalaxyUnlocked) {
          sound.playWarning();
          setShowSensorLockedToast(true);
          return;
        }
        sound.playClick();
        setViewMode('galaxy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, focusedSystemId, isGalaxyUnlocked]);

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

      {/* 2.5D WebGL Three.js Scene Engine (Exclusive Map Engine) */}
      <div className="absolute inset-0 z-0">
        <GalaxyScene25D
          key={`scene_${state.seed || 42}_${Object.keys(state.map.systems).length}`}
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
          isGalaxyUnlocked={isGalaxyUnlocked}
          onSelectSystem={(sysId) => {
            setFocusedSystemId(sysId);
            onSelectSystem(sysId);
          }}
          onEnterSystemView={enterSystemView}
          onExitSystemView={() => {
            if (!isGalaxyUnlocked) {
              sound.playWarning();
              setShowSensorLockedToast(true);
              return;
            }
            sound.playClick();
            setViewMode('galaxy');
          }}
          onSelectPlanet={onSelectPlanet}
          onSelectFleet={onSelectFleet}
          onHoverPlanet={setHoveredPlanetSlotId}
          onContextMenuTarget={onContextMenuTarget}
          onDirectOrder={onDirectOrder}
          mapMode={mapMode}
          onOpenBattles={onOpenBattles}
          onOpenStarbase={onOpenStarbase}
        />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING HUD CONTROLS & STELLARIS-STYLE VIEW SWITCHER                    */}
      {/* ========================================================================= */}

      {/* Top Left: Sleek Stellaris System Breadcrumb Badge (Only in system view) */}
      {viewMode === 'system' && (
        <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
          <div className="stellaris-resource-pod px-3 py-1.5 rounded-sm flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span className="stellaris-gold font-display font-bold text-xs uppercase tracking-widest">
              {activeSystem.name} SİSTEMİ
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded-sm border border-cyan-500/30">
              {activeSystem.slots.length} Yörünge Cismi
            </span>
          </div>
        </div>
      )}

      {/* Top Right: In-System Planetary Telemetry HUD Card (When Hovering or Selected) */}
      {viewMode === 'system' && (hoveredPlanetSlotId || (selectedTarget?.type === 'planet' && selectedTarget.systemId === activeSystem.id)) && (
        <div className="absolute top-4 right-4 w-80 stellaris-item-card rounded-sm p-3 shadow-2xl z-20 font-mono text-xs animate-in fade-in duration-150">
          {(() => {
            const targetId = hoveredPlanetSlotId || (selectedTarget?.type === 'planet' ? selectedTarget.planetId : null);
            const item = systemPlanetOrbits.find((p) => p.slot.planetId === targetId);
            if (!item) return null;
            const { slot, orbit, planetObj, owner } = item;
            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#18374b] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: owner?.color || '#38bdf8' }} />
                    <span className="font-bold text-slate-100 font-display text-sm tracking-wide">
                      {slot.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 uppercase px-1.5 py-0.5 bg-cyan-950/60 rounded-sm border border-cyan-500/30">
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
                    <span className="text-cyan-400">{orbit.speedDegPerHour}° / saat</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Yıldız Mesafesi</span>
                    <span className="text-slate-200">{orbit.auDistance} AU</span>
                  </div>
                </div>

                {/* 2h, 6h, 12h Orbital Forecast Table */}
                <div className="pt-1.5 border-t border-[#18374b]">
                  <span className="text-[9.5px] text-[#e5c578] block mb-1">🔭 Gelecek Yörünge Projeksiyonları</span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                    {orbit.projections.map((p) => (
                      <div key={`proj_${p.hoursAhead}`} className="bg-[#060c14] border border-[#18374b] rounded-sm py-1 px-0.5">
                        <span className="text-slate-500 block text-[9px]">+{p.hoursAhead}s</span>
                        <span className="text-cyan-400 font-bold">{p.angleDeg}°</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1 border-t border-[#18374b] flex items-center justify-between text-[10px]">
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
                    className="w-full mt-2 py-1.5 px-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 font-mono font-bold text-xs rounded-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
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
                    className="w-full mt-2 py-1.5 px-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 hover:border-rose-400 text-rose-300 font-mono font-bold text-xs rounded-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
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
                    className="w-full mt-2 py-1.5 px-2 stellaris-btn-metallic text-cyan-300 font-mono font-bold text-xs rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* Top Center: Subspace Sensor Lock Banner (When Sensors tech < 1) */}
      {!isGalaxyUnlocked && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 max-w-xl w-full px-4 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="stellaris-resource-pod bg-[#040c16]/95 border border-amber-500/60 rounded-sm p-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-amber-950/70 border border-amber-500/60 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 font-display uppercase tracking-wider">
                    Derin Uzay Sensör Ağı Çevrimdışı
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-500/40 rounded-none font-mono">
                    Sensör Lv. 1 Gerekli
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                  Galaktik hiperuzay koordinatları kilitli. Galaksiyi açmak için Ar-Ge Laboratuvarı ve Sensörleri araştırın.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeColony?.buildings.research_lab ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenResearch?.();
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sensör Araştır</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playClick();
                    if (activeColony) onSelectPlanetById?.(activeColony.id);
                  }}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Pickaxe className="w-3.5 h-3.5" />
                  <span>Ar-Ge Kur</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sleek Stellaris View Switcher & Zoom Deck (Bottom-Right of Map) */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 stellaris-dock-card px-2.5 py-1.5 rounded-sm shadow-xl font-mono text-xs select-none">
        {viewMode === 'system' ? (
          <div className="flex items-center gap-1">
            {isGalaxyUnlocked && (
              <button
                onClick={() => cycleSystem('prev')}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Önceki Sistem"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                if (!isGalaxyUnlocked) {
                  sound.playWarning();
                  setShowSensorLockedToast(true);
                  return;
                }
                sound.playClick();
                setViewMode('galaxy');
              }}
              className={`px-2.5 py-1 rounded-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                !isGalaxyUnlocked
                  ? 'bg-amber-950/70 border border-amber-500/60 text-amber-300 hover:bg-amber-900/60 shadow-lg shadow-amber-950/50'
                  : 'bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold'
              }`}
              title={!isGalaxyUnlocked ? 'Galaktik Harita Kilitli (Sensör Seviye 1 Gerekli)' : 'Galaksi Haritasına Çık [M]'}
            >
              {!isGalaxyUnlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-300 text-[10.5px]">GALAKSİ KİLİTLİ</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>GALAKSİ [M]</span>
                </>
              )}
            </button>
            {isGalaxyUnlocked && (
              <button
                onClick={() => cycleSystem('next')}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sonraki Sistem"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                setShowProjections(!showProjections);
              }}
              className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors cursor-pointer ml-1 ${
                showProjections
                  ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Gelecek Yörünge Projeksiyonlarını Göster/Gizle"
            >
              🔭 Projeksiyon
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playClick();
              enterSystemView(focusedSystemId);
            }}
            className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold rounded-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sistem Detayına Gir [M / Çift Tık]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{activeSystem.name.toUpperCase()} [M]</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => {
              sound.playClick();
              setZoom((prev) => Math.max(0.6, prev - 0.2));
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer font-bold"
            title="Uzaklaş"
          >
            -
          </button>
          <span className="text-amber-300 font-bold text-[10px] w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => {
              sound.playClick();
              setZoom((prev) => Math.min(2.5, prev + 0.2));
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer font-bold"
            title="Yakınlaş"
          >
            +
          </button>
        </div>
      </div>

      {/* Stellaris Integrated Tactical Map Console (Map Modes + Adaptive Legend) */}
      <div className="absolute bottom-3 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-auto select-none font-mono">
        {/* Adaptive Contextual Legend Drawer */}
        <div className="stellaris-item-card rounded-sm px-2.5 py-1 flex items-center gap-3 text-[10px] font-mono text-slate-300 shadow-xl border border-slate-700/70 backdrop-blur-md bg-[#07111c]/90">
          {mapMode === 'military' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50" />
                <span className="text-cyan-200">Dost Filo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50 animate-pulse" />
                <span className="text-rose-200 font-bold">Düşman Tehdidi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50" />
                <span className="text-amber-300">Muharebe</span>
              </div>
            </>
          ) : mapMode === 'economy' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50" />
                <span className="text-emerald-300 font-bold">Boş Dünya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50" />
                <span className="text-amber-300">Enkaz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50" />
                <span className="text-cyan-300">POI</span>
              </div>
            </>
          ) : mapMode === 'intel' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50" />
                <span className="text-cyan-200">Sensör Kapsamı</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shadow-sm shadow-purple-500/50" />
                <span className="text-purple-300">Derin İstihbarat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block shadow-sm shadow-slate-500/50" />
                <span className="text-slate-400">Sis Altında</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50" />
                <span className="text-slate-200">Koloni</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
                <span className="text-slate-200">Düşman</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50" />
                <span className="text-purple-300">Röle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50" />
                <span className="text-amber-300">Keşif / POI</span>
              </div>
            </>
          )}
        </div>

        {/* Stellaris Map Modes Selector (Bottom-Right, canonical Stellaris placement) */}
        <div className="flex items-center bg-[#070e17]/95 border border-[#18374b] rounded-sm p-0.5 shadow-xl backdrop-blur-md">
          <button
            onClick={() => {
              sound.playClick();
              setMapMode('default');
            }}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'default'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Genel Harita Modu (İmparatorluk & Hâkimiyet)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Genel</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMapMode('military');
            }}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'military'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Askeri & Tehdit Modu (Baskınlar, Filolar ve Çatışmalar)"
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Askeri</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMapMode('economy');
            }}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'economy'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ekonomi & Koloni Modu (Boş Gezegenler ve Enkaz Alanları)"
          >
            <Pickaxe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ekonomi</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMapMode('intel');
            }}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'intel'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Sensör & İstihbarat Modu (Sis Kapsamı ve Keşif)"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">İstihbarat</span>
          </button>
        </div>
      </div>

      {/* Sensor Locked Toast Alert */}
      {showSensorLockedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className="px-4 py-2 rounded-sm bg-[#160b05]/95 border border-amber-500 text-amber-200 shadow-2xl backdrop-blur-md font-mono text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-bold">DERİN UZAY KİLİTLİ:</span>
            <span>Galaktik haritayı açmak için Sensör Teknolojisi Seviye 1 gereklidir!</span>
          </div>
        </div>
      )}

      {/* Cinematic Modal when Sensör Lv. 1 finishes */}
      {showSensorsUnlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="stellaris-outliner border border-cyan-400/80 rounded-sm w-full max-w-lg p-5 shadow-2xl text-slate-100 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-950/80">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold stellaris-gold font-display uppercase tracking-widest">
                  DERİN UZAY SENSÖR AĞI DEVREDE!
                </h3>
                <span className="text-xs text-cyan-300 font-mono">
                  Triton Sektörü Hiperuzay Koordinatları Haritalandırıldı
                </span>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed border-t border-b border-[#18374b] py-3">
              Gözlem uydularınız ve alt-uzay sinyal alıcılarınız yıldızlararası hiperuzay geçitlerini başarıyla senkronize etti. Artık ana sisteminizin sınırlarını aşabilir, Triton Sektörünün derinliklerine keşif gemileri sevk edebilir ve Galaktik Haritayı görüntüleyebilirsiniz!
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowSensorsUnlockedModal(false);
                }}
                className="px-3.5 py-1.5 rounded-sm border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Sistemde Kal
              </button>
              <button
                onClick={() => {
                  sound.playWarp();
                  setShowSensorsUnlockedModal(false);
                  setViewMode('galaxy');
                }}
                className="px-4 py-1.5 rounded-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-xl shadow-cyan-950/80 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Galaktik Haritayı Aç [M]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
