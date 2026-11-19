import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Pause, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
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
import {
  getPourSoundMeta,
  playBottleComplete,
  playCorkPop,
  playErrorTap,
  playPickupClink,
  playPourSound,
  playVictoryFanfare,
  triggerHaptic,
} from '../game/sound';
import {
  POUR_DURATION_MS,
  buildVerticalStreamPath,
  computeMagicSortPourGeometry,
  evaluatePourTimeline,
  type MagicSortPourGeometry,
  type PourTimelineState,
} from '../game/pourAnimation';
import {
  POTION_COLORS,
  type Bottle,
  type LiquidLayer,
  type BottleStyleId,
  type LevelSpec,
  type PlayerProfile,
  type PotionColor,
} from '../game/types';
import { LIQUID_3D_PALETTES } from './bottleDesigns';
import { CabinetMascots } from './CabinetMascots';
import { CrystalBottle } from './CrystalBottle';
import {
  Coin3DIcon,
  ExtraBottle3DIcon,
  Gear3DIcon,
  Shuffle3DIcon,
  Undo3DIcon,
} from './GameIcons3D';

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

interface CompanionReaction {
  id: number;
  who: 'fox' | 'dragon';
  text: string;
}

interface GameplayScreenProps {
  level: LevelSpec;
  isTrialMode: boolean;
  profile: PlayerProfile;
  runKey: number;
  onPause: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  onRestartRequest: () => void;
  onConsumeBooster: (key: 'undo' | 'shuffle' | 'extraFlask') => boolean;
  onRequestRewardedBooster: (key: 'undo' | 'shuffle' | 'extraFlask') => void;
  onVictory: (stats: { moves: number; elapsedSec: number; bottlesCount: number }) => void;
  onGiveUp: (stats: { completedBottles: number; totalBottles: number }) => void;
  onSelectBottleStyle: (style: BottleStyleId) => void;
  onOpenBottleCompare: () => void;
  onOpenPourSoundCompare: () => void;
}

function splitBottleRows(bottles: Bottle[]): { rows: Bottle[][]; compact: boolean } {
  const n = bottles.length;
  if (n <= 4) {
    return { rows: [bottles], compact: false };
  }
  if (n <= 8) {
    const topCount = Math.ceil(n / 2); // 3+2, 3+3, 4+3, 4+4
    return {
      rows: [bottles.slice(0, topCount), bottles.slice(topCount)],
      compact: false,
    };
  }
  if (n <= 10) {
    const topCount = Math.ceil(n / 2); // 5+4, 5+5
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
  profile,
  runKey,
  onPause,
  onOpenSettings,
  onToggleMute,
  onRestartRequest,
  onConsumeBooster,
  onRequestRewardedBooster,
  onVictory,
  onGiveUp,
  onOpenPourSoundCompare,
}) => {
  const [bottles, setBottles] = useState<Bottle[]>(() => cloneBottles(level.bottles));
  const [history, setHistory] = useState<Bottle[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTimeMs, setStartTimeMs] = useState(() => Date.now());
  const [freeStreakUndos, setFreeStreakUndos] = useState(0);
  const [activePour, setActivePour] = useState<ActivePourState | null>(null);
  const [mascotCheering, setMascotCheering] = useState(false);
  const [reaction, setReaction] = useState<CompanionReaction>({
    id: 1,
    who: 'fox',
    text: `Let's brew ${level.potionOrderName}!`,
  });
  const wonRef = useRef(false);
  const pourRafRef = useRef<number | null>(null);
  const pourSeqRef = useRef(1);
  const cheerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cheerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const bottleRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const cancelPourAnimation = () => {
    if (pourRafRef.current !== null) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }
    setActivePour(null);
  };

  useEffect(() => {
    return () => {
      if (pourRafRef.current !== null) {
        cancelAnimationFrame(pourRafRef.current);
      }
      clearMascotCheerTimers();
    };
  }, []);

  const pushReaction = (who: 'fox' | 'dragon', text: string) => {
    setReaction((prev) => ({ id: prev.id + 1, who, text }));
  };

  useEffect(() => {
    wonRef.current = false;
    cancelPourAnimation();
    clearMascotCheerTimers();
    setMascotCheering(false);
    const fresh = cloneBottles(level.bottles);
    setBottles(fresh);
    setHistory([]);
    setSelectedId(null);
    setMoves(0);
    setStartTimeMs(Date.now());
    setFreeStreakUndos(profile.streak >= 3 ? 1 : 0);
    pushReaction(
      'fox',
      level.mechanicsIntroduced[0]
        ? `New craft: ${level.mechanicsIntroduced[0]}!`
        : `Order up: ${level.potionOrderName}!`
    );

    if (profile.streak >= 1 && !isTrialMode) {
      const timer = setTimeout(() => {
        setBottles((curr) => {
          let nextState = curr;
          const autoMoves = profile.streak >= 2 ? 2 : 1;
          let applied = 0;
          for (let i = 0; i < autoMoves; i++) {
            const hint = findSmartHintMove(nextState);
            if (!hint) break;
            const out = executePour(nextState, hint.sourceId, hint.targetId);
            if (!out) break;
            nextState = out.bottles;
            applied += 1;
          }
          if (applied > 0) {
            playPourSound(profile.soundEnabled, applied);
            pushReaction(
              'dragon',
              profile.streak >= 3
                ? `Streak x${profile.streak}! ${applied} auto-pours + 1 Free Undo!`
                : `Streak x${profile.streak}! Helped with ${applied} ${
                    applied > 1 ? 'pours' : 'pour'
                  }!`
            );
          }
          return nextState;
        });
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [level, runKey]);

  const stuck = useMemo(
    () => !isLevelComplete(bottles) && !hasValidMoves(bottles),
    [bottles]
  );

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
      count
    );

    if (pourRafRef.current !== null) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }

    pourSeqRef.current += 1;
    const seqId = pourSeqRef.current;
    const startMs = performance.now();

    setActivePour({
      id: seqId,
      sourceId: srcId,
      targetId: dstId,
      color,
      count,
      layersBefore,
      targetBeforeCount,
      geom,
      timeline: evaluatePourTimeline(0, geom.maxTiltDeg),
    });

    const step = (now: number) => {
      const p = (now - startMs) / POUR_DURATION_MS;
      if (p >= 1) {
        pourRafRef.current = null;
        setActivePour((curr) => (curr && curr.id === seqId ? null : curr));
        return;
      }
      const nextTimeline = evaluatePourTimeline(p, geom.maxTiltDeg);
      setActivePour((curr) =>
        curr && curr.id === seqId ? { ...curr, timeline: nextTimeline } : curr
      );
      pourRafRef.current = requestAnimationFrame(step);
    };

    pourRafRef.current = requestAnimationFrame(step);
  };

  const handleSelectBottle = (bottleId: string) => {
    if (wonRef.current) return;
    if (activePour && (activePour.sourceId === bottleId || activePour.targetId === bottleId)) {
      return;
    }
    const clicked = bottles.find((b) => b.id === bottleId);
    if (!clicked) return;

    if (!selectedId) {
      if (clicked.layers.length === 0 || clicked.obstacle.type !== 'none') {
        playErrorTap(profile.soundEnabled);
        triggerHaptic(profile.hapticsEnabled, 6);
        if (clicked.obstacle.type === 'cork') {
          pushReaction(
            'fox',
            `Corked! Pour ${POTION_COLORS[clicked.obstacle.requiredColor].name} on top first.`
          );
        } else if (clicked.obstacle.type === 'crate') {
          pushReaction(
            'dragon',
            `Locked crate! Seal a ${POTION_COLORS[clicked.obstacle.lockColor].name} flask.`
          );
        } else if (clicked.obstacle.type === 'curtain') {
          pushReaction(
            'fox',
            `Velvet curtain! Seal ${POTION_COLORS[clicked.obstacle.unlockColor].name} to reveal.`
          );
        }
        return;
      }

      playPickupClink(profile.soundEnabled);
      triggerHaptic(profile.hapticsEnabled, 8);
      setSelectedId(bottleId);
      return;
    }

    if (selectedId === bottleId) {
      playPickupClink(profile.soundEnabled);
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
        setMoves((m) => m + 1);
        triggerMagicSortPour(
          source.id,
          clicked.id,
          outcome.pouredColor,
          outcome.pouredCount,
          sourceBeforeLayers,
          targetBeforeCount
        );

        playPourSound(profile.soundEnabled, outcome.pouredCount, profile.pourSound);
        triggerHaptic(profile.hapticsEnabled, 14);

        if (outcome.unlockedCork) {
          setTimeout(() => playCorkPop(profile.soundEnabled), 140);
          pushReaction('dragon', 'Pop! Cork unsealed & glowing!');
        } else if (outcome.unlockedObstacles.length > 0) {
          setTimeout(() => playBottleComplete(profile.soundEnabled), 180);
          triggerMascotCheer(1600, 460);
          pushReaction(
            'fox',
            outcome.unlockedObstacles.some((o) => o.type === 'curtain')
              ? 'Flask corked & curtain lifted!'
              : 'Flask corked & crate unlocked!'
          );
        } else if (outcome.completedTarget) {
          setTimeout(() => playBottleComplete(profile.soundEnabled), 170);
          triggerMascotCheer(1600, 460);
          pushReaction('dragon', `Corked! ${POTION_COLORS[outcome.pouredColor].name} sealed!`);
        } else if (outcome.revealedHidden) {
          pushReaction('fox', 'Mystic sediment revealed!');
        }

        if (isLevelComplete(outcome.bottles)) {
          wonRef.current = true;
          triggerMascotCheer(1800, 320);
          pushReaction('dragon', `${level.potionOrderName} complete!`);
          const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));
          setTimeout(() => {
            playVictoryFanfare(profile.soundEnabled);
            triggerHaptic(profile.hapticsEnabled, 30);
            onVictory({
              moves: moves + 1,
              elapsedSec,
              bottlesCount: level.colorCount,
            });
          }, 950);
        }
        return;
      }
    }

    if (clicked.layers.length > 0 && clicked.obstacle.type === 'none') {
      playPickupClink(profile.soundEnabled);
      setSelectedId(clicked.id);
    } else {
      playErrorTap(profile.soundEnabled);
      triggerHaptic(profile.hapticsEnabled, 6);
      setSelectedId(null);
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || wonRef.current) return;
    if (freeStreakUndos > 0) {
      setFreeStreakUndos((c) => c - 1);
    } else if (!onConsumeBooster('undo')) {
      onRequestRewardedBooster('undo');
      return;
    }
    cancelPourAnimation();
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBottles(prev);
    setSelectedId(null);
    playPickupClink(profile.soundEnabled);
    pushReaction('fox', 'Rewound that pour!');
  };

  const handleShuffle = () => {
    if (wonRef.current) return;
    if (!onConsumeBooster('shuffle')) {
      onRequestRewardedBooster('shuffle');
      return;
    }
    cancelPourAnimation();
    setHistory((h) => [...h, cloneBottles(bottles)]);
    setBottles((curr) => applyShuffleBooster(curr, Date.now()));
    setSelectedId(null);
    playPourSound(profile.soundEnabled, 3, profile.pourSound);
    pushReaction('dragon', 'Whoosh! Open flasks remixed!');
  };

  const handleAddFlask = () => {
    if (wonRef.current) return;
    const extraCount = bottles.filter((b) => b.isExtra).length;
    if (extraCount >= 2) {
      pushReaction('fox', 'Max +2 spare flasks on the shelf!');
      return;
    }
    if (!onConsumeBooster('extraFlask')) {
      onRequestRewardedBooster('extraFlask');
      return;
    }
    cancelPourAnimation();
    setBottles((curr) => addExtraFlaskBooster(curr));
    setSelectedId(null);
    playBottleComplete(profile.soundEnabled);
    pushReaction('dragon', 'Brought a fresh crystal flask!');
  };

  const difficultyLabel =
    level.difficulty === 'super_hard'
      ? 'SUPER HARD'
      : level.difficulty === 'hard'
      ? 'HARD'
      : null;

  const { rows, compact } = useMemo(() => splitBottleRows(bottles), [bottles]);
  const totalUndoCount = profile.boosters.undo + freeStreakUndos;

  const stageImage = '/src/assets/images/stage_c_fullwidth_1794988696753.jpg';

  const stageAlt = 'Wide storybook oak alcove apothecary shelves in the sunlit cottage';

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
    // 3 rows when extra flasks expand a dense board
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
        const pourSourceOverride = isSource && activePour
          ? {
              layersBefore: activePour.layersBefore,
              pouredCount: activePour.count,
              flyX: activePour.geom.flyX * activePour.timeline.moveProgress,
              flyY: activePour.geom.flyY * activePour.timeline.moveProgress,
              tiltDeg: activePour.timeline.tiltDeg,
              drainRatio: activePour.timeline.drainRatio,
            }
          : null;
        const pourFillOverride = isTarget && activePour
          ? {
              beforeCount: activePour.targetBeforeCount,
              pouredCount: activePour.count,
              fillRatio: activePour.timeline.fillRatio,
              isStreaming:
                activePour.timeline.streamTip >= 0.94 &&
                activePour.timeline.streamCut < 0.75,
            }
          : null;

        return (
          <CrystalBottle
            key={bottle.id}
            bottle={bottle}
            bottleStyle={profile.bottleStyle}
            selected={selectedId === bottle.id}
            pourSourceOverride={pourSourceOverride}
            pourFillOverride={pourFillOverride}
            colorSymbolsEnabled={profile.colorSymbolsEnabled}
            compact={compact}
            onSelect={handleSelectBottle}
            buttonRef={(el) => {
              bottleRefs.current[bottle.id] = el;
            }}
          />
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
      timeline.streamTip
    );
    const pal = LIQUID_3D_PALETTES[color];

    return {
      id,
      pathD,
      streamX: geom.streamX,
      topY: Math.max(topY, geom.streamStartY + 8),
      botY,
      currentSurfaceY,
      showSplash: timeline.streamTip >= 0.95 && timeline.streamCut < 0.45,
      pal,
    };
  }, [activePour]);

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden font-game-body select-none"
    >
      {/* Seamless top extension slice + Cabinet background shifted down 3.2% to give mascots generous room */}
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
              onClick={onPause}
              aria-label="Pause game"
              className="candy-btn-purple w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Pause className="w-4 h-4 text-white fill-white" />
            </button>

            <div className="relative flex items-center ml-1">
              <div
                aria-label={`Coins ${profile.coins}`}
                className="flex items-center pl-7 pr-3 py-1 rounded-full bg-[#FFF9E6] border-[2.5px] border-[#F7B529] shadow-[0_3px_0_#9E5D05] text-[#4D2405] text-sm font-black font-tabular"
              >
                <span>{profile.coins.toLocaleString()}</span>
              </div>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Coin3DIcon className="w-8 h-8 drop-shadow" />
              </div>
            </div>
          </div>

          {/* Right: Mute + Restart + Settings */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={profile.soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className="candy-btn-blue w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            >
              {profile.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-white" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#FFE259]" />
              )}
            </button>

            <button
              type="button"
              onClick={onRestartRequest}
              aria-label="Restart level"
              className="candy-btn-amber w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="candy-btn-blue w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Gear3DIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Royal Purple-Gold Level Capsule + Potion Order Ribbon */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-1 rounded-full bg-gradient-to-b from-[#7126E8] to-[#411096] border-[3px] border-[#FFE875] shadow-[0_4px_0_#240657,0_6px_14px_rgba(32,6,72,0.4)] flex items-center gap-2">
            <span className="font-game-display text-[17px] leading-none font-bold text-[#FFE96B] game-stroke-sm">
              {level.title}
            </span>
            {difficultyLabel && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border ${
                  level.difficulty === 'super_hard'
                    ? 'bg-[#E81938] border-[#FFD1D8] text-white'
                    : 'bg-[#FFBF2E] border-[#FFF5BF] text-[#4D2100]'
                }`}
              >
                {difficultyLabel}
              </span>
            )}
          </div>

          <div className="mt-1 px-3 py-0.5 rounded-full bg-[#FFF8E6]/95 border-2 border-[#EFA929] shadow-sm flex items-center gap-2 text-[10px] font-black text-[#592604] font-tabular">
            <span className="text-[#6D23E8] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#EA7607]" />
              {level.potionOrderName}
            </span>
            <span aria-hidden="true">·</span>
            <span>Moves {moves}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5 text-[#C44606]">
              <Flame className="w-3 h-3 text-[#E81938] fill-[#FF5A26]" />
              {profile.streak}
            </span>
          </div>
        </div>

        {/* Light Mascot Companion Bubble + 3D Stage Draft Quick-Switcher (A | B | C | Compare) */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {stuck ? (
            <div className="animate-mascot-cheer flex items-center gap-2 px-3 py-1 rounded-full bg-[#D91634] border-2 border-[#FFE875] text-white text-xs font-black shadow-md">
              <img
                src="/src/assets/images/solstice_dragon_avatar_1794985798351.jpg"
                alt="Sky dragon companion"
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full border-2 border-[#FFE875] object-cover shrink-0"
              />
              <span>No pours left!</span>
              <button
                type="button"
                onClick={() =>
                  onGiveUp({
                    completedBottles: bottles.filter(
                      (b) =>
                        b.layers.length === 4 &&
                        b.layers.every((l) => !l.hidden && l.color === b.layers[0].color)
                    ).length,
                    totalBottles: level.colorCount,
                  })
                }
                className="px-2.5 py-0.5 rounded-full bg-[#FFE259] text-[#4D1D00] text-[10px] font-black cursor-pointer"
              >
                Options
              </button>
            </div>
          ) : (
            <div
              key={reaction.id}
              className="animate-mascot-cheer inline-flex items-center gap-1.5 pl-1 pr-3 py-0.5 rounded-full bg-[#FFF9EA]/95 border-2 border-[#EFA929] shadow-[0_3px_0_rgba(92,42,4,0.2)] max-w-[325px]"
            >
              <img
                src={
                  reaction.who === 'fox'
                    ? '/src/assets/images/solstice_mascot_avatar_1794980022747.jpg'
                    : '/src/assets/images/solstice_dragon_avatar_1794985798351.jpg'
                }
                alt={reaction.who === 'fox' ? 'Fox alchemist companion' : 'Sky dragon companion'}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full border-2 border-[#7126E8] object-cover shrink-0"
              />
              <span className="text-[11px] font-black text-[#4E2305] truncate">
                {reaction.text}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* TWO 3D MASCOTS SEATED ON TOP CABINET CORNICE LEDGE */}
      <CabinetMascots
        cheering={mascotCheering}
        onTriggerPreviewCheer={() => triggerMascotCheer(1600, 0)}
      />

      {/* CALIBRATED 3D SHELF-ALIGNED BOTTLE STAGE (no z-trap so flying z-40 bottle stays above z-25 stream) */}
      <div className="pointer-events-none absolute inset-0">
        {/* Bottle Rows Seated Directly on Each Sculpted 3D Oak Surface */}
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

      {/* MAGIC SORT VERTICAL TAPERED LIQUID STREAM OVERLAY */}
      {verticalStream && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full z-[25] overflow-visible"
        >
          <defs>
            <linearGradient
              id={`ms-stream-grad-${verticalStream.id}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={verticalStream.pal.edge} />
              <stop offset="28%" stopColor={verticalStream.pal.highlight} />
              <stop offset="56%" stopColor={verticalStream.pal.core} />
              <stop offset="88%" stopColor={verticalStream.pal.shadow} />
              <stop offset="100%" stopColor={verticalStream.pal.bounce} />
            </linearGradient>
          </defs>

          <path
            d={verticalStream.pathD}
            fill={`url(#ms-stream-grad-${verticalStream.id})`}
            stroke="rgba(12, 22, 52, 0.36)"
            strokeWidth="0.85"
            strokeLinejoin="round"
          />

          {/* Crisp Glossy Specular Filament down Left Third of Vertical Stream */}
          {verticalStream.botY > verticalStream.topY + 4 && (
            <line
              x1={verticalStream.streamX - 1.15}
              y1={verticalStream.topY}
              x2={verticalStream.streamX - 0.9}
              y2={verticalStream.botY - 3}
              stroke="#FFFFFF"
              strokeWidth="1.25"
              strokeLinecap="round"
              opacity="0.62"
            />
          )}

          {/* Subtle Surface Impact Cushion & Ripple where Stream Meets Rising Liquid */}
          {verticalStream.showSplash && (
            <>
              <ellipse
                cx={verticalStream.streamX}
                cy={verticalStream.currentSurfaceY + 0.5}
                rx="8.5"
                ry="2.6"
                fill={verticalStream.pal.meniscus}
                opacity="0.92"
              />
              <ellipse
                cx={verticalStream.streamX}
                cy={verticalStream.currentSurfaceY + 0.5}
                rx="11.5"
                ry="3.4"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                opacity="0.58"
              />
            </>
          )}
        </svg>
      )}

      {/* BOTTOM BOOSTER DOCK (Purple-Gold Royal Match Tray) */}
      <footer className="relative z-20 px-4 pb-3 pt-1 flex flex-col items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={onOpenPourSoundCompare}
          aria-label={`Choose liquid pour sound (${getPourSoundMeta(profile.pourSound).title})`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9EA]/95 border-2 border-[#EFA929] shadow-[0_3px_0_rgba(92,42,4,0.28)] text-[10.5px] font-black text-[#4E2305] cursor-pointer active:translate-y-0.5 transition-transform"
        >
          <Volume2 className="w-3.5 h-3.5 text-[#134DF0]" />
          <span>Pour Sound: {getPourSoundMeta(profile.pourSound).title}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#134DF0] text-[#FFF9D6] text-[9px] font-black leading-none">
            5
          </span>
        </button>

        <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-[28px] bg-gradient-to-b from-[#7126E8] to-[#411096] border-[3px] border-[#FFE875] shadow-[0_7px_0_#240657,0_12px_22px_rgba(32,6,72,0.48),inset_0_2px_2px_rgba(255,255,255,0.4)]">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label={`Undo (${totalUndoCount} left)`}
            className="candy-btn-blue relative w-[64px] h-[56px] rounded-2xl flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo3DIcon className="w-8 h-8" />
            <span className="absolute -bottom-2 -right-2 min-w-[24px] h-6 px-1 rounded-full bg-[#E81938] border-2 border-white text-white text-xs font-black flex items-center justify-center shadow font-tabular">
              {totalUndoCount > 0 ? totalUndoCount : '+'}
              {freeStreakUndos > 0 ? '★' : ''}
            </span>
          </button>

          {/* Shuffle */}
          <button
            type="button"
            onClick={handleShuffle}
            aria-label={`Shuffle (${profile.boosters.shuffle} left)`}
            className="candy-btn-blue relative w-[64px] h-[56px] rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <Shuffle3DIcon className="w-8 h-8" />
            <span className="absolute -bottom-2 -right-2 min-w-[24px] h-6 px-1 rounded-full bg-[#E81938] border-2 border-white text-white text-xs font-black flex items-center justify-center shadow font-tabular">
              {profile.boosters.shuffle > 0 ? profile.boosters.shuffle : 'Ad'}
            </span>
          </button>

          {/* +1 Extra Flask */}
          <button
            type="button"
            onClick={handleAddFlask}
            aria-label={`Add extra flask (${profile.boosters.extraFlask} left)`}
            className="candy-btn-blue relative w-[64px] h-[56px] rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ExtraBottle3DIcon className="w-8 h-8" />
            <span className="absolute -bottom-2 -right-2 min-w-[24px] h-6 px-1 rounded-full bg-[#E81938] border-2 border-white text-white text-xs font-black flex items-center justify-center shadow font-tabular">
              {profile.boosters.extraFlask > 0 ? profile.boosters.extraFlask : 'Ad'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
