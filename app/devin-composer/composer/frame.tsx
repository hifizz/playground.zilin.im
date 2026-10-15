"use client";

import type { ComponentProps } from "react";

/** 外层灰色面板：包住信息区、输入卡和上下文条。 */
export function ComposerFrame({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`flex w-full flex-col rounded-2xl bg-[#f3f3f3] px-1.5 pt-1.5 pb-1 ${className}`}
      {...props}
    />
  );
}
