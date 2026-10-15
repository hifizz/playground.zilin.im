"use client";

import { useState } from "react";
import { SelectPill } from "./primitives";
import { DevinMark } from "./icons";

export const AGENTS = ["Devin Local", "Devin Cloud"] as const;

/** Agent 选择器（Devin 标记 + 名称）。占位实现为点击轮播。 */
export function AgentSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internal, setInternal] = useState<string>(AGENTS[0]);
  const current = value ?? internal;

  const cycle = () => {
    const index = AGENTS.indexOf(current as (typeof AGENTS)[number]);
    const next = AGENTS[(index + 1) % AGENTS.length];
    if (onChange) onChange(next);
    else setInternal(next);
  };

  return (
    <SelectPill
      icon={<DevinMark size={14} />}
      label={current}
      tone="muted"
      onClick={cycle}
      aria-label={`Agent：${current}`}
    />
  );
}
