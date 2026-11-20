import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelSpec } from './levelGenerator';
import { computeTargetTimeSec, evaluateSpeedBonus, formatCountdown } from './speedBonus';

test('computeTargetTimeSec scales fairly from easy Level 1 to Super Hard Level 10', () => {
  const lv1Target = computeTargetTimeSec(getLevelSpec(1));
  const lv2Target = computeTargetTimeSec(getLevelSpec(2));
  const lv5Target = computeTargetTimeSec(getLevelSpec(5));
  const lv10Target = computeTargetTimeSec(getLevelSpec(10));

  assert.ok(lv1Target >= 40 && lv1Target <= 60, `Lv1 target should be 40..60s, got ${lv1Target}`);
  assert.ok(lv2Target > lv1Target, 'Lv2 5-color spike gets more target time than Lv1');
  assert.ok(lv5Target > lv2Target, 'Lv5 Hard gets more target time than Lv2');
  assert.ok(lv10Target > lv5Target, 'Lv10 Super Hard gets the largest target window');
  assert.equal(lv1Target % 5, 0);
  assert.equal(lv10Target % 5, 0);
});

test('evaluateSpeedBonus grants bonus points and coins under target time and 0 after expiry', () => {
  const fast = evaluateSpeedBonus(12, 60, 'normal');
  assert.equal(fast.qualified, true);
  assert.equal(fast.remainingSec, 48);
  assert.ok(fast.bonusPoints >= 250);
  assert.ok(fast.bonusCoins >= 20);

  const buzzer = evaluateSpeedBonus(60, 60, 'normal');
  assert.equal(buzzer.qualified, true);
  assert.equal(buzzer.remainingSec, 0);
  assert.ok(buzzer.bonusPoints >= 100);
  assert.ok(buzzer.bonusCoins >= 10);

  const expired = evaluateSpeedBonus(61, 60, 'normal');
  assert.equal(expired.qualified, false);
  assert.equal(expired.bonusPoints, 0);
  assert.equal(expired.bonusCoins, 0);

  const hardFast = evaluateSpeedBonus(20, 100, 'super_hard');
  assert.ok(hardFast.bonusPoints > fast.bonusPoints, 'super_hard scales speed bonus higher');
});

test('formatCountdown formats M:SS cleanly and clamps negatives', () => {
  assert.equal(formatCountdown(95), '1:35');
  assert.equal(formatCountdown(5), '0:05');
  assert.equal(formatCountdown(0), '0:00');
  assert.equal(formatCountdown(-12), '0:00');
});
