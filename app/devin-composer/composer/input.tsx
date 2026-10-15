"use client";

import { useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";

const MAX_HEIGHT = 200;

/** 输入区：自动增高的 textarea，Enter 提交、Shift+Enter 换行。 */
export function ComposerInput({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Ask Devin anything…",
  className = "",
  ...rest
}: Omit<ComponentProps<"textarea">, "onChange" | "onSubmit" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault();
          onSubmit?.();
        }
      }}
      className={`block w-full resize-none bg-transparent px-3.5 pt-3 pb-4 text-[15px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 ${className}`}
      {...rest}
    />
  );
}
