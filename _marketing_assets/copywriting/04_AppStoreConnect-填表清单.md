# App Store Connect 填表清单（Potion Sort: Alchemy · 1.0）

> 主要语言 = 英语（美国）→ 下面英文版填进默认本地化；中文版填到「简体中文」本地化（Add Localization）。

---

## 1. 产品页面预览和截图

只上传到 **6.9 英寸显示屏** 那一栏，3~10 张。其他尺寸栏位留空即可，苹果会自动缩放。

按顺序拖：

```
桌面/PotionSort-上架截图-真实版/
  01-主界面.png     ← 首图（决定搜索结果里的缩略图，最重要）
  02-倒水玩法.png
  03-关卡地图.png
  04-每日签到.png
  05-商店.png
```

⚠️ 不要上传 `PotionSort-上架截图-AI插画版-不建议用` 里那套（违反审核指南 2.3.3，画面必须展示 App 实际使用界面）。

---

## 2. 推广文本（Promotional Text，≤170 字符）

**English（156）**
```
Pour shimmering potions with real ASMR audio! Beat 4 obstacle twists, brew your own boosters, mark off the 7-Day Login Calendar & collect 6 cozy outcome CGs.
```

**简体中文（92 字）**
```
真实 ASMR 瓶口咕嘟音效，治愈系魔药分色解谜上线！挑战神秘色层、软木塞、彩锁箱与丝绒帘 4 大机关，打卡 7 日签到日历赢终极宝箱，收集 6 幅狐狸与小龙动态结算画卷！
```

---

## 3. 描述（Description，≤4000 字符）

**English**
```
Pour shimmering potions in a sunlit alchemist's conservatory.

Potion Sort: Alchemy is a cozy liquid-sorting puzzle with real ASMR pouring audio, luminous crystal flasks, and a fox alchemist plus his sky-dragon apprentice cheering every bottle you seal.

• 100% SOLVABLE, ALWAYS
Every campaign level is validated by our deterministic solver — no board requires boosters, no rigged dead ends.

• FOUR OBSTACLE MECHANICS
Mystery "?" layers hide the bottom color. Corked decanters only open for a matching pour. Color crates must be filled before they break. Velvet curtains conceal what you cannot see. Simple sorting becomes multi-step planning.

• TACTILE ASMR POURING
Real sampled bottle glugs, glass clinks, and a soft ambient score that shifts with your combo streak.

• SPEED BONUS & WIN STREAKS
Beat each level's countdown for extra coins, and stack a Solstice Win Streak for starting perks.

• COZY PROGRESSION
Distill essences at the Sun Alembic to craft your own boosters, check in on the 7-Day Login Calendar toward the Day 7 Jackpot, and unlock all 6 animated outcome artworks in the Achievement Codex.

• PLAY YOUR WAY
Color-symbol mode for color-vision deficiency, adjustable audio and haptics, English and 简体中文.

No account. No internet needed. Play offline, anywhere.
```

**简体中文**
```
推开暖阳花房的木门，听一曲水晶与魔药的午后协奏。

《药水排序》是一款治愈系魔药分色解谜游戏：真实采样的 ASMR 瓶口咕嘟声、通透的水晶玻璃瓶，还有守着满墙药柜的狐狸炼金师与蓝翼小龙，为你的每一次封瓶鼓掌喝彩。

• 100% 可解，从不设死局
所有主线关卡都经内置求解器逐关校验，不用道具也能纯脑力通关。

• 四大机关轮番登场
神秘「?」色层遮住底色；软木塞瓶只对同色液体让路；彩锁木箱必须先集满魔药才能破封；丝绒帘幕藏起你看不见的部分。简单倒水，变成多步先后序的精密规划。

• 触感 ASMR 倾倒
真实瓶口咕嘟声、清脆玻璃碰撞，配乐随连击层层叠加。

• 限时速通与连胜
在倒计时内封瓶拿额外金币，累积连胜解锁开局增益。

• 治愈系长线养成
在日光炼金台蒸馏精华自制道具，每日打卡 7 日签到日历直取第 7 天宝箱，收集并全屏鉴赏 6 幅动态结算画卷。

• 按自己的方式玩
色弱玩家可开启「色彩符号」，音效与震动可分别调节，支持简体中文与 English。

无需账号，无需联网，随时随地离线畅玩。
```

---

## 4. 关键词（Keywords，≤100 字符，英文逗号，不要空格）

**English（98）**
```
water sort,potion puzzle,color sort,liquid sort,asmr,relaxing,brain teaser,cozy game,alchemy,flask
```

**简体中文（95）**
```
倒水游戏,魔药分色,颜色排序,解压游戏,ASMR,休闲解谜,脑力益智,炼金工坊,治愈画风,单机益智,水排序,连胜挑战,图鉴收集,颜色分类
```

---

## 5. 三个网址

| 字段 | 填什么 | 状态 |
|---|---|---|
| 技术支持网址（必填） | 部署后的 `support.html` 地址 | ⬜ 待部署 |
| 隐私政策网址（必填） | 部署后的 `privacy.html` 地址 | ⬜ 待部署 |
| 营销网址（选填） | 可留空，或填官网 | 可空 |

页面已生成在：
```
~/Projects/GameSource/Typescript/Potion-Sort/_marketing_assets/appstore_pages/
  privacy.html
  support.html
```
里面有 `YOUR_EMAIL_HERE` 占位符，**必须换成你的真实邮箱**（Apple 会人工点开看，留占位符会被拒）。

---

## 6. 版权（Copyright）

```
2026 1add2gamestudio
```

（不写 ©，苹果会自动加年份前缀；写公司名或个人名均可，不用和开发者账号名一致。）

---

## 7. 年龄分级

填问卷，全部选「无 / 否」，结果 **4+**。

---

## 8. App 隐私

选 **「不收集数据」（Data Not Collected）**。

依据：本版本无广告 SDK、无统计 SDK、无账号、无网络上传，进度只存设备本地。已核查 `package.json` 依赖与源码，确认没有 AdMob / Firebase / 任何追踪库。

⚠️ 以后一旦接入真实广告或统计 SDK，这一栏必须重填，否则会被判「隐私披露不实」下架。

---

## 9. 构建版本

当前是空的，需要先上传：

```
Xcode → Product → Archive
  → Organizer → Distribute App
  → App Store Connect → Upload
```

上传后等 5~40 分钟，回到这一页点「添加构建版本」即可选中。

✅ 这条路用**自动签名是正确的**（App Store 分发不需要设备名单），不会踩你之前那个 `0xe8008012` 的坑。

> ⚠️ **2026-11-24 改过代码（撤掉假广告与内购入口），之前打的 Archive 已经作废，必须重新 Archive 一次再上传。**

---

## 10. App 审核信息

| 字段 | 填什么 |
|---|---|
| 登录信息 | **不勾「需要登录」**，两个框留空 |
| 备注 | `No account or login required. This is an offline single-player puzzle game. All content is unlocked by playing; no server or test credentials needed.` |
| 附件 | 不用传 |

---

## 11. 版本发布

选 **「手动发布」**。审核通过后你自己点上线，可控。选自动的话过审即上架，万一临时想改就没机会了。

---

## 12. 内购（In-App Purchases）—— 首发版：一个都不要建

**你已确认：首发只上游戏本体，不提交内购。**

具体做法：

| 位置 | 操作 |
|---|---|
| App Store Connect → 你的 App → 「App 内购买项目」 | **不要新建任何项目**。如果之前已经建了 `Remove All Ads`，把状态留在「准备提交」但**不要选中加到本版本**，或者直接删除 |
| App Store Connect → 版本页面 → 「App 内购买项目」区块 | 保持**空**，不勾任何项目 |

代码侧已经同步改完（`src/game/adService.ts` 里 `MONETIZATION_ENABLED = false`），所以审核员玩到的版本里：

- ❌ 没有「$4.99 / ¥30 去广告」的按钮（商店、设置、首页徽章、胜利页、广告页全部隐藏）
- ❌ 没有强制插屏广告（不会出现「2 秒后跳过」的模拟广告画面）
- ❌ 没有「看广告得双倍金币 / 看广告复活 / 看广告补命」这类假广告按钮
- ✅ 关卡、道具、金币、签到、图鉴、成就全部正常，游戏本身就是完整的一款解谜游戏

这样同时规避了三个风险：2.3.1（IAP 描述与实际不符）、2.2（占位/假功能）、3.1.1（应用内解锁必须走 Apple 支付）。

**将来要接真实广告 + 内购时**：把 `MONETIZATION_ENABLED` 改回 `true`，接 AdMob 之类真 SDK，在后台建好内购项目，并同步把「App 隐私」改成「收集数据」+ 加 ATT 授权弹窗。改一个开关即可全部恢复，UI 和文案都还在。

