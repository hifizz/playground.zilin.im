# Repository Guidelines

[must] 始终用中文输出Response

## Project Structure & Module Organization

- The app uses Next.js 16 with the App Router. Route entries live in `app/` (`page.tsx` for the landing page, `app/calc` for the stock calculator, `app/mobile-fullscreen` for the viewport demo).
- Shared UI lives under `app/components/Modal` (icons, manager, modal UI). Global styles and Tailwind tokens stay in `app/globals.css`.
- Static assets go in `public/`; framework configs live at the root (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`).

## Build, Test, and Development Commands

Use `pnpm` (lockfile present):

```bash
pnpm dev    # start the Next dev server on :3000
pnpm build  # production build
pnpm start  # serve the production build
pnpm lint   # run eslint-config-next core-web-vitals checks
```

## Coding Style & Naming Conventions

- TypeScript + React function components; add `'use client'` only when client hooks or browser APIs are needed (calculators, viewport utilities).
- Use Tailwind utilities for layout/styling; update shared tokens in `app/globals.css`.
- 2-space indentation; PascalCase for components/React files, camelCase for helpers, kebab-case for route segment folders.
- Prefer absolute/aliased imports once paths exist in `tsconfig.json`; group React/Next first, then third-party, then local modules.
- Run `pnpm lint` before submitting to catch accessibility and Next best-practice issues.

## Testing Guidelines

- No automated test suite is configured yet. When adding tests, colocate `*.test.tsx` beside the component or route, or create `__tests__` under the feature folder.
- Favor React Testing Library for components and Playwright for end-to-end flows (calculator math, viewport resizing); keep fixtures small and deterministic.
- Document new test scripts in `package.json` and note required setup (e.g., mock window APIs) in PRs.

## Commit & Pull Request Guidelines

- Follow conventional commits as seen in history (`feat: ...`, `fix: ...`, `refactor: ...`; short English or bilingual scope).
- PRs include: summary, linked issues, before/after screenshots for UI, and a short test plan (commands run, browsers/devices checked).
- Keep diffs scoped; prefer separate PRs for unrelated features. Update docs (including this guide) when altering structure or commands.

## Security & Configuration Tips

- Store secrets in `.env.local`; never commit `.env*` files. Reference via `process.env` in server components or `NEXT_PUBLIC_*` for safe client exposure.
- When adding external images or fonts, whitelist domains in `next.config.ts`. Review third-party dependencies for license/size impact before adding them.
