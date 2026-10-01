import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';
import {
  canAssembleSyntheticPop,
  getOrCreateSyntheticState,
  SYNTHETIC_CONSTANTS,
} from '../engine/synthetics';

/**
 * Autonomous Bot AI for Synthetic Dawn, Cybernetic Ascension & Machine Consciousness (Phase 26)
 */
export function evaluateBotSynthetics(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  const empire = getOrCreateSyntheticState(engine.state, playerId);

  // 1. Manage Machine Uprising Risk & Policy
  const risk = empire.machineUprisingRisk;

  // Crisis suppression or pacification
  if (risk >= 60) {
    if (archetype === 'guardian' || archetype === 'explorer') {
      if (empire.aiPolicy !== 'citizen_rights') {
        const cmd: GameCommand = { type: 'SET_AI_POLICY', policy: 'citizen_rights' };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    } else {
      // Raider, Industrialist, Admiral attempt suppression
      const suppCost = SYNTHETIC_CONSTANTS.SUPPRESSION_COST;
      if (primaryPlanet.resources.crystal >= suppCost.crystal && primaryPlanet.resources.fuel >= suppCost.fuel) {
        const cmd: GameCommand = { type: 'SUPPRESS_SYNTHETIC_UPRISING', planetId: primaryPlanet.id };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      } else if (risk >= 80 && empire.aiPolicy !== 'citizen_rights') {
        // Emergency switch to prevent total rebellion
        const cmd: GameCommand = { type: 'SET_AI_POLICY', policy: 'citizen_rights' };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  } else if (risk < 20) {
    // Normal policy preference
    if ((archetype === 'industrialist' || archetype === 'raider') && empire.ascensionStage !== 'synthetic') {
      if (empire.aiPolicy !== 'servitude') {
        const cmd: GameCommand = { type: 'SET_AI_POLICY', policy: 'servitude' };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }

  // 2. Ascension Progression (Cybernetic -> Synthetic)
  if (empire.ascensionStage === 'none') {
    const cyberCost = SYNTHETIC_CONSTANTS.CYBERNETIC_COST;
    if (
      primaryPlanet.resources.ore >= cyberCost.ore + 200 &&
      primaryPlanet.resources.crystal >= cyberCost.crystal + 200 &&
      primaryPlanet.resources.fuel >= cyberCost.fuel + 200
    ) {
      const cmd: GameCommand = {
        type: 'INITIATE_SYNTHETIC_ASCENSION',
        ascensionType: 'cybernetic',
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  } else if (empire.ascensionStage === 'cybernetic') {
    const synthCost = SYNTHETIC_CONSTANTS.SYNTHETIC_COST;
    if (
      primaryPlanet.resources.ore >= synthCost.ore + 300 &&
      primaryPlanet.resources.crystal >= synthCost.crystal + 300 &&
      primaryPlanet.resources.fuel >= synthCost.fuel + 300
    ) {
      const cmd: GameCommand = {
        type: 'INITIATE_SYNTHETIC_ASCENSION',
        ascensionType: 'synthetic',
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 3. Machine World Conversion (Synthetics only)
  if (empire.ascensionStage === 'synthetic' && playerPlanets.length > 1) {
    const candidate = playerPlanets.find((p) => !p.isHomeworld && p.biome !== 'machine_world');
    const convCost = SYNTHETIC_CONSTANTS.MACHINE_WORLD_CONVERSION_COST;
    if (
      candidate &&
      candidate.resources.ore >= convCost.ore + 200 &&
      candidate.resources.crystal >= convCost.crystal + 200 &&
      candidate.resources.fuel >= convCost.fuel + 200
    ) {
      const cmd: GameCommand = {
        type: 'CONVERT_TO_MACHINE_WORLD',
        planetId: candidate.id,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 4. Pop Assembly on Colonies
  for (const planet of playerPlanets) {
    if (planet.isAssemblyActive) continue;

    const maxPops =
      planet.maxSyntheticPops ||
      (planet.biome === 'machine_world' || planet.hasMachineMatrix
        ? SYNTHETIC_CONSTANTS.MACHINE_WORLD_MAX_SYNTHETICS
        : SYNTHETIC_CONSTANTS.BASE_MAX_SYNTHETICS_PER_PLANET);

    if ((planet.syntheticPops || 0) < maxPops) {
      const check = canAssembleSyntheticPop(engine.state, playerId, planet.id);
      if (check.success) {
        // Ensure healthy surplus before building pop
        const cost = SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST;
        if (
          planet.resources.ore >= cost.ore + 100 &&
          planet.resources.crystal >= cost.crystal + 80 &&
          planet.resources.fuel >= cost.fuel + 50
        ) {
          const cmd: GameCommand = {
            type: 'ASSEMBLE_SYNTHETIC_POP',
            planetId: planet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            break; // One assembly dispatch per bot tick is plenty
          }
        }
      }
    }
  }
}
