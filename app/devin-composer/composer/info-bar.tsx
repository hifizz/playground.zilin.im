"use client";

/** 输入卡上方的信息区：left 放状态摘要，right 放操作按钮组。 */
export function ComposerInfoBar({
  left,
  right,
  className = "",
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-1.5 flex h-7 items-center gap-1.5 ${className}`}>
      <div className="flex min-w-0 items-center gap-1">{left}</div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{right}</div>
    </div>
  );
}
