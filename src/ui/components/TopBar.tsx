import React, { useState } from 'react';
import {
  Activity,
  Bed,
  CircleDot,
  Crown,
  Eye,
  EyeOff,
  FastForward,
  Flame,
  Gem,
  Moon,
  Palette,
  Pause,
  Pickaxe,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Wrench,
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
  onOpenShipyard: () => void;
  onOpenResearch: () => void;
  onOpenBattles: () => void;
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

  const formattedTime = formatSimClock(state.timeMs);
  const unreadBattlesCount = state.battleReports.length;
  const activePlayer = state.players[activePlayerId];
  const activeAlliance = activePlayer?.allianceId ? state.alliances[activePlayer.allianceId] : null;
  const relayController = state.relay.controllingPlayerId
    ? state.players[state.relay.controllingPlayerId]
    : null;

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

  return (
    <header className="h-14 border-b border-[#1a2942] bg-[#070c17]/95 backdrop-blur-md px-3.5 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Left: Brand & Perspective Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg border flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: `${activePlayer?.color || '#00f3ff'}20`,
              borderColor: `${activePlayer?.color || '#00f3ff'}60`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: activePlayer?.color || '#00f3ff' }} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 tracking-wider font-display uppercase leading-tight">
              {activePlayer?.name || 'Canlı Galaksi'}
            </h1>
            <span className="text-[9px] text-cyan-400 tracking-widest font-mono">
              {activePlayer?.isBot ? 'OTONOM BOT FRONTIER' : 'GALAKTİK İMPARATORLUK'}
            </span>
          </div>
        </div>

        {/* Player / Bot Perspective Dropdown */}
        <div className="h-6 border-l border-slate-800 mx-0.5" />
        <div className="flex items-center gap-1.5">
          <select
            value={activePlayerId}
            onChange={(e) => onSelectPlayer(e.target.value)}
            className="bg-[#0b1324] border border-[#1a2942] hover:border-cyan-500/50 text-[11px] font-mono rounded px-2 py-0.5 text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            {Object.values(state.players).map((p) => (
              <option key={p.id} value={p.id}>
                {p.isBot ? `🤖 [BOT] ${p.name}` : `👤 ${p.name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Planetary Resources (Stellaris Style) */}
      {activePlanet && (
        <div className="flex items-center gap-4 bg-[#0a1120]/90 px-3 py-1 rounded-lg border border-[#1a2942] shadow-inner">
          {/* Cevher (Ore) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <Pickaxe className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.ore).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  /{activePlanet.storageCap >= 1000 ? `${Math.round(activePlanet.storageCap / 1000)}k` : activePlanet.storageCap}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (activePlanet.resources.ore / activePlanet.storageCap) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">+{oreRate}/sa</span>
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800" />

          {/* Kristal (Crystal) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
              <Gem className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.crystal).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  /{activePlanet.storageCap >= 1000 ? `${Math.round(activePlanet.storageCap / 1000)}k` : activePlanet.storageCap}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, (activePlanet.resources.crystal / activePlanet.storageCap) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">+{crystalRate}/sa</span>
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800" />

          {/* Yakıt (Fuel) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-rose-400 border border-rose-500/30">
              <Flame className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.fuel).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  /{activePlanet.storageCap >= 1000 ? `${Math.round(activePlanet.storageCap / 1000)}k` : activePlanet.storageCap}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (activePlanet.resources.fuel / activePlanet.storageCap) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">+{fuelRate}/sa</span>
              </div>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800" />

          {/* Empire Fleet Strength */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-purple-400 border border-purple-500/30">
              <Shield className="w-3 h-3" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {totalEmpireShips} <span className="text-[9px] text-slate-400 font-normal">Gemi</span>
              </div>
              <div className="text-[9px] text-purple-300 font-mono">Donanma Gücü</div>
            </div>
          </div>
        </div>
      )}

      {/* Right: Modals & Simulation Speed Controls */}
      <div className="flex items-center gap-2.5">
        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-1.5 bg-space-850 p-1 rounded-lg border border-slate-800">
          <button
            onClick={onOpenShipyard}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-cyber-cyan hover:bg-slate-800/80 rounded transition-all"
            title="Tersane & Gemi İnşası"
          >
            <Wrench className="w-3.5 h-3.5 text-cyber-cyan" />
            <span className="hidden sm:inline">Tersane</span>
          </button>
          <button
            onClick={onOpenResearch}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 rounded transition-all"
            title="İmparatorluk Araştırmaları"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Araştırma</span>
          </button>
          <button
            onClick={onOpenBattles}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-all relative"
            title="Savaş Kayıtları & Çatışma Tekrarı"
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Savaşlar</span>
            {unreadBattlesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-[10px] font-bold text-white rounded-full">
                {unreadBattlesCount}
              </span>
            )}
          </button>

          {/* Relay Modal Button */}
          {onOpenRelay && (
            <button
              onClick={onOpenRelay}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all relative ${
                relayController?.id === activePlayerId
                  ? 'bg-purple-900/50 text-purple-200 border border-purple-500/50'
                  : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800/80'
              }`}
              title="Nexus Rölesi & Haftalık Hakimiyet Sıralaması"
            >
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Nexus</span>
              {relayController && (
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: relayController.color }}
                  title={`Röle Hâkimi: ${relayController.name}`}
                />
              )}
            </button>
          )}

          {/* Alliance Modal Button */}
          {onOpenAlliance && (
            <button
              onClick={onOpenAlliance}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-blue-400 hover:bg-slate-800/80 rounded transition-all"
              title="Galaktik İttifak & Diplomasi"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">
                {activeAlliance ? `[${activeAlliance.tag}]` : 'İttifak'}
              </span>
            </button>
          )}

          {/* Magnific Art Gallery Button */}
          {onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-cyber-cyan hover:text-white bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 rounded transition-all shadow-sm shadow-cyan-950/30"
              title="Magnific AI Konsept Sanat ve Görsel Galerisi"
            >
              <Palette className="w-3.5 h-3.5 text-cyber-cyan" />
              <span className="font-semibold hidden sm:inline">Galeri</span>
            </button>
          )}
        </div>

        {/* Vacation Mode Toggle */}
        {onToggleVacationMode && (
          <button
            onClick={onToggleVacationMode}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              activePlayer?.vacationMode
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-space-850 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={
              activePlayer?.vacationMode
                ? 'Tatil Modu Aktif (Üretim donduruldu, saldırı almaz/yapamaz). Çıkmak için tıkla.'
                : 'Tatil Moduna Geç (Asenkron koruma - 24 saatlik minimum blok)'
            }
          >
            <Bed className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] hidden xl:inline">
              {activePlayer?.vacationMode ? 'Tatil Modunda' : 'Tatil'}
            </span>
          </button>
        )}

        {/* God Mode Fog of War Toggle */}
        <button
          onClick={onToggleGodMode}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
            godMode
              ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
              : 'bg-space-850 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={godMode ? 'Tüm Bilgi Görünür (Gözlemci Modu)' : 'Sis & Kısmi Bilgi Aktif'}
        >
          {godMode ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-[11px] hidden md:inline">{godMode ? 'Hakim Görüş' : 'Sis'}</span>
        </button>

        {/* Audio Mute & Ambient Sound Toggle */}
        <button
          onClick={() => {
            const nextMuted = sound.toggleMute();
            setIsAudioMuted(nextMuted);
          }}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
            !isAudioMuted
              ? 'bg-cyber-cyan/15 border-cyber-cyan/50 text-cyber-cyan shadow-sm shadow-cyan-950/40'
              : 'bg-space-850 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={!isAudioMuted ? 'Ses & Ambiyans Açık (Susturmak için tıkla)' : 'Ses Susturuldu (Açmak için tıkla)'}
        >
          {!isAudioMuted ? <Volume2 className="w-4 h-4 text-cyber-cyan" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[11px] hidden lg:inline">{!isAudioMuted ? 'Ses: Açık' : 'Ses: Kapalı'}</span>
        </button>

        {/* Sim Time & Controls */}
        <div className="flex items-center gap-2 bg-space-850/90 border border-slate-800 px-3 py-1.5 rounded-lg">
          <div className="font-mono text-xs text-cyber-cyan font-bold tracking-wider mr-1">
            {formattedTime}
          </div>

          <button
            onClick={onTogglePlay}
            className={`p-1 rounded hover:bg-slate-800 ${
              isPlaying ? 'text-amber-400' : 'text-emerald-400'
            }`}
            title={isPlaying ? 'Durdur' : 'Başlat'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Speed Selector (1x real-time up to 1200x) */}
          <div className="flex items-center gap-0.5 bg-space-900 rounded p-0.5 border border-slate-800 text-[10px] font-mono">
            {[1, 10, 60, 300].map((s) => (
              <button
                key={s}
                onClick={() => onSetTimeScale(s)}
                className={`px-1.5 py-0.5 rounded ${
                  timeScale === s
                    ? 'bg-cyber-cyan/20 text-cyber-cyan font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={s === 1 ? '1x: Gerçek Zamanlı Ağır Hız' : `${s}x Hızlandırma`}
              >
                {s === 1 ? '1x (Reel)' : `${s}x`}
              </button>
            ))}
          </div>

          {/* Jump Buttons */}
          <button
            onClick={() => onFastForwardMinutes(15)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-cyber-cyan hover:bg-slate-800 border border-slate-800"
            title="+15 Dakika İlerle"
          >
            +15dk
          </button>

          <button
            onClick={() => onFastForwardMinutes(60)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-cyber-cyan hover:bg-slate-800 border border-slate-800"
            title="+1 Saat İlerle"
          >
            +1sa
          </button>

          <button
            onClick={() => onFastForwardMinutes(480)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 hover:text-purple-200 hover:bg-purple-900/60 border border-purple-700/50 flex items-center gap-1"
            title="+8 Saat: Gece Uykusu Simülasyonu (Sekiz saat uzakta kalan toparlanabiliyor mu test et)"
          >
            <Moon className="w-3 h-3 text-purple-400" />
            <span>+8sa</span>
          </button>

          <button
            onClick={onReset}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 ml-1"
            title="Simülasyonu Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
