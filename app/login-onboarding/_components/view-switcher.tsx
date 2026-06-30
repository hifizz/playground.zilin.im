"use client";

import { motion } from "framer-motion";
import type { LeftView } from "./types";

const TABS: { key: LeftView; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "login", label: "Login" },
  { key: "signup", label: "Sign up" },
];

/** 演示控件：直观展示「左侧模块可被整块替换」 */
export function ViewSwitcher({
  value,
  onChange,
}: {
  value: LeftView;
  onChange: (v: LeftView) => void;
}) {
  return (
    <div className="flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
            value === t.key ? "text-neutral-900" : "text-white/55 hover:text-white/90"
          }`}
        >
          {value === t.key && (
            <motion.span
              layoutId="view-pill"
              className="absolute inset-0 rounded-full bg-white"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
