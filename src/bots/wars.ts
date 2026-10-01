import { GameEngine } from '../engine/engine';
import { GameCommand, SubjectType, WarGoalType } from '../engine/types';
import { getActiveWarsForPlayer, getPlayerSubjects, isAtWar } from '../engine/wars';

/**
 * Autonomous AI Evaluator for Casus Belli, Wars, War Exhaustion & Subject Management
 */
export function evaluateBotWarfare(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const activeWars = getActiveWarsForPlayer(engine.state, playerId);

  // 1. Manage Active Wars (Peace Negotiations & Tactical Escalation)
  if (activeWars.length > 0) {
    for (const war of activeWars) {
      const isAttacker = war.attackerId === playerId;
      const myExhaustion = isAttacker ? war.attackerExhaustion : war.defenderExhaustion;
      const enemyExhaustion = isAttacker ? war.defenderExhaustion : war.attackerExhaustion;

      // Critical War Exhaustion (> 85%): Propose Status Quo Peace to stem losses
      if (myExhaustion >= 85) {
        const cmd: GameCommand = {
          type: 'OFFER_PEACE',
          warId: war.id,
          proposalType: 'status_quo',
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }

      // Dominant Position: If enemy is at 100% exhaustion, enforce Status Quo victory
      if (enemyExhaustion >= 95 && myExhaustion < 60) {
        const cmd: GameCommand = {
          type: 'OFFER_PEACE',
          warId: war.id,
          proposalType: 'status_quo',
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 2. War Declaration Evaluation (Aggressive Archetypes: Raider & Admiral)
  if (activeWars.length === 0) {
    const isAggressive = archetype === 'raider' || archetype === 'admiral' || archetype === 'industrialist';
    if (isAggressive) {
      // Calculate bot's total military fleet strength
      const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
      let myFighters = 0;
      let myBattleships = 0;
      for (const p of myPlanets) {
        myFighters += p.garrison.fighter || 0;
        myBattleships += p.garrison.battleship || 0;
      }
      for (const f of Object.values(engine.state.fleets)) {
        if (f.ownerId === playerId && f.status !== 'destroyed') {
          myFighters += f.ships.fighter || 0;
          myBattleships += f.ships.battleship || 0;
        }
      }

      const myMilitaryPower = myFighters * 10 + myBattleships * 35;

      // Only declare war if bot has a solid war fleet
      if (myMilitaryPower >= 60) {
        for (const targetPlayer of Object.values(engine.state.players)) {
          if (targetPlayer.id === playerId) continue;
          if (targetPlayer.vacationMode) continue;
          if (player.allianceId && targetPlayer.allianceId && player.allianceId === targetPlayer.allianceId) continue;
          if (isAtWar(engine.state, playerId, targetPlayer.id)) continue;
          if (engine.hasActiveTruce(playerId, targetPlayer.id)) continue;

          // Check target's known fleet strength
          let targetFighters = 0;
          let targetBattleships = 0;
          const targetPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === targetPlayer.id);
          for (const tp of targetPlanets) {
            targetFighters += tp.garrison.fighter || 0;
            targetBattleships += tp.garrison.battleship || 0;
          }
          const targetMilitaryPower = targetFighters * 10 + targetBattleships * 35;

          // Aggressive threshold: bot power >= 1.3x target power
          if (myMilitaryPower >= targetMilitaryPower * 1.3) {
            let warGoal: WarGoalType = 'conquest';
            if (archetype === 'admiral') warGoal = 'subjugation';
            else if (archetype === 'industrialist') warGoal = 'tributary';
            else if (archetype === 'raider') warGoal = 'conquest';
            else warGoal = 'humiliation';

            const cmd: GameCommand = {
              type: 'DECLARE_WAR',
              targetPlayerId: targetPlayer.id,
              warGoal,
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

  // 3. Subject Management (Overlords)
  const subjects = getPlayerSubjects(engine.state, playerId);
  if (subjects.length > 0) {
    for (const ag of subjects) {
      // A. If bot is industrialist and subject is tributary with low tithe, optimize tithe
      if (archetype === 'industrialist' && ag.type === 'tributary' && ag.titheRate < 0.30) {
        const cmd: GameCommand = {
          type: 'SET_SUBJECT_TERMS',
          subjectId: ag.subjectId,
          subjectType: 'tributary',
          titheRate: 0.30,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }

      // B. If bot is admiral and subject is vassal with high loyalty and unintegrated, start integration
      if (archetype === 'admiral' && ag.type === 'vassal' && ag.integrationProgress === undefined && ag.loyalty >= 30) {
        const cmd: GameCommand = {
          type: 'INTEGRATE_SUBJECT',
          subjectId: ag.subjectId,
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
