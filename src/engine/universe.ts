import { generatePirateOutposts } from './pirates';
import { PRNG } from './prng';
import { FlightLane, Planet, PlanetSlot, SectorMap, StarSystem } from './types';

export interface SectorConfig {
  systemCount?: number;
  seed?: number;
}

const SYSTEM_NAMES = [
  'Solaria', 'Vespera', 'Aethelgard', 'Kalyx', 'Nadir',
  'Orion', 'Caelum', 'Zephyrus', 'Hyperion', 'Arcturus',
  'Valhalla', 'Tartarus', 'Elysium', 'Chronos'
];

/**
 * Generates a balanced 12-system sector map with flight lanes, planetary slots,
 * a central contested Relay, and exploration POIs.
 */
export function generateSectorMap(config: SectorConfig = {}): SectorMap {
  const seed = config.seed ?? 42;
  const count = config.systemCount ?? 12;
  const prng = new PRNG(seed);

  const systems: Record<string, StarSystem> = {};
  const lanes: FlightLane[] = [];

  // Generate system positions in a circular sector (radius ~400, center at 500, 400)
  const centerX = 500;
  const centerY = 400;

  // Center system: Relay Prime
  const relaySystemId = 'sys_relay';
  systems[relaySystemId] = {
    id: relaySystemId,
    name: 'Nexus Rölesi',
    x: centerX,
    y: centerY,
    hasRelay: true,
    slots: [
      {
        slotIndex: 0,
        planetId: 'planet_relay_core',
        name: 'Nexus İstasyonu',
        ownerId: null,
        type: 'terran',
        size: 15,
      },
    ],
  };

  // Outer systems arranged in rings
  const outerCount = count - 1;
  const namesShuffled = prng.shuffle([...SYSTEM_NAMES]);

  for (let i = 0; i < outerCount; i++) {
    const sysId = `sys_${i + 1}`;
    const name = namesShuffled[i % namesShuffled.length];

    // Two rings: inner ring (distance 220) and outer ring (distance 360)
    const isOuter = i % 2 === 0;
    const ringRadius = isOuter ? prng.nextFloat(320, 380) : prng.nextFloat(180, 240);
    const baseAngle = (i / outerCount) * Math.PI * 2;
    const angleJitter = prng.nextFloat(-0.2, 0.2);
    const angle = baseAngle + angleJitter;

    const x = Math.round(centerX + Math.cos(angle) * ringRadius);
    const y = Math.round(centerY + Math.sin(angle) * ringRadius);

    // Generate 3 to 4 planet slots
    const slotCount = prng.nextInt(3, 4);
    const slots: PlanetSlot[] = [];
    const types: ('terran' | 'desert' | 'ice' | 'volcanic' | 'ocean')[] = [
      'terran', 'desert', 'ice', 'volcanic', 'ocean'
    ];

    for (let s = 0; s < slotCount; s++) {
      slots.push({
        slotIndex: s,
        planetId: `planet_${sysId}_${s + 1}`,
        name: `${name} ${['I', 'II', 'III', 'IV'][s]}`,
        ownerId: null,
        type: prng.choice(types),
        size: prng.nextInt(12, 22),
      });
    }

    // 40% chance of an exploration POI
    let poi: StarSystem['poi'] = undefined;
    if (prng.next() < 0.45) {
      const poiTypes: ('derelict_cache' | 'alien_beacon' | 'asteroid_rich')[] = [
        'derelict_cache', 'alien_beacon', 'asteroid_rich'
      ];
      poi = {
        id: `poi_${sysId}`,
        type: prng.choice(poiTypes),
        explored: false,
        reward: {
          ore: prng.nextInt(400, 1200),
          crystal: prng.nextInt(250, 800),
          fuel: prng.nextInt(150, 500),
        },
      };
    }

    systems[sysId] = {
      id: sysId,
      name,
      x,
      y,
      hasRelay: false,
      slots,
      poi,
    };
  }

  // Connect systems with flight lanes
  // 1. Connect closest systems to Relay (3-4 spokes)
  const systemList = Object.values(systems).filter(s => s.id !== relaySystemId);
  const sortedByDistanceToRelay = [...systemList].sort((a, b) => {
    const da = Math.hypot(a.x - centerX, a.y - centerY);
    const db = Math.hypot(b.x - centerX, b.y - centerY);
    return da - db;
  });

  // Connect 4 closest to relay
  for (let k = 0; k < 4 && k < sortedByDistanceToRelay.length; k++) {
    const target = sortedByDistanceToRelay[k];
    const dist = Math.round(Math.hypot(target.x - centerX, target.y - centerY));
    lanes.push({
      id: `lane_relay_${target.id}`,
      fromSystemId: relaySystemId,
      toSystemId: target.id,
      distance: dist,
    });
  }

  // 2. Connect neighboring systems in a Delaunay / proximity graph
  const allSystems = Object.values(systems);
  const connectedPairs = new Set<string>();

  const addLane = (sysA: StarSystem, sysB: StarSystem) => {
    const pairKey = [sysA.id, sysB.id].sort().join('--');
    if (connectedPairs.has(pairKey)) return;
    connectedPairs.add(pairKey);

    const dist = Math.round(Math.hypot(sysA.x - sysB.x, sysA.y - sysB.y));
    lanes.push({
      id: `lane_${sysA.id}_${sysB.id}`,
      fromSystemId: sysA.id,
      toSystemId: sysB.id,
      distance: dist,
    });
  };

  // For each system, find 2-3 nearest neighbors and add lanes
  for (const sys of allSystems) {
    const others = allSystems
      .filter(s => s.id !== sys.id)
      .map(s => ({ sys: s, dist: Math.hypot(s.x - sys.x, s.y - sys.y) }))
      .sort((a, b) => a.dist - b.dist);

    const connectionsCount = sys.id === relaySystemId ? 4 : 2;
    for (let n = 0; n < connectionsCount && n < others.length; n++) {
      if (others[n].dist < 420) {
        addLane(sys, others[n].sys);
      }
    }
  }

  // Generate procedural pirate outposts across candidate systems
  generatePirateOutposts(systems, seed + 101);

  return {
    id: `sector_${seed}`,
    name: 'Triton Sektörü',
    systems,
    lanes,
    relaySystemId,
  };
}

/**
 * Creates initial starting homeworld planet for a player
 */
export function createHomeworldPlanet(
  planetId: string,
  name: string,
  systemId: string,
  slotIndex: number,
  ownerId: string,
  nowMs: number
): Planet {
  return {
    id: planetId,
    name,
    systemId,
    slotIndex,
    ownerId,
    isHomeworld: true,
    resources: {
      ore: 800,
      crystal: 500,
      fuel: 300,
    },
    lastResourceUpdate: nowMs,
    storageCap: 20000,
    protectedCapacity: 1200,
    buildings: {
      ore_mine: 1,
      crystal_synth: 1,
      fuel_refinery: 1,
      shipyard: 1,
      research_lab: 0,
      sensor_array: 1,
    },
    buildingQueue: null,
    shipyardQueue: [],
    defenses: {
      missile_battery: 0,
      plasma_turret: 0,
      ion_cannon: 0,
    },
    defenseQueue: [],
    garrison: {
      scout: 1,
      transport: 1,
      fighter: 2,
      battleship: 0,
    },
    stance: 'hold_position',
    specialization: 'balanced',
  };
}
