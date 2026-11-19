import { useCallback, useEffect, useState } from 'react';
import {
  GameModals,
  type AdRequest,
  type DefeatSnapshot,
  type VictorySnapshot,
} from './components/GameModals';
import { GameplayScreen } from './components/GameplayScreen';
import {
  AlembicView,
  EventView,
  LevelMapView,
  SalonsComingSoonView,
  ShopView,
} from './components/MetaViews';
import { TitleHomeScreen } from './components/TitleHomeScreen';
import { addExtraFlaskBooster } from './game/engine';
import { EVENT_TRIALS, getLevelSpec, getTrialLevelSpec } from './game/levelGenerator';
import { playBottleComplete, playPickupClink } from './game/sound';
import {
  DEFAULT_PROFILE,
  EVENT_MILESTONES,
  loadProfile,
  regenerateLives,
  saveProfile,
  type AlembicRecipe,
} from './game/storage';
import type {
  AppScreen,
  IngredientId,
  LevelSpec,
  PlayModal,
  PlayerProfile,
} from './game/types';

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
    getLevelSpec(loadProfile().highestLevel)
  );
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(1);
  const [modal, setModal] = useState<PlayModal>('NONE');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [victorySnap, setVictorySnap] = useState<VictorySnapshot | null>(null);
  const [defeatSnap, setDefeatSnap] = useState<DefeatSnapshot | null>(null);
  const [adRequest, setAdRequest] = useState<AdRequest | null>(null);

  // Sync profile persistence
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

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

  // Keyboard shortcuts (Enter/Space to start on Home, Esc/P to Pause, M to Mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen === 'HOME' && modal === 'NONE' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startCampaignLevel(profile.highestLevel);
      } else if (screen === 'PLAYING' && modal === 'NONE' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setModal('PAUSED');
      } else if (modal === 'PAUSED' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setModal('NONE');
      } else if (e.key.toLowerCase() === 'm') {
        setProfile((p) => ({ ...p, soundEnabled: !p.soundEnabled }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, modal, profile.highestLevel, startCampaignLevel]);

  const handleVictory = (stats: { moves: number; elapsedSec: number }) => {
    const trialMeta = activeTrialId
      ? EVENT_TRIALS.find((t) => t.id === activeTrialId)
      : null;

    const starsEarned = trialMeta
      ? trialMeta.starReward
      : activeLevel.difficulty === 'super_hard'
      ? 12
      : activeLevel.difficulty === 'hard'
      ? 8
      : 5;

    const coinsEarned = trialMeta ? 60 : activeLevel.rewardCoins;
    const ingredient = activeLevel.rewardIngredient;

    setProfile((curr) => ({
      ...curr,
      highestLevel:
        !activeTrialId && activeLevel.levelNumber >= curr.highestLevel
          ? activeLevel.levelNumber + 1
          : curr.highestLevel,
      coins: curr.coins + coinsEarned,
      streak: activeTrialId ? curr.streak : curr.streak + 1,
      eventStars: Math.min(100, curr.eventStars + starsEarned),
      ingredients: {
        ...curr.ingredients,
        [ingredient]: curr.ingredients[ingredient] + 1,
      },
      completedTrials:
        activeTrialId && !curr.completedTrials.includes(activeTrialId)
          ? [...curr.completedTrials, activeTrialId]
          : curr.completedTrials,
    }));

    setVictorySnap({
      levelTitle: activeLevel.title,
      potionOrderName: activeLevel.potionOrderName,
      isTrial: Boolean(activeTrialId),
      moves: stats.moves,
      elapsedSec: stats.elapsedSec,
      coinsEarned,
      starsEarned,
      ingredient,
      doubled: false,
    });
    setModal('VICTORY');
  };

  const deductLifeAndResetStreak = () => {
    setProfile((curr) => {
      const nextLives = Math.max(0, curr.lives - 1);
      return {
        ...curr,
        lives: nextLives,
        lastLifeTimestamp:
          curr.lives >= curr.maxLives ? Date.now() : curr.lastLifeTimestamp,
        streak: activeTrialId ? curr.streak : 0,
      };
    });
  };

  const handleRestartConfirm = () => {
    if (!activeTrialId) {
      deductLifeAndResetStreak();
    }
    if (!activeTrialId && profile.lives - 1 <= 0) {
      setModal('NO_LIVES');
      return;
    }
    setModal('NONE');
    setRunKey((k) => k + 1);
  };

  const handleGiveUp = (stats: DefeatSnapshot) => {
    setDefeatSnap(stats);
    setModal('DEFEAT');
  };

  const handleRetryAfterDefeat = () => {
    if (!activeTrialId) {
      deductLifeAndResetStreak();
      if (profile.lives - 1 <= 0) {
        setModal('NO_LIVES');
        return;
      }
    }
    setModal('NONE');
    setRunKey((k) => k + 1);
  };

  const handleExitToHome = () => {
    setModal('NONE');
    setScreen(activeTrialId ? 'EVENT' : 'HOME');
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

  const handleRequestRewardedBooster = (key: 'undo' | 'shuffle' | 'extraFlask') => {
    const labelMap = {
      undo: 'Watch Video for +1 Undo',
      shuffle: 'Watch Video for +1 Shuffle',
      extraFlask: 'Watch Video for +1 Crystal Flask',
    };
    setAdRequest({
      kind: 'rewarded_booster',
      label: labelMap[key],
      boosterKey: key,
    });
    setModal('AD_SIMULATION');
  };

  const handleCompleteAd = () => {
    if (!adRequest) return;
    if (adRequest.kind === 'rewarded_life') {
      setProfile((curr) => ({
        ...curr,
        lives: Math.min(curr.maxLives, curr.lives + 1),
      }));
    } else if (adRequest.kind === 'rewarded_booster' && adRequest.boosterKey) {
      const k = adRequest.boosterKey;
      setProfile((curr) => ({
        ...curr,
        boosters: { ...curr.boosters, [k]: curr.boosters[k] + 1 },
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
      // Grant +1 Extra Flask directly onto active board
      setActiveLevel((curr) => ({
        ...curr,
        bottles: addExtraFlaskBooster(curr.bottles),
      }));
      setModal('NONE');
      setAdRequest(null);
      return;
    }
    setAdRequest(null);
    setModal('NONE');
  };

  const handleBrewRecipe = (recipe: AlembicRecipe) => {
    setProfile((curr) => {
      const nextIngredients = { ...curr.ingredients };
      (Object.keys(recipe.cost) as IngredientId[]).forEach((k) => {
        nextIngredients[k] = Math.max(0, nextIngredients[k] - recipe.cost[k]);
      });
      return {
        ...curr,
        ingredients: nextIngredients,
        boosters: {
          ...curr.boosters,
          [recipe.rewardKey]: curr.boosters[recipe.rewardKey] + recipe.rewardAmount,
        },
      };
    });
    playBottleComplete(profile.soundEnabled);
  };

  const handleClaimEventMilestone = (starsRequired: number) => {
    const m = EVENT_MILESTONES.find((item) => item.starsRequired === starsRequired);
    if (!m) return;
    setProfile((curr) => {
      if (curr.claimedEventMilestones.includes(starsRequired)) return curr;
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
    playBottleComplete(profile.soundEnabled);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#FFEBC2] via-[#FFD996] to-[#F7BA63] flex items-center justify-center sm:p-4 overflow-hidden">
      {/* Strict Portrait Mobile Game Frame (full-bleed on phones, 9:16 centerpiece on desktop) */}
      <main
        className="relative w-full h-[100dvh] sm:h-[min(860px,94dvh)] sm:max-w-[420px] sm:rounded-[34px] sm:border-[6px] sm:border-[#783A09] sm:shadow-[0_24px_60px_rgba(92,42,4,0.35)] overflow-hidden bg-[#FFF6DF]"
      >
        {screen === 'HOME' && (
          <TitleHomeScreen
            profile={profile}
            nowMs={nowMs}
            onPlayLevel={startCampaignLevel}
            onNavigate={setScreen}
            onOpenSettings={() => setModal('SETTINGS')}
            onOpenLivesModal={() => setModal('NO_LIVES')}
          />
        )}

        {screen === 'PLAYING' && (
          <GameplayScreen
            level={activeLevel}
            isTrialMode={Boolean(activeTrialId)}
            profile={profile}
            runKey={runKey}
            onPause={() => setModal('PAUSED')}
            onOpenSettings={() => setModal('SETTINGS')}
            onToggleMute={() =>
              setProfile((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
            }
            onRestartRequest={() => setModal('PAUSED')}
            onConsumeBooster={handleConsumeBooster}
            onRequestRewardedBooster={handleRequestRewardedBooster}
            onVictory={handleVictory}
            onGiveUp={handleGiveUp}
            onSelectBottleStyle={(bottleStyle) => {
              playPickupClink(profile.soundEnabled);
              setProfile((curr) => ({ ...curr, bottleStyle }));
            }}
            onOpenBottleCompare={() => setModal('BOTTLE_COMPARE')}
            onOpenPourSoundCompare={() => setModal('POUR_SOUND_COMPARE')}
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
              setProfile((curr) => ({
                ...curr,
                coins: curr.coins - cost,
                boosters: { ...curr.boosters, [key]: curr.boosters[key] + amount },
              }));
              playPickupClink(profile.soundEnabled);
            }}
            onRefillLives={() => {
              if (profile.coins < 150 || profile.lives >= profile.maxLives) return;
              setProfile((curr) => ({
                ...curr,
                coins: curr.coins - 150,
                lives: curr.maxLives,
              }));
              playBottleComplete(profile.soundEnabled);
            }}
            onPurchaseRemoveAds={() => {
              setProfile((curr) => ({ ...curr, adsRemoved: true }));
              playBottleComplete(profile.soundEnabled);
            }}
            onBack={() => setScreen('HOME')}
          />
        )}

        {screen === 'SALONS' && (
          <SalonsComingSoonView
            coins={profile.coins}
            onBack={() => setScreen('HOME')}
          />
        )}

        <GameModals
          modal={modal}
          profile={profile}
          nowMs={nowMs}
          victorySnapshot={victorySnap}
          defeatSnapshot={defeatSnap}
          adRequest={adRequest}
          onCloseModal={() => setModal('NONE')}
          onResume={() => setModal('NONE')}
          onRestartConfirm={handleRestartConfirm}
          onExitToHome={handleExitToHome}
          onNextLevel={() => {
            if (activeTrialId) {
              setModal('NONE');
              setScreen('EVENT');
              setActiveTrialId(null);
            } else {
              startCampaignLevel(activeLevel.levelNumber + 1);
            }
          }}
          onRetryAfterDefeat={handleRetryAfterDefeat}
          onTriggerAd={(req) => {
            setAdRequest(req);
            setModal('AD_SIMULATION');
          }}
          onCompleteAd={handleCompleteAd}
          onRefillLivesWithCoins={() => {
            if (profile.coins < 150) return;
            setProfile((curr) => ({
              ...curr,
              coins: curr.coins - 150,
              lives: curr.maxLives,
            }));
            setModal('NONE');
          }}
          onToggleSetting={(key) =>
            setProfile((curr) => ({ ...curr, [key]: !curr[key] }))
          }
          onSelectBottleStyle={(bottleStyle) => {
            playPickupClink(profile.soundEnabled);
            setProfile((curr) => ({ ...curr, bottleStyle }));
          }}
          onOpenBottleCompare={() => setModal('BOTTLE_COMPARE')}
          onSelectPourSound={(pourSound) => {
            setProfile((curr) => ({ ...curr, pourSound }));
          }}
          onOpenPourSoundCompare={() => setModal('POUR_SOUND_COMPARE')}
          onPurchaseRemoveAds={() => {
            setProfile((curr) => ({ ...curr, adsRemoved: true }));
            playBottleComplete(profile.soundEnabled);
          }}
          onResetSave={() => {
            setProfile({ ...DEFAULT_PROFILE, lastLifeTimestamp: Date.now() });
            setModal('NONE');
            setScreen('HOME');
          }}
        />
      </main>
    </div>
  );
}
