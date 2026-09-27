import { ExplorerBot } from '../bots/explorer';
import { GuardianBot } from '../bots/guardian';
import { IndustrialistBot } from '../bots/industrialist';
import { QAExploitBot } from '../bots/qaExploit';
import { RaiderBot } from '../bots/raider';
import { IBotAgent } from '../bots/types';
import { GameEngine } from '../engine/engine';

export interface MatchStats {
  seed: number;
  simulatedDurationHours: number;
  elapsedRealTimeMs: number;
  totalFleetsDispatched: number;
  secondFleetReachedPlayers: string[];
  coloniesFounded: number;
  battlesCount: number;
  relayTurnoverCount: number;
  relayPointsLeader: { playerId: string; points: number } | null;
  qaChecksPassed: number;
  playerRankings: {
    playerId: string;
    name: string;
    archetype?: string;
    planetsCount: number;
    totalShips: number;
    relayPoints: number;
    totalResources: number;
  }[];
}

export function runHeadlessMatch(
  seed: number = 42,
  durationHours: number = 4,
  tickStepSec: number = 10
): { engine: GameEngine; stats: MatchStats } {
  const startTime = Date.now();
  const engine = new GameEngine(seed);

  // Initialize 4 archetype bots + 1 QA exploit bot
  const bots: IBotAgent[] = [];

  const b1 = engine.addPlayer('bot_ind', 'Aethel Sanayi Konsorsiyumu', '#10b981', true, 'industrialist');
  bots.push(new IndustrialistBot('bot_ind'));

  const b2 = engine.addPlayer('bot_raid', 'Kızıl Akın Filosu', '#f43f5e', true, 'raider');
  bots.push(new RaiderBot('bot_raid'));

  const b3 = engine.addPlayer('bot_guard', 'Nexus Muhafızları', '#3b82f6', true, 'guardian');
  bots.push(new GuardianBot('bot_guard'));

  const b4 = engine.addPlayer('bot_exp', 'Yıldız Kâşifleri Cemiyeti', '#ffaa00', true, 'explorer');
  bots.push(new ExplorerBot('bot_exp'));

  const qaBot = new QAExploitBot('bot_qa');
  engine.addPlayer('bot_qa', 'Sistem QA Denetçisi', '#8b5cf6', true, 'qa_exploit');
  bots.push(qaBot);

  const totalSimMs = durationHours * 3600 * 1000;
  const tickStepMs = tickStepSec * 1000;
  let currentSimMs = 0;

  const fleetDispatchCounts: Record<string, number> = {};
  for (const b of bots) fleetDispatchCounts[b.playerId] = 0;

  let relayTurnovers = 0;
  let lastRelayOwner: string | null = null;

  // Decision interval (bots think every 30 seconds of game time)
  const botDecisionIntervalMs = 30 * 1000;
  let lastBotDecisionMs = 0;

  while (currentSimMs < totalSimMs) {
    const nextStep = Math.min(tickStepMs, totalSimMs - currentSimMs);
    engine.tick(nextStep);
    currentSimMs += nextStep;

    // Track relay ownership change
    if (engine.state.relay.controllingPlayerId !== lastRelayOwner) {
      if (lastRelayOwner !== null && engine.state.relay.controllingPlayerId !== null) {
        relayTurnovers++;
      }
      lastRelayOwner = engine.state.relay.controllingPlayerId;
    }

    // Bot decision cycle
    if (currentSimMs - lastBotDecisionMs >= botDecisionIntervalMs) {
      lastBotDecisionMs = currentSimMs;
      for (const bot of bots) {
        const cmds = bot.update(engine);
        for (const cmd of cmds) {
          if (cmd.type === 'DISPATCH_FLEET') {
            fleetDispatchCounts[bot.playerId] = (fleetDispatchCounts[bot.playerId] || 0) + 1;
          }
        }
      }
    }
  }

  const elapsedRealTimeMs = Date.now() - startTime;

  // Compute final statistics
  const secondFleetReached = Object.entries(fleetDispatchCounts)
    .filter(([_, count]) => count >= 2)
    .map(([pid]) => pid);

  const coloniesFounded = Object.values(engine.state.planets).filter(p => !p.isHomeworld).length;

  let maxPoints = 0;
  let pointsLeaderId: string | null = null;
  for (const [pid, pts] of Object.entries(engine.state.relay.weeklyPoints)) {
    if (pts > maxPoints) {
      maxPoints = pts;
      pointsLeaderId = pid;
    }
  }

  const playerRankings = Object.values(engine.state.players).map(p => {
    const ownedPlanets = Object.values(engine.state.planets).filter(pl => pl.ownerId === p.id);
    let totalShips = 0;
    let totalResources = 0;

    for (const pl of ownedPlanets) {
      for (const count of Object.values(pl.garrison)) totalShips += count;
      totalResources += pl.resources.ore + pl.resources.crystal + pl.resources.fuel;
    }

    for (const fl of Object.values(engine.state.fleets)) {
      if (fl.ownerId === p.id) {
        for (const count of Object.values(fl.ships)) totalShips += count;
        totalResources += fl.cargo.ore + fl.cargo.crystal + fl.cargo.fuel;
      }
    }

    return {
      playerId: p.id,
      name: p.name,
      archetype: p.botArchetype,
      planetsCount: ownedPlanets.length,
      totalShips,
      relayPoints: engine.state.relay.weeklyPoints[p.id] || 0,
      totalResources: Math.round(totalResources),
    };
  }).sort((a, b) => (b.relayPoints * 1000 + b.totalResources) - (a.relayPoints * 1000 + a.totalResources));

  const totalFleetsDispatched = Object.values(fleetDispatchCounts).reduce((a, b) => a + b, 0);

  return {
    engine,
    stats: {
      seed,
      simulatedDurationHours: durationHours,
      elapsedRealTimeMs,
      totalFleetsDispatched,
      secondFleetReachedPlayers: secondFleetReached,
      coloniesFounded,
      battlesCount: engine.state.battleReports.length,
      relayTurnoverCount: relayTurnovers,
      relayPointsLeader: pointsLeaderId ? { playerId: pointsLeaderId, points: maxPoints } : null,
      qaChecksPassed: qaBot.illegalCommandFailures,
      playerRankings,
    },
  };
}
