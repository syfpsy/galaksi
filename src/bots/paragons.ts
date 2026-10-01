import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';
import { canRecruitParagon, PARAGON_CONSTANTS } from '../engine/paragons';

/**
 * Autonomous Bot AI for Galactic Paragons, Renowned Heroes & Council Destiny (Phase 27)
 */
export function evaluateBotParagons(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  const pool = engine.state.galacticParagonPool || [];
  const paragons = engine.state.paragons || {};
  const myParagonIds = player.paragonIds || [];

  // 1. Paragon Recruitment Evaluation
  if (myParagonIds.length < PARAGON_CONSTANTS.MAX_RECRUITED_PARAGONS_PER_PLAYER && pool.length > 0) {
    // Archetype preference mapping
    const preferredClasses: Record<string, string[]> = {
      admiral: ['military', 'economic'],
      raider: ['military', 'economic'],
      industrialist: ['economic', 'scientific'],
      explorer: ['scientific', 'military'],
      guardian: ['diplomatic', 'economic'],
    };

    const targetClasses = preferredClasses[archetype] || ['military', 'economic', 'scientific', 'diplomatic'];

    // Find best matching candidate from available pool
    const candidates = pool
      .map((id) => paragons[id])
      .filter((p) => p && p.ownerId === null);

    const sortedCandidates = [...candidates].sort((a, b) => {
      const aMatch = targetClasses.indexOf(a.class);
      const bMatch = targetClasses.indexOf(b.class);
      const aScore = (aMatch !== -1 ? (10 - aMatch) : 0) + (a.tier === 'legendary' ? 5 : 2);
      const bScore = (bMatch !== -1 ? (10 - bMatch) : 0) + (b.tier === 'legendary' ? 5 : 2);
      return bScore - aScore;
    });

    for (const candidate of sortedCandidates) {
      if (canRecruitParagon(engine.state, playerId, candidate.id).success) {
        const cmd: GameCommand = {
          type: 'RECRUIT_PARAGON',
          paragonId: candidate.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          break;
        }
      }
    }
  }

  // 2. Paragon Commission Flagship Evaluation
  for (const pId of player.paragonIds || []) {
    const paragon = paragons[pId];
    if (!paragon || !paragon.flagship || paragon.flagship.isCommissioned) continue;

    // Check if planet has resources to commission flagship
    const flagshipCost = PARAGON_CONSTANTS.FLAGSHIP_COMMISSION_COST;
    if (
      primaryPlanet.resources.ore >= flagshipCost.ore + 200 &&
      primaryPlanet.resources.crystal >= flagshipCost.crystal + 200 &&
      primaryPlanet.resources.fuel >= flagshipCost.fuel + 150
    ) {
      const cmd: GameCommand = {
        type: 'COMMISSION_PARAGON_FLAGSHIP',
        paragonId: paragon.id,
        planetId: primaryPlanet.id,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        break;
      }
    }
  }

  // 3. Paragon Assignment Evaluation
  for (const pId of player.paragonIds || []) {
    const paragon = paragons[pId];
    if (!paragon) continue;

    // If currently unassigned, find optimal station
    if (!paragon.assignedTo) {
      if (paragon.class === 'military') {
        // Look for an owned fleet without paragon
        const availableFleet = Object.values(engine.state.fleets).find(
          (f) => f.ownerId === playerId && !f.paragonId
        );
        if (availableFleet) {
          const cmd: GameCommand = {
            type: 'ASSIGN_PARAGON',
            paragonId: paragon.id,
            assignment: { type: 'fleet', targetId: availableFleet.id },
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            continue;
          }
        }
        // Fallback to council
        const cmd: GameCommand = {
          type: 'ASSIGN_PARAGON',
          paragonId: paragon.id,
          assignment: { type: 'council', targetId: 'military_minister' },
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      } else if (paragon.class === 'economic') {
        // Assign to primary planet or council
        const unassignedPlanet = playerPlanets.find((p) => !p.assignedParagonId);
        if (unassignedPlanet) {
          const cmd: GameCommand = {
            type: 'ASSIGN_PARAGON',
            paragonId: paragon.id,
            assignment: { type: 'planet', targetId: unassignedPlanet.id },
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            continue;
          }
        }
        const cmd: GameCommand = {
          type: 'ASSIGN_PARAGON',
          paragonId: paragon.id,
          assignment: { type: 'council', targetId: 'economic_advisor' },
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      } else if (paragon.class === 'scientific') {
        const cmd: GameCommand = {
          type: 'ASSIGN_PARAGON',
          paragonId: paragon.id,
          assignment: { type: 'council', targetId: 'chief_science_director' },
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      } else {
        // Diplomatic
        const cmd: GameCommand = {
          type: 'ASSIGN_PARAGON',
          paragonId: paragon.id,
          assignment: { type: 'council', targetId: 'grand_diplomat' },
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }
}
