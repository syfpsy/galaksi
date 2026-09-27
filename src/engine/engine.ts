import {
  BUILDING_STATS,
  calculateHourlyProduction,
  GAME_CONSTANTS,
  getBuildingUpgradeCost,
  getBuildingUpgradeDurationMs,
  getResearchCost,
  getResearchDurationMs,
  getShipBuildDurationMs,
  RESEARCH_STATS,
  SHIP_STATS,
} from './constants';
import { resolveCombat } from './combat';
import { calculateRouteInfo, checkInterceptionFeasibility } from './flight';
import { filterGameStateForPlayer, PlayerVisibleState } from './fog';
import { PRNG } from './prng';
import {
  BuildingType,
  CommandReceipt,
  Fleet,
  GameCommand,
  GameEventRecord,
  GameState,
  Planet,
  Player,
  ResearchType,
  Resources,
  ScheduledEvent,
  ShipType,
} from './types';
import { createHomeworldPlanet, generateSectorMap } from './universe';

export class GameEngine {
  public state: GameState;
  private scheduledEvents: ScheduledEvent[] = [];
  private prng: PRNG;

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
      relay: {
        systemId: map.relaySystemId,
        controllingPlayerId: null,
        garrison: { scout: 2, transport: 0, fighter: 4, battleship: 1 },
        capturedAtTime: 0,
        weeklyPoints: {},
        sensorRadiusBonus: GAME_CONSTANTS.RELAY_SENSOR_RADIUS_BONUS,
      },
      battleReports: [],
      eventLog: [],
      nextId: 100,
    };

    // Schedule initial relay point tick
    this.scheduleEvent(GAME_CONSTANTS.RELAY_POINT_INTERVAL_MS, 'relay_point_tick', {});
  }

  // --- Player Management ---
  public addPlayer(
    id: string,
    name: string,
    color: string,
    isBot: boolean = false,
    botArchetype?: Player['botArchetype']
  ): { player: Player; homeworld: Planet } {
    const player: Player = {
      id,
      name,
      color,
      isBot,
      botArchetype,
      research: { engines: 0, weapons: 0, sensors: 0 },
      researchQueue: null,
      protectionUntilTime: this.state.timeMs + GAME_CONSTANTS.PROTECTION_DURATION_MS,
      intel: {
        discoveredSystems: {},
        lastSeenFleets: {},
      },
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
    this.state.players[id] = player;
    this.state.planets[planetId] = homeworld;

    // Player discovers their own system immediately
    player.intel.discoveredSystems[targetSys.id] = 'full';

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
  }

  public advanceTo(targetTime: number): void {
    if (targetTime <= this.state.timeMs) return;
    this.tick(targetTime - this.state.timeMs);
  }

  // --- Passive Resource & Production Accumulator ---
  private updatePassiveProduction(nowMs: number): void {
    for (const planet of Object.values(this.state.planets)) {
      const elapsedMs = nowMs - planet.lastResourceUpdate;
      if (elapsedMs <= 0) continue;

      const elapsedHours = elapsedMs / (3600 * 1000);

      const oreProd = calculateHourlyProduction('ore', planet.buildings.ore_mine);
      const crystalProd = calculateHourlyProduction('crystal', planet.buildings.crystal_synth);
      const fuelProd = calculateHourlyProduction('fuel', planet.buildings.fuel_refinery);

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
    }
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
        break;
      }

      case 'fleet_arrival': {
        const { fleetId } = event.payload as { fleetId: string };
        const fleet = this.state.fleets[fleetId];
        if (!fleet || fleet.status === 'destroyed') return;

        this.handleFleetArrival(fleet);
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
        if (targetSystem.poi && !targetSystem.poi.explored && targetSystem.poi.reward) {
          targetSystem.poi.explored = true;
          gatheredOre = targetSystem.poi.reward.ore;
          gatheredCrystal = targetSystem.poi.reward.crystal;
          gatheredFuel = targetSystem.poi.reward.fuel;
          this.logEvent(
            'poi_discovered',
            `${fleet.name} ${targetSystem.name} sisteminde ${targetSystem.poi.type} keşfetti ve kaynak topladı!`,
            fleet.ownerId
          );
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
        // Find empty slot
        const emptySlot = targetSystem.slots.find(s => s.ownerId === null);
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
            garrison: { scout: 0, transport: 0, fighter: 1, battleship: 0 },
            stance: 'hold_position',
          };

          emptySlot.ownerId = fleet.ownerId;
          this.state.planets[newPlanetId] = newPlanet;

          if (player) {
            player.intel.discoveredSystems[targetSystem.id] = 'full';
          }

          this.logEvent(
            'colony_founded',
            `${fleet.name} ${targetSystem.name} sisteminde yeni bir koloni kurdu!`,
            fleet.ownerId
          );

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

        // Deliver cargo if targeted at own planet
        if (fleet.targetPlanetId && this.state.planets[fleet.targetPlanetId]) {
          const targetPlanet = this.state.planets[fleet.targetPlanetId];
          if (targetPlanet.ownerId === fleet.ownerId) {
            targetPlanet.resources.ore = Math.min(targetPlanet.storageCap, targetPlanet.resources.ore + fleet.cargo.ore);
            targetPlanet.resources.crystal = Math.min(targetPlanet.storageCap, targetPlanet.resources.crystal + fleet.cargo.crystal);
            targetPlanet.resources.fuel = Math.min(targetPlanet.storageCap, targetPlanet.resources.fuel + fleet.cargo.fuel);
            fleet.cargo = { ore: 0, crystal: 0, fuel: 0 };
          }
        }

        this.orderFleetReturn(fleet);
        break;
      }

      case 'attack': {
        // Planet raid combat
        const targetPlanet = fleet.targetPlanetId ? this.state.planets[fleet.targetPlanetId] : null;
        if (!targetPlanet || targetPlanet.ownerId === fleet.ownerId) {
          this.orderFleetReturn(fleet);
          return;
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
          },
          {
            ownerId: targetPlanet.ownerId,
            ownerName: defenderPlayer?.name || 'Savunucu',
            ships: targetPlanet.garrison,
            weaponsResearchLevel: defenderWeapons,
            stance: targetPlanet.stance,
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

        // Update defender garrison and deducted looted resources
        targetPlanet.garrison = combatResult.remainingDefender;
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
          delete this.state.fleets[fleet.id];
        }
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
          },
          {
            ownerId: targetFleet.ownerId,
            ownerName: defenderPlayer?.name || 'Hedef Filo',
            ships: targetFleet.ships,
            weaponsResearchLevel: defenderPlayer?.research.weapons || 0,
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

        // Add debris
        if (!targetSystem.hasDebris) targetSystem.hasDebris = { ore: 0, crystal: 0, fuel: 0 };
        targetSystem.hasDebris.ore += combatResult.debrisFieldCreated.ore;
        targetSystem.hasDebris.crystal += combatResult.debrisFieldCreated.crystal;

        fleet.ships = combatResult.remainingAttacker;
        targetFleet.ships = combatResult.remainingDefender;

        if (Object.values(targetFleet.ships).reduce((a, b) => a + b, 0) === 0) {
          targetFleet.status = 'destroyed';
          delete this.state.fleets[targetFleet.id];
        }

        const survivingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
        if (survivingCount > 0) {
          this.orderFleetReturn(fleet);
        } else {
          fleet.status = 'destroyed';
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
              },
              {
                ownerId: this.state.relay.controllingPlayerId || 'neutral',
                ownerName: currentController,
                ships: this.state.relay.garrison,
                weaponsResearchLevel: 1,
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

            if (combatResult.report.winner === 'attacker') {
              this.state.relay.controllingPlayerId = fleet.ownerId;
              this.state.relay.garrison = combatResult.remainingAttacker;
              this.state.relay.capturedAtTime = this.state.timeMs;
              fleet.status = 'destroyed';
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

        const durationMs = getResearchDurationMs(cmd.researchType, currentLvl, maxLab);
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

        const unitBuildTimeMs = getShipBuildDurationMs(cmd.shipType, planet.buildings.shipyard);
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

      case 'DISPATCH_FLEET': {
        const originPlanet = this.state.planets[cmd.originPlanetId];
        if (!originPlanet || originPlanet.ownerId !== playerId) {
          return { success: false, commandType: cmd.type, error: 'Kalkış üssü bulunamadı.', timeMs: this.state.timeMs };
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

        // Check fuel
        if (originPlanet.resources.fuel < route.fuelCost) {
          return { success: false, commandType: cmd.type, error: `Yetersiz yakıt (${route.fuelCost} birim gerekli).`, timeMs: this.state.timeMs };
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
        originPlanet.resources.fuel -= route.fuelCost;
        originPlanet.resources.ore -= cargo.ore;
        originPlanet.resources.crystal -= cargo.crystal;
        originPlanet.resources.fuel -= cargo.fuel;

        const fleetId = `fleet_${this.state.nextId++}`;
        const departureTime = this.state.timeMs;
        const arrivalTime = departureTime + route.durationMs;
        const recallLockedAfterTime = departureTime + (route.durationMs * GAME_CONSTANTS.RECALL_LOCK_RATIO);

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
          speed: route.speed,
          fuelCost: route.fuelCost,
          recallLockedAfterTime,
          isReturning: false,
          status: 'in_transit',
        };

        this.state.fleets[fleetId] = newFleet;
        this.scheduleEvent(route.durationMs, 'fleet_arrival', { fleetId });

        this.logEvent(
          'fleet_dispatched',
          `${newFleet.name} sevk edildi -> ${cmd.mission.toUpperCase()} (${route.path.join(' -> ')}). Varış: ${Math.round(route.durationMs / 1000)}s`,
          playerId
        );

        return {
          success: true,
          commandType: cmd.type,
          timeMs: this.state.timeMs,
          data: { fleetId, arrivalTime, durationMs: route.durationMs },
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
    }
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
