"use client";

import { ArrowUp } from "lucide-react";

/** 发送按钮：圆形上箭头。无内容时为灰色，有内容时变深。 */
export function SendButton({
  disabled = false,
  onSend,
}: {
  disabled?: boolean;
  onSend?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="发送"
      disabled={disabled}
      onClick={onSend}
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#9d9d9d] text-white transition-[background-color,transform] duration-100 enabled:bg-[#2b2b2b] enabled:hover:bg-black enabled:active:scale-95 enabled:active:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      <ArrowUp size={14} strokeWidth={2} />
    </button>
  );
}
