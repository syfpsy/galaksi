import { calculateHourlyProduction, DEFENSE_STATS, SHIP_STATS } from './constants';
import {
  ActiveSenateModifier,
  GameState,
  Resources,
  SenateResolution,
  SenateResolutionType,
  SenateSessionHistoryItem,
  SenateState,
  SenateVote,
  ShipType,
  DefenseStructureType,
} from './types';
import { getStarbaseEffectiveStats } from './starbases';

export interface SenateResolutionDef {
  type: SenateResolutionType;
  nameTr: string;
  nameEn: string;
  shortDescTr: string;
  detailedEffectTr: string;
  icon: string;
  accentColor: string;
  requiresTarget: boolean;
  baseDepositCost: Resources;
}

export const SENATE_CONSTANTS = {
  REGULAR_SESSION_DURATION_MS: 60_000,
  EMERGENCY_SESSION_DURATION_MS: 25_000,
  RESOLUTION_ACTIVE_DURATION_MS: 300_000, // 5 minutes active law duration
  EMERGENCY_SESSION_COST: { ore: 500, crystal: 1500, fuel: 500 },
  CUSTODIAN_HEGEMONY_POINTS_REWARD: 150,
  CUSTODIAN_DIPLOMATIC_WEIGHT_BONUS_PERCENT: 0.30,
  CUSTODIAN_FLEET_ATTACK_BONUS_PERCENT: 0.20,
  SANCTIONS_DIPLOMATIC_WEIGHT_PENALTY_PERCENT: 0.25,
  SANCTIONS_MARKET_FEE_PENALTY_PERCENT: 0.25,
  MILITARY_READINESS_ATTACK_BONUS_PERCENT: 0.15,
  MILITARY_READINESS_BUILD_SPEED_BONUS_PERCENT: 0.10,
  MILITARY_READINESS_CIVILIAN_PROD_PENALTY_PERCENT: 0.10,
  FREE_TRADE_FEE_DISCOUNT_PERCENT: 0.05,
  FREE_TRADE_STARBASE_HUB_BONUS: 0.25, // +25% instead of +15%
  SCIENTIFIC_COOPERATIVE_RESEARCH_SPEED_BONUS: 0.25, // 0.8x duration
  SCIENTIFIC_COOPERATIVE_SENSOR_HOP_BONUS: 1,
};

export const SENATE_RESOLUTION_CONFIG: Record<SenateResolutionType, SenateResolutionDef> = {
  military_readiness: {
    type: 'military_readiness',
    nameTr: 'Askeri Seferberlik Paktı',
    nameEn: 'Military Readiness Pact',
    shortDescTr: 'Galaksi çapında askeri teyakkuz ve donanma üretim önceliği.',
    detailedEffectTr: 'Tüm filolara +%15 taarruz gücü ve tersanelere +%10 gemi inşa hızı sağlar. Sivil üretimde -%10 ceza uygulanır.',
    icon: '⚔️',
    accentColor: '#ef4444',
    requiresTarget: false,
    baseDepositCost: { ore: 0, crystal: 500, fuel: 0 },
  },
  free_trade: {
    type: 'free_trade',
    nameTr: 'Galaktik Serbest Ticaret Yasası',
    nameEn: 'Galactic Free Trade Act',
    shortDescTr: 'Galaktik pazar komisyonlarını düşürür ve ticaret üslerini sübvanse eder.',
    detailedEffectTr: 'Pazar işlem komisyonu tabanını düşürür (%5 indirim). Yıldız üssü Ticaret Merkezi modülleri +%15 yerine +%25 kaynak üretimi sağlar.',
    icon: '🪙',
    accentColor: '#eab308',
    requiresTarget: false,
    baseDepositCost: { ore: 0, crystal: 500, fuel: 0 },
  },
  scientific_cooperative: {
    type: 'scientific_cooperative',
    nameTr: 'Ortak Bilim & Ar-Ge Ağı',
    nameEn: 'Scientific Cooperative Accord',
    shortDescTr: 'Sensör ağlarının paylaşımı ve ortak akademik teknoloji koordinasyonu.',
    detailedEffectTr: 'Teknoloji araştırma süresi %20 kısalır (+%25 araştırma hızı). Tüm imparatorluklar hiper-şeritlerde +1 sektör sensör görüşü kazanır.',
    icon: '🔬',
    accentColor: '#06b6d4',
    requiresTarget: false,
    baseDepositCost: { ore: 0, crystal: 500, fuel: 0 },
  },
  bounty_hunters: {
    type: 'bounty_hunters',
    nameTr: 'Galaktik Avcı Doktrini',
    nameEn: 'Bounty Hunter Doctrine',
    shortDescTr: 'Korsan tehditlerine ve kadim canavarlara karşı ödül havuzu seferberliği.',
    detailedEffectTr: 'Korsan inleri ve Kadim Titan imhasında kazanılan kaynak ve Amiral Deneyim (XP) ödülleri 2 katına çıkarılır.',
    icon: '🎯',
    accentColor: '#a855f7',
    requiresTarget: false,
    baseDepositCost: { ore: 0, crystal: 500, fuel: 0 },
  },
  custodian_election: {
    type: 'custodian_election',
    nameTr: 'Galaktik Muhafız Seçimi',
    nameEn: 'Galactic Custodian Election',
    shortDescTr: 'Galaktik krizleri yönetmek üzere olağanüstü yetkili Muhafız Lideri atanması.',
    detailedEffectTr: 'Seçilen lider +150 Hegemonya Zafer Puanı, +%30 Diplomatik Ağırlık ve donanmasına +%20 ateş gücü üstünlüğü kazanır.',
    icon: '👑',
    accentColor: '#3b82f6',
    requiresTarget: true,
    baseDepositCost: { ore: 500, crystal: 800, fuel: 300 },
  },
  sanctions: {
    type: 'sanctions',
    nameTr: 'Galaktik Ambargo & Yaptırım',
    nameEn: 'Galactic Sanctions',
    shortDescTr: 'Saldırgan veya tehditkar bir imparatorluğa diplomatik ve ticari tecrit.',
    detailedEffectTr: 'Hedef imparatorluğun pazar işlemlerine +%25 komisyon cezası ve -%25 diplomatik ağırlık uygulanır. Yeni yasa teklif edemez.',
    icon: '🚫',
    accentColor: '#f97316',
    requiresTarget: true,
    baseDepositCost: { ore: 200, crystal: 600, fuel: 200 },
  },
};

export interface DiplomaticWeightResult {
  total: number;
  breakdown: {
    fleetPower: number;
    economy: number;
    technology: number;
    colonies: number;
    custodianBonus: number;
    sanctionsPenalty: number;
  };
}

/**
 * Calculates dynamic voting and diplomatic weight for a player
 */
export function calculateDiplomaticWeight(
  state: GameState,
  playerId: string
): DiplomaticWeightResult {
  const player = state.players[playerId];
  if (!player) {
    return {
      total: 10,
      breakdown: {
        fleetPower: 0,
        economy: 0,
        technology: 0,
        colonies: 0,
        custodianBonus: 0,
        sanctionsPenalty: 0,
      },
    };
  }

  const weaponsLevel = player.research?.weapons || 0;
  const weaponMult = 1 + (weaponsLevel * 0.10);

  // 1. Fleet & Defense Power
  let rawCombatPower = 0;

  // Fleets
  for (const fleet of Object.values(state.fleets)) {
    if (fleet.ownerId === playerId && fleet.status !== 'destroyed') {
      for (const [shipType, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
        if (count > 0) {
          const stats = SHIP_STATS[shipType];
          rawCombatPower += (stats.attack * count * weaponMult) * 1.5;
          rawCombatPower += ((stats.hull + stats.shield) * count) * 0.5;
        }
      }
    }
  }

  // Planets Garrison & Defenses
  const ownedPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  for (const p of ownedPlanets) {
    for (const [shipType, count] of Object.entries(p.garrison) as [ShipType, number][]) {
      if (count > 0) {
        const stats = SHIP_STATS[shipType];
        rawCombatPower += (stats.attack * count * weaponMult) * 1.5;
        rawCombatPower += ((stats.hull + stats.shield) * count) * 0.5;
      }
    }

    if (p.defenses) {
      for (const [defType, count] of Object.entries(p.defenses) as [DefenseStructureType, number][]) {
        if (count > 0) {
          const stats = DEFENSE_STATS[defType];
          if (stats) {
            rawCombatPower += (stats.attack * count * weaponMult) * 1.2;
            rawCombatPower += ((stats.hull + stats.shield) * count) * 0.5;
          }
        }
      }
    }
  }

  // Starbases
  if (state.starbases) {
    for (const sb of Object.values(state.starbases)) {
      if (sb.ownerId === playerId) {
        const sbStats = getStarbaseEffectiveStats(sb, weaponsLevel);
        rawCombatPower += sbStats.attack * 1.5;
        rawCombatPower += (sbStats.maxHull + sbStats.maxShield) * 0.5;
      }
    }
  }

  const fleetPower = Math.max(10, Math.round(rawCombatPower / 10));

  // 2. Economy Weight (Hourly Production)
  let totalHourlyProd = 0;
  for (const p of ownedPlanets) {
    const oreProd = calculateHourlyProduction('ore', p.buildings.ore_mine);
    const crystalProd = calculateHourlyProduction('crystal', p.buildings.crystal_synth);
    const fuelProd = calculateHourlyProduction('fuel', p.buildings.fuel_refinery);
    totalHourlyProd += oreProd + (crystalProd * 1.5) + (fuelProd * 2.0);
  }
  const economy = Math.max(10, Math.round(totalHourlyProd / 5));

  // 3. Technology Weight (sum of research levels * 50)
  const engines = player.research?.engines || 0;
  const weapons = player.research?.weapons || 0;
  const sensors = player.research?.sensors || 0;
  const technology = Math.max(10, (engines + weapons + sensors) * 50);

  // 4. Colonies Weight (colonies count * 100)
  const colonies = Math.max(50, ownedPlanets.length * 100);

  const baseWeight = fleetPower + economy + technology + colonies;

  // 5. Custodian Bonus (+30%)
  const isCustodian = state.senate?.custodianPlayerId === playerId;
  const custodianBonus = isCustodian
    ? Math.round(baseWeight * SENATE_CONSTANTS.CUSTODIAN_DIPLOMATIC_WEIGHT_BONUS_PERCENT)
    : 0;

  // 6. Sanctions Penalty (-25%)
  const isSanctioned = state.senate?.activeResolutions.some(
    (r) => r.resolutionType === 'sanctions' && r.targetPlayerId === playerId
  ) ?? false;
  const sanctionsPenalty = isSanctioned
    ? Math.round(baseWeight * SENATE_CONSTANTS.SANCTIONS_DIPLOMATIC_WEIGHT_PENALTY_PERCENT)
    : 0;

  const total = Math.max(10, baseWeight + custodianBonus - sanctionsPenalty);

  return {
    total,
    breakdown: {
      fleetPower,
      economy,
      technology,
      colonies,
      custodianBonus,
      sanctionsPenalty,
    },
  };
}

export interface SenateVoteTallyResult {
  forWeight: number;
  againstWeight: number;
  abstainWeight: number;
  forVoters: string[];
  againstVoters: string[];
  abstainVoters: string[];
  passed: boolean;
}

/**
 * Tallies diplomatic weight for all votes on a resolution
 */
export function tallySenateVotes(
  state: GameState,
  resolution: SenateResolution
): SenateVoteTallyResult {
  let forWeight = 0;
  let againstWeight = 0;
  let abstainWeight = 0;

  const forVoters: string[] = [];
  const againstVoters: string[] = [];
  const abstainVoters: string[] = [];

  for (const player of Object.values(state.players)) {
    const pId = player.id;
    const vote: SenateVote = resolution.votes[pId] || 'abstain';
    const weight = calculateDiplomaticWeight(state, pId).total;

    if (vote === 'for') {
      forWeight += weight;
      forVoters.push(pId);
    } else if (vote === 'against') {
      againstWeight += weight;
      againstVoters.push(pId);
    } else {
      abstainWeight += weight;
      abstainVoters.push(pId);
    }
  }

  const passed = forWeight > againstWeight && forWeight > 0;

  return {
    forWeight,
    againstWeight,
    abstainWeight,
    forVoters,
    againstVoters,
    abstainVoters,
    passed,
  };
}

/**
 * Creates initial empty senate state
 */
export function createInitialSenateState(): SenateState {
  return {
    currentSession: null,
    activeResolutions: [],
    custodianPlayerId: null,
    sessionHistory: [],
    lastSessionEndedAt: 0,
  };
}

/**
 * Checks if a player has an active sanction against them
 */
export function isPlayerSanctioned(state: GameState, playerId: string): boolean {
  if (!state.senate?.activeResolutions) return false;
  return state.senate.activeResolutions.some(
    (r) => r.resolutionType === 'sanctions' && r.targetPlayerId === playerId
  );
}

/**
 * Returns active resolution modifier if currently enacted
 */
export function getActiveSenateResolution(
  state: GameState,
  type: SenateResolutionType,
  targetPlayerId?: string
): ActiveSenateModifier | undefined {
  if (!state.senate?.activeResolutions) return undefined;
  return state.senate.activeResolutions.find((r) => {
    if (r.resolutionType !== type) return false;
    if (targetPlayerId !== undefined && r.targetPlayerId !== targetPlayerId) return false;
    return true;
  });
}
