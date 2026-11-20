import type { BoostersInventory, PlayerProfile } from './types';

export type DailyBoosterKey = keyof BoostersInventory;

export type DailyRewardGrant =
  | {
      kind: 'coins';
      amount: number;
      dayStreak: number;
    }
  | {
      kind: 'booster';
      boosterKey: DailyBoosterKey;
      amount: number;
      dayStreak: number;
    };

const BOOSTER_POOL: DailyBoosterKey[] = ['undo', 'shuffle', 'extraFlask'];

/**
 * Returns local calendar date key 'YYYY-MM-DD' so daily login rewards reset cleanly at local midnight.
 */
export function getLocalDateKey(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns true if the player has not yet claimed today's daily login reward.
 */
export function isDailyRewardAvailable(
  lastClaimedDate: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  const today = getLocalDateKey(nowMs);
  return lastClaimedDate !== today;
}

/**
 * Computes the next consecutive daily login streak count based on yesterday's local calendar date.
 */
export function computeNextDailyStreak(
  lastClaimedDate: string | null | undefined,
  currentStreak: number,
  nowMs: number = Date.now()
): number {
  if (!lastClaimedDate) return 1;
  const todayKey = getLocalDateKey(nowMs);
  if (lastClaimedDate === todayKey) return Math.max(1, currentStreak);

  const yesterday = new Date(nowMs);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday.getTime());

  if (lastClaimedDate === yesterdayKey) {
    return Math.max(1, currentStreak) + 1;
  }
  return 1;
}

/**
 * Rolls a cozy daily login gift: either a small coin pouch (scaled gently by login streak)
 * or a random gameplay booster (+1 Undo, +1 Shuffle, or +1 Extra Crystal Flask).
 */
export function rollDailyLoginReward(
  dayStreak: number,
  rng: () => number = Math.random
): DailyRewardGrant {
  const safeStreak = Math.max(1, Math.floor(dayStreak));
  const roll = rng();

  if (roll < 0.55) {
    const baseCoins = 40 + Math.min(4, safeStreak - 1) * 15; // 40, 55, 70, 85, 100
    return {
      kind: 'coins',
      amount: baseCoins,
      dayStreak: safeStreak,
    };
  }

  const pickIdx = Math.min(
    BOOSTER_POOL.length - 1,
    Math.floor(rng() * BOOSTER_POOL.length)
  );
  return {
    kind: 'booster',
    boosterKey: BOOSTER_POOL[pickIdx],
    amount: 1,
    dayStreak: safeStreak,
  };
}

/**
 * Applies a daily login reward grant immutably to the player's profile and records today's date key.
 */
export function applyDailyLoginReward(
  profile: PlayerProfile,
  reward: DailyRewardGrant,
  nowMs: number = Date.now()
): PlayerProfile {
  const todayKey = getLocalDateKey(nowMs);
  if (reward.kind === 'coins') {
    return {
      ...profile,
      coins: profile.coins + reward.amount,
      lastDailyRewardDate: todayKey,
      dailyLoginStreak: reward.dayStreak,
    };
  }

  return {
    ...profile,
    boosters: {
      ...profile.boosters,
      [reward.boosterKey]: profile.boosters[reward.boosterKey] + reward.amount,
    },
    lastDailyRewardDate: todayKey,
    dailyLoginStreak: reward.dayStreak,
  };
}
