import { PlanetBiome } from '../engine/types';

export interface PlanetVisualAsset {
  type: PlanetBiome;
  nameTr: string;
  spaceImage: string;
  surfaceImage: string;
  themeColor: string;
  glowColor: string;
  description: string;
  habitability: string;
}

export const PLANET_VISUAL_ASSETS: Record<string, PlanetVisualAsset> = {
  terran: {
    type: 'terran',
    nameTr: 'Yaşanabilir (Terran)',
    spaceImage: '/planets/planet_terra_space.png',
    surfaceImage: '/planets/planet_terra_surface.png',
    themeColor: '#10b981',
    glowColor: '#00f3ff',
    description: 'Biyolojik çeşitlilikle zengin, ılıman okyanuslar ve geniş kıtalarla kaplı ideal kolonizasyon dünyası.',
    habitability: '%100 İdeal Uyumluluk',
  },
  ocean: {
    type: 'ocean',
    nameTr: 'Okyanus Dünyası',
    spaceImage: '/planets/planet_ocean_space.png',
    surfaceImage: '/planets/planet_ocean_surface.png',
    themeColor: '#0284c7',
    glowColor: '#38bdf8',
    description: 'Küresel derin akıntılar ve biyolüminesans denizlerle kaplı su dünyası. Yüzen mega platformlar gerektirir.',
    habitability: '%80 Yüksek Uyumluluk',
  },
  desert: {
    type: 'desert',
    nameTr: 'Çöl & Kanyon Dünyası',
    spaceImage: '/planets/planet_desert_space.png',
    surfaceImage: '/planets/planet_desert_surface.png',
    themeColor: '#f59e0b',
    glowColor: '#fbbf24',
    description: 'Geniş altın kumul okyanusları ve kristal kanyonlar. Yüksek mineral ve kristal konsantrasyonu barındırır.',
    habitability: '%60 Orta Uyumluluk',
  },
  ice: {
    type: 'ice',
    nameTr: 'Buzul Dünyası',
    spaceImage: '/planets/planet_ice_space.png',
    surfaceImage: '/planets/planet_ice_surface.png',
    themeColor: '#38bdf8',
    glowColor: '#bae6fd',
    description: 'Kriyosferik donmuş yüzey ve kilometrelerce derinlikte buzul altı hidrotermal çatlaklar.',
    habitability: '%50 Zorlu Koşullar',
  },
  volcanic: {
    type: 'volcanic',
    nameTr: 'Volkanik Magma Dünyası',
    spaceImage: '/planets/planet_volcanic_space.png',
    surfaceImage: '/planets/planet_volcanic_surface.png',
    themeColor: '#ef4444',
    glowColor: '#f97316',
    description: 'Tektonik olarak aşırı aktif, bazaltik lav nehirleri ve zengin ağır metal cevher yatakları.',
    habitability: '%30 Aşırı Tehlikeli',
  },
  gas: {
    type: 'gas',
    nameTr: 'Gaz Devi',
    spaceImage: '/planets/planet_gas_space.png',
    surfaceImage: '/planets/planet_gas_surface.png',
    themeColor: '#a855f7',
    glowColor: '#c084fc',
    description: 'Göz alıcı fırtına bantları ve devasa halka sistemi. Üst atmosferde yüzen hidrokarbon rafinerileri kurulabilir.',
    habitability: '%0 Yüzey Yok (Atmosferik İstasyon)',
  },
  gaia: {
    type: 'gaia',
    nameTr: 'Gaia Cennet Dünyası',
    spaceImage: '/planets/planet_terra_space.png',
    surfaceImage: '/planets/planet_terra_surface.png',
    themeColor: '#10b981',
    glowColor: '#34d399',
    description: 'Kusursuz biyo-ahenk ve yapay ekosistem dengesi ile inşa edilmiş cennet dünyası. %125 uyumluluk ve %25 her kaynakta bonus.',
    habitability: '%125 Kusursuz Cennet',
  },
  tomb: {
    type: 'tomb',
    nameTr: 'Kıyamet Sonrası Çorak Dünya',
    spaceImage: '/planets/planet_volcanic_space.png',
    surfaceImage: '/planets/planet_volcanic_surface.png',
    themeColor: '#78716c',
    glowColor: '#a8a29e',
    description: 'Kadim termonükleer veya biyolojik savaşlarla çölleşmiş, yüksek radyasyonlu harabe dünya. Islah edilmeye muhtaçtır.',
    habitability: '%30 Radyoaktif Çoraklık',
  },
};

export function getPlanetAsset(type: string | undefined): PlanetVisualAsset {
  if (!type) return PLANET_VISUAL_ASSETS.terran;
  return PLANET_VISUAL_ASSETS[type] || PLANET_VISUAL_ASSETS.terran;
}
