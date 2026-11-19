import React from 'react';

interface CabinetMascotsProps {
  cheering: boolean;
  onTriggerPreviewCheer: () => void;
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

export const CabinetMascots: React.FC<CabinetMascotsProps> = ({
  cheering,
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
          onClick={onTriggerPreviewCheer}
          aria-label="Fox alchemist companion"
          className="pointer-events-auto relative flex items-end justify-center cursor-pointer focus:outline-none"
        >
          <Render3DMascot who="fox" cheering={cheering} />
        </button>

        <button
          type="button"
          onClick={onTriggerPreviewCheer}
          aria-label="Sky dragon companion"
          className="pointer-events-auto relative flex items-end justify-center cursor-pointer focus:outline-none"
        >
          <Render3DMascot who="dragon" cheering={cheering} />
        </button>
      </div>
    </div>
  );
};
