import React from 'react';
import { Activity, Clock, Compass, Crosshair, Eye, Sparkles, X, Zap } from 'lucide-react';
import { getResearchCost, getResearchDurationMs, RESEARCH_STATS } from '../../engine/constants';
import { Planet, Player, ResearchType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface ResearchModalProps {
  player: Player | undefined;
  homeworld: Planet | undefined;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onStartResearch: (type: ResearchType) => void;
  currentTimeMs: number;
}

const ResearchModalComponent: React.FC<ResearchModalProps> = ({
  player,
  homeworld,
  isOpen,
  isDocked = false,
  onClose,
  onStartResearch,
  currentTimeMs,
}) => {
  if (!isOpen || !player || !homeworld) return null;

  const techList: ResearchType[] = ['engines', 'weapons', 'sensors'];
  const labLevel = homeworld.buildings.research_lab || 0;
  const isLabMissing = labLevel < 1;

  const icons: Record<ResearchType, React.ElementType> = {
    engines: Zap,
    weapons: Crosshair,
    sensors: Eye,
  };

  const content = (
    <div
      className={
        isDocked
          ? 'w-[480px] min-w-[480px] max-w-[480px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#18374b] rounded-sm w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold stellaris-gold font-display uppercase tracking-wider">
              İmparatorluk Araştırma Merkezi
            </h2>
            <span className="text-[11px] text-amber-300 font-mono">
              {isLabMissing
                ? '⚠️ Araştırma Merkezi (Seviye 1+) İnşa Edilmelidir'
                : `Laboratuvar Seviyesi: ${labLevel} (+${labLevel * 15}% Hız)`}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
          title="Paneli Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Research Progress */}
      {player.researchQueue && (() => {
        const rq = player.researchQueue;
        const totalDuration = Math.max(1, rq.finishTime - rq.startTime);
        const elapsed = Math.max(0, currentTimeMs - rq.startTime);
        const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        const remaining = Math.max(0, rq.finishTime - currentTimeMs);

        return (
          <div className="stellaris-section-header p-3">
            <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
              <span>DEVAM EDEN TEKNOLOJİ GELİŞTİRMESİ</span>
              <span className="text-cyan-400 font-mono">%{progress}</span>
            </div>
            <div className="flex flex-col gap-1.5 stellaris-item-card px-3 py-2 rounded-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-300 font-bold">
                  {RESEARCH_STATS[rq.type].nameTr} (Seviye {rq.targetLevel})
                </span>
                <span className="text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  {formatDuration(remaining)} kaldı
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#08121a] rounded-none overflow-hidden border border-[#1b3b50]">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tech Tree List */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2.5 scrollbar-none text-xs font-mono">
        {techList.map((type) => {
          const stats = RESEARCH_STATS[type];
          const currentLevel = player.research[type] || 0;
          const nextCost = getResearchCost(type, currentLevel);
          const durationSec = Math.round(
            getResearchDurationMs(type, currentLevel, Math.max(1, labLevel)) / 1000
          );

          const canAfford =
            homeworld.resources.ore >= nextCost.ore &&
            homeworld.resources.crystal >= nextCost.crystal &&
            homeworld.resources.fuel >= nextCost.fuel;

          const isResearchingThis = player.researchQueue?.type === type;
          const isAnyActive = !!player.researchQueue;
          const Icon = icons[type];

          return (
            <div
              key={type}
              className={`p-3 rounded-sm stellaris-item-card transition-all ${
                isResearchingThis ? '!border-amber-500/70 shadow-sm shadow-amber-950/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#08121a] border border-[#1b3b50] flex items-center justify-center text-amber-400 mt-0.5 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 font-display">
                        {stats.nameTr}
                      </span>
                      <span className="stellaris-badge text-amber-300 border-amber-500/40">
                        Seviye {currentLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-snug">
                      {stats.descriptionTr}
                    </p>
                  </div>
                </div>

                {/* Research Action Button */}
                <button
                  disabled={isLabMissing || !canAfford || isAnyActive}
                  onClick={() => {
                    sound.playColonize();
                    onStartResearch(type);
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isResearchingThis
                      ? 'stellaris-rail-btn active text-amber-300'
                      : 'stellaris-btn-metallic text-[#e5c578] font-bold'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isResearchingThis ? 'Geliştiriliyor' : 'Araştır'}</span>
                </button>
              </div>

              {/* Cost Badges */}
              <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[#18374b] text-[10.5px] font-mono">
                <span className={homeworld.resources.ore >= nextCost.ore ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                  {nextCost.ore} Cevher
                </span>
                <span>•</span>
                <span className={homeworld.resources.crystal >= nextCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                  {nextCost.crystal} Kristal
                </span>
                <span>•</span>
                <span className={homeworld.resources.fuel >= nextCost.fuel ? 'text-amber-400' : 'text-rose-400 font-bold'}>
                  {nextCost.fuel} Yakıt
                </span>
                <span className="text-slate-400 ml-auto font-mono">
                  Süre: {formatDuration(durationSec * 1000)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      {content}
    </div>
  );
};

export const ResearchModal = React.memo(ResearchModalComponent);
