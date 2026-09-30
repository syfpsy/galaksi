import { PRNG } from './prng';
import { GameState, ResourceType, Resources, SectorEvent, SectorEventType, StarSystem } from './types';

/**
 * Procedurally generates a dynamic sector crisis / galactic opportunity
 */
export function generateSectorCrisis(
  state: GameState,
  prng: PRNG,
  nowMs: number
): SectorEvent | null {
  const systems = Object.values(state.map.systems);
  if (systems.length === 0) return null;

  // Filter systems that already have an active unresolved event
  const busySystemIds = new Set(
    Object.values(state.sectorEvents || {})
      .filter((e) => !e.resolved && nowMs < e.expiresAtMs)
      .map((e) => e.systemId)
  );

  // Exclude Nexus Relay for hazardous storms / titans
  const candidateSystems = systems.filter(
    (s) => !busySystemIds.has(s.id) && s.id !== state.map.relaySystemId
  );
  if (candidateSystems.length === 0) return null;

  const eventTypes: SectorEventType[] = ['solar_storm', 'ancient_titan', 'market_shock', 'mineral_rush'];
  const eventType = eventTypes[prng.nextInt(0, eventTypes.length - 1)];

  const targetSystem = candidateSystems[prng.nextInt(0, candidateSystems.length - 1)];
  const eventId = `crisis_${state.nextId++}`;

  switch (eventType) {
    case 'solar_storm': {
      const durationMs = prng.nextInt(25, 45) * 60 * 1000;
      return {
        id: eventId,
        type: 'solar_storm',
        title: `Güneş İyon Fırtınası: ${targetSystem.name}`,
        description: `Yıldız koronasından püsküren plazma dalgaları hiper-şerit koridorlarını kilitledi. Bu sektörden geçen filoların seyir hızı %40 düşer, yakıt tüketimi %25 artar.`,
        systemId: targetSystem.id,
        systemName: targetSystem.name,
        startTimeMs: nowMs,
        durationMs,
        expiresAtMs: nowMs + durationMs,
        effects: {
          speedMultiplier: 0.6,
          fuelCostMultiplier: 1.25,
        },
        resolved: false,
      };
    }

    case 'ancient_titan': {
      const durationMs = prng.nextInt(35, 60) * 60 * 1000;
      const reward: Resources = {
        ore: prng.nextInt(2000, 3000),
        crystal: prng.nextInt(1500, 2200),
        fuel: prng.nextInt(700, 1200),
      };
      return {
        id: eventId,
        type: 'ancient_titan',
        title: `Kadim Muhafız Titanı: ${targetSystem.name}`,
        description: `Kadim uygarlıklardan kalma devasa bir otonom harp leviathanı derin uzay uykusundan uyandı. Bu varlığı yok eden komutan muazzam hammadde ganimeti ve şöhret kazanır!`,
        systemId: targetSystem.id,
        systemName: targetSystem.name,
        startTimeMs: nowMs,
        durationMs,
        expiresAtMs: nowMs + durationMs,
        effects: {
          titanHp: 2200,
          titanMaxHp: 2200,
          titanAttack: 135,
          titanReward: reward,
        },
        resolved: false,
      };
    }

    case 'market_shock': {
      const durationMs = prng.nextInt(20, 35) * 60 * 1000;
      const res: ResourceType = prng.nextInt(0, 1) === 0 ? 'crystal' : 'fuel';
      const isShortage = prng.nextInt(0, 3) > 0; // 75% chance shortage (spike), 25% surplus (crash)
      const multiplier = isShortage ? 1.75 : 0.60;
      const resNameTr = res === 'crystal' ? 'Kristal' : 'Yakıt';

      return {
        id: eventId,
        type: 'market_shock',
        title: `Piyasa Çalkantısı: ${resNameTr} ${isShortage ? 'Fiyat Patlaması' : 'Aşırı Arzı'}`,
        description: `Sektörler arası tedarik zinciri aksaması nedeniyle ${resNameTr} galaksi pazarında %${Math.round(Math.abs(multiplier - 1) * 100)} ${isShortage ? 'değer kazandı' : 'ucuzladı'}.`,
        systemId: targetSystem.id,
        systemName: targetSystem.name,
        startTimeMs: nowMs,
        durationMs,
        expiresAtMs: nowMs + durationMs,
        effects: {
          marketResource: res,
          marketMultiplier: multiplier,
        },
        resolved: false,
      };
    }

    case 'mineral_rush': {
      const durationMs = prng.nextInt(30, 50) * 60 * 1000;
      const ore = prng.nextInt(1200, 2000);
      const crystal = prng.nextInt(800, 1500);

      return {
        id: eventId,
        type: 'mineral_rush',
        title: `Kuyruklu Yıldız Enkazı: ${targetSystem.name}`,
        description: `Nadir element yüklü bir göktaşı kuşağı sisteme çarparak uzay boşluğuna ${ore} Cevher ve ${crystal} Kristal saçtı. Nakliye filoları sevk edilerek enkaz toplanabilir.`,
        systemId: targetSystem.id,
        systemName: targetSystem.name,
        startTimeMs: nowMs,
        durationMs,
        expiresAtMs: nowMs + durationMs,
        effects: {
          mineralReward: { ore, crystal, fuel: 0 },
        },
        resolved: false,
      };
    }
  }
}

/**
 * Applies immediate world-state side effects when a crisis begins
 */
export function applySectorCrisisStart(state: GameState, event: SectorEvent): void {
  if (event.type === 'mineral_rush' && event.effects.mineralReward) {
    const sys = state.map.systems[event.systemId];
    if (sys) {
      if (!sys.hasDebris) {
        sys.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
      }
      sys.hasDebris.ore += event.effects.mineralReward.ore || 0;
      sys.hasDebris.crystal += event.effects.mineralReward.crystal || 0;
    }
  } else if (event.type === 'market_shock' && event.effects.marketResource && event.effects.marketMultiplier) {
    if (state.market && state.market.rates) {
      const cur = state.market.rates[event.effects.marketResource];
      state.market.rates[event.effects.marketResource] = Number(
        (cur * event.effects.marketMultiplier).toFixed(3)
      );
    }
  }
}

/**
 * Reverts or resolves state side effects when a crisis concludes
 */
export function applySectorCrisisEnd(state: GameState, event: SectorEvent): void {
  if (event.type === 'market_shock' && event.effects.marketResource) {
    if (state.market && state.market.baseRates && state.market.rates) {
      // Restore rate smoothly back towards base rate
      const base = state.market.baseRates[event.effects.marketResource];
      state.market.rates[event.effects.marketResource] = base;
    }
  }
}

/**
 * Returns speed and fuel multipliers for a flight path given active sector events
 */
export function getRouteCrisisModifiers(
  state: GameState,
  path: string[],
  nowMs: number
): { speedMultiplier: number; fuelCostMultiplier: number; affectedSystemNames: string[] } {
  let speedMultiplier = 1.0;
  let fuelCostMultiplier = 1.0;
  const affectedSystemNames: string[] = [];

  if (!state.sectorEvents) {
    return { speedMultiplier, fuelCostMultiplier, affectedSystemNames };
  }

  const pathSet = new Set(path);
  for (const event of Object.values(state.sectorEvents)) {
    if (event.resolved || nowMs >= event.expiresAtMs) continue;

    if (event.type === 'solar_storm' && pathSet.has(event.systemId)) {
      if (event.effects.speedMultiplier) {
        speedMultiplier = Math.min(speedMultiplier, event.effects.speedMultiplier);
      }
      if (event.effects.fuelCostMultiplier) {
        fuelCostMultiplier = Math.max(fuelCostMultiplier, event.effects.fuelCostMultiplier);
      }
      affectedSystemNames.push(event.systemName);
    }
  }

  return { speedMultiplier, fuelCostMultiplier, affectedSystemNames };
}
