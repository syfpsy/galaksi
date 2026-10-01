import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Crosshair,
  Globe,
  Navigation,
  Pickaxe,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { FleetDoctrine, GameState, PlanetStance, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface TacticalBottomDockProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  activePlanetId: string;
  isMinimized?: boolean;
  onToggleMinimized?: (min: boolean) => void;
  directDispatchMode?: 'all' | 'half' | 'scout';
  onSetDirectDispatchMode?: (mode: 'all' | 'half' | 'scout') => void;
  onOpenCommandPanel: () => void;
  onRecallFleet: (fleetId: string) => void;
  onOpenShipyard: () => void;
  onOpenMarket: () => void;
  onOpenPlanetPanel?: (planetId: string) => void;
  onOpenFleetDetails?: (fleetId: string) => void;
  onFocusPlanet: (planetId: string) => void;
  onFocusRelay: () => void;
  onSetStance?: (planetId: string, stance: PlanetStance) => void;
  onSetDoctrine?: (fleetId: string, doctrine: FleetDoctrine) => void;
  onBuildShips?: (planetId: string, shipType: ShipType, count: number) => void;
  onToggleAutoSupply?: (planetId: string, enabled: boolean) => void;
  onRapidIntercept?: (targetSystemId?: string, targetFleetId?: string) => void;
}

export const TacticalBottomDock: React.FC<TacticalBottomDockProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  activePlanetId,
  isMinimized: isMinimizedProp,
  onToggleMinimized,
  directDispatchMode = 'all',
  onSetDirectDispatchMode,
  onOpenCommandPanel,
  onRecallFleet,
  onOpenShipyard,
  onOpenMarket,
  onOpenPlanetPanel,
  onOpenFleetDetails,
  onFocusPlanet,
  onFocusRelay,
  onSetStance,
  onSetDoctrine,
  onBuildShips,
  onToggleAutoSupply,
  onRapidIntercept,
}) => {
  const [internalMinimized, setInternalMinimized] = useState(false);
  const isMinimized = isMinimizedProp !== undefined ? isMinimizedProp : internalMinimized;
  const setIsMinimized = (val: boolean) => {
    if (onToggleMinimized) onToggleMinimized(val);
    else setInternalMinimized(val);
  };

  // Selected target resolution
  const selectedFleet =
    selectedTarget?.type === 'fleet' && selectedTarget.fleetId
      ? state.fleets[selectedTarget.fleetId]
      : null;

  const selectedPlanet =
    selectedTarget?.type === 'planet' && selectedTarget.planetId
      ? state.planets[selectedTarget.planetId]
      : state.planets[activePlanetId];

  const homeworld = Object.values(state.planets).find(
    (p) => p.ownerId === activePlayerId && p.isHomeworld
  ) || selectedPlanet;

  const isMyFleet = selectedFleet?.ownerId === activePlayerId;
  const isMyPlanet = selectedPlanet?.ownerId === activePlayerId;

  // Compute fleet military rating
  const computeFleetPower = (ships: Record<string, number | undefined>) => {
    let power = 0;
    Object.entries(ships).forEach(([type, count]) => {
      const stats = SHIP_STATS[type as ShipType];
      if (stats && count) {
        power += Math.round((stats.attack * 8 + stats.hull * 0.4 + stats.shield * 0.6) * count);
      }
    });
    return power;
  };

  if (isMinimized) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(false);
          }}
          className="stellaris-dock-card px-3.5 py-1.5 rounded-sm text-xs font-mono text-amber-300 hover:text-white flex items-center gap-2 border border-amber-500/50 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:border-amber-400"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider">TAKTİK KONSOL</span>
          <span className="text-[10px] text-amber-400">▲</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 max-w-[96vw] pointer-events-auto select-none font-mono">
      <div className="stellaris-dock-card rounded-sm px-3 py-2 flex items-center gap-3.5 backdrop-blur-md shadow-2xl border border-[#284159] text-xs">
        {/* ========================================================================= */}
        {/* 1. LEFT ZONE: Contextual Target Summary (Fleet, Planet, or Homeworld)     */}
        {/* ========================================================================= */}
        <div className="min-w-[290px] max-w-[360px] h-[78px] flex flex-col justify-between pr-3.5 border-r border-[#1a3449]">
          {selectedFleet ? (
            <>
              {/* Row 1: Fleet Title, Power & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isMyFleet ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-rose-500 shadow-[0_0_8px_#ff0055]'
                    }`}
                  />
                  <span className="font-display font-bold text-white text-xs truncate">
                    {selectedFleet.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-bold text-amber-300">
                    ⚡ {computeFleetPower(selectedFleet.ships).toLocaleString()}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#050d18] border border-slate-700 text-slate-300">
                    {selectedFleet.status === 'in_transit'
                      ? `İntikal (${formatDuration(Math.max(0, selectedFleet.arrivalTime - state.timeMs))})`
                      : 'Hazır'}
                  </span>
                </div>
              </div>

              {/* Row 2: Ship Composition & Doctrine */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-slate-300">
                  {Object.entries(selectedFleet.ships).map(([type, count]) => {
                    if (!count || count <= 0) return null;
                    return (
                      <span key={type} className="flex items-center gap-0.5">
                        <span className="text-slate-500 uppercase">{type[0]}:</span>
                        <strong className="text-cyan-300">{count}</strong>
                      </span>
                    );
                  })}
                </div>

                {isMyFleet && onSetDoctrine && (
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'balanced', label: 'Dengeli' },
                        { id: 'aggressive', label: 'Taarruz' },
                        { id: 'defensive', label: 'Savunma' },
                        { id: 'hit_and_run', label: 'Vur-Kaç' },
                      ] as const
                    ).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          sound.playClick();
                          onSetDoctrine(selectedFleet.id, doc.id as FleetDoctrine);
                        }}
                        className={`px-1 py-0.2 rounded-sm text-[8.5px] font-bold border transition-colors cursor-pointer ${
                          selectedFleet.doctrine === doc.id
                            ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {doc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                {isMyFleet ? (
                  <>
                    {onOpenFleetDetails && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onOpenFleetDetails(selectedFleet.id);
                        }}
                        className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Search className="w-3 h-3 text-cyan-400" />
                        <span>Detay İncele</span>
                      </button>
                    )}
                    {selectedFleet.status === 'in_transit' && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRecallFleet(selectedFleet.id);
                        }}
                        className="px-2 py-0.5 bg-rose-950/80 border border-rose-500 hover:border-rose-400 text-rose-200 rounded-sm flex items-center gap-1 font-bold cursor-pointer transition-colors ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Geri Çağır</span>
                      </button>
                    )}
                  </>
                ) : onRapidIntercept ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>TEHDİT HEDEFİ</span>
                    </span>
                    <button
                      onClick={() => {
                        sound.playLaunch();
                        onRapidIntercept(undefined, selectedFleet.id);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-[10px] rounded-sm flex items-center gap-1 font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>⚡ 1-Tıkla Önle</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : selectedPlanet ? (
            <>
              {/* Row 1: Planet Name, Badges & Garrison */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isMyPlanet ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="font-display font-bold text-white text-xs truncate">
                    {selectedPlanet.name}
                  </span>
                  {selectedPlanet.isHomeworld && (
                    <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded-sm font-bold shrink-0">
                      ANA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-cyan-300 font-bold">
                    {Object.values(selectedPlanet.garrison).reduce((a, b) => a + (b || 0), 0)} Gemi
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFocusPlanet(selectedPlanet.id);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Kamerayı Gezegene Odakla"
                  >
                    <Navigation className="w-3 h-3" />
                  </button>
                  {isMyPlanet && onOpenPlanetPanel && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenPlanetPanel(selectedPlanet.id);
                      }}
                      className="text-amber-300 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer transition-colors text-[10px]"
                      title="Gezegen Yönetimi & Binalar (F1)"
                    >
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>Yönet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Resources & Stance / Supply */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-orange-300">⛏️{Math.floor(selectedPlanet.resources.ore)}</span>
                  <span className="text-cyan-300">💎{Math.floor(selectedPlanet.resources.crystal)}</span>
                  <span className="text-amber-300">⚡{Math.floor(selectedPlanet.resources.fuel)}</span>
                </div>

                {isMyPlanet && onSetStance && (
                  <div className="flex items-center gap-1">
                    {(['hold_position', 'evade_safeguard'] as PlanetStance[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          sound.playClick();
                          onSetStance(selectedPlanet.id, st);
                        }}
                        className={`px-1 py-0.2 rounded-sm text-[8.5px] font-bold border transition-colors cursor-pointer ${
                          selectedPlanet.stance === st
                            ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                            : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {st === 'hold_position' ? 'SAVUN' : 'KAÇIN'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Quick Shipyard or 1-Click Attack */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                {isMyPlanet ? (
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <div className="flex items-center gap-1">
                      {onBuildShips && (selectedPlanet.buildings.shipyard || 0) > 0 && (
                        <>
                          <button
                            onClick={() => {
                              sound.playLaunch();
                              onBuildShips(selectedPlanet.id, 'scout', 1);
                            }}
                            className="px-1.5 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-600 hover:text-black text-cyan-200 text-[9px] font-bold transition-all cursor-pointer"
                            title="1x Gözcü Gemisi İmal Et (80 Ore, 30 Crystal)"
                          >
                            +1 Gözcü
                          </button>
                          <button
                            onClick={() => {
                              sound.playLaunch();
                              onBuildShips(selectedPlanet.id, 'fighter', 1);
                            }}
                            className="px-1.5 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/50 hover:bg-rose-600 hover:text-white text-rose-200 text-[9px] font-bold transition-all cursor-pointer"
                            title="1x Avcı Gemisi İmal Et (120 Ore, 40 Crystal, 20 Fuel)"
                          >
                            +1 Avcı
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onOpenShipyard();
                        }}
                        className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors text-[9.5px] ml-1"
                      >
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>Tersane</span>
                      </button>
                    </div>

                    {!selectedPlanet.isHomeworld && onToggleAutoSupply && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onToggleAutoSupply(selectedPlanet.id, !selectedPlanet.autoSupplyEnabled);
                        }}
                        className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm border cursor-pointer transition-colors ${
                          selectedPlanet.autoSupplyEnabled
                            ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                            : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Otomatik İkmal Hattı: Fazla kaynaklar periyodik olarak başkente sevk edilir."
                      >
                        {selectedPlanet.autoSupplyEnabled ? '⚡ İkmal: AÇIK' : 'İkmal: KAPALI'}
                      </button>
                    )}
                  </div>
                ) : onRapidIntercept ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">Düşman Sektörü</span>
                    <button
                      onClick={() => {
                        sound.playLaunch();
                        onRapidIntercept(selectedPlanet.systemId);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-[10px] font-bold rounded-sm flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>⚡ 1-Tıkla Taarruz</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            /* Fallback: Homeworld Ready State */
            <div className="h-full flex flex-col justify-between py-0.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{homeworld?.name || 'Ana Gezegen'}</span>
                </span>
                <span className="text-cyan-300 text-[10.5px] font-bold">
                  {Object.values(homeworld?.garrison || {}).reduce((a, b) => a + (b || 0), 0)} Gemi
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Haritadan bir koloni veya filo seçerek taktik emirler verin.
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                {homeworld && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFocusPlanet(homeworld.id);
                    }}
                    className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Başkente Git</span>
                  </button>
                )}
                {onOpenPlanetPanel && homeworld && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenPlanetPanel(homeworld.id);
                    }}
                    className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>Yönetim</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER ZONE: Direct Dispatch Mode & Macro RTS Commands                 */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3">
          {/* Direct Dispatch Mode Selector */}
          {onSetDirectDispatchMode && (
            <div className="h-[78px] flex flex-col justify-between pr-3 border-r border-[#1a3449] min-w-[130px]">
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Hızlı Sevk</span>
                <span className="text-emerald-400 text-[9px]">Sağ Tık</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('all');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'all'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında seçili üssün tüm hazır savaş filosunu sevk et (%100)"
                >
                  %100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('half');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'half'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında hazır filonun yarısını sevk et (%50)"
                >
                  %50
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('scout');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'scout'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında sadece 1 hızlı öncü/gözcü gemisi sevk et"
                >
                  Gözcü
                </button>
              </div>

              <div className="text-[8.5px] text-slate-500 text-center truncate">
                {directDispatchMode === 'all'
                  ? 'Tüm savaş filosu sevk edilir'
                  : directDispatchMode === 'half'
                  ? 'Filonun %50\'si sevk edilir'
                  : '1 keşif gözcüsü sevk edilir'}
              </div>
            </div>
          )}

          {/* 4 Core Quick Order Buttons */}
          <div className="grid grid-cols-4 gap-1.5 h-[78px] items-stretch">
            {/* 1. SEVK / İNTİKAL (F5) */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-cyan-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Filo Sefer & Sevk Emri (F5)"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-white tracking-wider">İNTİKAL</span>
              <kbd className="text-[8px] text-slate-400">F5</kbd>
            </button>

            {/* 2. TAARRUZ */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-rose-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Düşman Hedefe Taarruz Emri"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-rose-200 tracking-wider">TAARRUZ</span>
              <kbd className="text-[8px] text-slate-400">Emir</kbd>
            </button>

            {/* 3. NEXUS RÖLE */}
            <button
              onClick={() => {
                sound.playClick();
                onFocusRelay();
              }}
              className="stellaris-btn-metallic hover:!border-purple-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Merkezi Nexus Rölesine Odaklan & İntikal"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-purple-200 tracking-wider">RÖLE</span>
              <kbd className="text-[8px] text-slate-400">Nexus</kbd>
            </button>

            {/* 4. BORSA / PAZAR (F6) */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenMarket();
              }}
              className="stellaris-btn-metallic hover:!border-amber-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Galaktik Borsa & Kaynak Takası (F6)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-amber-200 tracking-wider">BORSA</span>
              <kbd className="text-[8px] text-slate-400">F6</kbd>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT ZONE: Minimize Pill Toggle                                       */}
        {/* ========================================================================= */}
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(true);
          }}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1 self-stretch flex items-center justify-center"
          title="Konsolu Küçült"
        >
          <span className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors">▼</span>
        </button>
      </div>
    </div>
  );
};
