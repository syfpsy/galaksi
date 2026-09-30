import { DEFENSE_STATS, GAME_CONSTANTS, SHIP_STATS } from './constants';
import { PRNG } from './prng';
import { DefenseStructureType, Resources, ShipType, StarSystem } from './types';

export type PirateThreatLevel = 'low' | 'medium' | 'high' | 'deadly';

export interface PirateOutpost {
  id: string;
  systemId: string;
  systemName: string;
  name: string;
  threatLevel: PirateThreatLevel;
  garrison: Record<ShipType, number>;
  defenses: Record<DefenseStructureType, number>;
  bountyReward: Resources;
  xpReward: number;
  descriptionTr: string;
  claimed: boolean;
  claimedByPlayerId?: string;
  claimedAtTime?: number;
}

const PIRATE_CLAN_NAMES = [
  'Kızıl Kafatası Korsanları',
  'Demir Pençe Yağmacıları',
  'Kozmik Akbaba Çetesi',
  'Hiperuzay Haydutları',
  'Gölge Nebula Sığınağı',
  'Kara Yıldız Lejyonu',
];

const PIRATE_BASE_NAMES = [
  'Korsan Asteroid Sığınağı',
  'Kaçakçı Maden Barınağı',
  'Terk Edilmiş Savunma İstasyonu',
  'Haydut Gözetleme Üssü',
  'Karanlık Boşluk Yuvası',
];

/**
 * Procedurally generates pirate outposts across non-relay star systems
 */
export function generatePirateOutposts(
  systems: Record<string, StarSystem>,
  seed: number = 777
): Record<string, PirateOutpost> {
  const prng = new PRNG(seed);
  const outposts: Record<string, PirateOutpost> = {};

  const candidateSystems = Object.values(systems).filter(
    (s) => !s.hasRelay && s.id !== 'sys_relay'
  );

  const shuffledSystems = prng.shuffle(candidateSystems);
  const outpostCount = Math.min(4, shuffledSystems.length);

  const threatLevels: PirateThreatLevel[] = ['low', 'medium', 'high', 'deadly'];

  for (let i = 0; i < outpostCount; i++) {
    const sys = shuffledSystems[i];
    const threat = threatLevels[i % threatLevels.length];
    const clanName = PIRATE_CLAN_NAMES[i % PIRATE_CLAN_NAMES.length];
    const baseName = PIRATE_BASE_NAMES[i % PIRATE_BASE_NAMES.length];

    // Garrison and defenses scaled to threat
    let garrison: Record<ShipType, number>;
    let defenses: Record<DefenseStructureType, number>;
    let bountyReward: Resources;
    let xpReward: number;

    if (threat === 'low') {
      garrison = { scout: 2, transport: 1, fighter: 3, battleship: 0 };
      defenses = { missile_battery: 2, plasma_turret: 0, ion_cannon: 0 };
      bountyReward = { ore: 800, crystal: 500, fuel: 300 };
      xpReward = 120;
    } else if (threat === 'medium') {
      garrison = { scout: 3, transport: 2, fighter: 6, battleship: 1 };
      defenses = { missile_battery: 3, plasma_turret: 2, ion_cannon: 0 };
      bountyReward = { ore: 1600, crystal: 1100, fuel: 650 };
      xpReward = 220;
    } else if (threat === 'high') {
      garrison = { scout: 4, transport: 2, fighter: 10, battleship: 2 };
      defenses = { missile_battery: 5, plasma_turret: 3, ion_cannon: 1 };
      bountyReward = { ore: 2800, crystal: 1900, fuel: 1100 };
      xpReward = 350;
    } else {
      // Deadly
      garrison = { scout: 5, transport: 3, fighter: 16, battleship: 4 };
      defenses = { missile_battery: 8, plasma_turret: 5, ion_cannon: 3 };
      bountyReward = { ore: 4500, crystal: 3200, fuel: 1800 };
      xpReward = 500;
    }

    const outpostId = `pirate_${sys.id}`;
    outposts[outpostId] = {
      id: outpostId,
      systemId: sys.id,
      systemName: sys.name,
      name: `[${clanName}] ${baseName}`,
      threatLevel: threat,
      garrison,
      defenses,
      bountyReward,
      xpReward,
      descriptionTr: `${sys.name} sisteminde konuşlanmış ${clanName} üssü. Civardaki maden konvoylarına baskınlar düzenliyor. İmha eden komutana yüksek galaktik ödül verilir.`,
      claimed: false,
    };

    // Attach to system POI if empty
    if (!sys.poi) {
      sys.poi = {
        id: `poi_${outpostId}`,
        type: 'pirate_lair',
        explored: false,
        reward: bountyReward,
        bounty: {
          titleTr: `${clanName} Tehdidi`,
          threatLevel: threat,
          pirateGarrison: garrison,
          rewardXP: xpReward,
          claimed: false,
        },
      };
    }
  }

  return outposts;
}

const STORAGE_KEY = 'galaksi_pirate_outposts';

export function loadSavedPirates(): Record<string, PirateOutpost> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePirates(pirates: Record<string, PirateOutpost>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pirates));
  } catch {}
}
