import { GameEngine } from '../engine/engine';
import { GameCommand, SecretAgentTrait, ShadowOpType } from '../engine/types';
import {
  canUpgradeDirectorate,
  canRecruitAgent,
  canLaunchShadowOp,
  getOrCreateDirectorate,
  DIRECTORATE_TIER_CONFIGS,
  SHADOW_OP_CONFIGS,
  SECRET_AGENT_TRAIT_CONFIGS,
} from '../engine/shadowOps';
import { getActiveWarsForPlayer } from '../engine/wars';

/**
 * Autonomous Bot AI for Galactic Intelligence Directorate, False Flag Operations & Shadow Coups (Phase 29)
 */
export function evaluateBotShadowOps(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  if (playerPlanets.length === 0) return;

  const directorate = getOrCreateDirectorate(engine.state, playerId);

  // 1. Directorate Tier Upgrade Evaluation
  if (directorate.tier < 5) {
    const nextTier = (directorate.tier + 1) as 2 | 3 | 4 | 5;
    const upgradeCost = DIRECTORATE_TIER_CONFIGS[nextTier].cost;
    const fundingPlanet = playerPlanets
      .filter(
        (p) =>
          p.resources.ore >= upgradeCost.ore + 150 &&
          p.resources.crystal >= upgradeCost.crystal + 150 &&
          p.resources.fuel >= upgradeCost.fuel + 100
      )
      .sort((a, b) => b.resources.ore + b.resources.crystal - (a.resources.ore + a.resources.crystal))[0];

    if (fundingPlanet && canUpgradeDirectorate(engine.state, playerId, fundingPlanet.id)) {
      const cmd: GameCommand = {
        type: 'UPGRADE_INTELLIGENCE_DIRECTORATE',
        fundingPlanetId: fundingPlanet.id,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 2. Secret Agent Recruitment
  const myAgents = Object.values(engine.state.secretAgents || {}).filter((a) => a.ownerId === playerId);
  if (myAgents.length < directorate.maxAgents) {
    const recruitCost = { ore: 150, crystal: 120, fuel: 80 };
    const recruitPlanet = playerPlanets.find(
      (p) =>
        p.resources.ore >= recruitCost.ore + 100 &&
        p.resources.crystal >= recruitCost.crystal + 100 &&
        p.resources.fuel >= recruitCost.fuel + 50
    );

    if (recruitPlanet && canRecruitAgent(engine.state, playerId, recruitPlanet.id)) {
      const trait: SecretAgentTrait = (() => {
        switch (archetype) {
          case 'raider':
            return Math.random() > 0.5 ? 'saboteur' : 'provocateur';
          case 'admiral':
            return Math.random() > 0.5 ? 'saboteur' : 'master_infiltrator';
          case 'explorer':
            return Math.random() > 0.5 ? 'ghost' : 'master_infiltrator';
          case 'industrialist':
            return Math.random() > 0.5 ? 'master_infiltrator' : 'saboteur';
          case 'guardian':
          default:
            return Math.random() > 0.5 ? 'ghost' : 'provocateur';
        }
      })();

      const agentNames = ['Vesper', 'Specter', 'Cipher', 'Wraith', 'Nemesis', 'Zero', 'Eclipse', 'Nocturne'];
      const chosenName = `Agent ${agentNames[Math.floor(Math.random() * agentNames.length)]}-${Math.floor(Math.random() * 900 + 100)}`;

      const cmd: GameCommand = {
        type: 'RECRUIT_SECRET_AGENT',
        fundingPlanetId: recruitPlanet.id,
        name: chosenName,
        trait,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }
  }

  // 3. Shadow Operations Launch Evaluation
  const idleAgents = myAgents.filter((a) => a.status === 'idle');
  if (idleAgents.length > 0) {
    // Find potential targets (enemies in active wars first, else other players)
    const activeWars = getActiveWarsForPlayer(engine.state, playerId);
    let potentialTargetIds: string[] = [];

    if (activeWars.length > 0) {
      for (const w of activeWars) {
        if (w.attackerId === playerId) potentialTargetIds.push(w.defenderId);
        else potentialTargetIds.push(w.attackerId);
      }
    }

    if (potentialTargetIds.length === 0) {
      potentialTargetIds = Object.keys(engine.state.players).filter((pId) => pId !== playerId);
    }

    if (potentialTargetIds.length > 0) {
      const targetFactionId = potentialTargetIds[Math.floor(Math.random() * potentialTargetIds.length)];
      const targetPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === targetFactionId);
      const targetStarbases = Object.values(engine.state.starbases || {}).filter((s) => s.ownerId === targetFactionId);

      // Choose operation type matching archetype and directorate tier
      const candidateOps: ShadowOpType[] = ['sabotage_starbase_grid'];
      if (directorate.tier >= 2) candidateOps.push('incite_rebellion');
      if (directorate.tier >= 3) candidateOps.push('false_flag_raid');
      if (directorate.tier >= 4) candidateOps.push('assassinate_councilor');
      if (directorate.tier >= 5) candidateOps.push('orchestrate_shadow_coup');

      let chosenOpType: ShadowOpType = candidateOps[0];
      if (archetype === 'raider' && candidateOps.includes('false_flag_raid')) {
        chosenOpType = 'false_flag_raid';
      } else if (archetype === 'admiral' && targetStarbases.length > 0) {
        chosenOpType = 'sabotage_starbase_grid';
      } else if (candidateOps.includes('incite_rebellion') && targetPlanets.length > 0) {
        chosenOpType = 'incite_rebellion';
      }

      const opCost = SHADOW_OP_CONFIGS[chosenOpType].cost;
      const fundingPlanet = playerPlanets.find(
        (p) =>
          p.resources.ore >= opCost.ore + 100 &&
          p.resources.crystal >= opCost.crystal + 100 &&
          p.resources.fuel >= opCost.fuel + 50
      );

      const agent = idleAgents[0];
      const targetPlanet = targetPlanets.length > 0 ? targetPlanets[0].id : undefined;
      const targetStarbase = targetStarbases.length > 0 ? targetStarbases[0].id : undefined;

      if (
        fundingPlanet &&
        canLaunchShadowOp(
          engine.state,
          playerId,
          targetFactionId,
          chosenOpType,
          agent.id,
          targetPlanet,
          targetStarbase,
          fundingPlanet.id
        )
      ) {
        const cmd: GameCommand = {
          type: 'LAUNCH_SHADOW_OPERATION',
          targetFactionId,
          opType: chosenOpType,
          assignedAgentId: agent.id,
          targetPlanetId: targetPlanet,
          targetStarbaseId: targetStarbase,
          fundingPlanetId: fundingPlanet.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }

  // 4. False Flag Fleet Disguise Evaluation (Raider Archetype with Tier 2+ Directorate)
  if (archetype === 'raider' && directorate.tier >= 2) {
    const orbitFleets = Object.values(engine.state.fleets).filter(
      (f) => f.ownerId === playerId && f.status === 'orbiting' && !f.falseFlag?.isDisguised
    );

    if (orbitFleets.length > 0) {
      const targetFleet = orbitFleets[0];
      const cmd: GameCommand = {
        type: 'DISPATCH_FALSE_FLAG_FLEET',
        fleetId: targetFleet.id,
        disguisedAsFactionId: 'pirates',
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }
  }
}
