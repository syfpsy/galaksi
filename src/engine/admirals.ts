import { Admiral, AdmiralTraitId, ShipType } from './types';
export type { Admiral, AdmiralTraitId };

export interface AdmiralTraitDefinition {
  id: AdmiralTraitId;
  nameTr: string;
  icon: string;
  badgeColor: string;
  descriptionTr: string;
  combatBonusDescriptionTr: string;
  attackMultiplier: number;
  defenseDamageReduction: number;
  critChance: number;
  speedMultiplier: number;
  fuelDiscount: number;
  salvageMultiplier: number;
}

export const ADMIRAL_TRAITS: Record<AdmiralTraitId, AdmiralTraitDefinition> = {
  tactical_genius: {
    id: 'tactical_genius',
    nameTr: 'Taktik Deha',
    icon: '⚡',
    badgeColor: '#f59e0b',
    descriptionTr: 'Filo ateş hatlarını kusursuz koordine ederek düşman zayıf noktalarına yoğunlaştırır.',
    combatBonusDescriptionTr: '+%15 Ekstra Ateş Gücü ve %15 Kritik Darbe Şansı',
    attackMultiplier: 1.15,
    defenseDamageReduction: 0.0,
    critChance: 0.15,
    speedMultiplier: 1.0,
    fuelDiscount: 0.0,
    salvageMultiplier: 1.0,
  },
  iron_discipline: {
    id: 'iron_discipline',
    nameTr: 'Çelik Disiplin',
    icon: '🛡️',
    badgeColor: '#06b6d4',
    descriptionTr: 'Ağır düşman yaylım ateşi altında filonun zırh ve kalkan bütünlüğünü en üst seviyede tutar.',
    combatBonusDescriptionTr: 'Düşman ateşinden alınan hasarda -%15 Doğrudan Azalma',
    attackMultiplier: 1.0,
    defenseDamageReduction: 0.15,
    critChance: 0.0,
    speedMultiplier: 1.0,
    fuelDiscount: 0.0,
    salvageMultiplier: 1.0,
  },
  evasion_master: {
    id: 'evasion_master',
    nameTr: 'Kaçınma Virtüözü',
    icon: '💨',
    badgeColor: '#10b981',
    descriptionTr: 'Çevik filo manevraları ve sahte rota sinyalleriyle düşman torpidolarından sıyrılır.',
    combatBonusDescriptionTr: '+%20 Kaçınma Manevrası ve Ağır Mermileri Iskalatma',
    attackMultiplier: 1.0,
    defenseDamageReduction: 0.12,
    critChance: 0.05,
    speedMultiplier: 1.10,
    fuelDiscount: 0.0,
    salvageMultiplier: 1.0,
  },
  siege_breaker: {
    id: 'siege_breaker',
    nameTr: 'Kuşatma Kırıcı',
    icon: '☄️',
    badgeColor: '#ef4444',
    descriptionTr: 'Müstahkem gezegen garnizonlarına ve Nexus Rölesi savunma hatlarına taarruzda uzmandır.',
    combatBonusDescriptionTr: 'Gezegen Baskını & Röle Savaşlarında +%25 Ekstra Yıkım Gücü',
    attackMultiplier: 1.25,
    defenseDamageReduction: 0.0,
    critChance: 0.10,
    speedMultiplier: 1.0,
    fuelDiscount: 0.0,
    salvageMultiplier: 1.0,
  },
  fleet_logistician: {
    id: 'fleet_logistician',
    nameTr: 'Yıldızlararası Lojistikçi',
    icon: '🚀',
    badgeColor: '#a855f7',
    descriptionTr: 'Hiper-uzay atlama rotalarını yakıt tasarruflu ve yüksek ivmeli sevk eder.',
    combatBonusDescriptionTr: '+%20 Filo Seyir Hızı ve -%25 Yakıt Tüketimi',
    attackMultiplier: 1.05,
    defenseDamageReduction: 0.05,
    critChance: 0.0,
    speedMultiplier: 1.20,
    fuelDiscount: 0.25,
    salvageMultiplier: 1.10,
  },
  debris_scavenger: {
    id: 'debris_scavenger',
    nameTr: 'Enkaz Yağmacısı',
    icon: '🧲',
    badgeColor: '#eab308',
    descriptionTr: 'Muharebe alanında parçalanan düşman gemilerini derhal tarayarak hammaddeye dönüştürür.',
    combatBonusDescriptionTr: '+%35 Ekstra Enkaz Kurtarma ve Yağma Kapasitesi',
    attackMultiplier: 1.05,
    defenseDamageReduction: 0.0,
    critChance: 0.0,
    speedMultiplier: 1.05,
    fuelDiscount: 0.0,
    salvageMultiplier: 1.35,
  },
};

const XP_LEVEL_THRESHOLDS = [0, 200, 500, 950, 1500];

export function getXPThresholdForLevel(level: number): number {
  if (level <= 1) return XP_LEVEL_THRESHOLDS[1];
  if (level >= 5) return 999999;
  return XP_LEVEL_THRESHOLDS[level];
}

export function addAdmiralXP(
  admiral: Admiral,
  xpToAdd: number
): { admiral: Admiral; leveledUp: boolean } {
  let newXP = admiral.xp + xpToAdd;
  let newLevel = admiral.level;
  let leveledUp = false;

  while (newLevel < 5 && newXP >= getXPThresholdForLevel(newLevel)) {
    newLevel++;
    leveledUp = true;
  }

  return {
    admiral: {
      ...admiral,
      level: newLevel,
      xp: newXP,
      xpToNextLevel: getXPThresholdForLevel(newLevel),
    },
    leveledUp,
  };
}

export const STARTER_ADMIRALS: Admiral[] = [
  {
    id: 'admiral_valerius',
    name: 'Kaelen Valerius',
    title: 'Filo Amirali',
    avatar: '👨‍✈️',
    level: 2,
    xp: 240,
    xpToNextLevel: 500,
    traitId: 'tactical_genius',
    assignedFleetId: null,
    assignedPlanetId: null,
    battlesWon: 3,
    battlesLost: 0,
    recruitedAt: 1000,
  },
  {
    id: 'admiral_solari',
    name: 'Lyra Solari',
    title: 'Kıdemli Taktik Komutanı',
    avatar: '👩‍✈️',
    level: 1,
    xp: 60,
    xpToNextLevel: 200,
    traitId: 'iron_discipline',
    assignedFleetId: null,
    assignedPlanetId: null,
    battlesWon: 1,
    battlesLost: 0,
    recruitedAt: 1000,
  },
  {
    id: 'admiral_orion',
    name: 'Darek Voss',
    title: 'Hızlı Müdahale Komodoru',
    avatar: '🧑‍🚀',
    level: 1,
    xp: 120,
    xpToNextLevel: 200,
    traitId: 'evasion_master',
    assignedFleetId: null,
    assignedPlanetId: null,
    battlesWon: 2,
    battlesLost: 1,
    recruitedAt: 1000,
  },
];

const ADMIRAL_NAMES_POOL = [
  'Aurelius Vance',
  'Cassian Drake',
  'Thalor Karr',
  'Zarek Thorne',
  'Vespera Cruz',
  'Mira Sterling',
  'Seraphina Rayne',
  'Kaelen Voss',
  'Dmitri Ronen',
  'Nyx Astralis',
];

const ADMIRAL_TITLES_POOL = [
  'Filo Amirali',
  'Yıldız Komodoru',
  'Taktik Operasyon Şefi',
  'Önleme Filosu Generali',
  'Savunma Muhafız Lideri',
];

const AVATAR_POOL = ['👨‍✈️', '👩‍✈️', '🧑‍🚀', '🎖️', '🦅', '⚔️'];

export function generateCandidateAdmiral(): Admiral {
  const name = ADMIRAL_NAMES_POOL[Math.floor(Math.random() * ADMIRAL_NAMES_POOL.length)];
  const title = ADMIRAL_TITLES_POOL[Math.floor(Math.random() * ADMIRAL_TITLES_POOL.length)];
  const avatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
  const traits = Object.keys(ADMIRAL_TRAITS) as AdmiralTraitId[];
  const traitId = traits[Math.floor(Math.random() * traits.length)];

  return {
    id: `admiral_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name,
    title,
    avatar,
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    traitId,
    assignedFleetId: null,
    assignedPlanetId: null,
    battlesWon: 0,
    battlesLost: 0,
    recruitedAt: Date.now(),
  };
}

const STORAGE_KEY = 'galaksi_player_admirals';

export function loadSavedAdmirals(): Admiral[] {
  if (typeof window === 'undefined') return STARTER_ADMIRALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STARTER_ADMIRALS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return STARTER_ADMIRALS;
  } catch {
    return STARTER_ADMIRALS;
  }
}

export function saveAdmirals(admirals: Admiral[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admirals));
  } catch {}
}
