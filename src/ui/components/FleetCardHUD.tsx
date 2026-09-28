import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Flame,
  Lock,
  Navigation,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { Fleet, GameState, ShipType } from '../../engine/types';
import { GAME_CONSTANTS, SHIP_STATS } from '../../engine/constants';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface FleetCardHUDProps {
  state: GameState;
  fleetId: string;
  activePlayerId: string;
  currentTimeMs: number;
  onClose: () => void;
  onRecallFleet: (fleetId: string) => void;
  onOpenCommandPanel: () => void;
  onFocusFleetPosition?: () => void;
}

export const FleetCardHUD: React.FC<FleetCardHUDProps> = ({
  state,
  fleetId,
  activePlayerId,
  currentTimeMs,
  onClose,
  onRecallFleet,
  onOpenCommandPanel,
  onFocusFleetPosition,
}) => {
  const fleet = state.fleets[fleetId];
  if (!fleet) return null;

  const isOwnFleet = fleet.ownerId === activePlayerId;
  const owner = state.players[fleet.ownerId];
  const originSys = state.map.systems[fleet.originSystemId];
  const targetSys = state.map.systems[fleet.targetSystemId];

  // Calculate combat power and hull stats
  let totalAttack = 0;
  let totalDurability = 0;
  let totalShipCount = 0;

  (['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).forEach((st) => {
    const count = fleet.ships[st] || 0;
    totalShipCount += count;
    totalAttack += count * SHIP_STATS[st].attack;
    totalDurability += count * (SHIP_STATS[st].hull + SHIP_STATS[st].shield);
  });

  // Transit calculations
  const totalTravelMs = Math.max(1, fleet.arrivalTime - fleet.departureTime);
  const elapsedMs = Math.max(0, currentTimeMs - fleet.departureTime);
  const progressRatio = Math.min(1, elapsedMs / totalTravelMs);
  const progressPercent = Math.round(progressRatio * 100);
  const remainingMs = Math.max(0, fleet.arrivalTime - currentTimeMs);

  const isRecallLocked =
    fleet.status === 'in_transit' &&
    elapsedMs > totalTravelMs * GAME_CONSTANTS.RECALL_LOCK_RATIO;

  const canRecall = isOwnFleet && (fleet.status === 'in_transit' || fleet.status === 'intercepting') && !isRecallLocked;

  const missionLabels: Record<string, string> = {
    transport: '📦 Kaynak İkmal Seferi',
    colonize: '🏛️ Gezegen Koloni Seferi',
    explore: '📡 Derin Uzay Keşif Seferi',
    attack: '⚔️ Sektör Taarruz Seferi',
    intercept: '🎯 Rota Önleme Operasyonu',
    support: '🛡️ Müttefik Savunma Desteği',
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    in_transit: { label: 'Rotada İlerliyor', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' },
    returning: { label: 'Geri Dönüş Rotasında', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' },
    intercepting: { label: 'Hedef Önleniyor', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' },
    orbiting: { label: 'Yörünge Garnizonunda', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' },
    destroyed: { label: 'İmha Edildi', color: 'text-slate-500 bg-slate-900 border-slate-700' },
  };

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-35 w-full max-w-2xl px-4 pointer-events-none select-none animate-fade-in">
      <div className="pointer-events-auto bg-[#080d19]/95 backdrop-blur-md border border-[#1a2942] rounded-xl shadow-2xl p-3.5 text-slate-100 flex flex-col gap-2.5 relative overflow-hidden">
        {/* Top Accent Line in Owner Color */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: owner?.color || '#00f3ff' }}
        />

        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Fleet Faction Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${owner?.color || '#00f3ff'}20`,
                borderColor: `${owner?.color || '#00f3ff'}60`,
              }}
            >
              <Navigation className="w-4 h-4" style={{ color: owner?.color || '#00f3ff' }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-display text-slate-100">
                  {fleet.name || 'Filo'}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: `${owner?.color || '#00f3ff'}15`,
                    borderColor: `${owner?.color || '#00f3ff'}40`,
                    color: owner?.color || '#00f3ff',
                  }}
                >
                  {owner?.name || 'Komutan'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {missionLabels[fleet.mission] || 'Standart Sefer'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                statusLabels[fleet.status]?.color || 'text-slate-300'
              }`}
            >
              {statusLabels[fleet.status]?.label || fleet.status}
            </span>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flight Progress Bar (if in flight) */}
        {fleet.status !== 'orbiting' && (
          <div className="bg-[#0b1325]/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span>{originSys?.name || 'Başlangıç'}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="font-bold text-cyan-300">{targetSys?.name || 'Hedef'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">
                  Varış: <strong className="text-slate-200">{formatClockTime(fleet.arrivalTime)}</strong>
                </span>
                <span className="text-cyan-400 font-bold">
                  {formatDuration(remainingMs)} kaldı
                </span>
              </div>
            </div>

            {/* Visual Progress Bar with 50% Recall Lock Indicator */}
            <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              {/* 50% Threshold Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                style={{ left: '50%' }}
                title="%50 Geri Çağırma Kilidi (Point of No Return)"
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span>İlerleme: %{progressPercent}</span>
              {fleet.status === 'in_transit' && (
                <span>
                  {isRecallLocked ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Geri Dönüş Kilitlendi (%50 aşıldı)
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      Geri Çağırma Açık (%{progressPercent} / %50)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ship Roster & Tactical Specs */}
        <div className="grid grid-cols-4 gap-2 font-mono">
          {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
            const count = fleet.ships[st] || 0;
            const names: Record<ShipType, string> = {
              scout: 'Keşif',
              transport: 'Nakliye',
              fighter: 'Avcı',
              battleship: 'Savaş G.',
            };

            return (
              <div
                key={st}
                className={`p-1.5 rounded border text-center ${
                  count > 0
                    ? 'bg-[#0c162c] border-cyan-500/40 text-slate-200'
                    : 'bg-[#070e1c]/50 border-slate-800 text-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-400">{names[st]}</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Bottom Metrics & Tactical Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>
              Toplam Filo: <strong className="text-slate-100">{totalShipCount} Gemi</strong>
            </span>
            <span>
              Ateş Gücü: <strong className="text-rose-400">💥 {totalAttack}</strong>
            </span>
            <span>
              Dayanıklılık: <strong className="text-emerald-400">🛡️ {totalDurability}</strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canRecall && (
              <button
                onClick={() => {
                  sound.playClick();
                  onRecallFleet(fleet.id);
                }}
                className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-amber-950/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Geri Çağır</span>
              </button>
            )}

            {!isOwnFleet && (
              <button
                onClick={() => {
                  sound.playAlert();
                  onOpenCommandPanel();
                }}
                className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-rose-950/30"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Önleme Hazırla</span>
              </button>
            )}

            {isOwnFleet && fleet.status === 'orbiting' && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenCommandPanel();
                }}
                className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-950/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Sefer Sevk Et</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
