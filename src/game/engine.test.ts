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

test('Obstacles introduce progressively at milestone levels and trials are solvable', () => {
  const lv6 = getLevelSpec(6);
  assert.ok(lv6.bottles.some((b) => b.layers.some((l) => l.hidden)), 'Lv 6 has ? layers');

  const lv12 = getLevelSpec(12);
  assert.ok(lv12.bottles.some((b) => b.obstacle.type === 'cork'), 'Lv 12 has cork');

  const lv18 = getLevelSpec(18);
  assert.ok(lv18.bottles.some((b) => b.obstacle.type === 'crate'), 'Lv 18 has crate');

  const lv24 = getLevelSpec(24);
  assert.ok(lv24.bottles.some((b) => b.obstacle.type === 'curtain'), 'Lv 24 has curtain');

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
});
