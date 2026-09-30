import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  Clock,
  Coins,
  Flame,
  Gem,
  Info,
  Layers,
  LineChart,
  Percent,
  Pickaxe,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { GameState, Planet, ResourceType } from '../../engine/types';
import { sound } from '../sound';

interface TradeModalProps {
  state: GameState;
  activePlayerId: string;
  activePlanet: Planet | undefined;
  onClose: () => void;
  onTrade: (sellResource: ResourceType, buyResource: ResourceType, sellAmount: number) => void;
}

const RESOURCE_META: Record<
  ResourceType,
  { nameTr: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  ore: {
    nameTr: 'Ham Maden / Cevher',
    icon: <Pickaxe className="w-4 h-4 text-orange-400" />,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/40',
  },
  crystal: {
    nameTr: 'Nadir Kristal',
    icon: <Gem className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/40',
  },
  fuel: {
    nameTr: 'Enerji / Yakıt',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
  },
};

export const TradeModal: React.FC<TradeModalProps> = ({
  state,
  activePlayerId,
  activePlanet,
  onClose,
  onTrade,
}) => {
  const [sellResource, setSellResource] = useState<ResourceType>('ore');
  const [buyResource, setBuyResource] = useState<ResourceType>('fuel');
  const [sellAmountInput, setSellAmountInput] = useState<string>('500');

  const player = state.players[activePlayerId];
  const market = state.market;

  const currentPlanet = activePlanet || Object.values(state.planets).find(p => p.ownerId === activePlayerId);
  const planetResources = currentPlanet?.resources || { ore: 0, crystal: 0, fuel: 0 };
  const currentAvailable = planetResources[sellResource];

  const parsedAmount = Math.max(0, parseInt(sellAmountInput, 10) || 0);

  // Fee calculation: base 15%, alliance -5%, sensor tech -2.5% per tier above 1
  const feeRate = useMemo(() => {
    let fee = market.baseFeeRate || 0.15;
    if (player?.allianceId) fee -= 0.05;
    const sensors = player?.research?.sensors || 0;
    if (sensors >= 2) fee -= 0.025;
    if (sensors >= 4) fee -= 0.025;
    return Math.max(0.05, Math.min(0.20, fee));
  }, [player, market.baseFeeRate]);

  // Trade estimate
  const tradeEstimate = useMemo(() => {
    if (parsedAmount <= 0 || sellResource === buyResource) {
      return { buyAmount: 0, grossCredits: 0, feePaid: 0, effectiveRate: 0 };
    }
    const sellPrice = market.rates[sellResource];
    const buyPrice = market.rates[buyResource];
    const grossCredits = parsedAmount * sellPrice;
    const netCredits = grossCredits * (1 - feeRate);
    const buyAmount = Math.max(0, Math.floor(netCredits / buyPrice));
    const feePaid = Math.round(grossCredits * feeRate);
    const effectiveRate = parsedAmount > 0 ? Number((buyAmount / parsedAmount).toFixed(3)) : 0;
    return { buyAmount, grossCredits, feePaid, effectiveRate };
  }, [parsedAmount, sellResource, buyResource, market.rates, feeRate]);

  const canAfford = currentAvailable >= parsedAmount && parsedAmount > 0;

  const handleExecuteTrade = () => {
    if (!canAfford || parsedAmount <= 0) {
      sound.playError();
      return;
    }
    sound.playClick();
    onTrade(sellResource, buyResource, parsedAmount);
  };

  const handleSelectSell = (r: ResourceType) => {
    sound.playHover();
    setSellResource(r);
    if (r === buyResource) {
      const candidates: ResourceType[] = ['ore', 'crystal', 'fuel'];
      const alt = candidates.find(c => c !== r) || 'fuel';
      setBuyResource(alt);
    }
  };

  const handleSelectBuy = (r: ResourceType) => {
    sound.playHover();
    setBuyResource(r);
    if (r === sellResource) {
      const candidates: ResourceType[] = ['ore', 'crystal', 'fuel'];
      const alt = candidates.find(c => c !== r) || 'ore';
      setSellResource(alt);
    }
  };

  const setAmountPreset = (amt: number) => {
    sound.playHover();
    setSellAmountInput(String(Math.min(Math.floor(currentAvailable), amt)));
  };

  const setAmountPercent = (pct: number) => {
    sound.playHover();
    setSellAmountInput(String(Math.floor(currentAvailable * pct)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col stellaris-modal rounded-sm border border-[#2b4c63] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1b3a4b] bg-gradient-to-r from-[#0d1f2d] via-[#132c3f] to-[#0a1824]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-600/30 to-amber-900/50 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
              <LineChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="stellaris-gold font-display text-base font-bold tracking-wider flex items-center gap-2">
                GALAKTİK PAZAR & DİNAMİK TİCARET BORSASI
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.2 rounded-sm font-normal">
                  CANLI KUR
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Merkezi Nexus Ticaret Ağı • Arz-Talep Algoritması • İttifak İndirimleri Aktif
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">

          {/* 1. REAL-TIME TICKER BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['ore', 'crystal', 'fuel'] as ResourceType[]).map((res) => {
              const meta = RESOURCE_META[res];
              const curRate = market.rates[res];
              const baseRate = market.baseRates[res];
              const diffPercent = ((curRate - baseRate) / baseRate) * 100;
              const isUp = diffPercent >= 0;

              return (
                <div
                  key={res}
                  className={`p-3 rounded-sm stellaris-item-card border ${meta.border} flex items-center justify-between shadow-sm relative overflow-hidden`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-sm ${meta.bg} border ${meta.border}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-300">{meta.nameTr}</div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-mono text-base font-bold text-white tracking-wide">
                          {curRate.toFixed(3)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Kredi</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`flex items-center justify-end gap-0.5 font-mono text-xs font-bold ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{diffPercent >= 0 ? `+${diffPercent.toFixed(1)}%` : `${diffPercent.toFixed(1)}%`}</span>
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                      24s Hacim: {Math.round(market.volume24h[res] || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DYNAMIC SWAP / TRADE INTERFACE */}
          <div className="p-4 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90 relative">
            <div className="text-xs font-bold font-display text-slate-200 tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                KAYNAK DÖNÜŞTÜRÜCÜ & ANINDA TAKAS
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Aktif Koloni: <strong className="text-cyan-300">{currentPlanet?.name || 'Ana Dünya'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
              
              {/* SELL SIDE (Cols 5) */}
              <div className="lg:col-span-5 p-3.5 rounded-sm bg-[#0a1824]/90 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                  <span className="text-slate-400 font-semibold">SATILACAK KAYNAK</span>
                  <span className="text-slate-300">
                    Mevcut: <strong className="text-amber-300">{Math.floor(currentAvailable).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Resource Selector Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['ore', 'crystal', 'fuel'] as ResourceType[]).map((r) => {
                    const isSelected = sellResource === r;
                    const meta = RESOURCE_META[r];
                    return (
                      <button
                        key={r}
                        onClick={() => handleSelectSell(r)}
                        className={`py-1.5 px-2 rounded-sm border flex items-center justify-center gap-1.5 font-mono text-xs transition-all ${
                          isSelected
                            ? `${meta.bg} ${meta.border} text-white font-bold shadow-md`
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {meta.icon}
                        <span>{r === 'ore' ? 'Cevher' : r === 'crystal' ? 'Kristal' : 'Yakıt'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Amount Input */}
                <div className="relative mb-2">
                  <input
                    type="number"
                    min="1"
                    max={Math.floor(currentAvailable)}
                    value={sellAmountInput}
                    onChange={(e) => setSellAmountInput(e.target.value)}
                    className="w-full bg-[#050e17] border border-slate-700 focus:border-cyan-500 rounded-sm py-2 px-3 text-white font-mono text-base font-bold outline-none transition-colors"
                    placeholder="Miktar giriniz..."
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 uppercase">
                    {sellResource}
                  </span>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <button
                    onClick={() => setAmountPreset(100)}
                    className="flex-1 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-300"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setAmountPreset(500)}
                    className="flex-1 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-300"
                  >
                    +500
                  </button>
                  <button
                    onClick={() => setAmountPreset(1000)}
                    className="flex-1 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-300"
                  >
                    +1000
                  </button>
                  <button
                    onClick={() => setAmountPercent(0.5)}
                    className="flex-1 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-amber-300 font-bold"
                  >
                    %50
                  </button>
                  <button
                    onClick={() => setAmountPercent(1)}
                    className="flex-1 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 text-amber-200 font-bold"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* CONVERSION MIDDLE INDICATOR (Col 1) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-cyan-400 py-1">
                <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-4 h-4 hidden lg:block" />
                  <ArrowRightLeft className="w-4 h-4 lg:hidden" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1 hidden lg:block text-center leading-tight">
                  1 {sellResource === 'ore' ? 'C' : sellResource === 'crystal' ? 'K' : 'Y'} = {tradeEstimate.effectiveRate}
                </span>
              </div>

              {/* BUY SIDE (Cols 5) */}
              <div className="lg:col-span-5 p-3.5 rounded-sm bg-[#0a1824]/90 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                  <span className="text-slate-400 font-semibold">ALINACAK KAYNAK</span>
                  <span className="text-slate-300">
                    Depoda: <strong className="text-cyan-300">{Math.floor(planetResources[buyResource]).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Resource Selector Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['ore', 'crystal', 'fuel'] as ResourceType[]).map((r) => {
                    const isSelected = buyResource === r;
                    const meta = RESOURCE_META[r];
                    const isSelf = sellResource === r;
                    return (
                      <button
                        key={r}
                        disabled={isSelf}
                        onClick={() => handleSelectBuy(r)}
                        className={`py-1.5 px-2 rounded-sm border flex items-center justify-center gap-1.5 font-mono text-xs transition-all ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed bg-slate-900/40 border-slate-800 text-slate-500'
                            : isSelected
                            ? `${meta.bg} ${meta.border} text-white font-bold shadow-md`
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {meta.icon}
                        <span>{r === 'ore' ? 'Cevher' : r === 'crystal' ? 'Kristal' : 'Yakıt'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Estimated Yield Output Box */}
                <div className="bg-[#050e17] border border-cyan-500/50 rounded-sm py-2 px-3 flex items-center justify-between mb-2 shadow-inner">
                  <div className="font-mono text-lg font-bold text-cyan-300 tracking-wide">
                    +{tradeEstimate.buyAmount.toLocaleString()}
                  </div>
                  <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                    {buyResource}
                  </span>
                </div>

                {/* Storage remaining indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Maksimum Kapasite:</span>
                  <span className="text-slate-200">{currentPlanet?.storageCap.toLocaleString() || '20,000'}</span>
                </div>
              </div>

            </div>

            {/* Transaction Fees & Execute Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Borsa Komisyonu:</span>
                  <strong className="text-amber-400 font-bold">%{Math.round(feeRate * 100)}</strong>
                </div>

                {player?.allianceId && (
                  <span className="text-[10.5px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> İttifak İndirimi (-%5)
                  </span>
                )}

                {(player?.research?.sensors || 0) >= 2 && (
                  <span className="text-[10.5px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.5 rounded-sm">
                    Sensör Ar-Ge İndirimi
                  </span>
                )}

                <div className="text-[11px] text-slate-400">
                  Ödenecek Komisyon: <span className="text-slate-300">{tradeEstimate.feePaid.toLocaleString()} Kredi</span>
                </div>
              </div>

              <button
                disabled={!canAfford || parsedAmount <= 0}
                onClick={handleExecuteTrade}
                className={`px-5 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  canAfford && parsedAmount > 0
                    ? 'stellaris-btn-metallic text-amber-200 border-amber-500/60 shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-400" />
                Takası Onayla & Gerçekleştir
              </button>
            </div>
            
            {!canAfford && parsedAmount > 0 && (
              <div className="mt-2 text-[11px] text-rose-400 font-mono text-center">
                ⚠️ Seçili kolonide yeterli {sellResource === 'ore' ? 'Cevher' : sellResource === 'crystal' ? 'Kristal' : 'Yakıt'} bulunmuyor.
              </div>
            )}
          </div>

          {/* 3. GALACTIC TRANSACTIONS TAPE / HISTORY */}
          <div className="p-4 rounded-sm stellaris-outliner border border-[#1b3a4b] bg-[#08131d]/90">
            <div className="flex items-center justify-between text-xs font-bold font-display text-slate-200 tracking-wider mb-2.5">
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                CANLI GALAKTİK BORSASI İŞLEM BANDI (SON İŞLEMLER)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Toplam Kayıt: {market.transactionHistory.length}
              </span>
            </div>

            {market.transactionHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                Henüz piyasada gerçekleşen bir takas işlemi bulunmuyor. İlk emri siz verin!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {market.transactionHistory.slice(0, 15).map((tx) => {
                  const sellMeta = RESOURCE_META[tx.sellResource];
                  const buyMeta = RESOURCE_META[tx.buyResource];
                  const isMyTx = tx.playerId === activePlayerId;

                  return (
                    <div
                      key={tx.id}
                      className={`py-2 px-2 flex items-center justify-between font-mono text-xs hover:bg-slate-800/30 transition-colors ${
                        isMyTx ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isMyTx ? 'text-cyan-300' : 'text-slate-300'}`}>
                          {tx.playerName}
                        </span>
                        {isMyTx && (
                          <span className="text-[9px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-1 rounded-sm">
                            SİZ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="font-bold text-white">{tx.sellAmount.toLocaleString()}</span>
                        <span className={sellMeta.color}>{sellMeta.nameTr.split('/')[0].trim()}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="font-bold text-white">+{tx.buyAmount.toLocaleString()}</span>
                        <span className={buyMeta.color}>{buyMeta.nameTr.split('/')[0].trim()}</span>
                      </div>

                      <div className="text-[10px] text-slate-500">
                        Kur: {tx.effectiveRate} (Komisyon: {tx.feePaid} Kredi)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1b3a4b] bg-[#091522] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Kısayol: <strong className="text-cyan-300">F6</strong> ile açıp kapatabilirsiniz.</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
