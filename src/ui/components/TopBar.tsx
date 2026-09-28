import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  CircleDot,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gem,
  Globe,
  Moon,
  Pause,
  Pickaxe,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { calculateHourlyProduction } from '../../engine/constants';
import { GameState, Planet } from '../../engine/types';
import { formatSimClock } from '../timeUtils';
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
  onOpenBattles?: () => void;
  onOpenRelay?: () => void;
  onOpenAlliance?: () => void;
  onOpenGallery?: () => void;
  onToggleVacationMode?: () => void;
  onReset: () => void;
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
  onOpenBattles,
  onOpenRelay,
  onOpenAlliance,
  onOpenGallery,
  onToggleVacationMode,
  onReset,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(sound.isMuted);

  // Calculate hourly rates for active planet
  const oreRate = activePlanet ? calculateHourlyProduction('ore', activePlanet.buildings.ore_mine) : 0;
  const crystalRate = activePlanet ? calculateHourlyProduction('crystal', activePlanet.buildings.crystal_synth) : 0;
  const fuelRate = activePlanet ? calculateHourlyProduction('fuel', activePlanet.buildings.fuel_refinery) : 0;

  const activePlayer = state.players[activePlayerId];

  // Calculate total empire naval capacity
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId);
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  let totalEmpireShips = 0;
  myPlanets.forEach((p) => {
    Object.values(p.garrison).forEach((cnt) => {
      totalEmpireShips += cnt || 0;
    });
  });
  myFleets.forEach((f) => {
    Object.values(f.ships).forEach((cnt) => {
      totalEmpireShips += cnt || 0;
    });
  });

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
    <header className="h-12 border-b border-[#14263b] bg-[#050b14]/98 backdrop-blur-md px-3 flex items-center justify-between z-30 select-none shadow-xl relative">
      {/* Top Subtle Metallic Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* LEFT: Empire Crest, Name & Government Identity */}
      <div className="flex items-center gap-3">
        {/* Stellaris Empire Crest Badge */}
        <div
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0"
          style={{
            borderColor: activePlayer?.color || '#00f3ff',
            backgroundColor: `${activePlayer?.color || '#00f3ff'}18`,
            boxShadow: `0 0 10px ${activePlayer?.color || '#00f3ff'}50`,
          }}
          title={activePlayer?.name || 'İmparatorluk'}
        >
          <Sparkles className="w-4 h-4" style={{ color: activePlayer?.color || '#00f3ff' }} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-slate-100 tracking-wider font-display uppercase leading-none">
              {activePlayer?.name || 'Galaktik İmparatorluk'}
            </h1>
            {/* Observer / Bot Perspective Switcher */}
            <select
              value={activePlayerId}
              onChange={(e) => {
                sound.playClick();
                onSelectPlayer(e.target.value);
              }}
              className="bg-[#081220] border border-[#1a2f4c] hover:border-cyan-500/60 text-[10px] font-mono rounded px-1.5 py-0.2 text-cyan-400 focus:outline-none cursor-pointer"
              title="Gözlemci / Oyuncu Perspektifi Değiştir"
            >
              {Object.values(state.players).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isBot ? `🤖 [BOT] ${p.name}` : `👤 ${p.name}`}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5">
            {activePlayer?.isBot ? 'OTONOM BOT HÜKÜMETİ' : 'GALAKTİK BAŞKANLIK'}
          </span>
        </div>
      </div>

      {/* CENTER: Stellaris Horizontal Strategic Resource Ribbon */}
      {activePlanet && (
        <div className="hidden md:flex items-center gap-4 bg-[#07101c]/90 px-3.5 py-1 rounded-md border border-[#14263b] shadow-inner">
          {/* Energy / Fuel */}
          <div className="flex items-center gap-2 group cursor-pointer" title="Enerji / Yakıt Rezervi (Gemi manevraları ve filo seferleri için tüketilir)">
            <div className="w-5 h-5 rounded bg-amber-950/40 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <Zap className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.fuel).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">+{fuelRate}</span>
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, (activePlanet.resources.fuel / activePlanet.storageCap) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800/80" />

          {/* Minerals / Ore */}
          <div className="flex items-center gap-2 group cursor-pointer" title="Cevher / Maden Rezervi (Bina inşası ve gemi gövde üretimi)">
            <div className="w-5 h-5 rounded bg-orange-950/40 flex items-center justify-center text-orange-400 border border-orange-500/30">
              <Pickaxe className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.ore).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">+{oreRate}</span>
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-orange-400 rounded-full"
                  style={{ width: `${Math.min(100, (activePlanet.resources.ore / activePlanet.storageCap) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800/80" />

          {/* Rare Crystals */}
          <div className="flex items-center gap-2 group cursor-pointer" title="Nadir Kristaller (Gelişmiş kalkan, teknoloji ve avcı üretimi)">
            <div className="w-5 h-5 rounded bg-cyan-950/40 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
              <Gem className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.crystal).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">+{crystalRate}</span>
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, (activePlanet.resources.crystal / activePlanet.storageCap) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800/80" />

          {/* Technology & Research (Ar-Ge) */}
          <div
            onClick={() => {
              sound.playClick();
              if (onOpenResearch) onOpenResearch();
            }}
            className="flex items-center gap-1.5 text-xs font-mono cursor-pointer group hover:text-cyan-300 transition-colors"
            title="İmparatorluk Ar-Ge & Teknoloji Ağacı (F3)"
          >
            <div className="w-5 h-5 rounded bg-blue-950/40 flex items-center justify-center text-blue-400 border border-blue-500/30 group-hover:border-cyan-400 group-hover:scale-105 transition-all">
              <Activity className="w-3 h-3 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100 group-hover:text-cyan-300">
                  {activePlayer?.researchQueue
                    ? `${activePlayer.researchQueue.type === 'engines' ? 'Motor' : activePlayer.researchQueue.type === 'weapons' ? 'Silah' : 'Sensör'} L${activePlayer.researchQueue.targetLevel}`
                    : `L${(activePlayer?.research.engines || 0) + (activePlayer?.research.weapons || 0) + (activePlayer?.research.sensors || 0)}`}
                </span>
                <span className="text-[9px] text-cyan-400 font-mono">Ar-Ge</span>
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800/80" />

          {/* Empire Colonies Count */}
          <div
            onClick={() => {
              sound.playClick();
              if (onOpenPlanetPanel) onOpenPlanetPanel();
            }}
            className="flex items-center gap-1.5 text-xs font-mono cursor-pointer group hover:text-emerald-300 transition-colors"
            title="Kolonileştirilmiş Dünyalar & Altyapı (F1)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-200 font-bold group-hover:text-emerald-300">{myPlanets.length}</span>
            <span className="text-slate-500">/ 3</span>
          </div>

          <div className="w-px h-5 bg-slate-800/80" />

          {/* Naval Fleet Capacity */}
          <div
            onClick={() => {
              sound.playClick();
              if (onOpenShipyard) onOpenShipyard();
            }}
            className="flex items-center gap-1.5 text-xs font-mono cursor-pointer group hover:text-blue-300 transition-colors"
            title="İmparatorluk Donanma Gücü & Tersane (F2)"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-200 font-bold group-hover:text-blue-300">{totalEmpireShips}</span>
            <span className="text-slate-500 text-[10px]">/ 30 Donanma</span>
          </div>

          {/* Nexus Relay Control Points */}
          {myRelayPoints > 0 && (
            <>
              <div className="w-px h-5 bg-slate-800/80" />
              <div
                onClick={() => {
                  sound.playClick();
                  if (onOpenRelay) onOpenRelay();
                }}
                className="flex items-center gap-1.5 text-xs font-mono cursor-pointer group hover:text-purple-300 transition-colors"
                title="Nexus Röle Haftalık Hakimiyet Puanı (F8)"
              >
                <Crown className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-purple-300 font-bold group-hover:text-purple-200">{myRelayPoints}</span>
                <span className="text-slate-500 text-[10px]">Puan</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* RIGHT: Stellaris Cosmic Clock & Speed Controls */}
      <div className="flex items-center gap-2">
        {/* Pause/Play Alert Banner */}
        <button
          onClick={() => {
            sound.playClick();
            onTogglePlay();
          }}
          className={`px-2 py-1 rounded border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            !isPlaying
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse shadow-md shadow-rose-950/60'
              : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
          }`}
          title="Zamanı Durdur / Başlat (Space)"
        >
          {!isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-rose-400" />
              <span>DURAKLATILDI</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>ÇALIŞIYOR</span>
            </>
          )}
        </button>

        {/* Speed Selector Pips (Stellaris > >> >>> Pips) */}
        <div className="flex items-center bg-[#07101c] border border-[#14263b] rounded p-0.5 text-xs font-mono">
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
              className={`px-2 py-0.5 rounded transition-all font-bold ${
                timeScale === s.scale
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`${s.scale}x Hızlandırma`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stellaris Calendar Date Display */}
        <div className="bg-[#07101c] border border-[#14263b] px-2.5 py-1 rounded text-xs font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 shadow-inner">
          <span>{stellarisDate}</span>
        </div>

        {/* Quick Time Step Buttons */}
        <div className="hidden xl:flex items-center gap-1">
          <button
            onClick={() => onFastForwardMinutes(15)}
            className="px-1.5 py-1 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-[#07101c] border border-[#14263b] hover:border-slate-600 transition-all"
            title="+15 Dakika İlerle"
          >
            +15dk
          </button>
          <button
            onClick={() => onFastForwardMinutes(60)}
            className="px-1.5 py-1 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-[#07101c] border border-[#14263b] hover:border-slate-600 transition-all"
            title="+1 Saat İlerle"
          >
            +1sa
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Utility Toggles: Sound, Fog, Reset */}
        <button
          onClick={() => {
            const nextMuted = sound.toggleMute();
            setIsAudioMuted(nextMuted);
          }}
          className={`p-1.5 rounded border transition-all ${
            !isAudioMuted
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
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
          className={`p-1.5 rounded border transition-all ${
            godMode
              ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={godMode ? 'Tüm Bilgi Görünür (Gözlemci Modu)' : 'Sis & Kısmi Bilgi Aktif'}
        >
          {godMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onReset();
          }}
          className="p-1.5 rounded border border-slate-800 bg-slate-900 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-all"
          title="Simülasyonu Sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
