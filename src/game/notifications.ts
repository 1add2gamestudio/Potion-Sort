import { getLocalDateKey, isDailyRewardAvailable } from './dailyReward';
import { getClaimableMilestoneStars, getCraftableRecipeIds } from './storage';
import type { PlayerProfile } from './types';

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Unseen newly unlocked CG achievements (clears once player opens Achievements
 * or claims the CG reward, and reappears when a new CG is unlocked).
 */
export function getAchievementsBadgeCount(profile: PlayerProfile): number {
  const seen = profile.seenNotifications?.cgIds ?? [];
  return profile.unlockedCgs.filter(
    (id) => !seen.includes(id) && !profile.claimedCgRewards.includes(id)
  ).length;
}

/**
 * Unseen newly reached event star milestones (clears once player opens Events
 * or claims the milestone, and reappears when a higher milestone is reached).
 */
export function getEventsBadgeCount(profile: PlayerProfile): number {
  const seen = profile.seenNotifications?.eventMilestones ?? [];
  return getClaimableMilestoneStars(profile).filter((stars) => !seen.includes(stars)).length;
}

/**
 * Unseen newly craftable Alembic recipes (clears once player visits Alembic,
 * and reappears when a new recipe becomes craftable or after brewing depletes
 * and later re-accumulates ingredients).
 */
export function getAlembicBadgeCount(profile: PlayerProfile): number {
  const seen = profile.seenNotifications?.alembicRecipes ?? [];
  return getCraftableRecipeIds(profile).filter((id) => !seen.includes(id)).length;
}

/**
 * Pulsing red dot on the Home Daily Login shortcut: shown only when today's
 * reward is still unclaimed AND the player hasn't opened/seen the calendar today.
 */
export function shouldShowDailyRewardDot(
  profile: PlayerProfile,
  nowMs: number = Date.now()
): boolean {
  if (!isDailyRewardAvailable(profile.lastDailyRewardDate, nowMs)) {
    return false;
  }
  const todayKey = getLocalDateKey(nowMs);
  return profile.seenNotifications?.dailyRewardDate !== todayKey;
}

export function markAchievementsSeen(profile: PlayerProfile): PlayerProfile {
  const nextCgIds = Array.from(
    new Set([...(profile.seenNotifications?.cgIds ?? []), ...profile.unlockedCgs])
  );
  if (arraysEqual(nextCgIds, profile.seenNotifications?.cgIds ?? [])) {
    return profile;
  }
  return {
    ...profile,
    seenNotifications: {
      ...profile.seenNotifications,
      cgIds: nextCgIds,
    },
  };
}

export function markEventsSeen(profile: PlayerProfile): PlayerProfile {
  const claimable = getClaimableMilestoneStars(profile);
  const nextMilestones = Array.from(
    new Set([...(profile.seenNotifications?.eventMilestones ?? []), ...claimable])
  );
  if (arraysEqual(nextMilestones, profile.seenNotifications?.eventMilestones ?? [])) {
    return profile;
  }
  return {
    ...profile,
    seenNotifications: {
      ...profile.seenNotifications,
      eventMilestones: nextMilestones,
    },
  };
}

export function markAlembicSeen(profile: PlayerProfile): PlayerProfile {
  const craftable = getCraftableRecipeIds(profile);
  if (arraysEqual(craftable, profile.seenNotifications?.alembicRecipes ?? [])) {
    return profile;
  }
  return {
    ...profile,
    seenNotifications: {
      ...profile.seenNotifications,
      alembicRecipes: craftable,
    },
  };
}

/**
 * After brewing inside Alembic, keep still-craftable recipes marked seen (the
 * player is already looking at the Alembic screen) while pruning recipes that
 * dropped below craftable so earning ingredients later re-triggers the badge.
 */
export function syncAlembicSeenAfterBrew(profile: PlayerProfile): PlayerProfile {
  return markAlembicSeen(profile);
}

export function markDailyRewardSeen(
  profile: PlayerProfile,
  nowMs: number = Date.now()
): PlayerProfile {
  const todayKey = getLocalDateKey(nowMs);
  if (profile.seenNotifications?.dailyRewardDate === todayKey) {
    return profile;
  }
  return {
    ...profile,
    seenNotifications: {
      ...profile.seenNotifications,
      dailyRewardDate: todayKey,
    },
  };
}
