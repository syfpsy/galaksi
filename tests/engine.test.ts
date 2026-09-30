import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/engine/engine';
import { resolveCombat } from '../src/engine/combat';
import { calculateRouteInfo, checkInterceptionFeasibility } from '../src/engine/flight';

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
});
