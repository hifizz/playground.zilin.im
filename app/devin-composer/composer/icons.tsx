"use client";

/** Devin 节点标记：三个相连的节点，内联 SVG 保持组件自包含。 */
export function DevinMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden="true"
      className={className}
    >
      <path d="M4 4H12M4 4L8 12M12 4L8 12" />
      <circle cx="4" cy="4" r="1.8" fill="currentColor" />
      <circle cx="12" cy="4" r="1.8" fill="currentColor" />
      <circle cx="8" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
