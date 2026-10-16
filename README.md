<div align="center">

<img src="app/favicon.ico" width="56" height="56" alt="playground logo" />

# playground.zilin.im

**Interaction patterns for the AI era.**

A UI/UX lab for designers, developers and founders — 46 hands-on demos exploring what product interaction should feel like in the age of AI agents.

**English** · [简体中文](./README.zh-CN.md)

[![Live](https://img.shields.io/badge/live-playground.zilin.im-6366f1?style=flat-square)](https://playground.zilin.im)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](#-license)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## ✨ Highlights

- **46 self-contained demos** — each route is an independent, copy-friendly experiment.
- **Agent-first UX** — composers, branching chats, onboarding cards, voice widgets, shimmer & scan effects.
- **Motion & polish** — dynamic island, floating dock, border beams, squircle corners, fluid text.
- **Data viz playground** — TradingView Lightweight Charts, Reaviz, Recharts, live streaming charts.
- **GPU shaders** — Paper Shaders gallery and flowing-light effects.

## 🧭 Demo Gallery

| Category | Count | Examples |
| --- | :-: | --- |
| **Agent UX/UI** | 9 | [Devin Composer](app/devin-composer) · [Prompt Composer](app/prompt-composer) · [Thread Chat](app/thread-chat) · [Voice Chat Widget](app/voice-chat-widget) · [Onboarding](app/onboarding) · [Scan Border](app/scan-border) |
| **Interaction** | 15 | [Dynamic Island](app/dynamic-island) · [Floating Dock](app/floating-dock) · [Floating Menu](app/floating-menu) · [Share Dialog](app/share-dialog) · [Border Beam](app/border-beam) · [Glyph](app/glyph) · [Smooth Tooltip](app/smooth-tooltip) |
| **Explored Demo** | 22 | [LWC Trading Terminal](app/lwc-terminal) · [Reaviz charts](app/reaviz-stock-compare) · [Metrix Dashboard](app/metrix-dashboard) · [Paper Shaders](app/shaders) · [Highlight Recovery](app/highlight-recovery) · [Squircle Corners](app/squircle-corners) · [Floating Popup](app/floating-popup) |

The full, filterable list lives on the [homepage](https://playground.zilin.im) (data source: [`app/_homepage/demos.tsx`](app/_homepage/demos.tsx)).

## 🚀 Quick Start

Requires Node.js 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev      # http://localhost:3080
```

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server on port **3080** |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint (`eslint-config-next`, core-web-vitals) |

## 🗂 Project Structure

```text
app/
├── page.tsx              # Landing page
├── _homepage/            # Hero, demo grid, thumbnails, demo registry
├── _article/             # Shared layout for long-form demo pages (MDX)
├── <demo-name>/          # One folder per demo (kebab-case route segment)
└── globals.css           # Global styles & Tailwind tokens
components/ui/            # Shared shadcn/ui primitives
shanghai-station-map/     # Standalone Vite sub-project (MapLibre + Protomaps)
e2e/                      # Playwright specs (e.g. thread-chat)
public/                   # Static assets
```

## ➕ Adding a Demo

1. Create `app/<demo-name>/page.tsx` (add `'use client'` only if hooks or browser APIs are needed).
2. Add a thumbnail in `app/_homepage/thumbs/`.
3. Register it in [`app/_homepage/demos.tsx`](app/_homepage/demos.tsx) with title, description, route, category and tags.
4. Run `pnpm lint` before committing.

## 🧱 Tech Stack

- **Framework** — Next.js 16 (App Router), React 19, TypeScript
- **Styling** — Tailwind CSS 4, shadcn/ui, Radix UI, Base UI, `tw-animate-css`
- **Motion** — Framer Motion, CSS animations, Paper Shaders
- **Charts** — lightweight-charts, Reaviz, Recharts, Liveline
- **Editor** — Tiptap
- **Content** — MDX (`@next/mdx`)

## 🤝 Contributing

Conventional commits (`feat:`, `fix:`, `refactor:`), scoped diffs, and a short test plan in PRs. See [`AGENTS.md`](AGENTS.md) for the full repository guidelines.

## 📄 License

[MIT](https://opensource.org/licenses/MIT). Source code is provided for learning and reference only. Copyright of derived or third-party demos remains with their original authors and organizations (e.g. [`app/prompt-composer/LICENSE.beautiful-ui`](app/prompt-composer/LICENSE.beautiful-ui)).

---

<div align="center">
Made with ♥ by <a href="https://github.com/hifizz">@hifizz</a>
</div>
