import React, { useState } from 'react';
import { Clock, Hammer, Shield, Swords, Wrench, X } from 'lucide-react';
import { getShipBuildDurationMs, SHIP_STATS } from '../../engine/constants';
import { Planet, ShipType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface ShipyardModalProps {
  planet: Planet | undefined;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onBuildShip: (planetId: string, shipType: ShipType, count: number) => void;
  currentTimeMs: number;
}

const SHIP_ART: Record<ShipType, string> = {
  scout: '/assets/art/scout.png',
  transport: '/assets/art/transport.png',
  fighter: '/assets/art/fighter.png',
  battleship: '/assets/art/battleship.png',
};

const ShipyardModalComponent: React.FC<ShipyardModalProps> = ({
  planet,
  isOpen,
  isDocked = false,
  onClose,
  onBuildShip,
  currentTimeMs,
}) => {
  const [counts, setCounts] = useState<Record<ShipType, number>>({
    scout: 1,
    transport: 1,
    fighter: 1,
    battleship: 1,
  });

  if (!isOpen || !planet) return null;

  const shipTypes: ShipType[] = ['scout', 'transport', 'fighter', 'battleship'];
  const shipyardLevel = planet.buildings.shipyard || 0;

  const content = (
    <div
      className={
        isDocked
          ? 'w-[480px] min-w-[480px] max-w-[480px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#18374b] rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wrench className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold stellaris-gold font-display uppercase tracking-wider">
              Gemi Tersanesi — {planet.name}
            </h2>
            <span className="text-[11px] text-cyan-300 font-mono">
              Tersane Seviyesi: {shipyardLevel}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
          title="Tersaneyi Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shipyard Queue (if active) */}
      {planet.shipyardQueue.length > 0 && (
        <div className="stellaris-section-header p-3">
          <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
            <span>DEVAM EDEN ÜRETİM KUYRUĞU</span>
            <span className="text-cyan-400 font-mono">
              {planet.shipyardQueue.reduce((acc, q) => acc + (q.count - q.completed), 0)} Gemi Sırada
            </span>
          </div>
          <div className="space-y-1.5">
            {planet.shipyardQueue.map((item, idx) => {
              const remainingMs = Math.max(0, item.nextUnitFinishTime - currentTimeMs);
              const unitDuration = Math.max(1, item.unitBuildTimeMs);
              const unitElapsed = Math.max(0, unitDuration - remainingMs);
              const unitProgress = Math.min(100, Math.max(0, Math.round((unitElapsed / unitDuration) * 100)));

              return (
                <div
                  key={idx}
                  className="flex flex-col gap-1.5 stellaris-item-card px-3 py-2 rounded-sm text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-bold">
                      {item.count - item.completed}x {SHIP_STATS[item.shipType].nameTr}
                      {item.completed > 0 && ` (${item.completed} Tamamlandı)`}
                    </span>
                    <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      {formatDuration(remainingMs)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#08121a] rounded-none overflow-hidden border border-[#1b3b50]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                      style={{ width: `${unitProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ship List */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2.5 scrollbar-none text-xs font-mono">
        {shipTypes.map((st) => {
          const stats = SHIP_STATS[st];
          const buildCount = counts[st];
          const totalCost = {
            ore: stats.cost.ore * buildCount,
            crystal: stats.cost.crystal * buildCount,
            fuel: stats.cost.fuel * buildCount,
          };

          const canAfford =
            planet.resources.ore >= totalCost.ore &&
            planet.resources.crystal >= totalCost.crystal &&
            planet.resources.fuel >= totalCost.fuel;

          const isLocked = st === 'battleship' && shipyardLevel < 3;
          const unitTimeMs = getShipBuildDurationMs(st, shipyardLevel);

          const maxAffordable = Math.max(
            0,
            Math.min(
              Math.floor(planet.resources.ore / stats.cost.ore),
              Math.floor(planet.resources.crystal / stats.cost.crystal),
              stats.cost.fuel > 0 ? Math.floor(planet.resources.fuel / stats.cost.fuel) : 999
            )
          );

          // Active build in queue for this ship type
          const activeQueueItem = planet.shipyardQueue.find((q) => q.shipType === st);
          const remainingUnitMs = activeQueueItem
            ? Math.max(0, activeQueueItem.nextUnitFinishTime - currentTimeMs)
            : 0;
          const unitProgress = activeQueueItem
            ? Math.min(1, Math.max(0, 1 - remainingUnitMs / activeQueueItem.unitBuildTimeMs))
            : 0;

          return (
            <div
              key={st}
              className={`p-3 rounded-sm stellaris-item-card transition-all ${
                isLocked ? 'opacity-50 !border-slate-800' : ''
              }`}
            >
              {/* Top Tier: Concept Art, Title & Build Action Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 w-[52px] h-[52px] rounded-sm overflow-hidden border border-[#1b3b50] bg-black shrink-0 relative group/thumb shadow-sm">
                    <img
                      src={SHIP_ART[st]}
                      alt={stats.nameTr}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 font-display">
                        {stats.nameTr}
                      </span>
                      <span className="stellaris-badge text-cyan-300 border-cyan-500/40">
                        {stats.roleTr}
                      </span>
                    </div>
                    {/* Stats Specs Inline */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[10.5px] text-slate-400 font-mono">
                      <span>Saldırı: <strong className="text-rose-400">{stats.attack}</strong></span>
                      <span>Kalkan: <strong className="text-emerald-400">{stats.hull + stats.shield}</strong></span>
                      <span>Hız: <strong className="text-cyan-300">{stats.speed}</strong></span>
                      <span>Birim: {formatDuration(unitTimeMs)}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  disabled={isLocked || !canAfford}
                  onClick={() => {
                    sound.playClick();
                    onBuildShip(planet.id, st, buildCount);
                  }}
                  className="px-3.5 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all stellaris-btn-metallic text-cyan-300 font-bold shrink-0 cursor-pointer"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>{isLocked ? 'Sv. 3 Gerekli' : 'İnşa Et'}</span>
                </button>
              </div>

              {/* Lower Tier: Presets & Quantity Controls */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#18374b]">
                <div className="flex items-center gap-1">
                  {[1, 5, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        sound.playClick();
                        setCounts((prev) => ({ ...prev, [st]: preset }));
                      }}
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                        buildCount === preset
                          ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                          : 'stellaris-btn-metallic text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}x
                    </button>
                  ))}
                  {maxAffordable > 0 && (
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        sound.playClick();
                        setCounts((prev) => ({ ...prev, [st]: Math.min(50, maxAffordable) }));
                      }}
                      className="px-2 py-0.5 rounded-sm text-[10px] font-mono stellaris-btn-metallic text-emerald-300 !border-emerald-500/50 hover:text-white font-bold cursor-pointer"
                      title="Mevcut kaynaklarla üretilebilecek maksimum adet"
                    >
                      Maks ({Math.min(50, maxAffordable)})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Adet:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    disabled={isLocked}
                    value={buildCount}
                    onChange={(e) =>
                      setCounts((prev) => ({
                        ...prev,
                        [st]: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-12 bg-[#07101a] border border-[#1a384f] rounded-sm px-1.5 py-0.5 text-center font-mono text-xs text-[#e5c578] focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Live Fabrication Progress Bar if in Queue */}
              {activeQueueItem && (
                <div className="mt-2 pt-2 border-t border-[#18374b]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
                    <span>Üretiliyor ({activeQueueItem.completed + 1} / {activeQueueItem.count})</span>
                    <span>Kalan: {formatDuration(remainingUnitMs)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#060c14] rounded-full overflow-hidden border border-[#18374b]">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_#00f3ff]"
                      style={{ width: `${Math.round(unitProgress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Total Cost Badges */}
              <div className="flex items-center gap-3 mt-2 text-[10.5px] font-mono">
                <span className={planet.resources.ore >= totalCost.ore ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                  {totalCost.ore} Cevher
                </span>
                <span>•</span>
                <span className={planet.resources.crystal >= totalCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                  {totalCost.crystal} Kristal
                </span>
                {totalCost.fuel > 0 && (
                  <>
                    <span>•</span>
                    <span className={planet.resources.fuel >= totalCost.fuel ? 'text-amber-400' : 'text-rose-400 font-bold'}>
                      {totalCost.fuel} Yakıt
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      {content}
    </div>
  );
};

export const ShipyardModal = React.memo(ShipyardModalComponent);
