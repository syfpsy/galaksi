import { GameEngine } from '../engine/engine';
import { GameCommand, FederationType, ShipType } from '../engine/types';
import { getPlayerFederation } from '../engine/federations';

/**
 * Autonomous Bot AI for Galactic Federations, Federal Fleets & Centralization Laws
 */
export function evaluateBotFederations(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const player = engine.state.players[playerId];
  if (!player || player.vacationMode) return;

  const fed = getPlayerFederation(engine.state, playerId);

  // 1. If not currently in a federation: Evaluate invitations or consider forming one
  if (!fed) {
    // Check if any federation has invited this bot
    if (engine.state.federations) {
      for (const f of Object.values(engine.state.federations)) {
        if (f.pendingInvites && f.pendingInvites.includes(playerId)) {
          let shouldAccept = false;

          if (archetype === 'admiral' && (f.type === 'martial_alliance' || f.type === 'hegemony')) {
            shouldAccept = true;
          } else if (archetype === 'industrialist' && (f.type === 'trade_league' || f.type === 'galactic_union')) {
            shouldAccept = true;
          } else if (archetype === 'explorer' && (f.type === 'research_cooperative' || f.type === 'galactic_union')) {
            shouldAccept = true;
          } else if (archetype === 'guardian' && (f.type === 'galactic_union' || f.type === 'martial_alliance')) {
            shouldAccept = true;
          } else if (archetype === 'raider' && f.type === 'hegemony') {
            shouldAccept = true;
          }

          const cmd: GameCommand = {
            type: 'RESPOND_FEDERATION_INVITE',
            federationId: f.id,
            accept: shouldAccept,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }

    // Consider founding a federation with a friendly empire or ally
    const myAllies = player.allianceId && engine.state.alliances?.[player.allianceId]
      ? engine.state.alliances[player.allianceId].memberIds.filter((id) => id !== playerId)
      : [];

    const potentialPartners = myAllies.length > 0
      ? myAllies
      : Object.keys(engine.state.players).filter(
          (pId) => pId !== playerId && !engine.state.players[pId].federationId && !engine.state.players[pId].vacationMode
        );

    if (potentialPartners.length > 0) {
      const partnerId = potentialPartners[0];
      let preferredType: FederationType = 'galactic_union';
      if (archetype === 'admiral') preferredType = 'martial_alliance';
      else if (archetype === 'industrialist') preferredType = 'trade_league';
      else if (archetype === 'explorer') preferredType = 'research_cooperative';
      else if (archetype === 'guardian') preferredType = 'galactic_union';
      else if (archetype === 'raider') preferredType = 'hegemony';

      const cmd: GameCommand = {
        type: 'FORM_FEDERATION',
        name: `${player.name} Paktı`,
        fedType: preferredType,
        invitedPlayerId: partnerId,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }

    return;
  }

  // 2. Already in a federation: Maintain cohesion with envoys
  const myEnvoys = fed.assignedEnvoys[playerId] || 0;
  if (fed.cohesion < 60 && myEnvoys < 2) {
    const cmd: GameCommand = {
      type: 'ASSIGN_FEDERATION_ENVOYS',
      federationId: fed.id,
      envoys: 2,
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
      return;
    }
  }

  // 3. Vote on active law proposals
  if (fed.activeVote && fed.activeVote.votes[playerId] === undefined) {
    const vote = fed.activeVote;
    let voteChoice: 'yes' | 'no' = 'yes';

    if (vote.lawType === 'successionType') {
      if (archetype === 'admiral' && vote.proposedValue !== 'fleet_power') voteChoice = 'no';
      if (archetype === 'industrialist' && vote.proposedValue !== 'golden_rule') voteChoice = 'no';
    }

    const cmd: GameCommand = {
      type: 'VOTE_FEDERATION_LAW',
      federationId: fed.id,
      vote: voteChoice,
    };
    const receipt = engine.dispatchCommand(playerId, cmd);
    if (receipt.success) {
      executedCommands.push(cmd);
      return;
    }
  }

  // 4. Federal Fleet Construction (President or High Centralization)
  const isPresident = fed.presidentId === playerId;
  if ((isPresident || fed.centralizationLevel >= 3)) {
    const currentFleetCount = Object.values(fed.federalFleet).reduce((a, b) => a + b, 0);
    if (currentFleetCount < fed.federalFleetCapacity) {
      const myPlanetsWithShipyard = Object.values(engine.state.planets).filter(
        (p) => p.ownerId === playerId && (p.buildings?.shipyard || 0) >= 1
      );
      if (myPlanetsWithShipyard.length > 0) {
        const planet = myPlanetsWithShipyard[0];
        // Pick fighter or battleship if rich
        const shipToBuild: ShipType = planet.resources.crystal > 300 ? 'fighter' : 'scout';
        const cmd: GameCommand = {
          type: 'BUILD_FEDERAL_SHIP',
          federationId: fed.id,
          planetId: planet.id,
          shipType: shipToBuild,
          count: 1,
        };
        const receipt = engine.dispatchCommand(playerId, cmd);
        if (receipt.success) {
          executedCommands.push(cmd);
          return;
        }
      }
    }
  }

  // 5. President: Dispatch Federal Fleet if under attack or crisis active
  if (isPresident && (fed.federalFleet.fighter || 0) >= 2) {
    // Check if any member planet is targeted or has an active enemy threat
    const myHw = Object.values(engine.state.planets).find((p) => p.ownerId === playerId && p.isHomeworld);
    const crisisTarget = engine.state.crisis && engine.state.crisis.stage !== 'dormant' && engine.state.crisis.epicenterSystemId
      ? engine.state.crisis.epicenterSystemId
      : null;

    if (crisisTarget && myHw) {
      const cmd: GameCommand = {
        type: 'DISPATCH_FEDERAL_FLEET',
        federationId: fed.id,
        originPlanetId: myHw.id,
        targetSystemId: crisisTarget,
        ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }
}
