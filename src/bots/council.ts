import { COUNCIL_CONSTANTS } from '../engine/council';
import { GameEngine } from '../engine/engine';
import { CouncilPosition, FactionType, GameCommand } from '../engine/types';

/**
 * Autonomous Bot AI for Imperial Council & Internal Factions (Phase 14)
 */
export function evaluateBotCouncil(
  engine: GameEngine,
  botPlayerId: string,
  archetype: string,
  executedCommands?: GameCommand[]
): GameCommand[] {
  const commands: GameCommand[] = [];
  const state = engine.state;
  const player = state.players[botPlayerId];
  if (!player || player.vacationMode) return commands;

  const council = state.councils?.[botPlayerId];
  if (!council) return commands;

  // Find bot homeworld for funding recruitment or agendas
  const homeworld =
    Object.values(state.planets).find((p) => p.ownerId === botPlayerId && p.isHomeworld) ||
    Object.values(state.planets).find((p) => p.ownerId === botPlayerId);

  if (!homeworld) return commands;

  // Order of position priority by archetype
  let positionPriority: CouncilPosition[] = [
    'defense_minister',
    'science_director',
    'industry_minister',
    'spymaster',
  ];

  if (archetype === 'industrialist') {
    positionPriority = [
      'industry_minister',
      'science_director',
      'defense_minister',
      'spymaster',
    ];
  } else if (archetype === 'explorer') {
    positionPriority = [
      'science_director',
      'industry_minister',
      'defense_minister',
      'spymaster',
    ];
  } else if (archetype === 'admiral' || archetype === 'raider') {
    positionPriority = [
      'defense_minister',
      'spymaster',
      'industry_minister',
      'science_director',
    ];
  } else if (archetype === 'guardian') {
    positionPriority = [
      'defense_minister',
      'industry_minister',
      'science_director',
      'spymaster',
    ];
  }

  // 1. Appoint available unassigned leaders to vacant council seats
  const unassignedLeaders = Object.values(council.leaders).filter(
    (l) => l.assignedPosition === null
  );

  for (const pos of positionPriority) {
    if (council.positions[pos] === null && unassignedLeaders.length > 0) {
      // Find leader with best matching trait or pick first available
      let bestLeaderIdx = unassignedLeaders.findIndex((l) => {
        if (pos === 'defense_minister') {
          return ['warlord', 'iron_disciplinarian', 'fleet_organizer'].includes(l.trait.id);
        }
        if (pos === 'science_director') {
          return l.trait.id === 'technologist_visionary';
        }
        if (pos === 'industry_minister') {
          return ['master_logistics', 'deep_space_miner'].includes(l.trait.id);
        }
        if (pos === 'spymaster') {
          return l.trait.id === 'shadow_broker';
        }
        return false;
      });

      if (bestLeaderIdx === -1) {
        bestLeaderIdx = 0;
      }

      const leaderToAssign = unassignedLeaders.splice(bestLeaderIdx, 1)[0];
      const cmd: GameCommand = {
        type: 'APPOINT_COUNCILOR',
        leaderId: leaderToAssign.id,
        position: pos,
      };

      const res = engine.dispatchCommand(botPlayerId, cmd);
      if (res.success) {
        commands.push(cmd);
        executedCommands?.push(cmd);
      }
    }
  }

  // 2. Recruit candidate if there are vacant seats and budget allows
  const hasVacantSeats = positionPriority.some((pos) => council.positions[pos] === null);
  if (
    hasVacantSeats &&
    council.recruitCandidates.length > 0 &&
    homeworld.resources.ore >= COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.ore + 500 &&
    homeworld.resources.crystal >= COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.crystal + 400 &&
    homeworld.resources.fuel >= COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.fuel + 300
  ) {
    // Pick the candidate whose trait matches one of the vacant positions
    const vacantPositions = positionPriority.filter((pos) => council.positions[pos] === null);
    let chosenCandidate = council.recruitCandidates[0];

    for (const cand of council.recruitCandidates) {
      for (const pos of vacantPositions) {
        if (
          (pos === 'defense_minister' && ['warlord', 'iron_disciplinarian', 'fleet_organizer'].includes(cand.trait.id)) ||
          (pos === 'science_director' && cand.trait.id === 'technologist_visionary') ||
          (pos === 'industry_minister' && ['master_logistics', 'deep_space_miner'].includes(cand.trait.id)) ||
          (pos === 'spymaster' && cand.trait.id === 'shadow_broker')
        ) {
          chosenCandidate = cand;
          break;
        }
      }
    }

    const recruitCmd: GameCommand = {
      type: 'RECRUIT_COUNCIL_LEADER',
      candidateId: chosenCandidate.id,
      fundingPlanetId: homeworld.id,
    };

    const res = engine.dispatchCommand(botPlayerId, recruitCmd);
    if (res.success) {
      commands.push(recruitCmd);
      executedCommands?.push(recruitCmd);

      // Immediately try to appoint the newly recruited leader
      for (const pos of vacantPositions) {
        const appointCmd: GameCommand = {
          type: 'APPOINT_COUNCILOR',
          leaderId: chosenCandidate.id,
          position: pos,
        };
        const appointRes = engine.dispatchCommand(botPlayerId, appointCmd);
        if (appointRes.success) {
          commands.push(appointCmd);
          executedCommands?.push(appointCmd);
          break;
        }
      }
    }
  }

  // 3. Promote Faction Agenda if approval is low (< 45%) and resources are plentiful
  const lowApprovalFactions = Object.values(council.factions).filter(
    (f) => f.approvalRating < 45
  );

  if (
    lowApprovalFactions.length > 0 &&
    homeworld.resources.ore >= COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.ore + 800 &&
    homeworld.resources.crystal >= COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.crystal + 600 &&
    homeworld.resources.fuel >= COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST.fuel + 400
  ) {
    const targetFaction = lowApprovalFactions[0];
    const unfulfilledAgenda = targetFaction.agendas.find((a) => !a.fulfilled) || targetFaction.agendas[0];

    if (unfulfilledAgenda) {
      const promoteCmd: GameCommand = {
        type: 'PROMOTE_FACTION_AGENDA',
        factionType: targetFaction.type,
        agendaId: unfulfilledAgenda.id,
        fundingPlanetId: homeworld.id,
      };

      const promoteRes = engine.dispatchCommand(botPlayerId, promoteCmd);
      if (promoteRes.success) {
        commands.push(promoteCmd);
        executedCommands?.push(promoteCmd);
      }
    }
  }

  return commands;
}
