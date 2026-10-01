import { GameEngine } from '../engine/engine';
import { GameCommand, DistrictType, Player } from '../engine/types';
import { DISTRICT_STATS } from '../engine/constants';

/**
 * Autonomous district management for bot empires based on archetype priorities
 */
export function evaluateBotDistricts(
  engine: GameEngine,
  playerId: string,
  archetype: Player['botArchetype'],
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter(
    (p) => p.ownerId === playerId && !p.districtQueue
  );

  for (const planet of playerPlanets) {
    if (!planet.districts) {
      planet.districts = {
        city: planet.isHomeworld ? 3 : 1,
        mining: planet.isHomeworld ? 2 : 1,
        generator: planet.isHomeworld ? 2 : 0,
        agriculture: planet.isHomeworld ? 1 : 0,
      };
    }

    const currentTotal =
      planet.districts.city +
      planet.districts.mining +
      planet.districts.generator +
      planet.districts.agriculture;

    const maxDistricts = planet.isHomeworld ? 20 : 16;
    if (currentTotal >= maxDistricts) continue;

    // Archetype priority
    let candidate: DistrictType = 'mining';
    const d = planet.districts;

    if (archetype === 'industrialist') {
      if (d.mining <= d.generator) {
        candidate = 'mining';
      } else if (d.generator < d.city) {
        candidate = 'generator';
      } else {
        candidate = 'city';
      }
    } else if (archetype === 'explorer') {
      if (d.agriculture <= d.city) {
        candidate = 'agriculture';
      } else if (d.city <= d.generator) {
        candidate = 'city';
      } else {
        candidate = 'generator';
      }
    } else if (archetype === 'raider' || archetype === 'admiral') {
      if (d.generator <= d.mining) {
        candidate = 'generator';
      } else if (d.mining <= d.city) {
        candidate = 'mining';
      } else {
        candidate = 'city';
      }
    } else {
      // Guardian or balanced
      if (d.city <= d.mining) {
        candidate = 'city';
      } else if (d.mining <= d.generator) {
        candidate = 'mining';
      } else if (d.generator <= d.agriculture) {
        candidate = 'generator';
      } else {
        candidate = 'agriculture';
      }
    }

    const cost = DISTRICT_STATS[candidate].cost;
    if (
      planet.resources.ore >= cost.ore &&
      planet.resources.crystal >= cost.crystal &&
      planet.resources.fuel >= cost.fuel
    ) {
      const cmd: GameCommand = {
        type: 'BUILD_DISTRICT',
        planetId: planet.id,
        districtType: candidate,
      };
      const res = engine.dispatchCommand(playerId, cmd);
      if (res.success) {
        executedCommands.push(cmd);
      }
    }
  }
}
