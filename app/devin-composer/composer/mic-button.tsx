"use client";

import { Mic } from "lucide-react";
import { IconButton } from "./primitives";

/** 语音输入按钮。listening 时高亮，后续可替换成语音识别控件。 */
export function MicButton({
  listening = false,
  onToggle,
}: {
  listening?: boolean;
  onToggle?: (listening: boolean) => void;
}) {
  return (
    <IconButton
      aria-label={listening ? "停止语音输入" : "语音输入"}
      aria-pressed={listening}
      onClick={() => onToggle?.(!listening)}
      className={listening ? "bg-neutral-100 text-neutral-800" : ""}
    >
      <Mic size={16} strokeWidth={2} />
    </IconButton>
  );
}
