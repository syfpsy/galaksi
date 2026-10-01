import React, { useState } from 'react';
import {
  Activity,
  Award,
  CheckCircle,
  Clock,
  Compass,
  Cpu,
  Eye,
  Hammer,
  Radio,
  Sparkles,
  Sun,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { GameState, MegastructureType } from '../../engine/types';
import {
  canBuildMegastructure,
  GATEWAY_CONFIG,
  getPlayerMegastructureBonuses,
  MEGASTRUCTURE_CONFIGS,
} from '../../engine/megastructures';
import { sound } from '../sound';

interface MegastructureModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onBuildMegastructure: (systemId: string, type: MegastructureType, planetId: string) => void;
  onUpgradeMegastructure: (megastructureId: string, planetId: string) => void;
  onConstructGateway: (systemId: string, planetId: string) => void;
  onActivateGateway: (systemId: string, planetId: string) => void;
}

export const MegastructureModal: React.FC<MegastructureModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  onClose,
  onBuildMegastructure,
  onUpgradeMegastructure,
  onConstructGateway,
  onActivateGateway,
}) => {
  const [activeTab, setActiveTab] = useState<'megastructures' | 'gateways'>('megastructures');
  const [selectedMegaType, setSelectedMegaType] = useState<MegastructureType>('dyson_swarm');
  const [selectedBuildSystemId, setSelectedBuildSystemId] = useState<string>('');
  const [selectedGatewaySystemId, setSelectedGatewaySystemId] = useState<string>('');

  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const fundingPlanet = myPlanets.find((p) => p.isHomeworld) || myPlanets[0];
  const megaBonuses = getPlayerMegastructureBonuses(state, activePlayerId);

  // Systems where player has presence (colony or starbase)
  const presenceSystemIds = Array.from(
    new Set([
      ...myPlanets.map((p) => p.systemId),
      ...Object.values(state.starbases || {})
        .filter((sb) => sb.ownerId === activePlayerId)
        .map((sb) => sb.systemId),
    ])
  );

  // Candidate systems for building new megastructure
  const candidateMegaSystems = presenceSystemIds.filter((sId) => {
    const check = canBuildMegastructure(state, sId, activePlayerId, selectedMegaType);
    return check.canBuild;
  });

  // Candidate systems for building new gateway
  const candidateGatewaySystems = presenceSystemIds.filter(
    (sId) => !state.gateways?.[sId]
  );

  const selectedDef = MEGASTRUCTURE_CONFIGS[selectedMegaType];
  const existingMega = Object.values(state.megastructures || {}).find(
    (m) => m.ownerId === activePlayerId && m.type === selectedMegaType
  );

  // Render Icon helper
  const getMegaIcon = (type: MegastructureType) => {
    switch (type) {
      case 'dyson_swarm':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'science_nexus':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'mega_shipyard':
        return <Hammer className="w-5 h-5 text-rose-400" />;
      case 'sentry_array':
        return <Eye className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-lg bg-cyan-950/40 border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-cyan-300 uppercase font-mono flex items-center gap-2">
                MEGA YAPILAR & ALT-UZAY GEÇİTLERİ
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  FAZ 13
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sektörel harikalar, devasa enerji hasatçıları ve anlık hiperuzay transit koridorları.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Empire Active Summary */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-cyan-500/10 bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('megastructures');
              }}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition flex items-center gap-2 ${
                activeTab === 'megastructures'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mega Yapılar
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('gateways');
              }}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition flex items-center gap-2 ${
                activeTab === 'gateways'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Alt-Uzay Ağ Geçitleri ({megaBonuses.activeGatewaysCount})
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sun className="w-3.5 h-3.5" /> +{megaBonuses.passiveHourlyResources.ore}C, +{megaBonuses.passiveHourlyResources.crystal}K, +{megaBonuses.passiveHourlyResources.fuel}Y/sa
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Cpu className="w-3.5 h-3.5" /> +{Math.round((megaBonuses.researchSpeedMultiplier - 1) * 100)}% Ar-Ge
            </span>
            <span className="flex items-center gap-1.5 text-rose-300">
              <Hammer className="w-3.5 h-3.5" /> +{Math.round((megaBonuses.shipBuildSpeedMultiplier - 1) * 100)}% Tersane Hızı
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'megastructures' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Blueprint Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  MEGA YAPI TASARIMLARI
                </h3>
                <div className="space-y-2">
                  {(Object.keys(MEGASTRUCTURE_CONFIGS) as MegastructureType[]).map((type) => {
                    const def = MEGASTRUCTURE_CONFIGS[type];
                    const isSelected = selectedMegaType === type;
                    const existing = Object.values(state.megastructures || {}).find(
                      (m) => m.ownerId === activePlayerId && m.type === type
                    );

                    return (
                      <div
                        key={type}
                        onClick={() => {
                          sound.playClick();
                          setSelectedMegaType(type);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-slate-950/60 border border-slate-700/50">
                            {getMegaIcon(type)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{def.nameTr}</div>
                            <div className="text-[10px] text-slate-400">
                              {existing ? (
                                <span className="text-emerald-400 font-mono">
                                  {existing.status === 'under_construction'
                                    ? `İnşa Ediliyor (Aşama ${existing.stage + 1})`
                                    : `Aşama ${existing.stage} / 3 Aktif`}
                                </span>
                              ) : (
                                <span className="text-slate-500">İnşa Edilmedi</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {existing && existing.stage >= 3 && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Center & Right Column: Details & Blueprint Stage Progress */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/30">
                        {getMegaIcon(selectedMegaType)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-cyan-200 font-mono uppercase">
                          {selectedDef.nameTr}
                        </h3>
                        <p className="text-xs text-slate-400">{selectedDef.shortDescTr}</p>
                      </div>
                    </div>
                    {existingMega && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300">
                        Konum: {state.map.systems[existingMega.systemId]?.name || existingMega.systemId}
                      </span>
                    )}
                  </div>

                  {/* Stages Timeline */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      İNŞAAT AŞAMALARI (1 - 3)
                    </h4>
                    <div className="space-y-2">
                      {selectedDef.stages.map((stage) => {
                        const isUnlocked = existingMega && existingMega.stage >= stage.stage;
                        const isNextTarget = existingMega
                          ? existingMega.stage + 1 === stage.stage
                          : stage.stage === 1;
                        const isCurrentBuilding =
                          existingMega &&
                          existingMega.status === 'under_construction' &&
                          existingMega.stage + 1 === stage.stage;

                        return (
                          <div
                            key={stage.stage}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 transition ${
                              isUnlocked
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                : isCurrentBuilding
                                ? 'bg-amber-950/20 border-amber-500/50 text-amber-300 animate-pulse'
                                : isNextTarget
                                ? 'bg-cyan-950/20 border-cyan-500/40 text-slate-200'
                                : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono font-semibold">
                              <span>{stage.nameTr}</span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Award className="w-3.5 h-3.5 text-amber-400" />
                                  +{stage.hegemonyPointsReward} Puan
                                </span>
                                {isUnlocked ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Tamamlandı
                                  </span>
                                ) : isCurrentBuilding ? (
                                  <span className="text-amber-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 animate-spin" /> Montaj Sürüyor...
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    {Math.round(stage.buildTimeMs / 1000)}s
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-300">{stage.descriptionTr}</p>
                            {!isUnlocked && (
                              <div className="text-[10px] font-mono text-slate-400 flex gap-3 pt-0.5">
                                <span>Cevher: {stage.cost.ore}</span>
                                <span>Kristal: {stage.cost.crystal}</span>
                                <span>Yakıt: {stage.cost.fuel}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-mono">
                      Finansman Üssü:{' '}
                      <span className="text-cyan-300">{fundingPlanet?.name || 'Ana Üs'}</span>
                    </div>

                    {!existingMega ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedBuildSystemId}
                          onChange={(e) => setSelectedBuildSystemId(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="">İnşaat Sistemi Seçin...</option>
                          {candidateMegaSystems.map((sId) => (
                            <option key={sId} value={sId}>
                              {state.map.systems[sId]?.name || sId}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={
                            !selectedBuildSystemId ||
                            !fundingPlanet ||
                            fundingPlanet.resources.ore < selectedDef.stages[0].cost.ore ||
                            fundingPlanet.resources.crystal < selectedDef.stages[0].cost.crystal ||
                            fundingPlanet.resources.fuel < selectedDef.stages[0].cost.fuel
                          }
                          onClick={() => {
                            if (!fundingPlanet || !selectedBuildSystemId) return;
                            sound.playClick();
                            onBuildMegastructure(selectedBuildSystemId, selectedMegaType, fundingPlanet.id);
                          }}
                          className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-semibold rounded uppercase tracking-wider transition shadow"
                        >
                          Aşama I İnşa Et
                        </button>
                      </div>
                    ) : existingMega.status === 'under_construction' ? (
                      <div className="text-xs font-mono text-amber-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        İnşaat Devam Ediyor...
                      </div>
                    ) : existingMega.stage < existingMega.maxStage ? (
                      <button
                        disabled={
                          !fundingPlanet ||
                          fundingPlanet.resources.ore < selectedDef.stages[existingMega.stage].cost.ore ||
                          fundingPlanet.resources.crystal < selectedDef.stages[existingMega.stage].cost.crystal ||
                          fundingPlanet.resources.fuel < selectedDef.stages[existingMega.stage].cost.fuel
                        }
                        onClick={() => {
                          if (!fundingPlanet) return;
                          sound.playClick();
                          onUpgradeMegastructure(existingMega.id, fundingPlanet.id);
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-semibold rounded uppercase tracking-wider transition shadow"
                      >
                        Aşama {existingMega.stage + 1} Yükselt
                      </button>
                    ) : (
                      <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Maksimum Seviyeye Ulaşıldı (Aşama III)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Subspace Gateways */
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200 font-mono uppercase flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                      ALT-UZAY AĞ GEÇİDİ TRANSİT AĞI
                    </h3>
                    <p className="text-xs text-slate-400">
                      Aktif iki Ağ Geçidi arasındaki seyahatler, aralarındaki hiperuzay rotasını atlayarak anında{' '}
                      <strong className="text-cyan-300">15 saniye</strong> içerisinde gerçekleşir.
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <span className="text-cyan-400 font-bold">{megaBonuses.activeGatewaysCount}</span> Aktif Düğüm
                  </div>
                </div>

                {/* Gateway Construction Widget */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-mono">
                    İnşaat Maliyeti: <span className="text-slate-200">1500C, 1200K, 600Y</span> (Süre: 45s)
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedGatewaySystemId}
                      onChange={(e) => setSelectedGatewaySystemId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Ağ Geçidi Kurulacak Sistem...</option>
                      {candidateGatewaySystems.map((sId) => (
                        <option key={sId} value={sId}>
                          {state.map.systems[sId]?.name || sId}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={
                        !selectedGatewaySystemId ||
                        !fundingPlanet ||
                        fundingPlanet.resources.ore < GATEWAY_CONFIG.CONSTRUCTION_COST.ore ||
                        fundingPlanet.resources.crystal < GATEWAY_CONFIG.CONSTRUCTION_COST.crystal ||
                        fundingPlanet.resources.fuel < GATEWAY_CONFIG.CONSTRUCTION_COST.fuel
                      }
                      onClick={() => {
                        if (!fundingPlanet || !selectedGatewaySystemId) return;
                        sound.playClick();
                        onConstructGateway(selectedGatewaySystemId, fundingPlanet.id);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-semibold rounded uppercase tracking-wider transition shadow"
                    >
                      Ağ Geçidi İnşa Et
                    </button>
                  </div>
                </div>
              </div>

              {/* Gateways List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  BİLİNEN VE AKTİF AĞ GEÇİTLERİ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(state.gateways || {}).map((gw) => {
                    const sysName = state.map.systems[gw.systemId]?.name || gw.systemId;
                    const isMine = gw.ownerId === activePlayerId;
                    const ownerName = gw.ownerId
                      ? state.players[gw.ownerId]?.name || gw.ownerId
                      : 'Kadim Koruyucular (Tarafsız)';

                    return (
                      <div
                        key={gw.id}
                        className={`p-3.5 rounded-lg border text-xs space-y-2 transition ${
                          gw.status === 'active'
                            ? 'bg-slate-900/60 border-cyan-500/40'
                            : gw.status === 'under_construction'
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-950/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            <Radio className={`w-4 h-4 ${gw.status === 'active' ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {sysName}
                          </div>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                              gw.status === 'active'
                                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                                : gw.status === 'under_construction'
                                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            {gw.status === 'active'
                              ? 'AKTİF TRANSİT'
                              : gw.status === 'under_construction'
                              ? 'AKTİVASYON SÜRÜYOR'
                              : 'UYUYAN KADİM GEÇİT'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Kontrol: {ownerName}</span>
                          {gw.status === 'dormant' && (
                            <button
                              disabled={
                                !fundingPlanet ||
                                fundingPlanet.resources.ore < GATEWAY_CONFIG.ACTIVATION_COST.ore ||
                                fundingPlanet.resources.crystal < GATEWAY_CONFIG.ACTIVATION_COST.crystal ||
                                fundingPlanet.resources.fuel < GATEWAY_CONFIG.ACTIVATION_COST.fuel
                              }
                              onClick={() => {
                                if (!fundingPlanet) return;
                                sound.playClick();
                                onActivateGateway(gw.systemId, fundingPlanet.id);
                              }}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white font-mono rounded text-[10px] font-semibold transition"
                            >
                              Kadim Çekirdeği Aktive Et (800C, 1000K, 400Y)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(state.gateways || {}).length === 0 && (
                    <div className="col-span-2 p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      Galakside henüz inşa edilmiş veya keşfedilmiş bir Alt-Uzay Ağ Geçidi bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
