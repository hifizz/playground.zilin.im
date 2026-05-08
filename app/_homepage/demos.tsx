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
];
