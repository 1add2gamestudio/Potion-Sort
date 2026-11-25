import React, { useState } from 'react';
import { Award, CheckCircle2, Play, Sparkles, Star } from 'lucide-react';
import {
  CG_ACHIEVEMENTS,
  getUnclaimedCgRewardCount,
  getUnclaimedCgRewardTotalCoins,
} from '../game/achievements';
import { MONETIZATION_ENABLED } from '../game/adService';
import { triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { EVENT_TRIALS, getSawtoothProfile } from '../game/levelGenerator';
import { playUiClick } from '../game/sound';
import {
  ALEMBIC_RECIPES,
  ESSENCE_POUCH_COIN_COST,
  EVENT_MILESTONES,
  FULL_LIVES_COIN_COST,
  SINGLE_LIFE_COIN_COST,
  type AlembicRecipe,
} from '../game/storage';
import type { IngredientId, OutcomeCgId, PlayerProfile } from '../game/types';
import {
  Back3DIcon,
  Cauldron3DIcon,
  Check3DIcon,
  Coin3DIcon,
  Heart3DIcon,
  Lock3DIcon,
  ShieldCheck3DIcon,
  Trophy3DIcon,
} from './GameIcons3D';
import { OutcomeCgCard } from './OutcomeCgCard';

const INGREDIENT_COLORS: Record<IngredientId, string> = {
  citrus: '#FFCB05',
  crystal: '#134DF0',
  dew: '#EE1D2B',
  mist: '#00C49A',
};

interface SubViewShellProps {
  title: string;
  subtitle: string;
  coins: number;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  toastText?: string | null;
  bgClassName?: string;
  onBack: () => void;
  children: React.ReactNode;
}

const SubViewShell: React.FC<SubViewShellProps> = ({
  title,
  subtitle,
  coins,
  soundEnabled = true,
  hapticsEnabled = true,
  toastText = null,
  bgClassName = 'bg-gradient-to-b from-[#45187E] via-[#341164] to-[#260B4E]',
  onBack,
  children,
}) => {
  const { t } = useI18n();
  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden ${bgClassName} text-[#4A2305] font-game-body select-none`}
    >
      <div className="px-2.5 pt-2.5 pb-1 shrink-0">
        <header className="candy-panel-purple px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                playUiClick(soundEnabled, 'close');
                triggerSemanticHaptic(hapticsEnabled, 'tap');
                onBack();
              }}
              aria-label={t('returnToHomeBtn')}
              className="candy-btn-blue w-10 h-10 flex items-center justify-center cursor-pointer shrink-0"
            >
              <Back3DIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-game-display text-lg font-bold text-[#FFF9D6] game-stroke-sm truncate leading-tight">
                {title}
              </h1>
              <p className="text-[11px] font-black text-[#EAD9FF] truncate">{subtitle}</p>
            </div>
          </div>

          <div className="relative flex items-center shrink-0">
            <div className="candy-pill-cream flex items-center pl-7 pr-3.5 py-1.5 text-[#5A2906] text-xs font-black font-tabular leading-none">
              <span>{coins.toLocaleString()}</span>
            </div>
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Coin3DIcon className="w-7 h-7 drop-shadow" />
            </div>
          </div>
        </header>
      </div>

      {toastText && (
        <div className="pointer-events-none absolute top-[76px] inset-x-4 z-30 flex justify-center">
          <div className="px-3.5 py-1.5 rounded-full bg-[#1C9908] border-2 border-[#FFF3B0] text-white text-xs font-black shadow-[0_6px_16px_rgba(16,6,34,0.5)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{toastText}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">{children}</div>
    </div>
  );
};

function useTransientToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2000);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

export const LevelMapView: React.FC<{
  profile: PlayerProfile;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}> = ({ profile, onSelectLevel, onBack }) => {
  const { t } = useI18n();
  const maxShow = Math.max(30, profile.highestLevel + 6);
  const levels = Array.from({ length: maxShow }, (_, idx) => idx + 1);
  const clearedCount = Math.max(0, profile.highestLevel - 1);

  return (
    <SubViewShell
      title={t('mapTitle')}
      subtitle={t('mapSubtitle', { done: clearedCount, cur: profile.highestLevel })}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      onBack={onBack}
    >
      <div className="grid grid-cols-3 gap-2.5">
        {levels.map((lvl) => {
          const unlocked = lvl <= profile.highestLevel;
          const isCurrent = lvl === profile.highestLevel;
          const spec = getSawtoothProfile(lvl);
          const isSuperHard = spec.difficulty === 'super_hard';
          const isHard = spec.difficulty === 'hard';
          const milestone =
            lvl === 2
              ? t('milestoneMystery')
              : lvl === 6
              ? t('milestoneCork')
              : lvl === 10
              ? t('milestoneCrate')
              : lvl === 14
              ? t('milestoneCurtain')
              : null;

          return (
            <button
              key={lvl}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                onSelectLevel(lvl);
              }}
              className={`p-3 text-left ${
                isCurrent
                  ? 'candy-btn-green text-white cursor-pointer'
                  : unlocked
                  ? 'candy-card-cream text-[#4A2305] cursor-pointer active:translate-y-0.5'
                  : 'candy-tile-locked text-[#5C4932] cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-game-display text-sm font-bold font-tabular whitespace-nowrap ${
                    isCurrent ? 'game-stroke-sm text-white' : ''
                  }`}
                >
                  {t('levelShort', { n: lvl })}
                </span>
                {!unlocked ? (
                  <Lock3DIcon className="w-4 h-4 shrink-0" />
                ) : isCurrent ? (
                  <Play className="w-4 h-4 fill-current shrink-0" />
                ) : (
                  <Check3DIcon className="w-4 h-4 shrink-0" />
                )}
              </div>
              <div
                className={`mt-1 text-[10px] font-black truncate ${
                  isCurrent
                    ? 'text-[#FFF4B2]'
                    : isSuperHard && unlocked
                    ? 'text-[#D61530]'
                    : isHard && unlocked
                    ? 'text-[#C26000]'
                    : 'opacity-80'
                }`}
              >
                {milestone ??
                  (isSuperHard
                    ? t('diffSuperHard')
                    : isHard
                    ? t('diffHard')
                    : t('diffStandard'))}
              </div>
            </button>
          );
        })}
      </div>
    </SubViewShell>
  );
};

export const AlembicView: React.FC<{
  profile: PlayerProfile;
  onBrew: (recipe: AlembicRecipe) => void;
  onBack: () => void;
}> = ({ profile, onBrew, onBack }) => {
  const { t, ingredientName, recipeText } = useI18n();
  const { toast, showToast } = useTransientToast();

  return (
    <SubViewShell
      title={t('alembicTitle')}
      subtitle={t('alembicSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      toastText={toast}
      onBack={onBack}
    >
      {/* Ingredient Inventory */}
      <div className="candy-panel-frame p-3.5">
        <div className="text-xs font-black text-[#FFF9D6] game-stroke-xs mb-2.5 flex items-center gap-1.5">
          <Cauldron3DIcon className="w-5 h-5" />
          <span>{t('collectedEssences')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(INGREDIENT_COLORS) as IngredientId[]).map((id) => (
            <div key={id} className="candy-card-cream p-2 text-center">
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-white shadow mb-0.5"
                style={{ backgroundColor: INGREDIENT_COLORS[id] }}
              />
              <div className="text-sm font-black font-tabular text-[#4A2305]">
                {profile.ingredients[id]}
              </div>
              <div className="text-[10px] font-bold text-[#7D4918] truncate">
                {ingredientName(id, true)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brew Recipes */}
      {ALEMBIC_RECIPES.map((recipe) => {
        const canAfford = (Object.keys(recipe.cost) as IngredientId[]).every(
          (k) => profile.ingredients[k] >= recipe.cost[k]
        );
        const loc = recipeText(recipe.id, recipe.name, recipe.description);
        const ownedCount = profile.boosters[recipe.rewardKey];
        return (
          <div
            key={recipe.id}
            className="candy-card-cream p-3.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-black text-[#4A2305]">
                <Sparkles className="w-4 h-4 text-[#EA7607] shrink-0" />
                <span className="truncate">{loc.name}</span>
              </div>
              <p className="text-[11px] font-bold text-[#7D4918] mt-0.5">{loc.description}</p>
              <div className="text-[10px] font-black text-[#8A5A1A] mt-0.5 font-tabular">
                {t('shopOwnedCount', { n: ownedCount })}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-black font-tabular">
                {(Object.keys(recipe.cost) as IngredientId[])
                  .filter((k) => recipe.cost[k] > 0)
                  .map((k) => (
                    <span
                      key={k}
                      className={`px-2 py-0.5 rounded-full ${
                        profile.ingredients[k] >= recipe.cost[k]
                          ? 'bg-[#D7F7CD] text-[#116E04]'
                          : 'bg-[#FFE0E5] text-[#B8142E]'
                      }`}
                    >
                      {ingredientName(k, true)} {profile.ingredients[k]}/{recipe.cost[k]}
                    </span>
                  ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!canAfford}
              onClick={() => {
                triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                onBrew(recipe);
                showToast(t('alembicBrewedToast', { n: recipe.rewardAmount }));
              }}
              className="candy-btn-green px-4 py-2 text-xs font-black text-white game-stroke-xs cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            >
              {t('brewBtn')}
            </button>
          </div>
        );
      })}
    </SubViewShell>
  );
};

export const EventView: React.FC<{
  profile: PlayerProfile;
  onClaimMilestone: (starsRequired: number) => void;
  onPlayTrial: (trialId: string) => void;
  onBack: () => void;
}> = ({ profile, onClaimMilestone, onPlayTrial, onBack }) => {
  const { t, trialText, milestoneBoosterLabel } = useI18n();
  const { toast, showToast } = useTransientToast();
  const starPct = Math.min(100, Math.round((profile.eventStars / 100) * 100));

  return (
    <SubViewShell
      title={t('eventTitle')}
      subtitle={t('eventSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      toastText={toast}
      onBack={onBack}
    >
      {/* Milestones */}
      <div className="candy-panel-frame p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-[#FFF9D6] game-stroke-xs flex items-center gap-1.5 whitespace-nowrap">
            <Trophy3DIcon className="w-5 h-5" />
            <span>{t('milestoneTrack')}</span>
          </span>
          <span className="candy-pill-cream px-3 py-1 text-[#7A3503] text-xs font-black font-tabular leading-none whitespace-nowrap">
            {t('starsProgress', { cur: profile.eventStars })}
          </span>
        </div>

        {/* Visual Star Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#5C2904]/60 border border-[#FFF1AD]/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFCE26] via-[#FFE975] to-[#34D399] transition-all duration-300"
            style={{ width: `${starPct}%` }}
          />
        </div>

        <div className="space-y-2">
          {EVENT_MILESTONES.map((m) => {
            const reached = profile.eventStars >= m.starsRequired;
            const claimed = profile.claimedEventMilestones.includes(m.starsRequired);
            return (
              <div
                key={m.starsRequired}
                className="candy-card-cream flex items-center justify-between gap-2 p-2.5 text-xs text-[#4A2305]"
              >
                <div className="flex items-center gap-2 font-tabular min-w-0">
                  <Star className="w-4 h-4 text-[#F59B14] fill-[#FFCB05] shrink-0" />
                  <span className="font-black shrink-0">{m.starsRequired}★</span>
                  <span className="font-bold text-[#7D4918] truncate">
                    {t('coinsRewardShort', { n: m.rewardCoins })}
                    {m.rewardBooster ? ` · ${milestoneBoosterLabel(m.rewardBooster.label)}` : ''}
                  </span>
                </div>
                {claimed ? (
                  <span className="px-2.5 py-1 rounded-lg bg-[#D7F7CD] text-[#116E04] text-[11px] font-black shrink-0 whitespace-nowrap">
                    {t('claimedBadge')}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!reached}
                    onClick={() => {
                      triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
                      onClaimMilestone(m.starsRequired);
                      showToast(t('eventClaimedToast'));
                    }}
                    className="candy-btn-green px-3 py-1.5 text-[11px] font-black text-white game-stroke-xs cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
                  >
                    {t('claimBtn')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Obstacle Trials */}
      <div className="text-xs font-black text-[#FFE89A] game-stroke-xs pt-1 px-1">
        {t('festivalTrialsTitle')}
      </div>
      {EVENT_TRIALS.map((trial) => {
        const done = profile.completedTrials.includes(trial.id);
        const loc = trialText(trial.id, trial.name, trial.subtitle);
        return (
          <div
            key={trial.id}
            className="candy-card-cream p-3.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-black text-[#4A2305] truncate">
                {loc.name}
                {done ? t('trialClearedTag') : ''}
              </div>
              <div className="text-[11px] font-bold text-[#7D4918]">{loc.subtitle}</div>
              <div className="text-[11px] font-black text-[#C26000] mt-1 font-tabular">
                {done
                  ? t('trialReplayHint', { n: 20 })
                  : t('trialStarReward', { n: trial.starReward })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
                onPlayTrial(trial.id);
              }}
              className="candy-btn-blue px-3.5 py-2 text-xs font-black text-white game-stroke-xs cursor-pointer shrink-0 whitespace-nowrap"
            >
              {t('playTrialBtn')}
            </button>
          </div>
        );
      })}
    </SubViewShell>
  );
};

export const ShopView: React.FC<{
  profile: PlayerProfile;
  onBuyBooster: (key: 'undo' | 'shuffle' | 'extraFlask', cost: number, amount: number) => void;
  onBuyEssencePouch: () => IngredientId[] | null;
  onBuySingleLife: () => void;
  onRefillLives: () => void;
  onOpenRemoveAds: () => void;
  onBack: () => void;
}> = ({
  profile,
  onBuyBooster,
  onBuyEssencePouch,
  onBuySingleLife,
  onRefillLives,
  onOpenRemoveAds,
  onBack,
}) => {
  const { t, ingredientName } = useI18n();
  const { toast, showToast } = useTransientToast();

  return (
    <SubViewShell
      title={t('shopTitle')}
      subtitle={t('shopSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      toastText={toast}
      onBack={onBack}
    >
      {/* Remove All Ads Featured Entitlement Card */}
      {MONETIZATION_ENABLED && (
      <div className="candy-panel-frame p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-black text-[#FFF9D6] game-stroke-xs">
            <ShieldCheck3DIcon className="w-5 h-5 shrink-0" />
            <span className="truncate">{t('removeAdsTitle')}</span>
          </div>
          <p className="text-[11px] font-bold text-[#FFF6DC] mt-0.5 leading-snug">
            {t('removeAdsDesc')}
          </p>
        </div>

        {profile.adsRemoved ? (
          <span className="px-3.5 py-1.5 rounded-xl bg-[#24B80A] border-2 border-[#FFF2B2] text-white text-xs font-black shrink-0 whitespace-nowrap">
            {t('ownedBadge')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
              onOpenRemoveAds();
            }}
            className="candy-btn-gold px-4 py-2 text-white text-xs font-black game-stroke-xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            {t('buyPriceLabel')}
          </button>
        )}
      </div>
      )}

      {/* Booster Coin Packs */}
      {[
        { key: 'undo' as const, name: t('shopUndoPack'), cost: 90, amount: 3, owned: profile.boosters.undo },
        { key: 'shuffle' as const, name: t('shopShufflePack'), cost: 120, amount: 2, owned: profile.boosters.shuffle },
        { key: 'extraFlask' as const, name: t('shopFlaskPack'), cost: 150, amount: 1, owned: profile.boosters.extraFlask },
      ].map((item) => (
        <div
          key={item.key}
          className="candy-card-cream p-3.5 flex items-center justify-between gap-3"
        >
          <div>
            <div className="text-sm font-black text-[#4A2305]">{item.name}</div>
            <div className="text-[11px] font-bold text-[#7D4918] font-tabular">
              {t('shopOwnedCount', { n: item.owned })}
            </div>
          </div>
          <button
            type="button"
            disabled={profile.coins < item.cost}
            onClick={() => {
              triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
              onBuyBooster(item.key, item.cost, item.amount);
              showToast(t('shopPurchasedToast'));
            }}
            className="candy-btn-blue px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {t('shopCoinsPrice', { n: item.cost })}
          </button>
        </div>
      ))}

      {/* Random Essence Pouch (Bridges Coins -> Sun Alembic) */}
      <div className="candy-panel-frame p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-black text-[#FFF9D6] game-stroke-xs">
            <Cauldron3DIcon className="w-5 h-5 shrink-0" />
            <span className="truncate">{t('shopEssencePouch')}</span>
          </div>
          <p className="text-[11px] font-bold text-[#FFF5DB] mt-0.5 leading-snug">
            {t('shopEssencePouchDesc')}
          </p>
        </div>
        <button
          type="button"
          disabled={profile.coins < ESSENCE_POUCH_COIN_COST}
          onClick={() => {
            triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
            const gained = onBuyEssencePouch();
            if (gained && gained.length > 0) {
              const summary = gained.map((id) => ingredientName(id, true)).join(' · ');
              showToast(t('shopEssenceToast', { items: summary }));
            }
          }}
          className="candy-btn-gold px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {t('shopCoinsPrice', { n: ESSENCE_POUCH_COIN_COST })}
        </button>
      </div>

      {/* Life Refills (+1 Single & Full 5/5) */}
      <div className="candy-card-cream p-3.5 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#4A2305]">
            <Heart3DIcon className="w-5 h-5" />
            <span>{t('shopSingleLife')}</span>
          </div>
          <div className="text-[11px] font-bold text-[#7D4918] font-tabular">
            {t('shopCurrentLives', { cur: profile.lives, max: profile.maxLives })}
          </div>
        </div>
        <button
          type="button"
          disabled={profile.lives >= profile.maxLives || profile.coins < SINGLE_LIFE_COIN_COST}
          onClick={() => {
            triggerSemanticHaptic(profile.hapticsEnabled, 'pickup');
            onBuySingleLife();
            showToast(t('shopPurchasedToast'));
          }}
          className="candy-btn-green px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {t('shopCoinsPrice', { n: SINGLE_LIFE_COIN_COST })}
        </button>
      </div>

      <div className="candy-card-cream p-3.5 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#4A2305]">
            <Heart3DIcon className="w-5 h-5" />
            <span>{t('shopRefillLives')}</span>
          </div>
          <div className="text-[11px] font-bold text-[#7D4918] font-tabular">
            {t('shopCurrentLives', { cur: profile.lives, max: profile.maxLives })}
          </div>
        </div>
        <button
          type="button"
          disabled={profile.lives >= profile.maxLives || profile.coins < FULL_LIVES_COIN_COST}
          onClick={() => {
            triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
            onRefillLives();
            showToast(t('shopPurchasedToast'));
          }}
          className="candy-btn-green px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {t('shopCoinsPrice', { n: FULL_LIVES_COIN_COST })}
        </button>
      </div>
    </SubViewShell>
  );
};

export const AchievementsView: React.FC<{
  profile: PlayerProfile;
  onClaimCgReward: (cgId: OutcomeCgId) => number;
  onClaimAllCgRewards: () => number;
  onBack: () => void;
}> = ({ profile, onClaimCgReward, onClaimAllCgRewards, onBack }) => {
  const { t } = useI18n();
  const { toast, showToast } = useTransientToast();
  const [filter, setFilter] = useState<'all' | 'victory' | 'defeat'>('all');

  const unlockedCount = profile.unlockedCgs.length;
  const totalCount = CG_ACHIEVEMENTS.length;
  const progressPct = Math.round((unlockedCount / totalCount) * 100);
  const unclaimedCount = getUnclaimedCgRewardCount(profile);
  const unclaimedTotalCoins = getUnclaimedCgRewardTotalCoins(profile);

  // Float newly unlocked / unclaimed CGs to the top so players never miss them below locked cards
  const visibleItems = CG_ACHIEVEMENTS.filter((item) =>
    filter === 'all' ? true : item.outcome === filter
  ).sort((a, b) => {
    const rank = (id: OutcomeCgId) => {
      const unlocked = profile.unlockedCgs.includes(id);
      const claimed = profile.claimedCgRewards.includes(id);
      if (unlocked && !claimed) return 0;
      if (unlocked) return 1;
      return 2;
    };
    return rank(a.id) - rank(b.id);
  });

  const victoryCount = CG_ACHIEVEMENTS.filter(
    (item) => item.outcome === 'victory' && profile.unlockedCgs.includes(item.id)
  ).length;
  const defeatCount = CG_ACHIEVEMENTS.filter(
    (item) => item.outcome === 'defeat' && profile.unlockedCgs.includes(item.id)
  ).length;

  return (
    <SubViewShell
      title={t('achievementsTitle')}
      subtitle={t('achievementsSubtitle', { cur: unlockedCount, total: totalCount })}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      toastText={toast}
      bgClassName="bg-[#F4E6C8]"
      onBack={onBack}
    >
      {/* Alchemist Honor Summary + Unlock Progress Bar */}
      <div className="candy-panel-frame p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#FFF9D6] game-stroke-xs min-w-0">
            <Award className="w-4 h-4 text-[#FFE875] shrink-0" />
            <span className="truncate">
              {t('achievementsSubtitle', { cur: unlockedCount, total: totalCount })}
            </span>
          </div>
          {unclaimedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerSemanticHaptic(profile.hapticsEnabled, 'victory1');
                const granted = onClaimAllCgRewards();
                if (granted > 0) {
                  showToast(t('achievementClaimedToast', { n: granted }));
                }
              }}
              className="candy-btn-green px-2.5 py-1 text-[10.5px] font-black text-white game-stroke-xs cursor-pointer shrink-0 whitespace-nowrap font-tabular"
            >
              {t('achievementClaimAllCoins', { n: unclaimedTotalCoins })}
            </button>
          )}
        </div>

        <div className="w-full h-2.5 rounded-full bg-[#5C2904]/60 border border-[#FFF1AD]/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFCE26] via-[#FFE975] to-[#34D399] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
          <div className="candy-card-cream py-1.5 px-1">
            <div className="text-[9.5px] font-black text-[#8A5A1A]">{t('achievementStatLevel')}</div>
            <div className="text-xs font-black text-[#4A2305] font-tabular">
              {t('levelShort', { n: profile.highestLevel })}
            </div>
          </div>
          <div className="candy-card-cream py-1.5 px-1">
            <div className="text-[9.5px] font-black text-[#8A5A1A]">{t('achievementStatStreak')}</div>
            <div className="text-xs font-black text-[#D61530] font-tabular">
              x{profile.bestStreak}
            </div>
          </div>
          <div className="candy-card-cream py-1.5 px-1">
            <div className="text-[9.5px] font-black text-[#8A5A1A]">{t('achievementStatDaily')}</div>
            <div className="text-xs font-black text-[#6D23E8] font-tabular">
              {t('achievementDaysVal', { n: profile.dailyLoginStreak })}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'all' as const, label: t('achievementsAllTab', { n: `${unlockedCount}/${totalCount}` }) },
          { key: 'victory' as const, label: t('achievementsVictoryTab', { n: `${victoryCount}/3` }) },
          { key: 'defeat' as const, label: t('achievementsDefeatTab', { n: `${defeatCount}/3` }) },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              playUiClick(profile.soundEnabled);
              triggerSemanticHaptic(profile.hapticsEnabled, 'tap');
              setFilter(tab.key);
            }}
            className={`py-2 px-1.5 text-[11px] font-black cursor-pointer whitespace-nowrap font-tabular ${
              filter === tab.key
                ? 'candy-btn-green text-white game-stroke-xs'
                : 'candy-card-cream text-[#6A3E14]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievement CG Cards: Locked Padlock Mystery vs Unlocked Fullscreen CG + Claimable Coins */}
      <div className="space-y-3">
        {visibleItems.map((ach) => {
          const isUnlocked = profile.unlockedCgs.includes(ach.id);
          const isClaimed = profile.claimedCgRewards.includes(ach.id);
          const conditionText = t(ach.triggerKey);

          if (!isUnlocked) {
            return (
              <div
                key={ach.id}
                className="candy-card-cream p-2.5 space-y-2 border-2 border-[#D4B483]"
              >
                <div className="relative w-full aspect-[16/9] rounded-[16px] bg-gradient-to-br from-[#3C1B6E] via-[#2C1054] to-[#1D083B] border-[3px] border-[#B8935B]/75 shadow-inner flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,232,117,0.12),transparent_62%)]" />
                  <div className="relative w-12 h-12 rounded-2xl bg-[#552699]/80 border-2 border-[#FFE875]/70 flex items-center justify-center shadow-lg">
                    <Lock3DIcon className="w-6 h-6" />
                  </div>
                  <div className="mt-2 font-game-display text-sm font-bold text-[#FFF3C4] tracking-wide">
                    {t('achievementLockedTitle')}
                  </div>
                  <p className="text-[10px] font-bold text-[#D9C6F5] mt-0.5 max-w-[240px] leading-snug">
                    {t('achievementLockedHint')}
                  </p>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#240657]/85 border border-[#FFE875]/60 text-[#FFE97D] text-[10px] font-black font-tabular">
                    {t('coinsRewardShort', { n: ach.rewardCoins })}
                  </span>
                </div>

                <div className="px-1 flex items-start justify-between gap-2 text-[11px] font-bold text-[#6E3E14]">
                  <span className="leading-snug">
                    <strong className="font-black text-[#4A2305]">
                      {t('achievementConditionPrefix')}
                    </strong>
                    {conditionText}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={ach.id} className="candy-card-cream p-2.5 space-y-2">
              <OutcomeCgCard outcome={ach.outcome} tier={ach.tier} compact />

              <div className="px-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold text-[#7D4918] leading-snug">
                    <strong className="font-black text-[#4A2305]">
                      {t('achievementConditionPrefix')}
                    </strong>
                    {conditionText}
                  </div>
                </div>

                {isClaimed ? (
                  <span className="px-2.5 py-1 rounded-lg bg-[#D7F7CD] text-[#116E04] text-[10.5px] font-black shrink-0 whitespace-nowrap flex items-center gap-1">
                    <Check3DIcon className="w-3.5 h-3.5" />
                    <span>{t('claimedBadge')}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerSemanticHaptic(profile.hapticsEnabled, 'victory1');
                      const granted = onClaimCgReward(ach.id);
                      if (granted > 0) {
                        showToast(t('achievementClaimedToast', { n: granted }));
                      }
                    }}
                    className="candy-btn-green px-3 py-1.5 text-[11px] font-black text-white game-stroke-xs cursor-pointer shrink-0 whitespace-nowrap font-tabular"
                  >
                    {t('achievementClaimCoins', { n: ach.rewardCoins })}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SubViewShell>
  );
};
