import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRemoveAdsPurchase,
  evaluateInterstitialPacing,
} from './adService';
import { DEFAULT_PROFILE } from './storage';

test('evaluateInterstitialPacing protects Levels 1-2 and triggers every 2 clears from Level 3+', () => {
  // New player protection on Level 1 & Level 2
  const l1 = evaluateInterstitialPacing({
    adsRemoved: false,
    clearedLevelNumber: 1,
    clearsSinceLastInterstitial: 0,
    isTrial: false,
  });
  assert.equal(l1.shouldShow, false);
  assert.equal(l1.nextCounter, 0);

  const l2 = evaluateInterstitialPacing({
    adsRemoved: false,
    clearedLevelNumber: 2,
    clearsSinceLastInterstitial: l1.nextCounter,
    isTrial: false,
  });
  assert.equal(l2.shouldShow, false);
  assert.equal(l2.nextCounter, 0);

  // Level 3 -> count 1 (no ad yet)
  const l3 = evaluateInterstitialPacing({
    adsRemoved: false,
    clearedLevelNumber: 3,
    clearsSinceLastInterstitial: l2.nextCounter,
    isTrial: false,
  });
  assert.equal(l3.shouldShow, false);
  assert.equal(l3.nextCounter, 1);

  // Level 4 -> count 2 -> triggers interstitial & resets counter to 0
  const l4 = evaluateInterstitialPacing({
    adsRemoved: false,
    clearedLevelNumber: 4,
    clearsSinceLastInterstitial: l3.nextCounter,
    isTrial: false,
  });
  assert.equal(l4.shouldShow, true);
  assert.equal(l4.nextCounter, 0);
});

test('applyRemoveAdsPurchase permanently disables interstitials without adding extra coins', () => {
  const before = { ...DEFAULT_PROFILE, coins: 250, adsRemoved: false };
  const after = applyRemoveAdsPurchase(before);

  assert.equal(after.adsRemoved, true);
  assert.equal(after.coins, 250);

  const check = evaluateInterstitialPacing({
    adsRemoved: after.adsRemoved,
    clearedLevelNumber: 10,
    clearsSinceLastInterstitial: 5,
    isTrial: false,
  });
  assert.equal(check.shouldShow, false);
  assert.equal(check.nextCounter, 0);
});
