export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagicSortPourGeometry {
  dir: 'left' | 'right';
  maxTiltDeg: number;
  flyX: number;
  flyY: number;
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
  tiltDeg: number;
  drainRatio: number;
  fillRatio: number;
  streamTip: number;
  streamCut: number;
}

export const POUR_DURATION_MS = 680;

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function smoothstep(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * Computes Magic Sort bottle transport offset + vertical stream coordinates
 * so the tilted source bottle hovers cleanly beside/above the target bottle's mouth
 * while staying within the stage bounds.
 */
export function computeMagicSortPourGeometry(
  stageRect: RectLike,
  srcRect: RectLike,
  dstRect: RectLike,
  targetLayersBefore: number,
  pouredCount: number
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
  if (dir === 'right' && dstCenterX < 116) {
    dir = 'left';
  } else if (dir === 'left' && stageRect.width - dstCenterX < 116) {
    dir = 'right';
  }

  const maxTiltDeg = dir === 'right' ? 78 : -78;
  const rad = (maxTiltDeg * Math.PI) / 180;

  // Local mouth offset from pivot (36, 88) -> (36, 11) is (0, -77 * scale)
  const localMouthDy = -77 * srcScale;
  const rx = -localMouthDy * Math.sin(rad);
  const ry = localMouthDy * Math.cos(rad);

  const mouthX = dstCenterX + (dir === 'right' ? -6 : 6);
  const mouthY = dstMouthY - 11;
  const streamExitX = mouthX + (dir === 'right' ? 1.8 : -1.8);
  const streamExitY = mouthY + 4.5;

  const targetPivotX = mouthX - rx;
  const targetPivotY = mouthY - ry;

  const flyX = targetPivotX - srcPivotX;
  const flyY = targetPivotY - srcPivotY;

  const startLayers = Math.max(0, Math.min(4, targetLayersBefore));
  const endLayers = Math.max(0, Math.min(4, targetLayersBefore + pouredCount));
  const targetStartSurfaceSvgY = 154 - startLayers * 25.5;
  const targetEndSurfaceSvgY = 154 - endLayers * 25.5;

  return {
    dir,
    maxTiltDeg,
    flyX,
    flyY,
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
 * Evaluates the 3-phase Magic Sort pouring timeline at normalized progress p in [0, 1]:
 * - [0.00, 0.24]: Fly & tilt bottle into hover position above target mouth
 * - [0.24, 0.78]: Pour vertical stream while source drains & target rises
 * - [0.78, 1.00]: Cut stream cleanly & glide source back upright to its shelf slot
 */
export function evaluatePourTimeline(p: number, maxTiltDeg: number): PourTimelineState {
  const prog = clamp01(p);
  if (prog < 0.24) {
    const e = smoothstep(prog / 0.24);
    return {
      moveProgress: e,
      tiltDeg: maxTiltDeg * e,
      drainRatio: 0,
      fillRatio: 0,
      streamTip: 0,
      streamCut: 0,
    };
  }
  if (prog <= 0.78) {
    const t = (prog - 0.24) / 0.54;
    const streamTip = clamp01(t / 0.14);
    const streamCut = t > 0.84 ? clamp01((t - 0.84) / 0.16) : 0;
    const drainRatio = smoothstep(clamp01(t / 0.9));
    const fillRatio = smoothstep(clamp01((t - 0.08) / 0.84));
    return {
      moveProgress: 1,
      tiltDeg: maxTiltDeg,
      drainRatio,
      fillRatio,
      streamTip,
      streamCut,
    };
  }
  const eBack = 1 - smoothstep((prog - 0.78) / 0.22);
  return {
    moveProgress: eBack,
    tiltDeg: maxTiltDeg * eBack,
    drainRatio: 1,
    fillRatio: 1,
    streamTip: 0,
    streamCut: 1,
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
  streamTip: number
): string {
  const h = Math.max(2, botY - topY);
  const wBot = streamTip < 0.97 ? 1.8 : 2.8;
  const wTop = streamCut > 0.02 ? 1.8 : 3.4;

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
  const lipLeftX = mouthX - 2.6;
  const lipRightX = mouthX + 2.6;

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

