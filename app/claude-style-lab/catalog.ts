export type DemoKind =
  | "claude-design"
  | "design-workflow"
  | "web-artifacts-builder"
  | "frontend-design"
  | "brand-guidelines"
  | "design-card"
  | "visual-style-guide"
  | "editorial-synthesis";

export type DemoEntry = {
  number: string;
  slug: string;
  title: string;
  source: string;
  sourceUrl: string;
  role: string;
  fidelity: "高" | "中" | "低" | "不适用";
  kind: DemoKind;
  summary: string;
  verdict: string;
};

export const claudeStyleDemos: DemoEntry[] = [
  {
    number: "01",
    slug: "01-claude-design",
    title: "claude-design",
    source: "Yacey / claude-design",
    sourceUrl: "https://github.com/Yacey/claude-design",
    role: "视觉系统",
    fidelity: "高",
    kind: "claude-design",
    summary: "暖米纸、近黑墨色、铁锈橙、衬线排版、极弱阴影与小圆角。",
    verdict: "七个来源里，最适合作为 Claude 编辑式视觉的社区基线。",
  },
  {
    number: "02",
    slug: "02-design-workflow",
    title: "claude-design-skill",
    source: "jiji262 / claude-design-skill",
    sourceUrl: "https://github.com/jiji262/claude-design-skill",
    role: "设计流程",
    fidelity: "不适用",
    kind: "design-workflow",
    summary: "事实核验、资产收集、视觉方向选择、系统声明、变体比较和浏览器验收。",
    verdict: "你的判断是对的：它不是 Claude 皮肤，只提炼设计工作流，不作为视觉基准。",
  },
  {
    number: "03",
    slug: "03-web-artifacts-builder",
    title: "web-artifacts-builder",
    source: "Anthropic / web-artifacts-builder",
    sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder",
    role: "Artifact Runtime",
    fidelity: "低",
    kind: "web-artifacts-builder",
    summary: "React + TypeScript + Tailwind + shadcn，适合复杂、多组件、带状态的 Artifact。",
    verdict: "决定 HTML 能做多复杂，不决定它长得像不像 Claude。",
  },
  {
    number: "04",
    slug: "04-frontend-design",
    title: "frontend-design",
    source: "Anthropic / frontend-design",
    sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    role: "设计判断",
    fidelity: "中",
    kind: "frontend-design",
    summary: "从主题本身长出视觉语言，只在一个地方冒险，并主动反模板化。",
    verdict: "适合作为审美审稿人；明确要求 Claude 风格时，它应服从 Brief。",
  },
  {
    number: "05",
    slug: "05-brand-guidelines",
    title: "brand-guidelines",
    source: "Anthropic / brand-guidelines",
    sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/brand-guidelines",
    role: "官方品牌锚点",
    fidelity: "中",
    kind: "brand-guidelines",
    summary: "提供公开 Skill 中的 Dark / Light / Gray / Orange / Blue / Green 色值。",
    verdict: "颜色最值得作为权威锚点；Poppins/Lora 是 Artifact 配方，不等于 claude.ai 真实字体。",
  },
  {
    number: "06",
    slug: "06-design-card",
    title: "claude-design-card",
    source: "geekjourneyx / claude-design-card",
    sourceUrl: "https://github.com/geekjourneyx/claude-design-card",
    role: "内容卡片",
    fidelity: "高",
    kind: "design-card",
    summary: "把研究内容压成 Digest / Feature / Reader 等可传播的知识物件。",
    verdict: "做研究摘要、报告卡很强；不应强行泛化成应用 UI。",
  },
  {
    number: "07",
    slug: "07-visual-style-guide",
    title: "claude-visual-style-guide",
    source: "jcmrs / claude-visual-style-guide",
    sourceUrl: "https://github.com/jcmrs/claude-visual-style-guide",
    role: "组件规范",
    fidelity: "低",
    kind: "visual-style-guide",
    summary: "机器可读 token、shadcn 组件、响应式与 dark mode 的工程化参考。",
    verdict: "工程结构完整，但默认白底 + shadcn 视觉并不高度还原 Claude。",
  },
  {
    number: "08",
    slug: "08-claude-editorial-artifact",
    title: "claude-editorial-artifact",
    source: "playground.zilin.im / official-token reconstruction",
    sourceUrl: "/claude-style-lab",
    role: "官方风格复刻 Skill",
    fidelity: "高",
    kind: "editorial-synthesis",
    summary: "只使用公开官方 Dark / Light / Light Gray / Mid Gray / Orange / Blue / Green Token，并结合 Claude 式编辑排版与证据语法。",
    verdict: "推荐最终方案：官方视觉 Token 固定，设计判断与 Artifact Runtime 分层。",
  },
];

export function getDemo(slug: string) {
  return claudeStyleDemos.find((demo) => demo.slug === slug);
}
