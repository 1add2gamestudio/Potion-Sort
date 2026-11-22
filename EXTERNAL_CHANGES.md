# AI Studio 之外的改动记录

这个仓库主要在 Google AI Studio 里开发。凡是**没有经过 AI Studio、直接提交到 GitHub 的改动**，都记在这里，最新的写在最前面。

> 在 AI Studio 里继续开发之前，**请先拉取（pull）GitHub 上的最新代码**。如果忘了拉、导致冲突或者改动被覆盖，按下面每条记录里的「被覆盖了怎么办」处理。

---

## 2026-11-22 · 图片改用 import 引用（提交 `01ff5c7`）

**提交人**：binw31103-dev（官网组）
**影响范围**：Potion Sort，只改了下面 2 个文件里引用图片的几行，没有改玩法、数值和画面。

**没改的部分**：代码里还有 `"/assets/ui/..."`、`"/assets/cg/..."` 这类以 `/assets/` 开头的路径，指向 `public/assets/`。它们在 APK 和网站根目录下都能正常显示，所以这次没动。只有把游戏放到网站子目录（例如 game.pixfuns.com/play/potion-sort/）时才需要改，官网组的打包脚本会单独处理。

### 为什么改

原来代码里把图片写成了 `"/src/assets/images/xxx.jpg"` 这样的路径。这种路径**只在开发预览（Vite dev server）里能显示**。一旦打包，不管是网页版还是 Capacitor 打出来的 APK，`dist/` 里都没有 `src/` 目录，这些图片就会变成空白。

改法是把图片 `import` 进来再使用。这样 Vite 打包时会把图片复制进 `dist/assets/`（文件名带哈希），开发预览和正式包都能正常显示。

### 具体改了什么

#### `src/components/GameplayScreen.tsx`

新增的 import：

```ts
import solsticeDragonAvatarImg from '../assets/images/solstice_dragon_avatar_1794985798351.jpg';
import solsticeMascotAvatarImg from '../assets/images/solstice_mascot_avatar_1794980022747.jpg';
import stageCFullwidthImg from '../assets/images/stage_c_fullwidth_1794988696753.jpg';
```

改前 → 改后：

```diff
- const stageImage = '/src/assets/images/stage_c_fullwidth_1794988696753.jpg';
- src="/src/assets/images/solstice_dragon_avatar_1794985798351.jpg"
- ? '/src/assets/images/solstice_mascot_avatar_1794980022747.jpg'
- : '/src/assets/images/solstice_dragon_avatar_1794985798351.jpg'
+ const stageImage = stageCFullwidthImg;
+ src={solsticeDragonAvatarImg}
+ ? solsticeMascotAvatarImg
+ : solsticeDragonAvatarImg
```

#### `src/components/TitleHomeScreen.tsx`

新增的 import：

```ts
import solsticeHome3dSceneImg from '../assets/images/solstice_home_3d_scene_1794980022597.jpg';
import solsticeMascotAvatarImg from '../assets/images/solstice_mascot_avatar_1794980022747.jpg';
```

改前 → 改后：

```diff
- src="/src/assets/images/solstice_home_3d_scene_1794980022597.jpg"
- src="/src/assets/images/solstice_mascot_avatar_1794980022747.jpg"
+ src={solsticeHome3dSceneImg}
+ src={solsticeMascotAvatarImg}
```

### 以后要换图、加图怎么做

1. **只换图、不改文件名**：直接覆盖 `src/assets/images/` 里的同名文件，代码不用动。
2. **换成新文件名**：把新图放进 `src/assets/images/`，再改对应文件顶部那行 `import`，变量名不用变。例如：

   ```ts
   import 原来的变量名 from '../assets/images/新文件名.jpg';
   ```

3. **新增一张图**：在用到它的文件顶部加一行 import，路径写**相对于当前文件**的路径，例如 `src/components/` 下的文件写 `import 变量名 from '../assets/images/文件名.jpg'`，然后在代码里用这个变量，比如 `src={变量名}`、`` backgroundImage: `url("${变量名}")` ``。
4. **不要再写** `"/src/assets/..."` 这种字符串路径，开发预览里看着正常，打包后就会丢图。

在 AI Studio 里让 AI 改图时，可以直接贴这句给它：

> 引用 src/assets 里的图片时，请在文件顶部用 import 引入，再用变量引用；不要在代码里写 "/src/assets/..." 字符串路径。

### 被覆盖了怎么办

如果在 AI Studio 里没拉代码就继续改，然后同步回 GitHub，有两种可能：

- **出现合并冲突**：冲突的地方保留**你自己的玩法改动**，同时保留 `import xxxImg from ...` 这几行，引用处用变量，不用 `"/src/assets/..."`。
- **改动被直接覆盖**（APK 里这些图又变空白了）：在仓库根目录运行

  ```bash
  grep -rn "/src/assets/" src
  ```

  有输出就说明又退回了旧写法，按上面「具体改了什么」逐处改回 import 写法即可。只要你没改过这几个文件的其他内容，也可以直接恢复：

  ```bash
  git checkout 01ff5c7 -- src/components/GameplayScreen.tsx src/components/TitleHomeScreen.tsx
  ```

  （执行前先确认这几个文件里没有你新做的改动，否则会被一起还原。）
