import React, { useState } from 'react';
import {
  Award,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  Shield,
  Sparkles,
  Swords,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  Admiral,
  ADMIRAL_TRAITS,
  generateCandidateAdmiral,
  loadSavedAdmirals,
  saveAdmirals,
} from '../../engine/admirals';
import { GameState, Planet } from '../../engine/types';
import { sound } from '../sound';

interface AdmiralsModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onAssignAdmiralToFleet?: (admiralId: string, fleetId: string | null) => void;
  onAssignAdmiralToPlanet?: (admiralId: string, planetId: string | null) => void;
}

const RECRUIT_COST = {
  crystal: 250,
  fuel: 100,
};

export const AdmiralsModal: React.FC<AdmiralsModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  isDocked = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'academy'>('roster');
  const [admirals, setAdmirals] = useState<Admiral[]>(() => loadSavedAdmirals());
  const [candidates, setCandidates] = useState<Admiral[]>([
    generateCandidateAdmiral(),
    generateCandidateAdmiral(),
    generateCandidateAdmiral(),
  ]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  // Player's planets and fleets for assignment targets
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId && f.status !== 'destroyed');
  const homeworld = myPlanets.find((p) => p.isHomeworld) || myPlanets[0];

  const handleHireAdmiral = (candidate: Admiral) => {
    if (!homeworld) return;
    if (homeworld.resources.crystal < RECRUIT_COST.crystal || homeworld.resources.fuel < RECRUIT_COST.fuel) {
      sound.playAlert();
      return;
    }

    // Deduct resources
    homeworld.resources.crystal -= RECRUIT_COST.crystal;
    homeworld.resources.fuel -= RECRUIT_COST.fuel;

    sound.playTech();
    const updated = [...admirals, candidate];
    setAdmirals(updated);
    saveAdmirals(updated);

    // Refresh candidate slot
    setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? generateCandidateAdmiral() : c)));

    setSuccessToast(`${candidate.title} ${candidate.name} göreve başladı!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleAssignToFleet = (admiralId: string, fleetId: string | null) => {
    sound.playClick();
    setAdmirals((prev) => {
      const next = prev.map((adm) => {
        if (adm.id === admiralId) {
          return { ...adm, assignedFleetId: fleetId, assignedPlanetId: null };
        }
        // If another admiral had this fleet, unassign them
        if (fleetId && adm.assignedFleetId === fleetId) {
          return { ...adm, assignedFleetId: null };
        }
        return adm;
      });
      saveAdmirals(next);
      return next;
    });
  };

  const handleAssignToPlanet = (admiralId: string, planetId: string | null) => {
    sound.playClick();
    setAdmirals((prev) => {
      const next = prev.map((adm) => {
        if (adm.id === admiralId) {
          return { ...adm, assignedPlanetId: planetId, assignedFleetId: null };
        }
        if (planetId && adm.assignedPlanetId === planetId) {
          return { ...adm, assignedPlanetId: null };
        }
        return adm;
      });
      saveAdmirals(next);
      return next;
    });
  };

  const handleDismissAdmiral = (admiralId: string) => {
    sound.playClick();
    const updated = admirals.filter((a) => a.id !== admiralId);
    setAdmirals(updated);
    saveAdmirals(updated);
  };

  const content = (
    <div
      className={
        isDocked
          ? 'w-[480px] min-w-[480px] max-w-[480px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#18374b] rounded-sm w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold stellaris-gold font-display uppercase tracking-wider">
              Filo Amiralleri & Harp Akademisi
            </h2>
            <span className="text-[11px] text-cyan-300 font-mono">
              {admirals.length} Aktif Komutan • Taktik Doktrinler & Liderlik
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

      {/* Tab Switcher */}
      <div className="flex border-b border-[#18374b] bg-[#070e17] px-2 pt-2 gap-1.5 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('roster');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-t-sm border-t border-x transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#0f2130] text-cyan-300 border-[#2d6b91] shadow-[0_-2px_8px_rgba(0,243,255,0.15)]'
              : 'bg-[#08121c] text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0c1a27]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Komutan Kadrosu ({admirals.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('academy');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-t-sm border-t border-x transition-all cursor-pointer ${
            activeTab === 'academy'
              ? 'bg-[#0f2130] text-amber-300 border-[#2d6b91] shadow-[0_-2px_8px_rgba(245,158,11,0.15)]'
              : 'bg-[#08121c] text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0c1a27]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
          <span>Akademi & İşe Alım</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/60 px-3 py-1.5 flex items-center gap-2 text-emerald-300 font-mono text-[11px] animate-fade-in shrink-0">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tab 1: Admirals Roster */}
      {activeTab === 'roster' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-none text-xs font-mono">
          {admirals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-sm text-slate-300">Aktif Komutan Bulunmuyor</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Harp Akademisi sekmesinden imparatorluğunuzun donanmasını yönetecek yeni amiraller işe alın.
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab('academy');
                }}
                className="mt-4 px-3.5 py-1.5 rounded-sm stellaris-btn-metallic text-cyan-300 font-bold"
              >
                Akademiye Git
              </button>
            </div>
          ) : (
            admirals.map((admiral) => {
              const trait = ADMIRAL_TRAITS[admiral.traitId];
              const xpPercent = Math.min(
                100,
                Math.round((admiral.xp / (admiral.xpToNextLevel || 1)) * 100)
              );

              const assignedFleet = myFleets.find((f) => f.id === admiral.assignedFleetId);
              const assignedPlanet = myPlanets.find((p) => p.id === admiral.assignedPlanetId);

              return (
                <div
                  key={admiral.id}
                  className="p-3 rounded-sm stellaris-item-card border border-[#1b3d52] space-y-2.5"
                >
                  {/* Top Profile Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-sm bg-[#0a1824] border border-[#234c68] flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {admiral.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-display text-white">
                            {admiral.name}
                          </span>
                          <span className="stellaris-badge text-amber-300 font-bold border-amber-500/50">
                            Sv. {admiral.level}
                          </span>
                          <span className="text-[11px] text-slate-300 font-medium">{admiral.title}</span>
                        </div>

                        {/* Trait Badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="px-1.5 py-0.5 rounded-sm border text-[10px] font-bold flex items-center gap-1"
                            style={{
                              borderColor: `${trait.badgeColor}60`,
                              backgroundColor: `${trait.badgeColor}15`,
                              color: trait.badgeColor,
                            }}
                          >
                            <span>{trait.icon}</span>
                            <span>{trait.nameTr}</span>
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-300">
                            ({admiral.battlesWon}G / {admiral.battlesLost}M)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDismissAdmiral(admiral.id)}
                      className="text-[10px] font-mono text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Komutanı Terhis Et"
                    >
                      Terhis
                    </button>
                  </div>

                  {/* Trait Combat Effect Description */}
                  <div className="p-2 rounded-sm bg-[#061019] border border-[#132a3b] text-[11px] text-slate-200">
                    <div className="flex items-center gap-1 text-amber-400 font-bold mb-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{trait.combatBonusDescriptionTr}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-tight">{trait.descriptionTr}</p>
                  </div>

                  {/* Level Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                      <span>Rütbe Tecrübesi (XP)</span>
                      <span className="text-cyan-300 font-bold font-mono">
                        {admiral.xp} / {admiral.xpToNextLevel} XP
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#050c14] rounded-full overflow-hidden border border-[#173549]">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="pt-2 border-t border-[#18374b] flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-400">Görev Yeri:</span>
                    <div className="flex items-center gap-1.5">
                      {/* Fleet Assignment Select */}
                      <select
                        value={admiral.assignedFleetId || ''}
                        onChange={(e) => handleAssignToFleet(admiral.id, e.target.value || null)}
                        className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-cyan-300 font-bold text-[10px] focus:outline-none max-w-[170px]"
                      >
                        <option value="">Filo Yok (Boşta)</option>
                        {myFleets.map((fl) => (
                          <option key={fl.id} value={fl.id}>
                            🚀 {fl.name}
                          </option>
                        ))}
                      </select>

                      {/* Planet Garrison Select */}
                      <select
                        value={admiral.assignedPlanetId || ''}
                        onChange={(e) => handleAssignToPlanet(admiral.id, e.target.value || null)}
                        className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-amber-300 font-bold text-[10px] focus:outline-none max-w-[140px]"
                      >
                        <option value="">Garnizon Yok</option>
                        {myPlanets.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            🪐 {pl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Naval Academy & Recruitment */}
      {activeTab === 'academy' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-none text-xs font-mono">
          {/* Academy Info Banner */}
          <div className="p-2.5 rounded-sm bg-[#08131e] border border-[#1b3d52] text-[11px] text-slate-300 flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">İmparatorluk Harp Akademisi:</span>
              <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                Akademiden mezun olan üstün yetenekli subaylar, filolarınıza liderlik ederek savaşlarda kritik vuruş, kaçınma ve zırh dayanıklılığı sağlar.
              </p>
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-2.5">
            {candidates.map((cand) => {
              const trait = ADMIRAL_TRAITS[cand.traitId];
              const canAfford =
                homeworld &&
                homeworld.resources.crystal >= RECRUIT_COST.crystal &&
                homeworld.resources.fuel >= RECRUIT_COST.fuel;

              return (
                <div
                  key={cand.id}
                  className="p-3 rounded-sm stellaris-item-card border border-[#1b3d52] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-sm bg-[#0a1824] border border-[#234c68] flex items-center justify-center text-xl shrink-0">
                        {cand.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-display text-white">
                            {cand.name}
                          </span>
                          <span className="stellaris-badge text-cyan-300 font-bold border-cyan-500/40">
                            {cand.title}
                          </span>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold mt-1"
                          style={{ color: trait.badgeColor }}
                        >
                          <span>{trait.icon}</span>
                          <span>{trait.nameTr}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleHireAdmiral(cand)}
                      className="px-3.5 py-1.5 rounded-sm stellaris-btn-metallic text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>İşe Al</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-sm bg-[#061019] border border-[#132a3b] text-[11px] text-slate-200">
                    <div className="text-amber-400 font-bold mb-0.5">{trait.combatBonusDescriptionTr}</div>
                    <div className="text-slate-300 text-[10.5px] leading-tight">{trait.descriptionTr}</div>
                  </div>

                  {/* Cost Footer */}
                  <div className="pt-2 border-t border-[#18374b] flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>Atama Bedeli:</span>
                    <div className="flex items-center gap-2 font-mono font-medium">
                      <span className={homeworld && homeworld.resources.crystal >= RECRUIT_COST.crystal ? 'text-cyan-300 font-bold' : 'text-rose-400 font-bold'}>
                        {RECRUIT_COST.crystal} Kristal
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className={homeworld && homeworld.resources.fuel >= RECRUIT_COST.fuel ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                        {RECRUIT_COST.fuel} Yakıt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refresh Candidates Button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCandidates([
                  generateCandidateAdmiral(),
                  generateCandidateAdmiral(),
                  generateCandidateAdmiral(),
                ]);
              }}
              className="px-3.5 py-1.5 rounded-sm stellaris-btn-metallic text-slate-300 hover:text-white text-xs font-mono"
            >
              Aday Listesini Yenile
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      {content}
    </div>
  );
};
