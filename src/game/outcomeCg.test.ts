import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  OUTCOME_CG_CATALOG,
  resolveDefeatCgTier,
  resolveVictoryCgTier,
} from './outcomeCg';

test('resolveVictoryCgTier escalates cleanly across Tiers 1 -> 2 -> 3', () => {
  assert.equal(resolveVictoryCgTier({ streakAfterWin: 0, isTrial: false }), 1);
  assert.equal(resolveVictoryCgTier({ streakAfterWin: 1, isTrial: false }), 1);
  assert.equal(resolveVictoryCgTier({ streakAfterWin: 2, isTrial: false }), 2);
  assert.equal(resolveVictoryCgTier({ streakAfterWin: 3, isTrial: false }), 3);
  assert.equal(resolveVictoryCgTier({ streakAfterWin: 1, isTrial: true }), 3);
});

test('resolveDefeatCgTier escalates sequentially by total defeat count 1 -> 2 -> 3', () => {
  assert.equal(resolveDefeatCgTier({ totalDefeatCount: 1 }), 1);
  assert.equal(resolveDefeatCgTier({ totalDefeatCount: 2 }), 2);
  assert.equal(resolveDefeatCgTier({ totalDefeatCount: 3 }), 3);
  assert.equal(resolveDefeatCgTier({ totalDefeatCount: 7 }), 3);
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
