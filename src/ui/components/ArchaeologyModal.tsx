import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Shield,
  Zap,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight,
  X,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Cpu,
  Eye,
  Activity,
} from 'lucide-react';
import {
  RELIC_TRIUMPH_CONFIGS,
  canActivateRelicTriumph,
  canExcavateSite,
  canReverseEngineer,
  getSiteChapterConfig,
  hasActiveRelicTriumph,
} from '../../engine/archaeology';
import { EMPIRE_ARTIFACTS } from '../../engine/artifacts';
import {
  ActiveRelicTriumph,
  ArchaeologyChapterChoice,
  ArchaeologySite,
  EmpireArtifactId,
  GameState,
} from '../../engine/types';
import { sound } from '../sound';

interface ArchaeologyModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onExcavateSite: (siteId: string, fleetId: string) => void;
  onAbandonExcavation: (siteId: string) => void;
  onResolveSiteChoice: (siteId: string, choiceIndex: number) => void;
  onActivateRelicTriumph: (relicId: EmpireArtifactId) => void;
  onReverseEngineer: (actionType: 'tech_boost' | 'cultural_festival', targetPlanetId?: string) => void;
}

export const ArchaeologyModal: React.FC<ArchaeologyModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  onClose,
  onExcavateSite,
  onAbandonExcavation,
  onResolveSiteChoice,
  onActivateRelicTriumph,
  onReverseEngineer,
}) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'relics'>('sites');
  const [selectedFleetId, setSelectedFleetId] = useState<Record<string, string>>({});
  const [choiceModalSite, setChoiceModalSite] = useState<ArchaeologySite | null>(null);

  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  if (!player) return null;

  const sites = state.archaeologySites || {};
  const siteList = Object.values(sites);
  const minorArtifacts = player.minorArtifacts || 0;
  const playerRelics = player.artifacts || [];
  const nowMs = state.timeMs;

  const activeTriumphs: ActiveRelicTriumph[] = state.activeRelicTriumphs?.[activePlayerId] || [];

  const allRelicIds: EmpireArtifactId[] = [
    'progenitor_matrix',
    'rift_hyperdrive',
    'dreadnought_plating',
    'subspace_tachyon_array',
    'omniscient_archive',
    'chronos_core',
  ];

  // Helper to find eligible player scout fleets in a system
  const getEligibleFleetsForSystem = (systemId: string) => {
    return Object.values(state.fleets).filter(
      (f) =>
        f.ownerId === activePlayerId &&
        f.targetSystemId === systemId &&
        f.status === 'orbiting' &&
        (f.ships.scout || 0) > 0
    );
  };

  const handleStartExcavation = (site: ArchaeologySite) => {
    const fleetId = selectedFleetId[site.id] || getEligibleFleetsForSystem(site.systemId)[0]?.id;
    if (!fleetId) {
      sound.playError();
      return;
    }
    sound.playTech();
    onExcavateSite(site.id, fleetId);
  };

  const handleCancelExcavation = (siteId: string) => {
    sound.playClick();
    onAbandonExcavation(siteId);
  };

  const handleResolveChoice = (siteId: string, choiceIndex: number) => {
    sound.playVictoryFanfare();
    onResolveSiteChoice(siteId, choiceIndex);
    setChoiceModalSite(null);
  };

  const handleTriumphClick = (relicId: EmpireArtifactId) => {
    const check = canActivateRelicTriumph(state, activePlayerId, relicId);
    if (!check.canActivate) {
      sound.playError();
      return;
    }
    sound.playVictoryFanfare();
    onActivateRelicTriumph(relicId);
  };

  const handleReverseEngineerClick = (actionType: 'tech_boost' | 'cultural_festival') => {
    const check = canReverseEngineer(state, activePlayerId, actionType);
    if (!check.canReverseEngineer) {
      sound.playError();
      return;
    }
    sound.playTech();
    onReverseEngineer(actionType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="stellaris-outliner relative flex flex-col w-full max-w-5xl h-[88vh] rounded-xl overflow-hidden shadow-2xl border border-cyan-500/40 bg-slate-950/95 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-400">
                  ARKEOLOJİ VE KADİM YADİGÂR MAHSENİ
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  FAZ 18
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kadim öncüllerin kayıp teknolojilerini gün yüzüne çıkarın, kalıntı parçacıklarını dönüştürün ve zafer güçlerini serbest bırakın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Minor Artifacts Display Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-300 uppercase tracking-widest font-mono">Kadim Parçacık</span>
                <span className="text-sm font-bold text-purple-200 font-mono">{minorArtifacts}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900/50">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('sites');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'sites'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 shadow-[0_-4px_10px_rgba(6,182,212,0.15)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Sektör Kazı Alanları ({siteList.length})
            {siteList.some((s) => s.status === 'choice_pending' && s.excavatingPlayerId === activePlayerId) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('relics');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'relics'
                ? 'border-amber-400 text-amber-300 bg-amber-950/40 shadow-[0_-4px_10px_rgba(245,158,11,0.15)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Award className="w-4 h-4" />
            Kadim Kalıntılar & Yadigâr Zaferleri ({playerRelics.length}/{allRelicIds.length})
            {activeTriumphs.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 font-mono">
                {activeTriumphs.length} Aktif
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Excavation Sites */}
        {activeTab === 'sites' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {siteList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/40">
                  <Compass className="w-10 h-10 mx-auto mb-3 text-slate-600 animate-pulse" />
                  <p className="text-base font-medium">Galakside henüz keşfedilmiş arkeolojik kazı alanı bulunamadı.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Kaşif filolarınızı derin uzay sistemlerine keşif seferine göndererek kadim medeniyet kalıntılarını araştırın.
                  </p>
                </div>
              ) : (
                siteList.map((site) => {
                  const system = state.map.systems[site.systemId];
                  const currentChapterConfig = getSiteChapterConfig(site);
                  const isMyExcavation = site.excavatingPlayerId === activePlayerId;
                  const eligibleFleets = getEligibleFleetsForSystem(site.systemId);
                  const durationMs = currentChapterConfig?.durationMs || 60000;
                  const progressPercent = Math.min(
                    100,
                    Math.round((site.chapterProgressMs / durationMs) * 100)
                  );
                  const isHard = site.rewardArtifactId === 'chronos_core' || site.rewardArtifactId === 'dreadnought_plating';

                  return (
                    <div
                      key={site.id}
                      className={`stellaris-item-card rounded-xl p-5 border transition-all ${
                        site.status === 'choice_pending' && isMyExcavation
                          ? 'border-amber-400/80 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : site.status === 'excavating'
                          ? 'border-cyan-500/60 bg-cyan-950/15 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : site.status === 'completed'
                          ? 'border-emerald-500/50 bg-emerald-950/15'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Bar of Card */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-xl border ${
                              site.status === 'completed'
                                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                                : site.status === 'choice_pending'
                                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 animate-pulse'
                                : site.status === 'excavating'
                                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <Compass className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-100">{site.nameTr}</h3>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {system?.name || site.systemId} Sistemi
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                                  isHard
                                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {isHard ? 'Zor Kazı' : 'Orta Zorluk'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5">{site.descriptionTr}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {site.status === 'completed' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                              <CheckCircle className="w-3.5 h-3.5" /> Kazı Tamamlandı
                            </span>
                          )}
                          {site.status === 'choice_pending' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" /> Karar Bekleniyor!
                            </span>
                          )}
                          {site.status === 'excavating' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                              <Activity className="w-3.5 h-3.5 animate-spin" /> Kazı Devam Ediyor
                            </span>
                          )}
                          {site.status === 'available' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              Müsait
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chapters Progress Bar & Narrative Details */}
                      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-semibold text-slate-300">
                            Aşama: Bölüm {site.status === 'completed' ? site.totalChapters : site.currentChapter} / {site.totalChapters}
                          </span>
                          <span className="font-mono text-cyan-300">
                            {site.status === 'completed'
                              ? '100%'
                              : `${progressPercent}% (${Math.round(site.chapterProgressMs / 1000)}s / ${Math.round(
                                  durationMs / 1000
                                )}s)`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              site.status === 'completed'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : site.status === 'choice_pending'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{
                              width: `${site.status === 'completed' ? 100 : progressPercent}%`,
                            }}
                          />
                        </div>

                        {/* Current Chapter Info */}
                        {currentChapterConfig && site.status !== 'completed' && (
                          <div className="text-xs text-slate-300 border-l-2 border-cyan-400 pl-3 py-1">
                            <span className="font-bold text-cyan-200">
                              Bölüm {site.currentChapter}: {currentChapterConfig.titleTr}
                            </span>
                            <p className="text-slate-400 mt-1 italic leading-relaxed">
                              "{currentChapterConfig.textTr}"
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                              <span className="text-purple-300">
                                💎 Ödül: +{currentChapterConfig.rewardMinorArtifacts} Kadim Eser Parçacığı
                              </span>
                              {currentChapterConfig.rewardXP && (
                                <span className="text-amber-300">
                                  ⭐ Komutan XP: +{currentChapterConfig.rewardXP}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Completed Site Final Narrative */}
                        {site.status === 'completed' && (
                          <div className="text-xs text-slate-300 border-l-2 border-emerald-400 pl-3 py-1">
                            <span className="font-bold text-emerald-200">
                              Kazı Başarıyla Tamamlandı: {site.rewardArtifactId ? EMPIRE_ARTIFACTS[site.rewardArtifactId]?.nameTr : 'Kadim Sır'}
                            </span>
                            <p className="text-slate-400 mt-1 leading-relaxed">
                              Tüm arkeolojik katmanlar çözüldü. Bu kadim sitenin tüm gizemi ve paha biçilmez yadigârı imparatorluğunuzun mahzenine nakledildi (+100 Hegemonya Zafer Puanı).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Excavation Log History (if any completed chapters) */}
                      {site.log && site.log.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            Tamamlanan Bölümler Arşivi:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {site.log.map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>
                                  Bölüm {entry.chapter}: {entry.titleTr}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        {/* Choice Pending Action */}
                        {site.status === 'choice_pending' && isMyExcavation && (
                          <div className="w-full flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                              Ekibiniz bir yol ayrımına ulaştı. Seçiminizi belirleyin!
                            </div>
                            <button
                              onClick={() => {
                                sound.playClick();
                                setChoiceModalSite(site);
                              }}
                              className="stellaris-btn-metallic px-4 py-2 rounded-lg text-xs font-bold bg-amber-600/80 hover:bg-amber-500 text-white border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              Kararı İncele ve Seç
                            </button>
                          </div>
                        )}

                        {/* Excavating Action */}
                        {site.status === 'excavating' && isMyExcavation && (
                          <div className="w-full flex items-center justify-between gap-4">
                            <span className="text-xs text-cyan-300 font-mono">
                              Filo Görevde: {state.fleets[site.assignedFleetId || '']?.name || 'Keşif Filosu'}
                            </span>
                            <button
                              onClick={() => handleCancelExcavation(site.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 transition-colors"
                            >
                              Kazıyı İptal Et / Geri Çekil
                            </button>
                          </div>
                        )}

                        {/* Available Action: Select fleet & start */}
                        {site.status === 'available' && (
                          <div className="w-full flex items-center justify-between gap-4">
                            {eligibleFleets.length > 0 ? (
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-300 font-semibold">Görevli Kaşif Filosu:</span>
                                <select
                                  value={selectedFleetId[site.id] || eligibleFleets[0]?.id}
                                  onChange={(e) =>
                                    setSelectedFleetId({
                                      ...selectedFleetId,
                                      [site.id]: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400"
                                >
                                  {eligibleFleets.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.name} ({f.ships.scout} Kaşif)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-400/90 italic">
                                ⚠️ Bu sistemde yörüngede en az 1 Kaşif gemisi içeren bir filonuz olmalıdır.
                              </span>
                            )}

                            <button
                              disabled={eligibleFleets.length === 0}
                              onClick={() => handleStartExcavation(site)}
                              className={`stellaris-btn-metallic px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                eligibleFleets.length > 0
                                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <Compass className="w-4 h-4" />
                              Kazı Seferini Başlat
                            </button>
                          </div>
                        )}

                        {/* Completed Status */}
                        {site.status === 'completed' && (
                          <div className="w-full flex items-center justify-between text-xs text-emerald-400/90 font-mono">
                            <span>Kazanılan Kadim Yadigâr: [{site.rewardArtifactId ? EMPIRE_ARTIFACTS[site.rewardArtifactId]?.nameTr : 'Yadigâr'}]</span>
                            <span className="text-slate-400">Arşivlendi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Relics Vault & Triumphs */}
        {activeTab === 'relics' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Reverse-Engineering Strategic Actions */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-purple-200">
                      Kadim Parçacıkları Tersine Mühendislik İle Dönüştür
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kazılardan ve uzay enkazlarından topladığınız kadim parçacıkları laboratuvarda parçalayarak Ar-Ge sıçraması yapın veya halka sunun.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Kullanılabilir Parçacık:</span>
                  <span className="text-lg font-bold text-purple-300 font-mono">{minorArtifacts} 💎</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Tech Boost Card */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-purple-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        Kadim Ar-Ge Analizi
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                        25 Parçacık
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Kadim alaşımları ve mikroskobik devreleri analiz eder. Mevcut araştırma sıranızı anında 60 saniye hızlandırır (veya sıra boşsa +1 Motor Ar-Ge'si kazandırır).
                    </p>
                  </div>

                  <button
                    disabled={minorArtifacts < 25}
                    onClick={() => handleReverseEngineerClick('tech_boost')}
                    className={`stellaris-btn-metallic w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      minorArtifacts >= 25
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Teknolojiyi Analiz Et (25 💎)
                  </button>
                </div>

                {/* Cultural Festival Card */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-purple-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Antik Kalıntı Kültür Festivali
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                        30 Parçacık
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Kayıp medeniyet kalıntılarını müzelere ve imparatorluk meydanlarına sunar. Anında +150 Kültürel Birlik ve İmparatorluk Konseyi'ne +10 İstikrar sağlar.
                    </p>
                  </div>

                  <button
                    disabled={minorArtifacts < 30}
                    onClick={() => handleReverseEngineerClick('cultural_festival')}
                    className={`stellaris-btn-metallic w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      minorArtifacts >= 30
                        ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Festivali Başlat (30 💎)
                  </button>
                </div>
              </div>
            </div>

            {/* Relics Cards Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                İmparatorluk Büyük Yadigârları & Zafer Güçleri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allRelicIds.map((relicId) => {
                  const meta = EMPIRE_ARTIFACTS[relicId];
                  const triumph = RELIC_TRIUMPH_CONFIGS[relicId];
                  const isOwned = playerRelics.includes(relicId);
                  const activeTriumph = activeTriumphs.find((t) => t.relicId === relicId);
                  const isActive = Boolean(activeTriumph);
                  const cooldownUntil = player.relicCooldowns?.[relicId] || 0;
                  const isOnCooldown = nowMs < cooldownUntil;
                  const cooldownRemainingSec = Math.max(1, Math.round((cooldownUntil - nowMs) / 1000));
                  const activeRemainingSec = activeTriumph ? Math.max(1, Math.round((activeTriumph.expiresAtMs - nowMs) / 1000)) : 0;

                  return (
                    <div
                      key={relicId}
                      className={`stellaris-item-card rounded-xl p-5 border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                          : isOwned
                          ? 'border-cyan-500/40 bg-slate-900/60 hover:border-cyan-400/70'
                          : 'border-slate-800/80 bg-slate-950/40 opacity-70'
                      }`}
                    >
                      <div>
                        {/* Header of Relic Card */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-xl border text-xl ${
                                isActive
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                                  : isOwned
                                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}
                            >
                              {meta?.icon || '🏛️'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-base ${isOwned ? 'text-slate-100' : 'text-slate-400'}`}>
                                  {meta?.nameTr || relicId}
                                </h4>
                                {isOwned ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                    SAHİP OLUNDU
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                    KİLİTLİ
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 italic mt-0.5">
                                "{meta?.descriptionTr || 'Kadim çağlardan kalan efsanevi bir eser.'}"
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Passive Permanent Bonus */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-3 text-xs">
                          <span className="text-slate-400 font-semibold block mb-0.5">Kalıcı Pasif Etki:</span>
                          <span className="text-slate-200 leading-relaxed">{meta?.effectTr || 'Belirtilmemiş'}</span>
                        </div>

                        {/* Active Relic Triumph Section */}
                        {triumph && (
                          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-950/20 to-slate-950/40 border border-amber-500/20 text-xs mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                                Aktif Zafer: {triumph.nameTr}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                Maliyet: {triumph.minorArtifactsCost} 💎
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                              {triumph.descriptionTr}
                            </p>

                            {/* Active Triumph Banner */}
                            {isActive && (
                              <div className="flex items-center justify-between px-3 py-1.5 rounded bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold animate-pulse">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  Zafer Gücü Devrede!
                                </span>
                                <span className="font-mono">{activeRemainingSec} sn kaldı</span>
                              </div>
                            )}

                            {/* Cooldown Banner */}
                            {!isActive && isOnCooldown && (
                              <div className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  Yenilenme Bekleme Süresi
                                </span>
                                <span>{cooldownRemainingSec} sn</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {isOwned ? (
                          <button
                            disabled={isActive || isOnCooldown || minorArtifacts < (triumph?.minorArtifactsCost || 30)}
                            onClick={() => handleTriumphClick(relicId)}
                            className={`stellaris-btn-metallic w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isActive
                                ? 'bg-amber-600/50 text-amber-200 border border-amber-400/50 cursor-not-allowed'
                                : isOnCooldown
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : minorArtifacts >= (triumph?.minorArtifactsCost || 30)
                                ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                            {isActive
                              ? `Zafer Aktif (${activeRemainingSec}s)`
                              : isOnCooldown
                              ? `Bekleme Süresinde (${cooldownRemainingSec}s)`
                              : minorArtifacts < (triumph?.minorArtifactsCost || 30)
                              ? `Yetersiz Parçacık (${minorArtifacts}/${triumph?.minorArtifactsCost || 30})`
                              : `Yadigâr Zaferini Aktive Et (${triumph?.minorArtifactsCost || 30} 💎)`}
                          </button>
                        ) : (
                          <div className="text-center py-2 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
                            İlgili arkeolojik kazıyı tamamlayarak elde edilir
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              🏛️ Keşfedilen Kazılar: <strong className="text-slate-200">{siteList.length}</strong>
            </span>
            <span>
              ✨ Sahip Olunan Yadigârlar: <strong className="text-amber-300">{playerRelics.length}</strong>
            </span>
            <span>
              💎 Kadim Parçacıklar: <strong className="text-purple-300">{minorArtifacts}</strong>
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Choice Pending Interactive Decision Popup */}
      {choiceModalSite && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="stellaris-outliner relative flex flex-col w-full max-w-xl rounded-xl p-6 border border-amber-400/80 bg-slate-950 text-slate-100 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                <h3 className="text-lg font-bold text-amber-300">
                  Arkeolojik Keşif Kararı
                </h3>
              </div>
              <button
                onClick={() => setChoiceModalSite(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const choiceChapterConfig = getSiteChapterConfig(
                choiceModalSite,
                choiceModalSite.pendingChoiceChapter || choiceModalSite.currentChapter
              );
              return (
                <>
                  {choiceChapterConfig && (
                    <div className="mb-4">
                      <span className="text-xs text-cyan-300 font-semibold block mb-1">
                        {choiceModalSite.nameTr} - Bölüm {choiceChapterConfig.chapterNumber}: {choiceChapterConfig.titleTr}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        "{choiceChapterConfig.textTr}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Bir Keşif Doktrini Seçin:
                    </span>

                    {choiceChapterConfig?.choices?.map((choice: ArchaeologyChapterChoice, cIdx: number) => (
                      <div
                        key={cIdx}
                        onClick={() => handleResolveChoice(choiceModalSite.id, cIdx)}
                        className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-amber-400 hover:bg-amber-950/20 cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-100 group-hover:text-amber-300">
                            {choice.textTr}
                          </span>
                          {choice.minorArtifactsBonus && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono">
                              +{choice.minorArtifactsBonus} 💎
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{choice.descriptionTr}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                          <span className="text-emerald-400 font-semibold">{choice.outcomeTr}</span>
                          <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Uygula <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            <div className="text-right">
              <button
                onClick={() => setChoiceModalSite(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
