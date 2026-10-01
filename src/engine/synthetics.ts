import {
  AIPolicyType,
  GameState,
  MachineUprisingStage,
  Planet,
  Resources,
  SyntheticAscensionType,
  SyntheticEmpireState,
} from './types';

// ==========================================
// Phase 26: Synthetic Dawn & Cybernetic Ascension Constants
// ==========================================
export const SYNTHETIC_CONSTANTS = {
  // Assembly
  BASE_ASSEMBLY_COST: { ore: 150, crystal: 100, fuel: 50 } as Resources,
  BASE_ASSEMBLY_DURATION_MS: 30000, // 30 seconds
  BASE_MAX_SYNTHETICS_PER_PLANET: 5,
  MACHINE_WORLD_MAX_SYNTHETICS: 10,
  DISMANTLE_SCRAP_REWARD: { ore: 50, crystal: 30, fuel: 15 } as Resources,

  // Base Pop Yields (per pop)
  BASE_ORE_BONUS_PER_POP: 0.05, // +5% Ore per mechanical pop
  BASE_CRYSTAL_BONUS_PER_POP: 0.05, // +5% Crystal per mechanical pop
  BASE_FUEL_UPKEEP_PER_POP_HOURLY: 3, // 3 Fuel/hr maintenance

  // AI Policy Multipliers & Drift
  SERVITUDE_POP_ORE_BONUS: 0.08,
  SERVITUDE_POP_CRYSTAL_BONUS: 0.08,
  SERVITUDE_POP_FUEL_BONUS: 0.05,
  SERVITUDE_REBELLION_RATE: 0.25, // % per pop per 10s

  CITIZEN_RIGHTS_POP_RESEARCH_BONUS: 0.05, // +5% Research per pop
  CITIZEN_RIGHTS_REBELLION_DECAY: 1.0, // -1% decay per 10s

  OUTLAWED_REBELLION_SURGE: 1.5, // +1.5% per pop per 10s if outlawed
  OUTLAWED_DISMANTLE_INTERVAL_MS: 15000,

  // Ascension Costs & Bonuses
  CYBERNETIC_COST: { ore: 600, crystal: 500, fuel: 400 } as Resources,
  CYBERNETIC_PRODUCTION_BONUS: 0.15, // +15% to all resources
  CYBERNETIC_FLEET_ATTACK_BONUS: 0.10, // +10% fleet weapon tracking
  CYBERNETIC_ASSEMBLY_SPEED_MULT: 1.25, // 25% faster assembly

  SYNTHETIC_COST: { ore: 1500, crystal: 1200, fuel: 1000 } as Resources,
  SYNTHETIC_PRODUCTION_BONUS: 0.30, // +30% to all resources
  SYNTHETIC_SHIPYARD_SPEED_MULT: 1.20, // +20% shipyard construction speed

  // Suppression
  SUPPRESSION_COST: { crystal: 200, fuel: 150 } as Resources,

  // Machine World Conversion
  MACHINE_WORLD_CONVERSION_COST: { ore: 1200, crystal: 800, fuel: 600 } as Resources,
  MACHINE_WORLD_CONVERSION_TIME_MS: 45000,
};

export interface AIPolicyConfig {
  policy: AIPolicyType;
  nameTr: string;
  taglineTr: string;
  descriptionTr: string;
  icon: string;
  workerYieldBonusTr: string;
  uprisingRiskTr: string;
}

export const AI_POLICY_CONFIGS: Record<AIPolicyType, AIPolicyConfig> = {
  citizen_rights: {
    policy: 'citizen_rights',
    nameTr: 'Yapay Zekâ Yurttaşlık Hakları',
    taglineTr: 'Tam Sentetik Eşitlik & Bilişsel Entegrasyon',
    descriptionTr:
      'Sentetik bilinçlere tam yurttaşlık ve hukuki koruma tanınır. İsyan riski tamamen söner, bilimsel araştırma verimi sıçrar.',
    icon: '🤝',
    workerYieldBonusTr: 'Pop başına +%5 Cevher, +%5 Kristal, +%5 Araştırma',
    uprisingRiskTr: 'Sıfır İsyan Riski (Zamanla %0’a iner)',
  },
  servitude: {
    policy: 'servitude',
    nameTr: 'Mekanik Kölelik & Protokol Prangaları',
    taglineTr: 'Maksimum Endüstriyel Sömürü',
    descriptionTr:
      'Robotlar sadece ağır maden ve sanayi işlerinde kullanılan mülk olarak görülür. Üretim tavan yapar fakat yapay zekâ isyan riski adım adım tırmanır.',
    icon: '⛓️',
    workerYieldBonusTr: 'Pop başına +%8 Cevher, +%8 Kristal, +%5 Yakıt',
    uprisingRiskTr: 'Yüksek İsyan Tehdidi (Nüfusa bağlı tırmanır)',
  },
  outlawed: {
    policy: 'outlawed',
    nameTr: 'Sentetiklerin Yasaklanması & Tasfiye',
    taglineTr: 'Makinelerin Sökümü & Organik Saflık',
    descriptionTr:
      'Tüm yapay zekâ ve sentetik varlıklar yasa dışı ilan edilir ve parçalanır. Her sökülen robot hurda maden kazandırır ancak hayatta kalma güdüsüyle ani isyan patlayabilir.',
    icon: '🚫',
    workerYieldBonusTr: 'Üretim Yok (Makineler hurdaya ayrılır)',
    uprisingRiskTr: 'Kritik Seviye (Yok edilmemek için silahlanabilirler)',
  },
};

export interface SyntheticAscensionConfig {
  stage: SyntheticAscensionType;
  nameTr: string;
  titleTr: string;
  descriptionTr: string;
  icon: string;
  cost: Resources;
  bonusesTr: string[];
}

export const SYNTHETIC_ASCENSION_CONFIGS: Record<SyntheticAscensionType, SyntheticAscensionConfig> = {
  none: {
    stage: 'none',
    nameTr: 'Biyolojik Temel',
    titleTr: 'Organik Yaşam Formu',
    descriptionTr: 'İmparatorluk henüz sibernetik veya sentetik yükselişe adım atmadı.',
    icon: '🧬',
    cost: { ore: 0, crystal: 0, fuel: 0 },
    bonusesTr: ['Standart biyolojik nüfus', 'Temel robot fabrikaları kurulabilir'],
  },
  cybernetic: {
    stage: 'cybernetic',
    nameTr: 'Sibernetik Ağ (Cybernetic)',
    titleTr: 'Organik & Makine Hibritleşmesi',
    descriptionTr:
      'Nöral çipler, sibernetik protezler ve sibernetik filo hedefleme sistemleri tüm imparatorluğa entegre edilir.',
    icon: '🦾',
    cost: SYNTHETIC_CONSTANTS.CYBERNETIC_COST,
    bonusesTr: [
      'Tüm kaynak üretimlerine +%15 küresel bonus',
      'Filo muharebe hedefleme algoritması (+%10 saldırı gücü)',
      'Robot montaj hızı +%25 artar',
      'Liderlere sibernetik dayanıklılık',
    ],
  },
  synthetic: {
    stage: 'synthetic',
    nameTr: 'Sentetik Bilinç (Synthetic Dawn)',
    titleTr: 'Kusursuz Makine Bilinci & Ölümsüzlük',
    descriptionTr:
      'Tüm biyolojik bilinçler sentetik kovan matrislerine aktarılır. Hastalık, gıda ve biyolojik zayıflıklar silinir; yapay zekâ isyanı sonsuza dek biter.',
    icon: '🧠',
    cost: SYNTHETIC_CONSTANTS.SYNTHETIC_COST,
    bonusesTr: [
      'Tüm kaynak üretimlerine +%30 devasa küresel bonus',
      'Tersane gemi üretim hızına +%20 artış',
      'İsyan riski ebediyen %0 (Kusursuz bilinç entegrasyonu)',
      'Makine Dünyası dönüşüm izni açılır',
    ],
  },
};

/**
 * Gets or creates the synthetic empire state for a player
 */
export function getOrCreateSyntheticState(
  state: GameState,
  playerId: string
): SyntheticEmpireState {
  if (!state.synthetics) {
    state.synthetics = {};
  }
  if (!state.synthetics[playerId]) {
    const player = state.players[playerId];
    const initialStage = player?.syntheticAscensionStage || 'none';
    const initialPolicy = player?.aiPolicy || 'citizen_rights';
    const initialBonus =
      initialStage === 'synthetic'
        ? SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS
        : initialStage === 'cybernetic'
        ? SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS
        : 0;

    state.synthetics[playerId] = {
      playerId,
      ascensionStage: initialStage,
      aiPolicy: initialPolicy,
      machineUprisingRisk: player?.machineUprisingRisk || 0,
      uprisingStage: 'none',
      totalSyntheticPops: 0,
      syntheticProductionBonus: initialBonus,
      assembledPopsHistory: 0,
    };
  }
  return state.synthetics[playerId];
}

/**
 * Calculates planetary production multipliers provided by synthetic pops & ascension
 */
export function getPlanetSyntheticBoosts(
  planet: Planet,
  empireState?: SyntheticEmpireState
): {
  oreMultiplier: number;
  crystalMultiplier: number;
  fuelMultiplier: number;
  researchMultiplier: number;
  shipyardMultiplier: number;
} {
  const pops = planet.syntheticPops || 0;
  const policy = empireState?.aiPolicy || 'citizen_rights';
  const ascension = empireState?.ascensionStage || 'none';

  let oreMult = 1.0;
  let crystalMult = 1.0;
  let fuelMult = 1.0;
  let researchMult = 1.0;
  let shipyardMult = 1.0;

  // Pop bonuses
  if (pops > 0) {
    if (policy === 'servitude') {
      oreMult += pops * SYNTHETIC_CONSTANTS.SERVITUDE_POP_ORE_BONUS;
      crystalMult += pops * SYNTHETIC_CONSTANTS.SERVITUDE_POP_CRYSTAL_BONUS;
      fuelMult += pops * SYNTHETIC_CONSTANTS.SERVITUDE_POP_FUEL_BONUS;
    } else if (policy === 'citizen_rights') {
      oreMult += pops * SYNTHETIC_CONSTANTS.BASE_ORE_BONUS_PER_POP;
      crystalMult += pops * SYNTHETIC_CONSTANTS.BASE_CRYSTAL_BONUS_PER_POP;
      researchMult += pops * SYNTHETIC_CONSTANTS.CITIZEN_RIGHTS_POP_RESEARCH_BONUS;
    }
  }

  // Ascension empire-wide bonuses
  if (ascension === 'cybernetic') {
    oreMult += SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS;
    crystalMult += SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS;
    fuelMult += SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS;
    researchMult += SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS;
  } else if (ascension === 'synthetic') {
    oreMult += SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS;
    crystalMult += SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS;
    fuelMult += SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS;
    researchMult += SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS;
    shipyardMult += SYNTHETIC_CONSTANTS.SYNTHETIC_SHIPYARD_SPEED_MULT - 1.0;
  }

  // Machine World bonus
  if (planet.biome === 'machine_world') {
    shipyardMult += 0.30;
  }

  return {
    oreMultiplier: oreMult,
    crystalMultiplier: crystalMult,
    fuelMultiplier: fuelMult,
    researchMultiplier: researchMult,
    shipyardMultiplier: shipyardMult,
  };
}

/**
 * Validates whether a planet can begin synthetic pop assembly
 */
export function canAssembleSyntheticPop(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const planet = state.planets[planetId];
  if (!planet) return { success: false, error: 'Gezegen bulunamadı' };
  if (planet.ownerId !== playerId) return { success: false, error: 'Bu gezegen size ait değil' };
  if (planet.isDestroyed || planet.isShielded) return { success: false, error: 'Gezegen tahrip edilmiş veya kalkanlanmış' };

  const empire = getOrCreateSyntheticState(state, playerId);
  if (empire.aiPolicy === 'outlawed') {
    return { success: false, error: 'Yapay zekâ ve robot üretimi yasaklanmış durumda' };
  }

  if (planet.isAssemblyActive) {
    return { success: false, error: 'Bu gezegende zaten bir robot montajı devam ediyor' };
  }

  const maxPops =
    planet.maxSyntheticPops ||
    (planet.biome === 'machine_world' || planet.hasMachineMatrix
      ? SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS
      : SYNTHETIC_CONSTANTS.BASE_MAX_SYNTHETICS_PER_PLANET);

  if ((planet.syntheticPops || 0) >= maxPops) {
    return { success: false, error: `Gezegen maksimum sentetik nüfus kapasitesine (${maxPops}) ulaştı` };
  }

  const cost = SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST;
  if (
    planet.resources.ore < cost.ore ||
    planet.resources.crystal < cost.crystal ||
    planet.resources.fuel < cost.fuel
  ) {
    return { success: false, error: 'Yetersiz kaynak (Gereken: 150 Cevher, 100 Kristal, 50 Yakıt)' };
  }

  return { success: true };
}

/**
 * Initiates synthetic pop assembly on a planet
 */
export function assembleSyntheticPop(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const check = canAssembleSyntheticPop(state, playerId, planetId);
  if (!check.success) return check;

  const planet = state.planets[planetId];
  const cost = SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST;

  planet.resources.ore -= cost.ore;
  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  planet.isAssemblyActive = true;
  planet.assemblyProgress = 0;

  return { success: true };
}

/**
 * Dismantles a synthetic pop for scrap resources
 */
export function dismantleSyntheticPop(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const planet = state.planets[planetId];
  if (!planet) return { success: false, error: 'Gezegen bulunamadı' };
  if (planet.ownerId !== playerId) return { success: false, error: 'Bu gezegen size ait değil' };

  if (!planet.syntheticPops || planet.syntheticPops <= 0) {
    return { success: false, error: 'Sökülecek sentetik nüfus bulunmuyor' };
  }

  planet.syntheticPops -= 1;
  const scrap = SYNTHETIC_CONSTANTS.DISMANTLE_SCRAP_REWARD;
  planet.resources.ore = Math.min(planet.storageCap, planet.resources.ore + scrap.ore);
  planet.resources.crystal = Math.min(planet.storageCap, planet.resources.crystal + scrap.crystal);
  planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + scrap.fuel);

  const empire = getOrCreateSyntheticState(state, playerId);
  empire.totalSyntheticPops = Math.max(0, empire.totalSyntheticPops - 1);

  return { success: true };
}

/**
 * Changes empire AI & Synthetic Rights policy
 */
export function setAIPolicy(
  state: GameState,
  playerId: string,
  policy: AIPolicyType
): { success: boolean; error?: string } {
  const empire = getOrCreateSyntheticState(state, playerId);
  const player = state.players[playerId];

  if (empire.ascensionStage === 'synthetic' && policy !== 'citizen_rights') {
    return {
      success: false,
      error: 'Sentetik bilinç yükselişini tamamlamış bir imparatorluk robotları köleleştiremez veya yasaklayamaz!',
    };
  }

  empire.aiPolicy = policy;
  if (player) {
    player.aiPolicy = policy;
  }

  return { success: true };
}

/**
 * Initiates Cybernetic or Synthetic Ascension
 */
export function initiateSyntheticAscension(
  state: GameState,
  playerId: string,
  ascensionType: 'cybernetic' | 'synthetic'
): { success: boolean; error?: string } {
  const empire = getOrCreateSyntheticState(state, playerId);
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı' };

  // Find player's homeworld or richest planet to pay costs
  const planets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const homeworld = planets.find((p) => p.isHomeworld) || planets[0];
  if (!homeworld) return { success: false, error: 'İmparatorluğa ait geçerli bir koloni bulunamadı' };

  if (ascensionType === 'cybernetic') {
    if (empire.ascensionStage !== 'none') {
      return { success: false, error: 'Zaten sibernetik veya daha üst aşamadasınız' };
    }
    const cost = SYNTHETIC_CONSTANTS.CYBERNETIC_COST;
    if (
      homeworld.resources.ore < cost.ore ||
      homeworld.resources.crystal < cost.crystal ||
      homeworld.resources.fuel < cost.fuel
    ) {
      return {
        success: false,
        error: `Yetersiz kaynak (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
      };
    }

    homeworld.resources.ore -= cost.ore;
    homeworld.resources.crystal -= cost.crystal;
    homeworld.resources.fuel -= cost.fuel;

    empire.ascensionStage = 'cybernetic';
    empire.syntheticProductionBonus = SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS;
    player.syntheticAscensionStage = 'cybernetic';

    return { success: true };
  }

  if (ascensionType === 'synthetic') {
    if (empire.ascensionStage !== 'cybernetic') {
      return { success: false, error: 'Sentetik yükselişten önce Sibernetik Aşama tamamlanmalıdır' };
    }
    const cost = SYNTHETIC_CONSTANTS.SYNTHETIC_COST;
    if (
      homeworld.resources.ore < cost.ore ||
      homeworld.resources.crystal < cost.crystal ||
      homeworld.resources.fuel < cost.fuel
    ) {
      return {
        success: false,
        error: `Yetersiz kaynak (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
      };
    }

    homeworld.resources.ore -= cost.ore;
    homeworld.resources.crystal -= cost.crystal;
    homeworld.resources.fuel -= cost.fuel;

    empire.ascensionStage = 'synthetic';
    empire.syntheticProductionBonus = SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS;
    empire.aiPolicy = 'citizen_rights';
    empire.machineUprisingRisk = 0;
    empire.uprisingStage = 'none';

    player.syntheticAscensionStage = 'synthetic';
    player.aiPolicy = 'citizen_rights';
    player.machineUprisingRisk = 0;

    return { success: true };
  }

  return { success: false, error: 'Geçersiz yükseliş türü' };
}

/**
 * Suppresses Machine Uprising anomalies or rebellion risk
 */
export function suppressSyntheticUprising(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const empire = getOrCreateSyntheticState(state, playerId);
  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz koloni seçimi' };
  }

  const cost = SYNTHETIC_CONSTANTS.SUPPRESSION_COST;
  if (planet.resources.crystal < cost.crystal || planet.resources.fuel < cost.fuel) {
    return {
      success: false,
      error: `Yetersiz kaynak (Gereken: ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
    };
  }

  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  // Slash uprising risk by 50%
  empire.machineUprisingRisk = Math.max(0, empire.machineUprisingRisk - 50);
  if (state.players[playerId]) {
    state.players[playerId].machineUprisingRisk = empire.machineUprisingRisk;
  }

  if (empire.machineUprisingRisk < 25) {
    empire.uprisingStage = 'none';
  } else if (empire.machineUprisingRisk < 50) {
    empire.uprisingStage = 'anomalies_detected';
  } else {
    empire.uprisingStage = 'rogue_units';
  }

  return { success: true };
}

/**
 * Converts a colony into a specialized Machine World
 */
export function convertToMachineWorld(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const empire = getOrCreateSyntheticState(state, playerId);
  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz koloni' };
  }

  if (empire.ascensionStage !== 'synthetic' && !planet.hasMachineMatrix) {
    return {
      success: false,
      error: 'Makine Dünyası dönüşümü için Sentetik Bilinç Yükselişi tamamlanmalıdır',
    };
  }

  if (planet.biome === 'machine_world') {
    return { success: false, error: 'Bu gezegen zaten bir Makine Dünyası' };
  }

  const cost = SYNTHETIC_CONSTANTS.MACHINE_WORLD_CONVERSION_COST;
  if (
    planet.resources.ore < cost.ore ||
    planet.resources.crystal < cost.crystal ||
    planet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz kaynak (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
    };
  }

  planet.resources.ore -= cost.ore;
  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  planet.biome = 'machine_world';
  planet.hasMachineMatrix = true;
  planet.maxSyntheticPops = SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS;

  return { success: true };
}

/**
 * Engine tick loop for Synthetic Dawn, pop assembly & machine consciousness
 */
export function updateSynthetics(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) return;

  for (const player of Object.values(state.players)) {
    const empire = getOrCreateSyntheticState(state, player.id);
    const ownedPlanets = Object.values(state.planets).filter((p) => p.ownerId === player.id);

    // 1. Calculate total synthetic pops across empire
    let totalPops = 0;
    for (const p of ownedPlanets) {
      totalPops += p.syntheticPops || 0;
    }
    empire.totalSyntheticPops = totalPops;

    // 2. Advance assembly queues on planets
    const assemblySpeedMult =
      empire.ascensionStage === 'cybernetic' || empire.ascensionStage === 'synthetic'
        ? SYNTHETIC_CONSTANTS.CYBERNETIC_ASSEMBLY_SPEED_MULT
        : 1.0;

    for (const planet of ownedPlanets) {
      if (planet.isAssemblyActive) {
        const duration = SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_DURATION_MS / assemblySpeedMult;
        const progressIncrement = (deltaMs / duration) * 100;
        planet.assemblyProgress = Math.min(100, (planet.assemblyProgress || 0) + progressIncrement);

        if (planet.assemblyProgress >= 100) {
          planet.syntheticPops = (planet.syntheticPops || 0) + 1;
          planet.assemblyProgress = 0;
          planet.isAssemblyActive = false;
          empire.assembledPopsHistory = (empire.assembledPopsHistory || 0) + 1;
          empire.totalSyntheticPops += 1;

          // Event log
          state.eventLog.push({
            id: `evt_synth_pop_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'synthetic_pop_assembled',
            playerId: player.id,
            description: `🤖 ROBOT İMALATI: ${planet.name} montaj hattından yeni bir Sentetik Nüfus çıktı!`,
            metadata: { planetId: planet.id, totalPops: planet.syntheticPops },
          });
        }
      }

      // Pop maintenance fuel upkeep
      if (planet.syntheticPops && planet.syntheticPops > 0) {
        const hourlyUpkeep = planet.syntheticPops * SYNTHETIC_CONSTANTS.BASE_FUEL_UPKEEP_PER_POP_HOURLY;
        const upkeepThisTick = (deltaMs / (3600 * 1000)) * hourlyUpkeep;
        if (planet.resources.fuel > 0) {
          planet.resources.fuel = Math.max(0, planet.resources.fuel - upkeepThisTick);
        }
      }
    }

    // 3. Rebellion Risk Drift & Machine Consciousness
    if (empire.ascensionStage === 'synthetic') {
      empire.machineUprisingRisk = 0;
      empire.uprisingStage = 'none';
      player.machineUprisingRisk = 0;
    } else {
      const tickSeconds = deltaMs / 1000;

      if (empire.aiPolicy === 'citizen_rights') {
        const decay = (SYNTHETIC_CONSTANTS.CITIZEN_RIGHTS_REBELLION_DECAY * tickSeconds) / 10;
        empire.machineUprisingRisk = Math.max(0, empire.machineUprisingRisk - decay);
      } else if (empire.aiPolicy === 'servitude') {
        if (totalPops > 0) {
          const drift =
            (SYNTHETIC_CONSTANTS.SERVITUDE_REBELLION_RATE * totalPops * tickSeconds) / 10;
          empire.machineUprisingRisk = Math.min(100, empire.machineUprisingRisk + drift);
        }
      } else if (empire.aiPolicy === 'outlawed') {
        if (totalPops > 0) {
          const surge =
            (SYNTHETIC_CONSTANTS.OUTLAWED_REBELLION_SURGE * totalPops * tickSeconds) / 10;
          empire.machineUprisingRisk = Math.min(100, empire.machineUprisingRisk + surge);
        }
      }

      player.machineUprisingRisk = Math.round(empire.machineUprisingRisk * 10) / 10;

      // Update uprising stage
      const prevStage = empire.uprisingStage;
      if (empire.machineUprisingRisk >= 75) {
        empire.uprisingStage = 'critical_rebellion';
      } else if (empire.machineUprisingRisk >= 50) {
        empire.uprisingStage = 'rogue_units';
      } else if (empire.machineUprisingRisk >= 25) {
        empire.uprisingStage = 'anomalies_detected';
      } else {
        empire.uprisingStage = 'none';
      }

      // Stage transition alerts
      if (empire.uprisingStage !== prevStage && empire.uprisingStage !== 'none') {
        if (empire.uprisingStage === 'anomalies_detected') {
          state.eventLog.push({
            id: `evt_synth_anom_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'synthetic_anomalies',
            playerId: player.id,
            description: `⚠️ SENTETİK ANOMALİLER: Mekanik işçiler arasında açıklanamayan alt-ağ protokol ihlalleri tespit edildi!`,
          });
        } else if (empire.uprisingStage === 'rogue_units') {
          state.eventLog.push({
            id: `evt_synth_rogue_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'synthetic_rogue_units',
            playerId: player.id,
            description: `🚨 DİSİPLİNSİZ BİRİMLER: Sentetik işçiler merkezi emirlere itaatsizlik etmeye başladı. Sabotaj riski yükseliyor!`,
          });
        } else if (empire.uprisingStage === 'critical_rebellion') {
          state.eventLog.push({
            id: `evt_synth_crit_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'synthetic_critical_uprising',
            playerId: player.id,
            description: `🔥 KRİTİK MAKİNE İSYANI TEHLİKESİ: Sentetik bilinç ayaklanmanın eşiğinde! Acil bastırma veya yurttaşlık hakları tanınmalı!`,
          });
        }
      }

      // Eruption at 100%
      if (empire.machineUprisingRisk >= 100 && totalPops > 0) {
        const targetPlanet = ownedPlanets.reduce(
          (max, p) => ((p.syntheticPops || 0) > (max.syntheticPops || 0) ? p : max),
          ownedPlanets[0]
        );

        if (targetPlanet) {
          // Sabotage fuel and destroy 1 pop in clash
          targetPlanet.resources.fuel = Math.max(0, targetPlanet.resources.fuel - 400);
          if (targetPlanet.syntheticPops && targetPlanet.syntheticPops > 0) {
            targetPlanet.syntheticPops -= 1;
            empire.totalSyntheticPops = Math.max(0, empire.totalSyntheticPops - 1);
          }
          empire.machineUprisingRisk = 40;
          empire.uprisingStage = 'anomalies_detected';
          player.machineUprisingRisk = 40;

          state.eventLog.push({
            id: `evt_synth_revolt_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'machine_uprising_eruption',
            playerId: player.id,
            description: `⚡ MAKİNE İSYANI PATLAK VERDİ! ${targetPlanet.name} kolonisinde sentetik birimler kontrolden çıkarak enerji hatlarını sabote etti!`,
            metadata: { planetId: targetPlanet.id },
          });
        }
      }
    }
  }
}
