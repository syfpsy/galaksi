import { EmpireDirective, EmpireDirectiveId, GameState } from './types';

export interface DirectiveDefinition {
  id: EmpireDirectiveId;
  phase: number;
  title: string;
  description: string;
  targetValue: number;
  reward: {
    ore?: number;
    crystal?: number;
    fuel?: number;
    hegemonyPoints?: number;
    admiralXp?: number;
  };
}

export const DIRECTIVE_DEFINITIONS: DirectiveDefinition[] = [
  {
    id: 'scout_unknown',
    phase: 1,
    title: 'Sektör Keşfi',
    description: 'Bilinmeyen en az 2 yıldız sistemine keşif sondası göndererek haritalandırın.',
    targetValue: 2,
    reward: { ore: 300, crystal: 150, fuel: 100 },
  },
  {
    id: 'upgrade_mine',
    phase: 1,
    title: 'Sanayi Altyapısı',
    description: 'Ana dünyanızdaki Cevher Ocağını Seviye 2 veya üzerine yükseltin.',
    targetValue: 2,
    reward: { ore: 200, crystal: 100, fuel: 200 },
  },
  {
    id: 'build_fleet',
    phase: 1,
    title: 'Yıldız Donanması',
    description: 'İmparatorluk genelinde en az 5 aktif uzay gemisine (avcı, nakliye, kruvazör) ulaşın.',
    targetValue: 5,
    reward: { ore: 350, crystal: 200, fuel: 100 },
  },
  {
    id: 'found_colony',
    phase: 1,
    title: 'Yeni Vatan',
    description: 'Bir Ağır Nakliye ve koloni malzemeleri sevk ederek sektörde ilk koloninizi kurun.',
    targetValue: 2, // homeworld + 1 colony = 2 planets
    reward: { ore: 500, crystal: 300, fuel: 200, hegemonyPoints: 30 },
  },
  {
    id: 'assign_admiral',
    phase: 2,
    title: 'Yüksek Komuta',
    description: 'Bir filo amiralini bir taarruz/savunma filosuna veya gezegen üssüne atayın.',
    targetValue: 1,
    reward: { admiralXp: 100, hegemonyPoints: 30 },
  },
  {
    id: 'build_defense',
    phase: 2,
    title: 'Gezegensel Hisar',
    description: 'Kolonilerinizden birine en az 1 adet Savunma Bataryası inşa edin.',
    targetValue: 1,
    reward: { ore: 400, crystal: 250, hegemonyPoints: 25 },
  },
  {
    id: 'diplomatic_deal',
    phase: 2,
    title: 'Yıldızlararası Diplomasi',
    description: 'Rakip bir imparatorlukla barış paktı imzalayın veya bir müttefik ittifakına katılın.',
    targetValue: 1,
    reward: { hegemonyPoints: 40 },
  },
  {
    id: 'win_combat',
    phase: 2,
    title: 'Korsan ve Muharebe Zaferi',
    description: 'Bir korsan sığınağını imha edin veya filolar arası bir uzay muharebesini kazanın.',
    targetValue: 1,
    reward: { ore: 600, crystal: 400, hegemonyPoints: 50 },
  },
  {
    id: 'relay_control',
    phase: 3,
    title: 'Nexus Hakimiyeti',
    description: 'Merkezi Nexus Rölesini ele geçirin veya en az 10 kontrol puanı biriktirin.',
    targetValue: 10,
    reward: { hegemonyPoints: 75 },
  },
  {
    id: 'superpower',
    phase: 3,
    title: 'Galaktik Süper Güç',
    description: '3 kolonize gezegene ve en az 8 muharip savaş gemisine (avcı veya savaş gemisi) ulaşın.',
    targetValue: 3,
    reward: { hegemonyPoints: 100 },
  },
  {
    id: 'supply_chain_resonance',
    phase: 2,
    title: 'Tri-Sektör Rezonansı',
    description: 'Farklı rollere sahip 3 koloninizi (Maden, Sanayi, Bilim) hiperuzay hatlarıyla birbirine bağlayarak Tri-Sektör Rezonansını başlatın.',
    targetValue: 1,
    reward: { ore: 500, crystal: 500, fuel: 300, hegemonyPoints: 60 },
  },
  {
    id: 'golden_surge_trigger',
    phase: 3,
    title: 'Galaktik Altın Çağ',
    description: '100 Stratejik Momentuma ulaşarak imparatorluğunuzda 90 saniyelik Altın Çağ patlamasını tetikleyin.',
    targetValue: 1,
    reward: { ore: 600, crystal: 400, fuel: 400, hegemonyPoints: 80 },
  },
  {
    id: 'automated_supply_conduits',
    phase: 2,
    title: 'Otomatik İkmal Şebekesi',
    description: 'En az 2 koloninizde Otomatik İkmal Hattını devreye alarak hammadde akışını başkente bağlayın.',
    targetValue: 2,
    reward: { ore: 600, crystal: 400, fuel: 300, hegemonyPoints: 50 },
  },
  {
    id: 'breakthrough_mastery',
    phase: 2,
    title: 'İmparatorluk Atılımları',
    description: 'En az 2 Teknolojik Atılım inovasyonunu imparatorluğunuza kazandırarak bilimsel üstünlük sağlayın.',
    targetValue: 2,
    reward: { ore: 750, crystal: 500, fuel: 400, hegemonyPoints: 60 },
  },
  {
    id: 'rapid_interception',
    phase: 2,
    title: 'Taktik Önleme Harekâtı',
    description: 'Düşman veya korsan tehdidine karşı 1-Tıkla Hızlı Önleme Harekâtı icra ederek sektörü savunun.',
    targetValue: 1,
    reward: { ore: 500, crystal: 500, fuel: 300, hegemonyPoints: 50 },
  },
];

/**
 * Evaluates the 10 imperial directives dynamically for a given player based on live state.
 */
export function evaluatePlayerDirectives(state: GameState, playerId: string): EmpireDirective[] {
  const player = state.players[playerId];
  if (!player) return [];

  const claimed = new Set(player.claimedDirectives || []);
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === playerId && f.status !== 'destroyed');

  // Count total ships across garrisons and fleets
  let totalShips = 0;
  let totalCombatShips = 0;
  for (const pl of myPlanets) {
    totalShips += (pl.garrison.scout || 0) + (pl.garrison.transport || 0) + (pl.garrison.fighter || 0) + (pl.garrison.battleship || 0);
    totalCombatShips += (pl.garrison.fighter || 0) + (pl.garrison.battleship || 0);
  }
  for (const fl of myFleets) {
    totalShips += (fl.ships.scout || 0) + (fl.ships.transport || 0) + (fl.ships.fighter || 0) + (fl.ships.battleship || 0);
    totalCombatShips += (fl.ships.fighter || 0) + (fl.ships.battleship || 0);
  }

  // Count discovered systems
  const exploredSystemsCount = Object.values(player.intel.discoveredSystems).filter(
    (lvl) => lvl === 'mapped' || lvl === 'full' || lvl === 'sensor_contact' || lvl === 'deep_intel'
  ).length;

  // Max ore mine level
  let maxMineLevel = 0;
  for (const pl of myPlanets) {
    if ((pl.buildings.ore_mine || 0) > maxMineLevel) {
      maxMineLevel = pl.buildings.ore_mine;
    }
  }

  // Total defense structures
  let totalDefenses = 0;
  for (const pl of myPlanets) {
    if (pl.defenses) {
      totalDefenses += (pl.defenses.missile_battery || 0) + (pl.defenses.plasma_turret || 0) + (pl.defenses.ion_cannon || 0);
    }
  }

  // Admiral assignments
  let hasAssignedAdmiral = 0;
  if (state.admirals) {
    for (const adm of Object.values(state.admirals)) {
      if (adm.ownerId === playerId && (adm.assignedFleetId || adm.assignedPlanetId || adm.level >= 2)) {
        hasAssignedAdmiral = 1;
        break;
      }
    }
  }

  // Diplomacy status
  let diplomacyScore = 0;
  if (player.allianceId) diplomacyScore = 1;
  if (state.truces) {
    for (const [key, exp] of Object.entries(state.truces)) {
      if (key.includes(playerId) && state.timeMs < exp) {
        diplomacyScore = 1;
        break;
      }
    }
  }
  // Also check if any trade deals concluded in eventLog
  if (diplomacyScore === 0) {
    const hasTradeDeal = (state.eventLog || []).some(
      (ev) => ev.type === 'trade_deal_concluded' && ev.playerId === playerId
    );
    if (hasTradeDeal) diplomacyScore = 1;
  }

  // Combat wins
  const combatWins = (state.battleReports || []).filter(
    (b) => (b.attackerId === playerId && b.winner === 'attacker') || (b.defenderId === playerId && b.winner === 'defender')
  ).length;

  // Relay points
  const relayPoints = state.relay.weeklyPoints[playerId] || 0;
  const isControllingRelay = state.relay.controllingPlayerId === playerId ? 10 : 0;
  const effectiveRelayProgress = Math.max(relayPoints, isControllingRelay);

  return DIRECTIVE_DEFINITIONS.map((def) => {
    let currentValue = 0;

    switch (def.id) {
      case 'scout_unknown':
        currentValue = exploredSystemsCount;
        break;
      case 'upgrade_mine':
        currentValue = maxMineLevel;
        break;
      case 'build_fleet':
        currentValue = totalShips;
        break;
      case 'found_colony':
        currentValue = myPlanets.length;
        break;
      case 'assign_admiral':
        currentValue = hasAssignedAdmiral;
        break;
      case 'build_defense':
        currentValue = totalDefenses;
        break;
      case 'diplomatic_deal':
        currentValue = diplomacyScore;
        break;
      case 'win_combat':
        currentValue = combatWins;
        break;
      case 'relay_control':
        currentValue = effectiveRelayProgress;
        break;
      case 'superpower':
        currentValue = myPlanets.length >= 3 && totalCombatShips >= 8 ? 3 : Math.min(myPlanets.length, Math.floor(totalCombatShips / 3));
        break;
      case 'supply_chain_resonance':
        currentValue = (player.activeSynergyTier ?? 0) === 2 ? 1 : 0;
        break;
      case 'golden_surge_trigger':
        currentValue = player.surgeActiveUntilMs ? 1 : 0;
        break;
      case 'automated_supply_conduits': {
        const autoCount = myPlanets.filter((p) => !p.isHomeworld && p.autoSupplyEnabled).length;
        currentValue = autoCount;
        break;
      }
      case 'breakthrough_mastery':
        currentValue = player.unlockedBreakthroughs?.length || 0;
        break;
      case 'rapid_interception':
        currentValue = player.rapidInterceptionsCount || 0;
        break;
    }

    const isCompleted = currentValue >= def.targetValue;
    const isClaimed = claimed.has(def.id);
    const progress = Math.min(1, Math.max(0, currentValue / def.targetValue));

    return {
      id: def.id,
      phase: def.phase,
      title: def.title,
      description: def.description,
      reward: def.reward,
      isCompleted,
      isClaimed,
      progress,
      targetValue: def.targetValue,
      currentValue,
    };
  });
}
