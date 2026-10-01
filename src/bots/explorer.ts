import { GAME_CONSTANTS, getBuildingUpgradeCost } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';
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
          doctrine: 'hit_and_run',
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 2. Colonization attempt if we have transport and colony materials
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
      view.myPlanets.length < GAME_CONSTANTS.MAX_COLONIES_PER_PLAYER &&
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
        doctrine: 'balanced',
      };
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // Specialization for colonies: tech_haven for fast science breakthroughs
    for (const p of view.myPlanets) {
      if (!p.isHomeworld && (!p.specialization || p.specialization === 'balanced')) {
        const specCmd: GameCommand = {
          type: 'SET_PLANET_SPECIALIZATION',
          planetId: p.id,
          specialization: 'tech_haven',
        };
        const receipt = engine.dispatchCommand(this.playerId, specCmd);
        if (receipt.success) executedCommands.push(specCmd);
      }
    }

    // 3. Build Scouts and Transports in shipyard
    if (homeworld.buildings.shipyard >= 1 && homeworld.shipyardQueue.length === 0) {
      const needsTransport =
        view.myPlanets.length < GAME_CONSTANTS.MAX_COLONIES_PER_PLAYER &&
        homeworld.garrison.transport === 0;

      if (needsTransport && homeworld.resources.ore >= 380 && homeworld.resources.crystal >= 160) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'transport',
          count: 1,
        };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      } else if (homeworld.garrison.scout < 2 && homeworld.resources.ore >= 200) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'scout',
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

    // 6. Starbase & Sensor Relay Infrastructure
    evaluateBotStarbases(engine, this.playerId, this.archetype, executedCommands);

    // 7. Galactic Senate Participation
    evaluateBotSenate(engine, this.playerId, this.archetype, executedCommands);

    // 8. Megastructures & Subspace Gateway Network
    const megaCmds = evaluateBotMegastructures(engine, this.playerId, this.archetype);
    for (const cmd of megaCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 9. Imperial Council & Faction Agendas (Phase 14)
    evaluateBotCouncil(engine, this.playerId, this.archetype, executedCommands);

    // 10. Modular Ship Design & Fleet Refit (Phase 15)
    evaluateBotShipDesign(engine, this.playerId, this.archetype, executedCommands);

    // 11. Galactic Crisis & GDF Response (Phase 16)
    evaluateBotCrisisResponse(engine, this.playerId, this.archetype, executedCommands);

    // 12. Empire Traditions & Ascension Perks (Phase 17)
    evaluateBotTraditions(engine, this.playerId, this.archetype, executedCommands);

    // 13. Archaeology Sites, Relic Triumphs & Minor Artifacts (Phase 18)
    evaluateBotArchaeology(engine, this.playerId, this.archetype, executedCommands);

    // 14. Planetary Terraforming, Blocker Clearance & Ecological Decisions (Phase 19)
    evaluateBotTerraforming(engine, this.playerId, this.archetype, executedCommands);

    // 15. Galactic Trade Networks, Trade Policies & Fleet Patrols (Phase 20)
    evaluateBotTrade(engine, this.playerId, this.archetype, executedCommands);

    // 16. Casus Belli, Wars, War Exhaustion & Subject Management (Phase 21)
    evaluateBotWarfare(engine, this.playerId, this.archetype, executedCommands);

    // 17. Galactic Federations, Federal Fleets & Centralization Laws (Phase 22)
    evaluateBotFederations(engine, this.playerId, this.archetype, executedCommands);

    return executedCommands;
  }
}
