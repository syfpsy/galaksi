import { GAME_CONSTANTS, getBuildingUpgradeCost, getResearchCost } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { BuildingType, GameCommand, ResearchType } from '../engine/types';
import { evaluateBotDiplomacy } from './diplomacy';
import { IBotAgent } from './types';

export class IndustrialistBot implements IBotAgent {
  public archetype = 'industrialist' as const;

  constructor(public playerId: string) {}

  update(engine: GameEngine): GameCommand[] {
    const view = engine.getPlayerView(this.playerId);
    const executedCommands: GameCommand[] = [];

    // 1. Check Planet Building Upgrades
    for (const planet of view.myPlanets) {
      if (planet.buildingQueue) continue; // already building

      // Industrialist upgrade priority:
      // Ore Mine -> Crystal Synth -> Fuel Refinery -> Research Lab / Sensor Array
      const oreLvl = planet.buildings.ore_mine || 0;
      const crystalLvl = planet.buildings.crystal_synth || 0;
      const fuelLvl = planet.buildings.fuel_refinery || 0;
      const labLvl = planet.buildings.research_lab || 0;

      let candidateBuilding: BuildingType = 'ore_mine';

      if (oreLvl > crystalLvl) {
        candidateBuilding = 'crystal_synth';
      } else if (crystalLvl > fuelLvl) {
        candidateBuilding = 'fuel_refinery';
      } else if (labLvl === 0 && oreLvl >= 2) {
        candidateBuilding = 'research_lab';
      } else {
        candidateBuilding = 'ore_mine';
      }

      const cost = getBuildingUpgradeCost(candidateBuilding, planet.buildings[candidateBuilding] || 0);
      if (
        planet.resources.ore >= cost.ore &&
        planet.resources.crystal >= cost.crystal &&
        planet.resources.fuel >= cost.fuel
      ) {
        const cmd: GameCommand = {
          type: 'UPGRADE_BUILDING',
          planetId: planet.id,
          buildingType: candidateBuilding,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          continue;
        }
      }
    }

    // 2. Check Research
    if (!view.myResearchQueue) {
      const researchPriorities: ResearchType[] = ['engines', 'sensors', 'weapons'];
      const homeworld = view.myPlanets.find(p => p.isHomeworld) || view.myPlanets[0];

      if (homeworld && homeworld.buildings.research_lab >= 1) {
        for (const tech of researchPriorities) {
          const currentLvl = view.myResearch[tech] || 0;
          const cost = getResearchCost(tech, currentLvl);

          if (
            homeworld.resources.ore >= cost.ore &&
            homeworld.resources.crystal >= cost.crystal &&
            homeworld.resources.fuel >= cost.fuel
          ) {
            const cmd: GameCommand = { type: 'START_RESEARCH', researchType: tech };
            const receipt = engine.dispatchCommand(this.playerId, cmd);
            if (receipt.success) {
              executedCommands.push(cmd);
              break;
            }
          }
        }
      }
    }

    // 3. Colonization & Expansion: Industrialist builds colonies for massive resource extraction
    const homeworld = view.myPlanets.find(p => p.isHomeworld) || view.myPlanets[0];
    if (homeworld && view.myPlanets.length < GAME_CONSTANTS.MAX_COLONIES_PER_PLAYER) {
      const candidateSlots: { systemId: string; planet: { id: string; name: string } }[] = [];
      const homeSysView = view.discoveredSystems[homeworld.systemId];
      if (homeSysView) {
        for (const p of homeSysView.visiblePlanets) {
          if (p.ownerId === null) {
            candidateSlots.push({ systemId: homeworld.systemId, planet: p });
          }
        }
      }
      for (const s of Object.values(view.discoveredSystems)) {
        if (s.system.id === homeworld.systemId || s.hasRelay) continue;
        if (s.intelLevel === 'unexplored') continue;
        for (const p of s.visiblePlanets) {
          if (p.ownerId === null) {
            candidateSlots.push({ systemId: s.system.id, planet: p });
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
            fighter: homeworld.garrison.fighter > 0 ? 1 : 0,
            battleship: 0,
          },
          cargo: { ...GAME_CONSTANTS.COLONY_COST },
          mission: 'colonize',
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      } else if (
        homeworld.garrison.transport === 0 &&
        homeworld.buildings.shipyard >= 1 &&
        homeworld.shipyardQueue.length === 0 &&
        homeworld.resources.ore >= 380 &&
        homeworld.resources.crystal >= 160
      ) {
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

    // 4. Build Transports when resources overflow
    for (const planet of view.myPlanets) {
      if (planet.buildings.shipyard >= 1 && planet.shipyardQueue.length === 0) {
        if (planet.resources.ore > 1000 && planet.resources.crystal > 500 && planet.garrison.transport < 3) {
          const cmd: GameCommand = {
            type: 'BUILD_SHIPS',
            planetId: planet.id,
            shipType: 'transport',
            count: 1,
          };
          const receipt = engine.dispatchCommand(this.playerId, cmd);
          if (receipt.success) executedCommands.push(cmd);
        }
      }
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
