import {
  Resources,
  ShipStats,
  ShipType,
  WeaponModuleId,
  DefenseModuleId,
  UtilityModuleId,
  ShipLoadout,
  ShipLoadoutMap,
} from './types';
import { SHIP_STATS } from './constants';

export type {
  WeaponModuleId,
  DefenseModuleId,
  UtilityModuleId,
  ShipLoadout,
  ShipLoadoutMap,
};

export interface ModuleDefinition {
  id: string;
  nameTr: string;
  category: 'weapon' | 'defense' | 'utility';
  descriptionTr: string;
  attackMultiplier: number;
  hullMultiplier: number;
  shieldMultiplier: number;
  speedMultiplier: number;
  cargoMultiplier: number;
  extraCost: Partial<Resources>;
  icon: string;
  accentColor: string;
}

export const WEAPON_MODULES: Record<WeaponModuleId, ModuleDefinition> = {
  laser: {
    id: 'laser',
    nameTr: 'Kızılötesi Işın Bataryası',
    category: 'weapon',
    descriptionTr: 'Dengeli menzil ve enerji tüketimiyle temel askeri standart lazer silahı.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    cargoMultiplier: 1.0,
    extraCost: {},
    icon: '⚡',
    accentColor: '#38bdf8',
  },
  plasma: {
    id: 'plasma',
    nameTr: 'Aşırı Isılı Plazma Topu',
    category: 'weapon',
    descriptionTr: 'Manyetik sınırlandırılmış plazma topları. Enerji kalkanlarını eritmede yüksek verim sağlar.',
    attackMultiplier: 1.25,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    cargoMultiplier: 1.0,
    extraCost: { ore: 40, crystal: 35 },
    icon: '🔥',
    accentColor: '#f59e0b',
  },
  railgun: {
    id: 'railgun',
    nameTr: 'Hiper-Kinetik Raylı Top',
    category: 'weapon',
    descriptionTr: 'Elektromanyetik raylarla fırlatılan katı tungsten mermileri. Gemi zırhını ve gövdesini delip geçer.',
    attackMultiplier: 1.30,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    cargoMultiplier: 1.0,
    extraCost: { ore: 60, crystal: 15 },
    icon: '☄️',
    accentColor: '#ef4444',
  },
  torpedo: {
    id: 'torpedo',
    nameTr: 'Nükleer Ağır Torpido',
    category: 'weapon',
    descriptionTr: 'Büyük boyutlu zırhlı hedeflere karşı ezici tek vuruşluk tahrip gücü sunar.',
    attackMultiplier: 1.40,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 0.92,
    cargoMultiplier: 1.0,
    extraCost: { crystal: 45, fuel: 30 },
    icon: '🚀',
    accentColor: '#a855f7',
  },
};

export const DEFENSE_MODULES: Record<DefenseModuleId, ModuleDefinition> = {
  standard_shield: {
    id: 'standard_shield',
    nameTr: 'Reflektör Kalkan Jeneratörü',
    category: 'defense',
    descriptionTr: 'Gövdeyi kozmik mikrometeoritlerden ve lazer mermilerinden koruyan standart deflektör kalkan.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    cargoMultiplier: 1.0,
    extraCost: {},
    icon: '🛡️',
    accentColor: '#06b6d4',
  },
  plasteel_armor: {
    id: 'plasteel_armor',
    nameTr: 'Ağır Kompozit Plasteel Zırh',
    category: 'defense',
    descriptionTr: 'Karbon nanotüp takviyeli plasteel zırh tabakası. Gövde dayanıklılığını önemli ölçüde artırır.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.45,
    shieldMultiplier: 0.9,
    speedMultiplier: 0.90,
    cargoMultiplier: 1.0,
    extraCost: { ore: 55, crystal: 10 },
    icon: '🧱',
    accentColor: '#64748b',
  },
  evasion_thrusters: {
    id: 'evasion_thrusters',
    nameTr: 'Vektör Kaçınma İticileri',
    category: 'defense',
    descriptionTr: 'Çok eksenli mikro iticiler. Düşman yaylım ateşinden çevik manevralarla kaçınma şansı sağlar.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.1,
    shieldMultiplier: 1.15,
    speedMultiplier: 1.15,
    cargoMultiplier: 1.0,
    extraCost: { crystal: 30, fuel: 25 },
    icon: '💨',
    accentColor: '#10b981',
  },
};

export const UTILITY_MODULES: Record<UtilityModuleId, ModuleDefinition> = {
  standard_reactor: {
    id: 'standard_reactor',
    nameTr: 'Kompakt Füzyon Reaktörü',
    category: 'utility',
    descriptionTr: 'Tüm gemi alt sistemlerine güvenilir ve stabil enerji sağlayan fabrika çıkışı çekirdek.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    cargoMultiplier: 1.0,
    extraCost: {},
    icon: '⚛️',
    accentColor: '#38bdf8',
  },
  cargo_expander: {
    id: 'cargo_expander',
    nameTr: 'Genişletilmiş Kargo Ambarı',
    category: 'utility',
    descriptionTr: 'Optimize edilmiş modüler konteyner yuvaları. Cevher ve kristal taşıma kapasitesini %50 artırır.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 0.95,
    cargoMultiplier: 1.50,
    extraCost: { ore: 45, crystal: 15 },
    icon: '📦',
    accentColor: '#f59e0b',
  },
  subspace_sensor: {
    id: 'subspace_sensor',
    nameTr: 'Subspace Taktik Sensör Dizisi',
    category: 'utility',
    descriptionTr: 'Düşman filolarının rotalarını ve boyutlarını önceden tespit eden derin uzay sensör paketi.',
    attackMultiplier: 1.05,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.05,
    cargoMultiplier: 1.0,
    extraCost: { crystal: 40, fuel: 15 },
    icon: '📡',
    accentColor: '#00f3ff',
  },
  hyper_drive: {
    id: 'hyper_drive',
    nameTr: 'Aşırı Beslemeli Hiper-Sürücü',
    category: 'utility',
    descriptionTr: 'Takyon enjektörlü hiper-uzay motoru. Atlama hatlarındaki seyir hızını belirgin şekilde yükseltir.',
    attackMultiplier: 1.0,
    hullMultiplier: 1.0,
    shieldMultiplier: 1.0,
    speedMultiplier: 1.25,
    cargoMultiplier: 1.0,
    extraCost: { fuel: 45 },
    icon: '⚡',
    accentColor: '#eab308',
  },
};

export const DEFAULT_LOADOUTS: ShipLoadoutMap = {
  scout: {
    weapon: 'laser',
    defense: 'evasion_thrusters',
    utility: 'subspace_sensor',
  },
  transport: {
    weapon: 'laser',
    defense: 'standard_shield',
    utility: 'cargo_expander',
  },
  fighter: {
    weapon: 'plasma',
    defense: 'evasion_thrusters',
    utility: 'hyper_drive',
  },
  battleship: {
    weapon: 'railgun',
    defense: 'plasteel_armor',
    utility: 'standard_reactor',
  },
};

/**
 * Calculates modified ship statistics and costs according to equipped loadouts
 */
export function getModifiedShipStats(shipType: ShipType, loadout?: ShipLoadout): ShipStats {
  const base = SHIP_STATS[shipType];
  if (!loadout) return { ...base, cost: { ...base.cost } };

  const wMod = WEAPON_MODULES[loadout.weapon] || WEAPON_MODULES.laser;
  const dMod = DEFENSE_MODULES[loadout.defense] || DEFENSE_MODULES.standard_shield;
  const uMod = UTILITY_MODULES[loadout.utility] || UTILITY_MODULES.standard_reactor;

  const totalAtkMult = wMod.attackMultiplier * dMod.attackMultiplier * uMod.attackMultiplier;
  const totalHullMult = wMod.hullMultiplier * dMod.hullMultiplier * uMod.hullMultiplier;
  const totalShieldMult = wMod.shieldMultiplier * dMod.shieldMultiplier * uMod.shieldMultiplier;
  const totalSpeedMult = wMod.speedMultiplier * dMod.speedMultiplier * uMod.speedMultiplier;
  const totalCargoMult = wMod.cargoMultiplier * dMod.cargoMultiplier * uMod.cargoMultiplier;

  const extraOre = (wMod.extraCost.ore || 0) + (dMod.extraCost.ore || 0) + (uMod.extraCost.ore || 0);
  const extraCrystal = (wMod.extraCost.crystal || 0) + (dMod.extraCost.crystal || 0) + (uMod.extraCost.crystal || 0);
  const extraFuel = (wMod.extraCost.fuel || 0) + (dMod.extraCost.fuel || 0) + (uMod.extraCost.fuel || 0);

  return {
    ...base,
    attack: Math.round(base.attack * totalAtkMult),
    hull: Math.round(base.hull * totalHullMult),
    shield: Math.round(base.shield * totalShieldMult),
    speed: Math.round(base.speed * totalSpeedMult),
    cargoCapacity: Math.round(base.cargoCapacity * totalCargoMult),
    cost: {
      ore: base.cost.ore + extraOre,
      crystal: base.cost.crystal + extraCrystal,
      fuel: base.cost.fuel + extraFuel,
    },
  };
}

/**
 * Calculates refit cost for upgrading existing garrison ships to current loadout
 */
export function calculateRefitCost(shipType: ShipType, loadout: ShipLoadout, count: number = 1): Resources {
  const base = SHIP_STATS[shipType];
  const mod = getModifiedShipStats(shipType, loadout);
  const extraOre = Math.max(0, mod.cost.ore - base.cost.ore);
  const extraCrystal = Math.max(0, mod.cost.crystal - base.cost.crystal);
  const extraFuel = Math.max(0, mod.cost.fuel - base.cost.fuel);

  return {
    ore: Math.max(10, Math.round(extraOre * 0.75 + base.cost.ore * 0.05)) * count,
    crystal: Math.max(5, Math.round(extraCrystal * 0.75 + base.cost.crystal * 0.05)) * count,
    fuel: Math.round(extraFuel * 0.75 + base.cost.fuel * 0.05) * count,
  };
}

const STORAGE_KEY = 'galaksi_ship_loadouts';

export function loadSavedLoadouts(): ShipLoadoutMap {
  if (typeof window === 'undefined') return DEFAULT_LOADOUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOADOUTS;
    const parsed = JSON.parse(raw);
    return {
      scout: parsed.scout || DEFAULT_LOADOUTS.scout,
      transport: parsed.transport || DEFAULT_LOADOUTS.transport,
      fighter: parsed.fighter || DEFAULT_LOADOUTS.fighter,
      battleship: parsed.battleship || DEFAULT_LOADOUTS.battleship,
    };
  } catch {
    return DEFAULT_LOADOUTS;
  }
}

export function saveLoadouts(loadouts: ShipLoadoutMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadouts));
  } catch {}
}
