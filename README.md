# dsh-workpet-parrot

给 DeepSeek Harness **工作宠物**（`dsh-workpet`）提供的玄凤鹦鹉形象。和 `dsh-workpet` 组合包装在同一个 profile 里后，到 **插件 → 工作宠物** 页面的形象下拉框里选 **玄凤鹦鹉** 即可。

本包**不需要编译，也不用 TypeScript**：DeepSeek Harness 原样加载 `client.js`。这个文件里绝大部分都是绘图代码，所以开发本包基本就是在画画。

## 文件

| 文件 | 作用 |
|---|---|
| `client.js` | 浏览器运行的全部内容：图像、CSS 动画，以及一小段注册代码 |
| `index.js` | 空的 Host 半侧；Loader 行需要一个能加载的模块 |
| `cordis.patch.yml` | 安装组合包时插入 `dsh-workpet-parrot` 这一行 |
| `package.json` | 组合包清单；`dsh.client.inject: ["dsh-workpet"]` 保证工作宠物先加载 |
| `locale/*.json`、`icon.svg` | 插件管理页显示的名称、描述和图标 |
| `test/smoke.test.mjs` | 可选的检查：每个状态都能正常画出来 |
| `AGENTS.md`、`.github/` | 维护与发布说明、CI 和 npm 发布流水线 |

## 绘图原理

工作宠物决定宠物**在做什么**，本包只决定**看起来是什么样**。

1. 每次渲染时，工作宠物把一个 `scene` 交给 Figure。`scene.activity` 是下表 13 个值之一；`scene.tool`、`scene.awaiting` 带有细节，`scene.helpers` 是正在运行的子智能体数量。
2. `client.js` 里的 `draw(scene, id, compact)` 选一个姿势，返回**纯 SVG 标记字符串**，画在 **100 × 80** 的画布里（`viewBox="0 0 100 80"`）。鸟站在树枝上，脚大约在 y = 68 处。
3. `ParrotFigure` 把这段标记包进一个 `<svg>`。`compact` 为 true 时，这只鸟是缩小的「小伙伴」，阴影、风线这类背景就不用画了。

下面这些由工作宠物自己画，本包**不要**画：状态气泡、工具角标（💻 🔍 …）、子智能体小伙伴，以及爱心、星星、`z`、`!`、`?` 等特效。

| `scene.activity` | 什么时候 | 鹦鹉姿势（`draw`） |
|---|---|---|
| `absent` | 没有打开会话 | `perched`：闭眼，冠羽放平 |
| `idle` | 会话空闲 | `perched`：眨眼 |
| `sleeping` | 空闲超过 70 秒 | `sleeping`：蓬成一团，头埋到背后 |
| `thinking` | 模型在运行，还没有输出 | `perched`：歪头、眼睛向上，冠羽抖动 |
| `writing` | 模型正在输出文字 | `typing`：啄笔记本电脑 |
| `tool` | 正在调用工具 | `flying`：扇翅膀飞 |
| `retrying` | 请求失败，等待重试 | `perched`：螺旋眼，摇晃 |
| `awaiting` | 等你批准或回答 | `perched`：挥一只翅膀，冠羽竖起 |
| `delegating` | 空闲但子智能体还在跑 | `perched`：东张西望 |
| `done` | 刚完成 | `perched`：眯眼笑，跳一下 |
| `error` | 刚出错 | `perched`：难过的眼睛、眼泪、发抖 |
| `petted` | 被你点了一下 | `perched`：眯眼，脸颊更红 |
| `dragged` | 正被你拖拽 | `dangling`：两只翅膀乱扑腾 |

### `client.js` 里的积木

- `P`：调色板。在这里改一个颜色，所有地方一起变。
- `head(id, cx, cy, face)`：头部，半径 12.5，朝右。`face` 控制 `eyes`（`open`、`up`、`look`、`focus`、`happy`、`closed`、`wide`、`spiral`、`sad`）、`crest`（`up`、`mid`、`down`）、`tilt`（角度）、`beakOpen`、`blush`（`soft` 或 `strong`）、`tear`，以及 `crestMotion`（冠羽的动画 class）。
- `body`、`tail`、`feet`、`foldedWing(x, y)`、`openWing(color)`、`perch(x1, x2, y)`，以及 `tube(d, color, width)`（带墨色描边的线条，用于腿、尾羽和冠羽）。
- 姿势：`perched`、`flying`、`typing`、`sleeping`、`dangling`。

### 动画规则

- 动画用 `wpp-` 前缀的 CSS class，统一写在 `CSS` 字符串里：在标记里加 class（`class="wpp-flap"`），在 `CSS` 里加对应的 `@keyframes`。
- SVG 里 CSS 旋转的支点是 `transform-origin`，单位是**画布坐标**：`style="transform-origin:46px 60px"`。不写时支点是本地的 `(0, 0)`。翅膀就利用了这一点：每只翅膀以 `(0, 0)` 为铰点画在一个 `translate(...)` 分组里，直接 `rotate()` 就是从肩膀扇动。
- 不要把动画 class 放在同时带有 `transform="..."` 属性的元素上：CSS 的 transform 会覆盖这个属性。需要时多套一层 `<g>`。
- 渐变 id 必须带上 `${id}`（例如 `url(#body-${id})`）：小伙伴会让页面上同时出现好几只鸟。
- `CSS` 末尾的 `@media (prefers-reduced-motion: reduce)` 会为要求减少动画的用户停掉所有动画，请保留。

## 开发流程

前提：profile 里已经装好 `dsh-workpet`。它提供 `ctx.workpet`；没有它，本插件不会激活。

1. **安装一次组合包**。在 DeepSeek Harness 会话里让智能体执行 `plugin_manager` 的 `install_bundle`，target 为本目录的绝对路径（桌面应用的 `desktop` profile 只能这样装）：

   ```text
   install_bundle  /absolute/path/to/dsh-workpet-parrot
   ```

   发布到 npm 后，target 也可以直接写包名 `dsh-workpet-parrot`。CLI 管理的 profile 也可以执行：

   ```sh
   dsh plugin --profile <profile> add link:/absolute/path/to/dsh-workpet-parrot
   ```

   `link:` 安装直接指向这个目录，之后修改不需要重新安装。

2. **修改 `client.js`**：通常是某个姿势或头部的某个部件。

3. **检查**：

   ```sh
   pnpm run check              # 语法检查，不需要安装依赖
   pnpm install && pnpm test   # 可选：用 React 的服务端渲染把 13 个状态都画一遍
   ```

4. **看效果**：刷新 Harness 窗口，打开 **插件 → 工作宠物**，选择玄凤鹦鹉，然后切换 **预览动作**。预览可以随时显示任意状态，不用真的等会话睡着或出错。如果刷新后还是旧图，重启 DeepSeek Harness 让它重新加载文件。

### 新增一个姿势

1. 写一个返回 100 × 80 画布标记的函数，复用 `head`、`body`、`tube` 等部件：

   ```js
   const bathing = (id) => `
     ${perch()}
     <g class="wpp-splash" style="transform-origin:50px 68px">
       ${body(id)}
       ${foldedWing(47, 38)}
       ${head(id, 54, 30, { eyes: 'happy', crest: 'up' })}
     </g>`
   ```

2. 在 `CSS` 里加 `.wpp-splash{animation:…}` 和对应的 `@keyframes`。
3. 在 `draw` 里对应的 `case` 返回它。

### 以本仓库为模板做新宠物

1. 复制本仓库，改掉这些名字：`package.json` 的 `name`、`cordis.patch.yml` 里的行 `id`/`name`、`client.js` 开头 `window.__ModuleLoader__.load` 的 `id`（必须等于包名）、注册时的形象 `id`，以及 CSS 前缀 `wpp-`（避免与鹦鹉冲突）。
2. 重画 `client.js` 第 1 部分（ARTWORK）和第 2 部分（ANIMATION），第 3 部分（PLUG-IN）只改名字和文案。
3. 更新 `locale/*.json`、`icon.svg` 和本 README。

### 发布到 npm

发布流程（一次性的 Trusted Publisher 配置、打 tag、在 npm 上批准）见 [AGENTS.md](AGENTS.md)。简要步骤：改 `package.json` 的 `version` → `pnpm run verify` → 提交 `Release vX.Y.Z: …` → 推送 `vX.Y.Z` tag → GitHub Actions 把包放进 npm 待审队列 → 在 npmjs.com 批准。

### 接口（供参考）

注册代码在 `client.js` 最后一段，一般不用改。插件用 `inject: ['workpet', 'locale']` 等待能力出现，并在 `ctx.effect` 里注册，所以关闭组合包时鹦鹉会自动移除：

```js
ctx.effect(() => ctx.workpet.register({
  id: 'cockatiel',          // 稳定的 id，用户的选择按它保存
  order: 10,                // 在下拉框里的位置（默认小猫是 0）
  title: () => t('title'),  // 本地化名称
  description: () => t('description'),
  Figure: ParrotFigure,     // React 组件：({ scene, compact }) => <svg>
}))
```

完整契约（`WorkpetScene`、`WorkpetSkin`、`WorkpetService`）见 dsh-workpet 仓库的 `packages/workpet/workpet/src/client/contract.ts`，以 `dsh-workpet/contract` 发布。
