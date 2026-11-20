import React from 'react';

interface IconProps {
  className?: string;
}

const StaticUiIcon: React.FC<{ src: string; className: string }> = ({ src, className }) => (
  <img
    src={src}
    alt=""
    aria-hidden="true"
    draggable={false}
    referrerPolicy="no-referrer"
    className={`object-contain select-none pointer-events-none ${className}`}
  />
);

export const Coin3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-coin.png" className={className} />
);

export const Heart3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-heart.png" className={className} />
);

export const Gear3DIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <StaticUiIcon src="/assets/ui/icon-gear.png" className={className} />
);

export const PlusBadge3DIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <StaticUiIcon src="/assets/ui/icon-plus-badge.png" className={className} />
);

export const Shop3DIcon: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <StaticUiIcon src="/assets/ui/icon-shop.png" className={className} />
);

export const Trophy3DIcon: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <StaticUiIcon src="/assets/ui/icon-trophy.png" className={className} />
);

export const CastleHome3DIcon: React.FC<IconProps> = ({ className = 'w-11 h-11' }) => (
  <StaticUiIcon src="/assets/ui/icon-castle.png" className={className} />
);

export const Cauldron3DIcon: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <StaticUiIcon src="/assets/ui/icon-cauldron.png" className={className} />
);

export const Map3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-map.png" className={className} />
);

export const Undo3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-undo.png" className={className} />
);

export const Shuffle3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-shuffle.png" className={className} />
);

export const ExtraBottle3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-flask.png" className={className} />
);

export const Pause3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-pause.png" className={className} />
);

export const SoundOn3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-sound-on.png" className={className} />
);

export const SoundOff3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-sound-off.png" className={className} />
);

export const Restart3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-restart.png" className={className} />
);

export const StreakFlame3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-streak-flame.png" className={className} />
);

export const ShieldCheck3DIcon: React.FC<IconProps> = ({ className = 'w-7 h-7' }) => (
  <StaticUiIcon src="/assets/ui/icon-shield.png" className={className} />
);

export const Close3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-close.png" className={className} />
);

export const Back3DIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <StaticUiIcon src="/assets/ui/icon-back.png" className={className} />
);

export const Lock3DIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <StaticUiIcon src="/assets/ui/icon-lock.png" className={className} />
);

export const Check3DIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <StaticUiIcon src="/assets/ui/icon-check.png" className={className} />
);
