import React, { useState } from 'react';
import {
  Compass,
  Crosshair,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  Maximize2,
  Radio,
  Shield,
  Sparkles,
  Swords,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { sound } from '../sound';

export interface GalleryAsset {
  id: string;
  title: string;
  category: 'ships' | 'planets' | 'structures';
  role: string;
  imageSrc: string;
  webUrl: string;
  description: string;
  specifications: { label: string; value: string }[];
  accentColor: string;
}

export const GALLERY_ASSETS: GalleryAsset[] = [
  {
    id: 'scout',
    title: 'Keşif Gemisi (Vanguard Recon)',
    category: 'ships',
    role: 'Hızlı İstihbarat, Sis Dağıtma ve Erken Uyarı',
    imageSrc: '/assets/art/scout.png',
    webUrl: 'https://www.magnific.com/app/creation/9ZeaGKANYZ?utm_source=mcp&utm_medium=ai_connector',
    description:
      'Gelişmiş tanyon sensör çanakları ve karbon-kompozit radar soğurucu zırhla donatılmış yüksek hızlı keşif gemisi. Bilinmeyen sektörlerin sisini kaldırır ve yoldaki düşman filolarının rotalarını erkenden tespit eder.',
    specifications: [
      { label: 'Uçuş Hızı', value: '260 br (En Hızlı)' },
      { label: 'Gövde / Kalkan', value: '70 / 40' },
      { label: 'Ateş Gücü', value: '15 (Hafif Darbe)' },
      { label: 'Yakıt Tüketimi', value: '0.2 / birim' },
    ],
    accentColor: '#00f3ff',
  },
  {
    id: 'transport',
    title: 'Ağır Nakliye Gemisi (Hephaestus)',
    category: 'ships',
    role: 'Lojistik, Koloni Malzemesi ve Enkaz Kurtarma',
    imageSrc: '/assets/art/transport.png',
    webUrl: 'https://www.magnific.com/app/creation/IfjyuYitvE?utm_source=mcp&utm_medium=ai_connector',
    description:
      'Endüstriyel sınıf modüler konteyner bloklarına sahip ağır kargo gemisi. Ham cevher, saflaştırılmış kristal ve nükleer yakıt taşır. Savaş sonrası uzayda kalan enkaz alanlarını (debris) tek başına toplayabilir.',
    specifications: [
      { label: 'Yük Kapasitesi', value: '1,500 birim' },
      { label: 'Uçuş Hızı', value: '110 br' },
      { label: 'Gövde / Kalkan', value: '160 / 30' },
      { label: 'Koloni Rolü', value: '1 Adet Gerekli' },
    ],
    accentColor: '#f59e0b',
  },
  {
    id: 'fighter',
    title: 'Plazma Avcı Gemisi (Interceptor)',
    category: 'ships',
    role: 'Rota Önleme, Eskort ve Hızlı Müdahale',
    imageSrc: '/assets/art/fighter.png',
    webUrl: 'https://www.magnific.com/app/creation/SyYX9KMUb8?utm_source=mcp&utm_medium=ai_connector',
    description:
      'İleri delta kanat geometrisi ve ikiz plazma raylı toplarıyla donatılmış çevik uzay muharebe avcısı. Yavaş seyreden düşman nakliye ve savaş gemilerini rota üzerinde önlemek (interception) için tasarlanmıştır.',
    specifications: [
      { label: 'Uçuş Hızı', value: '220 br' },
      { label: 'Ateş Gücü', value: '65 (Plazma Delici)' },
      { label: 'Gövde / Kalkan', value: '220 / 90' },
      { label: 'Önleme Yetisi', value: 'Kritik Avantaj' },
    ],
    accentColor: '#10b981',
  },
  {
    id: 'battleship',
    title: 'Savaş Gemisi / Dretnot (Dreadnought)',
    category: 'ships',
    role: 'Gezegen Kuşatması, Hat Savunması ve Röle Kontrolü',
    imageSrc: '/assets/art/battleship.png',
    webUrl: 'https://www.magnific.com/app/creation/1l30UH7r4r?utm_source=mcp&utm_medium=ai_connector',
    description:
      'Devasa omurga kütle hızlandırıcı silahı, çoklu taret bataryaları ve hekzagonal enerji deflektör kalkanlarıyla donatılmış heybetli amiral gemisi. Gezegen baskınlarında ve Nexus Rölesi muharebelerinde ana vurucu güçtür.',
    specifications: [
      { label: 'Gövde / Kalkan', value: '1,200 / 600' },
      { label: 'Ateş Gücü', value: '240 (Ağır Spinal)' },
      { label: 'Uçuş Hızı', value: '95 br (Ağır)' },
      { label: 'Kargo Kapasitesi', value: '750 birim' },
    ],
    accentColor: '#3b82f6',
  },
  {
    id: 'nexus_relay',
    title: 'Nexus Rölesi (Central Star Beacon)',
    category: 'structures',
    role: 'Sektör Genelinde Radar Görüşü ve Haftalık Zafer Puanı',
    imageSrc: '/assets/art/nexus_relay.png',
    webUrl: 'https://www.magnific.com/app/creation/O6VtRwFynm?utm_source=mcp&utm_medium=ai_connector',
    description:
      'Merkezi sektörde yer alan kadim öncü ırk megastrüktürü. Eşmerkezli jiroskopik halkaları ve mor tanyon plazma çekirdeğiyle kontrol eden komutana komşu tüm sektörlerde genişletilmiş görüş ve haftalık puan sağlar.',
    specifications: [
      { label: 'Konum', value: 'Merkez Sektör (sys_relay)' },
      { label: 'Sensör Bonusu', value: '+2 Hat Çapı' },
      { label: 'Hakimiyet Puanı', value: '+10 Puan / Periyot' },
      { label: 'Kontrol Şartı', value: 'Garnizon Fethi' },
    ],
    accentColor: '#a855f7',
  },
  {
    id: 'terran_planet',
    title: 'Yaşanabilir Terran Dünyası',
    category: 'planets',
    role: 'Optimal Biyom, Yüksek Nüfus ve Dengeli Üretim',
    imageSrc: '/assets/art/terran_planet.png',
    webUrl: 'https://www.magnific.com/app/creation/ksicUrF16B?utm_source=mcp&utm_medium=ai_connector',
    description:
      'Oksijen-azot atmosferi, derin okyanusları ve geniş kıtalarıyla kolonileştirme için en değerli gezegen sınıfı. Cevher, Kristal ve Yakıt üretiminde standart verimlilik sağlar.',
    specifications: [
      { label: 'Biyom Tipi', value: 'Terran (Yaşanabilir)' },
      { label: 'Üretim Çarpanı', value: '1.0x (Dengeli)' },
      { label: 'Koloni Maliyeti', value: '500C / 300K / 200Y' },
      { label: 'Depo Kapasitesi', value: 'Genişletilebilir' },
    ],
    accentColor: '#06b6d4',
  },
];

interface ArtGalleryModalProps {
  isOpen: boolean;
  isDocked?: boolean;
  onClose: () => void;
}

export const ArtGalleryModal: React.FC<ArtGalleryModalProps> = ({ isOpen, isDocked = false, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ships' | 'planets' | 'structures'>('all');
  const [activeAsset, setActiveAsset] = useState<GalleryAsset>(GALLERY_ASSETS[0]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen) return null;

  const filteredAssets =
    selectedCategory === 'all'
      ? GALLERY_ASSETS
      : GALLERY_ASSETS.filter((a) => a.category === selectedCategory);

  const content = (
    <div className={isDocked ? "w-[860px] min-w-[860px] max-w-[860px] shrink-0 h-full stellaris-outliner border-r border-[#1c3647] flex flex-col shadow-2xl overflow-hidden select-none" : "stellaris-outliner border border-[#1c3647] rounded-sm w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden"}>
        {/* Header */}
        <div className="p-3.5 border-b border-[#1c3d52] stellaris-outliner-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#092233] border border-[#204963] flex items-center justify-center text-[#3ca8d1] shadow-inner">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wider uppercase">
                  Galaksi Sanat & Konsept Galerisi
                </h2>
                <span className="text-[10px] bg-[#0b2438] text-cyan-300 px-2 py-0.5 rounded-sm border border-[#1c445c] font-mono font-bold">
                  Magnific AI Powered
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Hard Sci-Fi Gemi, İstasyon ve Gezegen Konsept Raporu
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/40 border border-transparent transition-all"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2 bg-[#07131e] border-b border-[#18374b] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Tüm Varlıklar', count: GALLERY_ASSETS.length },
              { id: 'ships', label: 'Gemiler & Filolar', count: 4 },
              { id: 'structures', label: 'Stratejik Röle & Üsler', count: 1 },
              { id: 'planets', label: 'Gezegen Biyomları', count: 1 },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(id as typeof selectedCategory);
                }}
                className={`px-3 py-1 rounded-sm text-xs font-mono transition-all flex items-center gap-1.5 ${
                  selectedCategory === id
                    ? 'stellaris-switcher-btn active font-bold text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c2233]'
                }`}
              >
                <span>{label}</span>
                <span className="text-[10px] opacity-60">({count})</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Detaylı inceleme için sol listeden seçim yapın
          </div>
        </div>

        {/* Main Content Area (Split-View: Left Showcase + Right Detail) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Asset Thumbnails Grid */}
          <div className="w-72 border-r border-[#18374b] overflow-y-auto p-3 pb-6 space-y-2 bg-[#06121c]">
            {filteredAssets.map((asset) => {
              const isSelected = activeAsset.id === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveAsset(asset);
                  }}
                  className={`p-2.5 rounded-sm border cursor-pointer transition-all flex items-center gap-3 group ${
                    isSelected
                      ? 'bg-[#0f283d] border-[#3ca8d1] shadow-md shadow-cyan-950/40'
                      : 'stellaris-item-card border-[#1c3647] hover:border-[#3885a8]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-sm overflow-hidden shrink-0 border border-[#18374b] bg-[#07131e] relative">
                    <img
                      src={asset.imageSrc}
                      alt={asset.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: asset.accentColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate font-mono">
                      {asset.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                      {asset.role}
                    </span>
                    <span
                      className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm inline-block mt-1"
                      style={{
                        backgroundColor: `${asset.accentColor}20`,
                        color: asset.accentColor,
                        border: `1px solid ${asset.accentColor}40`,
                      }}
                    >
                      {asset.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Hero Asset Inspection & Specifications */}
          <div className="flex-1 overflow-y-auto p-6 pb-6 flex flex-col justify-between bg-space-900/60">
            <div className="space-y-5">
              {/* Asset Hero Image Frame */}
              <div className="relative w-full h-72 rounded-sm overflow-hidden border border-slate-700 bg-space-950 group shadow-2xl flex items-center justify-center">
                <img
                  src={activeAsset.imageSrc}
                  alt={activeAsset.title}
                  className="w-full h-full object-contain cursor-pointer transition-all duration-300 group-hover:scale-105"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {/* Overlay Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-2 rounded-sm bg-black/70 backdrop-blur-md border border-white/20 text-white hover:text-cyber-cyan transition-all"
                    title="Tam Boyut Görüntüle"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <a
                    href={activeAsset.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-sm bg-black/70 backdrop-blur-md border border-white/20 text-white hover:text-cyber-cyan transition-all"
                    title="Magnific Studio Bağlantısı"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-slate-700 px-3 py-1 rounded-sm text-xs font-mono text-slate-300">
                  <span className="text-cyber-cyan font-bold">1024 × 1024</span> • Google Nano Banana Pro
                </div>
              </div>

              {/* Title & Lore Section */}
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-100 font-display">
                    {activeAsset.title}
                  </h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${activeAsset.accentColor}25`,
                      color: activeAsset.accentColor,
                      border: `1px solid ${activeAsset.accentColor}50`,
                    }}
                  >
                    {activeAsset.role}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {activeAsset.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block mb-2">
                  Teknik Veriler ve Oyun İçi İşlevi
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeAsset.specifications.map((spec, i) => (
                    <div
                      key={i}
                      className="stellaris-item-card border-[#1c3647] p-2.5 flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spec.label}
                      </span>
                      <span className="text-xs font-bold text-slate-100 font-mono mt-1">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Status & Feedback Action */}
            <div className="pt-3 border-t border-[#18374b] flex items-center justify-between text-xs text-slate-400 font-mono mt-4">
              <span>Bu görsel varlıklar doğrudan oyun arayüzü ve tersane modellerine entegre edilmiştir.</span>
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-4 py-1.5 stellaris-btn-metallic text-cyan-200 rounded-sm font-mono font-bold text-xs uppercase tracking-wider transition-all"
              >
                Oyuna Dön
              </button>
            </div>
          </div>
        </div>
      </div>
  );

  return (
    <>
      {isDocked ? (
        content
      ) : (
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
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <img
            src={activeAsset.imageSrc}
            alt={activeAsset.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm shadow-2xl border border-slate-700"
          />
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
};
