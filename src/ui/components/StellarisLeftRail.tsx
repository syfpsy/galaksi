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
  HelpCircle,
} from 'lucide-react';
import { sound } from '../sound';

interface StellarisLeftRailProps {
  activePlayerColor: string;
  isPlanetPanelOpen: boolean;
  onTogglePlanetPanel: () => void;
  isCommandPanelOpen: boolean;
  onToggleCommandPanel: () => void;
  activeLeftPanel?: string | null;
  onOpenOrientation?: () => void;
  onOpenShipyard: () => void;
  onOpenResearch: () => void;
  onOpenSituationLog?: () => void;
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
  activeLeftPanel,
  onOpenOrientation,
  onOpenShipyard,
  onOpenResearch,
  onOpenSituationLog,
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
  const isPlanetActive = isPlanetPanelOpen || activeLeftPanel === 'planets';

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
      <div className="flex-1 flex flex-col items-center gap-2 w-full px-1.5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Planets & Colonies Drawer (F1) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onTogglePlanetPanel();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              isPlanetActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Globe className="w-5 h-5 transition-transform group-hover:scale-110" />
            {planetsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-slate-800 border border-slate-700 text-cyan-300 text-[9px] font-mono rounded-full flex items-center justify-center font-bold">
                {planetsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-cyan-400 font-bold">
              F1
            </span>
            {isPlanetActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
            )}
          </button>

          {/* Tactical Stellaris Hover Tooltip */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>GEZEGENLER VE SEKTÖRLER</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F1</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Madenler, enerji santralleri, laboratuvarlar ve garnizon yönetimi.
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[9px] text-emerald-400 font-mono">
              {planetsCount} Aktif Koloni
            </div>
          </div>
        </div>

        {/* Shipyard & Fleet Construction (F2) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenShipyard();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'shipyard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Wrench className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-cyan-400 font-bold">
              F2
            </span>
            {activeLeftPanel === 'shipyard' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>TERSANE & GEMİ İNŞASI</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F2</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Avcı, kruvazör, keşif ve taşıma gemisi imalatı.
            </p>
          </div>
        </div>

        {/* Research & Technology (F3) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenResearch();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'research'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Activity className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-amber-400 font-bold">
              F3
            </span>
            {activeLeftPanel === 'research' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>TEKNOLOJİ & AR-GE AĞACI</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F3</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              İtki motorları, lazer & kalkan silahları ve sensör dizinleri.
            </p>
          </div>
        </div>

        {/* Fleet Command Deck (F4) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onToggleCommandPanel();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              isCommandPanelOpen
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Send className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-amber-400 font-bold">
              F4
            </span>
            {isCommandPanelOpen && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>FİLO KOMUTASI & SEFERLER</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F4</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Taarruz, önleme, ikmal ve keşif seferlerinin sevk idaresi.
            </p>
          </div>
        </div>

        {/* Galactic Situation Log & Quests (F5) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSituationLog) onOpenSituationLog();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'situation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Compass className="w-5 h-5 transition-transform group-hover:scale-110 text-cyan-400" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-cyan-400 font-bold">
              F5
            </span>
            {activeLeftPanel === 'situation' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>DURUM KÜTÜĞÜ & ANOMALİLER</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F5</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Keşfedilmemiş uzay anomalileri, enkaz kurtarma ve galaksi puan durumu.
            </p>
          </div>
        </div>

        {/* Battle Logs & Replay (F6) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenBattles();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'battles'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/30'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Swords className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-rose-400 font-bold">
              F6
            </span>
            {unreadBattlesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-rose-600 text-white text-[9px] font-mono rounded-full flex items-center justify-center font-bold animate-pulse">
                {unreadBattlesCount}
              </span>
            )}
            {activeLeftPanel === 'battles' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-rose-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>MUHAREBE KAYITLARI</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F6</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Geçmiş çatışmalar, hasar dağılımı ve tur bazlı savaş tekrarı.
            </p>
            {unreadBattlesCount > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[9px] text-rose-400 font-mono">
                {unreadBattlesCount} Çatışma Raporu
              </div>
            )}
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-6 h-px bg-slate-800 my-1" />

        {/* Central Nexus Relay (F8) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenRelay();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'relay' || isRelayControlled
                ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Crown className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-purple-400 font-bold">
              F8
            </span>
            {activeLeftPanel === 'relay' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-purple-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>NEXUS RÖLESİ HAKİMİYETİ</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F8</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Merkezi rölenin kontrolü, sensör güçlendirmesi ve haftalık zafer puanı.
            </p>
          </div>
        </div>

        {/* Galactic Alliance / Diplomacy (F7) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenAlliance();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'alliance'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-blue-400 font-bold">
              F7
            </span>
            {activeLeftPanel === 'alliance' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>GALAKTİK İTTİFAKLAR</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F7</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Diplomatik paktlar, ortak sensör görüşü ve askeri müttefik savunması.
            </p>
          </div>
        </div>

        {/* Concept Art Gallery (F9) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenGallery();
            }}
            className={`w-full h-full rounded-lg flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'gallery'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Palette className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono text-slate-500 group-hover:text-emerald-400 font-bold">
              F9
            </span>
            {activeLeftPanel === 'gallery' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-400 rounded-r-full" />
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] bg-[#070e1c]/98 border border-[#1b314d] rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>KONSEPT SANAT GALERİSİ</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.2 rounded">F9</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Magnific AI ile üretilen görsel atmosfer, gemiler ve koloniler.
            </p>
          </div>
        </div>
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

        {/* Orientation / Beginner Guide */}
        {onOpenOrientation && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenOrientation();
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30 transition-all"
            title="Oyun Rehberi & Filo Hareket Mekanikleri (Oryantasyon)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
