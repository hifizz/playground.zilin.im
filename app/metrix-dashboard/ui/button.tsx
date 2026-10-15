"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 overflow-clip whitespace-nowrap transition-[background-color,color,box-shadow,transform,filter] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "mx-bg-cta text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] hover:brightness-110 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2),0px_4px_14px_-4px_rgba(249,115,22,0.55)]",
        secondary:
          "bg-mx-muted text-mx-fg mx-hairline shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] hover:bg-[#42413f]",
        ghostRound:
          "rounded-[66px] bg-mx-card mx-hairline hover:bg-mx-muted [&_img]:transition-transform hover:[&_img]:scale-110",
      },
      size: {
        default: "h-[38px] rounded-[6px] px-[14px] py-[10px] text-[14px] tracking-[0.07px]",
        sm: "h-[30px] rounded-[6px] px-[10px] py-[7px] text-[12.48px] leading-[1.6]",
        icon: "size-[34px] rounded-[6px] px-[11px] py-[7px]",
        iconSm: "rounded-[6px] p-[6px]",
        round: "size-[22px] p-[6px]",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
