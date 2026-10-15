"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatMoney, REVENUE_DESIGN_HEIGHT, REVENUE_DESIGN_WIDTH, type RevenuePoint } from "../data";
import { POPOVER_SURFACE, PopoverTitle } from "../ui/chart-popover";

const BASELINE = 218.4; // 柱子底边距卡片顶部的距离
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Revenue Breakdown 的双层细柱：灰色「目标」柱 + 橙色「实际」柱，
 * 悬停某一根时其余柱压暗，popover 以 spring 跟随到该柱旁边。
 */
export function RevenueBars({ points }: { points: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const cur = hover !== null ? points[hover] : null;

  return (
    <div className="absolute inset-0" onPointerLeave={() => setHover(null)}>
      {points.map((p, i) => {
        const dimmed = hover !== null && hover !== i;
        return (
          <div
            key={i}
            tabIndex={0}
            role="img"
            aria-label={`${p.date}: ${formatMoney(p.revenue)} of ${formatMoney(p.target)} target`}
            onPointerEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="absolute bottom-0 w-[24px] -translate-x-[10px] cursor-pointer outline-none"
            style={{ left: `${(p.x / REVENUE_DESIGN_WIDTH) * 100}%`, top: 150 }}
          >
            {/* 目标柱（灰） */}
            <motion.span
              className={cn(
                "absolute left-[10px] w-[4px] rounded-[6px] transition-[background-color,opacity] duration-200",
                hover === i ? "bg-[#4a4947]" : "bg-mx-muted",
                dimmed && "opacity-60",
              )}
              style={{ originY: 1 }}
              initial={{ scaleY: 0, height: p.total, top: BASELINE - p.total }}
              animate={{ scaleY: 1, height: p.total, top: BASELINE - p.total }}
              transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.25 + i * 0.045, ease: EASE }}
            />
            {/* 实际柱（橙）；第 5 根在原稿里略细、略偏，保持一致 */}
            <motion.span
              className={cn(
                "absolute w-[4px] rounded-[6px] bg-mx-primary transition-[opacity,filter] duration-200",
                dimmed && "opacity-45",
                hover === i && "brightness-110",
              )}
              style={{ originY: 1, left: i === 4 ? 10.32 : 10, width: i === 4 ? 3.84 : 4 }}
              initial={{ scaleY: 0, height: p.value, top: BASELINE - p.value }}
              animate={{ scaleY: 1, height: p.value, top: BASELINE - p.value }}
              transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.45 + i * 0.045, ease: EASE }}
            />
          </div>
        );
      })}

      <AnimatePresence>
        {cur && hover !== null && (
          <motion.div
            key="rb-tip"
            className={cn("pointer-events-none absolute z-20 w-[150px]", POPOVER_SURFACE)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: `calc(${(cur.x / REVENUE_DESIGN_WIDTH) * 100}% ${cur.x > REVENUE_DESIGN_WIDTH / 2 ? "- 158px" : "+ 12px"})`,
              top: Math.max(130, REVENUE_DESIGN_HEIGHT - cur.total - 20),
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 520, damping: 40 }}
          >
            <PopoverTitle className="px-[8px] py-[6px] text-[13px] leading-[normal] text-[#979797]">{cur.date}, 2025</PopoverTitle>
            <TipRow dot="#f97316" label="Revenue" value={formatMoney(cur.revenue)} className="pb-[4px] pt-[8px]" />
            <TipRow dot="#49433b" label="Target" value={formatMoney(cur.target)} className="pb-[6px] pt-[4px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TipRow({ dot, label, value, className }: { dot: string; label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[6px] px-[8px]", className)}>
      <span className="size-[4px] rounded-full" style={{ background: dot }} />
      <span className="text-[12px] text-mx-soft">{label}</span>
      <span className="ml-auto text-[13px] font-medium text-mx-fg tabular-nums">{value}</span>
    </div>
  );
}
