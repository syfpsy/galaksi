import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Compass,
  Crown,
  Dice5,
  Eye,
  EyeOff,
  Flame,
  Globe,
  HelpCircle,
  Info,
  Maximize2,
  Minimize2,
  Music,
  Orbit,
  Play,
  Radio,
  Rocket,
  RotateCcw,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';
import { GameState } from '../../engine/types';
import { SandboxConfig, DEFAULT_SANDBOX_CONFIG } from './SandboxSetupModal';
import { sound } from '../sound';
import { formatSimClock } from '../timeUtils';

export interface MainMenuProps {
  isOpen: boolean;
  hasActiveGame: boolean;
  state: GameState;
  activePlayerId: string;
  onResumeGame: () => void;
  onStartCampaign: () => void;
  onStartSandbox: (config: SandboxConfig) => void;
  onStartSkirmish: () => void;
  onStartTutorial: () => void;
  onOpenHallOfFame: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  currentConfig?: SandboxConfig;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  hasActiveGame,
  state,
  activePlayerId,
  onResumeGame,
  onStartCampaign,
  onStartSandbox,
  onStartSkirmish,
  onStartTutorial,
  onOpenHallOfFame,
  onToggleMute,
  isMuted,
  currentConfig = DEFAULT_SANDBOX_CONFIG,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'sandbox' | 'settings' | 'records'>('home');
  const [isAmbienceOn, setIsAmbienceOn] = useState<boolean>(sound.isAmbiencePlaying);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sandbox Customizer State
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleAmbience = () => {
    sound.playClick();
    const playing = sound.toggleAmbience();
    setIsAmbienceOn(playing);
  };

  const handleRollSeed = () => {
    sound.playClick();
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  // Launch custom sandbox game
  const handleLaunchSandbox = () => {
    sound.playLaunch();
    onStartSandbox({
      systemCount,
      aiEmpireCount,
      resourceTier,
      fogOfWar,
      enableCrises,
      enablePirates,
      seed,
      godMode: resourceTier === 'creative' ? true : currentConfig.godMode,
    });
  };

  // Canvas starfield animation for atmospheric celestial background
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const starCount = 140;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.7 + 0.3,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.8 ? '#fbbf24' : Math.random() > 0.4 ? '#38bdf8' : '#ffffff',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep galactic nebulas
      const g1 = ctx.createRadialGradient(width * 0.3, height * 0.4, 50, width * 0.3, height * 0.4, width * 0.5);
      g1.addColorStop(0, 'rgba(15, 35, 60, 0.45)');
      g1.addColorStop(0.5, 'rgba(8, 20, 38, 0.25)');
      g1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(width * 0.75, height * 0.65, 80, width * 0.75, height * 0.65, width * 0.45);
      g2.addColorStop(0, 'rgba(56, 30, 80, 0.35)');
      g2.addColorStop(0.6, 'rgba(15, 23, 42, 0.15)');
      g2.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Render drifting stars
      for (const s of stars) {
        s.x += s.speedX;
        s.y += s.speedY;
        s.opacity += Math.sin(Date.now() * s.pulseSpeed) * 0.008;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, s.opacity));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Active game vitals summary
  const activePlayer = state.players[activePlayerId];
  const myPlanets = Object.values(state.planets).filter((p) => p.ownerId === activePlayerId);
  const totalShips = myPlanets.reduce((acc, p) => {
    return acc + Object.values(p.garrison).reduce((a, b) => a + (b || 0), 0);
  }, 0);
  const totalSystems = Object.keys(state.map.systems).length;
  const stellarisDate = formatSimClock(state.timeMs);

  const sizePresets = [
    { count: 6, label: 'Mikro', desc: '6 Sistem (Hızlı Sektör)' },
    { count: 12, label: 'Kompakt', desc: '12 Sistem (Hızlı Tempolu)' },
    { count: 20, label: 'Standart', desc: '20 Sistem (Önerilen 4X)' },
    { count: 36, label: 'Geniş', desc: '36 Sistem (Büyük İmparatorluk)' },
    { count: 50, label: 'Epik', desc: '50 Sistem (Devasa Evren)' },
  ];

  return (
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-[#040811] text-slate-100 flex flex-col font-mono">
      {/* Background Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Atmospheric Vignette & Hex Overlays */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_rgba(2,6,15,0.75)_80%,_rgba(1,3,8,0.95)_100%] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-[#1b3447]/60 bg-[#07101b]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm stellaris-crest flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Crown className="w-5 h-5 text-[#fbbf24] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-display tracking-widest uppercase">
                GALAKSİ PROTOKOLÜ
              </span>
              <span className="stellaris-badge text-[9.5px] text-[#fbbf24] border-amber-500/50">
                v2.5 GRAND STRATEGY
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Terran Savunma Komutanlığı • Yıldızlararası Operasyon Merkezi
            </div>
          </div>
        </div>

        {/* Top Header Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Cosmic Ambience Synth Toggle */}
          <button
            onClick={handleToggleAmbience}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isAmbienceOn
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                : 'stellaris-btn-metallic text-slate-400 hover:text-white'
            }`}
            title="Kozmik Fon Ambiyansını Aç / Kapat"
          >
            <Music className={`w-3.5 h-3.5 ${isAmbienceOn ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Ambiyans</span>
            {isAmbienceOn && (
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-2 bg-cyan-400 animate-bounce" />
                <span className="w-1 h-3 bg-cyan-300 animate-bounce delay-75" />
                <span className="w-1 h-1.5 bg-cyan-400 animate-bounce delay-150" />
              </span>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className={`p-1.5 rounded-sm stellaris-btn-metallic transition-all cursor-pointer ${
              !isMuted ? 'text-cyan-300 border-cyan-500/50' : 'text-slate-500'
            }`}
            title={!isMuted ? 'Ses Açık' : 'Ses Kapalı'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-sm stellaris-btn-metallic text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Tam Ekran Modu"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN BODY: 2-COLUMN GRAND STRATEGY LAYOUT */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 sm:py-10 max-w-7xl mx-auto w-full flex flex-col justify-center">
        {/* HERO TITLE BRANDING */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gerçek Zamanlı 4X Uzay Stratejisi</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-[0.22em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-[#5085a8] drop-shadow-[0_0_35px_rgba(0,243,255,0.4)]">
            GALAKSİ
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-mono max-w-xl mx-auto tracking-wide">
            Yıldız sistemlerini keşfedin, koloniler kurun, modüler filolar donatın ve galaktik hegemonyayı ele geçirin.
          </p>
        </div>

        {/* NAVIGATION CONTENT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CORE GAME MODES (Col 1-7) */}
          <div className="lg:col-span-7 space-y-3">
            {/* 1. DEVAM ET (Seferi Sürdür) */}
            {hasActiveGame && (
              <button
                onClick={() => {
                  sound.playLaunch();
                  onResumeGame();
                }}
                className="w-full text-left p-4 rounded-sm stellaris-outliner border-2 border-cyan-400/80 bg-gradient-to-r from-[#0d2335] via-[#091724] to-[#061019] shadow-xl shadow-cyan-950/50 hover:shadow-cyan-500/20 hover:border-cyan-300 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-sm bg-cyan-950/80 border border-cyan-400/80 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-md">
                      <Play className="w-5 h-5 fill-cyan-400 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white font-display uppercase tracking-wider group-hover:text-cyan-200 transition-colors">
                          SEFERE DEVAM ET
                        </span>
                        <span className="stellaris-badge text-[10px] text-cyan-300 border-cyan-400/60 bg-cyan-950/80 animate-pulse">
                          AKTİF SEZON
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-2">
                        <span className="text-[#fbbf24] font-bold">{activePlayer?.name || 'İmparatorluk'}</span>
                        <span>•</span>
                        <span>{stellarisDate}</span>
                        <span>•</span>
                        <span className="text-emerald-400">{myPlanets.length} Koloni</span>
                        <span>•</span>
                        <span className="text-cyan-400">{totalShips} Gemi</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            )}

            {/* 2. YENİ SEFER (Standart 4X) */}
            <button
              onClick={() => {
                sound.playLaunch();
                onStartCampaign();
              }}
              className="w-full text-left p-3.5 rounded-sm stellaris-item-card border border-[#22394d] hover:border-[#fbbf24] bg-gradient-to-r from-[#0c1825] to-[#070e17] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#091522] border border-[#1b3447] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                        YENİ SEFER BAŞLAT (STANDART 4X)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      20 Sistemli dengeli evren, 5 rakip yapay zeka imparatorluğu, savaş sisi ve galaktik krizler.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* 3. ÖZEL SANDBOX MODU (Galaktik Laboratuvar) */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('sandbox');
              }}
              className={`w-full text-left p-3.5 rounded-sm transition-all cursor-pointer group ${
                activeTab === 'sandbox'
                  ? 'stellaris-outliner border-2 border-amber-400/90 bg-[#122233] shadow-md shadow-amber-950/40'
                  : 'stellaris-item-card border border-[#22394d] hover:border-amber-400 bg-gradient-to-r from-[#0c1825] to-[#070e17]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#162719] border border-emerald-500/60 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
                        ÖZEL SANDBOX MODU
                      </span>
                      <span className="stellaris-badge text-[9.5px] text-emerald-300 border-emerald-500/50">
                        ÖZELLEŞTİRİLEBİLİR
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Sistem sayısını (6–50), bot sayısını, kaynak bolluğunu, savaş sisini ve kuralları siz belirleyin.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* 4. HIZLI DÜELLO (6 Sistem Skirmish) */}
            <button
              onClick={() => {
                sound.playLaunch();
                onStartSkirmish();
              }}
              className="w-full text-left p-3.5 rounded-sm stellaris-item-card border border-[#22394d] hover:border-rose-400 bg-gradient-to-r from-[#0c1825] to-[#070e17] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#221019] border border-rose-500/60 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-rose-300 transition-colors">
                        HIZLI MİKRO DÜELLO
                      </span>
                      <span className="stellaris-badge text-[9.5px] text-rose-300 border-rose-500/50">
                        6 SİSTEM • 1v1
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      10 dakikalık hızlı tempolu mini galaksi. Doğrudan taktiksel çatışma ve hızlı genişleme.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* 5. İLK ADIMLAR (Öğretici & Rehberli Sefer) */}
            <button
              onClick={() => {
                sound.playLaunch();
                onStartTutorial();
              }}
              className="w-full text-left p-3.5 rounded-sm stellaris-item-card border border-[#22394d] hover:border-cyan-400 bg-gradient-to-r from-[#0c1825] to-[#070e17] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#091b26] border border-cyan-500/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                        İLK ADIMLAR (EĞİTİM & REHBER)
                      </span>
                      <span className="stellaris-badge text-[9.5px] text-cyan-300 border-cyan-500/50">
                        REHBERLİ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Keşif, maden geliştirme, koloni kurma ve filo sevkiyatını adım adım öğreten kılavuzlu oyun.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* 6. ŞÖHRETLER SALONU & ARŞİV */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenHallOfFame();
              }}
              className="w-full text-left p-3 rounded-sm stellaris-item-card border border-[#22394d] hover:border-[#fbbf24] bg-[#08121d] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-[#fbbf24]" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white font-display tracking-wider">
                    ŞÖHRETLER SALONU & SEZON ARŞİVİ
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </div>
            </button>
          </div>

          {/* RIGHT COLUMN: CONTEXTUAL VIEW / SANDBOX CONFIG CONSOLE (Col 8-12) */}
          <div className="lg:col-span-5">
            {activeTab === 'sandbox' ? (
              /* INTEGRATED SANDBOX CONFIGURATION CONSOLE */
              <div className="stellaris-outliner border border-[#1e3b52] rounded-sm p-4 sm:p-5 shadow-2xl bg-[#091522]/95 backdrop-blur-md space-y-4 animate-fade-in text-xs font-mono">
                <div className="flex items-center justify-between border-b border-[#1b3447] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-display uppercase tracking-wider">
                      SANDBOX LABORATUVARI
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('home');
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                    title="Geri Dön"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Galaxy System Count */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Galaksi Büyüklüğü:</span>
                    </span>
                    <span className="stellaris-badge text-[#fbbf24] border-amber-500/40">
                      {systemCount} Sistem
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {sizePresets.map((sz) => (
                      <button
                        key={sz.count}
                        onClick={() => {
                          sound.playClick();
                          setSystemCount(sz.count);
                        }}
                        className={`py-1.5 px-1 rounded-sm text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          systemCount === sz.count
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-sm'
                            : 'bg-[#06121e] border-[#183144] text-slate-400 hover:text-white'
                        }`}
                        title={sz.desc}
                      >
                        <div>{sz.label}</div>
                        <div className="text-[9px] opacity-75">{sz.count}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. AI Empire Count */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-rose-400" />
                      <span>Yapay Zeka İmparatorlukları:</span>
                    </span>
                    <span className="stellaris-badge text-rose-300 border-rose-500/40">
                      {aiEmpireCount === 0 ? 'Tek Başına' : `${aiEmpireCount} Rakip`}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[0, 1, 2, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => {
                          sound.playClick();
                          setAiEmpireCount(cnt);
                        }}
                        className={`py-1 px-1 rounded-sm text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          aiEmpireCount === cnt
                            ? 'bg-rose-500/20 text-rose-200 border-rose-400 shadow-sm'
                            : 'bg-[#06121e] border-[#183144] text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt === 0 ? 'Yalnız' : `${cnt} Bot`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Starting Resource Tier */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Başlangıç Kaynakları:</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'standard', label: 'Standart', desc: 'Dengeli 4X' },
                      { id: 'rich', label: 'Bol Kaynak', desc: 'Hızlı Başlangıç' },
                      { id: 'creative', label: 'Yaratıcı', desc: 'Sınırsız / Tanrı' },
                    ].map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => {
                          sound.playClick();
                          setResourceTier(rt.id as any);
                        }}
                        className={`py-1.5 px-1 rounded-sm text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          resourceTier === rt.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm'
                            : 'bg-[#06121e] border-[#183144] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div>{rt.label}</div>
                        <div className="text-[9px] opacity-75">{rt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Fog of War Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Savaş Sisi (Fog of War):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setFogOfWar('fog');
                      }}
                      className={`p-1.5 rounded-sm border text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        fogOfWar === 'fog'
                          ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                          : 'bg-[#06121e] border-[#183144] text-slate-400 hover:text-white'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                      <span>Savaş Sisi Aktif (Gizli)</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setFogOfWar('all_visible');
                      }}
                      className={`p-1.5 rounded-sm border text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        fogOfWar === 'all_visible'
                          ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                          : 'bg-[#06121e] border-[#183144] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Tam Görüş (Açık Harita)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Crises & Pirates */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#183144]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableCrises}
                      onChange={(e) => setEnableCrises(e.target.checked)}
                      className="accent-amber-500 rounded cursor-pointer"
                    />
                    <span className="text-[10.5px] text-slate-300">Galaktik Krizler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePirates}
                      onChange={(e) => setEnablePirates(e.target.checked)}
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <span className="text-[10.5px] text-slate-300">Korsan Yuvaları</span>
                  </label>
                </div>

                {/* 6. Seed Generator */}
                <div className="flex items-center justify-between pt-1 border-t border-[#183144]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px]">Tohum Kodu (Seed):</span>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 rounded-sm bg-[#040912] border border-[#1b3447] text-amber-300 font-mono text-[10.5px] text-center"
                    />
                  </div>
                  <button
                    onClick={handleRollSeed}
                    className="p-1 rounded-sm stellaris-btn-metallic text-slate-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer text-[10px]"
                    title="Rastgele Tohum Üret"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>Zar At</span>
                  </button>
                </div>

                {/* Launch Sandbox Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleLaunchSandbox}
                    className="w-full py-2.5 rounded-sm stellaris-btn-gold text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Orbit className="w-4 h-4 text-black" />
                    <span>Özel Evreni Yarat & Başlat</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SECTOR INTEL & DOCK BRIEFING (DEFAULT RIGHT PANEL) */
              <div className="space-y-4">
                {/* Active Sector Tactical Briefing Card */}
                <div className="stellaris-outliner border border-[#1e3b52] rounded-sm p-4 bg-[#081320]/80 backdrop-blur-md text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-[#183447] pb-2 mb-3">
                    <span className="font-bold text-[#fbbf24] font-display uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>Aktif Galaksi Sektörü</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded-sm">
                      ORION-01
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                    <p>
                      Yıldızlararası ağ çevrimiçi. Kadim Hyperlane geçitleri ve derin uzay anomalileri keşif filolarınızı bekliyor.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#183447]/60">
                      <div className="p-2 rounded-sm bg-[#050e18] border border-[#162f44]">
                        <div className="text-[9.5px] text-slate-400">YILDIZ SİSTEMİ</div>
                        <div className="text-sm font-bold text-cyan-300 font-display">{totalSystems} Sistem</div>
                      </div>
                      <div className="p-2 rounded-sm bg-[#050e18] border border-[#162f44]">
                        <div className="text-[9.5px] text-slate-400">AKTİF İMPARATORLUK</div>
                        <div className="text-sm font-bold text-amber-300 font-display">
                          {Object.keys(state.players).length} Hükümet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Gameplay Systems Cheat Sheet */}
                <div className="stellaris-dock-card border border-[#1c364c] rounded-sm p-4 bg-[#07111c]/70 text-xs font-mono">
                  <div className="text-xs font-bold text-slate-200 font-display uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Öne Çıkan Özellikler</span>
                  </div>

                  <div className="space-y-2 text-[10.5px]">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">🪐 2.5D Harita:</span>
                      <span className="text-slate-300">
                        Yıldız yörüngeleri, gezegenler ve intikal rotaları tam 2.5D derin uzayda işlenir.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">📦 Otomatik İkmal:</span>
                      <span className="text-slate-300">
                        Gelişmiş kolonileriniz ana dünyanıza tek tıkla veya otonom konvoylarla kaynak taşır.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold shrink-0">⚔️ Hızlı Önleme:</span>
                      <span className="text-slate-300">
                        Düşman baskını tespit edildiğinde sıfır menü ile savunma filonuz önlemeye sevk edilir.
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#183447]/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Klavye Kısayolları:</span>
                    <span className="text-cyan-300">Space: Duraklat • F1-F4: Çekmeceler</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-[#183447]/60 bg-[#060e18]/80 text-[10.5px] text-slate-400 font-mono flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span>Stellaris-Inspired 4X Engine</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">WebGL / Three.js 2.5D Canvas</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Web Audio API Synthesizer</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">ESC: Menüyü Kapat / Aç</span>
        </div>
      </footer>
    </div>
  );
};
