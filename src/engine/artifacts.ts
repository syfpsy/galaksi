import { EmpireArtifact, EmpireArtifactId } from './types';

export const EMPIRE_ARTIFACTS: Record<EmpireArtifactId, EmpireArtifact> = {
  progenitor_matrix: {
    id: 'progenitor_matrix',
    nameTr: 'Öncü Veri Matrisi',
    categoryTr: 'Kadim Arkeolojik Veri Bloğu',
    icon: '💾',
    color: '#00f3ff',
    descriptionTr: 'Milyonlarca yıllık bir öncü uygarlığın kuantum şifreli laboratuvar arşivleri. Bilimsel hipotez testlerini otomatik simüle eder.',
    effectTr: '+%10 Tüm İmparatorluk Araştırma Hızı',
  },
  rift_hyperdrive: {
    id: 'rift_hyperdrive',
    nameTr: 'Yarık Hiper-Sürücüsü',
    categoryTr: 'Boyutlararası Sevk Teknolojisi',
    icon: '⚡',
    color: '#a855f7',
    descriptionTr: 'Karanlık madde girdaplarından enerji çeken egzotik bir itki prototipi. Hiper-hat sıçrama sürelerini belirgin ölçüde kısaltır.',
    effectTr: '+%10 Tüm Filo Seyir Hızı',
  },
  dreadnought_plating: {
    id: 'dreadnought_plating',
    nameTr: 'Dretnot Zırh Plakaları',
    categoryTr: 'Antik Ağır Metalurji',
    icon: '🛡️',
    color: '#f59e0b',
    descriptionTr: 'Kadim bir savaş gemisinin reaktör çekirdeğiyle güçlendirilmiş yoğunlaştırılmış nötronik zırh tabakaları.',
    effectTr: '+%10 Filo Ateş Gücü ve Hasar Dayanıklılığı',
  },
  subspace_tachyon_array: {
    id: 'subspace_tachyon_array',
    nameTr: 'Takyon Sensör Dizisi',
    categoryTr: 'Gelişmiş Erken Uyarı Şebekesi',
    icon: '📡',
    color: '#10b981',
    descriptionTr: 'Alt-uzay frekanslarındaki bükülmeleri ışık hızının katbekat üzerinde algılayan takyonik alıcı kulesi.',
    effectTr: '+1 Galaktik Sensör Görüş Menzili',
  },
};
