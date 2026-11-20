import React, { createContext, useContext } from 'react';
import type { BottleStyleId, IngredientId, LanguageCode, PotionColor } from './types';

const ZH = {
  // Brand & Home
  gameTitle: '日光炼金瓶',
  gameSubtitle: '暖阳花房工坊',
  coinsLabel: '金币',
  livesFull: '已满',
  galaBadge: '庆典',
  mapBadge: '地图',
  streakBadge: '连胜',
  streakReady: '待激活',
  noAdsBadge: '去广告',
  adFreeBadge: '已免广',
  levelCta: '第 {n} 关',
  levelShort: '第 {n} 关',
  streakBoostReady: '连胜 x{n} 加成已就绪',
  streakTooltipTitle: '日光连胜 · {n} 连胜',
  streakTier3: '三阶加成：开局自动倾倒 2 步 + 免费撤回 1 次',
  streakTier2: '二阶加成：开局自动倾倒 2 步',
  streakTier1: '一阶加成：开局自动倾倒 1 步',
  streakTier0: '连续通关即可解锁开局自动倾倒加成！',
  navShop: '商店',
  navEvents: '活动',
  navHome: '首页',
  navSalons: '沙龙',
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
  boosterAdShort: '赠',

  // Modals — Paused
  pauseTitle: '游戏已暂停',
  pauseStreakWarn: '当前连胜 x{n}（重开将重置连胜并消耗 1 点体力）',
  pauseRelaxTip: '轻松畅玩——倒计时归零不会失败，规定时间内通关还可赢得速通加分。',
  resumeBtn: '继续游戏',
  restartLevelBtn: '重开本关（-1 体力）',
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
  adTipLine: '畅享无打扰炼金体验',
  removeAdsLink: '永久免广告',
  nextLevelBtn: '下一关',
  backToFestivalBtn: '返回庆典活动',
  doubleCoinsBtn: '观看奖励视频 · 领取双倍金币',
  returnHomeBtn: '返回首页',
  defeatBottlesProgress: '已完成魔药瓶：{done} / {total}',
  continueAdBtn: '免费领取 +1 水晶空瓶继续挑战',
  tryAgainBtn: '重新挑战（-1 体力）',
  tapCgZoomHint: '轻触画幅可全屏欣赏 CG',
  closePreview: '收起全屏',

  // Modals — Lives
  livesTitle: '体力与补给',
  livesNextIn: '下一点体力恢复倒计时 {time}',
  livesFullDesc: '当前体力已满（5/5），随时开玩！',
  freeLifeAdBtn: '观看奖励视频 · 立即恢复 +1 体力',
  refillLivesCoinsBtn: '立即补满 5/5 体力（150 金币）',
  closeBtn: '关闭',

  // Modals — Settings & CG Gallery
  settingsTitle: '游戏设置',
  settingBgm: '工坊背景音乐',
  settingSfx: '游戏交互音效',
  settingHaptics: '手机震动反馈',
  settingSymbols: '色盲药水符号',
  settingLanguage: '界面语言',
  settingBottleStyle: '水晶魔药瓶外观',
  settingCgGallery: '胜负三阶 CG 鉴赏',
  settingCgGalleryBadge: '6 张',
  compareFourBadge: '4 款切换',
  testHapticBtn: '测一下',
  testHapticSent: '已震动',
  hapticsFallbackNote: '当前设备浏览器不支持原生震动，已自动启用触觉音效与微动补偿。',
  toggleOn: '开',
  toggleOff: '关',
  removeAdsOwned: '已激活永久免广告特权',
  removeAdsBuy: '永久移除所有插屏广告 · ¥30',
  resetProgressBtn: '重置本地游戏进度',
  cgGalleryTitle: '胜负三阶 CG 鉴赏',
  cgGallerySubtitle: '随连胜与挑战进程递进解锁的 6 幅剧情演出',
  cgTabVictory: '战胜 CG（3 阶）',
  cgTabDefeat: '战败 CG（3 阶）',
  cgTriggerV1: '常规通关触发',
  cgTriggerV2: '2 连胜或困难关触发',
  cgTriggerV3: '4 连胜 / 超难关 / 试炼触发',
  cgTriggerD1: '首次受挫或进度过半惜败',
  cgTriggerD2: '同关第 2 次受挫或早期卡关',
  cgTriggerD3: '同关 3 次受挫或高连胜中断',

  // Modals — Reward Video
  rewardVideoTag: '庆典赞助补给',
  rewardVideoPlaying: '正在播放奖励短片（{s} 秒）...',
  rewardVideoReady: '补给已准备就绪！',
  pleaseWait: '请稍候...',
  claimRewardBtn: '领取奖励',
  adLabelUndo: '观看补给短片 · 领取 +1 撤回',
  adLabelShuffle: '观看补给短片 · 领取 +1 洗牌',
  adLabelExtraFlask: '观看补给短片 · 领取 +1 水晶空瓶',
  adLabel2xCoins: '观看补给短片 · 额外领取 +{n} 金币',
  adLabelContinue: '观看补给短片 · 立即获赠 +1 额外空瓶',
  adLabelLife: '观看补给短片 · 立即恢复 +1 体力',

  // Modals — Bottle Compare
  bottleCompareTitle: '水晶瓶外观工坊',
  bottleCompareSubtitle: '点击任意款式即可立即更换货架上的魔药瓶',
  bottleActiveBadge: '使用中',

  // Modals — Daily Login Reward
  dailyRewardTitle: '每日暖阳礼遇',
  dailyRewardSubtitle: '欢迎回到花房工坊！今日份补给已为你备好',
  dailyRewardStreakBadge: '连续签到第 {n} 天',
  dailyRewardCoinsLabel: '+{n} 金币',
  dailyRewardCoinsDesc: '暖阳金币礼袋，可用于商店补给或恢复体力',
  dailyRewardBoosterUndo: '+1 撤回道具',
  dailyRewardBoosterShuffle: '+1 洗牌道具',
  dailyRewardBoosterFlask: '+1 额外水晶空瓶',
  dailyRewardBoosterDesc: '随机惊喜炼金道具，关键时刻助你从容破局',
  dailyRewardClaimBtn: '收下今日好礼',
  dailyRewardComeBackHint: '明天再来签到即可延续连签奖励',

  // MetaViews — Map, Alembic, Event, Shop, Salons
  mapTitle: '日光关卡地图',
  mapSubtitle: '当前已解锁至第 {n} 关',
  milestoneMystery: '? 神秘层',
  milestoneCork: '软木塞',
  milestoneCrate: '彩锁箱',
  milestoneCurtain: '丝绒帘',
  alembicTitle: '日光炼金台',
  alembicSubtitle: '将通关收集的精华蒸馏为局内道具',
  collectedEssences: '已收集精华',
  brewBtn: '炼制',
  eventTitle: '极光庆典',
  eventSubtitle: '限时日光盛典 · 收集星光赢取丰厚补给',
  milestoneTrack: '星光里程碑',
  starsProgress: '{cur} / 100 星光',
  claimedBadge: '已领取',
  claimBtn: '领取',
  festivalTrialsTitle: '特色机制试炼（随时抢先体验）',
  trialClearedTag: ' · 已通关 ✓',
  trialStarReward: '+{n} 庆典星光',
  playTrialBtn: '开始试炼',
  shopTitle: '日光精品屋',
  shopSubtitle: '补充炼金道具或畅享免广告特权',
  removeAdsTitle: '永久免广告特权',
  removeAdsDesc: '彻底去除关卡间所有插屏打扰，沉浸炼金',
  ownedBadge: '已拥有',
  buyPriceLabel: '¥30',
  shopUndoPack: '撤回补给包（+3）',
  shopShufflePack: '洗牌补给包（+2）',
  shopFlaskPack: '额外水晶瓶（+1）',
  shopOwnedCount: '当前拥有：{n}',
  shopCoinsPrice: '{n} 金币',
  shopRefillLives: '补满全部体力',
  shopCurrentLives: '当前体力：{cur}/{max}',
  salonsTitle: '水晶沙龙',
  salonsSubtitle: '炼金公会协作与好友互赠体力',
  comingSoonBadge: '即将开放',
  salonsHeading: '水晶沙龙正在酿造中',
  salonsDesc: '加入暖阳炼金公会、与好友互赠免费体力，并参与周末水晶帆船赛。全新社交版本敬请期待。',
  returnToHomeBtn: '返回首页',
  coinsRewardShort: '+{n} 金币',
} as const;

export type I18nKey = keyof typeof ZH;

const EN: Record<I18nKey, string> = {
  // Brand & Home
  gameTitle: 'Solstice Sort',
  gameSubtitle: 'Sunlit Conservatory',
  coinsLabel: 'Coins',
  livesFull: 'Full',
  galaBadge: 'Gala',
  mapBadge: 'Map',
  streakBadge: 'Streak',
  streakReady: 'Ready',
  noAdsBadge: 'No Ads',
  adFreeBadge: 'Ad-Free',
  levelCta: 'Level {n}',
  levelShort: 'Lv {n}',
  streakBoostReady: 'Streak x{n} Boost Ready',
  streakTooltipTitle: 'Solstice Streak · {n} Wins',
  streakTier3: 'Tier 3: 2 Opening Auto-Pours + 1 Free Undo',
  streakTier2: 'Tier 2: 2 Opening Auto-Pours',
  streakTier1: 'Tier 1: 1 Opening Auto-Pour',
  streakTier0: 'Win levels in a row to unlock opening auto-pours!',
  navShop: 'Shop',
  navEvents: 'Events',
  navHome: 'Home',
  navSalons: 'Salons',
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
  boosterAdShort: 'Ad',

  // Modals — Paused
  pauseTitle: 'Game Paused',
  pauseStreakWarn: 'Active Streak: x{n} (Restarting resets streak & uses 1 life)',
  pauseRelaxTip: 'Relax — no move limits or countdown timers.',
  resumeBtn: 'Resume',
  restartLevelBtn: 'Restart Level (-1 Life)',
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
  adTipLine: 'Enjoy uninterrupted alchemy sessions',
  removeAdsLink: 'Go Ad-Free',
  nextLevelBtn: 'Next Level',
  backToFestivalBtn: 'Back to Festival',
  doubleCoinsBtn: '2x Coins · Reward Video',
  returnHomeBtn: 'Return Home',
  defeatBottlesProgress: 'Bottles Completed: {done} / {total}',
  continueAdBtn: 'Continue (+1 Free Crystal Flask)',
  tryAgainBtn: 'Try Again (-1 Life)',
  tapCgZoomHint: 'Tap illustration to view fullscreen',
  closePreview: 'Close Fullscreen',

  // Modals — Lives
  livesTitle: 'Lives & Refills',
  livesNextIn: 'Next life refills in {time}',
  livesFullDesc: 'Your lives are currently full (5/5)!',
  freeLifeAdBtn: 'Free +1 Life · Reward Video',
  refillLivesCoinsBtn: 'Refill 5/5 Lives (150 Coins)',
  closeBtn: 'Close',

  // Modals — Settings & CG Gallery
  settingsTitle: 'Settings',
  settingBgm: 'Workshop Music (BGM)',
  settingSfx: 'Sound Effects (SFX)',
  settingHaptics: 'Mobile Haptic Vibration',
  settingSymbols: 'Color-Blind Symbols',
  settingLanguage: 'Language',
  settingBottleStyle: 'Crystal Flask Design',
  settingCgGallery: 'Victory & Defeat CGs',
  settingCgGalleryBadge: '6 Artworks',
  compareFourBadge: 'Compare 4',
  testHapticBtn: 'Test',
  testHapticSent: 'Felt!',
  hapticsFallbackNote: 'Native vibration unavailable in this browser; tactile audio & micro-motion active.',
  toggleOn: 'ON',
  toggleOff: 'OFF',
  removeAdsOwned: 'Ad-Free Active (Owned)',
  removeAdsBuy: 'Remove All Ads Forever — $4.99',
  resetProgressBtn: 'Reset Local Progress',
  cgGalleryTitle: 'Outcome CG Gallery',
  cgGallerySubtitle: '6 progressive story artworks unlocked by streaks & trials',
  cgTabVictory: 'Victory CG (3 Tiers)',
  cgTabDefeat: 'Defeat CG (3 Tiers)',
  cgTriggerV1: 'Standard level win',
  cgTriggerV2: '2+ streak or Hard level',
  cgTriggerV3: '4+ streak, Super Hard, or Trial',
  cgTriggerD1: 'First setback or 50%+ close call',
  cgTriggerD2: '2nd retry or early deadlock',
  cgTriggerD3: '3rd+ retry or streak broken',

  // Modals — Reward Video
  rewardVideoTag: 'Festival Supply Bonus',
  rewardVideoPlaying: 'Preparing your bonus reward ({s}s)...',
  rewardVideoReady: 'Reward unlocked!',
  pleaseWait: 'Please Wait...',
  claimRewardBtn: 'Claim Reward',
  adLabelUndo: 'Bonus Supply · +1 Undo Charge',
  adLabelShuffle: 'Bonus Supply · +1 Shuffle Charge',
  adLabelExtraFlask: 'Bonus Supply · +1 Crystal Flask',
  adLabel2xCoins: 'Bonus Supply · +{n} Extra Coins',
  adLabelContinue: 'Bonus Supply · +1 Free Crystal Flask',
  adLabelLife: 'Bonus Supply · +1 Instant Life',

  // Modals — Bottle Compare
  bottleCompareTitle: 'Crystal Flask Designs',
  bottleCompareSubtitle: 'Tap any edition to equip it on the shelves',
  bottleActiveBadge: 'Active',

  // Modals — Daily Login Reward
  dailyRewardTitle: 'Daily Login Gift',
  dailyRewardSubtitle: 'Welcome back to the conservatory! Today’s gift is ready',
  dailyRewardStreakBadge: 'Day {n} Streak',
  dailyRewardCoinsLabel: '+{n} Coins',
  dailyRewardCoinsDesc: 'A sunlit pouch of coins for boosters or life refills',
  dailyRewardBoosterUndo: '+1 Undo Booster',
  dailyRewardBoosterShuffle: '+1 Shuffle Booster',
  dailyRewardBoosterFlask: '+1 Extra Crystal Flask',
  dailyRewardBoosterDesc: 'A lucky workshop booster ready for your next puzzle',
  dailyRewardClaimBtn: 'Claim Daily Gift',
  dailyRewardComeBackHint: 'Return tomorrow to grow your daily streak',

  // MetaViews — Map, Alembic, Event, Shop, Salons
  mapTitle: 'Solarium Map',
  mapSubtitle: 'Highest Unlocked: Level {n}',
  milestoneMystery: '? Mystery',
  milestoneCork: 'Cork',
  milestoneCrate: 'Crate',
  milestoneCurtain: 'Curtain',
  alembicTitle: 'Sun Alembic',
  alembicSubtitle: 'Distill level essences into puzzle boosters',
  collectedEssences: 'Collected Essences',
  brewBtn: 'Brew',
  eventTitle: 'Azure Gala',
  eventSubtitle: 'Timed Solstice Festival · Earn Stars & Rewards',
  milestoneTrack: 'Milestone Track',
  starsProgress: '{cur} / 100 Stars',
  claimedBadge: 'Claimed',
  claimBtn: 'Claim',
  festivalTrialsTitle: 'Festival Trials (Play Any Mechanic Immediately)',
  trialClearedTag: ' · Cleared ✓',
  trialStarReward: '+{n} Gala Stars',
  playTrialBtn: 'Play Trial',
  shopTitle: 'Solarium Boutique',
  shopSubtitle: 'Stock up on boosters or go Ad-Free',
  removeAdsTitle: 'Remove All Ads',
  removeAdsDesc: 'Zero forced interstitials between levels forever',
  ownedBadge: 'Owned',
  buyPriceLabel: '$4.99',
  shopUndoPack: 'Undo Pack (+3)',
  shopShufflePack: 'Shuffle Pack (+2)',
  shopFlaskPack: 'Extra Flask (+1)',
  shopOwnedCount: 'Owned: {n}',
  shopCoinsPrice: '{n} Coins',
  shopRefillLives: 'Full Lives Refill',
  shopCurrentLives: 'Current: {cur}/{max}',
  salonsTitle: 'Crystal Salons',
  salonsSubtitle: 'Co-op Teams & Life Sharing',
  comingSoonBadge: 'Coming Soon',
  salonsHeading: 'Crystal Salons Are Brewing',
  salonsDesc: 'Join a sunlit alchemy guild, send free lives to teammates, and compete in weekend Crystal Regattas. Launching in our upcoming social update.',
  returnToHomeBtn: 'Return to Home',
  coinsRewardShort: '+{n} Coins',
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

const BOTTLE_DESIGNS_ZH: Record<BottleStyleId, { title: string; tagline: string }> = {
  starlight: { title: '星光水晶瓶', tagline: '经典剔透折射 · 柔和暖阳高光' },
  royal_crown: { title: '皇家冠冕瓶', tagline: '圆润鎏金颈环 · 宫廷珍藏质感' },
  crystal_prism: { title: '棱镜切面瓶', tagline: '多面钻石切光 · 锐利晶莹反光' },
  botanical_brass: { title: '花房黄铜瓶', tagline: '复古炼金肩线 · 温润琥珀光泽' },
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
  bottleDesignText: (id: BottleStyleId, fallbackTitle: string, fallbackTagline: string) => {
    title: string;
    tagline: string;
  };
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
    bottleDesignText: (id, fallbackTitle, fallbackTagline) =>
      lang === 'zh' ? BOTTLE_DESIGNS_ZH[id] : { title: fallbackTitle, tagline: fallbackTagline },
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
  if (!ctx) return createI18nValue('zh');
  return ctx;
}
