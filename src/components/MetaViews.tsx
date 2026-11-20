import React from 'react';
import { Play, Sparkles, Star } from 'lucide-react';
import { triggerSemanticHaptic } from '../game/haptics';
import { useI18n } from '../game/i18n';
import { EVENT_TRIALS } from '../game/levelGenerator';
import { playUiClick } from '../game/sound';
import { ALEMBIC_RECIPES, EVENT_MILESTONES, type AlembicRecipe } from '../game/storage';
import type { IngredientId, PlayerProfile } from '../game/types';
import {
  Back3DIcon,
  Cauldron3DIcon,
  Check3DIcon,
  Coin3DIcon,
  Heart3DIcon,
  Lock3DIcon,
  Salons3DIcon,
  ShieldCheck3DIcon,
  StreakFlame3DIcon,
  Trophy3DIcon,
} from './GameIcons3D';

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
  onBack: () => void;
  children: React.ReactNode;
}

const SubViewShell: React.FC<SubViewShellProps> = ({
  title,
  subtitle,
  coins,
  soundEnabled = true,
  hapticsEnabled = true,
  onBack,
  children,
}) => {
  const { t } = useI18n();
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#45187E] via-[#341164] to-[#260B4E] text-[#4A2305] font-game-body select-none">
      <div className="px-2.5 pt-2.5 pb-1 shrink-0">
        <header className="candy-panel-purple px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                playUiClick(soundEnabled);
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

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">{children}</div>
    </div>
  );
};

export const LevelMapView: React.FC<{
  profile: PlayerProfile;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}> = ({ profile, onSelectLevel, onBack }) => {
  const { t } = useI18n();
  const maxShow = Math.max(30, profile.highestLevel + 6);
  const levels = Array.from({ length: maxShow }, (_, idx) => idx + 1);

  return (
    <SubViewShell
      title={t('mapTitle')}
      subtitle={t('mapSubtitle', { n: profile.highestLevel })}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      onBack={onBack}
    >
      <div className="grid grid-cols-3 gap-2.5">
        {levels.map((lvl) => {
          const unlocked = lvl <= profile.highestLevel;
          const isCurrent = lvl === profile.highestLevel;
          const isSuperHard = lvl >= 10 && lvl % 10 === 0;
          const isHard = !isSuperHard && lvl >= 5 && lvl % 5 === 0;
          const milestone =
            lvl === 6
              ? t('milestoneMystery')
              : lvl === 12
              ? t('milestoneCork')
              : lvl === 18
              ? t('milestoneCrate')
              : lvl === 24
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
  return (
    <SubViewShell
      title={t('alembicTitle')}
      subtitle={t('alembicSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
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
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-black font-tabular">
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
  return (
    <SubViewShell
      title={t('eventTitle')}
      subtitle={t('eventSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
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
                {t('trialStarReward', { n: trial.starReward })}
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
  onRefillLives: () => void;
  onPurchaseRemoveAds: () => void;
  onBack: () => void;
}> = ({ profile, onBuyBooster, onRefillLives, onPurchaseRemoveAds, onBack }) => {
  const { t } = useI18n();
  return (
    <SubViewShell
      title={t('shopTitle')}
      subtitle={t('shopSubtitle')}
      coins={profile.coins}
      soundEnabled={profile.soundEnabled}
      hapticsEnabled={profile.hapticsEnabled}
      onBack={onBack}
    >
      {/* Remove All Ads Featured Card */}
      <div className="candy-panel-frame p-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#FFF9D6] game-stroke-xs">
            <ShieldCheck3DIcon className="w-5 h-5" />
            <span>{t('removeAdsTitle')}</span>
          </div>
          <p className="text-[11px] font-bold text-[#FFF6DC] mt-0.5">
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
              triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
              onPurchaseRemoveAds();
            }}
            className="candy-btn-gold px-4 py-2 text-white text-xs font-black game-stroke-xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            {t('buyPriceLabel')}
          </button>
        )}
      </div>

      {/* Coin Purchases */}
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
            }}
            className="candy-btn-blue px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {t('shopCoinsPrice', { n: item.cost })}
          </button>
        </div>
      ))}

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
          disabled={profile.lives >= profile.maxLives || profile.coins < 150}
          onClick={() => {
            triggerSemanticHaptic(profile.hapticsEnabled, 'bottleSeal');
            onRefillLives();
          }}
          className="candy-btn-green px-3.5 py-2 text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          {t('shopCoinsPrice', { n: 150 })}
        </button>
      </div>
    </SubViewShell>
  );
};

export const SalonsComingSoonView: React.FC<{
  coins: number;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  onBack: () => void;
}> = ({ coins, soundEnabled = true, hapticsEnabled = true, onBack }) => {
  const { t } = useI18n();
  return (
    <SubViewShell
      title={t('salonsTitle')}
      subtitle={t('salonsSubtitle')}
      coins={coins}
      soundEnabled={soundEnabled}
      hapticsEnabled={hapticsEnabled}
      onBack={onBack}
    >
      <div className="candy-panel-frame p-5 text-center space-y-3 mt-3">
        <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
          <Salons3DIcon className="w-11 h-11" />
        </div>
        <div className="inline-block px-3 py-0.5 rounded-full bg-[#FFF9E6] text-[#8A4105] text-[10px] font-black uppercase tracking-widest">
          {t('comingSoonBadge')}
        </div>
        <h2 className="font-game-display text-xl font-bold text-white game-stroke-sm">
          {t('salonsHeading')}
        </h2>
        <p className="text-xs font-bold text-[#FFF6DC] leading-relaxed">
          {t('salonsDesc')}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              playUiClick(soundEnabled);
              triggerSemanticHaptic(hapticsEnabled, 'tap');
              onBack();
            }}
            className="candy-btn-green-pill px-6 py-2.5 text-white text-xs font-black game-stroke-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <StreakFlame3DIcon className="w-4 h-4" />
            <span>{t('returnToHomeBtn')}</span>
          </button>
        </div>
      </div>
    </SubViewShell>
  );
};
