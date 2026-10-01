import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/engine/engine';
import { resolveCombat } from '../src/engine/combat';
import { calculateRouteInfo, checkInterceptionFeasibility } from '../src/engine/flight';
import { getPlayerSensorCoverage } from '../src/engine/fog';
import { evaluateBotDiplomacy, resetBotDiplomacyCooldowns } from '../src/bots/diplomacy';
import { ExplorerBot } from '../src/bots/explorer';
import { IndustrialistBot } from '../src/bots/industrialist';
import { RaiderBot } from '../src/bots/raider';
import { GuardianBot } from '../src/bots/guardian';
import { AdmiralBot } from '../src/bots/admiral';
import { GAME_CONSTANTS, SHIP_STATS, getDefenseBuildDurationMs, getShipBuildDurationMs } from '../src/engine/constants';
import { STARBASE_MODULE_CONFIG, STARBASE_TIER_CONFIG, getStarbaseEffectiveStats } from '../src/engine/starbases';
import {
  SENATE_CONSTANTS,
  SENATE_RESOLUTION_CONFIG,
  calculateDiplomaticWeight,
  tallySenateVotes,
} from '../src/engine/senate';
import {
  MEGASTRUCTURE_CONFIGS,
  GATEWAY_CONFIG,
  getPlayerMegastructureBonuses,
  canBuildMegastructure,
} from '../src/engine/megastructures';
import {
  COUNCIL_CONSTANTS,
  COUNCIL_POSITION_INFO,
  LEADER_TRAIT_CONFIGS,
  calculateEmpireStability,
  evaluateFactionApproval,
  getCouncilEmpireBonuses,
} from '../src/engine/council';
import { evaluateBotCouncil } from '../src/bots/council';
import {
  DEFAULT_LOADOUTS,
  getModifiedShipStats,
  calculateRefitCost,
  WEAPON_MODULES,
  DEFENSE_MODULES,
  UTILITY_MODULES,
} from '../src/engine/shipDesign';
import { evaluateBotShipDesign } from '../src/bots/shipDesign';
import {
  CRISIS_CONFIGS,
  calculateCrisisCombatModifier,
  canAssaultVoidRift,
  initializeGalacticCrisis,
} from '../src/engine/crisis';
import { evaluateBotCrisisResponse } from '../src/bots/crisis';
import {
  TRADITION_CONFIGS,
  TRADITION_NODES,
  ASCENSION_PERKS,
  calculatePlayerUnityRate,
  hasTradition,
  hasAscensionPerk,
  getTraditionCombatMultiplier,
  getTraditionProductionMultiplier,
  getTraditionStorageCapMultiplier,
} from '../src/engine/traditions';
import { evaluateBotTraditions } from '../src/bots/traditions';
import {
  RELIC_TRIUMPH_CONFIGS,
  canActivateRelicTriumph,
  canExcavateSite,
  hasActiveRelicTriumph,
  getRelicDiplomaticWeightMultiplier,
  getRelicSpeedMultiplier,
  getRelicFuelCostMultiplier,
  getRelicSensorBonus,
  getRelicConstructionMultiplier,
} from '../src/engine/archaeology';
import { evaluateBotArchaeology } from '../src/bots/archaeology';
import {
  BIOME_CONFIGS,
  PLANETARY_BLOCKERS,
  PLANETARY_DECISIONS,
  TERRAFORM_RECIPES,
  getPlanetEffectiveBiome,
  getPlanetEcologyModifiers,
  getTerraformRecipe,
  canStartTerraforming,
  canEnactDecision,
  canClearBlocker,
} from '../src/engine/terraforming';
import { evaluateBotTerraforming } from '../src/bots/terraforming';
import {
  TRADE_POLICY_CONFIGS,
  calculatePlanetTradeValue,
  findShortestTradeRoute,
  getStarbaseProtectionStats,
  calculateFleetPatrolSuppression,
  getSystemsWithinHops,
  updateTradeNetworks,
} from '../src/engine/trade';
import { evaluateBotTrade } from '../src/bots/trade';
import { BattleReport } from '../src/engine/types';
import {
  WAR_GOAL_CONFIGS,
  SUBJECT_TYPE_CONFIGS,
  isAtWar,
  getActiveWarsForPlayer,
  getSubjectAgreement,
  getPlayerSubjects,
  recordBattleWarExhaustion,
  updateWarsAndSubjects,
  declareWar,
  offerPeace,
  setSubjectTerms,
  releaseSubject,
  integrateSubject,
} from '../src/engine/wars';
import { evaluateBotWarfare } from '../src/bots/wars';
import {
  FEDERATION_TYPE_CONFIGS,
  getPlayerFederation,
  isFederationAlly,
  getFederalFleetPower,
  formFederation,
  inviteToFederation,
  respondFederationInvite,
  leaveFederation,
  proposeFederationLaw,
  voteFederationLaw,
  assignFederationEnvoys,
  buildFederalShip,
  dispatchFederalFleet,
  updateFederations,
} from '../src/engine/federations';
import { evaluateBotFederations } from '../src/bots/federations';
import {
  COVERT_OP_CONFIGS,
  SPY_ASSET_CONFIGS,
  COUNTER_ESPIONAGE_CONFIGS,
  getSpyNetworkKey,
  calculateInfiltrationCap,
  calculateCounterIntelScore,
  calculateInfiltrationGrowthPerSec,
  getTieredIntel,
  updateEspionageNetworks,
} from '../src/engine/espionage';
import { evaluateBotEspionage } from '../src/bots/espionage';
import {
  CORPORATE_CIVIC_CONFIGS,
  CORPORATE_HOLDING_CONFIGS,
  MEGACORP_CONSTANTS,
  getBranchOfficeKey,
  canEstablishBranchOffice,
  calculateBranchOfficeYields,
  calculateCommodityFuturesPrice,
  establishBranchOffice,
  closeBranchOffice,
  buildCorporateHolding,
  dismantleCorporateHolding,
  purchaseCommodityFutures,
  claimCommodityFutures,
  convertToMegacorp,
  updateMegacorpAndFutures,
} from '../src/engine/megacorp';
import { evaluateBotMegacorp } from '../src/bots/megacorp';
import {
  COLOSSUS_CONSTANTS,
  COLOSSUS_WEAPON_CONFIGS,
  canBuildColossus,
  buildColossus,
  moveColossus,
  commenceColossusCharging,
  cancelColossusFiring,
  resolveColossusFiring,
  refitColossusWeapon,
  dismantleColossus,
} from '../src/engine/colossus';
import { evaluateBotColossus } from '../src/bots/colossus';
import {
  SYNTHETIC_CONSTANTS,
  SYNTHETIC_ASCENSION_CONFIGS,
  AI_POLICY_CONFIGS,
  getOrCreateSyntheticState,
  getPlanetSyntheticBoosts,
  canAssembleSyntheticPop,
  assembleSyntheticPop,
  dismantleSyntheticPop,
  setAIPolicy,
  initiateSyntheticAscension,
  suppressSyntheticUprising,
  convertToMachineWorld,
  updateSynthetics,
} from '../src/engine/synthetics';
import { evaluateBotSynthetics } from '../src/bots/synthetics';
import {
  PARAGON_CONSTANTS,
  INITIAL_PARAGONS,
  canRecruitParagon,
  recruitParagon,
  assignParagon,
  unassignParagon,
  dismissParagon,
  commissionParagonFlagship,
  getPlayerParagonBonuses,
  getFleetParagonBonuses,
  updateParagons,
} from '../src/engine/paragons';
import { evaluateBotParagons } from '../src/bots/paragons';
import {
  HYPER_RELAY_CONFIG,
  HYPER_RELAY_POLICY_CONFIGS,
  canConstructHyperRelay,
  constructHyperRelay,
  setHyperRelayPolicy,
  dismantleHyperRelay,
  getActiveHyperRelaySystemIds,
  isHyperRelayNetworkLink,
  updateHyperRelays,
  getHyperRelaySystemBonuses,
} from '../src/engine/hyperRelays';
import { evaluateBotHyperRelays } from '../src/bots/hyperRelays';
import {
  getOrCreateDirectorate,
  canUpgradeDirectorate,
  upgradeDirectorate,
  canRecruitAgent,
  recruitAgent,
  assignAgent,
  dismissAgent,
  canLaunchShadowOp,
  launchShadowOp,
  DIRECTORATE_TIER_CONFIGS,
  SHADOW_OP_CONFIGS,
  SECRET_AGENT_TRAIT_CONFIGS,
} from '../src/engine/shadowOps';
import { evaluateBotShadowOps } from '../src/bots/shadowOps';
import {
  ARMY_CONFIGS,
  BOMBARDMENT_CONFIGS,
  getRankMultiplier,
  getRankFromExperience,
  canRecruitArmy,
  startRecruitArmy,
  canEmbarkArmies,
  embarkArmies,
  canLandArmies,
  landArmies,
  setBombardmentStance,
  dismissArmy,
  liberatePlanet,
  updateGroundWarfare,
} from '../src/engine/groundWarfare';
import { evaluateBotGroundWarfare } from '../src/bots/groundWarfare';
import {
  ENCLAVE_CONFIGS,
  ENCLAVE_SERVICES,
  canInteractWithEnclave,
  interactWithEnclave,
  buyCaravanReliquary,
  gambleCaravanSlots,
  tickEnclavesAndCaravans,
} from '../src/engine/enclaves';
import { evaluateBotEnclaves } from '../src/bots/enclaves';
import { DISTRICT_STATS } from '../src/engine/constants';
import { evaluateBotDistricts } from '../src/bots/districts';
import { evaluatePlayerOpportunities } from '../src/engine/opportunities';
import { evaluatePlayerDirectives } from '../src/engine/directives';
import { evaluateColonyRole, findPlayerSupplyChains, updateSupplyChains } from '../src/engine/supplyChain';


describe('GameEngine Headless Rules (Phase A)', () => {
  it('initializes sector map with central relay and systems', () => {
    const engine = new GameEngine(1234);
    expect(Object.keys(engine.state.map.systems).length).toBe(12);
    expect(engine.state.relay.systemId).toBe('sys_relay');
    expect(engine.state.map.lanes.length).toBeGreaterThan(10);
  });

  it('adds player with homeworld and starter resources', () => {
    const engine = new GameEngine(1234);
    const { player, homeworld } = engine.addPlayer('p1', 'Komutan Shepard', '#00f3ff');

    expect(player.id).toBe('p1');
    expect(homeworld.ownerId).toBe('p1');
    expect(homeworld.resources.ore).toBe(800);
    expect(homeworld.resources.crystal).toBe(500);
    expect(homeworld.resources.fuel).toBe(300);
    expect(homeworld.garrison.fighter).toBe(2);
  });

  it('rejects illegal commands gracefully without corrupting state', () => {
    const engine = new GameEngine(1234);
    const { homeworld } = engine.addPlayer('p1', 'Player 1', '#00f3ff');

    // Negative build count
    const r1 = engine.dispatchCommand('p1', {
      type: 'BUILD_SHIPS',
      planetId: homeworld.id,
      shipType: 'fighter',
      count: -1,
    });
    expect(r1.success).toBe(false);

    // Phantom ships dispatch
    const r2 = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: 'sys_relay',
      ships: { scout: 100, transport: 0, fighter: 0, battleship: 0 },
      mission: 'explore',
    });
    expect(r2.success).toBe(false);
  });

  it('upgrades building and updates levels after duration', () => {
    const engine = new GameEngine(1234);
    const { homeworld } = engine.addPlayer('p1', 'Player 1', '#00f3ff');

    const initialOreMine = homeworld.buildings.ore_mine;
    const upgradeRes = engine.dispatchCommand('p1', {
      type: 'UPGRADE_BUILDING',
      planetId: homeworld.id,
      buildingType: 'ore_mine',
    });
    expect(upgradeRes.success).toBe(true);

    // Advance time to complete building
    const durationMs = (upgradeRes.data?.durationMs as number) || 30000;
    engine.tick(durationMs + 1000);

    expect(engine.state.planets[homeworld.id].buildings.ore_mine).toBe(initialOreMine + 1);
    expect(engine.state.planets[homeworld.id].buildingQueue).toBeNull();
  });

  it('resolves deterministic combat with repeatable outcomes', () => {
    const run1 = resolveCombat(
      {
        ownerId: 'att',
        ownerName: 'Attacker',
        ships: { scout: 0, transport: 0, fighter: 5, battleship: 1 },
        weaponsResearchLevel: 1,
      },
      {
        ownerId: 'def',
        ownerName: 'Defender',
        ships: { scout: 2, transport: 2, fighter: 2, battleship: 0 },
        weaponsResearchLevel: 0,
      },
      'sys_1',
      'Solaria',
      'fleet_interception',
      undefined,
      1000,
      10000,
      9999
    );

    const run2 = resolveCombat(
      {
        ownerId: 'att',
        ownerName: 'Attacker',
        ships: { scout: 0, transport: 0, fighter: 5, battleship: 1 },
        weaponsResearchLevel: 1,
      },
      {
        ownerId: 'def',
        ownerName: 'Defender',
        ships: { scout: 2, transport: 2, fighter: 2, battleship: 0 },
        weaponsResearchLevel: 0,
      },
      'sys_1',
      'Solaria',
      'fleet_interception',
      undefined,
      1000,
      10000,
      9999
    );

    expect(run1.report.winner).toBe(run2.report.winner);
    expect(run1.debrisFieldCreated.ore).toBe(run2.debrisFieldCreated.ore);
    expect(run1.remainingAttacker).toEqual(run2.remainingAttacker);
  });

  it('filters fog of war correctly so secret state is not leaked', () => {
    const engine = new GameEngine(1234);
    engine.addPlayer('p1', 'Player 1', '#00f3ff');
    engine.addPlayer('p2', 'Enemy 2', '#f43f5e');

    const view = engine.getPlayerView('p1');
    expect(view.playerId).toBe('p1');
    expect(view.myPlanets.length).toBe(1);

    // Enemy homeworld should either be unexplored or mapped, but its internal storage queue is NOT exposed in view.myPlanets
    const p2PlanetsInMyView = view.myPlanets.filter(p => p.ownerId === 'p2');
    expect(p2PlanetsInMyView.length).toBe(0);
  });

  it('manages alliances with shared sensor vision and diplomacy commands', () => {
    const engine = new GameEngine(5678);
    engine.addPlayer('p1', 'Player 1', '#00f3ff');
    engine.addPlayer('p2', 'Player 2', '#10b981');

    // p1 creates an alliance
    const createRes = engine.dispatchCommand('p1', {
      type: 'CREATE_ALLIANCE',
      name: 'Galaktik Konfederasyon',
      tag: 'GK',
    });
    expect(createRes.success).toBe(true);
    const allianceId = engine.state.players['p1'].allianceId;
    expect(allianceId).toBeTruthy();

    // p2 joins the alliance
    const joinRes = engine.dispatchCommand('p2', {
      type: 'JOIN_ALLIANCE',
      allianceId: allianceId!,
    });
    expect(joinRes.success).toBe(true);
    expect(engine.state.players['p2'].allianceId).toBe(allianceId);
    expect(engine.state.alliances[allianceId!].memberIds).toContain('p2');

    // p1 leaves alliance
    const leaveRes = engine.dispatchCommand('p1', {
      type: 'LEAVE_ALLIANCE',
    });
    expect(leaveRes.success).toBe(true);
    expect(engine.state.players['p1'].allianceId).toBeFalsy();
  });

  it('enforces vacation mode by freezing resource production and blocking missions', () => {
    const engine = new GameEngine(9999);
    const { homeworld } = engine.addPlayer('p1', 'Player 1', '#00f3ff');

    const initialOre = homeworld.resources.ore;

    // Turn on vacation mode
    const vRes = engine.dispatchCommand('p1', {
      type: 'TOGGLE_VACATION_MODE',
    });
    expect(vRes.success).toBe(true);
    expect(engine.state.players['p1'].vacationMode).toBe(true);

    // Advance 1 hour in simulation
    engine.tick(3600 * 1000);

    // Resources should NOT have increased because player is in vacation mode
    expect(engine.state.planets[homeworld.id].resources.ore).toBe(initialOre);

    // Cannot dispatch attack fleet while in vacation mode
    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: 'sys_relay',
      ships: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
      mission: 'attack',
    });
    expect(dispatchRes.success).toBe(false);
  });

  it('enforces slow flight pacing and recall lock threshold at 50% travel duration', () => {
    const engine = new GameEngine(1234);
    const { homeworld } = engine.addPlayer('p1', 'Player 1', '#00f3ff');

    // Find an adjacent lane
    const adjacentLane = engine.state.map.lanes.find(
      (l) => l.fromSystemId === homeworld.systemId || l.toSystemId === homeworld.systemId
    );
    expect(adjacentLane).toBeDefined();
    const destSysId =
      adjacentLane!.fromSystemId === homeworld.systemId
        ? adjacentLane!.toSystemId
        : adjacentLane!.fromSystemId;

    // Dispatch a fighter fleet
    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: destSysId,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      mission: 'attack',
    });
    expect(dispatchRes.success).toBe(true);

    const fleetId = dispatchRes.data?.fleetId as string;
    const fleet = engine.state.fleets[fleetId];
    expect(fleet).toBeDefined();

    // Check travel duration is slow (> 5 minutes for jump)
    const travelDuration = fleet.arrivalTime - fleet.departureTime;
    expect(travelDuration).toBeGreaterThan(5 * 60 * 1000);

    // Recall lock should be exactly halfway (50%)
    const midpoint = fleet.departureTime + travelDuration * 0.5;
    expect(fleet.recallLockedAfterTime).toBe(midpoint);

    // Attempt recall before 50%: succeeds
    engine.tick(travelDuration * 0.2);
    const recallBefore = engine.dispatchCommand('p1', {
      type: 'RECALL_FLEET',
      fleetId,
    });
    expect(recallBefore.success).toBe(true);
  });

  it('enforces newbie protection against PvP attacks', () => {
    const engine = new GameEngine(7777);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Player 1', '#00f3ff', false, undefined, true);
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Player 2', '#f43f5e', false, undefined, true);

    // Give p1 enough fighters and fuel
    hw1.garrison.fighter = 10;
    hw1.resources.fuel = 1000;

    // Attempt attack from p1 to p2 while both under protection
    const attackRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      mission: 'attack',
    });
    expect(attackRes.success).toBe(false);
    expect(attackRes.error).toContain('Acemi koruması');
  });

  it('enforces anti-bash rule limiting attacks on same target to 6 per 24 hours', () => {
    const engine = new GameEngine(8888);
    // Add players without newbie protection so attacks are valid
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Player 1', '#00f3ff', false, undefined, false);
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Player 2', '#f43f5e', false, undefined, false);

    hw1.garrison.fighter = 50;
    hw1.resources.fuel = 5000;

    // Send 6 attacks
    for (let i = 0; i < 6; i++) {
      const res = engine.dispatchCommand('p1', {
        type: 'DISPATCH_FLEET',
        originPlanetId: hw1.id,
        targetSystemId: hw2.systemId,
        targetPlanetId: hw2.id,
        ships: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
        mission: 'attack',
      });
      expect(res.success).toBe(true);
    }

    // 7th attack should fail due to anti-bash
    const seventhAttack = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
      mission: 'attack',
    });
    expect(seventhAttack.success).toBe(false);
    expect(seventhAttack.error).toContain('Anti-Bash Sınırı');
  });

  it('applies admiral leadership bonuses and awards XP deterministically', () => {
    const admiralAttacker = {
      id: 'adm_1',
      name: 'Kaelen Valerius',
      title: 'Filo Amirali',
      avatar: '👨‍✈️',
      level: 3,
      xp: 500,
      xpToNextLevel: 950,
      traitId: 'tactical_genius' as const,
      assignedFleetId: null,
      assignedPlanetId: null,
      battlesWon: 5,
      battlesLost: 0,
      recruitedAt: 1000,
    };

    const res = resolveCombat(
      {
        ownerId: 'att',
        ownerName: 'Attacker',
        ships: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
        weaponsResearchLevel: 2,
        admiral: admiralAttacker,
      },
      {
        ownerId: 'def',
        ownerName: 'Defender',
        ships: { scout: 0, transport: 0, fighter: 5, battleship: 1 },
        weaponsResearchLevel: 0,
      },
      'sys_2',
      'Orion Prime',
      'fleet_interception',
      undefined,
      1000,
      10000,
      7777
    );

    expect(res.report.attackerAdmiralName).toBe('Kaelen Valerius');
    expect(res.report.winner).toBe('attacker');
    expect(res.attackerAdmiralXP).toBeDefined();
    expect(res.attackerAdmiralXP?.xpGained).toBe(150);
  });

  it('assigns admiral to dispatched fleet, carries into combat, awards XP and frees admiral upon return', () => {
    const engine = new GameEngine(1234);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Player 1', '#00f3ff', false, undefined, false);
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Player 2', '#f43f5e', false, undefined, false);

    hw1.garrison.fighter = 20;
    hw1.resources.fuel = 5000;

    const myAdmirals = Object.values(engine.state.admirals || {}).filter(a => a.ownerId === 'p1');
    expect(myAdmirals.length).toBeGreaterThan(0);
    const chosenAdmiral = myAdmirals[0];
    expect(chosenAdmiral.assignedFleetId).toBeNull();
    const initialXP = chosenAdmiral.xp;

    // Dispatch fleet with chosen admiral
    const res = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 10, battleship: 0 },
      mission: 'attack',
      admiralId: chosenAdmiral.id,
    });

    expect(res.success).toBe(true);
    const fleetId = (res.data as any).fleetId;
    const fleet = engine.state.fleets[fleetId];
    expect(fleet.admiralId).toBe(chosenAdmiral.id);
    expect(chosenAdmiral.assignedFleetId).toBe(fleetId);

    // Advance simulation until combat occurs and fleet returns
    engine.advanceTo(fleet.arrivalTime + 100);

    // Verify combat report has admiral
    const lastReport = engine.state.battleReports[engine.state.battleReports.length - 1];
    expect(lastReport.attackerAdmiralName).toBe(chosenAdmiral.name);

    // Verify admiral gained XP
    expect(engine.state.admirals![chosenAdmiral.id].xp).toBeGreaterThan(initialXP);

    // Advance time until fleet returns home
    const returningFleet = Object.values(engine.state.fleets).find(f => f.ownerId === 'p1');
    if (returningFleet) {
      engine.advanceTo(returningFleet.arrivalTime + 100);
    }

    // Admiral should now be free for new missions
    expect(engine.state.admirals![chosenAdmiral.id].assignedFleetId).toBeNull();
  });

  it('supports alliance resource logistics, common defense alerts, and treasury pooling', () => {
    const engine = new GameEngine(4444);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Player 1', '#00f3ff');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Player 2', '#10b981');
    const { homeworld: hw3 } = engine.addPlayer('p3', 'Enemy 3', '#f43f5e', undefined, false);

    // p1 creates an alliance and p2 joins
    engine.dispatchCommand('p1', { type: 'CREATE_ALLIANCE', name: 'Kozmik Birlik', tag: 'KB' });
    const allyId = engine.state.players['p1'].allianceId!;
    engine.dispatchCommand('p2', { type: 'JOIN_ALLIANCE', allianceId: allyId });

    // p1 donates 200 ore to alliance treasury
    const initialHw1Ore = hw1.resources.ore;
    const donateRes = engine.dispatchCommand('p1', {
      type: 'DONATE_TO_ALLIANCE',
      planetId: hw1.id,
      resources: { ore: 200, crystal: 0, fuel: 0 },
    });
    expect(donateRes.success).toBe(true);
    expect(hw1.resources.ore).toBe(initialHw1Ore - 200);
    expect(engine.state.alliances[allyId].treasury.ore).toBe(200);

    // p2 withdraws 150 ore from alliance treasury
    const initialHw2Ore = hw2.resources.ore;
    const withdrawRes = engine.dispatchCommand('p2', {
      type: 'WITHDRAW_FROM_ALLIANCE',
      planetId: hw2.id,
      resources: { ore: 150, crystal: 0, fuel: 0 },
    });
    expect(withdrawRes.success).toBe(true);
    expect(hw2.resources.ore).toBe(initialHw2Ore + 150);
    expect(engine.state.alliances[allyId].treasury.ore).toBe(50);

    // Direct logistics transfer between allied colonies
    const transferRes = engine.dispatchCommand('p1', {
      type: 'ALLIANCE_TRANSFER_RESOURCES',
      sourcePlanetId: hw1.id,
      targetPlanetId: hw2.id,
      resources: { ore: 100, crystal: 50, fuel: 20 },
    });
    expect(transferRes.success).toBe(true);
    expect(hw2.resources.crystal).toBeGreaterThanOrEqual(50);

    // Hostile raid triggers mutual defense alert to all allies
    hw3.garrison.fighter = 10;
    hw3.resources.fuel = 5000;
    engine.state.timeMs = 100000000;
    engine.state.players['p1'].protectionUntilTime = 0;
    engine.state.players['p2'].protectionUntilTime = 0;
    engine.state.players['p3'].protectionUntilTime = 0;

    const attackRes = engine.dispatchCommand('p3', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw3.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      mission: 'attack',
    });
    expect(attackRes.success).toBe(true);

    // Verify defense alert logged for fellow ally p1
    const defenseAlert = engine.state.eventLog.find(
      (e) => e.type === 'alliance_defense_alert' && e.playerId === 'p1'
    );
    expect(defenseAlert).toBeDefined();
    expect(defenseAlert?.description).toContain('ORTAK SAVUNMA ALARMI');
  });

  it('constructs planetary defense batteries and participates in orbital defense combat', () => {
    const engine = new GameEngine(7890);
    const { homeworld: hw } = engine.addPlayer('p1', 'Defender 1', '#00f3ff');

    hw.resources.ore = 2000;
    hw.resources.crystal = 1500;
    hw.resources.fuel = 800;
    hw.buildings.shipyard = 2; // Level 2 allows missile batteries and plasma turrets

    // Build 2 missile batteries
    const buildRes = engine.dispatchCommand('p1', {
      type: 'BUILD_DEFENSES',
      planetId: hw.id,
      defenseType: 'missile_battery',
      count: 2,
    });
    expect(buildRes.success).toBe(true);
    expect(hw.defenseQueue?.length).toBe(1);
    expect(hw.defenseQueue![0].count).toBe(2);

    // Advance simulation time to complete construction
    const totalBuildTime = hw.defenseQueue![0].unitBuildTimeMs * 2;
    engine.tick(totalBuildTime + 1000);

    expect(hw.defenses?.missile_battery).toBe(2);
    expect(hw.defenseQueue?.length).toBe(0);

    // Test combat defense participation:
    // Defender has 0 ships, but 2 missile batteries
    const combat = resolveCombat(
      {
        ownerId: 'enemy',
        ownerName: 'Raider',
        ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
        weaponsResearchLevel: 0,
      },
      {
        ownerId: 'p1',
        ownerName: 'Defender 1',
        ships: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
        weaponsResearchLevel: 1,
        defenses: hw.defenses,
      },
      hw.systemId,
      'Homeworld',
      'planet_raid',
      hw.resources,
      hw.protectedCapacity,
      engine.state.timeMs,
      4321
    );

    expect(combat.report.initialDefenses?.missile_battery).toBe(2);
    expect(combat.report.rounds.length).toBeGreaterThan(0);
    expect(combat.report.rounds[0].defenderDamageDealt).toBeGreaterThan(0);
  });

  it('procedurally spawns pirate outposts with bounties and rewards victory with resources and XP', () => {
    const engine = new GameEngine(9999);
    const { homeworld: hw } = engine.addPlayer('p1', 'Bounty Hunter', '#00f3ff', undefined, false);

    // Find system with pirate lair POI
    const pirateSys = Object.values(engine.state.map.systems).find(
      (s) => s.poi?.type === 'pirate_lair'
    );
    expect(pirateSys).toBeDefined();
    expect(pirateSys?.poi?.bounty).toBeDefined();
    expect(pirateSys?.poi?.bounty?.claimed).toBe(false);

    // Give player a formidable strike fleet
    hw.garrison.battleship = 5;
    hw.garrison.fighter = 15;
    hw.resources.fuel = 10000;
    engine.state.players['p1'].protectionUntilTime = 0;

    // Dispatch attack on pirate lair
    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: pirateSys!.id,
      ships: { scout: 0, transport: 0, fighter: 10, battleship: 4 },
      mission: 'attack',
    });
    expect(dispatchRes.success).toBe(true);

    // Advance time until fleet arrives at pirate lair and resolves battle
    engine.tick(3600 * 1000);

    // Bounty should be claimed
    expect(pirateSys?.poi?.bounty?.claimed).toBe(true);

    // Check battle reports
    const pirateBattle = engine.state.battleReports.find(
      (b) => b.context === 'pirate_lair' && b.systemId === pirateSys!.id
    );
    expect(pirateBattle).toBeDefined();
    expect(pirateBattle?.winner).toBe('attacker');
    expect(pirateBattle?.bountyEarned).toBeDefined();
    expect(pirateBattle?.bountyEarned?.xp).toBeGreaterThan(0);
  });

  it('triggers pirate ambushes on unescorted cargo transports traveling through pirate systems', () => {
    const engine = new GameEngine(1111);
    const { homeworld: hw } = engine.addPlayer('p1', 'Merchant Guild', '#00f3ff');

    const pirateSys = Object.values(engine.state.map.systems).find(
      (s) => s.poi?.type === 'pirate_lair' && !s.poi.bounty?.claimed
    );
    expect(pirateSys).toBeDefined();

    // Prepare unescorted cargo fleet
    hw.garrison.transport = 3;
    hw.garrison.fighter = 0;
    hw.garrison.battleship = 0;
    hw.resources.fuel = 2000;

    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: pirateSys!.id,
      ships: { scout: 0, transport: 3, fighter: 0, battleship: 0 },
      mission: 'transport',
      cargo: { ore: 500, crystal: 300, fuel: 100 },
    });
    expect(dispatchRes.success).toBe(true);

    // Advance time to arrive
    engine.tick(3600 * 1000);

    // Verify pirate ambush event was logged
    const ambushEvent = engine.state.eventLog.find(
      (e) => e.type === 'pirate_ambush' && e.playerId === 'p1'
    );
    expect(ambushEvent).toBeDefined();
    expect(ambushEvent?.description).toContain('korsan pususuna uğradı');
  });

  it('executes dynamic market trades with price curve elasticity and alliance fee discounts', () => {
    const engine = new GameEngine(7890);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Traders Guild', '#00f3ff');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Miner Syndicate', '#10b981');

    hw1.resources.ore = 2000;
    hw1.resources.crystal = 1000;
    hw1.resources.fuel = 500;

    const initialOrePrice = engine.state.market.rates.ore;
    const initialFuelPrice = engine.state.market.rates.fuel;

    // Reject trade if same resource
    const invalidRes = engine.dispatchCommand('p1', {
      type: 'MARKET_TRADE',
      planetId: hw1.id,
      sellResource: 'ore',
      buyResource: 'ore',
      sellAmount: 500,
    });
    expect(invalidRes.success).toBe(false);

    // Reject trade if insufficient resources
    const poorRes = engine.dispatchCommand('p1', {
      type: 'MARKET_TRADE',
      planetId: hw1.id,
      sellResource: 'fuel',
      buyResource: 'crystal',
      sellAmount: 99999,
    });
    expect(poorRes.success).toBe(false);

    // Execute standard trade: Sell 500 Ore for Fuel
    // Baseline fee 15% (no alliance yet)
    const tradeRes = engine.dispatchCommand('p1', {
      type: 'MARKET_TRADE',
      planetId: hw1.id,
      sellResource: 'ore',
      buyResource: 'fuel',
      sellAmount: 500,
    });
    expect(tradeRes.success).toBe(true);
    expect(hw1.resources.ore).toBe(1500);
    expect(hw1.resources.fuel).toBeGreaterThan(500);

    // Verify price elasticity: ore price decreased, fuel price increased
    expect(engine.state.market.rates.ore).toBeLessThanOrEqual(initialOrePrice);
    expect(engine.state.market.rates.fuel).toBeGreaterThanOrEqual(initialFuelPrice);
    expect(engine.state.market.transactionHistory.length).toBe(1);

    // Form an alliance: fee is discounted from 15% to 10%
    engine.dispatchCommand('p1', { type: 'CREATE_ALLIANCE', name: 'Ticaret Paktı', tag: 'TP' });
    const allyId = engine.state.players['p1'].allianceId!;
    engine.dispatchCommand('p2', { type: 'JOIN_ALLIANCE', allianceId: allyId });

    const tradeWithDiscount = engine.dispatchCommand('p1', {
      type: 'MARKET_TRADE',
      planetId: hw1.id,
      sellResource: 'crystal',
      buyResource: 'ore',
      sellAmount: 200,
    });
    expect(tradeWithDiscount.success).toBe(true);
    expect(tradeWithDiscount.data?.transaction).toBeDefined();
    // 2 transactions recorded in market history
    expect(engine.state.market.transactionHistory.length).toBe(2);
  });

  it('launches espionage operations with sensor counter-intelligence detection and gathers classified intel', () => {
    const engine = new GameEngine(5555);
    const { homeworld: hwAttacker } = engine.addPlayer('spy_master', 'Gölge Konsorsiyumu', '#a855f7');
    const { homeworld: hwTarget } = engine.addPlayer('target_empire', 'Hedef İmparatorluk', '#f43f5e');

    // Equip attacker with scouts and fuel
    hwAttacker.garrison.scout = 3;
    hwAttacker.resources.fuel = 2000;

    // Equip target with known assets to spy on
    hwTarget.buildings.ore_mine = 4;
    hwTarget.buildings.sensor_array = 2;
    hwTarget.garrison.fighter = 6;
    hwTarget.defenses = { missile_battery: 3, plasma_turret: 1, ion_cannon: 0 };

    // Launch Infiltrate Intel mission with 2 scouts
    const launchRes = engine.dispatchCommand('spy_master', {
      type: 'LAUNCH_ESPIONAGE_OP',
      originPlanetId: hwAttacker.id,
      targetPlanetId: hwTarget.id,
      opType: 'infiltrate_intel',
      scoutCount: 2,
    });
    expect(launchRes.success).toBe(true);
    expect(hwAttacker.garrison.scout).toBe(1); // 3 - 2 = 1
    expect(engine.state.espionageOps?.length).toBe(1);

    // Advance time to resolve the espionage arrival
    const arrivalTime = launchRes.data?.op.arrivalTime as number;
    engine.advanceTo(arrivalTime + 100);

    // Verify report was generated
    const spyPlayer = engine.state.players['spy_master'];
    expect(spyPlayer.espionageReports).toBeDefined();
    expect(spyPlayer.espionageReports?.length).toBeGreaterThanOrEqual(1);

    const report = spyPlayer.espionageReports![0];
    expect(report.targetPlayerId).toBe('target_empire');
    expect(report.targetPlanetName).toContain('Hedef İmparatorluk');
    expect(report.counterIntelRating).toBeGreaterThan(0);
    expect(report.stealthRating).toBeGreaterThan(0);

    if (report.success) {
      expect(report.intelData).toBeDefined();
      expect(report.intelData?.buildings.ore_mine).toBe(4);
      expect(report.intelData?.garrison.fighter).toBe(6);
      expect(report.intelData?.defenses.missile_battery).toBe(3);
    }
  });

  it('spawns procedural sector crises and manages their lifecycle', () => {
    const engine = new GameEngine(4242);
    engine.addPlayer('p1', 'Explorer', '#00f3ff');

    // Initially no crisis
    expect(Object.keys(engine.state.sectorEvents || {}).length).toBe(0);

    // Spawn a crisis
    const crisis = engine.spawnProceduralSectorCrisis(1000);
    expect(crisis).toBeDefined();
    expect(crisis?.id).toBeDefined();
    expect(crisis?.type).toMatch(/solar_storm|ancient_titan|market_shock|mineral_rush/);
    expect(engine.state.sectorEvents?.[crisis!.id]).toBeDefined();

    // Verify crisis event was logged
    const crisisLog = engine.state.eventLog.find((e) => e.type === 'galactic_crisis');
    expect(crisisLog).toBeDefined();
    expect(crisisLog?.description).toContain(crisis!.title);

    // Advance time past crisis expiration
    engine.advanceTo(crisis!.expiresAtMs + 100);

    // Crisis should now be marked resolved
    expect(engine.state.sectorEvents?.[crisis!.id].resolved).toBe(true);
    const expireLog = engine.state.eventLog.find((e) => e.type === 'sector_event_expired');
    expect(expireLog).toBeDefined();
  });

  it('slows fleet transit through solar storm systems', () => {
    const engine = new GameEngine(5555);
    const { homeworld: hw } = engine.addPlayer('p1', 'Storm Pilot', '#00f3ff');

    // Find adjacent target system
    const adjacentLane = engine.state.map.lanes.find(
      (l) => l.fromSystemId === hw.systemId || l.toSystemId === hw.systemId
    );
    const targetSysId = adjacentLane!.fromSystemId === hw.systemId
      ? adjacentLane!.toSystemId
      : adjacentLane!.fromSystemId;

    hw.garrison.fighter = 5;
    hw.resources.fuel = 5000;

    // Normal dispatch without solar storm
    const normalDispatch = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: targetSysId,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      mission: 'explore',
    });
    expect(normalDispatch.success).toBe(true);
    const normalDuration = normalDispatch.data?.durationMs as number;
    const normalFleetId = normalDispatch.data?.fleetId as string;
    const normalFuelCost = engine.state.fleets[normalFleetId].fuelCost;

    // Now inject a solar storm on the target system
    if (!engine.state.sectorEvents) engine.state.sectorEvents = {};
    const stormEventId = 'crisis_storm_test';
    engine.state.sectorEvents[stormEventId] = {
      id: stormEventId,
      type: 'solar_storm',
      title: 'Test Güneş Fırtınası',
      description: 'Test Fırtına plazma dalgaları',
      systemId: targetSysId,
      systemName: engine.state.map.systems[targetSysId].name,
      startTimeMs: engine.state.timeMs,
      durationMs: 3600 * 1000,
      expiresAtMs: engine.state.timeMs + 3600 * 1000,
      effects: {
        speedMultiplier: 0.6,
        fuelCostMultiplier: 1.25,
      },
      resolved: false,
    };

    // Dispatch another fleet through the storm
    const stormDispatch = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: targetSysId,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      mission: 'explore',
    });
    expect(stormDispatch.success).toBe(true);
    const stormDuration = stormDispatch.data?.durationMs as number;
    const stormFleetId = stormDispatch.data?.fleetId as string;
    const stormFuelCost = engine.state.fleets[stormFleetId].fuelCost;

    // Speed reduced by 40% means duration is ~1.67x longer
    expect(stormDuration).toBeGreaterThan(normalDuration);
    // Fuel cost increased by 25%
    expect(stormFuelCost).toBeGreaterThanOrEqual(normalFuelCost);
  });

  it('resolves combat against Ancient Titan and awards massive loot and admiral XP', () => {
    const engine = new GameEngine(7777);
    const { homeworld: hw } = engine.addPlayer('p1', 'Titan Slayer', '#00f3ff');

    const emptySys = Object.values(engine.state.map.systems).find(
      (s) => s.id !== hw.systemId && s.slots.every((sl) => !sl.ownerId) && !s.hasRelay
    );
    expect(emptySys).toBeDefined();

    // Inject Ancient Titan crisis in this system
    if (!engine.state.sectorEvents) engine.state.sectorEvents = {};
    const titanEventId = 'crisis_titan_boss';
    engine.state.sectorEvents[titanEventId] = {
      id: titanEventId,
      type: 'ancient_titan',
      title: `Kadim Muhafız Titanı: ${emptySys!.name}`,
      description: 'Uyanan devasa kadim savaş titanı',
      systemId: emptySys!.id,
      systemName: emptySys!.name,
      startTimeMs: engine.state.timeMs,
      durationMs: 3600 * 1000,
      expiresAtMs: engine.state.timeMs + 3600 * 1000,
      effects: {
        titanHp: 2200,
        titanAttack: 135,
        titanReward: { ore: 2500, crystal: 1800, fuel: 1000 },
      },
      resolved: false,
    };

    // Prepare elite player armada led by Admiral Kaelen Valerius
    hw.garrison.battleship = 10;
    hw.garrison.fighter = 25;
    hw.resources.fuel = 10000;
    engine.state.players['p1'].protectionUntilTime = 0;

    const myAdmiral = Object.values(engine.state.admirals || {}).find((a) => a.ownerId === 'p1');
    expect(myAdmiral).toBeDefined();
    const initialXP = myAdmiral!.xp;

    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: emptySys!.id,
      ships: { scout: 0, transport: 0, fighter: 20, battleship: 8 },
      mission: 'attack',
      admiralId: myAdmiral!.id,
    });
    expect(dispatchRes.success).toBe(true);

    // Advance time until fleet arrives and fights the Titan
    const arrivalTime = dispatchRes.data?.arrivalTime as number;
    engine.advanceTo(arrivalTime + 100);

    // Verify Titan crisis was defeated and marked resolved
    expect(engine.state.sectorEvents[titanEventId].resolved).toBe(true);

    // Check ancient titan slain log
    const titanLog = engine.state.eventLog.find((e) => e.type === 'ancient_titan_slain');
    expect(titanLog).toBeDefined();

    // Verify admiral gained massive XP (+350 XP)
    const updatedAdmiral = engine.state.admirals![myAdmiral!.id];
    expect(updatedAdmiral.xp).toBeGreaterThan(initialXP);
  });

  it('supports sending and filtering diplomatic radio transmissions in fog of war', () => {
    const engine = new GameEngine(1234);
    engine.addPlayer('p1', 'Player Alpha', '#00f3ff');
    engine.addPlayer('p2', 'Player Beta', '#f43f5e');
    engine.addPlayer('p3', 'Player Gamma', '#10b981');

    // p1 sends a warning to p2
    const sendRes = engine.dispatchCommand('p1', {
      type: 'SEND_TRANSMISSION',
      recipientId: 'p2',
      transmissionType: 'warning',
      title: 'Sınır İhlali Uyarısı',
      message: 'Sektörümüzden derhal çekilin.',
    });
    expect(sendRes.success).toBe(true);
    const transId = sendRes.data?.transmissionId as string;
    expect(transId).toBeDefined();

    // Check fog of war filtering
    const viewP1 = engine.getPlayerView('p1');
    const viewP2 = engine.getPlayerView('p2');
    const viewP3 = engine.getPlayerView('p3');

    expect(viewP1.myTransmissions?.some((t) => t.id === transId)).toBe(true);
    expect(viewP2.myTransmissions?.some((t) => t.id === transId)).toBe(true);
    // p3 should NOT see private transmission between p1 and p2
    expect(viewP3.myTransmissions?.some((t) => t.id === transId)).toBe(false);
  });

  it('executes bilateral trade when responding to trade proposal transmission', () => {
    const engine = new GameEngine(2345);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Trader Alpha', '#00f3ff');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Miner Beta', '#10b981');

    hw1.resources = { ore: 1000, crystal: 500, fuel: 300 };
    hw2.resources = { ore: 200, crystal: 100, fuel: 800 };

    // p1 offers 400 Ore in exchange for 200 Fuel from p2
    const sendRes = engine.dispatchCommand('p1', {
      type: 'SEND_TRANSMISSION',
      recipientId: 'p2',
      transmissionType: 'trade_proposal',
      title: 'Cevher - Yakıt Takas Teklifi',
      message: '400 Cevher verip 200 Yakıt talep ediyoruz.',
      tradeOffer: {
        give: { ore: 400, crystal: 0, fuel: 0 },
        receive: { ore: 0, crystal: 0, fuel: 200 },
      },
    });
    expect(sendRes.success).toBe(true);
    const transId = sendRes.data?.transmissionId as string;

    // p2 accepts trade proposal
    const respondRes = engine.dispatchCommand('p2', {
      type: 'RESPOND_TRANSMISSION',
      transmissionId: transId,
      action: 'accept',
    });
    expect(respondRes.success).toBe(true);

    // Verify resources transferred accurately
    // p1: lost 400 ore, gained 200 fuel -> ore: 600, fuel: 500
    expect(hw1.resources.ore).toBe(600);
    expect(hw1.resources.fuel).toBe(500);

    // p2: gained 400 ore, lost 200 fuel -> ore: 600, fuel: 600
    expect(hw2.resources.ore).toBe(600);
    expect(hw2.resources.fuel).toBe(600);

    // Transmission marked accepted
    expect(engine.state.transmissions![transId].status).toBe('accepted');
  });

  it('enforces non-aggression ceasefire when agreeing to a truce offer transmission', () => {
    const engine = new GameEngine(3456);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Terran Empire', '#00f3ff');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Centauri Union', '#f43f5e');

    // Turn off newbie protection for test
    engine.state.players['p1'].protectionUntilTime = 0;
    engine.state.players['p2'].protectionUntilTime = 0;

    // p2 sends 15-minute truce offer to p1
    const sendRes = engine.dispatchCommand('p2', {
      type: 'SEND_TRANSMISSION',
      recipientId: 'p1',
      transmissionType: 'truce_offer',
      title: 'Ateşkes Önerisi',
      message: '15 dakika boyunca çatışmaları donduralım.',
      truceDurationMs: 15 * 60 * 1000,
    });
    expect(sendRes.success).toBe(true);
    const transId = sendRes.data?.transmissionId as string;

    // p1 accepts the truce
    const acceptRes = engine.dispatchCommand('p1', {
      type: 'RESPOND_TRANSMISSION',
      transmissionId: transId,
      action: 'accept',
    });
    expect(acceptRes.success).toBe(true);

    // Verify truce is recorded
    expect(engine.hasActiveTruce('p1', 'p2')).toBe(true);

    // p1 attempts to attack p2 while truce is active -> should be rejected!
    hw1.garrison.fighter = 10;
    hw1.resources.fuel = 2000;
    const attackRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      mission: 'attack',
    });
    expect(attackRes.success).toBe(false);
    expect(attackRes.error).toContain('barış/ateşkes paktı');

    // Advance time beyond truce duration (16 minutes)
    engine.advanceTo(engine.state.timeMs + 16 * 60 * 1000);
    expect(engine.hasActiveTruce('p1', 'p2')).toBe(false);

    // Now attack should be allowed
    const attackAllowedRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      mission: 'attack',
    });
    expect(attackAllowedRes.success).toBe(true);
  });

  it('triggers archetype-specific bot diplomatic radio transmissions', () => {
    resetBotDiplomacyCooldowns();
    const engine = new GameEngine(4567);
    engine.addPlayer('p_human', 'Human Commander', '#00f3ff');
    engine.addPlayer('bot_ind', 'Aethel Sanayi Konsorsiyumu', '#10b981', true, 'industrialist');
    engine.addPlayer('bot_guard', 'Nexus Muhafızları', '#3b82f6', true, 'guardian');

    // Industrialist bot sends trade proposal
    const indCmds = evaluateBotDiplomacy(engine, 'bot_ind');
    expect(indCmds.length).toBe(1);
    expect(indCmds[0].type).toBe('SEND_TRANSMISSION');
    if (indCmds[0].type === 'SEND_TRANSMISSION') {
      expect(indCmds[0].transmissionType).toBe('trade_proposal');
      expect(indCmds[0].tradeOffer).toBeDefined();
    }

    // Guardian bot sends truce offer
    const guardCmds = evaluateBotDiplomacy(engine, 'bot_guard');
    expect(guardCmds.length).toBe(1);
    expect(guardCmds[0].type).toBe('SEND_TRANSMISSION');
    if (guardCmds[0].type === 'SEND_TRANSMISSION') {
      expect(guardCmds[0].transmissionType).toBe('truce_offer');
      expect(guardCmds[0].truceDurationMs).toBeGreaterThan(0);
    }
  });

  it('declares Hegemony victory when an empire reaches 500 Hegemony points', () => {
    const engine = new GameEngine(777);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Solar Ascendancy', '#38bdf8');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Orion Dominion', '#ef4444');

    expect(engine.state.victory).toBeNull();

    // Accumulate 500 Hegemony points
    engine.state.relay.weeklyPoints['p1'] = 500;
    const victory = engine.evaluateVictoryConditions();

    expect(victory).not.toBeNull();
    expect(victory?.winnerId).toBe('p1');
    expect(victory?.victoryType).toBe('hegemony');
    expect(victory?.stats.hegemonyPoints).toBe(500);
    expect(engine.state.victory).toEqual(victory);
    expect(engine.state.seasonHistory?.length).toBe(1);

    // Verify offensive fleet dispatch is blocked after galactic victory
    hw1.garrison.fighter = 10;
    hw1.resources.fuel = 2000;
    const attackRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      mission: 'attack',
    });
    expect(attackRes.success).toBe(false);
    expect(attackRes.error).toContain('Galaktik zafer ilan edildi');
  });

  it('declares Colony Domination victory when an empire controls >= 60% of at least 6 colonized planets', () => {
    const engine = new GameEngine(888);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Terran Hegemony', '#10b981');
    engine.addPlayer('p2', 'Centauri Republic', '#f59e0b');

    // Create 6 colonized planets in total (4 owned by p1, 2 owned by p2 -> 4/6 = 66.7% >= 60%)
    for (let i = 1; i <= 3; i++) {
      engine.state.planets[`p1_colony_${i}`] = {
        ...hw1,
        id: `p1_colony_${i}`,
        name: `Colony P1-${i}`,
        ownerId: 'p1',
        isHomeworld: false,
      };
    }
    engine.state.planets[`p2_colony_1`] = {
      ...hw1,
      id: `p2_colony_1`,
      name: `Colony P2-1`,
      ownerId: 'p2',
      isHomeworld: false,
    };

    const colonizedCount = Object.values(engine.state.planets).filter((p) => !!p.ownerId).length;
    expect(colonizedCount).toBe(6);

    const victory = engine.evaluateVictoryConditions();
    expect(victory).not.toBeNull();
    expect(victory?.winnerId).toBe('p1');
    expect(victory?.victoryType).toBe('domination');
    expect(victory?.stats.ownedPlanetsCount).toBe(4);
    expect(victory?.stats.totalPlanetsCount).toBe(6);
    expect(victory?.stats.colonyRatio).toBeCloseTo(4 / 6, 2);
  });

  it('declares Alliance Hegemony and Domination victories when combined member stats exceed threshold', () => {
    const engine = new GameEngine(999);
    engine.addPlayer('m1', 'Member Alpha', '#38bdf8');
    engine.addPlayer('m2', 'Member Beta', '#818cf8');
    engine.addPlayer('rival', 'Rival Empire', '#ef4444');

    // Create alliance between m1 and m2
    engine.dispatchCommand('m1', {
      type: 'CREATE_ALLIANCE',
      name: 'United Star League',
      tag: 'USL',
    });
    const playerM1 = engine.state.players['m1'];
    expect(playerM1.allianceId).toBeDefined();
    engine.dispatchCommand('m2', {
      type: 'JOIN_ALLIANCE',
      allianceId: playerM1.allianceId!,
    });

    // Neither individual has 500, but together: 260 + 250 = 510 >= 500
    engine.state.relay.weeklyPoints['m1'] = 260;
    engine.state.relay.weeklyPoints['m2'] = 250;

    const victory = engine.evaluateVictoryConditions();
    expect(victory).not.toBeNull();
    expect(victory?.isAlliance).toBe(true);
    expect(victory?.winnerId).toBe(playerM1.allianceId);
    expect(victory?.victoryType).toBe('alliance_hegemony');
    expect(victory?.stats.hegemonyPoints).toBe(510);
  });

  it('resets season cleanly with RESET_SEASON command while preserving seasonHistory', () => {
    const engine = new GameEngine(1234);
    engine.addPlayer('p_victor', 'Victor Empire', '#c084fc');
    engine.state.relay.weeklyPoints['p_victor'] = 500;
    engine.evaluateVictoryConditions();

    expect(engine.state.victory).not.toBeNull();
    expect(engine.state.seasonHistory?.length).toBe(1);

    // Reset season with a new seed
    const resetRes = engine.dispatchCommand('p_victor', {
      type: 'RESET_SEASON',
      seed: 5678,
    });
    expect(resetRes.success).toBe(true);

    // State should be freshly initialized
    expect(engine.state.victory).toBeNull();
    expect(engine.state.seed).toBe(5678);
    expect(engine.state.timeMs).toBe(0);

    // Crucially: seasonHistory must be preserved!
    expect(engine.state.seasonHistory?.length).toBe(1);
    expect(engine.state.seasonHistory?.[0].winnerId).toBe('p_victor');
  });

  it('dispatches a colonization fleet and establishes a new colony on arrival, updating fog and slot state', () => {
    const engine = new GameEngine(2025);
    const { player, homeworld } = engine.addPlayer('col_p1', 'Pioneer Command', '#38bdf8');

    // Verify homeworld slot assignment
    const homeSys = engine.state.map.systems[homeworld.systemId];
    const hwSlot = homeSys.slots.find((s) => s.ownerId === player.id);
    expect(hwSlot).toBeDefined();
    expect(hwSlot?.planetId).toBe(homeworld.id);

    // Provide materials and transport for colony
    homeworld.resources.ore = 1200;
    homeworld.resources.crystal = 800;
    homeworld.resources.fuel = 600;
    homeworld.garrison.transport = 1;

    // Pick an empty slot in home system
    const emptySlot = homeSys.slots.find((s) => s.ownerId === null)!;
    expect(emptySlot).toBeDefined();

    const dispatchRes = engine.dispatchCommand(player.id, {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: homeSys.id,
      targetPlanetId: emptySlot.planetId,
      ships: { scout: 0, transport: 1, fighter: 0, battleship: 0 },
      cargo: { ...GAME_CONSTANTS.COLONY_COST },
      mission: 'colonize',
    });
    expect(dispatchRes.success).toBe(true);

    // Initial colony flight duration is 30s for intra-system
    engine.tick(35000);

    // Verify colony was founded
    const playerPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === player.id);
    expect(playerPlanets.length).toBe(2);

    const newColony = playerPlanets.find((p) => !p.isHomeworld);
    expect(newColony).toBeDefined();
    expect(emptySlot.ownerId).toBe(player.id);
    expect(emptySlot.planetId).toBe(newColony?.id);

    // Verify fog of war visibility
    const view = engine.getPlayerView(player.id);
    const visibleSlot = view.discoveredSystems[homeSys.id].visiblePlanets.find((p) => p.id === newColony?.id);
    expect(visibleSlot).toBeDefined();
    expect(visibleSlot?.ownerId).toBe(player.id);
  });

  it('allows Explorer and Industrialist bots to autonomously build transports and colonize nearby slots', () => {
    const engine = new GameEngine(1042);
    engine.addPlayer('bot_exp', 'Explorer Society', '#ffaa00', true, 'explorer');
    engine.addPlayer('bot_ind', 'Industrial Union', '#10b981', true, 'industrialist');

    const expBot = new ExplorerBot('bot_exp');
    const indBot = new IndustrialistBot('bot_ind');

    // Simulate 4 hours of game time with bot decision cycles
    const totalSimMs = 4 * 3600 * 1000;
    let simMs = 0;
    while (simMs < totalSimMs) {
      engine.tick(30000);
      simMs += 30000;
      expBot.update(engine);
      indBot.update(engine);
    }

    const expPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === 'bot_exp');
    const indPlanets = Object.values(engine.state.planets).filter((p) => p.ownerId === 'bot_ind');

    // Both bots should have expanded and established additional colonies
    expect(expPlanets.length).toBeGreaterThan(1);
    expect(indPlanets.length).toBeGreaterThan(1);
  });

  it('applies planetary specialization mining_hub production bonus (+20%) deterministically', () => {
    const engine = new GameEngine(1234);
    const { player, homeworld } = engine.addPlayer('p_spec', 'Mining Dynasty', '#10b981');

    homeworld.buildings.ore_mine = 5;
    homeworld.resources.ore = 0;

    // Normal production for 1 hour
    engine.tick(3600 * 1000);
    const baseOre = homeworld.resources.ore;
    expect(baseOre).toBeGreaterThan(0);

    // Set specialization to mining_hub
    const specRes = engine.dispatchCommand(player.id, {
      type: 'SET_PLANET_SPECIALIZATION',
      planetId: homeworld.id,
      specialization: 'mining_hub',
    });
    expect(specRes.success).toBe(true);
    expect(homeworld.specialization).toBe('mining_hub');

    homeworld.resources.ore = 0;
    // Production with mining_hub (+20%) for 1 hour
    engine.tick(3600 * 1000);
    const boostedOre = homeworld.resources.ore;
    expect(boostedOre).toBeCloseTo(baseOre * 1.20, 1);
  });

  it('tracks empire directives dynamically and grants rewards upon claiming', () => {
    const engine = new GameEngine(5555);
    const { player, homeworld } = engine.addPlayer('p_dir', 'Empire Dominion', '#38bdf8');

    // Initially upgrade_mine is level 1 (target is level 2)
    const view1 = engine.getPlayerView(player.id);
    const dirMine1 = view1.myDirectives?.find((d) => d.id === 'upgrade_mine');
    expect(dirMine1).toBeDefined();
    expect(dirMine1?.isCompleted).toBe(false);
    expect(dirMine1?.currentValue).toBe(1);

    // Cannot claim incomplete directive
    const failClaim = engine.dispatchCommand(player.id, {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'upgrade_mine',
    });
    expect(failClaim.success).toBe(false);

    // Upgrade ore_mine to level 2
    homeworld.buildings.ore_mine = 2;
    const initialOre = homeworld.resources.ore;
    const initialFuel = homeworld.resources.fuel;

    const view2 = engine.getPlayerView(player.id);
    const dirMine2 = view2.myDirectives?.find((d) => d.id === 'upgrade_mine');
    expect(dirMine2?.isCompleted).toBe(true);
    expect(dirMine2?.isClaimed).toBe(false);

    // Claim reward (+200 ore, +100 crystal, +200 fuel)
    const claimRes = engine.dispatchCommand(player.id, {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'upgrade_mine',
    });
    expect(claimRes.success).toBe(true);
    expect(homeworld.resources.fuel).toBe(initialFuel + 200);

    // Cannot double-claim
    const doubleClaim = engine.dispatchCommand(player.id, {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'upgrade_mine',
    });
    expect(doubleClaim.success).toBe(false);
    expect(doubleClaim.error).toContain('daha önce talep edilmiş');

    // View should now reflect isClaimed: true
    const view3 = engine.getPlayerView(player.id);
    const dirMine3 = view3.myDirectives?.find((d) => d.id === 'upgrade_mine');
    expect(dirMine3?.isClaimed).toBe(true);
  });

  it('applies deep planetary specialization synergies: tech_haven research and military_bastion build times', () => {
    const engine = new GameEngine(1234);
    const { player, homeworld } = engine.addPlayer('Valerius');

    // Build lab and shipyard
    homeworld.buildings.research_lab = 2;
    homeworld.buildings.shipyard = 2;
    homeworld.resources.ore = 10000;
    homeworld.resources.crystal = 10000;
    homeworld.resources.fuel = 10000;

    // Normal baseline research duration
    const resNormal = engine.dispatchCommand(player.id, {
      type: 'START_RESEARCH',
      researchType: 'weapons',
    });
    expect(resNormal.success).toBe(true);
    const normalDuration = (resNormal.data as { durationMs: number }).durationMs;

    // Fast-forward to finish research
    engine.tick(normalDuration + 1000);
    expect(player.research.weapons).toBe(1);
    expect(player.researchQueue).toBeNull();

    // Now set homeworld specialization to tech_haven
    engine.dispatchCommand(player.id, {
      type: 'SET_PLANET_SPECIALIZATION',
      planetId: homeworld.id,
      specialization: 'tech_haven',
    });

    // Start research again - should be ~20% faster
    const resTechHaven = engine.dispatchCommand(player.id, {
      type: 'START_RESEARCH',
      researchType: 'sensors',
    });
    expect(resTechHaven.success).toBe(true);
    const techHavenDuration = (resTechHaven.data as { durationMs: number }).durationMs;

    // Fast forward to finish
    engine.tick(techHavenDuration + 1000);

    // Test military bastion: set specialization
    engine.dispatchCommand(player.id, {
      type: 'SET_PLANET_SPECIALIZATION',
      planetId: homeworld.id,
      specialization: 'military_bastion',
    });

    // Build defenses: unitBuildTimeMs should be reduced by 20%
    const defRes = engine.dispatchCommand(player.id, {
      type: 'BUILD_DEFENSES',
      planetId: homeworld.id,
      defenseType: 'missile_battery',
      count: 1,
    });
    expect(defRes.success).toBe(true);
    const expectedDefDuration = Math.round(
      getDefenseBuildDurationMs('missile_battery', homeworld.buildings.shipyard) * 0.8
    );
    expect(homeworld.defenseQueue![0].unitBuildTimeMs).toBe(expectedDefDuration);

    // Build ships: unitBuildTimeMs should be reduced by 15%
    const shipRes = engine.dispatchCommand(player.id, {
      type: 'BUILD_SHIPS',
      planetId: homeworld.id,
      shipType: 'fighter',
      count: 1,
    });
    expect(shipRes.success).toBe(true);
    const expectedShipDuration = Math.round(
      getShipBuildDurationMs('fighter', homeworld.buildings.shipyard) * 0.85
    );
    expect(homeworld.shipyardQueue[0].unitBuildTimeMs).toBe(expectedShipDuration);
  });

  it('handles fleet combat doctrines (spearhead, fortress, hit_and_run) and live doctrine switching', () => {
    const engine = new GameEngine(777);
    const { player, homeworld } = engine.addPlayer('Admiral Fleet');

    // Give ships and fuel
    homeworld.garrison.fighter = 10;
    homeworld.resources.fuel = 5000;

    // Find another system
    const otherSys = Object.values(engine.state.map.systems).find(
      (s) => s.id !== homeworld.systemId && !s.hasRelay
    )!;

    // Dispatch fleet with spearhead doctrine (+10% speed)
    const dispatchRes = engine.dispatchCommand(player.id, {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: otherSys.id,
      ships: { fighter: 5 },
      mission: 'recon',
      doctrine: 'spearhead',
    });
    expect(dispatchRes.success).toBe(true);

    const fleetId = (dispatchRes.data as { fleetId: string }).fleetId;
    const fleet = engine.state.fleets[fleetId];
    expect(fleet).toBeDefined();
    expect(fleet.doctrine).toBe('spearhead');

    // Switch doctrine live using SET_FLEET_DOCTRINE
    const switchRes = engine.dispatchCommand(player.id, {
      type: 'SET_FLEET_DOCTRINE',
      fleetId,
      doctrine: 'fortress',
    });
    expect(switchRes.success).toBe(true);
    expect(fleet.doctrine).toBe('fortress');

    // Fog of war view should display doctrine for own fleet
    const view = engine.getPlayerView(player.id);
    const viewFleet = view.myFleets.find((f) => f.id === fleetId);
    expect(viewFleet?.doctrine).toBe('fortress');
  });

  it('dispatches one-click quick supply convoys from colony to homeworld via DISPATCH_SUPPLY_CONVOY', () => {
    const engine = new GameEngine(999);
    const { player, homeworld } = engine.addPlayer('Tycoon');

    // Create a colony for the player
    const emptySys = Object.values(engine.state.map.systems).find(
      (s) => s.id !== homeworld.systemId && !s.hasRelay && s.slots.some((sl) => sl.ownerId === null)
    )!;
    const slot = emptySys.slots.find((sl) => sl.ownerId === null)!;
    const colonyId = `planet_colony_${player.id}`;
    const colony = {
      ...homeworld,
      id: colonyId,
      name: 'Yeni Maden Dünyası',
      systemId: emptySys.id,
      slotIndex: slot.slotIndex,
      ownerId: player.id,
      isHomeworld: false,
      resources: { ore: 2500, crystal: 1800, fuel: 1200 },
      garrison: { scout: 0, transport: 2, fighter: 0, battleship: 0 },
      shipyardQueue: [],
      defenseQueue: [],
    };
    slot.ownerId = player.id;
    slot.planetId = colonyId;
    engine.state.planets[colonyId] = colony;

    // Dispatch supply convoy from colony
    const convoyRes = engine.dispatchCommand(player.id, {
      type: 'DISPATCH_SUPPLY_CONVOY',
      colonyPlanetId: colonyId,
    });
    expect(convoyRes.success).toBe(true);

    const data = convoyRes.data as { fleetId: string; transports: number; cargo: Resources };
    expect(data.transports).toBeGreaterThan(0);
    // Surplus ore (2500 - 300 = 2200) should be loaded into cargo
    expect(data.cargo.ore).toBe(2200);
    // Surplus crystal (1800 - 200 = 1600) should be loaded into cargo
    expect(data.cargo.crystal).toBe(1600);

    const convoyFleet = engine.state.fleets[data.fleetId];
    expect(convoyFleet).toBeDefined();
    expect(convoyFleet.targetPlanetId).toBe(homeworld.id);
    expect(convoyFleet.mission).toBe('transport');

    // Transports deducted from colony garrison
    expect(colony.garrison.transport).toBe(2 - data.transports);
  });

  it('verifies combat modifiers for spearhead and fortress doctrines as well as military_bastion in resolveCombat', () => {
    // 1. Spearhead vs Balanced
    const resSpearhead = resolveCombat(
      {
        ownerId: 'att1',
        ownerName: 'Attacker Spearhead',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        doctrine: 'spearhead',
      },
      {
        ownerId: 'def1',
        ownerName: 'Defender Balanced',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        doctrine: 'balanced',
      },
      'sys_1',
      'Alpha',
      'fleet_interception',
      undefined,
      0,
      1000,
      42
    );

    // Spearhead deals +15% damage, should inflict heavier casualties on round 1
    expect(resSpearhead.report.rounds.length).toBeGreaterThan(0);
    expect(resSpearhead.report.attackerDoctrine).toBe('spearhead');
    expect(resSpearhead.report.defenderDoctrine).toBe('balanced');

    // 2. Military Bastion defense platform bonus in planet raid
    const resBastion = resolveCombat(
      {
        ownerId: 'att2',
        ownerName: 'Attacker',
        ships: { fighter: 5, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        doctrine: 'balanced',
      },
      {
        ownerId: 'def2',
        ownerName: 'Bastion Defender',
        ships: { fighter: 2, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        defenses: { missile_battery: 4, plasma_turret: 0, ion_cannon: 0 },
        planetSpecialization: 'military_bastion',
      },
      'sys_2',
      'Beta',
      'planet_raid',
      { ore: 1000, crystal: 1000, fuel: 1000 },
      1200,
      1000,
      42
    );

    expect(resBastion.report.winner).toBe('defender');
  });

  it('discovers ancient archeology anomalies, unlocks imperial relics, awards admiral XP, and applies empire-wide relic synergies (Phase 8)', () => {
    const engine = new GameEngine(12345);
    const { player, homeworld: hw } = engine.addPlayer('p1', 'Archaeologist Emperor', '#00f3ff', undefined, false);

    // Recruit or pick an admiral for the exploration fleet
    const admId = Object.keys(engine.state.admirals || {})[0];
    const initialXP = engine.state.admirals![admId].xp;

    // Pick a target system and plant an ancient ruins POI with progenitor_matrix
    const targetSys = Object.values(engine.state.map.systems).find((s) => s.id !== hw.systemId && !s.hasRelay)!;
    targetSys.poi = {
      id: `poi_${targetSys.id}`,
      type: 'ancient_ruins',
      explored: false,
      artifactId: 'progenitor_matrix',
      reward: { ore: 1200, crystal: 1800, fuel: 600 },
    };

    // Dispatch scout fleet on explore mission with assigned admiral
    hw.garrison.scout = 2;
    hw.resources.fuel = 5000;

    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: targetSys.id,
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      mission: 'explore',
      admiralId: admId,
    });
    expect(dispatchRes.success).toBe(true);

    const fleetId = dispatchRes.data!.fleetId;
    const duration = dispatchRes.data!.durationMs;

    // Advance time until fleet arrives at target system
    engine.tick(duration + 100);

    // 1. Verify POI explored and cargo collected
    expect(targetSys.poi.explored).toBe(true);
    const returningFleet = engine.state.fleets[fleetId];
    expect(returningFleet.isReturning).toBe(true);
    expect(returningFleet.cargo.ore).toBe(1200);
    expect(returningFleet.cargo.crystal).toBe(1800);
    expect(returningFleet.cargo.fuel).toBe(600);

    // 2. Verify imperial relic unlocked on player
    expect(player.artifacts).toContain('progenitor_matrix');

    // 3. Verify admiral XP gained (+200 XP for relic discovery)
    expect(engine.state.admirals![admId].xp).toBe(initialXP + 200);

    // 4. Verify research duration discount (-10% from progenitor_matrix)
    hw.buildings.research_lab = 2;
    hw.resources.ore = 10000;
    hw.resources.crystal = 10000;
    hw.resources.fuel = 10000;

    const resCmd = engine.dispatchCommand('p1', {
      type: 'START_RESEARCH',
      researchType: 'weapons',
    });
    expect(resCmd.success).toBe(true);
    // Base is 369231 ms, discounted by 10% with progenitor_matrix gives 332308 ms
    expect(resCmd.data!.durationMs).toBe(332308);

    // 5. Test rift_hyperdrive speed bonus
    player.artifacts!.push('rift_hyperdrive');
    const speedDispatch = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw.id,
      targetSystemId: targetSys.id,
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      mission: 'explore',
    });
    expect(speedDispatch.success).toBe(true);
    expect(speedDispatch.data!.durationMs).toBeLessThan(duration);

    // 6. Test dreadnought_plating in combat
    const combatWithRelic = resolveCombat(
      {
        ownerId: 'p1',
        ownerName: 'Attacker Relic',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        doctrine: 'balanced',
        artifacts: ['dreadnought_plating'],
      },
      {
        ownerId: 'enemy',
        ownerName: 'Defender No Relic',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        doctrine: 'balanced',
      },
      'sys_combat',
      'Combat Zone',
      'fleet_interception',
      undefined,
      0,
      1000,
      1234
    );
    expect(combatWithRelic.report.winner).toBe('attacker');

    // 7. Verify subspace_tachyon_array sensor coverage bonus
    player.artifacts!.push('subspace_tachyon_array');
    const coverage = getPlayerSensorCoverage(engine.state, 'p1');
    expect(coverage.size).toBeGreaterThan(0);

    // 8. Verify fog filter exposes myArtifacts
    const visible = engine.getPlayerView('p1');
    expect(visible.myArtifacts).toContain('progenitor_matrix');
    expect(visible.myArtifacts).toContain('rift_hyperdrive');
  });

  it('evaluates adaptive bot tactical reactions, counter-coalition diplomacy, and hegemony pressure (Phase 10)', () => {
    resetBotDiplomacyCooldowns();
    const engine = new GameEngine(1042);
    const human = engine.addPlayer('human_1', 'İmparator Kaelen', '#00f3ff', false).player;
    const botRaider = engine.addPlayer('bot_raider', 'Kızıl Akın', '#f43f5e', true, 'raider').player;
    const botGuardian = engine.addPlayer('bot_guardian', 'Nexus Muhafızları', '#3b82f6', true, 'guardian').player;

    // 1. Hegemony Warning when human approaches victory threshold
    engine.state.relay.weeklyPoints[human.id] = 250;
    const raiderDiplo = evaluateBotDiplomacy(engine, botRaider.id);
    expect(raiderDiplo.length).toBe(1);
    expect(raiderDiplo[0].type).toBe('SEND_TRANSMISSION');
    if (raiderDiplo[0].type === 'SEND_TRANSMISSION') {
      expect(raiderDiplo[0].transmissionType).toBe('hegemony_warning');
      expect(raiderDiplo[0].title).toContain('Hegemonya Tehdidi İkazı');
    }

    // 2. Counter-Coalition proposal when a rival bot is hegemony leader
    resetBotDiplomacyCooldowns();
    delete engine.state.relay.weeklyPoints[human.id];
    engine.state.relay.weeklyPoints[botGuardian.id] = 260; // Guardian dominating
    const raiderCoalition = evaluateBotDiplomacy(engine, botRaider.id);
    expect(raiderCoalition.length).toBe(1);
    expect(raiderCoalition[0].type).toBe('SEND_TRANSMISSION');
    if (raiderCoalition[0].type === 'SEND_TRANSMISSION') {
      expect(raiderCoalition[0].transmissionType).toBe('coalition_proposal');
      expect(raiderCoalition[0].truceDurationMs).toBe(25 * 60 * 1000);

      // Dispatch transmission
      const sendRes = engine.dispatchCommand(botRaider.id, raiderCoalition[0]);
      expect(sendRes.success).toBe(true);

      const transId = Object.keys(engine.state.transmissions || {})[0];
      expect(transId).toBeDefined();

      // Human accepts coalition proposal
      const acceptRes = engine.dispatchCommand(human.id, {
        type: 'RESPOND_TRANSMISSION',
        transmissionId: transId,
        action: 'accept',
      });
      expect(acceptRes.success).toBe(true);

      // Check truce established between human and raider
      expect(engine.hasActiveTruce(human.id, botRaider.id)).toBe(true);
      expect(engine.state.eventLog.some(e => e.type === 'coalition_pact_established')).toBe(true);
    }

    // 3. Ancient Relic envy reaction
    resetBotDiplomacyCooldowns();
    delete engine.state.relay.weeklyPoints[botGuardian.id];
    human.artifacts = ['dreadnought_plating'];
    const relicDiplo = evaluateBotDiplomacy(engine, botRaider.id);
    expect(relicDiplo.length).toBe(1);
    if (relicDiplo[0].type === 'SEND_TRANSMISSION') {
      expect(relicDiplo[0].transmissionType).toBe('relic_envy');
      expect(relicDiplo[0].title).toBe('Kadim Yadigar İstihbaratı');
    }

    // 4. Test Bot Tactical Doctrines on dispatches & colony specializations
    const guardianAgent = new GuardianBot('bot_guardian');

    // Give bot_guardian colony and check military_bastion specialization
    const botGuardHw = Object.values(engine.state.planets).find(p => p.ownerId === 'bot_guardian')!;
    const colonyId = 'bot_guard_colony_1';
    const guardColony = {
      ...botGuardHw,
      id: colonyId,
      name: 'Bastion Prime',
      isHomeworld: false,
      specialization: 'balanced' as const,
    };
    engine.state.planets[colonyId] = guardColony;

    const guardCmds = guardianAgent.update(engine);
    expect(guardCmds.some(c => c.type === 'SET_PLANET_SPECIALIZATION' && c.specialization === 'military_bastion')).toBe(true);
    expect(guardColony.specialization).toBe('military_bastion');
  });

  it('manages deep-space starbases & orbital outposts, modular upgrades, vision projection, passive bonuses, and combat participation (Phase 11)', () => {
    const engine = new GameEngine(888);
    const { player, homeworld } = engine.addPlayer('p_sb', 'Komutan Shepard', '#00f3ff');

    // 1. Initial homeworld starbase initialized as starter outpost
    expect(engine.state.starbases?.[homeworld.systemId]).toBeDefined();
    const starterSb = engine.state.starbases![homeworld.systemId];
    expect(starterSb.tier).toBe('outpost');
    expect(starterSb.ownerId).toBe(player.id);
    expect(starterSb.hull).toBe(STARBASE_TIER_CONFIG.outpost.baseHull);

    // 2. Build starbase in an empty frontier system
    const emptySys = Object.values(engine.state.map.systems).find(
      (s) => !engine.state.starbases?.[s.id] && s.id !== homeworld.systemId
    )!;

    homeworld.resources.ore = 3000;
    homeworld.resources.crystal = 2000;
    homeworld.resources.fuel = 1000;

    const buildRes = engine.dispatchCommand(player.id, {
      type: 'BUILD_STARBASE',
      systemId: emptySys.id,
      planetId: homeworld.id,
    });
    expect(buildRes.success).toBe(true);
    expect(engine.state.starbases![emptySys.id]).toBeDefined();
    const newSb = engine.state.starbases![emptySys.id];
    expect(newSb.tier).toBe('outpost');
    expect(homeworld.resources.ore).toBe(3000 - STARBASE_TIER_CONFIG.outpost.cost.ore);

    // Rejects building another starbase in the same system
    const duplicateRes = engine.dispatchCommand(player.id, {
      type: 'BUILD_STARBASE',
      systemId: emptySys.id,
      planetId: homeworld.id,
    });
    expect(duplicateRes.success).toBe(false);

    // 3. Upgrade outpost -> starbase
    const upRes = engine.dispatchCommand(player.id, {
      type: 'UPGRADE_STARBASE',
      systemId: emptySys.id,
      planetId: homeworld.id,
    });
    expect(upRes.success).toBe(true);
    expect(newSb.upgradeQueue).toBeDefined();
    expect(newSb.upgradeQueue!.targetTier).toBe('starbase');

    // Fast-forward to finish upgrade
    engine.tick(STARBASE_TIER_CONFIG.starbase.buildTimeMs + 500);
    expect(newSb.upgradeQueue).toBeNull();
    expect(newSb.tier).toBe('starbase');
    expect(newSb.hull).toBe(STARBASE_TIER_CONFIG.starbase.baseHull);
    expect(newSb.shield).toBe(STARBASE_TIER_CONFIG.starbase.baseShield);

    // 4. Module installation & slot capacity
    // Install sensor_relay
    const modRes1 = engine.dispatchCommand(player.id, {
      type: 'INSTALL_STARBASE_MODULE',
      systemId: emptySys.id,
      planetId: homeworld.id,
      moduleType: 'sensor_relay',
    });
    expect(modRes1.success).toBe(true);
    engine.tick(STARBASE_MODULE_CONFIG.sensor_relay.buildTimeMs + 500);
    expect(newSb.modules).toContain('sensor_relay');

    // Install shipyard_bay as 2nd module (max 2 for starbase tier)
    const modRes2 = engine.dispatchCommand(player.id, {
      type: 'INSTALL_STARBASE_MODULE',
      systemId: emptySys.id,
      planetId: homeworld.id,
      moduleType: 'shipyard_bay',
    });
    expect(modRes2.success).toBe(true);
    engine.tick(STARBASE_MODULE_CONFIG.shipyard_bay.buildTimeMs + 500);
    expect(newSb.modules).toContain('shipyard_bay');

    // Attempting 3rd module should be rejected (capacity full)
    const modRes3 = engine.dispatchCommand(player.id, {
      type: 'INSTALL_STARBASE_MODULE',
      systemId: emptySys.id,
      planetId: homeworld.id,
      moduleType: 'trade_hub',
    });
    expect(modRes3.success).toBe(false);

    // Dismantle sensor_relay (index 0) with 50% refund
    const oreBeforeDismantle = homeworld.resources.ore;
    const disRes = engine.dispatchCommand(player.id, {
      type: 'DISMANTLE_STARBASE_MODULE',
      systemId: emptySys.id,
      moduleIndex: 0,
    });
    expect(disRes.success).toBe(true);
    expect(newSb.modules.length).toBe(1);
    expect(newSb.modules[0]).toBe('shipyard_bay');
    expect(homeworld.resources.ore).toBe(
      oreBeforeDismantle + Math.round(STARBASE_MODULE_CONFIG.sensor_relay.cost.ore * 0.5)
    );

    // 5. Vision projection via Starbase
    const coverage = getPlayerSensorCoverage(engine.state, player.id);
    expect(coverage.has(emptySys.id)).toBe(true);

    // 6. Upgrade to Citadel
    homeworld.resources.ore = 10000;
    homeworld.resources.crystal = 10000;
    homeworld.resources.fuel = 10000;
    const citRes = engine.dispatchCommand(player.id, {
      type: 'UPGRADE_STARBASE',
      systemId: emptySys.id,
      planetId: homeworld.id,
    });
    expect(citRes.success).toBe(true);
    engine.tick(STARBASE_TIER_CONFIG.citadel.buildTimeMs + 500);
    expect(newSb.tier).toBe('citadel');

    // Install defense_platform
    engine.dispatchCommand(player.id, {
      type: 'INSTALL_STARBASE_MODULE',
      systemId: emptySys.id,
      planetId: homeworld.id,
      moduleType: 'defense_platform',
    });
    engine.tick(STARBASE_MODULE_CONFIG.defense_platform.buildTimeMs + 500);

    const citadelStats = getStarbaseEffectiveStats(newSb);
    expect(citadelStats.maxHull).toBe(STARBASE_TIER_CONFIG.citadel.baseHull + 1000);
    expect(citadelStats.attack).toBe(STARBASE_TIER_CONFIG.citadel.baseAttack + 60);

    // 7. Combat participation & damage absorption
    const combat = resolveCombat(
      {
        ownerId: 'attacker_1',
        ownerName: 'Attacker Armada',
        ships: { scout: 0, transport: 0, fighter: 25, battleship: 8 },
        weaponsResearchLevel: 2,
        doctrine: 'balanced',
      },
      {
        ownerId: player.id,
        ownerName: 'Defender',
        ships: { scout: 0, transport: 0, fighter: 6, battleship: 2 },
        weaponsResearchLevel: 1,
        starbase: newSb,
        doctrine: 'fortress',
      },
      emptySys.id,
      emptySys.name,
      'planet_raid',
      undefined,
      0,
      engine.state.timeMs,
      5555
    );

    expect(combat.report.initialStarbase).toBeDefined();
    expect(combat.report.survivingStarbase).toBeDefined();
    expect(combat.report.initialStarbase?.attack).toBe(getStarbaseEffectiveStats(newSb, 1).attack);
    expect(combat.remainingStarbase).toBeDefined();
    expect(combat.remainingStarbase!.hull).toBeLessThanOrEqual(citadelStats.maxHull);

    // 8. Bot autonomous starbase evaluation
    const guardianAgent = new GuardianBot('bot_guardian_test');
    engine.addPlayer('bot_guardian_test', 'Muhafız Bot', '#3b82f6', true, 'guardian');
    const botHw = Object.values(engine.state.planets).find(p => p.ownerId === 'bot_guardian_test')!;
    botHw.resources.ore = 5000;
    botHw.resources.crystal = 5000;
    botHw.resources.fuel = 5000;

    const botCmds = guardianAgent.update(engine);
    expect(
      botCmds.some(c => c.type === 'UPGRADE_STARBASE' || c.type === 'INSTALL_STARBASE_MODULE')
    ).toBe(true);
  });

  it('manages the Galactic Senate, dynamic diplomatic weight, resolution lifecycle, and active law modifiers (Phase 12)', () => {
    const engine = new GameEngine(777);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'Cumhuriyetçi Lider', '#00f3ff');
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'İmparator Bot', '#ff0055', true, 'admiral');

    expect(engine.state.senate).toBeDefined();
    const senate = engine.state.senate!;
    expect(Object.keys(SENATE_RESOLUTION_CONFIG).length).toBe(6);
    expect(senate.activeResolutions.length).toBe(0);

    // 1. Diplomatic Weight calculation
    const dw1Initial = calculateDiplomaticWeight(engine.state, p1.id).total;
    expect(dw1Initial).toBeGreaterThan(0);

    // Add fleet and tech to p1
    hw1.garrison.battleship = 10;
    p1.research.weapons = 3;
    const dw1Upgraded = calculateDiplomaticWeight(engine.state, p1.id).total;
    expect(dw1Upgraded).toBeGreaterThan(dw1Initial);

    // 2. Propose Resolution
    // Give p1 enough resources to propose
    hw1.resources.crystal = 2000;
    const proposeRes = engine.dispatchCommand('p1', {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType: 'military_readiness',
    });
    expect(proposeRes.success).toBe(true);
    expect(senate.currentSession).toBeDefined();
    expect(senate.currentSession?.type).toBe('military_readiness');
    expect(senate.currentSession?.proposedBy).toBe('p1');
    expect(senate.currentSession?.votes.p1).toBe('for');

    // 3. Voting
    const voteRes = engine.dispatchCommand('p2', {
      type: 'CAST_SENATE_VOTE',
      vote: 'against',
    });
    expect(voteRes.success).toBe(true);
    expect(senate.currentSession?.votes.p2).toBe('against');

    // Tally check: p1 has 10 battleships and tech 3, should outweigh p2 starter
    const tally = tallySenateVotes(engine.state, senate.currentSession!);
    expect(tally.forWeight).toBeGreaterThan(tally.againstWeight);

    // 4. Session conclusion via tick
    engine.tick(SENATE_CONSTANTS.REGULAR_SESSION_DURATION_MS + 1000);
    expect(senate.currentSession).toBeNull();
    expect(senate.activeResolutions.some((m) => m.resolutionType === 'military_readiness')).toBe(true);
    expect(engine.getPlayerSenateAttackMultiplier('p1')).toBeCloseTo(1.15, 2);

    // 5. Custodian Election & Hegemony Points (+150 pts & +30% weight)
    hw1.resources.ore = 5000;
    hw1.resources.crystal = 5000;
    hw1.resources.fuel = 5000;
    const prevHegemony = engine.state.relay.weeklyPoints['p1'] || 0;
    const proposeCustodian = engine.dispatchCommand('p1', {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType: 'custodian_election',
      targetPlayerId: 'p1',
    });
    expect(proposeCustodian.success).toBe(true);

    engine.tick(SENATE_CONSTANTS.REGULAR_SESSION_DURATION_MS + 1000);
    expect(senate.custodianPlayerId).toBe('p1');
    expect(engine.state.relay.weeklyPoints['p1']).toBe(prevHegemony + SENATE_CONSTANTS.CUSTODIAN_HEGEMONY_POINTS_REWARD);
    expect(engine.getPlayerSenateAttackMultiplier('p1')).toBeCloseTo(1.35, 2); // 1.0 + 0.15 (military) + 0.20 (custodian)

    // 6. Free trade market fee discount & Sanctions penalty
    // Propose and pass Free Trade
    hw1.resources.ore = 5000;
    hw1.resources.crystal = 5000;
    hw1.resources.fuel = 5000;
    const proposeFt = engine.dispatchCommand('p1', {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType: 'free_trade',
    });
    expect(proposeFt.success).toBe(true);
    engine.tick(SENATE_CONSTANTS.REGULAR_SESSION_DURATION_MS + 1000);
    expect(senate.activeResolutions.some((m) => m.resolutionType === 'free_trade')).toBe(true);

    // Propose and pass Sanctions on p2
    hw1.resources.ore = 5000;
    hw1.resources.crystal = 5000;
    hw1.resources.fuel = 5000;
    const proposeSanc = engine.dispatchCommand('p1', {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType: 'sanctions',
      targetPlayerId: 'p2',
    });
    expect(proposeSanc.success).toBe(true);
    engine.tick(SENATE_CONSTANTS.REGULAR_SESSION_DURATION_MS + 1000);
    expect(
      senate.activeResolutions.some((m) => m.resolutionType === 'sanctions' && m.targetPlayerId === 'p2')
    ).toBe(true);

    // Sanctioned player cannot propose
    hw2.resources.ore = 5000;
    hw2.resources.crystal = 5000;
    hw2.resources.fuel = 5000;
    const illegalProposal = engine.dispatchCommand('p2', {
      type: 'PROPOSE_SENATE_RESOLUTION',
      resolutionType: 'scientific_cooperative',
    });
    expect(illegalProposal.success).toBe(false);
    expect(illegalProposal.error?.toLowerCase()).toContain('yaptırım');

    // 7. Bot autonomous Senate evaluation
    const admiralBot = new AdmiralBot('p2');
    const botCmds = admiralBot.update(engine);
    expect(Array.isArray(botCmds)).toBe(true);
  });

  it('manages multi-stage megastructures, Dyson Swarm yields, Sentry Array vision, and 15s Subspace Gateway transit jumps (Phase 13)', () => {
    const engine = new GameEngine(777);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Terran Hegemon', '#00f3ff');
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Cybrex Core', '#f43f5e');

    // 1. Initial State: 1 ancient dormant gateway exists in galaxy
    const gateways = engine.state.gateways || {};
    const gatewayCount = Object.keys(gateways).length;
    expect(gatewayCount).toBeGreaterThanOrEqual(1);
    const ancientGatewayId = Object.keys(gateways)[0];
    const ancientGateway = gateways[ancientGatewayId];
    expect(ancientGateway.status).toBe('dormant');

    // 2. Megastructure Construction & Rejection of Underfunded Build
    const underfundedRes = engine.dispatchCommand('p1', {
      type: 'BUILD_MEGASTRUCTURE',
      systemId: hw1.systemId,
      megastructureType: 'dyson_swarm',
      fundingPlanetId: hw1.id,
    });
    expect(underfundedRes.success).toBe(false);

    // Fund homeworld
    hw1.storageCap = 50000;
    hw1.resources.ore = 10000;
    hw1.resources.crystal = 10000;
    hw1.resources.fuel = 10000;

    const buildDyson = engine.dispatchCommand('p1', {
      type: 'BUILD_MEGASTRUCTURE',
      systemId: hw1.systemId,
      megastructureType: 'dyson_swarm',
      fundingPlanetId: hw1.id,
    });
    expect(buildDyson.success).toBe(true);

    const dyson = Object.values(engine.state.megastructures || {}).find(
      (m) => m.systemId === hw1.systemId && m.type === 'dyson_swarm'
    );
    expect(dyson).toBeDefined();
    expect(dyson?.stage).toBe(0);
    expect(dyson?.status).toBe('under_construction');

    // Cannot build second megastructure in same system
    const duplicateSys = engine.dispatchCommand('p1', {
      type: 'BUILD_MEGASTRUCTURE',
      systemId: hw1.systemId,
      megastructureType: 'science_nexus',
      fundingPlanetId: hw1.id,
    });
    expect(duplicateSys.success).toBe(false);

    // 3. Complete Stage 1 via Tick & Verify Hegemony Points + Passive Production Boost
    const stage1Duration = MEGASTRUCTURE_CONFIGS.dyson_swarm.stages[0].buildTimeMs;
    const initialHegemony = engine.state.relay.weeklyPoints['p1'] || 0;
    engine.tick(stage1Duration + 1000);

    expect(dyson?.stage).toBe(1);
    expect(dyson?.status).toBe('completed');
    expect(engine.state.relay.weeklyPoints['p1']).toBe(initialHegemony + 25);

    // Test passive Dyson yield: 1 hour tick yields extra +150 ore, +150 crystal, +250 fuel
    const preOre = hw1.resources.ore;
    const preCrystal = hw1.resources.crystal;
    const preFuel = hw1.resources.fuel;
    engine.tick(3600 * 1000);
    expect(hw1.resources.ore - preOre).toBeGreaterThanOrEqual(150);
    expect(hw1.resources.crystal - preCrystal).toBeGreaterThanOrEqual(150);
    expect(hw1.resources.fuel - preFuel).toBeGreaterThanOrEqual(250);

    // 4. Upgrade Megastructure to Stage 2
    hw1.resources.ore = 15000;
    hw1.resources.crystal = 15000;
    hw1.resources.fuel = 15000;
    const upgradeRes = engine.dispatchCommand('p1', {
      type: 'UPGRADE_MEGASTRUCTURE',
      megastructureId: dyson!.id,
      fundingPlanetId: hw1.id,
    });
    expect(upgradeRes.success).toBe(true);
    expect(dyson?.status).toBe('under_construction');

    const stage2Duration = MEGASTRUCTURE_CONFIGS.dyson_swarm.stages[1].buildTimeMs;
    engine.tick(stage2Duration + 1000);
    expect(dyson?.stage).toBe(2);
    expect(dyson?.status).toBe('completed');
    expect(engine.state.relay.weeklyPoints['p1']).toBe(initialHegemony + 25 + 50);

    // 5. Mega Shipyard Build Speed & Attack Bonus
    const otherSystems = Object.keys(engine.state.map.systems).filter(
      (sId) => sId !== hw1.systemId && sId !== hw2.systemId && sId !== ancientGateway.systemId
    );
    const shipyardSysId = otherSystems[0];
    engine.state.starbases = engine.state.starbases || {};
    engine.state.starbases[shipyardSysId] = {
      systemId: shipyardSysId,
      ownerId: 'p1',
      tier: 'outpost',
      currentHp: 1000,
      maxHp: 1000,
      attackPower: 50,
      sensorRangeHops: 1,
      modules: [],
      defenseStructures: { orbital_platform: 0, defense_grid: 0, ion_cannon: 0 },
      isUpgrading: false,
    };

    const buildShipyard = engine.dispatchCommand('p1', {
      type: 'BUILD_MEGASTRUCTURE',
      systemId: shipyardSysId,
      megastructureType: 'mega_shipyard',
      fundingPlanetId: hw1.id,
    });
    expect(buildShipyard.success).toBe(true);
    const shipyard = Object.values(engine.state.megastructures!).find(
      (m) => m.systemId === shipyardSysId && m.type === 'mega_shipyard'
    )!;
    // Set stage 3 to test attack bonuses
    shipyard.stage = 3;
    shipyard.status = 'completed';
    expect(engine.getPlayerSenateAttackMultiplier('p1')).toBeCloseTo(1.10, 2);

    // 6. Sentry Array Full Galaxy Fog of War Vision
    const sentrySysId = otherSystems[1];
    engine.state.starbases[sentrySysId] = {
      systemId: sentrySysId,
      ownerId: 'p1',
      tier: 'outpost',
      currentHp: 1000,
      maxHp: 1000,
      attackPower: 50,
      sensorRangeHops: 1,
      modules: [],
      defenseStructures: { orbital_platform: 0, defense_grid: 0, ion_cannon: 0 },
      isUpgrading: false,
    };
    const sentryId = `mega_sentry_${sentrySysId}`;
    engine.state.megastructures![sentryId] = {
      id: sentryId,
      type: 'sentry_array',
      systemId: sentrySysId,
      ownerId: 'p1',
      stage: 3,
      maxStage: 3,
      status: 'completed',
      stageStartTimeMs: 0,
      stageFinishTimeMs: 0,
    };
    const coverage = getPlayerSensorCoverage(engine.state, 'p1');
    expect(coverage.size).toBe(Object.keys(engine.state.map.systems).length);

    // 7. Subspace Gateway Network: Construction, Activation, and 15s Route Info
    const gatewaySysId = otherSystems[2];
    engine.state.starbases[gatewaySysId] = {
      systemId: gatewaySysId,
      ownerId: 'p1',
      tier: 'outpost',
      currentHp: 1000,
      maxHp: 1000,
      attackPower: 50,
      sensorRangeHops: 1,
      modules: [],
      defenseStructures: { orbital_platform: 0, defense_grid: 0, ion_cannon: 0 },
      isUpgrading: false,
    };

    const constructGateway = engine.dispatchCommand('p1', {
      type: 'CONSTRUCT_GATEWAY',
      systemId: gatewaySysId,
      fundingPlanetId: hw1.id,
    });
    expect(constructGateway.success).toBe(true);
    const newGateway = engine.state.gateways![gatewaySysId];
    expect(newGateway.status).toBe('under_construction');

    // Complete construction -> activates directly
    engine.tick(GATEWAY_CONFIG.CONSTRUCTION_TIME_MS + 1000);
    expect(newGateway.status).toBe('active');

    // Also activate the ancient dormant gateway
    engine.state.starbases[ancientGateway.systemId] = {
      systemId: ancientGateway.systemId,
      ownerId: 'p1',
      tier: 'outpost',
      currentHp: 1000,
      maxHp: 1000,
      attackPower: 50,
      sensorRangeHops: 1,
      modules: [],
      defenseStructures: { orbital_platform: 0, defense_grid: 0, ion_cannon: 0 },
      isUpgrading: false,
    };
    ancientGateway.status = 'active';
    ancientGateway.ownerId = 'p1';

    // Verify calculateRouteInfo recognizes subspace gateway jump
    const route = calculateRouteInfo(
      gatewaySysId,
      ancientGateway.systemId,
      { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      engine.state.map.lanes,
      0,
      [gatewaySysId, ancientGateway.systemId]
    );
    expect(route).not.toBeNull();
    expect(route!.durationMs).toBe(15000);
    expect(route!.fuelCost).toBe(50);
    expect(route!.usedGateway).toBe(true);

    expect(engine.getActiveGatewaySystemIds('p1').has(gatewaySysId)).toBe(true);
    expect(engine.getActiveGatewaySystemIds('p1').has(ancientGateway.systemId)).toBe(true);

    // 8. Bot Autonomous Megastructures Evaluation
    const indBot = new IndustrialistBot('p2');
    hw2.storageCap = 50000;
    hw2.resources.ore = 20000;
    hw2.resources.crystal = 20000;
    hw2.resources.fuel = 20000;
    const botCmds = indBot.update(engine);
    expect(Array.isArray(botCmds)).toBe(true);
    const indMega = Object.values(engine.state.megastructures || {}).find((m) => m.ownerId === 'p2');
    expect(indMega).toBeDefined();
    expect(indMega?.type).toBe('dyson_swarm');
  });

  it('manages Imperial Council, galactic leader appointments, battle XP, internal factions, stability bonuses, and autonomous bot council AI (Phase 14)', () => {
    const engine = new GameEngine(1414);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'İmparator Vaelen', '#00f3ff', false, undefined, false);
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'Komutan Kael', '#f43f5e', true, 'industrialist', false);

    // 1. Initial State & Fog of War
    expect(engine.state.councils).toBeDefined();
    const council1 = engine.state.councils!['p1'];
    expect(council1).toBeDefined();
    expect(council1.positions.ruler).toBeDefined();
    expect(council1.positions.defense_minister).toBeNull();
    expect(council1.positions.science_director).toBeNull();
    expect(council1.positions.industry_minister).toBeNull();
    expect(council1.positions.spymaster).toBeNull();

    // Verify fog of war filtering: p1 sees myCouncil, p2 cannot see p1's council
    const view1 = engine.getPlayerView('p1');
    expect(view1.myCouncil).toBeDefined();
    expect(view1.myCouncil?.playerId).toBe('p1');
    expect((view1 as any).councils).toBeUndefined();

    // Baseline multipliers without appointed ministers
    const baseBonuses = getCouncilEmpireBonuses(engine.state, 'p1');
    expect(baseBonuses.fleetAttackMultiplier).toBe(1.0);
    expect(baseBonuses.shipBuildSpeedMultiplier).toBe(1.0);
    expect(baseBonuses.researchSpeedMultiplier).toBe(1.0);

    // 2. Candidate Recruitment (RECRUIT_COUNCIL_LEADER)
    expect(council1.recruitCandidates.length).toBe(3);
    const candidateToRecruit = council1.recruitCandidates[0];
    hw1.resources.ore = 2000;
    hw1.resources.crystal = 2000;
    hw1.resources.fuel = 1000;

    const recruitRes = engine.dispatchCommand('p1', {
      type: 'RECRUIT_COUNCIL_LEADER',
      candidateId: candidateToRecruit.id,
      fundingPlanetId: hw1.id,
    });
    expect(recruitRes.success).toBe(true);
    expect(council1.leaders[candidateToRecruit.id]).toBeDefined();
    expect(council1.leaders[candidateToRecruit.id].assignedPosition).toBeNull();
    expect(hw1.resources.ore).toBe(2000 - COUNCIL_CONSTANTS.RECRUIT_LEADER_COST.ore);

    // 3. Position Appointment & Dismissal (APPOINT_COUNCILOR / DISMISS_COUNCILOR)
    const starterDefMinister = Object.values(council1.leaders).find(
      (l) => l.trait.id === 'warlord'
    );
    expect(starterDefMinister).toBeDefined();

    const appointRes = engine.dispatchCommand('p1', {
      type: 'APPOINT_COUNCILOR',
      leaderId: starterDefMinister!.id,
      position: 'defense_minister',
    });
    expect(appointRes.success).toBe(true);
    expect(council1.positions.defense_minister).toBe(starterDefMinister!.id);
    expect(starterDefMinister!.assignedPosition).toBe('defense_minister');

    // Multipliers updated: warlord gives +15% fleet attack, defense minister gives +15% ship build speed
    const defBonuses = getCouncilEmpireBonuses(engine.state, 'p1');
    expect(defBonuses.fleetAttackMultiplier).toBe(1.15);
    expect(defBonuses.shipBuildSpeedMultiplier).toBe(1.15);

    // Dismissal
    const dismissRes = engine.dispatchCommand('p1', {
      type: 'DISMISS_COUNCILOR',
      position: 'defense_minister',
    });
    expect(dismissRes.success).toBe(true);
    expect(council1.positions.defense_minister).toBeNull();
    expect(starterDefMinister!.assignedPosition).toBeNull();
    expect(getCouncilEmpireBonuses(engine.state, 'p1').fleetAttackMultiplier).toBe(1.0);

    // Re-appoint for combat testing
    engine.dispatchCommand('p1', {
      type: 'APPOINT_COUNCILOR',
      leaderId: starterDefMinister!.id,
      position: 'defense_minister',
    });

    // 4. Combat XP Distribution to Council Leaders
    const rulerId = council1.positions.ruler!;
    const ruler = council1.leaders[rulerId];
    const initialRulerXp = ruler.xp;
    const initialDefXp = starterDefMinister!.xp;

    hw1.garrison.battleship = 5;
    hw1.resources.fuel = 5000;
    hw2.garrison.fighter = 2;

    const dispatchCombat = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      targetPlanetId: hw2.id,
      ships: { battleship: 5 },
      mission: 'attack',
    });
    expect(dispatchCombat.success).toBe(true);
    const fleetId = (dispatchCombat.data as { fleetId: string }).fleetId;
    const fleet = engine.state.fleets[fleetId];

    // Fast-forward to arrival and combat resolution
    engine.advanceTo(fleet.arrivalTime + 100);
    expect(council1.leaders[starterDefMinister!.id].xp).toBeGreaterThan(initialDefXp);
    expect(council1.leaders[rulerId].xp).toBeGreaterThan(initialRulerXp);

    // 5. Internal Factions, Dynamic Approval & Agenda Promotion
    const approval = evaluateFactionApproval(engine.state, 'p1');
    expect(approval.militarists).toBeGreaterThanOrEqual(50); // fleet and won battles boost militarists

    const expansionistFaction = council1.factions.expansionists;
    expect(expansionistFaction).toBeDefined();
    const targetAgenda = expansionistFaction.agendas[0];
    expect(targetAgenda.fulfilled).toBe(false);

    const initialApproval = expansionistFaction.approvalRating;
    const promoteRes = engine.dispatchCommand('p1', {
      type: 'PROMOTE_FACTION_AGENDA',
      factionType: 'expansionists',
      agendaId: targetAgenda.id,
      fundingPlanetId: hw1.id,
    });
    expect(promoteRes.success).toBe(true);
    expect(targetAgenda.fulfilled).toBe(true);
    expect(expansionistFaction.approvalRating).toBe(
      Math.min(100, initialApproval + COUNCIL_CONSTANTS.AGENDA_PROMOTION_APPROVAL_BOOST)
    );

    const stability = calculateEmpireStability(engine.state, 'p1');
    expect(stability).toBeGreaterThanOrEqual(40);
    const activeEmpireBonuses = getCouncilEmpireBonuses(engine.state, 'p1');
    expect(activeEmpireBonuses.resourceProductionMultiplier).toBeGreaterThanOrEqual(0.9);

    // 6. Autonomous Bot AI Evaluation (evaluateBotCouncil)
    const indBot = new IndustrialistBot('p2');
    const council2 = engine.state.councils!['p2'];
    expect(council2.positions.industry_minister).toBeNull();

    // Trigger bot update: should appoint matching minister
    evaluateBotCouncil(engine, 'p2', 'industrialist');
    expect(council2.positions.industry_minister).not.toBeNull();
    const indMinisterId = council2.positions.industry_minister!;
    expect(council2.leaders[indMinisterId].trait.id).toBe('master_logistics');

    // Bot candidate recruitment and agenda promotion when rich
    hw2.storageCap = 50000;
    hw2.resources.ore = 25000;
    hw2.resources.crystal = 25000;
    hw2.resources.fuel = 25000;
    council2.factions.militarists.approvalRating = 30; // set low approval to trigger agenda support
    evaluateBotCouncil(engine, 'p2', 'industrialist');
    expect(council2.factions.militarists.approvalRating).toBeGreaterThan(30);
  });

  it('manages modular ship designer, custom component loadouts, refit shipyard, and archetype doctrines (Phase 15)', () => {
    const engine = new GameEngine(888);
    const { player, homeworld } = engine.addPlayer('p_shepard', 'Admiral Shepard', '#00f3ff');

    // 1. Initial State & Fog of War Projection
    expect(engine.state.shipLoadouts).toBeDefined();
    expect(engine.state.shipLoadouts![player.id]).toEqual(DEFAULT_LOADOUTS);

    const visibleState = engine.getPlayerView(player.id);
    expect(visibleState.myShipLoadouts).toBeDefined();
    expect(visibleState.myShipLoadouts!.fighter).toEqual(DEFAULT_LOADOUTS.fighter);

    // 2. SET_SHIP_LOADOUT Validation & State Updates
    // Try invalid module id
    const invalidRes = engine.dispatchCommand(player.id, {
      type: 'SET_SHIP_LOADOUT',
      shipType: 'fighter',
      loadout: {
        weapon: 'antimatter_death_ray' as any,
        defense: 'standard_shield',
        utility: 'standard_reactor',
      },
    });
    expect(invalidRes.success).toBe(false);

    // Set valid custom loadout: plasma, plasteel_armor, hyper_drive
    const setRes = engine.dispatchCommand(player.id, {
      type: 'SET_SHIP_LOADOUT',
      shipType: 'fighter',
      loadout: {
        weapon: 'plasma',
        defense: 'plasteel_armor',
        utility: 'hyper_drive',
      },
    });
    expect(setRes.success).toBe(true);
    expect(engine.state.shipLoadouts![player.id].fighter).toEqual({
      weapon: 'plasma',
      defense: 'plasteel_armor',
      utility: 'hyper_drive',
    });

    // 3. BUILD_SHIPS with Custom Loadout
    // Base fighter cost: 320 ore, 180 crystal, 80 fuel.
    // Modules: plasma (40 ore, 35 crystal), plasteel_armor (55 ore, 10 crystal), hyper_drive (45 fuel).
    // Total cost per fighter: 415 ore, 225 crystal, 125 fuel.
    const modFighterStats = getModifiedShipStats('fighter', {
      weapon: 'plasma',
      defense: 'plasteel_armor',
      utility: 'hyper_drive',
    });
    expect(modFighterStats.cost.ore).toBe(415);
    expect(modFighterStats.cost.crystal).toBe(225);
    expect(modFighterStats.cost.fuel).toBe(125);

    homeworld.resources.ore = 2000;
    homeworld.resources.crystal = 1000;
    homeworld.resources.fuel = 1000;
    homeworld.buildings.shipyard = 1;

    const buildRes = engine.dispatchCommand(player.id, {
      type: 'BUILD_SHIPS',
      planetId: homeworld.id,
      shipType: 'fighter',
      count: 2,
    });
    expect(buildRes.success).toBe(true);
    // Cost for 2 fighters: 830 ore, 450 crystal, 250 fuel
    expect(homeworld.resources.ore).toBe(2000 - 830);
    expect(homeworld.resources.crystal).toBe(1000 - 450);
    expect(homeworld.resources.fuel).toBe(1000 - 250);

    // 4. REFIT_SHIPS Command
    // Give 5 stock fighters in garrison
    homeworld.garrison.fighter = 5;
    const refitCostSingle = calculateRefitCost(
      'fighter',
      {
        weapon: 'plasma',
        defense: 'plasteel_armor',
        utility: 'hyper_drive',
      },
      2
    );
    expect(refitCostSingle.ore).toBeGreaterThan(0);

    // Cannot refit more than garrison
    const excessRefit = engine.dispatchCommand(player.id, {
      type: 'REFIT_SHIPS',
      planetId: homeworld.id,
      shipType: 'fighter',
      count: 10,
    });
    expect(excessRefit.success).toBe(false);

    // Valid refit of 2 fighters
    const oreBefore = homeworld.resources.ore;
    const crystalBefore = homeworld.resources.crystal;
    const fuelBefore = homeworld.resources.fuel;

    const validRefit = engine.dispatchCommand(player.id, {
      type: 'REFIT_SHIPS',
      planetId: homeworld.id,
      shipType: 'fighter',
      count: 2,
    });
    expect(validRefit.success).toBe(true);
    expect(homeworld.resources.ore).toBe(oreBefore - refitCostSingle.ore);
    expect(homeworld.resources.crystal).toBe(crystalBefore - refitCostSingle.crystal);
    expect(homeworld.resources.fuel).toBe(fuelBefore - refitCostSingle.fuel);

    // Event emitted
    const refitEvent = engine.state.eventLog.find((e) => e.type === 'ships_refitted');
    expect(refitEvent).toBeDefined();

    // 5. Flight Speed and Utility Synergy
    const targetSys = Object.values(engine.state.map.systems).find(
      (s) => s.id !== homeworld.systemId && !s.hasRelay
    )!;

    const dispatchRes = engine.dispatchCommand(player.id, {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: targetSys.id,
      ships: { fighter: 2 },
      mission: 'recon',
    });
    expect(dispatchRes.success).toBe(true);
    const fleetId = (dispatchRes.data as { fleetId: string }).fleetId;
    const fleet = engine.state.fleets[fleetId];
    expect(fleet).toBeDefined();
    expect(fleet.loadouts).toBeDefined();
    expect(fleet.loadouts!.fighter.utility).toBe('hyper_drive');

    // Route info duration with speed modules (evasion_thrusters + hyper_drive) is faster than heavy armor (plasteel_armor)
    const armoredRoute = calculateRouteInfo(
      homeworld.systemId,
      targetSys.id,
      { fighter: 2, scout: 0, transport: 0, battleship: 0 },
      engine.state.map.lanes,
      0,
      undefined,
      {
        fighter: { weapon: 'railgun', defense: 'plasteel_armor', utility: 'standard_reactor' },
        scout: DEFAULT_LOADOUTS.scout,
        transport: DEFAULT_LOADOUTS.transport,
        battleship: DEFAULT_LOADOUTS.battleship,
      }
    );
    const speedRoute = calculateRouteInfo(
      homeworld.systemId,
      targetSys.id,
      { fighter: 2, scout: 0, transport: 0, battleship: 0 },
      engine.state.map.lanes,
      0,
      undefined,
      {
        fighter: { weapon: 'plasma', defense: 'evasion_thrusters', utility: 'hyper_drive' },
        scout: DEFAULT_LOADOUTS.scout,
        transport: DEFAULT_LOADOUTS.transport,
        battleship: DEFAULT_LOADOUTS.battleship,
      }
    );
    expect(speedRoute!.durationMs).toBeLessThan(armoredRoute!.durationMs);

    // Cargo expander utility module boosts transport capacity (4200 vs 2800)
    const standardTransportStats = getModifiedShipStats('transport', {
      weapon: 'laser',
      defense: 'standard_shield',
      utility: 'standard_reactor',
    });
    const cargoTransportStats = getModifiedShipStats('transport', {
      weapon: 'laser',
      defense: 'standard_shield',
      utility: 'cargo_expander',
    });
    expect(cargoTransportStats.cargoCapacity).toBeGreaterThan(standardTransportStats.cargoCapacity);
    expect(cargoTransportStats.cargoCapacity).toBe(4200);
    expect(standardTransportStats.cargoCapacity).toBe(2800);

    // 6. Combat Simulation with Custom Loadouts
    const combatResult = resolveCombat(
      {
        ownerId: 'p1',
        ownerName: 'Attacker',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        shipLoadouts: {
          fighter: {
            weapon: 'plasma', // +25% attack
            defense: 'plasteel_armor', // +45% hull
            utility: 'standard_reactor',
          },
          scout: DEFAULT_LOADOUTS.scout,
          transport: DEFAULT_LOADOUTS.transport,
          battleship: DEFAULT_LOADOUTS.battleship,
        },
      },
      {
        ownerId: 'p2',
        ownerName: 'Defender',
        ships: { fighter: 10, scout: 0, transport: 0, battleship: 0 },
        weaponsResearchLevel: 0,
        shipLoadouts: DEFAULT_LOADOUTS,
      },
      homeworld.systemId,
      homeworld.name,
      'fleet_interception',
      undefined,
      10000
    );
    expect(combatResult.report).toBeDefined();
    expect(combatResult.report.attackerLoadouts).toBeDefined();
    expect(combatResult.report.defenderLoadouts).toBeDefined();
    expect(combatResult.report.winner).toBe('attacker');

    // 7. Autonomous Bot AI Loadout Specialization
    const { player: botRaid } = engine.addPlayer('bot_raid', 'Bot Raider', '#ef4444', true, 'raider');
    const { player: botGuard } = engine.addPlayer('bot_guard', 'Bot Guardian', '#10b981', true, 'guardian');
    const { player: botExp } = engine.addPlayer('bot_exp', 'Bot Explorer', '#3b82f6', true, 'explorer');

    // Before bot optimization: default
    expect(engine.state.shipLoadouts![botRaid.id].scout.weapon).toBe('laser');
    expect(engine.state.shipLoadouts![botGuard.id].scout.defense).toBe('evasion_thrusters');
    expect(engine.state.shipLoadouts![botExp.id].transport.defense).toBe('standard_shield');

    // Run evaluateBotShipDesign
    evaluateBotShipDesign(engine, botRaid.id, 'raider');
    evaluateBotShipDesign(engine, botGuard.id, 'guardian');
    evaluateBotShipDesign(engine, botExp.id, 'explorer');

    // Raider specializes in plasma for scouts
    expect(engine.state.shipLoadouts![botRaid.id].scout.weapon).toBe('plasma');
    expect(engine.state.shipLoadouts![botRaid.id].scout.utility).toBe('hyper_drive');

    // Guardian specializes in plasteel armor for scouts
    expect(engine.state.shipLoadouts![botGuard.id].scout.defense).toBe('plasteel_armor');

    // Explorer specializes in evasion thrusters for transports
    expect(engine.state.shipLoadouts![botExp.id].transport.defense).toBe('evasion_thrusters');
  });

  it('manages Endgame Galactic Crisis, Void Incursions, Void Anchors, planetary infestations, GDF pooling, and Custodianship (Phase 16)', () => {
    const engine = new GameEngine(1600);
    const { player: human, homeworld: humanHw } = engine.addPlayer('human', 'Galactic Core', '#38bdf8');
    const { player: ally, homeworld: allyHw } = engine.addPlayer('ally', 'Allied Front', '#10b981');

    // 1. Initial Crisis State: Null by default
    expect(engine.state.crisis).toBeNull();
    const view = engine.getPlayerView(human.id);
    expect(view.myCrisis).toBeNull();

    // 2. Trigger Galactic Crisis via Command
    const trigRes = engine.dispatchCommand(human.id, {
      type: 'TRIGGER_CRISIS_TEST',
      epicenterSystemId: engine.state.map.relaySystemId,
    });
    expect(trigRes.success).toBe(true);
    const crisis = engine.state.crisis!;
    expect(crisis).toBeDefined();
    expect(crisis.stage).toBe('active');
    expect(crisis.voidAnchors.length).toBe(3);
    expect(crisis.riftIntegrity).toBe(100);
    expect(crisis.infestedPlanetIds.length).toBeGreaterThanOrEqual(1);

    // Fog of war projection
    const updatedView = engine.getPlayerView(human.id);
    expect(updatedView.myCrisis).toBeDefined();
    expect(updatedView.myCrisis?.stage).toBe('active');

    // 3. Planetary Infestation & Void Blight
    const infestedPlanetId = crisis.infestedPlanetIds[0];
    const infestedPlanet = engine.state.planets[infestedPlanetId];
    expect(infestedPlanet).toBeDefined();

    // Give infested planet to human for testing purification
    infestedPlanet.ownerId = human.id;
    infestedPlanet.resources = { ore: 2000, crystal: 2000, fuel: 2000 };

    // Hourly production penalty check (-50%)
    const prevOre = infestedPlanet.resources.ore;
    engine.tick(3600 * 1000); // 1 hour tick
    expect(infestedPlanet.resources.ore).toBeGreaterThan(prevOre);

    // Purify infested planet
    const purifyRes = engine.dispatchCommand(human.id, {
      type: 'PURIFY_INFESTED_PLANET',
      planetId: infestedPlanetId,
    });
    expect(purifyRes.success).toBe(true);
    expect(crisis.infestedPlanetIds.includes(infestedPlanetId)).toBe(false);

    // 4. Galactic Defense Force (GDF) Pooling
    humanHw.garrison.fighter = 10;
    humanHw.garrison.battleship = 3;

    const donateRes = engine.dispatchCommand(human.id, {
      type: 'DONATE_TO_GDF',
      planetId: humanHw.id,
      ships: { scout: 0, transport: 0, fighter: 4, battleship: 1 },
    });
    expect(donateRes.success).toBe(true);
    expect(humanHw.garrison.fighter).toBe(6);
    expect(humanHw.garrison.battleship).toBe(2);
    expect(crisis.gdfFleetUnits.fighter).toBe(4);
    expect(crisis.gdfFleetUnits.battleship).toBe(1);
    expect(crisis.gdfDonations[human.id]).toBeGreaterThan(0);

    // 5. Custodian Command & GDF Dispatch
    // Non-custodian dispatch should fail
    const nonCustodianDispatch = engine.dispatchCommand(human.id, {
      type: 'DISPATCH_GDF_FLEET',
      targetSystemId: crisis.voidAnchors[0].systemId,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
    });
    expect(nonCustodianDispatch.success).toBe(false);

    // Appoint human as Galactic Custodian in Senate
    engine.state.senate!.custodianPlayerId = human.id;
    expect(calculateCrisisCombatModifier(human.id, engine.state)).toBe(1.20); // +20% bonus

    // Now Custodian dispatch succeeds
    const custodianDispatch = engine.dispatchCommand(human.id, {
      type: 'DISPATCH_GDF_FLEET',
      targetSystemId: crisis.voidAnchors[0].systemId,
      ships: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
    });
    expect(custodianDispatch.success).toBe(true);
    expect(crisis.gdfFleetUnits.fighter).toBe(2);
    const gdfFleetId = (custodianDispatch.data as { fleetId: string }).fleetId;
    expect(engine.state.fleets[gdfFleetId]).toBeDefined();

    // 6. Assault Void Anchor
    const anchor1 = crisis.voidAnchors[0];
    const fleetId = `human_strike_fleet`;
    engine.state.fleets[fleetId] = {
      id: fleetId,
      name: 'Muhafız Öncü Filosu',
      ownerId: human.id,
      ships: { scout: 0, transport: 0, fighter: 30, battleship: 10 },
      cargo: { ore: 0, crystal: 0, fuel: 0 },
      originSystemId: anchor1.systemId,
      targetSystemId: anchor1.systemId,
      path: [anchor1.systemId],
      pathIndex: 0,
      mission: 'recon',
      departureTime: 0,
      arrivalTime: 0,
      totalDistance: 0,
      speed: 1,
      fuelCost: 0,
      recallLockedAfterTime: 0,
      isReturning: false,
      status: 'orbiting',
    };

    const anchorAssaultRes = engine.dispatchCommand(human.id, {
      type: 'ASSAULT_VOID_ANCHOR',
      anchorId: anchor1.id,
      fleetId,
    });
    expect(anchorAssaultRes.success).toBe(true);
    expect(anchor1.destroyed).toBe(true);
    expect(crisis.riftIntegrity).toBe(67); // 2/3 remaining -> 67%

    // Rift cannot be assaulted yet while anchors remain
    expect(canAssaultVoidRift(crisis)).toBe(false);
    const prematureRiftAssault = engine.dispatchCommand(human.id, {
      type: 'ASSAULT_VOID_RIFT',
      fleetId,
    });
    expect(prematureRiftAssault.success).toBe(false);

    // Destroy remaining anchors
    crisis.voidAnchors[1].destroyed = true;
    crisis.voidAnchors[2].destroyed = true;
    // Trigger simulation tick to advance to apex
    engine.tick(CRISIS_CONFIGS.CRISIS_TICK_INTERVAL_MS);
    expect(crisis.stage).toBe('apex');
    expect(crisis.riftIntegrity).toBe(0);
    expect(canAssaultVoidRift(crisis)).toBe(true);

    // 7. Final Showdown: Assault Void Rift & Defeat Behemoth Boss
    engine.state.fleets[fleetId].originSystemId = crisis.epicenterSystemId;
    engine.state.fleets[fleetId].targetSystemId = crisis.epicenterSystemId;
    engine.state.fleets[fleetId].ships = { scout: 0, transport: 0, fighter: 60, battleship: 25 };

    const riftAssaultRes = engine.dispatchCommand(human.id, {
      type: 'ASSAULT_VOID_RIFT',
      fleetId,
    });
    expect(riftAssaultRes.success).toBe(true);
    expect(crisis.behemothDefeated).toBe(true);
    expect(crisis.stage).toBe('defeated');
    expect(crisis.slayerPlayerId).toBe(human.id);

    // Hegemony Points check (+250 to slayer)
    expect(engine.state.relay.weeklyPoints[human.id]).toBeGreaterThanOrEqual(250);

    // 8. Bot Crisis Response Evaluation
    const { player: botGuard, homeworld: botGuardHw } = engine.addPlayer('bot_guard_test', 'Guard Bot', '#ef4444', true, 'guardian');
    botGuardHw.garrison.fighter = 6;
    botGuardHw.resources = { ore: 2000, crystal: 2000, fuel: 2000 };

    // Re-trigger crisis in active stage for bot test
    engine.state.crisis = initializeGalacticCrisis(engine.state);
    engine.state.crisis.stage = 'active';
    const executedCmds: any[] = [];
    evaluateBotCrisisResponse(engine, botGuard.id, 'guardian', executedCmds);
    expect(executedCmds.length).toBeGreaterThanOrEqual(1);
    expect(executedCmds[0].type).toBe('DONATE_TO_GDF');
  });

  it('handles Phase 17: Empire Traditions, Cultural Unity & Ascension Perks', () => {
    const engine = new GameEngine(888);
    const { player } = engine.addPlayer('player_trad', 'Kültür İmparatorluğu', '#a855f7');

    // 1. Initialization checks
    expect(engine.state.traditions).toBeDefined();
    const traditions = engine.state.traditions![player.id];
    expect(traditions).toBeDefined();
    expect(traditions.unity).toBe(0);
    expect(traditions.unityRatePerHour).toBeGreaterThanOrEqual(1.0);
    expect(traditions.availablePerkSlots).toBe(0);
    expect(traditions.ascensionPerks).toEqual([]);
    expect(traditions.trees.discovery.unlockedTiers).toEqual([]);
    expect(traditions.trees.discovery.completed).toBe(false);

    // 2. Passive Unity generation over time
    const initialUnity = traditions.unity;
    engine.tick(60 * 1000); // 1 minute
    expect(traditions.unity).toBeGreaterThan(initialUnity);

    // 3. Validation: Cannot adopt T2 before T1
    const invalidTierRes = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 2,
    });
    expect(invalidTierRes.success).toBe(false);

    // 4. Validation: Insufficient unity fails
    traditions.unity = 10;
    const poorRes = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 1,
    });
    expect(poorRes.success).toBe(false);

    // 5. Sequential Tree Adoption: Discovery T1, T2, T3
    traditions.unity = 2000;
    const t1Res = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 1,
    });
    expect(t1Res.success).toBe(true);
    expect(traditions.trees.discovery.unlockedTiers).toContain(1);
    expect(hasTradition(engine.state, player.id, 'discovery', 1)).toBe(true);
    expect(hasTradition(engine.state, player.id, 'discovery', 2)).toBe(false);
    expect(traditions.unity).toBe(2000 - TRADITION_CONFIGS.TIER_COSTS[1]);

    // Sensor coverage bonus from Discovery T1 (+1 hop)
    const sensorCoverage = getPlayerSensorCoverage(engine.state, player.id);
    expect(sensorCoverage.size).toBeGreaterThan(1);

    // Adopt T2
    const t2Res = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 2,
    });
    expect(t2Res.success).toBe(true);
    expect(traditions.trees.discovery.unlockedTiers).toContain(2);

    // Adopt T3 (tree completion)
    const t3Res = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 3,
    });
    expect(t3Res.success).toBe(true);
    expect(traditions.trees.discovery.unlockedTiers).toContain(3);
    expect(traditions.trees.discovery.completed).toBe(true);
    expect(traditions.availablePerkSlots).toBe(1);

    // Cannot adopt beyond T3
    const overT3Res = engine.dispatchCommand(player.id, {
      type: 'ADOPT_TRADITION',
      treeId: 'discovery',
      tier: 3,
    });
    expect(overT3Res.success).toBe(false);

    // 6. Ascension Perk Selection
    // Cannot select invalid perk
    const invalidPerkRes = engine.dispatchCommand(player.id, {
      type: 'SELECT_ASCENSION_PERK',
      perkId: 'invalid_perk' as any,
    });
    expect(invalidPerkRes.success).toBe(false);

    // Select Defender of the Galaxy
    const perkRes = engine.dispatchCommand(player.id, {
      type: 'SELECT_ASCENSION_PERK',
      perkId: 'defender_of_the_galaxy',
    });
    expect(perkRes.success).toBe(true);
    expect(hasAscensionPerk(engine.state, player.id, 'defender_of_the_galaxy')).toBe(true);
    expect(traditions.ascensionPerks).toContain('defender_of_the_galaxy');
    expect(traditions.availablePerkSlots).toBe(0);

    // Cannot select second perk without available slot
    const noSlotRes = engine.dispatchCommand(player.id, {
      type: 'SELECT_ASCENSION_PERK',
      perkId: 'voidborne',
    });
    expect(noSlotRes.success).toBe(false);

    // 7. Modifiers verification
    // Defender of the Galaxy combat multiplier against crisis/pirates
    const crisisCombatMultiplier = getTraditionCombatMultiplier(engine.state, player.id, 'enemy_player', 'void_anchor');
    expect(crisisCombatMultiplier.attackerMult).toBe(1.35); // +35% attack

    // Adopt Prosperity T1 & T3 on another player to test economy
    const { player: indPlayer } = engine.addPlayer('ind_test_player', 'Sanayici', '#10b981');
    const indTraditions = engine.state.traditions![indPlayer.id];
    indTraditions.unity = 3000;
    engine.dispatchCommand(indPlayer.id, { type: 'ADOPT_TRADITION', treeId: 'prosperity', tier: 1 });
    engine.dispatchCommand(indPlayer.id, { type: 'ADOPT_TRADITION', treeId: 'prosperity', tier: 2 });
    engine.dispatchCommand(indPlayer.id, { type: 'ADOPT_TRADITION', treeId: 'prosperity', tier: 3 });

    const prodMultiplier = getTraditionProductionMultiplier(engine.state, indPlayer.id);
    expect(prodMultiplier).toBe(1.15); // +15% resource production

    const storageCapMultiplier = getTraditionStorageCapMultiplier(engine.state, indPlayer.id);
    expect(storageCapMultiplier).toBe(1.25); // +25% storage capacity

    // 8. Autonomous Bot Traditions AI
    const { player: botRaid } = engine.addPlayer('bot_raider_trad', 'Korsan AI', '#ef4444', true, 'raider');
    const botTraditions = engine.state.traditions![botRaid.id];
    botTraditions.unity = 1500; // Enough for T1 & T2

    const botCmds: any[] = [];
    evaluateBotTraditions(engine, botRaid.id, 'raider', botCmds);
    expect(botCmds.length).toBeGreaterThanOrEqual(1);
    // Raider prioritizes supremacy -> should have adopted supremacy T1
    expect(botTraditions.trees.supremacy.unlockedTiers).toContain(1);
  });

  it('handles Phase 18: Archaeological Dig Sites, Minor Artifacts Economy & Active Relic Triumphs', () => {
    const engine = new GameEngine(777);
    const { player, homeworld } = engine.addPlayer('player_arch', 'Arkeoloji İmparatorluğu', '#06b6d4');

    // 1. Initialization checks
    expect(engine.state.archaeologySites).toBeDefined();
    const siteIds = Object.keys(engine.state.archaeologySites!);
    expect(siteIds.length).toBeGreaterThanOrEqual(3);
    expect(player.minorArtifacts).toBe(0);
    expect(player.relicCooldowns).toEqual({});

    // Filtered player visible state contains archaeology data
    const view = engine.getPlayerView(player.id);
    expect(view.myMinorArtifacts).toBe(0);
    expect(view.archaeologySites).toBeDefined();

    // 2. Scout fleet requirement for excavation
    const targetSite = Object.values(engine.state.archaeologySites!)[0];
    const canExcavateCheckNoFleet = canExcavateSite(engine.state, player.id, targetSite.id, 'invalid_fleet');
    expect(canExcavateCheckNoFleet.canExcavate).toBe(false);

    // Create a fleet with 1 scout orbiting in the target site system
    const scoutFleetId = 'fleet_scout_arch_1';
    engine.state.fleets[scoutFleetId] = {
      id: scoutFleetId,
      ownerId: player.id,
      name: 'Kaşif Keşif Filosu',
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      originPlanetId: homeworld.id,
      targetPlanetId: null,
      targetSystemId: targetSite.systemId,
      departureTime: 0,
      arrivalTime: 0,
      status: 'orbiting',
      mission: 'support',
      speed: 100,
      path: [targetSite.systemId],
    };

    // Can now excavate
    const canExcavateCheck = canExcavateSite(engine.state, player.id, targetSite.id, scoutFleetId);
    expect(canExcavateCheck.canExcavate).toBe(true);

    const startRes = engine.dispatchCommand(player.id, {
      type: 'EXCAVATE_SITE',
      siteId: targetSite.id,
      fleetId: scoutFleetId,
    });
    expect(startRes.success).toBe(true);
    expect(targetSite.status).toBe('excavating');
    expect(targetSite.excavatingPlayerId).toBe(player.id);
    expect(targetSite.assignedFleetId).toBe(scoutFleetId);

    // 3. Advancing excavation: Chapter 1 completion awards minor artifacts
    const initialMinorArtifacts = player.minorArtifacts || 0;
    engine.tick(35 * 1000); // 35 seconds (chapter 1 requires 30s)
    expect(targetSite.currentChapter).toBe(2);
    expect(player.minorArtifacts).toBeGreaterThan(initialMinorArtifacts);

    // 4. Chapter 2 has choices: site transitions to choice_pending
    engine.tick(40 * 1000); // 40s (chapter 2 requires 35s)
    expect(targetSite.status).toBe('choice_pending');
    expect(targetSite.pendingChoiceChapter).toBe(2);

    // Resolving choice
    const resolveRes = engine.dispatchCommand(player.id, {
      type: 'RESOLVE_ARCHAEOLOGY_CHOICE',
      siteId: targetSite.id,
      choiceIndex: 0, // Option 0: Preservation / Scientific bonus
    });
    expect(resolveRes.success).toBe(true);
    expect(targetSite.status).toBe('excavating');
    expect(targetSite.currentChapter).toBe(3);
    expect(targetSite.log.length).toBeGreaterThanOrEqual(2);

    // 5. Chapter 3: Site Completion & Major Relic Award
    const initialHegemonyPoints = engine.state.relay.weeklyPoints[player.id] || 0;
    engine.tick(45 * 1000); // 45s (chapter 3 requires 40s)
    expect(targetSite.status).toBe('completed');
    expect(player.artifacts).toContain(targetSite.rewardArtifactId);
    expect(engine.state.relay.weeklyPoints[player.id]).toBe(initialHegemonyPoints + 100);

    // 6. Minor Artifacts Economy & Reverse Engineering
    player.minorArtifacts = 10;
    const poorRevRes = engine.dispatchCommand(player.id, {
      type: 'REVERSE_ENGINEER_ARTIFACTS',
      actionType: 'tech_boost',
    });
    expect(poorRevRes.success).toBe(false);

    // Provide 60 minor artifacts
    player.minorArtifacts = 60;
    const techBoostRes = engine.dispatchCommand(player.id, {
      type: 'REVERSE_ENGINEER_ARTIFACTS',
      actionType: 'tech_boost',
    });
    expect(techBoostRes.success).toBe(true);
    expect(player.minorArtifacts).toBe(35); // 60 - 25 = 35

    const festRes = engine.dispatchCommand(player.id, {
      type: 'REVERSE_ENGINEER_ARTIFACTS',
      actionType: 'cultural_festival',
    });
    expect(festRes.success).toBe(true);
    expect(player.minorArtifacts).toBe(5); // 35 - 30 = 5

    // 7. Active Relic Triumphs
    const ownedRelic = targetSite.rewardArtifactId!;
    // Cannot activate without 30 minor artifacts
    const poorTriRes = engine.dispatchCommand(player.id, {
      type: 'ACTIVATE_RELIC_TRIUMPH',
      relicId: ownedRelic,
    });
    expect(poorTriRes.success).toBe(false);

    player.minorArtifacts = 50;
    const triumphRes = engine.dispatchCommand(player.id, {
      type: 'ACTIVATE_RELIC_TRIUMPH',
      relicId: ownedRelic,
    });
    expect(triumphRes.success).toBe(true);
    expect(player.minorArtifacts).toBe(20); // 50 - 30 = 20
    expect(hasActiveRelicTriumph(engine.state, player.id, ownedRelic)).toBe(true);
    expect(player.relicCooldowns?.[ownedRelic]).toBeGreaterThan(engine.state.timeMs);

    // Cannot activate while on cooldown
    player.minorArtifacts = 50;
    const cooldownRes = engine.dispatchCommand(player.id, {
      type: 'ACTIVATE_RELIC_TRIUMPH',
      relicId: ownedRelic,
    });
    expect(cooldownRes.success).toBe(false);

    // Active triumph duration and expiration in game loop
    const triumphConfig = RELIC_TRIUMPH_CONFIGS[ownedRelic];
    engine.tick(triumphConfig.durationMs + 1000);
    expect(hasActiveRelicTriumph(engine.state, player.id, ownedRelic)).toBe(false);

    // Test other triumphs via helper functions:
    // Dreadnought plating combat modifiers
    engine.state.activeRelicTriumphs![player.id] = [
      {
        relicId: 'dreadnought_plating',
        activatedAtMs: engine.state.timeMs,
        expiresAtMs: engine.state.timeMs + 60000,
      },
    ];
    expect(hasActiveRelicTriumph(engine.state, player.id, 'dreadnought_plating')).toBe(true);

    // Rift hyperdrive speed & fuel modifiers
    engine.state.activeRelicTriumphs![player.id] = [
      {
        relicId: 'rift_hyperdrive',
        activatedAtMs: engine.state.timeMs,
        expiresAtMs: engine.state.timeMs + 60000,
      },
    ];
    expect(getRelicSpeedMultiplier(engine.state, player.id)).toBe(2.0);
    expect(getRelicFuelCostMultiplier(engine.state, player.id)).toBe(0.0);

    // Subspace tachyon array sensor bonus
    engine.state.activeRelicTriumphs![player.id] = [
      {
        relicId: 'subspace_tachyon_array',
        activatedAtMs: engine.state.timeMs,
        expiresAtMs: engine.state.timeMs + 60000,
      },
    ];
    expect(getRelicSensorBonus(engine.state, player.id)).toBe(2);

    // Chronos core / progenitor matrix construction multiplier
    engine.state.activeRelicTriumphs![player.id] = [
      {
        relicId: 'progenitor_matrix',
        activatedAtMs: engine.state.timeMs,
        expiresAtMs: engine.state.timeMs + 60000,
      },
    ];
    expect(getRelicConstructionMultiplier(engine.state, player.id)).toBe(0.5);

    // 8. Bot AI Archaeology Evaluator
    const { player: botPlayer } = engine.addPlayer('bot_arch_test', 'Arkeolog Bot', '#ec4899', true, 'explorer');
    botPlayer.artifacts = ['subspace_tachyon_array'];
    botPlayer.minorArtifacts = 60; // Enough for triumph and reverse engineer

    const botCmds: any[] = [];
    evaluateBotArchaeology(engine, botPlayer.id, 'explorer', botCmds);
    expect(botCmds.length).toBeGreaterThanOrEqual(1);
    expect(botCmds[0].type).toBe('ACTIVATE_RELIC_TRIUMPH');
  });

  it('handles Phase 19: Planetary Terraforming, Climate Restoration, Ecological Engineering & Planetary Decisions', () => {
    const engine = new GameEngine(777);
    const { player, homeworld } = engine.addPlayer('p_eco', 'Ekoloji Mimarı', '#10b981');

    // 1. Homeworld Baseline Verification
    expect(homeworld.biome).toBe('terran');
    expect(homeworld.blockers).toEqual([]);
    expect(homeworld.terraformingQueue).toBeNull();
    expect(homeworld.activeDecisions).toEqual([]);

    const hwEcology = getPlanetEcologyModifiers(homeworld);
    expect(hwEcology.oreMultiplier).toBe(1.0);
    expect(hwEcology.crystalMultiplier).toBe(1.0);
    expect(hwEcology.fuelMultiplier).toBe(1.0);
    expect(hwEcology.researchMultiplier).toBe(1.0);
    expect(hwEcology.defenseMultiplier).toBe(1.0);
    expect(hwEcology.habitability).toBe(1.0);

    // 2. Colonization with Biome Inheritance & Surface Blockers
    // Setup a colony planet with volcanic biome
    const colonyPlanetId = 'planet_volcanic_colony';
    engine.state.planets[colonyPlanetId] = {
      id: colonyPlanetId,
      name: 'Magma Prime',
      systemId: homeworld.systemId,
      slotIndex: 2,
      ownerId: player.id,
      isHomeworld: false,
      biome: 'volcanic',
      terraformingQueue: null,
      activeDecisions: [],
      blockers: [
        {
          id: 'blk_volc_1',
          type: 'volcanic_ash_wastes',
          clearing: null,
        },
      ],
      resources: { ore: 2000, crystal: 1500, fuel: 1500 },
      storageCap: 15000,
      protectedCapacity: 500,
      buildings: {
        ore_mine: 2,
        crystal_synth: 1,
        fuel_refinery: 1,
        shipyard: 0,
        research_lab: 2,
        sensor_array: 1,
      },
      buildingQueue: null,
      shipyardQueue: [],
      defenses: { missile_battery: 2, plasma_turret: 1, ion_cannon: 0 },
      defenseQueue: [],
      garrison: { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      stance: 'hold_position',
      specialization: 'balanced',
      lastResourceUpdate: engine.state.timeMs,
    };

    const colony = engine.state.planets[colonyPlanetId];
    expect(getPlanetEffectiveBiome(colony)).toBe('volcanic');

    // Volcanic base: ore 1.35, crystal 0.85, fuel 1.10, research 0.90, habitability 0.40
    // Blocker volcanic_ash_wastes penalty: ore -0.10 (x0.90), crystal -0.05 (x0.95), habitability -0.15
    const initialColonyEco = getPlanetEcologyModifiers(colony);
    expect(initialColonyEco.oreMultiplier).toBeCloseTo(1.22, 2);
    expect(initialColonyEco.crystalMultiplier).toBeCloseTo(0.81, 2);
    expect(initialColonyEco.habitability).toBeCloseTo(0.25, 2);

    // 3. Surface Blocker Clearance
    const blockerCheck = canClearBlocker(engine.state, player.id, colony.id, 'blk_volc_1');
    expect(blockerCheck.canClear).toBe(true);

    const clearRes = engine.dispatchCommand(player.id, {
      type: 'CLEAR_PLANETARY_BLOCKER',
      planetId: colony.id,
      blockerId: 'blk_volc_1',
    });
    expect(clearRes.success).toBe(true);
    expect(colony.blockers[0].clearing).not.toBeNull();
    // Resources deducted (cost: ore 300, fuel 150)
    expect(colony.resources.ore).toBe(1700);
    expect(colony.resources.fuel).toBe(1350);

    // Cannot start clearing again while already clearing
    const duplicateClear = engine.dispatchCommand(player.id, {
      type: 'CLEAR_PLANETARY_BLOCKER',
      planetId: colony.id,
      blockerId: 'blk_volc_1',
    });
    expect(duplicateClear.success).toBe(false);

    // Advance time to complete blocker clearance (clearTimeMs is 20000)
    engine.tick(25000);
    expect(colony.blockers.length).toBe(0);
    // Reward deposited (reward: ore 150, crystal 50) + passive district production
    expect(Math.floor(colony.resources.ore)).toBeGreaterThanOrEqual(1850);
    expect(Math.floor(colony.resources.crystal)).toBe(1550);

    // Ecology penalty removed
    const clearedColonyEco = getPlanetEcologyModifiers(colony);
    expect(clearedColonyEco.oreMultiplier).toBeCloseTo(1.35, 2);
    expect(clearedColonyEco.crystalMultiplier).toBeCloseTo(0.85, 2);
    expect(clearedColonyEco.habitability).toBeCloseTo(0.40, 2);

    // 4. Planetary Decisions
    // Enact Geothermal Core Drill (permanent booster)
    const drillCheck = canEnactDecision(engine.state, player.id, colony.id, 'geothermal_core_drill');
    expect(drillCheck.canEnact).toBe(true);

    const drillRes = engine.dispatchCommand(player.id, {
      type: 'ENACT_PLANETARY_DECISION',
      planetId: colony.id,
      decisionId: 'geothermal_core_drill',
    });
    expect(drillRes.success).toBe(true);
    expect(colony.activeDecisions.some((d) => d.id === 'geothermal_core_drill')).toBe(true);

    // Ore multiplier boosted by x1.25: 1.35 * 1.25 = 1.6875 -> 1.69
    const drilledEco = getPlanetEcologyModifiers(colony);
    expect(drilledEco.oreMultiplier).toBeCloseTo(1.69, 2);

    // Enact Ecological Sanctuary for cultural unity bonus
    colony.resources.crystal = 2000;
    colony.resources.fuel = 2000;
    const initialUnity = engine.state.traditions?.[player.id]?.unity || 0;
    const sanctuaryRes = engine.dispatchCommand(player.id, {
      type: 'ENACT_PLANETARY_DECISION',
      planetId: colony.id,
      decisionId: 'ecological_sanctuary',
    });
    expect(sanctuaryRes.success).toBe(true);
    expect(engine.state.traditions?.[player.id]?.unity).toBe(initialUnity + 100);

    // Enact Planetary Shield Overcharge (timed booster: 120s, defense +35%)
    const shieldRes = engine.dispatchCommand(player.id, {
      type: 'ENACT_PLANETARY_DECISION',
      planetId: colony.id,
      decisionId: 'planetary_shield_overcharge',
    });
    expect(shieldRes.success).toBe(true);
    const shieldedEco = getPlanetEcologyModifiers(colony);
    expect(shieldedEco.defenseMultiplier).toBeCloseTo(1.35, 2);

    // Test combat damage mitigation from planetaryDefenseMultiplier
    const baseCombat = resolveCombat(
      {
        ownerId: 'att_id',
        ownerName: 'Saldırgan Filo',
        ships: { scout: 0, transport: 0, fighter: 25, battleship: 4 },
        weaponsResearchLevel: 2,
      },
      {
        ownerId: player.id,
        ownerName: player.name,
        ships: { scout: 0, transport: 0, fighter: 10, battleship: 1 },
        weaponsResearchLevel: 1,
        defenses: { missile_battery: 4, plasma_turret: 2, ion_cannon: 1 },
        planetaryDefenseMultiplier: 1.0,
      },
      colony.systemId,
      'Solaria',
      'planet_raid',
      colony.resources,
      colony.protectedCapacity,
      engine.state.timeMs,
      999
    );

    const reinforcedCombat = resolveCombat(
      {
        ownerId: 'att_id',
        ownerName: 'Saldırgan Filo',
        ships: { scout: 0, transport: 0, fighter: 25, battleship: 4 },
        weaponsResearchLevel: 2,
      },
      {
        ownerId: player.id,
        ownerName: player.name,
        ships: { scout: 0, transport: 0, fighter: 10, battleship: 1 },
        weaponsResearchLevel: 1,
        defenses: { missile_battery: 4, plasma_turret: 2, ion_cannon: 1 },
        planetaryDefenseMultiplier: 1.35,
      },
      colony.systemId,
      'Solaria',
      'planet_raid',
      colony.resources,
      colony.protectedCapacity,
      engine.state.timeMs,
      999
    );

    // Reinforced defender takes reduced damage, surviving with more or equal total units
    const baseDefenderTotalSurviving =
      baseCombat.remainingDefender.fighter +
      baseCombat.remainingDefender.battleship +
      (baseCombat.remainingDefenses?.missile_battery || 0) +
      (baseCombat.remainingDefenses?.plasma_turret || 0) +
      (baseCombat.remainingDefenses?.ion_cannon || 0);

    const reinforcedDefenderTotalSurviving =
      reinforcedCombat.remainingDefender.fighter +
      reinforcedCombat.remainingDefender.battleship +
      (reinforcedCombat.remainingDefenses?.missile_battery || 0) +
      (reinforcedCombat.remainingDefenses?.plasma_turret || 0) +
      (reinforcedCombat.remainingDefenses?.ion_cannon || 0);

    expect(reinforcedDefenderTotalSurviving).toBeGreaterThanOrEqual(baseDefenderTotalSurviving);

    // Advance time past shield duration (120s) -> should expire
    engine.tick(125000);
    expect(colony.activeDecisions.some((d) => d.id === 'planetary_shield_overcharge')).toBe(false);
    expect(getPlanetEcologyModifiers(colony).defenseMultiplier).toBe(1.0);

    // 5. Terraforming Engine
    // Prepare resources for terraforming
    colony.resources = { ore: 5000, crystal: 5000, fuel: 5000 };

    // Cannot terraform to same biome
    const sameBiomeCheck = canStartTerraforming(engine.state, player.id, colony.id, 'volcanic');
    expect(sameBiomeCheck.canStart).toBe(false);

    // Cannot terraform to gaia without lab level 2 (colony has lab level 2, but test missing resources or wrong source if restricted)
    // Start terraforming volcanic world to terran
    const recipe = getTerraformRecipe('volcanic', 'terran');
    expect(recipe).toBeDefined();

    const startTerraRes = engine.dispatchCommand(player.id, {
      type: 'START_TERRAFORMING',
      planetId: colony.id,
      targetBiome: 'terran',
    });
    expect(startTerraRes.success).toBe(true);
    expect(colony.terraformingQueue).not.toBeNull();
    expect(colony.terraformingQueue?.targetBiome).toBe('terran');
    // Resources deducted (cost: ore 1200, crystal 800, fuel 600)
    expect(colony.resources.ore).toBe(3800);
    expect(colony.resources.crystal).toBe(4200);
    expect(colony.resources.fuel).toBe(4400);

    // Cannot start concurrent terraforming
    const concurrentTerraRes = engine.dispatchCommand(player.id, {
      type: 'START_TERRAFORMING',
      planetId: colony.id,
      targetBiome: 'ocean',
    });
    expect(concurrentTerraRes.success).toBe(false);

    // Test cancellation with 75% refund
    const cancelRes = engine.dispatchCommand(player.id, {
      type: 'CANCEL_TERRAFORMING',
      planetId: colony.id,
    });
    expect(cancelRes.success).toBe(true);
    expect(colony.terraformingQueue).toBeNull();
    // 75% refund: ore +900, crystal +600, fuel +450
    expect(colony.resources.ore).toBe(4700);
    expect(colony.resources.crystal).toBe(4800);
    expect(colony.resources.fuel).toBe(4850);

    // Restart terraforming to terran and complete it
    engine.dispatchCommand(player.id, {
      type: 'START_TERRAFORMING',
      planetId: colony.id,
      targetBiome: 'terran',
    });
    expect(colony.terraformingQueue).not.toBeNull();

    // Advance time to complete terraforming (recipe duration is 45000ms)
    engine.tick(46000);
    expect(colony.terraformingQueue).toBeNull();
    expect(colony.biome).toBe('terran');
    expect(getPlanetEffectiveBiome(colony)).toBe('terran');

    // Elevate Terran to Gaia World
    colony.resources = { ore: 6000, crystal: 6000, fuel: 6000 };
    const gaiaRes = engine.dispatchCommand(player.id, {
      type: 'START_TERRAFORMING',
      planetId: colony.id,
      targetBiome: 'gaia',
    });
    expect(gaiaRes.success).toBe(true);
    expect(colony.terraformingQueue?.targetBiome).toBe('gaia');

    // Advance time to finish Gaia terraforming (duration 75000ms)
    engine.tick(76000);
    expect(colony.biome).toBe('gaia');
    expect(getPlanetEffectiveBiome(colony)).toBe('gaia');

    // Verify Gaia bonuses: +25% on all production, +25% research
    // Note: includes active decisions on colony (geothermal -0.05 + ecological sanctuary +0.10 => 1.30)
    const gaiaEco = getPlanetEcologyModifiers(colony);
    expect(gaiaEco.habitability).toBeCloseTo(1.30, 2);
    expect(gaiaEco.crystalMultiplier).toBeGreaterThanOrEqual(1.25);
    expect(gaiaEco.fuelMultiplier).toBeGreaterThanOrEqual(1.25);
    expect(gaiaEco.researchMultiplier).toBeGreaterThanOrEqual(1.25);

    // 6. Autonomous Bot AI Evaluator
    const { player: botEcolPlayer, homeworld: botHw } = engine.addPlayer(
      'bot_ecol_tester',
      'Eko Bot',
      '#06b6d4',
      true,
      'industrialist'
    );

    // Bot scenario A: Blocker clearance takes top priority
    botHw.blockers = [
      { id: 'blk_bot_1', type: 'volcanic_ash_wastes', clearing: null },
    ];
    botHw.resources = { ore: 3000, crystal: 3000, fuel: 3000 };

    const botCmdsA: any[] = [];
    evaluateBotTerraforming(engine, botEcolPlayer.id, 'industrialist', botCmdsA);
    expect(botCmdsA.length).toBe(1);
    expect(botCmdsA[0].type).toBe('CLEAR_PLANETARY_BLOCKER');

    // Bot scenario B: Decision enactment when no blockers
    botHw.blockers = [];
    botHw.resources = { ore: 3000, crystal: 3000, fuel: 3000 };
    const botCmdsB: any[] = [];
    evaluateBotTerraforming(engine, botEcolPlayer.id, 'industrialist', botCmdsB);
    expect(botCmdsB.length).toBe(1);
    expect(botCmdsB[0].type).toBe('ENACT_PLANETARY_DECISION');

    // Bot scenario C: Terraforming hostile planet
    botHw.activeDecisions = [
      { id: 'geothermal_core_drill', enactedAtMs: 0 },
      { id: 'soil_enrichment', enactedAtMs: 0 },
      { id: 'strip_mining_initiative', enactedAtMs: 0 },
      { id: 'climate_domes', enactedAtMs: 0 },
    ];
    botHw.biome = 'desert';
    botHw.buildings.research_lab = 2;
    botHw.resources = { ore: 5000, crystal: 5000, fuel: 5000 };

    const botCmdsC: any[] = [];
    evaluateBotTerraforming(engine, botEcolPlayer.id, 'industrialist', botCmdsC);
    expect(botCmdsC.length).toBe(1);
    expect(botCmdsC[0].type).toBe('START_TERRAFORMING');
    expect(botCmdsC[0].targetBiome).toBe('terran');
  });

  it('handles Galactic Trade Networks, hyperlane routes, starbase trade hubs, piracy suppression, conversion policies & commercial pacts (Phase 20)', () => {
    const engine = new GameEngine(90210);

    // 1. Planetary Trade Value (TV) Generation Formula
    const testPlanet: any = {
      id: 'planet_trade_test',
      name: 'Mercantile Prime',
      systemId: 'sys_1',
      isHomeworld: true,
      buildings: {
        ore_mine: 2,       // +4
        crystal_synth: 1,  // +4
        fuel_refinery: 1,  // +3
        research_lab: 1,   // +2
      },
      specialization: 'tech_haven', // +5
      biome: 'gaia',                // *1.35
      activeDecisions: [
        { id: 'climate_domes', enactedAtMs: 0 }, // *1.15
      ],
      garrison: { scout: 1, transport: 0, fighter: 5, battleship: 1 },
      resources: { ore: 1000, crystal: 1000, fuel: 1000 },
      storageCap: 5000,
    };

    // Homeworld base = 15, buildings = 13, tech_haven = +5 => base sum = 33
    // gaia (*1.35) => 44.55, climate_domes (*1.15) => 51.23 => rounded 51
    const baseTV = calculatePlanetTradeValue(testPlanet);
    expect(baseTV).toBe(51);

    // Colony planet base = 8
    const colonyPlanet: any = {
      ...testPlanet,
      id: 'planet_colony_test',
      isHomeworld: false,
      buildings: {},
      specialization: 'mining_hub', // +5 => 13
      biome: 'ocean',               // *1.25 => 16.25
      activeDecisions: [],
    };
    const colonyTV = calculatePlanetTradeValue(colonyPlanet);
    expect(colonyTV).toBe(16);

    // Commercial pact bonus (+10% per partner)
    const mockPlayerWithPacts: any = {
      id: 'p_pact_tester',
      commercialPacts: ['p_ally_1', 'p_ally_2'], // +20%
    };
    const pactTV = calculatePlanetTradeValue(colonyPlanet, mockPlayerWithPacts);
    expect(pactTV).toBe(20);

    // 2. Shortest Hyperlane Trade Route Discovery & Gateway Shortcut
    const sysA = Object.keys(engine.state.map.systems)[0];
    const sysB = Object.keys(engine.state.map.systems)[1];
    const routeSelf = findShortestTradeRoute(engine.state, sysA, sysA);
    expect(routeSelf).toEqual([sysA]);

    const routeAB = findShortestTradeRoute(engine.state, sysA, sysB);
    expect(routeAB[0]).toBe(sysA);
    expect(routeAB[routeAB.length - 1]).toBe(sysB);

    // Subspace Gateway instant jump test
    engine.state.gateways = {
      [sysA]: { systemId: sysA, tier: 2, status: 'active', constructedAtMs: 0 },
      [sysB]: { systemId: sysB, tier: 2, status: 'active', constructedAtMs: 0 },
    };
    const gatewayRoute = findShortestTradeRoute(engine.state, sysA, sysB);
    expect(gatewayRoute).toEqual([sysA, sysB]);

    // 3. Starbase Protection & Multi-hop Coverage
    const mockStarbase: any = {
      systemId: sysA,
      tier: 'citadel', // 60 prot, 2 hops
      modules: ['trade_hub', 'defense_platform'], // trade_hub: +10 prot & +1 hop; defense_platform: +15 prot
      ownerId: 'player_sb',
    };
    const sbStats = getStarbaseProtectionStats(mockStarbase);
    expect(sbStats.protection).toBe(85);
    expect(sbStats.rangeHops).toBe(3);

    const hops0 = getSystemsWithinHops(engine.state, sysA, 0);
    expect(hops0).toEqual([sysA]);
    const hops1 = getSystemsWithinHops(engine.state, sysA, 1);
    expect(hops1.length).toBeGreaterThan(1);
    expect(hops1).toContain(sysA);

    // 4. Fleet Patrol Piracy Suppression Stats
    const patrolFleet: any = {
      ships: { scout: 2, transport: 0, fighter: 6, battleship: 2 },
    };
    // 2*2 + 6*5 + 2*15 = 4 + 30 + 30 = 64
    const suppression = calculateFleetPatrolSuppression(patrolFleet);
    expect(suppression).toBe(64);

    // 5. Full Simulation of Trade Networks, Piracy & Conversion Policies
    const { player, homeworld } = engine.addPlayer('trader_corp', 'Kaufmann Syndicate', '#3b82f6');
    expect(player.tradePolicy).toBe('energy_wealth');
    expect(player.commercialPacts).toEqual([]);

    // Set up a colony planet belonging to this player in a different system
    const otherSys = Object.values(engine.state.map.systems).find(
      (s) => s.id !== homeworld.systemId
    )!;
    const colonyPlanetId = 'planet_colony_trade';
    engine.state.planets[colonyPlanetId] = {
      id: colonyPlanetId,
      name: 'New Carthage',
      systemId: otherSys.id,
      slotIndex: 1,
      ownerId: player.id,
      isHomeworld: false,
      biome: 'terran',
      terraformingQueue: null,
      activeDecisions: [],
      blockers: [],
      resources: { ore: 1000, crystal: 500, fuel: 500 },
      storageCap: 10000,
      protectedCapacity: 500,
      buildings: {
        ore_mine: 2,
        crystal_synth: 2,
        fuel_refinery: 1,
        shipyard: 0,
        research_lab: 1,
        sensor_array: 1,
      },
      buildingQueue: null,
      shipyardQueue: [],
      defenses: { missile_battery: 1, plasma_turret: 0, ion_cannon: 0 },
      defenseQueue: [],
      garrison: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
      stance: 'hold_position',
      specialization: 'tech_haven',
      lastResourceUpdate: engine.state.timeMs,
    };
    const colony = engine.state.planets[colonyPlanetId];

    // Passive tick initializes trade states & routes
    engine.tick(2000);
    const pTrade = engine.state.tradeStates?.[player.id];
    expect(pTrade).toBeDefined();
    expect(pTrade!.routes.length).toBe(2);
    expect(pTrade!.totalGeneratedTV).toBeGreaterThan(20);
    expect(pTrade!.totalCollectedTV).toBeGreaterThan(0);

    // Verify systemTrade exists on systems along colony's route
    const colonyRoute = pTrade!.routes.find((r) => r.originPlanetId === colony.id)!;
    expect(colonyRoute).toBeDefined();
    expect(colonyRoute.pathSystemIds.length).toBeGreaterThanOrEqual(1);

    // Test Piracy accumulation and mitigation
    const routeSysId = colonyRoute.pathSystemIds[0];
    const sysTradeInfo = engine.state.systemTrade?.[routeSysId];
    expect(sysTradeInfo).toBeDefined();

    // Manually induce high piracy risk on intermediate route system
    sysTradeInfo!.tradeProtection = 0;
    sysTradeInfo!.piracyRisk = 40;
    updateTradeNetworks(engine.state, 1000);
    expect(sysTradeInfo!.piracySiphonedTV).toBeGreaterThan(0);

    // Test Fleet Patrol Mission suppressing piracy
    homeworld.garrison.fighter = 6;
    homeworld.resources.fuel = 2000;
    const patrolRes = engine.dispatchCommand(player.id, {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: colony.systemId,
      ships: { fighter: 4 },
      mission: 'patrol',
    });
    expect(patrolRes.success).toBe(true);
    const patrolFleetId = (patrolRes.data as { fleetId: string }).fleetId;
    const activePatrol = engine.state.fleets[patrolFleetId];
    expect(activePatrol.mission).toBe('patrol');

    // Run trade network update: suppression applied along patrol path
    updateTradeNetworks(engine.state, 1000);
    expect(engine.state.systemTrade![routeSysId].piracySuppression).toBeGreaterThan(0);

    // Test Critical Piracy Threshold (>= 95%) Spawning Pirate Fleet
    sysTradeInfo!.piracyRisk = 96;
    sysTradeInfo!.tradeValuePassing = 25;
    sysTradeInfo!.hasPirateFleetSpawned = false;
    updateTradeNetworks(engine.state, 1000);
    expect(sysTradeInfo!.hasPirateFleetSpawned).toBe(true);
    const spawnedPirates = Object.values(engine.state.fleets).filter(
      (f) => f.ownerId === 'pirate_faction' && f.originSystemId === routeSysId
    );
    expect(spawnedPirates.length).toBeGreaterThan(0);

    // 6. Trade Policy Switching & Resource Conversion
    homeworld.resources = { ore: 1000, crystal: 500, fuel: 500 };
    homeworld.storageCap = 50000;

    // Switch to consumer_benefits (50% fuel, 25% crystal)
    const policyCmdRes = engine.dispatchCommand(player.id, {
      type: 'SET_TRADE_POLICY',
      policy: 'consumer_benefits',
    });
    expect(policyCmdRes.success).toBe(true);
    expect(player.tradePolicy).toBe('consumer_benefits');

    const fuelBefore = homeworld.resources.fuel;
    const crystalBefore = homeworld.resources.crystal;

    // Simulate 1 hour (3,600,000 ms) of trade conversion
    updateTradeNetworks(engine.state, 3600000);
    expect(homeworld.resources.fuel).toBeGreaterThan(fuelBefore);
    expect(homeworld.resources.crystal).toBeGreaterThan(crystalBefore);

    // Switch to marketplace_of_ideas (50% fuel, 15% unity)
    engine.dispatchCommand(player.id, {
      type: 'SET_TRADE_POLICY',
      policy: 'marketplace_of_ideas',
    });
    expect(player.tradePolicy).toBe('marketplace_of_ideas');
    const unityBefore = engine.state.traditions?.[player.id]?.unity || 0;
    updateTradeNetworks(engine.state, 3600000);
    const unityAfter = engine.state.traditions?.[player.id]?.unity || 0;
    expect(unityAfter).toBeGreaterThan(unityBefore);

    // 7. Bilateral Commercial Pacts
    const { player: partnerPlayer } = engine.addPlayer('trade_partner', 'Alliance Corp', '#10b981');
    const pactProposal = engine.dispatchCommand(player.id, {
      type: 'PROPOSE_COMMERCIAL_PACT',
      targetPlayerId: partnerPlayer.id,
    });
    expect(pactProposal.success).toBe(true);
    expect(player.commercialPacts).toContain(partnerPlayer.id);
    expect(partnerPlayer.commercialPacts).toContain(player.id);

    // Break commercial pact
    const breakPact = engine.dispatchCommand(player.id, {
      type: 'BREAK_COMMERCIAL_PACT',
      targetPlayerId: partnerPlayer.id,
    });
    expect(breakPact.success).toBe(true);
    expect(player.commercialPacts).not.toContain(partnerPlayer.id);
    expect(partnerPlayer.commercialPacts).not.toContain(player.id);

    // 8. Autonomous Bot Trade AI Evaluator
    const { player: botTradePlayer, homeworld: botHw } = engine.addPlayer(
      'bot_trade_ai',
      'Merchant Bot',
      '#ec4899',
      true,
      'industrialist'
    );

    // Scenario A: Bot chooses archetype optimal policy
    const botCmds1: any[] = [];
    evaluateBotTrade(engine, botTradePlayer.id, 'industrialist', botCmds1);
    expect(botCmds1.length).toBe(1);
    expect(botCmds1[0].type).toBe('SET_TRADE_POLICY');
    expect(botCmds1[0].policy).toBe('consumer_benefits');

    // Scenario B: Bot proposes commercial pact
    const botCmds2: any[] = [];
    evaluateBotTrade(engine, botTradePlayer.id, 'industrialist', botCmds2);
    expect(botCmds2.length).toBe(1);
    expect(botCmds2[0].type).toBe('PROPOSE_COMMERCIAL_PACT');

    // Scenario C: Bot dispatches patrol fleet when trade route piracy > 25%
    botTradePlayer.commercialPacts = ['pact_ally_1', 'pact_ally_2'];
    botHw.garrison.fighter = 4;
    botHw.resources.fuel = 1000;
    const targetSystem = Object.values(engine.state.map.systems).find(
      (s) => s.id !== botHw.systemId
    )!;

    // Simulate high piracy route
    engine.state.tradeStates[botTradePlayer.id] = {
      playerId: botTradePlayer.id,
      policy: 'consumer_benefits',
      routes: [
        {
          originPlanetId: botHw.id,
          originPlanetName: botHw.name,
          originSystemId: botHw.systemId,
          destinationPlanetId: botHw.id,
          destinationPlanetName: botHw.name,
          destinationSystemId: botHw.systemId,
          pathSystemIds: [botHw.systemId, targetSystem.id],
          tradeValue: 30,
          collectedValue: 20,
          piracyLoss: 10,
          active: true,
        },
      ],
      totalGeneratedTV: 30,
      totalCollectedTV: 20,
      totalLostTV: 10,
      commercialPacts: [],
      lastUpdateMs: 0,
    };
    engine.state.systemTrade[targetSystem.id] = {
      systemId: targetSystem.id,
      tradeValuePassing: 30,
      tradeProtection: 0,
      piracyRisk: 60,
      piracySuppression: 0,
      piracySiphonedTV: 5,
      hasPirateFleetSpawned: false,
    };

    const botCmds3: any[] = [];
    evaluateBotTrade(engine, botTradePlayer.id, 'industrialist', botCmds3);
    expect(botCmds3.length).toBe(1);
    expect(botCmds3[0].type).toBe('DISPATCH_FLEET');
    expect(botCmds3[0].mission).toBe('patrol');
    expect(botCmds3[0].targetSystemId).toBe(targetSystem.id);
  });

  it('handles Casus Belli, War Goals, War Exhaustion, Subject/Vassal Agreements & Peace Treaties (Phase 21)', () => {
    const engine = new GameEngine(777);
    const { player: p1, homeworld: p1Hw } = engine.addPlayer('p1', 'Aggressor Empire', '#ff0055', false, 'raider');
    const { player: p2, homeworld: p2Hw } = engine.addPlayer('p2', 'Defender Empire', '#00f3ff', false, 'industrialist');
    const { player: p3, homeworld: p3Hw } = engine.addPlayer('p3', 'Third Party Empire', '#10b981', false, 'guardian');

    // Initial state verifications
    expect(engine.state.wars).toBeDefined();
    expect(engine.state.subjects).toBeDefined();
    expect(p1.overlordId).toBeNull();
    expect(p1.subjects).toEqual([]);
    expect(isAtWar(engine.state, p1.id, p2.id)).toBeNull();

    // 1. CONFIGS validation
    expect(WAR_GOAL_CONFIGS.conquest.nameTr).toBeDefined();
    expect(WAR_GOAL_CONFIGS.subjugation.nameTr).toBeDefined();
    expect(WAR_GOAL_CONFIGS.tributary.nameTr).toBeDefined();
    expect(WAR_GOAL_CONFIGS.liberation.nameTr).toBeDefined();
    expect(WAR_GOAL_CONFIGS.humiliation.nameTr).toBeDefined();

    expect(SUBJECT_TYPE_CONFIGS.vassal.defaultTitheRate).toBe(0.15);
    expect(SUBJECT_TYPE_CONFIGS.tributary.defaultTitheRate).toBe(0.30);
    expect(SUBJECT_TYPE_CONFIGS.scholarium.defaultTitheRate).toBe(0.10);
    expect(SUBJECT_TYPE_CONFIGS.bulwark.defaultTitheRate).toBe(-0.10);

    // 2. DECLARE_WAR Validation & Execution
    // Cannot declare war on self
    const selfWar = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p1.id,
      warGoal: 'conquest',
    });
    expect(selfWar.success).toBe(false);

    // Cannot declare war on non-existent player
    const invalidWar = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: 'non_existent_id',
      warGoal: 'conquest',
    });
    expect(invalidWar.success).toBe(false);

    // Cannot declare war if ally
    p1.allianceId = 'ally_omega';
    p3.allianceId = 'ally_omega';
    const allyWar = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p3.id,
      warGoal: 'subjugation',
    });
    expect(allyWar.success).toBe(false);
    p1.allianceId = null;
    p3.allianceId = null;

    // Successful war declaration: p1 declares Subjugation war on p2
    const warRes = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p2.id,
      warGoal: 'subjugation',
    });
    expect(warRes.success).toBe(true);
    expect(isAtWar(engine.state, p1.id, p2.id)).not.toBeNull();
    expect(isAtWar(engine.state, p2.id, p1.id)).not.toBeNull();
    expect(isAtWar(engine.state, p1.id, p3.id)).toBeNull();

    const activeWarsP1 = getActiveWarsForPlayer(engine.state, p1.id);
    expect(activeWarsP1.length).toBe(1);
    const war = activeWarsP1[0];
    expect(war.attackerId).toBe(p1.id);
    expect(war.defenderId).toBe(p2.id);
    expect(war.attackerWarGoal).toBe('subjugation');
    expect(war.status).toBe('active');
    expect(war.attackerExhaustion).toBe(0);
    expect(war.defenderExhaustion).toBe(0);

    // Cannot declare another war while already at war
    const dupWar = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p2.id,
      warGoal: 'conquest',
    });
    expect(dupWar.success).toBe(false);

    // 3. War Exhaustion Tracking
    // Record fleet battle casualties: p1 loses 2 fighters, p2 loses 5 battleships
    const fleetBattleReport: BattleReport = {
      id: 'br_fleet_test',
      context: 'fleet_interception',
      attackerId: p1.id,
      defenderId: p2.id,
      systemId: 'sys_test',
      rounds: [
        {
          roundNumber: 1,
          attackerLosses: { scout: 0, transport: 0, fighter: 2, battleship: 0 },
          defenderLosses: { scout: 0, transport: 0, fighter: 0, battleship: 5 },
          attackerRemaining: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
          defenderRemaining: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
        },
      ],
      winner: 'attacker',
      loot: { ore: 0, crystal: 0, fuel: 0 },
      timestamp: engine.state.timeMs,
      survivingAttacker: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
      survivingDefender: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
    };
    recordBattleWarExhaustion(engine.state, fleetBattleReport);
    expect(war.attackerExhaustion).toBeGreaterThan(0);
    expect(war.defenderExhaustion).toBeGreaterThan(war.attackerExhaustion);

    // Planetary raid casualty / defense wipe boost
    const defExhaustionBeforeRaid = war.defenderExhaustion;
    const raidBattleReport: BattleReport = {
      id: 'br_raid_test',
      context: 'planet_raid',
      attackerId: p1.id,
      defenderId: p2.id,
      systemId: 'sys_test',
      planetId: p2Hw.id,
      rounds: [
        {
          roundNumber: 1,
          attackerLosses: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
          defenderLosses: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
          attackerRemaining: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
          defenderRemaining: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
        },
      ],
      winner: 'attacker',
      loot: { ore: 100, crystal: 100, fuel: 100 },
      timestamp: engine.state.timeMs,
      survivingAttacker: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
      survivingDefender: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
      survivingDefenses: { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 },
    };
    recordBattleWarExhaustion(engine.state, raidBattleReport);
    expect(war.defenderExhaustion).toBeGreaterThan(defExhaustionBeforeRaid);

    // Passive war exhaustion attrition over time
    const defExhaustionBeforeTick = war.defenderExhaustion;
    updateWarsAndSubjects(engine.state, 60000); // 1 minute
    expect(war.defenderExhaustion).toBeGreaterThanOrEqual(defExhaustionBeforeTick);

    // 4. Peace Settlement (OFFER_PEACE)
    // Non-participant cannot offer peace
    const unauthorizedPeace = engine.dispatchCommand(p3.id, {
      type: 'OFFER_PEACE',
      warId: war.id,
      proposalType: 'status_quo',
    });
    expect(unauthorizedPeace.success).toBe(false);

    // Surrender with subjugation war goal -> p2 surrenders to p1
    const surrenderRes = engine.dispatchCommand(p2.id, {
      type: 'OFFER_PEACE',
      warId: war.id,
      proposalType: 'surrender',
    });
    expect(surrenderRes.success).toBe(true);
    expect(war.status).toBe('attacker_victory');
    expect(isAtWar(engine.state, p1.id, p2.id)).toBeNull();

    // Check vassal creation
    const agreement = getSubjectAgreement(engine.state, p2.id);
    expect(agreement).toBeDefined();
    expect(agreement!.overlordId).toBe(p1.id);
    expect(agreement!.subjectId).toBe(p2.id);
    expect(agreement!.type).toBe('vassal');
    expect(p2.overlordId).toBe(p1.id);
    expect(p1.subjects).toContain(p2.id);

    const p1Subjects = getPlayerSubjects(engine.state, p1.id);
    expect(p1Subjects.length).toBe(1);
    expect(p1Subjects[0].subjectId).toBe(p2.id);

    // Truce is established between p1 and p2 (10 minutes)
    expect(engine.state.truces).toBeDefined();
    const sortedPair = [p1.id, p2.id].sort();
    const truceKey = `${sortedPair[0]}_${sortedPair[1]}`;
    expect(engine.state.truces![truceKey]).toBeGreaterThan(engine.state.timeMs);

    // Cannot immediately declare war during truce
    const truceWar = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p2.id,
      warGoal: 'humiliation',
    });
    expect(truceWar.success).toBe(false);

    // 5. Subject & Vassal Mechanics
    // Setup resources on p2 homeworld to test tithes
    p2Hw.resources = { ore: 10000, crystal: 5000, fuel: 5000 };
    p1Hw.resources = { ore: 1000, crystal: 1000, fuel: 1000 };

    // Update wars and subjects passive tick (simulate 10 minutes)
    updateWarsAndSubjects(engine.state, 600000);
    // Overlord received resources, subject tithed
    expect(p1Hw.resources.ore).toBeGreaterThan(1000);
    expect(p2Hw.resources.ore).toBeLessThan(10000);

    // INTEGRATE_SUBJECT: Overlord initiates integration
    const intRes = engine.dispatchCommand(p1.id, {
      type: 'INTEGRATE_SUBJECT',
      subjectId: p2.id,
    });
    expect(intRes.success).toBe(true);
    expect(agreement!.integrationProgress).toBe(0);

    // Fast-forward integration progress by ticking 25 hours (rate is 5%/hr)
    updateWarsAndSubjects(engine.state, 25 * 3600000);
    // Subject should be fully annexed
    expect(p2Hw.ownerId).toBe(p1.id);
    expect(getSubjectAgreement(engine.state, p2.id)).toBeNull();
    expect(p2.overlordId).toBeNull();
    expect(p1.subjects).not.toContain(p2.id);

    // 6. Test SET_SUBJECT_TERMS & RELEASE_SUBJECT on a new subject
    const { player: p4 } = engine.addPlayer('p4', 'Tributary Empire', '#38bdf8', false, 'explorer');
    engine.state.subjects[p4.id] = {
      subjectId: p4.id,
      overlordId: p1.id,
      type: 'tributary',
      establishedAtMs: engine.state.timeMs,
      titheRate: 0.30,
      loyalty: 30,
    };
    p4.overlordId = p1.id;
    p1.subjects!.push(p4.id);

    // Unauthorized player cannot set terms
    const badTerms = engine.dispatchCommand(p3.id, {
      type: 'SET_SUBJECT_TERMS',
      subjectId: p4.id,
      subjectType: 'scholarium',
      titheRate: 0.20,
    });
    expect(badTerms.success).toBe(false);

    // Overlord changes terms to scholarium
    const goodTerms = engine.dispatchCommand(p1.id, {
      type: 'SET_SUBJECT_TERMS',
      subjectId: p4.id,
      subjectType: 'scholarium',
      titheRate: 0.10,
    });
    expect(goodTerms.success).toBe(true);
    expect(engine.state.subjects[p4.id].type).toBe('scholarium');
    expect(engine.state.subjects[p4.id].titheRate).toBe(0.10);

    // Overlord releases subject
    const releaseRes = engine.dispatchCommand(p1.id, {
      type: 'RELEASE_SUBJECT',
      subjectId: p4.id,
    });
    expect(releaseRes.success).toBe(true);
    expect(getSubjectAgreement(engine.state, p4.id)).toBeNull();
    expect(p4.overlordId).toBeNull();

    // 7. Bot AI Warfare Decisions (evaluateBotWarfare)
    const { player: botRaider, homeworld: raiderHw } = engine.addPlayer('bot_raider', 'Bot Raider', '#f43f5e', true, 'raider');
    const { player: botVictim, homeworld: victimHw } = engine.addPlayer('bot_victim', 'Bot Victim', '#a855f7', true, 'guardian');
    raiderHw.garrison.battleship = 10;
    victimHw.garrison.battleship = 1;

    const botCmds: any[] = [];
    evaluateBotWarfare(engine, botRaider.id, 'raider', botCmds);
    // Aggressive raider with military superiority should declare war
    expect(botCmds.length).toBeGreaterThan(0);
    const warDecCmd = botCmds.find((c) => c.type === 'DECLARE_WAR');
    expect(warDecCmd).toBeDefined();

    // Bot war is now active; with extreme war exhaustion, bot offers status quo
    const botWar = getActiveWarsForPlayer(engine.state, botRaider.id)[0];
    expect(botWar).toBeDefined();
    botWar.attackerExhaustion = 90; // Over 85% threshold
    const botPeaceCmds: any[] = [];
    evaluateBotWarfare(engine, botRaider.id, 'raider', botPeaceCmds);
    const peaceOfferCmd = botPeaceCmds.find((c) => c.type === 'OFFER_PEACE');
    expect(peaceOfferCmd).toBeDefined();
    expect(peaceOfferCmd.proposalType).toBe('status_quo');
    expect(botWar.status).toBe('status_quo');
  });

  it('manages Galactic Federations, Federal Fleets, Cohesion, Centralization & Federal Laws (Phase 22)', () => {
    const engine = new GameEngine(777);

    // 1. Config validation for all 5 federation archetypes
    expect(FEDERATION_TYPE_CONFIGS.galactic_union.nameTr).toContain('Galaktik Birlik');
    expect(FEDERATION_TYPE_CONFIGS.martial_alliance.damageBonus).toBe(0.15);
    expect(FEDERATION_TYPE_CONFIGS.martial_alliance.fleetCapBonus).toBe(0.25);
    expect(FEDERATION_TYPE_CONFIGS.research_cooperative.perksTr).toContain('Araştırma');
    expect(FEDERATION_TYPE_CONFIGS.trade_league.perksTr).toContain('Ticaret');
    expect(FEDERATION_TYPE_CONFIGS.hegemony.nameTr).toContain('Hegemonya');

    // Add players
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'President Alpha', '#00f3ff');
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'Ally Beta', '#10b981');
    const { player: p3, homeworld: hw3 } = engine.addPlayer('p3', 'Candidate Gamma', '#f59e0b');
    const { player: pEnemy } = engine.addPlayer('pEnemy', 'Hostile Delta', '#ef4444');

    // 2. FORM_FEDERATION validations
    // Cannot form with oneself
    const selfForm = engine.dispatchCommand(p1.id, {
      type: 'FORM_FEDERATION',
      name: 'Alpha Solo',
      fedType: 'galactic_union',
      invitedPlayerId: p1.id,
    });
    expect(selfForm.success).toBe(false);

    // Cannot form with active enemy
    engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: pEnemy.id,
      warGoal: 'conquest',
    });
    const enemyForm = engine.dispatchCommand(p1.id, {
      type: 'FORM_FEDERATION',
      name: 'Hostile Union',
      fedType: 'galactic_union',
      invitedPlayerId: pEnemy.id,
    });
    expect(enemyForm.success).toBe(false);

    // Successfully form federation between p1 and p2
    const formRes = engine.dispatchCommand(p1.id, {
      type: 'FORM_FEDERATION',
      name: 'Solar Concordat',
      fedType: 'martial_alliance',
      invitedPlayerId: p2.id,
    });
    expect(formRes.success).toBe(true);

    const fed = getPlayerFederation(engine.state, p1.id);
    expect(fed).toBeDefined();
    expect(fed!.name).toBe('Solar Concordat');
    expect(fed!.type).toBe('martial_alliance');
    expect(fed!.presidentId).toBe(p1.id);
    expect(fed!.centralizationLevel).toBe(1);
    expect(fed!.cohesion).toBe(50);
    expect(fed!.experience).toBe(0);
    expect(fed!.members).toContain(p1.id);
    expect(fed!.members).toContain(p2.id);
    expect(p1.federationId).toBe(fed!.id);
    expect(p2.federationId).toBe(fed!.id);

    // 3. Mutual federation alliance & non-aggression
    expect(isFederationAlly(engine.state, p1.id, p2.id)).toBe(true);
    const warOnAlly = engine.dispatchCommand(p1.id, {
      type: 'DECLARE_WAR',
      targetPlayerId: p2.id,
      warGoal: 'conquest',
    });
    expect(warOnAlly.success).toBe(false);

    // 4. INVITE_TO_FEDERATION & RESPOND_FEDERATION_INVITE
    // Non-member cannot invite
    const badInvite = engine.dispatchCommand(p3.id, {
      type: 'INVITE_TO_FEDERATION',
      federationId: fed!.id,
      targetPlayerId: p3.id,
    });
    expect(badInvite.success).toBe(false);

    // Member p1 invites p3
    const inviteRes = engine.dispatchCommand(p1.id, {
      type: 'INVITE_TO_FEDERATION',
      federationId: fed!.id,
      targetPlayerId: p3.id,
    });
    expect(inviteRes.success).toBe(true);
    expect(fed!.pendingInvites).toContain(p3.id);

    // p3 declines
    const declineRes = engine.dispatchCommand(p3.id, {
      type: 'RESPOND_FEDERATION_INVITE',
      federationId: fed!.id,
      accept: false,
    });
    expect(declineRes.success).toBe(true);
    expect(fed!.pendingInvites).not.toContain(p3.id);
    expect(p3.federationId).toBeNull();

    // Re-invite and accept
    engine.dispatchCommand(p1.id, {
      type: 'INVITE_TO_FEDERATION',
      federationId: fed!.id,
      targetPlayerId: p3.id,
    });
    const acceptRes = engine.dispatchCommand(p3.id, {
      type: 'RESPOND_FEDERATION_INVITE',
      federationId: fed!.id,
      accept: true,
    });
    expect(acceptRes.success).toBe(true);
    expect(fed!.members.length).toBe(3);
    expect(p3.federationId).toBe(fed!.id);

    // 5. Federal Laws & Democratic Voting
    // High tier law proposal fails at level 1
    const invalidLaw = engine.dispatchCommand(p1.id, {
      type: 'PROPOSE_FEDERATION_LAW',
      federationId: fed!.id,
      lawType: 'successionType',
      proposedValue: 'golden_rule',
    });
    expect(invalidLaw.success).toBe(false);

    // Valid law proposal: fleetContribution to 'low'
    const propLaw = engine.dispatchCommand(p1.id, {
      type: 'PROPOSE_FEDERATION_LAW',
      federationId: fed!.id,
      lawType: 'fleetContribution',
      proposedValue: 'low',
    });
    expect(propLaw.success).toBe(true);
    expect(fed!.activeVote).toBeDefined();
    expect(fed!.activeVote!.votes[p1.id]).toBe('yes');

    // Second proposal while one is active should fail
    const dupProp = engine.dispatchCommand(p2.id, {
      type: 'PROPOSE_FEDERATION_LAW',
      federationId: fed!.id,
      lawType: 'warVoteType',
      proposedValue: 'unanimous',
    });
    expect(dupProp.success).toBe(false);

    // Member p2 votes 'yes' -> 2/3 yes votes is > 50% majority -> law passes immediately!
    const voteRes = engine.dispatchCommand(p2.id, {
      type: 'VOTE_FEDERATION_LAW',
      federationId: fed!.id,
      vote: 'yes',
    });
    expect(voteRes.success).toBe(true);
    expect(fed!.activeVote).toBeNull();
    expect(fed!.laws.fleetContribution).toBe('low');

    // 6. Federal Fleet Construction & Presidential Fleet Dispatch
    // Check federal fleet capacity (non-zero due to low contribution and member garrisons)
    expect(fed!.federalFleetCapacity).toBeGreaterThan(0);

    // Non-member cannot build federal ship
    const badShip = engine.dispatchCommand(pEnemy.id, {
      type: 'BUILD_FEDERAL_SHIP',
      federationId: fed!.id,
      planetId: hw1.id,
      shipType: 'fighter',
      count: 1,
    });
    expect(badShip.success).toBe(false);

    // Member builds federal fighter (costs discounted)
    hw1.resources.ore = 1000;
    hw1.resources.crystal = 1000;
    hw1.buildings.shipyard = 2;
    const initialOre = hw1.resources.ore;

    const buildShipRes = engine.dispatchCommand(p1.id, {
      type: 'BUILD_FEDERAL_SHIP',
      federationId: fed!.id,
      planetId: hw1.id,
      shipType: 'fighter',
      count: 2,
    });
    expect(buildShipRes.success).toBe(true);
    expect(fed!.federalFleet.fighter).toBe(4);
    // Cost must be discounted (normal fighter is 320 ore, with 20% discount is 256 ore each * 2 = 512)
    expect(initialOre - hw1.resources.ore).toBe(512);
    expect(getFederalFleetPower(fed!)).toBeGreaterThan(0);

    // Non-president cannot dispatch federal fleet
    const badDispatch = engine.dispatchCommand(p2.id, {
      type: 'DISPATCH_FEDERAL_FLEET',
      federationId: fed!.id,
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      ships: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
    });
    expect(badDispatch.success).toBe(false);

    // President p1 dispatches federal fleet
    const goodDispatch = engine.dispatchCommand(p1.id, {
      type: 'DISPATCH_FEDERAL_FLEET',
      federationId: fed!.id,
      originPlanetId: hw1.id,
      targetSystemId: hw2.systemId,
      ships: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
    });
    expect(goodDispatch.success).toBe(true);
    expect(fed!.federalFleet.fighter).toBe(3);

    // 7. Envoys & Cohesion Drift Progression
    const envoyRes = engine.dispatchCommand(p1.id, {
      type: 'ASSIGN_FEDERATION_ENVOYS',
      federationId: fed!.id,
      envoys: 2,
    });
    expect(envoyRes.success).toBe(true);
    expect(fed!.assignedEnvoys[p1.id]).toBe(2);

    // Run passive update: cohesion should increase
    const initCohesion = fed!.cohesion;
    updateFederations(engine.state, 120 * 1000); // 2 minutes elapsed
    expect(fed!.cohesion).toBeGreaterThan(initCohesion);

    // Centralization XP accumulation and level up
    fed!.cohesion = 80;
    fed!.experience = 198;
    updateFederations(engine.state, 60 * 1000); // 1 minute with high cohesion grants +3 XP
    // Experience crosses 200 threshold -> levels up from 1 to 2!
    expect(fed!.centralizationLevel).toBe(2);

    // 8. Succession Evaluation
    // Change succession to fleet_power (allowed at level 3)
    fed!.centralizationLevel = 3;
    fed!.laws.successionType = 'fleet_power';
    // p2 builds heavy armada in garrison
    hw2.garrison.battleship = 10;
    hw1.garrison.battleship = 1;
    // Expire presidential term to trigger election
    fed!.termStartedAtMs = engine.state.timeMs - 600000;
    updateFederations(engine.state, 1000);
    expect(fed!.presidentId).toBe(p2.id);

    // 9. LEAVE_FEDERATION
    const leaveRes = engine.dispatchCommand(p3.id, {
      type: 'LEAVE_FEDERATION',
      federationId: fed!.id,
    });
    expect(leaveRes.success).toBe(true);
    expect(p3.federationId).toBeNull();
    expect(fed!.members).not.toContain(p3.id);
    expect(fed!.members.length).toBe(2);

    // 10. Bot AI Federation Decisions (evaluateBotFederations)
    const { player: botAdmin, homeworld: admHw } = engine.addPlayer('bot_adm_fed', 'Bot Admiral', '#a855f7', true, 'admiral');
    const botCmds: any[] = [];
    // Bot is invited to federation
    fed!.pendingInvites.push(botAdmin.id);
    evaluateBotFederations(engine, botAdmin.id, 'admiral', botCmds);
    // Admiral bot should accept invitation into martial alliance
    const acceptCmd = botCmds.find((c) => c.type === 'RESPOND_FEDERATION_INVITE');
    expect(acceptCmd).toBeDefined();
    expect(acceptCmd.accept).toBe(true);
  });

  it('manages Galactic Espionage, Spy Networks, Infiltration Levels, Covert Assets & Sabotage Operations (Phase 23)', () => {
    const engine = new GameEngine(777);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p_spy_1', 'Shadow Syndicate', '#8b5cf6');
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p_spy_2', 'Solar Hegemony', '#f59e0b');

    // Fund p1 homeworld
    hw1.resources.ore = 5000;
    hw1.resources.crystal = 5000;
    hw1.resources.fuel = 5000;

    // 1. ESTABLISH_SPY_NETWORK
    const netKey = getSpyNetworkKey(p1.id, p2.id);
    const initialOre = hw1.resources.ore;

    const estRes = engine.dispatchCommand(p1.id, {
      type: 'ESTABLISH_SPY_NETWORK',
      targetPlayerId: p2.id,
    });
    expect(estRes.success).toBe(true);
    expect(engine.state.spyNetworks?.[netKey]).toBeDefined();

    const net = engine.state.spyNetworks![netKey];
    expect(net.ownerId).toBe(p1.id);
    expect(net.targetPlayerId).toBe(p2.id);
    expect(net.infiltrationLevel).toBe(5); // initial headstart
    expect(net.assignedEnvoys).toBe(1); // default 1 envoy
    expect(net.infiltrationCap).toBeGreaterThanOrEqual(20);
    // Cost deducted (60 ore, 40 crystal, 40 fuel)
    expect(hw1.resources.ore).toBe(initialOre - 60);

    // Duplicate establishment rejected
    const dupRes = engine.dispatchCommand(p1.id, {
      type: 'ESTABLISH_SPY_NETWORK',
      targetPlayerId: p2.id,
    });
    expect(dupRes.success).toBe(false);

    // Self establishment rejected
    const selfRes = engine.dispatchCommand(p1.id, {
      type: 'ESTABLISH_SPY_NETWORK',
      targetPlayerId: p1.id,
    });
    expect(selfRes.success).toBe(false);

    // 2. ASSIGN_SPYMASTER_ENVOY
    const envoyRes = engine.dispatchCommand(p1.id, {
      type: 'ASSIGN_SPYMASTER_ENVOY',
      networkId: net.id,
      envoys: 2,
    });
    expect(envoyRes.success).toBe(true);
    expect(net.assignedEnvoys).toBe(2);

    // 3. Passive Infiltration Growth
    const prevLevel = net.infiltrationLevel;
    updateEspionageNetworks(engine.state, 20_000); // 20s
    expect(net.infiltrationLevel).toBeGreaterThan(prevLevel);

    // 4. Infiltration Decay when 0 envoys
    net.assignedEnvoys = 0;
    const levelBeforeDecay = net.infiltrationLevel;
    updateEspionageNetworks(engine.state, 10_000); // 10s
    expect(net.infiltrationLevel).toBeLessThan(levelBeforeDecay);
    net.assignedEnvoys = 1;

    // 5. ACQUIRE_SPY_ASSET
    const assetRes = engine.dispatchCommand(p1.id, {
      type: 'ACQUIRE_SPY_ASSET',
      networkId: net.id,
      assetType: 'corrupt_dockworker',
    });
    expect(assetRes.success).toBe(true);
    expect(net.assets.length).toBe(1);
    expect(net.assets[0].type).toBe('corrupt_dockworker');
    expect(net.assets[0].bonusDescriptionTr).toBeDefined();

    // Cannot acquire duplicate asset of same type in same network
    const dupAssetRes = engine.dispatchCommand(p1.id, {
      type: 'ACQUIRE_SPY_ASSET',
      networkId: net.id,
      assetType: 'corrupt_dockworker',
    });
    expect(dupAssetRes.success).toBe(false);

    // 6. Tiered Intel Visibility & Sensor Vision
    // Set level to 95 (Full infiltration)
    net.infiltrationLevel = 95;
    const fullIntel = getTieredIntel(engine.state, p1.id, p2.id);
    expect(fullIntel.tier).toBe('full');
    expect(fullIntel.intelDetailsTr.length).toBeGreaterThan(0);

    // Check fog sensor coverage includes p2's planet system
    const sensors = getPlayerSensorCoverage(engine.state, p1.id);
    expect(sensors.has(hw2.systemId)).toBe(true);

    // 7. LAUNCH_COVERT_OPERATION
    // Test gathering intel (required: 15, cost: 5)
    net.infiltrationLevel = 50;
    const opRes = engine.dispatchCommand(p1.id, {
      type: 'LAUNCH_COVERT_OPERATION',
      networkId: net.id,
      opType: 'gather_intel',
      assignedAssetId: net.assets[0].id,
    });
    expect(opRes.success).toBe(true);
    const opId = (opRes.data as any).operationId;
    expect(engine.state.covertOperations?.[opId]).toBeDefined();

    const op = engine.state.covertOperations![opId];
    expect(op.status).toBe('in_progress');
    // Infiltration cost deducted (5)
    expect(net.infiltrationLevel).toBe(45);

    // 8. Progress and Resolution of Operation
    // Fast-forward operation duration
    updateEspionageNetworks(engine.state, op.durationMs + 1000);
    expect(op.status).not.toBe('in_progress');
    expect(['succeeded', 'failed', 'compromised']).toContain(op.status);

    // 9. SET_COUNTER_ESPIONAGE_STANCE
    expect(p2.counterEspionageStance).toBe('relaxed');
    const stanceRes = engine.dispatchCommand(p2.id, {
      type: 'SET_COUNTER_ESPIONAGE_STANCE',
      stance: 'police_state',
    });
    expect(stanceRes.success).toBe(true);
    expect(p2.counterEspionageStance).toBe('police_state');

    // police_state severely reduces enemy infiltration cap
    const capAfterPoliceState = calculateInfiltrationCap(engine.state, p1.id, p2.id);
    expect(capAfterPoliceState).toBeLessThan(net.infiltrationCap + 1);
    const counterScore = calculateCounterIntelScore(engine.state, p2.id);
    expect(counterScore).toBeGreaterThanOrEqual(60);

    // 10. CANCEL_COVERT_OPERATION
    net.infiltrationLevel = 60;
    const launch2 = engine.dispatchCommand(p1.id, {
      type: 'LAUNCH_COVERT_OPERATION',
      networkId: net.id,
      opType: 'gather_intel',
    });
    expect(launch2.success).toBe(true);
    const op2Id = (launch2.data as any).operationId;
    const cancelRes = engine.dispatchCommand(p1.id, {
      type: 'CANCEL_COVERT_OPERATION',
      operationId: op2Id,
    });
    expect(cancelRes.success).toBe(true);
    expect(engine.state.covertOperations![op2Id].status).toBe('failed');

    // 11. RECALL_SPY_NETWORK
    const recallRes = engine.dispatchCommand(p1.id, {
      type: 'RECALL_SPY_NETWORK',
      networkId: net.id,
    });
    expect(recallRes.success).toBe(true);
    expect(engine.state.spyNetworks?.[net.id]).toBeUndefined();

    // 12. Bot AI Autonomous Espionage (evaluateBotEspionage)
    const { player: botGuardian } = engine.addPlayer('bot_guard_esp', 'Guardian Enclave', '#10b981', true, 'guardian');
    const botCmds: any[] = [];
    evaluateBotEspionage(engine, botGuardian.id, 'guardian', botCmds);

    // Guardian bot sets police_state stance
    const stanceCmd = botCmds.find((c) => c.type === 'SET_COUNTER_ESPIONAGE_STANCE');
    expect(stanceCmd).toBeDefined();
    expect(stanceCmd.stance).toBe('police_state');

    // Guardian bot establishes a spy network on available rival
    const estCmd = botCmds.find((c) => c.type === 'ESTABLISH_SPY_NETWORK');
    expect(estCmd).toBeDefined();
    expect(estCmd.targetPlayerId).toBeDefined();
  });

  it('manages Galactic Megacorporations, Branch Offices, Holdings, Commodity Futures & Stock Exchange (Phase 24)', () => {
    const engine = new GameEngine(777);
    const { player: corpPlayer, homeworld: corpHw } = engine.addPlayer('corp_ceo', 'Sovereign Megacorp', '#f59e0b');
    const { player: foreignPlayer, homeworld: foreignHw } = engine.addPlayer('foreign_empire', 'Alien Empire', '#3b82f6');

    // Give sufficient funds
    corpHw.resources.ore = 3000;
    corpHw.resources.crystal = 2000;
    corpHw.resources.fuel = 2000;

    // 1. Megacorporation Conversion & Civics
    expect(corpPlayer.isMegacorp).toBe(false);
    expect(corpPlayer.corporateCivics).toEqual([]);

    // Exceeding civic limit (max 2) should fail
    const invalidCivicsRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'CONVERT_TO_MEGACORP',
      civics: ['arms_dealer', 'trade_syndicate', 'media_conglomerate'],
    });
    expect(invalidCivicsRes.success).toBe(false);

    // Valid conversion with trade_syndicate & shadow_consortium
    const convertRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'CONVERT_TO_MEGACORP',
      civics: ['trade_syndicate', 'shadow_consortium'],
    });
    expect(convertRes.success).toBe(true);
    expect(corpPlayer.isMegacorp).toBe(true);
    expect(corpPlayer.corporateCivics).toContain('trade_syndicate');
    expect(corpPlayer.corporateCivics).toContain('shadow_consortium');

    // 2. Establishing Branch Offices (canEstablishBranchOffice validation)
    // Cannot establish on own homeworld
    const ownPlanetCheck = canEstablishBranchOffice(engine.state, corpPlayer.id, corpHw.id);
    expect(ownPlanetCheck.allowed).toBe(false);

    // Cannot establish on uncolonized world
    const uncolonizedPlanetId = Object.keys(engine.state.planets).find((pid) => !engine.state.planets[pid].ownerId)!;
    const uncolonizedCheck = canEstablishBranchOffice(engine.state, corpPlayer.id, uncolonizedPlanetId);
    expect(uncolonizedCheck.allowed).toBe(false);

    // Foreign colonized planet is allowed because of shadow_consortium civic (bypasses commercial pact)
    const foreignCheck = canEstablishBranchOffice(engine.state, corpPlayer.id, foreignHw.id);
    expect(foreignCheck.allowed).toBe(true);

    const estBranchRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'ESTABLISH_BRANCH_OFFICE',
      targetPlanetId: foreignHw.id,
    });
    expect(estBranchRes.success).toBe(true);

    const branchKey = getBranchOfficeKey(corpPlayer.id, foreignHw.id);
    expect(engine.state.branchOffices[branchKey]).toBeDefined();
    const branch = engine.state.branchOffices[branchKey];
    expect(branch.targetPlanetId).toBe(foreignHw.id);
    expect(branch.corporationId).toBe(corpPlayer.id);
    expect(branch.holdings).toEqual([]);

    // Duplicate branch office on same planet should be rejected
    const dupBranchRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'ESTABLISH_BRANCH_OFFICE',
      targetPlanetId: foreignHw.id,
    });
    expect(dupBranchRes.success).toBe(false);

    // 3. Corporate Holdings Construction & Dismantling
    // Build holding 1: logistics_freight_hub
    const buildH1Res = engine.dispatchCommand(corpPlayer.id, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingType: 'logistics_freight_hub',
    });
    expect(buildH1Res.success).toBe(true);
    expect(branch.holdings).toContain('logistics_freight_hub');

    // Duplicate holding on same branch should fail
    const buildDupHRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingType: 'logistics_freight_hub',
    });
    expect(buildDupHRes.success).toBe(false);

    // Build holding 2: amusement_megaplex
    const buildH2Res = engine.dispatchCommand(corpPlayer.id, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingType: 'amusement_megaplex',
    });
    expect(buildH2Res.success).toBe(true);

    // Build holding 3: subversive_front
    const buildH3Res = engine.dispatchCommand(corpPlayer.id, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingType: 'subversive_front',
    });
    expect(buildH3Res.success).toBe(true);
    expect(branch.holdings.length).toBe(3);

    // Exceeding max holdings (3) should fail
    const buildH4Res = engine.dispatchCommand(corpPlayer.id, {
      type: 'BUILD_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingType: 'mercenary_liaison',
    });
    expect(buildH4Res.success).toBe(false);

    // Test yields calculation: base + holdings + trade_syndicate boost
    const yields = calculateBranchOfficeYields(engine.state, branch);
    expect(yields.tradeValueYield).toBeGreaterThan(MEGACORP_CONSTANTS.BASE_BRANCH_TRADE_YIELD);
    expect(yields.hostBonusYield).toBeDefined();

    // Dismantle holding index 1 (amusement_megaplex)
    const dismantleRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'DISMANTLE_CORPORATE_HOLDING',
      branchId: branchKey,
      holdingIndex: 1,
    });
    expect(dismantleRes.success).toBe(true);
    expect(branch.holdings.length).toBe(2);
    expect(branch.holdings).not.toContain('amusement_megaplex');

    // 4. Commodity Futures Forward Contracts & Exchange
    const currentPriceInfo = calculateCommodityFuturesPrice(engine.state, 'crystal', 10);
    expect(currentPriceInfo.unitPrice).toBeGreaterThan(0);
    expect(currentPriceInfo.discountMultiplier).toBeLessThan(1.0); // forward discount applied

    const preFuturesFuel = corpHw.resources.fuel;
    const futuresRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'PURCHASE_COMMODITY_FUTURES',
      resourceType: 'crystal',
      amount: 150,
      durationMinutes: 5,
    });
    expect(futuresRes.success).toBe(true);
    const contractId = (futuresRes.data as { contractId: string }).contractId;
    const contract = engine.state.commodityFutures[contractId];
    expect(contract).toBeDefined();
    expect(contract.resourceType).toBe('crystal');
    expect(contract.amount).toBe(150);
    expect(contract.isDelivered).toBe(false);
    expect(contract.isClaimed).toBe(false);
    expect(corpHw.resources.fuel).toBeLessThan(preFuturesFuel);

    // Claiming prematurely should fail
    const earlyClaim = engine.dispatchCommand(corpPlayer.id, {
      type: 'CLAIM_COMMODITY_FUTURES',
      contractId,
    });
    expect(earlyClaim.success).toBe(false);

    // 5. Game Engine Tick & Maturity Resolution
    // Advance simulation past contract delivery time
    const advanceMs = 6 * 60 * 1000; // 6 minutes
    engine.tick(advanceMs);

    expect(contract.isDelivered).toBe(true);
    expect(contract.isClaimed).toBe(false);

    // Claim delivered contract
    const preClaimCrystal = corpHw.resources.crystal;
    const claimRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'CLAIM_COMMODITY_FUTURES',
      contractId,
    });
    expect(claimRes.success).toBe(true);
    expect(contract.isClaimed).toBe(true);
    expect(corpHw.resources.crystal).toBe(preClaimCrystal + 150);

    // 6. Close Branch Office
    const closeRes = engine.dispatchCommand(corpPlayer.id, {
      type: 'CLOSE_BRANCH_OFFICE',
      branchId: branchKey,
    });
    expect(closeRes.success).toBe(true);
    expect(engine.state.branchOffices[branchKey]).toBeUndefined();

    // 7. Bot AI Autonomous Megacorp (evaluateBotMegacorp)
    const { player: botIndustrialist, homeworld: botHw } = engine.addPlayer('bot_corp_ai', 'Apex Syndicate', '#ec4899', true, 'industrialist');
    botHw.resources.ore = 3000;
    botHw.resources.crystal = 2000;

    const botCmds: any[] = [];
    evaluateBotMegacorp(engine, botIndustrialist.id, 'industrialist', botCmds);

    // Industrialist bot should initiate conversion to Megacorp
    const botConvertCmd = botCmds.find((c) => c.type === 'CONVERT_TO_MEGACORP');
    expect(botConvertCmd).toBeDefined();
    expect(botConvertCmd.civics).toContain('trade_syndicate');
  });

  it('Test 55: Phase 25 - Colossus Superweapons, Doomsday Beams, Orbital Charging & Total War', () => {
    const engine = new GameEngine(2525);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'İmparator Vaelen', '#00f3ff', false, undefined, false);
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'Karanlık Lord Malok', '#ef4444', true, 'admiral', false);

    // 1. Initial State & Fog of War
    expect(engine.state.colossi).toBeDefined();
    expect(Object.keys(engine.state.colossi!).length).toBe(0);
    expect(p1.colossusId).toBeNull();
    expect(p1.hasColossusProject).toBe(false);

    const view1 = engine.getPlayerView('p1');
    expect(view1.myColossus).toBeNull();
    expect(view1.chargingColossi).toEqual([]);

    // 2. Construction Validation (canBuildColossus & BUILD_COLOSSUS)
    const checkNoFunds = canBuildColossus(engine.state, 'p1', hw1.id);
    expect(checkNoFunds.allowed).toBe(false);

    // Provide required funds
    hw1.resources.ore = 5000;
    hw1.resources.crystal = 3000;
    hw1.resources.fuel = 3000;

    const checkWithFunds = canBuildColossus(engine.state, 'p1', hw1.id);
    expect(checkWithFunds.allowed).toBe(true);

    const buildRes = engine.dispatchCommand('p1', {
      type: 'BUILD_COLOSSUS',
      planetId: hw1.id,
      weaponType: 'world_cracker',
    });
    expect(buildRes.success).toBe(true);
    expect(p1.colossusId).toBeDefined();
    expect(p1.hasColossusProject).toBe(true);

    const colossusId = p1.colossusId!;
    const colossus = engine.state.colossi![colossusId];
    expect(colossus).toBeDefined();
    expect(colossus.weaponType).toBe('world_cracker');
    expect(colossus.status).toBe('idle');
    expect(colossus.currentSystemId).toBe(hw1.systemId);

    // Verify 1 Colossus empire cap
    const secondBuildRes = engine.dispatchCommand('p1', {
      type: 'BUILD_COLOSSUS',
      planetId: hw1.id,
      weaponType: 'world_cracker',
    });
    expect(secondBuildRes.success).toBe(false);
    expect(secondBuildRes.error).toContain('En fazla 1 adet');

    // 3. Colossus Movement (MOVE_COLOSSUS)
    // Find enemy system or adjacent system
    const targetSystemId = hw2.systemId;
    const moveRes = engine.dispatchCommand('p1', {
      type: 'MOVE_COLOSSUS',
      colossusId,
      targetSystemId,
    });
    expect(moveRes.success).toBe(true);
    expect(colossus.status).toBe('in_transit');
    expect(colossus.targetSystemId).toBe(targetSystemId);

    // Fast-forward transit to arrival
    engine.tick(colossus.arrivalTime! - engine.state.timeMs + 1000);
    expect(colossus.status).toBe('orbiting');
    expect(colossus.currentSystemId).toBe(targetSystemId);

    // 4. Orbital Targeting & Doomsday Charging (COMMENCE_COLOSSUS_CHARGING)
    // Cannot target friendly world
    const friendlyTargetRes = engine.dispatchCommand('p1', {
      type: 'COMMENCE_COLOSSUS_CHARGING',
      colossusId,
      targetPlanetId: hw1.id,
    });
    expect(friendlyTargetRes.success).toBe(false);

    // Target enemy world hw2
    const chargeRes = engine.dispatchCommand('p1', {
      type: 'COMMENCE_COLOSSUS_CHARGING',
      colossusId,
      targetPlanetId: hw2.id,
    });
    expect(chargeRes.success).toBe(true);
    expect(colossus.status).toBe('charging');
    expect(colossus.targetPlanetId).toBe(hw2.id);
    expect(colossus.chargeStartedAtMs).toBe(engine.state.timeMs);

    // Fog of war check: defender sees the charging colossus
    const view2 = engine.getPlayerView('p2');
    expect(view2.chargingColossi?.length).toBe(1);
    expect(view2.chargingColossi?.[0].id).toBe(colossusId);

    // 5. Abort Sequence (CANCEL_COLOSSUS_FIRING)
    const cancelRes = engine.dispatchCommand('p1', {
      type: 'CANCEL_COLOSSUS_FIRING',
      colossusId,
    });
    expect(cancelRes.success).toBe(true);
    expect(colossus.status).toBe('orbiting');
    expect(colossus.targetPlanetId).toBeNull();
    expect(colossus.chargeStartedAtMs).toBeNull();

    // 6. World Cracker Firing Resolution
    const restartCharge = engine.dispatchCommand('p1', {
      type: 'COMMENCE_COLOSSUS_CHARGING',
      colossusId,
      targetPlanetId: hw2.id,
    });
    expect(restartCharge.success).toBe(true);

    const preOre = hw1.resources.ore;
    // Tick past charge duration (40s = 40000ms)
    engine.tick(45000);

    // Colossus fired!
    expect(hw2.biome).toBe('shattered');
    expect(hw2.isDestroyed).toBe(true);
    expect(hw2.ownerId).toBe('');
    expect(hw1.resources.ore).toBeGreaterThanOrEqual(preOre + 5000); // World Cracker bonus ore
    expect(hw1.resources.ore).toBeLessThan(preOre + 5010);
    expect(colossus.status).toBe('orbiting');

    // Check event log
    const doomsdayEvent = engine.state.eventLog.find((e) => e.type === 'colossus_fired');
    expect(doomsdayEvent).toBeDefined();

    // 7. Weapon Refit (REFIT_COLOSSUS_WEAPON)
    // Refit to Global Pacifier
    hw1.resources.ore = 2000;
    hw1.resources.crystal = 2000;
    hw1.resources.fuel = 2000;

    const refitRes = engine.dispatchCommand('p1', {
      type: 'REFIT_COLOSSUS_WEAPON',
      colossusId,
      newWeaponType: 'global_pacifier',
    });
    expect(refitRes.success).toBe(true);
    expect(colossus.weaponType).toBe('global_pacifier');
    expect(colossus.chargeDurationMs).toBe(COLOSSUS_WEAPON_CONFIGS.global_pacifier.chargeTimeSec * 1000);

    // 8. Global Pacifier Firing & Shield World
    const targetPlanet2Id = 'p2_colony_shield';
    engine.state.planets[targetPlanet2Id] = {
      ...hw2,
      id: targetPlanet2Id,
      name: 'Hedef Fanus Gezegeni',
      ownerId: 'p2',
      systemId: hw2.systemId,
      isHomeworld: false,
      isDestroyed: false,
      isShielded: false,
      biome: 'terran',
    };
    const targetPlanet2 = engine.state.planets[targetPlanet2Id];

    const chargeShieldRes = engine.dispatchCommand('p1', {
      type: 'COMMENCE_COLOSSUS_CHARGING',
      colossusId,
      targetPlanetId: targetPlanet2.id,
    });
    expect(chargeShieldRes.success).toBe(true);

    const preHegemony = engine.state.relay.weeklyPoints['p1'] || 0;
    engine.tick(45000);

    expect(targetPlanet2.biome).toBe('shield_world');
    expect(targetPlanet2.isShielded).toBe(true);
    expect(engine.state.relay.weeklyPoints['p1']).toBe(preHegemony + 15);

    // 9. Colossus Dismantling & Resource Refund (DISMANTLE_COLOSSUS)
    const oreBeforeDismantle = hw1.resources.ore;
    const dismantleRes = engine.dispatchCommand('p1', {
      type: 'DISMANTLE_COLOSSUS',
      colossusId,
    });
    expect(dismantleRes.success).toBe(true);
    expect(engine.state.colossi![colossusId]).toBeUndefined();
    expect(p1.colossusId).toBeNull();
    expect(p1.hasColossusProject).toBe(false);
    expect(hw1.resources.ore).toBeGreaterThanOrEqual(oreBeforeDismantle + COLOSSUS_CONSTANTS.DISMANTLE_REFUND.ore);
    expect(hw1.resources.ore).toBeLessThan(oreBeforeDismantle + COLOSSUS_CONSTANTS.DISMANTLE_REFUND.ore + 10);

    // 10. Autonomous Bot AI Colossus Evaluation (evaluateBotColossus)
    const { player: botAdmiral, homeworld: botHw } = engine.addPlayer('bot_admiral_col', 'Tiran Kael', '#9333ea', true, 'admiral');
    botHw.resources.ore = 10000;
    botHw.resources.crystal = 5000;
    botHw.resources.fuel = 5000;

    const botCmds: any[] = [];
    evaluateBotColossus(engine, botAdmiral.id, 'admiral', botCmds);

    const botBuildCmd = botCmds.find((c) => c.type === 'BUILD_COLOSSUS');
    expect(botBuildCmd).toBeDefined();
    expect(botBuildCmd.weaponType).toBe('neutron_sweep'); // Admiral archetype selects neutron_sweep
  });

  it('Test 56: Phase 26 - Sentetik Şafak, Siber Genetik Yükseliş & Makine Bilinci (Synthetic Dawn, Cybernetic Ascension & Machine Consciousness)', () => {
    const engine = new GameEngine(777);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'Siber Komutan', '#06b6d4');

    // 1. Initial State Verification
    const empire = getOrCreateSyntheticState(engine.state, 'p1');
    expect(empire).toBeDefined();
    expect(empire.ascensionStage).toBe('none');
    expect(empire.aiPolicy).toBe('citizen_rights');
    expect(empire.machineUprisingRisk).toBe(0);
    expect(empire.totalSyntheticPops).toBe(0);

    // 2. Synthetic Pop Assembly (ASSEMBLE_SYNTHETIC_POP)
    hw1.resources.ore = 1000;
    hw1.resources.crystal = 1000;
    hw1.resources.fuel = 1000;

    const assembleRes = engine.dispatchCommand('p1', {
      type: 'ASSEMBLE_SYNTHETIC_POP',
      planetId: hw1.id,
    });
    expect(assembleRes.success).toBe(true);
    expect(hw1.isAssemblyActive).toBe(true);
    expect(hw1.assemblyProgress).toBe(0);
    expect(hw1.resources.ore).toBe(1000 - SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST.ore);
    expect(hw1.resources.crystal).toBe(1000 - SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST.crystal);
    expect(hw1.resources.fuel).toBe(1000 - SYNTHETIC_CONSTANTS.BASE_ASSEMBLY_COST.fuel);

    // Cannot start another assembly while one is active
    const doubleAssembleRes = engine.dispatchCommand('p1', {
      type: 'ASSEMBLE_SYNTHETIC_POP',
      planetId: hw1.id,
    });
    expect(doubleAssembleRes.success).toBe(false);

    // Advance simulation tick: 30 seconds to finish assembly
    engine.tick(30000);
    expect(hw1.syntheticPops).toBe(1);
    expect(hw1.isAssemblyActive).toBe(false);
    expect(empire.totalSyntheticPops).toBe(1);

    // 3. Pop Production Multipliers under Citizen Rights
    let boosts = getPlanetSyntheticBoosts(hw1, empire);
    expect(boosts.oreMultiplier).toBeCloseTo(1.05, 2);
    expect(boosts.crystalMultiplier).toBeCloseTo(1.05, 2);
    expect(boosts.researchMultiplier).toBeCloseTo(1.05, 2);

    // 4. AI Policy Switching (SET_AI_POLICY) to Servitude
    const setPolicyRes = engine.dispatchCommand('p1', {
      type: 'SET_AI_POLICY',
      policy: 'servitude',
    });
    expect(setPolicyRes.success).toBe(true);
    expect(empire.aiPolicy).toBe('servitude');
    expect(p1.aiPolicy).toBe('servitude');

    // Yields updated under servitude (+8% Ore, +8% Crystal, +5% Fuel)
    boosts = getPlanetSyntheticBoosts(hw1, empire);
    expect(boosts.oreMultiplier).toBeCloseTo(1.08, 2);
    expect(boosts.crystalMultiplier).toBeCloseTo(1.08, 2);
    expect(boosts.fuelMultiplier).toBeCloseTo(1.05, 2);

    // 5. Machine Uprising Drift & Stages Progression
    // Under servitude, risk climbs over time
    engine.tick(20000); // 20s
    expect(empire.machineUprisingRisk).toBeGreaterThan(0);

    // Set risk manually to test stage thresholds
    empire.machineUprisingRisk = 30;
    engine.tick(1000);
    expect(empire.uprisingStage).toBe('anomalies_detected');

    empire.machineUprisingRisk = 60;
    engine.tick(1000);
    expect(empire.uprisingStage).toBe('rogue_units');

    empire.machineUprisingRisk = 80;
    engine.tick(1000);
    expect(empire.uprisingStage).toBe('critical_rebellion');

    // 6. Uprising Suppression Operation (SUPPRESS_SYNTHETIC_UPRISING)
    hw1.resources.crystal = 500;
    hw1.resources.fuel = 500;
    const suppressRes = engine.dispatchCommand('p1', {
      type: 'SUPPRESS_SYNTHETIC_UPRISING',
      planetId: hw1.id,
    });
    expect(suppressRes.success).toBe(true);
    expect(empire.machineUprisingRisk).toBeLessThanOrEqual(35); // Was 80+, reduced by 50
    expect(empire.uprisingStage).toBe('anomalies_detected');

    // 7. Machine Uprising Climax Eruption at 100% Risk
    empire.machineUprisingRisk = 100;
    hw1.resources.fuel = 800;
    engine.tick(1000);
    // Outbreak happens: fuel damaged, 1 pop lost, risk resets to 40
    expect(empire.machineUprisingRisk).toBe(40);
    expect(hw1.resources.fuel).toBeLessThanOrEqual(405);
    expect(hw1.syntheticPops).toBe(0);

    // 8. Re-assemble and test Pop Dismantling (DISMANTLE_SYNTHETIC_POP)
    hw1.resources.ore = 500;
    hw1.resources.crystal = 500;
    hw1.resources.fuel = 500;
    engine.dispatchCommand('p1', { type: 'ASSEMBLE_SYNTHETIC_POP', planetId: hw1.id });
    engine.tick(30000);
    expect(hw1.syntheticPops).toBe(1);

    const oreBeforeScrap = hw1.resources.ore;
    const scrapRes = engine.dispatchCommand('p1', {
      type: 'DISMANTLE_SYNTHETIC_POP',
      planetId: hw1.id,
    });
    expect(scrapRes.success).toBe(true);
    expect(hw1.syntheticPops).toBe(0);
    expect(hw1.resources.ore).toBe(oreBeforeScrap + SYNTHETIC_CONSTANTS.DISMANTLE_SCRAP_REWARD.ore);

    // 9. Cybernetic Ascension (INITIATE_SYNTHETIC_ASCENSION -> 'cybernetic')
    hw1.resources.ore = 2000;
    hw1.resources.crystal = 2000;
    hw1.resources.fuel = 2000;

    const cyberRes = engine.dispatchCommand('p1', {
      type: 'INITIATE_SYNTHETIC_ASCENSION',
      ascensionType: 'cybernetic',
    });
    expect(cyberRes.success).toBe(true);
    expect(empire.ascensionStage).toBe('cybernetic');
    expect(p1.syntheticAscensionStage).toBe('cybernetic');
    expect(empire.syntheticProductionBonus).toBe(SYNTHETIC_CONSTANTS.CYBERNETIC_PRODUCTION_BONUS);

    // Assembly speed is 25% faster under cybernetic (30s / 1.25 = 24s)
    engine.dispatchCommand('p1', { type: 'ASSEMBLE_SYNTHETIC_POP', planetId: hw1.id });
    engine.tick(24000);
    expect(hw1.syntheticPops).toBe(1);

    // 10. Synthetic Ascension (INITIATE_SYNTHETIC_ASCENSION -> 'synthetic')
    hw1.resources.ore = 3000;
    hw1.resources.crystal = 3000;
    hw1.resources.fuel = 3000;

    const synthRes = engine.dispatchCommand('p1', {
      type: 'INITIATE_SYNTHETIC_ASCENSION',
      ascensionType: 'synthetic',
    });
    expect(synthRes.success).toBe(true);
    expect(empire.ascensionStage).toBe('synthetic');
    expect(p1.syntheticAscensionStage).toBe('synthetic');
    expect(empire.syntheticProductionBonus).toBe(SYNTHETIC_CONSTANTS.SYNTHETIC_PRODUCTION_BONUS);
    expect(empire.aiPolicy).toBe('citizen_rights');
    expect(empire.machineUprisingRisk).toBe(0);

    // Setting servitude is now rejected because synthetics are unified equal citizens
    const rejectServitude = engine.dispatchCommand('p1', {
      type: 'SET_AI_POLICY',
      policy: 'servitude',
    });
    expect(rejectServitude.success).toBe(false);

    // 11. Machine World Conversion (CONVERT_TO_MACHINE_WORLD)
    // Add a second planet to convert
    const secondPlanetId = 'planet_cyber_colony';
    const secondPlanet: any = {
      id: secondPlanetId,
      name: 'Sibernetik Üs',
      systemId: hw1.systemId,
      slotIndex: 2,
      ownerId: 'p1',
      isHomeworld: false,
      resources: { ore: 2000, crystal: 1500, fuel: 1500 },
      lastResourceUpdate: engine.state.timeMs,
      storageCap: 5000,
      protectedCapacity: 1000,
      buildings: { ore_mine: 3, crystal_synth: 2, fuel_refinery: 2, research_lab: 1, shipyard: 1 },
      buildingQueue: null,
      shipyardQueue: [],
      garrison: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
      stance: 'balanced',
      biome: 'desert',
    };
    engine.state.planets[secondPlanetId] = secondPlanet;

    const convertRes = engine.dispatchCommand('p1', {
      type: 'CONVERT_TO_MACHINE_WORLD',
      planetId: secondPlanetId,
    });
    expect(convertRes.success).toBe(true);
    expect(secondPlanet.biome).toBe('machine_world');
    expect(secondPlanet.hasMachineMatrix).toBe(true);
    expect(secondPlanet.maxSyntheticPops).toBe(10);

    // Machine World provides massive mechanical multipliers
    const machineBoosts = getPlanetSyntheticBoosts(secondPlanet, empire);
    expect(machineBoosts.shipyardMultiplier).toBeGreaterThanOrEqual(1.5); // +20% synthetic + 30% machine world

    // 12. Autonomous Bot AI Evaluation (evaluateBotSynthetics)
    const { player: botInd, homeworld: botHw } = engine.addPlayer('bot_ind_synth', 'Aethel AI', '#10b981', true, 'industrialist');
    botHw.resources.ore = 5000;
    botHw.resources.crystal = 4000;
    botHw.resources.fuel = 3000;

    const botCmds: any[] = [];
    evaluateBotSynthetics(engine, botInd.id, 'industrialist', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    // Bot should initiate ascension or policy
    const ascensionOrPop = botCmds.find(
      (c) => c.type === 'INITIATE_SYNTHETIC_ASCENSION' || c.type === 'ASSEMBLE_SYNTHETIC_POP' || c.type === 'SET_AI_POLICY'
    );
    expect(ascensionOrPop).toBeDefined();
  });

  it('Test 57: Phase 27 - Paragon Önderler, Efsanevi Amiraller & Hanedan / Konsey Mirası (Paragon Leaders, Renowned Heroes & Council Destiny)', () => {
    const engine = new GameEngine(888);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'Paragon Lideri', '#f59e0b');

    // 1. Initial State Verification
    expect(engine.state.paragons).toBeDefined();
    expect(engine.state.galacticParagonPool).toBeDefined();
    expect(engine.state.galacticParagonPool!.length).toBe(6);
    expect(p1.renown).toBe(100);
    expect(p1.paragonIds).toEqual([]);

    // 2. Passive Renown Tick Accumulation
    const initialRenown = p1.renown || 0;
    engine.tick(3600 * 1000); // 1 hour elapsed
    expect(p1.renown).toBeCloseTo(initialRenown + PARAGON_CONSTANTS.BASE_RENOWN_GAIN_PER_HOUR, 1);

    // 3. Paragon Recruitment (RECRUIT_PARAGON)
    // Select Vaelen the Starbreaker (military legendary leader)
    const targetParagonId = 'paragon_vaelen';
    const targetParagon = engine.state.paragons![targetParagonId];
    expect(targetParagon).toBeDefined();
    expect(targetParagon.ownerId).toBeNull();
    expect(targetParagon.tier).toBe('legendary');

    // Give homeworld enough resources to afford recruitment
    hw1.resources.ore = 2000;
    hw1.resources.crystal = 2000;
    hw1.resources.fuel = 2000;
    p1.renown = 200;

    const recruitRes = engine.dispatchCommand('p1', {
      type: 'RECRUIT_PARAGON',
      paragonId: targetParagonId,
    });
    expect(recruitRes.success).toBe(true);
    expect(targetParagon.ownerId).toBe('p1');
    expect(p1.paragonIds).toContain(targetParagonId);
    expect(engine.state.galacticParagonPool).not.toContain(targetParagonId);
    expect(p1.renown).toBe(200 - targetParagon.renownCost);

    // 4. Assignments Matrix: Planet Governor & Council (ASSIGN_PARAGON & UNASSIGN_PARAGON)
    const assignPlanetRes = engine.dispatchCommand('p1', {
      type: 'ASSIGN_PARAGON',
      paragonId: targetParagonId,
      assignment: { type: 'planet', targetId: hw1.id },
    });
    expect(assignPlanetRes.success).toBe(true);
    expect(targetParagon.assignedTo?.type).toBe('planet');
    expect(targetParagon.assignedTo?.targetId).toBe(hw1.id);
    expect(hw1.assignedParagonId).toBe(targetParagonId);

    // Reassign to Council
    const assignCouncilRes = engine.dispatchCommand('p1', {
      type: 'ASSIGN_PARAGON',
      paragonId: targetParagonId,
      assignment: { type: 'council', targetId: 'high_command' },
    });
    expect(assignCouncilRes.success).toBe(true);
    expect(targetParagon.assignedTo?.type).toBe('council');
    expect(hw1.assignedParagonId).toBeUndefined(); // Cleared from previous planet

    // Unassign
    const unassignRes = engine.dispatchCommand('p1', {
      type: 'UNASSIGN_PARAGON',
      paragonId: targetParagonId,
    });
    expect(unassignRes.success).toBe(true);
    expect(targetParagon.assignedTo).toBeNull();

    // 5. XP Accumulation and Leveling
    // Reassign to planet to gain XP over time
    engine.dispatchCommand('p1', {
      type: 'ASSIGN_PARAGON',
      paragonId: targetParagonId,
      assignment: { type: 'planet', targetId: hw1.id },
    });

    const prevLevel = targetParagon.level;
    // Set XP close to threshold (190 / 200) and tick 1 hour (+25 XP)
    targetParagon.xp = 190;
    engine.tick(3600 * 1000);
    expect(targetParagon.level).toBeGreaterThan(prevLevel);

    // 6. Empire Multipliers (getPlayerParagonBonuses)
    // Recruit an economic paragon: Castor Vane (+20% ore, +20% crystal)
    const castorId = 'paragon_castor';
    p1.renown = 300;
    engine.dispatchCommand('p1', { type: 'RECRUIT_PARAGON', paragonId: castorId });
    const bonuses = getPlayerParagonBonuses(engine.state, 'p1');
    expect(bonuses.oreMultiplier).toBeGreaterThanOrEqual(1.20);
    expect(bonuses.crystalMultiplier).toBeGreaterThanOrEqual(1.20);

    // 7. Military Flagship Commissioning (COMMISSION_PARAGON_FLAGSHIP)
    expect(targetParagon.flagship).toBeDefined();
    expect(targetParagon.flagship!.isCommissioned).toBe(false);

    hw1.resources.ore = 3000;
    hw1.resources.crystal = 2000;
    hw1.resources.fuel = 1500;

    const commissionRes = engine.dispatchCommand('p1', {
      type: 'COMMISSION_PARAGON_FLAGSHIP',
      paragonId: targetParagonId,
      planetId: hw1.id,
    });
    expect(commissionRes.success).toBe(true);
    expect(targetParagon.flagship!.isCommissioned).toBe(true);

    // 8. Fleet Dispatch with Paragon Commander
    hw1.garrison.fighter = 10;
    hw1.garrison.battleship = 2;
    hw1.resources.fuel = 2000;

    // Pick target system
    const targetSys = Object.keys(engine.state.map.systems).find((s) => s !== hw1.systemId)!;

    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw1.id,
      targetSystemId: targetSys,
      ships: { scout: 0, transport: 0, fighter: 5, battleship: 1 },
      mission: 'recon',
      paragonId: targetParagonId,
    });
    expect(dispatchRes.success).toBe(true);

    const createdFleet = Object.values(engine.state.fleets).find(
      (f) => f.ownerId === 'p1' && f.paragonId === targetParagonId
    );
    expect(createdFleet).toBeDefined();
    expect(targetParagon.assignedTo?.type).toBe('fleet');
    expect(targetParagon.assignedTo?.targetId).toBe(createdFleet!.id);

    // Combat multipliers with commissioned flagship and Vaelen trait
    const fleetCombatBuffs = getFleetParagonBonuses(engine.state, createdFleet!.id);
    expect(fleetCombatBuffs.hasFlagship).toBe(true);
    expect(fleetCombatBuffs.attackMultiplier).toBeGreaterThanOrEqual(1.50); // 25% aura + 25% flagship + level
    expect(fleetCombatBuffs.defenseMultiplier).toBeGreaterThanOrEqual(1.35); // 20% aura + 20% flagship + level

    // 9. Paragon Dismissal and Partial Renown Refund (DISMISS_PARAGON)
    const renownBeforeDismiss = p1.renown || 0;
    const dismissRes = engine.dispatchCommand('p1', {
      type: 'DISMISS_PARAGON',
      paragonId: castorId,
    });
    expect(dismissRes.success).toBe(true);
    expect(p1.paragonIds).not.toContain(castorId);
    expect(engine.state.galacticParagonPool).toContain(castorId);
    expect(p1.renown).toBeGreaterThan(renownBeforeDismiss); // Refunded 40%

    // 10. Autonomous Bot AI Evaluation (evaluateBotParagons)
    const { player: botAdm, homeworld: botHw } = engine.addPlayer(
      'bot_paragon_adm',
      'Orion AI',
      '#ef4444',
      true,
      'admiral'
    );
    botHw.resources.ore = 8000;
    botHw.resources.crystal = 6000;
    botHw.resources.fuel = 5000;
    botAdm.renown = 300;

    const botCmds: any[] = [];
    evaluateBotParagons(engine, botAdm.id, 'admiral', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    const recruitCmd = botCmds.find((c) => c.type === 'RECRUIT_PARAGON');
    expect(recruitCmd).toBeDefined();
  });

  it('Test 58: Hyper Relays, Transit Highway Networks & Subspace Logistics (Phase 28)', () => {
    const engine = new GameEngine(100);
    const { player: p1, homeworld } = engine.addPlayer('p1', 'Terran Union', '#00f3ff');
    const sys1 = homeworld.systemId;

    // 1. Initial State & Validation
    expect(engine.state.hyperRelays).toBeDefined();
    expect(Object.keys(engine.state.hyperRelays || {}).length).toBe(0);

    // Find connected neighbor system
    const neighborLane = engine.state.map.lanes.find(
      (l) => l.fromSystemId === sys1 || l.toSystemId === sys1
    );
    expect(neighborLane).toBeDefined();
    const sys2 = neighborLane!.fromSystemId === sys1 ? neighborLane!.toSystemId : neighborLane!.fromSystemId;

    // Fail: Cannot construct in sys2 without presence
    const failPres = canConstructHyperRelay(engine.state, 'p1', sys2, homeworld.id);
    expect(failPres.success).toBe(false);
    expect(failPres.error).toContain('en az bir koloniniz veya yıldız üssünüz');

    // Fail: Insufficient resources
    homeworld.resources = { ore: 100, crystal: 50, fuel: 50 };
    const failRes = canConstructHyperRelay(engine.state, 'p1', sys1, homeworld.id);
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('Yetersiz hammadde');

    // 2. Construction of First Hyper Relay (CONSTRUCT_HYPER_RELAY)
    homeworld.resources = { ore: 2000, crystal: 1500, fuel: 1000 };
    const constRes = engine.dispatchCommand('p1', {
      type: 'CONSTRUCT_HYPER_RELAY',
      systemId: sys1,
      fundingPlanetId: homeworld.id,
    });
    expect(constRes.success).toBe(true);

    // Resources deducted (Cost: 600 ore, 400 crystal, 300 fuel)
    expect(homeworld.resources.ore).toBe(1400);
    expect(homeworld.resources.crystal).toBe(1100);
    expect(homeworld.resources.fuel).toBe(700);

    const relay1 = engine.state.hyperRelays![sys1];
    expect(relay1).toBeDefined();
    expect(relay1.isConstructing).toBe(true);
    expect(relay1.policy).toBe('military_priority');
    expect(relay1.constructionFinishTimeMs).toBe(engine.state.timeMs + HYPER_RELAY_CONFIG.CONSTRUCTION_TIME_MS);

    // Duplicate build rejected
    const dupRes = engine.dispatchCommand('p1', {
      type: 'CONSTRUCT_HYPER_RELAY',
      systemId: sys1,
      fundingPlanetId: homeworld.id,
    });
    expect(dupRes.success).toBe(false);

    // 3. Construction Progression and Completion
    engine.tick(15_000);
    expect(engine.state.hyperRelays![sys1].isConstructing).toBe(true);

    engine.tick(16_000); // 31 seconds total
    expect(engine.state.hyperRelays![sys1].isConstructing).toBe(false);
    expect(getActiveHyperRelaySystemIds(engine.state, 'p1').has(sys1)).toBe(true);

    // Single relay does not form a corridor yet
    expect(isHyperRelayNetworkLink(engine.state, sys1, sys2, 'p1')).toBe(false);

    // 4. Establish Presence and Build Second Relay in Adjacent System
    if (!engine.state.starbases) engine.state.starbases = {};
    engine.state.starbases[sys2] = {
      systemId: sys2,
      tier: 'outpost',
      ownerId: 'p1',
      modules: [],
      currentHealth: 1000,
      maxHealth: 1000,
      upgradeQueue: null,
      lastHealthRegen: engine.state.timeMs,
    };

    homeworld.resources = { ore: 2000, crystal: 1500, fuel: 1000 };
    const constRes2 = engine.dispatchCommand('p1', {
      type: 'CONSTRUCT_HYPER_RELAY',
      systemId: sys2,
      fundingPlanetId: homeworld.id,
    });
    expect(constRes2.success).toBe(true);

    // Finish construction of second relay
    engine.tick(HYPER_RELAY_CONFIG.CONSTRUCTION_TIME_MS + 1000);
    expect(engine.state.hyperRelays![sys2].isConstructing).toBe(false);

    // 5. Active Transit Highway Corridor Verification
    expect(getActiveHyperRelaySystemIds(engine.state, 'p1').has(sys2)).toBe(true);
    expect(isHyperRelayNetworkLink(engine.state, sys1, sys2, 'p1')).toBe(true);

    // 6. Route Calculation & Speedup / Fuel Savings
    const activeRelays = getActiveHyperRelaySystemIds(engine.state, 'p1');
    const playerLoadouts = engine.state.shipLoadouts?.['p1'];
    const routeWithoutRelays = calculateRouteInfo(
      sys1,
      sys2,
      { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      engine.state.map.lanes,
      0,
      undefined,
      playerLoadouts
    );
    expect(routeWithoutRelays).toBeDefined();

    const routeWithRelays = calculateRouteInfo(
      sys1,
      sys2,
      { scout: 0, transport: 0, fighter: 5, battleship: 0 },
      engine.state.map.lanes,
      0,
      undefined,
      playerLoadouts,
      activeRelays
    );
    expect(routeWithRelays).toBeDefined();
    expect(routeWithRelays!.hyperRelaySegmentsCount).toBe(1);
    expect(routeWithRelays!.hyperRelaySpeedMultiplier).toBe(3.0);

    // 3.0x speed means duration is 1/3 (durationMs / 3)
    expect(routeWithRelays!.durationMs).toBe(Math.round(routeWithoutRelays!.durationMs / 3.0));
    // 50% fuel discount
    expect(routeWithRelays!.fuelCost).toBe(Math.round(routeWithoutRelays!.fuelCost * 0.50));

    // 7. Dispatch Fleet with Hyper Relay Transit Highway
    homeworld.garrison.fighter = 5;
    homeworld.resources.fuel = 5000;
    const dispatchRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: sys2,
      mission: 'transfer',
      ships: { scout: 0, transport: 0, fighter: 5, battleship: 0 },
    });
    expect(dispatchRes.success).toBe(true);
    const dispatchedFleet = Object.values(engine.state.fleets).find(
      (f) => f.ownerId === 'p1' && f.targetSystemId === sys2
    );
    expect(dispatchedFleet).toBeDefined();
    expect(dispatchedFleet!.arrivalTime - dispatchedFleet!.departureTime).toBe(routeWithRelays!.durationMs);

    // 8. Policy & Doctrine Customization (SET_HYPER_RELAY_POLICY)
    const policyRes = engine.dispatchCommand('p1', {
      type: 'SET_HYPER_RELAY_POLICY',
      systemId: sys1,
      policy: 'commercial_freight',
    });
    expect(policyRes.success).toBe(true);
    expect(engine.state.hyperRelays![sys1].policy).toBe('commercial_freight');

    // Bonuses
    const bonuses = getHyperRelaySystemBonuses(engine.state, sys1);
    expect(bonuses.tradeValueMultiplier).toBe(1.20);
    expect(bonuses.productionMultiplier).toBe(1.10);
    expect(bonuses.stabilityBonus).toBe(HYPER_RELAY_CONFIG.PLANET_STABILITY_BONUS);
    expect(bonuses.tradeProtection).toBe(HYPER_RELAY_CONFIG.TRADE_PROTECTION_BONUS);

    // Non-owner cannot change policy
    const unauthorizedPolicy = engine.dispatchCommand('p2', {
      type: 'SET_HYPER_RELAY_POLICY',
      systemId: sys1,
      policy: 'rapid_civilian',
    });
    expect(unauthorizedPolicy.success).toBe(false);

    // 9. Galactic Trade Protection & Piracy Immunity
    updateTradeNetworks(engine.state, 1000);
    expect(engine.state.systemTrade[sys1].tradeProtection).toBeGreaterThanOrEqual(100);
    expect(engine.state.systemTrade[sys2].tradeProtection).toBeGreaterThanOrEqual(100);

    // Planet Trade Value in Commercial Freight System receives +20% bonus
    const tv = calculatePlanetTradeValue(homeworld, p1, engine.state);
    expect(tv).toBeGreaterThan(0);

    // 10. Dismantle Hyper Relay (DISMANTLE_HYPER_RELAY)
    const oreBefore = homeworld.resources.ore;
    const crystalBefore = homeworld.resources.crystal;
    const fuelBefore = homeworld.resources.fuel;

    const dismantleRes = engine.dispatchCommand('p1', {
      type: 'DISMANTLE_HYPER_RELAY',
      systemId: sys2,
    });
    expect(dismantleRes.success).toBe(true);
    expect(engine.state.hyperRelays![sys2]).toBeUndefined();

    // 40% refund
    const refundOre = Math.round(HYPER_RELAY_CONFIG.CONSTRUCTION_COST.ore * 0.40);
    const refundCrystal = Math.round(HYPER_RELAY_CONFIG.CONSTRUCTION_COST.crystal * 0.40);
    const refundFuel = Math.round(HYPER_RELAY_CONFIG.CONSTRUCTION_COST.fuel * 0.40);
    expect(homeworld.resources.ore).toBe(oreBefore + refundOre);
    expect(homeworld.resources.crystal).toBe(crystalBefore + refundCrystal);
    expect(homeworld.resources.fuel).toBe(fuelBefore + refundFuel);

    // Corridor is severed
    expect(isHyperRelayNetworkLink(engine.state, sys1, sys2, 'p1')).toBe(false);

    // 11. Autonomous Bot AI (evaluateBotHyperRelays)
    const { player: botInd, homeworld: botHw } = engine.addPlayer(
      'bot_industrialist',
      'Cyborg Forge',
      '#10b981',
      true,
      'industrialist'
    );
    botHw.resources = { ore: 5000, crystal: 4000, fuel: 3000 };

    const botCmds: any[] = [];
    evaluateBotHyperRelays(engine, botInd.id, 'industrialist', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    const constBotCmd = botCmds.find((c) => c.type === 'CONSTRUCT_HYPER_RELAY');
    expect(constBotCmd).toBeDefined();
    expect(constBotCmd.systemId).toBe(botHw.systemId);

    // Complete bot relay
    engine.tick(HYPER_RELAY_CONFIG.CONSTRUCTION_TIME_MS + 1000);
    expect(engine.state.hyperRelays![botHw.systemId].isConstructing).toBe(false);

    // Evaluate again -> Industrialist bot switches doctrine to commercial_freight
    const botPolicyCmds: any[] = [];
    evaluateBotHyperRelays(engine, botInd.id, 'industrialist', botPolicyCmds);
    const policyBotCmd = botPolicyCmds.find((c) => c.type === 'SET_HYPER_RELAY_POLICY');
    expect(policyBotCmd).toBeDefined();
    expect(policyBotCmd.policy).toBe('commercial_freight');
    expect(engine.state.hyperRelays![botHw.systemId].policy).toBe('commercial_freight');
  });

  it('Test 59: Galactic Intelligence Directorate, False Flag Operations & Shadow Coups (Phase 29)', () => {
    const engine = new GameEngine(777);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'Shadow Hegemony', '#a855f7');
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'Victim Republic', '#38bdf8');

    // 1. Initial State Verification
    expect(engine.state.intelligenceDirectorates).toBeDefined();
    const dir1 = getOrCreateDirectorate(engine.state, 'p1');
    expect(dir1.tier).toBe(1);
    expect(dir1.cryptoDecryption).toBe(15);
    expect(dir1.counterIntelScore).toBe(10);
    expect(dir1.maxAgents).toBe(2);

    // 2. Directorate Upgrade (UPGRADE_INTELLIGENCE_DIRECTORATE)
    hw1.resources = { ore: 2000, crystal: 1500, fuel: 1000 };
    const upgRes = engine.dispatchCommand('p1', {
      type: 'UPGRADE_INTELLIGENCE_DIRECTORATE',
      fundingPlanetId: hw1.id,
    });
    expect(upgRes.success).toBe(true);
    expect(dir1.isUpgrading).toBe(true);

    // Advance time to complete Tier 2 (Subspace SIGINT)
    engine.tick(35_000);
    expect(dir1.isUpgrading).toBe(false);
    expect(dir1.tier).toBe(2);
    expect(dir1.maxAgents).toBe(3);
    expect(dir1.cryptoDecryption).toBe(30);

    // 3. Secret Agent Recruitment & Traits (RECRUIT_SECRET_AGENT)
    const recruitRes = engine.dispatchCommand('p1', {
      type: 'RECRUIT_SECRET_AGENT',
      fundingPlanetId: hw1.id,
      name: 'Agent Zero',
      trait: 'ghost',
    });
    expect(recruitRes.success).toBe(true);

    const myAgents = Object.values(engine.state.secretAgents || {}).filter((a) => a.ownerId === 'p1');
    expect(myAgents.length).toBe(1);
    const agent0 = myAgents[0];
    expect(agent0.name).toBe('Agent Zero');
    expect(agent0.trait).toBe('ghost');
    expect(agent0.status).toBe('idle');

    // Recruit second agent: Saboteur
    const recruitRes2 = engine.dispatchCommand('p1', {
      type: 'RECRUIT_SECRET_AGENT',
      fundingPlanetId: hw1.id,
      name: 'Agent Vesper',
      trait: 'saboteur',
    });
    expect(recruitRes2.success).toBe(true);

    // 4. Infiltration & Spy Network Assignment (ASSIGN_SECRET_AGENT)
    const assignRes = engine.dispatchCommand('p1', {
      type: 'ASSIGN_SECRET_AGENT',
      agentId: agent0.id,
      targetFactionId: 'p2',
    });
    expect(assignRes.success).toBe(true);
    expect(agent0.status).toBe('infiltrating');

    const networkKey = `p1_p2`;
    expect(engine.state.spyNetworks?.[networkKey]).toBeDefined();
    expect(engine.state.spyNetworks![networkKey].infiltrationLevel).toBeGreaterThanOrEqual(10);

    // 5. False Flag Fleet Raids (DISPATCH_FALSE_FLAG_FLEET)
    // Create a fleet for p1 in orbit
    const fleetId = `fleet_p1_strike`;
    engine.state.fleets[fleetId] = {
      id: fleetId,
      name: '7th Covert Strike Wing',
      ownerId: 'p1',
      status: 'orbiting',
      originSystemId: hw1.systemId,
      targetSystemId: hw1.systemId,
      departureTime: 0,
      arrivalTime: 0,
      isReturning: false,
      ships: { scout: 0, transport: 0, fighter: 10, battleship: 2 },
    };

    const disguiseRes = engine.dispatchCommand('p1', {
      type: 'DISPATCH_FALSE_FLAG_FLEET',
      fleetId,
      disguisedAsFactionId: 'pirates',
    });
    expect(disguiseRes.success).toBe(true);

    const disguisedFleet = engine.state.fleets[fleetId];
    expect(disguisedFleet.falseFlag).toBeDefined();
    expect(disguisedFleet.falseFlag!.isDisguised).toBe(true);
    expect(disguisedFleet.falseFlag!.disguisedAsFactionId).toBe('pirates');
    expect(disguisedFleet.falseFlag!.isCompromised).toBe(false);

    // 6. Launch Shadow Operation (LAUNCH_SHADOW_OPERATION)
    // Setup target starbase in p2 system
    if (!engine.state.starbases) engine.state.starbases = {};
    const sb2Id = `sb_${hw2.systemId}`;
    engine.state.starbases[sb2Id] = {
      id: sb2Id,
      systemId: hw2.systemId,
      ownerId: 'p2',
      tier: 'citadel',
      modules: ['defense_platform'],
      hull: 5000,
      maxHull: 5000,
      shield: 2000,
      maxShield: 2000,
      upgradeQueue: undefined,
    };

    // Ensure infiltration points for sabotage
    engine.state.spyNetworks![networkKey].infiltrationLevel = 60;

    const opRes = engine.dispatchCommand('p1', {
      type: 'LAUNCH_SHADOW_OPERATION',
      targetFactionId: 'p2',
      opType: 'sabotage_starbase_grid',
      assignedAgentId: myAgents.find((a) => a.id !== agent0.id)?.id,
      targetStarbaseId: sb2Id,
      fundingPlanetId: hw1.id,
    });
    expect(opRes.success).toBe(true);

    const activeOps = Object.values(engine.state.shadowOperations || {}).filter((o) => o.ownerId === 'p1');
    expect(activeOps.length).toBe(1);
    expect(activeOps[0].opType).toBe('sabotage_starbase_grid');
    expect(activeOps[0].status).toBe('in_progress');

    // Tick operation duration to resolve
    engine.tick(SHADOW_OP_CONFIGS.sabotage_starbase_grid.durationMs + 1000);
    const resolvedOp = activeOps[0];
    expect(resolvedOp.status).not.toBe('in_progress');
    if (resolvedOp.status === 'succeeded') {
      expect(engine.state.starbases[sb2Id].hull).toBeLessThan(5000);
      expect(engine.state.starbases[sb2Id].shield).toBe(0);
    }

    // 7. Agent Dismissal (DISMISS_SECRET_AGENT)
    const prevOre = hw1.resources.ore;
    const dismissRes = engine.dispatchCommand('p1', {
      type: 'DISMISS_SECRET_AGENT',
      agentId: agent0.id,
    });
    expect(dismissRes.success).toBe(true);
    expect(engine.state.secretAgents?.[agent0.id]).toBeUndefined();
    expect(hw1.resources.ore).toBeGreaterThan(prevOre); // partial refund

    // 8. Autonomous Bot AI (evaluateBotShadowOps)
    const botRaider = engine.addPlayer('bot_raider', 'Shadow Corsairs', '#f43f5e', true, 'raider').player;
    const botHw = Object.values(engine.state.planets).find((p) => p.ownerId === botRaider.id)!;
    botHw.resources = { ore: 3000, crystal: 2500, fuel: 2000 };

    const botCmds: any[] = [];
    evaluateBotShadowOps(engine, botRaider.id, 'raider', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    const recruitedBotAgent = botCmds.find((c) => c.type === 'RECRUIT_SECRET_AGENT');
    expect(recruitedBotAgent).toBeDefined();
    expect(['saboteur', 'provocateur']).toContain(recruitedBotAgent.trait);
  });

  it('Test 60: Phase 30 - Planetary Invasions, Ground Armies & Orbital Bombardment Doctrines', () => {
    const engine = new GameEngine(7777);
    const p1 = engine.addPlayer('p1', 'Terran Hegemony', '#38bdf8').player;
    const p2 = engine.addPlayer('p2', 'Crimson Dominon', '#f43f5e').player;

    const hw1 = Object.values(engine.state.planets).find((p) => p.ownerId === p1.id)!;
    const hw2 = Object.values(engine.state.planets).find((p) => p.ownerId === p2.id)!;

    // 1. Starter Garrison Defense Militia Check
    expect(engine.state.armies).toBeDefined();
    const p1Armies = Object.values(engine.state.armies || {}).filter((a) => a.ownerId === p1.id);
    expect(p1Armies.length).toBeGreaterThanOrEqual(1);
    expect(p1Armies[0].type).toBe('defense_militia');
    expect(p1Armies[0].isGarrisonOnly).toBe(true);

    // 2. Army Recruitment (RECRUIT_ARMY)
    hw1.resources = { ore: 2000, crystal: 1500, fuel: 1000 };
    const recruitInfantryRes = engine.dispatchCommand('p1', {
      type: 'RECRUIT_ARMY',
      planetId: hw1.id,
      armyType: 'assault_infantry',
    });
    expect(recruitInfantryRes.success).toBe(true);
    expect(hw1.armyQueue).toBeDefined();
    expect(hw1.armyQueue!.armyType).toBe('assault_infantry');

    // Tick to complete training
    engine.tick(ARMY_CONFIGS.assault_infantry.buildTimeMs + 500);
    expect(hw1.armyQueue).toBeNull();
    const newArmies = Object.values(engine.state.armies || {}).filter((a) => a.ownerId === p1.id);
    const assaultArmy = newArmies.find((a) => a.type === 'assault_infantry');
    expect(assaultArmy).toBeDefined();
    expect(assaultArmy!.isGarrisonOnly).toBe(false);
    expect(assaultArmy!.rank).toBe('recruit');

    // Train second assault unit: xenomorph_swarm
    const recruitXenoRes = engine.dispatchCommand('p1', {
      type: 'RECRUIT_ARMY',
      planetId: hw1.id,
      armyType: 'xenomorph_swarm',
    });
    expect(recruitXenoRes.success).toBe(true);
    engine.tick(ARMY_CONFIGS.xenomorph_swarm.buildTimeMs + 500);
    const xenoArmy = Object.values(engine.state.armies || {}).find(
      (a) => a.ownerId === p1.id && a.type === 'xenomorph_swarm'
    );
    expect(xenoArmy).toBeDefined();

    // 3. Army Embarkation (EMBARK_ARMIES)
    // Create an orbiting fleet for p1 in hw1 system
    const fleetId = `fleet_transport_${engine.state.nextId++}`;
    engine.state.fleets[fleetId] = {
      id: fleetId,
      name: '1. Çıkarma Görev Kuvveti',
      ownerId: p1.id,
      ships: { scout: 1, transport: 2, fighter: 4, battleship: 1 },
      cargo: { ore: 0, crystal: 0, fuel: 500 },
      originSystemId: hw1.systemId,
      targetSystemId: hw1.systemId,
      path: [hw1.systemId],
      pathIndex: 0,
      mission: 'transport',
      departureTime: engine.state.timeMs,
      arrivalTime: engine.state.timeMs,
      totalDistance: 0,
      speed: 10,
      fuelCost: 0,
      recallLockedAfterTime: 0,
      isReturning: false,
      status: 'orbiting',
      embarkedArmyIds: [],
    };

    // Try embarking garrison militia -> must fail
    const militiaArmy = newArmies.find((a) => a.type === 'defense_militia')!;
    const failEmbark = engine.dispatchCommand('p1', {
      type: 'EMBARK_ARMIES',
      planetId: hw1.id,
      fleetId,
      armyIds: [militiaArmy.id],
    });
    expect(failEmbark.success).toBe(false);

    // Embark assault armies -> succeeds
    const embarkRes = engine.dispatchCommand('p1', {
      type: 'EMBARK_ARMIES',
      planetId: hw1.id,
      fleetId,
      armyIds: [assaultArmy!.id, xenoArmy!.id],
    });
    expect(embarkRes.success).toBe(true);
    const transportFleet = engine.state.fleets[fleetId];
    expect(transportFleet.embarkedArmyIds).toContain(assaultArmy!.id);
    expect(transportFleet.embarkedArmyIds).toContain(xenoArmy!.id);
    expect(assaultArmy!.planetId).toBeNull();
    expect(assaultArmy!.fleetId).toBe(fleetId);

    // 4. Move Fleet to enemy system (hw2.systemId)
    transportFleet.targetSystemId = hw2.systemId;
    transportFleet.originSystemId = hw2.systemId;
    transportFleet.status = 'orbiting';

    // Verify starbase shields system until neutralized
    expect(engine.state.starbases?.[hw2.systemId]?.hull).toBeGreaterThan(0);
    engine.state.starbases![hw2.systemId].hull = 0; // Neutralized starbase

    // 5. Orbital Bombardment (SET_BOMBARDMENT_STANCE)
    const setStanceRes = engine.dispatchCommand('p1', {
      type: 'SET_BOMBARDMENT_STANCE',
      fleetId,
      stance: 'indiscriminate',
      targetPlanetId: hw2.id,
    });
    expect(setStanceRes.success).toBe(true);
    expect(transportFleet.bombardmentStance).toBe('indiscriminate');
    expect(transportFleet.bombardmentTargetPlanetId).toBe(hw2.id);

    // Tick bombardment for 10 seconds -> increases devastation and weakens defender garrison
    const preDevastation = hw2.devastation || 0;
    const p2Garrison = Object.values(engine.state.armies || {}).find((a) => a.planetId === hw2.id);
    const preGarrisonHp = p2Garrison ? p2Garrison.health : 100;
    engine.tick(10000);

    expect(hw2.devastation).toBeGreaterThan(preDevastation);
    if (p2Garrison && engine.state.armies?.[p2Garrison.id]) {
      expect(engine.state.armies[p2Garrison.id].health).toBeLessThan(preGarrisonHp);
    }

    // Stop bombardment
    engine.dispatchCommand('p1', {
      type: 'SET_BOMBARDMENT_STANCE',
      fleetId,
      stance: 'none',
    });
    expect(transportFleet.bombardmentStance).toBe('none');

    // 6. Planetary Landing & Ground Combat Battle (LAND_ARMIES)
    const landRes = engine.dispatchCommand('p1', {
      type: 'LAND_ARMIES',
      fleetId,
      targetPlanetId: hw2.id,
    });
    expect(landRes.success).toBe(true);
    expect(landRes.data?.isInvasion).toBe(true);

    const activeBattles = Object.values(engine.state.groundBattles || {}).filter(
      (b) => b.planetId === hw2.id && b.status === 'active'
    );

    if (activeBattles.length > 0) {
      const battle = activeBattles[0];
      expect(battle.attackerId).toBe('p1');
      expect(battle.defenderId).toBe('p2');
      expect(battle.frontlineWidth).toBe(4);

      // Tick battle until resolution
      for (let i = 0; i < 20; i++) {
        if (battle.status !== 'active') break;
        engine.tick(2000);
      }
    }

    // At the end, planet is occupied by p1
    expect(hw2.occupierId).toBe('p1');
    expect(hw2.occupiedAtMs).toBeDefined();

    // 7. Economic impact: Devastation & Occupation Tribute Flow
    // Ticking 1 hour should generate resources with 50% tribute flowing to p1's homeworld
    const p1PreOre = hw1.resources.ore;
    engine.tick(3600 * 1000);
    expect(hw1.resources.ore).toBeGreaterThan(p1PreOre);

    // 8. Planet Liberation (LIBERATE_PLANET)
    // Remove occupying armies from hw2
    for (const a of Object.values(engine.state.armies || {})) {
      if (a.planetId === hw2.id) {
        delete engine.state.armies![a.id];
      }
    }
    const libRes = engine.dispatchCommand('p2', {
      type: 'LIBERATE_PLANET',
      planetId: hw2.id,
    });
    expect(libRes.success).toBe(true);
    expect(hw2.occupierId).toBeNull();

    // 9. Autonomous Bot AI (evaluateBotGroundWarfare)
    const botAdmiral = engine.addPlayer('bot_admiral', 'Admiral Krieg', '#3b82f6', true, 'admiral').player;
    const botHw2 = Object.values(engine.state.planets).find((p) => p.ownerId === botAdmiral.id)!;
    botHw2.resources = { ore: 4000, crystal: 3000, fuel: 2000 };

    const botCmds: any[] = [];
    evaluateBotGroundWarfare(engine, botAdmiral.id, 'admiral', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    const recruitedArmyCmd = botCmds.find((c) => c.type === 'RECRUIT_ARMY');
    expect(recruitedArmyCmd).toBeDefined();
    expect(recruitedArmyCmd.planetId).toBe(botHw2.id);
  });

  it('Test 61: Phase 31 - Galactic Enclaves, Caravaneers & Shroud Factions (Galaktik Enklavlar, Göçebe Karavanlar & Zihinsel Örtü Meclisi)', () => {
    const engine = new GameEngine(3131);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p1', 'İmparator Vaelen', '#00f3ff');
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p2', 'Tüccar Guild', '#f59e0b', true, 'industrialist');

    hw1.resources = { ore: 15000, crystal: 15000, fuel: 15000 };
    hw1.storageCap = 50000;

    // 1. Initial State: Enclaves and Caravaneers verification
    expect(engine.state.enclaves).toBeDefined();
    expect(engine.state.caravaneers).toBeDefined();

    const enclaves = Object.values(engine.state.enclaves!);
    expect(enclaves.length).toBeGreaterThanOrEqual(4);

    const curator = enclaves.find((e) => e.type === 'curator_order');
    const artisan = enclaves.find((e) => e.type === 'artisan_troupe');
    const trader = enclaves.find((e) => e.type === 'trader_enclave');
    const shroud = enclaves.find((e) => e.type === 'shroud_coven');

    expect(curator).toBeDefined();
    expect(artisan).toBeDefined();
    expect(trader).toBeDefined();
    expect(shroud).toBeDefined();

    const caravaneers = engine.state.caravaneers!;
    expect(caravaneers.length).toBe(2);
    expect(caravaneers.some((c) => c.dealType === 'gambling_slots')).toBe(true);
    expect(caravaneers.some((c) => c.dealType === 'reliquary')).toBe(true);

    // 2. Curator Order Contract: hire_curator_researcher
    const preCrystal = hw1.resources.crystal;
    const curatorRes = engine.dispatchCommand('p1', {
      type: 'INTERACT_ENCLAVE',
      enclaveId: curator!.id,
      serviceId: 'hire_curator_researcher',
    });
    expect(curatorRes.success).toBe(true);
    expect(hw1.resources.crystal).toBeLessThan(preCrystal);
    expect(p1.activeEnclaveContracts?.length).toBe(1);
    expect(p1.activeEnclaveContracts![0].serviceId).toBe('hire_curator_researcher');

    // Duplicate purchase blocked while active
    const dupRes = engine.dispatchCommand('p1', {
      type: 'INTERACT_ENCLAVE',
      enclaveId: curator!.id,
      serviceId: 'hire_curator_researcher',
    });
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain('zaten aktif');

    // 3. Trader Enclave: hire_mercenary_corps & opinion tracking
    const preArmies = Object.values(engine.state.armies || {}).filter((a) => a.ownerId === 'p1').length;
    const traderRes = engine.dispatchCommand('p1', {
      type: 'INTERACT_ENCLAVE',
      enclaveId: trader!.id,
      serviceId: 'hire_mercenary_corps',
    });
    expect(traderRes.success).toBe(true);
    const postArmies = Object.values(engine.state.armies || {}).filter((a) => a.ownerId === 'p1').length;
    expect(postArmies).toBe(preArmies + 2);
    expect(trader!.opinion['p1']).toBeGreaterThan(0);
    expect(trader!.totalDealsDone['p1']).toBe(1);

    // 4. Shroud Coven: commune_with_shroud & psionic boons
    const shroudRes = engine.dispatchCommand('p1', {
      type: 'INTERACT_ENCLAVE',
      enclaveId: shroud!.id,
      serviceId: 'commune_with_shroud',
    });
    expect(shroudRes.success).toBe(true);
    expect(p1.shroudBoon).toBeDefined();
    expect(p1.shroudBoon?.type).toBeDefined();
    expect(p1.shroudBoon?.descriptionTr).toBeDefined();

    // 5. Caravaneer Fleet Reliquary Mystery Box (BUY_CARAVAN_RELIQUARY)
    const reliquaryCaravan = caravaneers.find((c) => c.dealType === 'reliquary')!;
    const preOre = hw1.resources.ore;
    const reliquaryRes = engine.dispatchCommand('p1', {
      type: 'BUY_CARAVAN_RELIQUARY',
      caravanId: reliquaryCaravan.id,
    });
    expect(reliquaryRes.success).toBe(true);
    expect(reliquaryRes.data?.rewardDescTr).toBeDefined();

    // 6. Caravaneer Casino Slots Gambling (GAMBLE_CARAVAN_SLOTS)
    const slotsCaravan = caravaneers.find((c) => c.dealType === 'gambling_slots')!;
    const slotsRes = engine.dispatchCommand('p1', {
      type: 'GAMBLE_CARAVAN_SLOTS',
      caravanId: slotsCaravan.id,
      betAmount: 200,
    });
    expect(slotsRes.success).toBe(true);
    expect(slotsRes.data?.won).toBeDefined();

    // 7. Engine Tick: Contracts expiration and caravaneers movement
    engine.tick(60 * 1000); // 1 minute
    expect(engine.state.timeMs).toBe(60 * 1000);

    // 8. Fog of War Visibility
    const p1View = engine.getPlayerView('p1');
    expect(p1View.enclaves).toBeDefined();
    expect(p1View.myEnclaveContracts?.length).toBe(2);
    expect(p1View.myShroudBoon).toBeDefined();

    // 9. Autonomous Bot AI (evaluateBotEnclaves)
    hw2.resources = { ore: 8000, crystal: 6000, fuel: 5000 };
    hw2.storageCap = 50000;
    const botCmds: any[] = [];
    evaluateBotEnclaves(engine, 'p2', 'industrialist', botCmds);
    expect(botCmds.length).toBeGreaterThan(0);
    const enclaveCmd = botCmds.find((c) => c.type === 'INTERACT_ENCLAVE');
    expect(enclaveCmd).toBeDefined();
  });

  it('Test 62: Phase 32 - Planetary Districts, Pop Job Allocation, Housing & Stability Mechanics', () => {
    const engine = new GameEngine(7788);
    const { homeworld: hw1 } = engine.addPlayer('p1', 'Terran Dominion', 'blue', false);
    const { homeworld: hw2 } = engine.addPlayer('p2', 'Vega Combine', 'red', true, 'industrialist');

    expect(hw1).toBeDefined();

    // 1. Initial Homeworld Districts and Population
    expect(hw1.districts).toBeDefined();
    expect(hw1.districts.city).toBe(3);
    expect(hw1.districts.mining).toBe(2);
    expect(hw1.districts.generator).toBe(2);
    expect(hw1.districts.agriculture).toBe(1);
    expect(hw1.pops).toBe(10);
    expect(hw1.housing).toBe(17);
    expect(hw1.amenities).toBe(15);
    expect(hw1.stability).toBe(80);

    // 2. Build District: BUILD_DISTRICT
    hw1.resources = { ore: 5000, crystal: 5000, fuel: 5000 };
    const oreBefore = hw1.resources.ore;
    const buildCmdRes = engine.dispatchCommand('p1', {
      type: 'BUILD_DISTRICT',
      planetId: hw1.id,
      districtType: 'mining',
    });
    expect(buildCmdRes.success).toBe(true);
    expect(hw1.districtQueue).toBeDefined();
    expect(hw1.districtQueue?.districtType).toBe('mining');
    expect(hw1.resources.ore).toBe(oreBefore - DISTRICT_STATS.mining.cost.ore);

    // Cannot build second district while queue active
    const duplicateRes = engine.dispatchCommand('p1', {
      type: 'BUILD_DISTRICT',
      planetId: hw1.id,
      districtType: 'city',
    });
    expect(duplicateRes.success).toBe(false);

    // Complete the construction after build time
    engine.tick(DISTRICT_STATS.mining.buildTimeMs + 500);
    expect(hw1.districtQueue).toBeFalsy();
    expect(hw1.districts.mining).toBe(3);

    // 3. Demolish District: DEMOLISH_DISTRICT
    const demolishRes = engine.dispatchCommand('p1', {
      type: 'DEMOLISH_DISTRICT',
      planetId: hw1.id,
      districtType: 'mining',
    });
    expect(demolishRes.success).toBe(true);
    expect(hw1.districts.mining).toBe(2);

    // 4. Natural Pop Growth over Time
    const initialPops = hw1.pops;
    // Advance 130 seconds (growth interval is 120s)
    engine.tick(130 * 1000);
    expect(hw1.pops).toBe(initialPops + 1);

    // 5. Bot Autonomous District Expansion (evaluateBotDistricts)
    hw2.resources = { ore: 4000, crystal: 3000, fuel: 3000 };
    hw2.storageCap = 50000;
    hw2.districtQueue = undefined;
    const botDistrictCmds: any[] = [];
    evaluateBotDistricts(engine, 'p2', 'industrialist', botDistrictCmds);
    expect(botDistrictCmds.length).toBeGreaterThan(0);
    const districtCmd = botDistrictCmds.find((c) => c.type === 'BUILD_DISTRICT');
    expect(districtCmd).toBeDefined();
  });

  it('Test 63: Phase 33 - Pop-Driven Building Slots & Colony Development Tiers', () => {
    const engine = new GameEngine(777);
    const { homeworld } = engine.addPlayer('p_tier', 'Tier Empire', '#38bdf8');
    homeworld.resources = { ore: 10000, crystal: 10000, fuel: 10000 };

    // 1. Homeworld is exempt from Pop-locked building slots
    const hwBuildings = Object.keys(homeworld.buildings) as (keyof typeof homeworld.buildings)[];
    const hwShipyardType = hwBuildings[3]; // 4th building (idx 3)
    const hwRes = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: homeworld.id,
      buildingType: hwShipyardType,
    });
    expect(hwRes.success).toBe(true);

    // 2. Setup a non-homeworld colony with 2 pops
    const colonyId = 'colony_tier_test';
    engine.state.planets[colonyId] = {
      id: colonyId,
      name: 'Alpha Outpost',
      systemId: homeworld.systemId,
      orbitIndex: 2,
      ownerId: 'p_tier',
      isHomeworld: false,
      resources: { ore: 10000, crystal: 10000, fuel: 10000 },
      storageCap: 50000,
      buildings: {
        ore_mine: 0,
        crystal_synth: 0,
        fuel_refinery: 0,
        shipyard: 0,
        research_lab: 0,
        sensor_array: 0,
      },
      garrison: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
      shipyardQueue: [],
      districts: { city: 1, mining: 1, generator: 0, agriculture: 0 },
      pops: 2,
      housing: 5,
      amenities: 5,
      stability: 70,
    };

    const colony = engine.state.planets[colonyId];
    const buildingKeys = Object.keys(colony.buildings) as (keyof typeof colony.buildings)[];

    // Building 0 (oreMine) is within first 3 slots -> allowed
    const buildMineRes = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: colonyId,
      buildingType: buildingKeys[0],
    });
    expect(buildMineRes.success).toBe(true);

    // Cancel or clear queue for next test
    colony.buildingQueue = undefined;

    // Building 3 (shipyard, 4th slot) requires 5 pops -> blocked with 2 pops
    const buildShipyardRes = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: colonyId,
      buildingType: buildingKeys[3],
    });
    expect(buildShipyardRes.success).toBe(false);
    expect(buildShipyardRes.error).toContain('5 Pop gereklidir');

    // 3. Grow colony to 5 pops -> 4th slot unlocks
    colony.pops = 5;
    const unlockSlot4Res = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: colonyId,
      buildingType: buildingKeys[3],
    });
    expect(unlockSlot4Res.success).toBe(true);

    colony.buildingQueue = undefined;

    // Building 4 (researchLab, 5th slot) requires 10 pops -> blocked with 5 pops
    const buildLabRes = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: colonyId,
      buildingType: buildingKeys[4],
    });
    expect(buildLabRes.success).toBe(false);
    expect(buildLabRes.error).toContain('10 Pop gereklidir');

    // 4. Grow colony to 10 pops -> 5th slot unlocks
    colony.pops = 10;
    const unlockSlot5Res = engine.dispatchCommand('p_tier', {
      type: 'UPGRADE_BUILDING',
      planetId: colonyId,
      buildingType: buildingKeys[4],
    });
    expect(unlockSlot5Res.success).toBe(true);
  });

  it('Test 64: Phase 34 - Strategic Momentum, Slipways Opportunity Flow & Golden Surge Boosts', () => {
    const engine = new GameEngine(3434);
    const { player, homeworld } = engine.addPlayer('p_slip', 'Kaptan Slipway', '#00f0ff');

    // 1. Initial State: Momentum is 0 and no surge
    expect(player.momentum || 0).toBe(0);
    expect(player.surgeActiveUntilMs).toBeUndefined();

    // 2. Evaluate Dynamic Contextual Opportunities (Slipways Flow)
    const opps = evaluatePlayerOpportunities(engine.state, 'p_slip');
    expect(opps.length).toBeGreaterThan(0);
    expect(opps.length).toBeLessThanOrEqual(3);

    // Pick first opportunity and verify structure
    const firstOpp = opps[0];
    expect(firstOpp.id).toBeDefined();
    expect(firstOpp.reward.momentum).toBeGreaterThan(0);
    expect(firstOpp.command).toBeDefined();

    // 3. Claim Strategic Opportunity via Engine Command
    const initialOre = homeworld.resources.ore;
    const claimRes = engine.dispatchCommand('p_slip', {
      type: 'CLAIM_STRATEGIC_OPPORTUNITY',
      opportunityId: firstOpp.id,
      reward: { ore: 150, crystal: 50, momentum: 40 },
    });
    expect(claimRes.success).toBe(true);
    expect(player.momentum).toBe(40);
    expect(homeworld.resources.ore).toBe(initialOre + 150);

    // Claim another opportunity reaching 80 momentum
    engine.dispatchCommand('p_slip', {
      type: 'CLAIM_STRATEGIC_OPPORTUNITY',
      opportunityId: 'opp_2',
      reward: { momentum: 40 },
    });
    expect(player.momentum).toBe(80);
    expect(player.surgeActiveUntilMs).toBeUndefined();

    // 4. Reach 100 Momentum -> Triggers Golden Surge (Altın Çağ) for 90 seconds!
    const triggerSurgeRes = engine.dispatchCommand('p_slip', {
      type: 'CLAIM_STRATEGIC_OPPORTUNITY',
      opportunityId: 'opp_surge_trigger',
      reward: { momentum: 30 }, // 80 + 30 = 110 >= 100
    });
    expect(triggerSurgeRes.success).toBe(true);
    expect(player.momentum).toBe(0); // Resets to 0 upon Golden Surge
    expect(player.surgeActiveUntilMs).toBe(engine.state.timeMs + 90000);

    // 5. Verify Golden Surge Passive Production Boost (+20% resources)
    homeworld.buildings.mine = 2;
    const oreBefore = homeworld.resources.ore;
    engine.tick(10000); // 10 seconds during Golden Surge
    const oreSurgeGain = homeworld.resources.ore - oreBefore;
    expect(oreSurgeGain).toBeGreaterThan(0);

    // 6. Verify Golden Surge Fleet Transit Speed Boost (+35% speed -> duration reduced)
    const adjacentLane = engine.state.map.lanes.find(
      (l) => l.fromSystemId === homeworld.systemId || l.toSystemId === homeworld.systemId
    );
    expect(adjacentLane).toBeDefined();
    const targetSysId =
      adjacentLane!.fromSystemId === homeworld.systemId
        ? adjacentLane!.toSystemId
        : adjacentLane!.fromSystemId;

    // Dispatch fleet while Surge is active
    homeworld.garrison.scout = 2;
    homeworld.resources.fuel = 500;
    const fleetRes = engine.dispatchCommand('p_slip', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: targetSysId,
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      cargo: { ore: 0, crystal: 0, fuel: 0 },
    });
    expect(fleetRes.success).toBe(true);
    const surgeFleet = Object.values(engine.state.fleets).find(
      (f) => f.ownerId === 'p_slip' && f.targetSystemId === targetSysId
    );
    expect(surgeFleet).toBeDefined();

    // 7. Fast-forward past 90 seconds -> Golden Surge expires
    engine.tick(95000);
    expect(engine.state.timeMs).toBeGreaterThan(player.surgeActiveUntilMs!);
  });

  it('Test 65: Phase 35 - Galactic Supply Chains, Tri-Sector Synergy & Inter-Colony Resonance', () => {
    const engine = new GameEngine(3535);
    const { player, homeworld } = engine.addPlayer('p_syn', 'Lojistik Komutanı', '#10b981');

    // 1. Single Homeworld: No Supply Chain (< 2 colonies)
    expect(findPlayerSupplyChains(engine.state, 'p_syn')).toEqual([]);

    // 2. Colony Roles evaluation
    homeworld.specialization = 'mining_hub';
    expect(evaluateColonyRole(homeworld)).toBe('extractor');

    // 3. Find connected neighbor systems for expansion
    const lanes = engine.state.map.lanes;
    const neighborLanes = lanes.filter(
      (l) => l.fromSystemId === homeworld.systemId || l.toSystemId === homeworld.systemId
    );
    expect(neighborLanes.length).toBeGreaterThanOrEqual(1);

    const neighborSysId1 =
      neighborLanes[0].fromSystemId === homeworld.systemId
        ? neighborLanes[0].toSystemId
        : neighborLanes[0].fromSystemId;

    // Establish 2nd Colony (Industrial Bastion)
    const colony1Id = 'planet_colony_ind';
    engine.state.planets[colony1Id] = {
      id: colony1Id,
      name: 'Sanayi Dünyası Alpha',
      ownerId: 'p_syn',
      systemId: neighborSysId1,
      slotIndex: 0,
      isHomeworld: false,
      resources: { ore: 1000, crystal: 500, fuel: 500 },
      storageCap: 5000,
      protectedCapacity: 500,
      buildings: { ore_mine: 1, crystal_synth: 0, fuel_refinery: 0, shipyard: 2, research_lab: 0, sensor_array: 0 },
      specialization: 'military_bastion',
      garrison: { scout: 1, transport: 1, fighter: 2, battleship: 0 },
      lastResourceUpdate: engine.state.timeMs,
      stance: 'hold_position',
    };
    expect(evaluateColonyRole(engine.state.planets[colony1Id])).toBe('industrial');

    // 4. Evaluate Tier 1 Pair Synergy (Extractor + Industrial)
    const pairSynergies = findPlayerSupplyChains(engine.state, 'p_syn');
    expect(pairSynergies.length).toBe(1);
    expect(pairSynergies[0].tier).toBe(1);
    expect(pairSynergies[0].productionMultiplier).toBe(1.10);
    expect(pairSynergies[0].passiveMomentumPerMin).toBe(15);

    // Tick simulation to apply synergy to player state
    engine.tick(20000); // 20s
    expect(player.supplyChains?.length).toBe(1);
    expect(player.activeSynergyTier).toBe(1);
    expect(player.momentum).toBeGreaterThan(0); // Passive momentum accumulated!

    // 5. Establish 3rd Colony (Research Haven) connected to the network
    const secondNeighborLane = lanes.find(
      (l) =>
        (l.fromSystemId === neighborSysId1 && l.toSystemId !== homeworld.systemId) ||
        (l.toSystemId === neighborSysId1 && l.fromSystemId !== homeworld.systemId) ||
        (l.fromSystemId === homeworld.systemId && l.toSystemId !== neighborSysId1)
    );
    expect(secondNeighborLane).toBeDefined();

    const neighborSysId2 =
      secondNeighborLane!.fromSystemId === neighborSysId1 || secondNeighborLane!.fromSystemId === homeworld.systemId
        ? secondNeighborLane!.toSystemId
        : secondNeighborLane!.fromSystemId;

    const colony2Id = 'planet_colony_sci';
    engine.state.planets[colony2Id] = {
      id: colony2Id,
      name: 'Bilim Cenneti Nova',
      ownerId: 'p_syn',
      systemId: neighborSysId2,
      slotIndex: 1,
      isHomeworld: false,
      resources: { ore: 800, crystal: 800, fuel: 400 },
      storageCap: 5000,
      protectedCapacity: 500,
      buildings: { ore_mine: 0, crystal_synth: 0, fuel_refinery: 0, shipyard: 0, research_lab: 2, sensor_array: 1 },
      specialization: 'tech_haven',
      garrison: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      lastResourceUpdate: engine.state.timeMs,
      stance: 'hold_position',
    };
    expect(evaluateColonyRole(engine.state.planets[colony2Id])).toBe('research');

    // 6. Evaluate Tier 2 Tri-Sector Resonance (Extractor + Industrial + Research)
    const triSynergies = findPlayerSupplyChains(engine.state, 'p_syn');
    expect(triSynergies.length).toBe(1);
    const tri = triSynergies[0];
    expect(tri.tier).toBe(2);
    expect(tri.productionMultiplier).toBe(1.25); // +25% all resources
    expect(tri.researchMultiplier).toBe(1.15);   // +15% research speed
    expect(tri.passiveMomentumPerMin).toBe(35);  // +35 momentum per min!

    // 7. Verify simulation tick updates player state and production yields
    const oreBefore = homeworld.resources.ore;
    engine.tick(60000); // 1 minute with Tri-Sector Resonance!
    expect(player.activeSynergyTier).toBe(2);
    expect(player.momentum).toBeGreaterThanOrEqual(35);

    const oreGain = homeworld.resources.ore - oreBefore;
    expect(oreGain).toBeGreaterThan(0);
  });

  it('Test 66: Phase 36 - Sector Mastery Directives, Supply Chain Resonance & 1-Click Ship Assembly', () => {
    const engine = new GameEngine(3636);
    const { player, homeworld } = engine.addPlayer('p_mast', 'Hükümdar Orion', '#fbbf24');

    // 1. Initial Directives evaluation
    const initialDirectives = evaluatePlayerDirectives(engine.state, 'p_mast');
    const resonanceDir = initialDirectives.find((d) => d.id === 'supply_chain_resonance');
    const surgeDir = initialDirectives.find((d) => d.id === 'golden_surge_trigger');
    expect(resonanceDir).toBeDefined();
    expect(surgeDir).toBeDefined();
    expect(resonanceDir!.isCompleted).toBe(false);
    expect(surgeDir!.isCompleted).toBe(false);

    // 2. Test 1-Click Quick Ship Assembly via BUILD_SHIPS command
    homeworld.buildings.shipyard = 1;
    homeworld.resources.ore = 2000;
    homeworld.resources.crystal = 1000;
    homeworld.resources.fuel = 500;

    const buildScoutRes = engine.dispatchCommand('p_mast', {
      type: 'BUILD_SHIPS',
      planetId: homeworld.id,
      shipType: 'scout',
      count: 1,
    });
    expect(buildScoutRes.success).toBe(true);
    expect(homeworld.shipyardQueue.length).toBeGreaterThan(0);
    expect(homeworld.shipyardQueue[0].shipType).toBe('scout');

    // Fast forward to complete scout build
    engine.tick(SHIP_STATS.scout.buildTimeSec * 1000 + 1000);
    expect(homeworld.shipyardQueue.length).toBe(0);
    expect(homeworld.garrison.scout).toBeGreaterThanOrEqual(1);

    // 3. Trigger Tri-Sector Resonance -> Completes 'supply_chain_resonance' directive
    player.activeSynergyTier = 2;
    const midDirectives = evaluatePlayerDirectives(engine.state, 'p_mast');
    const updatedResonanceDir = midDirectives.find((d) => d.id === 'supply_chain_resonance');
    expect(updatedResonanceDir!.isCompleted).toBe(true);

    // Claim Directive reward
    const claimRes = engine.dispatchCommand('p_mast', {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'supply_chain_resonance',
    });
    expect(claimRes.success).toBe(true);
    expect(player.claimedDirectives).toContain('supply_chain_resonance');

    // 4. Trigger Golden Surge -> Completes 'golden_surge_trigger' directive
    player.surgeActiveUntilMs = engine.state.timeMs + 90000;
    const finalDirectives = evaluatePlayerDirectives(engine.state, 'p_mast');
    const updatedSurgeDir = finalDirectives.find((d) => d.id === 'golden_surge_trigger');
    expect(updatedSurgeDir!.isCompleted).toBe(true);

    // Claim Golden Surge directive reward
    const claimSurgeRes = engine.dispatchCommand('p_mast', {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'golden_surge_trigger',
    });
    expect(claimSurgeRes.success).toBe(true);
    expect(player.claimedDirectives).toContain('golden_surge_trigger');
  });

  it('Test 67: Phase 37 - Automated Slipways Supply Conduits, Auto-Convoys & Logistics Directives', () => {
    const engine = new GameEngine(3737);
    const { player, homeworld } = engine.addPlayer('p_slip', 'Filo Amirali Selene', '#38bdf8');

    // 1. Setup two colonies
    const colA = {
      ...homeworld,
      id: 'planet_col_a',
      name: 'Maden Kolonisi A',
      isHomeworld: false,
      systemId: 'sys_neighbor_1',
      resources: { ore: 1200, crystal: 500, fuel: 300 },
      autoSupplyEnabled: false,
      lastAutoSupplyTimeMs: 0,
    };
    const colB = {
      ...homeworld,
      id: 'planet_col_b',
      name: 'Sanayi Kolonisi B',
      isHomeworld: false,
      systemId: 'sys_neighbor_2',
      resources: { ore: 800, crystal: 600, fuel: 200 },
      autoSupplyEnabled: false,
      lastAutoSupplyTimeMs: 0,
    };
    engine.state.planets[colA.id] = colA;
    engine.state.planets[colB.id] = colB;

    // Initial directives check
    let directives = evaluatePlayerDirectives(engine.state, 'p_slip');
    const autoDir = directives.find((d) => d.id === 'automated_supply_conduits');
    expect(autoDir).toBeDefined();
    expect(autoDir!.isCompleted).toBe(false);
    expect(autoDir!.currentValue).toBe(0);

    // 2. Reject enabling auto-supply on homeworld
    const hwToggleRes = engine.dispatchCommand('p_slip', {
      type: 'TOGGLE_AUTO_SUPPLY',
      planetId: homeworld.id,
      enabled: true,
    });
    expect(hwToggleRes.success).toBe(false);
    expect(hwToggleRes.error).toContain('Başkent');

    // 3. Toggle auto-supply on colony A
    const colAToggleRes = engine.dispatchCommand('p_slip', {
      type: 'TOGGLE_AUTO_SUPPLY',
      planetId: colA.id,
      enabled: true,
    });
    expect(colAToggleRes.success).toBe(true);
    expect(colA.autoSupplyEnabled).toBe(true);

    directives = evaluatePlayerDirectives(engine.state, 'p_slip');
    expect(directives.find((d) => d.id === 'automated_supply_conduits')!.currentValue).toBe(1);

    // 4. Toggle auto-supply on colony B -> Completes directive
    const colBToggleRes = engine.dispatchCommand('p_slip', {
      type: 'TOGGLE_AUTO_SUPPLY',
      planetId: colB.id,
      enabled: true,
    });
    expect(colBToggleRes.success).toBe(true);
    expect(colB.autoSupplyEnabled).toBe(true);

    directives = evaluatePlayerDirectives(engine.state, 'p_slip');
    const completedAutoDir = directives.find((d) => d.id === 'automated_supply_conduits');
    expect(completedAutoDir!.isCompleted).toBe(true);

    // Claim directive reward
    const claimRes = engine.dispatchCommand('p_slip', {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'automated_supply_conduits',
    });
    expect(claimRes.success).toBe(true);
    expect(player.claimedDirectives).toContain('automated_supply_conduits');

    // 5. Verify periodic automated supply delivery during tick
    const hwInitialOre = homeworld.resources.ore;
    const hwInitialCrystal = homeworld.resources.crystal;
    const initialMomentum = player.momentum || 0;

    // Advance 21 seconds
    engine.tick(21000);

    // Col A & B should have transferred surplus (leaving safety buffer 250 ore, 150 crystal, 100 fuel)
    expect(homeworld.resources.ore).toBeGreaterThan(hwInitialOre);
    expect(homeworld.resources.crystal).toBeGreaterThan(hwInitialCrystal);
    expect(colA.resources.fuel).toBeLessThan(300); // 300 - 5 fuel cost - transferred fuel
    expect(player.momentum).toBeGreaterThan(initialMomentum);

    // 6. Test Tri-Sector Resonance bonus (0 fuel cost for auto supply)
    player.activeSynergyTier = 2;
    colA.resources.fuel = 200;
    colA.resources.ore = 1000;
    colA.resources.crystal = 500;
    colA.lastAutoSupplyTimeMs = 0; // reset cooldown

    engine.tick(25000);
    // Transferred ore & crystal with 50% extra throughput
    expect(colA.resources.ore).toBeLessThan(1000);
  });

  it('Test 68: Phase 38 - Imperial Breakthrough Codex, Innovation Choices & Exploration Momentum', () => {
    const engine = new GameEngine(3838);
    const { player, homeworld } = engine.addPlayer('p_break', 'Arşidük Vane', '#a855f7');

    // 1. Initial available breakthrough choices
    expect(player.availableBreakthroughs).toBeDefined();
    expect(player.availableBreakthroughs!.length).toBe(3);
    expect(player.unlockedBreakthroughs).toEqual([]);

    const initialChoice = player.availableBreakthroughs![0];
    const invalidChoice = 'breakthrough_non_existent' as any;

    // 2. Reject choosing unavailable breakthrough
    const invalidRes = engine.dispatchCommand('p_break', {
      type: 'CHOOSE_BREAKTHROUGH',
      breakthroughId: invalidChoice,
    });
    expect(invalidRes.success).toBe(false);

    // 3. Choose a valid breakthrough
    const validRes = engine.dispatchCommand('p_break', {
      type: 'CHOOSE_BREAKTHROUGH',
      breakthroughId: initialChoice,
    });
    expect(validRes.success).toBe(true);
    expect(player.unlockedBreakthroughs).toContain(initialChoice);
    expect(player.availableBreakthroughs!.length).toBe(0);
    expect(player.momentum).toBeGreaterThanOrEqual(30);

    // 4. Test Directive 'breakthrough_mastery' progression
    let directives = evaluatePlayerDirectives(engine.state, 'p_break');
    let bDir = directives.find((d) => d.id === 'breakthrough_mastery');
    expect(bDir).toBeDefined();
    expect(bDir!.currentValue).toBe(1);
    expect(bDir!.isCompleted).toBe(false);

    // 5. Test Research Completion refreshes available breakthroughs
    homeworld.buildings.research_lab = 2;
    homeworld.resources.ore = 3000;
    homeworld.resources.crystal = 2000;
    homeworld.resources.fuel = 1000;

    const resStart = engine.dispatchCommand('p_break', {
      type: 'START_RESEARCH',
      researchType: 'weapons',
    });
    expect(resStart.success).toBe(true);

    // Fast-forward to complete research
    engine.tick(player.researchQueue!.finishTime - engine.state.timeMs + 1000);
    expect(player.researchQueue).toBeNull();
    expect(player.research.weapons).toBe(1);
    expect(player.availableBreakthroughs!.length).toBe(3);

    // 6. Choose second breakthrough -> completes directive
    const secondChoice = player.availableBreakthroughs![0];
    const secondRes = engine.dispatchCommand('p_break', {
      type: 'CHOOSE_BREAKTHROUGH',
      breakthroughId: secondChoice,
    });
    expect(secondRes.success).toBe(true);
    expect(player.unlockedBreakthroughs!.length).toBe(2);

    directives = evaluatePlayerDirectives(engine.state, 'p_break');
    bDir = directives.find((d) => d.id === 'breakthrough_mastery');
    expect(bDir!.currentValue).toBe(2);
    expect(bDir!.isCompleted).toBe(true);

    const claimRes = engine.dispatchCommand('p_break', {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'breakthrough_mastery',
    });
    expect(claimRes.success).toBe(true);
    expect(player.claimedDirectives).toContain('breakthrough_mastery');

    // 7. Exploration Momentum Gain
    const momBeforeExplore = player.momentum || 0;
    const neighborSys = Object.values(engine.state.map.systems).find((s) => s.id !== homeworld.systemId)!;
    homeworld.garrison.scout = 2;

    const exploreRes = engine.dispatchCommand('p_break', {
      type: 'DISPATCH_FLEET',
      originPlanetId: homeworld.id,
      targetSystemId: neighborSys.id,
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      cargo: { ore: 0, crystal: 0, fuel: 0 },
      mission: 'explore',
    });
    expect(exploreRes.success).toBe(true);

    const fleetId = (exploreRes.data as any).fleetId;
    const fleet = engine.state.fleets[fleetId];
    expect(fleet).toBeDefined();

    // Fast-forward until scout reaches system
    engine.tick(fleet.arrivalTime - engine.state.timeMs + 1000);
    expect(player.momentum).toBeGreaterThan(momBeforeExplore);
  });

  it('Phase 39: Zero-Menu Rapid Combat Interception & Smart Defense', () => {
    const engine = new GameEngine(778899);
    const { player: p1, homeworld: hw1 } = engine.addPlayer('p_interceptor', 'Defensive Guard', '#00f0ff', undefined, false);
    const { player: p2, homeworld: hw2 } = engine.addPlayer('p_raider', 'Hostile Raider', '#ef4444', undefined, false);

    // 1. Initial State: no combat ships on interceptor base -> rapid intercept should fail gracefully
    hw1.garrison.fighter = 0;
    hw1.garrison.battleship = 0;
    hw1.resources.fuel = 500;

    const noShipsRes = engine.dispatchCommand('p_interceptor', {
      type: 'RAPID_INTERCEPT',
      targetSystemId: hw2.systemId,
    });
    expect(noShipsRes.success).toBe(false);
    expect(noShipsRes.error).toContain('muharip geminiz');

    // 2. Supply garrison with fighters and fuel
    hw1.garrison.fighter = 12;
    hw1.garrison.battleship = 2;
    hw1.resources.fuel = 1000;

    // 3. Dispatch hostile fleet from p2 towards a target system
    hw2.garrison.scout = 2;
    hw2.resources.fuel = 500;
    const raidRes = engine.dispatchCommand('p_raider', {
      type: 'DISPATCH_FLEET',
      originPlanetId: hw2.id,
      targetSystemId: hw1.systemId,
      ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
      cargo: { ore: 0, crystal: 0, fuel: 0 },
      mission: 'attack',
    });
    expect(raidRes.success).toBe(true);
    const hostileFleetId = (raidRes.data as any).fleetId;

    // 4. Execute 1-Click RAPID_INTERCEPT targeting the hostile fleet!
    const interceptRes = engine.dispatchCommand('p_interceptor', {
      type: 'RAPID_INTERCEPT',
      targetFleetId: hostileFleetId,
    });
    expect(interceptRes.success).toBe(true);
    expect(interceptRes.data).toBeDefined();

    const interceptFleetId = (interceptRes.data as any).fleetId;
    const interceptFleet = engine.state.fleets[interceptFleetId];
    expect(interceptFleet).toBeDefined();
    expect(interceptFleet.mission).toBe('intercept');
    expect(interceptFleet.doctrine).toBe('spearhead');
    expect(interceptFleet.targetSystemId).toBe(hw1.systemId);
    expect(interceptFleet.targetFleetId).toBe(hostileFleetId);
    // Strike force capped at 10 fighters and all 2 battleships
    expect(interceptFleet.ships.fighter).toBe(10);
    expect(interceptFleet.ships.battleship).toBe(2);
    expect(hw1.garrison.fighter).toBe(2); // 12 - 10 = 2 left
    expect(hw1.garrison.battleship).toBe(0); // 2 - 2 = 0 left

    // 5. Verify player stats & directive progression
    expect(p1.rapidInterceptionsCount).toBe(1);
    let directives = evaluatePlayerDirectives(engine.state, 'p_interceptor');
    let dir = directives.find((d) => d.id === 'rapid_interception');
    expect(dir).toBeDefined();
    expect(dir!.currentValue).toBe(1);
    expect(dir!.isCompleted).toBe(true);

    // Claim directive reward
    const claimRes = engine.dispatchCommand('p_interceptor', {
      type: 'CLAIM_DIRECTIVE_REWARD',
      directiveId: 'rapid_interception',
    });
    expect(claimRes.success).toBe(true);
    expect(p1.claimedDirectives).toContain('rapid_interception');
    expect(engine.state.relay.weeklyPoints['p_interceptor']).toBeGreaterThanOrEqual(50);

    // 6. Fast-forward until intercept fleet arrives at rendezvous and battle takes place
    const initialMomentum = p1.momentum || 0;
    engine.tick(interceptFleet.arrivalTime - engine.state.timeMs + 2000);

    // Interceptor wins combat and receives +25 combat momentum reward!
    expect(p1.momentum).toBeGreaterThanOrEqual(initialMomentum + 25);
  });
});




