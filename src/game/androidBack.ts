import type { AppScreen, PlayModal } from './types';

export interface AndroidBackState {
  screen: AppScreen;
  modal: PlayModal;
  hasInterstitialAd: boolean;
  lives: number;
  isTrialMode: boolean;
}

export type AndroidBackAction =
  | { type: 'ignore' }
  | { type: 'set_modal'; modal: PlayModal }
  | { type: 'close_modal' }
  | { type: 'close_modal_and_navigate'; screen: AppScreen }
  | { type: 'go_home' }
  | { type: 'exit_prompt_or_app' };

/**
 * Pure state-machine resolver for Android hardware Back button / edge-swipe Back.
 * Ensures players never accidentally exit the app mid-puzzle or while viewing a modal/sub-screen.
 */
export function resolveAndroidBackAction(state: AndroidBackState): AndroidBackAction {
  const { screen, modal, hasInterstitialAd, lives, isTrialMode } = state;

  if (modal === 'AD_SIMULATION') {
    return { type: 'ignore' };
  }

  if (modal === 'PAUSED' || modal === 'SETTINGS' || modal === 'DAILY_REWARD') {
    return { type: 'close_modal' };
  }

  if (modal === 'REMOVE_ADS_CONFIRM') {
    if (hasInterstitialAd) {
      return { type: 'set_modal', modal: 'AD_SIMULATION' };
    }
    return { type: 'close_modal' };
  }

  if (modal === 'NO_LIVES') {
    if (screen === 'PLAYING' && lives <= 0) {
      return { type: 'close_modal_and_navigate', screen: 'HOME' };
    }
    return { type: 'close_modal' };
  }

  if (modal === 'VICTORY' || modal === 'DEFEAT') {
    return {
      type: 'close_modal_and_navigate',
      screen: isTrialMode ? 'EVENT' : 'HOME',
    };
  }

  // No modal open
  if (screen === 'PLAYING') {
    return { type: 'set_modal', modal: 'PAUSED' };
  }

  if (screen !== 'HOME') {
    return { type: 'go_home' };
  }

  return { type: 'exit_prompt_or_app' };
}
