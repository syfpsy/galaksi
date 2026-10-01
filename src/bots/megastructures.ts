import { GameEngine } from '../engine/engine';
import { GameCommand, MegastructureType } from '../engine/types';
import {
  canBuildMegastructure,
  GATEWAY_CONFIG,
  MEGASTRUCTURE_CONFIGS,
} from '../engine/megastructures';

/**
 * Evaluates Megastructure and Gateway construction for autonomous bot empires
 */
export function evaluateBotMegastructures(
  engine: GameEngine,
  botPlayerId: string,
  archetype: string
): GameCommand[] {
  const commands: GameCommand[] = [];
  const state = engine.state;
  const player = state.players[botPlayerId];
  if (!player || player.vacationMode) return commands;

  // Find bot homeworld
  const homeworld = Object.values(state.planets).find(
    (p) => p.ownerId === botPlayerId && p.isHomeworld
  ) || Object.values(state.planets).find((p) => p.ownerId === botPlayerId);

  if (!homeworld) return commands;

  // 1. Check existing Megastructure upgrade
  if (state.megastructures) {
    const ownedMega = Object.values(state.megastructures).find(
      (m) => m.ownerId === botPlayerId
    );

    if (ownedMega && ownedMega.status !== 'under_construction' && ownedMega.stage < ownedMega.maxStage) {
      const nextStage = ownedMega.stage + 1;
      const nextStageCfg = MEGASTRUCTURE_CONFIGS[ownedMega.type]?.stages[nextStage - 1];

      if (
        nextStageCfg &&
        homeworld.resources.ore >= nextStageCfg.cost.ore + 1000 &&
        homeworld.resources.crystal >= nextStageCfg.cost.crystal + 1000 &&
        homeworld.resources.fuel >= nextStageCfg.cost.fuel + 500
      ) {
        commands.push({
          type: 'UPGRADE_MEGASTRUCTURE',
          megastructureId: ownedMega.id,
          fundingPlanetId: homeworld.id,
        });
        return commands;
      }
    }
  }

  // 2. Select preferred archetype megastructure
  let preferredType: MegastructureType = 'dyson_swarm';
  switch (archetype) {
    case 'industrialist':
      preferredType = 'dyson_swarm';
      break;
    case 'admiral':
    case 'raider':
      preferredType = 'mega_shipyard';
      break;
    case 'explorer':
      preferredType = 'science_nexus';
      break;
    case 'guardian':
      preferredType = 'sentry_array';
      break;
  }

  // Check if bot already owns this megastructure
  const alreadyOwns = state.megastructures && Object.values(state.megastructures).some(
    (m) => m.ownerId === botPlayerId && m.type === preferredType
  );

  if (!alreadyOwns) {
    const stage1Cost = MEGASTRUCTURE_CONFIGS[preferredType].stages[0].cost;
    // Require safe buffer over base cost
    if (
      homeworld.resources.ore >= stage1Cost.ore + 1200 &&
      homeworld.resources.crystal >= stage1Cost.crystal + 1200 &&
      homeworld.resources.fuel >= stage1Cost.fuel + 600
    ) {
      const check = canBuildMegastructure(state, homeworld.systemId, botPlayerId, preferredType);
      if (check.canBuild) {
        commands.push({
          type: 'BUILD_MEGASTRUCTURE',
          systemId: homeworld.systemId,
          megastructureType: preferredType,
          fundingPlanetId: homeworld.id,
        });
        return commands;
      }
    }
  }

  // 3. Subspace Gateway Activation & Construction
  if (state.gateways) {
    // Check if there's a dormant ancient gateway in a system controlled by bot
    const controlledSystems = new Set(
      Object.values(state.planets)
        .filter((p) => p.ownerId === botPlayerId)
        .map((p) => p.systemId)
    );

    for (const gw of Object.values(state.gateways)) {
      if (gw.status === 'dormant' && controlledSystems.has(gw.systemId)) {
        const actCost = GATEWAY_CONFIG.ACTIVATION_COST;
        if (
          homeworld.resources.ore >= actCost.ore + 500 &&
          homeworld.resources.crystal >= actCost.crystal + 500 &&
          homeworld.resources.fuel >= actCost.fuel + 300
        ) {
          commands.push({
            type: 'ACTIVATE_GATEWAY',
            systemId: gw.systemId,
            fundingPlanetId: homeworld.id,
          });
          return commands;
        }
      }
    }

    // Check if bot should construct a second gateway to create a network
    const ownedActiveGateways = Object.values(state.gateways).filter(
      (g) => g.ownerId === botPlayerId && g.status === 'active'
    );

    if (ownedActiveGateways.length === 1) {
      // Find a colony in a different system without gateway
      const otherColony = Object.values(state.planets).find(
        (p) => p.ownerId === botPlayerId && !state.gateways![p.systemId]
      );

      if (otherColony) {
        const buildCost = GATEWAY_CONFIG.CONSTRUCTION_COST;
        if (
          homeworld.resources.ore >= buildCost.ore + 1500 &&
          homeworld.resources.crystal >= buildCost.crystal + 1500 &&
          homeworld.resources.fuel >= buildCost.fuel + 800
        ) {
          commands.push({
            type: 'CONSTRUCT_GATEWAY',
            systemId: otherColony.systemId,
            fundingPlanetId: homeworld.id,
          });
          return commands;
        }
      }
    }
  }

  return commands;
}
