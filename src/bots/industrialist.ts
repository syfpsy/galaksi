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

    // 3. Build Transports when resources overflow
    for (const planet of view.myPlanets) {
      if (planet.buildings.shipyard >= 1 && planet.shipyardQueue.length === 0) {
        if (planet.resources.ore > 1200 && planet.resources.crystal > 600) {
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
