import { GameEngine } from '../engine/engine';
import { GameCommand, TransmissionType } from '../engine/types';

// Track cooldown timestamps per bot
const botLastTransmissionTime: Record<string, number> = {};
const botCommentedRelics: Record<string, boolean> = {};
const botCommentedRaid: Record<string, number> = {};

// 6 minutes standard cooldown between spontaneous bot radio broadcasts
const TRANSMISSION_COOLDOWN_MS = 6 * 60 * 1000;

/**
 * Evaluates diplomatic opportunities, border warnings, hegemony pressure, and trade proposals for a bot
 */
export function evaluateBotDiplomacy(engine: GameEngine, botPlayerId: string): GameCommand[] {
  const state = engine.state;
  const botPlayer = state.players[botPlayerId];
  if (!botPlayer || !botPlayer.isBot) return [];

  const nowMs = state.timeMs;
  const lastTime = botLastTransmissionTime[botPlayerId];
  if (lastTime !== undefined && nowMs - lastTime < TRANSMISSION_COOLDOWN_MS) {
    return [];
  }

  // Find a human (non-bot) player in the galaxy
  const humanPlayer = Object.values(state.players).find((p) => !p.isBot);
  if (!humanPlayer) return [];

  const archetype = botPlayer.botArchetype || 'industrialist';
  const botHomeworld = Object.values(state.planets).find(
    (p) => p.ownerId === botPlayerId && p.isHomeworld
  );

  // =========================================================================
  // 1. HEGEMONY THREAT & COUNTER-COALITION DIPLOMACY
  // =========================================================================
  const relayWeekly = state.relay.weeklyPoints || {};
  let maxPoints = 0;
  let pointsLeaderId: string | null = null;
  for (const [pid, pts] of Object.entries(relayWeekly)) {
    if (pts > maxPoints) {
      maxPoints = pts;
      pointsLeaderId = pid;
    }
  }

  // If someone is approaching Hegemony Victory (>= 200 points)
  if (maxPoints >= 200 && pointsLeaderId) {
    if (pointsLeaderId === humanPlayer.id) {
      // Human is dominating the Nexus Relay -> Bots issue Hegemony Warnings!
      botLastTransmissionTime[botPlayerId] = nowMs;
      const progressPercent = Math.min(100, Math.round((maxPoints / 500) * 100));

      if (archetype === 'raider') {
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'hegemony_warning',
            title: 'Kızıl Akın: Hegemonya Tehdidi İkazı',
            message: `${humanPlayer.name}, Nexus rölesindeki tekeliniz (%${progressPercent}) galaktik güç dengesini altüst etti. Korsan filolarımız ve bağımsız armadalar bu tahakkümü kırmak için harekete geçecek!`,
            systemId: state.map.relaySystemId,
          },
        ];
      } else if (archetype === 'admiral' || archetype === 'guardian') {
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'hegemony_warning',
            title: 'Donanma Komutanlığı: Hegemonya Karşıtı Askeri Uyarı',
            message: `${humanPlayer.name}, röle üzerindeki hakimiyetiniz zafer eşiğine (%${progressPercent}) ulaştı. Bağımsız cumhuriyetler bu tekelciliğe boyun eğmeyecektir. Röle üzerindeki filonuzu geri çekmenizi talep ediyoruz.`,
            systemId: state.map.relaySystemId,
          },
        ];
      } else if (archetype === 'industrialist') {
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'hegemony_warning',
            title: 'Sanayi Konsorsiyumu: Ticari Muhtıra',
            message: `${humanPlayer.name}, Nexus rölesindeki hegemonyanız serbest ticaret yollarını tehlikeye atıyor. Tekelciliğiniz sürerse kaynak sevkiyatlarını keseceğiz.`,
            systemId: state.map.relaySystemId,
          },
        ];
      }
    } else if (pointsLeaderId !== botPlayerId && pointsLeaderId !== humanPlayer.id) {
      // A rival bot is dominating the relay -> Send Coalition Proposal to human player!
      if (!engine.hasActiveTruce(botPlayerId, humanPlayer.id)) {
        botLastTransmissionTime[botPlayerId] = nowMs;
        const leaderName = state.players[pointsLeaderId]?.name || 'Röle Lideri';
        const truceDurationMs = 25 * 60 * 1000; // 25 minutes
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'coalition_proposal',
            title: 'Hegemonyaya Karşı Koalisyon Paktı',
            message: `${leaderName} Nexus rölesini ele geçirdi ve hegemonya zaferine hızla yaklaşıyor (%${Math.round((maxPoints / 500) * 100)}). Bu tehdidi püskürtmek adına aramızda 25 dakikalık saldırmazlık koalisyonu kuralım.`,
            truceDurationMs,
            systemId: state.map.relaySystemId,
          },
        ];
      }
    }
  }

  // =========================================================================
  // 2. POST-RAID RETALIATION REACTION
  // =========================================================================
  const recentRaid = state.battleReports.slice(-6).reverse().find(
    (b) => b.attackerId === humanPlayer.id && b.defenderId === botPlayerId && b.context === 'planet_raid'
  );
  if (recentRaid && botCommentedRaid[botPlayerId] !== recentRaid.timestamp) {
    botCommentedRaid[botPlayerId] = recentRaid.timestamp;
    botLastTransmissionTime[botPlayerId] = nowMs;
    return [
      {
        type: 'SEND_TRANSMISSION',
        recipientId: humanPlayer.id,
        transmissionType: 'warning',
        title: 'Baskın Sonrası Misilleme Uyarısı',
        message: `${humanPlayer.name}, topraklarımıza düzenlediğiniz korsan baskınının hesabını vereceksiniz. Savunma hatlarımız takviye edildi ve donanmamız intikama hazır!`,
        systemId: recentRaid.systemId,
      },
    ];
  }

  // =========================================================================
  // 3. ANCIENT RELIC AWE & ENVY REACTION
  // =========================================================================
  if (humanPlayer.artifacts && humanPlayer.artifacts.length > 0 && !botCommentedRelics[botPlayerId]) {
    botCommentedRelics[botPlayerId] = true;
    botLastTransmissionTime[botPlayerId] = nowMs;
    return [
      {
        type: 'SEND_TRANSMISSION',
        recipientId: humanPlayer.id,
        transmissionType: 'relic_envy',
        title: 'Kadim Yadigar İstihbaratı',
        message: `${humanPlayer.name}, filonuzun derin sektörlerden kadim bir imparatorluk yadigarı açığa çıkardığını telsiz ağlarımız tespit etti. Bu kadim gücü galaktik barışı sarsmak için kullanmamanızı umuyoruz.`,
      },
    ];
  }

  // =========================================================================
  // 4. STANDARD ARCHETYPE DIPLOMACY FALLBACK
  // =========================================================================
  switch (archetype) {
    case 'industrialist': {
      // Offer mineral exchange: Ore for Fuel or Crystal
      if (!botHomeworld) return [];

      const tradeOffer = {
        give: { ore: 500, crystal: 0, fuel: 0 },
        receive: { ore: 0, crystal: 0, fuel: 250 },
      };

      if (botHomeworld.resources.ore >= tradeOffer.give.ore) {
        botLastTransmissionTime[botPlayerId] = nowMs;
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'trade_proposal',
            title: 'Sanayi Konsorsiyumu Maden Takası',
            message: `Selamlar komutan ${humanPlayer.name}. Depolarımızda cevher fazlamız bulunuyor. 250 Yakıt karşılığında 500 Cevher takası öneriyoruz.`,
            tradeOffer,
          },
        ];
      }
      break;
    }

    case 'guardian': {
      // Check if human already has active truce
      if (!engine.hasActiveTruce(botPlayerId, humanPlayer.id)) {
        botLastTransmissionTime[botPlayerId] = nowMs;
        const truceDurationMs = 20 * 60 * 1000; // 20 minutes
        return [
          {
            type: 'SEND_TRANSMISSION',
            recipientId: humanPlayer.id,
            transmissionType: 'truce_offer',
            title: 'Nexus Muhafızları Barış Paktı',
            message: `Merkezi röle civarında güvenliği ve istikrarı sağlamak adına 20 dakikalık karşılıklı saldırmazlık paktı teklif ediyoruz.`,
            truceDurationMs,
            systemId: state.map.relaySystemId,
          },
        ];
      }
      break;
    }

    case 'raider': {
      // Raider sends intimidation / territorial warning
      botLastTransmissionTime[botPlayerId] = nowMs;
      return [
        {
          type: 'SEND_TRANSMISSION',
          recipientId: humanPlayer.id,
          transmissionType: 'warning',
          title: 'Kızıl Akın Sancaktarları Telsiz Sinyali',
          message: `Dikkat et ${humanPlayer.name}! Hiper-şerit koridorlarındaki devriyelerimiz izin almadan geçen ticaret konvoylarına merhamet göstermez.`,
          systemId: botHomeworld?.systemId,
        },
      ];
    }

    case 'explorer': {
      // Explorer shares deep space survey findings
      botLastTransmissionTime[botPlayerId] = nowMs;
      return [
        {
          type: 'SEND_TRANSMISSION',
          recipientId: humanPlayer.id,
          transmissionType: 'intel_sharing',
          title: 'Yıldız Kâşifleri Frekans Yayını',
          message: `Yıldız haritalarımızı güncelliyoruz. Galaksideki anomaliler ve enkaz alanları konusunda dikkatli olun, kadim sırlar her köşede gizli.`,
        },
      ];
    }

    case 'admiral': {
      // Admiral sends formal fleet maneuver respect
      botLastTransmissionTime[botPlayerId] = nowMs;
      return [
        {
          type: 'SEND_TRANSMISSION',
          recipientId: humanPlayer.id,
          transmissionType: 'bravado',
          title: 'Donanma Komutanlığı Taktik İkazı',
          message: `Armadanızın manevralarını izliyoruz. Sınırlarımıza saygı duyulduğu müddetçe silahlarımız namlularında kalacaktır.`,
        },
      ];
    }
  }

  return [];
}

/**
 * Resets bot diplomacy cooldowns and event tracking (used in test suite)
 */
export function resetBotDiplomacyCooldowns(): void {
  for (const k in botLastTransmissionTime) {
    delete botLastTransmissionTime[k];
  }
  for (const k in botCommentedRelics) {
    delete botCommentedRelics[k];
  }
  for (const k in botCommentedRaid) {
    delete botCommentedRaid[k];
  }
}
