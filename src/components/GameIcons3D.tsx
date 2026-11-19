import React from 'react';

export const Coin3DIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="22" r="16" fill="#9A5B00" />
    <circle cx="20" cy="19" r="16" fill="#FFB914" stroke="#6E3B00" strokeWidth="2.5" />
    <circle cx="20" cy="19" r="11.5" fill="#FFDC42" stroke="#D98200" strokeWidth="1.5" />
    <polygon
      points="20,10.5 22.7,16 28.8,16.8 24.3,21 25.5,27 20,24 14.5,27 15.7,21 11.2,16.8 17.3,16"
      fill="#FFF4A8"
      stroke="#B36500"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <ellipse cx="14" cy="11" rx="4.5" ry="2.2" transform="rotate(-25 14 11)" fill="#FFFFFF" opacity="0.7" />
  </svg>
);

export const Heart3DIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <path
      d="M20 35 C20 35 5 25.5 5 14.5 C5 8.5 9.8 5 14.5 5 C17.5 5 19.2 6.8 20 8.5 C20.8 6.8 22.5 5 25.5 5 C30.2 5 35 8.5 35 14.5 C35 25.5 20 35 20 35 Z"
      fill="#FF2947"
      stroke="#6E071B"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path
      d="M11 11 C12 9 14.5 8.5 16 9.5"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      opacity="0.85"
    />
    <circle cx="10" cy="14.5" r="1.6" fill="#FFFFFF" opacity="0.8" />
  </svg>
);

export const Gear3DIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
    <path
      d="M15.4 4 L20.6 4 L21.6 7.8 C22.7 8.2 23.7 8.7 24.6 9.4 L28.2 7.8 L31.2 12.2 L28.2 14.9 C28.5 15.9 28.7 17 28.7 18 C28.7 19 28.5 20.1 28.2 21.1 L31.2 23.8 L28.2 28.2 L24.6 26.6 C23.7 27.3 22.7 27.8 21.6 28.2 L20.6 32 L15.4 32 L14.4 28.2 C13.3 27.8 12.3 27.3 11.4 26.6 L7.8 28.2 L4.8 23.8 L7.8 21.1 C7.5 20.1 7.3 19 7.3 18 C7.3 17 7.5 15.9 7.8 14.9 L4.8 12.2 L7.8 7.8 L11.4 9.4 C12.3 8.7 13.3 8.2 14.4 7.8 Z"
      fill="#FFFFFF"
      stroke="#1A1648"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <circle cx="18" cy="18" r="5.5" fill="#4678FA" stroke="#1A1648" strokeWidth="2.4" />
  </svg>
);

export const Shop3DIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <rect x="7" y="17" width="26" height="17" rx="3" fill="#FFCA57" stroke="#5E290A" strokeWidth="2.4" />
    <rect x="11" y="21" width="10" height="9" rx="1.5" fill="#70D6FF" stroke="#5E290A" strokeWidth="2" />
    <rect x="23" y="21" width="6" height="13" rx="1" fill="#C45329" stroke="#5E290A" strokeWidth="2" />
    <path d="M4 16 L8 7 L32 7 L36 16 C36 19 32 20 30 18 C28 20 24 20 22 18 C20 20 16 20 14 18 C12 20 8 20 4 16 Z" fill="#C44CFF" stroke="#4D1175" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M12 7 L11 18 M20 7 L20 18 M28 7 L29 18" stroke="#FFE6FF" strokeWidth="2.2" opacity="0.65" />
  </svg>
);

export const Trophy3DIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <path d="M11 10 C6 10 5 18 11 20 M29 10 C34 10 35 18 29 20" fill="none" stroke="#FFB715" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M10 8 L30 8 L28 21 C27.5 25 24 27 20 27 C16 27 12.5 25 12 21 Z" fill="#FFD12E" stroke="#6E3B00" strokeWidth="2.4" strokeLinejoin="round" />
    <rect x="17" y="27" width="6" height="5" fill="#F09800" stroke="#6E3B00" strokeWidth="2" />
    <rect x="12" y="32" width="16" height="4.5" rx="2" fill="#FFBD1A" stroke="#6E3B00" strokeWidth="2.2" />
    <polygon points="20,11 21.8,15 26,15.5 22.8,18.4 23.7,22.5 20,20.4 16.3,22.5 17.2,18.4 14,15.5 18.2,15" fill="#FFF7AE" />
  </svg>
);

export const CastleHome3DIcon: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <rect x="6" y="22" width="10" height="20" rx="2" fill="#FFD36B" stroke="#5C2D0C" strokeWidth="2.4" />
    <rect x="32" y="22" width="10" height="20" rx="2" fill="#FFD36B" stroke="#5C2D0C" strokeWidth="2.4" />
    <rect x="14" y="18" width="20" height="24" rx="2" fill="#FFE49E" stroke="#5C2D0C" strokeWidth="2.4" />
    <polygon points="5,22 11,12 17,22" fill="#B24CFF" stroke="#451073" strokeWidth="2.2" strokeLinejoin="round" />
    <polygon points="31,22 37,12 43,22" fill="#B24CFF" stroke="#451073" strokeWidth="2.2" strokeLinejoin="round" />
    <polygon points="12,18 24,4 36,18" fill="#D252FF" stroke="#451073" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M20 42 L20 31 A4 4 0 0 1 28 31 L28 42 Z" fill="#6F41B8" stroke="#361869" strokeWidth="2" />
    <circle cx="24" cy="22" r="2.8" fill="#4DE3FF" stroke="#361869" strokeWidth="1.6" />
  </svg>
);

export const Salons3DIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <path d="M8 7 L32 7 L32 28 L20 35 L8 28 Z" fill="#8C38FF" stroke="#F7C331" strokeWidth="2.6" strokeLinejoin="round" />
    <circle cx="15.5" cy="17" r="3.2" fill="#FFD23F" />
    <circle cx="24.5" cy="17" r="3.2" fill="#FFD23F" />
    <circle cx="20" cy="14" r="3.8" fill="#FFE97D" stroke="#6E3B00" strokeWidth="1.4" />
    <path d="M12 25 C12 21.5 28 21.5 28 25" fill="#FFCA28" stroke="#6E3B00" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Cauldron3DIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <ellipse cx="20" cy="13" rx="11" ry="4" fill="#FF66D4" stroke="#540D6E" strokeWidth="2.2" />
    <path d="M8 14 C8 28 11 33 20 33 C29 33 32 28 32 14 Z" fill="#7D2AE8" stroke="#2D0B5E" strokeWidth="2.4" />
    <ellipse cx="20" cy="13" rx="12" ry="3.5" fill="none" stroke="#F7C331" strokeWidth="2.4" />
    <circle cx="17" cy="9" r="3" fill="#FF8EE4" />
    <circle cx="24" cy="10" r="2.2" fill="#FFD166" />
    <circle cx="14" cy="21" r="2.5" fill="#B575FF" opacity="0.6" />
  </svg>
);

export const Undo3DIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
    <path
      d="M15 9 L6 16 L15 23 L15 18.5 C21 18.5 25 20.5 27 25.5 C27 17.5 22 13 15 13 Z"
      fill="#FFFFFF"
      stroke="#360D75"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
  </svg>
);

export const Shuffle3DIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
    <path
      d="M5 11 H11 L21 24 H27 V27 L33 22 L27 17 V20 H22.5 L12.5 7 H5 Z M5 24 H11 L14.5 19.5 L17 22.8 L12.5 28 H5 Z M19 13.5 L22.5 9 H27 V6 L33 11 L27 16 V13 H23.5 L21.2 16 Z"
      fill="#FFFFFF"
      stroke="#360D75"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExtraBottle3DIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
    <path d="M10 15 V21 M7 18 H13" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <path
      d="M21 7 H27 V11 L30 14 V28 C30 29.5 28.5 30.5 27 30.5 H21 C19.5 30.5 18 29.5 18 28 V14 L21 11 Z"
      fill="#FFFFFF"
      stroke="#360D75"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="20" y="6" width="8" height="3" rx="1.5" fill="#FFD147" stroke="#360D75" strokeWidth="1.4" />
  </svg>
);
