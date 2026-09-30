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

export type DefenseStructureType = 'missile_battery' | 'plasma_turret' | 'ion_cannon';

export interface DefenseStats {
  type: DefenseStructureType;
  name: string;
  nameTr: string;
  roleTr: string;
  hull: number;
  shield: number;
  attack: number;
  cost: Resources;
  buildTimeSec: number;
  icon: string;
  accentColor: string;
}

export type PlanetStance = 'hold_position' | 'evade_safeguard';

export type AdmiralTraitId =
  | 'tactical_genius'
  | 'iron_discipline'
  | 'evasion_master'
  | 'siege_breaker'
  | 'fleet_logistician'
  | 'debris_scavenger';

export interface Admiral {
  id: string;
  ownerId?: string;
  name: string;
  title: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  traitId: AdmiralTraitId;
  assignedFleetId: string | null;
  assignedPlanetId: string | null;
  battlesWon: number;
  battlesLost: number;
  recruitedAt: number;
}

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

export type PlanetSpecialization = 'balanced' | 'mining_hub' | 'tech_haven' | 'military_bastion';
export type FleetDoctrine = 'balanced' | 'spearhead' | 'fortress' | 'hit_and_run';

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
  assignedAdmiralId?: string;
  defenses?: Record<DefenseStructureType, number>;
  defenseQueue?: {
    defenseType: DefenseStructureType;
    count: number;
    completed: number;
    unitBuildTimeMs: number;
    nextUnitFinishTime: number;
  }[];
  specialization?: PlanetSpecialization;
}

export type EmpireArtifactId =
  | 'progenitor_matrix'
  | 'rift_hyperdrive'
  | 'dreadnought_plating'
  | 'subspace_tachyon_array';

export interface EmpireArtifact {
  id: EmpireArtifactId;
  nameTr: string;
  categoryTr: string;
  icon: string;
  color: string;
  descriptionTr: string;
  effectTr: string;
  discoveredAtMs?: number;
  originSystemName?: string;
}

export type POIType =
  | 'derelict_cache'
  | 'alien_beacon'
  | 'asteroid_rich'
  | 'pirate_lair'
  | 'pirate_ambush'
  | 'ancient_ruins'
  | 'derelict_dreadnought'
  | 'dark_matter_rift';

export interface SystemPOI {
  id: string;
  type: POIType;
  explored: boolean;
  reward?: Resources;
  artifactId?: EmpireArtifactId;
  bounty?: {
    titleTr: string;
    threatLevel: 'low' | 'medium' | 'high' | 'deadly';
    pirateGarrison: Record<ShipType, number>;
    rewardXP: number;
    claimed: boolean;
  };
}

export interface StarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  slots: PlanetSlot[];
  hasRelay: boolean;
  hasDebris?: Resources;
  poi?: SystemPOI;
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
  admiralId?: string;
  doctrine?: FleetDoctrine;
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
  defenderDefenseLosses?: Record<DefenseStructureType, number>;
  defenderDefenseRemaining?: Record<DefenseStructureType, number>;
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
  context: 'planet_raid' | 'fleet_interception' | 'relay_contest' | 'pirate_lair';
  rounds: CombatRound[];
  initialAttacker: Record<ShipType, number>;
  initialDefender: Record<ShipType, number>;
  survivingAttacker: Record<ShipType, number>;
  survivingDefender: Record<ShipType, number>;
  initialDefenses?: Record<DefenseStructureType, number>;
  survivingDefenses?: Record<DefenseStructureType, number>;
  winner: 'attacker' | 'defender' | 'draw';
  lootedResources: Resources;
  debrisFieldCreated: Resources;
  attackerAdmiralName?: string;
  defenderAdmiralName?: string;
  attackerDoctrine?: FleetDoctrine;
  defenderDoctrine?: FleetDoctrine;
  attackerArtifacts?: EmpireArtifactId[];
  defenderArtifacts?: EmpireArtifactId[];
  bountyEarned?: {
    resources: Resources;
    xp: number;
  };
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
  treasury: Resources;
}

export interface MarketTransaction {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  sellResource: ResourceType;
  sellAmount: number;
  buyResource: ResourceType;
  buyAmount: number;
  effectiveRate: number;
  feePaid: number;
}

export interface MarketState {
  rates: Record<ResourceType, number>;
  baseRates: Record<ResourceType, number>;
  volume24h: Record<ResourceType, number>;
  baseFeeRate: number;
  transactionHistory: MarketTransaction[];
}

export type EspionageOpType =
  | 'infiltrate_intel'
  | 'sabotage_shipyard'
  | 'tech_espionage'
  | 'destabilize_production';

export interface EspionageOp {
  id: string;
  originPlanetId: string;
  targetPlanetId: string;
  targetSystemId: string;
  targetPlayerId: string;
  infiltratorId: string;
  opType: EspionageOpType;
  scoutCount: number;
  departureTime: number;
  arrivalTime: number;
  status: 'in_transit' | 'resolved';
}

export interface EspionageReport {
  id: string;
  timestamp: number;
  infiltratorId: string;
  infiltratorName: string;
  targetPlayerId: string;
  targetPlayerName: string;
  targetPlanetId: string;
  targetPlanetName: string;
  targetSystemId: string;
  targetSystemName: string;
  opType: EspionageOpType;
  success: boolean;
  detected: boolean;
  counterIntelRating: number;
  stealthRating: number;
  scoutsLost: number;
  detailsTr: string;
  intelData?: {
    buildings: Record<BuildingType, number>;
    garrison: Record<ShipType, number>;
    defenses: Record<DefenseStructureType, number>;
    resources: Resources;
    research: Record<ResearchType, number>;
    storageCap: number;
    buildingQueue?: { type: BuildingType; targetLevel: number } | null;
    shipyardQueueCount?: number;
    defenseQueueCount?: number;
  };
  sabotageImpact?: {
    disruptedTarget: string;
    damageDescriptionTr: string;
  };
  techStolen?: {
    scienceReward: number;
    resources: Resources;
  };
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
  espionageReports?: EspionageReport[];
  claimedDirectives?: string[]; // IDs of claimed empire directives
  artifacts?: EmpireArtifactId[]; // Discovered ancient relics and artifacts
}

export type EmpireDirectiveId =
  | 'scout_unknown'
  | 'upgrade_mine'
  | 'build_fleet'
  | 'found_colony'
  | 'assign_admiral'
  | 'build_defense'
  | 'diplomatic_deal'
  | 'win_combat'
  | 'relay_control'
  | 'superpower';

export interface EmpireDirective {
  id: EmpireDirectiveId;
  phase: number;
  title: string;
  description: string;
  reward: {
    ore?: number;
    crystal?: number;
    fuel?: number;
    hegemonyPoints?: number;
    admiralXp?: number;
  };
  isCompleted: boolean;
  isClaimed: boolean;
  progress: number; // 0 to 1
  targetValue: number;
  currentValue: number;
}

export interface SectorMap {
  id: string;
  name: string;
  systems: Record<string, StarSystem>;
  lanes: FlightLane[];
  relaySystemId: string;
}

export type SectorEventType = 'solar_storm' | 'ancient_titan' | 'market_shock' | 'mineral_rush';

export interface SectorEvent {
  id: string;
  type: SectorEventType;
  title: string;
  description: string;
  systemId: string;
  systemName: string;
  startTimeMs: number;
  durationMs: number;
  expiresAtMs: number;
  effects: {
    speedMultiplier?: number;
    fuelCostMultiplier?: number;
    marketResource?: ResourceType;
    marketMultiplier?: number;
    titanHp?: number;
    titanMaxHp?: number;
    titanAttack?: number;
    titanReward?: Resources;
    mineralReward?: Resources;
  };
  resolved?: boolean;
}

export type TransmissionType =
  | 'warning'
  | 'truce_offer'
  | 'trade_proposal'
  | 'bravado'
  | 'intel_sharing';

export interface RadioTransmission {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderArchetype?: string;
  recipientId: string; // playerId or 'all'
  type: TransmissionType;
  title: string;
  message: string;
  timestampMs: number;
  expiresAtMs: number;
  read: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'dismissed';
  systemId?: string;
  tradeOffer?: {
    give: Resources;
    receive: Resources;
  };
  truceDurationMs?: number;
}

export type VictoryType =
  | 'hegemony'
  | 'domination'
  | 'alliance_hegemony'
  | 'alliance_domination';

export interface VictoryRecord {
  winnerId: string; // playerId or allianceId
  winnerName: string;
  winnerColor: string;
  isAlliance: boolean;
  victoryType: VictoryType;
  timestampMs: number;
  stats: {
    hegemonyPoints: number;
    ownedPlanetsCount: number;
    totalPlanetsCount: number;
    colonyRatio: number;
    totalBattlesFought: number;
    shipsDestroyed: number;
    matchDurationMs: number;
  };
}

export interface GameState {
  timeMs: number;
  seed: number;
  map: SectorMap;
  players: Record<string, Player>;
  planets: Record<string, Planet>;
  fleets: Record<string, Fleet>;
  admirals?: Record<string, Admiral>;
  relay: RelayContest;
  alliances: Record<string, Alliance>;
  market: MarketState;
  sectorEvents?: Record<string, SectorEvent>;
  transmissions?: Record<string, RadioTransmission>;
  truces?: Record<string, number>; // key: `${p1}_${p2}` (sorted alphabetically) -> expiresAtMs
  espionageOps?: EspionageOp[];
  battleReports: BattleReport[];
  eventLog: GameEventRecord[];
  victory?: VictoryRecord | null;
  seasonHistory?: VictoryRecord[];
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
  | 'defense_batch_tick'
  | 'fleet_arrival'
  | 'relay_point_tick'
  | 'espionage_op_arrival'
  | 'sector_event_expiry';

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
  | { type: 'BUILD_DEFENSES'; planetId: string; defenseType: DefenseStructureType; count: number }
  | {
      type: 'DISPATCH_FLEET';
      originPlanetId: string;
      targetSystemId: string;
      targetPlanetId?: string;
      targetFleetId?: string;
      ships: Record<ShipType, number>;
      cargo?: Partial<Resources>;
      mission: MissionType;
      admiralId?: string;
      doctrine?: FleetDoctrine;
    }
  | { type: 'RECALL_FLEET'; fleetId: string }
  | { type: 'SET_PLANET_STANCE'; planetId: string; stance: PlanetStance }
  | { type: 'CREATE_ALLIANCE'; name: string; tag: string }
  | { type: 'JOIN_ALLIANCE'; allianceId: string }
  | { type: 'LEAVE_ALLIANCE' }
  | { type: 'DONATE_TO_ALLIANCE'; planetId: string; resources: Resources }
  | { type: 'WITHDRAW_FROM_ALLIANCE'; planetId: string; resources: Resources }
  | { type: 'ALLIANCE_TRANSFER_RESOURCES'; sourcePlanetId: string; targetPlanetId: string; resources: Resources }
  | { type: 'TOGGLE_VACATION_MODE' }
  | {
      type: 'MARKET_TRADE';
      planetId: string;
      sellResource: ResourceType;
      buyResource: ResourceType;
      sellAmount: number;
    }
  | {
      type: 'LAUNCH_ESPIONAGE_OP';
      originPlanetId: string;
      targetPlanetId: string;
      opType: EspionageOpType;
      scoutCount: number;
    }
  | {
      type: 'RECRUIT_ADMIRAL';
      planetId: string;
      name: string;
      title: string;
      avatar: string;
      traitId: AdmiralTraitId;
    }
  | {
      type: 'ASSIGN_ADMIRAL';
      admiralId: string;
      fleetId?: string | null;
      planetId?: string | null;
    }
  | {
      type: 'DISMISS_ADMIRAL';
      admiralId: string;
    }
  | {
      type: 'SEND_TRANSMISSION';
      recipientId: string;
      transmissionType: TransmissionType;
      title: string;
      message: string;
      systemId?: string;
      tradeOffer?: { give: Resources; receive: Resources };
      truceDurationMs?: number;
    }
  | {
      type: 'RESPOND_TRANSMISSION';
      transmissionId: string;
      action: 'accept' | 'reject' | 'dismiss';
    }
  | {
      type: 'RESET_SEASON';
      seed?: number;
    }
  | {
      type: 'SET_PLANET_SPECIALIZATION';
      planetId: string;
      specialization: PlanetSpecialization;
    }
  | {
      type: 'CLAIM_DIRECTIVE_REWARD';
      directiveId: EmpireDirectiveId;
      targetPlanetId?: string;
    }
  | {
      type: 'SET_FLEET_DOCTRINE';
      fleetId: string;
      doctrine: FleetDoctrine;
    }
  | {
      type: 'DISPATCH_SUPPLY_CONVOY';
      colonyPlanetId: string;
      targetPlanetId?: string;
    };

export interface CommandReceipt {
  success: boolean;
  commandType: string;
  error?: string;
  timeMs: number;
  data?: Record<string, unknown>;
}
