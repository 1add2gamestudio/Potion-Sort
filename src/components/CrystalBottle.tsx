import React, { useId } from 'react';
import { isBottleComplete } from '../game/engine';
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
  colorSymbolsEnabled: boolean;
  compact?: boolean;
  sizeClassName?: string;
  interactive?: boolean;
  onSelect: (bottleId: string) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

const ALL_COLORS: PotionColor[] = ['coral', 'seafoam', 'citron', 'azure', 'iris', 'rose', 'jade'];

// 1:1 proportions matching reference reagent bottle (viewBox 0 0 72 164)
const OUTER_PATH =
  'M 27 17 L 45 17 L 45 22 C 45 27 62 31 62 44 L 62 148 C 62 156 50 158 36 158 C 22 158 10 156 10 148 L 10 44 C 10 31 27 27 27 22 Z';

// Inner liquid cavity inset 3.5px on walls & 4.5px above outer base so sapphire-ice thick glass rim reads clearly
const INNER_CLIP_PATH =
  'M 29.5 21 L 42.5 21 L 42.5 24.5 C 42.8 29.5 58.5 34 58.5 45.5 L 58.5 146.5 C 58.5 152 49 153.5 36 153.5 C 23 153.5 13.5 152 13.5 146.5 L 13.5 45.5 C 13.5 34 29.2 29.5 29.5 24.5 Z';

const SLOT_HEIGHTS: [number, number, number, number] = [128, 102.5, 77, 51.5];
const SLOT_HEIGHT = 25.5;
const BASE_BOTTOM_Y = 154;

export const CrystalBottle: React.FC<CrystalBottleProps> = ({
  bottle,
  bottleStyle = 'starlight',
  selected,
  pourSourceOverride = null,
  pourFillOverride = null,
  colorSymbolsEnabled,
  compact = false,
  sizeClassName,
  interactive = true,
  onSelect,
  buttonRef,
}) => {
  const uid = useId().replace(/:/g, '');

  const complete = isBottleComplete(bottle) && !pourFillOverride?.isStreaming && !pourSourceOverride;
  const isCrate = bottle.obstacle.type === 'crate';
  const isCurtain = bottle.obstacle.type === 'curtain';
  const isCork = bottle.obstacle.type === 'cork';

  const outerClipId = `outer-clip-${uid}`;
  const innerClipId = `inner-clip-${uid}`;
  const shadowBlurId = `shadow-blur-${uid}`;
  const softBlurId = `soft-blur-${uid}`;
  const glassBodyGradId = `glass-body-${uid}`;
  const wallGradId = `wall-grad-${uid}`;
  const lipBodyGradId = `lip-body-${uid}`;
  const lipTopGradId = `lip-top-${uid}`;
  const rightSheenId = `right-sheen-${uid}`;
  const domeSheenId = `dome-sheen-${uid}`;

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
      const bands: Array<{ layer: LiquidLayer; yTop: number; yBottom: number; index: number }> = [];
      layersBefore.forEach((layer, index) => {
        const w = weights[index];
        if (w <= 0.002) return;
        const h = totalH * (w / weightSum);
        const yTop = cursorBottom - h;
        bands.push({ layer, yTop, yBottom: cursorBottom, index });
        cursorBottom = yTop;
      });

      const topBand = bands[bands.length - 1];

      return (
        <g transform={`rotate(${(-tiltDeg).toFixed(2)}, 36, 88)`}>
          {bands.map(({ layer, yTop, yBottom, index }) => {
            const h = yBottom - yTop;
            const pal = LIQUID_3D_PALETTES[layer.color];
            const isTop = index === topBand?.index;
            if (layer.hidden) {
              return (
                <rect
                  key={`${bottle.id}-tilt-layer-${index}`}
                  x="-110"
                  y={yTop}
                  width="292"
                  height={h + 2}
                  fill="#0B0E1D"
                />
              );
            }
            return (
              <g key={`${bottle.id}-tilt-layer-${index}`}>
                <rect
                  x="-110"
                  y={yTop}
                  width="292"
                  height={h + 2.5}
                  fill={`url(#liq-${layer.color}-${uid})`}
                />
                {!isTop && (
                  <path
                    d={`M -110 ${yTop} Q 36 ${yTop + 2.4} 182 ${yTop}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                  />
                )}
                {isTop && (
                  <ellipse
                    cx="36"
                    cy={yTop + 0.5}
                    rx="72"
                    ry={4.2 + 1.4 * t}
                    fill={pal.meniscus}
                    opacity="0.96"
                  />
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

    const renderedLayers: Array<{ layer: LiquidLayer; yTop: number; yBottom: number; index: number }> = [];
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

    const topIdx = renderedLayers.length > 0 ? renderedLayers[renderedLayers.length - 1].index : -1;
    const topRendered = renderedLayers[renderedLayers.length - 1];

    return (
      <>
        {renderedLayers.map(({ layer, yTop, yBottom, index }) => {
          const meta = POTION_COLORS[layer.color];
          const pal = LIQUID_3D_PALETTES[layer.color];
          const isTopLayer = index === topIdx;
          const curveDip = 3.0;

          if (layer.hidden) {
            return (
              <g key={`${bottle.id}-layer-${index}`}>
                <path
                  d={`M 10 ${yTop} Q 36 ${yTop + curveDip} 62 ${yTop} L 62 ${yBottom} L 10 ${yBottom} Z`}
                  fill="#0B0E1A"
                  opacity="0.94"
                />
                <rect x="46" y={yTop} width="6.5" height={yBottom - yTop} fill="rgba(160, 200, 255, 0.1)" />
                <text
                  x="36"
                  y={yTop + 18.5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="900"
                  fill="rgba(165, 178, 204, 0.65)"
                >
                  ?
                </text>
              </g>
            );
          }

          return (
            <g key={`${bottle.id}-layer-${index}`}>
              {/* Curved cylindrical liquid slab */}
              <path
                d={`M 10 ${yTop} Q 36 ${yTop + curveDip} 62 ${yTop} L 62 ${yBottom} Q 36 ${
                  yBottom + curveDip
                } 10 ${yBottom} Z`}
                fill={`url(#liq-${layer.color}-${uid})`}
              />

              {/* Subtle depth occlusion at bottle floor */}
              {index === 0 && (
                <rect x="10" y={yBottom - 4} width="52" height="4" fill="rgba(10, 8, 28, 0.16)" />
              )}

              {/* Curved boundary glint between adjacent layers */}
              {!isTopLayer && (
                <path
                  d={`M 13 ${yTop} Q 36 ${yTop + curveDip} 59 ${yTop}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.24)"
                  strokeWidth="0.9"
                />
              )}

              {/* 3D Perspective Elliptical Top Meniscus */}
              {isTopLayer && (
                <>
                  <ellipse
                    cx="36"
                    cy={yTop + 0.8}
                    rx="22"
                    ry="4.8"
                    fill={pal.meniscus}
                    opacity="0.97"
                  />
                  <ellipse
                    cx="31"
                    cy={yTop + 0.3}
                    rx="11"
                    ry="2.0"
                    fill="#FFFFFF"
                    opacity="0.34"
                  />
                </>
              )}

              {colorSymbolsEnabled && (
                <text
                  x="36"
                  y={yTop + 17.5}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="rgba(255, 255, 255, 0.94)"
                >
                  {meta.symbol}
                </text>
              )}
            </g>
          );
        })}

        {/* Subtle Meniscus Ripple Ring while Stream Hits Liquid */}
        {pourFillOverride?.isStreaming && topRendered && (
          <ellipse
            cx="36"
            cy={topRendered.yTop + 0.8}
            rx="10"
            ry="2.5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.52)"
            strokeWidth="1.3"
          />
        )}
      </>
    );
  };

  const shadowOpacity = pourSourceOverride
    ? Math.max(0, 1 - Math.abs(pourSourceOverride.tiltDeg) / 22)
    : 1;

  const svgGraphic = (
    <svg viewBox="0 0 72 164" className={svgSizeClass}>
      <defs>
        <clipPath id={outerClipId}>
          <path d={OUTER_PATH} />
        </clipPath>
        <clipPath id={innerClipId}>
          <path d={INNER_CLIP_PATH} />
        </clipPath>

        <filter id={shadowBlurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={softBlurId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>

        {/* Ultra-Clear Glass Interior */}
        <linearGradient id={glassBodyGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(108, 186, 255, 0.24)" />
          <stop offset="14%" stopColor="rgba(160, 215, 255, 0.05)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.0)" />
          <stop offset="86%" stopColor="rgba(160, 215, 255, 0.05)" />
          <stop offset="100%" stopColor="rgba(108, 186, 255, 0.24)" />
        </linearGradient>

        {/* Reference Sapphire-Ice Thick Glass Wall */}
        <linearGradient id={wallGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(96, 178, 255, 0.85)" />
          <stop offset="30%" stopColor="rgba(195, 236, 255, 0.88)" />
          <stop offset="70%" stopColor="rgba(155, 214, 255, 0.68)" />
          <stop offset="100%" stopColor="rgba(86, 168, 250, 0.84)" />
        </linearGradient>

        {/* Sculpted 3D Glass Ring Collar (Lower Side Wall) */}
        <linearGradient id={lipBodyGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#264C8E" />
          <stop offset="24%" stopColor="#6BB4F5" />
          <stop offset="52%" stopColor="#2E5CA8" />
          <stop offset="82%" stopColor="#19356B" />
          <stop offset="100%" stopColor="#4A8CE0" />
        </linearGradient>

        {/* Sculpted 3D Glass Ring Collar (Top Elliptical Face) */}
        <linearGradient id={lipTopGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86C8FF" />
          <stop offset="48%" stopColor="#3B6EB8" />
          <stop offset="100%" stopColor="#1C3A73" />
        </linearGradient>

        {/* Right-Third Vertical Glossy Specular Strip */}
        <linearGradient id={rightSheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.34)" />
          <stop offset="65%" stopColor="rgba(255, 255, 255, 0.16)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
        </linearGradient>

        {/* Upper Curved Shoulder Glass Dome Reflection */}
        <linearGradient id={domeSheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(235, 248, 255, 0.56)" />
          <stop offset="100%" stopColor="rgba(235, 248, 255, 0.06)" />
        </linearGradient>

        {/* Smooth 3D Cylindrical Liquid Gradients */}
        {ALL_COLORS.map((c) => {
          const p = LIQUID_3D_PALETTES[c];
          return (
            <linearGradient key={c} id={`liq-${c}-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={p.edge} />
              <stop offset="22%" stopColor={p.highlight} />
              <stop offset="54%" stopColor={p.core} />
              <stop offset="88%" stopColor={p.shadow} />
              <stop offset="100%" stopColor={p.bounce} />
            </linearGradient>
          );
        })}
      </defs>

      {/* Grounded Two-Stage 3D Contact Shadow on Oak Surface */}
      {shadowOpacity > 0.02 && (
        <g opacity={shadowOpacity}>
          <ellipse
            cx="36"
            cy="157.5"
            rx="23.5"
            ry="4.5"
            fill="rgba(34, 12, 2, 0.58)"
            filter={`url(#${shadowBlurId})`}
          />
          <ellipse
            cx="36"
            cy="156.2"
            rx="19"
            ry="2.8"
            fill="rgba(22, 8, 1, 0.64)"
            filter={`url(#${softBlurId})`}
          />
        </g>
      )}

      {/* Selected / Complete Soft Glow Halo */}
      {(selected || complete) && !pourSourceOverride && (
        <path
          d={OUTER_PATH}
          fill="none"
          stroke={selected ? '#FFD84D' : '#FFE169'}
          strokeWidth={selected ? '5.5' : '4.5'}
          opacity={selected ? '0.92' : '0.70'}
          filter={`url(#${shadowBlurId})`}
        />
      )}

      {/* LAYER 1: Ultra-Transparent Glass Interior + Thick Sapphire-Ice Wall */}
      <g clipPath={`url(#${outerClipId})`}>
        <path d={OUTER_PATH} fill={`url(#${glassBodyGradId})`} />
        <path d={OUTER_PATH} fill="none" stroke={`url(#${wallGradId})`} strokeWidth="5.8" />
        <rect
          x="24"
          y="17"
          width="24"
          height="5.5"
          fill="rgba(12, 28, 64, 0.46)"
          filter={`url(#${softBlurId})`}
        />
        <path
          d="M 13.5 147.5 Q 36 141.5 58.5 147.5"
          fill="none"
          stroke="rgba(150, 212, 255, 0.52)"
          strokeWidth="1.2"
        />
        <ellipse cx="36" cy="149.5" rx="22.5" ry="5.2" fill="rgba(120, 194, 255, 0.14)" />
      </g>

      {/* LAYER 2: Gravity-Leveled or Upright 3D Cylindrical Liquids inside Inner Cavity */}
      <g clipPath={`url(#${innerClipId})`}>{renderLiquids()}</g>

      {/* LAYER 3: 1:1 Reference Glass Highlights, Right Specular Bar & Heavy Base Rim */}
      <path d={INNER_CLIP_PATH} fill="none" stroke="rgba(195, 236, 255, 0.48)" strokeWidth="0.9" />
      <path
        d="M 14 45 C 14 38 25 36.5 36 36.5 C 47 36.5 58 38 58 45 L 58 50.5 C 51 46.5 43 45 36 45 C 29 45 21 46.5 14 50.5 Z"
        fill={`url(#${domeSheenId})`}
      />
      <path
        d="M 13.2 44 C 14 35 21 30.5 27.5 27.5"
        fill="none"
        stroke="rgba(225, 246, 255, 0.88)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="46.5" y="46" width="6.5" height="100" rx="3.2" fill={`url(#${rightSheenId})`} />
      <path
        d="M 12.2 46 L 12.2 147 C 12.2 151.5 16 154 22 155"
        fill="none"
        stroke="rgba(210, 240, 255, 0.84)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M 59.8 46 L 59.8 147 C 59.8 151.5 56 154 50 155"
        fill="none"
        stroke="rgba(165, 222, 255, 0.78)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M 12.5 149.5 Q 36 157.5 59.5 149.5"
        fill="none"
        stroke="rgba(182, 230, 255, 0.94)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M 17 153 Q 36 158.2 55 153"
        fill="none"
        stroke="rgba(110, 185, 252, 0.75)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d={OUTER_PATH} fill="none" stroke="#0F234C" strokeWidth="1.5" opacity="0.72" />

      {/* LAYER 4: 1:1 Sculpted 3D Perspective Elliptical Glass Collar Lip */}
      <g>
        <path
          d="M 21 11 L 21 14.5 C 21 18.6 51 18.6 51 14.5 L 51 11 Z"
          fill={`url(#${lipBodyGradId})`}
          stroke="#0E2148"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M 23 14.8 Q 29 17.5 36 17.5"
          fill="none"
          stroke="rgba(225, 246, 255, 0.92)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <ellipse
          cx="36"
          cy="11.2"
          rx="15"
          ry="4.7"
          fill={`url(#${lipTopGradId})`}
          stroke="#0E2148"
          strokeWidth="1.3"
        />
        <path
          d="M 22.5 10.6 C 24 8.2 30 7.2 37 7.3"
          fill="none"
          stroke="rgba(235, 248, 255, 0.92)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <ellipse cx="36" cy="11.0" rx="7.2" ry="2.0" fill="#091533" />
        <path
          d="M 29.4 11.4 Q 36 13.3 42.6 11.4"
          fill="none"
          stroke="rgba(186, 232, 255, 0.90)"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      </g>

      {/* Completed Alchemist Cork + Purple-Gold Wax Seal & Sparkles */}
      {complete && (
        <g className="animate-cork-pop" style={{ transformOrigin: '36px 10px' }}>
          <path
            d="M 26 12.5 L 46 12.5 L 47.5 0.5 C 47.5 -1.5 44 -2.5 36 -2.5 C 28 -2.5 24.5 -1.5 24.5 0.5 Z"
            fill="#D98C36"
            stroke="#592803"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="29"
            y1="2"
            x2="30.5"
            y2="10"
            stroke="#F6C378"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="36" cy="7" r="5.2" fill="#7D2AE8" stroke="#FFE875" strokeWidth="1.7" />
          <path
            d="M 36 3.9 L 37 5.9 L 39.2 6.2 L 37.5 7.7 L 38 9.9 L 36 8.7 L 34 9.9 L 34.5 7.7 L 32.8 6.2 L 35 5.9 Z"
            fill="#FFE875"
          />
          <g className="animate-sparkle-pulse" style={{ transformOrigin: '14px 7px' }}>
            <path
              d="M 14 2 L 15.3 5.7 L 19 7 L 15.3 8.3 L 14 12 L 12.7 8.3 L 9 7 L 12.7 5.7 Z"
              fill="#FFF18A"
              stroke="#854400"
              strokeWidth="0.8"
            />
          </g>
          <g className="animate-sparkle-pulse" style={{ transformOrigin: '58px 10px' }}>
            <path
              d="M 58 6 L 59 8.8 L 61.8 9.8 L 59 10.8 L 58 13.6 L 57 10.8 L 54.2 9.8 L 57 8.8 Z"
              fill="#FFE159"
              stroke="#854400"
              strokeWidth="0.8"
            />
          </g>
        </g>
      )}

      {/* Cork Seal Obstacle */}
      {isCork && bottle.obstacle.type === 'cork' && (
        <g>
          <path
            d="M 25 0.5 L 47 0.5 L 44.5 13 L 27.5 13 Z"
            fill="#D48D3B"
            stroke="#4D2807"
            strokeWidth="1.9"
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
      data-complete={complete ? 'true' : 'false'}
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
        zIndex: isFlying ? 40 : 10,
      }}
    >
      {svgGraphic}
    </button>
  );
};
