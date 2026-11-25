import React, { useId, useLayoutEffect, useRef, useState } from 'react';

export interface MascotSpeech {
  id: number;
  who: 'fox' | 'dragon';
  text: string;
}

interface CabinetMascotsProps {
  cheering: boolean;
  speech?: MascotSpeech | null;
  onTriggerPreviewCheer: (who: 'fox' | 'dragon') => void;
}

const Render3DMascot: React.FC<{ who: 'fox' | 'dragon'; cheering: boolean }> = ({ who, cheering }) => {
  const src =
    who === 'fox'
      ? cheering
        ? '/assets/mascots/fox_clap.png'
        : '/assets/mascots/fox_idle.png'
      : cheering
      ? '/assets/mascots/dragon_clap.png'
      : '/assets/mascots/dragon_idle.png';

  const alt =
    who === 'fox'
      ? cheering
        ? 'Fox alchemist smiling and clapping'
        : 'Fox alchemist sitting on cabinet ledge'
      : cheering
      ? 'Sky dragon smiling and clapping'
      : 'Sky dragon sitting on cabinet ledge';

  return (
    <div className="relative flex flex-col items-center justify-end w-[94px] h-[96px]">
      {/* Grounded contact shadow on oak cornice */}
      <div
        aria-hidden="true"
        className="absolute bottom-0.5 w-16 h-3 rounded-full bg-[#1C0801]/58 blur-[2.5px]"
      />
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`relative w-[90px] h-[94px] object-contain object-bottom drop-shadow-[0_5px_8px_rgba(24,10,2,0.52)] ${
          cheering ? 'animate-mascot-clap-bounce' : 'animate-mascot-breathe'
        }`}
      />
      {cheering && (
        <svg
          aria-hidden="true"
          viewBox="0 0 96 96"
          className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
        >
          <path d="M 6 18 L 8.5 23 L 13.5 25.5 L 8.5 28 L 6 33 L 3.5 28 L -1.5 25.5 L 3.5 23 Z" fill="#FFE875" />
          <path d="M 88 12 L 90 16.5 L 94.5 18.5 L 90 20.5 L 88 25 L 86 20.5 L 81.5 18.5 L 86 16.5 Z" fill="#FFF3A6" />
        </svg>
      )}
    </div>
  );
};

/**
 * Generates a 100% pure cubic-Bezier organic cloud silhouette with ZERO straight segments
 * (top, right, bottom, left, and integrated curved pointed tail are all smooth curves).
 * Canonical orientation points its tail toward bottom-left (Fox); Dragon mirrors via -scale-x-100.
 */
function buildBezierCloudPath(w: number, h: number): string {
  const safeW = Math.max(128, w);
  const safeH = Math.max(48, h);

  const xL = 16;
  const xR = safeW - 16;
  const innerW = xR - xL;
  const yTop = 14;
  const yBot = safeH - 14;

  // Top valley anchors (3 asymmetrical fluffy cloud domes with natural clefts)
  const vT1x = xL + innerW * 0.30;
  const vT1y = yTop - 1.5;
  const vT2x = xL + innerW * 0.72;
  const vT2y = yTop - 1;

  // Bottom valley anchors (staggered organically from top domes so the cloud feels hand-drawn)
  const vB2x = xL + innerW * 0.67;
  const vB2y = yBot - 1;
  const vB1x = xL + innerW * 0.33;
  const vB1y = yBot - 1;

  // Integrated curved pointed tail root & graceful swooping tip pointing at mascot
  const tailRootX = xL + 12;
  const tailRootY = yBot + 1;
  const tailTipX = -3;
  const tailTipY = yBot + 8.5;
  const tailUpperX = xL - 2;
  const tailUpperY = yBot - 4.5;

  const f = (n: number) => n.toFixed(1);

  return [
    // Start at top-left shoulder
    `M ${f(xL)} ${f(yTop + 2)}`,
    // 1. Top-left dome
    `C ${f(xL + innerW * 0.03)} ${f(yTop - 11.5)}, ${f(vT1x - innerW * 0.04)} ${f(yTop - 12.5)}, ${f(vT1x)} ${f(vT1y)}`,
    // 2. Top-center crown dome (tallest billow)
    `C ${f(vT1x + innerW * 0.05)} ${f(yTop - 16.5)}, ${f(vT2x - innerW * 0.05)} ${f(yTop - 16.5)}, ${f(vT2x)} ${f(vT2y)}`,
    // 3. Top-right dome
    `C ${f(vT2x + innerW * 0.04)} ${f(yTop - 12)}, ${f(xR - innerW * 0.03)} ${f(yTop - 11)}, ${f(xR)} ${f(yTop + 2)}`,
    // 4. Right plump rounded cheek
    `C ${f(xR + 17.5)} ${f(yTop + 4)}, ${f(xR + 17.5)} ${f(yBot - 4)}, ${f(xR)} ${f(yBot - 2)}`,
    // 5. Bottom-right pillowy wave
    `C ${f(xR - innerW * 0.03)} ${f(yBot + 10)}, ${f(vB2x + innerW * 0.04)} ${f(yBot + 10)}, ${f(vB2x)} ${f(vB2y)}`,
    // 6. Bottom-center pillowy wave
    `C ${f(vB2x - innerW * 0.05)} ${f(yBot + 12)}, ${f(vB1x + innerW * 0.05)} ${f(yBot + 12)}, ${f(vB1x)} ${f(vB1y)}`,
    // 7. Bottom-left wave flowing into tail root
    `C ${f(vB1x - innerW * 0.04)} ${f(yBot + 9.5)}, ${f(tailRootX + 10)} ${f(yBot + 9)}, ${f(tailRootX)} ${f(tailRootY)}`,
    // 8. Lower curve of pointed vapor tail sweeping out toward mascot
    `C ${f(tailRootX - 9)} ${f(yBot + 6.5)}, ${f(tailTipX + 10)} ${f(tailTipY + 1.5)}, ${f(tailTipX)} ${f(tailTipY)}`,
    // 9. Upper concave curve of pointed vapor tail sweeping back into left cheek
    `C ${f(tailTipX + 8)} ${f(tailTipY - 4)}, ${f(tailUpperX - 2.5)} ${f(tailUpperY + 4.5)}, ${f(tailUpperX)} ${f(tailUpperY)}`,
    // 10. Left plump rounded cheek closing smoothly back to start
    `C ${f(xL - 17.5)} ${f(yBot - 7)}, ${f(xL - 17.5)} ${f(yTop + 4)}, ${f(xL)} ${f(yTop + 2)}`,
    'Z',
  ].join(' ');
}

/**
 * Soft sunlit inner shimmer arcs nestled under the top cloud domes for volumetric depth.
 */
function buildCloudTopSheenPath(w: number): string {
  const safeW = Math.max(128, w);
  const xL = 16;
  const innerW = safeW - 32;
  const yTop = 14;
  const vT1x = xL + innerW * 0.30;
  const vT2x = xL + innerW * 0.72;
  const f = (n: number) => n.toFixed(1);

  return [
    // Center crown dome highlight arc
    `M ${f(vT1x + innerW * 0.09)} ${f(yTop - 4.5)}`,
    `C ${f(vT1x + innerW * 0.16)} ${f(yTop - 10.5)}, ${f(vT2x - innerW * 0.16)} ${f(yTop - 10.5)}, ${f(vT2x - innerW * 0.09)} ${f(yTop - 4.5)}`,
    // Left dome subtle glint arc
    `M ${f(xL + innerW * 0.07)} ${f(yTop - 2.5)}`,
    `C ${f(xL + innerW * 0.12)} ${f(yTop - 7)}, ${f(vT1x - innerW * 0.09)} ${f(yTop - 7.5)}, ${f(vT1x - innerW * 0.05)} ${f(yTop - 3)}`,
  ].join(' ');
}

/**
 * Pure-Bezier luminous potion-mist speech cloud:
 * Zero straight lines anywhere; dynamically measures the speech copy in 1:1 pixels so
 * every puff, bottom wave, and integrated curved pointed tail stays organic and crisp.
 */
const CloudSpeechBubble: React.FC<{ speech: MascotSpeech }> = ({ speech }) => {
  const isFox = speech.who === 'fox';
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 186, h: 64 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const nextW = Math.round(el.offsetWidth);
      const nextH = Math.round(el.offsetHeight);
      if (nextW > 0 && nextH > 0) {
        setSize((prev) => (prev.w === nextW && prev.h === nextH ? prev : { w: nextW, h: nextH }));
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [speech.text]);

  const fillGradId = `mist-fill-${uid}`;
  const rimGradId = `mist-rim-${uid}`;

  // Fox: royal amethyst & warm sunlit gold potion mist | Dragon: celestial aqua & starlight mist
  const fillTop = isFox ? '#FFF9FE' : '#F6FEFF';
  const fillMid = isFox ? '#FAECFF' : '#E5F7FF';
  const fillBottom = isFox ? '#EED2FA' : '#C6EAFF';
  const rimStart = isFox ? '#DDA7FF' : '#8BE0FF';
  const rimMid = isFox ? '#B372F5' : '#4AB5FA';
  const rimEnd = isFox ? '#E9B95C' : '#6F93F8';
  const textColor = isFox ? '#431866' : '#14336B';
  const sparklePrimary = '#FFE978';
  const sparkleSecondary = isFox ? '#E8B6FF' : '#94E7FF';
  const auraFilter = isFox
    ? 'drop-shadow(0 0 9px rgba(196, 124, 255, 0.56)) drop-shadow(0 5px 11px rgba(42, 12, 72, 0.34))'
    : 'drop-shadow(0 0 9px rgba(84, 198, 255, 0.56)) drop-shadow(0 5px 11px rgba(16, 36, 84, 0.34))';

  const cloudPath = buildBezierCloudPath(size.w, size.h);
  const sheenPath = buildCloudTopSheenPath(size.w);
  const dropletY = size.h - 14 + 10;

  return (
    <div
      key={speech.id}
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute bottom-[45px] z-[24] max-w-[calc(100%-172px)] ${
        isFox
          ? 'left-[84px] animate-cloud-pop-left'
          : 'right-[84px] animate-cloud-pop-right'
      }`}
    >
      <div
        ref={boxRef}
        className="relative inline-block min-w-[132px] max-w-[min(212px,100%)] animate-mist-float"
      >
        {/* PURE CUBIC-BEZIER ORGANIC CLOUD + INTEGRATED TAIL + TRAILING DROPLETS */}
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${size.w} ${size.h}`}
          className={`pointer-events-none absolute inset-0 w-full h-full overflow-visible ${
            isFox ? '' : '-scale-x-100'
          }`}
          style={{ filter: auraFilter }}
        >
          <defs>
            <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillTop} />
              <stop offset="52%" stopColor={fillMid} />
              <stop offset="100%" stopColor={fillBottom} />
            </linearGradient>
            <linearGradient id={rimGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={rimStart} />
              <stop offset="58%" stopColor={rimMid} />
              <stop offset="100%" stopColor={rimEnd} />
            </linearGradient>
          </defs>

          {/* Unified translucent mist body + seamless glowing rim */}
          <path
            d={cloudPath}
            fill={`url(#${fillGradId})`}
            fillOpacity="0.92"
            stroke={`url(#${rimGradId})`}
            strokeWidth="2.3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Soft volumetric sunlit sheen curving beneath the top domes */}
          <path
            d={sheenPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.88)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* 2 tiny glowing elixir vapor droplets trailing off the tail tip toward mascot */}
          <g className="animate-mist-wisp">
            <circle
              cx="-9"
              cy={dropletY + 1.5}
              r="2.6"
              fill={fillTop}
              fillOpacity="0.93"
              stroke={rimMid}
              strokeWidth="1.35"
            />
            <circle cx="-9.7" cy={dropletY + 0.7} r="0.7" fill="#FFFFFF" />
            <circle
              cx="-14.5"
              cy={dropletY + 5}
              r="1.55"
              fill={fillTop}
              fillOpacity="0.9"
              stroke={rimStart}
              strokeWidth="1.15"
            />
          </g>
        </svg>

        {/* FLOATING ALCHEMICAL STARDUST PARTICLES (fixed 1:1 aspect ratio) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute -top-1.5 -right-1 z-[3] w-3.5 h-3.5 overflow-visible animate-mist-sparkle"
        >
          <path
            d="M 8 1 L 9.8 6.2 L 15 8 L 9.8 9.8 L 8 15 L 6.2 9.8 L 1 8 L 6.2 6.2 Z"
            fill={sparklePrimary}
          />
        </svg>
        <svg
          aria-hidden="true"
          viewBox="0 0 14 14"
          className="pointer-events-none absolute -top-2 left-2.5 z-[3] w-2.5 h-2.5 overflow-visible animate-mist-sparkle-delay"
        >
          <path
            d="M 7 1 L 8.5 5.5 L 13 7 L 8.5 8.5 L 7 13 L 5.5 8.5 L 1 7 L 5.5 5.5 Z"
            fill={sparkleSecondary}
          />
        </svg>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 right-4 z-[3] w-1.5 h-1.5 rounded-full animate-mist-sparkle-delay"
          style={{
            backgroundColor: sparkleSecondary,
            boxShadow: `0 0 6px ${sparkleSecondary}`,
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-5 z-[3] w-1 h-1 rounded-full animate-mist-sparkle"
          style={{
            backgroundColor: sparklePrimary,
            boxShadow: `0 0 5px ${sparklePrimary}`,
          }}
        />

        {/* CRISP HIGH-CONTRAST SPEECH COPY */}
        <div
          className="relative z-[2] px-[24px] pt-[19px] pb-[18px] text-[11px] font-black leading-snug text-center"
          style={{
            color: textColor,
            textShadow: '0 1px 0 rgba(255, 255, 255, 0.72)',
          }}
        >
          {speech.text}
        </div>
      </div>
    </div>
  );
};

export const CabinetMascots: React.FC<CabinetMascotsProps> = ({
  cheering,
  speech = null,
  onTriggerPreviewCheer,
}) => {
  return (
    <div
      aria-label="Alchemist companions seated on top of cabinet"
      className="pointer-events-none absolute inset-x-0 z-[15]"
      style={{ bottom: '70.6%' }}
    >
      <div className="relative w-full flex items-end justify-between px-2">
        <button
          type="button"
          onClick={() => onTriggerPreviewCheer('fox')}
          aria-label="Fox alchemist companion"
          className="pointer-events-auto relative flex items-end justify-center cursor-pointer focus:outline-none"
        >
          <Render3DMascot who="fox" cheering={cheering} />
        </button>

        {speech && <CloudSpeechBubble speech={speech} />}

        <button
          type="button"
          onClick={() => onTriggerPreviewCheer('dragon')}
          aria-label="Sky dragon companion"
          className="pointer-events-auto relative flex items-end justify-center cursor-pointer focus:outline-none"
        >
          <Render3DMascot who="dragon" cheering={cheering} />
        </button>
      </div>
    </div>
  );
};
