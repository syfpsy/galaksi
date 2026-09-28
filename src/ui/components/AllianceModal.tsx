import React, { useState } from 'react';
import { Eye, Plus, Shield, ShieldCheck, UserMinus, Users, X } from 'lucide-react';
import { GameState, Player } from '../../engine/types';

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
    <div className={isDocked ? "w-full h-full bg-[#080d19]/98 border-r border-[#1a2942] flex flex-col shadow-2xl overflow-hidden select-none" : "bg-space-900 border border-blue-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-blue-950/40 overflow-hidden"}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Galaktik İttifaklar & Diplomasi
              </h2>
              <span className="text-xs text-blue-400 font-mono">
                {myAlliance ? `[${myAlliance.tag}] ${myAlliance.name}` : 'Bağımsız Komutan'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {myAlliance ? (
            /* Active Alliance View */
            <div className="space-y-4">
              <div className="bg-space-850 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-600">
                      [{myAlliance.tag}]
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 font-display">
                      {myAlliance.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1.5">
                    <span>{myAlliance.memberIds.length} Üye İmparatorluk</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Paylaşılan Sensör Görüşü Aktif
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLeaveAlliance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-mono transition-all"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Ayrıl</span>
                </button>
              </div>

              {/* Members List */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
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
                        className="bg-space-850 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: member.color }}
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                              {member.name}
                              {isMe && (
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                                  Siz
                                </span>
                              )}
                              {memberId === myAlliance.founderId && (
                                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-600 px-1.5 py-0.2 rounded font-mono">
                                  Kurucu
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {memberPlanets.length} Gezegen • {memberPlanets.map((p) => p.name).join(', ')}
                            </div>
                          </div>
                        </div>

                        {/* Support Ally Button */}
                        {!isMe && memberPlanets.length > 0 && (
                          <button
                            onClick={() => {
                              onSupportAlly(memberPlanets[0].systemId, memberPlanets[0].id);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs font-mono transition-all"
                          >
                            <Shield className="w-3.5 h-3.5" />
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Herhangi bir ittifakta değilsiniz. Bir ittifaka katılarak ortak sensör görüşü ve koordinasyon avantajı kazanın.
                </span>
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreating ? 'Vazgeç' : 'Yeni İttifak Kur'}</span>
                </button>
              </div>

              {/* Create Form */}
              {isCreating && (
                <div className="bg-space-850 border border-blue-500/40 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-slate-100 font-display">
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
                        className="w-full bg-space-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
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
                        className="w-full bg-space-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    disabled={!newName.trim() || !newTag.trim()}
                    onClick={() => {
                      onCreateAlliance(newName.trim(), newTag.trim());
                      setIsCreating(false);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded font-bold text-xs font-display"
                  >
                    İttifakı Kur
                  </button>
                </div>
              )}

              {/* Public Alliances List */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Sektördeki Mevcut İttifaklar
                </div>

                {allAlliances.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-6 text-center">
                    Henüz kurulmuş bir ittifak bulunmuyor. İlk ittifakı siz kurun!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allAlliances.map((ally) => (
                      <div
                        key={ally.id}
                        className="bg-space-850 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-700/60">
                              [{ally.tag}]
                            </span>
                            <span className="text-sm font-semibold text-slate-100">
                              {ally.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                            {ally.memberIds.length} Üye • Kurucu: {state.players[ally.founderId]?.name || 'Bilinmeyen'}
                          </span>
                        </div>

                        <button
                          onClick={() => onJoinAlliance(ally.id)}
                          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs font-mono"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      {content}
    </div>
  );
};
