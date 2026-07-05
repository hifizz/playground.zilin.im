import { DynamicIslandThumb } from "./thumbs/dynamic-island";
import { NotificationStackThumb } from "./thumbs/notification-stack";
import { ShareDialogThumb } from "./thumbs/share-dialog";
import { ListAnimationThumb } from "./thumbs/list-animation";
import { TimelineMinimapThumb } from "./thumbs/timeline-minimap";
import { MinimapTocThumb } from "./thumbs/minimap-toc";
import { SyncButtonThumb } from "./thumbs/sync-button";
import { StockCalcThumb } from "./thumbs/stock-calc";
import { StockDashboardThumb } from "./thumbs/stock-dashboard";
import { MobileFullscreenThumb } from "./thumbs/mobile-fullscreen";
import { FloatingDockThumb } from "./thumbs/floating-dock";
import { ShimmerTextThumb } from "./thumbs/shimmer-text";
import { BorderBeamThumb } from "./thumbs/border-beam";
import { ScanBorderThumb } from "./thumbs/scan-border";
import { LwcCandleVolumeThumb } from "./thumbs/lwc-candle-volume";
import { LwcAreaGlowThumb } from "./thumbs/lwc-area-glow";
import { LwcBaselineThumb } from "./thumbs/lwc-baseline";
import { LwcLiveThumb } from "./thumbs/lwc-live";
import { LwcTerminalThumb } from "./thumbs/lwc-terminal";
import { LivelineThumb } from "./thumbs/liveline";
import { ClaudeChatStyleThumb } from "./thumbs/claude-chat-style";
import { RainbowBorderThumb } from "./thumbs/rainbow-border";
import { EditorWithUploadThumb } from "./thumbs/editor-with-upload";
import { ReavizStockCompareThumb } from "./thumbs/reaviz-stock-compare";
import { ReavizOptionsPayoffThumb } from "./thumbs/reaviz-options-payoff";
import { ReavizSaasMetricsThumb } from "./thumbs/reaviz-saas-metrics";
import { ReavizBlockMultiThumb } from "./thumbs/reaviz-block-multi";
import { GlyphThumb } from "./thumbs/glyph";
import { OnboardingThumb } from "./thumbs/onboarding";
import { ShadersThumb } from "./thumbs/shaders";
import { ShaderFlowingLightThumb } from "./thumbs/shader-flowing-light";
import { VoiceOrbCarouselThumb } from "./thumbs/voice-orb-carousel";
import { VoiceChatWidgetThumb } from "./thumbs/voice-chat-widget";
import { SolarSystemThumb } from "./thumbs/solar-system";
import { SolarSystemPointsThumb } from "./thumbs/solar-system-points";

export type DemoCategory = "Interaction" | "Text Demo" | "Explored Demo" | "Agent UX/UI";

export type DemoEntry = {
  title: string;
  description: string;
  route: string;
  category: DemoCategory;
  tags?: string[];
  preview: React.ReactNode;
};

export const ALL_CATEGORIES = ["All", "Interaction", "Explored Demo", "Agent UX/UI"] as const;

export const demos: DemoEntry[] = [
  {
    title: "Dynamic Island",
    description: "iOS Dynamic Island — 12 interaction states with Framer Motion spring physics.",
    route: "/dynamic-island",
    category: "Interaction",
    tags: ["Framer Motion", "iOS"],
    preview: <DynamicIslandThumb />,
  },
  {
    title: "Notification Stack",
    description: "macOS-style glass-morphism notification stack with configurable spring presets.",
    route: "/notification-spring-macos",
    category: "Interaction",
    tags: ["Framer Motion", "Glass"],
    preview: <NotificationStackThumb />,
  },
  {
    title: "Share Dialog",
    description: "Multi-state share modal with public / access-code modes and layout animations.",
    route: "/share-dialog",
    category: "Interaction",
    tags: ["Framer Motion"],
    preview: <ShareDialogThumb />,
  },
  {
    title: "List Animation",
    description: "Configurable spring list with top-insert enter effects and preset switching.",
    route: "/list-animation",
    category: "Interaction",
    tags: ["Framer Motion"],
    preview: <ListAnimationThumb />,
  },
  {
    title: "Chat TOC · 时间线高亮",
    description: "TOC 方案探索：左侧时间线轨道 + H2 索引 + 选文高亮标记，可点击跳转。",
    route: "/minimap",
    category: "Explored Demo",
    tags: ["TOC", "Framer Motion"],
    preview: <TimelineMinimapThumb />,
  },
  {
    title: "Chat TOC · 缩略线导航",
    description: "TOC 方案探索：右侧缩略线面板以 IntersectionObserver 同步当前阅读位置。",
    route: "/minimap-toc",
    category: "Explored Demo",
    tags: ["TOC", "IntersectionObserver"],
    preview: <MinimapTocThumb />,
  },
  {
    title: "Sync Button",
    description: "Three variants of an animated sync / loading button — Framer Motion & pure CSS.",
    route: "/sync-button",
    category: "Interaction",
    tags: ["CSS Animation"],
    preview: <SyncButtonThumb />,
  },
  {
    title: "Stock Calculator",
    description: "USD / CNY P&L calculator with buy, sell, and target-price inputs.",
    route: "/calc",
    category: "Interaction",
    tags: ["Utility"],
    preview: <StockCalcThumb />,
  },
  {
    title: "Stock Dashboard",
    description: "纯 SVG 实现的股价 dashboard：区域线图 / 蜡烛图切换，OHLC tooltip。",
    route: "/stock-dashboard",
    category: "Explored Demo",
    tags: ["SVG", "Chart"],
    preview: <StockDashboardThumb />,
  },
  {
    title: "Mobile Fullscreen",
    description: "Feature-detection based viewport-height adaptation for mobile browsers.",
    route: "/mobile-fullscreen",
    category: "Explored Demo",
    tags: ["Mobile"],
    preview: <MobileFullscreenThumb />,
  },
  {
    title: "Floating Dock",
    description: "iOS-style glassmorphism bottom navigation bar with animated active indicator.",
    route: "/floating-dock",
    category: "Interaction",
    tags: ["Framer Motion", "iOS"],
    preview: <FloatingDockThumb />,
  },
  {
    title: "Shimmer Text",
    description: "Cursor-style 文本闪光：基色 + 一道窄高光循环穿过，暗示 agent 正在执行。",
    route: "/shimmer-text",
    category: "Agent UX/UI",
    tags: ["CSS Animation", "Agent"],
    preview: <ShimmerTextThumb />,
  },
  {
    title: "Border Beam",
    description: "光束沿圆角描边匀速绕行：CSS offset-path + mask-composite 实现，含 5 种用法。",
    route: "/border-beam",
    category: "Interaction",
    tags: ["CSS Animation", "Framer Motion"],
    preview: <BorderBeamThumb />,
  },
  {
    title: "Scan Border",
    description: "iOS 18 Siri 同款边缘光晕：旋转 conic 彩虹 + glow / ring 双层 + 4 边等宽 mask。",
    route: "/scan-border",
    category: "Agent UX/UI",
    tags: ["CSS Animation", "Agent"],
    preview: <ScanBorderThumb />,
  },
  {
    title: "LWC · Candle + Volume",
    description: "lightweight-charts 双 pane：蜡烛图 + 共享时间轴的成交量直方图，crosshair 联动 OHLC legend。",
    route: "/lwc-candle-volume",
    category: "Explored Demo",
    tags: ["lightweight-charts", "Chart"],
    preview: <LwcCandleVolumeThumb />,
  },
  {
    title: "LWC · Area Glow",
    description: "TradingView 首页 hero 风格：渐变 Area + 4 套主题色 + visibleRange 切换的时段选择器。",
    route: "/lwc-area-glow",
    category: "Explored Demo",
    tags: ["lightweight-charts", "Chart"],
    preview: <LwcAreaGlowThumb />,
  },
  {
    title: "LWC · Baseline P&L",
    description: "BaselineSeries：基准线上方绿、下方红，拖动 slider 实时改变 cost basis 重新着色。",
    route: "/lwc-baseline",
    category: "Explored Demo",
    tags: ["lightweight-charts", "Chart"],
    preview: <LwcBaselineThumb />,
  },
  {
    title: "LWC · Live Stream",
    description: "实时 tick 流：series.update() 增量渲染，可暂停 / 调速，演示 lightweight-charts 的高性能流式更新。",
    route: "/lwc-live",
    category: "Explored Demo",
    tags: ["lightweight-charts", "Chart"],
    preview: <LwcLiveThumb />,
  },
  {
    title: "LWC · Trading Terminal",
    description: "完整交易终端布局：蜡烛 + 布林带 / Volume / MACD 三 pane，右侧实时 L2 订单簿 + 成交流水。",
    route: "/lwc-terminal",
    category: "Explored Demo",
    tags: ["lightweight-charts", "Chart", "Realtime"],
    preview: <LwcTerminalThumb />,
  },
  {
    title: "Liveline",
    description:
      "复刻 benji.org/liveline 排版的单页：用 liveline 库内嵌 4 个实时折线 demo（心率 / CPU / 多 series / 压力测试）。",
    route: "/liveline",
    category: "Explored Demo",
    tags: ["liveline", "Chart", "Realtime"],
    preview: <LivelineThumb />,
  },
  {
    title: "Claude Chat Style",
    description:
      "1:1 抓取 claude.ai 计算样式还原成 ~280 行 CSS，用一篇博客示范 h1–h4 / 列表 / 代码块 / 表格 / 引用。",
    route: "/claude-chat-style",
    category: "Agent UX/UI",
    tags: ["Markdown", "Typography"],
    preview: <ClaudeChatStyleThumb />,
  },
  {
    title: "Rainbow Border",
    description: "旋转 conic-gradient + 白色模糊遮罩，纯 CSS 实现 iOS 18 风格彩虹描边效果。",
    route: "/rainbow-border",
    category: "Interaction",
    tags: ["CSS Animation", "iOS"],
    preview: <RainbowBorderThumb />,
  },
  {
    title: "Editor with Upload",
    description:
      "Tiptap 编辑器 + 顶部图片附件区：拖拽 / 粘贴图片自动归位到顶部，无图时折叠。",
    route: "/editor-with-upload",
    category: "Interaction",
    tags: ["Tiptap", "Upload"],
    preview: <EditorWithUploadThumb />,
  },
  {
    title: "Reaviz · 多股票涨跌对比",
    description:
      "reaviz LineChart 多 series：5 只科技股归一化到 0% 比相对涨跌，crosshair tooltip + 时段切换 + 滚轮缩放。",
    route: "/reaviz-stock-compare",
    category: "Explored Demo",
    tags: ["reaviz", "Chart"],
    preview: <ReavizStockCompareThumb />,
  },
  {
    title: "Reaviz · 期权收益曲线",
    description:
      "AreaChart + ValueMarker 画到期 P&L 曲线：六种常用策略、可调 strike / premium，breakeven 自动求解。",
    route: "/reaviz-options-payoff",
    category: "Explored Demo",
    tags: ["reaviz", "Chart", "Options"],
    preview: <ReavizOptionsPayoffThumb />,
  },
  {
    title: "Reaviz · Multi Series Block",
    description:
      "1:1 复刻 reaviz.dev blocks 里的 Multi Series · Medium：Incident Report 卡片，沿用官方调色板。",
    route: "/reaviz-block-multi",
    category: "Explored Demo",
    tags: ["reaviz", "Chart", "Block"],
    preview: <ReavizBlockMultiThumb />,
  },
  {
    title: "Reaviz · SaaS Metrics",
    description:
      "SaaS 增长面板：4 个 KPI + Sparkline、按订阅层堆叠的 MRR、转化漏斗。一次串起 reaviz 三类图表。",
    route: "/reaviz-saas-metrics",
    category: "Explored Demo",
    tags: ["reaviz", "Chart", "SaaS"],
    preview: <ReavizSaasMetricsThumb />,
  },
  {
    title: "Glyph · 流体文本动画库",
    description:
      "自研文本动画小库：Text 字符级流体过渡 / Number 平滑计数 / Slots 老虎机数字轮，零依赖 Web Animations API、合成层满帧。灵感来自 calligraph。",
    route: "/glyph",
    category: "Interaction",
    tags: ["Text", "WAAPI", "Performance"],
    preview: <GlyphThumb />,
  },
  {
    title: "Onboarding 引导卡片",
    description:
      "复刻 HeroUI Pro 角落引导卡：四角任意弹出、可替换内部元素、可挂事件回调的复合组件。",
    route: "/onboarding",
    category: "Agent UX/UI",
    tags: ["Onboarding", "Framer Motion", "Compound"],
    preview: <OnboardingThumb />,
  },
  {
    title: "Paper Shaders 效果画廊",
    description:
      "@paper-design/shaders-react 冷色系效果展示：7 个全屏可滚动 section（GrainGradient 作 hero），用 IntersectionObserver 只在进入视口时挂载对应 WebGL shader。",
    route: "/shaders",
    category: "Explored Demo",
    tags: ["WebGL", "Shader", "IntersectionObserver"],
    preview: <ShadersThumb />,
  },
  {
    title: "Shader · 流动的光",
    description:
      "4 段手写 GLSL 片段着色器复刻「流动的光」：语音流光带 / 呼吸光环 / 边缘流光(Apple Intelligence) / 弥散渐变，纯 WebGL 实时渲染，可拖滑块、点按钮实时调参。",
    route: "/shader-flowing-light",
    category: "Explored Demo",
    tags: ["WebGL", "GLSL", "Shader"],
    preview: <ShaderFlowingLightThumb />,
  },
  {
    title: "Voice Orb Carousel",
    description:
      "用 @paper-design/shaders-react 复刻 ElevenLabs 音色球轮播：激活球 Mesh/Grain 实时流动，圆形靠 CSS 遮罩裁软边，最外侧两片用 CSS 渐变虚化以控制 WebGL context 数量。",
    route: "/voice-orb-carousel",
    category: "Explored Demo",
    tags: ["WebGL", "Shader", "Carousel"],
    preview: <VoiceOrbCarouselThumb />,
  },
  {
    title: "Voice Chat Widget",
    description:
      "复刻 ElevenLabs 右下角对话式 AI 语音挂件：玻璃拟态胶囊展开为带动效对话框，GrainGradient sphere 语音球 + 通话键，通话时球体流动加速。",
    route: "/voice-chat-widget",
    category: "Agent UX/UI",
    tags: ["Framer Motion", "Shader", "Agent"],
    preview: <VoiceChatWidgetThumb />,
  },
  {
    title: "太阳系 · 3D 交互科普",
    description:
      "Three.js 全屏太阳系：程序化生成行星贴图，公转/自转/轴倾角按真实数据等比压缩，点击星球 3D 放大 + 相机跟随 + 科普卡片。",
    route: "/solar-system",
    category: "Explored Demo",
    tags: ["Three.js", "WebGL", "3D"],
    preview: <SolarSystemThumb />,
  },
  {
    title: "太阳系 · 点云粒子版",
    description:
      "全点云太阳系：约 7 万粒子逐点从程序化贴图采样取色，shader 算昼夜明暗，开场星尘汇聚成形（可重放），交互与实体版一致。",
    route: "/solar-system-points",
    category: "Explored Demo",
    tags: ["Three.js", "GLSL", "Particles"],
    preview: <SolarSystemPointsThumb />,
  },
];
