import React, { useState } from 'react';
import {
  Clock,
  Hammer,
  Shield,
  Swords,
  Wrench,
  X,
  Sparkles,
  Cpu,
  Crosshair,
  Zap,
  RotateCcw,
  Check,
  ArrowRight,
  Gauge,
  Package,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { DEFENSE_STATS, getDefenseBuildDurationMs, getShipBuildDurationMs, SHIP_STATS } from '../../engine/constants';
import { DefenseStructureType, Planet, ShipType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';
import {
  ShipLoadoutMap,
  WEAPON_MODULES,
  DEFENSE_MODULES,
  UTILITY_MODULES,
  DEFAULT_LOADOUTS,
  getModifiedShipStats,
  loadSavedLoadouts,
  saveLoadouts,
  WeaponModuleId,
  DefenseModuleId,
  UtilityModuleId,
} from '../../engine/shipDesign';

interface ShipyardModalProps {
  planet: Planet | undefined;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onBuildShip: (planetId: string, shipType: ShipType, count: number) => void;
  onBuildDefense?: (planetId: string, defenseType: DefenseStructureType, count: number) => void;
  currentTimeMs: number;
}

const SHIP_ART: Record<ShipType, string> = {
  scout: '/assets/art/scout.png',
  transport: '/assets/art/transport.png',
  fighter: '/assets/art/fighter.png',
  battleship: '/assets/art/battleship.png',
};

const SHIP_NAMES: Record<ShipType, string> = {
  scout: 'Keşif Gemisi',
  transport: 'Ağır Nakliye Gemisi',
  fighter: 'Avcı Gemisi',
  battleship: 'Dretnot Savaş Gemisi',
};

const SHIP_ROLES: Record<ShipType, string> = {
  scout: 'Hafif Keşif & Hızlı İstihbarat',
  transport: 'Kaynak & Kolonizasyon Lojistiği',
  fighter: 'Filo Hava Üstünlüğü & Önleme',
  battleship: 'Ağır Kuşatma & Hat Muharebesi',
};

const ShipyardModalComponent: React.FC<ShipyardModalProps> = ({
  planet,
  isOpen,
  isDocked = false,
  onClose,
  onBuildShip,
  onBuildDefense,
  currentTimeMs,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'defenses' | 'designer'>('build');
  const [selectedDesignerShip, setSelectedDesignerShip] = useState<ShipType>('scout');
  const [loadouts, setLoadouts] = useState<ShipLoadoutMap>(() => loadSavedLoadouts());
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [counts, setCounts] = useState<Record<ShipType, number>>({
    scout: 1,
    transport: 1,
    fighter: 1,
    battleship: 1,
  });

  const [defenseCounts, setDefenseCounts] = useState<Record<DefenseStructureType, number>>({
    missile_battery: 1,
    plasma_turret: 1,
    ion_cannon: 1,
  });

  if (!isOpen || !planet) return null;

  const shipTypes: ShipType[] = ['scout', 'transport', 'fighter', 'battleship'];
  const shipyardLevel = planet.buildings.shipyard || 0;

  const handleSelectModule = (
    category: 'weapon' | 'defense' | 'utility',
    moduleId: string
  ) => {
    sound.playClick();
    setLoadouts((prev) => {
      const currentShipLoadout = prev[selectedDesignerShip];
      return {
        ...prev,
        [selectedDesignerShip]: {
          ...currentShipLoadout,
          [category]: moduleId,
        },
      };
    });
  };

  const handleSaveAndApply = () => {
    sound.playNotification();
    saveLoadouts(loadouts);
    setSaveSuccessNotice('Donanım konfigürasyonu tersaneye uygulandı!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleResetToDefault = () => {
    sound.playClick();
    setLoadouts((prev) => ({
      ...prev,
      [selectedDesignerShip]: { ...DEFAULT_LOADOUTS[selectedDesignerShip] },
    }));
  };

  // Active loadout for the designer
  const currentLoadout = loadouts[selectedDesignerShip];
  const currentBaseStats = SHIP_STATS[selectedDesignerShip];
  const currentModStats = getModifiedShipStats(selectedDesignerShip, currentLoadout);

  const content = (
    <div
      className={
        isDocked
          ? 'w-[480px] min-w-[480px] max-w-[480px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#18374b] rounded-sm w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wrench className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold stellaris-gold font-display uppercase tracking-wider">
              Tersane & Tasarımcı — {planet.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-cyan-300 font-mono">
                Tersane Seviyesi: {shipyardLevel} • Üretim & Donanım Dokları
              </span>
              {planet.specialization === 'military_bastion' && (
                <span className="text-[9.5px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  🛡️ Askeri Hisar (-%15 Gemi, -%20 Savunma)
                </span>
              )}
            </div>
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

      {/* Primary Tab Switcher */}
      <div className="flex border-b border-[#18374b] bg-[#070e17] px-2 pt-2 gap-1.5 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('build');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-t-sm border-t border-x transition-all cursor-pointer ${
            activeTab === 'build'
              ? 'bg-[#0f2130] text-cyan-300 border-[#2d6b91] shadow-[0_-2px_8px_rgba(0,243,255,0.15)]'
              : 'bg-[#08121c] text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0c1a27]'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Gemi İnşası</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('defenses');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-t-sm border-t border-x transition-all cursor-pointer ${
            activeTab === 'defenses'
              ? 'bg-[#0f2130] text-emerald-300 border-[#2d6b91] shadow-[0_-2px_8px_rgba(16,185,129,0.15)]'
              : 'bg-[#08121c] text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0c1a27]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Savunma Bataryaları</span>
          <span className="stellaris-badge text-[9px] text-emerald-300 border-emerald-500/40 ml-0.5">
            YÖRÜNGE
          </span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('designer');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-t-sm border-t border-x transition-all cursor-pointer ${
            activeTab === 'designer'
              ? 'bg-[#0f2130] text-amber-300 border-[#2d6b91] shadow-[0_-2px_8px_rgba(245,158,11,0.15)]'
              : 'bg-[#08121c] text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0c1a27]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Gemi Tasarımcısı & Donanım</span>
          <span className="stellaris-badge text-[9px] text-amber-300 border-amber-500/40 ml-0.5">
            MODÜLER
          </span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/60 px-3 py-1.5 flex items-center gap-2 text-emerald-300 font-mono text-[11px] animate-fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Tab 1: Construction & Queue */}
      {activeTab === 'build' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active Queue if any */}
          {planet.shipyardQueue.length > 0 && (
            <div className="stellaris-section-header p-3 shrink-0">
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

          {/* Ships List */}
          <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2.5 scrollbar-none text-xs font-mono">
            {shipTypes.map((st) => {
              const baseStats = SHIP_STATS[st];
              const equippedLoadout = loadouts[st];
              const modStats = getModifiedShipStats(st, equippedLoadout);

              const buildCount = counts[st];
              const totalCost = {
                ore: modStats.cost.ore * buildCount,
                crystal: modStats.cost.crystal * buildCount,
                fuel: modStats.cost.fuel * buildCount,
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
                  Math.floor(planet.resources.ore / modStats.cost.ore),
                  Math.floor(planet.resources.crystal / modStats.cost.crystal),
                  modStats.cost.fuel > 0 ? Math.floor(planet.resources.fuel / modStats.cost.fuel) : 999
                )
              );

              const activeQueueItem = planet.shipyardQueue.find((q) => q.shipType === st);
              const remainingUnitMs = activeQueueItem
                ? Math.max(0, activeQueueItem.nextUnitFinishTime - currentTimeMs)
                : 0;
              const unitProgress = activeQueueItem
                ? Math.min(1, Math.max(0, 1 - remainingUnitMs / activeQueueItem.unitBuildTimeMs))
                : 0;

              // Check if loadout differs from base
              const isCustomized =
                equippedLoadout.weapon !== DEFAULT_LOADOUTS[st].weapon ||
                equippedLoadout.defense !== DEFAULT_LOADOUTS[st].defense ||
                equippedLoadout.utility !== DEFAULT_LOADOUTS[st].utility;

              const weaponMod = WEAPON_MODULES[equippedLoadout.weapon];
              const defenseMod = DEFENSE_MODULES[equippedLoadout.defense];
              const utilityMod = UTILITY_MODULES[equippedLoadout.utility];

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
                      <div className="w-[52px] h-[52px] rounded-sm overflow-hidden border border-[#1b3b50] bg-black shrink-0 relative group/thumb shadow-sm">
                        <img
                          src={SHIP_ART[st]}
                          alt={baseStats.nameTr}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-display">
                            {baseStats.nameTr}
                          </span>
                          <span className="stellaris-badge text-cyan-300 font-bold border-cyan-500/40">
                            {baseStats.roleTr}
                          </span>
                          {isCustomized && (
                            <span className="stellaris-badge text-[9.5px] text-amber-300 font-bold border-amber-500/40">
                              Özel
                            </span>
                          )}
                        </div>
                        {/* Specs with mod indicators */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-slate-300 font-mono font-medium">
                          <span>
                            Saldırı:{' '}
                            <strong className="text-rose-400">{modStats.attack}</strong>
                            {modStats.attack > baseStats.attack && (
                              <span className="text-[10px] text-emerald-400 ml-0.5 font-bold">
                                (+{Math.round(((modStats.attack - baseStats.attack) / baseStats.attack) * 100)}%)
                              </span>
                            )}
                          </span>
                          <span>
                            Kalkan:{' '}
                            <strong className="text-emerald-400">{modStats.hull + modStats.shield}</strong>
                            {modStats.hull + modStats.shield > baseStats.hull + baseStats.shield && (
                              <span className="text-[10px] text-emerald-400 ml-0.5 font-bold">
                                (+{Math.round((((modStats.hull + modStats.shield) - (baseStats.hull + baseStats.shield)) / (baseStats.hull + baseStats.shield)) * 100)}%)
                              </span>
                            )}
                          </span>
                          <span>
                            Hız: <strong className="text-cyan-300">{modStats.speed}</strong>
                          </span>
                          <span>Birim: {formatDuration(unitTimeMs)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      disabled={isLocked || !canAfford}
                      onClick={() => {
                        sound.playConstruction();
                        onBuildShip(planet.id, st, buildCount);
                      }}
                      className="px-3.5 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all stellaris-btn-metallic text-cyan-300 font-bold shrink-0 cursor-pointer"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>{isLocked ? 'Sv. 3 Gerekli' : 'İnşa Et'}</span>
                    </button>
                  </div>

                  {/* Equipped Loadout Chips & Quick Customize Button */}
                  <div className="mt-2.5 pt-2 border-t border-[#18374b]/80 flex items-center justify-between gap-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      <span
                        className="px-1.5 py-0.5 rounded-sm bg-[#0a1824] border border-[#1b3d52] text-slate-300 flex items-center gap-1 whitespace-nowrap"
                        title={weaponMod.nameTr}
                      >
                        <span>{weaponMod.icon}</span>
                        <span className="truncate max-w-[85px]">{weaponMod.nameTr}</span>
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-sm bg-[#0a1824] border border-[#1b3d52] text-slate-300 flex items-center gap-1 whitespace-nowrap"
                        title={defenseMod.nameTr}
                      >
                        <span>{defenseMod.icon}</span>
                        <span className="truncate max-w-[85px]">{defenseMod.nameTr}</span>
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-sm bg-[#0a1824] border border-[#1b3d52] text-slate-300 flex items-center gap-1 whitespace-nowrap"
                        title={utilityMod.nameTr}
                      >
                        <span>{utilityMod.icon}</span>
                        <span className="truncate max-w-[85px]">{utilityMod.nameTr}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedDesignerShip(st);
                        setActiveTab('designer');
                      }}
                      className="px-2 py-0.5 rounded-sm text-[10px] font-mono text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Gemi donanımını ve modüllerini düzenle"
                    >
                      <Sliders className="w-2.5 h-2.5 text-amber-400" />
                      <span>Donanım</span>
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
                  <div className="flex items-center gap-2.5 mt-2 text-[11px] font-mono font-medium">
                    <span className={planet.resources.ore >= totalCost.ore ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                      {totalCost.ore} Cevher
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={planet.resources.crystal >= totalCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                      {totalCost.crystal} Kristal
                    </span>
                    {totalCost.fuel > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className={planet.resources.fuel >= totalCost.fuel ? 'text-amber-300' : 'text-rose-400 font-bold'}>
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
      )}

      {/* Tab 2: Planetary Defense Installations */}
      {activeTab === 'defenses' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active Defense Queue if any */}
          {planet.defenseQueue && planet.defenseQueue.length > 0 && (
            <div className="stellaris-section-header p-3 shrink-0">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
                <span>DEVAM EDEN SAVUNMA İNŞA KUYRUĞU</span>
                <span className="text-emerald-300 font-mono">
                  {planet.defenseQueue.reduce((acc, q) => acc + (q.count - q.completed), 0)} Batarya Sırada
                </span>
              </div>
              <div className="space-y-1.5">
                {planet.defenseQueue.map((item, idx) => {
                  const remainingMs = Math.max(0, item.nextUnitFinishTime - currentTimeMs);
                  const unitDuration = Math.max(1, item.unitBuildTimeMs);
                  const unitElapsed = Math.max(0, unitDuration - remainingMs);
                  const unitProgress = Math.min(100, Math.max(0, Math.round((unitElapsed / unitDuration) * 100)));
                  const defStats = DEFENSE_STATS[item.defenseType];

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 stellaris-item-card px-3 py-2 rounded-sm text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-bold flex items-center gap-1.5">
                          <span>{defStats.icon}</span>
                          <span>
                            {item.count - item.completed}x {defStats.nameTr}
                            {item.completed > 0 && ` (${item.completed} Tamamlandı)`}
                          </span>
                        </span>
                        <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          {formatDuration(remainingMs)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#08121a] rounded-none overflow-hidden border border-[#1b3b50]">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                          style={{ width: `${unitProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Orbital Grid Overview */}
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="p-2.5 rounded-sm bg-[#08131e] border border-[#1b3d52] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Aktif Yörünge Savunma Şebekesi</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Baskın sırasında düşman filosuna doğrudan ateş açar ve hasarın %40'ını absorbe eder.
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded-sm bg-[#0d2232] border border-[#1f4a66] text-cyan-300" title="Füze Bataryaları">
                  🚀 {planet.defenses?.missile_battery || 0}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-[#0d2232] border border-[#1f4a66] text-amber-300" title="Plazma Taretleri">
                  🔥 {planet.defenses?.plasma_turret || 0}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-[#0d2232] border border-[#1f4a66] text-purple-300" title="İyon Topları">
                  ⚡ {planet.defenses?.ion_cannon || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Defense Structures Catalog */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
            {(['missile_battery', 'plasma_turret', 'ion_cannon'] as DefenseStructureType[]).map((dt) => {
              const stats = DEFENSE_STATS[dt];
              const buildCount = defenseCounts[dt] || 1;

              const reqShipyardLevel = dt === 'ion_cannon' ? 3 : dt === 'plasma_turret' ? 2 : 1;
              const isLocked = shipyardLevel < reqShipyardLevel;

              const totalCost = {
                ore: stats.cost.ore * buildCount,
                crystal: stats.cost.crystal * buildCount,
                fuel: stats.cost.fuel * buildCount,
              };

              const canAfford =
                !isLocked &&
                planet.resources.ore >= totalCost.ore &&
                planet.resources.crystal >= totalCost.crystal &&
                planet.resources.fuel >= totalCost.fuel;

              const maxAffordable = Math.max(
                0,
                Math.min(
                  Math.floor(planet.resources.ore / stats.cost.ore),
                  Math.floor(planet.resources.crystal / stats.cost.crystal),
                  stats.cost.fuel > 0 ? Math.floor(planet.resources.fuel / stats.cost.fuel) : 999
                )
              );

              const unitDurationMs = getDefenseBuildDurationMs(dt, shipyardLevel);

              return (
                <div
                  key={dt}
                  className={`stellaris-item-card p-3 rounded-sm transition-all flex flex-col justify-between ${
                    isLocked ? 'opacity-55 border-slate-700/60' : 'hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-sm bg-[#0a1824] border border-[#1b3d52] flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {stats.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm font-display tracking-wide">
                            {stats.nameTr}
                          </h3>
                          {isLocked && (
                            <span className="stellaris-badge text-[9.5px] text-rose-400 font-bold border-rose-500/40">
                              Tersane Seviye {reqShipyardLevel}+ Gerekli
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          {stats.roleTr}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-200 font-medium">
                          <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                            <Shield className="w-3 h-3 text-cyan-400" /> {stats.hull + stats.shield} HP
                          </span>
                          <span>•</span>
                          <span className="text-rose-400 font-bold flex items-center gap-0.5">
                            <Swords className="w-3 h-3 text-rose-400" /> {stats.attack} Güç
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-400" /> {formatDuration(unitDurationMs)}/adet
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 block mb-0.5">Mevcut</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {planet.defenses?.[dt] || 0}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Build Button */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#18374b]">
                    <div className="flex items-center gap-1">
                      {[1, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            sound.playClick();
                            setDefenseCounts((prev) => ({ ...prev, [dt]: preset }));
                          }}
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                            buildCount === preset
                              ? 'stellaris-rail-btn active text-emerald-300 font-bold'
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
                            setDefenseCounts((prev) => ({ ...prev, [dt]: Math.min(20, maxAffordable) }));
                          }}
                          className="px-2 py-0.5 rounded-sm text-[10px] font-mono stellaris-btn-metallic text-emerald-400 font-bold cursor-pointer hover:border-emerald-400"
                        >
                          Maks ({Math.min(20, maxAffordable)})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-[#1b3d52] bg-[#070e17] rounded-sm">
                        <button
                          type="button"
                          disabled={isLocked || buildCount <= 1}
                          onClick={() => {
                            sound.playClick();
                            setDefenseCounts((prev) => ({ ...prev, [dt]: Math.max(1, prev[dt] - 1) }));
                          }}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-200 min-w-[24px] text-center">
                          {buildCount}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            sound.playClick();
                            setDefenseCounts((prev) => ({ ...prev, [dt]: prev[dt] + 1 }));
                          }}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford || isLocked}
                        onClick={() => {
                          sound.playConstruction();
                          if (onBuildDefense) {
                            onBuildDefense(planet.id, dt, buildCount);
                          }
                        }}
                        className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                          canAfford && !isLocked
                            ? 'stellaris-btn-primary bg-emerald-600/30 border-emerald-500/60 hover:bg-emerald-600/50 text-emerald-200'
                            : 'stellaris-btn-metallic text-slate-500 cursor-not-allowed border-slate-700'
                        }`}
                      >
                        <Hammer className="w-3 h-3" />
                        <span>İnşa Et</span>
                      </button>
                    </div>
                  </div>

                  {/* Cost Badges */}
                  <div className="flex items-center gap-2.5 mt-2 text-[11px] font-mono font-medium">
                    <span className={planet.resources.ore >= totalCost.ore ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                      {totalCost.ore} Cevher
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={planet.resources.crystal >= totalCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                      {totalCost.crystal} Kristal
                    </span>
                    {totalCost.fuel > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className={planet.resources.fuel >= totalCost.fuel ? 'text-amber-300' : 'text-rose-400 font-bold'}>
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
      )}

      {/* Tab 3: Modular Ship Designer */}
      {activeTab === 'designer' && (
        <div className="flex-1 flex flex-col overflow-y-auto p-3.5 space-y-3.5 scrollbar-none text-xs font-mono">
          {/* Subheader doctrine info */}
          <div className="p-2.5 rounded-sm bg-[#08131e] border border-[#1b3d52] text-[11px] text-slate-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Taktik Donanım & Modül Laboratuvarı:</span>
              <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                Her gemi sınıfının silahını, savunma zırhını ve tahrik reaktörünü optimize edin. Kaydedilen donanım, tersane üretim hattına ve taktik muharebe hesaplayıcısına entegre edilir.
              </p>
            </div>
          </div>

          {/* Ship Class Switcher (4 buttons) */}
          <div className="grid grid-cols-4 gap-1.5">
            {shipTypes.map((st) => {
              const isSelected = selectedDesignerShip === st;
              const isCustom =
                loadouts[st].weapon !== DEFAULT_LOADOUTS[st].weapon ||
                loadouts[st].defense !== DEFAULT_LOADOUTS[st].defense ||
                loadouts[st].utility !== DEFAULT_LOADOUTS[st].utility;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedDesignerShip(st);
                  }}
                  className={`p-2 rounded-sm flex flex-col items-center gap-1.5 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#122838] border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.25)] text-cyan-200'
                      : 'bg-[#091520] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0d1e2e]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-sm overflow-hidden border border-[#1b3b50] bg-black">
                    <img src={SHIP_ART[st]} alt={st} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold uppercase truncate max-w-full">
                    {SHIP_STATS[st].nameTr.split(' ')[0]}
                  </span>
                  {isCustom && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Ship Profile Header */}
          <div className="flex items-center gap-3 p-2.5 rounded-sm bg-[#091724] border border-[#1b3b50]">
            <div className="w-12 h-12 rounded-sm overflow-hidden border border-[#224b67] bg-black shrink-0">
              <img
                src={SHIP_ART[selectedDesignerShip]}
                alt={currentBaseStats.nameTr}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-display text-slate-100">
                  {SHIP_NAMES[selectedDesignerShip]}
                </span>
                <span className="stellaris-badge text-cyan-300 border-cyan-500/40">
                  {currentBaseStats.roleTr}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {SHIP_ROLES[selectedDesignerShip]}
              </p>
            </div>
          </div>

          {/* Module Category 1: WEAPON */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Swords className="w-3.5 h-3.5" />
                1. Silah Sistemi (Weapon Module)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Aktif: {WEAPON_MODULES[currentLoadout.weapon].nameTr}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(WEAPON_MODULES) as WeaponModuleId[]).map((wId) => {
                const mod = WEAPON_MODULES[wId];
                const isEquipped = currentLoadout.weapon === wId;

                return (
                  <button
                    key={wId}
                    type="button"
                    onClick={() => handleSelectModule('weapon', wId)}
                    className={`p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-[#152332] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                        : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] flex items-center gap-1 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr}
                        </span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mb-1.5 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 text-[9.5px] font-mono pt-1 border-t border-[#18374a]">
                      <span className="text-rose-400 font-bold">
                        {mod.attackMultiplier > 1
                          ? `+${Math.round((mod.attackMultiplier - 1) * 100)}% Hasar`
                          : 'Standart Hasar'}
                      </span>
                      {mod.speedMultiplier !== 1 && (
                        <span className="text-amber-400">
                          {mod.speedMultiplier < 1 ? `-${Math.round((1 - mod.speedMultiplier) * 100)}% Hız` : ''}
                        </span>
                      )}
                      {(mod.extraCost.ore || mod.extraCost.crystal || mod.extraCost.fuel) && (
                        <span className="text-slate-400">
                          +{mod.extraCost.ore || 0}C +{mod.extraCost.crystal || 0}K
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Category 2: DEFENSE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                2. Savunma & Zırh (Defense Module)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Aktif: {DEFENSE_MODULES[currentLoadout.defense].nameTr}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(DEFENSE_MODULES) as DefenseModuleId[]).map((dId) => {
                const mod = DEFENSE_MODULES[dId];
                const isEquipped = currentLoadout.defense === dId;

                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => handleSelectModule('defense', dId)}
                    className={`p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-[#152332] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                        : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10.5px] flex items-center gap-1 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr.split(' ')[0]}
                        </span>
                        {isEquipped && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[9.5px] text-slate-400 leading-tight mb-1.5 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                    </div>

                    <div className="text-[9.5px] font-mono pt-1 border-t border-[#18374a] text-emerald-400 font-bold">
                      {mod.hullMultiplier > 1 && `+${Math.round((mod.hullMultiplier - 1) * 100)}% Gövde`}
                      {mod.shieldMultiplier > 1 && `+${Math.round((mod.shieldMultiplier - 1) * 100)}% Kalkan`}
                      {mod.hullMultiplier === 1 && mod.shieldMultiplier === 1 && 'Standart Koruma'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Category 3: UTILITY */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Cpu className="w-3.5 h-3.5" />
                3. Yardımcı Sistem & Tahrik (Utility Module)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Aktif: {UTILITY_MODULES[currentLoadout.utility].nameTr}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(UTILITY_MODULES) as UtilityModuleId[]).map((uId) => {
                const mod = UTILITY_MODULES[uId];
                const isEquipped = currentLoadout.utility === uId;

                return (
                  <button
                    key={uId}
                    type="button"
                    onClick={() => handleSelectModule('utility', uId)}
                    className={`p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-[#152332] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                        : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[10.5px] flex items-center gap-1 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr}
                        </span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[9.5px] text-slate-400 leading-tight mb-1.5 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 text-[9.5px] font-mono pt-1 border-t border-[#18374a]">
                      {mod.cargoMultiplier > 1 && (
                        <span className="text-amber-300 font-bold">
                          +{Math.round((mod.cargoMultiplier - 1) * 100)}% Kargo
                        </span>
                      )}
                      {mod.speedMultiplier > 1 && (
                        <span className="text-cyan-300 font-bold">
                          +{Math.round((mod.speedMultiplier - 1) * 100)}% Hız
                        </span>
                      )}
                      {mod.attackMultiplier > 1 && (
                        <span className="text-rose-300 font-bold">
                          +{Math.round((mod.attackMultiplier - 1) * 100)}% Atak
                        </span>
                      )}
                      {mod.cargoMultiplier === 1 && mod.speedMultiplier === 1 && mod.attackMultiplier === 1 && (
                        <span className="text-slate-400 font-bold">Dengeli Güç</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Engineering Comparison Card */}
          <div className="p-3 rounded-sm bg-[#081420] border border-[#1b3d54] space-y-2">
            <div className="flex items-center justify-between border-b border-[#18374b] pb-1.5">
              <span className="text-[10px] font-bold text-slate-200 font-display uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Mühendislik & Performans Analizi
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {SHIP_STATS[selectedDesignerShip].nameTr}
              </span>
            </div>

            {/* Spec Matrix Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
              {/* Attack */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Saldırı Gücü</span>
                  <span className="font-bold text-rose-400">
                    {currentModStats.attack}
                    {currentModStats.attack !== currentBaseStats.attack && (
                      <span className="text-[9.5px] ml-1">
                        ({currentModStats.attack > currentBaseStats.attack ? '+' : ''}
                        {Math.round(((currentModStats.attack - currentBaseStats.attack) / currentBaseStats.attack) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((currentModStats.attack / 350) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Hull & Shield */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gövde + Kalkan</span>
                  <span className="font-bold text-emerald-400">
                    {currentModStats.hull + currentModStats.shield}
                    {currentModStats.hull + currentModStats.shield !== currentBaseStats.hull + currentBaseStats.shield && (
                      <span className="text-[9.5px] ml-1">
                        ({currentModStats.hull + currentModStats.shield > currentBaseStats.hull + currentBaseStats.shield ? '+' : ''}
                        {Math.round((((currentModStats.hull + currentModStats.shield) - (currentBaseStats.hull + currentBaseStats.shield)) / (currentBaseStats.hull + currentBaseStats.shield)) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((currentModStats.hull + currentModStats.shield) / 2500) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Seyir Hızı</span>
                  <span className="font-bold text-cyan-300">
                    {currentModStats.speed}
                    {currentModStats.speed !== currentBaseStats.speed && (
                      <span className="text-[9.5px] ml-1">
                        ({currentModStats.speed > currentBaseStats.speed ? '+' : ''}
                        {Math.round(((currentModStats.speed - currentBaseStats.speed) / currentBaseStats.speed) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((currentModStats.speed / 450) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Cargo */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Kargo Ambarı</span>
                  <span className="font-bold text-amber-300">
                    {currentModStats.cargoCapacity}
                    {currentModStats.cargoCapacity !== currentBaseStats.cargoCapacity && (
                      <span className="text-[9.5px] ml-1">
                        ({currentModStats.cargoCapacity > currentBaseStats.cargoCapacity ? '+' : ''}
                        {Math.round(((currentModStats.cargoCapacity - currentBaseStats.cargoCapacity) / currentBaseStats.cargoCapacity) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((currentModStats.cargoCapacity / 1500) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Modified Build Cost Summary */}
            <div className="pt-2 border-t border-[#18374b] flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Birim İnşa Maliyeti:</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-200">{currentModStats.cost.ore} Cevher</span>
                <span>•</span>
                <span className="text-cyan-300">{currentModStats.cost.crystal} Kristal</span>
                {currentModStats.cost.fuel > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">{currentModStats.cost.fuel} Yakıt</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#18374b]">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-sm text-xs font-mono text-slate-400 hover:text-white stellaris-btn-metallic flex items-center gap-1.5 cursor-pointer"
              title="Bu geminin donanımını fabrika ayarlarına döndür"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Dön</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="px-3.5 py-1.5 rounded-sm text-xs font-bold text-amber-300 hover:text-amber-200 border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Donanımı Kaydet & Uygula</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab('build');
                }}
                className="px-3 py-1.5 rounded-sm text-xs font-bold text-cyan-300 hover:text-cyan-200 stellaris-btn-metallic flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tersanede Üret</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      )}
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
