import {
  BattleReport,
  GameState,
  Planet,
  Player,
  SubjectAgreement,
  SubjectType,
  WarGoalType,
  WarState,
  WarStatus,
} from './types';

export interface WarGoalConfig {
  goal: WarGoalType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  surrenderEffectTr: string;
}

export const WAR_GOAL_CONFIGS: Record<WarGoalType, WarGoalConfig> = {
  conquest: {
    goal: 'conquest',
    nameTr: 'Toprak İlhakı (Conquest)',
    descriptionTr: 'Düşman kolonilerini ve yıldız sistemlerini kalıcı imparatorluk sınırlarına katmayı hedefler.',
    icon: '⚔️',
    surrenderEffectTr: 'Düşmanın işgal edilen veya sınırdaş tüm kolonileri galip imparatorluğun mülkiyetine geçer.',
  },
  subjugation: {
    goal: 'subjugation',
    nameTr: 'Vasal Yapma (Subjugation)',
    descriptionTr: 'Mağlup imparatorluğu tam yetkili askeri ve diplomatik vasal devlet (Vassal) haline getirir.',
    icon: '👑',
    surrenderEffectTr: 'Düşman bir Vasal devlete dönüşür: efendisinin savaşlarına katılır, sensör görüşünü açar ve %15 haraç öder.',
  },
  tributary: {
    goal: 'tributary',
    nameTr: 'Haraçgüzar Yapma (Tributary)',
    descriptionTr: 'Düşmanın iç ve dış politikasını serbest bırakır ancak zenginliklerinin %30\'unu haraç olarak bağlar.',
    icon: '💰',
    surrenderEffectTr: 'Düşman Haraçgüzar devlete dönüşür: ore, crystal ve fuel üretiminin %30\'unu efendisine aktarır.',
  },
  liberation: {
    goal: 'liberation',
    nameTr: 'Özgürleştirme (Liberation)',
    descriptionTr: 'Hedef imparatorluğun boyunduruğu altındaki vasalları özgürleştirir ve düşman ittifakları fesheder.',
    icon: '🕊️',
    surrenderEffectTr: 'Düşmanın tüm bağımlı devletleri bağımsızlığını kazanır, saldırgan askeri paktlar feshedilir.',
  },
  humiliation: {
    goal: 'humiliation',
    nameTr: 'Aşağılama & İtibar Kırma (Humiliation)',
    descriptionTr: 'Düşmanın galaktik prestijini ve Hegemonya puanlarını yerle bir ederek kendi kültürel birliğini yüceltir.',
    icon: '🎖️',
    surrenderEffectTr: 'Galip +60 Hegemonya puanı ve +300 Kültürel Birlik (Unity) kazanır; mağlup 60 Hegemonya puanı kaybeder.',
  },
  total_war: {
    goal: 'total_war',
    nameTr: 'Topyekûn Savaş (Total War)',
    descriptionTr: 'Kolossus süper silahının varlığıyla tetiklenen varoluşsal savaş. Hak iddialarına gerek kalmadan anında ilhak sağlar.',
    icon: '☠️',
    surrenderEffectTr: 'Hedef imparatorluğun tüm varlığı ve kolonileri koşulsuz ilhak edilir veya yok edilir.',
  },
  stop_colossus: {
    goal: 'stop_colossus',
    nameTr: 'Kolossusu Durdur (Contain Threat)',
    descriptionTr: 'Doomsday süper silahına sahip bir tiranı galaktik tehdit olmaktan çıkarmak için başlatılan varoluşsal koalisyon savaşı.',
    icon: '🛡️',
    surrenderEffectTr: 'Düşman Kolossus gemisi tamamen parçalanır ve düşmanın süper silah projesi feshedilir.',
  },
};

export interface SubjectTypeConfig {
  type: SubjectType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  defaultTitheRate: number;
  benefitsTr: string;
}

export const SUBJECT_TYPE_CONFIGS: Record<SubjectType, SubjectTypeConfig> = {
  vassal: {
    type: 'vassal',
    nameTr: 'Askeri Vasal (Vassal)',
    descriptionTr: 'Efendisinin tüm savaşlarına zorunlu katılır, sensör görüşünü paylaşır ve %15 kaynak tulumu öder.',
    icon: '🛡️',
    defaultTitheRate: 0.15,
    benefitsTr: 'Ortak askeri savunma, tam sensör paylaşımı, %15 kaynak tulumu.',
  },
  tributary: {
    type: 'tributary',
    nameTr: 'Haraçgüzar (Tributary)',
    descriptionTr: 'Dış diplomasisinde bağımsızdır ancak %30 maden, kristal ve yakıt haraç öder. Savaş yükümlülüğü yoktur.',
    icon: '💎',
    defaultTitheRate: 0.30,
    benefitsTr: 'Yüksek haraç geliri (%30), sıfır askeri yükümlülük.',
  },
  scholarium: {
    type: 'scholarium',
    nameTr: 'Bilim Uydusu (Scholarium)',
    descriptionTr: 'Efendisine araştırma gücünün %25\'ini aktarır, düşük maden haracı öder. Teknoloji odaklı vasal.',
    icon: '🔬',
    defaultTitheRate: 0.10,
    benefitsTr: 'Efendiye +%25 Araştırma Hızı, teknolojik atılım desteği.',
  },
  bulwark: {
    type: 'bulwark',
    nameTr: 'Siper Karargahı (Bulwark)',
    descriptionTr: 'Askeri savunma marşı. Efendisinden ekonomik sübvansiyon alır (-%10), savunma savaşlarında +%25 güç kazanır.',
    icon: '🏰',
    defaultTitheRate: -0.10,
    benefitsTr: 'Sınır tahkimatı, savunma savaşlarında +%25 güç (efendi kaynak sübvansiyonu sağlar).',
  },
};

/**
 * Checks if two players are in an active war
 */
export function isAtWar(
  state: GameState,
  playerAId: string,
  playerBId: string
): WarState | null {
  if (!state.wars) return null;
  for (const war of Object.values(state.wars)) {
    if (war.status !== 'active') continue;
    if (
      (war.attackerId === playerAId && war.defenderId === playerBId) ||
      (war.attackerId === playerBId && war.defenderId === playerAId)
    ) {
      return war;
    }
  }
  return null;
}

/**
 * Gets all active wars for a player
 */
export function getActiveWarsForPlayer(state: GameState, playerId: string): WarState[] {
  if (!state.wars) return [];
  return Object.values(state.wars).filter(
    (w) => w.status === 'active' && (w.attackerId === playerId || w.defenderId === playerId)
  );
}

/**
 * Gets subject agreement if player is a subject
 */
export function getSubjectAgreement(
  state: GameState,
  subjectId: string
): SubjectAgreement | null {
  if (!state.subjects) return null;
  return state.subjects[subjectId] || null;
}

/**
 * Gets all subjects of an overlord
 */
export function getPlayerSubjects(
  state: GameState,
  overlordId: string
): SubjectAgreement[] {
  if (!state.subjects) return [];
  return Object.values(state.subjects).filter((s) => s.overlordId === overlordId);
}

/**
 * Records battle results into war exhaustion and statistics
 */
export function recordBattleWarExhaustion(
  state: GameState,
  battleReport: BattleReport
): void {
  const war = isAtWar(state, battleReport.attackerId, battleReport.defenderId);
  if (!war) return;

  const isAttackerHost = war.attackerId === battleReport.attackerId;

  // Calculate ship losses
  const attackerTotalLost = Object.values(
    battleReport.rounds.reduce(
      (acc, r) => {
        acc.scout = (acc.scout || 0) + (r.attackerLosses?.scout || 0);
        acc.transport = (acc.transport || 0) + (r.attackerLosses?.transport || 0);
        acc.fighter = (acc.fighter || 0) + (r.attackerLosses?.fighter || 0);
        acc.battleship = (acc.battleship || 0) + (r.attackerLosses?.battleship || 0);
        return acc;
      },
      { scout: 0, transport: 0, fighter: 0, battleship: 0 }
    )
  ).reduce((a, b) => a + b, 0);

  const defenderTotalLost = Object.values(
    battleReport.rounds.reduce(
      (acc, r) => {
        acc.scout = (acc.scout || 0) + (r.defenderLosses?.scout || 0);
        acc.transport = (acc.transport || 0) + (r.defenderLosses?.transport || 0);
        acc.fighter = (acc.fighter || 0) + (r.defenderLosses?.fighter || 0);
        acc.battleship = (acc.battleship || 0) + (r.defenderLosses?.battleship || 0);
        return acc;
      },
      { scout: 0, transport: 0, fighter: 0, battleship: 0 }
    )
  ).reduce((a, b) => a + b, 0);

  // Each ship lost adds war exhaustion (~1.5% to 4% per ship depending on size)
  const attackerExhaustionGain = Math.min(25, attackerTotalLost * 2.5);
  const defenderExhaustionGain = Math.min(25, defenderTotalLost * 2.5);

  if (isAttackerHost) {
    war.attackerExhaustion = Math.min(100, war.attackerExhaustion + attackerExhaustionGain);
    war.defenderExhaustion = Math.min(100, war.defenderExhaustion + defenderExhaustionGain);
    if (battleReport.winner === 'attacker') {
      war.battlesWonByAttacker++;
    } else if (battleReport.winner === 'defender') {
      war.battlesWonByDefender++;
    }
  } else {
    war.defenderExhaustion = Math.min(100, war.defenderExhaustion + attackerExhaustionGain);
    war.attackerExhaustion = Math.min(100, war.attackerExhaustion + defenderExhaustionGain);
    if (battleReport.winner === 'attacker') {
      war.battlesWonByDefender++;
    } else if (battleReport.winner === 'defender') {
      war.battlesWonByAttacker++;
    }
  }

  // Planetary raid occupation boost: If defender garrison and defenses are destroyed
  if (battleReport.context === 'planet_raid') {
    const defenderSurviving = Object.values(battleReport.survivingDefender).reduce((a, b) => a + b, 0);
    const defensesSurviving = battleReport.survivingDefenses
      ? Object.values(battleReport.survivingDefenses).reduce((a, b) => a + b, 0)
      : 0;

    if (defenderSurviving === 0 && defensesSurviving === 0 && battleReport.winner === 'attacker') {
      if (isAttackerHost) {
        war.attackerOccupation = Math.min(100, war.attackerOccupation + 25);
        war.defenderExhaustion = Math.min(100, war.defenderExhaustion + 10);
      } else {
        war.defenderOccupation = Math.min(100, war.defenderOccupation + 25);
        war.attackerExhaustion = Math.min(100, war.attackerExhaustion + 10);
      }
    }
  }
}

/**
 * Main passive tick for Wars, War Exhaustion and Subject Tithes
 */
export function updateWarsAndSubjects(state: GameState, deltaMs: number): void {
  state.wars = state.wars || {};
  state.subjects = state.subjects || {};

  const hoursElapsed = deltaMs / 3600000;
  const minutesElapsed = deltaMs / 60000;

  // 1. War Exhaustion Attrition over time
  for (const war of Object.values(state.wars)) {
    if (war.status !== 'active') continue;

    // Passive attrition: +0.1% per minute
    war.attackerExhaustion = Math.min(100, Math.round((war.attackerExhaustion + minutesElapsed * 0.1) * 10) / 10);
    war.defenderExhaustion = Math.min(100, Math.round((war.defenderExhaustion + minutesElapsed * 0.1) * 10) / 10);
  }

  // 2. Subject Tithe Transfers and Integration Ticking
  for (const [subjectId, agreement] of Object.entries(state.subjects)) {
    const subject = state.players[subjectId];
    const overlord = state.players[agreement.overlordId];
    if (!subject || !overlord) continue;

    const subjectPlanets = Object.values(state.planets).filter((p) => p.ownerId === subjectId);
    const overlordPlanets = Object.values(state.planets).filter((p) => p.ownerId === agreement.overlordId);
    const subjectHw = subjectPlanets.find((p) => p.isHomeworld) || subjectPlanets[0];
    const overlordHw = overlordPlanets.find((p) => p.isHomeworld) || overlordPlanets[0];

    if (!subjectHw || !overlordHw) continue;

    // A. Tithe Transfers
    if (agreement.titheRate > 0) {
      // Standard or High tithe: Subject pays percentage of resources to Overlord
      const oreTithe = subjectHw.resources.ore * agreement.titheRate * hoursElapsed;
      const crystalTithe = subjectHw.resources.crystal * agreement.titheRate * hoursElapsed;
      const fuelTithe = subjectHw.resources.fuel * agreement.titheRate * hoursElapsed;

      if (subjectHw.resources.ore >= oreTithe) {
        subjectHw.resources.ore -= oreTithe;
        overlordHw.resources.ore = Math.min(overlordHw.storageCap, overlordHw.resources.ore + oreTithe);
      }
      if (subjectHw.resources.crystal >= crystalTithe) {
        subjectHw.resources.crystal -= crystalTithe;
        overlordHw.resources.crystal = Math.min(overlordHw.storageCap, overlordHw.resources.crystal + crystalTithe);
      }
      if (subjectHw.resources.fuel >= fuelTithe) {
        subjectHw.resources.fuel -= fuelTithe;
        overlordHw.resources.fuel = Math.min(overlordHw.storageCap, overlordHw.resources.fuel + fuelTithe);
      }
    } else if (agreement.titheRate < 0) {
      // Bulwark: Overlord pays subsidy to subject
      const subsidyRate = Math.abs(agreement.titheRate);
      const oreSubsidy = overlordHw.resources.ore * subsidyRate * hoursElapsed;
      const fuelSubsidy = overlordHw.resources.fuel * subsidyRate * hoursElapsed;

      if (overlordHw.resources.ore >= oreSubsidy && overlordHw.resources.fuel >= fuelSubsidy) {
        overlordHw.resources.ore -= oreSubsidy;
        overlordHw.resources.fuel -= fuelSubsidy;
        subjectHw.resources.ore = Math.min(subjectHw.storageCap, subjectHw.resources.ore + oreSubsidy);
        subjectHw.resources.fuel = Math.min(subjectHw.storageCap, subjectHw.resources.fuel + fuelSubsidy);
      }
    }

    // B. Scholarium Research Boost
    if (agreement.type === 'scholarium') {
      // Grants overlord bonus research advancement
      if (overlord.researchQueue) {
        const speedBonusMs = deltaMs * 0.25;
        overlord.researchQueue.finishTime -= speedBonusMs;
      }
    }

    // C. Subject Integration Progress
    if (agreement.integrationProgress !== undefined) {
      // Progresses at ~1.5% per minute
      agreement.integrationProgress = Math.min(100, Math.round((agreement.integrationProgress + minutesElapsed * 1.5) * 10) / 10);

      // Integration Complete: annex subject planets into overlord
      if (agreement.integrationProgress >= 100) {
        for (const planet of subjectPlanets) {
          planet.ownerId = agreement.overlordId;
          planet.isHomeworld = false;
        }
        delete state.subjects[subjectId];
        subject.overlordId = null;
        if (overlord.subjects) {
          overlord.subjects = overlord.subjects.filter((s) => s !== subjectId);
        }
        state.eventLog.push({
          id: `event_integration_${state.nextId++}`,
          timeMs: state.timeMs,
          type: 'vassal_integrated',
          playerId: agreement.overlordId,
          description: `🏛️ ENTEGRASYON TAMAMLANDI: ${subject.name} imparatorluğu tamamen ${overlord.name} sınırlarına ilhak edildi!`,
          metadata: { subjectId, overlordId: agreement.overlordId },
        });
      }
    }
  }
}

/**
 * Declares a formal war with specific Casus Belli / War Goal
 */
export function declareWar(
  state: GameState,
  attackerId: string,
  defenderId: string,
  warGoal: WarGoalType
): { success: boolean; error?: string; warId?: string } {
  state.wars = state.wars || {};
  state.subjects = state.subjects || {};

  if (attackerId === defenderId) {
    return { success: false, error: 'Kendinize karşı savaş ilan edemezsiniz.' };
  }

  const attacker = state.players[attackerId];
  const defender = state.players[defenderId];
  if (!attacker || !defender) {
    return { success: false, error: 'İmparatorluk bulunamadı.' };
  }

  if (attacker.vacationMode || defender.vacationMode) {
    return { success: false, error: 'Tatil modundaki bir imparatorlukla savaş başlatılamaz.' };
  }

  // Alliance check: cannot declare war on alliance members
  if (attacker.allianceId && defender.allianceId && attacker.allianceId === defender.allianceId) {
    return { success: false, error: 'Aynı ittifakta yer aldığınız müttefiğe savaş ilan edemezsiniz.' };
  }

  // Federation check: cannot declare war on federation members (Phase 22)
  if (attacker.federationId && defender.federationId && attacker.federationId === defender.federationId) {
    return { success: false, error: 'Aynı federasyonda yer aldığınız bir müttefiğe savaş ilan edemezsiniz.' };
  }

  // Existing war check
  if (isAtWar(state, attackerId, defenderId)) {
    return { success: false, error: 'Bu imparatorluk ile zaten devam eden aktif bir savaş bulunmaktadır.' };
  }

  // Active diplomatic truce check
  const sortedPair = [attackerId, defenderId].sort();
  const truceKey = `${sortedPair[0]}_${sortedPair[1]}`;
  if (state.truces && state.truces[truceKey] && state.truces[truceKey] > state.timeMs) {
    const sec = Math.ceil((state.truces[truceKey] - state.timeMs) / 1000);
    return { success: false, error: `Yürürlükte bir barış/ateşkes paktı bulunmaktadır (${sec} sn kaldı).` };
  }

  // Vassal constraint: subject cannot declare war on overlord unless liberation goal
  const subjectAg = getSubjectAgreement(state, attackerId);
  if (subjectAg && subjectAg.overlordId === defenderId && warGoal !== 'liberation') {
    return { success: false, error: 'Efendinize karşı yalnızca Özgürleştirme (Bağımsızlık) savaşı açabilirsiniz.' };
  }

  // Break bilateral commercial pacts
  if (attacker.commercialPacts) {
    attacker.commercialPacts = attacker.commercialPacts.filter((id) => id !== defenderId);
  }
  if (defender.commercialPacts) {
    defender.commercialPacts = defender.commercialPacts.filter((id) => id !== attackerId);
  }

  const warId = `war_${state.nextId++}`;
  const warGoalCfg = WAR_GOAL_CONFIGS[warGoal];
  const warName = `${warGoalCfg.nameTr}: ${attacker.name} vs ${defender.name}`;

  const war: WarState = {
    id: warId,
    name: warName,
    declaredAtMs: state.timeMs,
    attackerId,
    attackerWarGoal: warGoal,
    defenderId,
    defenderWarGoal: 'humiliation', // Standard defender counter-goal
    attackerExhaustion: 0,
    defenderExhaustion: 0,
    attackerOccupation: 0,
    defenderOccupation: 0,
    battlesWonByAttacker: 0,
    battlesWonByDefender: 0,
    status: 'active',
  };

  state.wars[warId] = war;

  state.eventLog.push({
    id: `event_war_declared_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'war_declared',
    playerId: attackerId,
    description: `🚨 SAVAŞ İLANI: ${attacker.name}, "${warGoalCfg.nameTr}" hedefiyle ${defender.name} imparatorluğuna resmi savaş ilan etti!`,
    metadata: { warId, attackerId, defenderId, warGoal },
  });

  return { success: true, warId };
}

/**
 * Resolves peace proposals (surrender, status_quo, white_peace)
 */
export function offerPeace(
  state: GameState,
  proposerId: string,
  warId: string,
  proposalType: 'surrender' | 'status_quo' | 'white_peace'
): { success: boolean; error?: string; outcome?: string } {
  state.wars = state.wars || {};
  state.subjects = state.subjects || {};
  state.truces = state.truces || {};

  const war = state.wars[warId];
  if (!war || war.status !== 'active') {
    return { success: false, error: 'Aktif bir savaş bulunamadı.' };
  }

  if (proposerId !== war.attackerId && proposerId !== war.defenderId) {
    return { success: false, error: 'Bu savaşın tarafı değilsiniz.' };
  }

  const isAttacker = proposerId === war.attackerId;
  const opponentId = isAttacker ? war.defenderId : war.attackerId;
  const attacker = state.players[war.attackerId];
  const defender = state.players[war.defenderId];

  // Ten-minute mutual truce
  const truceDurationMs = 600000;
  const sortedPair = [war.attackerId, war.defenderId].sort();
  const truceKey = `${sortedPair[0]}_${sortedPair[1]}`;
  state.truces[truceKey] = state.timeMs + truceDurationMs;

  war.concludedAtMs = state.timeMs;

  let outcomeDesc = '';

  if (proposalType === 'surrender') {
    // Proposer surrenders to Opponent!
    const winnerId = opponentId;
    const loserId = proposerId;
    const winnerIsAttacker = winnerId === war.attackerId;
    const warGoal = winnerIsAttacker ? war.attackerWarGoal : war.defenderWarGoal;

    war.status = winnerIsAttacker ? 'attacker_victory' : 'defender_victory';

    // Enact winner's warGoal!
    switch (warGoal) {
      case 'subjugation': {
        state.subjects[loserId] = {
          subjectId: loserId,
          overlordId: winnerId,
          type: 'vassal',
          establishedAtMs: state.timeMs,
          titheRate: 0.15,
          loyalty: 40,
        };
        const loser = state.players[loserId];
        const winner = state.players[winnerId];
        if (loser) loser.overlordId = winnerId;
        if (winner) {
          winner.subjects = winner.subjects || [];
          if (!winner.subjects.includes(loserId)) winner.subjects.push(loserId);
        }
        outcomeDesc = `${loser?.name || 'Mağlup'}, ${winner?.name || 'Galip'} imparatorluğunun Vasalı (Vassal) olmayı kabul etti.`;
        break;
      }

      case 'tributary': {
        state.subjects[loserId] = {
          subjectId: loserId,
          overlordId: winnerId,
          type: 'tributary',
          establishedAtMs: state.timeMs,
          titheRate: 0.30,
          loyalty: 20,
        };
        const loser = state.players[loserId];
        const winner = state.players[winnerId];
        if (loser) loser.overlordId = winnerId;
        if (winner) {
          winner.subjects = winner.subjects || [];
          if (!winner.subjects.includes(loserId)) winner.subjects.push(loserId);
        }
        outcomeDesc = `${loser?.name || 'Mağlup'}, ${winner?.name || 'Galip'} imparatorluğuna %30 Haraç ödemeyi kabul etti.`;
        break;
      }

      case 'conquest': {
        // Transfer loser's non-homeworld colonies to winner
        const loserColonies = Object.values(state.planets).filter(
          (p) => p.ownerId === loserId && !p.isHomeworld
        );
        let transferred = 0;
        for (const col of loserColonies) {
          col.ownerId = winnerId;
          transferred++;
        }
        outcomeDesc = `${transferred} adet koloni ${state.players[winnerId]?.name} kontrolüne devredildi.`;
        break;
      }

      case 'liberation': {
        // Free loser's subjects
        const loserSubjects = Object.values(state.subjects).filter(
          (s) => s.overlordId === loserId
        );
        for (const sub of loserSubjects) {
          delete state.subjects[sub.subjectId];
          const freed = state.players[sub.subjectId];
          if (freed) freed.overlordId = null;
        }
        const loser = state.players[loserId];
        if (loser) loser.subjects = [];
        outcomeDesc = `${loser?.name} boyunduruğundaki tüm vasallar bağımsızlığına kavuştu.`;
        break;
      }

      case 'humiliation': {
        if (state.traditions && state.traditions[winnerId]) {
          state.traditions[winnerId].unity += 300;
        }
        outcomeDesc = `${state.players[winnerId]?.name} galibiyetle +300 Kültürel Birlik (Unity) kazandı.`;
        break;
      }
    }
  } else if (proposalType === 'status_quo') {
    war.status = 'status_quo';
    outcomeDesc = 'Mevcut askeri hatlar korunarak Status Quo barışı ilan edildi.';
  } else {
    war.status = 'white_peace';
    outcomeDesc = 'Tüm sınırlar savaş öncesi durumuna döndürülerek Beyaz Barış sağlandı.';
  }

  state.eventLog.push({
    id: `event_peace_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'peace_concluded',
    playerId: proposerId,
    description: `🕊️ BARIŞ ANTLAŞMASI: ${war.name} savaşı sona erdi! (${outcomeDesc})`,
    metadata: { warId, proposalType, status: war.status },
  });

  return { success: true, outcome: outcomeDesc };
}

/**
 * Sets subject agreement terms
 */
export function setSubjectTerms(
  state: GameState,
  overlordId: string,
  subjectId: string,
  subjectType: SubjectType,
  titheRate: number
): { success: boolean; error?: string } {
  state.subjects = state.subjects || {};
  const ag = state.subjects[subjectId];
  if (!ag || ag.overlordId !== overlordId) {
    return { success: false, error: 'Bu devlet üzerinde vasallık yetkiniz bulunmamaktadır.' };
  }

  ag.type = subjectType;
  ag.titheRate = Math.max(-0.25, Math.min(0.50, titheRate));

  state.eventLog.push({
    id: `event_terms_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'subject_terms_updated',
    playerId: overlordId,
    description: `📜 VASALLIK SÖZLEŞMESİ GÜNCELLENDİ: ${state.players[subjectId]?.name} için sözleşme tipi "${SUBJECT_TYPE_CONFIGS[subjectType].nameTr}", haraç oranı %${Math.round(ag.titheRate * 100)} olarak ayarlandı.`,
    metadata: { subjectId, subjectType, titheRate: ag.titheRate },
  });

  return { success: true };
}

/**
 * Releases a subject peaceably granting full independence
 */
export function releaseSubject(
  state: GameState,
  overlordId: string,
  subjectId: string
): { success: boolean; error?: string } {
  state.subjects = state.subjects || {};
  const ag = state.subjects[subjectId];
  if (!ag || ag.overlordId !== overlordId) {
    return { success: false, error: 'Bu devlet üzerinde vasallık yetkiniz bulunmamaktadır.' };
  }

  delete state.subjects[subjectId];
  const subject = state.players[subjectId];
  const overlord = state.players[overlordId];
  if (subject) subject.overlordId = null;
  if (overlord && overlord.subjects) {
    overlord.subjects = overlord.subjects.filter((id) => id !== subjectId);
  }

  state.eventLog.push({
    id: `event_release_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'subject_released',
    playerId: overlordId,
    description: `🕊️ BAĞIMSIZLIK TANINDI: ${overlord?.name}, ${subject?.name} devletine tam bağımsızlığını tanıdı.`,
    metadata: { subjectId, overlordId },
  });

  return { success: true };
}

/**
 * Begins annexation/integration of a vassal into overlord empire
 */
export function integrateSubject(
  state: GameState,
  overlordId: string,
  subjectId: string
): { success: boolean; error?: string } {
  state.subjects = state.subjects || {};
  const ag = state.subjects[subjectId];
  if (!ag || ag.overlordId !== overlordId) {
    return { success: false, error: 'Bu devlet üzerinde vasallık yetkiniz bulunmamaktadır.' };
  }

  if (ag.type !== 'vassal') {
    return { success: false, error: 'Yalnızca Askeri Vasallar (Vassal) entegre edilebilir; haraçgüzarlar önce vasala dönüştürülmelidir.' };
  }

  if (ag.integrationProgress !== undefined) {
    return { success: false, error: 'Entegrasyon süreci zaten başlatılmış durumda.' };
  }

  ag.integrationProgress = 0;

  state.eventLog.push({
    id: `event_integrate_start_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'subject_integration_started',
    playerId: overlordId,
    description: `🏛️ İLHAK SÜRECİ BAŞLATILDI: ${state.players[subjectId]?.name} devletinin ${state.players[overlordId]?.name} sınırlarına entegrasyonu başladı!`,
    metadata: { subjectId, overlordId },
  });

  return { success: true };
}
