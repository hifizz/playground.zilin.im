"use client";

export type ContextStripItem = {
  icon?: React.ReactNode;
  label: string;
};

/** 面板底部的上下文条：环境 / 目录 / 分支等只读信息项。 */
export function ContextStrip({
  items,
  className = "",
}: {
  items: ContextStripItem[];
  className?: string;
}) {
  return (
    <div className={`mt-1 flex h-6 items-center gap-4 px-2 text-[13px] text-[#b3b3b3] ${className}`}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}
