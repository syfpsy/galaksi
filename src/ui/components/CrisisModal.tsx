import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  CheckCircle2,
  Crosshair,
  Crown,
  Flame,
  Globe2,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { GameState, ShipType } from '../../engine/types';
import { CRISIS_CONFIGS } from '../../engine/crisis';
import { SHIP_STATS } from '../../engine/constants';
import { sound } from '../sound';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  activePlayerId: string;
  activePlanetId?: string;
  onPurifyPlanet: (planetId: string) => void;
  onDonateToGDF: (planetId: string, ships: Record<ShipType, number>) => void;
  onDispatchGDFFleet: (targetSystemId: string, ships: Record<ShipType, number>) => void;
  onAssaultAnchor: (anchorId: string, fleetId: string) => void;
  onAssaultRift: (fleetId: string) => void;
  onTriggerTestCrisis: () => void;
}

type CrisisTab = 'rift_anchors' | 'infestations' | 'gdf_console';

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  state,
  activePlayerId,
  activePlanetId,
  onPurifyPlanet,
  onDonateToGDF,
  onDispatchGDFFleet,
  onAssaultAnchor,
  onAssaultRift,
  onTriggerTestCrisis,
}) => {
  const [activeTab, setActiveTab] = useState<CrisisTab>('rift_anchors');
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [donateFighters, setDonateFighters] = useState<number>(1);
  const [donateBattleships, setDonateBattleships] = useState<number>(0);
  const [dispatchSystemId, setDispatchSystemId] = useState<string>('');

  if (!isOpen) return null;

  const crisis = state.crisis;
  const stage = crisis?.stage || 'dormant';
  const isCustodian = state.senate?.custodianPlayerId === activePlayerId;
  const custodianPlayer = state.senate?.custodianPlayerId
    ? state.players[state.senate.custodianPlayerId]
    : null;

  const activePlanet = activePlanetId
    ? state.planets[activePlanetId]
    : Object.values(state.planets).find((p) => p.ownerId === activePlayerId);

  // Player's available combat fleets
  const playerFleets = Object.values(state.fleets).filter(
    (f) => f.ownerId === activePlayerId && f.status !== 'destroyed'
  );

  const selectedFleet = selectedFleetId
    ? state.fleets[selectedFleetId]
    : playerFleets[0];

  const allAnchorsDestroyed = crisis
    ? crisis.voidAnchors.every((a) => a.destroyed)
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#070b12] border border-rose-500/40 rounded-sm shadow-[0_0_50px_rgba(225,29,72,0.25)] flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Top Crimson Alert Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 animate-pulse" />

        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-[#1b2636] bg-[#0c1322] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-md">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wider text-rose-300 font-mono">
                  GALAKTİK KRİZ // BOYUTLARARASI HİÇLİK İSTİLASI
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border ${
                    stage === 'dormant'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : stage === 'breaching'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse'
                      : stage === 'active'
                      ? 'bg-rose-950 text-rose-300 border-rose-500/80 animate-pulse'
                      : stage === 'apex'
                      ? 'bg-purple-950 text-purple-300 border-purple-500/80 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                  }`}
                >
                  {stage === 'dormant' && 'UYUYAN TEHDİT'}
                  {stage === 'breaching' && 'YARIK AÇILIYOR'}
                  {stage === 'active' && 'AKTİF İSTİLA'}
                  {stage === 'apex' && 'APEX: BEHEMOTH'}
                  {stage === 'defeated' && 'MÜHÜRLENDİ // ZAFER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Galaktik Muhafızlık komuta ağı, Hiçlik Çıpaları ve müşterek savunma filosu (GDF).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Test / Advance button */}
            <button
              onClick={() => {
                sound.playClick();
                onTriggerTestCrisis();
              }}
              className="px-3 py-1.5 rounded-sm bg-rose-900/40 hover:bg-rose-800/60 border border-rose-500/50 text-rose-200 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Test ve deneme amacıyla kriz aşamasını ilerletir"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {stage === 'dormant'
                  ? 'KRİZİ BAŞLAT'
                  : stage === 'active'
                  ? 'APEX AŞAMASINA GEÇ'
                  : stage === 'apex'
                  ? 'KRİZİ ÇÖZ'
                  : 'AŞAMAYI İLERLET'}
              </span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-sm bg-[#111c2e] hover:bg-[#1a2b45] border border-[#213552] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Situation Sub-Banner */}
        <div className="bg-[#0b101c] px-6 py-2 border-b border-[#182333] flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-slate-400">Yarık Bütünlüğü:</span>
              <span className="font-mono font-bold text-rose-300">
                %{crisis?.riftIntegrity ?? 100}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Aktif Çıpalar:</span>
              <span className="font-mono font-bold text-purple-300">
                {crisis ? crisis.voidAnchors.filter((a) => !a.destroyed).length : 0} / 3
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">İstila Altındaki Gezegenler:</span>
              <span className="font-mono font-bold text-amber-300">
                {crisis?.infestedPlanetIds?.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Galaktik Muhafız:</span>
            {custodianPlayer ? (
              <span className="font-bold text-amber-300 font-mono">
                {custodianPlayer.name} (+%20 Ateş Gücü)
              </span>
            ) : (
              <span className="text-slate-500 italic font-mono">Seçilmedi</span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-[#1b2636] bg-[#080d17] flex gap-2 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('rift_anchors');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-sm transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'rift_anchors'
                ? 'bg-[#0f172a] text-rose-300 border-rose-500/60 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>HİÇLİK YARIĞI & ÇIPALAR</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('infestations');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-sm transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'infestations'
                ? 'bg-[#0f172a] text-amber-300 border-amber-500/60 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            <span>İSTİLA EDİLMİŞ DÜNYALAR ({crisis?.infestedPlanetIds?.length || 0})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('gdf_console');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-sm transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'gdf_console'
                ? 'bg-[#0f172a] text-cyan-300 border-cyan-500/60 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>GALAKTİK SAVUNMA FİLOSU (GDF)</span>
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: RIFT & ANCHORS */}
          {activeTab === 'rift_anchors' && (
            <div className="space-y-6">
              {/* Epicenter Dimensional Rift Terminal Card */}
              <div className="p-5 rounded-sm bg-[#0d1424] border border-rose-500/30 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-mono text-xs font-bold tracking-widest uppercase">
                        MERKEZ ÜS // BOYUT KIRIĞI
                      </span>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-sm bg-rose-950 text-rose-300 border border-rose-500/40 font-mono">
                        {state.map.systems[crisis?.epicenterSystemId || '']?.name || 'Merkez Rölesi'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      Boyutlararası Hiçlik Yarığı (Dimensional Rift)
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Karanlık maddeden beslenen bu devasa yarık, Hiçlik Çıpaları tarafından beslenen aşılamaz bir alt-uzay kalkanı ile korunmaktadır. Yarığı mühürlemek için önce tüm çıpalar yok edilmeli, ardından belirecek Kadim Hiçlik Behemotu alt edilmelidir.
                    </p>
                  </div>

                  {/* Rift Assault Action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">Taarruz Filosu:</span>
                      <select
                        value={selectedFleetId || (playerFleets[0]?.id || '')}
                        onChange={(e) => setSelectedFleetId(e.target.value)}
                        className="bg-[#090e18] border border-[#23354d] text-xs font-mono px-2 py-1 rounded-sm text-cyan-300"
                      >
                        {playerFleets.map((fl) => (
                          <option key={fl.id} value={fl.id}>
                            {fl.name} ({fl.ships.fighter || 0} Avcı, {fl.ships.battleship || 0} Kruvazör)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      disabled={!allAnchorsDestroyed || stage !== 'apex'}
                      onClick={() => {
                        sound.playClick();
                        const fleetToUse = selectedFleet || playerFleets[0];
                        if (fleetToUse) onAssaultRift(fleetToUse.id);
                      }}
                      className={`px-5 py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 shadow-md ${
                        allAnchorsDestroyed && stage === 'apex'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 animate-pulse cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Swords className="w-4 h-4" />
                      <span>YARIĞA NİHAİ TAARRUZ ET</span>
                    </button>
                    {!allAnchorsDestroyed && (
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        * Tüm çıpalar imha edilmeden kalkan aşılamaz
                      </span>
                    )}
                  </div>
                </div>

                {/* Rift Gauge */}
                <div className="mt-4 pt-4 border-t border-[#1b283d] flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Yarık Kalkan Bütünlüğü:</span>
                    <span className="font-bold text-rose-300">%{crisis?.riftIntegrity ?? 100}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#090d16] rounded-full overflow-hidden border border-[#23354d]">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-rose-500 transition-all duration-500"
                      style={{ width: `${crisis?.riftIntegrity ?? 100}%` }}
                    />
                  </div>
                </div>

                {/* Boss Bar if in Apex */}
                {stage === 'apex' && (
                  <div className="mt-4 p-3 rounded-sm bg-purple-950/40 border border-purple-500/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-purple-300 font-bold flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4 text-purple-400 animate-pulse" />
                        KADİM HİÇLİK BEHEMOTU (VOID BEHEMOTH)
                      </span>
                      <span className="text-rose-400 font-bold">
                        HP: {crisis?.behemothHp} / {crisis?.behemothMaxHp} | Zırh: {crisis?.behemothShield}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#090d16] rounded-full overflow-hidden border border-purple-500/40">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-rose-600 transition-all duration-300"
                        style={{
                          width: `${Math.round(((crisis?.behemothHp || 0) / (crisis?.behemothMaxHp || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Anchors Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                    Hiçlik Çıpaları Dizinleri (Void Anchors)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ödül: Çıpa başına +50 Hegemonya Puanı
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(crisis?.voidAnchors || []).map((anchor) => {
                    const isDestroyed = anchor.destroyed;
                    const sysName = state.map.systems[anchor.systemId]?.name || anchor.systemId;

                    return (
                      <div
                        key={anchor.id}
                        className={`p-4 rounded-sm border flex flex-col justify-between transition-all ${
                          isDestroyed
                            ? 'bg-[#080d14]/70 border-slate-800 opacity-60'
                            : 'bg-[#0c1322] border-rose-500/30 shadow-md hover:border-rose-400/60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                              {sysName}
                            </span>
                            <span
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase ${
                                isDestroyed
                                  ? 'bg-slate-800 text-slate-500'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                              }`}
                            >
                              {isDestroyed ? 'İMHA EDİLDİ' : 'AKTİF ÇIPA'}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-white tracking-wide">
                            {anchor.name}
                          </h5>

                          {/* Stats */}
                          {!isDestroyed && (
                            <div className="space-y-1.5 pt-1 text-xs font-mono">
                              <div className="flex justify-between text-[11px] text-slate-300">
                                <span>Gövde / Kalkan:</span>
                                <span className="text-rose-300">
                                  {anchor.hp} / {anchor.shield}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Savunma Filosu:</span>
                                <span className="text-cyan-300">
                                  {anchor.defenseFleet.fighter} Avcı, {anchor.defenseFleet.battleship} Kruvazör
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <div className="mt-4 pt-3 border-t border-[#182333]">
                          {isDestroyed ? (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Etkisiz Hale Getirildi</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                sound.playClick();
                                const fleetToUse = selectedFleet || playerFleets[0];
                                if (fleetToUse) onAssaultAnchor(anchor.id, fleetToUse.id);
                              }}
                              className="w-full py-2 rounded-sm bg-rose-900/40 hover:bg-rose-800/70 border border-rose-500/50 text-rose-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>ÇIPAYA TAARRUZ ET</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INFESTED WORLDS */}
          {activeTab === 'infestations' && (
            <div className="space-y-4">
              <div className="p-4 rounded-sm bg-[#0c1322] border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-amber-400" />
                    Hiçlik Sporları & Gezegen İstilaları
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    İstila edilen gezegenlerde üretim %50 oranında düşer. Yörüngeden orbital arındırma ışınları uygulanarak gezegen kurtarılabilir.
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-amber-300">
                  Arındırma Maliyeti: 100 Maden, 300 Kristal, 150 Yakıt
                </div>
              </div>

              {(!crisis?.infestedPlanetIds || crisis.infestedPlanetIds.length === 0) ? (
                <div className="p-12 text-center rounded-sm bg-[#080d16] border border-[#1b2636] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h5 className="text-sm font-bold text-white">İstila Altında Gezegen Yok</h5>
                  <p className="text-xs text-slate-400">
                    Galaksideki tüm koloniler ve keşfedilmiş dünyalar temiz durumda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {crisis.infestedPlanetIds.map((pId) => {
                    const planet = state.planets[pId];
                    if (!planet) return null;
                    const sysName = state.map.systems[planet.systemId]?.name || planet.systemId;
                    const isOwnedByMe = planet.ownerId === activePlayerId;

                    return (
                      <div
                        key={pId}
                        className="p-4 rounded-sm bg-[#0c1322] border border-amber-500/40 flex flex-col justify-between shadow-md"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                              {sysName} SEKTÖRÜ
                            </span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-sm bg-amber-950 text-amber-300 border border-amber-500/60 font-mono font-bold animate-pulse">
                              İSTİLA ALTINDA (%-50 ÜRETİM)
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-white tracking-wide">
                            {planet.name}
                          </h5>

                          <div className="text-xs text-slate-400 font-mono">
                            Sahibi: {planet.ownerId ? (state.players[planet.ownerId]?.name || planet.ownerId) : 'Sahipsiz / Doğal'}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#182333]">
                          <button
                            onClick={() => {
                              sound.playClick();
                              onPurifyPlanet(planet.id);
                            }}
                            className="w-full py-2 rounded-sm bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/60 text-amber-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>ORBİTAL ARINDIRMA UYGULA (+25 Hegemonya)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GDF CONSOLE */}
          {activeTab === 'gdf_console' && (
            <div className="space-y-6">
              {/* Custodian Status Banner */}
              <div className="p-5 rounded-sm bg-[#0c1527] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                      Galaktik Muhafızlık Makamı (Galactic Custodianship)
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    {custodianPlayer ? custodianPlayer.name : 'Atanmış Muhafız Bulunmuyor'}
                  </h4>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Galaktik Senato tarafından seçilen Muhafız Lideri, krizle mücadelede tüm donanmalara +%20 taarruz gücü bonusu sağlar ve Galaktik Savunma Filosu'nu (GDF) doğrudan sevk etme yetkisine sahiptir.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono text-xs shrink-0">
                  <span className="text-slate-400">Yetki Statünüz:</span>
                  <span
                    className={`font-bold px-2 py-1 rounded-sm border ${
                      isCustodian
                        ? 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isCustodian ? '👑 AKTİF GALAKTİK MUHAFIZ' : 'ÜYE İMPARATORLUK'}
                  </span>
                </div>
              </div>

              {/* GDF Ship Pool Overview */}
              <div className="p-4 rounded-sm bg-[#080d16] border border-[#1b2636] space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Galaktik Savunma Filosu Havuzu (Müşterek Donanma)
                  </h5>
                  <span className="text-[11px] font-mono text-cyan-300">
                    Toplam Gemi: {(crisis?.gdfFleetUnits?.scout || 0) + (crisis?.gdfFleetUnits?.fighter || 0) + (crisis?.gdfFleetUnits?.battleship || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-sm bg-[#0d1424] border border-[#1f2e45] text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Keşif Gemisi</span>
                    <p className="text-lg font-bold font-mono text-white mt-1">
                      {crisis?.gdfFleetUnits?.scout || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-sm bg-[#0d1424] border border-[#1f2e45] text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Avcı Gemisi</span>
                    <p className="text-lg font-bold font-mono text-cyan-300 mt-1">
                      {crisis?.gdfFleetUnits?.fighter || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-sm bg-[#0d1424] border border-[#1f2e45] text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Kruvazör / Savaş</span>
                    <p className="text-lg font-bold font-mono text-amber-300 mt-1">
                      {crisis?.gdfFleetUnits?.battleship || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Operations Columns: Donate Ships vs Dispatch Fleet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Donate Ships Form */}
                <div className="p-4 rounded-sm bg-[#0c1322] border border-[#1e2d42] space-y-3">
                  <h5 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    GDF Havuzuna Gemi Bağışla
                  </h5>
                  <p className="text-xs text-slate-300">
                    {activePlanet ? activePlanet.name : 'Koloni'} garnizonundaki gemilerinizi ortak havuza devrederek diplomatik itibar ve Hegemonya Puanı kazanın.
                  </p>

                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Avcı Gemisi (Mevcut: {activePlanet?.garrison?.fighter || 0}):
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={activePlanet?.garrison?.fighter || 0}
                        value={donateFighters}
                        onChange={(e) => setDonateFighters(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 bg-[#070b12] border border-[#23354d] text-cyan-300 px-2 py-1 rounded-sm text-right"
                      >
                      </input>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Kruvazör (Mevcut: {activePlanet?.garrison?.battleship || 0}):
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={activePlanet?.garrison?.battleship || 0}
                        value={donateBattleships}
                        onChange={(e) => setDonateBattleships(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 bg-[#070b12] border border-[#23354d] text-amber-300 px-2 py-1 rounded-sm text-right"
                      >
                      </input>
                    </div>
                  </div>

                  <button
                    disabled={!activePlanet || (donateFighters <= 0 && donateBattleships <= 0)}
                    onClick={() => {
                      sound.playClick();
                      if (activePlanet) {
                        onDonateToGDF(activePlanet.id, {
                          scout: 0,
                          transport: 0,
                          fighter: donateFighters,
                          battleship: donateBattleships,
                        });
                        setDonateFighters(0);
                        setDonateBattleships(0);
                      }
                    }}
                    className={`w-full py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      activePlanet && (donateFighters > 0 || donateBattleships > 0)
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>GDF'YE BAĞIŞLA</span>
                  </button>
                </div>

                {/* Dispatch GDF Fleet (Custodian command) */}
                <div className="p-4 rounded-sm bg-[#0c1322] border border-[#1e2d42] space-y-3">
                  <h5 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    GDF Filosunu Sevk Et (Muhafız Emri)
                  </h5>
                  <p className="text-xs text-slate-300">
                    Havuzdaki müşterek gemileri seçtiğiniz bir hedef sektöre taarruz veya savunma amacıyla sevk edin.
                  </p>

                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Hedef Yıldız Sistemi:</span>
                      <select
                        value={dispatchSystemId || Object.keys(state.map.systems)[0]}
                        onChange={(e) => setDispatchSystemId(e.target.value)}
                        className="bg-[#070b12] border border-[#23354d] text-xs font-mono px-2.5 py-1.5 rounded-sm text-amber-200"
                      >
                        {Object.values(state.map.systems).map((sys) => (
                          <option key={sys.id} value={sys.id}>
                            {sys.name} {crisis?.epicenterSystemId === sys.id ? '(MERKEZ YARIĞI)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    disabled={!isCustodian || ((crisis?.gdfFleetUnits?.fighter || 0) <= 0 && (crisis?.gdfFleetUnits?.battleship || 0) <= 0)}
                    onClick={() => {
                      sound.playClick();
                      const targetSys = dispatchSystemId || Object.keys(state.map.systems)[0];
                      if (crisis?.gdfFleetUnits) {
                        onDispatchGDFFleet(targetSys, {
                          scout: crisis.gdfFleetUnits.scout || 0,
                          transport: 0,
                          fighter: crisis.gdfFleetUnits.fighter || 0,
                          battleship: crisis.gdfFleetUnits.battleship || 0,
                        });
                      }
                    }}
                    className={`w-full py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isCustodian && ((crisis?.gdfFleetUnits?.fighter || 0) > 0 || (crisis?.gdfFleetUnits?.battleship || 0) > 0)
                        ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-md'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>GDF FİLOSUNU SEVK ET</span>
                  </button>
                  {!isCustodian && (
                    <span className="text-[10px] text-amber-400/80 font-mono block text-center">
                      * Yalnızca seçilmiş Galaktik Muhafız GDF filosunu sevk edebilir
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1b2636] bg-[#070b14] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Kriz Aşama Kodu: {stage.toUpperCase()}</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-sm bg-[#162236] hover:bg-[#1f304d] text-slate-300 text-xs font-mono transition-colors"
          >
            KAPAT
          </button>
        </div>
      </div>
    </div>
  );
};
