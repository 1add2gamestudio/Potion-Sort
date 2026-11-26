import React, { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, Crown, Eye, Gift, Play, Sparkles, Tv, Vibrate } from 'lucide-react';
import type { AdRequest } from '../game/adService';
import { MONETIZATION_ENABLED } from '../game/adService';
import { getDailyCalendarStates, type DailyRewardGrant } from '../game/dailyReward';
import { isNativeHapticsSupported, triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { playPickupClink, playUiClick } from '../game/sound';
import {
  CONTINUE_COIN_COST,
  FULL_LIVES_COIN_COST,
  SINGLE_LIFE_COIN_COST,
  getNextLifeCountdownMs,
} from '../game/storage';
import type {
  CgTier,
  IngredientId,
  LanguageCode,
  PlayModal,
  PlayerProfile,
} from '../game/types';
import {
  Check3DIcon,
  Close3DIcon,
  Coin3DIcon,
  ExtraBottle3DIcon,
  Heart3DIcon,
  Restart3DIcon,
  ShieldCheck3DIcon,
  Shuffle3DIcon,
  SoundOff3DIcon,
  SoundOn3DIcon,
  StreakFlame3DIcon,
  Undo3DIcon,
} from './GameIcons3D';
import { OutcomeCgCard } from './OutcomeCgCard';

export interface VictorySnapshot {
  levelNumber: number;
  levelTitle: string;
  isTrial: boolean;
  trialId?: string | null;
  isPracticeReplay?: boolean;
  moves: number;
  elapsedSec: number;
  coinsEarned: number;
  starsEarned: number;
  ingredient: IngredientId;
  doubled?: boolean;
  cgTier: CgTier;
  newlyUnlockedCgCoins?: number | null;
}

export interface DefeatSnapshot {
  completedBottles: number;
  totalBottles: number;
  extraFlasksUsed?: number;
  cgTier: CgTier;
  newlyUnlockedCgCoins?: number | null;
}

interface GameModalsProps {
  modal: PlayModal;
  isTrialMode?: boolean;
  profile: PlayerProfile;
  nowMs: number;
  victorySnapshot: VictorySnapshot | null;
  defeatSnapshot: DefeatSnapshot | null;
  adRequest: AdRequest | null;
  dailyReward: DailyRewardGrant | null;
  onCloseModal: () => void;
  onClaimDailyReward: () => void;
  onResume: () => void;
  onRestartConfirm: () => void;
  onExitToHome: () => void;
  onNextLevel: () => void;
  onContinueAfterDefeat: () => void;
  onRetryAfterDefeat: () => void;
  onTriggerAd: (req: AdRequest) => void;
  onCompleteAd: () => void;
  onOpenRemoveAds: () => void;
  onConfirmRemoveAds: () => void;
  onBuySingleLife: () => void;
  onRefillLivesWithCoins: () => void;
  onToggleSetting: (
    key: 'soundEnabled' | 'bgmEnabled' | 'hapticsEnabled' | 'colorSymbolsEnabled'
  ) => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  onResetSave: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  modal,
  isTrialMode = false,
  profile,
  nowMs,
  victorySnapshot,
  defeatSnapshot,
  adRequest,
  dailyReward,
  onCloseModal,
  onClaimDailyReward,
  onResume,
  onRestartConfirm,
  onExitToHome,
  onNextLevel,
  onContinueAfterDefeat,
  onRetryAfterDefeat,
  onTriggerAd,
  onCompleteAd,
  onOpenRemoveAds,
  onConfirmRemoveAds,
  onBuySingleLife,
  onRefillLivesWithCoins,
  onToggleSetting,
  onSelectLanguage,
  onResetSave,
}) => {
  const { t, ingredientName } = useI18n();
  const [adSecondsLeft, setAdSecondsLeft] = useState(2);
  const [hapticJustTested, setHapticJustTested] = useState(false);
  const hapticTestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nativeHaptics = isNativeHapticsSupported();

  const tapFeedback = () => {
    playUiClick(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
  };

  useEffect(() => {
    return () => {
      if (hapticTestTimerRef.current) {
        clearTimeout(hapticTestTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (modal !== 'AD_SIMULATION') return;
    setAdSecondsLeft(2);
    const t1 = setTimeout(() => setAdSecondsLeft(1), 850);
    const t2 = setTimeout(() => setAdSecondsLeft(0), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [modal, adRequest]);

  if (modal === 'NONE') return null;

  const lifeCountdownMs = getNextLifeCountdownMs(profile, nowMs);
  const lifeMin = Math.floor(Math.ceil(lifeCountdownMs / 1000) / 60);
  const lifeSec = Math.ceil(lifeCountdownMs / 1000) % 60;

  const handleTestHaptics = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSemanticHaptic(true, 'test');
    playPickupClink(profile.soundEnabled);
    setHapticJustTested(true);
    if (hapticTestTimerRef.current) {
      clearTimeout(hapticTestTimerRef.current);
    }
    hapticTestTimerRef.current = setTimeout(() => {
      setHapticJustTested(false);
      hapticTestTimerRef.current = null;
    }, 900);
  };

  const reachedMaxContinueFlasks = (defeatSnapshot?.extraFlasksUsed ?? 0) >= 3;
  const canContinueWithFlask = profile.boosters.extraFlask > 0;
  const canContinueWithCoins = profile.coins >= CONTINUE_COIN_COST;
  const canContinueWithEconomy =
    !reachedMaxContinueFlasks && (canContinueWithFlask || canContinueWithCoins);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#3E1B04]/60 p-3.5 pt-[max(env(safe-area-inset-top),14px)] pb-[max(env(safe-area-inset-bottom),14px)] font-game-body"
    >
      <div className="candy-panel-frame w-full max-w-[348px] max-h-[92dvh] overflow-y-auto p-3.5 text-[#4A2305]">
        {/* PAUSED */}
        {modal === 'PAUSED' && (
          <div className="space-y-3.5">
            <div className="text-center">
              <h2 className="font-game-display text-2xl font-bold text-[#FFF9D6] game-stroke-md">
                {t('pauseTitle')}
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1">
                {isTrialMode
                  ? t('pauseTrialTip')
                  : profile.streak > 0
                  ? t('pauseStreakWarn', { n: profile.streak })
                  : t('pauseRelaxTip')}
              </p>
            </div>

            <div className="candy-card-cream p-3 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onResume();
                }}
                className="candy-btn-green-pill w-full py-3 text-white font-game-display font-bold text-base game-stroke-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t('resumeBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onRestartConfirm();
                }}
                className="candy-btn-amber w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Restart3DIcon className="w-4 h-4" />
                <span>{isTrialMode ? t('restartTrialBtn') : t('restartLevelBtn')}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onToggleSetting('soundEnabled');
                  }}
                  className="candy-pill-cream py-2 px-2 text-xs font-black text-[#4A2305] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {profile.soundEnabled ? (
                    <SoundOn3DIcon className="w-4 h-4 shrink-0" />
                  ) : (
                    <SoundOff3DIcon className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profile.soundEnabled ? t('soundOn') : t('soundMuted')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onToggleSetting('colorSymbolsEnabled');
                  }}
                  className="candy-pill-cream py-2 px-2 text-xs font-black text-[#4A2305] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5 text-[#134DF0] shrink-0" />
                  <span>
                    {profile.colorSymbolsEnabled ? t('symbolsOn') : t('symbolsOff')}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onExitToHome();
              }}
              className="w-full py-1.5 text-xs font-black text-[#FFF7DF] hover:text-white cursor-pointer"
            >
              {t('quitToHome')}
            </button>
          </div>
        )}

        {/* VICTORY WITH 3-TIER PROGRESSIVE CG */}
        {modal === 'VICTORY' && victorySnapshot && (
          <div className="space-y-3">
            {/* Level Header Chip */}
            <div className="text-center">
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#FFF9E6] text-[#8A4105] text-[10px] font-black border border-[#FFF1AD]">
                {victorySnapshot.isTrial
                  ? victorySnapshot.levelTitle
                  : t('levelCta', { n: victorySnapshot.levelNumber })}
              </div>
            </div>

            {/* 3-Tier Progressive Victory CG Hero Card */}
            <OutcomeCgCard outcome="victory" tier={victorySnapshot.cgTier} />

            {/* Newly Unlocked CG Achievement Banner */}
            {victorySnapshot.newlyUnlockedCgCoins && victorySnapshot.newlyUnlockedCgCoins > 0 && (
              <div className="rounded-xl px-2.5 py-1.5 bg-gradient-to-r from-[#FFE580] via-[#FFF3B0] to-[#FFE070] border-2 border-[#FFF8D6] text-[11px] font-black text-[#6B2B03] flex items-center justify-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-[#D96B08] shrink-0" />
                <span>
                  {t('achievementNewBanner', { n: victorySnapshot.newlyUnlockedCgCoins })}
                </span>
              </div>
            )}

            {/* Stats & Rewards */}
            <div className="candy-card-cream p-2.5 space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">{t('statTime')}</div>
                  <div className="text-sm font-black font-tabular">
                    {formatTime(victorySnapshot.elapsedSec)}
                  </div>
                </div>
                <div className="p-1.5 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">{t('statMoves')}</div>
                  <div className="text-sm font-black font-tabular">
                    {victorySnapshot.moves}
                  </div>
                </div>
                <div className="p-1.5 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">{t('statStreak')}</div>
                  <div className="text-sm font-black font-tabular text-[#E81938]">
                    x{profile.streak}
                  </div>
                </div>
              </div>

              <div className="rounded-xl px-2.5 py-2 bg-[#FFEAB8] border-2 border-[#EFA929] flex items-center justify-between text-xs font-black font-tabular">
                <span className="text-[#874B00]">
                  {t('rewardCoins', { n: victorySnapshot.coinsEarned })}
                </span>
                {victorySnapshot.starsEarned > 0 && (
                  <span className="text-[#134DF0]">
                    {t('rewardStars', { n: victorySnapshot.starsEarned })}
                  </span>
                )}
                <span className="text-[#0E7D68]">
                  {t('rewardEssence', { name: ingredientName(victorySnapshot.ingredient, true) })}
                </span>
              </div>

              {victorySnapshot.isPracticeReplay && (
                <div className="rounded-xl px-2.5 py-1 bg-[#FFF3D1] border border-[#E6B85C] text-[10px] font-bold text-[#7A440B] text-center">
                  {t('replayPracticeNotice')}
                </div>
              )}

              {MONETIZATION_ENABLED && !profile.adsRemoved && (
                <div className="rounded-xl px-2.5 py-1.5 bg-[#FFF3D1] border border-[#E6B85C] text-[10px] font-bold text-[#7A440B] flex items-center justify-between gap-2">
                  <span className="truncate">{t('adTipLine')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      onOpenRemoveAds();
                    }}
                    className="font-black text-[#134DF0] underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t('removeAdsLink')}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                  onNextLevel();
                }}
                className="candy-btn-green-pill w-full py-3 text-white font-game-display font-bold text-lg game-stroke-md cursor-pointer"
              >
                {victorySnapshot.isTrial ? t('backToFestivalBtn') : t('nextLevelBtn')}
              </button>

              {MONETIZATION_ENABLED && !victorySnapshot.doubled && (
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onTriggerAd({
                      kind: 'rewarded_2x_coins',
                      label: t('adLabel2xCoins', { n: victorySnapshot.coinsEarned }),
                    });
                  }}
                  className="candy-btn-blue-pill w-full py-2.5 text-white text-xs font-black game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-4 h-4 shrink-0" />
                  <span>{t('doubleCoinsBtn')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onExitToHome();
                }}
                className="w-full py-1 text-xs font-black text-[#FFF7DF] hover:text-white cursor-pointer"
              >
                {t('returnHomeBtn')}
              </button>
            </div>
          </div>
        )}

        {/* DEFEAT WITH 3-TIER PROGRESSIVE COMEDIC CG (Dual-Track: Economy + Rewarded Video) */}
        {modal === 'DEFEAT' && defeatSnapshot && (
          <div className="space-y-3 text-center">
            <div className="inline-block px-3 py-0.5 rounded-full bg-[#E81938] text-white text-[10px] font-black font-tabular">
              {t('defeatBottlesProgress', {
                done: defeatSnapshot.completedBottles,
                total: defeatSnapshot.totalBottles,
              })}
            </div>

            {/* 3-Tier Progressive Defeat CG Hero Card */}
            <OutcomeCgCard outcome="defeat" tier={defeatSnapshot.cgTier} />

            {/* Newly Unlocked Defeat CG Achievement Banner */}
            {defeatSnapshot.newlyUnlockedCgCoins && defeatSnapshot.newlyUnlockedCgCoins > 0 && (
              <div className="rounded-xl px-2.5 py-1.5 bg-gradient-to-r from-[#FFE580] via-[#FFF3B0] to-[#FFE070] border-2 border-[#FFF8D6] text-[11px] font-black text-[#6B2B03] flex items-center justify-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-[#D96B08] shrink-0" />
                <span>
                  {t('achievementNewBanner', { n: defeatSnapshot.newlyUnlockedCgCoins })}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {/* Track 1: Rewarded Video Free Continue */}
              {MONETIZATION_ENABLED && !reachedMaxContinueFlasks && (
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onTriggerAd({
                    kind: 'rewarded_continue',
                    label: t('adLabelContinue'),
                  });
                }}
                className="candy-btn-green-pill w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>{t('continueAdBtn')}</span>
              </button>
              )}

              {/* Track 2: Flask / Coins Continue */}
              <button
                type="button"
                disabled={!canContinueWithEconomy}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                  onContinueAfterDefeat();
                }}
                className="candy-btn-amber w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed font-tabular"
              >
                <ExtraBottle3DIcon className="w-4 h-4 shrink-0" />
                <span>
                  {reachedMaxContinueFlasks
                    ? t('continueMaxFlasksBtn')
                    : canContinueWithFlask
                    ? t('continueWithFlaskBtn', { n: profile.boosters.extraFlask })
                    : t('continueWithCoinsBtn', { cost: CONTINUE_COIN_COST })}
                </span>
              </button>

              <button
                type="button"
                data-start="true"
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                  onRetryAfterDefeat();
                }}
                className="candy-btn-blue-pill w-full py-2.5 text-white font-black text-sm game-stroke-sm cursor-pointer"
              >
                {isTrialMode ? t('tryAgainTrialBtn') : t('tryAgainBtn')}
              </button>

              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onExitToHome();
                }}
                className="w-full py-1 text-xs font-black text-[#FFF7DF] cursor-pointer"
              >
                {t('returnHomeBtn')}
              </button>
            </div>
          </div>
        )}

        {/* NO LIVES (Dual-Track: Rewarded Video + Coin Refills) */}
        {modal === 'NO_LIVES' && (
          <div className="space-y-3.5 text-center">
            <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
              <Heart3DIcon className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-game-display text-2xl font-bold text-[#FFF9D6] game-stroke-md">
                {t('livesTitle')}
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1 font-tabular">
                {profile.lives < profile.maxLives
                  ? t('livesNextIn', {
                      time: `${String(lifeMin).padStart(2, '0')}:${String(lifeSec).padStart(2, '0')}`,
                    })
                  : t('livesFullDesc')}
              </p>
            </div>

            <div className="space-y-2">
              {MONETIZATION_ENABLED && (
              <button
                type="button"
                disabled={profile.lives >= profile.maxLives}
                onClick={() => {
                  tapFeedback();
                  onTriggerAd({
                    kind: 'rewarded_life',
                    label: t('adLabelLife'),
                  });
                }}
                className="candy-btn-green-pill w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>{t('freeLifeAdBtn')}</span>
              </button>
              )}

              <button
                type="button"
                disabled={profile.coins < SINGLE_LIFE_COIN_COST || profile.lives >= profile.maxLives}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                  onBuySingleLife();
                }}
                className="candy-btn-amber w-full py-2.5 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-not-allowed font-tabular"
              >
                {t('buyOneLifeCoinsBtn', { cost: SINGLE_LIFE_COIN_COST })}
              </button>

              <button
                type="button"
                disabled={profile.coins < FULL_LIVES_COIN_COST || profile.lives >= profile.maxLives}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                  onRefillLivesWithCoins();
                }}
                className="candy-btn-blue-pill w-full py-2.5 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-not-allowed font-tabular"
              >
                {t('refillLivesCoinsBtn', { cost: FULL_LIVES_COIN_COST })}
              </button>

              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onCloseModal();
                }}
                className="w-full py-1.5 text-xs font-black text-[#FFF7DF] cursor-pointer"
              >
                {t('closeBtn')}
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {modal === 'SETTINGS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-game-display text-xl font-bold text-[#FFF9D6] game-stroke-sm">
                {t('settingsTitle')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onCloseModal();
                }}
                aria-label={t('closeBtn')}
                className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer"
              >
                <Close3DIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="candy-card-cream p-2.5 space-y-2 text-xs">
              {/* Language Switcher Row */}
              <div className="candy-pill-cream w-full px-3 py-1.5 flex items-center justify-between font-black text-[#4A2305]">
                <span>{t('settingLanguage')}</span>
                <div className="flex items-center gap-1 bg-[#EBD9B7] p-0.5 rounded-full">
                  {(['en', 'zh'] as LanguageCode[]).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        tapFeedback();
                        onSelectLanguage(code);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors whitespace-nowrap ${
                        profile.language === code
                          ? 'bg-[#6D23E8] text-[#FFE875] shadow-sm'
                          : 'text-[#6A3E14] hover:text-[#4A2305]'
                      }`}
                    >
                      {code === 'zh' ? '中文' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>

              {/* BGM & SFX & Color Symbols */}
              {[
                { key: 'bgmEnabled' as const, label: t('settingBgm') },
                { key: 'soundEnabled' as const, label: t('settingSfx') },
                { key: 'colorSymbolsEnabled' as const, label: t('settingSymbols') },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onToggleSetting(item.key);
                  }}
                  className="candy-pill-cream w-full px-3 py-2 flex items-center justify-between font-black text-[#4A2305] cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${
                      profile[item.key]
                        ? 'bg-[#29B80A] text-white'
                        : 'bg-[#D6C7B2] text-[#5C452B]'
                    }`}
                  >
                    {profile[item.key] ? t('toggleOn') : t('toggleOff')}
                  </span>
                </button>
              ))}

              {/* Mobile Graduated Haptics Row with Live Test Button */}
              <div className="space-y-1">
                <div className="candy-pill-cream w-full px-3 py-1.5 flex items-center justify-between gap-2 font-black text-[#4A2305]">
                  <button
                    type="button"
                    onClick={() => {
                      playUiClick(profile.soundEnabled);
                      onToggleSetting('hapticsEnabled');
                      if (!profile.hapticsEnabled) {
                        triggerSemanticHaptic(true, 'pickup');
                      }
                    }}
                    className="flex-1 text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <Vibrate className="w-3.5 h-3.5 text-[#D66A00] shrink-0" />
                    <span className="truncate">{t('settingHaptics')}</span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {profile.hapticsEnabled && (
                      <button
                        type="button"
                        onClick={handleTestHaptics}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-transform whitespace-nowrap ${
                          hapticJustTested
                            ? 'bg-[#EA7607] text-white scale-95'
                            : 'bg-[#FFF1C2] border border-[#E0A134] text-[#7A3503]'
                        }`}
                      >
                        {hapticJustTested ? t('testHapticSent') : t('testHapticBtn')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        playUiClick(profile.soundEnabled);
                        onToggleSetting('hapticsEnabled');
                        if (!profile.hapticsEnabled) {
                          triggerSemanticHaptic(true, 'pickup');
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer whitespace-nowrap ${
                        profile.hapticsEnabled
                          ? 'bg-[#29B80A] text-white'
                          : 'bg-[#D6C7B2] text-[#5C452B]'
                      }`}
                    >
                      {profile.hapticsEnabled ? t('toggleOn') : t('toggleOff')}
                    </button>
                  </div>
                </div>
                {profile.hapticsEnabled && !nativeHaptics && (
                  <p className="px-2 text-[9.5px] font-bold text-[#8A5A1A] leading-snug">
                    {t('hapticsFallbackNote')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {MONETIZATION_ENABLED && (
              <button
                type="button"
                disabled={profile.adsRemoved}
                onClick={() => {
                  tapFeedback();
                  onOpenRemoveAds();
                }}
                className="candy-btn-gold w-full py-2.5 text-white text-xs font-black game-stroke-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default"
              >
                <ShieldCheck3DIcon className="w-5 h-5 shrink-0" />
                <span>
                  {profile.adsRemoved ? t('removeAdsOwned') : t('removeAdsBuy')}
                </span>
              </button>
              )}

              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onResetSave();
                }}
                className="w-full py-1 text-[11px] font-black text-[#FFF7DF] hover:underline cursor-pointer"
              >
                {t('resetProgressBtn')}
              </button>
            </div>
          </div>
        )}

        {/* REMOVE ADS ENTITLEMENT CONFIRMATION (Pure Remove Ads — no bonus coin pack) */}
        {modal === 'REMOVE_ADS_CONFIRM' && (
          <div className="space-y-3.5 text-center">
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-center">
                <div className="candy-card-cream w-16 h-16 flex items-center justify-center">
                  <ShieldCheck3DIcon className="w-11 h-11" />
                </div>
                <h2 className="font-game-display text-2xl font-bold text-[#FFF9D6] game-stroke-md mt-2 leading-tight">
                  {t('removeAdsModalTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onCloseModal();
                }}
                aria-label={t('closeBtn')}
                className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Close3DIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#FFF5DB] -mt-1 px-2 leading-snug">
              {t('removeAdsModalSubtitle')}
            </p>

            <div className="candy-card-cream p-3.5 space-y-2.5 text-left text-xs font-bold text-[#5A2906]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#24B80A] shrink-0 mt-0.5" />
                <span className="leading-snug">{t('removeAdsBenefit1')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#24B80A] shrink-0 mt-0.5" />
                <span className="leading-snug">{t('removeAdsBenefit2')}</span>
              </div>
            </div>

            {profile.adsRemoved ? (
              <div className="space-y-2">
                <div className="w-full py-2.5 rounded-2xl bg-[#24B80A] border-2 border-[#FFF2B2] text-white text-xs font-black">
                  {t('removeAdsOwned')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onCloseModal();
                  }}
                  className="w-full py-1 text-xs font-black text-[#FFF7DF] cursor-pointer"
                >
                  {t('closeBtn')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerSemanticHaptic(profile.hapticsEnabled, 'victory1');
                    onConfirmRemoveAds();
                  }}
                  className="candy-btn-gold w-full py-3 text-white font-game-display font-bold text-base game-stroke-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck3DIcon className="w-5 h-5 shrink-0" />
                  <span>{t('removeAdsConfirmBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onCloseModal();
                  }}
                  className="w-full py-1 text-xs font-black text-[#FFF7DF] cursor-pointer"
                >
                  {t('closeBtn')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* INTERSTITIAL & OPTIONAL REWARDED VIDEO AD CONTAINER */}
        {modal === 'AD_SIMULATION' && adRequest && (
          <div className="space-y-3.5 text-center">
            <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
              {adRequest.isInterstitial ? (
                <Tv className="w-8 h-8 text-[#6D23E8]" />
              ) : (
                <Sparkles className="w-7 h-7 text-[#EA7607]" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#FFF9D6]">
                {adRequest.isInterstitial ? t('interstitialTag') : t('rewardVideoTag')}
              </div>
              <h2 className="font-game-display text-lg font-bold text-white game-stroke-sm mt-1">
                {adRequest.isInterstitial ? t('interstitialTitle') : adRequest.label}
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1 font-tabular">
                {adSecondsLeft > 0
                  ? adRequest.isInterstitial
                    ? t('interstitialCountdown', { s: adSecondsLeft })
                    : t('rewardVideoPlaying', { s: adSecondsLeft })
                  : adRequest.isInterstitial
                  ? t('interstitialReady')
                  : t('rewardVideoReady')}
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={adSecondsLeft > 0}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                  onCompleteAd();
                }}
                className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-wait flex items-center justify-center gap-1.5"
              >
                <StreakFlame3DIcon className="w-4 h-4" />
                <span>
                  {adSecondsLeft > 0
                    ? t('pleaseWait')
                    : adRequest.isInterstitial
                    ? t('interstitialContinueBtn')
                    : t('claimRewardBtn')}
                </span>
              </button>

              {adRequest.isInterstitial && !profile.adsRemoved && (
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onOpenRemoveAds();
                  }}
                  className="candy-btn-gold w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck3DIcon className="w-4 h-4 shrink-0" />
                  <span>{t('interstitialSkipWithNoAds')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 7-DAY VISUAL LOGIN CALENDAR MODAL */}
        {modal === 'DAILY_REWARD' && (() => {
          const cal = getDailyCalendarStates(
            profile.lastDailyRewardDate,
            profile.dailyLoginStreak,
            nowMs
          );
          const firstSix = cal.slots.slice(0, 6);
          const daySeven = cal.slots[6];
          const canClaimNow = cal.availableToday && Boolean(dailyReward);

          return (
            <div className="space-y-2.5 text-center">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 shrink-0" aria-hidden="true" />
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#8A4105] text-[10px] font-black border border-[#FFF1AD] font-tabular">
                    <Gift className="w-3 h-3 text-[#E86F16]" />
                    <span>{t('dailyRewardStreakBadge', { n: cal.displayStreak })}</span>
                  </div>
                  <h2 className="font-game-display text-xl font-bold text-[#FFF9D6] game-stroke-md mt-1 leading-tight">
                    {t('dailyRewardTitle')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    onCloseModal();
                  }}
                  aria-label={t('closeBtn')}
                  className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Close3DIcon className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] font-bold text-[#FFF5DB] -mt-1 px-1 leading-snug">
                {t('dailyRewardSubtitle')}
              </p>

              {/* 7-Day Visual Calendar Card */}
              <div className="candy-card-cream p-2.5 space-y-2">
                {/* Days 1–6 (3x2 Grid) */}
                <div className="grid grid-cols-3 gap-1.5">
                  {firstSix.map((slot) => {
                    const isClaimed = slot.status === 'claimed';
                    const isToday = slot.status === 'today';
                    const labelText =
                      slot.kind === 'coins'
                        ? t('dailyCalendarCoinsShort', { n: slot.coins ?? 50 })
                        : slot.boosterKey === 'undo'
                        ? t('dailyCalendarUndoShort', { n: slot.boosterAmount ?? 1 })
                        : slot.boosterKey === 'shuffle'
                        ? t('dailyCalendarShuffleShort', { n: slot.boosterAmount ?? 1 })
                        : t('dailyCalendarFlaskShort', { n: slot.boosterAmount ?? 1 });

                    return (
                      <div
                        key={slot.cycleDay}
                        className={`relative rounded-xl p-1.5 flex flex-col items-center justify-between min-h-[82px] transition-all ${
                          isToday
                            ? 'bg-gradient-to-b from-[#FFF7C2] to-[#FFDC7A] border-2 border-[#FF9B1A] ring-2 ring-[#FFE875] shadow-[0_3px_10px_rgba(232,126,12,0.3)]'
                            : isClaimed
                            ? 'bg-[#E3F9D8] border-2 border-[#52C43A]'
                            : 'bg-[#FFFBF0] border-2 border-[#E9CFA0]'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between gap-0.5">
                          <span
                            className={`text-[9.5px] font-black font-tabular leading-none ${
                              isToday
                                ? 'text-[#8A3B00]'
                                : isClaimed
                                ? 'text-[#187A0A]'
                                : 'text-[#8C5E22]'
                            }`}
                          >
                            {t('dailyCalendarDayLabel', { n: slot.cycleDay })}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#E81938] text-white text-[8px] font-black leading-none animate-pulse">
                              {t('dailyCalendarTodayTag')}
                            </span>
                          )}
                          {isClaimed && (
                            <Check3DIcon className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </div>

                        <div
                          className={`my-1 flex items-center justify-center ${
                            isClaimed ? 'opacity-65' : ''
                          }`}
                        >
                          {slot.kind === 'coins' ? (
                            <Coin3DIcon className="w-8 h-8 drop-shadow-sm" />
                          ) : slot.boosterKey === 'undo' ? (
                            <Undo3DIcon className="w-8 h-8 drop-shadow-sm" />
                          ) : slot.boosterKey === 'shuffle' ? (
                            <Shuffle3DIcon className="w-8 h-8 drop-shadow-sm" />
                          ) : (
                            <ExtraBottle3DIcon className="w-8 h-8 drop-shadow-sm" />
                          )}
                        </div>

                        <div
                          className={`text-[10.5px] font-black font-tabular leading-tight ${
                            isClaimed
                              ? 'text-[#187A0A] line-through decoration-[#29B80A]/60'
                              : isToday
                              ? 'text-[#6B2600]'
                              : 'text-[#5A2D08]'
                          }`}
                        >
                          {labelText}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day 7 Crowned Grand Reward Preview Banner */}
                <div
                  className={`relative rounded-2xl p-2.5 text-left border-2 overflow-hidden transition-all ${
                    daySeven.status === 'today'
                      ? 'bg-gradient-to-r from-[#7B2FF7] via-[#A030E8] to-[#D938B8] border-[#FFE875] ring-2 ring-[#FFE875] shadow-[0_6px_16px_rgba(115,32,212,0.45)]'
                      : daySeven.status === 'claimed'
                      ? 'bg-gradient-to-r from-[#239912] via-[#2EB819] to-[#1D8C5C] border-[#D7F7CD]'
                      : 'bg-gradient-to-r from-[#571BB8] via-[#6D23E8] to-[#8C2AD6] border-[#FFE875]/90'
                  }`}
                >
                  <div className="pointer-events-none absolute -right-5 -top-6 w-24 h-24 rounded-full bg-[#FFE875]/18 blur-md" />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFE875] text-[#5B2100] text-[9px] font-black">
                        <Crown className="w-3 h-3 text-[#C75B00] fill-[#FFCB05]" />
                        <span>{t('dailyCalendarDay7Tag')}</span>
                      </div>
                      <div className="font-game-display text-sm font-bold text-[#FFF9D6] game-stroke-xs leading-tight pt-0.5">
                        {t('dailyCalendarDay7Title')}
                      </div>
                      <div className="text-[10.5px] font-black text-[#FFE999] font-tabular">
                        {t('dailyCalendarDay7Summary')}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center -space-x-1.5 bg-[#2A095E]/55 px-2 py-1 rounded-xl border border-[#FFE875]/55">
                        <Coin3DIcon className="w-7 h-7 drop-shadow" />
                        <ExtraBottle3DIcon className="w-7 h-7 drop-shadow" />
                        <Undo3DIcon className="w-6 h-6 drop-shadow" />
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black font-tabular whitespace-nowrap ${
                          daySeven.status === 'claimed'
                            ? 'bg-[#D7F7CD] text-[#116E04]'
                            : daySeven.status === 'today'
                            ? 'bg-[#E81938] text-white animate-pulse'
                            : 'bg-[#260754]/80 text-[#FFE89A]'
                        }`}
                      >
                        {daySeven.status === 'claimed'
                          ? t('dailyCalendarClaimedTag')
                          : daySeven.status === 'today'
                          ? t('dailyCalendarDay7Ready')
                          : t('dailyCalendarCountdownHint', { n: cal.daysUntilGrandPrize })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              {canClaimNow ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={onClaimDailyReward}
                    className="candy-btn-green-pill w-full py-2.5 text-white font-game-display font-bold text-base game-stroke-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      {cal.activeCycleDay === 7
                        ? t('dailyRewardClaimGrandBtn')
                        : t('dailyRewardClaimDayBtn', { n: cal.activeCycleDay })}
                    </span>
                  </button>
                  <p className="text-[10px] font-bold text-[#FFF5DB]">
                    {t('dailyRewardComeBackHint')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#FFF5DB] px-2 leading-snug">
                    {t('dailyRewardAlreadyClaimed')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      onCloseModal();
                    }}
                    className="candy-btn-blue-pill w-full py-2.5 text-white font-game-display font-bold text-sm game-stroke-sm cursor-pointer"
                  >
                    {t('closeBtn')}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
