import type { PlayerProfile } from './types';

export type AdPlacementKind =
  | 'interstitial_next_level'
  | 'rewarded_life'
  | 'rewarded_2x_coins'
  | 'rewarded_continue';

export interface AdRequest {
  kind: AdPlacementKind;
  label: string;
  /** Interstitials use a short 2s skip countdown and offer a direct Go Ad-Free upsell */
  isInterstitial?: boolean;
  /** Target campaign level to launch after an interstitial finishes */
  pendingNextLevel?: number;
}

/** Levels 1 and 2 are protected for onboarding retention — no forced interstitials */
export const INTERSTITIAL_MIN_LEVEL = 3;

/** From Level 3+, trigger one brief interstitial every 2 cleared levels */
export const INTERSTITIAL_LEVEL_INTERVAL = 2;

export interface InterstitialCheckInput {
  adsRemoved: boolean;
  clearedLevelNumber: number;
  clearsSinceLastInterstitial: number;
  isTrial: boolean;
}

/**
 * Evaluates whether advancing to the next campaign level should display a forced interstitial ad.
 * Returns { shouldShow, nextCounter } cleanly so SDK integration and Remove Ads stay 100% deterministic.
 */
export function evaluateInterstitialPacing(input: InterstitialCheckInput): {
  shouldShow: boolean;
  nextCounter: number;
} {
  if (input.adsRemoved || input.isTrial) {
    return { shouldShow: false, nextCounter: 0 };
  }
  if (input.clearedLevelNumber < INTERSTITIAL_MIN_LEVEL) {
    return { shouldShow: false, nextCounter: input.clearsSinceLastInterstitial };
  }
  const incremented = input.clearsSinceLastInterstitial + 1;
  if (incremented >= INTERSTITIAL_LEVEL_INTERVAL) {
    return { shouldShow: true, nextCounter: 0 };
  }
  return { shouldShow: false, nextCounter: incremented };
}

/**
 * Grants the permanent Remove Ads entitlement without altering coins or boosters.
 */
export function applyRemoveAdsPurchase(profile: PlayerProfile): PlayerProfile {
  if (profile.adsRemoved) return profile;
  return {
    ...profile,
    adsRemoved: true,
  };
}
