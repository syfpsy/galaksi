import { BreakthroughId, Player } from './types';

export interface BreakthroughDef {
  id: BreakthroughId;
  nameTr: string;
  descTr: string;
  icon: string;
  category: 'fleet' | 'economy' | 'science' | 'military';
  speedBonusPercent?: number;
  productionBonusPercent?: number;
  combatBonusPercent?: number;
  shipBuildTimeReductionPercent?: number;
  autoSupplyBonusPercent?: number;
  relayPointBonusPercent?: number;
}

export const BREAKTHROUGH_CONFIGS: Record<BreakthroughId, BreakthroughDef> = {
  breakthrough_quantum_hyperdrive: {
    id: 'breakthrough_quantum_hyperdrive',
    nameTr: 'Kuantum Hiper-Tahrik',
    descTr: 'Hiperuzay koridorlarında kuantum dalgalanması yaratarak tüm filoların intikal hızını +%25 artırır.',
    icon: '⚡',
    category: 'fleet',
    speedBonusPercent: 25,
  },
  breakthrough_tachyon_sensors: {
    id: 'breakthrough_tachyon_sensors',
    nameTr: 'Takyon Matris Sensörleri',
    descTr: 'Derin uzay tarama menzilini 1 sektör genişletir ve komşu sistemlerdeki filo hareketlerini netleştirir.',
    icon: '📡',
    category: 'science',
  },
  breakthrough_deep_core_extractors: {
    id: 'breakthrough_deep_core_extractors',
    nameTr: 'Derin Çekirdek Sondajı',
    descTr: 'Gezegen kabuğunun derinliklerindeki zengin damarları işleyerek tüm imparatorlukta maden üretimini +%20 artırır.',
    icon: '⛏️',
    category: 'economy',
    productionBonusPercent: 20,
  },
  breakthrough_antimatter_reactors: {
    id: 'breakthrough_antimatter_reactors',
    nameTr: 'Antimadde Füzyon Reaktörleri',
    descTr: 'Gemilerin ve üslerin enerji verimliliğini yükseltir, yakıt üretimini +%25 artırır.',
    icon: '🔋',
    category: 'economy',
    productionBonusPercent: 25,
  },
  breakthrough_nanite_shipyards: {
    id: 'breakthrough_nanite_shipyards',
    nameTr: 'Nanit Montaj Tersaneleri',
    descTr: 'Tersanelerdeki gövde montajını moleküler nanitlerle hızlandırarak gemi inşa süresini -%30 kısaltır.',
    icon: '🛠️',
    category: 'military',
    shipBuildTimeReductionPercent: 30,
  },
  breakthrough_psionic_relay: {
    id: 'breakthrough_psionic_relay',
    nameTr: 'Zihinsel İletim Rölesi',
    descTr: 'Merkezi Röle İstasyonunu psiyonik rezonansla besleyerek kontrol süresince kazanılan Hegemonya Puanını +%50 artırır.',
    icon: '🔮',
    category: 'science',
    relayPointBonusPercent: 50,
  },
  breakthrough_automated_freighters: {
    id: 'breakthrough_automated_freighters',
    nameTr: 'Otonom Kargo Freygatları',
    descTr: 'Otomatik ikmal kanallarının transfer partisi kapasitesini +%100 artırarak hammadde akışını ikiye katlar.',
    icon: '🚛',
    category: 'economy',
    autoSupplyBonusPercent: 100,
  },
  breakthrough_plasma_overcharge: {
    id: 'breakthrough_plasma_overcharge',
    nameTr: 'Plazma Aşırı Yükleme',
    descTr: 'Taarruz gemilerinin plazma kanonlarını güçlendirerek uzay ve yörünge muharebelerinde +%20 ek hasar sağlar.',
    icon: '💥',
    category: 'military',
    combatBonusPercent: 20,
  },
};

export const ALL_BREAKTHROUGH_IDS: BreakthroughId[] = Object.keys(
  BREAKTHROUGH_CONFIGS
) as BreakthroughId[];

/**
 * Rolls up to 3 random unchosen breakthroughs for the player.
 */
export function rollBreakthroughChoices(unlocked: BreakthroughId[] = []): BreakthroughId[] {
  const unlockedSet = new Set(unlocked);
  const pool = ALL_BREAKTHROUGH_IDS.filter((id) => !unlockedSet.has(id));
  if (pool.length <= 3) return pool;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export function hasBreakthrough(player: Player | undefined, id: BreakthroughId): boolean {
  if (!player?.unlockedBreakthroughs) return false;
  return player.unlockedBreakthroughs.includes(id);
}

export function getBreakthroughSpeedMultiplier(player?: Player): number {
  if (hasBreakthrough(player, 'breakthrough_quantum_hyperdrive')) {
    return 1.25;
  }
  return 1.0;
}

export function getBreakthroughProductionMultiplier(player?: Player): number {
  let mult = 1.0;
  if (hasBreakthrough(player, 'breakthrough_deep_core_extractors')) {
    mult += 0.2;
  }
  if (hasBreakthrough(player, 'breakthrough_antimatter_reactors')) {
    mult += 0.25;
  }
  return mult;
}

export function getBreakthroughCombatMultiplier(player?: Player): number {
  if (hasBreakthrough(player, 'breakthrough_plasma_overcharge')) {
    return 1.2;
  }
  return 1.0;
}

export function getBreakthroughShipBuildTimeMultiplier(player?: Player): number {
  if (hasBreakthrough(player, 'breakthrough_nanite_shipyards')) {
    return 0.7; // 30% reduction
  }
  return 1.0;
}

export function getBreakthroughAutoSupplyCapacityMultiplier(player?: Player): number {
  if (hasBreakthrough(player, 'breakthrough_automated_freighters')) {
    return 2.0; // +100% capacity
  }
  return 1.0;
}
