import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Compass,
  Crown,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import {
  ASCENSION_PERKS,
  TRADITION_CONFIGS,
  TRADITION_NODES,
  canAdoptTradition,
  canSelectAscensionPerk,
} from '../../engine/traditions';
import {
  AscensionPerkId,
  GameState,
  TraditionTier,
  TraditionTreeId,
} from '../../engine/types';
import { sound } from '../sound';

interface TraditionsModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdoptTradition: (treeId: TraditionTreeId, tier: TraditionTier) => void;
  onSelectAscensionPerk: (perkId: AscensionPerkId) => void;
}

export const TraditionsModal: React.FC<TraditionsModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  onClose,
  onAdoptTradition,
  onSelectAscensionPerk,
}) => {
  const [selectedPerkModalOpen, setSelectedPerkModalOpen] = useState(false);

  if (!isOpen) return null;

  const traditions = state.traditions?.[activePlayerId];
  if (!traditions) return null;

  const treesList: { id: TraditionTreeId; title: string; color: string; icon: string; desc: string }[] = [
    { id: 'discovery', title: 'Keşif Doktrini', color: '#06b6d4', icon: '🧭', desc: 'Evrenin sırlarını çözün, sensör ağlarını ve araştırma hızını artırın.' },
    { id: 'expansion', title: 'Genişleme Doktrini', color: '#10b981', icon: '🚀', desc: 'Yeni dünyalara hızla yerleşin, koloni altyapısını hızlandırın.' },
    { id: 'prosperity', title: 'Refah Doktrini', color: '#f59e0b', icon: '⛏️', desc: 'Maden ocaklarını ve sanayi verimini en üst seviyeye ulaştırın.' },
    { id: 'supremacy', title: 'Üstünlük Doktrini', color: '#f43f5e', icon: '⚔️', desc: 'Donanma ateş gücünü, tersane hızını ve savunma tabyalarını güçlendirin.' },
    { id: 'harmony', title: 'Uyum & Birlik', color: '#a855f7', icon: '🕊️', desc: 'İç istikrarı koruyun, senatoda diplomatik ağırlığı zirveye çıkarın.' },
  ];

  const completedTreesCount = Object.values(traditions.trees).filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col bg-[#09111e]/95 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-900/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  İmparatorluk Gelenekleri & Yükseliş
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  FAZ 17
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kültürel Birlik ile kadim imparatorluk doktrinlerini benimseyin, ağaçları tamamlayarak Yükseliş Ayrıcalıkları açın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Unity Stats Chip */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-amber-500/40 shadow-inner">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                  <span>💎</span>
                  <span className="tracking-wide">{Math.floor(traditions.unity)}</span>
                  <span className="text-[11px] text-amber-300/80">Kültürel Birlik</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  +{traditions.unityRatePerHour} Birlik / saat
                </div>
              </div>
            </div>

            {/* Completed Trees Counter */}
            <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Tamamlanan Ağaç</span>
              <span className="font-bold text-amber-300">{completedTreesCount} / 5</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: 5 Tradition Trees Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {treesList.map((tMeta) => {
              const treeState = traditions.trees[tMeta.id];
              const isCompleted = treeState?.completed ?? false;
              const unlockedCount = treeState?.unlockedTiers.length ?? 0;

              return (
                <div
                  key={tMeta.id}
                  className={`flex flex-col rounded-xl border p-4 transition-all duration-200 relative overflow-hidden ${
                    isCompleted
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Subtle top ambient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: tMeta.color }}
                  />

                  {/* Tree Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tMeta.icon}</span>
                      <h3 className="font-bold text-sm text-slate-200">{tMeta.title}</h3>
                    </div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <CheckCircle className="w-3 h-3 text-amber-400" /> TAMAMLANDI
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {unlockedCount}/3
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {tMeta.desc}
                  </p>

                  {/* Nodes Sequence (T1, T2, T3) */}
                  <div className="flex-1 flex flex-col gap-3 justify-between">
                    {([1, 2, 3] as TraditionTier[]).map((tier) => {
                      const nodeInfo = TRADITION_NODES[tMeta.id][tier];
                      const isUnlocked = treeState?.unlockedTiers.includes(tier) ?? false;
                      const check = canAdoptTradition(state, activePlayerId, tMeta.id, tier);
                      const canAdopt = check.canAdopt;

                      return (
                        <div
                          key={tier}
                          className={`relative p-3 rounded-lg border transition-all ${
                            isUnlocked
                              ? 'bg-amber-950/30 border-amber-500/40 shadow-sm'
                              : canAdopt
                              ? 'bg-slate-800/80 border-amber-500/30 hover:border-amber-400 hover:bg-slate-800'
                              : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{nodeInfo.icon}</span>
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-200'}`}>
                                  {nodeInfo.nameTr}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Aşama {tier} Doktrini
                                </span>
                              </div>
                            </div>

                            {isUnlocked ? (
                              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {nodeInfo.cost} 💎
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                            {nodeInfo.descriptionTr}
                          </p>

                          {!isUnlocked && (
                            <button
                              disabled={!canAdopt}
                              onClick={() => {
                                sound.playClick();
                                onAdoptTradition(tMeta.id, tier);
                              }}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                canAdopt
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-[0.98]'
                                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                              }`}
                            >
                              {canAdopt ? (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" /> Doktrini Benimse
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" /> {check.reason || 'Kilitli'}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: 4-Slot Ascension Perks Console */}
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-amber-950/30 p-5 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-amber-200">
                    Galaktik Yükseliş Ayrıcalıkları (Ascension Perks)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tamamlanan her bir gelenek ağacı medeniyetinize 1 adet Yükseliş Yuvası kazandırır (Azami 4 Yuva).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  {traditions.availablePerkSlots > 0 ? `✨ ${traditions.availablePerkSlots} Boş Yuva Seçilebilir` : `${traditions.ascensionPerks.length} / 4 Yuva Dolu`}
                </span>
              </div>
            </div>

            {/* 4 Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const perkId = traditions.ascensionPerks[slotIdx];
                const perkInfo = perkId ? ASCENSION_PERKS[perkId] : null;
                const isSlotUnlocked = slotIdx < completedTreesCount;
                const canPick = isSlotUnlocked && !perkInfo && traditions.availablePerkSlots > 0;

                if (perkInfo) {
                  return (
                    <div
                      key={slotIdx}
                      className="p-3.5 rounded-xl border border-amber-500/40 bg-slate-900/90 shadow-md relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: perkInfo.accentColor }}
                      />
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-xl">{perkInfo.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-amber-300 line-clamp-1">
                            {perkInfo.nameTr}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            AKTİF YÜKSELİŞ
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {perkInfo.descriptionTr}
                      </p>
                    </div>
                  );
                }

                if (canPick) {
                  return (
                    <button
                      key={slotIdx}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPerkModalOpen(true);
                      }}
                      className="p-3.5 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-400 transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300">
                          Yükseliş Ayrıcalığı Seç
                        </div>
                        <span className="text-[10px] text-amber-400/80">Yuva #{slotIdx + 1} Kullanıma Hazır</span>
                      </div>
                    </button>
                  );
                }

                return (
                  <div
                    key={slotIdx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-2 text-center text-slate-500 opacity-60"
                  >
                    <Lock className="w-6 h-6 text-slate-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-400">Kilitli Yükseliş Yuvası</div>
                      <span className="text-[10px] text-slate-600">
                        {slotIdx + 1}. Gelenek Ağacını Tamamlayın
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Dialog for Picking an Ascension Perk */}
        {selectedPerkModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-3xl bg-[#09111e] border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-amber-200">
                    Bir Yükseliş Ayrıcalığı (Ascension Perk) Seçin
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPerkModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {(Object.keys(ASCENSION_PERKS) as AscensionPerkId[]).map((perkId) => {
                  const perk = ASCENSION_PERKS[perkId];
                  const isPicked = traditions.ascensionPerks.includes(perkId);

                  return (
                    <div
                      key={perkId}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isPicked
                          ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-900/80 border-slate-700/80 hover:border-amber-400 hover:bg-slate-850 shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                          {perk.icon}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{perk.nameTr}</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {perk.descriptionTr}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={isPicked}
                        onClick={() => {
                          sound.playClick();
                          onSelectAscensionPerk(perkId);
                          setSelectedPerkModalOpen(false);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          isPicked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        }`}
                      >
                        {isPicked ? 'Zaten Seçildi' : 'Bu Ayrıcalığı Benimse'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
