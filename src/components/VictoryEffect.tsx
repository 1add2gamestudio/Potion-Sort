import React, { useMemo } from 'react';
import type { CgTier } from '../game/types';

export interface VictoryEffectProps {
  active: boolean;
  originX?: number;
  originY?: number;
  stageWidth?: number;
  stageHeight?: number;
  tier?: CgTier;
}

interface CelebrationParticle {
  id: string;
  kind: 'confetti' | 'star';
  originX: number;
  originY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  rotMid: number;
  rotEnd: number;
  size: number;
  color: string;
  shape: 'ribbon' | 'diamond' | 'star';
  delayMs: number;
  durationMs: number;
}

const CONFETTI_PALETTE = [
  '#FFD94A',
  '#FF6B8B',
  '#47E3C2',
  '#4FA8FF',
  '#C278FF',
  '#FFF6CC',
  '#FF9E44',
];

export const VictoryEffect: React.FC<VictoryEffectProps> = ({
  active,
  originX,
  originY,
  stageWidth = 390,
  stageHeight = 844,
  tier = 1,
}) => {
  const reducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const centerX = originX ?? stageWidth * 0.5;
  const centerY = originY ?? stageHeight * 0.5;

  const particles = useMemo<CelebrationParticle[]>(() => {
    if (!active || reducedMotion) return [];

    const items: CelebrationParticle[] = [];
    const starCount = tier === 3 ? 20 : tier === 2 ? 16 : 14;
    const confettiCount = tier === 3 ? 44 : tier === 2 ? 38 : 32;

    // Radial golden/pearl 4-point star-bursts exploding outward from stage center
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + (i % 2 === 0 ? 0.12 : -0.08);
      const radius = 84 + (i % 3) * 34 + (tier - 1) * 10;
      items.push({
        id: `star-${i}`,
        kind: 'star',
        originX: centerX,
        originY: centerY,
        midX: Math.cos(angle) * radius * 0.58,
        midY: Math.sin(angle) * radius * 0.58,
        endX: Math.cos(angle) * radius,
        endY: Math.sin(angle) * radius,
        rotMid: 85,
        rotEnd: 195,
        size: i % 3 === 0 ? 19 : 13,
        color: i % 2 === 0 ? '#FFE66D' : '#FFFDF0',
        shape: 'star',
        delayMs: (i % 4) * 30,
        durationMs: 820 + (i % 3) * 110,
      });
    }

    // Twin celebration fountains launching tumbling multi-color confetti ribbons & diamonds
    for (let i = 0; i < confettiCount; i++) {
      const fromLeft = i % 2 === 0;
      const sx = fromLeft ? stageWidth * 0.24 : stageWidth * 0.76;
      const sy = stageHeight * 0.54;
      const halfCount = Math.max(2, confettiCount / 2);
      const spreadT = (Math.floor(i / 2) / (halfCount - 1) - 0.5) * 2;
      const dirBias = fromLeft ? 1 : -1;
      const midX = dirBias * (42 + ((i * 19) % 74)) + spreadT * 70;
      const midY = -(118 + ((i * 29) % 108));
      const endX = midX * 1.35 + spreadT * 28;
      const endY = 122 + ((i * 23) % 125);

      items.push({
        id: `confetti-${i}`,
        kind: 'confetti',
        originX: sx,
        originY: sy,
        midX,
        midY,
        endX,
        endY,
        rotMid: (fromLeft ? 1 : -1) * (140 + ((i * 37) % 160)),
        rotEnd: (fromLeft ? 1 : -1) * (420 + ((i * 53) % 260)),
        size: 7 + (i % 4) * 2,
        color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
        shape: i % 4 === 0 ? 'diamond' : 'ribbon',
        delayMs: (i % 8) * 24,
        durationMs: 1180 + (i % 5) * 120,
      });
    }

    return items;
  }, [active, reducedMotion, centerX, centerY, stageWidth, stageHeight, tier]);

  if (!active || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="victory-effect"
      className="pointer-events-none absolute inset-0 z-[34] overflow-hidden"
    >
      {/* Expanding golden sunburst shockwave ring */}
      <div
        className="animate-victory-burst-ring absolute rounded-full border-[3px] border-[#FFF3B0]"
        style={{
          left: `${centerX}px`,
          top: `${centerY}px`,
          width: '128px',
          height: '128px',
          background:
            'radial-gradient(circle, rgba(255,244,180,0.44) 0%, rgba(255,215,96,0.14) 55%, rgba(255,215,96,0) 75%)',
          boxShadow: '0 0 28px rgba(255, 224, 102, 0.78)',
        }}
      />

      {particles.map((p) => {
        if (p.kind === 'star') {
          return (
            <div
              key={p.id}
              className="animate-victory-star-burst absolute"
              style={
                {
                  left: `${p.originX}px`,
                  top: `${p.originY}px`,
                  animationDelay: `${p.delayMs}ms`,
                  '--sx-end': `${p.endX.toFixed(1)}px`,
                  '--sy-end': `${p.endY.toFixed(1)}px`,
                  '--s-dur': `${p.durationMs}ms`,
                } as React.CSSProperties
              }
            >
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                style={{ filter: `drop-shadow(0 0 6px ${p.color})` }}
              >
                <path
                  d="M12 1.5 L14.7 9.3 L22.5 12 L14.7 14.7 L12 22.5 L9.3 14.7 L1.5 12 L9.3 9.3 Z"
                  fill={p.color}
                />
              </svg>
            </div>
          );
        }

        return (
          <span
            key={p.id}
            className="animate-victory-confetti absolute block shadow-sm"
            style={
              {
                left: `${p.originX}px`,
                top: `${p.originY}px`,
                width: p.shape === 'diamond' ? `${p.size}px` : `${Math.round(p.size * 1.45)}px`,
                height:
                  p.shape === 'diamond'
                    ? `${p.size}px`
                    : `${Math.max(4, Math.round(p.size * 0.65))}px`,
                borderRadius: p.shape === 'diamond' ? '2px' : '3px',
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}99`,
                animationDelay: `${p.delayMs}ms`,
                '--cx-mid': `${p.midX.toFixed(1)}px`,
                '--cy-mid': `${p.midY.toFixed(1)}px`,
                '--cx-end': `${p.endX.toFixed(1)}px`,
                '--cy-end': `${p.endY.toFixed(1)}px`,
                '--c-rot-mid': `${p.rotMid}deg`,
                '--c-rot-end': `${p.rotEnd}deg`,
                '--c-dur': `${p.durationMs}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};
