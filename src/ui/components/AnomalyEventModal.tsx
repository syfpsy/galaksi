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
import { EMPIRE_ARTIFACTS } from '../../engine/artifacts';
import { sound } from '../sound';

interface AnomalyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: StarSystem | null;
  onDispatchScout?: (systemId: string) => void;
  isDocked?: boolean;
}

const AnomalyEventModalComponent: React.FC<AnomalyEventModalProps> = ({
  isOpen,
  onClose,
  system,
  onDispatchScout,
  isDocked,
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
      category: 'Kalıntı / Enkaz Anomalisi',
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
    ancient_ruins: {
      title: 'Kadim Öncü Uygarlık Kalıntıları',
      category: 'Arkeolojik Kazı Sahası',
      icon: <Compass className="w-6 h-6 text-cyan-300" />,
      color: '#00f3ff',
      lore: 'Tektonik plakaların derinliklerine gömülmüş, milyonlarca yıldır korunan biyo-mekanik piramit kompleksi. Kuantum şifreli veri bankaları hala aktif sinyal üretiyor.',
      analysis: 'Arkeolojik araştırma seferi ile laboratuvar arşivleri ve araştırma sürelerini kısaltan Öncü Veri Matrisi yadigârı ele geçirilebilir.',
    },
    derelict_dreadnought: {
      title: 'Sürüklenen Kadim Savaş Dretnotu',
      category: 'Harp Enkazı / Ağır Zırh Arkeolojisi',
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      color: '#f59e0b',
      lore: 'Boşlukta hareketsiz süzülen devasa bir antik amiral savaş gemisi. Ana bataryaları susmuş olsa da gövdeyi saran nötronik zırh tabakaları bozulmamış durumda.',
      analysis: 'Enkazdan sökülecek kadim zırh plakaları ve reaktör parçaları, filolarınızın ateş gücünü ve gövde dayanıklılığını kalıcı olarak yükseltir.',
    },
    dark_matter_rift: {
      title: 'Karanlık Madde Uzay-Zaman Yarığı',
      category: 'Boyutlararası Çekim Anomalisi',
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      color: '#a855f7',
      lore: 'Hiper-hat rotalarının kesişim noktasında meydana gelen kararsız bir boyut yarığı. Kütleçekimsel dalgalanmalar sevk fiziğini temelden büküyor.',
      analysis: 'Yarıktan elde edilecek egzotik parçacıklar, hiper-hat seyahatlerini hızlandıran Yarık Hiper-Sürücüsü yadigârının prototipini oluşturur.',
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

  const content = (
    <div className={`border border-[#1c3647] ${isDocked ? 'stellaris-outliner w-[440px] md:w-[480px] h-full flex flex-col shadow-2xl' : 'stellaris-modal rounded-sm shadow-2xl max-w-xl w-full'} text-slate-100 overflow-hidden relative`}>
      {/* Stellaris Holographic Top Line */}
      <div
        className="h-1 w-full shrink-0"
        style={{
          backgroundColor: currentDetail.color,
          boxShadow: `0 0 12px ${currentDetail.color}`,
        }}
      />

      {/* Header */}
      <div className="p-3.5 border-b border-[#1c3647] flex items-center justify-between stellaris-outliner-header">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center border shadow-inner"
            style={{
              backgroundColor: `${currentDetail.color}18`,
              borderColor: `${currentDetail.color}60`,
            }}
          >
            {currentDetail.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                {currentDetail.category}
              </span>
              <span className="stellaris-badge text-cyan-300 border-[#1c3647]">
                {system.name} Sistemi
              </span>
            </div>
            <h2 className="text-sm font-bold font-display text-white tracking-wide mt-0.5">
              {currentDetail.title}
            </h2>
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

      {/* Content Body */}
      <div className="p-4 space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
        {/* Narrative Lore */}
        <div className="stellaris-item-card p-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-slate-700 pointer-events-none">
            <Compass className="w-16 h-16 opacity-10" />
          </div>
          <p className="text-slate-100 text-xs font-sans relative z-10 leading-relaxed">
            {currentDetail.lore}
          </p>
          <p className="text-cyan-300 text-xs font-sans mt-2 relative z-10 italic">
            {currentDetail.analysis}
          </p>
        </div>

        {/* Imperial Relic Badge */}
        {poi.artifactId && EMPIRE_ARTIFACTS[poi.artifactId] && (
          <div className="stellaris-item-card p-2.5 border-cyan-500/50 bg-cyan-950/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{EMPIRE_ARTIFACTS[poi.artifactId].icon}</span>
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block">
                  🏛️ Kadim İmparatorluk Yadigarı
                </span>
                <span className="text-xs font-bold text-white">
                  {EMPIRE_ARTIFACTS[poi.artifactId].nameTr}
                </span>
              </div>
            </div>
            <span className="stellaris-badge text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
              {EMPIRE_ARTIFACTS[poi.artifactId].effectTr}
            </span>
          </div>
        )}

        {/* Reward Projection */}
        {poi.reward && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-slate-300 font-bold tracking-wider flex items-center justify-between">
              <span>Tahmini Keşif Geri Kazanımı</span>
              <span className={poi.explored ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {poi.explored ? '✓ Toplandı' : '● Toplanmaya Hazır'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="stellaris-item-card p-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Cevher</span>
                  <span className="font-bold text-white">+{poi.reward.ore}</span>
                </div>
              </div>
              <div className="stellaris-item-card p-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Kristal</span>
                  <span className="font-bold text-white">+{poi.reward.crystal}</span>
                </div>
              </div>
              <div className="stellaris-item-card p-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Yakıt</span>
                  <span className="font-bold text-white">+{poi.reward.fuel}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-[#0a121c]/90 border-t border-[#1c3647] flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="stellaris-btn-metallic px-3 py-1.5 rounded-sm text-xs text-slate-200 hover:text-white cursor-pointer font-medium"
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
            className="stellaris-btn-metallic !border-cyan-500/70 text-cyan-200 px-3.5 py-1.5 rounded-sm font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-300" />
            <span>Keşif Seferi Düzenle</span>
          </button>
        )}
      </div>
    </div>
  );

  if (isDocked) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      {content}
    </div>
  );
};

export const AnomalyEventModal = React.memo(AnomalyEventModalComponent);
