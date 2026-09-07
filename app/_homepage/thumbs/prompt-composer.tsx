export function PromptComposerThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f5f6] px-5">
      <div className="w-full max-w-72 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
        <div className="mb-5 text-[11px] text-neutral-400">Write a message…</div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500"><span className="text-lg">+</span><span>@</span><span>/</span><span className="ml-auto">Vanilla 1⌄</span><span className="flex size-5 items-center justify-center rounded-md bg-neutral-800 text-white">↑</span></div>
      </div>
    </div>
  );
}
