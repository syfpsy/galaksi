import { GameEngine } from '../engine/engine';
import { EmpireArtifactId, GameCommand, ShipType } from '../engine/types';
import {
  canActivateRelicTriumph,
  canExcavateSite,
  canReverseEngineer,
} from '../engine/archaeology';

const BOT_RELIC_PRIORITIES: Record<string, EmpireArtifactId[]> = {
  explorer: ['subspace_tachyon_array', 'omniscient_archive', 'rift_hyperdrive', 'chronos_core', 'progenitor_matrix', 'dreadnought_plating'],
  industrialist: ['progenitor_matrix', 'chronos_core', 'omniscient_archive', 'dreadnought_plating', 'rift_hyperdrive', 'subspace_tachyon_array'],
  admiral: ['dreadnought_plating', 'rift_hyperdrive', 'chronos_core', 'progenitor_matrix', 'omniscient_archive', 'subspace_tachyon_array'],
  guardian: ['dreadnought_plating', 'omniscient_archive', 'progenitor_matrix', 'chronos_core', 'rift_hyperdrive', 'subspace_tachyon_array'],
  raider: ['dreadnought_plating', 'rift_hyperdrive', 'chronos_core', 'progenitor_matrix', 'omniscient_archive', 'subspace_tachyon_array'],
};

/**
 * Evaluates archaeological opportunities and relic triumphs for AI bot empires
 */
export function evaluateBotArchaeology(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player) return;

  const sites = engine.state.archaeologySites;

  // 1. Resolve any pending chapter choices for this player
  if (sites) {
    for (const site of Object.values(sites)) {
      if (site.status === 'choice_pending' && site.excavatingPlayerId === playerId) {
        // Option 0 is typically scientific/preservation, option 1 is military/exploitation
        const preferChoice = archetype === 'explorer' || archetype === 'guardian' ? 0 : 1;
        const cmd: GameCommand = {
          type: 'RESOLVE_ARCHAEOLOGY_CHOICE',
          siteId: site.id,
          choiceIndex: preferChoice,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 2. Activate Relic Triumphs if available
  const playerArtifacts = player.artifacts || [];
  if (playerArtifacts.length > 0 && (player.minorArtifacts || 0) >= 30) {
    const relicPriority = BOT_RELIC_PRIORITIES[archetype] || BOT_RELIC_PRIORITIES.industrialist;
    for (const relicId of relicPriority) {
      if (playerArtifacts.includes(relicId)) {
        const canRes = canActivateRelicTriumph(engine.state, playerId, relicId);
        if (canRes.canActivate) {
          const cmd: GameCommand = {
            type: 'ACTIVATE_RELIC_TRIUMPH',
            relicId,
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

  // 3. Reverse Engineer Minor Artifacts if stockpile is high (>= 55)
  if ((player.minorArtifacts || 0) >= 55) {
    const actionType = archetype === 'explorer' || archetype === 'industrialist' ? 'tech_boost' : 'cultural_festival';
    const canRev = canReverseEngineer(engine.state, playerId, actionType);
    if (canRev.canReverseEngineer) {
      const cmd: GameCommand = {
        type: 'REVERSE_ENGINEER_ARTIFACTS',
        actionType,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }

  // 4. Start Excavation on available sites if player fleet with scout is already in system
  if (sites) {
    const playerFleets = Object.values(engine.state.fleets).filter(
      (f) => f.ownerId === playerId && f.status === 'orbiting' && (f.ships.scout || 0) > 0
    );

    for (const fleet of playerFleets) {
      const siteInSystem = Object.values(sites).find(
        (s) => s.systemId === fleet.targetSystemId && s.status === 'available'
      );
      if (siteInSystem) {
        const check = canExcavateSite(engine.state, playerId, siteInSystem.id, fleet.id);
        if (check.canExcavate) {
          const cmd: GameCommand = {
            type: 'EXCAVATE_SITE',
            siteId: siteInSystem.id,
            fleetId: fleet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }

    // 5. For Explorer Bot Archetype: actively dispatch idle scout fleet to unexcavated site
    if (archetype === 'explorer') {
      const availableSite = Object.values(sites).find((s) => s.status === 'available');
      if (availableSite) {
        const idleScoutFleet = Object.values(engine.state.fleets).find(
          (f) => f.ownerId === playerId && f.status === 'orbiting' && (f.ships.scout || 0) > 0 && f.targetSystemId !== availableSite.systemId
        );
        if (idleScoutFleet) {
          const homePlanet = Object.values(engine.state.planets).find((p) => p.ownerId === playerId && p.isHomeworld);
          if (homePlanet && homePlanet.resources.fuel >= 50) {
            const dispatchCmd: GameCommand = {
              type: 'DISPATCH_FLEET',
              originPlanetId: homePlanet.id,
              targetSystemId: availableSite.systemId,
              ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
              mission: 'support',
            };
            if ((homePlanet.garrison.scout || 0) >= 1) {
              const res = engine.dispatchCommand(playerId, dispatchCmd);
              if (res.success) {
                executedCommands.push(dispatchCmd);
                return;
              }
            }
          }
        }
      }
    }
  }
}
