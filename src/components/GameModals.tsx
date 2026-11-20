import React, { useEffect, useState } from 'react';
import {
  Eye,
  Play,
  Sparkles,
  Tv,
} from 'lucide-react';
import { getNextLifeCountdownMs } from '../game/storage';
import type {
  Bottle,
  BottleStyleId,
  IngredientId,
  PlayModal,
  PlayerProfile,
} from '../game/types';
import { BOTTLE_STYLE_LIST } from './bottleDesigns';
import { CrystalBottle } from './CrystalBottle';
import {
  Close3DIcon,
  Heart3DIcon,
  Restart3DIcon,
  ShieldCheck3DIcon,
  SoundOff3DIcon,
  SoundOn3DIcon,
  StreakFlame3DIcon,
} from './GameIcons3D';

export interface VictorySnapshot {
  levelTitle: string;
  potionOrderName?: string;
  isTrial: boolean;
  moves: number;
  elapsedSec: number;
  coinsEarned: number;
  starsEarned: number;
  ingredient: IngredientId;
  doubled: boolean;
}

export interface DefeatSnapshot {
  completedBottles: number;
  totalBottles: number;
}

export interface AdRequest {
  kind: 'rewarded_life' | 'rewarded_booster' | 'rewarded_2x_coins' | 'rewarded_continue';
  label: string;
  boosterKey?: 'undo' | 'shuffle' | 'extraFlask';
}

interface GameModalsProps {
  modal: PlayModal;
  profile: PlayerProfile;
  nowMs: number;
  victorySnapshot: VictorySnapshot | null;
  defeatSnapshot: DefeatSnapshot | null;
  adRequest: AdRequest | null;
  onCloseModal: () => void;
  onResume: () => void;
  onRestartConfirm: () => void;
  onExitToHome: () => void;
  onNextLevel: () => void;
  onRetryAfterDefeat: () => void;
  onTriggerAd: (req: AdRequest) => void;
  onCompleteAd: () => void;
  onRefillLivesWithCoins: () => void;
  onToggleSetting: (key: 'soundEnabled' | 'hapticsEnabled' | 'colorSymbolsEnabled') => void;
  onSelectBottleStyle: (style: BottleStyleId) => void;
  onOpenBottleCompare: () => void;
  onPurchaseRemoveAds: () => void;
  onResetSave: () => void;
}

const SHOWCASE_BOTTLE: Bottle = {
  id: 'showcase',
  layers: [
    { color: 'coral', hidden: false },
    { color: 'citron', hidden: false },
    { color: 'azure', hidden: false },
  ],
  obstacle: { type: 'none' },
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  modal,
  profile,
  nowMs,
  victorySnapshot,
  defeatSnapshot,
  adRequest,
  onCloseModal,
  onResume,
  onRestartConfirm,
  onExitToHome,
  onNextLevel,
  onRetryAfterDefeat,
  onTriggerAd,
  onCompleteAd,
  onRefillLivesWithCoins,
  onToggleSetting,
  onSelectBottleStyle,
  onOpenBottleCompare,
  onPurchaseRemoveAds,
  onResetSave,
}) => {
  const [adSecondsLeft, setAdSecondsLeft] = useState(2);

  useEffect(() => {
    if (modal !== 'AD_SIMULATION') return;
    setAdSecondsLeft(2);
    const t1 = setTimeout(() => setAdSecondsLeft(1), 700);
    const t2 = setTimeout(() => setAdSecondsLeft(0), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [modal, adRequest]);

  if (modal === 'NONE') return null;

  const lifeCountdownMs = getNextLifeCountdownMs(profile, nowMs);
  const lifeMin = Math.floor(Math.ceil(lifeCountdownMs / 1000) / 60);
  const lifeSec = Math.ceil(lifeCountdownMs / 1000) % 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#3E1B04]/55 p-4 font-game-body"
    >
      <div className="candy-panel-frame w-full max-w-[335px] p-4 text-[#4A2305]">
        {/* PAUSED */}
        {modal === 'PAUSED' && (
          <div className="space-y-3.5">
            <div className="text-center">
              <h2 className="font-game-display text-2xl font-bold text-[#FFF9D6] game-stroke-md">
                Game Paused
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1">
                {profile.streak > 0
                  ? `Active Solstice Streak: x${profile.streak} (Restarting resets streak & uses 1 life)`
                  : 'Relax — no move limits or countdown timers.'}
              </p>
            </div>

            <div className="candy-card-cream p-3 space-y-2.5">
              <button
                type="button"
                onClick={onResume}
                className="candy-btn-green-pill w-full py-3 text-white font-game-display font-bold text-base game-stroke-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={onRestartConfirm}
                className="candy-btn-amber w-full py-2.5 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Restart3DIcon className="w-4 h-4" />
                <span>Restart Level (-1 Life)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleSetting('soundEnabled')}
                  className="candy-pill-cream py-2 px-2 text-xs font-black text-[#4A2305] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {profile.soundEnabled ? (
                    <SoundOn3DIcon className="w-4 h-4" />
                  ) : (
                    <SoundOff3DIcon className="w-4 h-4" />
                  )}
                  <span>{profile.soundEnabled ? 'Sound On' : 'Muted'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSetting('colorSymbolsEnabled')}
                  className="candy-pill-cream py-2 px-2 text-xs font-black text-[#4A2305] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#134DF0]" />
                  <span>{profile.colorSymbolsEnabled ? 'Symbols On' : 'Symbols Off'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onExitToHome}
              className="w-full py-1.5 text-xs font-black text-[#FFF7DF] hover:text-white cursor-pointer"
            >
              Quit to Home
            </button>
          </div>
        )}

        {/* VICTORY */}
        {modal === 'VICTORY' && victorySnapshot && (
          <div className="space-y-3.5">
            <div className="text-center">
              <div className="flex items-center justify-center -space-x-2 mb-1.5">
                <img
                  src="/src/assets/images/solstice_mascot_avatar_1794980022747.jpg"
                  alt="Fox alchemist celebrating"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full border-[3px] border-[#FFE875] shadow-md object-cover"
                />
                <img
                  src="/src/assets/images/solstice_dragon_avatar_1794985798351.jpg"
                  alt="Sky dragon celebrating"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full border-[3px] border-[#FFE875] shadow-md object-cover"
                />
              </div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#FFF9E6] text-[#8A4105] text-[10px] font-black uppercase tracking-widest border border-[#FFF1AD]">
                {victorySnapshot.levelTitle}
                {victorySnapshot.potionOrderName ? ` · ${victorySnapshot.potionOrderName}` : ' Cleared!'}
              </div>
              <h2 className="font-game-display text-[26px] font-bold text-white game-stroke-md mt-1">
                Potion Brewed!
              </h2>
            </div>

            <div className="candy-card-cream p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">TIME</div>
                  <div className="text-sm font-black font-tabular">
                    {formatTime(victorySnapshot.elapsedSec)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">MOVES</div>
                  <div className="text-sm font-black font-tabular">
                    {victorySnapshot.moves}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#FFF8E6] border-2 border-[#F2CF7E]">
                  <div className="text-[10px] font-black text-[#8A5A1A]">STREAK</div>
                  <div className="text-sm font-black font-tabular text-[#E81938]">
                    x{profile.streak}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-2.5 bg-[#FFEAB8] border-2 border-[#EFA929] flex items-center justify-between text-xs font-black font-tabular">
                <span className="text-[#874B00]">+{victorySnapshot.coinsEarned} Coins</span>
                <span className="text-[#134DF0]">+{victorySnapshot.starsEarned} Stars</span>
                <span className="capitalize text-[#0E7D68]">+1 {victorySnapshot.ingredient}</span>
              </div>

              {!profile.adsRemoved && (
                <div className="rounded-xl px-3 py-2 bg-[#FFF3D1] border border-[#E6B85C] text-[10px] font-bold text-[#7A440B] flex items-center justify-between">
                  <span>Interstitial Ad Slot (SDK Ready)</span>
                  <button
                    type="button"
                    onClick={onPurchaseRemoveAds}
                    className="font-black text-[#134DF0] underline cursor-pointer"
                  >
                    Remove Ads
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                data-start="true"
                onClick={onNextLevel}
                className="candy-btn-green-pill w-full py-3 text-white font-game-display font-bold text-lg game-stroke-md cursor-pointer"
              >
                {victorySnapshot.isTrial ? 'Back to Festival' : 'Next Level'}
              </button>

              {!victorySnapshot.doubled && (
                <button
                  type="button"
                  onClick={() =>
                    onTriggerAd({
                      kind: 'rewarded_2x_coins',
                      label: `Watch Video for +${victorySnapshot.coinsEarned} Bonus Coins`,
                    })
                  }
                  className="candy-btn-blue-pill w-full py-2.5 text-white text-xs font-black game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>2x Coins · Rewarded Ad</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExitToHome}
                className="w-full py-1.5 text-xs font-black text-[#FFF7DF] hover:text-white cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        )}

        {/* DEFEAT / OUT OF MOVES */}
        {modal === 'DEFEAT' && defeatSnapshot && (
          <div className="space-y-3.5 text-center">
            <div>
              <img
                src="/src/assets/images/solstice_dragon_avatar_1794985798351.jpg"
                alt="Sky dragon cheering you on"
                referrerPolicy="no-referrer"
                className="w-12 h-12 mx-auto mb-1.5 rounded-full border-[3px] border-[#FFE875] shadow-md object-cover"
              />
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#E81938] text-white text-[10px] font-black uppercase tracking-widest">
                No Valid Pours Left
              </div>
              <h2 className="font-game-display text-2xl font-bold text-white game-stroke-md mt-1">
                Decanters Locked
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1 font-tabular">
                Bottles Completed: {defeatSnapshot.completedBottles} / {defeatSnapshot.totalBottles}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  onTriggerAd({
                    kind: 'rewarded_continue',
                    label: 'Watch Video for +1 Free Crystal Flask',
                  })
                }
                className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>Continue (+1 Flask · Rewarded Ad)</span>
              </button>

              <button
                type="button"
                data-start="true"
                onClick={onRetryAfterDefeat}
                className="candy-btn-blue-pill w-full py-3 text-white font-black text-sm game-stroke-sm cursor-pointer"
              >
                Try Again (-1 Life)
              </button>

              <button
                type="button"
                onClick={onExitToHome}
                className="w-full py-1.5 text-xs font-black text-[#FFF7DF] cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        )}

        {/* NO LIVES */}
        {modal === 'NO_LIVES' && (
          <div className="space-y-3.5 text-center">
            <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
              <Heart3DIcon className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-game-display text-2xl font-bold text-[#FFF9D6] game-stroke-md">
                Lives & Refills
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1 font-tabular">
                {profile.lives < profile.maxLives
                  ? `Next life refills in ${String(lifeMin).padStart(2, '0')}:${String(lifeSec).padStart(2, '0')}`
                  : 'Your lives are currently full (5/5)!'}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  onTriggerAd({
                    kind: 'rewarded_life',
                    label: 'Watch Video for +1 Instant Life',
                  })
                }
                className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>Free +1 Life · Rewarded Ad</span>
              </button>

              <button
                type="button"
                disabled={profile.coins < 150 || profile.lives >= profile.maxLives}
                onClick={onRefillLivesWithCoins}
                className="candy-btn-blue-pill w-full py-3 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-not-allowed"
              >
                Refill 5/5 Lives (150 Coins)
              </button>

              <button
                type="button"
                onClick={onCloseModal}
                className="w-full py-1.5 text-xs font-black text-[#FFF7DF] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {modal === 'SETTINGS' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-game-display text-xl font-bold text-[#FFF9D6] game-stroke-sm">
                Settings
              </h2>
              <button
                type="button"
                onClick={onCloseModal}
                aria-label="Close settings"
                className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer"
              >
                <Close3DIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="candy-card-cream p-3 space-y-2 text-xs">
              {[
                { key: 'soundEnabled' as const, label: 'Sound Effects' },
                { key: 'hapticsEnabled' as const, label: 'Vibration Haptics' },
                { key: 'colorSymbolsEnabled' as const, label: 'Color-Blind Potion Symbols' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleSetting(item.key)}
                  className="candy-pill-cream w-full px-3 py-2 flex items-center justify-between font-black text-[#4A2305] cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      profile[item.key]
                        ? 'bg-[#29B80A] text-white'
                        : 'bg-[#D6C7B2] text-[#5C452B]'
                    }`}
                  >
                    {profile[item.key] ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={onOpenBottleCompare}
                className="candy-pill-cream w-full px-3 py-2 flex items-center justify-between font-black text-[#4A2305] cursor-pointer"
              >
                <span>Crystal Flask Design</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#7126E8] text-[#FFE875]">
                  Compare 4
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={profile.adsRemoved}
                onClick={onPurchaseRemoveAds}
                className="candy-btn-gold w-full py-3 text-white text-xs font-black game-stroke-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck3DIcon className="w-5 h-5" />
                <span>
                  {profile.adsRemoved
                    ? 'All Ads Removed (Owned)'
                    : 'Paid Remove All Ads — $4.99 (Stub)'}
                </span>
              </button>

              <button
                type="button"
                onClick={onResetSave}
                className="w-full py-1.5 text-[11px] font-black text-[#FFF7DF] hover:underline cursor-pointer"
              >
                Reset Local Progress
              </button>
            </div>
          </div>
        )}

        {/* SIMULATED AD SDK PLACEHOLDER */}
        {modal === 'AD_SIMULATION' && adRequest && (
          <div className="space-y-3.5 text-center">
            <div className="candy-card-cream w-16 h-16 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#EA7607]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#FFF9D6]">
                Ad SDK Placeholder
              </div>
              <h2 className="font-game-display text-lg font-bold text-white game-stroke-sm mt-1">
                {adRequest.label}
              </h2>
              <p className="text-xs font-bold text-[#FFF5DB] mt-1">
                {adSecondsLeft > 0
                  ? `Simulated video playing (${adSecondsLeft}s)...`
                  : 'Reward unlocked!'}
              </p>
            </div>

            <button
              type="button"
              disabled={adSecondsLeft > 0}
              onClick={onCompleteAd}
              className="candy-btn-green-pill w-full py-3 text-white font-black text-xs game-stroke-xs cursor-pointer disabled:cursor-wait flex items-center justify-center gap-1.5"
            >
              <StreakFlame3DIcon className="w-4 h-4" />
              <span>{adSecondsLeft > 0 ? 'Please Wait...' : 'Claim Reward'}</span>
            </button>
          </div>
        )}
        {/* BOTTLE DESIGN 2x2 COMPARE SHOWCASE */}
        {modal === 'BOTTLE_COMPARE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-game-display text-lg font-bold text-[#FFF9D6] game-stroke-sm leading-tight">
                  Crystal Flask Designs
                </h2>
                <p className="text-[11px] font-bold text-[#FFF5DB]">
                  Tap any edition to equip it on the shelves
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                aria-label="Close bottle comparison"
                className="candy-btn-blue w-9 h-9 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Close3DIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {BOTTLE_STYLE_LIST.map((design) => {
                const isSelected = profile.bottleStyle === design.id;
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => {
                      onSelectBottleStyle(design.id);
                      onCloseModal();
                    }}
                    className={`relative p-2.5 flex flex-col items-center text-center cursor-pointer active:translate-y-0.5 ${
                      isSelected ? 'candy-card-cream ring-2 ring-[#36DC15]' : 'candy-card-cream'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-[#29B80A] border border-white text-white text-[9px] font-black uppercase">
                        Active
                      </span>
                    )}
                    <div className="relative w-full pt-1.5 pb-2 flex flex-col items-center justify-end rounded-xl bg-gradient-to-b from-[#8A4D1F] via-[#A9622B] to-[#743C13] shadow-inner overflow-hidden">
                      <div className="pointer-events-none">
                        <CrystalBottle
                          bottle={SHOWCASE_BOTTLE}
                          bottleStyle={design.id}
                          selected={false}
                          colorSymbolsEnabled={profile.colorSymbolsEnabled}
                          sizeClassName="w-[76px] h-[128px] overflow-visible drop-shadow-[0_6px_8px_rgba(32,12,2,0.45)]"
                          interactive={false}
                          onSelect={() => {}}
                        />
                      </div>
                      <div className="w-[90%] h-2.5 -mt-2 rounded-full bg-gradient-to-b from-[#D98E47] to-[#874411] border border-[#522405]" />
                    </div>
                    <div className="mt-1.5 text-xs font-black text-[#4E2305] leading-tight">
                      {design.title}
                    </div>
                    <div className="mt-0.5 text-[9.5px] font-bold text-[#8A5A1A] leading-snug">
                      {design.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
