# App Store Connect 填表清单（Potion Sort: Alchemy · 1.0）

> 主要语言 = 英语（美国）→ 下面英文版填进默认本地化；中文版填到「简体中文」本地化（Add Localization）。
>
> ⚠️ **本清单对应 2026-11-25 版游戏**：已移除限时速通系统、无广告、无内购。任何一栏都不要出现「倒计时 / Speed Bonus / Remove Ads / 内购」字样。

---

## 1. 产品页面预览和截图

入口：**分发 → iOS App 1.0 准备提交 → 产品页面信息 → App 预览和截屏** 标签（默认第一个）。3~10 张。

⚠️ 尺寸以 ASC 页面上写的为准。当前界面在「带灵动岛的 iPhone（中等显示屏）」分栏下接受：

```
App 预览：1920×886、886×1920
App 截屏：2556×1179、1179×2556、2622×1206、1206×2622
```

`1290×2796`（6.7/6.9 英寸老规格）不在列表里，拖进去会报尺寸无效。因此改用 **1206×2622**（402×874 逻辑尺寸 @3x，iPhone 16 Pro）：

```
桌面/PotionSort-上架截图-英文版-1206x2622/
  01-主界面.png     ← 首图（决定搜索结果里的缩略图，最重要）
  02-倒水玩法.png
  03-关卡地图.png
  04-每日签到.png
  05-商店.png
  06-成就画卷.png   ← 可选第 6 张，画面最丰满，建议保留
```

> **安全区处理（build 3 起）**：`pt/pb-[env(safe-area-inset-*)]` 已从 `App.tsx` 的 `main` 下移到各屏幕根节点（`TitleHomeScreen` / `GameplayScreen` / `SubViewShell`），背景因此铺满到屏幕边缘，只让内容内缩。build 2 及更早版本在顶部有一条 59pt 的纯 `#260B4E` 色带，build 3 已消除。
>
> 截图按 `safe-area-inset-top=59pt` / `bottom=34pt` 渲染，但没有绘制系统状态栏（时间/信号/电量）——真机上那 59pt 里是有内容的，所以不会显得空。App Store 不要求截图包含状态栏。
>
> 最少 3 张、最多 10 张即可提交，5~6 张是常见配置。

> 同为英文版的 `桌面/PotionSort-上架截图-英文版/`（1290×2796）保留作对照，不再用于上传。

> 中文版旧图在 `桌面/PotionSort-上架截图-真实版/`，仅作对照；商店主语言是英语（美国），上传英文版可避免「截图语言与列表语言不一致」的追问。

**这批图必须重新截**（2026-11-25）。原因是旧图与新版界面已经对不上：

| 旧图问题 | 后果 |
|---|---|
| `05-商店.png` 里有 `Remove All Ads Forever $4.99` 金色卡片 | 截图里有内购、后台却没建内购 → 审核 2.3.1 不一致，这是最容易被抓的一条 |
| `02-倒水玩法.png` 顶部有倒计时 / 目标时间 | 游戏里这个功能已被删除，属虚假展示 |
| 胜利页图（如有）带「速通奖励 +金币」卡片 | 同上 |
| 商店、玩法页布局本身也改过 | 与实物不符 |

⚠️ 也不要上传 `PotionSort-上架截图-AI插画版-不建议用` 那套（违反审核指南 2.3.3，画面必须展示 App 实际使用界面）。

---

## 2. 推广文本（Promotional Text，≤170 字符）

**English（136，安全余量）**
```
Pour shimmering potions with real ASMR audio — no timers, no move limits. 4 obstacle twists, a talking fox, and 6 cozy outcome artworks.
```

> ⚠️ 旧版本那条实际是 **171 字符**（原记的 164 数错了），会被 ASC 判定超限，已替换为上面这条 136 字符的版本。

**副标题（Subtitle，≤30 字符，必填）**
```
Cozy ASMR potion sort puzzle
```
（28 字符）

**简体中文（94 字）**
```
真实 ASMR 瓶口咕嘟音效，治愈系魔药分色解谜上线！没有倒计时也不限步数，挑战神秘色层、软木塞、彩锁箱与丝绒帘 4 大机关，戳戳狐狸和小龙听它们说话，收集 6 幅结算画卷！
```

---

## 3. 描述（Description，≤4000 字符）

**English**
```
Pour shimmering potions in a sunlit alchemist's conservatory.

Potion Sort: Alchemy is a cozy liquid-sorting puzzle with real ASMR pouring audio, luminous crystal flasks, and a fox alchemist plus his sky-dragon apprentice cheering every bottle you seal.

No timers. No move limits. Think as long as you like.

• 100% SOLVABLE, ALWAYS
Every campaign level is validated by our deterministic solver — no board requires boosters, no rigged dead ends.

• FOUR OBSTACLE MECHANICS
Mystery "?" layers hide the bottom color. Corked decanters only open for a matching pour. Color crates must be filled before they break. Velvet curtains conceal what you cannot see. Simple sorting becomes multi-step planning.

• TACTILE ASMR POURING
Real sampled bottle glugs, glass clinks, and a soft ambient score that shifts with your combo streak.

• MASCOTS THAT TALK BACK
Tap the fox and he cheers you on. Tap the dragon and it rumbles a battle cry. Their lines appear in hand-drawn cloud bubbles that fade on their own.

• WIN STREAKS
String clears together and your opening move pours itself: 1 step at streak 1, 2 steps at streak 2, plus a free Undo from streak 3 onward.

• COZY PROGRESSION
Distill essences at the Sun Alembic to craft your own Undo, Shuffle and Extra Flask boosters, check in on the 7-Day Login Calendar toward the Day 7 Jackpot, and unlock all 6 outcome artworks in the Achievement Codex.

• PLAY YOUR WAY
Color-symbol mode for color-vision deficiency, adjustable audio and haptics, English and 简体中文.

No account. No ads. No in-app purchases. No internet needed — play offline, anywhere.
```

**简体中文**
```
推开暖阳花房的木门，听一曲水晶与魔药的午后协奏。

《药水排序》是一款治愈系魔药分色解谜游戏：真实采样的 ASMR 瓶口咕嘟声、通透的水晶玻璃瓶，还有守着满墙药柜的狐狸炼金师与蓝翼小龙，为你的每一次封瓶鼓掌喝彩。

没有倒计时，也不限步数——想多久，就想多久。

• 100% 可解，从不设死局
所有主线关卡都经内置求解器逐关校验，不用道具也能纯脑力通关。

• 四大机关轮番登场
神秘「?」色层遮住底色；软木塞瓶只对同色液体让路；彩锁木箱必须先集满魔药才能破封；丝绒帘幕藏起你看不见的部分。简单倒水，变成多步先后序的精密规划。

• 触感 ASMR 倾倒
真实瓶口咕嘟声、清脆玻璃碰撞，配乐随连击层层叠加。

• 萌宠会说话
点一下狐狸，它会为你加油；敲一下小龙，它会吼一声战意十足的鼓励。台词装在云朵气泡里，浮现几秒便自行隐去。

• 日光连胜
连胜越多，开局自动倾倒的步数越多：1 连胜 1 步，2 连胜 2 步，3 连胜起再加 1 次免费撤回。

• 治愈系长线养成
在日光炼金台蒸馏精华自制撤销、洗牌与加瓶，每日打卡 7 日签到日历直取第 7 天宝箱，收集并全屏鉴赏 6 幅结算画卷。

• 按自己的方式玩
色弱玩家可开启「色彩符号」，音效与震动可分别调节，支持简体中文与 English。

无需账号，无广告，无内购，无需联网——随时随地离线畅玩。
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
| 技术支持网址（必填） | `https://1add2gamestudio.github.io/Potion-Sort/support.html` | ✅ 已上线 |
| 隐私政策网址（必填） | `https://1add2gamestudio.github.io/Potion-Sort/privacy.html` | ✅ 已上线 |
| 营销网址（选填） | `https://1add2gamestudio.github.io/Potion-Sort/` 或留空 | 可空 |

已部署完成（GitHub Pages，发布源为仓库 `docs/` 目录，2026-11-25 验证三个地址均返回 200）：

- 落地页 `https://1add2gamestudio.github.io/Potion-Sort/`
- 联系方式已统一为 `john99ftvn@gmail.com`，全站 0 处占位符

**以后要改这两页内容**：编辑 `_marketing_assets/appstore_pages/*.html` → 复制到 `docs/` → 推送，约 1 分钟生效。
（`docs/` 下不要放以下划线开头的目录，GitHub Pages 会跳过。）

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

依据：本版本无广告 SDK、无统计 SDK、无账号、无内购、无网络上传，进度只存设备本地。已核查 `package.json` 依赖（仅 `@capacitor/app`、`@capacitor/haptics`、`@capacitor/ios`）与源码，确认没有 AdMob / Firebase / 任何追踪库。

⚠️ 以后一旦接入真实广告或统计 SDK，这一栏必须重填，否则会被判「隐私披露不实」下架。

---

## 9. 构建版本

当前是空的，需要先上传。

**① 先确认 Xcode 登录了开发者账号**

```
Xcode → Settings（⌘,）→ Accounts → 左下角 + → 添加 Apple ID
```

必须是**付费的开发者账号**（你那个 Team `6J48WYSF8N`）。没登录账号的情况下去 Archive，导出 App Store 版本时会卡在「找不到分发描述文件」。

**② 再 Archive 上传**

```
Xcode → 顶部设备选 Any iOS Device (arm64)
     → Product → Archive
     → Organizer 弹窗 → Distribute App
     → App Store Connect → Upload
     → 一路 Next，签名用默认
```

上传后等 5~40 分钟，回到这一页点「添加构建版本」即可选中。

**③ 签名：上传前必须补齐「分发」凭据（否则必失败）**

工程当前是手动签名，且本机只装了一个**开发型**描述文件：

```
CODE_SIGN_STYLE = Manual
PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*] = "PotionSort Dev"   ← Development 类型，绑了 3 台测试机
DEVELOPMENT_TEAM[sdk=iphoneos*] = 6J48WYSF8N
```

开发型描述文件打出来的包 Apple **不收**，上传会报：
`Invalid Provisioning Profile. The provisioning profile included in the bundle is invalid for App Store submission.`

这就是「⌘R 装机一直正常、但一上架就失败」的根源——装机用开发证书就够，上架需要分发证书 + App Store 描述文件，本机一个都没有。

**做法 A（推荐）：改成自动签名**
```
Xcode → 左侧点蓝色 App 工程 → TARGETS: App
     → Signing & Capabilities → 勾 Automatically manage signing
     → Team 选 6J48WYSF8N（本机只有这一个团队）
```
Xcode 会自动申请 Apple Distribution 证书和 App Store 描述文件。**不会影响 ⌘R 装机**（它同时维护开发凭据），以后描述文件到期也会自动续。

改完 `project.pbxproj` 里那三行会被重写，这是正常的，不需要手工还原。

**做法 B（保留手动签名，不推荐）**
去 `developer.apple.com → Certificates, Identifiers & Profiles → Profiles → +` 新建一个 **App Store** 类型、Bundle ID 选 `com.potionsort.puzzle` 的描述文件，下载后双击安装，再在 `Build Settings → Provisioning Profile` 里指定它。

改完签名配置后，之前打的所有 Archive 都作废，必须重新 Archive。

---

## 9.1 代码变更记录（Archive 前核对）

> ⚠️ **2026-11-25 最新提交 `b898495`（"refactor: remove unused level failure tracking"）**
>
> 名字写的是重构，实际改动了**结算画卷的解锁规则**，属于审核员看得见的变化：
> - 胜利画卷改为：一阶＝通关任意关卡；二阶＝2 连胜；三阶＝3 连胜或通关任意试炼。**不再与关卡难度挂钩**
> - 战败画卷改为：按**历史累计战败次数**判断（第 1 / 2 / 3 次）。**不再与同关失败次数、完成度、连胜中断挂钩**
> - 6 幅画卷的解锁奖励统一为 **20 金币**（原为 30/60/120/20/40/80）
> - 图鉴里的解锁条件说明文字已同步重写（`cgTriggerV1~V3` / `cgTriggerD1~D3`）
> - 存档新增 `totalDefeats` 字段，老存档自动按已解锁的战败画卷数推算，不会丢进度
>
> 上一版 `45fd88a` 的变化（试炼免体力、空瓶上限 3、体力弹窗后移、iOS 音频解锁、地图里程碑移至第 2 关）依旧有效。
> **两版都在这台机器上没打过包，Archive 必须重做。**

---

<details>
<summary>历史记录：45fd88a</summary>

> **2026-11-25 提交 `45fd88a`（"implement haptics and app lifecycle"）**
>
> 该提交除修 bug 外，还包括这些**审核员能感知到**的变化：
> - 庆典试炼（Festival Trials）改为**不消耗体力、不影响主线连胜**，暂停页新增对应提示
> - 连续使用额外空瓶复活的上限从 2 只提高到 **3 只**，达上限后按钮显示「架子空瓶已达上限」
> - **体力耗尽不再在结算页弹窗**，改为下次点关卡时提示（流程更顺，不影响内容可达性）
> - 修复 iOS 首次点击无法出声的问题（`unlockAudioForGesture`，WKWebView 必须在手势内同步解锁 AudioContext）
> - 连胜自动倾倒改为仅在开局、玩家尚未操作时执行，且不会把局面直接走完
> - 关卡地图「神秘加码」里程碑从第 4 关移到**第 2 关**
>
</details>
> 更早打的 Archive 全部作废，必须重新 Archive、重新上传。

---

## 10. App 审核信息（审核员唯一会读的文字，重点）

| 字段 | 填什么 |
|---|---|
| 登录信息 | **不勾「需要登录」**，账号密码两个框留空 |
| 联系电话 / 邮箱 | 填你的真实手机号与常用邮箱（苹果可能来电确认） |
| 附件 | 不用传 |
| 备注（Notes） | 见下方整段，直接复制 |

**审核备注（English，直接粘进 Notes）**
```
No account, no login, no server required. This is a fully offline single-player puzzle game.

HOW TO PLAY
Tap a flask to select it, then tap another flask to pour. A pour is only allowed when the colors match or the destination is empty. Fill a flask with 4 layers of the same color to seal it. Clear every color to finish the level.

WHAT TESTERS WILL SEE
- No advertising of any kind. No ad SDK is integrated.
- No in-app purchases and no real-money transactions. All boosters are bought with in-game coins or crafted from essences earned by clearing levels.
- No countdown timer and no move limit on any level. Levels cannot be failed by running out of time.
- Lives are only spent when you retry a level. They refill automatically over time, and can also be refilled with in-game coins — never with real money. Festival Trials cost no lives at all. Running low on lives never locks any content.
- All content is reachable by normal play. Nothing is gated behind payment or login.

Localization: English and Simplified Chinese are both fully translated; the in-game settings menu switches languages live. The app launches in English by default, and all App Store screenshots were captured from the English UI of this build.

If anything is unclear during review, please contact us at the email above and we will respond within 24 hours.
```

**审核备注（简体中文，备用）**
```
无需账号、无需登录、无需服务器，这是一款完全离线的单机解谜游戏。

玩法说明
点选一只瓶子，再点另一只即可倒液；仅当颜色相同或目标瓶为空时才可倾倒。同一瓶集满 4 层同色即封口，清空全部颜色即通关。

审核员会看到的
- 无任何广告，未集成任何广告 SDK。
- 无内购、无真实货币交易；所有道具都用游戏内金币购买，或用通关获得的精华在炼金台自制。
- 所有关卡均无倒计时、无步数上限，不会因超时而失败。
- 体力仅在重试关卡时消耗，会随时间自动恢复，也可用游戏内金币补充，全程不涉及真实货币；庆典试炼完全不消耗体力，体力不足也不会锁死任何内容。
- 全部内容可通过正常游玩解锁，没有任何内容被付费或登录阻挡。

本地化：英文与简体中文均为完整翻译，可在游戏内设置中实时切换。
```

> 这段备注的作用：主动把「没有的东西」讲清楚，审核员就不会因为找不到广告/内购而怀疑功能缺失，也不会误判 2.2（Placeholder Content）。

---

## 11. 版本发布

选 **「手动发布」**。审核通过后你自己点上线，可控。选自动的话过审即上架，万一临时想改就没机会了。

---

## 12. 内购（In-App Purchases）—— 首发版：一个都不要建

**已确认：首发只上游戏本体，不提交内购。**

| 位置 | 操作 |
|---|---|
| App Store Connect → 你的 App → 「App 内购买项目」 | **不要新建任何项目**。如果之前已经建了 `Remove All Ads`，把状态留在「准备提交」但**不要选中加到本版本**，或者直接删除 |
| App Store Connect → 版本页面 → 「App 内购买项目」区块 | 保持**空**，不勾任何项目 |

代码侧同步改完（`src/game/adService.ts` 里 `MONETIZATION_ENABLED = false`），审核员玩到的版本里：

- ❌ 没有「$4.99 / ¥30 去广告」的按钮（商店、设置、首页徽章、胜利页全部隐藏）
- ❌ 没有强制插屏广告
- ❌ 没有「看广告得双倍金币 / 看广告复活 / 看广告补命」这类假广告按钮
- ✅ 关卡、道具、金币、签到、图鉴、成就、连胜、炼金台、庆典试炼全部正常，游戏本体完整

这样同时规避三个风险：2.3.1（IAP 描述与实际不符）、2.2（占位/假功能）、3.1.1（应用内解锁必须走 Apple 支付）。

**将来要接真实广告 + 内购时**：把 `MONETIZATION_ENABLED` 改回 `true`，接 AdMob 之类真 SDK，在后台建好内购项目，并同步把「App 隐私」改成「收集数据」+ 加 ATT 授权弹窗。改一个开关即可恢复，UI 都还在。

### 12.1 接广告那一版，后台必须同步改这 5 处（漏一处就是「披露不实」）

| # | 位置 | 现在（1.0 首发） | 接广告后必须改成 |
|---|---|---|---|
| 1 | App 信息 → 年龄分级 → 功能 → **广告** | 否 | **是**（4+ 允许含广告，不会提高分级，但必须声明） |
| 2 | App 隐私 → 数据收集 | 否，不收集数据 | **是**，勾选「设备 ID」「使用数据」「广告数据」等实际项 |
| 3 | 工程 Info.plist | 无 | 加 `NSUserTrackingUsageDescription`，首启弹 ATT 授权 |
| 4 | 版本页 → 描述 / 推广文本 | 「No ads. No in-app purchases.」 | 删掉这两句，改为如实描述 |
| 5 | 审核备注 | 「No advertising of any kind.」 | 整段重写，说明广告形式与关闭方式 |

> 最容易被抓的是第 4 条：描述里写着 “No ads” 但装了广告 SDK，属于 2.3.1 元数据不实，直接拒并可能连带旧版本下架。

---

## 附：上架前 5 项自检

```
□ 5 张截图已按新版界面重截，商店图里没有任何内购卡片
□ 03-关卡地图.png 已重拍（「神秘加码」标签现在挂第 2 关，旧图挂在第 4 关）
□ Xcode 已登录付费开发者账号（Team 6J48WYSF8N）
□ 签名已改为 Automatically manage signing（或已手动安装 App Store 类型描述文件）
☑ privacy.html / support.html 已换成 john99ftvn@gmail.com 并部署到 GitHub Pages（两个地址均 200）
□ 重新 Archive 并上传了一个构建版本（build 号未与历史重复）
□ 后台「App 内购买项目」保持为空
```
