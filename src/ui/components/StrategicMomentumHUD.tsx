import React, { useState, useMemo } from 'react';
import {
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Globe,
  Radio,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { GameState, StrategicOpportunity } from '../../engine/types';
import { evaluatePlayerOpportunities } from '../../engine/opportunities';
import { BREAKTHROUGH_CONFIGS } from '../../engine/breakthroughs';
import { sound } from '../sound';

interface StrategicMomentumHUDProps {
  state: GameState;
  activePlayerId: string;
  onExecuteCommand: (command: any) => boolean;
  onClaimOpportunity: (opp: StrategicOpportunity) => void;
}

export const StrategicMomentumHUD: React.FC<StrategicMomentumHUDProps> = ({
  state,
  activePlayerId,
  onExecuteCommand,
  onClaimOpportunity,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  const player = state.players[activePlayerId];
  if (!player) return null;

  const momentum = player.momentum || 0;
  const isSurgeActive = Boolean(
    player.surgeActiveUntilMs && state.timeMs < player.surgeActiveUntilMs
  );
  const surgeRemainingSec = isSurgeActive
    ? Math.max(1, Math.round(((player.surgeActiveUntilMs || 0) - state.timeMs) / 1000))
    : 0;

  // Evaluate dynamic smart opportunities
  const opportunities = useMemo(() => {
    return evaluatePlayerOpportunities(state, activePlayerId);
  }, [state, activePlayerId]);

  const handleAction = (opp: StrategicOpportunity) => {
    sound.playClick();

    // 1. Dispatch the primary tactical command
    const success = onExecuteCommand(opp.command);
    if (success) {
      sound.playTech();
      onClaimOpportunity(opp);

      setCompletedToast(`+${opp.reward.momentum} Momentum! +${opp.reward.ore || opp.reward.crystal || 100} Kaynak`);
      setTimeout(() => setCompletedToast(null), 3000);
    } else {
      sound.playError();
    }
  };

  const handleChooseBreakthrough = (breakthroughId: any) => {
    sound.playTech();
    const success = onExecuteCommand({
      type: 'CHOOSE_BREAKTHROUGH',
      breakthroughId,
    });
    if (success) {
      setCompletedToast('+30 Momentum! Yeni Teknolojik Atılım Aktif 🔬');
      setTimeout(() => setCompletedToast(null), 3500);
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-25 max-w-4xl w-[95%] sm:w-auto select-none pointer-events-auto font-mono animate-in slide-in-from-bottom-3 duration-300">
      {/* Toast Notification Float */}
      {completedToast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{completedToast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className={`rounded-sm bg-[#06101c]/95 border shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isSurgeActive
          ? 'border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
          : 'border-[#1b3d54] shadow-black/80'
      }`}>
        {/* Momentum Gauge Header Bar */}
        <div className="px-3 py-1.5 border-b border-[#18374b]/80 flex items-center justify-between gap-3 bg-[#040c16]/80">
          <div className="flex items-center gap-2">
            {isSurgeActive ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 animate-pulse">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>HİPER-İTİCİ GÜÇ: ALTIN ÇAĞ AKTİF</span>
                <span className="bg-amber-950/80 border border-amber-500/50 px-1.5 py-0.2 rounded-sm text-amber-200 text-[10px] ml-1">
                  ⏱️ {surgeRemainingSec} sn
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>STRATEJİK MOMENTUM</span>
              </span>
            )}

            {/* Phase 35: Inter-Colony Supply Chain Synergy Badge */}
            {player.supplyChains && player.supplyChains.length > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border flex items-center gap-1 ${
                  player.activeSynergyTier === 2
                    ? 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-pulse'
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                }`}
                title={
                  player.activeSynergyTier === 2
                    ? '⚡ Tri-Sektör Hiper Sinerjisi Aktif: +%25 Üretim, +%15 Ar-Ge, +35 Momentum/dk'
                    : '🔗 İkili Koloni İkmal Hattı Aktif: +%10 Üretim, +15 Momentum/dk'
                }
              >
                <span>{player.activeSynergyTier === 2 ? '⚡ Tri-Sinerji' : '🔗 İkmal Ağı'}</span>
                <span className="text-[9px] opacity-80">
                  {player.activeSynergyTier === 2 ? '+%25' : '+%10'}
                </span>
              </span>
            )}
          </div>

          {/* Progress Bar & Perks Indicator */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex-1 h-2 bg-[#020710] rounded-full overflow-hidden border border-[#1b3d54] relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isSurgeActive
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${isSurgeActive ? 100 : momentum}%` }}
              />
            </div>
            <span className="text-[10px] font-bold shrink-0 text-slate-300">
              {isSurgeActive ? '+%35 Hız • +%20 Verim' : `${momentum} / 100`}
            </span>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded-sm hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isCollapsed ? 'Fırsatları Göster' : 'Gizle'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Imperial Technological Breakthrough Choices (Phase 38) */}
        {!isCollapsed && player.availableBreakthroughs && player.availableBreakthroughs.length > 0 && (
          <div className="p-2.5 border-b border-indigo-500/40 bg-gradient-to-r from-[#0d1633] via-[#141b3d] to-[#0d1633]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>İMPARATORLUK TEKNOLOJİK ATILIMI: BİR İNOVASYON SEÇİN</span>
              </span>
              <span className="text-[9.5px] text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <span>⚡ +30 MOMENTUM</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {player.availableBreakthroughs.map((bId) => {
                const cfg = BREAKTHROUGH_CONFIGS[bId];
                if (!cfg) return null;
                return (
                  <div
                    key={bId}
                    className="p-2 rounded-sm bg-[#081024] border border-indigo-500/40 hover:border-indigo-400 flex flex-col justify-between gap-1.5 shadow-lg transition-all hover:bg-[#0c1630] group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-white group-hover:text-indigo-200">
                        <span>{cfg.icon}</span>
                        <span>{cfg.nameTr}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-300 mt-1 leading-snug line-clamp-2">
                        {cfg.descTr}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChooseBreakthrough(bId)}
                      className="w-full mt-1 py-1 rounded-sm bg-indigo-900/80 hover:bg-indigo-600 border border-indigo-400/60 text-white text-[10px] font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-98"
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
        {!isCollapsed && (
          <div className="p-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {opportunities.length === 0 ? (
              <div className="col-span-3 text-center py-2 text-slate-400 text-xs">
                📡 Tüm taktiksel fırsatlar icra edildi. Yeni stratejik hedefler taranıyor...
              </div>
            ) : (
              opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-2.5 rounded-sm bg-[#081524] border border-[#18394e] hover:border-cyan-400/60 flex flex-col justify-between gap-2 transition-all hover:bg-[#0b1d30] group"
                >
                  <div>
                    {/* Header: Badge & Category */}
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="px-1.5 py-0.2 rounded-xs font-bold bg-[#0d2235] text-cyan-300 border border-cyan-500/30">
                        {opp.badge}
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <span>⚡ +{opp.reward.momentum}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">
                      {opp.title}
                    </div>

                    {/* Description */}
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug line-clamp-2">
                      {opp.desc}
                    </p>
                  </div>

                  {/* Footer: Rewards & 1-Click Action Button */}
                  <div className="pt-2 border-t border-[#132c3d] flex items-center justify-between gap-1.5 mt-1">
                    <div className="text-[9px] text-emerald-400 font-bold truncate">
                      {opp.reward.ore && `+${opp.reward.ore} Cevher `}
                      {opp.reward.crystal && `+${opp.reward.crystal} Kristal `}
                      {opp.reward.fuel && `+${opp.reward.fuel} Yakıt`}
                    </div>

                    <button
                      type="button"
                      disabled={!opp.canExecuteNow}
                      onClick={() => handleAction(opp)}
                      className={`px-2.5 py-1 rounded-sm text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                        opp.canExecuteNow
                          ? 'bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/70 text-cyan-200 shadow-sm hover:scale-102 active:scale-98'
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
        )}
      </div>
    </div>
  );
};
