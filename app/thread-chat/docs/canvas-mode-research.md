# Thread Chat「无限画布模式」技术调研报告

> 目标：评估在 `app/thread-chat/` 的分支对话 demo 上，新增一个参考 flowith.io 的「无限画布模式」。
> 结论先行：**可行，且与现有四层架构高度契合**。推荐用 **@xyflow/react（React Flow 12，MIT）+ dagre/d3-hierarchy 自动布局**，节点初版按「一个 thread 一张卡」，模式切换初版用**同页 `viewMode` 开关**（store 天然共享），需要独立 URL 再上「共享 layout Provider」。第一步做 **Phase 1 只读画布**，落在新模块 `orchestration/thread-canvas.tsx` + `useCanvasLayout` hook，动态 import 加载。
>
> 本报告所有代码引用均指向 `/home/user/playground.zilin.im/app/thread-chat/` 下的真实文件与类型名。

---

## 1. 可行性与架构契合度

### 1.1 现有四层架构回顾（决定契合度的关键）

| 层 | 文件 | 职责 | 是否认识「视图形态」 |
|---|---|---|---|
| core（headless） | `core/types.ts`、`core/store.ts`、`core/selectors.ts`、`core/use-thread-store.ts` | 会话树领域模型 + 可变 store + 纯函数选择器 | **完全不认识**（纯 TS，不 import React/DOM） |
| chat | `chat/chat-view.tsx` | 单会话视图（消息列表 + composer），靠 `renderAssistantBody`/`renderAfterMessage` 两个渲染插槽注入能力 | 不认识「树/列/分支」 |
| branching | `branching/branchable-chat.tsx`、`branching/selection-bubble.tsx` | 把「分支能力」装饰进 ChatView：锚点高亮、脚注、面包屑、继承上文、划选气泡 | 认识「树」，不认识「列/画布」 |
| orchestration | `orchestration/thread-columns.tsx`、`placement.ts`、`thread-switcher.tsx`、`artifact-drawer.tsx` | **列视图**编排：哪些会话摆哪列、列满替换⑥/折叠⑤、切换器、Artifact 抽屉 | **这就是当前唯一的「视图/编排层」** |

关键事实：`thread-chat-demo.tsx` 里注释已明确写下这套分层意图，并且 core 层的 `ThreadTreeState`（`core/types.ts:56`）本身就是一棵**带单一根节点的树**：

- `Thread`（`core/types.ts:40`）= `{ id, parentId, depth, title, anchorText, forkFromMsgId, footnote, children[], messages[], lastActive }`
- 根固定为 `id:"main"`、`parentId:null`（见 `data.ts:141` seedStore）
- 每个 `Fork`（`core/types.ts:25`）= `{ text, num, threadId, depth }`，挂在某条 `Message` 上——**天然就是一条「父消息锚点 → 子会话」的有向边**

**这意味着：画布模式想要的「节点 + 树状边 + 深度」数据，core 层已经原样具备，一行都不用改。**

### 1.2 画布模式 = 第二个「编排/视图层」

把画布模式定位为**与 `orchestration/thread-columns.tsx` 平级的另一个视图层**，共享同一棵 core store。这正是当前架构埋好的扩展点——`thread-columns.tsx` 顶部注释就写着「会话树归 core store；『哪些会话摆在哪些列、谁折叠成细条』这类视口状态归这里的 React state（useColumnSlots）」。画布层要做的是同一句话的另一半：**「哪些节点摆在画布哪个坐标、视口平移缩放到哪」也是视口状态，归一个新的 `useCanvasLayout`。**

### 1.3 直接复用 vs 必须新建

**直接复用（几乎零改动）：**
- `core/*` 全部：`createThreadStore`、`useThreadStore`（`useSyncExternalStore(version)`）、`store.fork/send/touch`
- `core/selectors.ts`：`allTreeRows`/`subtreeRows`（已是**先序 DFS + depth**，构建节点数组直接可用）、`lineage`、`collectInherited`、`threadTitle`、`lruIndex`
- `theme.ts`：`dc`/`dvar`/`accentOf`/`dotColorOf`（深度色 `--d1..--d5`），节点左缘/边着色直接套
- Artifact 模型 + `orchestration/artifact-drawer.tsx`：画布节点上的 artifact chip 与「定位来源会话」可复用同一抽屉
- 消息渲染：`chat/chat-view.tsx` 的 `ChatView`、`branching/branchable-chat.tsx` 的 `renderAssistantBody`（锚点高亮/脚注）——**当节点被聚焦/展开时可整块塞进画布节点**
- 统一打开意图 `openBranchUI(id, sourceId)`（`thread-chat-demo.tsx:89`）：画布「双击节点回列模式并定位」直接调它

**必须新建：**
- 画布视图层：`orchestration/thread-canvas.tsx`（React Flow 容器 + 节点/边装配）
- 视口状态 hook：`useCanvasLayout`（节点坐标、手动拖动后的位置覆盖、视口 transform；对标 `useColumnSlots`）
- 画布节点组件：`CanvasNode`（thread 卡：标题 + 讨论焦点 + 末条摘要 + artifact chip + 深度色缘）
- 自动布局适配：把 `state.threads` → dagre/d3-hierarchy → `{x,y}`
- 顶栏模式开关（`thread-chat-demo.tsx` 顶栏加一个 seg/tbtn）

### 1.4 结论

**合理，而且是这套架构「本来就该长出来的第二条腿」。** core 是 headless 可变树、view 层可插拔，这是教科书式的「一个 model、多个 view」。画布层不触碰 core、不触碰 chat/branching，只新增一个 orchestration 兄弟模块 + 一个视口 hook + 一个节点组件。风险集中在**新层内部**（布局、性能、SSR），不会污染已跑通的列模式。

---

## 2. 路由与状态共享方案

### 2.1 问题本质

当前 store 是**组件挂载时创建的内存对象**：

```ts
// thread-chat-demo.tsx:54
const [store] = useState(() => createThreadStore(seedStore()));
```

`useState(初始化函数)` 意味着 store 的生命周期 = `ThreadChatDemo` 这个组件实例的生命周期。**一旦切到新路由（如 `/thread-chat/canvas`），`ThreadChatDemo` 卸载 → store 被 GC → 用户开的整棵分支树全丢。** 这是必须先解决的前提。

### 2.2 三种方案对比

**方案 (a) module 级单例 store**
```ts
// 某个 module 顶层
export const store = createThreadStore(seedStore());
```
- 优点：任意路由/组件 import 同一个 store，最省事。
- **Next App Router / SSR 致命坑**：module 顶层代码在**服务端进程**里执行一次，被**所有请求、所有用户共享**——demo 阶段数据写死尚可忍受，但一旦接真实后端就是**跨用户数据串台**的安全事故。
- **开发期坑**：HMR 热重载会重置或重复该 module；React 19 StrictMode 下副作用双跑。
- 结论：**接真实后端阶段直接否决**；即便 demo 阶段也不推荐，收益不抵坑。

**方案 (b) 共享 layout + React context Provider（推荐）**
- 在包住两个子路由的 `layout.tsx`（client 边界）里 `useState(() => createThreadStore(...))`，用 Context 下发。
- Next App Router 的关键特性：**在同一 layout 的子路由之间导航时，layout 不会重新挂载**——所以 Provider 持有的 store **跨 `/thread-chat` ↔ `/thread-chat/canvas` 导航存活**。
- 无 SSR 单例串台问题（store 在 client Provider 里、每个浏览器会话一份）。
- 代价：要新建一个 `app/thread-chat/layout.tsx` 和一个 Context。

**方案 (c) 序列化持久化（localStorage / URL）**
- `ThreadTreeState` 是纯 `Record` + id 数组 + 消息数组，**完全 JSON 可序列化**（无循环引用、无类实例），序列化/反序列化成本极低。
- 优点：刷新/重开不丢、天然支持深链分享。
- 缺点：跨路由「同会话内实时同步」不如 Context 直接；要处理 schema 迁移。是**最终一定要做**的持久化层，但不适合当「跨路由共享」的主手段。

### 2.3 分阶段推荐

**Demo 阶段（写死数据）——两选一，从简：**
1. **首选：同页 `viewMode` 开关，根本不换路由。** 在 `ThreadChatDemo` 里加 `const [viewMode, setViewMode] = useState<"columns"|"canvas">("columns")`，根据它渲染 `<ThreadColumns/>` 或 `<ThreadCanvas/>`。`ThreadChatDemo` 不卸载 → **store 零成本共享，没有任何跨路由问题**。这是 demo 最优解，改动最小。
2. 若产品上明确要**独立可分享 URL** `/thread-chat/canvas`：用**方案 (b) 共享 layout Provider**，把 `useState(() => createThreadStore(seedStore()))` 从 `thread-chat-demo.tsx` 上提到 `app/thread-chat/layout.tsx`，两个 page 都从 Context 取 store。同时把「当前聚焦会话」放进 URL `?focus=threadId`（方案 c 的轻量子集）做深链。

**真实后端阶段：**
- store 退化为**服务端状态的客户端缓存/乐观层**，按 user/session 隔离，首屏由 RSC 或 fetch 注入（hydrate），变更走 API + optimistic update。
- 持久化天然在服务端；URL 只携带 `?focus=` / thread 深链。
- **module 单例在服务端一定错**（跨用户），Context/每请求实例是唯一正确形态。

> 一句话：demo 先 `viewMode` 同页开关（或共享 layout Provider），**永远别用 module 单例去承载会接后端的数据**。

---

## 3. 技术选型对比（核心，已查证版本/License）

### 3.1 硬需求先锚定

我们的节点是**富 HTML**：文字段落 + 高亮锚点（`.anchored` span）+ 脚注上标 + artifact chip（`.acard`）+ 深度色左缘。**「节点是任意 React 组件」是硬约束**——凡是把节点画成 canvas/WebGL 图元的方案，都要把这套富文本重写一遍，直接出局或大幅降级。

### 3.2 候选对比表

| 方案 | 版本（2026-07 查证） | License | 节点=富 HTML React 组件 | 内置边/minimap/fitView/拖拽 | 自动布局 | 适配我们的结论 |
|---|---|---|---|---|---|---|
| **@xyflow/react（React Flow 12）** | **12.11.x**（12.11.2，数天前发布） | **MIT**，核心无付费门槛 | ✅ **一等公民**，节点就是你写的 React 组件（DOM） | ✅ 全内置（`<MiniMap/>`/`<Controls/>`/`<Background/>`/`fitView`/`setCenter`/节点 drag） | ❌ 不含，需配 dagre/d3-hierarchy/elk | **✅ 推荐** |
| tldraw | SDK 4.x | ❌ **非标准「tldraw SDK License」**：免费仅限开发环境；生产需 license key；hobby 授权强制显示「made with tldraw」水印；去水印/商用需 Business License **$6,000/年/团队**（SDK 4.0，2025-09） | 可（ShapeUtil，较重） | 白板向，边/树非其模型 | 无树布局 | ❌ **否决**（License + 水印，公开 playground 不可接受） |
| konva / react-konva | konva 9.x / react-konva 18.x | MIT | ❌ **canvas 图元**，HTML 要靠 `react-konva-utils <Html/>` portal，反而抵消 canvas 性能优势且笨拙 | ❌ 全部自己造（无边/minimap/fitView/布局） | 无 | ❌ 否决（富文本节点是错配；只在「几千个轻节点」时才值） |
| pixi.js | 8.x | MIT | ❌ **WebGL**，文字是位图，HTML 卡非原生 | ❌ 更底层，全自造 | 无 | ❌ 否决（抽象层级过低，杀鸡用牛刀） |
| 纯手写 CSS transform pan-zoom | —（零依赖） | — | ✅ 纯 React 卡片，直接复用 `ChatView`/`BranchableChat` 与现有 `.tc` 样式 | ❌ 边（SVG path）、minimap、fitView 数学、节点 drag、缩放限制、坐标变换全自造 | 需自接 | 🔸 只读 Phase 1 的极简备选（几百行），但 Phase 2 交互一上来就会「长回」React Flow |

### 3.3 各库事实核验（带来源）

- **React Flow 12 = `@xyflow/react`，MIT**，最新 12.11.x；`reactflow` 旧包已更名。核心库 **无 Pro 功能门槛**，商用免费，Pro 只卖高级示例/支持。([npm](https://www.npmjs.com/package/@xyflow/react)、[GitHub Discussion 3397](https://github.com/xyflow/xyflow/discussions/3397)、[React Flow Pro](https://reactflow.dev/pro))
- **tldraw**：默认许可仅限开发；生产需 license key，hobby 版强制「made with tldraw」水印，去水印/商用 Business License $6,000/年（SDK 4.0，2025-09 引发社区争议）。([tldraw License](https://tldraw.dev/legal/tldraw-license)、[license-key 文档](https://tldraw.dev/sdk-features/license-key)、[BigGo 报道](https://biggo.com/news/202509190115_tldraw_SDK_4.0_Licensing_Debate))
- **konva/react-konva：MIT**，Stage→Layer→Shape，5000+ 图元性能好；但 **React Flow 用 DOM 节点、konva 画像素**——DOM 节点在中端手机上「实用上限约 500 个」，canvas 则轻松 5000+。DOM 节点要 HTML 得用 `<Html/>` portal。([react-konva GitHub](https://github.com/konvajs/react-konva)、[Velt 对比](https://velt.dev/blog/best-canvas-library-web-mobile-apps))
- **布局库**：React Flow 官方不内置布局，示例给了 dagre / d3-hierarchy / elk 三选。**dagre（`@dagrejs/dagre`，MIT）**是「近乎 drop-in」的树布局首选，尊重每节点尺寸，但**上游已基本不维护**（仍可用）；**d3-hierarchy（3.1.2，ISC）**适合**单根树**，但**假设所有节点等宽等高**，不适合我们高度不一的文字卡；**elkjs（EPL-2.0）**最强可配置但最复杂、异步、官方不常推荐。([React Flow 布局总览](https://reactflow.dev/learn/layouting/layouting)、[dagre 示例](https://reactflow.dev/examples/layout/dagre)、[@dagrejs/dagre npm](https://www.npmjs.com/package/@dagrejs/dagre)、[elkjs GitHub](https://github.com/kieler/elkjs)、[d3-hierarchy Snyk](https://security.snyk.io/package/npm/d3-hierarchy))

### 3.4 推荐：React Flow（@xyflow/react）+ dagre（初版）

**理由：**
1. **License 干净（MIT，核心零门槛）** —— 公开 playground 首选，tldraw 的水印/收费直接排除。
2. **富 HTML 节点是一等公民** —— 我们的锚点高亮/脚注/artifact chip 卡片原样就是节点，不用重写。
3. **边 + minimap + Controls + fitView + 视口动画（`setCenter`/`fitBounds`）+ 节点拖拽全内置** —— 正好覆盖第 4 节要的核心动作。
4. **维护活跃**（12.11.x 数天前刚发）、TypeScript 原生、内部用 Zustand store。
5. **节点量级匹配**：我们是「几十到低几百个 thread」，远在 DOM 节点的舒适区内。
6. **可懒加载**：用 `next/dynamic` 动态 import 画布层（`ssr:false`），列模式不背这份体积。

**布局初版选 dagre（`@dagrejs/dagre`，MIT）**：drop-in、树友好、**尊重每节点实际宽高**（我们的卡片高度不一，这点比 d3-hierarchy 重要）。
- 备选：我们的树**恒有单一根 `main`**，满足 d3-hierarchy 的单根前提，若改成**固定尺寸卡片**则 d3-hierarchy 的 tidy-tree（`d3.tree()`）排布更漂亮、依赖更轻（ISC）。
- 想要「变尺寸 + tidy」两全 → 后续可换 elk `mrtree`/`layered`（代价是复杂度与异步布局）。

### 3.5 React Flow HTML 节点的性能边界与实践（几百节点量级）

DOM 节点位置变更会触发浏览器布局计算，**中端手机实用上限约 500 节点**开始掉帧（[Velt](https://velt.dev/blog/best-canvas-library-web-mobile-apps)）。我们量级安全，但仍应遵循官方实践（[React Flow Performance](https://reactflow.dev/learn/advanced-use/performance)）：

1. **节点组件用 `React.memo`**，或声明在父组件外，避免每次重渲重建。
2. **别把节点/边状态放 `useState`/Context**，交给 React Flow 内部 store（高频变动，精确订阅）。
3. **`onlyRenderVisibleElements`（视口虚拟化）要谨慎**：官方提醒它可能**更慢**——节点进入视口要重新初始化，且**缩放到 fitView 时全部节点可见会瞬间打回原形甚至卡死**（[issue #3883](https://github.com/xyflow/xyflow/issues/3883)）。**几百节点先不用**，节点数真的涨上千再评估。
4. **折叠子树**：默认只渲染展开的分支，折叠的后代干脆不 mount，既降节点数又降 DOM。
5. **节点内 DOM 要轻**：画布卡片只放「标题 + 讨论焦点 + 末条摘要 + artifact chip」，**完整消息列表只在聚焦/展开或回列模式时才渲染**（把重 DOM 关在焦点态里）。
6. 实践细节：React Flow 需 `import '@xyflow/react/dist/style.css'`（全局类，与我们 `.tc` 作用域并存，自定义节点样式记得自己 scope）；自定义节点连边要 `<Handle/>`（只读树可隐藏 handle）。

---

## 4. 画布交互设计建议

### 4.1 节点粒度：初版「一个 thread 一张卡」

| 选项 | 内容 | 优点 | 缺点 |
|---|---|---|---|
| **(A) 每个 thread 一张卡（推荐初版）** | 标题 + 讨论焦点（`anchorText`）+ 末条消息摘要 + artifact chip + 深度色左缘 | 与 `Thread` 模型 1:1；**节点数 = 会话数**（低）；**与「一列 = 一会话」天然同构**，双击回列干净 | 密度不如 flowith |
| (B) 每条消息一张卡（flowith 更接近） | 每条 user/assistant 消息一个节点，fork 从具体消息节点长出 | 更接近 flowith 的密度与「从锚点生长」观感 | **节点数爆炸**；要消息级布局；破坏「节点↔列」1:1；聚焦/回列映射变复杂 |

**初版选 (A)**，理由：
- 复用 `Thread` + `accentOf`/`dotColorOf` + `subtreeRows`，几乎零新数据；
- 节点数 = thread 数，性能与布局都轻；
- **双击节点回列模式**就是「这张卡 → 这一列」的 1:1，直接喂给现有 `openBranchUI(threadId)`；
- 演进路径：先 thread 卡，之后允许卡片**就地展开**露出内部消息（向 flowith 密度靠拢），再考虑 (B)。

### 4.2 边：parent → child，深度色着色

- 边 = `Thread.parentId → Thread.id`，从父会话被划选的锚点出发（我们知道 `forkFromMsgId` 与 `Fork.num`）。
- 边着色用子节点深度：`dvar(child.depth)` / `fc-${dc(child.depth)}`，与列模式脚注/锚点同一套色。
- 边标签可放 `Fork.num`（脚注号）或截断的 `anchorText`，镜像列模式里的脚注 chip。
- 初版可先「卡到卡」直连；精细化时再把源 handle 定位到父卡内对应消息位置。

### 4.3 画布核心动作集

| 动作 | 实现 | 与现有系统对接 |
|---|---|---|
| pan / zoom / fitView | React Flow 内置 | — |
| 点击节点 = 聚焦/展开预览 | 居中 + 轻高亮（复用列模式 `flash` 观感），可展开露出内部消息 | 复用 `BranchableChat`/`renderAssistantBody` |
| **双击节点 = 回列模式并定位该会话** | 切 `viewMode="columns"` + 调 `openBranchUI(threadId)` | **直接命中现有「统一打开意图」**（`thread-chat-demo.tsx:89`） |
| 新开分支后自动布局 + 视口跟随 | fork 后重算布局，`setCenter(x,y,{duration})` 平滑移到新节点 | 复用 `store.fork` |
| 划选开分支（画布内） | **初版建议不做** | 见下 |
| 无障碍导航兜底 | 保留 ⌘K `ThreadSwitcher`（`thread-switcher.tsx`）——它已列全树、可键盘导航 | 复用 |

**划选开分支要不要在画布内支持？初版建议：不支持。**
- `branching/selection-bubble.tsx` 依赖 `window.getSelection()` + `.msg-list[data-list]` / `.message[data-msg-id]` 的 DOM 反查，且用 `getBoundingClientRect` 定位气泡。
- 在 React Flow 里，节点被 CSS transform 缩放/平移，**文字划选**与**节点拖拽/画布 pan** 存在手势冲突（拖拽阈值 vs 选区）；可选文字要打 `.nodrag` 类让 React Flow 放行，气泡定位还要考虑 zoom。
- 因此**初版画布只做导航/概览**，开分支仍在列模式（或聚焦节点的展开态）里发生。Phase 2 再攻克画布内「继续对话/划选开分支」。

### 4.4 自动布局算法建议

- **形状**：tidy tree。默认 **自上而下（dagre `rankdir=TB`）**，父在上、子在下，**兄弟横向铺开**（对应用户描述的「兄弟分支横向铺开」）；宽屏或移动端竖屏可切 **LR**。
- **间距**：`nodesep ≈ 卡宽 + gutter`，`ranksep` 给足以容纳边标签（脚注号）。
- **手动拖动后的位置记忆**：坐标是**视图状态，不进 core store**（与 `useColumnSlots` 的 slots 同理）。在 `useCanvasLayout` 里维护 `Map<threadId, {x,y}>` 覆盖表：
  - 未被手动移动的节点 → 每次布局由 dagre 重算；
  - 一旦用户拖动某节点 → **pin 该节点**（写入覆盖表），后续只对「未 pin 的新节点/旧节点」重排，**不再动被 pin 的**，避免「一开新分支全图重排抖动」。
  - 这条「core = 树的真相，orchestration = 视口状态」的边界，与现有架构完全一致。

---

## 5. 模式切换的产品形态

- **顶栏按钮**：在 `thread-chat-demo.tsx` 顶栏（现有「列数 / 列满 / 会话树 / Artifact」那排 seg/tbtn）加一个 **`列 | 画布` 切换 seg**，或一个 `tbtn`。图标用已在依赖里的 `lucide-react`（现成的 `Network` 已 import，或 `Workflow`/`Waypoints`/`GitBranch` 更贴「流程/画布」语义）。文案建议「画布」/「Canvas」。
- **跳转 vs 原地切换**：
  - **demo 首选原地切换**（`viewMode` state）：store 不卸载、零共享成本、切换零延迟。
  - 需要**可分享 URL** 时才上 `/thread-chat/canvas` + 共享 layout Provider（见第 2 节）。
- **URL 深链 `?focus=threadId`**：画布模式读它 → 进场即 `setCenter` 到该节点；列模式读它 → 喂给 `openBranchUI` 打开为一列。两向都复用现有统一打开意图。
- **从画布回列保持上下文**：把「当前聚焦/选中的节点」作为回列时的目标——回列瞬间调 `openBranchUI(focusedThreadId)`，**选中的节点直接变成一列**，用户视线不断。
- **移动端判断：画布模式很可能是移动端的更优主视图。**
  - 多列在手机上塌到 1–2 列，**丢掉了树的全局概览**，`useWindowWidth`（`thread-columns.tsx:34`）本就把手机限到 2 列。
  - 画布 + fitView 能**一屏看全树 + 点按聚焦**，pan/zoom 是移动端天然手势。
  - 判断：**桌面「列做深读、画布做概览/导航」双模并存；移动端可把画布（或竖向 tidy-tree 缩略图）当默认主视图**。画布因此一鱼两吃，既是新功能也是移动端答案。

---

## 6. MVP 拆解与工作量

> 规模为粗估（含样式与联调），LOC 指新增净代码。

### Phase 1 — 只读画布（树展示 + 布局 + 导航 + 回列模式）
- **新增模块**：
  - `orchestration/thread-canvas.tsx`（React Flow 容器，与 `thread-columns.tsx` 平级）
  - `orchestration/use-canvas-layout.ts`（视口/坐标视图状态 hook，对标 `useColumnSlots`）
  - `orchestration/canvas-node.tsx`（`CanvasNode` thread 卡）
  - 布局适配函数（`state.threads` → dagre → `{x,y}`）
- **改动文件**：`thread-chat-demo.tsx`（加 `viewMode` + 顶栏开关 + `dynamic()` 懒加载画布 + 双击回列接 `openBranchUI`）。
- **复用**：`allTreeRows`/`state.threads`、`accentOf`/`dotColorOf`/`dc`、`threadTitle`、⌘K `ThreadSwitcher` 作 a11y 兜底。
- **依赖**：`@xyflow/react` + `@dagrejs/dagre`（或 `d3-hierarchy`）。
- **规模**：~1.5–3 天，~350–550 LOC。
- **风险**：
  - **SSR**：React Flow 需客户端 + 容器有尺寸 → `"use client"` + `dynamic(() => import(...), { ssr:false })`；沿用现有「SSR 快照占位」思路（参考 `useWindowWidth` 的 `getServerWinW = () => null`）。
  - **布局抖动**：首次 mount 卡片高度未知 → 初版**固定卡片尺寸**或先测量再布局。
  - **CSS 作用域**：React Flow 全局 CSS 与 `.tc` 并存，自定义节点样式要自己 scope。
  - **a11y**：画布本身可达性弱 → 明确以 ⌘K 切换器作为等价的键盘可达导航。

### Phase 2 — 画布内交互（节点内继续对话、划选开分支）
- **改动/新增**：聚焦节点内嵌 composer（复用 `ChatView` composer + `store.send`）；可展开为完整 `BranchableChat`；画布内划选开分支（复用 `SelectionBubble`，解决 pan/drag-vs-select 冲突与 zoom 下的气泡定位，可选文字打 `.nodrag`）；新 fork → 增量布局 + `setCenter` 视口跟随。
- **规模**：~2–4 天，~300–500 LOC。
- **风险**：**划选 vs 拖拽/pan 手势冲突**；缩放变换下的坐标/`getBoundingClientRect` 数学；节点展开成完整消息列表的 mount 成本（**只展开聚焦的那个**）。

### Phase 3 — 混合内容节点（artifact 上画布、图片/地图卡）
- **新增**：把 `Artifact` 升级为一等画布节点类型（code/note 卡内联渲染，复用 `artifact-drawer.tsx` 的渲染；边 artifact→`sourceThreadId`）；新增节点种类（图片堆叠卡、地图卡）→ 给节点模型加 `type` 字段，用 React Flow `nodeTypes` 映射分派（这正是 flowith 异构画布的形态）；底部「正在执行的 agent 状态胶囊」可作独立浮层组件。
- **规模**：~3–6 天（取决于卡类型数），~400–800+ LOC。
- **风险**：**异构节点尺寸差异大 → 布局更难**（需给每类节点尺寸提示喂 dagre/elk）；图片/地图资源与性能；单节点 DOM 变重 → 重新评估虚拟化（`onlyRenderVisibleElements` 的上述 caveat / 折叠离屏子树）。

---

## 7. 结论

**这个方案可行，而且和现有架构非常契合，建议做。** 你们的四层结构（headless 可变树 core store + 可插拔的编排/视图层）恰好就是「一个 model、多个 view」的标准形态——画布模式就是与 `orchestration/thread-columns.tsx` 平级的**第二个视图层**，它**复用 core/selectors/theme/artifact/消息渲染的一切**，只新增「画布视图 + 视口状态 hook + 节点组件」，风险全部关在新层内部，不动已跑通的列模式。

**推荐路径**：用 **@xyflow/react（React Flow 12，MIT，富 HTML 节点一等公民、边/minimap/fitView/拖拽全内置）+ dagre（或 d3-hierarchy，因为我们的树恒有单一根 `main`）自动布局**；节点初版按**「一个 thread 一张卡」**（与「一列 = 一会话」1:1，双击直接走现有 `openBranchUI` 回列）；模式切换 demo 阶段用**同页 `viewMode` 开关**（store 天然共享，零跨路由问题），要独立 URL 再上共享 layout Provider，**坚决不用会串台的 module 单例**；画布初版只做只读导航，划选开分支留到 Phase 2。

**第一步做什么**：落地 **Phase 1 只读画布**——新建 `orchestration/thread-canvas.tsx` + `orchestration/use-canvas-layout.ts` + `CanvasNode`，用 dagre 把 `state.threads` 布成自上而下的 tidy tree，`next/dynamic` 懒加载，`thread-chat-demo.tsx` 顶栏加「列 | 画布」开关、双击节点接 `openBranchUI` 回列。~1.5–3 天即可拿到一个能 pan/zoom/fitView、点节点聚焦、双击回列的可用画布原型。

---

## 附：来源链接

- React Flow / @xyflow/react（版本、MIT、Pro 边界）：[npm](https://www.npmjs.com/package/@xyflow/react)、[GitHub Discussion 3397](https://github.com/xyflow/xyflow/discussions/3397)、[React Flow Pro](https://reactflow.dev/pro)、[Performance 文档](https://reactflow.dev/learn/advanced-use/performance)、[onlyRenderVisibleElements issue #3883](https://github.com/xyflow/xyflow/issues/3883)
- tldraw License / 水印 / 定价：[tldraw License](https://tldraw.dev/legal/tldraw-license)、[license key 文档](https://tldraw.dev/sdk-features/license-key)、[BigGo：SDK 4.0 $6,000/年争议](https://biggo.com/news/202509190115_tldraw_SDK_4.0_Licensing_Debate)
- konva / react-konva（MIT、canvas vs DOM、~500 节点上限）：[react-konva GitHub](https://github.com/konvajs/react-konva)、[Velt 画布库对比](https://velt.dev/blog/best-canvas-library-web-mobile-apps)
- 布局库：[React Flow 布局总览](https://reactflow.dev/learn/layouting/layouting)、[dagre 示例](https://reactflow.dev/examples/layout/dagre)、[@dagrejs/dagre npm（MIT）](https://www.npmjs.com/package/@dagrejs/dagre)、[elkjs GitHub（EPL-2.0）](https://github.com/kieler/elkjs)、[d3-hierarchy 3.1.2 / ISC（Snyk）](https://security.snyk.io/package/npm/d3-hierarchy)
