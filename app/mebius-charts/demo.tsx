"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ExternalLink, RotateCcw } from "lucide-react";
import { CHARTS, CATEGORIES, type ChartEntry } from "./charts";
import { cn } from "@/lib/utils";

const X_POST = "https://x.com/malikyoloo/status/2115675118357909597";
const MEBIUS_URL = "https://www.mebius.design/freebies/charts";

export default function MebiusChartsDemo() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHARTS.filter((c) => {
      const inCat = cat === "All" || c.categories.includes(cat);
      const inQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [cat, query]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of CHARTS)
      for (const k of c.categories) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0f] font-sans text-neutral-100">
      {/* soft top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(720px 320px at 50% -60px, rgba(46,125,246,0.14), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-200"
        >
          <ArrowLeft size={12} />
          <span>Back to playground</span>
        </Link>

        {/* ---------- hero ---------- */}
        <header className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-blue-300">
              INSPIRED RECREATION
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] tracking-widest text-neutral-400">
              recharts · {CHARTS.length} charts · fake data
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Mebius Charts · 图表画廊
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            灵感来自{" "}
            <a
              href={X_POST}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 transition-colors hover:text-blue-300"
            >
              @malikyoloo 的 X 帖子
            </a>{" "}
            —— mebius.design 发布的 62 个免费金融图表组件（Figma + React/TS/Tailwind for
            shadcn）。官方 registry 需要账号 token，本页是用{" "}
            <span className="text-neutral-200">recharts</span>{" "}
            手写复刻的致敬画廊，非官方组件、无关联，全部数据为虚构的金融样例。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <a
              href={MEBIUS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
            >
              mebius.design/freebies/charts
              <ExternalLink size={11} />
            </a>
            <a
              href={X_POST}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
            >
              原帖（X）
              <ExternalLink size={11} />
            </a>
          </div>
        </header>

        {/* ---------- filter bar ---------- */}
        <div className="sticky top-0 z-10 -mx-4 mt-10 border-y border-white/[0.05] bg-[#0a0b0f]/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-64">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search charts… (e.g. budget, donut)"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-8 pr-3 text-xs text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 focus:border-blue-500/50 focus:bg-white/[0.05]"
              />
            </div>
            <div className="-mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
              {CATEGORIES.map((c) => {
                const active = cat === c;
                const n =
                  c === "All" ? CHARTS.length : (counts.get(c) ?? 0);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                      active
                        ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                        : "border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200",
                    )}
                  >
                    {c}
                    <span
                      className={cn(
                        "font-mono text-[9px] tabular-nums",
                        active ? "text-blue-300/80" : "text-neutral-600",
                      )}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---------- masonry grid ---------- */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="font-mono tabular-nums">
            {filtered.length} / {CHARTS.length} charts
          </span>
          {(cat !== "All" || query) && (
            <button
              type="button"
              onClick={() => {
                setCat("All");
                setQuery("");
              }}
              className="inline-flex items-center gap-1 text-neutral-400 transition-colors hover:text-neutral-200"
            >
              <RotateCcw size={10} /> reset
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="text-sm text-neutral-400">
              No charts match “{query || cat}”.
            </div>
            <button
              type="button"
              onClick={() => {
                setCat("All");
                setQuery("");
              }}
              className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-neutral-300 transition-colors hover:border-white/25"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            key={`${cat}-${query}`}
            className="mt-4 columns-1 gap-5 sm:columns-2 xl:columns-3"
          >
            {filtered.map((entry, i) => (
              <ChartCell key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}

        {/* ---------- footer credit ---------- */}
        <footer className="mt-14 border-t border-white/[0.05] pt-6 text-[11px] leading-relaxed text-neutral-600">
          <p>
            Playground recreation inspired by{" "}
            <a
              href={MEBIUS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
            >
              mebius.design
            </a>
            {" "}· 62 free chart components. This page is an homage built with{" "}
            <span className="text-neutral-400">recharts</span> — not affiliated
            with or endorsed by mebius; the commercial kit &amp; registry live at{" "}
            <a
              href="https://www.mebius.design"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
            >
              mebius.design
            </a>
            . All finance data shown is fictional.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ChartCell({ entry, index }: { entry: ChartEntry; index: number }) {
  const { Component } = entry;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 9) * 0.035,
        ease: "easeOut",
      }}
      whileHover={{ y: -4 }}
      className="mb-5 inline-block w-full break-inside-avoid"
    >
      <Component />
    </motion.div>
  );
}
