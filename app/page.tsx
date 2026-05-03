"use client";

import Link from "next/link";
import { useState } from "react";

type DemoEntry = {
  title: string;
  description: string;
  route: string;
  category: "Interaction" | "Text Demo" | "Explored Demo" | "Agent UX/UI";
  tags?: string[];
  preview: React.ReactNode;
};

// ── Preview Thumbnails ──────────────────────────────────────────────────────

function DynamicIslandThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #111 0%, #000 100%)" }}>
      <div
        style={{
          position: "relative",
          width: 88,
          height: 148,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,8,8,0.96)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 14,
          gap: 10,
        }}
      >
        {/* Dynamic Island pill — expanded music state */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            width: 62,
            height: 22,
            borderRadius: 11,
            background: "#000",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {[3, 5, 4, 7, 4, 5, 3].map((h, i) => (
            <div
              key={i}
              style={{ width: 2, height: h * 2.1, borderRadius: 1, background: "rgba(255,255,255,0.72)" }}
            />
          ))}
        </div>
        {/* Screen placeholder lines */}
        <div style={{ width: 60, display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 2, width: "70%", borderRadius: 1, background: "rgba(255,255,255,0.025)" }} />
        </div>
      </div>
    </div>
  );
}

function NotificationStackThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #080d2e 0%, #150e35 100%)" }}>
      <div style={{ position: "relative", width: 160, height: 90 }}>
        {/* Back card */}
        <div style={{
          position: "absolute", left: 28, right: 0, bottom: 0, height: 58,
          borderRadius: 10, background: "rgba(79,70,229,0.07)", border: "1px solid rgba(255,255,255,0.04)",
        }} />
        {/* Middle card */}
        <div style={{
          position: "absolute", left: 14, right: 7, bottom: 9, height: 62,
          borderRadius: 10, background: "rgba(79,70,229,0.12)", border: "1px solid rgba(255,255,255,0.06)",
        }} />
        {/* Front card */}
        <div style={{
          position: "absolute", left: 0, right: 14, bottom: 18, height: 66,
          borderRadius: 10, background: "rgba(79,70,229,0.22)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(99,102,241,0.55)", flexShrink: 0 }} />
            <div>
              <div style={{ height: 5, width: 56, borderRadius: 3, background: "rgba(255,255,255,0.28)", marginBottom: 5 }} />
              <div style={{ height: 3.5, width: 36, borderRadius: 2, background: "rgba(255,255,255,0.13)" }} />
            </div>
          </div>
          <div style={{ height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ height: 2.5, width: "72%", borderRadius: 2, background: "rgba(255,255,255,0.03)" }} />
        </div>
      </div>
    </div>
  );
}

function ShareDialogThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #160826 0%, #220a44 100%)" }}>
      <div style={{
        width: 148,
        borderRadius: 14,
        background: "rgba(14,8,24,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 14px 12px",
        display: "flex", flexDirection: "column", gap: 9,
      }}>
        <div style={{ height: 5, width: 52, borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />
        {/* Link input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          borderRadius: 8, background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)", padding: "6px 8px",
        }}>
          <div style={{ width: 11, height: 11, borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 3.5, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
        </div>
        {/* Share button */}
        <div style={{
          borderRadius: 8, background: "rgba(139,92,246,0.55)",
          padding: "7px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ height: 5, width: 32, borderRadius: 3, background: "rgba(255,255,255,0.65)" }} />
        </div>
      </div>
    </div>
  );
}

function ListAnimationThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #011c18 0%, #02201e 100%)" }}>
      <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* New card — just inserted, highlighted */}
        <div style={{
          borderRadius: 10,
          background: "rgba(52,211,153,0.14)",
          border: "1px solid rgba(52,211,153,0.22)",
          padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: "rgba(52,211,153,0.38)", flexShrink: 0 }} />
          <div>
            <div style={{ height: 4, width: 64, borderRadius: 2, background: "rgba(255,255,255,0.3)", marginBottom: 4 }} />
            <div style={{ height: 3, width: 40, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
          </div>
        </div>
        {[{ w: 52, opacity: 0.07 }, { w: 40, opacity: 0.05 }].map(({ w, opacity }, i) => (
          <div key={i} style={{
            borderRadius: 10,
            background: `rgba(255,255,255,${opacity})`,
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
            <div>
              <div style={{ height: 4, width: w, borderRadius: 2, background: "rgba(255,255,255,0.18)", marginBottom: 4 }} />
              <div style={{ height: 3, width: w - 14, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineMinimapThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #1a0a00 0%, #251600 100%)" }}>
      <div style={{ display: "flex", gap: 14 }}>
        {/* Rail */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          {[false, true, false, false].map((active, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 7, height: 7, borderRadius: 4,
                background: active ? "rgba(251,146,60,0.9)" : "rgba(255,255,255,0.18)",
                border: active ? "1px solid rgba(251,146,60,0.45)" : "none",
                boxShadow: active ? "0 0 7px rgba(251,146,60,0.5)" : "none",
              }} />
              {i < 3 && <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)" }} />}
            </div>
          ))}
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)" }} />
        </div>
        {/* Text lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
          {[48, 64, 36, 54].map((w, i) => (
            <div key={i} style={{
              height: 5, width: w, borderRadius: 3,
              background: i === 1 ? "rgba(251,146,60,0.42)" : "rgba(255,255,255,0.1)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncButtonThumb() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5" style={{ background: "linear-gradient(145deg, #001818 0%, #001a30 100%)" }}>
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <circle cx="23" cy="23" r="18" stroke="rgba(34,211,238,0.14)" strokeWidth="1.5" />
        <path d="M13 23a10 10 0 0 1 17-7.4" stroke="rgba(34,211,238,0.78)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M33 23a10 10 0 0 1-17 7.4" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="29,11.5 33.5,15.5 29,15.5" fill="rgba(34,211,238,0.78)" />
      </svg>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        borderRadius: 999,
        background: "rgba(34,211,238,0.1)",
        border: "1px solid rgba(34,211,238,0.2)",
        padding: "8px 20px",
      }}>
        <div style={{ height: 5, width: 44, borderRadius: 3, background: "rgba(34,211,238,0.42)" }} />
        <div style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(34,211,238,0.62)" }} />
      </div>
    </div>
  );
}

function StockCalcThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0c1117 0%, #111520 100%)" }}>
      <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 7 }}>
        {[{ prefix: "$", w: 60 }, { prefix: "×", w: 44 }, { prefix: "$", w: 56 }].map(({ prefix, w }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "monospace" }}>{prefix}</span>
            </div>
            <div style={{
              flex: 1, height: 28, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", paddingLeft: 8,
            }}>
              <div style={{ height: 4, width: w, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>
          </div>
        ))}
        <div style={{
          borderRadius: 10,
          background: "rgba(52,211,153,0.1)",
          border: "1px solid rgba(52,211,153,0.18)",
          padding: "8px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ height: 5, width: 36, borderRadius: 3, background: "rgba(52,211,153,0.52)" }} />
          <div style={{ height: 4, width: 52, borderRadius: 2, background: "rgba(52,211,153,0.38)" }} />
        </div>
      </div>
    </div>
  );
}

function MobileFullscreenThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #160010 0%, #220840 100%)" }}>
      <div style={{
        width: 72, height: 128, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(8,3,14,0.8)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ height: 28, background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", paddingLeft: 10 }}>
          <div style={{ height: 4, width: 32, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ height: 3, width: "80%", borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
          <div style={{ height: 3, width: "60%", borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 4 }} />
          <div style={{ height: 3, width: "75%", borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div style={{ height: 28, background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(255,255,255,0.18)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid rgba(255,255,255,0.18)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(236,72,153,0.4)", background: "rgba(236,72,153,0.1)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Demo Data ───────────────────────────────────────────────────────────────

const demos: DemoEntry[] = [
  {
    title: "Dynamic Island",
    description: "iOS Dynamic Island — 12 interaction states with Framer Motion spring physics.",
    route: "/dynamic-island",
    category: "Interaction",
    tags: ["Framer Motion", "iOS"],
    preview: <DynamicIslandThumb />,
  },
  {
    title: "Notification Stack",
    description: "macOS-style glass-morphism notification stack with configurable spring presets.",
    route: "/notification-spring-macos",
    category: "Interaction",
    tags: ["Framer Motion", "Glass"],
    preview: <NotificationStackThumb />,
  },
  {
    title: "Share Dialog",
    description: "Multi-state share modal with public / access-code modes and layout animations.",
    route: "/share-dialog",
    category: "Interaction",
    tags: ["Framer Motion"],
    preview: <ShareDialogThumb />,
  },
  {
    title: "List Animation",
    description: "Configurable spring list with top-insert enter effects and preset switching.",
    route: "/list-animation",
    category: "Interaction",
    tags: ["Framer Motion"],
    preview: <ListAnimationThumb />,
  },
  {
    title: "Timeline Minimap",
    description: "Chat timeline navigator with IntersectionObserver highlights and scroll-jump.",
    route: "/minimap",
    category: "Interaction",
    tags: ["IntersectionObserver"],
    preview: <TimelineMinimapThumb />,
  },
  {
    title: "Sync Button",
    description: "Three variants of an animated sync / loading button — Framer Motion & pure CSS.",
    route: "/sync-button",
    category: "Interaction",
    tags: ["CSS Animation"],
    preview: <SyncButtonThumb />,
  },
  {
    title: "Stock Calculator",
    description: "USD / CNY P&L calculator with buy, sell, and target-price inputs.",
    route: "/calc",
    category: "Interaction",
    tags: ["Utility"],
    preview: <StockCalcThumb />,
  },
  {
    title: "Mobile Fullscreen",
    description: "Feature-detection based viewport-height adaptation for mobile browsers.",
    route: "/mobile-fullscreen",
    category: "Explored Demo",
    tags: ["Mobile"],
    preview: <MobileFullscreenThumb />,
  },
];

// ── Page ────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ["All", "Interaction", "Explored Demo", "Agent UX/UI"] as const;

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? demos
      : demos.filter((d) => d.category === activeCategory);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 font-sans">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl">
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-neutral-50 sm:text-7xl">
            Playground
          </h1>
          <p className="mb-1 text-lg text-neutral-300 sm:text-xl">
            AI 时代的 UI/UX 实验室
          </p>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-neutral-500">
            研究 UI Agent 所需的各种交互效果，以 shadcn/ui 可安装形式维护与分发。
          </p>
          <div className="flex flex-wrap gap-2">
            {[`${demos.length} Demos`, "Framer Motion", "shadcn/ui"].map(
              (chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1 font-mono text-[11px] text-neutral-500"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Demos Grid ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24 md:px-0">
        {/* Separator */}
        <div className="mb-8 h-px bg-neutral-700/50" />

        {/* Category filter */}
        <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-neutral-50 text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((demo) => (
            <Link
              key={demo.route}
              href={demo.route}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-800 transition-all duration-200 hover:border-neutral-600 hover:shadow-lg hover:shadow-black/30"
            >
              {/* Preview area */}
              <div className="relative h-40 overflow-hidden">
                {demo.preview}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-200 transition-colors group-hover:text-neutral-50">
                    {demo.title}
                  </span>
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-600 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M2.5 6h7M6.5 3l3 3-3 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="text-xs leading-relaxed text-neutral-500">
                  {demo.description}
                </p>

                {demo.tags && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {demo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[10px] text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-600">
            No demos in this category yet.
          </p>
        )}
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-700/50 px-6 py-5 sm:px-10">
        <p className="text-xs text-neutral-600">
          zilin · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
