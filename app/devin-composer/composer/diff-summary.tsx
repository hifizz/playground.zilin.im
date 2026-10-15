"use client";

import { ChevronRight } from "lucide-react";

/** 待审阅改动摘要：「12 files +987 ›」，点击可展开 diff 详情。 */
export function DiffSummary({
  files,
  additions,
  deletions,
  onClick,
}: {
  files: number;
  additions: number;
  deletions?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] text-neutral-500 transition-[background-color,transform] duration-100 hover:bg-black/[0.04] active:scale-95 active:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      {files} files
      <span className="text-[#1e9d52]">+{additions}</span>
      {deletions !== undefined && <span className="text-[#e5484d]">−{deletions}</span>}
      <ChevronRight size={14} strokeWidth={2} className="text-neutral-400" aria-hidden="true" />
    </button>
  );
}
