/**
 * Plan B ("Potion Resonance & Starlight Halo" / 魔药共鸣 · 星轨圣环)
 * Pure mathematical timeline & true 3D front/back occluded double-helix geometry
 * for the bottle completion celebration.
 */

export const SEAL_DURATION_MS = 920;
export const SEAL_TRIGGER_DELAY_MS = 430;

export interface HelixRibbonSegment {
  d: string;
  strokeWidth: number;
  opacity: number;
  depth: 'back' | 'front';
  strand: 0 | 1;
}

export interface HelixSparklePoint {
  x: number;
  y: number;
  r: number;
  opacity: number;
  depth: 'back' | 'front';
  strand: 0 | 1;
  kind: 'star' | 'dot';
}

export interface RisingBubblePoint {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export interface SealTimelineState {
  progress: number;
  /** Vertical levitation offset in px (negative = floating upward) */
  levitateY: number;
  /** Bottle scale bounce on settle */
  bottleScaleX: number;
  bottleScaleY: number;
  /** Ground shadow scale & opacity reacting to levitation */
  shadowScale: number;
  shadowOpacity: number;
  /** Beat 1: Golden alchemy magic circle beneath the bottle base */
  circleOpacity: number;
  circleScale: number;
  circleRotationDeg: number;
  /** Beat 1-2: Inner liquid luminous S-swirl + rising bubbles */
  swirlOpacity: number;
  swirlOffsetY: number;
  innerBubbles: RisingBubblePoint[];
  /** Beat 2: True 3D depth-sorted silky starlight ribbons */
  backRibbons: HelixRibbonSegment[];
  frontRibbons: HelixRibbonSegment[];
  backSparkles: HelixSparklePoint[];
  frontSparkles: HelixSparklePoint[];
  /** Beat 3: Spinning cork + luminous magic halo + fairy mist at bottle mouth */
  corkVisible: boolean;
  corkYOffset: number;
  corkTiltDeg: number;
  corkScaleX: number;
  corkScaleY: number;
  corkOpacity: number;
  haloOpacity: number;
  haloScale: number;
  haloYOffset: number;
  haloRotationDeg: number;
  mistOpacity: number;
  mistScale: number;
  /** Beat 4: Diagonal crystal sheen sweep + fading stardust crown */
  sheenProgress: number;
  sheenOpacity: number;
  crownOpacity: number;
  crownExpand: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Smooth bottle-hugging helical radius matching OUTER_PATH with airy Plan B silk ribbon clearance */
function bottleHelixRadiusAtY(y: number): number {
  if (y >= 46) {
    // Wide graceful silk orbit around the glass body (half-width 26 + 9px luminous sweep)
    return 35.0;
  }
  if (y >= 24) {
    const u = (y - 24) / (46 - 24);
    const smooth = u * u * (3 - 2 * u);
    return 19.5 + smooth * 15.5;
  }
  return 18.5;
}

const BUBBLE_SEEDS = [
  { xBase: 26, amp: 5.5, phase: 0.2, startY: 146, speed: 1.05, r: 2.1 },
  { xBase: 41, amp: -4.8, phase: 1.4, startY: 150, speed: 0.96, r: 1.75 },
  { xBase: 34, amp: 6.2, phase: 2.5, startY: 140, speed: 1.12, r: 2.35 },
  { xBase: 46, amp: -5.2, phase: 3.7, startY: 148, speed: 0.92, r: 1.55 },
  { xBase: 29, amp: 4.5, phase: 4.8, startY: 136, speed: 1.0, r: 1.65 },
  { xBase: 38, amp: -6.0, phase: 0.9, startY: 144, speed: 1.08, r: 1.9 },
  { xBase: 32, amp: 3.8, phase: 2.1, startY: 152, speed: 0.88, r: 1.35 },
];

function buildSmoothPolylinePath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = ((pts[i].x + pts[i + 1].x) * 0.5).toFixed(2);
    const yc = ((pts[i].y + pts[i + 1].y) * 0.5).toFixed(2);
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${xc} ${yc}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

export function evaluateSealTimeline(rawProgress: number): SealTimelineState {
  const p = clamp01(rawProgress);

  // --- Levitation & Settle Cushion (Beat 2 -> Beat 4) ---
  let levitateY = 0;
  let bottleScaleX = 1;
  let bottleScaleY = 1;

  if (p < 0.08) {
    // Subtle gathering pulse
    const u = Math.sin((p / 0.08) * Math.PI);
    bottleScaleX = 1 + 0.025 * u;
    bottleScaleY = 1 - 0.022 * u;
  } else if (p < 0.44) {
    // Weightless magical rise up to -7.5px
    const u = easeInOutCubic((p - 0.08) / 0.36);
    levitateY = -7.5 * u;
  } else if (p < 0.72) {
    // Gentle hover plateau while cork spirals in
    const u = (p - 0.44) / 0.28;
    levitateY = -7.5 + Math.sin(u * Math.PI) * -0.9;
  } else if (p < 0.88) {
    // Graceful settle back down onto oak shelf
    const u = easeInOutCubic((p - 0.72) / 0.16);
    levitateY = -7.5 * (1 - u);
  } else if (p < 1) {
    // Subtle cushioned landing spring
    const u = (p - 0.88) / 0.12;
    const bounce = Math.sin(u * Math.PI);
    levitateY = 0.8 * bounce;
    bottleScaleX = 1 + 0.028 * bounce;
    bottleScaleY = 1 - 0.025 * bounce;
  }

  const liftNorm = clamp01(-levitateY / 7.8);
  const shadowScale = 1 - liftNorm * 0.18;
  const shadowOpacity = 1 - liftNorm * 0.34;

  // --- Beat 1: Golden Alchemy Circle at Base ---
  let circleOpacity = 0;
  let circleScale = 0.45;
  if (p < 0.16) {
    const u = easeOutBack(p / 0.16);
    circleOpacity = clamp01(p / 0.1) * 0.98;
    circleScale = 0.45 + 0.58 * u;
  } else if (p < 0.74) {
    circleOpacity = 0.98 - ((p - 0.16) / 0.58) * 0.16;
    circleScale = 1.03 + Math.sin(((p - 0.16) / 0.58) * Math.PI * 2) * 0.03;
  } else {
    const u = (p - 0.74) / 0.26;
    circleOpacity = 0.82 * (1 - easeOutCubic(u));
    circleScale = 1.03 + u * 0.16;
  }
  const circleRotationDeg = p * 76;

  // --- Beat 1-2: Inner Liquid S-Swirl & Effervescent Rising Bubbles ---
  const swirlWindow = p < 0.58 ? Math.sin(clamp01(p / 0.58) * Math.PI) : 0;
  const swirlOpacity = swirlWindow * 0.92;
  const swirlOffsetY = -p * 34;

  const innerBubbles: RisingBubblePoint[] = [];
  if (p > 0.02 && p < 0.68) {
    const bWindow = p < 0.54 ? clamp01((p - 0.02) / 0.12) : clamp01((0.68 - p) / 0.14);
    for (const seed of BUBBLE_SEEDS) {
      const travel = p * 1.45 * seed.speed;
      const y = seed.startY - travel * 92;
      if (y < 54 || y > 152) continue;
      const x = seed.xBase + Math.sin(seed.phase + p * 10.5) * seed.amp;
      innerBubbles.push({
        x,
        y,
        r: seed.r,
        opacity: bWindow * 0.9,
      });
    }
  }

  // --- Beat 2: True 3D Depth-Sorted Continuous Silky Double-Helix Starlight Ribbons ---
  const backRibbons: HelixRibbonSegment[] = [];
  const frontRibbons: HelixRibbonSegment[] = [];
  const backSparkles: HelixSparklePoint[] = [];
  const frontSparkles: HelixSparklePoint[] = [];

  if (p >= 0.04 && p <= 0.78) {
    const helixP = clamp01((p - 0.04) / 0.66);
    const headT = easeInOutCubic(helixP);
    const trailSpan = 0.56;
    const tailT = Math.max(0, headT - trailSpan);
    const fadeOut = p > 0.62 ? 1 - clamp01((p - 0.62) / 0.16) : 1;
    const fadeIn = clamp01((p - 0.04) / 0.08);
    const masterOpacity = fadeIn * fadeOut;

    const totalRevs = 2.0; // 2.0 graceful intertwined 3D turns from base to mouth
    const steps = 36;

    ([0, 1] as const).forEach((strand) => {
      const phaseOffset = strand === 0 ? 0 : Math.PI;
      const pts: Array<{ x: number; y: number; z: number; u: number }> = [];

      for (let i = 0; i <= steps; i++) {
        const u = i / steps; // 0 = tail, 1 = glowing head
        const s = tailT + (headT - tailT) * u;
        if (s > 1) continue;
        const y = 152 - s * 138;
        const angle = s * Math.PI * 2 * totalRevs + phaseOffset;
        const radius = bottleHelixRadiusAtY(y);
        const x = 36 + Math.cos(angle) * radius;
        const z = Math.sin(angle); // z >= 0 is IN FRONT of bottle, z < 0 is BEHIND
        pts.push({ x, y, z, u });
      }

      // Group contiguous points of identical depth (front vs back) into smooth continuous curved spans
      // (Just 2-4 crisp SVG paths per strand instead of 60+ tiny lines -> 10x faster & zero filter bbox clipping)
      let runPts: Array<{ x: number; y: number; z: number; u: number }> = [];
      let runDepth: 'back' | 'front' | null = null;

      const flushRun = () => {
        if (runPts.length < 2 || !runDepth) return;
        const avgU = runPts.reduce((acc, pt) => acc + pt.u, 0) / runPts.length;
        const taper = 0.48 + 0.52 * Math.sin(Math.pow(avgU, 0.78) * Math.PI);
        const seg: HelixRibbonSegment = {
          d: buildSmoothPolylinePath(runPts),
          strokeWidth: (runDepth === 'front' ? 5.0 : 3.6) * taper,
          opacity: masterOpacity * (runDepth === 'front' ? 0.96 : 0.62),
          depth: runDepth,
          strand,
        };
        if (runDepth === 'front') {
          frontRibbons.push(seg);
        } else {
          backRibbons.push(seg);
        }
      };

      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const depth: 'back' | 'front' = pt.z >= 0 ? 'front' : 'back';
        if (runDepth === null) {
          runDepth = depth;
          runPts = [pt];
        } else if (depth === runDepth) {
          runPts.push(pt);
        } else {
          // Include crossover point in both runs so front/back seam meets seamlessly at the bottle edge
          runPts.push(pt);
          flushRun();
          runDepth = depth;
          runPts = [pt];
        }
      }
      flushRun();

      // Distribute shimmering stars & fairy stardust trailing along each ribbon
      const sparkleIndices = [6, 13, 20, 26, 32, 35];
      sparkleIndices.forEach((idx, k) => {
        const pt = pts[idx];
        if (!pt) return;
        const depth: 'back' | 'front' = pt.z >= 0 ? 'front' : 'back';
        const jitterX = Math.sin(k * 2.7 + strand * 1.9 + p * 8) * 3.8;
        const jitterY = Math.cos(k * 3.1 + strand * 2.3 + p * 6) * 2.6;
        const isHead = idx >= 32;
        const sp: HelixSparklePoint = {
          x: pt.x + jitterX,
          y: pt.y + jitterY,
          r: isHead ? 3.2 : k % 2 === 0 ? 2.1 : 1.15,
          opacity: masterOpacity * (depth === 'front' ? 0.98 : 0.56) * (0.45 + 0.55 * pt.u),
          depth,
          strand,
          kind: isHead || k % 2 === 0 ? 'star' : 'dot',
        };
        if (depth === 'front') {
          frontSparkles.push(sp);
        } else {
          backSparkles.push(sp);
        }
      });
    });
  }

  // --- Beat 3: Spinning Cork Descending Through Glowing Magic Halo Ring & Fairy Mist ---
  const corkVisible = p >= 0.52;
  let corkYOffset = -28;
  let corkTiltDeg = -14;
  let corkScaleX = 1;
  let corkScaleY = 1;
  let corkOpacity = 0;

  if (p >= 0.52 && p < 0.74) {
    const u = (p - 0.52) / 0.22;
    const eased = easeInOutCubic(u);
    corkYOffset = -28 * (1 - eased);
    corkTiltDeg = -14 * Math.cos(u * Math.PI * 1.5) * (1 - u);
    corkOpacity = clamp01(u / 0.22);
  } else if (p >= 0.74) {
    corkYOffset = 0;
    corkTiltDeg = 0;
    corkOpacity = 1;
    if (p < 0.86) {
      // Tactile cushioned cork pop-seat squash & stretch
      const u = (p - 0.74) / 0.12;
      const squash = Math.sin(u * Math.PI);
      corkScaleX = 1 + 0.12 * squash;
      corkScaleY = 1 - 0.14 * squash;
    }
  }

  let haloOpacity = 0;
  let haloScale = 0.6;
  let haloYOffset = -14;
  const haloRotationDeg = (p - 0.5) * 160;
  if (p >= 0.5 && p <= 0.84) {
    const u = (p - 0.5) / 0.34;
    haloOpacity = Math.sin(u * Math.PI) * 0.95;
    haloScale = 0.65 + easeOutCubic(u) * 0.58;
    haloYOffset = -16 + easeInOutCubic(u) * 18;
  }

  let mistOpacity = 0;
  let mistScale = 0.6;
  if (p >= 0.56 && p <= 0.88) {
    const u = (p - 0.56) / 0.32;
    mistOpacity = Math.sin(u * Math.PI) * 0.82;
    mistScale = 0.65 + easeOutCubic(u) * 0.65;
  }

  // --- Beat 4: Diagonal Crystal Sheen Sweep + Ethereal Stardust Crown Fade ---
  let sheenProgress = 0;
  let sheenOpacity = 0;
  if (p >= 0.74 && p <= 0.97) {
    const u = (p - 0.74) / 0.23;
    sheenProgress = easeInOutCubic(u);
    sheenOpacity = Math.sin(u * Math.PI) * 0.88;
  }

  let crownOpacity = 0;
  let crownExpand = 0;
  if (p >= 0.72 && p <= 1.0) {
    const u = (p - 0.72) / 0.28;
    crownOpacity = Math.sin(u * Math.PI) * 0.92;
    crownExpand = easeOutCubic(u);
  }

  return {
    progress: p,
    levitateY,
    bottleScaleX,
    bottleScaleY,
    shadowScale,
    shadowOpacity,
    circleOpacity,
    circleScale,
    circleRotationDeg,
    swirlOpacity,
    swirlOffsetY,
    innerBubbles,
    backRibbons,
    frontRibbons,
    backSparkles,
    frontSparkles,
    corkVisible,
    corkYOffset,
    corkTiltDeg,
    corkScaleX,
    corkScaleY,
    corkOpacity,
    haloOpacity,
    haloScale,
    haloYOffset,
    haloRotationDeg,
    mistOpacity,
    mistScale,
    sheenProgress,
    sheenOpacity,
    crownOpacity,
    crownExpand,
  };
}
