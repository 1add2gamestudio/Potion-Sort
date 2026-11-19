import {
  BOTTLE_CAPACITY,
  type Bottle,
  type PotionColor,
} from './types';

export interface PourOutcome {
  bottles: Bottle[];
  pouredCount: number;
  pouredColor: PotionColor;
  revealedHidden: boolean;
  unlockedCork: boolean;
  unlockedObstacles: Array<{ bottleId: string; type: 'crate' | 'curtain'; color: PotionColor }>;
  completedTarget: boolean;
}

export function cloneBottles(bottles: Bottle[]): Bottle[] {
  return bottles.map((b) => ({
    ...b,
    layers: b.layers.map((l) => ({ ...l })),
    obstacle: { ...b.obstacle },
  }));
}

export function isBottleLocked(bottle: Bottle): boolean {
  return bottle.obstacle.type === 'crate' || bottle.obstacle.type === 'curtain';
}

export function isBottleComplete(bottle: Bottle): boolean {
  if (bottle.layers.length !== BOTTLE_CAPACITY) return false;
  if (bottle.layers.some((l) => l.hidden)) return false;
  const first = bottle.layers[0].color;
  return bottle.layers.every((l) => l.color === first);
}

export function isLevelComplete(bottles: Bottle[]): boolean {
  return bottles.every((b) => b.layers.length === 0 || isBottleComplete(b));
}

export function getTopContiguousCount(bottle: Bottle): number {
  if (bottle.layers.length === 0) return 0;
  const top = bottle.layers[bottle.layers.length - 1];
  if (top.hidden) return 0;
  let count = 0;
  for (let i = bottle.layers.length - 1; i >= 0; i--) {
    const layer = bottle.layers[i];
    if (layer.hidden || layer.color !== top.color) break;
    count += 1;
  }
  return count;
}

export function canPour(source: Bottle, target: Bottle): boolean {
  if (source.id === target.id) return false;
  if (source.layers.length === 0) return false;
  if (isBottleLocked(source) || isBottleLocked(target)) return false;
  if (source.obstacle.type === 'cork') return false;
  if (isBottleComplete(source)) return false;
  if (target.layers.length >= BOTTLE_CAPACITY) return false;

  const sourceTop = source.layers[source.layers.length - 1];
  if (sourceTop.hidden) return false;

  if (target.obstacle.type === 'cork') {
    if (sourceTop.color !== target.obstacle.requiredColor) return false;
    if (target.layers.length === 0) return true;
    const targetTop = target.layers[target.layers.length - 1];
    return !targetTop.hidden && targetTop.color === sourceTop.color;
  }

  if (target.layers.length === 0) return true;
  const targetTop = target.layers[target.layers.length - 1];
  return !targetTop.hidden && targetTop.color === sourceTop.color;
}

export function executePour(
  bottles: Bottle[],
  sourceId: string,
  targetId: string
): PourOutcome | null {
  const srcIndex = bottles.findIndex((b) => b.id === sourceId);
  const dstIndex = bottles.findIndex((b) => b.id === targetId);
  if (srcIndex === -1 || dstIndex === -1) return null;

  const source = bottles[srcIndex];
  const target = bottles[dstIndex];
  if (!canPour(source, target)) return null;

  const next = cloneBottles(bottles);
  const nextSource = next[srcIndex];
  const nextTarget = next[dstIndex];
  const pouredColor = nextSource.layers[nextSource.layers.length - 1].color;

  let pouredCount = 0;
  while (
    nextSource.layers.length > 0 &&
    nextTarget.layers.length < BOTTLE_CAPACITY &&
    !nextSource.layers[nextSource.layers.length - 1].hidden &&
    nextSource.layers[nextSource.layers.length - 1].color === pouredColor
  ) {
    const moved = nextSource.layers.pop()!;
    nextTarget.layers.push(moved);
    pouredCount += 1;
  }

  let revealedHidden = false;
  if (nextSource.layers.length > 0 && nextSource.layers[nextSource.layers.length - 1].hidden) {
    nextSource.layers[nextSource.layers.length - 1].hidden = false;
    revealedHidden = true;
  }

  let unlockedCork = false;
  if (nextTarget.obstacle.type === 'cork' && nextTarget.obstacle.requiredColor === pouredColor) {
    nextTarget.obstacle = { type: 'none' };
    unlockedCork = true;
  }

  const completedTarget = isBottleComplete(nextTarget);
  const unlockedObstacles: PourOutcome['unlockedObstacles'] = [];

  if (completedTarget) {
    const completedColor = nextTarget.layers[0].color;
    for (const bottle of next) {
      if (bottle.obstacle.type === 'crate' && bottle.obstacle.lockColor === completedColor) {
        bottle.obstacle = { type: 'none' };
        unlockedObstacles.push({ bottleId: bottle.id, type: 'crate', color: completedColor });
      } else if (
        bottle.obstacle.type === 'curtain' &&
        bottle.obstacle.unlockColor === completedColor
      ) {
        bottle.obstacle = { type: 'none' };
        unlockedObstacles.push({ bottleId: bottle.id, type: 'curtain', color: completedColor });
      }
    }
  }

  return {
    bottles: next,
    pouredCount,
    pouredColor,
    revealedHidden,
    unlockedCork,
    unlockedObstacles,
    completedTarget,
  };
}

export function hasValidMoves(bottles: Bottle[]): boolean {
  for (let i = 0; i < bottles.length; i++) {
    for (let j = 0; j < bottles.length; j++) {
      if (i !== j && canPour(bottles[i], bottles[j])) {
        return true;
      }
    }
  }
  return false;
}

export function findSmartHintMove(
  bottles: Bottle[]
): { sourceId: string; targetId: string } | null {
  let bestScore = -Infinity;
  let bestMove: { sourceId: string; targetId: string } | null = null;

  for (const src of bottles) {
    for (const dst of bottles) {
      if (!canPour(src, dst)) continue;

      let score = 0;
      const srcTopColor = src.layers[src.layers.length - 1].color;
      const srcContig = getTopContiguousCount(src);
      const isMonoSource = src.layers.every((l) => !l.hidden && l.color === srcTopColor);

      // Avoid pointless pouring of a pure partial bottle into an empty bottle
      if (isMonoSource && dst.layers.length === 0) {
        score -= 50;
      }
      if (dst.obstacle.type === 'cork') score += 35;
      if (dst.layers.length > 0) score += 25;
      if (dst.layers.length + srcContig === BOTTLE_CAPACITY && dst.layers.every((l) => !l.hidden && l.color === srcTopColor)) {
        score += 60; // Completing a bottle
      }
      if (src.layers.length > srcContig && src.layers[src.layers.length - srcContig - 1].hidden) {
        score += 30; // Exposes hidden '?' layer
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = { sourceId: src.id, targetId: dst.id };
      }
    }
  }

  return bestMove;
}

export function applyShuffleBooster(bottles: Bottle[], seed = Date.now()): Bottle[] {
  const next = cloneBottles(bottles);
  const eligibleIndices: number[] = [];
  const pool: Array<{ color: PotionColor; hidden: boolean }> = [];

  next.forEach((b, idx) => {
    if (
      b.obstacle.type === 'none' &&
      !isBottleComplete(b) &&
      b.layers.length > 0
    ) {
      eligibleIndices.push(idx);
      b.layers.forEach((l) => pool.push({ color: l.color, hidden: false }));
    }
  });

  if (eligibleIndices.length < 2 || pool.length === 0) {
    return next;
  }

  // Deterministic LCG shuffle
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let cursor = 0;
  for (const idx of eligibleIndices) {
    const targetLen = next[idx].layers.length;
    const oldHiddenMask = next[idx].layers.map((l) => l.hidden);
    const sliced = pool.slice(cursor, cursor + targetLen).map((item, layerPos) => ({
      color: item.color,
      hidden: oldHiddenMask[layerPos] ?? false,
    }));
    // Ensure top layer is always visible
    if (sliced.length > 0) {
      sliced[sliced.length - 1].hidden = false;
    }
    next[idx].layers = sliced;
    cursor += targetLen;
  }

  return next;
}

export function addExtraFlaskBooster(bottles: Bottle[]): Bottle[] {
  const extraCount = bottles.filter((b) => b.isExtra).length;
  if (extraCount >= 2) return bottles;
  const next = cloneBottles(bottles);
  next.push({
    id: `extra-${extraCount + 1}`,
    layers: [],
    obstacle: { type: 'none' },
    isExtra: true,
  });
  return next;
}
