import React from 'react';
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
  Sparkles,
  Swords,
  Users,
  Wrench,
} from 'lucide-react';
import { calculateHourlyProduction } from '../../engine/constants';
import { GameState, Planet } from '../../engine/types';
import { formatSimClock } from '../timeUtils';

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

  return (
    <header className="h-16 border-b border-cyber-cyan/20 bg-space-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Perspective Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-sm shadow-cyber-cyan/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-wider font-display uppercase leading-tight">
              Canlı Galaksi
            </h1>
            <span className="text-[10px] text-cyber-cyan tracking-widest font-mono">
              AĞIR ASENKRON UZAY STRATEJİSİ
            </span>
          </div>
        </div>

        {/* Player / Bot Perspective Dropdown */}
        <div className="h-8 border-l border-slate-700 mx-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Perspektif:</span>
          <select
            value={activePlayerId}
            onChange={(e) => onSelectPlayer(e.target.value)}
            className="bg-space-850 border border-slate-700 text-xs rounded-md px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyber-cyan"
          >
            {Object.values(state.players).map((p) => (
              <option key={p.id} value={p.id}>
                {p.isBot ? `🤖 [BOT] ${p.name}` : `👤 ${p.name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Planetary Resources (Only 3 per GDD Section 5) */}
      {activePlanet && (
        <div className="flex items-center gap-6 bg-space-850/80 px-4 py-1.5 rounded-lg border border-slate-800">
          {/* Cevher (Ore) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <Pickaxe className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.ore).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  /{activePlanet.storageCap.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">+{oreRate}/saat</div>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Kristal (Crystal) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-cyber-cyan border border-cyber-cyan/30">
              <Gem className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.crystal).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  /{activePlanet.storageCap.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">+{crystalRate}/saat</div>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Yakıt (Fuel) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-rose-400 border border-rose-500/30">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-slate-100">
                  {Math.floor(activePlanet.resources.fuel).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  /{activePlanet.storageCap.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">+{fuelRate}/saat</div>
            </div>
          </div>
        </div>
      )}

      {/* Right: Modals & Simulation Speed Controls */}
      <div className="flex items-center gap-3">
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
