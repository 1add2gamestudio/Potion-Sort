# Solstice Sort（日光炼金瓶）项目资产与机制扫描清单

> 扫描基准：当前项目根目录真实代码逻辑、配置数据与静态美术/音效资产（已完整镜像备份至 `_marketing_assets/raw_assets/` 以保证营销包独立可移植）。

---

## 一、 核心游戏档案（扫描自代码与配置）

| 维度 | 真实项目设定 |
| :--- | :--- |
| **游戏名称** | **Solstice Sort**（中文名：**日光炼金瓶** · 副标：Sunlit Crystal Sorting Puzzle / 暖阳花房工坊） |
| **核心品类** | 竖屏治愈系魔药分色解谜（Casual Liquid-Sorting Puzzle） |
| **默认语言** | 英文（`en`）默认，内置完整中英双语切换（`en` / `zh`） |
| **主视觉色盘** | 皇家紫金（`#6B2DE0` / `#FFE875`）+ 暖阳奶油木纹（`#FFF6DF` / `#783A09`）+ 7 色高饱和魔药（Ruby Berry 红、Neon Lime 绿、Solar Gold 金、Cobalt Splash 蓝、Royal Grape 紫、Bubblegum Pink 粉、Aqua Mint 青） |
| **核心关卡机制** | 1. 确定性 100% 无道具可解引擎（内置 BFS/DFS 求解器校验前 30+ 关）<br>2. **黄金锯齿难度曲线（Golden Wave Sawtooth）**：L1 2色教学 → L2 5色急升 → L3 4色缓冲 → L5 困难峰 → L10 7色超难 Boss 关，L16+ 5关循环波浪节奏<br>3. **四大递增障碍机制**：神秘「?」隐藏色层（L4）、软木塞封口瓶 Cork（L6）、彩锁木箱 Crate（L10）、丝绒帘幕瓶 Curtain（L14）<br>4. **限时速通计时器（Speed Bonus）**：在目标时间内通关额外获得积分与金币奖励 |
| **角色与伴随演出** | **狐狸炼金师（Fox Alchemist）** + **蓝翼小龙（Sky Dragon）**：端坐于药柜顶部的双吉祥物，含待机呼吸与封瓶鼓掌双状态，伴随气泡台词互动 |
| **局外成长与商业化** | 1. **6 幅阶梯式结算 CG 与成就图鉴**：胜利 1~3 阶 + 战败 1~3 阶（支持全屏鉴赏与金币奖励一键领取）<br>2. **7 日可视化签到日历**：前 6 日金币/道具交替，第 7 日超级大礼（+200 金币 + 1 额外空瓶 + 1 撤回）<br>3. **日光炼金台（Sun Alembic）**：通关收集 4 种精华（柑橘/魔晶/晨露/星雾）蒸馏局内道具<br>4. **极光庆典（Azure Gala）**：100 星光里程碑轨道 + 4 个特色机制试炼关随时体验<br>5. **连胜祝福（Solstice Streak）**：1~3+ 连胜开局赠送额外撤回/自动封瓶/双倍金币增益<br>6. **双轨商业化**：纯净「永久去广告（$4.99 / ¥30）」屏蔽强制插屏 + 可选激励短片（双倍金币 / +1 空瓶继续 / +1 体力） |

---

## 二、 关键视觉与音频资源清单（共 50 个真实资产）

### 1. 主视觉与角色高清原画（4 张）
- `_marketing_assets/raw_assets/images/solstice_home_3d_scene_1794980022597.jpg`（`768×1376`）— 主界面暖阳花房工坊 3D 主视觉（狐狸炼金师 + 蓝翼小龙 + 紫色魔药大釜）
- `_marketing_assets/raw_assets/images/stage_c_fullwidth_1794988696753.jpg`（`768×1376`）— 局内实木炼金药柜货架场景
- `_marketing_assets/raw_assets/images/solstice_mascot_avatar_1794980022747.jpg`（`1024×1024`）— 狐狸炼金师高清角色头像
- `_marketing_assets/raw_assets/images/solstice_dragon_avatar_1794985798351.jpg`（`1024×1024`）— 蓝翼小龙高清角色头像

### 2. 6 幅渐进式结算 CG 画卷（`800×600`）
- `_marketing_assets/raw_assets/cg/victory-tier-1.jpg` — 胜利一阶：初酿微光（Tier I · Warm Brew）
- `_marketing_assets/raw_assets/cg/victory-tier-2.jpg` — 胜利二阶：双星共鸣（Tier II · Radiant Streak）
- `_marketing_assets/raw_assets/cg/victory-tier-3.jpg` — 胜利三阶：日光圣典（Tier III · Solstice Finale）
- `_marketing_assets/raw_assets/cg/defeat-tier-1.jpg` — 战败一阶：差一点点（Tier I · Gentle Puff）
- `_marketing_assets/raw_assets/cg/defeat-tier-2.jpg` — 战败二阶：泡泡满屋（Tier II · Bubble Overflow）
- `_marketing_assets/raw_assets/cg/defeat-tier-3.jpg` — 战败三阶：炭黑再起（Tier III · Sooty Rally）

### 3. 透明抠图双吉祥物立绘（4 张）
- `_marketing_assets/raw_assets/mascots/fox_idle.png`（`240×315`）& `fox_clap.png`（`240×273`）
- `_marketing_assets/raw_assets/mascots/dragon_idle.png`（`240×294`）& `dragon_clap.png`（`240×289`）

### 4. 3D 质感 UI 图标与九宫格面板（35 张）
- 核心道具与系统图标：`icon-coin.png`、`icon-heart.png`、`icon-undo.png`、`icon-shuffle.png`、`icon-flask.png`、`icon-cauldron.png`、`icon-trophy.png`、`icon-map.png`、`icon-shop.png`、`icon-castle.png`、`icon-streak-flame.png`、`icon-shield.png`、`icon-gear.png`、`icon-lock.png`、`icon-check.png` 等。
- 九宫格按钮与面板：`btn-green-wide.png`、`btn-blue-wide.png`、`btn-purple-wide.png`、`btn-amber.png`、`panel-gold-frame.png`、`panel-purple-frame.png`、`panel-cream-card.png`、`pill-cream.png`。

### 5. ASMR 真实音效资产（1 个）
- `_marketing_assets/raw_assets/sounds/asmr_bottle_glug.mp3` — 真实魔药水晶瓶倾倒“咕嘟” ASMR 音效（配合游戏内 Web Audio 合成玻璃清脆碰击声与大调和弦）。
