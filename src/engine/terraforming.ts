import {
  GameState,
  Planet,
  PlanetBiome,
  PlanetSlot,
  PlanetaryBlocker,
  PlanetaryBlockerId,
  PlanetaryDecision,
  PlanetaryDecisionId,
  Player,
  Resources,
  TerraformQueue,
} from './types';

export interface BiomeConfig {
  biome: PlanetBiome;
  nameTr: string;
  descriptionTr: string;
  habitability: number; // e.g. 1.0 = 100%
  oreMultiplier: number;
  crystalMultiplier: number;
  fuelMultiplier: number;
  researchMultiplier: number;
}

export const BIOME_CONFIGS: Record<PlanetBiome, BiomeConfig> = {
  terran: {
    biome: 'terran',
    nameTr: 'Yaşanabilir (Terran)',
    descriptionTr: 'Dengeli atmosfer ve zengin biyosfer. Bütün sektörlerde standart dengeli verim.',
    habitability: 1.0,
    oreMultiplier: 1.0,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.0,
    researchMultiplier: 1.0,
  },
  ocean: {
    biome: 'ocean',
    nameTr: 'Okyanus Dünyası',
    descriptionTr: 'Geniş hidrosfer ve deniz biyo-yakıtları. Yüksek yakıt ve kristal zenginliği.',
    habitability: 0.85,
    oreMultiplier: 0.90,
    crystalMultiplier: 1.15,
    fuelMultiplier: 1.20,
    researchMultiplier: 1.05,
  },
  desert: {
    biome: 'desert',
    nameTr: 'Çöl & Kanyon Dünyası',
    descriptionTr: 'Kurak mineral kumulları ve zengin silikat/kristal yatakları.',
    habitability: 0.65,
    oreMultiplier: 1.15,
    crystalMultiplier: 1.25,
    fuelMultiplier: 0.90,
    researchMultiplier: 1.0,
  },
  ice: {
    biome: 'ice',
    nameTr: 'Buzul Dünyası',
    descriptionTr: 'Derin kriyosferik tabaka. Üstün araştırma laboratuvarları ve kristal izotopları.',
    habitability: 0.55,
    oreMultiplier: 0.85,
    crystalMultiplier: 1.20,
    fuelMultiplier: 0.90,
    researchMultiplier: 1.15,
  },
  volcanic: {
    biome: 'volcanic',
    nameTr: 'Volkanik Magma Dünyası',
    descriptionTr: 'Yoğun tektonik aktivite ve zengin ağır metal magma tabakaları.',
    habitability: 0.40,
    oreMultiplier: 1.35,
    crystalMultiplier: 0.85,
    fuelMultiplier: 1.10,
    researchMultiplier: 0.90,
  },
  gas: {
    biome: 'gas',
    nameTr: 'Gaz Devi',
    descriptionTr: 'Aşırı yerçekimi ve kalın gaz katmanları. Doğrudan ıslah edilemez.',
    habitability: 0.0,
    oreMultiplier: 0.5,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.5,
    researchMultiplier: 1.1,
  },
  gaia: {
    biome: 'gaia',
    nameTr: 'Gaia Cennet Dünyası',
    descriptionTr: 'Kusursuz biyo-iklimsel uyum. Bütün kaynaklarda ve araştırmada +%25 saf üstünlük.',
    habitability: 1.25,
    oreMultiplier: 1.25,
    crystalMultiplier: 1.25,
    fuelMultiplier: 1.25,
    researchMultiplier: 1.25,
  },
  tomb: {
    biome: 'tomb',
    nameTr: 'Kıyamet Sonrası Çorak Dünya',
    descriptionTr: 'Nükleer ve biyolojik kışla çoraklaşmış tehlikeli enkaz dünyası.',
    habitability: 0.30,
    oreMultiplier: 1.10,
    crystalMultiplier: 1.10,
    fuelMultiplier: 0.80,
    researchMultiplier: 1.20,
  },
  shattered: {
    biome: 'shattered',
    nameTr: 'Parçalanmış Dünya (Asteroit Kuşağı)',
    descriptionTr: 'Gezegen Kırıcı doomsday lazeri ile parçalanmış enkaz asteroit sahası.',
    habitability: 0.0,
    oreMultiplier: 2.0,
    crystalMultiplier: 0.5,
    fuelMultiplier: 0.2,
    researchMultiplier: 1.1,
  },
  shield_world: {
    biome: 'shield_world',
    nameTr: 'Fanus Dünya (Kalkanlı Gezegen)',
    descriptionTr: 'Gezegen Fanusu ile sarılmış, dış evrenden tamamen izole edilmiş kalkan dünyası.',
    habitability: 0.0,
    oreMultiplier: 0.0,
    crystalMultiplier: 0.0,
    fuelMultiplier: 0.0,
    researchMultiplier: 1.5,
  },
  nanite_world: {
    biome: 'nanite_world',
    nameTr: 'Nanit Dünyası',
    descriptionTr: 'Moleküler nanit ayrıştırıcı ile dönüştürülmüş metalik kristal dünyası.',
    habitability: 0.1,
    oreMultiplier: 0.8,
    crystalMultiplier: 2.2,
    fuelMultiplier: 0.5,
    researchMultiplier: 1.3,
  },
  machine_world: {
    biome: 'machine_world',
    nameTr: 'Makine Dünyası',
    descriptionTr: 'Yüzeyi tamamen sibernetik kovan sunucuları ve robotik montaj hatlarıyla kaplanmış mekanik dünya. Organikler için zorlayıcı, sentetik üretimde zirve.',
    habitability: 0.1,
    oreMultiplier: 1.5,
    crystalMultiplier: 1.3,
    fuelMultiplier: 1.5,
    researchMultiplier: 1.3,
  },
};

export interface TerraformRecipeDef {
  targetBiome: PlanetBiome;
  allowedSources: PlanetBiome[];
  cost: Resources;
  durationMs: number;
  requiredLabLevel?: number;
  descriptionTr: string;
}

export const TERRAFORM_RECIPES: TerraformRecipeDef[] = [
  {
    targetBiome: 'terran',
    allowedSources: ['desert', 'ocean', 'ice', 'volcanic', 'tomb'],
    cost: { ore: 1200, crystal: 800, fuel: 600 },
    durationMs: 45000,
    requiredLabLevel: 1,
    descriptionTr: 'Atmosferik nemlendirme ve azot-oksijen dengesi kurarak gezegeni yeşil bir Terran dünyasına dönüştürür.',
  },
  {
    targetBiome: 'ocean',
    allowedSources: ['ice', 'desert', 'volcanic', 'terran', 'tomb'],
    cost: { ore: 1100, crystal: 900, fuel: 700 },
    durationMs: 40000,
    requiredLabLevel: 1,
    descriptionTr: 'Buzulları eritip küresel hidrosfer döngüsü başlatarak devasa biyo-okyanuslar oluşturur.',
  },
  {
    targetBiome: 'gaia',
    allowedSources: ['terran', 'ocean', 'desert', 'ice', 'volcanic', 'tomb'],
    cost: { ore: 2500, crystal: 2000, fuel: 1600 },
    durationMs: 75000,
    requiredLabLevel: 2,
    descriptionTr: 'Mükemmel ekolojik mühendislik ve biyo-ahenk alanı yaratarak gezegeni efsanevi bir Gaia cennetine yüceltir.',
  },
  {
    targetBiome: 'desert',
    allowedSources: ['terran', 'volcanic', 'ice', 'ocean', 'tomb'],
    cost: { ore: 900, crystal: 600, fuel: 500 },
    durationMs: 35000,
    descriptionTr: 'Yüzey suyunu buharlaştırıp silikat kanyonları ve zengin kristal çölleri oluşturur.',
  },
  {
    targetBiome: 'ice',
    allowedSources: ['terran', 'ocean', 'desert', 'volcanic', 'tomb'],
    cost: { ore: 900, crystal: 600, fuel: 500 },
    durationMs: 35000,
    descriptionTr: 'Güneş yansıtıcı aynalarla küresel kriyosfer oluşturup kriyojenik araştırma ortamı hazırlar.',
  },
  {
    targetBiome: 'volcanic',
    allowedSources: ['terran', 'desert', 'ice', 'ocean', 'tomb'],
    cost: { ore: 1100, crystal: 700, fuel: 600 },
    durationMs: 40000,
    descriptionTr: 'Tektonik yarıkları tetikleyerek ağır metal magma akıntılarını yüzeye çıkarır.',
  },
];

export interface PlanetaryBlockerDef {
  id: PlanetaryBlockerId;
  nameTr: string;
  descriptionTr: string;
  cost: Resources;
  clearTimeMs: number;
  reward: Resources;
  habitabilityPenalty: number;
  orePenalty: number;
  crystalPenalty: number;
  fuelPenalty: number;
  researchPenalty: number;
}

export const PLANETARY_BLOCKERS: Record<PlanetaryBlockerId, PlanetaryBlockerDef> = {
  volcanic_ash_wastes: {
    id: 'volcanic_ash_wastes',
    nameTr: 'Volkanik Kül Çoraklığı',
    descriptionTr: 'Sülfür ve zehirli kül fırtınaları yüzey madenciliğini ve yerleşimi aksatıyor.',
    cost: { ore: 300, crystal: 0, fuel: 150 },
    clearTimeMs: 20000,
    reward: { ore: 150, crystal: 50, fuel: 0 },
    habitabilityPenalty: 0.15,
    orePenalty: 0.10,
    crystalPenalty: 0.05,
    fuelPenalty: 0,
    researchPenalty: 0,
  },
  radioactive_fallout: {
    id: 'radioactive_fallout',
    nameTr: 'Radyoaktif Enkaz Alanı',
    descriptionTr: 'Kadim savaşlardan kalma fisyon atıkları ve radyasyon kraterleri.',
    cost: { ore: 400, crystal: 250, fuel: 0 },
    clearTimeMs: 25000,
    reward: { ore: 0, crystal: 120, fuel: 80 },
    habitabilityPenalty: 0.20,
    orePenalty: 0,
    crystalPenalty: 0,
    fuelPenalty: 0,
    researchPenalty: 0.15,
  },
  glacial_chasm: {
    id: 'glacial_chasm',
    nameTr: 'Derin Buzul Kanyonu',
    descriptionTr: 'Gezegen kabuğunu bölen yüzlerce metre kalınlığında aşılmaz buzul yarıkları.',
    cost: { ore: 250, crystal: 0, fuel: 200 },
    clearTimeMs: 20000,
    reward: { ore: 120, crystal: 0, fuel: 60 },
    habitabilityPenalty: 0.05,
    orePenalty: 0.10,
    crystalPenalty: 0,
    fuelPenalty: 0.10,
    researchPenalty: 0,
  },
  noxious_swamp: {
    id: 'noxious_swamp',
    nameTr: 'Zehirli Bataklık & Asit Gölleri',
    descriptionTr: 'Aşındırıcı kimyasal göller ve zehirli spor üreten bataklıklar.',
    cost: { ore: 250, crystal: 200, fuel: 0 },
    clearTimeMs: 18000,
    reward: { ore: 0, crystal: 80, fuel: 100 },
    habitabilityPenalty: 0.15,
    orePenalty: 0,
    crystalPenalty: 0,
    fuelPenalty: 0.10,
    researchPenalty: 0,
  },
  dense_jungle: {
    id: 'dense_jungle',
    nameTr: 'Vahşi Biyokütle Ormanı',
    descriptionTr: 'Aşırı hızlı büyüyen agresif flora ve yırtıcı fauna yerleşim alanlarını kısıtlıyor.',
    cost: { ore: 200, crystal: 0, fuel: 150 },
    clearTimeMs: 15000,
    reward: { ore: 100, crystal: 60, fuel: 0 },
    habitabilityPenalty: 0.10,
    orePenalty: 0,
    crystalPenalty: 0,
    fuelPenalty: 0,
    researchPenalty: 0,
  },
};

export interface PlanetaryDecisionDef {
  id: PlanetaryDecisionId;
  nameTr: string;
  descriptionTr: string;
  cost: Resources;
  durationMs?: number; // undefined if permanent
  habitabilityBonus: number;
  oreMultiplier: number;
  crystalMultiplier: number;
  fuelMultiplier: number;
  researchMultiplier: number;
  defenseMultiplier: number;
  unityReward?: number;
  effectsTr: string[];
}

export const PLANETARY_DECISIONS: Record<PlanetaryDecisionId, PlanetaryDecisionDef> = {
  climate_domes: {
    id: 'climate_domes',
    nameTr: 'Yapay İklim Kubbeleri',
    descriptionTr: 'Koloni merkezlerini koruyan iklim kalkanları kurarak yaşam konforunu ve verimliliği artırır.',
    cost: { ore: 400, crystal: 300, fuel: 150 },
    habitabilityBonus: 0.15,
    oreMultiplier: 1.05,
    crystalMultiplier: 1.05,
    fuelMultiplier: 1.05,
    researchMultiplier: 1.05,
    defenseMultiplier: 1.0,
    effectsTr: ['+%15 Yaşanabilirlik', '+%5 Tüm Kaynak Üretimi'],
  },
  soil_enrichment: {
    id: 'soil_enrichment',
    nameTr: 'Toprak Islahı & Biyo-Gübreleme',
    descriptionTr: 'Toprağa mikro-besleyiciler ve yapay katalizörler enjekte ederek hidrokarbon sentezini hızlandırır.',
    cost: { ore: 300, crystal: 250, fuel: 150 },
    habitabilityBonus: 0.05,
    oreMultiplier: 1.0,
    crystalMultiplier: 1.10,
    fuelMultiplier: 1.15,
    researchMultiplier: 1.0,
    defenseMultiplier: 1.0,
    effectsTr: ['+%15 Yakıt Rafinerisi Çıktısı', '+%10 Kristal Sentezi'],
  },
  geothermal_core_drill: {
    id: 'geothermal_core_drill',
    nameTr: 'Jeotermal Çekirdek Sondajı',
    descriptionTr: 'Gezegen magmasına derin sondaj kuyuları açarak maden damarlarını doğrudan sömürür.',
    cost: { ore: 450, crystal: 0, fuel: 200 },
    habitabilityBonus: -0.05,
    oreMultiplier: 1.25,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.0,
    researchMultiplier: 1.0,
    defenseMultiplier: 1.0,
    effectsTr: ['+%25 Cevher Madenciliği', '-%5 Yaşanabilirlik'],
  },
  ecological_sanctuary: {
    id: 'ecological_sanctuary',
    nameTr: 'Ekolojik Koruma Parkı',
    descriptionTr: 'Doğal biyomları koruma altına alıp bilimsel saha araştırma enstitüleri kurar.',
    cost: { ore: 0, crystal: 350, fuel: 250 },
    habitabilityBonus: 0.10,
    oreMultiplier: 1.0,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.0,
    researchMultiplier: 1.15,
    defenseMultiplier: 1.0,
    unityReward: 100,
    effectsTr: ['+%15 Bilimsel Araştırma Hızı', '+%10 Yaşanabilirlik', '+100 Kültürel Birlik (Tek Seferlik)'],
  },
  planetary_shield_overcharge: {
    id: 'planetary_shield_overcharge',
    nameTr: 'Gezegensel Savunma Matrisi Aşırı Yükleme',
    descriptionTr: 'Kalkan jeneratörlerini geçici olarak tam kapasite çalıştırıp koloniyi hava akınlarına karşı korur.',
    cost: { ore: 0, crystal: 300, fuel: 300 },
    durationMs: 120000, // 2 minutes
    habitabilityBonus: 0.0,
    oreMultiplier: 1.0,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.0,
    researchMultiplier: 1.0,
    defenseMultiplier: 1.35,
    effectsTr: ['+%35 Gezegensel Savunma Dayanıklılığı (2 Dakika)'],
  },
  strip_mining_initiative: {
    id: 'strip_mining_initiative',
    nameTr: 'Hızlı Açık Ocak Madenciliği',
    descriptionTr: 'Çevre regülasyonlarını askıya alıp gezegen yüzeyini agresif biçimde kazarak anlık yüksek cevher çıkarır.',
    cost: { ore: 0, crystal: 0, fuel: 200 },
    durationMs: 90000, // 1.5 minutes
    habitabilityBonus: -0.10,
    oreMultiplier: 1.35,
    crystalMultiplier: 1.0,
    fuelMultiplier: 1.0,
    researchMultiplier: 1.0,
    defenseMultiplier: 1.0,
    effectsTr: ['+%35 Cevher Üretimi (90 Saniye)', '-%10 Yaşanabilirlik'],
  },
};

/**
 * Returns the effective biome of a planet, falling back to system slot type or 'terran'
 */
export function getPlanetEffectiveBiome(planet?: Planet | null, slot?: PlanetSlot | null): PlanetBiome {
  if (planet?.biome) return planet.biome;
  if (slot?.type) return slot.type;
  return 'terran';
}

/**
 * Aggregates all ecological modifiers for a planet:
 * Biome multipliers + Planetary Decisions + Blocker penalties
 */
export function getPlanetEcologyModifiers(planet: Planet, slot?: PlanetSlot | null): {
  oreMultiplier: number;
  crystalMultiplier: number;
  fuelMultiplier: number;
  researchMultiplier: number;
  defenseMultiplier: number;
  habitability: number;
} {
  const biome = getPlanetEffectiveBiome(planet, slot);
  const biomeCfg = BIOME_CONFIGS[biome] || BIOME_CONFIGS.terran;

  let oreMult = biomeCfg.oreMultiplier;
  let crystalMult = biomeCfg.crystalMultiplier;
  let fuelMult = biomeCfg.fuelMultiplier;
  let researchMult = biomeCfg.researchMultiplier;
  let defenseMult = 1.0;
  let habitability = biomeCfg.habitability;

  // Active Planetary Decisions
  if (planet.activeDecisions) {
    for (const dec of planet.activeDecisions) {
      const def = PLANETARY_DECISIONS[dec.id];
      if (!def) continue;
      oreMult *= def.oreMultiplier;
      crystalMult *= def.crystalMultiplier;
      fuelMult *= def.fuelMultiplier;
      researchMult *= def.researchMultiplier;
      defenseMult *= def.defenseMultiplier;
      habitability += def.habitabilityBonus;
    }
  }

  // Active Blockers penalties
  if (planet.blockers) {
    for (const blk of planet.blockers) {
      const def = PLANETARY_BLOCKERS[blk.type];
      if (!def) continue;
      oreMult *= Math.max(0.1, 1 - def.orePenalty);
      crystalMult *= Math.max(0.1, 1 - def.crystalPenalty);
      fuelMult *= Math.max(0.1, 1 - def.fuelPenalty);
      researchMult *= Math.max(0.1, 1 - def.researchPenalty);
      habitability = Math.max(0.05, habitability - def.habitabilityPenalty);
    }
  }

  return {
    oreMultiplier: Math.round(oreMult * 100) / 100,
    crystalMultiplier: Math.round(crystalMult * 100) / 100,
    fuelMultiplier: Math.round(fuelMult * 100) / 100,
    researchMultiplier: Math.round(researchMult * 100) / 100,
    defenseMultiplier: Math.round(defenseMult * 100) / 100,
    habitability: Math.round(habitability * 100) / 100,
  };
}

/**
 * Finds a valid terraform recipe from current biome to target biome
 */
export function getTerraformRecipe(sourceBiome: PlanetBiome, targetBiome: PlanetBiome): TerraformRecipeDef | undefined {
  if (sourceBiome === targetBiome || sourceBiome === 'gas') return undefined;
  return TERRAFORM_RECIPES.find(
    (r) => r.targetBiome === targetBiome && r.allowedSources.includes(sourceBiome)
  );
}

/**
 * Validates whether a planet can begin terraforming
 */
export function canStartTerraforming(
  state: GameState,
  playerId: string,
  planetId: string,
  targetBiome: PlanetBiome
): { canStart: boolean; reason?: string; cost?: Resources; durationMs?: number } {
  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { canStart: false, reason: 'Gezegen kontrolünüz altında değil.' };
  }

  if (planet.terraformingQueue) {
    return { canStart: false, reason: 'Gezegende zaten devam eden bir ıslah süreci var.' };
  }

  const sys = state.map.systems[planet.systemId];
  const slot = sys?.slots.find((s) => s.planetId === planet.id || s.slotIndex === planet.slotIndex);
  const currentBiome = getPlanetEffectiveBiome(planet, slot);

  if (currentBiome === targetBiome) {
    return { canStart: false, reason: 'Gezegen zaten bu biyom türüne sahip.' };
  }

  if (currentBiome === 'gas') {
    return { canStart: false, reason: 'Gaz devleri yüzey ıslahına uygun değildir.' };
  }

  const recipe = getTerraformRecipe(currentBiome, targetBiome);
  if (!recipe) {
    return { canStart: false, reason: `${currentBiome.toUpperCase()} -> ${targetBiome.toUpperCase()} dönüşüm formülü bulunamadı.` };
  }

  if (recipe.requiredLabLevel) {
    const labLevel = planet.buildings.research_lab || 0;
    if (labLevel < recipe.requiredLabLevel) {
      return { canStart: false, reason: `Bu ıslah için Gezegen Araştırma Merkezi seviye ${recipe.requiredLabLevel}+ gereklidir.` };
    }
  }

  if (
    planet.resources.ore < recipe.cost.ore ||
    planet.resources.crystal < recipe.cost.crystal ||
    planet.resources.fuel < recipe.cost.fuel
  ) {
    return {
      canStart: false,
      reason: 'Yetersiz kaynak. Islah için gerekli gezegen rezervi karşılanamıyor.',
      cost: recipe.cost,
    };
  }

  return { canStart: true, cost: recipe.cost, durationMs: recipe.durationMs };
}

/**
 * Initiates terraforming on a planet
 */
export function startTerraforming(
  planet: Planet,
  targetBiome: PlanetBiome,
  cost: Resources,
  durationMs: number,
  nowMs: number
): void {
  planet.resources.ore -= cost.ore;
  planet.resources.crystal -= cost.crystal;
  planet.resources.fuel -= cost.fuel;

  planet.terraformingQueue = {
    targetBiome,
    cost: { ...cost },
    startTime: nowMs,
    finishTime: nowMs + durationMs,
  };
}

/**
 * Cancels active terraforming on a planet with a 75% resource refund
 */
export function cancelTerraforming(planet: Planet): { refundedResources: Resources } | null {
  if (!planet.terraformingQueue) return null;

  const cost = planet.terraformingQueue.cost;
  const refund: Resources = {
    ore: Math.round(cost.ore * 0.75),
    crystal: Math.round(cost.crystal * 0.75),
    fuel: Math.round(cost.fuel * 0.75),
  };

  planet.resources.ore = Math.min(planet.storageCap, planet.resources.ore + refund.ore);
  planet.resources.crystal = Math.min(planet.storageCap, planet.resources.crystal + refund.crystal);
  planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + refund.fuel);

  planet.terraformingQueue = null;
  return { refundedResources: refund };
}

/**
 * Ticks terraforming progress and applies completion if duration has elapsed
 */
export function tickTerraforming(
  planet: Planet,
  slot: PlanetSlot | undefined,
  nowMs: number
): { completed: boolean; targetBiome?: PlanetBiome } {
  if (!planet.terraformingQueue) return { completed: false };

  if (nowMs >= planet.terraformingQueue.finishTime) {
    const targetBiome = planet.terraformingQueue.targetBiome;
    planet.biome = targetBiome;
    if (slot) {
      slot.type = targetBiome;
    }
    planet.terraformingQueue = null;

    // If terraformed to gaia or terran, clear 1 natural blocker automatically as ecological bonus
    if ((targetBiome === 'gaia' || targetBiome === 'terran') && planet.blockers && planet.blockers.length > 0) {
      planet.blockers.shift();
    }

    return { completed: true, targetBiome };
  }

  return { completed: false };
}

/**
 * Validates whether a planetary decision can be enacted
 */
export function canEnactDecision(
  state: GameState,
  playerId: string,
  planetId: string,
  decisionId: PlanetaryDecisionId
): { canEnact: boolean; reason?: string; cost?: Resources } {
  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { canEnact: false, reason: 'Gezegen kontrolünüz altında değil.' };
  }

  const def = PLANETARY_DECISIONS[decisionId];
  if (!def) {
    return { canEnact: false, reason: 'Geçersiz gezegensel karar.' };
  }

  if (planet.activeDecisions?.some((d) => d.id === decisionId)) {
    return { canEnact: false, reason: 'Bu karar gezegende halihazırda yürürlükte.' };
  }

  if (
    planet.resources.ore < def.cost.ore ||
    planet.resources.crystal < def.cost.crystal ||
    planet.resources.fuel < def.cost.fuel
  ) {
    return { canEnact: false, reason: 'Yetersiz kaynak.', cost: def.cost };
  }

  return { canEnact: true, cost: def.cost };
}

/**
 * Enacts a planetary decision on a planet
 */
export function enactDecision(
  planet: Planet,
  decisionId: PlanetaryDecisionId,
  nowMs: number,
  state?: GameState,
  playerId?: string
): void {
  const def = PLANETARY_DECISIONS[decisionId];
  if (!def) return;

  planet.resources.ore -= def.cost.ore;
  planet.resources.crystal -= def.cost.crystal;
  planet.resources.fuel -= def.cost.fuel;

  if (!planet.activeDecisions) {
    planet.activeDecisions = [];
  }

  const expiresAt = def.durationMs ? nowMs + def.durationMs : undefined;
  planet.activeDecisions.push({
    id: decisionId,
    enactedAt: nowMs,
    expiresAt,
  });

  // Lump sum cultural unity reward
  if (def.unityReward && state?.traditions && playerId && state.traditions[playerId]) {
    state.traditions[playerId].unity += def.unityReward;
  }
}

/**
 * Ticks active decisions and purges expired timed boosters
 */
export function tickDecisions(planet: Planet, nowMs: number): PlanetaryDecisionId[] {
  if (!planet.activeDecisions || planet.activeDecisions.length === 0) return [];

  const expired: PlanetaryDecisionId[] = [];
  planet.activeDecisions = planet.activeDecisions.filter((d) => {
    if (d.expiresAt && nowMs >= d.expiresAt) {
      expired.push(d.id);
      return false;
    }
    return true;
  });

  return expired;
}

/**
 * Validates whether a blocker can be cleared
 */
export function canClearBlocker(
  state: GameState,
  playerId: string,
  planetId: string,
  blockerId: string
): { canClear: boolean; reason?: string; cost?: Resources; clearTimeMs?: number } {
  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== playerId) {
    return { canClear: false, reason: 'Gezegen kontrolünüz altında değil.' };
  }

  const blocker = planet.blockers?.find((b) => b.id === blockerId);
  if (!blocker) {
    return { canClear: false, reason: 'Engel bulunamadı.' };
  }

  if (blocker.clearing) {
    return { canClear: false, reason: 'Bu engel zaten temizleniyor.' };
  }

  const def = PLANETARY_BLOCKERS[blocker.type];
  if (!def) {
    return { canClear: false, reason: 'Engel tanımı eksik.' };
  }

  if (
    planet.resources.ore < def.cost.ore ||
    planet.resources.crystal < def.cost.crystal ||
    planet.resources.fuel < def.cost.fuel
  ) {
    return { canClear: false, reason: 'Yetersiz kaynak.', cost: def.cost };
  }

  return { canClear: true, cost: def.cost, clearTimeMs: def.clearTimeMs };
}

/**
 * Begins clearing a blocker on a planet
 */
export function startClearBlocker(planet: Planet, blockerId: string, nowMs: number): boolean {
  const blocker = planet.blockers?.find((b) => b.id === blockerId);
  if (!blocker || blocker.clearing) return false;

  const def = PLANETARY_BLOCKERS[blocker.type];
  if (!def) return false;

  planet.resources.ore -= def.cost.ore;
  planet.resources.crystal -= def.cost.crystal;
  planet.resources.fuel -= def.cost.fuel;

  blocker.clearing = {
    startTime: nowMs,
    finishTime: nowMs + def.clearTimeMs,
  };
  return true;
}

/**
 * Ticks blockers, cleans up finished ones, and deposits rewards
 */
export function tickBlockers(
  planet: Planet,
  nowMs: number
): { clearedBlockerIds: string[]; rewardResources: Resources } {
  if (!planet.blockers || planet.blockers.length === 0) {
    return { clearedBlockerIds: [], rewardResources: { ore: 0, crystal: 0, fuel: 0 } };
  }

  const clearedBlockerIds: string[] = [];
  const rewardTotal: Resources = { ore: 0, crystal: 0, fuel: 0 };

  planet.blockers = planet.blockers.filter((b) => {
    if (b.clearing && nowMs >= b.clearing.finishTime) {
      clearedBlockerIds.push(b.id);
      const def = PLANETARY_BLOCKERS[b.type];
      if (def) {
        rewardTotal.ore += def.reward.ore;
        rewardTotal.crystal += def.reward.crystal;
        rewardTotal.fuel += def.reward.fuel;
      }
      return false;
    }
    return true;
  });

  if (clearedBlockerIds.length > 0) {
    planet.resources.ore = Math.min(planet.storageCap, planet.resources.ore + rewardTotal.ore);
    planet.resources.crystal = Math.min(planet.storageCap, planet.resources.crystal + rewardTotal.crystal);
    planet.resources.fuel = Math.min(planet.storageCap, planet.resources.fuel + rewardTotal.fuel);
  }

  return { clearedBlockerIds, rewardResources: rewardTotal };
}

/**
 * Procedurally generates initial blockers for a given biome
 */
export function generateInitialBlockers(
  biome: PlanetBiome,
  prng?: { next: () => number }
): PlanetaryBlocker[] {
  const rnd = prng ? () => prng.next() : Math.random;
  const blockers: PlanetaryBlocker[] = [];

  const addBlocker = (type: PlanetaryBlockerId) => {
    blockers.push({
      id: `blk_${type}_${Math.floor(rnd() * 100000)}`,
      type,
      clearing: null,
    });
  };

  switch (biome) {
    case 'terran':
      addBlocker('dense_jungle');
      if (rnd() < 0.5) addBlocker('noxious_swamp');
      break;
    case 'ocean':
      addBlocker('noxious_swamp');
      break;
    case 'desert':
      addBlocker('volcanic_ash_wastes');
      if (rnd() < 0.4) addBlocker('radioactive_fallout');
      break;
    case 'ice':
      addBlocker('glacial_chasm');
      if (rnd() < 0.5) addBlocker('glacial_chasm');
      break;
    case 'volcanic':
      addBlocker('volcanic_ash_wastes');
      addBlocker('radioactive_fallout');
      break;
    case 'tomb':
      addBlocker('radioactive_fallout');
      addBlocker('volcanic_ash_wastes');
      break;
    default:
      break;
  }

  return blockers;
}
