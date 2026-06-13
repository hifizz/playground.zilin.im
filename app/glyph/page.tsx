"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Glyph, GlyphNumber, GlyphSlots, glyphSprings } from "./glyph";

/**
 * ============================================================================
 * Glyph · 展示页
 * ============================================================================
 * 对标 calligraph.raphaelsalaja.com 的极简单页：标题 + 一句话 + 三张实时卡片
 * （Text / Number / Slots）+ 安装/用法代码块。所有动效都来自 ./glyph 这个
 * 自研小库。配色走项目的 shadcn 主题 token，自动适配明暗。
 * ============================================================================
 */

// hero 轮播的词。挑了一组长度不一的词，好展示「宽度也会做动画」。
const HERO_WORDS = ["Glyph", "Fluid", "Motion", "Type", "Animate", "Calligraphy"];

// Number 卡片轮播的金额。
const NUMBERS = [24.89, 1204.5, 89, 4396.2, 512.75];

// Slots 卡片轮播的数值。
const SLOTS = [1204, 87, 35990, 642, 12048];

export default function GlyphPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [custom, setCustom] = useState("");
  const [numIndex, setNumIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);

  // hero 每 2.2s 换一个词（除非用户正在输入自定义文本）。
  useEffect(() => {
    if (custom) return;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_WORDS.length), 2200);
    return () => clearInterval(id);
  }, [custom]);

  // Number / Slots 各自定时滚动。
  useEffect(() => {
    const id = setInterval(() => setNumIndex((i) => (i + 1) % NUMBERS.length), 1900);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setSlotIndex((i) => (i + 1) % SLOTS.length), 1900);
    return () => clearInterval(id);
  }, []);

  const heroText = custom || HERO_WORDS[heroIndex];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* 返回首页 */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          playground
        </Link>

        {/* 标题区 */}
        <header className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Glyph</h1>
            <span className="rounded-full px-2 py-0.5 text-xs text-muted-foreground">
              v1.0.0
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            流体文本动画库，由 Motion 驱动 ·{" "}
            <a
              href="https://calligraph.raphaelsalaja.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              灵感来自 calligraph
            </a>
          </p>
        </header>

        {/* Hero：大字流体过渡 + 自定义输入 */}
        <section className="mb-4 overflow-hidden rounded-2xl  bg-muted/40">
          <div className="flex h-44 items-center justify-center px-6">
            <Glyph
              transition={glyphSprings.gentle}
              blur={8}
              y={16}
              className="text-5xl font-bold tracking-tight"
            >
              {heroText}
            </Glyph>
          </div>
          <div className=" p-3">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="输入任意文字，看它流体变形…"
              className="w-full bg-transparent px-2 py-1.5 text-center text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* 三张实时卡片 */}
        <section className="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DemoCard label="Text">
            <Glyph className="text-xl font-semibold">
              {["Craft", "Build", "Ship", "Design"][numIndex % 4]}
            </Glyph>
          </DemoCard>

          <DemoCard label="Number">
            <GlyphNumber
              value={NUMBERS[numIndex]}
              format={(v) =>
                "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
              transition={glyphSprings.smooth}
              className="text-xl font-semibold"
            />
          </DemoCard>

          <DemoCard label="Slots">
            <GlyphSlots
              value={SLOTS[slotIndex]}
              format={(v) => "$" + v.toLocaleString("en-US")}
              className="text-xl font-semibold"
            />
          </DemoCard>
        </section>

        {/* 安装 */}
        <Block title="Installation">
          <code className="font-mono text-sm">
            <span className="text-muted-foreground">$ </span>npm install framer-motion
          </code>
        </Block>

        {/* 用法 */}
        <Block title="Usage">
          <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
            <code>{`import { Glyph, GlyphNumber, GlyphSlots } from "./glyph";

<Glyph>${heroText}</Glyph>
<GlyphNumber value={${Math.round(NUMBERS[numIndex])}} />
<GlyphSlots value={${SLOTS[slotIndex]}} />`}</code>
          </pre>
        </Block>
      </div>
    </div>
  );
}

/* 实时卡片外壳：顶部小标签 + 居中内容 */
function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/40 p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex h-8 items-center">{children}</div>
    </div>
  );
}

/* 代码块外壳 */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <div className="rounded-xl bg-muted/40 p-4">{children}</div>
    </div>
  );
}
