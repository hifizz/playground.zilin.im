---
name: claude-editorial-artifact
description: Recreate Claude / Anthropic's public editorial visual language in HTML or React: the published Dark, Light, Light Gray, Mid Gray, Orange, Blue, and Green palette; warm paper-like surfaces; near-black structural fields; restrained orange and green accents; serif-led reading typography; hairline structure; and minimal motion. Use for Claude-style reports, memos, explainers, narrative product pages, knowledge artifacts, and quiet agent interfaces. Do not invent replacement brand colors, distribute proprietary assets, or claim pixel-perfect fidelity.
---

# Claude Editorial Artifact

Create calm, rigorous HTML artifacts that closely follow Claude / Anthropic's publicly documented visual language rather than introducing a new derivative theme.

This is an independent implementation, not an Anthropic product. It may reproduce public color tokens and general layout or typography relationships, but it must not copy or distribute proprietary font files, logos, illustrations, screenshots, or product assets.

## Mental model

A carefully edited research note printed on Anthropic **Light**, structured with **Dark** ink and fields, annotated sparingly with **Orange**, and supported by **Green** or **Blue** only when those accents carry meaning.

The interface moves the reader through:

**thesis → system → evidence → decision**

Typography and information structure carry the design. Decoration stays quiet.

## Priority

When rules conflict:

1. User's explicit brief and functional requirements.
2. Existing repository conventions, accessibility rules, and licensed assets.
3. This Skill's official palette and Claude-style visual grammar.
4. General frontend-design guidance.
5. Artifact/runtime defaults.

A runtime Skill may choose React, routing, state, and bundling. It must not silently replace the official palette, typography roles, spacing rhythm, or component grammar defined here.

## Before coding

Write a compact internal design contract:

- **Artifact job:** the one understanding or decision the page enables.
- **Mode:** `editorial`, `product`, or `hybrid`.
- **Content spine:** 3–5 real sections; never invent filler.
- **Composition:** choose one Claude-compatible structure such as a dark rail, editorial masthead, marginal note, or evidence ledger.
- **Palette allocation:** Light-dominant; Dark structural; Orange and Green scarce; Blue semantic only.

If the task is already well scoped, do not block implementation just to ask aesthetic questions.

## Modes

### Editorial
For essays, research notes, reports, explainers, and static knowledge artifacts.

- Serif-led display and reading text.
- Long vertical rhythm and narrow reading measure.
- Hairline rules, marginal labels, quotations, and evidence tables.
- Little or no application chrome.
- Light background with Dark typography; Orange or Green only as controlled accents.

### Product
For tools, dashboards, inspectors, and workflows.

- Neutral sans for controls and dense data.
- Serif only for thesis statements, important decisions, or explanatory empty states.
- Dark may become navigation, header, footer, or primary action.
- Cards only for real object or interaction boundaries.
- Green is a secondary accent, not a substitute dark surface.

### Hybrid
For research workspaces and agent systems.

- Quiet Dark or neutral application shell around a Light editorial center.
- Separate evidence, provenance, status, and action instead of flattening everything into cards.
- Keep the main reading surface Light even when surrounding chrome is Dark.

## Color system

Use `references/tokens.css` as the source of truth.

### Published Anthropic palette

- **Dark:** `#141413`
- **Light:** `#FAF9F5`
- **Light Gray:** `#E8E6DC`
- **Mid Gray:** `#B0AEA5`
- **Orange:** `#D97757`
- **Blue:** `#6A9BCC`
- **Green:** `#788C5D`

### Token policy

- These seven values are the canonical base hue tokens.
- Do not add any replacement brand hue outside this palette.
- The dark green impression must come from official **Dark `#141413`** used as a large structural field, with official **Green `#788C5D`** used only as an accent.
- Alpha variants of the seven official colors are allowed for borders, disabled states, and hierarchy.
- Do not introduce an additional hex color merely to create a hover state; prefer opacity, underline, border change, or another official token.

### Allocation

- Light: roughly 70–85% of a light reading page.
- Dark: roughly 10–25%, usually one rail, masthead, footer, large section, or primary action.
- Orange: 1–5 purposeful appearances per viewport.
- Green: 0–5 secondary emphasis points, diagrams, or a display phrase.
- Blue: only for a real informational or semantic role.
- Light Gray and Mid Gray: boundaries, secondary surfaces, and subordinate content.

Never use pure white as the primary canvas, pure black as the primary ink, neon or Material defaults, rainbow gradients, glassmorphism, or a generic acid-green “AI” look.

## Typography

Do not fetch or distribute Anthropic proprietary fonts. Put their family names first only so an already licensed, locally available installation can resolve; otherwise fall back to suitable system or open fonts.

```css
--font-display: "Anthropic Serif", "Iowan Old Style", "Palatino Linotype",
  "Book Antiqua", Georgia, "Songti SC", STSong, serif;
--font-body: "Anthropic Sans", var(--font-geist-sans), -apple-system,
  BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans CJK SC",
  sans-serif;
--font-mono: "Anthropic Mono", var(--font-geist-mono), ui-monospace,
  "SFMono-Regular", Menlo, Consolas, monospace;
```

If approved open fonts are already available, Fraunces or Source Serif 4 work for display, and Geist or another neutral grotesk works for UI.

### Roles

- **Editorial display:** serif, weight 400–500, tight tracking, compact line-height.
- **Product display:** sans, weight 500–700, compact tracking.
- **Standfirst:** serif, 18–26px, line-height 1.55–1.72.
- **Body:** serif for reading; sans for controls and dense operational information.
- **Kicker / provenance:** mono or neutral sans, 9–11px, short uppercase Latin labels only, tracking .10–.20em.
- **Numbers:** tabular figures; mono for ledgers and operational metrics.

For Chinese, do not depend on synthetic italic. Emphasize with type family, official Green, size, or line break.

## Layout grammar

Prefer one strong composition over a sequence of interchangeable sections.

Useful Claude-compatible structures:

1. **Dark rail + Light paper** — index, provenance, or metric on the left; reading surface on the right.
2. **Masthead + thesis** — small metadata, oversized governing statement, standfirst, evidence.
3. **Marginal number + content** — narrow annotation column aligned to a larger reading column.
4. **Evidence ledger** — hairline rows with source, value, target, confidence, and provenance.
5. **Quiet instrument** — one subject-derived visualization instead of generic KPI cards.

Use CSS Grid for macro layout. Let whitespace separate ideas before adding containers. Keep long prose near 60–78 characters per line.

### Spacing

Use a compact scale such as `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`. Section gaps must be visibly larger than intra-section gaps.

### Borders, radius, depth

- Hairlines: Light Gray or an alpha variant of Dark.
- Radius: 0–10px. Editorial sheets may use zero.
- Shadows: normally none; if a card truly needs depth, use one low-opacity ring or ambient shadow.
- Pills: only for actual states, tags, or toggles.

## Component grammar

### Masthead

Source, date or issue, category, or project context. Small and useful.

### Thesis block

One dominant statement. Use one controlled treatment: a second line, official Green phrase, scale shift, or restrained italic Latin phrase.

### Standfirst

Explain the consequence of the thesis plainly. Avoid marketing superlatives.

### Evidence

Prefer one of:

- quote + provenance;
- ledger or table;
- annotated diagram;
- compact comparison;
- source-linked claim list.

Do not invent metrics to fill space. If a demo needs sample data, label it visibly.

### Decision

End with the recommendation, unresolved question, or next action—not a decorative CTA.

### Controls

- Primary: solid Dark with Light text.
- Secondary: transparent with a Light Gray hairline.
- Accent action: Green or Orange only when its semantic role is clear.
- Tertiary: text action with underline or arrow.
- Minimum touch target: 44×44px.
- Label the result: “Open evidence”, “Save changes”, “Compare versions”.

## Content rules

- Real task-specific copy only; no lorem ipsum or generic feature lists.
- Write from the reader's side of the screen.
- Structural labels must encode real information.
- Preserve source, time, confidence, and status where provenance matters.
- Prefer a precise sentence over a clever slogan.
- Do not use emoji as bullets or icons as a substitute for language.

## Motion

Motion is optional and must clarify hierarchy or change.

- Micro interaction: 160–280ms.
- Section or panel: 280–500ms.
- Standard or exponential ease-out.
- No bounce, elastic, back, or ambient continuous motion.
- Respect `prefers-reduced-motion`.

## Responsive behavior

Desktop asymmetry must become a coherent mobile reading order.

- Collapse a Dark rail into a compact masthead.
- Stack marginal number above thesis.
- Convert multi-column principles into ruled vertical sections.
- Let wide evidence ledgers scroll horizontally with visible context.
- Body ≥16px; touch targets ≥44px.
- Never hide essential evidence or actions on mobile.

## Accessibility

- Semantic landmarks and heading order.
- Visible keyboard focus.
- WCAG AA text contrast.
- Charts need a textual summary or accessible label.
- Do not encode status by color alone.
- Test zoom, narrow widths, and reduced motion.

## Implementation strategy

For a simple narrative artifact, prefer semantic HTML + scoped CSS. Do not add a component library just because one exists.

For a complex interactive artifact, use the repository's existing React, routing, state, and component primitives. `web-artifacts-builder` may own packaging and runtime concerns; this Skill remains the visual authority.

## Hard anti-patterns

Reject unless the brief explicitly requires them:

- any custom replacement for the official seven-color palette;
- centered hero + three identical feature cards + gradient CTA;
- every surface wrapped in a rounded card;
- heavy shadows, glassmorphism, and oversized pills;
- unrelated purple or blue gradients;
- acid green on near-black as generic “AI” signaling;
- excessive badges, chips, icons, or dashboard chrome;
- arbitrary section numbering that encodes nothing;
- fake company marks, copied Claude logos, or proprietary font files;
- animation on every element;
- unsupported claims of pixel-perfect Claude fidelity.

## Release gate

Before completion, use `references/quality-checklist.md` and at minimum:

1. Run repository type, lint, and build checks that are available.
2. Load every route in a real browser when browser tooling exists.
3. Check desktop and mobile.
4. Check focus and reduced motion.
5. Confirm there are no proprietary assets or invented factual claims.
6. Confirm no custom palette hue remains.
7. Confirm thesis → evidence → decision remains clear without decoration.
