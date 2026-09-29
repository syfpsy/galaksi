import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  GripHorizontal,
  Lock,
  Maximize2,
  Minimize2,
  Navigation,
  Package,
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

  // Floating Position & Drag State — lazy-initialized to avoid mount snap
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 200, y: 300 };
    const initialWidth = 420; // default compact width
    const initialX = Math.max(70, Math.round((window.innerWidth - initialWidth) / 2));
    const initialY = Math.max(60, window.innerHeight - 340);
    return { x: initialX, y: initialY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sizeMode, setSizeMode] = useState<'compact' | 'wide'>('compact');

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);


  // Window drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header/grip or empty header space (not buttons)
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);

    const currentX = position?.x ?? 200;
    const currentY = position?.y ?? 200;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const cardWidth = cardRef.current?.offsetWidth || (sizeMode === 'wide' ? 560 : 420);
      const cardHeight = cardRef.current?.offsetHeight || 60;

      const newX = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, dragStartRef.current.posY + dy));

      setPosition({ x: newX, y: newY });
    },
    [sizeMode]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch Drag Support for Mobile/Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);

    const currentX = position?.x ?? 200;
    const currentY = position?.y ?? 200;

    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: currentX,
      posY: currentY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.mouseX;
    const dy = touch.clientY - dragStartRef.current.mouseY;

    const cardWidth = cardRef.current?.offsetWidth || (sizeMode === 'wide' ? 560 : 420);
    const cardHeight = cardRef.current?.offsetHeight || 60;

    const newX = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, dragStartRef.current.posX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, dragStartRef.current.posY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  if (!fleet) return null;

  const isOwnFleet = fleet.ownerId === activePlayerId;
  const owner = state.players[fleet.ownerId];
  const originSys = state.map.systems[fleet.originSystemId];
  const targetSys = state.map.systems[fleet.targetSystemId];

  // Tactical summary stats
  let totalShipCount = 0;
  let totalAttack = 0;
  let totalDurability = 0;

  (['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).forEach((st) => {
    const count = fleet.ships[st] || 0;
    totalShipCount += count;
    totalAttack += count * SHIP_STATS[st].attack;
    totalDurability += count * (SHIP_STATS[st].hull + SHIP_STATS[st].shield);
  });

  const militaryPower = Math.round(
    (fleet.ships.battleship || 0) * 140 +
    (fleet.ships.fighter || 0) * 35 +
    (fleet.ships.scout || 0) * 12 +
    (fleet.ships.transport || 0) * 6
  );
  const formattedPower = militaryPower >= 1000 ? `${(militaryPower / 1000).toFixed(1)}K` : `${militaryPower}`;

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

  // Cargo contents
  const hasCargo = fleet.cargo && ((fleet.cargo.ore || 0) > 0 || (fleet.cargo.crystal || 0) > 0 || (fleet.cargo.fuel || 0) > 0);

  const missionLabels: Record<string, string> = {
    transport: '📦 Kaynak İkmal Seferi',
    colonize: '🏛️ Gezegen Koloni Seferi',
    explore: '📡 Derin Uzay Keşif Seferi',
    attack: '⚔️ Sektör Taarruz Seferi',
    intercept: '🎯 Rota Önleme Operasyonu',
    support: '🛡️ Müttefik Savunma Desteği',
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    in_transit: { label: 'Rotada İlerliyor', color: 'text-cyan-400 bg-[#0c1a24] border-cyan-500/40' },
    returning: { label: 'Geri Dönüş Rotasında', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' },
    intercepting: { label: 'Hedef Önleniyor', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' },
    orbiting: { label: 'Yörüngede Konuşlu', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' },
    destroyed: { label: 'İmha Edildi', color: 'text-slate-500 bg-slate-900 border-slate-700' },
  };

  const cardWidthClass = isCollapsed
    ? 'w-[360px]'
    : sizeMode === 'wide'
    ? 'w-[560px]'
    : 'w-[430px]';

  return (
    <div
      ref={cardRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-40 ${cardWidthClass} select-none transition-shadow ${
        isDragging ? 'shadow-cyan-950/80 shadow-2xl cursor-grabbing' : 'shadow-2xl'
      }`}
    >
      <div className="stellaris-outliner border border-[#18374b] rounded-sm shadow-2xl overflow-hidden relative text-slate-100 flex flex-col animate-fade-in">
        {/* Top Accent Line in Owner Color with Neon Glow */}
        <div
          className="h-0.5 w-full"
          style={{
            backgroundColor: owner?.color || '#00f3ff',
            boxShadow: `0 0 8px ${owner?.color || '#00f3ff'}`,
          }}
        />

        {/* DRAGGABLE HEADER BAR */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`px-3 py-2 stellaris-outliner-header flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors ${
            isDragging ? 'bg-[#152e40]' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag Handle Grip Icon */}
            <GripHorizontal className="w-4 h-4 text-slate-500 shrink-0" />

            {/* Faction Emblem Badge */}
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${owner?.color || '#00f3ff'}20`,
                borderColor: `${owner?.color || '#00f3ff'}60`,
              }}
            >
              <Navigation className="w-3.5 h-3.5" style={{ color: owner?.color || '#00f3ff' }} />
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <span className="text-xs font-bold font-display text-white truncate">
                {fleet.name || 'Filo'}
              </span>
              <span className="stellaris-power text-[11px] font-mono shrink-0">
                ⚡ {formattedPower}
              </span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border shrink-0"
                style={{
                  backgroundColor: `${owner?.color || '#00f3ff'}15`,
                  borderColor: `${owner?.color || '#00f3ff'}40`,
                  color: owner?.color || '#00f3ff',
                }}
              >
                {owner?.name || 'Komutan'}
              </span>
            </div>
          </div>

          {/* Right Action Icons: Status, Size Mode, Collapse, Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Pill */}
            <span
              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-sm border ${
                statusLabels[fleet.status]?.color || 'text-slate-300'
              }`}
            >
              {isCollapsed ? (
                remainingMs > 0 ? formatDuration(remainingMs) : statusLabels[fleet.status]?.label
              ) : (
                statusLabels[fleet.status]?.label || fleet.status
              )}
            </span>

            {/* Quick Recall Icon if Collapsed & eligible */}
            {isCollapsed && canRecall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  onRecallFleet(fleet.id);
                }}
                className="p-1 rounded-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer"
                title="Geri Çağır"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            {/* Size Mode Toggle (Compact vs Wide) */}
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setSizeMode((prev) => (prev === 'compact' ? 'wide' : 'compact'));
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-[#1a384f] transition-colors cursor-pointer"
                title={sizeMode === 'compact' ? 'Genişletilmiş Detay Görünümü' : 'Kompakt Görünüm'}
              >
                {sizeMode === 'compact' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Collapse / Expand Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setIsCollapsed((prev) => !prev);
              }}
              className="p-1 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-[#1a384f] transition-colors cursor-pointer"
              title={isCollapsed ? 'Paneli Genişlet' : 'Paneli Küçült (Kollaps)'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onClose();
              }}
              className="p-1 rounded-sm text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* EXPANDED CONTENT BODY */}
        {!isCollapsed && (
          <div className="p-3.5 flex flex-col gap-3 font-mono text-xs">
            {/* Sub-header: Mission Name & Target */}
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#18374b]">
              <span className="stellaris-gold font-bold">
                {missionLabels[fleet.mission] || 'Standart Sefer'}
              </span>
              <span className="text-slate-400 text-[10px]">
                Hedef Sistem: <strong className="text-cyan-300">{targetSys?.name || fleet.targetSystemId}</strong>
              </span>
            </div>

            {/* Flight Progress Bar (if in flight) */}
            {fleet.status !== 'orbiting' && (
              <div className="bg-[#070e17]/90 p-2.5 rounded-sm border border-[#18374b] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400">{originSys?.name || 'Başlangıç'}</span>
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
                <div className="relative w-full h-2 bg-[#060c14] rounded-full overflow-hidden border border-[#18374b]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white transition-all duration-300 rounded-full shadow-[0_0_8px_#00f3ff]"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* 50% Threshold Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_4px_#f59e0b]"
                    style={{ left: '50%' }}
                    title="%50 Geri Çağırma Kilidi (Point of No Return)"
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>İlerleme: %{progressPercent}</span>
                  {fleet.status === 'in_transit' && (
                    <span>
                      {isRecallLocked ? (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" /> Geri Dönüş Kilitlendi (%50 aşıldı)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          ✓ Geri Çağırma Açık (%{progressPercent} / %50)
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cargo Payload Row (if any) */}
            {hasCargo && (
              <div className="p-2 rounded-sm stellaris-item-card flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Taşınan Kargo:</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  {(fleet.cargo.ore || 0) > 0 && <span>{Math.round(fleet.cargo.ore!)} Cevher</span>}
                  {(fleet.cargo.crystal || 0) > 0 && <span>• {Math.round(fleet.cargo.crystal!)} Kristal</span>}
                  {(fleet.cargo.fuel || 0) > 0 && <span>• {Math.round(fleet.cargo.fuel!)} Yakıt</span>}
                </div>
              </div>
            )}

            {/* Ship Roster & Tactical Specs */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Filo Bileşimi</span>
                <span className="text-cyan-400 font-bold">{totalShipCount} Gemi</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                  const count = fleet.ships[st] || 0;
                  const names: Record<ShipType, string> = {
                    scout: 'Keşif',
                    transport: 'Nakliye',
                    fighter: 'Avcı',
                    battleship: 'Kruvazör',
                  };

                  return (
                    <div
                      key={st}
                      className={`p-1.5 rounded-sm stellaris-item-card text-center transition-all ${
                        count > 0 ? '!border-cyan-500/50' : 'opacity-40'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">{names[st]}</div>
                      <div className="text-xs font-bold text-cyan-300 mt-0.5">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Metrics & Tactical Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#18374b] text-xs">
              <div className="flex items-center gap-3 text-slate-400 text-[10.5px]">
                <span>
                  💥 Güç: <strong className="text-rose-400">{totalAttack}</strong>
                </span>
                <span>
                  🛡️ Gövde: <strong className="text-emerald-400">{totalDurability}</strong>
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
                    className="stellaris-btn-metallic !border-amber-500/60 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer"
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
                    className="stellaris-btn-metallic !border-rose-500/60 text-rose-300 font-bold text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer"
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
                    className="stellaris-btn-metallic !border-cyan-500/60 text-cyan-300 font-bold text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Sefer Sevk Et</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
