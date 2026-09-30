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
});
