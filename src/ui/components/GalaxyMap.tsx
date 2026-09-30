import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe,
  Minus,
  Orbit,
  Pickaxe,
  Plus,
  Radio,
  Rocket,
  Swords,
} from 'lucide-react';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { GameState, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import { sound } from '../sound';
import { GalaxyScene25D, MapMode } from './GalaxyScene25D';
import { StellarisBottomDeck } from './StellarisBottomDeck';

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
  onFocusHomeworld?: () => void;
  onFocusRelay?: () => void;
  onCycleColonies?: () => void;
  onOpenBattles?: () => void;
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
  onFocusHomeworld,
  onFocusRelay,
  onCycleColonies,
  onOpenBattles,
}) => {
  // View mode: 'galaxy' (Macro Sector / Cluster) or 'system' (Three.js 2.5D In-System Orrery)
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>('galaxy');
  const [focusedSystemId, setFocusedSystemId] = useState<string>(
    selectedTarget?.systemId || 'sys_relay'
  );
  const [showProjections, setShowProjections] = useState<boolean>(true);
  const [hoveredPlanetSlotId, setHoveredPlanetSlotId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('default');

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
        sound.playClick();
        if (viewMode === 'system') {
          setViewMode('galaxy');
        } else {
          enterSystemView(focusedSystemId);
        }
      } else if (e.key === 'Escape' && viewMode === 'system') {
        e.preventDefault();
        sound.playClick();
        setViewMode('galaxy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, focusedSystemId]);

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
          onContextMenuTarget={onContextMenuTarget}
          mapMode={mapMode}
          onOpenBattles={onOpenBattles}
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

      {/* Bottom Center: Stellaris Operations Deck & Activity Console (Collapsible & Expandable) */}
      <StellarisBottomDeck
        state={state}
        activePlayerId={activePlayerId}
        currentTimeMs={state.timeMs}
        viewMode={viewMode}
        activeSystemName={activeSystem.name}
        showProjections={showProjections}
        zoom={zoom}
        onToggleViewMode={() => {
          sound.playClick();
          if (viewMode === 'system') {
            setViewMode('galaxy');
          } else {
            enterSystemView(focusedSystemId);
          }
        }}
        onCycleSystem={cycleSystem}
        onToggleProjections={() => {
          sound.playClick();
          setShowProjections(!showProjections);
        }}
        onZoomIn={() => {
          sound.playClick();
          setZoom((prev) => Math.min(2.5, prev + 0.2));
        }}
        onZoomOut={() => {
          sound.playClick();
          setZoom((prev) => Math.max(0.6, prev - 0.2));
        }}
        onSelectFleet={onSelectFleet}
        onSelectPlanet={onSelectPlanet}
        onSelectSystem={onSelectSystem}
        onRecallFleet={onRecallFleet}
        onOpenShipyard={onOpenShipyard}
        onOpenResearch={onOpenResearch}
        onOpenTransitRadar={onOpenTransitRadar}
        onFocusHomeworld={onFocusHomeworld}
        onFocusRelay={onFocusRelay}
        onCycleColonies={onCycleColonies}
      />

      {/* Dynamic Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-4 stellaris-item-card rounded-sm px-3 py-1.5 flex items-center gap-4 text-[11px] font-mono text-slate-300 pointer-events-none shadow-xl border border-slate-700/60 backdrop-blur-md">
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
              <span className="text-amber-300">Muharebe Alanı</span>
            </div>
          </>
        ) : mapMode === 'economy' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50" />
              <span className="text-emerald-300 font-bold">Boş Koloni Dünyası</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50" />
              <span className="text-amber-300">Kurtarılabilir Enkaz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50" />
              <span className="text-cyan-300">Keşfedilmemiş POI</span>
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
              <span className="text-purple-300">Nexus Rölesi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50" />
              <span className="text-amber-300">Keşif / POI</span>
            </div>
          </>
        )}
      </div>

      {/* Stellaris Map Modes Selector (Bottom-Right, canonical Stellaris placement) */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center bg-[#070e17]/95 border border-[#18374b] rounded-sm p-0.5 shadow-xl backdrop-blur-md">
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
  );
};
