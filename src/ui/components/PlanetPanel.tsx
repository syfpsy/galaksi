import React from 'react';
import {
  Activity,
  ArrowUpCircle,
  Building,
  CheckCircle,
  Clock,
  Coins,
  Compass,
  Eye,
  Flame,
  Gem,
  LineChart,
  Pickaxe,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  Sprout,
  Users,
  Home,
  Sparkles,
  Trash2,
  Plus,
  Zap,
  Hammer,
  Wrench,
  X,
} from 'lucide-react';
import {
  BUILDING_STATS,
  DISTRICT_STATS,
  calculateHourlyProduction,
  getBuildingUpgradeCost,
} from '../../engine/constants';
import {
  BuildingType,
  DistrictType,
  GameState,
  Planet,
  PlanetSpecialization,
  PlanetStance,
  ShipType,
} from '../../engine/types';
import { formatDuration } from '../timeUtils';
import { sound } from '../sound';
import { getPlanetAsset } from '../planetAssets';

interface PlanetPanelProps {
  planets: Planet[];
  activePlanetId: string;
  state?: GameState;
  onSelectPlanet: (id: string) => void;
  onUpgradeBuilding: (planetId: string, type: BuildingType) => void;
  onBuildDistrict?: (planetId: string, districtType: DistrictType) => void;
  onDemolishDistrict?: (planetId: string, districtType: DistrictType) => void;
  onSetStance: (planetId: string, stance: PlanetStance) => void;
  onSetSpecialization?: (planetId: string, specialization: PlanetSpecialization) => void;
  currentTimeMs: number;
  onOpenShipyard?: () => void;
  onOpenResearch?: () => void;
  onOpenMarket?: () => void;
  onOpenEspionage?: (targetPlanetId?: string) => void;
  onOpenTerraform?: (planetId?: string) => void;
  onDispatchSupplyConvoy?: (colonyPlanetId: string) => void;
  onClose?: () => void;
}

const PlanetPanelComponent: React.FC<PlanetPanelProps> = ({
  planets,
  activePlanetId,
  state,
  onSelectPlanet,
  onUpgradeBuilding,
  onBuildDistrict,
  onDemolishDistrict,
  onSetStance,
  onSetSpecialization,
  currentTimeMs,
  onOpenShipyard,
  onOpenResearch,
  onOpenMarket,
  onOpenEspionage,
  onOpenTerraform,
  onDispatchSupplyConvoy,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'districts' | 'buildings'>('districts');

  const currentPlanet = planets.find((p) => p.id === activePlanetId) || planets[0];
  if (!currentPlanet) {
    return (
      <aside className="w-[390px] min-w-[390px] max-w-[390px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner p-4 text-slate-400 text-sm">
        Gezegen bulunamadı.
      </aside>
    );
  }

  // Find system slot to determine planet biome type
  const system = state?.map.systems[currentPlanet.systemId];
  const slot = system?.slots.find(
    (s) => s.planetId === currentPlanet.id || s.slotIndex === currentPlanet.slotIndex
  );
  const planetAsset = getPlanetAsset(currentPlanet.biome || slot?.type);

  const buildingsList: BuildingType[] = [
    'ore_mine',
    'crystal_synth',
    'fuel_refinery',
    'shipyard',
    'research_lab',
    'sensor_array',
  ];

  return (
    <aside className="w-[390px] min-w-[390px] max-w-[390px] shrink-0 h-full border-r border-[#18374b] stellaris-outliner flex flex-col z-20 select-none overflow-hidden shadow-2xl">
      {/* Header: Planet Tabs */}
      <div className="p-3 border-b border-[#18374b] stellaris-outliner-header">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono stellaris-gold uppercase font-bold tracking-widest">
            İMPARATORLUK KOLONİLERİ
          </span>
          <div className="flex items-center gap-1.5">
            <span className="stellaris-badge text-cyan-300 border-cyan-500/40">
              {planets.length} / 3 Koloni
            </span>
            {onClose && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#152e40] transition-colors cursor-pointer"
                title="Paneli Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Planet Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {planets.map((p) => {
            const pSys = state?.map.systems[p.systemId];
            const pSlot = pSys?.slots.find((s) => s.planetId === p.id || s.slotIndex === p.slotIndex);
            const pAsset = getPlanetAsset(p.biome || pSlot?.type);
            const isCur = p.id === currentPlanet.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  sound.playClick();
                  onSelectPlanet(p.id);
                }}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isCur
                    ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                    : 'stellaris-resource-pod text-slate-300 hover:border-slate-500'
                }`}
              >
                <img
                  src={pAsset.spaceImage}
                  alt={p.name}
                  className="w-4 h-4 rounded-full object-cover border border-[#1c3c50] shrink-0"
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    p.isHomeworld ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinematic Surface Landscape Hero Banner */}
      <div className="relative w-full h-32 overflow-hidden border-b border-[#18374b] shrink-0 group">
        <img
          src={planetAsset.surfaceImage}
          alt={planetAsset.nameTr}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Cinematic Vignette & Bottom/Edge Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d19] via-[#080d19]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d19]/80 via-transparent to-transparent pointer-events-none" />

        {/* Biome Type & Habitability Badges Over Surface */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold backdrop-blur-md shadow-md border"
              style={{
                backgroundColor: `${planetAsset.themeColor}30`,
                color: planetAsset.glowColor,
                borderColor: `${planetAsset.glowColor}60`,
              }}
            >
              {planetAsset.nameTr}
            </span>
            <span className="stellaris-badge text-emerald-400 border-emerald-500/40 backdrop-blur-md">
              {planetAsset.habitability}
            </span>
          </div>
          {slot && (
            <span className="stellaris-badge text-slate-300 backdrop-blur-md border-[#18374b]">
              Boyut {slot.size}
            </span>
          )}
        </div>
      </div>

      {/* Stellaris Planetary Demographic & Social HUD */}
      <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-[#060c14] border-b border-[#18374b] text-center font-mono shrink-0">
        {/* Pops */}
        <div className="flex flex-col items-center justify-center p-1 rounded-sm bg-[#091522] border border-[#18374b]/60" title="Gezegen Nüfusu (Pop): Çalışan iş gücü">
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-bold">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>{currentPlanet.pops ?? (currentPlanet.isHomeworld ? 10 : 2)}</span>
          </div>
          <span className="text-[8.5px] text-slate-400 uppercase tracking-tighter">Nüfus</span>
        </div>

        {/* Housing */}
        {(() => {
          const pops = currentPlanet.pops ?? (currentPlanet.isHomeworld ? 10 : 2);
          const housing = currentPlanet.housing ?? (currentPlanet.isHomeworld ? 17 : 7);
          const isOvercrowded = pops > housing;
          return (
            <div className={`flex flex-col items-center justify-center p-1 rounded-sm border ${
              isOvercrowded ? 'bg-rose-950/40 border-rose-500/60 text-rose-300' : 'bg-[#091522] border-[#18374b]/60 text-emerald-400'
            }`} title={`Konut Kapasitesi: ${pops}/${housing}`}>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <Home className="w-3 h-3" />
                <span>{pops}/{housing}</span>
              </div>
              <span className="text-[8.5px] text-slate-400 uppercase tracking-tighter">Konut</span>
            </div>
          );
        })()}

        {/* Amenities */}
        {(() => {
          const amenities = currentPlanet.amenities ?? 15;
          const isDeficit = amenities < 0;
          return (
            <div className={`flex flex-col items-center justify-center p-1 rounded-sm border ${
              isDeficit ? 'bg-rose-950/40 border-rose-500/60 text-rose-300' : 'bg-[#091522] border-[#18374b]/60 text-amber-300'
            }`} title={`Hizmet Seviyesi: ${amenities >= 0 ? `+${amenities}` : amenities} (İstikrarı etkiler)`}>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>{amenities >= 0 ? `+${amenities}` : amenities}</span>
              </div>
              <span className="text-[8.5px] text-slate-400 uppercase tracking-tighter">Hizmet</span>
            </div>
          );
        })()}

        {/* Stability */}
        {(() => {
          const stability = currentPlanet.stability ?? 80;
          const multiplier = 1 + (stability - 50) * 0.004;
          return (
            <div className="flex flex-col items-center justify-center p-1 rounded-sm bg-[#091522] border border-[#18374b]/60" title={`Gezegen İstikrarı: %${stability} (Üretim Çarpanı: ${multiplier.toFixed(2)}x)`}>
              <div className="flex items-center gap-1 text-[11px] text-purple-300 font-bold">
                <Shield className="w-3 h-3 text-purple-400" />
                <span>%{stability}</span>
              </div>
              <span className="text-[8.5px] text-purple-300 font-bold uppercase tracking-tighter">{multiplier.toFixed(2)}x Üretim</span>
            </div>
          );
        })()}
      </div>

      {/* Planetary Status & Defense Stance */}
      <div className="px-4 py-3 border-b border-[#18374b] bg-[#070e17]/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Dynamic Living Planetary Orb with Orbiting Defense Satellite */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group">
              {/* Atmospheric Glow Aura */}
              <div
                className="absolute inset-0 rounded-full blur-sm animate-pulse-slow opacity-60"
                style={{ backgroundColor: planetAsset.glowColor }}
              />

              {/* Orbiting Satellite Track */}
              <div className="absolute inset-[-4px] rounded-full border border-slate-700/60 pointer-events-none" />
              <div
                className="absolute inset-[-4px] rounded-full animate-spin-slow pointer-events-none"
                style={{ transformOrigin: 'center' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full absolute -top-0.5 left-1/2 -translate-x-1/2 shadow-sm"
                  style={{ backgroundColor: planetAsset.glowColor }}
                />
              </div>

              {/* Planet Orb Body */}
              <div
                className="w-11 h-11 rounded-full overflow-hidden border bg-black relative shadow-md"
                style={{ borderColor: `${planetAsset.glowColor}60` }}
              >
                <img
                  src={planetAsset.spaceImage}
                  alt={currentPlanet.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-white font-display flex items-center gap-2">
                {currentPlanet.name}
                {currentPlanet.isHomeworld && (
                  <span className="text-[9.5px] bg-amber-400/20 text-[#fbbf24] border border-amber-500/50 px-1.5 py-0.5 rounded-sm font-mono font-bold tracking-wide">
                    BAŞKENT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                Korumalı Depo: <strong className="text-white">{currentPlanet.protectedCapacity.toLocaleString()}</strong> br
              </div>
              {/* Planetary Hourly Production Strip */}
              <div className="flex items-center gap-1.5 mt-1 text-[10.5px] font-mono font-medium">
                <span className="text-orange-400 font-bold">
                  +{Math.round(calculateHourlyProduction('ore', currentPlanet.buildings.ore_mine || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-bold">
                  +{Math.round(calculateHourlyProduction('crystal', currentPlanet.buildings.crystal_synth || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold">
                  +{Math.round(calculateHourlyProduction('fuel', currentPlanet.buildings.fuel_refinery || 0) * (currentPlanet.specialization === 'mining_hub' ? 1.2 : 1))}/s
                </span>
                {currentPlanet.specialization === 'mining_hub' && (
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/60 text-emerald-300 px-1 rounded-sm font-bold animate-pulse">
                    +%20
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Stance Selector */}
          <div className="flex items-center gap-1">
            {onOpenMarket && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenMarket();
                }}
                className="p-1.5 rounded-sm text-xs stellaris-btn-metallic text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Galaktik Borsa & Pazar (F6)"
              >
                <Coins className="w-4 h-4" />
              </button>
            )}
            {onOpenEspionage && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenEspionage(currentPlanet.id);
                }}
                className="p-1.5 rounded-sm text-xs stellaris-btn-metallic text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                title="Casusluk & Gölge Ağı (F7)"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onOpenTerraform && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenTerraform(currentPlanet.id);
                }}
                className={`p-1.5 rounded-sm text-xs transition-all border cursor-pointer relative ${
                  currentPlanet.terraformingQueue
                    ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300 animate-pulse'
                    : 'stellaris-btn-metallic text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50'
                }`}
                title="Gezegen Islahı, Yüzey Engelleri ve Ekolojik Kararlar"
              >
                <Sprout className="w-4 h-4" />
                {currentPlanet.blockers && currentPlanet.blockers.length > 0 && !currentPlanet.terraformingQueue && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onSetStance(currentPlanet.id, 'hold_position');
              }}
              className={`p-1.5 rounded-sm text-xs transition-all cursor-pointer ${
                currentPlanet.stance === 'hold_position'
                  ? 'stellaris-rail-btn active text-emerald-400'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-slate-200'
              }`}
              title="Konumu Tut: Garnizon sonuna kadar savunur."
            >
              <Shield className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onSetStance(currentPlanet.id, 'evade_safeguard');
              }}
              className={`p-1.5 rounded-sm text-xs transition-all cursor-pointer ${
                currentPlanet.stance === 'evade_safeguard'
                  ? 'stellaris-rail-btn active text-amber-400'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-slate-200'
              }`}
              title="Filoyu Koru: Ağır baskında hafif gemiler kaçınır."
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Terraforming Progress Strip */}
        {currentPlanet.terraformingQueue && (
          <div className="px-4 py-2 border-b border-emerald-900/40 bg-emerald-950/30">
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 mb-1 font-bold">
              <span className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 animate-spin-slow text-emerald-400" />
                Islah: {getPlanetAsset(currentPlanet.terraformingQueue.targetBiome).nameTr}
              </span>
              <span>
                %{Math.min(100, Math.max(0, Math.round(((currentTimeMs - currentPlanet.terraformingQueue.startTime) / Math.max(1, currentPlanet.terraformingQueue.finishTime - currentPlanet.terraformingQueue.startTime)) * 100)))}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#081520] rounded-full overflow-hidden border border-emerald-900/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, Math.round(((currentTimeMs - currentPlanet.terraformingQueue.startTime) / Math.max(1, currentPlanet.terraformingQueue.finishTime - currentPlanet.terraformingQueue.startTime)) * 100)))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Active Decisions Badges */}
        {currentPlanet.activeDecisions && currentPlanet.activeDecisions.length > 0 && (
          <div className="px-4 py-1.5 border-b border-[#18374b] bg-[#071320] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold shrink-0">
              Kararlar:
            </span>
            {currentPlanet.activeDecisions.map((d) => (
              <span
                key={d.id}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shrink-0"
              >
                {d.id.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Planetary Specialization Focus (Vali Politikası) */}
        <div className="mt-2.5 pt-2.5 border-t border-[#18374b]/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <span>🏛️</span>
              <span>Vali Politikası</span>
            </span>
            <span className="text-[9.5px] font-mono text-cyan-300">
              {currentPlanet.specialization === 'mining_hub' ? 'Maden Dünyası (+%20 Üretim)' :
               currentPlanet.specialization === 'tech_haven' ? 'Bilim Cenneti (+%35 Ar-Ge)' :
               currentPlanet.specialization === 'military_bastion' ? 'Askeri Hisar (+%30 Savunma)' :
               'Dengeli Gelişim'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'balanced', label: 'Dengeli', icon: '⚖️', desc: 'Standart dengeli altyapı' },
              { id: 'mining_hub', label: 'Madencilik', icon: '⛏️', desc: '+%20 Cevher, Kristal ve Yakıt üretimi' },
              { id: 'tech_haven', label: 'Ar-Ge', icon: '🔬', desc: '+%35 Araştırma ve sensör menzili' },
              { id: 'military_bastion', label: 'Hisar', icon: '🛡️', desc: '+%30 Savunma bataryası gücü' },
            ].map((spec) => {
              const isActive = (currentPlanet.specialization || 'balanced') === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => {
                    sound.playClick();
                    if (onSetSpecialization) {
                      onSetSpecialization(currentPlanet.id, spec.id as PlanetSpecialization);
                    }
                  }}
                  className={`px-1.5 py-1 rounded-sm text-[10px] font-mono flex flex-col items-center gap-0.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950/80'
                      : 'bg-[#091522]/80 border-[#18374b] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                  title={`${spec.label}: ${spec.desc}`}
                >
                  <span className="text-xs">{spec.icon}</span>
                  <span className="truncate w-full text-center">{spec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logistics Supply Convoy (Colonies only) */}
          {!currentPlanet.isHomeworld && onDispatchSupplyConvoy && (
            <div className="pt-2">
              <button
                onClick={() => {
                  sound.playLaunch();
                  onDispatchSupplyConvoy(currentPlanet.id);
                }}
                disabled={(currentPlanet.garrison.transport || 0) <= 0}
                className={`w-full py-1.5 px-2.5 rounded-sm font-mono text-[10.5px] font-bold flex items-center justify-between transition-all border ${
                  (currentPlanet.garrison.transport || 0) > 0
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-amber-200 cursor-pointer shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title="Kolonideki güvenlik rezervi (300C, 200K, 100Y) üzerindeki fazlalık kaynakları Ağır Nakliye gemileriyle tek tıkla Ana Üsse sevk eder."
              >
                <span className="flex items-center gap-1.5">
                  <span>📦</span>
                  <span>Ana Üsse İkmal Sevkiyatı</span>
                </span>
                <span className="text-[9.5px] text-amber-300">
                  {currentPlanet.garrison.transport || 0} Nakliye Hazır
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Districts & Surface vs Infrastructure Buildings */}
      <div className="flex border-b border-[#18374b] bg-[#07101a] px-3 pt-2 gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('districts');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'districts'
              ? 'border-cyan-400 text-cyan-200 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>İlçeler & Yüzey</span>
          {currentPlanet.districtQueue && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('buildings');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'buildings'
              ? 'border-cyan-400 text-cyan-200 bg-cyan-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Altyapı Binaları</span>
          {currentPlanet.buildingQueue && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Content: Districts View */}
      {activeTab === 'districts' && (
        <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-3 text-xs font-mono scrollbar-none">
          {(() => {
            const maxDistricts = slot?.size || (currentPlanet.isHomeworld ? 20 : 16);
            const districts = currentPlanet.districts || {
              city: currentPlanet.isHomeworld ? 3 : 1,
              mining: currentPlanet.isHomeworld ? 2 : 1,
              generator: currentPlanet.isHomeworld ? 2 : 0,
              agriculture: currentPlanet.isHomeworld ? 1 : 0,
            };
            const totalBuilt =
              districts.city + districts.mining + districts.generator + districts.agriculture;
            const hasQueue = !!currentPlanet.districtQueue;

            // Generate slot cells for visualization
            const gridCells: {
              type: DistrictType | 'empty';
              isBuilding?: boolean;
              name: string;
              icon: string;
              border: string;
              bg: string;
              text: string;
            }[] = [];

            for (let i = 0; i < districts.city; i++) {
              gridCells.push({
                type: 'city',
                name: 'Şehir İlçesi',
                icon: '🏙️',
                border: 'border-cyan-500/70',
                bg: 'bg-cyan-950/50',
                text: 'text-cyan-300',
              });
            }
            for (let i = 0; i < districts.mining; i++) {
              gridCells.push({
                type: 'mining',
                name: 'Maden İlçesi',
                icon: '⛏️',
                border: 'border-orange-500/70',
                bg: 'bg-orange-950/50',
                text: 'text-orange-300',
              });
            }
            for (let i = 0; i < districts.generator; i++) {
              gridCells.push({
                type: 'generator',
                name: 'Jeneratör İlçesi',
                icon: '⚡',
                border: 'border-yellow-500/70',
                bg: 'bg-yellow-950/50',
                text: 'text-yellow-300',
              });
            }
            for (let i = 0; i < districts.agriculture; i++) {
              gridCells.push({
                type: 'agriculture',
                name: 'Tarım İlçesi',
                icon: '🌱',
                border: 'border-emerald-500/70',
                bg: 'bg-emerald-950/50',
                text: 'text-emerald-300',
              });
            }

            if (currentPlanet.districtQueue) {
              const qType = currentPlanet.districtQueue.type;
              gridCells.push({
                type: qType,
                isBuilding: true,
                name: `${DISTRICT_STATS[qType]?.nameTr || 'İlçe'} (İnşa Ediliyor)`,
                icon: '🔨',
                border: 'border-purple-400 animate-pulse shadow-sm shadow-purple-500/50',
                bg: 'bg-purple-950/70',
                text: 'text-purple-300',
              });
            }

            while (gridCells.length < maxDistricts) {
              gridCells.push({
                type: 'empty',
                name: 'Boş İlçe Slotu',
                icon: '+',
                border: 'border-dashed border-[#1e3a50]',
                bg: 'bg-[#060c14]/40',
                text: 'text-slate-600',
              });
            }

            return (
              <>
                {/* Surface Grid Container */}
                <div className="p-2.5 rounded-sm bg-[#050b12] border border-[#18374b] shadow-inner">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <span>🪐</span>
                      <span>Görsel Yüzey Izgarası</span>
                    </span>
                    <span className="text-cyan-400 font-mono">
                      {totalBuilt} / {maxDistricts} Slot Dolu
                    </span>
                  </div>

                  {/* Surface Grid Cells */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {gridCells.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`h-11 rounded-sm border flex flex-col items-center justify-center relative group transition-all ${cell.border} ${cell.bg}`}
                        title={`${cell.name} (Slot #${idx + 1})`}
                      >
                        <span className="text-xs">{cell.icon}</span>
                        <span className={`text-[8.5px] font-mono font-bold mt-0.5 ${cell.text}`}>
                          {cell.isBuilding ? 'İnşa' : cell.type === 'empty' ? 'Boş' : cell.type.slice(0, 3).toUpperCase()}
                        </span>
                        {cell.isBuilding && (
                          <div className="absolute inset-0 bg-purple-500/10 rounded-sm animate-pulse pointer-events-none" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active District Queue Bar */}
                {currentPlanet.districtQueue && (
                  <div className="p-2.5 rounded-sm bg-purple-950/30 border border-purple-500/40">
                    {(() => {
                      const q = currentPlanet.districtQueue;
                      const stats = DISTRICT_STATS[q.type];
                      const total = Math.max(1, q.finishTime - q.startTime);
                      const elapsed = currentTimeMs - q.startTime;
                      const remainingMs = Math.max(0, q.finishTime - currentTimeMs);
                      const progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

                      return (
                        <div>
                          <div className="flex items-center justify-between text-[10.5px] font-mono text-purple-300 font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <Hammer className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                              <span>{stats.nameTr} İnşaatı</span>
                            </span>
                            <span className="flex items-center gap-1 text-purple-200">
                              <Clock className="w-3 h-3 text-purple-400 animate-spin" />
                              <span>{formatDuration(remainingMs)} (%{progress})</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#060c14] rounded-full overflow-hidden border border-purple-500/40 relative">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-white transition-all duration-300 relative shadow-sm"
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute top-0 right-0 bottom-0 w-2 bg-white animate-pulse" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* District Management Cards */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider">
                    İLÇE İNŞASI & GELİŞTİRME
                  </div>

                  {(['city', 'mining', 'generator', 'agriculture'] as DistrictType[]).map((dType) => {
                    const stats = DISTRICT_STATS[dType];
                    const count = districts[dType] || 0;
                    const canAfford =
                      currentPlanet.resources.ore >= stats.cost.ore &&
                      currentPlanet.resources.crystal >= stats.cost.crystal &&
                      currentPlanet.resources.fuel >= stats.cost.fuel;
                    const isQueueActive = currentPlanet.districtQueue?.type === dType;
                    const canBuild = canAfford && !hasQueue && totalBuilt < maxDistricts;

                    const icons: Record<DistrictType, string> = {
                      city: '🏙️',
                      mining: '⛏️',
                      generator: '⚡',
                      agriculture: '🌱',
                    };

                    const benefits: Record<DistrictType, string> = {
                      city: '+5 Konut, +5 Hizmet, +1 İş',
                      mining: '+2 Konut, +120 Cevher/s',
                      generator: '+2 Konut, +80 Yakıt/s',
                      agriculture: '+2 Konut, +60 Kristal/s',
                    };

                    return (
                      <div
                        key={dType}
                        className={`p-2.5 rounded-sm stellaris-item-card transition-all ${
                          isQueueActive ? '!border-purple-400/80 shadow-sm shadow-purple-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{icons[dType]}</span>
                            <div>
                              <div className="text-xs font-bold text-white font-display flex items-center gap-1.5">
                                <span>{stats.nameTr}</span>
                                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-[#07101a] px-1.5 py-0.2 rounded-sm border border-[#19384c]">
                                  {count} İlçe
                                </span>
                              </div>
                              <div className="text-[9.5px] font-mono text-emerald-400 font-medium">
                                {benefits[dType]}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Build (+) & Demolish (-) */}
                          <div className="flex items-center gap-1">
                            {count > 0 && onDemolishDistrict && (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  onDemolishDistrict(currentPlanet.id, dType);
                                }}
                                className="p-1 rounded-sm text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 transition-all cursor-pointer"
                                title={`${stats.nameTr} Yık: Hurda kaynakları geri al.`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              disabled={!canBuild}
                              onClick={() => {
                                sound.playConstruction();
                                if (onBuildDistrict) {
                                  onBuildDistrict(currentPlanet.id, dType);
                                }
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-mono font-medium transition-all ${
                                canBuild
                                  ? 'stellaris-btn-metallic text-cyan-300 cursor-pointer shadow-sm'
                                  : 'bg-slate-900/40 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>İnşa Et</span>
                            </button>
                          </div>
                        </div>

                        {/* Cost Requirement Badges */}
                        <div className="flex items-center gap-2 mt-1 text-[10.5px] font-mono font-medium">
                          <span className={currentPlanet.resources.ore >= stats.cost.ore ? 'text-slate-300' : 'text-rose-400 font-bold'}>
                            {stats.cost.ore} Cevher
                          </span>
                          {stats.cost.crystal > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className={currentPlanet.resources.crystal >= stats.cost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                                {stats.cost.crystal} Kristal
                              </span>
                            </>
                          )}
                          {stats.cost.fuel > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className={currentPlanet.resources.fuel >= stats.cost.fuel ? 'text-amber-300' : 'text-rose-400 font-bold'}>
                                {stats.cost.fuel} Yakıt
                              </span>
                            </>
                          )}
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            {Math.round(stats.buildTimeMs / 1000)}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Buildings List (Scrollable) */}
      {activeTab === 'buildings' && (
      <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2 text-xs font-mono scrollbar-none">
        {/* Colony Development Tier Banner */}
        {(() => {
          const pops = currentPlanet.pops ?? (currentPlanet.isHomeworld ? 10 : 2);
          const tier =
            pops >= 15
              ? { name: 'Galaktik Metropol', icon: '🌌', color: '#c084fc', bonus: '+%30 Tüm Çıktılar', unlockedSlots: 6 }
              : pops >= 10
              ? { name: 'Sanayi Dünyası', icon: '🏙️', color: '#38bdf8', bonus: '+%20 Maden & Tersane Çıktısı', unlockedSlots: 5 }
              : pops >= 5
              ? { name: 'Gelişmiş Koloni', icon: '🏢', color: '#34d399', bonus: '+%10 Madencilik Verimi', unlockedSlots: 4 }
              : { name: 'Öncü Karakol', icon: '🏕️', color: '#fbbf24', bonus: 'Temel Altyapı Desteği', unlockedSlots: 3 };

          const nextTierThreshold = pops < 5 ? 5 : pops < 10 ? 10 : pops < 15 ? 15 : null;

          return (
            <div className="p-2.5 rounded-sm bg-[#050e18] border border-[#18374b] mb-2 font-mono">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: tier.color }}>
                  <span>{tier.icon}</span>
                  <span>{tier.name}</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-bold bg-[#071220] px-1.5 py-0.5 rounded-sm border border-[#1b3d54]">
                  {tier.unlockedSlots} / 6 Bina Slotu Açık
                </span>
              </div>
              <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                <span className="text-emerald-400 font-medium">{tier.bonus}</span>
                {nextTierThreshold && (
                  <span className="text-amber-300">
                    Sonraki Seviye: {pops}/{nextTierThreshold} Pop
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-1">
          GEZEGEN ALTYAPISI & ÜRETİM
        </div>

        {buildingsList.map((type, idx) => {
          const stats = BUILDING_STATS[type];
          const currentLevel = currentPlanet.buildings[type] || 0;
          const isQueueActive = currentPlanet.buildingQueue?.type === type;
          const nextCost = getBuildingUpgradeCost(type, currentLevel);

          const pops = currentPlanet.pops ?? (currentPlanet.isHomeworld ? 10 : 2);
          const unlockedSlots = pops >= 15 ? 6 : pops >= 10 ? 5 : pops >= 5 ? 4 : 3;
          const isLockedByPop = idx >= unlockedSlots && currentLevel === 0;
          const requiredPops = idx === 3 ? 5 : idx === 4 ? 10 : 15;

          const canAfford =
            currentPlanet.resources.ore >= nextCost.ore &&
            currentPlanet.resources.crystal >= nextCost.crystal &&
            currentPlanet.resources.fuel >= nextCost.fuel;

          const isAnyUpgrading = !!currentPlanet.buildingQueue;

          // Calculate upgrade countdown if active
          let remainingMs = 0;
          let progressPercent = 0;
          if (isQueueActive && currentPlanet.buildingQueue) {
            const total = currentPlanet.buildingQueue.finishTime - currentPlanet.buildingQueue.startTime;
            const elapsed = currentTimeMs - currentPlanet.buildingQueue.startTime;
            remainingMs = Math.max(0, currentPlanet.buildingQueue.finishTime - currentTimeMs);
            progressPercent = Math.min(100, Math.round((elapsed / total) * 100));
          }

          return (
            <div
              key={type}
              className={`p-2.5 rounded-sm stellaris-item-card transition-all ${
                isQueueActive ? '!border-cyan-400/70 shadow-sm shadow-cyan-950/40' : ''
              } ${isLockedByPop ? 'opacity-70 bg-[#060c14]/60' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-display">
                    {stats.nameTr}
                  </span>
                  <span className="text-[10.5px] font-mono text-cyan-300 font-bold bg-[#07101a] px-1.5 py-0.5 rounded-sm border border-[#19384c]">
                    Sv. {currentLevel}
                  </span>
                  {(type === 'ore_mine' || type === 'crystal_synth' || type === 'fuel_refinery') && currentLevel > 0 && (
                    <span className="text-[10.5px] font-mono text-emerald-400 font-bold">
                      +{calculateHourlyProduction(type === 'ore_mine' ? 'ore' : type === 'crystal_synth' ? 'crystal' : 'fuel', currentLevel)}/s
                    </span>
                  )}
                </div>

                {/* Action Buttons: Shortcuts & Upgrade */}
                <div className="flex items-center gap-1.5">
                  {type === 'shipyard' && currentLevel > 0 && onOpenShipyard && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenShipyard();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium stellaris-btn-metallic text-cyan-300 cursor-pointer"
                      title="Tersane Üretim Panelini Aç (F2)"
                    >
                      <Rocket className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Tersane</span>
                    </button>
                  )}
                  {type === 'research_lab' && currentLevel > 0 && onOpenResearch && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenResearch();
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium stellaris-btn-metallic text-amber-300 cursor-pointer"
                      title="Teknoloji Araştırma Ağacını Aç (F3)"
                    >
                      <Compass className="w-2.5 h-2.5 text-amber-400" />
                      <span>Ar-Ge</span>
                    </button>
                  )}

                  {/* Upgrade Button, Lock Badge or Countdown */}
                  {isQueueActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{formatDuration(remainingMs)}</span>
                    </div>
                  ) : isLockedByPop ? (
                    <span className="text-[9.5px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-sm">
                      🔒 {requiredPops} Pop Gerekli
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford || isAnyUpgrading}
                      onClick={() => {
                        sound.playConstruction();
                        onUpgradeBuilding(currentPlanet.id, type);
                      }}
                      className="stellaris-btn-metallic flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium text-cyan-300 transition-all cursor-pointer"
                    >
                      <ArrowUpCircle className="w-3 h-3" />
                      <span>Yükselt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar for active upgrade with laser shimmer */}
              {isQueueActive && (
                <div className="w-full h-1.5 bg-[#060c14] rounded-full overflow-hidden my-1.5 border border-cyan-500/30 relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white transition-all duration-300 relative shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white animate-pulse" />
                  </div>
                </div>
              )}

              {/* Cost requirement badges */}
              {isLockedByPop ? (
                <div className="text-[10px] font-mono text-amber-300/90 mt-1 flex items-center gap-1.5 bg-amber-950/30 p-1 rounded-sm border border-amber-500/20">
                  <span>🔒</span>
                  <span>Bu altyapıyı kurabilmek için koloni nüfusunu <strong>{requiredPops} Pop</strong> seviyesine ulaştırın.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono font-medium">
                  <span className={currentPlanet.resources.ore >= nextCost.ore ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                    {nextCost.ore} Cevher
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className={currentPlanet.resources.crystal >= nextCost.crystal ? 'text-cyan-300' : 'text-rose-400 font-bold'}>
                    {nextCost.crystal} Kristal
                  </span>
                  {nextCost.fuel > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className={currentPlanet.resources.fuel >= nextCost.fuel ? 'text-amber-300' : 'text-rose-400 font-bold'}>
                        {nextCost.fuel} Yakıt
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Garrison Fleet Stationed Roster */}
        <div className="pt-2">
          <div className="text-[10px] font-mono stellaris-gold uppercase font-bold tracking-wider mb-2">
            GEZEGEN GARNİZON FİLOSU
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => {
              const count = currentPlanet.garrison[st] || 0;
              const names: Record<ShipType, string> = {
                scout: 'Keşif Gemisi',
                transport: 'Ağır Nakliye',
                fighter: 'Savaş Avcısı',
                battleship: 'Harp Kruvazörü',
              };

              return (
                <div
                  key={st}
                  className="stellaris-item-card rounded-sm p-2 flex items-center justify-between"
                >
                  <span className="text-xs text-slate-200 font-medium">{names[st]}</span>
                  <span className="text-sm font-mono font-bold text-cyan-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orbital Defense Platforms Stationed Roster */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>YÖRÜNGE SAVUNMA BATARYALARI</span>
            </span>
            {currentPlanet.defenseQueue && currentPlanet.defenseQueue.length > 0 && (
              <span className="text-[10px] font-mono text-emerald-300 animate-pulse font-bold">
                {currentPlanet.defenseQueue.reduce((a, b) => a + (b.count - b.completed), 0)} İnşa Ediliyor
              </span>
            )}
          </div>

          {currentPlanet.specialization === 'military_bastion' && (
            <div className="mb-2 text-[9.5px] font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
              <span>🛡️</span>
              <span><strong>Askeri Hisar:</strong> Taret Ateş Gücü +%25, Garnizon Koruması %60, Dayanıklılık +%25</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">🚀</span>
              <span className="text-[11px] text-slate-200 font-medium">Füze</span>
              <span className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                {currentPlanet.defenses?.missile_battery || 0}
              </span>
            </div>
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">🔥</span>
              <span className="text-[11px] text-slate-200 font-medium">Plazma</span>
              <span className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                {currentPlanet.defenses?.plasma_turret || 0}
              </span>
            </div>
            <div className="stellaris-item-card rounded-sm p-2 flex flex-col items-center text-center">
              <span className="text-base mb-0.5">⚡</span>
              <span className="text-[11px] text-slate-200 font-medium">İyon</span>
              <span className="text-sm font-mono font-bold text-purple-300 mt-0.5">
                {currentPlanet.defenses?.ion_cannon || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </aside>
  );
};

export const PlanetPanel = React.memo(PlanetPanelComponent);
