import assert from 'node:assert/strict';
import test from 'node:test';
import {
  _resetHapticsStateForTest,
  triggerSemanticHaptic,
  victoryHapticForTier,
} from './haptics';

test('victoryHapticForTier maps 1, 2, 3 to matching victory haptic tiers', () => {
  assert.equal(victoryHapticForTier(1), 'victory1');
  assert.equal(victoryHapticForTier(2), 'victory2');
  assert.equal(victoryHapticForTier(3), 'victory3');
});

test('triggerSemanticHaptic respects enabled flag and suppresses duplicate low-priority bubbling tap', () => {
  _resetHapticsStateForTest();
  const originalNavigator = globalThis.navigator;
  const calls: Array<number | number[]> = [];

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      vibrate: (pattern: number | number[]) => {
        calls.push(pattern);
        return true;
      },
    },
  });

  try {
    // Disabled never vibrates
    assert.equal(triggerSemanticHaptic(false, 'tap'), false);
    assert.equal(calls.length, 0);

    // Pickup vibrates, immediate lower-priority bubbling tap is suppressed
    assert.equal(triggerSemanticHaptic(true, 'pickup'), true);
    assert.equal(triggerSemanticHaptic(true, 'tap'), false);
    assert.equal(calls.length, 1);

    // Higher-priority event can still override immediately
    assert.equal(triggerSemanticHaptic(true, 'bottleSeal'), true);
    assert.equal(calls.length, 2);
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    _resetHapticsStateForTest();
  }
});
