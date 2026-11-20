# Potion Sort

> 一款基于 **React + Vite + Tailwind** 构建、由 **Capacitor 8** 封装成安卓 App 的竖屏移动端药水分拣（Liquid-Sorting）休闲解谜游戏：把彩色药水按颜色归类到对应试管，上手即懂的轻松关卡体验。

---

## 核心特色

- **药水分拣核心**：经典液体分拣玩法——把彩色药液倒入同一颜色的目标试管，完成排序即过关。
- **竖屏移动端设计**：单手持握友好，关卡尺寸与节奏面向手机竖屏优化。
- **渐进关卡设计**：试管数量与颜色种类随进度增加，从放松到烧脑平滑过渡。
- **主题化美术方向**：多套视觉主题提案（见下），后续可换肤而不改玩法。

---

## 技术栈与项目结构

- **Web 侧**：React + Vite + Tailwind（游戏逻辑与渲染全在 Web 侧）
- **原生壳**：@capacitor/core·android·cli `^8.6.2`，`android/` 工程提交进仓库
- **应用信息**：appId `com.potionsort.puzzle` / appName **Potion Sort** / webDir `dist`
- **构建目标**：compileSdk 36 / targetSdk 36 / minSdk 24 / debug 自签名

```text
├── src/                      # 游戏本体（试管状态、倾倒逻辑、关卡、VFX）
├── public/                   # 静态资源
├── android/                  # Capacitor 生成的原生安卓工程
├── capacitor.config.ts       # appId / appName / webDir 配置
└── .github/workflows/
    └── build-android-apk.yml # lint → build → cap sync → assembleDebug → latest-apk
```

---

## 下载与安装 APK

每次 push 到 `main` 后，CI 自动把最新 debug APK 挂到 **latest-apk 滚动 Release**：

1. 仓库首页 → **Releases** → **`latest-apk`**（Tag 固定，构建自动覆盖更新）；
2. 下载 APK（形如 `PotionSort-v<b>.<b>-debug.apk`）；
3. 传至安卓手机，允许"未知来源"安装（debug 签名）。

也可在 **Actions → 最新 run → Artifacts** 下载（保留 14 天）。打包详情见 [`docs/android_apk_packaging_guide.md`](docs/android_apk_packaging_guide.md)（与同组织 Capacitor 仓库共用一套模板）。

---

## 本地构建

前置：Node 22+、JDK 21、Android SDK（platform 36 + build-tools 36）。

```bash
npm install --legacy-peer-deps
npm run android:sync      # tsc 类型检查 + vite build + cap sync android
cd android && ./gradlew assembleDebug   # Windows: gradlew.bat
```

产物：`android/app/build/outputs/apk/debug/app-debug.apk`。

---

## 当前状态

早期可测试版本（已具备自动出包 + 最新 APK 可装）。玩法需要对倾倒手感、关卡规模与难度曲线做真机体验后再优化。