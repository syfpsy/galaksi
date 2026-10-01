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

export type WeaponModuleId = 'laser' | 'plasma' | 'railgun' | 'torpedo';
export type DefenseModuleId = 'standard_shield' | 'plasteel_armor' | 'evasion_thrusters';
export type UtilityModuleId = 'standard_reactor' | 'cargo_expander' | 'subspace_sensor' | 'hyper_drive';

export interface ShipLoadout {
  weapon: WeaponModuleId;
  defense: DefenseModuleId;
  utility: UtilityModuleId;
}

export type ShipLoadoutMap = Record<ShipType, ShipLoadout>;

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

export type PlanetBiome =
  | 'terran'
  | 'ocean'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'gas'
  | 'gaia'
  | 'tomb';

export interface TerraformQueue {
  targetBiome: PlanetBiome;
  cost: Resources;
  startTime: number;
  finishTime: number;
}

export type PlanetaryDecisionId =
  | 'climate_domes'
  | 'soil_enrichment'
  | 'geothermal_core_drill'
  | 'ecological_sanctuary'
  | 'planetary_shield_overcharge'
  | 'strip_mining_initiative';

export interface PlanetaryDecision {
  id: PlanetaryDecisionId;
  enactedAt: number;
  expiresAt?: number;
}

export type PlanetaryBlockerId =
  | 'volcanic_ash_wastes'
  | 'radioactive_fallout'
  | 'glacial_chasm'
  | 'noxious_swamp'
  | 'dense_jungle';

export interface PlanetaryBlocker {
  id: string;
  type: PlanetaryBlockerId;
  clearing?: {
    startTime: number;
    finishTime: number;
  } | null;
}

export interface PlanetSlot {
  slotIndex: number;
  planetId: string;
  name: string;
  ownerId: string | null;   // null if uncolonized
  type: PlanetBiome;
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
  biome?: PlanetBiome;
  terraformingQueue?: TerraformQueue | null;
  activeDecisions?: PlanetaryDecision[];
  blockers?: PlanetaryBlocker[];
}

export type StarbaseTier = 'outpost' | 'starbase' | 'citadel';
export type StarbaseModuleType = 'sensor_relay' | 'defense_platform' | 'shipyard_bay' | 'trade_hub';

export interface Starbase {
  id: string;
  systemId: string;
  ownerId: string;
  tier: StarbaseTier;
  modules: StarbaseModuleType[];
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  upgradeQueue?: {
    targetTier: StarbaseTier;
    startTime: number;
    finishTime: number;
  } | null;
  moduleQueue?: {
    moduleType: StarbaseModuleType;
    startTime: number;
    finishTime: number;
  } | null;
  createdAt: number;
}

export type SenateResolutionType =
  | 'military_readiness'
  | 'free_trade'
  | 'scientific_cooperative'
  | 'bounty_hunters'
  | 'custodian_election'
  | 'sanctions';

export type SenateVote = 'for' | 'against' | 'abstain';

export interface SenateResolution {
  id: string;
  type: SenateResolutionType;
  targetPlayerId?: string;
  proposedBy: string;
  proposedAt: number;
  votingEndsAt: number;
  isEmergencySession?: boolean;
  votes: Record<string, SenateVote>;
  status: 'active_session' | 'passed' | 'failed';
}

export interface ActiveSenateModifier {
  id: string;
  resolutionType: SenateResolutionType;
  targetPlayerId?: string;
  enactedAt: number;
  expiresAt?: number;
}

export interface SenateSessionHistoryItem {
  id: string;
  resolutionType: SenateResolutionType;
  targetPlayerId?: string;
  proposedBy: string;
  passed: boolean;
  forWeight: number;
  againstWeight: number;
  concludedAt: number;
}

export interface SenateState {
  currentSession: SenateResolution | null;
  activeResolutions: ActiveSenateModifier[];
  custodianPlayerId?: string | null;
  sessionHistory: SenateSessionHistoryItem[];
  lastSessionEndedAt?: number;
}

export type MegastructureType =
  | 'dyson_swarm'
  | 'science_nexus'
  | 'mega_shipyard'
  | 'sentry_array';

export interface Megastructure {
  id: string;
  type: MegastructureType;
  systemId: string;
  ownerId: string;
  stage: number;
  maxStage: number;
  status: 'under_construction' | 'completed';
  stageStartTimeMs: number;
  stageFinishTimeMs: number;
}

export type GatewayStatus = 'dormant' | 'under_construction' | 'active';

export interface Gateway {
  id: string;
  systemId: string;
  ownerId?: string | null;
  status: GatewayStatus;
  activationStartTimeMs?: number;
  activationFinishTimeMs?: number;
}

export type CouncilPosition =
  | 'ruler'
  | 'defense_minister'
  | 'science_director'
  | 'industry_minister'
  | 'spymaster';

export type LeaderTraitId =
  | 'iron_disciplinarian'
  | 'technologist_visionary'
  | 'master_logistics'
  | 'shadow_broker'
  | 'inspirational_orator'
  | 'warlord'
  | 'fleet_organizer'
  | 'deep_space_miner';

export interface LeaderTrait {
  id: LeaderTraitId;
  nameTr: string;
  descriptionTr: string;
  bonusType: 'production' | 'research' | 'ship_build' | 'fleet_attack' | 'espionage' | 'stability';
  bonusValue: number;
}

export interface CouncilLeader {
  id: string;
  name: string;
  title: string;
  avatar: string;
  ownerId: string;
  level: number; // 1 to 5
  xp: number;
  nextLevelXp: number;
  assignedPosition: CouncilPosition | null;
  trait: LeaderTrait;
  tenureHours?: number;
}

export type FactionType =
  | 'militarists'
  | 'technocrats'
  | 'merchants'
  | 'expansionists';

export interface FactionAgenda {
  id: string;
  titleTr: string;
  descriptionTr: string;
  fulfilled: boolean;
  approvalImpact: number;
}

export interface EmpireFaction {
  type: FactionType;
  nameTr: string;
  icon: string;
  color: string;
  populationSharePercent: number; // 0 to 100
  approvalRating: number; // 0 to 100
  status: 'rebellious' | 'discontent' | 'content' | 'pleased' | 'fanatical';
  agendas: FactionAgenda[];
}

export interface ImperialCouncilState {
  playerId: string;
  leaders: Record<string, CouncilLeader>;
  positions: Record<CouncilPosition, string | null>; // position -> leaderId
  factions: Record<FactionType, EmpireFaction>;
  stabilityPercent: number; // 0 to 100
  resourceProductionMultiplier: number; // e.g. 0.85 to 1.15
  recruitCandidates: CouncilLeader[];
  lastCandidateRefreshMs?: number;
}

// ==========================================
// Phase 16: Endgame Galactic Crisis & GDF
// ==========================================
export type CrisisType = 'void_incursion';
export type CrisisStage = 'dormant' | 'breaching' | 'active' | 'apex' | 'defeated';

export interface VoidAnchor {
  id: string;
  name: string;
  systemId: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  defenseFleet: Record<ShipType, number>;
  destroyed: boolean;
}

export interface CrisisFleet {
  id: string;
  name: string;
  systemId: string;
  targetSystemId?: string;
  ships: Record<ShipType, number>;
  power: number;
  status: 'patrolling' | 'besieging' | 'hunting';
}

export interface GalacticCrisisState {
  type: CrisisType;
  stage: CrisisStage;
  epicenterSystemId: string;
  riftIntegrity: number; // 0 to 100%
  voidAnchors: VoidAnchor[];
  infestedPlanetIds: string[];
  crisisFleets: CrisisFleet[];
  behemothHp: number;
  behemothMaxHp: number;
  behemothShield: number;
  behemothMaxShield: number;
  behemothDefeated: boolean;
  slayerPlayerId: string | null;
  gdfFleetUnits: Record<ShipType, number>;
  gdfDonations: Record<string, number>; // playerId -> total ship power donated
  lastSpawnTimeMs: number;
  startedAtMs: number;
}

// ==========================================
// Phase 17: Traditions, Unity & Ascension Perks
// ==========================================
export type TraditionTreeId = 'discovery' | 'expansion' | 'prosperity' | 'supremacy' | 'harmony';
export type TraditionTier = 1 | 2 | 3;

export interface TraditionNodeInfo {
  id: string;
  treeId: TraditionTreeId;
  tier: TraditionTier;
  nameTr: string;
  descriptionTr: string;
  cost: number;
  icon: string;
}

export type AscensionPerkId =
  | 'transcendence'
  | 'synthetic_evolution'
  | 'voidborne'
  | 'galactic_force_projection'
  | 'defender_of_the_galaxy'
  | 'ecumenopolis_mastery';

export interface AscensionPerkInfo {
  id: AscensionPerkId;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  accentColor: string;
}

export interface EmpireTraditionsState {
  playerId: string;
  unity: number;
  unityRatePerHour: number;
  trees: Record<TraditionTreeId, {
    unlockedTiers: TraditionTier[];
    completed: boolean;
  }>;
  ascensionPerks: AscensionPerkId[];
  availablePerkSlots: number;
}

export type EmpireArtifactId =
  | 'progenitor_matrix'
  | 'rift_hyperdrive'
  | 'dreadnought_plating'
  | 'subspace_tachyon_array'
  | 'omniscient_archive'
  | 'chronos_core';

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

// ==========================================
// Phase 18: Archaeology Sites & Relic Triumphs
// ==========================================
export interface RelicTriumphConfig {
  nameTr: string;
  descriptionTr: string;
  minorArtifactsCost: number;
  durationMs: number;
  cooldownMs: number;
}

export interface ActiveRelicTriumph {
  relicId: EmpireArtifactId;
  activatedAtMs: number;
  expiresAtMs: number;
  cooldownUntilMs: number;
}

export interface ArchaeologyChapterChoice {
  textTr: string;
  descriptionTr: string;
  outcomeTr: string;
  minorArtifactsBonus?: number;
  resourceBonus?: Partial<Resources>;
  xpBonus?: number;
}

export interface ArchaeologyChapter {
  chapterNumber: number;
  titleTr: string;
  textTr: string;
  durationMs: number;
  hasChoice?: boolean;
  choices?: ArchaeologyChapterChoice[];
  rewardMinorArtifacts: number;
  rewardResources?: Partial<Resources>;
  rewardXP?: number;
}

export interface ArchaeologySite {
  id: string;
  systemId: string;
  systemName: string;
  nameTr: string;
  descriptionTr: string;
  totalChapters: number;
  currentChapter: number;
  chapterProgressMs: number;
  status: 'available' | 'excavating' | 'choice_pending' | 'completed';
  assignedFleetId?: string | null;
  excavatingPlayerId?: string | null;
  pendingChoiceChapter?: number;
  completedAtMs?: number;
  rewardArtifactId?: EmpireArtifactId;
  discoveredByPlayerIds: string[];
  log: {
    chapter: number;
    titleTr: string;
    choiceMadeTr?: string;
    completedAtMs: number;
  }[];
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
  loadouts?: ShipLoadoutMap;
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
  context: 'planet_raid' | 'fleet_interception' | 'relay_contest' | 'pirate_lair' | 'void_anchor' | 'void_rift';
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
  attackerLoadouts?: ShipLoadoutMap;
  defenderLoadouts?: ShipLoadoutMap;
  initialStarbase?: {
    tier: StarbaseTier;
    hull: number;
    shield: number;
    attack: number;
    modules: StarbaseModuleType[];
  };
  survivingStarbase?: {
    tier: StarbaseTier;
    hull: number;
    shield: number;
    destroyed: boolean;
  };
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
  minorArtifacts?: number; // Phase 18: Strategic minor artifacts from excavations
  relicCooldowns?: Record<string, number>; // Phase 18: relicId -> cooldownExpiresAtMs
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
  | 'intel_sharing'
  | 'hegemony_warning'
  | 'coalition_proposal'
  | 'relic_envy';

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
  starbases?: Record<string, Starbase>; // key: systemId
  megastructures?: Record<string, Megastructure>; // key: megastructureId
  gateways?: Record<string, Gateway>; // key: systemId
  senate?: SenateState;
  councils?: Record<string, ImperialCouncilState>; // key: playerId
  shipLoadouts?: Record<string, ShipLoadoutMap>; // key: playerId
  crisis?: GalacticCrisisState | null;
  traditions?: Record<string, EmpireTraditionsState>; // key: playerId
  archaeologySites?: Record<string, ArchaeologySite>; // key: siteId (Phase 18)
  activeRelicTriumphs?: Record<string, ActiveRelicTriumph[]>; // key: playerId (Phase 18)
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
  | 'sector_event_expiry'
  | 'starbase_upgraded'
  | 'starbase_module_completed'
  | 'senate_session_concluded'
  | 'megastructure_stage_completed'
  | 'gateway_activated'
  | 'crisis_tick'
  | 'crisis_breached';

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
    }
  | {
      type: 'BUILD_STARBASE';
      systemId: string;
      planetId: string;
    }
  | {
      type: 'UPGRADE_STARBASE';
      systemId: string;
      planetId: string;
    }
  | {
      type: 'INSTALL_STARBASE_MODULE';
      systemId: string;
      planetId: string;
      moduleType: StarbaseModuleType;
    }
  | {
      type: 'DISMANTLE_STARBASE_MODULE';
      systemId: string;
      moduleIndex: number;
    }
  | {
      type: 'PROPOSE_SENATE_RESOLUTION';
      resolutionType: SenateResolutionType;
      targetPlayerId?: string;
    }
  | {
      type: 'CAST_SENATE_VOTE';
      vote: SenateVote;
    }
  | {
      type: 'CALL_EMERGENCY_SENATE_SESSION';
      resolutionType: SenateResolutionType;
      targetPlayerId?: string;
    }
  | {
      type: 'BUILD_MEGASTRUCTURE';
      systemId: string;
      megastructureType: MegastructureType;
      fundingPlanetId: string;
    }
  | {
      type: 'UPGRADE_MEGASTRUCTURE';
      megastructureId: string;
      fundingPlanetId: string;
    }
  | {
      type: 'CONSTRUCT_GATEWAY';
      systemId: string;
      fundingPlanetId: string;
    }
  | {
      type: 'ACTIVATE_GATEWAY';
      systemId: string;
      fundingPlanetId: string;
    }
  | {
      type: 'APPOINT_COUNCILOR';
      position: CouncilPosition;
      leaderId: string;
    }
  | {
      type: 'DISMISS_COUNCILOR';
      position: CouncilPosition;
    }
  | {
      type: 'RECRUIT_COUNCIL_LEADER';
      candidateId: string;
      fundingPlanetId: string;
    }
  | {
      type: 'PROMOTE_FACTION_AGENDA';
      factionType: FactionType;
      agendaId: string;
      fundingPlanetId: string;
    }
  | {
      type: 'SET_SHIP_LOADOUT';
      shipType: ShipType;
      loadout: ShipLoadout;
    }
  | {
      type: 'REFIT_SHIPS';
      planetId: string;
      shipType: ShipType;
      count: number;
    }
  | {
      type: 'DONATE_TO_GDF';
      planetId: string;
      ships: Record<ShipType, number>;
    }
  | {
      type: 'DISPATCH_GDF_FLEET';
      targetSystemId: string;
      ships: Record<ShipType, number>;
    }
  | {
      type: 'PURIFY_INFESTED_PLANET';
      planetId: string;
    }
  | {
      type: 'ASSAULT_VOID_ANCHOR';
      anchorId: string;
      fleetId: string;
    }
  | {
      type: 'ASSAULT_VOID_RIFT';
      fleetId: string;
    }
  | {
      type: 'TRIGGER_CRISIS_TEST';
      epicenterSystemId?: string;
    }
  | {
      type: 'ADOPT_TRADITION';
      treeId: TraditionTreeId;
      tier: TraditionTier;
    }
  | {
      type: 'SELECT_ASCENSION_PERK';
      perkId: AscensionPerkId;
    }
  | {
      type: 'EXCAVATE_SITE';
      siteId: string;
      fleetId: string;
    }
  | {
      type: 'ABANDON_EXCAVATION';
      siteId: string;
    }
  | {
      type: 'RESOLVE_ARCHAEOLOGY_CHOICE';
      siteId: string;
      choiceIndex: number;
    }
  | {
      type: 'ACTIVATE_RELIC_TRIUMPH';
      relicId: EmpireArtifactId;
    }
  | {
      type: 'REVERSE_ENGINEER_ARTIFACTS';
      actionType: 'tech_boost' | 'cultural_festival';
      targetPlanetId?: string;
    }
  | {
      type: 'START_TERRAFORMING';
      planetId: string;
      targetBiome: PlanetBiome;
    }
  | {
      type: 'CANCEL_TERRAFORMING';
      planetId: string;
    }
  | {
      type: 'ENACT_PLANETARY_DECISION';
      planetId: string;
      decisionId: PlanetaryDecisionId;
    }
  | {
      type: 'CLEAR_PLANETARY_BLOCKER';
      planetId: string;
      blockerId: string;
    };

export interface CommandReceipt {
  success: boolean;
  commandType: string;
  error?: string;
  timeMs: number;
  data?: Record<string, unknown>;
}
