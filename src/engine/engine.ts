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
  ShipType,
  TransmissionType,
  VictoryRecord,
  VictoryType,
} from './types';
import { createHomeworldPlanet, generateSectorMap } from './universe';
import { evaluatePlayerDirectives } from './directives';
import {
  generateSectorCrisis,
  applySectorCrisisStart,
  applySectorCrisisEnd,
  getRouteCrisisModifiers,
} from './events';

export class GameEngine {
  public state: GameState;
  private scheduledEvents: ScheduledEvent[] = [];
  private prng: PRNG;
  private lastMarketUpdateMs: number = 0;
  private lastSectorEventSpawnMs: number = 0;

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
      battleReports: [],
      eventLog: [],
      victory: null,
      seasonHistory: [],
      nextId: 100,
    };

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

      planet.resources.ore = Math.min(
        planet.storageCap,
        planet.resources.ore + oreProd * elapsedHours
      );
      planet.resources.crystal = Math.min(
        planet.storageCap,
        planet.resources.crystal + crystalProd * elapsedHours
      );
      planet.resources.fuel = Math.min(
        planet.storageCap,
        planet.resources.fuel + fuelProd * elapsedHours
      );

      planet.lastResourceUpdate = nowMs;

      // Process Shipyard Queue
      this.processPlanetShipyardQueue(planet, nowMs);

      // Process Defense Installation Queue
      this.processPlanetDefenseQueue(planet, nowMs);
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
          this.state.relay.weeklyPoints[pid] =
            (this.state.relay.weeklyPoints[pid] || 0) + GAME_CONSTANTS.RELAY_POINTS_PER_TICK;
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
    }
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
            this.logEvent(
              'poi_discovered',
              `${fleet.name} ${targetSystem.name} sisteminde ${targetSystem.poi.type} keşfetti ve kaynak topladı!`,
              fleet.ownerId
            );
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
          const newPlanet: Planet = {
            id: newPlanetId,
            name: `${player?.name || 'Koloni'} - ${emptySlot.name}`,
            systemId: targetSystem.id,
            slotIndex: emptySlot.slotIndex,
            ownerId: fleet.ownerId,
            isHomeworld: false,
            resources: {
              ore: fleet.cargo.ore,
              crystal: fleet.cargo.crystal,
              fuel: fleet.cargo.fuel,
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
            garrison: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
            stance: 'hold_position',
            specialization: 'balanced',
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

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan',
              ships: fleet.ships,
              weaponsResearchLevel: attackerWeapons,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
            },
            {
              ownerId: targetPlanet.ownerId,
              ownerName: defenderPlayer?.name || 'Savunucu',
              ships: targetPlanet.garrison,
              weaponsResearchLevel: defenderWeapons,
              stance: targetPlanet.stance,
              defenses: targetPlanet.defenses,
              planetSpecialization: targetPlanet.specialization,
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
          this.handlePostCombatAdmiralXP(combatResult);

          // Update defender garrison, defenses, and deducted looted resources
          targetPlanet.garrison = combatResult.remainingDefender;
          if (combatResult.remainingDefenses) {
            targetPlanet.defenses = combatResult.remainingDefenses;
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

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan',
              ships: fleet.ships,
              weaponsResearchLevel: player?.research.weapons || 0,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
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

          fleet.ships = combatResult.remainingAttacker;
          fleet.cargo.ore += combatResult.lootedResources.ore;
          fleet.cargo.crystal += combatResult.lootedResources.crystal;
          fleet.cargo.fuel += combatResult.lootedResources.fuel;

          if (combatResult.report.winner === 'attacker') {
            activeTitanEvent.resolved = true;
            if (fleet.admiralId && this.state.admirals && this.state.admirals[fleet.admiralId]) {
              const adm = this.state.admirals[fleet.admiralId];
              const xpGain = 350;
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

          const combatResult = resolveCombat(
            {
              ownerId: fleet.ownerId,
              ownerName: player?.name || 'Saldırgan Komutan',
              ships: fleet.ships,
              weaponsResearchLevel: player?.research.weapons || 0,
              admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
              doctrine: fleet.doctrine || 'balanced',
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

            const reward = targetSystem.poi.reward || { ore: 1500, crystal: 1000, fuel: 500 };
            const xp = pirateBounty?.rewardXP || 200;

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
        const combatResult = resolveCombat(
          {
            ownerId: fleet.ownerId,
            ownerName: player?.name || 'Önleyici',
            ships: fleet.ships,
            weaponsResearchLevel: player?.research.weapons || 0,
            admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
            doctrine: fleet.doctrine || 'balanced',
          },
          {
            ownerId: targetFleet.ownerId,
            ownerName: defenderPlayer?.name || 'Hedef Filo',
            ships: targetFleet.ships,
            weaponsResearchLevel: defenderPlayer?.research.weapons || 0,
            admiral: targetFleet.admiralId && this.state.admirals ? this.state.admirals[targetFleet.admiralId] : undefined,
            doctrine: targetFleet.doctrine || 'balanced',
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

            const combatResult = resolveCombat(
              {
                ownerId: fleet.ownerId,
                ownerName: player?.name || 'İstila Filosu',
                ships: fleet.ships,
                weaponsResearchLevel: player?.research.weapons || 0,
                admiral: fleet.admiralId && this.state.admirals ? this.state.admirals[fleet.admiralId] : undefined,
                doctrine: fleet.doctrine || 'balanced',
              },
              {
                ownerId: this.state.relay.controllingPlayerId || 'neutral',
                ownerName: currentController,
                ships: this.state.relay.garrison,
                weaponsResearchLevel: 1,
                doctrine: 'fortress',
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
        const cost = getBuildingUpgradeCost(cmd.buildingType, currentLvl);

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

        const durationMs = getBuildingUpgradeDurationMs(cmd.buildingType, currentLvl);
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

        const stats = SHIP_STATS[cmd.shipType];
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

            // Check attacker newbie protection
            if (this.state.timeMs < player.protectionUntilTime) {
              const remainingHours = Math.ceil((player.protectionUntilTime - this.state.timeMs) / (3600 * 1000));
              return {
                success: false,
                commandType: cmd.type,
                error: `Acemi koruması altındasınız (${remainingHours} sa kaldı). PvP saldırısı başlatamazsınız.`,
                timeMs: this.state.timeMs,
              };
            }

            // Check defender newbie protection
            if (this.state.timeMs < targetOwner.protectionUntilTime) {
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
        for (const [type, count] of Object.entries(cmd.ships) as [ShipType, number][]) {
          if (count < 0 || (originPlanet.garrison[type] || 0) < count) {
            return { success: false, commandType: cmd.type, error: `Yetersiz ${SHIP_STATS[type].nameTr} garnizonda yok.`, timeMs: this.state.timeMs };
          }
          totalShips += count;
          totalCargoCap += count * SHIP_STATS[type].cargoCapacity;
        }

        if (totalShips <= 0) {
          return { success: false, commandType: cmd.type, error: 'Hiç gemi seçilmedi.', timeMs: this.state.timeMs };
        }

        // Route check
        const engineLevel = player.research.engines || 0;
        const route = calculateRouteInfo(
          originPlanet.systemId,
          cmd.targetSystemId,
          cmd.ships,
          this.state.map.lanes,
          engineLevel
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
          doctrine: fleetDoctrine,
        };

        this.state.fleets[fleetId] = newFleet;
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
        feeRate = Math.max(0.05, Math.min(0.20, feeRate));

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

        if (trans.type === 'truce_offer' && trans.truceDurationMs) {
          if (!this.state.truces) this.state.truces = {};
          const key = this.getTruceKey(trans.senderId, playerId);
          const expiresAtMs = this.state.timeMs + trans.truceDurationMs;
          this.state.truces[key] = expiresAtMs;
          trans.status = 'accepted';

          const durationMin = Math.round(trans.truceDurationMs / 60000);
          this.logEvent(
            'truce_established',
            `BARIŞ PAKTI İMZALANDI: ${responder?.name || playerId} ve ${trans.senderName} ${durationMin} dakika boyunca saldırmazlık ilan etti.`,
            playerId,
            { transmissionId: trans.id, expiresAtMs }
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
        const testRoute = calculateRouteInfo(
          colony.systemId,
          targetPlanet.systemId,
          { scout: 0, transport: 1, fighter: 0, battleship: 0 },
          this.state.map.lanes,
          engineLevel
        );

        if (!testRoute) {
          return {
            success: false,
            commandType: cmd.type,
            error: 'Hedef ana üsse seyrüsefer rotası bulunamadı.',
            timeMs: this.state.timeMs,
          };
        }

        const transportCap = SHIP_STATS.transport.cargoCapacity;
        const totalSurplusToShip = surplusOre + surplusCrystal + rawSurplusFuel;
        const neededTransports = Math.max(1, Math.min(availableTransports, Math.ceil(totalSurplusToShip / transportCap)));

        const actualRoute = calculateRouteInfo(
          colony.systemId,
          targetPlanet.systemId,
          { scout: 0, transport: neededTransports, fighter: 0, battleship: 0 },
          this.state.map.lanes,
          engineLevel
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

    this.state = {
      timeMs: 0,
      seed: newSeed,
      map,
      players: {},
      planets: {},
      fleets: {},
      admirals: {},
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
      battleReports: [],
      eventLog: [],
      victory: null,
      seasonHistory: previousHistory,
      nextId: 100,
    };

    this.scheduledEvents = [];
    this.lastMarketUpdateMs = 0;
    this.lastSectorEventSpawnMs = 0;

    // Schedule initial relay point tick
    this.scheduleEvent(GAME_CONSTANTS.RELAY_POINT_INTERVAL_MS, 'relay_point_tick', {});

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
