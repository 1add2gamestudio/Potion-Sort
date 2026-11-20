import React, { useState } from 'react';
import { triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { playUiClick } from '../game/sound';
import { getNextLifeCountdownMs } from '../game/storage';
import type { AppScreen, PlayerProfile } from '../game/types';
import {
  CastleHome3DIcon,
  Cauldron3DIcon,
  Coin3DIcon,
  Gear3DIcon,
  Heart3DIcon,
  Lock3DIcon,
  Map3DIcon,
  PlusBadge3DIcon,
  Salons3DIcon,
  ShieldCheck3DIcon,
  Shop3DIcon,
  StreakFlame3DIcon,
  Trophy3DIcon,
} from './GameIcons3D';

interface TitleHomeScreenProps {
  profile: PlayerProfile;
  nowMs: number;
  onPlayLevel: (levelNumber: number) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenSettings: () => void;
  onOpenLivesModal: () => void;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const TitleHomeScreen: React.FC<TitleHomeScreenProps> = ({
  profile,
  nowMs,
  onPlayLevel,
  onNavigate,
  onOpenSettings,
  onOpenLivesModal,
}) => {
  const { t } = useI18n();
  const [showStreakTip, setShowStreakTip] = useState(false);

  const tapFeedback = () => {
    playUiClick(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
  };

  const lifeCountdown = getNextLifeCountdownMs(profile, nowMs);
  const totalIngredients =
    profile.ingredients.citrus +
    profile.ingredients.crystal +
    profile.ingredients.dew +
    profile.ingredients.mist;

  const streakTierText =
    profile.streak >= 3
      ? t('streakTier3')
      : profile.streak === 2
      ? t('streakTier2')
      : profile.streak === 1
      ? t('streakTier1')
      : t('streakTier0');

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden font-game-body select-none">
      {/* Locked Sunlit Conservatory Key Art (Fox Alchemist + Sky Dragon + Purple Cauldron) */}
      <img
        src="/src/assets/images/solstice_home_3d_scene_1794980022597.jpg"
        alt={t('gameTitle')}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2E0E5E]/40 via-transparent to-[#2D104F]/48" />

      {/* TOP BAR (Avatar, Coins Pill, Hearts Pill, 3D Settings) */}
      <header className="relative z-20 pt-3.5 px-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Fox Alchemist Mascot Portrait */}
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('LEVEL_MAP');
            }}
            aria-label={t('mapTitle')}
            className="relative w-12 h-12 rounded-2xl border-[3px] border-[#FFE875] bg-[#6D23E8] shadow-[0_4px_0_#2E0870] overflow-visible cursor-pointer shrink-0 active:translate-y-0.5"
          >
            <img
              src="/src/assets/images/solstice_mascot_avatar_1794980022747.jpg"
              alt={t('gameTitle')}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[13px]"
            />
            {totalIngredients >= 3 && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#E81938] border-2 border-white text-white text-[11px] font-black flex items-center justify-center shadow"
              >
                !
              </span>
            )}
          </button>

          {/* Coins Pill (9-slice Cream-Gold Capsule) */}
          <div className="relative flex items-center">
            <div
              aria-label={`${t('coinsLabel')} ${profile.coins}`}
              className="candy-pill-cream flex items-center pl-7 pr-3.5 py-1.5 text-[#5A2906] text-sm font-black font-tabular leading-none"
            >
              <span>{profile.coins.toLocaleString()}</span>
            </div>
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Coin3DIcon className="w-8 h-8 drop-shadow" />
            </div>
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onNavigate('SHOP');
              }}
              aria-label={t('navShop')}
              className="absolute -bottom-1.5 left-3.5 z-10 w-[18px] h-[18px] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            >
              <PlusBadge3DIcon className="w-full h-full drop-shadow" />
            </button>
          </div>

          {/* Hearts / Lives Pill (9-slice Cream-Gold Capsule) */}
          <div className="relative flex items-center ml-1">
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onOpenLivesModal();
              }}
              aria-label={t('livesTitle')}
              className="candy-pill-cream flex items-center pl-7 pr-3.5 py-1.5 text-[#5A2906] text-sm font-black font-tabular leading-none cursor-pointer whitespace-nowrap"
            >
              <span>
                {profile.lives < profile.maxLives ? formatCountdown(lifeCountdown) : t('livesFull')}
              </span>
            </button>
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <Heart3DIcon className="w-8 h-8 drop-shadow" />
              <span className="absolute text-white font-game-display font-bold text-xs game-stroke-sm">
                {profile.lives}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onOpenLivesModal();
              }}
              aria-label={t('livesTitle')}
              className="absolute -bottom-1.5 left-3.5 z-10 w-[18px] h-[18px] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            >
              <PlusBadge3DIcon className="w-full h-full drop-shadow" />
            </button>
          </div>
        </div>

        {/* 3D Gear Settings Button (9-slice Blue Square) */}
        <button
          type="button"
          onClick={() => {
            tapFeedback();
            onOpenSettings();
          }}
          aria-label={t('settingsTitle')}
          className="candy-btn-blue w-11 h-11 flex items-center justify-center cursor-pointer shrink-0"
        >
          <Gear3DIcon className="w-7 h-7" />
        </button>
      </header>

      {/* ROYAL PURPLE-GOLD TITLE LOCKUP (9-Slice 3D Panel) */}
      <div className="relative z-20 px-4 pt-1 flex flex-col items-center">
        <div className="animate-gentle-float candy-panel-purple inline-flex flex-col items-center px-7 py-2 pointer-events-none">
          <h1 className="font-game-display text-[23px] leading-none font-bold tracking-wide text-[#FFE96B] game-stroke-md whitespace-nowrap">
            {t('gameTitle')}
          </h1>
          <span className="text-[10px] font-black tracking-[0.18em] text-[#F2E5FF] mt-1 whitespace-nowrap">
            {t('gameSubtitle')}
          </span>
        </div>
      </div>

      {/* EDGE-RAIL FLOATING ICON BADGES */}
      <div className="relative z-20 flex-1 flex items-start justify-between px-2.5 pt-2 pointer-events-none">
        {/* Left Edge Rail: Gala + Map */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('EVENT');
            }}
            aria-label={t('eventTitle')}
            className="candy-btn-purple w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer"
          >
            <Trophy3DIcon className="w-8 h-8" />
            <span className="text-[10px] font-black text-white leading-tight game-stroke-xs whitespace-nowrap">
              {t('galaBadge')}
            </span>
            <span className="mt-0.5 px-1.5 rounded-full bg-[#240657]/75 text-[#FFE97D] text-[9px] font-black font-tabular">
              {profile.eventStars}/100
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('LEVEL_MAP');
            }}
            aria-label={t('mapTitle')}
            className="candy-btn-blue w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer"
          >
            <Map3DIcon className="w-8 h-7 drop-shadow" />
            <span className="text-[10px] font-black text-white leading-tight mt-0.5 game-stroke-xs whitespace-nowrap">
              {t('mapBadge')}
            </span>
            <span className="mt-0.5 px-1.5 rounded-full bg-[#092F73]/75 text-[#FFF7DF] text-[9px] font-black font-tabular whitespace-nowrap">
              {t('levelShort', { n: profile.highestLevel })}
            </span>
          </button>
        </div>

        {/* Right Edge Rail: Solstice Streak + Remove Ads */}
        <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                setShowStreakTip((v) => !v);
              }}
              aria-label={t('streakBadge')}
              className="candy-btn-gold w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer"
            >
              <StreakFlame3DIcon className="w-7 h-7 drop-shadow" />
              <span className="text-[10px] font-black text-white leading-tight game-stroke-xs whitespace-nowrap">
                {t('streakBadge')}
              </span>
              <span className="mt-0.5 px-1.5 rounded-full bg-[#6E3402]/80 text-[#FFF7DF] text-[9px] font-black font-tabular whitespace-nowrap">
                {profile.streak > 0 ? `x${profile.streak}` : t('streakReady')}
              </span>
            </button>

            {showStreakTip && (
              <div className="absolute right-[72px] top-0 w-52 candy-panel-frame p-2.5 text-left z-30">
                <div className="text-[11px] font-black text-[#FFF7D6]">
                  {t('streakTooltipTitle', { n: profile.streak })}
                </div>
                <div className="text-[10px] font-bold text-[#4A2305] bg-[#FFF8E6] rounded-xl p-1.5 mt-1 leading-snug">
                  {streakTierText}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('SHOP');
            }}
            aria-label={profile.adsRemoved ? t('adFreeBadge') : t('noAdsBadge')}
            className="candy-btn-purple w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer"
          >
            <ShieldCheck3DIcon className="w-7 h-7 drop-shadow" />
            <span className="text-[10px] font-black text-white leading-tight mt-0.5 game-stroke-xs whitespace-nowrap">
              {profile.adsRemoved ? t('adFreeBadge') : t('noAdsBadge')}
            </span>
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Giant 9-Slice Candy-Green Play Button + Royal Violet-Purple 5-Tab Dock */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="w-full px-10 mb-5 flex flex-col items-center">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
              onPlayLevel(profile.highestLevel);
            }}
            className="candy-btn-green-pill w-full max-w-[244px] py-4 flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="font-game-display text-[28px] leading-none font-bold text-white game-stroke-lg tracking-wide whitespace-nowrap">
              {t('levelCta', { n: profile.highestLevel })}
            </span>
            {profile.streak > 0 && (
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#114D02]/85 text-[#FFE97D] text-[10px] font-black tracking-wide whitespace-nowrap">
                {t('streakBoostReady', { n: profile.streak })}
              </span>
            )}
          </button>
        </div>

        {/* 5-Tab Royal Violet-Purple & Gold Bottom Dock */}
        <nav
          aria-label="Primary game sections"
          className="w-full grid grid-cols-5 items-end bg-gradient-to-b from-[#6B2DE0] via-[#531EB8] to-[#3B108C] border-t-[3.5px] border-[#FFE875] shadow-[0_-4px_18px_rgba(32,6,72,0.5)] pt-1.5 pb-2 px-1"
        >
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('SHOP');
            }}
            className="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer border-r border-[#FFE875]/25"
          >
            <Shop3DIcon className="w-8 h-8 drop-shadow" />
            <span className="text-[10px] font-black text-white game-stroke-xs mt-0.5 whitespace-nowrap">
              {t('navShop')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('EVENT');
            }}
            className="flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer border-r border-[#FFE875]/25"
          >
            <Trophy3DIcon className="w-8 h-8 drop-shadow" />
            <span className="text-[10px] font-black text-white game-stroke-xs mt-0.5 whitespace-nowrap">
              {t('navEvents')}
            </span>
          </button>

          {/* Active Raised Center Home Tab */}
          <button
            type="button"
            onClick={() => {
              triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
              onPlayLevel(profile.highestLevel);
            }}
            aria-label={t('navHome')}
            className="relative -mt-5 pt-2 pb-1 flex flex-col items-center justify-center rounded-t-2xl bg-gradient-to-b from-[#7E3FF2] to-[#4A17B5] border-t-[3.5px] border-x-[3px] border-[#FFE875] shadow-[0_-4px_14px_rgba(32,6,72,0.45)] cursor-pointer"
          >
            <CastleHome3DIcon className="w-11 h-11 drop-shadow-md" />
            <span className="text-[12px] font-game-display font-bold text-white game-stroke-xs leading-none mt-0.5 whitespace-nowrap">
              {t('navHome')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('SALONS');
            }}
            className="relative flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer border-r border-[#FFE875]/25"
          >
            <div className="relative">
              <Salons3DIcon className="w-8 h-8 drop-shadow" />
              <span className="absolute -top-1 -right-1.5 w-4 h-4 flex items-center justify-center">
                <Lock3DIcon className="w-4 h-4 drop-shadow" />
              </span>
            </div>
            <span className="text-[10px] font-black text-white game-stroke-xs mt-0.5 whitespace-nowrap">
              {t('navSalons')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('ALEMBIC');
            }}
            className="relative flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer"
          >
            <div className="relative">
              <Cauldron3DIcon className="w-8 h-8 drop-shadow" />
              {totalIngredients > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E81938] border border-white text-white text-[9px] font-black flex items-center justify-center font-tabular">
                  {totalIngredients}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black text-white game-stroke-xs mt-0.5 whitespace-nowrap">
              {t('navAlembic')}
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};
