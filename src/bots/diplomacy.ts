import { GameEngine } from '../engine/engine';
import { GameCommand, TransmissionType } from '../engine/types';

// Track cooldown timestamps per bot
const botLastTransmissionTime: Record<string, number> = {};

// 6 minutes standard cooldown between spontaneous bot radio broadcasts
const TRANSMISSION_COOLDOWN_MS = 6 * 60 * 1000;

/**
 * Evaluates diplomatic opportunities, border warnings, and trade proposals for a bot
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
 * Resets bot diplomacy cooldowns (used in test suite)
 */
export function resetBotDiplomacyCooldowns(): void {
  for (const k in botLastTransmissionTime) {
    delete botLastTransmissionTime[k];
  }
}
