"use client";

/* eslint-disable @next/next/no-img-element */
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AVATAR_SRC, Img } from "../ui/icon";

/** 侧边栏底部的账号卡片：头像 + 在线点 + 名字/套餐，向上弹出菜单 */
export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group mx-stroke-inside relative flex w-full items-center gap-[8.32px] rounded-[10px] bg-mx-card p-[10.4px] text-left outline-none transition-colors hover:bg-[#353433]">
          <span className="relative size-[33.28px] shrink-0 overflow-clip rounded-[8.32px] border-[0.6px] border-white bg-[#f7f7f7] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06)]">
            <img
              src={AVATAR_SRC}
              alt="Salung Prastyo"
              className="absolute left-[-3.72px] top-[-8.92px] h-[50.96px] w-[38.506px] max-w-none object-cover"
            />
          </span>
          <span className="flex min-w-px flex-1 flex-col justify-center gap-[6px] whitespace-nowrap leading-none mx-font-display">
            <span className="text-[14px] tracking-[0.28px] text-mx-fg">Salung Prastyo</span>
            <span className="text-[12px] tracking-[0.24px] text-mx-subtle">Pro Plan</span>
          </span>
          <Img name="onlineDot" width={9.36} height={9.36} className="absolute bottom-[6.78px] left-[35.6px]" />
          <span className="flex size-3 items-center justify-center">
            <Img name="arrowDown2" width={8.2} height={4.7} className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-[218px]">
        <DropdownMenuLabel>salung@sparkpixel.studio</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
