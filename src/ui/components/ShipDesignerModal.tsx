import React, { useState, useEffect, useMemo } from 'react';
import {
  ShipType,
  ShipLoadout,
  ShipLoadoutMap,
  WeaponModuleId,
  DefenseModuleId,
  UtilityModuleId,
  GameState,
  Planet,
} from '../../engine/types';
import { PlayerVisibleState } from '../../engine/fog';
import { SHIP_STATS } from '../../engine/constants';
import {
  WEAPON_MODULES,
  DEFENSE_MODULES,
  UTILITY_MODULES,
  DEFAULT_LOADOUTS,
  getModifiedShipStats,
  calculateRefitCost,
} from '../../engine/shipDesign';
import { sound } from '../sound';
import {
  Wrench,
  X,
  Swords,
  Shield,
  Cpu,
  Sparkles,
  RotateCcw,
  Check,
  ArrowRight,
  Anchor,
  Layers,
  ChevronRight,
  AlertCircle,
  Zap,
  Gauge,
  Package,
} from 'lucide-react';

export interface ShipDesignerModalProps {
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  state: PlayerVisibleState | GameState | undefined;
  activePlayerId: string;
  activePlanet?: Planet;
  onSetShipLoadout?: (shipType: ShipType, loadout: ShipLoadout) => void;
  onRefitShips?: (planetId: string, shipType: ShipType, count: number) => void;
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
  scout: 'Sistem keşfi, erken uyarı & gözetleme',
  transport: 'Kolonizasyon & kaynak sevkiyatı',
  fighter: 'Ön cephe taarruz & it dalaşı',
  battleship: 'Ağır bombardıman & filo sancak gemisi',
};

const SHIP_TYPES: ShipType[] = ['scout', 'transport', 'fighter', 'battleship'];

export const ShipDesignerModal: React.FC<ShipDesignerModalProps> = ({
  isOpen,
  isDocked = false,
  onClose,
  state,
  activePlayerId,
  activePlanet: activePlanetProp,
  onSetShipLoadout,
  onRefitShips,
}) => {
  const [selectedShip, setSelectedShip] = useState<ShipType>('fighter');

  const initialLoadouts = useMemo(() => {
    if (!state) return DEFAULT_LOADOUTS;
    if ('myShipLoadouts' in state && state.myShipLoadouts) {
      return state.myShipLoadouts;
    }
    if ('shipLoadouts' in state && state.shipLoadouts?.[activePlayerId]) {
      return state.shipLoadouts[activePlayerId];
    }
    return DEFAULT_LOADOUTS;
  }, [state, activePlayerId]);

  const [loadouts, setLoadouts] = useState<ShipLoadoutMap>(() => {
    return JSON.parse(JSON.stringify(initialLoadouts));
  });
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [refitFeedback, setRefitFeedback] = useState<string | null>(null);

  // Sync with engine visible state if updated
  useEffect(() => {
    setLoadouts(JSON.parse(JSON.stringify(initialLoadouts)));
  }, [initialLoadouts]);

  // Selected planet for refitting
  const myPlanets = useMemo(() => {
    if (!state) return [];
    if ('myPlanets' in state) return state.myPlanets;
    if ('planets' in state) return Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
    return [];
  }, [state, activePlayerId]);

  const shipyardPlanets = useMemo(() => {
    return myPlanets.filter((p) => (p.buildings.shipyard || 0) >= 1);
  }, [myPlanets]);

  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(activePlanetProp?.id || '');

  useEffect(() => {
    if (activePlanetProp && (!selectedPlanetId || !shipyardPlanets.some((p) => p.id === selectedPlanetId))) {
      if ((activePlanetProp.buildings.shipyard || 0) >= 1) {
        setSelectedPlanetId(activePlanetProp.id);
        return;
      }
    }
    if (shipyardPlanets.length > 0 && (!selectedPlanetId || !shipyardPlanets.some((p) => p.id === selectedPlanetId))) {
      setSelectedPlanetId(shipyardPlanets[0].id);
    }
  }, [shipyardPlanets, selectedPlanetId, activePlanetProp]);

  const activePlanet = useMemo(() => {
    return (
      shipyardPlanets.find((p) => p.id === selectedPlanetId) ||
      (activePlanetProp && (activePlanetProp.buildings.shipyard || 0) >= 1 ? activePlanetProp : shipyardPlanets[0])
    );
  }, [shipyardPlanets, selectedPlanetId, activePlanetProp]);

  const availableGarrison = activePlanet ? activePlanet.garrison[selectedShip] || 0 : 0;
  const [refitCount, setRefitCount] = useState<number>(1);

  useEffect(() => {
    if (availableGarrison > 0) {
      setRefitCount((prev) => Math.max(1, Math.min(prev, availableGarrison)));
    } else {
      setRefitCount(1);
    }
  }, [availableGarrison, selectedShip]);

  if (!isOpen) return null;

  const currentLoadout = loadouts[selectedShip] || DEFAULT_LOADOUTS[selectedShip];
  const baseStats = SHIP_STATS[selectedShip];
  const modStats = getModifiedShipStats(selectedShip, currentLoadout);
  const refitCost = calculateRefitCost(selectedShip, currentLoadout, refitCount);

  const canAffordRefit = activePlanet
    ? activePlanet.resources.ore >= refitCost.ore &&
      activePlanet.resources.crystal >= refitCost.crystal &&
      activePlanet.resources.fuel >= refitCost.fuel
    : false;

  const handleSelectModule = (category: 'weapon' | 'defense' | 'utility', moduleId: string) => {
    sound.playClick();
    setLoadouts((prev) => ({
      ...prev,
      [selectedShip]: {
        ...prev[selectedShip],
        [category]: moduleId,
      },
    }));
  };

  const handleSaveBlueprint = () => {
    sound.playNotification();
    if (onSetShipLoadout) {
      onSetShipLoadout(selectedShip, currentLoadout);
    }
    setSaveFeedback(`${SHIP_NAMES[selectedShip]} yeni modülleri tersane dokuna tescillendi!`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleResetDefault = () => {
    sound.playClick();
    const def = DEFAULT_LOADOUTS[selectedShip];
    setLoadouts((prev) => ({
      ...prev,
      [selectedShip]: { ...def },
    }));
    if (onSetShipLoadout) {
      onSetShipLoadout(selectedShip, def);
    }
  };

  const handleExecuteRefit = () => {
    if (!activePlanet || availableGarrison <= 0 || !canAffordRefit) return;
    sound.playNotification();
    if (onRefitShips) {
      onRefitShips(activePlanet.id, selectedShip, refitCount);
    }
    setRefitFeedback(`${activePlanet.name} tersanesinde ${refitCount} adet ${SHIP_NAMES[selectedShip]} donatıldı!`);
    setTimeout(() => setRefitFeedback(null), 3500);
  };

  const modalInner = (
    <div
      className={
        isDocked
          ? 'w-[520px] min-w-[520px] max-w-[520px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#1b3d54] rounded-sm w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-cyan-600/30 to-amber-600/20 border border-cyan-400/40 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-100">
                  MODÜLER GEMİ MİMARİSİ & YÜKSELTME TERSANESİ
                </h2>
                <span className="stellaris-badge text-cyan-300 border-cyan-500/40">FAZ 15</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Silah konfigürasyonu, zırh kaplamaları ve tahrik reaktörü doktrin laboratuvarı
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {saveFeedback && (
          <div className="px-4 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}
        {refitFeedback && (
          <div className="px-4 py-2 bg-cyan-950/70 border-b border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{refitFeedback}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 text-xs font-mono scrollbar-thin">
          {/* Ship Class Switcher (4 buttons) */}
          <div className="grid grid-cols-4 gap-2">
            {SHIP_TYPES.map((st) => {
              const isSelected = selectedShip === st;
              const cur = loadouts[st] || DEFAULT_LOADOUTS[st];
              const isCustom =
                cur.weapon !== DEFAULT_LOADOUTS[st].weapon ||
                cur.defense !== DEFAULT_LOADOUTS[st].defense ||
                cur.utility !== DEFAULT_LOADOUTS[st].utility;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedShip(st);
                  }}
                  className={`p-2.5 rounded-sm flex items-center gap-3 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#122838] border-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.3)] text-cyan-200'
                      : 'bg-[#091520] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0d1e2e]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-sm overflow-hidden border border-[#1b3b50] bg-black shrink-0">
                    <img src={SHIP_ART[st]} alt={st} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-xs uppercase truncate text-slate-200">
                      {SHIP_NAMES[st]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {SHIP_STATS[st].roleTr}
                    </div>
                  </div>
                  {isCustom && (
                    <span
                      title="Özelleştirilmiş Modüler Tasarım"
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Blueprint & 3 Module Slots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Slot 1: WEAPON */}
            <div className="p-3 rounded-sm bg-[#091624] border border-[#1b3b50] flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#18374a]">
                <span className="font-bold text-[11px] text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  1. Silah Sistemi
                </span>
                <span className="text-[10px] text-slate-400">
                  {WEAPON_MODULES[currentLoadout.weapon].nameTr.split(' ')[0]}
                </span>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(WEAPON_MODULES) as WeaponModuleId[]).map((wId) => {
                  const mod = WEAPON_MODULES[wId];
                  const isEquipped = currentLoadout.weapon === wId;

                  return (
                    <button
                      key={wId}
                      type="button"
                      onClick={() => handleSelectModule('weapon', wId)}
                      className={`w-full p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-[#15273a] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                          : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[11px] flex items-center gap-1.5 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr}
                        </span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mb-1 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                      <div className="flex items-center gap-2 text-[9.5px] font-mono pt-1 border-t border-[#18374a]/60">
                        <span className="text-rose-400 font-bold">
                          {mod.attackMultiplier > 1 ? `+${Math.round((mod.attackMultiplier - 1) * 100)}% Atak` : 'Standart'}
                        </span>
                        {mod.speedMultiplier !== 1 && (
                          <span className="text-amber-400">
                            {mod.speedMultiplier < 1 ? `-${Math.round((1 - mod.speedMultiplier) * 100)}% Hız` : ''}
                          </span>
                        )}
                        {(mod.extraCost.ore || mod.extraCost.crystal || mod.extraCost.fuel) && (
                          <span className="text-slate-400 ml-auto">
                            +{mod.extraCost.ore || 0}C +{mod.extraCost.crystal || 0}K {mod.extraCost.fuel ? `+${mod.extraCost.fuel}Y` : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot 2: DEFENSE */}
            <div className="p-3 rounded-sm bg-[#091624] border border-[#1b3b50] flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#18374a]">
                <span className="font-bold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  2. Savunma & Zırh
                </span>
                <span className="text-[10px] text-slate-400">
                  {DEFENSE_MODULES[currentLoadout.defense].nameTr.split(' ')[0]}
                </span>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(DEFENSE_MODULES) as DefenseModuleId[]).map((dId) => {
                  const mod = DEFENSE_MODULES[dId];
                  const isEquipped = currentLoadout.defense === dId;

                  return (
                    <button
                      key={dId}
                      type="button"
                      onClick={() => handleSelectModule('defense', dId)}
                      className={`w-full p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-[#15273a] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                          : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[11px] flex items-center gap-1.5 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr}
                        </span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mb-1 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                      <div className="flex items-center gap-2 text-[9.5px] font-mono pt-1 border-t border-[#18374a]/60">
                        <span className="text-emerald-400 font-bold">
                          {mod.hullMultiplier > 1 && `+${Math.round((mod.hullMultiplier - 1) * 100)}% Gövde`}
                          {mod.shieldMultiplier > 1 && ` +${Math.round((mod.shieldMultiplier - 1) * 100)}% Kalkan`}
                          {mod.hullMultiplier === 1 && mod.shieldMultiplier === 1 && 'Standart'}
                        </span>
                        {mod.speedMultiplier !== 1 && (
                          <span className={mod.speedMultiplier > 1 ? 'text-cyan-400' : 'text-amber-400'}>
                            {mod.speedMultiplier > 1
                              ? `+${Math.round((mod.speedMultiplier - 1) * 100)}% Hız`
                              : `-${Math.round((1 - mod.speedMultiplier) * 100)}% Hız`}
                          </span>
                        )}
                        {(mod.extraCost.ore || mod.extraCost.crystal || mod.extraCost.fuel) && (
                          <span className="text-slate-400 ml-auto">
                            +{mod.extraCost.ore || 0}C +{mod.extraCost.crystal || 0}K
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot 3: UTILITY */}
            <div className="p-3 rounded-sm bg-[#091624] border border-[#1b3b50] flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#18374a]">
                <span className="font-bold text-[11px] text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  3. Yardımcı Tahrik / Sensör
                </span>
                <span className="text-[10px] text-slate-400">
                  {UTILITY_MODULES[currentLoadout.utility].nameTr.split(' ')[0]}
                </span>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(UTILITY_MODULES) as UtilityModuleId[]).map((uId) => {
                  const mod = UTILITY_MODULES[uId];
                  const isEquipped = currentLoadout.utility === uId;

                  return (
                    <button
                      key={uId}
                      type="button"
                      onClick={() => handleSelectModule('utility', uId)}
                      className={`w-full p-2 rounded-sm text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-[#15273a] border-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.2)] text-white'
                          : 'bg-[#08121c] border-[#18374a] text-slate-400 hover:text-slate-200 hover:bg-[#0c1a26]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[11px] flex items-center gap-1.5 text-slate-200">
                          <span>{mod.icon}</span> {mod.nameTr}
                        </span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mb-1 line-clamp-2">
                        {mod.descriptionTr}
                      </p>
                      <div className="flex items-center gap-2 text-[9.5px] font-mono pt-1 border-t border-[#18374a]/60">
                        {mod.speedMultiplier > 1 && (
                          <span className="text-cyan-300 font-bold">
                            +{Math.round((mod.speedMultiplier - 1) * 100)}% Hız
                          </span>
                        )}
                        {mod.cargoMultiplier > 1 && (
                          <span className="text-amber-300 font-bold">
                            +{Math.round((mod.cargoMultiplier - 1) * 100)}% Kargo
                          </span>
                        )}
                        {mod.attackMultiplier > 1 && (
                          <span className="text-rose-300 font-bold">
                            +{Math.round((mod.attackMultiplier - 1) * 100)}% Atak
                          </span>
                        )}
                        {mod.speedMultiplier === 1 && mod.cargoMultiplier === 1 && mod.attackMultiplier === 1 && (
                          <span className="text-slate-400">Standart Güç</span>
                        )}
                        {(mod.extraCost.ore || mod.extraCost.crystal || mod.extraCost.fuel) && (
                          <span className="text-slate-400 ml-auto">
                            +{mod.extraCost.ore || 0}C +{mod.extraCost.fuel ? `${mod.extraCost.fuel}Y` : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Comparison Spec Matrix */}
          <div className="p-3 rounded-sm bg-[#08131e] border border-[#1b3d52] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#18374b] pb-1.5">
              <span className="text-[11px] font-bold text-slate-200 font-display uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Mühendislik & Performans Analizi (Base vs Custom Loadout)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-2 py-1 rounded-sm text-[10px] text-slate-400 hover:text-white stellaris-btn-metallic flex items-center gap-1 cursor-pointer"
                  title="Fabrika standartlarına sıfırla"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Varsayılana Dön</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveBlueprint}
                  className="px-3 py-1 rounded-sm text-[10px] font-bold text-amber-300 hover:text-amber-200 border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tasarımı Kaydet & Galaksiye Uygula</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Attack */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
                  <span>Saldırı Gücü</span>
                  <span className="font-bold text-rose-400">
                    {modStats.attack}
                    {modStats.attack !== baseStats.attack && (
                      <span className="text-[9px] ml-1">
                        ({modStats.attack > baseStats.attack ? '+' : ''}
                        {Math.round(((modStats.attack - baseStats.attack) / baseStats.attack) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((modStats.attack / 350) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Hull + Shield */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
                  <span>Gövde + Kalkan</span>
                  <span className="font-bold text-emerald-400">
                    {modStats.hull + modStats.shield}
                    {modStats.hull + modStats.shield !== baseStats.hull + baseStats.shield && (
                      <span className="text-[9px] ml-1">
                        ({modStats.hull + modStats.shield > baseStats.hull + baseStats.shield ? '+' : ''}
                        {Math.round((((modStats.hull + modStats.shield) - (baseStats.hull + baseStats.shield)) / (baseStats.hull + baseStats.shield)) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((modStats.hull + modStats.shield) / 2500) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
                  <span>Seyir Hızı</span>
                  <span className="font-bold text-cyan-300">
                    {modStats.speed}
                    {modStats.speed !== baseStats.speed && (
                      <span className="text-[9px] ml-1">
                        ({modStats.speed > baseStats.speed ? '+' : ''}
                        {Math.round(((modStats.speed - baseStats.speed) / baseStats.speed) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((modStats.speed / 450) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Cargo */}
              <div className="p-2 rounded-sm bg-[#0a1824] border border-[#173549]">
                <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
                  <span>Kargo Ambarı</span>
                  <span className="font-bold text-amber-300">
                    {modStats.cargoCapacity}
                    {modStats.cargoCapacity !== baseStats.cargoCapacity && (
                      <span className="text-[9px] ml-1">
                        ({modStats.cargoCapacity > baseStats.cargoCapacity ? '+' : ''}
                        {Math.round(((modStats.cargoCapacity - baseStats.cargoCapacity) / baseStats.cargoCapacity) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1 bg-[#060c12] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((modStats.cargoCapacity / 1500) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Yeni Üretim Birim Maliyeti:</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-200">{modStats.cost.ore} Cevher</span>
                <span>•</span>
                <span className="text-cyan-300">{modStats.cost.crystal} Kristal</span>
                {modStats.cost.fuel > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">{modStats.cost.fuel} Yakıt</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fleet Refit Dock (Modernization Section) */}
          <div className="p-3.5 rounded-sm bg-[#0a1726] border border-[#1e4460] space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#18374b]">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100 font-display uppercase tracking-wide">
                  TERSANE FİLO MODERNİZASYONU & DONATIM DOKU (FLEET REFIT)
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400">
                Garnizonda demirli gemileri son tasarıma yükseltin
              </span>
            </div>

            {shipyardPlanets.length === 0 ? (
              <div className="p-3 rounded-sm bg-[#08121c] border border-[#18374a] text-slate-400 text-center">
                Henüz Tersane kurulu bir koloniniz bulunmuyor. Yükseltme işlemi için Tersane Seviye 1+ gereklidir.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* Planet Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Tersane Gezegeni:
                  </label>
                  <select
                    value={selectedPlanetId}
                    onChange={(e) => setSelectedPlanetId(e.target.value)}
                    className="w-full bg-[#08121c] border border-[#18374a] text-slate-200 text-xs px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    {shipyardPlanets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Tersane Sv.{p.buildings.shipyard}) - Garnizon: {p.garrison[selectedShip] || 0}{' '}
                        {SHIP_NAMES[selectedShip]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    <span>Yenilenecek Adet:</span>
                    <span>Mevcut: {availableGarrison}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={Math.max(1, availableGarrison)}
                      value={refitCount}
                      disabled={availableGarrison <= 0}
                      onChange={(e) => setRefitCount(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="font-bold text-cyan-300 text-xs w-8 text-center">{refitCount}</span>
                  </div>
                </div>

                {/* Refit Action & Cost */}
                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between text-[10px] mb-1.5 font-mono">
                    <span className="text-slate-400">Donatım Bedeli:</span>
                    <span className={canAffordRefit ? 'text-amber-300' : 'text-rose-400 font-bold'}>
                      {refitCost.ore}C • {refitCost.crystal}K • {refitCost.fuel}Y
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={availableGarrison <= 0 || !canAffordRefit}
                    onClick={handleExecuteRefit}
                    className={`w-full py-2 px-3 rounded-sm text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      availableGarrison > 0 && canAffordRefit
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(0,243,255,0.3)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Anchor className="w-3.5 h-3.5" />
                    <span>Garnizonu Yeni Tasarıma Donat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  if (isDocked) {
    return modalInner;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-fadeIn">
      {modalInner}
    </div>
  );
};
