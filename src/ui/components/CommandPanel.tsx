import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Crosshair,
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
} from 'lucide-react';
import { calculateRouteInfo, checkInterceptionFeasibility } from '../../engine/flight';
import { calculatePlanetOrbit } from '../../engine/orbital';
import {
  Fleet,
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
    mission: MissionType
  ) => void;
  onRecallFleet: (fleetId: string) => void;
  currentTimeMs: number;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  state,
  activePlayerId,
  activePlanet,
  selectedTarget,
  onDispatchFleet,
  onRecallFleet,
  currentTimeMs,
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

  // Pre-flight calculation
  const routeInfo = useMemo(() => {
    if (!activePlanet || !targetSystem) return null;
    return calculateRouteInfo(
      activePlanet.systemId,
      targetSystem.id,
      ships,
      state.map.lanes,
      engineTech
    );
  }, [activePlanet, targetSystem, ships, state.map.lanes, engineTech]);

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

  // Auto configure for colonize mission
  const handleSelectMission = (mission: MissionType) => {
    setSelectedMission(mission);
    if (mission === 'colonize') {
      setShips((prev) => ({ ...prev, transport: Math.max(1, prev.transport) }));
      setCargo({ ...GAME_CONSTANTS.COLONY_COST });
    }
  };

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
    const myWepMult = 1 + myWepLevel * 0.10;

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
  }, [selectedMission, totalSelectedShips, ships, activePlayer, targetFleet, selectedTarget, state.planets, state.players]);

  return (
    <aside className="w-88 h-full border-l border-slate-800 bg-space-900/95 backdrop-blur-md flex flex-col z-20 select-none overflow-hidden">
      {/* Top Tabs: Dispatch vs Active Fleets */}
      <div className="flex border-b border-slate-800 bg-space-850/60 p-1">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'dispatch'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Filo Sevkiyatı</span>
        </button>
        <button
          onClick={() => setActiveTab('active_fleets')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'active_fleets'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Uçuşlar ({myActiveFleets.length})</span>
        </button>
      </div>

      {activeTab === 'active_fleets' ? (
        /* Active Fleets In Flight */
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Yoldaki Filolarınız
          </div>

          {myActiveFleets.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8">
              Aktif uçuşta filonuz bulunmuyor.
            </div>
          ) : (
            myActiveFleets.map((fleet) => {
              const remainingMs = Math.max(0, fleet.arrivalTime - currentTimeMs);
              const remainingRecallWindowMs = Math.max(0, fleet.recallLockedAfterTime - currentTimeMs);
              const canRecall = currentTimeMs < fleet.recallLockedAfterTime && !fleet.isReturning;
              const totalShips = Object.values(fleet.ships).reduce((a, b) => a + b, 0);
              const targetSys = state.map.systems[fleet.targetSystemId];

              return (
                <div
                  key={fleet.id}
                  className="bg-space-850/90 border border-slate-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-display">
                      {fleet.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyber-cyan bg-space-900 px-1.5 py-0.5 rounded border border-slate-800 uppercase">
                      {fleet.isReturning ? 'Dönüşte' : fleet.mission}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Hedef: {targetSys?.name || fleet.targetSystemId}</span>
                    <span className="text-cyber-cyan font-bold">
                      {formatDuration(remainingMs)}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Varış Saati: {formatClockTime(fleet.arrivalTime)}</span>
                    {canRecall ? (
                      <span className="text-amber-400 font-medium">
                        Dönüş İzni: {formatDuration(remainingRecallWindowMs)}
                      </span>
                    ) : (
                      <span className="text-rose-400">🔒 Kilitlendi</span>
                    )}
                  </div>

                  {/* Recall Button with Locked warning */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {totalShips} Gemi • Yakıt: {fleet.fuelCost}
                    </span>

                    {canRecall ? (
                      <button
                        onClick={() => onRecallFleet(fleet.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Geri Çağır</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-500 italic">
                        {fleet.isReturning ? 'Dönüş rotasında' : '🔒 Son yaklaşma kilitlendi'}
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
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Target System Header */}
          {targetSystem ? (
            <div className="bg-space-850/90 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Hedef Konum
              </div>
              <div className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                {targetSystem.name}
                {targetSystem.hasRelay && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                    NEXUS RÖLESİ
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                <span>{targetSystem.slots.length} Gezegen Yuvası</span>
                {targetSystem.poi && !targetSystem.poi.explored && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> POI Mevcut
                  </span>
                )}
                {targetSystem.hasDebris && (targetSystem.hasDebris.ore > 0 || targetSystem.hasDebris.crystal > 0) && (
                  <span className="text-rose-400">Enkaz Alanı</span>
                )}
              </div>

              {/* Target Planet & Orbital Rendezvous Telemetry */}
              {targetSlot && targetPlanetOrbit && (
                <div className="mt-2.5 p-2.5 bg-space-950/80 border border-cyber-cyan/30 rounded-lg space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: targetPlanetOwner?.color || '#38bdf8' }}
                      />
                      {targetSlot.name}
                    </span>
                    <span className="text-[9.5px] text-cyber-cyan uppercase px-1 rounded bg-cyber-cyan/10">
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
                      <span className="text-cyber-cyan">{targetPlanetOrbit.speedDegPerHour}° / saat</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Mesafe</span>
                      <span className="text-slate-200">{targetPlanetOrbit.auDistance} AU</span>
                    </div>
                  </div>

                  {projectedArrivalAngleDeg !== null && routeInfo && (
                    <div className="pt-1.5 border-t border-slate-800 text-[10px] bg-cyber-cyan/5 -mx-1 px-1 py-1 rounded">
                      <div className="flex items-center justify-between text-cyber-cyan">
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
                <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 font-mono font-bold block">
                      ⚙️ Enkaz: {targetSystem.hasDebris.ore}C, {targetSystem.hasDebris.crystal}K
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Gereken: {Math.ceil((targetSystem.hasDebris.ore + targetSystem.hasDebris.crystal) / SHIP_STATS.transport.cargoCapacity)} Nakliye
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!targetSystem?.hasDebris) return;
                      const debrisTotal = (targetSystem.hasDebris.ore || 0) + (targetSystem.hasDebris.crystal || 0);
                      const needed = Math.max(1, Math.ceil(debrisTotal / SHIP_STATS.transport.cargoCapacity));
                      handleSelectMission('transport');
                      setShips({
                        scout: 0,
                        transport: Math.min(garrison.transport, needed),
                        fighter: garrison.fighter > 0 ? 1 : 0,
                        battleship: 0,
                      });
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[10px] font-mono font-bold transition-colors"
                  >
                    Enkazı Topla
                  </button>
                </div>
              )}

              {/* Target Protection / Vacation Mode Alert Banner */}
              {targetProtectionStatus?.isBlocked && (
                <div className="mt-2.5 p-2 bg-rose-500/15 border border-rose-500/40 rounded flex items-center gap-2 text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{targetProtectionStatus.reason}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-space-850/40 border border-dashed border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400">
              Haritadan bir yıldız sistemi, filo veya röle seçin.
            </div>
          )}

          {/* Mission Selector Tabs */}
          {targetSystem && (
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Görev Türü
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'explore', label: 'Keşfet', icon: Compass },
                  { id: 'transport', label: 'Taşı/Topla', icon: Truck },
                  { id: 'attack', label: 'Saldır', icon: Swords },
                  { id: 'intercept', label: 'Önle', icon: Crosshair },
                  { id: 'support', label: 'Destek', icon: Shield },
                  { id: 'colonize', label: 'Koloni', icon: Sparkles },
                ].map(({ id, label, icon: Icon }) => {
                  const isEligible = eligibleMissions.includes(id as MissionType);
                  return (
                    <button
                      key={id}
                      disabled={!isEligible}
                      onClick={() => handleSelectMission(id as MissionType)}
                      className={`p-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                        selectedMission === id
                          ? 'bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan font-bold'
                          : isEligible
                          ? 'bg-space-850 border border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-space-900 border border-slate-800/40 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ship Selection Sliders */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              <span>Sevk Edilecek Gemiler</span>
              <span className="text-cyber-cyan">Toplam: {totalSelectedShips}</span>
            </div>

            <div className="space-y-2">
              {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                const available = garrison[st] || 0;
                const selected = ships[st];
                const stats = SHIP_STATS[st];

                return (
                  <div
                    key={st}
                    className="bg-space-850/80 border border-slate-800 rounded p-2 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{stats.nameTr}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        Garnizon: {available}
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
                        className="flex-1 accent-cyber-cyan h-1.5 bg-space-900 rounded"
                      />
                      <span className="font-mono text-xs w-6 text-right font-bold text-cyber-cyan">
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
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Taşınacak Kaynak (Yük)</span>
                <span className="text-slate-400">
                  Kapasite: {totalCargoCap.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-space-850 p-1.5 rounded border border-slate-800">
                  <span className="text-amber-400 text-[10px] block">Cevher</span>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.ore || 0}
                    value={cargo.ore}
                    onChange={(e) =>
                      setCargo((prev) => ({ ...prev, ore: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-transparent text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="bg-space-850 p-1.5 rounded border border-slate-800">
                  <span className="text-cyber-cyan text-[10px] block">Kristal</span>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.crystal || 0}
                    value={cargo.crystal}
                    onChange={(e) =>
                      setCargo((prev) => ({ ...prev, crystal: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-transparent text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="bg-space-850 p-1.5 rounded border border-slate-800">
                  <span className="text-rose-400 text-[10px] block">Yakıt</span>
                  <input
                    type="number"
                    min="0"
                    max={activePlanet?.resources.fuel || 0}
                    value={cargo.fuel}
                    onChange={(e) =>
                      setCargo((prev) => ({ ...prev, fuel: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-transparent text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pre-Flight Preview Card */}
          {routeInfo && (
            <div className="bg-space-850/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Uçuş Mesafesi:</span>
                <span className="text-slate-100">{routeInfo.totalDistance} br</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Tahmini Uçuş Süresi:</span>
                <span className="text-cyber-cyan font-bold">
                  {formatDuration(routeInfo.durationMs)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Tahmini Varış Saati:</span>
                <span className="text-slate-200">
                  {formatClockTime(currentTimeMs + routeInfo.durationMs)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Yakıt Bedeli:</span>
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
                  className={`mt-2 p-2 rounded text-[11px] border ${
                    interceptCheck.canIntercept
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
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
            </div>
          )}

          {/* Tactical Combat Outcome Predictor (GDD Section 7 & 15) */}
          {combatPrediction && (
            <div className="bg-space-850/90 border border-purple-500/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 font-display">
                  <Swords className="w-3.5 h-3.5 text-purple-400" />
                  <span>Taktik Muharebe Simülasyonu</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    combatPrediction.winRate >= 70
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : combatPrediction.winRate >= 45
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
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
                <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-800">
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

          {/* Dispatch Button */}
          <button
            disabled={
              !targetSystem ||
              totalSelectedShips === 0 ||
              !routeInfo ||
              (activePlanet?.resources.fuel || 0) < (routeInfo?.fuelCost || 0) ||
              (selectedMission === 'intercept' && !interceptCheck?.canIntercept) ||
              !!targetProtectionStatus?.isBlocked
            }
            onClick={() => {
              if (targetSystem && activePlanet) {
                onDispatchFleet(
                  targetSystem.id,
                  selectedTarget?.planetId,
                  selectedTarget?.fleetId,
                  ships,
                  cargo,
                  selectedMission
                );
              }
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-cyber-cyan text-space-950 font-bold font-display text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-md shadow-cyber-cyan/10"
          >
            <Send className="w-4 h-4" />
            <span>Filoyu Sevk Et</span>
          </button>
        </div>
      )}
    </aside>
  );
};
