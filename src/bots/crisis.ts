import { GameEngine } from '../engine/engine';
import { GameCommand, ShipType } from '../engine/types';
import { CRISIS_CONFIGS } from '../engine/crisis';

/**
 * Autonomous Galactic Crisis decision-making for Bot AI
 */
export function evaluateBotCrisisResponse(
  engine: GameEngine,
  playerId: string,
  archetype: 'guardian' | 'industrialist' | 'explorer' | 'admiral' | 'raider',
  executedCommands: GameCommand[]
): void {
  const view = engine.getPlayerView(playerId);
  const crisis = view.myCrisis;
  if (!crisis || crisis.stage === 'dormant' || crisis.stage === 'defeated') return;

  const myPlanets = view.myPlanets;
  if (myPlanets.length === 0) return;

  // 1. Planetary Infestation Clearance (Purification)
  if (crisis.infestedPlanetIds && crisis.infestedPlanetIds.length > 0) {
    for (const planet of myPlanets) {
      if (crisis.infestedPlanetIds.includes(planet.id)) {
        const cost = CRISIS_CONFIGS.PURIFICATION_COST;
        if (
          planet.resources.ore >= cost.ore &&
          planet.resources.crystal >= cost.crystal &&
          planet.resources.fuel >= cost.fuel
        ) {
          const cmd: GameCommand = {
            type: 'PURIFY_INFESTED_PLANET',
            planetId: planet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }
  }

  // 2. Donate to GDF (Guardians, Admirals, and wealthy Industrialists)
  if (archetype === 'guardian' || archetype === 'admiral' || archetype === 'industrialist') {
    const homeworld = myPlanets.find((p) => p.isHomeworld) || myPlanets[0];
    if (homeworld && homeworld.garrison.fighter >= 4) {
      const donateFighters = archetype === 'guardian' ? 2 : 1;
      const cmd: GameCommand = {
        type: 'DONATE_TO_GDF',
        planetId: homeworld.id,
        ships: {
          scout: 0,
          transport: 0,
          fighter: donateFighters,
          battleship: 0,
        },
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 3. Galactic Custodian Fleet Deployment (If bot is the Custodian)
  const isCustodian = view.senate?.custodianPlayerId === playerId;
  if (isCustodian && crisis.gdfFleetUnits) {
    const totalGdfShips =
      crisis.gdfFleetUnits.scout +
      crisis.gdfFleetUnits.fighter +
      crisis.gdfFleetUnits.battleship;

    if (totalGdfShips >= 3) {
      // Find an active Void Anchor to assault
      const targetAnchor = crisis.voidAnchors.find((a) => !a.destroyed);
      const targetSys = targetAnchor ? targetAnchor.systemId : crisis.epicenterSystemId;

      const cmd: GameCommand = {
        type: 'DISPATCH_GDF_FLEET',
        targetSystemId: targetSys,
        ships: {
          scout: crisis.gdfFleetUnits.scout,
          transport: 0,
          fighter: crisis.gdfFleetUnits.fighter,
          battleship: crisis.gdfFleetUnits.battleship,
        },
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 4. Assault Void Anchor if a bot fleet is already in the anchor system
  for (const fleet of view.myFleets) {
    if (fleet.status === 'orbiting') {
      const activeAnchorInSys = crisis.voidAnchors.find(
        (a) => !a.destroyed && a.systemId === fleet.originSystemId
      );
      if (activeAnchorInSys) {
        const fleetPower = (fleet.ships.fighter || 0) * 50 + (fleet.ships.battleship || 0) * 200;
        if (fleetPower >= 300) {
          const cmd: GameCommand = {
            type: 'ASSAULT_VOID_ANCHOR',
            anchorId: activeAnchorInSys.id,
            fleetId: fleet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }

      // 5. Final Rift Assault if all anchors are down and in apex stage
      if (crisis.stage === 'apex' && fleet.originSystemId === crisis.epicenterSystemId) {
        const fleetPower = (fleet.ships.fighter || 0) * 50 + (fleet.ships.battleship || 0) * 200;
        if (fleetPower >= 400) {
          const cmd: GameCommand = {
            type: 'ASSAULT_VOID_RIFT',
            fleetId: fleet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }
  }
}
