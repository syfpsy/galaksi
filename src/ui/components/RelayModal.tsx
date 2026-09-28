import React from 'react';
import { Award, Crown, Radio, Shield, Swords, Users, X, Zap } from 'lucide-react';
import { GameState, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface RelayModalProps {
  state: GameState;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onAssaultRelay: () => void;
}

export const RelayModal: React.FC<RelayModalProps> = ({
  state,
  isOpen,
  isDocked = false,
  onClose,
  onAssaultRelay,
}) => {
  if (!isOpen) return null;

  const relay = state.relay;
  const relaySys = state.map.systems[relay.systemId];
  const controller = relay.controllingPlayerId ? state.players[relay.controllingPlayerId] : null;

  // Sorted Leaderboard
  const leaderboard = Object.entries(relay.weeklyPoints)
    .map(([pid, points]) => ({
      player: state.players[pid],
      points,
      isController: relay.controllingPlayerId === pid,
    }))
    .filter((e) => e.player)
    .sort((a, b) => b.points - a.points);

  const durationHeldMs = relay.controllingPlayerId
    ? Math.max(0, state.timeMs - relay.capturedAtTime)
    : 0;

  const content = (
    <div className={isDocked ? "w-[540px] min-w-[540px] max-w-[540px] shrink-0 h-full bg-[#080d19]/98 border-r border-[#1b314d] flex flex-col shadow-2xl overflow-hidden select-none" : "bg-space-900 border border-purple-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-purple-950/40 overflow-hidden"}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Crown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Nexus Rölesi & Haftalık Sektör Hakimiyeti
              </h2>
              <span className="text-xs text-purple-400 font-mono">
                {relaySys?.name || 'Merkezi Röle'} • Stratejik Görüş ve Sıralama Noktası
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
        <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
          {/* Hero Visual Banner of Nexus Relay */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-purple-500/40 bg-space-950 shadow-lg shadow-purple-950/40 flex items-center justify-center group">
            <img
              src="/assets/art/nexus_relay.png"
              alt="Nexus Relay Megastructure"
              className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/60 to-transparent" />

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 inline-block">
                  Kadim Öncü Megastrüktürü
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: controller?.color || '#a855f7' }}
                  />
                  <span className="text-base font-bold text-slate-100 font-display drop-shadow">
                    {controller ? controller.name : 'Tarafsız Savunma Garnizonu'}
                  </span>
                  {controller && (
                    <span className="text-xs text-purple-300 font-mono">
                      ({formatDuration(durationHeldMs)})
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playLaunch();
                  onAssaultRelay();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold font-display text-xs transition-all shadow-md shadow-purple-900/50 hover:shadow-purple-700/60"
              >
                <Swords className="w-4 h-4" />
                <span>Röleye Sefer Düzenle</span>
              </button>
            </div>
          </div>

          {/* Strategic Bonuses */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-space-850 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                <Radio className="w-4 h-4" />
                <span>Gelişmiş Taktik Görüş</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Röleyi elinde tutan güç, çevredeki tüm bağlantı hatlarını (+2 atlama menzili) sis
                olmadan tarar.
              </p>
            </div>

            <div className="bg-space-850 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>Haftalık Sıralama Puanı</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Her 10 dakikalık kontrol için +10 Hakimiyet Puanı kazanılır. Hafta sonunda arşivlenir.
              </p>
            </div>
          </div>

          {/* Stationed Garrison */}
          <div className="bg-space-850 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Röle Savunma Garnizonu</span>
              <span className="text-slate-500">Mevcut İstasyon Gücü</span>
            </div>

            <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
              {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                <div key={st} className="bg-space-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{SHIP_STATS[st].nameTr}</span>
                  <span className="text-sm font-bold text-cyber-cyan">{relay.garrison[st] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Leaderboard Table */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              🏆 Haftalık Sektör Hakimiyet Sıralaması
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-4 text-center">
                Henüz röle kontrol puanı toplanmadı.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 bg-space-850 rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.player.id}
                    className={`p-2.5 flex items-center justify-between ${
                      item.isController ? 'bg-purple-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-bold text-slate-500">#{idx + 1}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.player.color }}
                      />
                      <span className="font-semibold text-slate-200">
                        {item.player.name}
                        {item.isController && (
                          <span className="ml-2 text-[10px] text-purple-400 font-normal">
                            (Mevcut Hâkim)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="text-amber-400 font-bold">{item.points} Puan</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
