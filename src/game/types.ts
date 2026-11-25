export type PotionColor =
  | 'coral'
  | 'seafoam'
  | 'citron'
  | 'azure'
  | 'iris'
  | 'rose'
  | 'jade';

export const BOTTLE_CAPACITY = 4;

export interface PotionColorMeta {
  id: PotionColor;
  name: string;
  fill: string;
  highlight: string;
  meniscus: string;
  symbol: string;
}

export const POTION_COLORS: Record<PotionColor, PotionColorMeta> = {
  coral: {
    id: 'coral',
    name: 'Ruby Berry',
    fill: '#EE1D2B',
    highlight: '#FF707A',
    meniscus: '#FFAEB5',
    symbol: '☀',
  },
  seafoam: {
    id: 'seafoam',
    name: 'Neon Lime',
    fill: '#75C908',
    highlight: '#B4F24B',
    meniscus: '#DCFCA1',
    symbol: '✦',
  },
  citron: {
    id: 'citron',
    name: 'Solar Gold',
    fill: '#FFCB05',
    highlight: '#FFE66D',
    meniscus: '#FFF4B8',
    symbol: '◆',
  },
  azure: {
    id: 'azure',
    name: 'Cobalt Splash',
    fill: '#134DF0',
    highlight: '#5D8BFF',
    meniscus: '#B0CAFF',
    symbol: '●',
  },
  iris: {
    id: 'iris',
    name: 'Royal Grape',
    fill: '#8E2CE8',
    highlight: '#C27DFF',
    meniscus: '#E5C7FF',
    symbol: '◈',
  },
  rose: {
    id: 'rose',
    name: 'Bubblegum Pink',
    fill: '#FF2F92',
    highlight: '#FF85C0',
    meniscus: '#FFC7E3',
    symbol: '✿',
  },
  jade: {
    id: 'jade',
    name: 'Aqua Mint',
    fill: '#00C49A',
    highlight: '#5CF0D0',
    meniscus: '#B8FCF0',
    symbol: '▲',
  },
};

export type BottleObstacle =
  | { type: 'none' }
  | { type: 'cork'; requiredColor: PotionColor }
  | { type: 'crate'; lockColor: PotionColor }
  | { type: 'curtain'; unlockColor: PotionColor };

export interface LiquidLayer {
  color: PotionColor;
  hidden: boolean;
}

export interface Bottle {
  id: string;
  layers: LiquidLayer[]; // bottom [0] -> top [n-1]
  obstacle: BottleObstacle;
  isExtra?: boolean;
}

export type DifficultyTier = 'normal' | 'hard' | 'super_hard';

export type IngredientId = 'citrus' | 'crystal' | 'dew' | 'mist';

export interface LevelSpec {
  levelNumber: number;
  title: string;
  potionOrderName: string;
  difficulty: DifficultyTier;
  colorCount: number;
  bottles: Bottle[];
  rewardCoins: number;
  rewardIngredient: IngredientId;
  mechanicsIntroduced: string[];
}

export type AppScreen =
  | 'HOME'
  | 'PLAYING'
  | 'LEVEL_MAP'
  | 'ALEMBIC'
  | 'SHOP'
  | 'EVENT'
  | 'ACHIEVEMENTS';

export type BottleStyleId = 'starlight' | 'royal_crown' | 'crystal_prism' | 'botanical_brass';

export type LanguageCode = 'zh' | 'en';

export type CgOutcome = 'victory' | 'defeat';
export type CgTier = 1 | 2 | 3;
export type OutcomeCgId = `${CgOutcome}_${CgTier}`;

export type PlayModal =
  | 'NONE'
  | 'PAUSED'
  | 'VICTORY'
  | 'DEFEAT'
  | 'NO_LIVES'
  | 'SETTINGS'
  | 'AD_SIMULATION'
  | 'REMOVE_ADS_CONFIRM'
  | 'DAILY_REWARD';

export interface BoostersInventory {
  undo: number;
  shuffle: number;
  extraFlask: number;
}

export interface IngredientsInventory {
  citrus: number;
  crystal: number;
  dew: number;
  mist: number;
}

export type TutorialTipId = 'basics' | 'mystery' | 'cork' | 'crate' | 'curtain';

export interface NotificationSeenState {
  cgIds: OutcomeCgId[];
  eventMilestones: number[];
  alembicRecipes: string[];
  dailyRewardDate: string | null;
}

export interface PlayerProfile {
  highestLevel: number;
  coins: number;
  lives: number;
  maxLives: number;
  lastLifeTimestamp: number;
  streak: number;
  bestStreak: number;
  boosters: BoostersInventory;
  ingredients: IngredientsInventory;
  eventStars: number;
  claimedEventMilestones: number[];
  unlockedCgs: OutcomeCgId[];
  claimedCgRewards: OutcomeCgId[];
  totalDefeats: number;
  seenNotifications: NotificationSeenState;
  seenTutorials: TutorialTipId[];
  adsRemoved: boolean;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  hapticsEnabled: boolean;
  colorSymbolsEnabled: boolean;
  bottleStyle: BottleStyleId;
  language: LanguageCode;
  completedTrials: string[];
  lastDailyRewardDate: string | null;
  dailyLoginStreak: number;
}
