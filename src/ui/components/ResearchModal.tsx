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

export const ResearchModal: React.FC<ResearchModalProps> = ({
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
    <div className={isDocked ? "w-[480px] min-w-[480px] max-w-[480px] shrink-0 h-full bg-[#080d19]/98 border-r border-[#1b314d] flex flex-col shadow-2xl overflow-hidden select-none" : "bg-space-900 border border-amber-500/30 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl shadow-amber-950/40 overflow-hidden"}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                İmparatorluk Araştırma Merkezi
              </h2>
              <span className="text-xs text-amber-400 font-mono">
                {isLabMissing
                  ? '⚠️ Araştırma Merkezi (Seviye 1+) İnşa Edilmelidir'
                  : `Laboratuvar Seviyesi: ${labLevel} (+${labLevel * 15}% Hız)`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Research Progress */}
        {player.researchQueue && (
          <div className="p-3 bg-space-950/80 border-b border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Devam Eden Teknoloji Geliştirmesi
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">
                {RESEARCH_STATS[player.researchQueue.type].nameTr} (Seviye {player.researchQueue.targetLevel})
              </span>
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                {formatDuration(Math.max(0, player.researchQueue.finishTime - currentTimeMs))} kaldı
              </span>
            </div>
          </div>
        )}

        {/* Tech Tree List */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3">
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
                className={`p-3 rounded-lg border transition-all ${
                  isResearchingThis
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-[#0b1426] border-[#1b314d] hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-space-900 border border-slate-700 flex items-center justify-center text-amber-400 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 font-display">
                          {stats.nameTr}
                        </span>
                        <span className="text-xs font-mono font-bold bg-space-900 px-2 py-0.5 rounded text-amber-400 border border-slate-800">
                          Seviye {currentLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
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
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      isResearchingThis
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : canAfford && !isAnyActive && !isLabMissing
                        ? 'bg-amber-500 text-space-950 hover:bg-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isResearchingThis ? 'Geliştiriliyor' : 'Araştır'}</span>
                  </button>
                </div>

                {/* Cost Badges */}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className={homeworld.resources.ore >= nextCost.ore ? 'text-amber-400' : 'text-rose-400'}>
                    {nextCost.ore} Cevher
                  </span>
                  <span>•</span>
                  <span className={homeworld.resources.crystal >= nextCost.crystal ? 'text-cyber-cyan' : 'text-rose-400'}>
                    {nextCost.crystal} Kristal
                  </span>
                  <span>•</span>
                  <span className={homeworld.resources.fuel >= nextCost.fuel ? 'text-rose-400' : 'text-rose-600'}>
                    {nextCost.fuel} Yakıt
                  </span>
                  <span className="text-slate-500 ml-auto">Süre: {formatDuration(durationSec * 1000)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      {content}
    </div>
  );
};
