"use client";

import { useState } from "react";
import { ShieldX } from "lucide-react";
import { SelectPill } from "./primitives";

export const PERMISSION_MODES = ["Bypass Permissions", "Accept Edits", "Plan Mode"] as const;

/** 权限模式选择器。当前是点击轮播的占位实现，后续替换成下拉菜单。 */
export function PermissionSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internal, setInternal] = useState<string>(PERMISSION_MODES[0]);
  const current = value ?? internal;

  const cycle = () => {
    const index = PERMISSION_MODES.indexOf(current as (typeof PERMISSION_MODES)[number]);
    const next = PERMISSION_MODES[(index + 1) % PERMISSION_MODES.length];
    if (onChange) onChange(next);
    else setInternal(next);
  };

  return (
    <SelectPill
      icon={<ShieldX size={14} strokeWidth={1.8} />}
      label={current}
      onClick={cycle}
      aria-label={`权限模式：${current}`}
    />
  );
}
