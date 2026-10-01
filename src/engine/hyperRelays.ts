import {
  GameState,
  HyperRelay,
  HyperRelayPolicy,
  Player,
  Resources,
} from './types';
import { isFederationAlly } from './federations';

export const HYPER_RELAY_CONFIG = {
  CONSTRUCTION_COST: { ore: 600, crystal: 400, fuel: 300 } as Resources,
  CONSTRUCTION_TIME_MS: 30_000, // 30 seconds construction time
  DISMANTLE_REFUND_PERCENT: 0.40, // 40% refund on dismantle
  SPEED_MULTIPLIER: 3.0, // 3x speed across connected relay segments (duration / 3.0)
  FUEL_DISCOUNT: 0.50, // 50% fuel consumption discount
  TRADE_PROTECTION_BONUS: 100, // Immune to piracy build-up
  PLANET_STABILITY_BONUS: 5, // +5 stability to colonies in network
  HEGEMONY_REWARD_ON_BUILD: 15,
};

export interface HyperRelayPolicyConfig {
  policy: HyperRelayPolicy;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  icon: string;
  fleetSpeedMultiplier: number;
  tradeValueMultiplier: number;
  productionMultiplier: number;
}

export const HYPER_RELAY_POLICY_CONFIGS: Record<HyperRelayPolicy, HyperRelayPolicyConfig> = {
  military_priority: {
    policy: 'military_priority',
    nameTr: 'Askeri İntikal Önceliği',
    nameEn: 'Military Transit Priority',
    descriptionTr: 'Filoların hiper-hat intikal hızına ilave +%20 artış ve sistemde devriye gezen gemilere +%10 muharebe aurası sağlar.',
    icon: 'Crosshair',
    fleetSpeedMultiplier: 1.20,
    tradeValueMultiplier: 1.0,
    productionMultiplier: 1.0,
  },
  commercial_freight: {
    policy: 'commercial_freight',
    nameTr: 'Ticari Navlun & Kargo Otoyolu',
    nameEn: 'Commercial Freight Corridor',
    descriptionTr: 'Sistemden geçen Ticaret Değerine +%20 artış ve bağlı kolonilerin maden/enerji üretimine +%10 lojistik verim katar.',
    icon: 'Coins',
    fleetSpeedMultiplier: 1.0,
    tradeValueMultiplier: 1.20,
    productionMultiplier: 1.10,
  },
  rapid_civilian: {
    policy: 'rapid_civilian',
    nameTr: 'Sivil Transit & Kolonizasyon',
    nameEn: 'Civilian Rapid Transit',
    descriptionTr: 'Keşif ve nakliye gemilerinin yakıt tüketimine -%30 tasarruf ve bağlı kolonilerin nüfus büyümesine +%15 ivme kazandırır.',
    icon: 'Rocket',
    fleetSpeedMultiplier: 1.10,
    tradeValueMultiplier: 1.05,
    productionMultiplier: 1.05,
  },
};

/**
 * Validates whether a player can construct a Hyper Relay in the target star system
 */
export function canConstructHyperRelay(
  state: GameState,
  playerId: string,
  systemId: string,
  fundingPlanetId: string
): { success: boolean; error?: string } {
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı' };

  const system = state.map.systems[systemId];
  if (!system) return { success: false, error: 'Yıldız sistemi bulunamadı' };

  // Cannot build if system already has a Hyper Relay
  if (state.hyperRelays && state.hyperRelays[systemId]) {
    return { success: false, error: 'Bu yıldız sisteminde halihazırda bir Hiper-Röle bulunmaktadır' };
  }

  // System presence requirement: Must own at least one planet or starbase in the system
  const ownedPlanetsInSystem = Object.values(state.planets).filter(
    (p) => p.systemId === systemId && p.ownerId === playerId
  );
  const ownsStarbaseInSystem = state.starbases?.[systemId]?.ownerId === playerId;

  if (ownedPlanetsInSystem.length === 0 && !ownsStarbaseInSystem) {
    return {
      success: false,
      error: 'Hiper-Röle inşası için sistemde en az bir koloniniz veya yıldız üssünüz bulunmalıdır',
    };
  }

  // Funding planet validation
  const fundingPlanet = state.planets[fundingPlanetId];
  if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz finansman kolonisi' };
  }

  const cost = HYPER_RELAY_CONFIG.CONSTRUCTION_COST;
  if (
    fundingPlanet.resources.ore < cost.ore ||
    fundingPlanet.resources.crystal < cost.crystal ||
    fundingPlanet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz hammadde (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
    };
  }

  return { success: true };
}

/**
 * Orders the construction of a Hyper Relay in a star system
 */
export function constructHyperRelay(
  state: GameState,
  playerId: string,
  systemId: string,
  fundingPlanetId: string
): { success: boolean; error?: string } {
  const check = canConstructHyperRelay(state, playerId, systemId, fundingPlanetId);
  if (!check.success) return check;

  const fundingPlanet = state.planets[fundingPlanetId];
  const cost = HYPER_RELAY_CONFIG.CONSTRUCTION_COST;

  // Deduct resources
  fundingPlanet.resources.ore -= cost.ore;
  fundingPlanet.resources.crystal -= cost.crystal;
  fundingPlanet.resources.fuel -= cost.fuel;

  if (!state.hyperRelays) {
    state.hyperRelays = {};
  }

  const relayId = `hyper_relay_${systemId}`;
  const nowMs = state.timeMs;
  const finishMs = nowMs + HYPER_RELAY_CONFIG.CONSTRUCTION_TIME_MS;

  const relay: HyperRelay = {
    id: relayId,
    systemId,
    ownerId: playerId,
    isConstructing: true,
    constructionStartTimeMs: nowMs,
    constructionFinishTimeMs: finishMs,
    policy: 'military_priority',
  };

  state.hyperRelays[systemId] = relay;

  // Event Log
  state.eventLog.push({
    id: `evt_relay_const_${state.nextId++}`,
    timeMs: nowMs,
    type: 'hyper_relay_construction_started',
    playerId,
    description: `⚡ HİPER-RÖLE İNŞAATI BAŞLADI: ${state.map.systems[systemId]?.name || systemId} sisteminde orbital röle montajı başladı. Tamamlanma: ${Math.round(HYPER_RELAY_CONFIG.CONSTRUCTION_TIME_MS / 1000)}s`,
    metadata: { systemId, relayId },
  });

  return { success: true };
}

/**
 * Sets the active policy / doctrine for a Hyper Relay
 */
export function setHyperRelayPolicy(
  state: GameState,
  playerId: string,
  systemId: string,
  policy: HyperRelayPolicy
): { success: boolean; error?: string } {
  const relay = state.hyperRelays?.[systemId];
  if (!relay) return { success: false, error: 'Hiper-Röle bulunamadı' };
  if (relay.ownerId !== playerId) return { success: false, error: 'Bu Hiper-Röleye sahip değilsiniz' };

  relay.policy = policy;
  return { success: true };
}

/**
 * Dismantles an active or constructing Hyper Relay, refunding partial resources
 */
export function dismantleHyperRelay(
  state: GameState,
  playerId: string,
  systemId: string
): { success: boolean; error?: string } {
  const relay = state.hyperRelays?.[systemId];
  if (!relay) return { success: false, error: 'Hiper-Röle bulunamadı' };
  if (relay.ownerId !== playerId) return { success: false, error: 'Bu Hiper-Röleye sahip değilsiniz' };

  // Refund partial resources to homeworld or first colony
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  if (primaryPlanet) {
    const cost = HYPER_RELAY_CONFIG.CONSTRUCTION_COST;
    const rate = HYPER_RELAY_CONFIG.DISMANTLE_REFUND_PERCENT;
    primaryPlanet.resources.ore += Math.round(cost.ore * rate);
    primaryPlanet.resources.crystal += Math.round(cost.crystal * rate);
    primaryPlanet.resources.fuel += Math.round(cost.fuel * rate);
  }

  if (state.hyperRelays) {
    delete state.hyperRelays[systemId];
  }

  state.eventLog.push({
    id: `evt_relay_dismantle_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'hyper_relay_dismantled',
    playerId,
    description: `🔧 HİPER-RÖLE SÖKÜLDÜ: ${state.map.systems[systemId]?.name || systemId} sistemindeki röle tesisi sökülerek geri dönüştürüldü.`,
    metadata: { systemId },
  });

  return { success: true };
}

/**
 * Returns a set of all star system IDs with active, completed Hyper Relays accessible by playerId
 */
export function getActiveHyperRelaySystemIds(
  state: GameState,
  playerId?: string
): Set<string> {
  const activeSystems = new Set<string>();
  if (!state.hyperRelays) return activeSystems;

  for (const relay of Object.values(state.hyperRelays)) {
    if (relay.isConstructing) continue;

    if (!playerId) {
      activeSystems.add(relay.systemId);
      continue;
    }

    // Accessible if owned by player, neutral, or allied/federation
    if (relay.ownerId === playerId) {
      activeSystems.add(relay.systemId);
    } else {
      const isAlly =
        state.players[playerId]?.allianceId &&
        state.players[playerId]?.allianceId === state.players[relay.ownerId]?.allianceId;
      const isFed = isFederationAlly(state, playerId, relay.ownerId);
      if (isAlly || isFed) {
        activeSystems.add(relay.systemId);
      }
    }
  }

  return activeSystems;
}

/**
 * Checks whether an edge between systemA and systemB is an active Hyper Relay transit corridor
 */
export function isHyperRelayNetworkLink(
  state: GameState,
  systemAId: string,
  systemBId: string,
  playerId?: string
): boolean {
  const activeRelays = getActiveHyperRelaySystemIds(state, playerId);
  if (!activeRelays.has(systemAId) || !activeRelays.has(systemBId)) {
    return false;
  }

  // Must have a direct flight lane
  return state.map.lanes.some(
    (lane) =>
      (lane.fromSystemId === systemAId && lane.toSystemId === systemBId) ||
      (lane.fromSystemId === systemBId && lane.toSystemId === systemAId)
  );
}

/**
 * Ticks hyper relay construction timers and finishes completed relays
 */
export function updateHyperRelays(state: GameState, deltaMs: number): void {
  if (!state.hyperRelays || deltaMs <= 0) return;

  const nowMs = state.timeMs;

  for (const relay of Object.values(state.hyperRelays)) {
    if (relay.isConstructing && nowMs >= relay.constructionFinishTimeMs) {
      relay.isConstructing = false;

      const player = state.players[relay.ownerId];
      if (player && state.victory) {
        // Award hegemony progress
      }

      state.eventLog.push({
        id: `evt_relay_ready_${state.nextId++}`,
        timeMs: nowMs,
        type: 'hyper_relay_completed',
        playerId: relay.ownerId,
        description: `🌐 HİPER-RÖLE AKTİF: ${state.map.systems[relay.systemId]?.name || relay.systemId} sistemindeki hiper-röle devreye girdi! Hızlı transit koridoru açıldı.`,
        metadata: { systemId: relay.systemId },
      });
    }
  }
}

/**
 * Computes bonuses granted by an active Hyper Relay in a star system
 */
export function getHyperRelaySystemBonuses(
  state: GameState,
  systemId: string
): {
  stabilityBonus: number;
  tradeValueMultiplier: number;
  productionMultiplier: number;
  fleetSpeedMultiplier: number;
  tradeProtection: number;
} {
  const relay = state.hyperRelays?.[systemId];
  if (!relay || relay.isConstructing) {
    return {
      stabilityBonus: 0,
      tradeValueMultiplier: 1.0,
      productionMultiplier: 1.0,
      fleetSpeedMultiplier: 1.0,
      tradeProtection: 0,
    };
  }

  const policyCfg = HYPER_RELAY_POLICY_CONFIGS[relay.policy] || HYPER_RELAY_POLICY_CONFIGS.military_priority;

  return {
    stabilityBonus: HYPER_RELAY_CONFIG.PLANET_STABILITY_BONUS,
    tradeValueMultiplier: policyCfg.tradeValueMultiplier,
    productionMultiplier: policyCfg.productionMultiplier,
    fleetSpeedMultiplier: policyCfg.fleetSpeedMultiplier,
    tradeProtection: HYPER_RELAY_CONFIG.TRADE_PROTECTION_BONUS,
  };
}
