import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addExtraFlaskBooster,
  applyShuffleBooster,
  canPour,
  executePour,
  isLevelComplete,
} from './engine';
import { EVENT_TRIALS, getLevelSpec, getTrialLevelSpec } from './levelGenerator';
import { solveLevel } from './solver';
import type { Bottle } from './types';

test('Level 1 solves cleanly in deterministic steps', () => {
  const level1 = getLevelSpec(1);
  const solution = solveLevel(level1.bottles);
  assert.ok(solution && solution.length > 0, 'Level 1 must have a valid solution');

  let state = level1.bottles;
  for (const step of solution) {
    const res = executePour(state, step.sourceId, step.targetId);
    assert.ok(res, `Step ${step.sourceId} -> ${step.targetId} must be valid`);
    state = res.bottles;
  }
  assert.equal(isLevelComplete(state), true);
});

test('Levels 1 through 30 are deterministic and 100% solvable without boosters', () => {
  for (let lvl = 1; lvl <= 30; lvl++) {
    const first = getLevelSpec(lvl);
    const second = getLevelSpec(lvl);
    assert.deepEqual(first.bottles, second.bottles, `Level ${lvl} must be deterministic`);
    const sol = solveLevel(first.bottles, 15000);
    assert.ok(sol !== null, `Level ${lvl} (${first.difficulty}) must be solvable without boosters`);
  }
});

test('Plan B Golden Wave sawtooth difficulty curve spikes at L2, dips at L3, and introduces obstacles on schedule', () => {
  const lv1 = getLevelSpec(1);
  const lv2 = getLevelSpec(2);
  const lv3 = getLevelSpec(3);
  const lv4 = getLevelSpec(4);
  const lv5 = getLevelSpec(5);
  const lv6 = getLevelSpec(6);
  const lv10 = getLevelSpec(10);
  const lv14 = getLevelSpec(14);

  // Sawtooth color progression: L1(2) -> L2(5 spike!) -> L3(4 relief) -> L4(5 ramp) -> L5(6 hard) -> L6(4 cork relief)
  assert.equal(lv1.colorCount, 2);
  assert.equal(lv2.colorCount, 5);
  assert.equal(lv3.colorCount, 4);
  assert.equal(lv4.colorCount, 5);
  assert.equal(lv5.colorCount, 6);
  assert.equal(lv5.difficulty, 'hard');
  assert.equal(lv6.colorCount, 4);
  assert.equal(lv10.colorCount, 7);
  assert.equal(lv10.difficulty, 'super_hard');

  // Verify L2 has genuine puzzle depth after L1 tutorial
  const lv2Sol = solveLevel(lv2.bottles, 15000);
  assert.ok(lv2Sol && lv2Sol.length >= 14, `Level 2 should be a real spike (>=14 moves), got ${lv2Sol?.length}`);

  // Rich mystery '?' black-layer density across every level for blind-box excitement
  const countHidden = (spec: ReturnType<typeof getLevelSpec>) =>
    spec.bottles.reduce((sum, b) => sum + b.layers.filter((l) => l.hidden).length, 0);
  assert.ok(countHidden(lv1) >= 1, 'Lv 1 introduces a surprise mystery layer');
  assert.ok(countHidden(lv2) >= 8, `Lv 2 should have abundant mystery layers (>=8), got ${countHidden(lv2)}`);
  assert.ok(countHidden(lv3) >= 6, `Lv 3 should keep rich mystery layers (>=6), got ${countHidden(lv3)}`);
  assert.ok(countHidden(lv5) >= 12, `Lv 5 Hard should have deep mystery layers (>=12), got ${countHidden(lv5)}`);
  assert.ok(countHidden(lv10) >= 15, `Lv 10 Super Hard should have deep mystery layers (>=15), got ${countHidden(lv10)}`);

  // Milestone obstacles introduced cleanly on Plan B cadence
  assert.ok(lv4.bottles.some((b) => b.layers.some((l) => l.hidden)), 'Lv 4 has deep ? layers');
  assert.ok(lv6.bottles.some((b) => b.obstacle.type === 'cork'), 'Lv 6 introduces cork');
  assert.ok(lv10.bottles.some((b) => b.obstacle.type === 'crate'), 'Lv 10 introduces crate');
  assert.ok(lv14.bottles.some((b) => b.obstacle.type === 'curtain'), 'Lv 14 introduces curtain');

  for (const trial of EVENT_TRIALS) {
    const spec = getTrialLevelSpec(trial.id);
    assert.ok(solveLevel(spec.bottles, 15000) !== null, `Trial ${trial.id} must be solvable`);
  }
});

test('Cork, Crate, and Curtain rules enforce strict pouring constraints', () => {
  const board: Bottle[] = [
    {
      id: 'src',
      layers: [
        { color: 'coral', hidden: false },
        { color: 'coral', hidden: false },
        { color: 'coral', hidden: false },
      ],
      obstacle: { type: 'none' },
    },
    {
      id: 'corked',
      layers: [{ color: 'coral', hidden: false }],
      obstacle: { type: 'cork', requiredColor: 'coral' },
    },
    {
      id: 'crate',
      layers: [
        { color: 'azure', hidden: false },
        { color: 'azure', hidden: false },
      ],
      obstacle: { type: 'crate', lockColor: 'coral' },
    },
    {
      id: 'curtain',
      layers: [{ color: 'azure', hidden: false }],
      obstacle: { type: 'curtain', unlockColor: 'coral' },
    },
  ];

  // Cannot pour out of corked, crate, or curtain
  assert.equal(canPour(board[1], board[0]), false);
  assert.equal(canPour(board[2], board[0]), false);
  assert.equal(canPour(board[3], board[0]), false);

  // Pouring coral into corked coral completes corked bottle (4x coral) -> unlocks cork, crate, AND curtain!
  const outcome = executePour(board, 'src', 'corked');
  assert.ok(outcome);
  assert.equal(outcome.unlockedCork, true);
  assert.equal(outcome.completedTarget, true);
  assert.equal(outcome.unlockedObstacles.length, 2);
  assert.equal(outcome.bottles[2].obstacle.type, 'none');
  assert.equal(outcome.bottles[3].obstacle.type, 'none');
});

test('Shuffle and +1 Extra Flask boosters preserve total layer counts and add capacity', () => {
  const lv5 = getLevelSpec(5);
  const shuffled = applyShuffleBooster(lv5.bottles, 4242);
  const countColors = (bs: Bottle[]) =>
    bs.reduce((sum, b) => sum + b.layers.length, 0);
  assert.equal(countColors(shuffled), countColors(lv5.bottles));

  const extended = addExtraFlaskBooster(lv5.bottles);
  assert.equal(extended.length, lv5.bottles.length + 1);
  assert.equal(extended[extended.length - 1].layers.length, 0);

  // Default cap stops at 2 extra flasks; Defeat Continue can grant an emergency 3rd flask
  const twoExtra = addExtraFlaskBooster(extended);
  assert.equal(twoExtra.length, lv5.bottles.length + 2);
  const blockedThird = addExtraFlaskBooster(twoExtra);
  assert.equal(blockedThird.length, lv5.bottles.length + 2);
  const emergencyThird = addExtraFlaskBooster(twoExtra, 3);
  assert.equal(emergencyThird.length, lv5.bottles.length + 3);
  const blockedFourth = addExtraFlaskBooster(emergencyThird, 3);
  assert.equal(blockedFourth.length, lv5.bottles.length + 3);
});
