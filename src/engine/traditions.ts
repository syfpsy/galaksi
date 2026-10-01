import {
  AscensionPerkId,
  AscensionPerkInfo,
  EmpireTraditionsState,
  GameState,
  TraditionNodeInfo,
  TraditionTier,
  TraditionTreeId,
} from './types';

export const TRADITION_CONFIGS = {
  BASE_UNITY_PER_HOUR: 30,
  UNITY_PER_PLANET_PER_HOUR: 10,
  UNITY_PER_RESEARCH_LAB_PER_HOUR: 5,
  HIGH_STABILITY_UNITY_BONUS: 0.20,
  LOW_STABILITY_UNITY_PENALTY: 0.20,
  TIER_COSTS: {
    1: 150,
    2: 350,
    3: 750,
  } as Record<TraditionTier, number>,
  MAX_ASCENSION_PERK_SLOTS: 4,
};

export const TRADITION_NODES: Record<TraditionTreeId, Record<TraditionTier, TraditionNodeInfo>> = {
  discovery: {
    1: {
      id: 'sensor_maps',
      treeId: 'discovery',
      tier: 1,
      nameTr: 'Yıldız Haritaları',
      descriptionTr: '+1 Sistem Sensör Görüşü & Anomali Tarama Hızı +%40',
      cost: TRADITION_CONFIGS.TIER_COSTS[1],
      icon: '🧭',
    },
    2: {
      id: 'data_driven',
      treeId: 'discovery',
      tier: 2,
      nameTr: 'Veri Odaklı Toplum',
      descriptionTr: '+%20 Araştırma Laboratuvarı Verimi & -%15 Araştırma Süresi',
      cost: TRADITION_CONFIGS.TIER_COSTS[2],
      icon: '🔬',
    },
    3: {
      id: 'into_the_unknown',
      treeId: 'discovery',
      tier: 3,
      nameTr: 'Bilinmeyene Doğru',
      descriptionTr: '+%15 Bilim Gemisi & Filo İntikal Hızı',
      cost: TRADITION_CONFIGS.TIER_COSTS[3],
      icon: '🌌',
    },
  },
  expansion: {
    1: {
      id: 'new_frontiers',
      treeId: 'expansion',
      tier: 1,
      nameTr: 'Yeni Ufuklar',
      descriptionTr: 'Koloni Kurma Yakıt ve Kaynak Masrafı -%30',
      cost: TRADITION_CONFIGS.TIER_COSTS[1],
      icon: '🚀',
    },
    2: {
      id: 'rapid_urbanization',
      treeId: 'expansion',
      tier: 2,
      nameTr: 'Hızlı Şehirleşme',
      descriptionTr: 'Kolonilerde Yapı İnşa ve Yükseltme Süresi -%25',
      cost: TRADITION_CONFIGS.TIER_COSTS[2],
      icon: '🏗️',
    },
    3: {
      id: 'colonization_fever',
      treeId: 'expansion',
      tier: 3,
      nameTr: 'Gelişmiş Kolonizasyon',
      descriptionTr: 'Kurulan her yeni koloni +2 Avcı garnizonu ve 500 kaynakla başlar',
      cost: TRADITION_CONFIGS.TIER_COSTS[3],
      icon: '🪐',
    },
  },
  prosperity: {
    1: {
      id: 'mining_guilds',
      treeId: 'prosperity',
      tier: 1,
      nameTr: 'Madencilik Loncaları',
      descriptionTr: '+%15 Gezegensel Cevher ve Kristal Pasif Üretimi',
      cost: TRADITION_CONFIGS.TIER_COSTS[1],
      icon: '⛏️',
    },
    2: {
      id: 'standardized_construction',
      treeId: 'prosperity',
      tier: 2,
      nameTr: 'Standart İnşaat',
      descriptionTr: 'Yapı ve Yıldız Üssü Yükseltme Maliyeti -%20',
      cost: TRADITION_CONFIGS.TIER_COSTS[2],
      icon: '⚙️',
    },
    3: {
      id: 'automation_age',
      treeId: 'prosperity',
      tier: 3,
      nameTr: 'Otomasyon Çağı',
      descriptionTr: 'Depo Koruma Kapasitesi +%50, Azami Depolama Hacmi +%25',
      cost: TRADITION_CONFIGS.TIER_COSTS[3],
      icon: '🏭',
    },
  },
  supremacy: {
    1: {
      id: 'war_doctrine',
      treeId: 'supremacy',
      tier: 1,
      nameTr: 'Harp Doktrini',
      descriptionTr: 'Tüm Filolar Muharebede Doğrudan +%12 Saldırı Gücü Kazanır',
      cost: TRADITION_CONFIGS.TIER_COSTS[1],
      icon: '⚔️',
    },
    2: {
      id: 'naval_logistics',
      treeId: 'supremacy',
      tier: 2,
      nameTr: 'Donanma Lojistiği',
      descriptionTr: 'Tersanede Gemi Üretim ve Donatım Süresi -%20',
      cost: TRADITION_CONFIGS.TIER_COSTS[2],
      icon: '🛡️',
    },
    3: {
      id: 'impassable_bastion',
      treeId: 'supremacy',
      tier: 3,
      nameTr: 'Aşılmaz Kale',
      descriptionTr: 'Yıldız Üsleri ve Savunma Tabyaları +%25 Gövde & Kalkan Dayanıklılığı',
      cost: TRADITION_CONFIGS.TIER_COSTS[3],
      icon: '🏰',
    },
  },
  harmony: {
    1: {
      id: 'unity_of_purpose',
      treeId: 'harmony',
      tier: 1,
      nameTr: 'Birlik Ruhu',
      descriptionTr: 'İmparatorluk Fraksiyon Onayı ve Konsey İstikrarı +15 Puan',
      cost: TRADITION_CONFIGS.TIER_COSTS[1],
      icon: '🕊️',
    },
    2: {
      id: 'diplomatic_weight_boost',
      treeId: 'harmony',
      tier: 2,
      nameTr: 'Galaktik Ağırlık',
      descriptionTr: 'Galaktik Senatoda Diplomatik Ağırlık +%25 Artar',
      cost: TRADITION_CONFIGS.TIER_COSTS[2],
      icon: '📜',
    },
    3: {
      id: 'alliance_solidarity',
      treeId: 'harmony',
      tier: 3,
      nameTr: 'İttifak Dayanışması',
      descriptionTr: 'İttifak Transfer Komisyonu Sıfırlanır, GDF Katkısı +%30 Artar',
      cost: TRADITION_CONFIGS.TIER_COSTS[3],
      icon: '🤝',
    },
  },
};

export const ASCENSION_PERKS: Record<AscensionPerkId, AscensionPerkInfo> = {
  transcendence: {
    id: 'transcendence',
    nameTr: 'Aşkın Zihinler (Psionic Transcendence)',
    descriptionTr: 'Amiraller +%15 Kaçınma ve 2 Kat Hızlı XP Kazanır; Ar-Ge Hızı +%25 Artar.',
    icon: '🔮',
    accentColor: '#a855f7',
  },
  synthetic_evolution: {
    id: 'synthetic_evolution',
    nameTr: 'Sibernetik Evrim (Cybernetic Age)',
    descriptionTr: 'Maden ve Rafineri Verimi +%25 Artar; Filo Yakıt Tüketimi -%30 Azalır.',
    icon: '🤖',
    accentColor: '#06b6d4',
  },
  voidborne: {
    id: 'voidborne',
    nameTr: 'Hiçlik Sakinleri (Deep Void Habitats)',
    descriptionTr: 'Yıldız Üssü Gücü +%40 Artar; Megayapı İnşa Süresi -%30 Kısalır.',
    icon: '🛸',
    accentColor: '#f59e0b',
  },
  galactic_force_projection: {
    id: 'galactic_force_projection',
    nameTr: 'Galaktik Kuvvet Projeksiyonu',
    descriptionTr: 'Donanma Muharebe Saldırı Gücü Doğrudan +%20 Artar.',
    icon: '⚡',
    accentColor: '#ef4444',
  },
  defender_of_the_galaxy: {
    id: 'defender_of_the_galaxy',
    nameTr: 'Galaksinin Koruyucusu',
    descriptionTr: 'Boyutlararası Kriz Varlıklarına ve Korsanlara Karşı +%35 Devasa Hasar Çarpanı.',
    icon: '🛡️',
    accentColor: '#10b981',
  },
  ecumenopolis_mastery: {
    id: 'ecumenopolis_mastery',
    nameTr: 'Ekümenopolis Arkology',
    descriptionTr: 'Gezegenler Baskın Yağmalarına Karşı +%50 Ekstra Koruma Kazanır; Depo Kapasitesi İkiye Katlanır (+%100).',
    icon: '🌆',
    accentColor: '#8b5cf6',
  },
};

/**
 * Initializes empty Traditions & Ascension state for a player
 */
export function initializeEmpireTraditions(playerId: string): EmpireTraditionsState {
  const treeIds: TraditionTreeId[] = ['discovery', 'expansion', 'prosperity', 'supremacy', 'harmony'];
  const trees = {} as EmpireTraditionsState['trees'];
  for (const treeId of treeIds) {
    trees[treeId] = {
      unlockedTiers: [],
      completed: false,
    };
  }

  return {
    playerId,
    unity: 0,
    unityRatePerHour: TRADITION_CONFIGS.BASE_UNITY_PER_HOUR,
    trees,
    ascensionPerks: [],
    availablePerkSlots: 0,
  };
}

/**
 * Calculates current Unity production rate per hour for a player
 */
export function calculatePlayerUnityRate(state: GameState, playerId: string): number {
  let rate = TRADITION_CONFIGS.BASE_UNITY_PER_HOUR;

  // Add per-planet bonus
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  rate += playerPlanets.length * TRADITION_CONFIGS.UNITY_PER_PLANET_PER_HOUR;

  // Add research lab bonus
  for (const planet of playerPlanets) {
    const labLevel = planet.buildings.research_lab || 0;
    rate += labLevel * TRADITION_CONFIGS.UNITY_PER_RESEARCH_LAB_PER_HOUR;
  }

  // Council Stability modifier
  const council = state.councils?.[playerId];
  if (council) {
    if (council.stabilityPercent >= 75) {
      rate *= (1 + TRADITION_CONFIGS.HIGH_STABILITY_UNITY_BONUS);
    } else if (council.stabilityPercent < 40) {
      rate *= (1 - TRADITION_CONFIGS.LOW_STABILITY_UNITY_PENALTY);
    }
  }

  return Math.round(rate);
}

/**
 * Checks if player has adopted a specific tradition tier
 */
export function hasTradition(
  state: GameState,
  playerId: string,
  treeId: TraditionTreeId,
  tier: TraditionTier
): boolean {
  const traditions = state.traditions?.[playerId];
  if (!traditions) return false;
  return traditions.trees[treeId]?.unlockedTiers.includes(tier) ?? false;
}

/**
 * Checks if player has chosen a specific Ascension Perk
 */
export function hasAscensionPerk(
  state: GameState,
  playerId: string,
  perkId: AscensionPerkId
): boolean {
  const traditions = state.traditions?.[playerId];
  if (!traditions) return false;
  return traditions.ascensionPerks.includes(perkId);
}

/**
 * Validates if a tradition can be adopted
 */
export function canAdoptTradition(
  state: GameState,
  playerId: string,
  treeId: TraditionTreeId,
  tier: TraditionTier
): { canAdopt: boolean; reason?: string } {
  const traditions = state.traditions?.[playerId];
  if (!traditions) return { canAdopt: false, reason: 'İmparatorluk gelenek durumu bulunamadı' };

  const tree = traditions.trees[treeId];
  if (!tree) return { canAdopt: false, reason: 'Geçersiz gelenek ağacı' };

  if (tree.unlockedTiers.includes(tier)) {
    return { canAdopt: false, reason: 'Bu gelenek doktrini zaten benimsenmiş' };
  }

  // Sequential progression check: Tier 2 requires Tier 1, Tier 3 requires Tier 2
  if (tier === 2 && !tree.unlockedTiers.includes(1)) {
    return { canAdopt: false, reason: 'Önce Aşama 1 geleneğini açmalısınız' };
  }
  if (tier === 3 && !tree.unlockedTiers.includes(2)) {
    return { canAdopt: false, reason: 'Önce Aşama 2 geleneğini açmalısınız' };
  }

  const cost = TRADITION_CONFIGS.TIER_COSTS[tier];
  if (traditions.unity < cost) {
    return {
      canAdopt: false,
      reason: `Yetersiz Kültürel Birlik! Gerekli: ${cost}, Mevcut: ${Math.floor(traditions.unity)}`,
    };
  }

  return { canAdopt: true };
}

/**
 * Adopts a tradition tier, paying Unity cost and unlocking perks if tree completed
 */
export function adoptTradition(
  state: GameState,
  playerId: string,
  treeId: TraditionTreeId,
  tier: TraditionTier
): { success: boolean; error?: string } {
  const check = canAdoptTradition(state, playerId, treeId, tier);
  if (!check.canAdopt) {
    return { success: false, error: check.reason };
  }

  const traditions = state.traditions![playerId];
  const cost = TRADITION_CONFIGS.TIER_COSTS[tier];
  traditions.unity -= cost;

  const tree = traditions.trees[treeId];
  tree.unlockedTiers.push(tier);
  tree.unlockedTiers.sort((a, b) => a - b);

  // Check if tree completed
  if (tree.unlockedTiers.length === 3) {
    tree.completed = true;
  }

  // Recalculate available perk slots
  const completedTrees = Object.values(traditions.trees).filter((t) => t.completed).length;
  const totalSlots = Math.min(completedTrees, TRADITION_CONFIGS.MAX_ASCENSION_PERK_SLOTS);
  traditions.availablePerkSlots = Math.max(0, totalSlots - traditions.ascensionPerks.length);

  return { success: true };
}

/**
 * Validates if an ascension perk can be selected
 */
export function canSelectAscensionPerk(
  state: GameState,
  playerId: string,
  perkId: AscensionPerkId
): { canSelect: boolean; reason?: string } {
  const traditions = state.traditions?.[playerId];
  if (!traditions) return { canSelect: false, reason: 'Gelenek verisi bulunamadı' };

  if (traditions.ascensionPerks.includes(perkId)) {
    return { canSelect: false, reason: 'Bu yükseliş ayrıcalığı zaten seçilmiş' };
  }

  if (traditions.availablePerkSlots <= 0) {
    return { canSelect: false, reason: 'Boş Yükseliş Yuvanız yok! Yeni bir gelenek ağacını tamamlayın' };
  }

  if (!ASCENSION_PERKS[perkId]) {
    return { canSelect: false, reason: 'Geçersiz yükseliş ayrıcalığı' };
  }

  return { canSelect: true };
}

/**
 * Selects and activates an Ascension Perk for an empire
 */
export function selectAscensionPerk(
  state: GameState,
  playerId: string,
  perkId: AscensionPerkId
): { success: boolean; error?: string } {
  const check = canSelectAscensionPerk(state, playerId, perkId);
  if (!check.canSelect) {
    return { success: false, error: check.reason };
  }

  const traditions = state.traditions![playerId];
  traditions.ascensionPerks.push(perkId);
  traditions.availablePerkSlots = Math.max(0, traditions.availablePerkSlots - 1);

  return { success: true };
}

/**
 * Calculates combat multipliers conferred by Traditions & Ascension Perks
 */
export function getTraditionCombatMultiplier(
  state: GameState,
  attackerId: string,
  defenderId: string,
  context?: string
): { attackerMult: number; defenderMult: number; attackerEvasionBonus: number; defenderEvasionBonus: number } {
  let attackerMult = 1.0;
  let defenderMult = 1.0;
  let attackerEvasionBonus = 0;
  let defenderEvasionBonus = 0;

  // Attacker Supremacy Tier 1 (+12%)
  if (hasTradition(state, attackerId, 'supremacy', 1)) {
    attackerMult += 0.12;
  }
  // Defender Supremacy Tier 1 (+12%)
  if (hasTradition(state, defenderId, 'supremacy', 1)) {
    defenderMult += 0.12;
  }

  // Attacker Galactic Force Projection (+20%)
  if (hasAscensionPerk(state, attackerId, 'galactic_force_projection')) {
    attackerMult += 0.20;
  }
  // Defender Galactic Force Projection (+20%)
  if (hasAscensionPerk(state, defenderId, 'galactic_force_projection')) {
    defenderMult += 0.20;
  }

  // Defender of the Galaxy (+35% vs void crisis or pirates)
  if (context === 'void_anchor' || context === 'void_rift' || context === 'pirate_lair') {
    if (hasAscensionPerk(state, attackerId, 'defender_of_the_galaxy')) {
      attackerMult += 0.35;
    }
  }

  // Transcendence (+15% admiral evasion)
  if (hasAscensionPerk(state, attackerId, 'transcendence')) {
    attackerEvasionBonus += 0.15;
  }
  if (hasAscensionPerk(state, defenderId, 'transcendence')) {
    defenderEvasionBonus += 0.15;
  }

  return { attackerMult, defenderMult, attackerEvasionBonus, defenderEvasionBonus };
}

/**
 * Calculates production multiplier from Traditions (Prosperity T1: +15%, Synthetic Evolution: +25%)
 */
export function getTraditionProductionMultiplier(state: GameState, playerId: string): number {
  let mult = 1.0;
  if (hasTradition(state, playerId, 'prosperity', 1)) {
    mult += 0.15;
  }
  if (hasAscensionPerk(state, playerId, 'synthetic_evolution')) {
    mult += 0.25;
  }
  return mult;
}

/**
 * Calculates building construction cost discount (Prosperity T2: -20%)
 */
export function getTraditionBuildingCostModifier(state: GameState, playerId: string): number {
  if (hasTradition(state, playerId, 'prosperity', 2)) {
    return 0.80;
  }
  return 1.0;
}

/**
 * Calculates shipyard build duration multiplier (Supremacy T2: -20%)
 */
export function getTraditionShipyardTimeModifier(state: GameState, playerId: string): number {
  if (hasTradition(state, playerId, 'supremacy', 2)) {
    return 0.80;
  }
  return 1.0;
}

/**
 * Calculates building construction duration multiplier (Expansion T2: -25%)
 */
export function getTraditionBuildingTimeModifier(state: GameState, playerId: string): number {
  if (hasTradition(state, playerId, 'expansion', 2)) {
    return 0.75;
  }
  return 1.0;
}

/**
 * Calculates planetary storage cap multiplier (Prosperity T3: +25%, Ecumenopolis: +100%)
 */
export function getTraditionStorageCapMultiplier(state: GameState, playerId: string): number {
  let mult = 1.0;
  if (hasTradition(state, playerId, 'prosperity', 3)) {
    mult += 0.25;
  }
  if (hasAscensionPerk(state, playerId, 'ecumenopolis_mastery')) {
    mult += 1.0;
  }
  return mult;
}
