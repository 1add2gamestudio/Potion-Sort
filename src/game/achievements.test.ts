import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CG_ACHIEVEMENTS,
  claimCgAchievementReward,
  getUnclaimedCgRewardCount,
  toOutcomeCgId,
  unlockOutcomeCg,
} from './achievements';
import {
  DEFAULT_PROFILE,
  getClaimableMilestoneCount,
  getCraftableRecipeCount,
} from './storage';

test('unlockOutcomeCg unlocks a CG once and tracks unclaimed rewards accurately', () => {
  const base = { ...DEFAULT_PROFILE, unlockedCgs: [], claimedCgRewards: [] };
  const first = unlockOutcomeCg(base, 'victory', 2);

  assert.equal(first.newlyUnlocked, true);
  assert.equal(first.cgId, 'victory_2');
  assert.deepEqual(first.profile.unlockedCgs, ['victory_2']);
  assert.equal(getUnclaimedCgRewardCount(first.profile), 1);

  const duplicate = unlockOutcomeCg(first.profile, 'victory', 2);
  assert.equal(duplicate.newlyUnlocked, false);
  assert.deepEqual(duplicate.profile.unlockedCgs, ['victory_2']);
});

test('claimCgAchievementReward rejects locked CGs and grants coins once when unlocked', () => {
  const lockedBase = { ...DEFAULT_PROFILE, coins: 100, unlockedCgs: [], claimedCgRewards: [] };
  const rejected = claimCgAchievementReward(lockedBase, 'victory_3');
  assert.equal(rejected.claimed, false);
  assert.equal(rejected.profile.coins, 100);

  const unlocked = unlockOutcomeCg(lockedBase, 'victory', 3).profile;
  const claimed = claimCgAchievementReward(unlocked, 'victory_3');
  assert.equal(claimed.claimed, true);
  assert.equal(claimed.coinsGranted, 20);
  assert.equal(claimed.profile.coins, 120);
  assert.equal(getUnclaimedCgRewardCount(claimed.profile), 0);

  const secondClaim = claimCgAchievementReward(claimed.profile, 'victory_3');
  assert.equal(secondClaim.claimed, false);
  assert.equal(secondClaim.profile.coins, 120);
});

test('CG_ACHIEVEMENTS covers all 6 victory and defeat tiers uniquely', () => {
  assert.equal(CG_ACHIEVEMENTS.length, 6);
  const ids = new Set(CG_ACHIEVEMENTS.map((a) => a.id));
  assert.equal(ids.size, 6);
  assert.equal(toOutcomeCgId('defeat', 1), 'defeat_1');
});

test('getCraftableRecipeCount and getClaimableMilestoneCount reflect real player eligibility', () => {
  const empty = {
    ...DEFAULT_PROFILE,
    ingredients: { citrus: 0, crystal: 0, dew: 0, mist: 0 },
    eventStars: 5,
    claimedEventMilestones: [],
  };
  assert.equal(getCraftableRecipeCount(empty), 0);
  assert.equal(getClaimableMilestoneCount(empty), 0);

  const ready = {
    ...empty,
    ingredients: { citrus: 2, crystal: 1, dew: 0, mist: 0 },
    eventStars: 30,
    claimedEventMilestones: [10],
  };
  assert.equal(getCraftableRecipeCount(ready), 1);
  assert.equal(getClaimableMilestoneCount(ready), 1); // 25★ ready, 10★ already claimed
});
