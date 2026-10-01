import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Flame,
  Globe2,
  Gavel,
  Landmark,
  Microscope,
  MinusCircle,
  Percent,
  Radio,
  Scroll,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Users,
  Vote,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  GameState,
  SenateResolutionType,
  SenateVote,
} from '../../engine/types';
import {
  calculateDiplomaticWeight,
  getActiveSenateResolution,
  isPlayerSanctioned,
  SENATE_CONSTANTS,
  SENATE_RESOLUTION_CONFIG,
  tallySenateVotes,
} from '../../engine/senate';
import { sound } from '../sound';

interface SenateModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  activePlayerId: string;
  onProposeResolution: (type: SenateResolutionType, targetPlayerId?: string) => void;
  onCastVote: (vote: SenateVote) => void;
  onCallEmergencySession: (type: SenateResolutionType, targetPlayerId?: string) => void;
}

export const SenateModal: React.FC<SenateModalProps> = ({
  isOpen,
  onClose,
  state,
  activePlayerId,
  onProposeResolution,
  onCastVote,
  onCallEmergencySession,
}) => {
  const [selectedResolutionType, setSelectedResolutionType] = useState<SenateResolutionType>('free_trade');
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chamber' | 'proposals' | 'laws' | 'weights'>('chamber');

  if (!isOpen) return null;

  const senate = state.senate;
  const currentSession = senate?.currentSession || null;
  const isSanctioned = isPlayerSanctioned(state, activePlayerId);
  const isCustodian = senate?.custodianPlayerId === activePlayerId;
  const myWeightData = calculateDiplomaticWeight(state, activePlayerId);
  const myWeight = myWeightData.total;

  const homeworld = Object.values(state.planets).find((p) => p.ownerId === activePlayerId && p.isHomeworld) ||
                    Object.values(state.planets).find((p) => p.ownerId === activePlayerId);

  // Other players list for target dropdown
  const otherPlayers = Object.values(state.players).filter((p) => p.id !== activePlayerId);
  const allPlayers = Object.values(state.players);

  // Leaderboard ranking by Diplomatic Weight
  const leaderboard = allPlayers
    .map((p) => ({
      player: p,
      weightData: calculateDiplomaticWeight(state, p.id),
      isCustodian: senate?.custodianPlayerId === p.id,
      isSanctioned: isPlayerSanctioned(state, p.id),
    }))
    .sort((a, b) => b.weightData.total - a.weightData.total);

  // Active Session Tally if active
  const tally = currentSession ? tallySenateVotes(state, currentSession) : null;
  const totalVotesWeight = tally ? (tally.forWeight + tally.againstWeight + tally.abstainWeight) : 0;
  const forPct = totalVotesWeight > 0 && tally ? Math.round((tally.forWeight / totalVotesWeight) * 100) : 0;
  const againstPct = totalVotesWeight > 0 && tally ? Math.round((tally.againstWeight / totalVotesWeight) * 100) : 0;
  const abstainPct = totalVotesWeight > 0 && tally ? Math.round((tally.abstainWeight / totalVotesWeight) * 100) : 0;

  const sessionRemainingSec = currentSession
    ? Math.max(0, Math.ceil((currentSession.votingEndsAt - state.timeMs) / 1000))
    : 0;

  const myCurrentVote: SenateVote | undefined = currentSession?.votes[activePlayerId];

  // Proposal configuration check
  const selectedConfig = SENATE_RESOLUTION_CONFIG[selectedResolutionType];
  const requiresTarget = selectedConfig.requiresTarget;
  const effectiveTargetId = requiresTarget ? (selectedTargetPlayerId || (otherPlayers[0]?.id ?? '')) : undefined;

  const canAffordProposal =
    homeworld &&
    homeworld.resources.ore >= selectedConfig.baseDepositCost.ore &&
    homeworld.resources.crystal >= selectedConfig.baseDepositCost.crystal &&
    homeworld.resources.fuel >= selectedConfig.baseDepositCost.fuel;

  const emergencyCost = isCustodian
    ? { ore: 0, crystal: 0, fuel: 0 }
    : SENATE_CONSTANTS.EMERGENCY_SESSION_COST;

  const canAffordEmergency =
    homeworld &&
    homeworld.resources.ore >= emergencyCost.ore &&
    homeworld.resources.crystal >= emergencyCost.crystal &&
    homeworld.resources.fuel >= emergencyCost.fuel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col stellaris-modal rounded-md overflow-hidden shadow-2xl border border-[#2b4c64]/80 bg-[#070e17]/95">
        
        {/* Chamber Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b3447] bg-gradient-to-r from-[#0d1f30] via-[#091522] to-[#0d1f30]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Landmark className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg md:text-xl font-bold tracking-wider stellaris-gold uppercase flex items-center gap-2">
                  Galaktik Topluluk & İmparatorluk Senatosu
                </h2>
                {senate?.custodianPlayerId && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-blue-400" />
                    Muhafızlık Aktif
                  </span>
                )}
                {isSanctioned && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Yaptırım Altında
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Galaktik Yasa Tasarıları, Ağırlıklı Oylama Meclisi ve Muhafız Liderlik Doktrinleri
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                Diplomatik Ağırlığınız
              </span>
              <div className="flex items-center space-x-1.5 text-base font-mono font-bold text-amber-300">
                <Vote className="w-4 h-4 text-amber-400" />
                <span>{myWeight} Oy</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-600 transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 pt-2 border-b border-[#182f42] bg-[#08121d]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('chamber');
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'chamber'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gavel className="w-4 h-4" />
            Oylama Salonu
            {currentSession && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-black font-extrabold animate-pulse">
                {sessionRemainingSec}s
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('proposals');
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'proposals'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scroll className="w-4 h-4" />
            Yasa Teklifi Sun
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('laws');
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'laws'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Yürürlükteki Yasalar ({senate?.activeResolutions?.length || 0})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('weights');
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'weights'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Diplomatik Sıralama
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: CHAMBER & ACTIVE SESSION */}
          {activeTab === 'chamber' && (
            <div className="space-y-6">
              {currentSession ? (
                (() => {
                  const cfg = SENATE_RESOLUTION_CONFIG[currentSession.type];
                  const proposer = state.players[currentSession.proposedBy];
                  const targetPlayer = currentSession.targetPlayerId
                    ? state.players[currentSession.targetPlayerId]
                    : undefined;

                  return (
                    <div className="space-y-6">
                      {/* Active Session Card */}
                      <div className="p-5 rounded-md border border-[#2b4c64] bg-gradient-to-b from-[#0b1a29] to-[#07111b] space-y-4 shadow-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{cfg.icon}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-slate-100">
                                  {cfg.nameTr}
                                </h3>
                                {currentSession.isEmergencySession && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                    🚨 OLAĞANÜSTÜ ACİL DURUM
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">
                                Teklif Eden:{' '}
                                <span className="font-semibold" style={{ color: proposer?.color || '#fff' }}>
                                  {proposer?.name || 'Bilinmeyen İmparatorluk'}
                                </span>
                                {targetPlayer && (
                                  <span className="ml-2 text-amber-300 font-semibold">
                                    • Hedef: {targetPlayer.name}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-black/40 border border-[#254157]">
                            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                            <span className="text-xs font-mono font-bold text-amber-300">
                              Kalan Süre: {sessionRemainingSec}s
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded bg-black/30 border border-[#1b3447] text-xs text-slate-300 leading-relaxed">
                          <p className="font-medium text-slate-200 mb-1">{cfg.shortDescTr}</p>
                          <p className="text-amber-200/90 text-[11.5px]">{cfg.detailedEffectTr}</p>
                        </div>

                        {/* Weighted Vote Progress Bar */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-xs font-mono font-bold">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> LEHTE: {tally?.forWeight || 0} ({forPct}%)
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <MinusCircle className="w-3.5 h-3.5" /> ÇEKİMSER: {tally?.abstainWeight || 0} ({abstainPct}%)
                            </span>
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> ALEYHTE: {tally?.againstWeight || 0} ({againstPct}%)
                            </span>
                          </div>

                          {/* Progress bar visual */}
                          <div className="h-4 w-full bg-slate-900 rounded-sm overflow-hidden flex border border-[#1b3447]">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${forPct}%` }}
                              title={`Lehte: ${tally?.forWeight || 0}`}
                            />
                            <div
                              className="bg-slate-600 h-full transition-all duration-300"
                              style={{ width: `${abstainPct}%` }}
                              title={`Çekimser: ${tally?.abstainWeight || 0}`}
                            />
                            <div
                              className="bg-rose-500 h-full transition-all duration-300"
                              style={{ width: `${againstPct}%` }}
                              title={`Aleyhte: ${tally?.againstWeight || 0}`}
                            />
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>
                              Yasanın geçmesi için <strong className="text-slate-200">LEHTE &gt; ALEYHTE</strong> çoğunluk aranır.
                            </span>
                            <span className="font-mono text-slate-300">
                              Toplam Diplomatik Katılım: {totalVotesWeight} Oy
                            </span>
                          </div>
                        </div>

                        {/* Action Voting Buttons */}
                        <div className="pt-3 border-t border-[#1a3346] flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <span>Sizin Oyunuz:</span>
                            {myCurrentVote === 'for' && (
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40">
                                LEHTE (+{myWeight})
                              </span>
                            )}
                            {myCurrentVote === 'against' && (
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40">
                                ALEYHTE (-{myWeight})
                              </span>
                            )}
                            {myCurrentVote === 'abstain' && (
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-slate-300 bg-slate-500/20 border border-slate-500/40">
                                ÇEKİMSER (0)
                              </span>
                            )}
                            {!myCurrentVote && (
                              <span className="px-2 py-0.5 rounded font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/30">
                                Henüz Oy Kullanılmadı
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onCastVote('for');
                              }}
                              className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                myCurrentVote === 'for'
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Lehte Oy Ver (+{myWeight})
                            </button>

                            <button
                              onClick={() => {
                                sound.playClick();
                                onCastVote('against');
                              }}
                              className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                myCurrentVote === 'against'
                                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                  : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-600/50'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Aleyhte Oy Ver (-{myWeight})
                            </button>

                            <button
                              onClick={() => {
                                sound.playClick();
                                onCastVote('abstain');
                              }}
                              className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                myCurrentVote === 'abstain'
                                  ? 'bg-slate-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                              }`}
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              Çekimser
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Votes Breakdown Table */}
                      <div className="p-4 rounded-md border border-[#1b3447] bg-[#08121d] space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Vote className="w-4 h-4 text-amber-400" />
                          İmparatorlukların Oyları ve Güç Dağılımı
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {allPlayers.map((p) => {
                            const vote = currentSession.votes[p.id] || 'abstain';
                            const pWeight = calculateDiplomaticWeight(state, p.id).total;
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#182f42] text-xs font-mono"
                              >
                                <span className="font-semibold truncate max-w-[120px]" style={{ color: p.color }}>
                                  {p.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-slate-400">{pWeight} oy</span>
                                  {vote === 'for' && <span className="text-emerald-400 font-bold">LEHTE</span>}
                                  {vote === 'against' && <span className="text-rose-400 font-bold">ALEYHTE</span>}
                                  {vote === 'abstain' && <span className="text-slate-400">ÇEKİMSER</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* No Active Session State */
                <div className="p-8 rounded-md border border-[#2b4c64]/60 bg-[#0a1827]/60 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <Landmark className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-slate-200">
                      Senato Meclisi Şu Anda Tatilde
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gündemde oylanmakta olan aktif bir yasa tasarısı yok. Yeni bir yasa tasarısını meclise sunabilir veya olağanüstü acil durum oturumu çağırabilirsiniz.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveTab('proposals');
                      }}
                      className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider stellaris-btn-metallic text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 transition-all inline-flex items-center gap-2"
                    >
                      <Scroll className="w-4 h-4" />
                      Yasa Tasarısı Sun
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROPOSE RESOLUTION */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(SENATE_RESOLUTION_CONFIG) as SenateResolutionType[]).map((type) => {
                  const cfg = SENATE_RESOLUTION_CONFIG[type];
                  const isSelected = selectedResolutionType === type;
                  const isAlreadyActive = getActiveSenateResolution(state, type) !== undefined;

                  return (
                    <div
                      key={type}
                      onClick={() => {
                        sound.playClick();
                        setSelectedResolutionType(type);
                      }}
                      className={`p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                          : 'border-[#1b3447] bg-[#091522] hover:border-slate-500'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-2xl">{cfg.icon}</span>
                            <span className="font-bold text-slate-100 text-sm">{cfg.nameTr}</span>
                          </div>
                          {isAlreadyActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              YÜRÜRLÜKTE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{cfg.shortDescTr}</p>
                        <p className="text-[11.5px] text-amber-300/80 leading-snug">{cfg.detailedEffectTr}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#182f42] flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Teklif Harcı:</span>
                        <span className="text-cyan-300 font-bold">
                          {cfg.baseDepositCost.crystal > 0 && `${cfg.baseDepositCost.crystal} Kristal `}
                          {cfg.baseDepositCost.ore > 0 && `${cfg.baseDepositCost.ore} Cevher `}
                          {cfg.baseDepositCost.fuel > 0 && `${cfg.baseDepositCost.fuel} Yakıt`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proposal Action Footer */}
              <div className="p-5 rounded-md border border-[#2b4c64] bg-[#0b1928] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-amber-400" />
                      Seçili Tasarı: {selectedConfig.nameTr}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Meclis onayına sunulacak kanun tasarısı 60 saniye boyunca tüm imparatorluklarca oylanır.
                    </p>
                  </div>

                  {requiresTarget && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-300 font-medium">Hedef İmparatorluk:</span>
                      <select
                        value={selectedTargetPlayerId || otherPlayers[0]?.id || ''}
                        onChange={(e) => setSelectedTargetPlayerId(e.target.value)}
                        className="px-3 py-1.5 rounded bg-black/60 border border-[#2b4c64] text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        {allPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.id === activePlayerId ? '(Siz)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1a3346]">
                  <div className="text-xs font-mono text-slate-300">
                    Koloni Kaynakları:{' '}
                    <span className="text-cyan-300">
                      {Math.floor(homeworld?.resources.crystal || 0)} Kristal / {Math.floor(homeworld?.resources.fuel || 0)} Yakıt
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      disabled={!canAffordEmergency || !!currentSession || isSanctioned}
                      onClick={() => {
                        sound.playClick();
                        onCallEmergencySession(selectedResolutionType, effectiveTargetId);
                      }}
                      className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        canAffordEmergency && !currentSession && !isSanctioned
                          ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                      title={
                        isCustodian
                          ? 'Muhafız Yetkisi: Ücretsiz Hızlı Oturum (25s)'
                          : 'Acil Durum Yetkisi (1500 Kristal, 500 Yakıt)'
                      }
                    >
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      Olağanüstü Oturum (25s)
                    </button>

                    <button
                      disabled={!canAffordProposal || !!currentSession || isSanctioned}
                      onClick={() => {
                        sound.playClick();
                        onProposeResolution(selectedResolutionType, effectiveTargetId);
                      }}
                      className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                        canAffordProposal && !currentSession && !isSanctioned
                          ? 'stellaris-btn-metallic text-amber-300 border border-amber-500/50 hover:bg-amber-500/20 shadow-md'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Scroll className="w-4 h-4" />
                      Yasa Tasarısını Oylamaya Sun
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE LAWS */}
          {activeTab === 'laws' && (
            <div className="space-y-6">
              {/* Custodian Banner if exists */}
              {senate?.custodianPlayerId && (
                (() => {
                  const custodian = state.players[senate.custodianPlayerId];
                  return (
                    <div className="p-4 rounded-md border border-blue-500/50 bg-gradient-to-r from-blue-950/50 via-[#0d1d2e] to-blue-950/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300">
                          <Crown className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-mono tracking-wider text-blue-300">
                              Yüce Galaktik Muhafız
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-200 border border-blue-400">
                              Olağanüstü Yetkili
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-100" style={{ color: custodian?.color || '#fff' }}>
                            {custodian?.name || 'Bilinmeyen'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Kazanımlar: +150 Hegemonya Puanı, +%30 Diplomatik Ağırlık, +%20 Donanma Ateş Gücü.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Active Resolutions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Yürürlükteki Galaktik Yasalar ({senate?.activeResolutions?.length || 0})
                </h4>

                {(!senate?.activeResolutions || senate.activeResolutions.length === 0) ? (
                  <div className="p-8 rounded border border-[#1b3447] bg-[#08121d] text-center text-slate-400 text-xs">
                    Şu anda yürürlükte aktif bir galaktik yasa veya pakt bulunmuyor.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {senate.activeResolutions.map((res) => {
                      const cfg = SENATE_RESOLUTION_CONFIG[res.resolutionType];
                      const targetPlayer = res.targetPlayerId ? state.players[res.targetPlayerId] : undefined;
                      const remainingSec = res.expiresAt
                        ? Math.max(0, Math.ceil((res.expiresAt - state.timeMs) / 1000))
                        : undefined;

                      return (
                        <div
                          key={res.id}
                          className="p-4 rounded-md border border-[#23425a] bg-[#091522] space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{cfg.icon}</span>
                              <span className="font-bold text-slate-100 text-sm">{cfg.nameTr}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              YÜRÜRLÜKTE
                            </span>
                          </div>

                          {targetPlayer && (
                            <div className="text-xs text-amber-300 font-semibold">
                              Hedef: {targetPlayer.name}
                            </div>
                          )}

                          <p className="text-xs text-slate-300 leading-snug">{cfg.shortDescTr}</p>
                          <p className="text-[11.5px] text-amber-300/80 leading-snug">{cfg.detailedEffectTr}</p>

                          {remainingSec !== undefined && (
                            <div className="pt-2 border-t border-[#182f42] flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>Yürürlük Süresi:</span>
                              <span className="text-amber-300">{remainingSec} saniye</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History of Past Sessions */}
              {senate?.sessionHistory && senate.sessionHistory.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#1a3346]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Geçmiş Senato Oturumları ({senate.sessionHistory.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {senate.sessionHistory.slice(0, 10).map((hist) => {
                      const cfg = SENATE_RESOLUTION_CONFIG[hist.resolutionType];
                      return (
                        <div
                          key={hist.id}
                          className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-[#182f42] text-xs font-mono"
                        >
                          <div className="flex items-center space-x-2">
                            <span>{cfg.icon}</span>
                            <span className="font-semibold text-slate-200">{cfg.nameTr}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-400">
                              {hist.forWeight} Lehte / {hist.againstWeight} Aleyhte
                            </span>
                            {hist.passed ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                KABUL EDİLDİ
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                REDDEDİLDİ
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIPLOMATIC WEIGHT LEADERBOARD */}
          {activeTab === 'weights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Diplomatik Ağırlık = Donanma Gücü + Üretim Kapasitesi + Teknoloji Seviyesi + Koloni Sayısı
                </span>
                <span className="font-mono text-amber-300">
                  Muhafız: +%30 | Yaptırım: -%25
                </span>
              </div>

              <div className="space-y-2">
                {leaderboard.map((item, idx) => {
                  const isMe = item.player.id === activePlayerId;
                  const bd = item.weightData.breakdown;

                  return (
                    <div
                      key={item.player.id}
                      className={`p-3.5 rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isMe
                          ? 'border-amber-400/80 bg-amber-400/5'
                          : 'border-[#1b3447] bg-[#08121d]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-sm text-slate-400 w-6">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm" style={{ color: item.player.color }}>
                              {item.player.name}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                SİZ
                              </span>
                            )}
                            {item.isCustodian && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-blue-400" /> MUHAFIZ
                              </span>
                            )}
                            {item.isSanctioned && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-rose-400" /> YAPTIRIM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-1">
                            <span>Donanma: {bd.fleetPower}</span>
                            <span>Ekonomi: {bd.economy}</span>
                            <span>Teknoloji: {bd.technology}</span>
                            <span>Koloniler: {bd.colonies}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end md:self-center">
                        {bd.custodianBonus > 0 && (
                          <span className="text-[11px] font-mono text-blue-300">
                            +%{Math.round(SENATE_CONSTANTS.CUSTODIAN_DIPLOMATIC_WEIGHT_BONUS_PERCENT * 100)} Muhafız
                          </span>
                        )}
                        {bd.sanctionsPenalty > 0 && (
                          <span className="text-[11px] font-mono text-rose-400">
                            -%{Math.round(SENATE_CONSTANTS.SANCTIONS_DIPLOMATIC_WEIGHT_PENALTY_PERCENT * 100)} Yaptırım
                          </span>
                        )}
                        <div className="text-right">
                          <div className="text-base font-mono font-bold text-amber-300">
                            {item.weightData.total} Oy
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Diplomatik Ağırlık
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#182f42] bg-[#070e17] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Galaktik Hukuk Protokolü v12.0 Aktif</span>
          </div>

          <div className="font-mono text-slate-300">
            Nexus Rölesi &amp; Konsey Koordinasyonu
          </div>
        </div>
      </div>
    </div>
  );
};
