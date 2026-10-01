import {
  GameState,
  Planet,
  ResearchType,
  ShipType,
  StrategicOpportunity,
} from './types';
import { BUILDING_STATS, DISTRICT_STATS, SHIP_STATS } from './constants';

/**
 * Evaluates the live galactic state and generates up to 3 smart, high-impact
 * contextual strategic opportunities for the player (Slipways Flow).
 */
export function evaluatePlayerOpportunities(
  state: GameState,
  playerId: string
): StrategicOpportunity[] {
  const player = state.players[playerId];
  if (!player) return [];

  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === playerId);
  if (myPlanets.length === 0) return [];

  const hw = myPlanets.find((p) => p.isHomeworld) || myPlanets[0];
  const opportunities: StrategicOpportunity[] = [];

  // =========================================================================
  // 1. EXPLORATION OPPORTUNITY (Sınır Ötesi Keşif)
  // =========================================================================
  const homeSystem = state.map.systems[hw.systemId];
  if (homeSystem) {
    // Find adjacent neighbor systems from lanes
    const neighborSystemIds = (state.map.lanes || [])
      .filter((lane) => lane.fromSystemId === hw.systemId || lane.toSystemId === hw.systemId)
      .map((lane) => (lane.fromSystemId === hw.systemId ? lane.toSystemId : lane.fromSystemId));

    const unexploredNeighbors = neighborSystemIds
      .map((id) => state.map.systems[id])
      .filter((s): s is NonNullable<typeof s> => {
        if (!s) return false;
        const intel = player.intel?.discoveredSystems?.[s.id];
        return intel === undefined || intel === 'unexplored';
      });

    if (unexploredNeighbors.length > 0) {
      const targetSys = unexploredNeighbors[0];
      const hasScout = (hw.garrison.scout || 0) > 0;

      if (hasScout) {
        opportunities.push({
          id: `opp_explore_${targetSys.id}`,
          category: 'explore',
          title: `🔭 ${targetSys.name} Keşif Seferi`,
          desc: `${targetSys.name} sistemine 1x Keşif Gemisi fırlatın ve yeni maden rezervlerini haritaya kaydedin.`,
          icon: '🔭',
          badge: 'KEŞİF',
          actionText: 'Keşif Gemisi Yolla',
          command: {
            type: 'DISPATCH_FLEET',
            originPlanetId: hw.id,
            targetSystemId: targetSys.id,
            ships: { scout: 1, transport: 0, fighter: 0, battleship: 0 },
            cargo: { ore: 0, crystal: 0, fuel: 0 },
          },
          reward: { ore: 180, crystal: 100, momentum: 30 },
          canExecuteNow: (hw.resources.fuel || 0) >= 15,
          cost: { fuel: 15 },
        });
      } else {
        // Needs scout ship built
        const scoutCost = SHIP_STATS.scout.cost;
        const canAffordScout =
          hw.resources.ore >= scoutCost.ore &&
          hw.resources.crystal >= scoutCost.crystal;

        opportunities.push({
          id: `opp_build_scout_${hw.id}`,
          category: 'fleet',
          title: '🛰️ Keşif Sondası İnşası',
          desc: 'Komşu yıldızları tarayabilmek için tersanede 1x Keşif Gemisi imal edin.',
          icon: '🛰️',
          badge: 'DONANMA',
          actionText: 'Keşif Gemisi Üret',
          command: {
            type: 'BUILD_SHIPS',
            planetId: hw.id,
            shipType: 'scout' as ShipType,
            count: 1,
          },
          reward: { ore: 120, crystal: 60, momentum: 25 },
          canExecuteNow: canAffordScout && hw.buildings.shipyard > 0,
          cost: scoutCost,
        });
      }
    }
  }

  // =========================================================================
  // 2. EXPANSION / DISTRICT INFRASTRUCTURE (Gezegen & Nüfus Gelişimi)
  // =========================================================================
  // Check if any planet needs housing, or has open district capacity
  for (const planet of myPlanets) {
    const pops = planet.pops ?? (planet.isHomeworld ? 10 : 2);
    const housing = planet.housing ?? (planet.isHomeworld ? 17 : 7);
    const districts = planet.districts || { city: 1, mining: 1, generator: 0, agriculture: 0 };
    const maxDistricts = planet.isHomeworld ? 20 : 16;
    const totalDistricts = districts.city + districts.mining + districts.generator + districts.agriculture;

    if (totalDistricts < maxDistricts && !planet.districtQueue) {
      const typeToBuild = pops >= housing ? 'city' : 'mining';
      const cost = DISTRICT_STATS[typeToBuild].cost;
      const canAfford =
        planet.resources.ore >= cost.ore &&
        planet.resources.crystal >= cost.crystal &&
        planet.resources.fuel >= cost.fuel;

      opportunities.push({
        id: `opp_district_${planet.id}_${typeToBuild}`,
        category: 'build',
        title: typeToBuild === 'city' ? `🏙️ ${planet.name}: Şehir İlçesi` : `⛏️ ${planet.name}: Maden Bölgesi`,
        desc: typeToBuild === 'city'
          ? 'Nüfus konut kapasitesine yaklaşıyor. Yeni konut ve hizmet için şehir bölgesi kurun.'
          : 'Hammadde gelirini artırmak için yeni bir maden bölgesi inşa edin.',
        icon: typeToBuild === 'city' ? '🏙️' : '⛏️',
        badge: 'ALTYAPI',
        actionText: typeToBuild === 'city' ? 'Şehir İnşa Et' : 'Maden Bölgesi Kur',
        command: {
          type: 'BUILD_DISTRICT',
          planetId: planet.id,
          districtType: typeToBuild,
        },
        reward: { crystal: 80, fuel: 40, momentum: 25 },
        canExecuteNow: canAfford,
        cost,
      });
      break;
    }
  }

  // =========================================================================
  // 3. RESEARCH & SCIENCE ACCELERATION (Ar-Ge Atılımı)
  // =========================================================================
  if (!player.researchQueue) {
    const researchTypes: ResearchType[] = ['weapons', 'engines', 'sensors'];
    // Pick the lowest level research
    let lowestType: ResearchType = 'weapons';
    let lowestLevel = 999;
    for (const t of researchTypes) {
      const lvl = player.research[t] || 0;
      if (lvl < lowestLevel) {
        lowestLevel = lvl;
        lowestType = t;
      }
    }

    const techNamesTr: Record<ResearchType, string> = {
      weapons: 'Ağır Lazer Bataryaları',
      engines: 'İyon İtki Motorları',
      sensors: 'Derin Uzay Sensör Ağı',
    };

    opportunities.push({
      id: `opp_research_${lowestType}`,
      category: 'tech',
      title: `🔬 Ar-Ge: ${techNamesTr[lowestType]}`,
      desc: `İmparatorluk teknolojisini ileri taşımak için ${techNamesTr[lowestType]} (Seviye ${lowestLevel + 1}) araştırmasını başlatın.`,
      icon: '🔬',
      badge: 'BİLİM',
      actionText: 'Araştırmayı Başlat',
      command: {
        type: 'START_RESEARCH',
        researchType: lowestType,
      },
      reward: { ore: 200, momentum: 30 },
      canExecuteNow: (hw.resources.crystal || 0) >= 120,
      cost: { ore: 150, crystal: 120 },
    });
  }

  // =========================================================================
  // 4. FLEET MILITARY DOCTRINE (Donanma Hazırlığı)
  // =========================================================================
  const totalFighters = myPlanets.reduce((acc, p) => acc + (p.garrison.fighter || 0), 0);
  if (totalFighters < 4 && hw.buildings.shipyard > 0) {
    const fighterCost = SHIP_STATS.fighter.cost;
    const canAfford =
      hw.resources.ore >= fighterCost.ore * 2 &&
      hw.resources.crystal >= fighterCost.crystal * 2;

    opportunities.push({
      id: `opp_fleet_fighters_${hw.id}`,
      category: 'fleet',
      title: '🚀 Donanma Takviyesi: 2x Avcı',
      desc: 'Sektör güvenliği ve hava üstünlüğü için tersanede 2x Taarruz Avcısı (Fighter) üretin.',
      icon: '🚀',
      badge: 'ASKERİ',
      actionText: '2x Avcı Siparişi Ver',
      command: {
        type: 'BUILD_SHIPS',
        planetId: hw.id,
        shipType: 'fighter' as ShipType,
        count: 2,
      },
      reward: { fuel: 80, momentum: 35 },
      canExecuteNow: canAfford,
      cost: { ore: fighterCost.ore * 2, crystal: fighterCost.crystal * 2, fuel: fighterCost.fuel * 2 },
    });
  }

  // =========================================================================
  // 5. LOGISTICS & SUPPLY CONVOY (Koloni İkmal Hattı)
  // =========================================================================
  const colonies = myPlanets.filter((p) => !p.isHomeworld);
  for (const col of colonies) {
    if (col.resources.ore >= 750) {
      opportunities.push({
        id: `opp_supply_${col.id}`,
        category: 'logistics',
        title: `🚛 ${col.name} İkmal Konvoyu`,
        desc: `${col.name} madenlerinde biriken 500 Cevheri başkente aktarmak için tek tıkla ikmal konvoyu fırlatın.`,
        icon: '🚛',
        badge: 'LOJİSTİK',
        actionText: 'İkmal Konvoyunu Başlat',
        command: {
          type: 'DISPATCH_SUPPLY_CONVOY',
          colonyId: col.id,
        },
        reward: { crystal: 120, momentum: 30 },
        canExecuteNow: true,
      });
      break;
    }
  }

  // Return up to 3 unique opportunities
  return opportunities.slice(0, 3);
}
