# Potion Sort 安卓 `.apk` 自动打包说明（Capacitor 壳 + GitHub Actions）

本文档说明 **Potion Sort**（仓库 `Potion-Sort`）如何从纯 Web 工程（React + Vite + Tailwind）变成可安装的安卓 APK，以及 CI 如何自动出包。

它与同组织其他 Capacitor 仓库共用一套模板思路：**玩法/渲染逻辑 100% 复用 Web 代码，只用 Capacitor 生成原生壳**，不重写引擎。

---

## 一、整体结构

```
Potion-Sort/
├── src/                     # 游戏本体（引擎、关卡、VFX、音效、平台服务抽象）
├── public/                  # 静态资源
├── capacitor.config.ts      # Capacitor 配置（appId / appName / webDir=dist）
├── android/                 # Capacitor 生成的原生安卓工程（提交进仓库，CI 直接打）
└── .github/workflows/
    └── build-android-apk.yml  # 自动打包 APK
```

关键参数：

| 项 | 值 |
|---|---|
| appId | `com.potionsort.puzzle` |
| appName | `Potion Sort` |
| webDir | `dist`（`vite build` 产物） |
| Capacitor | 8.x |
| compileSdk / targetSdk | 36 |
| minSdk | 24 |
| 签名 | Debug 自签名；Release 走仓库 Secrets |

> `appId` 一旦上架就不能改（Play 商店以它为主键），改名前请先确认。

---

## 二、本地怎么打一个 APK

前置：Node 22+、JDK 21、Android SDK（platform 36 + build-tools 36）。

```bash
# 1. 安装依赖（peer 依赖有冲突时加 --legacy-peer-deps）
npm install --legacy-peer-deps

# 2. 类型检查 + 构建 web 包 + 同步到安卓工程（一步搞定）
npm run android:sync

# 3. 打 debug APK
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

产物路径：`android/app/build/outputs/apk/debug/app-debug.apk`，直接装手机即可。

常用变体：

```bash
npx cap sync android   # 只同步（web 包 + 插件原生代码），不重新 build web
npx cap open android   # 用 Android Studio 打开原生工程（调权限、图标、签名）
npx cap copy android   # 只拷 dist 到 assets，不动插件
```

**改了 web 代码之后必须 `npm run android:sync`（或至少 `npm run build && npx cap copy android`），否则 APK 里还是旧包。** 这是新手最容易踩的坑。

---

## 三、CI 自动打包

工作流：`.github/workflows/build-android-apk.yml`

### 触发

| 触发 | 行为 |
|---|---|
| push 到 `main` / `master` | 类型检查 → 构建 → 打 debug APK → 上传 Artifact → **更新 `latest-apk` 滚动 Release** |
| push `v*` tag | 同上，并把 APK 发布到同名 GitHub Release（走正式版） |
| PR 到 main/master | 同上（只校验能打包，不发 Release） |
| 手动 `workflow_dispatch` | 可勾 `publish_release` 直接发 Release、指定 `release_tag`、标记 `prerelease` |

> **`latest-apk` 滚动 Release**：普通 push 到 main 后也会自动把最新 debug APK 挂到固定 Tag `latest-apk` 的 Release（会自动覆盖更新）。随时可以从「仓库首页 → Releases → `latest-apk`」直接下载，不再需要翻 Actions Artifact。该 Release 标记为 prerelease，仅用于日常测试取包。

### 步骤

1. `actions/setup-node@v6`（Node 22，带 npm cache）
2. `actions/setup-java@v5`（Temurin 21）
3. `gradle/actions/setup-gradle@v6`（Gradle 缓存）
4. `npm ci`（有 lock 文件时）/ `npm install`
5. `npm run lint`（`tsc --noEmit`，类型门禁）
6. `npm run build` + `npx cap sync android`
7. 确保 SDK 36 存在（`sdkmanager platforms;android-36 build-tools;36.0.0`）
8. `./android/gradlew -p android assembleDebug`
9. 重命名成 `PotionSort-<tag>-debug.apk` 并上传 Artifact（保留 14 天）
10. 满足条件时发布/更新 GitHub Release（含 `latest-apk` 滚动更新）

### 拿包（推荐）

- **日常测试**：仓库首页 → **Releases → `latest-apk`**，直接下载最新 debug APK（每次 push 自动更新）；
- Actions → 对应 run → Artifacts → `PotionSort-debug-apk`（保留 14 天）；
- 正式版：`latest-apk` 是 prerelease；要发布正式版本打 `v*` tag，APK 会挂到对应的正式 Release。

---

## 四、Release 正式签名（可选）

当前流程只保证 **debug 包**。要出可上架的 release 包，需在仓库 `Settings → Secrets and variables → Actions` 配置：

| Secret | 说明 |
|---|---|
| `KEYSTORE_BASE64` | keystore 文件 base64（`base64 -w0 my-upload-key.jks`） |
| `STORE_PASSWORD` | keystore 密码 |
| `KEY_PASSWORD` | key 密码 |

生成方式：

```bash
keytool -genkeypair -v -keystore my-upload-key.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 my-upload-key.jks > keystore.b64    # 内容填进 KEYSTORE_BASE64
```

并需要在 `android/app/build.gradle` 里加 release `signingConfig`，工作流再加一个 `assembleRelease` 步骤（参考同组织原生仓库 `Voxel-Blast` / `Jelly-Out` 的写法：secret 齐了才构建 release）。

---

## 五、上线前必须补的几项（当前 Web 壳的短板）

1. **字体尽量本地化**：如从 CDN 拉字体，离线启动会退回系统字体，观感不一致。建议改 `@fontsource/*` 本地包。
2. **广告需接原生插件**：`AdService` 若只是本地埋点抽象，接 `@capacitor-community/admob` 后只需替换实现，UI 层不用动。
3. **返回键**：安卓实体返回键默认会退出 WebView 而不是返回上一屏。需要 `@capacitor/app` 的 `backButton` 监听。
4. **沉浸式全屏与刘海**：`index.html` 的 `viewport` 建议补 `viewport-fit=cover`，配合 `env(safe-area-inset-*)` 内边距。
5. **图标/启动图**：`android/app/src/main/res/` 下还是 Capacitor 默认图标，需替换。
6. **认证与包名**：`appId` 与商店登记一致后再提审。

---

## 六、把同一套壳复制到其它 Web 仓库

同组织其他 Web 仓库（如 `Inkfolk-Clash-s`、`CORGI`、`mhhy-xh`、`Mengchongtuokun`）可照抄这套：

```bash
npm install @capacitor/core @capacitor/android @capacitor/cli
# 改 capacitor.config.ts 的 appId / appName（appId 每款游戏必须不同）
npx cap add android
npm run build && npx cap sync android
```

然后把 `build-android-apk.yml` 复制过去，只改 `APK 产物名前缀` 即可。