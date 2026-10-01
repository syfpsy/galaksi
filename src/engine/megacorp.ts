import {
  CommodityFuturesContract,
  CorporateBranchOffice,
  CorporateCivicId,
  CorporateHoldingType,
  GameState,
  ResourceType,
  Resources,
} from './types';
import { getSpyNetworkKey } from './espionage';

export interface CorporateCivicConfig {
  id: CorporateCivicId;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  fleetCostDiscount?: number;
  navalCapBonus?: number;
  tradeYieldMultiplier?: number;
  marketFeeDiscount?: number;
  unityMultiplier?: number;
  diplomaticWeightMultiplier?: number;
  allowSubversiveBranches?: boolean;
}

export interface CorporateHoldingConfig {
  type: CorporateHoldingType;
  nameTr: string;
  descriptionTr: string;
  icon: string;
  cost: Resources;
  corpYieldDescriptionTr: string;
  hostYieldDescriptionTr: string;
  baseTradeBonus: number;
}

export const MEGACORP_CONSTANTS = {
  BRANCH_OFFICE_SETUP_COST: { ore: 150, crystal: 80, fuel: 100 } as Resources,
  MAX_HOLDINGS_PER_BRANCH: 3,
  BASE_DIVIDEND_INTERVAL_MS: 30_000,
  BASE_BRANCH_TRADE_YIELD: 15,
  BASE_HOST_TRADE_BONUS: 10,
  BASE_HOST_BONUS_YIELD: 10,
};

export const CORPORATE_CIVIC_CONFIGS: Record<CorporateCivicId, CorporateCivicConfig> = {
  arms_dealer: {
    id: 'arms_dealer',
    nameTr: 'Özel Askeri Şirket & Silah Karteli',
    descriptionTr: 'Filo inşa maliyetlerinde -%15 indirim, şube ofislerinde özel askeri yüklenici binaları +%25 donanma kapasitesi sağlar.',
    icon: '⚔️',
    fleetCostDiscount: 0.15,
    navalCapBonus: 0.25,
  },
  trade_syndicate: {
    id: 'trade_syndicate',
    nameTr: 'Galaktik Ticaret Karteli',
    descriptionTr: 'Şube ofislerinden elde edilen ticaret temettülerini +%30 artırır ve pazar komisyonlarını %50 düşürür.',
    icon: '💎',
    tradeYieldMultiplier: 1.30,
    marketFeeDiscount: 0.50,
  },
  media_conglomerate: {
    id: 'media_conglomerate',
    nameTr: 'Medya & Eğlence Holdingi',
    descriptionTr: 'Kültürel Birlik üretimini +%25 artırır, Senato diplomatik ağırlığına +%20 katkı sağlar.',
    icon: '📺',
    unityMultiplier: 1.25,
    diplomaticWeightMultiplier: 1.20,
  },
  shadow_consortium: {
    id: 'shadow_consortium',
    nameTr: 'Gölge Konsorsiyumu & Karartma Karteli',
    descriptionTr: 'Ticaret paktı olmadan da yabancı dünyalara gizli şube açabilir; şubeler hedefte pasif casusluk sızması üretir.',
    icon: '🕶️',
    allowSubversiveBranches: true,
  },
};

export const CORPORATE_HOLDING_CONFIGS: Record<CorporateHoldingType, CorporateHoldingConfig> = {
  corporate_embassy: {
    type: 'corporate_embassy',
    nameTr: 'Kurumsal Elçilik',
    descriptionTr: 'Yabancı hükümet nezdinde şirketin imtiyazlarını korur. Şirkete +15 Diplomatik Ağırlık, ev sahibine +5 Birlik sağlar.',
    icon: '🏛️',
    cost: { ore: 100, crystal: 50, fuel: 50 },
    corpYieldDescriptionTr: '+15 Diplomatik Ağırlık',
    hostYieldDescriptionTr: '+5 Birlik / Saat',
    baseTradeBonus: 5,
  },
  amusement_megaplex: {
    type: 'amusement_megaplex',
    nameTr: 'Eğlence Megakompleksi',
    descriptionTr: 'Gezegen nüfusuna lüks tüketim ve eğlence sunar. Şirkete +25 Ticaret Değeri, ev sahibine +%10 Gezegen Üretimi sağlar.',
    icon: '🎡',
    cost: { ore: 120, crystal: 80, fuel: 60 },
    corpYieldDescriptionTr: '+25 Ticaret Temettüsü',
    hostYieldDescriptionTr: '+%10 Koloni Üretim Primi',
    baseTradeBonus: 25,
  },
  private_military_contractor: {
    type: 'private_military_contractor',
    nameTr: 'Özel Askeri Yüklenici',
    descriptionTr: 'Özel güvenlik garnizonu konuşlandırır. Şirkete +15 Donanma Kapasitesi, ev sahibine +1 Savunma Bataryası desteği sağlar.',
    icon: '🛡️',
    cost: { ore: 150, crystal: 40, fuel: 80 },
    corpYieldDescriptionTr: '+15 Donanma Kapasitesi',
    hostYieldDescriptionTr: '+1 Gezegen Savunma Desteği',
    baseTradeBonus: 10,
  },
  logistics_freight_hub: {
    type: 'logistics_freight_hub',
    nameTr: 'Lojistik & Kargo Aktarma Merkezi',
    descriptionTr: 'Yıldızlararası nakliyat terminali. Hem şirkete (+20) hem ev sahibine (+15) ticaret değeri sağlar ve tedarik zincirini hızlandırır.',
    icon: '📦',
    cost: { ore: 140, crystal: 70, fuel: 90 },
    corpYieldDescriptionTr: '+20 Ticaret Değeri & Hızlı Nakliye',
    hostYieldDescriptionTr: '+15 Yerel Ticaret Değeri',
    baseTradeBonus: 20,
  },
  subversive_front: {
    type: 'subversive_front',
    nameTr: 'Örtülü Sızma Cephesi',
    descriptionTr: 'Şirket paravanı altında çalışan gizli istihbarat hücresi. Hedef imparatorluktaki casusluk ağına saniyede +0.05 ek sızma pompalar.',
    icon: '🕵️',
    cost: { ore: 80, crystal: 100, fuel: 80 },
    corpYieldDescriptionTr: '+0.05/sn Casusluk Sızma Artışı',
    hostYieldDescriptionTr: 'Gizli Paravan Hücre',
    baseTradeBonus: 8,
  },
  mercenary_liaison: {
    type: 'mercenary_liaison',
    nameTr: 'Paralı Asker İrtibat Ofisi',
    descriptionTr: 'Yıldız korsanları ve paralı asker loncalarıyla irtibat kurar. Şirkete +%10 Donanma Saldırı Gücü sağlar.',
    icon: '⚔️',
    cost: { ore: 160, crystal: 60, fuel: 100 },
    corpYieldDescriptionTr: '+%10 Gemi Saldırı Gücü',
    hostYieldDescriptionTr: 'Kiralık Filo İndirimi',
    baseTradeBonus: 12,
  },
};

export function getBranchOfficeKey(corporationId: string, targetPlanetId: string): string {
  return `${corporationId}_${targetPlanetId}`;
}

export function canEstablishBranchOffice(
  state: GameState,
  corporationId: string,
  targetPlanetId: string
): { allowed: boolean; reason?: string } {
  const corp = state.players[corporationId];
  if (!corp) return { allowed: false, reason: 'Şirket imparatorluğu bulunamadı.' };

  const targetPlanet = state.planets[targetPlanetId];
  if (!targetPlanet) return { allowed: false, reason: 'Hedef gezegen bulunamadı.' };

  if (targetPlanet.ownerId === corporationId) {
    return { allowed: false, reason: 'Kendi gezegeninize şube ofisi açamazsınız.' };
  }

  const hostPlayer = state.players[targetPlanet.ownerId];
  if (!hostPlayer) return { allowed: false, reason: 'Gezegen sahibi bulunamadı.' };

  // Check if planet already has a branch office from ANY corporation
  if (state.branchOffices) {
    for (const b of Object.values(state.branchOffices)) {
      if (b.targetPlanetId === targetPlanetId) {
        return { allowed: false, reason: 'Bu gezegende zaten faal bir şube ofisi bulunuyor.' };
      }
    }
  }

  // Megacorp prerequisite: either has commercial pact, is in same federation, is subject/overlord, or has shadow_consortium civic
  const isShadowConsortium = corp.corporateCivics?.includes('shadow_consortium');
  const hasCommercialPact = corp.commercialPacts?.includes(hostPlayer.id);
  const isFederationMember = corp.federationId && corp.federationId === hostPlayer.federationId;
  const isSubjectOrOverlord = corp.overlordId === hostPlayer.id || corp.subjects?.includes(hostPlayer.id);

  if (!isShadowConsortium && !hasCommercialPact && !isFederationMember && !isSubjectOrOverlord) {
    return {
      allowed: false,
      reason: 'Şube ofisi açmak için hedefle Ticaret Paktı, Federasyon ortaklığı veya Gölge Konsorsiyumu tüzüğü gerekir.',
    };
  }

  // Cost check on primary planet
  const corpPlanets = Object.values(state.planets).filter((p) => p.ownerId === corporationId);
  const primaryPlanet = corpPlanets[0];
  if (!primaryPlanet) return { allowed: false, reason: 'Şirket merkezi bulunamadı.' };

  const cost = MEGACORP_CONSTANTS.BRANCH_OFFICE_SETUP_COST;
  if (
    primaryPlanet.resources.ore < cost.ore ||
    primaryPlanet.resources.crystal < cost.crystal ||
    primaryPlanet.resources.fuel < cost.fuel
  ) {
    return {
      allowed: false,
      reason: `Yetersiz kaynak (${cost.ore} Cevher, ${cost.crystal} Kristal, ${cost.fuel} Yakıt gerekir).`,
    };
  }

  return { allowed: true };
}

export function establishBranchOffice(
  state: GameState,
  corporationId: string,
  targetPlanetId: string
): { success: boolean; error?: string; branchId?: string } {
  const check = canEstablishBranchOffice(state, corporationId, targetPlanetId);
  if (!check.allowed) return { success: false, error: check.reason };

  const corp = state.players[corporationId];
  const targetPlanet = state.planets[targetPlanetId];
  const hostPlayer = state.players[targetPlanet.ownerId];

  const corpPlanets = Object.values(state.planets).filter((p) => p.ownerId === corporationId);
  const primaryPlanet = corpPlanets[0];
  const cost = MEGACORP_CONSTANTS.BRANCH_OFFICE_SETUP_COST;

  primaryPlanet.resources.ore -= cost.ore;
  primaryPlanet.resources.crystal -= cost.crystal;
  primaryPlanet.resources.fuel -= cost.fuel;

  if (!state.branchOffices) state.branchOffices = {};

  const branchKey = getBranchOfficeKey(corporationId, targetPlanetId);
  const branch: CorporateBranchOffice = {
    id: branchKey,
    corporationId,
    targetPlanetId,
    targetPlayerId: hostPlayer.id,
    holdings: [],
    establishedAtMs: state.timeMs,
    tradeValueYield: MEGACORP_CONSTANTS.BASE_BRANCH_TRADE_YIELD,
    hostBonusYield: MEGACORP_CONSTANTS.BASE_HOST_TRADE_BONUS,
  };

  state.branchOffices[branchKey] = branch;
  corp.branchOfficesCount = (corp.branchOfficesCount || 0) + 1;

  state.eventLog.push({
    id: `event_branch_est_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'branch_office_established',
    playerId: corporationId,
    description: `🏢 ŞUBE OFİSİ AÇILDI: ${hostPlayer.name} sınırları içindeki ${targetPlanet.name} dünyasında yeni bir ticari franchise faaliyete geçti.`,
    metadata: { branchId: branchKey, targetPlanetId, hostPlayerId: hostPlayer.id },
  });

  return { success: true, branchId: branchKey };
}

export function closeBranchOffice(
  state: GameState,
  corporationId: string,
  branchId: string
): { success: boolean; error?: string } {
  if (!state.branchOffices || !state.branchOffices[branchId]) {
    return { success: false, error: 'Şube ofisi bulunamadı.' };
  }

  const branch = state.branchOffices[branchId];
  if (branch.corporationId !== corporationId) {
    return { success: false, error: 'Bu şube ofisi size ait değil.' };
  }

  const targetPlanet = state.planets[branch.targetPlanetId];
  delete state.branchOffices[branchId];

  const corp = state.players[corporationId];
  if (corp && corp.branchOfficesCount) {
    corp.branchOfficesCount = Math.max(0, corp.branchOfficesCount - 1);
  }

  state.eventLog.push({
    id: `event_branch_close_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'branch_office_closed',
    playerId: corporationId,
    description: `🚪 ŞUBE OFİSİ KAPATILDI: ${targetPlanet?.name || 'Hedef'} üzerindeki kurumsal şube feshedildi.`,
    metadata: { branchId },
  });

  return { success: true };
}

export function buildCorporateHolding(
  state: GameState,
  corporationId: string,
  branchId: string,
  holdingType: CorporateHoldingType
): { success: boolean; error?: string } {
  if (!state.branchOffices || !state.branchOffices[branchId]) {
    return { success: false, error: 'Şube ofisi bulunamadı.' };
  }

  const branch = state.branchOffices[branchId];
  if (branch.corporationId !== corporationId) {
    return { success: false, error: 'Bu şube ofisi size ait değil.' };
  }

  if (branch.holdings.length >= MEGACORP_CONSTANTS.MAX_HOLDINGS_PER_BRANCH) {
    return { success: false, error: 'Bir şubede en fazla 3 kurumsal holding binası inşa edilebilir.' };
  }

  if (branch.holdings.includes(holdingType)) {
    return { success: false, error: 'Bu şube ofisinde bu holding binasından zaten mevcut (şube başına benzersizdir).' };
  }

  const config = CORPORATE_HOLDING_CONFIGS[holdingType];
  if (!config) return { success: false, error: 'Geçersiz holding tipi.' };

  // Cost check on primary planet
  const corpPlanets = Object.values(state.planets).filter((p) => p.ownerId === corporationId);
  const primaryPlanet = corpPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Şirket merkezi bulunamadı.' };

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

  branch.holdings.push(holdingType);
  branch.tradeValueYield += config.baseTradeBonus;

  state.eventLog.push({
    id: `event_holding_built_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'corporate_holding_built',
    playerId: corporationId,
    description: `🏗️ KURUMSAL HOLDİNG İNŞA EDİLDİ: "${config.nameTr}" şube envanterine katıldı. (${config.corpYieldDescriptionTr})`,
    metadata: { branchId, holdingType },
  });

  return { success: true };
}

export function dismantleCorporateHolding(
  state: GameState,
  corporationId: string,
  branchId: string,
  holdingIndex: number
): { success: boolean; error?: string } {
  if (!state.branchOffices || !state.branchOffices[branchId]) {
    return { success: false, error: 'Şube ofisi bulunamadı.' };
  }

  const branch = state.branchOffices[branchId];
  if (branch.corporationId !== corporationId) {
    return { success: false, error: 'Bu şube ofisi size ait değil.' };
  }

  if (holdingIndex < 0 || holdingIndex >= branch.holdings.length) {
    return { success: false, error: 'Geçersiz holding indeksi.' };
  }

  const holdingType = branch.holdings[holdingIndex];
  const config = CORPORATE_HOLDING_CONFIGS[holdingType];
  branch.holdings.splice(holdingIndex, 1);
  branch.tradeValueYield = Math.max(MEGACORP_CONSTANTS.BASE_BRANCH_TRADE_YIELD, branch.tradeValueYield - config.baseTradeBonus);

  // 50% refund to corporation primary planet
  const corpPlanets = Object.values(state.planets).filter((p) => p.ownerId === corporationId);
  const primaryPlanet = corpPlanets[0];
  if (primaryPlanet) {
    primaryPlanet.resources.ore += Math.round(config.cost.ore * 0.5);
    primaryPlanet.resources.crystal += Math.round(config.cost.crystal * 0.5);
    primaryPlanet.resources.fuel += Math.round(config.cost.fuel * 0.5);
  }

  return { success: true };
}

export function calculateBranchOfficeYields(
  state: GameState,
  branch: CorporateBranchOffice
): { tradeValueYield: number; hostBonusYield: number } {
  let baseTV = branch.tradeValueYield || MEGACORP_CONSTANTS.BASE_BRANCH_TRADE_YIELD;
  let baseHost = branch.hostBonusYield || MEGACORP_CONSTANTS.BASE_HOST_BONUS_YIELD;

  const corp = state.players[branch.corporationId];
  if (corp?.corporateCivics?.includes('trade_syndicate')) {
    baseTV = Math.round(baseTV * 1.3);
  }

  return {
    tradeValueYield: baseTV,
    hostBonusYield: baseHost,
  };
}

export function calculateCommodityFuturesPrice(
  state: GameState,
  resourceType: ResourceType,
  durationMinutes: number
): { unitPrice: number; discountMultiplier: number } {
  const baseRate = state.market?.rates?.[resourceType] || 1.0;
  const discountMultiplier = Math.max(0.75, 1.0 - (durationMinutes * 0.008));
  const unitPrice = Number((baseRate * discountMultiplier).toFixed(3));
  return { unitPrice, discountMultiplier };
}

export function purchaseCommodityFutures(
  state: GameState,
  buyerId: string,
  resourceType: ResourceType,
  amount: number,
  durationMinutes: number
): { success: boolean; error?: string; contractId?: string } {
  const buyer = state.players[buyerId];
  if (!buyer) return { success: false, error: 'Alıcı oyuncu bulunamadı.' };

  const buyerPlanets = Object.values(state.planets).filter((p) => p.ownerId === buyerId);
  const primaryPlanet = buyerPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Koloni bulunamadı.' };

  // Calculate forward price with duration risk premium/discount
  const baseRate = state.market.rates[resourceType] || 1.0;
  // 5 min: 0.95x (discount), 10 min: 0.90x, 20 min: 0.85x, 30 min: 0.80x
  const discountMultiplier = Math.max(0.75, 1.0 - (durationMinutes * 0.008));
  const lockedPricePerUnit = Number((baseRate * discountMultiplier).toFixed(3));
  const totalCost = Math.round(amount * lockedPricePerUnit);

  // Require fuel/energy to purchase futures contracts
  if (primaryPlanet.resources.fuel < totalCost) {
    return {
      success: false,
      error: `Yetersiz Yakıt/Enerji fonu (Vadeli işlem sözleşmesi için ${totalCost} Yakıt gerekir).`,
    };
  }

  primaryPlanet.resources.fuel -= totalCost;

  if (!state.commodityFutures) state.commodityFutures = {};

  const contractId = `futures_${state.nextId++}`;
  const contract: CommodityFuturesContract = {
    id: contractId,
    buyerId,
    sellerId: null, // Guaranteed by Galactic Commodity Exchange
    resourceType,
    amount,
    lockedPricePerUnit,
    totalCost,
    purchasedAtMs: state.timeMs,
    deliveryTimeMs: state.timeMs + durationMinutes * 60 * 1000,
    isDelivered: false,
    isClaimed: false,
  };

  state.commodityFutures[contractId] = contract;

  state.eventLog.push({
    id: `event_futures_buy_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'commodity_futures_purchased',
    playerId: buyerId,
    description: `📈 VADELİ EMTİA SÖZLEŞMESİ: ${amount} birim ${resourceType.toUpperCase()} için vadeli kontrat bağlandı (Birim: ${lockedPricePerUnit} Yakıt, Vade: ${durationMinutes} dk).`,
    metadata: { contractId, resourceType, amount, deliveryTimeMs: contract.deliveryTimeMs },
  });

  return { success: true, contractId };
}

export function claimCommodityFutures(
  state: GameState,
  buyerId: string,
  contractId: string
): { success: boolean; error?: string } {
  if (!state.commodityFutures || !state.commodityFutures[contractId]) {
    return { success: false, error: 'Sözleşme bulunamadı.' };
  }

  const contract = state.commodityFutures[contractId];
  if (contract.buyerId !== buyerId) {
    return { success: false, error: 'Bu sözleşme size ait değil.' };
  }

  if (contract.isClaimed) {
    return { success: false, error: 'Bu vadeli sözleşme daha önce tahsil edilmiş.' };
  }

  if (state.timeMs < contract.deliveryTimeMs) {
    const remainingSec = Math.ceil((contract.deliveryTimeMs - state.timeMs) / 1000);
    return { success: false, error: `Sözleşmenin vadesi henüz dolmadı (${remainingSec} sn kaldı).` };
  }

  const buyerPlanets = Object.values(state.planets).filter((p) => p.ownerId === buyerId);
  const primaryPlanet = buyerPlanets[0];
  if (!primaryPlanet) return { success: false, error: 'Teslimat yapılacak koloni bulunamadı.' };

  // Deliver resources
  primaryPlanet.resources[contract.resourceType] += contract.amount;
  contract.isDelivered = true;
  contract.isClaimed = true;

  state.eventLog.push({
    id: `event_futures_claim_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'commodity_futures_claimed',
    playerId: buyerId,
    description: `📦 EMTİA TESLİMATI TAMAMLANDI: ${contract.amount} birim ${contract.resourceType.toUpperCase()} vadesi dolan sözleşmeden ambarlara aktarıldı.`,
    metadata: { contractId, resourceType: contract.resourceType, amount: contract.amount },
  });

  return { success: true };
}

export function convertToMegacorp(
  state: GameState,
  playerId: string,
  civics: CorporateCivicId[]
): { success: boolean; error?: string } {
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı.' };

  if (!civics || civics.length === 0 || civics.length > 2) {
    return { success: false, error: 'Megakorporasyon tüzüğü tam olarak 1 veya 2 kurumsal doktrin (civic) gerektirir.' };
  }

  const unique = new Set(civics);
  if (unique.size !== civics.length) {
    return { success: false, error: 'Aynı kurumsal doktrin birden fazla kez seçilemez.' };
  }

  for (const c of civics) {
    if (!CORPORATE_CIVIC_CONFIGS[c]) {
      return { success: false, error: `Geçersiz kurumsal doktrin: ${c}` };
    }
  }

  player.isMegacorp = true;
  player.corporateCivics = civics;

  state.eventLog.push({
    id: `event_megacorp_charter_${state.nextId++}`,
    timeMs: state.timeMs,
    type: 'converted_to_megacorp',
    playerId,
    description: `🌐 ŞİRKET TÜZÜĞÜ İLAN EDİLDİ: ${player.name} kurumsal devlete (Megakorporasyon) dönüştü. Galaksi çapında şube ofisleri açma yetkisi kazandı!`,
    metadata: { civics },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Main Game Loop Update
// ---------------------------------------------------------------------------

export function updateMegacorpAndFutures(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) return;

  // 1. Process Commodity Futures Delivery
  if (state.commodityFutures) {
    for (const contract of Object.values(state.commodityFutures)) {
      if (!contract.isDelivered && state.timeMs >= contract.deliveryTimeMs) {
        contract.isDelivered = true;
      }
    }
  }

  // 2. Process Periodic Corporate Branch Office Dividends
  if (state.branchOffices) {
    for (const branch of Object.values(state.branchOffices)) {
      const corp = state.players[branch.corporationId];
      const host = state.players[branch.targetPlayerId];
      const targetPlanet = state.planets[branch.targetPlanetId];

      if (!corp || !host || !targetPlanet) continue;

      // Check subversive front holdings: adds passive infiltration to host
      if (branch.holdings.includes('subversive_front') && state.spyNetworks) {
        const netKey = getSpyNetworkKey(branch.corporationId, branch.targetPlayerId);
        const net = state.spyNetworks[netKey];
        if (net) {
          net.infiltrationLevel = Math.min(net.infiltrationCap, net.infiltrationLevel + (0.05 * (deltaMs / 1000)));
        }
      }

      // Passive dividend payouts
      const corpPlanets = Object.values(state.planets).filter((p) => p.ownerId === branch.corporationId);
      const corpHome = corpPlanets[0];
      if (corpHome) {
        // Trade yield multiplier from civics
        let multiplier = 1.0;
        if (corp.corporateCivics?.includes('trade_syndicate')) {
          multiplier = 1.3;
        }
        const dividendAmount = Math.round(branch.tradeValueYield * multiplier * (deltaMs / 60000));
        corpHome.resources.fuel += dividendAmount; // fuel represents energy credits in Galaksi

        // Host receives a local production or trade bonus dividend
        const hostDividend = Math.round(branch.hostBonusYield * (deltaMs / 60000));
        targetPlanet.resources.fuel += hostDividend;
      }
    }
  }
}
