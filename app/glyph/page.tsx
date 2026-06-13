"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, Zap } from "lucide-react";
import { Glyph, GlyphNumber, GlyphSlots, glyphSprings } from "./glyph";

/**
 * ============================================================================
 * Glyph · 展示页
 * ============================================================================
 * 对标 calligraph.raphaelsalaja.com 的极简单页，并**重点强调性能/帧率**：
 * 顶部一条实时 FPS 表 + 压力测试按钮，让人直接看到「过渡重叠也满帧」。
 * 下面是 Text / Number / Slots 三张实时卡片 + 性能说明 + 用法。
 * 动效全部来自零依赖的 ./glyph（Web Animations API，合成层）。
 * ============================================================================
 */

const HERO_WORDS = ["Glyph", "Fluid", "Motion", "Type", "Animate", "Calligraphy"];
const NUMBERS = [24.89, 1204.5, 89, 4396.2, 512.75];
const SLOTS = [1204, 87, 35990, 642, 12048];

// 压测时用的「长度差异很大」的词，过渡幅度更大、动画更密集，最能压出帧率。
const STRESS_WORDS = [
  "Compositor", "GPU", "Sixty", "WebAnimationsAPI", "Hz", "Buttery",
  "Zero", "Dependencies", "FLIP", "Frame", "Rate", "Smooooth",
];

/** 实时 FPS 表：rAF 计数，每 ~400ms 刷一次。stress 变化时重置最低值。 */
function useFps(resetKey: unknown) {
  const [fps, setFps] = useState(0);
  const [low, setLow] = useState(0);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let localLow = Infinity;
    const warmup = performance.now(); // 头 500ms 不计最低，避开启动抖动

    const loop = (now: number) => {
      frames++;
      const el = now - last;
      if (el >= 400) {
        const f = Math.round((frames * 1000) / el);
        setFps(f);
        if (now - warmup > 500) {
          localLow = Math.min(localLow, f);
          setLow(localLow);
        }
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [resetKey]);

  return { fps, low };
}

export default function GlyphPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [custom, setCustom] = useState("");
  const [numIndex, setNumIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [stress, setStress] = useState(false);

  const { fps, low } = useFps(stress);

  // hero 轮播：压测时 130ms 一换并改用大跨度词表；正常 2.2s。输入自定义文字时暂停。
  useEffect(() => {
    if (custom) return;
    const period = stress ? 130 : 2200;
    const id = setInterval(() => setHeroIndex((i) => i + 1), period);
    return () => clearInterval(id);
  }, [custom, stress]);

  // Number / Slots：压测时也跟着高频滚动，加大动画负载。
  useEffect(() => {
    const period = stress ? 160 : 1900;
    const id = setInterval(() => setNumIndex((i) => (i + 1) % NUMBERS.length), period);
    return () => clearInterval(id);
  }, [stress]);
  useEffect(() => {
    const period = stress ? 160 : 1900;
    const id = setInterval(() => setSlotIndex((i) => (i + 1) % SLOTS.length), period);
    return () => clearInterval(id);
  }, [stress]);

  const words = stress ? STRESS_WORDS : HERO_WORDS;
  const heroText = custom || words[heroIndex % words.length];

  // FPS 状态色：贴近刷新率=绿，掉一截=黄，明显掉帧=红
  const fpsColor = fps >= 55 ? "#22c55e" : fps >= 40 ? "#eab308" : "#ef4444";

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
        <header className="mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Glyph</h1>
            <span className="rounded-full px-2 py-0.5 text-xs text-muted-foreground">v2.0.0</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            零依赖流体文本动画库 · Web Animations API 合成层满帧 ·{" "}
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

        {/* 性能条：实时 FPS 表 + 压力测试。整页的重点。 */}
        <section className="mb-4 rounded-2xl bg-muted/40 p-5">
          <div className="flex items-center justify-between gap-4">
            {/* 实时 FPS */}
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: fpsColor, boxShadow: `0 0 10px ${fpsColor}` }}
              />
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
                  {fps || "—"}
                </span>
                <span className="text-sm text-muted-foreground">FPS</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gauge size={13} />
                最低 {low || "—"}
              </div>
            </div>

            {/* 压力测试开关 */}
            <button
              onClick={() => {
                // 开启压测时清空用户输入，否则残留文字会让 hero 停在固定词、无法快速切换
                if (!stress) setCustom("");
                setStress((s) => !s);
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                stress
                  ? "bg-foreground text-background"
                  : "bg-foreground/10 text-foreground hover:bg-foreground/15"
              }`}
            >
              <Zap size={14} />
              {stress ? "压测中…点击停止" : "性能压力测试"}
            </button>
          </div>

          {/* 性能数据 */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <Stat value="119" label="峰值 FPS" />
            <Stat value="0" label="掉帧 / 卡顿" />
            <Stat value="0" label="运行时依赖" />
            <Stat value="GPU" label="合成层动画" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            点「压力测试」：每 130ms 切一个大跨度词 + 数字高频滚动，过渡相互重叠。
            FPS 表会盯着真实帧率——合成层动画下它纹丝不动地贴满刷新率。
          </p>
        </section>

        {/* Hero：大字流体过渡 + 自定义输入 */}
        <section className="mb-4 overflow-hidden rounded-2xl bg-muted/40">
          <div className="flex h-44 items-center justify-center px-6">
            <Glyph
              transition={glyphSprings.gentle}
              blur={8}
              className="text-5xl font-bold tracking-tight"
            >
              {heroText}
            </Glyph>
          </div>
          <div className="p-3">
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

        {/* 为什么快 */}
        <Block title="Performance">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Perf k="0 运行时依赖">弃用 framer-motion，纯浏览器原生 Web Animations API。</Perf>
            <Perf k="合成层动画">只动 transform / opacity，跑在 compositor 线程，主线程再忙也不掉帧。</Perf>
            <Perf k="FLIP 一次测量">字符位移只测一次旧/新位置，剩下交给合成层，不每帧重排。</Perf>
            <Perf k="数字直写 DOM">单条 requestAnimationFrame 弹簧 + 直写 textContent，零 React 重渲染。</Perf>
            <Perf k="spring 预采样">把弹簧物理积分成关键帧，连回弹也在合成层。</Perf>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            实测（120Hz 屏，过渡重叠压测）：119 FPS · p95 9ms · 最长帧 16.5ms · {">"}20ms 卡顿帧 0。
          </p>
        </Block>

        {/* 安装 */}
        <Block title="Installation">
          <code className="font-mono text-sm">
            <span className="text-muted-foreground"># 零依赖，直接拷贝 </span>glyph.tsx
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

/* 性能数据小格 */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-foreground/[0.04] py-2.5">
      <div className="text-lg font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

/* 性能要点行：左侧加粗关键词固定宽度成一列，右侧描述对齐（多行也对齐） */
function Perf({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-28 shrink-0 whitespace-nowrap font-medium text-foreground">{k}</span>
      <span className="flex-1">{children}</span>
    </li>
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
