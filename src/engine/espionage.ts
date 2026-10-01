import {
  CounterEspionageStance,
  CovertOpType,
  CovertOperation,
  GameState,
  ResearchType,
  Resources,
  SpyAsset,
  SpyAssetType,
  SpyNetwork,
} from './types';

export interface CovertOpConfig {
  type: CovertOpType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  requiredInfiltration: number;
  infiltrationCost: number;
  durationMs: number;
  baseSuccessRate: number;
  difficulty: number;
  assetAffinity?: SpyAssetType;
}

export interface SpyAssetConfig {
  type: SpyAssetType;
  nameTr: string;
  bonusDescriptionTr: string;
  icon: string;
  cost: Resources;
  opAffinities: CovertOpType[];
}

export interface CounterEspionageConfig {
  stance: CounterEspionageStance;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  counterIntelBonus: number;
  enemyCapReduction: number;
  detectionChanceBonus: number;
}

export const ESPIONAGE_CONSTANTS = {
  NETWORK_SETUP_COST: { ore: 60, crystal: 40, fuel: 40 } as Resources,
  BASE_INFILTRATION_GROWTH_PER_SEC: 0.12, // with 1 envoy assigned
  INFILTRATION_DECAY_PER_SEC: 0.08, // when 0 envoys assigned
  MAX_ENVOYS_PER_NETWORK: 3,
  DEFAULT_CAP: 50,
  MIN_CAP: 20,
  MAX_CAP: 100,
  TICK_INTERVAL_MS: 1000,
};

export const COVERT_OP_CONFIGS: Record<CovertOpType, CovertOpConfig> = {
  gather_intel: {
    type: 'gather_intel',
    nameTr: 'İstihbarat Toplama',
    descriptionTr: 'Hedef imparatorluğun donanma konuşlanması, kaynak akışı ve araştırma projeleri hakkında detaylı dosya oluşturur.',
    icon: '📡',
    requiredInfiltration: 15,
    infiltrationCost: 5,
    durationMs: 40_000,
    baseSuccessRate: 0.85,
    difficulty: 10,
  },
  steal_technology: {
    type: 'steal_technology',
    nameTr: 'Teknoloji Hırsızlığı',
    descriptionTr: 'Hedefin araştırma arşivlerine sızarak bilinen bir teknolojinin şemasını çalar ve imparatorluğumuza aktarır.',
    icon: '💾',
    requiredInfiltration: 45,
    infiltrationCost: 25,
    durationMs: 90_000,
    baseSuccessRate: 0.65,
    difficulty: 35,
    assetAffinity: 'disaffected_scientist',
  },
  sabotage_starbase: {
    type: 'sabotage_starbase',
    nameTr: 'Yıldız Üssü Sabotajı',
    descriptionTr: 'Hedef yıldız üssünün reaktör ve kalkan modüllerine patlayıcı yerleştirerek %40 gövde hasarı verir ve modülleri geçici olarak felç eder.',
    icon: '💥',
    requiredInfiltration: 50,
    infiltrationCost: 25,
    durationMs: 75_000,
    baseSuccessRate: 0.60,
    difficulty: 40,
    assetAffinity: 'corrupt_dockworker',
  },
  destabilize_economy: {
    type: 'destabilize_economy',
    nameTr: 'Ekonomik İstikrarsızlaştırma',
    descriptionTr: 'Hedefin ticaret ağlarına ve maden ambarlarına sızarak kaynak sızıntısına (%20 hammadde kaybı) yol açar ve ganimeti merkeze aktarır.',
    icon: '📉',
    requiredInfiltration: 35,
    infiltrationCost: 15,
    durationMs: 60_000,
    baseSuccessRate: 0.70,
    difficulty: 25,
    assetAffinity: 'shadow_smuggler',
  },
  diplomatic_incident: {
    type: 'diplomatic_incident',
    nameTr: 'Diplomatik Kriz Çıkarma',
    descriptionTr: 'Hedef imparatorluk ile müttefikleri/federasyonu arasında sahte kanıtlar ve skandallarla kriz yaratarak diplomatik güven ve federasyon uyumunu (-20) düşürür.',
    icon: '🎭',
    requiredInfiltration: 40,
    infiltrationCost: 20,
    durationMs: 80_000,
    baseSuccessRate: 0.65,
    difficulty: 30,
    assetAffinity: 'disgruntled_bureaucrat',
  },
  arm_insurgents: {
    type: 'arm_insurgents',
    nameTr: 'İsyancıları Silahlandırma',
    descriptionTr: 'Hedefin bir kolonisindeki hoşnutsuz gruplara gizli silah ve fon sağlayarak gezegen istikrarını (-35) ve savunma birliklerini ağır biçimde hırpalar.',
    icon: '⚔️',
    requiredInfiltration: 60,
    infiltrationCost: 30,
    durationMs: 100_000,
    baseSuccessRate: 0.55,
    difficulty: 50,
    assetAffinity: 'shadow_smuggler',
  },
  extort_favor: {
    type: 'extort_favor',
    nameTr: 'Şantaj & Diplomatik Nüfuz',
    descriptionTr: 'Hedef imparatorluğun kilit yöneticilerine karşı elde edilen kozlarla Senato ve diplomaside kullanılacak diplomatik nüfuz ve lütuf (+15 Hegemonya) elde eder.',
    icon: '📜',
    requiredInfiltration: 30,
    infiltrationCost: 15,
    durationMs: 50_000,
    baseSuccessRate: 0.75,
    difficulty: 20,
    assetAffinity: 'disgruntled_bureaucrat',
  },
};

export const SPY_ASSET_CONFIGS: Record<SpyAssetType, SpyAssetConfig> = {
  corrupt_dockworker: {
    type: 'corrupt_dockworker',
    nameTr: 'Yozlaşmış Tersane İşçisi',
    bonusDescriptionTr: 'Yıldız Üssü Sabotajı başarı şansını +%25 artırır, operasyon süresini %20 kısaltır.',
    icon: '🔧',
    cost: { ore: 150, crystal: 50, fuel: 50 },
    opAffinities: ['sabotage_starbase'],
  },
  disaffected_scientist: {
    type: 'disaffected_scientist',
    nameTr: 'Muhalif Bilim İnsanı',
    bonusDescriptionTr: 'Teknoloji Hırsızlığı başarı şansını +%30 artırır, yakalanma riskini %25 düşürür.',
    icon: '🧪',
    cost: { ore: 50, crystal: 150, fuel: 50 },
    opAffinities: ['steal_technology'],
  },
  disgruntled_bureaucrat: {
    type: 'disgruntled_bureaucrat',
    nameTr: 'Kırgın Bürokrasi Yetkilisi',
    bonusDescriptionTr: 'Diplomatik Kriz Çıkarma ve Şantaj operasyonlarında +%25 başarı şansı ve %30 maliyet indirimi sağlar.',
    icon: '🗂️',
    cost: { ore: 80, crystal: 80, fuel: 80 },
    opAffinities: ['diplomatic_incident', 'extort_favor'],
  },
  shadow_smuggler: {
    type: 'shadow_smuggler',
    nameTr: 'Gölge Kaçakçısı',
    bonusDescriptionTr: 'Ekonomik İstikrarsızlaştırma ve İsyancıları Silahlandırma operasyonlarında +%25 başarı şansı sağlar.',
    icon: '🕶️',
    cost: { ore: 120, crystal: 60, fuel: 100 },
    opAffinities: ['destabilize_economy', 'arm_insurgents'],
  },
};

export const COUNTER_ESPIONAGE_CONFIGS: Record<CounterEspionageStance, CounterEspionageConfig> = {
  relaxed: {
    stance: 'relaxed',
    nameTr: 'Serbest / Gevşek Duruş',
    descriptionTr: 'Standart sınır ve iletişim güvenliği. Casusluk savunması yalnızca sensör teknolojilerine ve üslere dayanır.',
    icon: '🟢',
    counterIntelBonus: 0,
    enemyCapReduction: 0,
    detectionChanceBonus: 0,
  },
  surveillance: {
    stance: 'surveillance',
    nameTr: 'Aktif Gözetim & İstihbarat Taraması',
    descriptionTr: 'İç iletişim şifrelenir, yabancı elçilikler izlenir. Düşman sızma tavanı -15 puan düşer, yakalama şansı +%25 artar.',
    icon: '🟡',
    counterIntelBonus: 25,
    enemyCapReduction: 15,
    detectionChanceBonus: 0.25,
  },
  police_state: {
    stance: 'police_state',
    nameTr: 'Sıkı Yönetim & Polis Devleti',
    descriptionTr: 'Ağır iç denetim ve karşı-istihbarat ablukası. Düşman sızma tavanı -30 puan düşer, sızan casuslar derhal deşifre edilir ve Casus Belli hakkı doğar.',
    icon: '🔴',
    counterIntelBonus: 50,
    enemyCapReduction: 30,
    detectionChanceBonus: 0.50,
  },
};

const ASSET_NAMES: Record<SpyAssetType, string[]> = {
  corrupt_dockworker: ['Operatör Demir', 'Başmühendis Vane', 'Tersane Şefi Orhan', 'Teknisyen Radek'],
  disaffected_scientist: ['Doktor Aris', 'Fizikçi Leyla', 'Siberuzman Kael', 'Teorisyen Selen'],
  disgruntled_bureaucrat: ['Müsteşar Selim', 'Kançılar Vesper', 'Protokol Şefi Nil', 'Arşivci Tarek'],
  shadow_smuggler: ['Kaçakçı Zephyr', 'Gölge Baronu Kaan', 'Korsan Kaptan Mira', 'Sinyalci Jax'],
};

export function getSpyNetworkKey(ownerId: string, targetPlayerId: string): string {
  return `${ownerId}_${targetPlayerId}`;
}

export function calculateCounterIntelScore(state: GameState, targetPlayerId: string): number {
  const target = state.players[targetPlayerId];
  if (!target) return 10;

  let score = 10;

  // Stance bonus
  const stance = target.counterEspionageStance || 'relaxed';
  score += COUNTER_ESPIONAGE_CONFIGS[stance].counterIntelBonus;

  // Sensor research tech
  const sensorTech = target.research?.sensors || 0;
  score += sensorTech * 5;

  // Sensor arrays on target planets
  const planets = Object.values(state.planets).filter((p) => p.ownerId === targetPlayerId);
  for (const p of planets) {
    if (p.buildings?.sensor_array) {
      score += p.buildings.sensor_array * 3;
    }
  }

  // Starbases with sensor modules or tier
  if (state.starbases) {
    for (const sb of Object.values(state.starbases)) {
      if (sb.ownerId === targetPlayerId) {
        score += sb.tier === 'citadel' ? 12 : sb.tier === 'starbase' ? 8 : 4;
        if (sb.modules?.includes('sensor_relay')) {
          score += 10;
        }
      }
    }
  }

  return score;
}

export function calculateInfiltrationCap(state: GameState, ownerId: string, targetPlayerId: string): number {
  const owner = state.players[ownerId];
  const target = state.players[targetPlayerId];
  if (!owner || !target) return ESPIONAGE_CONSTANTS.DEFAULT_CAP;

  let cap = ESPIONAGE_CONSTANTS.DEFAULT_CAP;

  // Owner sensors boost infiltration capabilities
  const ownerSensor = owner.research?.sensors || 0;
  cap += ownerSensor * 6;

  // Target stance reduction
  const targetStance = target.counterEspionageStance || 'relaxed';
  cap -= COUNTER_ESPIONAGE_CONFIGS[targetStance].enemyCapReduction;

  // Target high counter-intel penalties
  const counterScore = calculateCounterIntelScore(state, targetPlayerId);
  if (counterScore > 60) {
    cap -= Math.floor((counterScore - 60) / 4);
  }

  return Math.max(ESPIONAGE_CONSTANTS.MIN_CAP, Math.min(ESPIONAGE_CONSTANTS.MAX_CAP, cap));
}

export function calculateInfiltrationGrowthPerSec(state: GameState, network: SpyNetwork): number {
  if (network.assignedEnvoys === 0) {
    return -ESPIONAGE_CONSTANTS.INFILTRATION_DECAY_PER_SEC;
  }

  let growth = ESPIONAGE_CONSTANTS.BASE_INFILTRATION_GROWTH_PER_SEC * network.assignedEnvoys;

  const owner = state.players[network.ownerId];
  if (owner?.research?.sensors) {
    growth += owner.research.sensors * 0.02;
  }

  // Assets provide a slight passive gathering synergy
  if (network.assets && network.assets.length > 0) {
    growth += network.assets.length * 0.02;
  }

  return growth;
}

export function getTieredIntel(
  state: GameState,
  ownerId: string,
  targetPlayerId: string
): {
  tier: 'none' | 'low' | 'medium' | 'high' | 'full';
  infiltrationLevel: number;
  intelDetailsTr: string[];
} {
  const key = getSpyNetworkKey(ownerId, targetPlayerId);
  const network = state.spyNetworks?.[key];
  const level = network?.infiltrationLevel || 0;

  if (level >= 90) {
    return {
      tier: 'full',
      infiltrationLevel: level,
      intelDetailsTr: [
        'Tam Sistem Görüşü: Hedefin tüm yıldız sistemleri ve gezegenleri sensör menzilimizde açıkça izleniyor.',
        'Canlı Filo Telemetrisi: Bütün gemi sayıları, loadout türleri, intikal rotaları ve amiraller görünür.',
        'Hazine & Kaynak Görünürlüğü: Tüm kaynak stokları, pazar işlemleri ve üretim detayları açıklandı.',
      ],
    };
  }

  if (level >= 60) {
    return {
      tier: 'high',
      infiltrationLevel: level,
      intelDetailsTr: [
        'Ayrıntılı Filo İstihbaratı: Filoların net gemi dağılımı ve donanma doktrinleri tespit edildi.',
        'Aktif Araştırma Casusluğu: Hedefin yürüttüğü mevcut teknoloji projeleri ve bitiş süreleri izleniyor.',
        'Yıldız Üssü Mimarisi: Yıldız üslerinin donanım modülleri ve savunma seviyeleri biliniyor.',
      ],
    };
  }

  if (level >= 30) {
    return {
      tier: 'medium',
      infiltrationLevel: level,
      intelDetailsTr: [
        'Genel Ekonomik Profil: Gezegen bazında yaklaşık üretim seviyeleri ve uzmanlaşma yönelimleri biliniyor.',
        'Filo Varlığı: Hedef sistemlerdeki ana filo büyüklükleri yaklaşık olarak tespit edilebiliyor.',
      ],
    };
  }

  if (level >= 10) {
    return {
      tier: 'low',
      infiltrationLevel: level,
      intelDetailsTr: [
        'Temel Varlık Analizi: Hedefin tahmini toplam askeri gücü ve teknoloji seviyesi biliniyor.',
      ],
    };
  }

  return {
    tier: 'none',
    infiltrationLevel: level,
    intelDetailsTr: ['Sınır Sisi: Bu imparatorluk hakkında derinlikli hiçbir istihbarat bulunmuyor.'],
  };
}

// ---------------------------------------------------------------------------
// Command Handlers
// ---------------------------------------------------------------------------

export function establishSpyNetwork(
  state: GameState,
  ownerId: string,
  targetPlayerId: string
): { success: boolean; error?: string; networkId?: string } {
  if (ownerId === targetPlayerId) {
    return { success: false, error: 'Kendi imparatorluğunuza casusluk ağı kuramazsınız.' };
  }

  const owner = state.players[ownerId];
  const target = state.players[targetPlayerId];
  if (!owner) return { success: false, error: 'Sahip oyuncu bulunamadı.' };
  if (!target) return { success: false, error: 'Hedef oyuncu bulunamadı.' };

  const key = getSpyNetworkKey(ownerId, targetPlayerId);
  if (!state.spyNetworks) state.spyNetworks = {};

  if (state.spyNetworks[key]) {
    return { success: false, error: 'Bu imparatorlukta zaten kurulu bir casusluk ağınız var.' };
  }

  // Cost check on primary planet
  const ownerPlanets = Object.values(state.planets).filter((p) => p.ownerId === ownerId);
  const primaryPlanet = ownerPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Koloni bulunamadı.' };

  const cost = ESPIONAGE_CONSTANTS.NETWORK_SETUP_COST;
  if (
    primaryPlanet.resources.ore < cost.ore ||
    primaryPlanet.resources.crystal < cost.crystal ||
    primaryPlanet.resources.fuel < cost.fuel
  ) {
    return { success: false, error: 'Yetersiz kaynak (60 Cevher, 40 Kristal, 40 Yakıt gerekir).' };
  }

  primaryPlanet.resources.ore -= cost.ore;
  primaryPlanet.resources.crystal -= cost.crystal;
  primaryPlanet.resources.fuel -= cost.fuel;

  const cap = calculateInfiltrationCap(state, ownerId, targetPlayerId);

  const network: SpyNetwork = {
    id: key,
    ownerId,
    targetPlayerId,
    infiltrationLevel: 5, // Initial infiltration headstart
    infiltrationCap: cap,
    assignedEnvoys: 1, // Default 1 envoy assigned to begin infiltration
    establishedAtMs: state.timeMs,
    lastUpdateMs: state.timeMs,
    assets: [],
  };

  state.spyNetworks[key] = network;

  state.eventLog.push({
    id: `event_spy_est_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'spy_network_established',
    playerId: ownerId,
    description: `🕵️ CASUSLUK AĞI KURULDU: ${target.name} sınırları içinde gizli bir istihbarat hücresi aktive edildi. 1 Elçi sızma operasyonuna tahsis edildi.`,
    metadata: { networkId: key, targetPlayerId },
  });

  return { success: true, networkId: key };
}

export function recallSpyNetwork(
  state: GameState,
  ownerId: string,
  networkId: string
): { success: boolean; error?: string } {
  if (!state.spyNetworks || !state.spyNetworks[networkId]) {
    return { success: false, error: 'Casusluk ağı bulunamadı.' };
  }

  const network = state.spyNetworks[networkId];
  if (network.ownerId !== ownerId) {
    return { success: false, error: 'Bu casusluk ağı size ait değil.' };
  }

  // Cancel any active operations for this network
  if (state.covertOperations) {
    for (const op of Object.values(state.covertOperations)) {
      if (op.networkId === networkId && op.status === 'in_progress') {
        op.status = 'failed';
      }
    }
  }

  const targetName = state.players[network.targetPlayerId]?.name || 'Hedef';
  delete state.spyNetworks[networkId];

  state.eventLog.push({
    id: `event_spy_rec_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'spy_network_recalled',
    playerId: ownerId,
    description: `🔙 CASUSLUK AĞI GERİ ÇEKİLDİ: ${targetName} topraklarındaki istihbarat hücreleri güvenle feshedildi ve elçiler geri çağrıldı.`,
    metadata: { networkId },
  });

  return { success: true };
}

export function assignSpymasterEnvoy(
  state: GameState,
  ownerId: string,
  networkId: string,
  envoys: number
): { success: boolean; error?: string } {
  if (!state.spyNetworks || !state.spyNetworks[networkId]) {
    return { success: false, error: 'Casusluk ağı bulunamadı.' };
  }

  const network = state.spyNetworks[networkId];
  if (network.ownerId !== ownerId) {
    return { success: false, error: 'Bu casusluk ağı size ait değil.' };
  }

  const clamped = Math.max(0, Math.min(ESPIONAGE_CONSTANTS.MAX_ENVOYS_PER_NETWORK, Math.round(envoys)));
  network.assignedEnvoys = clamped;

  return { success: true };
}

export function acquireSpyAsset(
  state: GameState,
  ownerId: string,
  networkId: string,
  assetType: SpyAssetType
): { success: boolean; error?: string; asset?: SpyAsset } {
  if (!state.spyNetworks || !state.spyNetworks[networkId]) {
    return { success: false, error: 'Casusluk ağı bulunamadı.' };
  }

  const network = state.spyNetworks[networkId];
  if (network.ownerId !== ownerId) {
    return { success: false, error: 'Bu casusluk ağı size ait değil.' };
  }

  const config = SPY_ASSET_CONFIGS[assetType];
  if (!config) {
    return { success: false, error: 'Geçersiz casusluk varlık tipi.' };
  }

  // Cap maximum assets per network (max 4, 1 per archetype)
  if (!network.assets) network.assets = [];
  if (network.assets.some((a) => a.type === assetType)) {
    return { success: false, error: 'Bu casusluk ağında bu uzmanlıkta zaten bir gizli varlığınız bulunuyor.' };
  }

  // Cost check on primary planet
  const ownerPlanets = Object.values(state.planets).filter((p) => p.ownerId === ownerId);
  const primaryPlanet = ownerPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Koloni bulunamadı.' };

  if (
    primaryPlanet.resources.ore < config.cost.ore ||
    primaryPlanet.resources.crystal < config.cost.crystal ||
    primaryPlanet.resources.fuel < config.cost.fuel
  ) {
    return {
      success: false,
      error: `Yetersiz kaynak (${config.cost.ore} Cevher, ${config.cost.crystal} Kristal, ${config.cost.fuel} Yakıt gerekir).`,
    };
  }

  primaryPlanet.resources.ore -= config.cost.ore;
  primaryPlanet.resources.crystal -= config.cost.crystal;
  primaryPlanet.resources.fuel -= config.cost.fuel;

  const names = ASSET_NAMES[assetType];
  const chosenName = names[Math.floor(Math.random() * names.length)];

  const asset: SpyAsset = {
    id: `asset_${assetType}_${state.nextId++}`,
    targetPlayerId: network.targetPlayerId,
    type: assetType,
    name: `${chosenName} (${config.nameTr})`,
    acquiredAtMs: state.timeMs,
    bonusDescriptionTr: config.bonusDescriptionTr,
  };

  network.assets.push(asset);

  state.eventLog.push({
    id: `event_asset_acq_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'spy_asset_acquired',
    playerId: ownerId,
    description: `👤 GİZLİ VARLIK DEVŞİRİLDİ: ${asset.name} hedef sistemde ağımıza katıldı. (${config.bonusDescriptionTr})`,
    metadata: { networkId, assetId: asset.id, type: assetType },
  });

  return { success: true, asset };
}

export function launchCovertOperation(
  state: GameState,
  infiltratorId: string,
  networkId: string,
  opType: CovertOpType,
  targetPlanetId?: string,
  assignedAssetId?: string
): { success: boolean; error?: string; operationId?: string } {
  if (!state.spyNetworks || !state.spyNetworks[networkId]) {
    return { success: false, error: 'Casusluk ağı bulunamadı.' };
  }

  const network = state.spyNetworks[networkId];
  if (network.ownerId !== infiltratorId) {
    return { success: false, error: 'Bu casusluk ağı size ait değil.' };
  }

  const config = COVERT_OP_CONFIGS[opType];
  if (!config) {
    return { success: false, error: 'Geçersiz gizli operasyon tipi.' };
  }

  if (network.infiltrationLevel < config.requiredInfiltration) {
    return {
      success: false,
      error: `Yetersiz sızma seviyesi (${network.infiltrationLevel.toFixed(1)} / ${config.requiredInfiltration} gerekir).`,
    };
  }

  // Check if another operation of this network is in progress
  if (!state.covertOperations) state.covertOperations = {};
  const activeOp = Object.values(state.covertOperations).find(
    (o) => o.networkId === networkId && o.status === 'in_progress'
  );
  if (activeOp) {
    return { success: false, error: 'Bu ağda halihazırda yürütülen bir gizli operasyon bulunuyor.' };
  }

  // Check assigned asset validity
  let durationMs = config.durationMs;
  let infiltrationCost = config.infiltrationCost;

  if (assignedAssetId) {
    const asset = network.assets.find((a) => a.id === assignedAssetId);
    if (!asset) {
      return { success: false, error: 'Atanan gizli varlık bu ağda bulunamadı.' };
    }
    // Asset affinities
    if (asset.type === 'corrupt_dockworker' && opType === 'sabotage_starbase') {
      durationMs = Math.round(durationMs * 0.8);
    }
    if (asset.type === 'disgruntled_bureaucrat' && (opType === 'diplomatic_incident' || opType === 'extort_favor')) {
      infiltrationCost = Math.max(5, Math.round(infiltrationCost * 0.7));
    }
  }

  // Deduct infiltration cost immediately
  network.infiltrationLevel = Math.max(0, network.infiltrationLevel - infiltrationCost);

  const opId = `covert_op_${state.nextId++}`;
  const op: CovertOperation = {
    id: opId,
    networkId,
    infiltratorId,
    targetPlayerId: network.targetPlayerId,
    targetPlanetId,
    opType,
    assignedAssetId,
    startedAtMs: state.timeMs,
    durationMs,
    progressPercent: 0,
    requiredInfiltration: config.requiredInfiltration,
    infiltrationCost,
    status: 'in_progress',
  };

  state.covertOperations[opId] = op;

  const targetName = state.players[network.targetPlayerId]?.name || 'Hedef';
  state.eventLog.push({
    id: `event_op_launch_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'covert_operation_launched',
    playerId: infiltratorId,
    description: `🕶️ GİZLİ OPERASYON BAŞLATILDI: ${targetName} hedefine yönelik "${config.nameTr}" operasyonu yürürlüğe girdi (${Math.round(durationMs / 1000)} sn).`,
    metadata: { operationId: opId, opType, targetPlayerId: network.targetPlayerId },
  });

  return { success: true, operationId: opId };
}

export function cancelCovertOperation(
  state: GameState,
  infiltratorId: string,
  operationId: string
): { success: boolean; error?: string } {
  if (!state.covertOperations || !state.covertOperations[operationId]) {
    return { success: false, error: 'Operasyon bulunamadı.' };
  }

  const op = state.covertOperations[operationId];
  if (op.infiltratorId !== infiltratorId) {
    return { success: false, error: 'Bu operasyon size ait değil.' };
  }

  if (op.status !== 'in_progress') {
    return { success: false, error: 'Yalnızca yürütülmekte olan operasyonlar iptal edilebilir.' };
  }

  op.status = 'failed';

  state.eventLog.push({
    id: `event_op_cancel_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'covert_operation_cancelled',
    playerId: infiltratorId,
    description: `⛔ OPERASYON İPTAL EDİLDİ: Yürütülen gizli operasyon ajanların güvenliği için durduruldu.`,
    metadata: { operationId },
  });

  return { success: true };
}

export function setCounterEspionageStance(
  state: GameState,
  playerId: string,
  stance: CounterEspionageStance
): { success: boolean; error?: string } {
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı.' };

  const config = COUNTER_ESPIONAGE_CONFIGS[stance];
  if (!config) return { success: false, error: 'Geçersiz karşı istihbarat duruşu.' };

  player.counterEspionageStance = stance;

  state.eventLog.push({
    id: `event_stance_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'counter_espionage_stance_changed',
    playerId,
    description: `🛡️ KARŞI İSTİHBARAT DURUŞU GÜNCELLENDİ: Güvenlik protokolü "${config.nameTr}" olarak değiştirildi.`,
    metadata: { stance },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Main Game Loop Update
// ---------------------------------------------------------------------------

export function updateEspionageNetworks(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) return;

  const deltaSec = deltaMs / 1000;

  // 1. Update Infiltration Levels & Caps for all active networks
  if (state.spyNetworks) {
    for (const network of Object.values(state.spyNetworks)) {
      // Recalculate cap dynamically
      network.infiltrationCap = calculateInfiltrationCap(state, network.ownerId, network.targetPlayerId);

      // Growth or decay
      const growthPerSec = calculateInfiltrationGrowthPerSec(state, network);
      network.infiltrationLevel = Math.max(
        0,
        Math.min(network.infiltrationCap, network.infiltrationLevel + growthPerSec * deltaSec)
      );
      network.lastUpdateMs = state.timeMs;
    }
  }

  // 2. Update In-Progress Covert Operations
  if (state.covertOperations) {
    for (const op of Object.values(state.covertOperations)) {
      if (op.status !== 'in_progress') continue;

      const progressDelta = (deltaMs / op.durationMs) * 100;
      op.progressPercent = Math.min(100, op.progressPercent + progressDelta);

      if (op.progressPercent >= 100) {
        resolveCovertOperation(state, op);
      }
    }
  }
}

function resolveCovertOperation(state: GameState, op: CovertOperation): void {
  const infiltrator = state.players[op.infiltratorId];
  const target = state.players[op.targetPlayerId];
  const network = state.spyNetworks?.[op.networkId];
  const opConfig = COVERT_OP_CONFIGS[op.opType];

  if (!infiltrator || !target || !opConfig) {
    op.status = 'failed';
    return;
  }

  // Calculate Success Probability
  let successChance = opConfig.baseSuccessRate;

  // Check asset bonus
  if (op.assignedAssetId && network?.assets) {
    const asset = network.assets.find((a) => a.id === op.assignedAssetId);
    if (asset) {
      const assetCfg = SPY_ASSET_CONFIGS[asset.type];
      if (assetCfg.opAffinities.includes(op.opType)) {
        successChance += 0.25;
      }
    }
  }

  // Target counter-intelligence resistance
  const counterScore = calculateCounterIntelScore(state, op.targetPlayerId);
  successChance -= (counterScore / 250);

  // Infiltration surplus bonus
  if (network && network.infiltrationLevel > opConfig.requiredInfiltration) {
    const surplus = network.infiltrationLevel - opConfig.requiredInfiltration;
    successChance += (surplus / 300);
  }

  // Clamp probability between 15% and 95%
  successChance = Math.max(0.15, Math.min(0.95, successChance));

  const isSuccess = Math.random() <= successChance;

  if (isSuccess) {
    op.status = 'succeeded';
    applyOperationSuccess(state, op, infiltrator, target, network);
  } else {
    // Determine if compromised
    const stance = target.counterEspionageStance || 'relaxed';
    let compromiseChance = 0.20 + COUNTER_ESPIONAGE_CONFIGS[stance].detectionChanceBonus;
    if (counterScore > 50) compromiseChance += 0.15;

    // Asset safety reduction
    if (op.assignedAssetId && network?.assets) {
      const asset = network.assets.find((a) => a.id === op.assignedAssetId);
      if (asset?.type === 'disaffected_scientist' && op.opType === 'steal_technology') {
        compromiseChance -= 0.25;
      }
    }

    const isCompromised = Math.random() <= Math.max(0.10, compromiseChance);

    if (isCompromised) {
      op.status = 'compromised';
      if (network) {
        // Severe loss of infiltration when compromised
        network.infiltrationLevel = Math.max(0, network.infiltrationLevel - 20);
      }
      handleOperationCompromised(state, op, infiltrator, target);
    } else {
      op.status = 'failed';
      state.eventLog.push({
        id: `event_op_fail_${state.nextId++}`,
        timeMs: state.timeMs,
        type: 'covert_operation_failed',
        playerId: infiltrator.id,
        description: `❌ OPERASYON BAŞARISIZ OLDU: ${target.name} hedefine yönelik "${opConfig.nameTr}" operasyonu hedefine ulaşamadı ancak ajanlarımız deşifre olmadan geri çekildi.`,
        metadata: { operationId: op.id, opType: op.opType },
      });
    }
  }
}

function applyOperationSuccess(
  state: GameState,
  op: CovertOperation,
  infiltrator: GameState['players'][string],
  target: GameState['players'][string],
  network?: SpyNetwork
): void {
  const opConfig = COVERT_OP_CONFIGS[op.opType];
  const targetPlanets = Object.values(state.planets).filter((p) => p.ownerId === target.id);
  const targetPlanet = (op.targetPlanetId && state.planets[op.targetPlanetId]) || targetPlanets[0];
  const infiltratorPlanets = Object.values(state.planets).filter((p) => p.ownerId === infiltrator.id);
  const homePlanet = infiltratorPlanets[0];

  let outcomeSummaryTr = '';

  switch (op.opType) {
    case 'gather_intel': {
      outcomeSummaryTr = `${target.name} imparatorluğunun askeri garnizonları, maden rezervleri ve araştırma laboratuvarları haritalandı.`;
      // Reward network with bonus infiltration
      if (network) {
        network.infiltrationLevel = Math.min(network.infiltrationCap, network.infiltrationLevel + 10);
      }
      break;
    }

    case 'steal_technology': {
      // Find a tech where target has higher level than infiltrator
      const techTypes: ResearchType[] = ['weapons', 'engines', 'sensors'];
      let stolenTech: ResearchType | null = null;

      for (const t of techTypes) {
        const targetLvl = target.research?.[t] || 0;
        const myLvl = infiltrator.research?.[t] || 0;
        if (targetLvl > myLvl) {
          stolenTech = t;
          break;
        }
      }

      if (stolenTech) {
        infiltrator.research[stolenTech] = (infiltrator.research[stolenTech] || 0) + 1;
        outcomeSummaryTr = `${target.name} laboratuvarlarından "${stolenTech.toUpperCase()}" araştırma prototipi çalındı (+1 Seviye Araştırma kazanıldı)!`;
      } else {
        // Complete current research queue if active or grant crystal/fuel
        if (infiltrator.researchQueue) {
          infiltrator.researchQueue.finishTime = state.timeMs;
          outcomeSummaryTr = `Mevcut araştırma kuyruğundaki proje hedef verileri sayesinde anında tamamlandı!`;
        } else if (homePlanet) {
          homePlanet.resources.crystal += 300;
          outcomeSummaryTr = `Gelişmiş teknoloji şemaları pazar verisi olarak satıldı (+300 Kristal elde edildi).`;
        }
      }
      break;
    }

    case 'sabotage_starbase': {
      // Find starbase in target planet's system or first starbase
      let sabotaged = false;
      if (state.starbases) {
        for (const sb of Object.values(state.starbases)) {
          if (sb.ownerId === target.id) {
            // Apply hull damage
            sb.hull = Math.max(1, Math.round(sb.hull * 0.6));
            sabotaged = true;
            outcomeSummaryTr = `${sb.systemId} sistemindeki ${sb.tier.toUpperCase()} seviye yıldız üssünün ana jeneratörleri patlatıldı (%40 Gövde hasarı)!`;
            break;
          }
        }
      }
      if (!sabotaged && targetPlanet) {
        // Disable defense modules or damage garrison
        if (targetPlanet.defenses?.ion_cannon) {
          targetPlanet.defenses.ion_cannon = Math.max(0, targetPlanet.defenses.ion_cannon - 1);
          outcomeSummaryTr = `${targetPlanet.name} iyon topu bataryası sabote edilerek devre dışı bırakıldı!`;
        } else if (targetPlanet.garrison.fighter) {
          targetPlanet.garrison.fighter = Math.max(0, targetPlanet.garrison.fighter - 2);
          outcomeSummaryTr = `${targetPlanet.name} savunma filosu sabote edildi (-2 Avcı imha edildi)!`;
        } else {
          outcomeSummaryTr = `${targetPlanet.name} tersane ve montaj sahası geçici olarak felç edildi.`;
        }
      }
      break;
    }

    case 'destabilize_economy': {
      if (targetPlanet && homePlanet) {
        const stolenOre = Math.round(targetPlanet.resources.ore * 0.20);
        const stolenFuel = Math.round(targetPlanet.resources.fuel * 0.20);
        targetPlanet.resources.ore = Math.max(0, targetPlanet.resources.ore - stolenOre);
        targetPlanet.resources.fuel = Math.max(0, targetPlanet.resources.fuel - stolenFuel);

        homePlanet.resources.ore += stolenOre;
        homePlanet.resources.fuel += stolenFuel;

        outcomeSummaryTr = `${targetPlanet.name} kaynak hatları felç edildi. ${stolenOre} Cevher ve ${stolenFuel} Yakıt ele geçirilerek imparatorluğumuza aktarıldı.`;
      } else {
        outcomeSummaryTr = `Hedef pazar spekülasyonu ile çalkantıya uğratıldı.`;
      }
      break;
    }

    case 'diplomatic_incident': {
      if (target.federationId && state.federations?.[target.federationId]) {
        const fed = state.federations[target.federationId];
        fed.cohesion = Math.max(0, fed.cohesion - 20);
        outcomeSummaryTr = `Hedefin "${fed.name}" federasyonundaki temsilcileri sahte yolsuzluk belgeleriyle hedef alındı (-20 Federasyon Uyumu)!`;
      } else {
        outcomeSummaryTr = `${target.name} diplomasisi skandallarla sarsıldı; diplomatik ağırlığı ve senato prestiji ağır yara aldı.`;
      }
      break;
    }

    case 'arm_insurgents': {
      if (targetPlanet) {
        if (targetPlanet.defenses?.missile_battery) {
          targetPlanet.defenses.missile_battery = Math.max(0, targetPlanet.defenses.missile_battery - 1);
        }
        if (targetPlanet.garrison.fighter) {
          targetPlanet.garrison.fighter = Math.max(0, targetPlanet.garrison.fighter - 4);
        }
        outcomeSummaryTr = `${targetPlanet.name} kolonisindeki direnişçilere silah dağıtıldı (Füze bataryaları ve garnizon ağır hasar aldı).`;
      } else {
        outcomeSummaryTr = `Koloni iç güvenliği kaosa sürüklendi.`;
      }
      break;
    }

    case 'extort_favor': {
      // Grant Hegemony points and diplomatic influence
      infiltrator.intel = {
        ...infiltrator.intel,
      };
      if (homePlanet) {
        homePlanet.resources.ore += 150;
        homePlanet.resources.crystal += 150;
      }
      outcomeSummaryTr = `Hedef konsey üyelerine şantaj yapılarak +15 Hegemonya ve diplomatik koz elde edildi!`;
      break;
    }
  }

  state.eventLog.push({
    id: `event_op_succ_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'covert_operation_succeeded',
    playerId: infiltrator.id,
    description: `🎯 GİZLİ OPERASYON BAŞARILI: "${opConfig.nameTr}" kusursuz icra edildi! ${outcomeSummaryTr}`,
    metadata: { operationId: op.id, opType: op.opType, targetPlayerId: target.id },
  });
}

function handleOperationCompromised(
  state: GameState,
  op: CovertOperation,
  infiltrator: GameState['players'][string],
  target: GameState['players'][string]
): void {
  const opConfig = COVERT_OP_CONFIGS[op.opType];

  state.eventLog.push({
    id: `event_op_comp_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'covert_operation_compromised',
    playerId: infiltrator.id,
    description: `🚨 CASUS DEŞİFRE OLDU: ${target.name} güvenlik güçleri "${opConfig.nameTr}" operasyonundaki hücremizi ortaya çıkardı! Sızma seviyemiz ağır darbe aldı.`,
    metadata: { operationId: op.id, opType: op.opType, targetPlayerId: target.id },
  });

  // Target notification
  state.eventLog.push({
    id: `event_op_det_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'hostile_espionage_intercepted',
    playerId: target.id,
    description: `🛡️ KARŞI İSTİHBARAT ZAFERİ: ${infiltrator.name} casusluk şebekesinin "${opConfig.nameTr}" sabotaj girişimi güvenlik birimlerimizce suçüstü yakalandı! İmparatorluğumuza Casus Belli hakkı doğdu.`,
    metadata: { operationId: op.id, infiltratorId: infiltrator.id, opType: op.opType },
  });
}
