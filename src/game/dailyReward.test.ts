import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_CALENDAR_SCHEDULE,
  applyDailyLoginReward,
  computeNextDailyStreak,
  getCalendarDayIndex,
  getDailyCalendarReward,
  getDailyCalendarStates,
  getLocalDateKey,
  isDailyRewardAvailable,
} from './dailyReward';
import { DEFAULT_PROFILE } from './storage';

test('isDailyRewardAvailable unlocks once per local calendar day', () => {
  const day1 = new Date(2026, 4, 10, 9, 30, 0).getTime();
  const day1Later = new Date(2026, 4, 10, 22, 45, 0).getTime();
  const day2 = new Date(2026, 4, 11, 0, 5, 0).getTime();

  const day1Key = getLocalDateKey(day1);
  assert.equal(isDailyRewardAvailable(null, day1), true);
  assert.equal(isDailyRewardAvailable(day1Key, day1Later), false);
  assert.equal(isDailyRewardAvailable(day1Key, day2), true);
});

test('computeNextDailyStreak increments on consecutive days and resets after a gap', () => {
  const day1 = new Date(2026, 4, 10, 12, 0, 0).getTime();
  const day2 = new Date(2026, 4, 11, 12, 0, 0).getTime();
  const day4 = new Date(2026, 4, 13, 12, 0, 0).getTime();

  assert.equal(computeNextDailyStreak(null, 0, day1), 1);
  assert.equal(computeNextDailyStreak(getLocalDateKey(day1), 1, day2), 2);
  assert.equal(computeNextDailyStreak(getLocalDateKey(day1), 5, day4), 1);
});

test('7-day calendar schedule marks off claimed days, highlights today, and wraps cleanly after Day 7', () => {
  assert.equal(DAILY_CALENDAR_SCHEDULE.length, 7);
  assert.equal(getCalendarDayIndex(1), 1);
  assert.equal(getCalendarDayIndex(7), 7);
  assert.equal(getCalendarDayIndex(8), 1);

  const day3 = new Date(2026, 4, 12, 10, 0, 0).getTime();
  const day4 = new Date(2026, 4, 13, 10, 0, 0).getTime();
  const day3Key = getLocalDateKey(day3);

  // On Day 4 before claiming: Days 1-3 claimed, Day 4 today, Days 5-7 upcoming
  const beforeClaim = getDailyCalendarStates(day3Key, 3, day4);
  assert.equal(beforeClaim.availableToday, true);
  assert.equal(beforeClaim.activeCycleDay, 4);
  assert.equal(beforeClaim.daysUntilGrandPrize, 3);
  assert.deepEqual(
    beforeClaim.slots.map((s) => s.status),
    ['claimed', 'claimed', 'claimed', 'today', 'upcoming', 'upcoming', 'upcoming']
  );

  // On Day 4 after claiming: Days 1-4 claimed, Days 5-7 upcoming
  const day4Key = getLocalDateKey(day4);
  const afterClaim = getDailyCalendarStates(day4Key, 4, day4);
  assert.equal(afterClaim.availableToday, false);
  assert.equal(afterClaim.activeCycleDay, 4);
  assert.deepEqual(
    afterClaim.slots.map((s) => s.status),
    ['claimed', 'claimed', 'claimed', 'claimed', 'upcoming', 'upcoming', 'upcoming']
  );
});

test('applyDailyLoginReward grants Day 1 coins, Day 2 booster, and Day 7 grand jackpot bundle', () => {
  const now = new Date(2026, 4, 12, 10, 0, 0).getTime();

  const d1 = getDailyCalendarReward(1);
  assert.equal(d1.kind, 'coins');
  const afterD1 = applyDailyLoginReward(DEFAULT_PROFILE, d1, now);
  assert.equal(afterD1.coins, DEFAULT_PROFILE.coins + 50);
  assert.equal(afterD1.dailyLoginStreak, 1);

  const d2 = getDailyCalendarReward(2);
  assert.equal(d2.kind, 'booster');
  const afterD2 = applyDailyLoginReward(DEFAULT_PROFILE, d2, now);
  assert.equal(afterD2.boosters.undo, DEFAULT_PROFILE.boosters.undo + 1);

  const d7 = getDailyCalendarReward(7);
  assert.equal(d7.kind, 'grand');
  const afterD7 = applyDailyLoginReward(DEFAULT_PROFILE, d7, now);
  assert.equal(afterD7.coins, DEFAULT_PROFILE.coins + 200);
  assert.equal(afterD7.boosters.extraFlask, DEFAULT_PROFILE.boosters.extraFlask + 1);
  assert.equal(afterD7.boosters.undo, DEFAULT_PROFILE.boosters.undo + 1);
  assert.equal(afterD7.dailyLoginStreak, 7);
});
