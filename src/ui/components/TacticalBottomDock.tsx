import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Flame,
  Globe,
  Navigation,
  Pickaxe,
  Radio,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { GameState, PlanetStance, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface TacticalBottomDockProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  activePlanetId: string;
  onOpenCommandPanel: () => void;
  onRecallFleet: (fleetId: string) => void;
  onOpenShipyard: () => void;
  onOpenMarket: () => void;
  onFocusPlanet: (planetId: string) => void;
  onFocusRelay: () => void;
  onSetStance?: (planetId: string, stance: PlanetStance) => void;
}

export const TacticalBottomDock: React.FC<TacticalBottomDockProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  activePlanetId,
  onOpenCommandPanel,
  onRecallFleet,
  onOpenShipyard,
  onOpenMarket,
  onFocusPlanet,
  onFocusRelay,
  onSetStance,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Selected fleet or target resolution
  const selectedFleet =
    selectedTarget?.type === 'fleet' && selectedTarget.fleetId
      ? state.fleets[selectedTarget.fleetId]
      : null;

  const selectedPlanet =
    selectedTarget?.type === 'planet' && selectedTarget.planetId
      ? state.planets[selectedTarget.planetId]
      : state.planets[activePlanetId];

  const isMyFleet = selectedFleet?.ownerId === activePlayerId;
  const isMyPlanet = selectedPlanet?.ownerId === activePlayerId;

  // Compute fleet power
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
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(false);
          }}
          className="stellaris-dock-card px-4 py-1 rounded-sm text-xs font-mono text-[#f5d77f] hover:text-white flex items-center gap-2 border border-[#c5a059]/40 shadow-xl backdrop-blur-md cursor-pointer transition-all"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider">TAKTIK KONSOL</span>
          <span className="text-[10px] text-slate-400">▲</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 max-w-[95vw] pointer-events-auto">
      <div className="stellaris-dock-card rounded-sm p-1.5 flex items-stretch gap-2 backdrop-blur-md shadow-2xl border border-[#c5a059]/30 text-xs font-mono select-none">
        {/* ========================================================================= */}
        {/* LEFT CARD: Contextual Target Summary (Fleet or Planet)                    */}
        {/* ========================================================================= */}
        {selectedFleet ? (
          <div className="bg-[#070d15]/90 border border-[#182330] rounded-sm p-2 min-w-[240px] max-w-[320px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMyFleet ? 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]' : 'bg-rose-500 shadow-[0_0_6px_#ff0055]'
                    }`}
                  />
                  <span className="font-bold text-slate-100 text-[11px] truncate">
                    {selectedFleet.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#e5c578] bg-amber-950/40 border border-amber-500/30 px-1 rounded-sm">
                  {computeFleetPower(selectedFleet.ships).toLocaleString()} Güç
                </span>
              </div>

              {/* Ship Counts */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-300">
                {Object.entries(selectedFleet.ships).map(([type, count]) => {
                  if (!count || count <= 0) return null;
                  return (
                    <span key={type} className="flex items-center gap-0.5">
                      <span className="text-slate-400 capitalize">{type[0].toUpperCase()}:</span>
                      <strong className="text-cyan-300">{count}</strong>
                    </span>
                  );
                })}
              </div>

              {/* Flight Status / Mission */}
              <div className="mt-1 text-[9.5px] text-slate-400 flex items-center justify-between">
                <span>Durum:</span>
                <span className="text-slate-200 capitalize font-semibold">
                  {selectedFleet.status === 'in_transit'
                    ? `İntikal (${formatDuration(Math.max(0, selectedFleet.arrivalTime - state.timeMs))})`
                    : selectedFleet.status}
                </span>
              </div>
            </div>

            {/* Quick Stance / Recall for My Fleet */}
            {isMyFleet && selectedFleet.status === 'in_transit' && (
              <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => {
                    sound.playClick();
                    onRecallFleet(selectedFleet.id);
                  }}
                  className="px-2 py-0.5 bg-rose-950/60 border border-rose-500/50 hover:border-rose-400 text-rose-300 text-[9.5px] rounded-sm flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Geri Çağır</span>
                </button>
              </div>
            )}
          </div>
        ) : selectedPlanet ? (
          <div className="bg-[#070d15]/90 border border-[#182330] rounded-sm p-2 min-w-[240px] max-w-[320px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className={`w-3.5 h-3.5 ${isMyPlanet ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-100 text-[11px] truncate">
                    {selectedPlanet.name}
                  </span>
                  {selectedPlanet.isHomeworld && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded-sm">
                      ANA
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {Object.values(selectedPlanet.garrison).reduce((a, b) => a + (b || 0), 0)} Gemi
                </span>
              </div>

              {/* Resource Quick Values */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                <span className="text-orange-300 flex items-center gap-0.5">
                  ⛏️ {Math.floor(selectedPlanet.resources.ore).toLocaleString()}
                </span>
                <span className="text-cyan-300 flex items-center gap-0.5">
                  💎 {Math.floor(selectedPlanet.resources.crystal).toLocaleString()}
                </span>
                <span className="text-amber-300 flex items-center gap-0.5">
                  ⚡ {Math.floor(selectedPlanet.resources.fuel).toLocaleString()}
                </span>
              </div>

              {/* Planet Stance Selector */}
              {isMyPlanet && onSetStance && (
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-[9px] text-slate-400">Tutum:</span>
                  {(['hold_position', 'evade_safeguard'] as PlanetStance[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        sound.playClick();
                        onSetStance(selectedPlanet.id, st);
                      }}
                      className={`px-1.5 py-0.5 rounded-sm text-[8.5px] font-bold border transition-colors cursor-pointer ${
                        selectedPlanet.stance === st
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                          : 'border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {st === 'hold_position' ? 'SAVUN' : 'KAÇIN'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
              <button
                onClick={() => {
                  sound.playClick();
                  onFocusPlanet(selectedPlanet.id);
                }}
                className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>Odaklan</span>
              </button>
              {isMyPlanet && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenShipyard();
                  }}
                  className="text-[#e5c578] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Wrench className="w-2.5 h-2.5" />
                  <span>Tersane</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* CENTER CONSOLE: Stellaris Quick Orders                                     */}
        {/* ========================================================================= */}
        <div className="bg-[#070d15]/90 border border-[#182330] rounded-sm p-1.5 flex flex-col justify-between">
          <div className="text-[9px] font-bold text-[#c5a059] uppercase tracking-wider text-center border-b border-slate-800/70 pb-0.5 mb-1 flex items-center justify-center gap-1">
            <Crosshair className="w-2.5 h-2.5 text-[#c5a059]" />
            <span>HIZLI EMİR KONSOLU (QUICK ORDER)</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {/* SEVK / İNTİKAL (F5) */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-cyan-400 px-3 py-2 rounded-sm flex flex-col items-center gap-1 cursor-pointer group"
              title="Filo Sefer & Sevk Emri (F5)"
            >
              <Send className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9.5px] font-bold tracking-wider">İNTİKAL</span>
            </button>

            {/* TAARRUZ / SALDIRI */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-rose-400 px-3 py-2 rounded-sm flex flex-col items-center gap-1 cursor-pointer group"
              title="Düşman Hedefe Taarruz Emri"
            >
              <Swords className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9.5px] font-bold tracking-wider text-rose-300">TAARRUZ</span>
            </button>

            {/* NEXUS RÖLESİ HÂKİMİYETİ */}
            <button
              onClick={() => {
                sound.playClick();
                onFocusRelay();
              }}
              className="stellaris-btn-metallic hover:!border-purple-400 px-3 py-2 rounded-sm flex flex-col items-center gap-1 cursor-pointer group"
              title="Merkezi Nexus Rölesine Odaklan & İntikal"
            >
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9.5px] font-bold tracking-wider text-purple-300">RÖLE</span>
            </button>

            {/* PAZAR / TİCARET */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenMarket();
              }}
              className="stellaris-btn-metallic hover:!border-amber-400 px-3 py-2 rounded-sm flex flex-col items-center gap-1 cursor-pointer group"
              title="Galaktik Borsa & Kaynak Takası (F6)"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9.5px] font-bold tracking-wider text-amber-300">BORSA</span>
            </button>
          </div>
        </div>

        {/* Minimize Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(true);
          }}
          className="px-1 text-slate-500 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
          title="Konsolu Küçült"
        >
          <span className="text-[10px]">▼</span>
        </button>
      </div>
    </div>
  );
};
