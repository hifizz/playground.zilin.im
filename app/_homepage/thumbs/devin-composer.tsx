export function DevinComposerThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white px-4">
      <div className="w-full max-w-64 rounded-xl bg-[#f3f3f3] px-1.5 pt-1.5 pb-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="h-1.5 w-10 rounded bg-neutral-400/70" />
          <span className="flex gap-1">
            <span className="h-3 w-6 rounded bg-neutral-300" />
            <span className="h-3 w-7 rounded bg-[#0b84f3]" />
          </span>
        </div>
        <div className="rounded-lg bg-white px-2 pt-2 pb-2.5 shadow-sm">
          <div className="mb-4 text-[7px] text-neutral-400">Tip: New space (⌘N)</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-neutral-500">+</span>
            <span className="h-1.5 w-12 rounded bg-neutral-300" />
            <span className="ml-auto flex size-3.5 items-center justify-center rounded-full bg-neutral-400 text-[6px] text-white">↑</span>
          </div>
        </div>
        <div className="mt-2 flex gap-2 px-1">
          <span className="h-1.5 w-6 rounded bg-neutral-300" />
          <span className="h-1.5 w-7 rounded bg-neutral-300" />
        </div>
      </div>
    </div>
  );
}
