import type { CgOutcome, CgTier } from './types';

export type CgOverlayMood =
  | 'warm_sparkle'
  | 'rainbow_orbit'
  | 'solstice_finale'
  | 'pink_puff'
  | 'bubble_overflow'
  | 'sooty_rally';

export interface OutcomeCgEntry {
  outcome: CgOutcome;
  tier: CgTier;
  imageSrc: string;
  mood: CgOverlayMood;
  badgeZh: string;
  badgeEn: string;
  titleZh: string;
  titleEn: string;
  captionZh: string;
  captionEn: string;
}

export const OUTCOME_CG_CATALOG: Record<CgOutcome, Record<CgTier, OutcomeCgEntry>> = {
  victory: {
    1: {
      outcome: 'victory',
      tier: 1,
      imageSrc: '/assets/cg/victory-tier-1.jpg',
      mood: 'warm_sparkle',
      badgeZh: '一阶 · 初酿微光',
      badgeEn: 'Tier I · Warm Brew',
      titleZh: '魔药调配成功！',
      titleEn: 'Potion Brewed!',
      captionZh: '晨光洒满炼金台，第一缕金辉在水晶瓶中点亮！',
      captionEn: 'Morning sunbeams kiss the workbench as your first elixir gleams!',
    },
    2: {
      outcome: 'victory',
      tier: 2,
      imageSrc: '/assets/cg/victory-tier-2.jpg',
      mood: 'rainbow_orbit',
      badgeZh: '二阶 · 双星共鸣',
      badgeEn: 'Tier II · Radiant Streak',
      titleZh: '彩虹星河共鸣！',
      titleEn: 'Radiant Resonance!',
      captionZh: '连胜魔力涌出大釜，小龙驾着彩虹星轨在工坊起舞！',
      captionEn: 'Streak magic erupts from the cauldron as Sky Dragon rides the starlight!',
    },
    3: {
      outcome: 'victory',
      tier: 3,
      imageSrc: '/assets/cg/victory-tier-3.jpg',
      mood: 'solstice_finale',
      badgeZh: '三阶 · 日光圣典',
      badgeEn: 'Tier III · Solstice Finale',
      titleZh: '传说圣杯降临！',
      titleEn: 'Solstice Grand Finale!',
      captionZh: '金色日光法阵绽放穹顶，你们共同铸就了巅峰圣典魔药！',
      captionEn: 'A golden sun-mandala crowns the conservatory in legendary triumph!',
    },
  },
  defeat: {
    1: {
      outcome: 'defeat',
      tier: 1,
      imageSrc: '/assets/cg/defeat-tier-1.jpg',
      mood: 'pink_puff',
      badgeZh: '一阶 · 差一点点',
      badgeEn: 'Tier I · Gentle Puff',
      titleZh: '就差一步之遥！',
      titleEn: 'So Close to Magic!',
      captionZh: '魔药瓶俏皮地冒出一缕粉烟——再调整几步就能酿成啦！',
      captionEn: 'Just a tiny pink puff — tweak a couple pours and you have it!',
    },
    2: {
      outcome: 'defeat',
      tier: 2,
      imageSrc: '/assets/cg/defeat-tier-2.jpg',
      mood: 'bubble_overflow',
      badgeZh: '二阶 · 泡泡满屋',
      badgeEn: 'Tier II · Bubble Overflow',
      titleZh: '魔法泡泡溢出来啦！',
      titleEn: 'Bubbles Everywhere!',
      captionZh: '大釜咕嘟咕嘟飘满整屋泡泡，小龙都被托上天咯，试试道具翻盘吧！',
      captionEn: 'The cauldron bubbled sky-high — grab an extra flask to pop right back!',
    },
    3: {
      outcome: 'defeat',
      tier: 3,
      imageSrc: '/assets/cg/defeat-tier-3.jpg',
      mood: 'sooty_rally',
      badgeZh: '三阶 · 炭黑再起',
      badgeEn: 'Tier III · Sooty Rally',
      titleZh: '拍拍灰，再来一瓶！',
      titleEn: 'Dust Off & Rally!',
      captionZh: '虽然炸出了可爱的小黑脸，但碰个爪——下一局一定一把过！',
      captionEn: 'A little soot never stops true alchemists — bump paws and try again!',
    },
  },
};

export interface VictoryCgContext {
  streakAfterWin: number;
  isTrial: boolean;
}

export function resolveVictoryCgTier(ctx: VictoryCgContext): CgTier {
  if (ctx.streakAfterWin >= 3 || ctx.isTrial) {
    return 3;
  }
  if (ctx.streakAfterWin === 2) {
    return 2;
  }
  return 1;
}

export interface DefeatCgContext {
  totalDefeatCount: number;
}

export function resolveDefeatCgTier(ctx: DefeatCgContext): CgTier {
  if (ctx.totalDefeatCount >= 3) {
    return 3;
  }
  if (ctx.totalDefeatCount === 2) {
    return 2;
  }
  return 1;
}

export function getOutcomeCg(outcome: CgOutcome, tier: CgTier): OutcomeCgEntry {
  return OUTCOME_CG_CATALOG[outcome][tier];
}

let preloaded = false;
export function preloadOutcomeCgs(): void {
  if (preloaded || typeof window === 'undefined' || typeof Image === 'undefined') return;
  preloaded = true;
  const entries = [
    ...Object.values(OUTCOME_CG_CATALOG.victory),
    ...Object.values(OUTCOME_CG_CATALOG.defeat),
  ];
  entries.forEach((entry) => {
    const img = new Image();
    img.src = entry.imageSrc;
  });
}
