import React from 'react';
import {
  Activity,
  Award,
  Bed,
  Compass,
  Crown,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  LineChart,
  Palette,
  Radio,
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
  activeLeftPanel?: string | null;
  onOpenOrientation?: () => void;
  onOpenShipyard: () => void;
  onOpenResearch: () => void;
  onOpenTransitRadar?: () => void;
  onOpenMarket?: () => void;
  onOpenEspionage?: () => void;
  onOpenSituationLog?: () => void;
  onOpenBattles: () => void;
  onOpenAdmirals?: () => void;
  onOpenRelay: () => void;
  onOpenAlliance: () => void;
  onOpenGallery: () => void;
  movingFleetsCount?: number;
  threatsCount?: number;
  unreadBattlesCount: number;
  pendingTransmissionsCount?: number;
  unclaimedDirectivesCount?: number;
  isRelayControlled: boolean;
  planetsCount: number;
  godMode: boolean;
  onToggleGodMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleVacationMode?: () => void;
}

const StellarisLeftRailComponent: React.FC<StellarisLeftRailProps> = ({
  activePlayerColor,
  isPlanetPanelOpen,
  onTogglePlanetPanel,
  isCommandPanelOpen,
  onToggleCommandPanel,
  activeLeftPanel,
  onOpenOrientation,
  onOpenShipyard,
  onOpenResearch,
  onOpenTransitRadar,
  onOpenMarket,
  onOpenEspionage,
  onOpenSituationLog,
  onOpenBattles,
  onOpenAdmirals,
  onOpenRelay,
  onOpenAlliance,
  onOpenGallery,
  movingFleetsCount = 0,
  threatsCount = 0,
  unreadBattlesCount,
  pendingTransmissionsCount = 0,
  unclaimedDirectivesCount = 0,
  isRelayControlled,
  planetsCount,
  godMode,
  onToggleGodMode,
  isMuted,
  onToggleMute,
  onToggleVacationMode,
}) => {
  const isPlanetActive = isPlanetPanelOpen || activeLeftPanel === 'planets';
  const isRadarActive = activeLeftPanel === 'transit_radar';

  return (
    <aside className="w-14 h-full stellaris-rail flex flex-col items-center py-2.5 z-30 select-none relative">
      {/* Empire Crest Header */}
      <div className="relative mb-3 group cursor-pointer" title="Galaktik İmparatorluk">
        <div
          className="stellaris-crest w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-105"
          style={{ borderColor: activePlayerColor || '#c5a059' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: activePlayerColor || '#e5c578' }} />
        </div>
        {/* Decorative center pip */}
        <div
          className="w-1.5 h-1.5 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"
          style={{ backgroundColor: activePlayerColor || '#c5a059' }}
        />
      </div>

      {/* Main Navigation Rail Buttons */}
      <div className="flex-1 flex flex-col items-center gap-1.5 w-full px-1.5 overflow-y-auto overflow-x-visible scrollbar-none">
        {/* Planets & Colonies Drawer (F1) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onTogglePlanetPanel();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              isPlanetActive ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {planetsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-[#0e2130] border border-cyan-500/60 text-cyan-300 text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold">
                {planetsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F1
            </span>
          </button>

          {/* Tactical Stellaris Hover Tooltip */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GEZEGENLER VE SEKTÖRLER</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F1</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Madenler, enerji santralleri, laboratuvarlar ve garnizon yönetimi.
            </p>
            <div className="mt-2 pt-1.5 border-t border-[#18374b] text-[10.5px] text-emerald-400 font-mono font-bold">
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
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'shipyard' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wrench className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F2
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">TERSANE & GEMİ İNŞASI</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F2</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
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
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'research' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F3
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">TEKNOLOJİ & AR-GE AĞACI</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F3</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              İtki motorları, lazer & kalkan silahları ve sensör dizinleri.
            </p>
          </div>
        </div>

        {/* Tactical Fleet Transit Radar (F4) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenTransitRadar) onOpenTransitRadar();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              isRadarActive
                ? 'active'
                : threatsCount > 0
                ? '!border-rose-500 !bg-rose-950/80 animate-pulse'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radio className={`w-5 h-5 ${threatsCount > 0 ? 'text-rose-400' : 'text-cyan-400'} group-hover:scale-110 transition-transform`} />
            {threatsCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-rose-600 text-white text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold animate-ping">
                !
              </span>
            ) : movingFleetsCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-[#0e2130] border border-cyan-500/60 text-cyan-300 text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold">
                {movingFleetsCount}
              </span>
            ) : null}
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F4
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">TAKTİK İNTİKAL RADARI</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F4</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Hareket halindeki dost filolar, düşman intikalleri ve tehdit takibi.
            </p>
            {threatsCount > 0 && (
              <div className="mt-2 pt-1.5 border-t border-rose-900/80 text-[10.5px] text-rose-300 font-mono font-bold">
                🚨 {threatsCount} Düşman Baskını Yolda!
              </div>
            )}
          </div>
        </div>

        {/* Fleet Command Deck (F5) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onToggleCommandPanel();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              isCommandPanelOpen ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Send className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F5
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">FİLO SEVK & SEFER EMRİ</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F5</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Taarruz, önleme, ikmal ve keşif seferlerinin sevk idaresi.
            </p>
          </div>
        </div>

        {/* Galactic Market & Dynamic Trading (F6) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenMarket) onOpenMarket();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'market' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <LineChart className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F6
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GALAKTİK PAZAR & BORSA</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F6</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Dinamik kur fiyatları ile Cevher, Kristal ve Yakıt anında takası.
            </p>
          </div>
        </div>

        {/* Covert Ops & Espionage (F7) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenEspionage) onOpenEspionage();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'espionage' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F7
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GİZLİ OPERASYONLAR & CASUSLUK</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F7</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Keşif sondaları ile düşman tersane sabotajı, teknoloji hırsızlığı ve istihbarat.
            </p>
          </div>
        </div>

        {/* Galactic Situation Log & Quests (F8) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSituationLog) onOpenSituationLog();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'situation' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            {unclaimedDirectivesCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-extrabold flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]">
                {unclaimedDirectivesCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F8
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">DURUM KÜTÜĞÜ & ANOMALİLER</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F8</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Keşfedilmemiş uzay anomalileri, korsan ödül avcılığı ve galaksi puan durumu.
            </p>
          </div>
        </div>

        {/* Battle Logs & Replay (F9) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenBattles();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'battles' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F9
            </span>
            {unreadBattlesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-rose-600 text-white text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold animate-pulse">
                {unreadBattlesCount}
              </span>
            )}
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">MUHAREBE KAYITLARI</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F9</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Geçmiş çatışmalar, hasar dağılımı ve tur bazlı savaş tekrarı.
            </p>
            {unreadBattlesCount > 0 && (
              <div className="mt-2 pt-1.5 border-t border-[#18374b] text-[10.5px] text-rose-300 font-mono font-bold">
                {unreadBattlesCount} Çatışma Raporu
              </div>
            )}
          </div>
        </div>

        {/* Admirals & Naval Academy (F10) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenAdmirals) onOpenAdmirals();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'admirals' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F10
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">FİLO AMİRALLERİ & AKADEMİ</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F10</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Komutan atamaları, seviye/XP gelişimi ve kritik vuruş/kaçınma doktrinleri.
            </p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-6 h-px bg-[#18374b] my-0.5" />

        {/* Central Nexus Relay (F11) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenRelay();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'relay' || isRelayControlled ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Crown className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F11
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">NEXUS RÖLESİ HAKİMİYETİ</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F11</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Merkezi rölenin kontrolü, sensör güçlendirmesi ve haftalık zafer puanı.
            </p>
          </div>
        </div>

        {/* Galactic Alliance / Diplomacy (F12) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenAlliance();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'alliance' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            {pendingTransmissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold font-mono flex items-center justify-center border border-purple-400 shadow-md animate-pulse">
                {pendingTransmissionsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F12
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GALAKTİK İTTİFAKLAR & DİPLOMASİ</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F12</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Diplomatik paktlar, radyo telsiz iletişimi, kaynak takası ve ortak savunma.
            </p>
          </div>
        </div>

        {/* Concept Art Gallery */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenGallery();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'gallery' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Palette className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[230px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="stellaris-gold tracking-wide">KONSEPT SANAT GALERİSİ</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Magnific AI ile üretilen görsel atmosfer, gemiler ve koloniler.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Utility Controls */}
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-[#18374b] w-full px-1.5">
        {/* God Mode Sensor Switcher */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onToggleGodMode();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all ${
              godMode ? 'active !border-purple-400 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {godMode ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-purple-300 tracking-wide">TANRI MODU</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/40 px-1 py-0.5 rounded-sm">
                {godMode ? 'AÇIK' : 'KAPALI'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Savaş sisini kaldırır; tüm galaksi hareketlerini ve filoları görünür kılar.
            </p>
          </div>
        </div>

        {/* Audio Mute Switcher */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              onToggleMute();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all ${
              isMuted ? 'text-slate-500 hover:text-slate-300' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-cyan-300 tracking-wide">SES & AMBİYANS</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1 py-0.5 rounded-sm">
                {isMuted ? 'SESSIZ' : 'AKTIF'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Kozmik fon müziği ve arayüz ses efektlerini açar / kapatır.
            </p>
          </div>
        </div>

        {/* Vacation Mode Toggle */}
        {onToggleVacationMode && (
          <div className="relative group w-10 h-10">
            <button
              onClick={() => {
                sound.playClick();
                onToggleVacationMode();
              }}
              className="w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center text-slate-400 hover:text-blue-300 transition-all"
            >
              <Bed className="w-4 h-4" />
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[210px] stellaris-tooltip rounded-sm p-2.5 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-blue-300 tracking-wide">TATİL MODU</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Üretim ve saldırı hesaplamalarını geçici olarak dondurur.
              </p>
            </div>
          </div>
        )}

        {/* Orientation / Beginner Guide */}
        {onOpenOrientation && (
          <div className="relative group w-10 h-10">
            <button
              onClick={() => {
                sound.playClick();
                onOpenOrientation();
              }}
              className="w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center text-[#e5c578] hover:text-amber-200 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="stellaris-gold tracking-wide">ORYANTASYON REHBERİ</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Galaksi haritası, filo hareket mekanikleri ve taktik ipuçları.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export const StellarisLeftRail = React.memo(StellarisLeftRailComponent);
