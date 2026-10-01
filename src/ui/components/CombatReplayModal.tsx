import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Navigation,
  Pause,
  Pickaxe,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TrendingUp,
  X,
  Zap,
  Box,
  Layers,
} from 'lucide-react';
import {
  BattleReport,
  DefenseStructureType,
  FleetDoctrine,
  PlanetSpecialization,
  PlanetStance,
  ShipType,
} from '../../engine/types';
import { DEFENSE_STATS, SHIP_STATS } from '../../engine/constants';
import { getDefenseCombatRating, getFleetCombatRating, resolveCombat } from '../../engine/combat';
import { EMPIRE_ARTIFACTS } from '../../engine/artifacts';
import { TacticalCombat3DArena } from './TacticalCombat3DArena';
import {
  loadSavedLoadouts,
  getModifiedShipStats,
  WEAPON_MODULES,
  DEFENSE_MODULES,
} from '../../engine/shipDesign';
import { sound } from '../sound';

interface CombatReplayModalProps {
  reports: BattleReport[];
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onSelectSystem?: (systemId: string) => void;
}

interface SimulationSummary {
  simulationsRun: number;
  attackerWins: number;
  defenderWins: number;
  draws: number;
  attackerWinRate: number;
  defenderWinRate: number;
  drawRate: number;
  avgAttackerLosses: Record<ShipType, number>;
  avgDefenderLosses: Record<ShipType, number>;
  avgAttackerCostLoss: { ore: number; crystal: number };
  avgDefenderCostLoss: { ore: number; crystal: number };
  sampleReport: BattleReport;
}

const SHIP_ICONS: Record<ShipType, string> = {
  scout: '🛰️',
  transport: '🚛',
  fighter: '🚀',
  battleship: '🛸',
};

const DEFENSE_ICONS: Record<DefenseStructureType, string> = {
  missile_battery: '🚀',
  plasma_turret: '⚡',
  ion_cannon: '🌀',
};

const DOCTRINE_META: Record<FleetDoctrine, { nameTr: string; icon: string; color: string; descTr: string }> = {
  spearhead: {
    nameTr: 'Mızrak Ucu',
    icon: '🎯',
    color: '#f43f5e',
    descTr: '+%15 Taarruz Ateşi • +%10 Alınan Hasar',
  },
  fortress: {
    nameTr: 'Hisar Savunması',
    icon: '🏰',
    color: '#06b6d4',
    descTr: '-%10 Ateş Gücü • %20 Hasar Emilimi',
  },
  hit_and_run: {
    nameTr: 'Vur-Kaç',
    icon: '⚡',
    color: '#a855f7',
    descTr: '%20 Şansla Hasardan %50 Kaçınma',
  },
  balanced: {
    nameTr: 'Dengeli Hat',
    icon: '⚖️',
    color: '#38bdf8',
    descTr: 'Standart Taktik Formasyon',
  },
};

const CombatReplayModalComponent: React.FC<CombatReplayModalProps> = ({
  reports,
  isOpen,
  isDocked = false,
  onClose,
  onSelectSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'simulator'>('reports');
  const [simulatedReport, setSimulatedReport] = useState<BattleReport | null>(null);

  // Replay State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [combatViewMode, setCombatViewMode] = useState<'3d' | 'schematic'>('3d');

  // Simulator State
  const [attShips, setAttShips] = useState<Record<ShipType, number>>({
    scout: 5,
    transport: 0,
    fighter: 12,
    battleship: 2,
  });
  const [attWeapons, setAttWeapons] = useState<number>(2);
  const [attDoctrine, setAttDoctrine] = useState<FleetDoctrine>('spearhead');
  const [attHasRelic, setAttHasRelic] = useState<boolean>(false);

  const [defShips, setDefShips] = useState<Record<ShipType, number>>({
    scout: 8,
    transport: 2,
    fighter: 8,
    battleship: 1,
  });
  const [defWeapons, setDefWeapons] = useState<number>(1);
  const [defStance, setDefStance] = useState<PlanetStance>('hold_position');
  const [defDoctrine, setDefDoctrine] = useState<FleetDoctrine>('fortress');
  const [defSpecialization, setDefSpecialization] = useState<PlanetSpecialization>('balanced');
  const [defHasRelic, setDefHasRelic] = useState<boolean>(false);
  const [defDefenses, setDefDefenses] = useState<Record<DefenseStructureType, number>>({
    missile_battery: 0,
    plasma_turret: 0,
    ion_cannon: 0,
  });

  const [simResult, setSimResult] = useState<SimulationSummary | null>(null);
  const [loadouts] = useState(() => loadSavedLoadouts());

  // Combined reports (simulated report pinned at top if exists)
  const combinedReports = useMemo(() => {
    if (simulatedReport) {
      return [simulatedReport, ...reports];
    }
    return reports;
  }, [simulatedReport, reports]);

  const currentReport =
    combinedReports.find((r) => r.id === selectedReportId) || combinedReports[0];
  const totalRounds = currentReport ? currentReport.rounds.length : 0;
  const currentRound = currentReport?.rounds[currentRoundIdx];

  // Auto-play combat rounds with audio effects
  useEffect(() => {
    if (!isPlaying || !currentReport || totalRounds === 0) return;

    const timer = setInterval(() => {
      setCurrentRoundIdx((prev) => {
        if (prev >= totalRounds - 1) {
          setIsPlaying(false);
          return prev;
        }
        sound.playLaser();
        return prev + 1;
      });
    }, 1100);

    return () => clearInterval(timer);
  }, [isPlaying, currentReport, totalRounds]);

  // Run 100x Monte Carlo Simulation
  const handleRunSimulation = useCallback(() => {
    sound.playLaunch();
    const runs = 100;
    let attackerWins = 0;
    let defenderWins = 0;
    let draws = 0;

    const totalAttLosses: Record<ShipType, number> = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
    const totalDefLosses: Record<ShipType, number> = { scout: 0, transport: 0, fighter: 0, battleship: 0 };
    let sampleReport: BattleReport | null = null;
    const hasDefDefenses = (defDefenses.missile_battery || 0) + (defDefenses.plasma_turret || 0) + (defDefenses.ion_cannon || 0) > 0;

    for (let i = 0; i < runs; i++) {
      const res = resolveCombat(
        {
          ownerId: 'sim_att',
          ownerName: 'Simüle Saldırgan Görev Gücü',
          ships: { ...attShips },
          weaponsResearchLevel: attWeapons,
          doctrine: attDoctrine,
          artifacts: attHasRelic ? ['dreadnought_plating'] : undefined,
        },
        {
          ownerId: 'sim_def',
          ownerName: 'Simüle Savunma Garnizonu',
          ships: { ...defShips },
          weaponsResearchLevel: defWeapons,
          stance: defStance,
          defenses: hasDefDefenses ? { ...defDefenses } : undefined,
          doctrine: defDoctrine,
          planetSpecialization: defSpecialization,
          artifacts: defHasRelic ? ['dreadnought_plating'] : undefined,
        },
        'sim_sector',
        'Taktik Simülasyon Sektörü',
        hasDefDefenses ? 'planet_raid' : 'fleet_interception',
        hasDefDefenses ? { ore: 5000, crystal: 3000, fuel: 2000 } : undefined,
        1200,
        Date.now(),
        42 + i * 37
      );

      if (res.report.winner === 'attacker') attackerWins++;
      else if (res.report.winner === 'defender') defenderWins++;
      else draws++;

      (['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).forEach((st) => {
        const lostAtt = attShips[st] - (res.remainingAttacker[st] || 0);
        const lostDef = defShips[st] - (res.remainingDefender[st] || 0);
        totalAttLosses[st] += Math.max(0, lostAtt);
        totalDefLosses[st] += Math.max(0, lostDef);
      });

      if (i === 0) {
        sampleReport = res.report;
      }
    }

    const avgAttLosses: Record<ShipType, number> = {
      scout: +(totalAttLosses.scout / runs).toFixed(1),
      transport: +(totalAttLosses.transport / runs).toFixed(1),
      fighter: +(totalAttLosses.fighter / runs).toFixed(1),
      battleship: +(totalAttLosses.battleship / runs).toFixed(1),
    };

    const avgDefLosses: Record<ShipType, number> = {
      scout: +(totalDefLosses.scout / runs).toFixed(1),
      transport: +(totalDefLosses.transport / runs).toFixed(1),
      fighter: +(totalDefLosses.fighter / runs).toFixed(1),
      battleship: +(totalDefLosses.battleship / runs).toFixed(1),
    };

    let attOreLost = 0;
    let attCrysLost = 0;
    let defOreLost = 0;
    let defCrysLost = 0;

    (['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).forEach((st) => {
      const attStats = getModifiedShipStats(st, loadouts[st]);
      const defStats = SHIP_STATS[st];
      attOreLost += avgAttLosses[st] * attStats.cost.ore;
      attCrysLost += avgAttLosses[st] * attStats.cost.crystal;
      defOreLost += avgDefLosses[st] * defStats.cost.ore;
      defCrysLost += avgDefLosses[st] * defStats.cost.crystal;
    });

    const summary: SimulationSummary = {
      simulationsRun: runs,
      attackerWins,
      defenderWins,
      draws,
      attackerWinRate: Math.round((attackerWins / runs) * 100),
      defenderWinRate: Math.round((defenderWins / runs) * 100),
      drawRate: Math.round((draws / runs) * 100),
      avgAttackerLosses: avgAttLosses,
      avgDefenderLosses: avgDefLosses,
      avgAttackerCostLoss: { ore: Math.round(attOreLost), crystal: Math.round(attCrysLost) },
      avgDefenderCostLoss: { ore: Math.round(defOreLost), crystal: Math.round(defCrysLost) },
      sampleReport: sampleReport!,
    };

    setSimResult(summary);
    setSimulatedReport(sampleReport);
  }, [
    attShips,
    attWeapons,
    attDoctrine,
    attHasRelic,
    defShips,
    defWeapons,
    defStance,
    defDoctrine,
    defSpecialization,
    defHasRelic,
    defDefenses,
    loadouts,
  ]);

  // Load sample report into viewer
  const handleWatchSimulatedBattle = () => {
    if (!simResult) return;
    sound.playClick();
    setSelectedReportId(simResult.sampleReport.id);
    setCurrentRoundIdx(0);
    setActiveTab('reports');
  };

  // Presets
  const applyPreset = (preset: 'scout_skirmish' | 'raider_interception' | 'heavy_siege') => {
    sound.playClick();
    if (preset === 'scout_skirmish') {
      setAttShips({ scout: 8, transport: 0, fighter: 0, battleship: 0 });
      setAttWeapons(0);
      setAttDoctrine('hit_and_run');
      setAttHasRelic(false);
      setDefShips({ scout: 6, transport: 1, fighter: 0, battleship: 0 });
      setDefWeapons(0);
      setDefStance('hold_position');
      setDefDoctrine('balanced');
      setDefSpecialization('balanced');
      setDefHasRelic(false);
      setDefDefenses({ missile_battery: 0, plasma_turret: 0, ion_cannon: 0 });
    } else if (preset === 'raider_interception') {
      setAttShips({ scout: 2, transport: 0, fighter: 16, battleship: 1 });
      setAttWeapons(2);
      setAttDoctrine('spearhead');
      setAttHasRelic(false);
      setDefShips({ scout: 5, transport: 3, fighter: 4, battleship: 1 });
      setDefWeapons(1);
      setDefStance('evade_safeguard');
      setDefDoctrine('balanced');
      setDefSpecialization('balanced');
      setDefHasRelic(false);
      setDefDefenses({ missile_battery: 2, plasma_turret: 0, ion_cannon: 0 });
    } else if (preset === 'heavy_siege') {
      setAttShips({ scout: 5, transport: 0, fighter: 25, battleship: 6 });
      setAttWeapons(4);
      setAttDoctrine('spearhead');
      setAttHasRelic(true);
      setDefShips({ scout: 15, transport: 10, fighter: 15, battleship: 3 });
      setDefWeapons(3);
      setDefStance('hold_position');
      setDefDoctrine('fortress');
      setDefSpecialization('military_bastion');
      setDefHasRelic(false);
      setDefDefenses({ missile_battery: 4, plasma_turret: 2, ion_cannon: 1 });
    }
  };

  if (!isOpen) return null;

  const contextTitles: Record<'planet_raid' | 'fleet_interception' | 'relay_contest' | 'pirate_lair' | 'void_anchor' | 'void_rift', string> = {
    planet_raid: 'GEZEGEN BASKINI',
    fleet_interception: 'FİLO ÖNLEME ÇATIŞMASI',
    relay_contest: 'NEXUS RÖLESİ HAKİMİYET SAVAŞI',
    pirate_lair: 'KORSAN SIĞINAĞI TAARRUZU',
    void_anchor: 'HİÇLİK ÇIPASI TAARRUZU',
    void_rift: 'HİÇLİK YARIĞI & BEHEMOT MUHAREBESİ',
  };

  // Fleet power ratings for simulation preview
  const attRatings = getFleetCombatRating(attShips, attWeapons);
  const defRatings = getFleetCombatRating(defShips, defWeapons);
  const defDefenseRatings = getDefenseCombatRating(defDefenses, defWeapons);

  const content = (
    <div
      className={
        isDocked
          ? 'w-[880px] min-w-[880px] max-w-[880px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#1c3647] rounded-sm w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <Swords className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Taktik Muharebe & Savaş Simülatörü
            </h2>
            <span className="text-[10px] text-rose-400 font-mono">
              Uzay Harp Doktrini • Karşılaşma Analizleri & Tur Tekrarı
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#06121c] p-1 rounded-sm border border-[#1c3647]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('reports');
            }}
            className={`px-3 py-1 rounded-sm text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Muharebe Kayıtları ({combinedReports.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('simulator');
            }}
            className={`px-3 py-1 rounded-sm text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Taktik Savaş Simülatörü</span>
          </button>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MUHAREBE KAYITLARI & TUR TEKRARI                                    */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="flex-1 flex overflow-hidden">
          {combinedReports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs space-y-3">
              <Swords className="w-10 h-10 opacity-30 text-rose-400" />
              <span>Henüz gerçekleşen bir savaş veya önleme bulunmuyor.</span>
              <button
                onClick={() => setActiveTab('simulator')}
                className="stellaris-btn-metallic text-cyan-300 px-3 py-1.5 rounded-sm text-xs"
              >
                Taktik Simülatörde Filo Testi Yap ➔
              </button>
            </div>
          ) : (
            <>
              {/* Left Column: Battle Reports List */}
              <div className="w-72 border-r border-[#18374b] overflow-y-auto p-2.5 pb-6 space-y-1.5 bg-[#06121c] scrollbar-none">
                {combinedReports.map((report) => {
                  const isSelected = currentReport && currentReport.id === report.id;
                  const isSim = report.id.startsWith('battle_sim_') || report.attackerId === 'sim_att';

                  return (
                    <button
                      key={report.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedReportId(report.id);
                        setCurrentRoundIdx(0);
                      }}
                      className={`w-full text-left p-2.5 rounded-sm border transition-all cursor-pointer ${
                        isSelected
                          ? isSim
                            ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-sm'
                            : 'bg-rose-950/60 border-rose-500/60 text-white shadow-sm'
                          : 'stellaris-item-card border-[#1c3647] hover:border-[#3885a8] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className={isSim ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold'}>
                          {isSim ? '🧪 SİMÜLASYON TESTİ' : contextTitles[report.context]}
                        </span>
                        <span className="text-slate-400">{report.systemName}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {report.attackerName} vs {report.defenderName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                        <span>
                          Kazanan: <strong className="text-emerald-400 uppercase">{report.winner}</strong>
                        </span>
                        <span className="text-slate-500">{report.rounds.length} Tur</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Visual Replay Viewer */}
              {currentReport && (
                <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-6 space-y-4">
                  {/* Battle Metadata Banner */}
                  <div className="stellaris-item-card border-[#1c3647] p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                          <span>{contextTitles[currentReport.context] || 'ÖZEL MUHAREBE'}</span>
                          <span>•</span>
                          {onSelectSystem ? (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onSelectSystem(currentReport.systemId);
                              }}
                              className="px-2 py-0.5 rounded-sm bg-[#081b28] border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 flex items-center gap-1 transition-all cursor-pointer"
                              title="Muharebe Sistemine Odaklan"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>{currentReport.systemName}</span>
                            </button>
                          ) : (
                            <span>{currentReport.systemName}</span>
                          )}
                        </div>
                        <div className="text-base font-bold text-white font-display mt-0.5">
                          {currentReport.attackerName} &nbsp;⚔️&nbsp; {currentReport.defenderName}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-sm bg-[#06121c] border border-[#1c3647] text-emerald-400 font-bold">
                          🏆 KAZANAN: {currentReport.winner.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(currentReport.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentReport.rounds.length} Tur
                        </span>
                      </div>
                    </div>

                    {/* Tactical Meta Badges (Doctrines, Admirals, Relics) */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#18374b]/60 text-[11px] font-mono">
                      {/* Attacker metadata */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-rose-400 font-bold text-[10px] uppercase">Saldırgan:</span>
                        {currentReport.attackerDoctrine && DOCTRINE_META[currentReport.attackerDoctrine] && (
                          <span
                            className="px-1.5 py-0.5 rounded-sm border text-[10px] font-bold flex items-center gap-1"
                            style={{
                              borderColor: `${DOCTRINE_META[currentReport.attackerDoctrine].color}66`,
                              backgroundColor: `${DOCTRINE_META[currentReport.attackerDoctrine].color}1a`,
                              color: DOCTRINE_META[currentReport.attackerDoctrine].color,
                            }}
                            title={DOCTRINE_META[currentReport.attackerDoctrine].descTr}
                          >
                            <span>{DOCTRINE_META[currentReport.attackerDoctrine].icon}</span>
                            <span>{DOCTRINE_META[currentReport.attackerDoctrine].nameTr}</span>
                          </span>
                        )}
                        {currentReport.attackerAdmiralName && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-purple-950/40 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <span>🎖️</span>
                            <span>Amiral: {currentReport.attackerAdmiralName}</span>
                          </span>
                        )}
                        {currentReport.attackerArtifacts?.map((artId) => (
                          <span
                            key={artId}
                            className="px-1.5 py-0.5 rounded-sm bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                            title={EMPIRE_ARTIFACTS[artId]?.effectTr}
                          >
                            <span>{EMPIRE_ARTIFACTS[artId]?.icon || '🏛️'}</span>
                            <span>{EMPIRE_ARTIFACTS[artId]?.nameTr || artId}</span>
                          </span>
                        ))}
                      </div>

                      {/* Defender metadata */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-cyan-400 font-bold text-[10px] uppercase">Savunucu:</span>
                        {currentReport.defenderDoctrine && DOCTRINE_META[currentReport.defenderDoctrine] && (
                          <span
                            className="px-1.5 py-0.5 rounded-sm border text-[10px] font-bold flex items-center gap-1"
                            style={{
                              borderColor: `${DOCTRINE_META[currentReport.defenderDoctrine].color}66`,
                              backgroundColor: `${DOCTRINE_META[currentReport.defenderDoctrine].color}1a`,
                              color: DOCTRINE_META[currentReport.defenderDoctrine].color,
                            }}
                            title={DOCTRINE_META[currentReport.defenderDoctrine].descTr}
                          >
                            <span>{DOCTRINE_META[currentReport.defenderDoctrine].icon}</span>
                            <span>{DOCTRINE_META[currentReport.defenderDoctrine].nameTr}</span>
                          </span>
                        )}
                        {currentReport.defenderAdmiralName && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-purple-950/40 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <span>🎖️</span>
                            <span>Amiral: {currentReport.defenderAdmiralName}</span>
                          </span>
                        )}
                        {currentReport.defenderArtifacts?.map((artId) => (
                          <span
                            key={artId}
                            className="px-1.5 py-0.5 rounded-sm bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                            title={EMPIRE_ARTIFACTS[artId]?.effectTr}
                          >
                            <span>{EMPIRE_ARTIFACTS[artId]?.icon || '🏛️'}</span>
                            <span>{EMPIRE_ARTIFACTS[artId]?.nameTr || artId}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Tactical Rosters & Live Health Bars */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Attacker Roster */}
                    <div className="stellaris-item-card border border-rose-500/30 rounded-sm p-3">
                      <div className="text-xs font-bold text-rose-400 font-display mb-2 flex items-center justify-between">
                        <span>SALDIRGAN: {currentReport.attackerName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Mevcut Tur / Başlangıç
                        </span>
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                          const init = currentReport.initialAttacker[st] || 0;
                          const currentRemaining = currentRound
                            ? currentRound.attackerRemaining[st] || 0
                            : currentReport.survivingAttacker[st] || 0;
                          if (init === 0) return null;
                          const percent = Math.min(100, Math.round((currentRemaining / init) * 100));

                          return (
                            <div key={st} className="space-y-0.5">
                              <div className="flex justify-between text-slate-200 text-xs font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span>{SHIP_ICONS[st]}</span>
                                  <span>{SHIP_STATS[st].nameTr}</span>
                                </span>
                                <span>
                                  <strong className={currentRemaining > 0 ? 'text-emerald-300' : 'text-rose-400'}>
                                    {currentRemaining}
                                  </strong>
                                  <span className="text-slate-500"> / {init}</span>
                                </span>
                              </div>
                              <div className="w-full h-1 bg-[#050b12] rounded-none overflow-hidden border border-[#1b3447]">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Defender Roster */}
                    <div className="stellaris-item-card border border-cyan-500/30 rounded-sm p-3">
                      <div className="text-xs font-bold text-cyan-400 font-display mb-2 flex items-center justify-between">
                        <span>SAVUNUCU: {currentReport.defenderName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Mevcut Tur / Başlangıç
                        </span>
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                          const init = currentReport.initialDefender[st] || 0;
                          const currentRemaining = currentRound
                            ? currentRound.defenderRemaining[st] || 0
                            : currentReport.survivingDefender[st] || 0;
                          if (init === 0) return null;
                          const percent = Math.min(100, Math.round((currentRemaining / init) * 100));

                          return (
                            <div key={st} className="space-y-0.5">
                              <div className="flex justify-between text-slate-200 text-xs font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span>{SHIP_ICONS[st]}</span>
                                  <span>{SHIP_STATS[st].nameTr}</span>
                                </span>
                                <span>
                                  <strong className={currentRemaining > 0 ? 'text-cyan-300' : 'text-rose-400'}>
                                    {currentRemaining}
                                  </strong>
                                  <span className="text-slate-500"> / {init}</span>
                                </span>
                              </div>
                              <div className="w-full h-1 bg-[#050b12] rounded-none overflow-hidden border border-[#1b3447]">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Planetary Defenses if present in planet raid */}
                        {currentReport.initialDefenses && (
                          <div className="pt-2 border-t border-[#18374b] mt-2 space-y-2">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                              Gezegen Savunma Bataryaları
                            </span>
                            {(['missile_battery', 'plasma_turret', 'ion_cannon'] as DefenseStructureType[]).map((dt) => {
                              const initDef = currentReport.initialDefenses?.[dt] || 0;
                              if (initDef === 0) return null;
                              const currentRemainingDef = currentRound
                                ? currentRound.defenderDefenseRemaining?.[dt] ?? 0
                                : currentReport.survivingDefenses?.[dt] ?? 0;
                              const defPercent = Math.min(100, Math.round((currentRemainingDef / initDef) * 100));

                              return (
                                <div key={dt} className="space-y-0.5">
                                  <div className="flex justify-between text-slate-200 text-xs font-medium">
                                    <span className="flex items-center gap-1.5">
                                      <span>{DEFENSE_ICONS[dt]}</span>
                                      <span>{DEFENSE_STATS[dt].nameTr}</span>
                                    </span>
                                    <span>
                                      <strong className={currentRemainingDef > 0 ? 'text-amber-300' : 'text-rose-400'}>
                                        {currentRemainingDef}
                                      </strong>
                                      <span className="text-slate-500"> / {initDef}</span>
                                    </span>
                                  </div>
                                  <div className="w-full h-1 bg-[#050b12] rounded-none overflow-hidden border border-[#1b3447]">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                                      style={{ width: `${defPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Orbital Starbase / Citadel if present */}
                        {currentReport.initialStarbase && (() => {
                          const sb = currentReport.initialStarbase;
                          const survSb = currentReport.survivingStarbase;
                          const currentHull = survSb ? survSb.hull : sb.hull;
                          const currentShield = survSb ? survSb.shield : sb.shield;
                          const totalMax = sb.hull + sb.shield;
                          const totalCurrent = Math.max(0, currentHull + currentShield);
                          const sbPercent = Math.min(100, Math.round((totalCurrent / totalMax) * 100));

                          const tierTitles: Record<string, string> = {
                            outpost: 'Yörünge Karakolu',
                            starbase: 'Yıldız Üssü',
                            citadel: 'Galaktik Hisar',
                          };

                          return (
                            <div className="pt-2 border-t border-[#18374b] mt-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                                  <span>🛰️</span>
                                  <span>{tierTitles[sb.tier] || 'Yıldız Üssü'}</span>
                                </span>
                                <span className="text-[10px] font-mono text-amber-300 font-bold">
                                  {sb.attack} Ateş Gücü
                                </span>
                              </div>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-300">
                                  Gövde & Kalkan: <strong className={totalCurrent > 0 ? 'text-emerald-300' : 'text-rose-400'}>{Math.round(totalCurrent)}</strong> / {totalMax}
                                </span>
                                <span className={survSb?.destroyed ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                  {survSb?.destroyed ? 'İMHA EDİLDİ' : 'AKTİF'}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-[#050b12] rounded-none overflow-hidden border border-[#1b3447]">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 transition-all duration-300"
                                  style={{ width: `${sbPercent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Round Player Controls & Dynamic Combat Corridor */}
                  {totalRounds > 0 && (
                    <div className="stellaris-item-card border border-[#1c3647] rounded-sm p-3 space-y-3">
                      {/* View Switcher: 3D Arena vs Schematic Corridor */}
                      <div className="flex items-center justify-between border-b border-[#18374b] pb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setCombatViewMode('3d');
                            }}
                            className={`px-2 py-0.5 rounded-sm text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                              combatViewMode === '3d'
                                ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                                : 'stellaris-btn-metallic text-slate-400 hover:text-white'
                            }`}
                          >
                            <Box className="w-3.5 h-3.5 text-cyan-400" />
                            <span>3D Taktik Arena</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setCombatViewMode('schematic');
                            }}
                            className={`px-2 py-0.5 rounded-sm text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                              combatViewMode === 'schematic'
                                ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                                : 'stellaris-btn-metallic text-slate-400 hover:text-white'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            <span>Şematik Koridor</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-display text-slate-200">
                            TUR {currentRoundIdx + 1} / {totalRounds}
                          </span>
                        </div>
                      </div>

                      {/* 3D Tactical Arena View */}
                      {combatViewMode === '3d' ? (
                        <TacticalCombat3DArena
                          report={currentReport}
                          currentRoundIdx={currentRoundIdx}
                          isPlaying={isPlaying}
                          onTogglePlay={() => {
                            if (isPlaying) {
                              setIsPlaying(false);
                            } else {
                              if (currentRoundIdx >= totalRounds - 1) {
                                setCurrentRoundIdx(0);
                              }
                              sound.playLaser();
                              setIsPlaying(true);
                            }
                          }}
                          onSelectRound={(idx) => {
                            setIsPlaying(false);
                            setCurrentRoundIdx(idx);
                            sound.playLaser();
                          }}
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (isPlaying) {
                                  setIsPlaying(false);
                                } else {
                                  if (currentRoundIdx >= totalRounds - 1) {
                                    setCurrentRoundIdx(0);
                                  }
                                  sound.playLaser();
                                  setIsPlaying(true);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all stellaris-btn-metallic cursor-pointer ${
                                isPlaying
                                  ? '!border-amber-500/60 text-amber-300 animate-pulse'
                                  : '!border-rose-500/60 text-rose-300'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              {isPlaying ? 'DURAKLAT' : 'OTOMATİK OYNAT'}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={currentRoundIdx === 0}
                                onClick={() => {
                                  setIsPlaying(false);
                                  setCurrentRoundIdx((prev) => Math.max(0, prev - 1));
                                  sound.playLaser();
                                }}
                                className="p-1 rounded-sm stellaris-btn-metallic text-slate-300 disabled:opacity-40 cursor-pointer"
                                title="Önceki Tur"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                disabled={currentRoundIdx >= totalRounds - 1}
                                onClick={() => {
                                  setIsPlaying(false);
                                  setCurrentRoundIdx((prev) => Math.min(totalRounds - 1, prev + 1));
                                  sound.playLaser();
                                }}
                                className="p-1 rounded-sm stellaris-btn-metallic text-slate-300 disabled:opacity-40 cursor-pointer"
                                title="Sonraki Tur"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Laser Fire Corridor */}
                          <div className="relative h-14 bg-[#050f18] rounded-sm border border-[#1c3647] p-2 flex items-center justify-between overflow-hidden">
                            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

                            {/* Attacker plasma stream (Left to Right) */}
                            <div className="absolute left-3 right-1/2 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 shadow-md shadow-rose-500/60 rounded-full animate-pulse" />
                            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded-sm border border-rose-500/40 z-10">
                              ⚡ -{currentRound ? currentRound.attackerDamageDealt : 0} Hasar
                            </div>

                            {/* Clash Sparks Core */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400/20 blur-[2px] flex items-center justify-center z-10">
                              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                            </div>

                            {/* Defender laser stream (Right to Left) */}
                            <div className="absolute right-3 left-1/2 h-1 bg-gradient-to-l from-blue-500 via-cyan-400 to-emerald-300 shadow-md shadow-cyan-400/60 rounded-full animate-pulse" />
                            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded-sm border border-cyan-500/40 z-10">
                              ⚡ -{currentRound ? currentRound.defenderDamageDealt : 0} Hasar
                            </div>
                          </div>
                        </>
                      )}

                      {/* Damage summary cards */}
                      {currentRound && (
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                          <div className="bg-rose-950/40 border border-rose-500/30 rounded-sm p-2 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Saldırgan Ateşi:</span>
                            <strong className="text-rose-400 text-sm">
                              {currentRound.attackerDamageDealt} Hasar
                            </strong>
                          </div>
                          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-sm p-2 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Savunucu Ateşi:</span>
                            <strong className="text-cyan-400 text-sm">
                              {currentRound.defenderDamageDealt} Hasar
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Interactive Round Firepower Comparison Curve */}
                      {totalRounds > 1 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#18374b]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Saldırgan vs
                              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block ml-1" /> Savunucu Ateş Gücü Eğrisi
                            </span>
                            <span className="text-slate-500">Tura tıklayarak atlayın</span>
                          </div>
                          <div className="h-16 bg-[#050f18] rounded-sm border border-[#1c3647] p-2 flex items-end gap-1.5 overflow-x-auto scrollbar-none">
                            {currentReport.rounds.map((rnd, idx) => {
                              const maxDmg = Math.max(
                                1,
                                ...currentReport.rounds.map((r) => Math.max(r.attackerDamageDealt, r.defenderDamageDealt))
                              );
                              const attHeight = Math.max(4, Math.round((rnd.attackerDamageDealt / maxDmg) * 32));
                              const defHeight = Math.max(4, Math.round((rnd.defenderDamageDealt / maxDmg) * 32));
                              const isCurrent = idx === currentRoundIdx;

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setIsPlaying(false);
                                    setCurrentRoundIdx(idx);
                                    sound.playLaser();
                                  }}
                                  className={`flex-1 min-w-[32px] max-w-[56px] h-full flex flex-col justify-end items-center p-1 rounded-xs transition-all cursor-pointer group ${
                                    isCurrent
                                      ? 'bg-cyan-950/80 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                      : 'hover:bg-[#0c1f2e] border border-transparent'
                                  }`}
                                  title={`Tur ${idx + 1}: Saldırgan ${rnd.attackerDamageDealt} | Savunucu ${rnd.defenderDamageDealt} Hasar`}
                                >
                                  <div className="w-full flex items-end justify-center gap-1 mb-1">
                                    <div
                                      className="w-2 bg-rose-500 rounded-xs transition-all group-hover:brightness-125"
                                      style={{ height: `${attHeight}px` }}
                                    />
                                    <div
                                      className="w-2 bg-cyan-400 rounded-xs transition-all group-hover:brightness-125"
                                      style={{ height: `${defHeight}px` }}
                                    />
                                  </div>
                                  <span className={`text-[9px] font-mono leading-none ${isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                    T{idx + 1}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spoils & Debris Field Created */}
                  <div className="stellaris-item-card border border-[#1c3647] rounded-sm p-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Yağmalanan Kaynak</span>
                      <span className="text-amber-400 font-bold">
                        {Math.round(currentReport.lootedResources.ore)}C • {Math.round(currentReport.lootedResources.crystal)}K • {Math.round(currentReport.lootedResources.fuel)}Y
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Oluşan Enkaz Sahası (%30)</span>
                      <span className="text-cyan-400 font-bold">
                        {Math.round(currentReport.debrisFieldCreated.ore)} Cevher • {Math.round(currentReport.debrisFieldCreated.crystal)} Kristal
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAKTİK SAVAŞ SİMÜLATÖRÜ & MONTE CARLO HESAPLAYICI                  */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs scrollbar-none">
          {/* Quick Presets Bar */}
          <div className="flex items-center justify-between bg-[#06121c] p-2.5 rounded-sm border border-[#1c3647]">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Hızlı Taktik Senaryolar:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => applyPreset('scout_skirmish')}
                className="stellaris-btn-metallic px-2.5 py-1 rounded-sm text-[10px] text-cyan-300 cursor-pointer"
              >
                Keşif Çatışması (Hafif)
              </button>
              <button
                onClick={() => applyPreset('raider_interception')}
                className="stellaris-btn-metallic px-2.5 py-1 rounded-sm text-[10px] text-amber-300 cursor-pointer"
              >
                Korsan Önleme (Orta)
              </button>
              <button
                onClick={() => applyPreset('heavy_siege')}
                className="stellaris-btn-metallic px-2.5 py-1 rounded-sm text-[10px] text-rose-300 cursor-pointer"
              >
                Ağır Kuşatma (Büyük Filo)
              </button>
            </div>
          </div>

          {/* Fleet Builders Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Attacker Fleet Builder */}
            <div className="stellaris-item-card border border-rose-500/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#18374b] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                  <span className="font-bold text-rose-300 text-xs uppercase tracking-wider font-display">
                    Saldırgan Filosu
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>Ateş: <strong className="text-rose-400">{Math.round(attRatings.totalAttack)}</strong></span>
                  <span>HP: <strong className="text-slate-200">{attRatings.totalHealth}</strong></span>
                </div>
              </div>

              {/* Ship Steppers */}
              <div className="space-y-2">
                {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                  <div key={st} className="flex items-center justify-between bg-[#061019] p-2 rounded-sm border border-[#142838]">
                    <div className="flex items-center gap-2">
                      <span>{SHIP_ICONS[st]}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-200">{SHIP_STATS[st].nameTr}</span>
                          <span className="text-[9px] text-amber-300 font-mono">
                            {WEAPON_MODULES[loadouts[st].weapon].icon} {WEAPON_MODULES[loadouts[st].weapon].nameTr.split(' ')[0]}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {getModifiedShipStats(st, loadouts[st]).attack} Atak • {getModifiedShipStats(st, loadouts[st]).hull + getModifiedShipStats(st, loadouts[st]).shield} Dayanıklılık
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setAttShips((prev) => ({ ...prev, [st]: Math.max(0, prev[st] - 1) }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-slate-400 flex items-center justify-center font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={attShips[st]}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setAttShips((prev) => ({ ...prev, [st]: val }));
                        }}
                        className="w-12 bg-[#091522] border border-[#1d3d54] rounded-sm px-1 py-0.5 text-center font-bold text-cyan-300 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          sound.playClick();
                          setAttShips((prev) => ({ ...prev, [st]: prev[st] + 1 }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-cyan-300 flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech & Tactical Modifiers */}
              <div className="pt-2 border-t border-[#18374b] space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Silah Araştırma:</span>
                  <select
                    value={attWeapons}
                    onChange={(e) => setAttWeapons(Number(e.target.value))}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-amber-300 font-bold focus:outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Seviye {lvl} (+%{lvl * 10} Hasar)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Filo Doktrini:</span>
                  <select
                    value={attDoctrine}
                    onChange={(e) => setAttDoctrine(e.target.value as FleetDoctrine)}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-rose-300 font-bold focus:outline-none"
                  >
                    <option value="spearhead">🎯 Mızrak Ucu (+%15 Ateş / +%10 Hasar)</option>
                    <option value="fortress">🏰 Hisar Savunması (-%10 Ateş / %20 Emilim)</option>
                    <option value="hit_and_run">⚡ Vur-Kaç (%20 Kaçınma)</option>
                    <option value="balanced">⚖️ Dengeli Hat (Standart)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kadim Yadigar:</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAttHasRelic(!attHasRelic);
                    }}
                    className={`px-2 py-0.5 rounded-sm border text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      attHasRelic
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 font-bold shadow-sm'
                        : 'bg-[#091522] border-[#1d3d54] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>{attHasRelic ? 'Kadim Zırh Kaplaması (+%10/-10%)' : 'Kadim Yadigar Yok'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Defender Fleet Builder */}
            <div className="stellaris-item-card border border-cyan-500/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#18374b] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
                  <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider font-display">
                    Savunucu Filosu
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>
                    Ateş: <strong className="text-cyan-400">{Math.round(defRatings.totalAttack + defDefenseRatings.totalAttack)}</strong>
                    {defDefenseRatings.totalAttack > 0 && (
                      <span className="text-amber-400 text-[9px] ml-1">(+{Math.round(defDefenseRatings.totalAttack)} Taret)</span>
                    )}
                  </span>
                  <span>HP: <strong className="text-slate-200">{defRatings.totalHealth + defDefenseRatings.totalHealth}</strong></span>
                </div>
              </div>

              {/* Ship Steppers */}
              <div className="space-y-2">
                {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                  <div key={st} className="flex items-center justify-between bg-[#061019] p-2 rounded-sm border border-[#142838]">
                    <div className="flex items-center gap-2">
                      <span>{SHIP_ICONS[st]}</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-200 block">{SHIP_STATS[st].nameTr}</span>
                        <span className="text-[9px] text-slate-500">
                          {SHIP_STATS[st].attack} Atak • {SHIP_STATS[st].hull + SHIP_STATS[st].shield} Dayanıklılık
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDefShips((prev) => ({ ...prev, [st]: Math.max(0, prev[st] - 1) }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-slate-400 flex items-center justify-center font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={defShips[st]}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDefShips((prev) => ({ ...prev, [st]: val }));
                        }}
                        className="w-12 bg-[#091522] border border-[#1d3d54] rounded-sm px-1 py-0.5 text-center font-bold text-cyan-300 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDefShips((prev) => ({ ...prev, [st]: prev[st] + 1 }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-cyan-300 flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Planetary Defense Batteries (Garnizon Taretleri) */}
              <div className="pt-2 border-t border-[#18374b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Gezegen Savunma Bataryaları
                  </span>
                  <span className="text-[9px] text-slate-400">
                    +{Math.round(defDefenseRatings.totalAttack)} Ateş • +{defDefenseRatings.totalHealth} Can
                  </span>
                </div>
                {(['missile_battery', 'plasma_turret', 'ion_cannon'] as DefenseStructureType[]).map((dt) => (
                  <div key={dt} className="flex items-center justify-between bg-[#061019] p-1.5 rounded-sm border border-[#142838]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{DEFENSE_ICONS[dt]}</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-200 block">{DEFENSE_STATS[dt].nameTr}</span>
                        <span className="text-[9px] text-slate-500">
                          {DEFENSE_STATS[dt].attack} Atak • {DEFENSE_STATS[dt].hull + DEFENSE_STATS[dt].shield} Dayanıklılık
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDefDefenses((prev) => ({ ...prev, [dt]: Math.max(0, prev[dt] - 1) }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-slate-400 flex items-center justify-center font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={defDefenses[dt]}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDefDefenses((prev) => ({ ...prev, [dt]: val }));
                        }}
                        className="w-12 bg-[#091522] border border-[#1d3d54] rounded-sm px-1 py-0.5 text-center font-bold text-amber-300 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDefDefenses((prev) => ({ ...prev, [dt]: prev[dt] + 1 }));
                        }}
                        className="w-6 h-6 rounded-sm stellaris-btn-metallic text-amber-300 flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech, Stance, Doctrine & Specialization Modifiers */}
              <div className="pt-2 border-t border-[#18374b] space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Silah Seviyesi:</span>
                  <select
                    value={defWeapons}
                    onChange={(e) => setDefWeapons(Number(e.target.value))}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-amber-300 font-bold focus:outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Seviye {lvl} (+%{lvl * 10} Hasar)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gezegen Duruşu:</span>
                  <select
                    value={defStance}
                    onChange={(e) => setDefStance(e.target.value as PlanetStance)}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value="hold_position">Mevziiyi Koru (Son Gemiye Kadar Savaş)</option>
                    <option value="evade_safeguard">Ağır Baskında Kaçın (Filoyu Koru)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Filo Doktrini:</span>
                  <select
                    value={defDoctrine}
                    onChange={(e) => setDefDoctrine(e.target.value as FleetDoctrine)}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-cyan-300 font-bold focus:outline-none"
                  >
                    <option value="fortress">🏰 Hisar Savunması (-%10 Ateş / %20 Emilim)</option>
                    <option value="spearhead">🎯 Mızrak Ucu (+%15 Ateş / +%10 Hasar)</option>
                    <option value="hit_and_run">⚡ Vur-Kaç (%20 Kaçınma)</option>
                    <option value="balanced">⚖️ Dengeli Hat (Standart)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gezegen Uzmanlaşması:</span>
                  <select
                    value={defSpecialization}
                    onChange={(e) => setDefSpecialization(e.target.value as PlanetSpecialization)}
                    className="bg-[#091522] border border-[#1d3d54] rounded-sm px-2 py-0.5 text-emerald-300 font-bold focus:outline-none"
                  >
                    <option value="balanced">Standart Koloni</option>
                    <option value="military_bastion">⚔️ Askeri Kale (Taretler %60 Hasar Emer & +%25 Can)</option>
                    <option value="mining_world">Cevher Madencilik Dünyası</option>
                    <option value="tech_haven">Teknoloji & Araştırma Cenneti</option>
                    <option value="forge_world">Tersane & Ağır Sanayi</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kadim Yadigar:</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setDefHasRelic(!defHasRelic);
                    }}
                    className={`px-2 py-0.5 rounded-sm border text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      defHasRelic
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 font-bold shadow-sm'
                        : 'bg-[#091522] border-[#1d3d54] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>{defHasRelic ? 'Kadim Zırh Kaplaması (+%10/-10%)' : 'Kadim Yadigar Yok'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Simulation Button */}
          <div className="flex items-center justify-center pt-1">
            <button
              onClick={handleRunSimulation}
              className="px-6 py-2.5 rounded-sm stellaris-btn-metallic !border-cyan-500/70 text-cyan-200 font-display font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl shadow-cyan-950/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>100x Monte Carlo Savaş Simülasyonunu Çalıştır</span>
            </button>
          </div>

          {/* Simulation Output Dashboard */}
          {simResult && (
            <div className="stellaris-item-card border border-[#1c3647] p-4 rounded-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#18374b] pb-2">
                <span className="text-xs font-bold font-display text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Simülasyon Sonuç Analizi (100 Senaryo Ortalaması)</span>
                </span>
                <button
                  onClick={handleWatchSimulatedBattle}
                  className="px-3 py-1 rounded-sm bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Simülasyon Çatışmasını Tur Tur İzle ➔</span>
                </button>
              </div>

              {/* Win Probability Multi-bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-400 font-bold">
                    Saldırgan Zaferi: %{simResult.attackerWinRate}
                  </span>
                  <span className="text-amber-400 font-bold">
                    Beraberlik: %{simResult.drawRate}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    Savunucu Zaferi: %{simResult.defenderWinRate}
                  </span>
                </div>
                <div className="w-full h-3 bg-[#050b12] rounded-none overflow-hidden flex border border-[#18374b]">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500 shadow-sm"
                    style={{ width: `${simResult.attackerWinRate}%` }}
                    title={`Saldırgan Zaferi: %${simResult.attackerWinRate}`}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${simResult.drawRate}%` }}
                    title={`Beraberlik: %${simResult.drawRate}`}
                  />
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${simResult.defenderWinRate}%` }}
                    title={`Savunucu Zaferi: %${simResult.defenderWinRate}`}
                  />
                </div>
              </div>

              {/* Casualties & Resource Efficiency Analysis */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Attacker Loss Breakdown */}
                <div className="bg-[#050f19] p-3 rounded-sm border border-rose-500/30 space-y-2">
                  <div className="font-bold text-rose-300 text-[11px] uppercase flex items-center justify-between">
                    <span>Saldırgan Ortalama Kayıp</span>
                    <span className="text-rose-400 font-bold">
                      -{simResult.avgAttackerCostLoss.ore}C • -{simResult.avgAttackerCostLoss.crystal}K
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                      <div key={st} className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span>{SHIP_ICONS[st]}</span> {SHIP_STATS[st].nameTr}:
                        </span>
                        <strong className="text-rose-300">
                          {simResult.avgAttackerLosses[st]} Gemi
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defender Loss Breakdown */}
                <div className="bg-[#050f19] p-3 rounded-sm border border-cyan-500/30 space-y-2">
                  <div className="font-bold text-cyan-300 text-[11px] uppercase flex items-center justify-between">
                    <span>Savunucu Ortalama Kayıp</span>
                    <span className="text-cyan-400 font-bold">
                      -{simResult.avgDefenderCostLoss.ore}C • -{simResult.avgDefenderCostLoss.crystal}K
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                      <div key={st} className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span>{SHIP_ICONS[st]}</span> {SHIP_STATS[st].nameTr}:
                        </span>
                        <strong className="text-cyan-300">
                          {simResult.avgDefenderLosses[st]} Gemi
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Recommendation */}
              <div className="p-3 bg-[#061421] border border-[#1b3d56] rounded-sm text-[11.5px] leading-relaxed text-slate-300">
                <span className="text-amber-400 font-bold block mb-1">
                  💡 Sektör Harp Komutanlığı Tavsiyesi:
                </span>
                {simResult.attackerWinRate > 75 ? (
                  <span>
                    Saldırgan filosu ezici ateş üstünlüğüne sahip. Savunucu hattı ilk turlarda eriyerek ağır zayiat veriyor. Doğrudan taarruz kesin zafer vadeder.
                  </span>
                ) : simResult.defenderWinRate > 75 ? (
                  <span>
                    Savunma garnizonu gelen saldırıya karşı aşılmaz bir direnç sergiliyor. Saldırgan filosu yetersiz; daha fazla Savaş Gemisi veya Avcı desteği gereklidir.
                  </span>
                ) : (
                  <span>
                    Kritik yıpratma savaşı dengesi (%{simResult.attackerWinRate} vs %{simResult.defenderWinRate}). Her iki taraf da ağır maliyetli kayıplar yaşayacaktır; önleme ve taktik silah seviyesi belirleyici olacaktır.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isDocked) return content;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200"
    >
      {content}
    </div>
  );
};

export const CombatReplayModal = React.memo(CombatReplayModalComponent);
