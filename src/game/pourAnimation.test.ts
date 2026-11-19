import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerticalStreamPath,
  computeMagicSortPourGeometry,
  evaluatePourTimeline,
} from './pourAnimation';

test('computeMagicSortPourGeometry hovers left when pouring right and respects edge bounds', () => {
  const stage = { left: 0, top: 0, width: 390, height: 844 };
  const src = { left: 40, top: 280, width: 58, height: 132 };
  const dst = { left: 220, top: 460, width: 58, height: 132 };

  const geom = computeMagicSortPourGeometry(stage, src, dst, 1, 1);
  assert.equal(geom.dir, 'right');
  assert.equal(geom.maxTiltDeg, 78);
  assert.ok(geom.flyX > 0, 'source must fly right toward target');
  assert.ok(geom.flyY > 0, 'source must descend toward bottom-row target mouth');
  assert.ok(
    Math.abs(geom.streamX - (dst.left + dst.width / 2)) < 0.01,
    'vertical stream must align exactly with target bottle mouth center'
  );
  assert.ok(geom.targetEndSurfaceY < geom.targetStartSurfaceY, 'target liquid level must rise');

  // Pouring into far-left target should hover to the right (dir='left') so it never clips off-screen
  const farLeftDst = { left: 20, top: 460, width: 58, height: 132 };
  const edgeGeom = computeMagicSortPourGeometry(stage, { left: 5, top: 280, width: 58, height: 132 }, farLeftDst, 0, 2);
  assert.equal(edgeGeom.dir, 'left');
  assert.equal(edgeGeom.maxTiltDeg, -78);
});

test('evaluatePourTimeline transitions smoothly across fly, vertical stream, and return phases', () => {
  const start = evaluatePourTimeline(0, 78);
  assert.equal(start.moveProgress, 0);
  assert.equal(start.tiltDeg, 0);
  assert.equal(start.streamTip, 0);

  const mid = evaluatePourTimeline(0.5, 78);
  assert.equal(mid.moveProgress, 1);
  assert.equal(mid.tiltDeg, 78);
  assert.equal(mid.streamTip, 1);
  assert.equal(mid.streamCut, 0);
  assert.ok(mid.drainRatio > 0 && mid.drainRatio < 1);
  assert.ok(mid.fillRatio > 0 && mid.fillRatio < 1);

  const end = evaluatePourTimeline(1, 78);
  assert.equal(end.moveProgress, 0);
  assert.equal(end.tiltDeg, 0);
  assert.equal(end.drainRatio, 1);
  assert.equal(end.fillRatio, 1);
});

test('buildVerticalStreamPath produces valid closed vertical path for active and pinched stream', () => {
  const activeD = buildVerticalStreamPath(244.5, 290, 249, 292, 390, 0, 1);
  assert.ok(activeD.startsWith('M ') && activeD.endsWith(' Z'));
  assert.ok(activeD.includes('246.20 390.00') || activeD.includes('246.20'), 'contains vertical bottom left point');

  const pinchedD = buildVerticalStreamPath(244.5, 290, 249, 340, 390, 0.5, 1);
  assert.ok(pinchedD.startsWith('M ') && pinchedD.endsWith(' Z'));
});
