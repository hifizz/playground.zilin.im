"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DottedRule } from "../charts/dotted-rule";
import { RevenueBars } from "../charts/revenue-bars";
import { AI_INSIGHT, REVENUE_RANGES, scaleRevenue } from "../data";
import { AnimatedNumber } from "../ui/animated-number";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, MenuDot } from "../ui/dropdown-menu";
import { Img } from "../ui/icon";
import { PanelCard, PanelHeader, PanelShell } from "../ui/panel";

/** 「Get AI insight」折叠条：hover 星星旋转，展开时箭头翻转、正文高度动画 */
function AiInsight() {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute left-[5.4px] right-[5.4px] top-[83.4px] z-10">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group mx-stroke-inside relative flex w-full flex-col overflow-clip rounded-[10px] bg-mx-muted p-[8px] text-left shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] outline-none transition-[background-color,box-shadow] duration-200 hover:bg-[#3f3e3c] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2),0px_8px_20px_-8px_rgba(0,0,0,0.5)]"
      >
        <span className="flex w-full items-center justify-between">
          <span className="flex items-center gap-[10px]">
            <span className="relative size-[27px] overflow-clip rounded-[6px] border-[0.6px] border-[rgba(221,221,221,0.1)] bg-mx-muted-2">
              <Img
                name="stars"
                width={13}
                height={13}
                className="absolute left-[6.4px] top-[6.4px] transition-transform duration-500 ease-mx-spring group-hover:rotate-[20deg] group-hover:scale-110"
              />
            </span>
            <span className="whitespace-nowrap text-[12px] leading-[1.6] text-mx-fg">Get AI insight for better analysis</span>
          </span>
          <span className={cn("flex size-[14px] items-center justify-center transition-transform duration-300", open ? "rotate-180" : "rotate-90 group-hover:translate-x-[2px]")}>
            <Img name="arrowUpCircle" width={14} height={14} />
          </span>
        </span>
        <AnimatePresence initial={false}>
          {open && (
            <motion.span
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="block overflow-hidden"
            >
              <span className="block pt-[8px] text-[12px] leading-[1.6] text-[#b3b3b3]">{AI_INSIGHT}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

function RangePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = REVENUE_RANGES.find((r) => r.id === value)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group absolute right-[15.4px] top-[15.4px] z-10 flex h-[34px] items-center justify-center gap-[6px] overflow-clip rounded-[88px] border-[0.6px] border-mx-border bg-mx-card p-[10px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] outline-none transition-colors hover:bg-mx-muted">
          <Img name="calendar14" width={14} height={14} />
          <span className="whitespace-nowrap text-[12px] leading-[1.6] text-mx-mute transition-colors group-hover:text-[#b3b3b3]">{current.label}</span>
          <Img name="chevronDownLight" width={10} height={10} className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {REVENUE_RANGES.map((r) => (
            <DropdownMenuItem key={r.id} onSelect={() => onChange(r.id)}>
              <MenuDot active={r.id === value} />
              {r.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RevenueBreakdown() {
  const [rangeId, setRangeId] = useState("ytd");
  const range = REVENUE_RANGES.find((r) => r.id === rangeId)!;
  const points = useMemo(() => scaleRevenue(range), [range]);

  return (
    <PanelShell aria-labelledby="revenue-title">
      <PanelHeader id="revenue-title" title="Revenue Breakdown" info="Daily revenue against category target" />
      <PanelCard className="h-[424px]">
        {/* 背景 8 条点状水平参考线 */}
        {Array.from({ length: 8 }, (_, i) => (
          <DottedRule key={i} className="absolute left-[8.8px] right-[11.6px]" style={{ top: 142.8 + i * 32 }} color="#554E44" dash="2 3" offset={1} />
        ))}

        <div className="absolute left-[19.4px] top-[19.4px] flex flex-col justify-center gap-[6px]">
          <p className="whitespace-nowrap text-[12px] leading-[normal] text-[#7e7e7e]">Revenue by Category</p>
          <AnimatedNumber value={range.total} prefix="$" className="font-mx-mono text-[24px] font-semibold leading-[normal] text-mx-fg tabular-nums" />
        </div>

        <RangePicker value={rangeId} onChange={setRangeId} />
        <AiInsight />
        <RevenueBars points={points} />

        {/* 底部日期轴：两端大写日期 + 中间点线 */}
        <div className="pointer-events-none absolute bottom-[19.4px] left-[10.4px] right-[11.6px] flex items-center gap-[10px]">
          <p className="whitespace-nowrap text-[12px] uppercase leading-[normal] text-mx-subtle">{range.from}</p>
          <DottedRule className="relative min-w-px flex-1" color="#666666" dash="2.02 3.03" offset={1.01} bothEnds />
          <p className="whitespace-nowrap text-right text-[12px] uppercase leading-[normal] text-mx-subtle">{range.to}</p>
        </div>
      </PanelCard>
    </PanelShell>
  );
}
