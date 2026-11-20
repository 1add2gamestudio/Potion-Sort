import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerticalStreamPath,
  computeMagicSortPourGeometry,
  computePourTransform,
  computeProgressiveTiltRange,
  evaluatePourTimeline,
  getPourDurationMs,
} from './pourAnimation';

test('computeProgressiveTiltRange deepens angle as remaining liquid decreases', () => {
  const fullTo3 = computeProgressiveTiltRange(4, 1);
  const fullToEmpty = computeProgressiveTiltRange(4, 4);
  const oneToEmpty = computeProgressiveTiltRange(1, 1);

  assert.equal(fullTo3.startMag, 48);
  assert.equal(oneToEmpty.startMag, 72);
  assert.ok(fullTo3.endMag - fullTo3.startMag >= 20, 'even a 1-layer pour deepens noticeably');
  assert.ok(fullToEmpty.endMag > fullTo3.endMag, 'emptying a bottle tips deeper than pouring 1 layer');
  assert.ok(oneToEmpty.endMag >= 94, 'draining final layer tips past horizontal');
});

test('computeMagicSortPourGeometry hovers left when pouring right and respects edge bounds', () => {
  const stage = { left: 0, top: 0, width: 390, height: 844 };
  const src = { left: 40, top: 280, width: 58, height: 132 };
  const dst = { left: 220, top: 460, width: 58, height: 132 };

  const geom = computeMagicSortPourGeometry(stage, src, dst, 1, 1, 3);
  assert.equal(geom.dir, 'right');
  assert.ok(geom.startTiltDeg > 45 && geom.startTiltDeg < geom.maxTiltDeg);
  assert.ok(geom.flyX > 0, 'source must fly right toward target');
  assert.ok(geom.flyY > 0, 'source must descend toward bottom-row target mouth');
  assert.ok(
    Math.abs(geom.streamX - (dst.left + dst.width / 2)) < 0.01,
    'vertical stream must align exactly with target bottle mouth center'
  );
  assert.ok(geom.targetEndSurfaceY < geom.targetStartSurfaceY, 'target liquid level must rise');

  // Pouring into far-left target should hover to the right (dir='left') so it never clips off-screen
  const farLeftDst = { left: 20, top: 460, width: 58, height: 132 };
  const edgeGeom = computeMagicSortPourGeometry(
    stage,
    { left: 5, top: 280, width: 58, height: 132 },
    farLeftDst,
    0,
    2,
    2
  );
  assert.equal(edgeGeom.dir, 'left');
  assert.ok(edgeGeom.startTiltDeg < 0 && edgeGeom.maxTiltDeg < edgeGeom.startTiltDeg);
});

test('evaluatePourTimeline progressively deepens tilt during pouring and locks mouth anchor', () => {
  const stage = { left: 0, top: 0, width: 390, height: 844 };
  const src = { left: 40, top: 280, width: 58, height: 132 };
  const dst = { left: 220, top: 460, width: 58, height: 132 };
  const geom = computeMagicSortPourGeometry(stage, src, dst, 0, 3, 4);

  const start = evaluatePourTimeline(0, geom.maxTiltDeg, geom.startTiltDeg);
  assert.equal(start.moveProgress, 0);
  assert.equal(start.tiltDeg, 0);
  assert.equal(start.streamTip, 0);

  const earlyPour = evaluatePourTimeline(0.26, geom.maxTiltDeg, geom.startTiltDeg);
  const midPour = evaluatePourTimeline(0.50, geom.maxTiltDeg, geom.startTiltDeg);
  const latePour = evaluatePourTimeline(0.74, geom.maxTiltDeg, geom.startTiltDeg);

  assert.equal(earlyPour.moveProgress, 1);
  assert.equal(midPour.moveProgress, 1);
  assert.equal(latePour.moveProgress, 1);
  assert.ok(
    earlyPour.tiltDeg < midPour.tiltDeg && midPour.tiltDeg < latePour.tiltDeg,
    `expected progressive tilt deepening: ${earlyPour.tiltDeg} < ${midPour.tiltDeg} < ${latePour.tiltDeg}`
  );
  assert.equal(midPour.streamTip, 1);
  assert.equal(midPour.streamCut, 0);
  assert.ok(midPour.drainRatio > 0 && midPour.drainRatio < 1);
  assert.ok(midPour.fillRatio > 0 && midPour.fillRatio < 1);

  // Verify mouth-locked pivot kinematics keep world-space bottle mouth pinned at pourAnchor across all tilt angles
  for (const frame of [earlyPour, midPour, latePour]) {
    const tr = computePourTransform(geom, frame);
    const rad = (tr.tiltDeg * Math.PI) / 180;
    const worldMouthX = geom.srcPivotX + tr.flyX + -geom.localMouthDy * Math.sin(rad);
    const worldMouthY = geom.srcPivotY + tr.flyY + geom.localMouthDy * Math.cos(rad);
    assert.ok(Math.abs(worldMouthX - geom.pourAnchorX) < 0.05, 'mouth X stays pinned while tilting');
    assert.ok(Math.abs(worldMouthY - geom.pourAnchorY) < 0.05, 'mouth Y stays pinned while tilting');
  }

  // Wrist tip-back cuts back upright right after pouring finishes
  const tipBack = evaluatePourTimeline(0.82, geom.maxTiltDeg, geom.startTiltDeg);
  assert.ok(tipBack.tiltDeg < latePour.tiltDeg, 'bottle tips back upright after stream cut');

  const end = evaluatePourTimeline(1, geom.maxTiltDeg, geom.startTiltDeg);
  assert.equal(end.moveProgress, 0);
  assert.equal(end.tiltDeg, 0);
  assert.equal(end.drainRatio, 1);
  assert.equal(end.fillRatio, 1);

  assert.ok(getPourDurationMs(1) < getPourDurationMs(3));
});

test('buildVerticalStreamPath produces valid closed vertical path for active and pinched stream', () => {
  const activeD = buildVerticalStreamPath(244.5, 290, 249, 292, 390, 0, 1, 0.95);
  assert.ok(activeD.startsWith('M ') && activeD.endsWith(' Z'));

  const pinchedD = buildVerticalStreamPath(244.5, 290, 249, 340, 390, 0.5, 1, 0.75);
  assert.ok(pinchedD.startsWith('M ') && pinchedD.endsWith(' Z'));
});
