import { GameEngine } from '../engine/engine';
import { GameCommand, SenateResolutionType, SenateVote } from '../engine/types';
import { isPlayerSanctioned, SENATE_RESOLUTION_CONFIG } from '../engine/senate';

/**
 * Autonomous Senate decision-making for Bot AI
 */
export function evaluateBotSenate(
  engine: GameEngine,
  playerId: string,
  archetype: 'guardian' | 'industrialist' | 'explorer' | 'admiral' | 'raider',
  executedCommands: GameCommand[]
): void {
  const state = engine.state;
  if (!state.senate) return;

  const currentSession = state.senate.currentSession;

  // 1. Cast Vote if there is an active session and this bot hasn't voted yet
  if (currentSession && !currentSession.votes[playerId]) {
    let desiredVote: SenateVote = 'abstain';

    switch (currentSession.type) {
      case 'military_readiness':
        if (archetype === 'admiral' || archetype === 'raider' || archetype === 'guardian') {
          desiredVote = 'for';
        } else if (archetype === 'industrialist' || archetype === 'explorer') {
          desiredVote = 'against'; // Penalizes civilian mineral/fuel production
        }
        break;

      case 'free_trade':
        if (archetype === 'industrialist' || archetype === 'explorer' || archetype === 'guardian') {
          desiredVote = 'for';
        } else if (archetype === 'raider') {
          desiredVote = 'against';
        }
        break;

      case 'scientific_cooperative':
        if (archetype === 'explorer' || archetype === 'industrialist' || archetype === 'guardian') {
          desiredVote = 'for';
        } else {
          desiredVote = 'abstain';
        }
        break;

      case 'bounty_hunters':
        if (archetype === 'guardian' || archetype === 'admiral' || archetype === 'explorer') {
          desiredVote = 'for';
        } else if (archetype === 'raider') {
          desiredVote = 'against'; // Raiders dislike bounty hunters
        }
        break;

      case 'custodian_election':
        if (state.crisis && state.crisis.stage !== 'dormant' && state.crisis.stage !== 'defeated' && archetype !== 'raider') {
          desiredVote = 'for'; // Rally behind Galactic Custodian during apocalyptic threat!
        } else if (currentSession.targetPlayerId === playerId) {
          desiredVote = 'for'; // Always vote for self as Custodian!
        } else if (archetype === 'raider') {
          desiredVote = 'against'; // Opposes galactic order
        } else {
          // If the nominee is our ally
          const player = state.players[playerId];
          const targetPlayer = currentSession.targetPlayerId ? state.players[currentSession.targetPlayerId] : undefined;
          if (player?.allianceId && targetPlayer?.allianceId && player.allianceId === targetPlayer.allianceId) {
            desiredVote = 'for';
          } else {
            // Vote against strong rivals
            const targetScore = currentSession.targetPlayerId ? (state.relay.weeklyPoints[currentSession.targetPlayerId] || 0) : 0;
            desiredVote = targetScore > 100 ? 'against' : 'abstain';
          }
        }
        break;

      case 'sanctions':
        if (currentSession.targetPlayerId === playerId) {
          desiredVote = 'against'; // Never vote for sanctions against oneself!
        } else {
          const player = state.players[playerId];
          const targetPlayer = currentSession.targetPlayerId ? state.players[currentSession.targetPlayerId] : undefined;
          if (player?.allianceId && targetPlayer?.allianceId && player.allianceId === targetPlayer.allianceId) {
            desiredVote = 'against'; // Protect allies
          } else {
            desiredVote = 'for'; // Enforce sanctions against competitors
          }
        }
        break;
    }

    const voteCmd: GameCommand = {
      type: 'CAST_SENATE_VOTE',
      vote: desiredVote,
    };
    const receipt = engine.dispatchCommand(playerId, voteCmd);
    if (receipt.success) {
      executedCommands.push(voteCmd);
      return;
    }
  }

  // 2. Propose a new resolution if no active session and bot has ample deposit resources
  if (!currentSession) {
    if (isPlayerSanctioned(state, playerId)) return;

    // Wait at least 30 seconds since the last session concluded before spamming new bills
    const timeSinceLast = state.timeMs - (state.senate.lastSessionEndedAt || 0);
    if (timeSinceLast < 30_000) return;

    // Check homeworld resources
    const hw = Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
               Object.values(state.planets).find((p) => p.ownerId === playerId);
    if (!hw) return;

    let candidateType: SenateResolutionType | null = null;
    let candidateTargetId: string | undefined = undefined;

    switch (archetype) {
      case 'industrialist':
        if (!engine.isSenateResolutionActive('free_trade')) {
          candidateType = 'free_trade';
        }
        break;

      case 'guardian':
        if (!state.senate.custodianPlayerId) {
          candidateType = 'custodian_election';
          candidateTargetId = playerId;
        } else if (!engine.isSenateResolutionActive('bounty_hunters')) {
          candidateType = 'bounty_hunters';
        }
        break;

      case 'admiral':
        if (!engine.isSenateResolutionActive('military_readiness')) {
          candidateType = 'military_readiness';
        }
        break;

      case 'explorer':
        if (!engine.isSenateResolutionActive('scientific_cooperative')) {
          candidateType = 'scientific_cooperative';
        }
        break;

      case 'raider': {
        // Find top competitor by hegemony points and propose sanctions
        const rivals = Object.values(state.players)
          .filter((p) => p.id !== playerId && !engine.isSenateResolutionActive('sanctions', p.id))
          .sort((a, b) => (state.relay.weeklyPoints[b.id] || 0) - (state.relay.weeklyPoints[a.id] || 0));

        if (rivals.length > 0 && (state.relay.weeklyPoints[rivals[0].id] || 0) > 30) {
          candidateType = 'sanctions';
          candidateTargetId = rivals[0].id;
        }
        break;
      }
    }

    if (candidateType) {
      const cfg = SENATE_RESOLUTION_CONFIG[candidateType];
      if (
        hw.resources.ore >= cfg.baseDepositCost.ore + 100 &&
        hw.resources.crystal >= cfg.baseDepositCost.crystal + 150 &&
        hw.resources.fuel >= cfg.baseDepositCost.fuel + 50
      ) {
        const proposeCmd: GameCommand = {
          type: 'PROPOSE_SENATE_RESOLUTION',
          resolutionType: candidateType,
          targetPlayerId: candidateTargetId,
        };
        const receipt = engine.dispatchCommand(playerId, proposeCmd);
        if (receipt.success) {
          executedCommands.push(proposeCmd);
        }
      }
    }
  }
}
