import type { BoostersInventory, PlayerProfile } from './types';

export type DailyBoosterKey = keyof BoostersInventory;

export type DailyRewardGrant =
  | {
      kind: 'coins';
      cycleDay: number;
      amount: number;
      dayStreak: number;
    }
  | {
      kind: 'booster';
      cycleDay: number;
      boosterKey: DailyBoosterKey;
      amount: number;
      dayStreak: number;
    }
  | {
      kind: 'grand';
      cycleDay: 7;
      coins: number;
      boosters: Partial<Record<DailyBoosterKey, number>>;
      dayStreak: number;
    };

export type DailyCalendarSlotStatus = 'claimed' | 'today' | 'upcoming';

export interface DailyCalendarSlot {
  cycleDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  kind: 'coins' | 'booster' | 'grand';
  coins?: number;
  boosterKey?: DailyBoosterKey;
  boosterAmount?: number;
  grandBoosters?: Partial<Record<DailyBoosterKey, number>>;
}

export interface DailyCalendarSlotView extends DailyCalendarSlot {
  status: DailyCalendarSlotStatus;
}

export const DAILY_CALENDAR_SCHEDULE: DailyCalendarSlot[] = [
  { cycleDay: 1, kind: 'coins', coins: 50 },
  { cycleDay: 2, kind: 'booster', boosterKey: 'undo', boosterAmount: 1 },
  { cycleDay: 3, kind: 'coins', coins: 80 },
  { cycleDay: 4, kind: 'booster', boosterKey: 'shuffle', boosterAmount: 1 },
  { cycleDay: 5, kind: 'coins', coins: 110 },
  { cycleDay: 6, kind: 'booster', boosterKey: 'extraFlask', boosterAmount: 1 },
  {
    cycleDay: 7,
    kind: 'grand',
    coins: 200,
    grandBoosters: { extraFlask: 1, undo: 1 },
  },
];

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
 * Maps an overall daily login streak (1..∞) into the 7-day visual calendar cycle (1..7).
 */
export function getCalendarDayIndex(dayStreak: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const safe = Math.max(1, Math.floor(dayStreak));
  return (((safe - 1) % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Resolves the structured DailyRewardGrant for the given streak day on the 7-day calendar.
 */
export function getDailyCalendarReward(dayStreak: number): DailyRewardGrant {
  const safeStreak = Math.max(1, Math.floor(dayStreak));
  const cycleDay = getCalendarDayIndex(safeStreak);
  const slot = DAILY_CALENDAR_SCHEDULE[cycleDay - 1];

  if (slot.kind === 'grand') {
    return {
      kind: 'grand',
      cycleDay: 7,
      coins: slot.coins ?? 200,
      boosters: { ...(slot.grandBoosters ?? { extraFlask: 1, undo: 1 }) },
      dayStreak: safeStreak,
    };
  }

  if (slot.kind === 'booster' && slot.boosterKey) {
    return {
      kind: 'booster',
      cycleDay,
      boosterKey: slot.boosterKey,
      amount: slot.boosterAmount ?? 1,
      dayStreak: safeStreak,
    };
  }

  return {
    kind: 'coins',
    cycleDay,
    amount: slot.coins ?? 50,
    dayStreak: safeStreak,
  };
}

/**
 * Builds the 7-day visual calendar state (claimed / today / upcoming) for the modal UI.
 */
export function getDailyCalendarStates(
  lastClaimedDate: string | null | undefined,
  currentStreak: number,
  nowMs: number = Date.now()
): {
  slots: DailyCalendarSlotView[];
  availableToday: boolean;
  activeCycleDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  displayStreak: number;
  daysUntilGrandPrize: number;
} {
  const availableToday = isDailyRewardAvailable(lastClaimedDate, nowMs);

  if (availableToday) {
    const nextStreak = computeNextDailyStreak(lastClaimedDate, currentStreak, nowMs);
    const activeCycleDay = getCalendarDayIndex(nextStreak);
    const slots: DailyCalendarSlotView[] = DAILY_CALENDAR_SCHEDULE.map((slot) => ({
      ...slot,
      status:
        slot.cycleDay < activeCycleDay
          ? 'claimed'
          : slot.cycleDay === activeCycleDay
          ? 'today'
          : 'upcoming',
    }));
    return {
      slots,
      availableToday: true,
      activeCycleDay,
      displayStreak: nextStreak,
      daysUntilGrandPrize: Math.max(0, 7 - activeCycleDay),
    };
  }

  const claimedStreak = Math.max(1, Math.floor(currentStreak));
  const claimedCycleDay = getCalendarDayIndex(claimedStreak);
  const slots: DailyCalendarSlotView[] = DAILY_CALENDAR_SCHEDULE.map((slot) => ({
    ...slot,
    status: slot.cycleDay <= claimedCycleDay ? 'claimed' : 'upcoming',
  }));
  return {
    slots,
    availableToday: false,
    activeCycleDay: claimedCycleDay,
    displayStreak: claimedStreak,
    daysUntilGrandPrize: Math.max(0, 7 - claimedCycleDay),
  };
}

/**
 * Alias kept for callers that fetch today's scheduled reward by streak day.
 */
export function rollDailyLoginReward(dayStreak: number): DailyRewardGrant {
  return getDailyCalendarReward(dayStreak);
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

  if (reward.kind === 'grand') {
    const nextBoosters: BoostersInventory = { ...profile.boosters };
    (Object.keys(reward.boosters) as DailyBoosterKey[]).forEach((k) => {
      const add = reward.boosters[k] ?? 0;
      nextBoosters[k] += add;
    });
    return {
      ...profile,
      coins: profile.coins + reward.coins,
      boosters: nextBoosters,
      lastDailyRewardDate: todayKey,
      dailyLoginStreak: reward.dayStreak,
    };
  }

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
