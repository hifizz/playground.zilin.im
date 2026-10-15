"use client";

import { useState } from "react";
import { SelectPill } from "./primitives";

export const MODELS = ["Claude Haiku 5.5 XHigh", "Claude Sonnet 5 High", "Fusion"] as const;

/** 模型选择器。占位实现为点击轮播，后续替换成带说明的模型下拉。 */
export function ModelSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internal, setInternal] = useState<string>(MODELS[0]);
  const current = value ?? internal;

  const cycle = () => {
    const index = MODELS.indexOf(current as (typeof MODELS)[number]);
    const next = MODELS[(index + 1) % MODELS.length];
    if (onChange) onChange(next);
    else setInternal(next);
  };

  return <SelectPill label={current} onClick={cycle} aria-label={`模型：${current}`} />;
}
