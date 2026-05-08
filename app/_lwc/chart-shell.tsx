"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ChartShell({
  title,
  subtitle,
  badge,
  children,
  className,
  side,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-neutral-100 font-sans">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to playground</span>
        </Link>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {side}
        </div>

        <div
          className={cn(
            "mt-6 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_60px_-30px_rgba(0,0,0,0.8)]",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Common chart palette — kept close to TradingView's homepage demos.
export const palette = {
  background: "#0a0b0f",
  surface: "#0d0e13",
  text: "#a3a3a3",
  grid: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.06)",
  up: "#26a69a",
  down: "#ef5350",
  blue: "#3b82f6",
  blueGlow: "rgba(59,130,246,0.28)",
  blueFade: "rgba(59,130,246,0)",
  amber: "#f59e0b",
  violet: "#8b5cf6",
};
