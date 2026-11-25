import React, { createContext, useContext } from 'react';
import type { IngredientId, LanguageCode, PotionColor } from './types';

const ZH = {
  // Brand & Home
  gameTitle: 'Potion Sort',
  gameSubtitle: '暖阳花房工坊',
  coinsLabel: '金币',
  livesFull: '已满',
  mapBadge: '地图',
  streakBadge: '连胜',
  streakReady: '待激活',
  dailyBadge: '签到',
  dailyClaimReady: '待领',
  dailyDayShort: '第{n}天',
  noAdsBadge: '去广告',
  adFreeBadge: '已免广',
  levelCta: '第 {n} 关',
  levelShort: '第 {n} 关',
  streakBoostReady: '连胜 x{n} 加成已就绪',
  streakTooltipTitle: '日光连胜 · 当前 x{n}',
  streakBestRecord: '历史最高连胜：x{n}',
  streakRule1: '1 连胜：开局自动倾倒 1 步',
  streakRule2: '2 连胜：开局自动倾倒 2 步',
  streakRule3: '3+ 连胜：自动倾倒 2 步 + 1 次免费撤回',
  streakTier0: '连续通关前沿关卡即可点亮开局自动倾倒加成！',
  navShop: '商店',
  navEvents: '活动',
  navHome: '首页',
  navAchievements: '成就',
  navAlembic: '炼金台',

  // Gameplay HUD & Reactions
  movesCount: '{n} 步',
  diffHard: '困难',
  diffSuperHard: '超难',
  diffStandard: '标准',
  noPoursLeft: '没有可倾倒的步骤了！',
  optionsBtn: '查看方案',
  reactNewCraft: '新机制：{name}！',
  reactOrderUp: '本关配方：{name}',
  reactStreakBoost3: '连胜 x{n}！自动完成 {count} 步并赠 1 次免费撤回！',
  reactStreakBoost: '连胜 x{n}！小龙帮你自动倾倒了 {count} 步！',
  reactCorkLocked: '软木塞封口！先倒入「{color}」就能弹开。',
  reactCrateLocked: '彩锁木箱！集满一瓶「{color}」即可破除。',
  reactCurtainLocked: '丝绒帘幕！集满一瓶「{color}」即可揭开。',
  reactCorkPopped: '啵！软木塞弹开，瓶口解封啦！',
  reactCurtainLifted: '满瓶封口！丝绒帘幕已华丽揭开！',
  reactCrateUnlocked: '满瓶封口！彩锁木箱已轰然破除！',
  reactBottleSealed: '封口成功！完美集齐「{color}」！',
  reactHiddenRevealed: '神秘沉淀颜色已揭晓！',
  reactLevelComplete: '「{name}」调配完成！',
  reactUndoDone: '已撤回上一步倾倒！',
  reactShuffleDone: '呼啦！已重新洗牌未封口魔药！',
  reactMaxExtraFlasks: '架子上最多放置 2 个额外空瓶哦！',
  reactExtraFlaskAdded: '小龙送来了一只崭新的水晶空瓶！',
  reactNotEnoughCoins: '金币不足，需要 {cost} 金币！',
  reactBoughtBooster: '花费 {cost} 金币立即补充了道具！',
  reactFoxCheer: '加油哦！把同色魔药倒在一起吧～',
  reactDragonCheer: '嗷呜！这局一定能轻松通关！',

  // Modals — Paused
  pauseTitle: '游戏已暂停',
  pauseStreakWarn: '当前连胜 x{n}（重开将重置连胜并消耗 1 点体力）',
  pauseRelaxTip: '轻松畅玩——不限步数、不限时间，享受纯粹的调色解谜。',
  pauseTrialTip: '庆典试炼不消耗体力，也不会影响主线连胜。',
  resumeBtn: '继续游戏',
  restartLevelBtn: '重开本关（-1 体力）',
  restartTrialBtn: '重开本关（免体力）',
  soundOn: '音效开启',
  soundMuted: '已静音',
  symbolsOn: '符号开启',
  symbolsOff: '符号关闭',
  quitToHome: '返回首页',

  // Modals — Victory & Defeat
  statTime: '用时',
  statMoves: '步数',
  statStreak: '连胜',
  speedTimerTooltip: '速通加分倒计时（归零不影响通关）',
  speedBonusBadge: '限时速通奖励 · +{pts} 积分 · +{coins} 金币',
  rewardCoins: '+{n} 金币',
  rewardStars: '+{n} 星光',
  rewardEssence: '+1 {name}',
  replayPracticeNotice: '已通关练习重玩 · 奖励练习金币（不影响连胜）',
  nextLevelBtn: '下一关',
  backToFestivalBtn: '返回庆典活动',
  returnHomeBtn: '返回首页',
  defeatBottlesProgress: '已完成魔药瓶：{done} / {total}',
  continueWithFlaskBtn: '使用 1 只额外空瓶继续（库存 {n}）',
  continueWithCoinsBtn: '花费 {cost} 金币加 1 只空瓶继续',
  continueMaxFlasksBtn: '架子空瓶已达上限',
  tryAgainBtn: '重新挑战（-1 体力）',
  tryAgainTrialBtn: '重新挑战（免体力）',
  tapCgZoomHint: '轻触画幅可全屏欣赏 CG',
  closePreview: '收起全屏',
  achievementNewBanner: '新成就解锁！已收录至成就图鉴（+{n} 金币待领）',

  // Modals — Lives
  livesTitle: '体力与补给',
  livesNextIn: '下一点体力恢复倒计时 {time}',
  livesFullDesc: '当前体力已满（5/5），随时开玩！',
  buyOneLifeCoinsBtn: '立即恢复 +1 体力（{cost} 金币）',
  refillLivesCoinsBtn: '立即补满 5/5 体力（{cost} 金币）',
  closeBtn: '关闭',

  // Modals — Settings
  settingsTitle: '游戏设置',
  settingBgm: '工坊背景音乐',
  settingSfx: '游戏交互音效',
  settingHaptics: '手机震动反馈',
  settingSymbols: '色盲药水符号',
  settingLanguage: '界面语言',
  testHapticBtn: '测一下',
  testHapticSent: '已震动',
  hapticsFallbackNote: '当前设备浏览器不支持原生震动，已自动启用触觉音效与微动补偿。',
  toggleOn: '开',
  toggleOff: '关',
  removeAdsOwned: '已激活永久免广告特权',
  removeAdsBuy: '永久移除所有插屏广告 · ¥30',
  resetProgressBtn: '重置本地游戏进度',

  // Monetization — Remove Ads, Interstitial & Rewarded Video
  removeAdsTitle: '永久免广告特权',
  removeAdsDesc: '永久移除所有关卡间强制插屏广告，沉浸炼金',
  removeAdsModalTitle: '永久免广告特权',
  removeAdsModalSubtitle: '一次解锁，永久免除关卡间强制插屏打扰',
  removeAdsBenefit1: '永久移除所有关卡间的强制插屏广告',
  removeAdsBenefit2: '仍可自主选择观看激励短片领取双倍金币、空瓶或体力',
  removeAdsConfirmBtn: '确认解锁免广告 · ¥30',
  ownedBadge: '已拥有',
  buyPriceLabel: '¥30',
  adTipLine: '跳过关卡间强制插屏？',
  removeAdsLink: '升级免广告',
  doubleCoinsBtn: '看激励短片 · 领取双倍金币',
  continueAdBtn: '看激励短片 · 免费 +1 空瓶继续',
  freeLifeAdBtn: '看激励短片 · 免费恢复 +1 体力',
  interstitialTag: '关卡间插屏展示',
  interstitialTitle: '短暂休息一下，即将进入下一关',
  interstitialCountdown: '{s} 秒后可继续进入下一关...',
  interstitialReady: '可以继续挑战下一关啦！',
  interstitialContinueBtn: '继续进入下一关',
  interstitialSkipWithNoAds: '升级永久免广告 · 告别强制插屏',
  rewardVideoTag: '可选激励补给短片',
  rewardVideoPlaying: '正在播放激励短片（{s} 秒）...',
  rewardVideoReady: '奖励已就绪，点击领取！',
  pleaseWait: '请稍候...',
  claimRewardBtn: '领取奖励',
  adLabel2xCoins: '激励补给 · 额外领取 +{n} 金币',
  adLabelContinue: '激励补给 · 免费 +1 水晶空瓶继续',
  adLabelLife: '激励补给 · 免费恢复 +1 体力',

  // CG Achievements
  achievementsTitle: '成就图鉴',
  achievementsSubtitle: '已解锁 {cur} / {total} 幅结算画卷',
  achievementsAllTab: '全部 ({n})',
  achievementsVictoryTab: '战胜 ({n})',
  achievementsDefeatTab: '战败 ({n})',
  achievementLockedTitle: '尚未解锁的画卷',
  achievementLockedHint: '在关卡结算时达成下方条件即可自动点亮并欣赏大图',
  achievementConditionPrefix: '解锁条件：',
  achievementClaimCoins: '领取 +{n} 金币',
  achievementClaimAllCoins: '一键领取 +{n} 金币',
  achievementClaimedToast: '成就奖励已入账 +{n} 金币！',
  achievementStatLevel: '最高关卡',
  achievementStatStreak: '历史最高连胜',
  achievementStatDaily: '连续签到',
  achievementDaysVal: '{n} 天',
  cgTriggerV1: '通关任意标准关卡，触发一阶胜利结算画面',
  cgTriggerV2: '达成 2 连胜或通关困难关卡，触发二阶胜利结算画面',
  cgTriggerV3: '达成 4 连胜、通关超难关卡或完成庆典试炼，触发三阶胜利结算画面',
  cgTriggerD1: '首次受挫或完成过半惜败，触发一阶战败结算画面',
  cgTriggerD2: '同关第 2 次受挫或早期陷入死局，触发二阶战败结算画面',
  cgTriggerD3: '同关第 3 次受挫或 3+ 高连胜中断，触发三阶战败结算画面',

  // Modals — Daily Login Reward (7-Day Calendar)
  dailyRewardTitle: '7日暖阳签到',
  dailyRewardSubtitle: '每日登录点亮日历，第 7 天解锁超级大礼！',
  dailyRewardStreakBadge: '已连签第 {n} 天',
  dailyCalendarDayLabel: '第 {n} 天',
  dailyCalendarTodayTag: '今日',
  dailyCalendarClaimedTag: '已签',
  dailyCalendarCoinsShort: '+{n}',
  dailyCalendarUndoShort: '撤回 x{n}',
  dailyCalendarShuffleShort: '洗牌 x{n}',
  dailyCalendarFlaskShort: '空瓶 x{n}',
  dailyCalendarDay7Tag: '第 7 天终极大奖',
  dailyCalendarDay7Title: '日光宝箱豪礼',
  dailyCalendarDay7Summary: '+200 金币 · +1 空瓶 · +1 撤回',
  dailyCalendarCountdownHint: '再签 {n} 天即可领大奖',
  dailyCalendarDay7Ready: '今日可领大奖！',
  dailyRewardClaimDayBtn: '领取第 {n} 天好礼',
  dailyRewardClaimGrandBtn: '开启第 7 天终极大奖！',
  dailyRewardComeBackHint: '明天再来签到即可点亮下一格并延续连签',
  dailyRewardAlreadyClaimed: '今日已签到完成！明天再来继续向第 7 天大奖冲刺',

  // MetaViews — Map, Alembic, Event, Shop
  mapTitle: '日光关卡地图',
  mapSubtitle: '已通关 {done} 关 · 当前挑战第 {cur} 关',
  milestoneMystery: '? 神秘加码',
  milestoneCork: '软木塞登场',
  milestoneCrate: '彩锁箱登场',
  milestoneCurtain: '丝绒帘登场',
  alembicTitle: '日光炼金台',
  alembicSubtitle: '将通关收集的精华蒸馏为局内道具',
  collectedEssences: '已收集精华',
  brewBtn: '炼制',
  alembicBrewedToast: '炼制成功！已获得 +{n} 道具',
  eventTitle: '极光庆典',
  eventSubtitle: '收集关卡星光解锁里程碑 · 畅玩特色试炼',
  milestoneTrack: '星光里程碑',
  starsProgress: '{cur} / 100 星光',
  claimedBadge: '已领取',
  claimBtn: '领取',
  eventClaimedToast: '里程碑奖励已领取！',
  festivalTrialsTitle: '特色机制试炼（随时抢先体验）',
  trialClearedTag: ' · 已通关 ✓',
  trialStarReward: '首通 +{n} 庆典星光',
  trialReplayHint: '已首通 · 重玩奖励 +{n} 金币',
  playTrialBtn: '开始试炼',
  shopTitle: '日光精品屋',
  shopSubtitle: '用金币补充炼金道具、花房精华或体力',
  shopUndoPack: '撤回补给包（+3）',
  shopShufflePack: '洗牌补给包（+2）',
  shopFlaskPack: '额外水晶瓶（+1）',
  shopEssencePouch: '花房精华盲袋（+3 随机精华）',
  shopEssencePouchDesc: '随机开出 3 份精华，用于炼金台蒸馏道具',
  shopOwnedCount: '当前拥有：{n}',
  shopCoinsPrice: '{n} 金币',
  shopSingleLife: '快速补充 +1 体力',
  shopRefillLives: '补满全部体力（5/5）',
  shopCurrentLives: '当前体力：{cur}/{max}',
  shopPurchasedToast: '购买成功！已存入工坊背包',
  shopEssenceToast: '打开精华盲袋获得：{items}',
  returnToHomeBtn: '返回首页',
  coinsRewardShort: '+{n} 金币',

  // Android Back & Onboarding Tutorials
  backExitToast: '再按一次返回键退出游戏',
  tutorialTapSource: '点选魔药瓶',
  tutorialTapTarget: '点这里倒水',
  tutorialBasicsHint: '把同色魔药倒进同一个瓶子，集满 4 层即可封口！',
  tutorialMysteryTitle: '新机关 · 神秘问号',
  tutorialMysteryBody: '倒走上层魔药，下方隐藏的「?」颜色就会立刻揭晓！',
  tutorialCorkTitle: '新机关 · 软木塞封口',
  tutorialCorkBody: '封口瓶暂时不能倒出，先倒入同色魔药即可啵地弹开！',
  tutorialCrateTitle: '新机关 · 彩锁木箱',
  tutorialCrateBody: '先集满一瓶与锁头同色的魔药，木箱就会自动碎裂解锁！',
  tutorialCurtainTitle: '新机关 · 丝绒帘幕',
  tutorialCurtainBody: '先集满一瓶与帘幕宝石同色的魔药，就能华丽揭开帘幕！',
  tutorialGotIt: '知道了',
} as const;

export type I18nKey = keyof typeof ZH;

const EN: Record<I18nKey, string> = {
  // Brand & Home
  gameTitle: 'Potion Sort',
  gameSubtitle: 'Sunlit Conservatory',
  coinsLabel: 'Coins',
  livesFull: 'Full',
  mapBadge: 'Map',
  streakBadge: 'Streak',
  streakReady: 'Ready',
  dailyBadge: 'Daily',
  dailyClaimReady: 'Gift!',
  dailyDayShort: 'Day {n}',
  noAdsBadge: 'No Ads',
  adFreeBadge: 'Ad-Free',
  levelCta: 'Level {n}',
  levelShort: 'Lv {n}',
  streakBoostReady: 'Streak x{n} Boost Ready',
  streakTooltipTitle: 'Solstice Streak · x{n}',
  streakBestRecord: 'Best Streak: x{n}',
  streakRule1: '1 Win: 1 Opening Auto-Pour',
  streakRule2: '2 Wins: 2 Opening Auto-Pours',
  streakRule3: '3+ Wins: 2 Auto-Pours + 1 Free Undo',
  streakTier0: 'Beat frontier levels in a row to activate opening auto-pours!',
  navShop: 'Shop',
  navEvents: 'Events',
  navHome: 'Home',
  navAchievements: 'Achieve',
  navAlembic: 'Alembic',

  // Gameplay HUD & Reactions
  movesCount: 'Moves {n}',
  diffHard: 'HARD',
  diffSuperHard: 'SUPER HARD',
  diffStandard: 'Standard',
  noPoursLeft: 'No pours left!',
  optionsBtn: 'Options',
  reactNewCraft: 'New craft: {name}!',
  reactOrderUp: 'Order up: {name}!',
  reactStreakBoost3: 'Streak x{n}! {count} auto-pours + 1 Free Undo!',
  reactStreakBoost: 'Streak x{n}! Helped with {count} opening pours!',
  reactCorkLocked: 'Corked! Pour {color} on top first.',
  reactCrateLocked: 'Locked crate! Seal a {color} flask.',
  reactCurtainLocked: 'Velvet curtain! Seal {color} to reveal.',
  reactCorkPopped: 'Pop! Cork unsealed & glowing!',
  reactCurtainLifted: 'Flask sealed & velvet curtain lifted!',
  reactCrateUnlocked: 'Flask sealed & crate unlocked!',
  reactBottleSealed: 'Sealed! {color} perfected!',
  reactHiddenRevealed: 'Mystic sediment revealed!',
  reactLevelComplete: '{name} complete!',
  reactUndoDone: 'Rewound that pour!',
  reactShuffleDone: 'Whoosh! Open flasks remixed!',
  reactMaxExtraFlasks: 'Max +2 spare flasks on the shelf!',
  reactExtraFlaskAdded: 'Brought a fresh crystal flask!',
  reactNotEnoughCoins: 'Need {cost} Coins!',
  reactBoughtBooster: 'Spent {cost} Coins for +1 booster!',
  reactFoxCheer: 'You got this! Match the colors!',
  reactDragonCheer: 'Rawr! Let us clear this brew!',

  // Modals — Paused
  pauseTitle: 'Game Paused',
  pauseStreakWarn: 'Active Streak: x{n} (Restarting resets streak & uses 1 life)',
  pauseRelaxTip: 'Relax — no move limits or timers, just pure cozy sorting.',
  pauseTrialTip: 'Festival Trials cost no lives and keep your campaign streak safe.',
  resumeBtn: 'Resume',
  restartLevelBtn: 'Restart Level (-1 Life)',
  restartTrialBtn: 'Restart Trial (Free)',
  soundOn: 'Sound On',
  soundMuted: 'Muted',
  symbolsOn: 'Symbols On',
  symbolsOff: 'Symbols Off',
  quitToHome: 'Quit to Home',

  // Modals — Victory & Defeat
  statTime: 'TIME',
  statMoves: 'MOVES',
  statStreak: 'STREAK',
  speedTimerTooltip: 'Optional speed bonus countdown (no penalty at 0:00)',
  speedBonusBadge: 'Speed Bonus · +{pts} pts · +{coins} Coins',
  rewardCoins: '+{n} Coins',
  rewardStars: '+{n} Stars',
  rewardEssence: '+1 {name}',
  replayPracticeNotice: 'Practice replay · Grants practice coins (streak unchanged)',
  nextLevelBtn: 'Next Level',
  backToFestivalBtn: 'Back to Festival',
  returnHomeBtn: 'Return Home',
  defeatBottlesProgress: 'Bottles Completed: {done} / {total}',
  continueWithFlaskBtn: 'Continue with Extra Flask (Owned: {n})',
  continueWithCoinsBtn: 'Continue (+1 Flask · {cost} Coins)',
  continueMaxFlasksBtn: 'Max Extra Flasks Reached',
  tryAgainBtn: 'Try Again (-1 Life)',
  tryAgainTrialBtn: 'Try Again (Free)',
  tapCgZoomHint: 'Tap illustration to view fullscreen',
  closePreview: 'Close Fullscreen',
  achievementNewBanner: 'New CG Achievement Unlocked! (+{n} Coins to claim)',

  // Modals — Lives
  livesTitle: 'Lives & Refills',
  livesNextIn: 'Next life refills in {time}',
  livesFullDesc: 'Your lives are currently full (5/5)!',
  buyOneLifeCoinsBtn: 'Refill +1 Life ({cost} Coins)',
  refillLivesCoinsBtn: 'Refill 5/5 Lives ({cost} Coins)',
  closeBtn: 'Close',

  // Modals — Settings
  settingsTitle: 'Settings',
  settingBgm: 'Workshop Music (BGM)',
  settingSfx: 'Sound Effects (SFX)',
  settingHaptics: 'Mobile Haptic Vibration',
  settingSymbols: 'Color-Blind Symbols',
  settingLanguage: 'Language',
  testHapticBtn: 'Test',
  testHapticSent: 'Felt!',
  hapticsFallbackNote: 'Native vibration unavailable in this browser; tactile audio & micro-motion active.',
  toggleOn: 'ON',
  toggleOff: 'OFF',
  removeAdsOwned: 'Ad-Free Active (Owned)',
  removeAdsBuy: 'Remove All Ads Forever — $4.99',
  resetProgressBtn: 'Reset Local Progress',

  // Monetization — Remove Ads, Interstitial & Rewarded Video
  removeAdsTitle: 'Remove All Ads',
  removeAdsDesc: 'Zero forced interstitials between levels forever',
  removeAdsModalTitle: 'Permanent Ad-Free',
  removeAdsModalSubtitle: 'One-time unlock for uninterrupted sorting',
  removeAdsBenefit1: 'Permanently removes all forced between-level interstitial ads',
  removeAdsBenefit2: 'Optional rewarded videos for bonus perks remain available',
  removeAdsConfirmBtn: 'Unlock Ad-Free — $4.99',
  ownedBadge: 'Owned',
  buyPriceLabel: '$4.99',
  adTipLine: 'Skip forced ads between levels?',
  removeAdsLink: 'Go Ad-Free',
  doubleCoinsBtn: '2x Coins · Reward Video',
  continueAdBtn: 'Free +1 Flask · Reward Video',
  freeLifeAdBtn: 'Free +1 Life · Reward Video',
  interstitialTag: 'Between-Level Intermission',
  interstitialTitle: 'Quick breather before your next level',
  interstitialCountdown: 'Continue to next level in {s}s...',
  interstitialReady: 'Ready for your next level!',
  interstitialContinueBtn: 'Continue to Next Level',
  interstitialSkipWithNoAds: 'Go Ad-Free · Remove Forced Ads',
  rewardVideoTag: 'Optional Rewarded Video',
  rewardVideoPlaying: 'Preparing bonus reward ({s}s)...',
  rewardVideoReady: 'Reward unlocked!',
  pleaseWait: 'Please Wait...',
  claimRewardBtn: 'Claim Reward',
  adLabel2xCoins: 'Reward Video · +{n} Extra Coins',
  adLabelContinue: 'Reward Video · +1 Free Crystal Flask',
  adLabelLife: 'Reward Video · +1 Instant Life',

  // CG Achievements
  achievementsTitle: 'Achievements',
  achievementsSubtitle: '{cur} / {total} Outcome CGs Unlocked',
  achievementsAllTab: 'All ({n})',
  achievementsVictoryTab: 'Victory ({n})',
  achievementsDefeatTab: 'Defeat ({n})',
  achievementLockedTitle: 'Locked Artwork',
  achievementLockedHint: 'Trigger the matching level-end screen to unlock & view fullscreen',
  achievementConditionPrefix: 'Unlock: ',
  achievementClaimCoins: 'Claim +{n} Coins',
  achievementClaimAllCoins: 'Claim All +{n} Coins',
  achievementClaimedToast: 'Claimed +{n} achievement coins!',
  achievementStatLevel: 'Highest Lv',
  achievementStatStreak: 'Best Streak',
  achievementStatDaily: 'Daily Streak',
  achievementDaysVal: '{n}d',
  cgTriggerV1: 'Clear a standard level to trigger Tier I Victory CG',
  cgTriggerV2: 'Reach a 2+ streak or beat a Hard level for Tier II Victory CG',
  cgTriggerV3: 'Reach a 4+ streak, beat Super Hard, or clear a Trial for Tier III Victory CG',
  cgTriggerD1: 'Experience your first setback or 50%+ close call for Tier I Defeat CG',
  cgTriggerD2: 'Hit a 2nd retry or early deadlock for Tier II Defeat CG',
  cgTriggerD3: 'Hit a 3rd+ retry or break a 3+ streak for Tier III Defeat CG',

  // Modals — Daily Login Reward (7-Day Calendar)
  dailyRewardTitle: '7-Day Login Calendar',
  dailyRewardSubtitle: 'Check in daily to mark off days & unlock the Day 7 Jackpot!',
  dailyRewardStreakBadge: 'Day {n} Streak',
  dailyCalendarDayLabel: 'Day {n}',
  dailyCalendarTodayTag: 'TODAY',
  dailyCalendarClaimedTag: 'DONE',
  dailyCalendarCoinsShort: '+{n}',
  dailyCalendarUndoShort: 'Undo x{n}',
  dailyCalendarShuffleShort: 'Mix x{n}',
  dailyCalendarFlaskShort: 'Flask x{n}',
  dailyCalendarDay7Tag: 'DAY 7 GRAND PRIZE',
  dailyCalendarDay7Title: 'Solstice Jackpot Chest',
  dailyCalendarDay7Summary: '+200 Coins · +1 Flask · +1 Undo',
  dailyCalendarCountdownHint: '{n} days to Grand Prize',
  dailyCalendarDay7Ready: 'Ready to claim!',
  dailyRewardClaimDayBtn: 'Claim Day {n} Gift',
  dailyRewardClaimGrandBtn: 'Claim Day 7 Grand Prize!',
  dailyRewardComeBackHint: 'Return tomorrow to mark off the next day',
  dailyRewardAlreadyClaimed: 'Today is checked off! Come back tomorrow toward Day 7',

  // MetaViews — Map, Alembic, Event, Shop
  mapTitle: 'Solarium Map',
  mapSubtitle: '{done} Cleared · Current: Level {cur}',
  milestoneMystery: '? Deep Mystery',
  milestoneCork: 'Cork Intro',
  milestoneCrate: 'Crate Intro',
  milestoneCurtain: 'Curtain Intro',
  alembicTitle: 'Sun Alembic',
  alembicSubtitle: 'Distill level essences into puzzle boosters',
  collectedEssences: 'Collected Essences',
  brewBtn: 'Brew',
  alembicBrewedToast: 'Brewed! Added +{n} booster',
  eventTitle: 'Azure Gala',
  eventSubtitle: 'Earn level stars for milestones & play mechanic trials',
  milestoneTrack: 'Milestone Track',
  starsProgress: '{cur} / 100 Stars',
  claimedBadge: 'Claimed',
  claimBtn: 'Claim',
  eventClaimedToast: 'Milestone reward claimed!',
  festivalTrialsTitle: 'Festival Trials (Play Any Mechanic Immediately)',
  trialClearedTag: ' · Cleared ✓',
  trialStarReward: 'First clear +{n} Gala Stars',
  trialReplayHint: 'Cleared · Replay +{n} Coins',
  playTrialBtn: 'Play Trial',
  shopTitle: 'Solarium Boutique',
  shopSubtitle: 'Spend coins on boosters, essences, or life refills',
  shopUndoPack: 'Undo Pack (+3)',
  shopShufflePack: 'Shuffle Pack (+2)',
  shopFlaskPack: 'Extra Flask (+1)',
  shopEssencePouch: 'Essence Pouch (+3 Random)',
  shopEssencePouchDesc: 'Grants 3 random essences for the Sun Alembic',
  shopOwnedCount: 'Owned: {n}',
  shopCoinsPrice: '{n} Coins',
  shopSingleLife: 'Quick +1 Life',
  shopRefillLives: 'Full Lives Refill (5/5)',
  shopCurrentLives: 'Current: {cur}/{max}',
  shopPurchasedToast: 'Purchased! Added to your bag',
  shopEssenceToast: 'Opened pouch: {items}',
  returnToHomeBtn: 'Return to Home',
  coinsRewardShort: '+{n} Coins',

  // Android Back & Onboarding Tutorials
  backExitToast: 'Press back again to exit',
  tutorialTapSource: 'Tap flask',
  tutorialTapTarget: 'Pour here',
  tutorialBasicsHint: 'Pour matching colors together — fill 4 layers to seal a flask!',
  tutorialMysteryTitle: 'New · Mystery Layers',
  tutorialMysteryBody: 'Pour away the top layer to reveal hidden "?" colors underneath!',
  tutorialCorkTitle: 'New · Corked Flask',
  tutorialCorkBody: 'Corked flasks cannot pour out — pour matching color on top to pop it!',
  tutorialCrateTitle: 'New · Padlocked Crate',
  tutorialCrateBody: 'Seal one full flask matching the padlock color to smash the crate!',
  tutorialCurtainTitle: 'New · Velvet Curtain',
  tutorialCurtainBody: 'Seal one full flask matching the curtain gem color to lift it!',
  tutorialGotIt: 'Got it',
};

const COLOR_ZH: Record<PotionColor, string> = {
  coral: '红莓焰液',
  seafoam: '青柠荧光',
  citron: '日光流金',
  azure: '钴蓝星海',
  iris: '皇家紫晶',
  rose: '蜜桃蔷薇',
  jade: '薄荷碧露',
};

const COLOR_EN: Record<PotionColor, string> = {
  coral: 'Ruby Berry',
  seafoam: 'Neon Lime',
  citron: 'Solar Gold',
  azure: 'Cobalt Splash',
  iris: 'Royal Grape',
  rose: 'Sunset Rose',
  jade: 'Aqua Mint',
};

const POTION_ORDERS_ZH: Record<string, string> = {
  'Sunburst Elixir': '日光迸发灵药',
  'Skywing Tonic': '天翼清风药剂',
  'Honeyberry Brew': '蜜莓暖光特酿',
  'Starlight Draught': '星辉凝露饮',
  'Dewdrop Nectar': '晨露花蜜液',
  'Velvet Mist Vial': '丝绒迷雾瓶',
  'Dragonfruit Fizz': '龙果气泡魔药',
  'Amber Hearth Potion': '琥珀炉火灵液',
  'Gilded Clover Blend': '鎏金四叶草调和',
  'Royal Solstice Brew': '皇家夏至圣酿',
};

const MECHANICS_ZH: Record<string, string> = {
  'Tap-to-Pour Basics': '轻触瓶身即可倾倒同色魔药',
  'Mystery "?" Layers': '神秘「?」隐藏色层',
  'Corked Decanters': '软木塞封口魔药瓶',
  'Color-Padlocked Crates': '彩锁木箱封印瓶',
  'Velvet Curtain Bottles': '丝绒帘幕遮蔽瓶',
};

const INGREDIENTS_ZH: Record<IngredientId, { full: string; short: string }> = {
  citrus: { full: '日光柑橘瓣', short: '柑橘' },
  crystal: { full: '海蓝魔晶盐', short: '魔晶' },
  dew: { full: '琥珀晨露', short: '晨露' },
  mist: { full: '蔚蓝星雾', short: '星雾' },
};

const INGREDIENTS_EN: Record<IngredientId, { full: string; short: string }> = {
  citrus: { full: 'Citrus Petal', short: 'Citrus' },
  crystal: { full: 'Sea Crystal', short: 'Crystal' },
  dew: { full: 'Amber Dew', short: 'Dew' },
  mist: { full: 'Azure Mist', short: 'Mist' },
};

const TRIALS_ZH: Record<string, { name: string; subtitle: string }> = {
  'trial-mystery': { name: '迷雾沉淀试炼', subtitle: '体验神秘「?」隐藏色层玩法' },
  'trial-cork': { name: '软木塞封口试炼', subtitle: '倒入同色魔药弹开瓶口软木塞' },
  'trial-crate': { name: '鎏金彩锁试炼', subtitle: '集满对应色魔药瓶以解开木箱锁' },
  'trial-curtain': { name: '丝绒帷幕终章', subtitle: '全障碍同台登场 · 超难大师挑战' },
};

const RECIPES_ZH: Record<string, { name: string; description: string }> = {
  undo_tonic: { name: '时光回溯药水', description: '蒸馏获得 +2 次撤回，关键步从容反悔' },
  shuffle_draught: { name: '微风洗牌合剂', description: '蒸馏获得 +1 次洗牌，重排未封口魔药' },
  flask_elixir: { name: '水晶扩容灵药', description: '蒸馏获得 +1 只额外空瓶，化解死局' },
};

const MILESTONE_BOOSTER_ZH: Record<string, string> = {
  '+2 Undo': '+2 撤回',
  '+1 Shuffle': '+1 洗牌',
  '+1 Flask': '+1 空瓶',
  '+2 Flasks': '+2 空瓶',
};

export interface I18nContextValue {
  lang: LanguageCode;
  t: (key: I18nKey, params?: Record<string, string | number>) => string;
  colorName: (color: PotionColor) => string;
  potionOrderName: (rawName: string) => string;
  mechanicName: (rawName: string) => string;
  ingredientName: (id: IngredientId, short?: boolean) => string;
  trialText: (id: string, fallbackName: string, fallbackSub: string) => {
    name: string;
    subtitle: string;
  };
  recipeText: (id: string, fallbackName: string, fallbackDesc: string) => {
    name: string;
    description: string;
  };
  milestoneBoosterLabel: (rawLabel: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function createI18nValue(lang: LanguageCode): I18nContextValue {
  const dict = lang === 'zh' ? ZH : EN;
  const t = (key: I18nKey, params?: Record<string, string | number>): string => {
    let text: string = dict[key];
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };

  return {
    lang,
    t,
    colorName: (color) => (lang === 'zh' ? COLOR_ZH[color] : COLOR_EN[color]),
    potionOrderName: (rawName) => (lang === 'zh' ? POTION_ORDERS_ZH[rawName] ?? rawName : rawName),
    mechanicName: (rawName) => (lang === 'zh' ? MECHANICS_ZH[rawName] ?? rawName : rawName),
    ingredientName: (id, short = false) => {
      const entry = lang === 'zh' ? INGREDIENTS_ZH[id] : INGREDIENTS_EN[id];
      return short ? entry.short : entry.full;
    },
    trialText: (id, fallbackName, fallbackSub) =>
      lang === 'zh' && TRIALS_ZH[id]
        ? TRIALS_ZH[id]
        : { name: fallbackName, subtitle: fallbackSub },
    recipeText: (id, fallbackName, fallbackDesc) =>
      lang === 'zh' && RECIPES_ZH[id]
        ? RECIPES_ZH[id]
        : { name: fallbackName, description: fallbackDesc },
    milestoneBoosterLabel: (rawLabel) =>
      lang === 'zh' ? MILESTONE_BOOSTER_ZH[rawLabel] ?? rawLabel : rawLabel,
  };
}

export const LanguageProvider: React.FC<{
  lang: LanguageCode;
  children: React.ReactNode;
}> = ({ lang, children }) => {
  const value = React.useMemo(() => createI18nValue(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) return createI18nValue('en');
  return ctx;
}
