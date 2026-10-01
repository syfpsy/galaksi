import { GAME_CONSTANTS, getBuildingUpgradeCost, getResearchCost } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { BuildingType, GameCommand, ResearchType } from '../engine/types';
import { evaluateBotDiplomacy } from './diplomacy';
import { evaluateBotStarbases } from './starbases';
import { evaluateBotSenate } from './senate';
import { evaluateBotMegastructures } from './megastructures';
import { evaluateBotCouncil } from './council';
import { evaluateBotShipDesign } from './shipDesign';
import { evaluateBotCrisisResponse } from './crisis';
import { evaluateBotTraditions } from './traditions';
import { evaluateBotArchaeology } from './archaeology';
import { evaluateBotTerraforming } from './terraforming';
import { evaluateBotTrade } from './trade';
import { evaluateBotWarfare } from './wars';
import { evaluateBotFederations } from './federations';
import { evaluateBotEspionage } from './espionage';
import { evaluateBotMegacorp } from './megacorp';
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
          doctrine: 'fortress',
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

    // Specialization for colonies: mining_hub (+20% mineral extraction)
    for (const p of view.myPlanets) {
      if (!p.isHomeworld && (!p.specialization || p.specialization === 'balanced')) {
        const specCmd: GameCommand = {
          type: 'SET_PLANET_SPECIALIZATION',
          planetId: p.id,
          specialization: 'mining_hub',
        };
        const receipt = engine.dispatchCommand(this.playerId, specCmd);
        if (receipt.success) executedCommands.push(specCmd);
      }
    }

    // Defenses: Industrialist installs missile batteries on rich resource worlds
    for (const p of view.myPlanets) {
      if (p.buildings.shipyard >= 1 && (p.defenseQueue?.length ?? 0) === 0) {
        const totalBatteries = p.defenses?.missile_battery ?? 0;
        if (totalBatteries < 2 && p.resources.ore >= 300 && p.resources.crystal >= 100) {
          const defCmd: GameCommand = {
            type: 'BUILD_DEFENSES',
            planetId: p.id,
            defenseType: 'missile_battery',
            count: 1,
          };
          const receipt = engine.dispatchCommand(this.playerId, defCmd);
          if (receipt.success) executedCommands.push(defCmd);
        }
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

    // 5. Starbase & Trade Hub Optimization
    evaluateBotStarbases(engine, this.playerId, this.archetype, executedCommands);

    // 6. Galactic Senate Participation
    evaluateBotSenate(engine, this.playerId, this.archetype, executedCommands);

    // 7. Megastructures & Subspace Gateway Network
    const megaCmds = evaluateBotMegastructures(engine, this.playerId, this.archetype);
    for (const cmd of megaCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 8. Imperial Council & Faction Agendas (Phase 14)
    evaluateBotCouncil(engine, this.playerId, this.archetype, executedCommands);

    // 9. Modular Ship Design & Fleet Refit (Phase 15)
    evaluateBotShipDesign(engine, this.playerId, this.archetype, executedCommands);

    // 10. Galactic Crisis & GDF Response (Phase 16)
    evaluateBotCrisisResponse(engine, this.playerId, this.archetype, executedCommands);

    // 11. Empire Traditions & Ascension Perks (Phase 17)
    evaluateBotTraditions(engine, this.playerId, this.archetype, executedCommands);

    // 12. Archaeology Sites, Relic Triumphs & Minor Artifacts (Phase 18)
    evaluateBotArchaeology(engine, this.playerId, this.archetype, executedCommands);

    // 13. Planetary Terraforming, Blocker Clearance & Ecological Decisions (Phase 19)
    evaluateBotTerraforming(engine, this.playerId, this.archetype, executedCommands);

    // 14. Galactic Trade Networks, Trade Policies & Fleet Patrols (Phase 20)
    evaluateBotTrade(engine, this.playerId, this.archetype, executedCommands);

    // 15. Casus Belli, Wars, War Exhaustion & Subject Management (Phase 21)
    evaluateBotWarfare(engine, this.playerId, this.archetype, executedCommands);

    // 16. Galactic Federations, Federal Fleets & Centralization Laws (Phase 22)
    evaluateBotFederations(engine, this.playerId, this.archetype, executedCommands);

    // 17. Galactic Espionage, Covert Operations & Counter-Intelligence (Phase 23)
    evaluateBotEspionage(engine, this.playerId, this.archetype, executedCommands);

    // 18. Megacorporations, Branch Offices & Commodity Futures (Phase 24)
    evaluateBotMegacorp(engine, this.playerId, this.archetype, executedCommands);

    return executedCommands;
  }
}
