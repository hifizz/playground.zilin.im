"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Brain,
  Check,
  ChevronDown,
  LoaderCircle,
  Plus,
  Square,
} from "lucide-react";

/**
 * --------------------------------------------------------------------------
 * Reasoning Effort Panel — 推理强度调节面板
 * --------------------------------------------------------------------------
 * 最近 ChatGPT / Claude / Gemini 都在 composer 上挂了「思考强度」入口：
 * 一颗小 pill 弹出面板，里面是 Extended thinking 开关 + Low→Max 四档。
 * 这个 demo 做两件事：
 *   1) 抽出可复用的 <ReasoningEffortPanel />（选项列表 + 开关），
 *      演示它在 composer 弹层里的用法；
 *   2) 让档位「真的生效」——模拟 agent 的思考步数、耗时、token 消耗
 *      都随所选 effort 缩放，回答完成后 trace 自动折叠成
 *      「Thought for Xs」一行摘要。
 * --------------------------------------------------------------------------
 */

type EffortId = "low" | "medium" | "high" | "max";

type EffortLevel = {
  id: EffortId;
  label: string;
  desc: string;
  /** 面板右侧展示的预估耗时 */
  time: string;
  /** 面板右侧展示的预估思考预算 */
  tokens: string;
  /** —— 以下为模拟运行参数 —— */
  steps: number;
  stepMs: number;
  tokensPerSec: number;
};

const EFFORTS: EffortLevel[] = [
  {
    id: "low",
    label: "Low",
    desc: "Straight to the answer, minimal deliberation",
    time: "~1s",
    tokens: "0.5K",
    steps: 1,
    stepMs: 750,
    tokensPerSec: 700,
  },
  {
    id: "medium",
    label: "Medium",
    desc: "Balances latency and depth for most tasks",
    time: "~4s",
    tokens: "2K",
    steps: 3,
    stepMs: 950,
    tokensPerSec: 1100,
  },
  {
    id: "high",
    label: "High",
    desc: "Works through multi-step or subtle problems",
    time: "~12s",
    tokens: "8K",
    steps: 5,
    stepMs: 1150,
    tokensPerSec: 1600,
  },
  {
    id: "max",
    label: "Max",
    desc: "Deepest pass — plans, solves, then verifies",
    time: "~30s",
    tokens: "32K",
    steps: 6,
    stepMs: 1400,
    tokensPerSec: 2600,
  },
];

const THINK_STEPS = [
  "Parse the request and pin down the constraints",
  "Split the problem into sub-goals",
  "Recall related patterns and prior art",
  "Compare candidate approaches on the trade-off axis",
  "Stress-test edge cases and failure modes",
  "Draft the answer and self-review for gaps",
];

const USER_MESSAGE =
  "We need to migrate the `users` table to the new schema with zero downtime. What's the safest path?";

const ANSWER = [
  "Expand-and-contract is the safe pattern here:",
  "1. Add the new columns as nullable, and dual-write from the app for one deploy cycle.",
  "2. Backfill in batches, verify row counts + checksums, then flip reads behind a flag.",
  "3. Once reads are stable, stop dual-writing and drop the legacy columns.",
];

const effortIndex = (id: EffortId) => EFFORTS.findIndex((e) => e.id === id);

const formatTokens = (t: number) =>
  t >= 1000 ? `${(t / 1000).toFixed(1)}K` : `${Math.round(t)}`;

/** 档位柱形图标：4 根递增柱子，亮起的根数 = 档位 */
function EffortGlyph({
  level,
  size = 13,
  className,
}: {
  /** 0–3 */
  level: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-end gap-[2.5px] ${className ?? ""}`}
      style={{ height: size }}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={i <= level ? "bg-current" : "bg-current opacity-25"}
          style={{
            width: 3,
            height: `${25 + i * 25}%`,
            borderRadius: 1.5,
          }}
        />
      ))}
    </span>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-emerald-500" : "bg-white/15"
      }`}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  );
}

/**
 * --------------------------------------------------------------------------
 * <ReasoningEffortPanel /> — 可复用面板本体
 * --------------------------------------------------------------------------
 * 顶部是 Extended thinking 开关，下面四档选项：左侧档位柱形图标 + 名称 +
 * 一句话说明，右侧预估耗时 / token 预算，选中项打勾。
 */
function ReasoningEffortPanel({
  value,
  onChange,
  enabled,
  onEnabledChange,
  className,
}: {
  value: EffortId;
  onChange: (v: EffortId) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={`w-[320px] rounded-2xl border border-white/10 bg-[#17171c] p-1.5 shadow-2xl shadow-black/60 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <div className="text-[13px] font-medium text-white/90">
            Extended thinking
          </div>
          <div className="mt-0.5 text-[11.5px] leading-snug text-white/40">
            Let the model reason before replying
          </div>
        </div>
        <Switch checked={enabled} onChange={onEnabledChange} />
      </div>

      <div className="mx-2 border-t border-white/[0.06]" />

      <div
        className={`mt-1 flex flex-col transition-opacity duration-200 ${
          enabled ? "" : "pointer-events-none opacity-35"
        }`}
      >
        {EFFORTS.map((e, i) => {
          const active = e.id === value;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onChange(e.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  active
                    ? "border-white/15 bg-white/10 text-white"
                    : "border-white/[0.07] bg-white/[0.03] text-white/50"
                }`}
              >
                <EffortGlyph level={i} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-white/90">
                  {e.label}
                </span>
                <span className="block truncate text-[11.5px] text-white/40">
                  {e.desc}
                </span>
              </span>
              <span className="shrink-0 text-right font-mono text-[10.5px] leading-tight text-white/35">
                {e.time}
                <br />
                {e.tokens}
              </span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  active ? "bg-white text-black" : "text-transparent"
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * --------------------------------------------------------------------------
 * Demo A: Composer + 弹层面板 + 真实模拟运行
 * --------------------------------------------------------------------------
 * 一条假消息 + 底部 composer。composer 上的 effort pill 弹出
 * <ReasoningEffortPanel />；按发送后根据所选档位跑一遍思考流：
 * step 数 / 每步耗时 / token 速率全部来自档位配置。
 */
type Phase = "idle" | "thinking" | "answering" | "done";

function ComposerDemo() {
  const [effort, setEffort] = useState<EffortId>("high");
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepsTotal, setStepsTotal] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [traceOpen, setTraceOpen] = useState(true);
  const [linesShown, setLinesShown] = useState(0);

  // 运行开始时锁存档位配置，运行途中改档位只影响下一次
  const cfgRef = useRef<EffortLevel>(EFFORTS[effortIndex("high")]);
  const running = phase === "thinking" || phase === "answering";

  const run = () => {
    cfgRef.current = EFFORTS[effortIndex(effort)];
    setStepsTotal(enabled ? cfgRef.current.steps : 0);
    setStepIdx(0);
    setTokens(0);
    setElapsed(0);
    setLinesShown(0);
    setTraceOpen(true);
    setOpen(false);
    setPhase(enabled ? "thinking" : "answering");
  };

  const stop = () => setPhase("idle");

  // 思考步骤推进
  useEffect(() => {
    if (phase !== "thinking") return;
    if (stepIdx >= stepsTotal) {
      setTraceOpen(false);
      setPhase("answering");
      return;
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), cfgRef.current.stepMs);
    return () => clearTimeout(t);
  }, [phase, stepIdx, stepsTotal]);

  // 思考中的 token / 耗时计数
  useEffect(() => {
    if (phase !== "thinking") return;
    const t = setInterval(() => {
      setElapsed((e) => e + 0.1);
      setTokens((v) => v + cfgRef.current.tokensPerSec * 0.1);
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  // 回答逐行吐出
  useEffect(() => {
    if (phase !== "answering") return;
    if (linesShown >= ANSWER.length) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setLinesShown((n) => n + 1), 420);
    return () => clearTimeout(t);
  }, [phase, linesShown]);

  const idx = effortIndex(effort);
  const showTrace = phase !== "idle" && stepsTotal > 0;
  const showAnswer = phase === "answering" || phase === "done";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101013] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          Composer · popover panel
        </div>
        <div className="font-mono text-[11px] text-white/30">
          {enabled ? `${EFFORTS[idx].label} · est ${EFFORTS[idx].time}` : "thinking off"}
        </div>
      </div>

      {/* —— chat 区域 —— */}
      <div className="flex min-h-[300px] flex-col gap-4 rounded-xl bg-black/30 p-4">
        {/* user bubble */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.08] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
            {USER_MESSAGE}
          </div>
        </div>

        {/* thinking trace */}
        {showTrace && (
          <div className="max-w-[92%]">
            <button
              type="button"
              onClick={() => setTraceOpen((o) => !o)}
              className="flex items-center gap-2 text-[12.5px] text-white/60 transition-colors hover:text-white/90"
            >
              {phase === "thinking" ? (
                <LoaderCircle size={13} className="animate-spin text-white/50" />
              ) : (
                <Brain size={13} className="text-emerald-400/80" />
              )}
              <span className="font-medium">
                {phase === "thinking"
                  ? "Thinking…"
                  : `Thought for ${elapsed.toFixed(1)}s`}
              </span>
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10.5px] text-white/40">
                {formatTokens(tokens)} tokens
              </span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${traceOpen ? "" : "-rotate-90"}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {traceOpen && (
                <motion.ol
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-2 overflow-hidden border-l border-white/10 pl-4"
                >
                  {THINK_STEPS.slice(0, stepsTotal).map((s, i) => {
                    const state =
                      i < stepIdx || phase !== "thinking"
                        ? "done"
                        : i === stepIdx
                          ? "active"
                          : "pending";
                    return (
                      <motion.li
                        key={s}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: state === "pending" ? 0.3 : 1, y: 0 }}
                        className="flex items-center gap-2 py-1 text-[12px]"
                      >
                        {state === "done" ? (
                          <Check size={11} className="shrink-0 text-emerald-400/70" />
                        ) : state === "active" ? (
                          <LoaderCircle
                            size={11}
                            className="shrink-0 animate-spin text-white/60"
                          />
                        ) : (
                          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-white/25" />
                        )}
                        <span
                          className={
                            state === "done" ? "text-white/35" : "text-white/70"
                          }
                        >
                          {s}
                        </span>
                      </motion.li>
                    );
                  })}
                </motion.ol>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* answer */}
        {showAnswer && (
          <div className="flex max-w-[92%] flex-col gap-1.5">
            {ANSWER.slice(0, linesShown).map((line) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[13px] leading-relaxed text-white/80"
              >
                {line}
              </motion.p>
            ))}
          </div>
        )}

        {phase === "idle" && (
          <div className="flex flex-1 items-center justify-center text-[12px] text-white/25">
            Pick an effort level below, then send →
          </div>
        )}
      </div>

      {/* —— composer —— */}
      <div className="relative mt-3">
        {open && (
          <button
            type="button"
            aria-label="Close effort panel"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
        )}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-full left-0 z-40 mb-2 origin-bottom-left"
            >
              <ReasoningEffortPanel
                value={effort}
                onChange={(v) => {
                  setEffort(v);
                  setOpen(false);
                }}
                enabled={enabled}
                onEnabledChange={setEnabled}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 pb-3 pt-3.5 transition-colors focus-within:border-white/20">
          <div className="text-[13.5px] text-white/30">
            {running ? "Agent is working…" : "Ask anything…"}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <Plus size={15} />
            </button>

            {/* effort pill trigger */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                open
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/85"
              }`}
            >
              <Brain size={12.5} className={enabled ? "" : "opacity-40"} />
              {enabled ? (
                <>
                  <EffortGlyph level={idx} size={11} />
                  {EFFORTS[idx].label}
                </>
              ) : (
                "Thinking off"
              )}
              <ChevronDown
                size={11}
                className={`opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={running ? stop : run}
              aria-label={running ? "Stop" : "Send"}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                running
                  ? "bg-white/15 text-white hover:bg-white/25"
                  : "bg-white text-black hover:bg-white/85"
              }`}
            >
              {running ? (
                <Square size={12} fill="currentColor" />
              ) : (
                <ArrowUp size={15} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * --------------------------------------------------------------------------
 * Demo B: 分段控件变体（适合设置页 / 并排布局）
 * --------------------------------------------------------------------------
 * 同一个数据模型换一副面孔：segmented control + sliding indicator，
 * 下方 detail 区域随档位切换，附 token 预算条。
 */
function SegmentedDemo() {
  const [effort, setEffort] = useState<EffortId>("medium");
  const [enabled, setEnabled] = useState(true);
  const idx = effortIndex(effort);
  const current = EFFORTS[idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101013] p-5">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Settings · segmented variant
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
        <div>
          <div className="text-[13px] font-medium text-white/90">
            Extended thinking
          </div>
          <div className="mt-0.5 text-[11.5px] text-white/40">
            Reason before replying
          </div>
        </div>
        <Switch checked={enabled} onChange={setEnabled} />
      </div>

      <div
        className={`mt-3 transition-opacity duration-200 ${enabled ? "" : "pointer-events-none opacity-35"}`}
      >
        {/* segmented control */}
        <div className="flex rounded-xl border border-white/[0.07] bg-black/30 p-1">
          {EFFORTS.map((e, i) => {
            const active = e.id === effort;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setEffort(e.id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors ${
                  active ? "text-white" : "text-white/45 hover:text-white/70"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="effort-seg-pill"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                    className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-white/15"
                  />
                )}
                <EffortGlyph level={i} size={11} className="relative" />
                <span className="relative">{e.label}</span>
              </button>
            );
          })}
        </div>

        {/* detail 区 */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={effort}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5"
          >
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] text-white/80">{current.desc}</div>
              <div className="font-mono text-[11px] text-white/40">
                {current.time}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Thinking budget</span>
                <span className="font-mono">≈ {current.tokens} tokens</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  animate={{ width: `${(idx + 1) * 25}%` }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 to-emerald-300"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * --------------------------------------------------------------------------
 * Page
 * --------------------------------------------------------------------------
 */
export default function ReasoningEffortPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] py-12 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Agent UX
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reasoning Effort Panel
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/50">
            最近各家 chat 产品都在输入框上挂了「思考强度」入口。这个 demo 抽出
            一个可复用的 effort 面板组件：composer 弹层 + 设置页分段控件两种形态，
            并让档位真实驱动下方模拟 agent 的思考步数、耗时与 token 消耗。
          </p>
        </header>

        <ComposerDemo />
        <SegmentedDemo />

        <footer className="pb-6 text-xs text-white/30">
          Tip: 面板、开关、档位数据彼此解耦 —— 把 EFFORTS 换成你产品的档位表，
          <code className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px]">
            ReasoningEffortPanel
          </code>
          可以直接搬进任意 composer。
        </footer>
      </div>
    </div>
  );
}
