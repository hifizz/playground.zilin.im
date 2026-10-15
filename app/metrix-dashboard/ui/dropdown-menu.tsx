"use client";

import type { ComponentProps } from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "./portal";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[160px] overflow-hidden rounded-[8px] border-[0.6px] border-mx-border bg-gradient-to-b from-[#393837] to-[#2f2e2d] p-1 font-mx-sans text-[13px] text-mx-fg",
          "shadow-[0px_4px_12px_0px_rgba(0,0,0,0.4),0px_0px_0px_1px_rgba(0,0,0,0.2)]",
          "origin-(--radix-dropdown-menu-content-transform-origin) animate-mx-menu-in",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      className={cn(
        "px-2 pb-1 pt-1.5 font-mono text-[11px] uppercase tracking-[0.24px] text-mx-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof MenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
  return (
    <MenuPrimitive.Item
      data-variant={variant}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-[#ccc] outline-none transition-colors",
        "data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-mx-fg",
        "data-[variant=destructive]:text-[#f87171] data-[variant=destructive]:data-[highlighted]:bg-[#f87171]/10",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("my-1 h-[0.6px] bg-mx-border", className)} {...props} />;
}

/** 下拉里「当前项」前面那颗小圆点（选中橙色，未选中灰色） */
export function MenuDot({ active }: { active: boolean }) {
  return <span className={cn("size-1.5 rounded-full", active ? "bg-mx-primary" : "bg-mx-muted-2")} />;
}
