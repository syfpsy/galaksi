import React, { useState } from 'react';
import {
  Compass,
  Globe,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { GameState, PlanetSlot, StarSystem } from '../../engine/types';
import { sound } from '../sound';

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
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);

  if (!isOpen || !system) return null;

  const biomeConfig: Record<
    PlanetSlot['type'],
    {
      fill: string;
      stroke: string;
      glow: string;
      label: string;
      bonus: string;
      hasRings?: boolean;
    }
  > = {
    terran: {
      fill: '#10b981',
      stroke: '#34d399',
      glow: '#00f3ff',
      label: 'Yaşanabilir (Terran)',
      bonus: 'Dengeli Üretim (+15% Nüfus Verimi)',
    },
    ocean: {
      fill: '#0284c7',
      stroke: '#38bdf8',
      glow: '#06b6d4',
      label: 'Okyanus Dünyası',
      bonus: 'Kristal Sentezi +30%',
    },
    desert: {
      fill: '#d97706',
      stroke: '#fbbf24',
      glow: '#f59e0b',
      label: 'Çöl Gezegeni',
      bonus: 'Ham Cevher Madenciliği +25%',
      hasRings: true,
    },
    ice: {
      fill: '#38bdf8',
      stroke: '#bae6fd',
      glow: '#e0f2fe',
      label: 'Buzul Gezegeni',
      bonus: 'Ağır Hidrojen & Yakıt +35%',
    },
    volcanic: {
      fill: '#dc2626',
      stroke: '#f87171',
      glow: '#ef4444',
      label: 'Volkanik / Magma',
      bonus: 'Cevher +40%, Yakıt +20%',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="bg-space-900 border border-cyber-cyan/40 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/15 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-sm shadow-cyan-500/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-display tracking-wider">
                  {system.name.toUpperCase()} SİSTEMİ
                </h2>
                <span className="text-[10px] bg-cyber-cyan/20 text-cyber-cyan px-2 py-0.5 rounded-full font-mono border border-cyber-cyan/30">
                  {system.slots.length} Gezegen Yörüngesi
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Sektörel Koordinat ({system.x}, {system.y}) • Taktik Yörünge Şematiği
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Dynamic 2D Solar System Orrery View */}
          <div className="relative bg-space-950 rounded-xl border border-slate-800 p-4 overflow-hidden h-64 flex items-center justify-center shadow-inner shadow-black">
            {/* Ambient Starfield & Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1c2b53_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            <svg viewBox="0 0 700 240" className="w-full h-full max-w-3xl">
              <defs>
                {/* Sun Gradient */}
                <radialGradient id="system-sun-core" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#fffbeb" />
                  <stop offset="55%" stopColor="#f59e0b" />
                  <stop offset="85%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </radialGradient>

                {/* Terran Planet Gradient */}
                <radialGradient id="planet-grad-terran" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="35%" stopColor="#10b981" />
                  <stop offset="70%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#022c22" />
                </radialGradient>

                {/* Ocean Planet Gradient */}
                <radialGradient id="planet-grad-ocean" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="40%" stopColor="#0284c7" />
                  <stop offset="75%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#082f49" />
                </radialGradient>

                {/* Desert Planet Gradient */}
                <radialGradient id="planet-grad-desert" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="40%" stopColor="#d97706" />
                  <stop offset="80%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#451a03" />
                </radialGradient>

                {/* Ice Planet Gradient */}
                <radialGradient id="planet-grad-ice" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#bae6fd" />
                  <stop offset="75%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </radialGradient>

                {/* Volcanic Planet Gradient */}
                <radialGradient id="planet-grad-volcanic" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="35%" stopColor="#dc2626" />
                  <stop offset="75%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>

                {/* Atmospheric Glow Filter */}
                <filter id="atmo-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Central Star on Left */}
              <g transform="translate(45, 120)">
                {/* Corona Glow Pulsing */}
                <circle
                  r="52"
                  fill="url(#system-sun-core)"
                  opacity="0.3"
                  className="animate-corona-pulse"
                />
                {/* Prominences */}
                <g className="animate-flare-pulse" style={{ transformOrigin: '0px 0px' }}>
                  <circle r="42" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,8" opacity="0.6" />
                </g>
                {/* Star Sphere */}
                <circle r="36" fill="url(#system-sun-core)" stroke="#ffffff" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  YILDIZ
                </text>
              </g>

              {/* Sweeping Orbital Paths and Planets */}
              {system.slots.map((slot, idx) => {
                const cx = 150 + idx * 135;
                const cy = 120;
                const radius = 17 + (slot.size % 6);
                const config = biomeConfig[slot.type];
                const planetObj = state.planets[slot.planetId];
                const owner = planetObj ? state.players[planetObj.ownerId] : null;
                const isHovered = hoveredPlanetId === slot.planetId;

                const gradId =
                  slot.type === 'terran'
                    ? 'url(#planet-grad-terran)'
                    : slot.type === 'ocean'
                    ? 'url(#planet-grad-ocean)'
                    : slot.type === 'desert'
                    ? 'url(#planet-grad-desert)'
                    : slot.type === 'ice'
                    ? 'url(#planet-grad-ice)'
                    : 'url(#planet-grad-volcanic)';

                return (
                  <g
                    key={slot.planetId}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPlanetId(slot.planetId)}
                    onMouseLeave={() => setHoveredPlanetId(null)}
                    onClick={() => {
                      sound.playClick();
                      onSelectSlot(system.id, slot.planetId);
                      onClose();
                    }}
                  >
                    {/* Elliptical Sweeping Orbit Track Line */}
                    <line
                      x1={cx}
                      y1="0"
                      x2={cx}
                      y2="240"
                      stroke={isHovered ? '#00f3ff' : '#1e293b'}
                      strokeWidth={isHovered ? 1.5 : 1}
                      strokeDasharray="4,6"
                      opacity={isHovered ? 0.9 : 0.6}
                    />

                    {/* Orbit AU Distance Label */}
                    <text
                      x={cx}
                      y="16"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {idx + 1}. Yuva • {(0.4 + idx * 0.7).toFixed(1)} AU
                    </text>

                    {/* Planetary Rings (Desert World) */}
                    {config.hasRings && (
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={radius * 1.9}
                        ry={radius * 0.55}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                        opacity="0.65"
                        transform={`rotate(-20 ${cx} ${cy})`}
                      />
                    )}

                    {/* Atmospheric Outer Glow Rim */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 3}
                      fill="none"
                      stroke={config.glow}
                      strokeWidth="1.5"
                      opacity={isHovered ? 0.9 : 0.4}
                      filter="url(#atmo-glow)"
                    />

                    {/* Planet 2D Spherical Body */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={gradId}
                      stroke={owner ? owner.color : '#ffffff'}
                      strokeWidth={owner ? 2.5 : 1}
                      className="transition-transform duration-300 group-hover:scale-115"
                    />

                    {/* Biome Specific Surface Details */}
                    {slot.type === 'terran' && (
                      /* Swirling Cloud Band Lines */
                      <g className="pointer-events-none opacity-60">
                        <path
                          d={`M ${cx - radius * 0.8},${cy - 4} Q ${cx},${cy - 8} ${cx + radius * 0.8},${cy - 2}`}
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          fill="none"
                        />
                        <path
                          d={`M ${cx - radius * 0.7},${cy + 5} Q ${cx},${cy + 2} ${cx + radius * 0.7},${cy + 6}`}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </g>
                    )}

                    {/* Day/Night Terminator Crescent Shadow */}
                    <path
                      d={`M ${cx},${cy - radius} A ${radius},${radius} 0 0,1 ${cx},${cy + radius} A ${radius * 0.5},${radius} 0 0,1 ${cx},${cy - radius}`}
                      fill="#030712"
                      opacity="0.45"
                      className="pointer-events-none"
                    />

                    {/* Micro Orbiting Moon */}
                    <g
                      className="animate-spin-slow pointer-events-none"
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    >
                      <circle
                        cx={cx + radius + 11}
                        cy={cy}
                        r="2.5"
                        fill="#cbd5e1"
                      />
                    </g>

                    {/* Orbiting Defense Satellite (If Colonized) */}
                    {owner && (
                      <g
                        className="animate-spin-medium pointer-events-none"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      >
                        <rect
                          x={cx - radius - 10}
                          y={cy - 2}
                          width="4"
                          height="4"
                          fill={owner.color}
                        />
                      </g>
                    )}

                    {/* Selection Reticle Halo on Hover */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 8}
                        fill="none"
                        stroke="#00f3ff"
                        strokeWidth="1.2"
                        strokeDasharray="4,4"
                        className="animate-spin-slow"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                    )}

                    {/* Ownership Flag / Color Ring */}
                    {owner && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 6}
                        fill="none"
                        stroke={owner.color}
                        strokeWidth="1.5"
                        strokeDasharray="5,3"
                      />
                    )}

                    {/* Planet Name Tag */}
                    <text
                      x={cx}
                      y={cy + radius + 18}
                      textAnchor="middle"
                      fill={isHovered ? '#00f3ff' : '#f1f5f9'}
                      fontSize="11"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      {slot.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Planet Slots Detailed Breakdown Cards */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Yörünge Yuvaları ve Biyom Raporu</span>
              <span className="text-slate-500">Seçmek için karta veya görsele tıklayın</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {system.slots.map((slot) => {
                const planetObj = state.planets[slot.planetId];
                const owner = planetObj ? state.players[planetObj.ownerId] : null;
                const isMine = owner && owner.id === activePlayerId;
                const config = biomeConfig[slot.type];
                const isHovered = hoveredPlanetId === slot.planetId;

                return (
                  <div
                    key={slot.planetId}
                    onMouseEnter={() => setHoveredPlanetId(slot.planetId)}
                    onMouseLeave={() => setHoveredPlanetId(null)}
                    onClick={() => {
                      sound.playClick();
                      onSelectSlot(system.id, slot.planetId);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isHovered
                        ? 'bg-space-800/90 border-cyber-cyan shadow-md shadow-cyan-950/40'
                        : 'bg-space-850/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Biome Planet Preview Thumbnail */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden"
                        style={{
                          backgroundColor: `${config.fill}15`,
                          borderColor: `${config.stroke}40`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full shadow-md"
                          style={{
                            backgroundColor: config.fill,
                            boxShadow: `0 0 10px ${config.glow}`,
                          }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100 font-display">
                            {slot.name}
                          </span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${config.fill}20`,
                              color: config.stroke,
                            }}
                          >
                            {config.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 font-mono mt-1">
                          {owner ? (
                            <span style={{ color: owner.color }} className="font-semibold">
                              Hakimiyet: {owner.name} {isMine && '(Siz)'}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              ✓ Boş Yuva (Koloniye Uygun)
                            </span>
                          )}
                          <span className="text-slate-500"> • Boyut: {slot.size}</span>
                        </div>

                        <div className="text-[10px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{config.bonus}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                        owner
                          ? 'bg-space-800 border border-slate-700 text-slate-300 group-hover:text-white group-hover:border-slate-500'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
                      }`}
                    >
                      {owner ? 'İncele' : 'Hedef Seç'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
