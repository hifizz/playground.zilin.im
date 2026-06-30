import { Lock } from "lucide-react";

/** 仿浏览器顶栏（呼应原始截图的窗口质感） */
export function BrowserChrome() {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-[#141416] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-md bg-black/40 px-3 py-1 text-[11px] text-white/40">
        <Lock size={11} />
        auth.business.gemini.google/login
      </div>
      <div className="w-12" />
    </div>
  );
}
