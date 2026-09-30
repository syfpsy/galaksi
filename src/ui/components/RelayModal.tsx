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

const RelayModalComponent: React.FC<RelayModalProps> = ({
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
    <div className={isDocked ? "w-[540px] min-w-[540px] max-w-[540px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none" : "stellaris-outliner border border-[#1c3647] rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"}>
      {/* Header */}
      <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-purple-950/60 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <Crown className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display uppercase tracking-wide">
              Nexus Rölesi & Haftalık Sektör Hakimiyeti
            </h2>
            <span className="text-[10px] text-purple-300 font-mono font-medium">
              {relaySys?.name || 'Merkezi Röle'} • Stratejik Görüş ve Sıralama Noktası
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        {/* Hero Visual Banner of Nexus Relay */}
        <div className="relative w-full h-44 rounded-sm overflow-hidden border border-purple-500/40 bg-[#06101a] shadow-lg shadow-purple-950/40 flex items-center justify-center group">
          <img
            src="/assets/art/nexus_relay.png"
            alt="Nexus Relay Megastructure"
            className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d19] via-[#080d19]/60 to-transparent" />

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-mono text-purple-200 uppercase tracking-widest bg-purple-950/80 px-2 py-0.5 rounded-sm border border-purple-500/40 inline-block font-bold">
                Kadim Öncü Megastrüktürü
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: controller?.color || '#a855f7' }}
                />
                <span className="text-sm font-bold text-white font-display drop-shadow">
                  {controller ? controller.name : 'Tarafsız Savunma Garnizonu'}
                </span>
                {controller && (
                  <span className="text-xs text-purple-300 font-mono font-medium">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm stellaris-btn-metallic text-cyan-200 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Swords className="w-4 h-4 text-cyan-300" />
              <span>Röleye Sefer Düzenle</span>
            </button>
          </div>
        </div>

        {/* Strategic Bonuses */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="stellaris-item-card p-3 border-[#1c3647]">
            <div className="flex items-center gap-2 text-purple-300 font-bold mb-1">
              <Radio className="w-4 h-4" />
              <span>Gelişmiş Taktik Görüş</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Röleyi elinde tutan güç, çevredeki tüm bağlantı hatlarını (+2 atlama menzili) sis
              olmadan tarar.
            </p>
          </div>

          <div className="stellaris-item-card p-3 border-[#1c3647]">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
              <Award className="w-4 h-4" />
              <span>Haftalık Sıralama Puanı</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Her 10 dakikalık kontrol için +10 Hakimiyet Puanı kazanılır. Hafta sonunda arşivlenir.
            </p>
          </div>
        </div>

        {/* Stationed Garrison */}
        <div className="stellaris-item-card border-[#1c3647] p-3">
          <div className="stellaris-section-header px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Röle Savunma Garnizonu</span>
            <span className="text-slate-300 font-medium">Mevcut İstasyon Gücü</span>
          </div>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
            {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
              <div key={st} className="bg-[#07131e] p-2 rounded-sm border border-[#18374b]">
                <span className="text-[10px] text-slate-300 block">{SHIP_STATS[st].nameTr}</span>
                <span className="text-xs font-bold text-cyan-300">{relay.garrison[st] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Leaderboard Table */}
        <div>
          <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
            🏆 Haftalık Sektör Hakimiyet Sıralaması
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-6 text-center font-mono stellaris-item-card border-dashed border-[#1c3647]">
              Henüz röle kontrol puanı toplanmadı.
            </div>
          ) : (
            <div className="divide-y divide-[#18374b] stellaris-item-card border-[#1c3647] rounded-sm overflow-hidden font-mono text-xs">
              {leaderboard.map((item, idx) => (
                <div
                  key={item.player.id}
                  className={`p-2.5 flex items-center justify-between ${
                    item.isController ? 'bg-purple-950/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.player.color }}
                    />
                    <span className="font-semibold text-white">
                      {item.player.name}
                      {item.isController && (
                        <span className="ml-2 text-[10px] text-purple-300 font-normal">
                          (Mevcut Hâkim)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-amber-300 font-bold">{item.points} Puan</div>
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

export const RelayModal = React.memo(RelayModalComponent);
