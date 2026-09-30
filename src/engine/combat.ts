import { DEFENSE_STATS, GAME_CONSTANTS, SHIP_STATS } from './constants';
import { PRNG } from './prng';
import { BattleReport, CombatRound, DefenseStructureType, EmpireArtifactId, FleetDoctrine, PlanetSpecialization, PlanetStance, Resources, ShipType } from './types';
import { Admiral, ADMIRAL_TRAITS } from './admirals';

export interface CombatFleetInput {
  ownerId: string;
  ownerName: string;
  ships: Record<ShipType, number>;
  weaponsResearchLevel: number;
  stance?: PlanetStance;
  admiral?: Admiral;
  defenses?: Record<DefenseStructureType, number>;
  doctrine?: FleetDoctrine;
  planetSpecialization?: PlanetSpecialization;
  artifacts?: EmpireArtifactId[];
}

export interface CombatResult {
  report: BattleReport;
  remainingAttacker: Record<ShipType, number>;
  remainingDefender: Record<ShipType, number>;
  remainingDefenses?: Record<DefenseStructureType, number>;
  lootedResources: Resources;
  debrisFieldCreated: Resources;
  attackerAdmiralXP?: { admiralId: string; xpGained: number };
  defenderAdmiralXP?: { admiralId: string; xpGained: number };
}

/**
 * Calculates raw combat firepower and effective HP for a fleet
 */
export function getFleetCombatRating(
  ships: Record<ShipType, number>,
  weaponsLevel: number = 0
): { totalAttack: number; totalHealth: number } {
  let totalAttack = 0;
  let totalHealth = 0;

  const weaponMult = 1 + (weaponsLevel * 0.10);

  for (const [shipType, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      const stats = SHIP_STATS[shipType];
      totalAttack += stats.attack * count * weaponMult;
      totalHealth += (stats.hull + stats.shield) * count;
    }
  }

  return { totalAttack, totalHealth };
}

/**
 * Calculates raw combat firepower and effective HP for planetary defense platforms
 */
export function getDefenseCombatRating(
  defenses?: Record<DefenseStructureType, number>,
  weaponsLevel: number = 0
): { totalAttack: number; totalHealth: number } {
  if (!defenses) return { totalAttack: 0, totalHealth: 0 };
  let totalAttack = 0;
  let totalHealth = 0;

  const weaponMult = 1 + (weaponsLevel * 0.10);

  for (const [defType, count] of Object.entries(defenses) as [DefenseStructureType, number][]) {
    if (count > 0) {
      const stats = DEFENSE_STATS[defType];
      if (stats) {
        totalAttack += stats.attack * count * weaponMult;
        totalHealth += (stats.hull + stats.shield) * count;
      }
    }
  }

  return { totalAttack, totalHealth };
}

/**
 * Deterministically simulates round-by-round space combat
 */
export function resolveCombat(
  attacker: CombatFleetInput,
  defender: CombatFleetInput,
  systemId: string,
  systemName: string,
  context: 'planet_raid' | 'fleet_interception' | 'relay_contest' | 'pirate_lair',
  availablePlanetResources?: Resources,
  protectedCapacity: number = 1000,
  timestamp: number = Date.now(),
  seed: number = 1337
): CombatResult {
  const prng = new PRNG(seed);

  const initialAttacker: Record<ShipType, number> = { ...attacker.ships };
  const initialDefender: Record<ShipType, number> = { ...defender.ships };

  const currentAttacker: Record<ShipType, number> = { ...attacker.ships };
  const currentDefender: Record<ShipType, number> = { ...defender.ships };

  const initialDefenses: Record<DefenseStructureType, number> = {
    missile_battery: defender.defenses?.missile_battery || 0,
    plasma_turret: defender.defenses?.plasma_turret || 0,
    ion_cannon: defender.defenses?.ion_cannon || 0,
  };
  const currentDefenses: Record<DefenseStructureType, number> = { ...initialDefenses };
  const hasInitialDefenses =
    initialDefenses.missile_battery + initialDefenses.plasma_turret + initialDefenses.ion_cannon > 0;

  // Evade check: if defender has 'evade_safeguard' on planet raid and is vastly outmatched
  const attackerRating = getFleetCombatRating(attacker.ships, attacker.weaponsResearchLevel);
  const defenderFleetRating = getFleetCombatRating(defender.ships, defender.weaponsResearchLevel);
  const defenderDefRating = getDefenseCombatRating(defender.defenses, defender.weaponsResearchLevel);
  const defenderTotalRating = {
    totalAttack: defenderFleetRating.totalAttack + defenderDefRating.totalAttack,
    totalHealth: defenderFleetRating.totalHealth + defenderDefRating.totalHealth,
  };

  let defenderEvaded = false;
  if (
    context === 'planet_raid' &&
    defender.stance === 'evade_safeguard' &&
    attackerRating.totalAttack > defenderTotalRating.totalHealth * 3 &&
    defenderFleetRating.totalHealth > 0
  ) {
    // Defending fleet evades combat to preserve ships, but orbital defense platforms remain active
    defenderEvaded = true;
    for (const st of Object.keys(currentDefender) as ShipType[]) {
      currentDefender[st] = 0;
    }
  }

  const rounds: CombatRound[] = [];
  const maxRounds = defenderEvaded && !hasInitialDefenses ? 0 : 6;

  for (let r = 1; r <= maxRounds; r++) {
    // Check if either side has zero ships / defenses
    const attCount = Object.values(currentAttacker).reduce((a, b) => a + b, 0);
    const defCount = Object.values(currentDefender).reduce((a, b) => a + b, 0);
    const defDefCount = Object.values(currentDefenses).reduce((a, b) => a + b, 0);

    if (attCount === 0 || (defCount === 0 && defDefCount === 0)) break;

    // Calculate attack output with +/- 10% deterministic variance
    const attRating = getFleetCombatRating(currentAttacker, attacker.weaponsResearchLevel);
    const defRating = getFleetCombatRating(currentDefender, defender.weaponsResearchLevel);
    const currentDefenseRating = getDefenseCombatRating(currentDefenses, defender.weaponsResearchLevel);
    const isMilitaryBastion = context === 'planet_raid' && defender.planetSpecialization === 'military_bastion';
    if (isMilitaryBastion) {
      currentDefenseRating.totalAttack = Math.round(currentDefenseRating.totalAttack * 1.25);
    }

    // Admiral bonuses
    const attAdmiralMult = attacker.admiral ? 1 + (attacker.admiral.level - 1) * 0.05 : 1.0;
    const attTraitMult = attacker.admiral
      ? attacker.admiral.traitId === 'siege_breaker' && (context === 'planet_raid' || context === 'relay_contest' || context === 'pirate_lair')
        ? 1.30
        : ADMIRAL_TRAITS[attacker.admiral.traitId].attackMultiplier
      : 1.0;

    const defAdmiralMult = defender.admiral ? 1 + (defender.admiral.level - 1) * 0.05 : 1.0;
    const defTraitMult = defender.admiral ? ADMIRAL_TRAITS[defender.admiral.traitId].attackMultiplier : 1.0;

    const attVariance = 0.9 + prng.next() * 0.2;
    const defVariance = 0.9 + prng.next() * 0.2;

    let attDmg = Math.round(attRating.totalAttack * attVariance * attAdmiralMult * attTraitMult);
    let defDmg = Math.round(
      (defRating.totalAttack + currentDefenseRating.totalAttack) * defVariance * defAdmiralMult * defTraitMult
    );

    // Attacker Critical Strike check
    if (attacker.admiral && attacker.admiral.traitId === 'tactical_genius') {
      if (prng.next() < 0.18) {
        attDmg = Math.round(attDmg * 1.45);
      }
    }

    // Defender Evasion check
    if (defender.admiral && defender.admiral.traitId === 'evasion_master') {
      if (prng.next() < 0.18) {
        attDmg = Math.round(attDmg * 0.65);
      }
    }

    // Iron discipline damage reductions
    if (defender.admiral && defender.admiral.traitId === 'iron_discipline') {
      attDmg = Math.round(attDmg * 0.85);
    }
    if (attacker.admiral && attacker.admiral.traitId === 'iron_discipline') {
      defDmg = Math.round(defDmg * 0.85);
    }

    // Fleet Doctrine combat adjustments
    // 1. Attacker Doctrine
    if (attacker.doctrine === 'spearhead') {
      attDmg = Math.round(attDmg * 1.15); // +15% offensive firepower
      defDmg = Math.round(defDmg * 1.10); // +10% damage taken
    } else if (attacker.doctrine === 'fortress') {
      attDmg = Math.round(attDmg * 0.90); // -10% offensive firepower
      defDmg = Math.round(defDmg * 0.80); // 20% shield/hull damage absorption
    } else if (attacker.doctrine === 'hit_and_run' && prng.next() < 0.20) {
      defDmg = Math.round(defDmg * 0.50); // 20% evasion chance to dodge half damage
    }

    // 2. Defender Doctrine
    if (defender.doctrine === 'spearhead') {
      defDmg = Math.round(defDmg * 1.15); // +15% offensive firepower
      attDmg = Math.round(attDmg * 1.10); // +10% damage taken
    } else if (defender.doctrine === 'fortress') {
      defDmg = Math.round(defDmg * 0.90); // -10% offensive firepower
      attDmg = Math.round(attDmg * 0.80); // 20% shield/hull damage absorption
    } else if (defender.doctrine === 'hit_and_run' && prng.next() < 0.20) {
      attDmg = Math.round(attDmg * 0.50); // 20% evasion chance to dodge half damage
    }

    // 3. Imperial Relics (dreadnought_plating)
    if (attacker.artifacts?.includes('dreadnought_plating')) {
      attDmg = Math.round(attDmg * 1.10); // +10% offensive firepower
      defDmg = Math.round(defDmg * 0.90); // -10% damage taken
    }
    if (defender.artifacts?.includes('dreadnought_plating')) {
      defDmg = Math.round(defDmg * 1.10); // +10% offensive firepower
      attDmg = Math.round(attDmg * 0.90); // -10% damage taken
    }

    // Apply losses to defender (ships and orbital defenses)
    let defLosses: { losses: Record<ShipType, number> };
    let defDefenseLosses: Record<DefenseStructureType, number> | undefined;

    if (hasInitialDefenses) {
      const defRes = applyDamageToDefender(currentDefender, currentDefenses, attDmg, prng, isMilitaryBastion);
      defLosses = { losses: defRes.shipLosses };
      defDefenseLosses = defRes.defenseLosses;
    } else {
      defLosses = applyDamageToFleet(currentDefender, attDmg, prng);
    }

    // Apply losses to attacker
    const attLosses = applyDamageToFleet(currentAttacker, defDmg, prng);

    rounds.push({
      roundNumber: r,
      attackerDamageDealt: attDmg,
      defenderDamageDealt: defDmg,
      attackerLosses: defLosses.losses, // ships lost by defender from attacker dmg
      defenderLosses: attLosses.losses, // ships lost by attacker from defender dmg
      defenderDefenseLosses: hasInitialDefenses ? defDefenseLosses : undefined,
      attackerRemaining: { ...currentAttacker },
      defenderRemaining: { ...currentDefender },
      defenderDefenseRemaining: hasInitialDefenses ? { ...currentDefenses } : undefined,
    });
  }

  // Determine winner
  const survivingAttackerCount = Object.values(currentAttacker).reduce((a, b) => a + b, 0);
  const survivingDefenderCount = Object.values(currentDefender).reduce((a, b) => a + b, 0);
  const survivingDefensesCount = Object.values(currentDefenses).reduce((a, b) => a + b, 0);

  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  if (survivingAttackerCount > 0 && survivingDefenderCount === 0 && survivingDefensesCount === 0) {
    winner = 'attacker';
  } else if ((survivingDefenderCount > 0 || survivingDefensesCount > 0) && survivingAttackerCount === 0) {
    winner = 'defender';
  } else if (survivingAttackerCount > (survivingDefenderCount + survivingDefensesCount)) {
    winner = 'attacker';
  } else if ((survivingDefenderCount + survivingDefensesCount) > survivingAttackerCount) {
    winner = 'defender';
  }

  // Calculate destroyed ship resources for debris field (30% ore and crystal)
  const debrisFieldCreated: Resources = { ore: 0, crystal: 0, fuel: 0 };
  const shipTypes: ShipType[] = ['scout', 'transport', 'fighter', 'battleship'];

  for (const st of shipTypes) {
    const lostAttacker = initialAttacker[st] - currentAttacker[st];
    const lostDefender = initialDefender[st] - currentDefender[st];
    const totalLost = lostAttacker + lostDefender;

    if (totalLost > 0) {
      const stats = SHIP_STATS[st];
      debrisFieldCreated.ore += Math.round(totalLost * stats.cost.ore * GAME_CONSTANTS.COMBAT_DEBRIS_RECOVERY_RATIO);
      debrisFieldCreated.crystal += Math.round(totalLost * stats.cost.crystal * GAME_CONSTANTS.COMBAT_DEBRIS_RECOVERY_RATIO);
    }
  }

  // Calculate destroyed planetary defense structures for debris field
  if (hasInitialDefenses) {
    const defenseTypes: DefenseStructureType[] = ['missile_battery', 'plasma_turret', 'ion_cannon'];
    for (const dt of defenseTypes) {
      const lostDef = (initialDefenses[dt] || 0) - (currentDefenses[dt] || 0);
      if (lostDef > 0) {
        const stats = DEFENSE_STATS[dt];
        debrisFieldCreated.ore += Math.round(lostDef * stats.cost.ore * GAME_CONSTANTS.COMBAT_DEBRIS_RECOVERY_RATIO);
        debrisFieldCreated.crystal += Math.round(lostDef * stats.cost.crystal * GAME_CONSTANTS.COMBAT_DEBRIS_RECOVERY_RATIO);
      }
    }
  }

  // Calculate loot if attacker won a planet raid (or defender evaded)
  const lootedResources: Resources = { ore: 0, crystal: 0, fuel: 0 };
  if ((winner === 'attacker' || defenderEvaded) && context === 'planet_raid' && availablePlanetResources) {
    // Attacker cargo capacity of remaining ships
    let totalCargoCapacity = 0;
    for (const st of shipTypes) {
      totalCargoCapacity += currentAttacker[st] * SHIP_STATS[st].cargoCapacity;
    }

    if (totalCargoCapacity > 0) {
      // Unprotected resources subject to max 20% raid ceiling
      const raidCeiling = GAME_CONSTANTS.MAX_RAID_LOOT_PERCENTAGE;

      const unprotectedOre = Math.max(0, availablePlanetResources.ore - protectedCapacity);
      const unprotectedCrystal = Math.max(0, availablePlanetResources.crystal - protectedCapacity);
      const unprotectedFuel = Math.max(0, availablePlanetResources.fuel - protectedCapacity);

      const maxRaidOre = Math.floor(unprotectedOre * raidCeiling);
      const maxRaidCrystal = Math.floor(unprotectedCrystal * raidCeiling);
      const maxRaidFuel = Math.floor(unprotectedFuel * raidCeiling);

      // Distribute evenly across available cargo
      const totalEligible = maxRaidOre + maxRaidCrystal + maxRaidFuel;
      if (totalEligible > 0) {
        const factor = Math.min(1, totalCargoCapacity / totalEligible);
        lootedResources.ore = Math.floor(maxRaidOre * factor);
        lootedResources.crystal = Math.floor(maxRaidCrystal * factor);
        lootedResources.fuel = Math.floor(maxRaidFuel * factor);
      }
    }
  }

  const report: BattleReport = {
    id: `battle_${timestamp}_${prng.nextInt(1000, 9999)}`,
    timestamp,
    systemId,
    systemName,
    attackerId: attacker.ownerId,
    attackerName: attacker.ownerName,
    defenderId: defender.ownerId,
    defenderName: defender.ownerName,
    context,
    rounds,
    initialAttacker,
    initialDefender,
    survivingAttacker: currentAttacker,
    survivingDefender: currentDefender,
    initialDefenses: hasInitialDefenses ? initialDefenses : undefined,
    survivingDefenses: hasInitialDefenses ? currentDefenses : undefined,
    winner,
    lootedResources,
    debrisFieldCreated,
    attackerAdmiralName: attacker.admiral?.name,
    defenderAdmiralName: defender.admiral?.name,
    attackerDoctrine: attacker.doctrine,
    defenderDoctrine: defender.doctrine,
    attackerArtifacts: attacker.artifacts,
    defenderArtifacts: defender.artifacts,
  };

  const attackerAdmiralXP = attacker.admiral
    ? {
        admiralId: attacker.admiral.id,
        xpGained: winner === 'attacker' ? 150 : 60,
      }
    : undefined;

  const defenderAdmiralXP = defender.admiral
    ? {
        admiralId: defender.admiral.id,
        xpGained: winner === 'defender' ? 150 : 60,
      }
    : undefined;

  return {
    report,
    remainingAttacker: currentAttacker,
    remainingDefender: currentDefender,
    remainingDefenses: hasInitialDefenses ? currentDefenses : undefined,
    lootedResources,
    debrisFieldCreated,
    attackerAdmiralXP,
    defenderAdmiralXP,
  };
}

/**
 * Distributes incoming damage across planetary defenses according to durability priority
 */
function applyDamageToDefenses(
  defenses: Record<DefenseStructureType, number>,
  incomingDamage: number,
  prng: PRNG,
  isMilitaryBastion: boolean = false
): { losses: Record<DefenseStructureType, number> } {
  const losses: Record<DefenseStructureType, number> = { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 };
  let remainingDmg = incomingDamage;
  const order: DefenseStructureType[] = ['missile_battery', 'plasma_turret', 'ion_cannon'];

  for (const dt of order) {
    if (remainingDmg <= 0) break;
    const count = defenses[dt] || 0;
    if (count <= 0) continue;

    const stats = DEFENSE_STATS[dt];
    const unitHp = Math.round((stats.hull + stats.shield) * (isMilitaryBastion ? 1.25 : 1.0));

    const unitsDestroyed = Math.min(count, Math.floor(remainingDmg / unitHp));
    if (unitsDestroyed > 0) {
      defenses[dt] -= unitsDestroyed;
      losses[dt] += unitsDestroyed;
      remainingDmg -= unitsDestroyed * unitHp;
    } else {
      const killChance = remainingDmg / unitHp;
      if (prng.next() < killChance && defenses[dt] > 0) {
        defenses[dt] -= 1;
        losses[dt] += 1;
        remainingDmg = 0;
      }
      break;
    }
  }

  return { losses };
}

/**
 * Distributes damage between defender fleet ships and planetary defense installations
 */
function applyDamageToDefender(
  fleet: Record<ShipType, number>,
  defenses: Record<DefenseStructureType, number>,
  incomingDamage: number,
  prng: PRNG,
  isMilitaryBastion: boolean = false
): {
  shipLosses: Record<ShipType, number>;
  defenseLosses: Record<DefenseStructureType, number>;
} {
  const shipCount = Object.values(fleet).reduce((a, b) => a + b, 0);
  const defCount = Object.values(defenses).reduce((a, b) => a + b, 0);

  if (shipCount === 0 && defCount === 0) {
    return {
      shipLosses: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
      defenseLosses: { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 },
    };
  }

  if (defCount === 0) {
    const shipLosses = applyDamageToFleet(fleet, incomingDamage, prng).losses;
    return {
      shipLosses,
      defenseLosses: { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 },
    };
  }

  if (shipCount === 0) {
    const defenseLosses = applyDamageToDefenses(defenses, incomingDamage, prng, isMilitaryBastion).losses;
    return {
      shipLosses: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
      defenseLosses,
    };
  }

  // Defenses absorb 40% (or 60% if military_bastion) of incoming damage, protecting the fleet
  const defenseRatio = isMilitaryBastion ? 0.60 : 0.40;
  const defDmg = Math.round(incomingDamage * defenseRatio);
  const shipDmg = incomingDamage - defDmg;

  const defenseLosses = applyDamageToDefenses(defenses, defDmg, prng, isMilitaryBastion).losses;
  const shipLosses = applyDamageToFleet(fleet, shipDmg, prng).losses;

  return { shipLosses, defenseLosses };
}

/**
 * Distributes incoming damage across ships according to durability priority
 */
function applyDamageToFleet(
  fleet: Record<ShipType, number>,
  incomingDamage: number,
  _prng: PRNG
): { losses: Record<ShipType, number> } {
  const losses: Record<ShipType, number> = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
  let remainingDmg = incomingDamage;

  // Damage priority: frontline light ships soak damage first, battleships soak remaining
  const order: ShipType[] = ['fighter', 'scout', 'transport', 'battleship'];

  for (const st of order) {
    if (remainingDmg <= 0) break;
    const count = fleet[st];
    if (count <= 0) continue;

    const stats = SHIP_STATS[st];
    const unitHp = stats.hull + stats.shield;

    const unitsDestroyed = Math.min(count, Math.floor(remainingDmg / unitHp));
    if (unitsDestroyed > 0) {
      fleet[st] -= unitsDestroyed;
      losses[st] += unitsDestroyed;
      remainingDmg -= unitsDestroyed * unitHp;
    } else {
      // Partial damage check (probabilistic kill for leftover fraction)
      const killChance = remainingDmg / unitHp;
      if (_prng.next() < killChance && fleet[st] > 0) {
        fleet[st] -= 1;
        losses[st] += 1;
        remainingDmg = 0;
      }
      break;
    }
  }

  return { losses };
}
