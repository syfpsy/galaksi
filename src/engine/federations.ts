import {
  FederationActiveVote,
  FederationFleetContributionType,
  FederationLaws,
  FederationState,
  FederationSuccessionType,
  FederationType,
  FederationWarVoteType,
  GameState,
  ResearchType,
  ShipType,
} from './types';
import { calculateDiplomaticWeight } from './senate';
import { SHIP_STATS } from './constants';

export interface FederationTypeConfig {
  type: FederationType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  perksTr: string;
  diplomaticWeightBonus?: number;
  unityMultiplier?: number;
  damageBonus?: number;
  admiralXpMultiplier?: number;
  fleetCapBonus?: number;
  researchSpeedMultiplier?: number;
  tradeValueMultiplier?: number;
  presidentResourceBonus?: number;
  memberDefenseBonus?: number;
}

export const FEDERATION_TYPE_CONFIGS: Record<FederationType, FederationTypeConfig> = {
  galactic_union: {
    type: 'galactic_union',
    nameTr: 'Galaktik Birlik (Galactic Union)',
    descriptionTr: 'Eşitlikçi, çok taraflı ve diplomatik uyumu önceleyen evrensel ittifak federasyonu.',
    icon: '🌐',
    perksTr: '+%20 Diplomatik Ağırlık, +%10 Kültürel Birlik, +2 Elçi Etkinliği, Yüksek Uyum Artışı.',
    diplomaticWeightBonus: 0.20,
    unityMultiplier: 1.10,
  },
  martial_alliance: {
    type: 'martial_alliance',
    nameTr: 'Askeri İttifak (Martial Alliance)',
    descriptionTr: 'Ortak savunma ve galaktik caydırıcılık odaklı askeri pakt. Federal donanmayı güçlendirir.',
    icon: '⚔️',
    perksTr: '+%15 Gemi Silah Hasarı, +%20 Amiral DP, +%25 Federal Donanma Kapasitesi.',
    damageBonus: 0.15,
    admiralXpMultiplier: 1.20,
    fleetCapBonus: 0.25,
  },
  research_cooperative: {
    type: 'research_cooperative',
    nameTr: 'Araştırma İşbirliği (Research Cooperative)',
    descriptionTr: 'Teknolojik ilerleme ve bilimsel atılım konsorsiyumu. Üyeler arası araştırma hızını artırır.',
    icon: '🔬',
    perksTr: 'Otomatik Karşılıklı Teknoloji Paktı, +%20 Araştırma Hızı, En Yüksek Teknoloji Düzeyi Paylaşımı.',
    researchSpeedMultiplier: 1.20,
  },
  trade_league: {
    type: 'trade_league',
    nameTr: 'Ticaret Birliği (Trade League)',
    descriptionTr: 'Galaktik ticaret ağlarını ve hiperuzay rotalarını tek bir ekonomik havuzda toplayan birlik.',
    icon: '🪙',
    perksTr: '+%25 Toplanan Ticaret Değeri, Ticaret Birliği Dönüşüm Politikası, Sıfır Gümrük/Tarife Kaybı.',
    tradeValueMultiplier: 1.25,
  },
  hegemony: {
    type: 'hegemony',
    nameTr: 'Hegemonya Koalisyonu (Hegemony)',
    descriptionTr: 'Başkanın mutlak otoriteye sahip olduğu piramitsel emperyal federasyon.',
    icon: '👑',
    perksTr: 'Başkan Federal Vergilerden +%30 Kaynak Geliri alır; Üyeler +%15 Savunma Gücü ve Koruma kazanır.',
    presidentResourceBonus: 0.30,
    memberDefenseBonus: 0.15,
  },
};

/**
 * Returns the federation a player belongs to, if any
 */
export function getPlayerFederation(state: GameState, playerId: string): FederationState | null {
  if (!state.federations) return null;
  for (const fed of Object.values(state.federations)) {
    if (fed.members.includes(playerId)) {
      return fed;
    }
  }
  return null;
}

/**
 * Checks if two players are in the same federation
 */
export function isFederationAlly(state: GameState, playerAId: string, playerBId: string): boolean {
  if (!state.federations || playerAId === playerBId) return false;
  const fedA = getPlayerFederation(state, playerAId);
  return fedA !== null && fedA.members.includes(playerBId);
}

/**
 * Calculates military power of the federal fleet
 */
export function getFederalFleetPower(fed: FederationState): number {
  const f = fed.federalFleet;
  return (f.scout || 0) * 1 + (f.transport || 0) * 2 + (f.fighter || 0) * 12 + (f.battleship || 0) * 50;
}

/**
 * Recalculates highest tech level across all federation members
 */
export function calculateCompositeTechLevels(state: GameState, fed: FederationState): Record<ResearchType, number> {
  const composite: Record<ResearchType, number> = { engines: 0, weapons: 0, sensors: 0 };
  for (const memberId of fed.members) {
    const member = state.players[memberId];
    if (member && member.research) {
      composite.engines = Math.max(composite.engines, member.research.engines || 0);
      composite.weapons = Math.max(composite.weapons, member.research.weapons || 0);
      composite.sensors = Math.max(composite.sensors, member.research.sensors || 0);
    }
  }
  return composite;
}

/**
 * Calculates Federal Naval Capacity based on members' fleet sizes and laws
 */
export function calculateFederalFleetCapacity(state: GameState, fed: FederationState): number {
  let rate = 0;
  if (fed.laws.fleetContribution === 'low') rate = 0.10;
  else if (fed.laws.fleetContribution === 'medium') rate = 0.20;
  else if (fed.laws.fleetContribution === 'high') rate = 0.30;

  let totalContrib = 0;
  for (const memberId of fed.members) {
    const memberPlanets = Object.values(state.planets).filter((p) => p.ownerId === memberId);
    let memberShipCount = 0;
    for (const p of memberPlanets) {
      memberShipCount += (p.garrison.scout || 0) + (p.garrison.transport || 0) + (p.garrison.fighter || 0) + (p.garrison.battleship || 0);
    }
    totalContrib += Math.floor(memberShipCount * rate);
  }

  // Base pool of 20 ships + contributed + martial alliance bonus
  let baseCap = 20 + totalContrib + fed.centralizationLevel * 5;
  if (fed.type === 'martial_alliance') {
    baseCap = Math.floor(baseCap * 1.25);
  }
  return baseCap;
}

/**
 * Forms a new federation between two empires
 */
export function formFederation(
  state: GameState,
  founderId: string,
  name: string,
  fedType: FederationType,
  invitedPlayerId: string
): { success: boolean; error?: string; federation?: FederationState } {
  state.federations = state.federations || {};

  const founder = state.players[founderId];
  const invited = state.players[invitedPlayerId];

  if (!founder || !invited) {
    return { success: false, error: 'İmparatorluk bulunamadı.' };
  }

  if (founderId === invitedPlayerId) {
    return { success: false, error: 'Kendi kendinizle federasyon kuramazsınız.' };
  }

  if (founder.federationId || getPlayerFederation(state, founderId)) {
    return { success: false, error: 'Zaten bir federasyona üyesiniz.' };
  }

  if (invited.federationId || getPlayerFederation(state, invitedPlayerId)) {
    return { success: false, error: 'Davet edilen imparatorluk zaten bir federasyona üye.' };
  }

  // Truce or War check
  if (state.wars) {
    for (const war of Object.values(state.wars)) {
      if (war.status === 'active' && ((war.attackerId === founderId && war.defenderId === invitedPlayerId) || (war.attackerId === invitedPlayerId && war.defenderId === founderId))) {
        return { success: false, error: 'Aktif bir savaş yürüttüğünüz imparatorlukla federasyon kuramazsınız.' };
      }
    }
  }

  const fedId = `fed_${state.nextId++}`;
  const defaultLaws: FederationLaws = {
    successionType: 'rotation',
    warVoteType: 'majority',
    fleetContribution: 'low',
  };

  const newFed: FederationState = {
    id: fedId,
    name: name.trim() || `${founder.name} Federasyonu`,
    type: fedType,
    founderId,
    presidentId: founderId,
    members: [founderId, invitedPlayerId],
    pendingInvites: [],
    centralizationLevel: 1,
    experience: 0,
    cohesion: 50,
    laws: defaultLaws,
    activeVote: null,
    assignedEnvoys: {
      [founderId]: 1,
      [invitedPlayerId]: 1,
    },
    federalFleet: {
      scout: 0,
      transport: 0,
      fighter: 2,
      battleship: 0,
    },
    federalFleetCapacity: 25,
    termStartedAtMs: state.timeMs,
    lastCohesionUpdateMs: state.timeMs,
    compositeTechLevels: { engines: 0, weapons: 0, sensors: 0 },
  };

  newFed.compositeTechLevels = calculateCompositeTechLevels(state, newFed);
  newFed.federalFleetCapacity = calculateFederalFleetCapacity(state, newFed);

  state.federations[fedId] = newFed;
  founder.federationId = fedId;
  founder.assignedFederationEnvoys = 1;
  invited.federationId = fedId;
  invited.assignedFederationEnvoys = 1;

  state.eventLog.push({
    id: `event_fed_formed_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federation_formed',
    playerId: founderId,
    description: `🌐 YENİ FEDERASYON: ${founder.name} ve ${invited.name}, "${newFed.name}" (${FEDERATION_TYPE_CONFIGS[fedType].nameTr}) çatısı altında birleşti!`,
    metadata: { federationId: fedId, founderId, invitedPlayerId, fedType },
  });

  return { success: true, federation: newFed };
}

/**
 * Invites an empire to an existing federation
 */
export function inviteToFederation(
  state: GameState,
  inviterId: string,
  federationId: string,
  targetPlayerId: string
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(inviterId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  const target = state.players[targetPlayerId];
  if (!target) return { success: false, error: 'Hedef imparatorluk bulunamadı.' };

  if (fed.members.includes(targetPlayerId)) {
    return { success: false, error: 'Hedef imparatorluk zaten bu federasyona üye.' };
  }

  if (target.federationId || getPlayerFederation(state, targetPlayerId)) {
    return { success: false, error: 'Hedef imparatorluk başka bir federasyona üye.' };
  }

  if (fed.pendingInvites.includes(targetPlayerId)) {
    return { success: false, error: 'Bu imparatorluğa zaten bekleyen bir davet var.' };
  }

  fed.pendingInvites.push(targetPlayerId);

  state.eventLog.push({
    id: `event_fed_invite_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federation_invite_sent',
    playerId: inviterId,
    description: `✉️ FEDERASYON DAVETİ: ${state.players[inviterId]?.name}, ${target.name} imparatorluğunu "${fed.name}" federasyonuna davet etti.`,
    metadata: { federationId, targetPlayerId },
  });

  return { success: true };
}

/**
 * Responds to a federation invitation
 */
export function respondFederationInvite(
  state: GameState,
  responderId: string,
  federationId: string,
  accept: boolean
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.pendingInvites.includes(responderId)) {
    return { success: false, error: 'Bekleyen bir federasyon daveti bulunamadı.' };
  }

  fed.pendingInvites = fed.pendingInvites.filter((id) => id !== responderId);

  const responder = state.players[responderId];
  if (!accept) {
    state.eventLog.push({
      id: `event_fed_rejected_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'federation_invite_rejected',
      playerId: responderId,
      description: `❌ DAVET REDDEDİLDİ: ${responder?.name}, "${fed.name}" federasyonuna katılma davetini reddetti.`,
      metadata: { federationId, responderId },
    });
    return { success: true };
  }

  fed.members.push(responderId);
  fed.assignedEnvoys[responderId] = 1;
  if (responder) {
    responder.federationId = federationId;
    responder.assignedFederationEnvoys = 1;
  }

  fed.compositeTechLevels = calculateCompositeTechLevels(state, fed);
  fed.federalFleetCapacity = calculateFederalFleetCapacity(state, fed);
  // Member joining gives small cohesion boost
  fed.cohesion = Math.min(100, fed.cohesion + 15);

  state.eventLog.push({
    id: `event_fed_joined_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federation_member_joined',
    playerId: responderId,
    description: `🤝 YENİ FEDERASYON ÜYESİ: ${responder?.name}, "${fed.name}" federasyonuna katıldı!`,
    metadata: { federationId, responderId },
  });

  return { success: true };
}

/**
 * Leaves a federation
 */
export function leaveFederation(
  state: GameState,
  playerId: string,
  federationId: string
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(playerId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  // Hegemony rule: non-presidents cannot leave without declaring independence or being kicked
  if (fed.type === 'hegemony' && fed.presidentId !== playerId && fed.members.length > 2) {
    return { success: false, error: 'Hegemonya Federasyonlarında üyeler barışçıl ayrılamaz; bağımsızlık savaşı açılmalıdır.' };
  }

  fed.members = fed.members.filter((id) => id !== playerId);
  delete fed.assignedEnvoys[playerId];
  const leaver = state.players[playerId];
  if (leaver) {
    leaver.federationId = null;
    leaver.assignedFederationEnvoys = 0;
  }

  // Cohesion penalty
  fed.cohesion = Math.max(-100, fed.cohesion - 30);

  // If president left, transfer presidency
  if (fed.presidentId === playerId) {
    fed.presidentId = fed.members[0] || '';
    fed.termStartedAtMs = state.timeMs;
  }

  // If fewer than 2 members remain, disband federation
  if (fed.members.length < 2) {
    const lastMemberId = fed.members[0];
    if (lastMemberId && state.players[lastMemberId]) {
      state.players[lastMemberId].federationId = null;
      state.players[lastMemberId].assignedFederationEnvoys = 0;
    }
    delete state.federations[federationId];

    state.eventLog.push({
      id: `event_fed_disbanded_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'federation_disbanded',
      playerId,
      description: `💥 FEDERASYON DAĞILDI: Üye sayısı yetersiz kaldığı için "${fed.name}" federasyonu feshedildi.`,
      metadata: { federationId },
    });
    return { success: true };
  }

  fed.compositeTechLevels = calculateCompositeTechLevels(state, fed);
  fed.federalFleetCapacity = calculateFederalFleetCapacity(state, fed);

  state.eventLog.push({
    id: `event_fed_left_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federation_member_left',
    playerId,
    description: `🚪 AYRILIK: ${leaver?.name}, "${fed.name}" federasyonundan ayrıldı.`,
    metadata: { federationId, playerId },
  });

  return { success: true };
}

/**
 * Proposes a change in federal laws
 */
export function proposeFederationLaw(
  state: GameState,
  proposerId: string,
  federationId: string,
  lawType: 'successionType' | 'warVoteType' | 'fleetContribution',
  proposedValue: string
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(proposerId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  if (fed.activeVote) {
    return { success: false, error: 'Halen devam eden aktif bir yasa oylaması bulunmaktadır.' };
  }

  // Centralization level requirements
  if (lawType === 'fleetContribution') {
    if (proposedValue === 'medium' && fed.centralizationLevel < 3) {
      return { success: false, error: 'Orta seviye katkı için Seviye 3 Entegre Federasyon gerekir.' };
    }
    if (proposedValue === 'high' && fed.centralizationLevel < 4) {
      return { success: false, error: 'Yüksek seviye katkı için Seviye 4 Konfederasyon gerekir.' };
    }
  }

  if (lawType === 'successionType') {
    if (proposedValue === 'diplomatic_weight' && fed.centralizationLevel < 2) {
      return { success: false, error: 'Diplomatik Ağırlık veraseti için en az Seviye 2 gerekir.' };
    }
    if (proposedValue === 'fleet_power' && fed.centralizationLevel < 3) {
      return { success: false, error: 'Donanma Gücü veraseti için en az Seviye 3 gerekir.' };
    }
    if (proposedValue === 'golden_rule' && fed.centralizationLevel < 4) {
      return { success: false, error: 'Zenginlik (Golden Rule) veraseti için en az Seviye 4 gerekir.' };
    }
  }

  const voteId = `vote_fed_${state.nextId++}`;
  fed.activeVote = {
    id: voteId,
    lawType,
    proposedValue,
    proposerId,
    votes: {
      [proposerId]: 'yes',
    },
    deadlineMs: state.timeMs + 90000, // 90 seconds voting window
  };

  state.eventLog.push({
    id: `event_fed_law_prop_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federation_law_proposed',
    playerId: proposerId,
    description: `📜 FEDERAL YASA TEKLİFİ: ${state.players[proposerId]?.name}, ${lawType} yasasını "${proposedValue}" olarak değiştirmeyi önerdi.`,
    metadata: { federationId, lawType, proposedValue },
  });

  return { success: true };
}

/**
 * Casts a vote on the active federal law proposal
 */
export function voteFederationLaw(
  state: GameState,
  voterId: string,
  federationId: string,
  vote: 'yes' | 'no'
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(voterId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  if (!fed.activeVote) {
    return { success: false, error: 'Aktif bir federal oylama bulunamadı.' };
  }

  fed.activeVote.votes[voterId] = vote;

  // Check if all members have voted or clear majority/failure reached
  const yesVotes = Object.values(fed.activeVote.votes).filter((v) => v === 'yes').length;
  const noVotes = Object.values(fed.activeVote.votes).filter((v) => v === 'no').length;
  const allVoted = fed.members.every((mId) => fed.activeVote!.votes[mId] !== undefined);
  const majorityPassed = yesVotes > fed.members.length / 2;
  const majorityFailed = noVotes >= Math.ceil(fed.members.length / 2);

  if (allVoted || majorityPassed || majorityFailed) {
    resolveActiveVote(state, fed);
  }

  return { success: true };
}

/**
 * Resolves active vote and applies law change
 */
function resolveActiveVote(state: GameState, fed: FederationState): void {
  if (!fed.activeVote) return;

  const vote = fed.activeVote;
  const yesVotes = Object.values(vote.votes).filter((v) => v === 'yes').length;
  const totalVotes = fed.members.length;
  const passed = yesVotes > totalVotes / 2;

  if (passed) {
    if (vote.lawType === 'successionType') {
      fed.laws.successionType = vote.proposedValue as FederationSuccessionType;
    } else if (vote.lawType === 'warVoteType') {
      fed.laws.warVoteType = vote.proposedValue as FederationWarVoteType;
    } else if (vote.lawType === 'fleetContribution') {
      fed.laws.fleetContribution = vote.proposedValue as FederationFleetContributionType;
      fed.federalFleetCapacity = calculateFederalFleetCapacity(state, fed);
    }

    state.eventLog.push({
      id: `event_fed_law_enacted_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'federation_law_enacted',
      playerId: fed.presidentId,
      description: `⚖️ YASA KABUL EDİLDİ: "${fed.name}" federasyonunda ${vote.lawType} yasası "${vote.proposedValue}" olarak yürürlüğe girdi (${yesVotes}/${totalVotes}).`,
      metadata: { federationId: fed.id, lawType: vote.lawType, value: vote.proposedValue },
    });
  } else {
    state.eventLog.push({
      id: `event_fed_law_rejected_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'federation_law_rejected',
      playerId: fed.presidentId,
      description: `❌ YASA REDDEDİLDİ: "${fed.name}" federasyonunda ${vote.lawType} yasa teklifi reddedildi (${yesVotes}/${totalVotes}).`,
      metadata: { federationId: fed.id },
    });
  }

  fed.activeVote = null;
}

/**
 * Assigns diplomatic envoys to a federation to maintain cohesion
 */
export function assignFederationEnvoys(
  state: GameState,
  playerId: string,
  federationId: string,
  envoys: number
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(playerId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  const clamped = Math.max(0, Math.min(3, envoys));
  fed.assignedEnvoys[playerId] = clamped;
  const player = state.players[playerId];
  if (player) {
    player.assignedFederationEnvoys = clamped;
  }

  return { success: true };
}

/**
 * Builds a federal ship at a planet's shipyard
 */
export function buildFederalShip(
  state: GameState,
  builderId: string,
  federationId: string,
  planetId: string,
  shipType: ShipType,
  count: number
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  if (!fed.members.includes(builderId)) {
    return { success: false, error: 'Bu federasyonun üyesi değilsiniz.' };
  }

  // Non-presidents can only build federal ships if centralization level >= 3
  if (fed.presidentId !== builderId && fed.centralizationLevel < 3) {
    return { success: false, error: 'Federal gemi inşası yalnızca Federasyon Başkanı veya Seviye 3+ federasyon üyeleri tarafından yapılabilir.' };
  }

  const planet = state.planets[planetId];
  if (!planet || planet.ownerId !== builderId) {
    return { success: false, error: 'Gezegen veya tersane bulunamadı.' };
  }

  if ((planet.buildings?.shipyard || 0) < 1) {
    return { success: false, error: 'Gezegende faal bir Tersane bulunmalıdır.' };
  }

  // Naval cap check
  const currentTotalShips = Object.values(fed.federalFleet).reduce((a, b) => a + b, 0);
  if (currentTotalShips + count > fed.federalFleetCapacity) {
    return { success: false, error: `Federal donanma kapasitesi aşılamaz (${currentTotalShips}/${fed.federalFleetCapacity}).` };
  }

  // Calculate construction costs with 20% federal discount
  const baseCost = SHIP_STATS[shipType]?.cost || { ore: 300, crystal: 150, fuel: 80 };
  const totalCost = {
    ore: Math.floor(baseCost.ore * count * 0.8),
    crystal: Math.floor(baseCost.crystal * count * 0.8),
    fuel: Math.floor(baseCost.fuel * count * 0.8),
  };

  if (
    planet.resources.ore < totalCost.ore ||
    planet.resources.crystal < totalCost.crystal ||
    planet.resources.fuel < totalCost.fuel
  ) {
    return { success: false, error: 'Federal gemi inşası için yetersiz kaynak.' };
  }

  planet.resources.ore -= totalCost.ore;
  planet.resources.crystal -= totalCost.crystal;
  planet.resources.fuel -= totalCost.fuel;

  fed.federalFleet[shipType] = (fed.federalFleet[shipType] || 0) + count;

  state.eventLog.push({
    id: `event_fed_ship_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federal_ship_built',
    playerId: builderId,
    description: `🚀 FEDERAL GEMİ ÜRETİLDİ: ${planet.name} tersanesinde ${count}x ${shipType} üretilerek Federal Donanmaya katıldı!`,
    metadata: { federationId, shipType, count },
  });

  return { success: true };
}

/**
 * Dispatches a detachment from the Federal Fleet to a target system
 */
export function dispatchFederalFleet(
  state: GameState,
  commanderId: string,
  federationId: string,
  originPlanetId: string,
  targetSystemId: string,
  ships: Record<ShipType, number>
): { success: boolean; error?: string } {
  state.federations = state.federations || {};
  const fed = state.federations[federationId];
  if (!fed) return { success: false, error: 'Federasyon bulunamadı.' };

  // Only President can order federal fleet deployment
  if (fed.presidentId !== commanderId) {
    return { success: false, error: 'Federal Donanmayı yalnızca mevcut Federasyon Başkanı sevk edebilir.' };
  }

  const originPlanet = state.planets[originPlanetId];
  if (!originPlanet || originPlanet.ownerId !== commanderId) {
    return { success: false, error: 'Başlangıç gezegeni bulunamadı.' };
  }

  const targetSys = state.map.systems[targetSystemId];
  if (!targetSys) {
    return { success: false, error: 'Hedef yıldız sistemi bulunamadı.' };
  }

  let totalDispatched = 0;
  for (const st of ['scout', 'transport', 'fighter', 'battleship'] as ShipType[]) {
    const want = ships[st] || 0;
    if (want > (fed.federalFleet[st] || 0)) {
      return { success: false, error: `Federal donanmada yeterli ${st} bulunmamaktadır.` };
    }
    totalDispatched += want;
  }

  if (totalDispatched === 0) {
    return { success: false, error: 'Sevk edilecek en az bir gemi seçilmelidir.' };
  }

  // Deduct from federal fleet pool and transfer to a federal fleet
  for (const st of ['scout', 'transport', 'fighter', 'battleship'] as ShipType[]) {
    fed.federalFleet[st] = (fed.federalFleet[st] || 0) - (ships[st] || 0);
  }

  const fleetId = `fleet_fed_${state.nextId++}`;
  const now = state.timeMs;
  const travelDurationMs = 45000; // Federal fleets have hyperlane speed boost

  state.fleets[fleetId] = {
    id: fleetId,
    name: `Federal Görev Gücü #${fleetId.slice(-3)}`,
    ownerId: commanderId,
    ships: { ...ships },
    cargo: { ore: 0, crystal: 0, fuel: 0 },
    originSystemId: originPlanet.systemId,
    targetSystemId,
    path: [originPlanet.systemId, targetSystemId],
    pathIndex: 0,
    mission: 'attack',
    departureTime: now,
    arrivalTime: now + travelDurationMs,
    totalDistance: 100,
    speed: 1.5,
    fuelCost: 0,
    recallLockedAfterTime: now + travelDurationMs / 2,
    isReturning: false,
    status: 'in_transit',
    doctrine: 'fortress',
  };

  state.eventLog.push({
    id: `event_fed_dispatch_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'federal_fleet_dispatched',
    playerId: commanderId,
    description: `🌟 FEDERAL DONANMA SEVK EDİLDİ: Başkan ${state.players[commanderId]?.name}, ${targetSys.name} sistemine ${totalDispatched} parçalık Federal Görev Gücü sevk etti!`,
    metadata: { federationId, targetSystemId, ships },
  });

  return { success: true };
}

/**
 * Passive tick update for federations: cohesion drift, experience, levels, elections, and tithes
 */
export function updateFederations(state: GameState, deltaMs: number): void {
  if (!state.federations || deltaMs <= 0) return;

  const minutesElapsed = deltaMs / 60000;
  const hoursElapsed = deltaMs / 3600000;

  for (const fed of Object.values(state.federations)) {
    // 1. Cohesion drift
    let totalEnvoys = 0;
    for (const memberId of fed.members) {
      totalEnvoys += fed.assignedEnvoys[memberId] || 0;
    }

    // Galactic Union gets +1 base cohesion
    let cohesionRate = totalEnvoys * 0.8 - (fed.members.length - 2) * 0.3;
    if (fed.type === 'galactic_union') cohesionRate += 1.0;

    fed.cohesion = Math.max(-100, Math.min(100, fed.cohesion + cohesionRate * minutesElapsed));

    // 2. Experience & Centralization Level progression
    let xpGain = 0;
    if (fed.cohesion >= 75) {
      xpGain = 3.0 * minutesElapsed;
    } else if (fed.cohesion >= 40) {
      xpGain = 1.5 * minutesElapsed;
    } else if (fed.cohesion < -20) {
      xpGain = -1.0 * minutesElapsed;
    }

    fed.experience = Math.max(0, Math.min(1000, fed.experience + xpGain));

    // Centralization Level thresholds:
    // Level 1: 0-199, Level 2: 200-399, Level 3: 400-599, Level 4: 600-799, Level 5: 800-1000
    const calculatedLevel = Math.min(5, Math.max(1, Math.floor(fed.experience / 200) + 1));
    if (calculatedLevel !== fed.centralizationLevel) {
      fed.centralizationLevel = calculatedLevel;
      fed.federalFleetCapacity = calculateFederalFleetCapacity(state, fed);

      state.eventLog.push({
        id: `event_fed_level_${state.nextId++}`,
        timeMs: state.timeMs,
        type: 'federation_level_up',
        playerId: fed.presidentId,
        description: `⭐ MERKEZİLEŞME YÜKSELDİ: "${fed.name}" federasyonu Seviye ${calculatedLevel} düzeyine ulaştı!`,
        metadata: { federationId: fed.id, level: calculatedLevel },
      });
    }

    // 3. Composite Tech recalculation
    fed.compositeTechLevels = calculateCompositeTechLevels(state, fed);

    // 4. Presidency Election / Rotation (Term: 10 minutes = 600,000 ms)
    const termDurationMs = 600000;
    if (state.timeMs - fed.termStartedAtMs >= termDurationMs) {
      evaluatePresidencySuccession(state, fed);
    }

    // 5. Active Vote Deadline Check
    if (fed.activeVote && state.timeMs >= fed.activeVote.deadlineMs) {
      resolveActiveVote(state, fed);
    }

    // 6. Hegemony President Resource Tithe
    if (fed.type === 'hegemony' && fed.members.length > 1) {
      const presidentHomeworld = Object.values(state.planets).find(
        (p) => p.ownerId === fed.presidentId && p.isHomeworld
      );
      if (presidentHomeworld) {
        for (const memberId of fed.members) {
          if (memberId === fed.presidentId) continue;
          const memberHw = Object.values(state.planets).find(
            (p) => p.ownerId === memberId && p.isHomeworld
          );
          if (memberHw) {
            const oreTithe = Math.floor(memberHw.resources.ore * 0.05 * hoursElapsed);
            const crystalTithe = Math.floor(memberHw.resources.crystal * 0.05 * hoursElapsed);
            const fuelTithe = Math.floor(memberHw.resources.fuel * 0.05 * hoursElapsed);

            memberHw.resources.ore = Math.max(0, memberHw.resources.ore - oreTithe);
            memberHw.resources.crystal = Math.max(0, memberHw.resources.crystal - crystalTithe);
            memberHw.resources.fuel = Math.max(0, memberHw.resources.fuel - fuelTithe);

            presidentHomeworld.resources.ore = Math.min(presidentHomeworld.storageCap, presidentHomeworld.resources.ore + oreTithe);
            presidentHomeworld.resources.crystal = Math.min(presidentHomeworld.storageCap, presidentHomeworld.resources.crystal + crystalTithe);
            presidentHomeworld.resources.fuel = Math.min(presidentHomeworld.storageCap, presidentHomeworld.resources.fuel + fuelTithe);
          }
        }
      }
    }
  }
}

/**
 * Evaluates and executes presidency succession based on federation laws
 */
function evaluatePresidencySuccession(state: GameState, fed: FederationState): void {
  fed.termStartedAtMs = state.timeMs;
  const currentPres = fed.presidentId;
  let nextPres = currentPres;

  const succession = fed.laws.successionType;

  if (succession === 'rotation') {
    const currentIndex = fed.members.indexOf(currentPres);
    const nextIndex = (currentIndex + 1) % fed.members.length;
    nextPres = fed.members[nextIndex];
  } else if (succession === 'diplomatic_weight') {
    let highestWeight = -1;
    for (const mId of fed.members) {
      const weight = calculateDiplomaticWeight(state, mId).total;
      if (weight > highestWeight) {
        highestWeight = weight;
        nextPres = mId;
      }
    }
  } else if (succession === 'fleet_power') {
    let highestFleet = -1;
    for (const mId of fed.members) {
      const planets = Object.values(state.planets).filter((p) => p.ownerId === mId);
      let power = 0;
      for (const p of planets) {
        power += (p.garrison.fighter || 0) * 10 + (p.garrison.battleship || 0) * 35;
      }
      for (const f of Object.values(state.fleets)) {
        if (f.ownerId === mId && f.status !== 'destroyed') {
          power += (f.ships.fighter || 0) * 10 + (f.ships.battleship || 0) * 35;
        }
      }
      if (power > highestFleet) {
        highestFleet = power;
        nextPres = mId;
      }
    }
  } else if (succession === 'golden_rule') {
    let highestTreasury = -1;
    for (const mId of fed.members) {
      const planets = Object.values(state.planets).filter((p) => p.ownerId === mId);
      let treasury = 0;
      for (const p of planets) {
        treasury += p.resources.ore + p.resources.crystal + p.resources.fuel;
      }
      if (treasury > highestTreasury) {
        highestTreasury = treasury;
        nextPres = mId;
      }
    }
  }

  if (nextPres !== currentPres) {
    fed.presidentId = nextPres;
    state.eventLog.push({
      id: `event_fed_pres_${state.nextId++}`,
      timeMs: state.timeMs,
      type: 'federation_president_elected',
      playerId: nextPres,
      description: `👑 YENİ FEDERASYON BAŞKANI: "${fed.name}" federasyonunda dönem başkanlığı ${state.players[nextPres]?.name} imparatorluğuna geçti! (${succession} kuralı).`,
      metadata: { federationId: fed.id, newPresidentId: nextPres, successionType: succession },
    });
  }
}
