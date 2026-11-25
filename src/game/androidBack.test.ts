import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAndroidBackAction } from './androidBack';

test('Android back pauses gameplay when no modal is open', () => {
  const action = resolveAndroidBackAction({
    screen: 'PLAYING',
    modal: 'NONE',
    hasInterstitialAd: false,
    lives: 5,
    isTrialMode: false,
  });
  assert.deepEqual(action, { type: 'set_modal', modal: 'PAUSED' });
});

test('Android back closes pause/settings/daily modals cleanly', () => {
  for (const modal of ['PAUSED', 'SETTINGS', 'DAILY_REWARD'] as const) {
    const action = resolveAndroidBackAction({
      screen: 'PLAYING',
      modal,
      hasInterstitialAd: false,
      lives: 5,
      isTrialMode: false,
    });
    assert.deepEqual(action, { type: 'close_modal' });
  }
});

test('Android back handles NO_LIVES at 0 lives by safely returning to HOME', () => {
  const action = resolveAndroidBackAction({
    screen: 'PLAYING',
    modal: 'NO_LIVES',
    hasInterstitialAd: false,
    lives: 0,
    isTrialMode: false,
  });
  assert.deepEqual(action, { type: 'close_modal_and_navigate', screen: 'HOME' });
});

test('Android back returns to HOME from meta screens and prompts exit on HOME', () => {
  assert.deepEqual(
    resolveAndroidBackAction({
      screen: 'SHOP',
      modal: 'NONE',
      hasInterstitialAd: false,
      lives: 5,
      isTrialMode: false,
    }),
    { type: 'go_home' }
  );

  assert.deepEqual(
    resolveAndroidBackAction({
      screen: 'HOME',
      modal: 'NONE',
      hasInterstitialAd: false,
      lives: 5,
      isTrialMode: false,
    }),
    { type: 'exit_prompt_or_app' }
  );
});

test('Android back does not interrupt active ad simulation and returns to AD_SIMULATION from interstitial upsell', () => {
  assert.deepEqual(
    resolveAndroidBackAction({
      screen: 'PLAYING',
      modal: 'AD_SIMULATION',
      hasInterstitialAd: true,
      lives: 5,
      isTrialMode: false,
    }),
    { type: 'ignore' }
  );

  assert.deepEqual(
    resolveAndroidBackAction({
      screen: 'PLAYING',
      modal: 'REMOVE_ADS_CONFIRM',
      hasInterstitialAd: true,
      lives: 5,
      isTrialMode: false,
    }),
    { type: 'set_modal', modal: 'AD_SIMULATION' }
  );
});
