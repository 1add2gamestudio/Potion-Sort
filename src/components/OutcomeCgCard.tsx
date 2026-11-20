import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { getOutcomeCg } from '../game/outcomeCg';
import { useI18n } from '../game/i18n';
import type { CgOutcome, CgTier } from '../game/types';
import { Close3DIcon } from './GameIcons3D';

interface OutcomeCgCardProps {
  outcome: CgOutcome;
  tier: CgTier;
  compact?: boolean;
  allowFullscreen?: boolean;
}

const SPARKLE_POSITIONS = [
  { left: '14%', top: '22%', delay: '0s', size: 12 },
  { left: '84%', top: '18%', delay: '0.45s', size: 14 },
  { left: '26%', top: '70%', delay: '0.85s', size: 10 },
  { left: '76%', top: '66%', delay: '1.15s', size: 13 },
  { left: '50%', top: '14%', delay: '0.25s', size: 15 },
];

const BUBBLE_POSITIONS = [
  { left: '16%', bottom: '8%', delay: '0s', size: 16 },
  { left: '34%', bottom: '4%', delay: '0.6s', size: 11 },
  { left: '68%', bottom: '10%', delay: '0.3s', size: 18 },
  { left: '84%', bottom: '6%', delay: '0.95s', size: 13 },
];

export const OutcomeCgCard: React.FC<OutcomeCgCardProps> = ({
  outcome,
  tier,
  compact = false,
  allowFullscreen = true,
}) => {
  const { lang, t } = useI18n();
  const [fullscreen, setFullscreen] = useState(false);
  const entry = getOutcomeCg(outcome, tier);

  const badge = lang === 'zh' ? entry.badgeZh : entry.badgeEn;
  const title = lang === 'zh' ? entry.titleZh : entry.titleEn;
  const caption = lang === 'zh' ? entry.captionZh : entry.captionEn;

  const badgePalette =
    outcome === 'victory'
      ? tier === 3
        ? 'bg-gradient-to-r from-[#FFBF2E] via-[#FFE975] to-[#FF9B1A] text-[#4A1C02] border-[#FFF8C9]'
        : tier === 2
        ? 'bg-gradient-to-r from-[#7B2FF7] to-[#D938B8] text-[#FFF8DC] border-[#FFE875]'
        : 'bg-[#29B80A] text-white border-[#DDFCC9]'
      : tier === 3
      ? 'bg-gradient-to-r from-[#6D23E8] to-[#D91634] text-white border-[#FFE875]'
      : tier === 2
      ? 'bg-[#D938B8] text-white border-[#FFD4F6]'
      : 'bg-[#E86F16] text-white border-[#FFE8B5]';

  const renderAnimatedOverlay = () => {
    if (outcome === 'victory') {
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {tier === 3 && (
            <div className="animate-cg-sunburst absolute -inset-4 bg-[radial-gradient(circle_at_50%_24%,rgba(255,243,176,0.42),transparent_62%)]" />
          )}
          {tier >= 2 && (
            <div className="animate-cg-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
          )}
          {SPARKLE_POSITIONS.slice(0, tier === 1 ? 3 : 5).map((sp, idx) => (
            <span
              key={idx}
              className="animate-sparkle-pulse absolute text-[#FFF6B8] drop-shadow-[0_0_6px_rgba(255,220,90,0.95)]"
              style={{
                left: sp.left,
                top: sp.top,
                fontSize: `${sp.size}px`,
                animationDelay: sp.delay,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      );
    }

    // Defeat overlays: gentle puff / floating bubbles / rally sparks
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {tier === 2 &&
          BUBBLE_POSITIONS.map((b, idx) => (
            <span
              key={idx}
              className="animate-cg-bubble-rise absolute rounded-full border border-white/75 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),rgba(255,155,230,0.28))]"
              style={{
                left: b.left,
                bottom: b.bottom,
                width: `${b.size}px`,
                height: `${b.size}px`,
                animationDelay: b.delay,
              }}
            />
          ))}
        {tier === 1 && (
          <div className="animate-cg-smoke-drift absolute left-1/2 top-[30%] -translate-x-1/2 w-12 h-12 rounded-full bg-pink-200/25 blur-md" />
        )}
        {tier === 3 && (
          <div className="animate-cg-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent skew-x-[-18deg]" />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="relative w-full">
        <button
          type="button"
          disabled={!allowFullscreen}
          onClick={() => allowFullscreen && setFullscreen(true)}
          aria-label={allowFullscreen ? `${title} — ${t('tapCgZoomHint')}` : title}
          className={`group relative block w-full overflow-hidden rounded-[18px] border-[3px] border-[#FFE875] shadow-[0_6px_16px_rgba(44,14,4,0.45)] bg-[#2D104F] text-left ${
            allowFullscreen ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className={`relative w-full overflow-hidden ${compact ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
            <img
              src={entry.imageSrc}
              alt={title}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${
                outcome === 'victory' ? 'animate-cg-kenburns' : 'animate-cg-gentle-settle'
              }`}
            />
            {renderAnimatedOverlay()}

            {/* Bottom readability scrim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#240942]/88 via-[#240942]/38 to-transparent" />

            {/* Top-left Tier Badge */}
            <div
              className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full border text-[10px] font-black shadow-md ${badgePalette}`}
            >
              {badge}
            </div>

            {/* Top-right Zoom Affordance */}
            {allowFullscreen && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#240942]/65 border border-[#FFE875]/75 text-[#FFF7D6] flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Maximize2 className="w-3 h-3" />
              </span>
            )}

            {/* Bottom Caption Overlay */}
            <div className="absolute inset-x-2.5 bottom-2 text-left">
              <div className="font-game-display text-[17px] leading-tight font-bold text-[#FFF9D6] game-stroke-sm">
                {title}
              </div>
              <p className="text-[10.5px] font-bold text-[#FFF2D6]/95 leading-snug mt-0.5 line-clamp-2 drop-shadow">
                {caption}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Fullscreen Immersive CG Viewer */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setFullscreen(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#180630]/92 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[390px] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full border text-xs font-black shadow ${badgePalette}`}>
                {badge}
              </span>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                aria-label={t('closePreview')}
                className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer"
              >
                <Close3DIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[22px] border-[4px] border-[#FFE875] shadow-[0_14px_34px_rgba(0,0,0,0.65)]">
              <img
                src={entry.imageSrc}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover animate-cg-kenburns"
              />
              {renderAnimatedOverlay()}
            </div>

            <div className="candy-panel-purple px-4 py-3 text-center">
              <h3 className="font-game-display text-xl font-bold text-[#FFE96B] game-stroke-sm">
                {title}
              </h3>
              <p className="text-xs font-bold text-[#F3E6FF] mt-1 leading-relaxed">{caption}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
