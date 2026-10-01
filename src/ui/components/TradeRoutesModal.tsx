import React, { useState } from 'react';
import {
  GameState,
  PlayerTradeState,
  TradePolicy,
  TradeRoute,
} from '../../engine/types';
import { TRADE_POLICY_CONFIGS } from '../../engine/trade';
import { sound } from '../sound';

interface TradeRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  playerId: string;
  onSetTradePolicy: (policy: TradePolicy) => void;
  onProposeCommercialPact: (targetPlayerId: string) => void;
  onBreakCommercialPact: (targetPlayerId: string) => void;
  onDispatchPatrol?: (originPlanetId: string, targetSystemId: string, fighters: number) => void;
  onSelectSystem?: (systemId: string) => void;
}

export const TradeRoutesModal: React.FC<TradeRoutesModalProps> = ({
  isOpen,
  onClose,
  state,
  playerId,
  onSetTradePolicy,
  onProposeCommercialPact,
  onBreakCommercialPact,
  onDispatchPatrol,
  onSelectSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'systems' | 'policies'>('routes');
  const [patrolModalRoute, setPatrolModalRoute] = useState<TradeRoute | null>(null);

  if (!isOpen) return null;

  const player = state.players[playerId];
  const tradeState: PlayerTradeState = state.tradeStates?.[playerId] || {
    playerId,
    policy: player?.tradePolicy || 'energy_wealth',
    routes: [],
    totalGeneratedTV: 0,
    totalCollectedTV: 0,
    totalLostTV: 0,
    commercialPacts: player?.commercialPacts || [],
    lastUpdateMs: state.timeMs,
  };

  const systemsTrade = state.systemTrade || {};
  const currentPolicyConfig = TRADE_POLICY_CONFIGS[tradeState.policy] || TRADE_POLICY_CONFIGS.energy_wealth;
  const lossPercent = tradeState.totalGeneratedTV > 0
    ? Math.round((tradeState.totalLostTV / tradeState.totalGeneratedTV) * 100)
    : 0;

  // Available pact candidates: other non-bot players or friendly bots
  const pactCandidates = Object.values(state.players).filter(
    (p) => p.id !== playerId && !p.vacationMode && !tradeState.commercialPacts.includes(p.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col stellaris-outliner bg-[#060c17]/95 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              💰
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-wider gold-gradient-text uppercase font-orbitron">
                Galaktik Ticaret Ağları & Hiperuzay Hatları
              </h2>
              <p className="text-xs text-slate-400">
                Koloni Ticaret Değeri, Başkent Akış Rotaları, Korsanlık Baskısı & Gelir Politikaları (Faz 20)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Global Trade Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-900/50 border-b border-cyan-500/20 text-xs">
          <div className="stellaris-item-card p-2.5 rounded-lg border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-slate-400">Toplam Üretilen Ticaret</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-amber-300 font-mono">
                {tradeState.totalGeneratedTV}
              </span>
              <span className="text-[10px] text-amber-400/80">TV/saat</span>
            </div>
          </div>

          <div className="stellaris-item-card p-2.5 rounded-lg border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-slate-400">Başkente Ulaşan Net Akış</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {tradeState.totalCollectedTV}
              </span>
              <span className="text-[10px] text-emerald-400/80">TV/saat</span>
            </div>
          </div>

          <div className={`stellaris-item-card p-2.5 rounded-lg border flex flex-col justify-between ${
            tradeState.totalLostTV > 0
              ? 'border-red-500/40 bg-red-950/20'
              : 'border-cyan-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Korsan Sömürüsü</span>
              {tradeState.totalLostTV > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  TEHLİKE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-red-400 font-mono">
                {tradeState.totalLostTV}
              </span>
              <span className="text-[10px] text-red-400/80">TV/saat (-%{lossPercent})</span>
            </div>
          </div>

          <div className="stellaris-item-card p-2.5 rounded-lg border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-slate-400">Aktif Gelir Politikası</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base">{currentPolicyConfig.icon}</span>
              <span className="font-semibold text-cyan-300 truncate">
                {currentPolicyConfig.nameTr}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 px-6 bg-slate-950/40">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('routes');
            }}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'routes'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🗺️</span> Hiperuzay Ticaret Hatları ({tradeState.routes.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('systems');
            }}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'systems'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛡️</span> Sistem Koruma & Korsanlık ({Object.keys(state.map.systems).length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('policies');
            }}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'policies'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚖️</span> Ticaret Politikaları & Paktlar
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: TRADE ROUTES */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Kolonilerinizin ürettiği Ticaret Değeri, hiperuzay rotaları boyunca Başkente güvenle taşınmalıdır.
                </span>
                <span className="text-cyan-400">
                  {tradeState.routes.length} Aktif Ticaret Koridoru
                </span>
              </div>

              {tradeState.routes.length === 0 ? (
                <div className="stellaris-item-card p-8 text-center rounded-xl border border-cyan-500/20 text-slate-400">
                  <span className="text-3xl block mb-2">🪐</span>
                  Henüz kurulmuş bir koloni bulunmuyor. Yeni dünyalar kolonileştirildiğinde otomatik ticaret hatları kurulacaktır.
                </div>
              ) : (
                tradeState.routes.map((route) => {
                  const isCapital = route.originPlanetId === route.destinationPlanetId;
                  const routeLossPercent = route.tradeValue > 0
                    ? Math.round((route.piracyLoss / route.tradeValue) * 100)
                    : 0;

                  return (
                    <div
                      key={route.originPlanetId}
                      className={`stellaris-item-card p-4 rounded-xl border transition-all ${
                        route.piracyLoss > 0
                          ? 'border-red-500/40 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                          : 'border-cyan-500/30 hover:border-cyan-400/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 rounded-lg bg-slate-800/60 border border-cyan-500/20">
                            {isCapital ? '🏛️' : '🚀'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-200">
                                {route.originPlanetName}
                              </h3>
                              <span className="text-slate-500">➔</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                {route.destinationPlanetName} (Başkent)
                              </span>
                              {isCapital && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Yerel Tüketim
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              {route.pathSystemIds.length} Atlama | Hat: {route.pathSystemIds.map(sysId => state.map.systems[sysId]?.name || sysId).join(' ➔ ')}
                            </p>
                          </div>
                        </div>

                        {/* Route Values */}
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Üretilen</span>
                            <span className="text-sm font-bold text-amber-300 font-mono">
                              +{route.tradeValue} TV
                            </span>
                          </div>

                          {!isCapital && (
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Korsan Kaybı</span>
                              <span className={`text-sm font-bold font-mono ${route.piracyLoss > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                -{route.piracyLoss} TV ({routeLossPercent}%)
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Net Teslimat</span>
                            <span className="text-base font-bold text-emerald-400 font-mono">
                              {route.collectedValue} TV
                            </span>
                          </div>

                          {!isCapital && route.piracyLoss > 0 && onDispatchPatrol && (
                            <button
                              onClick={() => {
                                sound.playClick();
                                setPatrolModalRoute(route);
                              }}
                              className="stellaris-btn-metallic px-3 py-1.5 text-xs text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/20 rounded-lg flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                            >
                              <span>🛡️</span> Devriye Gönder
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Route Path Inspection Pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
                        <span className="text-[11px] text-slate-400">Güzergah Koruma Durumu:</span>
                        {route.pathSystemIds.map((sysId, index) => {
                          const sys = state.map.systems[sysId];
                          const sysInfo = systemsTrade[sysId];
                          const piracy = sysInfo ? Math.round(sysInfo.piracyRisk) : 0;
                          const protection = sysInfo ? sysInfo.tradeProtection : 0;
                          const isHighRisk = piracy > 30;

                          return (
                            <div
                              key={sysId}
                              onClick={() => onSelectSystem && onSelectSystem(sysId)}
                              className={`cursor-pointer px-2.5 py-1 rounded text-xs border flex items-center gap-1.5 transition-all hover:scale-105 ${
                                isHighRisk
                                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                                  : 'bg-slate-800/50 border-cyan-500/30 text-slate-300'
                              }`}
                              title={`${sys?.name}: Koruma ${protection}, Korsanlık ${piracy}%`}
                            >
                              <span>{index === 0 ? '🛫' : index === route.pathSystemIds.length - 1 ? '🛬' : '🛰️'}</span>
                              <span className="font-semibold">{sys?.name || sysId}</span>
                              <span className={`text-[10px] font-mono px-1 rounded ${
                                piracy > 50 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                              }`}>
                                %{piracy}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM PROTECTION & PIRACY */}
          {activeTab === 'systems' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 px-1">
                Yıldız Üsleri (Starbase) koruma yayarak korsanlık birikmesini engeller. Korumasız geçen yüksek ticaret hatları korsan çetelerinin üremesine yol açar.
              </div>

              <div className="overflow-x-auto rounded-xl border border-cyan-500/30 bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-cyan-500/30 font-orbitron uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Yıldız Sistemi</th>
                      <th className="py-3 px-4">Geçen TV</th>
                      <th className="py-3 px-4">Üs Koruması</th>
                      <th className="py-3 px-4">Filo Devriyesi</th>
                      <th className="py-3 px-4">Korsanlık Riski</th>
                      <th className="py-3 px-4">Sömürülen TV</th>
                      <th className="py-3 px-4 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.values(state.map.systems).map((system) => {
                      const sysInfo = systemsTrade[system.id] || {
                        systemId: system.id,
                        tradeValuePassing: 0,
                        tradeProtection: 0,
                        piracyRisk: 0,
                        piracySuppression: 0,
                        piracySiphonedTV: 0,
                        hasPirateFleetSpawned: false,
                      };

                      const hasStarbase = Boolean(state.starbases?.[system.id]);
                      const starbase = state.starbases?.[system.id];
                      const starbaseOwner = starbase ? state.players[starbase.ownerId] : null;

                      const piracyPercent = Math.round(sysInfo.piracyRisk);
                      const isDanger = piracyPercent >= 60;
                      const isWarning = piracyPercent >= 25 && piracyPercent < 60;

                      return (
                        <tr
                          key={system.id}
                          className="hover:bg-cyan-950/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{system.hasRelay ? '👑' : '🌌'}</span>
                              <div>
                                <span className="font-bold text-slate-200 font-sans block">
                                  {system.name}
                                </span>
                                {hasStarbase && (
                                  <span className="text-[10px] text-cyan-400 font-sans">
                                    {starbase?.tier.toUpperCase()} ({starbaseOwner?.name || 'Bilinmiyor'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-bold text-amber-300">
                            {sysInfo.tradeValuePassing > 0 ? `${sysInfo.tradeValuePassing} TV` : '-'}
                          </td>

                          <td className="py-3 px-4 text-emerald-400">
                            🛡️ {sysInfo.tradeProtection}
                          </td>

                          <td className="py-3 px-4 text-cyan-300">
                            {sysInfo.piracySuppression > 0 ? `🚀 +${sysInfo.piracySuppression}` : '-'}
                          </td>

                          <td className="py-3 px-4 w-44">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isDanger
                                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                      : isWarning
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${piracyPercent}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-bold ${
                                isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                %{piracyPercent}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {sysInfo.piracySiphonedTV > 0 ? (
                              <span className="text-red-400 font-bold">
                                -{sysInfo.piracySiphonedTV} TV
                              </span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {sysInfo.hasPirateFleetSpawned ? (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-bold animate-pulse font-sans">
                                💀 İSYAN ÇIKTI
                              </span>
                            ) : isDanger ? (
                              <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 text-[10px] font-sans">
                                Yüksek Tehdit
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-sans">
                                İzleniyor
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans">
                                Güvenli
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TRADE POLICIES & COMMERCIAL PACTS */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              
              {/* Policies Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase font-orbitron tracking-wider mb-2">
                  Ticaret Dönüşüm Politikası
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Başkente güvenle ulaşan toplam Ticaret Değerinin (TV) imparatorluk ekonomisine nasıl kazandırılacağını belirler.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(TRADE_POLICY_CONFIGS) as TradePolicy[]).map((policyKey) => {
                    const cfg = TRADE_POLICY_CONFIGS[policyKey];
                    const isCurrent = tradeState.policy === policyKey;

                    return (
                      <div
                        key={policyKey}
                        className={`stellaris-item-card p-5 rounded-xl border flex flex-col justify-between transition-all ${
                          isCurrent
                            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                            : 'border-cyan-500/20 hover:border-cyan-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl p-2 rounded-lg bg-slate-800/60 border border-cyan-500/20">
                              {cfg.icon}
                            </span>
                            {isCurrent && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                                Yürürlükte
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-100 mb-1">
                            {cfg.nameTr}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            {cfg.descriptionTr}
                          </p>

                          <div className="space-y-1.5 py-3 border-y border-cyan-500/20 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Yakıt Dönüşümü:</span>
                              <span className="text-amber-300 font-bold">%{cfg.fuelRatio * 100}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Kristal Dönüşümü:</span>
                              <span className="text-cyan-300 font-bold">%{cfg.crystalRatio * 100}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Kültürel Birlik (Unity):</span>
                              <span className="text-purple-300 font-bold">%{cfg.unityRatio * 100}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5">
                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full py-2 rounded-lg text-xs font-bold text-cyan-300/70 bg-cyan-950/60 border border-cyan-500/30 cursor-default"
                            >
                              Aktif Politika
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                sound.playClick();
                                onSetTradePolicy(policyKey);
                              }}
                              className="w-full py-2 rounded-lg text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            >
                              Politikayı Yürürlüğe Koy
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Pacts Section */}
              <div className="pt-4 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase font-orbitron tracking-wider">
                    İkili Ticaret Paktları (Commercial Pacts)
                  </h3>
                  <span className="text-xs text-cyan-400">
                    {tradeState.commercialPacts.length} Aktif Ortaklık (+%{tradeState.commercialPacts.length * 10} TV Bonusu)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Diğer galaktik imparatorluklarla imzalanan paktlar, sınır ötesi ticaret hacmini ve her iki tarafın toplam Ticaret Değerini %10 artırır.
                </p>

                {/* Active Pacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {tradeState.commercialPacts.length === 0 ? (
                    <div className="col-span-2 stellaris-item-card p-4 rounded-xl border border-cyan-500/20 text-center text-xs text-slate-400">
                      Henüz aktif bir ikili ticaret paktınız bulunmuyor.
                    </div>
                  ) : (
                    tradeState.commercialPacts.map((partnerId) => {
                      const partner = state.players[partnerId];
                      return (
                        <div
                          key={partnerId}
                          className="stellaris-item-card p-3 rounded-lg border border-cyan-500/30 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: partner?.color || '#00f3ff' }} />
                            <div>
                              <span className="font-bold text-slate-200 block text-xs">
                                {partner?.name || partnerId}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                +%10 Karşılıklı TV Bonusu
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              sound.playClick();
                              onBreakCommercialPact(partnerId);
                            }}
                            className="px-2.5 py-1 text-[11px] text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 rounded bg-red-950/20 transition-colors"
                          >
                            Paktı Feshet
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Available Candidates to Propose */}
                {pactCandidates.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase mb-2">
                      Pakt Teklif Edilebilecek İmparatorluklar
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {pactCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="p-3 rounded-lg border border-slate-700 bg-slate-900/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: candidate.color }} />
                            <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                              {candidate.name}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              sound.playClick();
                              onProposeCommercialPact(candidate.id);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 rounded transition-colors"
                          >
                            Pakt İmzala
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-cyan-500/20 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>💡 <b>İpucu:</b> Korsanlığa maruz kalan rotalara avcı filosu sevk ederek baskıyı bastırın.</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="stellaris-btn-metallic px-5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-600 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* QUICK PATROL DISPATCH SUB-MODAL */}
      {patrolModalRoute && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-5 rounded-xl stellaris-outliner bg-[#091322] border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-slate-100">
            <h3 className="text-base font-bold text-cyan-300 uppercase font-orbitron mb-2">
              🛡️ Devriye Filosu Sevk Et
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              <b>{patrolModalRoute.originPlanetName}</b> ile <b>{patrolModalRoute.destinationPlanetName}</b> arasındaki hatta korsanlık baskısını bastırmak için avcı filosu devriyeye çıkarın.
            </p>

            <div className="space-y-3 mb-5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/20 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hedef Güzergah:</span>
                  <span className="text-cyan-300 font-semibold truncate max-w-[200px]">
                    {patrolModalRoute.pathSystemIds.map(s => state.map.systems[s]?.name || s).join(' ➔ ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Korsan Kaybı:</span>
                  <span className="text-red-400 font-bold">-{patrolModalRoute.piracyLoss} TV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Önerilen Filo:</span>
                  <span className="text-emerald-400 font-bold">3 Avcı (Fighter)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setPatrolModalRoute(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  sound.playLaunch();
                  if (onDispatchPatrol) {
                    // Pick the highest risk system along route path as target
                    const worstSysId = patrolModalRoute.pathSystemIds.reduce((prev, curr) => {
                      const prevRisk = systemsTrade[prev]?.piracyRisk || 0;
                      const currRisk = systemsTrade[curr]?.piracyRisk || 0;
                      return currRisk > prevRisk ? curr : prev;
                    }, patrolModalRoute.pathSystemIds[0]);

                    onDispatchPatrol(patrolModalRoute.originPlanetId, worstSysId, 3);
                  }
                  setPatrolModalRoute(null);
                }}
                className="px-4 py-2 rounded-lg font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Devriyeyi Başlat (3 Avcı)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
