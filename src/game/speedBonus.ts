import type { DifficultyTier, LevelSpec } from './types';

export interface SpeedBonusResult {
  qualified: boolean;
  remainingSec: number;
  bonusPoints: number;
  bonusCoins: number;
}

/**
 * Computes a fair, cozy target countdown time (in seconds) scaled to the level's
 * color count, obstacle count, hidden layers, and difficulty tier.
 * Reaching 0:00 never fails the level — it simply closes the optional speed bonus window.
 */
export function computeTargetTimeSec(level: LevelSpec): number {
  const obstacleCount = level.bottles.filter((b) => b.obstacle.type !== 'none').length;
  const hiddenCount = level.bottles.reduce(
    (sum, b) => sum + b.layers.filter((l) => l.hidden).length,
    0
  );
  const diffExtra =
    level.difficulty === 'super_hard' ? 25 : level.difficulty === 'hard' ? 15 : 0;

  const raw =
    18 +
    level.colorCount * 13 +
    obstacleCount * 10 +
    Math.min(20, Math.round(hiddenCount * 1.1)) +
    diffExtra;

  // Round cleanly to 5-second increments and clamp to [40, 180]
  const rounded = Math.round(raw / 5) * 5;
  return Math.max(40, Math.min(180, rounded));
}

/**
 * Evaluates optional speed-bonus points & bonus coins if the level is cleared
 * at or under targetSec.
 */
export function evaluateSpeedBonus(
  elapsedSec: number,
  targetSec: number,
  difficulty: DifficultyTier
): SpeedBonusResult {
  const safeElapsed = Math.max(0, Math.round(elapsedSec));
  const safeTarget = Math.max(1, Math.round(targetSec));
  const remainingSec = Math.max(0, safeTarget - safeElapsed);

  if (safeElapsed > safeTarget) {
    return {
      qualified: false,
      remainingSec: 0,
      bonusPoints: 0,
      bonusCoins: 0,
    };
  }

  const ratio = remainingSec / safeTarget;
  const tierMultiplier =
    difficulty === 'super_hard' ? 1.5 : difficulty === 'hard' ? 1.25 : 1;

  const bonusPoints = Math.round((120 + ratio * 230) * tierMultiplier / 5) * 5;
  const bonusCoins = Math.round((10 + ratio * 20) * tierMultiplier);

  return {
    qualified: true,
    remainingSec,
    bonusPoints,
    bonusCoins,
  };
}

export function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
