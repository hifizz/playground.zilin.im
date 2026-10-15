"use client";

import type { ComponentProps } from "react";

/** 白色输入卡：内部自上而下排 Input / Toolbar。 */
export function ComposerRoot({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`w-full rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${className}`}
      {...props}
    />
  );
}
