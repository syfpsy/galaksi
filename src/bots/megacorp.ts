import { GameEngine } from '../engine/engine';
import { CorporateHoldingType, GameCommand, ResourceType } from '../engine/types';
import { canEstablishBranchOffice } from '../engine/megacorp';

/**
 * Autonomous Bot AI for Megacorporations, Corporate Branch Offices & Commodity Futures (Phase 24)
 */
export function evaluateBotMegacorp(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  // 1. Claim any matured Commodity Futures contracts
  if (engine.state.commodityFutures) {
    for (const contract of Object.values(engine.state.commodityFutures)) {
      if (contract.buyerId === playerId && contract.isDelivered && !contract.isClaimed) {
        const cmd: GameCommand = {
          type: 'CLAIM_COMMODITY_FUTURES',
          contractId: contract.id,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 2. Industrialists convert to Megacorp if not yet converted
  if (archetype === 'industrialist' && !player.isMegacorp) {
    const cmd: GameCommand = {
      type: 'CONVERT_TO_MEGACORP',
      civics: ['trade_syndicate'],
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
    }
  }

  // 3. Evaluate Establishing Branch Offices (Only if player is Megacorp)
  if (player.isMegacorp) {
    const myBranches = Object.values(engine.state.branchOffices || {}).filter(
      (b) => b.corporationId === playerId
    );

    // Limit bot to at most 3 branch offices
    if (myBranches.length < 3) {
      // Find candidate foreign colonized planets
      const foreignPlanets = Object.values(engine.state.planets).filter(
        (p) => p.ownerId && p.ownerId !== playerId
      );

      for (const planet of foreignPlanets) {
        const check = canEstablishBranchOffice(engine.state, playerId, planet.id);
        if (check.allowed) {
          const cmd: GameCommand = {
            type: 'ESTABLISH_BRANCH_OFFICE',
            targetPlanetId: planet.id,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }

    // 4. Construct Corporate Holdings on owned branch offices
    for (const branch of myBranches) {
      if (branch.holdings.length < 3) {
        let desiredHolding: CorporateHoldingType = 'logistics_freight_hub';
        if (archetype === 'admiral') {
          desiredHolding = 'private_military_contractor';
        } else if (archetype === 'raider') {
          desiredHolding = 'mercenary_liaison';
        } else if (archetype === 'guardian') {
          desiredHolding = 'corporate_embassy';
        } else if (archetype === 'industrialist') {
          desiredHolding = branch.holdings.includes('logistics_freight_hub')
            ? 'amusement_megaplex'
            : 'logistics_freight_hub';
        }

        if (!branch.holdings.includes(desiredHolding)) {
          const cmd: GameCommand = {
            type: 'BUILD_CORPORATE_HOLDING',
            branchId: branch.id,
            holdingType: desiredHolding,
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

  // 5. Strategic Commodity Futures Hedging for Industrialist and Admiral
  const myPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = myPlanets[0];

  if (primaryPlanet && primaryPlanet.resources.fuel >= 2000) {
    // If deficient in crystal or ore, buy a futures contract to lock in future delivery
    let deficitType: ResourceType | null = null;
    if (primaryPlanet.resources.crystal < 500) {
      deficitType = 'crystal';
    } else if (primaryPlanet.resources.ore < 500) {
      deficitType = 'ore';
    }

    if (deficitType) {
      // Check if we already have an active futures contract for this resource
      const hasActive = Object.values(engine.state.commodityFutures || {}).some(
        (c) => c.buyerId === playerId && c.resourceType === deficitType && !c.isClaimed
      );

      if (!hasActive) {
        const cmd: GameCommand = {
          type: 'PURCHASE_COMMODITY_FUTURES',
          resourceType: deficitType,
          amount: 250,
          durationMinutes: 5,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
        }
      }
    }
  }
}
