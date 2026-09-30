import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Crosshair,
  Crown,
  Flame,
  Gem,
  HelpCircle,
  Navigation,
  Pickaxe,
  Radio,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TriangleAlert,
  Truck,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { calculateRouteInfo, checkInterceptionFeasibility } from '../../engine/flight';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { getRouteCrisisModifiers } from '../../engine/events';
import { ADMIRAL_TRAITS } from '../../engine/admirals';
import {
  Fleet,
  FleetDoctrine,
  GameState,
  MissionType,
  Planet,
  Resources,
  ShipType,
  StarSystem,
} from '../../engine/types';
import { SelectedTarget } from '../types';
import { GAME_CONSTANTS, SHIP_STATS } from '../../engine/constants';
import { formatClockTime, formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface CommandPanelProps {
  state: GameState;
  activePlayerId: string;
  activePlanet: Planet | undefined;
  selectedTarget: SelectedTarget | null;
  onDispatchFleet: (
    targetSystemId: string,
    targetPlanetId: string | undefined,
    targetFleetId: string | undefined,
    ships: Record<ShipType, number>,
    cargo: Partial<Resources>,
    mission: MissionType,
    admiralId?: string,
    doctrine?: FleetDoctrine
  ) => void;
  onRecallFleet: (fleetId: string) => void;
  currentTimeMs: number;
  onClose?: () => void;
}

const CommandPanelComponent: React.FC<CommandPanelProps> = ({
  state,
  activePlayerId,
  activePlanet,
  selectedTarget,
  onDispatchFleet,
  onRecallFleet,
  currentTimeMs,
  onClose,
}) => {
  const [selectedMission, setSelectedMission] = useState<MissionType>('explore');
  const [ships, setShips] = useState<Record<ShipType, number>>({
    scout: 0,
    transport: 0,
    fighter: 0,
    battleship: 0,
  });
  const [cargo, setCargo] = useState<Resources>({ ore: 0, crystal: 0, fuel: 0 });
  const [activeTab, setActiveTab] = useState<'dispatch' | 'active_fleets'>('dispatch');
  const [selectedAdmiralId, setSelectedAdmiralId] = useState<string>('');
  const [doctrine, setDoctrine] = useState<FleetDoctrine>('balanced');

  // Player's admirals for fleet command assignment
  const playerAdmirals = useMemo(() => {
    if (!state.admirals) return [];
    return Object.values(state.admirals).filter((a) => a.ownerId === activePlayerId);
  }, [state.admirals, activePlayerId]);

  const availableAdmirals = useMemo(() => {
    return playerAdmirals.filter((a) => !a.assignedFleetId);
  }, [playerAdmirals]);

  const selectedAdmiral = useMemo(() => {
    if (!selectedAdmiralId || !state.admirals) return null;
    return state.admirals[selectedAdmiralId] || null;
  }, [selectedAdmiralId, state.admirals]);

  // Resolve target system & fleet
  const targetSystem = selectedTarget ? state.map.systems[selectedTarget.systemId] : null;
  const targetFleet = selectedTarget?.fleetId ? state.fleets[selectedTarget.fleetId] : null;

  // Resolve target planet & Keplerian orbital telemetry
  const targetPlanetId = selectedTarget?.planetId;
  const targetPlanet = targetPlanetId ? state.planets[targetPlanetId] : null;
  const targetSlot = targetSystem?.slots.find((s) => s.planetId === targetPlanetId);
  const targetPlanetOwner = targetPlanet?.ownerId ? state.players[targetPlanet.ownerId] : null;

  const targetPlanetOrbit = useMemo(() => {
    if (!targetSystem || !targetSlot || !targetPlanetId) return null;
    return calculatePlanetOrbit(targetSystem.id, targetSlot.slotIndex, targetPlanetId, currentTimeMs);
  }, [targetSystem, targetSlot, targetPlanetId, currentTimeMs]);

  // Active player research
  const activePlayer = state.players[activePlayerId];
  const engineTech = activePlayer?.research.engines || 0;

  // Pre-flight calculation (incorporating admiral flight traits and sector crisis modifiers)
  const routeInfo = useMemo(() => {
    if (!activePlanet || !targetSystem) return null;
    const baseRoute = calculateRouteInfo(
      activePlanet.systemId,
      targetSystem.id,
      ships,
      state.map.lanes,
      engineTech
    );
    if (!baseRoute) return null;

    let speed = baseRoute.speed;
    let durationMs = baseRoute.durationMs;
    let fuelCost = baseRoute.fuelCost;

    if (selectedAdmiral) {
      const trait = ADMIRAL_TRAITS[selectedAdmiral.traitId];
      if (trait) {
        if (trait.speedMultiplier > 1) {
          speed = Math.round(speed * trait.speedMultiplier);
          durationMs = Math.max(1000, Math.round(durationMs / trait.speedMultiplier));
        }
        if (trait.fuelDiscount > 0) {
          fuelCost = Math.max(1, Math.round(fuelCost * (1 - trait.fuelDiscount)));
        }
      }
    }

    const crisisMod = getRouteCrisisModifiers(state, baseRoute.path, currentTimeMs);
    if (crisisMod.speedMultiplier !== 1.0) {
      durationMs = Math.round(durationMs / crisisMod.speedMultiplier);
    }
    if (crisisMod.fuelCostMultiplier !== 1.0) {
      fuelCost = Math.round(fuelCost * crisisMod.fuelCostMultiplier);
    }

    return {
      ...baseRoute,
      speed,
      durationMs,
      fuelCost,
      crisisMod,
    };
  }, [activePlanet, targetSystem, ships, state.map.lanes, engineTech, selectedAdmiral, state, currentTimeMs]);

  // Target Ancient Titan Boss check
  const targetTitanBoss = useMemo(() => {
    if (!targetSystem || !state.sectorEvents) return null;
    return (
      Object.values(state.sectorEvents).find(
        (ev) =>
          ev.systemId === targetSystem.id &&
          ev.type === 'ancient_titan' &&
          !ev.resolved &&
          currentTimeMs < ev.expiresAtMs
      ) || null
    );
  }, [targetSystem, state.sectorEvents, currentTimeMs]);

  // Projected arrival orbital angle
  const projectedArrivalAngleDeg = useMemo(() => {
    if (!targetPlanetOrbit || !routeInfo) return null;
    const arrivalTimeMs = currentTimeMs + routeInfo.durationMs;
    const futureAngle =
      (targetPlanetOrbit.initialAngle +
        (arrivalTimeMs / targetPlanetOrbit.orbitalPeriodMs) * Math.PI * 2) %
      (Math.PI * 2);
    return Math.round((futureAngle * 180) / Math.PI);
  }, [targetPlanetOrbit, routeInfo, currentTimeMs]);

  // Interception feasibility check
  const interceptCheck = useMemo(() => {
    if (selectedMission !== 'intercept' || !activePlanet || !targetFleet) return null;
    return checkInterceptionFeasibility(
      activePlanet.systemId,
      targetFleet,
      ships,
      state.map.lanes,
      engineTech,
      currentTimeMs
    );
  }, [selectedMission, activePlanet, targetFleet, ships, state.map.lanes, engineTech, currentTimeMs]);

  // Available garrison counts
  const garrison = activePlanet?.garrison || { scout: 0, transport: 0, fighter: 0, battleship: 0 };
  const totalSelectedShips = Object.values(ships).reduce((a, b) => a + b, 0);

  // Total cargo capacity
  const totalCargoCap = useMemo(() => {
    let cap = 0;
    for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
      cap += count * SHIP_STATS[st].cargoCapacity;
    }
    return cap;
  }, [ships]);

  // Mission selection handler with clean resets to avoid glitching
  const handleSelectMission = (mission: MissionType) => {
    setSelectedMission(mission);
    if (mission === 'colonize') {
      const availTransports = garrison.transport || 0;
      setShips((prev) => ({ ...prev, transport: Math.max(1, Math.min(availTransports, Math.max(1, prev.transport))) }));
      setCargo({ ...GAME_CONSTANTS.COLONY_COST });
    } else if (mission === 'transport') {
      // If targeting debris, keep cargo clean (0) so ship can scoop debris
      if (targetSystem?.hasDebris && (!targetPlanet || targetPlanet.ownerId !== activePlayerId)) {
        setCargo({ ore: 0, crystal: 0, fuel: 0 });
      }
      setShips((prev) => ({
        ...prev,
        transport: prev.transport > 0 ? prev.transport : (garrison.transport > 0 ? 1 : 0),
      }));
    } else {
      // Clear cargo when switching away to missions that don't carry cargo
      setCargo({ ore: 0, crystal: 0, fuel: 0 });
    }
  };

  const totalCargoWeight = (cargo.ore || 0) + (cargo.crystal || 0) + (cargo.fuel || 0);
  const isCargoOverCapacity = (selectedMission === 'transport' || selectedMission === 'colonize') && totalCargoWeight > totalCargoCap;

  // Auto-switch contextual mission when selected target changes
  useEffect(() => {
    if (!selectedTarget) return;

    if (selectedTarget.fleetId) {
      const fl = state.fleets[selectedTarget.fleetId];
      if (fl && fl.ownerId !== activePlayerId) {
        handleSelectMission('intercept');
        return;
      }
    }

    if (selectedTarget.planetId) {
      const p = state.planets[selectedTarget.planetId];
      if (p) {
        if (!p.ownerId) {
          handleSelectMission('colonize');
        } else if (p.ownerId !== activePlayerId) {
          handleSelectMission('attack');
        } else if (p.id !== activePlanet?.id) {
          handleSelectMission('transport');
        }
      }
      return;
    }

    if (selectedTarget.systemId) {
      const sys = state.map.systems[selectedTarget.systemId];
      if (sys) {
        if (sys.poi || !state.players[activePlayerId]?.intel.discoveredSystems[sys.id]) {
          handleSelectMission('explore');
        } else if (sys.hasRelay) {
          handleSelectMission('support');
        } else if (sys.hasDebris && (sys.hasDebris.ore > 0 || sys.hasDebris.crystal > 0)) {
          handleSelectMission('transport');
        }
      }
    }
  }, [selectedTarget?.systemId, selectedTarget?.planetId, selectedTarget?.fleetId, activePlayerId, activePlanet?.id]);

  // Determine eligible contextual missions for target
  const eligibleMissions = useMemo(() => {
    const list: MissionType[] = [];
    if (!targetSystem) return list;

    if (targetFleet && targetFleet.ownerId !== activePlayerId) {
      list.push('intercept');
    }

    if (targetSystem.poi || !activePlayer?.intel.discoveredSystems[targetSystem.id]) {
      list.push('explore');
    }

    const hasEmptySlot = targetSystem.slots.some((s) => s.ownerId === null);
    if (hasEmptySlot && !targetSystem.hasRelay) {
      list.push('colonize');
    }

    const hasEnemyColony = targetSystem.slots.some(
      (s) => state.planets[s.planetId] && state.planets[s.planetId].ownerId !== activePlayerId
    );
    if (hasEnemyColony) {
      list.push('attack');
    }

    if (targetSystem.hasRelay) {
      list.push('support');
    }

    list.push('transport');

    return Array.from(new Set(list));
  }, [targetSystem, targetFleet, activePlayerId, state.planets, activePlayer]);

  // My in-flight fleets
  const myActiveFleets = useMemo(() => {
    return Object.values(state.fleets).filter(
      (f) => f.ownerId === activePlayerId && f.status !== 'destroyed'
    );
  }, [state.fleets, activePlayerId]);

  // Target protection & vacation check
  const targetProtectionStatus = useMemo(() => {
    if (selectedMission !== 'attack') return null;
    const targetPlanetId = selectedTarget?.planetId;
    if (!targetPlanetId || !state.planets[targetPlanetId]) return null;

    const targetPlanet = state.planets[targetPlanetId];
    const targetOwner = state.players[targetPlanet.ownerId];

    if (!targetOwner || targetOwner.id === activePlayerId) return null;

    if (targetOwner.vacationMode) {
      return { isBlocked: true, reason: 'Hedef komutan tatil modundadır (Saldırı düzenlenemez).' };
    }

    if (currentTimeMs < (activePlayer?.protectionUntilTime || 0)) {
      const remainingHours = Math.ceil(((activePlayer?.protectionUntilTime || 0) - currentTimeMs) / (3600 * 1000));
      return { isBlocked: true, reason: `Acemi koruması altındasınız (${remainingHours} sa). PvP saldırısı düzenlenemez.` };
    }

    if (currentTimeMs < targetOwner.protectionUntilTime) {
      return { isBlocked: true, reason: 'Hedef komutan acemi koruması altındadır.' };
    }

    return { isBlocked: false, reason: null };
  }, [selectedMission, selectedTarget, state.planets, state.players, activePlayer, currentTimeMs, activePlayerId]);

  // Tactical combat outcome prediction (GDD Section 7)
  const combatPrediction = useMemo(() => {
    if ((selectedMission !== 'attack' && selectedMission !== 'intercept') || totalSelectedShips === 0) {
      return null;
    }

    const myWepLevel = activePlayer?.research.weapons || 0;
    let myWepMult = 1 + myWepLevel * 0.10;
    if (selectedAdmiral) {
      const trait = ADMIRAL_TRAITS[selectedAdmiral.traitId];
      if (trait?.attackMultiplier) {
        myWepMult *= trait.attackMultiplier;
      }
    }

    let myAtt = 0;
    let myHp = 0;
    for (const [st, count] of Object.entries(ships) as [ShipType, number][]) {
      myAtt += count * SHIP_STATS[st].attack * myWepMult;
      myHp += count * (SHIP_STATS[st].hull + SHIP_STATS[st].shield);
    }
    const myPower = myAtt * 1.5 + myHp;

    if (myPower <= 0) return null;

    // Intercept target
    if (selectedMission === 'intercept' && targetFleet) {
      const defPlayer = state.players[targetFleet.ownerId];
      const defWepLevel = defPlayer?.research.weapons || 0;
      const defWepMult = 1 + defWepLevel * 0.10;

      let defAtt = 0;
      let defHp = 0;
      for (const [st, count] of Object.entries(targetFleet.ships) as [ShipType, number][]) {
        defAtt += count * SHIP_STATS[st].attack * defWepMult;
        defHp += count * (SHIP_STATS[st].hull + SHIP_STATS[st].shield);
      }
      const defPower = defAtt * 1.5 + defHp;
      const winRate = Math.min(98, Math.max(5, Math.round((myPower / (myPower + defPower)) * 100)));

      return {
        winRate,
        isIntelClear: true,
        summary: winRate >= 70 ? 'Yüksek Zafer İhtimali' : winRate >= 45 ? 'Çekişmeli Savaş' : 'Yüksek Kayıp Riski',
        defenderShipsCount: Object.values(targetFleet.ships).reduce((a, b) => a + b, 0),
        stance: null,
      };
    }

    // Planet attack target
    if (selectedMission === 'attack' && selectedTarget?.planetId && state.planets[selectedTarget.planetId]) {
      const targetPlanet = state.planets[selectedTarget.planetId];
      const defPlayer = state.players[targetPlanet.ownerId];
      const intelLevel = activePlayer?.intel.discoveredSystems[targetPlanet.systemId] || 'unexplored';
      const isIntelClear = intelLevel === 'full' || intelLevel === 'deep_intel';

      const defWepLevel = defPlayer?.research.weapons || 0;
      const defWepMult = 1 + defWepLevel * 0.10;

      let defAtt = 0;
      let defHp = 0;
      for (const [st, count] of Object.entries(targetPlanet.garrison) as [ShipType, number][]) {
        defAtt += count * SHIP_STATS[st].attack * defWepMult;
        defHp += count * (SHIP_STATS[st].hull + SHIP_STATS[st].shield);
      }
      const defPower = defAtt * 1.5 + defHp;

      if (!isIntelClear && defPower > 0) {
        // Range estimation for vague intel
        const baseWinRate = Math.round((myPower / (myPower + defPower)) * 100);
        return {
          winRate: baseWinRate,
          isIntelClear: false,
          minRate: Math.max(10, baseWinRate - 20),
          maxRate: Math.min(95, baseWinRate + 15),
          summary: 'Kısmi İstihbarat (Tahmini Aralık)',
          defenderShipsCount: null,
          stance: targetPlanet.stance,
        };
      }

      const winRate = defPower === 0 ? 99 : Math.min(98, Math.max(5, Math.round((myPower / (myPower + defPower)) * 100)));
      return {
        winRate,
        isIntelClear: true,
        summary: winRate >= 70 ? 'Üstün Filo Gücü' : winRate >= 45 ? 'Dengeli Muharebe' : 'Ağır Savunma Karşısında Riskli',
        defenderShipsCount: Object.values(targetPlanet.garrison).reduce((a, b) => a + b, 0),
        stance: targetPlanet.stance,
      };
    }

    return null;
  }, [selectedMission, totalSelectedShips, ships, activePlayer, targetFleet, selectedTarget, state.planets, state.players, selectedAdmiral]);

  // Military power calculation for selected fleet (incorporating admiral leadership)
  const selectedFleetPower = useMemo(() => {
    let basePower = (
      (ships.battleship || 0) * 140 +
      (ships.fighter || 0) * 35 +
      (ships.scout || 0) * 12 +
      (ships.transport || 0) * 6
    );
    if (selectedAdmiral) {
      const trait = ADMIRAL_TRAITS[selectedAdmiral.traitId];
      if (trait?.attackMultiplier) {
        basePower = Math.round(basePower * trait.attackMultiplier);
      }
    }
    return basePower;
  }, [ships, selectedAdmiral]);

  return (
    <aside className="w-[390px] min-w-[390px] max-w-[390px] shrink-0 h-full border-l border-[#1c3647] stellaris-outliner flex flex-col z-20 select-none overflow-hidden shadow-2xl">
      {/* Top Tabs: Dispatch vs Active Fleets & Close Button */}
      <div className="p-2 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
        <div className="flex flex-1 gap-1.5 bg-[#091522]/80 p-1 rounded-sm border border-[#142d3d]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dispatch');
            }}
            className={`flex-1 py-1 px-2 text-[11px] font-mono tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'dispatch'
                ? 'stellaris-switcher-btn active font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#12283a]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sevkiyat</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('active_fleets');
            }}
            className={`flex-1 py-1 px-2 text-[11px] font-mono tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
              activeTab === 'active_fleets'
                ? 'stellaris-switcher-btn active font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#12283a]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Uçuşlar ({myActiveFleets.length})</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-sm ml-2 text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
            title="Paneli Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {activeTab === 'active_fleets' ? (
        /* Active Fleets In Flight */
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between">
            <span>Yoldaki Filolarınız</span>
            <span className="text-[#3ca8d1]">{myActiveFleets.length} Aktif</span>
          </div>

          {myActiveFleets.length === 0 ? (
            <div className="stellaris-item-card text-xs text-slate-400 text-center py-10 p-4 border-dashed border-[#1c3647]">
              <Navigation className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <span>Aktif uçuşta filonuz bulunmuyor.</span>
              <p className="text-[10px] text-slate-500 mt-1">
                Hedef seçip filolarınızı yeni keşif veya harekat görevlerine sevk edebilirsiniz.
              </p>
            </div>
          ) : (
            myActiveFleets.map((fleet) => {
              const remainingMs = Math.max(0, fleet.arrivalTime - currentTimeMs);
              const remainingRecallWindowMs = Math.max(0, fleet.recallLockedAfterTime - currentTimeMs);
              const canRecall = currentTimeMs < fleet.recallLockedAfterTime && !fleet.isReturning;
              const totalShips = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
              const targetSys = state.map.systems[fleet.targetSystemId];
              const fleetPower =
                (fleet.ships.battleship || 0) * 140 +
                (fleet.ships.fighter || 0) * 35 +
                (fleet.ships.scout || 0) * 12 +
                (fleet.ships.transport || 0) * 6;

              return (
                <div
                  key={fleet.id}
                  className="stellaris-item-card p-3 space-y-2 border border-[#1c3647] hover:border-[#3885a8] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 font-display">
                      {fleet.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#3ca8d1] bg-[#07131e] px-2 py-0.5 rounded-sm border border-[#1c3647] uppercase font-bold">
                      {fleet.isReturning ? 'Dönüşte' : fleet.mission}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span>Hedef: {targetSys?.name || fleet.targetSystemId}</span>
                    <span className="text-[#3ca8d1] font-bold">
                      {formatDuration(remainingMs)}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Varış: {formatClockTime(fleet.arrivalTime)}</span>
                    <span className="stellaris-power text-[11px]">⚡ {fleetPower}</span>
                  </div>

                  <div className="text-[10px] font-mono flex items-center justify-between pt-1 border-t border-[#18374b]/60">
                    <span className="text-slate-400">
                      {totalShips} Gemi • Yakıt: {fleet.fuelCost}
                    </span>

                    {canRecall ? (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRecallFleet(fleet.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-500/50 hover:bg-rose-900/60 transition-all shadow-sm"
                        title="Filoyu geri çağır"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Geri Çağır ({formatDuration(remainingRecallWindowMs)})</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        {fleet.isReturning ? 'Dönüş rotasında' : '🔒 %50 Kilidi Devrede'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Dispatch Form */
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {/* Target System Header */}
          {targetSystem ? (
            <div className="stellaris-item-card p-3 space-y-2 border border-[#234b66]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#3ca8d1] uppercase tracking-wider font-semibold">
                  Hedef Koordinat
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({targetSystem.x}, {targetSystem.y})
                </span>
              </div>

              <div className="text-sm font-bold text-white font-display flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#3ca8d1]" />
                  {targetSystem.name} SİSTEMİ
                </span>
                {targetSystem.hasRelay && (
                  <span className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-sm font-mono font-bold">
                    NEXUS RÖLESİ
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-300 flex items-center gap-3 pt-1 border-t border-[#18374b]/60 font-mono">
                <span>{targetSystem.slots.length} Gezegen Yuvası</span>
                {targetSystem.poi && !targetSystem.poi.explored && (
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" /> Anomali Mevcut
                  </span>
                )}
                {targetSystem.hasDebris && (targetSystem.hasDebris.ore > 0 || targetSystem.hasDebris.crystal > 0) && (
                  <span className="text-amber-300 font-bold">Enkaz Alanı</span>
                )}
              </div>

              {/* Target Planet & Orbital Rendezvous Telemetry */}
              {targetSlot && targetPlanetOrbit && (
                <div className="mt-2 p-2 bg-[#06121c] border border-[#1b3e54] rounded-sm space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-[#18374b] pb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: targetPlanetOwner?.color || '#38bdf8' }}
                      />
                      {targetSlot.name}
                    </span>
                    <span className="text-[9.5px] text-[#3ca8d1] uppercase px-1.5 py-0.5 rounded-sm bg-[#0b2233] border border-[#1c445c]">
                      {targetSlot.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Mevcut Yörünge Açısı</span>
                      <span className="text-amber-400 font-bold">{targetPlanetOrbit.currentAngleDeg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Yörünge Periyodu</span>
                      <span className="text-slate-200">
                        {(targetPlanetOrbit.orbitalPeriodMs / (3600 * 1000)).toFixed(0)} Saat
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Açısal Hız</span>
                      <span className="text-[#3ca8d1]">{targetPlanetOrbit.speedDegPerHour}° / sa</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Mesafe</span>
                      <span className="text-slate-200">{targetPlanetOrbit.auDistance} AU</span>
                    </div>
                  </div>

                  {projectedArrivalAngleDeg !== null && routeInfo && (
                    <div className="pt-1.5 border-t border-[#18374b] text-[10px] bg-[#0c2438]/40 -mx-1 px-1.5 py-1 rounded-sm">
                      <div className="flex items-center justify-between text-[#3ca8d1]">
                        <span>🎯 Varış Randevusu:</span>
                        <span className="font-bold">{projectedArrivalAngleDeg}°</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Uçuş süresince gezegen +{((projectedArrivalAngleDeg - targetPlanetOrbit.currentAngleDeg + 360) % 360)}° yörünge katedecek.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Hakimiyet:</span>
                    <span style={{ color: targetPlanetOwner?.color || '#10b981' }} className="font-semibold">
                      {targetPlanetOwner ? targetPlanetOwner.name : 'Boş / Koloniye Uygun'}
                    </span>
                  </div>
                </div>
              )}

              {/* Debris Quick Salvage Action */}
              {targetSystem.hasDebris && (targetSystem.hasDebris.ore > 0 || targetSystem.hasDebris.crystal > 0) && (
                <div className="mt-2 p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-300 font-mono font-bold block">
                      ⚙️ Enkaz: {targetSystem.hasDebris.ore} Cevher, {targetSystem.hasDebris.crystal} Kristal
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Gereken: {Math.max(1, Math.ceil(((targetSystem.hasDebris.ore || 0) + (targetSystem.hasDebris.crystal || 0)) / SHIP_STATS.transport.cargoCapacity))} Nakliye Gemisi
                      {garrison.transport === 0 && (
                        <span className="text-rose-400 block font-bold mt-0.5">
                          ⚠️ Garnizonda Nakliye Gemisi yok!
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!targetSystem?.hasDebris) return;
                      sound.playClick();
                      const debrisTotal = (targetSystem.hasDebris.ore || 0) + (targetSystem.hasDebris.crystal || 0);
                      const needed = Math.max(1, Math.ceil(debrisTotal / SHIP_STATS.transport.cargoCapacity));
                      setSelectedMission('transport');
                      // Clear cargo: Salvage transports fly empty to pick up debris from space!
                      setCargo({ ore: 0, crystal: 0, fuel: 0 });
                      const availTransports = garrison.transport || 0;
                      const toSend = Math.min(availTransports, needed);
                      setShips({
                        scout: 0,
                        transport: toSend > 0 ? toSend : (availTransports > 0 ? 1 : 0),
                        fighter: (garrison.fighter || 0) > 0 ? 1 : 0,
                        battleship: 0,
                      });
                    }}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-sm text-[10px] font-mono font-bold transition-all shadow-sm active:scale-95"
                  >
                    Enkazı Topla
                  </button>
                </div>
              )}

              {/* Target Protection / Vacation Mode Alert Banner */}
              {targetProtectionStatus?.isBlocked && (
                <div className="mt-2 p-2 bg-rose-950/40 border border-rose-500/50 rounded-sm flex items-center gap-2 text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{targetProtectionStatus.reason}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="stellaris-item-card border-dashed border-[#1c3647] p-5 text-center text-xs text-slate-400">
              <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <span>Haritadan bir yıldız sistemi, filo veya koloni seçin.</span>
            </div>
          )}

          {/* Mission Selector Tabs */}
          {targetSystem && (
            <div>
              <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
                Görev Türü
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'explore', label: 'Keşfet', icon: Compass },
                  { id: 'transport', label: 'Taşı/Topla', icon: Truck },
                  { id: 'attack', label: 'Saldır', icon: Swords },
                  { id: 'intercept', label: 'Önle', icon: Crosshair },
                  { id: 'support', label: 'Destek', icon: Shield },
                  { id: 'colonize', label: 'Koloni', icon: Sparkles },
                ].map(({ id, label, icon: Icon }) => {
                  const isEligible = eligibleMissions.includes(id as MissionType);
                  const isCurrent = selectedMission === id;
                  return (
                    <button
                      key={id}
                      disabled={!isEligible}
                      onClick={() => {
                        sound.playClick();
                        handleSelectMission(id as MissionType);
                      }}
                      className={`p-2 rounded-sm text-[11px] font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-[#153448] border border-[#3ca8d1] text-cyan-300 font-bold shadow-[0_0_10px_rgba(60,168,209,0.3)]'
                          : isEligible
                          ? 'bg-[#0d1e2b] border border-[#1b3a4f] text-slate-300 hover:border-[#3885a8] hover:text-white'
                          : 'bg-[#09131c]/60 border border-[#142633]/60 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ship Selection Sliders */}
          <div>
            <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Sevk Edilecek Gemiler</span>
              <span className="stellaris-power text-[11px]">
                {totalSelectedShips} Gemi (⚡ {selectedFleetPower})
              </span>
            </div>

            {/* Quick Fleet Composition Preset Chips */}
            <div className="flex items-center gap-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShips({
                    scout: garrison.scout || 0,
                    transport: garrison.transport || 0,
                    fighter: garrison.fighter || 0,
                    battleship: garrison.battleship || 0,
                  });
                }}
                disabled={Object.values(garrison).every((c) => c === 0)}
                className="stellaris-btn-metallic px-2 py-1 rounded-sm text-[10px] font-mono text-cyan-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                title="Garnizondaki tüm gemileri seç"
              >
                ⚡ Tüm Filo
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShips({
                    scout: 0,
                    transport: 0,
                    fighter: garrison.fighter || 0,
                    battleship: garrison.battleship || 0,
                  });
                }}
                disabled={(garrison.fighter || 0) + (garrison.battleship || 0) === 0}
                className="stellaris-btn-metallic px-2 py-1 rounded-sm text-[10px] font-mono text-rose-300 hover:text-rose-200 transition-all cursor-pointer disabled:opacity-40"
                title="Yalnızca muharip gemileri seç (Avcı + Savaş Gemisi)"
              >
                ⚔️ Muharebe
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShips({
                    scout: Math.min(1, garrison.scout || 0),
                    transport: 0,
                    fighter: 0,
                    battleship: 0,
                  });
                }}
                disabled={(garrison.scout || 0) === 0}
                className="stellaris-btn-metallic px-2 py-1 rounded-sm text-[10px] font-mono text-amber-300 hover:text-amber-200 transition-all cursor-pointer disabled:opacity-40"
                title="Hızlı keşif için 1 Gözcü seç"
              >
                🔭 1 Gözcü
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShips({ scout: 0, transport: 0, fighter: 0, battleship: 0 });
                }}
                disabled={totalSelectedShips === 0}
                className="stellaris-btn-metallic px-2 py-1 rounded-sm text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer ml-auto disabled:opacity-40"
                title="Gemi seçimini sıfırla"
              >
                Sıfırla
              </button>
            </div>

            <div className="space-y-2">
              {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                const available = garrison[st] || 0;
                const selected = ships[st];
                const stats = SHIP_STATS[st];

                return (
                  <div
                    key={st}
                    className="stellaris-item-card p-2 text-xs border border-[#1c3647]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-cyan-400 font-mono font-bold">
                          {st === 'battleship' ? '🛡️' : st === 'fighter' ? '⚔️' : st === 'transport' ? '📦' : '🔭'}
                        </span>
                        {stats.nameTr}
                      </span>
                      <span className="font-mono text-slate-300 text-[10.5px]">
                        Garnizon: <span className="text-white font-bold">{available}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={available}
                        value={selected}
                        disabled={available === 0}
                        onChange={(e) =>
                          setShips((prev) => ({ ...prev, [st]: parseInt(e.target.value) || 0 }))
                        }
                        className="flex-1 accent-[#3ca8d1] h-1.5 bg-[#081521] rounded-sm cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled={available === 0}
                        onClick={() => setShips((prev) => ({ ...prev, [st]: available }))}
                        className="px-1.5 py-0.5 rounded-sm text-[9.5px] font-mono border border-[#1c3d52] bg-[#0d2232] text-slate-200 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        Tümü
                      </button>
                      <span className="font-mono text-xs w-6 text-right font-bold text-cyan-300">
                        {selected}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cargo Controls (Enabled for transport / colonize) */}
          {(selectedMission === 'transport' || selectedMission === 'colonize') && (
            <div className="stellaris-item-card p-2.5 space-y-2 border border-[#234b66]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="text-slate-200 font-bold">
                  {selectedMission === 'colonize'
                    ? 'Koloni Teçhizatı (Gereksinim)'
                    : targetSystem?.hasDebris && (!targetPlanet || targetPlanet.ownerId !== activePlayerId)
                    ? 'Kurtarma Operasyonu (Enkaz Toplama)'
                    : 'Taşınacak Kaynak (Yük)'}
                </span>
                <span
                  className={
                    isCargoOverCapacity
                      ? 'text-rose-400 font-bold animate-pulse'
                      : totalCargoCap === 0
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-300'
                  }
                >
                  {totalCargoCap === 0
                    ? 'Kapasite: 0 (Nakliye seçin)'
                    : isCargoOverCapacity
                    ? `⚠️ Aşım: ${totalCargoWeight.toLocaleString()} / ${totalCargoCap.toLocaleString()}`
                    : `Kapasite: ${totalCargoWeight.toLocaleString()} / ${totalCargoCap.toLocaleString()}`}
                </span>
              </div>

              {selectedMission === 'transport' && targetSystem?.hasDebris && (!targetPlanet || targetPlanet.ownerId !== activePlayerId) && (
                <div className="text-[10px] text-amber-300/90 font-mono bg-amber-950/30 p-2 rounded-sm border border-amber-500/30">
                  ℹ️ Enkaz alanına sevk edilen nakliye filoları boş hareket eder ve sistemdeki sahipsiz cevher/kristalleri toplayarak otomatik üsse getirir.
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#081521] p-2 rounded-sm border border-[#18374b]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-amber-400 text-[10px] font-bold">Cevher</span>
                    <span className="text-[9px] text-slate-400">{Math.floor(activePlanet?.resources.ore || 0)}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.ore || 0}
                    value={cargo.ore === 0 ? '' : cargo.ore}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const maxAvail = Math.floor(activePlanet?.resources.ore || 0);
                      setCargo((prev) => ({ ...prev, ore: Math.min(maxAvail, val) }));
                    }}
                    className="w-full bg-transparent text-slate-100 border-b border-[#1c3d52] focus:border-amber-400 focus:outline-none text-xs"
                  />
                </div>
                <div className="bg-[#081521] p-2 rounded-sm border border-[#18374b]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#3ca8d1] text-[10px] font-bold">Kristal</span>
                    <span className="text-[9px] text-slate-400">{Math.floor(activePlanet?.resources.crystal || 0)}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.crystal || 0}
                    value={cargo.crystal === 0 ? '' : cargo.crystal}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const maxAvail = Math.floor(activePlanet?.resources.crystal || 0);
                      setCargo((prev) => ({ ...prev, crystal: Math.min(maxAvail, val) }));
                    }}
                    className="w-full bg-transparent text-slate-100 border-b border-[#1c3d52] focus:border-[#3ca8d1] focus:outline-none text-xs"
                  />
                </div>
                <div className="bg-[#081521] p-2 rounded-sm border border-[#18374b]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-rose-400 text-[10px] font-bold">Yakıt</span>
                    <span className="text-[9px] text-slate-400">{Math.floor(activePlanet?.resources.fuel || 0)}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.fuel || 0}
                    value={cargo.fuel === 0 ? '' : cargo.fuel}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      const maxAvail = Math.floor(activePlanet?.resources.fuel || 0);
                      setCargo((prev) => ({ ...prev, fuel: Math.min(maxAvail, val) }));
                    }}
                    className="w-full bg-transparent text-slate-100 border-b border-[#1c3d52] focus:border-rose-400 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const oreAvail = Math.floor(activePlanet?.resources.ore || 0);
                    const cryAvail = Math.floor(activePlanet?.resources.crystal || 0);
                    const cap = totalCargoCap;
                    const half = Math.floor(cap / 2);
                    const ore = Math.min(oreAvail, half);
                    const cry = Math.min(cryAvail, cap - ore);
                    setCargo({ ore, crystal: cry, fuel: 0 });
                  }}
                  disabled={totalCargoCap === 0}
                  className="px-2 py-0.5 rounded-sm text-[10px] font-mono border border-[#234b66] bg-[#0c2233] text-cyan-300 hover:bg-[#123149] disabled:opacity-40 transition-colors"
                >
                  Oto Doldur (Cevher+Kristal)
                </button>
                <button
                  type="button"
                  onClick={() => setCargo({ ore: 0, crystal: 0, fuel: 0 })}
                  className="px-2 py-0.5 rounded-sm text-[10px] font-mono border border-[#18374b] bg-[#091522] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Sıfırla
                </button>
              </div>
            </div>
          )}

          {/* Pre-Flight Preview Card */}
          {routeInfo && (
            <div className="stellaris-item-card p-3 space-y-1.5 text-xs font-mono border border-[#1c3647]">
              <div className="stellaris-section-header px-1.5 py-0.5 text-[10px] uppercase tracking-wider mb-1">
                Uçuş Telemetrisi
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Uçuş Mesafesi:</span>
                <span className="text-slate-100 font-bold">{routeInfo.totalDistance} br</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Tahmini Uçuş Süresi:</span>
                <span className="text-[#3ca8d1] font-bold">
                  {formatDuration(routeInfo.durationMs)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Tahmini Varış:</span>
                <span className="text-slate-200">
                  {formatClockTime(currentTimeMs + routeInfo.durationMs)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Gerekli Yakıt:</span>
                <span
                  className={
                    (activePlanet?.resources.fuel || 0) >= routeInfo.fuelCost
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {routeInfo.fuelCost} / {Math.floor(activePlanet?.resources.fuel || 0)}
                </span>
              </div>

              {/* Interception Feasibility Warning / Notice */}
              {selectedMission === 'intercept' && interceptCheck && (
                <div
                  className={`mt-2 p-2 rounded-sm text-[11px] border ${
                    interceptCheck.canIntercept
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {interceptCheck.canIntercept ? (
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Önleme Mümkün: Hedef varışından{' '}
                        {formatDuration(Math.abs(interceptCheck.timeMarginMs || 0))} önce yetişilir.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <TriangleAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>{interceptCheck.reason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sector Crisis Route Warning */}
              {routeInfo.crisisMod && routeInfo.crisisMod.affectedSystemNames.length > 0 && (
                <div className="mt-2 p-2 rounded-sm text-[11px] border bg-amber-950/50 border-amber-500/60 text-amber-300 font-mono">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Güneş İyon Fırtınası Tehlikesi:</span>
                  </div>
                  <p className="mt-1 text-slate-300 text-[10px] leading-snug">
                    Rota üzerindeki <span className="text-amber-200 font-bold">{routeInfo.crisisMod.affectedSystemNames.join(', ')}</span> sektöründe güneş fırtınası aktif. Seyir hızı -%40, yakıt tüketimi +%25 uygulandı.
                  </p>
                </div>
              )}

              {/* Target Ancient Titan Boss Notice */}
              {targetTitanBoss && (
                <div className="mt-2 p-2 rounded-sm text-[11px] border bg-rose-950/70 border-rose-500/70 text-rose-300 font-mono animate-pulse">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Crown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kadim Muhafız Titanı Tespit Edildi!</span>
                  </div>
                  <p className="mt-1 text-slate-300 text-[10px] leading-snug">
                    Hedef sektörde uyanan kadim savaş titanı hüküm sürüyor (HP: {targetTitanBoss.effects.titanHp || 2200}, Güç: {targetTitanBoss.effects.titanAttack || 135}). Yalnızca donanımlı armadalar hayatta kalabilir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tactical Combat Outcome Predictor (GDD Section 7 & 15) */}
          {combatPrediction && (
            <div className="stellaris-item-card p-3 space-y-2 border border-purple-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 font-display">
                  <Swords className="w-3.5 h-3.5 text-purple-400" />
                  <span>Taktik Muharebe Simülasyonu</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold ${
                    combatPrediction.winRate >= 70
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50'
                      : combatPrediction.winRate >= 45
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-500/50'
                      : 'bg-rose-950/70 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  {combatPrediction.isIntelClear
                    ? `%${combatPrediction.winRate} Zafer İhtimali`
                    : `%${combatPrediction.minRate} - %${combatPrediction.maxRate} İhtimal`}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 font-mono">
                {combatPrediction.summary}
              </div>

              {combatPrediction.defenderShipsCount !== null && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-[#18374b]">
                  <span>Hedef Savunma Gücü:</span>
                  <span className="text-slate-200">{combatPrediction.defenderShipsCount} Gemi</span>
                </div>
              )}

              {combatPrediction.stance === 'evade_safeguard' && (
                <div className="text-[10px] text-amber-400/90 italic flex items-center gap-1">
                  <span>⚠️ Düşman duruşu: Filoyu Koru (Çatışmadan kaçınabilir)</span>
                </div>
              )}

              {!combatPrediction.isIntelClear && (
                <div className="text-[10px] text-slate-400 italic">
                  * Sensör istihbaratı kısmi olduğundan kesin filo bileşimi belirsizdir.
                </div>
              )}
            </div>
          )}

          {/* Admiral Leadership Assignment Card */}
          <div className="stellaris-item-card p-3 space-y-2 border border-[#1b3a4f]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-display">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Filo Komutanı (Amiral)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">
                {availableAdmirals.length} Müsait
              </span>
            </div>

            <select
              value={selectedAdmiralId}
              onChange={(e) => {
                sound.playClick();
                setSelectedAdmiralId(e.target.value);
              }}
              className="w-full bg-[#081521] border border-[#18374b] text-slate-100 text-xs rounded-sm p-2 font-mono focus:border-[#3ca8d1] focus:outline-none cursor-pointer"
            >
              <option value="">Komutansız Sefer (Standart Doktrin)</option>
              {playerAdmirals.map((adm) => {
                const trait = ADMIRAL_TRAITS[adm.traitId];
                const isBusy = !!adm.assignedFleetId;
                return (
                  <option key={adm.id} value={adm.id} disabled={isBusy}>
                    {adm.name} ({adm.title}) - Sv.{adm.level} [{trait?.nameTr || adm.traitId}]
                    {isBusy ? ' (Görevde)' : ''}
                  </option>
                );
              })}
            </select>

            {selectedAdmiral && (
              <div className="p-2 bg-[#06121c] border border-amber-500/30 rounded-sm flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedAdmiral.avatar}</span>
                  <div>
                    <span className="font-bold text-white block">
                      {selectedAdmiral.name}
                    </span>
                    <span className="text-[10px] text-amber-300">
                      {ADMIRAL_TRAITS[selectedAdmiral.traitId]?.combatBonusDescriptionTr || selectedAdmiral.traitId}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                  Sv. {selectedAdmiral.level}
                </span>
              </div>
            )}
          </div>

          {/* Tactical Fleet Combat Doctrine Selector */}
          <div className="bg-[#0b1624] p-3 rounded-sm border border-[#1a384f] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Swords className="w-3.5 h-3.5 text-cyan-400" />
                Filo Muharebe Doktrini
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Taktik Angajman</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'balanced', name: 'Dengeli', desc: 'Standart muharebe parametreleri' },
                { id: 'spearhead', name: 'Yıldırım', desc: '+%15 Ateş Gücü, +%10 Hız, +%10 Hasar Alma' },
                { id: 'fortress', name: 'Ağır Hisar', desc: '-%10 Ateş Gücü, -%10 Hız, -%20 Hasar Alma' },
                { id: 'hit_and_run', name: 'Vur-Kaç', desc: '%20 İhtimalle Yarım Hasar Sıyrılma' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setDoctrine(d.id as FleetDoctrine);
                  }}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    doctrine === d.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                      : 'bg-[#060c14] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-cyan-200 font-display flex items-center justify-between">
                    <span>{d.name}</span>
                    {doctrine === d.id && <span className="text-[9px] text-cyan-400">●</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch Button */}
          <button
            disabled={
              !targetSystem ||
              totalSelectedShips === 0 ||
              !routeInfo ||
              (activePlanet?.resources.fuel || 0) < (routeInfo?.fuelCost || 0) ||
              (selectedMission === 'intercept' && !interceptCheck?.canIntercept) ||
              !!targetProtectionStatus?.isBlocked ||
              isCargoOverCapacity
            }
            onClick={() => {
              if (targetSystem && activePlanet) {
                sound.playLaunch();
                onDispatchFleet(
                  targetSystem.id,
                  selectedTarget?.planetId,
                  selectedTarget?.fleetId,
                  ships,
                  cargo,
                  selectedMission,
                  selectedAdmiralId || undefined,
                  doctrine
                );
                setSelectedAdmiralId('');
              }
            }}
            className="w-full py-2.5 px-4 rounded-sm stellaris-btn-metallic text-cyan-200 font-bold font-mono tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#3ca8d1]" />
            <span>Filoyu Sevk Et (⚡ {selectedFleetPower})</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export const CommandPanel = React.memo(CommandPanelComponent);
