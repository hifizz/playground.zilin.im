"use client";

import type { ComponentProps } from "react";

const TONES = {
  default: "text-neutral-600",
  muted: "text-neutral-400",
} as const;

/** 工具栏图标按钮：+、麦克风等图标槽位的公共底座。 */
export function IconButton({ className = "", children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-[background-color,transform] duration-100 hover:bg-black/[0.04] active:scale-95 active:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** 工具栏文字选择器：图标 + 文案，权限 / 模型 / Agent 选择器共用。 */
export function SelectPill({
  icon,
  label,
  tone = "default",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  icon?: React.ReactNode;
  label: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <button
      type="button"
      className={`flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] whitespace-nowrap transition-[background-color,transform] duration-100 hover:bg-black/[0.04] active:scale-95 active:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${TONES[tone]} ${className}`}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
