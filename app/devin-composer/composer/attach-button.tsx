"use client";

import { Plus } from "lucide-react";
import { IconButton } from "./primitives";

/** 附件按钮（+）。后续可替换成「附件菜单 / 文件选择器」。 */
export function AttachButton({ onAttach }: { onAttach?: () => void }) {
  return (
    <IconButton aria-label="添加附件" onClick={onAttach}>
      <Plus size={17} strokeWidth={2} />
    </IconButton>
  );
}
