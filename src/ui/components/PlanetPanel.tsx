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
import { BuildingType, GameState, Planet, PlanetStance, ShipType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';
import { getPlanetAsset } from '../planetAssets';

interface PlanetPanelProps {
  planets: Planet[];
  activePlanetId: string;
  state?: GameState;
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
  state,
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
      <aside className="w-[390px] min-w-[390px] max-w-[390px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner p-4 text-slate-400 text-sm">
        Gezegen bulunamadı.
      </aside>
    );
  }

  // Find system slot to determine planet biome type
  const system = state?.map.systems[currentPlanet.systemId];
  const slot = system?.slots.find(
    (s) => s.planetId === currentPlanet.id || s.slotIndex === currentPlanet.slotIndex
  );
  const planetAsset = getPlanetAsset(slot?.type);

  const buildingsList: BuildingType[] = [
    'ore_mine',
    'crystal_synth',
    'fuel_refinery',
    'shipyard',
    'research_lab',
    'sensor_array',
  ];

  return (
    <aside className="w-[390px] min-w-[390px] max-w-[390px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col z-20 select-none overflow-hidden shadow-2xl">
      {/* Header: Planet Tabs */}
      <div className="p-3 border-b border-[#18374b] stellaris-outliner-header">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono stellaris-gold uppercase font-bold tracking-widest">
            İMPARATORLUK KOLONİLERİ
          </span>
          <div className="flex items-center gap-1.5">
            <span className="stellaris-badge text-cyan-300 border-cyan-500/40">
              {planets.length} / 3 Koloni
            </span>
            {onClose && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
                title="Paneli Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Planet Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {planets.map((p) => {
            const pSys = state?.map.systems[p.systemId];
            const pSlot = pSys?.slots.find((s) => s.planetId === p.id || s.slotIndex === p.slotIndex);
            const pAsset = getPlanetAsset(pSlot?.type);
            const isCur = p.id === currentPlanet.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  sound.playClick();
                  onSelectPlanet(p.id);
                }}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isCur
                    ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                    : 'stellaris-resource-pod text-slate-300 hover:border-slate-500'
                }`}
              >
                <img
                  src={pAsset.spaceImage}
                  alt={p.name}
                  className="w-4 h-4 rounded-full object-cover border border-[#1c3c50] shrink-0"
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    p.isHomeworld ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinematic Surface Landscape Hero Banner */}
      <div className="relative w-full h-32 overflow-hidden border-b border-[#18374b] shrink-0 group">
        <img
          src={planetAsset.surfaceImage}
          alt={planetAsset.nameTr}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Cinematic Vignette & Bottom/Edge Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d19] via-[#080d19]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d19]/80 via-transparent to-transparent pointer-events-none" />

        {/* Biome Type & Habitability Badges Over Surface */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold backdrop-blur-md shadow-md border"
              style={{
                backgroundColor: `${planetAsset.themeColor}30`,
                color: planetAsset.glowColor,
                borderColor: `${planetAsset.glowColor}60`,
              }}
            >
              {planetAsset.nameTr}
            </span>
            <span className="stellaris-badge text-emerald-400 border-emerald-500/40 backdrop-blur-md">
              {planetAsset.habitability}
            </span>
          </div>
          {slot && (
            <span className="stellaris-badge text-slate-300 backdrop-blur-md border-[#18374b]">
              Boyut {slot.size}
            </span>
          )}
        </div>
      </div>

      {/* Planetary Status & Defense Stance */}
      <div className="px-4 py-3 border-b border-[#18374b] bg-[#070e17]/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Dynamic Living Planetary Orb with Orbiting Defense Satellite */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group">
              {/* Atmospheric Glow Aura */}
              <div
                className="absolute inset-0 rounded-full blur-sm animate-pulse-slow opacity-60"
                style={{ backgroundColor: planetAsset.glowColor }}
              />

              {/* Orbiting Satellite Track */}
              <div className="absolute inset-[-4px] rounded-full border border-slate-700/60 pointer-events-none" />
              <div
                className="absolute inset-[-4px] rounded-full animate-spin-slow pointer-events-none"
                style={{ transformOrigin: 'center' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full absolute -top-0.5 left-1/2 -translate-x-1/2 shadow-sm"
                  style={{ backgroundColor: planetAsset.glowColor }}
                />
              </div>

              {/* Planet Orb Body */}
              <div
                className="w-11 h-11 rounded-full overflow-hidden border bg-black relative shadow-md"
                style={{ borderColor: `${planetAsset.glowColor}60` }}
              >
                <img
                  src={planetAsset.spaceImage}
                  alt={currentPlanet.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                {currentPlanet.name}
                {currentPlanet.isHomeworld && (
                  <span className="text-[9px] bg-amber-400/20 text-[#e5c578] border border-amber-500/40 px-1.5 py-0.5 rounded-sm font-mono font-semibold">
                    BAŞKENT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Korumalı Depo: <strong className="text-slate-200">{currentPlanet.protectedCapacity.toLocaleString()}</strong> br
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
              className={`p-1.5 rounded-sm text-xs transition-all cursor-pointer ${
                currentPlanet.stance === 'hold_position'
                  ? 'stellaris-rail-btn active text-emerald-400'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-slate-200'
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
              className={`p-1.5 rounded-sm text-xs transition-all cursor-pointer ${
                currentPlanet.stance === 'evade_safeguard'
                  ? 'stellaris-rail-btn active text-amber-400'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-slate-200'
              }`}
              title="Filoyu Koru: Ağır baskında hafif gemiler kaçınır."
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Buildings List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2 text-xs font-mono scrollbar-none">
        <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-1">
          GEZEGEN ALTYAPISI & ÜRETİM
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
              className={`p-2.5 rounded-sm stellaris-item-card transition-all ${
                isQueueActive ? '!border-cyan-400/70 shadow-sm shadow-cyan-950/40' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 font-display">
                    {stats.nameTr}
                  </span>
                  <span className="text-[10.5px] font-mono text-cyan-300 font-bold bg-[#07101a] px-1.5 py-0.5 rounded-sm border border-[#19384c]">
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
                      className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium stellaris-btn-metallic text-cyan-300 cursor-pointer"
                      title="Tersane Üretim Panelini Aç (F2)"
                    >
                      <Rocket className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Tersane</span>
                    </button>
                  )}
                  {type === 'research_lab' && currentLevel > 0 && onOpenResearch && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenResearch();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium stellaris-btn-metallic text-amber-300 cursor-pointer"
                      title="Teknoloji Araştırma Ağacını Aç (F3)"
                    >
                      <Compass className="w-2.5 h-2.5 text-amber-400" />
                      <span>Ar-Ge</span>
                    </button>
                  )}

                  {/* Upgrade Button or Countdown */}
                  {isQueueActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
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
                      className="stellaris-btn-metallic flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium text-cyan-300 transition-all cursor-pointer"
                    >
                      <ArrowUpCircle className="w-3 h-3" />
                      <span>Yükselt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar for active upgrade with laser shimmer */}
              {isQueueActive && (
                <div className="w-full h-1.5 bg-[#060c14] rounded-full overflow-hidden my-1.5 border border-cyan-500/30 relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white transition-all duration-300 relative shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white animate-pulse" />
                  </div>
                </div>
              )}

              {/* Cost requirement badges */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                <span className={currentPlanet.resources.ore >= nextCost.ore ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                  {nextCost.ore} Cevher
                </span>
                <span>•</span>
                <span className={currentPlanet.resources.crystal >= nextCost.crystal ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                  {nextCost.crystal} Kristal
                </span>
                {nextCost.fuel > 0 && (
                  <>
                    <span>•</span>
                    <span className={currentPlanet.resources.fuel >= nextCost.fuel ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                      {nextCost.fuel} Yakıt
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Garrison Fleet Stationed Roster */}
        <div className="pt-2">
          <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-2">
            GEZEGEN GARNİZON FİLOSU
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
              const count = currentPlanet.garrison[st] || 0;
              const names: Record<ShipType, string> = {
                scout: 'Keşif Gemisi',
                transport: 'Ağır Nakliye',
                fighter: 'Savaş Avcısı',
                battleship: 'Harp Kruvazörü',
              };

              return (
                <div
                  key={st}
                  className="stellaris-item-card rounded-sm p-2 flex items-center justify-between"
                >
                  <span className="text-[11px] text-slate-300">{names[st]}</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
