import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Radio,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { Fleet, GameState } from '../../engine/types';
import { formatClockTime, formatDuration } from '../timeUtils';

interface IncomingThreatBannerProps {
  state: GameState;
  activePlayerId: string;
  onTargetThreat: (fleet: Fleet) => void;
  onEvacuatePlanet: (planetId: string) => void;
}

export const IncomingThreatBanner: React.FC<IncomingThreatBannerProps> = ({
  state,
  activePlayerId,
  onTargetThreat,
  onEvacuatePlanet,
}) => {
  // Find all hostile fleets heading towards a planet owned by activePlayer
  const threats = Object.values(state.fleets).filter((f) => {
    if (f.ownerId === activePlayerId || f.status === 'destroyed') return false;
    if (f.targetPlanetId && state.planets[f.targetPlanetId]?.ownerId === activePlayerId) {
      return true;
    }
    // Or heading to a system where player has a planet
    const isTargetSystemMyColony = Object.values(state.planets).some(
      (p) => p.ownerId === activePlayerId && p.systemId === f.targetSystemId
    );
    return isTargetSystemMyColony && f.mission === 'attack';
  });

  if (threats.length === 0) return null;

  const threat = threats[0];
  const attacker = state.players[threat.ownerId];
  const targetPlanet = threat.targetPlanetId ? state.planets[threat.targetPlanetId] : null;
  const targetSystem = state.map.systems[threat.targetSystemId];

  const remainingMs = Math.max(0, threat.arrivalTime - state.timeMs);
  const remainingRecallWindowMs = Math.max(0, threat.recallLockedAfterTime - state.timeMs);

  return (
    <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 select-none max-w-3xl w-full px-4 animate-bounce-subtle">
      <div className="bg-rose-950/90 border border-rose-500/80 rounded-xl p-3 backdrop-blur-md shadow-2xl shadow-rose-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                🚨 SENSÖR ALARMI: DÜŞMAN BASKIN FİLOSU YOLDA!
              </span>
              <span className="text-[10px] font-mono bg-rose-900/80 px-2 py-0.5 rounded border border-rose-600 text-rose-200">
                Varış: {formatClockTime(threat.arrivalTime)} ({formatDuration(remainingMs)})
              </span>
            </div>

            <div className="text-xs text-slate-200 mt-0.5 font-mono flex items-center gap-2">
              <span>{attacker?.name || 'Bilinmeyen Akıncı'}</span>
              <ArrowRight className="w-3 h-3 text-rose-400" />
              <strong className="text-amber-300">
                {targetPlanet?.name || targetSystem?.name}
              </strong>
              <span className="text-slate-400">
                (Kilitlenme Penceresi: {formatDuration(remainingRecallWindowMs)})
              </span>
            </div>
          </div>
        </div>

        {/* Quick Strategic Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTargetThreat(threat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-md shadow-rose-900/50"
            title="Düşman filosunu rotada yakalamak için önleme emri hazırla"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Önleme Hazırla</span>
          </button>

          {targetPlanet && (
            <button
              onClick={() => onEvacuatePlanet(targetPlanet.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-amber-500/40 text-amber-300 text-xs transition-all"
              title="Kaynakları nakliyeye yükleyip güvenli üsse tahliye et (Fleet Save)"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Tahliye (Fleet-Save)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
