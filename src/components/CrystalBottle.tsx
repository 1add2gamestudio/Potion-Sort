import React, { useId } from 'react';
import { isBottleComplete } from '../game/engine';
import { evaluateSealTimeline } from '../game/sealAnimation';
import {
  BOTTLE_CAPACITY,
  POTION_COLORS,
  type Bottle,
  type LiquidLayer,
  type BottleStyleId,
  type PotionColor,
} from '../game/types';
import { LIQUID_3D_PALETTES } from './bottleDesigns';

export interface PourSourceOverride {
  layersBefore: LiquidLayer[];
  pouredCount: number;
  flyX: number;
  flyY: number;
  tiltDeg: number;
  drainRatio: number;
}

export interface PourFillOverride {
  beforeCount: number;
  pouredCount: number;
  fillRatio: number;
  isStreaming: boolean;
}

interface CrystalBottleProps {
  bottle: Bottle;
  bottleStyle?: BottleStyleId;
  selected: boolean;
  pourSourceOverride?: PourSourceOverride | null;
  pourFillOverride?: PourFillOverride | null;
  /** 0..1 progress while Plan B completion ceremony is actively animating */
  sealProgress?: number | null;
  /** True during the brief pour-fill tail right before the seal ceremony kicks off */
  sealPending?: boolean;
  colorSymbolsEnabled: boolean;
  compact?: boolean;
  sizeClassName?: string;
  interactive?: boolean;
  onSelect: (bottleId: string) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

const ALL_COLORS: PotionColor[] = ['coral', 'seafoam', 'citron', 'azure', 'iris', 'rose', 'jade'];

// Preserved 1:1 bottle silhouette & geometry (viewBox 0 0 72 164)
const OUTER_PATH =
  'M 27 17 L 45 17 L 45 22 C 45 27 62 31 62 44 L 62 148 C 62 156 50 158 36 158 C 22 158 10 156 10 148 L 10 44 C 10 31 27 27 27 22 Z';

// Inner liquid cavity inset 3.5px on walls & 4.5px above outer base so blown-crystal thick glass rim reads clearly
const INNER_CLIP_PATH =
  'M 29.5 21 L 42.5 21 L 42.5 24.5 C 42.8 29.5 58.5 34 58.5 45.5 L 58.5 146.5 C 58.5 152 49 153.5 36 153.5 C 23 153.5 13.5 152 13.5 146.5 L 13.5 45.5 C 13.5 34 29.2 29.5 29.5 24.5 Z';

const SLOT_HEIGHTS: [number, number, number, number] = [128, 102.5, 77, 51.5];
const SLOT_HEIGHT = 25.5;
const BASE_BOTTOM_Y = 154;

/** Deterministic micro-stardust & bubble seeds per bottle layer so visuals stay crisp and pure */
interface PotionMote {
  x: number;
  yFrac: number;
  r: number;
  kind: 'star' | 'speck' | 'bubble';
  delaySec: number;
}

const LAYER_MOTE_PRESETS: PotionMote[][] = [
  [
    { x: 24, yFrac: 0.34, r: 0.95, kind: 'speck', delaySec: 0.0 },
    { x: 35, yFrac: 0.52, r: 1.85, kind: 'star', delaySec: 0.45 },
    { x: 47, yFrac: 0.38, r: 1.6, kind: 'bubble', delaySec: 0.8 },
    { x: 29, yFrac: 0.72, r: 0.55, kind: 'speck', delaySec: 1.1 },
    { x: 42, yFrac: 0.68, r: 1.15, kind: 'bubble', delaySec: 1.55 },
    { x: 51, yFrac: 0.56, r: 0.62, kind: 'speck', delaySec: 0.25 },
    { x: 19, yFrac: 0.48, r: 0.48, kind: 'speck', delaySec: 0.9 },
    { x: 38, yFrac: 0.24, r: 0.52, kind: 'speck', delaySec: 1.35 },
    { x: 45, yFrac: 0.82, r: 0.46, kind: 'speck', delaySec: 0.6 },
    { x: 27, yFrac: 0.18, r: 0.58, kind: 'speck', delaySec: 1.75 },
  ],
  [
    { x: 22, yFrac: 0.58, r: 1.7, kind: 'star', delaySec: 0.3 },
    { x: 32, yFrac: 0.32, r: 1.35, kind: 'bubble', delaySec: 0.9 },
    { x: 44, yFrac: 0.54, r: 0.9, kind: 'speck', delaySec: 0.15 },
    { x: 50, yFrac: 0.36, r: 1.6, kind: 'star', delaySec: 1.3 },
    { x: 37, yFrac: 0.74, r: 0.54, kind: 'speck', delaySec: 0.7 },
    { x: 26, yFrac: 0.42, r: 0.65, kind: 'speck', delaySec: 1.6 },
    { x: 40, yFrac: 0.22, r: 0.48, kind: 'speck', delaySec: 0.4 },
    { x: 20, yFrac: 0.26, r: 0.55, kind: 'speck', delaySec: 1.15 },
    { x: 48, yFrac: 0.78, r: 0.5, kind: 'speck', delaySec: 0.85 },
    { x: 31, yFrac: 0.84, r: 0.45, kind: 'speck', delaySec: 1.45 },
  ],
  [
    { x: 26, yFrac: 0.44, r: 1.5, kind: 'bubble', delaySec: 0.5 },
    { x: 38, yFrac: 0.36, r: 1.85, kind: 'star', delaySec: 0.1 },
    { x: 49, yFrac: 0.62, r: 0.92, kind: 'speck', delaySec: 1.0 },
    { x: 21, yFrac: 0.68, r: 0.58, kind: 'speck', delaySec: 1.4 },
    { x: 43, yFrac: 0.46, r: 1.15, kind: 'bubble', delaySec: 0.75 },
    { x: 31, yFrac: 0.66, r: 0.68, kind: 'speck', delaySec: 1.85 },
    { x: 52, yFrac: 0.28, r: 0.48, kind: 'speck', delaySec: 0.35 },
    { x: 34, yFrac: 0.18, r: 0.52, kind: 'speck', delaySec: 1.2 },
    { x: 24, yFrac: 0.82, r: 0.46, kind: 'speck', delaySec: 0.65 },
    { x: 46, yFrac: 0.8, r: 0.54, kind: 'speck', delaySec: 1.55 },
  ],
  [
    { x: 23, yFrac: 0.48, r: 0.92, kind: 'speck', delaySec: 0.2 },
    { x: 34, yFrac: 0.62, r: 1.55, kind: 'bubble', delaySec: 1.15 },
    { x: 46, yFrac: 0.38, r: 1.8, kind: 'star', delaySec: 0.6 },
    { x: 29, yFrac: 0.32, r: 1.35, kind: 'star', delaySec: 1.45 },
    { x: 51, yFrac: 0.66, r: 0.6, kind: 'speck', delaySec: 0.85 },
    { x: 39, yFrac: 0.52, r: 0.55, kind: 'speck', delaySec: 0.35 },
    { x: 19, yFrac: 0.24, r: 0.48, kind: 'speck', delaySec: 1.05 },
    { x: 42, yFrac: 0.2, r: 0.52, kind: 'speck', delaySec: 0.5 },
    { x: 27, yFrac: 0.78, r: 0.46, kind: 'speck', delaySec: 1.65 },
    { x: 48, yFrac: 0.84, r: 0.5, kind: 'speck', delaySec: 0.95 },
  ],
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function fourPointStarPath(cx: number, cy: number, outerR: number): string {
  const innerR = outerR * 0.3;
  return [
    `M ${cx.toFixed(2)} ${(cy - outerR).toFixed(2)}`,
    `L ${(cx + innerR).toFixed(2)} ${(cy - innerR).toFixed(2)}`,
    `L ${(cx + outerR).toFixed(2)} ${cy.toFixed(2)}`,
    `L ${(cx + innerR).toFixed(2)} ${(cy + innerR).toFixed(2)}`,
    `L ${cx.toFixed(2)} ${(cy + outerR).toFixed(2)}`,
    `L ${(cx - innerR).toFixed(2)} ${(cy + innerR).toFixed(2)}`,
    `L ${(cx - outerR).toFixed(2)} ${cy.toFixed(2)}`,
    `L ${(cx - innerR).toFixed(2)} ${(cy - innerR).toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface RenderedSlab {
  layer: LiquidLayer;
  yTop: number;
  yBottom: number;
  index: number;
}

interface OpticalLiquidRun {
  color: PotionColor;
  hidden: boolean;
  yTop: number;
  yBottom: number;
  startIndex: number;
  endIndex: number;
  slabs: RenderedSlab[];
}

function groupOpticalRuns(slabs: RenderedSlab[]): OpticalLiquidRun[] {
  const runs: OpticalLiquidRun[] = [];
  for (const slab of slabs) {
    const prev = runs[runs.length - 1];
    if (prev && !prev.hidden && !slab.layer.hidden && prev.color === slab.layer.color) {
      prev.yTop = Math.min(prev.yTop, slab.yTop);
      prev.yBottom = Math.max(prev.yBottom, slab.yBottom);
      prev.endIndex = slab.index;
      prev.slabs.push(slab);
    } else {
      runs.push({
        color: slab.layer.color,
        hidden: Boolean(slab.layer.hidden),
        yTop: slab.yTop,
        yBottom: slab.yBottom,
        startIndex: slab.index,
        endIndex: slab.index,
        slabs: [slab],
      });
    }
  }
  return runs;
}

export const CrystalBottle: React.FC<CrystalBottleProps> = ({
  bottle,
  bottleStyle = 'starlight',
  selected,
  pourSourceOverride = null,
  pourFillOverride = null,
  sealProgress = null,
  sealPending = false,
  colorSymbolsEnabled,
  compact = false,
  sizeClassName,
  interactive = true,
  onSelect,
  buttonRef,
}) => {
  const uid = useId().replace(/:/g, '');
  const bottleSeed = hashString(bottle.id);

  const seal = sealProgress != null ? evaluateSealTimeline(sealProgress) : null;
  const complete =
    isBottleComplete(bottle) &&
    !pourFillOverride &&
    !pourSourceOverride &&
    !sealPending &&
    seal === null;
  const isCrate = bottle.obstacle.type === 'crate';
  const isCurtain = bottle.obstacle.type === 'curtain';
  const isCork = bottle.obstacle.type === 'cork';

  const outerClipId = `outer-clip-${uid}`;
  const innerClipId = `inner-clip-${uid}`;
  const shadowBlurId = `shadow-blur-${uid}`;
  const softBlurId = `soft-blur-${uid}`;
  const glowBlurId = `glow-blur-${uid}`;
  const ribbonGlowId = `ribbon-glow-${uid}`;
  const glassBodyGradId = `glass-body-${uid}`;
  const wallGradId = `wall-grad-${uid}`;
  const lipBodyGradId = `lip-body-${uid}`;
  const lipTopGradId = `lip-top-${uid}`;
  const leftSheenId = `left-sheen-${uid}`;
  const rightSheenId = `right-sheen-${uid}`;
  const domeSheenId = `dome-sheen-${uid}`;
  const corkGradId = `cork-grad-${uid}`;
  const sheenSweepGradId = `sheen-sweep-${uid}`;

  // Bottom & top visible liquid colors drive optical glass caustics and subtle glass wall color bleed
  const activeLayers = pourSourceOverride ? pourSourceOverride.layersBefore : bottle.layers;
  const bottomVisibleLayer = activeLayers.length > 0 && !activeLayers[0].hidden ? activeLayers[0] : null;
  const bottomPal = bottomVisibleLayer ? LIQUID_3D_PALETTES[bottomVisibleLayer.color] : null;

  let transformStyle = 'translateY(0px) scale(1)';
  let isFlying = false;
  if (pourSourceOverride) {
    isFlying = true;
    transformStyle = `translate(${pourSourceOverride.flyX.toFixed(2)}px, ${pourSourceOverride.flyY.toFixed(
      2
    )}px) rotate(${pourSourceOverride.tiltDeg.toFixed(2)}deg)`;
  } else if (selected) {
    transformStyle = 'translateY(-12px) scale(1.04)';
  }

  const label = isCrate
    ? `Bottle ${bottle.id}: Locked crate (${bottle.obstacle.type === 'crate' ? bottle.obstacle.lockColor : ''})`
    : isCurtain
    ? `Bottle ${bottle.id}: Curtain (${bottle.obstacle.type === 'curtain' ? bottle.obstacle.unlockColor : ''})`
    : isCork
    ? `Bottle ${bottle.id}: Corked (${bottle.layers.length} of ${BOTTLE_CAPACITY})`
    : complete
    ? `Bottle ${bottle.id}: Complete (${bottle.layers[0]?.color})`
    : `Bottle ${bottle.id}: ${bottle.layers.length} of ${BOTTLE_CAPACITY} layers`;

  const svgSizeClass =
    sizeClassName ??
    (compact
      ? 'w-[50px] h-[114px] overflow-visible'
      : 'w-[58px] h-[132px] overflow-visible');

  // Helper to render suspended glowing stardust + micro-bubbles inside a liquid slab
  const renderPotionMotes = (
    layerIndex: number,
    yTop: number,
    yBottom: number,
    sparkleColor: string,
    keyPrefix: string
  ) => {
    const slabH = yBottom - yTop;
    if (slabH < 8) return null;
    const preset = LAYER_MOTE_PRESETS[(bottleSeed + layerIndex) % LAYER_MOTE_PRESETS.length];
    return (
      <g key={keyPrefix}>
        {preset.map((mote, mIdx) => {
          const cy = yTop + 3 + mote.yFrac * Math.max(4, slabH - 5.5);
          if (mote.kind === 'star') {
            return (
              <path
                key={`${keyPrefix}-star-${mIdx}`}
                d={fourPointStarPath(mote.x, cy, mote.r)}
                fill="#FFFFFF"
                opacity="0.92"
                className="animate-potion-shimmer"
                style={{ animationDelay: `${mote.delaySec.toFixed(2)}s` }}
              />
            );
          }
          if (mote.kind === 'bubble') {
            return (
              <g
                key={`${keyPrefix}-bub-${mIdx}`}
                className="animate-potion-bubble"
                style={{ animationDelay: `${mote.delaySec.toFixed(2)}s` }}
              >
                <circle
                  cx={mote.x}
                  cy={cy}
                  r={mote.r}
                  fill="rgba(255, 255, 255, 0.16)"
                  stroke={sparkleColor}
                  strokeWidth="0.55"
                  opacity="0.82"
                />
                <circle
                  cx={mote.x - mote.r * 0.32}
                  cy={cy - mote.r * 0.32}
                  r={Math.max(0.32, mote.r * 0.28)}
                  fill="#FFFFFF"
                  opacity="0.95"
                />
              </g>
            );
          }
          return (
            <circle
              key={`${keyPrefix}-sp-${mIdx}`}
              cx={mote.x}
              cy={cy}
              r={mote.r}
              fill={mIdx % 2 === 0 ? '#FFFFFF' : sparkleColor}
              opacity={mote.r <= 0.6 ? '0.68' : '0.84'}
            />
          );
        })}
      </g>
    );
  };

  // Compute rendered liquid slabs
  const renderLiquids = () => {
    if (pourSourceOverride) {
      const { layersBefore, pouredCount, tiltDeg, drainRatio } = pourSourceOverride;
      const t = Math.min(1, Math.abs(tiltDeg) / 78);
      const unpouredCount = Math.max(0, layersBefore.length - pouredCount);
      const pouredFraction = Math.max(0, 1 - drainRatio);
      const remainingFloat = unpouredCount + pouredCount * pouredFraction;

      if (remainingFloat <= 0.005) {
        return null;
      }

      const vBottom = BASE_BOTTOM_Y * (1 - t) + 122.5 * t;
      const vTopUpright = BASE_BOTTOM_Y - SLOT_HEIGHT * remainingFloat;
      const pouringWeight = Math.min(1, pouredFraction / 0.16);
      const pouringSurface = 75.5 + 3.5 * drainRatio;
      const restingTiltedSurface = 122.5 - 11.5 * unpouredCount;
      const vTopTilted =
        pouringSurface * pouringWeight +
        restingTiltedSurface * (1 - pouringWeight);
      const vTop = vTopUpright * (1 - t) + vTopTilted * t;
      const totalH = Math.max(0, vBottom - vTop);

      const weights = layersBefore.map((_, idx) => (idx < unpouredCount ? 1 : pouredFraction));
      const weightSum = weights.reduce((acc, w) => acc + w, 0);
      if (weightSum <= 0.001) return null;

      let cursorBottom = vBottom;
      const bands: RenderedSlab[] = [];
      layersBefore.forEach((layer, index) => {
        const w = weights[index];
        if (w <= 0.002) return;
        const h = totalH * (w / weightSum);
        const yTop = cursorBottom - h;
        bands.push({ layer, yTop, yBottom: cursorBottom, index });
        cursorBottom = yTop;
      });

      const tiltRuns = groupOpticalRuns(bands);

      return (
        <g transform={`rotate(${(-tiltDeg).toFixed(2)}, 36, 88)`}>
          {tiltRuns.map((run, runIdx) => {
            const runH = Math.max(2, run.yBottom - run.yTop);
            const pal = LIQUID_3D_PALETTES[run.color];
            const isTopRun = runIdx === tiltRuns.length - 1;
            if (run.hidden) {
              return (
                <rect
                  key={`${bottle.id}-tilt-run-${run.startIndex}`}
                  x="-110"
                  y={run.yTop}
                  width="292"
                  height={runH + 2}
                  fill="#0B0E1D"
                />
              );
            }
            return (
              <g key={`${bottle.id}-tilt-run-${run.startIndex}`}>
                <rect
                  x="-110"
                  y={run.yTop}
                  width="292"
                  height={runH + 2.5}
                  fill={`url(#liq-${run.color}-${uid})`}
                />
                {/* Unified bioluminescent inner heart spanning continuous same-color column */}
                <ellipse
                  cx="36"
                  cy={run.yTop + runH * 0.56}
                  rx="26"
                  ry={Math.max(8, runH * 0.54)}
                  fill={`url(#liq-core-${run.color}-${uid})`}
                  opacity="0.86"
                />
                {run.slabs.map((slab) =>
                  renderPotionMotes(
                    slab.index,
                    slab.yTop,
                    slab.yBottom,
                    pal.sparkle,
                    `${bottle.id}-tilt-${slab.index}`
                  )
                )}
                {!isTopRun && (
                  <path
                    d={`M -110 ${run.yTop} Q 36 ${run.yTop + 2.4} 182 ${run.yTop}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.36)"
                    strokeWidth="1"
                  />
                )}
                {isTopRun && (
                  <>
                    <ellipse
                      cx="36"
                      cy={run.yTop + 0.5}
                      rx="72"
                      ry={4.6 + 1.4 * t}
                      fill={`url(#liq-meniscus-${run.color}-${uid})`}
                      opacity="0.98"
                    />
                    <ellipse
                      cx="36"
                      cy={run.yTop + 0.3}
                      rx="66"
                      ry={1.5 + 0.4 * t}
                      fill="#FFFFFF"
                      opacity="0.58"
                    />
                  </>
                )}
              </g>
            );
          })}
        </g>
      );
    }

    // Upright bottle (stationary OR smoothly rising target)
    const layers = bottle.layers;
    if (layers.length === 0) return null;

    const beforeCount = pourFillOverride ? pourFillOverride.beforeCount : layers.length;
    const fillRatio = pourFillOverride ? pourFillOverride.fillRatio : 1;
    const targetTopY = BASE_BOTTOM_Y - layers.length * SLOT_HEIGHT;
    const prevTopY = BASE_BOTTOM_Y - beforeCount * SLOT_HEIGHT;
    const currentOverallTopY = prevTopY - (prevTopY - targetTopY) * fillRatio;

    const renderedLayers: RenderedSlab[] = [];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (i < beforeCount) {
        const yTop = SLOT_HEIGHTS[i] ?? 51.5;
        const yBottom = i === 0 ? BASE_BOTTOM_Y : yTop + SLOT_HEIGHT + 3.5;
        renderedLayers.push({ layer, yTop, yBottom, index: i });
      } else {
        const addedCount = layers.length - beforeCount;
        const addedIdx = i - beforeCount;
        const span = Math.max(0, prevTopY - currentOverallTopY);
        const stepH = addedCount > 0 ? span / addedCount : 0;
        if (stepH <= 0.5) continue;
        const yBottom = prevTopY - addedIdx * stepH + 3.5;
        const yTop = prevTopY - (addedIdx + 1) * stepH;
        renderedLayers.push({ layer, yTop, yBottom, index: i });
      }
    }

    const opticalRuns = groupOpticalRuns(renderedLayers);
    const topRendered = renderedLayers[renderedLayers.length - 1];

    return (
      <>
        {opticalRuns.map((run, runIdx) => {
          const isTopRun = runIdx === opticalRuns.length - 1;
          const curveDip = 3.0;
          const runH = Math.max(2, run.yBottom - run.yTop);

          if (run.hidden) {
            return (
              <g key={`${bottle.id}-run-${run.startIndex}`}>
                <path
                  d={`M 10 ${run.yTop} Q 36 ${run.yTop + curveDip} 62 ${run.yTop} L 62 ${run.yBottom} L 10 ${run.yBottom} Z`}
                  fill="#0B0E1A"
                  opacity="0.94"
                />
                <rect x="46" y={run.yTop} width="6.5" height={runH} fill="rgba(180, 218, 255, 0.1)" />
                {run.slabs.map((slab) => (
                  <text
                    key={`${bottle.id}-q-${slab.index}`}
                    x="36"
                    y={slab.yTop + 18.5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="900"
                    fill="rgba(175, 192, 224, 0.72)"
                  >
                    ?
                  </text>
                ))}
              </g>
            );
          }

          const meta = POTION_COLORS[run.color];
          const pal = LIQUID_3D_PALETTES[run.color];

          return (
            <g key={`${bottle.id}-run-${run.startIndex}`}>
              {/* 1. Unified Luminous 3D Cylindrical Jewel Liquid Column */}
              <path
                d={`M 10 ${run.yTop} Q 36 ${run.yTop + curveDip} 62 ${run.yTop} L 62 ${run.yBottom} Q 36 ${
                  run.yBottom + curveDip
                } 10 ${run.yBottom} Z`}
                fill={`url(#liq-${run.color}-${uid})`}
              />

              {/* 2. Single Cohesive Bioluminescent Subsurface Heart across the entire same-color column */}
              <ellipse
                cx="35"
                cy={run.yTop + runH * 0.56}
                rx="23.5"
                ry={Math.max(9.5, runH * 0.56)}
                fill={`url(#liq-core-${run.color}-${uid})`}
                opacity="0.9"
              />

              {/* 3. Sweeping Internal Refracted Light Veil across the column */}
              <path
                d={`M 14 ${run.yTop + runH * 0.14} Q 34 ${run.yTop + runH * 0.42} 57 ${
                  run.yTop + runH * 0.78
                } L 57 ${run.yTop + runH * 0.94} Q 34 ${run.yTop + runH * 0.58} 14 ${
                  run.yTop + runH * 0.3
                } Z`}
                fill={pal.innerGlow}
                opacity="0.16"
              />

              {/* 4. Luminous Caustic Bounce along Bottom Floor */}
              {run.startIndex === 0 && (
                <>
                  <ellipse
                    cx="36"
                    cy={run.yBottom - 2.5}
                    rx="19.5"
                    ry="4.4"
                    fill={pal.innerGlow}
                    opacity="0.5"
                    filter={`url(#${softBlurId})`}
                  />
                  <path
                    d={`M 16 ${run.yBottom - 1.5} Q 36 ${run.yBottom + 2.4} 56 ${run.yBottom - 1.5}`}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.25"
                    opacity="0.56"
                  />
                </>
              )}

              {/* 5. Suspended Alchemical Stardust, Galaxy Pinpricks & Rising Micro-Bubbles */}
              {run.slabs.map((slab) =>
                renderPotionMotes(
                  slab.index,
                  slab.yTop,
                  slab.yBottom,
                  pal.sparkle,
                  `${bottle.id}-up-${slab.index}`
                )
              )}

              {/* 6. Crisp Optical Separation Seam between Distinct Colors */}
              {!isTopRun && (
                <>
                  <path
                    d={`M 13 ${run.yTop + 1.1} Q 36 ${run.yTop + curveDip + 1.1} 59 ${run.yTop + 1.1}`}
                    fill="none"
                    stroke="rgba(12, 10, 32, 0.25)"
                    strokeWidth="1.2"
                  />
                  <path
                    d={`M 13 ${run.yTop} Q 36 ${run.yTop + curveDip} 59 ${run.yTop}`}
                    fill="none"
                    stroke={pal.meniscusRim}
                    strokeWidth="1.05"
                    opacity="0.64"
                  />
                </>
              )}

              {/* 7. Radiant Translucent Top Meniscus + Upward Ethereal Vapor Glow */}
              {isTopRun && (
                <>
                  {/* Soft luminous mist radiating just above the liquid surface */}
                  <ellipse
                    cx="36"
                    cy={run.yTop - 1.8}
                    rx="21"
                    ry="6.5"
                    fill={pal.innerGlow}
                    opacity="0.36"
                    filter={`url(#${glowBlurId})`}
                  />
                  {/* Glowing translucent elliptical liquid surface */}
                  <ellipse
                    cx="36"
                    cy={run.yTop + 0.8}
                    rx="22.5"
                    ry="4.9"
                    fill={`url(#liq-meniscus-${run.color}-${uid})`}
                    opacity="0.98"
                  />
                  {/* Razor-bright front surface-tension crescent */}
                  <path
                    d={`M 16.5 ${run.yTop + 1.6} Q 36 ${run.yTop + 6.1} 55.5 ${run.yTop + 1.6}`}
                    fill="none"
                    stroke={pal.meniscusRim}
                    strokeWidth="1.65"
                    strokeLinecap="round"
                    opacity="0.96"
                  />
                  {/* Specular white catchlight oval on surface */}
                  <ellipse
                    cx="29"
                    cy={run.yTop + 0.1}
                    rx="11.5"
                    ry="1.85"
                    fill="#FFFFFF"
                    opacity="0.7"
                  />
                </>
              )}

              {colorSymbolsEnabled &&
                run.slabs.map((slab) => (
                  <text
                    key={`${bottle.id}-sym-${slab.index}`}
                    x="36"
                    y={slab.yTop + 17.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="rgba(255, 255, 255, 0.96)"
                  >
                    {meta.symbol}
                  </text>
                ))}
            </g>
          );
        })}

        {/* Radiant Meniscus Ripple Ring while Stream Hits Liquid */}
        {pourFillOverride?.isStreaming && topRendered && (
          <ellipse
            cx="36"
            cy={topRendered.yTop + 0.8}
            rx="11"
            ry="2.7"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.45"
            opacity="0.82"
          />
        )}
      </>
    );
  };

  const shadowOpacity = pourSourceOverride
    ? Math.max(0, 1 - Math.abs(pourSourceOverride.tiltDeg) / 22)
    : seal
    ? seal.shadowOpacity
    : 1;

  const sealRibbonAccent = bottomPal ? bottomPal.innerGlow : '#FFE694';
  const sealRibbonSecondary = bottomPal ? bottomPal.caustic : '#FF96C8';

  const renderCorkArtwork = () => (
    <>
      <path
        d="M 26 12.5 L 46 12.5 L 47.5 0.5 C 47.5 -1.5 44 -2.5 36 -2.5 C 28 -2.5 24.5 -1.5 24.5 0.5 Z"
        fill={`url(#${corkGradId})`}
        stroke="#592803"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Natural cork pores & warm top bevel highlight */}
      <ellipse cx="36" cy="-0.4" rx="9.8" ry="1.8" fill="#F6C378" opacity="0.62" />
      <circle cx="29.5" cy="3.5" r="0.7" fill="#6E350B" opacity="0.55" />
      <circle cx="42.2" cy="4.8" r="0.85" fill="#6E350B" opacity="0.5" />
      <circle cx="31.5" cy="9.2" r="0.65" fill="#6E350B" opacity="0.45" />
      <circle cx="40.5" cy="9.6" r="0.6" fill="#6E350B" opacity="0.45" />
      <line
        x1="28.6"
        y1="2"
        x2="29.8"
        y2="10.2"
        stroke="#FCE0A6"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.78"
      />
      <circle cx="36" cy="7" r="4.9" fill="#7D2AE8" stroke="#FFE875" strokeWidth="1.6" />
      <path
        d="M 36 4.1 L 36.9 6.0 L 39.0 6.3 L 37.4 7.7 L 37.9 9.7 L 36 8.6 L 34.1 9.7 L 34.6 7.7 L 33.0 6.3 L 35.1 6.0 Z"
        fill="#FFE875"
      />
    </>
  );

  const bottleBodyTransform = seal
    ? `translate(0, ${seal.levitateY.toFixed(2)}) translate(36, 154) scale(${seal.bottleScaleX.toFixed(
        4
      )}, ${seal.bottleScaleY.toFixed(4)}) translate(-36, -154)`
    : undefined;

  const svgGraphic = (
    <svg viewBox="0 0 72 164" className={svgSizeClass}>
      <defs>
        <clipPath id={outerClipId}>
          <path d={OUTER_PATH} />
        </clipPath>
        <clipPath id={innerClipId}>
          <path d={INNER_CLIP_PATH} />
        </clipPath>

        <filter id={shadowBlurId} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id={softBlurId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <filter id={glowBlurId} filterUnits="userSpaceOnUse" x="-48" y="-48" width="168" height="240">
          <feGaussianBlur stdDeviation="2.1" />
        </filter>
        <filter id={ribbonGlowId} filterUnits="userSpaceOnUse" x="-48" y="-48" width="168" height="240">
          <feGaussianBlur stdDeviation="1.9" />
        </filter>
        <linearGradient id={sheenSweepGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255, 252, 232, 0)" />
          <stop offset="32%" stopColor="rgba(255, 244, 198, 0.35)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.92)" />
          <stop offset="68%" stopColor="rgba(255, 236, 180, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 252, 232, 0)" />
        </linearGradient>

        {/* Pixar Pure Blown-Crystal Glass Chamber (colorless transparent center, luminous ice-pearl edges) */}
        <linearGradient id={glassBodyGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(210, 238, 255, 0.28)" />
          <stop offset="16%" stopColor="rgba(235, 248, 255, 0.08)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.01)" />
          <stop offset="84%" stopColor="rgba(235, 248, 255, 0.08)" />
          <stop offset="100%" stopColor="rgba(205, 235, 255, 0.28)" />
        </linearGradient>

        {/* Thick Clear Crystal Glass Wall Refraction */}
        <linearGradient id={wallGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(182, 226, 255, 0.72)" />
          <stop offset="22%" stopColor="rgba(255, 255, 255, 0.88)" />
          <stop offset="55%" stopColor="rgba(218, 242, 255, 0.46)" />
          <stop offset="82%" stopColor="rgba(240, 250, 255, 0.78)" />
          <stop offset="100%" stopColor="rgba(175, 222, 255, 0.72)" />
        </linearGradient>

        {/* Translucent Blown-Glass Rolled Collar (Lower Rim Wall) */}
        <linearGradient id={lipBodyGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(148, 204, 248, 0.82)" />
          <stop offset="22%" stopColor="rgba(244, 252, 255, 0.94)" />
          <stop offset="52%" stopColor="rgba(164, 214, 252, 0.72)" />
          <stop offset="82%" stopColor="rgba(126, 184, 238, 0.78)" />
          <stop offset="100%" stopColor="rgba(220, 244, 255, 0.88)" />
        </linearGradient>

        {/* Translucent Blown-Glass Rolled Collar (Top Elliptical Face) */}
        <linearGradient id={lipTopGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
          <stop offset="48%" stopColor="rgba(195, 232, 255, 0.84)" />
          <stop offset="100%" stopColor="rgba(136, 194, 246, 0.82)" />
        </linearGradient>

        {/* Left Soft-Box Vertical Specular Ribbon (over liquid & glass) */}
        <linearGradient id={leftSheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.68)" />
          <stop offset="35%" stopColor="rgba(255, 255, 255, 0.34)" />
          <stop offset="80%" stopColor="rgba(255, 255, 255, 0.18)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
        </linearGradient>

        {/* Right Subtle Rim Gloss Specular Strip */}
        <linearGradient id={rightSheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.36)" />
          <stop offset="55%" stopColor="rgba(235, 248, 255, 0.16)" />
          <stop offset="100%" stopColor="rgba(235, 248, 255, 0.06)" />
        </linearGradient>

        {/* Upper Curved Shoulder Crystal Dome Reflection */}
        <linearGradient id={domeSheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.62)" />
          <stop offset="55%" stopColor="rgba(235, 248, 255, 0.18)" />
          <stop offset="100%" stopColor="rgba(235, 248, 255, 0.0)" />
        </linearGradient>

        {/* Natural Warm Tactile Cork Gradient (matching reference fox's cork) */}
        <linearGradient id={corkGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B86B2B" />
          <stop offset="28%" stopColor="#E9A860" />
          <stop offset="62%" stopColor="#CE823B" />
          <stop offset="100%" stopColor="#8F4C18" />
        </linearGradient>

        {/* Bioluminescent Alchemical Liquid Gradients (Body + Radial Inner Core + Glowing Meniscus) */}
        {ALL_COLORS.map((c) => {
          const p = LIQUID_3D_PALETTES[c];
          return (
            <React.Fragment key={c}>
              <linearGradient id={`liq-${c}-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={p.edge} />
                <stop offset="18%" stopColor={p.highlight} />
                <stop offset="48%" stopColor={p.core} />
                <stop offset="84%" stopColor={p.shadow} />
                <stop offset="100%" stopColor={p.bounce} />
              </linearGradient>
              <radialGradient id={`liq-core-${c}-${uid}`} cx="48%" cy="54%" r="58%">
                <stop offset="0%" stopColor={p.innerGlow} stopOpacity="0.92" />
                <stop offset="45%" stopColor={p.highlight} stopOpacity="0.45" />
                <stop offset="100%" stopColor={p.core} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`liq-meniscus-${c}-${uid}`} cx="44%" cy="46%" r="60%">
                <stop offset="0%" stopColor={p.meniscusRim} />
                <stop offset="55%" stopColor={p.meniscus} />
                <stop offset="100%" stopColor={p.highlight} />
              </radialGradient>
            </React.Fragment>
          );
        })}
      </defs>

      {/* Grounded Two-Stage 3D Contact Shadow + Colored Potion Caustic Light on Oak Surface */}
      {shadowOpacity > 0.02 && (
        <g
          opacity={shadowOpacity}
          transform={
            seal
              ? `translate(36, 156.5) scale(${seal.shadowScale.toFixed(3)}) translate(-36, -156.5)`
              : undefined
          }
        >
          <ellipse
            cx="36"
            cy="157.5"
            rx="23.5"
            ry="4.5"
            fill="rgba(34, 12, 2, 0.54)"
            filter={`url(#${shadowBlurId})`}
          />
          <ellipse
            cx="36"
            cy="156.2"
            rx="19"
            ry="2.8"
            fill="rgba(22, 8, 1, 0.60)"
            filter={`url(#${softBlurId})`}
          />
          {/* Subtle colored potion caustic light spilling onto wood right beneath the crystal base */}
          {bottomPal && (
            <ellipse
              cx="36"
              cy="156.8"
              rx="15.5"
              ry="2.6"
              fill={bottomPal.caustic}
              opacity="0.46"
              filter={`url(#${glowBlurId})`}
            />
          )}
        </g>
      )}

      {/* PLAN B BEAT 1: Rotating Golden Alchemy Magic Circle Flat on the Oak Shelf */}
      {seal && seal.circleOpacity > 0.01 && (
        <g opacity={seal.circleOpacity}>
          {/* Soft warm golden radiance pool */}
          <ellipse
            cx="36"
            cy="156"
            rx={(34 * seal.circleScale).toFixed(2)}
            ry={(9.2 * seal.circleScale).toFixed(2)}
            fill="#FFE280"
            opacity="0.32"
            filter={`url(#${glowBlurId})`}
          />
          {/* Foreshortened perspective plane resting on the shelf */}
          <g
            transform={`translate(36, 156) scale(${seal.circleScale.toFixed(3)}, ${(
              seal.circleScale * 0.27
            ).toFixed(3)}) rotate(${seal.circleRotationDeg.toFixed(1)})`}
          >
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="none"
              stroke="#FFE99A"
              strokeWidth="2.4"
              opacity="0.95"
            />
            <circle
              cx="0"
              cy="0"
              r="28.5"
              fill="none"
              stroke={sealRibbonAccent}
              strokeWidth="1.35"
              strokeDasharray="4.5 3.5"
              opacity="0.9"
            />
            {/* Inscribed 6-point alchemist resonance star */}
            <polygon
              points="0,-28 24.2,14 -24.2,14"
              fill="none"
              stroke="#FFF4C2"
              strokeWidth="1.25"
              opacity="0.72"
            />
            <polygon
              points="0,28 24.2,-14 -24.2,-14"
              fill="none"
              stroke="#FFF4C2"
              strokeWidth="1.25"
              opacity="0.72"
            />
            {/* Outer rune accent dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <circle
                  key={`rune-${deg}`}
                  cx={(Math.cos(rad) * 31.2).toFixed(2)}
                  cy={(Math.sin(rad) * 31.2).toFixed(2)}
                  r="1.9"
                  fill="#FFFFFF"
                />
              );
            })}
          </g>
        </g>
      )}

      {/* LEVITATION & BOTTLE BODY GROUP (floats weightlessly during Plan B Beats 2-3) */}
      <g transform={bottleBodyTransform}>
        {/* PLAN B BEAT 2 (BACK 3D OCCLUSION LAYER): Helical Ribbons & Sparkles Passing BEHIND Bottle */}
        {seal && seal.backRibbons.length > 0 && (
          <g>
            {seal.backRibbons.map((seg, i) => (
              <React.Fragment key={`back-rib-${i}`}>
                <path
                  d={seg.d}
                  fill="none"
                  stroke={seg.strand === 0 ? '#FFD466' : sealRibbonSecondary}
                  strokeWidth={(seg.strokeWidth * 1.9).toFixed(2)}
                  strokeLinecap="round"
                  opacity={(seg.opacity * 0.55).toFixed(3)}
                  filter={`url(#${ribbonGlowId})`}
                />
                <path
                  d={seg.d}
                  fill="none"
                  stroke={seg.strand === 0 ? '#FFF2B8' : sealRibbonAccent}
                  strokeWidth={seg.strokeWidth.toFixed(2)}
                  strokeLinecap="round"
                  opacity={seg.opacity.toFixed(3)}
                />
                <path
                  d={seg.d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={(seg.strokeWidth * 0.36).toFixed(2)}
                  strokeLinecap="round"
                  opacity={(seg.opacity * 0.58).toFixed(3)}
                />
              </React.Fragment>
            ))}
            {seal.backSparkles.map((sp, i) =>
              sp.kind === 'star' ? (
                <path
                  key={`back-sp-${i}`}
                  d={fourPointStarPath(sp.x, sp.y, sp.r)}
                  fill="#FFF8D6"
                  opacity={sp.opacity.toFixed(3)}
                />
              ) : (
                <circle
                  key={`back-sp-${i}`}
                  cx={sp.x.toFixed(2)}
                  cy={sp.y.toFixed(2)}
                  r={sp.r.toFixed(2)}
                  fill={sp.strand === 0 ? '#FFE694' : sealRibbonAccent}
                  opacity={sp.opacity.toFixed(3)}
                />
              )
            )}
          </g>
        )}

      {/* Subtle Ambient Bioluminescent Aura when Bottle Contains Glowing Potion */}
      {bottomPal && !isCrate && !isCurtain && (
        <path
          d={OUTER_PATH}
          fill="none"
          stroke={bottomPal.caustic}
          strokeWidth={seal ? '4.2' : '3.2'}
          opacity={seal ? '0.52' : selected || complete ? '0.42' : '0.22'}
          filter={`url(#${glowBlurId})`}
        />
      )}

      {/* Selected / Complete Golden Focus Halo */}
      {(selected || complete || Boolean(seal)) && !pourSourceOverride && (
        <path
          d={OUTER_PATH}
          fill="none"
          stroke={selected ? '#FFE066' : '#FFE880'}
          strokeWidth={selected ? '5.0' : seal ? '4.6' : '4.0'}
          opacity={selected ? '0.88' : seal ? '0.78' : '0.68'}
          filter={`url(#${shadowBlurId})`}
        />
      )}

      {/* LAYER 1: Crystal-Clear Glass Interior + Thick Optical Glass Wall & Base Lens */}
      <g clipPath={`url(#${outerClipId})`}>
        <path d={OUTER_PATH} fill={`url(#${glassBodyGradId})`} />
        <path d={OUTER_PATH} fill="none" stroke={`url(#${wallGradId})`} strokeWidth="5.4" />
        {/* Soft neck refraction band under rolled crystal collar */}
        <rect
          x="24"
          y="17"
          width="24"
          height="4.8"
          fill="rgba(38, 72, 128, 0.24)"
          filter={`url(#${softBlurId})`}
        />
        {/* Thick glass base prism cushion picking up bottom potion color */}
        <ellipse
          cx="36"
          cy="150.2"
          rx="22.5"
          ry="5.2"
          fill={bottomPal ? bottomPal.caustic : 'rgba(205, 236, 255, 0.22)'}
          opacity={bottomPal ? '0.28' : '0.22'}
        />
        <path
          d="M 13.5 147.5 Q 36 141.8 58.5 147.5"
          fill="none"
          stroke="rgba(225, 246, 255, 0.52)"
          strokeWidth="1.1"
        />
      </g>

      {/* LAYER 2: Gravity-Leveled or Upright Bioluminescent Liquids + Plan B Inner S-Swirl & Bubbles */}
      <g clipPath={`url(#${innerClipId})`}>
        {renderLiquids()}

        {/* PLAN B BEAT 1-2: Luminous S-Curve Stardust Swirl & Effervescent Rising Bubbles inside Liquid */}
        {seal && (seal.swirlOpacity > 0.02 || seal.innerBubbles.length > 0) && (
          <g>
            {seal.swirlOpacity > 0.02 && (
              <g
                opacity={seal.swirlOpacity.toFixed(3)}
                transform={`translate(0, ${seal.swirlOffsetY.toFixed(2)})`}
              >
                <path
                  d="M 33 158 C 18 142 52 126 36 108 C 20 90 52 74 35 56"
                  fill="none"
                  stroke="#FFE99E"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  opacity="0.45"
                  filter={`url(#${glowBlurId})`}
                />
                <path
                  d="M 33 158 C 18 142 52 126 36 108 C 20 90 52 74 35 56"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeDasharray="3.5 4.2"
                  opacity="0.92"
                />
                {[
                  { x: 28, y: 140, r: 2.1 },
                  { x: 42, y: 122, r: 1.7 },
                  { x: 31, y: 102, r: 2.3 },
                  { x: 43, y: 84, r: 1.8 },
                  { x: 34, y: 66, r: 2.0 },
                ].map((st, idx) => (
                  <path
                    key={`swirl-star-${idx}`}
                    d={fourPointStarPath(st.x, st.y, st.r)}
                    fill="#FFFDF0"
                    opacity="0.95"
                  />
                ))}
              </g>
            )}
            {seal.innerBubbles.map((b, idx) => (
              <g key={`seal-bub-${idx}`} opacity={b.opacity.toFixed(3)}>
                <circle
                  cx={b.x.toFixed(2)}
                  cy={b.y.toFixed(2)}
                  r={b.r.toFixed(2)}
                  fill="rgba(255, 255, 255, 0.24)"
                  stroke="#FFF7D6"
                  strokeWidth="0.7"
                />
                <circle
                  cx={(b.x - b.r * 0.32).toFixed(2)}
                  cy={(b.y - b.r * 0.32).toFixed(2)}
                  r={Math.max(0.4, b.r * 0.3).toFixed(2)}
                  fill="#FFFFFF"
                />
              </g>
            ))}
          </g>
        )}
      </g>

      {/* LAYER 3: Pixar Crystal Glass Specular Reflections, Fresnel Rim & Optical Base Lens */}
      {/* Inner cavity fine refractive edge */}
      <path d={INNER_CLIP_PATH} fill="none" stroke="rgba(235, 248, 255, 0.42)" strokeWidth="0.85" />

      {/* Upper curved shoulder dome sheen */}
      <path
        d="M 14 45 C 14 38 25 36.2 36 36.2 C 47 36.2 58 38 58 45 L 58 51 C 51 46.8 43 45.2 36 45.2 C 29 45.2 21 46.8 14 51 Z"
        fill={`url(#${domeSheenId})`}
      />

      {/* Crisp pure-white studio crescent catchlight on left shoulder (signature Pixar glass cue) */}
      <path
        d="M 13.4 45 C 14.2 35 21.2 30.2 27.6 27.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.3"
        strokeLinecap="round"
        opacity="0.92"
        filter={`url(#${softBlurId})`}
      />
      <path
        d="M 13.6 44.5 C 14.4 35.2 21.2 30.5 27.4 27.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.98"
      />

      {/* Left vertical glossy soft-box highlight strip */}
      <rect x="15.2" y="48" width="4.4" height="92" rx="2.2" fill={`url(#${leftSheenId})`} />
      {/* Secondary crisp specular pin-bar on upper-left cheek */}
      <rect x="16.2" y="51" width="1.8" height="24" rx="0.9" fill="#FFFFFF" opacity="0.72" />

      {/* Right-third subtle cylindrical specular reflection */}
      <rect x="49.5" y="47" width="4.8" height="96" rx="2.4" fill={`url(#${rightSheenId})`} />

      {/* Luminous Fresnel Crystal Left & Right Outer Edge Glints */}
      <path
        d="M 11.6 45 L 11.6 147 C 11.6 151.6 15.6 154.2 21.8 155.3"
        fill="none"
        stroke="rgba(244, 252, 255, 0.92)"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M 60.4 45 L 60.4 147 C 60.4 151.6 56.4 154.2 50.2 155.3"
        fill="none"
        stroke="rgba(222, 245, 255, 0.84)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Weighted Thick Crystal Base Optical Lens Rim (blending liquid caustic + pure glass white) */}
      <path
        d="M 12.6 149.4 Q 36 157.4 59.4 149.4"
        fill="none"
        stroke={bottomPal ? bottomPal.meniscusRim : 'rgba(232, 247, 255, 0.96)'}
        strokeWidth="2.3"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M 17.5 153.2 Q 36 158.1 54.5 153.2"
        fill="none"
        stroke={bottomPal ? bottomPal.caustic : 'rgba(182, 228, 255, 0.82)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.82"
      />

      {/* PLAN B BEAT 4: Diagonal Iridescent Crystal Sheen Sweep across Sealed Glass */}
      {seal && seal.sheenOpacity > 0.02 && (
        <g clipPath={`url(#${outerClipId})`} opacity={seal.sheenOpacity.toFixed(3)}>
          <g
            transform={`translate(${(-58 + seal.sheenProgress * 116).toFixed(2)}, ${(
              96 -
              seal.sheenProgress * 165
            ).toFixed(2)}) rotate(-32, 36, 92)`}
          >
            <rect
              x="-24"
              y="72"
              width="124"
              height="24"
              fill={`url(#${sheenSweepGradId})`}
            />
            <rect
              x="-24"
              y="81"
              width="124"
              height="4.5"
              fill="#FFFFFF"
              opacity="0.72"
            />
          </g>
        </g>
      )}

      {/* Refined Crystal Outer Contour (delicate refractive edge, never harsh cartoon ink) */}
      <path d={OUTER_PATH} fill="none" stroke="rgba(22, 46, 90, 0.38)" strokeWidth="1.15" />

      {/* LAYER 4: Translucent Sculpted 3D Blown-Crystal Glass Collar Lip */}
      <g>
        <path
          d="M 21 11 L 21 14.5 C 21 18.6 51 18.6 51 14.5 L 51 11 Z"
          fill={`url(#${lipBodyGradId})`}
          stroke="rgba(28, 56, 108, 0.42)"
          strokeWidth="1.05"
          strokeLinejoin="round"
        />
        {/* Bright glossy front-left catchlight on rolled glass lip */}
        <path
          d="M 23 14.8 Q 29 17.4 37.5 17.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.94"
        />
        <ellipse
          cx="36"
          cy="11.2"
          rx="15"
          ry="4.7"
          fill={`url(#${lipTopGradId})`}
          stroke="rgba(28, 56, 108, 0.42)"
          strokeWidth="1.05"
        />
        <path
          d="M 22.5 10.6 C 24 8.2 30 7.2 37.5 7.3"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.95"
        />
        {/* Translucent dark refractive mouth opening */}
        <ellipse cx="36" cy="11.0" rx="7.2" ry="2.0" fill="rgba(16, 32, 68, 0.68)" />
        <path
          d="M 29.4 11.4 Q 36 13.3 42.6 11.4"
          fill="none"
          stroke="rgba(232, 248, 255, 0.94)"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      </g>

      {/* PLAN B BEAT 2 (FRONT 3D OCCLUSION LAYER): Helical Silky Starlight Ribbons Weaving IN FRONT of Bottle */}
      {seal && seal.frontRibbons.length > 0 && (
        <g>
          {seal.frontRibbons.map((seg, i) => (
            <React.Fragment key={`front-rib-${i}`}>
              <path
                d={seg.d}
                fill="none"
                stroke={seg.strand === 0 ? '#FFD466' : sealRibbonSecondary}
                strokeWidth={(seg.strokeWidth * 2.15).toFixed(2)}
                strokeLinecap="round"
                opacity={(seg.opacity * 0.68).toFixed(3)}
                filter={`url(#${ribbonGlowId})`}
              />
              <path
                d={seg.d}
                fill="none"
                stroke={seg.strand === 0 ? '#FFF6C8' : sealRibbonAccent}
                strokeWidth={seg.strokeWidth.toFixed(2)}
                strokeLinecap="round"
                opacity={seg.opacity.toFixed(3)}
              />
              <path
                d={seg.d}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={(seg.strokeWidth * 0.42).toFixed(2)}
                strokeLinecap="round"
                opacity={(seg.opacity * 0.94).toFixed(3)}
              />
            </React.Fragment>
          ))}
          {seal.frontSparkles.map((sp, i) =>
            sp.kind === 'star' ? (
              <path
                key={`front-sp-${i}`}
                d={fourPointStarPath(sp.x, sp.y, sp.r)}
                fill="#FFFFFF"
                opacity={sp.opacity.toFixed(3)}
              />
            ) : (
              <circle
                key={`front-sp-${i}`}
                cx={sp.x.toFixed(2)}
                cy={sp.y.toFixed(2)}
                r={sp.r.toFixed(2)}
                fill={sp.strand === 0 ? '#FFF0AA' : sealRibbonAccent}
                opacity={sp.opacity.toFixed(3)}
              />
            )
          )}
        </g>
      )}

      {/* PLAN B BEAT 3: Glowing Fairy Mist Vortex + Magic Rune Halo Ring + Descending Spinning Cork */}
      {seal && (
        <g>
          {/* Swirling luminous fairy mist around the bottle mouth */}
          {seal.mistOpacity > 0.02 && (
            <g
              opacity={seal.mistOpacity.toFixed(3)}
              transform={`translate(36, 12) scale(${seal.mistScale.toFixed(3)}) translate(-36, -12)`}
            >
              <ellipse
                cx="36"
                cy="12"
                rx="22"
                ry="8.5"
                fill={sealRibbonAccent}
                opacity="0.34"
                filter={`url(#${glowBlurId})`}
              />
              <path
                d="M 16 14 C 19 4 53 4 56 14 C 52 22 20 22 16 14"
                fill="none"
                stroke="#FFF3C4"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.72"
                filter={`url(#${softBlurId})`}
              />
            </g>
          )}

          {/* Tilted Magical Rune Halo Ring encircling descending cork */}
          {seal.haloOpacity > 0.02 && (
            <g
              opacity={seal.haloOpacity.toFixed(3)}
              transform={`translate(36, ${(8 + seal.haloYOffset).toFixed(2)}) scale(${seal.haloScale.toFixed(
                3
              )}, ${(seal.haloScale * 0.32).toFixed(3)}) rotate(${seal.haloRotationDeg.toFixed(1)})`}
            >
              <circle
                cx="0"
                cy="0"
                r="23"
                fill="none"
                stroke="#FFE88A"
                strokeWidth="3.2"
                filter={`url(#${softBlurId})`}
              />
              <circle
                cx="0"
                cy="0"
                r="23"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.4"
                strokeDasharray="6 4"
              />
            </g>
          )}

          {/* Ceremonial Cork Spinning & Descending into Bottle Mouth */}
          {seal.corkVisible && (
            <g
              opacity={seal.corkOpacity.toFixed(3)}
              transform={`translate(0, ${seal.corkYOffset.toFixed(
                2
              )}) translate(36, 10) rotate(${seal.corkTiltDeg.toFixed(
                2
              )}) scale(${seal.corkScaleX.toFixed(3)}, ${seal.corkScaleY.toFixed(3)}) translate(-36, -10)`}
            >
              {renderCorkArtwork()}
            </g>
          )}

          {/* PLAN B BEAT 4: Ethereal Stardust Crown gently expanding & dissolving above seated cork */}
          {seal.crownOpacity > 0.02 && (
            <g opacity={seal.crownOpacity.toFixed(3)}>
              <ellipse
                cx="36"
                cy={(1.5 - seal.crownExpand * 3.5).toFixed(2)}
                rx={(16 + seal.crownExpand * 11).toFixed(2)}
                ry={(4.2 + seal.crownExpand * 2.4).toFixed(2)}
                fill="none"
                stroke="#FFEFA8"
                strokeWidth="1.4"
                strokeDasharray="2.2 3.4"
                filter={`url(#${softBlurId})`}
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const rx = 16 + seal.crownExpand * 12;
                const ry = 4.4 + seal.crownExpand * 2.6;
                const cx = 36 + Math.cos(rad) * rx;
                const cy = 1.5 - seal.crownExpand * 3.5 + Math.sin(rad) * ry;
                return idx % 2 === 0 ? (
                  <path
                    key={`crown-st-${idx}`}
                    d={fourPointStarPath(cx, cy, 2.2 - seal.crownExpand * 0.7)}
                    fill="#FFFDF0"
                  />
                ) : (
                  <circle
                    key={`crown-st-${idx}`}
                    cx={cx.toFixed(2)}
                    cy={cy.toFixed(2)}
                    r={(1.15 - seal.crownExpand * 0.35).toFixed(2)}
                    fill={sealRibbonAccent}
                  />
                );
              })}
            </g>
          )}
        </g>
      )}

      {/* Resting Completed Natural Tactile Cork + Alchemist Star Seal & Floating Sparkles */}
      {complete && (
        <g style={{ transformOrigin: '36px 10px' }}>
          {renderCorkArtwork()}
          <g className="animate-sparkle-pulse" style={{ transformOrigin: '14px 7px' }}>
            <path
              d="M 14 2 L 15.3 5.7 L 19 7 L 15.3 8.3 L 14 12 L 12.7 8.3 L 9 7 L 12.7 5.7 Z"
              fill="#FFF6B3"
              stroke="#B56A00"
              strokeWidth="0.6"
            />
          </g>
          <g className="animate-sparkle-pulse" style={{ transformOrigin: '58px 10px' }}>
            <path
              d="M 58 6 L 59 8.8 L 61.8 9.8 L 59 10.8 L 58 13.6 L 57 10.8 L 54.2 9.8 L 57 8.8 Z"
              fill="#FFF2A6"
              stroke="#B56A00"
              strokeWidth="0.6"
            />
          </g>
        </g>
      )}

      {/* Cork Seal Obstacle */}
      {isCork && bottle.obstacle.type === 'cork' && (
        <g>
          <path
            d="M 25 0.5 L 47 0.5 L 44.5 13 L 27.5 13 Z"
            fill={`url(#${corkGradId})`}
            stroke="#4D2807"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle
            cx="36"
            cy="7"
            r="5"
            fill={POTION_COLORS[bottle.obstacle.requiredColor].fill}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {colorSymbolsEnabled && (
            <text x="36" y="9.5" textAnchor="middle" fontSize="6" fontWeight="800" fill="#FFFFFF">
              {POTION_COLORS[bottle.obstacle.requiredColor].symbol}
            </text>
          )}
        </g>
      )}

      {/* Chunky 3D Wooden Crate + Colored Padlock */}
      {isCrate && bottle.obstacle.type === 'crate' && (
        <g>
          <rect
            x="7.5"
            y="29"
            width="57"
            height="129"
            rx="9.5"
            fill="#D98B3A"
            stroke="#4D2405"
            strokeWidth="2.6"
          />
          <rect x="11.5" y="33" width="49" height="121" rx="6" fill="#F0AD5A" />
          <line x1="10.5" y1="64" x2="61.5" y2="64" stroke="#7A3C0B" strokeWidth="2.4" />
          <line x1="10.5" y1="122" x2="61.5" y2="122" stroke="#7A3C0B" strokeWidth="2.4" />
          <line x1="12.5" y1="64" x2="59.5" y2="122" stroke="#9C5114" strokeWidth="2.2" opacity="0.65" />
          <path
            d="M 29 88 L 29 82 A 7 7 0 0 1 43 82 L 43 88"
            fill="none"
            stroke="#FFE066"
            strokeWidth="3.6"
          />
          <path
            d="M 29 88 L 29 82 A 7 7 0 0 1 43 82 L 43 88"
            fill="none"
            stroke="#6E3B00"
            strokeWidth="1.4"
          />
          <rect
            x="24"
            y="86"
            width="24"
            height="20"
            rx="4.5"
            fill={POTION_COLORS[bottle.obstacle.lockColor].fill}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <text x="36" y="99.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#FFFFFF">
            {POTION_COLORS[bottle.obstacle.lockColor].symbol}
          </text>
        </g>
      )}

      {/* Lush 3D Velvet Curtain */}
      {isCurtain && bottle.obstacle.type === 'curtain' && (
        <g>
          <rect
            x="7.5"
            y="20"
            width="57"
            height="138"
            rx="9.5"
            fill="#7A24C9"
            stroke="#F7C331"
            strokeWidth="2.6"
          />
          <path
            d="M 22 23 L 22 155 M 36 23 L 36 155 M 50 23 L 50 155"
            stroke="#460D82"
            strokeWidth="2.4"
          />
          <rect
            x="5.5"
            y="17"
            width="61"
            height="6.5"
            rx="3.2"
            fill="#F7C331"
            stroke="#6E3B00"
            strokeWidth="1.5"
          />
          <circle
            cx="36"
            cy="88"
            r="12"
            fill={POTION_COLORS[bottle.obstacle.unlockColor].fill}
            stroke="#F7C331"
            strokeWidth="2.4"
          />
          <text x="36" y="92.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#FFFFFF">
            {POTION_COLORS[bottle.obstacle.unlockColor].symbol}
          </text>
        </g>
      )}
      </g>
    </svg>
  );

  if (!interactive) {
    return (
      <span
        data-bottle-id={bottle.id}
        data-bottle-style={bottleStyle}
        className="relative flex flex-col items-center justify-end p-0.5"
      >
        {svgGraphic}
      </span>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      data-bottle-id={bottle.id}
      data-bottle-style={bottleStyle}
      data-complete={complete || Boolean(seal) ? 'true' : 'false'}
      data-sealing={seal ? 'true' : 'false'}
      onClick={() => onSelect(bottle.id)}
      aria-label={label}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center justify-end focus:outline-none focus-visible:ring-3 focus-visible:ring-[#FFCF33] rounded-2xl p-0.5 cursor-pointer ${
        isFlying ? 'z-40' : 'transition-transform duration-200 ease-out'
      }`}
      style={{
        transform: transformStyle,
        transformOrigin: '50% 53.66%',
        transition: isFlying ? 'none' : undefined,
        zIndex: isFlying ? 40 : seal ? 24 : 10,
      }}
    >
      {svgGraphic}
    </button>
  );
};
