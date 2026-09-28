import React, { useState, useEffect } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Pause,
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
import { sound } from '../sound';

interface CombatReplayModalProps {
  reports: BattleReport[];
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
}

export const CombatReplayModal: React.FC<CombatReplayModalProps> = ({
  reports,
  isOpen,
  isDocked = false,
  onClose,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const currentReport = reports.find((r) => r.id === selectedReportId) || reports[reports.length - 1];
  const totalRounds = currentReport ? currentReport.rounds.length : 0;
  const currentRound = currentReport?.rounds[currentRoundIdx];

  // Autoplay combat rounds with audio effects
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

  if (!isOpen) return null;

  const contextTitles = {
    planet_raid: 'GEZEGEN BASKINI',
    fleet_interception: 'FİLO ÖNLEME ÇATIŞMASI',
    relay_contest: 'NEXUS RÖLESİ HAKİMİYET SAVAŞI',
  };

  const content = (
    <div className={isDocked ? "w-[820px] min-w-[820px] max-w-[820px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none" : "stellaris-outliner border border-[#1c3647] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"}>
        {/* Header */}
        <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                Taktik Savaş Kayıtları & Çatışma Tekrarı
              </h2>
              <span className="text-[10px] text-rose-400 font-mono">
                {reports.length} Kayıtlı Muharebe Raporu
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            Henüz gerçekleşen bir savaş veya önleme bulunmuyor.
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Reports List */}
            <div className="w-72 border-r border-[#18374b] overflow-y-auto p-2.5 pb-32 space-y-1.5 bg-[#06121c]">
              {reports.map((report) => {
                const isSelected = (currentReport && currentReport.id === report.id);
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedReportId(report.id);
                      setCurrentRoundIdx(0);
                    }}
                    className={`w-full text-left p-2.5 rounded border transition-all ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500/60 text-white shadow-sm'
                        : 'stellaris-item-card border-[#1c3647] hover:border-[#3885a8] text-slate-300'
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
              <div className="flex-1 flex flex-col overflow-y-auto p-4 pb-32 space-y-4">
                {/* Battle Metadata Banner */}
                <div className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between">
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

                {/* Round Player Controls & Dynamic Combat Corridor */}
                {totalRounds > 0 && (
                  <div className="bg-space-850/90 border border-slate-800 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-display text-slate-200">
                          TUR {currentRoundIdx + 1} / {totalRounds}
                        </span>
                        {/* Autoplay / Pause Toggle Button */}
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
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                            isPlaying
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {isPlaying ? 'DURAKLAT' : 'OTOMATİK OYNAT'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentRoundIdx === 0}
                          onClick={() => {
                            setIsPlaying(false);
                            setCurrentRoundIdx((prev) => Math.max(0, prev - 1));
                            sound.playLaser();
                          }}
                          className="p-1 rounded bg-space-900 border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-40"
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
                          className="p-1 rounded bg-space-900 border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-40"
                          title="Sonraki Tur"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Laser Fire Corridor */}
                    <div className="relative h-14 bg-space-950/90 rounded-lg border border-slate-800 p-2 flex items-center justify-between overflow-hidden">
                      {/* Sub-grid pattern */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

                      {/* Attacker plasma stream (Left to Right) */}
                      <div className="absolute left-3 right-1/2 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 shadow-md shadow-rose-500/60 rounded-full animate-pulse" />
                      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-500/40 z-10">
                        ⚡ -{currentRound ? currentRound.attackerDamageDealt : 0} HP
                      </div>

                      {/* Clash Sparks Core */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400/20 blur-[2px] flex items-center justify-center z-10">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                      </div>

                      {/* Defender laser stream (Right to Left) */}
                      <div className="absolute right-3 left-1/2 h-1 bg-gradient-to-l from-blue-500 via-cyan-400 to-emerald-300 shadow-md shadow-cyan-400/60 rounded-full animate-pulse" />
                      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-500/40 z-10">
                        ⚡ -{currentRound ? currentRound.defenderDamageDealt : 0} HP
                      </div>
                    </div>

                    {/* Damage summary cards */}
                    {currentRound && (
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                        <div className="bg-rose-950/30 border border-rose-500/20 rounded p-2 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Saldırgan Ateşi:</span>
                          <strong className="text-rose-400 text-sm">
                            {currentRound.attackerDamageDealt} Hasar
                          </strong>
                        </div>
                        <div className="bg-blue-950/30 border border-blue-500/20 rounded p-2 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Savunucu Ateşi:</span>
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
  );

  if (isDocked) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      {content}
    </div>
  );
};
