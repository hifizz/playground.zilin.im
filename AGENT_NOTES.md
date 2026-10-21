# AGENT_NOTES

## 项目简介

`playground.zilin.im` 是一个基于 **Next.js 16（App Router）+ React 19 + TypeScript** 的前端 UI/交互实验项目（UI/UX 实验室），收录各类交互 Demo。样式体系为 Tailwind CSS 4 + shadcn/ui，包管理器使用 pnpm。

## 目录结构

- `app/` — Next.js App Router 根目录。`layout.tsx`、`page.tsx`、`globals.css` 为全局入口；其余每个子目录是一个独立 Demo 路由（如 `calc/`、`thread-chat/`、`dynamic-island/`、`dialog/`、`minimap/` 等）。下划线前缀的目录不参与路由，存放共享实现：
  - `app/_homepage/` — 首页：hero、demo 卡片与网格、`demos.tsx` 清单、`thumbs/` 各 Demo 的缩略图组件。
  - `app/_article/` — 文章/文档页的共用布局、目录（TOC）、排版样式与字体。
  - `app/_lwc/` — lightweight-charts 系列 Demo 的共用外壳（`chart-shell.tsx`）与说明。
  - `app/_reaviz/` — reaviz 图表 Demo 的共用数据。
  - `app/components/` — 共享 UI 组件（目前为 Modal 系列）。
- `components/ui/` — shadcn/ui 生成的通用基础组件（button、dialog、card、calendar 等）。
- `hooks/` — 自定义 hooks（如 `use-mobile.ts`）。
- `lib/` — 工具函数与共享数据（`utils.ts` 中的 `cn()`、`lwc-data.ts`）。
- `public/` — 静态资源（图标、示例 HTML 等）。
- `e2e/` — 端到端验证脚本（`e2e/thread-chat/` 为基于 playwright-core 的独立断言脚本，不属于主依赖）。

## 关键配置

- `package.json` — 依赖与脚本定义；主要依赖含 radix-ui、@base-ui/react、framer-motion、recharts/reaviz/lightweight-charts、tiptap 等。
- `next.config.ts` — Next.js 配置，接入 `@next/mdx`（remark-frontmatter、rehype-slug 等插件），支持 `.md/.mdx` 页面。
- `tsconfig.json` — TypeScript 严格模式，`@/*` 路径别名指向仓库根。
- `components.json` — shadcn/ui 配置（组件别名 `@/components/ui`、工具 `@/lib/utils`，图标库 lucide）。
- `app/globals.css` — Tailwind 4 入口与全局主题 token（CSS 变量）。

## 常用命令

```bash
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器（端口 3080）
pnpm build     # 生产构建
pnpm start     # 运行生产构建
pnpm lint      # ESLint 检查
```
