import { DynamicIslandThumb } from "./thumbs/dynamic-island";
import { NotificationStackThumb } from "./thumbs/notification-stack";
import { ShareDialogThumb } from "./thumbs/share-dialog";
import { ListAnimationThumb } from "./thumbs/list-animation";
import { TimelineMinimapThumb } from "./thumbs/timeline-minimap";
import { MinimapTocThumb } from "./thumbs/minimap-toc";
import { SyncButtonThumb } from "./thumbs/sync-button";
import { StockCalcThumb } from "./thumbs/stock-calc";
import { MobileFullscreenThumb } from "./thumbs/mobile-fullscreen";

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
    title: "Mobile Fullscreen",
    description: "Feature-detection based viewport-height adaptation for mobile browsers.",
    route: "/mobile-fullscreen",
    category: "Explored Demo",
    tags: ["Mobile"],
    preview: <MobileFullscreenThumb />,
  },
];
