"use client";

import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Checkbox({ className, checked, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      className={cn("group/checkbox relative block size-4 shrink-0 outline-none", className)}
      {...props}
    >
      <span
        className={cn(
          "absolute left-[2px] top-[2px] grid size-3 place-items-center rounded-[3px] border border-[#49433b] bg-[#3e3932] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12)] transition-[background-color,border-color,transform] duration-150",
          "group-hover/checkbox:border-[#6b5f50] group-active/checkbox:scale-90",
          "group-data-[state=checked]/checkbox:border-mx-primary group-data-[state=checked]/checkbox:bg-mx-primary",
          "group-data-[state=indeterminate]/checkbox:border-mx-primary group-data-[state=indeterminate]/checkbox:bg-mx-primary",
        )}
      >
        <CheckboxPrimitive.Indicator forceMount className="grid place-items-center data-[state=unchecked]:hidden">
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
            {checked === "indeterminate" ? (
              <path d="M1.5 4h5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            ) : (
              <path
                d="M1.3 4.2 3.2 6 6.7 2"
                fill="none"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}
