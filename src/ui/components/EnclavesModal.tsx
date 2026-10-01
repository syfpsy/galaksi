import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Palette,
  Coins,
  Eye,
  Dices,
  Clock,
  Compass,
  X,
  Zap,
  Gift,
} from 'lucide-react';
import {
  GameState,
  EnclaveServiceId,
  EnclaveType,
} from '../../engine/types';
import {
  ENCLAVE_CONFIGS,
  ENCLAVE_SERVICES,
  canInteractWithEnclave,
} from '../../engine/enclaves';
import { sound } from '../sound';

export interface EnclavesModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onInteractEnclave?: (enclaveId: string, serviceId: EnclaveServiceId) => void;
  onBuyCaravanReliquary?: (caravanId: string) => void;
  onGambleCaravanSlots?: (caravanId: string, betAmount: number) => void;
}

type TabType = 'curator' | 'artisan' | 'trader' | 'shroud_caravan';

export const EnclavesModal: React.FC<EnclavesModalProps> = ({
  state,
  activePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onInteractEnclave,
  onBuyCaravanReliquary,
  onGambleCaravanSlots,
}) => {
  const pId = activePlayerId || playerId || Object.keys(state.players)[0];
  const player = state.players[pId];
  const [activeTab, setActiveTab] = useState<TabType>('curator');
  const [slotBet, setSlotBet] = useState<number>(100);

  if (!isOpen || !player) return null;

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === pId);
  const totalOre = playerPlanets.reduce((sum, p) => sum + p.resources.ore, 0);
  const totalCrystal = playerPlanets.reduce((sum, p) => sum + p.resources.crystal, 0);
  const totalFuel = playerPlanets.reduce((sum, p) => sum + p.resources.fuel, 0);

  const activeContracts = player.activeEnclaveContracts || [];
  const shroudBoon = player.shroudBoon;

  const enclaves = Object.values(state.enclaves || {});
  const caravaneers = state.caravaneers || [];

  const tabTypeMap: Record<TabType, EnclaveType> = {
    curator: 'curator_order',
    artisan: 'artisan_troupe',
    trader: 'trader_enclave',
    shroud_caravan: 'shroud_coven',
  };

  const currentEnclave = enclaves.find((e) => e.type === tabTypeMap[activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl shadow-cyan-950/50 overflow-hidden stellaris-outliner">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-cyan-100 uppercase">
                  Galaktik Enklavlar, Tüccarlar & Örtü Meclisi
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                  FAZ 31
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kadim araştırma loncaları, sanat toplulukları, hammadde tekelleri ve psionik örtü varlıkları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Resources Brief */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs">
              <span className="text-amber-300 font-mono">⛏️ {Math.floor(totalOre).toLocaleString()}</span>
              <span className="text-cyan-300 font-mono">💎 {Math.floor(totalCrystal).toLocaleString()}</span>
              <span className="text-purple-300 font-mono">⚡ {Math.floor(totalFuel).toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-800 bg-slate-900/60 text-sm">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('curator');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'curator'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Küratör Düzeni
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('artisan');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'artisan'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            Sanatçılar Topluluğu
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('trader');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'trader'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            Tüccar Enklavı
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('shroud_caravan');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'shroud_caravan'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/50 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4 text-purple-400" />
            Zihinsel Örtü & Karavanlar
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Active Buffs / Contracts Banner */}
          {(activeContracts.length > 0 || shroudBoon) && (
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-cyan-800/50 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Aktif Kontratlar & Lütuflar:
              </span>

              {activeContracts.map((c) => {
                const sDef = ENCLAVE_SERVICES[c.serviceId];
                const timeLeftSec = Math.max(0, Math.floor((c.expiresAtMs - state.timeMs) / 1000));
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-700/60 text-xs text-cyan-100"
                  >
                    <span>📜 {sDef?.nameTr || c.serviceId}</span>
                    <span className="text-cyan-400 font-mono">({timeLeftSec}s)</span>
                  </div>
                );
              })}

              {shroudBoon && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-purple-950/70 border border-purple-500/60 text-xs text-purple-200 animate-pulse">
                  <span>🔮 Örtü: {shroudBoon.descriptionTr}</span>
                  <span className="text-purple-400 font-mono">
                    ({Math.max(0, Math.floor((shroudBoon.expiresAtMs - state.timeMs) / 1000))}s)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Standard Enclave Views (Curators, Artisans, Traders) */}
          {(activeTab === 'curator' || activeTab === 'artisan' || activeTab === 'trader') && currentEnclave && (
            <div className="space-y-6">
              {/* Enclave Overview Card */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700/80 stellaris-item-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold uppercase bg-slate-800 text-slate-300">
                      Sistem: {state.map.systems[currentEnclave.systemId]?.name || currentEnclave.systemId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-800">
                      İtibar Derecesi: +{currentEnclave.opinion[pId] || 0}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{currentEnclave.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {ENCLAVE_CONFIGS[currentEnclave.type]?.descriptionTr}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">İstasyon Durumu</div>
                    <div className="text-sm font-semibold text-cyan-300">Operasyonel</div>
                  </div>
                </div>
              </div>

              {/* Enclave Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(ENCLAVE_SERVICES)
                  .filter((s) => s.enclaveType === currentEnclave.type)
                  .map((sDef) => {
                    const canBuy = canInteractWithEnclave(state, pId, currentEnclave.id, sDef.serviceId);
                    const isAlreadyActive = activeContracts.some((c) => c.serviceId === sDef.serviceId);

                    return (
                      <div
                        key={sDef.serviceId}
                        className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4 stellaris-item-card"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-cyan-200">{sDef.nameTr}</h4>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {Math.round(sDef.durationMs / 1000)}s
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                            {sDef.descriptionTr}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          {/* Cost Display */}
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                            <span className="text-slate-400">Maliyet:</span>
                            {sDef.cost.ore > 0 && <span className="text-amber-300 font-medium">⛏️ {sDef.cost.ore}</span>}
                            {sDef.cost.crystal > 0 && (
                              <span className="text-cyan-300 font-medium">💎 {sDef.cost.crystal}</span>
                            )}
                            {sDef.cost.fuel > 0 && <span className="text-purple-300 font-medium">⚡ {sDef.cost.fuel}</span>}
                          </div>

                          {/* Action Button */}
                          <button
                            disabled={!canBuy.ok}
                            onClick={() => {
                              sound.playTech();
                              onInteractEnclave?.(currentEnclave.id, sDef.serviceId);
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                              isAlreadyActive
                                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-600/50 cursor-default'
                                : canBuy.ok
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/40 stellaris-btn-metallic'
                                : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                            }`}
                          >
                            {isAlreadyActive ? (
                              <>
                                <Clock className="w-3.5 h-3.5" /> Sözleşme Yürürlükte
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" /> Hizmeti Satın Al
                              </>
                            )}
                          </button>

                          {!canBuy.ok && !isAlreadyActive && (
                            <div className="text-[11px] text-amber-400/80 text-center font-mono">
                              {canBuy.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Shroud Coven & Caravaneers View */}
          {activeTab === 'shroud_caravan' && (
            <div className="space-y-8">
              {/* Shroud Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300">
                    <Eye className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-purple-100 uppercase tracking-wide">
                      Zihinsel Örtü Meclisi (The Shroud Coven)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Zihinsel frekansları aşarak boyutsal varlıklarla psionik paktlar ve lütuflar kurun
                    </p>
                  </div>
                </div>

                {/* Shroud Services Grid */}
                {currentEnclave && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(ENCLAVE_SERVICES)
                      .filter((s) => s.enclaveType === 'shroud_coven')
                      .map((sDef) => {
                        const canBuy = canInteractWithEnclave(state, pId, currentEnclave.id, sDef.serviceId);
                        const isBoonActive = !!shroudBoon;

                        return (
                          <div
                            key={sDef.serviceId}
                            className="p-5 rounded-xl bg-purple-950/30 border border-purple-800/40 hover:border-purple-500/60 transition-all flex flex-col justify-between space-y-4 stellaris-item-card"
                          >
                            <div className="space-y-2">
                              <h4 className="font-bold text-sm text-purple-200">{sDef.nameTr}</h4>
                              <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                                {sDef.descriptionTr}
                              </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-purple-900/60">
                              <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
                                <span className="text-slate-400">Gereken Kaynak:</span>
                                {sDef.cost.ore > 0 && <span>⛏️ {sDef.cost.ore}</span>}
                                {sDef.cost.crystal > 0 && <span>💎 {sDef.cost.crystal}</span>}
                                {sDef.cost.fuel > 0 && <span>⚡ {sDef.cost.fuel}</span>}
                              </div>

                              <button
                                disabled={!canBuy.ok}
                                onClick={() => {
                                  sound.playLaser();
                                  onInteractEnclave?.(currentEnclave.id, sDef.serviceId);
                                }}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                                  isBoonActive && sDef.serviceId === 'commune_with_shroud'
                                    ? 'bg-purple-950/60 text-purple-400 border border-purple-700/50 cursor-default'
                                    : canBuy.ok
                                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/50'
                                    : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {sDef.serviceId === 'commune_with_shroud' && isBoonActive
                                  ? 'Örtü Lütfu Aktif'
                                  : 'Örtüye Dokun'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Caravaneers Section */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    <Dices className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-100 uppercase tracking-wide">
                      Göçebe Karavan Filoları & Galaktik Kumarhane
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sistemler arası dolaşan Racket ve Numistic tüccarlarıyla şans kutuları ve kollu kumarhane
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {caravaneers.map((caravan) => {
                    const isRacket = caravan.id.includes('racket');
                    const canAffordReliquary = totalOre >= 500 && totalCrystal >= 250;
                    const canAffordSlots = totalFuel >= slotBet;

                    return (
                      <div
                        key={caravan.id}
                        className="p-5 rounded-xl bg-slate-900/80 border border-amber-800/40 stellaris-item-card space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-amber-200">{caravan.name}</h4>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-700/40">
                                {isRacket ? 'Racket Koalisyonu' : 'Numistik Düzen'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-cyan-400" />
                              Konum: <span className="text-cyan-200 font-semibold">{caravan.currentSystemId}</span>
                              {caravan.targetSystemId && (
                                <span className="text-slate-500">→ {caravan.targetSystemId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Feature: Reliquary or Slots */}
                        {!isRacket ? (
                          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-600/30 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                              <Gift className="w-4 h-4" /> Numistik Gizem Kutusu (Caravan Reliquary)
                            </div>
                            <p className="text-xs text-slate-400">
                              Antik relik sandığı açın. 500 Maden & 250 Kristal karşılığı devasa teknoloji, kaynak veya
                              nadir relik parçası kazanma şansı.
                            </p>
                            <button
                              disabled={!canAffordReliquary}
                              onClick={() => {
                                sound.playLaser();
                                onBuyCaravanReliquary?.(caravan.id);
                              }}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                canAffordReliquary
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/50'
                                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                              }`}
                            >
                              <Gift className="w-3.5 h-3.5" /> Gizem Kutusunu Satın Al (500 Ore / 250 Crystal)
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-600/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                <Dices className="w-4 h-4" /> Racket Kollu Slot Makinesi
                              </div>
                              <div className="flex items-center gap-1">
                                {[50, 100, 200, 500].map((bet) => (
                                  <button
                                    key={bet}
                                    onClick={() => setSlotBet(bet)}
                                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                      slotBet === bet
                                        ? 'bg-emerald-600 text-white font-bold'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {bet}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">
                              Seçilen yakıt bahsiyle makineyi çevirin. Şansınızı deneyin ve x2.0 - x3.0 katı yakıt kazanın!
                            </p>
                            <button
                              disabled={!canAffordSlots}
                              onClick={() => {
                                sound.playClick();
                                onGambleCaravanSlots?.(caravan.id, slotBet);
                              }}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                canAffordSlots
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                              }`}
                            >
                              <Dices className="w-3.5 h-3.5" /> Kollu Makineyi Çevir ({slotBet} Fuel)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
