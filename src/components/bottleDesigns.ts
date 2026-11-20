import type { PotionColor } from '../game/types';

export interface Liquid3DPalette {
  edge: string;
  highlight: string;
  core: string;
  innerGlow: string;
  shadow: string;
  bounce: string;
  meniscus: string;
  meniscusRim: string;
  sparkle: string;
  caustic: string;
}

export const LIQUID_3D_PALETTES: Record<PotionColor, Liquid3DPalette> = {
  coral: {
    edge: '#A60824',
    highlight: '#FF4F72',
    core: '#EC183E',
    innerGlow: '#FFA6B8',
    shadow: '#7D041A',
    bounce: '#FF5778',
    meniscus: '#FF7D97',
    meniscusRim: '#FFE6EC',
    sparkle: '#FFD9E2',
    caustic: '#FF3B63',
  },
  seafoam: {
    edge: '#0B8C30',
    highlight: '#4DFF69',
    core: '#13C947',
    innerGlow: '#C4FF80',
    shadow: '#086924',
    bounce: '#5AFF78',
    meniscus: '#9BFF8A',
    meniscusRim: '#ECFFE6',
    sparkle: '#E2FFDA',
    caustic: '#3BF568',
  },
  citron: {
    edge: '#C77800',
    highlight: '#FFE74D',
    core: '#FFB800',
    innerGlow: '#FFF8B3',
    shadow: '#995400',
    bounce: '#FFDC38',
    meniscus: '#FFF18A',
    meniscusRim: '#FFFDE6',
    sparkle: '#FFFBD6',
    caustic: '#FFD438',
  },
  azure: {
    edge: '#0B44D6',
    highlight: '#24B9FF',
    core: '#0E78FF',
    innerGlow: '#82F6FF',
    shadow: '#082FA3',
    bounce: '#42D8FF',
    meniscus: '#80F0FF',
    meniscusRim: '#E6FDFF',
    sparkle: '#D9FBFF',
    caustic: '#36D7FF',
  },
  iris: {
    edge: '#5812AD',
    highlight: '#C56CFF',
    core: '#8D2AF2',
    innerGlow: '#EBBFFF',
    shadow: '#3F0A82',
    bounce: '#B85EFF',
    meniscus: '#D89CFF',
    meniscusRim: '#F7E8FF',
    sparkle: '#F1DCFF',
    caustic: '#BA61FF',
  },
  rose: {
    edge: '#C43800',
    highlight: '#FFA033',
    core: '#FF5E00',
    innerGlow: '#FFE382',
    shadow: '#962600',
    bounce: '#FF8E24',
    meniscus: '#FFC461',
    meniscusRim: '#FFF3D6',
    sparkle: '#FFEDC7',
    caustic: '#FF8C24',
  },
  jade: {
    edge: '#007A70',
    highlight: '#42FFE8',
    core: '#00C7B6',
    innerGlow: '#BDFFF6',
    shadow: '#005952',
    bounce: '#3BF2DF',
    meniscus: '#8CFFF1',
    meniscusRim: '#E8FFFC',
    sparkle: '#DCFFFA',
    caustic: '#29F0DC',
  },
};
