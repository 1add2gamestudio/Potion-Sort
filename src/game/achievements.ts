import type { CgOutcome, CgTier, OutcomeCgId, PlayerProfile } from './types';

export interface CgAchievementDef {
  id: OutcomeCgId;
  outcome: CgOutcome;
  tier: CgTier;
  rewardCoins: number;
  triggerKey:
    | 'cgTriggerV1'
    | 'cgTriggerV2'
    | 'cgTriggerV3'
    | 'cgTriggerD1'
    | 'cgTriggerD2'
    | 'cgTriggerD3';
}

export const CG_ACHIEVEMENTS: CgAchievementDef[] = [
  {
    id: 'victory_1',
    outcome: 'victory',
    tier: 1,
    rewardCoins: 30,
    triggerKey: 'cgTriggerV1',
  },
  {
    id: 'victory_2',
    outcome: 'victory',
    tier: 2,
    rewardCoins: 60,
    triggerKey: 'cgTriggerV2',
  },
  {
    id: 'victory_3',
    outcome: 'victory',
    tier: 3,
    rewardCoins: 120,
    triggerKey: 'cgTriggerV3',
  },
  {
    id: 'defeat_1',
    outcome: 'defeat',
    tier: 1,
    rewardCoins: 20,
    triggerKey: 'cgTriggerD1',
  },
  {
    id: 'defeat_2',
    outcome: 'defeat',
    tier: 2,
    rewardCoins: 40,
    triggerKey: 'cgTriggerD2',
  },
  {
    id: 'defeat_3',
    outcome: 'defeat',
    tier: 3,
    rewardCoins: 80,
    triggerKey: 'cgTriggerD3',
  },
];

const VALID_CG_IDS = new Set<string>(CG_ACHIEVEMENTS.map((a) => a.id));

export function toOutcomeCgId(outcome: CgOutcome, tier: CgTier): OutcomeCgId {
  return `${outcome}_${tier}`;
}

export function isValidOutcomeCgId(value: unknown): value is OutcomeCgId {
  return typeof value === 'string' && VALID_CG_IDS.has(value);
}

export function getCgAchievementById(id: OutcomeCgId): CgAchievementDef {
  const found = CG_ACHIEVEMENTS.find((item) => item.id === id);
  return found ?? CG_ACHIEVEMENTS[0];
}

export function unlockOutcomeCg(
  profile: PlayerProfile,
  outcome: CgOutcome,
  tier: CgTier
): { profile: PlayerProfile; newlyUnlocked: boolean; cgId: OutcomeCgId; rewardCoins: number } {
  const cgId = toOutcomeCgId(outcome, tier);
  const def = getCgAchievementById(cgId);
  if (profile.unlockedCgs.includes(cgId)) {
    return { profile, newlyUnlocked: false, cgId, rewardCoins: def.rewardCoins };
  }
  return {
    profile: {
      ...profile,
      unlockedCgs: [...profile.unlockedCgs, cgId],
    },
    newlyUnlocked: true,
    cgId,
    rewardCoins: def.rewardCoins,
  };
}

export function claimCgAchievementReward(
  profile: PlayerProfile,
  cgId: OutcomeCgId
): { profile: PlayerProfile; claimed: boolean; coinsGranted: number } {
  if (!profile.unlockedCgs.includes(cgId) || profile.claimedCgRewards.includes(cgId)) {
    return { profile, claimed: false, coinsGranted: 0 };
  }
  const def = getCgAchievementById(cgId);
  return {
    profile: {
      ...profile,
      coins: profile.coins + def.rewardCoins,
      claimedCgRewards: [...profile.claimedCgRewards, cgId],
    },
    claimed: true,
    coinsGranted: def.rewardCoins,
  };
}

export function getUnclaimedCgRewardCount(profile: PlayerProfile): number {
  return profile.unlockedCgs.filter((id) => !profile.claimedCgRewards.includes(id)).length;
}

export function getUnclaimedCgRewardTotalCoins(profile: PlayerProfile): number {
  return profile.unlockedCgs
    .filter((id) => !profile.claimedCgRewards.includes(id))
    .reduce((sum, id) => sum + getCgAchievementById(id).rewardCoins, 0);
}

export function claimAllCgAchievementRewards(
  profile: PlayerProfile
): { profile: PlayerProfile; claimedCount: number; coinsGranted: number } {
  const unclaimedIds = profile.unlockedCgs.filter(
    (id) => !profile.claimedCgRewards.includes(id)
  );
  if (unclaimedIds.length === 0) {
    return { profile, claimedCount: 0, coinsGranted: 0 };
  }
  const coinsGranted = unclaimedIds.reduce(
    (sum, id) => sum + getCgAchievementById(id).rewardCoins,
    0
  );
  return {
    profile: {
      ...profile,
      coins: profile.coins + coinsGranted,
      claimedCgRewards: [...profile.claimedCgRewards, ...unclaimedIds],
    },
    claimedCount: unclaimedIds.length,
    coinsGranted,
  };
}
