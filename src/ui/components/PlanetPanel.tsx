import React from 'react';
import {
  Activity,
  ArrowUpCircle,
  Building,
  CheckCircle,
  Clock,
  Coins,
  Compass,
  Eye,
  Flame,
  Gem,
  LineChart,
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
import { BuildingType, GameState, Planet, PlanetSpecialization, PlanetStance, ShipType } from '../../engine/types';
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
  onSetSpecialization?: (planetId: string, specialization: PlanetSpecialization) => void;
  currentTimeMs: number;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onOpenMarket?: () => void;
  onOpenEspionage?: (targetPlanetId?: string) => void;
  onClose?: () => void;
}

const PlanetPanelComponent: React.FC<PlanetPanelProps> = ({
  planets,
  activePlanetId,
  state,
  onSelectPlanet,
  onUpgradeBuilding,
  onSetStance,
  onSetSpecialization,
  currentTimeMs,
  onOpenShipyard,
  onOpenResearch,
  onOpenMarket,
  onOpenEspionage,
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
              <div className="text-sm font-bold text-white font-display flex items-center gap-2">
                {currentPlanet.name}
                {currentPlanet.isHomeworld && (
                  <span className="text-[9.5px] bg-amber-400/20 text-[#fbbf24] border border-amber-500/50 px-1.5 py-0.5 rounded-sm font-mono font-bold tracking-wide">
                    BAŞKENT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                Korumalı Depo: <strong className="text-white">{currentPlanet.protectedCapacity.toLocaleString()}</strong> br
              </div>
              {/* Planetary Hourly Production Strip */}
              <div className="flex items-center gap-1.5 mt-1 text-[10.5px] font-mono font-medium">
                <span className="text-orange-400 font-bold">
                  +{Math.round(calculateHourlyProduction('ore', currentPlanet.buildings.ore_mine || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-bold">
                  +{Math.round(calculateHourlyProduction('crystal', currentPlanet.buildings.crystal_synth || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold">
                  +{Math.round(calculateHourlyProduction('fuel', currentPlanet.buildings.fuel_refinery || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                {currentPlanet.specialization === 'mining_hub' && (
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/60 text-emerald-300 px-1 rounded-sm font-bold animate-pulse">
                    +%20
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Stance Selector */}
          <div className="flex items-center gap-1">
            {onOpenMarket && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenMarket();
                }}
                className="p-1.5 rounded-sm text-xs stellaris-btn-metallic text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Galaktik Borsa & Pazar (F6)"
              >
                <Coins className="w-4 h-4" />
              </button>
            )}
            {onOpenEspionage && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenEspionage(currentPlanet.id);
                }}
                className="p-1.5 rounded-sm text-xs stellaris-btn-metallic text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                title="Casusluk & Gölge Ağı (F7)"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
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

        {/* Planetary Specialization Focus (Vali Politikası) */}
        <div className="mt-2.5 pt-2.5 border-t border-[#18374b]/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <span>🏛️</span>
              <span>Vali Politikası</span>
            </span>
            <span className="text-[9.5px] font-mono text-cyan-300">
              {currentPlanet.specialization === 'mining_hub' ? 'Maden Dünyası (+%20 Üretim)' :
               currentPlanet.specialization === 'tech_haven' ? 'Bilim Cenneti (+%35 Ar-Ge)' :
               currentPlanet.specialization === 'military_bastion' ? 'Askeri Hisar (+%30 Savunma)' :
               'Dengeli Gelişim'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'balanced', label: 'Dengeli', icon: '⚖️', desc: 'Standart dengeli altyapı' },
              { id: 'mining_hub', label: 'Madencilik', icon: '⛏️', desc: '+%20 Cevher, Kristal ve Yakıt üretimi' },
              { id: 'tech_haven', label: 'Ar-Ge', icon: '🔬', desc: '+%35 Araştırma ve sensör menzili' },
              { id: 'military_bastion', label: 'Hisar', icon: '🛡️', desc: '+%30 Savunma bataryası gücü' },
            ].map((spec) => {
              const isActive = (currentPlanet.specialization || 'balanced') === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => {
                    sound.playClick();
                    if (onSetSpecialization) {
                      onSetSpecialization(currentPlanet.id, spec.id as PlanetSpecialization);
                    }
                  }}
                  className={`px-1.5 py-1 rounded-sm text-[10px] font-mono flex flex-col items-center gap-0.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950/80'
                      : 'bg-[#091522]/80 border-[#18374b] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                  title={`${spec.label}: ${spec.desc}`}
                >
                  <span className="text-xs">{spec.icon}</span>
                  <span className="truncate w-full text-center">{spec.label}</span>
                </button>
              );
            })}
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
                  <span className="text-xs font-bold text-white font-display">
                    {stats.nameTr}
                  </span>
                  <span className="text-[10.5px] font-mono text-cyan-300 font-bold bg-[#07101a] px-1.5 py-0.5 rounded-sm border border-[#19384c]">
                    Sv. {currentLevel}
                  </span>
                  {(type === 'ore_mine' || type === 'crystal_synth' || type === 'fuel_refinery') && currentLevel > 0 && (
                    <span className="text-[10.5px] font-mono text-emerald-400 font-bold">
                      +{calculateHourlyProduction(type === 'ore_mine' ? 'ore' : type === 'crystal_synth' ? 'crystal' : 'fuel', currentLevel)}/s
                    </span>
                  )}
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
                        sound.playConstruction();
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
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono font-medium">
                <span className={currentPlanet.resources.ore >= nextCost.ore ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                  {nextCost.ore} Cevher
                </span>
                <span className="text-slate-600">•</span>
                <span className={currentPlanet.resources.crystal >= nextCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                  {nextCost.crystal} Kristal
                </span>
                {nextCost.fuel > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className={currentPlanet.resources.fuel >= nextCost.fuel ? 'text-amber-300' : 'text-rose-400 font-bold'}>
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
                  <span className="text-xs text-slate-200 font-medium">{names[st]}</span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orbital Defense Platforms Stationed Roster */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>YÖRÜNGE SAVUNMA BATARYALARI</span>
            </span>
            {currentPlanet.defenseQueue && currentPlanet.defenseQueue.length > 0 && (
              <span className="text-[10px] font-mono text-emerald-300 animate-pulse font-bold">
                {currentPlanet.defenseQueue.reduce((a, b) => a + (b.count - b.completed), 0)} İnşa Ediliyor
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">🚀</span>
              <span className="text-[11px] text-slate-200 font-medium">Füze</span>
              <span className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                {currentPlanet.defenses?.missile_battery || 0}
              </span>
            </div>
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">🔥</span>
              <span className="text-[11px] text-slate-200 font-medium">Plazma</span>
              <span className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                {currentPlanet.defenses?.plasma_turret || 0}
              </span>
            </div>
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">⚡</span>
              <span className="text-[11px] text-slate-200 font-medium">İyon</span>
              <span className="text-sm font-mono font-bold text-purple-300 mt-0.5">
                {currentPlanet.defenses?.ion_cannon || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const PlanetPanel = React.memo(PlanetPanelComponent);
