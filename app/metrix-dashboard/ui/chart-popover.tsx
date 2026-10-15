"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 图表浮窗外壳：渐变面板 + 双层阴影 */
export const POPOVER_SURFACE =
  "rounded-[8px] border-[0.6px] border-mx-border bg-gradient-to-b from-[#393837] to-[#2f2e2d] p-[4px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.4),0px_0px_0px_1px_rgba(0,0,0,0.2)]";

/** popover 顶部的「标题条」：略微提亮的凹槽，内描边 8% 白 */
export function PopoverTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-[6px] bg-gradient-to-b from-white/[0.02] to-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 一行「圆点 + 名称 ……… 数值」 */
export function PopoverRow({
  dot,
  label,
  children,
  className,
}: {
  dot: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full items-center gap-[6px] overflow-clip p-[8px]", className)}>
      <span className="size-[4px] shrink-0 rounded-full" style={{ background: dot }} />
      <span className="whitespace-nowrap text-[12px] leading-[normal] tracking-[-0.12px] text-mx-soft">{label}</span>
      {children}
    </div>
  );
}
