import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gem,
  Globe,
  HelpCircle,
  LineChart,
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
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { calculateHourlyProduction } from '../../engine/constants';
import { GameState, Planet } from '../../engine/types';
import { evaluatePlayerDirectives } from '../../engine/directives';
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
  onOpenMarket?: () => void;
  onOpenEspionage?: () => void;
  onOpenSituationLog?: () => void;
  onOpenBattles?: () => void;
  onOpenRelay?: () => void;
  onOpenAlliance?: () => void;
  onOpenVictory?: () => void;
  onOpenTraditions?: () => void;
  onOpenArchaeology?: () => void;
  onOpenTerraform?: () => void;
  onOpenTradeRoutes?: () => void;
  onOpenWarfare?: () => void;
  onOpenFederation?: () => void;
  onOpenMegacorp?: () => void;
  onOpenColossus?: () => void;
  onOpenSynthetics?: () => void;
  onOpenParagons?: () => void;
  onOpenHyperRelays?: () => void;
  onOpenGallery?: () => void;
  onOpenOrientation?: () => void;
  onToggleVacationMode?: () => void;
  onReset: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const TopBarComponent: React.FC<TopBarProps> = ({
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
  onOpenMarket,
  onOpenEspionage,
  onOpenSituationLog,
  onOpenBattles,
  onOpenRelay,
  onOpenAlliance,
  onOpenVictory,
  onOpenTraditions,
  onOpenArchaeology,
  onOpenTerraform,
  onOpenTradeRoutes,
  onOpenWarfare,
  onOpenFederation,
  onOpenMegacorp,
  onOpenColossus,
  onOpenSynthetics,
  onOpenParagons,
  onOpenHyperRelays,
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

  // Empire Directives & Milestones
  const playerDirectives = evaluatePlayerDirectives(state, activePlayerId);
  const unclaimedDirectivesCount = playerDirectives.filter((d) => d.isCompleted && !d.isClaimed).length;
  const nextActiveDirective = playerDirectives.find((d) => !d.isCompleted) || playerDirectives.find((d) => !d.isClaimed);

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

  // Empire Naval Fleet Power calculation matching Konsept B
  const totalFleetPower =
    shipCounts.battleship * 1400 +
    shipCounts.fighter * 380 +
    shipCounts.transport * 60 +
    shipCounts.scout * 90;
  const formattedFleetPower =
    totalFleetPower >= 1000
      ? `${(totalFleetPower / 1000).toFixed(1)}k`
      : `${totalFleetPower}`;

  const formatCompactResource = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 10000) return `${(val / 1000).toFixed(1)}k`;
    return Math.floor(val).toLocaleString();
  };

  // Relay weekly score
  const myRelayPoints = state.relay.weeklyPoints?.[activePlayerId] || 0;

  // Galactic Victory Leader & Metrics (Phase 4)
  const colonizedPlanets = Object.values(state.planets).filter((p) => !!p.ownerId);
  const totalColonizedCount = colonizedPlanets.length;

  let hegemonyLeader = { id: '', name: 'Yok', points: 0 };
  let colonyLeader = { id: '', name: 'Yok', count: 0, ratio: 0 };

  for (const p of Object.values(state.players)) {
    const pts = state.relay?.weeklyPoints?.[p.id] || 0;
    if (pts > hegemonyLeader.points) {
      hegemonyLeader = { id: p.id, name: p.name, points: pts };
    }
    const myColCount = colonizedPlanets.filter((pl) => pl.ownerId === p.id).length;
    if (myColCount > colonyLeader.count) {
      colonyLeader = {
        id: p.id,
        name: p.name,
        count: myColCount,
        ratio: totalColonizedCount > 0 ? myColCount / totalColonizedCount : 0,
      };
    }
  }

  // Format date in classic Stellaris format: YYYY.MM.DD
  const baseYear = 2240;
  const totalDays = Math.floor(state.timeMs / (24 * 3600 * 1000));
  const year = baseYear + Math.floor(totalDays / 360);
  const month = Math.floor((totalDays % 360) / 30) + 1;
  const day = (totalDays % 30) + 1;
  const stellarisDate = `${year}.${month < 10 ? '0' : ''}${month}.${day < 10 ? '0' : ''}${day}`;

  return (
    <header className="h-12 stellaris-topbar px-3 py-1 flex items-center justify-between z-30 select-none relative">
      {/* Top Subtle Metallic Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#fbbf24]/50 to-transparent" />

      {/* ========================================================================= */}
      {/* LEFT: Empire Crest, Name & Player Switcher                                */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          onClick={() => {
            sound.playClick();
            if (onOpenPlanetPanel) onOpenPlanetPanel();
          }}
          className="w-8 h-8 rounded-sm stellaris-crest flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 shadow-md"
          style={{
            borderColor: '#fbbf24',
            backgroundColor: `${activePlayer?.color || '#00f3ff'}25`,
            boxShadow: `0 0 12px ${activePlayer?.color || '#00f3ff'}50, inset 0 0 6px rgba(0,0,0,0.85)`,
          }}
          title={`${activePlayer?.name || 'İmparatorluk'} — Yönetim & Gezegenler (F1)`}
        >
          <Crown className="w-4 h-4 text-[#fbbf24]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-display uppercase tracking-wider leading-none">
              {activePlayer?.name || 'Galaksi İmparatorluğu'}
            </span>
            <select
              value={activePlayerId}
              onChange={(e) => {
                sound.playClick();
                onSelectPlayer(e.target.value);
              }}
              className="bg-[#070e17] border border-[#2b3e54] hover:border-[#fbbf24] text-[11px] font-mono font-medium rounded-sm px-1.5 py-0.5 text-amber-200 focus:outline-none cursor-pointer"
              title="Diplomatik Perspektif Değiştir"
            >
              {Object.values(state.players).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isBot ? `🤖 ${p.name}` : `👤 ${p.name}`}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[9px] font-mono font-semibold text-amber-300/90 uppercase tracking-wider mt-0.5">
            TERRAN ALLIANCE • SEKTÖR 01
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CENTER: Empire Core Vitals (Planets, Fleet, Radar, Resources)             */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 bg-[#070c14] p-1 rounded-sm border border-[#26374a] shadow-inner">
        {/* 1. EMPIRE COLONIES CHIP (With Rich Hover Tooltip & Click Action) */}
        <div className="relative group">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenPlanetPanel) onOpenPlanetPanel();
            }}
            className="stellaris-resource-pod px-2.5 py-1 rounded-sm text-emerald-300 font-mono text-xs flex flex-col justify-center transition-all cursor-pointer"
            title="İmparatorluk Kolonileri Paneli (F1)"
          >
            <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <span>KOLONİLER</span>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">{myPlanets.length}/3</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-bold text-white text-[12px]">{myPlanets.length} Koloni</span>
            </div>
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
            className="stellaris-resource-pod px-2.5 py-1 rounded-sm text-blue-300 font-mono text-xs flex flex-col justify-center transition-all cursor-pointer"
            title="İmparatorluk Donanma Gücü & Tersane (F2)"
          >
            <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <span>DONANMA</span>
              <span className="text-amber-300 font-mono font-bold text-[11px]">{formattedFleetPower}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono mt-0.5">
              <Shield className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="font-bold text-white text-[12px]">{totalEmpireShips}/30</span>
              <div className="w-7 h-2 bg-[#08121c] border border-blue-500/40 rounded-none overflow-hidden shrink-0">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalEmpireShips / 30) * 100)}%` }}
                />
              </div>
            </div>
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
            className={`stellaris-resource-pod px-3 py-1.5 rounded-sm font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              incomingThreats.length > 0
                ? 'border-rose-500 bg-rose-950 text-rose-200 animate-pulse shadow-rose-950/80'
                : myMovingFleets.length > 0
                ? 'border-cyan-500/60 text-cyan-200'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Taktik İntikal Radarı (F4)"
          >
            {incomingThreats.length > 0 ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-rose-200 text-xs">
                  {incomingThreats.length} TEHDİT!
                </span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs">
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

        {/* 4. STRATEGIC RESOURCES RIBBON WITH SPARKLINES (Konsept B) */}
        {activePlanet && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
            {/* Ore / Minerals */}
            <div className="stellaris-resource-pod px-2.5 py-1 rounded-sm relative group flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                <span>CEVHER</span>
                <span className="text-emerald-400 font-mono font-bold text-[10.5px]">+{oreRate}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono mt-0.5">
                <Pickaxe className="w-3 h-3 text-orange-400 shrink-0" />
                <span className="font-bold text-white text-[13px] tracking-tight">
                  {formatCompactResource(activePlanet.resources.ore)}
                </span>
                <svg className="w-7 h-2.5 shrink-0 opacity-90" viewBox="0 0 24 8" fill="none">
                  <path d="M0 6 L4 5 L8 7 L12 4 L16 5 L20 2 L24 3" stroke="#fb923c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
                <span className="font-bold text-orange-300 text-xs block mb-1">⛏️ Ham Maden / Cevher</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Bina yükseltmeleri ve gövde inşasında kullanılır.
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-200 flex justify-between font-mono">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400 font-bold">+{oreRate} / saat</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono mt-0.5">
                  <span>Depo Sınırı:</span>
                  <span className="text-white font-bold">{activePlanet.storageCap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Rare Crystals */}
            <div className="stellaris-resource-pod px-2.5 py-1 rounded-sm relative group flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                <span>KRİSTAL</span>
                <span className="text-cyan-400 font-mono font-bold text-[10.5px]">+{crystalRate}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono mt-0.5">
                <Gem className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-bold text-white text-[13px] tracking-tight">
                  {formatCompactResource(activePlanet.resources.crystal)}
                </span>
                <svg className="w-7 h-2.5 shrink-0 opacity-90" viewBox="0 0 24 8" fill="none">
                  <path d="M0 7 L4 6 L8 4 L12 5 L16 3 L20 4 L24 1" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
                <span className="font-bold text-cyan-300 text-xs block mb-1">💎 Nadir Kristaller</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Gelişmiş kalkan, teknoloji ve avcı üretimi gerektirir.
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-200 flex justify-between font-mono">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400 font-bold">+{crystalRate} / saat</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono mt-0.5">
                  <span>Depo Sınırı:</span>
                  <span className="text-white font-bold">{activePlanet.storageCap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Energy / Fuel */}
            <div className="stellaris-resource-pod px-2.5 py-1 rounded-sm relative group flex flex-col justify-center cursor-pointer">
              <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                <span>YAKIT</span>
                <span className="text-amber-300 font-mono font-bold text-[10.5px]">+{fuelRate}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono mt-0.5">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-bold text-white text-[13px] tracking-tight">
                  {formatCompactResource(activePlanet.resources.fuel)}
                </span>
                <svg className="w-7 h-2.5 shrink-0 opacity-90" viewBox="0 0 24 8" fill="none">
                  <path d="M0 5 L4 7 L8 5 L12 3 L16 4 L20 2 L24 1" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Resource Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
                <span className="font-bold text-amber-300 text-xs block mb-1">⚡ Enerji / Yakıt</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Filo seferleri ve sistem operasyonları için tüketilir.
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-200 flex justify-between font-mono">
                  <span>Saatlik Gelir:</span>
                  <span className="text-emerald-400 font-bold">+{fuelRate} / saat</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono mt-0.5">
                  <span>Depo Sınırı:</span>
                  <span className="text-white font-bold">{activePlanet.storageCap.toLocaleString()}</span>
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
            className="stellaris-resource-pod px-2.5 py-1.5 rounded-sm text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="İmparatorluk Ar-Ge Ağacı (F3)"
          >
            <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white text-xs">
              {activePlayer?.researchQueue
                ? `${activePlayer.researchQueue.type === 'engines' ? 'Motor' : activePlayer.researchQueue.type === 'weapons' ? 'Silah' : 'Sensör'} L${activePlayer.researchQueue.targetLevel}`
                : `Ar-Ge L${(activePlayer?.research.engines || 0) + (activePlayer?.research.weapons || 0) + (activePlayer?.research.sensors || 0)}`}
            </span>
          </button>

          {/* Research Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <span className="font-bold text-cyan-300 text-xs block mb-1">🔬 Teknoloji & Ar-Ge</span>
            <p className="text-[11px] text-slate-300 leading-snug">
              {activePlayer?.researchQueue
                ? `Şu anda ${activePlayer.researchQueue.type} araştırması yürütülüyor. Kalan: ${formatDuration(Math.max(0, activePlayer.researchQueue.finishTime - state.timeMs))}`
                : 'Şu anda aktif bir araştırma yok. Yeni teknoloji başlatın.'}
            </p>
          </div>
        </div>

        {/* 6. CULTURAL UNITY & TRADITIONS QUICK CHIP */}
        {state.traditions?.[activePlayerId] && (
          <div className="relative group hidden xl:block">
            <button
              onClick={() => {
                sound.playClick();
                if (onOpenTraditions) onOpenTraditions();
              }}
              className="stellaris-resource-pod px-2.5 py-1.5 rounded-sm text-purple-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:border-purple-400"
              title="Kültürel Birlik & Gelenek Ağaçları"
            >
              <BookOpen className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-white text-xs">
                {Math.floor(state.traditions[activePlayerId].unity)}
              </span>
              <span className="text-[10px] text-purple-300 font-bold">
                +{state.traditions[activePlayerId].unityRatePerHour.toFixed(1)}/s
              </span>
              {state.traditions[activePlayerId].availablePerkSlots > 0 && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              )}
            </button>

            {/* Unity Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
              <span className="font-bold text-purple-300 text-xs block mb-1">🏛️ Kültürel Birlik & Gelenekler</span>
              <p className="text-[11px] text-slate-300 leading-snug">
                İmparatorluk kültürü ve gelenek ağaçlarını benimseyin. Tamamlanan her ağaç bir Yükseliş Ayrıcalığı yuvası açar.
              </p>
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-200 flex justify-between font-mono">
                <span>Birlik Birikimi:</span>
                <span className="text-purple-300 font-bold">{Math.floor(state.traditions[activePlayerId].unity)} Birlik</span>
              </div>
              <div className="text-[11px] text-slate-300 flex justify-between font-mono mt-0.5">
                <span>Saatlik Artış:</span>
                <span className="text-emerald-400 font-bold">+{state.traditions[activePlayerId].unityRatePerHour.toFixed(1)} / saat</span>
              </div>
              {state.traditions[activePlayerId].availablePerkSlots > 0 && (
                <div className="mt-1 text-[10px] text-amber-300 font-bold font-mono">
                  ✨ {state.traditions[activePlayerId].availablePerkSlots} Seçilebilir Yükseliş Yuvası Var!
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOOMSDAY SUPERWEAPON CHARGING ALERT (ONLY VISIBLE WHEN ACTIVELY CHARGING) */}
        {(() => {
          const anyCharging = Object.values(state.colossi || {}).find((c) => c.status === 'charging');
          if (!anyCharging) return null;
          const isMyShip = anyCharging.ownerId === activePlayerId;

          return (
            <div className="relative group">
              <button
                onClick={() => {
                  sound.playClick();
                  if (onOpenColossus) onOpenColossus();
                }}
                className="stellaris-resource-pod px-2.5 py-1 rounded-sm font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer border-rose-500 bg-rose-950/80 text-rose-200 animate-pulse shadow-md shadow-rose-950/80"
                title="Kolossus Gezegen Yok Edici Silahı Şarj Ediliyor!"
              >
                <Skull className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                <span className="font-bold text-white text-xs truncate max-w-[95px]">
                  {isMyShip ? 'KOLOSSUS: ŞARJ' : 'DOOMSDAY UYARISI!'}
                </span>
                <span className="text-[10px] text-rose-400 font-bold animate-ping">
                  ⚠️
                </span>
              </button>
            </div>
          );
        })()}


        {/* 8. EMPIRE DIRECTIVES & MILESTONES CHIP */}
        <div className="relative group hidden lg:block">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSituationLog) onOpenSituationLog();
            }}
            className={`stellaris-resource-pod px-2.5 py-1.5 rounded-sm font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              unclaimedDirectivesCount > 0
                ? 'bg-amber-950/80 border-amber-400 text-amber-200 animate-pulse shadow-md shadow-amber-500/30'
                : 'text-amber-300 hover:border-amber-400'
            }`}
            title="İmparatorluk Direktifleri ve Görev Kütüğü (F8)"
          >
            <Target className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white text-xs">Direktif:</span>
            {unclaimedDirectivesCount > 0 ? (
              <span className="text-[10.5px] bg-amber-500 text-black px-1.5 py-0.5 rounded-sm font-extrabold animate-pulse">
                +{unclaimedDirectivesCount} ÖDÜL!
              </span>
            ) : nextActiveDirective ? (
              <span className="text-[11px] text-amber-300 font-bold truncate max-w-[100px]">
                {nextActiveDirective.title}
              </span>
            ) : (
              <span className="text-[11px] text-emerald-400 font-bold">10/10</span>
            )}
          </button>

          {/* Directives Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[280px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-xs font-bold text-amber-300 font-display flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>🎯 İmparatorluk Direktifleri</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {playerDirectives.filter((d) => d.isClaimed).length} / {playerDirectives.length} Tamam
              </span>
            </div>

            {nextActiveDirective ? (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white">
                  {nextActiveDirective.title}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {nextActiveDirective.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#06101a] border border-[#1b3d54] rounded-none overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((nextActiveDirective.currentValue / nextActiveDirective.targetValue) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">
                    {nextActiveDirective.currentValue} / {nextActiveDirective.targetValue}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-300">
                Tüm imparatorluk direktifleri başarıyla tamamlandı!
              </p>
            )}

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-mono text-center">
              Direktifler ve durum kütüğünü açmak için tıklayın (F8)
            </div>
          </div>
        </div>

        {/* 9. GALACTIC VICTORY & HEGEMONY STATUS CHIP */}
        <div className="relative group">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenVictory) onOpenVictory();
              else if (onOpenRelay) onOpenRelay();
            }}
            className={`stellaris-resource-pod px-2.5 py-1.5 rounded-sm font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              state.victory
                ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md shadow-amber-500/30 animate-pulse'
                : 'text-amber-300 hover:border-amber-400'
            }`}
            title="Galaktik Zafer ve Sezon Liderliği (Tıklayarak Raporu Aç)"
          >
            {state.victory ? (
              <>
                <Crown className="w-4 h-4 text-amber-300 animate-bounce" />
                <span className="font-bold text-amber-200 text-xs">
                  🏆 ZAFER: {state.victory.winnerName}
                </span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white text-xs">Zafer:</span>
                <span className="text-[11px] text-amber-300 font-bold">
                  {hegemonyLeader.points > 0 ? `${hegemonyLeader.points}/500` : `%${Math.round(colonyLeader.ratio * 100)}/60%`}
                </span>
              </>
            )}
          </button>

          {/* Victory Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[280px] stellaris-tooltip rounded-sm p-3 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-xs font-bold text-amber-300 font-display flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Galaktik Sezon Zafer Koşulları</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {state.victory ? 'Sezon Bitti' : 'Sezon Aktif'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-1.5 rounded-sm bg-[#061420] border border-[#163042]">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold mb-0.5">
                  <span>1. Nexus Hegemonyası</span>
                  <span>500 Puan</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Nexus Rölesini elinde tutarak veya Kadim Titanı mağlup ederek kazanılır.
                </p>
                <div className="mt-1 text-[10.5px] text-slate-200 flex justify-between">
                  <span>Mevcut Lider:</span>
                  <span className="text-amber-400 font-bold">
                    {hegemonyLeader.name} ({hegemonyLeader.points} / 500)
                  </span>
                </div>
              </div>

              <div className="p-1.5 rounded-sm bg-[#061420] border border-[#163042]">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold mb-0.5">
                  <span>2. Koloni Dominasyonu</span>
                  <span>%60 Koloni</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Sektördeki tüm kolonilerin (min. 6) %60'ını kontrol altına alarak kazanılır.
                </p>
                <div className="mt-1 text-[10.5px] text-slate-200 flex justify-between">
                  <span>Mevcut Lider:</span>
                  <span className="text-emerald-400 font-bold">
                    {colonyLeader.name} (%{Math.round(colonyLeader.ratio * 100)} - {colonyLeader.count}/{totalColonizedCount})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-mono text-center">
              Zafer ve Şöhretler Salonu raporunu açmak için tıklayın
            </div>
          </div>
        </div>
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
          className={`px-3 py-1.5 rounded-sm border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            !isPlaying
              ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse shadow-md shadow-rose-950/80'
              : 'stellaris-btn-metallic text-emerald-300 hover:text-white'
          }`}
          title="Zamanı Durdur / Başlat (Space)"
        >
          {!isPlaying ? (
            <>
              <Pause className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">DURAKLATILDI</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ÇALIŞIYOR</span>
            </>
          )}
        </button>

        {/* Speed Pips (> >> >>> >>>>) */}
        <div className="flex items-center bg-[#07101c] border border-[#23384e] rounded-sm p-0.5 text-xs font-mono">
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
              className={`px-2 py-0.5 rounded-sm transition-all font-bold cursor-pointer ${
                timeScale === s.scale
                  ? 'stellaris-btn-gold font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={`${s.scale}x Hızlandırma`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stellaris Cosmic Date Display */}
        <div className="stellaris-date-badge px-3 py-1.5 rounded-sm text-xs font-mono font-bold text-[#fbbf24] tracking-widest border border-[#2b4158] shadow-inner hidden md:block">
          {stellarisDate}
        </div>

        <div className="h-5 w-px bg-slate-700 hidden sm:block" />

        {/* Utility Toggles: Sound, God Mode, Guide, Reset */}
        <button
          onClick={handleToggleMute}
          className={`stellaris-btn-metallic p-2 rounded-sm border transition-all cursor-pointer ${
            !isAudioMuted
              ? 'border-cyan-500/50 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={!isAudioMuted ? 'Ses Açık' : 'Ses Kapalı'}
        >
          {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onToggleGodMode();
          }}
          className={`stellaris-btn-metallic p-2 rounded-sm border transition-all cursor-pointer ${
            godMode
              ? 'border-purple-500/60 text-purple-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={godMode ? 'Tanrı Modu: Açık (Sis Kapalı)' : 'Tanrı Modu: Kapalı'}
        >
          {godMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {onOpenOrientation && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenOrientation();
            }}
            className="stellaris-btn-metallic px-2.5 py-1.5 rounded-sm border border-amber-500/40 text-amber-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            title="Oyun Rehberi & Filo Hareket Oryantasyonu"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline text-[11px] font-bold">Rehber</span>
          </button>
        )}

        <button
          onClick={() => {
            sound.playClick();
            onReset();
          }}
          className="stellaris-btn-metallic p-2 rounded-sm border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer"
          title="Simülasyonu Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const TopBar = React.memo(TopBarComponent);
