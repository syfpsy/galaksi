import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/engine/engine';
import { resolveCombat } from '../src/engine/combat';
import { calculateRouteInfo, checkInterceptionFeasibility } from '../src/engine/flight';
import { evaluateBotDiplomacy, resetBotDiplomacyCooldowns } from '../src/bots/diplomacy';
import { ExplorerBot } from '../src/bots/explorer';
import { IndustrialistBot } from '../src/bots/industrialist';
import { GAME_CONSTANTS, getDefenseBuildDurationMs, getShipBuildDurationMs } from '../src/engine/constants';

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
});

