"use client";

import React, { useEffect, useState } from "react";
import { Plus, SquarePen } from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * Animate to height: auto — 跳变 vs 流畅展开
 * --------------------------------------------------------------------------
 * 左卡片:height 直接在 0 ↔ auto 之间切换。auto 不是可插值数值,
 *   即使声明了 transition,浏览器也算不出中间帧,只能瞬间跳到目标布局。
 * 右卡片:外层 grid 的 grid-template-rows 在 0fr ↔ 1fr 之间过渡。
 *   fr 是数字、可插值,行高平滑生长;子元素只需 min-height: 0 + overflow: hidden。
 *   全程不需要 JS 测量内容高度,内容多高都适用。
 * --------------------------------------------------------------------------
 */

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const PLAN_STEPS = [
  "Review the current website structure and identify what feels unclear, outdated, or unnecessary.",
  "Suggest a cleaner page flow that explains the product faster and makes the main action more obvious.",
  "Improve the homepage sections, headline direction, feature blocks, and call-to-action placement.",
  "Create a short priority list showing what should be redesigned first and what can be improved later.",
  "Make sure the final direction works across desktop, tablet, and mobile layouts.",
];

/** 列表底部渐隐:遮的是内容,面板边框保持清晰 */
const LIST_FADE_MASK =
  "linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,0.35) 82%, transparent 98%)";

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white text-[11px] leading-none text-black/45 ring-1 ring-black/10">
      {children}
    </span>
  );
}

/** 卡片中间可展开区域的内容:白色悬浮面板 + 编号计划列表 */
function PlanPanel() {
  return (
    <div className="px-2 pb-2 pt-0.5">
      <div className="rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05]">
        <ol
          className="space-y-4 px-4 py-4"
          style={{
            maskImage: LIST_FADE_MASK,
            WebkitMaskImage: LIST_FADE_MASK,
          }}
        >
          {PLAN_STEPS.map((step, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13.5px] leading-[1.45] text-black/60"
            >
              <span className="tabular-nums text-black/40">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

type ExpandMode = "instant" | "fluid";

function PlanCard({
  mode,
  expanded,
  duration,
  onToggle,
}: {
  mode: ExpandMode;
  expanded: boolean;
  duration: number;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className="w-full cursor-pointer select-none rounded-2xl bg-[#fcfcfc] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-16px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_28px_56px_-16px_rgba(0,0,0,0.16)]"
    >
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 px-4 pb-3 pt-3.5">
        <SquarePen className="h-4 w-4 text-black/70" strokeWidth={1.8} />
        <div className="flex items-baseline gap-1.5 text-[14px]">
          <span className="font-semibold tracking-[-0.01em] text-black/85">
            Brand Refresh Request
          </span>
          <span className="text-black/35">· 1s</span>
        </div>
        <span className="rounded-[5px] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-black/35 ring-1 ring-black/10">
          ESC
        </span>
        <div className="col-start-2 mt-0.5 text-[13px] text-black/35">
          Planning next steps…
        </div>
      </div>

      {/* 可展开区域:两种实现的唯一差异就在这里 */}
      {mode === "instant" ? (
        // ❌ height: 0 ↔ auto。auto 不可插值,transition 形同虚设,直接跳变。
        <div
          style={{
            height: expanded ? "auto" : 0,
            overflow: "hidden",
            transition: `height ${duration}ms ${EASE}`,
          }}
        >
          <PlanPanel />
        </div>
      ) : (
        // ✅ grid-template-rows: 0fr ↔ 1fr。fr 可插值,行高平滑生长。
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: `grid-template-rows ${duration}ms ${EASE}`,
          }}
        >
          <div style={{ minHeight: 0, overflow: "hidden" }}>
            <PlanPanel />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-black/55">
          <KeyCap>
            <Plus className="h-3 w-3 text-black/50" strokeWidth={2} />
          </KeyCap>
          Add Files
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-black/55">
          <KeyCap>⌥</KeyCap>
          Switch tool
        </div>
      </div>
    </div>
  );
}

function CodePill({
  tone,
  children,
}: {
  tone: "bad" | "good";
  children: React.ReactNode;
}) {
  const styles =
    tone === "bad"
      ? "bg-[#fef1f1] text-[#e5484d] ring-[#f3c6c6]"
      : "bg-[#edfbf0] text-[#2f9e63] ring-[#c4e8d1]";
  return (
    <code
      className={`rounded-[10px] px-3.5 py-2 font-mono text-[13px] ring-1 ${styles}`}
    >
      {children}
    </code>
  );
}

export default function AnimateHeightAutoPage() {
  const [expanded, setExpanded] = useState(true);
  const [auto, setAuto] = useState(true);
  const [duration, setDuration] = useState(600);

  // 自动回放:展开 ↔ 收起 交替,方便并排观察两种实现的差异
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      setExpanded((v) => !v);
    }, duration + 1500);
    return () => clearInterval(timer);
  }, [auto, duration]);

  const manualToggle = () => {
    setAuto(false);
    setExpanded((v) => !v);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] py-14 [background-image:radial-gradient(1100px_520px_at_50%_22%,rgba(255,255,255,0.9),rgba(255,255,255,0)_70%)]">
      <div className="mx-auto max-w-5xl px-5">
        {/* 页头 */}
        <header className="mb-10 text-center">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-black/80">
            Animate to <code className="font-mono">height: auto</code>
          </h1>
          <p className="mt-1.5 text-[14px] text-black/45">
            同一份未知高度的内容做展开动画:不可插值的{" "}
            <code className="font-mono text-[13px]">auto</code> 直接跳变,可插值的{" "}
            <code className="font-mono text-[13px]">fr</code> 平滑生长。点击卡片或下方按钮切换。
          </p>
        </header>

        {/* 对比舞台:固定最小高度,避免自动回放时把下方内容顶来顶去 */}
        <div className="grid items-start gap-10 sm:min-h-[560px] sm:grid-cols-2 sm:gap-8">
          {(
            [
              {
                mode: "instant" as const,
                label: "Instant height change",
                pill: <CodePill tone="bad">height: auto;</CodePill>,
              },
              {
                mode: "fluid" as const,
                label: "Expands fluidly",
                pill: <CodePill tone="good">grid-template-rows: 0fr → 1fr;</CodePill>,
              },
            ]
          ).map(({ mode, label, pill }) => (
            <div key={mode} className="flex flex-col items-center">
              <p className="mb-4 text-[15px] font-medium text-black/50">{label}</p>
              <div className="w-full max-w-[400px]">
                <PlanCard
                  mode={mode}
                  expanded={expanded}
                  duration={duration}
                  onToggle={manualToggle}
                />
              </div>
              <div className="mt-6">{pill}</div>
            </div>
          ))}
        </div>

        {/* 控制条 */}
        <div className="mt-4 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06]">
            <button
              onClick={manualToggle}
              className="rounded-full bg-black/85 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-black active:scale-[0.97]"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>

            <button
              onClick={() => setAuto((v) => !v)}
              className="flex items-center gap-2 text-[13px] font-medium text-black/60"
            >
              <span
                className={`relative h-[18px] w-[30px] rounded-full transition-colors ${
                  auto ? "bg-emerald-500" : "bg-black/15"
                }`}
              >
                <span
                  className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-[left] ${
                    auto ? "left-[14px]" : "left-[2px]"
                  }`}
                />
              </span>
              Auto replay
            </button>

            <label className="flex items-center gap-2.5 text-[13px] font-medium text-black/60">
              <input
                type="range"
                min={200}
                max={1200}
                step={50}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-28 accent-black/80"
              />
              <span className="w-14 tabular-nums text-black/45">{duration}ms</span>
            </label>
          </div>
        </div>

        {/* 原理说明 */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <h2 className="text-[14px] font-semibold text-[#d13438]">
              为什么 height: auto 会跳变
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-black/60">
              transition 只能在<b>可插值</b>的值之间过渡。<code className="font-mono text-[12.5px]">auto</code>{" "}
              是布局关键字而不是数值,浏览器无法算出 0 与 auto 之间的中间帧,于是忽略过渡、直接跳到最终布局。经典的{" "}
              <code className="font-mono text-[12.5px]">max-height</code>{" "}
              hack 虽然能动,但要拍脑袋猜一个上限,猜大了缓动曲线还会被稀释失真。
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-[#faf5f5] p-3.5 font-mono text-[12px] leading-relaxed text-[#a63d40]">
{`.panel {
  height: auto;              /* 目标不可插值 */
  transition: height 600ms;  /* ❌ 不会生效,瞬间跳变 */
}`}
            </pre>
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
            <h2 className="text-[14px] font-semibold text-[#2f9e63]">
              0fr → 1fr 为什么流畅
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-black/60">
              <code className="font-mono text-[12.5px]">fr</code>{" "}
              是数字、天然可插值:外层 grid 的行高从 0fr 平滑长到
              1fr(内容自然高度),子元素只需{" "}
              <code className="font-mono text-[12.5px]">min-height: 0</code>{" "}
              允许被压缩、<code className="font-mono text-[12.5px]">overflow: hidden</code>{" "}
              裁掉溢出。全程零 JS、不用测量内容高度,内容再长都适用(Chrome 107+ / Safari 16+ / Firefox 66+)。
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-[#f3faf5] p-3.5 font-mono text-[12px] leading-relaxed text-[#2c7a52]">
{`.expander {
  display: grid;
  grid-template-rows: 0fr;             /* 收起 */
  transition: grid-template-rows 600ms;
}
.expander[data-open] {
  grid-template-rows: 1fr;             /* 展开 ✅ */
}
.expander > div {
  min-height: 0;
  overflow: hidden;
}`}
            </pre>
          </section>
        </div>

        <p className="mt-5 text-center text-[12.5px] text-black/35">
          展望:Chrome 129+ 已支持{" "}
          <code className="font-mono">interpolate-size: allow-keywords</code> 与{" "}
          <code className="font-mono">calc-size()</code>,可以直接对 height: auto
          过渡;在此之前,grid 行高方案是兼容性最好的纯 CSS 解法。
        </p>
      </div>
    </div>
  );
}
