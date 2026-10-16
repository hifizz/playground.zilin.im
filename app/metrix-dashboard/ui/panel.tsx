"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Img } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * 「外壳 + 内卡」两层结构：外层 shell(#252423) 2px 内边距，内层 card(#2f2e2d) 圆角更小。
 * 两层只差一档明度，靠发丝边和圆角差撑出层次，而不是靠投影。
 */
export function PanelShell({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("flex min-w-0 flex-col rounded-[12px] bg-mx-shell p-[2px]", className)} {...props} />;
}

export function PanelCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[10px] border-[0.6px] border-mx-border bg-mx-card", className)}
      {...props}
    />
  );
}

/** 面板头：等宽大写标题 + ⓘ 提示 + 右侧操作区 + 圆形 ··· 按钮 */
export function PanelHeader({
  id,
  title,
  info,
  children,
}: {
  id: string;
  title: string;
  info: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-[42px] items-center justify-between gap-3 overflow-clip px-[14px] py-[12px]">
      <div className="flex min-w-0 items-center gap-2">
        <h2 id={id} className="truncate font-mx-mono text-[14px] font-medium uppercase leading-[normal] tracking-[0.14px] text-mx-mute">
          {title}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={`About ${title}`}
              className="flex size-[14px] shrink-0 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-70"
            >
              <Img name="info" width={14} height={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{info}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button variant="ghostRound" size="round" aria-label={`${title} options`}>
          <Img name="more" width={14} height={14} />
        </Button>
      </div>
    </div>
  );
}
