import {
  BuildingStats,
  BuildingType,
  DefenseStats,
  DefenseStructureType,
  ResearchStats,
  ResearchType,
  Resources,
  ShipStats,
  ShipType,
} from './types';

export const GAME_CONSTANTS = {
  // Newbie protection duration: 48 hours (in milliseconds)
  PROTECTION_DURATION_MS: 48 * 60 * 60 * 1000,

  // Resource Base Rates per hour
  BASE_ORE_PRODUCTION_PER_HOUR: 30,
  BASE_CRYSTAL_PRODUCTION_PER_HOUR: 20,
  BASE_FUEL_PRODUCTION_PER_HOUR: 10,

  // Base planet storage and protection
  BASE_STORAGE_CAP: 20000,
  STORAGE_CAP_PER_MINE_LEVEL: 5000,
  BASE_PROTECTED_STORAGE: 1200,
  PROTECTED_STORAGE_PER_LEVEL: 400,

  // Raid loot ceiling (Max 20% of unprotected resources per GDD v0.1.0 line 159)
  MAX_RAID_LOOT_PERCENTAGE: 0.20,

  // Debris salvage yield from combat casualties (30% of ore & crystal)
  COMBAT_DEBRIS_RECOVERY_RATIO: 0.30,

  // Colonization cost (materials transported to empty slot)
  COLONY_COST: {
    ore: 500,
    crystal: 300,
    fuel: 200,
  } as Resources,

  // Max colonies per player in Phase A (Homeworld + 2 colonies = 3 total)
  MAX_COLONIES_PER_PLAYER: 3,

  // Fleet recall allowed up to 50% of flight duration
  RECALL_LOCK_RATIO: 0.50,

  // Relay weekly control tick interval (e.g. 10 minutes in real time or 1 game hour)
  RELAY_POINT_INTERVAL_MS: 10 * 60 * 1000,
  RELAY_POINTS_PER_TICK: 10,
  RELAY_SENSOR_RADIUS_BONUS: 2,

  // Sensor ranges: base is 1 jump lane; sensor array adds 1 per 2 levels; research adds +1
  BASE_SENSOR_RANGE: 1,

  // Anti-bash repeated raid protection ceiling (Max 6 attacks on same target per 24h)
  ANTI_BASH_MAX_ATTACKS_PER_24H: 6,

  // Victory Conditions & Season Loop (Phase 4)
  VICTORY_HEGEMONY_POINTS_THRESHOLD: 500, // 500 Hegemony/Relay points to win by Hegemony
  VICTORY_DOMINATION_COLONY_PERCENT: 0.60, // 60% of all colonized planets to win by Domination
  VICTORY_MIN_TOTAL_COLONIES_FOR_DOMINATION: 6, // Minimum 6 colonized planets in sector for domination to trigger
};

export const SHIP_STATS: Record<ShipType, ShipStats> = {
  scout: {
    type: 'scout',
    name: 'Scout',
    nameTr: 'Keşif Gemisi',
    roleTr: 'Sistem taraması, hızlı istihbarat ve rota gözlemi',
    hull: 120,
    shield: 40,
    attack: 18,
    speed: 260, // distance units per second
    cargoCapacity: 120,
    fuelConsumptionPerUnit: 0.3,
    cost: { ore: 160, crystal: 90, fuel: 40 },
    buildTimeSec: 120, // 2 minutes
  },
  transport: {
    type: 'transport',
    name: 'Transport',
    nameTr: 'Ağır Nakliye',
    roleTr: 'Kaynak aktarımı, enkaz toplama ve koloni kurma',
    hull: 320,
    shield: 60,
    attack: 10,
    speed: 130,
    cargoCapacity: 2800,
    fuelConsumptionPerUnit: 0.6,
    cost: { ore: 380, crystal: 160, fuel: 90 },
    buildTimeSec: 240, // 4 minutes
  },
  fighter: {
    type: 'fighter',
    name: 'Fighter',
    nameTr: 'Hafif Avcı',
    roleTr: 'Filo önleme, konvoy eskortu ve hızlı taktik vuruş',
    hull: 220,
    shield: 90,
    attack: 65,
    speed: 220,
    cargoCapacity: 60,
    fuelConsumptionPerUnit: 0.5,
    cost: { ore: 320, crystal: 180, fuel: 80 },
    buildTimeSec: 180, // 3 minutes
  },
  battleship: {
    type: 'battleship',
    name: 'Battleship',
    nameTr: 'Savaş Gemisi',
    roleTr: 'Ağır gezegen baskını, hat savunması ve röle kontrolü',
    hull: 1200,
    shield: 600,
    attack: 240,
    speed: 95,
    cargoCapacity: 750,
    fuelConsumptionPerUnit: 1.8,
    cost: { ore: 1350, crystal: 950, fuel: 420 },
    buildTimeSec: 720, // 12 minutes
  },
};

export const DEFENSE_STATS: Record<DefenseStructureType, DefenseStats> = {
  missile_battery: {
    type: 'missile_battery',
    name: 'Missile Battery',
    nameTr: 'Hafif Füze Bataryası',
    roleTr: 'Gezegene yaklaşan hafif avcı ve keşif gemilerine karşı hızlı güdümlü füze salvosu',
    hull: 280,
    shield: 80,
    attack: 85,
    cost: { ore: 240, crystal: 90, fuel: 20 },
    buildTimeSec: 90, // 1.5 minutes
    icon: '🚀',
    accentColor: '#38bdf8',
  },
  plasma_turret: {
    type: 'plasma_turret',
    name: 'Plasma Turret',
    nameTr: 'Ağır Plazma Tareti',
    roleTr: 'Aşırı ısılı plazma topları ile orta ölçekli baskın filolarının zırhını eritir',
    hull: 680,
    shield: 220,
    attack: 230,
    cost: { ore: 580, crystal: 340, fuel: 110 },
    buildTimeSec: 180, // 3 minutes
    icon: '🔥',
    accentColor: '#f97316',
  },
  ion_cannon: {
    type: 'ion_cannon',
    name: 'Ion Cannon',
    nameTr: 'İyon Topu Bataryası',
    roleTr: 'Kruvazör ve savaş gemilerinin enerji kalkanlarını felç eden derin uzay bataryası',
    hull: 1200,
    shield: 650,
    attack: 420,
    cost: { ore: 1250, crystal: 900, fuel: 350 },
    buildTimeSec: 360, // 6 minutes
    icon: '⚡',
    accentColor: '#a855f7',
  },
};

export const BUILDING_STATS: Record<BuildingType, BuildingStats> = {
  ore_mine: {
    type: 'ore_mine',
    name: 'Ore Mine',
    nameTr: 'Cevher Ocağı',
    descriptionTr: 'Gezegen kabuğundan cevher çıkarır. Yapıların ve filonun temel maddesidir.',
    baseCost: { ore: 80, crystal: 30, fuel: 0 },
    costMultiplier: 1.45,
    baseBuildTimeSec: 90, // 1.5 minutes
    timeMultiplier: 1.25,
  },
  crystal_synth: {
    type: 'crystal_synth',
    name: 'Crystal Synthesizer',
    nameTr: 'Kristal Sentezleyici',
    descriptionTr: 'Yüksek saflıkta kristal üretir. İleri teknoloji ve gemi kalkanları için şarttır.',
    baseCost: { ore: 110, crystal: 60, fuel: 10 },
    costMultiplier: 1.5,
    baseBuildTimeSec: 150, // 2.5 minutes
    timeMultiplier: 1.28,
  },
  fuel_refinery: {
    type: 'fuel_refinery',
    name: 'Fuel Refinery',
    nameTr: 'Yakıt Rafinerisi',
    descriptionTr: 'Uçuş hatlarında filo hareketi için gerekli hiper-yakıtı üretir.',
    baseCost: { ore: 130, crystal: 80, fuel: 20 },
    costMultiplier: 1.55,
    baseBuildTimeSec: 210, // 3.5 minutes
    timeMultiplier: 1.3,
  },
  shipyard: {
    type: 'shipyard',
    name: 'Shipyard',
    nameTr: 'Tersane',
    descriptionTr: 'Uzay filosu üretir. Yüksek seviyeler gemi üretim süresini hızlandırır.',
    baseCost: { ore: 250, crystal: 150, fuel: 60 },
    costMultiplier: 1.6,
    baseBuildTimeSec: 300, // 5 minutes
    timeMultiplier: 1.3,
  },
  research_lab: {
    type: 'research_lab',
    name: 'Research Lab',
    nameTr: 'Araştırma Merkezi',
    descriptionTr: 'İmparatorluk geneli teknolojileri geliştirir. Seviyesi araştırma hızını artırır.',
    baseCost: { ore: 200, crystal: 220, fuel: 80 },
    costMultiplier: 1.6,
    baseBuildTimeSec: 360, // 6 minutes
    timeMultiplier: 1.35,
  },
  sensor_array: {
    type: 'sensor_array',
    name: 'Sensor Array',
    nameTr: 'Sensör Dizisi',
    descriptionTr: 'Sektördeki filo hareketlerini erken fark eder; düşman filoların rotasını çözer.',
    baseCost: { ore: 180, crystal: 160, fuel: 90 },
    costMultiplier: 1.5,
    baseBuildTimeSec: 240, // 4 minutes
    timeMultiplier: 1.3,
  },
};

export const RESEARCH_STATS: Record<ResearchType, ResearchStats> = {
  engines: {
    type: 'engines',
    name: 'Sub-space Engines',
    nameTr: 'Alt-Uzay Motorları',
    descriptionTr: 'Tüm filoların hızını ve rota önleme yeteneğini artırır (+12% hız / seviye).',
    baseCost: { ore: 220, crystal: 300, fuel: 180 },
    costMultiplier: 1.7,
    baseResearchTimeSec: 420, // 7 minutes
    timeMultiplier: 1.35,
  },
  weapons: {
    type: 'weapons',
    name: 'Plasma & Beam Weapons',
    nameTr: 'Plazma ve Işın Silahları',
    descriptionTr: 'Filoların çatışma hasarını ve kalkan delme gücünü artırır (+10% saldırı / seviye).',
    baseCost: { ore: 320, crystal: 280, fuel: 140 },
    costMultiplier: 1.7,
    baseResearchTimeSec: 480, // 8 minutes
    timeMultiplier: 1.35,
  },
  sensors: {
    type: 'sensors',
    name: 'Tachyon Sensors',
    nameTr: 'Tanyon Sensörleri',
    descriptionTr: 'İstihbarat seviyesini artırır; düşman filoların tam gemi kompozisyonunu açar.',
    baseCost: { ore: 200, crystal: 340, fuel: 220 },
    costMultiplier: 1.7,
    baseResearchTimeSec: 540, // 9 minutes
    timeMultiplier: 1.35,
  },
};

/**
 * Calculates hourly production rate for a building level
 */
export function calculateHourlyProduction(type: 'ore' | 'crystal' | 'fuel', level: number): number {
  if (level <= 0) return 0;
  switch (type) {
    case 'ore':
      return Math.round(GAME_CONSTANTS.BASE_ORE_PRODUCTION_PER_HOUR * level * Math.pow(1.18, level - 1) + 20);
    case 'crystal':
      return Math.round(GAME_CONSTANTS.BASE_CRYSTAL_PRODUCTION_PER_HOUR * level * Math.pow(1.16, level - 1) + 12);
    case 'fuel':
      return Math.round(GAME_CONSTANTS.BASE_FUEL_PRODUCTION_PER_HOUR * level * Math.pow(1.14, level - 1) + 6);
  }
}

/**
 * Cost calculation for next building level
 */
export function getBuildingUpgradeCost(type: BuildingType, currentLevel: number): Resources {
  const stats = BUILDING_STATS[type];
  const mult = Math.pow(stats.costMultiplier, currentLevel);
  return {
    ore: Math.round(stats.baseCost.ore * mult),
    crystal: Math.round(stats.baseCost.crystal * mult),
    fuel: Math.round(stats.baseCost.fuel * mult),
  };
}

/**
 * Duration calculation for next building level in milliseconds
 */
export function getBuildingUpgradeDurationMs(type: BuildingType, currentLevel: number): number {
  const stats = BUILDING_STATS[type];
  const mult = Math.pow(stats.timeMultiplier, currentLevel);
  return Math.round(stats.baseBuildTimeSec * mult * 1000);
}

/**
 * Cost calculation for next research level
 */
export function getResearchCost(type: ResearchType, currentLevel: number): Resources {
  const stats = RESEARCH_STATS[type];
  const mult = Math.pow(stats.costMultiplier, currentLevel);
  return {
    ore: Math.round(stats.baseCost.ore * mult),
    crystal: Math.round(stats.baseCost.crystal * mult),
    fuel: Math.round(stats.baseCost.fuel * mult),
  };
}

/**
 * Duration calculation for next research level in milliseconds
 */
export function getResearchDurationMs(type: ResearchType, currentLevel: number, labLevel: number): number {
  const stats = RESEARCH_STATS[type];
  const mult = Math.pow(stats.timeMultiplier, currentLevel);
  const labSpeedup = 1 + (labLevel * 0.15); // +15% research speed per lab level
  return Math.round((stats.baseResearchTimeSec * mult / labSpeedup) * 1000);
}

/**
 * Shipyard build duration per unit in milliseconds (decreases with shipyard level)
 */
export function getShipBuildDurationMs(shipType: ShipType, shipyardLevel: number): number {
  const stats = SHIP_STATS[shipType];
  const speedup = 1 + (Math.max(1, shipyardLevel) * 0.12);
  return Math.round((stats.buildTimeSec / speedup) * 1000);
}

/**
 * Defense installation build duration per unit in milliseconds (decreases with shipyard level)
 */
export function getDefenseBuildDurationMs(defenseType: DefenseStructureType, shipyardLevel: number): number {
  const stats = DEFENSE_STATS[defenseType];
  const speedup = 1 + (Math.max(1, shipyardLevel) * 0.12);
  return Math.round((stats.buildTimeSec / speedup) * 1000);
}
