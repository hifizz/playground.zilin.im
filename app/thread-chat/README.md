# Thread Chat · 分支对话 — 交接文档

> 一句话：把线性的 AI 聊天升级为**可导航的思考树**——划选 AI 回复里的任意文字，就地开出一个继承上下文的分支对话，在有限的屏幕上舒适地浏览、对照、回溯这棵树。
>
> - 体验入口：`/thread-chat`（本仓库 `pnpm dev` 后访问，或线上 playground 对应路由）
> - 开发分支：`claude/design-doc-demo-optimization-yaxr93`，PR **#12**（六个功能 commit，见 §5）
> - 当前状态：**交互原型**。会话树、布局、导航、放置控制全部真实可用；AI 回复是写死的演示内容（`data.ts`），等待接入真实模型（路线图见 §10）
> - 本文档假设读者是接手的开发者：读完本文 + 打开 demo 玩一遍 + 浏览 `docs/` 下两份调研，即可建立完整认知

---

## 1. 产品动机与目标

今天的 Chatbot 都是线性的：对话是一条从上到下的直线。但真实的思考不是——AI 的一段回答里往往埋着好几个想追问的点（某个术语、某个论断、某个例子）。顺着一个追下去，主线思路就断了；把几个追问都堆进同一条线，最后自己都理不清哪个回答对应哪个问题。

Thread Chat 的解法：**让用户划选 AI 回复里的任意一段文字，就地开启一个分支对话**。分支继承从对话开头到划选处的全部上下文；用户在分支里把这个点聊透，再回到主线继续。整个会话长成一棵树——主干是主线，枝条是分支，节点之间可回溯、可对照。这契合人「发散—收敛」的思考节奏，而不是强迫思考迁就聊天框的线性。

面向场景：AI 学习产品 v1（Chatbot 形态），「顺着一个概念层层深入」的深挖式学习。

## 2. 核心交互闭环

四个动作构成闭环（全部已实现）：

1. **划选**：在任意 AI 回复里选中文字 → 浮出迷你气泡；
2. **开分支**：确认后创建新分支，被划选文字成为该分支的「讨论焦点」，原文处留下**锚点高亮 + 脚注上标**（点击可随时重新打开该分支）；
3. **继承上下文**：分支自动继承从对话开头到分叉点的全部消息（分叉后主线与分支互不干扰）；
4. **回溯与对照**：面包屑就地回退、⌘K 会话树任意跳转、多列并排对照、画布纵览全树。

分支可以再开分支（嵌套），树可以任意深。产品要解决的核心难题：**怎么在有限的屏幕上让用户舒适地浏览和导航这棵树**——这正是所有布局设计围绕的问题。

## 3. 设计约束（原型阶段逼出来的六条硬骨头）

完整论证见 `docs/prototype-research-overview.html`（六原型对照调研），此处摘录结论：

1. **横向空间有限，而分栏假设它无限**——几乎所有分栏方案的麻烦根子都在这。
2. **人的对照带宽只有 3–4 列**——「把 7 列排整齐」是伪命题，解法是根本不让它变成 7 列。
3. **分支树是二维的，屏幕列是一维的**——一维列序天然装不下二维树（子分支插哪都不对）。
4. **Artifact 会和分栏抢横向空间**——需要独立舞台，不能每列各开。
5. **划选锚点在富文本下会失效**——Markdown 渲染让 offset 错位，工程上必须专门处理（见 §10.4）。
6. **移动端分栏不成立**——任何方案都要有降级形态（画布视图可能是移动端更优默认，见 §11）。

由此收敛的**核心原则**：不让横向空间无限扩张——给它硬上限，用「坞 / 地图 / 焦点」管理超出的部分。

## 4. 设计原则（实现过程中沉淀的，比约束更具体）

这些原则解释了代码为什么长成现在的样子，改动时请守住：

| # | 原则 | 落点 |
|---|---|---|
| P1 | **组件不拥有会话，组件只是会话的视口** | 收起一列销毁的是视图，会话仍在树里。列、画布节点、（未来的）气泡都是同一棵树的不同视口 |
| P2 | **主线不是特殊的**——它只是 `parentId = null` 的分支 | 所有视口复用同一套组件；主线仅多一个「锚定」身份（永远占第一列、不可被替换） |
| P3 | **继承的上下文是查询出来的，不是复制进去的** | fork 只记 `(parentId, forkFromMsgId)`，渲染/发请求时沿 lineage 现算（`core/selectors.ts`）。复制会导致分叉后永久失同步 + 内存爆炸 |
| P4 | **统一意图入口** | 所有「打开某会话」（脚注、⌘K、每列 ⇄、子树弹层、Artifact 定位、画布双击）收敛到 `openBranchUI(id, sourceId, hint?)`。新入口永远不用重新理解布局规则 |
| P5 | **约束消灭混乱，而不是算法整理混乱** | 列数硬上限（3–4），超出的分支不消失：替换（面包屑回退+撤销）或折叠成细条。放置规则做成**纯函数策略**（`placement.ts`），方案⑤/⑥是同一套代码的两个配置 |
| P6 | **不打断思考流** | 分支自动生成标题；开分支零确认（放置控制是可选把手不是关卡）；拒绝「AI 主动建议开分支」 |
| P7 | **预览不撒谎** | 划选气泡里的「将替换/将折叠」预览与提交共用同一个 `place()` 函数（`previewPlacement` 用哨兵 id 跑同一套规则），结构性保证一致 |
| P8 | **默认零成本，控制分层递进** | 「打开到哪一列」四层答案：默认规则（toast 可撤销）→ ⌘ 保留本列旁边开 → 气泡列条点选目标 → 事后 ⌘K/⇄ 修复。每层不挡下一层 |
| P9 | **mutation 收敛在非 React 代码里** | 会话树是外部可变 store（`core/store.ts`），组件经 `useSyncExternalStore` 以 version 快照订阅。这也是全仓库 eslint（react-hooks v6 / React Compiler 系规则）零豁免通过的关键 |
| P10 | **视图状态不进领域模型** | 列槽/宽度/画布 pin/最近访问归编排层或视图宿主；`ThreadTreeState` 只有树本身（纯 JSON 可序列化，为持久化留好了路） |

## 5. 方案演进史（怎么走到今天的）

原型阶段做了六个布局方案（①基础分栏 / ②侧栏面包屑 / ③横条管理 / ④竖栏树 / ⑤限栏细条 / ⑥自适应替换，对照表见 `docs/prototype-research-overview.html`），选定 **方案⑥（自适应 2–4 列 + 列满面包屑替换）** 作为基座——最贴合「层层深入」的学习场景，同时把 ⑤ 作为策略保留。原始原型 HTML 见 `docs/prototype-6-responsive.html`。

在此基座上的六步演进（= PR #12 的六个 commit）：

| Commit | 主题 | 解决的问题 |
|---|---|---|
| `f671a16` | 方案⑥优化版 | 原型的「指定打开某一会话」太弱：新增 ⌘K 会话树（搜索/最近访问/键盘导航）、每列 ⇄ 切换器、列满替换改为「来源列优先，无来源替换 LRU」+ toast 撤销；移除「带回主线」（低价值，后置）；新增 Artifact 右侧抽屉舞台 |
| `9197740` | 四层架构重构 | 从单文件命令式 demo 拆为 core/chat/branching/orchestration 四层（§7）；「列满怎么办」抽成策略并实现**细条⑤**为第二策略；每列新增「子分支」按钮 + 子树弹层 |
| `9c17d1a` | 列宽拖拽 | 相邻列间分割线零和拖拽（pointer capture + rAF 直写 DOM，拖拽期零 React 渲染）、键盘可调、双击均分（FLIP 过渡）；宽度随槽位转移 |
| `80e3aa5` | 铺满 + 阅读通道 | 列级 max-width 导致宽屏两侧留白 → 列行永远铺满视口（flex-basis 模型），760px 最大宽下沉为列内居中的 `.lane` 阅读通道 |
| `24a41da` | 画布模式 Phase 1 | flowith 式无限画布作为**第二个视图层**：React Flow + dagre 树布局、一会话一卡片、拖拽 pin、双击回列（懒加载，列模式不背包体） |
| `1a7925a` | 放置控制 | 「开分支到哪一列」的用户控制：⌘/Ctrl =「保留本列，在旁边打开」（对齐浏览器 Cmd+click 心智）+ 气泡迷你列条点选让位列（非阻断，接受默认零成本） |

## 6. 现在做成的样子（功能全景）

### 6.1 列视图（默认）

- **自适应列数**：约每 430px 一列，clamp 2–4，可顶栏强制；窗口变窄从左裁列。
- **列满策略**（顶栏可切）：
  - **替换⑥**（默认）：替换来源列（深钻语义）/ 无来源替换最久未用列；toast 一键撤销；
  - **细条⑤**：不替换——最久未用的展开列原地折成 30px 竖直细条（深度色缘 + 竖排标题 + 脚注徽章），点击原地展开，细条不计入上限。
- **放置控制**：⌘/Ctrl + 点「开启分支」或脚注 = 保留本列、新会话开在紧邻右侧（按住时按钮文案实时切换）；气泡底部**迷你列条**显示将被替换/折叠的列（hover 看标题），点选可改目标。行为矩阵：

  | 局面 | 默认 | ⌘ keepSource | 列条 override |
  |---|---|---|---|
  | 有空位 | 追加到最右 | 紧邻来源右侧插入 | 直接替换点选列 |
  | 替换⑥满 | 替换来源列 | 替换邻右；来源最右→除来源外 LRU | 替换点选列 |
  | 细条⑤满 | 折叠 LRU | 折叠候选严格排除来源 | 折叠点选列 |

- **列宽**：min 340px；相邻列分割线拖拽（1:1 跟手）、聚焦后 ←/→ 每次 24px、双击整行回均分；内容在列内 760px `.lane` 通道居中，列行永远铺满视口。
- **每列头部**：面包屑（lineage 就地回退）、L 深度徽章、⑂ 子分支弹层（以本列为根的子树）、⇄ 切换器（把本列换成任意会话，目标在别列时交换两列）、收起。
- **⌘K 会话树**：搜索标题/划选原文、最近访问 chips、↑↓⏎ 键盘导航、行内标注所在列。
- **Artifact 抽屉**：右侧滑出的全局唯一舞台，标签页管理、深度色圆点标来源、「定位来源会话」反向跳转；分支产出 artifact 时自动弹出。
- **视觉语言**：手稿批注风（paper/ink）+ 脚注式分支标记 + 深度分色（`--d1..--d5` 循环，L1 绿 / L2 金 / L3 红 / L4 蓝 / L5 紫）。

### 6.2 画布视图（Phase 1，只读）

顶栏「视图：列 | 画布」切换。一个会话一张卡（标题/讨论焦点/末条摘要/消息与 Artifact 计数），dagre 自上而下树布局，边按子深度着色并带脚注徽章；pan/zoom/fitView/MiniMap；拖动节点即 pin（树变化只重排未 pin 的），「重新排列」一键复位；**双击节点回列模式打开**（走 P4 统一意图）。React Flow 经 `next/dynamic({ssr:false})` 懒加载。

### 6.3 操作速查

| 操作 | 方式 |
|---|---|
| 开分支 | 划选 AI 回复文字 → 气泡「开启分支讨论」 |
| 保留本列在旁边开 | ⌘/Ctrl + 点气泡按钮或脚注 |
| 指定让位列 | 气泡迷你列条点选 |
| 重开已有分支 | 点正文锚点高亮 / 脚注上标 |
| 任意跳转 | ⌘K 搜索会话树 |
| 本列换会话 / 看子树 | 列头 ⇄ / ⑂ |
| 回退 | 面包屑任意一级；替换类 toast 内「撤销」 |
| 调列宽 | 拖分割线；双击均分；聚焦后 ←/→ |
| 全树纵览 | 顶栏切「画布」；双击节点回列 |

## 7. 架构

### 7.1 四层总览

**横向分层，不是组件套娃**。每层管一个独立的轴：

```
┌────────────────────────────────────────────────────────────┐
│ thread-chat-demo.tsx 顶层壳：状态编排 + 各层拼装 + 统一意图      │
├────────────────────────────────────────────────────────────┤
│ orchestration/  编排层（视图形态；两个平级视图层可插拔）           │
│   列视图: thread-columns + placement(策略) + use-column-resize │
│   画布视图: thread-canvas + canvas-node + use-canvas-layout    │
│   共享: thread-switcher(⌘K/⇄/子树三模式) + artifact-drawer     │
├────────────────────────────────────────────────────────────┤
│ branching/  分支装饰层：锚点/脚注渲染注入、面包屑/焦点/继承上文头、  │
│             selection-bubble(划选气泡+迷你列条)。只发意图回调      │
├────────────────────────────────────────────────────────────┤
│ chat/  单会话视图 ChatView：消息列表+composer。不知道树/列/分支。  │
│        renderAssistantBody / renderAfterMessage / header /     │
│        banner / intro 全部是插槽                                │
├────────────────────────────────────────────────────────────┤
│ core/  headless 会话树（纯 TS，不 import React）：               │
│        types + store(外部可变+订阅) + selectors(纯函数派生)      │
└────────────────────────────────────────────────────────────┘
```

对应的设计模式：core=状态与视图分离（headless）；chat=组合+插槽（compound/slots）；branching=装饰器；placement=策略模式；openBranchUI=命令/意图收敛。

### 7.2 文件地图

```
app/thread-chat/
├── page.tsx                  # server 壳（metadata）
├── thread-chat-demo.tsx      # 顶层壳：viewMode、openBranchUI、toast、Esc 链、⌘K
├── data.ts                   # 【演示数据】写死内容——接真实模型时整体退役（§10）
├── theme.ts                  # 深度→颜色映射 dc/dvar/accentOf/dotColorOf
├── thread-chat.css           # 全部样式，收敛在 .tc 作用域（§8）
├── core/
│   ├── types.ts              # Thread / Message / Fork / Artifact / ThreadTreeState
│   ├── store.ts              # createThreadStore：可变树 + subscribe/version；fork/send/touch
│   ├── selectors.ts          # lineage / collectInherited / allTreeRows / subtreeRows / lruIndex
│   └── use-thread-store.ts   # 唯一 React 绑定：useSyncExternalStore(version 快照)
├── chat/chat-view.tsx
├── branching/
│   ├── branchable-chat.tsx   # 装饰：头部/横幅 + 锚点脚注渲染 + artifact 卡片注入
│   └── selection-bubble.tsx  # document 级划选监听 + 气泡 + ⌘ 跟踪 + 迷你列条
├── orchestration/
│   ├── placement.ts          # 纯函数策略：replace⑥/fold⑤ + PlacementHint + previewPlacement
│   ├── thread-columns.tsx    # 列槽编排 useColumnSlots + ColumnShell/FoldedStrip/ColumnResizer
│   ├── use-column-resize.ts  # 分割线拖拽（rAF 直写）/键盘/双击 FLIP
│   ├── thread-switcher.tsx   # global(⌘K) / column(⇄) / subtree(⑂) 三模式共用行渲染
│   ├── artifact-drawer.tsx
│   ├── thread-canvas.tsx     # React Flow 容器（懒加载入口）
│   ├── canvas-node.tsx       # 会话卡片节点
│   └── use-canvas-layout.ts  # state→nodes/edges 派生 + dagre + pin
└── docs/                     # 本目录：调研文档与原型（见 §12）
```

首页注册：`app/_homepage/demos.tsx` + `app/_homepage/thumbs/thread-chat.tsx`。

### 7.3 数据模型（core/types.ts）

```ts
Thread {                          // 「会话」——主线与分支同构（P2）
  id, parentId,                   // 树结构；main 的 parentId = null
  depth,                          // 0=主线；决定深度配色
  title,                          // 自动生成（锚点文字截断，P6）
  anchorText, forkFromMsgId,      // 讨论焦点 = 从父会话哪条消息的哪段文字分叉
  footnote,                       // 全局递增脚注号（原文标记与各视图徽章共用）
  children: string[],
  messages: Message[],
  lastActive,                     // 活跃计数（LRU 放置依据）
}
Message { id, role: "user"|"assistant", text, forks: Fork[], artifactIds? }
Fork    { text, num, threadId, depth }   // 挂在消息上的「划选锚点→子会话」有向边
ThreadTreeState { threads, artifacts, artifactOrder, recents, footnoteCounter, seq, tick }
```

注意：`ThreadTreeState` 是纯 JSON（无 Map/类实例）——持久化/传输零成本。锚点渲染当前按 `text.indexOf(fork.text)` 顺延匹配定位（见 `branchable-chat.tsx` 的 `computeRanges`），富文本下的鲁棒定位是接入真实模型前必须解决的（§10.4）。

### 7.4 关键机制

- **version 快照订阅**：store 原地修改、对象引用永不变化；每次 mutate `version++` 并 notify，组件用 `useSyncExternalStore` 以 version 为快照。**派生 memo 必须以 version 为 key**（state 引用不变，依赖它的 useMemo 不会失效）——画布的 `use-canvas-layout.ts` 是范例。
- **placement 纯函数策略**：`place(mode, slots, threadId, ctx) → { slots, effect }`；effect（appended/replaced/folded/visible）交给壳层做 toast 与撤销。`PlacementHint{keepSource, targetId}` 两级覆盖默认规则。`previewPlacement` 用哨兵 id 跑同一函数（P7）。
- **列宽体系**：显式宽度渲染为 `flex: 1 1 <px>`（basis 承载、grow/shrink 保留 → 行恒铺满）；**commit 以整行为单位**（basis 总和==容器时解算才逐列等于所存值，否则提交瞬间跳变）；宽度条目**随槽位**转移（替换/⇄ 给新会话、swap 交换、收起清除、fold 保留）。拖拽期间 rAF 直写 DOM、零 setState；程序性变宽（双击均分）走 `.cols.easing` CSS 过渡 + FLIP。
- **跨挂载的视图状态宿主**：画布 pin 表需跨「列⇄画布」切换存活，但画布组件按需卸载 → 壳层 `useState(() => ({pins: new Map()}))` 造一个长寿可变宿主对象，hook 读写镜像（与壳层持有 store 同一模式；type-only import 不污染首屏 bundle）。
- **Esc 逐层关闭**：划选气泡 → 切换器/弹层 → 抽屉，一次一层。
- **懒加载边界**：React Flow 及样式只随画布 chunk 落地。

## 8. 工程约定

- **样式**：全部收敛在 `.tc` 作用域（防跨路由污染），设计 token 是 `.tc` 上的 CSS 变量（`--paper/--ink/--d1..5/--col-min/--lane-max`）。`prefers-reduced-motion` 全局降级已配。
- **包管理**：仓库用 **pnpm**（`pnpm-lock.yaml` 是唯一锁文件）。加依赖必须 `pnpm add`，否则部署挂。当前新增依赖仅 `@xyflow/react` 与 `@dagrejs/dagre`。
- **Lint**：eslint react-hooks v6（React Compiler 系规则）**零豁免**通过。守住的写法：mutation 进 core 的非 React 代码（P9）；渲染期不读写 ref；「渲染期间调整派生状态」代替 effect-setState（thread-columns 的裁列是范例）。
- **验证基线**（每次改动后都应全绿）：`npx tsc --noEmit`、`npx eslint app/thread-chat`、`npm run build`、四套 E2E（§9）。

## 9. 测试：E2E 套件（`/e2e/thread-chat/`，147 断言）

纯 Node + playwright-core 脚本（无测试框架依赖），运行方式见 `e2e/thread-chat/README.md`：

| 套件 | 断言数 | 覆盖 |
|---|---|---|
| verify2.js | 40 | 核心回归：开分支/脚注/列满替换+撤销/⌘K/⇄/抽屉/细条⑤/子树/发消息/窄屏 |
| verify3.js | 42 | 列宽体系：拖拽零和/clamp/双击均分/键盘/铺满无 gutter/lane 居中/宽度随槽位 |
| verify4.js | 31 | 画布：懒加载/节点边数/脚注 label/双击回列/拖拽 pin 跨模式/重排/⌘K 跨模式 |
| verify5.js | 34 | 放置控制：⌘ 插入与邻右替换/LRU/列条目标迁移与文案三态/override/fold+⌘ |

约定：verify2/3/4 是回归契约——**新功能不许改它们**（放置控制、画布都是在不动旧套件的前提下加新套件验收的）。改了行为语义才允许改对应套件，并在 commit message 里说明。

## 10. 接入真实模型的路线图（下一步的主线工作）

架构为此留好了接缝，改动集中在 core 与 data，四层边界不动：

1. **`core/store.ts` 的 `fork` / `send` 改异步流式**。现在两者同步写入 canned 文本；真实版：
   - `send(threadId, userText)`：先推 user 消息 + 一条 `pending` assistant 消息，流式 chunk 到达时追加其 `text` 并 `notify()`（version 快照模型天然支持高频更新，必要时 rAF 节流 notify）；
   - `fork(...)`：创建分支后同样走一次模型调用生成首条回复（首条消息策略见下）；
   - `Message` 增加 `status: "pending" | "streaming" | "done" | "error"`，ChatView 渲染打字机/重试态（改 `chat/chat-view.tsx` 的消息渲染即可，插槽结构不动）。
2. **上下文构造 = P3 的直接兑现**：发请求时用 `collectInherited(state, thread)` + 本分支消息拼 messages 数组；分叉点之前的父线内容天然进入，之后的天然隔离。system prompt 中注入 `anchorText`（「本分支的讨论焦点是用户划选的这段话：…」）。注意调研文档的「上下文腐烂」提醒：树很深时对继承段做截断/摘要策略。
3. **`data.ts` 退役**：`CANNED/REPLIES/ARTIFACT_SEEDS/cannedIntro/cannedReply` 全部删除；`seedStore()` 换成空主线或从持久层加载。顶栏「回复写死」pill 移除。
4. **划选锚点鲁棒定位（约束五，工程第一硬骨头）**：真实模型输出是 Markdown，渲染后 DOM 文本与源文本 offset 错位。方案方向：存「文本片段 + 前后各 N 字上下文」做模糊定位（W3C Web Annotation 的 TextQuoteSelector 思路），替换现在的 `indexOf` 顺延；`computeRanges` 是唯一需要动的地方。
5. **分支自动标题**：现在取锚点前 13 字；真实版可在首答完成后让模型出 4–8 字标题（异步更新 `thread.title`，各视图自动跟随）。
6. **持久化**：`ThreadTreeState` 纯 JSON——序列化到后端/localStorage 均可；恢复时 `createThreadStore(loadedState)` 即可。多会话（多棵树）需要在壳层之上加会话列表路由，store 按会话实例化。
7. **Artifact**：把「锚点命中话题→种子」换成模型工具调用产出（`registerArtifact` 接口已预留）。

## 11. 未决问题与后续方向

- **气泡内轻量对话**（调研中）：划选后在气泡里直接输入并完成快速问答、可升格为完整分支——P1「气泡也是视口」的自然延伸。涉及 fork 首条消息策略：空分支 / 自动首问 / 用户带问开分支（当前 demo 是「自动引导回复」变体）。
- **画布 Phase 2/3**：节点内继续对话、画布内划选开分支、artifact/图片类混合内容节点（拆解见 `docs/canvas-mode-research.md` §6）。
- **移动端形态**：分栏在手机上不成立；调研判断**画布 + fitView 可能是移动端更优默认视图**（pan/zoom 是天然手势），或降级为原型②的单栏面包屑钻取。
- **⑤ vs ⑥ 的最终取舍**：两策略已是运行时开关，等真实使用数据（分支深度分布、兄弟对照频率）定夺。
- **跨会话记忆/分支沉淀为知识库**：调研文档「下一步」第 4 条，数据模型已亲和（树即知识结构）。

## 12. 相关文档与产物

| 位置 | 内容 |
|---|---|
| `docs/prototype-research-overview.html` | 原始交互调研：动机、六约束、六原型对照表、下一步问题（本项目的「宪法」） |
| `docs/prototype-6-responsive.html` | 方案⑥的原始单文件 HTML 原型（本实现的起点，可直接浏览器打开对照） |
| `docs/canvas-mode-research.md` | 无限画布模式技术调研：选型（React Flow vs tldraw vs konva）、路由与状态共享、Phase 1–3 拆解 |
| `/e2e/thread-chat/` | 四套 E2E 断言脚本 + 运行说明 |
| PR #12 | 六个 commit 的完整演进记录，每个 commit message 都写明了动机与验证 |
