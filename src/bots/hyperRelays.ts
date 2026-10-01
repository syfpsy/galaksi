import { GameEngine } from '../engine/engine';
import { GameCommand, HyperRelayPolicy } from '../engine/types';
import {
  canConstructHyperRelay,
  HYPER_RELAY_CONFIG,
} from '../engine/hyperRelays';
import { getActiveWarsForPlayer } from '../engine/wars';

/**
 * Autonomous Bot AI for Hyper Relays, Transit Highway Networks & Subspace Logistics (Phase 28)
 */
export function evaluateBotHyperRelays(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  const relays = engine.state.hyperRelays || {};

  // 1. Policy Evaluation for Owned Active Relays
  const myRelays = Object.values(relays).filter((r) => r.ownerId === playerId);
  const targetPolicy: HyperRelayPolicy = (() => {
    switch (archetype) {
      case 'admiral':
      case 'raider':
        return 'military_priority';
      case 'industrialist':
        return 'commercial_freight';
      case 'explorer':
        return 'rapid_civilian';
      case 'guardian': {
        const wars = getActiveWarsForPlayer(engine.state, playerId);
        return wars.length > 0 ? 'military_priority' : 'commercial_freight';
      }
      default:
        return 'military_priority';
    }
  })();

  for (const relay of myRelays) {
    if (relay.policy !== targetPolicy) {
      const cmd: GameCommand = {
        type: 'SET_HYPER_RELAY_POLICY',
        systemId: relay.systemId,
        policy: targetPolicy,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 2. Construction Evaluation
  // Find player-owned systems (planets or starbases) that lack a Hyper Relay
  const ownedSystemIds = new Set<string>();
  for (const p of playerPlanets) {
    ownedSystemIds.add(p.systemId);
  }
  if (engine.state.starbases) {
    for (const [sId, sb] of Object.entries(engine.state.starbases)) {
      if (sb.ownerId === playerId) {
        ownedSystemIds.add(sId);
      }
    }
  }

  const unservedSystems = Array.from(ownedSystemIds).filter((sId) => !relays[sId]);
  if (unservedSystems.length === 0) return;

  // Best funding planet with safety margin
  const cost = HYPER_RELAY_CONFIG.CONSTRUCTION_COST;
  const fundingPlanet = playerPlanets
    .filter(
      (p) =>
        p.resources.ore >= cost.ore + 200 &&
        p.resources.crystal >= cost.crystal + 150 &&
        p.resources.fuel >= cost.fuel + 100
    )
    .sort((a, b) => (b.resources.ore + b.resources.crystal) - (a.resources.ore + a.resources.crystal))[0];

  if (!fundingPlanet) return;

  // Prioritize systems that have connections to systems with existing relays (expanding transit highways)
  const candidateScores = unservedSystems.map((sId) => {
    let score = 10;
    // Boost if adjacent to another system with a relay
    for (const lane of engine.state.map.lanes) {
      let neighborId: string | null = null;
      if (lane.fromSystemId === sId) neighborId = lane.toSystemId;
      else if (lane.toSystemId === sId) neighborId = lane.fromSystemId;

      if (neighborId && relays[neighborId]) {
        score += 25;
      }
      if (neighborId && ownedSystemIds.has(neighborId)) {
        score += 15;
      }
    }

    // Homeworld system is highest priority
    const hasHomeworld = playerPlanets.some((p) => p.systemId === sId && p.isHomeworld);
    if (hasHomeworld) score += 50;

    return { systemId: sId, score };
  });

  candidateScores.sort((a, b) => b.score - a.score);
  const targetSystem = candidateScores[0];

  if (targetSystem && canConstructHyperRelay(engine.state, playerId, targetSystem.systemId, fundingPlanet.id).success) {
    const cmd: GameCommand = {
      type: 'CONSTRUCT_HYPER_RELAY',
      systemId: targetSystem.systemId,
      fundingPlanetId: fundingPlanet.id,
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
    }
  }
}
