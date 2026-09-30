import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  CircleDot,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gem,
  Globe,
  HelpCircle,
  Moon,
  Navigation,
  Pause,
  Pickaxe,
  Play,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { calculateHourlyProduction } from '../../engine/constants';
import { GameState, Planet } from '../../engine/types';
import { formatDuration, formatSimClock } from '../timeUtils';
import { sound } from '../sound';

interface TopBarProps {
  state: GameState;
  activePlayerId: string;
  activePlanet: Planet | undefined;
  isPlaying: boolean;
  timeScale: number;
  godMode: boolean;
  onTogglePlay: () => void;
  onSetTimeScale: (scale: number) => void;
  onStepTick: () => void;
  onFastForwardMinutes: (minutes: number) => void;
  onToggleGodMode: () => void;
  onSelectPlayer: (id: string) => void;
  onOpenPlanetPanel?: () => void;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onOpenTransitRadar?: () => void;
  onOpenBattles?: () => void;
  onOpenRelay?: () => void;
  onOpenAlliance?: () => void;
  onOpenGallery?: () => void;
  onOpenOrientation?: () => void;
  onToggleVacationMode?: () => void;
  onReset: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  activePlayerId,
  activePlanet,
  isPlaying,
  timeScale,
  godMode,
  onTogglePlay,
  onSetTimeScale,
  onStepTick,
  onFastForwardMinutes,
  onToggleGodMode,
  onSelectPlayer,
  onOpenPlanetPanel,
  onOpenShipyard,
  onOpenResearch,
  onOpenTransitRadar,
  onOpenBattles,
  onOpenRelay,
  onOpenAlliance,
  onOpenGallery,
  onOpenOrientation,
  onToggleVacationMode,
  onReset,
  isMuted: propIsMuted,
  onToggleMute: propOnToggleMute,
}) => {
  const [internalMuted, setInternalMuted] = useState<boolean>(sound.isMuted);
  const isAudioMuted = propIsMuted !== undefined ? propIsMuted : internalMuted;
  const handleToggleMute = propOnToggleMute || (() => {
    const next = sound.toggleMute();
    setInternalMuted(next);
  });

  // Active player info
  const activePlayer = state.players[activePlayerId];

  // Empire Colonies Metrics & Breakdown
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const myColonySystemIds = new Set(myPlanets.map((p) => p.systemId));

  // Empire Naval Fleet Metrics & Ship Breakdown
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId);
  const shipCounts = {
    battleship: 0,
    fighter: 0,
    transport: 0,
    scout: 0,
  };
  let totalGarrisonShips = 0;
  let totalFleetShips = 0;

  myPlanets.forEach((p) => {
    Object.entries(p.garrison).forEach(([type, count]) => {
      if (type in shipCounts) {
        shipCounts[type as keyof typeof shipCounts] += count || 0;
      }
      totalGarrisonShips += count || 0;
    });
  });

  myFleets.forEach((f) => {
    Object.entries(f.ships).forEach(([type, count]) => {
      if (type in shipCounts) {
        shipCounts[type as keyof typeof shipCounts] += count || 0;
      }
      totalFleetShips += count || 0;
    });
  });

  const totalEmpireShips = totalGarrisonShips + totalFleetShips;

  // Moving Fleets Metrics & Threat Detection
  const movingFleets = Object.values(state.fleets).filter(
    (f) => f.status === 'in_transit' || f.status === 'returning' || f.status === 'intercepting'
  );
  const myMovingFleets = movingFleets.filter((f) => f.ownerId === activePlayerId);

  // Incoming threats targeting active player's world
  const incomingThreats = movingFleets.filter((f) => {
    if (f.ownerId === activePlayerId) return false;
    if (f.targetPlanetId && state.planets[f.targetPlanetId]?.ownerId === activePlayerId) {
      return f.mission === 'attack';
    }
    return myColonySystemIds.has(f.targetSystemId) && f.mission === 'attack';
  });

  // Calculate hourly rates for active planet
  const oreRate = activePlanet ? calculateHourlyProduction('ore', activePlanet.buildings.ore_mine) : 0;
  const crystalRate = activePlanet ? calculateHourlyProduction('crystal', activePlanet.buildings.crystal_synth) : 0;
  const fuelRate = activePlanet ? calculateHourlyProduction('fuel', activePlanet.buildings.fuel_refinery) : 0;

  // Relay weekly score
  const myRelayPoints = state.relay.weeklyPoints?.[activePlayerId] || 0;

  // Format date in classic Stellaris format: YYYY.MM.DD
  const baseYear = 2240;
  const totalDays = Math.floor(state.timeMs / (24 * 3600 * 1000));
  const year = baseYear + Math.floor(totalDays / 360);
  const month = Math.floor((totalDays % 360) / 30) + 1;
  const day = (totalDays % 30) + 1;
  const stellarisDate = `${year}.${month < 10 ? '0' : ''}${month}.${day < 10 ? '0' : ''}${day}`;

  return (
    <header className="h-13 stellaris-topbar px-3 flex items-center justify-between z-30 select-none relative">
      {/* Top Subtle Metallic Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* ========================================================================= */}
      {/* LEFT: Empire Crest, Name & Player Switcher                                */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          onClick={() => {
            sound.playClick();
            if (onOpenPlanetPanel) onOpenPlanetPanel();
          }}
          className="w-8 h-8 rounded stellaris-crest flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 shadow-lg"
          style={{
            borderColor: '#c5a059',
            backgroundColor: `${activePlayer?.color || '#00f3ff'}20`,
            boxShadow: `0 0 10px ${activePlayer?.color || '#00f3ff'}50, inset 0 0 6px rgba(0,0,0,0.8)`,
          }}
          title={`${activePlayer?.name || 'İmparatorluk'} — Yönetim & Gezegenler`}
        >
          <Crown className="w-4 h-4 text-[#e5c578]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-slate-100 font-display uppercase tracking-wider leading-none">
              {activePlayer?.name || 'Galaksi İmparatorluğu'}
            </span>
            <select
              value={activePlayerId}
              onChange={(e) => {
                sound.playClick();
                onSelectPlayer(e.target.value);
              }}
              className="bg-[#060c14] border border-[#1a384d] hover:border-cyan-400 text-[9px] font-mono rounded-sm px-1.5 py-0.5 text-cyan-300 focus:outline-none cursor-pointer"
              title="Diplomatik Perspektif Değiştir"
            >
              {Object.values(state.players).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isBot ? `🤖 ${p.name}` : `👤 ${p.name}`}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[8.5px] font-mono text-[#c5a059] uppercase tracking-wider mt-0.5">
            YILDIZLARARASI HÜKÜMET
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CENTER: Empire Core Vitals (Planets, Fleet, Radar, Resources)             */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 bg-[#060c14]/90 p-1 rounded-sm border border-[#142e40] shadow-inner">
        {/* 1. EMPIRE COLONIES CHIP (With Rich Hover Tooltip & Click Action) */}
        <div className="relative group">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenPlanetPanel) onOpenPlanetPanel();
            }}
            className="stellaris-resource-pod px-2.5 py-1 rounded-sm text-emerald-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="İmparatorluk Kolonileri Paneli (F1)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold">{myPlanets.length}</span>
            <span className="text-slate-400 text-[10px]">/ 3 Koloni</span>
          </button>

          {/* Rich Tooltip Card */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[280px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-100 font-display">
                🪐 İmparatorluk Kolonileri
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-sm border border-emerald-500/40">
                {myPlanets.length} / 3 Yuva
              </span>
            </div>

            <div className="mt-2 space-y-1.5 text-xs font-mono">
              {myPlanets.map((p) => {
                const totalBldgs = Object.values(p.buildings).reduce((a, b) => a + (b || 0), 0);
                return (
                  <div
                    key={p.id}
                    className="p-1.5 rounded-sm stellaris-item-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          p.isHomeworld ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-200">{p.name}</span>
                      {p.isHomeworld && (
                        <span className="text-[9px] text-amber-300 bg-amber-950/60 px-1 rounded-sm">
                          Ana Dünya
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {p.buildingQueue ? '🏗️ İnşaat Var' : `${totalBldgs} Tesis`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-cyan-400 font-mono text-center">
              Koloni yönetim panelini açmak için tıklayın (F1)
            </div>
          </div>
        </div>

        {/* 2. EMPIRE FLEET & SHIPS CHIP (With Rich Hover Tooltip & Click Action) */}
        <div className="relative group">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenShipyard) onOpenShipyard();
            }}
            className="stellaris-resource-pod px-2.5 py-1 rounded-sm text-blue-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="İmparatorluk Donanma Gücü & Tersane (F2)"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold">{totalEmpireShips}</span>
            <span className="text-slate-400 text-[10px]">/ 30 Gemi</span>
          </button>

          {/* Rich Tooltip Card */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[280px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-100 font-display">
                ⚔️ İmparatorluk Donanma Gücü
              </span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded-sm border border-blue-500/40">
                {totalEmpireShips} / 30 Kapasite
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="p-1.5 rounded-sm stellaris-item-card flex items-center justify-between">
                <span className="text-slate-400">🛡️ Kruvazör</span>
                <span className="font-bold text-purple-300">{shipCounts.battleship}</span>
              </div>
              <div className="p-1.5 rounded-sm stellaris-item-card flex items-center justify-between">
                <span className="text-slate-400">⚔️ Avcı Filosu</span>
                <span className="font-bold text-rose-300">{shipCounts.fighter}</span>
              </div>
              <div className="p-1.5 rounded-sm stellaris-item-card flex items-center justify-between">
                <span className="text-slate-400">📦 Ağır Nakliye</span>
                <span className="font-bold text-amber-300">{shipCounts.transport}</span>
              </div>
              <div className="p-1.5 rounded-sm stellaris-item-card flex items-center justify-between">
                <span className="text-slate-400">🔭 Keşif Gemisi</span>
                <span className="font-bold text-cyan-300">{shipCounts.scout}</span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Konuşlanma:</span>
              <span className="text-slate-200">
                {totalGarrisonShips} Garnizonlarda • {totalFleetShips} Seferde
              </span>
            </div>

            <div className="mt-1 pt-1 text-[10px] text-cyan-400 font-mono text-center">
              Tersaneyi açıp yeni gemi üretmek için tıklayın (F2)
            </div>
          </div>
        </div>

        {/* 3. TACTICAL TRANSIT RADAR CHIP (Friendly Flights & Hostile Threats!) */}
        <div className="relative group">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenTransitRadar) onOpenTransitRadar();
            }}
            className={`stellaris-resource-pod px-2.5 py-1 rounded-sm font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              incomingThreats.length > 0
                ? 'border-rose-500 bg-rose-950/80 text-rose-300 animate-pulse shadow-rose-950/60'
                : myMovingFleets.length > 0
                ? 'border-cyan-500/50 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Taktik İntikal Radarı (F4)"
          >
            {incomingThreats.length > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold text-rose-300">
                  {incomingThreats.length} TEHDİT!
                </span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">
                  {myMovingFleets.length > 0 ? `${myMovingFleets.length} Sefer` : 'Radar'}
                </span>
              </>
            )}
          </button>

          {/* Rich Tooltip Card */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[300px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-100 font-display">
                🛸 Taktik İntikal & Filo Radarı
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded-sm border border-cyan-500/40">
                {movingFleets.length} Aktif İntikal
              </span>
            </div>

            {incomingThreats.length > 0 && (
              <div className="mt-2 p-2 rounded-sm bg-rose-950/60 border border-rose-500/60 text-xs font-mono text-rose-300">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>DÜŞMAN BASKIN FİLOSU TESPİT EDİLDİ!</span>
                </div>
                <div className="text-[10px] text-rose-400/90 mt-1">
                  En yakın tehdit {formatDuration(Math.max(0, incomingThreats[0].arrivalTime - state.timeMs))} içinde varıyor.
                </div>
              </div>
            )}

            <div className="mt-2 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">🟢 Dost Filolarımız:</span>
                <span className="font-bold text-emerald-400">{myMovingFleets.length} yolda</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">🔴 Düşman / Korsan Filoları:</span>
                <span className="font-bold text-rose-400">
                  {movingFleets.length - myMovingFleets.length} radarda
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-cyan-400 font-mono text-center">
              Taktik intikal radarını açmak için tıklayın (F4)
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-[#18374a] mx-0.5 hidden lg:block" />

        {/* 4. STRATEGIC RESOURCES RIBBON (Compact Numbers + Rich Hover Tooltips) */}
        {activePlanet && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
            {/* Energy / Fuel */}
            <div className="stellaris-resource-pod px-2 py-0.5 rounded-sm relative group flex items-center gap-1.5 cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-950/60 flex items-center justify-center text-amber-400 border border-amber-500/30">
                <Zap className="w-2.5 h-2.5" />
              </div>
              <span className="font-bold text-slate-100">
                {Math.floor(activePlanet.resources.fuel).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400">+{fuelRate}</span>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[200px] stellaris-tooltip rounded-sm p-2.5 shadow-2xl ">
                <span className="font-bold text-amber-300 text-xs block mb-1">⚡ Enerji / Yakıt</span>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Filo seferleri ve sistem operasyonları için tüketilir.
                </p>
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400">+{fuelRate} / saat</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Depo Sınırı:</span>
                  <span>{activePlanet.storageCap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Ore / Minerals */}
            <div className="stellaris-resource-pod px-2 py-0.5 rounded-sm relative group flex items-center gap-1.5 cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-sm bg-orange-950/60 flex items-center justify-center text-orange-400 border border-orange-500/30">
                <Pickaxe className="w-2.5 h-2.5" />
              </div>
              <span className="font-bold text-slate-100">
                {Math.floor(activePlanet.resources.ore).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400">+{oreRate}</span>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[200px] stellaris-tooltip rounded-sm p-2.5 shadow-2xl ">
                <span className="font-bold text-orange-300 text-xs block mb-1">⛏️ Ham Maden / Cevher</span>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Bina yükseltmeleri ve gövde inşasında kullanılır.
                </p>
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400">+{oreRate} / saat</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Depo Sınırı:</span>
                  <span>{activePlanet.storageCap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Rare Crystals */}
            <div className="stellaris-resource-pod px-2 py-0.5 rounded-sm relative group flex items-center gap-1.5 cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-sm bg-cyan-950/60 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                <Gem className="w-2.5 h-2.5" />
              </div>
              <span className="font-bold text-slate-100">
                {Math.floor(activePlanet.resources.crystal).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400">+{crystalRate}</span>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[200px] stellaris-tooltip rounded-sm p-2.5 shadow-2xl ">
                <span className="font-bold text-cyan-300 text-xs block mb-1">💎 Nadir Kristaller</span>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Gelişmiş kalkan, teknoloji ve avcı üretimi gerektirir.
                </p>
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400">+{crystalRate} / saat</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Depo Sınırı:</span>
                  <span>{activePlanet.storageCap.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. RESEARCH / AR-GE STATUS CHIP */}
        <div className="relative group hidden xl:block">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenResearch) onOpenResearch();
            }}
            className="stellaris-resource-pod px-2.5 py-1 rounded-sm text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="İmparatorluk Ar-Ge Ağacı (F3)"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold">
              {activePlayer?.researchQueue
                ? `${activePlayer.researchQueue.type === 'engines' ? 'Motor' : activePlayer.researchQueue.type === 'weapons' ? 'Silah' : 'Sensör'} L${activePlayer.researchQueue.targetLevel}`
                : `Ar-Ge L${(activePlayer?.research.engines || 0) + (activePlayer?.research.weapons || 0) + (activePlayer?.research.sensors || 0)}`}
            </span>
          </button>

          {/* Research Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 shadow-2xl  text-left">
            <span className="font-bold text-cyan-300 text-xs block mb-1">🔬 Teknoloji & Ar-Ge</span>
            <p className="text-[10px] text-slate-400 leading-snug">
              {activePlayer?.researchQueue
                ? `Şu anda ${activePlayer.researchQueue.type} araştırması yürütülüyor. Kalan: ${formatDuration(Math.max(0, activePlayer.researchQueue.finishTime - state.timeMs))}`
                : 'Şu anda aktif bir araştırma yok. Yeni teknoloji başlatın.'}
            </p>
          </div>
        </div>

        {/* Nexus Relay Points (If any) */}
        {myRelayPoints > 0 && (
          <div
            onClick={() => {
              sound.playClick();
              if (onOpenRelay) onOpenRelay();
            }}
            className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-sm stellaris-resource-pod text-purple-300 font-mono text-xs cursor-pointer hover:border-purple-400"
            title="Nexus Röle Haftalık Zafer Puanı"
          >
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold">{myRelayPoints} Puan</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Time Flow, Calendar, Speed Pips & Tools                            */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            onTogglePlay();
          }}
          className={`px-2.5 py-1 rounded-sm border text-xs font-mono font-bold flex items-center gap-1 transition-all ${
            !isPlaying
              ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-md shadow-rose-950/60'
              : 'stellaris-btn-metallic text-emerald-400 hover:text-emerald-300'
          }`}
          title="Zamanı Durdur / Başlat (Space)"
        >
          {!isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">DURAKLATILDI</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ÇALIŞIYOR</span>
            </>
          )}
        </button>

        {/* Speed Pips (> >> >>> >>>>) */}
        <div className="flex items-center bg-[#07101c] border border-[#14263b] rounded-sm p-0.5 text-xs font-mono">
          {[
            { scale: 1, label: '>' },
            { scale: 5, label: '>>' },
            { scale: 20, label: '>>>' },
            { scale: 60, label: '>>>>' },
          ].map((s) => (
            <button
              key={s.scale}
              onClick={() => {
                sound.playClick();
                onSetTimeScale(s.scale);
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded-sm transition-all font-bold ${
                timeScale === s.scale
                  ? 'bg-amber-500/25 text-[#e5c578] border border-amber-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`${s.scale}x Hızlandırma`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stellaris Cosmic Date Display */}
        <div className="stellaris-date-badge px-2.5 py-1 rounded-sm text-xs font-mono font-bold text-[#e5c578] tracking-widest border border-[#1c3c50] shadow-inner hidden md:block">
          {stellarisDate}
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Utility Toggles: Sound, God Mode, Guide, Reset */}
        <button
          onClick={handleToggleMute}
          className={`stellaris-btn-metallic p-1.5 rounded-sm border transition-all ${
            !isAudioMuted
              ? 'border-cyan-500/40 text-cyan-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={!isAudioMuted ? 'Ses Açık' : 'Ses Kapalı'}
        >
          {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onToggleGodMode();
          }}
          className={`stellaris-btn-metallic p-1.5 rounded-sm border transition-all ${
            godMode
              ? 'border-purple-500/50 text-purple-300'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={godMode ? 'Tanrı Modu: Açık (Sis Kapalı)' : 'Tanrı Modu: Kapalı'}
        >
          {godMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {onOpenOrientation && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenOrientation();
            }}
            className="stellaris-btn-metallic p-1.5 rounded-sm border border-amber-500/40 text-[#e5c578] hover:text-amber-200 transition-all flex items-center gap-1 text-[11px] font-mono"
            title="Oyun Rehberi & Filo Hareket Oryantasyonu"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px] font-bold">Rehber</span>
          </button>
        )}

        <button
          onClick={() => {
            sound.playClick();
            onReset();
          }}
          className="stellaris-btn-metallic p-1.5 rounded-sm border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-all"
          title="Simülasyonu Sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
