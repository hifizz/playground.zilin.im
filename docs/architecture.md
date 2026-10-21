# playground.zilin.im 架构说明

## 1. 项目定位与功能

`playground.zilin.im` 是一个基于 **Next.js 16、React 19、TypeScript 与 Tailwind CSS** 的交互式 UI / 前端技术实验场。项目首页将各个实验以卡片网格形式汇总，用户可进入独立路由体验对应的原型、动效或可视化页面。

根目录的 `README.md` 保留了 create-next-app 的基础启动、学习和部署说明；结合实际目录与依赖，项目的主要功能包括：

- **交互动效与组件探索**：如 Dynamic Island、通知栈、分享弹窗、浮动 Dock、边框光束、扫描边框、文本闪光、平滑 Tooltip 等；多数使用 CSS 动画或 Framer Motion。
- **Agent / 对话体验探索**：包括 Claude 风格聊天界面、语音聊天组件，以及重点的 Thread Chat 分支对话原型。
- **数据与图表实验**：包含股票盈亏计算、SVG 股票面板、`lightweight-charts` 的行情与交易终端示例、Reaviz 图表和 Liveline 实时折线图。
- **内容与编辑能力实验**：包括带上传能力的 Tiptap 编辑器、MDX 页面支持、文章布局及目录组件。
- **移动端与视觉效果验证**：例如移动端全屏视口适配、Shader 效果，以及各种布局、导航和高亮交互方案。

开发服务器由 `pnpm dev` 启动（实际脚本指定端口 `3080`）；此外提供 `pnpm build`、`pnpm start` 与 `pnpm lint` 命令。

## 2. 总体架构

项目使用 Next.js **App Router**。`app/` 下的目录通常直接对应 URL 路由，每个演示通过目录中的 `page.tsx`（或 `page.mdx`）作为入口。首页仅负责展示和筛选演示目录，具体交互逻辑按演示收敛在各自的路由目录中。

```text
浏览器
  │
  ├─ /                         首页：Hero + 演示卡片网格
  │     └─ app/_homepage/demos.tsx  演示元数据、分类、路由与缩略图
  │
  └─ /<demo-route>              独立演示路由
        ├─ page.tsx / page.mdx   路由入口
        ├─ 本地组件、样式与数据   演示实现
        └─ 可选 hooks / docs      特定技术说明或调研资料

跨页面基础设施
  ├─ app/layout.tsx             全局布局、字体、Metadata 与兼容性样式
  ├─ app/globals.css            全局样式
  ├─ components/ui/             通用 shadcn 风格 UI 基元
  ├─ lib/                       可复用工具与图表模拟数据
  └─ public/                    静态资源
```

全局根布局 `app/layout.tsx` 负责加载 Geist 字体与全局 CSS，并设置站点元数据。该文件还包含 Reaviz / Reablocks 图表的样式兼容处理：修正空 `mask` 导致的图形隐藏问题，并为 Portal 挂载的 Tooltip 提供全局 CSS 变量。

## 3. 目录结构

```text
.
├── app/                         # App Router 路由、页面及页面私有模块
│   ├── page.tsx                 # 首页入口，复用 _homepage
│   ├── layout.tsx               # 根布局、字体和全局元数据
│   ├── globals.css              # 全局样式
│   ├── _homepage/               # 首页展示层（非路由目录）
│   ├── _article/                # MDX 文章布局、目录及演示组件
│   ├── components/Modal/        # 项目内的 Modal 实现及管理器
│   ├── thread-chat/             # 分支对话原型（独立的分层子系统）
│   ├── shaders/                 # Shader 页面及各视觉效果分区
│   ├── mobile-fullscreen/       # 移动端视口适配实验与文档
│   ├── editor-with-upload/      # Tiptap 编辑器、上传与局部样式
│   ├── liveline/                # 实时折线图演示
│   ├── lwc-*/                   # lightweight-charts 系列图表演示
│   ├── reaviz-*/                # Reaviz 系列图表演示
│   └── <其他演示目录>/           # 每个目录一般映射一个独立 URL
├── components/ui/               # 通用 UI 组件库（button、dialog、tabs 等）
├── hooks/                       # 跨页面 React Hook，例如 use-mobile
├── lib/                         # 工具函数、lightweight-charts 模拟数据与指标计算
├── public/                      # logo、SVG 等可直接访问的静态文件
├── e2e/thread-chat/             # Thread Chat 的验证脚本与说明
├── docs/                        # 仓库级文档（本文件位于此处）
├── mdx-components.tsx           # MDX 全局组件映射
├── next.config.ts               # Next.js 与 MDX 插件配置
├── package.json                 # 脚本与依赖定义
└── tsconfig.json                # TypeScript 配置
```

说明：以 `_` 开头的 `app/_homepage`、`app/_article` 等目录用于组织可复用的页面私有模块，不作为独立路由入口；实际页面路由由包含 `page.tsx`、`page.mdx` 等文件的目录提供。

## 4. 关键模块

### 4.1 首页与演示注册：`app/_homepage/`

首页入口 `app/page.tsx` 直接导出 `app/_homepage` 的 `HomePage`。首页由以下模块组成：

- `hero.tsx`：站点首屏信息；
- `demos-grid.tsx`：演示卡片列表和分类筛选展示；
- `demo-card.tsx`：单个演示卡片；
- `demos.tsx`：演示注册表，维护标题、描述、路由、分类、标签与预览节点；
- `thumbs/`：每个演示对应的轻量缩略图组件。

新增演示时，通常需要新增路由目录和缩略图组件，并在 `demos.tsx` 注册，这样首页才会发现并展示该演示。

### 4.2 独立演示路由：`app/<feature>/`

大多数功能采取“路由目录自包含”的实现方式：`page.tsx` 是页面入口，复杂演示在同目录放置组件、CSS、数据、Hooks 或说明文档。例如：

- `editor-with-upload/` 将编辑器、图片上传逻辑和 `editor.css` 放在一起；
- `mobile-fullscreen/` 拥有专用 layout、视口 Hook 与技术笔记；
- `shaders/` 通过 `sections/` 将不同 Shader 展示拆分；
- `lwc-*` 和 `reaviz-*` 按图表场景分离页面，便于单独验证不同图表能力。

这种结构降低了不同实验之间的耦合：一个 Demo 的样式或交互改动通常不会影响其他路由。

### 4.3 文章与 MDX 支持：`app/_article/`、`mdx-components.tsx`

项目在 `next.config.ts` 中通过 `@next/mdx` 扩展页面类型，支持 `.md` / `.mdx` 作为路由页面；配置同时启用：

- `remark-frontmatter` 与 `remark-mdx-frontmatter`：读取文章 Front Matter；
- `rehype-slug`：为标题生成锚点 ID。

`app/_article/` 提供 `ArticleLayout`、`ArticleToc`、`Demo`、`DemoFrame` 等文章呈现组件；根目录 `mdx-components.tsx` 将这些组件映射给 MDX 渲染系统。该机制用于兼顾文字说明、目录导航与内嵌交互 Demo。

### 4.4 通用 UI 与基础能力：`components/`、`hooks/`、`lib/`

- `components/ui/`：一组可复用的通用 UI 基元，覆盖 Button、Dialog、Popover、Tabs、Table、Tooltip 等常用控件。
- `app/components/Modal/`：项目定制的 Modal 及 `modalManager.ts`，与通用 UI 目录并存。
- `hooks/use-mobile.ts`：面向响应式场景的共享 Hook。
- `lib/utils.ts`：通用工具函数。
- `lib/lwc-data.ts`：面向 `lightweight-charts` 的确定性模拟数据、K 线/成交量转换、实时 tick 流、布林带、MACD 和订单簿数据生成工具。确定性随机数据有助于 SSR 与 CSR 输出一致，避免 hydration 差异。

### 4.5 Thread Chat：`app/thread-chat/`

Thread Chat 是仓库中分层最明确的复杂原型：用户可划选 AI 回复文字并创建继承上下文的分支，使线性聊天扩展为可导航的会话树。当前回复内容由 `data.ts` 提供演示数据，尚未接入真实模型。

其核心结构为：

```text
thread-chat-demo.tsx            顶层状态编排、视图切换与统一打开分支意图
├── core/                       无 React 依赖的会话树领域层
│   ├── types.ts                Thread、Message、Fork、Artifact 等数据类型
│   ├── store.ts                外部可变 Store；集中处理 fork、send、touch 等变更
│   ├── selectors.ts            lineage、继承上下文、子树、LRU 等纯派生逻辑
│   └── use-thread-store.ts     通过 useSyncExternalStore 与 React 对接
├── chat/                       单会话消息列表与输入区；不感知树或列布局
├── branching/                  划选气泡、锚点高亮、脚注及分支上下文装饰
└── orchestration/              视图编排层
    ├── thread-columns.tsx      多列会话视图与列槽管理
    ├── placement.ts            满列后的替换/折叠放置策略
    ├── thread-switcher.tsx     全局搜索、列切换和子树切换
    ├── artifact-drawer.tsx     Artifact 抽屉舞台
    ├── thread-canvas.tsx       React Flow 画布视图
    └── use-canvas-layout.ts    dagre 树布局与节点 pin 状态
```

该模块的关键原则是：领域会话树与列宽、列槽、画布位置等视图状态分离；会话上下文通过父链和分叉点动态派生，而不是在创建分支时复制消息。`core/store.ts` 将可变操作集中在非 React 代码中，再由 `useSyncExternalStore` 通知界面更新。

### 4.6 图表、动画与外部库集成

项目按实验目标引入多类前端库：

- `framer-motion`：交互动效、布局过渡和弹簧效果；
- `lightweight-charts`：行情、K 线、实时流和交易终端类 Demo；
- `reaviz`：统计及业务图表；
- `liveline`：实时折线图；
- `@xyflow/react` 与 `@dagrejs/dagre`：Thread Chat 会话树画布与自动布局；
- `@tiptap/*`：富文本编辑器；
- `@paper-design/shaders-react`：Shader 视觉效果；
- `lucide-react`、Radix / Base UI、shadcn 相关组件：图标和基础交互组件能力。

## 5. 数据流与渲染边界

1. **页面级路由**：Next.js 根据 `app/` 中的路由目录加载对应页面；服务器组件可直接承担静态结构和元数据。
2. **交互边界**：涉及浏览器 API、动画、图表或本地状态的组件在需要时使用客户端组件能力；复杂逻辑优先保留在各 Demo 内部，避免污染全局。
3. **首页数据流**：`demos.tsx` 作为静态注册源，驱动 Hero 的计数与卡片网格的内容和跳转地址。
4. **图表数据流**：图表页面调用 `lib/lwc-data.ts` 等工具生成或转换模拟数据，再传给相应图表库渲染。
5. **Thread Chat 数据流**：演示种子数据进入 `core` 状态树；`selectors` 派生继承上下文和树关系；`orchestration` 将领域数据映射为列视图或画布视图；用户划选、创建分支、发送消息等事件最终由 Store 方法完成状态修改。

## 6. 配置、静态资源与质量检查

- `next.config.ts`：声明 MDX 页面扩展并配置 MDX 编译插件。
- `tsconfig.json`：TypeScript 编译与路径配置。
- `eslint.config.mjs`：ESLint 配置；可使用 `pnpm lint` 检查代码规范。
- `postcss.config.mjs`、`components.json`：Tailwind 和组件工具链配置。
- `public/`：存放不经模块打包、以站点绝对路径访问的静态资源。
- `e2e/thread-chat/`：保存 Thread Chat 相关验证脚本和使用说明，是该复杂原型的辅助验证材料。

## 7. 开发扩展建议

- 新增普通 Demo 时，优先创建 `app/<route>/page.tsx`，将专有组件与样式放在同一路由目录；随后在 `app/_homepage/demos.tsx` 和相应 `thumbs/` 中注册首页入口。
- 可复用于多个页面的 UI 应放入 `components/ui/`、`hooks/` 或 `lib/`；仅服务于单个页面的实现不要过早提升到全局目录。
- 新增文章型内容时，可使用 `.mdx` 页面和 `app/_article/` 提供的布局组件。
- 修改 Thread Chat 时，应保持 `core` 的无 React 依赖特性，避免将列槽、画布 pin 等纯视图状态写入会话树领域模型。
- 提交前至少执行 `pnpm lint`；涉及构建配置或路由改动时，额外执行 `pnpm build`。
