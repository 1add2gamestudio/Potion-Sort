import React, { useEffect, useState } from 'react';
import { Eye, Image as ImageIcon, Play, Sparkles, Tv, Vibrate } from 'lucide-react';
import { isNativeHapticsSupported, triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { playPickupClink, playUiClick } from '../game/sound';
import { getNextLifeCountdownMs } from '../game/storage';
import type {
  Bottle,
  BottleStyleId,
  CgOutcome,
  CgTier,
  IngredientId,
  LanguageCode,
  PlayModal,
  PlayerProfile,
} from '../game/types';
import { BOTTLE_STYLE_LIST } from './bottleDesigns';
import { CrystalBottle } from './CrystalBottle';
import {
  Close3DIcon,
  Heart3DIcon,
  Restart3DIcon,
  ShieldCheck3DIcon,
  SoundOff3DIcon,
  SoundOn3DIcon,
  StreakFlame3DIcon,
} from './GameIcons3D';
import { OutcomeCgCard } from './OutcomeCgCard';

export interface VictorySnapshot {
  levelNumber: number;
  levelTitle: string;
  potionOrderName?: string;
  isTrial: boolean;
  trialId?: string | null;
  moves: number;
  elapsedSec: number;
  coinsEarned: number;
  starsEarned: number;
  ingredient: IngredientId;
  doubled: boolean;
  cgTier: CgTier;
}

export interface DefeatSnapshot {
  completedBottles: number;
  totalBottles: number;
  cgTier: CgTier;
}

export interface AdRequest {
  kind: 'rewarded_life' | 'rewarded_booster' | 'rewarded_2x_coins' | 'rewarded_continue';
  label: string;
  boosterKey?: 'undo' | 'shuffle' | 'extraFlask';
}

interface GameModalsProps {
  modal: PlayModal;
  profile: PlayerProfile;
  nowMs: number;
  victorySnapshot: VictorySnapshot | null;
  defeatSnapshot: DefeatSnapshot | null;
  adRequest: AdRequest | null;
  onCloseModal: () => void;
  onResume: () => void;
  onRestartConfirm: () => void;
  onExitToHome: () => void;
  onNextLevel: () => void;
  onRetryAfterDefeat: () => void;
  onTriggerAd: (req: AdRequest) => void;
  onCompleteAd: () => void;
  onRefillLivesWithCoins: () => void;
  onToggleSetting: (
    key: 'soundEnabled' | 'bgmEnabled' | 'hapticsEnabled' | 'colorSymbolsEnabled'
  ) => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectBottleStyle: (style: BottleStyleId) => void;
  onOpenBottleCompare: () => void;
  onOpenCgGallery: () => void;
  onPurchaseRemoveAds: () => void;
  onResetSave: () => void;
}

const SHOWCASE_BOTTLE: Bottle = {
  id: 'showcase',
  layers: [
    { color: 'coral', hidden: false },
    { color: 'citron', hidden: false },
    { color: 'azure', hidden: false },
  ],
  obstacle: { type: 'none' },
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  modal,
  profile,
  nowMs,
  victorySnapshot,
  defeatSnapshot,
  adRequest,
  onCloseModal,
  onResume,
  onRestartConfirm,
  onExitToHome,
  onNextLevel,
  onRetryAfterDefeat,
  onTriggerAd,
  onCompleteAd,
  onRefillLivesWithCoins,
  onToggleSetting,
  onSelectLanguage,
  onSelectBottleStyle,
  onOpenBottleCompare,
  onOpenCgGallery,
  onPurchaseRemoveAds,
  onResetSave,
}) => {
  const { t, potionOrderName, ingredientName, bottleDesignText } = useI18n();
  const [adSecondsLeft, setAdSecondsLeft] = useState(2);
  const [hapticJustTested, setHapticJustTested] = useState(false);
  const [cgGalleryTab, setCgGalleryTab] = useState<CgOutcome>('victory');

  const nativeHaptics = isNativeHapticsSupported();

  const tapFeedback = () => {
    playUiClick(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
  };

  useEffect(() => {
    if (modal !== 'AD_SIMULATION') return;
    setAdSecondsLeft(2);
    const t1 = setTimeout(() => setAdSecondsLeft(1), 700);
    const t2 = setTimeout(() => setAdSecondsLeft(0), 1400);
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
    setTimeout(() => setHapticJustTested(false), 900);
  };

  const cgTriggerLabels: Record<CgOutcome, Record<CgTier, string>> = {
    victory: {
      1: t('cgTriggerV1'),
      2: t('cgTriggerV2'),
      3: t('cgTriggerV3'),
    },
    defeat: {
      1: t('cgTriggerD1'),
      2: t('cgTriggerD2'),
      3: t('cgTriggerD3'),
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#3E1B04]/60 p-3.5 font-game-body"
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
                {profile.streak > 0
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
                <span>{t('restartLevelBtn')}</span>
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
                {victorySnapshot.potionOrderName
                  ? ` · ${potionOrderName(victorySnapshot.potionOrderName)}`
                  : ''}
              </div>
            </div>

            {/* 3-Tier Progressive Victory CG Hero Card */}
            <OutcomeCgCard outcome="victory" tier={victorySnapshot.cgTier} />

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
                <span className="text-[#134DF0]">
                  {t('rewardStars', { n: victorySnapshot.starsEarned })}
                </span>
                <span className="text-[#0E7D68]">
                  {t('rewardEssence', { name: ingredientName(victorySnapshot.ingredient, true) })}
                </span>
              </div>

              {!profile.adsRemoved && (
                <div className="rounded-xl px-2.5 py-1.5 bg-[#FFF3D1] border border-[#E6B85C] text-[10px] font-bold text-[#7A440B] flex items-center justify-between gap-2">
                  <span className="truncate">{t('adTipLine')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      onPurchaseRemoveAds();
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

              {!victorySnapshot.doubled && (
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

        {/* DEFEAT WITH 3-TIER PROGRESSIVE COMEDIC CG */}
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

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onTriggerAd({
                    kind: 'rewarded_continue',
                    label: t('adLabelContinue'),
                  });
                }}
                className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>{t('continueAdBtn')}</span>
              </button>

              <button
                type="button"
                data-start="true"
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                  onRetryAfterDefeat();
                }}
                className="candy-btn-blue-pill w-full py-3 text-white font-black text-sm game-stroke-sm cursor-pointer"
              >
                {t('tryAgainBtn')}
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

        {/* NO LIVES */}
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

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onTriggerAd({
                    kind: 'rewarded_life',
                    label: t('adLabelLife'),
                  });
                }}
                className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>{t('freeLifeAdBtn')}</span>
              </button>

              <button
                type="button"
                disabled={profile.coins < 150 || profile.lives >= profile.maxLives}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                  onRefillLivesWithCoins();
                }}
                className="candy-btn-blue-pill w-full py-3 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {t('refillLivesCoinsBtn')}
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
                  {(['zh', 'en'] as LanguageCode[]).map((code) => (
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

              {/* 6-CG Outcome Gallery Entry */}
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onOpenCgGallery();
                }}
                className="candy-pill-cream w-full px-3 py-2 flex items-center justify-between font-black text-[#4A2305] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#7126E8]" />
                  <span>{t('settingCgGallery')}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E86F16] text-[#FFF8E0] whitespace-nowrap">
                  {t('settingCgGalleryBadge')}
                </span>
              </button>

              {/* Bottle Style Compare */}
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  onOpenBottleCompare();
                }}
                className="candy-pill-cream w-full px-3 py-2 flex items-center justify-between font-black text-[#4A2305] cursor-pointer"
              >
                <span>{t('settingBottleStyle')}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#7126E8] text-[#FFE875] whitespace-nowrap">
                  {t('compareFourBadge')}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={profile.adsRemoved}
                onClick={() => {
                  triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                  onPurchaseRemoveAds();
                }}
                className="candy-btn-gold w-full py-2.5 text-white text-xs font-black game-stroke-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck3DIcon className="w-5 h-5 shrink-0" />
                <span>
                  {profile.adsRemoved ? t('removeAdsOwned') : t('removeAdsBuy')}
                </span>
              </button>

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

        {/* 6-CG OUTCOME GALLERY SHOWCASE */}
        {modal === 'CG_GALLERY' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-game-display text-lg font-bold text-[#FFF9D6] game-stroke-sm leading-tight truncate">
                  {t('cgGalleryTitle')}
                </h2>
                <p className="text-[10.5px] font-bold text-[#FFF5DB] leading-snug">
                  {t('cgGallerySubtitle')}
                </p>
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

            {/* Segmented Tab Switcher: Victory 3 Tiers vs Defeat 3 Tiers */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  setCgGalleryTab('victory');
                }}
                className={`py-2 px-2 text-xs font-black cursor-pointer whitespace-nowrap ${
                  cgGalleryTab === 'victory'
                    ? 'candy-btn-green text-white game-stroke-xs'
                    : 'candy-card-cream text-[#6A3E14]'
                }`}
              >
                {t('cgTabVictory')}
              </button>
              <button
                type="button"
                onClick={() => {
                  tapFeedback();
                  setCgGalleryTab('defeat');
                }}
                className={`py-2 px-2 text-xs font-black cursor-pointer whitespace-nowrap ${
                  cgGalleryTab === 'defeat'
                    ? 'candy-btn-purple text-white game-stroke-xs'
                    : 'candy-card-cream text-[#6A3E14]'
                }`}
              >
                {t('cgTabDefeat')}
              </button>
            </div>

            <div className="space-y-2.5">
              {([1, 2, 3] as CgTier[]).map((tier) => (
                <div key={`${cgGalleryTab}-${tier}`} className="candy-card-cream p-2 space-y-1.5">
                  <OutcomeCgCard outcome={cgGalleryTab} tier={tier} compact />
                  <div className="px-1 flex items-center justify-between text-[10px] font-black text-[#7D4918]">
                    <span>{cgTriggerLabels[cgGalleryTab][tier]}</span>
                    <span className="text-[#6D23E8]">{t('tapCgZoomHint')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REWARDED SUPPLY BONUS */}
        {modal === 'AD_SIMULATION' && adRequest && (
          <div className="space-y-3.5 text-center">
            <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#EA7607]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#FFF9D6]">
                {t('rewardVideoTag')}
              </div>
              <h2 className="font-game-display text-lg font-bold text-white game-stroke-sm mt-1">
                {adRequest.label}
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1">
                {adSecondsLeft > 0
                  ? t('rewardVideoPlaying', { s: adSecondsLeft })
                  : t('rewardVideoReady')}
              </p>
            </div>

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
              <span>{adSecondsLeft > 0 ? t('pleaseWait') : t('claimRewardBtn')}</span>
            </button>
          </div>
        )}

        {/* BOTTLE DESIGN 2x2 COMPARE SHOWCASE */}
        {modal === 'BOTTLE_COMPARE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-game-display text-lg font-bold text-[#FFF9D6] game-stroke-sm leading-tight">
                  {t('bottleCompareTitle')}
                </h2>
                <p className="text-[11px] font-bold text-[#FFF5DB]">
                  {t('bottleCompareSubtitle')}
                </p>
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

            <div className="grid grid-cols-2 gap-2.5">
              {BOTTLE_STYLE_LIST.map((design) => {
                const isSelected = profile.bottleStyle === design.id;
                const loc = bottleDesignText(design.id, design.title, design.tagline);
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => {
                      triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                      onSelectBottleStyle(design.id);
                      onCloseModal();
                    }}
                    className={`relative p-2.5 flex flex-col items-center text-center cursor-pointer active:translate-y-0.5 ${
                      isSelected ? 'candy-card-cream ring-2 ring-[#36DC15]' : 'candy-card-cream'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-[#29B80A] border border-white text-white text-[9px] font-black">
                        {t('bottleActiveBadge')}
                      </span>
                    )}
                    <div className="relative w-full pt-1.5 pb-2 flex flex-col items-center justify-end rounded-xl bg-gradient-to-b from-[#8A4D1F] via-[#A9622B] to-[#743C13] shadow-inner overflow-hidden">
                      <div className="pointer-events-none">
                        <CrystalBottle
                          bottle={SHOWCASE_BOTTLE}
                          bottleStyle={design.id}
                          selected={false}
                          colorSymbolsEnabled={profile.colorSymbolsEnabled}
                          sizeClassName="w-[76px] h-[128px] overflow-visible drop-shadow-[0_6px_8px_rgba(32,12,2,0.45)]"
                          interactive={false}
                          onSelect={() => {}}
                        />
                      </div>
                      <div className="w-[90%] h-2.5 -mt-2 rounded-full bg-gradient-to-b from-[#D98E47] to-[#874411] border border-[#522405]" />
                    </div>
                    <div className="mt-1.5 text-xs font-black text-[#4E2305] leading-tight">
                      {loc.title}
                    </div>
                    <div className="mt-0.5 text-[9.5px] font-bold text-[#8A5A1A] leading-snug">
                      {loc.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
