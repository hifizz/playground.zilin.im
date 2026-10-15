"use client";

import { useState } from "react";
import { PixelBarChart, COLOR_EXISTING, COLOR_NEW_USER_LEGEND } from "../charts/pixel-bar-chart";
import { SALES_DATA, type SalesPeriod } from "../data";
import { AnimatedNumber } from "../ui/animated-number";
import { PanelCard, PanelHeader, PanelShell } from "../ui/panel";
import { SegmentedControl, SegmentedItem } from "../ui/segmented-control";

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[6px]">
      <span className="size-[6px] rounded-[4px] border border-black/10" style={{ background: color }} />
      <span className="whitespace-nowrap font-mx-mono text-[12px] uppercase leading-[normal] tracking-[0.24px] text-mx-soft">{label}</span>
    </span>
  );
}

export function SalesTrend() {
  const [period, setPeriod] = useState<SalesPeriod>("monthly");

  return (
    <PanelShell aria-labelledby="sales-trend-title">
      <PanelHeader id="sales-trend-title" title="Sales Trend" info="New vs. existing users revenue, in thousands" />
      <PanelCard className="h-[424px] [--chart-top:71px] max-sm:h-[468px] max-sm:[--chart-top:115px]">
        <div className="absolute inset-x-[20px] top-[20px] flex flex-wrap items-start justify-between gap-x-4 gap-y-3 max-sm:inset-x-[16px]">
          <div className="flex h-[31px] items-center gap-[10px] whitespace-nowrap">
            <span className="text-[12px] leading-[normal] text-[#7e7e7e]">Total Revenue :</span>
            <AnimatedNumber
              value={SALES_DATA[period].total}
              prefix="$"
              duration={1.1}
              className="font-mx-mono text-[24px] font-semibold leading-[normal] text-mx-fg tabular-nums"
            />
          </div>
          <div
            className="pointer-events-none absolute left-[264.5px] top-[7px] hidden items-center gap-[28px] min-[900px]:flex lg:hidden min-[1180px]:flex"
            aria-hidden="true"
          >
            <LegendItem color={COLOR_NEW_USER_LEGEND} label="New user" />
            <LegendItem color={COLOR_EXISTING} label="existing user" />
          </div>
          <SegmentedControl value={period} onValueChange={(v) => setPeriod(v as SalesPeriod)} aria-label="Sales period">
            <SegmentedItem value="weekly">Weekly</SegmentedItem>
            <SegmentedItem value="monthly">Monthly</SegmentedItem>
            <SegmentedItem value="yearly">Yearly</SegmentedItem>
          </SegmentedControl>
        </div>
        <PixelBarChart period={period} />
      </PanelCard>
    </PanelShell>
  );
}
