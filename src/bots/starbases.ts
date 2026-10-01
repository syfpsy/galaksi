import { GameEngine } from '../engine/engine';
import { GameCommand, StarbaseModuleType } from '../engine/types';
import {
  STARBASE_TIER_CONFIG,
  STARBASE_MODULE_CONFIG,
  getNextStarbaseTier,
} from '../engine/starbases';

/**
 * Autonomous Starbase management for Bot AI
 */
export function evaluateBotStarbases(
  engine: GameEngine,
  playerId: string,
  archetype: 'guardian' | 'industrialist' | 'explorer' | 'admiral' | 'raider',
  executedCommands: GameCommand[]
): void {
  const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (myPlanets.length === 0) return;

  const starbases = engine.state.starbases || {};

  for (const planet of myPlanets) {
    const sysId = planet.systemId;
    const sb = starbases[sysId];

    // 1. Build Outpost in colonized systems without a starbase
    if (!sb) {
      const outpostCost = STARBASE_TIER_CONFIG.outpost.cost;
      if (
        planet.resources.ore >= outpostCost.ore + 150 &&
        planet.resources.crystal >= outpostCost.crystal + 100 &&
        planet.resources.fuel >= outpostCost.fuel + 50
      ) {
        const buildCmd: GameCommand = {
          type: 'BUILD_STARBASE',
          systemId: sysId,
          planetId: planet.id,
        };
        const receipt = engine.dispatchCommand(playerId, buildCmd);
        if (receipt.success) {
          executedCommands.push(buildCmd);
          return;
        }
      }
      continue;
    }

    // Only manage our own starbase
    if (sb.ownerId !== playerId) continue;
    if (sb.upgradeQueue || sb.moduleQueue) continue;

    const maxModules = STARBASE_TIER_CONFIG[sb.tier].maxModules;

    // 2. Install Modules if open slots exist
    if (sb.modules.length < maxModules) {
      let targetModule: StarbaseModuleType;
      switch (archetype) {
        case 'guardian':
          targetModule = 'defense_platform';
          break;
        case 'industrialist':
          targetModule = 'trade_hub';
          break;
        case 'explorer':
          targetModule = 'sensor_relay';
          break;
        case 'admiral':
          targetModule = sb.modules.includes('defense_platform') ? 'shipyard_bay' : 'defense_platform';
          break;
        case 'raider':
          targetModule = sb.modules.includes('shipyard_bay') ? 'defense_platform' : 'shipyard_bay';
          break;
      }

      const modCost = STARBASE_MODULE_CONFIG[targetModule].cost;
      if (
        planet.resources.ore >= modCost.ore + 100 &&
        planet.resources.crystal >= modCost.crystal + 50 &&
        planet.resources.fuel >= modCost.fuel + 20
      ) {
        const modCmd: GameCommand = {
          type: 'INSTALL_STARBASE_MODULE',
          systemId: sysId,
          planetId: planet.id,
          moduleType: targetModule,
        };
        const receipt = engine.dispatchCommand(playerId, modCmd);
        if (receipt.success) {
          executedCommands.push(modCmd);
          return;
        }
      }
    }

    // 3. Upgrade Starbase tier if slots are full and economy has ample surplus
    const nextTier = getNextStarbaseTier(sb.tier);
    if (nextTier) {
      const upgradeCost = STARBASE_TIER_CONFIG[nextTier].cost;
      const surplusFactor = archetype === 'guardian' ? 1.15 : 1.35;
      if (
        planet.resources.ore >= upgradeCost.ore * surplusFactor &&
        planet.resources.crystal >= upgradeCost.crystal * surplusFactor &&
        planet.resources.fuel >= upgradeCost.fuel * surplusFactor
      ) {
        const upCmd: GameCommand = {
          type: 'UPGRADE_STARBASE',
          systemId: sysId,
          planetId: planet.id,
        };
        const receipt = engine.dispatchCommand(playerId, upCmd);
        if (receipt.success) {
          executedCommands.push(upCmd);
          return;
        }
      }
    }
  }
}
