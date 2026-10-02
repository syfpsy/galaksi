import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Globe,
  HelpCircle,
  Navigation,
  Pickaxe,
  Rocket,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { GameState } from '../../engine/types';
import { sound } from '../sound';

interface StarterGuidanceHUDProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  leftOffset?: number;
  onClose: () => void;
  onQuickScout?: () => void;
  onOpenPlanetPanel?: (planetId: string) => void;
  onOpenCommandPanel?: () => void;
  onFocusRelay?: () => void;
  onFocusHomeworld?: () => void;
  onSelectSystem?: (systemId: string) => void;
  onOpenResearch?: () => void;
}

export const StarterGuidanceHUD: React.FC<StarterGuidanceHUDProps> = ({
  state,
  activePlayerId,
  isOpen,
  leftOffset = 0,
  onClose,
  onQuickScout,
  onOpenPlanetPanel,
  onOpenCommandPanel,
  onFocusRelay,
  onFocusHomeworld,
  onSelectSystem,
  onOpenResearch,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const player = state.players[activePlayerId];
  if (!player || !isOpen) return null;

  // 1. Homeworld & Colony metrics
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const homeworld = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  const colonizedCount = playerPlanets.length;

  // 2. Exploration metrics (Fog of War)
  const discoveredSystemsCount = Object.values(player.intel?.discoveredSystems || {}).filter(
    (lvl) => lvl !== 'unexplored'
  ).length;

  // 3. Economy & Research metrics
  const oreMineLevel = homeworld?.buildings.ore_mine || 0;
  const researchLabLevel = homeworld?.buildings.research_lab || 0;
  const sensorsLevel = player.research?.sensors || 0;

  // 4. Hegemony / Victory metrics
  const hegemonyPoints = state.relay?.weeklyPoints?.[activePlayerId] || 0;
  const isVictory = Boolean(state.victory);

  // Milestone completion evaluation (5 Progressive Ground-Zero Steps)
  const isStep1Done = oreMineLevel >= 2;
  const isStep2Done = sensorsLevel >= 1;
  const isStep3Done = discoveredSystemsCount >= 2;
  const isStep4Done = colonizedCount >= 2;
  const isStep5Done = hegemonyPoints >= 10 || isVictory;

  const completedStepsCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done].filter(Boolean).length;
  const allCompleted = completedStepsCount === 5;

  // Automatically select the first non-completed step if not manually picked
  const activeAutoIndex = !isStep1Done ? 0 : !isStep2Done ? 1 : !isStep3Done ? 2 : !isStep4Done ? 3 : !isStep5Done ? 4 : 4;
  const currentStep = selectedStepIndex !== null ? selectedStepIndex : activeAutoIndex;

  const steps = [
    {
      id: 1,
      title: 'Maden & Altyapı (Ekonomi)',
      shortTitle: 'Maden',
      icon: <Pickaxe className="w-4 h-4 text-amber-400" />,
      done: isStep1Done,
      progress: isStep1Done ? 'Tamamlandı' : 'Cevher Ocağı Lv. 2 Gerekli',
      desc: 'İmparatorluğunuzun temeli maden, kristal ve yakıt üretimine dayanır. Binalarınızı yönetmek ve üretimi hızlandırmak için ana dünyanızı açın ve Cevher Ocağını Seviye 2\'ye yükseltin.',
      actionText: 'Gezegen Panelini Aç',
      actionIcon: <Pickaxe className="w-3.5 h-3.5 text-amber-300" />,
      onAction: () => {
        if (homeworld && onOpenPlanetPanel) onOpenPlanetPanel(homeworld.id);
      },
    },
    {
      id: 2,
      title: 'Ar-Ge & Sensör Ağı (Galaksi Kilidi)',
      shortTitle: 'Sensör',
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      done: isStep2Done,
      progress: isStep2Done
        ? 'Tamamlandı'
        : researchLabLevel < 1
        ? 'Ar-Ge Laboratuvarı Gerekli'
        : 'Sensör Lv. 1 Araştır',
      desc: 'Yıldız sistemimizin ötesindeki galaktik hiperuzay geçitleri kilitli! Galaksiyi haritalandırmak için ana dünyanızda Ar-Ge Laboratuvarı inşa edin ve Sensör Teknolojisi Seviye 1\'i araştırın.',
      actionText: researchLabLevel < 1 ? 'Ar-Ge Laboratuvarı Kur' : 'Sensör Seviye 1 Araştır',
      actionIcon: <Sparkles className="w-3.5 h-3.5 text-cyan-300" />,
      onAction: () => {
        if (researchLabLevel < 1) {
          if (homeworld && onOpenPlanetPanel) onOpenPlanetPanel(homeworld.id);
        } else {
          if (onOpenResearch) onOpenResearch();
        }
      },
    },
    {
      id: 3,
      title: 'Sisi Arala (İlk Keşif)',
      shortTitle: 'Keşif',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      done: isStep3Done,
      progress: isStep3Done ? 'Tamamlandı' : '1 Keşif Gerekli',
      desc: 'Sensör ağınız devreye girdi ve Triton Sektörü haritası açıldı! \'M\' tuşuyla galaksi haritasına geçin ve sisli komşu bir sisteme Gözcü gemisi fırlatarak yeni dünyaları haritalandırın.',
      actionText: 'İlk Keşfi Başlat',
      actionIcon: <Rocket className="w-3.5 h-3.5 text-emerald-300" />,
      onAction: () => {
        if (onQuickScout) onQuickScout();
      },
    },
    {
      id: 4,
      title: 'Yeni Dünya (Kolonileşme)',
      shortTitle: 'Koloni',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      done: isStep4Done,
      progress: isStep4Done ? 'Tamamlandı' : '2. Koloni Gerekli',
      desc: 'Keşfettiğiniz yaşanabilir gezegene Ağır Nakliye ile koloni malzemeleri sevk ederek 2. dünyanızı kurun ve imparatorluğunuzun sınırlarını genişletin.',
      actionText: 'Koloni Sevk Et',
      actionIcon: <Globe className="w-3.5 h-3.5 text-blue-300" />,
      onAction: () => {
        if (onOpenCommandPanel) onOpenCommandPanel();
      },
    },
    {
      id: 5,
      title: 'Nexus ve Galaktik Zafer',
      shortTitle: 'Nexus',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      done: isStep5Done,
      progress: isStep5Done ? 'Tamamlandı' : `${hegemonyPoints}/10 Puan`,
      desc: 'Merkezi Nexus Rölesini ele geçirip 500 Hegemonya puanına ulaşarak ya da sektördeki kolonilerin %60\'ını yöneterek zafere ulaşın!',
      actionText: 'Nexus Rölesine Git',
      actionIcon: <Sparkles className="w-3.5 h-3.5 text-purple-300" />,
      onAction: () => {
        if (onFocusRelay) onFocusRelay();
      },
    },
  ];

  const activeStepData = steps[currentStep];

  // Minimized Compact Pill
  if (isMinimized) {
    return (
      <div
        className="absolute top-16 z-20 pointer-events-auto select-none font-mono transition-[left] duration-300 ease-out"
        style={{ left: `${leftOffset + 16}px` }}
      >
        <button
          onClick={() => {
            sound.playClick();
            setIsMinimized(false);
          }}
          className="stellaris-dock-card px-3 py-1.5 rounded-sm border border-amber-500/50 hover:border-amber-400 text-xs font-bold text-amber-300 flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer transition-all group"
          title="Galaktik Rehberi Aç"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>REHBER: {completedStepsCount}/5</span>
          <span className="text-[10px] text-slate-400 group-hover:text-white">▼</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute top-16 z-20 w-80 max-w-[90vw] pointer-events-auto select-none font-mono animate-fade-in transition-[left] duration-300 ease-out"
      style={{ left: `${leftOffset + 16}px` }}
    >
      <div className="stellaris-dock-card rounded-sm border border-[#1d3d57] shadow-2xl backdrop-blur-md overflow-hidden text-xs">
        {/* Header Bar */}
        <div className="px-3 py-1.5 bg-[#050f1c]/90 border-b border-[#142e42] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-[11px] text-amber-300 tracking-wider">
              İLK ADIMLAR REHBERİ
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClick();
                setIsMinimized(true);
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
              title="Rehberi Küçült"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition-colors cursor-pointer"
              title="Rehberi Kapat"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Milestone Steps Pips */}
        <div className="grid grid-cols-5 gap-1 p-1.5 bg-[#030912]/80 border-b border-[#112435]">
          {steps.map((st, idx) => {
            const isSelected = currentStep === idx;
            return (
              <button
                key={st.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedStepIndex(idx);
                }}
                className={`py-1 px-1 rounded-sm text-[9.5px] font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  st.done
                    ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-sm'
                    : isSelected
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50'
                    : 'bg-[#06121f] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={st.title}
              >
                <div className="flex items-center gap-1">
                  {st.done ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                  <span className="truncate">{st.shortTitle}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        {allCompleted ? (
          <div className="p-3 text-center space-y-2 bg-[#061324]/80">
            <div className="text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>TEBRİKLER KOMUTAN!</span>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              Temel galaktik doktrini başarıyla tamamladınız. Artık imparatorluğunuz kendi kaderini çizmeye hazır!
            </p>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-sm font-bold text-[10px] transition-all cursor-pointer shadow-md"
            >
              Rehberi Tamamla & Kapat
            </button>
          </div>
        ) : (
          <div className="p-2.5 space-y-2 bg-[#061324]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {activeStepData.icon}
                <span className="font-bold text-white text-[11px]">
                  {activeStepData.title}
                </span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  activeStepData.done
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                }`}
              >
                {activeStepData.done ? 'Tamamlandı' : activeStepData.progress}
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              {activeStepData.desc}
            </p>

            {/* Quick Action Button */}
            {!activeStepData.done && (
              <div className="pt-1.5 border-t border-[#132d42] flex items-center justify-between gap-2">
                <span className="text-[9px] text-slate-400">
                  {currentStep === 0 && '⚡ +15 Momentum'}
                  {currentStep === 1 && '⚡ +20 Momentum'}
                  {currentStep === 2 && '⚡ +35 Momentum'}
                  {currentStep === 3 && '⚡ Zafer Hedefi'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    activeStepData.onAction();
                  }}
                  className="px-2.5 py-1 rounded-sm bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/80 text-cyan-200 text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm hover:scale-102 cursor-pointer"
                >
                  {activeStepData.actionIcon}
                  <span>{activeStepData.actionText}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
