import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Eye,
  Plus,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { GameState, Player, Resources } from '../../engine/types';
import { sound } from '../sound';

export type AllianceTab = 'members' | 'treasury' | 'logistics' | 'defense';

interface AllianceModalProps {
  state: GameState;
  activePlayerId: string;
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
  onCreateAlliance: (name: string, tag: string) => void;
  onJoinAlliance: (allianceId: string) => void;
  onLeaveAlliance: () => void;
  onSupportAlly: (targetSystemId: string, planetId: string) => void;
  onDonateToAlliance?: (planetId: string, resources: Resources) => void;
  onWithdrawFromAlliance?: (planetId: string, resources: Resources) => void;
  onTransferToAlly?: (sourcePlanetId: string, targetPlanetId: string, resources: Resources) => void;
}

const AllianceModalComponent: React.FC<AllianceModalProps> = ({
  state,
  activePlayerId,
  isOpen,
  isDocked = false,
  onClose,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onSupportAlly,
  onDonateToAlliance,
  onWithdrawFromAlliance,
  onTransferToAlly,
}) => {
  const [activeTab, setActiveTab] = useState<AllianceTab>('members');
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Treasury form state
  const [depositOre, setDepositOre] = useState(100);
  const [depositCrystal, setDepositCrystal] = useState(50);
  const [depositFuel, setDepositFuel] = useState(25);
  const [withdrawOre, setWithdrawOre] = useState(50);
  const [withdrawCrystal, setWithdrawCrystal] = useState(25);
  const [withdrawFuel, setWithdrawFuel] = useState(10);

  // Logistics shipment form state
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const [selectedSourcePlanetId, setSelectedSourcePlanetId] = useState<string>(myPlanets[0]?.id || '');
  const [selectedTargetPlanetId, setSelectedTargetPlanetId] = useState<string>('');
  const [shipOre, setShipOre] = useState(100);
  const [shipCrystal, setShipCrystal] = useState(50);
  const [shipFuel, setShipFuel] = useState(20);

  if (!isOpen) return null;

  const player = state.players[activePlayerId];
  const myAlliance = player?.allianceId ? state.alliances[player.allianceId] : null;
  const allAlliances = Object.values(state.alliances);

  // Treasury numbers
  const treasury: Resources = myAlliance?.treasury || { ore: 0, crystal: 0, fuel: 0 };
  const sourcePlanet = state.planets[selectedSourcePlanetId] || myPlanets[0];

  // All allied planets belonging to members other than me
  const alliedOtherPlanets = myAlliance
    ? Object.values(state.planets).filter(
        (p) => p.ownerId !== activePlayerId && myAlliance.memberIds.includes(p.ownerId)
      )
    : [];

  // Filter recent defense alerts from eventLog
  const defenseEvents = state.eventLog
    .filter(
      (e) =>
        e.type === 'alliance_defense_alert' ||
        e.type === 'alliance_resource_transfer' ||
        e.type === 'alliance_donation' ||
        e.type === 'alliance_withdrawal'
    )
    .slice(-8)
    .reverse();

  const content = (
    <div
      className={
        isDocked
          ? 'w-[540px] min-w-[540px] max-w-[540px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none'
          : 'stellaris-outliner border border-[#1c3647] rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-[#3ca8d1] shadow-inner">
            <Users className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Galaktik İttifaklar & Diplomasi
            </h2>
            <span className="text-[10px] text-[#3ca8d1] font-mono">
              {myAlliance ? `[${myAlliance.tag}] ${myAlliance.name}` : 'Bağımsız Komutan'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all cursor-pointer"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs navigation when active in an alliance */}
      {myAlliance && (
        <div className="flex items-center bg-[#06111c] border-b border-[#18374d] px-3 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('members');
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-cyan-400 text-cyan-300 bg-[#0d263b]/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Üyeler ({myAlliance.memberIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('treasury');
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'treasury'
                ? 'border-amber-400 text-amber-300 bg-[#0d263b]/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Ortak Kasa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('logistics');
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'logistics'
                ? 'border-sky-400 text-sky-300 bg-[#0d263b]/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>Kaynak Sevkiyatı</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('defense');
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'defense'
                ? 'border-rose-400 text-rose-300 bg-[#0d263b]/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ortak Savunma</span>
          </button>
        </div>
      )}

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        {myAlliance ? (
          /* Active Alliance Content */
          <div className="space-y-4">
            {/* Top Summary Card */}
            <div className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#0b2438] text-cyan-300 px-2 py-0.5 rounded-sm border border-[#1c445c]">
                    [{myAlliance.tag}]
                  </span>
                  <h3 className="text-sm font-bold text-white font-display">{myAlliance.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-1.5">
                  <span>{myAlliance.memberIds.length} Üye İmparatorluk</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Eye className="w-3.5 h-3.5" /> Ortak Sensör Ağı Aktif
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onLeaveAlliance();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 text-xs font-mono transition-all shadow-sm cursor-pointer"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Ayrıl</span>
              </button>
            </div>

            {/* TAB 1: MEMBERS */}
            {activeTab === 'members' && (
              <div>
                <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
                  İttifak Üyeleri ve Kolonileri
                </div>
                <div className="space-y-2">
                  {myAlliance.memberIds.map((memberId) => {
                    const member = state.players[memberId];
                    if (!member) return null;
                    const memberPlanets = Object.values(state.planets).filter((p) => p.ownerId === memberId);
                    const isMe = memberId === activePlayerId;

                    return (
                      <div
                        key={memberId}
                        className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                              {member.name}
                              {isMe && (
                                <span className="text-[9.5px] bg-[#0c2438] text-cyan-300 px-1.5 py-0.5 rounded-sm border border-[#1b3e54] font-mono font-bold">
                                  Siz
                                </span>
                              )}
                              {memberId === myAlliance.founderId && (
                                <span className="text-[9.5px] bg-amber-950/60 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-sm font-mono font-bold">
                                  Kurucu
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {memberPlanets.length} Gezegen • {memberPlanets.map((p) => p.name).join(', ')}
                            </div>
                          </div>
                        </div>

                        {/* Support Ally Button */}
                        {!isMe && memberPlanets.length > 0 && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onSupportAlly(memberPlanets[0].systemId, memberPlanets[0].id);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-sm stellaris-btn-metallic text-cyan-200 font-medium text-xs font-mono transition-all cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-[#3ca8d1]" />
                            <span>Destek Gönder</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: TREASURY (ORTAK KASA) */}
            {activeTab === 'treasury' && (
              <div className="space-y-4">
                {/* Treasury Balance Cards */}
                <div className="stellaris-item-card border-[#234b66] p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b3e54] pb-2">
                    <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      İttifak Ortak Rezervleri
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Ortak Fon Havuzu</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#040e1a] border border-[#1b3d54] p-2 rounded-sm">
                      <span className="text-[10px] text-slate-400 block font-mono">Cevher</span>
                      <span className="text-sm font-bold font-mono text-cyan-300">
                        {treasury.ore.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-[#040e1a] border border-[#1b3d54] p-2 rounded-sm">
                      <span className="text-[10px] text-slate-400 block font-mono">Kristal</span>
                      <span className="text-sm font-bold font-mono text-emerald-300">
                        {treasury.crystal.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-[#040e1a] border border-[#1b3d54] p-2 rounded-sm">
                      <span className="text-[10px] text-slate-400 block font-mono">Yakıt</span>
                      <span className="text-sm font-bold font-mono text-amber-300">
                        {treasury.fuel.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deposit into Treasury */}
                <div className="stellaris-item-card border-[#1c3647] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                      Kasaya Bağış Yap / Fon Yatır
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Kaynak: {sourcePlanet?.name || 'Ana Gezegen'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Cevher</label>
                      <input
                        type="number"
                        min={0}
                        max={sourcePlanet?.resources.ore || 0}
                        value={depositOre}
                        onChange={(e) => setDepositOre(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Kristal</label>
                      <input
                        type="number"
                        min={0}
                        max={sourcePlanet?.resources.crystal || 0}
                        value={depositCrystal}
                        onChange={(e) => setDepositCrystal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-emerald-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Yakıt</label>
                      <input
                        type="number"
                        min={0}
                        max={sourcePlanet?.resources.fuel || 0}
                        value={depositFuel}
                        onChange={(e) => setDepositFuel(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-amber-300 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={depositOre <= 0 && depositCrystal <= 0 && depositFuel <= 0}
                    onClick={() => {
                      if (!sourcePlanet || !onDonateToAlliance) return;
                      sound.playClick();
                      onDonateToAlliance(sourcePlanet.id, {
                        ore: depositOre,
                        crystal: depositCrystal,
                        fuel: depositFuel,
                      });
                    }}
                    className="w-full py-1.5 stellaris-btn-metallic text-cyan-200 rounded-sm font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                  >
                    İttifak Kasasına Yatır
                  </button>
                </div>

                {/* Withdraw from Treasury */}
                <div className="stellaris-item-card border-[#1c3647] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                      Kasadan Kaynak Çek
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Hedef: {sourcePlanet?.name || 'Ana Gezegen'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Cevher</label>
                      <input
                        type="number"
                        min={0}
                        max={treasury.ore}
                        value={withdrawOre}
                        onChange={(e) => setWithdrawOre(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Kristal</label>
                      <input
                        type="number"
                        min={0}
                        max={treasury.crystal}
                        value={withdrawCrystal}
                        onChange={(e) => setWithdrawCrystal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-emerald-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Yakıt</label>
                      <input
                        type="number"
                        min={0}
                        max={treasury.fuel}
                        value={withdrawFuel}
                        onChange={(e) => setWithdrawFuel(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-amber-300 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={withdrawOre <= 0 && withdrawCrystal <= 0 && withdrawFuel <= 0}
                    onClick={() => {
                      if (!sourcePlanet || !onWithdrawFromAlliance) return;
                      sound.playClick();
                      onWithdrawFromAlliance(sourcePlanet.id, {
                        ore: withdrawOre,
                        crystal: withdrawCrystal,
                        fuel: withdrawFuel,
                      });
                    }}
                    className="w-full py-1.5 stellaris-btn-metallic text-amber-200 rounded-sm font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                  >
                    Gezegene Kaynak Çek
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LOGISTICS (KAYNAK SEVKİYATI KONVOY) */}
            {activeTab === 'logistics' && (
              <div className="space-y-4">
                <div className="stellaris-item-card border-[#234b66] p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b3e54] pb-2">
                    <span className="text-xs font-bold font-mono text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-400" />
                      Müttefik Koloni Lojistik Konvoyu
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Doğrudan Sevkiyat</span>
                  </div>

                  {alliedOtherPlanets.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-6 text-center font-mono">
                      İttifakta başka üyeye ait aktif bir koloni bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Source Colony */}
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">
                            Kalkış Koloniniz
                          </label>
                          <select
                            value={selectedSourcePlanetId}
                            onChange={(e) => setSelectedSourcePlanetId(e.target.value)}
                            className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#3ca8d1]"
                          >
                            {myPlanets.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (C:{p.resources.ore}, K:{p.resources.crystal}, Y:{p.resources.fuel})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Target Allied Colony */}
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">
                            Hedef Müttefik Kolonisi
                          </label>
                          <select
                            value={selectedTargetPlanetId || alliedOtherPlanets[0]?.id || ''}
                            onChange={(e) => setSelectedTargetPlanetId(e.target.value)}
                            className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#3ca8d1]"
                          >
                            {alliedOtherPlanets.map((p) => {
                              const owner = state.players[p.ownerId];
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} [{owner?.name || 'Müttefik'}]
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Cargo Inputs */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Cevher</label>
                          <input
                            type="number"
                            min={0}
                            value={shipOre}
                            onChange={(e) => setShipOre(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-cyan-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Kristal</label>
                          <input
                            type="number"
                            min={0}
                            value={shipCrystal}
                            onChange={(e) => setShipCrystal(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-emerald-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] font-mono text-slate-400 block mb-1">Yakıt</label>
                          <input
                            type="number"
                            min={0}
                            value={shipFuel}
                            onChange={(e) => setShipFuel(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-2 py-1 text-xs text-amber-300 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={shipOre <= 0 && shipCrystal <= 0 && shipFuel <= 0}
                        onClick={() => {
                          const targetId = selectedTargetPlanetId || alliedOtherPlanets[0]?.id;
                          if (!selectedSourcePlanetId || !targetId || !onTransferToAlly) return;
                          sound.playClick();
                          onTransferToAlly(selectedSourcePlanetId, targetId, {
                            ore: shipOre,
                            crystal: shipCrystal,
                            fuel: shipFuel,
                          });
                        }}
                        className="w-full py-2 stellaris-btn-metallic text-sky-200 rounded-sm font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Truck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Sevkiyat Konvoyunu Başlat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: COMMON DEFENSE (ORTAK SAVUNMA PAKTI) */}
            {activeTab === 'defense' && (
              <div className="space-y-4">
                {/* Status Card */}
                <div className="stellaris-item-card border-emerald-500/40 p-3.5 space-y-2 bg-[#061718]/40">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Ortak Savunma Paktı Aktif</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    İttifak üyesi bir koloniye veya filoya düşman saldırısı başlatıldığında, tüm üye imparatorluklara
                    anlık erken uyarı radar alarmı ve saldırganın konumu iletilir. Müttefikler garnizon desteği
                    sağlayabilir.
                  </p>
                </div>

                {/* Live Tactical Alerts Ticker */}
                <div>
                  <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>İttifak Savunma ve Lojistik Telsiz Akışı</span>
                  </div>

                  {defenseEvents.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-6 text-center font-mono stellaris-item-card border-dashed border-[#1c3647]">
                      Henüz kaydedilmiş bir savunma alarmı veya sevkiyat kaydı yok.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {defenseEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="bg-[#05111d] border border-[#1b3e54] p-2 rounded-sm flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            {evt.type === 'alliance_defense_alert' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span
                              className={
                                evt.type === 'alliance_defense_alert' ? 'text-rose-300 font-bold' : 'text-slate-300'
                              }
                            >
                              {evt.description}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {Math.round(evt.timeMs / 1000)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Not in alliance: Browse & Create */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Herhangi bir ittifakta değilsiniz. Bir ittifaka katılarak ortak sensör görüşü, ortak kasa ve lojistik
                konvoy avantajı kazanın.
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsCreating(!isCreating);
                }}
                className="px-3 py-1.5 rounded-sm stellaris-btn-metallic text-cyan-300 font-bold text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#3ca8d1]" />
                <span>{isCreating ? 'Vazgeç' : 'Yeni İttifak'}</span>
              </button>
            </div>

            {/* Create Form */}
            {isCreating && (
              <div className="stellaris-item-card border-[#234b66] p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                  Yeni İttifak Oluştur
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">İttifak Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: Solaria Federasyonu"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#3ca8d1] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Etiket (Tag)</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="SOL"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full bg-[#07131e] border border-[#18374b] rounded-sm px-3 py-1.5 text-xs text-slate-100 uppercase focus:outline-none focus:border-[#3ca8d1] font-mono font-bold"
                    />
                  </div>
                </div>
                <button
                  disabled={!newName.trim() || !newTag.trim()}
                  onClick={() => {
                    sound.playClick();
                    onCreateAlliance(newName.trim(), newTag.trim());
                    setIsCreating(false);
                  }}
                  className="w-full py-2 stellaris-btn-metallic text-cyan-200 rounded-sm font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                >
                  İttifakı Kur
                </button>
              </div>
            )}

            {/* Public Alliances List */}
            <div>
              <div className="stellaris-section-header px-2 py-1 text-[10px] font-mono uppercase tracking-wider mb-2">
                Sektördeki Mevcut İttifaklar
              </div>

              {allAlliances.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-8 text-center font-mono stellaris-item-card border-dashed border-[#1c3647]">
                  Henüz kurulmuş bir ittifak bulunmuyor. İlk ittifakı siz kurun!
                </div>
              ) : (
                <div className="space-y-2">
                  {allAlliances.map((ally) => (
                    <div
                      key={ally.id}
                      className="stellaris-item-card border-[#1c3647] p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-[#0b2438] text-cyan-300 px-2 py-0.5 rounded-sm border border-[#1c445c]">
                            [{ally.tag}]
                          </span>
                          <span className="text-xs font-bold text-slate-100 font-display">{ally.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                          {ally.memberIds.length} Üye • Kurucu:{' '}
                          {state.players[ally.founderId]?.name || 'Bilinmeyen'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onJoinAlliance(ally.id);
                        }}
                        className="px-3 py-1.5 rounded-sm stellaris-btn-metallic text-cyan-300 font-mono text-xs font-bold cursor-pointer"
                      >
                        Katıl
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isDocked) return content;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200"
    >
      {content}
    </div>
  );
};

export const AllianceModal = React.memo(AllianceModalComponent);
