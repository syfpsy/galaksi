import { generatePirateOutposts } from './pirates';
import { PRNG } from './prng';
import { generateInitialBlockers } from './terraforming';
import {
  EmpireArtifactId,
  FlightLane,
  Planet,
  PlanetSlot,
  POIType,
  SectorMap,
  StarSystem,
} from './types';

export interface SectorConfig {
  systemCount?: number;
  seed?: number;
}

const ORIGINAL_SYSTEM_NAMES = [
  'Solaria', 'Vespera', 'Aethelgard', 'Kalyx', 'Nadir',
  'Orion', 'Caelum', 'Zephyrus', 'Hyperion', 'Arcturus',
  'Valhalla', 'Tartarus', 'Elysium', 'Chronos'
];

const EXTENDED_SYSTEM_NAMES = [
  ...ORIGINAL_SYSTEM_NAMES,
  'Vega', 'Sirius', 'Aldebaran', 'Polaris', 'Antares', 'Rigel',
  'Betelgeuse', 'Deneb', 'Altair', 'Procyon', 'Spica',
  'Capella', 'Regulus', 'Castor', 'Pollux', 'Canopus',
  'Achernar', 'Bellatrix', 'Alnilam', 'Mintaka', 'Saiph',
  'Mirfak', 'Algol', 'Alcor', 'Mizar', 'Alphecca',
  'Rasalhague', 'Kochab', 'Menkar', 'Markab', 'Scheat',
  'Alpheratz', 'Diphda', 'Hamal', 'Sheratan', 'Dubhe',
  'Merak', 'Phecda', 'Megrez', 'Alioth', 'Alkaid',
  'Thuban', 'Rastaban', 'Eltanin', 'Sargas', 'Shaula',
  'Kaus Media', 'Nunki', 'Ascella', 'Algedi', 'Dabih',
  'Sadalsuud', 'Sadalmelik', 'Fomalhaut', 'Ankaa', 'Acrux'
];

/**
 * Generates a balanced sector map with flight lanes, planetary slots,
 * a central contested Relay, and exploration POIs.
 * Supports configurable system count from micro sectors (6) to epic galaxies (60+).
 */
export function generateSectorMap(config: SectorConfig = {}): SectorMap {
  const seed = config.seed ?? 42;
  const count = Math.max(6, config.systemCount ?? 12);
  const prng = new PRNG(seed);

  const systems: Record<string, StarSystem> = {};
  const lanes: FlightLane[] = [];

  // Generate system positions in a circular sector
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
  const namePool = count === 12 ? ORIGINAL_SYSTEM_NAMES : EXTENDED_SYSTEM_NAMES;
  const namesShuffled = prng.shuffle([...namePool]);

  for (let i = 0; i < outerCount; i++) {
    const sysId = `sys_${i + 1}`;
    const name = namesShuffled[i % namesShuffled.length];

    // Adaptive multi-ring galactic layout
    let ringRadius: number;
    let angle: number;

    if (count === 12) {
      // Deterministic preservation for standard 12-system seed
      const isOuter = i % 2 === 0;
      ringRadius = isOuter ? prng.nextFloat(320, 380) : prng.nextFloat(180, 240);
      const baseAngle = (i / outerCount) * Math.PI * 2;
      const angleJitter = prng.nextFloat(-0.2, 0.2);
      angle = baseAngle + angleJitter;
    } else {
      // Dynamic multi-ring layout scaling from micro (6) to epic (60)
      const numRings = outerCount <= 8 ? 2 : outerCount <= 20 ? 3 : outerCount <= 35 ? 4 : 5;
      const ringIndex = i % numRings;
      const minRadius = 160;
      const maxRadius = outerCount <= 8 ? 290 : outerCount <= 20 ? 430 : outerCount <= 35 ? 600 : 780;
      const ringStep = (maxRadius - minRadius) / Math.max(1, numRings - 1);
      const nominalRadius = minRadius + ringIndex * ringStep;
      ringRadius = nominalRadius + prng.nextFloat(-22, 22);

      const systemsInRing = Math.ceil(outerCount / numRings);
      const ringItemIdx = Math.floor(i / numRings);
      const baseAngle = (ringItemIdx / systemsInRing) * Math.PI * 2 + (ringIndex * 0.42);
      const angleJitter = prng.nextFloat(-0.14, 0.14);
      angle = baseAngle + angleJitter;
    }

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
      const poiTypes: POIType[] = [
        'derelict_cache',
        'alien_beacon',
        'asteroid_rich',
        'ancient_ruins',
        'derelict_dreadnought',
        'dark_matter_rift',
      ];
      const selectedType = prng.choice(poiTypes);
      let ore = prng.nextInt(400, 1200);
      let crystal = prng.nextInt(250, 800);
      let fuel = prng.nextInt(150, 500);

      let artifactId: EmpireArtifactId | undefined = undefined;
      if (selectedType === 'ancient_ruins') {
        artifactId = 'progenitor_matrix';
        ore = Math.round(ore * 1.8);
        crystal = Math.round(crystal * 2.2);
      } else if (selectedType === 'dark_matter_rift') {
        artifactId = 'rift_hyperdrive';
        crystal = Math.round(crystal * 1.8);
        fuel = Math.round(fuel * 2.5);
      } else if (selectedType === 'derelict_dreadnought') {
        artifactId = 'dreadnought_plating';
        ore = Math.round(ore * 2.5);
        fuel = Math.round(fuel * 1.5);
      } else if (selectedType === 'alien_beacon') {
        artifactId = 'subspace_tachyon_array';
      }

      poi = {
        id: `poi_${sysId}`,
        type: selectedType,
        explored: false,
        artifactId,
        reward: {
          ore,
          crystal,
          fuel,
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

    if (count === 12) {
      const connectionsCount = sys.id === relaySystemId ? 4 : 2;
      for (let n = 0; n < connectionsCount && n < others.length; n++) {
        if (others[n].dist < 420) {
          addLane(sys, others[n].sys);
        }
      }
    } else {
      const maxLaneDist = count <= 25 ? 490 : 620;
      const connectionsCount = sys.id === relaySystemId ? Math.min(6, outerCount) : 2;

      // Always connect to closest neighbor to avoid orphan systems
      if (others.length > 0) {
        addLane(sys, others[0].sys);
      }

      for (let n = 1; n < connectionsCount && n < others.length; n++) {
        if (others[n].dist < maxLaneDist) {
          addLane(sys, others[n].sys);
        }
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
    biome: 'terran',
    terraformingQueue: null,
    activeDecisions: [],
    blockers: [],
    // Phase 32: Surface Districts & Pops Simulation
    districts: {
      city: 3,
      mining: 2,
      generator: 2,
      agriculture: 1,
    },
    districtQueue: null,
    pops: 10,
    housing: 17, // 3 city * 5 + 2 mining * 2 + ... = 15+4 = 19
    amenities: 15,
    stability: 80,
    lastPopGrowthTime: nowMs,
  };
}
