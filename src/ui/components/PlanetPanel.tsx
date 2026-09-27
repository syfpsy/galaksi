import React from 'react';
import {
  Activity,
  ArrowUpCircle,
  Building,
  CheckCircle,
  Clock,
  Compass,
  Flame,
  Gem,
  Pickaxe,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import {
  BUILDING_STATS,
  calculateHourlyProduction,
  getBuildingUpgradeCost,
} from '../../engine/constants';
import { BuildingType, Planet, PlanetStance, ShipType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface PlanetPanelProps {
  planets: Planet[];
  activePlanetId: string;
  onSelectPlanet: (id: string) => void;
  onUpgradeBuilding: (planetId: string, type: BuildingType) => void;
  onSetStance: (planetId: string, stance: PlanetStance) => void;
  currentTimeMs: number;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onClose?: () => void;
}

export const PlanetPanel: React.FC<PlanetPanelProps> = ({
  planets,
  activePlanetId,
  onSelectPlanet,
  onUpgradeBuilding,
  onSetStance,
  currentTimeMs,
  onOpenShipyard,
  onOpenResearch,
  onClose,
}) => {
  const currentPlanet = planets.find((p) => p.id === activePlanetId) || planets[0];
  if (!currentPlanet) {
    return (
      <aside className="w-80 h-full border-r border-slate-800 bg-space-900/90 p-4 text-slate-400 text-sm">
        Gezegen bulunamadı.
      </aside>
    );
  }

  const buildingsList: BuildingType[] = [
    'ore_mine',
    'crystal_synth',
    'fuel_refinery',
    'shipyard',
    'research_lab',
    'sensor_array',
  ];

  return (
    <aside className="w-84 h-full border-r border-slate-800 bg-space-900/95 backdrop-blur-md flex flex-col z-20 select-none overflow-hidden">
      {/* Header: Planet Tabs */}
      <div className="p-3 border-b border-slate-800 bg-space-850/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            İmparatorluk Kolonileri
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono bg-cyber-cyan/10 text-cyber-cyan px-2 py-0.5 rounded border border-cyber-cyan/30">
              {planets.length} / 3 Yuva
            </span>
            {onClose && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                title="Paneli Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Planet Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {planets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                sound.playClick();
                onSelectPlanet(p.id);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                p.id === currentPlanet.id
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan'
                  : 'bg-space-800/80 border border-slate-700/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  p.isHomeworld ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Planetary Status & Defense Stance */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-space-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Dynamic Living Planetary Orb with Orbiting Defense Satellite */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group">
              {/* Atmospheric Glow Aura */}
              <div className="absolute inset-0 rounded-full bg-cyber-cyan/15 blur-sm animate-pulse-slow" />

              {/* Orbiting Satellite Track */}
              <div className="absolute inset-[-4px] rounded-full border border-slate-700/60 pointer-events-none" />
              <div
                className="absolute inset-[-4px] rounded-full animate-spin-slow pointer-events-none"
                style={{ transformOrigin: 'center' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-sm shadow-cyan-400 absolute -top-0.5 left-1/2 -translate-x-1/2" />
              </div>

              {/* Planet Orb Body */}
              <div className="w-11 h-11 rounded-full overflow-hidden border border-cyber-cyan/40 bg-space-950 relative shadow-md shadow-cyan-950/50">
                <img
                  src="/assets/art/terran_planet.png"
                  alt={currentPlanet.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                />
                {/* Subtle Day/Night Terminator Shadow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                {currentPlanet.name}
                {currentPlanet.isHomeworld && (
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-semibold">
                    ANA GEZEGEN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Korumalı Depo: <strong className="text-slate-300">{currentPlanet.protectedCapacity.toLocaleString()}</strong> br
              </div>
            </div>
          </div>

          {/* Stance Selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClick();
                onSetStance(currentPlanet.id, 'hold_position');
              }}
              className={`p-1.5 rounded text-xs transition-all ${
                currentPlanet.stance === 'hold_position'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Konumu Tut: Garnizon sonuna kadar savunur."
            >
              <Shield className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onSetStance(currentPlanet.id, 'evade_safeguard');
              }}
              className={`p-1.5 rounded text-xs transition-all ${
                currentPlanet.stance === 'evade_safeguard'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filoyu Koru: Ağır baskında hafif gemiler kaçınır."
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Buildings List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          Gezegen Altyapısı & Üretim
        </div>

        {buildingsList.map((type) => {
          const stats = BUILDING_STATS[type];
          const currentLevel = currentPlanet.buildings[type] || 0;
          const isQueueActive = currentPlanet.buildingQueue?.type === type;
          const nextCost = getBuildingUpgradeCost(type, currentLevel);

          const canAfford =
            currentPlanet.resources.ore >= nextCost.ore &&
            currentPlanet.resources.crystal >= nextCost.crystal &&
            currentPlanet.resources.fuel >= nextCost.fuel;

          const isAnyUpgrading = !!currentPlanet.buildingQueue;

          // Calculate upgrade countdown if active
          let remainingMs = 0;
          let progressPercent = 0;
          if (isQueueActive && currentPlanet.buildingQueue) {
            const total = currentPlanet.buildingQueue.finishTime - currentPlanet.buildingQueue.startTime;
            const elapsed = currentTimeMs - currentPlanet.buildingQueue.startTime;
            remainingMs = Math.max(0, currentPlanet.buildingQueue.finishTime - currentTimeMs);
            progressPercent = Math.min(100, Math.round((elapsed / total) * 100));
          }

          return (
            <div
              key={type}
              className={`p-2.5 rounded-lg border transition-all ${
                isQueueActive
                  ? 'bg-cyber-cyan/10 border-cyber-cyan/40 shadow-sm shadow-cyber-cyan/10'
                  : 'bg-space-850/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 font-display">
                    {stats.nameTr}
                  </span>
                  <span className="text-[11px] font-mono text-cyber-cyan font-bold bg-space-900 px-1.5 py-0.2 rounded border border-slate-800">
                    Sv. {currentLevel}
                  </span>
                </div>

                {/* Action Buttons: Shortcuts & Upgrade */}
                <div className="flex items-center gap-1.5">
                  {type === 'shipyard' && currentLevel > 0 && onOpenShipyard && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenShipyard();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-all"
                      title="Tersane Üretim Panelini Aç"
                    >
                      <Rocket className="w-2.5 h-2.5 text-blue-400" />
                      <span>Tersane</span>
                    </button>
                  )}
                  {type === 'research_lab' && currentLevel > 0 && onOpenResearch && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenResearch();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all"
                      title="Teknoloji Araştırma Ağacını Aç"
                    >
                      <Compass className="w-2.5 h-2.5 text-purple-400" />
                      <span>Ar-Ge</span>
                    </button>
                  )}

                  {/* Upgrade Button or Countdown */}
                  {isQueueActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-cyan">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{formatDuration(remainingMs)}</span>
                    </div>
                  ) : (
                    <button
                      disabled={!canAfford || isAnyUpgrading}
                      onClick={() => {
                        sound.playClick();
                        onUpgradeBuilding(currentPlanet.id, type);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        canAfford && !isAnyUpgrading
                          ? 'bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30'
                          : 'bg-slate-800/40 border border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUpCircle className="w-3 h-3" />
                      <span>Yükselt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar for active upgrade with laser shimmer */}
              {isQueueActive && (
                <div className="w-full h-1.5 bg-space-950 rounded-full overflow-hidden my-1.5 border border-cyan-500/30 relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyber-cyan to-white transition-all duration-300 relative shadow-sm shadow-cyan-400"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white animate-pulse" />
                  </div>
                </div>
              )}

              {/* Cost requirement badges */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                <span className={currentPlanet.resources.ore >= nextCost.ore ? 'text-slate-300' : 'text-rose-400'}>
                  {nextCost.ore}C
                </span>
                <span>•</span>
                <span className={currentPlanet.resources.crystal >= nextCost.crystal ? 'text-slate-300' : 'text-rose-400'}>
                  {nextCost.crystal}K
                </span>
                {nextCost.fuel > 0 && (
                  <>
                    <span>•</span>
                    <span className={currentPlanet.resources.fuel >= nextCost.fuel ? 'text-slate-300' : 'text-rose-400'}>
                      {nextCost.fuel}Y
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Garrison Fleet Stationed Roster */}
        <div className="pt-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Gezegen Garnizon Filosu
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
              const count = currentPlanet.garrison[st] || 0;
              const names: Record<ShipType, string> = {
                scout: 'Keşif',
                transport: 'Nakliye',
                fighter: 'Avcı',
                battleship: 'Savaş G.',
              };

              return (
                <div
                  key={st}
                  className="bg-space-850 border border-slate-800 rounded p-2 flex items-center justify-between"
                >
                  <span className="text-[11px] text-slate-300">{names[st]}</span>
                  <span className="text-xs font-mono font-bold text-cyber-cyan">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
