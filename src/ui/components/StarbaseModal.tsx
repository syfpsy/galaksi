import React, { useState } from 'react';
import {
  Compass,
  Cpu,
  Hammer,
  Radio,
  Shield,
  Sparkles,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { GameState, StarbaseModuleType } from '../../engine/types';
import {
  getNextStarbaseTier,
  getStarbaseEffectiveStats,
  STARBASE_MODULE_CONFIG,
  STARBASE_TIER_CONFIG,
} from '../../engine/starbases';
import { sound } from '../sound';

interface StarbaseModalProps {
  systemId: string | null;
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeStarbase: (systemId: string, planetId: string) => void;
  onInstallModule: (systemId: string, planetId: string, moduleType: StarbaseModuleType) => void;
  onDismantleModule: (systemId: string, moduleIndex: number) => void;
}

const StarbaseModalComponent: React.FC<StarbaseModalProps> = ({
  systemId,
  state,
  activePlayerId,
  isOpen,
  onClose,
  onUpgradeStarbase,
  onInstallModule,
  onDismantleModule,
}) => {
  const [selectedModuleToInstall, setSelectedModuleToInstall] = useState<StarbaseModuleType | null>(null);

  if (!isOpen || !systemId) return null;

  const system = state.map.systems[systemId];
  if (!system) return null;

  const starbase = state.starbases?.[systemId];
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const homeOrLocalColony =
    myPlanets.find((p) => p.systemId === systemId) ||
    myPlanets.find((p) => p.isHomeworld) ||
    myPlanets[0];

  const [selectedColonyId, setSelectedColonyId] = useState<string>(homeOrLocalColony?.id || '');
  const fundingPlanet = state.planets[selectedColonyId] || homeOrLocalColony;

  const isOwner = starbase && starbase.ownerId === activePlayerId;
  const owner = starbase ? state.players[starbase.ownerId] : null;

  const weaponsLevel = state.players[activePlayerId]?.research.weapons || 0;
  const stats = starbase ? getStarbaseEffectiveStats(starbase, weaponsLevel) : null;
  const tierConfig = starbase ? STARBASE_TIER_CONFIG[starbase.tier] : null;
  const nextTier = starbase ? getNextStarbaseTier(starbase.tier) : null;
  const nextTierConfig = nextTier ? STARBASE_TIER_CONFIG[nextTier] : null;

  const canAffordUpgrade =
    fundingPlanet &&
    nextTierConfig &&
    fundingPlanet.resources.ore >= nextTierConfig.cost.ore &&
    fundingPlanet.resources.crystal >= nextTierConfig.cost.crystal &&
    fundingPlanet.resources.fuel >= nextTierConfig.cost.fuel;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fade-in"
    >
      <div className="stellaris-modal rounded-sm border border-[#1c3647] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-cyan-400 shadow-inner">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                  {system.name.toUpperCase()} YÖRGÜNGE ÜSSÜ
                </h2>
                {starbase && (
                  <span className="stellaris-badge text-cyan-300 border-[#1c445c] font-bold">
                    {tierConfig?.nameTr.toUpperCase()}
                  </span>
                )}
                {owner && !isOwner && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border font-semibold"
                    style={{ color: owner.color, borderColor: `${owner.color}60` }}
                  >
                    Hakimiyet: {owner.name}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] text-slate-300 font-mono">
                Sektörel Koordinat ({system.x}, {system.y}) • Taktik Savunma & Lojistik Komuta Masası
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-sm stellaris-btn-metallic flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Funding Colony Selector */}
          {myPlanets.length > 1 && isOwner && (
            <div className="p-2.5 rounded-sm bg-[#0b1b28]/60 border border-[#1b3b4f] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                İnşaat / Yükseltme Finanse Eden Koloni:
              </span>
              <select
                value={selectedColonyId}
                onChange={(e) => setSelectedColonyId(e.target.value)}
                className="bg-[#091a27] border border-[#234b63] text-cyan-300 text-xs rounded-sm px-2 py-1 outline-none font-mono font-bold cursor-pointer"
              >
                {myPlanets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({Math.round(p.resources.ore)}C / {Math.round(p.resources.crystal)}K / {Math.round(p.resources.fuel)}Y)
                  </option>
                ))}
              </select>
            </div>
          )}

          {starbase && stats && tierConfig ? (
            <>
              {/* Tactical Status & Gauges Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* Hull */}
                <div className="p-2.5 rounded-sm stellaris-item-card border border-[#1d3d52]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Gövde Dayanımı</div>
                  <div className="text-base font-bold text-emerald-400 font-mono flex items-center justify-between mt-0.5">
                    <span>{Math.round(starbase.hull)} / {stats.maxHull}</span>
                    <span className="text-[10px] text-emerald-500 font-normal">HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0e2130] rounded-full overflow-hidden mt-1.5 border border-[#1b3b4f]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ width: `${Math.min(100, (starbase.hull / stats.maxHull) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Shield */}
                <div className="p-2.5 rounded-sm stellaris-item-card border border-[#1d3d52]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Kalkan Gücü</div>
                  <div className="text-base font-bold text-cyan-400 font-mono flex items-center justify-between mt-0.5">
                    <span>{Math.round(starbase.shield)} / {stats.maxShield}</span>
                    <span className="text-[10px] text-cyan-500 font-normal">SHD</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0e2130] rounded-full overflow-hidden mt-1.5 border border-[#1b3b4f]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                      style={{ width: `${Math.min(100, (starbase.shield / stats.maxShield) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Firepower */}
                <div className="p-2.5 rounded-sm stellaris-item-card border border-[#1d3d52]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Taktik Ateş Gücü</div>
                  <div className="text-base font-bold text-amber-400 font-mono flex items-center justify-between mt-0.5">
                    <span>{stats.attack}</span>
                    <span className="text-[10px] text-amber-500 font-normal">PWR</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>+{stats.defensePlatformCount * 60} Platform Bonusu</span>
                  </div>
                </div>

                {/* Sensor Vision */}
                <div className="p-2.5 rounded-sm stellaris-item-card border border-[#1d3d52]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Sensör Kapsama</div>
                  <div className="text-base font-bold text-sky-300 font-mono flex items-center justify-between mt-0.5">
                    <span>{stats.sensorHops} Atlama</span>
                    <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {stats.sensorHops > tierConfig.sensorRangeHops
                      ? `+${stats.sensorHops - tierConfig.sensorRangeHops} Röle Destekli`
                      : 'Temel Menzil'}
                  </div>
                </div>
              </div>

              {/* Station Upgrade Progression Banner */}
              {isOwner && (
                <div className="p-3.5 rounded-sm bg-[#091b29]/80 border border-[#1c4159] shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold font-mono text-amber-300 uppercase">
                        İstasyon Seviyesi: {tierConfig.nameTr}
                      </span>
                    </div>

                    {starbase.upgradeQueue ? (
                      <span className="text-xs font-mono text-amber-400 font-bold animate-pulse">
                        ⏳ Yükseltiliyor: Seviye {STARBASE_TIER_CONFIG[starbase.upgradeQueue.targetTier].nameTr}
                      </span>
                    ) : nextTier && nextTierConfig ? (
                      <button
                        onClick={() => {
                          if (!canAffordUpgrade) return;
                          sound.playClick();
                          onUpgradeStarbase(systemId, fundingPlanet?.id || '');
                        }}
                        disabled={!canAffordUpgrade}
                        className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAffordUpgrade
                            ? 'stellaris-btn-metallic !border-amber-500/70 text-amber-200 shadow-md shadow-amber-950/40'
                            : 'opacity-50 cursor-not-allowed border border-slate-700 text-slate-400'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>{nextTierConfig.nameTr}'a Yükselt ({nextTierConfig.cost.ore}C, {nextTierConfig.cost.crystal}K, {nextTierConfig.cost.fuel}Y)</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        ✓ Maksimum Seviye (Galaktik Hisar)
                      </span>
                    )}
                  </div>

                  {starbase.upgradeQueue && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
                        <span>İnşaat İlerlemesi</span>
                        <span>
                          {Math.max(
                            0,
                            Math.round((starbase.upgradeQueue.finishTime - state.timeMs) / 1000)
                          )}s Kaldı
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0a1824] rounded-full overflow-hidden border border-[#1b3b4f]">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                5,
                                ((state.timeMs - starbase.upgradeQueue.startTime) /
                                  (starbase.upgradeQueue.finishTime - starbase.upgradeQueue.startTime)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
                    {tierConfig.descriptionTr}
                  </div>
                </div>
              )}

              {/* Module Slots & Installed Specializations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold font-mono uppercase text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Modül Yuvaları ({starbase.modules.length} / {tierConfig.maxModules})
                  </span>
                  {starbase.moduleQueue && (
                    <span className="text-amber-400 font-semibold animate-pulse text-[10.5px]">
                      Montaj Devam Ediyor: {STARBASE_MODULE_CONFIG[starbase.moduleQueue.moduleType].nameTr}
                    </span>
                  )}
                </div>

                {/* Installed Modules Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {starbase.modules.map((modType, idx) => {
                    const modConfig = STARBASE_MODULE_CONFIG[modType];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-sm stellaris-item-card border border-[#1c3d52] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-sm bg-[#0a2335] border border-[#204963] flex items-center justify-center text-lg">
                            {modConfig.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-mono">
                              {modConfig.nameTr}
                            </div>
                            <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                              {modConfig.descriptionTr}
                            </div>
                          </div>
                        </div>

                        {isOwner && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onDismantleModule(systemId, idx);
                            }}
                            title="Modülü sök ve %50 kaynak iadesi al"
                            className="p-1.5 rounded-sm hover:bg-rose-950/60 border border-transparent hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-all cursor-pointer shrink-0 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, tierConfig.maxModules - starbase.modules.length) }).map(
                    (_, idx) => (
                      <div
                        key={`empty_${idx}`}
                        className="p-3 rounded-sm border border-dashed border-[#1f3f52] bg-[#071724]/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 text-slate-400">
                          <div className="w-8 h-8 rounded-sm border border-dashed border-[#234559] flex items-center justify-center text-xs font-mono">
                            +
                          </div>
                          <span className="text-xs font-mono text-slate-400">Boş Modül Yuvası</span>
                        </div>

                        {isOwner && !starbase.moduleQueue && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              setSelectedModuleToInstall('defense_platform');
                            }}
                            className="px-2.5 py-1 rounded-sm text-xs font-mono font-bold stellaris-btn-metallic text-cyan-300 cursor-pointer"
                          >
                            + Modül Tak
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Module Installer Dialog / Picker */}
              {isOwner && selectedModuleToInstall && (
                <div className="p-3.5 rounded-sm bg-[#092233]/90 border border-cyan-500/50 space-y-3 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between text-xs font-bold font-mono text-cyan-300 uppercase">
                    <span>Modül Kataloğu — Montaj Seçimi</span>
                    <button
                      onClick={() => setSelectedModuleToInstall(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(
                      Object.keys(STARBASE_MODULE_CONFIG) as StarbaseModuleType[]
                    ).map((mType) => {
                      const cfg = STARBASE_MODULE_CONFIG[mType];
                      const canAfford =
                        fundingPlanet &&
                        fundingPlanet.resources.ore >= cfg.cost.ore &&
                        fundingPlanet.resources.crystal >= cfg.cost.crystal &&
                        fundingPlanet.resources.fuel >= cfg.cost.fuel;

                      return (
                        <div
                          key={mType}
                          className="p-2.5 rounded-sm bg-[#081926] border border-[#1b3f54] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{cfg.icon}</span>
                              <span className="text-xs font-bold text-white font-mono">
                                {cfg.nameTr}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-mono mt-1">
                              {cfg.descriptionTr}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#163547]">
                            <span className="text-[10px] font-mono text-slate-400">
                              {cfg.cost.ore}C, {cfg.cost.crystal}K, {cfg.cost.fuel}Y
                            </span>
                            <button
                              onClick={() => {
                                if (!canAfford) return;
                                sound.playClick();
                                onInstallModule(systemId, fundingPlanet?.id || '', mType);
                                setSelectedModuleToInstall(null);
                              }}
                              disabled={!canAfford}
                              className={`px-2 py-0.5 rounded-sm text-xs font-mono font-bold transition-all ${
                                canAfford
                                  ? 'stellaris-btn-metallic text-cyan-300 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed border border-slate-700 text-slate-400'
                              }`}
                            >
                              Monte Et
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No Starbase in System: Option to Build an Outpost */
            <div className="p-6 text-center space-y-3 bg-[#081926]/50 rounded-sm border border-dashed border-[#1b3b4f]">
              <div className="w-12 h-12 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-slate-400 mx-auto text-xl">
                🛰️
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Bu Sistemde Aktif Yıldız Üssü Bulunmuyor
                </h3>
                <p className="text-xs text-slate-300 font-mono max-w-md mx-auto mt-1">
                  Yörünge Karakolu kurarak bu sistemde bölgesel hakimiyet kurabilir, sensör kapsama alanınızı genişletebilir ve savunma/ticaret modülleri inşa edebilirsiniz.
                </p>
              </div>

              {homeOrLocalColony && (
                <div className="pt-2">
                  <div className="text-[11px] font-mono text-slate-400 mb-2">
                    Gereken Kaynak: {STARBASE_TIER_CONFIG.outpost.cost.ore} Cevher • {STARBASE_TIER_CONFIG.outpost.cost.crystal} Kristal • {STARBASE_TIER_CONFIG.outpost.cost.fuel} Yakıt
                  </div>
                  <button
                    onClick={() => {
                      const cost = STARBASE_TIER_CONFIG.outpost.cost;
                      if (
                        fundingPlanet.resources.ore < cost.ore ||
                        fundingPlanet.resources.crystal < cost.crystal ||
                        fundingPlanet.resources.fuel < cost.fuel
                      ) {
                        return;
                      }
                      sound.playClick();
                      onUpgradeStarbase(systemId, fundingPlanet.id);
                    }}
                    disabled={
                      fundingPlanet.resources.ore < STARBASE_TIER_CONFIG.outpost.cost.ore ||
                      fundingPlanet.resources.crystal < STARBASE_TIER_CONFIG.outpost.cost.crystal ||
                      fundingPlanet.resources.fuel < STARBASE_TIER_CONFIG.outpost.cost.fuel
                    }
                    className="px-4 py-2 rounded-sm font-mono font-bold text-xs stellaris-btn-metallic text-cyan-300 cursor-pointer shadow-lg shadow-cyan-950/40"
                  >
                    + Yörünge Karakolu İnşa Et
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StarbaseModal = React.memo(StarbaseModalComponent);
