/**
 * CANLI GALAKSİ - Core Game Engine Types
 * Based on Game Design Document v0.1.0
 */

export type ResourceType = 'ore' | 'crystal' | 'fuel';

export interface Resources {
  ore: number;
  crystal: number;
  fuel: number;
}

export type BuildingType =
  | 'ore_mine'
  | 'crystal_synth'
  | 'fuel_refinery'
  | 'shipyard'
  | 'research_lab'
  | 'sensor_array';

export type ResearchType = 'engines' | 'weapons' | 'sensors';

export type ShipType = 'scout' | 'transport' | 'fighter' | 'battleship';

export type PlanetStance = 'hold_position' | 'evade_safeguard';

export type MissionType =
  | 'explore'
  | 'transport'
  | 'attack'
  | 'intercept'
  | 'support'
  | 'colonize';

export type IntelLevel =
  | 'unexplored'     // Only know coordinates and connections
  | 'mapped'         // Known planet slots, ownership, relay presence
  | 'sensor_contact' // Hostile fleet detected: direction, ETA, vague size
  | 'deep_intel'     // Approximate ship count and role breakdown
  | 'full';          // Friendly/Allied: full details

export interface ShipStats {
  type: ShipType;
  name: string;
  nameTr: string;
  roleTr: string;
  hull: number;
  shield: number;
  attack: number;
  speed: number;           // base speed (distance units per second)
  cargoCapacity: number;
  fuelConsumptionPerUnit: number;
  cost: Resources;
  buildTimeSec: number;
}

export interface BuildingStats {
  type: BuildingType;
  name: string;
  nameTr: string;
  descriptionTr: string;
  baseCost: Resources;
  costMultiplier: number;
  baseBuildTimeSec: number;
  timeMultiplier: number;
}

export interface ResearchStats {
  type: ResearchType;
  name: string;
  nameTr: string;
  descriptionTr: string;
  baseCost: Resources;
  costMultiplier: number;
  baseResearchTimeSec: number;
  timeMultiplier: number;
}

export interface PlanetSlot {
  slotIndex: number;
  planetId: string;
  name: string;
  ownerId: string | null;   // null if uncolonized
  type: 'terran' | 'desert' | 'ice' | 'volcanic' | 'ocean';
  size: number;             // max building levels sum or slots
}

export interface Planet {
  id: string;
  name: string;
  systemId: string;
  slotIndex: number;
  ownerId: string;
  isHomeworld: boolean;
  resources: Resources;
  lastResourceUpdate: number; // game time ms
  storageCap: number;
  protectedCapacity: number; // protected from raiding
  buildings: Record<BuildingType, number>;
  buildingQueue: {
    type: BuildingType;
    targetLevel: number;
    startTime: number;
    finishTime: number;
  } | null;
  shipyardQueue: {
    shipType: ShipType;
    count: number;
    completed: number;
    unitBuildTimeMs: number;
    nextUnitFinishTime: number;
  }[];
  garrison: Record<ShipType, number>;
  stance: PlanetStance;
}

export interface StarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  slots: PlanetSlot[];
  hasRelay: boolean;
  hasDebris?: Resources;
  poi?: {
    id: string;
    type: 'derelict_cache' | 'alien_beacon' | 'asteroid_rich';
    explored: boolean;
    reward?: Resources;
  };
}

export interface FlightLane {
  id: string;
  fromSystemId: string;
  toSystemId: string;
  distance: number;
}

export interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  ships: Record<ShipType, number>;
  cargo: Resources;
  originSystemId: string;
  targetSystemId: string;
  path: string[];             // System IDs in order
  pathIndex: number;
  mission: MissionType;
  targetFleetId?: string;     // for intercept
  targetPlanetId?: string;    // for attack/transport/colonize
  departureTime: number;      // ms
  arrivalTime: number;        // ms
  totalDistance: number;
  speed: number;
  fuelCost: number;
  recallLockedAfterTime: number; // after this time cannot recall
  isReturning: boolean;
  status: 'orbiting' | 'in_transit' | 'intercepting' | 'returning' | 'destroyed';
}

export interface RelayContest {
  systemId: string;
  controllingPlayerId: string | null;
  garrison: Record<ShipType, number>;
  capturedAtTime: number;
  weeklyPoints: Record<string, number>; // playerId -> points
  sensorRadiusBonus: number;            // Extra systems visible
}

export interface CombatRound {
  roundNumber: number;
  attackerDamageDealt: number;
  defenderDamageDealt: number;
  attackerLosses: Record<ShipType, number>;
  defenderLosses: Record<ShipType, number>;
  attackerRemaining: Record<ShipType, number>;
  defenderRemaining: Record<ShipType, number>;
}

export interface BattleReport {
  id: string;
  timestamp: number;
  systemId: string;
  systemName: string;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  context: 'planet_raid' | 'fleet_interception' | 'relay_contest';
  rounds: CombatRound[];
  initialAttacker: Record<ShipType, number>;
  initialDefender: Record<ShipType, number>;
  survivingAttacker: Record<ShipType, number>;
  survivingDefender: Record<ShipType, number>;
  winner: 'attacker' | 'defender' | 'draw';
  lootedResources: Resources;
  debrisFieldCreated: Resources;
}

export interface PlayerIntel {
  discoveredSystems: Record<string, IntelLevel>; // systemId -> level
  lastSeenFleets: Record<string, {
    fleetId: string;
    approxSize: 'small' | 'medium' | 'large' | 'massive';
    shipRoles?: ShipType[];
    originSystemId: string;
    targetSystemId: string;
    etaMs: number;
    observedTime: number;
  }>;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  founderId: string;
  memberIds: string[];
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
  botArchetype?: 'industrialist' | 'raider' | 'guardian' | 'explorer' | 'admiral' | 'qa_exploit';
  allianceId?: string | null;
  vacationMode: boolean;
  research: Record<ResearchType, number>;
  researchQueue: {
    type: ResearchType;
    targetLevel: number;
    startTime: number;
    finishTime: number;
  } | null;
  protectionUntilTime: number; // Newbie protection window (48h or threshold)
  intel: PlayerIntel;
}

export interface SectorMap {
  id: string;
  name: string;
  systems: Record<string, StarSystem>;
  lanes: FlightLane[];
  relaySystemId: string;
}

export interface GameState {
  timeMs: number;
  seed: number;
  map: SectorMap;
  players: Record<string, Player>;
  planets: Record<string, Planet>;
  fleets: Record<string, Fleet>;
  relay: RelayContest;
  alliances: Record<string, Alliance>;
  battleReports: BattleReport[];
  eventLog: GameEventRecord[];
  nextId: number;
}

export interface GameEventRecord {
  id: string;
  timeMs: number;
  type: string;
  playerId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Scheduled simulation events in queue
export type ScheduledEventType =
  | 'building_completed'
  | 'research_completed'
  | 'shipyard_batch_tick'
  | 'fleet_arrival'
  | 'relay_point_tick';

export interface ScheduledEvent {
  id: string;
  timeMs: number;
  type: ScheduledEventType;
  payload: Record<string, unknown>;
}

// Command Definitions
export type GameCommand =
  | { type: 'UPGRADE_BUILDING'; planetId: string; buildingType: BuildingType }
  | { type: 'START_RESEARCH'; researchType: ResearchType }
  | { type: 'BUILD_SHIPS'; planetId: string; shipType: ShipType; count: number }
  | {
      type: 'DISPATCH_FLEET';
      originPlanetId: string;
      targetSystemId: string;
      targetPlanetId?: string;
      targetFleetId?: string;
      ships: Record<ShipType, number>;
      cargo?: Partial<Resources>;
      mission: MissionType;
    }
  | { type: 'RECALL_FLEET'; fleetId: string }
  | { type: 'SET_PLANET_STANCE'; planetId: string; stance: PlanetStance }
  | { type: 'CREATE_ALLIANCE'; name: string; tag: string }
  | { type: 'JOIN_ALLIANCE'; allianceId: string }
  | { type: 'LEAVE_ALLIANCE' }
  | { type: 'TOGGLE_VACATION_MODE' };

export interface CommandReceipt {
  success: boolean;
  commandType: string;
  error?: string;
  timeMs: number;
  data?: Record<string, unknown>;
}
