import { GameEngine } from '../engine/engine';
import { ColossusWeaponType, GameCommand } from '../engine/types';
import { canBuildColossus } from '../engine/colossus';

/**
 * Autonomous Bot AI for Colossus Superweapons & World Killers (Phase 25)
 */
export function evaluateBotColossus(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = playerPlanets[0];
  if (!primaryPlanet) return;

  const existingColossus = player.colossusId && engine.state.colossi ? engine.state.colossi[player.colossusId] : null;

  // 1. Build Colossus if rich and don't have one
  if (!existingColossus) {
    // Check if bot can afford with safe surplus margin
    if (
      primaryPlanet.resources.ore >= 2500 &&
      primaryPlanet.resources.crystal >= 1200 &&
      primaryPlanet.resources.fuel >= 1800
    ) {
      let desiredWeapon: ColossusWeaponType = 'world_cracker';
      if (archetype === 'admiral') {
        desiredWeapon = 'neutron_sweep';
      } else if (archetype === 'industrialist') {
        desiredWeapon = 'nanite_disassembler';
      } else if (archetype === 'guardian' || archetype === 'explorer') {
        desiredWeapon = 'global_pacifier';
      }

      const check = canBuildColossus(engine.state, playerId, primaryPlanet.id);
      if (check.allowed) {
        const cmd: GameCommand = {
          type: 'BUILD_COLOSSUS',
          weaponType: desiredWeapon,
          originPlanetId: primaryPlanet.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 2. Colossus Tactical Operations
  if (existingColossus) {
    // If currently charging, continue sequence
    if (existingColossus.status === 'charging') {
      return;
    }

    // Check for target planets in current system
    const systemPlanets = Object.values(engine.state.planets).filter(
      (p) => p.systemId === existingColossus.currentSystemId
    );
    const targetEnemyPlanet = systemPlanets.find(
      (p) =>
        p.ownerId &&
        p.ownerId !== playerId &&
        !p.isDestroyed &&
        !p.isShielded &&
        p.biome !== 'shattered' &&
        p.biome !== 'shield_world'
    );

    if (targetEnemyPlanet && existingColossus.status !== 'in_transit') {
      const chargeCmd: GameCommand = {
        type: 'COMMENCE_COLOSSUS_CHARGING',
        colossusId: existingColossus.id,
        targetPlanetId: targetEnemyPlanet.id,
      };
      const receipt = engine.dispatchCommand(playerId, chargeCmd);
      if (receipt.success) {
        executedCommands.push(chargeCmd);
        return;
      }
    }

    // If no target in current system and idle/orbiting, navigate towards an enemy colonized system
    if (existingColossus.status === 'idle' || existingColossus.status === 'orbiting') {
      const enemyPlanets = Object.values(engine.state.planets).filter(
        (p) =>
          p.ownerId &&
          p.ownerId !== playerId &&
          !p.isDestroyed &&
          !p.isShielded &&
          p.biome !== 'shattered' &&
          p.biome !== 'shield_world'
      );

      if (enemyPlanets.length > 0) {
        const targetWorld = enemyPlanets[0];
        if (targetWorld.systemId !== existingColossus.currentSystemId) {
          const moveCmd: GameCommand = {
            type: 'MOVE_COLOSSUS',
            colossusId: existingColossus.id,
            targetSystemId: targetWorld.systemId,
          };
          const receipt = engine.dispatchCommand(playerId, moveCmd);
          if (receipt.success) {
            executedCommands.push(moveCmd);
            return;
          }
        }
      }
    }
  }
}
