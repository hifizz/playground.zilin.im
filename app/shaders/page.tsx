"use client";

import React from "react";
import Link from "next/link";
import { MeshGradientSection } from "./sections/mesh-gradient-section";
import { PulsingBorderSection } from "./sections/pulsing-border-section";
import { MetaballsSection } from "./sections/metaballs-section";
import { LiquidMetalSection } from "./sections/liquid-metal-section";
import { NeuroNoiseSection } from "./sections/neuro-noise-section";

/**
 * ============================================================================
 * Paper Shaders · 冷色系着色器效果展示页
 * ============================================================================
 * 5 个全屏 section，可上下滚动逐个浏览。每个 section 内部：
 *   - shader 作背景层绝对定位铺满（position:absolute; inset:0），z-0
 *   - 真实文字/按钮用正常 DOM 叠在上面，z-10
 *   - 用 IntersectionObserver 只在进入视口时挂载对应 shader、离开就卸载，
 *     避免同时占用过多 WebGL context（浏览器每标签页上限约 16 个）
 *
 * 调参：每个效果的关键参数都抽成了对应 section 组件的 props，直接在下面传值即可。
 * ============================================================================
 */

const NAV = [
  { id: "mesh-gradient", label: "Mesh Gradient" },
  { id: "pulsing-border", label: "Pulsing Border" },
  { id: "metaballs", label: "Metaballs" },
  { id: "liquid-metal", label: "Liquid Metal" },
  { id: "neuro-noise", label: "Neuro Noise" },
];

export default function ShadersPage() {
  return (
    <main className="relative bg-[#05060a] text-white">
      {/* 返回首页（真实 DOM，固定在左上角最高层） */}
      <Link
        href="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-cyan-100/80 backdrop-blur-sm transition hover:bg-black/60 md:hidden"
      >
        ← 首页
      </Link>

      {/* 右侧锚点导航圆点（真实 DOM，叠在所有 shader 之上） */}
      <nav className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:flex">
        {NAV.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={s.label}
            className="group relative flex items-center justify-end"
          >
            <span className="mr-3 whitespace-nowrap rounded-md bg-black/50 px-2 py-1 text-xs text-cyan-100/90 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              {String(i + 1).padStart(2, "0")} · {s.label}
            </span>
            <span className="h-2.5 w-2.5 rounded-full border border-cyan-300/60 bg-cyan-300/10 transition group-hover:scale-125 group-hover:bg-cyan-300" />
          </a>
        ))}
      </nav>

      {/* 5 个全屏效果 section —— 参数在此处按需覆盖 */}
      <MeshGradientSection />
      <PulsingBorderSection />
      <MetaballsSection />
      <LiquidMetalSection />
      <NeuroNoiseSection />
    </main>
  );
}
