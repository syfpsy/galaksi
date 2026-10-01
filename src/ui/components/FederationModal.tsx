import React, { useState } from 'react';
import {
  FederationFleetContributionType,
  FederationState,
  FederationSuccessionType,
  FederationType,
  FederationWarVoteType,
  GameState,
  ShipType,
} from '../../engine/types';
import {
  FEDERATION_TYPE_CONFIGS,
  getFederalFleetPower,
  getPlayerFederation,
} from '../../engine/federations';
import { sound } from '../sound';

interface FederationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  playerId: string;
  onFormFederation: (name: string, fedType: FederationType, invitedPlayerId: string) => void;
  onInviteToFederation: (federationId: string, targetPlayerId: string) => void;
  onRespondFederationInvite: (federationId: string, accept: boolean) => void;
  onLeaveFederation: (federationId: string) => void;
  onProposeFederationLaw: (
    federationId: string,
    lawType: 'successionType' | 'warVoteType' | 'fleetContribution',
    proposedValue: string
  ) => void;
  onVoteFederationLaw: (federationId: string, vote: 'yes' | 'no') => void;
  onAssignFederationEnvoys: (federationId: string, envoys: number) => void;
  onBuildFederalShip: (federationId: string, planetId: string, shipType: ShipType, count: number) => void;
  onDispatchFederalFleet: (
    federationId: string,
    originPlanetId: string,
    targetSystemId: string,
    ships: Record<ShipType, number>
  ) => void;
  onSelectSystem?: (systemId: string) => void;
}

export const FederationModal: React.FC<FederationModalProps> = ({
  isOpen,
  onClose,
  state,
  playerId,
  onFormFederation,
  onInviteToFederation,
  onRespondFederationInvite,
  onLeaveFederation,
  onProposeFederationLaw,
  onVoteFederationLaw,
  onAssignFederationEnvoys,
  onBuildFederalShip,
  onDispatchFederalFleet,
  onSelectSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'laws' | 'fleet'>('overview');

  // Form Federation states
  const [newName, setNewName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<FederationType>('galactic_union');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // Invite states
  const [inviteTargetId, setInviteTargetId] = useState<string>('');

  // Ship production states
  const [shipTypeToBuild, setShipTypeToBuild] = useState<ShipType>('fighter');
  const [shipCountToBuild, setShipCountToBuild] = useState<number>(1);
  const [buildPlanetId, setBuildPlanetId] = useState<string>('');

  // Fleet dispatch states
  const [dispatchTargetSystemId, setDispatchTargetSystemId] = useState<string>('');
  const [dispatchFighters, setDispatchFighters] = useState<number>(0);
  const [dispatchBattleships, setDispatchBattleships] = useState<number>(0);

  if (!isOpen) return null;

  const currentFed = getPlayerFederation(state, playerId);
  const myPlayer = state.players[playerId];

  // Candidates for founding or inviting (other players not in a federation)
  const candidatePartners = Object.values(state.players).filter(
    (p) => p.id !== playerId && !p.federationId
  );

  // My shipyards for federal ship construction
  const myShipyards = Object.values(state.planets).filter(
    (p) => p.ownerId === playerId && (p.buildings?.shipyard || 0) >= 1
  );

  const selectedBuildPlanet = state.planets[buildPlanetId] || myShipyards[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950/95 border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase">
                  {currentFed ? currentFed.name : 'Galaktik Federasyonlar'}
                </h2>
                {currentFed && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border border-cyan-400/40 bg-cyan-950/60 text-cyan-300">
                    Seviye {currentFed.centralizationLevel} {FEDERATION_TYPE_CONFIGS[currentFed.type]?.nameTr.split(' ')[0]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {currentFed
                  ? `Başkan: ${state.players[currentFed.presidentId]?.name || 'Bilinmiyor'} • ${currentFed.members.length} Üye Devlet`
                  : 'Çok taraflı koalisyonlar kurun, ortak federal donanmayı yönetin ve merkezi yasalar çıkarın.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('overview');
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ {currentFed ? 'Federasyon Durumu & Merkezileşme' : 'Federasyon Kur / Katıl'}
          </button>
          {currentFed && (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('laws');
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 relative ${
                  activeTab === 'laws'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚖️ Federal Yasalar & Yönetim
                {currentFed.activeVote && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute right-1 top-2" />
                )}
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('fleet');
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'fleet'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🚀 Federal Donanma & Tersane
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-800 text-cyan-300 border border-cyan-800/40">
                  {Object.values(currentFed.federalFleet).reduce((a, b) => a + b, 0)}/{currentFed.federalFleetCapacity}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {currentFed ? (
                /* IN A FEDERATION: Active Overview & Centralization Track */
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Federation Type Card */}
                    <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{FEDERATION_TYPE_CONFIGS[currentFed.type]?.icon}</span>
                        <div>
                          <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Federasyon Türü</span>
                          <h4 className="text-base font-bold text-cyan-200">{FEDERATION_TYPE_CONFIGS[currentFed.type]?.nameTr.split(' ')[0]}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{FEDERATION_TYPE_CONFIGS[currentFed.type]?.perksTr}</p>
                    </div>

                    {/* Cohesion Meter */}
                    <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Federal Uyum (Cohesion)</span>
                          <span className={`text-sm font-bold ${currentFed.cohesion >= 50 ? 'text-emerald-400' : currentFed.cohesion >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {Math.round(currentFed.cohesion)} / 100
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 mt-2 overflow-hidden border border-slate-700">
                          <div
                            className={`h-full transition-all duration-500 ${
                              currentFed.cohesion >= 50
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                                : currentFed.cohesion >= 0
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-rose-600 to-rose-400'
                            }`}
                            style={{ width: `${Math.max(5, (currentFed.cohesion + 100) / 2)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {currentFed.cohesion >= 75
                          ? '🌟 Mükemmel Uyum: +3.0 XP / dk hızlanma'
                          : currentFed.cohesion >= 40
                          ? '⚖️ Kararlı Denge: +1.5 XP / dk ilerleme'
                          : '⚠️ Düşük Uyum: Seviye gerileme riski!'}
                      </p>
                    </div>

                    {/* Centralization & Level */}
                    <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Merkezileşme Seviyesi</span>
                          <span className="text-sm font-bold text-cyan-300">Kademe {currentFed.centralizationLevel} / 5</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 mt-2 overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentFed.experience / 1000) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-2">
                        XP: {Math.round(currentFed.experience)} / 1000 • Seviye {currentFed.centralizationLevel} avantajları devrede
                      </span>
                    </div>

                    {/* Presidency Card */}
                    <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-900/60 flex flex-col justify-between">
                      <div>
                        <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Dönem Başkanı</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl">👑</span>
                          <span className="text-sm font-bold text-amber-300">
                            {state.players[currentFed.presidentId]?.name || 'Başkan'}
                          </span>
                          {currentFed.presidentId === playerId && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-950/80 text-amber-300 border border-amber-600/40 font-bold">
                              Siz
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Veraset Kuralı: <span className="text-cyan-300 font-semibold capitalize">{currentFed.laws.successionType}</span>
                      </p>
                    </div>
                  </div>

                  {/* Centralization Tier Roadmap Bar */}
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Federal Merkezileşme Kademeleri & Kazanımlar
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((tier) => {
                        const isUnlocked = currentFed.centralizationLevel >= tier;
                        const isCurrent = currentFed.centralizationLevel === tier;
                        return (
                          <div
                            key={tier}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              isCurrent
                                ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                                : isUnlocked
                                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                                : 'border-slate-800 bg-slate-950/40 opacity-50'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-300">Seviye {tier}</div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {tier === 1 && 'Rotasyonel Veraset'}
                              {tier === 2 && 'Diplomatik Veraset & %10 Filo Katkısı'}
                              {tier === 3 && 'Donanma Gücü Veraseti & Ortak Görüş'}
                              {tier === 4 && 'Zenginlik Veraseti & %30 Filo'}
                              {tier === 5 && 'En Yüksek Seviye Veto & Galaktik Radar'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Members List & Envoy Assignment */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                        👥 Federasyon Üye Devletleri ({currentFed.members.length})
                      </h4>
                      {/* Invite new candidate dropdown */}
                      {candidatePartners.length > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={inviteTargetId}
                            onChange={(e) => setInviteTargetId(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="">İmparatorluk Davet Et...</option>
                            {candidatePartners.map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.name} ({cand.botArchetype || 'oyuncu'})
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={!inviteTargetId}
                            onClick={() => {
                              sound.playLaunch();
                              onInviteToFederation(currentFed.id, inviteTargetId);
                              setInviteTargetId('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-colors"
                          >
                            Davet Gönder
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentFed.members.map((memberId) => {
                        const m = state.players[memberId];
                        const isPres = currentFed.presidentId === memberId;
                        const isMe = memberId === playerId;
                        const envoys = currentFed.assignedEnvoys[memberId] || 0;

                        return (
                          <div
                            key={memberId}
                            className={`p-4 rounded-xl border flex items-center justify-between ${
                              isPres
                                ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/60'
                                : 'border-slate-800 bg-slate-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full border border-slate-600 shadow"
                                style={{ backgroundColor: m?.color || '#00f3ff' }}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-100">{m?.name || 'Üye'}</span>
                                  {isPres && (
                                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                                      Başkan
                                    </span>
                                  )}
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40">
                                      Siz
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 capitalize">
                                  Arketip: {m?.botArchetype || 'İnsan Oyuncu'}
                                </span>
                              </div>
                            </div>

                            {/* Envoy Controls for current player */}
                            {isMe ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Atanan Elçi:</span>
                                <div className="flex items-center gap-1">
                                  {[0, 1, 2, 3].map((count) => (
                                    <button
                                      key={count}
                                      onClick={() => {
                                        sound.playClick();
                                        onAssignFederationEnvoys(currentFed.id, count);
                                      }}
                                      className={`w-6 h-6 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                                        envoys === count
                                          ? 'bg-cyan-600 text-white font-bold'
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {count}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">
                                Atanan Elçi: <span className="font-semibold text-slate-200">{envoys}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leave Federation Button */}
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        sound.playNotification();
                        onLeaveFederation(currentFed.id);
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition-colors"
                    >
                      🚪 Federasyondan Ayrıl
                    </button>
                  </div>
                </div>
              ) : (
                /* NOT IN A FEDERATION: Form or Join UI */
                <div className="space-y-6">
                  {/* Pending Invites Alert */}
                  {state.federations &&
                    Object.values(state.federations).some((f) => f.pendingInvites?.includes(playerId)) && (
                      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-3">
                        <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                          📬 Bekleyen Federasyon Katılım Daveti!
                        </h4>
                        {Object.values(state.federations)
                          .filter((f) => f.pendingInvites?.includes(playerId))
                          .map((f) => (
                            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                              <div>
                                <h5 className="text-sm font-bold text-slate-100">{f.name}</h5>
                                <p className="text-xs text-slate-400">{FEDERATION_TYPE_CONFIGS[f.type]?.nameTr}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    onRespondFederationInvite(f.id, false);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                  Reddet
                                </button>
                                <button
                                  onClick={() => {
                                    sound.playLaunch();
                                    onRespondFederationInvite(f.id, true);
                                  }}
                                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                                >
                                  Kabul Et
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                  {/* Form New Federation Section */}
                  <div className="p-6 rounded-xl border border-cyan-500/30 bg-slate-900/50 space-y-5">
                    <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      🌐 Yeni Bir Galaktik Federasyon Kur
                    </h3>

                    {/* Federation Name & Partner Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Federasyon İsmi
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={`${myPlayer?.name || 'Galaksi'} Birliği`}
                          className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Kurucu Ortak İmparatorluk (Davet Edilen)
                        </label>
                        <select
                          value={selectedPartnerId}
                          onChange={(e) => setSelectedPartnerId(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Ortak Seçin...</option>
                          {candidatePartners.map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              {cand.name} ({cand.botArchetype || 'oyuncu'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Federation Type Cards */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Federasyon Doktrini & Arketipi
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(Object.keys(FEDERATION_TYPE_CONFIGS) as FederationType[]).map((typeKey) => {
                          const cfg = FEDERATION_TYPE_CONFIGS[typeKey];
                          const isSel = selectedType === typeKey;
                          return (
                            <button
                              key={typeKey}
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setSelectedType(typeKey);
                              }}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                isSel
                                  ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400'
                                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{cfg.icon}</span>
                                <h4 className="text-sm font-bold text-slate-100">{cfg.nameTr.split(' ')[0]}</h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{cfg.descriptionTr}</p>
                              <div className="text-[11px] text-cyan-300 font-medium mt-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                                {cfg.perksTr}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        disabled={!selectedPartnerId}
                        onClick={() => {
                          sound.playLaunch();
                          onFormFederation(newName, selectedType, selectedPartnerId);
                        }}
                        className="px-6 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 shadow-lg shadow-cyan-950/50 transition-all"
                      >
                        Federasyonu Resmen Kur
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: LAWS & GOVERNANCE */}
          {activeTab === 'laws' && currentFed && (
            <div className="space-y-6">
              {/* Active Vote Banner */}
              {currentFed.activeVote ? (
                <div className="p-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase text-amber-400 font-bold tracking-wider">Aktif Yasa Oylaması</span>
                      <h4 className="text-base font-bold text-slate-100">
                        {currentFed.activeVote.lawType} Değişikliği: "{currentFed.activeVote.proposedValue}"
                      </h4>
                      <p className="text-xs text-slate-400">
                        Öneren: {state.players[currentFed.activeVote.proposerId]?.name || 'Üye'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Oy Dağılımı</div>
                        <div className="text-sm font-bold text-slate-200">
                          👍 {Object.values(currentFed.activeVote.votes).filter((v) => v === 'yes').length} / 👎{' '}
                          {Object.values(currentFed.activeVote.votes).filter((v) => v === 'no').length}
                        </div>
                      </div>
                      {/* Voting buttons if not voted yet */}
                      {currentFed.activeVote.votes[playerId] === undefined ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              sound.playClick();
                              onVoteFederationLaw(currentFed.id, 'yes');
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          >
                            Kabul (Evet)
                          </button>
                          <button
                            onClick={() => {
                              sound.playClick();
                              onVoteFederationLaw(currentFed.id, 'no');
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                          >
                            Ret (Hayır)
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          Oyunuz: {currentFed.activeVote.votes[playerId] === 'yes' ? 'Evet' : 'Hayır'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 3 Law Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Succession Law */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      👑 Başkanlık Veraseti
                    </h4>
                    <span className="text-xs font-bold text-amber-300 capitalize">{currentFed.laws.successionType}</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { type: 'rotation', label: 'Rotasyon', desc: 'Her 10 dakikada sırayla sonraki üyeye geçer.', minLvl: 1 },
                      { type: 'diplomatic_weight', label: 'Diplomatik Ağırlık', desc: 'Senatoda en yüksek ağırlığa sahip üye başkan olur.', minLvl: 2 },
                      { type: 'fleet_power', label: 'Donanma Gücü', desc: 'En güçlü uzay filosuna sahip üye başkan olur.', minLvl: 3 },
                      { type: 'golden_rule', label: 'Altın Kural (Hazine)', desc: 'En zengin rezerv hazinesine sahip üye başkan olur.', minLvl: 4 },
                    ].map((opt) => {
                      const isCurrent = currentFed.laws.successionType === opt.type;
                      const canPropose = currentFed.centralizationLevel >= opt.minLvl;
                      return (
                        <div
                          key={opt.type}
                          className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                            isCurrent
                              ? 'border-cyan-500/60 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-900/30'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{opt.label}</div>
                            <div className="text-[11px] text-slate-400">{opt.desc}</div>
                          </div>
                          {!isCurrent && (
                            <button
                              disabled={!canPropose || !!currentFed.activeVote}
                              onClick={() => {
                                sound.playClick();
                                onProposeFederationLaw(currentFed.id, 'successionType', opt.type);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-30 border border-slate-700"
                            >
                              Öner
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. War Voting Law */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      ⚔️ Savaş İlanı Oylaması
                    </h4>
                    <span className="text-xs font-bold text-amber-300 capitalize">{currentFed.laws.warVoteType}</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { type: 'majority', label: 'Oy Çokluğu (>%50)', desc: 'Üyelerin yarıdan fazlası kabul etmelidir.', minLvl: 1 },
                      { type: 'unanimous', label: 'Oy Birliği (%100)', desc: 'Tüm üyelerin istisnasız onayı gerekir.', minLvl: 1 },
                      { type: 'president_only', label: 'Başkanın Mutlak Yetkisi', desc: 'Başkan tek başına savaş ilan edebilir.', minLvl: 3 },
                    ].map((opt) => {
                      const isCurrent = currentFed.laws.warVoteType === opt.type;
                      const canPropose = currentFed.centralizationLevel >= opt.minLvl;
                      return (
                        <div
                          key={opt.type}
                          className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                            isCurrent
                              ? 'border-cyan-500/60 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-900/30'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{opt.label}</div>
                            <div className="text-[11px] text-slate-400">{opt.desc}</div>
                          </div>
                          {!isCurrent && (
                            <button
                              disabled={!canPropose || !!currentFed.activeVote}
                              onClick={() => {
                                sound.playClick();
                                onProposeFederationLaw(currentFed.id, 'warVoteType', opt.type);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-30 border border-slate-700"
                            >
                              Öner
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Fleet Contribution Law */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      🚀 Donanma Katkısı
                    </h4>
                    <span className="text-xs font-bold text-amber-300 capitalize">{currentFed.laws.fleetContribution}</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { type: 'none', label: 'Katkı Yok (%0)', desc: 'Üyeler federal donanmaya kapasite aktarmaz.', minLvl: 1 },
                      { type: 'low', label: 'Düşük Katkı (%10)', desc: 'Garnizonların %10 kadarı federal havuza eklenir.', minLvl: 1 },
                      { type: 'medium', label: 'Orta Katkı (%20)', desc: 'Garnizonların %20 kadarı federal havuza eklenir.', minLvl: 3 },
                      { type: 'high', label: 'Yüksek Katkı (%30)', desc: 'Garnizonların %30 kadarı federal havuza eklenir.', minLvl: 4 },
                    ].map((opt) => {
                      const isCurrent = currentFed.laws.fleetContribution === opt.type;
                      const canPropose = currentFed.centralizationLevel >= opt.minLvl;
                      return (
                        <div
                          key={opt.type}
                          className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                            isCurrent
                              ? 'border-cyan-500/60 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-900/30'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{opt.label}</div>
                            <div className="text-[11px] text-slate-400">{opt.desc}</div>
                          </div>
                          {!isCurrent && (
                            <button
                              disabled={!canPropose || !!currentFed.activeVote}
                              onClick={() => {
                                sound.playClick();
                                onProposeFederationLaw(currentFed.id, 'fleetContribution', opt.type);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-30 border border-slate-700"
                            >
                              Öner
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FEDERAL FLEET & SHIPYARD */}
          {activeTab === 'fleet' && currentFed && (
            <div className="space-y-6">
              {/* Fleet Overview & Capacity Bar */}
              <div className="p-5 rounded-xl border border-cyan-500/20 bg-slate-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      🚀 Federal Donanma Durumu
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tüm üyelerin en gelişmiş teknolojileriyle üretilmiş müşterek askeri güç.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Toplam Askeri Güç</span>
                    <div className="text-lg font-bold text-amber-300">
                      ⚡ {getFederalFleetPower(currentFed)} Güç
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Donanma Kapasitesi</span>
                    <span className="font-bold text-cyan-300">
                      {Object.values(currentFed.federalFleet).reduce((a, b) => a + b, 0)} / {currentFed.federalFleetCapacity} Gemi
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (Object.values(currentFed.federalFleet).reduce((a, b) => a + b, 0) /
                            currentFed.federalFleetCapacity) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Composite Technology Badges */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold">Birleşik Teknoloji Düzeyi:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    Motor: Seviye {currentFed.compositeTechLevels.engines}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    Silah: Seviye {currentFed.compositeTechLevels.weapons}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    Sensör: Seviye {currentFed.compositeTechLevels.sensors}
                  </span>
                </div>
              </div>

              {/* Federal Fleet Units Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['scout', 'transport', 'fighter', 'battleship'] as ShipType[]).map((st) => (
                  <div key={st} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
                    <span className="text-2xl">
                      {st === 'scout' && '🛰️'}
                      {st === 'transport' && '🚢'}
                      {st === 'fighter' && '🚀'}
                      {st === 'battleship' && '🛸'}
                    </span>
                    <h5 className="text-xs uppercase text-slate-400 font-semibold mt-1 capitalize">{st}</h5>
                    <div className="text-xl font-bold text-cyan-300 mt-1">{currentFed.federalFleet[st] || 0}</div>
                  </div>
                ))}
              </div>

              {/* Build Ships & Dispatch Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Build Federal Ship Panel */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    🛠️ Federal Gemi İnşası (%20 Federal İndirim)
                  </h4>

                  {myShipyards.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                          İnşa Gezegeni (Tersane)
                        </label>
                        <select
                          value={buildPlanetId}
                          onChange={(e) => setBuildPlanetId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                        >
                          {myShipyards.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Cevher: {p.resources.ore}, Kristal: {p.resources.crystal})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Gemi Sınıfı
                          </label>
                          <select
                            value={shipTypeToBuild}
                            onChange={(e) => setShipTypeToBuild(e.target.value as ShipType)}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                          >
                            <option value="scout">Scout (Gözcü)</option>
                            <option value="fighter">Fighter (Avcı)</option>
                            <option value="battleship">Battleship (Kruvazör)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Adet</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={shipCountToBuild}
                            onChange={(e) => setShipCountToBuild(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (selectedBuildPlanet) {
                              sound.playLaunch();
                              onBuildFederalShip(currentFed.id, selectedBuildPlanet.id, shipTypeToBuild, shipCountToBuild);
                            }
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                        >
                          Federal Gemi Üret
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Gemi inşa etmek için Tersane binasına sahip bir gezegeniniz olmalıdır.</p>
                  )}
                </div>

                {/* 2. Dispatch Federal Fleet Panel (Only President) */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      🌟 Federal Görev Gücü Sevk Et
                    </h4>
                    {currentFed.presidentId !== playerId && (
                      <span className="text-[11px] text-amber-400 font-semibold">Yalnızca Başkan</span>
                    )}
                  </div>

                  {currentFed.presidentId === playerId ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                          Hedef Yıldız Sistemi
                        </label>
                        <select
                          value={dispatchTargetSystemId}
                          onChange={(e) => setDispatchTargetSystemId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                        >
                          <option value="">Hedef Sistem Seçin...</option>
                          {Object.values(state.map.systems).map((sys) => (
                            <option key={sys.id} value={sys.id}>
                              {sys.name} {sys.hasRelay ? '📡 (Röle)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Fighter ({currentFed.federalFleet.fighter || 0})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={currentFed.federalFleet.fighter || 0}
                            value={dispatchFighters}
                            onChange={(e) => setDispatchFighters(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Battleship ({currentFed.federalFleet.battleship || 0})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={currentFed.federalFleet.battleship || 0}
                            value={dispatchBattleships}
                            onChange={(e) => setDispatchBattleships(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          disabled={!dispatchTargetSystemId || (dispatchFighters === 0 && dispatchBattleships === 0)}
                          onClick={() => {
                            const myHw = Object.values(state.planets).find((p) => p.ownerId === playerId && p.isHomeworld);
                            if (myHw && dispatchTargetSystemId) {
                              sound.playLaunch();
                              onDispatchFederalFleet(currentFed.id, myHw.id, dispatchTargetSystemId, {
                                scout: 0,
                                transport: 0,
                                fighter: dispatchFighters,
                                battleship: dispatchBattleships,
                              });
                              setDispatchFighters(0);
                              setDispatchBattleships(0);
                            }
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors"
                        >
                          Federal Filoyu Sevk Et
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Federal donanma yalnızca mevcut Federasyon Başkanı ({state.players[currentFed.presidentId]?.name}) tarafından sevk edilebilir.
                    </p>
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
