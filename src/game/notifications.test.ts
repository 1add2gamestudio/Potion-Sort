import assert from 'node:assert/strict';
import test from 'node:test';
import { claimAllCgAchievementRewards, unlockOutcomeCg } from './achievements';
import {
  getAchievementsBadgeCount,
  getAlembicBadgeCount,
  getEventsBadgeCount,
  markAchievementsSeen,
  markAlembicSeen,
  markDailyRewardSeen,
  markEventsSeen,
  shouldShowDailyRewardDot,
  syncAlembicSeenAfterBrew,
} from './notifications';
import { DEFAULT_PROFILE } from './storage';

test('Achievements badge clears on enter/exit even without claiming and reappears on new CG unlock', () => {
  const base = {
    ...DEFAULT_PROFILE,
    unlockedCgs: [],
    claimedCgRewards: [],
    seenNotifications: { cgIds: [], eventMilestones: [], alembicRecipes: [], dailyRewardDate: null },
  };
  assert.equal(getAchievementsBadgeCount(base), 0);

  const unlocked1 = unlockOutcomeCg(base, 'victory', 1).profile;
  assert.equal(getAchievementsBadgeCount(unlocked1), 1);

  // Entering Achievements marks current unlocked CGs as seen -> exiting leaves 0 badge
  const visited = markAchievementsSeen(unlocked1);
  assert.equal(getAchievementsBadgeCount(visited), 0);

  // Unlocking another CG brings the badge back to 1
  const unlocked2 = unlockOutcomeCg(visited, 'defeat', 1).profile;
  assert.equal(getAchievementsBadgeCount(unlocked2), 1);

  // Batch claiming grants token coins for both unclaimed CGs (20 + 20 = 40)
  const claimedAll = claimAllCgAchievementRewards(unlocked2);
  assert.equal(claimedAll.claimedCount, 2);
  assert.equal(claimedAll.coinsGranted, 40);
  assert.equal(getAchievementsBadgeCount(claimedAll.profile), 0);
});

test('Events milestone badge clears on visit and reappears when reaching next star threshold', () => {
  const base = {
    ...DEFAULT_PROFILE,
    eventStars: 12,
    claimedEventMilestones: [],
    seenNotifications: { cgIds: [], eventMilestones: [], alembicRecipes: [], dailyRewardDate: null },
  };
  assert.equal(getEventsBadgeCount(base), 1); // 10★ reached

  const visited = markEventsSeen(base);
  assert.equal(getEventsBadgeCount(visited), 0); // Cleared after visiting without claiming

  const higher = { ...visited, eventStars: 26 };
  assert.equal(getEventsBadgeCount(higher), 1); // 25★ newly reached
});

test('Alembic badge clears on visit, stays 0 if not brewed, and reappears on new recipe or re-earned ingredients', () => {
  const base = {
    ...DEFAULT_PROFILE,
    ingredients: { citrus: 2, crystal: 1, dew: 0, mist: 0 }, // undo_tonic craftable
    seenNotifications: { cgIds: [], eventMilestones: [], alembicRecipes: [], dailyRewardDate: null },
  };
  assert.equal(getAlembicBadgeCount(base), 1);

  // Enter & exit Alembic without brewing -> badge clears to 0
  const visited = markAlembicSeen(base);
  assert.equal(getAlembicBadgeCount(visited), 0);

  // Earn ingredients for shuffle_draught (citrus:1, dew:2, mist:1) -> new badge = 1
  const moreEssences = {
    ...visited,
    ingredients: { citrus: 2, crystal: 1, dew: 2, mist: 1 },
  };
  assert.equal(getAlembicBadgeCount(moreEssences), 1);

  // After brewing undo_tonic (drops citrus/crystal below cost), sync prunes undo_tonic from seen
  const brewed = syncAlembicSeenAfterBrew({
    ...visited,
    ingredients: { citrus: 0, crystal: 0, dew: 0, mist: 0 },
  });
  assert.equal(getAlembicBadgeCount(brewed), 0);

  // Later earning undo_tonic ingredients again re-triggers badge = 1
  const reEarned = {
    ...brewed,
    ingredients: { citrus: 2, crystal: 1, dew: 0, mist: 0 },
  };
  assert.equal(getAlembicBadgeCount(reEarned), 1);
});

test('Daily reward red dot clears once calendar is opened today and reappears next day', () => {
  const day1 = new Date(2026, 10, 20, 10, 0, 0).getTime();
  const day2 = new Date(2026, 10, 21, 9, 0, 0).getTime();
  const base = {
    ...DEFAULT_PROFILE,
    lastDailyRewardDate: null,
    seenNotifications: { cgIds: [], eventMilestones: [], alembicRecipes: [], dailyRewardDate: null },
  };

  assert.equal(shouldShowDailyRewardDot(base, day1), true);

  // Opening and dismissing the calendar today clears the nagging red dot
  const seenToday = markDailyRewardSeen(base, day1);
  assert.equal(shouldShowDailyRewardDot(seenToday, day1), false);

  // Next local calendar day brings the red dot back
  assert.equal(shouldShowDailyRewardDot(seenToday, day2), true);
});
