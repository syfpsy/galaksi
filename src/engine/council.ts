import {
  CouncilLeader,
  CouncilPosition,
  EmpireFaction,
  FactionAgenda,
  FactionType,
  GameState,
  ImperialCouncilState,
  LeaderTrait,
  LeaderTraitId,
  Resources,
} from './types';

export const COUNCIL_CONSTANTS = {
  RECRUIT_LEADER_COST: { ore: 500, crystal: 500, fuel: 250 } as Resources,
  PROMOTE_AGENDA_COST: { ore: 800, crystal: 600, fuel: 300 } as Resources,
  AGENDA_PROMOTION_APPROVAL_BOOST: 25,
  MAX_LEADER_LEVEL: 5,
  BASE_XP_PER_LEVEL: 200,
};

export const COUNCIL_POSITION_INFO: Record<
  CouncilPosition,
  {
    nameTr: string;
    nameEn: string;
    roleDescTr: string;
    icon: string;
    primaryBonusDescTr: string;
  }
> = {
  ruler: {
    nameTr: 'Hükümdar / Başkomutan',
    nameEn: 'Imperial Ruler',
    roleDescTr: 'İmparatorluğun mutlak yöneticisi. Halk istikrarını ve genel hükümet meşruiyetini sağlar.',
    icon: '👑',
    primaryBonusDescTr: '+%10 Halk İstikrarı & Her seviye için +%3 Tüm Verim',
  },
  defense_minister: {
    nameTr: 'Savunma Bakanı',
    nameEn: 'Minister of Defense',
    roleDescTr: 'Askeri doktrin ve donanma lojistiğini koordine eder. Gemi üretimini hızlandırır.',
    icon: '🛡️',
    primaryBonusDescTr: '-%15 Gemi İnşa Süresi & Donanma Zırh / Savunma Desteği',
  },
  science_director: {
    nameTr: 'Baş Bilim İnsanı',
    nameEn: 'Head of Science',
    roleDescTr: 'İmparatorluk laboratuvarlarını ve araştırma enstitülerini yönetir.',
    icon: '🔬',
    primaryBonusDescTr: '+%15 Galaktik Araştırma Hızı & +1 Sensör Görüşü',
  },
  industry_minister: {
    nameTr: 'Sanayi ve Ticaret Bakanı',
    nameEn: 'Minister of Industry & Trade',
    roleDescTr: 'Maden ocakları, rafineriler ve galaktik pazar operasyonlarını optimize eder.',
    icon: '⚙️',
    primaryBonusDescTr: '+%15 Maden & Enerji Çıkarımı & -%5 Pazar Komisyonu',
  },
  spymaster: {
    nameTr: 'İstihbarat Şefi',
    nameEn: 'Imperial Spymaster',
    roleDescTr: 'Örtülü operasyonları, casusluk ağını ve düşman sabotajlarına karşı savunmayı yönetir.',
    icon: '👁️',
    primaryBonusDescTr: '+%25 Casusluk Başarısı & +%30 Karşı-İstihbarat Tespiti',
  },
};

export const LEADER_TRAIT_CONFIGS: Record<LeaderTraitId, LeaderTrait> = {
  iron_disciplinarian: {
    id: 'iron_disciplinarian',
    nameTr: 'Demir Disiplin',
    descriptionTr: 'Sarsılmaz askeri nizam. Savunma gücünü ve garnizon direncini artırır.',
    bonusType: 'defense' as any,
    bonusValue: 0.15,
  },
  technologist_visionary: {
    id: 'technologist_visionary',
    nameTr: 'Vizyoner Mühendis',
    descriptionTr: 'İleri kuantum teorileri ve alt-uzay fiziği alanında çığır açan keşifler.',
    bonusType: 'research',
    bonusValue: 0.15,
  },
  master_logistics: {
    id: 'master_logistics',
    nameTr: 'Lojistik Dahisi',
    descriptionTr: 'Maden ve hammadde tedarik zincirlerinde kusursuz verimlilik.',
    bonusType: 'production',
    bonusValue: 0.15,
  },
  shadow_broker: {
    id: 'shadow_broker',
    nameTr: 'Gölge Ajanı',
    descriptionTr: 'Düşman sırlarını ele geçirme ve istihbarat sızıntılarını önlemede uzman.',
    bonusType: 'espionage',
    bonusValue: 0.25,
  },
  inspirational_orator: {
    id: 'inspirational_orator',
    nameTr: 'Karizmatik Hatip',
    descriptionTr: 'Halk kitlelerini birleştiren ve fraksiyon gerilimlerini yatıştıran konuşmacı.',
    bonusType: 'stability',
    bonusValue: 12,
  },
  warlord: {
    id: 'warlord',
    nameTr: 'Savaş Beyi',
    descriptionTr: 'Saldırgan filo taktikleri ve ezici ateş gücü doktrini.',
    bonusType: 'fleet_attack',
    bonusValue: 0.15,
  },
  fleet_organizer: {
    id: 'fleet_organizer',
    nameTr: 'Tersane Ustası',
    descriptionTr: 'Gemi montaj hatlarında standartlaşma ve seri üretim hızı.',
    bonusType: 'ship_build',
    bonusValue: 0.15,
  },
  deep_space_miner: {
    id: 'deep_space_miner',
    nameTr: 'Maden Jeoloğu',
    descriptionTr: 'Nadir kristal ve cevher damarlarını en yüksek saflıkta işleme kabiliyeti.',
    bonusType: 'production',
    bonusValue: 0.10,
  },
};

export interface CouncilEmpireBonuses {
  stabilityPercent: number;
  stabilityMultiplier: number;
  resourceProductionMultiplier: number;
  researchSpeedMultiplier: number;
  shipBuildSpeedMultiplier: number;
  fleetAttackMultiplier: number;
  fleetDefenseMultiplier: number;
  marketFeeDiscount: number;
  espionageSuccessMultiplier: number;
  counterIntelBonus: number;
  rulerWeeklyHegemonyBonus: number;
}

/**
 * Evaluates satisfaction percentages (0-100) for all 4 internal factions
 */
export function evaluateFactionApproval(
  state: GameState,
  playerId: string
): Record<FactionType, number> {
  const approval: Record<FactionType, number> = {
    militarists: 50,
    technocrats: 50,
    merchants: 50,
    expansionists: 50,
  };

  // 1. Militarists: Fleets, starbases, battle victories
  let totalShips = 0;
  for (const p of Object.values(state.planets)) {
    if (p.ownerId === playerId && p.garrison) {
      totalShips += (p.garrison.scout || 0) + (p.garrison.fighter || 0) + (p.garrison.battleship || 0);
    }
  }
  for (const f of Object.values(state.fleets)) {
    if (f.ownerId === playerId) {
      totalShips += (f.ships.scout || 0) + (f.ships.fighter || 0) + (f.ships.battleship || 0);
    }
  }

  if (totalShips >= 15) approval.militarists += 25;
  else if (totalShips >= 6) approval.militarists += 10;
  else if (totalShips < 3) approval.militarists -= 15;

  const playerBattlesWon = state.battleReports.filter(
    (b) =>
      (b.attackerId === playerId && b.winner === 'attacker') ||
      (b.defenderId === playerId && b.winner === 'defender')
  ).length;
  if (playerBattlesWon >= 3) approval.militarists += 15;
  else if (playerBattlesWon >= 1) approval.militarists += 5;

  // Starbases owned
  const ownedStarbases = Object.values(state.starbases || {}).filter(
    (sb) => sb.ownerId === playerId
  ).length;
  if (ownedStarbases >= 2) approval.militarists += 10;

  // 2. Technocrats: Research lab count, tech haven, science nexus, active research
  const player = state.players[playerId];
  if (player) {
    const totalTechLevels = Object.values(player.research || {}).reduce((a, b) => a + b, 0);
    if (totalTechLevels >= 10) approval.technocrats += 25;
    else if (totalTechLevels >= 5) approval.technocrats += 10;

    if (player.researchQueue) approval.technocrats += 10;
  }

  const hasScienceNexus = Object.values(state.megastructures || {}).some(
    (m) => m.ownerId === playerId && m.type === 'science_nexus' && m.stage >= 1
  );
  if (hasScienceNexus) approval.technocrats += 25;

  // 3. Merchants: Resource wealth, market trade activity, free trade resolution
  let totalOre = 0;
  let totalCrystal = 0;
  for (const p of Object.values(state.planets)) {
    if (p.ownerId === playerId) {
      totalOre += p.resources.ore;
      totalCrystal += p.resources.crystal;
    }
  }
  const totalWealth = totalOre + totalCrystal;
  if (totalWealth >= 6000) approval.merchants += 25;
  else if (totalWealth >= 2500) approval.merchants += 10;
  else if (totalWealth < 1000) approval.merchants -= 15;

  const isFreeTradeActive = state.senate?.activeResolutions?.some(
    (r) => r.resolutionType === 'free_trade'
  );
  if (isFreeTradeActive) approval.merchants += 20;

  // 4. Expansionists: Colonies count, active gateways, explorer fleets
  const ownedPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  if (ownedPlanets.length >= 4) approval.expansionists += 30;
  else if (ownedPlanets.length >= 2) approval.expansionists += 15;
  else if (ownedPlanets.length === 1) approval.expansionists -= 10;

  const hasActiveGateway = Object.values(state.gateways || {}).some(
    (gw) => gw.ownerId === playerId && gw.status === 'active'
  );
  if (hasActiveGateway) approval.expansionists += 20;

  // Clamp 0 to 100
  for (const f of ['militarists', 'technocrats', 'merchants', 'expansionists'] as FactionType[]) {
    approval[f] = Math.max(0, Math.min(100, approval[f]));
  }

  return approval;
}

/**
 * Calculates overall Imperial Stability (0 to 100)
 */
export function calculateEmpireStability(state: GameState, playerId: string): number {
  const approval = evaluateFactionApproval(state, playerId);
  const council = state.councils?.[playerId];

  // Base stability: average of faction approvals
  const factionAvg =
    (approval.militarists + approval.technocrats + approval.merchants + approval.expansionists) / 4;

  let stability = factionAvg;

  // Ruler bonus
  if (council) {
    const rulerId = council.positions.ruler;
    if (rulerId && council.leaders[rulerId]) {
      const ruler = council.leaders[rulerId];
      stability += 5 + ruler.level * 2; // +7% to +15% base ruler stability
      if (ruler.trait.bonusType === 'stability') {
        stability += ruler.trait.bonusValue;
      }
    }

    // Check other councilors with stability trait
    for (const [pos, lId] of Object.entries(council.positions)) {
      if (pos === 'ruler' || !lId) continue;
      const leader = council.leaders[lId];
      if (leader?.trait.bonusType === 'stability') {
        stability += leader.trait.bonusValue * 0.5;
      }
    }
  }

  return Math.max(0, Math.min(100, Math.round(stability)));
}

/**
 * Computes all cumulative empire-wide modifiers from the Imperial Council & Factions
 */
export function getCouncilEmpireBonuses(
  state: GameState,
  playerId: string
): CouncilEmpireBonuses {
  const stability = calculateEmpireStability(state, playerId);

  // Stability Multiplier:
  // > 70% -> +0.5% production per point above 70 (up to +15% prosperity boost)
  // < 40% -> -0.7% production per point below 40 (down to -25% strike penalty)
  let stabilityMultiplier = 1.0;
  if (stability > 70) {
    stabilityMultiplier += (stability - 70) * 0.005;
  } else if (stability < 40) {
    stabilityMultiplier -= (40 - stability) * 0.007;
  }

  const bonuses: CouncilEmpireBonuses = {
    stabilityPercent: stability,
    stabilityMultiplier,
    resourceProductionMultiplier: stabilityMultiplier,
    researchSpeedMultiplier: 1.0,
    shipBuildSpeedMultiplier: 1.0,
    fleetAttackMultiplier: 1.0,
    fleetDefenseMultiplier: 1.0,
    marketFeeDiscount: 0,
    espionageSuccessMultiplier: 1.0,
    counterIntelBonus: 0,
    rulerWeeklyHegemonyBonus: 0,
  };

  const council = state.councils?.[playerId];
  if (!council) return bonuses;

  // 1. Ruler
  const rulerId = council.positions.ruler;
  if (rulerId && council.leaders[rulerId]) {
    const ruler = council.leaders[rulerId];
    bonuses.resourceProductionMultiplier += ruler.level * 0.02; // +2% per level
    bonuses.rulerWeeklyHegemonyBonus += ruler.level * 5;        // +5 to +25 weekly pts
  }

  // 2. Defense Minister
  const defId = council.positions.defense_minister;
  if (defId && council.leaders[defId]) {
    const defMin = council.leaders[defId];
    bonuses.shipBuildSpeedMultiplier += 0.15 + (defMin.level - 1) * 0.03;
    bonuses.fleetDefenseMultiplier += 0.10 + (defMin.level - 1) * 0.02;
    if (defMin.trait.bonusType === 'fleet_attack') {
      bonuses.fleetAttackMultiplier += defMin.trait.bonusValue;
    }
    if (defMin.trait.bonusType === 'ship_build') {
      bonuses.shipBuildSpeedMultiplier += defMin.trait.bonusValue;
    }
  }

  // 3. Head of Science
  const sciId = council.positions.science_director;
  if (sciId && council.leaders[sciId]) {
    const sciDir = council.leaders[sciId];
    bonuses.researchSpeedMultiplier += 0.15 + (sciDir.level - 1) * 0.04;
    if (sciDir.trait.bonusType === 'research') {
      bonuses.researchSpeedMultiplier += sciDir.trait.bonusValue;
    }
  }

  // 4. Industry Minister
  const indId = council.positions.industry_minister;
  if (indId && council.leaders[indId]) {
    const indMin = council.leaders[indId];
    bonuses.resourceProductionMultiplier += 0.15 + (indMin.level - 1) * 0.03;
    bonuses.marketFeeDiscount += 0.05 + (indMin.level - 1) * 0.01;
    if (indMin.trait.bonusType === 'production') {
      bonuses.resourceProductionMultiplier += indMin.trait.bonusValue;
    }
  }

  // 5. Spymaster
  const spyId = council.positions.spymaster;
  if (spyId && council.leaders[spyId]) {
    const spymaster = council.leaders[spyId];
    bonuses.espionageSuccessMultiplier += 0.25 + (spymaster.level - 1) * 0.05;
    bonuses.counterIntelBonus += 0.30 + (spymaster.level - 1) * 0.05;
    if (spymaster.trait.bonusType === 'espionage') {
      bonuses.espionageSuccessMultiplier += spymaster.trait.bonusValue;
    }
  }

  return bonuses;
}

/**
 * Awards XP to a council leader and handles level promotions
 */
export function addLeaderXP(
  leader: CouncilLeader,
  xp: number
): { leader: CouncilLeader; leveledUp: boolean } {
  let newXp = leader.xp + xp;
  let newLevel = leader.level;
  let nextXp = leader.nextLevelXp;
  let leveledUp = false;

  while (newXp >= nextXp && newLevel < COUNCIL_CONSTANTS.MAX_LEADER_LEVEL) {
    newXp -= nextXp;
    newLevel++;
    nextXp = newLevel * COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL;
    leveledUp = true;
  }

  return {
    leader: {
      ...leader,
      level: newLevel,
      xp: newXp,
      nextLevelXp: nextXp,
    },
    leveledUp,
  };
}

/**
 * Generates 3 recruit candidates for the council recruit pool
 */
export function generateLeaderCandidates(seed: number, playerId: string): CouncilLeader[] {
  const candidateNames = [
    { name: 'Aurelia Vance', title: 'İmparatorluk Diplomatı', avatar: '👩‍✈️', traitId: 'inspirational_orator' as LeaderTraitId },
    { name: 'Kaelen Thorne', title: 'Ağır Donanma Taktisyeni', avatar: '👨‍✈️', traitId: 'warlord' as LeaderTraitId },
    { name: 'Lyra Solis', title: 'Alt-Uzay Araştırmacısı', avatar: '👩‍🔬', traitId: 'technologist_visionary' as LeaderTraitId },
    { name: 'Corvin Graves', title: 'Lojistik Koordinatörü', avatar: '👨‍💼', traitId: 'master_logistics' as LeaderTraitId },
    { name: 'Vespera Nyx', title: 'Gölge Operatörü', avatar: '🥷', traitId: 'shadow_broker' as LeaderTraitId },
    { name: 'Boran Demirkan', title: 'Garnizon Mareşali', avatar: '👮‍♂️', traitId: 'iron_disciplinarian' as LeaderTraitId },
    { name: 'Elena Rostov', title: 'Maden Mühendisi', avatar: '👷‍♀️', traitId: 'deep_space_miner' as LeaderTraitId },
    { name: 'Tarek Voss', title: 'Tersane Yöneticisi', avatar: '👨‍🏭', traitId: 'fleet_organizer' as LeaderTraitId },
  ];

  const candidates: CouncilLeader[] = [];
  const chosenIndices = new Set<number>();

  for (let i = 0; i < 3; i++) {
    let pick = Math.abs((seed + i * 37) % candidateNames.length);
    while (chosenIndices.has(pick)) {
      pick = (pick + 1) % candidateNames.length;
    }
    chosenIndices.add(pick);

    const base = candidateNames[pick];
    candidates.push({
      id: `lead_cand_${playerId}_${seed}_${i}`,
      name: base.name,
      title: base.title,
      avatar: base.avatar,
      ownerId: playerId,
      level: 1,
      xp: 0,
      nextLevelXp: COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL,
      assignedPosition: null,
      trait: LEADER_TRAIT_CONFIGS[base.traitId],
      tenureHours: 0,
    });
  }

  return candidates;
}

/**
 * Initializes the default Imperial Council and Internal Factions for a new empire
 */
export function createDefaultImperialCouncil(
  playerId: string,
  playerName?: string,
  botArchetype?: string
): ImperialCouncilState {
  const rulerId = `lead_ruler_${playerId}`;
  const ruler: CouncilLeader = {
    id: rulerId,
    name: playerName || 'İmparatorluk Lideri',
    title: 'Hükümdar / Başkomutan',
    avatar: '👑',
    ownerId: playerId,
    level: 1,
    xp: 0,
    nextLevelXp: COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL,
    assignedPosition: 'ruler',
    trait: LEADER_TRAIT_CONFIGS.inspirational_orator,
    tenureHours: 1,
  };

  // Two starting appointed ministers based on archetype or defaults
  let startingMinister: CouncilLeader;
  let ministerPos: CouncilPosition = 'defense_minister';

  if (botArchetype === 'industrialist') {
    ministerPos = 'industry_minister';
    startingMinister = {
      id: `lead_ind_${playerId}`,
      name: 'Varos Kane',
      title: 'Üretim Koordinatörü',
      avatar: '👨‍💼',
      ownerId: playerId,
      level: 1,
      xp: 0,
      nextLevelXp: COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL,
      assignedPosition: null,
      trait: LEADER_TRAIT_CONFIGS.master_logistics,
      tenureHours: 1,
    };
  } else if (botArchetype === 'explorer') {
    ministerPos = 'science_director';
    startingMinister = {
      id: `lead_sci_${playerId}`,
      name: 'Seraphina Vale',
      title: 'Kıdemli Astrofizikçi',
      avatar: '👩‍🔬',
      ownerId: playerId,
      level: 1,
      xp: 0,
      nextLevelXp: COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL,
      assignedPosition: null,
      trait: LEADER_TRAIT_CONFIGS.technologist_visionary,
      tenureHours: 1,
    };
  } else {
    startingMinister = {
      id: `lead_def_${playerId}`,
      name: 'Garrison Stryke',
      title: 'Taktik Filo Komutanı',
      avatar: '👨‍✈️',
      ownerId: playerId,
      level: 1,
      xp: 0,
      nextLevelXp: COUNCIL_CONSTANTS.BASE_XP_PER_LEVEL,
      assignedPosition: null,
      trait: LEADER_TRAIT_CONFIGS.warlord,
      tenureHours: 1,
    };
  }

  const leaders: Record<string, CouncilLeader> = {
    [ruler.id]: ruler,
    [startingMinister.id]: startingMinister,
  };

  const positions: Record<CouncilPosition, string | null> = {
    ruler: ruler.id,
    defense_minister: null,
    science_director: null,
    industry_minister: null,
    spymaster: null,
  };

  const factions: Record<FactionType, EmpireFaction> = {
    militarists: {
      type: 'militarists',
      nameTr: 'Militarist Birlik',
      icon: '⚔️',
      color: '#ef4444',
      populationSharePercent: 30,
      approvalRating: 60,
      status: 'content',
      agendas: [
        {
          id: 'agenda_strong_fleet',
          titleTr: 'Güçlü Donanma Varlığı',
          descriptionTr: 'En az 8 savaş gemisinden oluşan caydırıcı bir filo bulundurun.',
          fulfilled: false,
          approvalImpact: 20,
        },
        {
          id: 'agenda_starbase_bastion',
          titleTr: 'Yıldız Üssü Tahkimatı',
          descriptionTr: 'Sektör sistemlerinde en az bir ileri Yıldız Üssü inşa edin.',
          fulfilled: false,
          approvalImpact: 15,
        },
      ],
    },
    technocrats: {
      type: 'technocrats',
      nameTr: 'Teknokrasi İttifakı',
      icon: '🔬',
      color: '#06b6d4',
      populationSharePercent: 25,
      approvalRating: 65,
      status: 'content',
      agendas: [
        {
          id: 'agenda_continuous_research',
          titleTr: 'Sürekli Teknolojik Atılım',
          descriptionTr: 'Araştırma laboratuvarlarını sürekli aktif tutarak yeni teknolojiler geliştirin.',
          fulfilled: true,
          approvalImpact: 20,
        },
        {
          id: 'agenda_science_nexus',
          titleTr: 'Bilim Dizisi Projesi',
          descriptionTr: 'Bilim Dizisi Mega Yapısı inşa ederek alt-uzay hesaplama ağı kurun.',
          fulfilled: false,
          approvalImpact: 25,
        },
      ],
    },
    merchants: {
      type: 'merchants',
      nameTr: 'Tüccarlar Loncası',
      icon: '💎',
      color: '#eab308',
      populationSharePercent: 25,
      approvalRating: 55,
      status: 'content',
      agendas: [
        {
          id: 'agenda_mineral_surplus',
          titleTr: 'Zengin Kaynak Rezervi',
          descriptionTr: 'Depolarda en az 3000 Cevher ve 2000 Kristal güvenlik rezervi bulundurun.',
          fulfilled: false,
          approvalImpact: 20,
        },
        {
          id: 'agenda_free_trade',
          titleTr: 'Serbest Ticaret Hukuku',
          descriptionTr: 'Galaktik Senatoda Serbest Ticaret kararını kabul ettirin.',
          fulfilled: false,
          approvalImpact: 15,
        },
      ],
    },
    expansionists: {
      type: 'expansionists',
      nameTr: 'Galaktik Kolonistler',
      icon: '🚀',
      color: '#10b981',
      populationSharePercent: 20,
      approvalRating: 50,
      status: 'content',
      agendas: [
        {
          id: 'agenda_settle_colony',
          titleTr: 'Yeni Dünyaların Kolonizasyonu',
          descriptionTr: 'En az iki yeni yaşanabilir gezegende koloni kurun.',
          fulfilled: false,
          approvalImpact: 25,
        },
        {
          id: 'agenda_gateway_transit',
          titleTr: 'Alt-Uzay Ağ Geçidi Bağlantısı',
          descriptionTr: 'İmparatorluk sınırları içinde aktif bir Ağ Geçidi bulundurun.',
          fulfilled: false,
          approvalImpact: 20,
        },
      ],
    },
  };

  return {
    playerId,
    leaders,
    positions,
    factions,
    stabilityPercent: 65,
    resourceProductionMultiplier: 1.0,
    recruitCandidates: generateLeaderCandidates(101, playerId),
    lastCandidateRefreshMs: 0,
  };
}
