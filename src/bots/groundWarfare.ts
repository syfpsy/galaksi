/**
 * CANLI GALAKSİ - Autonomous Bot AI for Ground Warfare, Bombardment & Planetary Invasions (Phase 30)
 */

import { GameEngine } from '../engine/engine';
import { GameCommand, ArmyType, BombardmentStance } from '../engine/types';
import {
  ARMY_CONFIGS,
  canRecruitArmy,
  canEmbarkArmies,
  canLandArmies,
} from '../engine/groundWarfare';
import { getActiveWarsForPlayer } from '../engine/wars';

export function evaluateBotGroundWarfare(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  const myArmies = Object.values(engine.state.armies || {}).filter((a) => a.ownerId === playerId);

  // 1. Army Recruitment on Core Planets
  for (const planet of playerPlanets) {
    if (planet.armyQueue) continue;

    const planetArmies = myArmies.filter((a) => a.planetId === planet.id);
    const hasGarrison = planetArmies.some((a) => a.isGarrisonOnly);

    // Pick army type according to archetype and current garrison state
    let targetType: ArmyType = 'defense_militia';

    if (!hasGarrison) {
      targetType = 'defense_militia';
    } else if (planetArmies.length < 4) {
      if (archetype === 'raider') {
        targetType = Math.random() > 0.4 ? 'xenomorph_swarm' : 'assault_infantry';
      } else if (archetype === 'admiral') {
        targetType = Math.random() > 0.5 ? 'gene_warriors' : 'mechanized_armor';
      } else if (archetype === 'industrialist') {
        targetType = Math.random() > 0.4 ? 'robotic_warforms' : 'mechanized_armor';
      } else if (archetype === 'guardian') {
        targetType = Math.random() > 0.5 ? 'defense_militia' : 'mechanized_armor';
      } else {
        targetType = 'assault_infantry';
      }
    } else {
      // Planet has sufficient garrison
      continue;
    }

    const cfg = ARMY_CONFIGS[targetType];
    if (
      planet.resources.ore >= cfg.cost.ore + 120 &&
      planet.resources.crystal >= cfg.cost.crystal + 80 &&
      planet.resources.fuel >= cfg.cost.fuel + 60
    ) {
      if (canRecruitArmy(engine.state, planet.id, targetType).ok) {
        const cmd: GameCommand = {
          type: 'RECRUIT_ARMY',
          planetId: planet.id,
          armyType: targetType,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          break; // One recruitment per tick
        }
      }
    }
  }

  // 2. Embark Idle Assault Armies onto Friendly Fleets
  for (const planet of playerPlanets) {
    const idleAssaultArmies = myArmies.filter(
      (a) => a.planetId === planet.id && !a.isGarrisonOnly && a.health >= a.maxHealth * 0.7
    );

    if (idleAssaultArmies.length > 0) {
      const orbitingFleet = Object.values(engine.state.fleets).find(
        (f) =>
          f.ownerId === playerId &&
          f.status === 'orbiting' &&
          f.targetSystemId === planet.systemId &&
          (!f.embarkedArmyIds || f.embarkedArmyIds.length < 4)
      );

      if (orbitingFleet && canEmbarkArmies(engine.state, planet.id, orbitingFleet.id).ok) {
        const cmd: GameCommand = {
          type: 'EMBARK_ARMIES',
          planetId: planet.id,
          fleetId: orbitingFleet.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }

  // 3. Orbital Bombardment & Landing Invasions
  const myFleets = Object.values(engine.state.fleets).filter(
    (f) => f.ownerId === playerId && f.status === 'orbiting'
  );

  const activeWars = getActiveWarsForPlayer(engine.state, playerId);
  const enemyPlayerIds = new Set<string>();
  for (const war of activeWars) {
    if (war.attackerId === playerId) enemyPlayerIds.add(war.defenderId);
    if (war.defenderId === playerId) enemyPlayerIds.add(war.attackerId);
  }

  for (const fleet of myFleets) {
    // Find enemy planets in the current system
    const systemPlanets = Object.values(engine.state.planets).filter(
      (p) => p.systemId === fleet.targetSystemId && (enemyPlayerIds.has(p.ownerId) || p.ownerId !== playerId)
    );

    if (systemPlanets.length === 0) {
      // Check if fleet was bombarding but no longer needs to
      if (fleet.bombardmentStance && fleet.bombardmentStance !== 'none') {
        engine.dispatchCommand(playerId, {
          type: 'SET_BOMBARDMENT_STANCE',
          fleetId: fleet.id,
          stance: 'none',
        });
      }
      continue;
    }

    const targetPlanet = systemPlanets[0];
    const systemStarbase = engine.state.starbases?.[targetPlanet.systemId];
    const isStarbaseNeutralized = !systemStarbase || systemStarbase.ownerId !== targetPlanet.ownerId || systemStarbase.hull <= 0;

    if (!isStarbaseNeutralized) {
      // Cannot bombard or land until starbase is neutralized
      continue;
    }

    // A. Check Planetary Landing / Invasion
    if (fleet.embarkedArmyIds && fleet.embarkedArmyIds.length > 0) {
      if (canLandArmies(engine.state, fleet.id, targetPlanet.id).ok) {
        const cmd: GameCommand = {
          type: 'LAND_ARMIES',
          fleetId: fleet.id,
          targetPlanetId: targetPlanet.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          continue;
        }
      }
    }

    // B. Orbital Bombardment
    if (!fleet.bombardmentStance || fleet.bombardmentStance === 'none') {
      let stance: BombardmentStance = 'selective';
      if (archetype === 'raider') stance = 'raiding';
      else if (archetype === 'admiral') stance = 'indiscriminate';
      else stance = 'selective';

      const cmd: GameCommand = {
        type: 'SET_BOMBARDMENT_STANCE',
        fleetId: fleet.id,
        stance,
        targetPlanetId: targetPlanet.id,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 4. Liberate Occupied Worlds
  for (const planet of playerPlanets) {
    if (planet.occupierId && planet.occupierId !== playerId) {
      const hostileArmies = Object.values(engine.state.armies || {}).filter(
        (a) => a.planetId === planet.id && a.ownerId === planet.occupierId
      );
      if (hostileArmies.length === 0) {
        const cmd: GameCommand = {
          type: 'LIBERATE_PLANET',
          planetId: planet.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }
}
