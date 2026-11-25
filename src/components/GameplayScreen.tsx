import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import {
  addExtraFlaskBooster,
  applyShuffleBooster,
  canPour,
  cloneBottles,
  executePour,
  findSmartHintMove,
  hasValidMoves,
  isLevelComplete,
} from '../game/engine';
import { triggerSemanticHaptic, victoryHapticForTier } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { resolveVictoryCgTier } from '../game/outcomeCg';
import {
  playAddBottleSound,
  playBottleComplete,
  playCoinTick,
  playCorkPop,
  playErrorTap,
  playMysteryReveal,
  playObstacleUnlockSound,
  playPickupClink,
  playPourSound,
  playSealRiseChime,
  playShuffleSound,
  playUiClick,
  playUndoSound,
  playVictoryFanfare,
  resolveGameplayBgmMood,
  setBgmMood,
  stopPourSound,
} from '../game/sound';
import {
  buildVerticalStreamPath,
  computeMagicSortPourGeometry,
  computePourTransform,
  evaluatePourTimeline,
  getPourDurationMs,
  type MagicSortPourGeometry,
  type PourTimelineState,
} from '../game/pourAnimation';
import { SEAL_DURATION_MS, SEAL_TRIGGER_DELAY_MS } from '../game/sealAnimation';
import { IN_GAME_BOOSTER_COSTS } from '../game/storage';
import {
  computeOnboardingGuide,
  detectUnseenMechanicTip,
  type MechanicTipId,
} from '../game/tutorial';
import {
  BOTTLE_CAPACITY,
  type Bottle,
  type CgTier,
  type LevelSpec,
  type LiquidLayer,
  type PlayerProfile,
  type PotionColor,
  type TutorialTipId,
} from '../game/types';
import { LIQUID_3D_PALETTES } from './bottleDesigns';
import { CabinetMascots, type MascotSpeech } from './CabinetMascots';
import { CrystalBottle } from './CrystalBottle';
import {
  Coin3DIcon,
  ExtraBottle3DIcon,
  Gear3DIcon,
  Pause3DIcon,
  Restart3DIcon,
  Shuffle3DIcon,
  SoundOff3DIcon,
  SoundOn3DIcon,
  Undo3DIcon,
} from './GameIcons3D';
import { VictoryEffect } from './VictoryEffect';
import solsticeDragonAvatarImg from '../assets/images/solstice_dragon_avatar_1794985798351.jpg';
import solsticeMascotAvatarImg from '../assets/images/solstice_mascot_avatar_1794980022747.jpg';
import stageCFullwidthImg from '../assets/images/stage_c_fullwidth_1794988696753.jpg';

interface ActivePourState {
  id: number;
  sourceId: string;
  targetId: string;
  color: PotionColor;
  count: number;
  layersBefore: LiquidLayer[];
  targetBeforeCount: number;
  geom: MagicSortPourGeometry;
  timeline: PourTimelineState;
}

interface ObstacleUnlockBurst {
  id: number;
  type: 'cork' | 'crate' | 'curtain';
  color: PotionColor;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VictoryFlyToken {
  id: number;
  kind: 'coin' | 'star';
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  delayMs: number;
}

interface VictoryEffectState {
  stageWidth: number;
  stageHeight: number;
  tier: CgTier;
}

interface GameplayScreenProps {
  level: LevelSpec;
  isTrialMode: boolean;
  isPaused?: boolean;
  profile: PlayerProfile;
  runKey: number;
  continueGrantTick?: number;
  onPause: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  onRestartRequest: () => void;
  onConsumeBooster: (key: 'undo' | 'shuffle' | 'extraFlask') => boolean;
  onBuyInGameBooster: (key: 'undo' | 'shuffle' | 'extraFlask') => boolean;
  onVictory: (stats: {
    moves: number;
    elapsedSec: number;
    bottlesCount: number;
  }) => void;
  onGiveUp: (stats: {
    completedBottles: number;
    totalBottles: number;
    extraFlasksUsed: number;
  }) => void;
  onMarkTutorialSeen?: (tipId: TutorialTipId) => void;
}

const CRATE_SHARDS = [
  { dx: '-34px', dy: '-30px', rot: '-145deg' },
  { dx: '34px', dy: '-28px', rot: '155deg' },
  { dx: '-38px', dy: '14px', rot: '-95deg' },
  { dx: '38px', dy: '16px', rot: '115deg' },
  { dx: '-14px', dy: '-42px', rot: '-65deg' },
  { dx: '18px', dy: '-40px', rot: '85deg' },
];

function splitBottleRows(bottles: Bottle[]): { rows: Bottle[][]; compact: boolean } {
  const n = bottles.length;
  if (n <= 4) {
    return { rows: [bottles], compact: false };
  }
  if (n <= 8) {
    const topCount = Math.ceil(n / 2);
    return {
      rows: [bottles.slice(0, topCount), bottles.slice(topCount)],
      compact: false,
    };
  }
  if (n <= 10) {
    const topCount = Math.ceil(n / 2);
    return {
      rows: [bottles.slice(0, topCount), bottles.slice(topCount)],
      compact: true,
    };
  }
  const r1 = Math.ceil(n / 3);
  const r2 = Math.ceil((n - r1) / 2);
  return {
    rows: [bottles.slice(0, r1), bottles.slice(r1, r1 + r2), bottles.slice(r1 + r2)],
    compact: true,
  };
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  level,
  isTrialMode,
  isPaused = false,
  profile,
  runKey,
  continueGrantTick = 0,
  onPause,
  onOpenSettings,
  onToggleMute,
  onRestartRequest,
  onConsumeBooster,
  onBuyInGameBooster,
  onVictory,
  onGiveUp,
  onMarkTutorialSeen,
}) => {
  const { t, colorName, mechanicName } = useI18n();

  const [bottles, setBottles] = useState<Bottle[]>(() => cloneBottles(level.bottles));
  const [history, setHistory] = useState<Bottle[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shakeBottleId, setShakeBottleId] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [, setElapsedSec] = useState(0);
  const [freeStreakUndos, setFreeStreakUndos] = useState(0);
  const [activePour, setActivePour] = useState<ActivePourState | null>(null);
  const [sealVisuals, setSealVisuals] = useState<
    Record<string, { pending: boolean; progress: number | null }>
  >({});
  const [obstacleBursts, setObstacleBursts] = useState<ObstacleUnlockBurst[]>([]);
  const [victoryFlyTokens, setVictoryFlyTokens] = useState<VictoryFlyToken[]>([]);
  const [victoryEffect, setVictoryEffect] = useState<VictoryEffectState | null>(null);
  const [hudCoinBonus, setHudCoinBonus] = useState(0);
  const [coinPopTick, setCoinPopTick] = useState(0);
  const [mascotCheering, setMascotCheering] = useState(false);
  const [reaction, setReaction] = useState<MascotSpeech | null>(null);
  const [activeMechanicTip, setActiveMechanicTip] = useState<MechanicTipId | null>(null);

  const wonRef = useRef(false);
  const movesRef = useRef(0);
  const elapsedSecRef = useRef(0);
  const bottleComboRef = useRef(0);
  const pourRafRef = useRef<number | null>(null);
  const pourSeqRef = useRef(1);
  const burstSeqRef = useRef(1);
  const cheerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cheerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionSeqRef = useRef(1);
  const victoryTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const fxTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const lastContinueTickRef = useRef(continueGrantTick);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sealHandlesRef = useRef<
    Record<string, { timer: ReturnType<typeof setTimeout> | null; raf: number | null }>
  >({});

  const stageRef = useRef<HTMLDivElement | null>(null);
  const coinPillRef = useRef<HTMLDivElement | null>(null);
  const bottleRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const clearVictoryTimers = () => {
    victoryTimersRef.current.forEach((id) => clearTimeout(id));
    victoryTimersRef.current = [];
  };

  const clearFxTimers = () => {
    fxTimersRef.current.forEach((id) => clearTimeout(id));
    fxTimersRef.current = [];
  };

  const scheduleFxTimer = (fn: () => void, delayMs: number) => {
    const id = setTimeout(() => {
      fxTimersRef.current = fxTimersRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    fxTimersRef.current.push(id);
  };

  const clearMascotCheerTimers = () => {
    if (cheerTimerRef.current) {
      clearTimeout(cheerTimerRef.current);
      cheerTimerRef.current = null;
    }
    if (cheerDelayRef.current) {
      clearTimeout(cheerDelayRef.current);
      cheerDelayRef.current = null;
    }
  };

  const triggerMascotCheer = (durationMs = 1500, delayMs = 0) => {
    clearMascotCheerTimers();
    const startCheer = () => {
      setMascotCheering(true);
      cheerTimerRef.current = setTimeout(() => {
        setMascotCheering(false);
        cheerTimerRef.current = null;
      }, durationMs);
    };
    if (delayMs > 0) {
      cheerDelayRef.current = setTimeout(startCheer, delayMs);
    } else {
      startCheer();
    }
  };

  const triggerBottleShake = (bottleId: string) => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeBottleId(bottleId);
    shakeTimerRef.current = setTimeout(() => {
      setShakeBottleId(null);
      shakeTimerRef.current = null;
    }, 300);
  };

  const cancelAllSealAnimations = () => {
    Object.values(sealHandlesRef.current).forEach((handle) => {
      if (handle.timer) clearTimeout(handle.timer);
      if (handle.raf !== null) cancelAnimationFrame(handle.raf);
    });
    sealHandlesRef.current = {};
    setSealVisuals({});
  };

  const getLayoutRectInStage = (el: HTMLElement, stageEl: HTMLElement) => {
    let left = 0;
    let top = 0;
    let curr: HTMLElement | null = el;
    while (curr && curr !== stageEl) {
      left += curr.offsetLeft;
      top += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }
    if (curr === stageEl) {
      return { left, top, width: el.offsetWidth, height: el.offsetHeight };
    }
    const sRect = stageEl.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      left: eRect.left - sRect.left,
      top: eRect.top - sRect.top,
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  };

  const spawnObstacleUnlockBurst = (
    bottleId: string,
    type: 'cork' | 'crate' | 'curtain',
    color: PotionColor
  ) => {
    const stageEl = stageRef.current;
    const targetEl = bottleRefs.current[bottleId];
    if (!stageEl || !targetEl) return;

    const rect = getLayoutRectInStage(targetEl, stageEl);
    const id = ++burstSeqRef.current;
    const burst: ObstacleUnlockBurst = {
      id,
      type,
      color,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * 0.48,
      width: rect.width,
      height: rect.height,
    };

    setObstacleBursts((prev) => [...prev, burst]);
    scheduleFxTimer(() => {
      setObstacleBursts((prev) => prev.filter((item) => item.id !== id));
    }, 520);
  };

  const launchVictoryFlyInTokens = (rewardCoins: number, soundEnabled: boolean) => {
    const stageEl = stageRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!stageEl || reducedMotion) return;

    const stageW = stageEl.clientWidth || 390;
    const stageH = stageEl.clientHeight || 844;
    const startX = stageW * 0.5;
    const startY = stageH * 0.56;

    let targetX = 88;
    let targetY = 34;
    if (coinPillRef.current) {
      const r = getLayoutRectInStage(coinPillRef.current, stageEl);
      targetX = r.left + r.width * 0.45;
      targetY = r.top + r.height * 0.5;
    }

    const totalTokens = 7;
    const tokens: VictoryFlyToken[] = Array.from({ length: totalTokens }, (_, idx) => {
      const angle = ((idx / (totalTokens - 1)) - 0.5) * 2.1;
      const spreadX = Math.sin(angle) * 68;
      const spreadY = -24 - Math.cos(angle) * 30;
      const jitterX = (idx - 3) * 14;
      const jitterY = (idx % 2 === 0 ? -1 : 1) * 14;
      return {
        id: ++burstSeqRef.current,
        kind: idx % 3 === 1 ? 'star' : 'coin',
        startX: startX + jitterX,
        startY: startY + jitterY,
        midX: spreadX,
        midY: spreadY,
        endX: targetX - (startX + jitterX),
        endY: targetY - (startY + jitterY),
        delayMs: idx * 65,
      };
    });

    setVictoryFlyTokens(tokens);

    // Roll HUD coin preview smoothly as each token arrives
    const coinSteps = 5;
    const perStep = Math.max(1, Math.round(rewardCoins / coinSteps));
    for (let i = 0; i < coinSteps; i++) {
      const arrivalTimer = setTimeout(() => {
        playCoinTick(soundEnabled, i);
        setHudCoinBonus((prev) => Math.min(rewardCoins, prev + perStep));
        setCoinPopTick((c) => c + 1);
      }, 420 + i * 75);
      victoryTimersRef.current.push(arrivalTimer);
    }

    const clearTimer = setTimeout(() => {
      setVictoryFlyTokens([]);
    }, 1250);
    victoryTimersRef.current.push(clearTimer);
  };

  const triggerVictoryEffect = (tier: CgTier) => {
    const stageEl = stageRef.current;
    const stageWidth = stageEl?.clientWidth || 390;
    const stageHeight = stageEl?.clientHeight || 844;
    setVictoryEffect({ stageWidth, stageHeight, tier });

    const cleanupTimer = setTimeout(() => {
      setVictoryEffect(null);
    }, 1850);
    victoryTimersRef.current.push(cleanupTimer);
  };

  const triggerBottleSealCelebration = (
    bottleId: string,
    soundEnabled: boolean,
    hapticsEnabled: boolean
  ) => {
    const existing = sealHandlesRef.current[bottleId];
    if (existing) {
      if (existing.timer) clearTimeout(existing.timer);
      if (existing.raf !== null) cancelAnimationFrame(existing.raf);
      delete sealHandlesRef.current[bottleId];
    }

    const comboStep = bottleComboRef.current;
    bottleComboRef.current += 1;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const concurrentCount = Object.keys(sealHandlesRef.current).length;
    const durationMs = concurrentCount > 0 ? Math.round(SEAL_DURATION_MS / 1.25) : SEAL_DURATION_MS;

    setSealVisuals((prev) => ({
      ...prev,
      [bottleId]: { pending: true, progress: null },
    }));

    const handle: { timer: ReturnType<typeof setTimeout> | null; raf: number | null } = {
      timer: null,
      raf: null,
    };
    sealHandlesRef.current[bottleId] = handle;

    handle.timer = setTimeout(() => {
      handle.timer = null;

      if (reducedMotion) {
        delete sealHandlesRef.current[bottleId];
        setSealVisuals((prev) => {
          const next = { ...prev };
          delete next[bottleId];
          return next;
        });
        playCorkPop(soundEnabled);
        playBottleComplete(soundEnabled, comboStep);
        triggerSemanticHaptic(hapticsEnabled, 'bottleSeal');
        triggerMascotCheer(1500, 0);
        return;
      }

      playSealRiseChime(soundEnabled, comboStep);
      const startMs = performance.now();
      let corkBeatFired = false;

      const step = (now: number) => {
        const p = (now - startMs) / durationMs;

        if (!corkBeatFired && p >= 0.72) {
          corkBeatFired = true;
          playCorkPop(soundEnabled);
          playBottleComplete(soundEnabled, comboStep);
          triggerSemanticHaptic(hapticsEnabled, 'bottleSeal');
          triggerMascotCheer(1600, 0);
        }

        if (p >= 1) {
          delete sealHandlesRef.current[bottleId];
          setSealVisuals((prev) => {
            if (!(bottleId in prev)) return prev;
            const next = { ...prev };
            delete next[bottleId];
            return next;
          });
          return;
        }

        setSealVisuals((prev) => ({
          ...prev,
          [bottleId]: { pending: false, progress: p },
        }));
        handle.raf = requestAnimationFrame(step);
      };

      setSealVisuals((prev) => ({
        ...prev,
        [bottleId]: { pending: false, progress: 0 },
      }));
      handle.raf = requestAnimationFrame(step);
    }, SEAL_TRIGGER_DELAY_MS);
  };

  const cancelPourAnimation = () => {
    if (pourRafRef.current !== null) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }
    stopPourSound();
    setActivePour(null);
  };

  useEffect(() => {
    return () => {
      if (pourRafRef.current !== null) {
        cancelAnimationFrame(pourRafRef.current);
      }
      stopPourSound();
      clearMascotCheerTimers();
      clearVictoryTimers();
      clearFxTimers();
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      Object.values(sealHandlesRef.current).forEach((handle) => {
        if (handle.timer) clearTimeout(handle.timer);
        if (handle.raf !== null) cancelAnimationFrame(handle.raf);
      });
      sealHandlesRef.current = {};
    };
  }, []);

  const clearReaction = () => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setReaction(null);
  };

  const pushReaction = (who: 'fox' | 'dragon', text: string, durationMs = 4200) => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    const id = ++reactionSeqRef.current;
    setReaction({ id, who, text });
    if (durationMs > 0) {
      reactionTimerRef.current = setTimeout(() => {
        setReaction((curr) => (curr && curr.id === id ? null : curr));
        reactionTimerRef.current = null;
      }, durationMs);
    }
  };

  // In-place Continue (+1 Extra Flask) after Defeat — preserves all solved bottles & progress!
  useEffect(() => {
    if (continueGrantTick > lastContinueTickRef.current) {
      lastContinueTickRef.current = continueGrantTick;
      cancelPourAnimation();
      setSelectedId(null);
      setBottles((curr) => addExtraFlaskBooster(curr, 3));
      triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
      pushReaction('dragon', t('reactExtraFlaskAdded'));
    }
  }, [continueGrantTick]);

  useEffect(() => {
    wonRef.current = false;
    movesRef.current = 0;
    bottleComboRef.current = 0;
    cancelPourAnimation();
    cancelAllSealAnimations();
    clearMascotCheerTimers();
    clearVictoryTimers();
    clearFxTimers();
    clearReaction();
    setMascotCheering(false);
    setObstacleBursts([]);
    setVictoryFlyTokens([]);
    setVictoryEffect(null);
    setHudCoinBonus(0);
    const fresh = cloneBottles(level.bottles);
    setBottles(fresh);
    setHistory([]);
    setSelectedId(null);
    setMoves(0);
    setElapsedSec(0);
    elapsedSecRef.current = 0;
    setFreeStreakUndos(profile.streak >= 3 ? 1 : 0);

    const isFirstTimeBasics =
      !isTrialMode && level.levelNumber === 1 && !profile.seenTutorials.includes('basics');
    const unseenTip = isFirstTimeBasics
      ? null
      : detectUnseenMechanicTip(fresh, profile.seenTutorials);
    setActiveMechanicTip(unseenTip);

    if (isFirstTimeBasics) {
      pushReaction('fox', t('tutorialBasicsHint'), 6000);
    } else if (!unseenTip && level.mechanicsIntroduced[0]) {
      pushReaction('fox', t('reactNewCraft', { name: mechanicName(level.mechanicsIntroduced[0]) }));
    }

    if (profile.streak >= 1 && !isTrialMode && !isFirstTimeBasics) {
      const streakAtStart = profile.streak;
      const timer = setTimeout(() => {
        if (wonRef.current || movesRef.current > 0) return;
        let nextState = cloneBottles(fresh);
        const autoMoves = streakAtStart >= 2 ? 2 : 1;
        let applied = 0;
        for (let i = 0; i < autoMoves; i++) {
          const hint = findSmartHintMove(nextState);
          if (!hint) break;
          const out = executePour(nextState, hint.sourceId, hint.targetId);
          if (!out || isLevelComplete(out.bottles)) break;
          nextState = out.bottles;
          applied += 1;
        }
        if (applied > 0) {
          setBottles(nextState);
          pushReaction(
            'dragon',
            streakAtStart >= 3
              ? t('reactStreakBoost3', { n: streakAtStart, count: applied })
              : t('reactStreakBoost', { n: streakAtStart, count: applied })
          );
        }
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [level, runKey]);

  // Pause-aware subtle level duration & bonus countdown ticker
  useEffect(() => {
    if (isPaused || wonRef.current) return;
    const interval = setInterval(() => {
      if (wonRef.current) return;
      elapsedSecRef.current += 1;
      setElapsedSec(elapsedSecRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, level, runKey]);

  const stuck = useMemo(
    () => !isLevelComplete(bottles) && !hasValidMoves(bottles),
    [bottles]
  );

  const triggerMagicSortPour = (
    srcId: string,
    dstId: string,
    color: PotionColor,
    count: number,
    layersBefore: LiquidLayer[],
    targetBeforeCount: number
  ) => {
    const stageEl = stageRef.current;
    const srcEl = bottleRefs.current[srcId];
    const dstEl = bottleRefs.current[dstId];
    if (!stageEl || !srcEl || !dstEl) return;

    const stageRect = { left: 0, top: 0, width: stageEl.clientWidth, height: stageEl.clientHeight };
    const srcRect = getLayoutRectInStage(srcEl, stageEl);
    const dstRect = getLayoutRectInStage(dstEl, stageEl);

    const geom = computeMagicSortPourGeometry(
      stageRect,
      srcRect,
      dstRect,
      targetBeforeCount,
      count,
      layersBefore.length
    );

    if (pourRafRef.current !== null) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }

    pourSeqRef.current += 1;
    const seqId = pourSeqRef.current;
    const startMs = performance.now();
    const durationMs = getPourDurationMs(count);

    setActivePour({
      id: seqId,
      sourceId: srcId,
      targetId: dstId,
      color,
      count,
      layersBefore,
      targetBeforeCount,
      geom,
      timeline: evaluatePourTimeline(0, geom.maxTiltDeg, geom.startTiltDeg),
    });

    const step = (now: number) => {
      const p = (now - startMs) / durationMs;
      if (p >= 1) {
        pourRafRef.current = null;
        setActivePour((curr) => (curr && curr.id === seqId ? null : curr));
        return;
      }
      const nextTimeline = evaluatePourTimeline(p, geom.maxTiltDeg, geom.startTiltDeg);
      setActivePour((curr) =>
        curr && curr.id === seqId ? { ...curr, timeline: nextTimeline } : curr
      );
      pourRafRef.current = requestAnimationFrame(step);
    };

    pourRafRef.current = requestAnimationFrame(step);
  };

  const handleSelectBottle = (bottleId: string) => {
    if (wonRef.current || isPaused) return;
    if (activePour && (activePour.sourceId === bottleId || activePour.targetId === bottleId)) {
      return;
    }
    const clicked = bottles.find((b) => b.id === bottleId);
    if (!clicked) return;

    if (!selectedId) {
      if (clicked.layers.length === 0 || clicked.obstacle.type !== 'none') {
        playErrorTap(profile.soundEnabled);
        triggerSemanticHaptic(profile.hapticsEnabled, 'error');
        triggerBottleShake(bottleId);
        if (clicked.obstacle.type === 'cork') {
          pushReaction('fox', t('reactCorkLocked', { color: colorName(clicked.obstacle.requiredColor) }));
        } else if (clicked.obstacle.type === 'crate') {
          pushReaction('dragon', t('reactCrateLocked', { color: colorName(clicked.obstacle.lockColor) }));
        } else if (clicked.obstacle.type === 'curtain') {
          pushReaction('fox', t('reactCurtainLocked', { color: colorName(clicked.obstacle.unlockColor) }));
        }
        return;
      }

      const bottleIdx = bottles.findIndex((b) => b.id === bottleId);
      const stereoPan =
        bottles.length > 1 ? ((bottleIdx / (bottles.length - 1)) * 2 - 1) * 0.28 : 0;
      playPickupClink(profile.soundEnabled, stereoPan);
      triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
      setSelectedId(bottleId);
      return;
    }

    if (selectedId === bottleId) {
      playUiClick(profile.soundEnabled, 'close');
      triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
      setSelectedId(null);
      return;
    }

    const source = bottles.find((b) => b.id === selectedId);
    if (source && canPour(source, clicked)) {
      const sourceBeforeLayers = source.layers.map((l) => ({ ...l }));
      const targetBeforeCount = clicked.layers.length;
      const outcome = executePour(bottles, source.id, clicked.id);
      if (outcome) {
        setHistory((prev) => [...prev, cloneBottles(bottles)]);
        setBottles(outcome.bottles);
        setSelectedId(null);
        movesRef.current += 1;
        setMoves((m) => m + 1);
        triggerMagicSortPour(
          source.id,
          clicked.id,
          outcome.pouredColor,
          outcome.pouredCount,
          sourceBeforeLayers,
          targetBeforeCount
        );

        const targetFillRatio = targetBeforeCount / BOTTLE_CAPACITY;
        playPourSound(profile.soundEnabled, outcome.pouredCount, targetFillRatio);
        triggerSemanticHaptic(profile.hapticsEnabled, 'pour');

        if (outcome.completedTarget) {
          triggerBottleSealCelebration(
            clicked.id,
            profile.soundEnabled,
            profile.hapticsEnabled
          );
        }

        if (outcome.revealedHidden) {
          scheduleFxTimer(() => {
            playMysteryReveal(profile.soundEnabled);
          }, 210);
        }

        if (outcome.unlockedCork) {
          scheduleFxTimer(() => {
            playObstacleUnlockSound(profile.soundEnabled, 'cork');
            triggerSemanticHaptic(profile.hapticsEnabled, 'obstacleUnlock');
            spawnObstacleUnlockBurst(clicked.id, 'cork', outcome.pouredColor);
          }, 140);
          pushReaction('dragon', t('reactCorkPopped'));
        } else if (outcome.unlockedObstacles.length > 0) {
          const unlockedList = outcome.unlockedObstacles;
          scheduleFxTimer(() => {
            triggerSemanticHaptic(profile.hapticsEnabled, 'obstacleUnlock');
            unlockedList.forEach((obs, idx) => {
              if (idx === 0) {
                playObstacleUnlockSound(profile.soundEnabled, obs.type);
              }
              spawnObstacleUnlockBurst(obs.bottleId, obs.type, obs.color);
            });
          }, 260);
          pushReaction(
            'fox',
            unlockedList.some((o) => o.type === 'curtain')
              ? t('reactCurtainLifted')
              : t('reactCrateUnlocked')
          );
        } else if (outcome.completedTarget) {
          pushReaction('dragon', t('reactBottleSealed', { color: colorName(outcome.pouredColor) }));
        } else if (outcome.revealedHidden) {
          pushReaction('fox', t('reactHiddenRevealed'));
        }

        if (isLevelComplete(outcome.bottles)) {
          wonRef.current = true;
          if (!isTrialMode && level.levelNumber === 1 && !profile.seenTutorials.includes('basics')) {
            onMarkTutorialSeen?.('basics');
          }
          pushReaction('dragon', t('reactLevelComplete', { name: headerLevelTitle }), 3500);
          const finalElapsedSec = Math.max(1, elapsedSecRef.current);
          const isFrontierCampaign = !isTrialMode && level.levelNumber >= profile.highestLevel;
          const victoryTier = resolveVictoryCgTier({
            streakAfterWin: isFrontierCampaign ? profile.streak + 1 : profile.streak,
            isTrial: isTrialMode,
          });
          const flyStartDelay = outcome.completedTarget ? 920 : 420;
          const modalOpenDelay = flyStartDelay + 820;

          const flyTimer = setTimeout(() => {
            playVictoryFanfare(profile.soundEnabled, victoryTier);
            triggerSemanticHaptic(profile.hapticsEnabled, victoryHapticForTier(victoryTier));
            triggerMascotCheer(1900, 0);
            triggerVictoryEffect(victoryTier);
            launchVictoryFlyInTokens(
              isTrialMode ? 60 : level.rewardCoins,
              profile.soundEnabled
            );
          }, flyStartDelay);

          const doneTimer = setTimeout(() => {
            setHudCoinBonus(0);
            onVictory({
              moves: moves + 1,
              elapsedSec: finalElapsedSec,
              bottlesCount: level.colorCount,
            });
          }, modalOpenDelay);

          victoryTimersRef.current.push(flyTimer, doneTimer);
        }
        return;
      }
    }

    if (clicked.layers.length > 0 && clicked.obstacle.type === 'none') {
      playPickupClink(profile.soundEnabled);
      triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
      setSelectedId(clicked.id);
    } else {
      playErrorTap(profile.soundEnabled);
      triggerSemanticHaptic(profile.hapticsEnabled, 'error');
      triggerBottleShake(bottleId);
      if (clicked.obstacle.type === 'cork') {
        pushReaction('fox', t('reactCorkLocked', { color: colorName(clicked.obstacle.requiredColor) }));
      } else if (clicked.obstacle.type === 'crate') {
        pushReaction('dragon', t('reactCrateLocked', { color: colorName(clicked.obstacle.lockColor) }));
      } else if (clicked.obstacle.type === 'curtain') {
        pushReaction('fox', t('reactCurtainLocked', { color: colorName(clicked.obstacle.unlockColor) }));
      }
      setSelectedId(null);
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || wonRef.current || isPaused) return;
    let boughtWithCoins = false;
    if (freeStreakUndos > 0) {
      setFreeStreakUndos((c) => c - 1);
    } else if (!onConsumeBooster('undo')) {
      if (!onBuyInGameBooster('undo')) {
        playErrorTap(profile.soundEnabled);
        triggerSemanticHaptic(profile.hapticsEnabled, 'error');
        pushReaction('fox', t('reactNotEnoughCoins', { cost: IN_GAME_BOOSTER_COSTS.undo }));
        return;
      }
      boughtWithCoins = true;
    }
    cancelPourAnimation();
    cancelAllSealAnimations();
    clearFxTimers();
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBottles(prev);
    setSelectedId(null);
    playUndoSound(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
    pushReaction(
      'fox',
      boughtWithCoins
        ? t('reactBoughtBooster', { cost: IN_GAME_BOOSTER_COSTS.undo })
        : t('reactUndoDone')
    );
  };

  const handleShuffle = () => {
    if (wonRef.current || isPaused) return;
    let boughtWithCoins = false;
    if (!onConsumeBooster('shuffle')) {
      if (!onBuyInGameBooster('shuffle')) {
        playErrorTap(profile.soundEnabled);
        triggerSemanticHaptic(profile.hapticsEnabled, 'error');
        pushReaction('fox', t('reactNotEnoughCoins', { cost: IN_GAME_BOOSTER_COSTS.shuffle }));
        return;
      }
      boughtWithCoins = true;
    }
    cancelPourAnimation();
    cancelAllSealAnimations();
    clearFxTimers();
    setHistory((h) => [...h, cloneBottles(bottles)]);
    setBottles((curr) => applyShuffleBooster(curr, Date.now()));
    setSelectedId(null);
    playShuffleSound(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'obstacleUnlock');
    pushReaction(
      'dragon',
      boughtWithCoins
        ? t('reactBoughtBooster', { cost: IN_GAME_BOOSTER_COSTS.shuffle })
        : t('reactShuffleDone')
    );
  };

  const handleAddFlask = () => {
    if (wonRef.current || isPaused) return;
    const extraCount = bottles.filter((b) => b.isExtra).length;
    if (extraCount >= 2) {
      playErrorTap(profile.soundEnabled);
      triggerSemanticHaptic(profile.hapticsEnabled, 'error');
      pushReaction('fox', t('reactMaxExtraFlasks'));
      return;
    }
    let boughtWithCoins = false;
    if (!onConsumeBooster('extraFlask')) {
      if (!onBuyInGameBooster('extraFlask')) {
        playErrorTap(profile.soundEnabled);
        triggerSemanticHaptic(profile.hapticsEnabled, 'error');
        pushReaction('fox', t('reactNotEnoughCoins', { cost: IN_GAME_BOOSTER_COSTS.extraFlask }));
        return;
      }
      boughtWithCoins = true;
    }
    cancelPourAnimation();
    setBottles((curr) => addExtraFlaskBooster(curr));
    setSelectedId(null);
    playAddBottleSound(profile.soundEnabled);
    triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
    pushReaction(
      'dragon',
      boughtWithCoins
        ? t('reactBoughtBooster', { cost: IN_GAME_BOOSTER_COSTS.extraFlask })
        : t('reactExtraFlaskAdded')
    );
  };

  // Real-time BGM climax escalation when only 1-2 unfinished bottles remain
  useEffect(() => {
    const remainingBottles = bottles.filter(
      (b) =>
        b.layers.length > 0 &&
        !(
          b.layers.length === BOTTLE_CAPACITY &&
          b.layers.every((l) => !l.hidden && l.color === b.layers[0].color)
        )
    ).length;

    setBgmMood(
      resolveGameplayBgmMood({
        inGameplay: true,
        difficulty: level.difficulty,
        isTrial: isTrialMode,
        streak: profile.streak,
        remainingBottles,
      })
    );
  }, [bottles, level.difficulty, isTrialMode, profile.streak]);

  // Auto-dismiss first-encounter mechanic tip after 2 pours so fast players aren't blocked
  useEffect(() => {
    if (moves >= 2 && activeMechanicTip) {
      onMarkTutorialSeen?.(activeMechanicTip);
      setActiveMechanicTip(null);
    }
  }, [moves, activeMechanicTip, onMarkTutorialSeen]);

  const onboardingGuide = useMemo(() => {
    if (isPaused || Boolean(activePour) || wonRef.current) return null;
    return computeOnboardingGuide({
      levelNumber: level.levelNumber,
      isTrialMode,
      bottles,
      selectedId,
      seenTutorials: profile.seenTutorials,
    });
  }, [
    isPaused,
    activePour,
    level.levelNumber,
    isTrialMode,
    bottles,
    selectedId,
    profile.seenTutorials,
  ]);

  const difficultyLabel =
    level.difficulty === 'super_hard'
      ? t('diffSuperHard')
      : level.difficulty === 'hard'
      ? t('diffHard')
      : null;

  const { rows, compact } = useMemo(() => splitBottleRows(bottles), [bottles]);
  const totalUndoCount = profile.boosters.undo + freeStreakUndos;

  const stageImage = stageCFullwidthImg;
  const stageAlt = t('gameSubtitle');

  const atmosphereOverlay =
    level.difficulty === 'super_hard'
      ? 'bg-gradient-to-b from-[#3A1078]/26 via-transparent to-[#22074A]/32'
      : level.difficulty === 'hard'
      ? 'bg-gradient-to-b from-[#D9690E]/18 via-transparent to-[#4B1A78]/26'
      : 'bg-gradient-to-b from-[#FFF3C9]/8 via-transparent to-[#3B1766]/18';

  const getRowBottomPct = (rowIdx: number, totalRows: number): number => {
    if (totalRows === 1) return 46.0;
    if (totalRows === 2) {
      return rowIdx === 0 ? 46.0 : 24.8;
    }
    const bottom = 21.8;
    const step = 16.5;
    return bottom + (totalRows - 1 - rowIdx) * step;
  };

  const renderBottleRow = (rowBottles: Bottle[]) => (
    <div
      className={
        rowBottles.length >= 5
          ? 'grid grid-cols-5 gap-1 w-full max-w-[336px] place-items-end px-1'
          : 'flex items-end justify-center gap-3 w-full max-w-[336px] px-2'
      }
    >
      {rowBottles.map((bottle) => {
        const isSource = activePour?.sourceId === bottle.id;
        const isTarget = activePour?.targetId === bottle.id;
        const pourSourceOverride =
          isSource && activePour
            ? (() => {
                const tr = computePourTransform(activePour.geom, activePour.timeline);
                return {
                  layersBefore: activePour.layersBefore,
                  pouredCount: activePour.count,
                  flyX: tr.flyX,
                  flyY: tr.flyY,
                  tiltDeg: tr.tiltDeg,
                  drainRatio: activePour.timeline.drainRatio,
                };
              })()
            : null;
        const pourFillOverride =
          isTarget && activePour
            ? {
                beforeCount: activePour.targetBeforeCount,
                pouredCount: activePour.count,
                fillRatio: activePour.timeline.fillRatio,
                isStreaming:
                  activePour.timeline.streamTip >= 0.94 &&
                  activePour.timeline.streamCut < 0.75,
              }
            : null;

        const sealState = sealVisuals[bottle.id];
        const isShaking = shakeBottleId === bottle.id;
        const isGuidedBottle = onboardingGuide?.bottleId === bottle.id;

        return (
          <div
            key={bottle.id}
            className={`relative ${isShaking ? 'animate-bottle-error-shake' : ''}`}
          >
            {isGuidedBottle && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1.5 rounded-2xl border-2 border-[#FFE875] bg-[#FFE875]/15 shadow-[0_0_18px_rgba(255,226,89,0.85)] animate-tutorial-halo z-[1]"
              />
            )}
            <CrystalBottle
              bottle={bottle}
              bottleStyle={profile.bottleStyle}
              selected={selectedId === bottle.id}
              pourSourceOverride={pourSourceOverride}
              pourFillOverride={pourFillOverride}
              sealProgress={sealState?.progress ?? null}
              sealPending={Boolean(sealState?.pending)}
              colorSymbolsEnabled={profile.colorSymbolsEnabled}
              compact={compact}
              onSelect={handleSelectBottle}
              buttonRef={(el) => {
                bottleRefs.current[bottle.id] = el;
              }}
            />
            {isGuidedBottle && onboardingGuide && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 z-[35] flex flex-col items-center animate-tutorial-finger"
              >
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFE259] border-2 border-[#6B2D00] text-[#4E2100] text-[10px] font-black shadow-[0_3px_0_rgba(78,33,0,0.45)] whitespace-nowrap">
                  {onboardingGuide.step === 'pick_source'
                    ? t('tutorialTapSource')
                    : t('tutorialTapTarget')}
                </span>
                <svg
                  viewBox="0 0 36 36"
                  className="w-7 h-7 -mt-0.5 drop-shadow-[0_3px_4px_rgba(40,12,0,0.55)]"
                >
                  <path
                    d="M15.5 3.5 C15.5 2 17 1 18.5 1 C20 1 21.5 2 21.5 3.5 L21.5 15 L23.5 14 C25 13.4 26.5 14.3 26.5 15.8 L26.5 17.5 L28 17 C29.4 16.6 30.8 17.6 30.8 19.1 L30.8 24.5 C30.8 30 26.5 34 21 34 L16 34 C11.5 34 8.5 30.8 7.6 26.4 L5.7 19.8 C5.2 18.2 6.3 16.6 7.9 16.4 C9.3 16.2 10.6 17 11.1 18.3 L12.5 21.5 L12.5 3.5 Z"
                    fill="#FFF7DE"
                    stroke="#5A2404"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    transform="rotate(180 18 18)"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Compute Magic Sort vertical stream geometry on active frame
  const verticalStream = useMemo(() => {
    if (!activePour) return null;
    const { geom, timeline, color, id } = activePour;
    if (timeline.streamTip <= 0.02 || timeline.streamCut >= 0.99) return null;

    const currentSurfaceY =
      geom.targetStartSurfaceY +
      (geom.targetEndSurfaceY - geom.targetStartSurfaceY) * timeline.fillRatio;
    const span = Math.max(8, currentSurfaceY - geom.streamStartY);
    const topY = geom.streamStartY + span * timeline.streamCut;
    const botY = geom.streamStartY + span * timeline.streamTip;
    if (botY <= topY + 2) return null;

    const pathD = buildVerticalStreamPath(
      geom.mouthX,
      geom.mouthY,
      geom.streamX,
      topY,
      botY,
      timeline.streamCut,
      timeline.streamTip,
      timeline.streamFlow
    );
    const pal = LIQUID_3D_PALETTES[color];
    const splashPulse = 0.85 + 0.32 * Math.sin(timeline.pourProgress * Math.PI * 6);
    const dropHopA = Math.abs(Math.sin(timeline.pourProgress * Math.PI * 4.5));
    const dropHopB = Math.abs(Math.cos(timeline.pourProgress * Math.PI * 5.2));

    return {
      id,
      pathD,
      streamX: geom.streamX,
      topY: Math.max(topY, geom.streamStartY + 8),
      botY,
      currentSurfaceY,
      showSplash: timeline.streamTip >= 0.95 && timeline.streamCut < 0.45,
      splashPulse,
      dropHopA,
      dropHopB,
      pal,
    };
  }, [activePour]);

  const displayedCoins = profile.coins + hudCoinBonus;
  const headerLevelTitle = isTrialMode
    ? level.title
    : t('levelCta', { n: level.levelNumber });

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden font-game-body select-none"
    >
      {/* Seamless top extension slice + Cabinet background */}
      <img
        src={stageImage}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute top-0 inset-x-0 w-full h-[56px] object-cover object-top"
      />
      <img
        src={stageImage}
        alt={stageAlt}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ transform: 'translateY(3.2%)' }}
      />
      <div className={`pointer-events-none absolute inset-0 ${atmosphereOverlay}`} />

      {/* TOP HUD BAR */}
      <header className="relative z-20 pt-3 px-3.5 flex flex-col items-center gap-1.5">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Left: Pause + Coin Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playUiClick(profile.soundEnabled);
                triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                onPause();
              }}
              aria-label={t('pauseTitle')}
              className="candy-btn-purple w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <Pause3DIcon className="w-5 h-5" />
            </button>

            <div
              ref={coinPillRef}
              key={coinPopTick}
              className={`relative flex items-center ml-1 ${
                coinPopTick > 0 ? 'animate-hud-coin-pop' : ''
              }`}
            >
              <div
                aria-label={`${t('coinsLabel')} ${displayedCoins}`}
                className="candy-pill-cream flex items-center pl-7 pr-3.5 py-1.5 text-[#5A2906] text-sm font-black font-tabular leading-none"
              >
                <span>{displayedCoins.toLocaleString()}</span>
              </div>
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Coin3DIcon className="w-8 h-8 drop-shadow" />
              </div>
            </div>
          </div>

          {/* Right: Mute + Restart + Settings */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                onToggleMute();
              }}
              aria-label={
                profile.soundEnabled || profile.bgmEnabled ? t('soundOn') : t('soundMuted')
              }
              className="candy-btn-blue w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              {profile.soundEnabled || profile.bgmEnabled ? (
                <SoundOn3DIcon className="w-6 h-5" />
              ) : (
                <SoundOff3DIcon className="w-6 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playUiClick(profile.soundEnabled);
                triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                onRestartRequest();
              }}
              aria-label={t('restartLevelBtn')}
              className="candy-btn-amber w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <Restart3DIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                playUiClick(profile.soundEnabled);
                triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                onOpenSettings();
              }}
              aria-label={t('settingsTitle')}
              className="candy-btn-blue w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <Gear3DIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Royal Purple-Gold Level Capsule */}
        <div className="flex flex-col items-center">
          <div className="candy-btn-purple-pill px-7 py-2 flex items-center gap-2">
            <span className="font-game-display text-[17px] leading-none font-bold text-[#FFE96B] game-stroke-sm whitespace-nowrap">
              {headerLevelTitle}
            </span>
            {difficultyLabel && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border whitespace-nowrap ${
                  level.difficulty === 'super_hard'
                    ? 'bg-[#E81938] border-[#FFD1D8] text-white'
                    : 'bg-[#FFBF2E] border-[#FFF5BF] text-[#4D2100]'
                }`}
              >
                {difficultyLabel}
              </span>
            )}
          </div>
        </div>

        {/* Stuck Deadlock Banner & First-Encounter Mechanic Tip */}
        {(stuck || activeMechanicTip) && (
          <div className="flex flex-col items-center gap-1.5 w-full">
            {stuck && (
              <div className="animate-mascot-cheer flex items-center gap-2 px-3 py-1 rounded-full bg-[#D91634] border-2 border-[#FFE875] text-white text-xs font-black shadow-md">
                <img
                  src={solsticeDragonAvatarImg}
                  alt="Sky dragon companion"
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border-2 border-[#FFE875] object-cover shrink-0"
                />
                <span className="whitespace-nowrap">{t('noPoursLeft')}</span>
                <button
                  type="button"
                  onClick={() => {
                    playUiClick(profile.soundEnabled);
                    triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                    onGiveUp({
                      completedBottles: bottles.filter(
                        (b) =>
                          b.layers.length === 4 &&
                          b.layers.every((l) => !l.hidden && l.color === b.layers[0].color)
                      ).length,
                      totalBottles: level.colorCount,
                      extraFlasksUsed: bottles.filter((b) => b.isExtra).length,
                    });
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-[#FFE259] text-[#4D1D00] text-[10px] font-black cursor-pointer whitespace-nowrap"
                >
                  {t('optionsBtn')}
                </button>
              </div>
            )}

          {/* First-Encounter Mechanic Tip Banner (Non-Blocking) */}
          {!stuck && activeMechanicTip && (
            <div
              role="note"
              className="animate-mascot-cheer w-full max-w-[348px] mt-0.5 px-3 py-2 rounded-2xl bg-gradient-to-b from-[#FFFDF4] to-[#FBEAC4] border-2 border-[#E39A24] shadow-[0_6px_16px_rgba(40,12,62,0.35)] flex items-center gap-2.5"
            >
              <img
                src={solsticeMascotAvatarImg}
                alt="Fox alchemist guide"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border-2 border-[#7126E8] object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-black text-[#7126E8] leading-tight">
                  {activeMechanicTip === 'cork'
                    ? t('tutorialCorkTitle')
                    : activeMechanicTip === 'crate'
                    ? t('tutorialCrateTitle')
                    : activeMechanicTip === 'curtain'
                    ? t('tutorialCurtainTitle')
                    : t('tutorialMysteryTitle')}
                </div>
                <p className="text-[11px] font-bold text-[#4E2305] leading-snug mt-0.5">
                  {activeMechanicTip === 'cork'
                    ? t('tutorialCorkBody')
                    : activeMechanicTip === 'crate'
                    ? t('tutorialCrateBody')
                    : activeMechanicTip === 'curtain'
                    ? t('tutorialCurtainBody')
                    : t('tutorialMysteryBody')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playUiClick(profile.soundEnabled);
                  triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
                  onMarkTutorialSeen?.(activeMechanicTip);
                  setActiveMechanicTip(null);
                }}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-[#FFE259] to-[#F7A822] border-2 border-[#6B2D00] text-[#4A1C00] text-[11px] font-black shadow-[0_2px_0_#6B2D00] active:translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                {t('tutorialGotIt')}
              </button>
            </div>
          )}
          </div>
        )}
      </header>

      {/* TWO 3D MASCOTS SEATED ON TOP CABINET CORNICE LEDGE + CLOUD SPEECH BUBBLE */}
      <CabinetMascots
        cheering={mascotCheering}
        speech={!stuck && !activeMechanicTip ? reaction : null}
        onTriggerPreviewCheer={(who) => {
          playUiClick(profile.soundEnabled);
          triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
          triggerMascotCheer(1600, 0);
          pushReaction(who, who === 'fox' ? t('reactFoxCheer') : t('reactDragonCheer'), 3400);
        }}
      />

      {/* CALIBRATED 3D SHELF-ALIGNED BOTTLE STAGE */}
      <div className="pointer-events-none absolute inset-0">
        {rows.map((rowBottles, rowIdx) => (
          <div
            key={`stage-row-${rowIdx}`}
            className="pointer-events-auto absolute inset-x-0 flex justify-center"
            style={{ bottom: `${getRowBottomPct(rowIdx, rows.length)}%` }}
          >
            {renderBottleRow(rowBottles)}
          </div>
        ))}
      </div>

      {/* NON-BLOCKING OBSTACLE UNLOCK VFX OVERLAY (Cork Pop / Crate Shatter / Curtain Lift) */}
      {obstacleBursts.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[32] overflow-hidden">
          {obstacleBursts.map((burst) => {
            const pal = LIQUID_3D_PALETTES[burst.color];
            return (
              <div
                key={burst.id}
                className="absolute"
                style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
              >
                {/* Expanding golden/color shockwave ring */}
                <span
                  className="animate-obstacle-ring-burst absolute rounded-full border-[3px]"
                  style={{
                    width: `${Math.max(54, burst.width)}px`,
                    height: `${Math.max(54, burst.width)}px`,
                    borderColor: pal.highlight,
                    boxShadow: `0 0 14px ${pal.innerGlow}`,
                  }}
                />

                {/* Cork spinning pop-off */}
                {burst.type === 'cork' && (
                  <div
                    className="animate-obstacle-cork-fly absolute -top-12 left-0 w-7 h-5 rounded-t-md rounded-b-sm border-2 border-[#FFF1B8] shadow-md"
                    style={{
                      background: 'linear-gradient(180deg, #E2A35C 0%, #9E5922 100%)',
                    }}
                  />
                )}

                {/* Crate wooden/gold splinters */}
                {burst.type === 'crate' &&
                  CRATE_SHARDS.map((shard, idx) => (
                    <span
                      key={idx}
                      className="animate-obstacle-crate-shard absolute w-3.5 h-2 rounded-sm border border-[#FFF2B2] shadow"
                      style={
                        {
                          background: idx % 2 === 0 ? '#D98A36' : pal.highlight,
                          '--dx': shard.dx,
                          '--dy': shard.dy,
                          '--rot': shard.rot,
                        } as React.CSSProperties
                      }
                    />
                  ))}

                {/* Velvet curtain shimmer roll-up */}
                {burst.type === 'curtain' && (
                  <div
                    className="animate-obstacle-curtain-lift absolute -left-8 -top-10 w-16 h-20 rounded-xl border-2 border-[#FFE875]"
                    style={{
                      background: `linear-gradient(180deg, #7A23D6 0%, ${pal.core} 100%)`,
                      boxShadow: '0 0 16px rgba(255, 232, 117, 0.7)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VICTORY CONFETTI & STAR-BURST CELEBRATION EFFECT */}
      {victoryEffect && (
        <VictoryEffect
          active
          stageWidth={victoryEffect.stageWidth}
          stageHeight={victoryEffect.stageHeight}
          tier={victoryEffect.tier}
        />
      )}

      {/* VICTORY FLY-IN COINS & STARS PARTICLE LAYER */}
      {victoryFlyTokens.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[35] overflow-hidden">
          {victoryFlyTokens.map((tok) => (
            <div
              key={tok.id}
              className="animate-victory-fly-token absolute"
              style={
                {
                  left: `${tok.startX}px`,
                  top: `${tok.startY}px`,
                  animationDelay: `${tok.delayMs}ms`,
                  '--mid-x': `${tok.midX}px`,
                  '--mid-y': `${tok.midY}px`,
                  '--end-x': `${tok.endX}px`,
                  '--end-y': `${tok.endY}px`,
                } as React.CSSProperties
              }
            >
              {tok.kind === 'coin' ? (
                <Coin3DIcon className="w-7 h-7 drop-shadow-[0_4px_8px_rgba(40,12,0,0.45)]" />
              ) : (
                <Star className="w-6 h-6 text-[#FFE875] fill-[#FFCB05] drop-shadow-[0_0_10px_rgba(255,215,64,0.95)]" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* MAGIC SORT LUMINOUS ALCHEMICAL VERTICAL LIQUID STREAM OVERLAY */}
      {verticalStream && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full z-[25] overflow-visible"
        >
          <defs>
            <filter
              id={`ms-stream-glow-${verticalStream.id}`}
              x="-120%"
              y="-40%"
              width="340%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <linearGradient
              id={`ms-stream-grad-${verticalStream.id}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={verticalStream.pal.edge} />
              <stop offset="22%" stopColor={verticalStream.pal.highlight} />
              <stop offset="48%" stopColor={verticalStream.pal.innerGlow} />
              <stop offset="76%" stopColor={verticalStream.pal.core} />
              <stop offset="100%" stopColor={verticalStream.pal.bounce} />
            </linearGradient>
          </defs>

          <path
            d={verticalStream.pathD}
            fill={verticalStream.pal.caustic}
            opacity="0.52"
            filter={`url(#ms-stream-glow-${verticalStream.id})`}
          />

          <path
            d={verticalStream.pathD}
            fill={`url(#ms-stream-grad-${verticalStream.id})`}
            stroke={verticalStream.pal.meniscusRim}
            strokeWidth="0.6"
            strokeOpacity="0.65"
            strokeLinejoin="round"
          />

          {verticalStream.botY > verticalStream.topY + 4 && (
            <line
              x1={verticalStream.streamX - 0.85}
              y1={verticalStream.topY}
              x2={verticalStream.streamX - 0.65}
              y2={verticalStream.botY - 3}
              stroke="#FFFFFF"
              strokeWidth="1.45"
              strokeLinecap="round"
              opacity="0.82"
            />
          )}

          {verticalStream.showSplash && (
            <>
              <ellipse
                cx={verticalStream.streamX}
                cy={verticalStream.currentSurfaceY + 0.5}
                rx={11 * verticalStream.splashPulse}
                ry={3.6 * verticalStream.splashPulse}
                fill={verticalStream.pal.innerGlow}
                opacity="0.58"
                filter={`url(#ms-stream-glow-${verticalStream.id})`}
              />
              <ellipse
                cx={verticalStream.streamX}
                cy={verticalStream.currentSurfaceY + 0.5}
                rx={8.5 * verticalStream.splashPulse}
                ry="2.6"
                fill={verticalStream.pal.meniscusRim}
                opacity="0.95"
              />
              <ellipse
                cx={verticalStream.streamX}
                cy={verticalStream.currentSurfaceY + 0.5}
                rx={11.5 * verticalStream.splashPulse}
                ry={3.3 * verticalStream.splashPulse}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.3"
                opacity="0.78"
              />
              <circle
                cx={verticalStream.streamX - (5.2 + 3.2 * verticalStream.dropHopA)}
                cy={verticalStream.currentSurfaceY - (2.4 + 4.8 * verticalStream.dropHopA)}
                r="1.4"
                fill="#FFFFFF"
                opacity={0.45 + 0.5 * verticalStream.dropHopA}
              />
              <circle
                cx={verticalStream.streamX + (5.6 + 3.4 * verticalStream.dropHopB)}
                cy={verticalStream.currentSurfaceY - (2.0 + 4.2 * verticalStream.dropHopB)}
                r="1.15"
                fill={verticalStream.pal.sparkle}
                opacity={0.4 + 0.52 * verticalStream.dropHopB}
              />
            </>
          )}
        </svg>
      )}

      {/* BOTTOM BOOSTER DOCK (9-Slice Static 3D Royal Purple & Gold Tray) */}
      <footer className="relative z-20 px-4 pb-3 pt-1 flex flex-col items-center gap-2 mt-auto">
        <div className="candy-panel-purple inline-flex items-center gap-4 px-5 py-2.5">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label={`Undo (${totalUndoCount})`}
            className="candy-btn-blue relative w-[64px] h-[58px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo3DIcon className="w-8 h-8" />
            <span
              className={`absolute -bottom-2 -right-2 min-w-[26px] h-6 px-1.5 rounded-full border-2 border-white text-white text-[11px] font-black flex items-center justify-center shadow font-tabular ${
                totalUndoCount > 0 ? 'bg-[#E81938]' : 'bg-[#D97706]'
              }`}
            >
              {totalUndoCount > 0
                ? `${totalUndoCount}${freeStreakUndos > 0 ? '★' : ''}`
                : `${IN_GAME_BOOSTER_COSTS.undo}🪙`}
            </span>
          </button>

          {/* Shuffle */}
          <button
            type="button"
            onClick={handleShuffle}
            aria-label={`Shuffle (${profile.boosters.shuffle})`}
            className="candy-btn-blue relative w-[64px] h-[58px] flex items-center justify-center cursor-pointer"
          >
            <Shuffle3DIcon className="w-8 h-8" />
            <span
              className={`absolute -bottom-2 -right-2 min-w-[26px] h-6 px-1.5 rounded-full border-2 border-white text-white text-[11px] font-black flex items-center justify-center shadow font-tabular ${
                profile.boosters.shuffle > 0 ? 'bg-[#E81938]' : 'bg-[#D97706]'
              }`}
            >
              {profile.boosters.shuffle > 0
                ? profile.boosters.shuffle
                : `${IN_GAME_BOOSTER_COSTS.shuffle}🪙`}
            </span>
          </button>

          {/* +1 Extra Flask */}
          <button
            type="button"
            onClick={handleAddFlask}
            aria-label={`Add extra flask (${profile.boosters.extraFlask})`}
            className="candy-btn-blue relative w-[64px] h-[58px] flex items-center justify-center cursor-pointer"
          >
            <ExtraBottle3DIcon className="w-8 h-8" />
            <span
              className={`absolute -bottom-2 -right-2 min-w-[26px] h-6 px-1.5 rounded-full border-2 border-white text-white text-[11px] font-black flex items-center justify-center shadow font-tabular ${
                profile.boosters.extraFlask > 0 ? 'bg-[#E81938]' : 'bg-[#D97706]'
              }`}
            >
              {profile.boosters.extraFlask > 0
                ? profile.boosters.extraFlask
                : `${IN_GAME_BOOSTER_COSTS.extraFlask}🪙`}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
