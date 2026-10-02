import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Award,
  Briefcase,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  Globe,
  Layers,
  LineChart,
  Package,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CommodityFuturesContract,
  CorporateBranchOffice,
  CorporateCivicId,
  CorporateHoldingType,
  GameState,
  Planet,
  ResourceType,
} from '../../engine/types';
import { sound } from '../sound';
import { formatSimClock } from '../timeUtils';
import {
  CORPORATE_CIVIC_CONFIGS,
  CORPORATE_HOLDING_CONFIGS,
  MEGACORP_CONSTANTS,
  canEstablishBranchOffice,
} from '../../engine/megacorp';

interface MegacorpModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  activePlanet?: Planet | undefined;
  isOpen?: boolean;
  onClose: () => void;
  onEstablishBranchOffice?: (targetPlanetId: string) => void;
  onCloseBranchOffice?: (branchId: string) => void;
  onBuildHolding?: (branchId: string, holdingType: CorporateHoldingType) => void;
  onDismantleHolding?: (branchId: string, holdingIndex: number) => void;
  onPurchaseFutures?: (resourceType: ResourceType, amount: number, durationMinutes: number) => void;
  onClaimFutures?: (contractId: string) => void;
  onConvertToMegacorp?: (civics: CorporateCivicId[]) => void;
  onSelectPlanet?: (planetId: string) => void;
}

export const MegacorpModal: React.FC<MegacorpModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  activePlanet,
  isOpen = true,
  onClose,
  onEstablishBranchOffice,
  onCloseBranchOffice,
  onBuildHolding,
  onDismantleHolding,
  onPurchaseFutures,
  onClaimFutures,
  onConvertToMegacorp,
  onSelectPlanet,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (isOpen === false) return null;

  const [activeTab, setActiveTab] = useState<'branches' | 'holdings' | 'futures' | 'charter'>('branches');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedCandidatePlanetId, setSelectedCandidatePlanetId] = useState<string>('');
  const [selectedHoldingType, setSelectedHoldingType] = useState<CorporateHoldingType>('logistics_freight_hub');

  // Futures form states
  const [futuresResourceType, setFuturesResourceType] = useState<ResourceType>('crystal');
  const [futuresAmount, setFuturesAmount] = useState<number>(200);
  const [futuresDuration, setFuturesDuration] = useState<number>(10);

  // Corporate civics selection for conversion
  const [selectedCivics, setSelectedCivics] = useState<CorporateCivicId[]>(['trade_syndicate']);

  const player = state.players[activePlayerId];
  const isMegacorp = !!player?.isMegacorp;

  // Active branch offices owned by this corporation
  const myBranchOffices = useMemo(() => {
    return Object.values(state.branchOffices || {}).filter((b) => b.corporationId === activePlayerId);
  }, [state.branchOffices, activePlayerId]);

  // Branch offices hosted on this player's planets
  const hostedBranches = useMemo(() => {
    return Object.values(state.branchOffices || {}).filter((b) => b.targetPlayerId === activePlayerId);
  }, [state.branchOffices, activePlayerId]);

  // Set default selected branch
  React.useEffect(() => {
    if (!selectedBranchId && myBranchOffices.length > 0) {
      setSelectedBranchId(myBranchOffices[0].id);
    }
  }, [selectedBranchId, myBranchOffices]);

  const activeBranch = useMemo(() => {
    return myBranchOffices.find((b) => b.id === selectedBranchId) || myBranchOffices[0];
  }, [myBranchOffices, selectedBranchId]);

  // Candidate foreign planets for new branches
  const candidatePlanets = useMemo(() => {
    return Object.values(state.planets).filter((p) => {
      const check = canEstablishBranchOffice(state, activePlayerId, p.id);
      return check.allowed;
    });
  }, [state, activePlayerId]);

  React.useEffect(() => {
    if (!selectedCandidatePlanetId && candidatePlanets.length > 0) {
      setSelectedCandidatePlanetId(candidatePlanets[0].id);
    }
  }, [selectedCandidatePlanetId, candidatePlanets]);

  // Commodity futures contracts owned by player
  const myFuturesContracts = useMemo(() => {
    return Object.values(state.commodityFutures || {}).filter((c) => c.buyerId === activePlayerId);
  }, [state.commodityFutures, activePlayerId]);

  // Calculate forward rate for futures
  const spotRate = state.market.rates[futuresResourceType] || 1.0;
  const forwardDiscount = Math.max(0.75, 1.0 - futuresDuration * 0.008);
  const forwardUnitPrice = Number((spotRate * forwardDiscount).toFixed(3));
  const totalFuturesCost = Math.round(futuresAmount * forwardUnitPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col stellaris-modal rounded-sm border border-[#2b4c63] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1b3a4b] bg-gradient-to-r from-[#0d1f2d] via-[#1a384f] to-[#0a1824]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-amber-500/40 to-slate-900 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="stellaris-gold font-display text-base font-bold tracking-wider flex items-center gap-2">
                MEGAKORPORASYON & TİCARİ FRANCHISING
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded-sm font-normal">
                  FAZ 24
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Şube Ofisleri • Kurumsal Holding Binaları • Galaktik Emtia Vadeli İşlemleri & Borsa
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1b3a4b] bg-[#08131d] overflow-x-auto">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('branches');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            ŞUBE OFİSLERİ
            {myBranchOffices.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-amber-950 border border-amber-500/50 text-amber-300">
                {myBranchOffices.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('holdings');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'holdings'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            KURUMSAL BİNALAR & HOLDİNGLER
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('futures');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'futures'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            VADELİ EMTİA BORSASI
            {myFuturesContracts.filter((c) => c.isDelivered && !c.isClaimed).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950 border border-emerald-500/50 text-emerald-300 animate-pulse">
                {myFuturesContracts.filter((c) => c.isDelivered && !c.isClaimed).length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('charter');
            }}
            className={`px-4 py-2 font-display text-xs font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'charter'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            ŞİRKET TÜZÜĞÜ & DOKTRİN
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#050b14]/90 space-y-5">
          {/* TAB 1: ŞUBE OFİSLERİ */}
          {activeTab === 'branches' && (
            <div className="space-y-5">
              {!isMegacorp && (
                <div className="p-4 rounded-sm border border-purple-500/40 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-purple-900/40 border border-purple-400/50 flex items-center justify-center text-purple-300">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-100 text-sm">
                        İMPARATORLUK KURUMSAL ŞİRKET TÜZÜĞÜ İLAN EDEBİLİR
                      </h3>
                      <p className="text-xs text-slate-300">
                        Galaksi çapında şube ofisi açmak için devletinizi Megakorporasyona dönüştürebilirsiniz.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('charter');
                    }}
                    className="px-4 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white font-display text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    ŞİRKET TÜZÜĞÜNÜ DÜZENLE
                  </button>
                </div>
              )}

              {/* Branch Selector Cards */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#1b3a4b] pb-3">
                <span className="text-xs font-display text-slate-400 font-bold uppercase tracking-wider mr-2">
                  Şubelerim ({myBranchOffices.length}):
                </span>
                {myBranchOffices.map((b) => {
                  const targetPlanet = state.planets[b.targetPlanetId];
                  const hostEmpire = state.players[b.targetPlayerId];
                  const isSelected = activeBranch?.id === b.id;

                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedBranchId(b.id);
                      }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-display font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md'
                          : 'bg-[#0d1e2e] border-[#22445e] text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hostEmpire?.color || '#f59e0b' }} />
                      {targetPlanet?.name || 'Koloni'}
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-900/40 px-1 py-0.5 rounded">
                        +{b.tradeValueYield} TV
                      </span>
                    </button>
                  );
                })}

                {myBranchOffices.length === 0 && (
                  <span className="text-xs text-slate-500 italic">Henüz faal bir şube ofisiniz bulunmuyor.</span>
                )}
              </div>

              {/* Active Branch Detail Card */}
              {activeBranch && (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162e42] pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-sm flex items-center justify-center font-display font-bold text-white shadow-inner text-sm"
                        style={{ backgroundColor: state.players[activeBranch.targetPlayerId]?.color || '#f59e0b' }}
                      >
                        {state.planets[activeBranch.targetPlanetId]?.name?.substring(0, 2).toUpperCase() || 'PL'}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-100 text-sm flex items-center gap-2">
                          {state.planets[activeBranch.targetPlanetId]?.name} ŞUBESİ
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
                            Ev Sahibi: {state.players[activeBranch.targetPlayerId]?.name}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Açılış Zamanı: {formatSimClock(activeBranch.establishedAtMs)} • Holding Sayısı: {activeBranch.holdings.length} / 3
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onCloseBranchOffice) {
                          sound.playClick();
                          onCloseBranchOffice(activeBranch.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-sm border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-display font-bold tracking-wider transition-colors"
                    >
                      ŞUBEYİ KAPAT
                    </button>
                  </div>

                  {/* Financial Yield Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-sm border border-[#1b3a4b] bg-[#07131e]/80 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-display font-bold text-amber-300 flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5" />
                          ŞİRKET GELİRİ (TEMETTÜ)
                        </span>
                        <span className="font-mono text-amber-400 font-bold">+{activeBranch.tradeValueYield} Enerji / dk</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Şube ve holdinglerin ürettiği net kâr şirket kasasına pasif yakıt/enerji olarak yansır.
                      </p>
                    </div>

                    <div className="p-3 rounded-sm border border-[#1b3a4b] bg-[#07131e]/80 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-display font-bold text-cyan-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          EV SAHİBİ KOLONİ BONUSU
                        </span>
                        <span className="font-mono text-cyan-400 font-bold">+{activeBranch.hostBonusYield} Enerji / dk</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Yerel nüfusun franchise yatırımlarından elde ettiği ekonomik katkı ve refah payı.
                      </p>
                    </div>
                  </div>

                  {/* Installed Holdings on this Branch */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-display font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        İNŞA EDİLMİŞ KURUMSAL HOLDİNGLER ({activeBranch.holdings.length} / 3)
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setActiveTab('holdings');
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-200 underline"
                      >
                        Yeni Holding İnşa Et &gt;
                      </button>
                    </div>

                    {activeBranch.holdings.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {activeBranch.holdings.map((hType, idx) => {
                          const hCfg = CORPORATE_HOLDING_CONFIGS[hType];
                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-sm border border-[#1e3d54] bg-[#081522] space-y-1 relative group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-display font-bold text-xs text-slate-200 flex items-center gap-1.5">
                                  <span>{hCfg?.icon}</span>
                                  {hCfg?.nameTr}
                                </span>
                                <button
                                  onClick={() => {
                                    if (onDismantleHolding) {
                                      sound.playClick();
                                      onDismantleHolding(activeBranch.id, idx);
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                  title="Holdingi Yık (%50 İade)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400">{hCfg?.corpYieldDescriptionTr}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic p-3 border border-slate-800 bg-[#07131e] rounded-sm">
                        Bu şubede henüz inşa edilmiş bir holding binası bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Establish New Branch Office */}
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#091522]/90 space-y-3">
                <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  YENİ BİR GEZEGENDE ŞUBE OFİSİ AÇ
                </h3>
                <p className="text-xs text-slate-400">
                  Ticaret Paktı veya müttefiklik bulunan yabancı bir kolonide yeni ticari franchise başlatın (Maliyet: 150 Cevher, 80 Kristal, 100 Yakıt).
                </p>

                {candidatePlanets.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={selectedCandidatePlanetId}
                      onChange={(e) => setSelectedCandidatePlanetId(e.target.value)}
                      className="bg-[#061019] border border-[#2b4c63] text-slate-200 text-xs px-3 py-2 rounded-sm flex-1 outline-none font-display"
                    >
                      {candidatePlanets.map((p) => {
                        const owner = state.players[p.ownerId];
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({owner?.name})
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={() => {
                        if (selectedCandidatePlanetId && onEstablishBranchOffice) {
                          sound.playLaunch();
                          onEstablishBranchOffice(selectedCandidatePlanetId);
                        }
                      }}
                      className="px-5 py-2 rounded-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Building className="w-3.5 h-3.5" />
                      FRANCHISE BAŞLAT
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Şu anda şube açılabilecek uygun bir yabancı koloni bulunmuyor (Ticaret Paktı veya Federasyon ortaklığı gereklidir).
                  </p>
                )}
              </div>

              {/* Foreign Branches on My Worlds */}
              {hostedBranches.length > 0 && (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#091522]/90 space-y-3">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    DÜNYALARIMIZDA FAALİYET GÖSTEREN YABANCI ŞUBELER ({hostedBranches.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hostedBranches.map((hb) => {
                      const corp = state.players[hb.corporationId];
                      const planet = state.planets[hb.targetPlanetId];
                      return (
                        <div
                          key={hb.id}
                          className="p-3 rounded-sm border border-[#1b3a4b] bg-[#061019] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-display font-bold text-slate-200">
                              {planet?.name} • {corp?.name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300">
                              +{hb.hostBonusYield} Enerji / dk
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Holdingleşme: {hb.holdings.length} bina konuşlu.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KURUMSAL BİNALAR & HOLDİNGLER */}
          {activeTab === 'holdings' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b3a4b] pb-3">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    KURUMSAL HOLDİNG KATALOĞU
                  </h3>
                  <p className="text-xs text-slate-400">
                    Şube ofislerinde inşa edilebilen uzmanlaşmış şirket tesisleri (En fazla 3 adet).
                  </p>
                </div>

                {activeBranch && (
                  <span className="text-xs font-mono text-amber-300">
                    Seçili Şube: {state.planets[activeBranch.targetPlanetId]?.name} ({activeBranch.holdings.length} / 3)
                  </span>
                )}
              </div>

              {/* Holding Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(CORPORATE_HOLDING_CONFIGS) as CorporateHoldingType[]).map((hKey) => {
                  const cfg = CORPORATE_HOLDING_CONFIGS[hKey];
                  const isSelected = selectedHoldingType === hKey;

                  return (
                    <div
                      key={hKey}
                      onClick={() => {
                        sound.playClick();
                        setSelectedHoldingType(hKey);
                      }}
                      className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                          : 'bg-[#07131e] border-[#1b3a4b] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          {cfg.nameTr}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300">
                          {cfg.cost.ore}C / {cfg.cost.crystal}K / {cfg.cost.fuel}Y
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-snug">{cfg.descriptionTr}</p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800">
                        <span className="text-amber-400 font-semibold">{cfg.corpYieldDescriptionTr}</span>
                        <span className="text-cyan-400 font-semibold">{cfg.hostYieldDescriptionTr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Construction Action Bar */}
              {activeBranch && (
                <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    Seçilen Holding: <span className="font-bold text-cyan-300">{CORPORATE_HOLDING_CONFIGS[selectedHoldingType]?.nameTr}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (activeBranch.holdings.length >= 3) {
                        sound.playError();
                        return;
                      }
                      if (onBuildHolding) {
                        sound.playTech();
                        onBuildHolding(activeBranch.id, selectedHoldingType);
                      }
                    }}
                    disabled={activeBranch.holdings.length >= 3}
                    className={`px-6 py-2 rounded-sm font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                      activeBranch.holdings.length < 3
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    HOLDİNGİ İNŞA ET
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VADELİ EMTİA BORSASI */}
          {activeTab === 'futures' && (
            <div className="space-y-5">
              {/* Spot Market Rates Bar */}
              <div className="p-3 rounded-sm border border-[#1b3a4b] bg-[#061019] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-display font-bold text-slate-300 flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                  CANLI GALAKTİK SPOT FİYATLAR:
                </span>
                <div className="flex items-center gap-4 font-mono">
                  <span>Cevher: <strong className="text-amber-300">{state.market.rates.ore?.toFixed(2)}</strong> Yakıt</span>
                  <span>Kristal: <strong className="text-cyan-300">{state.market.rates.crystal?.toFixed(2)}</strong> Yakıt</span>
                  <span>Yakıt: <strong className="text-purple-300">{state.market.rates.fuel?.toFixed(2)}</strong> Yakıt</span>
                </div>
              </div>

              {/* Purchase Futures Contract Panel */}
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  YENİ VADELİ EMTİA SÖZLEŞMESİ BAĞLA (FUTURES HEDGING)
                </h3>
                <p className="text-xs text-slate-400">
                  Gelecekteki fiyat artışlarına karşı emtiayı bugünden indirimli fiyattan rezerve edin. Vade dolduğunda kaynaklar doğrudan ambarlarınıza teslim edilir.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Resource Select */}
                  <div>
                    <label className="text-[11px] font-display text-slate-300 mb-1 block">Emtia Türü:</label>
                    <select
                      value={futuresResourceType}
                      onChange={(e) => setFuturesResourceType(e.target.value as ResourceType)}
                      className="w-full bg-[#061019] border border-[#2b4c63] text-slate-200 text-xs px-3 py-2 rounded-sm outline-none font-display"
                    >
                      <option value="ore">Cevher (Ore)</option>
                      <option value="crystal">Kristal (Crystal)</option>
                      <option value="fuel">Yakıt (Fuel)</option>
                    </select>
                  </div>

                  {/* Amount Select */}
                  <div>
                    <label className="text-[11px] font-display text-slate-300 mb-1 block">Miktar:</label>
                    <div className="flex items-center gap-1">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setFuturesAmount(amt)}
                          className={`flex-1 py-1.5 text-xs font-mono rounded-sm border transition-all ${
                            futuresAmount === amt
                              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                              : 'bg-[#061019] border-[#1e3c54] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Select */}
                  <div>
                    <label className="text-[11px] font-display text-slate-300 mb-1 block">Vade Süresi:</label>
                    <div className="flex items-center gap-1">
                      {[5, 10, 20, 30].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => setFuturesDuration(dur)}
                          className={`flex-1 py-1.5 text-xs font-mono rounded-sm border transition-all ${
                            futuresDuration === dur
                              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                              : 'bg-[#061019] border-[#1e3c54] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {dur} dk
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#162e42]">
                  <div className="text-xs font-mono text-slate-300">
                    Birim Kilit Fiyat: <strong className="text-emerald-400">{forwardUnitPrice}</strong> Yakıt • Toplam Peşin Ödeme: <strong className="text-amber-400">{totalFuturesCost}</strong> Yakıt
                  </div>

                  <button
                    onClick={() => {
                      if (onPurchaseFutures) {
                        sound.playLaunch();
                        onPurchaseFutures(futuresResourceType, futuresAmount, futuresDuration);
                      }
                    }}
                    className="px-6 py-2 rounded-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    KONTRATI ONAYLA & SATIN AL
                  </button>
                </div>
              </div>

              {/* Active Contracts Portfolio */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  VADELİ SÖZLEŞME PORTFÖYÜM ({myFuturesContracts.length})
                </h3>

                {myFuturesContracts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myFuturesContracts.map((contract) => {
                      const isReady = state.timeMs >= contract.deliveryTimeMs;
                      const remainingSec = Math.max(0, Math.ceil((contract.deliveryTimeMs - state.timeMs) / 1000));

                      return (
                        <div
                          key={contract.id}
                          className={`p-3 rounded-sm border space-y-2 ${
                            contract.isClaimed
                              ? 'bg-slate-900/40 border-slate-800 opacity-60'
                              : isReady
                              ? 'bg-emerald-950/30 border-emerald-400/80 shadow-md'
                              : 'bg-[#07131e] border-[#1b3a4b]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-display font-bold text-slate-100 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-emerald-400" />
                              {contract.amount} Birim {contract.resourceType.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              {contract.isClaimed
                                ? 'TAHSİL EDİLDİ'
                                : isReady
                                ? 'TESLİMATA HAZIR'
                                : `${remainingSec} sn`}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                            <span>Kilit Fiyat: {contract.lockedPricePerUnit}</span>
                            <span>Maliyet: {contract.totalCost} Yakıt</span>
                          </div>

                          {!contract.isClaimed && (
                            <div className="pt-1">
                              <button
                                onClick={() => {
                                  if (isReady && onClaimFutures) {
                                    sound.playVictoryFanfare();
                                    onClaimFutures(contract.id);
                                  } else {
                                    sound.playError();
                                  }
                                }}
                                disabled={!isReady}
                                className={`w-full py-1.5 rounded-sm font-display text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                  isReady
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isReady ? 'AMBARLARA AKTAR' : 'VADESİ BEKLENİYOR'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-6 text-center border border-slate-800 bg-[#07131e] rounded-sm">
                    Portföyünüzde henüz kayıtlı vadeli sözleşme bulunmuyor.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ŞİRKET TÜZÜĞÜ & DOKTRİN */}
          {activeTab === 'charter' && (
            <div className="space-y-5">
              <div className="p-4 rounded-sm border border-[#2b4c63] bg-[#0a1824]/90 space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  MEGAKORPORASYON DEVLET MODELİ & ŞİRKET TÜZÜĞÜ
                </h3>
                <p className="text-xs text-slate-400">
                  Şirket tüzükleri imparatorluğun ticari yetki alanını, şube açma imtiyazlarını ve franchise doktrinini belirler.
                </p>

                {/* Civics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(CORPORATE_CIVIC_CONFIGS) as CorporateCivicId[]).map((cKey) => {
                    const cfg = CORPORATE_CIVIC_CONFIGS[cKey];
                    const isSelected = selectedCivics.includes(cKey);

                    return (
                      <div
                        key={cKey}
                        onClick={() => {
                          sound.playClick();
                          if (isSelected) {
                            if (selectedCivics.length > 1) {
                              setSelectedCivics(selectedCivics.filter((c) => c !== cKey));
                            }
                          } else {
                            if (selectedCivics.length < 2) {
                              setSelectedCivics([...selectedCivics, cKey]);
                            } else {
                              setSelectedCivics([selectedCivics[1], cKey]);
                            }
                          }
                        }}
                        className={`p-3.5 rounded-sm border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/50 border-purple-400 shadow-md'
                            : 'bg-[#07131e] border-[#1b3a4b] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-xs text-slate-100 flex items-center gap-2">
                            <span>{cfg.icon}</span>
                            {cfg.nameTr}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 border border-purple-500/50 px-1.5 py-0.5 rounded">
                              SEÇİLİ
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">{cfg.descriptionTr}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#162e42]">
                  <div className="text-xs text-slate-300">
                    Mevcut Durum: <strong className={isMegacorp ? 'text-amber-400' : 'text-slate-400'}>
                      {isMegacorp ? 'FAAL MEGAKORPORASYON' : 'STANDART İMPARATORLUK'}
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      if (onConvertToMegacorp) {
                        sound.playTech();
                        onConvertToMegacorp(selectedCivics);
                      }
                    }}
                    className="px-6 py-2.5 rounded-sm bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-display text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    ŞİRKET TÜZÜĞÜNÜ ONAYLA & İLAN ET
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1b3a4b] bg-[#07131e] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2 font-mono text-[11px]">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            Megakorporasyon Doktrini: Şube ofisleri ev sahibi dünyalara refah, şirkete galaktik temettü sağlar.
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-sm border border-[#2b4c63] hover:border-slate-400 text-slate-300 font-display text-xs font-bold transition-colors"
          >
            KAPAT
          </button>
        </div>
      </div>
    </div>
  );
};
