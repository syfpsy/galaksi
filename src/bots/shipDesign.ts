import { GameEngine } from '../engine/engine';
import { GameCommand, ShipLoadoutMap, ShipType } from '../engine/types';
import { calculateRefitCost, DEFAULT_LOADOUTS } from '../engine/shipDesign';

export type BotArchetype = 'industrialist' | 'raider' | 'guardian' | 'explorer' | 'admiral' | 'qa_exploit';

export const BOT_ARCHETYPE_LOADOUTS: Record<BotArchetype, ShipLoadoutMap> = {
  raider: {
    scout: { weapon: 'plasma', defense: 'evasion_thrusters', utility: 'hyper_drive' },
    transport: { weapon: 'laser', defense: 'evasion_thrusters', utility: 'hyper_drive' },
    fighter: { weapon: 'plasma', defense: 'evasion_thrusters', utility: 'hyper_drive' },
    battleship: { weapon: 'torpedo', defense: 'plasteel_armor', utility: 'hyper_drive' },
  },
  guardian: {
    scout: { weapon: 'laser', defense: 'plasteel_armor', utility: 'subspace_sensor' },
    transport: { weapon: 'laser', defense: 'plasteel_armor', utility: 'cargo_expander' },
    fighter: { weapon: 'railgun', defense: 'plasteel_armor', utility: 'standard_reactor' },
    battleship: { weapon: 'railgun', defense: 'plasteel_armor', utility: 'standard_reactor' },
  },
  explorer: {
    scout: { weapon: 'laser', defense: 'evasion_thrusters', utility: 'subspace_sensor' },
    transport: { weapon: 'laser', defense: 'evasion_thrusters', utility: 'subspace_sensor' },
    fighter: { weapon: 'laser', defense: 'evasion_thrusters', utility: 'subspace_sensor' },
    battleship: { weapon: 'plasma', defense: 'evasion_thrusters', utility: 'subspace_sensor' },
  },
  industrialist: {
    scout: { weapon: 'laser', defense: 'standard_shield', utility: 'subspace_sensor' },
    transport: { weapon: 'laser', defense: 'standard_shield', utility: 'cargo_expander' },
    fighter: { weapon: 'laser', defense: 'standard_shield', utility: 'cargo_expander' },
    battleship: { weapon: 'railgun', defense: 'standard_shield', utility: 'cargo_expander' },
  },
  admiral: {
    scout: { weapon: 'laser', defense: 'evasion_thrusters', utility: 'subspace_sensor' },
    transport: { weapon: 'laser', defense: 'standard_shield', utility: 'cargo_expander' },
    fighter: { weapon: 'railgun', defense: 'evasion_thrusters', utility: 'hyper_drive' },
    battleship: { weapon: 'torpedo', defense: 'plasteel_armor', utility: 'hyper_drive' },
  },
  qa_exploit: DEFAULT_LOADOUTS,
};

/**
 * Autonomous bot logic for modular ship designs and shipyard refits
 */
export function evaluateBotShipDesign(
  engine: GameEngine,
  botPlayerId: string,
  archetype: BotArchetype,
  executedCommands?: GameCommand[]
): GameCommand[] {
  const commands: GameCommand[] = [];
  const state = engine.state;
  const targetLoadouts = BOT_ARCHETYPE_LOADOUTS[archetype] || DEFAULT_LOADOUTS;
  const currentLoadouts = state.shipLoadouts?.[botPlayerId] || DEFAULT_LOADOUTS;

  const shipTypes: ShipType[] = ['scout', 'transport', 'fighter', 'battleship'];

  // 1. Check if blueprints need to be updated to match bot doctrine
  for (const st of shipTypes) {
    const desired = targetLoadouts[st];
    const current = currentLoadouts[st];

    if (
      !current ||
      current.weapon !== desired.weapon ||
      current.defense !== desired.defense ||
      current.utility !== desired.utility
    ) {
      const setCmd: GameCommand = {
        type: 'SET_SHIP_LOADOUT',
        shipType: st,
        loadout: { ...desired },
      };
      const receipt = engine.dispatchCommand(botPlayerId, setCmd);
      if (receipt.success) {
        commands.push(setCmd);
        if (executedCommands) executedCommands.push(setCmd);
        break; // Change one loadout per tick
      }
    }
  }

  // 2. Check if garrison ships at a shipyard planet can be refitted/modernized
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === botPlayerId);
  for (const planet of myPlanets) {
    if (planet.buildings.shipyard < 1) continue;

    // Check combat ships first (fighter, battleship)
    const priorityShips: ShipType[] = ['fighter', 'battleship', 'scout', 'transport'];
    for (const st of priorityShips) {
      const count = planet.garrison[st] || 0;
      if (count > 0) {
        const refitCount = Math.min(count, 2);
        const refitCost = calculateRefitCost(st, targetLoadouts[st], refitCount);

        // Check surplus resource threshold
        if (
          planet.resources.ore >= refitCost.ore + 300 &&
          planet.resources.crystal >= refitCost.crystal + 200 &&
          planet.resources.fuel >= refitCost.fuel + 150
        ) {
          const refitCmd: GameCommand = {
            type: 'REFIT_SHIPS',
            planetId: planet.id,
            shipType: st,
            count: refitCount,
          };
          const receipt = engine.dispatchCommand(botPlayerId, refitCmd);
          if (receipt.success) {
            commands.push(refitCmd);
            if (executedCommands) executedCommands.push(refitCmd);
            return commands; // One refit batch per tick is sufficient
          }
        }
      }
    }
  }

  return commands;
}
