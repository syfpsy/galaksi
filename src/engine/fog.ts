import { GAME_CONSTANTS } from './constants';
import { evaluatePlayerDirectives } from './directives';
import {
  Admiral,
  EmpireArtifactId,
  EmpireDirective,
  EspionageOp,
  EspionageReport,
  Fleet,
  FleetDoctrine,
  GameState,
  IntelLevel,
  MarketState,
  Planet,
  RadioTransmission,
  SectorEvent,
  SectorMap,
  SenateState,
  ShipType,
  StarSystem,
  VictoryRecord,
  Megastructure,
  Gateway,
  ImperialCouncilState,
  ShipLoadoutMap,
  GalacticCrisisState,
  EmpireTraditionsState,
  ActiveRelicTriumph,
  ArchaeologySite,
  SpyNetwork,
  CovertOperation,
  CounterEspionageStance,
  CorporateBranchOffice,
  CommodityFuturesContract,
  ColossusShip,
  SyntheticEmpireState,
  ParagonLeader,
} from './types';
import { DEFAULT_LOADOUTS } from './shipDesign';
import { getPlayerMegastructureBonuses } from './megastructures';

export interface MaskedFleet {
  id: string;
  name: string;
  ownerId: string;
  isHostile: boolean;
  intelLevel: 'sensor_contact' | 'deep_intel' | 'full';
  approxSize?: 'small' | 'medium' | 'large' | 'massive';
  visibleRoles?: ShipType[];
  ships?: Record<ShipType, number>;
  originSystemId: string;
  targetSystemId: string;
  departureTime: number;
  arrivalTime: number;
  isReturning: boolean;
  status: Fleet['status'];
  doctrine?: FleetDoctrine;
}

export interface PlayerVisibleState {
  timeMs: number;
  playerId: string;
  myPlanets: Planet[];
  myFleets: Fleet[];
  myResearch: Record<string, number>;
  myResearchQueue: GameState['players'][string]['researchQueue'];
  myAdmirals?: Admiral[];
  discoveredSystems: Record<string, {
    system: StarSystem;
    intelLevel: IntelLevel;
    visiblePlanets: { id: string; name: string; ownerId: string | null; isHomeworld: boolean }[];
    hasRelay: boolean;
    hasDebris?: boolean;
    hasPoi?: boolean;
  }>;
  visibleFleets: MaskedFleet[];
  relayContest: {
    systemId: string;
    controllerId: string | null;
    weeklyPoints: Record<string, number>;
  };
  recentBattles: GameState['battleReports'];
  market: MarketState;
  myEspionageReports: EspionageReport[];
  myActiveEspionageOps: EspionageOp[];
  activeSectorEvents?: SectorEvent[];
  myTransmissions?: RadioTransmission[];
  myActiveTruces?: { withPlayerId: string; expiresAtMs: number }[];
  victory?: VictoryRecord | null;
  seasonHistory?: VictoryRecord[];
  myClaimedDirectives?: string[];
  myDirectives?: EmpireDirective[];
  myArtifacts?: EmpireArtifactId[];
  senate?: SenateState;
  megastructures?: Record<string, Megastructure>;
  gateways?: Record<string, Gateway>;
  myCouncil?: ImperialCouncilState;
  myShipLoadouts?: ShipLoadoutMap;
  myCrisis?: GalacticCrisisState | null;
  myTraditions?: EmpireTraditionsState;
  myMinorArtifacts?: number;
  myActiveRelicTriumphs?: ActiveRelicTriumph[];
  archaeologySites?: Record<string, ArchaeologySite>;
  mySpyNetworks?: SpyNetwork[];
  myCovertOperations?: CovertOperation[];
  myCounterEspionageStance?: CounterEspionageStance;
  myBranchOffices?: CorporateBranchOffice[];
  myCommodityFutures?: CommodityFuturesContract[];
  myColossus?: ColossusShip | null;
  chargingColossi?: ColossusShip[];
  mySynthetics?: SyntheticEmpireState | null;
  myParagons?: ParagonLeader[];
  availableParagons?: ParagonLeader[];
  myRenown?: number;
}

/**
 * Calculates all star systems currently in sensor range for a player
 */
export function getPlayerSensorCoverage(
  state: GameState,
  playerId: string
): Set<string> {
  // Megastructure Sentry Array (Stage 3): Full Galaxy Sensor Vision
  const megaBonuses = getPlayerMegastructureBonuses(state, playerId);
  if (megaBonuses.hasFullGalaxyVision) {
    return new Set(Object.keys(state.map.systems));
  }

  const coveredSystems = new Set<string>();
  const player = state.players[playerId];

  // Include alliance members for shared sensor vision (GDD Section 9)
  const alliedPlayerIds = new Set<string>([playerId]);
  if (player?.allianceId && state.alliances[player.allianceId]) {
    for (const memberId of state.alliances[player.allianceId].memberIds) {
      alliedPlayerIds.add(memberId);
    }
  }

  // Include federation members for shared sensor vision (Phase 22)
  if (player?.federationId && state.federations?.[player.federationId]) {
    const fed = state.federations[player.federationId];
    if (fed.centralizationLevel >= 3 || fed.type === 'galactic_union' || fed.type === 'research_cooperative') {
      for (const memberId of fed.members) {
        alliedPlayerIds.add(memberId);
      }
    }
  }

  // 1. Systems with owned or allied planets
  for (const planet of Object.values(state.planets)) {
    if (alliedPlayerIds.has(planet.ownerId)) {
      coveredSystems.add(planet.systemId);

      // Sensor array bonus: +1 lane range per 2 levels + research + relic + scientific cooperative senate resolution
      const sensorLevel = planet.buildings.sensor_array || 0;
      const researchLevel = state.players[planet.ownerId]?.research.sensors || 0;
      const relicSensorBonus = state.players[planet.ownerId]?.artifacts?.includes('subspace_tachyon_array') ? 1 : 0;
      const relicTriumphSensorBonus = state.activeRelicTriumphs?.[planet.ownerId]?.some(
        (t) => t.relicId === 'subspace_tachyon_array' && state.timeMs < t.expiresAtMs
      )
        ? 2
        : 0;
      const senateSensorBonus = state.senate?.activeResolutions.some(
        (r) => r.resolutionType === 'scientific_cooperative'
      )
        ? 1
        : 0;
      const traditionSensorBonus = state.traditions?.[planet.ownerId]?.trees.discovery?.unlockedTiers.includes(1) ? 1 : 0;
      const range =
        GAME_CONSTANTS.BASE_SENSOR_RANGE +
        Math.floor(sensorLevel / 2) +
        Math.floor(researchLevel / 2) +
        relicSensorBonus +
        relicTriumphSensorBonus +
        senateSensorBonus +
        traditionSensorBonus;

      addNeighborSystemsWithinHops(planet.systemId, range, state.map, coveredSystems);
    }
  }

  // 2. Systems with active owned or allied fleets
  for (const fleet of Object.values(state.fleets)) {
    if (alliedPlayerIds.has(fleet.ownerId) && fleet.status !== 'destroyed') {
      coveredSystems.add(fleet.originSystemId);
      coveredSystems.add(fleet.targetSystemId);

      // If fleet includes scouts, grants extended sensor bubble
      if (fleet.ships.scout > 0) {
        addNeighborSystemsWithinHops(fleet.targetSystemId, 1, state.map, coveredSystems);
      }
    }
  }

  // 3. Relay control bonus (+2 hops from relay system)
  if (state.relay.controllingPlayerId && alliedPlayerIds.has(state.relay.controllingPlayerId)) {
    coveredSystems.add(state.relay.systemId);
    addNeighborSystemsWithinHops(
      state.relay.systemId,
      state.relay.sensorRadiusBonus || 2,
      state.map,
      coveredSystems
    );
  }

  // 4. Systems with owned or allied Starbases & Outposts
  if (state.starbases) {
    for (const starbase of Object.values(state.starbases)) {
      if (alliedPlayerIds.has(starbase.ownerId)) {
        coveredSystems.add(starbase.systemId);

        // Base sensor hops from starbase tier + sensor_relay modules
        const tierHops = starbase.tier === 'citadel' ? 3 : starbase.tier === 'starbase' ? 2 : 1;
        const sensorRelayCount = starbase.modules.filter((m) => m === 'sensor_relay').length;
        const totalHops = tierHops + sensorRelayCount;

        addNeighborSystemsWithinHops(starbase.systemId, totalHops, state.map, coveredSystems);
      }
    }
  }

  // 5. Systems with owned or allied Megastructures
  if (state.megastructures) {
    for (const mega of Object.values(state.megastructures)) {
      if (alliedPlayerIds.has(mega.ownerId)) {
        coveredSystems.add(mega.systemId);
        if (megaBonuses.additionalSensorHops > 0) {
          addNeighborSystemsWithinHops(mega.systemId, megaBonuses.additionalSensorHops, state.map, coveredSystems);
        }
      }
    }
  }

  // 6. Deep Infiltration (>= 90): Systems containing infiltrated target's colonies
  if (state.spyNetworks) {
    for (const net of Object.values(state.spyNetworks)) {
      if (net.ownerId === playerId && net.infiltrationLevel >= 90) {
        for (const targetPlanet of Object.values(state.planets)) {
          if (targetPlanet.ownerId === net.targetPlayerId) {
            coveredSystems.add(targetPlanet.systemId);
          }
        }
      }
    }
  }

  return coveredSystems;
}

function addNeighborSystemsWithinHops(
  startSystemId: string,
  hops: number,
  map: SectorMap,
  result: Set<string>
) {
  if (hops <= 0) return;
  const queue: { id: string; depth: number }[] = [{ id: startSystemId, depth: 0 }];
  const visited = new Set<string>([startSystemId]);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    result.add(id);

    if (depth < hops) {
      for (const lane of map.lanes) {
        let next: string | null = null;
        if (lane.fromSystemId === id) next = lane.toSystemId;
        else if (lane.toSystemId === id) next = lane.fromSystemId;

        if (next && !visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, depth: depth + 1 });
        }
      }
    }
  }
}

/**
 * Categorizes fleet size into vague sensor readout
 */
export function getApproxFleetSize(totalShips: number): 'small' | 'medium' | 'large' | 'massive' {
  if (totalShips <= 3) return 'small';
  if (totalShips <= 10) return 'medium';
  if (totalShips <= 25) return 'large';
  return 'massive';
}

/**
 * Server-authoritative fog of war filter.
 * Strips confidential information from state before transmitting to a client.
 */
export function filterGameStateForPlayer(
  state: GameState,
  playerId: string
): PlayerVisibleState {
  const sensorCoverage = getPlayerSensorCoverage(state, playerId);
  const player = state.players[playerId];

  // My owned planets and fleets
  const myPlanets = Object.values(state.planets).filter(p => p.ownerId === playerId);
  const myFleets = Object.values(state.fleets).filter(f => f.ownerId === playerId && f.status !== 'destroyed');

  // Discovered and visible systems
  const discoveredSystems: PlayerVisibleState['discoveredSystems'] = {};

  for (const sys of Object.values(state.map.systems)) {
    const isCovered = sensorCoverage.has(sys.id);
    const storedIntel = player?.intel.discoveredSystems[sys.id] || 'unexplored';

    let intelLevel: IntelLevel = 'unexplored';
    if (isCovered) {
      intelLevel = 'sensor_contact';
    } else if (storedIntel !== 'unexplored') {
      intelLevel = 'mapped';
    }

    // Unexplored systems only reveal coordinates & name
    if (intelLevel === 'unexplored') {
      discoveredSystems[sys.id] = {
        system: {
          id: sys.id,
          name: 'Bilinmeyen Sistem',
          x: sys.x,
          y: sys.y,
          hasRelay: false,
          slots: [],
        },
        intelLevel: 'unexplored',
        visiblePlanets: [],
        hasRelay: false,
      };
    } else {
      // Mapped or sensor contact
      discoveredSystems[sys.id] = {
        system: sys,
        intelLevel,
        visiblePlanets: sys.slots.map(s => {
          const planet = state.planets[s.planetId];
          return {
            id: s.planetId,
            name: s.name,
            ownerId: planet ? planet.ownerId : (s.ownerId || null),
            isHomeworld: planet ? planet.isHomeworld : false,
          };
        }),
        hasRelay: sys.hasRelay,
        hasDebris: !!sys.hasDebris && (sys.hasDebris.ore > 0 || sys.hasDebris.crystal > 0),
        hasPoi: !!sys.poi && !sys.poi.explored,
      };
    }
  }

  // Filter fleets
  const visibleFleets: MaskedFleet[] = [];
  const playerSensorsTech = player?.research.sensors || 0;

  for (const fleet of Object.values(state.fleets)) {
    if (fleet.status === 'destroyed') continue;

    if (fleet.ownerId === playerId) {
      // Own fleet: full visibility
      visibleFleets.push({
        id: fleet.id,
        name: fleet.name,
        ownerId: fleet.ownerId,
        isHostile: false,
        intelLevel: 'full',
        ships: { ...fleet.ships },
        originSystemId: fleet.originSystemId,
        targetSystemId: fleet.targetSystemId,
        departureTime: fleet.departureTime,
        arrivalTime: fleet.arrivalTime,
        isReturning: fleet.isReturning,
        status: fleet.status,
        doctrine: fleet.doctrine || 'balanced',
      });
      continue;
    }

    // Hostile or neutral fleet: is it in sensor coverage?
    const isInOriginSensor = sensorCoverage.has(fleet.originSystemId);
    const isInTargetSensor = sensorCoverage.has(fleet.targetSystemId);

    if (isInOriginSensor || isInTargetSensor) {
      const totalShips = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
      const approxSize = getApproxFleetSize(totalShips);

      // Deep intel requires Sensor Array or Tech level 2+
      const hasDeepIntel = playerSensorsTech >= 2;

      const roles: ShipType[] = [];
      for (const [type, count] of Object.entries(fleet.ships) as [ShipType, number][]) {
        if (count > 0) roles.push(type);
      }

      visibleFleets.push({
        id: fleet.id,
        name: `Bilinmeyen Filo #${fleet.id.slice(-4)}`,
        ownerId: fleet.ownerId,
        isHostile: true,
        intelLevel: hasDeepIntel ? 'deep_intel' : 'sensor_contact',
        approxSize,
        visibleRoles: hasDeepIntel ? roles : undefined,
        ships: hasDeepIntel ? { ...fleet.ships } : undefined,
        originSystemId: fleet.originSystemId,
        targetSystemId: fleet.targetSystemId,
        departureTime: fleet.departureTime,
        arrivalTime: fleet.arrivalTime,
        isReturning: fleet.isReturning,
        status: fleet.status,
        doctrine: hasDeepIntel ? fleet.doctrine : undefined,
      });
    }
  }

  // Filter recent battle reports that involved the player
  const myBattles = state.battleReports.filter(
    b => b.attackerId === playerId || b.defenderId === playerId
  );

  // Espionage ops involving the player (sent by player)
  const myActiveOps = (state.espionageOps || []).filter(
    op => op.infiltratorId === playerId
  );

  return {
    timeMs: state.timeMs,
    playerId,
    myPlanets,
    myFleets,
    myResearch: player?.research || { engines: 0, weapons: 0, sensors: 0 },
    myResearchQueue: player?.researchQueue || null,
    myAdmirals: Object.values(state.admirals || {}).filter(a => a.ownerId === playerId),
    discoveredSystems,
    visibleFleets,
    relayContest: {
      systemId: state.relay.systemId,
      controllerId: state.relay.controllingPlayerId,
      weeklyPoints: state.relay.weeklyPoints,
    },
    recentBattles: myBattles.slice(-10),
    market: state.market,
    myEspionageReports: player?.espionageReports || [],
    myActiveEspionageOps: myActiveOps,
    activeSectorEvents: Object.values(state.sectorEvents || {}).filter(
      (e) => !e.resolved && state.timeMs < e.expiresAtMs
    ),
    myTransmissions: Object.values(state.transmissions || {}).filter(
      (t) => t.recipientId === 'all' || t.recipientId === playerId || t.senderId === playerId
    ),
    myActiveTruces: (() => {
      const list: { withPlayerId: string; expiresAtMs: number }[] = [];
      if (state.truces) {
        for (const [key, expiresAtMs] of Object.entries(state.truces)) {
          if (state.timeMs < expiresAtMs && key.includes(playerId)) {
            const parts = key.split('_');
            const otherId = parts.find((p) => p !== playerId) || parts[0];
            list.push({ withPlayerId: otherId, expiresAtMs });
          }
        }
      }
      return list;
    })(),
    victory: state.victory || null,
    seasonHistory: state.seasonHistory || [],
    myClaimedDirectives: player?.claimedDirectives || [],
    myDirectives: evaluatePlayerDirectives(state, playerId),
    myArtifacts: player?.artifacts || [],
    senate: state.senate,
    megastructures: state.megastructures,
    gateways: state.gateways,
    myCouncil: state.councils?.[playerId],
    myShipLoadouts: state.shipLoadouts?.[playerId] || DEFAULT_LOADOUTS,
    myCrisis: state.crisis || null,
    myTraditions: state.traditions?.[playerId],
    myMinorArtifacts: player?.minorArtifacts || 0,
    myActiveRelicTriumphs: state.activeRelicTriumphs?.[playerId] || [],
    archaeologySites: state.archaeologySites,
    mySpyNetworks: Object.values(state.spyNetworks || {}).filter((n) => n.ownerId === playerId),
    myCovertOperations: Object.values(state.covertOperations || {}).filter((o) => o.infiltratorId === playerId),
    myCounterEspionageStance: player?.counterEspionageStance || 'relaxed',
    myBranchOffices: Object.values(state.branchOffices || {}).filter(
      (b) => b.corporationId === playerId || b.targetPlayerId === playerId
    ),
    myCommodityFutures: Object.values(state.commodityFutures || {}).filter((f) => f.buyerId === playerId),
    myColossus: player?.colossusId && state.colossi ? state.colossi[player.colossusId] || null : null,
    chargingColossi: Object.values(state.colossi || {}).filter((c) => c.status === 'charging'),
    mySynthetics: state.synthetics?.[playerId] || null,
    myParagons: Object.values(state.paragons || {}).filter((p) => p.ownerId === playerId),
    availableParagons: Object.values(state.paragons || {}).filter((p) => p.ownerId === null),
    myRenown: player?.renown || 0,
  };
}
