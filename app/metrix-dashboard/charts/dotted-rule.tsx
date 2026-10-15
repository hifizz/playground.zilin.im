import { cn } from "@/lib/utils";

/**
 * 一条「实心端点 + 虚线」的水平参考线。
 * 虚线 0.6px、间隔 2~3px，颜色压得很暗，只是给柱子一个对齐参照。
 */
export function DottedRule({
  className,
  style,
  color,
  dash,
  offset,
  bothEnds,
}: {
  className?: string;
  style?: React.CSSProperties;
  color: string;
  dash: string;
  offset: number;
  bothEnds?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none h-[3.2px]", className)} style={style} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <circle cx="1.6" cy="1.6" r="1.6" fill={color} />
        <line x1="1.6" y1="1.6" x2="100%" y2="1.6" stroke={color} strokeWidth="0.6" strokeDasharray={dash} strokeDashoffset={offset} />
      </svg>
      {bothEnds && <span className="absolute right-0 top-0 size-[3.2px] rounded-full" style={{ background: color }} />}
    </div>
  );
}
