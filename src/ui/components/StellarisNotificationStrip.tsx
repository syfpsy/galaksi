import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Compass,
  Crown,
  Database,
  Radio,
  Rocket,
  ShieldAlert,
  Sparkles,
  Swords,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { GameEventRecord, GameState } from '../../engine/types';
import { sound } from '../sound';

export interface EmpireNotification {
  id: string;
  type: 'threat' | 'battle' | 'research' | 'colony' | 'shipyard' | 'anomaly' | 'debris' | 'relay';
  title: string;
  description: string;
  timestampMs: number;
  systemId?: string;
  fleetId?: string;
  targetPlanetId?: string;
}

interface StellarisNotificationStripProps {
  state: GameState;
  activePlayerId: string;
  onFocusSystem: (systemId: string) => void;
  onOpenBattles: () => void;
  onOpenResearch: () => void;
  onOpenShipyard: () => void;
  onOpenSituationLog: () => void;
}

export const StellarisNotificationStrip: React.FC<StellarisNotificationStripProps> = ({
  state,
  activePlayerId,
  onFocusSystem,
  onOpenBattles,
  onOpenResearch,
  onOpenShipyard,
  onOpenSituationLog,
}) => {
  const [notifications, setNotifications] = useState<EmpireNotification[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Synchronize notifications from new events in eventLog and threats
  useEffect(() => {
    const activeThreats = Object.values(state.fleets).filter((f) => {
      if (f.ownerId === activePlayerId) return false;
      const targetP = f.targetPlanetId ? state.planets[f.targetPlanetId] : null;
      return targetP && targetP.ownerId === activePlayerId && f.mission === 'attack';
    });

    const notifs: EmpireNotification[] = [];

    // 1. Hostile Incursion Threat alert
    if (activeThreats.length > 0) {
      const topThreat = activeThreats[0];
      notifs.push({
        id: `threat_${topThreat.id}`,
        type: 'threat',
        title: 'DÜŞMAN BASKINI TESPİT EDİLDİ',
        description: `${topThreat.name} koloninize yöneliyor!`,
        timestampMs: state.timeMs,
        systemId: topThreat.targetSystemId,
        fleetId: topThreat.id,
      });
    }

    // 2. Scan recent event log for significant events
    const recentEvents = state.eventLog
      .filter((e) => !e.playerId || e.playerId === activePlayerId)
      .slice(-12)
      .reverse();

    recentEvents.forEach((evt) => {
      let notifType: EmpireNotification['type'] | null = null;
      let title = '';

      if (evt.type === 'battle_occurred' || evt.type.includes('combat')) {
        notifType = 'battle';
        title = 'MUHAREBE RAPORU';
      } else if (evt.type === 'research_completed' || evt.type.includes('research')) {
        notifType = 'research';
        title = 'AR-GE TEKNOLOJİSİ TAMAMLANDI';
      } else if (evt.type === 'colony_founded') {
        notifType = 'colony';
        title = 'YENİ KOLONİ KURULDU';
      } else if (evt.type === 'ships_built' || evt.type.includes('shipyard')) {
        notifType = 'shipyard';
        title = 'TERSANE GEMİ İNŞASI TAMAMLANDI';
      } else if (evt.type === 'system_explored') {
        notifType = 'anomaly';
        title = 'SEKTÖR KEŞFİ YAPILDI';
      } else if (evt.type === 'debris_salvaged') {
        notifType = 'debris';
        title = 'ENKAZ KURTARILDI';
      } else if (evt.type.includes('relay')) {
        notifType = 'relay';
        title = 'NEXUS RÖLE KONTROL DEĞİŞİMİ';
      }

      if (notifType && notifs.length < 6 && !notifs.some((n) => n.id === evt.id)) {
        notifs.push({
          id: evt.id,
          type: notifType,
          title,
          description: evt.description,
          timestampMs: evt.timeMs,
        });
      }
    });

    setNotifications(notifs);
  }, [state.eventLog, state.fleets, state.timeMs, activePlayerId]);

  if (notifications.length === 0) return null;

  const getIconAndStyle = (type: EmpireNotification['type']) => {
    switch (type) {
      case 'threat':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          border: 'border-rose-500/80 shadow-rose-950/60',
          bg: 'bg-rose-950/80',
          pulse: 'animate-ping',
        };
      case 'battle':
        return {
          icon: <Swords className="w-4 h-4 text-rose-400" />,
          border: 'border-rose-500/70 shadow-rose-950/50',
          bg: 'bg-rose-950/70',
          pulse: '',
        };
      case 'research':
        return {
          icon: <Zap className="w-4 h-4 text-cyan-400" />,
          border: 'border-cyan-500/70 shadow-cyan-950/50',
          bg: 'bg-cyan-950/70',
          pulse: '',
        };
      case 'colony':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          border: 'border-emerald-500/70 shadow-emerald-950/50',
          bg: 'bg-emerald-950/70',
          pulse: '',
        };
      case 'shipyard':
        return {
          icon: <Rocket className="w-4 h-4 text-blue-400" />,
          border: 'border-blue-500/70 shadow-blue-950/50',
          bg: 'bg-blue-950/70',
          pulse: '',
        };
      case 'anomaly':
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          border: 'border-amber-500/70 shadow-amber-950/50',
          bg: 'bg-amber-950/70',
          pulse: '',
        };
      case 'debris':
        return {
          icon: <Wrench className="w-4 h-4 text-slate-300" />,
          border: 'border-slate-500/70 shadow-slate-950/50',
          bg: 'bg-slate-900/80',
          pulse: '',
        };
      case 'relay':
        return {
          icon: <Crown className="w-4 h-4 text-purple-400" />,
          border: 'border-purple-500/70 shadow-purple-950/50',
          bg: 'bg-purple-950/70',
          pulse: '',
        };
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sound.playClick();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClick = (notif: EmpireNotification) => {
    sound.playClick();
    if (notif.type === 'battle') {
      onOpenBattles();
    } else if (notif.type === 'research') {
      onOpenResearch();
    } else if (notif.type === 'shipyard') {
      onOpenShipyard();
    } else if (notif.type === 'anomaly' || notif.type === 'relay') {
      onOpenSituationLog();
    } else if (notif.systemId) {
      onFocusSystem(notif.systemId);
    }
  };

  return (
    <div className="absolute top-16 left-20 z-25 flex items-center gap-2 select-none pointer-events-none">
      {notifications.map((n) => {
        const style = getIconAndStyle(n.type);
        const isHovered = hoveredId === n.id;

        return (
          <div
            key={n.id}
            className="relative pointer-events-auto"
            onMouseEnter={() => setHoveredId(n.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(n)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleDismiss(e, n.id);
            }}
          >
            {/* Notification Circular Badge */}
            <div
              className={`w-9 h-9 rounded-full ${style.bg} border ${style.border} flex items-center justify-center cursor-pointer shadow-lg transition-transform duration-200 hover:scale-115 relative group`}
            >
              {style.pulse && (
                <span
                  className={`absolute inset-0 rounded-full border border-rose-500 ${style.pulse} opacity-75`}
                />
              )}
              {style.icon}

              {/* Close Pip on Hover */}
              <button
                onClick={(e) => handleDismiss(e, n.id)}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Tactical Stellaris Tooltip */}
            {isHovered && (
              <div className="absolute top-11 left-0 z-40 w-64 bg-[#080d19]/95 border border-[#1a2942] rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono animate-fade-in pointer-events-none">
                <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1 uppercase tracking-wider">
                  <span>{n.title}</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug">{n.description}</p>
                <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9.5px] text-slate-500 flex items-center justify-between">
                  <span className="text-cyan-400">Sol Tık: İncele / Git</span>
                  <span>Sağ Tık: Kapat</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
