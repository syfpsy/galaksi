import { GameEngine } from '../engine/engine';
import { BreakthroughId, GameCommand, PlanetSpecialization, Player } from '../engine/types';
import { evaluatePlayerDirectives } from '../engine/directives';

const BREAKTHROUGH_ARCHETYPE_PREFERENCES: Record<string, Record<BreakthroughId, number>> = {
  industrialist: {
    breakthrough_automated_freighters: 100,
    breakthrough_deep_core_extractors: 95,
    breakthrough_nanite_shipyards: 90,
    breakthrough_antimatter_reactors: 85,
    breakthrough_quantum_hyperdrive: 75,
    breakthrough_plasma_overcharge: 70,
    breakthrough_tachyon_sensors: 60,
    breakthrough_psionic_relay: 50,
  },
  explorer: {
    breakthrough_quantum_hyperdrive: 100,
    breakthrough_tachyon_sensors: 95,
    breakthrough_psionic_relay: 90,
    breakthrough_automated_freighters: 80,
    breakthrough_antimatter_reactors: 75,
    breakthrough_deep_core_extractors: 65,
    breakthrough_nanite_shipyards: 60,
    breakthrough_plasma_overcharge: 50,
  },
  raider: {
    breakthrough_plasma_overcharge: 100,
    breakthrough_quantum_hyperdrive: 95,
    breakthrough_nanite_shipyards: 90,
    breakthrough_antimatter_reactors: 85,
    breakthrough_tachyon_sensors: 80,
    breakthrough_automated_freighters: 70,
    breakthrough_deep_core_extractors: 60,
    breakthrough_psionic_relay: 50,
  },
  guardian: {
    breakthrough_nanite_shipyards: 100,
    breakthrough_antimatter_reactors: 95,
    breakthrough_deep_core_extractors: 90,
    breakthrough_plasma_overcharge: 85,
    breakthrough_automated_freighters: 75,
    breakthrough_tachyon_sensors: 70,
    breakthrough_quantum_hyperdrive: 60,
    breakthrough_psionic_relay: 50,
  },
  admiral: {
    breakthrough_plasma_overcharge: 100,
    breakthrough_nanite_shipyards: 95,
    breakthrough_quantum_hyperdrive: 90,
    breakthrough_antimatter_reactors: 85,
    breakthrough_tachyon_sensors: 80,
    breakthrough_automated_freighters: 75,
    breakthrough_deep_core_extractors: 60,
    breakthrough_psionic_relay: 50,
  },
};

/**
 * Evaluates bot integration with the Slipways wedge features:
 * - Autonomous Breakthrough choices from Codex
 * - Automated Supply Conduits on colonies
 * - Tri-Sector planetary specializations
 * - Autonomous Directive claiming
 * - Rapid tactical combat interception
 */
export function evaluateBotWedgeSynergies(
  engine: GameEngine,
  playerId: string,
  archetype: Player['botArchetype'],
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const archKey = archetype || 'industrialist';
  const preferences = BREAKTHROUGH_ARCHETYPE_PREFERENCES[archKey] || BREAKTHROUGH_ARCHETYPE_PREFERENCES.industrialist;

  // 1. Choose Available Breakthroughs
  if (player.availableBreakthroughs && player.availableBreakthroughs.length > 0) {
    let bestChoice = player.availableBreakthroughs[0];
    let bestScore = -1;

    for (const bId of player.availableBreakthroughs) {
      const score = preferences[bId] ?? 50;
      if (score > bestScore) {
        bestScore = score;
        bestChoice = bId;
      }
    }

    if (bestChoice) {
      const cmd: GameCommand = {
        type: 'CHOOSE_BREAKTHROUGH',
        breakthroughId: bestChoice,
      };
      const res = engine.dispatchCommand(playerId, cmd);
      if (res.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 2. Enable Automated Supply Conduits on colonies
  const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  const colonies = myPlanets.filter((p) => !p.isHomeworld);

  for (const col of colonies) {
    if (!col.autoSupplyEnabled) {
      const cmd: GameCommand = {
        type: 'TOGGLE_AUTO_SUPPLY',
        planetId: col.id,
        enabled: true,
      };
      const res = engine.dispatchCommand(playerId, cmd);
      if (res.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 3. Assign Tri-Sector Specializations if unset
  const unassignedColonies = colonies.filter((p) => !p.specialization);
  if (unassignedColonies.length > 0) {
    const existingSpecs = colonies.map((p) => p.specialization).filter(Boolean);
    const specPool: PlanetSpecialization[] = ['mining_hub', 'tech_haven', 'military_bastion'];

    for (const col of unassignedColonies) {
      // Pick next needed specialization to build toward Tri-Sector resonance
      const neededSpec = specPool.find((s) => !existingSpecs.includes(s)) || 'mining_hub';
      const cmd: GameCommand = {
        type: 'SET_PLANET_SPECIALIZATION',
        planetId: col.id,
        specialization: neededSpec,
      };
      const res = engine.dispatchCommand(playerId, cmd);
      if (res.success) {
        existingSpecs.push(neededSpec);
        executedCommands.push(cmd);
      }
    }
  }

  // 4. Autonomous Directive Claiming
  const directives = evaluatePlayerDirectives(engine.state, playerId);
  const claimed = player.claimedDirectives || [];
  for (const d of directives) {
    if (d.isCompleted && !claimed.includes(d.id)) {
      const cmd: GameCommand = {
        type: 'CLAIM_DIRECTIVE_REWARD',
        directiveId: d.id,
      };
      const res = engine.dispatchCommand(playerId, cmd);
      if (res.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 5. Tactical Rapid Interception for Homeland Defense
  const mySystemIds = new Set(myPlanets.map((p) => p.systemId));
  const incomingHostiles = Object.values(engine.state.fleets).filter((f) => {
    if (f.ownerId === playerId) return false;
    if (player.allianceId) {
      const other = engine.state.players[f.ownerId];
      if (other?.allianceId === player.allianceId) return false;
    }
    return (
      (f.mission === 'attack' || f.mission === 'intercept') &&
      mySystemIds.has(f.targetSystemId) &&
      f.status === 'in_transit'
    );
  });

  if (incomingHostiles.length > 0) {
    const targetThreat = incomingHostiles[0];
    const cmd: GameCommand = {
      type: 'RAPID_INTERCEPT',
      targetFleetId: targetThreat.id,
    };
    const res = engine.dispatchCommand(playerId, cmd);
    if (res.success) {
      executedCommands.push(cmd);
    }
  }
}
