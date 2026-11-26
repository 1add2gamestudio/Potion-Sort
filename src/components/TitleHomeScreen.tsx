import React, { useState } from 'react';
import { Award, Gift } from 'lucide-react';
import { CG_ACHIEVEMENTS } from '../game/achievements';
import { MONETIZATION_ENABLED } from '../game/adService';
import { isDailyRewardAvailable } from '../game/dailyReward';
import { triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import {
  getAchievementsBadgeCount,
  getAlembicBadgeCount,
  getEventsBadgeCount,
  shouldShowDailyRewardDot,
} from '../game/notifications';
import { playUiClick } from '../game/sound';
import { getNextLifeCountdownMs } from '../game/storage';
import type { AppScreen, PlayerProfile } from '../game/types';
import {
  CastleHome3DIcon,
  Cauldron3DIcon,
  Coin3DIcon,
  Gear3DIcon,
  Heart3DIcon,
  Map3DIcon,
  PlusBadge3DIcon,
  ShieldCheck3DIcon,
  Shop3DIcon,
  StreakFlame3DIcon,
  Trophy3DIcon,
} from './GameIcons3D';
import solsticeHome3dSceneImg from '../assets/images/solstice_home_3d_scene_1794980022597.jpg';
import solsticeMascotAvatarImg from '../assets/images/solstice_mascot_avatar_1794980022747.jpg';

interface TitleHomeScreenProps {
  profile: PlayerProfile;
  nowMs: number;
  onPlayLevel: (levelNumber: number) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenSettings: () => void;
  onOpenLivesModal: () => void;
  onOpenDailyReward: () => void;
  onOpenRemoveAds: () => void;
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
  onOpenDailyReward,
  onOpenRemoveAds,
}) => {
  const { t } = useI18n();
  const [showStreakTip, setShowStreakTip] = useState(false);

  const tapFeedback = () => {
    playUiClick(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
  };

  const lifeCountdown = getNextLifeCountdownMs(profile, nowMs);
  const alembicBadgeCount = getAlembicBadgeCount(profile);
  const eventsBadgeCount = getEventsBadgeCount(profile);
  const achievementsBadgeCount = getAchievementsBadgeCount(profile);
  const dailyAvailable = isDailyRewardAvailable(profile.lastDailyRewardDate, nowMs);
  const showDailyRedDot = shouldShowDailyRewardDot(profile, nowMs);

  const streakTiers = [
    { tier: 1, text: t('streakRule1'), active: profile.streak === 1 },
    { tier: 2, text: t('streakRule2'), active: profile.streak === 2 },
    { tier: 3, text: t('streakRule3'), active: profile.streak >= 3 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-game-body select-none">
      {/* Locked Sunlit Conservatory Key Art (Fox Alchemist + Sky Dragon + Purple Cauldron) */}
      <img
        src={solsticeHome3dSceneImg}
        alt={t('gameTitle')}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2E0E5E]/40 via-transparent to-[#2D104F]/48" />
      {/* Continue the bottom dock colour through the home-indicator safe area so the bar reads as full-bleed */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[var(--safe-bottom)] bg-[#3B108C]" />

      {/* TOP BAR (Avatar -> Achievements, Coins Pill, Hearts Pill, 3D Settings) */}
      <header className="relative z-20 px-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Fox Alchemist Mascot Portrait -> Achievements & Codex */}
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('ACHIEVEMENTS');
            }}
            aria-label={t('achievementsTitle')}
            className="relative w-12 h-12 rounded-2xl border-[3px] border-[#FFE875] bg-[#6D23E8] shadow-[0_4px_0_#2E0870] overflow-visible cursor-pointer shrink-0 active:translate-y-0.5"
          >
            <img
              src={solsticeMascotAvatarImg}
              alt={t('gameTitle')}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[13px]"
            />
            {achievementsBadgeCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#E81938] border-2 border-white text-white text-[10px] font-black flex items-center justify-center shadow font-tabular"
              >
                {achievementsBadgeCount}
              </span>
            )}
          </button>

          {/* Coins Pill (9-slice Cream-Gold Capsule) */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onNavigate('SHOP');
              }}
              aria-label={`${t('coinsLabel')} ${profile.coins}`}
              className="candy-pill-cream flex items-center pl-7 pr-3.5 py-1.5 text-[#5A2906] text-sm font-black font-tabular leading-none cursor-pointer"
            >
              <span>{profile.coins.toLocaleString()}</span>
            </button>
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

      {/* EDGE-RAIL FLOATING ICON BADGES (Balanced 2+2: Left Map+Daily, Right Streak+RemoveAds) */}
      <div className="relative z-20 flex-1 flex items-start justify-between px-2.5 pt-2 pointer-events-none">
        {/* Left Edge Rail: Level Map + Daily Gift */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
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

          {/* Daily Login Gift Shortcut */}
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onOpenDailyReward();
            }}
            aria-label={t('dailyRewardTitle')}
            className="relative candy-btn-purple w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer"
          >
            {showDailyRedDot && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E81938] border-2 border-white shadow animate-pulse"
              />
            )}
            <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#FFE680] to-[#F59B14] border border-[#FFF7C2] flex items-center justify-center shadow">
              <Gift className="w-4 h-4 text-[#6B2704]" />
            </div>
            <span className="text-[10px] font-black text-white leading-tight mt-0.5 game-stroke-xs whitespace-nowrap">
              {t('dailyBadge')}
            </span>
            <span className="mt-0.5 px-1.5 rounded-full bg-[#240657]/75 text-[#FFE97D] text-[9px] font-black font-tabular whitespace-nowrap">
              {dailyAvailable
                ? t('dailyClaimReady')
                : t('dailyDayShort', { n: Math.max(1, profile.dailyLoginStreak) })}
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
              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowStreakTip(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                    setShowStreakTip(false);
                  }
                }}
                className="absolute right-[72px] top-0 w-56 candy-panel-frame p-2.5 text-left z-30 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-[#FFF7D6]">
                  <span>{t('streakTooltipTitle', { n: profile.streak })}</span>
                  <span className="text-[10px] text-[#FFE89A] font-tabular">
                    {t('streakBestRecord', { n: profile.bestStreak })}
                  </span>
                </div>
                <div className="bg-[#FFF8E6] rounded-xl p-2 space-y-1 text-[10px] font-bold text-[#6E3B10]">
                  {profile.streak === 0 && (
                    <div className="text-[#8A5A1A] leading-snug pb-0.5">{t('streakTier0')}</div>
                  )}
                  {streakTiers.map((item) => (
                    <div
                      key={item.tier}
                      className={`px-1.5 py-0.5 rounded-lg leading-snug ${
                        item.active
                          ? 'bg-[#FFE596] text-[#5C2600] font-black border border-[#E89B1C]'
                          : 'opacity-80'
                      }`}
                    >
                      {item.active ? '★ ' : '· '}
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remove Ads / Ad-Free Entitlement Badge */}
          {MONETIZATION_ENABLED && (
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onOpenRemoveAds();
            }}
            aria-label={profile.adsRemoved ? t('adFreeBadge') : t('noAdsBadge')}
            className={`${
              profile.adsRemoved ? 'candy-btn-gold' : 'candy-btn-purple'
            } w-[66px] py-2 px-1 flex flex-col items-center cursor-pointer`}
          >
            <ShieldCheck3DIcon className="w-7 h-7 drop-shadow" />
            <span className="text-[10px] font-black text-white leading-tight mt-0.5 game-stroke-xs whitespace-nowrap">
              {profile.adsRemoved ? t('adFreeBadge') : t('noAdsBadge')}
            </span>
          </button>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Giant 9-Slice Candy-Green Play Button + 5-Tab Royal Purple & Gold Dock */}
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

        {/* 5-Tab Royal Violet-Purple & Gold Bottom Dock: Shop | Events | Home | Achievements | Alembic */}
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
            className="relative flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer border-r border-[#FFE875]/25"
          >
            <div className="relative">
              <Trophy3DIcon className="w-8 h-8 drop-shadow" />
              {eventsBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E81938] border border-white text-white text-[9px] font-black flex items-center justify-center font-tabular">
                  {eventsBadgeCount}
                </span>
              )}
            </div>
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

          {/* Achievements / CG Codex Tab (Replaces dead-end Salons!) */}
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              onNavigate('ACHIEVEMENTS');
            }}
            className="relative flex flex-col items-center justify-center py-1 rounded-xl hover:bg-white/12 cursor-pointer border-r border-[#FFE875]/25"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#F9B224] to-[#D96B08] border-2 border-[#FFF6C4] shadow-[0_2px_0_#7A3203] flex items-center justify-center">
                <Award className="w-5 h-5 text-[#5E2202] drop-shadow-sm" />
              </div>
              {achievementsBadgeCount > 0 ? (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E81938] border border-white text-white text-[9px] font-black flex items-center justify-center font-tabular">
                  {achievementsBadgeCount}
                </span>
              ) : (
                <span className="absolute -top-1.5 -right-2.5 px-1 rounded-full bg-[#240657]/90 border border-[#FFE875]/75 text-[#FFE97D] text-[8.5px] font-black font-tabular leading-tight">
                  {profile.unlockedCgs.length}/{CG_ACHIEVEMENTS.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black text-white game-stroke-xs mt-0.5 whitespace-nowrap">
              {t('navAchievements')}
            </span>
          </button>

          {/* Sun Alembic Tab (Unseen newly craftable recipe badge) */}
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
              {alembicBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#29B80A] border border-white text-white text-[9px] font-black flex items-center justify-center font-tabular">
                  {alembicBadgeCount}
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
