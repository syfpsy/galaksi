import React from 'react';
import { Compass, Globe, Sparkles, Swords, Truck, X } from 'lucide-react';
import { GameState, PlanetSlot, StarSystem } from '../../engine/types';

interface SystemInspectionModalProps {
  system: StarSystem | null;
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot: (systemId: string, planetId: string) => void;
}

export const SystemInspectionModal: React.FC<SystemInspectionModalProps> = ({
  system,
  state,
  activePlayerId,
  isOpen,
  onClose,
  onSelectSlot,
}) => {
  if (!isOpen || !system) return null;

  const biomeColors: Record<PlanetSlot['type'], { fill: string; stroke: string; label: string }> = {
    terran: { fill: '#10b981', stroke: '#34d399', label: 'Yaşanabilir (Terran)' },
    ocean: { fill: '#0284c7', stroke: '#38bdf8', label: 'Okyanus Dünyası' },
    desert: { fill: '#d97706', stroke: '#fbbf24', label: 'Çöl Gezegeni' },
    ice: { fill: '#38bdf8', stroke: '#bae6fd', label: 'Buzul Gezegeni' },
    volcanic: { fill: '#dc2626', stroke: '#f87171', label: 'Volkanik / Magma' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-space-900 border border-cyber-cyan/40 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                {system.name} Sistemi — Yörünge İncelemesi
              </h2>
              <span className="text-xs text-cyber-cyan font-mono">
                {system.slots.length} Gezegen Yuvası • Koordinat ({system.x}, {system.y})
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Orbital Schematic SVG */}
          <div className="bg-space-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden h-56">
            <svg viewBox="0 0 600 200" className="w-full h-full max-w-2xl">
              {/* Central Star */}
              <circle cx="50" cy="100" r="28" fill="#ffaa00" />
              <circle cx="50" cy="100" r="38" fill="none" stroke="#ffaa00" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />

              {/* Orbits and Planets */}
              {system.slots.map((slot, idx) => {
                const cx = 140 + idx * 110;
                const cy = 100;
                const biome = biomeColors[slot.type];
                const planetObj = state.planets[slot.planetId];
                const owner = planetObj ? state.players[planetObj.ownerId] : null;

                return (
                  <g key={slot.planetId} className="cursor-pointer group" onClick={() => onSelectSlot(system.id, slot.planetId)}>
                    {/* Orbit Line */}
                    <line x1={cx} y1="0" x2={cx} y2="200" stroke="#1e293b" strokeDasharray="2,4" />

                    {/* Planet Body */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={14 + (slot.size % 6)}
                      fill={biome.fill}
                      stroke={owner ? owner.color : biome.stroke}
                      strokeWidth={owner ? 2.5 : 1}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Ownership Ring */}
                    {owner && (
                      <circle cx={cx} cy={cy} r={22} fill="none" stroke={owner.color} strokeWidth="1" strokeDasharray="4,2" />
                    )}

                    {/* Name tag */}
                    <text x={cx} y={cy + 34} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                      {slot.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Planet Slots List */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Gezegen Yuvaları ve Koloni Durumu
            </div>

            {system.slots.map((slot) => {
              const planetObj = state.planets[slot.planetId];
              const owner = planetObj ? state.players[planetObj.ownerId] : null;
              const isMine = owner && owner.id === activePlayerId;
              const biome = biomeColors[slot.type];

              return (
                <div
                  key={slot.planetId}
                  className="bg-space-850 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: biome.fill }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {slot.name}
                        <span className="text-[10px] font-mono text-slate-400 bg-space-900 px-1.5 py-0.2 rounded border border-slate-800">
                          {biome.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {owner ? (
                          <span style={{ color: owner.color }}>
                            Hakim: {owner.name} {isMine && '(Siz)'}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Boş Yuva (Kolonileştirilebilir)</span>
                        )}
                        <span> • Boyut: {slot.size}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSlot(system.id, slot.planetId);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                      owner
                        ? 'bg-space-800 border border-slate-700 text-slate-300 hover:text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                    }`}
                  >
                    {owner ? 'Gezegeni İncele' : 'Koloni Hedefi Seç'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
