import type { CgTier } from './types';

export type HapticEvent =
  | 'tap'
  | 'pickup'
  | 'pour'
  | 'error'
  | 'obstacleUnlock'
  | 'bottleSeal'
  | 'victory1'
  | 'victory2'
  | 'victory3'
  | 'defeat'
  | 'test';

const HAPTIC_PATTERNS: Record<HapticEvent, number | number[]> = {
  tap: 8,
  pickup: 12,
  pour: [10, 42, 14],
  error: [18, 35, 18],
  obstacleUnlock: [16, 26, 28],
  bottleSeal: [10, 32, 24],
  victory1: [15, 40, 26],
  victory2: [15, 38, 22, 38, 30],
  victory3: [16, 42, 22, 42, 38],
  defeat: [20, 42, 14],
  test: [14, 38, 24, 38, 34],
};

const PRIORITY_BY_EVENT: Record<HapticEvent, number> = {
  tap: 1,
  pickup: 2,
  pour: 3,
  error: 3,
  obstacleUnlock: 4,
  bottleSeal: 5,
  defeat: 5,
  victory1: 6,
  victory2: 6,
  victory3: 6,
  test: 6,
};

let lastFiredAt = 0;
let lastPriority = 0;

export function isNativeHapticsSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function';
}

export function victoryHapticForTier(tier: CgTier): HapticEvent {
  if (tier === 3) return 'victory3';
  if (tier === 2) return 'victory2';
  return 'victory1';
}

export function triggerSemanticHaptic(enabled: boolean, event: HapticEvent): boolean {
  if (!enabled) return false;
  if (!isNativeHapticsSupported()) return false;

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const priority = PRIORITY_BY_EVENT[event];

  // Prevent rapid low-priority taps from muddying higher-priority patterns
  if (now - lastFiredAt < 45 && priority <= lastPriority) {
    return false;
  }

  lastFiredAt = now;
  lastPriority = priority;

  try {
    return Boolean(navigator.vibrate(HAPTIC_PATTERNS[event]));
  } catch {
    return false;
  }
}
