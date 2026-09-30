import { GAME_CONSTANTS, SHIP_STATS } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';
import { evaluateBotDiplomacy } from './diplomacy';
import { IBotAgent } from './types';

export class GuardianBot implements IBotAgent {
  public archetype = 'guardian' as const;

  constructor(public playerId: string) {}

  update(engine: GameEngine): GameCommand[] {
    const view = engine.getPlayerView(this.playerId);
    const executedCommands: GameCommand[] = [];
    const homeworld = view.myPlanets.find(p => p.isHomeworld) || view.myPlanets[0];
    if (!homeworld) return executedCommands;

    // 1. Contest Relay Prime if not yet owned by us
    const relayContest = view.relayContest;
    const relaySys = view.discoveredSystems[relayContest.systemId];

    if (
      relayContest.controllerId !== this.playerId &&
      relaySys &&
      relaySys.intelLevel !== 'unexplored'
    ) {
      const readyCombatShips = homeworld.garrison.fighter >= 3 || homeworld.garrison.battleship >= 1;
      if (readyCombatShips && homeworld.resources.fuel >= 90) {
        const cmd: GameCommand = {
          type: 'DISPATCH_FLEET',
          originPlanetId: homeworld.id,
          targetSystemId: relayContest.systemId,
          ships: {
            scout: 1,
            transport: 0,
            fighter: Math.min(homeworld.garrison.fighter, 4),
            battleship: homeworld.garrison.battleship,
          },
          mission: 'support',
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return executedCommands;
        }
      }
    }

    // 2. Outpost Colonization: Secure a defensive secondary bastion
    if (view.myPlanets.length < 2) {
      const candidateSlots: { systemId: string; planet: { id: string; name: string } }[] = [];
      const homeSysView = view.discoveredSystems[homeworld.systemId];
      if (homeSysView) {
        for (const p of homeSysView.visiblePlanets) {
          if (p.ownerId === null) {
            candidateSlots.push({ systemId: homeworld.systemId, planet: p });
          }
        }
      }
      if (
        homeworld.garrison.transport >= 1 &&
        candidateSlots.length > 0 &&
        homeworld.resources.ore >= GAME_CONSTANTS.COLONY_COST.ore &&
        homeworld.resources.crystal >= GAME_CONSTANTS.COLONY_COST.crystal &&
        homeworld.resources.fuel >= GAME_CONSTANTS.COLONY_COST.fuel + 50
      ) {
        const targetSlot = candidateSlots[0];
        const cmd: GameCommand = {
          type: 'DISPATCH_FLEET',
          originPlanetId: homeworld.id,
          targetSystemId: targetSlot.systemId,
          targetPlanetId: targetSlot.planet.id,
          ships: {
            scout: 0,
            transport: 1,
            fighter: homeworld.garrison.fighter > 1 ? 1 : 0,
            battleship: 0,
          },
          cargo: { ...GAME_CONSTANTS.COLONY_COST },
          mission: 'colonize',
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 2. Build Battleships and Fighters
    if (homeworld.buildings.shipyard >= 1 && homeworld.shipyardQueue.length === 0) {
      if (homeworld.buildings.shipyard >= 3 && homeworld.resources.ore >= SHIP_STATS.battleship.cost.ore) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'battleship',
          count: 1,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      } else if (homeworld.resources.ore >= SHIP_STATS.fighter.cost.ore) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'fighter',
          count: 1,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 3. Upgrade Shipyard to unlock Battleships
    if (!homeworld.buildingQueue && homeworld.buildings.shipyard < 3) {
      const cmd: GameCommand = {
        type: 'UPGRADE_BUILDING',
        planetId: homeworld.id,
        buildingType: 'shipyard',
      };
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 4. Diplomatic Radio Transmissions
    const diplomacyCmds = evaluateBotDiplomacy(engine, this.playerId);
    for (const cmd of diplomacyCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    return executedCommands;
  }
}
