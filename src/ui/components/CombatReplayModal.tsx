import React, { useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Pickaxe,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { BattleReport, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';

interface CombatReplayModalProps {
  reports: BattleReport[];
  isOpen: boolean;
  onClose: () => void;
}

export const CombatReplayModal: React.FC<CombatReplayModalProps> = ({
  reports,
  isOpen,
  onClose,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);

  if (!isOpen) return null;

  const currentReport = reports.find((r) => r.id === selectedReportId) || reports[reports.length - 1];

  const totalRounds = currentReport ? currentReport.rounds.length : 0;
  const currentRound = currentReport?.rounds[currentRoundIdx];

  const contextTitles = {
    planet_raid: 'GEZEGEN BASKINI',
    fleet_interception: 'FİLO ÖNLEME ÇATIŞMASI',
    relay_contest: 'NEXUS RÖLESİ HAKİMİYET SAVAŞI',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-space-900 border border-rose-500/40 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-rose-950/40 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-space-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Taktik Savaş Kayıtları & Çatışma Tekrarı
              </h2>
              <span className="text-xs text-rose-400 font-mono">
                {reports.length} Kayıtlı Muharebe Raporu
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">
            Henüz gerçekleşen bir savaş veya önleme bulunmuyor.
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Reports List */}
            <div className="w-72 border-r border-slate-800 overflow-y-auto p-2.5 space-y-1.5 bg-space-950/60">
              {reports.map((report) => {
                const isSelected = (currentReport && currentReport.id === report.id);
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setCurrentRoundIdx(0);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500/50 shadow-sm'
                        : 'bg-space-850/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="text-rose-400 font-bold">
                        {contextTitles[report.context]}
                      </span>
                      <span>{report.systemName}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {report.attackerName} vs {report.defenderName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Kazanan: <strong className="text-emerald-400 uppercase">{report.winner}</strong>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Replay Viewer */}
            {currentReport && (
              <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                {/* Battle Metadata Banner */}
                <div className="bg-space-850/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                      {contextTitles[currentReport.context]} • {currentReport.systemName}
                    </div>
                    <div className="text-base font-bold text-slate-100 font-display mt-0.5">
                      {currentReport.attackerName} &nbsp;⚔️&nbsp; {currentReport.defenderName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
                      🏆 KAZANAN: {currentReport.winner.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Fleet Rosters Overview */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Attacker Roster */}
                  <div className="bg-space-850 border border-rose-500/30 rounded-lg p-3">
                    <div className="text-xs font-bold text-rose-400 font-display mb-2 flex items-center justify-between">
                      <span>SALDIRGAN: {currentReport.attackerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Başlangıç / Kalan
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                        const init = currentReport.initialAttacker[st] || 0;
                        const surv = currentReport.survivingAttacker[st] || 0;
                        if (init === 0) return null;
                        return (
                          <div key={st} className="flex justify-between text-slate-300">
                            <span>{SHIP_STATS[st].nameTr}</span>
                            <span>
                              <span className="text-slate-400">{init}</span> ➔{' '}
                              <strong className="text-emerald-400">{surv}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Defender Roster */}
                  <div className="bg-space-850 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-xs font-bold text-blue-400 font-display mb-2 flex items-center justify-between">
                      <span>SAVUNUCU: {currentReport.defenderName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Başlangıç / Kalan
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
                        const init = currentReport.initialDefender[st] || 0;
                        const surv = currentReport.survivingDefender[st] || 0;
                        if (init === 0) return null;
                        return (
                          <div key={st} className="flex justify-between text-slate-300">
                            <span>{SHIP_STATS[st].nameTr}</span>
                            <span>
                              <span className="text-slate-400">{init}</span> ➔{' '}
                              <strong className="text-emerald-400">{surv}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Round Player Controls */}
                {totalRounds > 0 && (
                  <div className="bg-space-850/90 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-display text-slate-200">
                        TUR {currentRoundIdx + 1} / {totalRounds}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentRoundIdx === 0}
                          onClick={() => setCurrentRoundIdx((prev) => Math.max(0, prev - 1))}
                          className="p-1 rounded bg-space-900 border border-slate-700 text-slate-300 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={currentRoundIdx >= totalRounds - 1}
                          onClick={() => setCurrentRoundIdx((prev) => Math.min(totalRounds - 1, prev + 1))}
                          className="p-1 rounded bg-space-900 border border-slate-700 text-slate-300 disabled:opacity-40"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {currentRound && (
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Saldırgan Ateşi</span>
                          <strong className="text-rose-400 text-sm">
                            {currentRound.attackerDamageDealt} Hasar
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Savunucu Ateşi</span>
                          <strong className="text-blue-400 text-sm">
                            {currentRound.defenderDamageDealt} Hasar
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Spoils & Debris Field Created */}
                <div className="bg-space-950/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
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
          </div>
        )}
      </div>
    </div>
  );
};
