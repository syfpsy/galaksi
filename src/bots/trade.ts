import { GameEngine } from '../engine/engine';
import { GameCommand, TradePolicy } from '../engine/types';

/**
 * Autonomous AI evaluator for Galactic Trade Networks, Trade Policies & Fleet Patrols
 */
export function evaluateBotTrade(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const tradeState = engine.state.tradeStates?.[playerId];

  // 1. Archetype Optimal Trade Policy
  const optimalPolicies: Record<string, TradePolicy> = {
    industrialist: 'consumer_benefits',
    explorer: 'marketplace_of_ideas',
    guardian: 'marketplace_of_ideas',
    admiral: 'energy_wealth',
    raider: 'energy_wealth',
  };

  const desiredPolicy = optimalPolicies[archetype] || 'energy_wealth';
  if (player.tradePolicy !== desiredPolicy) {
    const cmd: GameCommand = {
      type: 'SET_TRADE_POLICY',
      policy: desiredPolicy,
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
      return;
    }
  }

  // 2. Commercial Pacts Evaluation
  const currentPacts = player.commercialPacts || [];
  if (currentPacts.length < 2) {
    for (const otherPlayer of Object.values(engine.state.players)) {
      if (otherPlayer.id === playerId) continue;
      if (otherPlayer.vacationMode) continue;
      if (currentPacts.includes(otherPlayer.id)) continue;

      // Don't form pacts if in truce/hostility
      if (engine.hasActiveTruce(playerId, otherPlayer.id)) continue;

      const cmd: GameCommand = {
        type: 'PROPOSE_COMMERCIAL_PACT',
        targetPlayerId: otherPlayer.id,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 3. Trade Route Piracy & Patrol Fleet Deployment
  if (tradeState && tradeState.routes.length > 0) {
    // Find the system with highest piracy risk along bot's trade routes
    let worstSysId: string | null = null;
    let maxPiracy = 25; // Only react if piracy exceeds 25%

    for (const route of tradeState.routes) {
      for (const sysId of route.pathSystemIds) {
        const sysInfo = engine.state.systemTrade?.[sysId];
        if (sysInfo && sysInfo.piracyRisk > maxPiracy) {
          maxPiracy = sysInfo.piracyRisk;
          worstSysId = sysId;
        }
      }
    }

    if (worstSysId) {
      // Check if a patrol fleet is already en route to this system
      const alreadyPatrolling = Object.values(engine.state.fleets).some(
        (f) =>
          f.ownerId === playerId &&
          f.mission === 'patrol' &&
          (f.targetSystemId === worstSysId || f.path.includes(worstSysId))
      );

      if (!alreadyPatrolling) {
        // Find a planet with idle fighters to dispatch on patrol
        const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
        const sourcePlanet = myPlanets.find(
          (p) => (p.garrison.fighter || 0) >= 2 && (p.resources.fuel || 0) >= 100
        );

        if (sourcePlanet && sourcePlanet.systemId !== worstSysId) {
          const fightersToSend = Math.min(3, sourcePlanet.garrison.fighter);
          const cmd: GameCommand = {
            type: 'DISPATCH_FLEET',
            originPlanetId: sourcePlanet.id,
            targetSystemId: worstSysId,
            ships: { scout: 0, transport: 0, fighter: fightersToSend, battleship: 0 },
            mission: 'patrol',
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
