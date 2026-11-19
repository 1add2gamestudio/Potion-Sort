import {
  canPour,
  executePour,
  getTopContiguousCount,
  isBottleComplete,
  isLevelComplete,
} from './engine';
import { BOTTLE_CAPACITY, type Bottle } from './types';

export interface SolverStep {
  sourceId: string;
  targetId: string;
}

function canonicalStateKey(bottles: Bottle[]): string {
  // Preserve bottle identity only for obstacles, canonicalize open bottles for fast pruning
  return bottles
    .map((b) => {
      const obs =
        b.obstacle.type === 'none'
          ? 'n'
          : b.obstacle.type === 'cork'
          ? `k:${b.obstacle.requiredColor}`
          : b.obstacle.type === 'crate'
          ? `c:${b.obstacle.lockColor}`
          : `v:${b.obstacle.unlockColor}`;
      const layers = b.layers.map((l) => `${l.color[0]}${l.hidden ? '?' : ''}`).join('');
      return `${obs}[${layers}]`;
    })
    .sort()
    .join('|');
}

function isRedundantMove(src: Bottle, dst: Bottle, allBottles: Bottle[]): boolean {
  // Never pour a pure-color bottle into an empty bottle
  const srcContig = getTopContiguousCount(src);
  if (dst.layers.length === 0 && srcContig === src.layers.length && src.obstacle.type === 'none') {
    return true;
  }
  // If multiple empty unlocked bottles exist, only consider pouring into the first empty one
  if (dst.layers.length === 0 && dst.obstacle.type === 'none') {
    const firstEmpty = allBottles.find(
      (b) => b.layers.length === 0 && b.obstacle.type === 'none'
    );
    if (firstEmpty && firstEmpty.id !== dst.id) return true;
  }
  return false;
}

function scoreBoard(bottles: Bottle[]): number {
  let score = 0;
  for (const b of bottles) {
    if (isBottleComplete(b)) {
      score += 100;
    } else if (b.layers.length === 0 && b.obstacle.type === 'none') {
      score += 18;
    } else {
      // Reward contiguous same-color runs from the bottom
      const baseColor = b.layers[0]?.color;
      let run = 0;
      for (const l of b.layers) {
        if (!l.hidden && l.color === baseColor) run += 1;
        else break;
      }
      score += run * 8;
      if (b.obstacle.type === 'none') score += 4;
    }
  }
  return score;
}

/**
 * Verifies deterministically that a level is solvable with ZERO boosters.
 * Uses prioritized DFS with canonical memoization and a strict node budget.
 */
export function solveLevel(
  initialBottles: Bottle[],
  maxVisited = 14000
): SolverStep[] | null {
  if (isLevelComplete(initialBottles)) return [];

  const visited = new Set<string>();
  let nodes = 0;

  function dfs(bottles: Bottle[], depth: number, maxDepth: number): SolverStep[] | null {
    if (nodes >= maxVisited || depth > maxDepth) return null;
    if (isLevelComplete(bottles)) return [];

    const key = canonicalStateKey(bottles);
    if (visited.has(key)) return null;
    visited.add(key);
    nodes += 1;

    const candidates: Array<{ src: Bottle; dst: Bottle; priority: number }> = [];

    for (const src of bottles) {
      if (src.layers.length === 0 || isBottleComplete(src)) continue;
      for (const dst of bottles) {
        if (!canPour(src, dst)) continue;
        if (isRedundantMove(src, dst, bottles)) continue;

        let priority = 0;
        const srcContig = getTopContiguousCount(src);
        const srcTopColor = src.layers[src.layers.length - 1].color;
        if (dst.obstacle.type === 'cork') priority += 40;
        if (
          dst.layers.length > 0 &&
          dst.layers.length + srcContig === BOTTLE_CAPACITY &&
          dst.layers.every((l) => !l.hidden && l.color === srcTopColor)
        ) {
          priority += 90;
        } else if (dst.layers.length > 0) {
          priority += 30;
        }
        if (src.layers.length > srcContig && src.layers[src.layers.length - srcContig - 1].hidden) {
          priority += 25;
        }
        candidates.push({ src, dst, priority });
      }
    }

    candidates.sort((a, b) => b.priority - a.priority);

    for (const move of candidates) {
      const outcome = executePour(bottles, move.src.id, move.dst.id);
      if (!outcome) continue;

      // Slight lookahead score boost if board improved
      const sub = dfs(outcome.bottles, depth + 1, maxDepth);
      if (sub !== null) {
        return [{ sourceId: move.src.id, targetId: move.dst.id }, ...sub];
      }
    }

    return null;
  }

  // Try quick greedy-biased DFS first, then broader fallback
  const maxDepth = Math.max(36, initialBottles.length * 5);
  const direct = dfs(initialBottles, 0, maxDepth);
  if (direct) return direct;

  // Secondary best-first beam search if DFS hit a tricky branch
  visited.clear();
  let beam: Array<{ bottles: Bottle[]; path: SolverStep[]; score: number }> = [
    { bottles: initialBottles, path: [], score: scoreBoard(initialBottles) },
  ];

  for (let step = 0; step < maxDepth; step++) {
    const nextBeam: typeof beam = [];
    for (const state of beam) {
      if (isLevelComplete(state.bottles)) return state.path;

      for (const src of state.bottles) {
        if (src.layers.length === 0 || isBottleComplete(src)) continue;
        for (const dst of state.bottles) {
          if (!canPour(src, dst) || isRedundantMove(src, dst, state.bottles)) continue;
          const out = executePour(state.bottles, src.id, dst.id);
          if (!out) continue;
          const key = canonicalStateKey(out.bottles);
          if (visited.has(key)) continue;
          visited.add(key);

          const nextPath = [...state.path, { sourceId: src.id, targetId: dst.id }];
          if (isLevelComplete(out.bottles)) return nextPath;
          nextBeam.push({
            bottles: out.bottles,
            path: nextPath,
            score: scoreBoard(out.bottles) + (out.unlockedObstacles.length * 45) + (out.unlockedCork ? 25 : 0),
          });
        }
      }
    }
    if (nextBeam.length === 0) break;
    nextBeam.sort((a, b) => b.score - a.score);
    beam = nextBeam.slice(0, 90);
  }

  return null;
}
