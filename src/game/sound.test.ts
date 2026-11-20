import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { POUR_SOUND_FILE } from './sound';

test('finalized second-half ASMR bottle glug pour sound asset exists on disk', () => {
  assert.equal(POUR_SOUND_FILE, '/assets/sounds/asmr_bottle_glug.mp3');
  const diskPath = path.join(process.cwd(), 'public', POUR_SOUND_FILE.replace(/^\//, ''));
  assert.equal(fs.existsSync(diskPath), true, `Missing sound asset: ${diskPath}`);
  assert.ok(fs.statSync(diskPath).size > 10000, `Sound asset too small: ${diskPath}`);
});
