import {
  BUILDING_STATS,
  calculateHourlyProduction,
  DEFENSE_STATS,
  GAME_CONSTANTS,
  getBuildingUpgradeCost,
  getBuildingUpgradeDurationMs,
  getDefenseBuildDurationMs,
  getResearchCost,
  getResearchDurationMs,
  getShipBuildDurationMs,
  RESEARCH_STATS,
  SHIP_STATS,
} from './constants';
import { resolveCombat, CombatResult } from './combat';
import { addAdmiralXP, ADMIRAL_TRAITS } from './admirals';
import { EMPIRE_ARTIFACTS } from './artifacts';
import { calculateRouteInfo, checkInterceptionFeasibility } from './flight';
import { filterGameStateForPlayer, PlayerVisibleState } from './fog';
import { PRNG } from './prng';
import {
  Admiral,
  BuildingType,
  CommandReceipt,
  DefenseStructureType,
  EspionageOp,
  EspionageOpType,
  EspionageReport,
  Fleet,
  FleetDoctrine,
  GameCommand,
  GameEventRecord,
  GameState,
  MarketState,
  MarketTransaction,
  Planet,
  Player,
  RadioTransmission,
  ResearchType,
  ResourceType,
  Resources,
  ScheduledEvent,
  SectorEvent,
  SectorEventType,
  SenateResolution,
  SenateResolutionType,
  SenateState,
  SenateVote,
  ShipType,
  Starbase,
  StarbaseModuleType,
  StarbaseTier,
  TransmissionType,
  VictoryRecord,
  VictoryType,
  Megastructure,
  MegastructureType,
  Gateway,
  GatewayStatus,
  CouncilLeader,
  CouncilPosition,
  FactionType,
  ImperialCouncilState,
} from './types';
import {
  MEGASTRUCTURE_CONFIGS,
  GATEWAY_CONFIG,
  getPlayerMegastructureBonuses,
  canBuildMegastructure,
} from './megastructures';
import {
  COUNCIL_CONSTANTS,
  COUNCIL_POSITION_INFO,
  LEADER_TRAIT_CONFIGS,
  addLeaderXP,
  calculateEmpireStability,
  createDefaultImperialCouncil,
  evaluateFactionApproval,
  generateLeaderCandidates,
  getCouncilEmpireBonuses,
} from './council';
import {
  calculateDiplomaticWeight,
  createInitialSenateState,
  isPlayerSanctioned,
  SENATE_CONSTANTS,
  SENATE_RESOLUTION_CONFIG,
  tallySenateVotes,
} from './senate';
import {
  createStarbase,
  getNextStarbaseTier,
  STARBASE_MODULE_CONFIG,
  STARBASE_TIER_CONFIG,
  getStarbaseEffectiveStats,
} from './starbases';
import { createHomeworldPlanet, generateSectorMap } from './universe';
import { evaluatePlayerDirectives } from './directives';
import {
  generateSectorCrisis,
  applySectorCrisisStart,
  applySectorCrisisEnd,
  getRouteCrisisModifiers,
} from './events';
import {
  DEFAULT_LOADOUTS,
  WEAPON_MODULES,
  DEFENSE_MODULES,
  UTILITY_MODULES,
  getModifiedShipStats,
  calculateRefitCost,
} from './shipDesign';
import {
  CRISIS_CONFIGS,
  initializeGalacticCrisis,
  tickGalacticCrisis,
  purifyInfestedPlanet,
  donateShipsToGDF,
  dispatchGDFFleet,
  resolveVoidAnchorAssault,
  resolveVoidRiftAssault,
} from './crisis';
import {
  TRADITION_CONFIGS,
  initializeEmpireTraditions,
  calculatePlayerUnityRate,
  hasTradition,
  hasAscensionPerk,
  adoptTradition,
  selectAscensionPerk,
  getTraditionCombatMultiplier,
  getTraditionProductionMultiplier,
  getTraditionBuildingCostModifier,
  getTraditionShipyardTimeModifier,
  getTraditionBuildingTimeModifier,
  getTraditionStorageCapMultiplier,
} from './traditions';
import {
  initializeSectorArchaeologySites,
  canExcavateSite,
  startSiteExcavation,
  abandonSiteExcavation,
  resolveSiteChoice,
  tickArchaeologySites,
  canActivateRelicTriumph,
  activateRelicTriumph,
  hasActiveRelicTriumph,
  canReverseEngineer,
  reverseEngineerArtifacts,
  getRelicConstructionMultiplier,
  getRelicSpeedMultiplier,
  getRelicFuelCostMultiplier,
  getRelicSensorBonus,
  getRelicDiplomaticWeightMultiplier,
  RELIC_TRIUMPH_CONFIGS,
} from './archaeology';
import {
  BIOME_CONFIGS,
  PLANETARY_BLOCKERS,
  PLANETARY_DECISIONS,
  TERRAFORM_RECIPES,
  canClearBlocker,
  canEnactDecision,
  canStartTerraforming,
  cancelTerraforming,
  enactDecision,
  generateInitialBlockers,
  getPlanetEcologyModifiers,
  getPlanetEffectiveBiome,
  startClearBlocker,
  startTerraforming,
  tickBlockers,
  tickDecisions,
  tickTerraforming,
} from './terraforming';
import {
  TRADE_POLICY_CONFIGS,
  updateTradeNetworks,
  calculatePlanetTradeValue,
} from './trade';
import {
  WAR_GOAL_CONFIGS,
  SUBJECT_TYPE_CONFIGS,
  isAtWar,
  getActiveWarsForPlayer,
  getSubjectAgreement,
  getPlayerSubjects,
  recordBattleWarExhaustion,
  updateWarsAndSubjects,
  declareWar,
  offerPeace,
  setSubjectTerms,
  releaseSubject,
  integrateSubject,
} from './wars';
import {
  FEDERATION_TYPE_CONFIGS,
  getPlayerFederation,
  isFederationAlly,
  getFederalFleetPower,
  calculateCompositeTechLevels,
  calculateFederalFleetCapacity,
  formFederation,
  inviteToFederation,
  respondFederationInvite,
  leaveFederation,
  proposeFederationLaw,
  voteFederationLaw,
  assignFederationEnvoys,
  buildFederalShip,
  dispatchFederalFleet,
  updateFederations,
} from './federations';
import {
  updateEspionageNetworks,
  establishSpyNetwork,
  recallSpyNetwork,
  assignSpymasterEnvoy,
  acquireSpyAsset,
  launchCovertOperation,
  cancelCovertOperation,
  setCounterEspionageStance,
} from './espionage';
import {
  updateMegacorpAndFutures,
  establishBranchOffice,
  closeBranchOffice,
  buildCorporateHolding,
  dismantleCorporateHolding,
  purchaseCommodityFutures,
  claimCommodityFutures,
  convertToMegacorp,
} from './megacorp';
import {
  updateColossi,
  buildColossus,
  moveColossus,
  commenceColossusCharging,
  cancelColossusFiring,
  refitColossusWeapon,
  dismantleColossus,
} from './colossus';
import {
  SYNTHETIC_CONSTANTS,
  assembleSyntheticPop,
  dismantleSyntheticPop,
  setAIPolicy,
  initiateSyntheticAscension,
  suppressSyntheticUprising,
  convertToMachineWorld,
  updateSynthetics,
  getPlanetSyntheticBoosts,
} from './synthetics';
import {
  initializeGalacticParagons,
  canRecruitParagon,
  recruitParagon,
  assignParagon,
  unassignParagon,
  dismissParagon,
  commissionParagonFlagship,
  getPlayerParagonBonuses,
  getFleetParagonBonuses,
  updateParagons,
  PARAGON_CONSTANTS,
} from './paragons';
import {
  HYPER_RELAY_CONFIG,
  HYPER_RELAY_POLICY_CONFIGS,
  canConstructHyperRelay,
  constructHyperRelay,
  setHyperRelayPolicy,
  dismantleHyperRelay,
  getActiveHyperRelaySystemIds,
  isHyperRelayNetworkLink,
  updateHyperRelays,
  getHyperRelaySystemBonuses,
} from './hyperRelays';
import {
  getOrCreateDirectorate,
  canUpgradeDirectorate,
  upgradeDirectorate,
  canRecruitAgent,
  recruitAgent,
  assignAgent,
  dismissAgent,
  canLaunchShadowOp,
  launchShadowOp,
  updateShadowOps,
  DIRECTORATE_TIER_CONFIGS,
  SHADOW_OP_CONFIGS,
  SECRET_AGENT_TRAIT_CONFIGS,
} from './shadowOps';
import {
  ARMY_CONFIGS,
  BOMBARDMENT_CONFIGS,
  canRecruitArmy,
  startRecruitArmy,
  canEmbarkArmies,
  embarkArmies,
  canLandArmies,
  landArmies,
  setBombardmentStance,
  dismissArmy,
  liberatePlanet,
  updateGroundWarfare,
} from './groundWarfare';

export class GameEngine {
  public state: GameState;
  private scheduledEvents: ScheduledEvent[] = [];
  private prng: PRNG;
  private lastMarketUpdateMs: number = 0;
  private lastSectorEventSpawnMs: number = 0;
  private lastUnityUpdateMs: number = 0;
  private lastArchaeologyTickMs: number = 0;
  private lastTradeTickMs: number = 0;
  private lastWarTickMs: number = 0;
  private lastFederationTickMs: number = 0;
  private lastEspionageTickMs: number = 0;
  private lastMegacorpTickMs: number = 0;
  private lastColossusTickMs: number = 0;
  private lastSyntheticsTickMs: number = 0;
  private lastParagonsTickMs: number = 0;
  private lastHyperRelaysTickMs: number = 0;
  private lastShadowOpsTickMs: number = 0;
  private lastGroundWarfareTickMs: number = 0;

  constructor(initialSeed: number = 42) {
    this.prng = new PRNG(initialSeed);
    const map = generateSectorMap({ seed: initialSeed });

    this.state = {
      timeMs: 0,
      seed: initialSeed,
      map,
      players: {},
      planets: {},
      fleets: {},
      admirals: {},
      starbases: {},
      megastructures: {},
      gateways: {},
      hyperRelays: {},
      intelligenceDirectorates: {},
      secretAgents: {},
      shadowOperations: {},
      armies: {},
      groundBattles: {},
      senate: createInitialSenateState(),
      councils: {},
      shipLoadouts: {},
      crisis: null,
      traditions: {},
      archaeologySites: initializeSectorArchaeologySites(map.systems),
      activeRelicTriumphs: {},
      tradeStates: {},
      systemTrade: {},
      wars: {},
      subjects: {},
      federations: {},
      sectorEvents: {},
      transmissions: {},
      truces: {},
      relay: {
        systemId: map.relaySystemId,
        controllingPlayerId: null,
        garrison: { scout: 2, transport: 0, fighter: 4, battleship: 1 },
        capturedAtTime: 0,
        weeklyPoints: {},
        sensorRadiusBonus: GAME_CONSTANTS.RELAY_SENSOR_RADIUS_BONUS,
      },
      alliances: {},
      market: {
        rates: { ore: 1.0, crystal: 1.6, fuel: 2.4 },
        baseRates: { ore: 1.0, crystal: 1.6, fuel: 2.4 },
        volume24h: { ore: 0, crystal: 0, fuel: 0 },
        baseFeeRate: 0.15,
        transactionHistory: [],
      },
      espionageOps: [],
      spyNetworks: {},
      covertOperations: {},
      branchOffices: {},
      commodityFutures: {},
      colossi: {},
      synthetics: {},
      paragons: {},
      galacticParagonPool: [],
      battleReports: [],
      eventLog: [],
      victory: null,
      seasonHistory: [],
      nextId: 100,
    };

    const { paragons: initialParagons, pool: initialPool } = initializeGalacticParagons();
    this.state.paragons = initialParagons;
    this.state.galacticParagonPool = initialPool;

    // Spawn 1 ancient dormant gateway in a distant star system
    if (!this.state.gateways) this.state.gateways = {};
    const candidateSystems = Object.keys(map.systems).filter((sId) => sId !== map.relaySystemId);
    if (candidateSystems.length > 0) {
      const ancientGwSys = candidateSystems[candidateSystems.length - 1];
      this.state.gateways[ancientGwSys] = {
        id: `gw_ancient_${ancientGwSys}`,
        systemId: ancientGwSys,
        ownerId: null,
        status: 'dormant',
      };
    }

    // Schedule initial relay point tick
    this.scheduleEvent(GAME_CONSTANTS.RELAY_POINT_INTERVAL_MS, 'relay_point_tick', {});
  }

  /**
   * Generates a unique canonical key for a truce between two players
   */
  public getTruceKey(p1: string, p2: string): string {
    return [p1, p2].sort().join('_');
  }

  /**
   * Checks if an active truce/ceasefire exists between two players
   */
  public hasActiveTruce(p1: string, p2: string): boolean {
    if (!this.state.truces) return false;
    const key = this.getTruceKey(p1, p2);
    const exp = this.state.truces[key];
    return exp !== undefined && this.state.timeMs < exp;
  }

  // --- Player Management ---
  public addPlayer(
    id: string,
    name: string,
    color: string,
    isBot: boolean = false,
    botArchetype?: Player['botArchetype'],
    enableProtection: boolean = true
  ): { player: Player; homeworld: Planet } {
    const player: Player = {
      id,
      name,
      color,
      isBot,
      botArchetype,
      allianceId: null,
      vacationMode: false,
      research: { engines: 0, weapons: 0, sensors: 0 },
      researchQueue: null,
      protectionUntilTime: !isBot && enableProtection ? this.state.timeMs + GAME_CONSTANTS.PROTECTION_DURATION_MS : 0,
      intel: {
        discoveredSystems: {},
        lastSeenFleets: {},
      },
      espionageReports: [],
      artifacts: [],
      minorArtifacts: 0,
      relicCooldowns: {},
      tradePolicy: 'energy_wealth',
      commercialPacts: [],
      overlordId: null,
      subjects: [],
      federationId: null,
      assignedFederationEnvoys: 0,
      counterEspionageStance: 'relaxed',
      isMegacorp: false,
      corporateCivics: [],
      branchOfficesCount: 0,
      colossusId: null,
      hasColossusProject: false,
      renown: 100,
      paragonIds: [],
    };

    // Pick an empty system for homeworld (not relay)
    const availableSystems = Object.values(this.state.map.systems).filter(
      s => !s.hasRelay && s.slots.some(slot => slot.ownerId === null)
    );

    const targetSys = this.prng.choice(availableSystems);
    const emptySlot = targetSys.slots.find(slot => slot.ownerId === null)!;

    const planetId = `planet_hw_${id}`;
    const homeworld = createHomeworldPlanet(
      planetId,
      `${name} Ana Gezegeni`,
      targetSys.id,
      emptySlot.slotIndex,
      id,
      this.state.timeMs
    );

    emptySlot.ownerId = id;
    emptySlot.planetId = planetId;
    this.state.players[id] = player;
    this.state.planets[planetId] = homeworld;

    // Player discovers their own system immediately
    player.intel.discoveredSystems[targetSys.id] = 'full';

    // Initialize starter starbase in homeworld system
    if (!this.state.starbases) {
      this.state.starbases = {};
    }
    if (!this.state.starbases[targetSys.id]) {
      this.state.starbases[targetSys.id] = createStarbase(targetSys.id, id, 'outpost', this.state.timeMs);
    }

    // Initialize starter admirals
    if (!this.state.admirals) {
      this.state.admirals = {};
    }
    const adm1Id = `admiral_${id}_1`;
    this.state.admirals[adm1Id] = {
      id: adm1Id,
      ownerId: id,
      name: isBot ? `${name} Filo Komutanı` : 'Kaelen Valerius',
      title: 'Filo Amirali',
      avatar: '👨‍✈️',
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      traitId: isBot && botArchetype === 'raider' ? 'tactical_genius' : isBot && botArchetype === 'guardian' ? 'iron_discipline' : 'tactical_genius',
      assignedFleetId: null,
      assignedPlanetId: null,
      battlesWon: 0,
      battlesLost: 0,
      recruitedAt: this.state.timeMs,
    };
    if (!isBot) {
      const adm2Id = `admiral_${id}_2`;
      this.state.admirals[adm2Id] = {
        id: adm2Id,
        ownerId: id,
        name: 'Lyra Solari',
        title: 'Kıdemli Taktik Komutanı',
        avatar: '👩‍✈️',
        level: 1,
        xp: 0,
        xpToNextLevel: 200,
        traitId: 'iron_discipline',
        assignedFleetId: null,
        assignedPlanetId: null,
        battlesWon: 0,
        battlesLost: 0,
        recruitedAt: this.state.timeMs,
      };
    }

    // Initialize starter imperial council and factions (Phase 14)
    if (!this.state.councils) {
      this.state.councils = {};
    }
    this.state.councils[id] = createDefaultImperialCouncil(id, name, botArchetype);

    // Initialize modular ship design loadouts (Phase 15)
    if (!this.state.shipLoadouts) {
      this.state.shipLoadouts = {};
    }
    this.state.shipLoadouts[id] = JSON.parse(JSON.stringify(DEFAULT_LOADOUTS));

    // Initialize Empire Traditions & Ascension Perks (Phase 17)
    if (!this.state.traditions) {
      this.state.traditions = {};
    }
    this.state.traditions[id] = initializeEmpireTraditions(id);

    // Initialize starter garrison defense army (Phase 30)
    if (!this.state.armies) {
      this.state.armies = {};
    }
    const starterMilitiaId = `army_${this.state.nextId++}`;
    this.state.armies[starterMilitiaId] = {
      id: starterMilitiaId,
      name: `${homeworld.name} Savunma Milisleri`,
      ownerId: id,
      type: 'defense_militia',
      rank: 'recruit',
      experience: 0,
      health: 120,
      maxHealth: 120,
      morale: 90,
      maxMorale: 90,
      attackPower: 14,
      defensePower: 28,
      planetId: homeworld.id,
      fleetId: null,
      isDisrouted: false,
      isGarrisonOnly: true,
      recruitedAtMs: this.state.timeMs,
    };

    this.logEvent('player_joined', `${name} galaksiye katıldı (${targetSys.name}).`, id);

    return { player, homeworld };
  }

  // --- Scheduled Event Queue ---
  private scheduleEvent(delayMs: number, type: ScheduledEvent['type'], payload: Record<string, unknown>) {
    const timeMs = this.state.timeMs + delayMs;
    this.scheduledEvents.push({
      id: `evt_${this.state.nextId++}`,
      timeMs,
      type,
      payload,
    });
    // Sort ascending by time
    this.scheduledEvents.sort((a, b) => a.timeMs - b.timeMs);
  }

  // --- Simulation Tick Execution ---
  public tick(deltaMs: number): void {
    const targetTime = this.state.timeMs + deltaMs;

    // Process all scheduled events up to targetTime in exact timestamp order
    while (this.scheduledEvents.length > 0 && this.scheduledEvents[0].timeMs <= targetTime) {
      const nextEvent = this.scheduledEvents.shift()!;
      this.state.timeMs = nextEvent.timeMs;
      this.processScheduledEvent(nextEvent);
    }

    this.state.timeMs = targetTime;
    this.updatePassiveProduction(targetTime);
    this.evaluateVictoryConditions();
  }

  public advanceTo(targetTime: number): void {
    if (targetTime <= this.state.timeMs) return;
    this.tick(targetTime - this.state.timeMs);
  }

  // --- Passive Resource & Production Accumulator ---
  private updatePassiveProduction(nowMs: number): void {
    for (const planet of Object.values(this.state.planets)) {
      const owner = this.state.players[planet.ownerId];
      if (owner?.vacationMode) {
        planet.lastResourceUpdate = nowMs;
        continue;
      }

      const elapsedMs = nowMs - planet.lastResourceUpdate;
      if (elapsedMs <= 0) continue;

      const elapsedHours = elapsedMs / (3600 * 1000);

      let oreProd = calculateHourlyProduction('ore', planet.buildings.ore_mine);
      let crystalProd = calculateHourlyProduction('crystal', planet.buildings.crystal_synth);
      let fuelProd = calculateHourlyProduction('fuel', planet.buildings.fuel_refinery);

      if (planet.specialization === 'mining_hub') {
        oreProd *= 1.20;
        crystalProd *= 1.20;
        fuelProd *= 1.20;
      }

      if (this.isSenateResolutionActive('military_readiness')) {
        oreProd *= (1 - SENATE_CONSTANTS.MILITARY_READINESS_CIVILIAN_PROD_PENALTY_PERCENT);
        crystalProd *= (1 - SENATE_CONSTANTS.MILITARY_READINESS_CIVILIAN_PROD_PENALTY_PERCENT);
        fuelProd *= (1 - SENATE_CONSTANTS.MILITARY_READINESS_CIVILIAN_PROD_PENALTY_PERCENT);
      }

      // Starbase Trade Hub bonus: +15% per trade_hub module in system (+25% if free_trade active)
      const sysStarbase = this.state.starbases?.[planet.systemId];
      if (sysStarbase && sysStarbase.ownerId === planet.ownerId) {
        const tradeHubs = sysStarbase.modules.filter((m) => m === 'trade_hub').length;
        if (tradeHubs > 0) {
          const perHubBonus = this.isSenateResolutionActive('free_trade')
            ? SENATE_CONSTANTS.FREE_TRADE_STARBASE_HUB_BONUS
            : 0.15;
          const tradeMultiplier = 1 + tradeHubs * perHubBonus;
          oreProd *= tradeMultiplier;
          crystalProd *= tradeMultiplier;
          fuelProd *= tradeMultiplier;
        }
      }

      // Megastructure Dyson Swarm passive resource contribution to homeworld
      if (planet.isHomeworld) {
        const megaBonuses = getPlayerMegastructureBonuses(this.state, planet.ownerId);
        oreProd += megaBonuses.passiveHourlyResources.ore;
        crystalProd += megaBonuses.passiveHourlyResources.crystal;
        fuelProd += megaBonuses.passiveHourlyResources.fuel;
      }

      // Imperial Council & Faction Stability production modifier (Phase 14)
      const councilBonuses = getCouncilEmpireBonuses(this.state, planet.ownerId);
      if (councilBonuses.resourceProductionMultiplier !== 1.0) {
        oreProd *= councilBonuses.resourceProductionMultiplier;
        crystalProd *= councilBonuses.resourceProductionMultiplier;
        fuelProd *= councilBonuses.resourceProductionMultiplier;
      }

      // Void Incursion Infestation Penalty (-50% production due to dark void blight)
      if (this.state.crisis?.infestedPlanetIds?.includes(planet.id)) {
        oreProd *= 0.50;
        crystalProd *= 0.50;
        fuelProd *= 0.50;
      }

      // Traditions & Ascension Perks production modifier (Phase 17)
      const traditionProdMult = getTraditionProductionMultiplier(this.state, planet.ownerId);
      if (traditionProdMult !== 1.0) {
        oreProd *= traditionProdMult;
        crystalProd *= traditionProdMult;
      }

      // Planetary Terraforming, Blockers & Decisions (Phase 19)
      const sys = this.state.map.systems[planet.systemId];
      const slot = sys?.slots.find((s) => s.planetId === planet.id || s.slotIndex === planet.slotIndex);

      // 1. Process active terraforming
      if (planet.terraformingQueue) {
        const tfResult = tickTerraforming(planet, slot, nowMs);
        if (tfResult.completed && tfResult.targetBiome) {
          const biomeCfg = BIOME_CONFIGS[tfResult.targetBiome];
          this.logEvent(
            'terraforming_completed',
            `🌱 GEZEGEN ISLAHI TAMAMLANDI: ${planet.name} başarıyla ${biomeCfg.nameTr} dünyasına dönüştürüldü!`,
            planet.ownerId,
            { planetId: planet.id, newBiome: tfResult.targetBiome }
          );
        }
      }

      // 2. Process active decisions (expire timed boosters)
      const expiredDecs = tickDecisions(planet, nowMs);
      for (const expId of expiredDecs) {
        const decDef = PLANETARY_DECISIONS[expId];
        this.logEvent(
          'decision_expired',
          `${planet.name} üzerindeki "${decDef?.nameTr || expId}" kararının süresi sona erdi.`,
          planet.ownerId,
          { planetId: planet.id, decisionId: expId }
        );
      }

      // 3. Process blocker clearing
      if (planet.blockers && planet.blockers.length > 0) {
        const blkResult = tickBlockers(planet, nowMs);
        for (const clrId of blkResult.clearedBlockerIds) {
          this.logEvent(
            'blocker_cleared',
            `⛏️ YÜZEY ENGELİ TEMİZLENDİ: ${planet.name} üzerindeki engel kaldırıldı. Geri dönüştürülen kaynaklar depoya aktarıldı.`,
            planet.ownerId,
            { planetId: planet.id, blockerId: clrId }
          );
        }
      }

      // 4. Apply ecological multipliers (Biome + Decisions + Blockers)
      const ecology = getPlanetEcologyModifiers(planet, slot);
      oreProd *= ecology.oreMultiplier;
      crystalProd *= ecology.crystalMultiplier;
      fuelProd *= ecology.fuelMultiplier;

      // 5. Apply Synthetic Pops & Ascension multipliers (Phase 26)
      const synthState = this.state.synthetics?.[planet.ownerId];
      const synthBoosts = getPlanetSyntheticBoosts(planet, synthState);
      oreProd *= synthBoosts.oreMultiplier;
      crystalProd *= synthBoosts.crystalMultiplier;
      fuelProd *= synthBoosts.fuelMultiplier;

      // 6. Apply Paragon Leader & Governor multipliers (Phase 27)
      const paragonBonuses = getPlayerParagonBonuses(this.state, planet.ownerId);
      oreProd *= paragonBonuses.oreMultiplier;
      crystalProd *= paragonBonuses.crystalMultiplier;
      fuelProd *= paragonBonuses.fuelMultiplier;

      // 7. Apply Devastation penalty & Occupation tribute (Phase 30)
      if (planet.devastation && planet.devastation > 0) {
        const devMultiplier = Math.max(0.1, 1 - (planet.devastation / 100) * 0.9);
        oreProd *= devMultiplier;
        crystalProd *= devMultiplier;
        fuelProd *= devMultiplier;
      }

      // If planet is occupied by foreign force, 50% tribute goes to occupier homeworld
      if (planet.occupierId && planet.occupierId !== planet.ownerId) {
        const occupierHomeworld = Object.values(this.state.planets).find(
          (p) => p.ownerId === planet.occupierId && p.isHomeworld
        );
        if (occupierHomeworld) {
          const tributeOre = oreProd * 0.5 * elapsedHours;
          const tributeCrystal = crystalProd * 0.5 * elapsedHours;
          const tributeFuel = fuelProd * 0.5 * elapsedHours;
          occupierHomeworld.resources.ore = Math.min(
            occupierHomeworld.storageCap,
            occupierHomeworld.resources.ore + tributeOre
          );
          occupierHomeworld.resources.crystal = Math.min(
            occupierHomeworld.storageCap,
            occupierHomeworld.resources.crystal + tributeCrystal
          );
          occupierHomeworld.resources.fuel = Math.min(
            occupierHomeworld.storageCap,
            occupierHomeworld.resources.fuel + tributeFuel
          );
        }
        oreProd *= 0.5;
        crystalProd *= 0.5;
        fuelProd *= 0.5;
      }

      const traditionStorageCapMult = getTraditionStorageCapMultiplier(this.state, planet.ownerId);
      const effectiveCap = Math.round(planet.storageCap * traditionStorageCapMult);

      planet.resources.ore = Math.min(
        effectiveCap,
        planet.resources.ore + oreProd * elapsedHours
      );
      planet.resources.crystal = Math.min(
        effectiveCap,
        planet.resources.crystal + crystalProd * elapsedHours
      );
      planet.resources.fuel = Math.min(
        effectiveCap,
        planet.resources.fuel + fuelProd * elapsedHours
      );

      planet.lastResourceUpdate = nowMs;

      // Process Shipyard Queue
      this.processPlanetShipyardQueue(planet, nowMs);

      // Process Defense Installation Queue
      this.processPlanetDefenseQueue(planet, nowMs);
    }

    // Cultural Unity accumulation (Phase 17)
    if (!this.state.traditions) {
      this.state.traditions = {};
    }
    const elapsedUnityMs = nowMs - this.lastUnityUpdateMs;
    if (elapsedUnityMs > 0) {
      const elapsedUnityHours = elapsedUnityMs / (3600 * 1000);
      this.lastUnityUpdateMs = nowMs;
      for (const [pId, player] of Object.entries(this.state.players)) {
        if (player.vacationMode) continue;
        if (!this.state.traditions[pId]) {
          this.state.traditions[pId] = initializeEmpireTraditions(pId);
        }
        const traditions = this.state.traditions[pId];
        const rate = calculatePlayerUnityRate(this.state, pId);
        traditions.unityRatePerHour = rate;
        traditions.unity += rate * elapsedUnityHours;
      }
    }

    // Market mean reversion: rates gradually drift towards base rates (5% per hour)
    if (this.state.market && this.state.market.rates && this.state.market.baseRates) {
      if (this.lastMarketUpdateMs === 0) {
        this.lastMarketUpdateMs = nowMs;
      } else {
        const elapsedMarketHours = (nowMs - this.lastMarketUpdateMs) / (3600 * 1000);
        if (elapsedMarketHours >= 0.02) { // update at least every ~1-2 sim minutes
          this.lastMarketUpdateMs = nowMs;
          for (const res of ['ore', 'crystal', 'fuel'] as ResourceType[]) {
            const base = this.state.market.baseRates[res];
            const current = this.state.market.rates[res];
            this.state.market.rates[res] = Number((current + (base - current) * 0.05 * Math.min(2, elapsedMarketHours)).toFixed(3));
          }
        }
      }
    }

    // Update internal factions & imperial stability periodically (Phase 14)
    if (this.state.councils) {
      for (const [pId, council] of Object.entries(this.state.councils)) {
        const approval = evaluateFactionApproval(this.state, pId);
        for (const [fType, score] of Object.entries(approval)) {
          if (council.factions[fType as FactionType]) {
            council.factions[fType as FactionType].approvalRating = score;
            if (score >= 75) council.factions[fType as FactionType].status = 'pleased';
            else if (score >= 55) council.factions[fType as FactionType].status = 'content';
            else if (score >= 35) council.factions[fType as FactionType].status = 'discontent';
            else council.factions[fType as FactionType].status = 'rebellious';
          }
        }
        council.stabilityPercent = calculateEmpireStability(this.state, pId);
        const bonuses = getCouncilEmpireBonuses(this.state, pId);
        council.resourceProductionMultiplier = bonuses.resourceProductionMultiplier;
      }
    }

    // Check and spawn procedural sector crises & dynamic events
    if (this.lastSectorEventSpawnMs === 0) {
      this.lastSectorEventSpawnMs = nowMs;
    } else if (nowMs - this.lastSectorEventSpawnMs >= 20 * 60 * 1000) {
      this.lastSectorEventSpawnMs = nowMs;
      this.spawnProceduralSectorCrisis(nowMs);
    }

    // Check expiration of active sector events
    if (this.state.sectorEvents) {
      for (const evt of Object.values(this.state.sectorEvents)) {
        if (!evt.resolved && nowMs >= evt.expiresAtMs) {
          evt.resolved = true;
          applySectorCrisisEnd(this.state, evt);
          this.logEvent('sector_event_expired', `Sektör Olayı Sona Erdi: ${evt.title}`);
        }
      }
    }

    // Process Galactic Crisis simulation tick (Phase 16)
    if (this.state.crisis) {
      tickGalacticCrisis(this.state, nowMs);
    }

    // Archaeology sites and relic triumphs tick (Phase 18)
    const archaeologyElapsedMs = Math.max(0, nowMs - this.lastArchaeologyTickMs);
    this.lastArchaeologyTickMs = nowMs;
    if (archaeologyElapsedMs > 0) {
      tickArchaeologySites(this.state, nowMs, archaeologyElapsedMs, (type: string, desc: string, pId?: string, meta?: Record<string, unknown>) => {
        this.logEvent(type, desc, pId, meta);
      });
    }

    // Galactic Trade Networks & Piracy tick (Phase 20)
    const tradeElapsedMs = Math.max(0, nowMs - this.lastTradeTickMs);
    this.lastTradeTickMs = nowMs;
    if (tradeElapsedMs > 0) {
      updateTradeNetworks(this.state, tradeElapsedMs);
    }

    // Wars, War Exhaustion & Subject Tithes tick (Phase 21)
    const warElapsedMs = Math.max(0, nowMs - this.lastWarTickMs);
    this.lastWarTickMs = nowMs;
    if (warElapsedMs > 0) {
      updateWarsAndSubjects(this.state, warElapsedMs);
    }

    // Galactic Federations & Federal Fleets tick (Phase 22)
    const fedElapsedMs = Math.max(0, nowMs - this.lastFederationTickMs);
    this.lastFederationTickMs = nowMs;
    if (fedElapsedMs > 0) {
      updateFederations(this.state, fedElapsedMs);
    }

    // Covert Infiltration & Espionage Networks tick (Phase 23)
    const espElapsedMs = Math.max(0, nowMs - this.lastEspionageTickMs);
    this.lastEspionageTickMs = nowMs;
    if (espElapsedMs > 0) {
      updateEspionageNetworks(this.state, espElapsedMs);
    }

    // Megacorporations, Branch Offices & Commodity Futures tick (Phase 24)
    const megacorpElapsedMs = Math.max(0, nowMs - this.lastMegacorpTickMs);
    this.lastMegacorpTickMs = nowMs;
    if (megacorpElapsedMs > 0) {
      updateMegacorpAndFutures(this.state, megacorpElapsedMs);
    }

    // Colossus Superweapons & World Killers tick (Phase 25)
    const colossusElapsedMs = Math.max(0, nowMs - this.lastColossusTickMs);
    this.lastColossusTickMs = nowMs;
    if (colossusElapsedMs > 0) {
      updateColossi(this.state, colossusElapsedMs);
    }

    // Synthetic Dawn, Cybernetic Ascension & Machine Uprisings tick (Phase 26)
    const syntheticsElapsedMs = Math.max(0, nowMs - this.lastSyntheticsTickMs);
    this.lastSyntheticsTickMs = nowMs;
    if (syntheticsElapsedMs > 0) {
      updateSynthetics(this.state, syntheticsElapsedMs);
    }

    // Paragon Leaders, Renowned Heroes & Council Destiny tick (Phase 27)
    const paragonsElapsedMs = Math.max(0, nowMs - this.lastParagonsTickMs);
    this.lastParagonsTickMs = nowMs;
    if (paragonsElapsedMs > 0) {
      updateParagons(this.state, paragonsElapsedMs);
    }

    // Hyper Relays, Transit Highway Networks & Subspace Logistics tick (Phase 28)
    const hyperRelaysElapsedMs = Math.max(0, nowMs - this.lastHyperRelaysTickMs);
    this.lastHyperRelaysTickMs = nowMs;
    if (hyperRelaysElapsedMs > 0) {
      updateHyperRelays(this.state, hyperRelaysElapsedMs);
    }

    // Galactic Intelligence Directorate, False Flag Operations & Shadow Coups tick (Phase 29)
    const shadowOpsElapsedMs = Math.max(0, nowMs - this.lastShadowOpsTickMs);
    this.lastShadowOpsTickMs = nowMs;
    if (shadowOpsElapsedMs > 0) {
      updateShadowOps(this.state, shadowOpsElapsedMs);
    }

    // Planetary Invasions, Ground Armies & Orbital Bombardment tick (Phase 30)
    const groundWarfareElapsedMs = Math.max(0, nowMs - this.lastGroundWarfareTickMs);
    this.lastGroundWarfareTickMs = nowMs;
    if (groundWarfareElapsedMs > 0) {
      updateGroundWarfare(this.state, groundWarfareElapsedMs, (type, desc, pId, meta) => {
        this.logEvent(type, desc, pId, meta);
      });
    }
  }

  public spawnProceduralSectorCrisis(nowMs: number = this.state.timeMs): SectorEvent | null {
    if (!this.state.sectorEvents) {
      this.state.sectorEvents = {};
    }
    const activeCount = Object.values(this.state.sectorEvents).filter(
      (e) => !e.resolved && nowMs < e.expiresAtMs
    ).length;

    if (activeCount >= 2) return null;

    const crisis = generateSectorCrisis(this.state, this.prng, nowMs);
    if (!crisis) return null;

    this.state.sectorEvents[crisis.id] = crisis;
    applySectorCrisisStart(this.state, crisis);
    this.scheduleEvent(crisis.durationMs, 'sector_event_expiry', { eventId: crisis.id });

    this.logEvent(
      'galactic_crisis',
      `🚨 GALAKTİK OLAY: ${crisis.title} — ${crisis.description}`,
      undefined,
      { crisisId: crisis.id, systemId: crisis.systemId, type: crisis.type }
    );

    return crisis;
  }

  private processPlanetShipyardQueue(planet: Planet, nowMs: number) {
    if (planet.shipyardQueue.length === 0) return;

    const currentOrder = planet.shipyardQueue[0];
    while (currentOrder && nowMs >= currentOrder.nextUnitFinishTime && currentOrder.completed < currentOrder.count) {
      currentOrder.completed++;
      planet.garrison[currentOrder.shipType]++;

      this.logEvent(
        'ship_built',
        `${planet.name} tersanesinde 1x ${SHIP_STATS[currentOrder.shipType].nameTr} tamamlandı.`,
        planet.ownerId
      );

      if (currentOrder.completed < currentOrder.count) {
        currentOrder.nextUnitFinishTime += currentOrder.unitBuildTimeMs;
      } else {
        planet.shipyardQueue.shift();
        if (planet.shipyardQueue.length > 0) {
          planet.shipyardQueue[0].nextUnitFinishTime = nowMs + planet.shipyardQueue[0].unitBuildTimeMs;
        }
        break;
      }
    }
  }

  private processPlanetDefenseQueue(planet: Planet, nowMs: number) {
    if (!planet.defenseQueue || planet.defenseQueue.length === 0) return;
    if (!planet.defenses) {
      planet.defenses = { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 };
    }

    const currentOrder = planet.defenseQueue[0];
    while (currentOrder && nowMs >= currentOrder.nextUnitFinishTime && currentOrder.completed < currentOrder.count) {
      currentOrder.completed++;
      planet.defenses[currentOrder.defenseType] = (planet.defenses[currentOrder.defenseType] || 0) + 1;

      const defenseName = DEFENSE_STATS[currentOrder.defenseType]?.nameTr || currentOrder.defenseType;
      this.logEvent(
        'defense_built',
        `${planet.name} yörüngesinde 1x ${defenseName} konuşlandırıldı.`,
        planet.ownerId
      );

      if (currentOrder.completed < currentOrder.count) {
        currentOrder.nextUnitFinishTime += currentOrder.unitBuildTimeMs;
      } else {
        planet.defenseQueue.shift();
        if (planet.defenseQueue.length > 0) {
          planet.defenseQueue[0].nextUnitFinishTime = nowMs + planet.defenseQueue[0].unitBuildTimeMs;
        }
        break;
      }
    }
  }

  // --- Scheduled Event Handler ---
  private processScheduledEvent(event: ScheduledEvent) {
    switch (event.type) {
      case 'building_completed': {
        const { planetId, buildingType, targetLevel } = event.payload as {
          planetId: string;
          buildingType: BuildingType;
          targetLevel: number;
        };
        const planet = this.state.planets[planetId];
        if (planet && planet.buildingQueue) {
          planet.buildings[buildingType] = targetLevel;
          planet.buildingQueue = null;

          // Update storage & protected limits
          planet.storageCap = GAME_CONSTANTS.BASE_STORAGE_CAP +
            (planet.buildings.ore_mine * GAME_CONSTANTS.STORAGE_CAP_PER_MINE_LEVEL);
          planet.protectedCapacity = GAME_CONSTANTS.BASE_PROTECTED_STORAGE +
            (planet.buildings.ore_mine * GAME_CONSTANTS.PROTECTED_STORAGE_PER_LEVEL);

          this.logEvent(
            'building_upgraded',
            `${planet.name}: ${BUILDING_STATS[buildingType].nameTr} Seviye ${targetLevel} tamamlandı.`,
            planet.ownerId
          );
        }
        break;
      }

      case 'research_completed': {
        const { playerId, researchType, targetLevel } = event.payload as {
          playerId: string;
          researchType: ResearchType;
          targetLevel: number;
        };
        const player = this.state.players[playerId];
        if (player && player.researchQueue) {
          player.research[researchType] = targetLevel;
          player.researchQueue = null;

          this.logEvent(
            'research_completed',
            `Araştırma tamamlandı: ${RESEARCH_STATS[researchType].nameTr} Seviye ${targetLevel}.`,
            playerId
          );
        }
        break;
      }

      case 'relay_point_tick': {
        if (this.state.relay.controllingPlayerId) {
          const pid = this.state.relay.controllingPlayerId;
          let pts = GAME_CONSTANTS.RELAY_POINTS_PER_TICK;
          if (this.state.councils?.[pid]) {
            const bonuses = getCouncilEmpireBonuses(this.state, pid);
            if (bonuses.rulerWeeklyHegemonyBonus > 0) {
              pts += Math.round(bonuses.rulerWeeklyHegemonyBonus / 10);
            }
          }
          this.state.relay.weeklyPoints[pid] = (this.state.relay.weeklyPoints[pid] || 0) + pts;
        }

        this.scheduleEvent(GAME_CONSTANTS.RELAY_POINT_INTERVAL_MS, 'relay_point_tick', {});
        this.evaluateVictoryConditions();
        break;
      }

      case 'fleet_arrival': {
        const { fleetId } = event.payload as { fleetId: string };
        const fleet = this.state.fleets[fleetId];
        if (!fleet || fleet.status === 'destroyed') return;

        this.handleFleetArrival(fleet);
        break;
      }

      case 'espionage_op_arrival': {
        const { opId } = event.payload as { opId: string };
        const op = this.state.espionageOps?.find(o => o.id === opId);
        if (!op || op.status === 'resolved') return;
        op.status = 'resolved';

        this.resolveEspionageOperation(op);
        break;
      }

      case 'sector_event_expiry': {
        const { eventId } = event.payload as { eventId: string };
        if (this.state.sectorEvents && this.state.sectorEvents[eventId]) {
          const evt = this.state.sectorEvents[eventId];
          if (!evt.resolved) {
            evt.resolved = true;
            applySectorCrisisEnd(this.state, evt);
            this.logEvent('sector_event_expired', `Sektör Olayı Sona Erdi: ${evt.title}`);
          }
        }
        break;
      }

      case 'starbase_upgraded': {
        const { systemId, targetTier } = event.payload as { systemId: string; targetTier: StarbaseTier };
        const sb = this.state.starbases?.[systemId];
        if (sb && sb.upgradeQueue) {
          sb.tier = targetTier;
          const cfg = STARBASE_TIER_CONFIG[targetTier];
          sb.maxHull = cfg.baseHull;
          sb.hull = cfg.baseHull;
          sb.maxShield = cfg.baseShield;
          sb.shield = cfg.baseShield;
          sb.upgradeQueue = null;

          const sysName = this.state.map.systems[systemId]?.name || systemId;
          this.logEvent(
            'starbase_upgraded',
            `${sysName} sistemindeki üs '${cfg.nameTr}' seviyesine yükseltildi.`,
            sb.ownerId,
            { systemId, tier: targetTier }
          );
        }
        break;
      }

      case 'starbase_module_completed': {
        const { systemId, moduleType } = event.payload as { systemId: string; moduleType: StarbaseModuleType };
        const sb = this.state.starbases?.[systemId];
        if (sb && sb.moduleQueue) {
          sb.modules.push(moduleType);
          sb.moduleQueue = null;

          const modCfg = STARBASE_MODULE_CONFIG[moduleType];
          const sysName = this.state.map.systems[systemId]?.name || systemId;
          this.logEvent(
            'starbase_module_installed',
            `${sysName} üssüne '${modCfg.nameTr}' modülü monte edildi.`,
            sb.ownerId,
            { systemId, moduleType }
          );
        }
        break;
      }

      case 'senate_session_concluded': {
        this.concludeSenateSession();
        break;
      }

      case 'megastructure_stage_completed': {
        const { megastructureId, targetStage } = event.payload as {
          megastructureId: string;
          targetStage: number;
        };
        const mega = this.state.megastructures?.[megastructureId];
        if (mega) {
          mega.stage = targetStage;
          mega.status = 'completed';
          const cfg = MEGASTRUCTURE_CONFIGS[mega.type];
          const stageCfg = cfg.stages[targetStage - 1];
          const sysName = this.state.map.systems[mega.systemId]?.name || mega.systemId;

          if (stageCfg?.hegemonyPointsReward) {
            this.state.relay.weeklyPoints[mega.ownerId] =
              (this.state.relay.weeklyPoints[mega.ownerId] || 0) + stageCfg.hegemonyPointsReward;
            this.evaluateVictoryConditions();
          }

          this.logEvent(
            'megastructure_stage_completed',
            `🏛️ MEGA YAPI TAMAMLANDI: ${sysName} sisteminde '${cfg.nameTr}' ${stageCfg?.nameTr || `Aşama ${targetStage}`} tamamlandı! (+${stageCfg?.hegemonyPointsReward || 0} Hegemonya Puanı)`,
            mega.ownerId,
            { megastructureId, stage: targetStage, type: mega.type }
          );
        }
        break;
      }

      case 'gateway_activated': {
        const { systemId } = event.payload as { systemId: string };
        const gw = this.state.gateways?.[systemId];
        if (gw) {
          gw.status = 'active';
          const sysName = this.state.map.systems[systemId]?.name || systemId;

          if (gw.ownerId) {
            this.state.relay.weeklyPoints[gw.ownerId] =
              (this.state.relay.weeklyPoints[gw.ownerId] || 0) + GATEWAY_CONFIG.GATEWAY_HEGEMONY_REWARD;
            this.evaluateVictoryConditions();
          }

          this.logEvent(
            'gateway_online',
            `🌀 ALT-UZAY AĞ GEÇİDİ AKTİF: ${sysName} sistemindeki Ağ Geçidi devreye girdi! Galaktik transit ağına bağlandı.`,
            gw.ownerId || undefined,
            { systemId }
          );
        }
        break;
      }

      case 'crisis_tick': {
        if (this.state.crisis) {
          tickGalacticCrisis(this.state, this.state.timeMs);
          this.scheduleEvent(CRISIS_CONFIGS.CRISIS_TICK_INTERVAL_MS, 'crisis_tick', {});
        }
        break;
      }

      case 'crisis_breached': {
        if (this.state.crisis && this.state.crisis.stage === 'breaching') {
          this.state.crisis.stage = 'active';
          this.logEvent(
            'crisis_breached',
            '🚨 BOYUTLARARASI HİÇLİK YARIĞI AÇILDI! Hiçlik Çıpaları galaksiyi kilitledi!'
          );
        }
        break;
      }
    }
  }

  /**
   * Concludes the active Senate session, tallies votes, enacts resolutions, and logs history
   */
  private concludeSenateSession(): void {
    if (!this.state.senate?.currentSession) return;
    const session = this.state.senate.currentSession;
    const tally = tallySenateVotes(this.state, session);
    const cfg = SENATE_RESOLUTION_CONFIG[session.type];

    session.status = tally.passed ? 'passed' : 'failed';

    if (tally.passed) {
      // Remove any prior active instance of same resolution or sanctions on same player
      this.state.senate.activeResolutions = this.state.senate.activeResolutions.filter((r) => {
        if (session.type === 'sanctions') {
          return !(r.resolutionType === 'sanctions' && r.targetPlayerId === session.targetPlayerId);
        }
        return r.resolutionType !== session.type;
      });

      this.state.senate.activeResolutions.push({
        id: `res_mod_${this.state.nextId++}`,
        resolutionType: session.type,
        targetPlayerId: session.targetPlayerId,
        enactedAt: this.state.timeMs,
        expiresAt: this.state.timeMs + SENATE_CONSTANTS.RESOLUTION_ACTIVE_DURATION_MS,
      });

      // Special resolution effects
      if (session.type === 'custodian_election' && session.targetPlayerId) {
        this.state.senate.custodianPlayerId = session.targetPlayerId;
        const targetPlayer = this.state.players[session.targetPlayerId];
        this.state.relay.weeklyPoints[session.targetPlayerId] =
          (this.state.relay.weeklyPoints[session.targetPlayerId] || 0) +
          SENATE_CONSTANTS.CUSTODIAN_HEGEMONY_POINTS_REWARD;

        this.logEvent(
          'senate_custodian_elected',
          `🏛️ GALAKTİK MUHAFIZ SEÇİLDİ: ${targetPlayer?.name || 'Komutan'} Galaktik Senato tarafından olağanüstü yetkilerle donatılarak Muhafız ilan edildi! (+150 Hegemonya Puanı)`,
          session.targetPlayerId,
          { targetPlayerId: session.targetPlayerId }
        );

        this.evaluateVictoryConditions();
      } else {
        const targetPlayer = session.targetPlayerId ? this.state.players[session.targetPlayerId] : undefined;
        const targetNote = targetPlayer ? ` (Hedef: ${targetPlayer.name})` : '';
        this.logEvent(
          'senate_resolution_passed',
          `🏛️ YASA KABUL EDİLDİ: '${cfg.nameTr}'${targetNote} tasarısı ${tally.forWeight} LEHTE / ${tally.againstWeight} ALEYHTE oyla yasalaştı.`,
          session.proposedBy,
          { resolutionType: session.type, tally }
        );
      }
    } else {
      this.logEvent(
        'senate_resolution_rejected',
        `🏛️ YASA REDDEDİLDİ: '${cfg.nameTr}' tasarısı yeterli diplomatik ağırlık sağlayamadı (${tally.forWeight} LEHTE / ${tally.againstWeight} ALEYHTE).`,
        session.proposedBy,
        { resolutionType: session.type, tally }
      );
    }

    this.state.senate.sessionHistory.unshift({
      id: session.id,
      resolutionType: session.type,
      targetPlayerId: session.targetPlayerId,
      proposedBy: session.proposedBy,
      passed: tally.passed,
      forWeight: tally.forWeight,
      againstWeight: tally.againstWeight,
      concludedAt: this.state.timeMs,
    });

    this.state.senate.lastSessionEndedAt = this.state.timeMs;
    this.state.senate.currentSession = null;
  }

  /**
   * Checks if a senate resolution is actively enacted and not expired
   */
  public isSenateResolutionActive(type: SenateResolutionType, targetPlayerId?: string): boolean {
    if (!this.state.senate?.activeResolutions) return false;
    return this.state.senate.activeResolutions.some((r) => {
      if (r.resolutionType !== type) return false;
      if (targetPlayerId !== undefined && r.targetPlayerId !== targetPlayerId) return false;
      if (r.expiresAt && this.state.timeMs >= r.expiresAt) return false;
      return true;
    });
  }

  /**
   * Calculates player attack multiplier based on Military Readiness and Custodian status
   */
  public getPlayerSenateAttackMultiplier(playerId: string): number {
    let mult = 1.0;
    if (this.isSenateResolutionActive('military_readiness')) {
      mult += SENATE_CONSTANTS.MILITARY_READINESS_ATTACK_BONUS_PERCENT;
    }
    if (this.state.senate?.custodianPlayerId === playerId) {
      mult += SENATE_CONSTANTS.CUSTODIAN_FLEET_ATTACK_BONUS_PERCENT;
    }
    const megaBonuses = getPlayerMegastructureBonuses(this.state, playerId);
    mult += megaBonuses.shipBonusAttackPercent;
    const councilBonuses = getCouncilEmpireBonuses(this.state, playerId);
    mult *= councilBonuses.fleetAttackMultiplier;
    return mult;
  }

  /**
   * Returns a set of all system IDs with an active gateway accessible by the player
   */
  public getActiveGatewaySystemIds(playerId: string): Set<string> {
    const active = new Set<string>();
    if (!this.state.gateways) return active;
    const player = this.state.players[playerId];
    const alliedIds = new Set<string>([playerId]);
    if (player?.allianceId && this.state.alliances[player.allianceId]) {
      for (const mId of this.state.alliances[player.allianceId].memberIds) {
        alliedIds.add(mId);
      }
    }

    for (const gw of Object.values(this.state.gateways)) {
      if (gw.status === 'active') {
        if (!gw.ownerId || alliedIds.has(gw.ownerId)) {
          active.add(gw.systemId);
        }
      }
    }
    return active;
  }

  // --- Fleet Arrival Resolution ---
  private handleFleetArrival(fleet: Fleet) {
    const player = this.state.players[fleet.ownerId];
    const targetSystem = this.state.map.systems[fleet.targetSystemId];

    // If fleet is returning back home
    if (fleet.isReturning) {
      const homePlanet = this.state.planets[fleet.originSystemId] ||
        Object.values(this.state.planets).find(p => p.ownerId === fleet.ownerId && p.isHomeworld);

      if (homePlanet) {
        // Unload cargo
        homePlanet.resources.ore = Math.min(homePlanet.storageCap, homePlanet.resources.ore + fleet.cargo.ore);
        homePlanet.resources.crystal = Math.min(homePlanet.storageCap, homePlanet.resources.crystal + fleet.cargo.crystal);
        homePlanet.resources.fuel = Math.min(homePlanet.storageCap, homePlanet.resources.fuel + fleet.cargo.fuel);

        // Merge surviving ships back into garrison
        for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
          homePlanet.garrison[type] += count;
        }

        this.logEvent(
          'fleet_returned',
          `${fleet.name} üsse döndü. Yük (${Math.round(fleet.cargo.ore)}C, ${Math.round(fleet.cargo.crystal)}K, ${Math.round(fleet.cargo.fuel)}Y) boşaltıldı.`,
          fleet.ownerId
        );
      }

      if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
        this.state.admirals[fleet.admiralId].assignedFleetId = null;
      }

      fleet.status = 'destroyed'; // remove from active space
      delete this.state.fleets[fleet.id];
      return;
    }

    // Outbound mission arrival
    switch (fleet.mission) {
      case 'explore': {
        // Discover system for player
        if (player) {
          player.intel.discoveredSystems[targetSystem.id] = 'mapped';
        }

        let gatheredOre = 0;
        let gatheredCrystal = 0;
        let gatheredFuel = 0;

        // Check if there is an uncollected POI
        if (targetSystem.poi && !targetSystem.poi.explored) {
          if (targetSystem.poi.type === 'pirate_lair') {
            targetSystem.poi.explored = true;
            this.logEvent(
              'poi_discovered',
              `İSTİHBARAT: ${fleet.name} ${targetSystem.name} sisteminde ${targetSystem.poi.bounty?.titleTr || 'Korsan Sığınağı'} tespit etti! Tehdit Seviyesi: ${targetSystem.poi.bounty?.threatLevel.toUpperCase()}. Ödülü almak için taarruz filosu sevk edin.`,
              fleet.ownerId
            );
          } else if (targetSystem.poi.reward) {
            targetSystem.poi.explored = true;
            gatheredOre = targetSystem.poi.reward.ore;
            gatheredCrystal = targetSystem.poi.reward.crystal;
            gatheredFuel = targetSystem.poi.reward.fuel;

            if (targetSystem.poi.artifactId && player) {
              player.artifacts = player.artifacts || [];
              if (!player.artifacts.includes(targetSystem.poi.artifactId)) {
                player.artifacts.push(targetSystem.poi.artifactId);
                const artifactDef = EMPIRE_ARTIFACTS[targetSystem.poi.artifactId];
                this.logEvent(
                  'poi_discovered',
                  `🏛️ KADİM YADİGAR BULUNDU: ${fleet.name}, ${targetSystem.name} sisteminde ${artifactDef.icon} ${artifactDef.nameTr} yadigârını ortaya çıkardı! İmparatorluk bonusu aktif: ${artifactDef.effectTr}.`,
                  fleet.ownerId
                );
              } else {
                this.logEvent(
                  'poi_discovered',
                  `${fleet.name} ${targetSystem.name} sisteminde ${targetSystem.poi.type} sahasını inceledi ve antik kaynakları topladı!`,
                  fleet.ownerId
                );
              }
            } else {
              this.logEvent(
                'poi_discovered',
                `${fleet.name} ${targetSystem.name} sisteminde ${targetSystem.poi.type} keşfetti ve kaynak topladı!`,
                fleet.ownerId
              );
            }

            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              const adm = this.state.admirals[fleet.admiralId];
              const xpGain = targetSystem.poi.artifactId ? 200 : 80;
              const { admiral: updatedAdm, leveledUp } = addAdmiralXP(adm, xpGain);
              this.state.admirals[fleet.admiralId] = updatedAdm;
              if (leveledUp) {
                this.logEvent(
                  'admiral_level_up',
                  `TERFİ: Komutan ${updatedAdm.name} (${updatedAdm.title}) Seviye ${updatedAdm.level} rütbesine terfi etti!`,
                  fleet.ownerId
                );
              }
            }
          }
        } else {
          this.logEvent(
            'system_explored',
            `${fleet.name} ${targetSystem.name} sistemini haritalandırdı.`,
            fleet.ownerId
          );
        }

        fleet.cargo.ore += gatheredOre;
        fleet.cargo.crystal += gatheredCrystal;
        fleet.cargo.fuel += gatheredFuel;

        this.orderFleetReturn(fleet);
        break;
      }

      case 'colonize': {
        // Find targeted empty slot or any empty slot in targetSystem
        const emptySlot =
          (fleet.targetPlanetId
            ? targetSystem.slots.find(s => s.planetId === fleet.targetPlanetId && s.ownerId === null)
            : undefined) || targetSystem.slots.find(s => s.ownerId === null);
        const existingColonies = Object.values(this.state.planets).filter(p => p.ownerId === fleet.ownerId);

        if (emptySlot && existingColonies.length < GAME_CONSTANTS.MAX_COLONIES_PER_PLAYER) {
          const newPlanetId = `planet_colony_${this.state.nextId++}`;
          const hasExpansionT3 = hasTradition(this.state, fleet.ownerId, 'expansion', 3);
          const starterFighters = hasExpansionT3 ? 3 : 1;
          const starterBonus = hasExpansionT3 ? 500 : 0;

          const newPlanet: Planet = {
            id: newPlanetId,
            name: `${player?.name || 'Koloni'} - ${emptySlot.name}`,
            systemId: targetSystem.id,
            slotIndex: emptySlot.slotIndex,
            ownerId: fleet.ownerId,
            isHomeworld: false,
            resources: {
              ore: fleet.cargo.ore + starterBonus,
              crystal: fleet.cargo.crystal + starterBonus,
              fuel: fleet.cargo.fuel + starterBonus,
            },
            lastResourceUpdate: this.state.timeMs,
            storageCap: 15000,
            protectedCapacity: 800,
            buildings: {
              ore_mine: 1,
              crystal_synth: 1,
              fuel_refinery: 1,
              shipyard: 0,
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
            garrison: { scout: 0, transport: 0, fighter: starterFighters, battleship: 0 },
            stance: 'hold_position',
            specialization: 'balanced',
            biome: emptySlot.type,
            terraformingQueue: null,
            activeDecisions: [],
            blockers: generateInitialBlockers(emptySlot.type, this.prng),
          };

          emptySlot.ownerId = fleet.ownerId;
          emptySlot.planetId = newPlanetId;
          this.state.planets[newPlanetId] = newPlanet;

          if (player) {
            player.intel.discoveredSystems[targetSystem.id] = 'full';
          }

          this.logEvent(
            'colony_founded',
            `${fleet.name} ${targetSystem.name} sisteminde yeni bir koloni kurdu!`,
            fleet.ownerId
          );

          this.evaluateVictoryConditions();

          fleet.status = 'destroyed';
          delete this.state.fleets[fleet.id];
        } else {
          // Cannot colonize, return home
          this.orderFleetReturn(fleet);
        }
        break;
      }

      case 'transport': {
        // Collect debris if present in system
        if (targetSystem.hasDebris && (targetSystem.hasDebris.ore > 0 || targetSystem.hasDebris.crystal > 0)) {
          let transportCapacity = 0;
          for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
            transportCapacity += count * SHIP_STATS[type].cargoCapacity;
          }

          const availableCargo = Math.max(0, transportCapacity - (fleet.cargo.ore + fleet.cargo.crystal + fleet.cargo.fuel));
          const totalDebris = targetSystem.hasDebris.ore + targetSystem.hasDebris.crystal;

          if (availableCargo > 0 && totalDebris > 0) {
            const factor = Math.min(1, availableCargo / totalDebris);
            const salvagedOre = Math.floor(targetSystem.hasDebris.ore * factor);
            const salvagedCrystal = Math.floor(targetSystem.hasDebris.crystal * factor);

            fleet.cargo.ore += salvagedOre;
            fleet.cargo.crystal += salvagedCrystal;
            targetSystem.hasDebris.ore -= salvagedOre;
            targetSystem.hasDebris.crystal -= salvagedCrystal;

            this.logEvent(
              'debris_salvaged',
              `${fleet.name} enkazdan ${salvagedOre} Cevher ve ${salvagedCrystal} Kristal topladı.`,
              fleet.ownerId
            );
          }
        }

        // Deep space pirate ambush check on unescorted transport convoys
        const hasWarships = (fleet.ships.fighter || 0) > 0 || (fleet.ships.battleship || 0) > 0;
        const hasTransports = (fleet.ships.transport || 0) > 0;
        const hasCargo = fleet.cargo.ore + fleet.cargo.crystal + fleet.cargo.fuel > 0;
        const isPirateThreat = targetSystem.poi?.type === 'pirate_lair' && !targetSystem.poi.bounty?.claimed;

        if (hasTransports && !hasWarships && hasCargo && isPirateThreat) {
          const stolenOre = Math.floor(fleet.cargo.ore * 0.20);
          const stolenCrystal = Math.floor(fleet.cargo.crystal * 0.20);
          const stolenFuel = Math.floor(fleet.cargo.fuel * 0.20);

          fleet.cargo.ore -= stolenOre;
          fleet.cargo.crystal -= stolenCrystal;
          fleet.cargo.fuel -= stolenFuel;

          this.logEvent(
            'pirate_ambush',
            `PUSU: ${fleet.name} ${targetSystem.name} sisteminde korsan pususuna uğradı! Eskortsuz kargo gemilerinden ${stolenOre}C, ${stolenCrystal}K, ${stolenFuel}Y çalındı.`,
            fleet.ownerId
          );
        }

        // Deliver cargo if targeted at own planet OR allied planet
        if (fleet.targetPlanetId && this.state.planets[fleet.targetPlanetId]) {
          const targetPlanet = this.state.planets[fleet.targetPlanetId];
          const targetOwner = this.state.players[targetPlanet.ownerId];
          const isAlly = Boolean(player?.allianceId && targetOwner?.allianceId && player.allianceId === targetOwner.allianceId);

          if (targetPlanet.ownerId === fleet.ownerId || isAlly) {
            const deliveredOre = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.ore), fleet.cargo.ore);
            const deliveredCrystal = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.crystal), fleet.cargo.crystal);
            const deliveredFuel = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.fuel), fleet.cargo.fuel);

            targetPlanet.resources.ore += deliveredOre;
            targetPlanet.resources.crystal += deliveredCrystal;
            targetPlanet.resources.fuel += deliveredFuel;

            fleet.cargo.ore -= deliveredOre;
            fleet.cargo.crystal -= deliveredCrystal;
            fleet.cargo.fuel -= deliveredFuel;

            if (isAlly && targetPlanet.ownerId !== fleet.ownerId) {
              this.logEvent(
                'alliance_resource_transfer',
                `${player?.name || 'Komutan'} nakliye filosu müttefik ${targetOwner?.name} kolonisinde (${targetPlanet.name}) ${deliveredOre} Cevher, ${deliveredCrystal} Kristal ve ${deliveredFuel} Yakıt nakliyesi gerçekleştirdi.`,
                targetPlanet.ownerId,
                { fromPlayerId: fleet.ownerId, targetPlanetId: targetPlanet.id, delivered: { ore: deliveredOre, crystal: deliveredCrystal, fuel: deliveredFuel } }
              );
            }
          }
        }

        this.orderFleetReturn(fleet);
        break;
      }

      case 'attack': {
        const targetPlanet = fleet.targetPlanetId ? this.state.planets[fleet.targetPlanetId] : null;

        // 1. Planetary Raid Combat
        if (targetPlanet && targetPlanet.ownerId !== fleet.ownerId) {
          // If active truce exists, cancel raid and return peacefully
          if (this.hasActiveTruce(fleet.ownerId, targetPlanet.ownerId)) {
            this.logEvent(
              'truce_enforced',
              `Barış/ateşkes paktı yürürlükte olduğu için ${fleet.name} taarruz gerçekleştirmeden üsse dönüyor.`,
              fleet.ownerId
            );
            fleet.status = 'returning';
            fleet.isReturning = true;
            fleet.departureTime = this.state.timeMs;
            const tripDuration = Math.max(1000, fleet.arrivalTime - fleet.departureTime);
            fleet.arrivalTime = this.state.timeMs + tripDuration;
            fleet.path = [...fleet.path].reverse();
            fleet.targetSystemId = fleet.originSystemId;
            fleet.mission = 'transport';
            this.scheduleEvent(tripDuration, 'fleet_arrival', { fleetId: fleet.id });
            break;
          }

          const defenderPlayer = this.state.players[targetPlanet.ownerId];
          const attackerWeapons = player?.research.weapons || 0;
          const defenderWeapons = defenderPlayer?.research.weapons || 0;

          const attackerLoadouts = fleet.loadouts || this.state.shipLoadouts?.[fleet.ownerId];
          const defenderLoadouts = this.state.shipLoadouts?.[targetPlanet.ownerId];

          const tradCombat = getTraditionCombatMultiplier(this.state, fleet.ownerId, targetPlanet.ownerId, 'planet_raid');
          const attackerParagonBonuses = getFleetParagonBonuses(this.state, fleet.id);
          const defenderPlanetParagon = targetPlanet.assignedParagonId && this.state.paragons ? this.state.paragons[targetPlanet.assignedParagonId] : null;
          const defenderParagonDefMult = defenderPlanetParagon?.destinyTraitId === 'kusatma_kiran' ? 1.30 : 1.0;

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan',
              ships: fleet.ships,
              weaponsResearchLevel: attackerWeapons,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
              artifacts: player?.artifacts,
              senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(fleet.ownerId),
              traditionAttackMultiplier: tradCombat.attackerMult * attackerParagonBonuses.attackMultiplier,
              traditionDefenseMultiplier: attackerParagonBonuses.defenseMultiplier,
              traditionEvasionBonus: tradCombat.attackerEvasionBonus,
              relicDamageReduction: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
              relicEvasionBonus: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
              shipLoadouts: attackerLoadouts,
            },
            {
              ownerId: targetPlanet.ownerId,
              ownerName: defenderPlayer?.name || 'Savunucu',
              ships: targetPlanet.garrison,
              weaponsResearchLevel: defenderWeapons,
              stance: targetPlanet.stance,
              defenses: targetPlanet.defenses,
              planetSpecialization: targetPlanet.specialization,
              artifacts: defenderPlayer?.artifacts,
              starbase: this.state.starbases?.[targetSystem.id]?.ownerId === targetPlanet.ownerId ? this.state.starbases[targetSystem.id] : undefined,
              senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(targetPlanet.ownerId),
              traditionAttackMultiplier: tradCombat.defenderMult,
              traditionDefenseMultiplier: tradCombat.defenderMult * defenderParagonDefMult,
              traditionEvasionBonus: tradCombat.defenderEvasionBonus,
              relicDamageReduction: hasActiveRelicTriumph(this.state, targetPlanet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
              relicEvasionBonus: hasActiveRelicTriumph(this.state, targetPlanet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
              planetaryDefenseMultiplier: getPlanetEcologyModifiers(targetPlanet).defenseMultiplier,
              shipLoadouts: defenderLoadouts,
            },
            targetSystem.id,
            targetSystem.name,
            'planet_raid',
            targetPlanet.resources,
            targetPlanet.protectedCapacity,
            this.state.timeMs,
            this.prng.nextInt(100, 999999)
          );

          this.state.battleReports.push(combatResult.report);
          recordBattleWarExhaustion(this.state, combatResult.report);
          this.handlePostCombatAdmiralXP(combatResult);

          // Update defender garrison, defenses, starbase, and deducted looted resources
          targetPlanet.garrison = combatResult.remainingDefender;
          if (combatResult.remainingDefenses) {
            targetPlanet.defenses = combatResult.remainingDefenses;
          }
          if (combatResult.remainingStarbase) {
            const targetSb = this.state.starbases?.[targetSystem.id];
            if (targetSb && targetSb.ownerId === targetPlanet.ownerId) {
              if (combatResult.remainingStarbase.destroyed) {
                if (this.state.starbases) {
                  delete this.state.starbases[targetSystem.id];
                }
                this.logEvent(
                  'starbase_destroyed',
                  `${targetSystem.name} sistemindeki ${targetPlanet.ownerId === fleet.ownerId ? 'savunma üssünüz' : 'savunma üssü'} imha edildi!`,
                  targetPlanet.ownerId,
                  { systemId: targetSystem.id }
                );
              } else {
                targetSb.hull = combatResult.remainingStarbase.hull;
                targetSb.shield = combatResult.remainingStarbase.shield;
              }
            }
          }
          targetPlanet.resources.ore = Math.max(0, targetPlanet.resources.ore - combatResult.lootedResources.ore);
          targetPlanet.resources.crystal = Math.max(0, targetPlanet.resources.crystal - combatResult.lootedResources.crystal);
          targetPlanet.resources.fuel = Math.max(0, targetPlanet.resources.fuel - combatResult.lootedResources.fuel);

          // Add debris to system
          if (!targetSystem.hasDebris) targetSystem.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
          targetSystem.hasDebris.ore += combatResult.debrisFieldCreated.ore;
          targetSystem.hasDebris.crystal += combatResult.debrisFieldCreated.crystal;

          // Update attacker fleet
          fleet.ships = combatResult.remainingAttacker;
          fleet.cargo.ore += combatResult.lootedResources.ore;
          fleet.cargo.crystal += combatResult.lootedResources.crystal;
          fleet.cargo.fuel += combatResult.lootedResources.fuel;

          this.logEvent(
            'battle_finished',
            `Savaş Sonucu: ${combatResult.report.winner.toUpperCase()} kazandı (${targetSystem.name}). Yağma: ${Math.round(combatResult.lootedResources.ore)}C, ${Math.round(combatResult.lootedResources.crystal)}K.`,
            fleet.ownerId
          );

          const survivingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
          if (survivingCount > 0) {
            this.orderFleetReturn(fleet);
          } else {
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
          }
          break;
        }

        // 2. Ancient Titan Leviathan Battle
        const activeTitanEvent = Object.values(this.state.sectorEvents || {}).find(
          (e) => e.systemId === targetSystem.id && e.type === 'ancient_titan' && !e.resolved
        );

        if (!targetPlanet && activeTitanEvent) {
          const titanReward = activeTitanEvent.effects.titanReward || { ore: 2400, crystal: 1600, fuel: 900 };
          const titanGarrison: Record<ShipType, number> = { scout: 0, transport: 0, fighter: 6, battleship: 3 };
          const titanDefenses: Record<DefenseStructureType, number> = { missile_battery: 3, plasma_turret: 3, ion_cannon: 2 };

          const titanParagonBonuses = getFleetParagonBonuses(this.state, fleet.id);

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan',
              ships: fleet.ships,
              weaponsResearchLevel: player?.research.weapons || 0,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
              artifacts: player?.artifacts,
              senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(fleet.ownerId),
              traditionAttackMultiplier: titanParagonBonuses.attackMultiplier,
              traditionDefenseMultiplier: titanParagonBonuses.defenseMultiplier,
              relicDamageReduction: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
              relicEvasionBonus: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
              shipLoadouts: fleet.loadouts || this.state.shipLoadouts?.[fleet.ownerId],
            },
            {
              ownerId: 'ancient_titan',
              ownerName: 'Kadim Muhafız Titanı',
              ships: titanGarrison,
              weaponsResearchLevel: 3,
              stance: 'hold_position',
              defenses: titanDefenses,
              doctrine: 'fortress',
            },
            targetSystem.id,
            targetSystem.name,
            'planet_raid',
            titanReward,
            0,
            this.state.timeMs,
            this.prng.nextInt(100, 999999)
          );

          this.state.battleReports.push(combatResult.report);
          this.handlePostCombatAdmiralXP(combatResult);

          if (!targetSystem.hasDebris) targetSystem.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
          targetSystem.hasDebris.ore += combatResult.debrisFieldCreated.ore;
          targetSystem.hasDebris.crystal += combatResult.debrisFieldCreated.crystal;

          const hasBountyHunters = this.isSenateResolutionActive('bounty_hunters');
          const titanLootMult = hasBountyHunters ? 2 : 1;

          fleet.ships = combatResult.remainingAttacker;
          fleet.cargo.ore += combatResult.lootedResources.ore * titanLootMult;
          fleet.cargo.crystal += combatResult.lootedResources.crystal * titanLootMult;
          fleet.cargo.fuel += combatResult.lootedResources.fuel * titanLootMult;

          if (combatResult.report.winner === 'attacker') {
            activeTitanEvent.resolved = true;
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              const adm = this.state.admirals[fleet.admiralId];
              const xpGain = hasBountyHunters ? 700 : 350;
              const { admiral: updatedAdm, leveledUp } = addAdmiralXP(adm, xpGain);
              this.state.admirals[fleet.admiralId] = updatedAdm;
              if (leveledUp) {
                this.logEvent(
                  'admiral_level_up',
                  `TİTAN ZAFERİ TERFİSİ: ${updatedAdm.name} (${updatedAdm.title}) Kadim Titan'ı dize getirerek Seviye ${updatedAdm.level}'e ulaştı!`,
                  fleet.ownerId
                );
              }
            }

            // Award +75 Hegemony points for defeating the Ancient Titan
            this.state.relay.weeklyPoints[fleet.ownerId] =
              (this.state.relay.weeklyPoints[fleet.ownerId] || 0) + 75;

            this.logEvent(
              'ancient_titan_slain',
              `👑 TİTAN DÜŞTÜ: ${player?.name || 'Komutan'} ${targetSystem.name} sistemindeki Kadim Muhafız Titanı'nı mağlup etti! Yağma: ${Math.round(combatResult.lootedResources.ore)}C, ${Math.round(combatResult.lootedResources.crystal)}K, ${Math.round(combatResult.lootedResources.fuel)}Y (+75 Hegemonya Puanı).`,
              undefined,
              { systemId: targetSystem.id, victorPlayerId: fleet.ownerId }
            );

            this.evaluateVictoryConditions();
          } else {
            this.logEvent(
              'battle_finished',
              `Kadim Titan ile muharebe: Titan saldırıyı püskürttü (${targetSystem.name}).`,
              fleet.ownerId
            );
          }

          const survivingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
          if (survivingCount > 0) {
            this.orderFleetReturn(fleet);
          } else {
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
          }
          break;
        }

        // 3. Pirate Lair Assault
        if (!targetPlanet && targetSystem.poi?.type === 'pirate_lair' && !targetSystem.poi.bounty?.claimed) {
          const pirateBounty = targetSystem.poi.bounty;
          const pirateGarrison = pirateBounty?.pirateGarrison || { scout: 2, transport: 1, fighter: 5, battleship: 1 };
          const pirateThreat = pirateBounty?.threatLevel || 'medium';
          const pirateWeapons = pirateThreat === 'deadly' ? 3 : pirateThreat === 'high' ? 2 : 1;
          const pirateDefenses: Record<DefenseStructureType, number> =
            pirateThreat === 'deadly'
              ? { missile_battery: 6, plasma_turret: 4, ion_cannon: 2 }
              : pirateThreat === 'high'
              ? { missile_battery: 4, plasma_turret: 2, ion_cannon: 1 }
              : pirateThreat === 'medium'
              ? { missile_battery: 2, plasma_turret: 1, ion_cannon: 0 }
              : { missile_battery: 1, plasma_turret: 0, ion_cannon: 0 };

          const tradPirateCombat = getTraditionCombatMultiplier(this.state, fleet.ownerId, 'pirates', 'pirate_lair');
          const pirateParagonBonuses = getFleetParagonBonuses(this.state, fleet.id);

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan Komutan',
              ships: fleet.ships,
              weaponsResearchLevel: player?.research.weapons || 0,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
              artifacts: player?.artifacts,
              senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(fleet.ownerId),
              traditionAttackMultiplier: tradPirateCombat.attackerMult * pirateParagonBonuses.attackMultiplier,
              traditionDefenseMultiplier: pirateParagonBonuses.defenseMultiplier,
              traditionEvasionBonus: tradPirateCombat.attackerEvasionBonus,
              relicDamageReduction: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
              relicEvasionBonus: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
              shipLoadouts: fleet.loadouts || this.state.shipLoadouts?.[fleet.ownerId],
            },
            {
              ownerId: 'pirates',
              ownerName: pirateBounty?.titleTr || 'Uzay Korsanları',
              ships: pirateGarrison,
              weaponsResearchLevel: pirateWeapons,
              defenses: pirateDefenses,
              doctrine: 'hit_and_run',
            },
            targetSystem.id,
            targetSystem.name,
            'pirate_lair',
            undefined,
            0,
            this.state.timeMs,
            this.prng.nextInt(100, 999999)
          );

          this.state.battleReports.push(combatResult.report);
          this.handlePostCombatAdmiralXP(combatResult);

          if (combatResult.report.winner === 'attacker') {
            if (pirateBounty) {
              pirateBounty.claimed = true;
            }
            if (targetSystem.poi) {
              targetSystem.poi.explored = true;
            }

            const hasBountyHunters = this.isSenateResolutionActive('bounty_hunters');
            const baseReward = targetSystem.poi.reward || { ore: 1500, crystal: 1000, fuel: 500 };
            const mult = hasBountyHunters ? 2 : 1;
            const reward = {
              ore: baseReward.ore * mult,
              crystal: baseReward.crystal * mult,
              fuel: baseReward.fuel * mult,
            };
            const xp = (pirateBounty?.rewardXP || 200) * mult;

            fleet.cargo.ore += reward.ore;
            fleet.cargo.crystal += reward.crystal;
            fleet.cargo.fuel += reward.fuel;

            combatResult.report.bountyEarned = {
              resources: { ...reward },
              xp,
            };

            this.logEvent(
              'pirate_lair_destroyed',
              `${fleet.name} ${targetSystem.name} sistemindeki korsan üssünü imha etti! Ödül: ${reward.ore}C, ${reward.crystal}K, ${reward.fuel}Y ve +${xp} DP.`,
              fleet.ownerId
            );
          } else {
            if (pirateBounty) {
              pirateBounty.pirateGarrison = combatResult.remainingDefender;
            }
            this.logEvent(
              'battle_finished',
              `${targetSystem.name} korsan üssü taarruzu püskürttü. Kalan korsan filosu mevzilendi.`,
              fleet.ownerId
            );
          }

          // Add debris to system
          if (!targetSystem.hasDebris) targetSystem.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
          targetSystem.hasDebris.ore += combatResult.debrisFieldCreated.ore;
          targetSystem.hasDebris.crystal += combatResult.debrisFieldCreated.crystal;

          // Update attacker fleet
          fleet.ships = combatResult.remainingAttacker;
          const survivingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
          if (survivingCount > 0) {
            this.orderFleetReturn(fleet);
          } else {
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
          }
          break;
        }

        // Neither target planet nor pirate base nor titan
        this.orderFleetReturn(fleet);
        break;
      }

      case 'intercept': {
        // Intercept target fleet at rendezvous
        const targetFleet = fleet.targetFleetId ? this.state.fleets[fleet.targetFleetId] : null;
        if (!targetFleet || targetFleet.status === 'destroyed') {
          this.orderFleetReturn(fleet);
          return;
        }

        const defenderPlayer = this.state.players[targetFleet.ownerId];
        const interceptorParagon = getFleetParagonBonuses(this.state, fleet.id);
        const defenderParagon = getFleetParagonBonuses(this.state, targetFleet.id);

        const combatResult = resolveCombat(
          {
            ownerId: fleet.ownerId,
            ownerName: player?.name || 'Önleyici',
            ships: fleet.ships,
            weaponsResearchLevel: player?.research.weapons || 0,
            admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
            doctrine: fleet.doctrine || 'balanced',
            artifacts: player?.artifacts,
            senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(fleet.ownerId),
            traditionAttackMultiplier: interceptorParagon.attackMultiplier,
            traditionDefenseMultiplier: interceptorParagon.defenseMultiplier,
            relicDamageReduction: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
            relicEvasionBonus: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
            shipLoadouts: fleet.loadouts || this.state.shipLoadouts?.[fleet.ownerId],
          },
          {
            ownerId: targetFleet.ownerId,
            ownerName: defenderPlayer?.name || 'Hedef Filo',
            ships: targetFleet.ships,
            weaponsResearchLevel: defenderPlayer?.research.weapons || 0,
            admiral: targetFleet.admiralId && this.state.admirals ? this.state.admirals[targetFleet.admiralId] : undefined,
            doctrine: targetFleet.doctrine || 'balanced',
            artifacts: defenderPlayer?.artifacts,
            starbase: this.state.starbases?.[targetSystem.id]?.ownerId === targetFleet.ownerId ? this.state.starbases[targetSystem.id] : undefined,
            senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(targetFleet.ownerId),
            traditionAttackMultiplier: defenderParagon.attackMultiplier,
            traditionDefenseMultiplier: defenderParagon.defenseMultiplier,
            relicDamageReduction: hasActiveRelicTriumph(this.state, targetFleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
            relicEvasionBonus: hasActiveRelicTriumph(this.state, targetFleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
            shipLoadouts: targetFleet.loadouts || this.state.shipLoadouts?.[targetFleet.ownerId],
          },
          targetSystem.id,
          targetSystem.name,
          'fleet_interception',
          undefined,
          0,
          this.state.timeMs,
          this.prng.nextInt(100, 999999)
        );

        this.state.battleReports.push(combatResult.report);
        recordBattleWarExhaustion(this.state, combatResult.report);
        this.handlePostCombatAdmiralXP(combatResult);

        // Add debris
        if (!targetSystem.hasDebris) targetSystem.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
        targetSystem.hasDebris.ore += combatResult.debrisFieldCreated.ore;
        targetSystem.hasDebris.crystal += combatResult.debrisFieldCreated.crystal;

        fleet.ships = combatResult.remainingAttacker;
        targetFleet.ships = combatResult.remainingDefender;

        if (Object.values(targetFleet.ships).reduce((a, b) => a + b, 0) === 0) {
          targetFleet.status = 'destroyed';
          if (targetFleet.admiralId && this.state.admirals && this.state.admirals[targetFleet.admiralId]) {
            this.state.admirals[targetFleet.admiralId].assignedFleetId = null;
          }
          delete this.state.fleets[targetFleet.id];
        }

        const survivingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
        if (survivingCount > 0) {
          this.orderFleetReturn(fleet);
        } else {
          fleet.status = 'destroyed';
          if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
            this.state.admirals[fleet.admiralId].assignedFleetId = null;
          }
          delete this.state.fleets[fleet.id];
        }
        break;
      }

      case 'support': {
        // Check if arriving at Relay
        if (targetSystem.hasRelay) {
          if (this.state.relay.controllingPlayerId === fleet.ownerId) {
            // Reinforce existing relay garrison
            for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
              this.state.relay.garrison[type] += count;
            }
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
            this.logEvent('relay_reinforced', `${fleet.name} Nexus Rölesi garnizonuna katıldı.`, fleet.ownerId);
          } else {
            // Battle for Relay
            const currentController = this.state.relay.controllingPlayerId
              ? this.state.players[this.state.relay.controllingPlayerId]?.name || 'Garnizon'
              : 'Tarafsız Garnizon';

            const relayParagon = getFleetParagonBonuses(this.state, fleet.id);

            const combatResult = resolveCombat(
              {
                ownerId: fleet.ownerId,
                ownerName: player?.name || 'İstila Filosu',
                ships: fleet.ships,
                weaponsResearchLevel: player?.research.weapons || 0,
                admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
                doctrine: fleet.doctrine || 'balanced',
                artifacts: player?.artifacts,
                senateAttackMultiplier: this.getPlayerSenateAttackMultiplier(fleet.ownerId),
                traditionAttackMultiplier: relayParagon.attackMultiplier,
                traditionDefenseMultiplier: relayParagon.defenseMultiplier,
                relicDamageReduction: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.30 : undefined,
                relicEvasionBonus: hasActiveRelicTriumph(this.state, fleet.ownerId, 'dreadnought_plating') ? 0.15 : undefined,
                shipLoadouts: fleet.loadouts || this.state.shipLoadouts?.[fleet.ownerId],
              },
              {
                ownerId: this.state.relay.controllingPlayerId || 'neutral',
                ownerName: currentController,
                ships: this.state.relay.garrison,
                weaponsResearchLevel: 1,
                doctrine: 'fortress',
                artifacts: this.state.relay.controllingPlayerId
                  ? this.state.players[this.state.relay.controllingPlayerId]?.artifacts
                  : undefined,
                senateAttackMultiplier: this.state.relay.controllingPlayerId
                  ? this.getPlayerSenateAttackMultiplier(this.state.relay.controllingPlayerId)
                  : 1.0,
                relicDamageReduction: this.state.relay.controllingPlayerId && hasActiveRelicTriumph(this.state, this.state.relay.controllingPlayerId, 'dreadnought_plating') ? 0.30 : undefined,
                relicEvasionBonus: this.state.relay.controllingPlayerId && hasActiveRelicTriumph(this.state, this.state.relay.controllingPlayerId, 'dreadnought_plating') ? 0.15 : undefined,
                shipLoadouts: this.state.relay.controllingPlayerId
                  ? this.state.shipLoadouts?.[this.state.relay.controllingPlayerId]
                  : undefined,
              },
              targetSystem.id,
              targetSystem.name,
              'relay_contest',
              undefined,
              0,
              this.state.timeMs,
              this.prng.nextInt(100, 999999)
            );

            this.state.battleReports.push(combatResult.report);
            this.handlePostCombatAdmiralXP(combatResult);

            if (combatResult.report.winner === 'attacker') {
              this.state.relay.controllingPlayerId = fleet.ownerId;
              this.state.relay.garrison = combatResult.remainingAttacker;
              this.state.relay.capturedAtTime = this.state.timeMs;
              fleet.status = 'destroyed';
              if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
                this.state.admirals[fleet.admiralId].assignedFleetId = null;
              }
              delete this.state.fleets[fleet.id];

              this.logEvent(
                'relay_captured',
                `Nexus Rölesi ${player?.name} kontrolüne geçti!`,
                fleet.ownerId
              );
            } else {
              this.state.relay.garrison = combatResult.remainingDefender;
              fleet.ships = combatResult.remainingAttacker;
              if (Object.values(fleet.ships).reduce((a, b) => a + b, 0) > 0) {
                this.orderFleetReturn(fleet);
              } else {
                fleet.status = 'destroyed';
                if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
                  this.state.admirals[fleet.admiralId].assignedFleetId = null;
                }
                delete this.state.fleets[fleet.id];
              }
            }
          }
        } else {
          // Arrive at friendly planet
          if (fleet.targetPlanetId && this.state.planets[fleet.targetPlanetId]) {
            const planet = this.state.planets[fleet.targetPlanetId];
            for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
              planet.garrison[type] += count;
            }
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
            this.logEvent('garrison_reinforced', `${fleet.name} ${planet.name} savunmasına katıldı.`, fleet.ownerId);
          } else {
            this.orderFleetReturn(fleet);
          }
        }
        break;
      }

      case 'patrol': {
        // Fleet arrives at patrol destination
        if (fleet.isReturning) {
          // Patrol return leg complete; merge back into garrison or continue patrol loop
          if (fleet.targetPlanetId && this.state.planets[fleet.targetPlanetId]) {
            const planet = this.state.planets[fleet.targetPlanetId];
            for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
              planet.garrison[type] += count;
            }
            fleet.status = 'destroyed';
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              this.state.admirals[fleet.admiralId].assignedFleetId = null;
            }
            delete this.state.fleets[fleet.id];
            this.logEvent('patrol_completed', `🛡️ DEVRİYE TAMAMLANDI: ${fleet.name} devriye rotasını tamamlayarak ${planet.name} garnizonuna döndü.`, fleet.ownerId);
          } else {
            this.orderFleetReturn(fleet);
          }
        } else {
          // Outbound leg complete; reverse course and patrol back home
          this.logEvent('patrol_sweep', `🛡️ KORSANLIK BASTIRILDI: ${fleet.name} ${targetSystem.name} sisteminde devriye taramasını tamamladı, dönüş devriyesine geçti.`, fleet.ownerId);
          this.orderFleetReturn(fleet);
        }
        break;
      }
    }
  }

  private orderFleetReturn(fleet: Fleet) {
    const flightTimeMs = fleet.arrivalTime - fleet.departureTime;
    fleet.isReturning = true;
    fleet.status = 'returning';
    fleet.departureTime = this.state.timeMs;
    fleet.arrivalTime = this.state.timeMs + flightTimeMs;
    // Swap origin and destination for return leg
    const temp = fleet.originSystemId;
    fleet.originSystemId = fleet.targetSystemId;
    fleet.targetSystemId = temp;

    this.scheduleEvent(flightTimeMs, 'fleet_arrival', { fleetId: fleet.id });
  }

  private handlePostCombatAdmiralXP(combatResult: CombatResult) {
    if (combatResult.attackerAdmiralXP && this.state.admirals) {
      const { admiralId, xpGained } = combatResult.attackerAdmiralXP;
      const adm = this.state.admirals[admiralId];
      if (adm) {
        if (combatResult.report.winner === 'attacker') {
          adm.battlesWon++;
        } else if (combatResult.report.winner === 'defender') {
          adm.battlesLost++;
        }
        const { admiral: updatedAdm, leveledUp } = addAdmiralXP(adm, xpGained);
        this.state.admirals[admiralId] = updatedAdm;
        if (leveledUp) {
          this.logEvent(
            'admiral_leveled_up',
            `⭐ Komutan ${adm.name} Seviye ${updatedAdm.level}'e terfi etti!`,
            adm.ownerId,
            { admiralId, newLevel: updatedAdm.level }
          );
        }
      }
    }

    if (combatResult.defenderAdmiralXP && this.state.admirals) {
      const { admiralId, xpGained } = combatResult.defenderAdmiralXP;
      const adm = this.state.admirals[admiralId];
      if (adm) {
        if (combatResult.report.winner === 'defender') {
          adm.battlesWon++;
        } else if (combatResult.report.winner === 'attacker') {
          adm.battlesLost++;
        }
        const { admiral: updatedAdm, leveledUp } = addAdmiralXP(adm, xpGained);
        this.state.admirals[admiralId] = updatedAdm;
        if (leveledUp) {
          this.logEvent(
            'admiral_leveled_up',
            `⭐ Savunma Komutanı ${adm.name} Seviye ${updatedAdm.level}'e terfi etti!`,
            adm.ownerId,
            { admiralId, newLevel: updatedAdm.level }
          );
        }
      }
    }

    this.handlePostCombatCouncilXP(combatResult);
  }

  private handlePostCombatCouncilXP(combatResult: CombatResult) {
    if (!this.state.councils) return;
    const processCouncil = (pId: string, won: boolean) => {
      const council = this.state.councils?.[pId];
      if (!council) return;
      const xpAmount = won ? 40 : 20;

      // Award to ruler & defense minister
      const roles: CouncilPosition[] = ['ruler', 'defense_minister'];
      for (const role of roles) {
        const leaderId = council.positions[role];
        if (leaderId && council.leaders[leaderId]) {
          const leader = council.leaders[leaderId];
          const { leader: updated, leveledUp } = addLeaderXP(leader, xpAmount);
          council.leaders[leaderId] = updated;
          if (leveledUp) {
            this.logEvent(
              'council_leader_leveled_up',
              `🎖️ KONSEY TERFİSİ: ${COUNCIL_POSITION_INFO[role].nameTr} ${updated.name} Seviye ${updated.level}'e yükseldi!`,
              pId,
              { leaderId, position: role, newLevel: updated.level }
            );
          }
        }
      }
    };

    if (combatResult.report.attackerId) {
      processCouncil(combatResult.report.attackerId, combatResult.report.winner === 'attacker');
    }
    if (combatResult.report.defenderId) {
      processCouncil(combatResult.report.defenderId, combatResult.report.winner === 'defender');
    }
  }

  // --- Espionage & Covert Ops Resolution ---
  private resolveEspionageOperation(op: EspionageOp) {
    const infiltrator = this.state.players[op.infiltratorId];
    const targetPlanet = this.state.planets[op.targetPlanetId];
    const targetPlayer = targetPlanet ? this.state.players[targetPlanet.ownerId] : null;
    const originPlanet = this.state.planets[op.originPlanetId];
    const targetSys = this.state.map.systems[op.targetSystemId];

    if (!infiltrator || !targetPlanet || !targetPlayer || !targetSys) return;

    // Counter-intelligence rating of target planet:
    // Sensor array building provides +15 rating per level
    // Defender's sensors research provides +10 rating per level
    const sensorArrayLvl = targetPlanet.buildings.sensor_array || 0;
    const defenderSensorsTech = targetPlayer.research?.sensors || 0;
    const counterIntelRating = (sensorArrayLvl * 15) + (defenderSensorsTech * 10);

    // Infiltrator stealth rating:
    // Base 45 + 8 per scout probe + 12 per sensor tech level
    const infiltratorSensorsTech = infiltrator.research?.sensors || 0;
    const stealthRating = 45 + (op.scoutCount * 8) + (infiltratorSensorsTech * 12);

    // Success roll:
    // Base 60% chance + (stealth - counterIntel)/100, clamped between 15% and 92%
    const successChance = Math.max(0.15, Math.min(0.92, 0.60 + (stealthRating - counterIntelRating) / 100));
    const rollSuccess = this.prng.next();
    const isSuccess = rollSuccess <= successChance;

    // Detection roll:
    // Target senses foreign probe if detection check passes
    // Base 35% chance + (counterIntel - stealth)/100, clamped between 10% and 85%
    const detectionChance = Math.max(0.10, Math.min(0.85, 0.35 + (counterIntelRating - stealthRating) / 100));
    const rollDetection = this.prng.next();
    const isDetected = rollDetection <= detectionChance;

    let scoutsLost = 0;
    let detailsTr = '';
    let intelData: EspionageReport['intelData'] = undefined;
    let sabotageImpact: EspionageReport['sabotageImpact'] = undefined;
    let techStolen: EspionageReport['techStolen'] = undefined;

    if (isSuccess) {
      // Surviving scouts return home safely
      if (originPlanet) {
        originPlanet.garrison.scout = (originPlanet.garrison.scout || 0) + op.scoutCount;
      }

      switch (op.opType) {
        case 'infiltrate_intel': {
          detailsTr = `${targetPlanet.name} kolonisine sızma başarılı. Bütün savunma ağları, konuşlu filo ve teknolojik veriler deşifre edildi.`;
          intelData = {
            buildings: { ...targetPlanet.buildings },
            garrison: { ...targetPlanet.garrison },
            defenses: targetPlanet.defenses ? { ...targetPlanet.defenses } : { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 },
            resources: { ...targetPlanet.resources },
            research: { ...targetPlayer.research },
            storageCap: targetPlanet.storageCap,
            buildingQueue: targetPlanet.buildingQueue ? { type: targetPlanet.buildingQueue.type, targetLevel: targetPlanet.buildingQueue.targetLevel } : null,
            shipyardQueueCount: targetPlanet.shipyardQueue?.length || 0,
            defenseQueueCount: targetPlanet.defenseQueue?.length || 0,
          };
          break;
        }

        case 'sabotage_shipyard': {
          if (targetPlanet.shipyardQueue && targetPlanet.shipyardQueue.length > 0) {
            const sabotagedShip = targetPlanet.shipyardQueue[0];
            sabotagedShip.nextUnitFinishTime += 60000; // delay by 60s
            sabotageImpact = {
              disruptedTarget: `${SHIP_STATS[sabotagedShip.shipType].nameTr} İnşası`,
              damageDescriptionTr: `Tersane montaj hattı sabote edildi. ${SHIP_STATS[sabotagedShip.shipType].nameTr} üretimi 60 sn geciktirildi.`,
            };
            detailsTr = `${targetPlanet.name} tersanesi sabote edildi! Üretim hattı aksadı.`;
          } else if (targetPlanet.defenseQueue && targetPlanet.defenseQueue.length > 0) {
            const sabotagedDef = targetPlanet.defenseQueue[0];
            sabotagedDef.nextUnitFinishTime += 60000;
            sabotageImpact = {
              disruptedTarget: `${DEFENSE_STATS[sabotagedDef.defenseType].nameTr} Montajı`,
              damageDescriptionTr: `Savunma tareti montaj hattı sabote edildi.`,
            };
            detailsTr = `${targetPlanet.name} savunma platformu montajı sabote edildi!`;
          } else {
            sabotageImpact = {
              disruptedTarget: 'Tersane Enerji Şebekesi',
              damageDescriptionTr: 'Tersane enerji şebekesi kısa devre yaptırıldı. Yeni gemi inşası geçici olarak kilitlendi.',
            };
            detailsTr = `${targetPlanet.name} tersane enerji şebekesi başarıyla sabote edildi.`;
          }
          break;
        }

        case 'tech_espionage': {
          const stolenOre = 350;
          const stolenCrystal = 250;
          const stolenFuel = 150;
          if (originPlanet) {
            originPlanet.resources.ore = Math.min(originPlanet.storageCap, originPlanet.resources.ore + stolenOre);
            originPlanet.resources.crystal = Math.min(originPlanet.storageCap, originPlanet.resources.crystal + stolenCrystal);
            originPlanet.resources.fuel = Math.min(originPlanet.storageCap, originPlanet.resources.fuel + stolenFuel);
          }
          techStolen = {
            scienceReward: 100,
            resources: { ore: stolenOre, crystal: stolenCrystal, fuel: stolenFuel },
          };
          detailsTr = `${targetPlayer.name} Ar-Ge sunucularından gizli askeri şemalar çalındı! (${stolenOre} Cevher, ${stolenCrystal} Kristal, ${stolenFuel} Yakıt değerinde veri elde edildi).`;
          break;
        }

        case 'destabilize_production': {
          const leakOre = Math.min(targetPlanet.resources.ore * 0.25, 400);
          const leakCrystal = Math.min(targetPlanet.resources.crystal * 0.25, 300);
          const leakFuel = Math.min(targetPlanet.resources.fuel * 0.25, 200);
          targetPlanet.resources.ore = Math.max(0, targetPlanet.resources.ore - leakOre);
          targetPlanet.resources.crystal = Math.max(0, targetPlanet.resources.crystal - leakCrystal);
          targetPlanet.resources.fuel = Math.max(0, targetPlanet.resources.fuel - leakFuel);
          sabotageImpact = {
            disruptedTarget: 'Maden & Rafineri Dağıtım Şebekesi',
            damageDescriptionTr: `${Math.round(leakOre)} Cevher, ${Math.round(leakCrystal)} Kristal ve ${Math.round(leakFuel)} Yakıt sızıntısına yol açıldı.`,
          };
          detailsTr = `${targetPlanet.name} maden ve rafineri enerji hatları bozuldu. Depolardan kaynak sızıntısı sağlandı.`;
          break;
        }
      }
    } else {
      // Failed: Probes lost
      scoutsLost = op.scoutCount;
      detailsTr = `Casusluk sondası ${targetPlanet.name} yörüngesindeki sensör ağı tarafından engellendi ve imha edildi.`;
    }

    // Create report for infiltrator
    const reportId = `esprep_${this.state.nextId++}`;
    const report: EspionageReport = {
      id: reportId,
      timestamp: this.state.timeMs,
      infiltratorId: infiltrator.id,
      infiltratorName: infiltrator.name,
      targetPlayerId: targetPlayer.id,
      targetPlayerName: targetPlayer.name,
      targetPlanetId: targetPlanet.id,
      targetPlanetName: targetPlanet.name,
      targetSystemId: targetSys.id,
      targetSystemName: targetSys.name,
      opType: op.opType,
      success: isSuccess,
      detected: isDetected,
      counterIntelRating,
      stealthRating,
      scoutsLost,
      detailsTr,
      intelData,
      sabotageImpact,
      techStolen,
    };

    if (!infiltrator.espionageReports) infiltrator.espionageReports = [];
    infiltrator.espionageReports.unshift(report);
    if (infiltrator.espionageReports.length > 30) infiltrator.espionageReports.pop();

    this.logEvent(
      isSuccess ? 'espionage_success' : 'espionage_failed',
      `${infiltrator.name} gizli operasyonu (${op.opType}): ${isSuccess ? 'BAŞARILI' : 'BAŞARISIZ'} (${targetPlanet.name}).`,
      infiltrator.id,
      { reportId, success: isSuccess, detected: isDetected }
    );

    // If detected, alert defender
    if (isDetected) {
      const alertMsg = counterIntelRating >= 40
        ? `KARŞI İSTİHBARAT ALARMI: ${infiltrator.name} tarafından ${targetPlanet.name} kolonisine gönderilen ${op.opType} casusluk girişimi tespit edildi!`
        : `GÜVENLİK ALARMI: ${targetPlanet.name} kolonisi yörüngesinde kimliği belirsiz bir gizli casusluk sondası tespit edildi!`;

      this.logEvent('espionage_detected', alertMsg, targetPlayer.id, {
        infiltratorId: counterIntelRating >= 40 ? infiltrator.id : 'unknown',
        targetPlanetId: targetPlanet.id,
        opType: op.opType,
        intercepted: !isSuccess,
      });

      if (!targetPlayer.espionageReports) targetPlayer.espionageReports = [];
      targetPlayer.espionageReports.unshift({
        id: `esprep_alert_${this.state.nextId++}`,
        timestamp: this.state.timeMs,
        infiltratorId: counterIntelRating >= 40 ? infiltrator.id : 'unknown',
        infiltratorName: counterIntelRating >= 40 ? infiltrator.name : 'Bilinmeyen Casus',
        targetPlayerId: targetPlayer.id,
        targetPlayerName: targetPlayer.name,
        targetPlanetId: targetPlanet.id,
        targetPlanetName: targetPlanet.name,
        targetSystemId: targetSys.id,
        targetSystemName: targetSys.name,
        opType: op.opType,
        success: isSuccess,
        detected: true,
        counterIntelRating,
        stealthRating,
        scoutsLost: isSuccess ? 0 : op.scoutCount,
        detailsTr: alertMsg,
      });
      if (targetPlayer.espionageReports.length > 30) targetPlayer.espionageReports.pop();
    }
  }

  // --- Command Dispatch Interface ---
  public dispatchCommand(playerId: string, cmd: GameCommand): CommandReceipt {
    const player = this.state.players[playerId];
    if (!player) {
      return { success: false, commandType: cmd.type, error: 'Oyuncu bulunamadı.', timeMs: this.state.timeMs };
    }

    // Refresh resources before command
    this.updatePassiveProduction(this.state.timeMs);

    switch (cmd.type) {
      case 'UPGRADE_BUILDING': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (planet.buildingQueue) {
          return { success: false, commandType: cmd.type, error: 'Halihazırda devam eden inşaat var.', timeMs: this.state.timeMs };
        }

        const currentLvl = planet.buildings[cmd.buildingType] || 0;
        const rawCost = getBuildingUpgradeCost(cmd.buildingType, currentLvl);
        const costMod = getTraditionBuildingCostModifier(this.state, playerId);
        const cost = {
          ore: Math.round(rawCost.ore * costMod),
          crystal: Math.round(rawCost.crystal * costMod),
          fuel: Math.round(rawCost.fuel * costMod),
        };

        if (
          planet.resources.ore < cost.ore ||
          planet.resources.crystal < cost.crystal ||
          planet.resources.fuel < cost.fuel
        ) {
          return { success: false, commandType: cmd.type, error: 'Yetersiz kaynak.', timeMs: this.state.timeMs };
        }

        // Deduct resources
        planet.resources.ore -= cost.ore;
        planet.resources.crystal -= cost.crystal;
        planet.resources.fuel -= cost.fuel;

        const rawDurationMs = getBuildingUpgradeDurationMs(cmd.buildingType, currentLvl);
        const timeMod = getTraditionBuildingTimeModifier(this.state, playerId);
        const relicConstMod = getRelicConstructionMultiplier(this.state, playerId);
        const durationMs = Math.max(1000, Math.round(rawDurationMs * timeMod * relicConstMod));
        const finishTime = this.state.timeMs + durationMs;

        planet.buildingQueue = {
          type: cmd.buildingType,
          targetLevel: currentLvl + 1,
          startTime: this.state.timeMs,
          finishTime,
        };

        this.scheduleEvent(durationMs, 'building_completed', {
          planetId: planet.id,
          buildingType: cmd.buildingType,
          targetLevel: currentLvl + 1,
        });

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { finishTime, durationMs },
        };
      }

      case 'START_RESEARCH': {
        if (player.researchQueue) {
          return { success: false, commandType: cmd.type, error: 'Zaten bir araştırma sürüyor.', timeMs: this.state.timeMs };
        }

        // Check if player has at least 1 lab
        const labs = Object.values(this.state.planets)
          .filter(p => p.ownerId === playerId)
          .map(p => p.buildings.research_lab);

        const maxLab = Math.max(0, ...labs);
        if (maxLab < 1) {
          return { success: false, commandType: cmd.type, error: 'Araştırma Merkezi (Seviye 1+) gereklidir.', timeMs: this.state.timeMs };
        }

        const currentLvl = player.research[cmd.researchType] || 0;
        const cost = getResearchCost(cmd.researchType, currentLvl);

        // Find a planet with enough resources or deduct from homeworld
        const hw = Object.values(this.state.planets).find(p => p.ownerId === playerId && p.isHomeworld) ||
          Object.values(this.state.planets).find(p => p.ownerId === playerId);

        if (!hw || hw.resources.ore < cost.ore || hw.resources.crystal < cost.crystal || hw.resources.fuel < cost.fuel) {
          return { success: false, commandType: cmd.type, error: 'Yetersiz kaynak (Araştırma için gezegen stoğu yetersiz).', timeMs: this.state.timeMs };
        }

        hw.resources.ore -= cost.ore;
        hw.resources.crystal -= cost.crystal;
        hw.resources.fuel -= cost.fuel;

        const hasTechHaven = Object.values(this.state.planets).some(
          p => p.ownerId === playerId && p.specialization === 'tech_haven'
        );
        let durationMs = getResearchDurationMs(cmd.researchType, currentLvl, maxLab);
        if (hasTechHaven) {
          durationMs = Math.max(1000, Math.round(durationMs * 0.8)); // -20% research duration
        }
        if (player.artifacts?.includes('progenitor_matrix')) {
          durationMs = Math.max(1000, Math.round(durationMs * 0.9)); // -10% progenitor matrix relic bonus
        }
        if (this.isSenateResolutionActive('scientific_cooperative')) {
          durationMs = Math.max(1000, Math.round(durationMs * 0.8)); // +25% research speed (-20% duration)
        }
        const megaBonuses = getPlayerMegastructureBonuses(this.state, playerId);
        if (megaBonuses.researchSpeedMultiplier > 1.0) {
          durationMs = Math.max(1000, Math.round(durationMs / megaBonuses.researchSpeedMultiplier));
        }
        const councilBonuses = getCouncilEmpireBonuses(this.state, playerId);
        if (councilBonuses.researchSpeedMultiplier > 1.0) {
          durationMs = Math.max(1000, Math.round(durationMs / councilBonuses.researchSpeedMultiplier));
        }
        if (hasTradition(this.state, playerId, 'discovery', 2)) {
          durationMs = Math.max(1000, Math.round(durationMs * 0.85)); // -15% research duration (data_driven)
        }
        if (hasAscensionPerk(this.state, playerId, 'transcendence')) {
          durationMs = Math.max(1000, Math.round(durationMs / 1.25)); // +25% research speed (transcendence)
        }
        const bestEcologyResearchMultiplier = Math.max(
          1.0,
          ...Object.values(this.state.planets)
            .filter((p) => p.ownerId === playerId)
            .map((p) => getPlanetEcologyModifiers(p).researchMultiplier)
        );
        if (bestEcologyResearchMultiplier > 1.0) {
          durationMs = Math.max(1000, Math.round(durationMs / bestEcologyResearchMultiplier));
        }
        const finishTime = this.state.timeMs + durationMs;

        player.researchQueue = {
          type: cmd.researchType,
          targetLevel: currentLvl + 1,
          startTime: this.state.timeMs,
          finishTime,
        };

        this.scheduleEvent(durationMs, 'research_completed', {
          playerId,
          researchType: cmd.researchType,
          targetLevel: currentLvl + 1,
        });

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { finishTime, durationMs },
        };
      }

      case 'BUILD_SHIPS': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (planet.buildings.shipyard < 1) {
          return { success: false, commandType: cmd.type, error: 'Tersane kurulu değil.', timeMs: this.state.timeMs };
        }
        if (cmd.shipType === 'battleship' && planet.buildings.shipyard < 3) {
          return { success: false, commandType: cmd.type, error: 'Savaş Gemisi için Tersane Seviye 3+ gereklidir.', timeMs: this.state.timeMs };
        }
        if (cmd.count <= 0) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz gemi adedi.', timeMs: this.state.timeMs };
        }

        const playerLoadout = this.state.shipLoadouts?.[playerId]?.[cmd.shipType] || DEFAULT_LOADOUTS[cmd.shipType];
        const stats = getModifiedShipStats(cmd.shipType, playerLoadout);
        const totalOre = stats.cost.ore * cmd.count;
        const totalCrystal = stats.cost.crystal * cmd.count;
        const totalFuel = stats.cost.fuel * cmd.count;

        if (
          planet.resources.ore < totalOre ||
          planet.resources.crystal < totalCrystal ||
          planet.resources.fuel < totalFuel
        ) {
          return { success: false, commandType: cmd.type, error: 'Yetersiz kaynak.', timeMs: this.state.timeMs };
        }

        planet.resources.ore -= totalOre;
        planet.resources.crystal -= totalCrystal;
        planet.resources.fuel -= totalFuel;

        const isBastion = planet.specialization === 'military_bastion';
        let unitBuildTimeMs = getShipBuildDurationMs(cmd.shipType, planet.buildings.shipyard);
        if (isBastion) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs * 0.85)); // -15% ship build duration
        }
        // Starbase Shipyard Bay bonus: -25% build duration per shipyard bay in system
        const sysStarbase = this.state.starbases?.[planet.systemId];
        if (sysStarbase && sysStarbase.ownerId === planet.ownerId) {
          const shipyardBays = sysStarbase.modules.filter((m) => m === 'shipyard_bay').length;
          if (shipyardBays > 0) {
            unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs / (1 + shipyardBays * 0.25)));
          }
        }
        if (this.isSenateResolutionActive('military_readiness')) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs / 1.10)); // +10% build speed
        }
        const megaBonuses = getPlayerMegastructureBonuses(this.state, playerId);
        if (megaBonuses.shipBuildSpeedMultiplier > 1.0) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs / megaBonuses.shipBuildSpeedMultiplier));
        }
        const councilBonuses = getCouncilEmpireBonuses(this.state, playerId);
        if (councilBonuses.shipBuildSpeedMultiplier > 1.0) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs / councilBonuses.shipBuildSpeedMultiplier));
        }
        const traditionShipTimeMod = getTraditionShipyardTimeModifier(this.state, playerId);
        if (traditionShipTimeMod < 1.0) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs * traditionShipTimeMod));
        }
        const relicConstMod = getRelicConstructionMultiplier(this.state, playerId);
        if (relicConstMod < 1.0) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs * relicConstMod));
        }
        const nextFinish = (planet.shipyardQueue.length === 0)
          ? this.state.timeMs + unitBuildTimeMs
          : planet.shipyardQueue[planet.shipyardQueue.length - 1].nextUnitFinishTime + unitBuildTimeMs;

        planet.shipyardQueue.push({
          shipType: cmd.shipType,
          count: cmd.count,
          completed: 0,
          unitBuildTimeMs,
          nextUnitFinishTime: nextFinish,
        });

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { count: cmd.count, shipType: cmd.shipType },
        };
      }

      case 'BUILD_DEFENSES': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (planet.buildings.shipyard < 1) {
          return { success: false, commandType: cmd.type, error: 'Savunma bataryaları için Tersane (Seviye 1+) gereklidir.', timeMs: this.state.timeMs };
        }
        if (cmd.defenseType === 'plasma_turret' && planet.buildings.shipyard < 2) {
          return { success: false, commandType: cmd.type, error: 'Ağır Plazma Tareti için Tersane Seviye 2+ gereklidir.', timeMs: this.state.timeMs };
        }
        if (cmd.defenseType === 'ion_cannon' && planet.buildings.shipyard < 3) {
          return { success: false, commandType: cmd.type, error: 'İyon Topu Bataryası için Tersane Seviye 3+ gereklidir.', timeMs: this.state.timeMs };
        }
        if (cmd.count <= 0) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz batarya adedi.', timeMs: this.state.timeMs };
        }

        const stats = DEFENSE_STATS[cmd.defenseType];
        if (!stats) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz savunma tipi.', timeMs: this.state.timeMs };
        }

        const totalOre = stats.cost.ore * cmd.count;
        const totalCrystal = stats.cost.crystal * cmd.count;
        const totalFuel = stats.cost.fuel * cmd.count;

        if (
          planet.resources.ore < totalOre ||
          planet.resources.crystal < totalCrystal ||
          planet.resources.fuel < totalFuel
        ) {
          return { success: false, commandType: cmd.type, error: 'Yetersiz kaynak.', timeMs: this.state.timeMs };
        }

        planet.resources.ore -= totalOre;
        planet.resources.crystal -= totalCrystal;
        planet.resources.fuel -= totalFuel;

        if (!planet.defenses) {
          planet.defenses = { missile_battery: 0, plasma_turret: 0, ion_cannon: 0 };
        }
        if (!planet.defenseQueue) {
          planet.defenseQueue = [];
        }

        const isBastion = planet.specialization === 'military_bastion';
        let unitBuildTimeMs = getDefenseBuildDurationMs(cmd.defenseType, planet.buildings.shipyard);
        if (isBastion) {
          unitBuildTimeMs = Math.max(1000, Math.round(unitBuildTimeMs * 0.80)); // -20% defense build duration
        }
        const nextFinish = (planet.defenseQueue.length === 0)
          ? this.state.timeMs + unitBuildTimeMs
          : planet.defenseQueue[planet.defenseQueue.length - 1].nextUnitFinishTime + unitBuildTimeMs;

        planet.defenseQueue.push({
          defenseType: cmd.defenseType,
          count: cmd.count,
          completed: 0,
          unitBuildTimeMs,
          nextUnitFinishTime: nextFinish,
        });

        this.logEvent(
          'defense_ordered',
          `${planet.name} için ${cmd.count}x ${stats.nameTr} inşa emri verildi.`,
          playerId
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { count: cmd.count, defenseType: cmd.defenseType },
        };
      }

      case 'DISPATCH_FLEET': {
        if (this.state.victory && (cmd.mission === 'attack' || cmd.mission === 'intercept')) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Galaktik zafer ilan edildi. Mevcut sezon tamamlandı, saldırı görevleri donduruldu.',
            timeMs: this.state.timeMs,
          };
        }

        if (player.vacationMode) {
          return { success: false, commandType: cmd.type, error: 'Tatil modundayken filo sevk edilemez.', timeMs: this.state.timeMs };
        }

        const originPlanet = this.state.planets[cmd.originPlanetId];
        if (!originPlanet || originPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Kalkış üssü bulunamadı.', timeMs: this.state.timeMs };
        }

        // Target checks for attacks
        if (cmd.mission === 'attack' && cmd.targetPlanetId && this.state.planets[cmd.targetPlanetId]) {
          const targetPlanet = this.state.planets[cmd.targetPlanetId];
          const targetOwner = this.state.players[targetPlanet.ownerId];

          if (targetOwner && targetOwner.id !== playerId) {
            // Target vacation mode check
            if (targetOwner.vacationMode) {
              return { success: false, commandType: cmd.type, error: 'Hedef oyuncu tatil modunda korumalıdır. Saldırı düzenlenemez.', timeMs: this.state.timeMs };
            }

            // Federation ally attack check (Phase 22)
            if (isFederationAlly(this.state, playerId, targetPlanet.ownerId)) {
              return {
                success: false,
                commandType: cmd.type,
                error: 'Aynı federasyon bünyesindeki bir müttefiğinize saldıramazsınız.',
                timeMs: this.state.timeMs,
              };
            }

            // Check attacker & defender newbie protection (unless in active war)
            const activeWar = isAtWar(this.state, playerId, targetPlanet.ownerId);
            if (!activeWar && this.state.timeMs < player.protectionUntilTime) {
              const remainingHours = Math.ceil((player.protectionUntilTime - this.state.timeMs) / (3600 * 1000));
              return {
                success: false,
                commandType: cmd.type,
                error: `Acemi koruması altındasınız (${remainingHours} sa kaldı). PvP saldırısı başlatamazsınız.`,
                timeMs: this.state.timeMs,
              };
            }

            // Check defender newbie protection
            if (!activeWar && this.state.timeMs < targetOwner.protectionUntilTime) {
              return {
                success: false,
                commandType: cmd.type,
                error: 'Hedef komutan acemi koruması altındadır. Saldırı düzenlenemez.',
                timeMs: this.state.timeMs,
              };
            }

            // Check active diplomatic truce / ceasefire
            if (this.hasActiveTruce(playerId, targetPlanet.ownerId)) {
              const exp = this.state.truces![this.getTruceKey(playerId, targetPlanet.ownerId)];
              const remainingSec = Math.max(1, Math.round((exp - this.state.timeMs) / 1000));
              return {
                success: false,
                commandType: cmd.type,
                error: `Hedef imparatorluk ile yürürlükte bir barış/ateşkes paktı bulunmaktadır (${remainingSec} sn kaldı).`,
                timeMs: this.state.timeMs,
              };
            }

            // Anti-Bash rule: Max 6 attacks on same target planet per 24 hours
            const dayAgo = this.state.timeMs - 24 * 3600 * 1000;
            const recentAttacksOnTarget = Object.values(this.state.fleets).filter(
              (f) =>
                f.ownerId === playerId &&
                f.mission === 'attack' &&
                f.targetPlanetId === cmd.targetPlanetId &&
                f.departureTime >= dayAgo
            ).length;

            if (recentAttacksOnTarget >= GAME_CONSTANTS.ANTI_BASH_MAX_ATTACKS_PER_24H) {
              return {
                success: false,
                commandType: cmd.type,
                error: `Anti-Bash Sınırı: 24 saat içinde aynı hedefe en fazla ${GAME_CONSTANTS.ANTI_BASH_MAX_ATTACKS_PER_24H} saldırı düzenlenebilir.`,
                timeMs: this.state.timeMs,
              };
            }
          }
        }

        // Intercept truce check
        if (cmd.mission === 'intercept' && cmd.targetFleetId && this.state.fleets[cmd.targetFleetId]) {
          const targetFleet = this.state.fleets[cmd.targetFleetId];
          if (targetFleet.ownerId !== playerId && this.hasActiveTruce(playerId, targetFleet.ownerId)) {
            const exp = this.state.truces![this.getTruceKey(playerId, targetFleet.ownerId)];
            const remainingSec = Math.max(1, Math.round((exp - this.state.timeMs) / 1000));
            return {
              success: false,
              commandType: cmd.type,
              error: `Hedef filo ile yürürlükte bir barış/ateşkes paktı bulunmaktadır (${remainingSec} sn kaldı).`,
              timeMs: this.state.timeMs,
            };
          }
        }

        // Verify ships in garrison
        let totalShips = 0;
        let totalCargoCap = 0;
        const playerLoadouts = this.state.shipLoadouts?.[playerId];
        for (const [type, count] of Object.entries(cmd.ships) as [ShipType, number][]) {
          if (count < 0 || (originPlanet.garrison[type] || 0) < count) {
            return { success: false, commandType: cmd.type, error: `Yetersiz ${SHIP_STATS[type].nameTr} garnizonda yok.`, timeMs: this.state.timeMs };
          }
          totalShips += count;
          const typeLoadout = playerLoadouts?.[type];
          const shipStats = typeLoadout ? getModifiedShipStats(type, typeLoadout) : SHIP_STATS[type];
          totalCargoCap += count * shipStats.cargoCapacity;
        }

        if (totalShips <= 0) {
          return { success: false, commandType: cmd.type, error: 'Hiç gemi seçilmedi.', timeMs: this.state.timeMs };
        }

        // Route check
        const engineLevel = player.research.engines || 0;
        const activeGateways = this.getActiveGatewaySystemIds(playerId);
        const activeRelays = getActiveHyperRelaySystemIds(this.state, playerId);
        const route = calculateRouteInfo(
          originPlanet.systemId,
          cmd.targetSystemId,
          cmd.ships,
          this.state.map.lanes,
          engineLevel,
          activeGateways,
          playerLoadouts,
          activeRelays
        );

        if (!route) {
          return { success: false, commandType: cmd.type, error: 'Hedef sisteme rota bulunamadı.', timeMs: this.state.timeMs };
        }

        let assignedAdmiralId: string | undefined = undefined;
        let effectiveDurationMs = route.durationMs;
        let effectiveFuelCost = route.fuelCost;
        let effectiveSpeed = route.speed;

        if (cmd.admiralId && this.state.admirals && this.state.admirals[cmd.admiralId]) {
          const candidateAdm = this.state.admirals[cmd.admiralId];
          if (candidateAdm.ownerId === playerId && !candidateAdm.assignedFleetId) {
            assignedAdmiralId = cmd.admiralId;
            const trait = ADMIRAL_TRAITS[candidateAdm.traitId];
            if (trait) {
              if (trait.speedMultiplier > 1) {
                effectiveSpeed = Math.round(effectiveSpeed * trait.speedMultiplier);
                effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / trait.speedMultiplier));
              }
              if (trait.fuelDiscount > 0) {
                effectiveFuelCost = Math.max(1, Math.round(effectiveFuelCost * (1 - trait.fuelDiscount)));
              }
            }
          }
        }

        const crisisMod = getRouteCrisisModifiers(this.state, route.path, this.state.timeMs);
        if (crisisMod.speedMultiplier < 1) {
          effectiveSpeed = Math.round(effectiveSpeed * crisisMod.speedMultiplier);
          effectiveDurationMs = Math.round(effectiveDurationMs / crisisMod.speedMultiplier);
        }
        if (crisisMod.fuelCostMultiplier > 1) {
          effectiveFuelCost = Math.round(effectiveFuelCost * crisisMod.fuelCostMultiplier);
        }

        const fleetDoctrine: FleetDoctrine = cmd.doctrine || 'balanced';
        if (fleetDoctrine === 'spearhead') {
          effectiveSpeed = Math.round(effectiveSpeed * 1.10);
          effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / 1.10));
        } else if (fleetDoctrine === 'fortress') {
          effectiveSpeed = Math.max(1, Math.round(effectiveSpeed * 0.90));
          effectiveDurationMs = Math.round(effectiveDurationMs / 0.90);
        }

        if (player.artifacts?.includes('rift_hyperdrive')) {
          effectiveSpeed = Math.round(effectiveSpeed * 1.10);
          effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / 1.10));
        }

        // Discovery Tradition Tier 3: +15% fleet speed (into_the_unknown)
        if (hasTradition(this.state, playerId, 'discovery', 3)) {
          effectiveSpeed = Math.round(effectiveSpeed * 1.15);
          effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / 1.15));
        }

        // Expansion Tradition Tier 1: -30% colonize fuel cost (new_frontiers)
        if (cmd.mission === 'colonize' && hasTradition(this.state, playerId, 'expansion', 1)) {
          effectiveFuelCost = Math.max(1, Math.round(effectiveFuelCost * 0.70));
        }

        // Synthetic Evolution Ascension Perk: -30% fleet fuel consumption
        if (hasAscensionPerk(this.state, playerId, 'synthetic_evolution')) {
          effectiveFuelCost = Math.max(1, Math.round(effectiveFuelCost * 0.70));
        }

        // Relic Active Triumph (Phase 18)
        const relicSpeedMult = getRelicSpeedMultiplier(this.state, playerId);
        if (relicSpeedMult > 1.0) {
          effectiveSpeed = Math.round(effectiveSpeed * relicSpeedMult);
          effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / relicSpeedMult));
        }
        const relicFuelMult = getRelicFuelCostMultiplier(this.state, playerId);
        if (relicFuelMult < 1.0) {
          effectiveFuelCost = Math.round(effectiveFuelCost * relicFuelMult);
        }

        // Paragon Speed & Fuel Modifiers (Phase 27)
        if (cmd.paragonId && this.state.paragons?.[cmd.paragonId]) {
          const p = this.state.paragons[cmd.paragonId];
          if (p.ownerId === playerId) {
            if (p.flagship?.isCommissioned && p.flagship.speedMultiplier > 1) {
              effectiveSpeed = Math.round(effectiveSpeed * p.flagship.speedMultiplier);
              effectiveDurationMs = Math.max(1000, Math.round(effectiveDurationMs / p.flagship.speedMultiplier));
            }
            if (p.destinyTraitId === 'kara_filo_doktrini') {
              effectiveFuelCost = Math.max(1, Math.round(effectiveFuelCost * 0.80));
            }
          }
        }

        // Cargo validation
        const cargo: Resources = {
          ore: cmd.cargo?.ore || 0,
          crystal: cmd.cargo?.crystal || 0,
          fuel: cmd.cargo?.fuel || 0,
        };
        const totalCargoWeight = cargo.ore + cargo.crystal + cargo.fuel;
        if (totalCargoWeight > totalCargoCap) {
          return { success: false, commandType: cmd.type, error: 'Yük filo taşıma kapasitesini aşıyor.', timeMs: this.state.timeMs };
        }

        // Check fuel & cargo resource availability on planet
        if (
          originPlanet.resources.fuel < effectiveFuelCost + cargo.fuel ||
          originPlanet.resources.ore < cargo.ore ||
          originPlanet.resources.crystal < cargo.crystal
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Gezegende yetersiz kaynak (Gerekli: ${effectiveFuelCost + cargo.fuel} Yakıt, ${cargo.ore} Cevher, ${cargo.crystal} Kristal).`,
            timeMs: this.state.timeMs,
          };
        }

        // Mission specific checks
        if (cmd.mission === 'colonize') {
          if ((cmd.ships.transport || 0) < 1) {
            return { success: false, commandType: cmd.type, error: 'Koloni kurmak için en az 1 Ağır Nakliye gereklidir.', timeMs: this.state.timeMs };
          }
          if (
            cargo.ore < GAME_CONSTANTS.COLONY_COST.ore ||
            cargo.crystal < GAME_CONSTANTS.COLONY_COST.crystal ||
            cargo.fuel < GAME_CONSTANTS.COLONY_COST.fuel
          ) {
            return {
              success: false,
              commandType: cmd.type,
              error: `Koloni malzemesi eksik (${GAME_CONSTANTS.COLONY_COST.ore}C, ${GAME_CONSTANTS.COLONY_COST.crystal}K, ${GAME_CONSTANTS.COLONY_COST.fuel}Y gerekli).`,
              timeMs: this.state.timeMs,
            };
          }
        }

        if (cmd.mission === 'intercept') {
          if (!cmd.targetFleetId || !this.state.fleets[cmd.targetFleetId]) {
            return { success: false, commandType: cmd.type, error: 'Önleme yapılacak hedef filo bulunamadı.', timeMs: this.state.timeMs };
          }
          const targetFleet = this.state.fleets[cmd.targetFleetId];
          const interceptCheck = checkInterceptionFeasibility(
            originPlanet.systemId,
            targetFleet,
            cmd.ships,
            this.state.map.lanes,
            engineLevel,
            this.state.timeMs
          );
          if (!interceptCheck.canIntercept) {
            return { success: false, commandType: cmd.type, error: interceptCheck.reason || 'Önleme yetişme hesabı başarısız.', timeMs: this.state.timeMs };
          }
        }

        // Deduct ships from garrison
        for (const [type, count] of Object.entries(cmd.ships) as [ShipType, number][]) {
          originPlanet.garrison[type] -= count;
        }

        // Deduct fuel & cargo from planet
        originPlanet.resources.fuel -= effectiveFuelCost;
        originPlanet.resources.ore -= cargo.ore;
        originPlanet.resources.crystal -= cargo.crystal;
        originPlanet.resources.fuel -= cargo.fuel;

        const fleetId = `fleet_${this.state.nextId++}`;
        const departureTime = this.state.timeMs;
        const arrivalTime = departureTime + effectiveDurationMs;
        const recallLockedAfterTime = departureTime + (effectiveDurationMs * GAME_CONSTANTS.RECALL_LOCK_RATIO);

        if (assignedAdmiralId && this.state.admirals && this.state.admirals[assignedAdmiralId]) {
          this.state.admirals[assignedAdmiralId].assignedFleetId = fleetId;
        }

        const newFleet: Fleet = {
          id: fleetId,
          name: `${player.name} Filosu #${fleetId.slice(-3)}`,
          ownerId: playerId,
          ships: { ...cmd.ships },
          cargo,
          originSystemId: originPlanet.systemId,
          targetSystemId: cmd.targetSystemId,
          path: route.path,
          pathIndex: 0,
          mission: cmd.mission,
          targetFleetId: cmd.targetFleetId,
          targetPlanetId: cmd.targetPlanetId,
          departureTime,
          arrivalTime,
          totalDistance: route.totalDistance,
          speed: effectiveSpeed,
          fuelCost: effectiveFuelCost,
          recallLockedAfterTime,
          isReturning: false,
          status: 'in_transit',
          admiralId: assignedAdmiralId,
          paragonId: cmd.paragonId,
          doctrine: fleetDoctrine,
          loadouts: playerLoadouts ? JSON.parse(JSON.stringify(playerLoadouts)) : undefined,
        };

        this.state.fleets[fleetId] = newFleet;

        if (cmd.paragonId && this.state.paragons?.[cmd.paragonId]) {
          assignParagon(this.state, playerId, cmd.paragonId, { type: 'fleet', targetId: fleetId });
        }

        this.scheduleEvent(effectiveDurationMs, 'fleet_arrival', { fleetId });

        this.logEvent(
          'fleet_dispatched',
          `${newFleet.name} sevk edildi -> ${cmd.mission.toUpperCase()} (${route.path.join(' -> ')}). Varış: ${Math.round(effectiveDurationMs / 1000)}s`,
          playerId
        );

        // Common Defense Pact: If an allied planet is attacked, broadcast alert & share sensor ping
        if (cmd.mission === 'attack' && cmd.targetPlanetId && this.state.planets[cmd.targetPlanetId]) {
          const targetPlanet = this.state.planets[cmd.targetPlanetId];
          const targetOwner = this.state.players[targetPlanet.ownerId];
          if (targetOwner?.allianceId && this.state.alliances[targetOwner.allianceId]) {
            const ally = this.state.alliances[targetOwner.allianceId];
            for (const memberId of ally.memberIds) {
              if (memberId !== playerId) {
                this.logEvent(
                  'alliance_defense_alert',
                  `🚨 ORTAK SAVUNMA ALARMI: [${ally.tag}] Müttefik ${targetOwner.name} kolonisini (${targetPlanet.name}) hedef alan düşman filosu tespit edildi!`,
                  memberId,
                  { attackerId: playerId, targetPlanetId: targetPlanet.id, etaMs: route.durationMs }
                );
                const allyMember = this.state.players[memberId];
                if (allyMember) {
                  allyMember.intel.discoveredSystems[originPlanet.systemId] = 'sensor_contact';
                }
              }
            }
          }
        }

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId, arrivalTime, durationMs: effectiveDurationMs },
        };
      }

      case 'RECALL_FLEET': {
        const fleet = this.state.fleets[cmd.fleetId];
        if (!fleet || fleet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Filo bulunamadı.', timeMs: this.state.timeMs };
        }
        if (fleet.isReturning) {
          return { success: false, commandType: cmd.type, error: 'Filo zaten geri dönüş rotasında.', timeMs: this.state.timeMs };
        }
        if (this.state.timeMs >= fleet.recallLockedAfterTime) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Son yaklaşma kilitlendi: Yolculuğun %50’si aşıldı, geri çağrılamaz.',
            timeMs: this.state.timeMs,
          };
        }

        // Calculate return journey
        const elapsed = this.state.timeMs - fleet.departureTime;
        fleet.isReturning = true;
        fleet.status = 'returning';
        fleet.departureTime = this.state.timeMs;
        fleet.arrivalTime = this.state.timeMs + elapsed; // takes same elapsed time to return

        // Swap origin & target
        const temp = fleet.originSystemId;
        fleet.originSystemId = fleet.targetSystemId;
        fleet.targetSystemId = temp;

        this.scheduleEvent(elapsed, 'fleet_arrival', { fleetId: fleet.id });

        this.logEvent('fleet_recalled', `${fleet.name} geri çağrıldı.`, playerId);

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { returnEta: fleet.arrivalTime },
        };
      }

      case 'SET_PLANET_STANCE': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        planet.stance = cmd.stance;
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'CREATE_ALLIANCE': {
        if (player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Zaten bir ittifaka üyesiniz.', timeMs: this.state.timeMs };
        }
        const allianceId = `ally_${this.state.nextId++}`;
        this.state.alliances[allianceId] = {
          id: allianceId,
          name: cmd.name,
          tag: cmd.tag.toUpperCase(),
          founderId: playerId,
          memberIds: [playerId],
          createdAt: this.state.timeMs,
          treasury: { ore: 0, crystal: 0, fuel: 0 },
        };
        player.allianceId = allianceId;
        this.logEvent('alliance_created', `[${cmd.tag}] ${cmd.name} ittifakı kuruldu (Kurucu: ${player.name}).`, playerId);
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { allianceId } };
      }

      case 'JOIN_ALLIANCE': {
        if (player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Önce mevcut ittifakınızdan ayrılmalısınız.', timeMs: this.state.timeMs };
        }
        const ally = this.state.alliances[cmd.allianceId];
        if (!ally) {
          return { success: false, commandType: cmd.type, error: 'İttifak bulunamadı.', timeMs: this.state.timeMs };
        }
        ally.memberIds.push(playerId);
        player.allianceId = ally.id;
        this.logEvent('alliance_joined', `${player.name} [${ally.tag}] ${ally.name} ittifakına katıldı.`, playerId);
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { allianceId: ally.id } };
      }

      case 'LEAVE_ALLIANCE': {
        if (!player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Herhangi bir ittifakta değilsiniz.', timeMs: this.state.timeMs };
        }
        const ally = this.state.alliances[player.allianceId];
        if (ally) {
          ally.memberIds = ally.memberIds.filter(id => id !== playerId);
          if (ally.memberIds.length === 0) {
            delete this.state.alliances[ally.id];
          }
        }
        player.allianceId = null;
        this.logEvent('alliance_left', `${player.name} ittifaktan ayrıldı.`, playerId);
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'DONATE_TO_ALLIANCE': {
        if (!player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Herhangi bir ittifakta değilsiniz.', timeMs: this.state.timeMs };
        }
        const ally = this.state.alliances[player.allianceId];
        if (!ally) {
          return { success: false, commandType: cmd.type, error: 'İttifak bulunamadı.', timeMs: this.state.timeMs };
        }
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (
          planet.resources.ore < cmd.resources.ore ||
          planet.resources.crystal < cmd.resources.crystal ||
          planet.resources.fuel < cmd.resources.fuel
        ) {
          return { success: false, commandType: cmd.type, error: 'Gezegende yeterli kaynak bulunmuyor.', timeMs: this.state.timeMs };
        }

        planet.resources.ore -= cmd.resources.ore;
        planet.resources.crystal -= cmd.resources.crystal;
        planet.resources.fuel -= cmd.resources.fuel;

        if (!ally.treasury) ally.treasury = { ore: 0, crystal: 0, fuel: 0 };
        ally.treasury.ore += cmd.resources.ore;
        ally.treasury.crystal += cmd.resources.crystal;
        ally.treasury.fuel += cmd.resources.fuel;

        this.logEvent(
          'alliance_donation',
          `${player.name} [${ally.tag}] kasasına ${cmd.resources.ore}C, ${cmd.resources.crystal}K, ${cmd.resources.fuel}Y bağışladı.`,
          playerId
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { treasury: ally.treasury } };
      }

      case 'WITHDRAW_FROM_ALLIANCE': {
        if (!player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Herhangi bir ittifakta değilsiniz.', timeMs: this.state.timeMs };
        }
        const ally = this.state.alliances[player.allianceId];
        if (!ally) {
          return { success: false, commandType: cmd.type, error: 'İttifak bulunamadı.', timeMs: this.state.timeMs };
        }
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (!ally.treasury) ally.treasury = { ore: 0, crystal: 0, fuel: 0 };

        if (
          ally.treasury.ore < cmd.resources.ore ||
          ally.treasury.crystal < cmd.resources.crystal ||
          ally.treasury.fuel < cmd.resources.fuel
        ) {
          return { success: false, commandType: cmd.type, error: 'İttifak kasasında yeterli kaynak yok.', timeMs: this.state.timeMs };
        }

        const addedOre = Math.min(planet.storageCap - planet.resources.ore, cmd.resources.ore);
        const addedCrystal = Math.min(planet.storageCap - planet.resources.crystal, cmd.resources.crystal);
        const addedFuel = Math.min(planet.storageCap - planet.resources.fuel, cmd.resources.fuel);

        ally.treasury.ore -= addedOre;
        ally.treasury.crystal -= addedCrystal;
        ally.treasury.fuel -= addedFuel;

        planet.resources.ore += addedOre;
        planet.resources.crystal += addedCrystal;
        planet.resources.fuel += addedFuel;

        this.logEvent(
          'alliance_withdrawal',
          `${player.name} [${ally.tag}] kasasından ${addedOre}C, ${addedCrystal}K, ${addedFuel}Y çekti.`,
          playerId
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { treasury: ally.treasury } };
      }

      case 'ALLIANCE_TRANSFER_RESOURCES': {
        if (!player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Herhangi bir ittifakta değilsiniz.', timeMs: this.state.timeMs };
        }
        const sourcePlanet = this.state.planets[cmd.sourcePlanetId];
        if (!sourcePlanet || sourcePlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Kaynak gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        const targetPlanet = this.state.planets[cmd.targetPlanetId];
        if (!targetPlanet) {
          return { success: false, commandType: cmd.type, error: 'Hedef gezegen bulunamadı.', timeMs: this.state.timeMs };
        }
        const targetOwner = this.state.players[targetPlanet.ownerId];
        if (!targetOwner || targetOwner.allianceId !== player.allianceId) {
          return { success: false, commandType: cmd.type, error: 'Hedef gezegen ittifak üyenize ait değil.', timeMs: this.state.timeMs };
        }
        if (
          sourcePlanet.resources.ore < cmd.resources.ore ||
          sourcePlanet.resources.crystal < cmd.resources.crystal ||
          sourcePlanet.resources.fuel < cmd.resources.fuel
        ) {
          return { success: false, commandType: cmd.type, error: 'Kaynak gezegende yeterli kaynak yok.', timeMs: this.state.timeMs };
        }

        const deliveredOre = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.ore), cmd.resources.ore);
        const deliveredCrystal = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.crystal), cmd.resources.crystal);
        const deliveredFuel = Math.min(Math.max(0, targetPlanet.storageCap - targetPlanet.resources.fuel), cmd.resources.fuel);

        sourcePlanet.resources.ore -= cmd.resources.ore;
        sourcePlanet.resources.crystal -= cmd.resources.crystal;
        sourcePlanet.resources.fuel -= cmd.resources.fuel;

        targetPlanet.resources.ore += deliveredOre;
        targetPlanet.resources.crystal += deliveredCrystal;
        targetPlanet.resources.fuel += deliveredFuel;

        this.logEvent(
          'alliance_resource_transfer',
          `${player.name} müttefik ${targetOwner.name} kolonisinde (${targetPlanet.name}) ${deliveredOre} Cevher, ${deliveredCrystal} Kristal, ${deliveredFuel} Yakıt nakliyesi sağladı.`,
          targetPlanet.ownerId,
          { fromPlayerId: playerId, targetPlanetId: targetPlanet.id, delivered: { ore: deliveredOre, crystal: deliveredCrystal, fuel: deliveredFuel } }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { delivered: { ore: deliveredOre, crystal: deliveredCrystal, fuel: deliveredFuel } },
        };
      }

      case 'TOGGLE_VACATION_MODE': {
        if (player.vacationMode) {
          player.vacationMode = false;
          this.logEvent('vacation_disabled', `${player.name} tatil modundan çıktı. Üretim ve koruma normale döndü.`, playerId);
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { vacationMode: false } };
        } else {
          // Check for active outbound fleets
          const hasActiveFleets = Object.values(this.state.fleets).some(
            f => f.ownerId === playerId && f.status !== 'destroyed'
          );
          if (hasActiveFleets) {
            return {
              success: false,
              commandType: cmd.type,
              error: 'Tatil moduna geçmek için tüm filolarınızın üslerine dönmüş olması gerekir.',
              timeMs: this.state.timeMs,
            };
          }
          player.vacationMode = true;
          this.logEvent('vacation_enabled', `${player.name} tatil moduna geçti. Üretim durdu ve saldırılara karşı koruma aktif.`, playerId);
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { vacationMode: true } };
        }
      }

      case 'MARKET_TRADE': {
        const { planetId, sellResource, buyResource, sellAmount } = cmd;
        const planet = this.state.planets[planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz koloni veya erişim yetkisi yok.', timeMs: this.state.timeMs };
        }
        if (!sellResource || !buyResource || sellResource === buyResource) {
          return { success: false, commandType: cmd.type, error: 'Aynı kaynak türü arasında takas yapılamaz.', timeMs: this.state.timeMs };
        }
        if (typeof sellAmount !== 'number' || sellAmount <= 0 || isNaN(sellAmount)) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz takas miktarı.', timeMs: this.state.timeMs };
        }
        if (planet.resources[sellResource] < sellAmount) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak. Kolonide mevcut ${sellResource}: ${Math.floor(planet.resources[sellResource])}`,
            timeMs: this.state.timeMs,
          };
        }

        // Calculate Fee
        let feeRate = this.state.market.baseFeeRate;
        if (player.allianceId) feeRate -= 0.05;
        const sensorTech = player.research?.sensors || 0;
        if (sensorTech >= 2) feeRate -= 0.025;
        if (sensorTech >= 4) feeRate -= 0.025;
        if (this.isSenateResolutionActive('free_trade')) {
          feeRate -= SENATE_CONSTANTS.FREE_TRADE_FEE_DISCOUNT_PERCENT;
        }
        if (this.isSenateResolutionActive('sanctions', playerId)) {
          feeRate += SENATE_CONSTANTS.SANCTIONS_MARKET_FEE_PENALTY_PERCENT;
        }
        const councilBonuses = getCouncilEmpireBonuses(this.state, playerId);
        if (councilBonuses.marketFeeDiscount > 0) {
          feeRate -= councilBonuses.marketFeeDiscount;
        }
        feeRate = Math.max(0.02, Math.min(0.50, feeRate));

        const sellPrice = this.state.market.rates[sellResource];
        const buyPrice = this.state.market.rates[buyResource];

        const grossCredits = sellAmount * sellPrice;
        const netCredits = grossCredits * (1 - feeRate);
        const buyAmount = Math.max(1, Math.floor(netCredits / buyPrice));
        const feePaid = Math.round(grossCredits * feeRate);

        // Deduct sold and add bought
        planet.resources[sellResource] -= sellAmount;
        planet.resources[buyResource] = Math.min(planet.storageCap, planet.resources[buyResource] + buyAmount);

        // Price elasticity
        const baseSell = this.state.market.baseRates[sellResource];
        const baseBuy = this.state.market.baseRates[buyResource];
        const priceImpactSell = Math.min(0.15, (sellAmount / 25000) * 0.05);
        this.state.market.rates[sellResource] = Math.max(baseSell * 0.4, Number((this.state.market.rates[sellResource] * (1 - priceImpactSell)).toFixed(3)));
        const priceImpactBuy = Math.min(0.15, (buyAmount / 25000) * 0.05);
        this.state.market.rates[buyResource] = Math.min(baseBuy * 2.5, Number((this.state.market.rates[buyResource] * (1 + priceImpactBuy)).toFixed(3)));

        this.state.market.volume24h[sellResource] += sellAmount;
        this.state.market.volume24h[buyResource] += buyAmount;

        const transaction: MarketTransaction = {
          id: `tx_${this.state.nextId++}`,
          timestamp: this.state.timeMs,
          playerId,
          playerName: player.name,
          sellResource,
          sellAmount,
          buyResource,
          buyAmount,
          effectiveRate: Number((buyAmount / sellAmount).toFixed(3)),
          feePaid,
        };

        this.state.market.transactionHistory.unshift(transaction);
        if (this.state.market.transactionHistory.length > 50) {
          this.state.market.transactionHistory.pop();
        }

        const resLabels: Record<ResourceType, string> = { ore: 'Cevher', crystal: 'Kristal', fuel: 'Yakıt' };
        this.logEvent(
          'market_trade',
          `${player.name}, ${planet.name} pazarında ${sellAmount} ${resLabels[sellResource]} satıp ${buyAmount} ${resLabels[buyResource]} aldı (Komisyon: %${Math.round(feeRate * 100)}).`,
          playerId,
          { sellResource, sellAmount, buyResource, buyAmount, feeRate }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: {
            transaction,
            newRates: this.state.market.rates,
          },
        };
      }

      case 'LAUNCH_ESPIONAGE_OP': {
        const { originPlanetId, targetPlanetId, opType, scoutCount } = cmd;
        const originPlanet = this.state.planets[originPlanetId];
        if (!originPlanet || originPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz üs kolonisi veya yetkisiz erişim.', timeMs: this.state.timeMs };
        }
        const targetPlanet = this.state.planets[targetPlanetId];
        if (!targetPlanet) {
          return { success: false, commandType: cmd.type, error: 'Hedef koloni bulunamadı.', timeMs: this.state.timeMs };
        }
        if (targetPlanet.ownerId === playerId) {
          return { success: false, commandType: cmd.type, error: 'Kendi koloninize casusluk operasyonu düzenleyemezsiniz.', timeMs: this.state.timeMs };
        }
        const validOpTypes: EspionageOpType[] = ['infiltrate_intel', 'sabotage_shipyard', 'tech_espionage', 'destabilize_production'];
        if (!validOpTypes.includes(opType)) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz casusluk operasyon türü.', timeMs: this.state.timeMs };
        }

        const count = Math.max(1, Math.min(5, Math.floor(scoutCount || 1)));
        if ((originPlanet.garrison.scout || 0) < count) {
          return { success: false, commandType: cmd.type, error: `Yetersiz keşif sondası. Görev için ${count}x Keşif Gemisi (Scout) gereklidir.`, timeMs: this.state.timeMs };
        }

        const originSys = this.state.map.systems[originPlanet.systemId];
        const targetSys = this.state.map.systems[targetPlanet.systemId];
        const distance = Math.round(Math.hypot(targetSys.x - originSys.x, targetSys.y - originSys.y));

        const fuelCost = Math.max(15, Math.round(count * (15 + distance * 0.08)));
        if (originPlanet.resources.fuel < fuelCost) {
          return { success: false, commandType: cmd.type, error: `Yetersiz yakıt. Operasyon için ${fuelCost} Yakıt gereklidir.`, timeMs: this.state.timeMs };
        }

        originPlanet.resources.fuel -= fuelCost;
        originPlanet.garrison.scout -= count;

        const engineTech = player.research?.engines || 0;
        const speed = SHIP_STATS.scout.speed * (1 + engineTech * 0.15);
        const durationMs = Math.max(2000, Math.round((distance / speed) * 1000));

        const opId = `esp_${this.state.nextId++}`;
        const op: EspionageOp = {
          id: opId,
          originPlanetId,
          targetPlanetId,
          targetSystemId: targetSys.id,
          targetPlayerId: targetPlanet.ownerId,
          infiltratorId: playerId,
          opType,
          scoutCount: count,
          departureTime: this.state.timeMs,
          arrivalTime: this.state.timeMs + durationMs,
          status: 'in_transit',
        };

        if (!this.state.espionageOps) this.state.espionageOps = [];
        this.state.espionageOps.push(op);

        this.scheduleEvent(durationMs, 'espionage_op_arrival', { opId });

        this.logEvent(
          'espionage_launched',
          `${player.name}, ${targetPlanet.name} hedefine ${count}x Casus Sondası sevk etti (${opType}).`,
          playerId,
          { opId, targetPlanetId, opType }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { op, fuelCost, durationMs },
        };
      }

      case 'RECRUIT_ADMIRAL': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen üssü bulunamadı.', timeMs: this.state.timeMs };
        }
        const cost = { crystal: 200, fuel: 100 };
        if (planet.resources.crystal < cost.crystal || planet.resources.fuel < cost.fuel) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }
        planet.resources.crystal -= cost.crystal;
        planet.resources.fuel -= cost.fuel;

        if (!this.state.admirals) {
          this.state.admirals = {};
        }
        const admiralId = `admiral_${playerId}_${this.state.nextId++}`;
        const newAdmiral: Admiral = {
          id: admiralId,
          ownerId: playerId,
          name: cmd.name,
          title: cmd.title,
          avatar: cmd.avatar,
          level: 1,
          xp: 0,
          xpToNextLevel: 200,
          traitId: cmd.traitId,
          assignedFleetId: null,
          assignedPlanetId: cmd.planetId,
          battlesWon: 0,
          battlesLost: 0,
          recruitedAt: this.state.timeMs,
        };
        this.state.admirals[admiralId] = newAdmiral;
        this.logEvent('admiral_recruited', `Komutan ${newAdmiral.name} (${newAdmiral.title}) hizmete alındı.`, playerId);

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { admiralId } };
      }

      case 'ASSIGN_ADMIRAL': {
        const adm = this.state.admirals ? this.state.admirals[cmd.admiralId] : null;
        if (!adm || adm.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Komutan bulunamadı.', timeMs: this.state.timeMs };
        }
        adm.assignedFleetId = cmd.fleetId || null;
        adm.assignedPlanetId = cmd.planetId || null;
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'DISMISS_ADMIRAL': {
        const adm = this.state.admirals ? this.state.admirals[cmd.admiralId] : null;
        if (!adm || adm.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Komutan bulunamadı.', timeMs: this.state.timeMs };
        }
        if (this.state.admirals) {
          delete this.state.admirals[cmd.admiralId];
        }
        this.logEvent('admiral_dismissed', `Komutan ${adm.name} görevden ayrıldı.`, playerId);
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'SEND_TRANSMISSION': {
        const sender = this.state.players[playerId];
        if (!sender) {
          return { success: false, commandType: cmd.type, error: 'Gönderici oyuncu bulunamadı.', timeMs: this.state.timeMs };
        }
        if (cmd.recipientId !== 'all' && !this.state.players[cmd.recipientId]) {
          return { success: false, commandType: cmd.type, error: 'Alıcı imparatorluk bulunamadı.', timeMs: this.state.timeMs };
        }

        // If trade offer, check sender has at least the offered resources across their empire
        if (cmd.tradeOffer) {
          const myPlanets = Object.values(this.state.planets).filter((p) => p.ownerId === playerId);
          const totalRes = myPlanets.reduce(
            (acc, p) => {
              acc.ore += p.resources.ore;
              acc.crystal += p.resources.crystal;
              acc.fuel += p.resources.fuel;
              return acc;
            },
            { ore: 0, crystal: 0, fuel: 0 }
          );
          if (
            totalRes.ore < cmd.tradeOffer.give.ore ||
            totalRes.crystal < cmd.tradeOffer.give.crystal ||
            totalRes.fuel < cmd.tradeOffer.give.fuel
          ) {
            return {
              success: false,
              commandType: cmd.type,
              error: 'Teklif edilen takas kaynakları depolarınızda mevcut değil.',
              timeMs: this.state.timeMs,
            };
          }
        }

        if (!this.state.transmissions) this.state.transmissions = {};
        const transmissionId = `trans_${this.state.nextId++}`;
        const transmission: RadioTransmission = {
          id: transmissionId,
          senderId: playerId,
          senderName: sender.name,
          senderColor: sender.color,
          senderArchetype: sender.botArchetype,
          recipientId: cmd.recipientId,
          type: cmd.transmissionType,
          title: cmd.title,
          message: cmd.message,
          timestampMs: this.state.timeMs,
          expiresAtMs: this.state.timeMs + (cmd.truceDurationMs || 30 * 60 * 1000),
          read: false,
          status: 'pending',
          systemId: cmd.systemId,
          tradeOffer: cmd.tradeOffer,
          truceDurationMs: cmd.truceDurationMs,
        };

        this.state.transmissions[transmissionId] = transmission;
        const targetName = cmd.recipientId === 'all' ? 'Tüm Galaksi' : this.state.players[cmd.recipientId]?.name || cmd.recipientId;
        this.logEvent(
          'transmission_sent',
          `${sender.name}, ${targetName} kanalına telsiz mesajı iletti: "${cmd.title}".`,
          playerId,
          { transmissionId, recipientId: cmd.recipientId, type: cmd.transmissionType }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { transmissionId, transmission },
        };
      }

      case 'RESPOND_TRANSMISSION': {
        if (!this.state.transmissions || !this.state.transmissions[cmd.transmissionId]) {
          return { success: false, commandType: cmd.type, error: 'Telsiz mesajı bulunamadı.', timeMs: this.state.timeMs };
        }
        const trans = this.state.transmissions[cmd.transmissionId];
        if (trans.recipientId !== 'all' && trans.recipientId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Bu mesaja yalnızca muhatap yanıt verebilir.', timeMs: this.state.timeMs };
        }
        if (trans.status !== 'pending') {
          return { success: false, commandType: cmd.type, error: `Bu mesaj zaten '${trans.status}' durumundadır.`, timeMs: this.state.timeMs };
        }

        const responder = this.state.players[playerId];

        if (cmd.action === 'dismiss') {
          trans.status = 'dismissed';
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
        }

        if (cmd.action === 'reject') {
          trans.status = 'rejected';
          this.logEvent(
            'transmission_rejected',
            `${responder?.name || playerId}, ${trans.senderName} tarafından sunulan "${trans.title}" teklifini reddetti.`,
            playerId,
            { transmissionId: trans.id }
          );
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
        }

        // action === 'accept'
        if (trans.type === 'trade_proposal' && trans.tradeOffer) {
          const senderPlanet = Object.values(this.state.planets).find((p) => p.ownerId === trans.senderId);
          const responderPlanet = Object.values(this.state.planets).find((p) => p.ownerId === playerId);

          if (!senderPlanet || !responderPlanet) {
            return { success: false, commandType: cmd.type, error: 'Tarafların ticaret üssü bulunamadı.', timeMs: this.state.timeMs };
          }

          if (
            senderPlanet.resources.ore < trans.tradeOffer.give.ore ||
            senderPlanet.resources.crystal < trans.tradeOffer.give.crystal ||
            senderPlanet.resources.fuel < trans.tradeOffer.give.fuel
          ) {
            return {
              success: false,
              commandType: cmd.type,
              error: `${trans.senderName} taahhüt ettiği kaynakları artık karşılayamıyor.`,
              timeMs: this.state.timeMs,
            };
          }

          if (
            responderPlanet.resources.ore < trans.tradeOffer.receive.ore ||
            responderPlanet.resources.crystal < trans.tradeOffer.receive.crystal ||
            responderPlanet.resources.fuel < trans.tradeOffer.receive.fuel
          ) {
            return {
              success: false,
              commandType: cmd.type,
              error: 'Takas için talep edilen kaynaklar depolarınızda eksik.',
              timeMs: this.state.timeMs,
            };
          }

          // Execute bilateral transfer
          senderPlanet.resources.ore = senderPlanet.resources.ore - trans.tradeOffer.give.ore + trans.tradeOffer.receive.ore;
          senderPlanet.resources.crystal = senderPlanet.resources.crystal - trans.tradeOffer.give.crystal + trans.tradeOffer.receive.crystal;
          senderPlanet.resources.fuel = senderPlanet.resources.fuel - trans.tradeOffer.give.fuel + trans.tradeOffer.receive.fuel;

          responderPlanet.resources.ore = responderPlanet.resources.ore - trans.tradeOffer.receive.ore + trans.tradeOffer.give.ore;
          responderPlanet.resources.crystal = responderPlanet.resources.crystal - trans.tradeOffer.receive.crystal + trans.tradeOffer.give.crystal;
          responderPlanet.resources.fuel = responderPlanet.resources.fuel - trans.tradeOffer.receive.fuel + trans.tradeOffer.give.fuel;

          trans.status = 'accepted';
          this.logEvent(
            'trade_deal_concluded',
            `DİPLOMATİK TİCARET ONAYLANDI: ${responder?.name || playerId} ile ${trans.senderName} maden takasını tamamladı.`,
            playerId,
            { transmissionId: trans.id, tradeOffer: trans.tradeOffer }
          );
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
        }

        if ((trans.type === 'truce_offer' || trans.type === 'coalition_proposal') && trans.truceDurationMs) {
          if (!this.state.truces) this.state.truces = {};
          const key = this.getTruceKey(trans.senderId, playerId);
          const expiresAtMs = this.state.timeMs + trans.truceDurationMs;
          this.state.truces[key] = expiresAtMs;
          trans.status = 'accepted';

          const durationMin = Math.round(trans.truceDurationMs / 60000);
          const isCoalition = trans.type === 'coalition_proposal';
          this.logEvent(
            isCoalition ? 'coalition_pact_established' : 'truce_established',
            isCoalition
              ? `KARŞI KOALİSYON PAKTI İMZALANDI: ${responder?.name || playerId} ve ${trans.senderName} hegemonya tehdidine karşı ${durationMin} dakika boyunca saldırmazlık paktı kurdu.`
              : `BARIŞ PAKTI İMZALANDI: ${responder?.name || playerId} ve ${trans.senderName} ${durationMin} dakika boyunca saldırmazlık ilan etti.`,
            playerId,
            { transmissionId: trans.id, expiresAtMs, isCoalition }
          );
          return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { expiresAtMs } };
        }

        trans.status = 'accepted';
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'RESET_SEASON': {
        const newSeed = cmd.seed || (this.state.seed + 100);
        this.resetGalaxySeason(newSeed);
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { newSeed },
        };
      }

      case 'SET_PLANET_SPECIALIZATION': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Gezegen bulunamadı veya imparatorluğunuza ait değil.',
            timeMs: this.state.timeMs,
          };
        }

        planet.specialization = cmd.specialization;
        const specLabels: Record<string, string> = {
          balanced: 'Dengeli Gelişim',
          mining_hub: 'Maden Dünyası (+%20 Üretim)',
          tech_haven: 'Bilim Cenneti (+%35 Araştırma/Sensör)',
          military_bastion: 'Askeri Hisar (+%30 Savunma Gücü)',
        };
        this.logEvent(
          'planet_specialization_set',
          `${planet.name} vali politikası '${specLabels[cmd.specialization] || cmd.specialization}' olarak güncellendi.`,
          playerId,
          { planetId: planet.id, specialization: cmd.specialization }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: planet.id, specialization: cmd.specialization },
        };
      }

      case 'CLAIM_DIRECTIVE_REWARD': {
        const player = this.state.players[playerId];
        if (!player) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Oyuncu bulunamadı.',
            timeMs: this.state.timeMs,
          };
        }

        if (!player.claimedDirectives) {
          player.claimedDirectives = [];
        }

        if (player.claimedDirectives.includes(cmd.directiveId)) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Bu direktifin ödülü daha önce talep edilmiş.',
            timeMs: this.state.timeMs,
          };
        }

        const directives = evaluatePlayerDirectives(this.state, playerId);
        const directive = directives.find((d) => d.id === cmd.directiveId);

        if (!directive) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Direktif bulunamadı.',
            timeMs: this.state.timeMs,
          };
        }

        if (!directive.isCompleted) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Direktif henüz tamamlanmadı (${Math.round(directive.progress * 100)}%).`,
            timeMs: this.state.timeMs,
          };
        }

        // Deliver rewards to target planet (or homeworld)
        const targetPlanet =
          (cmd.targetPlanetId && this.state.planets[cmd.targetPlanetId] && this.state.planets[cmd.targetPlanetId].ownerId === playerId)
            ? this.state.planets[cmd.targetPlanetId]
            : (Object.values(this.state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
               Object.values(this.state.planets).find((p) => p.ownerId === playerId));

        if (targetPlanet) {
          if (directive.reward.ore) {
            targetPlanet.resources.ore = Math.min(
              targetPlanet.storageCap,
              targetPlanet.resources.ore + directive.reward.ore
            );
          }
          if (directive.reward.crystal) {
            targetPlanet.resources.crystal = Math.min(
              targetPlanet.storageCap,
              targetPlanet.resources.crystal + directive.reward.crystal
            );
          }
          if (directive.reward.fuel) {
            targetPlanet.resources.fuel = Math.min(
              targetPlanet.storageCap,
              targetPlanet.resources.fuel + directive.reward.fuel
            );
          }
        }

        if (directive.reward.hegemonyPoints) {
          this.state.relay.weeklyPoints[playerId] =
            (this.state.relay.weeklyPoints[playerId] || 0) + directive.reward.hegemonyPoints;
          this.evaluateVictoryConditions();
        }

        if (directive.reward.admiralXp && this.state.admirals) {
          for (const adm of Object.values(this.state.admirals)) {
            if (adm.ownerId === playerId) {
              adm.xp += directive.reward.admiralXp;
              while (adm.xp >= adm.xpToNextLevel) {
                adm.level += 1;
                adm.xp -= adm.xpToNextLevel;
                adm.xpToNextLevel = Math.round(adm.xpToNextLevel * 1.5);
              }
              break;
            }
          }
        }

        player.claimedDirectives.push(cmd.directiveId);
        this.logEvent(
          'directive_claimed',
          `🎯 DİREKTİF ÖDÜLÜ ALINDI: "${directive.title}" başarıyla tamamlandı ve ödülleri aktarıldı!`,
          playerId,
          { directiveId: cmd.directiveId, reward: directive.reward }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { directiveId: cmd.directiveId, reward: directive.reward },
        };
      }

      case 'SET_FLEET_DOCTRINE': {
        const fleet = this.state.fleets[cmd.fleetId];
        if (!fleet || fleet.ownerId !== playerId) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Filo bulunamadı veya size ait değil.',
            timeMs: this.state.timeMs,
          };
        }

        fleet.doctrine = cmd.doctrine;
        const doctrineLabels: Record<string, string> = {
          balanced: 'Dengeli Doktrin',
          spearhead: 'Yıldırım Taarruzu (+%15 Ateş Gücü, +%10 Hız, +%10 Hasar Alma)',
          fortress: 'Ağır Hisar (-%10 Ateş Gücü, -%10 Hız, -%20 Hasar Alma)',
          hit_and_run: 'Vur-Kaç (%20 İhtimalle Yarım Hasar Sıyrılma)',
        };

        this.logEvent(
          'fleet_doctrine_set',
          `${fleet.name} muharebe doktrini '${doctrineLabels[cmd.doctrine] || cmd.doctrine}' olarak güncellendi.`,
          playerId,
          { fleetId: fleet.id, doctrine: cmd.doctrine }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId: fleet.id, doctrine: cmd.doctrine },
        };
      }

      case 'DISPATCH_SUPPLY_CONVOY': {
        const colony = this.state.planets[cmd.colonyPlanetId];
        if (!colony || colony.ownerId !== playerId) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Koloni bulunamadı veya size ait değil.',
            timeMs: this.state.timeMs,
          };
        }

        // Determine destination: homeworld or explicit target
        const targetPlanet = cmd.targetPlanetId
          ? this.state.planets[cmd.targetPlanetId]
          : Object.values(this.state.planets).find((p) => p.ownerId === playerId && p.isHomeworld);

        if (!targetPlanet || targetPlanet.ownerId !== playerId) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'İkmal hedefi geçerli bir ana üs veya koloni değil.',
            timeMs: this.state.timeMs,
          };
        }

        if (targetPlanet.id === colony.id) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Hedef koloni ile kalkış üssü aynı olamaz.',
            timeMs: this.state.timeMs,
          };
        }

        // Check available transports in colony garrison
        const availableTransports = colony.garrison.transport || 0;
        if (availableTransports <= 0) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Kolonide sevk edilecek Ağır Nakliye gemisi bulunmuyor.',
            timeMs: this.state.timeMs,
          };
        }

        // Reserve safe buffer for colony operation (300 ore, 200 crystal, 100 fuel)
        const reserveBuffer: Resources = { ore: 300, crystal: 200, fuel: 100 };
        const surplusOre = Math.max(0, colony.resources.ore - reserveBuffer.ore);
        const surplusCrystal = Math.max(0, colony.resources.crystal - reserveBuffer.crystal);
        const rawSurplusFuel = Math.max(0, colony.resources.fuel - reserveBuffer.fuel);

        if (surplusOre <= 0 && surplusCrystal <= 0 && rawSurplusFuel <= 0) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Kolonide asgari güvenlik rezervi üzerinde aktarılacak ihtiyaç fazlası kaynak yok.',
            timeMs: this.state.timeMs,
          };
        }

        // Estimate route fuel consumption
        const engineLevel = player.research.engines || 0;
        const activeGateways = this.getActiveGatewaySystemIds(playerId);
        const activeRelays = getActiveHyperRelaySystemIds(this.state, playerId);
        const playerLoadouts = this.state.shipLoadouts?.[playerId];
        const testRoute = calculateRouteInfo(
          colony.systemId,
          targetPlanet.systemId,
          { scout: 0, transport: 1, fighter: 0, battleship: 0 },
          this.state.map.lanes,
          engineLevel,
          activeGateways,
          playerLoadouts,
          activeRelays
        );

        if (!testRoute) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Hedef ana üsse seyrüsefer rotası bulunamadı.',
            timeMs: this.state.timeMs,
          };
        }

        const transportStats = playerLoadouts?.transport ? getModifiedShipStats('transport', playerLoadouts.transport) : SHIP_STATS.transport;
        const transportCap = transportStats.cargoCapacity;
        const totalSurplusToShip = surplusOre + surplusCrystal + rawSurplusFuel;
        const neededTransports = Math.max(1, Math.min(availableTransports, Math.ceil(totalSurplusToShip / transportCap)));

        const actualRoute = calculateRouteInfo(
          colony.systemId,
          targetPlanet.systemId,
          { scout: 0, transport: neededTransports, fighter: 0, battleship: 0 },
          this.state.map.lanes,
          engineLevel,
          activeGateways,
          playerLoadouts,
          activeRelays
        );

        if (!actualRoute) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Rota hesaplanamadı.',
            timeMs: this.state.timeMs,
          };
        }

        if (colony.resources.fuel < actualRoute.fuelCost) {
          return {
            success: false,
            commandType: cmd.type,
            error: `İkmal konvoyu yakıtı yetersiz (Gerekli rota yakıtı: ${actualRoute.fuelCost} Yakıt).`,
            timeMs: this.state.timeMs,
          };
        }

        // Available cargo capacity
        const totalCapacity = neededTransports * transportCap;
        let remainingCap = totalCapacity;

        // Allocate ore
        const cargoOre = Math.min(surplusOre, remainingCap);
        remainingCap -= cargoOre;

        // Allocate crystal
        const cargoCrystal = Math.min(surplusCrystal, remainingCap);
        remainingCap -= cargoCrystal;

        // Allocate surplus fuel (after reserving flight fuel cost)
        const netFuelAvailableForCargo = Math.max(0, colony.resources.fuel - actualRoute.fuelCost - reserveBuffer.fuel);
        const cargoFuel = Math.min(netFuelAvailableForCargo, remainingCap);

        // Deduct from colony
        colony.garrison.transport -= neededTransports;
        colony.resources.fuel -= actualRoute.fuelCost;
        colony.resources.ore -= cargoOre;
        colony.resources.crystal -= cargoCrystal;
        colony.resources.fuel -= cargoFuel;

        const fleetId = `fleet_${this.state.nextId++}`;
        const departureTime = this.state.timeMs;
        const arrivalTime = departureTime + actualRoute.durationMs;
        const recallLockedAfterTime = departureTime + actualRoute.durationMs * GAME_CONSTANTS.RECALL_LOCK_RATIO;

        const newFleet: Fleet = {
          id: fleetId,
          name: `${colony.name} İkmal Konvoyu #${fleetId.slice(-3)}`,
          ownerId: playerId,
          ships: { scout: 0, transport: neededTransports, fighter: 0, battleship: 0 },
          cargo: { ore: cargoOre, crystal: cargoCrystal, fuel: cargoFuel },
          originSystemId: colony.systemId,
          targetSystemId: targetPlanet.systemId,
          path: actualRoute.path,
          pathIndex: 0,
          mission: 'transport',
          targetPlanetId: targetPlanet.id,
          departureTime,
          arrivalTime,
          totalDistance: actualRoute.totalDistance,
          speed: actualRoute.speed,
          fuelCost: actualRoute.fuelCost,
          recallLockedAfterTime,
          isReturning: false,
          status: 'in_transit',
          doctrine: 'balanced',
          loadouts: playerLoadouts ? JSON.parse(JSON.stringify(playerLoadouts)) : undefined,
        };

        this.state.fleets[fleetId] = newFleet;
        this.scheduleEvent(actualRoute.durationMs, 'fleet_arrival', { fleetId });

        this.logEvent(
          'fleet_dispatched',
          `📦 İKMAL SEVKİYATI: ${newFleet.name} (${neededTransports}x Nakliye) ${colony.name} -> ${targetPlanet.name} rotasına çıktı. Yük: ${cargoOre}C / ${cargoCrystal}K / ${cargoFuel}Y.`,
          playerId,
          { fleetId, cargo: newFleet.cargo, targetPlanetId: targetPlanet.id }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: {
            fleetId,
            transports: neededTransports,
            cargo: newFleet.cargo,
            arrivalTime,
            durationMs: actualRoute.durationMs,
          },
        };
      }

      case 'BUILD_STARBASE': {
        const targetSys = this.state.map.systems[cmd.systemId];
        if (!targetSys) {
          return { success: false, commandType: cmd.type, error: 'Sistem bulunamadı.', timeMs: this.state.timeMs };
        }
        if (this.state.starbases?.[cmd.systemId]) {
          return { success: false, commandType: cmd.type, error: 'Bu sistemde zaten bir yıldız üssü mevcut.', timeMs: this.state.timeMs };
        }
        const fundingPlanet = this.state.planets[cmd.planetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'İnşaat finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }
        const cost = STARBASE_TIER_CONFIG.outpost.cost;
        if (fundingPlanet.resources.ore < cost.ore || fundingPlanet.resources.crystal < cost.crystal || fundingPlanet.resources.fuel < cost.fuel) {
          return { success: false, commandType: cmd.type, error: 'Yetersiz kaynak (Gereken: 400 Cevher, 200 Kristal, 50 Yakıt).', timeMs: this.state.timeMs };
        }

        fundingPlanet.resources.ore -= cost.ore;
        fundingPlanet.resources.crystal -= cost.crystal;
        fundingPlanet.resources.fuel -= cost.fuel;

        if (!this.state.starbases) this.state.starbases = {};
        const newSb = createStarbase(cmd.systemId, playerId, 'outpost', this.state.timeMs);
        this.state.starbases[cmd.systemId] = newSb;

        this.logEvent(
          'starbase_built',
          `${targetSys.name} sisteminde yeni bir Yörünge Karakolu kuruldu.`,
          playerId,
          { systemId: cmd.systemId }
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { starbaseId: newSb.id } };
      }

      case 'UPGRADE_STARBASE': {
        const sb = this.state.starbases?.[cmd.systemId];
        if (!sb || sb.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Yıldız üssü bulunamadı veya size ait değil.', timeMs: this.state.timeMs };
        }
        if (sb.upgradeQueue) {
          return { success: false, commandType: cmd.type, error: 'Üs zaten bir yükseltme sürecinde.', timeMs: this.state.timeMs };
        }
        const nextTier = getNextStarbaseTier(sb.tier);
        if (!nextTier) {
          return { success: false, commandType: cmd.type, error: 'Üs zaten maksimum seviyede (Galaktik Hisar).', timeMs: this.state.timeMs };
        }
        const fundingPlanet = this.state.planets[cmd.planetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'İnşaat finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }
        const cfg = STARBASE_TIER_CONFIG[nextTier];
        if (fundingPlanet.resources.ore < cfg.cost.ore || fundingPlanet.resources.crystal < cfg.cost.crystal || fundingPlanet.resources.fuel < cfg.cost.fuel) {
          return { success: false, commandType: cmd.type, error: `Yetersiz kaynak (${cfg.cost.ore} Cevher, ${cfg.cost.crystal} Kristal, ${cfg.cost.fuel} Yakıt gerekli).`, timeMs: this.state.timeMs };
        }

        fundingPlanet.resources.ore -= cfg.cost.ore;
        fundingPlanet.resources.crystal -= cfg.cost.crystal;
        fundingPlanet.resources.fuel -= cfg.cost.fuel;

        const durationMs = cfg.buildTimeMs;
        sb.upgradeQueue = {
          targetTier: nextTier,
          startTime: this.state.timeMs,
          finishTime: this.state.timeMs + durationMs,
        };
        this.scheduleEvent(durationMs, 'starbase_upgraded', { systemId: cmd.systemId, targetTier: nextTier });

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { nextTier, finishTime: sb.upgradeQueue.finishTime } };
      }

      case 'INSTALL_STARBASE_MODULE': {
        const sb = this.state.starbases?.[cmd.systemId];
        if (!sb || sb.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Yıldız üssü bulunamadı veya size ait değil.', timeMs: this.state.timeMs };
        }
        const maxMods = STARBASE_TIER_CONFIG[sb.tier].maxModules;
        if (sb.modules.length >= maxMods) {
          return { success: false, commandType: cmd.type, error: `Modül kapasitesi dolu (Maks: ${maxMods}). Üssü yükseltin.`, timeMs: this.state.timeMs };
        }
        if (sb.moduleQueue) {
          return { success: false, commandType: cmd.type, error: 'Üs zaten bir modül montaj sürecinde.', timeMs: this.state.timeMs };
        }
        const modCfg = STARBASE_MODULE_CONFIG[cmd.moduleType];
        if (!modCfg) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz modül türü.', timeMs: this.state.timeMs };
        }
        const fundingPlanet = this.state.planets[cmd.planetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Montaj finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }
        if (fundingPlanet.resources.ore < modCfg.cost.ore || fundingPlanet.resources.crystal < modCfg.cost.crystal || fundingPlanet.resources.fuel < modCfg.cost.fuel) {
          return { success: false, commandType: cmd.type, error: `Yetersiz kaynak (${modCfg.cost.ore} Cevher, ${modCfg.cost.crystal} Kristal, ${modCfg.cost.fuel} Yakıt gerekli).`, timeMs: this.state.timeMs };
        }

        fundingPlanet.resources.ore -= modCfg.cost.ore;
        fundingPlanet.resources.crystal -= modCfg.cost.crystal;
        fundingPlanet.resources.fuel -= modCfg.cost.fuel;

        const durationMs = modCfg.buildTimeMs;
        sb.moduleQueue = {
          moduleType: cmd.moduleType,
          startTime: this.state.timeMs,
          finishTime: this.state.timeMs + durationMs,
        };
        this.scheduleEvent(durationMs, 'starbase_module_completed', { systemId: cmd.systemId, moduleType: cmd.moduleType });

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { moduleType: cmd.moduleType } };
      }

      case 'DISMANTLE_STARBASE_MODULE': {
        const sb = this.state.starbases?.[cmd.systemId];
        if (!sb || sb.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Yıldız üssü bulunamadı veya size ait değil.', timeMs: this.state.timeMs };
        }
        if (cmd.moduleIndex < 0 || cmd.moduleIndex >= sb.modules.length) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz modül indeksi.', timeMs: this.state.timeMs };
        }
        const removed = sb.modules.splice(cmd.moduleIndex, 1)[0];
        const modCfg = STARBASE_MODULE_CONFIG[removed];
        const refundOre = Math.floor((modCfg?.cost.ore || 0) * 0.5);
        const refundCrystal = Math.floor((modCfg?.cost.crystal || 0) * 0.5);

        // refund to homeworld or first planet
        const refundPlanet = Object.values(this.state.planets).find(p => p.ownerId === playerId && p.isHomeworld) ||
                             Object.values(this.state.planets).find(p => p.ownerId === playerId);
        if (refundPlanet) {
          refundPlanet.resources.ore = Math.min(refundPlanet.storageCap, refundPlanet.resources.ore + refundOre);
          refundPlanet.resources.crystal = Math.min(refundPlanet.storageCap, refundPlanet.resources.crystal + refundCrystal);
        }

        this.logEvent(
          'starbase_module_dismantled',
          `${this.state.map.systems[cmd.systemId]?.name || cmd.systemId} üssünden '${modCfg?.nameTr || removed}' söküldü (+%50 kaynak iadesi).`,
          playerId
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'PROPOSE_SENATE_RESOLUTION': {
        if (!this.state.senate) this.state.senate = createInitialSenateState();
        const player = this.state.players[playerId];
        if (!player) {
          return { success: false, commandType: cmd.type, error: 'Oyuncu bulunamadı.', timeMs: this.state.timeMs };
        }
        if (this.state.senate.currentSession) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Şu anda aktif bir senato oturumu devam ediyor. Yeni teklif için oturumun tamamlanmasını bekleyin.',
            timeMs: this.state.timeMs,
          };
        }
        if (isPlayerSanctioned(this.state, playerId)) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Yaptırım ve ambargo altındaki imparatorluklar Galaktik Senato\'ya yasa tasarısı sunamaz.',
            timeMs: this.state.timeMs,
          };
        }

        const resDef = SENATE_RESOLUTION_CONFIG[cmd.resolutionType];
        if (!resDef) {
          return { success: false, commandType: cmd.type, error: 'Bilinmeyen yasa tasarısı türü.', timeMs: this.state.timeMs };
        }

        if (resDef.requiresTarget && !cmd.targetPlayerId) {
          return {
            success: false,
            commandType: cmd.type,
            error: `'${resDef.nameTr}' için hedef bir imparatorluk seçilmelidir.`,
            timeMs: this.state.timeMs,
          };
        }

        if (cmd.targetPlayerId && !this.state.players[cmd.targetPlayerId]) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Hedef imparatorluk bulunamadı.',
            timeMs: this.state.timeMs,
          };
        }

        // Deduct deposit cost from homeworld
        const hw = Object.values(this.state.planets).find(p => p.ownerId === playerId && p.isHomeworld) ||
                   Object.values(this.state.planets).find(p => p.ownerId === playerId);
        const cost = resDef.baseDepositCost;
        if (!hw || hw.resources.ore < cost.ore || hw.resources.crystal < cost.crystal || hw.resources.fuel < cost.fuel) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yasa teklif harcı için yetersiz kaynak (Gerekli: ${cost.crystal} Kristal).`,
            timeMs: this.state.timeMs,
          };
        }

        hw.resources.ore -= cost.ore;
        hw.resources.crystal -= cost.crystal;
        hw.resources.fuel -= cost.fuel;

        const sessionDuration = SENATE_CONSTANTS.REGULAR_SESSION_DURATION_MS;
        const resolution: SenateResolution = {
          id: `res_${this.state.nextId++}`,
          type: cmd.resolutionType,
          targetPlayerId: cmd.targetPlayerId,
          proposedBy: playerId,
          proposedAt: this.state.timeMs,
          votingEndsAt: this.state.timeMs + sessionDuration,
          isEmergencySession: false,
          votes: {
            [playerId]: 'for',
          },
          status: 'active_session',
        };

        this.state.senate.currentSession = resolution;
        this.scheduleEvent(sessionDuration, 'senate_session_concluded', { resolutionId: resolution.id });

        const targetName = cmd.targetPlayerId ? (this.state.players[cmd.targetPlayerId]?.name || cmd.targetPlayerId) : '';
        const targetClause = targetName ? ` (Hedef: ${targetName})` : '';

        this.logEvent(
          'senate_resolution_proposed',
          `🏛️ SENATO OTURUMU BAŞLADI: ${player.name}, '${resDef.nameTr}'${targetClause} tasarısını oylamaya sundu! (Süre: 60s)`,
          playerId,
          { resolutionId: resolution.id, type: cmd.resolutionType, targetPlayerId: cmd.targetPlayerId }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { resolution },
        };
      }

      case 'CAST_SENATE_VOTE': {
        if (!this.state.senate) this.state.senate = createInitialSenateState();
        if (!this.state.senate.currentSession) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Şu anda oy kullanılabilecek aktif bir senato oturumu bulunmuyor.',
            timeMs: this.state.timeMs,
          };
        }
        if (!['for', 'against', 'abstain'].includes(cmd.vote)) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz oy türü.', timeMs: this.state.timeMs };
        }

        const session = this.state.senate.currentSession;
        session.votes[playerId] = cmd.vote;

        const voter = this.state.players[playerId];
        const voteLabel = cmd.vote === 'for' ? 'LEHTE' : cmd.vote === 'against' ? 'ALEYHTE' : 'ÇEKİMSER';
        const weight = calculateDiplomaticWeight(this.state, playerId).total;

        this.logEvent(
          'senate_vote_cast',
          `🗳️ ${voter?.name || 'Komutan'} senatoda ${voteLabel} oy kullandı (Ağırlık: ${weight} oy).`,
          playerId,
          { vote: cmd.vote, weight, resolutionId: session.id }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { vote: cmd.vote, weight, resolutionId: session.id },
        };
      }

      case 'CALL_EMERGENCY_SENATE_SESSION': {
        if (!this.state.senate) this.state.senate = createInitialSenateState();
        const player = this.state.players[playerId];
        if (!player) {
          return { success: false, commandType: cmd.type, error: 'Oyuncu bulunamadı.', timeMs: this.state.timeMs };
        }
        if (this.state.senate.currentSession) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Zaten aktif bir senato oturumu sürmektedir.',
            timeMs: this.state.timeMs,
          };
        }
        if (isPlayerSanctioned(this.state, playerId)) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Yaptırım altındaki imparatorluklar olağanüstü oturum çağıramaz.',
            timeMs: this.state.timeMs,
          };
        }

        const isCustodian = this.state.senate.custodianPlayerId === playerId;
        const hw = Object.values(this.state.planets).find(p => p.ownerId === playerId && p.isHomeworld) ||
                   Object.values(this.state.planets).find(p => p.ownerId === playerId);

        const cost = isCustodian
          ? { ore: 0, crystal: 0, fuel: 0 }
          : SENATE_CONSTANTS.EMERGENCY_SESSION_COST;

        if (!isCustodian) {
          if (!hw || hw.resources.ore < cost.ore || hw.resources.crystal < cost.crystal || hw.resources.fuel < cost.fuel) {
            return {
              success: false,
              commandType: cmd.type,
              error: `Olağanüstü senato oturumu için yetersiz kaynak (Gerekli: ${cost.crystal} Kristal, ${cost.fuel} Yakıt).`,
              timeMs: this.state.timeMs,
            };
          }
          hw.resources.ore -= cost.ore;
          hw.resources.crystal -= cost.crystal;
          hw.resources.fuel -= cost.fuel;
        }

        const resDef = SENATE_RESOLUTION_CONFIG[cmd.resolutionType];
        if (!resDef) {
          return { success: false, commandType: cmd.type, error: 'Bilinmeyen yasa tasarısı türü.', timeMs: this.state.timeMs };
        }
        if (resDef.requiresTarget && !cmd.targetPlayerId) {
          return { success: false, commandType: cmd.type, error: 'Hedef imparatorluk seçilmelidir.', timeMs: this.state.timeMs };
        }

        const sessionDuration = SENATE_CONSTANTS.EMERGENCY_SESSION_DURATION_MS;
        const resolution: SenateResolution = {
          id: `res_em_${this.state.nextId++}`,
          type: cmd.resolutionType,
          targetPlayerId: cmd.targetPlayerId,
          proposedBy: playerId,
          proposedAt: this.state.timeMs,
          votingEndsAt: this.state.timeMs + sessionDuration,
          isEmergencySession: true,
          votes: {
            [playerId]: 'for',
          },
          status: 'active_session',
        };

        this.state.senate.currentSession = resolution;
        this.scheduleEvent(sessionDuration, 'senate_session_concluded', { resolutionId: resolution.id });

        this.logEvent(
          'senate_emergency_called',
          `🚨 OLAĞANÜSTÜ SENATO OTURUMU: ${player.name} acil durum yetkisiyle '${resDef.nameTr}' tasarısını hızlı oylamaya sundu! (Süre: 25s)`,
          playerId,
          { resolutionId: resolution.id, type: cmd.resolutionType }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { resolution },
        };
      }

      case 'BUILD_MEGASTRUCTURE': {
        if (!this.state.megastructures) this.state.megastructures = {};
        const check = canBuildMegastructure(this.state, cmd.systemId, playerId, cmd.megastructureType);
        if (!check.canBuild) {
          return { success: false, commandType: cmd.type, error: check.reason, timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'İnşaat finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const def = MEGASTRUCTURE_CONFIGS[cmd.megastructureType];
        if (!def) {
          return { success: false, commandType: cmd.type, error: 'Bilinmeyen mega yapı türü.', timeMs: this.state.timeMs };
        }

        const stage1Cfg = def.stages[0];
        if (
          fundingPlanet.resources.ore < stage1Cfg.cost.ore ||
          fundingPlanet.resources.crystal < stage1Cfg.cost.crystal ||
          fundingPlanet.resources.fuel < stage1Cfg.cost.fuel
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${stage1Cfg.cost.ore} Cevher, ${stage1Cfg.cost.crystal} Kristal, ${stage1Cfg.cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= stage1Cfg.cost.ore;
        fundingPlanet.resources.crystal -= stage1Cfg.cost.crystal;
        fundingPlanet.resources.fuel -= stage1Cfg.cost.fuel;

        const megaId = `mega_${this.state.nextId++}`;
        const mega: Megastructure = {
          id: megaId,
          type: cmd.megastructureType,
          systemId: cmd.systemId,
          ownerId: playerId,
          stage: 0,
          maxStage: 3,
          status: 'under_construction',
          stageStartTimeMs: this.state.timeMs,
          stageFinishTimeMs: this.state.timeMs + stage1Cfg.buildTimeMs,
        };

        this.state.megastructures[megaId] = mega;
        this.scheduleEvent(stage1Cfg.buildTimeMs, 'megastructure_stage_completed', {
          megastructureId: megaId,
          targetStage: 1,
        });

        const sysName = this.state.map.systems[cmd.systemId]?.name || cmd.systemId;
        this.logEvent(
          'megastructure_construction_started',
          `🏗️ MEGA YAPI İNŞAATI BAŞLADI: ${sysName} sisteminde '${def.nameTr}' temel montajı başladı (Süre: ${Math.round(stage1Cfg.buildTimeMs / 1000)}s).`,
          playerId,
          { megastructureId: megaId, systemId: cmd.systemId, type: cmd.megastructureType }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { megastructureId: megaId, finishTime: mega.stageFinishTimeMs },
        };
      }

      case 'UPGRADE_MEGASTRUCTURE': {
        const mega = this.state.megastructures?.[cmd.megastructureId];
        if (!mega || mega.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Mega yapı bulunamadı veya size ait değil.', timeMs: this.state.timeMs };
        }
        if (mega.status === 'under_construction') {
          return { success: false, commandType: cmd.type, error: 'Mega yapı zaten bir inşaat/yükseltme sürecinde.', timeMs: this.state.timeMs };
        }
        if (mega.stage >= mega.maxStage) {
          return { success: false, commandType: cmd.type, error: 'Mega yapı zaten en üst aşamaya (Aşama III) ulaşmış durumda.', timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Yükseltme finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const def = MEGASTRUCTURE_CONFIGS[mega.type];
        const nextStage = mega.stage + 1;
        const nextStageCfg = def.stages[nextStage - 1];

        if (
          fundingPlanet.resources.ore < nextStageCfg.cost.ore ||
          fundingPlanet.resources.crystal < nextStageCfg.cost.crystal ||
          fundingPlanet.resources.fuel < nextStageCfg.cost.fuel
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${nextStageCfg.cost.ore} Cevher, ${nextStageCfg.cost.crystal} Kristal, ${nextStageCfg.cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= nextStageCfg.cost.ore;
        fundingPlanet.resources.crystal -= nextStageCfg.cost.crystal;
        fundingPlanet.resources.fuel -= nextStageCfg.cost.fuel;

        mega.status = 'under_construction';
        mega.stageStartTimeMs = this.state.timeMs;
        mega.stageFinishTimeMs = this.state.timeMs + nextStageCfg.buildTimeMs;

        this.scheduleEvent(nextStageCfg.buildTimeMs, 'megastructure_stage_completed', {
          megastructureId: mega.id,
          targetStage: nextStage,
        });

        const sysName = this.state.map.systems[mega.systemId]?.name || mega.systemId;
        this.logEvent(
          'megastructure_upgrade_started',
          `🏗️ MEGA YAPI YÜKSELTİLİYOR: ${sysName} sistemindeki '${def.nameTr}' ${nextStageCfg.nameTr} inşaatına başlandı.`,
          playerId,
          { megastructureId: mega.id, nextStage }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { megastructureId: mega.id, nextStage, finishTime: mega.stageFinishTimeMs },
        };
      }

      case 'CONSTRUCT_GATEWAY': {
        if (!this.state.gateways) this.state.gateways = {};
        const system = this.state.map.systems[cmd.systemId];
        if (!system) {
          return { success: false, commandType: cmd.type, error: 'Sistem bulunamadı.', timeMs: this.state.timeMs };
        }
        if (this.state.gateways[cmd.systemId]) {
          return { success: false, commandType: cmd.type, error: 'Bu sistemde zaten bir Alt-Uzay Ağ Geçidi bulunmaktadır.', timeMs: this.state.timeMs };
        }

        const ownsPlanet = Object.values(this.state.planets).some(p => p.systemId === cmd.systemId && p.ownerId === playerId);
        const ownsStarbase = this.state.starbases?.[cmd.systemId]?.ownerId === playerId;
        if (!ownsPlanet && !ownsStarbase) {
          return { success: false, commandType: cmd.type, error: 'Ağ Geçidi inşası için sistemde bir koloniniz veya Yıldız Üssünüz bulunmalıdır.', timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'İnşaat finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const cost = GATEWAY_CONFIG.CONSTRUCTION_COST;
        if (fundingPlanet.resources.ore < cost.ore || fundingPlanet.resources.crystal < cost.crystal || fundingPlanet.resources.fuel < cost.fuel) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= cost.ore;
        fundingPlanet.resources.crystal -= cost.crystal;
        fundingPlanet.resources.fuel -= cost.fuel;

        const gwId = `gw_${this.state.nextId++}`;
        const gw: Gateway = {
          id: gwId,
          systemId: cmd.systemId,
          ownerId: playerId,
          status: 'under_construction',
          activationStartTimeMs: this.state.timeMs,
          activationFinishTimeMs: this.state.timeMs + GATEWAY_CONFIG.CONSTRUCTION_TIME_MS,
        };

        this.state.gateways[cmd.systemId] = gw;
        this.scheduleEvent(GATEWAY_CONFIG.CONSTRUCTION_TIME_MS, 'gateway_activated', { systemId: cmd.systemId });

        const sysName = system.name;
        this.logEvent(
          'gateway_construction_started',
          `🌀 AĞ GEÇİDİ İNŞAATI BAŞLADI: ${sysName} sisteminde Alt-Uzay Ağ Geçidi inşasına başlandı (Süre: ${Math.round(GATEWAY_CONFIG.CONSTRUCTION_TIME_MS / 1000)}s).`,
          playerId,
          { systemId: cmd.systemId }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { gatewayId: gwId, finishTime: gw.activationFinishTimeMs },
        };
      }

      case 'ACTIVATE_GATEWAY': {
        const gw = this.state.gateways?.[cmd.systemId];
        if (!gw) {
          return { success: false, commandType: cmd.type, error: 'Sistemde Ağ Geçidi bulunamadı.', timeMs: this.state.timeMs };
        }
        if (gw.status === 'active') {
          return { success: false, commandType: cmd.type, error: 'Ağ Geçidi zaten aktif durumda.', timeMs: this.state.timeMs };
        }
        if (gw.status === 'under_construction') {
          return { success: false, commandType: cmd.type, error: 'Ağ Geçidi zaten aktivasyon sürecinde.', timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Aktivasyon finansmanı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const cost = GATEWAY_CONFIG.ACTIVATION_COST;
        if (fundingPlanet.resources.ore < cost.ore || fundingPlanet.resources.crystal < cost.crystal || fundingPlanet.resources.fuel < cost.fuel) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= cost.ore;
        fundingPlanet.resources.crystal -= cost.crystal;
        fundingPlanet.resources.fuel -= cost.fuel;

        gw.ownerId = playerId;
        gw.status = 'under_construction';
        gw.activationStartTimeMs = this.state.timeMs;
        gw.activationFinishTimeMs = this.state.timeMs + GATEWAY_CONFIG.ACTIVATION_TIME_MS;

        this.scheduleEvent(GATEWAY_CONFIG.ACTIVATION_TIME_MS, 'gateway_activated', { systemId: cmd.systemId });

        const sysName = this.state.map.systems[cmd.systemId]?.name || cmd.systemId;
        this.logEvent(
          'gateway_activation_started',
          `🌀 AĞ GEÇİDİ AKTİVASYONU: ${sysName} sistemindeki kadim Ağ Geçidinin çekirdeği yeniden enerjilendiriliyor (Süre: ${Math.round(GATEWAY_CONFIG.ACTIVATION_TIME_MS / 1000)}s).`,
          playerId,
          { systemId: cmd.systemId }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { gatewayId: gw.id, finishTime: gw.activationFinishTimeMs },
        };
      }

      case 'APPOINT_COUNCILOR': {
        if (!this.state.councils) this.state.councils = {};
        let council = this.state.councils[playerId];
        if (!council) {
          council = createDefaultImperialCouncil(playerId, this.state.players[playerId]?.name);
          this.state.councils[playerId] = council;
        }

        const leader = council.leaders[cmd.leaderId];
        if (!leader || leader.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Atanacak lider bulunamadı.', timeMs: this.state.timeMs };
        }

        // If leader is already assigned elsewhere, clear previous position
        if (leader.assignedPosition && leader.assignedPosition !== cmd.position) {
          council.positions[leader.assignedPosition] = null;
        }

        // If position already had another leader, clear their assignedPosition
        const prevLeaderId = council.positions[cmd.position];
        if (prevLeaderId && council.leaders[prevLeaderId]) {
          council.leaders[prevLeaderId].assignedPosition = null;
        }

        leader.assignedPosition = cmd.position;
        council.positions[cmd.position] = leader.id;

        const posName = COUNCIL_POSITION_INFO[cmd.position].nameTr;
        this.logEvent(
          'councilor_appointed',
          `🏛️ MAKAM ATAMASI: ${leader.name} (${leader.title}) ${posName} makamına atandı.`,
          playerId,
          { position: cmd.position, leaderId: leader.id }
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'DISMISS_COUNCILOR': {
        const council = this.state.councils?.[playerId];
        if (!council) {
          return { success: false, commandType: cmd.type, error: 'Hükümet Konseyi bulunamadı.', timeMs: this.state.timeMs };
        }

        if (cmd.position === 'ruler') {
          return { success: false, commandType: cmd.type, error: 'Hükümdar makamından azledilemez.', timeMs: this.state.timeMs };
        }

        const leaderId = council.positions[cmd.position];
        if (!leaderId || !council.leaders[leaderId]) {
          return { success: false, commandType: cmd.type, error: 'Bu makamda görevli bir bakan bulunmuyor.', timeMs: this.state.timeMs };
        }

        const leader = council.leaders[leaderId];
        leader.assignedPosition = null;
        council.positions[cmd.position] = null;

        const posName = COUNCIL_POSITION_INFO[cmd.position].nameTr;
        this.logEvent(
          'councilor_dismissed',
          `📜 GÖREVDEN ALMA: ${leader.name} ${posName} makamından ayrıldı.`,
          playerId,
          { position: cmd.position, leaderId: leader.id }
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'RECRUIT_COUNCIL_LEADER': {
        if (!this.state.councils) this.state.councils = {};
        let council = this.state.councils[playerId];
        if (!council) {
          council = createDefaultImperialCouncil(playerId, this.state.players[playerId]?.name);
          this.state.councils[playerId] = council;
        }

        const candidate = council.recruitCandidates.find((c) => c.id === cmd.candidateId);
        if (!candidate) {
          return { success: false, commandType: cmd.type, error: 'Aday lider havuzunda bulunamadı.', timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Lider istihdamı için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const cost = COUNCIL_CONSTANTS.RECRUIT_LEADER_COST;
        if (
          fundingPlanet.resources.ore < cost.ore ||
          fundingPlanet.resources.crystal < cost.crystal ||
          fundingPlanet.resources.fuel < cost.fuel
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= cost.ore;
        fundingPlanet.resources.crystal -= cost.crystal;
        fundingPlanet.resources.fuel -= cost.fuel;

        council.leaders[candidate.id] = candidate;
        council.recruitCandidates = council.recruitCandidates.filter((c) => c.id !== cmd.candidateId);

        // Replenish recruit pool if empty
        if (council.recruitCandidates.length === 0) {
          council.recruitCandidates = generateLeaderCandidates(this.state.nextId++, playerId);
        }

        this.logEvent(
          'council_leader_recruited',
          `🌟 LİDER İSTİHDAMI: ${candidate.name} (${candidate.title}) imparatorluk hizmetine katıldı!`,
          playerId,
          { leaderId: candidate.id, trait: candidate.trait.nameTr }
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { leaderId: candidate.id } };
      }

      case 'PROMOTE_FACTION_AGENDA': {
        const council = this.state.councils?.[playerId];
        if (!council) {
          return { success: false, commandType: cmd.type, error: 'Hükümet Konseyi bulunamadı.', timeMs: this.state.timeMs };
        }

        const faction = council.factions[cmd.factionType];
        if (!faction) {
          return { success: false, commandType: cmd.type, error: 'Fraksiyon bulunamadı.', timeMs: this.state.timeMs };
        }

        const fundingPlanet = this.state.planets[cmd.fundingPlanetId];
        if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gündem fonu için geçerli bir koloniniz seçilmelidir.', timeMs: this.state.timeMs };
        }

        const cost = COUNCIL_CONSTANTS.PROMOTE_AGENDA_COST;
        if (
          fundingPlanet.resources.ore < cost.ore ||
          fundingPlanet.resources.crystal < cost.crystal ||
          fundingPlanet.resources.fuel < cost.fuel
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        fundingPlanet.resources.ore -= cost.ore;
        fundingPlanet.resources.crystal -= cost.crystal;
        fundingPlanet.resources.fuel -= cost.fuel;

        const agenda = faction.agendas.find((a) => a.id === cmd.agendaId);
        if (agenda) {
          agenda.fulfilled = true;
        }

        faction.approvalRating = Math.min(100, faction.approvalRating + COUNCIL_CONSTANTS.AGENDA_PROMOTION_APPROVAL_BOOST);
        council.stabilityPercent = calculateEmpireStability(this.state, playerId);

        this.logEvent(
          'faction_agenda_promoted',
          `📢 POLİTİK TAVİZ: '${faction.nameTr}' fraksiyonuna fon sağlandı! Memnuniyet +%${COUNCIL_CONSTANTS.AGENDA_PROMOTION_APPROVAL_BOOST} arttı.`,
          playerId,
          { factionType: cmd.factionType, newApproval: faction.approvalRating }
        );

        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'SET_SHIP_LOADOUT': {
        if (!['scout', 'transport', 'fighter', 'battleship'].includes(cmd.shipType)) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz gemi sınıfı.', timeMs: this.state.timeMs };
        }
        if (!WEAPON_MODULES[cmd.loadout.weapon]) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz silah modülü.', timeMs: this.state.timeMs };
        }
        if (!DEFENSE_MODULES[cmd.loadout.defense]) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz savunma modülü.', timeMs: this.state.timeMs };
        }
        if (!UTILITY_MODULES[cmd.loadout.utility]) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz yardımcı sistem modülü.', timeMs: this.state.timeMs };
        }

        if (!this.state.shipLoadouts) {
          this.state.shipLoadouts = {};
        }
        if (!this.state.shipLoadouts[playerId]) {
          this.state.shipLoadouts[playerId] = JSON.parse(JSON.stringify(DEFAULT_LOADOUTS));
        }

        this.state.shipLoadouts[playerId][cmd.shipType] = {
          weapon: cmd.loadout.weapon,
          defense: cmd.loadout.defense,
          utility: cmd.loadout.utility,
        };

        const shipName = SHIP_STATS[cmd.shipType].nameTr;
        this.logEvent(
          'ship_loadout_updated',
          `🛠️ DOKTRİN GÜNCELLEMESİ: ${shipName} sınıfı donanımı yenilendi (${cmd.loadout.weapon}/${cmd.loadout.defense}/${cmd.loadout.utility}).`,
          playerId,
          { shipType: cmd.shipType, loadout: cmd.loadout }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { shipType: cmd.shipType, loadout: cmd.loadout },
        };
      }

      case 'REFIT_SHIPS': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen size ait değil.', timeMs: this.state.timeMs };
        }
        if (planet.buildings.shipyard < 1) {
          return { success: false, commandType: cmd.type, error: 'Yükseltme ve donatım için Tersane kurulu olmalıdır.', timeMs: this.state.timeMs };
        }
        if (cmd.count <= 0) {
          return { success: false, commandType: cmd.type, error: 'Geçersiz gemi adedi.', timeMs: this.state.timeMs };
        }
        const availableGarrison = planet.garrison[cmd.shipType] || 0;
        if (availableGarrison < cmd.count) {
          return { success: false, commandType: cmd.type, error: 'Garnizonda yeterli gemi bulunmuyor.', timeMs: this.state.timeMs };
        }

        const playerLoadout = this.state.shipLoadouts?.[playerId]?.[cmd.shipType] || DEFAULT_LOADOUTS[cmd.shipType];
        const refitCost = calculateRefitCost(cmd.shipType, playerLoadout, cmd.count);

        if (
          planet.resources.ore < refitCost.ore ||
          planet.resources.crystal < refitCost.crystal ||
          planet.resources.fuel < refitCost.fuel
        ) {
          return {
            success: false,
            commandType: cmd.type,
            error: `Yetersiz kaynak (Donatım için ${refitCost.ore} Cevher, ${refitCost.crystal} Kristal, ${refitCost.fuel} Yakıt gerekli).`,
            timeMs: this.state.timeMs,
          };
        }

        planet.resources.ore -= refitCost.ore;
        planet.resources.crystal -= refitCost.crystal;
        planet.resources.fuel -= refitCost.fuel;

        const shipName = SHIP_STATS[cmd.shipType].nameTr;
        this.logEvent(
          'ships_refitted',
          `⚓ TERSANE MODERNİZASYONU: ${planet.name} garnizonundaki ${cmd.count} adet ${shipName} son teknoloji modüllerle donatıldı.`,
          playerId,
          { planetId: cmd.planetId, shipType: cmd.shipType, count: cmd.count, cost: refitCost }
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, shipType: cmd.shipType, count: cmd.count, cost: refitCost },
        };
      }

      case 'DONATE_TO_GDF': {
        const result = donateShipsToGDF(this.state, playerId, cmd.planetId, cmd.ships);
        if (!result.success) {
          return { success: false, commandType: cmd.type, error: result.error, timeMs: this.state.timeMs };
        }
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'DISPATCH_GDF_FLEET': {
        const result = dispatchGDFFleet(this.state, playerId, cmd.targetSystemId, cmd.ships);
        if (!result.success) {
          return { success: false, commandType: cmd.type, error: result.error, timeMs: this.state.timeMs };
        }
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { fleetId: result.fleetId } };
      }

      case 'PURIFY_INFESTED_PLANET': {
        const result = purifyInfestedPlanet(this.state, playerId, cmd.planetId);
        if (!result.success) {
          return { success: false, commandType: cmd.type, error: result.error, timeMs: this.state.timeMs };
        }
        this.evaluateVictoryConditions();
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs };
      }

      case 'ASSAULT_VOID_ANCHOR': {
        const result = resolveVoidAnchorAssault(this.state, playerId, cmd.anchorId, cmd.fleetId);
        if (!result.success) {
          return { success: false, commandType: cmd.type, error: result.error, timeMs: this.state.timeMs };
        }
        this.evaluateVictoryConditions();
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { victory: result.victory } };
      }

      case 'ASSAULT_VOID_RIFT': {
        const result = resolveVoidRiftAssault(this.state, playerId, cmd.fleetId);
        if (!result.success) {
          return { success: false, commandType: cmd.type, error: result.error, timeMs: this.state.timeMs };
        }
        this.evaluateVictoryConditions();
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { victory: result.victory } };
      }

      case 'TRIGGER_CRISIS_TEST': {
        if (!this.state.crisis) {
          this.state.crisis = initializeGalacticCrisis(this.state, cmd.epicenterSystemId);
          this.state.crisis.stage = 'active';
          this.scheduleEvent(CRISIS_CONFIGS.CRISIS_TICK_INTERVAL_MS, 'crisis_tick', {});
          this.logEvent(
            'crisis_triggered',
            '⚡ TEST KRİZİ TETİKLENDİ: Boyutlararası Hiçlik İstilası aktif aşamada başladı!'
          );
        } else if (this.state.crisis.stage === 'breaching') {
          this.state.crisis.stage = 'active';
        } else if (this.state.crisis.stage === 'active') {
          for (const a of this.state.crisis.voidAnchors) {
            a.destroyed = true;
            a.hp = 0;
            a.shield = 0;
          }
          this.state.crisis.stage = 'apex';
          this.state.crisis.riftIntegrity = 0;
          this.logEvent('crisis_apex', '⚡ TEST KRİZİ: Tüm çıpalar düşürüldü, Kadim Behemot belirdi!');
        } else if (this.state.crisis.stage === 'apex') {
          this.state.crisis.behemothHp = 0;
          this.state.crisis.behemothShield = 0;
          this.state.crisis.behemothDefeated = true;
          this.state.crisis.slayerPlayerId = playerId;
          this.state.crisis.stage = 'defeated';
          this.logEvent('crisis_defeated', '🌟 TEST KRİZİ: Hiçlik İstilası püskürtüldü!');
        }
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { stage: this.state.crisis.stage } };
      }

      case 'ADOPT_TRADITION': {
        if (!this.state.traditions) {
          this.state.traditions = {};
        }
        if (!this.state.traditions[playerId]) {
          this.state.traditions[playerId] = initializeEmpireTraditions(playerId);
        }
        const res = adoptTradition(this.state, playerId, cmd.treeId, cmd.tier);
        if (res.success) {
          this.logEvent(
            'tradition_adopted',
            `${player.name} yeni bir gelenek doktrini benimsedi: ${cmd.treeId} (Aşama ${cmd.tier}).`,
            playerId,
            { treeId: cmd.treeId, tier: cmd.tier }
          );
        }
        return {
          success: res.success,
          commandType: cmd.type,
          error: res.error,
          timeMs: this.state.timeMs,
        };
      }

      case 'SELECT_ASCENSION_PERK': {
        if (!this.state.traditions) {
          this.state.traditions = {};
        }
        if (!this.state.traditions[playerId]) {
          this.state.traditions[playerId] = initializeEmpireTraditions(playerId);
        }
        const res = selectAscensionPerk(this.state, playerId, cmd.perkId);
        if (res.success) {
          this.logEvent(
            'ascension_perk_selected',
            `🌟 BÜYÜK YÜKSELİŞ: ${player.name} bir İmparatorluk Yükseliş Ayrıcalığı benimsedi: ${cmd.perkId}!`,
            playerId,
            { perkId: cmd.perkId }
          );
        }
        return {
          success: res.success,
          commandType: cmd.type,
          error: res.error,
          timeMs: this.state.timeMs,
        };
      }

      case 'EXCAVATE_SITE': {
        const canRes = canExcavateSite(this.state, playerId, cmd.siteId, cmd.fleetId);
        if (!canRes.canExcavate) {
          return { success: false, commandType: cmd.type, error: canRes.reason, timeMs: this.state.timeMs };
        }
        const startRes = startSiteExcavation(this.state, playerId, cmd.siteId, cmd.fleetId);
        if (!startRes.success) {
          return { success: false, commandType: cmd.type, error: startRes.error, timeMs: this.state.timeMs };
        }
        const site = this.state.archaeologySites?.[cmd.siteId];
        this.logEvent(
          'archaeology_started',
          `🏛️ KAZI BAŞLATILDI: ${player.name}, ${site?.nameTr || cmd.siteId} alanında arkeolojik kazı başlattı.`,
          playerId,
          { siteId: cmd.siteId, fleetId: cmd.fleetId }
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { siteId: cmd.siteId } };
      }

      case 'ABANDON_EXCAVATION': {
        const abRes = abandonSiteExcavation(this.state, playerId, cmd.siteId);
        if (!abRes.success) {
          return { success: false, commandType: cmd.type, error: abRes.error, timeMs: this.state.timeMs };
        }
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { siteId: cmd.siteId } };
      }

      case 'RESOLVE_ARCHAEOLOGY_CHOICE': {
        const resChoice = resolveSiteChoice(this.state, playerId, cmd.siteId, cmd.choiceIndex);
        if (!resChoice.success) {
          return { success: false, commandType: cmd.type, error: resChoice.error, timeMs: this.state.timeMs };
        }
        const site = this.state.archaeologySites?.[cmd.siteId];
        this.logEvent(
          'archaeology_choice_resolved',
          `📜 KAZI KARARI: ${player.name}, ${site?.nameTr || cmd.siteId} kazısında bir seçim yaptı.`,
          playerId,
          { siteId: cmd.siteId, choiceIndex: cmd.choiceIndex }
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { siteId: cmd.siteId, choiceIndex: cmd.choiceIndex } };
      }

      case 'ACTIVATE_RELIC_TRIUMPH': {
        const canTri = canActivateRelicTriumph(this.state, playerId, cmd.relicId);
        if (!canTri.canActivate) {
          return { success: false, commandType: cmd.type, error: canTri.reason, timeMs: this.state.timeMs };
        }
        const actRes = activateRelicTriumph(this.state, playerId, cmd.relicId);
        if (!actRes.success) {
          return { success: false, commandType: cmd.type, error: actRes.error, timeMs: this.state.timeMs };
        }
        const triumphConfig = RELIC_TRIUMPH_CONFIGS[cmd.relicId];
        this.logEvent(
          'relic_triumph_activated',
          `✨ YADİGÂR ZAFERİ: ${player.name}, [${triumphConfig?.nameTr || cmd.relicId}] kadim yadigâr zaferini aktive etti!`,
          playerId,
          { relicId: cmd.relicId }
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { relicId: cmd.relicId } };
      }

      case 'REVERSE_ENGINEER_ARTIFACTS': {
        const canRev = canReverseEngineer(this.state, playerId, cmd.actionType);
        if (!canRev.canReverseEngineer) {
          return { success: false, commandType: cmd.type, error: canRev.reason, timeMs: this.state.timeMs };
        }
        const revRes = reverseEngineerArtifacts(this.state, playerId, cmd.actionType, cmd.targetPlanetId);
        if (!revRes.success) {
          return { success: false, commandType: cmd.type, error: revRes.error, timeMs: this.state.timeMs };
        }
        this.logEvent(
          'artifacts_reverse_engineered',
          `🔬 KADİM TERSİNE MÜHENDİSLİK: ${player.name}, ${revRes.summaryTr || 'kadim parçacıkları analiz etti.'}`,
          playerId,
          { actionType: cmd.actionType }
        );
        return { success: true, commandType: cmd.type, timeMs: this.state.timeMs, data: { actionType: cmd.actionType, summaryTr: revRes.summaryTr } };
      }

      case 'START_TERRAFORMING': {
        const canStart = canStartTerraforming(this.state, playerId, cmd.planetId, cmd.targetBiome);
        if (!canStart.canStart) {
          return { success: false, commandType: cmd.type, error: canStart.reason, timeMs: this.state.timeMs };
        }
        const planet = this.state.planets[cmd.planetId];
        startTerraforming(planet, cmd.targetBiome, canStart.cost!, canStart.durationMs!, this.state.timeMs);
        const biomeDef = BIOME_CONFIGS[cmd.targetBiome];
        this.logEvent(
          'terraforming_started',
          `🌱 GEZEGEN ISLAHI BAŞLATILDI: ${planet.name} için [${biomeDef?.nameTr || cmd.targetBiome}] dönüşüm protokolü devreye alındı.`,
          playerId,
          { planetId: cmd.planetId, targetBiome: cmd.targetBiome, finishTime: planet.terraformingQueue?.finishTime }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, targetBiome: cmd.targetBiome, finishTime: planet.terraformingQueue?.finishTime },
        };
      }

      case 'CANCEL_TERRAFORMING': {
        const planet = this.state.planets[cmd.planetId];
        if (!planet || planet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Gezegen kontrolünüz altında değil.', timeMs: this.state.timeMs };
        }
        const cancelRes = cancelTerraforming(planet);
        if (!cancelRes) {
          return { success: false, commandType: cmd.type, error: 'Devam eden bir ıslah süreci bulunmuyor.', timeMs: this.state.timeMs };
        }
        this.logEvent(
          'terraforming_cancelled',
          `${planet.name} ıslah projesi iptal edildi. Rezervlerin %75'i iade edildi.`,
          playerId,
          { planetId: cmd.planetId, refund: cancelRes.refundedResources }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, refund: cancelRes.refundedResources },
        };
      }

      case 'ENACT_PLANETARY_DECISION': {
        const canEn = canEnactDecision(this.state, playerId, cmd.planetId, cmd.decisionId);
        if (!canEn.canEnact) {
          return { success: false, commandType: cmd.type, error: canEn.reason, timeMs: this.state.timeMs };
        }
        const planet = this.state.planets[cmd.planetId];
        enactDecision(planet, cmd.decisionId, this.state.timeMs, this.state, playerId);
        const decDef = PLANETARY_DECISIONS[cmd.decisionId];
        this.logEvent(
          'decision_enacted',
          `📜 GEZEGENSEL KARAR: ${planet.name} üzerinde "${decDef?.nameTr || cmd.decisionId}" yürürlüğe girdi.`,
          playerId,
          { planetId: cmd.planetId, decisionId: cmd.decisionId }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, decisionId: cmd.decisionId },
        };
      }

      case 'CLEAR_PLANETARY_BLOCKER': {
        const canClr = canClearBlocker(this.state, playerId, cmd.planetId, cmd.blockerId);
        if (!canClr.canClear) {
          return { success: false, commandType: cmd.type, error: canClr.reason, timeMs: this.state.timeMs };
        }
        const planet = this.state.planets[cmd.planetId];
        startClearBlocker(planet, cmd.blockerId, this.state.timeMs);
        this.logEvent(
          'blocker_clear_started',
          `🚧 ENGEL TEMİZLİĞİ: ${planet.name} üzerindeki yüzey engeli için temizlik çalışmaları başlatıldı.`,
          playerId,
          { planetId: cmd.planetId, blockerId: cmd.blockerId }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, blockerId: cmd.blockerId },
        };
      }

      case 'SET_TRADE_POLICY': {
        const player = this.state.players[playerId];
        if (!player) {
          return { success: false, commandType: cmd.type, error: 'Oyuncu bulunamadı.', timeMs: this.state.timeMs };
        }
        player.tradePolicy = cmd.policy;
        if (!this.state.tradeStates) this.state.tradeStates = {};
        if (this.state.tradeStates[playerId]) {
          this.state.tradeStates[playerId].policy = cmd.policy;
        }
        const policyConfig = TRADE_POLICY_CONFIGS[cmd.policy];
        this.logEvent(
          'trade_policy_changed',
          `📈 TİCARET POLİTİKASI: ${player.name} ticaret politikasını "${policyConfig?.nameTr || cmd.policy}" olarak değiştirdi.`,
          playerId,
          { policy: cmd.policy }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { policy: cmd.policy },
        };
      }

      case 'PROPOSE_COMMERCIAL_PACT': {
        const player = this.state.players[playerId];
        const target = this.state.players[cmd.targetPlayerId];
        if (!player || !target) {
          return { success: false, commandType: cmd.type, error: 'Hedef imparatorluk bulunamadı.', timeMs: this.state.timeMs };
        }
        if (playerId === cmd.targetPlayerId) {
          return { success: false, commandType: cmd.type, error: 'Kendi kendinizle ticaret paktı imzalayamazsınız.', timeMs: this.state.timeMs };
        }
        if (!player.commercialPacts) player.commercialPacts = [];
        if (!target.commercialPacts) target.commercialPacts = [];

        if (player.commercialPacts.includes(cmd.targetPlayerId)) {
          return { success: false, commandType: cmd.type, error: 'Bu imparatorlukla zaten aktif bir ticaret paktınız var.', timeMs: this.state.timeMs };
        }

        player.commercialPacts.push(cmd.targetPlayerId);
        target.commercialPacts.push(playerId);

        this.logEvent(
          'commercial_pact_signed',
          `🤝 TİCARET PAKTI: ${player.name} ve ${target.name} karşılıklı Ticaret Paktı imzaladı (+%10 Karşılıklı Ticaret Hacmi).`,
          playerId,
          { partnerId: cmd.targetPlayerId }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { partnerId: cmd.targetPlayerId },
        };
      }

      case 'BREAK_COMMERCIAL_PACT': {
        const player = this.state.players[playerId];
        const target = this.state.players[cmd.targetPlayerId];
        if (!player) {
          return { success: false, commandType: cmd.type, error: 'Oyuncu bulunamadı.', timeMs: this.state.timeMs };
        }
        if (player.commercialPacts) {
          player.commercialPacts = player.commercialPacts.filter((id) => id !== cmd.targetPlayerId);
        }
        if (target && target.commercialPacts) {
          target.commercialPacts = target.commercialPacts.filter((id) => id !== playerId);
        }
        this.logEvent(
          'commercial_pact_cancelled',
          `🚫 TİCARET PAKTI FESHİ: ${player.name}, ${target?.name || cmd.targetPlayerId} ile olan ticaret paktını feshetti.`,
          playerId,
          { partnerId: cmd.targetPlayerId }
        );
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { partnerId: cmd.targetPlayerId },
        };
      }

      case 'DECLARE_WAR': {
        const res = declareWar(this.state, playerId, cmd.targetPlayerId, cmd.warGoal);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { warId: res.warId, targetPlayerId: cmd.targetPlayerId, warGoal: cmd.warGoal },
        };
      }

      case 'OFFER_PEACE': {
        const res = offerPeace(this.state, playerId, cmd.warId, cmd.proposalType);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { warId: cmd.warId, proposalType: cmd.proposalType, outcome: res.outcome },
        };
      }

      case 'SET_SUBJECT_TERMS': {
        const res = setSubjectTerms(this.state, playerId, cmd.subjectId, cmd.subjectType, cmd.titheRate);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { subjectId: cmd.subjectId, subjectType: cmd.subjectType, titheRate: cmd.titheRate },
        };
      }

      case 'RELEASE_SUBJECT': {
        const res = releaseSubject(this.state, playerId, cmd.subjectId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { subjectId: cmd.subjectId },
        };
      }

      case 'INTEGRATE_SUBJECT': {
        const res = integrateSubject(this.state, playerId, cmd.subjectId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { subjectId: cmd.subjectId },
        };
      }

      // --- Galactic Federations (Phase 22) ---
      case 'FORM_FEDERATION': {
        const res = formFederation(this.state, playerId, cmd.name, cmd.fedType, cmd.invitedPlayerId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: res.federation?.id, name: cmd.name },
        };
      }

      case 'INVITE_TO_FEDERATION': {
        const res = inviteToFederation(this.state, playerId, cmd.federationId, cmd.targetPlayerId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, targetPlayerId: cmd.targetPlayerId },
        };
      }

      case 'RESPOND_FEDERATION_INVITE': {
        const res = respondFederationInvite(this.state, playerId, cmd.federationId, cmd.accept);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, accept: cmd.accept },
        };
      }

      case 'LEAVE_FEDERATION': {
        const res = leaveFederation(this.state, playerId, cmd.federationId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId },
        };
      }

      case 'PROPOSE_FEDERATION_LAW': {
        const res = proposeFederationLaw(this.state, playerId, cmd.federationId, cmd.lawType, cmd.proposedValue);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, lawType: cmd.lawType, proposedValue: cmd.proposedValue },
        };
      }

      case 'VOTE_FEDERATION_LAW': {
        const res = voteFederationLaw(this.state, playerId, cmd.federationId, cmd.vote);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, vote: cmd.vote },
        };
      }

      case 'ASSIGN_FEDERATION_ENVOYS': {
        const res = assignFederationEnvoys(this.state, playerId, cmd.federationId, cmd.envoys);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, envoys: cmd.envoys },
        };
      }

      case 'BUILD_FEDERAL_SHIP': {
        const res = buildFederalShip(this.state, playerId, cmd.federationId, cmd.planetId, cmd.shipType, cmd.count);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, shipType: cmd.shipType, count: cmd.count },
        };
      }

      case 'DISPATCH_FEDERAL_FLEET': {
        const res = dispatchFederalFleet(this.state, playerId, cmd.federationId, cmd.originPlanetId, cmd.targetSystemId, cmd.ships);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { federationId: cmd.federationId, targetSystemId: cmd.targetSystemId },
        };
      }

      case 'ESTABLISH_SPY_NETWORK': {
        const res = establishSpyNetwork(this.state, playerId, cmd.targetPlayerId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { networkId: res.networkId, targetPlayerId: cmd.targetPlayerId },
        };
      }

      case 'RECALL_SPY_NETWORK': {
        const res = recallSpyNetwork(this.state, playerId, cmd.networkId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { networkId: cmd.networkId },
        };
      }

      case 'ASSIGN_SPYMASTER_ENVOY': {
        const res = assignSpymasterEnvoy(this.state, playerId, cmd.networkId, cmd.envoys);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { networkId: cmd.networkId, envoys: cmd.envoys },
        };
      }

      case 'ACQUIRE_SPY_ASSET': {
        const res = acquireSpyAsset(this.state, playerId, cmd.networkId, cmd.assetType);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { networkId: cmd.networkId, asset: res.asset },
        };
      }

      case 'LAUNCH_COVERT_OPERATION': {
        const res = launchCovertOperation(
          this.state,
          playerId,
          cmd.networkId,
          cmd.opType,
          cmd.targetPlanetId,
          cmd.assignedAssetId
        );
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { operationId: res.operationId, opType: cmd.opType },
        };
      }

      case 'CANCEL_COVERT_OPERATION': {
        const res = cancelCovertOperation(this.state, playerId, cmd.operationId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { operationId: cmd.operationId },
        };
      }

      case 'SET_COUNTER_ESPIONAGE_STANCE': {
        const res = setCounterEspionageStance(this.state, playerId, cmd.stance);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { stance: cmd.stance },
        };
      }

      case 'ESTABLISH_BRANCH_OFFICE': {
        const res = establishBranchOffice(this.state, playerId, cmd.targetPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { branchId: res.branchId, targetPlanetId: cmd.targetPlanetId },
        };
      }

      case 'CLOSE_BRANCH_OFFICE': {
        const res = closeBranchOffice(this.state, playerId, cmd.branchId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { branchId: cmd.branchId },
        };
      }

      case 'BUILD_CORPORATE_HOLDING': {
        const res = buildCorporateHolding(this.state, playerId, cmd.branchId, cmd.holdingType);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { branchId: cmd.branchId, holdingType: cmd.holdingType },
        };
      }

      case 'DISMANTLE_CORPORATE_HOLDING': {
        const res = dismantleCorporateHolding(this.state, playerId, cmd.branchId, cmd.holdingIndex);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { branchId: cmd.branchId, holdingIndex: cmd.holdingIndex },
        };
      }

      case 'PURCHASE_COMMODITY_FUTURES': {
        const res = purchaseCommodityFutures(
          this.state,
          playerId,
          cmd.resourceType,
          cmd.amount,
          cmd.durationMinutes
        );
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { contractId: res.contractId, resourceType: cmd.resourceType, amount: cmd.amount },
        };
      }

      case 'CLAIM_COMMODITY_FUTURES': {
        const res = claimCommodityFutures(this.state, playerId, cmd.contractId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { contractId: cmd.contractId },
        };
      }

      case 'CONVERT_TO_MEGACORP': {
        const res = convertToMegacorp(this.state, playerId, cmd.civics);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { civics: cmd.civics },
        };
      }

      case 'BUILD_COLOSSUS': {
        const originPlanetId = cmd.originPlanetId || (cmd as any).planetId;
        const res = buildColossus(this.state, playerId, cmd.weaponType, originPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: res.colossusId },
        };
      }

      case 'MOVE_COLOSSUS': {
        const res = moveColossus(this.state, playerId, cmd.colossusId, cmd.targetSystemId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: cmd.colossusId, targetSystemId: cmd.targetSystemId },
        };
      }

      case 'COMMENCE_COLOSSUS_CHARGING': {
        const res = commenceColossusCharging(this.state, playerId, cmd.colossusId, cmd.targetPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: cmd.colossusId, targetPlanetId: cmd.targetPlanetId },
        };
      }

      case 'CANCEL_COLOSSUS_FIRING': {
        const res = cancelColossusFiring(this.state, playerId, cmd.colossusId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: cmd.colossusId },
        };
      }

      case 'REFIT_COLOSSUS_WEAPON': {
        const newWeaponType = cmd.newWeaponType || (cmd as any).weaponType;
        const res = refitColossusWeapon(this.state, playerId, cmd.colossusId, newWeaponType);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: cmd.colossusId, newWeaponType },
        };
      }

      case 'DISMANTLE_COLOSSUS': {
        const res = dismantleColossus(this.state, playerId, cmd.colossusId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { colossusId: cmd.colossusId },
        };
      }

      case 'ASSEMBLE_SYNTHETIC_POP': {
        const res = assembleSyntheticPop(this.state, playerId, cmd.planetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId },
        };
      }

      case 'DISMANTLE_SYNTHETIC_POP': {
        const res = dismantleSyntheticPop(this.state, playerId, cmd.planetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId },
        };
      }

      case 'SET_AI_POLICY': {
        const res = setAIPolicy(this.state, playerId, cmd.policy);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { policy: cmd.policy },
        };
      }

      case 'INITIATE_SYNTHETIC_ASCENSION': {
        const res = initiateSyntheticAscension(this.state, playerId, cmd.ascensionType);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { ascensionType: cmd.ascensionType },
        };
      }

      case 'SUPPRESS_SYNTHETIC_UPRISING': {
        const res = suppressSyntheticUprising(this.state, playerId, cmd.planetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId },
        };
      }

      case 'CONVERT_TO_MACHINE_WORLD': {
        const res = convertToMachineWorld(this.state, playerId, cmd.planetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId },
        };
      }

      case 'RECRUIT_PARAGON': {
        const res = recruitParagon(this.state, playerId, cmd.paragonId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { paragonId: cmd.paragonId },
        };
      }

      case 'ASSIGN_PARAGON': {
        const res = assignParagon(this.state, playerId, cmd.paragonId, cmd.assignment);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { paragonId: cmd.paragonId, assignment: cmd.assignment },
        };
      }

      case 'UNASSIGN_PARAGON': {
        const res = unassignParagon(this.state, playerId, cmd.paragonId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { paragonId: cmd.paragonId },
        };
      }

      case 'DISMISS_PARAGON': {
        const res = dismissParagon(this.state, playerId, cmd.paragonId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { paragonId: cmd.paragonId },
        };
      }

      case 'COMMISSION_PARAGON_FLAGSHIP': {
        const res = commissionParagonFlagship(this.state, playerId, cmd.paragonId, cmd.planetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { paragonId: cmd.paragonId, planetId: cmd.planetId },
        };
      }

      case 'CONSTRUCT_HYPER_RELAY': {
        const res = constructHyperRelay(this.state, playerId, cmd.systemId, cmd.fundingPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { systemId: cmd.systemId, fundingPlanetId: cmd.fundingPlanetId },
        };
      }

      case 'SET_HYPER_RELAY_POLICY': {
        const res = setHyperRelayPolicy(this.state, playerId, cmd.systemId, cmd.policy);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { systemId: cmd.systemId, policy: cmd.policy },
        };
      }

      case 'DISMANTLE_HYPER_RELAY': {
        const res = dismantleHyperRelay(this.state, playerId, cmd.systemId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { systemId: cmd.systemId },
        };
      }

      case 'UPGRADE_INTELLIGENCE_DIRECTORATE': {
        const res = upgradeDirectorate(this.state, playerId, cmd.fundingPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { tier: res.tier },
        };
      }

      case 'RECRUIT_SECRET_AGENT': {
        const agentName = cmd.name || cmd.customName;
        const res = recruitAgent(this.state, playerId, cmd.fundingPlanetId, agentName, cmd.trait);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { agent: res.agent },
        };
      }

      case 'ASSIGN_SECRET_AGENT': {
        const targetFaction = cmd.targetFactionId || cmd.targetPlayerId || '';
        const res = assignAgent(this.state, playerId, cmd.agentId, targetFaction);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { agentId: cmd.agentId, targetFactionId: targetFaction },
        };
      }

      case 'DISMISS_SECRET_AGENT': {
        const res = dismissAgent(this.state, playerId, cmd.agentId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { agentId: cmd.agentId },
        };
      }

      case 'DISPATCH_FALSE_FLAG_FLEET': {
        const fleetId = cmd.fleetId;
        if (!fleetId) {
          return { success: false, commandType: cmd.type, error: 'Fleet ID required', timeMs: this.state.timeMs };
        }
        const fleet = this.state.fleets[fleetId];
        if (!fleet || fleet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Fleet not found or unauthorized', timeMs: this.state.timeMs };
        }
        if (fleet.status !== 'orbiting') {
          return { success: false, commandType: cmd.type, error: 'Fleet must be in orbit to prepare false flag operation', timeMs: this.state.timeMs };
        }
        const directorate = getOrCreateDirectorate(this.state, playerId);
        if (directorate.tier < 2) {
          return { success: false, commandType: cmd.type, error: 'Tier 2 Directorate (Subspace SIGINT) required for false flag operations', timeMs: this.state.timeMs };
        }
        fleet.falseFlag = {
          disguisedAsFactionId: cmd.disguisedAsFactionId,
          isDisguised: true,
          isCompromised: false,
        };
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId, disguisedAsFactionId: cmd.disguisedAsFactionId },
        };
      }

      case 'LAUNCH_SHADOW_OPERATION': {
        const targetFaction = cmd.targetFactionId || cmd.targetPlayerId || '';
        const res = launchShadowOp(
          this.state,
          playerId,
          targetFaction,
          cmd.opType,
          cmd.assignedAgentId,
          cmd.targetPlanetId,
          cmd.targetStarbaseId,
          cmd.fundingPlanetId
        );
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { operation: res.operation },
        };
      }

      // ==========================================
      // Phase 30: Ground Warfare, Bombardment & Invasions
      // ==========================================
      case 'RECRUIT_ARMY': {
        const res = startRecruitArmy(this.state, cmd.planetId, cmd.armyType, cmd.customName);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId, armyType: cmd.armyType },
        };
      }

      case 'EMBARK_ARMIES': {
        const res = embarkArmies(this.state, cmd.planetId, cmd.fleetId, cmd.armyIds);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId: res.fleetId, embarkedCount: res.embarkedCount },
        };
      }

      case 'LAND_ARMIES': {
        const res = landArmies(this.state, cmd.fleetId, cmd.targetPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { isInvasion: res.isInvasion, battleId: res.battleId },
        };
      }

      case 'SET_BOMBARDMENT_STANCE': {
        const res = setBombardmentStance(this.state, cmd.fleetId, cmd.stance, cmd.targetPlanetId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId: cmd.fleetId, stance: cmd.stance },
        };
      }

      case 'DISMISS_ARMY': {
        const res = dismissArmy(this.state, cmd.armyId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { armyId: cmd.armyId },
        };
      }

      case 'LIBERATE_PLANET': {
        const res = liberatePlanet(this.state, cmd.planetId, playerId);
        if (!res.success) {
          return { success: false, commandType: cmd.type, error: res.error, timeMs: this.state.timeMs };
        }
        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { planetId: cmd.planetId },
        };
      }
    }
  }

  /**
   * Calculates total ships destroyed across all recorded battles
   */
  public calculateTotalShipsDestroyed(): number {
    let total = 0;
    for (const report of this.state.battleReports) {
      if (report.initialAttacker && report.survivingAttacker) {
        for (const [ship, count] of Object.entries(report.initialAttacker)) {
          const surviving = report.survivingAttacker[ship as ShipType] || 0;
          total += Math.max(0, count - surviving);
        }
      }
      if (report.initialDefender && report.survivingDefender) {
        for (const [ship, count] of Object.entries(report.initialDefender)) {
          const surviving = report.survivingDefender[ship as ShipType] || 0;
          total += Math.max(0, count - surviving);
        }
      }
    }
    return total;
  }

  /**
   * Declares victory, archives to seasonHistory, and logs galactic fanfare event
   */
  private declareVictory(record: VictoryRecord): VictoryRecord {
    this.state.victory = record;
    if (!this.state.seasonHistory) {
      this.state.seasonHistory = [];
    }
    if (!this.state.seasonHistory.some((h) => h.timestampMs === record.timestampMs && h.winnerId === record.winnerId)) {
      this.state.seasonHistory.unshift(record);
    }

    const typeDesc =
      record.victoryType === 'hegemony' || record.victoryType === 'alliance_hegemony'
        ? '500 Hegemonya Puanına Ulaşarak (Nexus Rölesi & Kadim Miras)'
        : '%60 Gezegensel Koloni Dominasyonu Sağlayarak';

    this.logEvent(
      'galactic_victory_achieved',
      `🏆 GALAKTİK ZAFER İLAN EDİLDİ! ${record.winnerName}, ${typeDesc} bu sezonun mutlak galibi oldu!`,
      record.winnerId,
      { victoryType: record.victoryType, stats: record.stats }
    );

    return record;
  }

  /**
   * Evaluates Endgame Victory Conditions:
   * 1. Hegemony Victory: Reaching 500 Hegemony/Relay Points (Solo or Alliance)
   * 2. Colony Domination Victory: Controlling >= 60% of all colonized planets (Min 6 colonized planets)
   */
  public evaluateVictoryConditions(): VictoryRecord | null {
    if (this.state.victory) return this.state.victory;

    const colonizedPlanets = Object.values(this.state.planets).filter((p) => !!p.ownerId);
    const totalColonized = colonizedPlanets.length;

    // Check individual player metrics
    for (const player of Object.values(this.state.players)) {
      const pId = player.id;
      const relayPts = this.state.relay.weeklyPoints[pId] || 0;
      const ownedPlanets = colonizedPlanets.filter((p) => p.ownerId === pId);
      const ownedCount = ownedPlanets.length;
      const colonyRatio = totalColonized > 0 ? ownedCount / totalColonized : 0;

      // 1. Hegemony Victory (500 pts)
      if (relayPts >= GAME_CONSTANTS.VICTORY_HEGEMONY_POINTS_THRESHOLD) {
        return this.declareVictory({
          winnerId: pId,
          winnerName: player.name,
          winnerColor: player.color,
          isAlliance: false,
          victoryType: 'hegemony',
          timestampMs: this.state.timeMs,
          stats: {
            hegemonyPoints: relayPts,
            ownedPlanetsCount: ownedCount,
            totalPlanetsCount: totalColonized,
            colonyRatio,
            totalBattlesFought: this.state.battleReports.length,
            shipsDestroyed: this.calculateTotalShipsDestroyed(),
            matchDurationMs: this.state.timeMs,
          },
        });
      }

      // 2. Colony Domination Victory (60% of at least 6 colonies)
      if (
        totalColonized >= GAME_CONSTANTS.VICTORY_MIN_TOTAL_COLONIES_FOR_DOMINATION &&
        colonyRatio >= GAME_CONSTANTS.VICTORY_DOMINATION_COLONY_PERCENT
      ) {
        return this.declareVictory({
          winnerId: pId,
          winnerName: player.name,
          winnerColor: player.color,
          isAlliance: false,
          victoryType: 'domination',
          timestampMs: this.state.timeMs,
          stats: {
            hegemonyPoints: relayPts,
            ownedPlanetsCount: ownedCount,
            totalPlanetsCount: totalColonized,
            colonyRatio,
            totalBattlesFought: this.state.battleReports.length,
            shipsDestroyed: this.calculateTotalShipsDestroyed(),
            matchDurationMs: this.state.timeMs,
          },
        });
      }
    }

    // Check Alliance metrics
    for (const alliance of Object.values(this.state.alliances)) {
      const aId = alliance.id;
      let totalAllianceRelayPts = 0;
      let totalAllianceColonies = 0;

      for (const mId of alliance.memberIds) {
        totalAllianceRelayPts += this.state.relay.weeklyPoints[mId] || 0;
        totalAllianceColonies += colonizedPlanets.filter((p) => p.ownerId === mId).length;
      }

      const colonyRatio = totalColonized > 0 ? totalAllianceColonies / totalColonized : 0;

      // Alliance Hegemony
      if (totalAllianceRelayPts >= GAME_CONSTANTS.VICTORY_HEGEMONY_POINTS_THRESHOLD) {
        return this.declareVictory({
          winnerId: aId,
          winnerName: `[${alliance.tag}] ${alliance.name}`,
          winnerColor: '#38bdf8',
          isAlliance: true,
          victoryType: 'alliance_hegemony',
          timestampMs: this.state.timeMs,
          stats: {
            hegemonyPoints: totalAllianceRelayPts,
            ownedPlanetsCount: totalAllianceColonies,
            totalPlanetsCount: totalColonized,
            colonyRatio,
            totalBattlesFought: this.state.battleReports.length,
            shipsDestroyed: this.calculateTotalShipsDestroyed(),
            matchDurationMs: this.state.timeMs,
          },
        });
      }

      // Alliance Domination
      if (
        totalColonized >= GAME_CONSTANTS.VICTORY_MIN_TOTAL_COLONIES_FOR_DOMINATION &&
        colonyRatio >= GAME_CONSTANTS.VICTORY_DOMINATION_COLONY_PERCENT
      ) {
        return this.declareVictory({
          winnerId: aId,
          winnerName: `[${alliance.tag}] ${alliance.name}`,
          winnerColor: '#38bdf8',
          isAlliance: true,
          victoryType: 'alliance_domination',
          timestampMs: this.state.timeMs,
          stats: {
            hegemonyPoints: totalAllianceRelayPts,
            ownedPlanetsCount: totalAllianceColonies,
            totalPlanetsCount: totalColonized,
            colonyRatio,
            totalBattlesFought: this.state.battleReports.length,
            shipsDestroyed: this.calculateTotalShipsDestroyed(),
            matchDurationMs: this.state.timeMs,
          },
        });
      }
    }

    return null;
  }

  /**
   * Resets the galaxy for a new season while preserving seasonHistory.
   */
  public resetGalaxySeason(newSeed: number): void {
    const previousHistory = [...(this.state.seasonHistory || [])];
    const previousVictory = this.state.victory;
    if (previousVictory && !previousHistory.some((h) => h.timestampMs === previousVictory.timestampMs)) {
      previousHistory.unshift(previousVictory);
    }

    this.prng = new PRNG(newSeed);
    const map = generateSectorMap({ seed: newSeed });
    const initialParagons = initializeGalacticParagons();

    this.state = {
      timeMs: 0,
      seed: newSeed,
      map,
      players: {},
      planets: {},
      fleets: {},
      admirals: {},
      starbases: {},
      megastructures: {},
      gateways: {},
      hyperRelays: {},
      intelligenceDirectorates: {},
      secretAgents: {},
      shadowOperations: {},
      armies: {},
      groundBattles: {},
      senate: createInitialSenateState(),
      councils: {},
      shipLoadouts: {},
      crisis: null,
      traditions: {},
      archaeologySites: initializeSectorArchaeologySites(map.systems),
      activeRelicTriumphs: {},
      tradeStates: {},
      systemTrade: {},
      wars: {},
      subjects: {},
      federations: {},
      sectorEvents: {},
      transmissions: {},
      truces: {},
      relay: {
        systemId: map.relaySystemId,
        controllingPlayerId: null,
        garrison: { scout: 2, transport: 0, fighter: 4, battleship: 1 },
        capturedAtTime: 0,
        weeklyPoints: {},
        sensorRadiusBonus: GAME_CONSTANTS.RELAY_SENSOR_RADIUS_BONUS,
      },
      alliances: {},
      market: {
        rates: { ore: 1.0, crystal: 1.6, fuel: 2.4 },
        baseRates: { ore: 1.0, crystal: 1.6, fuel: 2.4 },
        volume24h: { ore: 0, crystal: 0, fuel: 0 },
        baseFeeRate: 0.15,
        transactionHistory: [],
      },
      espionageOps: [],
      spyNetworks: {},
      covertOperations: {},
      branchOffices: {},
      commodityFutures: {},
      colossi: {},
      synthetics: {},
      paragons: initialParagons.paragons,
      galacticParagonPool: initialParagons.pool,
      battleReports: [],
      eventLog: [],
      victory: null,
      seasonHistory: previousHistory,
      nextId: 100,
    };

    // Spawn 1 ancient dormant gateway in a distant star system
    if (!this.state.gateways) this.state.gateways = {};
    const candidateSystems = Object.keys(map.systems).filter((sId) => sId !== map.relaySystemId);
    if (candidateSystems.length > 0) {
      const ancientGwSys = candidateSystems[candidateSystems.length - 1];
      this.state.gateways[ancientGwSys] = {
        id: `gw_ancient_${ancientGwSys}`,
        systemId: ancientGwSys,
        ownerId: null,
        status: 'dormant',
      };
    }

    this.scheduledEvents = [];
    this.lastMarketUpdateMs = 0;
    this.lastSectorEventSpawnMs = 0;
    this.lastUnityUpdateMs = 0;

    // Schedule initial relay point tick
    this.scheduleEvent(GAME_CONSTANTS.RELAY_POINT_INTERVAL_MS, 'relay_point_tick', {});
    this.lastArchaeologyTickMs = 0;
    this.lastSyntheticsTickMs = 0;
    this.lastParagonsTickMs = 0;
    this.lastHyperRelaysTickMs = 0;
    this.lastShadowOpsTickMs = 0;

    this.logEvent(
      'season_reset',
      `✨ YENİ GALAKTİK SEZON BAŞLADI (Tohum: ${newSeed}). Tüm filolar ve koloniler sıfırlandı.`,
      undefined,
      { seed: newSeed }
    );
  }

  /**
   * Helper to send automated bot transmission to player(s)
   */
  public sendBotTransmission(
    botPlayerId: string,
    recipientId: string,
    transmissionType: TransmissionType,
    title: string,
    message: string,
    options?: {
      tradeOffer?: { give: Resources; receive: Resources };
      truceDurationMs?: number;
      systemId?: string;
    }
  ): RadioTransmission | null {
    const sender = this.state.players[botPlayerId];
    if (!sender) return null;
    if (!this.state.transmissions) this.state.transmissions = {};

    const transmissionId = `trans_${this.state.nextId++}`;
    const transmission: RadioTransmission = {
      id: transmissionId,
      senderId: botPlayerId,
      senderName: sender.name,
      senderColor: sender.color,
      senderArchetype: sender.botArchetype,
      recipientId,
      type: transmissionType,
      title,
      message,
      timestampMs: this.state.timeMs,
      expiresAtMs: this.state.timeMs + (options?.truceDurationMs || 30 * 60 * 1000),
      read: false,
      status: 'pending',
      systemId: options?.systemId,
      tradeOffer: options?.tradeOffer,
      truceDurationMs: options?.truceDurationMs,
    };

    this.state.transmissions[transmissionId] = transmission;
    this.logEvent(
      'transmission_sent',
      `${sender.name}, telsiz kanalı üzerinden yayın yaptı: "${title}".`,
      botPlayerId,
      { transmissionId, recipientId, type: transmissionType }
    );
    return transmission;
  }

  // --- Filtered Client State ---
  public getPlayerView(playerId: string): PlayerVisibleState {
    this.updatePassiveProduction(this.state.timeMs);
    return filterGameStateForPlayer(this.state, playerId);
  }

  private logEvent(type: string, description: string, playerId?: string, metadata?: Record<string, unknown>) {
    this.state.eventLog.push({
      id: `log_${this.state.nextId++}`,
      timeMs: this.state.timeMs,
      type,
      playerId,
      description,
      metadata,
    });
  }
}
