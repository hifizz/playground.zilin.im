"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Circle, Loader2, Play, RotateCcw, SlidersHorizontal, Square } from "lucide-react";
import { defaultConfig, efforts, models, ReasoningPanel, type ReasoningConfig } from "./ReasoningPanel";

type Run = { config: ReasoningConfig; step: number };
const steps = ["读取任务与配置", "分配模拟推理预算", "生成演示结果"];

export default function ModelReasoningPage() {
  const [config, setConfig] = useState<ReasoningConfig>(defaultConfig);
  const [run, setRun] = useState<Run | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = run !== null && run.step < steps.length;
  const level = efforts.findIndex((item) => item.id === config.effort);
  const model = models.find((item) => item.id === config.model)!;

  useEffect(() => {
    if (!run || run.step >= steps.length) return;
    const delay = run.config.reasoning ? 450 + efforts.findIndex((item) => item.id === run.config.effort) * 350 : 250;
    timer.current = setTimeout(() => setRun((current) => current ? { ...current, step: current.step + 1 } : null), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [run]);

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setRun(null);
    setCancelled(false);
    setConfig(defaultConfig);
  }

  return (
    <main lang="zh-CN" className="min-h-svh bg-[#101215] text-zinc-100 selection:bg-[#b6d7b5]/30">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"><ArrowLeft size={14} /> Playground</Link>
        <span className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] tracking-wider text-zinc-400">AGENT UX / 交互实验</span>
      </nav>
      <div className="mx-auto max-w-5xl px-6 pb-12 pt-10 sm:px-10 sm:pt-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div><p className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-[#b6d7b5]"><span className="size-1.5 rounded-full bg-[#b6d7b5]" /> INTELLIGENCE, AT YOUR PACE</p><h1 className="text-4xl font-medium tracking-tight sm:text-5xl">思考，也有分寸。</h1><p className="mt-4 text-sm leading-7 text-zinc-400">选择模型，调节推理投入。找到速度与深度之间的平衡。</p></div>
          <button type="button" onClick={reset} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#b6d7b5]"><RotateCcw size={13} /> 恢复默认</button>
        </header>
        <div className="grid items-start gap-6 md:grid-cols-[1.05fr_1fr] md:gap-8">
          <ReasoningPanel value={config} onChange={(next) => { setConfig(next); setRun(null); setCancelled(false); }} disabled={running} />
          <div className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-[#15171b] p-6 sm:p-7" aria-label="配置预览">
              <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm"><SlidersHorizontal size={15} className="text-zinc-400" /> 当前配置</h2><span className="font-mono text-[10px] text-[#b6d7b5]">LIVE PREVIEW</span></div>
              <div className="mb-5 mt-7 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><model.icon size={19} className="text-[#b6d7b5]" /></span><div><p className="text-sm font-medium">{model.name}</p><p className="mt-1 text-xs text-zinc-500">{config.reasoning ? `${efforts[level].label} effort · 推理已开启` : "推理已关闭"}</p></div></div>
              <pre aria-label="当前配置 JSON" className="overflow-x-auto rounded-xl border border-white/5 bg-[#0e1012] p-4 font-mono text-xs leading-7 text-[#b6d7b5]">{JSON.stringify({ model: config.model, reasoning: config.reasoning ? { enabled: true, effort: config.effort } : { enabled: false } }, null, 2)}</pre>
              <p className="mt-3 text-[11px] leading-5 text-zinc-500">演示配置格式；模型名称、档位与预算均为示意。</p>
            </section>
            <section className="rounded-3xl border border-white/10 bg-[#15171b] p-6 sm:p-7" aria-label="模拟运行">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-sm">试试看</h2><span className="text-[10px] text-zinc-500">本地模拟 · 无 API 请求</span></div>
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-xs leading-6 text-zinc-400">示例任务：为一个待办应用设计实现方案，并比较不同方案的取舍。</p>
              <div className="my-5 space-y-3" aria-hidden>
                {steps.map((step, index) => <div key={step} className={`flex items-center gap-2.5 text-xs ${run && run.step >= index ? "text-zinc-200" : "text-zinc-600"}`}>{run && run.step > index ? <Check size={13} className="text-[#b6d7b5]" /> : run?.step === index ? <Loader2 size={13} className="animate-spin text-[#b6d7b5] motion-reduce:animate-none" /> : <Circle size={13} />}{step}</div>)}
              </div>
              <p role="status" className="mb-5 min-h-10 text-xs leading-5 text-zinc-400">{cancelled ? "模拟已停止，可以调整配置后重新运行。" : run ? run.step === steps.length ? `模拟完成：${models.find((item) => item.id === run.config.model)!.name} / ${run.config.reasoning ? run.config.effort : "推理关闭"}。已演示配置到完成的状态切换，未生成真实回答。` : `正在${steps[run.step]}…` : "调整左侧参数，观察模拟运行的等待节奏。"}</p>
              <button type="button" onClick={() => {
                if (running) {
                  if (timer.current) clearTimeout(timer.current);
                  setRun(null);
                  setCancelled(true);
                } else {
                  setCancelled(false);
                  setRun({ config: { ...config }, step: 0 });
                }
              }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b6d7b5] px-4 py-3.5 text-xs font-semibold text-[#172418] transition hover:bg-[#c7e4c6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b6d7b5]">{running ? <Square size={13} /> : <Play size={13} />}{running ? "停止模拟" : "运行模拟"}{!running && <ArrowUpRight size={14} className="ml-auto" />}</button>
            </section>
          </div>
        </div>
        <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-white/8 pt-5 text-[11px] leading-6 text-zinc-500"><span>Model reasoning & effort · 组件交互 Demo</span><span>支持键盘操作 · 档位随模型能力联动</span></footer>
      </div>
    </main>
  );
}
