import React, { useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Crosshair,
  Flame,
  Globe,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  ColossusShip,
  ColossusWeaponType,
  GameState,
  Planet,
} from '../../engine/types';
import { sound } from '../sound';
import { formatSimClock } from '../timeUtils';
import {
  COLOSSUS_CONSTANTS,
  COLOSSUS_WEAPON_CONFIGS,
  canBuildColossus,
} from '../../engine/colossus';

interface ColossusModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onBuildColossus?: (weaponType: ColossusWeaponType, originPlanetId: string) => void;
  onMoveColossus?: (colossusId: string, targetSystemId: string) => void;
  onCommenceCharging?: (colossusId: string, targetPlanetId: string) => void;
  onCancelFiring?: (colossusId: string) => void;
  onRefitWeapon?: (colossusId: string, newWeaponType: ColossusWeaponType) => void;
  onDismantleColossus?: (colossusId: string) => void;
  onSelectSystem?: (systemId: string) => void;
}

export const ColossusModal: React.FC<ColossusModalProps> = ({
  state,
  activePlayerId: propActivePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onBuildColossus,
  onMoveColossus,
  onCommenceCharging,
  onCancelFiring,
  onRefitWeapon,
  onDismantleColossus,
  onSelectSystem,
}) => {
  const activePlayerId = playerId || propActivePlayerId || '';
  if (isOpen === false) return null;

  const player = state.players[activePlayerId];
  const colossus: ColossusShip | null =
    player?.colossusId && state.colossi ? state.colossi[player.colossusId] || null : null;

  const [activeTab, setActiveTab] = useState<'weapon' | 'refit' | 'navigation' | 'doctrine'>('weapon');
  const [selectedWeaponType, setSelectedWeaponType] = useState<ColossusWeaponType>('world_cracker');
  const [selectedOriginPlanetId, setSelectedOriginPlanetId] = useState<string>('');
  const [selectedTargetPlanetId, setSelectedTargetPlanetId] = useState<string>('');
  const [selectedTargetSystemId, setSelectedTargetSystemId] = useState<string>('');

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const primaryPlanet = playerPlanets[0];
  const originPlanetId = selectedOriginPlanetId || primaryPlanet?.id || '';

  // Hostile / foreign planets in current system
  const currentSystemPlanets = colossus
    ? Object.values(state.planets).filter(
        (p) =>
          p.systemId === colossus.currentSystemId &&
          p.ownerId &&
          p.ownerId !== activePlayerId &&
          !p.isDestroyed &&
          !p.isShielded
      )
    : [];

  const targetPlanetId = selectedTargetPlanetId || currentSystemPlanets[0]?.id || '';

  // Calculate charge progress
  let chargeProgress = 0;
  let chargeRemainingSec = 0;
  if (colossus && colossus.status === 'charging' && colossus.chargeStartedAtMs) {
    const elapsed = state.timeMs - colossus.chargeStartedAtMs;
    chargeProgress = Math.min(100, Math.round((elapsed / colossus.chargeDurationMs) * 100));
    chargeRemainingSec = Math.max(0, Math.ceil((colossus.chargeDurationMs - elapsed) / 1000));
  }

  const activeWeaponConfig = colossus ? COLOSSUS_WEAPON_CONFIGS[colossus.weaponType] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh] bg-[#0c141f]/95 border border-red-500/40 rounded-sm shadow-2xl flex flex-col overflow-hidden text-slate-200 stellaris-outliner relative">
        {/* Glow ambient header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182a3a] bg-[#081018]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-red-950/80 border border-red-500/60 flex items-center justify-center shadow-lg">
              <Skull className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-white font-mono uppercase">
                  KOLOSSUS SÜPER SİLAHI & DÜNYA YOK EDİCİLER
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-red-950 border border-red-500/50 text-red-300">
                  FAZ 25 DOOMSDAY
                </span>
                {colossus?.status === 'charging' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-red-600 text-white animate-pulse">
                    ⚠️ ŞARJ OLUYOR ({chargeRemainingSec}s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Yörüngesel Doomsday Silahları, Gezegensel Yıkım & Topyekûn Savaş (Total War) Doktrini
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-sm bg-slate-800/60 hover:bg-red-900/60 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#182a3a] bg-[#0a121c]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('weapon');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'weapon'
                ? 'border-red-500 text-red-300 bg-red-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Süper Silah & Şarj Durumu
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('refit');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'refit'
                ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Silah Doktrini Tadilatı
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('navigation');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'navigation'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Yıldızlararası İntikal & Hedefleme
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('doctrine');
            }}
            className={`px-4 py-2 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'doctrine'
                ? 'border-purple-500 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Topyekûn Savaş & Senato Etkisi
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          {/* TAB 1: SÜPER SİLAH & ŞARJ DURUMU */}
          {activeTab === 'weapon' && (
            <div className="space-y-6">
              {!colossus ? (
                /* Colossus Construction Section */
                <div className="bg-[#0e1926]/90 border border-slate-700/60 rounded-sm p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-red-400" />
                        KOLOSSUS SÜPER SİLAHI İNŞA EDİN
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        İmparatorluğunuz için gezegen yok edici amiral gemisini tersanede kızağa koyun.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">Gerekli Kaynaklar:</span>
                      <span className="text-amber-300 font-bold">2000 Cevher</span>
                      <span className="text-cyan-300 font-bold">1000 Kristal</span>
                      <span className="text-emerald-300 font-bold">1500 Yakıt</span>
                    </div>
                  </div>

                  {/* Weapon Type Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide">
                      Başlangıç Doomsday Silah Başlığı Seçimi:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(COLOSSUS_WEAPON_CONFIGS) as ColossusWeaponType[]).map((wKey) => {
                        const wCfg = COLOSSUS_WEAPON_CONFIGS[wKey];
                        const isSelected = selectedWeaponType === wKey;
                        return (
                          <div
                            key={wKey}
                            onClick={() => {
                              sound.playClick();
                              setSelectedWeaponType(wKey);
                            }}
                            className={`p-4 rounded-sm border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-red-950/40 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                                : 'bg-[#09131f] border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold text-white font-mono flex items-center gap-2">
                                <span className="text-lg">{wCfg.icon}</span> {wCfg.nameTr}
                              </span>
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: wCfg.beamColor }}
                              />
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed mb-2">
                              {wCfg.descriptionTr}
                            </p>
                            <div className="text-[11px] font-mono text-amber-300/90 pt-1.5 border-t border-slate-800/80">
                              ⚡ Sonuç: {wCfg.outcomeDescriptionTr} (Şarj: {wCfg.chargeTimeSec}s)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Planet Picker & Construct Button */}
                  <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-300 font-bold">İnşa Tersanesi:</span>
                      <select
                        value={originPlanetId}
                        onChange={(e) => setSelectedOriginPlanetId(e.target.value)}
                        className="bg-[#09131f] border border-slate-700 text-xs font-mono text-white px-3 py-1.5 rounded-sm"
                      >
                        {playerPlanets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({state.map.systems[p.systemId]?.name || p.systemId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        if (onBuildColossus) onBuildColossus(selectedWeaponType, originPlanetId);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-mono text-xs font-bold rounded-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Skull className="w-4 h-4" />
                      KOLOSSUS İNŞASINI BAŞLAT
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Colossus Operational HUD */
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-[#0e1926]/90 border border-slate-700/60 rounded-sm p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-sm bg-red-950/60 border border-red-500/80 flex items-center justify-center text-2xl shadow-xl">
                          {activeWeaponConfig?.icon || '💥'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white font-mono">{colossus.name}</h3>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm bg-slate-800 border border-slate-600 text-slate-200">
                              DURUM: {colossus.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Konum:{' '}
                            <span className="text-cyan-300 font-bold">
                              {state.map.systems[colossus.currentSystemId]?.name || colossus.currentSystemId} Sistemi
                            </span>{' '}
                            • Süper Silah:{' '}
                            <span className="text-amber-300 font-bold">{activeWeaponConfig?.nameTr}</span>
                          </p>
                        </div>
                      </div>

                      {/* Hull & Shield Gauges */}
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 flex justify-between mb-1">
                            <span>GÖVDE (HULL)</span>
                            <span className="text-white font-bold">{colossus.hp} / {colossus.maxHp}</span>
                          </div>
                          <div className="w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.round((colossus.hp / colossus.maxHp) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-mono text-slate-400 flex justify-between mb-1">
                            <span>KALKAN (SHIELD)</span>
                            <span className="text-cyan-300 font-bold">{colossus.shield} / {colossus.maxShield}</span>
                          </div>
                          <div className="w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-cyan-400 transition-all duration-300"
                              style={{ width: `${Math.round((colossus.shield / colossus.maxShield) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Charging Sequence HUD */}
                    {colossus.status === 'charging' ? (
                      <div className="mt-6 p-5 bg-red-950/40 border border-red-600 rounded-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-red-300 font-mono font-bold text-sm">
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-ping" />
                            <span>UYARI: SÜPER SİLAH ŞARJ OLUYOR! HEDEF DÜNYA:</span>
                            <span className="text-white underline">
                              {state.planets[colossus.targetPlanetId || '']?.name || 'Bilinmeyen'}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-bold text-red-400">
                            Kalan Süre: {chargeRemainingSec} sn
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-red-500/60 p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 rounded-full transition-all duration-300 animate-pulse"
                            style={{ width: `${chargeProgress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                          <span>Rezonans Odaklanması: %{chargeProgress}</span>
                          <button
                            onClick={() => {
                              sound.playClick();
                              if (onCancelFiring) onCancelFiring(colossus.id);
                            }}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/50 rounded-sm text-xs font-bold cursor-pointer transition-all"
                          >
                            ŞARJI İPTAL ET (ABORT)
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Target Planet Selector & Fire Button */
                      <div className="mt-6 space-y-4">
                        <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center gap-2">
                          <Crosshair className="w-4 h-4 text-red-400" />
                          Mevcut Sistemdeki Düşman Gezegenleri Hedefleyin
                        </h4>

                        {currentSystemPlanets.length === 0 ? (
                          <div className="p-4 bg-[#09131f] border border-slate-800 rounded-sm text-xs font-mono text-slate-400">
                            Bu sistemde vurulabilecek düşman kolonisi bulunmuyor. Kolossusu düşman sistemine sevk etmek için{' '}
                            <span
                              onClick={() => setActiveTab('navigation')}
                              className="text-cyan-400 underline cursor-pointer"
                            >
                              İntikal Sekmesini
                            </span>{' '}
                            kullanın.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentSystemPlanets.map((planet) => {
                              const isTarget = targetPlanetId === planet.id;
                              const targetOwner = state.players[planet.ownerId];
                              return (
                                <div
                                  key={planet.id}
                                  onClick={() => {
                                    sound.playClick();
                                    setSelectedTargetPlanetId(planet.id);
                                  }}
                                  className={`p-4 rounded-sm border cursor-pointer transition-all ${
                                    isTarget
                                      ? 'bg-red-950/40 border-red-500 shadow-md'
                                      : 'bg-[#09131f] border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                                      <Globe className="w-4 h-4 text-slate-400" />
                                      {planet.name}
                                    </span>
                                    <span
                                      className="text-xs font-mono font-bold"
                                      style={{ color: targetOwner?.color || '#ef4444' }}
                                    >
                                      {targetOwner?.name || 'Bilinmeyen'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-mono">
                                    Biyom: {planet.biome || 'Terran'} • Savunma:{' '}
                                    {Object.values(planet.garrison).reduce((a, b) => a + b, 0)} Gemi
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {currentSystemPlanets.length > 0 && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => {
                                sound.playLaunch();
                                if (onCommenceCharging) onCommenceCharging(colossus.id, targetPlanetId);
                              }}
                              className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-mono text-xs font-bold rounded-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Flame className="w-4 h-4" />
                              DOOMSDAY ŞARJINI BAŞLAT
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SİLAH TADİLATI & REFIT */}
          {activeTab === 'refit' && (
            <div className="space-y-6">
              {!colossus ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs bg-[#09131f] border border-slate-800 rounded-sm">
                  Önce bir Kolossus inşa etmelisiniz.
                </div>
              ) : (
                <div className="bg-[#0e1926]/90 border border-slate-700/60 rounded-sm p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-amber-400" />
                        DOOMSDAY SİLAH BAŞLIĞI TADİLATI
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mevcut Silah: <span className="text-amber-300 font-bold">{activeWeaponConfig?.nameTr}</span>
                      </p>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Tadilat Maliyeti: <span className="text-amber-300 font-bold">500 Cevher</span> •{' '}
                      <span className="text-cyan-300 font-bold">400 Kristal</span> •{' '}
                      <span className="text-emerald-300 font-bold">300 Yakıt</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(COLOSSUS_WEAPON_CONFIGS) as ColossusWeaponType[]).map((wKey) => {
                      const wCfg = COLOSSUS_WEAPON_CONFIGS[wKey];
                      const isCurrent = colossus.weaponType === wKey;
                      const isSelected = selectedWeaponType === wKey;

                      return (
                        <div
                          key={wKey}
                          onClick={() => {
                            if (!isCurrent) {
                              sound.playClick();
                              setSelectedWeaponType(wKey);
                            }
                          }}
                          className={`p-4 rounded-sm border transition-all ${
                            isCurrent
                              ? 'bg-emerald-950/20 border-emerald-500/60 opacity-80'
                              : isSelected
                              ? 'bg-amber-950/40 border-amber-500 cursor-pointer shadow-md'
                              : 'bg-[#09131f] border-slate-800 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-white font-mono flex items-center gap-2">
                              <span>{wCfg.icon}</span> {wCfg.nameTr}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-emerald-900 border border-emerald-500 text-emerald-300">
                                MEVCUT SİLAH
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mb-2 leading-relaxed">{wCfg.descriptionTr}</p>
                          <div className="text-[11px] font-mono text-amber-300 pt-1.5 border-t border-slate-800">
                            ⚡ Etki: {wCfg.outcomeDescriptionTr} (Şarj: {wCfg.chargeTimeSec}s)
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedWeaponType !== colossus.weaponType && (
                    <div className="flex justify-end pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          sound.playTech();
                          if (onRefitWeapon) onRefitWeapon(colossus.id, selectedWeaponType);
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-mono text-xs font-bold rounded-sm shadow-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        SİLAH BAŞLIĞINI TADİL ET
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: YILDIZLARARASI İNTİKAL & HEDEFLEME */}
          {activeTab === 'navigation' && (
            <div className="space-y-6">
              {!colossus ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs bg-[#09131f] border border-slate-800 rounded-sm">
                  Önce bir Kolossus inşa etmelisiniz.
                </div>
              ) : (
                <div className="bg-[#0e1926]/90 border border-slate-700/60 rounded-sm p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                        <Compass className="w-5 h-5 text-cyan-400" />
                        HİPERUZAY SEYAHATİ & HEDEF SİSTEM
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mevcut Sistem:{' '}
                        <span className="text-cyan-300 font-bold">
                          {state.map.systems[colossus.currentSystemId]?.name || colossus.currentSystemId}
                        </span>
                      </p>
                    </div>
                    {colossus.status === 'in_transit' && (
                      <span className="text-xs font-mono px-3 py-1 bg-cyan-950 border border-cyan-500 text-cyan-300 animate-pulse rounded-sm">
                        🚀 İNTİKAL HALİNDE ({Math.ceil((colossus.arrivalTime! - state.timeMs) / 1000)} sn kaldı)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.values(state.map.systems).map((sys) => {
                      const isCurrent = colossus.currentSystemId === sys.id;
                      const isSelected = selectedTargetSystemId === sys.id;
                      const planetsInSys = Object.values(state.planets).filter((p) => p.systemId === sys.id);
                      const hasEnemy = planetsInSys.some((p) => p.ownerId && p.ownerId !== activePlayerId);

                      return (
                        <div
                          key={sys.id}
                          onClick={() => {
                            if (!isCurrent) {
                              sound.playClick();
                              setSelectedTargetSystemId(sys.id);
                            }
                          }}
                          className={`p-3.5 rounded-sm border transition-all ${
                            isCurrent
                              ? 'bg-cyan-950/20 border-cyan-500/60'
                              : isSelected
                              ? 'bg-cyan-950/50 border-cyan-400 shadow-md cursor-pointer'
                              : 'bg-[#09131f] border-slate-800 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white font-mono">{sys.name}</span>
                            {hasEnemy && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-red-950 border border-red-500/60 text-red-300">
                                DÜŞMAN VAR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {planetsInSys.length} Koloni Dünyası
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedTargetSystemId && selectedTargetSystemId !== colossus.currentSystemId && (
                    <div className="flex justify-end pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          sound.playLaunch();
                          if (onMoveColossus) onMoveColossus(colossus.id, selectedTargetSystemId);
                        }}
                        disabled={colossus.status === 'charging' || colossus.status === 'in_transit'}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-sm shadow-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4" />
                        KOLOSSUSU SİSTEME SEVK ET (25s)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TOPYEKÛN SAVAŞ & DOKTRİN */}
          {activeTab === 'doctrine' && (
            <div className="space-y-6">
              <div className="bg-[#0e1926]/90 border border-slate-700/60 rounded-sm p-6 space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                    GALAKTİK TOPYEKÛN SAVAŞ (TOTAL WAR) VE DOOMSDAY DOKTRİNİ
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gezegen yok edici silahların varlığı galaktik diplomasinin kurallarını tamamen değiştirir.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#09131f] border border-slate-800 rounded-sm space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 font-mono uppercase flex items-center gap-2">
                      ⚔️ Anlık Sınır Değişimi (Border Flip)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Kolossus sahibi olan veya Kolossus'a karşı savaşan imparatorluklar için barış anlaşması veya hak iddiası gerekmez. İşgal edilen gezegen ve sistemler derhal ele geçiren tarafa geçer.
                    </p>
                  </div>

                  <div className="p-4 bg-[#09131f] border border-slate-800 rounded-sm space-y-2">
                    <h4 className="text-xs font-bold text-red-400 font-mono uppercase flex items-center gap-2">
                      🏛️ Galaktik Senato Yaptırımları
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sivil dünyalara karşı Gezegen Kırıcı veya Nötron Süpürgesi kullanmak Senato nezdinde -30 Diplomatik Ağırlık cezası ve galaksi genelinde -50 ilişki gerilemesi yaratır.
                    </p>
                  </div>
                </div>

                {colossus && (
                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">Kolossus Süper Silahını Hurdaya Ayır</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Silah parçalanır; %50 kaynak iade edilir (+1000 Cevher, +500 Kristal, +750 Yakıt).
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (confirm('Kolossus süper silahını hurdaya ayırmak istediğinize emin misiniz?')) {
                          if (onDismantleColossus) onDismantleColossus(colossus.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/60 text-red-300 rounded-sm font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      KOLOSSUSU PARÇALA (HURDA)
                    </button>
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
