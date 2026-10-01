import React, { useState } from 'react';
import {
  Eye,
  ShieldAlert,
  UserCheck,
  UserX,
  PlusCircle,
  X,
  Shield,
  Crosshair,
  Skull,
  Zap,
  Radio,
  FileText,
  AlertTriangle,
  Flame,
  Crown,
  Activity,
  Award,
  Layers,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  GameState,
  SecretAgent,
  SecretAgentTrait,
  ShadowOpType,
  DirectorateTier,
} from '../../engine/types';
import {
  DIRECTORATE_TIER_CONFIGS,
  SECRET_AGENT_TRAIT_CONFIGS,
  SHADOW_OP_CONFIGS,
  getOrCreateDirectorate,
  canUpgradeDirectorate,
  canRecruitAgent,
  canLaunchShadowOp,
} from '../../engine/shadowOps';
import { sound } from '../sound';

export interface ShadowOpsModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onUpgradeDirectorate?: (fundingPlanetId: string) => void;
  onRecruitAgent?: (fundingPlanetId: string, name: string, trait: SecretAgentTrait) => void;
  onAssignAgent?: (agentId: string, targetFactionId?: string, assignedOperationId?: string) => void;
  onDismissAgent?: (agentId: string) => void;
  onDispatchFalseFlagFleet?: (fleetId: string, disguisedAsFactionId: string) => void;
  onLaunchShadowOp?: (
    targetFactionId: string,
    opType: ShadowOpType,
    assignedAgentId?: string,
    targetPlanetId?: string,
    targetStarbaseId?: string,
    fundingPlanetId?: string
  ) => void;
}

export const ShadowOpsModal: React.FC<ShadowOpsModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onUpgradeDirectorate,
  onRecruitAgent,
  onAssignAgent,
  onDismissAgent,
  onDispatchFalseFlagFleet,
  onLaunchShadowOp,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const directorate = getOrCreateDirectorate(state, activePlayerId);
  const currentTierConfig = DIRECTORATE_TIER_CONFIGS[directorate.tier];
  const nextTier = (directorate.tier + 1) as DirectorateTier;
  const nextTierConfig = directorate.tier < 5 ? DIRECTORATE_TIER_CONFIGS[nextTier] : null;

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const primaryPlanet = playerPlanets.find((p) => p.isHomeworld) || playerPlanets[0];

  const allAgents = Object.values(state.secretAgents || {}).filter((a) => a.ownerId === activePlayerId);
  const allOps = Object.values(state.shadowOperations || {}).filter((o) => o.initiatorId === activePlayerId);
  const otherFactions = Object.values(state.players).filter((p) => p.id !== activePlayerId);

  // Tab State
  const [activeTab, setActiveTab] = useState<'directorate' | 'agents' | 'false_flag' | 'operations'>('directorate');

  // HQ Upgrade State
  const [hqFundingPlanetId, setHqFundingPlanetId] = useState<string>(primaryPlanet?.id || '');

  // Agent Recruitment State
  const [agentName, setAgentName] = useState<string>('Ajan Gölge-07');
  const [agentTrait, setAgentTrait] = useState<SecretAgentTrait>('master_infiltrator');
  const [agentFundingPlanetId, setAgentFundingPlanetId] = useState<string>(primaryPlanet?.id || '');

  // False Flag State
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [disguisedFactionId, setDisguisedFactionId] = useState<string>('pirates');

  // Shadow Operation Launch State
  const [opType, setOpType] = useState<ShadowOpType>('sabotage_starbase_grid');
  const [opTargetFactionId, setOpTargetFactionId] = useState<string>(otherFactions[0]?.id || '');
  const [opAgentId, setOpAgentId] = useState<string>('');
  const [opTargetPlanetId, setOpTargetPlanetId] = useState<string>('');
  const [opTargetStarbaseId, setOpTargetStarbaseId] = useState<string>('');
  const [opFundingPlanetId, setOpFundingPlanetId] = useState<string>(primaryPlanet?.id || '');

  // Eligible Orbit Fleets for False Flag
  const myOrbitFleets = Object.values(state.fleets).filter((f) => f.ownerId === activePlayerId && f.status === 'orbiting');

  // Target Faction Assets
  const targetPlanets = Object.values(state.planets).filter((p) => p.ownerId === opTargetFactionId);
  const targetStarbases = Object.values(state.starbases || {}).filter((s) => s.ownerId === opTargetFactionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950/95 border border-purple-500/40 rounded-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Eye className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-mono tracking-wider text-purple-200 uppercase">
                  Galaktik İstihbarat Teşkilatı
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  KADEME {directorate.tier} : {currentTierConfig.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Kripto Matrisi • Sahte Bayrak Akınları • Gölge Darbeleri & Yıkıcı Sabotaj
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-300 bg-slate-900/80 px-3.5 py-1.5 rounded-md border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Kripto Analiz: <b className="text-purple-300">{directorate.cryptoDecryption}</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Karşı-İstihbarat: <b className="text-cyan-300">{directorate.counterIntelScore}</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ajanlar: <b className="text-emerald-300">{allAgents.length}/{directorate.maxAgents}</b></span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all"
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
              setActiveTab('directorate');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'directorate'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Karargah & Kripto Matrisi
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('agents');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'agents'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Ajan Hücreleri ({allAgents.length})
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('false_flag');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'false_flag'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Skull className="w-4 h-4" />
            Sahte Bayrak Akınları
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('operations');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'operations'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Gölge Operasyonları & Sabotaj ({allOps.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: Karargah & Kripto Matrisi */}
          {activeTab === 'directorate' && (
            <div className="space-y-6">
              {/* Headquarters Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-purple-300 font-bold uppercase">Teşkilat Kademesi</span>
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">Kademe {directorate.tier}</div>
                  <div className="text-xs text-purple-300 mt-1">{currentTierConfig.name}</div>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{currentTierConfig.description}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-300 font-bold uppercase">Kripto Deşifre Gücü</span>
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">+{directorate.cryptoDecryption}</div>
                  <div className="text-xs text-slate-400 mt-1">Rakip telsiz ve sahte bayrakları deşifre hızı</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (directorate.cryptoDecryption / 120) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-emerald-300 font-bold uppercase">Karşı-İstihbarat Kalkanı</span>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-300">{directorate.counterIntelScore} Puan</div>
                  <div className="text-xs text-slate-400 mt-1">Düşman ajanlarını yakalama ve sızmaları engelleme</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (directorate.counterIntelScore / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Upgrade Panel */}
              <div className="p-5 rounded-xl bg-slate-900/50 border border-purple-500/20">
                <h3 className="text-sm font-bold font-mono text-purple-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Karargah Genişletme & Teşkilat Yükseltmesi
                </h3>

                {nextTierConfig ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Kademe {nextTierConfig.tier}: {nextTierConfig.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          +{nextTierConfig.cryptoDecryptionBonus} Kripto • +{nextTierConfig.counterIntelBonus} Karşı-İstihbarat • Kapasite: {nextTierConfig.maxAgents} Ajan
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{nextTierConfig.description}</p>
                      <div className="text-xs font-mono text-slate-300 flex items-center gap-4 pt-1">
                        <span>Cevher: <b className="text-amber-400">{nextTierConfig.cost.ore}</b></span>
                        <span>Kristal: <b className="text-cyan-400">{nextTierConfig.cost.crystal}</b></span>
                        <span>Yakıt: <b className="text-emerald-400">{nextTierConfig.cost.fuel}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <select
                        value={hqFundingPlanetId}
                        onChange={(e) => setHqFundingPlanetId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-2 outline-none focus:border-purple-400"
                      >
                        {playerPlanets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.resources.ore}C / {p.resources.crystal}K / {p.resources.fuel}Y)
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          sound.playTech();
                          onUpgradeDirectorate?.(hqFundingPlanetId);
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-mono font-bold uppercase text-white shadow-md shadow-purple-950 transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Karargahı Yükselt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                    Teşkilat azami seviyeye ulaştı (Kademe 5: Galaktik Gölge Konseyi). Galaksideki tüm altuzay sinyalleri izleniyor.
                  </div>
                )}
              </div>

              {/* Quantum Crypto Frequency Matrix Simulation */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
                <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Kuantum Altuzay Kripto Matrisi & Sinyal Yakalama
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {otherFactions.slice(0, 4).map((f) => (
                    <div key={f.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-200">{f.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">Şifreleme Frekansı: SIGINT-{f.id.slice(-3).toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-cyan-400">
                          %{Math.min(99, 40 + directorate.cryptoDecryption / 2)} Deşifre
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">Stabil Bağlantı</div>
                      </div>
                    </div>
                  ))}
                  {otherFactions.length === 0 && (
                    <div className="text-xs text-slate-500 font-mono col-span-2">
                      Sinyal aralığında henüz başka egemen devlet tespit edilmedi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Ajan Hücreleri */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              {/* Agent Recruitment Section */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-purple-500/20">
                <h3 className="text-sm font-bold font-mono text-purple-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Yeni Sahra Operatörü Devşir ({allAgents.length}/{directorate.maxAgents})
                </h3>

                {allAgents.length < directorate.maxAgents ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800 items-end">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Kod Adı</label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Uzmanlık Niteliği</label>
                      <select
                        value={agentTrait}
                        onChange={(e) => setAgentTrait(e.target.value as SecretAgentTrait)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        <option value="master_infiltrator">Usta Sızıcı (+%30 Sızma Hızı)</option>
                        <option value="saboteur">Sabotajcı (+%40 Başarı Oranı)</option>
                        <option value="provocateur">Kışkırtıcı (+%35 Darbe Gücü)</option>
                        <option value="ghost">Hayalet (%0 İfşa / İntihar Çipi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Fonlama Gezegeni</label>
                      <select
                        value={agentFundingPlanetId}
                        onChange={(e) => setAgentFundingPlanetId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        {playerPlanets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onRecruitAgent?.(agentFundingPlanetId, agentName, agentTrait);
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-mono font-bold uppercase text-white shadow transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Operatörü Göreve Al (150C / 120K / 80Y)
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    Azami ajan kadrosu doldu ({directorate.maxAgents} Operatör). Yeni ajan için Teşkilat Karargahını yükseltin.
                  </div>
                )}
              </div>

              {/* Active Operatives List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Aktif İstihbarat Hücreleri & Sahra Operatörleri
                </h3>

                {allAgents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
                    Henüz teşkilata bağlı aktif bir sahra operatörü yok. Yukarıdaki panelden yeni bir ajan devşirebilirsiniz.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allAgents.map((agent) => {
                      const traitConfig = SECRET_AGENT_TRAIT_CONFIGS[agent.trait];
                      return (
                        <div
                          key={agent.id}
                          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
                                <UserCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{agent.name}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-900">
                                    Seviye {agent.level}
                                  </span>
                                </div>
                                <div className="text-xs text-purple-400 font-mono">{traitConfig.name}</div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                                agent.status === 'idle'
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                                  : agent.status === 'captured'
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800 animate-pulse'
                                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-800'
                              }`}
                            >
                              {agent.status === 'idle'
                                ? 'Boşta'
                                : agent.status === 'captured'
                                ? 'Esir / İfşa'
                                : 'Görevde'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 font-mono">{traitConfig.description}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                            <span className="text-slate-400">
                              Deneyim: <b className="text-slate-200">{agent.xp || agent.experience || 0} XP</b>
                            </span>

                            <div className="flex items-center gap-2">
                              {agent.status === 'idle' && otherFactions.length > 0 && (
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    onAssignAgent?.(agent.id, otherFactions[0]?.id);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] transition-all"
                                >
                                  Hedefe Ata
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onDismissAgent?.(agent.id);
                                }}
                                className="p-1.5 rounded bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 transition-all"
                                title="Ajanı Terhis Et / Kimliğini İmha Et"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Sahte Bayrak Akınları */}
          {activeTab === 'false_flag' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    <Skull className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wide">
                      Sahte Bayrak Filo Kamuflajı (False Flag Fleet Raids)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Filolarınızın transponder kodlarını korsan veya rakip bir imparatorluk gibi göstererek denetimden gizleyin.
                    </p>
                  </div>
                </div>

                {directorate.tier < 2 ? (
                  <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Sahte Bayrak operasyonları için en az Kademe 2 (Altuzay SIGINT ve Kripto Ağı) gereklidir.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800 items-end">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Yörüngedeki Filo</label>
                      <select
                        value={selectedFleetId}
                        onChange={(e) => setSelectedFleetId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        <option value="">Filo Seçin...</option>
                        {myOrbitFleets.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.falseFlag?.isDisguised ? 'Kamuflajlı' : 'Standart'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Görünecek Kimlik (Sahte Bayrak)</label>
                      <select
                        value={disguisedFactionId}
                        onChange={(e) => setDisguisedFactionId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        <option value="pirates">Korsan Akıncıları (Bağımsız Çeteler)</option>
                        {otherFactions.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} (Çerçeveleme / İftira)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      disabled={!selectedFleetId}
                      onClick={() => {
                        sound.playLaunch();
                        onDispatchFalseFlagFleet?.(selectedFleetId, disguisedFactionId);
                      }}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-mono font-bold uppercase text-white shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Skull className="w-4 h-4" />
                      Kamuflajı Devreye Al
                    </button>
                  </div>
                )}
              </div>

              {/* Active False Flag Fleets */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Kamuflajlı Filolar & Transponder Durumu
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(state.fleets)
                    .filter((f) => f.ownerId === activePlayerId && f.falseFlag?.isDisguised)
                    .map((fleet) => (
                      <div
                        key={fleet.id}
                        className="p-3.5 rounded-lg bg-slate-900/60 border border-purple-500/30 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{fleet.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              Kılık: {fleet.falseFlag?.disguisedAsFactionId === 'pirates' ? 'Korsanlar' : fleet.falseFlag?.disguisedAsFactionId}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Durum: {fleet.status} • Sistem: {state.map.systems[fleet.targetSystemId]?.name || fleet.targetSystemId}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                              fleet.falseFlag?.isCompromised
                                ? 'bg-red-950 text-red-300 border-red-800'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {fleet.falseFlag?.isCompromised ? 'İFŞA OLDU' : 'KAMUFLAJ AKTİF'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Gölge Operasyonları & Sabotaj */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* Operation Launch Panel */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-4">
                <h3 className="text-sm font-bold font-mono text-purple-200 uppercase tracking-wide flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-purple-400" />
                  Yıkıcı Gölge Operasyonu Planla
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Operasyon Türü</label>
                    <select
                      value={opType}
                      onChange={(e) => setOpType(e.target.value as ShadowOpType)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                    >
                      <option value="sabotage_starbase_grid">Yıldızüssü Ağını Çökert (-%40 Can/Kalkan)</option>
                      <option value="incite_rebellion">Gezegensel İsyan Körükle (Dondur & Yağmala)</option>
                      <option value="false_flag_raid">Sahte Bayrak Akını (İmparatorlukları Kışkırt)</option>
                      <option value="assassinate_councilor">Konsey Liderine Suikast (İstikrar Darbesi)</option>
                      <option value="orchestrate_shadow_coup">Gölge Darbesi (İdeoloji & Paktları Yık)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Hedef Egemen Devlet</label>
                    <select
                      value={opTargetFactionId}
                      onChange={(e) => setOpTargetFactionId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                    >
                      {otherFactions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Görevlendirilecek Ajan</label>
                    <select
                      value={opAgentId}
                      onChange={(e) => setOpAgentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                    >
                      <option value="">Ajan Seçin (Opsiyonel)</option>
                      {allAgents
                        .filter((a) => a.status === 'idle')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({SECRET_AGENT_TRAIT_CONFIGS[a.trait].name})
                          </option>
                        ))}
                    </select>
                  </div>

                  {opType === 'sabotage_starbase_grid' && targetStarbases.length > 0 && (
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Hedef Yıldızüssü</label>
                      <select
                        value={opTargetStarbaseId}
                        onChange={(e) => setOpTargetStarbaseId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        <option value="">Otomatik / Rastgele Seç</option>
                        {targetStarbases.map((sb) => (
                          <option key={sb.id} value={sb.id}>
                            {state.map.systems[sb.systemId]?.name || sb.systemId} Yıldızüssü
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {opType === 'incite_rebellion' && targetPlanets.length > 0 && (
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Hedef Gezegen</label>
                      <select
                        value={opTargetPlanetId}
                        onChange={(e) => setOpTargetPlanetId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                      >
                        <option value="">Otomatik / Rastgele Seç</option>
                        {targetPlanets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Operasyon Fonu (Gezegen)</label>
                    <select
                      value={opFundingPlanetId}
                      onChange={(e) => setOpFundingPlanetId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 outline-none focus:border-purple-400"
                    >
                      {playerPlanets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-mono text-slate-400">
                    Maliyet:{' '}
                    <b className="text-amber-400">{SHADOW_OP_CONFIGS[opType].cost.ore} Cevher</b>,{' '}
                    <b className="text-cyan-400">{SHADOW_OP_CONFIGS[opType].cost.crystal} Kristal</b>,{' '}
                    <b className="text-emerald-400">{SHADOW_OP_CONFIGS[opType].cost.fuel} Yakıt</b> • Süre:{' '}
                    {Math.round(SHADOW_OP_CONFIGS[opType].durationMs / 1000)}s
                  </div>

                  <button
                    onClick={() => {
                      sound.playLaunch();
                      onLaunchShadowOp?.(
                        opTargetFactionId,
                        opType,
                        opAgentId || undefined,
                        opTargetPlanetId || undefined,
                        opTargetStarbaseId || undefined,
                        opFundingPlanetId
                      );
                    }}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-xs font-mono font-bold uppercase text-white shadow transition-all flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Operasyonu Başlat
                  </button>
                </div>
              </div>

              {/* Active Operations List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Yürütülen Gölge Operasyonları ({allOps.length})
                </h3>

                {allOps.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
                    Şu anda yürütülen aktif bir gölge operasyonu bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allOps.map((op) => {
                      const cfg = SHADOW_OP_CONFIGS[op.opType];
                      const targetName = state.players[op.targetFactionId]?.name || op.targetFactionId;
                      return (
                        <div
                          key={op.id}
                          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Crosshair className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-bold text-white">{cfg.name}</span>
                              <span className="text-xs font-mono text-slate-400">→ Hedef: <b className="text-purple-300">{targetName}</b></span>
                            </div>

                            <span className="text-xs font-mono font-bold text-cyan-300">
                              %{Math.round(op.progress || 0)} İlerleme
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-rose-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, op.progress || 0))}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                            <span>Başarı İhtimali: <b className="text-emerald-400">%{op.successChance}</b></span>
                            <span>İfşa Riski: <b className="text-rose-400">%{op.detectionRisk}</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
