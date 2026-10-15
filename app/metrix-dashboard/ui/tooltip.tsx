"use client";

import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "./portal";

export function TooltipProvider({ delayDuration = 150, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/** 渐变面板 + 0.6px 发丝边 + 双层阴影：与下拉菜单 / 图表 popover 共用同一套「浮层」质感 */
export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-[6px] border-[0.6px] border-mx-border bg-gradient-to-b from-[#393837] to-[#2f2e2d] px-2 py-1 font-mx-sans text-[12px] text-mx-fg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.4),0px_0px_0px_1px_rgba(0,0,0,0.2)]",
          "origin-(--radix-tooltip-content-transform-origin) data-[state=delayed-open]:animate-mx-fade-up",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
