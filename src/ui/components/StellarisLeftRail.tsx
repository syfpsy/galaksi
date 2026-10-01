import React from 'react';
import {
  Activity,
  Award,
  Bed,
  BookOpen,
  Briefcase,
  CircleDollarSign,
  Compass,
  Cpu,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Globe,
  HelpCircle,
  Landmark,
  Layers,
  LineChart,
  Palette,
  Radio,
  Send,
  Shield,
  Skull,
  Sparkles,
  Sprout,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Waypoints,
  Wrench,
  Zap,
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
  onOpenShipDesigner?: () => void;
  onOpenResearch: () => void;
  onOpenTransitRadar?: () => void;
  onOpenMarket?: () => void;
  onOpenEspionage?: () => void;
  onOpenSituationLog?: () => void;
  onOpenBattles: () => void;
  onOpenAdmirals?: () => void;
  onOpenRelay: () => void;
  onOpenAlliance: () => void;
  onOpenSenate?: () => void;
  onOpenMegastructures?: () => void;
  onOpenCouncil?: () => void;
  onOpenTraditions?: () => void;
  onOpenArchaeology?: () => void;
  onOpenTerraform?: () => void;
  onOpenTradeRoutes?: () => void;
  onOpenWarfare?: () => void;
  onOpenFederation?: () => void;
  onOpenMegacorp?: () => void;
  onOpenCrisis?: () => void;
  onOpenColossus?: () => void;
  onOpenSynthetics?: () => void;
  onOpenParagons?: () => void;
  paragonsCount?: number;
  availableParagonsCount?: number;
  onOpenHyperRelays?: () => void;
  hyperRelaysCount?: number;
  activeHighwayLinksCount?: number;
  onOpenShadowOps?: () => void;
  shadowOpsTier?: number;
  activeShadowOpsCount?: number;
  onOpenGallery: () => void;
  isColossusActive?: boolean;
  isColossusCharging?: boolean;
  syntheticPopsCount?: number;
  syntheticUprisingRisk?: number;
  activeTerraformingCount?: number;
  activeBranchOfficesCount?: number;
  readyFuturesCount?: number;
  federationLevel?: number;
  activeFederationVotesCount?: number;
  collectedTradeValue?: number;
  hasTradePiracyThreat?: boolean;
  activeWarsCount?: number;
  archaeologyPendingCount?: number;
  isCrisisActive?: boolean;
  crisisStage?: string;
  movingFleetsCount?: number;
  threatsCount?: number;
  unreadBattlesCount: number;
  pendingTransmissionsCount?: number;
  unclaimedDirectivesCount?: number;
  isRelayControlled: boolean;
  isSenateSessionActive?: boolean;
  activeMegastructuresCount?: number;
  stabilityPercent?: number;
  availableTraditionPerksCount?: number;
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
  onOpenShipDesigner,
  onOpenResearch,
  onOpenTransitRadar,
  onOpenMarket,
  onOpenEspionage,
  onOpenSituationLog,
  onOpenBattles,
  onOpenAdmirals,
  onOpenRelay,
  onOpenAlliance,
  onOpenSenate,
  onOpenMegastructures,
  onOpenCouncil,
  onOpenTraditions,
  onOpenArchaeology,
  onOpenTerraform,
  onOpenTradeRoutes,
  onOpenWarfare,
  onOpenFederation,
  onOpenMegacorp,
  onOpenCrisis,
  onOpenColossus,
  onOpenSynthetics,
  onOpenParagons,
  paragonsCount = 0,
  availableParagonsCount = 0,
  onOpenHyperRelays,
  hyperRelaysCount = 0,
  activeHighwayLinksCount = 0,
  onOpenShadowOps,
  shadowOpsTier = 1,
  activeShadowOpsCount = 0,
  onOpenGallery,
  isColossusActive = false,
  isColossusCharging = false,
  syntheticPopsCount = 0,
  syntheticUprisingRisk = 0,
  activeTerraformingCount = 0,
  activeBranchOfficesCount = 0,
  readyFuturesCount = 0,
  federationLevel,
  activeFederationVotesCount = 0,
  collectedTradeValue = 0,
  hasTradePiracyThreat = false,
  activeWarsCount = 0,
  archaeologyPendingCount = 0,
  isCrisisActive = false,
  crisisStage,
  movingFleetsCount = 0,
  threatsCount = 0,
  unreadBattlesCount,
  pendingTransmissionsCount = 0,
  unclaimedDirectivesCount = 0,
  isRelayControlled,
  isSenateSessionActive = false,
  activeMegastructuresCount = 0,
  stabilityPercent,
  availableTraditionPerksCount = 0,
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

        {/* Modular Ship Designer & Refit Dock (TAS) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenShipDesigner) onOpenShipDesigner();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'ship_designer' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              TAS
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GEMİ TASARIMCISI & DOK</span>
              <span className="text-[10.5px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">TAS / B</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Silah, zırh/kalkan ve sistem modülleri yüklemesi; garnizon gemi modernizasyonu.
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

        {/* Galactic Senate & Resolutions */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSenate) onOpenSenate();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'senate' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Landmark className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            {isSenateSessionActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center border border-amber-300 shadow-md animate-pulse">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              SEN
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GALAKTİK SENATO & YASALAR</span>
              {isSenateSessionActive && (
                <span className="text-[10.5px] font-mono text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1 py-0.5 rounded-sm animate-pulse">
                  OYLAMA SÜRÜYOR
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Galaktik yasa tasarıları, diplomatik ağırlık sıralaması ve Muhafız seçimleri.
            </p>
          </div>
        </div>

        {/* Megastructures & Subspace Gateways (Phase 13) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenMegastructures) onOpenMegastructures();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'megastructures' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {activeMegastructuresCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center border border-cyan-300 shadow-md">
                {activeMegastructuresCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8.5px] font-mono font-bold text-slate-400 group-hover:text-cyan-300">
              MEGA
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">MEGA YAPILAR & AĞ GEÇİTLERİ</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 13
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Dyson Küresi, Bilim Dizisi, Mega Tersane, Sensör Küresi ve anlık Alt-Uzay Ağ Geçitleri.
            </p>
          </div>
        </div>

        {/* Imperial Council & Factions (Phase 14) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenCouncil) onOpenCouncil();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'council' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Crown className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            {stabilityPercent !== undefined && (
              <span
                className={`absolute -top-1 -right-1 px-1 min-w-[16px] h-3.5 rounded-full text-[8.5px] font-bold font-mono flex items-center justify-center border shadow-sm ${
                  stabilityPercent >= 70
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : stabilityPercent >= 40
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-rose-600 text-white border-rose-400 animate-pulse'
                }`}
              >
                %{stabilityPercent}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              KON
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">HÜKÜMET KONSEYİ & FRAKSİYONLAR</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 14
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Bakanlık atamaları, lider yetenekleri, halk memnuniyeti ve iç siyasi istikrar dengesi.
            </p>
          </div>
        </div>

        {/* Empire Traditions & Ascension Perks (Phase 17) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenTraditions) onOpenTraditions();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'traditions' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            {availableTraditionPerksCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center border border-amber-300 shadow-md animate-pulse">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              GEL
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">İMPARATORLUK GELENEKLERİ</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 17
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Kültürel Birlik doktrinleri, gelenek ağaçları ve Yükseliş Ayrıcalıkları (Ascension Perks).
            </p>
          </div>
        </div>

        {/* Archaeology Sites & Relics (Phase 18) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenArchaeology) onOpenArchaeology();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'archaeology' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            {archaeologyPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center border border-amber-300 shadow-md animate-pulse">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-teal-300">
              ARK
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">ARKEOLOJİ VE YADİGÂRLAR</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 18
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Sektör kazı alanları, kadim eser parçacıkları, Ar-Ge tersine mühendislik ve Yadigâr Zaferi güçleri.
            </p>
          </div>
        </div>

        {/* Planetary Terraforming & Ecological Engineering (Phase 19) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenTerraform) onOpenTerraform();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'terraform' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sprout className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            {activeTerraformingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center border border-emerald-300 shadow-md animate-pulse">
                {activeTerraformingCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-emerald-300">
              ISL
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GEZEGEN ISLAHI & EKOLOJİ</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 19
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Atmosferik biyom dönüştürme (Gaia/Okyanus/Terran), yüzey engelleri ve gezegensel kararlar.
            </p>
          </div>
        </div>

        {/* Galactic Trade Networks & Piracy (Phase 20) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenTradeRoutes) onOpenTradeRoutes();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'trade_routes' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CircleDollarSign className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            {hasTradePiracyThreat && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-red-300 shadow-md animate-pulse">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              TIC
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GALAKTİK TİCARET AĞI</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 20
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Hiperuzay ticaret koridorları, korsanlık baskısı, devriyeler ve ticaret politikaları.
            </p>
            {collectedTradeValue > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-amber-300 font-mono">
                💰 Net Akış: {collectedTradeValue} TV/saat
              </div>
            )}
          </div>
        </div>

        {/* Casus Belli, Wars & Subjects (Phase 21) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenWarfare) onOpenWarfare();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'warfare' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            {activeWarsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-red-400 shadow-md animate-pulse">
                {activeWarsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-red-300">
              SVS
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">SAVAŞ & VASALLIK KARARGAHI</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 21
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Casus Belli savaş hedefleri, savaş yorgunluğu (War Exhaustion), barış antlaşmaları ve vasallık sözleşmeleri.
            </p>
            {activeWarsCount > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-red-300 font-mono">
                ⚔️ {activeWarsCount} Aktif Savaş Cephesi
              </div>
            )}
          </div>
        </div>

        {/* Galactic Federations, Cohesion & Federal Fleet (Phase 22) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenFederation) onOpenFederation();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'federation' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {federationLevel !== undefined && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-cyan-950 border border-cyan-400/80 text-cyan-300 text-[9px] font-mono rounded-sm flex items-center justify-center font-bold">
                L{federationLevel}
              </span>
            )}
            {activeFederationVotesCount > 0 && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-cyan-300">
              FED
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">GALAKTİK FEDERASYON</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 22
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Ortak Federal Donanma, Federal Yasalar, Uyum & Merkezileşme kademeleri ve koalisyon paktları.
            </p>
            {federationLevel !== undefined && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-cyan-300 font-mono">
                🌐 Kademe {federationLevel} Merkezileşme
              </div>
            )}
          </div>
        </div>

        {/* Megacorporations, Branch Offices & Commodity Exchange (Phase 24) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenMegacorp) onOpenMegacorp();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'megacorp' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Briefcase className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            {activeBranchOfficesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-amber-950 border border-amber-400/80 text-amber-300 text-[9px] font-mono rounded-sm flex items-center justify-center font-bold">
                {activeBranchOfficesCount}
              </span>
            )}
            {readyFuturesCount > 0 && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              ŞRK
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">MEGAKORPORASYON & BORSA</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 24
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Galaktik şube ofisleri, kurumsal binalar, kâr payı temettüleri ve vadeli emtia sözleşmeleri.
            </p>
            {activeBranchOfficesCount > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-amber-300 font-mono">
                🏢 {activeBranchOfficesCount} Aktif Şube Ofisi
              </div>
            )}
            {readyFuturesCount > 0 && (
              <div className="mt-1 text-[10px] text-emerald-300 font-mono">
                📈 {readyFuturesCount} Teslimata Hazır Vadeli Sözleşme
              </div>
            )}
          </div>
        </div>

        {/* Galactic Crisis & Void Incursions (Phase 16) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenCrisis) onOpenCrisis();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'crisis'
                ? 'active'
                : isCrisisActive
                ? '!border-rose-500 !bg-rose-950/80 animate-pulse text-rose-300'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isCrisisActive ? 'text-rose-400 animate-pulse' : 'text-rose-500'
              }`}
            />
            {isCrisisActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center border border-rose-400 shadow-md animate-pulse">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-rose-300">
              KRİZ
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400 tracking-wide">GALAKTİK KRİZ // HİÇLİK İSTİLASI</span>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1 py-0.5 rounded-sm">
                FAZ 16
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Boyutlararası Hiçlik Yarığı, Hiçlik Çıpaları, Kadim Behemot ve Galaktik Savunma Filosu (GDF).
            </p>
            {isCrisisActive && (
              <div className="mt-2 pt-1.5 border-t border-rose-900/60 text-[10px] font-mono text-rose-300 font-bold uppercase animate-pulse">
                🚨 Kriz Aşaması: {crisisStage || 'AKTİF İSTİLA'}
              </div>
            )}
          </div>
        </div>

        {/* Colossus Superweapons & World Killers (Phase 25) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenColossus) onOpenColossus();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'colossus'
                ? 'active'
                : isColossusCharging
                ? '!border-red-500 !bg-red-950/80 animate-pulse text-red-300'
                : isColossusActive
                ? 'text-red-400 hover:text-red-200 border-red-900/50'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Skull
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isColossusCharging
                  ? 'text-red-400 animate-spin'
                  : isColossusActive
                  ? 'text-red-400 animate-pulse'
                  : 'text-red-400/80'
              }`}
            />
            {isColossusCharging && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-red-400 shadow-md animate-ping">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-red-300">
              KOL
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-red-400 tracking-wide">KOLOSSUS SÜPER SİLAHLARI</span>
              <span className="text-[10px] font-mono text-red-300 bg-red-950/80 border border-red-500/50 px-1 py-0.5 rounded-sm">
                FAZ 25
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Gezegen Kırıcı, Nötron Süpürgesi, Gezegen Fanusu ve Nanit Ayrıştırıcı doomsday ışınları.
            </p>
            {isColossusCharging && (
              <div className="mt-2 pt-1.5 border-t border-red-900/60 text-[10px] font-mono text-red-300 font-bold uppercase animate-pulse">
                ⚠️ DOOMSDAY ATEŞLEME ŞARJI AKTİF!
              </div>
            )}
            {!isColossusCharging && isColossusActive && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
                ⚓ 1 Aktif Kolossus Gemisi Hazır
              </div>
            )}
          </div>
        </div>

        {/* Synthetic Dawn & Cybernetic Ascension (Phase 26) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSynthetics) onOpenSynthetics();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'synthetics'
                ? 'active'
                : (syntheticUprisingRisk || 0) >= 50
                ? '!border-amber-500 !bg-amber-950/80 animate-pulse text-amber-300'
                : (syntheticPopsCount || 0) > 0
                ? 'text-cyan-400 hover:text-cyan-200 border-cyan-900/50'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cpu
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                (syntheticUprisingRisk || 0) >= 50
                  ? 'text-amber-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            />
            {(syntheticUprisingRisk || 0) >= 50 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center border border-amber-400 shadow-md">
                !
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-cyan-300">
              ROB
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-400 tracking-wide">SENTETİK ŞAFAK</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 26
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Robotik pop imalatı, Sibernetik & Sentetik Yükseliş, Yapay Zekâ hakları ve Makine Dünyaları.
            </p>
            {(syntheticPopsCount || 0) > 0 && (
              <div className="mt-2 pt-1.5 border-t border-cyan-900/60 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                <span>Aktif Sentetik Nüfus:</span>
                <span className="font-bold">{syntheticPopsCount} Pop</span>
              </div>
            )}
          </div>
        </div>

        {/* Paragon Leaders & Renown (Phase 27) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenParagons) onOpenParagons();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'paragons'
                ? 'active'
                : paragonsCount > 0
                ? 'text-amber-400 hover:text-amber-200 border-amber-900/50'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Crown
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                paragonsCount > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            />
            {availableParagonsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-600 text-slate-950 text-[9px] font-bold flex items-center justify-center border border-amber-400 shadow-md">
                {availableParagonsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              LDR
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-400 tracking-wide">PARAGON ÖNDERLER & MİRAS</span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1 py-0.5 rounded-sm">
                FAZ 27
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Galaktik efsaneler, sancak amiral gemileri, kader nitelikleri ve konsey mirasları.
            </p>
            <div className="mt-2 pt-1.5 border-t border-amber-900/60 text-[10px] font-mono text-amber-300 flex items-center justify-between">
              <span>Aktif / Havuz:</span>
              <span className="font-bold">{paragonsCount} Aktif · {availableParagonsCount} Havuzda</span>
            </div>
          </div>
        </div>

        {/* Hyper Relays, Transit Highway Networks & Subspace Logistics (Phase 28) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenHyperRelays) onOpenHyperRelays();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'hyperRelays'
                ? 'active'
                : hyperRelaysCount > 0
                ? 'text-cyan-400 hover:text-cyan-200 border-cyan-900/50'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Zap
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                hyperRelaysCount > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-300'
              }`}
            />
            {activeHighwayLinksCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-600 text-slate-950 text-[9px] font-bold flex items-center justify-center border border-cyan-400 shadow-md">
                {activeHighwayLinksCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-slate-400 group-hover:text-cyan-300">
              HPR
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-400 tracking-wide">HİPER-RÖLE TRANSİT OTOYOLLARI</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">
                FAZ 28
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Yüksek hızlı intikal koridorları (3.0x hız, -%50 yakıt), ticaret koruması ve sektör doktrinleri.
            </p>
            <div className="mt-2 pt-1.5 border-t border-cyan-900/60 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
              <span>Röle / Otoyol:</span>
              <span className="font-bold">{hyperRelaysCount} Röle · {activeHighwayLinksCount} Transit Hattı</span>
            </div>
          </div>
        </div>

        {/* Galactic Intelligence Directorate, False Flag Operations & Shadow Coups (Phase 29) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenShadowOps) onOpenShadowOps();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative ${
              activeLeftPanel === 'shadowOps'
                ? 'active'
                : activeShadowOpsCount > 0
                ? 'text-purple-400 hover:text-purple-200 border-purple-900/50'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeShadowOpsCount > 0 ? 'text-purple-400 animate-pulse' : 'text-purple-300'
              }`}
            />
            {activeShadowOpsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center border border-purple-400 shadow-md">
                {activeShadowOpsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-purple-400/80 group-hover:text-purple-300">
              SHD
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[240px] stellaris-tooltip rounded-sm p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-400 tracking-wide">İSTİHBARAT TEŞKİLATI & GÖLGE OPERASYONLARI</span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/50 px-1 py-0.5 rounded-sm">
                FAZ 29
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Kuantum kripto matrisi, sahte bayrak filo akınları, suikastler ve gölge hükümet darbeleri.
            </p>
            <div className="mt-2 pt-1.5 border-t border-purple-900/60 text-[10px] font-mono text-purple-300 flex items-center justify-between">
              <span>Kademe / Operasyon:</span>
              <span className="font-bold">K{shadowOpsTier} · {activeShadowOpsCount} Aktif Görev</span>
            </div>
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
