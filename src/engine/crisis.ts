import { SHIP_STATS } from './constants';
import { resolveCombat } from './combat';
import { getTraditionCombatMultiplier } from './traditions';
import {
  BattleReport,
  Fleet,
  GalacticCrisisState,
  GameState,
  Resources,
  ShipType,
  VoidAnchor,
  CrisisFleet,
} from './types';

export const CRISIS_CONFIGS = {
  BREACH_WARNING_DURATION_MS: 30_000,
  CRISIS_TICK_INTERVAL_MS: 15_000,
  ANCHOR_BASE_HP: 3500,
  ANCHOR_BASE_SHIELD: 1500,
  ANCHOR_BASE_ATTACK: 350,
  BEHEMOTH_BASE_HP: 12000,
  BEHEMOTH_BASE_SHIELD: 6000,
  BEHEMOTH_BASE_ATTACK: 1200,
  PURIFICATION_COST: { ore: 100, crystal: 300, fuel: 150 } as Resources,
  PURIFICATION_HEGEMONY_REWARD: 25,
  ANCHOR_KILL_HEGEMONY_REWARD: 50,
  BEHEMOTH_KILL_HEGEMONY_REWARD: 250,
  ALLIED_CRISIS_VICTORY_HEGEMONY_REWARD: 100,
  CUSTODIAN_CRISIS_ATTACK_BONUS: 0.20,
  GDF_SHIP_VALUE: {
    scout: 10,
    transport: 15,
    fighter: 50,
    battleship: 200,
  } as Record<ShipType, number>,
};

/**
 * Calculates attack multiplier for an empire against crisis entities (+20% for Custodian)
 */
export function calculateCrisisCombatModifier(attackerId: string, state: GameState): number {
  const isCustodian = state.senate?.custodianPlayerId === attackerId;
  return isCustodian ? 1.0 + CRISIS_CONFIGS.CUSTODIAN_CRISIS_ATTACK_BONUS : 1.0;
}

/**
 * Checks if the Dimensional Rift is vulnerable to assault (all anchors must be destroyed)
 */
export function canAssaultVoidRift(crisis: GalacticCrisisState | null | undefined): boolean {
  if (!crisis || crisis.stage === 'dormant' || crisis.stage === 'breaching') return false;
  if (crisis.stage === 'defeated') return false;
  return crisis.voidAnchors.every((a) => a.destroyed);
}

/**
 * Initializes the apocalyptic Void Incursion endgame crisis
 */
export function initializeGalacticCrisis(
  state: GameState,
  epicenterSystemId?: string
): GalacticCrisisState {
  // 1. Select Epicenter System (central relay or non-homeworld system)
  let epicenter = epicenterSystemId;
  if (!epicenter || !state.map.systems[epicenter]) {
    epicenter = state.map.relaySystemId || Object.keys(state.map.systems)[0];
  }

  // 2. Select 3 anchor systems around the galaxy
  const allSystemIds = Object.keys(state.map.systems).filter((id) => id !== epicenter);
  const anchorSys1 = allSystemIds[0] || epicenter;
  const anchorSys2 = allSystemIds[Math.floor(allSystemIds.length / 2)] || epicenter;
  const anchorSys3 = allSystemIds[allSystemIds.length - 1] || epicenter;

  const voidAnchors: VoidAnchor[] = [
    {
      id: 'void_anchor_alpha',
      name: 'Hiçlik Çıpası Alfa (Karanlık Sınır)',
      systemId: anchorSys1,
      hp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      maxHp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      shield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      maxShield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      defenseFleet: { scout: 0, transport: 0, fighter: 6, battleship: 1 },
      destroyed: false,
    },
    {
      id: 'void_anchor_beta',
      name: 'Hiçlik Çıpası Beta (Yıldız Boğazı)',
      systemId: anchorSys2,
      hp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      maxHp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      shield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      maxShield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      defenseFleet: { scout: 0, transport: 0, fighter: 8, battleship: 2 },
      destroyed: false,
    },
    {
      id: 'void_anchor_gamma',
      name: 'Hiçlik Çıpası Gama (Kayıp Uçurum)',
      systemId: anchorSys3,
      hp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      maxHp: CRISIS_CONFIGS.ANCHOR_BASE_HP,
      shield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      maxShield: CRISIS_CONFIGS.ANCHOR_BASE_SHIELD,
      defenseFleet: { scout: 0, transport: 0, fighter: 6, battleship: 2 },
      destroyed: false,
    },
  ];

  // 3. Find 1 or 2 planets to infest with Void Spores
  let candidatePlanets = Object.values(state.planets).filter((p) => !p.isHomeworld);
  if (candidatePlanets.length === 0) {
    for (const sys of Object.values(state.map.systems)) {
      for (const slot of sys.slots) {
        if (!state.planets[slot.planetId]) {
          state.planets[slot.planetId] = {
            id: slot.planetId,
            name: slot.name,
            systemId: sys.id,
            slotIndex: slot.slotIndex,
            ownerId: '',
            isHomeworld: false,
            resources: { ore: 500, crystal: 500, fuel: 500 },
            lastResourceUpdate: state.timeMs,
            storageCap: 5000,
            protectedCapacity: 1000,
            buildings: { ore_mine: 1, crystal_synth: 1, fuel_refinery: 1, shipyard: 0, research_lab: 0, sensor_array: 0 },
            buildingQueue: null,
            shipyardQueue: [],
            garrison: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
            stance: 'hold_position',
          };
          candidatePlanets.push(state.planets[slot.planetId]);
          break;
        }
      }
      if (candidatePlanets.length >= 2) break;
    }
  }

  if (candidatePlanets.length === 0) {
    candidatePlanets = Object.values(state.planets);
  }

  const infestedPlanetIds = candidatePlanets.slice(0, 2).map((p) => p.id);

  // 4. Initial roaming crisis fleets
  const crisisFleets: CrisisFleet[] = [
    {
      id: 'crisis_fleet_1',
      name: 'Hiçlik Avcı Filosu I',
      systemId: anchorSys1,
      targetSystemId: epicenter,
      ships: { scout: 2, transport: 0, fighter: 8, battleship: 1 },
      power: 650,
      status: 'patrolling',
    },
    {
      id: 'crisis_fleet_2',
      name: 'Hiçlik Yutucu Filosu II',
      systemId: anchorSys2,
      targetSystemId: anchorSys3,
      ships: { scout: 0, transport: 0, fighter: 6, battleship: 3 },
      power: 900,
      status: 'besieging',
    },
  ];

  const crisisState: GalacticCrisisState = {
    type: 'void_incursion',
    stage: 'breaching',
    epicenterSystemId: epicenter,
    riftIntegrity: 100,
    voidAnchors,
    infestedPlanetIds,
    crisisFleets,
    behemothHp: CRISIS_CONFIGS.BEHEMOTH_BASE_HP,
    behemothMaxHp: CRISIS_CONFIGS.BEHEMOTH_BASE_HP,
    behemothShield: CRISIS_CONFIGS.BEHEMOTH_BASE_SHIELD,
    behemothMaxShield: CRISIS_CONFIGS.BEHEMOTH_BASE_SHIELD,
    behemothDefeated: false,
    slayerPlayerId: null,
    gdfFleetUnits: { scout: 0, transport: 0, fighter: 0, battleship: 0 },
    gdfDonations: {},
    lastSpawnTimeMs: state.timeMs,
    startedAtMs: state.timeMs,
  };

  return crisisState;
}

/**
 * Simulation tick for Galactic Crisis lifecycle, breach transition, and anchor status
 */
export function tickGalacticCrisis(state: GameState, nowMs: number): void {
  const crisis = state.crisis;
  if (!crisis || crisis.stage === 'dormant' || crisis.stage === 'defeated') return;

  // 1. Breaching -> Active transition
  if (crisis.stage === 'breaching') {
    if (nowMs >= crisis.startedAtMs + CRISIS_CONFIGS.BREACH_WARNING_DURATION_MS) {
      crisis.stage = 'active';
      state.eventLog.push({
        id: `evt_${state.nextId++}`,
        timeMs: nowMs,
        type: 'crisis_breached',
        description: '🚨 BOYUTLARARASI HİÇLİK YARIĞI AÇILDI! Hiçlik Çıpaları galaksiyi kilitledi!',
      });
    }
    return;
  }

  // 2. Active stage: Track Anchors and transition to Apex if all destroyed
  if (crisis.stage === 'active') {
    const totalAnchors = crisis.voidAnchors.length;
    const remainingAnchors = crisis.voidAnchors.filter((a) => !a.destroyed).length;

    if (totalAnchors > 0) {
      crisis.riftIntegrity = Math.round((remainingAnchors / totalAnchors) * 100);
    }

    if (remainingAnchors === 0) {
      crisis.stage = 'apex';
      crisis.riftIntegrity = 0;
      state.eventLog.push({
        id: `evt_${state.nextId++}`,
        timeMs: nowMs,
        type: 'crisis_apex',
        description:
          '⚡ TÜM HİÇLİK ÇIPALARI İMHA EDİLDİ! Hiçlik Yarığının kalkanı çöktü; Kadim Hiçlik Behemotu belirdi!',
      });
    }
  }

  // 3. Apex stage: Check if Behemoth is slain
  if (crisis.stage === 'apex' && crisis.behemothDefeated) {
    crisis.stage = 'defeated';
    state.eventLog.push({
      id: `evt_${state.nextId++}`,
      timeMs: nowMs,
      type: 'crisis_defeated',
      description: '🌟 BOYUTLARARASI HİÇLİK İSTİLASI PÜSKÜRTÜLDÜ! Galaksi sonsuz karanlıktan kurtuldu!',
    });
  }
}

/**
 * Purifies an infested world, clearing the void blight
 */
export function purifyInfestedPlanet(
  state: GameState,
  playerId: string,
  planetId: string
): { success: boolean; error?: string } {
  const crisis = state.crisis;
  if (!crisis) return { success: false, error: 'Aktif bir kriz bulunmuyor.' };

  const planet = state.planets[planetId];
  if (!planet) return { success: false, error: 'Gezegen bulunamadı.' };
  if (!crisis.infestedPlanetIds.includes(planetId)) {
    return { success: false, error: 'Bu gezegen istila altında değil.' };
  }

  const cost = CRISIS_CONFIGS.PURIFICATION_COST;
  if (
    planet.resources.ore < cost.ore ||
    planet.resources.crystal < cost.crystal ||
    planet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz kaynak! Arındırma için ${cost.ore} Maden, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gereklidir.`,
    };
  }

  // Deduct cost
  planet.resources.ore -= cost.ore;
  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  // Clear infestation
  crisis.infestedPlanetIds = crisis.infestedPlanetIds.filter((id) => id !== planetId);

  // Award Hegemony points
  state.relay.weeklyPoints[playerId] =
    (state.relay.weeklyPoints[playerId] || 0) + CRISIS_CONFIGS.PURIFICATION_HEGEMONY_REWARD;

  state.eventLog.push({
    id: `evt_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'planet_purified',
    playerId,
    description: `✨ ${planet.name} gezegenindeki Hiçlik İstilası başarıyla arındırıldı! (+${CRISIS_CONFIGS.PURIFICATION_HEGEMONY_REWARD} Hegemonya Puanı)`,
  });

  return { success: true };
}

/**
 * Donates ships to the Galactic Defense Force (GDF)
 */
export function donateShipsToGDF(
  state: GameState,
  playerId: string,
  planetId: string,
  ships: Record<ShipType, number>
): { success: boolean; error?: string } {
  const crisis = state.crisis;
  if (!crisis) return { success: false, error: 'Aktif bir kriz bulunmuyor.' };

  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { success: false, error: 'Gezegen size ait değil.' };
  }

  // Check garrison availability
  let totalDonatedPower = 0;
  let totalShipsCount = 0;
  for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      if ((planet.garrison[st] || 0) < count) {
        return { success: false, error: `Yetersiz ${SHIP_STATS[st]?.nameTr || st} garnizonu!` };
      }
      totalShipsCount += count;
      totalDonatedPower += count * (CRISIS_CONFIGS.GDF_SHIP_VALUE[st] || 20);
    }
  }

  if (totalShipsCount === 0) {
    return { success: false, error: 'En az bir gemi bağışlanmalıdır.' };
  }

  // Deduct ships from planet and add to GDF
  for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      planet.garrison[st] -= count;
      crisis.gdfFleetUnits[st] = (crisis.gdfFleetUnits[st] || 0) + count;
    }
  }

  // Credit player's GDF contribution
  crisis.gdfDonations[playerId] = (crisis.gdfDonations[playerId] || 0) + totalDonatedPower;

  // Award a small diplomatic Hegemony reward
  const bonusPoints = Math.max(5, Math.round(totalDonatedPower / 20));
  state.relay.weeklyPoints[playerId] = (state.relay.weeklyPoints[playerId] || 0) + bonusPoints;

  state.eventLog.push({
    id: `evt_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'gdf_donation',
    playerId,
    description: `🛡️ ${planet.name} üzerinden Galaktik Savunma Filosu'na (GDF) ${totalShipsCount} gemi bağışlandı! (+${bonusPoints} Hegemonya Puanı)`,
  });

  return { success: true };
}

/**
 * Dispatches a strike fleet from the pooled Galactic Defense Force (Custodian command)
 */
export function dispatchGDFFleet(
  state: GameState,
  playerId: string,
  targetSystemId: string,
  ships: Record<ShipType, number>
): { success: boolean; error?: string; fleetId?: string } {
  const crisis = state.crisis;
  if (!crisis) return { success: false, error: 'Aktif bir kriz bulunmuyor.' };

  const isCustodian = state.senate?.custodianPlayerId === playerId;
  if (!isCustodian) {
    return {
      success: false,
      error: 'Yalnızca Galaktik Muhafız (Custodian) GDF filosunu doğrudan sevk edebilir!',
    };
  }

  // Check GDF ship pool
  let totalShips = 0;
  for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      if ((crisis.gdfFleetUnits[st] || 0) < count) {
        return { success: false, error: `GDF havuzunda yeterli ${SHIP_STATS[st]?.nameTr || st} yok!` };
      }
      totalShips += count;
    }
  }

  if (totalShips === 0) {
    return { success: false, error: 'En az bir gemi seçilmelidir.' };
  }

  // Origin system: player's homeworld or a starbase system
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const originPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  const originSystemId = originPlanet ? originPlanet.systemId : crisis.epicenterSystemId;

  // Deduct from pool
  for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
    if (count > 0) {
      crisis.gdfFleetUnits[st] -= count;
    }
  }

  const fleetId = `gdf_fleet_${state.nextId++}`;
  const gdfFleet: Fleet = {
    id: fleetId,
    name: 'Galaktik Savunma Filosu (GDF)',
    ownerId: playerId,
    ships: { ...ships },
    cargo: { ore: 0, crystal: 0, fuel: 0 },
    originSystemId,
    targetSystemId,
    path: [originSystemId, targetSystemId],
    pathIndex: 0,
    mission: 'attack',
    departureTime: state.timeMs,
    arrivalTime: state.timeMs + 20_000, // rapid deployment
    totalDistance: 100,
    speed: 5.0,
    fuelCost: 0,
    recallLockedAfterTime: state.timeMs + 10_000,
    isReturning: false,
    status: 'in_transit',
    doctrine: 'fortress',
  };

  state.fleets[fleetId] = gdfFleet;

  state.eventLog.push({
    id: `evt_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'gdf_dispatched',
    playerId,
    description: `🚀 Galaktik Muhafız, GDF Gücünü ${state.map.systems[targetSystemId]?.name || targetSystemId} sistemine sevk etti!`,
  });

  return { success: true, fleetId };
}

/**
 * Resolves naval assault on a Void Anchor
 */
export function resolveVoidAnchorAssault(
  state: GameState,
  playerId: string,
  anchorId: string,
  fleetId: string
): { success: boolean; error?: string; victory?: boolean; report?: BattleReport } {
  const crisis = state.crisis;
  if (!crisis) return { success: false, error: 'Aktif bir kriz bulunmuyor.' };

  const anchor = crisis.voidAnchors.find((a) => a.id === anchorId);
  if (!anchor) return { success: false, error: 'Hiçlik Çıpası bulunamadı.' };
  if (anchor.destroyed) return { success: false, error: 'Bu Hiçlik Çıpası zaten imha edilmiş.' };

  const fleet = state.fleets[fleetId];
  if (!fleet || fleet.ownerId !== playerId || fleet.status === 'destroyed') {
    return { success: false, error: 'Geçerli bir taarruz filosu seçilmelidir.' };
  }

  // Anchor system validation
  if (fleet.status !== 'orbiting' && fleet.targetSystemId !== anchor.systemId) {
    return { success: false, error: 'Filo, Hiçlik Çıpası sistemine intikal etmiş olmalıdır.' };
  }

  const player = state.players[playerId];
  const weaponsLevel = player?.research?.weapons || 0;
  const isCustodian = state.senate?.custodianPlayerId === playerId;
  const senateAttackMult = isCustodian ? 1.0 + CRISIS_CONFIGS.CUSTODIAN_CRISIS_ATTACK_BONUS : 1.0;

  // Resolve combat using the core deterministic engine
  const combatResult = resolveCombat(
    {
      ownerId: playerId,
      ownerName: player?.name || 'Muhafız Gücü',
      ships: { ...fleet.ships },
      weaponsResearchLevel: weaponsLevel,
      admiral: fleet.admiralId ? state.admirals?.[fleet.admiralId] : undefined,
      doctrine: fleet.doctrine,
      artifacts: player?.artifacts,
      senateAttackMultiplier: senateAttackMult,
      traditionAttackMultiplier: getTraditionCombatMultiplier(state, playerId, 'void_crisis', 'void_anchor').attackerMult,
      shipLoadouts: state.shipLoadouts?.[playerId],
    },
    {
      ownerId: 'void_crisis',
      ownerName: anchor.name,
      ships: { ...anchor.defenseFleet },
      weaponsResearchLevel: 3,
      defenses: {
        missile_battery: 2,
        plasma_turret: 2,
        ion_cannon: 1,
      },
    },
    anchor.systemId,
    state.map.systems[anchor.systemId]?.name || 'Hiçlik Sektörü',
    'void_anchor',
    undefined,
    1000,
    state.timeMs,
    state.seed + state.timeMs
  );

  // Update fleet state
  fleet.ships = { ...combatResult.remainingAttacker };
  const attackerRemainingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
  if (attackerRemainingCount === 0) {
    fleet.status = 'destroyed';
  }

  // Anchor defense casualties
  anchor.defenseFleet = { ...combatResult.remainingDefender };

  const isAnchorDestroyed = combatResult.report.winner === 'attacker';
  if (isAnchorDestroyed) {
    anchor.destroyed = true;
    anchor.hp = 0;
    anchor.shield = 0;

    // Award Hegemony points
    state.relay.weeklyPoints[playerId] =
      (state.relay.weeklyPoints[playerId] || 0) + CRISIS_CONFIGS.ANCHOR_KILL_HEGEMONY_REWARD;

    // Recalculate rift integrity
    const remaining = crisis.voidAnchors.filter((a) => !a.destroyed).length;
    crisis.riftIntegrity = Math.round((remaining / crisis.voidAnchors.length) * 100);

    state.eventLog.push({
      id: `evt_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'anchor_destroyed',
      playerId,
      description: `💥 ${anchor.name} İMHA EDİLDİ! Hiçlik Yarığı kalkanı zayıfladı (%${crisis.riftIntegrity})! (+${CRISIS_CONFIGS.ANCHOR_KILL_HEGEMONY_REWARD} Hegemonya Puanı)`,
    });

    if (remaining === 0) {
      crisis.stage = 'apex';
      crisis.riftIntegrity = 0;
      state.eventLog.push({
        id: `evt_${state.nextId++}`,
        timeMs: state.timeMs,
        type: 'crisis_apex',
        description: '⚡ TÜM ÇIPALAR DÜŞTÜ! Kadim Hiçlik Behemotu ana yarıktan belirdi!',
      });
    }
  }

  state.battleReports.push(combatResult.report);

  return {
    success: true,
    victory: isAnchorDestroyed,
    report: combatResult.report,
  };
}

/**
 * Resolves final apocalyptic assault on the Dimensional Rift & Void Behemoth
 */
export function resolveVoidRiftAssault(
  state: GameState,
  playerId: string,
  fleetId: string
): { success: boolean; error?: string; victory?: boolean; report?: BattleReport } {
  const crisis = state.crisis;
  if (!crisis) return { success: false, error: 'Aktif bir kriz bulunmuyor.' };

  if (!canAssaultVoidRift(crisis)) {
    return {
      success: false,
      error: 'Hiçlik Yarığı çıpalar aktifken aşılamaz bir alt-uzay kalkanı ile korunuyor! Önce tüm çıpaları yok edin.',
    };
  }

  const fleet = state.fleets[fleetId];
  if (!fleet || fleet.ownerId !== playerId || fleet.status === 'destroyed') {
    return { success: false, error: 'Geçerli bir taarruz filosu seçilmelidir.' };
  }

  const player = state.players[playerId];
  const weaponsLevel = player?.research?.weapons || 0;
  const isCustodian = state.senate?.custodianPlayerId === playerId;
  const senateAttackMult = isCustodian ? 1.0 + CRISIS_CONFIGS.CUSTODIAN_CRISIS_ATTACK_BONUS : 1.0;

  // The Void Behemoth boss fight
  const combatResult = resolveCombat(
    {
      ownerId: playerId,
      ownerName: player?.name || 'Galaktik Muhafız',
      ships: { ...fleet.ships },
      weaponsResearchLevel: weaponsLevel,
      admiral: fleet.admiralId ? state.admirals?.[fleet.admiralId] : undefined,
      doctrine: fleet.doctrine,
      artifacts: player?.artifacts,
      senateAttackMultiplier: senateAttackMult,
      traditionAttackMultiplier: getTraditionCombatMultiplier(state, playerId, 'void_behemoth', 'void_rift').attackerMult,
      shipLoadouts: state.shipLoadouts?.[playerId],
    },
    {
      ownerId: 'void_behemoth',
      ownerName: 'Kadim Hiçlik Behemotu',
      ships: {
        scout: 0,
        transport: 0,
        fighter: 12,
        battleship: 6, // represents colossal boss firepower
      },
      weaponsResearchLevel: 5,
      defenses: {
        missile_battery: 4,
        plasma_turret: 4,
        ion_cannon: 4,
      },
    },
    crisis.epicenterSystemId,
    state.map.systems[crisis.epicenterSystemId]?.name || 'Merkez Yarığı',
    'void_rift',
    undefined,
    1000,
    state.timeMs,
    state.seed + state.timeMs + 99
  );

  fleet.ships = { ...combatResult.remainingAttacker };
  const attackerRemainingCount = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
  if (attackerRemainingCount === 0) {
    fleet.status = 'destroyed';
  }

  const isBehemothSlain = combatResult.report.winner === 'attacker';
  if (isBehemothSlain) {
    crisis.behemothHp = 0;
    crisis.behemothShield = 0;
    crisis.behemothDefeated = true;
    crisis.slayerPlayerId = playerId;
    crisis.stage = 'defeated';

    // Award 250 Hegemony Points to the slayer
    state.relay.weeklyPoints[playerId] =
      (state.relay.weeklyPoints[playerId] || 0) + CRISIS_CONFIGS.BEHEMOTH_KILL_HEGEMONY_REWARD;

    // Award 100 Hegemony Points to all allied participants who donated to GDF
    for (const donatorId of Object.keys(crisis.gdfDonations)) {
      if (donatorId !== playerId) {
        state.relay.weeklyPoints[donatorId] =
          (state.relay.weeklyPoints[donatorId] || 0) +
          CRISIS_CONFIGS.ALLIED_CRISIS_VICTORY_HEGEMONY_REWARD;
      }
    }

    state.eventLog.push({
      id: `evt_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'behemoth_slain',
      playerId,
      description: `👑 ${player?.name || playerId} Kadim Hiçlik Behemotu'nu katletti ve Boyutlararası Yarığı mühürledi! (+${CRISIS_CONFIGS.BEHEMOTH_KILL_HEGEMONY_REWARD} Hegemonya Puanı)`,
    });
  }

  state.battleReports.push(combatResult.report);

  return {
    success: true,
    victory: isBehemothSlain,
    report: combatResult.report,
  };
}
