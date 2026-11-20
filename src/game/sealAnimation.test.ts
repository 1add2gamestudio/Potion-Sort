import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSealTimeline, SEAL_DURATION_MS } from './sealAnimation';

test('evaluateSealTimeline progresses through all 4 Plan B ceremony beats cleanly', () => {
  assert.ok(SEAL_DURATION_MS >= 700 && SEAL_DURATION_MS <= 1050);

  // Beat 1: Alchemy circle lights up, cork not yet visible
  const b1 = evaluateSealTimeline(0.08);
  assert.ok(b1.circleOpacity > 0.5);
  assert.ok(b1.swirlOpacity > 0.2);
  assert.equal(b1.corkVisible, false);

  // Beat 2: Bottle levitates & twin ribbons split cleanly into both front and back occlusion layers
  const b2 = evaluateSealTimeline(0.36);
  assert.ok(b2.levitateY < -4, 'bottle should levitate upward during Beat 2');
  assert.ok(b2.backRibbons.length > 0, 'helix must produce occluded back ribbon segments');
  assert.ok(b2.frontRibbons.length > 0, 'helix must produce foreground ribbon segments');
  assert.ok(b2.innerBubbles.length > 0, 'rising inner liquid bubbles should be active');

  // Beat 3: Spinning cork descends inside luminous magic halo
  const b3 = evaluateSealTimeline(0.64);
  assert.equal(b3.corkVisible, true);
  assert.ok(b3.corkYOffset < 0, 'cork should still be descending from above');
  assert.ok(b3.haloOpacity > 0.4, 'magic cork halo should be glowing');

  // Beat 4: Cork seated, bottle settled, diagonal crystal sheen sweeps across glass
  const b4 = evaluateSealTimeline(0.84);
  assert.equal(b4.corkVisible, true);
  assert.equal(b4.corkYOffset, 0);
  assert.ok(b4.sheenOpacity > 0.4, 'crystal sheen sweep should be visible in Beat 4');
  assert.ok(b4.crownOpacity > 0.3, 'fading stardust crown should shimmer in Beat 4');

  // End state returns cleanly to grounded bottle with cork seated
  const end = evaluateSealTimeline(1);
  assert.equal(end.corkVisible, true);
  assert.equal(end.corkYOffset, 0);
  assert.equal(end.levitateY, 0);
  assert.equal(end.frontRibbons.length, 0);
  assert.equal(end.backRibbons.length, 0);
});
