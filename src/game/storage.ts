import type { BottleStyleId, IngredientId, PlayerProfile } from './types';

const STORAGE_KEY = 'solstice_sort_profile_v1';
export const LIFE_REGEN_MS = 25 * 60 * 1000; // 25 minutes per life

export const DEFAULT_PROFILE: PlayerProfile = {
  highestLevel: 1,
  coins: 250,
  lives: 5,
  maxLives: 5,
  lastLifeTimestamp: Date.now(),
  streak: 0,
  boosters: {
    undo: 5,
    shuffle: 3,
    extraFlask: 2,
  },
  ingredients: {
    citrus: 2,
    crystal: 1,
    dew: 1,
    mist: 0,
  },
  eventStars: 0,
  claimedEventMilestones: [],
  adsRemoved: false,
  soundEnabled: true,
  bgmEnabled: true,
  hapticsEnabled: true,
  colorSymbolsEnabled: false,
  bottleStyle: 'starlight',
  language: 'zh',
  completedTrials: [],
  lastDailyRewardDate: null,
  dailyLoginStreak: 0,
};

export function regenerateLives(profile: PlayerProfile, now = Date.now()): PlayerProfile {
  if (profile.lives >= profile.maxLives) {
    return { ...profile, lives: profile.maxLives, lastLifeTimestamp: now };
  }
  const elapsed = Math.max(0, now - profile.lastLifeTimestamp);
  const gained = Math.floor(elapsed / LIFE_REGEN_MS);
  if (gained <= 0) return profile;

  const nextLives = Math.min(profile.maxLives, profile.lives + gained);
  const remainderMs = elapsed % LIFE_REGEN_MS;
  return {
    ...profile,
    lives: nextLives,
    lastLifeTimestamp: nextLives >= profile.maxLives ? now : now - remainderMs,
  };
}

export function getNextLifeCountdownMs(profile: PlayerProfile, now = Date.now()): number {
  if (profile.lives >= profile.maxLives) return 0;
  const elapsed = Math.max(0, now - profile.lastLifeTimestamp);
  const rem = LIFE_REGEN_MS - (elapsed % LIFE_REGEN_MS);
  return rem;
}

export function loadProfile(): PlayerProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE, lastLifeTimestamp: Date.now() };
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const validStyles: BottleStyleId[] = [
      'starlight',
      'royal_crown',
      'crystal_prism',
      'botanical_brass',
    ];
    const merged: PlayerProfile = {
      ...DEFAULT_PROFILE,
      ...parsed,
      bgmEnabled:
        typeof parsed.bgmEnabled === 'boolean' ? parsed.bgmEnabled : DEFAULT_PROFILE.bgmEnabled,
      language: parsed.language === 'en' || parsed.language === 'zh' ? parsed.language : 'zh',
      bottleStyle:
        parsed.bottleStyle && validStyles.includes(parsed.bottleStyle)
          ? parsed.bottleStyle
          : DEFAULT_PROFILE.bottleStyle,
      boosters: { ...DEFAULT_PROFILE.boosters, ...(parsed.boosters ?? {}) },
      ingredients: { ...DEFAULT_PROFILE.ingredients, ...(parsed.ingredients ?? {}) },
      claimedEventMilestones: Array.isArray(parsed.claimedEventMilestones)
        ? parsed.claimedEventMilestones
        : [],
      completedTrials: Array.isArray(parsed.completedTrials) ? parsed.completedTrials : [],
      lastDailyRewardDate:
        typeof parsed.lastDailyRewardDate === 'string' ? parsed.lastDailyRewardDate : null,
      dailyLoginStreak:
        typeof parsed.dailyLoginStreak === 'number' && Number.isFinite(parsed.dailyLoginStreak)
          ? Math.max(0, Math.floor(parsed.dailyLoginStreak))
          : 0,
    };
    return regenerateLives(merged);
  } catch {
    return { ...DEFAULT_PROFILE, lastLifeTimestamp: Date.now() };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export interface AlembicRecipe {
  id: 'undo_tonic' | 'shuffle_draught' | 'flask_elixir';
  name: string;
  description: string;
  rewardKey: 'undo' | 'shuffle' | 'extraFlask';
  rewardAmount: number;
  cost: Record<IngredientId, number>;
}

export const ALEMBIC_RECIPES: AlembicRecipe[] = [
  {
    id: 'undo_tonic',
    name: 'Solar Rewind Tonic',
    description: 'Brews +2 Undo charges for tricky turns',
    rewardKey: 'undo',
    rewardAmount: 2,
    cost: { citrus: 2, crystal: 1, dew: 0, mist: 0 },
  },
  {
    id: 'shuffle_draught',
    name: 'Zephyr Mix Draught',
    description: 'Brews +1 Shuffle charge to remix open flasks',
    rewardKey: 'shuffle',
    rewardAmount: 1,
    cost: { citrus: 1, crystal: 0, dew: 2, mist: 1 },
  },
  {
    id: 'flask_elixir',
    name: 'Crystal Vessel Elixir',
    description: 'Brews +1 Extra Flask charge for tight boards',
    rewardKey: 'extraFlask',
    rewardAmount: 1,
    cost: { citrus: 1, crystal: 2, dew: 1, mist: 1 },
  },
];

export interface EventMilestone {
  starsRequired: number;
  rewardCoins: number;
  rewardBooster?: { key: 'undo' | 'shuffle' | 'extraFlask'; amount: number; label: string };
}

export const EVENT_MILESTONES: EventMilestone[] = [
  { starsRequired: 10, rewardCoins: 80 },
  {
    starsRequired: 25,
    rewardCoins: 120,
    rewardBooster: { key: 'undo', amount: 2, label: '+2 Undo' },
  },
  {
    starsRequired: 45,
    rewardCoins: 160,
    rewardBooster: { key: 'shuffle', amount: 1, label: '+1 Shuffle' },
  },
  {
    starsRequired: 70,
    rewardCoins: 220,
    rewardBooster: { key: 'extraFlask', amount: 1, label: '+1 Flask' },
  },
  {
    starsRequired: 100,
    rewardCoins: 400,
    rewardBooster: { key: 'extraFlask', amount: 2, label: '+2 Flasks' },
  },
];
