"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, FileSearch, Hammer, Cog, Check } from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * <ShimmerText> — Cursor-style 文本闪光组件
 * --------------------------------------------------------------------------
 * 思路：
 *   把文字本身当作一个 mask，背景画一条「基色 → 高光 → 基色」的水平渐变，
 *   然后通过 background-clip: text 把渐变只留在文字范围内，再用动画
 *   滑动 background-position，让高光带从右往左穿过文字。
 *
 * 关键点：
 *   1) background-size 比容器宽很多（默认 250%），高光带才会显得「窄而清晰」。
 *   2) 渐变里 base 色占两端大块、高光只占中间一小段（默认 ±5%），
 *      这样滑动时大部分时间文字是 base 色，只有那一瞬被照亮。
 *   3) 动画用 linear，匀速更像「正在工作」。spring 反而会有顿挫感。
 */

type ShimmerTextProps = {
  children: React.ReactNode;
  /** 高光循环时长（秒） */
  duration?: number;
  /** 文字基色（暗淡态） */
  baseColor?: string;
  /** 高光色（亮态） */
  highlightColor?: string;
  /** 高光带宽度（百分比，0–50），越小越锐利 */
  shimmerWidth?: number;
  /** 暂停动画（用于「完成」态） */
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function ShimmerText({
  children,
  duration = 2.4,
  baseColor = "rgba(255,255,255,0.35)",
  highlightColor = "rgba(255,255,255,0.95)",
  shimmerWidth = 8,
  paused = false,
  className,
  style,
}: ShimmerTextProps) {
  const half = Math.max(1, Math.min(40, shimmerWidth));
  const gradient = `linear-gradient(
    90deg,
    ${baseColor} 0%,
    ${baseColor} ${50 - half}%,
    ${highlightColor} 50%,
    ${baseColor} ${50 + half}%,
    ${baseColor} 100%
  )`;

  return (
    <span
      className={className}
      style={{
        // 必须 inline-block：背景的 250% 是相对元素自己的盒子算的，
        // 纯 inline 元素的盒子取决于已渲染文字的宽度，会出现循环依赖、文字被截。
        display: "inline-block",
        // 防御性内边距：letter-spacing 为负 / 某些字体末尾字形会超出 advance width，
        // 导致 background-clip:text 范围不够、最后一个字像被切。
        // 用 padding 把 box 撑大、再用负 margin 把 layout 还原。
        paddingInline: "0.25em",
        marginInline: "-0.25em",
        backgroundImage: gradient,
        backgroundSize: "250% 100%",
        backgroundRepeat: "no-repeat",
        // 与 keyframes 的 0% 对齐，避免 paused 时与运行态错位
        backgroundPosition: "100% 0",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        animation: paused
          ? "none"
          : `shimmer-text-sweep ${duration}s linear infinite`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * --------------------------------------------------------------------------
 * Demo: 模拟 Cursor Agent 执行流
 * --------------------------------------------------------------------------
 * 一系列状态消息轮播，每条消息在「执行中」时 shimmer，
 * 完成后切到下一条；最后整体进入 done 态，shimmer 停止、变绿勾。
 */

type Step = {
  icon: React.ElementType;
  label: string;
  /** 该步骤模拟耗时（ms） */
  duration: number;
};

const STEPS: Step[] = [
  { icon: FileSearch, label: "Reading project files", duration: 2200 },
  { icon: Cog, label: "Analyzing dependencies", duration: 1800 },
  { icon: Hammer, label: "Applying edits to 4 files", duration: 2600 },
  { icon: Sparkles, label: "Generating commit message", duration: 1600 },
];

function CursorAgentDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (stepIdx >= STEPS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(
      () => setStepIdx((i) => i + 1),
      STEPS[stepIdx].duration,
    );
    return () => clearTimeout(t);
  }, [stepIdx, done]);

  const reset = () => {
    setStepIdx(0);
    setDone(false);
  };

  const current = STEPS[Math.min(stepIdx, STEPS.length - 1)];
  const Icon = done ? Check : current.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101013] p-5 shadow-2xl shadow-black/40">
      {/* fake editor chrome */}
      <div className="mb-4 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] font-medium tracking-wide text-white/30">
          agent · auto
        </span>
      </div>

      {/* status row */}
      <div className="flex h-7 items-center gap-2.5 text-[13px]">
        <motion.div
          key={done ? "done" : stepIdx}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            done ? "bg-emerald-500/20 text-emerald-400" : "text-white/50"
          }`}
        >
          <Icon size={done ? 13 : 14} strokeWidth={done ? 2.8 : 2} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={done ? "done-text" : current.label}
            initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {done ? (
              <span className="font-medium text-emerald-300/90">
                Done in 8.2s
              </span>
            ) : (
              <ShimmerText>{current.label}…</ShimmerText>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress dots */}
      <div className="mt-5 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/5"
          >
            <motion.div
              animate={{ width: done || i < stepIdx ? "100%" : i === stepIdx ? "60%" : "0%" }}
              transition={{ duration: i === stepIdx ? STEPS[i].duration / 1000 : 0.4, ease: "linear" }}
              className={`h-full ${done ? "bg-emerald-400/70" : "bg-white/40"}`}
            />
          </div>
        ))}
      </div>

      <button
        onClick={reset}
        className="mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Replay
      </button>
    </div>
  );
}

/**
 * --------------------------------------------------------------------------
 * Demo: 参数调试区
 * --------------------------------------------------------------------------
 */

function PlaygroundDemo() {
  const [duration, setDuration] = useState(2.4);
  const [shimmerWidth, setShimmerWidth] = useState(8);
  const [size, setSize] = useState(20);
  const [paused, setPaused] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101013] p-5">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Playground
      </div>

      <div
        className="flex min-h-[120px] items-center justify-center rounded-lg bg-black/40 px-6"
        style={{ fontSize: size, lineHeight: 1.4 }}
      >
        <ShimmerText
          duration={duration}
          shimmerWidth={shimmerWidth}
          paused={paused}
          style={{ fontWeight: 500 }}
        >
          Generating component with shimmer effect…
        </ShimmerText>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 text-[12px] text-white/70 sm:grid-cols-2">
        <Slider
          label="Duration"
          value={duration}
          min={0.6}
          max={5}
          step={0.1}
          onChange={setDuration}
          format={(v) => `${v.toFixed(1)}s`}
        />
        <Slider
          label="Shimmer width"
          value={shimmerWidth}
          min={2}
          max={30}
          step={1}
          onChange={setShimmerWidth}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Font size"
          value={size}
          min={12}
          max={48}
          step={1}
          onChange={setSize}
          format={(v) => `${v}px`}
        />
        <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <span>Paused</span>
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
            className="h-4 w-4 accent-white"
          />
        </label>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-white/50">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
      />
    </label>
  );
}

/**
 * --------------------------------------------------------------------------
 * Demo: 配色变体
 * --------------------------------------------------------------------------
 */

const VARIANTS = [
  {
    name: "Default · Cursor",
    base: "rgba(255,255,255,0.35)",
    highlight: "rgba(255,255,255,0.95)",
  },
  {
    name: "Indigo",
    base: "rgba(165,180,252,0.35)",
    highlight: "rgba(224,231,255,1)",
  },
  {
    name: "Emerald",
    base: "rgba(110,231,183,0.35)",
    highlight: "rgba(236,253,245,1)",
  },
  {
    name: "Amber",
    base: "rgba(252,211,77,0.35)",
    highlight: "rgba(255,251,235,1)",
  },
  {
    name: "Rose",
    base: "rgba(253,164,175,0.4)",
    highlight: "rgba(255,228,230,1)",
  },
];

function VariantsDemo() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101013] p-5">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Color variants
      </div>
      <div className="flex flex-col gap-2.5 text-[15px] font-medium">
        {VARIANTS.map((v) => (
          <div
            key={v.name}
            className="flex items-center justify-between rounded-md bg-black/30 px-4 py-2.5"
          >
            <ShimmerText
              baseColor={v.base}
              highlightColor={v.highlight}
              duration={2.6}
            >
              {v.name} — analyzing repository…
            </ShimmerText>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * --------------------------------------------------------------------------
 * Page
 * --------------------------------------------------------------------------
 */

export default function ShimmerTextPage() {
  // 注入 keyframes（独立组件之间共享一份）
  const keyframes = useMemo(
    () => `
      @keyframes shimmer-text-sweep {
        /* 必须保持在 [0%, 100%] 之内：超出会让 background 跑到容器外，
           background-clip:text 把没背景那段文字渲染成完全透明，
           表现为「循环结束瞬间文字渐渐消失、又突然回来」的闪烁。
           position 100% → 0% 对应高光从左向右扫过（Cursor 默认方向）。 */
        0%   { background-position: 100% 0; }
        100% { background-position: 0% 0; }
      }
    `,
    [],
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] py-12 text-white">
      <style>{keyframes}</style>

      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Agent UX
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <ShimmerText duration={3} shimmerWidth={6}>
              Shimmer Text
            </ShimmerText>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/50">
            Cursor IDE 在 agent 执行时使用的文字闪光效果。基色 + 一道窄高光从
            右向左循环穿过文字，暗示「正在进行中」。纯 CSS background-clip
            实现，无需 JS 逐帧。
          </p>
        </header>

        <CursorAgentDemo />
        <PlaygroundDemo />
        <VariantsDemo />

        <footer className="pb-6 text-xs text-white/30">
          Tip: 高光带越窄、动画越慢，越像「沉思」；越宽越快则像「冲刺」。
        </footer>
      </div>
    </div>
  );
}
