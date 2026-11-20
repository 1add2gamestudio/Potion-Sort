import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  OUTCOME_CG_CATALOG,
  resolveDefeatCgTier,
  resolveVictoryCgTier,
} from './outcomeCg';

test('resolveVictoryCgTier escalates progressively across Tiers 1 -> 2 -> 3', () => {
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 1, difficulty: 'normal', isTrial: false }),
    1
  );
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 2, difficulty: 'normal', isTrial: false }),
    2
  );
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 1, difficulty: 'hard', isTrial: false }),
    2
  );
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 4, difficulty: 'normal', isTrial: false }),
    3
  );
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 1, difficulty: 'super_hard', isTrial: false }),
    3
  );
  assert.equal(
    resolveVictoryCgTier({ streakAfterWin: 1, difficulty: 'normal', isTrial: true }),
    3
  );
});

test('resolveDefeatCgTier escalates progressively across Tiers 1 -> 2 -> 3', () => {
  assert.equal(
    resolveDefeatCgTier({
      failCountOnLevel: 1,
      completedBottles: 3,
      totalBottles: 4,
      hadStreak: 0,
    }),
    1
  );
  assert.equal(
    resolveDefeatCgTier({
      failCountOnLevel: 1,
      completedBottles: 1,
      totalBottles: 4,
      hadStreak: 0,
    }),
    2
  );
  assert.equal(
    resolveDefeatCgTier({
      failCountOnLevel: 2,
      completedBottles: 3,
      totalBottles: 4,
      hadStreak: 0,
    }),
    2
  );
  assert.equal(
    resolveDefeatCgTier({
      failCountOnLevel: 3,
      completedBottles: 3,
      totalBottles: 4,
      hadStreak: 0,
    }),
    3
  );
  assert.equal(
    resolveDefeatCgTier({
      failCountOnLevel: 1,
      completedBottles: 3,
      totalBottles: 4,
      hadStreak: 3,
    }),
    3
  );
});

test('all 6 static progressive Victory & Defeat CG assets exist on disk', () => {
  const allEntries = [
    ...Object.values(OUTCOME_CG_CATALOG.victory),
    ...Object.values(OUTCOME_CG_CATALOG.defeat),
  ];
  assert.equal(allEntries.length, 6);
  for (const entry of allEntries) {
    const abs = path.resolve(process.cwd(), 'public', entry.imageSrc.replace(/^\//, ''));
    assert.ok(fs.existsSync(abs), `Missing CG asset: ${abs}`);
    assert.ok(fs.statSync(abs).size > 20_000, `CG asset looks unexpectedly small: ${abs}`);
  }
});
