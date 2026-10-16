"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KPIS, type Kpi } from "../data";
import { AnimatedNumber } from "../ui/animated-number";
import { Img } from "../ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SHADOW =
  "hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]";

/** 卡片右上角的迷你竖条图：每根 2px 宽，第 accent 根是橙色，进场依次从底部长出 */
function Sparkbars({ bars, accent, delay }: { bars: number[]; accent: number; delay: number }) {
  return (
    <div className="flex h-[56px] items-end gap-[6px]" aria-hidden="true">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, delay: delay + i * 0.04, ease: EASE }}
          style={{ height: h, originY: 1 }}
          className={cn(
            "w-[2px] rounded-[88px] transition-[background-color,transform] duration-300",
            i === accent ? "bg-mx-primary" : "bg-mx-muted-3 group-hover:bg-[#4a4948]",
          )}
        />
      ))}
    </div>
  );
}

function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const delta = kpi.delta.toFixed(2).replace(".", ",");
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.07, ease: EASE }}
      className={cn("group flex flex-col overflow-clip rounded-[12px] bg-mx-shell p-[2px] transition-shadow duration-300", HOVER_SHADOW)}
    >
      {/* 上：数值区。内描边在卡片 hover 时从 10% 提亮到 16% */}
      <div className="mx-stroke-inside relative flex flex-col rounded-[10px] bg-mx-card p-[14px] transition-colors duration-300 group-hover:[--mx-stroke:rgba(255,255,255,0.16)]">
        <div className="flex items-start gap-[14px]">
          <div className="flex min-w-px flex-1 flex-col gap-[10px]">
            <h3 className="w-full font-mx-mono text-[14px] font-normal uppercase leading-[normal] text-mx-mute">{kpi.label}</h3>
            <div className="flex w-full items-center gap-2">
              <AnimatedNumber
                value={kpi.value}
                prefix={kpi.prefix}
                suffix={kpi.suffix}
                decimals={kpi.decimals}
                delay={0.15 + index * 0.07}
                className="whitespace-nowrap font-mx-mono text-[24px] font-semibold leading-[normal] text-mx-fg tabular-nums"
              />
              {kpi.unit ? (
                <span className="min-w-px flex-1 text-[12px] leading-[normal] text-mx-mute">{kpi.unit}</span>
              ) : (
                <span className="h-[15px] w-[83px]" />
              )}
            </div>
          </div>
          <Sparkbars bars={kpi.bars} accent={kpi.accent} delay={0.2 + index * 0.07} />
        </div>
      </div>

      {/* 下：同比脚注。深色外壳直接露出，像卡片底座 */}
      <div className="flex items-center justify-center gap-[10px] overflow-clip px-[12px] py-[10px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex size-[14px] items-center justify-center">
              <Img name="arrowUpCircle" width={14} height={14} className="transition-transform duration-300 group-hover:-translate-y-[1.5px]" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Up {delta}% vs. last year</TooltipContent>
        </Tooltip>
        <p className="mx-font-display min-w-px flex-1 text-right text-[12px] leading-[normal] tracking-[0.24px] text-[#7e7e7e]">
          <span className="font-medium text-mx-success">+{delta}</span> last year
        </p>
      </div>
    </motion.article>
  );
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((k, i) => (
        <KpiCard key={k.id} kpi={k} index={i} />
      ))}
    </div>
  );
}
