import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  POUR_SOUND_FILE,
  getBgmMood,
  getPentatonicComboMultiplier,
  playAchievementUnlockSound,
  playAddBottleSound,
  playAlembicBrewSound,
  playBottleComplete,
  playCoinTick,
  playCorkPop,
  playDailyCheckInSound,
  playDefeatChime,
  playErrorTap,
  playMysteryReveal,
  playObstacleUnlockSound,
  playPickupClink,
  playPourSound,
  playSealRiseChime,
  playShopPurchaseSound,
  playShuffleSound,
  playUiClick,
  playUndoSound,
  playVictoryFanfare,
  resolveGameplayBgmMood,
  setBgmMood,
} from './sound';

test('finalized second-half ASMR bottle glug pour sound asset exists on disk', () => {
  assert.equal(POUR_SOUND_FILE, '/assets/sounds/asmr_bottle_glug.mp3');
  const diskPath = path.join(process.cwd(), 'public', POUR_SOUND_FILE.replace(/^\//, ''));
  assert.equal(fs.existsSync(diskPath), true, `Missing sound asset: ${diskPath}`);
  assert.ok(fs.statSync(diskPath).size > 10000, `Sound asset too small: ${diskPath}`);
});

test('pentatonic combo multiplier ascends monotonically and clamps safely', () => {
  const m0 = getPentatonicComboMultiplier(0);
  const m1 = getPentatonicComboMultiplier(1);
  const m2 = getPentatonicComboMultiplier(2);
  const m5 = getPentatonicComboMultiplier(5);
  const mHigh = getPentatonicComboMultiplier(99);
  const mNeg = getPentatonicComboMultiplier(-5);

  assert.equal(m0, 1);
  assert.equal(mNeg, 1);
  assert.ok(m0 < m1 && m1 < m2 && m2 < m5);
  assert.ok(mHigh >= m5);
});

test('4-state adaptive BGM mood resolver maps Home, Flow, Challenge, and Climax accurately', () => {
  assert.equal(resolveGameplayBgmMood({ inGameplay: false, streak: 10 }), 'home');
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'normal', streak: 0, remainingBottles: 5 }),
    'flow'
  );
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'hard', streak: 1, remainingBottles: 5 }),
    'challenge'
  );
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'super_hard', streak: 0, remainingBottles: 5 }),
    'challenge'
  );
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'normal', isTrial: true, streak: 0, remainingBottles: 5 }),
    'challenge'
  );
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'normal', streak: 3, remainingBottles: 5 }),
    'climax'
  );
  assert.equal(
    resolveGameplayBgmMood({ inGameplay: true, difficulty: 'normal', streak: 0, remainingBottles: 2 }),
    'climax'
  );
});

test('all audio engine triggers and mood setter execute safely in headless Node environment', () => {
  setBgmMood('challenge');
  assert.equal(getBgmMood(), 'challenge');
  setBgmMood('home');
  assert.equal(getBgmMood(), 'home');

  assert.doesNotThrow(() => {
    playUiClick(true, 'primary');
    playUiClick(true, 'tab');
    playUiClick(true, 'close');
    playPickupClink(true, -0.2);
    playErrorTap(true);
    playPourSound(true, 3, 0.75);
    playCorkPop(true);
    playMysteryReveal(true);
    playObstacleUnlockSound(true, 'cork');
    playObstacleUnlockSound(true, 'crate');
    playObstacleUnlockSound(true, 'curtain');
    playSealRiseChime(true, 2);
    playBottleComplete(true, 3);
    playUndoSound(true);
    playShuffleSound(true);
    playAddBottleSound(true);
    playAlembicBrewSound(true);
    playAchievementUnlockSound(true, true);
    playDailyCheckInSound(true, true);
    playShopPurchaseSound(true);
    playCoinTick(true, 4);
    playVictoryFanfare(true, 1);
    playVictoryFanfare(true, 2);
    playVictoryFanfare(true, 3);
    playDefeatChime(true, 1);
    playDefeatChime(true, 2);
    playDefeatChime(true, 3);
  });
});
