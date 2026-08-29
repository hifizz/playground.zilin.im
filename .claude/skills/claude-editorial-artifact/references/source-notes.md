# Source fidelity notes

This file records what the repository Skill borrows from the seven evaluated sources and which source controls each design decision.

## 1. Yacey / claude-design

**Borrowed:** Claude-style editorial hierarchy, warm paper, near-black structure, restrained accents, hairlines, small radii, minimal shadow, and Editorial / Product mode separation.

**Limited:** proprietary font files are never assumed to be available or redistributed. Supplemental observed swatches do not replace the official seven-color base palette used by the final Skill.

## 2. jiji262 / claude-design-skill

**Borrowed:** verify facts, understand assets, declare a system before building, compare real directions, and verify in a browser.

**Limited:** this is a broad design workflow, not a Claude visual skin. It remains advisory and cannot override the selected official palette.

## 3. Anthropic / web-artifacts-builder

**Borrowed:** modern component tooling for genuinely complex artifacts, self-contained HTML delivery when needed, and avoidance of obvious AI-design defaults.

**Limited:** React, shadcn, and bundling are runtime choices, not visual identity. Simple narrative artifacts stay simple.

## 4. Anthropic / frontend-design

**Borrowed:** ground visuals in the subject, use typography as identity, self-critique, and remove decoration.

**Limited:** when Claude's public visual language is the explicit target, it may improve composition but must not invent a replacement palette.

## 5. Anthropic / brand-guidelines

**Base color source:**

- Dark `#141413`
- Light `#FAF9F5`
- Light Gray `#E8E6DC`
- Mid Gray `#B0AEA5`
- Orange `#D97757`
- Blue `#6A9BCC`
- Green `#788C5D`

These are the only base hue tokens in the final Skill. All former custom dark-green tokens have been removed. The deep ink-green impression is recreated with official Dark as the structural field and official Green as a restrained accent.

**Limited:** Poppins / Lora is treated as that Skill's portable artifact recipe, not proof of claude.ai's production type stack.

## 6. geekjourneyx / claude-design-card

**Borrowed:** let format follow content density or platform; use Digest, Feature, and Reader patterns; compress content into an information object.

**Limited:** screenshot-card dimensions and social publishing rules are optional formats, not universal application-layout constraints. Its extra palette values do not replace the official base tokens.

## 7. jcmrs / claude-visual-style-guide

**Borrowed:** machine-readable tokens, component specifications, semantic theming, and responsive or accessibility states.

**Limited:** its white / near-black shadcn defaults and generic component inventory are engineering references, not high-fidelity Claude visual evidence.

## Final architecture

1. **claude-editorial-artifact:** official color tokens plus Claude-style typography, spacing, and layout.
2. **General design workflow:** subject grounding, direction choice, and critique.
3. **Artifact/runtime builder:** React, state, routing, and packaging.

Separating these responsibilities prevents broad Skills from rewriting the official visual anchors or overriding one another.
