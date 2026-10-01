import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Compass,
  Crown,
  Database,
  Flame,
  Landmark,
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
import { evaluatePlayerDirectives } from '../../engine/directives';
import { sound } from '../sound';

export interface EmpireNotification {
  id: string;
  type: 'threat' | 'battle' | 'research' | 'colony' | 'shipyard' | 'anomaly' | 'debris' | 'relay' | 'crisis' | 'transmission' | 'directive' | 'senate';
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
  onOpenTransitRadar?: () => void;
  onOpenAlliance?: (tab?: string) => void;
  onOpenSenate?: () => void;
  onOpenCrisis?: () => void;
}

const StellarisNotificationStripComponent: React.FC<StellarisNotificationStripProps> = ({
  state,
  activePlayerId,
  onFocusSystem,
  onOpenBattles,
  onOpenResearch,
  onOpenShipyard,
  onOpenSituationLog,
  onOpenTransitRadar,
  onOpenAlliance,
  onOpenSenate,
  onOpenCrisis,
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

    // Senate active session alert
    if (state.senate?.currentSession) {
      const sess = state.senate.currentSession;
      notifs.push({
        id: `senate_session_${sess.id}`,
        type: 'senate',
        title: 'SENATO OTURUMU AKTİF',
        description: 'Yeni bir galaktik yasa tasarısı mecliste oylanıyor!',
        timestampMs: sess.proposedAt,
      });
    }

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

    // 2. Pending Radio Transmissions / Diplomatic Comms
    if (state.transmissions) {
      Object.values(state.transmissions).forEach((trans) => {
        if (
          trans.status === 'pending' &&
          (trans.recipientId === activePlayerId || trans.recipientId === 'all') &&
          state.timeMs < trans.expiresAtMs
        ) {
          notifs.push({
            id: `trans_${trans.id}`,
            type: 'transmission',
            title: `TELSİZ: ${trans.senderName.toUpperCase()}`,
            description: `${trans.title}: ${trans.message.slice(0, 95)}...`,
            timestampMs: trans.timestampMs,
            systemId: trans.systemId,
          });
        }
      });
    }

    // 3. Active Sector Crises & Dynamic Events
    if (state.sectorEvents) {
      Object.values(state.sectorEvents).forEach((crisis) => {
        if (!crisis.resolved && state.timeMs < crisis.expiresAtMs) {
          const remainingMins = Math.max(1, Math.round((crisis.expiresAtMs - state.timeMs) / 60000));
          notifs.push({
            id: `crisis_${crisis.id}`,
            type: 'crisis',
            title: crisis.title.toUpperCase(),
            description: `${crisis.description.slice(0, 110)}... (Kalan Süre: ${remainingMins} dk)`,
            timestampMs: crisis.startTimeMs,
            systemId: crisis.systemId,
          });
        }
      });
    }

    // 4. Galactic Endgame Crisis (Phase 16)
    if (state.crisis && state.crisis.stage !== 'dormant' && state.crisis.stage !== 'defeated') {
      notifs.unshift({
        id: `galactic_crisis_${state.crisis.stage}`,
        type: 'crisis',
        title: '🚨 BOYUTLARARASI HİÇLİK İSTİLASI',
        description: `Kriz Aşaması: ${state.crisis.stage.toUpperCase()} | Kalkan: %${state.crisis.riftIntegrity} | Tıklayarak Kriz Merkezini açın!`,
        timestampMs: state.crisis.startedAtMs,
        systemId: state.crisis.epicenterSystemId,
      });
    }

    // 5. Scan recent event log for significant events
    const recentEvents = state.eventLog
      .filter((e) => !e.playerId || e.playerId === activePlayerId)
      .slice(-12)
      .reverse();

    recentEvents.forEach((evt) => {
      let notifType: EmpireNotification['type'] | null = null;
      let title = '';

      if (evt.type === 'ancient_titan_slain') {
        notifType = 'crisis';
        title = 'KADİM TİTAN MAĞLUP EDİLDİ';
      } else if (evt.type === 'battle_occurred' || evt.type.includes('combat')) {
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

      if (notifType && notifs.length < 8 && !notifs.some((n) => n.id === evt.id)) {
        notifs.push({
          id: evt.id,
          type: notifType,
          title,
          description: evt.description,
          timestampMs: evt.timeMs,
        });
      }
    });

    // 4. Completed Directives Awaiting Reward Claim
    const myDirs = evaluatePlayerDirectives(state, activePlayerId);
    const unclaimedDirs = myDirs.filter((d) => d.isCompleted && !d.isClaimed);
    if (unclaimedDirs.length > 0 && notifs.length < 8) {
      notifs.push({
        id: `unclaimed_dir_${unclaimedDirs[0].id}`,
        type: 'directive',
        title: '🎯 DİREKTİF ÖDÜLÜ HAZIR',
        description: `${unclaimedDirs[0].title} tamamlandı! Ödülü kütükten almak için tıklayın.`,
        timestampMs: state.timeMs,
      });
    }

    setNotifications(notifs);
  }, [state.eventLog.length, state.fleets, state.sectorEvents, state.transmissions, state.timeMs, activePlayerId]);

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
      case 'crisis':
        return {
          icon: <Flame className="w-4 h-4 text-amber-400" />,
          border: 'border-amber-500/90 shadow-amber-950/70',
          bg: 'bg-amber-950/90',
          pulse: 'animate-pulse',
        };
      case 'transmission':
        return {
          icon: <Radio className="w-4 h-4 text-purple-300" />,
          border: 'border-purple-400 shadow-purple-950/80',
          bg: 'bg-purple-950/90',
          pulse: 'animate-pulse',
        };
      case 'directive':
        return {
          icon: <Award className="w-4 h-4 text-amber-300" />,
          border: 'border-amber-400 shadow-amber-950/80',
          bg: 'bg-amber-950/90',
          pulse: 'animate-pulse',
        };
      case 'senate':
        return {
          icon: <Landmark className="w-4 h-4 text-amber-300" />,
          border: 'border-amber-400 shadow-amber-950/80',
          bg: 'bg-amber-950/90',
          pulse: 'animate-pulse',
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
    if (notif.type === 'threat' && onOpenTransitRadar) {
      onOpenTransitRadar();
    } else if (notif.type === 'battle') {
      onOpenBattles();
    } else if (notif.type === 'research') {
      onOpenResearch();
    } else if (notif.type === 'shipyard') {
      onOpenShipyard();
    } else if (notif.type === 'anomaly' || notif.type === 'relay' || notif.type === 'directive') {
      onOpenSituationLog();
    } else if (notif.type === 'transmission') {
      if (onOpenAlliance) onOpenAlliance('comms');
    } else if (notif.type === 'senate') {
      if (onOpenSenate) onOpenSenate();
    } else if (notif.type === 'crisis') {
      if (notif.id.startsWith('galactic_crisis_') && onOpenCrisis) {
        onOpenCrisis();
      } else if (notif.systemId) {
        onFocusSystem(notif.systemId);
      } else {
        onOpenSituationLog();
      }
    } else if (notif.systemId) {
      onFocusSystem(notif.systemId);
    }
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[25] flex items-center gap-2 select-none pointer-events-none">
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
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#0a1622] border border-[#1c3647] text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Tactical Stellaris Tooltip */}
            {isHovered && (
              <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-40 w-64 stellaris-tooltip rounded-sm p-3 shadow-2xl text-xs font-mono animate-fade-in pointer-events-none">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold mb-1 uppercase tracking-wider">
                  <span>{n.title}</span>
                </div>
                <p className="text-white text-xs leading-snug">{n.description}</p>
                <div className="mt-2 pt-1.5 border-t border-[#1c3647] text-[10px] text-slate-400 flex items-center justify-between font-mono font-medium">
                  <span className="text-cyan-300 font-bold">Sol Tık: İncele / Git</span>
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

export const StellarisNotificationStrip = React.memo(StellarisNotificationStripComponent);
