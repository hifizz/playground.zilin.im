"use client";

import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { TeamSwitcher } from "./team-switcher";
import { UserMenu } from "./user-menu";

const MOBILE_SHADOW =
  "shadow-[0_2.8px_2.2px_rgba(0,0,0,0.034),0_6.7px_5.3px_rgba(0,0,0,0.048),0_12.5px_10px_rgba(0,0,0,0.06),0_22.3px_17.9px_rgba(0,0,0,0.072),0_41.8px_33.4px_rgba(0,0,0,0.086),0_100px_80px_rgba(0,0,0,0.12)]";

/** xl 以上常驻；以下是抽屉，由 TopBar 的汉堡按钮打开 */
export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate?: () => void }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col justify-between overflow-y-auto bg-mx-sidebar p-4 [scrollbar-width:none]",
        "border-r-[0.6px] border-mx-border transition-transform duration-300 ease-mx-out xl:sticky xl:top-0 xl:h-screen xl:translate-x-0",
        open ? `translate-x-0 ${MOBILE_SHADOW} xl:shadow-none` : "-translate-x-full",
      )}
    >
      <div className="flex w-full flex-col gap-5">
        <TeamSwitcher />
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <div className="mt-10 flex w-full flex-col gap-[10px]">
        <div className="mx-divider-etched w-[220px] [--divider:#141414]" />
        <UserMenu />
      </div>
    </aside>
  );
}
