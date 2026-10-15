export type AppId =
  | "zendesk"
  | "notion"
  | "gong"
  | "clickup"
  | "metabase"
  | "slack"
  | "figma"
  | "gmail"
  | "gdrive"
  | "github"
  | "gitlab"
  | "linear"
  | "openai"
  | "fable";

export type Agent = { slug: string; name: string; tagline: string };

export const AGENTS: Agent[] = [
  { slug: "product-discovery", name: "Product Discovery", tagline: "Turns scattered signals into ranked opportunities" },
  { slug: "ux-research-synthesizer", name: "UX Research Synthesizer", tagline: "Clusters interview notes into themes with evidence" },
  { slug: "design-critique", name: "Design Critique", tagline: "Reviews designs against heuristics before handoff" },
  { slug: "design-system-guardian", name: "Design System Guardian", tagline: "Flags drift between Figma and shipped components" },
  { slug: "ux-writing-agent", name: "UX Writing Agent", tagline: "Keeps product copy consistent with the voice guide" },
  { slug: "usability-test-runner", name: "Usability Test Runner", tagline: "Runs unmoderated tests and summarises findings" },
];

export const MODELS: { id: string; name: string; vendor: "fable" | "openai" }[] = [
  { id: "fable-5", name: "Fable 5", vendor: "fable" },
  { id: "opus-5", name: "Opus 5", vendor: "fable" },
  { id: "sonnet-5", name: "Sonnet 5", vendor: "fable" },
  { id: "haiku-4.5", name: "Haiku 4.5", vendor: "fable" },
  { id: "gpt-5", name: "GPT-5", vendor: "openai" },
];

export const TOOLS: { app: AppId; name: string }[] = [
  { app: "zendesk", name: "Zendesk Search" },
  { app: "notion", name: "Notion Sync" },
  { app: "gong", name: "Gong List Calls" },
  { app: "clickup", name: "ClickUp Filter Task" },
  { app: "metabase", name: "Metabase Query" },
  { app: "slack", name: "Slack History #customer-feedback" },
];

export const SUB_AGENTS = ["signal_collector", "theme_clusterer", "opportunity_score", "evidence_linker", "digest_writer"];
export const SKILLS = ["onboarding-discovery-agent", "opportunity-solution-tree", "rice-scoring"];
export const MEMORIES = ["product-strategy-h2", "opportunities-archive"];

export const RUN_TEXT = [
  "Starting the weekly pass. Pulling signals from the last 7 days across Zendesk, Gong, ClickUp, Notion, Metabase and #customer-feedback — same sources as last time, so the ranking stays comparable.",
  "Read the two memories first: product-strategy-h2 for what counts as a fit, opportunities-archive so a theme that was already scored is not scored again.",
  "Last run cleared three clusters above threshold. Two clusters didn’t — listed at the bottom, don’t ignore them, some are just early.",
].join("\n\n");

export const INSTRUCTIONS =
  "Full system prompt. This is what sits behind the truncated line in the INSTRUCTIONS block. Version 1.1 · owner: Arek · last change: severity override rules for enterprise tickets. Rank every cluster with RICE, cite at least two pieces of evidence per theme, and never re-score anything already listed in opportunities-archive.";

export const RECOMMENDED: { icon: "doc" | "search" | "repeat"; before: string; apps?: AppId[]; middle?: string; apps2?: AppId[]; after?: string; fill: string }[] = [
  { icon: "doc", before: "Summarise this week's support tickets", apps: ["zendesk", "slack"], fill: "Summarise this week's support tickets" },
  { icon: "search", before: "Review a design", apps: ["figma"], middle: "before handoff", apps2: ["clickup"], fill: "Review a design before handoff" },
  { icon: "repeat", before: "Turn a weekly chore", apps: ["metabase", "slack", "notion"], middle: "into an agent", fill: "Turn a weekly chore into an agent" },
];

export const NAV_PAGES = ["inbox", "templates", "integrations", "skills", "usage", "settings", "agents"] as const;
export type NavPage = (typeof NAV_PAGES)[number];
