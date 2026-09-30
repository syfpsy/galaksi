import React, { useState } from 'react';
import { Eye, Plus, Shield, ShieldCheck, UserMinus, Users, X } from 'lucide-react';
import { GameState, Player } from '../../engine/types';
import { sound } from '../sound';

interface AllianceModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onCreateAlliance: (name: string, tag: string) => void;
  onJoinAlliance: (allianceId: string) => void;
  onLeaveAlliance: () => void;
  onSupportAlly: (targetSystemId: string, planetId: string) => void;
}

export const AllianceModal: React.FC<AllianceModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  isDocked = false,
  onClose,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onSupportAlly,
}) => {
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const myAlliance = player?.allianceId ? state.alliances[player.allianceId] : null;
  const allAlliances = Object.values(state.alliances);

  const content = (
    <div className={isDocked ? "w-[540px] min-w-[540px] max-w-[540px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none" : "stellaris-outliner border border-[#1c3647] rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"}>
      {/* Header */}
      <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#092233] border border-[#204963] flex items-center justify-center text-[#3ca8d1] shadow-inner">
            <Users className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Galaktik İttifaklar & Diplomasi
            </h2>
            <span className="text-[10px] text-[#3ca8d1] font-mono">
              {myAlliance ? `[${myAlliance.tag}] ${myAlliance.name}` : 'Bağımsız Komutan'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        {myAlliance ? (
          /* Active Alliance View */
          <div className="space-y-4">
            <div className="stellaris-item-card border-[#1c3647] p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#0b2438] text-cyan-300 px-2 py-0.5 rounded border border-[#1c445c]">
                    [{myAlliance.tag}]
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    {myAlliance.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1.5">
                  <span>{myAlliance.memberIds.length} Üye İmparatorluk</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Eye className="w-3.5 h-3.5" /> Paylaşılan Sensör Görüşü Aktif
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onLeaveAlliance();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 text-xs font-mono transition-all shadow-sm"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Ayrıl</span>
              </button>
            </div>

            {/* Members List */}
            <div>
              <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
                İttifak Üyeleri ve Kolonileri
              </div>
              <div className="space-y-2">
                {myAlliance.memberIds.map((memberId) => {
                  const member = state.players[memberId];
                  if (!member) return null;
                  const memberPlanets = Object.values(state.planets).filter(
                    (p) => p.ownerId === memberId
                  );
                  const isMe = memberId === activePlayerId;

                  return (
                    <div
                      key={memberId}
                      className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono">
                            {member.name}
                            {isMe && (
                              <span className="text-[9.5px] bg-[#0c2438] text-cyan-300 px-1.5 py-0.5 rounded border border-[#1b3e54] font-mono">
                                Siz
                              </span>
                            )}
                            {memberId === myAlliance.founderId && (
                              <span className="text-[9.5px] bg-amber-950/60 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                                Kurucu
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {memberPlanets.length} Gezegen • {memberPlanets.map((p) => p.name).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Support Ally Button */}
                      {!isMe && memberPlanets.length > 0 && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onSupportAlly(memberPlanets[0].systemId, memberPlanets[0].id);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded stellaris-btn-metallic text-cyan-200 font-medium text-xs font-mono transition-all"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#3ca8d1]" />
                          <span>Destek Gönder</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Not in alliance: Browse & Create */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Herhangi bir ittifakta değilsiniz. Bir ittifaka katılarak ortak sensör görüşü ve koordinasyon avantajı kazanın.
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsCreating(!isCreating);
                }}
                className="px-3 py-1.5 rounded stellaris-btn-metallic text-cyan-300 font-bold text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#3ca8d1]" />
                <span>{isCreating ? 'Vazgeç' : 'Yeni İttifak'}</span>
              </button>
            </div>

            {/* Create Form */}
            {isCreating && (
              <div className="stellaris-item-card border-[#234b66] p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                  Yeni İttifak Oluştur
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      İttifak Adı
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Solaria Federasyonu"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#07131e] border border-[#18374b] rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#3ca8d1] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Etiket (Tag)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="SOL"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full bg-[#07131e] border border-[#18374b] rounded px-3 py-1.5 text-xs text-slate-100 uppercase focus:outline-none focus:border-[#3ca8d1] font-mono font-bold"
                    />
                  </div>
                </div>
                <button
                  disabled={!newName.trim() || !newTag.trim()}
                  onClick={() => {
                    sound.playClick();
                    onCreateAlliance(newName.trim(), newTag.trim());
                    setIsCreating(false);
                  }}
                  className="w-full py-2 stellaris-btn-metallic text-cyan-200 rounded font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40"
                >
                  İttifakı Kur
                </button>
              </div>
            )}

            {/* Public Alliances List */}
            <div>
              <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
                Sektördeki Mevcut İttifaklar
              </div>

              {allAlliances.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-8 text-center font-mono stellaris-item-card border-dashed border-[#1c3647]">
                  Henüz kurulmuş bir ittifak bulunmuyor. İlk ittifakı siz kurun!
                </div>
              ) : (
                <div className="space-y-2">
                  {allAlliances.map((ally) => (
                    <div
                      key={ally.id}
                      className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-[#0b2438] text-cyan-300 px-2 py-0.5 rounded border border-[#1c445c]">
                            [{ally.tag}]
                          </span>
                          <span className="text-xs font-bold text-slate-100 font-display">
                            {ally.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                          {ally.memberIds.length} Üye • Kurucu: {state.players[ally.founderId]?.name || 'Bilinmeyen'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onJoinAlliance(ally.id);
                        }}
                        className="px-3 py-1.5 rounded stellaris-btn-metallic text-cyan-300 font-mono text-xs font-bold"
                      >
                        Katıl
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isDocked) return content;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200"
    >
      {content}
    </div>
  );
};
