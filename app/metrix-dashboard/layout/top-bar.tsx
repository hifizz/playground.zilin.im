"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { AVATAR_SRC, Img } from "../ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // ⌘K / Ctrl+K 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label
      className={cn(
        "group hidden h-[34px] w-[350px] cursor-text items-center justify-between overflow-clip rounded-[6px] border-[0.6px] border-mx-border bg-mx-muted px-[11px] py-[7px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] transition-[box-shadow,border-color,width] duration-200 md:flex",
        focused && "border-mx-primary/50 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2),0px_0px_0px_3px_rgba(249,115,22,0.15)]",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="relative size-[16.64px] shrink-0">
          <Img name="search" width={14.5699} height={14.8872} className="absolute left-[1.15px] top-[1.15px]" />
        </span>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          aria-label="Search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full min-w-0 bg-transparent text-[12.48px] leading-[1.6] text-mx-fg outline-none placeholder:text-[#bbb] [&::-webkit-search-cancel-button]:hidden"
        />
      </span>
      <span className={cn("flex items-center gap-[6px] transition-opacity", focused && "opacity-40")}>
        <kbd className="relative size-[16.64px] overflow-clip rounded-[2px] border-[0.4px] border-[rgba(230,230,230,0.1)] bg-white/10">
          <Img name="cmd" width={10.4} height={10.4} className="absolute left-[2.72px] top-[2.72px]" />
        </kbd>
        <kbd className="relative flex size-[16.64px] items-center justify-center overflow-clip rounded-[2px] border-[0.4px] border-[rgba(230,230,230,0.1)] bg-white/10 font-sans text-[10.4px] leading-[normal] text-[#a9a9a9]">
          K
        </kbd>
      </span>
    </label>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const [unread, setUnread] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between gap-3 border-b-[0.6px] border-mx-border bg-mx-bg/85 px-4 py-3 backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="secondary" size="icon" className="xl:hidden" aria-label="Open menu" onClick={onMenu}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="#808080" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 whitespace-nowrap text-[14px] leading-[normal]">
          <a href="#" className="text-[#808080] transition-colors hover:text-[#b3b3b3]">
            Dashboard
          </a>
          <span className="flex size-3 items-center justify-center">
            <Img name="arrowRight2" width={8} height={4.5} className="-rotate-90" />
          </span>
          <span className="font-medium text-mx-primary" aria-current="page">
            Overview
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-[10px]">
        <GlobalSearch />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="Notifications" className="group" onClick={() => setUnread(false)}>
              <Img name="notification" width={16} height={16} className="transition-transform duration-300 group-hover:[transform:rotate(12deg)]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{unread ? "3 new notifications" : "You're all caught up"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="Inbox" className="group">
              <Img name="archiveHeader" width={16} height={16} className="transition-transform duration-200 group-hover:-translate-y-px" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inbox</TooltipContent>
        </Tooltip>
        <button
          aria-label="Account"
          className="relative size-[34px] shrink-0 overflow-clip rounded-[6px] bg-[#f7f7f7] outline-none transition-[transform,box-shadow] duration-150 hover:shadow-[0px_0px_0px_2px_rgba(249,115,22,0.6)] active:scale-95"
        >
          <img src={AVATAR_SRC} alt="" className="absolute left-0 top-[-6px] h-[46px] w-[34px] max-w-none object-cover" />
        </button>
      </div>
    </header>
  );
}
