import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDailyLoginReward,
  computeNextDailyStreak,
  getLocalDateKey,
  isDailyRewardAvailable,
  rollDailyLoginReward,
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

test('rollDailyLoginReward grants coins or a random booster and applyDailyLoginReward updates profile', () => {
  const now = new Date(2026, 4, 12, 10, 0, 0).getTime();

  // Coin branch (roll < 0.55)
  const coinReward = rollDailyLoginReward(3, () => 0.2);
  assert.equal(coinReward.kind, 'coins');
  assert.equal(coinReward.amount, 70);
  const afterCoins = applyDailyLoginReward(DEFAULT_PROFILE, coinReward, now);
  assert.equal(afterCoins.coins, DEFAULT_PROFILE.coins + 70);
  assert.equal(afterCoins.lastDailyRewardDate, getLocalDateKey(now));
  assert.equal(afterCoins.dailyLoginStreak, 3);

  // Random booster branch (roll >= 0.55)
  const seq = [0.8, 0.4]; // booster branch -> index 1 ('shuffle')
  let idx = 0;
  const boosterReward = rollDailyLoginReward(1, () => seq[idx++]);
  assert.equal(boosterReward.kind, 'booster');
  assert.equal(boosterReward.boosterKey, 'shuffle');
  assert.equal(boosterReward.amount, 1);

  const afterBooster = applyDailyLoginReward(DEFAULT_PROFILE, boosterReward, now);
  assert.equal(afterBooster.boosters.shuffle, DEFAULT_PROFILE.boosters.shuffle + 1);
  assert.equal(afterBooster.lastDailyRewardDate, getLocalDateKey(now));
  assert.equal(afterBooster.dailyLoginStreak, 1);
});
