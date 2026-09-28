import React from 'react';
import {
  Compass,
  Database,
  Flame,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { StarSystem } from '../../engine/types';
import { sound } from '../sound';

interface AnomalyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: StarSystem | null;
  onDispatchScout?: (systemId: string) => void;
}

export const AnomalyEventModal: React.FC<AnomalyEventModalProps> = ({
  isOpen,
  onClose,
  system,
  onDispatchScout,
}) => {
  if (!isOpen || !system || !system.poi) return null;

  const poi = system.poi;

  const poiDetails: Record<
    string,
    {
      title: string;
      category: string;
      icon: React.ReactNode;
      color: string;
      lore: string;
      analysis: string;
    }
  > = {
    derelict_cache: {
      title: 'Terk Edilmiş Antik Kargo Gemisi',
      category: 'Kalıntı / Enkaz Anomalisı',
      icon: <Database className="w-6 h-6 text-amber-400" />,
      color: '#f59e0b',
      lore: 'Sistem yörüngesinde sürüklenen, kimliği ve çağı belirlenemeyen devasa bir öncü kargo kruvazörü tespit edildi. Gövde üzerinde ağır mikrometeorit darbeleri olsa da reaktör ambarları sağlam mühürlenmiş görünüyor.',
      analysis: 'Tarayıcılar, konteyner modüllerinde rafine alaşım ve endüstriyel kristal bileşenleri barındıran zengin bir kargo stoğuna işaret ediyor.',
    },
    alien_beacon: {
      title: 'Yabancı Subspace Radyo Sinyali',
      category: 'Sinyal / İstihbarat Anomalisi',
      icon: <Radio className="w-6 h-6 text-cyan-400" />,
      color: '#06b6d4',
      lore: 'Kozmik fon gürültüsünü aşan, düzenli aralıklarla tekrarlanan dar bantlı bir takyon atımı kaydedildi. Antik bir hiper-hat yön bulucu rölesi tarafından yayınlandığı tahmin ediliyor.',
      analysis: 'Veri akışının çözümlenmesi, sektör içindeki gizli akıntıları ve derin uzay yakıt rezervuarlarını içeren seyir haritalarını açığa çıkarabilir.',
    },
    asteroid_rich: {
      title: 'Yüksek Yoğunluklu Nadir Cevher Kuşağı',
      category: 'Astrojeolojik Anomali',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      color: '#a855f7',
      lore: 'Sistemin dış çeperinde, olağan dışı yerçekimi anomalisi sergileyen yoğun bir asteroit kümesi keşfedildi. Yüzey kristalizasyonları yüksek oranlı karanlık madde ve enerji izotopları yansıtıyor.',
      analysis: 'Madencilik sensörleri, yüzey çatlaklarından sızan saf hidrokarbon ve egzotik kristal cevherleri teyit etti.',
    },
  };

  const currentDetail = poiDetails[poi.type] || {
    title: 'Bilinmeyen Sektör Anomalisi',
    category: 'Derin Uzay Keşif Raporu',
    icon: <Compass className="w-6 h-6 text-cyan-400" />,
    color: '#38bdf8',
    lore: 'Sistem merkezinde standart spektral modellere uymayan bir anomali gözlemlendi.',
    analysis: 'Detaylı analiz için bir keşif filosunun bölgeye intikal etmesi önerilir.',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-[#080d19] border border-[#1a2942] rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden relative">
        {/* Stellaris Holographic Top Line */}
        <div
          className="h-1.5 w-full"
          style={{
            backgroundColor: currentDetail.color,
            boxShadow: `0 0 16px ${currentDetail.color}`,
          }}
        />

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${currentDetail.color}18`,
                borderColor: `${currentDetail.color}60`,
              }}
            >
              {currentDetail.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  {currentDetail.category}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {system.name} Sistemi
                </span>
              </div>
              <h2 className="text-base font-bold font-display text-white mt-0.5">
                {currentDetail.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm leading-relaxed text-slate-300 font-sans">
          {/* Narrative Lore */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-slate-700">
              <Compass className="w-16 h-16 opacity-10" />
            </div>
            <p className="text-slate-200 text-xs md:text-sm font-sans relative z-10">
              {currentDetail.lore}
            </p>
            <p className="text-slate-400 text-xs font-sans mt-2.5 relative z-10 italic">
              {currentDetail.analysis}
            </p>
          </div>

          {/* Reward Projection */}
          {poi.reward && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center justify-between">
                <span>Tahmini Keşif Geri Kazanımı</span>
                <span className={poi.explored ? 'text-emerald-400' : 'text-amber-400'}>
                  {poi.explored ? '✓ Toplandı' : '● Toplanmaya Hazır'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cevher</span>
                    <span className="font-bold text-slate-200">+{poi.reward.ore}</span>
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kristal</span>
                    <span className="font-bold text-slate-200">+{poi.reward.crystal}</span>
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Yakıt</span>
                    <span className="font-bold text-slate-200">+{poi.reward.fuel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-all"
          >
            Gözlem Kaydını Kapat
          </button>

          {!poi.explored && onDispatchScout && (
            <button
              onClick={() => {
                sound.playClick();
                onDispatchScout(system.id);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Rocket className="w-4 h-4" />
              <span>Keşif Seferi Düzenle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
