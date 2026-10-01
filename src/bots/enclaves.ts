/**
 * CANLI GALAKSİ - Autonomous Bot AI for Galactic Enclaves, Caravaneers & Shroud Factions (Phase 31)
 */

import { GameEngine } from '../engine/engine';
import { GameCommand, EnclaveServiceId, EnclaveType } from '../engine/types';
import {
  canInteractWithEnclave,
  ENCLAVE_SERVICES,
} from '../engine/enclaves';

export function evaluateBotEnclaves(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  // Total empire resources
  const totalOre = playerPlanets.reduce((sum, p) => sum + p.resources.ore, 0);
  const totalCrystal = playerPlanets.reduce((sum, p) => sum + p.resources.crystal, 0);
  const totalFuel = playerPlanets.reduce((sum, p) => sum + p.resources.fuel, 0);

  // 1. Enclave Interactions
  if (engine.state.enclaves) {
    const enclaves = Object.values(engine.state.enclaves);

    for (const station of enclaves) {
      // Pick preferred services based on enclave type and bot archetype
      let preferredServices: EnclaveServiceId[] = [];

      switch (station.type) {
        case 'curator_order':
          if (archetype === 'explorer') {
            preferredServices = ['hire_curator_researcher', 'purchase_ancient_survey'];
          } else if (archetype === 'admiral') {
            preferredServices = ['titan_combat_insights', 'hire_curator_researcher'];
          } else {
            preferredServices = ['hire_curator_researcher'];
          }
          break;

        case 'artisan_troupe':
          if (archetype === 'industrialist' || archetype === 'guardian') {
            preferredServices = ['sponsor_grand_festival', 'acquire_ministry_of_culture'];
          } else {
            preferredServices = ['commission_art_monument'];
          }
          break;

        case 'trader_enclave':
          if (archetype === 'raider' || archetype === 'admiral') {
            preferredServices = ['hire_mercenary_corps', 'bulk_mineral_contract'];
          } else if (archetype === 'industrialist') {
            preferredServices = ['bulk_mineral_contract', 'rare_crystal_monopoly'];
          } else {
            preferredServices = ['bulk_mineral_contract'];
          }
          break;

        case 'shroud_coven':
          if (!player.shroudBoon) {
            if (archetype === 'raider' || archetype === 'admiral') {
              preferredServices = ['shroud_patron_covenant', 'commune_with_shroud'];
            } else {
              preferredServices = ['psionic_precognition', 'commune_with_shroud'];
            }
          }
          break;
      }

      for (const serviceId of preferredServices) {
        const sDef = ENCLAVE_SERVICES[serviceId];
        if (!sDef) continue;

        // Bot prudence: keep reserve buffer of resources
        if (
          totalOre >= sDef.cost.ore + 200 &&
          totalCrystal >= sDef.cost.crystal + 150 &&
          totalFuel >= sDef.cost.fuel + 100
        ) {
          const check = canInteractWithEnclave(engine.state, playerId, station.id, serviceId);
          if (check.ok) {
            const cmd: GameCommand = {
              type: 'INTERACT_ENCLAVE',
              enclaveId: station.id,
              serviceId,
            };
            const receipt = engine.dispatchCommand(playerId, cmd);
            if (receipt.success) {
              executedCommands.push(cmd);
              break; // One contract per cycle is sufficient
            }
          }
        }
      }
    }
  }

  // 2. Caravaneer Fleet Encounters & Gambling
  if (engine.state.caravaneers && engine.state.caravaneers.length > 0) {
    const playerSystemIds = new Set(playerPlanets.map((p) => p.systemId));

    for (const caravan of engine.state.caravaneers) {
      // Check if caravan is in or near bot's territory
      const isLocal = playerSystemIds.has(caravan.currentSystemId);
      if (!isLocal) continue;

      // Raiders and industrialists enjoy slot machine gambling if flush with ore
      if ((archetype === 'raider' || archetype === 'industrialist') && totalOre > 1200) {
        if (Math.random() < 0.4) {
          const betAmount = 100;
          const cmd: GameCommand = {
            type: 'GAMBLE_CARAVAN_SLOTS',
            caravanId: caravan.id,
            betAmount,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
          }
        }
      }

      // Explorers and wealthy empires buy mystery reliquaries
      if (archetype === 'explorer' && totalOre > 800 && totalCrystal > 500) {
        if (Math.random() < 0.3) {
          const cmd: GameCommand = {
            type: 'BUY_CARAVAN_RELIQUARY',
            caravanId: caravan.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
          }
        }
      }
    }
  }
}
