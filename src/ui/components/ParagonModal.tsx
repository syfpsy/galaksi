import React, { useState } from 'react';
import {
  Award,
  Crown,
  Shield,
  Zap,
  Ship,
  Sparkles,
  Users,
  Compass,
  Coins,
  ChevronRight,
  X,
  Crosshair,
  TrendingUp,
  Anchor,
  Flame,
  UserCheck,
  UserX,
  Building,
  Radio,
  Layers,
  AlertCircle,
  Gem,
} from 'lucide-react';
import { GameState, ParagonClass, ParagonLeader } from '../../engine/types';
import { sound } from '../sound';
import {
  PARAGON_CONSTANTS,
  canRecruitParagon,
  getPlayerParagonBonuses,
} from '../../engine/paragons';

export interface ParagonModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onRecruitParagon?: (paragonId: string) => void;
  onAssignParagon?: (
    paragonId: string,
    assignment: { type: 'fleet' | 'planet' | 'council'; targetId: string }
  ) => void;
  onUnassignParagon?: (paragonId: string) => void;
  onDismissParagon?: (paragonId: string) => void;
  onCommissionFlagship?: (paragonId: string, planetId: string) => void;
}

export const ParagonModal: React.FC<ParagonModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onRecruitParagon,
  onAssignParagon,
  onUnassignParagon,
  onDismissParagon,
  onCommissionFlagship,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const renown = Math.round(player?.renown || 0);
  const myParagonIds = player?.paragonIds || [];
  const poolIds = state.galacticParagonPool || [];
  const paragons = state.paragons || {};

  const myParagons = myParagonIds
    .map((id) => paragons[id])
    .filter((p): p is ParagonLeader => Boolean(p));

  const availableParagons = poolIds
    .map((id) => paragons[id])
    .filter((p): p is ParagonLeader => Boolean(p && p.ownerId === null));

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  const playerFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId);

  const [activeTab, setActiveTab] = useState<'pool' | 'active' | 'flagships' | 'destiny'>('pool');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(
    myParagons[0]?.id || availableParagons[0]?.id || ''
  );
  const [selectedShipyardPlanetId, setSelectedShipyardPlanetId] = useState<string>(primaryPlanet?.id || '');

  const empireBonuses = getPlayerParagonBonuses(state, activePlayerId);

  const getClassIcon = (pClass: ParagonClass) => {
    switch (pClass) {
      case 'military':
        return <Crosshair className="w-4 h-4 text-rose-400" />;
      case 'scientific':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'economic':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'diplomatic':
        return <Shield className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getClassBadge = (pClass: ParagonClass) => {
    switch (pClass) {
      case 'military':
        return 'bg-rose-950/60 text-rose-300 border-rose-600/40';
      case 'scientific':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40';
      case 'economic':
        return 'bg-amber-950/60 text-amber-300 border-amber-600/40';
      case 'diplomatic':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40';
    }
  };

  const getTierBadge = (tier: 'renowned' | 'legendary') => {
    if (tier === 'legendary') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-950/70 border border-purple-500/50 text-purple-300 shadow-sm shadow-purple-500/20">
          <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" /> Efsanevi (Tier 2)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-950/60 border border-amber-500/40 text-amber-300">
        <Award className="w-3 h-3 text-amber-400" /> Şanlı (Tier 1)
      </span>
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div className="stellaris-outliner bg-slate-950/95 border border-amber-500/40 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-amber-950/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide text-amber-100 uppercase font-mono">
                  Galaktik Paragon Önderler & Konsey Mirası
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  FAZ 27
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Efsanevi şahsiyetler, kader nitelikleri ve amiral sancak filoları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Renown indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-amber-500/40 shadow-inner">
              <Award className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
                  Şan & İtibar (Renown)
                </span>
                <span className="text-sm font-bold text-amber-200 font-mono">
                  {renown} <span className="text-[10px] text-slate-400 font-normal">+{PARAGON_CONSTANTS.BASE_RENOWN_GAIN_PER_HOUR}/saat</span>
                </span>
              </div>
            </div>

            {/* Leader Capacity */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
              <Users className="w-4 h-4 text-sky-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Lider Kapasitesi
                </span>
                <span className="text-sm font-bold text-sky-200 font-mono">
                  {myParagons.length} / {PARAGON_CONSTANTS.MAX_RECRUITED_PARAGONS_PER_PLAYER}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/80 px-6 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('pool');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'pool'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            Galaktik Aday Havuzu ({availableParagons.length})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('active');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'active'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Crown className="w-4 h-4" />
            Aktif Önderler & Görevlendirme ({myParagons.length})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('flagships');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'flagships'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Ship className="w-4 h-4" />
            Efsanevi Sancak Gemileri
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('destiny');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'destiny'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Kader Nitelikleri & Miras
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RECRUITMENT POOL */}
          {activeTab === 'pool' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-amber-200">
                    Galaksinin En Güçlü Şahsiyetleri Hizmetinize Hazır
                  </p>
                  <p className="text-slate-400">
                    Her Paragon, imparatorluğunuzun kaderini değiştirecek emsalsiz bir{' '}
                    <span className="text-amber-300">Kader Niteliğine (Destiny Trait)</span> ve özel muharebe
                    veya idari kabiliyetlere sahiptir. Bir lider istihdam edildiğinde galaktik havuzdan çıkar.
                  </p>
                </div>
              </div>

              {availableParagons.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-slate-400">
                  <UserX className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Galaktik Havuz Boş</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Şu anda galakside kiralanabilecek boşta Paragon lideri bulunmamaktadır.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableParagons.map((p) => {
                    const recruitCheck = canRecruitParagon(state, activePlayerId, p.id);
                    const canAfford = recruitCheck.success;

                    return (
                      <div
                        key={p.id}
                        className="stellaris-item-card bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 p-5 rounded-xl flex flex-col justify-between transition-all duration-200 shadow-lg relative group"
                      >
                        <div className="space-y-4">
                          {/* Header info */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                                  {p.name}
                                </h3>
                                {getTierBadge(p.tier)}
                              </div>
                              <p className="text-xs text-amber-400/90 font-mono mt-0.5">{p.titleTr}</p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${getClassBadge(
                                p.class
                              )}`}
                            >
                              {getClassIcon(p.class)}
                              {p.class === 'military'
                                ? 'Askeri'
                                : p.class === 'scientific'
                                ? 'Bilimsel'
                                : p.class === 'economic'
                                ? 'Ekonomik'
                                : 'Diplomatik'}
                            </span>
                          </div>

                          {/* Biography / Lore */}
                          <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">
                            "{p.biographyTr}"
                          </p>

                          {/* Destiny Trait Card */}
                          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1 shadow-inner">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Kader Niteliği: {p.destinyTraitNameTr}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {p.destinyTraitDescriptionTr}
                            </p>
                          </div>

                          {/* Flagship Notice if military */}
                          {p.flagship && (
                            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-600/30 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Ship className="w-4 h-4 text-rose-400" />
                                <div>
                                  <span className="text-rose-200 font-semibold">{p.flagship.name}</span>
                                  <span className="text-[10px] text-rose-400/80 ml-2 font-mono">
                                    (Özel Sancak Gemisi)
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                +%{Math.round((p.flagship.attackMultiplier - 1) * 100)} Saldırı
                              </span>
                            </div>
                          )}

                          {/* Cost details */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                <span>{p.renownCost} Renown</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                <span>{p.recruitmentCost.ore} Cev</span> ·{' '}
                                <span>{p.recruitmentCost.crystal} Kri</span> ·{' '}
                                <span>{p.recruitmentCost.fuel} Yak</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-4 mt-2">
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              sound.playLaunch();
                              onRecruitParagon?.(p.id);
                            }}
                            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                              canAfford
                                ? 'stellaris-btn-metallic bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-600/30 cursor-pointer'
                                : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            {canAfford ? 'İmparatorluğa Kat' : recruitCheck.error || 'Yetersiz Kaynak'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE PARAGONS & ASSIGNMENT */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              {myParagons.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-slate-400">
                  <Crown className="w-14 h-14 mx-auto text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-slate-200">
                    Henüz İstihdam Edilmiş Bir Paragon Bulunmuyor
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Galaktik Aday Havuzu sekmesinden Şan & İtibarınızı kullanarak efsanevi liderleri
                    imparatorluğunuza kazandırabilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('pool');
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition-all"
                  >
                    Aday Havuzuna Git
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myParagons.map((p) => {
                    const isAssigned = Boolean(p.assignedTo);
                    const xpPercent = Math.min(100, Math.round((p.xp / p.xpToNextLevel) * 100));

                    return (
                      <div
                        key={p.id}
                        className="stellaris-item-card bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-800 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg font-bold font-mono">
                              {p.level}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
                                {getTierBadge(p.tier)}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-amber-400 font-mono">{p.titleTr}</span>
                                <span className="text-slate-600">·</span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase ${
                                    p.class === 'military'
                                      ? 'text-rose-400'
                                      : p.class === 'scientific'
                                      ? 'text-cyan-400'
                                      : p.class === 'economic'
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {getClassIcon(p.class)}
                                  {p.class}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* XP Bar */}
                          <div className="w-full sm:w-56 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>Seviye {p.level} (Maks 10)</span>
                              <span>
                                {Math.round(p.xp)} / {p.xpToNextLevel} XP
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                                style={{ width: `${xpPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Trait & Station Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>{p.destinyTraitNameTr}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{p.destinyTraitDescriptionTr}</p>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                              Mevcut İstasyon
                            </span>
                            {isAssigned ? (
                              <div className="flex items-center gap-2 mt-1">
                                {p.assignedTo?.type === 'fleet' && (
                                  <>
                                    <Ship className="w-4 h-4 text-rose-400" />
                                    <span className="text-slate-200 font-semibold">
                                      Filo Komutanı: {state.fleets[p.assignedTo.targetId]?.name || 'Filo'}
                                    </span>
                                  </>
                                )}
                                {p.assignedTo?.type === 'planet' && (
                                  <>
                                    <Building className="w-4 h-4 text-emerald-400" />
                                    <span className="text-slate-200 font-semibold">
                                      Koloni Valisi: {state.planets[p.assignedTo.targetId]?.name || 'Gezegen'}
                                    </span>
                                  </>
                                )}
                                {p.assignedTo?.type === 'council' && (
                                  <>
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    <span className="text-slate-200 font-semibold">
                                      İmparatorluk Konseyi Üyesi
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-400/90 font-semibold italic mt-1">
                                Boşta (Görev Bekliyor)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assignment Controls */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Assign to Fleet */}
                            {playerFleets.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    sound.playClick();
                                    onAssignParagon?.(p.id, { type: 'fleet', targetId: e.target.value });
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
                              >
                                <option value="" disabled>
                                  ⚓ Filoya Ata...
                                </option>
                                {playerFleets.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.paragonId ? 'Dolu' : 'Boş'})
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Assign to Planet */}
                            {playerPlanets.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    sound.playClick();
                                    onAssignParagon?.(p.id, { type: 'planet', targetId: e.target.value });
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
                              >
                                <option value="" disabled>
                                  🏛️ Gezegene Ata (Vali)...
                                </option>
                                {playerPlanets.map((planet) => (
                                  <option key={planet.id} value={planet.id}>
                                    {planet.name} ({planet.assignedParagonId ? 'Vali Var' : 'Boş'})
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Assign to Council */}
                            <button
                              onClick={() => {
                                sound.playClick();
                                onAssignParagon?.(p.id, { type: 'council', targetId: 'imperial_council' });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Crown className="w-3.5 h-3.5" /> Konseye Yerleştir
                            </button>

                            {/* Unassign */}
                            {isAssigned && (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onUnassignParagon?.(p.id);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Görevi Bırak
                              </button>
                            )}
                          </div>

                          {/* Dismiss Button */}
                          <button
                            onClick={() => {
                              sound.playClick();
                              onDismissParagon?.(p.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                            title="Lideri emekli eder ve %40 Şan puanını iade eder"
                          >
                            Emekli Et (+%{Math.round(PARAGON_CONSTANTS.DISMISS_RENOWN_REFUND_PERCENT * 100)} Renown)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEGENDARY FLAGSHIPS */}
          {activeTab === 'flagships' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
                <Ship className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-rose-200">
                    Askeri Paragonların Bespoke Sancak Gemileri & Taktik Muharebe Auraları
                  </p>
                  <p className="text-slate-400">
                    Sancak gemileri doğrudan bir donanmaya atandığında, tüm filoya devasa saldırı, savunma ve
                    hız auraları kazandırır. Yalnızca askeri sınıftaki efsanevi önderler sancak gemisi inşa
                    edebilir.
                  </p>
                </div>
              </div>

              {myParagons.filter((p) => p.flagship).length === 0 ? (
                <div className="text-center py-14 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-slate-400">
                  <Ship className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Askeri Paragon Bulunmuyor</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Sancak gemisi inşa etmek için askeri sınıf bir Paragon liderini (örn. Vaelen veya Orion)
                    istihdam etmelisiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myParagons
                    .filter((p) => p.flagship)
                    .map((p) => {
                      const flagship = p.flagship!;
                      const isCommissioned = flagship.isCommissioned;
                      const flagshipCost = PARAGON_CONSTANTS.FLAGSHIP_COMMISSION_COST;

                      const canAffordCommission =
                        primaryPlanet &&
                        primaryPlanet.resources.ore >= flagshipCost.ore &&
                        primaryPlanet.resources.crystal >= flagshipCost.crystal &&
                        primaryPlanet.resources.fuel >= flagshipCost.fuel;

                      return (
                        <div
                          key={p.id}
                          className="stellaris-item-card bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-rose-100">{flagship.name}</h3>
                                {isCommissioned ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                                    Hizmette
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                    İnşa Bekliyor
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Komutan: <span className="text-amber-300 font-semibold">{p.name}</span>
                              </p>
                            </div>
                            <Ship className="w-8 h-8 text-rose-400/80" />
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-mono uppercase block">Saldırı</span>
                              <span className="text-sm font-bold text-rose-400 font-mono">
                                +%{Math.round((flagship.attackMultiplier - 1) * 100)}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-mono uppercase block">Savunma</span>
                              <span className="text-sm font-bold text-sky-400 font-mono">
                                +%{Math.round((flagship.defenseMultiplier - 1) * 100)}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-mono uppercase block">Hız</span>
                              <span className="text-sm font-bold text-amber-400 font-mono">
                                +%{Math.round((flagship.speedMultiplier - 1) * 100)}
                              </span>
                            </div>
                          </div>

                          {/* Combat Aura */}
                          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-700/30 text-xs space-y-1">
                            <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                              <Radio className="w-3.5 h-3.5 text-rose-400" /> Taktik Muharebe Aurası
                            </span>
                            <p className="text-[11px] text-slate-300">{flagship.combatAura}</p>
                          </div>

                          {/* Commission Action or Station Status */}
                          <div className="pt-2 border-t border-slate-800">
                            {isCommissioned ? (
                              <div className="text-xs text-slate-400 flex items-center justify-between">
                                <span>Filo Entegrasyonu:</span>
                                <span className="font-semibold text-emerald-300 font-mono">
                                  {p.assignedTo?.type === 'fleet' ? 'Aktif Filoda Görevde' : 'Filo Ataması Bekliyor'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                                  <span>Maliyet:</span>
                                  <span>
                                    {flagshipCost.ore} Cev · {flagshipCost.crystal} Kri · {flagshipCost.fuel} Yak
                                  </span>
                                </div>
                                <button
                                  disabled={!canAffordCommission}
                                  onClick={() => {
                                    sound.playLaunch();
                                    onCommissionFlagship?.(p.id, selectedShipyardPlanetId || primaryPlanet?.id || '');
                                  }}
                                  className={`w-full py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                    canAffordCommission
                                      ? 'stellaris-btn-metallic bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white hover:brightness-110 shadow-lg shadow-rose-900/40 cursor-pointer'
                                      : 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed'
                                  }`}
                                >
                                  <Anchor className="w-4 h-4" />
                                  {canAffordCommission ? 'Sancak Gemisini İnşa Et' : 'Yetersiz Kaynak'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DESTINY TRAITS & HERITAGE */}
          {activeTab === 'destiny' && (
            <div className="space-y-6">
              {/* Active Empire Multipliers */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Aktif Paragonların İmparatorluk Genelindeki Toplam Katkısı
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Maden Üretimi</span>
                    <span className="text-base font-bold text-amber-300 font-mono">
                      +%{Math.round((empireBonuses.oreMultiplier - 1) * 100)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Araştırma Hızı</span>
                    <span className="text-base font-bold text-cyan-300 font-mono">
                      +%{Math.round((empireBonuses.researchMultiplier - 1) * 100)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Tersane Hızı</span>
                    <span className="text-base font-bold text-rose-300 font-mono">
                      +%{Math.round((empireBonuses.shipyardMultiplier - 1) * 100)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Diplomatik Ağırlık</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">
                      +%{Math.round((empireBonuses.diplomaticWeightMultiplier - 1) * 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gallery of all 6 Destiny Traits */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Galaktik Kader Nitelikleri Kataloğu
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <Crosshair className="w-4 h-4 text-rose-400" />
                      Yıldız Kıran Taktik Aurası
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Komuta ettiği armada ve amiral gemisine +%25 saldırı gücü ve +%20 kalkan/gövde direnci sağlar.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      Yıldızlar Mimarı & Kadim Kodlar
                    </div>
                    <p className="text-[11px] text-slate-300">
                      İmparatorluğun tüm araştırma laboratuvarlarına +%25 bilim hızı ve anomalilerden +%30 daha fazla veri sağlar.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Coins className="w-4 h-4 text-amber-400" />
                      Maden & Lojistik İmparatoru
                    </div>
                    <p className="text-[11px] text-slate-300">
                      İmparatorluk genelinde cevher ve kristal üretimine +%20 artış sağlar; görev yaptığı kolonide ise bu oran +%35'e çıkar.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Galaktik Arabulucu & Birlik Sesi
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Senato ve diplomaside +%30 diplomatik ağırlık, federasyon uyumuna +%25 artış ve imparatorluk istikrarına +10 puan kazandırır.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <Zap className="w-4 h-4 text-purple-400" />
                      Kuşatma Kıran & Kale Savunması
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Koloni savunmasına +%30 garnizon direnci, filolara -%15 hasar alma indirimi ve gezegen istikrarına +5 bonus verir.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold">
                      <Layers className="w-4 h-4 text-amber-400" />
                      Kara Filo & Hızlı Montaj
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tersanelerde gemi üretim hızına +%25 artış ve filoların sevk yakıt tüketimine -%20 tasarruf kazandırır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
