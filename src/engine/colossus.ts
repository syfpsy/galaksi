import {
  ColossusShip,
  ColossusStatus,
  ColossusWeaponType,
  GameState,
  Planet,
  Resources,
} from './types';

export interface ColossusWeaponConfig {
  type: ColossusWeaponType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  beamColor: string;
  outcomeDescriptionTr: string;
  chargeTimeSec: number;
  diplomaticWeightPenalty: number;
  bonusOre?: number;
  bonusCrystal?: number;
}

export const COLOSSUS_WEAPON_CONFIGS: Record<ColossusWeaponType, ColossusWeaponConfig> = {
  world_cracker: {
    type: 'world_cracker',
    nameTr: 'Gezegen Kırıcı (World Cracker)',
    descriptionTr: 'Gezegen çekirdeğine tektonik termonükleer lazer delgisi odaklar. Gezegeni parçalayarak maden asteroit kuşağına dönüştürür.',
    icon: '💥',
    beamColor: '#ef4444',
    outcomeDescriptionTr: 'Gezegen tamamen yok edilir; enkazından +5000 Cevher maden yatağı elde edilir.',
    chargeTimeSec: 40,
    diplomaticWeightPenalty: -30,
    bonusOre: 5000,
  },
  neutron_sweep: {
    type: 'neutron_sweep',
    nameTr: 'Nötron Süpürgesi (Neutron Sweep)',
    descriptionTr: 'Biyosfere yoğun nötron radyasyonu saçar. Altyapı ve binalara zarar vermeden tüm garnizonu ve düşman nüfusu anında yok eder.',
    icon: '☣️',
    beamColor: '#10b981',
    outcomeDescriptionTr: 'Tüm savunma ve garnizon temizlenir, binalar ve altyapı bozulmadan kolonileşmeye açılır.',
    chargeTimeSec: 35,
    diplomaticWeightPenalty: -20,
  },
  nanite_disassembler: {
    type: 'nanite_disassembler',
    nameTr: 'Nanit Ayrıştırıcı (Nanite Disassembler)',
    descriptionTr: 'Milyarlarca moleküler naniti gezegene püskürterek tüm metalleri ayrıştırır ve egzotik nanit kristal rezervlerine çevirir.',
    icon: '🧬',
    beamColor: '#8b5cf6',
    outcomeDescriptionTr: 'Gezegen Nanit Dünyasına dönüşür; imparatorluğa +3000 Kristal kazandırır.',
    chargeTimeSec: 45,
    diplomaticWeightPenalty: -25,
    bonusCrystal: 3000,
  },
  global_pacifier: {
    type: 'global_pacifier',
    nameTr: 'Gezegen Fanusu (Global Pacifier)',
    descriptionTr: 'Gezegenin etrafını delinemez kuantum enerji kalkanıyla sarar (Fanus Dünya). Can kaybı yaratmadan düşmanı ebediyen hapseder.',
    icon: '🌐',
    beamColor: '#00f3ff',
    outcomeDescriptionTr: 'Gezegen savaştan tamamen izole edilir; gözlemden daimi barış ve +15 Zafer Puanı üretir.',
    chargeTimeSec: 40,
    diplomaticWeightPenalty: -5,
  },
};

export const COLOSSUS_CONSTANTS = {
  BUILD_COST: { ore: 2000, crystal: 1000, fuel: 1500 } as Resources,
  REFIT_COST: { ore: 500, crystal: 400, fuel: 300 } as Resources,
  DISMANTLE_REFUND: { ore: 1000, crystal: 500, fuel: 750 } as Resources,
  DEFAULT_CHARGE_TIME_MS: 40_000,
  MAX_COLOSSI_PER_EMPIRE: 1,
  HULL_POINTS: 50_000,
  SHIELD_POINTS: 20_000,
  TRAVEL_SPEED_PER_HOP_MS: 25_000,
};

export function canBuildColossus(
  state: GameState,
  playerId: string,
  originPlanetId: string
): { allowed: boolean; reason?: string } {
  const player = state.players[playerId];
  if (!player) return { allowed: false, reason: 'Oyuncu bulunamadı.' };

  if (player.colossusId && state.colossi?.[player.colossusId]) {
    return { allowed: false, reason: 'İmparatorluğunuz zaten aktif bir Kolossus süper silahına sahip (En fazla 1 adet).' };
  }

  const originPlanet = state.planets[originPlanetId];
  if (!originPlanet) return { allowed: false, reason: 'Tersane gezegeni bulunamadı.' };
  if (originPlanet.ownerId !== playerId) return { allowed: false, reason: 'Tersane gezegeni size ait değil.' };

  const cost = COLOSSUS_CONSTANTS.BUILD_COST;
  if (
    originPlanet.resources.ore < cost.ore ||
    originPlanet.resources.crystal < cost.crystal ||
    originPlanet.resources.fuel < cost.fuel
  ) {
    return {
      allowed: false,
      reason: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekir).`,
    };
  }

  return { allowed: true };
}

export function buildColossus(
  state: GameState,
  playerId: string,
  weaponType: ColossusWeaponType,
  originPlanetId: string
): { success: boolean; error?: string; colossusId?: string } {
  const check = canBuildColossus(state, playerId, originPlanetId);
  if (!check.allowed) return { success: false, error: check.reason };

  const player = state.players[playerId];
  const originPlanet = state.planets[originPlanetId];
  const cost = COLOSSUS_CONSTANTS.BUILD_COST;

  originPlanet.resources.ore -= cost.ore;
  originPlanet.resources.crystal -= cost.crystal;
  originPlanet.resources.fuel -= cost.fuel;

  if (!state.colossi) state.colossi = {};

  const colossusId = `colossus_${state.nextId++}`;
  const weaponConfig = COLOSSUS_WEAPON_CONFIGS[weaponType];

  const colossus: ColossusShip = {
    id: colossusId,
    ownerId: playerId,
    name: `${player.name} Kolossus Amiral Gemisi`,
    weaponType,
    status: 'idle',
    currentSystemId: originPlanet.systemId,
    targetSystemId: null,
    targetPlanetId: null,
    hp: COLOSSUS_CONSTANTS.HULL_POINTS,
    maxHp: COLOSSUS_CONSTANTS.HULL_POINTS,
    shield: COLOSSUS_CONSTANTS.SHIELD_POINTS,
    maxShield: COLOSSUS_CONSTANTS.SHIELD_POINTS,
    chargeStartedAtMs: null,
    chargeDurationMs: (weaponConfig?.chargeTimeSec || 40) * 1000,
    builtAtMs: state.timeMs,
  };

  state.colossi[colossusId] = colossus;
  player.colossusId = colossusId;
  player.hasColossusProject = true;

  state.eventLog.push({
    id: `event_colossus_built_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'colossus_built',
    playerId,
    description: `🚨 GALAKTİK ALARM: ${player.name} bir "${weaponConfig.nameTr}" süper silahı (Kolossus) inşa etti! Tüm galaksiye TOPYEKÛN SAVAŞ (Total War) tehdidi yayıldı.`,
    metadata: { colossusId, weaponType },
  });

  return { success: true, colossusId };
}

export function moveColossus(
  state: GameState,
  playerId: string,
  colossusId: string,
  targetSystemId: string
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (colossus.ownerId !== playerId) {
    return { success: false, error: 'Bu Kolossus size ait değil.' };
  }

  if (colossus.status === 'charging') {
    return { success: false, error: 'Kolossus süper silahı şarj olurken hareket edemez. Önce ateşi iptal edin.' };
  }

  if (colossus.currentSystemId === targetSystemId) {
    return { success: false, error: 'Kolossus zaten hedef sistemde.' };
  }

  colossus.status = 'in_transit';
  colossus.targetSystemId = targetSystemId;
  colossus.departureTime = state.timeMs;
  colossus.arrivalTime = state.timeMs + COLOSSUS_CONSTANTS.TRAVEL_SPEED_PER_HOP_MS;

  return { success: true };
}

export function commenceColossusCharging(
  state: GameState,
  playerId: string,
  colossusId: string,
  targetPlanetId: string
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (colossus.ownerId !== playerId) {
    return { success: false, error: 'Bu Kolossus size ait değil.' };
  }

  if (colossus.status === 'in_transit') {
    return { success: false, error: 'Kolossus hiperuzay seyahatinde; hedef sisteme varmadan ateş emri verilemez.' };
  }

  const targetPlanet = state.planets[targetPlanetId];
  if (!targetPlanet) {
    return { success: false, error: 'Hedef gezegen bulunamadı.' };
  }

  if (targetPlanet.systemId !== colossus.currentSystemId) {
    return { success: false, error: 'Kolossus hedef gezegenin bulunduğu sistemin yörüngesinde olmalıdır.' };
  }

  if (targetPlanet.ownerId === playerId) {
    return { success: false, error: 'Kendi koloninize doomsday süper silahı ateşleyemezsiniz!' };
  }

  if (targetPlanet.isDestroyed || targetPlanet.biome === 'shattered') {
    return { success: false, error: 'Bu gezegen zaten yok edilmiş.' };
  }

  if (targetPlanet.isShielded || targetPlanet.biome === 'shield_world') {
    return { success: false, error: 'Bu gezegen aşılmaz enerji fanusuna hapsedilmiş.' };
  }

  const weaponConfig = COLOSSUS_WEAPON_CONFIGS[colossus.weaponType];
  const chargeDurationMs = (weaponConfig?.chargeTimeSec || 40) * 1000;

  colossus.status = 'charging';
  colossus.targetPlanetId = targetPlanetId;
  colossus.chargeStartedAtMs = state.timeMs;
  colossus.chargeDurationMs = chargeDurationMs;

  const targetOwner = state.players[targetPlanet.ownerId];
  const attacker = state.players[playerId];

  state.eventLog.push({
    id: `event_colossus_charging_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'colossus_charging',
    playerId,
    description: `⚠️ KRİTİK DOOMSDAY ALARMI: ${attacker?.name || 'Düşman'} Kolossusu "${targetPlanet.name}" üzerinde ${weaponConfig.nameTr} süper silahını şarj etmeye başladı! Geri sayım: ${weaponConfig.chargeTimeSec} saniye!`,
    metadata: {
      colossusId,
      targetPlanetId,
      targetPlayerId: targetPlanet.ownerId,
      weaponType: colossus.weaponType,
    },
  });

  return { success: true };
}

export function cancelColossusFiring(
  state: GameState,
  playerId: string,
  colossusId: string
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (colossus.ownerId !== playerId) {
    return { success: false, error: 'Bu Kolossus size ait değil.' };
  }

  if (colossus.status !== 'charging') {
    return { success: false, error: 'Kolossus şu an şarj sekansında değil.' };
  }

  colossus.status = 'orbiting';
  colossus.targetPlanetId = null;
  colossus.chargeStartedAtMs = null;

  state.eventLog.push({
    id: `event_colossus_cancelled_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'colossus_cancelled',
    playerId,
    description: `🛡️ Kolossus şarj sekansı iptal edildi. Süper silah reaktörü güvenli moda alındı.`,
    metadata: { colossusId },
  });

  return { success: true };
}

export function resolveColossusFiring(
  state: GameState,
  colossusId: string
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (!colossus.targetPlanetId) {
    return { success: false, error: 'Hedef gezegen belirlenmemiş.' };
  }

  const targetPlanet = state.planets[colossus.targetPlanetId];
  if (!targetPlanet) {
    return { success: false, error: 'Hedef gezegen bulunamadı.' };
  }

  const weaponConfig = COLOSSUS_WEAPON_CONFIGS[colossus.weaponType];
  const attacker = state.players[colossus.ownerId];
  const defenderId = targetPlanet.ownerId;
  const defender = state.players[defenderId];

  // Attacker primary planet for deposit rewards
  const attackerPlanets = Object.values(state.planets).filter((p) => p.ownerId === colossus.ownerId);
  const attackerHome = attackerPlanets[0];

  targetPlanet.colossusImpact = {
    weaponType: colossus.weaponType,
    executedAtMs: state.timeMs,
    destroyerPlayerId: colossus.ownerId,
  };

  // Execute specific weapon effect
  switch (colossus.weaponType) {
    case 'world_cracker': {
      targetPlanet.isDestroyed = true;
      targetPlanet.biome = 'shattered';
      targetPlanet.ownerId = '';
      targetPlanet.garrison = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
      targetPlanet.buildingQueue = null;
      targetPlanet.shipyardQueue = [];
      if (attackerHome && weaponConfig.bonusOre) {
        attackerHome.resources.ore += weaponConfig.bonusOre;
      }
      break;
    }

    case 'neutron_sweep': {
      // Wipes garrison and population, keeps buildings intact, sets ownerId = ''
      targetPlanet.garrison = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
      targetPlanet.ownerId = '';
      targetPlanet.shipyardQueue = [];
      break;
    }

    case 'nanite_disassembler': {
      targetPlanet.biome = 'nanite_world';
      targetPlanet.garrison = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
      if (attackerHome && weaponConfig.bonusCrystal) {
        attackerHome.resources.crystal += weaponConfig.bonusCrystal;
      }
      break;
    }

    case 'global_pacifier': {
      targetPlanet.isShielded = true;
      targetPlanet.biome = 'shield_world';
      targetPlanet.garrison = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
      targetPlanet.buildingQueue = null;
      targetPlanet.shipyardQueue = [];
      // Generates Hegemony/Victory points
      if (state.relay && state.relay.weeklyPoints) {
        state.relay.weeklyPoints[colossus.ownerId] = (state.relay.weeklyPoints[colossus.ownerId] || 0) + 15;
      }
      break;
    }
  }

  // Diplomatic penalties on attacker
  if (attacker && weaponConfig.diplomaticWeightPenalty) {
    // Add diplomatic penalty event
    state.eventLog.push({
      id: `event_colossus_fired_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'colossus_fired',
      playerId: colossus.ownerId,
      description: `💥 DOOMSDAY SİLAHI ATEŞLENDİ: ${colossus.name}, "${targetPlanet.name}" dünyasını ${weaponConfig.nameTr} ile vurdu! ${weaponConfig.outcomeDescriptionTr}`,
      metadata: {
        colossusId,
        targetPlanetId: targetPlanet.id,
        victimPlayerId: defenderId,
        weaponType: colossus.weaponType,
      },
    });
  }

  // Reset colossus status
  colossus.status = 'orbiting';
  colossus.targetPlanetId = null;
  colossus.chargeStartedAtMs = null;

  return { success: true };
}

export function refitColossusWeapon(
  state: GameState,
  playerId: string,
  colossusId: string,
  newWeaponType: ColossusWeaponType
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (colossus.ownerId !== playerId) {
    return { success: false, error: 'Bu Kolossus size ait değil.' };
  }

  if (colossus.status === 'charging' || colossus.status === 'in_transit') {
    return { success: false, error: 'Şarj veya intikal esnasında silah doktrini değiştirilemez.' };
  }

  if (colossus.weaponType === newWeaponType) {
    return { success: false, error: 'Kolossus zaten bu silah başlığına sahip.' };
  }

  const cost = COLOSSUS_CONSTANTS.REFIT_COST;
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = playerPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Ana gezegen bulunamadı.' };

  if (
    primaryPlanet.resources.ore < cost.ore ||
    primaryPlanet.resources.crystal < cost.crystal ||
    primaryPlanet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz modifikasyon fonu (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekir).`,
    };
  }

  primaryPlanet.resources.ore -= cost.ore;
  primaryPlanet.resources.crystal -= cost.crystal;
  primaryPlanet.resources.fuel -= cost.fuel;

  colossus.weaponType = newWeaponType;
  const newConfig = COLOSSUS_WEAPON_CONFIGS[newWeaponType];
  colossus.chargeDurationMs = (newConfig?.chargeTimeSec || 40) * 1000;

  state.eventLog.push({
    id: `event_colossus_refit_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'colossus_refitted',
    playerId,
    description: `🔧 KOLOSSUS TADİLATI: Süper silah başlığı "${newConfig.nameTr}" olarak yeniden yapılandırıldı.`,
    metadata: { colossusId, newWeaponType },
  });

  return { success: true };
}

export function dismantleColossus(
  state: GameState,
  playerId: string,
  colossusId: string
): { success: boolean; error?: string } {
  if (!state.colossi || !state.colossi[colossusId]) {
    return { success: false, error: 'Kolossus bulunamadı.' };
  }

  const colossus = state.colossi[colossusId];
  if (colossus.ownerId !== playerId) {
    return { success: false, error: 'Bu Kolossus size ait değil.' };
  }

  const refund = COLOSSUS_CONSTANTS.DISMANTLE_REFUND;
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = playerPlanets[0];
  if (primaryPlanet) {
    primaryPlanet.resources.ore += refund.ore;
    primaryPlanet.resources.crystal += refund.crystal;
    primaryPlanet.resources.fuel += refund.fuel;
  }

  delete state.colossi[colossusId];
  const player = state.players[playerId];
  if (player && player.colossusId === colossusId) {
    player.colossusId = null;
    player.hasColossusProject = false;
  }

  state.eventLog.push({
    id: `event_colossus_dismantled_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'colossus_dismantled',
    playerId,
    description: `♻️ Kolossus süper silahı hurdaya ayrılarak tersanede parçalandı. Kaynaklar iade edildi.`,
    metadata: { colossusId },
  });

  return { success: true };
}

export function updateColossi(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0 || !state.colossi) return;

  for (const colossus of Object.values(state.colossi)) {
    // 1. Process In-Transit Flight
    if (colossus.status === 'in_transit' && colossus.arrivalTime && colossus.targetSystemId) {
      if (state.timeMs >= colossus.arrivalTime) {
        colossus.currentSystemId = colossus.targetSystemId;
        colossus.targetSystemId = null;
        colossus.departureTime = undefined;
        colossus.arrivalTime = undefined;
        colossus.status = 'orbiting';
      }
    }

    // 2. Process Charging Countdown
    if (colossus.status === 'charging' && colossus.chargeStartedAtMs) {
      const elapsedCharge = state.timeMs - colossus.chargeStartedAtMs;
      if (elapsedCharge >= colossus.chargeDurationMs) {
        // Countdown reached: FIRE!
        resolveColossusFiring(state, colossus.id);
      }
    }
  }
}
