import { getResearchCost, SHIP_STATS } from '../engine/constants';
import { GameEngine } from '../engine/engine';
import { GameCommand, ShipType } from '../engine/types';
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
import { evaluateBotColossus } from './colossus';
import { evaluateBotSynthetics } from './synthetics';
import { evaluateBotParagons } from './paragons';
import { evaluateBotHyperRelays } from './hyperRelays';
import { evaluateBotShadowOps } from './shadowOps';
import { evaluateBotGroundWarfare } from './groundWarfare';
import { evaluateBotEnclaves } from './enclaves';
import { evaluateBotDistricts } from './districts';
import { IBotAgent } from './types';

export class RaiderBot implements IBotAgent {
  public archetype = 'raider' as const;

  constructor(public playerId: string) {}

  update(engine: GameEngine): GameCommand[] {
    const view = engine.getPlayerView(this.playerId);
    const executedCommands: GameCommand[] = [];
    const homeworld = view.myPlanets.find(p => p.isHomeworld) || view.myPlanets[0];
    if (!homeworld) return executedCommands;

    // 1. Check for possible fleet interceptions in sensor range
    const hostileFleets = view.visibleFleets.filter(f => f.isHostile && f.status === 'in_transit');
    if (hostileFleets.length > 0 && homeworld.garrison.fighter >= 3 && homeworld.resources.fuel >= 60) {
      const targetFleet = hostileFleets[0];
      const cmd: GameCommand = {
        type: 'DISPATCH_FLEET',
        originPlanetId: homeworld.id,
        targetSystemId: targetFleet.targetSystemId,
        targetFleetId: targetFleet.id,
        ships: { scout: 1, transport: 0, fighter: Math.min(homeworld.garrison.fighter, 4), battleship: 0 },
        mission: 'intercept',
        doctrine: 'spearhead',
      };
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return executedCommands;
      }
    }

    // 2. Check for raid targets (mapped enemy planets)
    const enemyPlanets = Object.values(view.discoveredSystems).flatMap(s =>
      s.visiblePlanets.filter(p => p.ownerId !== null && p.ownerId !== this.playerId).map(p => ({
        systemId: s.system.id,
        planet: p,
      }))
    );

    const readyAttackers = homeworld.garrison.fighter >= 3 || homeworld.garrison.battleship >= 1;
    if (readyAttackers && enemyPlanets.length > 0 && homeworld.resources.fuel >= 80) {
      const target = enemyPlanets[0];
      const shipsToSend = {
        scout: homeworld.garrison.scout > 0 ? 1 : 0,
        transport: homeworld.garrison.transport > 0 ? 1 : 0, // carry loot!
        fighter: Math.min(homeworld.garrison.fighter, 5),
        battleship: homeworld.garrison.battleship,
      };

      const cmd: GameCommand = {
        type: 'DISPATCH_FLEET',
        originPlanetId: homeworld.id,
        targetSystemId: target.systemId,
        targetPlanetId: target.planet.id,
        ships: shipsToSend,
        mission: 'attack',
        doctrine: shipsToSend.battleship > 0 ? 'spearhead' : 'hit_and_run',
      };
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // Specialization for colonies: military_bastion for combat fortress
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

    // 3. Build Fighters continuously
    if (homeworld.buildings.shipyard >= 1 && homeworld.shipyardQueue.length === 0) {
      const fighterCost = SHIP_STATS.fighter.cost;
      if (
        homeworld.resources.ore >= fighterCost.ore &&
        homeworld.resources.crystal >= fighterCost.crystal &&
        homeworld.resources.fuel >= fighterCost.fuel
      ) {
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

    // 4. Research Weapons
    if (!view.myResearchQueue && homeworld.buildings.research_lab >= 1) {
      const currentWpn = view.myResearch.weapons || 0;
      const cost = getResearchCost('weapons', currentWpn);
      if (homeworld.resources.ore >= cost.ore && homeworld.resources.crystal >= cost.crystal) {
        const cmd: GameCommand = { type: 'START_RESEARCH', researchType: 'weapons' };
        const receipt = engine.dispatchCommand(this.playerId, cmd);
        if (receipt.success) executedCommands.push(cmd);
      }
    }

    // 5. Diplomatic Radio Transmissions
    const diplomacyCmds = evaluateBotDiplomacy(engine, this.playerId);
    for (const cmd of diplomacyCmds) {
      const receipt = engine.dispatchCommand(this.playerId, cmd);
      if (receipt.success) executedCommands.push(cmd);
    }

    // 6. Raider Shipyard Bay & Bastion Management
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

    // 18. Galactic Espionage, Covert Operations & Counter-Intelligence (Phase 23)
    evaluateBotEspionage(engine, this.playerId, this.archetype, executedCommands);

    // 19. Megacorporations, Branch Offices & Commodity Futures (Phase 24)
    evaluateBotMegacorp(engine, this.playerId, this.archetype, executedCommands);

    // 20. Colossus Superweapons & World Killers (Phase 25)
    evaluateBotColossus(engine, this.playerId, this.archetype, executedCommands);

    // 21. Synthetic Dawn, Cybernetic Ascension & Machine Consciousness (Phase 26)
    evaluateBotSynthetics(engine, this.playerId, this.archetype, executedCommands);

    // 22. Paragon Leaders, Renowned Heroes & Council Destiny (Phase 27)
    evaluateBotParagons(engine, this.playerId, this.archetype, executedCommands);

    // 23. Hyper Relays, Transit Highway Networks & Subspace Logistics (Phase 28)
    evaluateBotHyperRelays(engine, this.playerId, this.archetype, executedCommands);

    // 24. Galactic Intelligence Directorate, False Flag Operations & Shadow Coups (Phase 29)
    evaluateBotShadowOps(engine, this.playerId, this.archetype, executedCommands);

    // 25. Planetary Invasions, Ground Armies & Orbital Bombardment (Phase 30)
    evaluateBotGroundWarfare(engine, this.playerId, this.archetype, executedCommands);

    // 26. Galactic Enclaves, Caravaneers & Shroud Factions (Phase 31)
    evaluateBotEnclaves(engine, this.playerId, this.archetype, executedCommands);

    // 27. Planetary Districts & Pops (Phase 32)
    evaluateBotDistricts(engine, this.playerId, this.archetype, executedCommands);

    return executedCommands;
  }
}
