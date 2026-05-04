"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Rocket,
  Zap,
  Shield,
  Loader2,
  Check,
  Cpu,
  Brain,
  Wifi,
  Activity,
  Download,
} from "lucide-react";

/**
 * ============================================================================
 * Border Beam · 沿圆角矩形描边运动的光束
 * ============================================================================
 *
 * 参考：magicui.design/docs/components/border-beam（Magic UI）
 *      beam.jakubantalik.com（同款效果的可视化 playground）
 *
 * 核心思路（两步）：
 *
 *   ① 用一层 absolute overlay 把容器的「描边那一圈」单独抠出来：
 *      给 overlay 加 padding = borderWidth，再用双层 mask：
 *        - 第 1 层 mask 用 content-box 作画布（只覆盖内部）
 *        - 第 2 层 mask 用 border-box（覆盖整个 overlay）
 *        - mask-composite: exclude → 两层相减，只留下 padding 那一圈
 *      于是 overlay 本身就是个「描边形状」的画布。
 *
 *   ② 在 overlay 内部放一个发光方块，让它沿着「圆角矩形」轨迹运动：
 *        - offset-path: rect(0 auto auto 0 round Rpx) → 沿父容器外缘的圆角矩形走
 *        - 动画 offset-distance 从 0% → 100% 即跑完一整圈
 *        - 方块尺寸 == 圆角半径，过弯时刚好"贴边滑过"
 *      mask 把方块超出描边的部分裁掉，肉眼只看到一道光带在边上跑。
 *
 * 优点：完全 GPU 友好，圆角处也是平滑的，几乎零 JS。
 * 备选：用旋转 conic-gradient 也能做（见 ConicBeamCard），但 beam 不会贴圆角。
 * ============================================================================
 */

type BorderBeamProps = {
  /** 光斑方块尺寸（px）。决定亮带的"长度"。 */
  size?: number;
  /**
   * 运动路径的圆角半径。默认 = size（magicui 行为）。
   *
   * **重要：尽量保持 pathRadius == size。** 拆开虽然能让光斑中心更贴可见轮廓，
   * 但当 size >> pathRadius 时，方块在 90° 旋转过程中，gradient 的「亮头」
   * （在切线方向上 size/2 处）会被甩出容器外，被 mask 裁掉；
   * 此时肉眼看到的「最亮可见像素」会突然回退到 gradient 中段，
   * 造成「倒车」错觉。要避免这个就别拆。
   *
   * 真要拆只在 pathRadius > size 的方向上有用（容器很方但你想要 path 走圆弧）。
   * 容器小（按钮等）就直接调 size 本身，跟着容器 border-radius 走。
   */
  pathRadius?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  reverse?: boolean;
  /** 起始位置（百分比 0–100）。多条 beam 同时跑时用来错开相位。 */
  initialOffset?: number;
  className?: string;
};

function BorderBeam({
  size = 60,
  pathRadius,
  duration = 6,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  borderWidth = 1,
  reverse = false,
  initialOffset = 0,
  className,
}: BorderBeamProps) {
  const r = pathRadius ?? size;
  const maskLayers =
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        borderRadius: "inherit",
        padding: borderWidth,
        // 关键 1：双层 mask 把内部 content-box 抠掉，只剩 padding 那一圈作为描边画布
        WebkitMask: maskLayers,
        mask: maskLayers,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          aspectRatio: "1",
          width: size,
          // 关键 2：CSS Motion Path —— 沿圆角矩形周长运动
          // rect(0 auto auto 0 round Rpx) = inset(0) 的矩形 + Rpx 圆角
          offsetPath: `rect(0 auto auto 0 round ${r}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          // 负 delay：让动画"已经跑过 |delay| 秒"，避免页面初次加载时 beam 全在起点
          delay: -delay,
        }}
      />
    </div>
  );
}

/**
 * ============================================================================
 * 方案 ② · ConicBorder · 旋转 conic-gradient 实现的描边光
 * ============================================================================
 *
 * 思路：
 *   外层 overlay 用同样的 mask 抠出描边那一圈（和 BorderBeam 完全一样）。
 *   内部铺一张 conic-gradient，「from `var(--bb-angle)`」会让整圈渐变随着
 *   `--bb-angle` 的动画值旋转。借助 `@property --bb-angle`，浏览器知道这是
 *   `<angle>` 类型，就能在 keyframes 里平滑插值（否则只会突变）。
 *
 *   亮"楔形"在 conic 里就是渐变的最后一段（接近 360deg 处的 colorFrom）。
 *   渐变随 `--bb-angle` 旋转 → 楔形看起来在描边上滑过。
 *
 * 与 BorderBeam（offset-path）的对比：
 *   ✅ 没有 offset-path 在小容器上的「拐角啃边」/「倒车」问题，
 *      因为光弧直接是绕中心点旋转，永远沿可见 ring 走（mask 用容器实际 radius）。
 *   ⚠️ 长矩形里看着会有「直边快、拐角慢」的非匀速感，
 *      因为是恒定角速度，但单位角度对应的边线长度不一致。
 *      正方形/胶囊/小圆角矩形里几乎察觉不到。
 *
 *   结论：小元素（按钮、AI 状态卡片、加载中的 chip）用 ConicBorder，
 *         大卡片需要"匀速绕行"用 BorderBeam。
 * ============================================================================
 */
type ConicBorderProps = {
  /** 必传：完整的 conic-gradient 字符串，应使用 `from var(--bb-angle)` 才会旋转 */
  gradient: string;
  /** 一圈耗时（秒） */
  duration?: number;
  /** 反向旋转 */
  reverse?: boolean;
  /** 起始相位偏移（秒），多条共用时用来错开 */
  delay?: number;
  borderWidth?: number;
  className?: string;
};

function ConicBorder({
  gradient,
  duration = 4,
  reverse = false,
  delay = 0,
  borderWidth = 1.5,
  className,
}: ConicBorderProps) {
  const maskLayers =
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        borderRadius: "inherit",
        padding: borderWidth,
        WebkitMask: maskLayers,
        mask: maskLayers,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: gradient,
          animation: `border-beam-spin ${duration}s linear infinite ${
            reverse ? "reverse" : "normal"
          }`,
          animationDelay: `${-delay}s`,
        }}
      />
    </div>
  );
}

/**
 * ============================================================================
 * ConicBeam · 用 conic-gradient 的「彗星楔形」做描边光（推荐用于矮长元素）
 * ============================================================================
 *
 * 这是 ConicBorder 的"高级版"：固定按彗星结构生成 gradient，避免新手踩坑。
 *
 * 关键 insight（之前踩过的坑）：
 *   conic-gradient 在 360°→0° 是无缝循环的。如果 0° 是 `transparent` 但
 *   360° 是 `colorFrom`，旋转时这条「硬切边」会像一把刀绕着描边砍，
 *   肉眼看就是「描边某处突然出现一条断口」/「亮带断断续续」。
 *
 *   修复就一行：**让 0deg 和 360deg 都是 `transparent`**，
 *   把 colorFrom（峰值）放在 350deg、最后 10° 留给 peak→transparent 的 head fade。
 *   这样旋转就完全无缝。
 *
 * 楔形结构（顺时针，从 from 角开始）：
 *   [0deg, tailStart]      transparent           ← 大段空
 *   [tailStart, tailEnd]   transparent → colorTo ← 长 tail fade-in
 *   [tailEnd, headStart]   colorTo → colorFrom   ← 颜色过渡（楔形主体）
 *   [headStart, 360deg]    colorFrom → transparent ← 短 head fade-out
 *
 *   非对称：tail 长（拖尾），head 短（锐利头部）—— 像彗星。
 * ============================================================================
 */
type ConicBeamProps = {
  duration?: number;
  /** 楔形主体（含 head/tail fade）的总跨度，单位度。默认 90。越窄越锐利。 */
  wedgeAngle?: number;
  /** head fade（colorFrom→transparent）的角度。默认 10，做出锐利头部。 */
  headFade?: number;
  /** 颜色：colorFrom 是峰值（领先位置），colorTo 是偏后的过渡色。 */
  colorFrom?: string;
  colorTo?: string;
  reverse?: boolean;
  delay?: number;
  borderWidth?: number;
  className?: string;
};

function ConicBeam({
  duration = 4,
  wedgeAngle = 90,
  headFade = 10,
  colorFrom = "#9c40ff",
  colorTo = "#22d3ee",
  reverse = false,
  delay = 0,
  borderWidth = 1.5,
  className,
}: ConicBeamProps) {
  // 把楔形塞在 [360-wedgeAngle, 360] 这一段。
  // colorTo 落在「tail fade 结束 + 楔形主体的起点」，colorFrom 落在「head fade 起点」。
  const tailStart = 360 - wedgeAngle;
  const headStart = 360 - headFade;
  // colorTo 的位置：tail fade 占楔形剩余空间的 ~55%（tail 比 body 长）
  const tailEnd = tailStart + (wedgeAngle - headFade) * 0.55;

  const gradient = `conic-gradient(from var(--bb-angle),
    transparent 0deg,
    transparent ${tailStart}deg,
    ${colorTo} ${tailEnd}deg,
    ${colorFrom} ${headStart}deg,
    transparent 360deg)`;

  const maskLayers =
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        borderRadius: "inherit",
        padding: borderWidth,
        WebkitMask: maskLayers,
        mask: maskLayers,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: gradient,
          animation: `border-beam-spin ${duration}s linear infinite ${
            reverse ? "reverse" : "normal"
          }`,
          animationDelay: `${-delay}s`,
        }}
      />
    </div>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Hero · 双向交错 + 大圆角
 * ----------------------------------------------------------------------------
 * 同一容器叠 2 条 beam（正反向 + 不同色），过弯时会在圆角处交汇，营造"绕行中"的感觉。
 */
function Hero() {
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0c12] p-12 text-center">
      {/* 背景光斑 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(156,64,255,0.15), transparent 70%), radial-gradient(40% 40% at 100% 100%, rgba(255,170,64,0.12), transparent 70%)",
        }}
      />

      <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
        CSS Motion Path · Mask Trick
      </div>
      <h1 className="mt-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
        Border Beam
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
        一道光沿着卡片描边匀速绕行。Magic UI 同款实现：
        <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-white/80">
          offset-path
        </code>
        +
        <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-white/80">
          mask-composite
        </code>
      </p>

      {/* 两条 beam 同向追逐：相位差半圈，一前一后绕行 */}
      <BorderBeam
        size={140}
        duration={8}
        colorFrom="#ffaa40"
        colorTo="#9c40ff"
        borderWidth={1.5}
      />
      <BorderBeam
        size={140}
        duration={8}
        delay={4}
        colorFrom="#06b6d4"
        colorTo="#a855f7"
        borderWidth={1.5}
      />
    </div>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 1 · Playground（可拖动调参）
 * ----------------------------------------------------------------------------
 */
function Playground() {
  const [size, setSize] = useState(80);
  const [duration, setDuration] = useState(5);
  const [borderWidth, setBorderWidth] = useState(1.5);
  const [colorFrom, setColorFrom] = useState("#ffaa40");
  const [colorTo, setColorTo] = useState("#9c40ff");
  const [reverse, setReverse] = useState(false);
  // off  - 单条 beam
  // same - 双条同向追逐：第 2 条与第 1 条 reverse 一致，但延迟半个周期，相位差 180°，
  //        视觉是「两束光首尾相隔半圈，一前一后绕行」
  // cross- 双条反向交错：第 2 条 reverse 取反，两束光在长边 / 圆角处交汇
  const [dualMode, setDualMode] = useState<"off" | "same" | "cross">("same");

  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Playground
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* 预览 */}
        <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-black/40 p-8">
          <div className="relative flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent text-sm text-white/70">
            <div className="flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-white/60" />
              <span className="font-medium tracking-tight text-white/90">
                Hover-worthy card
              </span>
              <span className="text-xs text-white/40">drag the sliders →</span>
            </div>

            <BorderBeam
              size={size}
              duration={duration}
              borderWidth={borderWidth}
              colorFrom={colorFrom}
              colorTo={colorTo}
              reverse={reverse}
            />
            {dualMode !== "off" && (
              <BorderBeam
                size={size}
                duration={duration}
                borderWidth={borderWidth}
                // same: 同色调换、同方向、半周期错相 → 两束光首尾追逐
                // cross: 取反方向 + 半周期错相 → 两束光相向而行交汇
                colorFrom={colorTo}
                colorTo={colorFrom}
                reverse={dualMode === "cross" ? !reverse : reverse}
                delay={duration / 2}
              />
            )}
          </div>
        </div>

        {/* 控件 */}
        <div className="flex flex-col gap-3 text-[12px] text-white/70">
          <Slider
            label="Size"
            value={size}
            min={20}
            max={200}
            step={1}
            onChange={setSize}
            format={(v) => `${v}px`}
          />
          <Slider
            label="Duration"
            value={duration}
            min={1}
            max={15}
            step={0.5}
            onChange={setDuration}
            format={(v) => `${v}s`}
          />
          <Slider
            label="Border width"
            value={borderWidth}
            min={1}
            max={6}
            step={0.5}
            onChange={setBorderWidth}
            format={(v) => `${v}px`}
          />
          <ColorRow
            label="Color from"
            value={colorFrom}
            onChange={setColorFrom}
          />
          <ColorRow label="Color to" value={colorTo} onChange={setColorTo} />
          <Toggle label="Reverse" value={reverse} onChange={setReverse} />
          <Segmented
            label="Dual beams"
            value={dualMode}
            options={[
              { value: "off", label: "Off" },
              { value: "same", label: "Same dir" },
              { value: "cross", label: "Cross" },
            ]}
            onChange={setDualMode}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 2 · AI Thinking Card
 * ----------------------------------------------------------------------------
 * 「思考中」时 beam 持续绕行；切到「完成」时 beam 消失，描边变为静态绿色 ring。
 * 这是 border-beam 在 agent UI 里最贴切的用法之一。
 */
function AIThinkingCard() {
  const [phase, setPhase] = useState<"thinking" | "done">("thinking");

  useEffect(() => {
    const t = setTimeout(
      () => setPhase((p) => (p === "thinking" ? "done" : "thinking")),
      phase === "thinking" ? 5200 : 2600,
    );
    return () => clearTimeout(t);
  }, [phase]);

  const thinking = phase === "thinking";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Agent · Thinking state
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border bg-[#0c0c12] p-6 transition-colors duration-500"
        style={{
          borderColor: thinking
            ? "rgba(255,255,255,0.08)"
            : "rgba(52,211,153,0.5)",
        }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: thinking ? 360 : 0 }}
            transition={
              thinking
                ? { duration: 4, repeat: Infinity, ease: "linear" }
                : { duration: 0.4 }
            }
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
              thinking
                ? "bg-violet-500/15 text-violet-300"
                : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {thinking ? <Brain size={16} /> : <Check size={16} strokeWidth={3} />}
          </motion.div>

          <div className="flex-1">
            <div className="text-[13px] font-medium text-white/90">
              {thinking ? "Reasoning about your repo" : "Plan ready"}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="mt-1 text-[12px] leading-relaxed text-white/50"
              >
                {thinking
                  ? "Indexing 142 files · resolving call graph · drafting an edit plan…"
                  : "Found 3 files to edit. Ready to apply changes when you are."}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {thinking && (
            <motion.div
              key="beams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
              // ⚠️ 不传 borderRadius:'inherit' 的话这层 div 默认 0，
              //    会截断下面 ConicBeam 内部的 border-radius 继承链。
              style={{ borderRadius: "inherit" }}
            >
              {/* ConicBeam：和对比卡 ② 同款的彗星楔形 + 0/360deg 双 transparent 收口。
                  两束反向旋转，交错绕行，视觉是"agent 思考中"那种环形处理感。 */}
              <ConicBeam
                duration={4.5}
                wedgeAngle={90}
                colorFrom="#a78bfa"
                colorTo="#ec4899"
              />
              <ConicBeam
                duration={4.5}
                wedgeAngle={90}
                reverse
                colorFrom="#a78bfa"
                colorTo="#22d3ee"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setPhase((p) => (p === "thinking" ? "done" : "thinking"))}
        className="mt-3 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Toggle phase
      </button>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 3 · Hover CTA Buttons
 * ----------------------------------------------------------------------------
 * 默认静态，悬停时 beam 出现。"召唤式"反馈，比纯阴影/缩放更醒目。
 * 关键技巧：beam 用条件渲染 + AnimatePresence 控制淡入淡出。
 */
function HoverButton({
  icon: Icon,
  label,
  colorFrom,
  colorTo,
}: {
  icon: React.ElementType;
  label: string;
  colorFrom: string;
  colorTo: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/[0.06]"
    >
      <Icon size={15} className="text-white/70" />
      {label}

      {/* ConicBeam：彗星楔形围着按钮跑，0/360deg 都是 transparent 所以无缝循环，
          没有"被刀切"的硬边。常驻挂载、靠 opacity 切换 hover 显隐。
          ⚠️ borderRadius: 'inherit' 必传 —— 不传的话这层 div 默认 0，
          ConicBeam 内部 inherit 链就断了，conic 会被渲染在直角矩形上，
          再被按钮的 overflow-hidden 把四个角啃掉。 */}
      <motion.div
        animate={{ opacity: hover ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0"
        style={{ borderRadius: "inherit" }}
      >
        <ConicBeam
          duration={2.4}
          wedgeAngle={100}
          colorFrom={colorFrom}
          colorTo={colorTo}
        />
      </motion.div>
    </button>
  );
}

function HoverCTAs() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Hover to summon · CTA Buttons
      </div>
      <div className="flex flex-wrap gap-3">
        <HoverButton
          icon={Rocket}
          label="Deploy to production"
          colorFrom="#ff6e7f"
          colorTo="#bfe9ff"
        />
        <HoverButton
          icon={Zap}
          label="Generate component"
          colorFrom="#ffaa40"
          colorTo="#9c40ff"
        />
        <HoverButton
          icon={Shield}
          label="Run security audit"
          colorFrom="#34d399"
          colorTo="#06b6d4"
        />
      </div>
      <p className="mt-3 text-[11px] text-white/35">
        指针进入按钮才唤出 beam。比纯阴影/缩放更显"召唤"。
      </p>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 4 · 多形状 / 配色画廊
 * ----------------------------------------------------------------------------
 * 验证 BorderBeam 在不同 border-radius 下都能贴边滑过：圆角 12 / 24 / pill / 大块。
 */

const PRESETS: Array<{
  title: string;
  body: string;
  radius: number;
  colorFrom: string;
  colorTo: string;
  size: number;
  duration: number;
  borderWidth: number;
}> = [
  {
    title: "Magic",
    body: "Default",
    radius: 16,
    colorFrom: "#ffaa40",
    colorTo: "#9c40ff",
    size: 60,
    duration: 5,
    borderWidth: 1.5,
  },
  {
    title: "Aurora",
    body: "Cyan / Cobalt",
    radius: 16,
    colorFrom: "#22d3ee",
    colorTo: "#3b82f6",
    size: 60,
    duration: 5,
    borderWidth: 1.5,
  },
  {
    title: "Lava",
    body: "Hot pink → orange",
    radius: 16,
    colorFrom: "#ff0080",
    colorTo: "#ff8c00",
    size: 60,
    duration: 4,
    borderWidth: 1.5,
  },
  {
    title: "Mint",
    body: "Subtle, calm",
    radius: 16,
    colorFrom: "#34d399",
    colorTo: "#a7f3d0",
    size: 60,
    duration: 6,
    borderWidth: 1.5,
  },
];

function VariantsGallery() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Color presets
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRESETS.map((p) => (
          <div
            key={p.title}
            className="relative flex h-32 flex-col items-start justify-end overflow-hidden border border-white/10 bg-[#0c0c12] p-4"
            style={{ borderRadius: p.radius }}
          >
            <div className="text-[13px] font-semibold text-white/90">
              {p.title}
            </div>
            <div className="text-[11px] text-white/40">{p.body}</div>
            <BorderBeam
              size={p.size}
              duration={p.duration}
              colorFrom={p.colorFrom}
              colorTo={p.colorTo}
              borderWidth={p.borderWidth}
            />
          </div>
        ))}
      </div>

      {/* Pill 形状 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[#0c0c12] px-5 py-2 text-[13px] text-white/80">
          <Cpu size={14} className="text-white/60" />
          <span>Building model · 87%</span>
          {/* pill 高度 ≈ 36，size==pathRadius 取容器半高 18 让 beam 贴胶囊外缘 */}
          <BorderBeam
            size={18}
            duration={3}
            colorFrom="#a78bfa"
            colorTo="#22d3ee"
            borderWidth={1.5}
          />
        </div>

        <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[#0c0c12] px-5 py-2 text-[13px] text-white/80">
          <Loader2 size={14} className="animate-spin text-white/60" />
          <span>Indexing repo</span>
          <BorderBeam
            size={18}
            duration={3}
            delay={1.5}
            colorFrom="#34d399"
            colorTo="#fbbf24"
            borderWidth={1.5}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 5 · 实现对比 · Conic Gradient 旋转法
 * ----------------------------------------------------------------------------
 * 教学用：另一种常见的 border-beam 实现方式 —— 旋转 conic-gradient。
 * 优点：兼容性好（不依赖 CSS Houdini 的 @property 即可工作；纯 keyframes）。
 * 缺点：beam 是「整圈一次性渲染」+「整体旋转」，所以经过圆角时角速度不均匀，
 *      在窄长矩形里会肉眼看出「直线段快、拐角慢」。motion-path 没这问题。
 */
function ConicBeamCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Alternative · Conic gradient rotation
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ImplCard
          label="① offset-path（本组件方案）"
          desc="光斑沿圆角轨迹平滑滑过，过弯无停顿。"
        >
          <BorderBeam
            size={90}
            duration={4}
            colorFrom="#9c40ff"
            colorTo="#22d3ee"
            borderWidth={1.5}
          />
        </ImplCard>

        <ImplCard
          label="② conic-gradient 旋转"
          desc="整圈渐变随 angle 旋转，矩形长边上感觉更快。"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: "inherit",
              padding: 1.5,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              background:
                "conic-gradient(from var(--bb-angle), transparent 0deg, transparent 270deg, #22d3ee 320deg, #9c40ff 350deg, transparent 360deg)",
              animation: "border-beam-spin 4s linear infinite",
            }}
          />
        </ImplCard>
      </div>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Demo 6 · Conic gradient · 更多变种
 * ----------------------------------------------------------------------------
 * 这些效果用 offset-path 都做不到 / 不优雅：
 *   ① 三色追逐：conic 里直接放 3 个亮点，等距分布，整圈一起转
 *   ② 进度环：conic 角度直接绑到 progress 数值，渐进填充
 *   ③ 极光彩虹：连续色相 conic 慢转，整圈是流动的光谱
 *   ④ 双向对冲：两层反向旋转的 conic 叠在同一描边上，光弧相向交汇
 */
function ConicVariants() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101013] p-6">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Conic gradient · 更多用法
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ① 三色追逐 spinner */}
        <div className="relative flex h-36 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-white/85">
            <Wifi size={13} className="text-white/60" />
            Connecting to network
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/40">
            三个亮点等距 120° 分布，1.4 秒一圈快速旋转。
          </div>
          {/* 关键：conic 里 3 个亮"楔形"，间隔 120°，高速旋转 → 像 3 根光带一起追 */}
          <ConicBorder
            duration={1.4}
            borderWidth={1.5}
            gradient="conic-gradient(from var(--bb-angle),
              transparent 0deg, #ff0080 25deg, transparent 40deg,
              transparent 120deg, #ffaa00 145deg, transparent 160deg,
              transparent 240deg, #00ffd0 265deg, transparent 280deg,
              transparent 360deg)"
          />
        </div>

        {/* ② 进度环（自动循环 0→100%） */}
        <ProgressRingCard />

        {/* ③ 极光彩虹边 */}
        <div className="relative flex h-36 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-white/85">
            <Sparkles size={13} className="text-violet-300" />
            Aurora · Holographic edge
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/40">
            连续色相 conic，缓慢旋转。无亮点、整圈都在流光。
          </div>
          {/* 注意：首尾要同色才能无缝循环（最后那个 #ff6e7f 接回开头） */}
          <ConicBorder
            duration={12}
            borderWidth={2}
            gradient="conic-gradient(from var(--bb-angle),
              #ff6e7f, #ffaa40, #fbbf24, #34d399, #22d3ee, #a855f7, #ec4899, #ff6e7f)"
          />
        </div>

        {/* ④ 双向对冲 */}
        <div className="relative flex h-36 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-white/85">
            <Activity size={13} className="text-cyan-300" />
            Counter-rotating
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/40">
            两层 conic 反向旋转叠加，亮弧周期性相向交汇。
          </div>
          <ConicBorder
            duration={5}
            borderWidth={1.5}
            gradient="conic-gradient(from var(--bb-angle), transparent 0deg, transparent 280deg, #22d3ee 340deg, #ffffff 360deg)"
          />
          <ConicBorder
            duration={5}
            reverse
            borderWidth={1.5}
            gradient="conic-gradient(from var(--bb-angle), transparent 0deg, transparent 280deg, #ec4899 340deg, #ffffff 360deg)"
          />
        </div>
      </div>

      {/* 横排：下载 chip + 网络状态 chip，conic 在 pill 里也能贴边 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[#0c0c12] px-5 py-2 text-[13px] text-white/80">
          <Download size={14} className="text-white/60" />
          <span>Downloading model · 8 MB/s</span>
          <ConicBorder
            duration={1.6}
            borderWidth={1.5}
            gradient="conic-gradient(from var(--bb-angle), transparent 0deg, transparent 300deg, #34d399 350deg, #ffffff 360deg)"
          />
        </div>

        <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-[#0c0c12] px-5 py-2 text-[13px] text-white/80">
          <Activity size={14} className="text-rose-300" />
          <span>Live · streaming</span>
          {/* 慢速彩虹 pill */}
          <ConicBorder
            duration={6}
            borderWidth={1.5}
            gradient="conic-gradient(from var(--bb-angle),
              #ff6e7f, #ffaa40, #fbbf24, #34d399, #22d3ee, #a855f7, #ec4899, #ff6e7f)"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * 进度环：用 @property --bb-progress + 动画把 0→100 平滑插值，
 * conic 角度由 progress 计算（progress * 3.6deg = 0–360deg）。
 * 没有 React state，纯 CSS 动画 → 0 重渲染开销。
 */
function ProgressRingCard() {
  return (
    <div className="relative flex h-36 flex-col items-start justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
      <div className="flex items-center gap-2 text-[12px] font-medium text-white/85">
        <Cpu size={13} className="text-emerald-300" />
        Building · auto progress
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-white/40">
        conic 角度直接 = progress·3.6°，从 12 点钟方向顺时针填充。
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "inherit",
          padding: 2,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            // from -90deg 让起点在 12 点钟方向；填充弧从 0 到 progress*3.6°
            background:
              "conic-gradient(from -90deg, #34d399 0deg, #06b6d4 calc(var(--bb-progress) * 3.6deg), rgba(255,255,255,0.06) calc(var(--bb-progress) * 3.6deg + 0.5deg))",
            animation: "border-beam-progress 4s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function ImplCard({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
      <div className="text-[12px] font-medium text-white/85">{label}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-white/40">
        {desc}
      </div>
      {children}
    </div>
  );
}

/**
 * ----------------------------------------------------------------------------
 * Controls
 * ----------------------------------------------------------------------------
 */
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

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-white/50">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
        />
      </div>
    </label>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <span>{label}</span>
      <div className="flex gap-1 rounded bg-black/30 p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded px-2 py-1 text-[11px] transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-white"
      />
    </label>
  );
}

/**
 * ============================================================================
 * Page
 * ============================================================================
 */
export default function BorderBeamPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] py-12 text-white">
      {/* 全局 conic 动画定义 —— @property 让 --bb-angle 可被浏览器作为 <angle> 平滑插值。
          所有 ConicBorder 实例共用这一段 keyframes，靠 animation-duration / -direction
          / animation-delay 区分。 */}
      <style>{`
        @property --bb-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes border-beam-spin {
          to { --bb-angle: 360deg; }
        }
        @property --bb-progress {
          syntax: '<number>';
          initial-value: 0;
          inherits: false;
        }
        @keyframes border-beam-progress {
          0%   { --bb-progress: 0; }
          85%  { --bb-progress: 100; }
          92%  { --bb-progress: 100; }
          100% { --bb-progress: 0; }
        }
      `}</style>

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Interaction · CSS
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/50">
            研究 Magic UI 的 Border Beam 是怎么实现的，并把它玩出几种用法：
            agent thinking、CTA 召唤、配色画廊、以及与 conic-gradient 方案的对比。
          </p>
        </header>

        <Hero />
        <Playground />
        <AIThinkingCard />
        <HoverCTAs />
        <VariantsGallery />
        <ConicBeamCard />
        <ConicVariants />

        <footer className="pb-6 text-xs leading-relaxed text-white/30">
          实现要点 ——
          <span className="text-white/50"> offset-path </span>
          决定 beam 的路径形状，
          <span className="text-white/50"> mask-composite: exclude </span>
          把"内圈"挖空只留下描边，剩下的就交给一道线性渐变和 linear easing。
        </footer>
      </div>
    </div>
  );
}
