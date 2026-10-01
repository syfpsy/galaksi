import {
  GameState,
  ParagonClass,
  ParagonFlagship,
  ParagonLeader,
  ParagonTier,
  Player,
  Resources,
  ShipType,
} from './types';

// ==========================================
// Phase 27: Paragon Leaders, Renowned Heroes & Council Destiny
// ==========================================

export const PARAGON_CONSTANTS = {
  BASE_RENOWN_GAIN_PER_HOUR: 12, // 12 renown / hr passive
  MAX_RECRUITED_PARAGONS_PER_PLAYER: 4,
  FLAGSHIP_COMMISSION_COST: { ore: 800, crystal: 500, fuel: 600 } as Resources,
  DISMISS_RENOWN_REFUND_PERCENT: 0.25, // 25% renown refund on retirement
  XP_PER_BATTLE_WIN: 100,
  XP_PER_HOUR_ASSIGNED: 25,
};

export const INITIAL_PARAGONS: Record<string, ParagonLeader> = {
  paragon_vaelen: {
    id: 'paragon_vaelen',
    name: 'Amiral Vaelen "Yıldız Kıran"',
    titleTr: 'Efsanevi Yıkım Filosu Başkumandanı',
    biographyTr:
      'Derin uzay çatışmalarında Kadim Titan\'ı tek başına dize getiren ve filo bataryalarını kusursuz koordine eden efsanevi başkomutan.',
    tier: 'legendary',
    class: 'military',
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    avatar: 'Swords',
    destinyTraitId: 'yildiz_kiran_aurasi',
    destinyTraitNameTr: 'Yıldız Kıran Muharebe Aurası',
    destinyTraitDescriptionTr:
      'Komuta ettiği filoya +%25 Saldırı Gücü, +%20 Savunma/Kalkan ve amiral gemisiyle yıkıcı taktiksel üstünlük kazandırır.',
    ownerId: null,
    recruitmentCost: { ore: 500, crystal: 300, fuel: 200 },
    renownCost: 100,
    flagship: {
      name: 'Sonsuz Gazap (Titan)',
      shipType: 'battleship',
      combatAura: 'Yıkım Aurası: Çevredeki dost gemilere +%25 Saldırı ve +%20 Zırh sağlar',
      attackMultiplier: 1.25,
      defenseMultiplier: 1.20,
      speedMultiplier: 1.15,
      isCommissioned: false,
    },
  },

  paragon_zephra: {
    id: 'paragon_zephra',
    name: 'Baş Mimar Zephra',
    titleTr: 'Kuantum Boyut & Yıldız Mühendisi',
    biographyTr:
      'Megayapıların gizli geometrisini ve egzotik kristal reaktörlerini tasarlayan galaksinin en parlak zihni.',
    tier: 'legendary',
    class: 'scientific',
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    avatar: 'Sparkles',
    destinyTraitId: 'yildizlar_mimari',
    destinyTraitNameTr: 'Yıldızların Mimarı',
    destinyTraitDescriptionTr:
      'Konseye atandığında küresel Araştırma Hızına +%25, Megayapı ve Gezegen Islahı sürelerine %20 hız kazandırır.',
    ownerId: null,
    recruitmentCost: { ore: 400, crystal: 500, fuel: 300 },
    renownCost: 90,
  },

  paragon_castor: {
    id: 'paragon_castor',
    name: 'Baron Castor',
    titleTr: 'Yıldızlararası Maden Lordu & Borsa Baronu',
    biographyTr:
      'Galaktik Pazarın fiyat dalgalanmalarını önceden gören ve gezegensel maden sendikalarını tek merkezden yöneten sanayi baronu.',
    tier: 'renowned',
    class: 'economic',
    level: 1,
    xp: 0,
    xpToNextLevel: 150,
    avatar: 'CircleDollarSign',
    destinyTraitId: 'maden_imparatoru',
    destinyTraitNameTr: 'Maden & Emtia İmparatoru',
    destinyTraitDescriptionTr:
      'Atandığı gezegene veya konseye +%20 Cevher & Kristal çıkarımı ve pazar komisyonlarında %30 indirim sağlar.',
    ownerId: null,
    recruitmentCost: { ore: 300, crystal: 200, fuel: 150 },
    renownCost: 50,
  },

  paragon_lyra: {
    id: 'paragon_lyra',
    name: 'Elçi Lyra',
    titleTr: 'Galaktik Barış & İttifak Arabulucusu',
    biographyTr:
      'Senato oturumlarında imparatorlukların kaderini belirleyen ve federasyon uyumunu zirvede tutan usta diplomat.',
    tier: 'renowned',
    class: 'diplomatic',
    level: 1,
    xp: 0,
    xpToNextLevel: 150,
    avatar: 'Crown',
    destinyTraitId: 'galaktik_arabulucu',
    destinyTraitNameTr: 'Galaktik Arabulucu & Uyum Paktı',
    destinyTraitDescriptionTr:
      'İmparatorluk Diplomatik Ağırlığına +%30 bonus ve her hafta fazladan +15 Hegemonya puanı kazandırır.',
    ownerId: null,
    recruitmentCost: { ore: 200, crystal: 300, fuel: 100 },
    renownCost: 50,
  },

  paragon_aethel: {
    id: 'paragon_aethel',
    name: 'Komutan Aethel',
    titleTr: 'Kızıl Kuşatma Kıran',
    biographyTr:
      'Ağır savunma bataryalarını ve gezegen garnizonlarını kırılmaz birer kaleye çeviren efsanevi savunma uzmanı.',
    tier: 'renowned',
    class: 'military',
    level: 1,
    xp: 0,
    xpToNextLevel: 150,
    avatar: 'Shield',
    destinyTraitId: 'kusatma_kiran',
    destinyTraitNameTr: 'Kuşatma Kıran Doktrini',
    destinyTraitDescriptionTr:
      'Atandığı gezegenin veya filonun savunma gücüne +%30 dayanıklılık ve +%15 kaçınma oranı katar.',
    ownerId: null,
    recruitmentCost: { ore: 350, crystal: 200, fuel: 200 },
    renownCost: 60,
  },

  paragon_orion: {
    id: 'paragon_orion',
    name: 'Grand Marshall Orion',
    titleTr: 'Lojistik & Kara Donanma Mareşali',
    biographyTr:
      'Gemi montaj hatlarını maksimum aşırı yüklemeyle çalıştıran ve filoların yakıt verimliliğini artıran askeri lojistik dehası.',
    tier: 'legendary',
    class: 'military',
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    avatar: 'Layers',
    destinyTraitId: 'kara_filo_doktrini',
    destinyTraitNameTr: 'Kara Filo & Hızlı Montaj',
    destinyTraitDescriptionTr:
      'Tersanelerde gemi üretim hızına +%25 artış ve filoların yakıt tüketimine -%20 tasarruf sağlar.',
    ownerId: null,
    recruitmentCost: { ore: 550, crystal: 350, fuel: 300 },
    renownCost: 110,
    flagship: {
      name: 'Orion\'un Mızrağı',
      shipType: 'battleship',
      combatAura: 'Lojistik Aurası: Filo hızına +%20 ve saldırı hızına +%15 katkı verir',
      attackMultiplier: 1.20,
      defenseMultiplier: 1.15,
      speedMultiplier: 1.20,
      isCommissioned: false,
    },
  },
};

/**
 * Initializes the global galactic paragons dictionary and pool
 */
export function initializeGalacticParagons(): {
  paragons: Record<string, ParagonLeader>;
  pool: string[];
} {
  const paragons: Record<string, ParagonLeader> = {};
  const pool: string[] = [];

  for (const [id, def] of Object.entries(INITIAL_PARAGONS)) {
    paragons[id] = {
      ...def,
      flagship: def.flagship ? { ...def.flagship } : null,
    };
    pool.push(id);
  }

  return { paragons, pool };
}

/**
 * Ensures player has initial renown and paragon tracking
 */
export function getOrCreatePlayerParagonState(player: Player): void {
  if (player.renown === undefined) {
    player.renown = 100; // Starter Renown
  }
  if (!player.paragonIds) {
    player.paragonIds = [];
  }
}

/**
 * Validates whether player can recruit a specific paragon
 */
export function canRecruitParagon(
  state: GameState,
  playerId: string,
  paragonId: string
): { success: boolean; error?: string } {
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı' };
  getOrCreatePlayerParagonState(player);

  if (!state.paragons || !state.paragons[paragonId]) {
    return { success: false, error: 'Paragon lideri bulunamadı' };
  }

  const paragon = state.paragons[paragonId];
  if (paragon.ownerId !== null) {
    return { success: false, error: 'Bu lider zaten başka bir imparatorluk tarafından istihdam edildi' };
  }

  if ((player.paragonIds?.length || 0) >= PARAGON_CONSTANTS.MAX_RECRUITED_PARAGONS_PER_PLAYER) {
    return {
      success: false,
      error: `Maksimum lider kapasitesine (${PARAGON_CONSTANTS.MAX_RECRUITED_PARAGONS_PER_PLAYER}) ulaştınız`,
    };
  }

  if ((player.renown || 0) < paragon.renownCost) {
    return {
      success: false,
      error: `Yetersiz Şan & İtibar (Gereken: ${paragon.renownCost} Renown, Mevcut: ${Math.round(player.renown || 0)})`,
    };
  }

  // Check homeworld or primary planet resources
  const ownedPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = ownedPlanets.find((p) => p.isHomeworld) || ownedPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'İmparatorluğa ait koloni bulunamadı' };

  const cost = paragon.recruitmentCost;
  if (
    primaryPlanet.resources.ore < cost.ore ||
    primaryPlanet.resources.crystal < cost.crystal ||
    primaryPlanet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz hammadde (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
    };
  }

  return { success: true };
}

/**
 * Recruits a Paragon into player's empire
 */
export function recruitParagon(
  state: GameState,
  playerId: string,
  paragonId: string
): { success: boolean; error?: string } {
  const check = canRecruitParagon(state, playerId, paragonId);
  if (!check.success) return check;

  const player = state.players[playerId];
  const paragon = state.paragons![paragonId];
  const ownedPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = ownedPlanets.find((p) => p.isHomeworld) || ownedPlanets[0];

  // Deduct renown and resources
  player.renown = (player.renown || 0) - paragon.renownCost;
  primaryPlanet.resources.ore -= paragon.recruitmentCost.ore;
  primaryPlanet.resources.crystal -= paragon.recruitmentCost.crystal;
  primaryPlanet.resources.fuel -= paragon.recruitmentCost.fuel;

  // Bind ownership
  paragon.ownerId = playerId;
  paragon.recruitedAtMs = state.timeMs;
  player.paragonIds = player.paragonIds || [];
  player.paragonIds.push(paragonId);

  // Remove from pool
  if (state.galacticParagonPool) {
    state.galacticParagonPool = state.galacticParagonPool.filter((id) => id !== paragonId);
  }

  // Event Log
  state.eventLog.push({
    id: `evt_paragon_recruited_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'paragon_recruited',
    playerId,
    description: `🌟 EFSANEVİ LİDER KATILDI: ${paragon.name} (${paragon.titleTr}) imparatorluğunuzun hizmetine girdi!`,
    metadata: { paragonId, tier: paragon.tier, trait: paragon.destinyTraitNameTr },
  });

  return { success: true };
}

/**
 * Assigns a Paragon to a Fleet, Planet, or Council
 */
export function assignParagon(
  state: GameState,
  playerId: string,
  paragonId: string,
  assignment: { type: 'fleet' | 'planet' | 'council'; targetId: string }
): { success: boolean; error?: string } {
  const paragon = state.paragons?.[paragonId];
  if (!paragon) return { success: false, error: 'Paragon bulunamadı' };
  if (paragon.ownerId !== playerId) return { success: false, error: 'Bu lidere sahip değilsiniz' };

  // Clear previous assignment
  unassignParagon(state, playerId, paragonId);

  if (assignment.type === 'fleet') {
    const fleet = state.fleets[assignment.targetId];
    if (!fleet || fleet.ownerId !== playerId) {
      return { success: false, error: 'Geçersiz filo seçimi' };
    }
    fleet.paragonId = paragonId;
    paragon.assignedTo = { type: 'fleet', targetId: assignment.targetId };

    if (paragon.flagship && paragon.flagship.isCommissioned) {
      paragon.flagship.assignedFleetId = assignment.targetId;
    }
  } else if (assignment.type === 'planet') {
    const planet = state.planets[assignment.targetId];
    if (!planet || planet.ownerId !== playerId) {
      return { success: false, error: 'Geçersiz gezegen seçimi' };
    }
    planet.assignedParagonId = paragonId;
    paragon.assignedTo = { type: 'planet', targetId: assignment.targetId };
  } else if (assignment.type === 'council') {
    paragon.assignedTo = { type: 'council', targetId: assignment.targetId };
  }

  return { success: true };
}

/**
 * Removes any current assignment from a Paragon
 */
export function unassignParagon(
  state: GameState,
  playerId: string,
  paragonId: string
): { success: boolean; error?: string } {
  const paragon = state.paragons?.[paragonId];
  if (!paragon || paragon.ownerId !== playerId) {
    return { success: false, error: 'Lider bulunamadı' };
  }

  if (paragon.assignedTo) {
    if (paragon.assignedTo.type === 'fleet') {
      const fleet = state.fleets[paragon.assignedTo.targetId];
      if (fleet && fleet.paragonId === paragonId) {
        fleet.paragonId = undefined;
      }
      if (paragon.flagship) {
        paragon.flagship.assignedFleetId = null;
      }
    } else if (paragon.assignedTo.type === 'planet') {
      const planet = state.planets[paragon.assignedTo.targetId];
      if (planet && planet.assignedParagonId === paragonId) {
        planet.assignedParagonId = undefined;
      }
    }
    paragon.assignedTo = null;
  }

  return { success: true };
}

/**
 * Retires/Dismisses a Paragon, refunding partial renown
 */
export function dismissParagon(
  state: GameState,
  playerId: string,
  paragonId: string
): { success: boolean; error?: string } {
  const player = state.players[playerId];
  const paragon = state.paragons?.[paragonId];
  if (!player || !paragon || paragon.ownerId !== playerId) {
    return { success: false, error: 'Lider bulunamadı' };
  }

  unassignParagon(state, playerId, paragonId);

  // Partial renown refund
  const refund = Math.round(paragon.renownCost * PARAGON_CONSTANTS.DISMISS_RENOWN_REFUND_PERCENT);
  player.renown = (player.renown || 0) + refund;

  paragon.ownerId = null;
  player.paragonIds = (player.paragonIds || []).filter((id) => id !== paragonId);

  // Return to galactic pool
  if (!state.galacticParagonPool) state.galacticParagonPool = [];
  if (!state.galacticParagonPool.includes(paragonId)) {
    state.galacticParagonPool.push(paragonId);
  }

  return { success: true };
}

/**
 * Commissions the custom Flagship for a military Paragon
 */
export function commissionParagonFlagship(
  state: GameState,
  playerId: string,
  paragonId: string,
  planetId: string
): { success: boolean; error?: string } {
  const paragon = state.paragons?.[paragonId];
  if (!paragon || paragon.ownerId !== playerId) {
    return { success: false, error: 'Lider bulunamadı' };
  }
  if (!paragon.flagship) {
    return { success: false, error: 'Bu liderin özel bir amiral gemisi bulunmuyor' };
  }
  if (paragon.flagship.isCommissioned) {
    return { success: false, error: 'Amiral gemisi zaten inşa edilmiş durumda' };
  }

  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz tersane koloni seçimi' };
  }

  const cost = PARAGON_CONSTANTS.FLAGSHIP_COMMISSION_COST;
  if (
    planet.resources.ore < cost.ore ||
    planet.resources.crystal < cost.crystal ||
    planet.resources.fuel < cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz hammadde (Gereken: ${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt)`,
    };
  }

  planet.resources.ore -= cost.ore;
  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  paragon.flagship.isCommissioned = true;

  // Add 1 battleship to planet garrison as flagship vessel
  planet.garrison.battleship = (planet.garrison.battleship || 0) + 1;

  state.eventLog.push({
    id: `evt_flagship_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'flagship_commissioned',
    playerId,
    description: `⚓ AMİRAL GEMİSİ DENİZE İNDİRİLDİ: ${paragon.name} için "${paragon.flagship.name}" sancak gemisi hizmete girdi!`,
    metadata: { paragonId, planetId },
  });

  return { success: true };
}

/**
 * Calculates global empire and council buffs provided by player's active Paragons
 */
export function getPlayerParagonBonuses(
  state: GameState,
  playerId: string
): {
  oreMultiplier: number;
  crystalMultiplier: number;
  fuelMultiplier: number;
  researchMultiplier: number;
  shipyardMultiplier: number;
  diplomaticWeightMultiplier: number;
  stabilityBonus: number;
} {
  let oreMult = 1.0;
  let crystalMult = 1.0;
  let fuelMult = 1.0;
  let researchMult = 1.0;
  let shipyardMult = 1.0;
  let diploMult = 1.0;
  let stability = 0;

  const player = state.players[playerId];
  if (!player?.paragonIds || !state.paragons) {
    return {
      oreMultiplier: oreMult,
      crystalMultiplier: crystalMult,
      fuelMultiplier: fuelMult,
      researchMultiplier: researchMult,
      shipyardMultiplier: shipyardMult,
      diplomaticWeightMultiplier: diploMult,
      stabilityBonus: stability,
    };
  }

  for (const pId of player.paragonIds) {
    const p = state.paragons[pId];
    if (!p) continue;

    // Apply destiny trait effects
    if (p.destinyTraitId === 'yildizlar_mimari') {
      researchMult += 0.25;
    } else if (p.destinyTraitId === 'maden_imparatoru') {
      oreMult += 0.20;
      crystalMult += 0.20;
    } else if (p.destinyTraitId === 'galaktik_arabulucu') {
      diploMult += 0.30;
      stability += 10;
    } else if (p.destinyTraitId === 'kara_filo_doktrini') {
      shipyardMult += 0.25;
      fuelMult += 0.10;
    } else if (p.destinyTraitId === 'kusatma_kiran') {
      stability += 5;
    }
  }

  return {
    oreMultiplier: oreMult,
    crystalMultiplier: crystalMult,
    fuelMultiplier: fuelMult,
    researchMultiplier: researchMult,
    shipyardMultiplier: shipyardMult,
    diplomaticWeightMultiplier: diploMult,
    stabilityBonus: stability,
  };
}

/**
 * Calculates combat multipliers for a fleet commanded by a Paragon
 */
export function getFleetParagonBonuses(
  state: GameState,
  fleetId: string
): {
  attackMultiplier: number;
  defenseMultiplier: number;
  speedMultiplier: number;
  hasFlagship: boolean;
} {
  const fleet = state.fleets[fleetId];
  if (!fleet || !fleet.paragonId || !state.paragons) {
    return {
      attackMultiplier: 1.0,
      defenseMultiplier: 1.0,
      speedMultiplier: 1.0,
      hasFlagship: false,
    };
  }

  const paragon = state.paragons[fleet.paragonId];
  if (!paragon) {
    return {
      attackMultiplier: 1.0,
      defenseMultiplier: 1.0,
      speedMultiplier: 1.0,
      hasFlagship: false,
    };
  }

  let att = 1.0;
  let def = 1.0;
  let spd = 1.0;
  let hasFlagship = false;

  // Level bonus: +2% att & def per level
  att += paragon.level * 0.02;
  def += paragon.level * 0.02;

  // Destiny traits
  if (paragon.destinyTraitId === 'yildiz_kiran_aurasi') {
    att += 0.25;
    def += 0.20;
  } else if (paragon.destinyTraitId === 'kusatma_kiran') {
    def += 0.30;
    spd += 0.15;
  }

  // Flagship bonus
  if (paragon.flagship && paragon.flagship.isCommissioned) {
    hasFlagship = true;
    att *= paragon.flagship.attackMultiplier;
    def *= paragon.flagship.defenseMultiplier;
    spd *= paragon.flagship.speedMultiplier;
  }

  return {
    attackMultiplier: att,
    defenseMultiplier: def,
    speedMultiplier: spd,
    hasFlagship,
  };
}

/**
 * Tick loop for Paragons: generates passive Renown & awards XP to active leaders
 */
export function updateParagons(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) return;

  const hoursElapsed = deltaMs / (3600 * 1000);

  // 1. Passive Renown generation
  for (const player of Object.values(state.players)) {
    getOrCreatePlayerParagonState(player);
    player.renown = (player.renown || 0) + hoursElapsed * PARAGON_CONSTANTS.BASE_RENOWN_GAIN_PER_HOUR;
  }

  // 2. XP & Leveling for assigned Paragons
  if (state.paragons) {
    for (const paragon of Object.values(state.paragons)) {
      if (paragon.ownerId && paragon.assignedTo) {
        paragon.xp += hoursElapsed * PARAGON_CONSTANTS.XP_PER_HOUR_ASSIGNED;

        if (paragon.xp >= paragon.xpToNextLevel && paragon.level < 10) {
          paragon.level += 1;
          paragon.xp = Math.max(0, paragon.xp - paragon.xpToNextLevel);
          paragon.xpToNextLevel = Math.round(paragon.xpToNextLevel * 1.5);

          state.eventLog.push({
            id: `evt_paragon_lvl_${state.nextId++}`,
            timeMs: state.timeMs,
            type: 'paragon_level_up',
            playerId: paragon.ownerId,
            description: `🎖️ LİDER GELİŞİMİ: ${paragon.name} Seviye ${paragon.level}'e ulaştı! Yetenek ve muharebe auraları güçlendi.`,
            metadata: { paragonId: paragon.id, level: paragon.level },
          });
        }
      }
    }
  }
}
