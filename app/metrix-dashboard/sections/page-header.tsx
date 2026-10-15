"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Img } from "../ui/icon";

const GRANULARITIES = ["Daily", "Weekly", "Monthly", "Yearly"];

/** 欢迎语 + 粒度下拉/日期 的联体按钮 + 「Export CSV」主按钮（带 busy → done 反馈） */
export function PageHeader({ onExport }: { onExport: () => void }) {
  const [granularity, setGranularity] = useState("Daily");
  const [exportState, setExportState] = useState<"idle" | "busy" | "done">("idle");

  const handleExport = () => {
    if (exportState !== "idle") return;
    setExportState("busy");
    onExport();
    setTimeout(() => setExportState("done"), 650);
    setTimeout(() => setExportState("idle"), 2000);
  };

  return (
    <div className="flex animate-mx-fade-up flex-wrap items-center justify-between gap-3">
      <h1 className="whitespace-nowrap text-[24px] font-medium leading-[normal] tracking-[0.12px] text-mx-fg">Welcome back, Salung</h1>
      <div className="flex items-center gap-2">
        <div className="mx-stroke-inside relative flex items-center overflow-clip rounded-[6px] bg-mx-muted shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex h-[38px] items-center justify-center gap-[6px] border-r-[0.6px] border-mx-border px-[14px] py-[10px] text-[14px] leading-[normal] tracking-[0.07px] text-mx-fg outline-none transition-colors hover:bg-white/[0.04]">
                {granularity}
                <Img name="chevronDown" width={10} height={10} className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              <DropdownMenuGroup>
                {GRANULARITIES.map((g) => (
                  <DropdownMenuItem key={g} onSelect={() => setGranularity(g)}>
                    {g}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="flex h-[38px] items-center justify-center gap-[6px] px-[14px] py-[10px] text-[14px] leading-[normal] tracking-[0.07px] text-mx-fg outline-none transition-colors hover:bg-white/[0.04]">
            <Img name="calendar16" width={16} height={16} />
            6 Nov 2025
          </button>
        </div>
        <Button variant="primary" onClick={handleExport} className="border border-white/20 font-medium" aria-live="polite">
          <span className="relative size-4">
            <Img name="file02White" width={16} height={16} className={exportState === "busy" ? "animate-pulse" : "transition-transform duration-200"} />
          </span>
          {exportState === "done" ? "Exported" : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}
