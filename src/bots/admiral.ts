import { SHIP_STATS } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { checkInterceptionFeasibility } from '../engine/flight';
import { FleetDoctrine, GameCommand, ShipType } from '../engine/types';
import { evaluateBotDiplomacy } from './diplomacy';
import { evaluateBotStarbases } from './starbases';
import { evaluateBotSenate } from './senate';
import { evaluateBotMegastructures } from './megastructures';
import { evaluateBotCouncil } from './council';
import { evaluateBotShipDesign } from './shipDesign';
import { evaluateBotCrisisResponse } from './crisis';
import { evaluateBotTraditions } from './traditions';
import { evaluateBotArchaeology } from './archaeology';
import { IBotAgent } from './types';

/**
 * Admiral Bot (GDD Bölüm 11)
 * Profil: Durumsal Optimizasyon.
 * Rakibe göre strateji değişimi, karşı filo kompozisyonu,
 * rota üzerinde önleme, enkaz toplama ve röle fırsatçılığı.
 */
export class AdmiralBot implements IBotAgent {
  public archetype = 'admiral' as const;

  constructor(public playerId: string) {}

  update(engine: GameEngine): GameCommand[] {
    const view = engine.getPlayerView(this.playerId);
    const executedCommands: GameCommand[] = [];
    const homeworld = view.myPlanets.find((p) => p.isHomeworld) || view.myPlanets[0];
    if (!homeworld) return executedCommands;

    const player = engine.state.players[this.playerId];
    const engineLevel = player?.research.engines || 0;

    // 1. Opportunistic Intercept: Check if any visible enemy fleet can be intercepted
    const visibleFleets = view.visibleFleets.filter(
      (f) => f.isHostile && (f.status === 'in_transit' || f.status === 'returning')
    );

    if (visibleFleets.length > 0 && homeworld.garrison.fighter >= 2) {
      for (const enemyMasked of visibleFleets) {
        const enemyFleet = engine.state.fleets[enemyMasked.id];
        if (!enemyFleet) continue;

        const interceptCheck = checkInterceptionFeasibility(
          homeworld.systemId,
          enemyFleet,
          {
            scout: 0,
            transport: 0,
            fighter: homeworld.garrison.fighter,
            battleship: homeworld.garrison.battleship,
          },
          engine.state.map.lanes,
          engineLevel,
          engine.state.timeMs
        );

        if (interceptCheck.canIntercept && homeworld.resources.fuel >= 60) {
          const myAdmiral = Object.values(engine.state.admirals || {}).find(
            (a) => a.ownerId === this.playerId && !a.assignedFleetId
          );

          // Counter-doctrine analysis against opponent fleet
          let counterDoctrine: FleetDoctrine = 'spearhead';
          if (enemyFleet.doctrine === 'spearhead' || (enemyFleet.ships.battleship || 0) >= 2) {
            counterDoctrine = 'fortress'; // Absorb their +15% heavy firepower
          } else if (enemyFleet.doctrine === 'fortress') {
            counterDoctrine = 'spearhead'; // Crack fortress defense with +15% firepower
          } else if (enemyFleet.ships.scout > enemyFleet.ships.fighter) {
            counterDoctrine = 'hit_and_run';
          }

          const cmd: GameCommand = {
            type: 'DISPATCH_FLEET',
            originPlanetId: homeworld.id,
            targetSystemId: enemyFleet.targetSystemId,
            targetFleetId: enemyFleet.id,
            ships: {
              scout: 0,
              transport: 0,
              fighter: homeworld.garrison.fighter,
              battleship: homeworld.garrison.battleship,
            },
            mission: 'intercept',
            doctrine: counterDoctrine,
            admiralId: myAdmiral?.id,
          };
          const res = engine.dispatchCommand(this.playerId, cmd);
          if (res.success) {
            executedCommands.push(cmd);
            return executedCommands; // Heavy strategic decision for this turn
          }
        }
      }
    }

    // 2. Salvage Debris Fields: If any known system has substantial debris
    const systemsWithDebris = Object.values(view.discoveredSystems).filter((entry) => {
      const s = entry.system;
      return s && s.hasDebris && (s.hasDebris.ore >= 100 || s.hasDebris.crystal >= 100);
    });

    if (systemsWithDebris.length > 0 && homeworld.garrison.transport >= 1 && homeworld.resources.fuel >= 60) {
      const targetSys = systemsWithDebris[0].system;
      const cmd: GameCommand = {
        type: 'DISPATCH_FLEET',
        originPlanetId: homeworld.id,
        targetSystemId: targetSys.id,
        ships: {
          scout: 0,
          transport: Math.min(homeworld.garrison.transport, 3),
          fighter: Math.min(homeworld.garrison.fighter, 1),
          battleship: 0,
        },
        mission: 'transport',
        doctrine: 'fortress',
      };
      const res = engine.dispatchCommand(this.playerId, cmd);
      if (res.success) {
        executedCommands.push(cmd);
      }
    }

    // 3. Central Nexus Relay Contest
    const relay = view.relayContest;
    if (relay.controllerId !== this.playerId && homeworld.garrison.battleship >= 1 && homeworld.garrison.fighter >= 3) {
      if (homeworld.resources.fuel >= 120) {
        const myAdmiral = Object.values(engine.state.admirals || {}).find(
          (a) => a.ownerId === this.playerId && !a.assignedFleetId
        );
        const cmd: GameCommand = {
          type: 'DISPATCH_FLEET',
          originPlanetId: homeworld.id,
          targetSystemId: relay.systemId,
          ships: {
            scout: 1,
            transport: 0,
            fighter: 3,
            battleship: 1,
          },
          mission: 'support',
          doctrine: 'fortress',
          admiralId: myAdmiral?.id,
        };
        const res = engine.dispatchCommand(this.playerId, cmd);
        if (res.success) {
          executedCommands.push(cmd);
          return executedCommands;
        }
      }
    }

    // Specialization for colonies: military_bastion or forge_world
    for (const p of view.myPlanets) {
      if (!p.isHomeworld && (!p.specialization || p.specialization === 'balanced')) {
        const specCmd: GameCommand = {
          type: 'SET_PLANET_SPECIALIZATION',
          planetId: p.id,
          specialization: 'military_bastion',
        };
        const receipt = engine.dispatchCommand(this.playerId, specCmd);
        if (receipt.success) executedCommands.push(specCmd);
      }
    }

    // 4. Research Management (Alternate between Weapons and Engines)
    if (!player?.researchQueue) {
      const wepLevel = player?.research.weapons || 0;
      const engLevel = player?.research.engines || 0;
      const targetTech = wepLevel <= engLevel ? 'weapons' : 'engines';

      const resCmd: GameCommand = {
        type: 'START_RESEARCH',
        researchType: targetTech,
      };
      const resReceipt = engine.dispatchCommand(this.playerId, resCmd);
      if (resReceipt.success) executedCommands.push(resCmd);
    }

    // 5. Fleet Construction (Balanced Ratio: 1 Battleship : 3 Fighters : 1 Transport)
    if (homeworld.buildings.shipyard >= 1 && homeworld.shipyardQueue.length === 0) {
      const hasEnoughBattleships = homeworld.garrison.battleship >= 2;
      const hasEnoughFighters = homeworld.garrison.fighter >= 4;

      if (!hasEnoughBattleships && homeworld.buildings.shipyard >= 3 && homeworld.resources.ore >= SHIP_STATS.battleship.cost.ore) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'battleship',
          count: 1,
        };
        const res = engine.dispatchCommand(this.playerId, cmd);
        if (res.success) executedCommands.push(cmd);
      } else if (!hasEnoughFighters && homeworld.resources.ore >= SHIP_STATS.fighter.cost.ore) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'fighter',
          count: 2,
        };
        const res = engine.dispatchCommand(this.playerId, cmd);
        if (res.success) executedCommands.push(cmd);
      } else if (homeworld.garrison.transport < 2 && homeworld.resources.ore >= SHIP_STATS.transport.cost.ore) {
        const cmd: GameCommand = {
          type: 'BUILD_SHIPS',
          planetId: homeworld.id,
          shipType: 'transport',
          count: 1,
        };
        const res = engine.dispatchCommand(this.playerId, cmd);
        if (res.success) executedCommands.push(cmd);
      }
    }

    // 6. Infrastructure Upgrades
    if (!homeworld.buildingQueue) {
      if (homeworld.buildings.ore_mine < 5) {
        const cmd: GameCommand = { type: 'UPGRADE_BUILDING', planetId: homeworld.id, buildingType: 'ore_mine' };
        if (engine.dispatchCommand(this.playerId, cmd).success) executedCommands.push(cmd);
      } else if (homeworld.buildings.crystal_synth < 4) {
        const cmd: GameCommand = { type: 'UPGRADE_BUILDING', planetId: homeworld.id, buildingType: 'crystal_synth' };
        if (engine.dispatchCommand(this.playerId, cmd).success) executedCommands.push(cmd);
      } else if (homeworld.buildings.shipyard < 3) {
        const cmd: GameCommand = { type: 'UPGRADE_BUILDING', planetId: homeworld.id, buildingType: 'shipyard' };
        if (engine.dispatchCommand(this.playerId, cmd).success) executedCommands.push(cmd);
      } else if (homeworld.buildings.fuel_refinery < 3) {
        const cmd: GameCommand = { type: 'UPGRADE_BUILDING', planetId: homeworld.id, buildingType: 'fuel_refinery' };
        if (engine.dispatchCommand(this.playerId, cmd).success) executedCommands.push(cmd);
      }
    }

    // 7. Diplomatic Radio Transmissions
    const diplomacyCmds = evaluateBotDiplomacy(engine, this.playerId);
    for (const cmd of diplomacyCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 8. Starbase Naval Bastion & Shipyard Bay
    evaluateBotStarbases(engine, this.playerId, this.archetype, executedCommands);

    // 9. Galactic Senate Participation
    evaluateBotSenate(engine, this.playerId, this.archetype, executedCommands);

    // 10. Megastructures & Subspace Gateway Network
    const megaCmds = evaluateBotMegastructures(engine, this.playerId, this.archetype);
    for (const cmd of megaCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 11. Imperial Council & Faction Agendas (Phase 14)
    evaluateBotCouncil(engine, this.playerId, this.archetype, executedCommands);

    // 12. Modular Ship Design & Fleet Refit (Phase 15)
    evaluateBotShipDesign(engine, this.playerId, this.archetype, executedCommands);

    // 13. Galactic Crisis & GDF Response (Phase 16)
    evaluateBotCrisisResponse(engine, this.playerId, this.archetype, executedCommands);

    // 14. Empire Traditions & Ascension Perks (Phase 17)
    evaluateBotTraditions(engine, this.playerId, this.archetype, executedCommands);

    // 15. Archaeology Sites, Relic Triumphs & Minor Artifacts (Phase 18)
    evaluateBotArchaeology(engine, this.playerId, this.archetype, executedCommands);

    return executedCommands;
  }
}
