import {
  canPour,
  executePour,
  findSmartHintMove,
  isBottleComplete,
  isLevelComplete,
} from './engine';
import type { Bottle, TutorialTipId } from './types';

export const ALL_TUTORIAL_TIPS: TutorialTipId[] = [
  'basics',
  'mystery',
  'cork',
  'crate',
  'curtain',
];

export type MechanicTipId = Exclude<TutorialTipId, 'basics'>;

export function isValidTutorialTipId(value: unknown): value is TutorialTipId {
  return typeof value === 'string' && ALL_TUTORIAL_TIPS.includes(value as TutorialTipId);
}

/**
 * Inspects the active level board and returns the first unseen special mechanic
 * so the Fox Alchemist can display a concise, non-blocking tip banner once.
 */
export function detectUnseenMechanicTip(
  bottles: Bottle[],
  seenTutorials: TutorialTipId[]
): MechanicTipId | null {
  const hasCurtain = bottles.some((b) => b.obstacle.type === 'curtain');
  if (hasCurtain && !seenTutorials.includes('curtain')) return 'curtain';

  const hasCrate = bottles.some((b) => b.obstacle.type === 'crate');
  if (hasCrate && !seenTutorials.includes('crate')) return 'crate';

  const hasCork = bottles.some((b) => b.obstacle.type === 'cork');
  if (hasCork && !seenTutorials.includes('cork')) return 'cork';

  const hasMystery = bottles.some((b) => b.layers.some((l) => l.hidden));
  if (hasMystery && !seenTutorials.includes('mystery')) return 'mystery';

  return null;
}

export interface OnboardingGuideTarget {
  bottleId: string;
  step: 'pick_source' | 'pick_target';
}

function serializeBoardState(bottles: Bottle[]): string {
  return bottles
    .map((b) => {
      const obs =
        b.obstacle.type === 'none'
          ? ''
          : b.obstacle.type === 'cork'
          ? `C:${b.obstacle.requiredColor}`
          : b.obstacle.type === 'crate'
          ? `K:${b.obstacle.lockColor}`
          : `V:${b.obstacle.unlockColor}`;
      const layers = b.layers.map((l) => (l.hidden ? `?${l.color}` : l.color)).join(',');
      return `${obs}|${layers}`;
    })
    .sort()
    .join(';');
}

function isPointlessEmptyPour(src: Bottle, dst: Bottle): boolean {
  if (dst.layers.length !== 0 || src.layers.length === 0) return false;
  const topColor = src.layers[src.layers.length - 1].color;
  return src.layers.every((l) => !l.hidden && l.color === topColor);
}

/**
 * Lightweight BFS shortest-path solver used during Level 1 onboarding so the
 * finger guide always points along a guaranteed winning sequence all the way
 * to level completion — even if the player deviates mid-level.
 */
export function findShortestWinningMove(
  bottles: Bottle[],
  maxStates = 600
): { sourceId: string; targetId: string } | null {
  if (isLevelComplete(bottles)) return null;

  const visited = new Set<string>([serializeBoardState(bottles)]);
  const queue: Array<{
    state: Bottle[];
    firstMove: { sourceId: string; targetId: string } | null;
  }> = [{ state: bottles, firstMove: null }];

  let head = 0;
  while (head < queue.length && visited.size < maxStates) {
    const { state, firstMove } = queue[head++];

    for (let i = 0; i < state.length; i++) {
      const src = state[i];
      if (src.layers.length === 0 || isBottleComplete(src)) continue;

      let triedEmptyDst = false;
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue;
        const dst = state[j];
        if (!canPour(src, dst)) continue;
        if (isPointlessEmptyPour(src, dst)) continue;
        if (dst.layers.length === 0) {
          if (triedEmptyDst) continue;
          triedEmptyDst = true;
        }

        const outcome = executePour(state, src.id, dst.id);
        if (!outcome) continue;
        const stepMove = firstMove ?? { sourceId: src.id, targetId: dst.id };

        if (isLevelComplete(outcome.bottles)) {
          return stepMove;
        }

        const key = serializeBoardState(outcome.bottles);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ state: outcome.bottles, firstMove: stepMove });
        }
      }
    }
  }

  return findSmartHintMove(bottles);
}

/**
 * Guides first-time players step-by-step through the entirety of Level 1 until
 * the level is completed. Turns off immediately once Level 1 finishes or
 * 'basics' has been recorded as seen.
 */
export function computeOnboardingGuide(params: {
  levelNumber: number;
  isTrialMode: boolean;
  bottles: Bottle[];
  selectedId: string | null;
  seenTutorials: TutorialTipId[];
}): OnboardingGuideTarget | null {
  const { levelNumber, isTrialMode, bottles, selectedId, seenTutorials } = params;
  if (
    isTrialMode ||
    levelNumber !== 1 ||
    seenTutorials.includes('basics') ||
    isLevelComplete(bottles)
  ) {
    return null;
  }

  const optimal = findShortestWinningMove(bottles);
  if (!selectedId) {
    if (!optimal) return null;
    return { bottleId: optimal.sourceId, step: 'pick_source' };
  }

  // Player already selected the optimal source bottle — point directly to its winning target
  if (optimal && optimal.sourceId === selectedId) {
    return { bottleId: optimal.targetId, step: 'pick_target' };
  }

  // Player picked a different bottle — if it has a constructive non-pointless pour, guide to it
  const source = bottles.find((b) => b.id === selectedId);
  if (source && !isBottleComplete(source)) {
    let bestTarget: Bottle | null = null;
    for (const candidate of bottles) {
      if (candidate.id === source.id) continue;
      if (!canPour(source, candidate)) continue;
      if (isPointlessEmptyPour(source, candidate)) continue;
      if (!bestTarget || (bestTarget.layers.length === 0 && candidate.layers.length > 0)) {
        bestTarget = candidate;
      }
    }
    if (bestTarget) {
      return { bottleId: bestTarget.id, step: 'pick_target' };
    }
  }

  if (optimal) {
    return { bottleId: optimal.sourceId, step: 'pick_source' };
  }
  return null;
}
