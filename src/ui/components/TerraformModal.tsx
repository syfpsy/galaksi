import React, { useState } from 'react';
import {
  Globe,
  Sprout,
  Pickaxe,
  Shield,
  Layers,
  Sparkles,
  X,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Flame,
  Droplets,
  Snowflake,
  Activity,
  Trees,
} from 'lucide-react';
import {
  GameState,
  Planet,
  PlanetBiome,
  PlanetaryBlockerId,
  PlanetaryDecisionId,
  Resources,
} from '../../engine/types';
import {
  BIOME_CONFIGS,
  PLANETARY_BLOCKERS,
  PLANETARY_DECISIONS,
  TERRAFORM_RECIPES,
  canClearBlocker,
  canEnactDecision,
  canStartTerraforming,
  getPlanetEcologyModifiers,
  getPlanetEffectiveBiome,
  getTerraformRecipe,
} from '../../engine/terraforming';
import { getPlanetAsset } from '../planetAssets';
import { sound } from '../sound';

interface TerraformModalProps {
  state: GameState;
  activePlayerId: string;
  initialPlanetId?: string;
  onClose: () => void;
  onStartTerraforming: (planetId: string, targetBiome: PlanetBiome) => void;
  onCancelTerraforming: (planetId: string) => void;
  onEnactDecision: (planetId: string, decisionId: PlanetaryDecisionId) => void;
  onClearBlocker: (planetId: string, blockerId: string) => void;
}

export const TerraformModal: React.FC<TerraformModalProps> = ({
  state,
  activePlayerId,
  initialPlanetId,
  onClose,
  onStartTerraforming,
  onCancelTerraforming,
  onEnactDecision,
  onClearBlocker,
}) => {
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(
    initialPlanetId && myPlanets.some((p) => p.id === initialPlanetId)
      ? initialPlanetId
      : myPlanets[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'terraforming' | 'decisions' | 'blockers'>('terraforming');
  const [selectedTargetBiome, setSelectedTargetBiome] = useState<PlanetBiome | null>(null);

  const currentPlanet = state.planets[selectedPlanetId] || myPlanets[0];
  if (!currentPlanet) return null;

  const currentSystem = state.map.systems[currentPlanet.systemId];
  const currentSlot = currentSystem?.slots.find(
    (s) => s.planetId === currentPlanet.id || s.slotIndex === currentPlanet.slotIndex
  );
  const currentBiome = getPlanetEffectiveBiome(currentPlanet, currentSlot);
  const currentAsset = getPlanetAsset(currentBiome);
  const currentBiomeCfg = BIOME_CONFIGS[currentBiome] || BIOME_CONFIGS.terran;
  const ecologyModifiers = getPlanetEcologyModifiers(currentPlanet, currentSlot);

  // Available terraform candidate biomes
  const candidateBiomes: PlanetBiome[] = (['terran', 'ocean', 'gaia', 'desert', 'ice', 'volcanic'] as PlanetBiome[])
    .filter((b) => b !== currentBiome);

  const effectiveTargetBiome = selectedTargetBiome && candidateBiomes.includes(selectedTargetBiome)
    ? selectedTargetBiome
    : candidateBiomes[0];
  const targetAsset = getPlanetAsset(effectiveTargetBiome);
  const targetBiomeCfg = BIOME_CONFIGS[effectiveTargetBiome];
  const targetRecipe = getTerraformRecipe(currentBiome, effectiveTargetBiome);

  const canStartEval = canStartTerraforming(state, activePlayerId, currentPlanet.id, effectiveTargetBiome);

  // Active terraforming progress
  const tfQueue = currentPlanet.terraformingQueue;
  const isTerraforming = !!tfQueue;
  const tfElapsed = tfQueue ? Math.max(0, state.timeMs - tfQueue.startTime) : 0;
  const tfDuration = tfQueue ? Math.max(1, tfQueue.finishTime - tfQueue.startTime) : 1;
  const tfProgress = tfQueue ? Math.min(100, Math.round((tfElapsed / tfDuration) * 100)) : 0;
  const tfRemainingSec = tfQueue ? Math.max(0, Math.ceil((tfQueue.finishTime - state.timeMs) / 1000)) : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none animate-fade-in"
    >
      <div className="stellaris-modal rounded-sm border border-[#18374b] w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden bg-[#07101b]/95">
        {/* Header */}
        <div className="p-3.5 border-b border-[#18374b] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-emerald-400 shadow-inner">
              <Sprout className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  GEZEGEN ISLAHI & EKOLOJİK YÖNETİM
                </h2>
                <span className="stellaris-badge text-emerald-400 border-emerald-500/40">
                  Faz 19
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Atmosferik Biyom Dönüştürme, Yüzey Engelleri ve Gezegensel İnisiyatifler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Colony Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#091b29] border border-[#1b3d55] px-2.5 py-1 rounded-sm">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedPlanetId}
                onChange={(e) => {
                  sound.playClick();
                  setSelectedPlanetId(e.target.value);
                  setSelectedTargetBiome(null);
                }}
                className="bg-transparent text-xs text-white font-mono font-medium focus:outline-none cursor-pointer"
              >
                {myPlanets.map((p) => {
                  const pBiome = getPlanetEffectiveBiome(p);
                  return (
                    <option key={p.id} value={p.id} className="bg-[#0b1c2b] text-slate-200">
                      {p.name} {p.isHomeworld ? '(Başkent)' : ''} — {pBiome.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Planet Overview Strip */}
        <div className="px-5 py-3 border-b border-[#18374b] bg-[#06111d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border border-slate-700 overflow-hidden shadow-inner">
              <img
                src={currentAsset.spaceImage}
                alt={currentPlanet.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
                style={{ backgroundColor: currentAsset.themeColor }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-display">
                  {currentPlanet.name}
                </span>
                <span
                  className="text-[9.5px] font-mono px-2 py-0.5 rounded-sm font-bold border"
                  style={{
                    backgroundColor: `${currentAsset.themeColor}20`,
                    borderColor: `${currentAsset.glowColor}50`,
                    color: currentAsset.glowColor,
                  }}
                >
                  {currentAsset.nameTr}
                </span>
                {currentPlanet.isHomeworld && (
                  <span className="text-[9.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-sm font-mono font-bold">
                    ANA DÜNYA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono mt-0.5 text-slate-300">
                <span>
                  Yaşanabilirlik:{' '}
                  <strong className="text-emerald-400">%{Math.round(ecologyModifiers.habitability * 100)}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Cevher:{' '}
                  <strong className={ecologyModifiers.oreMultiplier >= 1 ? 'text-orange-400' : 'text-red-400'}>
                    x{ecologyModifiers.oreMultiplier.toFixed(2)}
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Kristal:{' '}
                  <strong className={ecologyModifiers.crystalMultiplier >= 1 ? 'text-cyan-300' : 'text-red-400'}>
                    x{ecologyModifiers.crystalMultiplier.toFixed(2)}
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Yakıt:{' '}
                  <strong className={ecologyModifiers.fuelMultiplier >= 1 ? 'text-amber-300' : 'text-red-400'}>
                    x{ecologyModifiers.fuelMultiplier.toFixed(2)}
                  </strong>
                </span>
                {ecologyModifiers.defenseMultiplier > 1 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Savunma x{ecologyModifiers.defenseMultiplier.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Planet Resource Reserves */}
          <div className="flex items-center gap-3 text-xs font-mono bg-[#091b29] px-3 py-1.5 rounded-sm border border-[#1a384e]">
            <span className="text-slate-400">Gezegen Rezervi:</span>
            <span className="text-orange-400 font-bold">⛏️ {Math.floor(currentPlanet.resources.ore).toLocaleString()}</span>
            <span className="text-cyan-300 font-bold">💎 {Math.floor(currentPlanet.resources.crystal).toLocaleString()}</span>
            <span className="text-amber-300 font-bold">⚡ {Math.floor(currentPlanet.resources.fuel).toLocaleString()}</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-[#18374b] bg-[#071320] px-5">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('terraforming');
            }}
            className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'terraforming'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            BİYOM ISLAHI (TERRAFORMING)
            {isTerraforming && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('decisions');
            }}
            className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'decisions'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            GEZEGENSEL KARARLAR
            {currentPlanet.activeDecisions && currentPlanet.activeDecisions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-sm text-[9.5px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/50">
                {currentPlanet.activeDecisions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('blockers');
            }}
            className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'blockers'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            YÜZEY ENGELLERİ
            {currentPlanet.blockers && currentPlanet.blockers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-sm text-[9.5px] bg-amber-900/60 text-amber-300 border border-amber-500/50">
                {currentPlanet.blockers.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Terraforming Engine */}
        {activeTab === 'terraforming' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {/* Active Terraforming Banner */}
            {isTerraforming && tfQueue && (
              <div className="p-4 rounded-sm border border-emerald-500/50 bg-[#092225]/80 shadow-lg relative overflow-hidden animate-pulse-slow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300 font-mono tracking-wide uppercase">
                        ISLAH PROTOKOLÜ DEVREDE: {currentAsset.nameTr} ➔ {getPlanetAsset(tfQueue.targetBiome).nameTr}
                      </h4>
                      <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                        Atmosferik gaz difüzyonu ve biyo-katalitik toprak değişimi sürüyor.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Kalan Süre: {tfRemainingSec} sn
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onCancelTerraforming(currentPlanet.id);
                      }}
                      className="px-3 py-1 bg-red-950/70 border border-red-500/50 hover:bg-red-900 text-red-200 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      İptal Et (%75 İade)
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-[#06141c] rounded-full overflow-hidden border border-emerald-900/60 relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${tfProgress}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow">
                    %{tfProgress}
                  </span>
                </div>
              </div>
            )}

            {/* Biome Comparison & Visual Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Biome Box */}
              <div className="p-4 rounded-sm border border-[#1b3d55] bg-[#081827] flex flex-col">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  MEVCUT GEZEGEN BİYOMU
                </span>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-20 h-20 rounded-full border-2 overflow-hidden shadow-lg shrink-0 relative"
                    style={{ borderColor: currentAsset.glowColor }}>
                    <img
                      src={currentAsset.surfaceImage}
                      alt={currentAsset.nameTr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      {currentAsset.nameTr}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-sans mt-1 leading-snug">
                      {currentAsset.description}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                      {currentAsset.habitability}
                    </span>
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-slate-800 grid grid-cols-4 gap-2 text-[10.5px] font-mono text-center">
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Cevher</span>
                    <strong className="text-orange-400">x{currentBiomeCfg.oreMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Kristal</span>
                    <strong className="text-cyan-300">x{currentBiomeCfg.crystalMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Yakıt</span>
                    <strong className="text-amber-300">x{currentBiomeCfg.fuelMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Araştırma</span>
                    <strong className="text-indigo-300">x{currentBiomeCfg.researchMultiplier.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Target Biome Box */}
              <div className="p-4 rounded-sm border border-emerald-500/30 bg-[#091f2c] flex flex-col">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">
                  HEDEF ISLAH BİYOMU
                </span>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-20 h-20 rounded-full border-2 overflow-hidden shadow-lg shrink-0 relative"
                    style={{ borderColor: targetAsset.glowColor }}>
                    <img
                      src={targetAsset.surfaceImage}
                      alt={targetAsset.nameTr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      {targetAsset.nameTr}
                      {effectiveTargetBiome === 'gaia' && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-sans mt-1 leading-snug">
                      {targetAsset.description}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {targetAsset.habitability}
                    </span>
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-slate-800 grid grid-cols-4 gap-2 text-[10.5px] font-mono text-center">
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Cevher</span>
                    <strong className="text-orange-400">x{targetBiomeCfg.oreMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Kristal</span>
                    <strong className="text-cyan-300">x{targetBiomeCfg.crystalMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Yakıt</span>
                    <strong className="text-amber-300">x{targetBiomeCfg.fuelMultiplier.toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#05101a] p-1.5 rounded-sm border border-slate-800">
                    <span className="text-slate-400 block text-[9.5px]">Araştırma</span>
                    <strong className="text-indigo-300">x{targetBiomeCfg.researchMultiplier.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Biome Selection Cards */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                DÖNÜŞTÜRÜLEBİLİR BİYOM SEÇENEKLERİ
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {candidateBiomes.map((bio) => {
                  const asset = getPlanetAsset(bio);
                  const isSelected = bio === effectiveTargetBiome;
                  const recipe = getTerraformRecipe(currentBiome, bio);

                  return (
                    <button
                      key={bio}
                      disabled={isTerraforming}
                      onClick={() => {
                        sound.playClick();
                        setSelectedTargetBiome(bio);
                      }}
                      className={`p-2.5 rounded-sm border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'border-emerald-400 bg-[#0c293a] shadow-md shadow-emerald-950/40'
                          : 'border-[#18374b] bg-[#071522] hover:border-slate-500'
                      } ${isTerraforming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <img
                          src={asset.spaceImage}
                          alt={asset.nameTr}
                          className="w-5 h-5 rounded-full object-cover border border-slate-600"
                        />
                        <span className="text-[11px] font-bold text-white font-mono truncate">
                          {asset.nameTr}
                        </span>
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-400 mb-1">
                        Süre: {recipe ? `${recipe.durationMs / 1000}s` : '—'}
                      </div>
                      {recipe && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono">
                          <span className="text-orange-400">{recipe.cost.ore}</span>
                          <span className="text-cyan-300">{recipe.cost.crystal}</span>
                          <span className="text-amber-300">{recipe.cost.fuel}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Action Footer */}
            <div className="p-4 rounded-sm border border-[#18374b] bg-[#091a28] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Hedef: {targetAsset.nameTr}</span>
                  {targetRecipe?.requiredLabLevel && (
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950 px-1.5 py-0.5 rounded-sm border border-cyan-800">
                      Laboratuvar Seviye {targetRecipe.requiredLabLevel}+
                    </span>
                  )}
                </div>
                {targetRecipe ? (
                  <div className="flex items-center gap-3 text-xs font-mono mt-1 text-slate-300">
                    <span>Gereken Kaynaklar:</span>
                    <span className={currentPlanet.resources.ore >= targetRecipe.cost.ore ? 'text-orange-400' : 'text-red-400 font-bold'}>
                      ⛏️ {targetRecipe.cost.ore}
                    </span>
                    <span className={currentPlanet.resources.crystal >= targetRecipe.cost.crystal ? 'text-cyan-300' : 'text-red-400 font-bold'}>
                      💎 {targetRecipe.cost.crystal}
                    </span>
                    <span className={currentPlanet.resources.fuel >= targetRecipe.cost.fuel ? 'text-amber-300' : 'text-red-400 font-bold'}>
                      ⚡ {targetRecipe.cost.fuel}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-300">İşlem Süresi: {targetRecipe.durationMs / 1000} sn</span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-red-400">Bu dönüşüm desteklenmiyor.</span>
                )}
                {!canStartEval.canStart && !isTerraforming && (
                  <div className="text-[11px] font-mono text-red-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {canStartEval.reason}
                  </div>
                )}
              </div>

              <button
                disabled={!canStartEval.canStart || isTerraforming}
                onClick={() => {
                  sound.playTech();
                  onStartTerraforming(currentPlanet.id, effectiveTargetBiome);
                }}
                className={`px-5 py-2.5 rounded-sm font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  canStartEval.canStart && !isTerraforming
                    ? 'stellaris-btn-metallic text-emerald-300 border-emerald-500/60 shadow-lg cursor-pointer hover:bg-emerald-900/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Sprout className="w-4 h-4" />
                Islah Protokolünü Başlat
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Planetary Decisions */}
        {activeTab === 'decisions' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  GEZEGENSEL KARARLAR & İNİSİYATİFLER
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Gezegen verimliliğini, savunma dayanıklılığını ve biyom ahengini artıran özel politikalar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(Object.keys(PLANETARY_DECISIONS) as PlanetaryDecisionId[]).map((decId) => {
                const def = PLANETARY_DECISIONS[decId];
                const activeDecision = currentPlanet.activeDecisions?.find((d) => d.id === decId);
                const isActive = !!activeDecision;
                const canEn = canEnactDecision(state, activePlayerId, currentPlanet.id, decId);
                const remainingSec = activeDecision?.expiresAt
                  ? Math.max(0, Math.ceil((activeDecision.expiresAt - state.timeMs) / 1000))
                  : null;

                return (
                  <div
                    key={decId}
                    className={`p-3.5 rounded-sm border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-cyan-500/50 bg-[#092233]/70 shadow-md'
                        : 'border-[#18374b] bg-[#071624] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {decId === 'climate_domes' && '🛡️'}
                            {decId === 'soil_enrichment' && '🌱'}
                            {decId === 'geothermal_core_drill' && '🌋'}
                            {decId === 'ecological_sanctuary' && '🌲'}
                            {decId === 'planetary_shield_overcharge' && '⚡'}
                            {decId === 'strip_mining_initiative' && '⛏️'}
                          </span>
                          <h4 className="text-xs font-bold text-white font-mono">
                            {def.nameTr}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-sm bg-cyan-950 text-cyan-300 border border-cyan-500/50 flex items-center gap-1 font-bold">
                            <CheckCircle className="w-3 h-3 text-cyan-400" />
                            {remainingSec !== null ? `${remainingSec}s` : 'Yürürlükte'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-2.5">
                        {def.descriptionTr}
                      </p>

                      {/* Effects List */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {def.effectsTr.map((eff, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#05111d] text-emerald-400 border border-emerald-900/50"
                          >
                            {eff}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#142e42] flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
                        <span>Maliyet:</span>
                        {def.cost.ore > 0 && <span className="text-orange-400">⛏️ {def.cost.ore}</span>}
                        {def.cost.crystal > 0 && <span className="text-cyan-300">💎 {def.cost.crystal}</span>}
                        {def.cost.fuel > 0 && <span className="text-amber-300">⚡ {def.cost.fuel}</span>}
                      </div>

                      <button
                        disabled={isActive || !canEn.canEnact}
                        onClick={() => {
                          sound.playTech();
                          onEnactDecision(currentPlanet.id, decId);
                        }}
                        className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-cyan-950/40 text-cyan-400/50 border border-cyan-900/40 cursor-not-allowed'
                            : canEn.canEnact
                            ? 'stellaris-btn-metallic text-cyan-300 border-cyan-500/60 hover:bg-cyan-900/50 cursor-pointer shadow-sm'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Yürürlüğe Koy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Surface Blockers */}
        {activeTab === 'blockers' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  YÜZEY ENGELLERİ & KAZI ÇALIŞMALARI
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Kolonizasyon alanlarını tıkayan ve üretimi düşüren doğal veya kadim engelleri temizleyin.
                </p>
              </div>
            </div>

            {(!currentPlanet.blockers || currentPlanet.blockers.length === 0) ? (
              <div className="p-10 rounded-sm border border-[#1b3d55] bg-[#071624] text-center flex flex-col items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-white font-display">
                  Yüzey Tamamen Temiz!
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">
                  Bu gezegende herhangi bir engel bulunmuyor. Tüm alanlar yerleşime ve üretime açık.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentPlanet.blockers.map((blk) => {
                  const def = PLANETARY_BLOCKERS[blk.type];
                  const isClearing = !!blk.clearing;
                  const clearElapsed = blk.clearing ? Math.max(0, state.timeMs - blk.clearing.startTime) : 0;
                  const clearDuration = blk.clearing ? Math.max(1, blk.clearing.finishTime - blk.clearing.startTime) : 1;
                  const clearProgress = blk.clearing ? Math.min(100, Math.round((clearElapsed / clearDuration) * 100)) : 0;
                  const clearRemainingSec = blk.clearing ? Math.max(0, Math.ceil((blk.clearing.finishTime - state.timeMs) / 1000)) : 0;

                  const canClr = canClearBlocker(state, activePlayerId, currentPlanet.id, blk.id);

                  return (
                    <div
                      key={blk.id}
                      className={`p-3.5 rounded-sm border flex flex-col justify-between ${
                        isClearing
                          ? 'border-amber-500/60 bg-[#1f1a0f]/80'
                          : 'border-[#18374b] bg-[#071624] hover:border-slate-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {blk.type === 'volcanic_ash_wastes' && '🌋'}
                              {blk.type === 'radioactive_fallout' && '☢️'}
                              {blk.type === 'glacial_chasm' && '❄️'}
                              {blk.type === 'noxious_swamp' && '🧪'}
                              {blk.type === 'dense_jungle' && '🌿'}
                            </span>
                            <h4 className="text-xs font-bold text-white font-mono">
                              {def?.nameTr || blk.type}
                            </h4>
                          </div>

                          {isClearing && (
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-sm bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1 font-bold animate-pulse">
                              <Pickaxe className="w-3 h-3 text-amber-400" />
                              {clearRemainingSec}s
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-2">
                          {def?.descriptionTr}
                        </p>

                        {/* Penalties & Clear Reward */}
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded-sm bg-red-950/60 text-red-300 border border-red-900/50">
                            Cezası: -%{Math.round(def.habitabilityPenalty * 100)} Yaşanabilirlik
                          </span>
                          <span className="px-2 py-0.5 rounded-sm bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                            Ödül: +{def.reward.ore}⛏️ +{def.reward.crystal}💎
                          </span>
                        </div>

                        {/* Clear Progress Bar if Clearing */}
                        {isClearing && (
                          <div className="w-full h-2 bg-[#081520] rounded-full overflow-hidden border border-amber-900/60 mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                              style={{ width: `${clearProgress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#142e42] flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
                          <span>Maliyet:</span>
                          {def.cost.ore > 0 && <span className="text-orange-400">⛏️ {def.cost.ore}</span>}
                          {def.cost.crystal > 0 && <span className="text-cyan-300">💎 {def.cost.crystal}</span>}
                          {def.cost.fuel > 0 && <span className="text-amber-300">⚡ {def.cost.fuel}</span>}
                          <span className="text-slate-600">•</span>
                          <span>{def.clearTimeMs / 1000}s</span>
                        </div>

                        <button
                          disabled={isClearing || !canClr.canClear}
                          onClick={() => {
                            sound.playClick();
                            onClearBlocker(currentPlanet.id, blk.id);
                          }}
                          className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                            isClearing
                              ? 'bg-amber-950/40 text-amber-400/50 border border-amber-900/40 cursor-not-allowed'
                              : canClr.canClear
                              ? 'stellaris-btn-metallic text-amber-300 border-amber-500/60 hover:bg-amber-900/50 cursor-pointer shadow-sm'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Pickaxe className="w-3.5 h-3.5" />
                          {isClearing ? 'Temizleniyor...' : 'Engeli Temizle'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
