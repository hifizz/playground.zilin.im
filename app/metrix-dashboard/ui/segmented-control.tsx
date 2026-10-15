"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ToggleGroup } from "radix-ui";
import { cn } from "@/lib/utils";

const SegmentedContext = createContext<{ value: string; id: string }>({ value: "", id: "" });

/** 胶囊分段控件：选中态的「滑块」用 layoutId 在选项间做 spring 位移 */
export function SegmentedControl({
  className,
  children,
  value,
  onValueChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const id = useId();
  return (
    <SegmentedContext.Provider value={{ value, id }}>
      <ToggleGroup.Root
        type="single"
        value={value}
        // Radix 单选再次点击会返回 ""，这里忽略，保证始终有选中项
        onValueChange={(v) => v && onValueChange(v)}
        className={cn(
          "flex h-[30px] items-center overflow-clip rounded-[88px] bg-mx-shell shadow-[0px_1px_1px_0px_rgba(255,255,255,0.06)]",
          className,
        )}
        aria-label={ariaLabel}
      >
        {children}
      </ToggleGroup.Root>
    </SegmentedContext.Provider>
  );
}

export function SegmentedItem({
  className,
  children,
  value,
  ...props
}: ComponentProps<typeof ToggleGroup.Item>) {
  const ctx = useContext(SegmentedContext);
  const active = ctx.value === value;
  return (
    <ToggleGroup.Item
      value={value}
      className={cn(
        "relative flex h-full items-center rounded-[88px] px-[14px] py-[8px] text-[12px] leading-none tracking-[0.24px] outline-none transition-colors duration-200",
        active ? "text-mx-fg" : "text-mx-mute hover:text-[#b3b3b3]",
        className,
      )}
      {...props}
    >
      {active && (
        <motion.span
          layoutId={`${ctx.id}-thumb`}
          className="absolute inset-0 rounded-[88px] border-[0.6px] border-mx-border bg-mx-muted drop-shadow-[0px_1px_2px_rgba(12,12,13,0.05)]"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative">{children}</span>
    </ToggleGroup.Item>
  );
}
