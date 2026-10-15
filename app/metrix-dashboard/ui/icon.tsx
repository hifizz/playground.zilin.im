import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** 图标名 → public/metrix/icons 下的文件名（原站 Untitled/Hugeicons 导出的 SVG） */
export const ICONS = {
  logo: "logo",
  selectorChevrons: "selector-chevrons",
  home: "home-01",
  homeOutline: "home-01-outline",
  chartBarLine: "chart-bar-line",
  money: "money-03",
  file02: "file-02",
  file02White: "file-02-white",
  bubbleChat: "bubble-chat",
  presentation: "presentation-bar-chart-01",
  megaphone: "megaphone-01",
  userMultiple: "user-multiple-02",
  modernTv: "modern-tv",
  invoice: "invoice",
  userList: "user-list",
  invoice01: "invoice-01",
  archive: "archive-04",
  archiveHeader: "archive-04-header",
  headset: "headset",
  helpCircle: "help-circle",
  setting: "setting-07",
  onlineDot: "online-dot",
  arrowDown2: "arrow-down-2",
  arrowRight2: "arrow-right-2",
  search: "search",
  cmd: "cmd",
  notification: "notification-01",
  chevronDown: "chevron-down",
  chevronDownLight: "chevron-down-808080",
  calendar16: "calendar-03",
  calendar14: "calendar-03-14",
  arrowUpCircle: "arrow-up-circle",
  info: "info",
  more: "more",
  stars: "stars",
  sort: "sort",
  plus: "plus",
  moreCircle: "more-horizontal-circle-01",
  statusSuccess: "status-success",
  statusPending: "status-pending",
  statusRefunded: "status-refunded",
} as const;

export type IconName = keyof typeof ICONS;

export const AVATAR_SRC = "/metrix/avatar.webp";

const iconSrc = (name: IconName) => `/metrix/icons/${ICONS[name]}.svg`;

/** 把 SVG 当 mask 用：颜色跟随 currentColor，便于 hover / 选中态换色 */
export function Icon({
  name,
  size = 16,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const url = `url("${iconSrc(name)}")`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        ...style,
      }}
    />
  );
}

/** 保留 SVG 自带颜色的图标 */
export function Img({
  name,
  width,
  height,
  className,
}: {
  name: IconName;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <img
      src={iconSrc(name)}
      alt=""
      draggable={false}
      width={width}
      height={height}
      className={cn("block max-w-none shrink-0", className)}
    />
  );
}
