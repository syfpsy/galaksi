import {
  DirectorateTier,
  GameEventRecord,
  GameState,
  IntelligenceDirectorate,
  Planet,
  Player,
  Resources,
  SecretAgent,
  SecretAgentTrait,
  ShadowOperation,
  ShadowOpType,
  ShipType,
} from './types';
import { getStarbaseEffectiveStats } from './starbases';

export interface DirectorateTierConfig {
  tier: DirectorateTier;
  name: string;
  nameTr: string;
  nameEn: string;
  description: string;
  descriptionTr: string;
  cost: Resources;
  upgradeCost: Resources;
  upgradeDurationMs: number;
  maxAgents: number;
  cryptoDecryption: number;
  cryptoDecryptionBonus: number;
  counterIntelBonus: number;
  unlockedOps: ShadowOpType[];
  passiveBonusTr: string;
}

export const DIRECTORATE_TIER_CONFIGS: Record<DirectorateTier, DirectorateTierConfig> = {
  1: {
    tier: 1,
    name: 'Gölgeler Bürosu',
    nameTr: 'Gölgeler Bürosu',
    nameEn: 'Bureau of Shadows',
    description: 'İmparatorluğun temel istihbarat ve sinyal analiz teşkilatı. Temel şifre çözme ve yerel casus hücreleri yönetir.',
    descriptionTr: 'İmparatorluğun temel istihbarat ve sinyal analiz teşkilatı. Temel şifre çözme ve yerel casus hücreleri yönetir.',
    cost: { ore: 400, crystal: 300, fuel: 200 },
    upgradeCost: { ore: 400, crystal: 300, fuel: 200 },
    upgradeDurationMs: 25_000,
    maxAgents: 2,
    cryptoDecryption: 15,
    cryptoDecryptionBonus: 15,
    counterIntelBonus: 10,
    unlockedOps: ['sabotage_starbase_grid'],
    passiveBonusTr: '+10 Karşı-İstihbarat, Max 2 Ajan',
  },
  2: {
    tier: 2,
    name: 'Altuzay Sinyal İstihbaratı',
    nameTr: 'Altuzay Sinyal İstihbaratı',
    nameEn: 'Subspace SIGINT Division',
    description: 'Yıldızlararası hiper-hat dinleme istasyonları ve derin uzay şifreli yayın analiz üniteleri.',
    descriptionTr: 'Yıldızlararası hiper-hat dinleme istasyonları ve derin uzay şifreli yayın analiz üniteleri.',
    cost: { ore: 750, crystal: 550, fuel: 350 },
    upgradeCost: { ore: 750, crystal: 550, fuel: 350 },
    upgradeDurationMs: 30_000,
    maxAgents: 3,
    cryptoDecryption: 30,
    cryptoDecryptionBonus: 15,
    counterIntelBonus: 20,
    unlockedOps: ['sabotage_starbase_grid', 'incite_rebellion'],
    passiveBonusTr: '+%25 Sızma Hızı, +20 Karşı-İstihbarat, Max 3 Ajan',
  },
  3: {
    tier: 3,
    name: 'Gizli Eylemler Komutanlığı',
    nameTr: 'Gizli Eylemler Komutanlığı',
    nameEn: 'Covert Actions Command',
    description: 'Sahte bayrak akınları, korsan kamuflajlı filolar ve sınır ötesi gayrinizami harp operasyonları.',
    descriptionTr: 'Sahte bayrak akınları, korsan kamuflajlı filolar ve sınır ötesi gayrinizami harp operasyonları.',
    cost: { ore: 1200, crystal: 900, fuel: 600 },
    upgradeCost: { ore: 1200, crystal: 900, fuel: 600 },
    upgradeDurationMs: 35_000,
    maxAgents: 4,
    cryptoDecryption: 45,
    cryptoDecryptionBonus: 15,
    counterIntelBonus: 35,
    unlockedOps: ['sabotage_starbase_grid', 'incite_rebellion', 'false_flag_raid'],
    passiveBonusTr: 'Sahte Bayrak Akınları Açık, Max 4 Ajan',
  },
  4: {
    tier: 4,
    name: 'Kuantum Kripto-Analiz Merkezi',
    nameTr: 'Kuantum Kripto-Analiz Merkezi',
    nameEn: 'Quantum Cryptanalysis Hub',
    description: 'Düşman meclis ve askeri veri tabanlarını hackleyip konsey üyelerine yönelik operasyonlar düzenler.',
    descriptionTr: 'Düşman meclis ve askeri veri tabanlarını hackleyip konsey üyelerine yönelik operasyonlar düzenler.',
    cost: { ore: 1800, crystal: 1400, fuel: 900 },
    upgradeCost: { ore: 1800, crystal: 1400, fuel: 900 },
    upgradeDurationMs: 40_000,
    maxAgents: 5,
    cryptoDecryption: 65,
    cryptoDecryptionBonus: 20,
    counterIntelBonus: 50,
    unlockedOps: ['sabotage_starbase_grid', 'incite_rebellion', 'false_flag_raid', 'assassinate_councilor'],
    passiveBonusTr: 'Konseye Suikast / Şantaj Açık, Max 5 Ajan',
  },
  5: {
    tier: 5,
    name: 'Galaktik Gölge Konseyi',
    nameTr: 'Galaktik Gölge Konseyi',
    nameEn: 'Galactic Shadow Directorate',
    description: 'Hedef imparatorlukların hükümetlerini içeriden deviren, ayrılıkçı isyanları yöneten nihai derin devlet mekanizması.',
    descriptionTr: 'Hedef imparatorlukların hükümetlerini içeriden deviren, ayrılıkçı isyanları yöneten nihai derin devlet mekanizması.',
    cost: { ore: 2500, crystal: 2000, fuel: 1500 },
    upgradeCost: { ore: 2500, crystal: 2000, fuel: 1500 },
    upgradeDurationMs: 50_000,
    maxAgents: 6,
    cryptoDecryption: 90,
    cryptoDecryptionBonus: 25,
    counterIntelBonus: 70,
    unlockedOps: ['sabotage_starbase_grid', 'incite_rebellion', 'false_flag_raid', 'assassinate_councilor', 'orchestrate_shadow_coup'],
    passiveBonusTr: 'Gölge Darbeleri & Hükümet Devirme Açık, Max 6 Ajan',
  },
};

export interface SecretAgentTraitConfig {
  trait: SecretAgentTrait;
  name: string;
  nameTr: string;
  nameEn: string;
  description: string;
  descriptionTr: string;
  icon: string;
  color: string;
  infiltrationSpeedBonus: number;
  opSuccessBonus: number;
  detectionReduction: number;
}

export const SECRET_AGENT_TRAIT_CONFIGS: Record<SecretAgentTrait, SecretAgentTraitConfig> = {
  master_infiltrator: {
    trait: 'master_infiltrator',
    name: 'Usta Sızıcı',
    nameTr: 'Usta Sızıcı',
    nameEn: 'Master Infiltrator',
    description: 'Düşman güvenlik protokollerini göze çarpmadan aşar. +%30 Sızma hızı ve -%25 ifşa riski sağlar.',
    descriptionTr: 'Düşman güvenlik protokollerini göze çarpmadan aşar. +%30 Sızma hızı ve -%25 ifşa riski sağlar.',
    icon: 'EyeOff',
    color: '#38bdf8',
    infiltrationSpeedBonus: 0.30,
    opSuccessBonus: 0.15,
    detectionReduction: 0.25,
  },
  saboteur: {
    trait: 'saboteur',
    name: 'Kıdemli Sabotör',
    nameTr: 'Kıdemli Sabotör',
    nameEn: 'Elite Saboteur',
    description: 'Askeri ve sivil altyapıları çökertmede uzmandır. Yıldız üssü ve koloni sabotajlarında +%40 başarı şansı.',
    descriptionTr: 'Askeri ve sivil altyapıları çökertmede uzmandır. Yıldız üssü ve koloni sabotajlarında +%40 başarı şansı.',
    icon: 'Bomb',
    color: '#f43f5e',
    infiltrationSpeedBonus: 0.10,
    opSuccessBonus: 0.40,
    detectionReduction: 0.10,
  },
  provocateur: {
    trait: 'provocateur',
    name: 'Siyasi Provokatör',
    nameTr: 'Siyasi Provokatör',
    nameEn: 'Political Provocateur',
    description: 'Halk kitlelerini ve orduyu isyana kışkırtır. Darbe ve isyan operasyonlarında +%35 etki gücü.',
    descriptionTr: 'Halk kitlelerini ve orduyu isyana kışkırtır. Darbe ve isyan operasyonlarında +%35 etki gücü.',
    icon: 'Flame',
    color: '#eab308',
    infiltrationSpeedBonus: 0.15,
    opSuccessBonus: 0.35,
    detectionReduction: 0.15,
  },
  ghost: {
    trait: 'ghost',
    name: 'Hayalet Protokolü',
    nameTr: 'Hayalet Protokolü',
    nameEn: 'Ghost Protocol',
    description: 'Yakalanması durumunda kuantum hafıza imhası gerçekleştirir. İmparatorluğunuz asla ifşa olmaz (%0 ifşa riski).',
    descriptionTr: 'Yakalanması durumunda kuantum hafıza imhası gerçekleştirir. İmparatorluğunuz asla ifşa olmaz (%0 ifşa riski).',
    icon: 'ShieldAlert',
    color: '#a855f7',
    infiltrationSpeedBonus: 0.20,
    opSuccessBonus: 0.20,
    detectionReduction: 1.0,
  },
};

export interface ShadowOpConfig {
  opType: ShadowOpType;
  name: string;
  nameTr: string;
  nameEn: string;
  description: string;
  descriptionTr: string;
  cost: Resources;
  requiredTier: DirectorateTier;
  durationMs: number;
  infiltrationCost: number;
  baseSuccessChance: number;
  icon: string;
  color: string;
}

export const SHADOW_OP_CONFIGS: Record<ShadowOpType, ShadowOpConfig> = {
  sabotage_starbase_grid: {
    opType: 'sabotage_starbase_grid',
    name: 'Yıldız Üssü Şebeke Sabotajı',
    nameTr: 'Yıldız Üssü Şebeke Sabotajı',
    nameEn: 'Starbase Grid Sabotage',
    description: 'Hedef yıldız üssünün enerji şebekesine virüs enjekte ederek kalkanlarını çökertir ve canını %50 düşürür.',
    descriptionTr: 'Hedef yıldız üssünün enerji şebekesine virüs enjekte ederek kalkanlarını çökertir ve canını %50 düşürür.',
    cost: { ore: 150, crystal: 100, fuel: 50 },
    requiredTier: 1,
    durationMs: 25_000,
    infiltrationCost: 25,
    baseSuccessChance: 0.75,
    icon: 'ZapOff',
    color: '#f43f5e',
  },
  incite_rebellion: {
    opType: 'incite_rebellion',
    name: 'Koloni İsyanı Kışkırtma',
    nameTr: 'Koloni İsyanı Kışkırtma',
    nameEn: 'Incite Planetary Rebellion',
    description: 'Hedef kolonide ayrılıkçı hücreleri finanse ederek istikrarı düşürür ve üretimi 60 saniye boyunca durdurur.',
    descriptionTr: 'Hedef kolonide ayrılıkçı hücreleri finanse ederek istikrarı düşürür ve üretimi 60 saniye boyunca durdurur.',
    cost: { ore: 250, crystal: 200, fuel: 100 },
    requiredTier: 2,
    durationMs: 30_000,
    infiltrationCost: 40,
    baseSuccessChance: 0.65,
    icon: 'Flame',
    color: '#eab308',
  },
  false_flag_raid: {
    opType: 'false_flag_raid',
    name: 'Sahte Bayrak Akını',
    nameTr: 'Sahte Bayrak Akını',
    nameEn: 'False Flag Fleet Raid',
    description: 'Filoları korsan veya üçüncü bir imparatorluğun bayrağı altına gizleyerek hedef sisteme saldırı düzenler.',
    descriptionTr: 'Filoları korsan veya üçüncü bir imparatorluğun bayrağı altına gizleyerek hedef sisteme saldırı düzenler.',
    cost: { ore: 400, crystal: 300, fuel: 200 },
    requiredTier: 3,
    durationMs: 35_000,
    infiltrationCost: 50,
    baseSuccessChance: 0.70,
    icon: 'Mask',
    color: '#38bdf8',
  },
  assassinate_councilor: {
    opType: 'assassinate_councilor',
    name: 'Konsey Liderine Suikast / Şantaj',
    nameTr: 'Konsey Liderine Suikast / Şantaj',
    nameEn: 'Councilor Assassination / Blackmail',
    description: 'Düşman meclisindeki kritik bir Paragon veya Konsey liderini devre dışı bırakıp görevden el çektirir.',
    descriptionTr: 'Düşman meclisindeki kritik bir Paragon veya Konsey liderini devre dışı bırakıp görevden el çektirir.',
    cost: { ore: 500, crystal: 450, fuel: 300 },
    requiredTier: 4,
    durationMs: 40_000,
    infiltrationCost: 65,
    baseSuccessChance: 0.60,
    icon: 'Crosshair',
    color: '#ec4899',
  },
  orchestrate_shadow_coup: {
    opType: 'orchestrate_shadow_coup',
    name: 'Gölge Hükümet Darbesi',
    nameTr: 'Gölge Hükümet Darbesi',
    nameEn: 'Orchestrate Shadow Coup',
    description: 'Hedef imparatorluğun derin devletini ele geçirerek ittifaklarını bozar ve hükümetini barışçıl teslimiyete zorlar.',
    descriptionTr: 'Hedef imparatorluğun derin devletini ele geçirerek ittifaklarını bozar ve hükümetini barışçıl teslimiyete zorlar.',
    cost: { ore: 1000, crystal: 800, fuel: 600 },
    requiredTier: 5,
    durationMs: 50_000,
    infiltrationCost: 80,
    baseSuccessChance: 0.50,
    icon: 'Crown',
    color: '#a855f7',
  },
};

export const SHADOW_OPS_CONSTANTS = {
  AGENT_RECRUIT_COST: { ore: 300, crystal: 250, fuel: 150 } as Resources,
  DISMISS_REFUND_PERCENT: 0.30,
  BASE_AGENT_XP_PER_OP: 25,
};

/**
 * Gets or initializes the Intelligence Directorate for a player
 */
export function getOrCreateDirectorate(state: GameState, playerId: string): IntelligenceDirectorate {
  if (!state.intelligenceDirectorates) {
    state.intelligenceDirectorates = {};
  }

  let dir = state.intelligenceDirectorates[playerId];
  if (!dir) {
    const tier1Cfg = DIRECTORATE_TIER_CONFIGS[1];
    dir = {
      playerId,
      level: 1,
      tier: 1,
      cryptoDecryption: tier1Cfg.cryptoDecryption,
      counterIntelScore: tier1Cfg.counterIntelBonus,
      maxAgents: tier1Cfg.maxAgents,
      agentIds: [],
      activeShadowOpIds: [],
      isUpgrading: false,
      totalOpsSucceeded: 0,
      totalFalseFlagsConducted: 0,
      totalCompromisedOps: 0,
    };
    state.intelligenceDirectorates[playerId] = dir;
  }

  return dir;
}

/**
 * Validates whether player can upgrade their Intelligence Directorate
 */
export function canUpgradeDirectorate(
  state: GameState,
  playerId: string,
  fundingPlanetId: string
): { success: boolean; error?: string } {
  const dir = getOrCreateDirectorate(state, playerId);
  if (dir.level >= 5) {
    return { success: false, error: 'İstihbarat Karargahı maksimum seviyeye (Kademe 5 - Galaktik Gölge Konseyi) ulaşmıştır' };
  }
  if (dir.isUpgrading) {
    return { success: false, error: 'İstihbarat Karargahı halihazırda yükseltilmektedir' };
  }

  const nextTier = (dir.level + 1) as DirectorateTier;
  const cfg = DIRECTORATE_TIER_CONFIGS[nextTier];
  const fundingPlanet = state.planets[fundingPlanetId];
  if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz finansman kolonisi' };
  }

  if (
    fundingPlanet.resources.ore < cfg.upgradeCost.ore ||
    fundingPlanet.resources.crystal < cfg.upgradeCost.crystal ||
    fundingPlanet.resources.fuel < cfg.upgradeCost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz hammadde (Gereken: ${cfg.upgradeCost.ore} Cevher, ${cfg.upgradeCost.crystal} Kristal, ${cfg.upgradeCost.fuel} Yakıt)`,
    };
  }

  return { success: true };
}

/**
 * Upgrades the player's Intelligence Directorate
 */
export function upgradeDirectorate(
  state: GameState,
  playerId: string,
  fundingPlanetId: string
): { success: boolean; error?: string; tier?: DirectorateTier } {
  const check = canUpgradeDirectorate(state, playerId, fundingPlanetId);
  if (!check.success) return check;

  const dir = getOrCreateDirectorate(state, playerId);
  const nextTier = (dir.level + 1) as DirectorateTier;
  const cfg = DIRECTORATE_TIER_CONFIGS[nextTier];
  const fundingPlanet = state.planets[fundingPlanetId];

  // Deduct cost
  fundingPlanet.resources.ore -= cfg.upgradeCost.ore;
  fundingPlanet.resources.crystal -= cfg.upgradeCost.crystal;
  fundingPlanet.resources.fuel -= cfg.upgradeCost.fuel;

  dir.isUpgrading = true;
  dir.upgradeStartTimeMs = state.timeMs;
  dir.upgradeFinishTimeMs = state.timeMs + cfg.upgradeDurationMs;

  state.eventLog.push({
    id: `evt_dir_upg_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'directorate_upgrade_started',
    playerId,
    description: `🕵️ İSTİHBARAT KARARGAHI YÜKSELTMESİ: ${cfg.nameTr} (Kademe ${nextTier}) geliştirmesi başlatıldı.`,
    metadata: { nextTier },
  });

  return { success: true, tier: nextTier };
}

/**
 * Validates whether player can recruit a new secret agent
 */
export function canRecruitAgent(
  state: GameState,
  playerId: string,
  arg3: string | SecretAgentTrait,
  arg4?: string | SecretAgentTrait
): { success: boolean; error?: string } {
  const dir = getOrCreateDirectorate(state, playerId);
  if (dir.agentIds.length >= dir.maxAgents) {
    return {
      success: false,
      error: `Maksimum ajan kapasitesine ulaşıldı (${dir.maxAgents}/${dir.maxAgents}). Kapasiteyi artırmak için İstihbarat Karargahını yükseltin.`,
    };
  }

  let fundingPlanetId = '';
  if (state.planets[arg3 as string]) {
    fundingPlanetId = arg3 as string;
  } else if (arg4 && state.planets[arg4 as string]) {
    fundingPlanetId = arg4 as string;
  } else {
    fundingPlanetId = arg3 as string;
  }

  const fundingPlanet = state.planets[fundingPlanetId];
  if (!fundingPlanet || fundingPlanet.ownerId !== playerId) {
    return { success: false, error: 'Geçersiz finansman kolonisi' };
  }

  const cost = SHADOW_OPS_CONSTANTS.AGENT_RECRUIT_COST;
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
 * Recruits a secret operative into the player's Directorate
 */
export function recruitAgent(
  state: GameState,
  playerId: string,
  arg3: string | SecretAgentTrait,
  arg4?: string | SecretAgentTrait,
  arg5?: string | SecretAgentTrait
): { success: boolean; error?: string; agentId?: string; agent?: SecretAgent } {
  // Normalize arguments
  let fundingPlanetId = '';
  let trait: SecretAgentTrait = 'master_infiltrator';
  let customName: string | undefined = undefined;

  const validTraits: SecretAgentTrait[] = ['master_infiltrator', 'saboteur', 'provocateur', 'ghost'];

  if (validTraits.includes(arg3 as SecretAgentTrait)) {
    trait = arg3 as SecretAgentTrait;
    fundingPlanetId = (arg4 as string) || '';
    customName = typeof arg5 === 'string' ? arg5 : undefined;
  } else {
    fundingPlanetId = arg3 as string;
    if (typeof arg4 === 'string' && !validTraits.includes(arg4 as SecretAgentTrait)) {
      customName = arg4;
      if (arg5 && validTraits.includes(arg5 as SecretAgentTrait)) {
        trait = arg5 as SecretAgentTrait;
      }
    } else if (arg4 && validTraits.includes(arg4 as SecretAgentTrait)) {
      trait = arg4 as SecretAgentTrait;
    }
  }

  const check = canRecruitAgent(state, playerId, fundingPlanetId, trait);
  if (!check.success) return check;

  const dir = getOrCreateDirectorate(state, playerId);
  const fundingPlanet = state.planets[fundingPlanetId];
  const cost = SHADOW_OPS_CONSTANTS.AGENT_RECRUIT_COST;

  fundingPlanet.resources.ore -= cost.ore;
  fundingPlanet.resources.crystal -= cost.crystal;
  fundingPlanet.resources.fuel -= cost.fuel;

  if (!state.secretAgents) {
    state.secretAgents = {};
  }

  const agentId = `agent_${state.nextId++}`;
  const codenames = ['Gölge-7', 'Obsidiyen', 'Kuzgun', 'Fantom', 'Tufan', 'Serap', 'Eko', 'Sıfır'];
  const codename = codenames[dir.agentIds.length % codenames.length];
  const traitCfg = SECRET_AGENT_TRAIT_CONFIGS[trait];

  const agent: SecretAgent = {
    id: agentId,
    name: customName || `Ajan ${codename}`,
    codename,
    avatar: traitCfg.icon,
    trait,
    ownerId: playerId,
    level: 1,
    xp: 0,
    experience: 0,
    assignedNetworkId: null,
    status: 'idle',
    recruitedAtMs: state.timeMs,
  };

  state.secretAgents[agentId] = agent;
  dir.agentIds.push(agentId);

  state.eventLog.push({
    id: `evt_agent_rec_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'secret_agent_recruited',
    playerId,
    description: `👤 YENİ AJAN İSTİHDAM EDİLDİ: ${agent.name} (${traitCfg.nameTr}) kadroya dahil oldu.`,
    metadata: { agentId, trait },
  });

  return { success: true, agentId, agent };
}

/**
 * Assigns a secret agent to infiltrate a foreign empire
 */
export function assignAgent(
  state: GameState,
  playerId: string,
  agentId: string,
  targetPlayerId: string
): { success: boolean; error?: string } {
  if (playerId === targetPlayerId) {
    return { success: false, error: 'Kendi imparatorluğunuza casus atayamazsınız' };
  }

  const agent = state.secretAgents?.[agentId];
  if (!agent || agent.ownerId !== playerId) {
    return { success: false, error: 'Ajan bulunamadı veya size ait değil' };
  }

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer) {
    return { success: false, error: 'Hedef imparatorluk bulunamadı' };
  }

  const networkKey = `${playerId}_${targetPlayerId}`;
  agent.assignedNetworkId = networkKey;
  agent.status = 'infiltrating';

  // Ensure spy network exists
  if (!state.spyNetworks) state.spyNetworks = {};
  if (!state.spyNetworks[networkKey]) {
    state.spyNetworks[networkKey] = {
      id: networkKey,
      ownerId: playerId,
      targetPlayerId,
      infiltrationLevel: 10,
      infiltrationCap: 60,
      assignedEnvoys: 1,
      establishedAtMs: state.timeMs,
      lastUpdateMs: state.timeMs,
      assets: [],
    };
  } else {
    state.spyNetworks[networkKey].infiltrationLevel = Math.min(
      state.spyNetworks[networkKey].infiltrationCap,
      state.spyNetworks[networkKey].infiltrationLevel + 15
    );
  }

  return { success: true };
}

/**
 * Dismisses an agent, refunding partial resources
 */
export function dismissAgent(
  state: GameState,
  playerId: string,
  agentId: string
): { success: boolean; error?: string } {
  const dir = getOrCreateDirectorate(state, playerId);
  const agent = state.secretAgents?.[agentId];
  if (!agent || agent.ownerId !== playerId) {
    return { success: false, error: 'Ajan bulunamadı' };
  }

  // Partial refund
  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];
  if (primaryPlanet) {
    const cost = SHADOW_OPS_CONSTANTS.AGENT_RECRUIT_COST;
    const rate = SHADOW_OPS_CONSTANTS.DISMISS_REFUND_PERCENT;
    primaryPlanet.resources.ore += Math.round(cost.ore * rate);
    primaryPlanet.resources.crystal += Math.round(cost.crystal * rate);
    primaryPlanet.resources.fuel += Math.round(cost.fuel * rate);
  }

  dir.agentIds = dir.agentIds.filter((id) => id !== agentId);
  delete state.secretAgents![agentId];

  return { success: true };
}

/**
 * Validates and launches a high-level Shadow Operation
 */
export function canLaunchShadowOp(
  state: GameState,
  playerId: string,
  arg3: string,
  arg4: string,
  assignedAgentId?: string,
  targetPlanetId?: string,
  targetStarbaseId?: string,
  fundingPlanetId?: string
): { success: boolean; error?: string } {
  const validOpTypes: ShadowOpType[] = [
    'sabotage_starbase_grid',
    'incite_rebellion',
    'false_flag_raid',
    'assassinate_councilor',
    'orchestrate_shadow_coup',
  ];

  let targetPlayerId = '';
  let opType: ShadowOpType = 'sabotage_starbase_grid';

  if (validOpTypes.includes(arg3 as ShadowOpType)) {
    opType = arg3 as ShadowOpType;
    targetPlayerId = arg4;
  } else {
    targetPlayerId = arg3;
    opType = arg4 as ShadowOpType;
  }

  const dir = getOrCreateDirectorate(state, playerId);
  const cfg = SHADOW_OP_CONFIGS[opType];
  if (!cfg) return { success: false, error: 'Geçersiz gölge operasyonu türü' };

  if (dir.level < cfg.requiredTier) {
    return {
      success: false,
      error: `Bu operasyon için İstihbarat Karargahı Kademe ${cfg.requiredTier} (${DIRECTORATE_TIER_CONFIGS[cfg.requiredTier].nameTr}) gereklidir. Mevcut Kademe: ${dir.level}`,
    };
  }

  // If funding planet provided, check funding resource
  if (fundingPlanetId && state.planets[fundingPlanetId]) {
    const fundingPlanet = state.planets[fundingPlanetId];
    if (
      fundingPlanet.resources.ore < cfg.cost.ore ||
      fundingPlanet.resources.crystal < cfg.cost.crystal ||
      fundingPlanet.resources.fuel < cfg.cost.fuel
    ) {
      return {
        success: false,
        error: `Yetersiz hammadde (Gereken: ${cfg.cost.ore} Cevher, ${cfg.cost.crystal} Kristal, ${cfg.cost.fuel} Yakıt)`,
      };
    }
  }

  const networkKey = `${playerId}_${targetPlayerId}`;
  const network = state.spyNetworks?.[networkKey];
  const infiltration = network?.infiltrationLevel || 0;

  if (infiltration < cfg.infiltrationCost) {
    // If agent is available, allow building network implicitly
    if (!assignedAgentId) {
      return {
        success: false,
        error: `Yetersiz sızma puanı (Gereken: ${cfg.infiltrationCost}, Mevcut: ${Math.floor(infiltration)})`,
      };
    }
  }

  if (assignedAgentId) {
    const agent = state.secretAgents?.[assignedAgentId];
    if (!agent || agent.ownerId !== playerId || agent.status === 'executing_op') {
      return { success: false, error: 'Görevli ajan müsait değil' };
    }
  }

  return { success: true };
}

/**
 * Launches a Shadow Operation (Incite Rebellion, Sabotage, Shadow Coup, Councilor Assassination, False Flag)
 */
export function launchShadowOp(
  state: GameState,
  playerId: string,
  arg3: string,
  arg4: string,
  assignedAgentId?: string,
  targetPlanetId?: string,
  targetStarbaseId?: string,
  fundingPlanetId?: string,
  disguisedAsFactionId?: string
): { success: boolean; error?: string; opId?: string; operation?: ShadowOperation } {
  const check = canLaunchShadowOp(
    state,
    playerId,
    arg3,
    arg4,
    assignedAgentId,
    targetPlanetId,
    targetStarbaseId,
    fundingPlanetId
  );
  if (!check.success) return check;

  const validOpTypes: ShadowOpType[] = [
    'sabotage_starbase_grid',
    'incite_rebellion',
    'false_flag_raid',
    'assassinate_councilor',
    'orchestrate_shadow_coup',
  ];

  let targetPlayerId = '';
  let opType: ShadowOpType = 'sabotage_starbase_grid';

  if (validOpTypes.includes(arg3 as ShadowOpType)) {
    opType = arg3 as ShadowOpType;
    targetPlayerId = arg4;
  } else {
    targetPlayerId = arg3;
    opType = arg4 as ShadowOpType;
  }

  const dir = getOrCreateDirectorate(state, playerId);
  const cfg = SHADOW_OP_CONFIGS[opType];

  if (fundingPlanetId && state.planets[fundingPlanetId]) {
    const fundingPlanet = state.planets[fundingPlanetId];
    fundingPlanet.resources.ore = Math.max(0, fundingPlanet.resources.ore - cfg.cost.ore);
    fundingPlanet.resources.crystal = Math.max(0, fundingPlanet.resources.crystal - cfg.cost.crystal);
    fundingPlanet.resources.fuel = Math.max(0, fundingPlanet.resources.fuel - cfg.cost.fuel);
  }

  const networkKey = `${playerId}_${targetPlayerId}`;
  const network = state.spyNetworks?.[networkKey];

  if (network) {
    network.infiltrationLevel = Math.max(0, network.infiltrationLevel - cfg.infiltrationCost);
  }

  if (!state.shadowOperations) {
    state.shadowOperations = {};
  }

  const opId = `shadow_op_${state.nextId++}`;
  const agent = assignedAgentId ? state.secretAgents?.[assignedAgentId] : undefined;
  if (agent) {
    agent.status = 'executing_op';
  }

  let successChance = cfg.baseSuccessChance;
  if (agent) {
    const traitCfg = SECRET_AGENT_TRAIT_CONFIGS[agent.trait];
    successChance = Math.min(0.95, successChance + traitCfg.opSuccessBonus + (agent.level - 1) * 0.05);
  }

  const op: ShadowOperation = {
    id: opId,
    opType,
    ownerId: playerId,
    initiatorId: playerId,
    targetPlayerId,
    targetFactionId: targetPlayerId,
    targetPlanetId,
    targetStarbaseId,
    assignedAgentId,
    disguisedAsFactionId,
    startTimeMs: state.timeMs,
    durationMs: cfg.durationMs,
    finishTimeMs: state.timeMs + cfg.durationMs,
    infiltrationCost: cfg.infiltrationCost,
    successChance,
    detectionRisk: Math.max(5, 50 - dir.cryptoDecryption),
    progress: 0,
    isCompromised: false,
    status: 'in_progress',
  };

  state.shadowOperations[opId] = op;
  dir.activeShadowOpIds.push(opId);

  state.eventLog.push({
    id: `evt_shadow_start_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'shadow_op_launched',
    playerId,
    description: `🕶️ GÖLGE OPERASYONU BAŞLATILDI: ${cfg.nameTr} operasyonu yürütülüyor. Tamamlanma: ${Math.round(cfg.durationMs / 1000)}s`,
    metadata: { opId, opType, targetPlayerId },
  });

  return { success: true, opId, operation: op };
}

/**
 * Ticks directorate upgrades and active shadow operations
 */
export function updateShadowOps(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) return;
  const nowMs = state.timeMs;

  // 1. Ticking Directorate Upgrades
  if (state.intelligenceDirectorates) {
    for (const dir of Object.values(state.intelligenceDirectorates)) {
      if (dir.isUpgrading && dir.upgradeFinishTimeMs && nowMs >= dir.upgradeFinishTimeMs) {
        dir.isUpgrading = false;
        dir.level = Math.min(5, (dir.level + 1)) as DirectorateTier;
        dir.tier = dir.level;
        const cfg = DIRECTORATE_TIER_CONFIGS[dir.level];
        dir.maxAgents = cfg.maxAgents;
        dir.cryptoDecryption = cfg.cryptoDecryption;
        dir.counterIntelScore = cfg.counterIntelBonus;

        state.eventLog.push({
          id: `evt_dir_ready_${state.nextId++}`,
          timeMs: nowMs,
          type: 'directorate_upgrade_completed',
          playerId: dir.playerId,
          description: `🏛️ İSTİHBARAT KARARGAHI YÜKSELTİLDİ: ${cfg.nameTr} (Kademe ${dir.level}) aktif! Yeni operasyonlar ve ajan yuvaları açıldı.`,
          metadata: { level: dir.level },
        });
      }
    }
  }

  // 2. Ticking Active Shadow Operations
  if (state.shadowOperations) {
    for (const op of Object.values(state.shadowOperations)) {
      if (op.status === 'in_progress') {
        op.progress = Math.min(100, Math.round(((nowMs - op.startTimeMs) / op.durationMs) * 100));
      }

      if (op.status === 'in_progress' && nowMs >= op.finishTimeMs) {
        const attackerDir = state.intelligenceDirectorates?.[op.ownerId];
        const defenderDir = state.intelligenceDirectorates?.[op.targetPlayerId];
        const assignedAgent = op.assignedAgentId ? state.secretAgents?.[op.assignedAgentId] : undefined;
        const isGhost = assignedAgent?.trait === 'ghost';

        // Outcome roll using PRNG seed or time
        const roll = ((nowMs * 9301 + 49297) % 233280) / 233280;
        const isSuccess = roll <= op.successChance;

        // Counter-detection check
        const defenderDefense = (defenderDir?.counterIntelScore || 10) / 100;
        const detectionRoll = (((nowMs + 77) * 49297 + 9301) % 233280) / 233280;
        const isDetected = !isGhost && detectionRoll < defenderDefense;

        if (isSuccess) {
          op.status = 'succeeded';
          if (attackerDir) {
            attackerDir.totalOpsSucceeded = (attackerDir.totalOpsSucceeded || 0) + 1;
          }
          if (assignedAgent) {
            assignedAgent.xp += SHADOW_OPS_CONSTANTS.BASE_AGENT_XP_PER_OP;
            if (assignedAgent.xp >= assignedAgent.level * 50) {
              assignedAgent.level++;
            }
          }

          // Apply operational consequences
          applyShadowOpSuccessEffects(state, op);

          state.eventLog.push({
            id: `evt_shadow_succ_${state.nextId++}`,
            timeMs: nowMs,
            type: 'shadow_op_succeeded',
            playerId: op.ownerId,
            description: `🎯 GÖLGE OPERASYONU BAŞARILI: ${SHADOW_OP_CONFIGS[op.opType].nameTr} başarıyla icra edildi!`,
            metadata: { opId: op.id, opType: op.opType },
          });
        } else {
          op.status = isDetected ? 'compromised' : 'failed';
          if (isDetected) {
            op.isCompromised = true;
            if (attackerDir) {
              attackerDir.totalCompromisedOps = (attackerDir.totalCompromisedOps || 0) + 1;
            }
            if (assignedAgent && !isGhost) {
              assignedAgent.status = 'captured';
            }

            state.eventLog.push({
              id: `evt_shadow_comp_${state.nextId++}`,
              timeMs: nowMs,
              type: 'shadow_op_compromised',
              playerId: op.ownerId,
              description: `🚨 İSTİHBARAT FİYASKOSU: ${SHADOW_OP_CONFIGS[op.opType].nameTr} operasyonu sırasında hücremiz ifşa oldu ve karşı istihbarata yakalandı!`,
              metadata: { opId: op.id, opType: op.opType },
            });
          } else {
            state.eventLog.push({
              id: `evt_shadow_fail_${state.nextId++}`,
              timeMs: nowMs,
              type: 'shadow_op_failed',
              playerId: op.ownerId,
              description: `⚠️ OPERASYON BAŞARISIZ: ${SHADOW_OP_CONFIGS[op.opType].nameTr} operasyonu hedefe ulaşamadı fakat kimlik gizli kaldı.`,
              metadata: { opId: op.id, opType: op.opType },
            });
          }
        }

        if (assignedAgent && assignedAgent.status !== 'captured') {
          assignedAgent.status = 'idle';
        }
      }
    }
  }
}

/**
 * Applies immediate consequences of a successful shadow operation
 */
function applyShadowOpSuccessEffects(state: GameState, op: ShadowOperation): void {
  const targetPlayer = state.players[op.targetPlayerId];

  switch (op.opType) {
    case 'sabotage_starbase_grid': {
      const targetSb = (op.targetStarbaseId && state.starbases?.[op.targetStarbaseId])
        ? state.starbases[op.targetStarbaseId]
        : (op.targetSystemId && state.starbases?.[op.targetSystemId])
        ? state.starbases[op.targetSystemId]
        : undefined;

      if (targetSb) {
        targetSb.hull = Math.max(50, Math.round(targetSb.hull * 0.40));
        targetSb.shield = 0;
      }
      break;
    }

    case 'incite_rebellion': {
      if (op.targetPlanetId && state.planets[op.targetPlanetId]) {
        const planet = state.planets[op.targetPlanetId];
        // Halve resources in storage to simulate looting/strike
        planet.resources.ore = Math.round(planet.resources.ore * 0.5);
        planet.resources.crystal = Math.round(planet.resources.crystal * 0.5);
        planet.resources.fuel = Math.round(planet.resources.fuel * 0.5);
      }
      break;
    }

    case 'assassinate_councilor': {
      // Dislodge councilor or wound leader
      if (state.councils?.[op.targetPlayerId]) {
        const council = state.councils[op.targetPlayerId];
        const filledPositions = Object.entries(council.positions).filter(([_, leaderId]) => leaderId !== null);
        if (filledPositions.length > 0) {
          const [posKey, leaderId] = filledPositions[0];
          council.positions[posKey as keyof typeof council.positions] = null;
          if (leaderId && council.leaders[leaderId]) {
            delete council.leaders[leaderId];
          }
        }
      }
      break;
    }

    case 'orchestrate_shadow_coup': {
      // Force change in counter-espionage stance and disrupt commercial pacts
      if (targetPlayer) {
        targetPlayer.counterEspionageStance = 'relaxed';
        targetPlayer.commercialPacts = [];
      }
      break;
    }

    case 'false_flag_raid': {
      const attackerDir = state.intelligenceDirectorates?.[op.ownerId];
      if (attackerDir) {
        attackerDir.totalFalseFlagsConducted = (attackerDir.totalFalseFlagsConducted || 0) + 1;
      }
      break;
    }
  }
}
