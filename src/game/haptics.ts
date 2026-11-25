import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
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

// Web fallback vibration durations (ms) — tuned to be clearly felt on Android ERM/linear motors
const HAPTIC_PATTERNS: Record<HapticEvent, number | number[]> = {
  tap: 15,
  pickup: 22,
  pour: [16, 38, 22],
  error: [24, 34, 24],
  obstacleUnlock: [22, 28, 34],
  bottleSeal: [16, 30, 32],
  victory1: [20, 36, 34],
  victory2: [20, 34, 26, 34, 38],
  victory3: [22, 36, 28, 36, 46],
  defeat: [28, 42, 20],
  test: [24, 36, 32, 36, 44],
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

function isNativeCapacitorApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNativeHapticsSupported(): boolean {
  if (isNativeCapacitorApp()) return true;
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function';
}

export function victoryHapticForTier(tier: CgTier): HapticEvent {
  if (tier === 3) return 'victory3';
  if (tier === 2) return 'victory2';
  return 'victory1';
}

function fireNativeCapacitorHaptic(event: HapticEvent): boolean {
  try {
    switch (event) {
      case 'tap':
        void Haptics.impact({ style: ImpactStyle.Light });
        return true;
      case 'pickup':
        void Haptics.impact({ style: ImpactStyle.Medium });
        return true;
      case 'pour':
        void Haptics.impact({ style: ImpactStyle.Light });
        setTimeout(() => {
          void Haptics.impact({ style: ImpactStyle.Medium });
        }, 55);
        return true;
      case 'error':
        void Haptics.notification({ type: NotificationType.Warning });
        return true;
      case 'obstacleUnlock':
        void Haptics.impact({ style: ImpactStyle.Heavy });
        return true;
      case 'bottleSeal':
        void Haptics.notification({ type: NotificationType.Success });
        return true;
      case 'victory1':
        void Haptics.notification({ type: NotificationType.Success });
        return true;
      case 'victory2':
        void Haptics.notification({ type: NotificationType.Success });
        setTimeout(() => {
          void Haptics.impact({ style: ImpactStyle.Medium });
        }, 90);
        return true;
      case 'victory3':
        void Haptics.notification({ type: NotificationType.Success });
        setTimeout(() => {
          void Haptics.impact({ style: ImpactStyle.Medium });
        }, 85);
        setTimeout(() => {
          void Haptics.impact({ style: ImpactStyle.Heavy });
        }, 175);
        return true;
      case 'defeat':
        void Haptics.notification({ type: NotificationType.Error });
        return true;
      case 'test':
        void Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => {
          void Haptics.vibrate({ duration: 45 });
        }, 70);
        return true;
    }
  } catch {
    return false;
  }
}

export function triggerSemanticHaptic(enabled: boolean, event: HapticEvent): boolean {
  if (!enabled) return false;
  if (!isNativeHapticsSupported()) return false;

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const priority = PRIORITY_BY_EVENT[event];

  // Prevent rapid low-priority taps (e.g. bubbling button fallback) from overriding or doubling specific haptics
  if (now - lastFiredAt < 65 && priority <= lastPriority) {
    return false;
  }

  lastFiredAt = now;
  lastPriority = priority;

  if (isNativeCapacitorApp()) {
    return fireNativeCapacitorHaptic(event);
  }

  try {
    return Boolean(navigator.vibrate(HAPTIC_PATTERNS[event]));
  } catch {
    return false;
  }
}

/**
 * Reset debounce state (primarily for unit testing).
 */
export function _resetHapticsStateForTest(): void {
  lastFiredAt = 0;
  lastPriority = 0;
}
