import React, { useState } from 'react';
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
  MoreHorizontal,
  Palette,
  Radio,
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
  X,
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
  onOpenGroundWarfare?: () => void;
  activeGroundBattlesCount?: number;
  totalArmiesCount?: number;
  onOpenEnclaves?: () => void;
  activeEnclaveContractsCount?: number;
  hasShroudBoon?: boolean;
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
  onOpenMainMenu?: () => void;
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
  onOpenHyperRelays,
  onOpenShadowOps,
  onOpenGroundWarfare,
  onOpenEnclaves,
  onOpenGallery,
  isSenateSessionActive = false,
  movingFleetsCount = 0,
  threatsCount = 0,
  unreadBattlesCount,
  planetsCount,
  godMode,
  onToggleGodMode,
  isMuted,
  onToggleMute,
  onToggleVacationMode,
  onOpenMainMenu,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isPlanetActive = isPlanetPanelOpen || activeLeftPanel === 'planets';
  const isRadarActive = activeLeftPanel === 'transit_radar';
  const isBattlesActive = activeLeftPanel === 'battles';

  return (
    <aside className="w-14 h-full stellaris-rail flex flex-col items-center py-2.5 z-30 select-none relative">
      {/* Empire Crest Header / Main Menu Button */}
      <div
        className="relative mb-3 group cursor-pointer"
        onClick={() => {
          if (onOpenMainMenu) {
            sound.playClick();
            onOpenMainMenu();
          }
        }}
        title="Ana Menü & Galaktik Protokol (ESC)"
      >
        <div
          className="stellaris-crest w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-105"
          style={{ borderColor: activePlayerColor || '#c5a059' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: activePlayerColor || '#e5c578' }} />
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"
          style={{ backgroundColor: activePlayerColor || '#c5a059' }}
        />
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[200px] stellaris-tooltip rounded-sm p-2.5 text-left">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="stellaris-gold tracking-wide">ANA MENÜ</span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">ESC</span>
          </div>
          <p className="text-[10.5px] text-slate-300 mt-1 leading-snug">
            Ana Menüyü, oyun modlarını ve ayarları açar.
          </p>
        </div>
      </div>

      {/* Main Core Navigation Buttons (4 Pillars of the Wedge) */}
      <div className="flex-1 flex flex-col items-center gap-2 w-full px-1.5 overflow-visible">
        {/* 1. Planets & Colonies Drawer (F1) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              setIsMoreMenuOpen(false);
              onTogglePlanetPanel();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative cursor-pointer ${
              isPlanetActive ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            {planetsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-[#0e2130] border border-cyan-500/60 text-cyan-300 text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold">
                {planetsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F1
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">KOLONİLER & DÜNYALAR</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F1</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Nüfus, ilçeler, madenler ve gezegen altyapı yönetimi.
            </p>
            <div className="mt-1.5 pt-1 border-t border-[#18374b] text-[10px] text-emerald-400 font-mono font-bold">
              {planetsCount} Aktif Koloni
            </div>
          </div>
        </div>

        {/* 2. Shipyard & Fleet Construction (F2) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              setIsMoreMenuOpen(false);
              onOpenShipyard();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative cursor-pointer ${
              activeLeftPanel === 'shipyard' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wrench className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F2
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">TERSANE & DONANMA</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F2</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Keşif, nakliye, avcı ve savaş gemisi inşası.
            </p>
          </div>
        </div>

        {/* 3. Research & Technology (F3) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              setIsMoreMenuOpen(false);
              onOpenResearch();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative cursor-pointer ${
              activeLeftPanel === 'research' ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F3
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">TEKNOLOJİ & AR-GE</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F3</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Lazerler, kalkanlar, motorlar ve imparatorluk araştırmaları.
            </p>
          </div>
        </div>

        {/* 4. Operations, Radar & Battles (F4) */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              setIsMoreMenuOpen(false);
              if (unreadBattlesCount > 0) {
                onOpenBattles();
              } else if (onOpenTransitRadar) {
                onOpenTransitRadar();
              }
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative cursor-pointer ${
              isRadarActive || isBattlesActive ? 'active' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className={`w-5 h-5 ${unreadBattlesCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-300'} group-hover:scale-110 transition-transform`} />
            {(unreadBattlesCount > 0 || threatsCount > 0) && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 bg-rose-950 border border-rose-500 text-rose-300 text-[9.5px] font-mono rounded-sm flex items-center justify-center font-bold animate-pulse">
                {unreadBattlesCount || threatsCount}
              </span>
            )}
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-slate-400 group-hover:text-amber-300">
              F4
            </span>
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[220px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="stellaris-gold tracking-wide">HAREKAT & SAVAŞLAR</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1 py-0.5 rounded-sm">F4</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Uçuş radarı, yaklaşan filolar ve 3D taktik muharebe raporları.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-8 h-[1px] bg-[#18374b]/80 my-1" />

        {/* 5. More Systems / Galactic Directorate Button */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all relative cursor-pointer ${
              isMoreMenuOpen ? 'active !border-amber-400 text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Tüm İmparatorluk & Galaksi Sistemleri"
          >
            <MoreHorizontal className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 min-w-[200px] stellaris-tooltip rounded-sm p-2.5 text-left">
            <div className="text-xs font-bold text-amber-300 tracking-wide">
              GALAKTİK SİSTEMLER
            </div>
            <p className="text-[10.5px] text-slate-300 mt-1 leading-snug">
              Senato, Casusluk, Ticaret, Megayapılar ve Gelenekler paneli.
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Galactic Directorate Drawer (Slipways-Style Compact Cockpit Grid) */}
      {isMoreMenuOpen && (
        <div className="absolute left-14 top-16 z-50 w-80 bg-[#06111d]/98 border border-[#1b3d54] shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-sm p-3 font-mono text-xs flex flex-col gap-2.5 animate-in slide-in-from-left-2 duration-150">
          <div className="flex items-center justify-between border-b border-[#18374b] pb-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold tracking-wider text-[11px]">
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>GALAKTİK İMPARATORLUK DİREKTÖRLÜĞÜ</span>
            </div>
            <button
              onClick={() => setIsMoreMenuOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
            {/* Category 1: Diplomasi & Politika */}
            <div>
              <div className="text-[9.5px] font-bold text-cyan-400/90 tracking-wider mb-1 uppercase">
                Diplomasi & İttifak
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenSenate && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenSenate(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 text-[10px]">
                      <Landmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>Senato</span>
                    </span>
                    {isSenateSessionActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                  </button>
                )}
                <button
                  onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenAlliance(); }}
                  className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center justify-between group transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 text-[10px]">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>İttifak</span>
                  </span>
                </button>
                {onOpenCouncil && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenCouncil(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 text-[10px]">
                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                      <span>Konsey</span>
                    </span>
                  </button>
                )}
                {onOpenFederation && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenFederation(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 text-[10px]">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Federasyon</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Category 2: Taktik & İstihbarat */}
            <div>
              <div className="text-[9.5px] font-bold text-amber-400/90 tracking-wider mb-1 uppercase">
                Taktik & İstihbarat
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenShipDesigner && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenShipDesigner(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gemi Dizaynı</span>
                  </button>
                )}
                {onOpenAdmirals && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenAdmirals(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Amiraller</span>
                  </button>
                )}
                {onOpenEspionage && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenEspionage(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-rose-400" />
                    <span>Casusluk</span>
                  </button>
                )}
                {onOpenShadowOps && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenShadowOps(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gölge Operasyon</span>
                  </button>
                )}
                <button
                  onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenRelay(); }}
                  className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nexus Rölesi</span>
                </button>
                {onOpenSituationLog && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenSituationLog(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>Durum Günlüğü</span>
                  </button>
                )}
                {onOpenGroundWarfare && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenGroundWarfare(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kara İstilası</span>
                  </button>
                )}
                {onOpenWarfare && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenWarfare(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 text-[10px] cursor-pointer"
                  >
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>Savaş & Barış</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category 3: Ekonomi & Altyapı */}
            <div>
              <div className="text-[9.5px] font-bold text-emerald-400/90 tracking-wider mb-1 uppercase">
                Ekonomi & Altyapı
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenMarket && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenMarket(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 text-[10px] cursor-pointer"
                  >
                    <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Galaktik Pazar</span>
                  </button>
                )}
                {onOpenTradeRoutes && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenTradeRoutes(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 text-[10px] cursor-pointer"
                  >
                    <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ticaret Hatları</span>
                  </button>
                )}
                {onOpenMegastructures && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenMegastructures(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 text-[10px] cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Megayapılar</span>
                  </button>
                )}
                {onOpenHyperRelays && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenHyperRelays(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 text-[10px] cursor-pointer"
                  >
                    <Waypoints className="w-3.5 h-3.5 text-sky-400" />
                    <span>Hiper Röle</span>
                  </button>
                )}
                {onOpenMegacorp && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenMegacorp(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 text-[10px] cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                    <span>Megacorp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category 4: Kültür, Keşif & Yükseliş */}
            <div>
              <div className="text-[9.5px] font-bold text-purple-400/90 tracking-wider mb-1 uppercase">
                Keşif & Yükseliş
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenTraditions && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenTraditions(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gelenekler</span>
                  </button>
                )}
                {onOpenArchaeology && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenArchaeology(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-300" />
                    <span>Arkeoloji</span>
                  </button>
                )}
                {onOpenTerraform && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenTerraform(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terraform</span>
                  </button>
                )}
                {onOpenSynthetics && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenSynthetics(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Sentetikler</span>
                  </button>
                )}
                {onOpenParagons && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenParagons(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Paragonlar</span>
                  </button>
                )}
                {onOpenColossus && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenColossus(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Kolossus</span>
                  </button>
                )}
                {onOpenCrisis && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenCrisis(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-rose-400 text-[10px] cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5 text-rose-500" />
                    <span>Kriz</span>
                  </button>
                )}
                {onOpenEnclaves && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenEnclaves(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    <span>Enklavlar</span>
                  </button>
                )}
                {onOpenGallery && (
                  <button
                    onClick={() => { sound.playClick(); setIsMoreMenuOpen(false); onOpenGallery(); }}
                    className="p-1.5 rounded-sm bg-[#081522] hover:bg-[#0c1f33] border border-[#16374d] text-left flex items-center gap-1.5 text-slate-300 hover:text-purple-300 text-[10px] cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    <span>Sanat Galerisi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Utility Controls */}
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-[#18374b] w-full px-1.5">
        {/* God Mode Sensor Switcher */}
        <div className="relative group w-10 h-10">
          <button
            onClick={() => {
              sound.playClick();
              onToggleGodMode();
            }}
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all cursor-pointer ${
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
            className={`w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center transition-all cursor-pointer ${
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
              className="w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center text-slate-400 hover:text-blue-300 transition-all cursor-pointer"
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
              className="w-full h-full rounded-sm stellaris-rail-btn flex items-center justify-center text-[#e5c578] hover:text-amber-200 transition-all cursor-pointer"
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
