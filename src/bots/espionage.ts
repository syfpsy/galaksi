import { GameEngine } from '../engine/engine';
import { CounterEspionageStance, CovertOpType, GameCommand, SpyAssetType } from '../engine/types';
import { COVERT_OP_CONFIGS, getSpyNetworkKey } from '../engine/espionage';

/**
 * Autonomous Bot AI for Galactic Espionage, Spy Networks, Infiltration & Covert Sabotage (Phase 23)
 */
export function evaluateBotEspionage(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  // 1. Counter-Espionage Stance Evaluation
  let targetStance: CounterEspionageStance = 'relaxed';
  if (archetype === 'guardian') {
    targetStance = 'police_state';
  } else if (archetype === 'admiral' || archetype === 'industrialist') {
    targetStance = 'surveillance';
  } else {
    targetStance = 'relaxed';
  }

  if (player.counterEspionageStance !== targetStance) {
    const cmd: GameCommand = {
      type: 'SET_COUNTER_ESPIONAGE_STANCE',
      stance: targetStance,
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
    }
  }

  // Find candidate rivals (not self, not ally, not federation member)
  const candidateTargets = Object.keys(engine.state.players).filter((pId) => {
    if (pId === playerId) return false;
    const target = engine.state.players[pId];
    if (!target || target.vacationMode) return false;
    if (player.allianceId && target.allianceId === player.allianceId) return false;
    if (player.federationId && target.federationId === player.federationId) return false;
    return true;
  });

  if (candidateTargets.length === 0) return;

  // Sort targets by score / threat
  candidateTargets.sort((a, b) => {
    const aPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === a).length;
    const bPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === b).length;
    return bPlanets - aPlanets;
  });

  const myNetworks = Object.values(engine.state.spyNetworks || {}).filter((n) => n.ownerId === playerId);

  // 2. Establish Spy Network if we have fewer than 2 active networks
  if (myNetworks.length < 2) {
    for (const targetId of candidateTargets) {
      const netKey = getSpyNetworkKey(playerId, targetId);
      if (!engine.state.spyNetworks?.[netKey]) {
        const cmd: GameCommand = {
          type: 'ESTABLISH_SPY_NETWORK',
          targetPlayerId: targetId,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 3. Manage Envoys, Assets, and Operations on existing networks
  for (const network of myNetworks) {
    // Ensure at least 1 envoy is assigned for infiltration growth
    if (network.assignedEnvoys === 0) {
      const envoysToAssign = archetype === 'raider' || archetype === 'admiral' ? 2 : 1;
      const cmd: GameCommand = {
        type: 'ASSIGN_SPYMASTER_ENVOY',
        networkId: network.id,
        envoys: envoysToAssign,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
      }
    }

    // Acquire archetype-appropriate assets if under cap (max 2 for bot)
    if (!network.assets || network.assets.length < 2) {
      let desiredAsset: SpyAssetType | null = null;
      if (archetype === 'admiral' && !network.assets?.some((a) => a.type === 'corrupt_dockworker')) {
        desiredAsset = 'corrupt_dockworker';
      } else if (archetype === 'explorer' && !network.assets?.some((a) => a.type === 'disaffected_scientist')) {
        desiredAsset = 'disaffected_scientist';
      } else if (archetype === 'industrialist' && !network.assets?.some((a) => a.type === 'shadow_smuggler')) {
        desiredAsset = 'shadow_smuggler';
      } else if (archetype === 'guardian' && !network.assets?.some((a) => a.type === 'disgruntled_bureaucrat')) {
        desiredAsset = 'disgruntled_bureaucrat';
      } else if (archetype === 'raider' && !network.assets?.some((a) => a.type === 'shadow_smuggler')) {
        desiredAsset = 'shadow_smuggler';
      }

      if (desiredAsset) {
        const cmd: GameCommand = {
          type: 'ACQUIRE_SPY_ASSET',
          networkId: network.id,
          assetType: desiredAsset,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }

    // Launch Covert Operation if none is in progress
    const activeOp = Object.values(engine.state.covertOperations || {}).find(
      (o) => o.networkId === network.id && o.status === 'in_progress'
    );

    if (!activeOp) {
      // Determine preferred operation based on infiltration level & archetype
      const inf = network.infiltrationLevel;
      let preferredOp: CovertOpType | null = null;

      if (archetype === 'raider') {
        if (inf >= COVERT_OP_CONFIGS.arm_insurgents.requiredInfiltration) preferredOp = 'arm_insurgents';
        else if (inf >= COVERT_OP_CONFIGS.destabilize_economy.requiredInfiltration) preferredOp = 'destabilize_economy';
        else if (inf >= COVERT_OP_CONFIGS.gather_intel.requiredInfiltration) preferredOp = 'gather_intel';
      } else if (archetype === 'admiral') {
        if (inf >= COVERT_OP_CONFIGS.sabotage_starbase.requiredInfiltration) preferredOp = 'sabotage_starbase';
        else if (inf >= COVERT_OP_CONFIGS.gather_intel.requiredInfiltration) preferredOp = 'gather_intel';
      } else if (archetype === 'explorer') {
        if (inf >= COVERT_OP_CONFIGS.steal_technology.requiredInfiltration) preferredOp = 'steal_technology';
        else if (inf >= COVERT_OP_CONFIGS.gather_intel.requiredInfiltration) preferredOp = 'gather_intel';
      } else if (archetype === 'industrialist') {
        if (inf >= COVERT_OP_CONFIGS.destabilize_economy.requiredInfiltration) preferredOp = 'destabilize_economy';
        else if (inf >= COVERT_OP_CONFIGS.gather_intel.requiredInfiltration) preferredOp = 'gather_intel';
      } else {
        if (inf >= COVERT_OP_CONFIGS.diplomatic_incident.requiredInfiltration) preferredOp = 'diplomatic_incident';
        else if (inf >= COVERT_OP_CONFIGS.extort_favor.requiredInfiltration) preferredOp = 'extort_favor';
        else if (inf >= COVERT_OP_CONFIGS.gather_intel.requiredInfiltration) preferredOp = 'gather_intel';
      }

      if (preferredOp) {
        // Find matching asset if any
        const matchingAsset = network.assets?.find((a) => {
          if (preferredOp === 'sabotage_starbase' && a.type === 'corrupt_dockworker') return true;
          if (preferredOp === 'steal_technology' && a.type === 'disaffected_scientist') return true;
          if (
            (preferredOp === 'diplomatic_incident' || preferredOp === 'extort_favor') &&
            a.type === 'disgruntled_bureaucrat'
          )
            return true;
          if (
            (preferredOp === 'destabilize_economy' || preferredOp === 'arm_insurgents') &&
            a.type === 'shadow_smuggler'
          )
            return true;
          return false;
        });

        // Pick target planet
        const targetPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === network.targetPlayerId);
        const targetPlanetId = targetPlanets[0]?.id;

        const cmd: GameCommand = {
          type: 'LAUNCH_COVERT_OPERATION',
          networkId: network.id,
          opType: preferredOp,
          targetPlanetId,
          assignedAssetId: matchingAsset?.id,
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
