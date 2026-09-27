import { GAME_CONSTANTS, SHIP_STATS } from './constants';
import { PRNG } from './prng';
import { BattleReport, CombatRound, PlanetStance, Resources, ShipType } from './types';

export interface CombatFleetInput {
  ownerId: string;
  ownerName: string;
  ships: Record<ShipType, number>;
  weaponsResearchLevel: number;
  stance?: PlanetStance;
}

export interface CombatResult {
  report: BattleReport;
  remainingAttacker: Record<ShipType, number>;
  remainingDefender: Record<ShipType, number>;
  lootedResources: Resources;
  debrisFieldCreated: Resources;
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
 * Deterministically simulates round-by-round space combat
 */
export function resolveCombat(
  attacker: CombatFleetInput,
  defender: CombatFleetInput,
  systemId: string,
  systemName: string,
  context: 'planet_raid' | 'fleet_interception' | 'relay_contest',
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

  // Evade check: if defender has 'evade_safeguard' on planet raid and is vastly outmatched
  const attackerRating = getFleetCombatRating(attacker.ships, attacker.weaponsResearchLevel);
  const defenderRating = getFleetCombatRating(defender.ships, defender.weaponsResearchLevel);

  let defenderEvaded = false;
  if (
    context === 'planet_raid' &&
    defender.stance === 'evade_safeguard' &&
    attackerRating.totalAttack > defenderRating.totalHealth * 3 &&
    defenderRating.totalHealth > 0
  ) {
    // Defending fleet evades combat to preserve ships, but leaves planet open for raid
    defenderEvaded = true;
  }

  const rounds: CombatRound[] = [];
  const maxRounds = defenderEvaded ? 0 : 6;

  for (let r = 1; r <= maxRounds; r++) {
    // Check if either side has zero ships
    const attCount = Object.values(currentAttacker).reduce((a, b) => a + b, 0);
    const defCount = Object.values(currentDefender).reduce((a, b) => a + b, 0);

    if (attCount === 0 || defCount === 0) break;

    // Calculate attack output with +/- 10% deterministic variance
    const attRating = getFleetCombatRating(currentAttacker, attacker.weaponsResearchLevel);
    const defRating = getFleetCombatRating(currentDefender, defender.weaponsResearchLevel);

    const attVariance = 0.9 + prng.next() * 0.2;
    const defVariance = 0.9 + prng.next() * 0.2;

    const attDmg = Math.round(attRating.totalAttack * attVariance);
    const defDmg = Math.round(defRating.totalAttack * defVariance);

    // Apply losses to defender
    const defLosses = applyDamageToFleet(currentDefender, attDmg, prng);
    // Apply losses to attacker
    const attLosses = applyDamageToFleet(currentAttacker, defDmg, prng);

    rounds.push({
      roundNumber: r,
      attackerDamageDealt: attDmg,
      defenderDamageDealt: defDmg,
      attackerLosses: defLosses.losses, // ships lost by defender from attacker dmg
      defenderLosses: attLosses.losses, // ships lost by attacker from defender dmg
      attackerRemaining: { ...currentAttacker },
      defenderRemaining: { ...currentDefender },
    });
  }

  // Determine winner
  const survivingAttackerCount = Object.values(currentAttacker).reduce((a, b) => a + b, 0);
  const survivingDefenderCount = Object.values(currentDefender).reduce((a, b) => a + b, 0);

  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  if (survivingAttackerCount > 0 && survivingDefenderCount === 0) {
    winner = 'attacker';
  } else if (survivingDefenderCount > 0 && survivingAttackerCount === 0) {
    winner = 'defender';
  } else if (survivingAttackerCount > survivingDefenderCount) {
    winner = 'attacker';
  } else if (survivingDefenderCount > survivingAttackerCount) {
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
    winner,
    lootedResources,
    debrisFieldCreated,
  };

  return {
    report,
    remainingAttacker: currentAttacker,
    remainingDefender: currentDefender,
    lootedResources,
    debrisFieldCreated,
  };
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
