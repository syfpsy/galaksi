import React, { useState } from 'react';
import {
  Zap,
  Waypoints,
  PlusCircle,
  Sliders,
  Compass,
  X,
  Shield,
  Coins,
  Rocket,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
  Fuel,
  Hammer,
  Clock,
  Radio,
} from 'lucide-react';
import {
  GameState,
  HyperRelay,
  HyperRelayPolicy,
} from '../../engine/types';
import {
  HYPER_RELAY_CONFIG,
  HYPER_RELAY_POLICY_CONFIGS,
  canConstructHyperRelay,
  getActiveHyperRelaySystemIds,
} from '../../engine/hyperRelays';
import { sound } from '../sound';

export interface HyperRelayModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onConstructRelay?: (systemId: string, fundingPlanetId: string) => void;
  onSetPolicy?: (systemId: string, policy: HyperRelayPolicy) => void;
  onDismantleRelay?: (systemId: string) => void;
}

export const HyperRelayModal: React.FC<HyperRelayModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onConstructRelay,
  onSetPolicy,
  onDismantleRelay,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const allRelays = state.hyperRelays || {};
  const myRelays = Object.values(allRelays).filter((r) => r.ownerId === activePlayerId);
  const activeRelayIds = getActiveHyperRelaySystemIds(state, activePlayerId);

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];

  const [activeTab, setActiveTab] = useState<'network' | 'construction' | 'policies' | 'logistics'>('network');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedFundingPlanetId, setSelectedFundingPlanetId] = useState<string>(primaryPlanet?.id || '');
  const [dismantleConfirmSysId, setDismantleConfirmSysId] = useState<string | null>(null);

  // Calculate Transit Corridors (connected lane with active relays at both ends)
  interface TransitCorridor {
    laneId: string;
    fromSystemId: string;
    fromSystemName: string;
    toSystemId: string;
    toSystemName: string;
    policyA: HyperRelayPolicy;
    policyB: HyperRelayPolicy;
  }

  const corridors: TransitCorridor[] = [];
  const processedLanes = new Set<string>();

  for (const lane of state.map.lanes) {
    const k1 = `${lane.fromSystemId}_${lane.toSystemId}`;
    const k2 = `${lane.toSystemId}_${lane.fromSystemId}`;
    if (processedLanes.has(k1) || processedLanes.has(k2)) continue;
    processedLanes.add(k1);

    if (activeRelayIds.has(lane.fromSystemId) && activeRelayIds.has(lane.toSystemId)) {
      corridors.push({
        laneId: k1,
        fromSystemId: lane.fromSystemId,
        fromSystemName: state.map.systems[lane.fromSystemId]?.name || lane.fromSystemId,
        toSystemId: lane.toSystemId,
        toSystemName: state.map.systems[lane.toSystemId]?.name || lane.toSystemId,
        policyA: allRelays[lane.fromSystemId]?.policy || 'military_priority',
        policyB: allRelays[lane.toSystemId]?.policy || 'military_priority',
      });
    }
  }

  // Eligible candidate systems for construction
  const ownedSystemIds = new Set<string>();
  for (const p of playerPlanets) ownedSystemIds.add(p.systemId);
  if (state.starbases) {
    for (const [sId, sb] of Object.entries(state.starbases)) {
      if (sb.ownerId === activePlayerId) ownedSystemIds.add(sId);
    }
  }

  const candidateSystems = Array.from(ownedSystemIds)
    .filter((sId) => !allRelays[sId])
    .map((sId) => state.map.systems[sId])
    .filter(Boolean);

  const fundingPlanet = state.planets[selectedFundingPlanetId] || primaryPlanet;
  const cost = HYPER_RELAY_CONFIG.CONSTRUCTION_COST;
  const canAfford =
    fundingPlanet &&
    fundingPlanet.resources.ore >= cost.ore &&
    fundingPlanet.resources.crystal >= cost.crystal &&
    fundingPlanet.resources.fuel >= cost.fuel;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div className="stellaris-outliner bg-slate-950/95 border border-cyan-500/40 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-cyan-950/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide text-cyan-100 uppercase font-mono">
                  Hiper-Röle Transit Otoyolları & Altuzay Lojistiği
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  FAZ 28
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Yüksek hızlı intikal koridorları (3.0x Hız, -%50 Yakıt), korsanlık bağışıklığı ve sektör doktrinleri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Metrics */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/40 shadow-inner">
              <Waypoints className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider">
                  Aktif Hatlar
                </span>
                <span className="text-sm font-bold text-cyan-200 font-mono">
                  {corridors.length} <span className="text-[10px] text-slate-400 font-normal">Koridor</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50">
              <Zap className="w-4 h-4 text-sky-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Röle Sayısı
                </span>
                <span className="text-sm font-bold text-sky-300 font-mono">
                  {myRelays.filter((r) => !r.isConstructing).length} / {myRelays.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('network');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'network'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waypoints className="w-4 h-4" />
            Ağ Durumu & Hatlar ({corridors.length})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('construction');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'construction'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            İnşa & Genişleme
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('policies');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'policies'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Transit Politikaları & Doktrinler
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('logistics');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'logistics'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Ağ Geçidi & Altuzay Lojistiği
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AĞ DURUMU & HATLAR */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stellaris-item-card bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>İntikal Hız Artışı</span>
                    <Rocket className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-cyan-300">3.0x</span>
                    <span className="text-xs text-slate-400 ml-1.5">(Süre -%66.7)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Bağlantılı iki sistemde de röle bulunduğunda filolar sub-ışık hız sınırını aşar.
                  </p>
                </div>

                <div className="stellaris-item-card bg-slate-900/60 border border-emerald-500/30 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Yakıt Tasarrufu</span>
                    <Fuel className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-emerald-300">-%50</span>
                    <span className="text-xs text-slate-400 ml-1.5">Tüketim</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Röle koridorlarındaki altuzay yerçekim kanalı itki yakıt maliyetini yarıya indirir.
                  </p>
                </div>

                <div className="stellaris-item-card bg-slate-900/60 border border-amber-500/30 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Korsanlık Bağışıklığı</span>
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-amber-300">+100</span>
                    <span className="text-xs text-slate-400 ml-1.5">Koruma</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Sürekli devriye fenerleri korsan birikimini sıfırlayarak ticaret değerini korur.
                  </p>
                </div>

                <div className="stellaris-item-card bg-slate-900/60 border border-purple-500/30 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Koloni İstikrarı</span>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-purple-300">+5</span>
                    <span className="text-xs text-slate-400 ml-1.5">İstikrar</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Ağa bağlı sistemlerdeki koloniler başkente doğrudan entegre olarak istikrar kazanır.
                  </p>
                </div>
              </div>

              {/* Active Corridors */}
              <div className="stellaris-item-card bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Waypoints className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold font-mono text-cyan-200 uppercase tracking-wider">
                      Aktif Hiper-Röle Transit Hatları ({corridors.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Her iki ucunda aktif röle bulunan hiper-hatlar transit otoyolu sayılır
                  </span>
                </div>

                {corridors.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                    Henüz aktif bir transit hattı bulunmuyor. İki komşu yıldız sistemine Hiper-Röle inşa ederek ilk otoyolunuzu oluşturun!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {corridors.map((c) => (
                      <div
                        key={c.laneId}
                        className="p-3 rounded-lg bg-slate-950/70 border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{c.fromSystemName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-bold text-white text-xs">{c.toSystemName}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                              <span className="text-cyan-300 font-bold">3.0x Hız</span>
                              <span>•</span>
                              <span className="text-emerald-300">-%50 Yakıt</span>
                              <span>•</span>
                              <span className="text-amber-300">+100 Tic. Koruma</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono uppercase">
                          Aktif Otoyol
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Owned Relays List */}
              <div className="stellaris-item-card bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-sky-400" />
                    <h3 className="text-sm font-bold font-mono text-sky-200 uppercase tracking-wider">
                      İmparatorluk Hiper-Röle İstasyonları ({myRelays.length})
                    </h3>
                  </div>
                </div>

                {myRelays.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                    Henüz inşa edilmiş bir Hiper-Röle yok. "İnşa & Genişleme" sekmesinden yeni bir istasyon başlatabilirsiniz.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myRelays.map((relay) => {
                      const sys = state.map.systems[relay.systemId];
                      const policyCfg = HYPER_RELAY_POLICY_CONFIGS[relay.policy];
                      const isDismantlePrompt = dismantleConfirmSysId === relay.systemId;

                      return (
                        <div
                          key={relay.id}
                          className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded flex items-center justify-center border ${
                                relay.isConstructing
                                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                                  : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                              }`}
                            >
                              {relay.isConstructing ? (
                                <Hammer className="w-4 h-4 animate-bounce" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{sys?.name || relay.systemId}</span>
                                {relay.isConstructing ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono">
                                    İnşa Halinde ({Math.max(0, Math.ceil((relay.constructionFinishTimeMs - state.timeMs) / 1000))}s)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono">
                                    Çevrimiçi
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>Doktrin: <strong className="text-cyan-200">{policyCfg?.nameTr || relay.policy}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isDismantlePrompt ? (
                              <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/60 p-1 rounded">
                                <span className="text-[10px] text-rose-300 font-mono px-1">Sökülsün mü?</span>
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    if (onDismantleRelay) onDismantleRelay(relay.systemId);
                                    setDismantleConfirmSysId(null);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                                >
                                  Evet (%40 İade)
                                </button>
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    setDismantleConfirmSysId(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setDismantleConfirmSysId(relay.systemId);
                                }}
                                title="İstasyonu sök ve kaynakların %40'ını geri al"
                                className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: İNŞA & GENİŞLEME */}
          {activeTab === 'construction' && (
            <div className="space-y-6">
              <div className="stellaris-item-card bg-slate-900/60 border border-cyan-500/30 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono uppercase">
                      Yeni Hiper-Röle İstasyonu Siparişi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Koloniniz veya yıldız üssünüz bulunan sistemlerde mega-yapı orbital transit rölesi inşa edin
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Target System Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-cyan-300 uppercase tracking-wider block">
                      1. Hedef Yıldız Sistemi Seçin:
                    </label>
                    {candidateSystems.length === 0 ? (
                      <div className="p-4 rounded bg-slate-950/80 border border-slate-800 text-slate-400 text-xs">
                        Hiper-Rölesi bulunmayan uygun koloniniz veya yıldız üssünüz kalmadı.
                      </div>
                    ) : (
                      <select
                        value={selectedSystemId}
                        onChange={(e) => setSelectedSystemId(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">-- Yıldız Sistemi Seçin --</option>
                        {candidateSystems.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.slots.length} Yuva)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Funding Planet Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-cyan-300 uppercase tracking-wider block">
                      2. Finansman Kolonisi Seçin:
                    </label>
                    <select
                      value={selectedFundingPlanetId}
                      onChange={(e) => setSelectedFundingPlanetId(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    >
                      {playerPlanets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Cevher: {Math.floor(p.resources.ore)}, Kristal: {Math.floor(p.resources.crystal)}, Yakıt: {Math.floor(p.resources.fuel)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Gereken Hammadde:</span>
                    <span className={fundingPlanet && fundingPlanet.resources.ore >= cost.ore ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                      {cost.ore} Cevher
                    </span>
                    <span className={fundingPlanet && fundingPlanet.resources.crystal >= cost.crystal ? 'text-cyan-300 font-bold' : 'text-rose-400 font-bold'}>
                      {cost.crystal} Kristal
                    </span>
                    <span className={fundingPlanet && fundingPlanet.resources.fuel >= cost.fuel ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                      {cost.fuel} Yakıt
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 30 Saniye
                    </span>
                  </div>

                  <button
                    disabled={!selectedSystemId || !canAfford}
                    onClick={() => {
                      if (!selectedSystemId || !fundingPlanet) return;
                      const check = canConstructHyperRelay(state, activePlayerId, selectedSystemId, fundingPlanet.id);
                      if (!check.success) {
                        sound.playError();
                        return;
                      }
                      sound.playTech();
                      if (onConstructRelay) {
                        onConstructRelay(selectedSystemId, fundingPlanet.id);
                      }
                      setSelectedSystemId('');
                    }}
                    className={`px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      selectedSystemId && canAfford
                        ? 'stellaris-btn-metallic bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-lg shadow-cyan-900/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    İnşaat Emri Ver
                  </button>
                </div>
              </div>

              {/* Ongoing Construction Timers */}
              <div className="stellaris-item-card bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold font-mono text-amber-200 uppercase tracking-wider">
                    Devam Eden Hiper-Röle Montajları
                  </h3>
                </div>

                {myRelays.filter((r) => r.isConstructing).length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                    Şu anda inşa halinde bir röle yok.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRelays
                      .filter((r) => r.isConstructing)
                      .map((relay) => {
                        const totalMs = relay.constructionFinishTimeMs - relay.constructionStartTimeMs;
                        const elapsedMs = Math.max(0, state.timeMs - relay.constructionStartTimeMs);
                        const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
                        const remainingSec = Math.max(0, Math.ceil((relay.constructionFinishTimeMs - state.timeMs) / 1000));
                        const sys = state.map.systems[relay.systemId];

                        return (
                          <div key={relay.id} className="p-3 rounded-lg bg-slate-950/70 border border-amber-500/30">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-white">{sys?.name || relay.systemId} Hiper-Rölesi</span>
                              <span className="font-mono text-amber-300 font-bold">{remainingSec}s Kaldı ({progress}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSİT POLİTİKALARI & DOKTRİNLER */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="stellaris-item-card bg-slate-900/60 border border-cyan-500/30 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono uppercase">
                      Galaktik Transit Politikaları & Otoyol Doktrinleri
                    </h3>
                    <p className="text-xs text-slate-400">
                      Röle ağınızın taşıdığı sinyalleri imparatorluğunuzun stratejik önceliklerine göre modüle edin
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(HYPER_RELAY_POLICY_CONFIGS).map((cfg) => {
                  return (
                    <div
                      key={cfg.policy}
                      className="stellaris-item-card bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                            {cfg.policy === 'military_priority' && <Crosshair className="w-4 h-4 text-rose-400" />}
                            {cfg.policy === 'commercial_freight' && <Coins className="w-4 h-4 text-amber-400" />}
                            {cfg.policy === 'rapid_civilian' && <Rocket className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs">{cfg.nameTr}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{cfg.nameEn}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          {cfg.descriptionTr}
                        </p>

                        <div className="space-y-1.5 text-[11px] font-mono border-t border-slate-800 pt-3">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Filo Hızı:</span>
                            <span className="text-cyan-300 font-bold">
                              {cfg.fleetSpeedMultiplier > 1 ? `+${Math.round((cfg.fleetSpeedMultiplier - 1) * 100)}%` : 'Standart'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Ticaret Değeri:</span>
                            <span className="text-amber-300 font-bold">
                              {cfg.tradeValueMultiplier > 1 ? `+${Math.round((cfg.tradeValueMultiplier - 1) * 100)}%` : 'Standart'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Üretim Verimi:</span>
                            <span className="text-emerald-300 font-bold">
                              {cfg.productionMultiplier > 1 ? `+${Math.round((cfg.productionMultiplier - 1) * 100)}%` : 'Standart'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          // Set across all owned relays
                          for (const r of myRelays) {
                            if (onSetPolicy) onSetPolicy(r.systemId, cfg.policy);
                          }
                        }}
                        className="mt-5 w-full py-2 rounded bg-cyan-950 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 text-xs font-mono font-bold uppercase transition-all"
                      >
                        Tüm Rölelere Uygula
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Per-Relay Policy Customization */}
              <div className="stellaris-item-card bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <h4 className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider mb-3">
                  Bölgesel Röle Doktrin Ataması
                </h4>
                {myRelays.length === 0 ? (
                  <p className="text-xs text-slate-500">Mevcut röleniz bulunmuyor.</p>
                ) : (
                  <div className="space-y-2">
                    {myRelays.map((r) => {
                      const sys = state.map.systems[r.systemId];
                      return (
                        <div
                          key={r.id}
                          className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                        >
                          <span className="font-bold text-white text-xs">{sys?.name || r.systemId}</span>

                          <div className="flex items-center gap-1.5">
                            {(['military_priority', 'commercial_freight', 'rapid_civilian'] as HyperRelayPolicy[]).map(
                              (pol) => {
                                const isSelected = r.policy === pol;
                                return (
                                  <button
                                    key={pol}
                                    onClick={() => {
                                      sound.playClick();
                                      if (onSetPolicy) onSetPolicy(r.systemId, pol);
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                                      isSelected
                                        ? 'bg-cyan-600 text-white font-bold border border-cyan-400'
                                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                  >
                                    {pol === 'military_priority' ? 'Askeri' : pol === 'commercial_freight' ? 'Ticari' : 'Sivil'}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AĞ GEÇİDİ & ALTUYUZ LOJİSTİĞİ */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div className="stellaris-item-card bg-slate-900/60 border border-cyan-500/30 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono uppercase">
                      Galaktik Altuzay Lojistik Sinerjisi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Hiper-Röle Transit Hatları ve Altuzay Ağ Geçitlerinin (Subspace Gateways) entegre lojistik matriksi
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-lg bg-slate-950/70 border border-cyan-500/30">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-2">
                      <Zap className="w-4 h-4" /> Hiper-Röleler (Yerel Otoyollar)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sektör içi komşu yıldız sistemlerini birbirine bağlar. Filolar bu koridorlarda <strong>3.0x hızda</strong> uçar ve yakıt tüketimi %50 azalır. Sektörel ticaret hatlarını korsanlıktan tamamen korur.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/70 border border-purple-500/30">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-2">
                      <Waypoints className="w-4 h-4" /> Altuzay Ağ Geçitleri (Galaktik Solucan Delikleri)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Galaksinin uzak uçları arasındaki sistemleri <strong>anında (15 saniyede)</strong> birbirine bağlar. Ağ geçitleri arasındaki ticaret ve filo intikali mesafeden bağımsız tek atlamayla gerçekleşir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Combined Strategic Logistics View */}
              <div className="stellaris-item-card bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                <h4 className="text-xs font-bold font-mono text-cyan-200 uppercase tracking-wider mb-3">
                  Sektörel Lojistik Matrisi
                </h4>
                <div className="space-y-2">
                  {playerPlanets.map((planet) => {
                    const hasRelay = allRelays[planet.systemId] && !allRelays[planet.systemId].isConstructing;
                    const hasGateway = state.gateways && state.gateways[planet.systemId]?.status === 'active';
                    const sys = state.map.systems[planet.systemId];

                    return (
                      <div
                        key={planet.id}
                        className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{planet.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sys?.name || planet.systemId})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Depo: {Math.floor(planet.resources.ore)} Cevher · {Math.floor(planet.resources.crystal)} Kristal · {Math.floor(planet.resources.fuel)} Yakıt
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-mono border ${
                              hasRelay
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            {hasRelay ? '⚡ Röle Aktif' : 'Röle Yok'}
                          </span>

                          <span
                            className={`px-2 py-1 rounded text-[10px] font-mono border ${
                              hasGateway
                                ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            {hasGateway ? '🌀 Ağ Geçidi Aktif' : 'Ağ Geçidi Yok'}
                          </span>
                        </div>
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
