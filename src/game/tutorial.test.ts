import assert from 'node:assert/strict';
import test from 'node:test';
import { executePour, isLevelComplete } from './engine';
import { getLevelSpec, getTrialLevelSpec } from './levelGenerator';
import { computeOnboardingGuide, detectUnseenMechanicTip } from './tutorial';

test('Level 1 onboarding guides player step-by-step all the way to Level 1 completion', () => {
  let bottles = getLevelSpec(1).bottles;
  let steps = 0;

  while (!isLevelComplete(bottles) && steps < 20) {
    const pickSource = computeOnboardingGuide({
      levelNumber: 1,
      isTrialMode: false,
      bottles,
      selectedId: null,
      seenTutorials: [],
    });
    assert.ok(pickSource, `Expected source guide on step ${steps + 1}`);
    assert.equal(pickSource.step, 'pick_source');

    const pickTarget = computeOnboardingGuide({
      levelNumber: 1,
      isTrialMode: false,
      bottles,
      selectedId: pickSource.bottleId,
      seenTutorials: [],
    });
    assert.ok(pickTarget, `Expected target guide on step ${steps + 1}`);
    assert.equal(pickTarget.step, 'pick_target');
    assert.notEqual(pickTarget.bottleId, pickSource.bottleId);

    const outcome = executePour(bottles, pickSource.bottleId, pickTarget.bottleId);
    assert.ok(outcome, `Guided move ${pickSource.bottleId} -> ${pickTarget.bottleId} must be legal`);
    bottles = outcome.bottles;
    steps += 1;
  }

  assert.equal(isLevelComplete(bottles), true, 'Following Level 1 guide must complete Level 1');
  assert.ok(steps >= 2 && steps <= 10, `Expected concise guided completion, got ${steps} steps`);

  // Once Level 1 is complete, the guide turns off immediately
  const afterComplete = computeOnboardingGuide({
    levelNumber: 1,
    isTrialMode: false,
    bottles,
    selectedId: null,
    seenTutorials: [],
  });
  assert.equal(afterComplete, null);

  // Once basics is marked seen, replays of Level 1 do not show the guide again
  const replay = computeOnboardingGuide({
    levelNumber: 1,
    isTrialMode: false,
    bottles: getLevelSpec(1).bottles,
    selectedId: null,
    seenTutorials: ['basics'],
  });
  assert.equal(replay, null);
});

test('detectUnseenMechanicTip surfaces mystery, cork, crate, and curtain once per mechanic', () => {
  const mysteryTrial = getTrialLevelSpec('trial-mystery');
  assert.equal(detectUnseenMechanicTip(mysteryTrial.bottles, []), 'mystery');
  assert.equal(detectUnseenMechanicTip(mysteryTrial.bottles, ['mystery']), null);

  const corkTrial = getTrialLevelSpec('trial-cork');
  assert.equal(detectUnseenMechanicTip(corkTrial.bottles, []), 'cork');
  assert.equal(detectUnseenMechanicTip(corkTrial.bottles, ['cork', 'mystery']), null);

  const crateTrial = getTrialLevelSpec('trial-crate');
  assert.equal(detectUnseenMechanicTip(crateTrial.bottles, []), 'crate');
  assert.equal(detectUnseenMechanicTip(crateTrial.bottles, ['crate', 'cork', 'mystery']), null);

  const curtainTrial = getTrialLevelSpec('trial-curtain');
  assert.equal(detectUnseenMechanicTip(curtainTrial.bottles, []), 'curtain');
  assert.equal(
    detectUnseenMechanicTip(curtainTrial.bottles, ['cork', 'crate', 'curtain', 'mystery']),
    null
  );
});
