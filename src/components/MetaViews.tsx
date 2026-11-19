import React from 'react';
import { ArrowLeft, Check, Flame, Lock, Play, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { EVENT_TRIALS } from '../game/levelGenerator';
import { ALEMBIC_RECIPES, EVENT_MILESTONES, type AlembicRecipe } from '../game/storage';
import type { IngredientId, PlayerProfile } from '../game/types';
import {
  Cauldron3DIcon,
  Coin3DIcon,
  Heart3DIcon,
  Salons3DIcon,
  Trophy3DIcon,
} from './GameIcons3D';

const INGREDIENT_LABELS: Record<IngredientId, { name: string; color: string }> = {
  citrus: { name: 'Citrus Petal', color: '#FFCB05' },
  crystal: { name: 'Sea Crystal', color: '#134DF0' },
  dew: { name: 'Amber Dew', color: '#EE1D2B' },
  mist: { name: 'Azure Mist', color: '#00C49A' },
};

interface SubViewShellProps {
  title: string;
  subtitle: string;
  coins: number;
  onBack: () => void;
  children: React.ReactNode;
}

const SubViewShell: React.FC<SubViewShellProps> = ({
  title,
  subtitle,
  coins,
  onBack,
  children,
}) => (
  <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#FFF7DF] via-[#FFEBC2] to-[#FFD58A] text-[#4A2305] font-game-body select-none">
    <header className="px-3.5 pt-3.5 pb-3 bg-gradient-to-b from-[#FFB438] to-[#DF6B08] border-b-[3.5px] border-[#FFF1AD] shadow-[0_4px_14px_rgba(92,42,4,0.28)] flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Home"
          className="candy-btn-blue w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white stroke-[2.8]" />
        </button>
        <div className="min-w-0">
          <h1 className="font-game-display text-lg font-bold text-[#FFF9D6] game-stroke-sm truncate leading-tight">
            {title}
          </h1>
          <p className="text-[11px] font-black text-[#FFF1C2] truncate">{subtitle}</p>
        </div>
      </div>

      <div className="relative flex items-center shrink-0">
        <div className="flex items-center pl-7 pr-3 py-1 rounded-full bg-[#FFF9E6] border-[2.5px] border-[#F7B529] shadow-[0_3px_0_#9E5D05] text-[#4D2405] text-xs font-black font-tabular">
          <span>{coins.toLocaleString()}</span>
        </div>
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <Coin3DIcon className="w-7 h-7" />
        </div>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto p-3.5 space-y-3">{children}</div>
  </div>
);

export const LevelMapView: React.FC<{
  profile: PlayerProfile;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}> = ({ profile, onSelectLevel, onBack }) => {
  const maxShow = Math.max(30, profile.highestLevel + 6);
  const levels = Array.from({ length: maxShow }, (_, idx) => idx + 1);

  return (
    <SubViewShell
      title="Solarium Map"
      subtitle={`Highest Unlocked: Level ${profile.highestLevel}`}
      coins={profile.coins}
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
              ? '? Mystery'
              : lvl === 12
              ? 'Cork'
              : lvl === 18
              ? 'Crate'
              : lvl === 24
              ? 'Curtain'
              : null;

          return (
            <button
              key={lvl}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelectLevel(lvl)}
              className={`rounded-2xl p-3 text-left transition-transform ${
                isCurrent
                  ? 'candy-btn-green text-white cursor-pointer'
                  : unlocked
                  ? 'bg-[#FFFDF7] border-[2.5px] border-[#F0AA28] shadow-[0_4px_0_#B8740A] text-[#4A2305] cursor-pointer active:translate-y-0.5'
                  : 'bg-[#EADAC0] border-2 border-[#CBB38E] text-[#8F7653] cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-game-display text-sm font-bold font-tabular ${
                    isCurrent ? 'game-stroke-sm text-white' : ''
                  }`}
                >
                  Lv {lvl}
                </span>
                {!unlocked ? (
                  <Lock className="w-3.5 h-3.5 opacity-70" />
                ) : isCurrent ? (
                  <Play className="w-4 h-4 fill-current" />
                ) : (
                  <Check className="w-4 h-4 text-[#149A05] stroke-[3]" />
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
                {milestone ?? (isSuperHard ? 'Super Hard' : isHard ? 'Hard' : 'Standard')}
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
  return (
    <SubViewShell
      title="Sun Alembic"
      subtitle="Distill level essences into puzzle boosters"
      coins={profile.coins}
      onBack={onBack}
    >
      {/* Ingredient Inventory */}
      <div className="candy-panel-frame rounded-2xl p-3.5">
        <div className="text-xs font-black text-[#FFF9D6] game-stroke-xs mb-2.5 flex items-center gap-1.5">
          <Cauldron3DIcon className="w-5 h-5" />
          <span>Collected Essences</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(INGREDIENT_LABELS) as IngredientId[]).map((id) => (
            <div
              key={id}
              className="rounded-xl p-2 bg-[#FFFDF7] border-2 border-[#FFF1AD] shadow-[0_3px_0_#A66E0C] text-center"
            >
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-white shadow mb-0.5"
                style={{ backgroundColor: INGREDIENT_LABELS[id].color }}
              />
              <div className="text-sm font-black font-tabular text-[#4A2305]">
                {profile.ingredients[id]}
              </div>
              <div className="text-[10px] font-bold text-[#7D4918] truncate">
                {INGREDIENT_LABELS[id].name.split(' ')[0]}
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
        return (
          <div
            key={recipe.id}
            className="rounded-2xl p-3.5 bg-[#FFFDF7] border-[3px] border-[#F0AA28] shadow-[0_5px_0_#B8740A] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-black text-[#4A2305]">
                <Sparkles className="w-4 h-4 text-[#EA7607] shrink-0" />
                <span className="truncate">{recipe.name}</span>
              </div>
              <p className="text-[11px] font-bold text-[#7D4918] mt-0.5">{recipe.description}</p>
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
                      {INGREDIENT_LABELS[k].name.split(' ')[0]} {profile.ingredients[k]}/
                      {recipe.cost[k]}
                    </span>
                  ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!canAfford}
              onClick={() => onBrew(recipe)}
              className="candy-btn-green px-4 py-2 rounded-xl text-xs font-black text-white game-stroke-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              Brew
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
  return (
    <SubViewShell
      title="Azure Gala"
      subtitle="Timed Solstice Festival · Earn Stars & Rewards"
      coins={profile.coins}
      onBack={onBack}
    >
      {/* Milestones */}
      <div className="candy-panel-frame rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#FFF9D6] game-stroke-xs flex items-center gap-1.5">
            <Trophy3DIcon className="w-5 h-5" />
            <span>Milestone Track</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#7A3503] text-xs font-black font-tabular border border-[#F0AA28]">
            {profile.eventStars} / 100 Stars
          </span>
        </div>

        <div className="space-y-2">
          {EVENT_MILESTONES.map((m) => {
            const reached = profile.eventStars >= m.starsRequired;
            const claimed = profile.claimedEventMilestones.includes(m.starsRequired);
            return (
              <div
                key={m.starsRequired}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FFFDF7] border-2 border-[#FFF1AD] text-xs text-[#4A2305]"
              >
                <div className="flex items-center gap-2 font-tabular min-w-0">
                  <Star className="w-4 h-4 text-[#F59B14] fill-[#FFCB05] shrink-0" />
                  <span className="font-black shrink-0">{m.starsRequired}★</span>
                  <span className="font-bold text-[#7D4918] truncate">
                    +{m.rewardCoins} Coins{m.rewardBooster ? ` + ${m.rewardBooster.label}` : ''}
                  </span>
                </div>
                {claimed ? (
                  <span className="px-2.5 py-1 rounded-lg bg-[#D7F7CD] text-[#116E04] text-[11px] font-black shrink-0">
                    Claimed
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!reached}
                    onClick={() => onClaimMilestone(m.starsRequired)}
                    className="candy-btn-green px-3 py-1 rounded-lg text-[11px] font-black text-white game-stroke-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    Claim
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Obstacle Trials */}
      <div className="text-xs font-black text-[#8A4105] pt-1 px-1">
        Festival Trials (Play Any Mechanic Immediately)
      </div>
      {EVENT_TRIALS.map((trial) => {
        const done = profile.completedTrials.includes(trial.id);
        return (
          <div
            key={trial.id}
            className="rounded-2xl p-3.5 bg-[#FFFDF7] border-[3px] border-[#F0AA28] shadow-[0_5px_0_#B8740A] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-black text-[#4A2305] truncate">
                {trial.name} {done ? '· Cleared ✓' : ''}
              </div>
              <div className="text-[11px] font-bold text-[#7D4918]">{trial.subtitle}</div>
              <div className="text-[11px] font-black text-[#C26000] mt-1 font-tabular">
                +{trial.starReward} Gala Stars
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPlayTrial(trial.id)}
              className="candy-btn-blue px-3.5 py-2 rounded-xl text-xs font-black text-white game-stroke-xs cursor-pointer shrink-0"
            >
              Play Trial
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
  return (
    <SubViewShell
      title="Solarium Boutique"
      subtitle="Stock up on boosters or go Ad-Free"
      coins={profile.coins}
      onBack={onBack}
    >
      {/* Remove All Ads Featured Card */}
      <div className="candy-panel-frame rounded-2xl p-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#FFF9D6] game-stroke-xs">
            <ShieldCheck className="w-5 h-5 text-[#74F235]" />
            <span>Remove All Ads</span>
          </div>
          <p className="text-[11px] font-bold text-[#FFF6DC] mt-0.5">
            Zero forced interstitials between levels forever (IAP Stub)
          </p>
        </div>

        {profile.adsRemoved ? (
          <span className="px-3.5 py-1.5 rounded-xl bg-[#24B80A] border-2 border-[#FFF2B2] text-white text-xs font-black shrink-0">
            Owned
          </span>
        ) : (
          <button
            type="button"
            onClick={onPurchaseRemoveAds}
            className="candy-btn-gold px-4 py-2 rounded-xl text-white text-xs font-black game-stroke-xs cursor-pointer shrink-0"
          >
            $4.99
          </button>
        )}
      </div>

      {/* Coin Purchases */}
      {[
        { key: 'undo' as const, name: 'Undo Pack (+3)', cost: 90, amount: 3, owned: profile.boosters.undo },
        { key: 'shuffle' as const, name: 'Shuffle Pack (+2)', cost: 120, amount: 2, owned: profile.boosters.shuffle },
        { key: 'extraFlask' as const, name: 'Extra Flask (+1)', cost: 150, amount: 1, owned: profile.boosters.extraFlask },
      ].map((item) => (
        <div
          key={item.key}
          className="rounded-2xl p-3.5 bg-[#FFFDF7] border-[3px] border-[#F0AA28] shadow-[0_5px_0_#B8740A] flex items-center justify-between gap-3"
        >
          <div>
            <div className="text-sm font-black text-[#4A2305]">{item.name}</div>
            <div className="text-[11px] font-bold text-[#7D4918] font-tabular">Owned: {item.owned}</div>
          </div>
          <button
            type="button"
            disabled={profile.coins < item.cost}
            onClick={() => onBuyBooster(item.key, item.cost, item.amount)}
            className="candy-btn-blue px-3.5 py-2 rounded-xl text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed"
          >
            {item.cost} Coins
          </button>
        </div>
      ))}

      <div className="rounded-2xl p-3.5 bg-[#FFFDF7] border-[3px] border-[#F0AA28] shadow-[0_5px_0_#B8740A] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#4A2305]">
            <Heart3DIcon className="w-5 h-5" />
            <span>Full Lives Refill</span>
          </div>
          <div className="text-[11px] font-bold text-[#7D4918] font-tabular">
            Current: {profile.lives}/{profile.maxLives}
          </div>
        </div>
        <button
          type="button"
          disabled={profile.lives >= profile.maxLives || profile.coins < 150}
          onClick={onRefillLives}
          className="candy-btn-green px-3.5 py-2 rounded-xl text-white text-xs font-black game-stroke-xs font-tabular cursor-pointer disabled:cursor-not-allowed"
        >
          150 Coins
        </button>
      </div>
    </SubViewShell>
  );
};

export const SalonsComingSoonView: React.FC<{
  coins: number;
  onBack: () => void;
}> = ({ coins, onBack }) => (
  <SubViewShell
    title="Crystal Salons"
    subtitle="Co-op Teams & Life Sharing"
    coins={coins}
    onBack={onBack}
  >
    <div className="candy-panel-frame rounded-3xl p-5 text-center space-y-3 mt-3">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFFDF7] border-[3px] border-[#FFF1AD] flex items-center justify-center shadow">
        <Salons3DIcon className="w-11 h-11" />
      </div>
      <div className="inline-block px-3 py-0.5 rounded-full bg-[#FFF9E6] text-[#8A4105] text-[10px] font-black uppercase tracking-widest">
        Coming Soon
      </div>
      <h2 className="font-game-display text-xl font-bold text-white game-stroke-sm">
        Crystal Salons Are Brewing
      </h2>
      <p className="text-xs font-bold text-[#FFF6DC] leading-relaxed">
        Join a sunlit alchemy guild, send free lives to teammates, and compete in weekend Crystal Regattas. Launching in our upcoming social update.
      </p>
      <div className="pt-2">
        <button
          type="button"
          onClick={onBack}
          className="candy-btn-green px-6 py-2.5 rounded-2xl text-white text-xs font-black game-stroke-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <Flame className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  </SubViewShell>
);
