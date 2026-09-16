"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Brain,
  Check,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import {
  EFFORTS,
  EffortList,
  EffortSegmented,
  EffortSlider,
  LevelBars,
  ReasoningEffortPanel,
  formatTokens,
  type EffortLevel,
  type ReasoningConfig,
} from "./effort-panel";

/**
 * ============================================================================
 * Reasoning Effort 调节面板 · Demo 页
 * ============================================================================
 * 上半部分：把面板放进一个模拟聊天 composer —— 发送后按 effort 档位
 *           播放不同长度的 thinking trace，再给出详略不同的回答。
 * 下半部分：三种可独立使用的 effort 选择器变体（分段 / 列表 / 滑杆）。
 * ============================================================================
 */

const QUESTION = "为什么 TCP 握手需要三次，而不是两次？";

/** 不开 reasoning 时的直接回答 */
const DIRECT_ANSWER = [
  "因为两次握手无法让服务端确认「客户端收到了自己的 SYN-ACK」，第三次 ACK 用来同步服务端的初始序号。",
];

type Phase = "idle" | "thinking" | "done";

type Run = { cfg: ReasoningConfig; showTrace: boolean };

/* -------------------------------------------------------------------------- */
/* In-context demo：聊天窗 + composer                                           */
/* -------------------------------------------------------------------------- */

function ChatDemo() {
  const [cfg, setCfg] = useState<ReasoningConfig>({
    enabled: true,
    effort: "medium",
  });
  const [showTrace, setShowTrace] = useState(true);

  // 发送时快照一份配置，运行中改面板不会打断播放
  const [run, setRun] = useState<Run | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [traceOpen, setTraceOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runMeta = run?.cfg.enabled ? EFFORTS[run.cfg.effort] : null;
  const steps = runMeta?.steps ?? [];
  const stepMs = runMeta ? runMeta.ms / runMeta.steps.length : 0;

  // thinking 阶段：按档位匀速播 steps，全部播完稍停半拍再进 done
  useEffect(() => {
    if (phase !== "thinking" || !runMeta) return;
    const finished = stepIdx >= steps.length;
    const t = setTimeout(
      () => (finished ? setPhase("done") : setStepIdx((i) => i + 1)),
      finished ? 500 : stepMs,
    );
    return () => clearTimeout(t);
  }, [phase, stepIdx, runMeta, steps.length, stepMs]);

  // 新内容出现时滚到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stepIdx, phase, traceOpen]);

  const send = () => {
    if (phase === "thinking") return;
    const snapshot = { cfg: { ...cfg }, showTrace };
    setRun(snapshot);
    setStepIdx(0);
    setTraceOpen(false);
    setPhase(snapshot.cfg.enabled ? "thinking" : "done");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* ———— 左：聊天窗 ———— */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101013]">
        {/* model bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[13px] font-medium text-white/85">
            playground-5
          </span>
          <span className="text-[12px] text-white/35">
            {cfg.enabled ? `· reasoning ${cfg.effort}` : "· reasoning off"}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] ${
              phase === "thinking"
                ? "bg-violet-400/15 text-violet-300"
                : phase === "done"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-white/5 text-white/35"
            }`}
          >
            {phase}
          </span>
        </div>

        {/* messages */}
        <div
          ref={scrollRef}
          className="flex max-h-[380px] min-h-[300px] flex-col gap-4 overflow-y-auto p-4"
        >
          {!run && (
            <div className="flex flex-1 items-center justify-center text-[12px] text-white/25">
              调好 effort，点右下角 ↑ 发送
            </div>
          )}

          {run && (
            <>
              {/* user bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-[13.5px] text-white/90">
                  {QUESTION}
                </div>
              </div>

              {/* assistant */}
              <div className="flex flex-col gap-3">
                {/* thinking trace */}
                {run.cfg.enabled && (
                  <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() =>
                        phase === "done" &&
                        run.showTrace &&
                        setTraceOpen((o) => !o)
                      }
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px]"
                    >
                      {phase === "thinking" ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 2.4,
                              ease: "linear",
                            }}
                            className="text-violet-300"
                          >
                            <Brain size={13} />
                          </motion.span>
                          <motion.span
                            animate={{ opacity: [0.45, 1, 0.45] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.6,
                              ease: "easeInOut",
                            }}
                            className="text-white/70"
                          >
                            Thinking…
                          </motion.span>
                          <span className="ml-auto font-mono text-[10px] text-white/30">
                            {run.cfg.effort}
                          </span>
                        </>
                      ) : (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-white/50">
                            Thought for{" "}
                            {((runMeta?.ms ?? 0) / 1000).toFixed(1)}s
                          </span>
                          {run.showTrace && (
                            <ChevronRight
                              size={12}
                              className={`ml-auto text-white/30 transition-transform ${
                                traceOpen ? "rotate-90" : ""
                              }`}
                            />
                          )}
                        </>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {run.showTrace && (phase === "thinking" || traceOpen) && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="flex flex-col gap-1.5 overflow-hidden border-t border-white/[0.06] px-3 py-2.5"
                        >
                          {steps
                            .slice(
                              0,
                              phase === "thinking" ? stepIdx : steps.length,
                            )
                            .map((s, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex gap-2 text-[12px] leading-snug text-white/50"
                              >
                                <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-violet-400/70" />
                                {s}
                              </motion.li>
                            ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* answer */}
                {phase === "done" && (
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      show: { transition: { staggerChildren: 0.28 } },
                    }}
                    className="flex flex-col gap-2 px-0.5 text-[13.5px] leading-relaxed text-white/80"
                  >
                    {(run.cfg.enabled && runMeta
                      ? runMeta.answers
                      : DIRECT_ANSWER
                    ).map((p, i) => (
                      <motion.p
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 6 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.3 },
                          },
                        }}
                      >
                        {p}
                      </motion.p>
                    ))}
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-2xl border border-white/10 bg-[#141419] p-2.5">
            <div className="px-2 pb-3 pt-1 text-[13.5px] text-white/80">
              {QUESTION}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                <Paperclip size={14} />
              </button>
              <ReasoningEffortPanel
                value={cfg}
                onChange={setCfg}
                showTrace={showTrace}
                onShowTraceChange={setShowTrace}
              />
              <button
                type="button"
                onClick={send}
                disabled={phase === "thinking"}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-white/85 disabled:opacity-30"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ———— 右：状态 → API payload ———— */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#101013] p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          面板状态 → 请求载荷
        </div>

        <div className="flex items-center justify-between rounded-xl bg-black/30 px-3.5 py-3">
          <span className="flex items-center gap-2 text-[13px] text-white/80">
            <Brain size={14} className="text-violet-300" />
            {cfg.enabled ? EFFORTS[cfg.effort].label : "off"}
          </span>
          <span className={cfg.enabled ? "text-violet-300" : "text-white/25"}>
            <LevelBars level={cfg.effort} />
          </span>
        </div>

        {/* token 预算 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-white/45">thinking budget</span>
            <span className="font-mono text-white/60">
              {cfg.enabled ? `≤ ${formatTokens(EFFORTS[cfg.effort].tokens)}` : "0"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{
                width: cfg.enabled
                  ? `${(EFFORTS[cfg.effort].tokens / EFFORTS.max.tokens) * 100}%`
                  : "0%",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
            />
          </div>
          <div className="flex justify-between font-mono text-[9px] text-white/25">
            <span>2k</span>
            <span>64k</span>
          </div>
        </div>

        {/* 模拟 payload */}
        <pre className="overflow-x-auto rounded-xl bg-black/40 p-3.5 font-mono text-[11px] leading-relaxed text-white/60">
          {JSON.stringify(
            {
              model: "playground-5",
              reasoning: cfg.enabled
                ? { effort: cfg.effort, budget_tokens: EFFORTS[cfg.effort].tokens }
                : null,
              trace_summary: showTrace,
            },
            null,
            2,
          )}
        </pre>

        <p className="text-[11px] leading-relaxed text-white/35">
          同一份配置驱动三种 UI：分段控件的选中态、预算条宽度、
          以及右侧 payload —— 档位即数据。
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 变体画廊                                                                     */
/* -------------------------------------------------------------------------- */

function VariantCard({
  caption,
  children,
  value,
}: {
  caption: string;
  children: React.ReactNode;
  value: EffortLevel;
}) {
  const meta = EFFORTS[value];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101013] p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">
        {caption}
      </div>
      {children}
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-[11px] text-white/45">{meta.desc}</span>
      </div>
      <div className="-mt-1.5 flex items-center gap-2 font-mono text-[10px] text-white/35">
        <LevelBars level={value} />
        {formatTokens(meta.tokens)} tokens · ~{(meta.ms / 1000).toFixed(1)}s
      </div>
    </div>
  );
}

function Variants() {
  const [a, setA] = useState<EffortLevel>("high");
  const [b, setB] = useState<EffortLevel>("medium");
  const [c, setC] = useState<EffortLevel>("low");

  return (
    <section className="flex flex-col gap-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
        控件变体 · 三种 effort 选择器
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <VariantCard caption="① 分段控件 · 窄面板" value={a}>
          <EffortSegmented value={a} onChange={setA} layoutId="gallery-seg" />
        </VariantCard>
        <VariantCard caption="② 描述列表 · 菜单场景" value={b}>
          <EffortList value={b} onChange={setB} />
        </VariantCard>
        <VariantCard caption="③ 刻度滑杆 · 拖拽调档" value={c}>
          <EffortSlider value={c} onChange={setC} />
        </VariantCard>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function ReasoningEffortPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Agent UX/UI · Reasoning
          </div>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            Reasoning Effort 调节面板
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/50">
            GPT-5 / Claude 系产品里的「思考强度」控件：主开关 +
            Low / Medium / High / Max 四档 effort，档位映射 thinking token
            预算。下面把它挂进一个模拟 composer ——
            档位越高，思考轨迹越长、回答越深入。
          </p>
        </header>

        <ChatDemo />
        <Variants />

        <footer className="flex flex-col gap-1.5 pb-6 text-xs leading-relaxed text-white/30">
          <p>
            实现要点 —— popover
            自包含（点击外部 / Esc 关闭）；四档共用一份 meta
            表驱动描述、预算条与模拟步数；
          </p>
          <p>
            分段指示器用 framer-motion <code>layoutId</code>{" "}
            做共享元素滑动；关闭 reasoning 时 effort 区以{" "}
            <code>height:auto</code> 折叠；发送时快照配置，运行中调档不打断播放。
          </p>
        </footer>
      </div>
    </div>
  );
}
