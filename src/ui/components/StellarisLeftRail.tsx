import React from 'react';
import {
  Activity,
  Bed,
  Compass,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Hammer,
  Palette,
  Send,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { sound } from '../sound';

interface StellarisLeftRailProps {
  activePlayerColor: string;
  isPlanetPanelOpen: boolean;
  onTogglePlanetPanel: () => void;
  isCommandPanelOpen: boolean;
  onToggleCommandPanel: () => void;
  onOpenShipyard: () => void;
  onOpenResearch: () => void;
  onOpenBattles: () => void;
  onOpenRelay: () => void;
  onOpenAlliance: () => void;
  onOpenGallery: () => void;
  unreadBattlesCount: number;
  isRelayControlled: boolean;
  planetsCount: number;
  godMode: boolean;
  onToggleGodMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleVacationMode?: () => void;
}

export const StellarisLeftRail: React.FC<StellarisLeftRailProps> = ({
  activePlayerColor,
  isPlanetPanelOpen,
  onTogglePlanetPanel,
  isCommandPanelOpen,
  onToggleCommandPanel,
  onOpenShipyard,
  onOpenResearch,
  onOpenBattles,
  onOpenRelay,
  onOpenAlliance,
  onOpenGallery,
  unreadBattlesCount,
  isRelayControlled,
  planetsCount,
  godMode,
  onToggleGodMode,
  isMuted,
  onToggleMute,
  onToggleVacationMode,
}) => {
  return (
    <aside className="w-14 h-full bg-[#070c17]/95 border-r border-[#1a2942] flex flex-col items-center py-3 z-30 select-none shadow-2xl relative">
      {/* Empire Crest Header */}
      <div className="relative mb-4 group cursor-pointer" title="Galaktik İmparatorluk">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 shadow-md group-hover:scale-105"
          style={{
            backgroundColor: `${activePlayerColor}20`,
            borderColor: activePlayerColor,
            boxShadow: `0 0 12px ${activePlayerColor}40`,
          }}
        >
          <Sparkles className="w-5 h-5" style={{ color: activePlayerColor }} />
        </div>
        {/* Subtle decorative pip */}
        <div
          className="w-1 h-1 rounded-full absolute -bottom-1.5 left-1/2 -translate-x-1/2"
          style={{ backgroundColor: activePlayerColor }}
        />
      </div>

      {/* Main Navigation Rail Buttons */}
      <div className="flex-1 flex flex-col items-center gap-2 w-full px-1.5">
        {/* Planets & Colonies Drawer */}
        <button
          onClick={() => {
            sound.playClick();
            onTogglePlanetPanel();
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group ${
            isPlanetPanelOpen
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
          }`}
          title="Koloni & Gezegen Altyapısı (F1)"
        >
          <Globe className="w-5 h-5 transition-transform group-hover:scale-110" />
          {planetsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-slate-800 border border-slate-700 text-cyan-300 text-[9px] font-mono rounded-full flex items-center justify-center font-bold">
              {planetsCount}
            </span>
          )}
          {isPlanetPanelOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
          )}
        </button>

        {/* Shipyard & Fleet Construction */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenShipyard();
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-all group"
          title="Gemi Tersanesi & Üretim (F2)"
        >
          <Wrench className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Research & Technology */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenResearch();
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-all group"
          title="Teknoloji & Araştırma Ağacı (F3)"
        >
          <Activity className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Fleet Command Deck */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleCommandPanel();
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group ${
            isCommandPanelOpen
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm shadow-amber-500/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
          }`}
          title="Taktik Sefer & Filo Komutası (F4)"
        >
          <Send className="w-5 h-5 transition-transform group-hover:scale-110" />
          {isCommandPanelOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded-r-full" />
          )}
        </button>

        {/* Battle Logs & Replay */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenBattles();
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all relative group"
          title="Taktik Muharebe Kayıtları & Çatışma Tekrarı"
        >
          <Swords className="w-5 h-5 transition-transform group-hover:scale-110" />
          {unreadBattlesCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-rose-600 text-white text-[9px] font-mono rounded-full flex items-center justify-center font-bold animate-pulse">
              {unreadBattlesCount}
            </span>
          )}
        </button>

        {/* Separator Line */}
        <div className="w-6 h-px bg-slate-800 my-1" />

        {/* Central Nexus Relay */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenRelay();
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group ${
            isRelayControlled
              ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
              : 'text-slate-400 hover:text-purple-400 hover:bg-slate-800/60'
          }`}
          title="Nexus Rölesi & Sektör Hakimiyeti"
        >
          <Crown className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Galactic Alliance / Diplomacy */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenAlliance();
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition-all group"
          title="Galaktik İttifaklar & Diplomasi"
        >
          <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Concept Art Gallery */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenGallery();
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition-all group"
          title="Magnific AI Konsept Sanat Galerisi"
        >
          <Palette className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>
      </div>

      {/* Bottom Utility Controls */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#1a2942] w-full px-1.5">
        {/* God Mode Sensor Switcher */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleGodMode();
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            godMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
          }`}
          title={godMode ? 'Tanrı Modu: Açık (Sis Kapalı)' : 'Tanrı Modu: Kapalı'}
        >
          {godMode ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Audio Mute Switcher */}
        <button
          onClick={() => {
            onToggleMute();
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            isMuted
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60'
          }`}
          title={isMuted ? 'Ses & Ambiyans: Kapalı' : 'Ses & Ambiyans: Açık'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Vacation Mode Toggle */}
        {onToggleVacationMode && (
          <button
            onClick={() => {
              sound.playClick();
              onToggleVacationMode();
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-slate-800/60 transition-all"
            title="Tatil Modu (Üretim ve Saldırı Dondurma)"
          >
            <Bed className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
