import React, { useState } from 'react';
import {
  Bot,
  Check,
  Compass,
  Dice5,
  Eye,
  EyeOff,
  Flame,
  Globe,
  HelpCircle,
  Orbit,
  Pickaxe,
  Rocket,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Swords,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { sound } from '../sound';

export interface SandboxConfig {
  systemCount: number;
  aiEmpireCount: number;
  resourceTier: 'standard' | 'rich' | 'creative';
  fogOfWar: 'fog' | 'all_visible';
  enableCrises: boolean;
  enablePirates: boolean;
  seed: number;
  godMode?: boolean;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  systemCount: 20,
  aiEmpireCount: 5,
  resourceTier: 'standard',
  fogOfWar: 'fog',
  enableCrises: true,
  enablePirates: true,
  seed: 42,
  godMode: false,
};

interface SandboxSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: SandboxConfig) => void;
  currentConfig?: SandboxConfig;
}

export const SandboxSetupModal: React.FC<SandboxSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentConfig = DEFAULT_SANDBOX_CONFIG,
}) => {
  const [systemCount, setSystemCount] = useState<number>(currentConfig.systemCount || 20);
  const [aiEmpireCount, setAiEmpireCount] = useState<number>(currentConfig.aiEmpireCount ?? 5);
  const [resourceTier, setResourceTier] = useState<'standard' | 'rich' | 'creative'>(
    currentConfig.resourceTier || 'standard'
  );
  const [fogOfWar, setFogOfWar] = useState<'fog' | 'all_visible'>(
    currentConfig.fogOfWar || 'fog'
  );
  const [enableCrises, setEnableCrises] = useState<boolean>(currentConfig.enableCrises ?? true);
  const [enablePirates, setEnablePirates] = useState<boolean>(currentConfig.enablePirates ?? true);
  const [seed, setSeed] = useState<number>(currentConfig.seed || 42);

  if (!isOpen) return null;

  const handleRollSeed = () => {
    sound.playClick();
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  const handleStart = () => {
    sound.playLaunch();
    onStartGame({
      systemCount,
      aiEmpireCount,
      resourceTier,
      fogOfWar,
      enableCrises,
      enablePirates,
      seed,
      godMode: resourceTier === 'creative' ? true : currentConfig.godMode,
    });
    onClose();
  };

  const sizePresets = [
    { count: 6, label: 'Mikro', desc: '6 Sistem (Hızlı Sektör)' },
    { count: 12, label: 'Kompakt', desc: '12 Sistem (Hızlı Tempolu)' },
    { count: 20, label: 'Standart', desc: '20 Sistem (Önerilen 4X)' },
    { count: 36, label: 'Geniş', desc: '36 Sistem (Büyük İmparatorluk)' },
    { count: 50, label: 'Epik', desc: '50 Sistem (Devasa Evren)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none animate-in fade-in duration-200">
      <div className="stellaris-outliner border border-[#1e3e58] rounded-md w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs bg-[#040a14]/98">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#061220] border-b border-[#18374d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-amber-300 font-display tracking-wider uppercase">
                GALAKTİK SANDBOX & YENİ OYUN KURULUMU
              </h2>
              <p className="text-[10px] text-slate-400">
                Özel sistem boyutu, yapay zeka imparatorlukları ve başlangıç parametrelerini yapılandırın
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-slate-200">
          {/* Section 1: Galaxy Size & System Count */}
          <div className="stellaris-item-card p-3.5 rounded border border-[#16334a] bg-[#071322]/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100 text-[11.5px] uppercase tracking-wide">
                  Galaksi Ölçeği (Sistem Sayısı)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold text-xs">
                {systemCount} Sistem
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {sizePresets.map((p) => {
                const isSelected = systemCount === p.count;
                return (
                  <button
                    key={p.count}
                    onClick={() => {
                      sound.playClick();
                      setSystemCount(p.count);
                    }}
                    className={`px-2 py-1.5 rounded-sm border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-md shadow-cyan-950/50 font-bold'
                        : 'border-[#1b3447] bg-[#050e18] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-[11px]">{p.label}</div>
                    <div className="text-[9px] opacity-75">{p.count} Yıldız</div>
                  </button>
                );
              })}
            </div>

            {/* Range Slider for granular control */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Mikro (6)</span>
                <span className="text-cyan-400 font-bold">{systemCount} Yıldız Sistemi</span>
                <span>Devasa (60)</span>
              </div>
              <input
                type="range"
                min={6}
                max={60}
                step={1}
                value={systemCount}
                onChange={(e) => setSystemCount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#0a1b2d] rounded-lg"
              />
            </div>

            {/* Real-time Galaxy Topology Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#132c40] text-[10px] text-slate-400">
              <div>
                <span>Tahmini Gezegen:</span>
                <span className="text-amber-400 font-bold ml-1.5">~{Math.round(systemCount * 3.4)}</span>
              </div>
              <div>
                <span>Hiperuzay Hatları:</span>
                <span className="text-cyan-400 font-bold ml-1.5">~{Math.round(systemCount * 2.1)}</span>
              </div>
              <div>
                <span>Merkezi Nexus:</span>
                <span className="text-emerald-400 font-bold ml-1.5">Aktif</span>
              </div>
            </div>
          </div>

          {/* Section 2: AI Empires (Peaceful Sandbox vs Rivals) */}
          <div className="stellaris-item-card p-3.5 rounded border border-[#16334a] bg-[#071322]/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-slate-100 text-[11.5px] uppercase tracking-wide">
                  Yapay Zeka İmparatorlukları (AI Rakipler)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-sm bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold text-xs">
                {aiEmpireCount === 0 ? 'Solo Sandbox' : `${aiEmpireCount} Rakip İmparatorluk`}
              </span>
            </div>

            {/* AI Count Selector Buttons */}
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((cnt) => {
                const isSelected = aiEmpireCount === cnt;
                return (
                  <button
                    key={cnt}
                    onClick={() => {
                      sound.playClick();
                      setAiEmpireCount(cnt);
                    }}
                    className={`py-1.5 px-2 rounded-sm border text-center transition-all cursor-pointer ${
                      isSelected
                        ? cnt === 0
                          ? 'border-emerald-400 bg-emerald-950/90 text-emerald-200 font-bold shadow-md shadow-emerald-950/50'
                          : 'border-purple-400 bg-purple-950/90 text-purple-200 font-bold shadow-md shadow-purple-950/50'
                        : 'border-[#1b3447] bg-[#050e18] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{cnt === 0 ? '0 (Solo)' : `${cnt} Bot`}</div>
                  </button>
                );
              })}
            </div>

            {/* Peaceful Sandbox Callout if 0 AI */}
            {aiEmpireCount === 0 ? (
              <div className="p-2.5 rounded-sm bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[10.5px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Barışçıl Solo Sandbox:</strong> Galakside hiçbir yapay zeka rakip yer almaz. Tüm sistemleri tek başınıza keşfedebilir, kolonileştirebilir ve süper yapılar inşa edebilirsiniz.
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Etkin Rakipler:{' '}
                  {[
                    'Sanayici',
                    'Kızıl Akıncı',
                    'Nexus Muhafızı',
                    'Kâşif',
                    'Amiral Filosu',
                  ]
                    .slice(0, aiEmpireCount)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Starting Resources & Economy */}
          <div className="stellaris-item-card p-3.5 rounded border border-[#16334a] bg-[#071322]/80 space-y-3">
            <div className="flex items-center gap-2">
              <Pickaxe className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-100 text-[11.5px] uppercase tracking-wide">
                Başlangıç Kaynak Düzeyi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'standard',
                  title: 'Standart (1x)',
                  desc: '800 Cevher, 500 Kristal, 300 Yakıt. Dengeli 4X.',
                  badge: 'Klasik',
                  color: 'cyan',
                },
                {
                  id: 'rich',
                  title: 'Zengin Başlangıç (3x)',
                  desc: '2400 Cevher, 1500 Kristal, 900 Yakıt + Ekstra Filo.',
                  badge: 'Hızlı Kurulum',
                  color: 'amber',
                },
                {
                  id: 'creative',
                  title: 'Yaratıcı Sandbox',
                  desc: '99,999 her kaynak, Seviye 5 Teknolojiler, 5x Savaş Gemisi.',
                  badge: 'Sınırsız',
                  color: 'emerald',
                },
              ].map((tier) => {
                const isSelected = resourceTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => {
                      sound.playClick();
                      setResourceTier(tier.id as any);
                    }}
                    className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold shadow-md shadow-amber-950/40'
                        : 'border-[#1b3447] bg-[#050e18] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] text-slate-100">{tier.title}</div>
                      <div className="text-[9.5px] font-normal text-slate-400 mt-1 leading-tight">
                        {tier.desc}
                      </div>
                    </div>
                    <span className="mt-2 text-[8.5px] font-mono px-1 py-0.5 rounded w-fit bg-black/40 border border-slate-700/60 text-slate-300">
                      {tier.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Fog of War & Environment Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {/* Fog of War Mode */}
            <div className="stellaris-item-card p-3 rounded border border-[#16334a] bg-[#071322]/80 space-y-2">
              <span className="font-bold text-slate-200 text-[11px] block">Savaş Sisi (Görüş)</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    setFogOfWar('fog');
                  }}
                  className={`p-2 rounded-sm border text-center transition-all cursor-pointer ${
                    fogOfWar === 'fog'
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 font-bold'
                      : 'border-[#1b3447] bg-[#050e18] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-400" />
                  <span className="text-[10px]">Savaş Sisi Açık</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setFogOfWar('all_visible');
                  }}
                  className={`p-2 rounded-sm border text-center transition-all cursor-pointer ${
                    fogOfWar === 'all_visible'
                      ? 'border-purple-400 bg-purple-950/80 text-purple-200 font-bold'
                      : 'border-[#1b3447] bg-[#050e18] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span className="text-[10px]">Açık Harita</span>
                </button>
              </div>
            </div>

            {/* Crises & Pirates */}
            <div className="stellaris-item-card p-3 rounded border border-[#16334a] bg-[#071322]/80 space-y-2">
              <span className="font-bold text-slate-200 text-[11px] block">Tehditler & Krizler</span>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between p-1.5 rounded bg-[#050e18] border border-[#193245] cursor-pointer hover:border-slate-500">
                  <span className="text-[10px] text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-rose-400" />
                    Galaktik Krizler (Titan & Void)
                  </span>
                  <input
                    type="checkbox"
                    checked={enableCrises}
                    onChange={(e) => setEnableCrises(e.target.checked)}
                    className="accent-cyan-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded bg-[#050e18] border border-[#193245] cursor-pointer hover:border-slate-500">
                  <span className="text-[10px] text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    Korsan Yuvaları & Pusular
                  </span>
                  <input
                    type="checkbox"
                    checked={enablePirates}
                    onChange={(e) => setEnablePirates(e.target.checked)}
                    className="accent-cyan-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Random Seed */}
          <div className="stellaris-item-card p-3 rounded border border-[#16334a] bg-[#071322]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-slate-200 text-[11px] block">Galaktik Tohum (Seed)</span>
                <span className="text-[9.5px] text-slate-400">Aynı tohum aynı yıldız haritasını üretir</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 1)}
                className="w-24 px-2 py-1 bg-[#050e18] border border-[#1b3447] rounded-sm text-center text-amber-300 font-bold text-xs"
              />
              <button
                onClick={handleRollSeed}
                className="px-2.5 py-1 rounded-sm border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Yeni Rastgele Tohum Üret"
              >
                <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                <span>Zar At</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[#061220] border-t border-[#18374d] flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-sm border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
          >
            İptal
          </button>

          <button
            onClick={handleStart}
            className="px-5 py-2 rounded-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer transition-all hover:scale-102"
          >
            <Rocket className="w-4 h-4 text-cyan-200" />
            <span>GALAKSİYİ YARAT & BAŞLAT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
