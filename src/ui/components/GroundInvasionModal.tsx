import React, { useState } from 'react';
import {
  Shield,
  Swords,
  Crosshair,
  Flame,
  Users,
  Cpu,
  Skull,
  Dna,
  Bot,
  AlertTriangle,
  X,
  Target,
  PlaneTakeoff,
  PlaneLanding,
  Flag,
  Activity,
  Award,
  Zap,
} from 'lucide-react';
import {
  GameState,
  Army,
  ArmyType,
  ArmyRank,
  BombardmentStance,
  GroundCombatBattle,
} from '../../engine/types';
import {
  ARMY_CONFIGS,
  BOMBARDMENT_CONFIGS,
  getRankMultiplier,
} from '../../engine/groundWarfare';
import { sound } from '../sound';

export interface GroundInvasionModalProps {
  state: GameState;
  activePlayerId?: string;
  playerId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onRecruitArmy?: (planetId: string, armyType: ArmyType, customName?: string) => void;
  onEmbarkArmies?: (planetId: string, fleetId?: string, armyIds?: string[]) => void;
  onLandArmies?: (fleetId: string, targetPlanetId: string) => void;
  onSetBombardmentStance?: (fleetId: string, stance: BombardmentStance, targetPlanetId?: string) => void;
  onDismissArmy?: (armyId: string) => void;
  onLiberatePlanet?: (planetId: string) => void;
}

export const GroundInvasionModal: React.FC<GroundInvasionModalProps> = ({
  state,
  activePlayerId,
  playerId,
  isOpen = true,
  onClose,
  onRecruitArmy,
  onEmbarkArmies,
  onLandArmies,
  onSetBombardmentStance,
  onDismissArmy,
  onLiberatePlanet,
}) => {
  const currentUserId = activePlayerId || playerId || Object.keys(state.players)[0];
  const [activeTab, setActiveTab] = useState<'battles' | 'barracks' | 'bombardment' | 'occupied'>('battles');

  const playerPlanets = Object.values(state.planets).filter((p) => p.ownerId === currentUserId);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(playerPlanets[0]?.id || '');

  const myFleets = Object.values(state.fleets).filter((f) => f.ownerId === currentUserId);
  const orbitingFleets = myFleets.filter((f) => f.status === 'orbiting');
  const [selectedFleetId, setSelectedFleetId] = useState<string>(orbitingFleets[0]?.id || myFleets[0]?.id || '');

  if (!isOpen) return null;

  const currentPlanet = state.planets[selectedPlanetId] || playerPlanets[0];
  const currentFleet = state.fleets[selectedFleetId];

  // Active ground battles
  const allBattles = Object.values(state.groundBattles || {});
  const activeBattles = allBattles.filter((b) => b.status === 'active');

  // Armies stationed on selected planet
  const planetArmies = Object.values(state.armies || {}).filter(
    (a) => a.planetId === currentPlanet?.id
  );

  // Armies embarked on selected fleet
  const fleetArmies = (currentFleet?.embarkedArmyIds || [])
    .map((id) => state.armies?.[id])
    .filter((a): a is Army => !!a);

  // Occupied worlds in galaxy
  const occupiedWorlds = Object.values(state.planets).filter(
    (p) => p.occupierId && p.occupierId !== p.ownerId
  );

  const getArmyIcon = (type: ArmyType) => {
    switch (type) {
      case 'defense_militia':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'assault_infantry':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'mechanized_armor':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'xenomorph_swarm':
        return <Skull className="w-4 h-4 text-purple-400" />;
      case 'gene_warriors':
        return <Dna className="w-4 h-4 text-cyan-400" />;
      case 'robotic_warforms':
        return <Bot className="w-4 h-4 text-red-400" />;
    }
  };

  const getRankBadge = (rank: ArmyRank) => {
    switch (rank) {
      case 'legendary':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">★ Efsanevi</span>;
      case 'elite':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">◆ Elit</span>;
      case 'veteran':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded">▲ Kıdemli</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-700/40 text-slate-300 border border-slate-600/40 rounded">● Er</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b1322]/95 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/40 text-slate-100 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900/60 to-slate-900/40 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 shadow-inner">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide text-white">
                  Kara Harekâtları & Orbital Kuşatma
                </h2>
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-full font-semibold">
                  Faz 30: Gezegen İstilası
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gezegen garnizonları, taarruz birlikleri, orbital topçu doktrinleri ve cephe muharebeleri
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('battles');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'battles'
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Kara Muharebeleri</span>
            {activeBattles.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-full font-bold animate-pulse">
                {activeBattles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('barracks');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'barracks'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Kışla & Ordu Eğitimi</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('bombardment');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'bombardment'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Orbital Bombardıman</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('occupied');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'occupied'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>İşgal Altındaki Dünyalar</span>
            {occupiedWorlds.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-600 text-white rounded-full font-bold">
                {occupiedWorlds.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: BATTLES */}
          {activeTab === 'battles' && (
            <div className="space-y-6">
              {activeBattles.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Crosshair className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">
                    Aktif Kara Muharebesi Yok
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Şu anda galakside süregelen bir gezegen çıkarması veya cephe çatışması bulunmuyor.
                    Düşman gezegenine çıkarma yapmak için ordularınızı bir filoya yükleyip yörüngeden indirin.
                  </p>
                </div>
              ) : (
                activeBattles.map((battle) => {
                  const attackerPlayer = state.players[battle.attackerId];
                  const defenderPlayer = state.players[battle.defenderId];
                  const planet = state.planets[battle.planetId];

                  const attackerArmies = battle.attackerArmyIds
                    .map((id) => state.armies?.[id])
                    .filter((a): a is Army => !!a);

                  const defenderArmies = battle.defenderArmyIds
                    .map((id) => state.armies?.[id])
                    .filter((a): a is Army => !!a);

                  return (
                    <div
                      key={battle.id}
                      className="bg-slate-900/70 border border-red-500/40 rounded-xl p-5 space-y-4 shadow-lg shadow-red-950/20"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400">
                            <Crosshair className="w-5 h-5 animate-spin" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              {battle.planetName} İstila Muharebesi
                              <span className="text-xs px-2 py-0.5 bg-red-500/30 text-red-200 rounded font-normal">
                                Ön Hat Genişliği: {battle.frontlineWidth}
                              </span>
                            </h3>
                            <div className="text-xs text-slate-400 flex items-center gap-4 mt-0.5">
                              <span>Saldıran: <strong className="text-red-300">{attackerPlayer?.name || battle.attackerId}</strong></span>
                              <span>Savunan: <strong className="text-blue-300">{defenderPlayer?.name || battle.defenderId}</strong></span>
                              <span>Tahribat: <strong className="text-amber-300">%{Math.round(planet?.devastation || 0)}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-red-400 font-bold uppercase tracking-wider block">
                            Canlı Çatışma
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Kayıplar: {battle.attackerCasualties} A / {battle.defenderCasualties} S
                          </span>
                        </div>
                      </div>

                      {/* Frontline Visual Clash */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Attacker Frontline */}
                        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 space-y-2">
                          <div className="text-xs font-bold text-red-300 flex items-center justify-between">
                            <span>Saldırı Kolu ({attackerArmies.length} Birlik)</span>
                            <span className="text-[10px] text-red-400">Ön Hat & Rezerv</span>
                          </div>
                          <div className="space-y-1.5">
                            {attackerArmies.slice(0, 4).map((army) => (
                              <div
                                key={army.id}
                                className="bg-slate-900/80 border border-slate-700/60 rounded p-2 text-xs flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {getArmyIcon(army.type)}
                                  <span className="font-semibold text-white">{army.name}</span>
                                  {getRankBadge(army.rank)}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full"
                                      style={{ width: `${Math.round((army.health / army.maxHealth) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-300">
                                    {Math.round(army.health)} HP
                                  </span>
                                  {army.isDisrouted && (
                                    <span className="px-1 text-[9px] bg-red-600 text-white rounded font-bold">
                                      BOZGUN
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Defender Frontline */}
                        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 space-y-2">
                          <div className="text-xs font-bold text-blue-300 flex items-center justify-between">
                            <span>Savunma Garnizonu ({defenderArmies.length} Birlik)</span>
                            <span className="text-[10px] text-blue-400">Siper Hattı</span>
                          </div>
                          <div className="space-y-1.5">
                            {defenderArmies.slice(0, 4).map((army) => (
                              <div
                                key={army.id}
                                className="bg-slate-900/80 border border-slate-700/60 rounded p-2 text-xs flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {getArmyIcon(army.type)}
                                  <span className="font-semibold text-white">{army.name}</span>
                                  {getRankBadge(army.rank)}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-blue-500 h-full"
                                      style={{ width: `${Math.round((army.health / army.maxHealth) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-300">
                                    {Math.round(army.health)} HP
                                  </span>
                                  {army.isDisrouted && (
                                    <span className="px-1 text-[9px] bg-red-600 text-white rounded font-bold">
                                      BOZGUN
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Combat Log */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto space-y-1">
                        {battle.combatLog.slice(-5).map((log, i) => (
                          <div key={i} className="text-slate-400">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: BARRACKS & RECRUITMENT */}
          {activeTab === 'barracks' && (
            <div className="space-y-6">
              {/* Planet Selector */}
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Gezegen Seçin:
                </span>
                <select
                  value={selectedPlanetId}
                  onChange={(e) => setSelectedPlanetId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {playerPlanets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isHomeworld ? '(Ana Dünya)' : ''} — ⛏️ {Math.round(p.resources.ore)} 💎 {Math.round(p.resources.crystal)} ⛽ {Math.round(p.resources.fuel)}
                    </option>
                  ))}
                </select>
                {currentPlanet?.armyQueue && (
                  <span className="text-xs text-amber-400 font-medium animate-pulse ml-auto">
                    ⏳ Eğitim Devam Ediyor: {ARMY_CONFIGS[currentPlanet.armyQueue.armyType]?.nameTr}
                  </span>
                )}
              </div>

              {/* Stationed Armies on this Planet */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Mevcut Garnizon ve Konuşlu Birlikler ({planetArmies.length})
                  </h3>
                  {planetArmies.some((a) => !a.isGarrisonOnly) && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onEmbarkArmies?.(currentPlanet.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg hover:bg-blue-600/50 transition-colors"
                    >
                      <PlaneTakeoff className="w-3.5 h-3.5" />
                      Yörüngedeki Filoya Yükle
                    </button>
                  )}
                </div>

                {planetArmies.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-400">
                    Bu gezegende konuşlu ordu bulunmuyor. Aşağıdan yeni savunma veya taarruz birlikleri eğitebilirsiniz.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {planetArmies.map((army) => {
                      const rankMult = getRankMultiplier(army.rank);
                      return (
                        <div
                          key={army.id}
                          className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getArmyIcon(army.type)}
                              <span className="text-xs font-bold text-white">{army.name}</span>
                              {getRankBadge(army.rank)}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                              <span>HP: {Math.round(army.health)}/{army.maxHealth}</span>
                              <span>Saldırı: {Math.round(army.attackPower * rankMult.attack)}</span>
                              <span>Savunma: {Math.round(army.defensePower * rankMult.defense)}</span>
                              {army.isGarrisonOnly && (
                                <span className="text-[10px] text-emerald-400">(Milis)</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onDismissArmy?.(army.id);
                              }}
                              className="px-2 py-1 text-[11px] bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded transition-colors"
                            >
                              Terhis
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recruitment Catalog */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Ordu Eğitimi & Birlik Tipleri
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(ARMY_CONFIGS) as ArmyType[]).map((type) => {
                    const cfg = ARMY_CONFIGS[type];
                    const canAfford =
                      currentPlanet &&
                      currentPlanet.resources.ore >= cfg.cost.ore &&
                      currentPlanet.resources.crystal >= cfg.cost.crystal &&
                      currentPlanet.resources.fuel >= cfg.cost.fuel;

                    const isBusy = !!currentPlanet?.armyQueue;

                    return (
                      <div
                        key={type}
                        className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getArmyIcon(type)}
                              <span className="text-xs font-bold text-white">{cfg.nameTr}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {cfg.buildTimeMs / 1000}s
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {cfg.descriptionTr}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 pt-1">
                            <span>❤️ {cfg.baseHealth}</span>
                            <span>⚔️ {cfg.baseAttack}</span>
                            <span>🛡️ {cfg.baseDefense}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="text-[11px] text-slate-300 font-mono">
                            ⛏️ {cfg.cost.ore} {cfg.cost.crystal > 0 && `💎 ${cfg.cost.crystal}`} ⛽ {cfg.cost.fuel}
                          </div>
                          <button
                            disabled={!canAfford || isBusy}
                            onClick={() => {
                              sound.playClick();
                              onRecruitArmy?.(currentPlanet.id, type);
                            }}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              canAfford && !isBusy
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Eğit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOMBARDMENT & SIEGE */}
          {activeTab === 'bombardment' && (
            <div className="space-y-6">
              {/* Fleet & Target Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4 text-blue-400" />
                    Kuşatma Filosu Seçin:
                  </span>
                  <select
                    value={selectedFleetId}
                    onChange={(e) => setSelectedFleetId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {myFleets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — Durum: {f.status} ({f.targetSystemId})
                      </option>
                    ))}
                  </select>

                  {currentFleet && (
                    <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
                      <div>Yüklü Ordular: {fleetArmies.length} Taarruz Birligi</div>
                      <div>Aktif Doktrin: <strong className="text-amber-400">{BOMBARDMENT_CONFIGS[currentFleet.bombardmentStance || 'none']?.nameTr}</strong></div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400" />
                    Sistemdeki Gezegenler & Tahribat:
                  </span>

                  {currentFleet && (
                    <div className="space-y-2">
                      {Object.values(state.planets)
                        .filter((p) => p.systemId === currentFleet.targetSystemId)
                        .map((planet) => {
                          const owner = state.players[planet.ownerId];
                          const isEnemy = planet.ownerId !== currentUserId;
                          const devastation = Math.round(planet.devastation || 0);

                          return (
                            <div
                              key={planet.id}
                              className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-white">{planet.name}</span>
                                <span className="text-slate-400 ml-2">
                                  Sahip: {owner?.name || planet.ownerId} {isEnemy ? '(Düşman)' : '(Dost)'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right font-mono">
                                  <span className={`font-bold ${devastation > 50 ? 'text-red-400' : 'text-amber-300'}`}>
                                    %{devastation} Tahribat
                                  </span>
                                </div>
                                {isEnemy && fleetArmies.length > 0 && currentFleet.status === 'orbiting' && (
                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      onLandArmies?.(currentFleet.id, planet.id);
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                                  >
                                    Çıkarma Yap
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

              {/* Bombardment Stance Selector */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Orbital Bombardıman Doktrinleri
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {(['none', 'selective', 'indiscriminate', 'armageddon', 'raiding'] as BombardmentStance[]).map(
                    (stance) => {
                      const cfg = BOMBARDMENT_CONFIGS[stance];
                      const isCurrent = currentFleet?.bombardmentStance === stance;

                      return (
                        <div
                          key={stance}
                          className={`bg-slate-900/60 border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                            isCurrent ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{cfg.nameTr}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{cfg.descriptionTr}</p>
                            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300 pt-1">
                              <span>Ordu Hasarı: {cfg.armyDamagePerSec}/sn</span>
                              <span>Tahribat: +{cfg.devastationPerSec}%/sn</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                            <button
                              disabled={isCurrent || !currentFleet || currentFleet.status !== 'orbiting'}
                              onClick={() => {
                                sound.playClick();
                                const targetPlanet = Object.values(state.planets).find(
                                  (p) => p.systemId === currentFleet?.targetSystemId && p.ownerId !== currentUserId
                                );
                                onSetBombardmentStance?.(currentFleet.id, stance, targetPlanet?.id);
                              }}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                !isCurrent && currentFleet?.status === 'orbiting'
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              Doktrini Uygula
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OCCUPIED WORLDS */}
          {activeTab === 'occupied' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-400" />
                İşgal Altındaki Gezegenler & Haraç Akışı
              </h3>

              {occupiedWorlds.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                  Şu an galakside işgal altında olan bir koloni bulunmuyor. Tüm dünyalar meşru sahiplerinin kontrolünde.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {occupiedWorlds.map((planet) => {
                    const originalOwner = state.players[planet.ownerId];
                    const occupier = state.players[planet.occupierId!];
                    const isMyOccupied = planet.ownerId === currentUserId;
                    const isOccupiedByMe = planet.occupierId === currentUserId;

                    return (
                      <div
                        key={planet.id}
                        className={`bg-slate-900/70 border rounded-xl p-4 space-y-3 ${
                          isMyOccupied
                            ? 'border-red-500/60 bg-red-950/20'
                            : isOccupiedByMe
                            ? 'border-emerald-500/60 bg-emerald-950/20'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{planet.name}</h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              isMyOccupied
                                ? 'bg-red-500/30 text-red-200'
                                : isOccupiedByMe
                                ? 'bg-emerald-500/30 text-emerald-200'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            %{Math.round(planet.devastation || 0)} Tahribat
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1 font-mono">
                          <div>Asıl Sahip: <strong>{originalOwner?.name || planet.ownerId}</strong></div>
                          <div>İşgalci Güç: <strong className="text-amber-400">{occupier?.name || planet.occupierId}</strong></div>
                          <div className="text-[11px] text-slate-400">
                            Üretim Kaybı: %50 haraç işgalciye aktarılıyor
                          </div>
                        </div>

                        {isMyOccupied && (
                          <div className="pt-2 border-t border-slate-800 flex justify-end">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onLiberatePlanet?.(planet.id);
                              }}
                              className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                              Gezegeni Kurtar (Kurtarma Harekâtı)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
