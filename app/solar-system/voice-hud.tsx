"use client";

/**
 * 语音控制 HUD：右上角聆听状态 pill + 最近一句识别文本 + 命令示例。
 * 命令表由页面传入（两版内容不同），通过 ref 每次识别取最新闭包。
 */

import { useEffect, useRef, useState } from "react";
import {
  createVoiceControl,
  type VoiceCommand,
  type VoiceController,
  type VoiceStatus,
} from "./voice";

export function VoiceLayer({
  active,
  commands,
  examples,
}: {
  active: boolean;
  commands: VoiceCommand[];
  examples: string; // 示例命令文案
}) {
  const [status, setStatus] = useState<VoiceStatus>("starting");
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);

  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands; // 每次渲染后同步最新命令闭包
  });

  useEffect(() => {
    if (!active) return;
    let controller: VoiceController | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    controller = createVoiceControl({
      getCommands: () => commandsRef.current,
      onStatus: setStatus,
      onHeard: (text, matched) => {
        setHeard({ text, ok: !!matched });
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setHeard(null), 4000);
      },
    });
    return () => {
      controller?.dispose();
      if (hideTimer) clearTimeout(hideTimer);
      setHeard(null);
    };
  }, [active]);

  if (!active) return null;

  const statusUi =
    status === "listening" || status === "starting" ? (
      <>
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-red-400" />
        </span>
        聆听中
      </>
    ) : status === "unsupported" ? (
      <>🎙 此浏览器不支持语音识别（建议 Chrome）</>
    ) : status === "denied" ? (
      <>🎙 麦克风被拒绝</>
    ) : (
      <>🎙 语音服务不可用</>
    );

  return (
    <div className="fixed right-3 md:right-5 top-16 z-30 flex flex-col items-end gap-1.5 pointer-events-none">
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 backdrop-blur-xl px-3 h-8 text-[11px] text-white/80">
        {statusUi}
      </div>
      {(status === "listening" || status === "starting") && (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl px-3 py-1.5 text-[10px] text-white/45 max-w-[240px] text-right leading-relaxed">
          试试说：{examples}
        </div>
      )}
      {heard && (
        <div
          className={`rounded-xl border px-3 py-1.5 text-[11px] backdrop-blur-xl max-w-[280px] text-right ${
            heard.ok
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-black/40 text-white/50"
          }`}
        >
          “{heard.text}”{heard.ok ? " ✓" : ""}
        </div>
      )}
    </div>
  );
}
