import type { ComponentType } from "react";
import {
  Plug,
  Sparkles,
  ShieldCheck,
  Rocket,
  Workflow,
  BarChart3,
  Network,
  Lock,
  Layers,
  Wand2,
  Building2,
} from "lucide-react";

/**
 * 右侧轮播数据：每页一组渐变 + 标题 + 卖点列表。
 * 配色刻意避开蓝紫渐变，走暖橙 / 翠绿 / 青绿 / 玫红 / 琥珀。
 * 想增删页 / 换文案，改这里即可。
 */
export type Bullet = {
  icon: ComponentType<{ size?: number; className?: string }>;
  text: string;
};

export type Slide = {
  title: string;
  bullets: Bullet[];
  /** 主渐变（底图）*/
  base: string;
  /** 两枚高斯模糊光斑，营造图中的「光面棱角」质感 */
  blobA: string;
  blobB: string;
  /** 旋转方块（钻石切面）的渐变 */
  facet: string;
};

export const SLIDES: Slide[] = [
  {
    title: "AI 智能体，为每个员工和工作流赋能",
    bullets: [
      { icon: Plug, text: "无需 IT 介入，也能安全连接 Google Workspace 和 Microsoft 365 等业务应用" },
      { icon: Sparkles, text: "基于公司数据生成分析洞见和内容" },
      { icon: ShieldCheck, text: "您的数据归属于您，我们不会用来训练" },
      { icon: Rocket, text: "预构建代理直接用，还能无代码定制代理" },
      { icon: Workflow, text: "在一个平台上自动执行多步骤、多应用的工作流" },
    ],
    base: "linear-gradient(150deg,#1a1207 0%,#7c2d12 42%,#b91c1c 72%,#f59e0b 100%)",
    blobA: "radial-gradient(circle, rgba(245,158,11,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(220,38,38,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(251,191,36,0.55), rgba(190,24,60,0.35))",
  },
  {
    title: "从一句话到落地执行，一步到位",
    bullets: [
      { icon: Wand2, text: "用自然语言下达目标，智能体自行拆解并完成任务" },
      { icon: Layers, text: "跨文档、邮件、表格、工单串联多步骤操作" },
      { icon: BarChart3, text: "执行前预览计划，执行后留存可追溯的过程记录" },
    ],
    base: "linear-gradient(150deg,#04130d 0%,#064e3b 44%,#047857 74%,#34d399 100%)",
    blobA: "radial-gradient(circle, rgba(52,211,153,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(4,120,87,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(110,231,183,0.5), rgba(4,120,87,0.35))",
  },
  {
    title: "企业级安全与治理，开箱即用",
    bullets: [
      { icon: Lock, text: "数据加密、权限隔离，沿用你现有的身份与访问策略" },
      { icon: ShieldCheck, text: "完整审计日志，每一次智能体调用都可回溯" },
      { icon: Building2, text: "满足组织合规要求，私有数据不参与模型训练" },
    ],
    base: "linear-gradient(150deg,#06201f 0%,#134e4a 44%,#0d9488 74%,#5eead4 100%)",
    blobA: "radial-gradient(circle, rgba(94,234,212,0.8), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(13,148,136,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(153,246,228,0.5), rgba(13,148,136,0.35))",
  },
  {
    title: "连接你已经在用的全部工具",
    bullets: [
      { icon: Network, text: "数百个预置连接器，几分钟接入业务系统" },
      { icon: Plug, text: "统一上下文，让智能体读懂跨系统的真实数据" },
      { icon: Workflow, text: "把日常流程沉淀为可复用、可共享的智能体" },
    ],
    base: "linear-gradient(150deg,#1f0a14 0%,#831843 44%,#be123c 74%,#fb923c 100%)",
    blobA: "radial-gradient(circle, rgba(251,146,60,0.8), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(190,18,60,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(253,164,175,0.5), rgba(190,18,60,0.35))",
  },
  {
    title: "可观测、可度量的智能体运营",
    bullets: [
      { icon: BarChart3, text: "实时看板掌握采用率、成功率与节省的工时" },
      { icon: Rocket, text: "A/B 对比不同提示与配置，持续打磨效果" },
      { icon: Layers, text: "从单点试用平滑扩展到全员规模化部署" },
    ],
    base: "linear-gradient(150deg,#1c1304 0%,#422006 42%,#a16207 72%,#facc15 100%)",
    blobA: "radial-gradient(circle, rgba(250,204,21,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(161,98,7,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(254,240,138,0.55), rgba(161,98,7,0.35))",
  },
];
