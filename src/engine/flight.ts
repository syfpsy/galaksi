import { SHIP_STATS } from './constants';
import { Fleet, FlightLane, SectorMap, ShipType, StarSystem } from './types';

export interface RouteInfo {
  path: string[];            // List of system IDs
  totalDistance: number;
  durationMs: number;
  fuelCost: number;
  speed: number;
}

export interface InterceptCheckResult {
  canIntercept: boolean;
  interceptSystemId?: string;
  interceptorEtaMs?: number;
  targetEtaMs?: number;
  timeMarginMs?: number;
  reason?: string;
}

/**
 * Finds shortest path on lane network using Breadth-First Search / Dijkstra
 */
export function findShortestRoute(
  fromSystemId: string,
  toSystemId: string,
  lanes: FlightLane[]
): { path: string[]; totalDistance: number } | null {
  if (fromSystemId === toSystemId) {
    return { path: [fromSystemId], totalDistance: 0 };
  }

  // Build adjacency list
  const adj = new Map<string, { neighborId: string; distance: number }[]>();
  for (const lane of lanes) {
    if (!adj.has(lane.fromSystemId)) adj.set(lane.fromSystemId, []);
    if (!adj.has(lane.toSystemId)) adj.set(lane.toSystemId, []);
    adj.get(lane.fromSystemId)!.push({ neighborId: lane.toSystemId, distance: lane.distance });
    adj.get(lane.toSystemId)!.push({ neighborId: lane.fromSystemId, distance: lane.distance });
  }

  // Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();

  distances.set(fromSystemId, 0);
  const queue: { id: string; dist: number }[] = [{ id: fromSystemId, dist: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === toSystemId) break;

    const neighbors = adj.get(current.id) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.neighborId)) continue;
      const newDist = current.dist + edge.distance;
      const prevDist = distances.get(edge.neighborId) ?? Infinity;

      if (newDist < prevDist) {
        distances.set(edge.neighborId, newDist);
        previous.set(edge.neighborId, current.id);
        queue.push({ id: edge.neighborId, dist: newDist });
      }
    }
  }

  if (!distances.has(toSystemId)) return null;

  // Reconstruct path
  const path: string[] = [];
  let curr: string | undefined = toSystemId;
  while (curr) {
    path.unshift(curr);
    curr = previous.get(curr);
  }

  return {
    path,
    totalDistance: distances.get(toSystemId)!,
  };
}

/**
 * Calculates fleet speed (determined by slowest ship) + engine research bonus
 */
export function calculateFleetSpeed(
  ships: Record<ShipType, number>,
  engineResearchLevel: number = 0
): number {
  let minSpeed = Infinity;
  let hasShips = false;

  for (const [shipType, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      hasShips = true;
      const stats = SHIP_STATS[shipType];
      if (stats.speed < minSpeed) {
        minSpeed = stats.speed;
      }
    }
  }

  if (!hasShips) return 100;

  // Engine tech provides +12% speed per level
  const techMultiplier = 1 + (engineResearchLevel * 0.12);
  return minSpeed * techMultiplier;
}

/**
 * Calculates total fuel cost for fleet across a given distance
 */
export function calculateFuelCost(
  ships: Record<ShipType, number>,
  totalDistance: number
): number {
  let totalConsumptionPerUnit = 0;
  for (const [shipType, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      const stats = SHIP_STATS[shipType];
      totalConsumptionPerUnit += stats.fuelConsumptionPerUnit * count;
    }
  }
  return Math.max(1, Math.round((totalConsumptionPerUnit * totalDistance) / 100));
}

/**
 * Calculates route, duration and fuel for a mission dispatch
 */
export function calculateRouteInfo(
  fromSystemId: string,
  toSystemId: string,
  ships: Record<ShipType, number>,
  lanes: FlightLane[],
  engineResearchLevel: number = 0
): RouteInfo | null {
  const route = findShortestRoute(fromSystemId, toSystemId, lanes);
  if (!route) return null;

  const speed = calculateFleetSpeed(ships, engineResearchLevel);
  // Heavy persistent strategy flight scaling:
  // 100 distance @ 100 speed = 900 seconds (15 minutes).
  // A 200 distance jump takes ~31 min for Battleship (spd 95), ~13.6 min for Fighter (spd 220).
  // This allows fast fighters to detect and intercept slower attack fleets mid-flight.
  const scaledDistanceSec = (route.totalDistance / speed) * 900;
  const durationMs = Math.max(30000, Math.round(scaledDistanceSec * 1000));
  const fuelCost = calculateFuelCost(ships, route.totalDistance);

  return {
    path: route.path,
    totalDistance: route.totalDistance,
    durationMs,
    fuelCost,
    speed,
  };
}

/**
 * Evaluates whether an interceptor fleet can catch a target fleet before or at its arrival
 */
export function checkInterceptionFeasibility(
  originSystemId: string,
  targetFleet: Fleet,
  interceptorShips: Record<ShipType, number>,
  lanes: FlightLane[],
  interceptorEngineLevel: number,
  nowMs: number
): InterceptCheckResult {
  // Target must be in transit
  if (targetFleet.status !== 'in_transit') {
    return { canIntercept: false, reason: 'Hedef filo hareket hâlinde değil.' };
  }

  // Destination of target fleet is the intercept rendezvous node
  const destinationSystemId = targetFleet.targetSystemId;
  const route = calculateRouteInfo(
    originSystemId,
    destinationSystemId,
    interceptorShips,
    lanes,
    interceptorEngineLevel
  );

  if (!route) {
    return { canIntercept: false, reason: 'Hedef rotaya bağlantı hattı bulunamadı.' };
  }

  const interceptorArrivalTime = nowMs + route.durationMs;
  const targetArrivalTime = targetFleet.arrivalTime;

  // Interceptor must arrive at destination before or within acceptable combat window (+10s grace)
  if (interceptorArrivalTime <= targetArrivalTime + 10000) {
    return {
      canIntercept: true,
      interceptSystemId: destinationSystemId,
      interceptorEtaMs: interceptorArrivalTime,
      targetEtaMs: targetArrivalTime,
      timeMarginMs: targetArrivalTime - interceptorArrivalTime,
    };
  } else {
    const diffSec = Math.round((interceptorArrivalTime - targetArrivalTime) / 1000);
    return {
      canIntercept: false,
      reason: `Yetersiz hız: Avcılar hedef varışından ${diffSec} saniye geç kalıyor.`,
      interceptorEtaMs: interceptorArrivalTime,
      targetEtaMs: targetArrivalTime,
      timeMarginMs: targetArrivalTime - interceptorArrivalTime,
    };
  }
}

/**
 * Calculates current visual 2D coordinates of a moving fleet between start and end node
 */
export function getFleetCurrentPosition(
  fleet: Fleet,
  nowMs: number,
  systems: Record<string, StarSystem>
): { x: number; y: number; progress: number } {
  if (fleet.status !== 'in_transit' && fleet.status !== 'returning' && fleet.status !== 'intercepting') {
    const sys = systems[fleet.originSystemId] || { x: 0, y: 0 };
    return { x: sys.x, y: sys.y, progress: 0 };
  }

  const totalTime = Math.max(1, fleet.arrivalTime - fleet.departureTime);
  const elapsed = Math.max(0, Math.min(totalTime, nowMs - fleet.departureTime));
  const progress = elapsed / totalTime;

  // Find start and end systems for overall path or current segment
  const startSys = systems[fleet.originSystemId] || { x: 0, y: 0 };
  const endSys = systems[fleet.targetSystemId] || { x: 0, y: 0 };

  const x = startSys.x + (endSys.x - startSys.x) * progress;
  const y = startSys.y + (endSys.y - startSys.y) * progress;

  return { x, y, progress };
}
