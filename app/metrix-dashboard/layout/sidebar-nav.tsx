"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "../data";
import { Icon, Img } from "../ui/icons";

/** 分组导航：选中项的底板用 layoutId 在条目间弹簧滑动 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [active, setActive] = useState("dashboard");

  return (
    <>
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.title} className="flex flex-col gap-5">
          {gi > 0 && <div className="mx-divider-etched w-[220px]" />}
          <nav aria-label={group.title} className="flex w-full flex-col gap-[10px]">
            <p className="text-[12px] leading-[normal] tracking-[0.06px] text-mx-fg">{group.title}</p>
            <ul className="flex w-full flex-col">
              {group.items.map((item) => {
                const isActive = item.id === active;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActive(item.id);
                        onNavigate?.();
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-2 overflow-clip rounded-[8px] px-[10px] py-[8px] text-left text-[14px] leading-[normal] outline-none transition-colors duration-150",
                        isActive ? "font-medium text-mx-primary" : "text-mx-soft hover:bg-white/[0.03] hover:text-[#cfcfcf]",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="mx-sidebar-active"
                          className="absolute inset-0 rounded-[8px] bg-mx-card"
                          transition={{ type: "spring", stiffness: 520, damping: 40 }}
                        />
                      )}
                      <span className="relative flex size-4 items-center justify-center">
                        {isActive && item.id === "dashboard" ? (
                          <Img name="home" width={16} height={16} />
                        ) : (
                          <Icon
                            name={item.icon}
                            className={cn(
                              "transition-[color,transform] duration-150",
                              isActive ? "text-mx-primary" : "text-mx-subtle group-hover:scale-105 group-hover:text-[#a3a3a3]",
                            )}
                          />
                        )}
                      </span>
                      <span className="relative truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ))}
    </>
  );
}
