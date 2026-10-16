"use client";

import { useState } from "react";
import { WORKSPACES } from "../data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, MenuDot } from "../ui/dropdown-menu";
import { Img } from "../ui/icons";

/** 侧边栏顶部的工作区切换器：logo + 两行文字 + 上下箭头，点开是工作区列表 */
export function TeamSwitcher() {
  const [current, setCurrent] = useState(WORKSPACES[0]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Switch team"
          className="group relative flex w-[220px] items-center gap-[8.32px] overflow-clip rounded-[8px] bg-mx-card p-[10.4px] text-left shadow-[inset_0_0_0_1px_#1a1a19] outline-none transition-colors hover:bg-[#353433]"
        >
          <span className="relative size-[33.28px] shrink-0">
            <Img name="logo" width={42.88} height={42.88} className="absolute left-[-4.8px] top-[-2.8px]" />
          </span>
          <span className="flex min-w-px flex-1 flex-col justify-center gap-[6px] leading-none">
            <span className="w-full text-[12px] text-mx-subtle">Agency</span>
            <span className="w-full truncate text-[14px] font-medium text-[#ccc]">{current}</span>
          </span>
          <Img name="selectorChevrons" width={8} height={12} className="transition-transform duration-200 group-hover:scale-110" />
          {/* 叠一层 1.6px 的亮描边，让按钮边缘有「玻璃」高光 */}
          <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_0px_0px_1.6px_rgba(255,255,255,0.1)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuGroup>
          {WORKSPACES.map((w) => (
            <DropdownMenuItem key={w} onSelect={() => setCurrent(w)}>
              <MenuDot active={w === current} />
              {w}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
