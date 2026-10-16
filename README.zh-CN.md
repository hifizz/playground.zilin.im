<div align="center">

<img src="app/favicon.ico" width="56" height="56" alt="playground logo" />

# playground.zilin.im

**AI 时代的交互模式实验室。**

专为 designer、developer、founder 而做的 UI/UX 实验场 —— 46 个可动手把玩的 demo，研究 AI agent 时代的产品交互该长什么样。

[English](./README.md) · **简体中文**

[![Live](https://img.shields.io/badge/live-playground.zilin.im-6366f1?style=flat-square)](https://playground.zilin.im)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](#-许可)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## ✨ 亮点

- **46 个独立 demo** —— 每个路由都是一个自包含、便于复制的实验。
- **Agent 优先的交互** —— 输入框、分支对话、引导卡片、语音组件、shimmer 与扫描光效。
- **动效与细节** —— 灵动岛、悬浮 Dock、边框光束、squircle 圆角、流体文本。
- **数据可视化** —— TradingView Lightweight Charts、Reaviz、Recharts、实时流式图表。
- **GPU Shader** —— Paper Shaders 画廊与流动的光效果。

## 🧭 Demo 一览

| 分类 | 数量 | 示例 |
| --- | :-: | --- |
| **Agent UX/UI** | 9 | [Devin Composer](app/devin-composer) · [Prompt Composer](app/prompt-composer) · [Thread Chat](app/thread-chat) · [Voice Chat Widget](app/voice-chat-widget) · [Onboarding](app/onboarding) · [Scan Border](app/scan-border) |
| **Interaction** | 15 | [Dynamic Island](app/dynamic-island) · [Floating Dock](app/floating-dock) · [Floating Menu](app/floating-menu) · [Share Dialog](app/share-dialog) · [Border Beam](app/border-beam) · [Glyph](app/glyph) · [Smooth Tooltip](app/smooth-tooltip) |
| **Explored Demo** | 22 | [LWC 交易终端](app/lwc-terminal) · [Reaviz 图表](app/reaviz-stock-compare) · [Metrix Dashboard](app/metrix-dashboard) · [Paper Shaders](app/shaders) · [高亮模糊恢复](app/highlight-recovery) · [Squircle 圆角](app/squircle-corners) · [Floating Popup 定位模型](app/floating-popup) |

完整、可筛选的列表见[首页](https://playground.zilin.im)（数据源：[`app/_homepage/demos.tsx`](app/_homepage/demos.tsx)）。

## 🚀 快速开始

需要 Node.js 20+ 与 [pnpm](https://pnpm.io)。

```bash
pnpm install
pnpm dev      # http://localhost:3080
```

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器（端口 **3080**） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 运行生产构建产物 |
| `pnpm lint` | ESLint（`eslint-config-next`，core-web-vitals） |

## 🗂 目录结构

```text
app/
├── page.tsx              # 首页
├── _homepage/            # Hero、demo 网格、缩略图、demo 注册表
├── _article/             # 长文型 demo 页的共享布局（MDX）
├── <demo-name>/          # 每个 demo 一个目录（kebab-case 路由段）
└── globals.css           # 全局样式与 Tailwind token
components/ui/            # 共享的 shadcn/ui 基础组件
shanghai-station-map/     # 独立的 Vite 子项目（MapLibre + Protomaps）
e2e/                      # Playwright 用例（如 thread-chat）
public/                   # 静态资源
```

## ➕ 新增 Demo

1. 创建 `app/<demo-name>/page.tsx`（仅在需要 hooks 或浏览器 API 时加 `'use client'`）。
2. 在 `app/_homepage/thumbs/` 下添加缩略图。
3. 在 [`app/_homepage/demos.tsx`](app/_homepage/demos.tsx) 中注册：标题、描述、路由、分类、标签。
4. 提交前运行 `pnpm lint`。

## 🧱 技术栈

- **框架** —— Next.js 16（App Router）、React 19、TypeScript
- **样式** —— Tailwind CSS 4、shadcn/ui、Radix UI、Base UI、`tw-animate-css`
- **动效** —— Framer Motion、CSS 动画、Paper Shaders
- **图表** —— lightweight-charts、Reaviz、Recharts、Liveline
- **编辑器** —— Tiptap
- **内容** —— MDX（`@next/mdx`）

## 🤝 参与贡献

使用 Conventional Commits（`feat:`、`fix:`、`refactor:`），保持 diff 聚焦，PR 附简短测试计划。完整规范见 [`AGENTS.md`](AGENTS.md)。

## 📄 许可

[MIT](https://opensource.org/licenses/MIT)。源码仅供学习与参考。衍生自第三方的 demo，其版权归原作者 / 原机构所有（如 [`app/prompt-composer/LICENSE.beautiful-ui`](app/prompt-composer/LICENSE.beautiful-ui)）。

---

<div align="center">
Made with ♥ by <a href="https://github.com/hifizz">@hifizz</a>
</div>
