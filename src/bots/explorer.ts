import { GAME_CONSTANTS, getBuildingUpgradeCost } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';
import { evaluateBotDiplomacy } from './diplomacy';
import { IBotAgent } from './types';

export class ExplorerBot implements IBotAgent {
  public archetype = 'explorer' as const;

  constructor(public playerId: string) {}

  update(engine: GameEngine): GameCommand[] {
    const view = engine.getPlayerView(this.playerId);
    const executedCommands: GameCommand[] = [];
    const homeworld = view.myPlanets.find(p => p.isHomeworld) || view.myPlanets[0];
    if (!homeworld) return executedCommands;

    // 1. Send idle Scouts to unexplored systems or POIs
    if (homeworld.garrison.scout > 0) {
      // Find candidate systems with POI or unexplored
      const candidateSystems = Object.values(view.discoveredSystems).filter(
        s => (s.intelLevel === 'unexplored' || s.hasPoi) && s.system.id !== homeworld.systemId
      );

      if (candidateSystems.length > 0 && homeworld.resources.fuel >= 40) {
        const target = candidateSystems[0];
        const cmd: GameCommand = {
          type: 'DISPATCH_FLEET',
          originPlanetId: homeworld.id,
          targetSystemId: target.system.id,
          ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
          mission: 'explore',
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 2. Colonization attempt if we have transport and colony materials
    const colonySlots = Object.values(view.discoveredSystems).flatMap(s =>
      s.visiblePlanets.filter(p => p.ownerId === null).map(p => ({ systemId: s.system.id, planet: p }))
    );

    if (
      view.myPlanets.length < GAME_CONSTANTS.MAX_COLONIES_PER_PLAYER &&
      homeworld.garrison.transport >= 1 &&
      colonySlots.length > 0 &&
      homeworld.resources.ore >= GAME_CONSTANTS.COLONY_COST.ore &&
      homeworld.resources.crystal >= GAME_CONSTANTS.COLONY_COST.crystal &&
      homeworld.resources.fuel >= GAME_CONSTANTS.COLONY_COST.fuel + 60
    ) {
      const targetSlot = colonySlots[0];
      const cmd: GameCommand = {
        type: 'DISPATCH_FLEET',
        originPlanetId: homeworld.id,
        targetSystemId: targetSlot.systemId,
        targetPlanetId: targetSlot.planet.id,
        ships: { scout: 0, transport: 1, fighter: 1, battleship: 0 },
        cargo: { ...GAME_CONSTANTS.COLONY_COST },
        mission: 'colonize',
      };
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 3. Build Scouts and Transports in shipyard
    if (homeworld.buildings.shipyard >= 1 && homeworld.shipyardQueue.length === 0) {
      if (homeworld.garrison.scout < 2 && homeworld.resources.ore >= 200) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'scout',
          count: 1,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      } else if (homeworld.garrison.transport < 2 && homeworld.resources.ore >= 450) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'transport',
          count: 1,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 4. Basic Mine upgrades
    for (const planet of view.myPlanets) {
      if (!planet.buildingQueue) {
        const oreCost = getBuildingUpgradeCost('ore_mine', planet.buildings.ore_mine);
        if (planet.resources.ore >= oreCost.ore && planet.resources.crystal >= oreCost.crystal) {
          const cmd: GameCommand = {
            type: 'UPGRADE_BUILDING',
            planetId: planet.id,
            buildingType: 'ore_mine',
          };
          const receipt = engine.dispatchCommand(this.playerId, cmd);
          if (receipt.success) executedCommands.push(cmd);
        }
      }
    }

    // 5. Diplomatic Radio Transmissions
    const diplomacyCmds = evaluateBotDiplomacy(engine, this.playerId);
    for (const cmd of diplomacyCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    return executedCommands;
  }
}
