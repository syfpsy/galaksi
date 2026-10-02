import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  Globe,
  Navigation,
  Pickaxe,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { FleetDoctrine, GameState, PlanetStance, ShipType, StrategicOpportunity } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { evaluatePlayerOpportunities } from '../../engine/opportunities';
import { BREAKTHROUGH_CONFIGS } from '../../engine/breakthroughs';
import { SelectedTarget } from '../types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface TacticalBottomDockProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  activePlanetId: string;
  isMinimized?: boolean;
  onToggleMinimized?: (min: boolean) => void;
  directDispatchMode?: 'all' | 'half' | 'scout';
  onSetDirectDispatchMode?: (mode: 'all' | 'half' | 'scout') => void;
  onOpenCommandPanel: () => void;
  onRecallFleet: (fleetId: string) => void;
  onOpenShipyard: () => void;
  onOpenMarket: () => void;
  onOpenPlanetPanel?: (planetId: string) => void;
  onOpenFleetDetails?: (fleetId: string) => void;
  onFocusPlanet: (planetId: string) => void;
  onFocusRelay: () => void;
  onSetStance?: (planetId: string, stance: PlanetStance) => void;
  onSetDoctrine?: (fleetId: string, doctrine: FleetDoctrine) => void;
  onBuildShips?: (planetId: string, shipType: ShipType, count: number) => void;
  onToggleAutoSupply?: (planetId: string, enabled: boolean) => void;
  onRapidIntercept?: (targetSystemId?: string, targetFleetId?: string) => void;
  onExecuteCommand?: (command: any) => boolean;
  onClaimOpportunity?: (opp: StrategicOpportunity) => void;
}

export const TacticalBottomDock: React.FC<TacticalBottomDockProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  activePlanetId,
  isMinimized: isMinimizedProp,
  onToggleMinimized,
  directDispatchMode = 'all',
  onSetDirectDispatchMode,
  onOpenCommandPanel,
  onRecallFleet,
  onOpenShipyard,
  onOpenMarket,
  onOpenPlanetPanel,
  onOpenFleetDetails,
  onFocusPlanet,
  onFocusRelay,
  onSetStance,
  onSetDoctrine,
  onBuildShips,
  onToggleAutoSupply,
  onRapidIntercept,
  onExecuteCommand,
  onClaimOpportunity,
}) => {
  const [internalMinimized, setInternalMinimized] = useState(false);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  const isMinimized = isMinimizedProp !== undefined ? isMinimizedProp : internalMinimized;
  const setIsMinimized = (val: boolean) => {
    if (onToggleMinimized) onToggleMinimized(val);
    else setInternalMinimized(val);
  };

  const player = state.players[activePlayerId];
  const momentum = player?.momentum || 0;
  const isSurgeActive = Boolean(
    player?.surgeActiveUntilMs && state.timeMs < player.surgeActiveUntilMs
  );
  const surgeRemainingSec = isSurgeActive
    ? Math.max(1, Math.round(((player?.surgeActiveUntilMs || 0) - state.timeMs) / 1000))
    : 0;

  // Slipways Flow: Evaluate dynamic smart opportunities
  const opportunities = useMemo(() => {
    return evaluatePlayerOpportunities(state, activePlayerId);
  }, [state, activePlayerId]);

  const topOpportunity = opportunities[0];

  const handleAction = (opp: StrategicOpportunity) => {
    sound.playClick();
    if (onExecuteCommand) {
      const success = onExecuteCommand(opp.command);
      if (success) {
        sound.playTech();
        if (onClaimOpportunity) onClaimOpportunity(opp);
        setCompletedToast(`+${opp.reward.momentum} Momentum! +${opp.reward.ore || opp.reward.crystal || 100} Kaynak`);
        setTimeout(() => setCompletedToast(null), 3000);
      } else {
        sound.playError();
      }
    }
  };

  const handleChooseBreakthrough = (breakthroughId: any) => {
    sound.playTech();
    if (onExecuteCommand) {
      const success = onExecuteCommand({
        type: 'CHOOSE_BREAKTHROUGH',
        breakthroughId,
      });
      if (success) {
        setCompletedToast('+30 Momentum! Yeni Teknolojik Atılım Aktif 🔬');
        setTimeout(() => setCompletedToast(null), 3500);
      }
    }
  };

  // Selected target resolution
  const selectedFleet =
    selectedTarget?.type === 'fleet' && selectedTarget.fleetId
      ? state.fleets[selectedTarget.fleetId]
      : null;

  const selectedPlanet =
    selectedTarget?.type === 'planet' && selectedTarget.planetId
      ? state.planets[selectedTarget.planetId]
      : state.planets[activePlanetId];

  const homeworld = Object.values(state.planets).find(
    (p) => p.ownerId === activePlayerId && p.isHomeworld
  ) || selectedPlanet;

  const isMyFleet = selectedFleet?.ownerId === activePlayerId;
  const isMyPlanet = selectedPlanet?.ownerId === activePlayerId;

  // Compute fleet military rating
  const computeFleetPower = (ships: Record<string, number | undefined>) => {
    let power = 0;
    Object.entries(ships).forEach(([type, count]) => {
      const stats = SHIP_STATS[type as ShipType];
      if (stats && count) {
        power += Math.round((stats.attack * 8 + stats.hull * 0.4 + stats.shield * 0.6) * count);
      }
    });
    return power;
  };

  if (isMinimized) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(false);
          }}
          className="stellaris-dock-card px-3.5 py-1.5 rounded-sm text-xs font-mono flex items-center gap-2.5 border border-[#284159] shadow-xl backdrop-blur-md cursor-pointer transition-all hover:border-amber-400 text-slate-200"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider text-amber-300">TAKTİK KONSOL</span>
          <span className="h-3 w-px bg-slate-700" />
          {isSurgeActive ? (
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              🔥 Altın Çağ ({surgeRemainingSec}s)
            </span>
          ) : (
            <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
              ⚡ %{momentum}
            </span>
          )}
          <span className="text-[10px] text-amber-400">▲</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 max-w-[96vw] pointer-events-auto select-none font-mono flex flex-col items-center">
      {/* Toast Notification Float */}
      {completedToast && (
        <div className="mb-1.5 px-3 py-1 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce flex items-center gap-1.5 z-30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{completedToast}</span>
        </div>
      )}

      {/* Upward Expanding Opportunities & Breakthroughs Shelf */}
      {showOpportunities && (
        <div className="mb-1.5 w-full max-w-4xl rounded-sm bg-[#06101c]/95 border border-[#1b3d54] shadow-2xl backdrop-blur-md overflow-hidden animate-fade-in">
          {/* Imperial Technological Breakthrough Choices (Phase 38) */}
          {player?.availableBreakthroughs && player.availableBreakthroughs.length > 0 && (
            <div className="p-2 border-b border-indigo-500/40 bg-gradient-to-r from-[#0d1633] via-[#141b3d] to-[#0d1633]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>İMPARATORLUK TEKNOLOJİK ATILIMI: BİR İNOVASYON SEÇİN</span>
                </span>
                <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded-sm">
                  ⚡ +30 MOMENTUM
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {player.availableBreakthroughs.map((bId) => {
                  const cfg = BREAKTHROUGH_CONFIGS[bId];
                  if (!cfg) return null;
                  return (
                    <div
                      key={bId}
                      className="p-2 rounded-sm bg-[#081024] border border-indigo-500/40 hover:border-indigo-400 flex flex-col justify-between gap-1 shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-white group-hover:text-indigo-200">
                          <span>{cfg.icon}</span>
                          <span>{cfg.nameTr}</span>
                        </div>
                        <p className="text-[9px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                          {cfg.descTr}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChooseBreakthrough(bId)}
                        className="w-full mt-1 py-0.5 rounded-sm bg-indigo-900/80 hover:bg-indigo-600 border border-indigo-400/60 text-white text-[9.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-300" />
                        <span>İnovasyonu Seç</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3 Smart Contextual Opportunity Cards (Slipways Flow) */}
          <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {opportunities.length === 0 ? (
              <div className="col-span-3 text-center py-2 text-slate-400 text-xs">
                📡 Tüm taktiksel fırsatlar icra edildi. Yeni stratejik hedefler taranıyor...
              </div>
            ) : (
              opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-2 rounded-sm bg-[#081524] border border-[#18394e] hover:border-cyan-400/60 flex flex-col justify-between gap-1.5 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className="px-1.5 py-0.2 rounded-xs font-bold bg-[#0d2235] text-cyan-300 border border-cyan-500/30">
                        {opp.badge}
                      </span>
                      <span className="text-amber-400 font-bold">⚡ +{opp.reward.momentum}</span>
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-100 group-hover:text-cyan-200 transition-colors truncate">
                      {opp.title}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {opp.desc}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-[#132c3d] flex items-center justify-between gap-1">
                    <div className="text-[8.5px] text-emerald-400 font-bold truncate">
                      {opp.reward.ore && `+${opp.reward.ore}⛏️ `}
                      {opp.reward.crystal && `+${opp.reward.crystal}💎 `}
                      {opp.reward.fuel && `+${opp.reward.fuel}⚡`}
                    </div>
                    <button
                      type="button"
                      disabled={!opp.canExecuteNow}
                      onClick={() => handleAction(opp)}
                      className={`px-2 py-0.5 rounded-sm text-[9.5px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                        opp.canExecuteNow
                          ? 'bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/70 text-cyan-200 shadow-sm'
                          : 'bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                      title={opp.canExecuteNow ? 'Tek tıkla icra et ve momentum kazan' : 'Gereksinimler karşılanmıyor'}
                    >
                      <span>{opp.icon}</span>
                      <span>{opp.actionText}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Dock Container */}
      <div className={`stellaris-dock-card rounded-sm shadow-2xl border backdrop-blur-md text-xs overflow-hidden transition-all ${
        isSurgeActive
          ? 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
          : 'border-[#284159]'
      }`}>
        {/* Hairline 2px Momentum Bar across the very top edge */}
        <div className="h-0.5 w-full bg-[#020710] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isSurgeActive
                ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 animate-pulse'
                : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400'
            }`}
            style={{ width: `${isSurgeActive ? 100 : momentum}%` }}
          />
        </div>

        {/* Integrated Momentum & Tactical Sub-bar */}
        <div className="px-3 py-1 bg-[#040c16]/90 border-b border-[#14293a] flex items-center justify-between text-[10.5px] gap-2">
          {/* Left: Momentum / Surge info */}
          <div className="flex items-center gap-2">
            {isSurgeActive ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-300 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>ALTIN ÇAĞ AKTİF</span>
                <span className="bg-amber-950/80 border border-amber-500/50 px-1 py-0.2 rounded text-amber-200 text-[9px]">
                  ⏱️ {surgeRemainingSec}s
                </span>
                <span className="text-[9.5px] text-amber-300/80 hidden sm:inline">(+%35 Hız, +%20 Verim)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>MOMENTUM: %{momentum}</span>
              </span>
            )}

            {/* Synergy badge */}
            {player?.supplyChains && player.supplyChains.length > 0 && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm border flex items-center gap-1 ${
                  player.activeSynergyTier === 2
                    ? 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-pulse'
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                }`}
                title={
                  player.activeSynergyTier === 2
                    ? '⚡ Tri-Sektör Hiper Sinerjisi: +%25 Üretim, +%15 Ar-Ge, +35 Momentum/dk'
                    : '🔗 İkili Koloni İkmal Hattı: +%10 Üretim, +15 Momentum/dk'
                }
              >
                <span>{player.activeSynergyTier === 2 ? '⚡ Tri-Sinerji +%25' : '🔗 İkmal Ağı +%10'}</span>
              </span>
            )}
          </div>

          {/* Right: Quick Opportunity recommendation + toggle */}
          <div className="flex items-center gap-2">
            {player?.availableBreakthroughs && player.availableBreakthroughs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowOpportunities(!showOpportunities)}
                className="px-2 py-0.5 rounded-sm bg-indigo-950/90 border border-indigo-400 text-indigo-200 text-[9.5px] font-bold flex items-center gap-1 shadow-sm animate-pulse hover:bg-indigo-900 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>İnovasyon Seç! (+30⚡)</span>
              </button>
            )}

            {topOpportunity && !showOpportunities && (
              <div className="hidden lg:flex items-center gap-1.5 text-[9.5px]">
                <span className="text-slate-400">Öneri:</span>
                <span className="text-slate-200 font-bold truncate max-w-[150px]">{topOpportunity.title}</span>
                <button
                  type="button"
                  disabled={!topOpportunity.canExecuteNow}
                  onClick={() => handleAction(topOpportunity)}
                  className={`px-1.5 py-0.2 rounded-sm text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    topOpportunity.canExecuteNow
                      ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 hover:bg-cyan-900'
                      : 'bg-slate-900/40 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                  title={topOpportunity.canExecuteNow ? 'Tek tıkla icra et' : 'Kaynak yetersiz'}
                >
                  <span>{topOpportunity.icon}</span>
                  <span>{topOpportunity.actionText}</span>
                  <span className="text-amber-400 font-bold">+{topOpportunity.reward.momentum}⚡</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowOpportunities(!showOpportunities)}
              className="px-2 py-0.5 text-slate-400 hover:text-white rounded-sm hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-[9.5px]"
              title={showOpportunities ? 'Fırsatları Gizle' : 'Stratejik Fırsatları Aç'}
            >
              <span className="text-amber-300 font-bold">
                {showOpportunities ? 'Kapat' : `Fırsatlar (${opportunities.length})`}
              </span>
              {showOpportunities ? (
                <ChevronDown className="w-3 h-3 text-amber-300" />
              ) : (
                <ChevronUp className="w-3 h-3 text-amber-300" />
              )}
            </button>
          </div>
        </div>

        {/* Zones Content */}
        <div className="px-3 py-2 flex items-center gap-3.5">
        {/* ========================================================================= */}
        {/* 1. LEFT ZONE: Contextual Target Summary (Fleet, Planet, or Homeworld)     */}
        {/* ========================================================================= */}
        <div className="min-w-[290px] max-w-[360px] h-[78px] flex flex-col justify-between pr-3.5 border-r border-[#1a3449]">
          {selectedFleet ? (
            <>
              {/* Row 1: Fleet Title, Power & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isMyFleet ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-rose-500 shadow-[0_0_8px_#ff0055]'
                    }`}
                  />
                  <span className="font-display font-bold text-white text-xs truncate">
                    {selectedFleet.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-bold text-amber-300">
                    ⚡ {computeFleetPower(selectedFleet.ships).toLocaleString()}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#050d18] border border-slate-700 text-slate-300">
                    {selectedFleet.status === 'in_transit'
                      ? `İntikal (${formatDuration(Math.max(0, selectedFleet.arrivalTime - state.timeMs))})`
                      : 'Hazır'}
                  </span>
                </div>
              </div>

              {/* Row 2: Ship Composition & Doctrine */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-slate-300">
                  {Object.entries(selectedFleet.ships).map(([type, count]) => {
                    if (!count || count <= 0) return null;
                    return (
                      <span key={type} className="flex items-center gap-0.5">
                        <span className="text-slate-500 uppercase">{type[0]}:</span>
                        <strong className="text-cyan-300">{count}</strong>
                      </span>
                    );
                  })}
                </div>

                {isMyFleet && onSetDoctrine && (
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'balanced', label: 'Dengeli' },
                        { id: 'aggressive', label: 'Taarruz' },
                        { id: 'defensive', label: 'Savunma' },
                        { id: 'hit_and_run', label: 'Vur-Kaç' },
                      ] as const
                    ).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          sound.playClick();
                          onSetDoctrine(selectedFleet.id, doc.id as FleetDoctrine);
                        }}
                        className={`px-1 py-0.2 rounded-sm text-[8.5px] font-bold border transition-colors cursor-pointer ${
                          selectedFleet.doctrine === doc.id
                            ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {doc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                {isMyFleet ? (
                  <>
                    {onOpenFleetDetails && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onOpenFleetDetails(selectedFleet.id);
                        }}
                        className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Search className="w-3 h-3 text-cyan-400" />
                        <span>Detay İncele</span>
                      </button>
                    )}
                    {selectedFleet.status === 'in_transit' && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRecallFleet(selectedFleet.id);
                        }}
                        className="px-2 py-0.5 bg-rose-950/80 border border-rose-500 hover:border-rose-400 text-rose-200 rounded-sm flex items-center gap-1 font-bold cursor-pointer transition-colors ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Geri Çağır</span>
                      </button>
                    )}
                  </>
                ) : onRapidIntercept ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>TEHDİT HEDEFİ</span>
                    </span>
                    <button
                      onClick={() => {
                        sound.playLaunch();
                        onRapidIntercept(undefined, selectedFleet.id);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-[10px] rounded-sm flex items-center gap-1 font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>⚡ 1-Tıkla Önle</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : selectedPlanet ? (
            <>
              {/* Row 1: Planet Name, Badges & Garrison */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isMyPlanet ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="font-display font-bold text-white text-xs truncate">
                    {selectedPlanet.name}
                  </span>
                  {selectedPlanet.isHomeworld && (
                    <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded-sm font-bold shrink-0">
                      ANA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-cyan-300 font-bold">
                    {Object.values(selectedPlanet.garrison).reduce((a, b) => a + (b || 0), 0)} Gemi
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFocusPlanet(selectedPlanet.id);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Kamerayı Gezegene Odakla"
                  >
                    <Navigation className="w-3 h-3" />
                  </button>
                  {isMyPlanet && onOpenPlanetPanel && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenPlanetPanel(selectedPlanet.id);
                      }}
                      className="text-amber-300 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer transition-colors text-[10px]"
                      title="Gezegen Yönetimi & Binalar (F1)"
                    >
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>Yönet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Resources & Stance / Supply */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-orange-300">⛏️{Math.floor(selectedPlanet.resources.ore)}</span>
                  <span className="text-cyan-300">💎{Math.floor(selectedPlanet.resources.crystal)}</span>
                  <span className="text-amber-300">⚡{Math.floor(selectedPlanet.resources.fuel)}</span>
                </div>

                {isMyPlanet && onSetStance && (
                  <div className="flex items-center gap-1">
                    {(['hold_position', 'evade_safeguard'] as PlanetStance[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          sound.playClick();
                          onSetStance(selectedPlanet.id, st);
                        }}
                        className={`px-1 py-0.2 rounded-sm text-[8.5px] font-bold border transition-colors cursor-pointer ${
                          selectedPlanet.stance === st
                            ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                            : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {st === 'hold_position' ? 'SAVUN' : 'KAÇIN'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Quick Shipyard or 1-Click Attack */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                {isMyPlanet ? (
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <div className="flex items-center gap-1">
                      {onBuildShips && (selectedPlanet.buildings.shipyard || 0) > 0 && (
                        <>
                          <button
                            onClick={() => {
                              sound.playLaunch();
                              onBuildShips(selectedPlanet.id, 'scout', 1);
                            }}
                            className="px-1.5 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-600 hover:text-black text-cyan-200 text-[9px] font-bold transition-all cursor-pointer"
                            title="1x Gözcü Gemisi İmal Et (80 Ore, 30 Crystal)"
                          >
                            +1 Gözcü
                          </button>
                          <button
                            onClick={() => {
                              sound.playLaunch();
                              onBuildShips(selectedPlanet.id, 'fighter', 1);
                            }}
                            className="px-1.5 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/50 hover:bg-rose-600 hover:text-white text-rose-200 text-[9px] font-bold transition-all cursor-pointer"
                            title="1x Avcı Gemisi İmal Et (120 Ore, 40 Crystal, 20 Fuel)"
                          >
                            +1 Avcı
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onOpenShipyard();
                        }}
                        className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors text-[9.5px] ml-1"
                      >
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>Tersane</span>
                      </button>
                    </div>

                    {!selectedPlanet.isHomeworld && onToggleAutoSupply && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onToggleAutoSupply(selectedPlanet.id, !selectedPlanet.autoSupplyEnabled);
                        }}
                        className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm border cursor-pointer transition-colors ${
                          selectedPlanet.autoSupplyEnabled
                            ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                            : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Otomatik İkmal Hattı: Fazla kaynaklar periyodik olarak başkente sevk edilir."
                      >
                        {selectedPlanet.autoSupplyEnabled ? '⚡ İkmal: AÇIK' : 'İkmal: KAPALI'}
                      </button>
                    )}
                  </div>
                ) : onRapidIntercept ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-bold">Düşman Sektörü</span>
                    <button
                      onClick={() => {
                        sound.playLaunch();
                        onRapidIntercept(selectedPlanet.systemId);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-[10px] font-bold rounded-sm flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>⚡ 1-Tıkla Taarruz</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            /* Fallback: Homeworld Ready State */
            <div className="h-full flex flex-col justify-between py-0.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{homeworld?.name || 'Ana Gezegen'}</span>
                </span>
                <span className="text-cyan-300 text-[10.5px] font-bold">
                  {Object.values(homeworld?.garrison || {}).reduce((a, b) => a + (b || 0), 0)} Gemi
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Haritadan bir koloni veya filo seçerek taktik emirler verin.
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                {homeworld && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onFocusPlanet(homeworld.id);
                    }}
                    className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Başkente Git</span>
                  </button>
                )}
                {onOpenPlanetPanel && homeworld && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenPlanetPanel(homeworld.id);
                    }}
                    className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>Yönetim</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER ZONE: Direct Dispatch Mode & Macro RTS Commands                 */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3">
          {/* Direct Dispatch Mode Selector */}
          {onSetDirectDispatchMode && (
            <div className="h-[78px] flex flex-col justify-between pr-3 border-r border-[#1a3449] min-w-[130px]">
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Hızlı Sevk</span>
                <span className="text-emerald-400 text-[9px]">Sağ Tık</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('all');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'all'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında seçili üssün tüm hazır savaş filosunu sevk et (%100)"
                >
                  %100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('half');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'half'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında hazır filonun yarısını sevk et (%50)"
                >
                  %50
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSetDirectDispatchMode('scout');
                  }}
                  className={`py-1 text-center rounded-sm text-[9.5px] font-bold border transition-all cursor-pointer ${
                    directDispatchMode === 'scout'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sağ tıklandığında sadece 1 hızlı öncü/gözcü gemisi sevk et"
                >
                  Gözcü
                </button>
              </div>

              <div className="text-[8.5px] text-slate-500 text-center truncate">
                {directDispatchMode === 'all'
                  ? 'Tüm savaş filosu sevk edilir'
                  : directDispatchMode === 'half'
                  ? 'Filonun %50\'si sevk edilir'
                  : '1 keşif gözcüsü sevk edilir'}
              </div>
            </div>
          )}

          {/* 4 Core Quick Order Buttons */}
          <div className="grid grid-cols-4 gap-1.5 h-[78px] items-stretch">
            {/* 1. SEVK / İNTİKAL (F5) */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-cyan-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Filo Sefer & Sevk Emri (F5)"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-white tracking-wider">İNTİKAL</span>
              <kbd className="text-[8px] text-slate-400">F5</kbd>
            </button>

            {/* 2. TAARRUZ */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenCommandPanel();
              }}
              className="stellaris-btn-metallic hover:!border-rose-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Düşman Hedefe Taarruz Emri"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-rose-200 tracking-wider">TAARRUZ</span>
              <kbd className="text-[8px] text-slate-400">Emir</kbd>
            </button>

            {/* 3. NEXUS RÖLE */}
            <button
              onClick={() => {
                sound.playClick();
                onFocusRelay();
              }}
              className="stellaris-btn-metallic hover:!border-purple-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Merkezi Nexus Rölesine Odaklan & İntikal"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-purple-200 tracking-wider">RÖLE</span>
              <kbd className="text-[8px] text-slate-400">Nexus</kbd>
            </button>

            {/* 4. BORSA / PAZAR (F6) */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenMarket();
              }}
              className="stellaris-btn-metallic hover:!border-amber-400 px-3 py-1.5 rounded-sm flex flex-col items-center justify-center gap-1 cursor-pointer group min-w-[62px]"
              title="Galaktik Borsa & Kaynak Takası (F6)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-amber-200 tracking-wider">BORSA</span>
              <kbd className="text-[8px] text-slate-400">F6</kbd>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT ZONE: Minimize Pill Toggle                                       */}
        {/* ========================================================================= */}
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(true);
          }}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1 self-stretch flex items-center justify-center"
          title="Konsolu Küçült"
        >
          <span className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors">▼</span>
        </button>
      </div>
    </div>
  </div>
  );
};

