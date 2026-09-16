export function AgentReasoningStepThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#11131a] p-5">
      <div className="w-full max-w-[250px] overflow-hidden rounded-xl border border-[#343a49] bg-[#191c25] shadow-xl shadow-black/30">
        <div className="flex items-center gap-2 border-b border-[#2e3441] px-3 py-2.5">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-400/15 text-[10px] text-indigo-200">✦</span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-neutral-100">Agent 正在推理</div>
            <div className="text-[8px] text-neutral-500">1 / 3 个步骤完成</div>
          </div>
          <span className="ml-auto text-[11px] text-neutral-500">⌄</span>
        </div>
        <div className="space-y-0 px-3 py-3">
          <div className="grid grid-cols-[18px_1fr] gap-2">
            <div className="relative flex justify-center"><span className="z-10 grid h-4 w-4 place-items-center rounded-full bg-emerald-400/20 text-[9px] text-emerald-300">✓</span><i className="absolute top-4 h-7 border-l border-emerald-500/45" /></div>
            <div><p className="m-0 text-[9px] font-medium text-neutral-200">分析问题与约束</p><p className="mt-1 text-[8px] text-neutral-500">拆分为可验证的子问题</p></div>
          </div>
          <div className="grid grid-cols-[18px_1fr] gap-2">
            <div className="relative flex justify-center"><span className="z-10 grid h-4 w-4 place-items-center rounded-full bg-indigo-400/25 text-[9px] text-indigo-200">◌</span><i className="absolute top-4 h-8 border-l border-neutral-700" /></div>
            <div><p className="m-0 flex items-center gap-1 text-[9px] font-medium text-neutral-100"><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />正在联网搜索</p><div className="mt-1.5 truncate rounded bg-black/25 px-1.5 py-1 font-mono text-[7px] text-neutral-400">⌕ latest release notes</div></div>
          </div>
          <div className="grid grid-cols-[18px_1fr] gap-2"><div className="flex justify-center"><span className="mt-0.5 h-3.5 w-3.5 rounded-full border border-neutral-600" /></div><p className="m-0 text-[9px] text-neutral-500">交叉核对来源</p></div>
        </div>
      </div>
    </div>
  );
}
