import type { BottleStyleId, PotionColor } from '../game/types';

export interface Liquid3DPalette {
  edge: string;
  highlight: string;
  core: string;
  shadow: string;
  bounce: string;
  meniscus: string;
}

export const LIQUID_3D_PALETTES: Record<PotionColor, Liquid3DPalette> = {
  coral: {
    edge: '#B80C15',
    highlight: '#FF4F5A',
    core: '#E81621',
    shadow: '#A10912',
    bounce: '#DE2A35',
    meniscus: '#FF5C66',
  },
  seafoam: {
    edge: '#5AA100',
    highlight: '#A9F522',
    core: '#7CD604',
    shadow: '#4B8A00',
    bounce: '#93E617',
    meniscus: '#BBFA3E',
  },
  citron: {
    edge: '#D9A000',
    highlight: '#FFF159',
    core: '#FFCC00',
    shadow: '#BF8A00',
    bounce: '#FFE240',
    meniscus: '#FFF470',
  },
  azure: {
    edge: '#1024B0',
    highlight: '#4572FF',
    core: '#1E40EB',
    shadow: '#0D1E91',
    bounce: '#355CFF',
    meniscus: '#5E88FF',
  },
  iris: {
    edge: '#57128F',
    highlight: '#A64CE6',
    core: '#7A22BD',
    shadow: '#410B70',
    bounce: '#9136D6',
    meniscus: '#B869F0',
  },
  rose: {
    edge: '#D64F00',
    highlight: '#FFA53B',
    core: '#FF6B00',
    shadow: '#B54200',
    bounce: '#FF8A2B',
    meniscus: '#FFB559',
  },
  jade: {
    edge: '#008C70',
    highlight: '#4CFCE0',
    core: '#00C9A0',
    shadow: '#006B54',
    bounce: '#2EE8C2',
    meniscus: '#75FFE6',
  },
};

export interface BottleDesignSpec {
  id: BottleStyleId;
  shortLabel: string;
  title: string;
  tagline: string;
  /** ViewBox 0 0 80 136 — wide-necked chunky Pixar apothecary proportions */
  outerPath: string;
  /** Inner cavity inset ~5px so thick clear glass wall wraps the liquid */
  innerClipPath: string;
  /** Soft blurred studio window catchlight path */
  shoulderHighlightPath: string;
  /** Soft blurred lower cheek specular highlight */
  cheekHighlightPath: string;
  /** Right-side curved rim specular reflection */
  rightHighlightPath: string;
  /** Chunky flared glass lip rectangle geometry */
  lipX: number;
  lipY: number;
  lipW: number;
  lipH: number;
  /** Wide neck coordinates right under the flared lip */
  neckX: number;
  neckW: number;
  /** Pure colorless clear glass palette */
  glassRimTint: string;
  glassRimGlow: string;
  glassInteriorWash: string;
  glassBaseCaustic: string;
  /** Base ellipse geometry */
  baseCenterY: number;
  baseRx: number;
  /** 4 liquid layer top Y positions inside 80x136 */
  slotHeights: [number, number, number, number];
  slotHeight: number;
  baseBottomY: number;
}

export const BOTTLE_DESIGNS: Record<BottleStyleId, BottleDesignSpec> = {
  starlight: {
    id: 'starlight',
    shortLabel: 'A · Apothecary',
    title: 'Wide-Mouth Apothecary',
    tagline: 'Matched wide stout neck, fat rolled lip & pure clear crystal glass',
    // Direct match to reference jar: wide short neck (x=22..58), rounded-square stout body (x=9..71)
    outerPath:
      'M 22 21 L 58 21 L 58 29 C 58 35 71 39 71 53 L 71 108 C 71 122 60 128 40 128 C 20 128 9 122 9 108 L 9 53 C 9 39 22 35 22 29 Z',
    innerClipPath:
      'M 26 26 L 54 26 L 54 31.5 C 54.5 38 65.5 42 65.5 54 L 65.5 106.5 C 65.5 117 56.5 121.5 40 121.5 C 23.5 121.5 14.5 117 14.5 106.5 L 14.5 54 C 14.5 42 25.5 38 26 31.5 Z',
    shoulderHighlightPath:
      'M 13.5 55 C 14 43 20 39 24.5 35 L 27.5 38 C 23 42 20 47 19.5 56 L 19 84 L 13 82 Z',
    cheekHighlightPath:
      'M 13 91 L 19 92 L 19.5 108 C 20 114 24 118 29 120 L 22 121 C 16 118 13 112 13 104 Z',
    rightHighlightPath:
      'M 65.5 52 C 67 60 67 82 66 105 C 65 114 59 119 51 122',
    lipX: 15,
    lipY: 10.5,
    lipW: 50,
    lipH: 11,
    neckX: 22,
    neckW: 36,
    glassRimTint: 'rgba(244, 250, 255, 0.54)',
    glassRimGlow: 'rgba(255, 255, 255, 0.94)',
    glassInteriorWash: 'rgba(255, 255, 255, 0.015)',
    glassBaseCaustic: 'rgba(255, 248, 224, 0.36)',
    baseCenterY: 122.5,
    baseRx: 24,
    slotHeights: [102, 83, 64, 45],
    slotHeight: 19,
    baseBottomY: 122,
  },
  royal_crown: {
    id: 'royal_crown',
    shortLabel: 'B · Orb Jar',
    title: 'Clear Potion Orb',
    tagline: 'Wide stout neck, chubby spherical belly & colorless crystal glass',
    outerPath:
      'M 23 21.5 L 57 21.5 L 57 29 C 60 36 74 48 75 73 C 76 96 68 116 58 123 C 52 127 46 128 40 128 C 34 128 28 127 22 123 C 12 116 4 96 5 73 C 6 48 20 36 23 29 Z',
    innerClipPath:
      'M 27 26.5 L 53 26.5 L 53 31.5 C 56 38.5 68 50 69 73 C 70 94 63 111.5 54 118 C 49.5 121 44.5 121.5 40 121.5 C 35.5 121.5 30.5 121 26 118 C 17 111.5 10 94 11 73 C 12 50 24 38.5 27 31.5 Z',
    shoulderHighlightPath:
      'M 10.5 70 C 12 52 19 42 25 36 L 28 39 C 22 46 17.5 55 16 71 L 15.5 87 L 10 85 Z',
    cheekHighlightPath:
      'M 10 92 L 15.5 93 C 16.5 104 20 113 27 118 L 21 119 C 14 113 10 104 10 92 Z',
    rightHighlightPath:
      'M 67.5 60 C 71 74 70 94 63 109 C 60 116 54 120 48 122',
    lipX: 16,
    lipY: 11,
    lipW: 48,
    lipH: 11,
    neckX: 23,
    neckW: 34,
    glassRimTint: 'rgba(246, 250, 255, 0.54)',
    glassRimGlow: 'rgba(255, 255, 255, 0.94)',
    glassInteriorWash: 'rgba(255, 255, 255, 0.015)',
    glassBaseCaustic: 'rgba(255, 248, 224, 0.36)',
    baseCenterY: 122.5,
    baseRx: 20,
    slotHeights: [102, 83, 64, 45],
    slotHeight: 19,
    baseBottomY: 122,
  },
  crystal_prism: {
    id: 'crystal_prism',
    shortLabel: 'C · Prism',
    title: 'Clear Prism Flask',
    tagline: 'Wide beveled collar, cut-crystal shoulders & clear glass walls',
    outerPath:
      'M 23 21 L 57 21 L 58 29 L 70 44 C 72 46 72 50 71 55 L 67 108 C 66 113 63 118 57 122 L 49 127 C 46 128 43 128 40 128 C 37 128 34 128 31 127 L 23 122 C 17 118 14 113 13 108 L 9 55 C 8 50 8 46 10 44 L 22 29 Z',
    innerClipPath:
      'M 27 26 L 53 26 L 54 31.5 L 65 45.5 C 66.5 47 66.5 50.5 66 54.5 L 62 106 C 61 110.5 58 114.5 53 117.5 L 47 121.5 L 33 121.5 L 27 117.5 C 22 114.5 19 110.5 18 106 L 14 54.5 C 13.5 50.5 13.5 47 15 45.5 L 26 31.5 Z',
    shoulderHighlightPath:
      'M 13 48 L 24 34 L 27 37 L 18.5 49 L 19.5 84 L 13.5 82 Z',
    cheekHighlightPath:
      'M 14.5 90 L 20 91 L 21 109 L 27.5 119 L 21.5 120 L 15.5 109 Z',
    rightHighlightPath:
      'M 65.5 49 L 62.5 106 C 60.5 113 55 118 48 122',
    lipX: 16.5,
    lipY: 10.5,
    lipW: 47,
    lipH: 10.5,
    neckX: 23,
    neckW: 34,
    glassRimTint: 'rgba(244, 249, 255, 0.56)',
    glassRimGlow: 'rgba(255, 255, 255, 0.95)',
    glassInteriorWash: 'rgba(255, 255, 255, 0.015)',
    glassBaseCaustic: 'rgba(255, 248, 224, 0.36)',
    baseCenterY: 122.5,
    baseRx: 18,
    slotHeights: [102, 83, 64, 45],
    slotHeight: 19,
    baseBottomY: 122,
  },
  botanical_brass: {
    id: 'botanical_brass',
    shortLabel: 'D · Squat',
    title: 'Squat Vial Jar',
    tagline: 'Wide tapered neck, weighted crystal base & pure clear glass',
    outerPath:
      'M 24 21 L 56 21 L 56 30 C 58 40 66 53 70 72 C 73 88 72 108 66 118 C 61 125 52 128 40 128 C 28 128 19 125 14 118 C 8 108 7 88 10 72 C 14 53 22 40 24 30 Z',
    innerClipPath:
      'M 27.8 26 L 52.2 26 L 52.4 31.5 C 54.5 41.5 61.5 54 64.5 72 C 67 87 66 104 61 113 C 57 119.5 50 121.5 40 121.5 C 30 121.5 23 119.5 19 113 C 14 104 13 87 15.5 72 C 18.5 54 25.5 41.5 27.6 31.5 Z',
    shoulderHighlightPath:
      'M 14.5 73 C 17.5 57 22 46 26.5 38 L 29 41 C 25 49 21.5 60 19.5 75 L 18.5 91 L 13 89 Z',
    cheekHighlightPath:
      'M 13 95 L 18.5 96 C 19 107 22 115 28 120 L 22 120 C 16 115 13 107 13 95 Z',
    rightHighlightPath:
      'M 65 72 C 68 88 67 104 61 114 C 58 119 53 121 48 123',
    lipX: 17.5,
    lipY: 11,
    lipW: 45,
    lipH: 10.5,
    neckX: 24,
    neckW: 32,
    glassRimTint: 'rgba(244, 250, 255, 0.54)',
    glassRimGlow: 'rgba(255, 255, 255, 0.94)',
    glassInteriorWash: 'rgba(255, 255, 255, 0.015)',
    glassBaseCaustic: 'rgba(255, 248, 224, 0.36)',
    baseCenterY: 122.5,
    baseRx: 21,
    slotHeights: [102, 83, 64, 45],
    slotHeight: 19,
    baseBottomY: 122,
  },
};

export const BOTTLE_STYLE_LIST: BottleDesignSpec[] = [
  BOTTLE_DESIGNS.starlight,
  BOTTLE_DESIGNS.royal_crown,
  BOTTLE_DESIGNS.crystal_prism,
  BOTTLE_DESIGNS.botanical_brass,
];
