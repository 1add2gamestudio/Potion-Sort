import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { POUR_SOUND_OPTIONS, getPourSoundMeta } from './sound';
import { DEFAULT_PROFILE, loadProfile } from './storage';

test('all 5 soothing pour sound assets exist on disk and metadata resolves cleanly', () => {
  assert.equal(POUR_SOUND_OPTIONS.length, 5);
  assert.equal(DEFAULT_PROFILE.pourSound, 'pour_glug_silk');

  for (const opt of POUR_SOUND_OPTIONS) {
    const diskPath = path.join(process.cwd(), 'public', opt.file.replace(/^\//, ''));
    assert.equal(fs.existsSync(diskPath), true, `Missing sound asset: ${diskPath}`);
    assert.ok(fs.statSync(diskPath).size > 4000, `Sound asset too small: ${diskPath}`);
    assert.equal(getPourSoundMeta(opt.id).id, opt.id);
  }
});

test('loadProfile falls back to pour_glug_silk cleanly when window is absent', () => {
  const profile = loadProfile();
  assert.equal(profile.pourSound, 'pour_glug_silk');
});
