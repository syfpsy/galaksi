import { GameState, Planet, Player, SupplyChainSynergy, ColonyRole } from './types';

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
