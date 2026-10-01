import { GameState, Planet, Player, SupplyChainSynergy, ColonyRole, CivilianConduitInfo } from './types';
import { getBreakthroughAutoSupplyCapacityMultiplier } from './breakthroughs';
import { findShortestRoute } from './flight';

/**
 * Determines the primary economic/strategic role of a planet in the supply network.
 */
export function evaluateColonyRole(planet: Planet): ColonyRole {
  // 1. Explicit planetary specialization takes absolute priority
  if (planet.specialization === 'mining_hub') return 'extractor';
  if (planet.specialization === 'tech_haven') return 'research';
  if (planet.specialization === 'military_bastion') return 'industrial';

  // 2. Otherwise evaluate by dominant infrastructure
  if ((planet.buildings.research_lab || 0) >= 2) return 'research';
  if ((planet.buildings.shipyard || 0) >= 2 || (planet.districts?.city || 0) >= 3) return 'industrial';
  if ((planet.districts?.mining || 0) >= 2) return 'extractor';

  // 3. Fallback based on building presence
  if ((planet.buildings.research_lab || 0) > 0) return 'research';
  if ((planet.buildings.shipyard || 0) > 0) return 'industrial';
  return 'extractor';
}

/**
 * Scans a player's colonies and evaluates inter-system hyperlane connectivity
 * to discover active 2-way and 3-way (Tri-Sector) supply chain synergies.
 */
export function findPlayerSupplyChains(state: GameState, playerId: string): SupplyChainSynergy[] {
  const player = state.players[playerId];
  if (!player) return [];

  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  if (myPlanets.length < 2) return [];

  // Map each colony to its role and system
  const colonyInfo = myPlanets.map((p) => ({
    planetId: p.id,
    systemId: p.systemId,
    role: evaluateColonyRole(p),
  }));

  const systemToColonies = new Map<string, typeof colonyInfo>();
  colonyInfo.forEach((ci) => {
    const list = systemToColonies.get(ci.systemId) || [];
    list.push(ci);
    systemToColonies.set(ci.systemId, list);
  });

  // Build adjacency graph of hyperlane connections between systems
  const adjacency = new Map<string, Set<string>>();
  for (const lane of state.map.lanes || []) {
    if (!adjacency.has(lane.fromSystemId)) adjacency.set(lane.fromSystemId, new Set());
    if (!adjacency.has(lane.toSystemId)) adjacency.set(lane.toSystemId, new Set());
    adjacency.get(lane.fromSystemId)!.add(lane.toSystemId);
    adjacency.get(lane.toSystemId)!.add(lane.fromSystemId);
  }

  // Helper: Check if path exists between sysA and sysB (hops <= 3)
  function areSystemsConnected(sysA: string, sysB: string): boolean {
    if (sysA === sysB) return true;
    const visited = new Set<string>([sysA]);
    const queue: [string, number][] = [[sysA, 0]];
    while (queue.length > 0) {
      const [curr, hops] = queue.shift()!;
      if (curr === sysB) return true;
      if (hops >= 3) continue;
      for (const next of adjacency.get(curr) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([next, hops + 1]);
        }
      }
    }
    return false;
  }

  const synergies: SupplyChainSynergy[] = [];
  const uniqueRoles = new Set(colonyInfo.map((c) => c.role));

  // Check if Tri-Sector Resonance is possible (has all 3 roles: extractor, industrial, research)
  if (
    uniqueRoles.has('extractor') &&
    uniqueRoles.has('industrial') &&
    uniqueRoles.has('research')
  ) {
    const extractorCol = colonyInfo.find((c) => c.role === 'extractor')!;
    const industrialCol = colonyInfo.find((c) => c.role === 'industrial')!;
    const researchCol = colonyInfo.find((c) => c.role === 'research')!;

    const eToI = areSystemsConnected(extractorCol.systemId, industrialCol.systemId);
    const iToR = areSystemsConnected(industrialCol.systemId, researchCol.systemId);
    const eToR = areSystemsConnected(extractorCol.systemId, researchCol.systemId);

    // If connected in a line or triangle
    if ((eToI && iToR) || (eToI && eToR) || (iToR && eToR)) {
      synergies.push({
        id: `synergy_tri_${playerId}`,
        playerId,
        tier: 2,
        connectedPlanetIds: [extractorCol.planetId, industrialCol.planetId, researchCol.planetId],
        connectedSystemIds: [extractorCol.systemId, industrialCol.systemId, researchCol.systemId],
        roles: ['extractor', 'industrial', 'research'],
        productionMultiplier: 1.25, // +25% all resources
        researchMultiplier: 1.15,   // +15% tech speed
        passiveMomentumPerMin: 35,  // +35 momentum/min
      });
      return synergies;
    }
  }

  // Otherwise check for Tier 1 Pair Synergy (2 distinct connected roles)
  for (let i = 0; i < colonyInfo.length; i++) {
    for (let j = i + 1; j < colonyInfo.length; j++) {
      const colA = colonyInfo[i];
      const colB = colonyInfo[j];
      if (colA.role !== colB.role && areSystemsConnected(colA.systemId, colB.systemId)) {
        synergies.push({
          id: `synergy_pair_${colA.planetId}_${colB.planetId}`,
          playerId,
          tier: 1,
          connectedPlanetIds: [colA.planetId, colB.planetId],
          connectedSystemIds: [colA.systemId, colB.systemId],
          roles: [colA.role, colB.role],
          productionMultiplier: 1.10, // +10% resources
          researchMultiplier: 1.05,
          passiveMomentumPerMin: 15,
        });
        return synergies; // 1 active pair is enough for Tier 1
      }
    }
  }

  return synergies;
}

/**
 * Ticks supply chains, updating player active synergies and passive momentum.
 */
export function updateSupplyChains(state: GameState, deltaSec: number): void {
  for (const player of Object.values(state.players)) {
    const synergies = findPlayerSupplyChains(state, player.id);
    player.supplyChains = synergies;
    player.activeSynergyTier = synergies.length > 0 ? synergies[0].tier : 0;

    // Passive Momentum Generation from active supply chains
    if (synergies.length > 0) {
      const bestSynergy = synergies[0];
      const momentumGain = (bestSynergy.passiveMomentumPerMin / 60) * deltaSec;
      const currentMomentum = player.momentum || 0;
      const newMomentum = currentMomentum + momentumGain;

      // Check if Golden Surge is reached
      if (newMomentum >= 100 && !player.surgeActiveUntilMs) {
        player.momentum = 0;
        player.surgeActiveUntilMs = state.timeMs + 90000; // 90 seconds
      } else if (newMomentum < 100) {
        player.momentum = Math.min(99.9, newMomentum);
      }
    }
  }

  // Phase 37: Automated Slipways Supply Conduits (Auto-Convoys)
  updateAutomatedSupplyConduits(state, state.timeMs);
}

/**
 * Checks if a hyperlane path is blockaded by hostile combat fleets.
 */
export function checkPathBlockade(
  state: GameState,
  path: string[],
  ownerId: string
): { isBlockaded: boolean; blockadedSystemId?: string } {
  const player = state.players[ownerId];
  const hostileFleets = Object.values(state.fleets).filter((f) => {
    if (f.ownerId === ownerId) return false;
    // Check alliance
    if (player?.allianceId) {
      const otherPlayer = state.players[f.ownerId];
      if (otherPlayer?.allianceId === player.allianceId) return false;
    }
    // Only combat missions blockade civilian corridors
    if (f.mission !== 'attack' && f.mission !== 'intercept') return false;
    return true;
  });

  for (const sysId of path) {
    const isThreatPresent = hostileFleets.some((f) => {
      if (f.status === 'in_transit') {
        return f.targetSystemId === sysId;
      }
      return f.targetSystemId === sysId;
    });

    if (isThreatPresent) {
      return { isBlockaded: true, blockadedSystemId: sysId };
    }
  }

  return { isBlockaded: false };
}

/**
 * Returns all active civilian supply conduits with real-time blockade and traffic status.
 */
export function getCivilianSupplyConduits(state: GameState, playerId?: string): CivilianConduitInfo[] {
  const conduits: CivilianConduitInfo[] = [];
  const targetPlayers = playerId
    ? (state.players[playerId] ? [state.players[playerId]] : [])
    : Object.values(state.players);

  for (const player of targetPlayers) {
    const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === player.id);
    const hw = myPlanets.find((p) => p.isHomeworld);
    if (!hw) continue;

    for (const colony of myPlanets) {
      if (colony.isHomeworld || !colony.autoSupplyEnabled) continue;

      const route = findShortestRoute(colony.systemId, hw.systemId, state.map.lanes);
      const path = route?.path || [colony.systemId, hw.systemId];

      const blockade = checkPathBlockade(state, path, player.id);

      const isTriResonance = player.activeSynergyTier === 2;
      const breakthroughMult = getBreakthroughAutoSupplyCapacityMultiplier(player);
      const baseTransfer = isTriResonance ? 900 : 600;
      const cargoTransferRate = baseTransfer * breakthroughMult;

      conduits.push({
        colonyPlanetId: colony.id,
        colonyPlanetName: colony.name,
        colonySystemId: colony.systemId,
        homeworldPlanetId: hw.id,
        homeworldPlanetName: hw.name,
        homeworldSystemId: hw.systemId,
        ownerId: player.id,
        ownerColor: player.color,
        isBlockaded: blockade.isBlockaded,
        blockadedSystemId: blockade.blockadedSystemId,
        path,
        cargoTransferRate,
        lastAutoSupplyTimeMs: colony.lastAutoSupplyTimeMs,
      });
    }
  }

  return conduits;
}

/**
 * Automatically transfers surplus resources from colonies with autoSupplyEnabled to homeworld.
 * Occurs periodically (every 20 seconds).
 * Preserves a safety reserve buffer on each colony (250 ore, 150 crystal, 100 fuel).
 * Consumes 5 fuel per delivery (free / 0 fuel if Tri-Sector Resonance is active).
 * Detects blockade by hostile fleets and suspends transport during siege.
 * Boosts player momentum by +2 per successful batch delivery.
 */
export function updateAutomatedSupplyConduits(state: GameState, nowMs: number): void {
  const SUPPLY_INTERVAL_MS = 20000;

  for (const player of Object.values(state.players)) {
    const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === player.id);
    const hw = myPlanets.find((p) => p.isHomeworld);
    if (!hw) continue;

    const isTriResonance = player.activeSynergyTier === 2;

    for (const colony of myPlanets) {
      if (colony.isHomeworld || !colony.autoSupplyEnabled) continue;

      const route = findShortestRoute(colony.systemId, hw.systemId, state.map.lanes);
      const path = route?.path || [colony.systemId, hw.systemId];

      // Blockade detection: check if hostile fleet is operating along conduit path
      const blockade = checkPathBlockade(state, path, player.id);
      if (blockade.isBlockaded) {
        colony.isConduitBlockaded = true;
        colony.blockadedSinceMs = colony.blockadedSinceMs || nowMs;
        continue; // Civilian freight halted under siege
      } else {
        colony.isConduitBlockaded = false;
        delete colony.blockadedSinceMs;
      }

      if ((colony.lastAutoSupplyTimeMs || 0) + SUPPLY_INTERVAL_MS > nowMs) {
        continue;
      }

      // Safety buffer: colony keeps at least 250 ore, 150 crystal, 100 fuel
      const buffer = { ore: 250, crystal: 150, fuel: 100 };
      const surplusOre = Math.max(0, colony.resources.ore - buffer.ore);
      const surplusCrystal = Math.max(0, colony.resources.crystal - buffer.crystal);
      const surplusFuel = Math.max(0, colony.resources.fuel - buffer.fuel);

      if (surplusOre + surplusCrystal + surplusFuel < 100) {
        continue;
      }

      const fuelCost = isTriResonance ? 0 : 5;
      if (colony.resources.fuel < fuelCost) {
        continue;
      }

      const breakthroughMult = getBreakthroughAutoSupplyCapacityMultiplier(player);

      // Max transfer capacity per batch (x1.5 during Tri-Sector Resonance, x2 with Otonom Freygatlar)
      const baseTransfer = isTriResonance
        ? { ore: 450, crystal: 300, fuel: 150 }
        : { ore: 300, crystal: 200, fuel: 100 };

      const maxTransfer = {
        ore: baseTransfer.ore * breakthroughMult,
        crystal: baseTransfer.crystal * breakthroughMult,
        fuel: baseTransfer.fuel * breakthroughMult,
      };

      const transferOre = Math.min(surplusOre, maxTransfer.ore);
      const transferCrystal = Math.min(surplusCrystal, maxTransfer.crystal);
      const transferFuel = Math.min(surplusFuel, maxTransfer.fuel);

      const hwCap = hw.storageCap || 20000;
      const canTakeOre = Math.max(0, Math.min(transferOre, hwCap - hw.resources.ore));
      const canTakeCrystal = Math.max(0, Math.min(transferCrystal, hwCap - hw.resources.crystal));
      const canTakeFuel = Math.max(0, Math.min(transferFuel, hwCap - hw.resources.fuel));

      if (canTakeOre + canTakeCrystal + canTakeFuel <= 0) {
        continue;
      }

      colony.resources.ore -= canTakeOre;
      colony.resources.crystal -= canTakeCrystal;
      colony.resources.fuel -= canTakeFuel + fuelCost;

      hw.resources.ore += canTakeOre;
      hw.resources.crystal += canTakeCrystal;
      hw.resources.fuel += canTakeFuel;

      colony.lastAutoSupplyTimeMs = nowMs;

      // Small momentum gain (+2)
      const currentMom = player.momentum || 0;
      if (currentMom + 2 >= 100 && !player.surgeActiveUntilMs) {
        player.momentum = 0;
        player.surgeActiveUntilMs = nowMs + 90000;
      } else if (currentMom < 100) {
        player.momentum = Math.min(99.9, currentMom + 2);
      }
    }
  }
}

/**
 * Returns production bonus multiplier provided by supply chain synergy for a planet.
 */
export function getSupplyChainProductionMultiplier(player?: Player, planetId?: string): number {
  if (!player?.supplyChains || player.supplyChains.length === 0) return 1.0;
  const activeSyn = player.supplyChains[0];
  if (!planetId || activeSyn.connectedPlanetIds.includes(planetId)) {
    return activeSyn.productionMultiplier;
  }
  return 1.0;
}
