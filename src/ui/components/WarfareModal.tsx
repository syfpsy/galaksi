import React, { useState } from 'react';
import {
  GameState,
  SubjectType,
  WarGoalType,
  WarState,
} from '../../engine/types';
import {
  SUBJECT_TYPE_CONFIGS,
  WAR_GOAL_CONFIGS,
  getActiveWarsForPlayer,
  getPlayerSubjects,
  getSubjectAgreement,
} from '../../engine/wars';
import { sound } from '../sound';

interface WarfareModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  playerId: string;
  onDeclareWar: (targetPlayerId: string, warGoal: WarGoalType) => void;
  onOfferPeace: (warId: string, proposalType: 'surrender' | 'status_quo' | 'white_peace') => void;
  onSetSubjectTerms: (subjectId: string, subjectType: SubjectType, titheRate: number) => void;
  onReleaseSubject: (subjectId: string) => void;
  onIntegrateSubject: (subjectId: string) => void;
  onSelectSystem?: (systemId: string) => void;
}

export const WarfareModal: React.FC<WarfareModalProps> = ({
  isOpen,
  onClose,
  state,
  playerId,
  onDeclareWar,
  onOfferPeace,
  onSetSubjectTerms,
  onReleaseSubject,
  onIntegrateSubject,
}) => {
  const [activeTab, setActiveTab] = useState<'active_wars' | 'declare_war' | 'subjects'>('active_wars');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedWarGoal, setSelectedWarGoal] = useState<WarGoalType>('conquest');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editTitheRate, setEditTitheRate] = useState<number>(0.15);
  const [editSubjectType, setEditSubjectType] = useState<SubjectType>('vassal');

  if (!isOpen) return null;

  const player = state.players[playerId];
  const activeWars = getActiveWarsForPlayer(state, playerId);
  const mySubjects = getPlayerSubjects(state, playerId);
  const myOverlordAgreement = getSubjectAgreement(state, playerId);
  const myOverlord = myOverlordAgreement ? state.players[myOverlordAgreement.overlordId] : null;

  // Potential targets for war declaration
  const warCandidates = Object.values(state.players).filter(
    (p) =>
      p.id !== playerId &&
      !p.vacationMode &&
      !(player?.allianceId && p.allianceId && player.allianceId === p.allianceId)
  );

  // Player's total military strength estimate
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  let myFighters = 0;
  let myBattleships = 0;
  for (const p of myPlanets) {
    myFighters += p.garrison.fighter || 0;
    myBattleships += p.garrison.battleship || 0;
  }
  for (const f of Object.values(state.fleets)) {
    if (f.ownerId === playerId && f.status !== 'destroyed') {
      myFighters += f.ships.fighter || 0;
      myBattleships += f.ships.battleship || 0;
    }
  }
  const myMilitaryPower = myFighters * 10 + myBattleships * 35;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[86vh] stellaris-panel-glass flex flex-col overflow-hidden rounded-xl border border-slate-700/60 shadow-2xl bg-[#09111e]/95">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-red-950/40 via-slate-900/60 to-slate-900/40">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2 rounded-lg bg-red-900/30 border border-red-500/40 text-red-400">
              ⚔️
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                  Galaktik Savaş & Vasallık Karargahı
                </h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono border border-red-500/40 bg-red-950/40 text-red-300">
                  FAZ 21
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Casus Belli Savaş Hedefleri, Savaş Yorgunluğu (War Exhaustion), Barış Müzakereleri & Bağımlı Devletler
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {activeWars.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded bg-red-950/50 border border-red-600/50 text-red-300 text-xs font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>{activeWars.length} AKTİF SAVAŞ CEPHE'Sİ</span>
              </div>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('active_wars');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'active_wars'
                ? 'bg-slate-900 border-t-2 border-red-500 text-red-300 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>⚔️ Aktif Savaşlar & Cepheler</span>
            {activeWars.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-mono">
                {activeWars.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('declare_war');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'declare_war'
                ? 'bg-slate-900 border-t-2 border-amber-500 text-amber-300 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>🚩 Casus Belli & Savaş İlanı</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('subjects');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'subjects'
                ? 'bg-slate-900 border-t-2 border-cyan-500 text-cyan-300 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>👑 Vasallar & Bağımlı Devletler</span>
            {mySubjects.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-600 text-white font-mono">
                {mySubjects.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ACTIVE WARS */}
          {activeTab === 'active_wars' && (
            <div className="space-y-6">
              {activeWars.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30">
                  <div className="text-5xl mb-3">🕊️</div>
                  <h3 className="text-base font-bold text-slate-200 uppercase tracking-wide">
                    Galakside Barış Hâkim
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    İmparatorluğunuzun dâhil olduğu aktif bir savaş cephesi bulunmuyor. Yeni bir hak iddiası veya sınır güvenliği için Casus Belli sekmesinden savaş ilan edebilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('declare_war');
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    🚩 Savaş İlanı Planla
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {activeWars.map((war) => {
                    const isAttacker = war.attackerId === playerId;
                    const attackerPlayer = state.players[war.attackerId];
                    const defenderPlayer = state.players[war.defenderId];
                    const myExhaustion = isAttacker ? war.attackerExhaustion : war.defenderExhaustion;
                    const enemyExhaustion = isAttacker ? war.defenderExhaustion : war.attackerExhaustion;
                    const warGoalCfg = WAR_GOAL_CONFIGS[war.attackerWarGoal];

                    return (
                      <div
                        key={war.id}
                        className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-950/20 to-slate-900/60 p-5 shadow-lg relative overflow-hidden"
                      >
                        {/* Status ribbon */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{warGoalCfg.icon}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                                  {war.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-600/50">
                                  {warGoalCfg.nameTr}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Hedef: {warGoalCfg.descriptionTr}
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono text-xs">
                            <div className="text-slate-400">Savaş Süresi</div>
                            <div className="text-slate-200 font-bold">
                              {Math.floor((state.timeMs - war.declaredAtMs) / 60000)} dk aktif
                            </div>
                          </div>
                        </div>

                        {/* Dual War Exhaustion Progress */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                          {/* My Empire Exhaustion */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-cyan-300">
                                {isAttacker ? attackerPlayer?.name : defenderPlayer?.name} (Bizim Cephe)
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                %{Math.round(myExhaustion)}
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  myExhaustion > 80
                                    ? 'bg-rose-500'
                                    : myExhaustion > 50
                                    ? 'bg-amber-500'
                                    : 'bg-cyan-500'
                                }`}
                                style={{ width: `${Math.min(100, myExhaustion)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>Kazanılan Muharebe: {isAttacker ? war.battlesWonByAttacker : war.battlesWonByDefender}</span>
                              <span>İşgal Skoru: %{Math.round(isAttacker ? war.attackerOccupation : war.defenderOccupation)}</span>
                            </div>
                          </div>

                          {/* Enemy Empire Exhaustion */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-rose-300">
                                {isAttacker ? defenderPlayer?.name : attackerPlayer?.name} (Düşman Cephe)
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                %{Math.round(enemyExhaustion)}
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  enemyExhaustion > 80
                                    ? 'bg-rose-600'
                                    : enemyExhaustion > 50
                                    ? 'bg-amber-600'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, enemyExhaustion)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>Düşman Muharebe: {isAttacker ? war.battlesWonByDefender : war.battlesWonByAttacker}</span>
                              <span>Düşman İşgali: %{Math.round(isAttacker ? war.defenderOccupation : war.attackerOccupation)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Peace Negotiations Section */}
                        <div className="pt-2 border-t border-slate-800">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Barış Antlaşması Teklifleri (Peace Proposals)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Status Quo */}
                            <div className="p-3 rounded-lg border border-slate-700/60 bg-slate-900/60 flex flex-col justify-between">
                              <div>
                                <div className="text-xs font-bold text-slate-200">Status Quo Barışı</div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Mevcut işgal sınırları korunur, askeri temas hattı dondurulur ve 10 dakikalık saldırmazlık ateşkesi yürürlüğe girer.
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onOfferPeace(war.id, 'status_quo');
                                }}
                                className="mt-3 w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition-colors"
                              >
                                Status Quo Teklif Et
                              </button>
                            </div>

                            {/* White Peace */}
                            <div className="p-3 rounded-lg border border-slate-700/60 bg-slate-900/60 flex flex-col justify-between">
                              <div>
                                <div className="text-xs font-bold text-slate-200">Beyaz Barış (Status Quo Ante)</div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Tüm koloniler ve sınırlar savaş öncesi durumuna iade edilir. Toprak veya vasallık devri gerçekleşmez.
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onOfferPeace(war.id, 'white_peace');
                                }}
                                className="mt-3 w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition-colors"
                              >
                                Beyaz Barış Teklif Et
                              </button>
                            </div>

                            {/* Surrender / Enforce War Goal */}
                            <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/30 flex flex-col justify-between">
                              <div>
                                <div className="text-xs font-bold text-red-300">Teslimiyet / Zafer Talebi</div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {warGoalCfg.surrenderEffectTr}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onOfferPeace(war.id, 'surrender');
                                }}
                                className="mt-3 w-full py-1.5 px-2 rounded bg-red-900 hover:bg-red-800 border border-red-500 text-xs font-bold text-white transition-colors"
                              >
                                Teslim Ol / Barışı Dayat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DECLARE WAR & CASUS BELLI */}
          {activeTab === 'declare_war' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Target Selection */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <span>1. Hedef İmparatorluğu Seç</span>
                    <span className="text-slate-500">({warCandidates.length} aday)</span>
                  </h3>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {warCandidates.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Savaş açılabilecek bağımsız bir rakip imparatorluk bulunmuyor.
                      </div>
                    ) : (
                      warCandidates.map((cand) => {
                        const isSelected = selectedTargetId === cand.id;
                        const candPlanets = Object.values(state.planets).filter((p) => p.ownerId === cand.id);

                        return (
                          <div
                            key={cand.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedTargetId(cand.id);
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-red-950/40 border-red-500 shadow-md'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span
                                className="w-3 h-3 rounded-full shadow"
                                style={{ backgroundColor: cand.color }}
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-200">{cand.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {candPlanets.length} Gezegen / Koloni {cand.botArchetype ? `• ${cand.botArchetype}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono text-[10px]">
                              {cand.overlordId ? (
                                <span className="text-cyan-400">Bağımlı Vasal</span>
                              ) : (
                                <span className="text-slate-400">Egemen Devlet</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Casus Belli Selection */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Savaş Hedefi (Casus Belli) Belirle
                  </h3>
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {(Object.keys(WAR_GOAL_CONFIGS) as WarGoalType[]).map((goalKey) => {
                      const cfg = WAR_GOAL_CONFIGS[goalKey];
                      const isSelected = selectedWarGoal === goalKey;

                      return (
                        <div
                          key={goalKey}
                          onClick={() => {
                            sound.playClick();
                            setSelectedWarGoal(goalKey);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500 shadow-md'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{cfg.icon}</span>
                            <span className="text-xs font-bold text-slate-100">{cfg.nameTr}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{cfg.descriptionTr}</p>
                          <div className="mt-2 text-[10px] text-amber-300/80 font-mono bg-amber-950/30 p-1.5 rounded border border-amber-800/40">
                            Zafer Sonucu: {cfg.surrenderEffectTr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/70 to-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Savaş İlanına Hazır mısınız?
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Seçili Hedef: {state.players[selectedTargetId]?.name || 'Henüz seçilmedi'} • Hedef:{' '}
                    {WAR_GOAL_CONFIGS[selectedWarGoal].nameTr}
                  </div>
                </div>

                <button
                  disabled={!selectedTargetId}
                  onClick={() => {
                    if (selectedTargetId) {
                      sound.playLaunch();
                      onDeclareWar(selectedTargetId, selectedWarGoal);
                      setActiveTab('active_wars');
                    }
                  }}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                    selectedTargetId
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>⚔️ Resmi Savaş İlan Et</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SUBJECTS & VASSALS */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              {/* Overlord Status Banner if Player is a Subject */}
              {myOverlord && myOverlordAgreement && (
                <div className="p-4 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🛡️</span>
                    <div>
                      <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wide">
                        İmparatorluğunuz Bağımlı Devlet Statüsündedir
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Efendi: <strong className="text-white">{myOverlord.name}</strong> • Statü:{' '}
                        <strong className="text-cyan-300 font-mono">
                          {SUBJECT_TYPE_CONFIGS[myOverlordAgreement.type].nameTr}
                        </strong>{' '}
                        • Haraç Oranı: %{Math.round(myOverlordAgreement.titheRate * 100)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onDeclareWar(myOverlord.id, 'liberation');
                      setActiveTab('active_wars');
                    }}
                    className="px-4 py-2 rounded-lg bg-red-900 hover:bg-red-800 border border-red-500 text-xs font-bold text-white uppercase tracking-wider transition-colors"
                  >
                    🕊️ Bağımsızlık Savaşı Başlat
                  </button>
                </div>
              )}

              {/* My Subjects List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    İmparatorluğunuza Bağlı Devletler & Vasallar ({mySubjects.length})
                  </h3>
                </div>

                {mySubjects.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30">
                    <div className="text-5xl mb-3">👑</div>
                    <h3 className="text-base font-bold text-slate-200 uppercase tracking-wide">
                      Bağımlı Devlet Bulunmuyor
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Henüz boyunduruğunuz altında bir vasal veya haraçgüzar bulunmuyor. Askeri üstünlük kurduğunuz rakiplere "Vasal Yapma" veya "Haraç Kesme" savaş hedefiyle zafer kazanarak vasal edinebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mySubjects.map((ag) => {
                      const subjectPlayer = state.players[ag.subjectId];
                      const typeCfg = SUBJECT_TYPE_CONFIGS[ag.type];
                      const isEditing = editingSubjectId === ag.subjectId;

                      return (
                        <div
                          key={ag.subjectId}
                          className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/60 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{typeCfg.icon}</span>
                              <div>
                                <h4 className="text-xs font-bold text-white tracking-wide">
                                  {subjectPlayer?.name || ag.subjectId}
                                </h4>
                                <span className="text-[10px] font-mono text-cyan-300">
                                  {typeCfg.nameTr}
                                </span>
                              </div>
                            </div>

                            <div className="text-right text-[10px] font-mono text-slate-400">
                              <span>Sadakat: </span>
                              <strong className={ag.loyalty >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                                {ag.loyalty}/100
                              </strong>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Haraç Oranı:</span>
                              <span className="font-mono font-bold text-cyan-400">
                                %{Math.round(ag.titheRate * 100)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Fayda: {typeCfg.benefitsTr}
                            </div>
                          </div>

                          {ag.integrationProgress !== undefined && (
                            <div className="space-y-1 p-2 bg-slate-950/60 rounded border border-cyan-800/40">
                              <div className="flex justify-between text-[10px] font-mono text-cyan-300">
                                <span>İlhak & Entegrasyon İlerlemesi:</span>
                                <span>%{Math.round(ag.integrationProgress)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400 rounded-full transition-all"
                                  style={{ width: `${ag.integrationProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Subject Actions */}
                          {isEditing ? (
                            <div className="pt-2 border-t border-slate-800 space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 block font-bold">
                                  Sözleşme Tipini Değiştir:
                                </label>
                                <select
                                  value={editSubjectType}
                                  onChange={(e) => setEditSubjectType(e.target.value as SubjectType)}
                                  className="w-full p-1.5 rounded bg-slate-800 text-xs text-slate-200 border border-slate-700"
                                >
                                  <option value="vassal">Askeri Vasal (Vassal)</option>
                                  <option value="tributary">Haraçgüzar (Tributary)</option>
                                  <option value="scholarium">Bilim Uydusu (Scholarium)</option>
                                  <option value="bulwark">Siper Karargahı (Bulwark)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 block font-bold">
                                  Haraç Oranı (%):
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="40"
                                  step="5"
                                  value={Math.round(editTitheRate * 100)}
                                  onChange={(e) => setEditTitheRate(Number(e.target.value) / 100)}
                                  className="w-full"
                                />
                                <div className="text-right text-[10px] font-mono text-cyan-300">
                                  %{Math.round(editTitheRate * 100)}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    onSetSubjectTerms(ag.subjectId, editSubjectType, editTitheRate);
                                    setEditingSubjectId(null);
                                  }}
                                  className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
                                >
                                  Kaydet
                                </button>
                                <button
                                  onClick={() => setEditingSubjectId(null)}
                                  className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-400"
                                >
                                  İptal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setEditingSubjectId(ag.subjectId);
                                  setEditSubjectType(ag.type);
                                  setEditTitheRate(ag.titheRate);
                                }}
                                className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-colors"
                              >
                                Sözleşmeyi Düzenle
                              </button>

                              {ag.type === 'vassal' && ag.integrationProgress === undefined && (
                                <button
                                  onClick={() => {
                                    sound.playTech();
                                    onIntegrateSubject(ag.subjectId);
                                  }}
                                  className="flex-1 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800/80 text-[11px] font-bold text-cyan-200 border border-cyan-600/40 transition-colors"
                                >
                                  İlhakı Başlat
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onReleaseSubject(ag.subjectId);
                                }}
                                className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-[11px] text-red-300 border border-red-700/40 transition-colors"
                              >
                                Özgür Bırak
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
