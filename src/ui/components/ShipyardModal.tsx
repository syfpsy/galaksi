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

export const ShipyardModal: React.FC<ShipyardModalProps> = ({
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
    <div className={isDocked ? "w-full h-full bg-[#080d19]/98 border-r border-[#1a2942] flex flex-col shadow-2xl overflow-hidden select-none" : "bg-space-900 border border-cyber-cyan/30 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden"}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-cyber-cyan" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Gemi Tersanesi — {planet.name}
              </h2>
              <span className="text-xs text-cyber-cyan font-mono">
                Tersane Seviyesi: {shipyardLevel}
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

        {/* Shipyard Queue (if active) */}
        {planet.shipyardQueue.length > 0 && (
          <div className="p-3 bg-space-950/80 border-b border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Devam Eden Üretim Kuyruğu
            </div>
            <div className="space-y-1.5">
              {planet.shipyardQueue.map((item, idx) => {
                const remainingMs = Math.max(0, item.nextUnitFinishTime - currentTimeMs);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-space-850 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-200">
                      {item.count - item.completed}x {SHIP_STATS[item.shipType].nameTr}
                    </span>
                    <span className="text-cyber-cyan flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      {formatDuration(remainingMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ship List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                className={`p-3 rounded-lg border transition-all ${
                  isLocked
                    ? 'bg-space-950/40 border-slate-800/40 opacity-60'
                    : 'bg-space-850/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* High-Resolution Ship Concept Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-space-950 shrink-0 relative group/thumb shadow-sm shadow-cyan-950/40">
                      <img
                        src={SHIP_ART[st]}
                        alt={stats.nameTr}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 font-display">
                          {stats.nameTr}
                        </span>
                        <span className="text-[10px] font-mono bg-space-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                          {stats.roleTr}
                        </span>
                      </div>

                      {/* Stats Specs */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400 font-mono">
                        <span>Saldırı: <strong className="text-rose-400">{stats.attack}</strong></span>
                        <span>Gövde+Kalkan: <strong className="text-emerald-400">{stats.hull + stats.shield}</strong></span>
                        <span>Hız: <strong className="text-cyber-cyan">{stats.speed}</strong></span>
                        <span>Kargo: <strong className="text-amber-400">{stats.cargoCapacity}</strong></span>
                        <span>Süre: {formatDuration(unitTimeMs)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Build Controls */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {/* Multiplier Presets */}
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
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                              buildCount === preset
                                ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan font-bold'
                                : 'bg-space-900 border-slate-700 text-slate-400 hover:text-white'
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
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-all font-bold"
                            title="Mevcut kaynaklarla üretilebilecek maksimum adet"
                          >
                            Maks ({Math.min(50, maxAffordable)})
                          </button>
                        )}
                      </div>

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
                        className="w-14 bg-space-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-slate-100 focus:outline-none focus:border-cyber-cyan"
                      />

                      <button
                        disabled={isLocked || !canAfford}
                        onClick={() => {
                          sound.playClick();
                          onBuildShip(planet.id, st, buildCount);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isLocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-cyber-cyan text-space-950 hover:bg-cyan-300 font-bold'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>{isLocked ? 'Sv. 3 Gerekli' : 'Üret'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Fabrication Progress Bar if in Queue */}
                {activeQueueItem && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
                      <span>Üretiliyor ({activeQueueItem.completed + 1} / {activeQueueItem.count})</span>
                      <span>Kalan: {formatDuration(remainingUnitMs)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_#00f3ff]"
                        style={{ width: `${Math.round(unitProgress * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Total Cost Badges */}
                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                  <span className={planet.resources.ore >= totalCost.ore ? 'text-amber-400' : 'text-rose-400'}>
                    {totalCost.ore} Cevher
                  </span>
                  <span>•</span>
                  <span className={planet.resources.crystal >= totalCost.crystal ? 'text-cyber-cyan' : 'text-rose-400'}>
                    {totalCost.crystal} Kristal
                  </span>
                  {totalCost.fuel > 0 && (
                    <>
                      <span>•</span>
                      <span className={planet.resources.fuel >= totalCost.fuel ? 'text-rose-400' : 'text-rose-600'}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      {content}
    </div>
  );
};
