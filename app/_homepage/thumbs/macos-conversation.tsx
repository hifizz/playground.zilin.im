export function MacosConversationThumb() {
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 15% 0%, #b3cde0 0%, transparent 55%), linear-gradient(155deg, #c3d2df 0%, #d5dce7 50%, #cad5c9 100%)",
      }}
    >
      <div
        className="flex h-[100px] w-[180px] overflow-hidden"
        style={{
          borderRadius: 8,
          background: "rgba(214,224,232,0.84)",
          boxShadow: "0 7px 20px rgba(0,0,0,0.22)",
        }}
      >
        <div className="w-[58px] shrink-0 px-1.5 pt-2">
          <div className="mb-2 h-2.5 rounded bg-black/[0.07]" />
          {["Intercom MCP", "Memory viewer", "Tone fixes"].map((title, index) => (
            <div key={title} className={`mb-1 rounded px-1 py-1 ${index === 0 ? "bg-black/[0.07]" : ""}`}>
              <div className="truncate text-[4px] font-medium text-slate-800">{title}</div>
              <div className="mt-0.5 text-[3px] text-slate-400">January 9</div>
            </div>
          ))}
        </div>
        <div
          className="flex-1 px-3 pt-3"
          style={{
            background: "rgba(255,255,255,0.90)",
            borderLeft: "0.5px solid rgba(0,0,0,0.07)",
          }}
        >
          <div className="text-[7px] font-bold text-slate-900">Intercom MCP</div>
          <div className="mt-0.5 text-[4px] text-slate-400">January 9, 2026</div>
          <div className="my-2 border-t border-slate-200" />
          <div className="text-[5px] font-semibold text-slate-900">Goal</div>
          <div className="mt-1 space-y-1">
            <div className="h-1 rounded-full bg-slate-300" />
            <div className="h-1 w-4/5 rounded-full bg-slate-300" />
            <div className="h-1 w-3/5 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
