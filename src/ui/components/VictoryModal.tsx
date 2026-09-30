import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Crown,
  Globe,
  History,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { VictoryRecord, VictoryType } from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  victory?: VictoryRecord | null;
  seasonHistory?: VictoryRecord[];
  activePlayerId: string;
  onResetSeason: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  victory,
  seasonHistory = [],
  activePlayerId,
  onResetSeason,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  React.useEffect(() => {
    if (isOpen && victory) {
      sound.playVictoryFanfare();
    }
  }, [isOpen, victory]);

  if (!isOpen) return null;

  const isMeWinner = victory?.winnerId === activePlayerId;
  const isAllianceWin = victory?.isAlliance || false;

  const getVictoryTitle = (type?: VictoryType) => {
    switch (type) {
      case 'hegemony':
      case 'alliance_hegemony':
        return 'NEXUS HEGEMONYASI ZAFERİ';
      case 'domination':
      case 'alliance_domination':
        return 'GEZEGENSEL DOMİNASYON ZAFERİ';
      default:
        return 'GALAKTİK MUTLAK ZAFER';
    }
  };

  const getVictoryDescription = (type?: VictoryType) => {
    switch (type) {
      case 'hegemony':
      case 'alliance_hegemony':
        return 'Merkezi Nexus Rölesi ve kadim emanetleri 500 Hegemonya Puanına ulaştırarak tüm sektör üzerinde mutlak denetim tesis edildi.';
      case 'domination':
      case 'alliance_domination':
        return 'Sektördeki tüm kolonileşmiş dünyaların en az %60\'ı askeri ve diplomatik güçle kontrol altına alındı.';
      default:
        return 'Sezon hedefleri tamamlandı.';
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 select-none animate-in fade-in duration-200"
    >
      <div className="stellaris-outliner border-2 border-amber-500/50 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-amber-500/30 stellaris-outliner-header flex items-center justify-between bg-gradient-to-r from-[#0c1824] via-[#1a1c12] to-[#0c1824]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-inner">
              <Trophy className="w-4 h-4 animate-bounce text-amber-300" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span>Galaktik Sezon Zafer Raporu</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {victory ? new Date(victory.timestampMs).toLocaleDateString() : 'Aktif Sezon'} • Nexus Protokolü
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all cursor-pointer"
            title="Kapat (Haritayı İncele)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Victor Hero Card */}
          <div className="stellaris-item-card border-amber-500/40 bg-gradient-to-b from-[#171408]/80 to-[#07131e]/90 p-4 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            <div className="w-14 h-14 rounded-full mx-auto bg-amber-950/90 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>

            <div>
              <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                {getVictoryTitle(victory?.victoryType)}
              </div>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                {victory?.winnerName || 'Bilinmeyen Muzaffer'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 font-mono max-w-lg mx-auto leading-relaxed">
              {getVictoryDescription(victory?.victoryType)}
            </p>

            {/* Victory Congratulation Banner */}
            <div
              className={`p-2 rounded-sm text-xs font-mono font-bold border ${
                isMeWinner
                  ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                  : 'bg-[#061420] border-[#1d3d52] text-slate-300'
              }`}
            >
              {isMeWinner ? (
                <span>👑 TEBRİKLER KOMUTAN! Bu galaksinin nihai hükümdarı oldunuz!</span>
              ) : (
                <span>Sektör bu sezon muzaffer imparatorluğun egemenliği altına girdi.</span>
              )}
            </div>
          </div>

          {/* Match Statistics Grid */}
          {victory && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Hegemony Points */}
              <div className="stellaris-item-card border-[#1c3647] p-2.5 text-center">
                <span className="text-[10px] text-amber-300 font-mono block uppercase">Hegemonya</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {victory.stats.hegemonyPoints}
                </span>
                <span className="text-[9.5px] text-slate-400 block font-mono">/ 500 Puan</span>
              </div>

              {/* Colony Dominance */}
              <div className="stellaris-item-card border-[#1c3647] p-2.5 text-center">
                <span className="text-[10px] text-emerald-300 font-mono block uppercase">Koloniler</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  %{Math.round(victory.stats.colonyRatio * 100)}
                </span>
                <span className="text-[9.5px] text-slate-400 block font-mono">
                  {victory.stats.ownedPlanetsCount} / {victory.stats.totalPlanetsCount} Koloni
                </span>
              </div>

              {/* Space Battles */}
              <div className="stellaris-item-card border-[#1c3647] p-2.5 text-center">
                <span className="text-[10px] text-rose-300 font-mono block uppercase">Muharebe</span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {victory.stats.totalBattlesFought}
                </span>
                <span className="text-[9.5px] text-slate-400 block font-mono">Savaş Kaydı</span>
              </div>

              {/* Ships Destroyed */}
              <div className="stellaris-item-card border-[#1c3647] p-2.5 text-center">
                <span className="text-[10px] text-cyan-300 font-mono block uppercase">Gemi Kaybı</span>
                <span className="text-base font-bold text-cyan-400 font-mono">
                  {victory.stats.shipsDestroyed}
                </span>
                <span className="text-[9.5px] text-slate-400 block font-mono">İmha Edilen Gemi</span>
              </div>
            </div>
          )}

          {/* Hall of Fame (Geçmiş Sezonlar) */}
          <div className="stellaris-item-card border-[#1c3647] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Şöhretler Salonu (Geçmiş Sezonlar: {seasonHistory.length})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowHistory(!showHistory);
                }}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 cursor-pointer"
              >
                {showHistory ? 'Gizle' : 'Görüntüle'}
              </button>
            </div>

            {showHistory && (
              <div className="space-y-1.5 pt-2 border-t border-[#162f40]">
                {seasonHistory.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono italic text-center py-2">
                    Henüz kaydedilmiş geçmiş bir sezon şampiyonu bulunmuyor.
                  </div>
                ) : (
                  seasonHistory.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-[#05111d] border border-[#1b3e54] p-2 rounded-sm flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">#{seasonHistory.length - idx}</span>
                        <span className="text-slate-100 font-semibold">{rec.winnerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-amber-950/80 border border-amber-500/40 text-amber-300">
                          {getVictoryTitle(rec.victoryType)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rec.stats.hegemonyPoints} Puan • %{Math.round(rec.stats.colonyRatio * 100)} Koloni
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 border-t border-[#1c3647] bg-[#07131e] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-[#0b1e2c] border border-[#1d435d] hover:border-cyan-400 rounded-sm cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>Haritayı İncelemeye Devam Et</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playLaunch();
              onResetSeason();
            }}
            className="px-4 py-2 text-xs font-mono font-bold text-amber-100 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border border-amber-300 rounded-sm cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-100" />
            <span>Yeni Galaktik Sezon Başlat (Tohum Sıfırla)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
