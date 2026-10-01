import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle,
  Crown,
  Eye,
  Flame,
  Globe,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  COUNCIL_CONSTANTS,
  COUNCIL_POSITION_INFO,
  getCouncilEmpireBonuses,
  LEADER_TRAIT_CONFIGS,
} from '../../engine/council';
import {
  CouncilLeader,
  CouncilPosition,
  FactionType,
  GameState,
  ImperialCouncilState,
} from '../../engine/types';
import { sound } from '../sound';

interface CouncilModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onAppointCouncilor: (leaderId: string, position: CouncilPosition) => void;
  onDismissCouncilor: (position: CouncilPosition) => void;
  onRecruitCouncilLeader: (candidateId: string, planetId: string) => void;
  onPromoteFactionAgenda: (factionType: FactionType, agendaId: string, planetId: string) => void;
}

export const CouncilModal: React.FC<CouncilModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  onClose,
  onAppointCouncilor,
  onDismissCouncilor,
  onRecruitCouncilLeader,
  onPromoteFactionAgenda,
}) => {
  const [activeTab, setActiveTab] = useState<'council' | 'factions'>('council');
  const [appointModalTarget, setAppointModalTarget] = useState<CouncilPosition | null>(null);

  if (!isOpen) return null;

  const council: ImperialCouncilState | undefined =
    state.councils?.[activePlayerId] || (state as any).myCouncil;
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const fundingPlanet = myPlanets.find((p) => p.isHomeworld) || myPlanets[0];
  const bonuses = getCouncilEmpireBonuses(state, activePlayerId);

  // If council isn't present, render placeholder
  if (!council) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="p-6 bg-slate-900 border border-cyan-500/40 rounded-xl text-center text-slate-200">
          <p>Konsey verilerine erişilemedi.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-1.5 rounded bg-cyan-600 text-white font-mono text-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  const ruler = council.positions.ruler ? council.leaders[council.positions.ruler] : null;

  // Unassigned reserve leaders
  const reserveLeaders = Object.values(council.leaders).filter(
    (l) => l.assignedPosition === null
  );

  const ministerPositions: CouncilPosition[] = [
    'defense_minister',
    'science_director',
    'industry_minister',
    'spymaster',
  ];

  const getPositionIcon = (pos: CouncilPosition) => {
    switch (pos) {
      case 'ruler':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'defense_minister':
        return <Shield className="w-5 h-5 text-rose-400" />;
      case 'science_director':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'industry_minister':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'spymaster':
        return <Eye className="w-5 h-5 text-purple-400" />;
    }
  };

  const getStabilityColor = (val: number) => {
    if (val >= 70) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (val >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-lg bg-cyan-950/40 border-cyan-500/30 text-cyan-400">
              <Crown className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-cyan-300 uppercase font-mono flex items-center gap-2">
                HÜKÜMET KONSEYİ & İMPARATORLUK FRAKSİYONLARI
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  FAZ 14
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kabine bakanları, lider yetenekleri, halk memnuniyeti ve iç siyasi istikrar dengesi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stability Gauge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${getStabilityColor(
                bonuses.stabilityPercent
              )}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>İSTİKRAR: %{bonuses.stabilityPercent}</span>
              <span className="text-[10px] opacity-80">
                ({bonuses.stabilityMultiplier >= 1.0 ? '+' : ''}
                {Math.round((bonuses.stabilityMultiplier - 1.0) * 100)}% Verim)
              </span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-cyan-500/10 bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('council');
              }}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition flex items-center gap-2 ${
                activeTab === 'council'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Hükümet Konseyi & Liderler
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('factions');
              }}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition flex items-center gap-2 ${
                activeTab === 'factions'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              İç Fraksiyonlar & İstikrar
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
            <span>
              Hazine: <strong className="text-amber-300">{fundingPlanet?.resources.ore || 0}</strong> M /{' '}
              <strong className="text-cyan-300">{fundingPlanet?.resources.crystal || 0}</strong> K
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'council' ? (
            <>
              {/* Top: Ruler Throne Card */}
              {ruler && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-950/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
                      {ruler.avatar || '👑'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                          {COUNCIL_POSITION_INFO.ruler.nameTr}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Seviye {ruler.level} / {COUNCIL_CONSTANTS.MAX_LEADER_LEVEL}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-100 mt-0.5">{ruler.name}</h3>
                      <p className="text-xs text-amber-200/80 font-mono">
                        Yetenek: <strong>{ruler.trait.nameTr}</strong> — {ruler.trait.descriptionTr}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-64">
                    <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Tecrübe (XP)</span>
                      <span className="text-amber-400 font-bold">
                        {ruler.xp} / {ruler.nextLevelXp}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300"
                        style={{
                          width: `${Math.min(100, Math.round((ruler.xp / ruler.nextLevelXp) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Bonus: +%{ruler.level * 2} Tüm Üretim, +{ruler.level * 5} Haftalık Hegemonya
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Minister Seats Grid */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  İmparatorluk Bakanlıkları (4 Makam)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ministerPositions.map((pos) => {
                    const info = COUNCIL_POSITION_INFO[pos];
                    const leaderId = council.positions[pos];
                    const leader = leaderId ? council.leaders[leaderId] : null;

                    return (
                      <div
                        key={pos}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                          leader
                            ? 'bg-slate-900/70 border-cyan-500/30 hover:border-cyan-500/60'
                            : 'bg-slate-950/60 border-dashed border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                              {leader ? leader.avatar : info.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                                  {info.nameTr}
                                </span>
                                {leader && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                                    Seviye {leader.level}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-200">
                                {leader ? leader.name : 'Makam Boş'}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {leader ? leader.trait.descriptionTr : info.roleDescTr}
                              </p>
                            </div>
                          </div>

                          {leader ? (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onDismissCouncilor(pos);
                              }}
                              title="Bakanı görevden al ve rezerve çek"
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded border border-transparent hover:border-rose-500/30 transition text-xs flex items-center gap-1"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                sound.playClick();
                                setAppointModalTarget(pos);
                              }}
                              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded bg-cyan-600/30 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 transition flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Lider Ata
                            </button>
                          )}
                        </div>

                        {/* XP bar or Position bonus if appointed */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                          {leader ? (
                            <>
                              <div className="flex items-center gap-2 text-slate-400">
                                <span>XP:</span>
                                <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-400"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round((leader.xp / leader.nextLevelXp) * 100)
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px]">
                                  {leader.xp}/{leader.nextLevelXp}
                                </span>
                              </div>
                              <span className="text-emerald-400 text-[11px] font-bold">
                                {leader.trait.nameTr}
                              </span>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              Etki:{' '}
                              <span className="text-slate-400">{info.primaryBonusDescTr}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recruitment Candidates Pool */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Aday Liderler & İşe Alım Havuzu
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    Alım Maliyeti: {COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.ore} Cevher /{' '}
                    {COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.crystal} Kristal /{' '}
                    {COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.fuel} Yakıt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {council.recruitCandidates.map((cand) => {
                    const canAfford =
                      (fundingPlanet?.resources.ore || 0) >= COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.ore &&
                      (fundingPlanet?.resources.crystal || 0) >=
                        COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.crystal &&
                      (fundingPlanet?.resources.fuel || 0) >=
                        COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.fuel;

                    return (
                      <div
                        key={cand.id}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                            {cand.avatar}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{cand.name}</div>
                            <div className="text-[10px] font-mono text-emerald-400">
                              {cand.trait.nameTr} (Seviye {cand.level})
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {cand.trait.descriptionTr}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            if (!fundingPlanet) return;
                            sound.playClick();
                            onRecruitCouncilLeader(cand.id, fundingPlanet.id);
                          }}
                          className={`w-full py-1.5 px-3 rounded text-xs font-mono uppercase tracking-wider transition ${
                            canAfford
                              ? 'bg-emerald-600/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Konseye Al' : 'Yetersiz Kaynak'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Internal Factions & Stability */
            <div className="space-y-6">
              {/* Stability Overview Banner */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border ${getStabilityColor(
                      bonuses.stabilityPercent
                    )}`}
                  >
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      İmparatorluk Halk İstikrarı: %{bonuses.stabilityPercent}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl mt-1">
                      İstikrar, 4 ana fraksiyonun memnuniyet oranlarının nüfus paylarıyla ağırlıklı
                      ortalaması ve Hükümdar liderliği ile belirlenir.{' '}
                      <strong className="text-emerald-300">&gt;%70</strong> refah üretimi artışı,{' '}
                      <strong className="text-rose-400">&lt;%40</strong> ise genel grev verim
                      düşüşüne yol açar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">TÜM VERİM ÇARPANI</div>
                    <div className="text-lg font-bold text-cyan-300">
                      x{bonuses.resourceProductionMultiplier.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Factions List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['militarists', 'technocrats', 'merchants', 'expansionists'] as FactionType[]).map(
                  (fKey) => {
                    const faction = council.factions[fKey];
                    if (!faction) return null;

                    const approvalColor =
                      faction.approvalRating >= 60
                        ? 'text-emerald-400'
                        : faction.approvalRating >= 40
                        ? 'text-amber-400'
                        : 'text-rose-400';

                    return (
                      <div
                        key={fKey}
                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between gap-3"
                      >
                        {/* Faction Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{faction.icon}</span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{faction.nameTr}</h4>
                              <span className="text-[11px] font-mono text-slate-400">
                                Nüfus Payı: %{faction.populationSharePercent}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-base font-bold font-mono ${approvalColor}`}>
                              %{faction.approvalRating}
                            </div>
                            <span className="text-[10px] font-mono uppercase text-slate-500">
                              {faction.approvalRating >= 60
                                ? 'Memnun'
                                : faction.approvalRating >= 40
                                ? 'Durgun'
                                : 'Huzursuz'}
                            </span>
                          </div>
                        </div>

                        {/* Approval Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                          <div
                            className={`h-full transition-all duration-300 ${
                              faction.approvalRating >= 60
                                ? 'bg-emerald-400'
                                : faction.approvalRating >= 40
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${faction.approvalRating}%` }}
                          />
                        </div>

                        {/* Agendas List */}
                        <div className="space-y-2 mt-2">
                          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                            Siyasi Talepler & Gündemler:
                          </div>

                          {faction.agendas.map((agenda) => {
                            const canAfford =
                              (fundingPlanet?.resources.ore || 0) >=
                                COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.ore &&
                              (fundingPlanet?.resources.crystal || 0) >=
                                COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.crystal &&
                              (fundingPlanet?.resources.fuel || 0) >=
                                COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.fuel;

                            return (
                              <div
                                key={agenda.id}
                                className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    {agenda.fulfilled ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                    {agenda.titleTr}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {agenda.descriptionTr}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {agenda.fulfilled ? (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                                      +%{agenda.approvalImpact}
                                    </span>
                                  ) : (
                                    <button
                                      disabled={!canAfford}
                                      onClick={() => {
                                        if (!fundingPlanet) return;
                                        sound.playClick();
                                        onPromoteFactionAgenda(
                                          fKey,
                                          agenda.id,
                                          fundingPlanet.id
                                        );
                                      }}
                                      title={`Destek Maliyeti: ${COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.ore}C, ${COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.crystal}K, ${COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.fuel}Y`}
                                      className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition ${
                                        canAfford
                                          ? 'bg-amber-600/30 hover:bg-amber-500/40 text-amber-200 border border-amber-500/40'
                                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                      }`}
                                    >
                                      Destekle (+%25)
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Selection Popup */}
      {appointModalTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-5 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-cyan-300 uppercase font-mono">
                {COUNCIL_POSITION_INFO[appointModalTarget].nameTr} İçin Lider Ata
              </h3>
              <button
                onClick={() => setAppointModalTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-72 overflow-y-auto">
              {reserveLeaders.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">
                  Rezerve lider bulunmuyor. Yeni bir lider işe alabilirsiniz.
                </div>
              ) : (
                reserveLeaders.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      sound.playClick();
                      onAppointCouncilor(lead.id, appointModalTarget);
                      setAppointModalTarget(null);
                    }}
                    className="p-3 rounded-lg border border-slate-800 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-cyan-950/30 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                        {lead.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{lead.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {lead.trait.nameTr} (Seviye {lead.level})
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 uppercase font-bold">
                      Ata &rarr;
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setAppointModalTarget(null)}
              className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
