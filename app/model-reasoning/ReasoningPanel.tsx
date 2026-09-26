"use client";

import { useId } from "react";
import { Brain, Check, ChevronDown, Cpu, Sparkles, Zap } from "lucide-react";

export const efforts = [
  { id: "low", label: "Low", title: "轻量思考", description: "快速整理、日常问答，让想法即刻发生。", time: "短", budget: "少" },
  { id: "medium", label: "Medium", title: "恰到好处", description: "兼顾响应速度与推理投入，适合大多数任务。", time: "适中", budget: "适中" },
  { id: "high", label: "High", title: "深入推演", description: "为代码分析、多步骤问题留出更多思考空间。", time: "较长", budget: "多" },
  { id: "max", label: "Max", title: "全力以赴", description: "为复杂研究投入最高预算，耐心换取更多探索。", time: "最长", budget: "最多" },
] as const;

export type Effort = (typeof efforts)[number]["id"];
export type ReasoningConfig = { model: string; reasoning: boolean; effort: Effort };
export const models = [
  { id: "spark", name: "Spark", subtitle: "轻巧敏捷，专注即时响应", icon: Zap, levels: ["low", "medium"] as readonly Effort[] },
  { id: "think", name: "Think", subtitle: "通用推理，平衡速度与深度", icon: Brain, levels: ["low", "medium", "high"] as readonly Effort[] },
  { id: "deep", name: "Deep", subtitle: "复杂任务，探索更多可能", icon: Sparkles, levels: ["low", "medium", "high", "max"] as readonly Effort[] },
];
export const defaultConfig: ReasoningConfig = { model: "think", reasoning: true, effort: "medium" };

export function ReasoningPanel({ value, onChange, disabled = false }: {
  value: ReasoningConfig;
  onChange: (config: ReasoningConfig) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const model = models.find((item) => item.id === value.model) ?? models[1];
  const level = efforts.findIndex((item) => item.id === value.effort);
  const effort = efforts[level];

  return (
    <section aria-label="模型推理设置" className="rounded-3xl border border-white/10 bg-[#191c20] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <span className="flex items-center gap-2.5 text-sm font-medium"><Cpu size={17} className="text-[#b6d7b5]" /> 模型设置</span>
        <span className="font-mono text-[10px] tracking-widest text-zinc-500">MODEL CONFIG</span>
      </div>
      <div className="space-y-7 p-6 sm:p-8">
        <div>
          <label htmlFor={`${id}-model`} className="mb-3 block text-xs text-zinc-400">Model <span className="ml-1 text-zinc-500">/ 选择模型</span></label>
          <div className="relative">
            <model.icon aria-hidden size={20} className="pointer-events-none absolute left-4 top-4 text-[#b6d7b5]" />
            <select id={`${id}-model`} value={value.model} disabled={disabled} onChange={(event) => {
              const next = models.find((item) => item.id === event.target.value)!;
              onChange({ ...value, model: next.id, effort: next.levels.includes(value.effort) ? value.effort : next.levels[next.levels.length - 1] });
            }} className="w-full appearance-none rounded-xl border border-white/10 bg-[#22262b] py-3.5 pl-12 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#b6d7b5] disabled:opacity-50">
              {models.map((item) => <option key={item.id} value={item.id}>{item.name} · 演示模型</option>)}
            </select>
            <ChevronDown aria-hidden size={16} className="pointer-events-none absolute right-4 top-4 text-zinc-400" />
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">{model.subtitle}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div><h2 id={`${id}-reasoning`} className="text-sm font-medium">Reasoning</h2><p className="mt-1.5 text-xs text-zinc-400">给模型一点思考的空间</p></div>
          <button type="button" role="switch" aria-checked={value.reasoning} aria-labelledby={`${id}-reasoning`} disabled={disabled} onClick={() => onChange({ ...value, reasoning: !value.reasoning })} className={`h-7 w-12 shrink-0 rounded-full p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#191c20] disabled:opacity-50 ${value.reasoning ? "bg-[#b6d7b5]" : "bg-zinc-600"}`}>
            <span className={`block size-5 rounded-full bg-[#191c20] transition-transform motion-reduce:transition-none ${value.reasoning ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <fieldset disabled={disabled || !value.reasoning} aria-describedby={`${id}-hint`} className="min-w-0 disabled:opacity-40">
          <legend className="mb-4 text-xs text-zinc-400">Reasoning effort <span className="ml-1 text-zinc-500">/ 推理投入</span></legend>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#111316] p-1.5">
            {efforts.map((item) => (
              <label key={item.id} className={`relative rounded-lg text-center text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#b6d7b5] ${!model.levels.includes(item.id) ? "cursor-not-allowed opacity-30" : "cursor-pointer"} ${value.effort === item.id ? "bg-[#b6d7b5] font-semibold text-[#172418] shadow-sm" : "text-zinc-400 hover:bg-white/5"}`}>
                <input type="radio" name={`${id}-effort`} value={item.id} checked={value.effort === item.id} disabled={!model.levels.includes(item.id)} onChange={() => onChange({ ...value, effort: item.id })} className="sr-only" />
                <span className="block py-3">{item.label}</span>
              </label>
            ))}
          </div>
          <div aria-hidden className="mt-6 flex h-16 items-end justify-between gap-1">
            {Array.from({ length: 36 }, (_, i) => <span key={i} className={`flex-1 rounded-t-sm transition-all duration-500 motion-reduce:transition-none ${i < (level + 1) * 9 && value.reasoning ? "bg-[#b6d7b5]" : "bg-white/8"}`} style={{ height: `${18 + Math.pow(i / 35, 1.5) * 82}%`, opacity: i < (level + 1) * 9 && value.reasoning ? 0.35 + (i / 35) * 0.65 : 1 }} />)}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-500"><span>Faster</span><span>Deeper</span></div>
        </fieldset>

        <div id={`${id}-hint`} aria-live="polite" className="min-h-24 rounded-xl border border-[#b6d7b5]/10 bg-[#b6d7b5]/5 p-4">
          <div className="flex items-center gap-2 text-sm text-[#c8dfc7]"><Check size={15} />{value.reasoning ? effort.title : "直接回答"}</div>
          <p className="mt-2 text-xs leading-6 text-zinc-400">{value.reasoning ? effort.description : "已关闭推理，保留当前档位，重新开启即可继续使用。"}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/8 pt-5 text-xs">
          <div><span className="text-zinc-500">相对等待时间</span><p className="mt-2 text-zinc-200">{value.reasoning ? effort.time : "最短"}</p></div>
          <div><span className="text-zinc-500">推理预算</span><p className="mt-2 text-zinc-200">{value.reasoning ? effort.budget : "关闭"}</p></div>
        </div>
      </div>
    </section>
  );
}
