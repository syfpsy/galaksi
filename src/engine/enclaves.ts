/**
 * CANLI GALAKSİ - Phase 31: Galactic Enclaves, Caravaneers & Shroud Factions
 * Core Headless Engine module for independent neutral enclaves (Curator, Artisan, Trader, Shroud)
 * and nomadic roaming caravaneer trade fleets.
 */

import {
  GameState,
  StarSystem,
  Resources,
  EnclaveType,
  EnclaveServiceId,
  EnclaveContract,
  EnclaveStation,
  CaravaneerFleet,
  Army,
} from './types';

export interface EnclaveConfig {
  type: EnclaveType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  accentColor: string;
}

export const ENCLAVE_CONFIGS: Record<EnclaveType, EnclaveConfig> = {
  curator_order: {
    type: 'curator_order',
    nameTr: 'Kadim Küratör Tarikatı',
    descriptionTr: 'Milyonlarca yıllık galaktik arşivi koruyan antik bilge keşişler. Bilimsel sırlar ve kadim canavar zaaflarını paylaşırlar.',
    icon: 'BookOpen',
    accentColor: '#38bdf8',
  },
  artisan_troupe: {
    type: 'artisan_troupe',
    nameTr: 'Galaktik Sanatçılar Cemiyeti',
    descriptionTr: 'Dünyaların kültürel birliğini yücelten sahne ustaları, şairler ve mimarlar. Büyük festivaller ve sanat anıtları düzenlerler.',
    icon: 'Palette',
    accentColor: '#f43f5e',
  },
  trader_enclave: {
    type: 'trader_enclave',
    nameTr: 'Tüccar Locası & Maden Konsorsiyumu',
    descriptionTr: 'Bağımsız uzay istasyonlarında faaliyet gösteren serbest tüccarlar. Büyük maden sevkiyatları ve kiralık ordu lejyonları sağlarlar.',
    icon: 'CircleDollarSign',
    accentColor: '#f59e0b',
  },
  shroud_coven: {
    type: 'shroud_coven',
    nameTr: 'Zihinsel Örtü Meclisi & Psionik Kâhinler',
    descriptionTr: 'Zaman ve mekanın ötesindeki Örtü (Shroud) boyutuna dokunan psionik kâhinler. Kader lütufları ve kozmik paktlar sunarlar.',
    icon: 'Sparkles',
    accentColor: '#a855f7',
  },
};

export interface EnclaveServiceConfig {
  serviceId: EnclaveServiceId;
  enclaveType: EnclaveType;
  nameTr: string;
  descriptionTr: string;
  cost: Resources;
  durationMs: number;
  instantReward?: Partial<Resources>;
}

export const ENCLAVE_SERVICES: Record<EnclaveServiceId, EnclaveServiceConfig> = {
  // Curator Order
  hire_curator_researcher: {
    serviceId: 'hire_curator_researcher',
    enclaveType: 'curator_order',
    nameTr: 'Küratör Başbilimci Kirala',
    descriptionTr: '30 dakika boyunca imparatorluğun tüm araştırma hızını +%15 artırır.',
    cost: { ore: 0, crystal: 500, fuel: 300 },
    durationMs: 30 * 60 * 1000,
  },
  purchase_ancient_survey: {
    serviceId: 'purchase_ancient_survey',
    enclaveType: 'curator_order',
    nameTr: 'Kadim Yıldız Haritası Satın Al',
    descriptionTr: 'Sektördeki 2 keşfedilmemiş sistemi haritalar ve kazı hızını +%25 artırır.',
    cost: { ore: 400, crystal: 400, fuel: 200 },
    durationMs: 20 * 60 * 1000,
  },
  titan_combat_insights: {
    serviceId: 'titan_combat_insights',
    enclaveType: 'curator_order',
    nameTr: 'Titan & Kriz Zayıflık Doktrini',
    descriptionTr: 'Kadim Titanlara ve Kriz canavarlarına karşı filolarınıza +%20 saldırı bonusu sağlar.',
    cost: { ore: 500, crystal: 600, fuel: 400 },
    durationMs: 25 * 60 * 1000,
  },

  // Artisan Troupe
  sponsor_grand_festival: {
    serviceId: 'sponsor_grand_festival',
    enclaveType: 'artisan_troupe',
    nameTr: 'Büyük Dünyalar Festivali Sponsorluğu',
    descriptionTr: '20 dakika boyunca tüm kolonilerde +%15 Stabilite ve +%25 Kültürel Birlik (Unity) kazancı.',
    cost: { ore: 600, crystal: 300, fuel: 300 },
    durationMs: 20 * 60 * 1000,
  },
  commission_art_monument: {
    serviceId: 'commission_art_monument',
    enclaveType: 'artisan_troupe',
    nameTr: 'Büyük Galaktik Kültür Anıtı',
    descriptionTr: 'Gezegene görkemli bir anıt dikilir; saatte +50 Birlik üretir ve gezegen değerini artırır.',
    cost: { ore: 1000, crystal: 500, fuel: 200 },
    durationMs: 60 * 60 * 1000,
  },
  acquire_ministry_of_culture: {
    serviceId: 'acquire_ministry_of_culture',
    enclaveType: 'artisan_troupe',
    nameTr: 'Kültür Bakanlığı Şubesi',
    descriptionTr: 'Gezegende kalıcı kültür binası tahsis edilir; araştırma ve diplomasi ağırlığı +%10 artar.',
    cost: { ore: 1200, crystal: 600, fuel: 400 },
    durationMs: 45 * 60 * 1000,
  },

  // Trader Enclave
  bulk_mineral_contract: {
    serviceId: 'bulk_mineral_contract',
    enclaveType: 'trader_enclave',
    nameTr: 'Toplu Cevher Tedarik Kontratı',
    descriptionTr: '800 Yakıt karşılığında depolara anında 2500 Cevher sevk edilir.',
    cost: { ore: 0, crystal: 0, fuel: 800 },
    instantReward: { ore: 2500, crystal: 0, fuel: 0 },
    durationMs: 0,
  },
  rare_crystal_monopoly: {
    serviceId: 'rare_crystal_monopoly',
    enclaveType: 'trader_enclave',
    nameTr: 'Nadir Kristal İthalatı',
    descriptionTr: '1500 Cevher karşılığında depolara anında 1000 Kristal aktarılır.',
    cost: { ore: 1500, crystal: 0, fuel: 0 },
    instantReward: { ore: 0, crystal: 1000, fuel: 0 },
    durationMs: 0,
  },
  hire_mercenary_corps: {
    serviceId: 'hire_mercenary_corps',
    enclaveType: 'trader_enclave',
    nameTr: 'Kiralık Lejyon Kolordusu',
    descriptionTr: 'Gezegenin garnizonuna 2 adet deneyimli (Veteran) Piyade Taarruz ordusu sevk edilir.',
    cost: { ore: 600, crystal: 400, fuel: 300 },
    durationMs: 0,
  },

  // Shroud Coven
  commune_with_shroud: {
    serviceId: 'commune_with_shroud',
    enclaveType: 'shroud_coven',
    nameTr: 'Örtü Boyutu ile Zihinsel Temas',
    descriptionTr: 'Örtü varlıklarıyla temas kurulur. Rastgele 15 dakikalık Psionik Lütuf bahşedilir (+%20 Hız, +%25 Kalkan, +%20 Evasion veya +%20 Araştırma).',
    cost: { ore: 300, crystal: 500, fuel: 300 },
    durationMs: 15 * 60 * 1000,
  },
  shroud_patron_covenant: {
    serviceId: 'shroud_patron_covenant',
    enclaveType: 'shroud_coven',
    nameTr: 'Kozmik Örtü Paktı (Covenant)',
    descriptionTr: 'Fısıldayanlar Meclisi ile derin pakt. 25 dakika boyunca tüm gemi kalkanlarına +%30 takviye.',
    cost: { ore: 800, crystal: 800, fuel: 500 },
    durationMs: 25 * 60 * 1000,
  },
  psionic_precognition: {
    serviceId: 'psionic_precognition',
    enclaveType: 'shroud_coven',
    nameTr: 'Psionik Sezgi & Gelecek Algısı',
    descriptionTr: 'Tüm komşu sistemlerdeki düşman filo hareketleri ve planları anında zihne yansır.',
    cost: { ore: 400, crystal: 600, fuel: 300 },
    durationMs: 15 * 60 * 1000,
  },
};

/**
 * Initializes independent Enclave Stations in non-homeworld systems across the galaxy
 */
export function initializeGalaxyEnclaves(systems: Record<string, StarSystem>): Record<string, EnclaveStation> {
  const systemIds = Object.keys(systems);
  const enclaves: Record<string, EnclaveStation> = {};

  const enclaveDefs: { type: EnclaveType; name: string }[] = [
    { type: 'curator_order', name: 'Küratör Baş Kütüphane İstasyonu' },
    { type: 'artisan_troupe', name: 'Büyük Sanatçılar Tiyatro Kolonisi' },
    { type: 'trader_enclave', name: 'Merkezi Ticaret & Maden Borsası' },
    { type: 'shroud_coven', name: 'Kozmik Örtü Psionik Mabedi' },
  ];

  let sysIdx = 1;
  for (const def of enclaveDefs) {
    const assignedSystemId = systemIds[sysIdx % systemIds.length];
    const id = `enclave_${def.type}`;
    enclaves[id] = {
      id,
      type: def.type,
      name: def.name,
      systemId: assignedSystemId,
      opinion: {},
      totalDealsDone: {},
      activeContracts: {},
    };
    sysIdx += 2;
  }

  return enclaves;
}

/**
 * Initializes roaming caravaneer trade fleets
 */
export function initializeCaravaneers(systems: Record<string, StarSystem>): CaravaneerFleet[] {
  const systemIds = Object.keys(systems);
  const sys1 = systemIds[0] || 'sys_1';
  const sys2 = systemIds[Math.min(2, systemIds.length - 1)] || 'sys_2';

  return [
    {
      id: 'caravan_racket',
      name: 'Racket Çöpçüleri Karavanı',
      currentSystemId: sys1,
      targetSystemId: sys2,
      status: 'orbiting',
      departureTimeMs: 0,
      arrivalTimeMs: 0,
      dealType: 'reliquary',
      reliquaryPrice: { ore: 300, crystal: 200, fuel: 150 },
      slotsBetAmount: 100,
    },
    {
      id: 'caravan_numistic',
      name: 'Numistic Düzen Kervanı',
      currentSystemId: sys2,
      targetSystemId: sys1,
      status: 'orbiting',
      departureTimeMs: 0,
      arrivalTimeMs: 0,
      dealType: 'gambling_slots',
      reliquaryPrice: { ore: 400, crystal: 300, fuel: 200 },
      slotsBetAmount: 200,
    },
  ];
}

/**
 * Validates if a player can purchase an enclave service
 */
export function canInteractWithEnclave(
  state: GameState,
  playerId: string,
  enclaveId: string,
  serviceId: EnclaveServiceId,
  planetId?: string
): { ok: boolean; reason?: string } {
  const enclave = state.enclaves?.[enclaveId];
  if (!enclave) {
    return { ok: false, reason: 'Enklav istasyonu bulunamadı.' };
  }

  const service = ENCLAVE_SERVICES[serviceId];
  if (!service || service.enclaveType !== enclave.type) {
    return { ok: false, reason: 'Bu hizmet bu enklav tarafından sunulmuyor.' };
  }

  const planet = planetId
    ? state.planets[planetId]
    : Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
      Object.values(state.planets).find((p) => p.ownerId === playerId);

  if (!planet || planet.ownerId !== playerId) {
    return { ok: false, reason: 'Geçerli bir fonlama kolonisi bulunamadı.' };
  }

  // Check resource cost
  if (
    planet.resources.ore < service.cost.ore ||
    planet.resources.crystal < service.cost.crystal ||
    planet.resources.fuel < service.cost.fuel
  ) {
    return { ok: false, reason: 'Yetersiz hammadde veya yakıt rezervi.' };
  }

  // Check if contract already active for timed buffs
  const player = state.players[playerId];
  if (player?.activeEnclaveContracts?.some((c) => c.serviceId === serviceId && c.expiresAtMs > state.timeMs)) {
    return { ok: false, reason: 'Bu hizmet kontratı imparatorluğunuzda şu anda zaten aktif.' };
  }

  return { ok: true };
}

/**
 * Purchases and executes an enclave service
 */
export function interactWithEnclave(
  state: GameState,
  playerId: string,
  enclaveId: string,
  serviceId: EnclaveServiceId,
  planetId?: string
): { success: boolean; contract?: EnclaveContract; error?: string } {
  const check = canInteractWithEnclave(state, playerId, enclaveId, serviceId, planetId);
  if (!check.ok) {
    return { success: false, error: check.reason };
  }

  const enclave = state.enclaves![enclaveId];
  const service = ENCLAVE_SERVICES[serviceId];
  const planet = planetId
    ? state.planets[planetId]
    : Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
      Object.values(state.planets).find((p) => p.ownerId === playerId)!;
  const player = state.players[playerId];

  // Deduct cost
  planet.resources.ore -= service.cost.ore;
  planet.resources.crystal -= service.cost.crystal;
  planet.resources.fuel -= service.cost.fuel;

  // Increase enclave opinion and deals counter
  enclave.opinion[playerId] = Math.min(100, (enclave.opinion[playerId] || 0) + 10);
  enclave.totalDealsDone[playerId] = (enclave.totalDealsDone[playerId] || 0) + 1;

  const nowMs = state.timeMs;

  // Handle instant rewards
  if (service.instantReward) {
    if (service.instantReward.ore) {
      planet.resources.ore = Math.min(planet.storageCap, planet.resources.ore + service.instantReward.ore);
    }
    if (service.instantReward.crystal) {
      planet.resources.crystal = Math.min(planet.storageCap, planet.resources.crystal + service.instantReward.crystal);
    }
    if (service.instantReward.fuel) {
      planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + service.instantReward.fuel);
    }
  }

  // Handle Mercenary Army Recruitment
  if (serviceId === 'hire_mercenary_corps') {
    if (!state.armies) state.armies = {};
    for (let i = 0; i < 2; i++) {
      const armyId = `army_merc_${state.nextId++}`;
      state.armies[armyId] = {
        id: armyId,
        name: `${planet.name} Kiralık Lejyonu #${i + 1}`,
        ownerId: playerId,
        type: 'assault_infantry',
        rank: 'veteran',
        experience: 250,
        health: 150,
        maxHealth: 150,
        morale: 120,
        maxMorale: 120,
        attackPower: 28,
        defensePower: 20,
        planetId: planet.id,
        fleetId: null,
        isDisrouted: false,
        isGarrisonOnly: false,
        recruitedAtMs: nowMs,
      };
    }
  }

  // Handle Shroud Boon
  if (serviceId === 'commune_with_shroud') {
    const boons: ('speed' | 'shield' | 'evasion' | 'research')[] = ['speed', 'shield', 'evasion', 'research'];
    const chosenBoon = boons[Math.floor(Math.random() * boons.length)];
    const descMap = {
      speed: 'Psionik Hızlanma: Tüm filoların seyir hızı +%20 artırıldı.',
      shield: 'Psionik Kalkan Zırhı: Gemi kalkanlarına +%25 takviye.',
      evasion: 'Gelecek Sezgisi: Çatışmalarda gemi kaçınma (evasion) oranı +%20 arttı.',
      research: 'Kozmik İlham: Araştırma laboratuvarı verimi +%20 yükseldi.',
    };
    player.shroudBoon = {
      type: chosenBoon,
      expiresAtMs: nowMs + service.durationMs,
      descriptionTr: descMap[chosenBoon],
    };
  }

  // Create timed contract if service has duration
  let newContract: EnclaveContract | undefined;
  if (service.durationMs > 0) {
    newContract = {
      id: `contract_${state.nextId++}`,
      enclaveId,
      playerId,
      serviceId,
      nameTr: service.nameTr,
      bonusDescTr: service.descriptionTr,
      startedAtMs: nowMs,
      expiresAtMs: nowMs + service.durationMs,
    };

    if (!player.activeEnclaveContracts) player.activeEnclaveContracts = [];
    player.activeEnclaveContracts.push(newContract);

    if (!enclave.activeContracts[playerId]) enclave.activeContracts[playerId] = [];
    enclave.activeContracts[playerId].push(newContract);
  }

  return { success: true, contract: newContract };
}

/**
 * Purchases a Caravan Reliquary (loot box) offering randomized bounties
 */
export function buyCaravanReliquary(
  state: GameState,
  playerId: string,
  caravanId: string,
  planetId?: string
): { success: boolean; rewardDescTr?: string; reward?: Resources; minorArtifacts?: number; error?: string } {
  const caravan = state.caravaneers?.find((c) => c.id === caravanId);
  if (!caravan) {
    return { success: false, error: 'Karavan filosu bulunamadı.' };
  }

  const planet = planetId
    ? state.planets[planetId]
    : Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
      Object.values(state.planets).find((p) => p.ownerId === playerId);

  if (!planet || planet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz fonlama kolonisi.' };
  }

  const price = caravan.reliquaryPrice;
  if (
    planet.resources.ore < price.ore ||
    planet.resources.crystal < price.crystal ||
    planet.resources.fuel < price.fuel
  ) {
    return { success: false, error: 'Reliquary satın almak için yetersiz kaynak.' };
  }

  planet.resources.ore -= price.ore;
  planet.resources.crystal -= price.crystal;
  planet.resources.fuel -= price.fuel;

  // Determine reward
  const roll = Math.random();
  const player = state.players[playerId];

  if (roll < 0.35) {
    // Resource jackpot
    const rReward: Resources = { ore: 1200, crystal: 800, fuel: 500 };
    planet.resources.ore = Math.min(planet.storageCap, planet.resources.ore + rReward.ore);
    planet.resources.crystal = Math.min(planet.storageCap, planet.resources.crystal + rReward.crystal);
    planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + rReward.fuel);
    return {
      success: true,
      reward: rReward,
      rewardDescTr: '🎁 BÜYÜK MADEN HAZİNESİ: 1200 Cevher, 800 Kristal ve 500 Yakıt sandıktan çıktı!',
    };
  } else if (roll < 0.70) {
    // Minor artifacts & rare tech cache
    const artifactsGained = 25;
    player.minorArtifacts = (player.minorArtifacts || 0) + artifactsGained;
    return {
      success: true,
      minorArtifacts: artifactsGained,
      rewardDescTr: `🏺 KADİM ESERLER: ${artifactsGained} adet Nadir Kalıntı (Minor Artifacts) ele geçirildi!`,
    };
  } else {
    // Shroud psionic energy crystal
    player.renown = (player.renown || 0) + 15;
    return {
      success: true,
      rewardDescTr: '✨ GALAKTİK ŞÖHRET & İTİBAR: Karavan sandığından çıkan nadir hediye +15 Şöhret kazandırdı!',
    };
  }
}

/**
 * Gambles resources in Caravaneer Slot Machines
 */
export function gambleCaravanSlots(
  state: GameState,
  playerId: string,
  caravanId: string,
  betAmount: number,
  planetId?: string
): { success: boolean; won?: boolean; winAmount?: number; multiplier?: number; error?: string } {
  const caravan = state.caravaneers?.find((c) => c.id === caravanId);
  if (!caravan) {
    return { success: false, won: false, error: 'Karavan bulunamadı.' };
  }

  const planet = planetId
    ? state.planets[planetId]
    : Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld) ||
      Object.values(state.planets).find((p) => p.ownerId === playerId);

  if (!planet || planet.ownerId !== playerId) {
    return { success: false, won: false, error: 'Gezegen bulunamadı.' };
  }

  if (betAmount <= 0 || planet.resources.fuel < betAmount) {
    return { success: false, won: false, error: 'Yetersiz yakıt bahsi.' };
  }

  planet.resources.fuel -= betAmount;

  // 45% win chance in casino
  const roll = Math.random();
  if (roll < 0.45) {
    // Won!
    const multiplier = roll < 0.1 ? 3.0 : 2.0; // 10% chance of triple jackpot
    const winAmount = Math.round(betAmount * multiplier);
    planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + winAmount);
    return { success: true, won: true, winAmount, multiplier };
  } else {
    // Lost
    return { success: true, won: false, winAmount: 0, multiplier: 0 };
  }
}

/**
 * Ticks contract expirations and roaming caravaneer movements
 */
export function tickEnclavesAndCaravans(
  state: GameState,
  elapsedMs: number,
  onEvent?: (type: string, desc: string, pId?: string, meta?: Record<string, unknown>) => void
): void {
  const nowMs = state.timeMs;

  // 1. Expire outdated contracts
  for (const player of Object.values(state.players)) {
    if (player.activeEnclaveContracts && player.activeEnclaveContracts.length > 0) {
      player.activeEnclaveContracts = player.activeEnclaveContracts.filter((c) => {
        if (nowMs >= c.expiresAtMs) {
          if (onEvent) {
            onEvent(
              'enclave_contract_expired',
              `Enklav Hizmet Sözleşmesi Sona Erdi: ${c.nameTr}`,
              player.id,
              { contractId: c.id, serviceId: c.serviceId }
            );
          }
          return false;
        }
        return true;
      });
    }

    if (player.shroudBoon && nowMs >= player.shroudBoon.expiresAtMs) {
      player.shroudBoon = null;
    }
  }

  // 2. Roam caravaneer fleets along hyperlanes
  if (state.caravaneers) {
    const systemIds = Object.keys(state.map.systems);
    for (const caravan of state.caravaneers) {
      if (caravan.status === 'orbiting') {
        // Pick new destination every minute
        if (Math.random() < 0.05 && systemIds.length > 1) {
          const nextSys = systemIds[Math.floor(Math.random() * systemIds.length)];
          if (nextSys !== caravan.currentSystemId) {
            caravan.targetSystemId = nextSys;
            caravan.status = 'in_transit';
            caravan.departureTimeMs = nowMs;
            caravan.arrivalTimeMs = nowMs + 45000; // 45s transit
          }
        }
      } else if (caravan.status === 'in_transit' && nowMs >= caravan.arrivalTimeMs) {
        caravan.currentSystemId = caravan.targetSystemId;
        caravan.status = 'orbiting';
      }
    }
  }
}
