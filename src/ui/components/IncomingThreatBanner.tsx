import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Radio,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { Fleet, GameState } from '../../engine/types';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface IncomingThreatBannerProps {
  state: GameState;
  activePlayerId: string;
  onTargetThreat: (fleet: Fleet) => void;
  onEvacuatePlanet: (planetId: string) => void;
  onOpenRadar?: () => void;
  isBattleAlertActive?: boolean;
}

const IncomingThreatBannerComponent: React.FC<IncomingThreatBannerProps> = ({
  state,
  activePlayerId,
  onTargetThreat,
  onEvacuatePlanet,
  onOpenRadar,
  isBattleAlertActive = false,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Dynamic top offset to avoid collision with live combat threat alert
  const topOffset = isBattleAlertActive ? 'top-32' : 'top-14';

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

  if (isMinimized) {
    return (
      <div className={`absolute ${topOffset} left-1/2 -translate-x-1/2 z-30 select-none animate-fade-in transition-all duration-300`}>
        <div className="bg-rose-950/90 border border-rose-500/80 rounded-full px-3 py-1.5 backdrop-blur-md shadow-2xl shadow-rose-950/60 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-rose-200">
            🚨 {threats.length} Düşman Baskını ({formatDuration(remainingMs)})
          </span>
          {onOpenRadar && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenRadar();
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10.5px] font-bold transition-all shadow cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              <span>Radarı Aç</span>
            </button>
          )}
          <button
            onClick={() => {
              sound.playClick();
              setIsMinimized(false);
            }}
            className="p-1 hover:bg-rose-900/60 rounded-full text-rose-300 transition-colors cursor-pointer"
            title="Ayrıntıları Göster"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${topOffset} left-1/2 -translate-x-1/2 z-30 select-none max-w-3xl w-full px-4 animate-bounce-subtle transition-all duration-300`}>
      <div className="bg-rose-950/95 border border-rose-500/80 rounded-sm p-3 backdrop-blur-md shadow-2xl shadow-rose-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                🚨 SENSÖR ALARMI: DÜŞMAN BASKIN FİLOSU YOLDA!
              </span>
              <span className="text-[10px] font-mono bg-rose-900/80 px-2 py-0.5 rounded-sm border border-rose-600 text-rose-200">
                Varış: {formatClockTime(threat.arrivalTime)} ({formatDuration(remainingMs)})
              </span>
              {threats.length > 1 && (
                <span className="text-[10px] font-mono bg-rose-800 text-white px-1.5 py-0.5 rounded-sm font-bold">
                  +{threats.length - 1} diğer
                </span>
              )}
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
          {onOpenRadar && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenRadar();
              }}
              className="stellaris-btn-metallic flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm !border-cyan-500/60 text-cyan-300 font-mono font-semibold text-xs transition-all"
              title="Tüm intikal ve tehdit hareketlerini Taktik Radarda incele"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Radarda İncele</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onTargetThreat(threat);
            }}
            className="stellaris-btn-metallic flex items-center gap-1.5 px-3 py-1.5 rounded-sm !bg-rose-950/80 !border-rose-500 text-rose-200 hover:text-white font-bold text-xs transition-all shadow-md shadow-rose-900/50"
            title="Düşman filosunu rotada yakalamak için önleme emri hazırla"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>Önleme Hazırla</span>
          </button>

          {targetPlanet && (
            <button
              onClick={() => {
                sound.playClick();
                onEvacuatePlanet(targetPlanet.id);
              }}
              className="stellaris-btn-metallic flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm !border-amber-500/50 text-amber-300 text-xs transition-all"
              title="Kaynakları nakliyeye yükleyip güvenli üsse tahliye et (Fleet Save)"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Tahliye</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              setIsMinimized(true);
            }}
            className="p-1.5 hover:bg-rose-900/60 text-rose-300 rounded-sm transition-colors ml-1"
            title="Şeridi Küçült (Haritayı Aç)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const IncomingThreatBanner = React.memo(IncomingThreatBannerComponent);
