import { Resources } from './types';
import { Starbase, StarbaseModuleType, StarbaseTier } from './types';

export interface StarbaseTierStats {
  tier: StarbaseTier;
  nameTr: string;
  descriptionTr: string;
  maxModules: number;
  baseHull: number;
  baseShield: number;
  baseAttack: number;
  sensorRangeHops: number;
  cost: Resources;
  buildTimeMs: number;
}

export const STARBASE_TIER_CONFIG: Record<StarbaseTier, StarbaseTierStats> = {
  outpost: {
    tier: 'outpost',
    nameTr: 'Yörünge Karakolu',
    descriptionTr: 'Sektörel sınır hakimiyeti ve temel sensör kapsama alanı sağlayan modüler uzay istasyonu.',
    maxModules: 1,
    baseHull: 1200,
    baseShield: 400,
    baseAttack: 35,
    sensorRangeHops: 1,
    cost: { ore: 400, crystal: 200, fuel: 50 },
    buildTimeMs: 25_000,
  },
  starbase: {
    tier: 'starbase',
    nameTr: 'Yıldız Üssü',
    descriptionTr: 'Gelişmiş savunma bataryaları ve genişletilmiş modül yuvalarına sahip derin uzay kalesi.',
    maxModules: 2,
    baseHull: 3000,
    baseShield: 1200,
    baseAttack: 95,
    sensorRangeHops: 2,
    cost: { ore: 800, crystal: 500, fuel: 150 },
    buildTimeMs: 45_000,
  },
  citadel: {
    tier: 'citadel',
    nameTr: 'Galaktik Hisar',
    descriptionTr: 'Ağır zırh kaplamaları, 4 modül yuvası ve yıkıcı ateş gücüne sahip devasa uzay kalesi.',
    maxModules: 4,
    baseHull: 7500,
    baseShield: 3500,
    baseAttack: 220,
    sensorRangeHops: 3,
    cost: { ore: 1800, crystal: 1100, fuel: 350 },
    buildTimeMs: 75_000,
  },
};

export interface StarbaseModuleStats {
  type: StarbaseModuleType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  cost: Resources;
  buildTimeMs: number;
  effects: {
    sensorHopsBonus?: number;
    hullBonus?: number;
    shieldBonus?: number;
    attackBonus?: number;
    shipBuildSpeedBonus?: number;
    resourceProductionBonus?: number;
  };
}

export const STARBASE_MODULE_CONFIG: Record<StarbaseModuleType, StarbaseModuleStats> = {
  sensor_relay: {
    type: 'sensor_relay',
    nameTr: 'Derin Uzay Sensör Rölesi',
    descriptionTr: 'Hiperuzay algılayıcılarını güçlendirir. +1 atlama ek sensör menzili sağlar.',
    icon: '📡',
    cost: { ore: 250, crystal: 150, fuel: 50 },
    buildTimeMs: 15_000,
    effects: {
      sensorHopsBonus: 1,
    },
  },
  defense_platform: {
    type: 'defense_platform',
    nameTr: 'Ağır Savunma Platformu',
    descriptionTr: 'Yörünge torpido ve lazer bataryası. +1000 Gövde, +500 Kalkan ve +60 Ateş Gücü ekler.',
    icon: '🛡️',
    cost: { ore: 300, crystal: 200, fuel: 50 },
    buildTimeMs: 20_000,
    effects: {
      hullBonus: 1000,
      shieldBonus: 500,
      attackBonus: 60,
    },
  },
  shipyard_bay: {
    type: 'shipyard_bay',
    nameTr: 'Yörünge Tersane Hangarı',
    descriptionTr: 'Sistemdeki kolonilerin uzay gemisi inşa süresini %25 hızlandırır.',
    icon: '🛠️',
    cost: { ore: 350, crystal: 200, fuel: 100 },
    buildTimeMs: 20_000,
    effects: {
      shipBuildSpeedBonus: 0.25,
    },
  },
  trade_hub: {
    type: 'trade_hub',
    nameTr: 'Galaktik Ticaret Hub\'ı',
    descriptionTr: 'Sistemdeki kolonilerin maden, kristal ve yakıt üretimini %15 artırır.',
    icon: '💰',
    cost: { ore: 300, crystal: 250, fuel: 50 },
    buildTimeMs: 20_000,
    effects: {
      resourceProductionBonus: 0.15,
    },
  },
};

/**
 * Calculates effective aggregate stats for a starbase including installed modules
 */
export function getStarbaseEffectiveStats(
  starbase: Starbase,
  weaponsLevel: number = 0
): {
  maxHull: number;
  maxShield: number;
  attack: number;
  sensorHops: number;
  shipBuildMultiplier: number;
  resourceMultiplier: number;
  tradeHubCount: number;
  shipyardBayCount: number;
  defensePlatformCount: number;
} {
  const tierConfig = STARBASE_TIER_CONFIG[starbase.tier] || STARBASE_TIER_CONFIG.outpost;
  let maxHull = tierConfig.baseHull;
  let maxShield = tierConfig.baseShield;
  let baseAttack = tierConfig.baseAttack;
  let sensorHops = tierConfig.sensorRangeHops;
  let shipBuildBonus = 0;
  let resourceBonus = 0;

  let tradeHubCount = 0;
  let shipyardBayCount = 0;
  let defensePlatformCount = 0;

  for (const modType of starbase.modules) {
    const modConfig = STARBASE_MODULE_CONFIG[modType];
    if (!modConfig) continue;

    if (modConfig.effects.hullBonus) maxHull += modConfig.effects.hullBonus;
    if (modConfig.effects.shieldBonus) maxShield += modConfig.effects.shieldBonus;
    if (modConfig.effects.attackBonus) baseAttack += modConfig.effects.attackBonus;
    if (modConfig.effects.sensorHopsBonus) sensorHops += modConfig.effects.sensorHopsBonus;
    if (modConfig.effects.shipBuildSpeedBonus) {
      shipBuildBonus += modConfig.effects.shipBuildSpeedBonus;
      shipyardBayCount++;
    }
    if (modConfig.effects.resourceProductionBonus) {
      resourceBonus += modConfig.effects.resourceProductionBonus;
      tradeHubCount++;
    }
    if (modType === 'defense_platform') {
      defensePlatformCount++;
    }
  }

  const weaponMult = 1 + (weaponsLevel * 0.10);
  const finalAttack = Math.round(baseAttack * weaponMult);

  return {
    maxHull,
    maxShield,
    attack: finalAttack,
    sensorHops,
    shipBuildMultiplier: 1 + shipBuildBonus,
    resourceMultiplier: 1 + resourceBonus,
    tradeHubCount,
    shipyardBayCount,
    defensePlatformCount,
  };
}

/**
 * Creates a brand new starbase entity
 */
export function createStarbase(
  systemId: string,
  ownerId: string,
  tier: StarbaseTier = 'outpost',
  createdAt: number = 0
): Starbase {
  const config = STARBASE_TIER_CONFIG[tier] || STARBASE_TIER_CONFIG.outpost;
  return {
    id: `sb_${systemId}_${createdAt}`,
    systemId,
    ownerId,
    tier,
    modules: [],
    hull: config.baseHull,
    maxHull: config.baseHull,
    shield: config.baseShield,
    maxShield: config.baseShield,
    upgradeQueue: null,
    moduleQueue: null,
    createdAt,
  };
}

/**
 * Gets the next tier progression for a starbase
 */
export function getNextStarbaseTier(currentTier: StarbaseTier): StarbaseTier | null {
  if (currentTier === 'outpost') return 'starbase';
  if (currentTier === 'starbase') return 'citadel';
  return null;
}
