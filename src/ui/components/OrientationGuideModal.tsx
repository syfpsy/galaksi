import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Eye,
  Flame,
  Globe,
  HelpCircle,
  Navigation,
  Pickaxe,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Timer,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { sound } from '../sound';

interface OrientationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrientationGuideModal: React.FC<OrientationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Galaksi ve Sistem Haritaları',
      subtitle: 'Makro Galaksi ile Yörünge Sistemleri Arasında Gezinme',
      icon: <Compass className="w-6 h-6 text-cyan-400" />,
      accentColor: '#00f3ff',
      content: (
        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="p-3.5 rounded-sm bg-cyan-950/30 border border-cyan-500/40 text-cyan-200 leading-relaxed">
            <span className="font-bold text-cyan-400 block text-sm mb-1">
              🌌 İki Katmanlı Galaktik Harita Yapısı
            </span>
            Evren; yıldız sistemleri ve bu sistemleri birbirine bağlayan kozmik hiper-hatlardan (hyperlanes) oluşur.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-sm stellaris-item-card">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>1. Sisteme Giriş & Yörüngeler</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Herhangi bir yıldıza <strong className="text-slate-200">çift tıklayarak</strong> veya alt menüdeki <strong className="text-amber-400">M Tuşuna</strong> basarak sistemin içine girebilirsiniz. Gezegenlerin gerçek zamanlı yörünge hareketlerini izleyebilirsiniz.
              </p>
            </div>

            <div className="p-3 rounded-sm stellaris-item-card">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>2. Galaksiye Dönüş & Döngü</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Tekrar <strong className="text-cyan-300">M Tuşuna</strong> basarak galaksi haritasına çıkabilir ya da sistemdeyken alt bardaki <strong className="text-slate-200">&lt; ve &gt;</strong> butonlarıyla komşu sistemleri hızlıca gezebilirsiniz.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-sm bg-[#081220] border border-[#163552] flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Kısayol İpucu:</span>
            <span className="text-cyan-300 font-bold">Harita Modları için 'M', 3D/2D görünüm için '3D' butonunu kullanın.</span>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Filolar Nasıl Hareket Eder?',
      subtitle: 'Taktik Sefer Başlatma & %50 Geri Dönüş Kilidi',
      icon: <SendIcon className="w-6 h-6 text-amber-400" />,
      accentColor: '#f59e0b',
      content: (
        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="p-3.5 rounded-sm bg-amber-950/30 border border-amber-500/40 text-amber-200 leading-relaxed">
            <span className="font-bold text-amber-400 block text-sm mb-1">
              🛸 Filolar Işık Hızında Değil, Stratejik Hiper-Hatlarla Uçar!
            </span>
            Filolar anında ışınlanmaz; sistemler arasındaki hiper-hat rotalarında gerçek zamanlı olarak seyahat ederler.
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-sm stellaris-item-card flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
              <div>
                <strong className="text-slate-100 block">Koloniye veya Filonuza Tıklayın</strong>
                <span className="text-slate-400">Garnizonunuzdaki gemileri sevk etmek için sol raydan <strong className="text-cyan-400">F4 (Filo Komutası)</strong> panelini açın veya haritadan kalkış noktasını seçin.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-sm stellaris-item-card flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
              <div>
                <strong className="text-slate-100 block">Hedef Sistemi & Gezegeni Belirleyin</strong>
                <span className="text-slate-400">Haritada gitmek istediğiniz yıldıza veya düşman dünyasına tıklayarak rota oluşturun.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-sm stellaris-item-card flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
              <div>
                <strong className="text-slate-100 block">Görev Türünü Seçin & Seferi Başlatın</strong>
                <span className="text-slate-400">
                  ⚔️ <strong className="text-rose-400">Taarruz:</strong> Düşmanı imha eder ve kaynak yağmalar. • 📡 <strong className="text-cyan-400">Keşif:</strong> Sisi kaldırır. • 📦 <strong className="text-amber-400">İkmal:</strong> Kaynak taşır. • 🏛️ <strong className="text-emerald-400">Koloni:</strong> Yeni dünya kurar.
                </span>
              </div>
            </div>
          </div>

          {/* 50% Recall Lock Warning */}
          <div className="p-3 rounded-sm bg-rose-950/30 border border-rose-500/50 text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>KRİTİK KURAL: %50 Geri Çağrı Eşiği (Recall Lock)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Uçuş süresinin ilk yarısında filonuzu istediğiniz zaman <strong className="text-white">'Geri Çağır'</strong> butonu ile üsse döndürebilirsiniz. Ancak yolun <strong className="text-rose-400">%50'si aşıldığında rota kilitlenir</strong> ve filo hedefine varmak zorunda kalır!
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'İmparatorluk Ekonomisi & Gemi Üretimi',
      subtitle: 'Madenler, Laboratuvarlar ve Donanma İnşası',
      icon: <Wrench className="w-6 h-6 text-emerald-400" />,
      accentColor: '#10b981',
      content: (
        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-sm bg-amber-950/30 border border-amber-500/40 text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <strong className="text-amber-300 block">Enerji / Yakıt</strong>
              <span className="text-[10px] text-slate-400">Filo seferleri ve gemi manevraları için tüketilir.</span>
            </div>
            <div className="p-2.5 rounded-sm bg-orange-950/30 border border-orange-500/40 text-center">
              <Pickaxe className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <strong className="text-orange-300 block">Cevher / Maden</strong>
              <span className="text-[10px] text-slate-400">Bina inşaatı ve gemi zırhı imalatının temelidir.</span>
            </div>
            <div className="p-2.5 rounded-sm bg-cyan-950/30 border border-cyan-500/40 text-center">
              <Sparkles className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <strong className="text-cyan-300 block">Nadir Kristal</strong>
              <span className="text-[10px] text-slate-400">Gelişmiş kalkanlar, Ar-Ge ve kruvazör üretimi.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-sm stellaris-item-card space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> [F1] Gezegen Altyapısı
              </span>
              <span className="text-slate-400">Madenleri ve santralleri yükselterek saatlik üretimi katlayın.</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" /> [F2] Gemi Tersanesi
              </span>
              <span className="text-slate-400">Hızlıca +1x, +5x veya Maks butonlarıyla savaş filoları basın.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> [F3] Ar-Ge Teknoloji
              </span>
              <span className="text-slate-400">İtki motorları hızı artırır, lazerler muharebe gücünü yükseltir.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-sm bg-[#071324] border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tüm devam eden bina ve tersane üretimlerini alt paneldeki etkinlik çubuğundan canlı izleyebilirsiniz!</span>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'Zaman Yönetimi & Nexus Hakimiyeti',
      subtitle: 'Galaksiye Hükmetmek için Zafer Koşulları',
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      accentColor: '#a855f7',
      content: (
        <div className="space-y-4 text-xs font-mono text-slate-300">
          <div className="p-3.5 rounded-sm bg-purple-950/30 border border-purple-500/40 text-purple-200 leading-relaxed">
            <span className="font-bold text-purple-400 block text-sm mb-1">
              👑 Nihai Zafer: Galaktik Nexus Megastrüktürü
            </span>
            Sektörün tam merkezinde yer alan devasa antik Nexus Rölesini fethettiğinizde, imparatorluğunuz haftalık zafer puanı toplamaya başlar ve çevredeki sistemlerde tam sensör görüşü kazanır!
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-sm stellaris-item-card">
              <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                <Timer className="w-4 h-4" />
                <span>Space — Duraklat / Başlat</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Zamanı istediğiniz an dondurup filolarınızı planlayabilir, emirler verebilir ve tekrar devam ettirebilirsiniz.
              </p>
            </div>

            <div className="p-3 rounded-sm stellaris-item-card">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                <Zap className="w-4 h-4" />
                <span>1 - 4 — Hız Kademeleri</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Filoların uzak sistemlere intikali sürerken 1x, 5x, 20x veya 60x hızlandırma kullanarak beklemeyi hızlandırabilirsiniz.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
            <strong className="text-emerald-400 block mb-1">Tebrikler Komutan, Göreve Hazırsınız!</strong>
            <p className="text-[11px] text-slate-300">
              Arayüzdeki pencereler haritayı asla kapatmaz. Soldaki raydan dilediğiniz paneli açıp inceleyebilir, sağdaki çizelgeden tüm gezegen ve filolarınızı anlık yönetebilirsiniz.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  const handleFinish = () => {
    sound.playClick();
    localStorage.setItem('galaksi_orientation_seen', 'true');
    onClose();
  };

  const handleNext = () => {
    sound.playClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          handleFinish();
        }
      }}
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div className="stellaris-modal border border-[#1c3647] rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-100 overflow-hidden relative">
        {/* Top Accent Line */}
        <div
          className="h-1 w-full"
          style={{
            backgroundColor: current.accentColor,
            boxShadow: `0 0 10px ${current.accentColor}`,
          }}
        />

        {/* Header */}
        <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-sm flex items-center justify-center border shadow-md"
              style={{
                backgroundColor: `${current.accentColor}20`,
                borderColor: `${current.accentColor}50`,
              }}
            >
              {current.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Galaktik Oryantasyon Rehberi • Adım {currentStep + 1} / {steps.length}
                </span>
              </div>
              <h2 className="text-lg font-bold font-display text-white">
                {current.title}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {current.subtitle}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              handleFinish();
            }}
            className="w-8 h-8 rounded-sm stellaris-btn-metallic text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Rehberi Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Pips */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/60">
          {steps.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => {
                sound.playClick();
                setCurrentStep(idx);
              }}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'bg-cyan-400 shadow-[0_0_8px_#00f3ff]'
                  : idx < currentStep
                  ? 'bg-emerald-500/80'
                  : 'bg-slate-800'
              }`}
              title={`${idx + 1}. Adıma Git`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {current.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-[#1c3d52] bg-[#07131e] flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              handlePrev();
            }}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-sm stellaris-btn-metallic text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki Adım</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                handleFinish();
              }}
              className="px-3 py-1.5 rounded-sm text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Rehberi Geç
            </button>

            <button
              onClick={() => {
                sound.playClick();
                handleNext();
              }}
              className="px-4 py-1.5 rounded-sm stellaris-btn-metallic text-cyan-200 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Anladım, Galaksiyi Yönetmeye Başla!' : 'Sonraki Adım'}</span>
              <ChevronRight className="w-4 h-4 text-[#3ca8d1]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
