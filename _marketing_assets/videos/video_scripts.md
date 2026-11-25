# 《药水排序 Potion Sort》宣传视频分镜脚本与剪辑表（5 套）

> **说明**：
> - 所有视频均基于项目已有真实美术资产（3D 场景原画、6 张胜利/翻车 CG、萌宠立绘、3D UI 图标）与真实实录音效 `../raw_assets/sounds/asmr_bottle_glug.mp3` 合成，**无需运行游戏实机录屏**。
> - 规格统一采用 `720×1280`（9:16 竖屏高清，25fps，H.264 + AAC 立体声），兼顾 App Store 竖屏预览（15–30s 审核标准）、抖音 / 小红书短视频、YouTube Shorts 与官网内嵌预览。
> - 配套自动化脚本 `generate_videos.py` 可直接通过 FFmpeg + ImageMagick 一键渲染全部 5 支带 Ken Burns 动态运镜、转场淡变、标题字幕卡与混音的成品 `.mp4` 至 `_marketing_assets/videos/output/`。

---

## 视频总览

| 编号 | 文件名 | 时长 | 定位与适用场景 | 运镜与节奏风格 |
|---|---|---|---|---|
| 01 | `video_01_concept_pv.mp4` | 24s | **概念宣传片 PV**（官网 Hero 预览 + App Store 首位预览） | 温柔治愈起调 → 中段轻快展播 → 高光定格 |
| 02 | `video_02_gameplay_obstacles.mp4` | 22s | **核心玩法与四大机关演示**（App Store 玩法向 / TapTap 推荐） | 节奏明快、机关递进、三大道具兜底 |
| 03 | `video_03_companions_cgs.mp4` | 20s | **双萌宠与六阶 CG 图鉴秀**（小红书 / B 站 / IG 种草） | 角色特写推进 + 胜败三阶反差萌剪辑 |
| 04 | `video_04_speed_streak_alembic.mp4` | 18s | **极速速通、连胜与炼金台爽点集锦**（信息流买量 / 短视频） | 强目标感、金币与火焰高燃正反馈 |
| 05 | `video_05_launch_teaser.mp4` | 15s | **七日签到与上线倒计时预告**（上线预热 / 预约卡片） | 15 秒黄金短钩子、强 CTA 引导预约 |

---

## 视频 01：概念宣传片 PV（`video_01_concept_pv.mp4` · 24 秒）

- **音频设计**：温暖大调竖琴和弦铺底（C–G–Am–F 渐进），在第 2s、8s、14s、19s 精准叠入真实魔药倾倒音效 `asmr_bottle_glug.mp3`。

| 镜号 | 时间轴 | 时长 | 调用素材（相对 `raw_assets/`） | 运镜方式 | 画面主/副字幕（EN / ZH） | 音效节点 |
|---|---|---|---|---|---|---|
| S1 | 00:00–00:04 | 4s | `images/solstice_home_3d_scene_1794980022597.jpg` + `mascots/fox_idle.png` | 缓慢推近（Zoom In 1.00→1.10） | `POTION SORT` / `欢迎来到日光温室炼金工坊` | 温暖和弦渐入 + 02s 倒水咕嘟声 |
| S2 | 00:04–00:08 | 4s | `images/stage_c_fullwidth_1794988696753.jpg` + `ui/icon-flask.png` | 缓慢拉远（Zoom Out 1.12→1.02） | `SILKY ASMR POURS` / `丝滑分色倾倒，清脆琉璃轻碰` | 06s 玻璃清脆音 |
| S3 | 00:08–00:12 | 4s | `cg/victory-tier-1.jpg` + `mascots/dragon_clap.png` | 向右缓慢摇移（Pan Right） | `COZY 3D ALCHEMY` / `狐狸炼金师与蓝翼幼龙全程相伴` | 08s 魔药倾倒声 |
| S4 | 00:12–00:16 | 4s | `cg/victory-tier-2.jpg` + `ui/icon-cauldron.png` | 居中轻推（Zoom In 1.00→1.10） | `4 CLEVER OBSTACLES` / `盲盒木塞木箱帘幕，百关严谨可解` | 14s 倒水咕嘟声 |
| S5 | 00:16–00:20 | 4s | `cg/victory-tier-3.jpg` + `ui/icon-trophy.png` | 缓慢拉远展示全画幅（Zoom Out） | `COLLECT 6 CG CARDS` / `解锁胜利与爆笑翻车双系图鉴` | 19s 高潮倒水音 |
| S6 | 00:20–00:24 | 4s | `images/solstice_home_3d_scene_1794980022597.jpg` + `mascots/fox_clap.png` + `mascots/dragon_clap.png` | 稳态微推定版（Slow Push） | `DOWNLOAD ON APP STORE` / `药水排序 · 开启你的阳光魔药时光` | 尾音渐弱收束 |

---

## 视频 02：核心玩法与四大机关演示（`video_02_gameplay_obstacles.mp4` · 22 秒）

- **音频设计**：明快跃动音律铺底，每个机关切换节点叠入 `asmr_bottle_glug.mp3` 强化操作反馈感。

| 镜号 | 时间轴 | 时长 | 调用素材（相对 `raw_assets/`） | 运镜方式 | 画面主/副字幕（EN / ZH） | 音效节点 |
|---|---|---|---|---|---|---|
| S1 | 00:00–00:04 | 4s | `images/stage_c_fullwidth_1794988696753.jpg` + `ui/icon-flask.png` | 推近聚焦 | `TAP, POUR & SORT` / `一指轻点，同色魔药丝滑归瓶` | 01s 倒水声 |
| S2 | 00:04–00:08 | 4s | `cg/defeat-tier-1.jpg` + `ui/icon-lock.png` | 轻微晃动+推近 | `MYSTERY (?) & CORKS` / `Lv6 盲盒迷雾 · Lv10 木塞封口` | 05s 倒水声 |
| S3 | 00:08–00:12 | 4s | `cg/defeat-tier-2.jpg` + `ui/icon-shuffle.png` | 向左摇移 | `CRATES & VEILS` / `Lv16 密封木箱 · Lv22 炼金帘幕` | 09s 倒水声 |
| S4 | 00:12–00:16 | 4s | `cg/victory-tier-2.jpg` + `ui/icon-undo.png` | 缓慢拉远 | `3 TACTICAL BOOSTERS` / `撤回 · 洗牌 · 临时加瓶，绝境秒翻盘` | 13s 倒水声 |
| S5 | 00:16–00:22 | 6s | `images/solstice_home_3d_scene_1794980022597.jpg` + `mascots/fox_clap.png` | 舒缓推近定版 | `ALWAYS SOLVABLE` / `波浪难度曲线，越玩越上头` | 18s 倒水收尾 |

---

## 视频 03：双萌宠与六阶 CG 图鉴秀（`video_03_companions_cgs.mp4` · 20 秒）

- **音频设计**：灵动童话旋律 + 胜败切换轻快音效节拍。

| 镜号 | 时间轴 | 时长 | 调用素材（相对 `raw_assets/`） | 运镜方式 | 画面主/副字幕（EN / ZH） | 音效节点 |
|---|---|---|---|---|---|---|
| S1 | 00:00–00:04 | 4s | `images/solstice_mascot_avatar_1794980022747.jpg` + `mascots/fox_clap.png` | 特写缓慢推近 | `MEET FOX ALCHEMIST` / `工坊主理人：优雅的阳光酿造师` | 01s 倒水声 |
| S2 | 00:04–00:08 | 4s | `images/solstice_dragon_avatar_1794985798351.jpg` + `mascots/dragon_clap.png` | 特写缓慢拉远 | `MEET SKY DRAGON` / `控火小学徒：赢了拍翅、输了抱头` | 05s 倒水声 |
| S3 | 00:08–00:12 | 4s | `cg/victory-tier-3.jpg` + `ui/icon-trophy.png` | 右移展示星辉细节 | `3 VICTORY CG TIERS` / `初酿微光 → 琉璃华彩 → 星辉圣酿` | 09s 倒水声 |
| S4 | 00:12–00:16 | 4s | `cg/defeat-tier-3.jpg` + `ui/icon-cauldron.png` | 快速微推喜剧张力 | `3 HILARIOUS MISHAPS` / `连炸炉翻车也能解锁爆笑 CG 与金币！` | 13s 倒水声 |
| S5 | 00:16–00:20 | 4s | `cg/victory-tier-1.jpg` + `mascots/fox_idle.png` | 稳定微推定版 | `FILL YOUR CODEX` / `点亮全六阶成就图鉴，领丰厚奖励` | 柔和渐弱 |

---

## 视频 04：极速速通、连胜与炼金台爽点集锦（`video_04_speed_streak_alembic.mp4` · 18 秒）

- **音频设计**：高能节奏感音律 + 连续清脆倒水音节拍。

| 镜号 | 时间轴 | 时长 | 调用素材（相对 `raw_assets/`） | 运镜方式 | 画面主/副字幕（EN / ZH） | 音效节点 |
|---|---|---|---|---|---|---|
| S1 | 00:00–00:04.5 | 4.5s | `images/stage_c_fullwidth_1794988696753.jpg` + `ui/icon-coin.png` | 动感推近 | `BEAT 60 SECONDS` / `极速通关立奖 +25 额外金币！` | 01s 倒水声 |
| S2 | 00:04.5–00:09 | 4.5s | `cg/victory-tier-2.jpg` + `ui/icon-streak-flame.png` | 左移+微推 | `IGNITE WIN STREAKS` / `3/5/8 连胜开局白嫖免费道具` | 05s 倒水声 |
| S3 | 00:09–00:13.5 | 4.5s | `cg/victory-tier-3.jpg` + `ui/icon-cauldron.png` | 居中推近 | `SUN ALEMBIC CRAFT` / `通关攒精粹，坩埚免费炼神助` | 10s 倒水声 |
| S4 | 00:13.5–00:18 | 4.5s | `images/solstice_home_3d_scene_1794980022597.jpg` + `ui/icon-shield.png` | 稳态定格 | `PURE AD-FREE OPTION` / `连胜护盾 + 一键去广告，畅玩无阻` | 15s 尾音收束 |

---

## 视频 05：七日签到与上线倒计时预告（`video_05_launch_teaser.mp4` · 15 秒）

- **音频设计**：15 秒黄金高光短旋律，前 2 秒即给清脆倒水钩子音，迅速抓耳。

| 镜号 | 时间轴 | 时长 | 调用素材（相对 `raw_assets/`） | 运镜方式 | 画面主/副字幕（EN / ZH） | 音效节点 |
|---|---|---|---|---|---|---|
| S1 | 00:00–00:05 | 5s | `images/solstice_home_3d_scene_1794980022597.jpg` + `ui/icon-flask.png` | 慢推开门感 | `YOUR WORKSHOP AWAITS` / `阳光温室已点亮，等你推门赴约` | 01s 倒水钩子音 |
| S2 | 00:05–00:10 | 5s | `cg/victory-tier-1.jpg` + `ui/icon-coin.png` | 居中拉远 | `7-DAY GRAND JACKPOT` / `连续签到 7 天，豪领 +250 金币与道具` | 06s 倒水声 |
| S3 | 00:10–00:15 | 5s | `images/solstice_home_3d_scene_1794980022597.jpg` + `mascots/fox_clap.png` + `mascots/dragon_clap.png` | 稳态微推定版 | `POTION SORT` / `App Store 即将上线 · 立即预约` | 11s 倒水 + 渐弱 |
