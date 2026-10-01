import { GameEngine } from '../engine/engine';
import { GameCommand, PlanetBiome, PlanetaryDecisionId } from '../engine/types';
import {
  canClearBlocker,
  canEnactDecision,
  canStartTerraforming,
  getPlanetEffectiveBiome,
} from '../engine/terraforming';

/**
 * Autonomous AI evaluator for Planetary Terraforming, Blocker Clearance & Planetary Decisions
 */
export function evaluateBotTerraforming(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player) return;

  const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (myPlanets.length === 0) return;

  // 1. Blocker Clearance Evaluation
  for (const planet of myPlanets) {
    if (planet.blockers && planet.blockers.length > 0) {
      // Find blockers not yet clearing
      const uncleared = planet.blockers.filter((b) => !b.clearing);
      if (uncleared.length > 0) {
        // Sort based on archetype priority
        uncleared.sort((a, b) => {
          if (archetype === 'industrialist') {
            const aOre = a.type === 'volcanic_ash_wastes' || a.type === 'glacial_chasm' ? 1 : 0;
            const bOre = b.type === 'volcanic_ash_wastes' || b.type === 'glacial_chasm' ? 1 : 0;
            return bOre - aOre;
          }
          if (archetype === 'explorer') {
            const aSci = a.type === 'radioactive_fallout' ? 1 : 0;
            const bSci = b.type === 'radioactive_fallout' ? 1 : 0;
            return bSci - aSci;
          }
          return 0;
        });

        const targetBlocker = uncleared[0];
        const canClr = canClearBlocker(engine.state, playerId, planet.id, targetBlocker.id);
        if (canClr.canClear) {
          const cmd: GameCommand = {
            type: 'CLEAR_PLANETARY_BLOCKER',
            planetId: planet.id,
            blockerId: targetBlocker.id,
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

  // 2. Planetary Decisions Evaluation
  const decisionPriorities: Record<string, PlanetaryDecisionId[]> = {
    industrialist: ['geothermal_core_drill', 'soil_enrichment', 'strip_mining_initiative', 'climate_domes'],
    explorer: ['ecological_sanctuary', 'climate_domes', 'soil_enrichment'],
    guardian: ['climate_domes', 'planetary_shield_overcharge', 'soil_enrichment'],
    admiral: ['planetary_shield_overcharge', 'strip_mining_initiative', 'climate_domes'],
    raider: ['strip_mining_initiative', 'geothermal_core_drill', 'climate_domes'],
  };

  const priorityList = decisionPriorities[archetype] || decisionPriorities.industrialist;

  for (const planet of myPlanets) {
    for (const decId of priorityList) {
      const isAlreadyActive = planet.activeDecisions?.some((d) => d.id === decId);
      if (!isAlreadyActive) {
        const canEn = canEnactDecision(engine.state, playerId, planet.id, decId);
        if (canEn.canEnact) {
          // Require at least 200 resource buffer so bot doesn't starve construction
          if (
            planet.resources.ore >= (canEn.cost?.ore || 0) + 200 &&
            planet.resources.crystal >= (canEn.cost?.crystal || 0) + 200 &&
            planet.resources.fuel >= (canEn.cost?.fuel || 0) + 200
          ) {
            const cmd: GameCommand = {
              type: 'ENACT_PLANETARY_DECISION',
              planetId: planet.id,
              decisionId: decId,
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

  // 3. Planetary Terraforming Evaluation
  for (const planet of myPlanets) {
    if (planet.terraformingQueue) continue; // Already terraforming

    const sys = engine.state.map.systems[planet.systemId];
    const slot = sys?.slots.find((s) => s.planetId === planet.id || s.slotIndex === planet.slotIndex);
    const currentBiome = getPlanetEffectiveBiome(planet, slot);

    // If current biome is hostile, consider terraforming
    const isHostile = ['volcanic', 'desert', 'ice', 'tomb'].includes(currentBiome);
    const canElevateToGaia = archetype === 'explorer' && currentBiome === 'terran';

    if (isHostile || canElevateToGaia) {
      let targetBiome: PlanetBiome = 'terran';
      if (canElevateToGaia) {
        targetBiome = 'gaia';
      } else if (archetype === 'guardian' && currentBiome === 'ice') {
        targetBiome = 'ocean';
      }

      const canStart = canStartTerraforming(engine.state, playerId, planet.id, targetBiome);
      if (canStart.canStart) {
        // Check if surplus is healthy
        if (
          planet.resources.ore >= (canStart.cost?.ore || 0) + 300 &&
          planet.resources.crystal >= (canStart.cost?.crystal || 0) + 300 &&
          planet.resources.fuel >= (canStart.cost?.fuel || 0) + 300
        ) {
          const cmd: GameCommand = {
            type: 'START_TERRAFORMING',
            planetId: planet.id,
            targetBiome,
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
