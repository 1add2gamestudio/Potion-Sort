import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  GameModals,
  type DefeatSnapshot,
  type VictorySnapshot,
} from './components/GameModals';
import { GameplayScreen } from './components/GameplayScreen';
import {
  AchievementsView,
  AlembicView,
  EventView,
  LevelMapView,
  ShopView,
} from './components/MetaViews';
import { TitleHomeScreen } from './components/TitleHomeScreen';
import {
  claimAllCgAchievementRewards,
  claimCgAchievementReward,
  unlockOutcomeCg,
} from './game/achievements';
import { resolveAndroidBackAction } from './game/androidBack';
import {
  applyRemoveAdsPurchase,
  evaluateInterstitialPacing,
  MONETIZATION_ENABLED,
  type AdRequest,
} from './game/adService';
import {
  applyDailyLoginReward,
  computeNextDailyStreak,
  isDailyRewardAvailable,
  rollDailyLoginReward,
  type DailyRewardGrant,
} from './game/dailyReward';
import { triggerSemanticHaptic } from './game/haptics';
import { LanguageProvider, createI18nValue } from './game/i18n';
import { EVENT_TRIALS, getLevelSpec, getTrialLevelSpec } from './game/levelGenerator';
import {
  markAchievementsSeen,
  markAlembicSeen,
  markDailyRewardSeen,
  markEventsSeen,
  syncAlembicSeenAfterBrew,
} from './game/notifications';
import {
  preloadOutcomeCgs,
  resolveDefeatCgTier,
  resolveVictoryCgTier,
} from './game/outcomeCg';
import {
  handleVisibilityAudioSync,
  playAchievementUnlockSound,
  playAddBottleSound,
  playAlembicBrewSound,
  playDailyCheckInSound,
  playDefeatChime,
  playPickupClink,
  playShopPurchaseSound,
  resolveGameplayBgmMood,
  setBgmMood,
  startBgm,
  stopBgm,
  stopPourSound,
  unlockAudioForGesture,
} from './game/sound';
import {
  CONTINUE_COIN_COST,
  DEFAULT_PROFILE,
  ESSENCE_POUCH_COIN_COST,
  EVENT_MILESTONES,
  FULL_LIVES_COIN_COST,
  IN_GAME_BOOSTER_COSTS,
  SINGLE_LIFE_COIN_COST,
  loadProfile,
  regenerateLives,
  saveProfile,
  type AlembicRecipe,
} from './game/storage';
import type {
  AppScreen,
  IngredientId,
  LevelSpec,
  OutcomeCgId,
  PlayModal,
  PlayerProfile,
  TutorialTipId,
} from './game/types';

const ALL_INGREDIENTS: IngredientId[] = ['citrus', 'crystal', 'dew', 'mist'];

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'PLAYING';
    }
    return 'HOME';
  });

  const [activeLevel, setActiveLevel] = useState<LevelSpec>(() =>
    getLevelSpec(profile.highestLevel)
  );
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(1);
  const [continueGrantTick, setContinueGrantTick] = useState(0);
  const [modal, setModal] = useState<PlayModal>('NONE');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [victorySnap, setVictorySnap] = useState<VictorySnapshot | null>(null);
  const [defeatSnap, setDefeatSnap] = useState<DefeatSnapshot | null>(null);
  const [adRequest, setAdRequest] = useState<AdRequest | null>(null);
  const [pendingDailyReward, setPendingDailyReward] = useState<DailyRewardGrant | null>(null);
  const dailyCheckedRef = useRef(false);
  const clearsSinceInterstitialRef = useRef(0);
  const [levelFailCounts, setLevelFailCounts] = useState<Record<number, number>>({});
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [exitToastVisible, setExitToastVisible] = useState(false);
  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backStateRef = useRef({
    screen,
    modal,
    hasInterstitialAd: Boolean(adRequest?.isInterstitial),
    lives: profile.lives,
    isTrialMode: Boolean(activeTrialId),
  });
  backStateRef.current = {
    screen,
    modal,
    hasInterstitialAd: Boolean(adRequest?.isInterstitial),
    lives: profile.lives,
    isTrialMode: Boolean(activeTrialId),
  };

  // Sync profile persistence
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Trigger daily login reward modal once per local calendar day upon opening on Home
  useEffect(() => {
    if (dailyCheckedRef.current) return;
    if (screen !== 'HOME' || modal !== 'NONE') return;
    dailyCheckedRef.current = true;

    if (isDailyRewardAvailable(profile.lastDailyRewardDate)) {
      const nextStreak = computeNextDailyStreak(
        profile.lastDailyRewardDate,
        profile.dailyLoginStreak
      );
      const gift = rollDailyLoginReward(nextStreak);
      setPendingDailyReward(gift);
      setProfile((curr) => markDailyRewardSeen(curr));
      setModal('DAILY_REWARD');
    }
  }, [screen, modal, profile.lastDailyRewardDate, profile.dailyLoginStreak]);

  // Preload all 6 static progressive Victory/Defeat CGs silently
  useEffect(() => {
    preloadOutcomeCgs();
  }, []);

  // Update HTML page title cleanly with active language
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title =
      profile.language === 'zh'
        ? 'Potion Sort — 治愈系魔药分色解谜'
        : 'Potion Sort — Sunlit Crystal Sorting Puzzle';
  }, [profile.language]);

  const bgmEnabledRef = useRef(profile.bgmEnabled);
  bgmEnabledRef.current = profile.bgmEnabled;

  // Unlock AudioContext & BGM synchronously inside the first user gesture (required by iOS Safari/WKWebView)
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      unlockAudioForGesture(bgmEnabledRef.current);
      setAudioUnlocked(true);
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (!audioUnlocked) return;
    if (profile.bgmEnabled) {
      startBgm(true);
    } else {
      stopBgm();
    }
  }, [audioUnlocked, profile.bgmEnabled]);

  useEffect(() => {
    const onVisibility = () => {
      if (audioUnlocked) {
        handleVisibilityAudioSync(profile.bgmEnabled);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [audioUnlocked, profile.bgmEnabled]);

  // Immediately stop any active liquid sound when muted or leaving gameplay
  useEffect(() => {
    if (!profile.soundEnabled) {
      stopPourSound();
    }
  }, [profile.soundEnabled]);

  useEffect(() => {
    if (screen !== 'PLAYING') {
      stopPourSound();
    }
  }, [screen]);

  // Keep 4-state adaptive BGM mood synchronized with current screen & progression
  useEffect(() => {
    setBgmMood(
      resolveGameplayBgmMood({
        inGameplay: screen === 'PLAYING',
        difficulty: activeLevel.difficulty,
        isTrial: Boolean(activeTrialId),
        streak: profile.streak,
      })
    );
  }, [screen, activeLevel.difficulty, activeTrialId, profile.streak]);

  // Live life regeneration ticker every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      setProfile((curr) => {
        const next = regenerateLives(curr, now);
        return next.lives !== curr.lives ? next : curr;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mirror state machine onto document.body.dataset.state
  useEffect(() => {
    if (modal === 'PAUSED') {
      document.body.dataset.state = 'paused';
    } else if (modal === 'VICTORY' || modal === 'DEFEAT') {
      document.body.dataset.state = 'gameover';
    } else if (screen === 'PLAYING') {
      document.body.dataset.state = 'playing';
    } else {
      document.body.dataset.state = 'title';
    }
  }, [screen, modal]);

  const startCampaignLevel = useCallback(
    (levelNumber: number) => {
      const current = regenerateLives(profile);
      if (current.lives <= 0) {
        setProfile(current);
        setModal('NO_LIVES');
        return;
      }
      playPickupClink(current.soundEnabled);
      setActiveTrialId(null);
      setActiveLevel(getLevelSpec(levelNumber));
      setRunKey((k) => k + 1);
      setModal('NONE');
      setScreen('PLAYING');
    },
    [profile]
  );

  const startTrial = useCallback(
    (trialId: string) => {
      playPickupClink(profile.soundEnabled);
      setActiveTrialId(trialId);
      setActiveLevel(getTrialLevelSpec(trialId));
      setRunKey((k) => k + 1);
      setModal('NONE');
      setScreen('PLAYING');
    },
    [profile.soundEnabled]
  );

  const handleNavigate = useCallback((nextScreen: AppScreen) => {
    if (nextScreen === 'ACHIEVEMENTS') {
      setProfile((curr) => markAchievementsSeen(curr));
    } else if (nextScreen === 'EVENT') {
      setProfile((curr) => markEventsSeen(curr));
    } else if (nextScreen === 'ALEMBIC') {
      setProfile((curr) => markAlembicSeen(curr));
    }
    setScreen(nextScreen);
  }, []);

  const toggleAllAudio = useCallback(() => {
    setProfile((p) => {
      const anyOn = p.soundEnabled || p.bgmEnabled;
      return {
        ...p,
        soundEnabled: !anyOn,
        bgmEnabled: !anyOn,
      };
    });
  }, []);

  const handleMarkTutorialSeen = useCallback((tipId: TutorialTipId) => {
    setProfile((curr) => {
      if (curr.seenTutorials.includes(tipId)) return curr;
      return {
        ...curr,
        seenTutorials: [...curr.seenTutorials, tipId],
      };
    });
  }, []);

  // Native Android hardware Back button / edge-swipe Back support via Capacitor App
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let removeListener: (() => void) | null = null;

    void CapacitorApp.addListener('backButton', () => {
      const action = resolveAndroidBackAction(backStateRef.current);
      switch (action.type) {
        case 'ignore':
          return;
        case 'close_modal':
          setModal('NONE');
          return;
        case 'set_modal':
          setModal(action.modal);
          return;
        case 'close_modal_and_navigate':
          setModal('NONE');
          setScreen(action.screen);
          if (action.screen === 'HOME' || action.screen === 'EVENT') {
            setActiveTrialId(null);
          }
          return;
        case 'go_home':
          setScreen('HOME');
          return;
        case 'exit_prompt_or_app': {
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            if (exitToastTimerRef.current) {
              clearTimeout(exitToastTimerRef.current);
              exitToastTimerRef.current = null;
            }
            setExitToastVisible(false);
            void CapacitorApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            setExitToastVisible(true);
            if (exitToastTimerRef.current) {
              clearTimeout(exitToastTimerRef.current);
            }
            exitToastTimerRef.current = setTimeout(() => {
              setExitToastVisible(false);
              exitToastTimerRef.current = null;
            }, 2000);
          }
          return;
        }
      }
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        removeListener = () => {
          void handle.remove();
        };
      }
    });

    return () => {
      disposed = true;
      removeListener?.();
      if (exitToastTimerRef.current) {
        clearTimeout(exitToastTimerRef.current);
        exitToastTimerRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts (Enter/Space to start on Home, Esc/P to Pause/Back, M to Mute All)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen === 'HOME' && modal === 'NONE' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startCampaignLevel(profile.highestLevel);
      } else if (
        screen === 'PLAYING' &&
        modal === 'NONE' &&
        (e.key === 'Escape' || e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        setModal('PAUSED');
      } else if (modal === 'PAUSED' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setModal('NONE');
      } else if (
        e.key === 'Escape' &&
        (modal === 'SETTINGS' ||
          modal === 'DAILY_REWARD' ||
          modal === 'REMOVE_ADS_CONFIRM' ||
          modal === 'NO_LIVES')
      ) {
        e.preventDefault();
        if (modal === 'REMOVE_ADS_CONFIRM' && adRequest?.isInterstitial) {
          setModal('AD_SIMULATION');
        } else if (modal === 'NO_LIVES' && screen === 'PLAYING' && profile.lives <= 0) {
          setModal('NONE');
          setScreen('HOME');
        } else {
          setModal('NONE');
        }
      } else if (e.key === 'Escape' && modal === 'NONE' && screen !== 'HOME' && screen !== 'PLAYING') {
        e.preventDefault();
        setScreen('HOME');
      } else if (e.key.toLowerCase() === 'm') {
        toggleAllAudio();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, modal, adRequest, profile.highestLevel, profile.lives, startCampaignLevel, toggleAllAudio]);

  const handleVictory = (stats: {
    moves: number;
    elapsedSec: number;
  }) => {
    const trialMeta = activeTrialId
      ? EVENT_TRIALS.find((t) => t.id === activeTrialId)
      : null;

    const isTrial = Boolean(activeTrialId);
    const isTrialFirstClear = Boolean(
      activeTrialId && !profile.completedTrials.includes(activeTrialId)
    );
    const isFrontierCampaign = !isTrial && activeLevel.levelNumber >= profile.highestLevel;
    const isPracticeReplay = !isTrial && !isFrontierCampaign;

    const starsEarned = trialMeta
      ? isTrialFirstClear
        ? trialMeta.starReward
        : 0
      : isPracticeReplay
      ? 0
      : activeLevel.difficulty === 'super_hard'
      ? 12
      : activeLevel.difficulty === 'hard'
      ? 8
      : 5;

    const baseCoins = trialMeta
      ? isTrialFirstClear
        ? 60
        : 20
      : isPracticeReplay
      ? 15
      : activeLevel.rewardCoins;
    const coinsEarned = baseCoins;
    const ingredient = activeLevel.rewardIngredient;

    // Only campaign frontier clears advance the win streak (prevents Level-1 streak farming)
    const nextStreak = isFrontierCampaign ? profile.streak + 1 : profile.streak;
    const cgTier = resolveVictoryCgTier({
      streakAfterWin: nextStreak,
      difficulty: activeLevel.difficulty,
      isTrial,
    });

    // Check if this outcome unlocks a new CG achievement
    const cgUnlockPreview = unlockOutcomeCg(profile, 'victory', cgTier);

    // Clear consecutive failure counter for this level on win
    setLevelFailCounts((prev) => {
      if (!(activeLevel.levelNumber in prev)) return prev;
      const next = { ...prev };
      delete next[activeLevel.levelNumber];
      return next;
    });

    setProfile((curr) => {
      const updatedStreak = isFrontierCampaign ? curr.streak + 1 : curr.streak;
      const unlockedRes = unlockOutcomeCg(curr, 'victory', cgTier);
      return {
        ...unlockedRes.profile,
        highestLevel: isFrontierCampaign ? activeLevel.levelNumber + 1 : curr.highestLevel,
        coins: curr.coins + coinsEarned,
        streak: updatedStreak,
        bestStreak: Math.max(curr.bestStreak, updatedStreak),
        eventStars: Math.min(100, curr.eventStars + starsEarned),
        ingredients: {
          ...curr.ingredients,
          [ingredient]: curr.ingredients[ingredient] + 1,
        },
        completedTrials:
          activeTrialId && !curr.completedTrials.includes(activeTrialId)
            ? [...curr.completedTrials, activeTrialId]
            : curr.completedTrials,
      };
    });

    const i18n = createI18nValue(profile.language);
    const localizedTrialTitle = trialMeta
      ? i18n.trialText(trialMeta.id, trialMeta.name, trialMeta.subtitle).name
      : activeLevel.title;

    setVictorySnap({
      levelNumber: activeLevel.levelNumber,
      levelTitle: localizedTrialTitle,
      isTrial,
      trialId: activeTrialId,
      isPracticeReplay,
      moves: stats.moves,
      elapsedSec: stats.elapsedSec,
      coinsEarned,
      starsEarned,
      ingredient,
      doubled: false,
      cgTier,
      newlyUnlockedCgCoins: cgUnlockPreview.newlyUnlocked ? cgUnlockPreview.rewardCoins : null,
    });
    setModal('VICTORY');
  };

  const deductLifeAndResetStreak = () => {
    setProfile((curr) => {
      const synced = regenerateLives(curr);
      const nextLives = Math.max(0, synced.lives - 1);
      return {
        ...synced,
        lives: nextLives,
        lastLifeTimestamp:
          synced.lives >= synced.maxLives ? Date.now() : synced.lastLifeTimestamp,
        streak: activeTrialId ? synced.streak : 0,
      };
    });
  };

  const handleRestartConfirm = () => {
    const current = regenerateLives(profile);
    if (!activeTrialId) {
      if (current.lives <= 0) {
        setProfile(current);
        setModal('NO_LIVES');
        return;
      }
      deductLifeAndResetStreak();
    }
    setModal('NONE');
    setRunKey((k) => k + 1);
  };

  const handleGiveUp = (stats: {
    completedBottles: number;
    totalBottles: number;
    extraFlasksUsed: number;
  }) => {
    const prevFails = levelFailCounts[activeLevel.levelNumber] ?? 0;
    const nextFailCount = prevFails + 1;
    setLevelFailCounts((prev) => ({
      ...prev,
      [activeLevel.levelNumber]: nextFailCount,
    }));

    const cgTier = resolveDefeatCgTier({
      failCountOnLevel: nextFailCount,
      completedBottles: stats.completedBottles,
      totalBottles: stats.totalBottles,
      hadStreak: profile.streak,
    });

    const cgUnlockPreview = unlockOutcomeCg(profile, 'defeat', cgTier);
    if (cgUnlockPreview.newlyUnlocked) {
      setProfile((curr) => unlockOutcomeCg(curr, 'defeat', cgTier).profile);
    }

    playDefeatChime(profile.soundEnabled, cgTier);
    triggerSemanticHaptic(profile.hapticsEnabled, 'defeat');

    setDefeatSnap({
      completedBottles: stats.completedBottles,
      totalBottles: stats.totalBottles,
      extraFlasksUsed: stats.extraFlasksUsed,
      cgTier,
      newlyUnlockedCgCoins: cgUnlockPreview.newlyUnlocked ? cgUnlockPreview.rewardCoins : null,
    });
    setModal('DEFEAT');
  };

  const handleContinueAfterDefeat = () => {
    if ((defeatSnap?.extraFlasksUsed ?? 0) >= 3) return;
    if (profile.boosters.extraFlask > 0) {
      setProfile((curr) => ({
        ...curr,
        boosters: {
          ...curr.boosters,
          extraFlask: Math.max(0, curr.boosters.extraFlask - 1),
        },
      }));
    } else if (profile.coins >= CONTINUE_COIN_COST) {
      setProfile((curr) => ({
        ...curr,
        coins: curr.coins - CONTINUE_COIN_COST,
      }));
    } else {
      return;
    }

    playAddBottleSound(profile.soundEnabled);
    // Grant extra flask in-place on the active board without wiping player progress
    setContinueGrantTick((c) => c + 1);
    setModal('NONE');
  };

  const handleRetryAfterDefeat = () => {
    const current = regenerateLives(profile);
    if (!activeTrialId) {
      if (current.lives <= 0) {
        setProfile(current);
        setModal('NO_LIVES');
        return;
      }
      deductLifeAndResetStreak();
    }
    setModal('NONE');
    setRunKey((k) => k + 1);
  };

  const handleExitToHome = () => {
    setModal('NONE');
    handleNavigate(activeTrialId ? 'EVENT' : 'HOME');
    setActiveTrialId(null);
  };

  const handleConsumeBooster = (key: 'undo' | 'shuffle' | 'extraFlask'): boolean => {
    if (profile.boosters[key] <= 0) return false;
    setProfile((curr) => ({
      ...curr,
      boosters: {
        ...curr.boosters,
        [key]: Math.max(0, curr.boosters[key] - 1),
      },
    }));
    return true;
  };

  const handleBuyInGameBooster = (key: 'undo' | 'shuffle' | 'extraFlask'): boolean => {
    const cost = IN_GAME_BOOSTER_COSTS[key];
    if (profile.coins < cost) return false;
    setProfile((curr) => {
      if (curr.coins < cost) return curr;
      return {
        ...curr,
        coins: curr.coins - cost,
      };
    });
    return true;
  };

  const handleBrewRecipe = (recipe: AlembicRecipe) => {
    const canAffordNow = (Object.keys(recipe.cost) as IngredientId[]).every(
      (k) => profile.ingredients[k] >= recipe.cost[k]
    );
    if (!canAffordNow) return;
    setProfile((curr) => {
      const canAfford = (Object.keys(recipe.cost) as IngredientId[]).every(
        (k) => curr.ingredients[k] >= recipe.cost[k]
      );
      if (!canAfford) return curr;
      const nextIngredients = { ...curr.ingredients };
      (Object.keys(recipe.cost) as IngredientId[]).forEach((k) => {
        nextIngredients[k] = Math.max(0, nextIngredients[k] - recipe.cost[k]);
      });
      const updated: PlayerProfile = {
        ...curr,
        ingredients: nextIngredients,
        boosters: {
          ...curr.boosters,
          [recipe.rewardKey]: curr.boosters[recipe.rewardKey] + recipe.rewardAmount,
        },
      };
      return syncAlembicSeenAfterBrew(updated);
    });
    playAlembicBrewSound(profile.soundEnabled);
  };

  const handleClaimEventMilestone = (starsRequired: number) => {
    const m = EVENT_MILESTONES.find((item) => item.starsRequired === starsRequired);
    if (!m) return;
    if (profile.eventStars < starsRequired || profile.claimedEventMilestones.includes(starsRequired)) {
      return;
    }
    setProfile((curr) => {
      if (curr.eventStars < starsRequired || curr.claimedEventMilestones.includes(starsRequired)) {
        return curr;
      }
      const nextBoosters = { ...curr.boosters };
      if (m.rewardBooster) {
        nextBoosters[m.rewardBooster.key] += m.rewardBooster.amount;
      }
      return {
        ...curr,
        coins: curr.coins + m.rewardCoins,
        boosters: nextBoosters,
        claimedEventMilestones: [...curr.claimedEventMilestones, starsRequired],
      };
    });
    playAchievementUnlockSound(profile.soundEnabled, false);
  };

  const handleClaimCgReward = (cgId: OutcomeCgId): number => {
    const res = claimCgAchievementReward(profile, cgId);
    if (!res.claimed) return 0;
    setProfile((curr) => markAchievementsSeen(claimCgAchievementReward(curr, cgId).profile));
    playAchievementUnlockSound(profile.soundEnabled, false);
    return res.coinsGranted;
  };

  const handleClaimAllCgRewards = (): number => {
    const res = claimAllCgAchievementRewards(profile);
    if (res.coinsGranted <= 0) return 0;
    setProfile((curr) => markAchievementsSeen(claimAllCgAchievementRewards(curr).profile));
    playAchievementUnlockSound(profile.soundEnabled, true);
    return res.coinsGranted;
  };

  const handleBuyEssencePouch = (): IngredientId[] | null => {
    if (profile.coins < ESSENCE_POUCH_COIN_COST) return null;
    const rolled: IngredientId[] = Array.from({ length: 3 }, () => {
      const idx = Math.floor(Math.random() * ALL_INGREDIENTS.length);
      return ALL_INGREDIENTS[idx];
    });
    setProfile((curr) => {
      if (curr.coins < ESSENCE_POUCH_COIN_COST) return curr;
      const nextIngredients = { ...curr.ingredients };
      rolled.forEach((id) => {
        nextIngredients[id] += 1;
      });
      return {
        ...curr,
        coins: curr.coins - ESSENCE_POUCH_COIN_COST,
        ingredients: nextIngredients,
      };
    });
    playShopPurchaseSound(profile.soundEnabled);
    return rolled;
  };

  const handleBuySingleLife = () => {
    if (profile.coins < SINGLE_LIFE_COIN_COST || profile.lives >= profile.maxLives) return;
    setProfile((curr) => {
      if (curr.coins < SINGLE_LIFE_COIN_COST || curr.lives >= curr.maxLives) return curr;
      return {
        ...curr,
        coins: curr.coins - SINGLE_LIFE_COIN_COST,
        lives: Math.min(curr.maxLives, curr.lives + 1),
      };
    });
    playShopPurchaseSound(profile.soundEnabled);
    if (modal === 'NO_LIVES') {
      setModal('NONE');
    }
  };

  const handleRefillAllLives = () => {
    if (profile.coins < FULL_LIVES_COIN_COST || profile.lives >= profile.maxLives) return;
    setProfile((curr) => {
      if (curr.coins < FULL_LIVES_COIN_COST || curr.lives >= curr.maxLives) return curr;
      return {
        ...curr,
        coins: curr.coins - FULL_LIVES_COIN_COST,
        lives: curr.maxLives,
      };
    });
    playShopPurchaseSound(profile.soundEnabled);
    if (modal === 'NO_LIVES') {
      setModal('NONE');
    }
  };

  const handleOpenDailyRewardFromHome = () => {
    if (isDailyRewardAvailable(profile.lastDailyRewardDate)) {
      if (!pendingDailyReward) {
        const nextStreak = computeNextDailyStreak(
          profile.lastDailyRewardDate,
          profile.dailyLoginStreak
        );
        setPendingDailyReward(rollDailyLoginReward(nextStreak));
      }
    } else {
      setPendingDailyReward(null);
    }
    setProfile((curr) => markDailyRewardSeen(curr));
    setModal('DAILY_REWARD');
  };

  const handleClaimDailyReward = () => {
    if (!pendingDailyReward) {
      setModal('NONE');
      return;
    }
    const claimed = pendingDailyReward;
    setProfile((curr) => applyDailyLoginReward(curr, claimed));
    playDailyCheckInSound(profile.soundEnabled, claimed.kind === 'grand');
    triggerSemanticHaptic(
      profile.hapticsEnabled,
      claimed.kind === 'grand' ? 'victory3' : 'victory1'
    );
    setPendingDailyReward(null);
  };

  const handleCompleteAd = () => {
    if (!adRequest) return;
    if (adRequest.kind === 'interstitial_next_level') {
      const nextLvl = adRequest.pendingNextLevel ?? activeLevel.levelNumber + 1;
      setAdRequest(null);
      startCampaignLevel(nextLvl);
      return;
    }
    if (adRequest.kind === 'rewarded_life') {
      setProfile((curr) => ({
        ...curr,
        lives: Math.min(curr.maxLives, curr.lives + 1),
      }));
    } else if (adRequest.kind === 'rewarded_2x_coins' && victorySnap && !victorySnap.doubled) {
      setProfile((curr) => ({
        ...curr,
        coins: curr.coins + victorySnap.coinsEarned,
      }));
      setVictorySnap((v) => (v ? { ...v, doubled: true } : v));
      setModal('VICTORY');
      setAdRequest(null);
      return;
    } else if (adRequest.kind === 'rewarded_continue') {
      if ((defeatSnap?.extraFlasksUsed ?? 0) >= 3) {
        setAdRequest(null);
        setModal('DEFEAT');
        return;
      }
      playAddBottleSound(profile.soundEnabled);
      setContinueGrantTick((c) => c + 1);
      setModal('NONE');
      setAdRequest(null);
      return;
    }
    setAdRequest(null);
    setModal('NONE');
  };

  const handleConfirmRemoveAds = () => {
    setProfile((curr) => applyRemoveAdsPurchase(curr));
    clearsSinceInterstitialRef.current = 0;
    playShopPurchaseSound(profile.soundEnabled);

    // If purchased directly from an interstitial intermission, jump straight into the pending level
    if (adRequest?.isInterstitial && adRequest.pendingNextLevel) {
      const targetLvl = adRequest.pendingNextLevel;
      setAdRequest(null);
      startCampaignLevel(targetLvl);
      return;
    }
    setModal('NONE');
  };

  const handleNextLevelFromVictory = () => {
    if (activeTrialId) {
      setModal('NONE');
      handleNavigate('EVENT');
      setActiveTrialId(null);
      return;
    }
    const nextLvl = activeLevel.levelNumber + 1;
    // 首发版无广告：直接进入下一关，不做任何插屏判定
    if (!MONETIZATION_ENABLED) {
      clearsSinceInterstitialRef.current = 0;
      startCampaignLevel(nextLvl);
      return;
    }
    const pacing = evaluateInterstitialPacing({
      adsRemoved: profile.adsRemoved,
      clearedLevelNumber: activeLevel.levelNumber,
      clearsSinceLastInterstitial: clearsSinceInterstitialRef.current,
      isTrial: false,
    });
    clearsSinceInterstitialRef.current = pacing.nextCounter;

    if (pacing.shouldShow) {
      const i18n = createI18nValue(profile.language);
      setAdRequest({
        kind: 'interstitial_next_level',
        label: i18n.t('interstitialTitle'),
        isInterstitial: true,
        pendingNextLevel: nextLvl,
      });
      setModal('AD_SIMULATION');
      return;
    }
    startCampaignLevel(nextLvl);
  };

  return (
    <LanguageProvider lang={profile.language}>
      <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#FFEBC2] via-[#FFD996] to-[#F7BA63] flex items-center justify-center sm:p-4 overflow-hidden">
        {/* Strict Portrait Mobile Game Frame (full-bleed with notch safe-area on phones, 9:16 centerpiece on desktop) */}
        <main
          onClick={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('button:not(:disabled)')) {
              triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
            }
          }}
          className="relative w-full h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:pt-0 sm:pb-0 sm:h-[min(860px,94dvh)] sm:max-w-[420px] sm:rounded-[34px] sm:border-[6px] sm:border-[#783A09] sm:shadow-[0_24px_60px_rgba(92,42,4,0.35)] overflow-hidden bg-[#260B4E]"
        >
          {screen === 'HOME' && (
            <TitleHomeScreen
              profile={profile}
              nowMs={nowMs}
              onPlayLevel={startCampaignLevel}
              onNavigate={handleNavigate}
              onOpenSettings={() => setModal('SETTINGS')}
              onOpenLivesModal={() => setModal('NO_LIVES')}
              onOpenDailyReward={handleOpenDailyRewardFromHome}
              onOpenRemoveAds={() => setModal('REMOVE_ADS_CONFIRM')}
            />
          )}

          {screen === 'PLAYING' && (
            <GameplayScreen
              level={activeLevel}
              isTrialMode={Boolean(activeTrialId)}
              isPaused={modal !== 'NONE'}
              profile={profile}
              runKey={runKey}
              continueGrantTick={continueGrantTick}
              onPause={() => setModal('PAUSED')}
              onOpenSettings={() => setModal('SETTINGS')}
              onToggleMute={toggleAllAudio}
              onRestartRequest={() => setModal('PAUSED')}
              onConsumeBooster={handleConsumeBooster}
              onBuyInGameBooster={handleBuyInGameBooster}
              onVictory={handleVictory}
              onGiveUp={handleGiveUp}
              onMarkTutorialSeen={handleMarkTutorialSeen}
            />
          )}

          {screen === 'LEVEL_MAP' && (
            <LevelMapView
              profile={profile}
              onSelectLevel={startCampaignLevel}
              onBack={() => setScreen('HOME')}
            />
          )}

          {screen === 'ALEMBIC' && (
            <AlembicView
              profile={profile}
              onBrew={handleBrewRecipe}
              onBack={() => setScreen('HOME')}
            />
          )}

          {screen === 'EVENT' && (
            <EventView
              profile={profile}
              onClaimMilestone={handleClaimEventMilestone}
              onPlayTrial={startTrial}
              onBack={() => setScreen('HOME')}
            />
          )}

          {screen === 'SHOP' && (
            <ShopView
              profile={profile}
              onBuyBooster={(key, cost, amount) => {
                if (profile.coins < cost) return;
                playShopPurchaseSound(profile.soundEnabled);
                setProfile((curr) => {
                  if (curr.coins < cost) return curr;
                  return {
                    ...curr,
                    coins: curr.coins - cost,
                    boosters: { ...curr.boosters, [key]: curr.boosters[key] + amount },
                  };
                });
              }}
              onBuyEssencePouch={handleBuyEssencePouch}
              onBuySingleLife={handleBuySingleLife}
              onRefillLives={handleRefillAllLives}
              onOpenRemoveAds={() => setModal('REMOVE_ADS_CONFIRM')}
              onBack={() => setScreen('HOME')}
            />
          )}

          {screen === 'ACHIEVEMENTS' && (
            <AchievementsView
              profile={profile}
              onClaimCgReward={handleClaimCgReward}
              onClaimAllCgRewards={handleClaimAllCgRewards}
              onBack={() => setScreen('HOME')}
            />
          )}

          <GameModals
            modal={modal}
            isTrialMode={Boolean(activeTrialId)}
            profile={profile}
            nowMs={nowMs}
            victorySnapshot={victorySnap}
            defeatSnapshot={defeatSnap}
            adRequest={adRequest}
            dailyReward={pendingDailyReward}
            onCloseModal={() => {
              if (modal === 'REMOVE_ADS_CONFIRM' && adRequest?.isInterstitial) {
                setModal('AD_SIMULATION');
                return;
              }
              if (modal === 'NO_LIVES' && screen === 'PLAYING' && profile.lives <= 0) {
                setModal('NONE');
                setScreen('HOME');
                return;
              }
              setModal('NONE');
            }}
            onClaimDailyReward={handleClaimDailyReward}
            onResume={() => setModal('NONE')}
            onRestartConfirm={handleRestartConfirm}
            onExitToHome={handleExitToHome}
            onNextLevel={handleNextLevelFromVictory}
            onContinueAfterDefeat={handleContinueAfterDefeat}
            onRetryAfterDefeat={handleRetryAfterDefeat}
            onTriggerAd={(req) => {
              setAdRequest(req);
              setModal('AD_SIMULATION');
            }}
            onCompleteAd={handleCompleteAd}
            onOpenRemoveAds={() => setModal('REMOVE_ADS_CONFIRM')}
            onConfirmRemoveAds={handleConfirmRemoveAds}
            onBuySingleLife={handleBuySingleLife}
            onRefillLivesWithCoins={handleRefillAllLives}
            onToggleSetting={(key) =>
              setProfile((curr) => ({ ...curr, [key]: !curr[key] }))
            }
            onSelectLanguage={(language) =>
              setProfile((curr) => ({ ...curr, language }))
            }
            onResetSave={() => {
              setLevelFailCounts({});
              setPendingDailyReward(null);
              setAdRequest(null);
              setActiveTrialId(null);
              setActiveLevel(getLevelSpec(1));
              clearsSinceInterstitialRef.current = 0;
              setProfile({ ...DEFAULT_PROFILE, lastLifeTimestamp: Date.now() });
              setModal('NONE');
              setScreen('HOME');
            }}
          />
          {exitToastVisible && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#2E1059]/95 border-2 border-[#FFD966] text-[#FFF8E1] text-xs font-black tracking-wide shadow-[0_8px_22px_rgba(18,5,38,0.6)] whitespace-nowrap animate-mascot-cheer"
            >
              {createI18nValue(profile.language).t('backExitToast')}
            </div>
          )}
        </main>
      </div>
    </LanguageProvider>
  );
}
