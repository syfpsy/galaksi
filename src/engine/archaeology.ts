import {
  ActiveRelicTriumph,
  ArchaeologyChapter,
  ArchaeologySite,
  EmpireArtifactId,
  GameState,
  RelicTriumphConfig,
  Resources,
  StarSystem,
} from './types';
import { EMPIRE_ARTIFACTS } from './artifacts';

// ==========================================
// Relic Triumphs (Phase 18)
// ==========================================
export const RELIC_TRIUMPH_CONFIGS: Record<EmpireArtifactId, RelicTriumphConfig> = {
  progenitor_matrix: {
    nameTr: 'Matris Aşırı Yüklemesi',
    descriptionTr: '60 saniye boyunca gezegen bina inşaatı ve tersane gemi üretim süreleri %50 kısalır.',
    minorArtifactsCost: 30,
    durationMs: 60 * 1000,
    cooldownMs: 180 * 1000,
  },
  rift_hyperdrive: {
    nameTr: 'Alt-Uzay Sıçraması',
    descriptionTr: '60 saniye boyunca tüm filolar 2x süpersonik hızda intikal eder ve sefer yakıt tüketimi sıfırlanır.',
    minorArtifactsCost: 30,
    durationMs: 60 * 1000,
    cooldownMs: 180 * 1000,
  },
  dreadnought_plating: {
    nameTr: 'Aşılmaz Zırh Kalkanı',
    descriptionTr: '90 saniye boyunca tüm muharebelerde filolar +%30 hasar direnci ve +%15 kaçınma şansı kazanır.',
    minorArtifactsCost: 30,
    durationMs: 90 * 1000,
    cooldownMs: 180 * 1000,
  },
  subspace_tachyon_array: {
    nameTr: 'Gözcü Vahyi',
    descriptionTr: '90 saniye boyunca galaksideki tüm sistemlerde +2 ekstra derin uzay sensör görüşü sağlanır.',
    minorArtifactsCost: 30,
    durationMs: 90 * 1000,
    cooldownMs: 180 * 1000,
  },
  omniscient_archive: {
    nameTr: 'Aydınlanma Dalgalanması',
    descriptionTr: 'İmparatorluğa anında +200 Kültürel Birlik kazandırır ve 120 saniye boyunca Senato Diplomatik Ağırlığını ikiye katlar (+%100).',
    minorArtifactsCost: 30,
    durationMs: 120 * 1000,
    cooldownMs: 180 * 1000,
  },
  chronos_core: {
    nameTr: 'Zaman Bükümü',
    descriptionTr: '60 saniye boyunca tüm gezegenlerdeki bina ve tersane üretim sıraları 3 kat hızlandırılır.',
    minorArtifactsCost: 30,
    durationMs: 60 * 1000,
    cooldownMs: 180 * 1000,
  },
};

// ==========================================
// Archaeological Site Blueprints & Chapters
// ==========================================
export interface SiteTemplate {
  templateId: string;
  nameTr: string;
  descriptionTr: string;
  rewardArtifactId: EmpireArtifactId;
  chapters: Record<number, ArchaeologyChapter>;
}

export const ARCHAEOLOGY_TEMPLATES: SiteTemplate[] = [
  {
    templateId: 'site_library',
    nameTr: 'Zanaşkın Kadim Kütüphanesi',
    descriptionTr: 'Sayısız galaktik döngü öncesinden kalma kristal prizmalarla örülü derin yeraltı bilgi mahzeni.',
    rewardArtifactId: 'omniscient_archive',
    chapters: {
      1: {
        chapterNumber: 1,
        titleTr: 'Sismik Yarıkların Taranması',
        textTr: 'Gezegen kabuğundaki kristal kırılmalar alt-uzay frekanslarında yankılanıyor. Keşif ekibi prizmatik arşive giden ana koridoru açığa çıkardı.',
        durationMs: 30 * 1000,
        rewardMinorArtifacts: 20,
        rewardResources: { ore: 150, crystal: 150 },
        rewardXP: 50,
      },
      2: {
        chapterNumber: 2,
        titleTr: 'Kuantum Kripto Odası',
        textTr: 'Ana arşiv kapısı hiper-boyutlu bir mantık kilidiyle mühürlenmiş. Mühendislerimiz şifreyi nazikçe çözebilir ya da enerji akışını zorlayabilir.',
        durationMs: 35 * 1000,
        hasChoice: true,
        choices: [
          {
            textTr: 'Muhafazakâr Kripto Çözümü',
            descriptionTr: 'Veri prizmalarını koruyarak şifreyi çöz. Azami Kadim Eser parçacığı ve Kültürel Birlik elde et.',
            outcomeTr: 'Prizmalar kusursuz korundu. Kadim medeniyetin kültürel felsefesi imparatorluk akademisinde yankı buldu.',
            minorArtifactsBonus: 25,
            xpBonus: 60,
          },
          {
            textTr: 'Kaba Kuvvet Enerji Tahliyesi',
            descriptionTr: 'Kripto bataryalarını deşarj et ve reaktör kristallerini sök. Devasa hammadde rezervi kazan.',
            outcomeTr: 'Kapı patlatıldı! Reaktörden saçılan saf kristal rezervleri filoya yüklendi.',
            resourceBonus: { crystal: 800, fuel: 300 },
            xpBonus: 100,
          },
        ],
        rewardMinorArtifacts: 15,
      },
      3: {
        chapterNumber: 3,
        titleTr: 'Külli Arşivin Nihai Uyanışı',
        textTr: 'Mahzenin merkezindeki kuantum monoliti parıldamaya başladı. Milyonlarca yıllık kadim bilgi veri ağı imparatorluk amiral gemisinin sistemleriyle bütünleşti!',
        durationMs: 40 * 1000,
        rewardMinorArtifacts: 40,
        rewardResources: { crystal: 500 },
        rewardXP: 150,
      },
    },
  },
  {
    templateId: 'site_titan_shipyard',
    nameTr: 'Prekürsör Titan Tersanesi',
    descriptionTr: 'Kadim bir yıldızlararası muharebenin ortasında terk edilmiş devasa orbital kuru havuz ve reaktör iskeleti.',
    rewardArtifactId: 'chronos_core',
    chapters: {
      1: {
        chapterNumber: 1,
        titleTr: 'Yörüngesel Enkaz Kuşağının Aşılması',
        textTr: 'Tersanenin çevresini saran manyetik enkaz alanı temizlendi. Antik montaj kolları hâlâ yarı mamul bir gövdeyi kavramış halde duruyor.',
        durationMs: 30 * 1000,
        rewardMinorArtifacts: 20,
        rewardResources: { ore: 200, fuel: 100 },
        rewardXP: 50,
      },
      2: {
        chapterNumber: 2,
        titleTr: 'Kronometrik Reaktör Rezonansı',
        textTr: 'Tersanenin çekirdeğinde zaman akışının dalgalandığı tespit edildi. Biriken takyonik plazma dikkatle yönlendirilmeli.',
        durationMs: 35 * 1000,
        hasChoice: true,
        choices: [
          {
            textTr: 'Zaman İzolatörlerini Devreye Al',
            descriptionTr: 'Kronometrik dalgalanmayı izole et, reaktör kalıntılarını güvenle tara.',
            outcomeTr: 'Zaman alanı dengelendi. Mühendisler antik makinelerin çalışma prensiplerini kopyaladı.',
            minorArtifactsBonus: 25,
            xpBonus: 60,
          },
          {
            textTr: 'Plazma Tahliye Hattını Yağmala',
            descriptionTr: 'Aşırı yüklü yakıt kanallarını drene et ve filonun yakıt tanklarını doldur.',
            outcomeTr: 'Yüksek saflıktaki yakıt rezervleri filoya aktarıldı, ağır nakliye motorları şarj edildi.',
            resourceBonus: { fuel: 1000, ore: 400 },
            xpBonus: 90,
          },
        ],
        rewardMinorArtifacts: 15,
      },
      3: {
        chapterNumber: 3,
        titleTr: 'Zaman Motorunun Kurtarılması',
        textTr: 'Tersanenin kalbindeki Zaman Motoru Çekirdeği söküldü. Bu kadim artefakt, imparatorluk tersanelerinin üretim çevrimlerini bükme gücüne sahip!',
        durationMs: 40 * 1000,
        rewardMinorArtifacts: 40,
        rewardResources: { fuel: 500 },
        rewardXP: 150,
      },
    },
  },
  {
    templateId: 'site_precursor_vault',
    nameTr: 'Hiçlik Öncesi Mahzen',
    descriptionTr: 'Karanlık madde boyutundan gelen ilk kadim akını mühürlemiş olan öncülerin sır dolu derin sığınağı.',
    rewardArtifactId: 'dreadnought_plating',
    chapters: {
      1: {
        chapterNumber: 1,
        titleTr: 'Nötronik Mühürlerin Çözümlenmesi',
        textTr: 'Ağır nötronit kapılar binlerce yıldır dokunulmamış. Yüksek enerjili lazer kesicilerimizle dış mühür tabakası yarıldı.',
        durationMs: 30 * 1000,
        rewardMinorArtifacts: 20,
        rewardResources: { ore: 250 },
        rewardXP: 50,
      },
      2: {
        chapterNumber: 2,
        titleTr: 'Muhafız Sentinellerin Uyanışı',
        textTr: 'İç salona girildiğinde otomatik nöbetçi droidler saldırı pozisyonu aldı. Korumaları devre dışı bırakmak için iki taktik seçenek var.',
        durationMs: 35 * 1000,
        hasChoice: true,
        choices: [
          {
            textTr: 'Ağ Arayüzünü Hackle',
            descriptionTr: 'Droidlerin mantık çekirdeğine sızarak silahlarını sustur, mimari veriyi kurtar.',
            outcomeTr: 'Başarılı siber müdahale! Droidler dostane tanı protokolüne geçti, veri kayıtları sağlandı.',
            minorArtifactsBonus: 30,
            xpBonus: 75,
          },
          {
            textTr: 'EMP Bombardımanı & Metalurjik Yağma',
            descriptionTr: 'Droidleri elektromanyetik şokla erit ve yoğunlaştırılmış zırh plakalarını sök.',
            outcomeTr: 'Nöbetçiler parçalandı! Zırh alaşımları ve kristal çekirdekleri devasa ganimet sağladı.',
            resourceBonus: { ore: 800, crystal: 600 },
            xpBonus: 90,
          },
        ],
        rewardMinorArtifacts: 15,
      },
      3: {
        chapterNumber: 3,
        titleTr: 'Efsanevi Zırh Tabakalarının Keşfi',
        textTr: 'Mahzenin merkezinde, kadim bir amiral dretnotunun zırh döşemeleri bulundu. Donanmamız bu plakalarla yenilmez bir direnç kazanacak!',
        durationMs: 40 * 1000,
        rewardMinorArtifacts: 40,
        rewardResources: { ore: 600, crystal: 300 },
        rewardXP: 150,
      },
    },
  },
];

/**
 * Returns chapter configuration for a given archaeology site
 */
export function getSiteChapterConfig(
  site: ArchaeologySite,
  chapterNumber: number = site.currentChapter
): ArchaeologyChapter | undefined {
  const template = ARCHAEOLOGY_TEMPLATES.find(
    (t) => site.nameTr === t.nameTr || site.id.includes(t.templateId)
  );
  return template?.chapters[chapterNumber];
}

/**
 * Initializes archaeology sites distributed across suitable star systems
 */
export function initializeSectorArchaeologySites(
  systems: Record<string, StarSystem>
): Record<string, ArchaeologySite> {
  const sites: Record<string, ArchaeologySite> = {};

  // Find candidate systems (exclude relay system and systems with POIs that are dangerous)
  const candidateSystemIds = Object.keys(systems).filter((sId) => !systems[sId].hasRelay);

  ARCHAEOLOGY_TEMPLATES.forEach((tpl, idx) => {
    if (idx < candidateSystemIds.length) {
      const sysId = candidateSystemIds[idx % candidateSystemIds.length];
      const sys = systems[sysId];
      const siteId = `site_${tpl.templateId}_${sysId}`;

      sites[siteId] = {
        id: siteId,
        systemId: sysId,
        systemName: sys.name,
        nameTr: tpl.nameTr,
        descriptionTr: tpl.descriptionTr,
        totalChapters: 3,
        currentChapter: 1,
        chapterProgressMs: 0,
        status: 'available',
        assignedFleetId: null,
        excavatingPlayerId: null,
        pendingChoiceChapter: undefined,
        completedAtMs: undefined,
        rewardArtifactId: tpl.rewardArtifactId,
        discoveredByPlayerIds: [],
        log: [],
      };
    }
  });

  return sites;
}

/**
 * Checks if a player can excavate a site with a fleet
 */
export function canExcavateSite(
  state: GameState,
  playerId: string,
  siteId: string,
  fleetId: string
): { canExcavate: boolean; reason?: string } {
  if (!state.archaeologySites) {
    return { canExcavate: false, reason: 'Sektör kazı alanları başlatılmamış' };
  }

  const site = state.archaeologySites[siteId];
  if (!site) {
    return { canExcavate: false, reason: 'Belirtilen kazı alanı bulunamadı' };
  }

  if (site.status === 'completed') {
    return { canExcavate: false, reason: 'Bu kazı alanı zaten tamamlanmış' };
  }

  if (site.status === 'choice_pending') {
    return { canExcavate: false, reason: 'Kazının devam etmesi için bekleyen kararı onaylamalısınız' };
  }

  if (site.status === 'excavating' && site.excavatingPlayerId !== playerId) {
    return { canExcavate: false, reason: 'Bu alanda başka bir medeniyet kazı yürütüyor' };
  }

  const fleet = state.fleets[fleetId];
  if (!fleet) {
    return { canExcavate: false, reason: 'Seçilen filo bulunamadı' };
  }

  if (fleet.ownerId !== playerId) {
    return { canExcavate: false, reason: 'Bu filo sizin komutanızda değil' };
  }

  // Must have at least 1 scout ship to conduct archaeological expeditions
  if ((fleet.ships.scout || 0) < 1) {
    return { canExcavate: false, reason: 'Arkeolojik keşif kazısı için filoda en az 1 Keşif Gemisi (Scout) bulunmalıdır' };
  }

  // Fleet must be in the site's star system
  const isAtSystem =
    fleet.status === 'orbiting' &&
    fleet.targetSystemId === site.systemId;

  if (!isAtSystem) {
    return { canExcavate: false, reason: 'Filo henüz kazı alanının bulunduğu yıldız sistemine ulaşmadı' };
  }

  return { canExcavate: true };
}

/**
 * Starts excavation on an archaeological site
 */
export function startSiteExcavation(
  state: GameState,
  playerId: string,
  siteId: string,
  fleetId: string
): { success: boolean; error?: string } {
  const check = canExcavateSite(state, playerId, siteId, fleetId);
  if (!check.canExcavate) {
    return { success: false, error: check.reason };
  }

  const site = state.archaeologySites![siteId];
  site.status = 'excavating';
  site.assignedFleetId = fleetId;
  site.excavatingPlayerId = playerId;

  if (!site.discoveredByPlayerIds.includes(playerId)) {
    site.discoveredByPlayerIds.push(playerId);
  }

  return { success: true };
}

/**
 * Abandons an active excavation
 */
export function abandonSiteExcavation(
  state: GameState,
  playerId: string,
  siteId: string
): { success: boolean; error?: string } {
  if (!state.archaeologySites) {
    return { success: false, error: 'Kazı alanları bulunamadı' };
  }

  const site = state.archaeologySites[siteId];
  if (!site) {
    return { success: false, error: 'Kazı alanı bulunamadı' };
  }

  if (site.excavatingPlayerId !== playerId && site.assignedFleetId) {
    return { success: false, error: 'Bu kazıyı yalnızca kazıyı yürüten oyuncu iptal edebilir' };
  }

  site.status = 'available';
  site.assignedFleetId = null;
  site.excavatingPlayerId = null;

  return { success: true };
}

/**
 * Resolves a pending branching chapter decision
 */
export function resolveSiteChoice(
  state: GameState,
  playerId: string,
  siteId: string,
  choiceIndex: number
): { success: boolean; error?: string; rewardSummary?: string } {
  if (!state.archaeologySites) return { success: false, error: 'Kazı alanları bulunamadı' };
  const site = state.archaeologySites[siteId];
  if (!site) return { success: false, error: 'Kazı alanı bulunamadı' };
  if (site.status !== 'choice_pending') return { success: false, error: 'Bu alanda bekleyen bir karar yok' };
  if (site.excavatingPlayerId !== playerId) return { success: false, error: 'Bu kararı yalnızca kazıyı yürüten oyuncu verebilir' };

  const template = ARCHAEOLOGY_TEMPLATES.find((t) => site.nameTr === t.nameTr || site.id.includes(t.templateId));
  if (!template) return { success: false, error: 'Kazı şablonu bulunamadı' };

  const chapterNum = site.pendingChoiceChapter || site.currentChapter;
  const chapterConfig = template.chapters[chapterNum];
  if (!chapterConfig || !chapterConfig.choices || !chapterConfig.choices[choiceIndex]) {
    return { success: false, error: 'Geçersiz karar seçimi' };
  }

  const choice = chapterConfig.choices[choiceIndex];
  const player = state.players[playerId];
  if (!player) return { success: false, error: 'Oyuncu bulunamadı' };

  if (!player.minorArtifacts) player.minorArtifacts = 0;

  // Apply choice rewards
  if (choice.minorArtifactsBonus) {
    player.minorArtifacts += choice.minorArtifactsBonus;
  }
  if (choice.resourceBonus) {
    const homeworld = Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld);
    if (homeworld) {
      if (choice.resourceBonus.ore) homeworld.resources.ore = Math.min(homeworld.storageCap, homeworld.resources.ore + choice.resourceBonus.ore);
      if (choice.resourceBonus.crystal) homeworld.resources.crystal = Math.min(homeworld.storageCap, homeworld.resources.crystal + choice.resourceBonus.crystal);
      if (choice.resourceBonus.fuel) homeworld.resources.fuel = Math.min(homeworld.storageCap, homeworld.resources.fuel + choice.resourceBonus.fuel);
    }
  }

  // Apply admiral XP if assigned to fleet
  if (choice.xpBonus && site.assignedFleetId) {
    const fleet = state.fleets[site.assignedFleetId];
    if (fleet?.admiralId && state.admirals?.[fleet.admiralId]) {
      state.admirals[fleet.admiralId].xp += choice.xpBonus;
    }
  }

  // Append to log
  site.log.push({
    chapter: chapterNum,
    titleTr: chapterConfig.titleTr,
    choiceMadeTr: choice.textTr,
    completedAtMs: state.timeMs,
  });

  site.pendingChoiceChapter = undefined;

  // Advance chapter or complete
  if (site.currentChapter >= site.totalChapters) {
    site.status = 'completed';
    site.completedAtMs = state.timeMs;
  } else {
    site.currentChapter += 1;
    site.chapterProgressMs = 0;
    site.status = 'excavating';
  }

  return { success: true, rewardSummary: choice.outcomeTr };
}

/**
 * Advances excavation progress during game loop
 */
export function tickArchaeologySites(
  state: GameState,
  nowMs: number,
  elapsedMs: number,
  logCallback?: (type: string, description: string, playerId?: string, meta?: Record<string, unknown>) => void
): void {
  if (!state.archaeologySites) return;

  for (const site of Object.values(state.archaeologySites)) {
    if (site.status !== 'excavating') continue;
    if (!site.excavatingPlayerId || !site.assignedFleetId) continue;

    // Verify fleet is still alive and orbiting
    const fleet = state.fleets[site.assignedFleetId];
    if (!fleet || fleet.status !== 'orbiting' || fleet.targetSystemId !== site.systemId) {
      site.status = 'available';
      site.assignedFleetId = null;
      site.excavatingPlayerId = null;
      continue;
    }

    const template = ARCHAEOLOGY_TEMPLATES.find((t) => site.nameTr === t.nameTr || site.id.includes(t.templateId));
    if (!template) continue;

    const chapterConfig = template.chapters[site.currentChapter];
    if (!chapterConfig) continue;

    site.chapterProgressMs += elapsedMs;

    if (site.chapterProgressMs >= chapterConfig.durationMs) {
      const pId = site.excavatingPlayerId;
      const player = state.players[pId];

      if (player) {
        if (!player.minorArtifacts) player.minorArtifacts = 0;
        player.minorArtifacts += chapterConfig.rewardMinorArtifacts;

        // Apply resources
        if (chapterConfig.rewardResources) {
          const hw = Object.values(state.planets).find((p) => p.ownerId === pId && p.isHomeworld);
          if (hw) {
            if (chapterConfig.rewardResources.ore) hw.resources.ore = Math.min(hw.storageCap, hw.resources.ore + chapterConfig.rewardResources.ore);
            if (chapterConfig.rewardResources.crystal) hw.resources.crystal = Math.min(hw.storageCap, hw.resources.crystal + chapterConfig.rewardResources.crystal);
            if (chapterConfig.rewardResources.fuel) hw.resources.fuel = Math.min(hw.storageCap, hw.resources.fuel + chapterConfig.rewardResources.fuel);
          }
        }

        // Apply admiral XP
        if (chapterConfig.rewardXP && fleet.admiralId && state.admirals?.[fleet.admiralId]) {
          state.admirals[fleet.admiralId].xp += chapterConfig.rewardXP;
        }
      }

      // Check if this chapter has an interactive choice
      if (chapterConfig.hasChoice && chapterConfig.choices && chapterConfig.choices.length > 0) {
        site.status = 'choice_pending';
        site.pendingChoiceChapter = site.currentChapter;

        if (logCallback) {
          logCallback(
            'archaeology_choice_needed',
            `🏛️ ARKEOLOJİK KARAR: ${site.nameTr} (Bölüm ${site.currentChapter}) kritik bir keşif kararı bekliyor!`,
            pId,
            { siteId: site.id, chapter: site.currentChapter }
          );
        }
      } else {
        // Complete current chapter without choice
        site.log.push({
          chapter: site.currentChapter,
          titleTr: chapterConfig.titleTr,
          completedAtMs: nowMs,
        });

        if (site.currentChapter >= site.totalChapters) {
          // Entire Site Finished! Grant Major Relic & Hegemony Points!
          site.status = 'completed';
          site.completedAtMs = nowMs;

          if (player) {
            if (!player.artifacts) player.artifacts = [];
            if (site.rewardArtifactId && !player.artifacts.includes(site.rewardArtifactId)) {
              player.artifacts.push(site.rewardArtifactId);
            }
          }

          // Hegemony Points
          if (!state.relay.weeklyPoints[pId]) state.relay.weeklyPoints[pId] = 0;
          state.relay.weeklyPoints[pId] += 100;

          if (logCallback) {
            const artifactMeta = site.rewardArtifactId ? EMPIRE_ARTIFACTS[site.rewardArtifactId] : null;
            logCallback(
              'archaeology_completed',
              `🏛️ BÜYÜK KAZI TAMAMLANDI: ${site.nameTr} tüm bölümleriyle gün yüzüne çıktı! Kadim Kalıntı [${artifactMeta?.nameTr || 'Kadim Yadigâr'}] kazanıldı (+100 Hegemonya Puanı)!`,
              pId,
              { siteId: site.id, artifactId: site.rewardArtifactId }
            );
          }
        } else {
          site.currentChapter += 1;
          site.chapterProgressMs = 0;

          if (logCallback) {
            logCallback(
              'archaeology_chapter_completed',
              `📜 KAZI GELİŞMESİ: ${site.nameTr} Bölüm ${site.currentChapter - 1} tamamlandı (+${chapterConfig.rewardMinorArtifacts} Kadim Eser Parçacığı).`,
              pId,
              { siteId: site.id, chapter: site.currentChapter }
            );
          }
        }
      }
    }
  }

  // Clear expired Active Relic Triumphs
  if (state.activeRelicTriumphs) {
    for (const [pId, triumphs] of Object.entries(state.activeRelicTriumphs)) {
      state.activeRelicTriumphs[pId] = triumphs.filter((t) => nowMs < t.expiresAtMs);
    }
  }
}

/**
 * Validates if a player can activate a Relic's Triumph
 */
export function canActivateRelicTriumph(
  state: GameState,
  playerId: string,
  relicId: EmpireArtifactId
): { canActivate: boolean; reason?: string } {
  const player = state.players[playerId];
  if (!player) return { canActivate: false, reason: 'Oyuncu bulunamadı' };

  if (!player.artifacts || !player.artifacts.includes(relicId)) {
    return { canActivate: false, reason: 'Bu kadim yadigâra henüz sahip değilsiniz' };
  }

  const config = RELIC_TRIUMPH_CONFIGS[relicId];
  if (!config) return { canActivate: false, reason: 'Bu yadigâr için zafer konfigürasyonu tanımlanmamış' };

  const minorArtifacts = player.minorArtifacts || 0;
  if (minorArtifacts < config.minorArtifactsCost) {
    return {
      canActivate: false,
      reason: `Yetersiz Kadim Eser Parçacığı! Gerekli: ${config.minorArtifactsCost}, Mevcut: ${minorArtifacts}`,
    };
  }

  // Check cooldown
  const cooldownUntil = player.relicCooldowns?.[relicId] || 0;
  if (state.timeMs < cooldownUntil) {
    const remainingSec = Math.ceil((cooldownUntil - state.timeMs) / 1000);
    return { canActivate: false, reason: `Yadigâr zaferi henüz bekleme süresinde (Kalan: ${remainingSec}sn)` };
  }

  // Check if triumph is already active
  const playerActiveTriumphs = state.activeRelicTriumphs?.[playerId] || [];
  if (playerActiveTriumphs.some((t) => t.relicId === relicId && state.timeMs < t.expiresAtMs)) {
    return { canActivate: false, reason: 'Bu zafer şu anda zaten aktif durumda' };
  }

  return { canActivate: true };
}

/**
 * Activates a Relic's Triumph, conferring massive temporary imperial powers
 */
export function activateRelicTriumph(
  state: GameState,
  playerId: string,
  relicId: EmpireArtifactId,
  nowMs: number = state.timeMs
): { success: boolean; error?: string } {
  const check = canActivateRelicTriumph(state, playerId, relicId);
  if (!check.canActivate) {
    return { success: false, error: check.reason };
  }

  const player = state.players[playerId];
  const config = RELIC_TRIUMPH_CONFIGS[relicId];

  // Deduct minor artifacts
  player.minorArtifacts = (player.minorArtifacts || 0) - config.minorArtifactsCost;

  // Set cooldown
  if (!player.relicCooldowns) player.relicCooldowns = {};
  player.relicCooldowns[relicId] = nowMs + config.cooldownMs;

  // Record active triumph
  if (!state.activeRelicTriumphs) state.activeRelicTriumphs = {};
  if (!state.activeRelicTriumphs[playerId]) state.activeRelicTriumphs[playerId] = [];

  const triumph: ActiveRelicTriumph = {
    relicId,
    activatedAtMs: nowMs,
    expiresAtMs: nowMs + config.durationMs,
    cooldownUntilMs: nowMs + config.cooldownMs,
  };
  state.activeRelicTriumphs[playerId].push(triumph);

  // Instant trigger for special triumphs (e.g. omniscient archive unity boost)
  if (relicId === 'omniscient_archive') {
    if (state.traditions?.[playerId]) {
      state.traditions[playerId].unity += 200;
    }
  }

  return { success: true };
}

/**
 * Checks if a player has an active Relic Triumph
 */
export function hasActiveRelicTriumph(
  state: GameState,
  playerId: string,
  relicId: EmpireArtifactId
): boolean {
  const triumphs = state.activeRelicTriumphs?.[playerId];
  if (!triumphs) return false;
  return triumphs.some((t) => t.relicId === relicId && state.timeMs < t.expiresAtMs);
}

/**
 * Validates reverse engineering of Minor Artifacts
 */
export function canReverseEngineer(
  state: GameState,
  playerId: string,
  actionType: 'tech_boost' | 'cultural_festival'
): { canReverseEngineer: boolean; reason?: string } {
  const player = state.players[playerId];
  if (!player) return { canReverseEngineer: false, reason: 'Oyuncu bulunamadı' };

  const minorArtifacts = player.minorArtifacts || 0;
  const cost = actionType === 'tech_boost' ? 25 : 30;

  if (minorArtifacts < cost) {
    return {
      canReverseEngineer: false,
      reason: `Yetersiz Kadim Eser Parçacığı! Gerekli: ${cost}, Mevcut: ${minorArtifacts}`,
    };
  }

  return { canReverseEngineer: true };
}

/**
 * Executes Reverse-Engineering of Minor Artifacts
 */
export function reverseEngineerArtifacts(
  state: GameState,
  playerId: string,
  actionType: 'tech_boost' | 'cultural_festival',
  targetPlanetId?: string
): { success: boolean; error?: string; summaryTr?: string } {
  const check = canReverseEngineer(state, playerId, actionType);
  if (!check.canReverseEngineer) return { success: false, error: check.reason };

  const player = state.players[playerId];
  const cost = actionType === 'tech_boost' ? 25 : 30;
  player.minorArtifacts = (player.minorArtifacts || 0) - cost;

  if (actionType === 'tech_boost') {
    // Accelerate research or grant technology burst
    if (player.researchQueue) {
      player.researchQueue.finishTime = Math.max(state.timeMs + 1000, player.researchQueue.finishTime - 60 * 1000);
    } else {
      player.research.engines += 1;
    }
    return {
      success: true,
      summaryTr: '25 Kadim Eser Parçası analiz edildi: Ar-Ge araştırma çevrimi 60 saniye hızlandırıldı!',
    };
  } else {
    // Cultural festival: boost Cultural Unity and Council Stability
    if (state.traditions?.[playerId]) {
      state.traditions[playerId].unity += 120;
    }
    if (state.councils?.[playerId]) {
      state.councils[playerId].stabilityPercent = Math.min(100, state.councils[playerId].stabilityPercent + 10);
    }
    return {
      success: true,
      summaryTr: '30 Kadim Eser Sergilendi: +120 Kültürel Birlik ve +10 Konsey İstikrarı kazanıldı!',
    };
  }
}

/**
 * Dynamic modifier getters for active Relic Triumphs
 */
export function getRelicConstructionMultiplier(state: GameState, playerId: string): number {
  if (hasActiveRelicTriumph(state, playerId, 'chronos_core')) {
    return 0.33; // 3x speed
  }
  if (hasActiveRelicTriumph(state, playerId, 'progenitor_matrix')) {
    return 0.50; // 2x speed
  }
  return 1.0;
}

export function getRelicSpeedMultiplier(state: GameState, playerId: string): number {
  if (hasActiveRelicTriumph(state, playerId, 'rift_hyperdrive')) {
    return 2.0; // 2x flight speed
  }
  return 1.0;
}

export function getRelicFuelCostMultiplier(state: GameState, playerId: string): number {
  if (hasActiveRelicTriumph(state, playerId, 'rift_hyperdrive')) {
    return 0.0; // Zero fuel cost
  }
  return 1.0;
}

export function getRelicSensorBonus(state: GameState, playerId: string): number {
  if (hasActiveRelicTriumph(state, playerId, 'subspace_tachyon_array')) {
    return 2; // +2 extra sensor hops
  }
  return 0;
}

export function getRelicDiplomaticWeightMultiplier(state: GameState, playerId: string): number {
  if (hasActiveRelicTriumph(state, playerId, 'omniscient_archive')) {
    return 2.0; // Double diplomatic weight
  }
  return 1.0;
}
