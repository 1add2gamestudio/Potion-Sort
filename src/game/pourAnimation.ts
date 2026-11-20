export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagicSortPourGeometry {
  dir: 'left' | 'right';
  startTiltDeg: number;
  maxTiltDeg: number;
  flyX: number;
  flyY: number;
  srcPivotX: number;
  srcPivotY: number;
  localMouthDy: number;
  pourAnchorX: number;
  pourAnchorY: number;
  mouthX: number;
  mouthY: number;
  streamX: number;
  streamStartY: number;
  streamEntryY: number;
  targetStartSurfaceY: number;
  targetEndSurfaceY: number;
}

export interface PourTimelineState {
  moveProgress: number;
  arcLift: number;
  tiltDeg: number;
  pourProgress: number;
  drainRatio: number;
  fillRatio: number;
  streamTip: number;
  streamCut: number;
  streamFlow: number;
}

export const POUR_DURATION_MS = 740;

/**
 * Dynamic pour duration scaled gently by poured layer count so a 1-layer pour feels crisp
 * while multi-layer pours give enough time to appreciate the progressively deepening bottle tilt.
 */
export function getPourDurationMs(pouredCount: number): number {
  const clamped = Math.max(1, Math.min(4, Math.round(pouredCount)));
  return 740 + (clamped - 1) * 95;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function smoothstep(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * Computes physically grounded progressive tilt angles (in degrees, unsigned magnitude):
 * - A fuller bottle starts spilling at a shallower angle (~48°), whereas a nearly empty bottle
 *   must tip further (~72°) before liquid reaches the lip.
 * - As liquid drains, the bottle continuously tips deeper until reaching endTiltMag (70°..98°),
 *   tipping slightly past 90° when draining the final drop out of an emptied bottle.
 */
export function computeProgressiveTiltRange(
  sourceLayersBefore: number,
  pouredCount: number
): { startMag: number; endMag: number } {
  const before = Math.max(1, Math.min(4, Math.round(sourceLayersBefore)));
  const poured = Math.max(1, Math.min(before, Math.round(pouredCount)));
  const remainingAfter = Math.max(0, before - poured);

  const startMag = 48 + (4 - before) * 8; // 4->48°, 3->56°, 2->64°, 1->72°
  const endByRemaining: Record<number, number> = {
    3: 70,
    2: 79,
    1: 88,
    0: 98,
  };
  const endMag = Math.max(startMag + 22, endByRemaining[remainingAfter] ?? 96);
  return { startMag, endMag };
}

/**
 * Computes Magic Sort bottle transport geometry + progressive tilt bounds + vertical stream coordinates
 * so the source bottle approaches cleanly and hinges around the target bottle's mouth as its tilt deepens.
 */
export function computeMagicSortPourGeometry(
  stageRect: RectLike,
  srcRect: RectLike,
  dstRect: RectLike,
  targetLayersBefore: number,
  pouredCount: number,
  sourceLayersBefore = 4
): MagicSortPourGeometry {
  const srcScale = srcRect.height / 164;
  const dstScale = dstRect.height / 164;

  const srcPivotX = srcRect.left - stageRect.left + srcRect.width * 0.5;
  const srcPivotY = srcRect.top - stageRect.top + srcRect.height * (88 / 164);

  const dstCenterX = dstRect.left - stageRect.left + dstRect.width * 0.5;
  const dstMouthY = dstRect.top - stageRect.top + 11 * dstScale;

  // Choose tilt direction (usually approach from the side the source came from,
  // but flip if hovering on that side would push the bottle off-screen)
  let dir: 'left' | 'right' = dstCenterX >= srcPivotX ? 'right' : 'left';
  if (dir === 'right' && dstCenterX < 118) {
    dir = 'left';
  } else if (dir === 'left' && stageRect.width - dstCenterX < 118) {
    dir = 'right';
  }

  const sign = dir === 'right' ? 1 : -1;
  const { startMag, endMag } = computeProgressiveTiltRange(sourceLayersBefore, pouredCount);
  const startTiltDeg = sign * startMag;
  const maxTiltDeg = sign * endMag;

  // Local mouth offset from pivot (36, 88) -> (36, 11) is (0, -77 * scale)
  const localMouthDy = -77 * srcScale;

  // Target anchor directly above the destination bottle mouth where the pouring lip hinges
  const pourAnchorX = dstCenterX + (dir === 'right' ? -6 : 6);
  const pourAnchorY = dstMouthY - 11;
  const streamExitX = pourAnchorX + (dir === 'right' ? 1.8 : -1.8);
  const streamExitY = pourAnchorY + 4.5;

  // Initial mouth-locked pivot translation at startTiltDeg
  const startRad = (startTiltDeg * Math.PI) / 180;
  const startRx = -localMouthDy * Math.sin(startRad);
  const startRy = localMouthDy * Math.cos(startRad);
  const flyX = pourAnchorX - startRx - srcPivotX;
  const flyY = pourAnchorY - startRy - srcPivotY;

  const startLayers = Math.max(0, Math.min(4, targetLayersBefore));
  const endLayers = Math.max(0, Math.min(4, targetLayersBefore + pouredCount));
  const targetStartSurfaceSvgY = 154 - startLayers * 25.5;
  const targetEndSurfaceSvgY = 154 - endLayers * 25.5;

  return {
    dir,
    startTiltDeg,
    maxTiltDeg,
    flyX,
    flyY,
    srcPivotX,
    srcPivotY,
    localMouthDy,
    pourAnchorX,
    pourAnchorY,
    mouthX: streamExitX,
    mouthY: streamExitY,
    streamX: dstCenterX,
    streamStartY: streamExitY + 1.5,
    streamEntryY: dstMouthY + 1,
    targetStartSurfaceY: dstRect.top - stageRect.top + targetStartSurfaceSvgY * dstScale,
    targetEndSurfaceY: dstRect.top - stageRect.top + targetEndSurfaceSvgY * dstScale,
  };
}

/**
 * Computes the exact mouth-locked (flyX, flyY, tiltDeg) transform for the flying source bottle.
 * During pouring (moveProgress === 1), the bottle's pouring mouth remains pinned directly at
 * (pourAnchorX, pourAnchorY) while the bottle body pivots higher as tiltDeg progressively deepens.
 */
export function computePourTransform(
  geom: MagicSortPourGeometry,
  timeline: PourTimelineState
): { flyX: number; flyY: number; tiltDeg: number } {
  const rad = (timeline.tiltDeg * Math.PI) / 180;
  const rx = -geom.localMouthDy * Math.sin(rad);
  const ry = geom.localMouthDy * Math.cos(rad);

  // Exact pivot offset that places the rotated bottle mouth at (pourAnchorX, pourAnchorY)
  const lockedFlyX = geom.pourAnchorX - rx - geom.srcPivotX;
  const lockedFlyY = geom.pourAnchorY - ry - geom.srcPivotY;

  const mp = timeline.moveProgress;
  const arcOffsetY = -14 * timeline.arcLift;

  return {
    flyX: lockedFlyX * mp,
    flyY: lockedFlyY * mp + arcOffsetY,
    tiltDeg: timeline.tiltDeg,
  };
}

/**
 * Evaluates the 4-beat progressive-tilt pouring timeline at normalized progress p in [0, 1]:
 * - [0.00, 0.22]: Arc approach & initial tilt into startTiltDeg above target mouth
 * - [0.22, 0.76]: Progressive deepening pour (startTiltDeg -> maxTiltDeg) while source drains & target fills
 * - [0.76, 0.84]: Crisp wrist tip-back cutoff to cleanly pinch the last stream drop
 * - [0.84, 1.00]: Graceful upright glide back onto the shelf slot
 */
export function evaluatePourTimeline(
  p: number,
  maxTiltDeg: number,
  startTiltDeg?: number
): PourTimelineState {
  const prog = clamp01(p);
  const sign = maxTiltDeg >= 0 ? 1 : -1;
  const resolvedStart =
    startTiltDeg !== undefined
      ? startTiltDeg
      : sign * Math.min(Math.abs(maxTiltDeg) * 0.66, 54);

  if (prog < 0.22) {
    const raw = prog / 0.22;
    const e = smoothstep(raw);
    return {
      moveProgress: e,
      arcLift: Math.sin(Math.PI * raw),
      tiltDeg: resolvedStart * e,
      pourProgress: 0,
      drainRatio: 0,
      fillRatio: 0,
      streamTip: 0,
      streamCut: 0,
      streamFlow: 0,
    };
  }

  if (prog <= 0.76) {
    const t = (prog - 0.22) / 0.54;
    // Continuous deepening tilt throughout the pour (immediate response + silky S-curve body)
    const tiltBlend = 0.22 * t + 0.78 * smoothstep(t);
    const tiltDeg = resolvedStart + (maxTiltDeg - resolvedStart) * tiltBlend;

    const streamTip = clamp01(t / 0.13);
    const streamCut = t > 0.85 ? clamp01((t - 0.85) / 0.15) : 0;
    const drainRatio = smoothstep(clamp01(t / 0.90));
    const fillRatio = smoothstep(clamp01((t - 0.08) / 0.84));
    // Stream swells quickly at onset, holds steady, then tapers organically on the final drop
    const streamFlow =
      0.62 + 0.38 * Math.sin(Math.PI * clamp01(t * 0.95 + 0.05));

    return {
      moveProgress: 1,
      arcLift: 0,
      tiltDeg,
      pourProgress: t,
      drainRatio,
      fillRatio,
      streamTip,
      streamCut,
      streamFlow,
    };
  }

  if (prog < 0.84) {
    // Crisp wrist tip-back right after stream cut so it cleanly stops dripping before gliding back
    const tTip = smoothstep((prog - 0.76) / 0.08);
    const tipBackTilt = maxTiltDeg * (1 - 0.32 * tTip);
    return {
      moveProgress: 1,
      arcLift: 0.12 * tTip,
      tiltDeg: tipBackTilt,
      pourProgress: 1,
      drainRatio: 1,
      fillRatio: 1,
      streamTip: 0,
      streamCut: 1,
      streamFlow: 0,
    };
  }

  const rawBack = (prog - 0.84) / 0.16;
  const eBack = 1 - smoothstep(rawBack);
  const tipStart = maxTiltDeg * 0.68;
  return {
    moveProgress: eBack,
    arcLift: 0.45 * Math.sin(Math.PI * rawBack),
    tiltDeg: tipStart * eBack,
    pourProgress: 1,
    drainRatio: 1,
    fillRatio: 1,
    streamTip: 0,
    streamCut: 1,
    streamFlow: 0,
  };
}

/**
 * Builds the SVG path for Magic Sort's sleek tapered vertical liquid stream
 * falling from the tilted bottle lip into the target bottle's open mouth.
 */
export function buildVerticalStreamPath(
  mouthX: number,
  mouthY: number,
  streamX: number,
  topY: number,
  botY: number,
  streamCut: number,
  streamTip: number,
  flowScale = 1
): string {
  const h = Math.max(2, botY - topY);
  const scale = Math.max(0.65, Math.min(1.15, flowScale));
  const wBot = (streamTip < 0.97 ? 1.8 : 2.8) * scale;
  const wTop = (streamCut > 0.02 ? 1.8 : 3.4) * scale;

  if (streamCut > 0.02) {
    // Pinched falling tail dropping cleanly into the bottle
    const tipY = botY + (streamTip < 0.97 ? 2.5 : 1);
    return [
      `M ${(streamX - wTop).toFixed(2)} ${topY.toFixed(2)}`,
      `Q ${streamX.toFixed(2)} ${(topY - 3).toFixed(2)} ${(streamX + wTop).toFixed(2)} ${topY.toFixed(2)}`,
      `L ${(streamX + wBot).toFixed(2)} ${botY.toFixed(2)}`,
      `Q ${streamX.toFixed(2)} ${tipY.toFixed(2)} ${(streamX - wBot).toFixed(2)} ${botY.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const bendY = Math.min(botY - 1, topY + Math.min(12, h * 0.45));
  const tipY = botY + (streamTip < 0.97 ? 3.2 : 1.2);
  const lipLeftX = mouthX - 2.6 * scale;
  const lipRightX = mouthX + 2.6 * scale;

  return [
    `M ${lipLeftX.toFixed(2)} ${mouthY.toFixed(2)}`,
    `Q ${((lipLeftX + streamX - wTop) / 2).toFixed(2)} ${topY.toFixed(2)} ${(streamX - wTop).toFixed(2)} ${bendY.toFixed(2)}`,
    `L ${(streamX - wBot).toFixed(2)} ${botY.toFixed(2)}`,
    `Q ${streamX.toFixed(2)} ${tipY.toFixed(2)} ${(streamX + wBot).toFixed(2)} ${botY.toFixed(2)}`,
    `L ${(streamX + wTop).toFixed(2)} ${bendY.toFixed(2)}`,
    `Q ${((lipRightX + streamX + wTop) / 2).toFixed(2)} ${topY.toFixed(2)} ${lipRightX.toFixed(2)} ${mouthY.toFixed(2)}`,
    'Z',
  ].join(' ');
}
