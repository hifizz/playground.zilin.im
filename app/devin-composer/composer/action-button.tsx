"use client";

import type { ComponentProps } from "react";

const VARIANTS = {
  ghost: "text-neutral-500 hover:bg-black/[0.04] active:bg-black/[0.08]",
  secondary: "bg-[#e6e6e6] text-neutral-700 hover:bg-[#dcdcdc] active:bg-[#d0d0d0]",
  primary: "bg-[#0b84f3] font-medium text-white hover:bg-[#0a78dc] active:bg-[#0968c6]",
} as const;

/** 信息区操作按钮：ghost / secondary / primary 三档，对应 Quick review / Reject all / Accept all。 */
export function ActionButton({
  variant = "secondary",
  icon,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex h-7 items-center gap-1 rounded-md px-2 text-[13px] whitespace-nowrap transition-[background-color,transform] duration-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
