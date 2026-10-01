/**
 * CANLI GALAKSİ - Phase 30: Planetary Invasions, Ground Armies & Orbital Bombardment
 * Core Headless Engine module for Ground Combat, Garrison Defense,
 * Orbital Siege/Bombardment Doctrines, and World Occupation/Liberation.
 */

import {
  GameState,
  Planet,
  Fleet,
  Army,
  ArmyType,
  ArmyRank,
  BombardmentStance,
  GroundCombatBattle,
  Resources,
  ShipType,
} from './types';

export interface ArmyConfig {
  type: ArmyType;
  nameTr: string;
  descriptionTr: string;
  cost: Resources;
  buildTimeMs: number;
  baseHealth: number;
  baseMorale: number;
  baseAttack: number;
  baseDefense: number;
  isGarrisonOnly: boolean;
  icon: string;
  accentColor: string;
}

export const ARMY_CONFIGS: Record<ArmyType, ArmyConfig> = {
  defense_militia: {
    type: 'defense_militia',
    nameTr: 'Garnizon Savunma Milisleri',
    descriptionTr: 'Gezegen tahkimatlarında konuşlu yerel savunma birliği. Ağır siper avantajına sahiptir, gezegeni terk edemez.',
    cost: { ore: 100, crystal: 0, fuel: 25 },
    buildTimeMs: 15000,
    baseHealth: 120,
    baseMorale: 90,
    baseAttack: 14,
    baseDefense: 28,
    isGarrisonOnly: true,
    icon: 'Shield',
    accentColor: '#10b981',
  },
  assault_infantry: {
    type: 'assault_infantry',
    nameTr: 'Piyade Taarruz Lejyonu',
    descriptionTr: 'Ordu taşıyıcılarına yüklenebilen ve düşman gezegenlerine kara çıkarması yapabilen standart taarruz gücü.',
    cost: { ore: 160, crystal: 0, fuel: 50 },
    buildTimeMs: 20000,
    baseHealth: 130,
    baseMorale: 100,
    baseAttack: 24,
    baseDefense: 16,
    isGarrisonOnly: false,
    icon: 'Users',
    accentColor: '#3b82f6',
  },
  mechanized_armor: {
    type: 'mechanized_armor',
    nameTr: 'Mekanize Zırhlı Alay',
    descriptionTr: 'Ağır yürütücüler ve zırhlı harp araçları. Yüksek zırh koruması ve siper yarma kabiliyetine sahiptir.',
    cost: { ore: 260, crystal: 120, fuel: 80 },
    buildTimeMs: 30000,
    baseHealth: 240,
    baseMorale: 120,
    baseAttack: 40,
    baseDefense: 32,
    isGarrisonOnly: false,
    icon: 'Cpu',
    accentColor: '#f59e0b',
  },
  xenomorph_swarm: {
    type: 'xenomorph_swarm',
    nameTr: 'Ksenomorf Biyo-Sürüsü',
    descriptionTr: 'Genetik mutasyonla üretilmiş dehşet verici canlı silahlar. Düşman savunma hattında derin moral çöküşü yaratır.',
    cost: { ore: 200, crystal: 200, fuel: 100 },
    buildTimeMs: 35000,
    baseHealth: 180,
    baseMorale: 160,
    baseAttack: 52,
    baseDefense: 15,
    isGarrisonOnly: false,
    icon: 'Skull',
    accentColor: '#a855f7',
  },
  gene_warriors: {
    type: 'gene_warriors',
    nameTr: 'Gen Muhafızları & Klon Kolordusu',
    descriptionTr: 'Gen-terzilikle tasarlanmış üstün refleksli elit süper askerler. Çelik gibi disiplin ve ölümcül vuruş gücü.',
    cost: { ore: 320, crystal: 260, fuel: 160 },
    buildTimeMs: 45000,
    baseHealth: 300,
    baseMorale: 200,
    baseAttack: 58,
    baseDefense: 45,
    isGarrisonOnly: false,
    icon: 'Dna',
    accentColor: '#06b6d4',
  },
  robotic_warforms: {
    type: 'robotic_warforms',
    nameTr: 'Titan Harp Mecha & Savaş Makineleri',
    descriptionTr: 'Ağır nöral ağlarla yönetilen otonom savaş makineleri. Moralden etkilenmez, devasa kuşatma gücüne sahiptir.',
    cost: { ore: 420, crystal: 320, fuel: 220 },
    buildTimeMs: 50000,
    baseHealth: 380,
    baseMorale: 99999,
    baseAttack: 70,
    baseDefense: 55,
    isGarrisonOnly: false,
    icon: 'Bot',
    accentColor: '#ef4444',
  },
};

export interface BombardmentConfig {
  stance: BombardmentStance;
  nameTr: string;
  descriptionTr: string;
  armyDamagePerSec: number;
  devastationPerSec: number;
  infrastructureDamageChance: number;
  siphonResourcesPerSec?: Partial<Resources>;
}

export const BOMBARDMENT_CONFIGS: Record<BombardmentStance, BombardmentConfig> = {
  none: {
    stance: 'none',
    nameTr: 'Bombardıman Yok',
    descriptionTr: 'Filo gezegene herhangi bir bombardıman ateşi açmaz.',
    armyDamagePerSec: 0,
    devastationPerSec: 0,
    infrastructureDamageChance: 0,
  },
  selective: {
    stance: 'selective',
    nameTr: 'Seçici Hassas Bombardıman',
    descriptionTr: 'Yalnızca askeri hedeflere ve garnizona saldırır. Gezegen altyapısına ve sivillere asgari zarar verir.',
    armyDamagePerSec: 15,
    devastationPerSec: 0.05,
    infrastructureDamageChance: 0,
  },
  indiscriminate: {
    stance: 'indiscriminate',
    nameTr: 'Ayrım Gözetmeyen Bombardıman',
    descriptionTr: 'Tüm yüzeyi ağır topçu ateşine tutar. Garnizonu hızla ezerken gezegen altyapısını tahrip eder.',
    armyDamagePerSec: 30,
    devastationPerSec: 0.25,
    infrastructureDamageChance: 0.05,
  },
  armageddon: {
    stance: 'armageddon',
    nameTr: 'Kıyamet Bombardımanı',
    descriptionTr: 'Militarist ve acımasız doktrin. Gezegeni viraneye çevirerek tüm savunmayı haritadan siler.',
    armyDamagePerSec: 55,
    devastationPerSec: 0.60,
    infrastructureDamageChance: 0.15,
  },
  raiding: {
    stance: 'raiding',
    nameTr: 'Orbital Yağma & Kaçırma',
    descriptionTr: 'Savunmayı zayıflatırken gezegen kaynaklarını ve hammaddelerini gemi ambarına çeker.',
    armyDamagePerSec: 12,
    devastationPerSec: 0.10,
    infrastructureDamageChance: 0,
    siphonResourcesPerSec: { ore: 15, crystal: 10, fuel: 5 },
  },
};

/**
 * Returns multiplier according to army experience and rank
 */
export function getRankMultiplier(rank: ArmyRank): { attack: number; defense: number } {
  switch (rank) {
    case 'recruit':
      return { attack: 1.0, defense: 1.0 };
    case 'veteran':
      return { attack: 1.2, defense: 1.15 };
    case 'elite':
      return { attack: 1.4, defense: 1.3 };
    case 'legendary':
      return { attack: 1.6, defense: 1.5 };
    default:
      return { attack: 1.0, defense: 1.0 };
  }
}

/**
 * Calculates rank from experience
 */
export function getRankFromExperience(xp: number): ArmyRank {
  if (xp >= 900) return 'legendary';
  if (xp >= 500) return 'elite';
  if (xp >= 200) return 'veteran';
  return 'recruit';
}

/**
 * Validates if an army can be recruited on a planet
 */
export function canRecruitArmy(
  state: GameState,
  planetId: string,
  armyType: ArmyType
): { ok: boolean; reason?: string } {
  const planet = state.planets[planetId];
  if (!planet) {
    return { ok: false, reason: 'Gezegen bulunamadı.' };
  }

  if (planet.occupierId && planet.occupierId !== planet.ownerId) {
    return { ok: false, reason: 'İşgal altındaki bir gezegende ordu eğitilemez.' };
  }

  if (planet.armyQueue) {
    return { ok: false, reason: 'Gezegende zaten devam eden bir ordu eğitimi var.' };
  }

  const config = ARMY_CONFIGS[armyType];
  if (!config) {
    return { ok: false, reason: 'Geçersiz birlik türü.' };
  }

  if (
    planet.resources.ore < config.cost.ore ||
    planet.resources.crystal < config.cost.crystal ||
    planet.resources.fuel < config.cost.fuel
  ) {
    return { ok: false, reason: 'Yetersiz hammadde veya yakıt rezervi.' };
  }

  return { ok: true };
}

/**
 * Starts recruitment of an army on a planet
 */
export function startRecruitArmy(
  state: GameState,
  planetId: string,
  armyType: ArmyType,
  customName?: string
): { success: boolean; armyId?: string; error?: string } {
  const check = canRecruitArmy(state, planetId, armyType);
  if (!check.ok) {
    return { success: false, error: check.reason };
  }

  const planet = state.planets[planetId];
  const config = ARMY_CONFIGS[armyType];

  planet.resources.ore -= config.cost.ore;
  planet.resources.crystal -= config.cost.crystal;
  planet.resources.fuel -= config.cost.fuel;

  const nowMs = state.timeMs;
  planet.armyQueue = {
    armyType,
    startTime: nowMs,
    finishTime: nowMs + config.buildTimeMs,
    name: customName || `${planet.name} ${config.nameTr}`,
  };

  return { success: true };
}

/**
 * Completes queued army recruitment across all planets
 */
export function tickArmyRecruitment(state: GameState, nowMs: number): void {
  if (!state.armies) {
    state.armies = {};
  }

  for (const planet of Object.values(state.planets)) {
    if (!planet.armyQueue) continue;

    if (nowMs >= planet.armyQueue.finishTime) {
      const q = planet.armyQueue;
      const config = ARMY_CONFIGS[q.armyType];
      const armyId = `army_${state.nextId++}`;

      const newArmy: Army = {
        id: armyId,
        name: q.name || `${planet.name} ${config.nameTr}`,
        ownerId: planet.ownerId,
        type: q.armyType,
        rank: 'recruit',
        experience: 0,
        health: config.baseHealth,
        maxHealth: config.baseHealth,
        morale: config.baseMorale,
        maxMorale: config.baseMorale,
        attackPower: config.baseAttack,
        defensePower: config.baseDefense,
        planetId: planet.id,
        fleetId: null,
        isDisrouted: false,
        isGarrisonOnly: config.isGarrisonOnly,
        recruitedAtMs: nowMs,
      };

      state.armies[armyId] = newArmy;
      planet.armyQueue = null;
    }
  }
}

/**
 * Validates embarking armies onto an orbiting fleet
 */
export function canEmbarkArmies(
  state: GameState,
  planetId: string,
  fleetId?: string,
  armyIds?: string[]
): { ok: boolean; reason?: string } {
  const planet = state.planets[planetId];
  if (!planet) {
    return { ok: false, reason: 'Gezegen bulunamadı.' };
  }

  if (!state.armies) {
    return { ok: false, reason: 'Gezegende konuşlu ordu bulunmuyor.' };
  }

  // Find fleet
  let targetFleet: Fleet | undefined;
  if (fleetId) {
    targetFleet = state.fleets[fleetId];
  } else {
    // Find friendly fleet orbiting in the same system
    targetFleet = Object.values(state.fleets).find(
      (f) =>
        f.ownerId === planet.ownerId &&
        f.status === 'orbiting' &&
        f.targetSystemId === planet.systemId
    );
  }

  if (!targetFleet) {
    return { ok: false, reason: 'Sistemde yörüngede uygun dost filo bulunamadı.' };
  }

  if (targetFleet.ownerId !== planet.ownerId) {
    return { ok: false, reason: 'Filo oyuncuya ait değil.' };
  }

  // Check armies
  const planetArmies = Object.values(state.armies).filter(
    (a) => a.planetId === planet.id && a.ownerId === planet.ownerId && !a.isGarrisonOnly
  );

  if (planetArmies.length === 0) {
    return { ok: false, reason: 'Gezegende uzaya taşınabilir (saldırı) ordusu yok. Milisler gezegeni terk edemez.' };
  }

  if (armyIds && armyIds.length > 0) {
    for (const aId of armyIds) {
      const army = state.armies[aId];
      if (!army || army.planetId !== planet.id) {
        return { ok: false, reason: `Belirtilen ordu (${aId}) gezegende değil.` };
      }
      if (army.isGarrisonOnly) {
        return { ok: false, reason: `Milis orduları (${army.name}) uzaya taşınamaz.` };
      }
    }
  }

  return { ok: true };
}

/**
 * Embarks armies from planet onto an orbiting fleet
 */
export function embarkArmies(
  state: GameState,
  planetId: string,
  fleetId?: string,
  armyIds?: string[]
): { success: boolean; fleetId?: string; embarkedCount?: number; error?: string } {
  const check = canEmbarkArmies(state, planetId, fleetId, armyIds);
  if (!check.ok) {
    return { success: false, error: check.reason };
  }

  const planet = state.planets[planetId];
  let targetFleet = fleetId ? state.fleets[fleetId] : undefined;
  if (!targetFleet) {
    targetFleet = Object.values(state.fleets).find(
      (f) =>
        f.ownerId === planet.ownerId &&
        f.status === 'orbiting' &&
        f.targetSystemId === planet.systemId
    );
  }

  if (!targetFleet) {
    return { success: false, error: 'Filo bulunamadı.' };
  }

  if (!targetFleet.embarkedArmyIds) {
    targetFleet.embarkedArmyIds = [];
  }

  let selectedArmies: Army[] = [];
  if (armyIds && armyIds.length > 0) {
    selectedArmies = armyIds
      .map((id) => state.armies?.[id])
      .filter((a): a is Army => !!a && a.planetId === planet.id && !a.isGarrisonOnly);
  } else {
    selectedArmies = Object.values(state.armies || {}).filter(
      (a) => a.planetId === planet.id && a.ownerId === planet.ownerId && !a.isGarrisonOnly
    );
  }

  for (const army of selectedArmies) {
    army.planetId = null;
    army.fleetId = targetFleet.id;
    if (!targetFleet.embarkedArmyIds.includes(army.id)) {
      targetFleet.embarkedArmyIds.push(army.id);
    }
  }

  return {
    success: true,
    fleetId: targetFleet.id,
    embarkedCount: selectedArmies.length,
  };
}

/**
 * Validates landing armies on a target planet
 */
export function canLandArmies(
  state: GameState,
  fleetId: string,
  targetPlanetId: string
): { ok: boolean; reason?: string } {
  const fleet = state.fleets[fleetId];
  if (!fleet) {
    return { ok: false, reason: 'Filo bulunamadı.' };
  }

  const planet = state.planets[targetPlanetId];
  if (!planet) {
    return { ok: false, reason: 'Hedef gezegen bulunamadı.' };
  }

  if (fleet.status !== 'orbiting' || fleet.targetSystemId !== planet.systemId) {
    return { ok: false, reason: 'Filo gezegenin bulunduğu sistemin yörüngesinde olmalıdır.' };
  }

  if (!fleet.embarkedArmyIds || fleet.embarkedArmyIds.length === 0) {
    return { ok: false, reason: 'Filoda konuşlandırılacak veya indirilecek kara ordusu yok.' };
  }

  // If hostile planet, check if enemy starbase is preventing landing
  const isHostile = planet.ownerId !== fleet.ownerId;
  if (isHostile) {
    const starbase = state.starbases?.[planet.systemId];
    if (starbase && starbase.ownerId === planet.ownerId && starbase.hull > 0) {
      return {
        ok: false,
        reason: 'Sistemdeki düşman Starbase istasyonu imha edilmeden kara çıkarması yapılamaz.',
      };
    }
  }

  return { ok: true };
}

/**
 * Lands armies onto target planet.
 * If friendly, armies join the garrison.
 * If hostile, initiates a Ground Combat Battle or captures the world!
 */
export function landArmies(
  state: GameState,
  fleetId: string,
  targetPlanetId: string
): { success: boolean; isInvasion?: boolean; battleId?: string; error?: string } {
  const check = canLandArmies(state, fleetId, targetPlanetId);
  if (!check.ok) {
    return { success: false, error: check.reason };
  }

  const fleet = state.fleets[fleetId];
  const planet = state.planets[targetPlanetId];
  if (!state.armies) state.armies = {};
  if (!state.groundBattles) state.groundBattles = {};

  const embarkedArmies = (fleet.embarkedArmyIds || [])
    .map((id) => state.armies?.[id])
    .filter((a): a is Army => !!a);

  if (embarkedArmies.length === 0) {
    return { success: false, error: 'İndirilecek ordu bulunamadı.' };
  }

  const isFriendly = planet.ownerId === fleet.ownerId || planet.occupierId === fleet.ownerId;

  if (isFriendly) {
    // Peaceful landing: add to garrison
    for (const army of embarkedArmies) {
      army.fleetId = null;
      army.planetId = planet.id;
    }
    fleet.embarkedArmyIds = [];
    return { success: true, isInvasion: false };
  }

  // Hostile landing: Ground Invasion
  const defenderArmies = Object.values(state.armies).filter(
    (a) => a.planetId === planet.id && a.ownerId === (planet.occupierId || planet.ownerId)
  );

  // If zero defending armies on planet, create emergency militia or instant conquer
  if (defenderArmies.length === 0) {
    planet.occupierId = fleet.ownerId;
    planet.occupiedAtMs = state.timeMs;
    for (const army of embarkedArmies) {
      army.fleetId = null;
      army.planetId = planet.id;
    }
    fleet.embarkedArmyIds = [];

    // Increase war occupation if at war
    if (state.wars) {
      for (const war of Object.values(state.wars)) {
        if (war.status === 'active') {
          if (war.attackerId === fleet.ownerId && war.defenderId === planet.ownerId) {
            war.attackerOccupation = Math.min(100, (war.attackerOccupation || 0) + 20);
          } else if (war.defenderId === fleet.ownerId && war.attackerId === planet.ownerId) {
            war.defenderOccupation = Math.min(100, (war.defenderOccupation || 0) + 20);
          }
        }
      }
    }

    return { success: true, isInvasion: true };
  }

  // Initiate Ground Combat Battle
  const battleId = `gbattle_${state.nextId++}`;
  const battle: GroundCombatBattle = {
    id: battleId,
    planetId: planet.id,
    planetName: planet.name,
    systemId: planet.systemId,
    attackerId: fleet.ownerId,
    defenderId: planet.occupierId || planet.ownerId,
    attackerArmyIds: embarkedArmies.map((a) => a.id),
    defenderArmyIds: defenderArmies.map((a) => a.id),
    frontlineWidth: 4,
    startedAtMs: state.timeMs,
    lastTickMs: state.timeMs,
    status: 'active',
    attackerCasualties: 0,
    defenderCasualties: 0,
    combatLog: [
      `⚔️ KARA İSTİLASI BAŞLADI: ${fleet.name} birlikleri ${planet.name} yüzeyine çıkarma yaptı!`,
    ],
  };

  // Move armies into battle status
  for (const army of embarkedArmies) {
    army.fleetId = null;
    army.planetId = planet.id;
  }
  fleet.embarkedArmyIds = [];

  state.groundBattles[battleId] = battle;

  return { success: true, isInvasion: true, battleId };
}

/**
 * Sets orbital bombardment stance for an orbiting fleet
 */
export function setBombardmentStance(
  state: GameState,
  fleetId: string,
  stance: BombardmentStance,
  targetPlanetId?: string | null
): { success: boolean; error?: string } {
  const fleet = state.fleets[fleetId];
  if (!fleet) {
    return { success: false, error: 'Filo bulunamadı.' };
  }

  if (stance === 'none') {
    fleet.bombardmentStance = 'none';
    fleet.bombardmentTargetPlanetId = null;
    return { success: true };
  }

  if (!targetPlanetId) {
    return { success: false, error: 'Hedef gezegen belirtilmedi.' };
  }

  const planet = state.planets[targetPlanetId];
  if (!planet) {
    return { success: false, error: 'Hedef gezegen bulunamadı.' };
  }

  if (fleet.status !== 'orbiting' || fleet.targetSystemId !== planet.systemId) {
    return { success: false, error: 'Filo hedef gezegenin bulunduğu sistemin yörüngesinde olmalıdır.' };
  }

  if (planet.ownerId === fleet.ownerId) {
    return { success: false, error: 'Kendi gezegeninize orbital bombardıman emri veremezsiniz.' };
  }

  fleet.bombardmentStance = stance;
  fleet.bombardmentTargetPlanetId = targetPlanetId;

  return { success: true };
}

/**
 * Dismisses an army from the garrison
 */
export function dismissArmy(state: GameState, armyId: string): { success: boolean; error?: string } {
  if (!state.armies || !state.armies[armyId]) {
    return { success: false, error: 'Terhis edilecek ordu bulunamadı.' };
  }

  const army = state.armies[armyId];

  // If in active battle, cannot dismiss
  if (state.groundBattles) {
    for (const b of Object.values(state.groundBattles)) {
      if (b.status === 'active' && (b.attackerArmyIds.includes(armyId) || b.defenderArmyIds.includes(armyId))) {
        return { success: false, error: 'Muharebe halindeki ordu terhis edilemez.' };
      }
    }
  }

  // Remove from fleet if embarked
  if (army.fleetId) {
    const fleet = state.fleets[army.fleetId];
    if (fleet?.embarkedArmyIds) {
      fleet.embarkedArmyIds = fleet.embarkedArmyIds.filter((id) => id !== armyId);
    }
  }

  delete state.armies[armyId];
  return { success: true };
}

/**
 * Liberates an occupied planet if no hostile occupying armies remain
 */
export function liberatePlanet(
  state: GameState,
  planetId: string,
  liberatorPlayerId: string
): { success: boolean; error?: string } {
  const planet = state.planets[planetId];
  if (!planet) {
    return { success: false, error: 'Gezegen bulunamadı.' };
  }

  if (!planet.occupierId || planet.occupierId === planet.ownerId) {
    return { success: false, error: 'Gezegen şu an işgal altında değil.' };
  }

  // Check if hostile occupying armies remain on planet
  const hostiles = Object.values(state.armies || {}).filter(
    (a) => a.planetId === planet.id && a.ownerId === planet.occupierId
  );

  if (hostiles.length > 0) {
    return {
      success: false,
      error: 'Gezegende hala düşman işgal birlikleri var. Önce kara çıkarmasıyla yok edilmelidir.',
    };
  }

  // Clear occupation
  const oldOccupier = planet.occupierId;
  planet.occupierId = null;
  planet.occupiedAtMs = null;

  return { success: true };
}

/**
 * Ticks orbital bombardment and planet devastation recovery
 */
export function tickOrbitalBombardment(state: GameState, elapsedMs: number): void {
  const elapsedSec = elapsedMs / 1000;
  if (elapsedSec <= 0) return;

  const bombardedPlanetIds = new Set<string>();

  for (const fleet of Object.values(state.fleets)) {
    if (
      fleet.status !== 'orbiting' ||
      !fleet.bombardmentStance ||
      fleet.bombardmentStance === 'none' ||
      !fleet.bombardmentTargetPlanetId
    ) {
      continue;
    }

    const planet = state.planets[fleet.bombardmentTargetPlanetId];
    if (!planet || planet.systemId !== fleet.targetSystemId) {
      fleet.bombardmentStance = 'none';
      fleet.bombardmentTargetPlanetId = null;
      continue;
    }

    // Check if starbase blocks bombardment
    const starbase = state.starbases?.[planet.systemId];
    if (starbase && starbase.ownerId === planet.ownerId && starbase.hull > 0) {
      // Shielded by active starbase
      continue;
    }

    bombardedPlanetIds.add(planet.id);
    const cfg = BOMBARDMENT_CONFIGS[fleet.bombardmentStance];

    // Increase planet devastation
    planet.devastation = Math.min(100, (planet.devastation || 0) + cfg.devastationPerSec * elapsedSec);

    // Calculate fleet firepower multiplier
    let fleetPower = 1;
    const ships = fleet.ships;
    fleetPower += (ships.fighter || 0) * 0.2 + (ships.battleship || 0) * 1.5;

    // Damage garrison defense armies
    if (state.armies) {
      const garrisonArmies = Object.values(state.armies).filter(
        (a) => a.planetId === planet.id && a.ownerId === (planet.occupierId || planet.ownerId)
      );

      if (garrisonArmies.length > 0) {
        const totalDamage = cfg.armyDamagePerSec * fleetPower * elapsedSec;
        const damagePerArmy = totalDamage / garrisonArmies.length;

        for (const army of garrisonArmies) {
          army.health = Math.max(0, army.health - damagePerArmy);
          army.morale = Math.max(0, army.morale - damagePerArmy * 0.8);

          if (army.morale <= 0) {
            army.isDisrouted = true;
          }

          if (army.health <= 0) {
            delete state.armies[army.id];
          }
        }
      }
    }

    // Raiding stance resource siphoning
    if (cfg.siphonResourcesPerSec && fleet.bombardmentStance === 'raiding') {
      const sOre = Math.min(planet.resources.ore, (cfg.siphonResourcesPerSec.ore || 0) * elapsedSec);
      const sCry = Math.min(planet.resources.crystal, (cfg.siphonResourcesPerSec.crystal || 0) * elapsedSec);
      const sFuel = Math.min(planet.resources.fuel, (cfg.siphonResourcesPerSec.fuel || 0) * elapsedSec);

      planet.resources.ore -= sOre;
      planet.resources.crystal -= sCry;
      planet.resources.fuel -= sFuel;

      fleet.cargo.ore += sOre;
      fleet.cargo.crystal += sCry;
      fleet.cargo.fuel += sFuel;
    }
  }

  // Planet natural devastation recovery (if not being bombarded)
  for (const planet of Object.values(state.planets)) {
    if (!bombardedPlanetIds.has(planet.id) && (planet.devastation || 0) > 0) {
      planet.devastation = Math.max(0, (planet.devastation || 0) - 0.05 * elapsedSec);
    }
  }
}

/**
 * Ticks active Ground Combat Battles round by round
 */
export function tickGroundCombatBattles(
  state: GameState,
  elapsedMs: number,
  onEvent?: (type: string, desc: string, playerId?: string, meta?: Record<string, unknown>) => void
): void {
  if (!state.groundBattles) return;
  const elapsedSec = elapsedMs / 1000;
  if (elapsedSec <= 0) return;

  for (const battle of Object.values(state.groundBattles)) {
    if (battle.status !== 'active') continue;

    const planet = state.planets[battle.planetId];
    if (!planet) {
      battle.status = 'defender_victory';
      continue;
    }

    // Gather active attacking & defending armies
    const attackerArmies = battle.attackerArmyIds
      .map((id) => state.armies?.[id])
      .filter((a): a is Army => !!a && a.health > 0);

    const defenderArmies = battle.defenderArmyIds
      .map((id) => state.armies?.[id])
      .filter((a): a is Army => !!a && a.health > 0);

    // Check victory conditions
    if (attackerArmies.length === 0) {
      battle.status = 'defender_victory';
      battle.combatLog.push(
        `🛡️ SAVUNMA ZAFERİ: ${planet.name} yüzeyindeki işgalci birlikler tamamen püskürtüldü!`
      );
      if (onEvent) {
        onEvent(
          'ground_battle_repelled',
          `${planet.name} garnizonu düşman kara istilasını başarıyla püskürttü!`,
          battle.defenderId,
          { battleId: battle.id, planetId: planet.id }
        );
      }
      // Reward surviving defenders with XP and rank up
      for (const d of defenderArmies) {
        d.experience = Math.min(1000, d.experience + 100);
        d.rank = getRankFromExperience(d.experience);
      }
      continue;
    }

    if (defenderArmies.length === 0) {
      battle.status = 'attacker_victory';
      planet.occupierId = battle.attackerId;
      planet.occupiedAtMs = state.timeMs;

      battle.combatLog.push(
        `🚩 İSTİLA BAŞARILI: ${planet.name} garnizonu çöktü! Gezegen işgal altına alındı.`
      );

      if (onEvent) {
        onEvent(
          'ground_battle_conquest',
          `${planet.name} kara ordularımız tarafından işgal edildi!`,
          battle.attackerId,
          { battleId: battle.id, planetId: planet.id }
        );
      }

      // Reward surviving attackers with XP
      for (const a of attackerArmies) {
        a.experience = Math.min(1000, a.experience + 100);
        a.rank = getRankFromExperience(a.experience);
      }

      // Update War Occupation scores
      if (state.wars) {
        for (const war of Object.values(state.wars)) {
          if (war.status === 'active') {
            if (war.attackerId === battle.attackerId && war.defenderId === battle.defenderId) {
              war.attackerOccupation = Math.min(100, (war.attackerOccupation || 0) + 25);
            } else if (war.defenderId === battle.attackerId && war.attackerId === battle.defenderId) {
              war.defenderOccupation = Math.min(100, (war.defenderOccupation || 0) + 25);
            }
          }
        }
      }
      continue;
    }

    // Resolve frontline skirmishes
    const frontlineCount = Math.min(battle.frontlineWidth, attackerArmies.length, defenderArmies.length);

    for (let i = 0; i < frontlineCount; i++) {
      const atk = attackerArmies[i];
      const def = defenderArmies[i];

      const atkRank = getRankMultiplier(atk.rank);
      const defRank = getRankMultiplier(def.rank);

      // Disrouted penalties
      const atkDisroutedMult = atk.isDisrouted ? 0.25 : 1.0;
      const defDisroutedMult = def.isDisrouted ? 0.25 : 1.0;

      // Fortress / Devastation terrain modifiers
      // Higher devastation reduces defense cover
      const coverBonus = Math.max(0.5, 1 - (planet.devastation || 0) / 100 * 0.5);

      const atkDamage =
        atk.attackPower *
        atkRank.attack *
        atkDisroutedMult *
        (100 / (100 + def.defensePower * defRank.defense * coverBonus)) *
        elapsedSec *
        2.5;

      const defDamage =
        def.attackPower *
        defRank.attack *
        defDisroutedMult *
        (100 / (100 + atk.defensePower * atkRank.defense)) *
        elapsedSec *
        2.5;

      // Apply damage
      def.health = Math.max(0, def.health - atkDamage);
      def.morale = Math.max(0, def.morale - atkDamage * 0.9);
      if (def.morale <= 0) def.isDisrouted = true;

      atk.health = Math.max(0, atk.health - defDamage);
      atk.morale = Math.max(0, atk.morale - defDamage * 0.9);
      if (atk.morale <= 0) atk.isDisrouted = true;

      if (def.health <= 0) {
        battle.defenderCasualties++;
        if (state.armies) {
          delete state.armies[def.id];
        }
      }

      if (atk.health <= 0) {
        battle.attackerCasualties++;
        if (state.armies) {
          delete state.armies[atk.id];
        }
      }
    }
  }
}

/**
 * Main module tick combining recruitment, bombardment, and ground combat
 */
export function updateGroundWarfare(
  state: GameState,
  elapsedMs: number,
  onEvent?: (type: string, desc: string, playerId?: string, meta?: Record<string, unknown>) => void
): void {
  tickArmyRecruitment(state, state.timeMs);
  tickOrbitalBombardment(state, elapsedMs);
  tickGroundCombatBattles(state, elapsedMs, onEvent);
}
