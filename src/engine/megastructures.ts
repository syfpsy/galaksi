import {
  GameState,
  Gateway,
  Megastructure,
  MegastructureType,
  Resources,
} from './types';

export interface MegastructureStageConfig {
  stage: number;
  nameTr: string;
  nameEn: string;
  cost: Resources;
  buildTimeMs: number;
  descriptionTr: string;
  hegemonyPointsReward: number;
}

export interface MegastructureDef {
  type: MegastructureType;
  nameTr: string;
  nameEn: string;
  shortDescTr: string;
  icon: string;
  accentColor: string;
  stages: MegastructureStageConfig[];
}

export const GATEWAY_CONFIG = {
  CONSTRUCTION_COST: { ore: 1500, crystal: 1200, fuel: 600 } as Resources,
  CONSTRUCTION_TIME_MS: 45_000,
  ACTIVATION_COST: { ore: 800, crystal: 1000, fuel: 400 } as Resources,
  ACTIVATION_TIME_MS: 25_000,
  GATEWAY_JUMP_DURATION_MS: 15_000, // 15 seconds flat transit duration
  GATEWAY_JUMP_FUEL_COST: 50,       // Fixed nominal fuel jump cost
  GATEWAY_HEGEMONY_REWARD: 35,      // Hegemony points upon gateway activation
};

export const MEGASTRUCTURE_CONFIGS: Record<MegastructureType, MegastructureDef> = {
  dyson_swarm: {
    type: 'dyson_swarm',
    nameTr: 'Dyson Küresi Parçacığı',
    nameEn: 'Dyson Swarm Array',
    shortDescTr: 'Yıldızın çekirdek ışımasını doğrudan toplayan devasa fotovoltaik enerji ağı.',
    icon: '☀️',
    accentColor: '#f59e0b',
    stages: [
      {
        stage: 1,
        nameTr: 'Aşama I: Yörünge Enerji Çerçevesi',
        nameEn: 'Stage I: Orbital Energy Frame',
        cost: { ore: 1500, crystal: 1000, fuel: 400 },
        buildTimeMs: 40_000,
        descriptionTr: 'Yıldız yörüngesine temel toplayıcı iskele kurulur. (+150 Cevher, +150 Kristal, +250 Yakıt/saat)',
        hegemonyPointsReward: 25,
      },
      {
        stage: 2,
        nameTr: 'Aşama II: Fotovoltaik Panel Halkası',
        nameEn: 'Stage II: Photovoltaic Panel Ring',
        cost: { ore: 2500, crystal: 2000, fuel: 800 },
        buildTimeMs: 65_000,
        descriptionTr: 'Yıldızın yarısını çevreleyen toplayıcı halka. (+350 Cevher, +350 Kristal, +600 Yakıt/saat)',
        hegemonyPointsReward: 50,
      },
      {
        stage: 3,
        nameTr: 'Aşama III: Tam Donanımlı Dyson Küresi',
        nameEn: 'Stage III: Complete Dyson Swarm',
        cost: { ore: 4000, crystal: 3500, fuel: 1500 },
        buildTimeMs: 90_000,
        descriptionTr: 'Sınırsız yıldız enerjisi emilimi. (+600 Cevher, +800 Kristal, +1200 Yakıt/saat)',
        hegemonyPointsReward: 75,
      },
    ],
  },
  science_nexus: {
    type: 'science_nexus',
    nameTr: 'Bilim Dizisi',
    nameEn: 'Science Nexus Array',
    shortDescTr: 'Alt-uzay kuantum hesaplama çekirdeği ile galaktik teknolojik üstünlük.',
    icon: '🔬',
    accentColor: '#38bdf8',
    stages: [
      {
        stage: 1,
        nameTr: 'Aşama I: Kuantum İşlemci Göbeği',
        nameEn: 'Stage I: Quantum Core',
        cost: { ore: 1200, crystal: 1500, fuel: 500 },
        buildTimeMs: 40_000,
        descriptionTr: 'Merkezi süperiletken çekirdek. (+%10 Araştırma Hızı, +1 Sensör Görüş Menzili)',
        hegemonyPointsReward: 25,
      },
      {
        stage: 2,
        nameTr: 'Aşama II: Alt-Uzay Veri Düğümleri',
        nameEn: 'Stage II: Subspace Data Nodes',
        cost: { ore: 2000, crystal: 2800, fuel: 1000 },
        buildTimeMs: 65_000,
        descriptionTr: 'Gelişmiş analitik laboratuvarlar. (+%20 Araştırma Hızı, +1 Sensör Görüş Menzili)',
        hegemonyPointsReward: 50,
      },
      {
        stage: 3,
        nameTr: 'Aşama III: Galaktik Nöral Arşiv',
        nameEn: 'Stage III: Galactic Neural Archive',
        cost: { ore: 3200, crystal: 4500, fuel: 1800 },
        buildTimeMs: 90_000,
        descriptionTr: 'Mutlak teknolojik aydınlanma. (+%35 Araştırma Hızı, +2 Sensör Görüş Menzili)',
        hegemonyPointsReward: 75,
      },
    ],
  },
  mega_shipyard: {
    type: 'mega_shipyard',
    nameTr: 'Mega Tersane Kompleksi',
    nameEn: 'Mega Shipyard Complex',
    shortDescTr: 'Aynı anda birden fazla armadayı monte edebilen devasa orbital üretim halkası.',
    icon: '🏭',
    accentColor: '#ef4444',
    stages: [
      {
        stage: 1,
        nameTr: 'Aşama I: Ağır İskele Havuzu',
        nameEn: 'Stage I: Heavy Dock Basin',
        cost: { ore: 2000, crystal: 1000, fuel: 600 },
        buildTimeMs: 40_000,
        descriptionTr: 'Modüler tersane iskeleleri. (-%15 Gemi İnşa Süresi)',
        hegemonyPointsReward: 25,
      },
      {
        stage: 2,
        nameTr: 'Aşama II: Çoklu Montaj Hatları',
        nameEn: 'Stage II: Multi-Assembly Lines',
        cost: { ore: 3500, crystal: 1800, fuel: 1000 },
        buildTimeMs: 65_000,
        descriptionTr: 'Otomasyonlu zırh montaj bantları. (-%25 Gemi İnşa Süresi, Donanmaya +%10 Gövde Zırhı)',
        hegemonyPointsReward: 50,
      },
      {
        stage: 3,
        nameTr: 'Aşama III: Galaktik Armada Dokları',
        nameEn: 'Stage III: Galactic Armada Docks',
        cost: { ore: 5000, crystal: 3000, fuel: 1800 },
        buildTimeMs: 90_000,
        descriptionTr: 'Eksiksiz endüstriyel savaş makinesi. (-%35 Gemi İnşa Süresi, +%15 Gövde Zırhı, +%10 Ateş Gücü)',
        hegemonyPointsReward: 75,
      },
    ],
  },
  sentry_array: {
    type: 'sentry_array',
    nameTr: 'Sensör Küresi',
    nameEn: 'Sentry Array Observatory',
    shortDescTr: 'Tüm galaksideki alt-uzay dalgalanmalarını ve filo manevralarını izleyen gözetleme küresi.',
    icon: '👁️',
    accentColor: '#10b981',
    stages: [
      {
        stage: 1,
        nameTr: 'Aşama I: Taşikron Alıcı Çanağı',
        nameEn: 'Stage I: Tachyon Dish',
        cost: { ore: 1500, crystal: 1500, fuel: 500 },
        buildTimeMs: 40_000,
        descriptionTr: 'Derin uzay dinleme istasyonu. (+2 Sistem Görüş Menzili)',
        hegemonyPointsReward: 25,
      },
      {
        stage: 2,
        nameTr: 'Aşama II: Hiperuzay Tarama Kümesi',
        nameEn: 'Stage II: Hyperspace Radar Cluster',
        cost: { ore: 2800, crystal: 2800, fuel: 1000 },
        buildTimeMs: 65_000,
        descriptionTr: 'Geniş spektrumlu radar matrisi. (+4 Sistem Görüş Menzili)',
        hegemonyPointsReward: 50,
      },
      {
        stage: 3,
        nameTr: 'Aşama III: Tam Spektrum Gözlem Küresi',
        nameEn: 'Stage III: Full Spectrum Array',
        cost: { ore: 4200, crystal: 4500, fuel: 2000 },
        buildTimeMs: 90_000,
        descriptionTr: 'Tüm galaksideki Savaş Sisi (Fog of War) tamamen kalkar; tüm sistemler ve filolar görünür olur!',
        hegemonyPointsReward: 75,
      },
    ],
  },
};

export interface PlayerMegastructureBonuses {
  passiveHourlyResources: Resources;
  researchSpeedMultiplier: number; // e.g. 1.35 for +35% research speed
  shipBuildSpeedMultiplier: number; // e.g. 1.35 for -35% duration
  shipBonusHullPercent: number;     // e.g. 0.15 for +15%
  shipBonusAttackPercent: number;   // e.g. 0.10 for +10%
  hasFullGalaxyVision: boolean;     // Sentry Array Stage 3
  additionalSensorHops: number;     // Bonus vision hops
  activeGatewaysCount: number;
}

/**
 * Computes all cumulative empire-wide passive bonuses from owned megastructures
 */
export function getPlayerMegastructureBonuses(
  state: GameState,
  playerId: string
): PlayerMegastructureBonuses {
  const bonuses: PlayerMegastructureBonuses = {
    passiveHourlyResources: { ore: 0, crystal: 0, fuel: 0 },
    researchSpeedMultiplier: 1.0,
    shipBuildSpeedMultiplier: 1.0,
    shipBonusHullPercent: 0,
    shipBonusAttackPercent: 0,
    hasFullGalaxyVision: false,
    additionalSensorHops: 0,
    activeGatewaysCount: 0,
  };

  if (state.megastructures) {
    for (const mega of Object.values(state.megastructures)) {
      if (mega.ownerId !== playerId) continue;

      // Only completed stages yield bonuses
      const effectiveStage = mega.stage;
      if (effectiveStage <= 0) continue;

      switch (mega.type) {
        case 'dyson_swarm': {
          if (effectiveStage >= 3) {
            bonuses.passiveHourlyResources.ore += 600;
            bonuses.passiveHourlyResources.crystal += 800;
            bonuses.passiveHourlyResources.fuel += 1200;
          } else if (effectiveStage >= 2) {
            bonuses.passiveHourlyResources.ore += 350;
            bonuses.passiveHourlyResources.crystal += 350;
            bonuses.passiveHourlyResources.fuel += 600;
          } else if (effectiveStage >= 1) {
            bonuses.passiveHourlyResources.ore += 150;
            bonuses.passiveHourlyResources.crystal += 150;
            bonuses.passiveHourlyResources.fuel += 250;
          }
          break;
        }

        case 'science_nexus': {
          if (effectiveStage >= 3) {
            bonuses.researchSpeedMultiplier += 0.35;
            bonuses.additionalSensorHops += 2;
          } else if (effectiveStage >= 2) {
            bonuses.researchSpeedMultiplier += 0.20;
            bonuses.additionalSensorHops += 1;
          } else if (effectiveStage >= 1) {
            bonuses.researchSpeedMultiplier += 0.10;
            bonuses.additionalSensorHops += 1;
          }
          break;
        }

        case 'mega_shipyard': {
          if (effectiveStage >= 3) {
            bonuses.shipBuildSpeedMultiplier += 0.35;
            bonuses.shipBonusHullPercent += 0.15;
            bonuses.shipBonusAttackPercent += 0.10;
          } else if (effectiveStage >= 2) {
            bonuses.shipBuildSpeedMultiplier += 0.25;
            bonuses.shipBonusHullPercent += 0.10;
          } else if (effectiveStage >= 1) {
            bonuses.shipBuildSpeedMultiplier += 0.15;
          }
          break;
        }

        case 'sentry_array': {
          if (effectiveStage >= 3) {
            bonuses.hasFullGalaxyVision = true;
          } else if (effectiveStage >= 2) {
            bonuses.additionalSensorHops += 4;
          } else if (effectiveStage >= 1) {
            bonuses.additionalSensorHops += 2;
          }
          break;
        }
      }
    }
  }

  if (state.gateways) {
    for (const gw of Object.values(state.gateways)) {
      if (gw.ownerId === playerId && gw.status === 'active') {
        bonuses.activeGatewaysCount++;
      }
    }
  }

  return bonuses;
}

/**
 * Validates whether a player can construct a new Megastructure in a target system
 */
export function canBuildMegastructure(
  state: GameState,
  systemId: string,
  playerId: string,
  type: MegastructureType
): { canBuild: boolean; reason?: string } {
  const system = state.map.systems[systemId];
  if (!system) {
    return { canBuild: false, reason: 'Sistem bulunamadı.' };
  }

  // Megastructures can only be constructed in systems where the player owns at least one planet or starbase
  const ownsPlanet = Object.values(state.planets).some(
    (p) => p.systemId === systemId && p.ownerId === playerId
  );
  const ownsStarbase = state.starbases?.[systemId]?.ownerId === playerId;
  if (!ownsPlanet && !ownsStarbase) {
    return {
      canBuild: false,
      reason: 'Mega Yapı inşası için sistemde bir koloniniz veya Yıldız Üssünüz bulunmalıdır.',
    };
  }

  // Only 1 megastructure per system
  if (state.megastructures) {
    const existingInSys = Object.values(state.megastructures).find((m) => m.systemId === systemId);
    if (existingInSys) {
      return {
        canBuild: false,
        reason: 'Bu sistemde zaten bir Mega Yapı inşaatı veya tesisi bulunmaktadır.',
      };
    }

    // Only 1 of each megastructure type per empire
    const existingOfType = Object.values(state.megastructures).find(
      (m) => m.ownerId === playerId && m.type === type
    );
    if (existingOfType) {
      return {
        canBuild: false,
        reason: `İmparatorluğunuzda zaten bir ${MEGASTRUCTURE_CONFIGS[type].nameTr} mevcuttur.`,
      };
    }
  }

  return { canBuild: true };
}

/**
 * Checks if a player has an active gateway in the specified system
 */
export function hasActiveGateway(state: GameState, systemId: string, playerId: string): boolean {
  const gw = state.gateways?.[systemId];
  if (!gw || gw.status !== 'active') return false;
  // A gateway is accessible if owned by player or unowned neutral
  return gw.ownerId === playerId || gw.ownerId === null;
}
