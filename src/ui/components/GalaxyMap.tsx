import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Minus,
  Orbit,
  Plus,
  Rocket,
  Swords,
} from 'lucide-react';
import { getPlayerSensorCoverage } from '../../engine/fog';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { GameState, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import { sound } from '../sound';
import { GalaxyScene25D } from './GalaxyScene25D';
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
}) => {
  // View mode: 'galaxy' (Macro Sector / Cluster) or 'system' (Three.js 2.5D In-System Orrery)
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>('galaxy');
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

  // Real-time planetary orbits for focused system (for telemetry HUD card)
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

  // Keyboard shortcut M: Toggle Galaxy View <-> System View (Stellaris standard)
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
        />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING HUD CONTROLS & STELLARIS-STYLE VIEW SWITCHER                    */}
      {/* ========================================================================= */}

      {/* Top Left: Navigation & Mode Switch */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
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
      />

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
