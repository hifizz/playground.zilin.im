"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SALES_DATA, SALES_POINT_COUNT, SALES_ROWS, SALES_Y_LABELS, valueToRows, type SalesPeriod } from "../data";
import { PopoverRow, PopoverTitle, POPOVER_SURFACE } from "../ui/chart-popover";

/* ───── 几何常量（与原站一致） ───── */
const CELL_H = 10; // 单格高度
const GAP = 2; // 格间距（横向 / 纵向相同）
const CHART_H = SALES_ROWS * (CELL_H + GAP) - GAP; // 298
const POPOVER_W = 156;
const POPOVER_H = 107;
const DEFAULT_INDEX_X = 26; // 初始高亮第 26 个数据点
const COL_MIN = 9; // 每列最小占位（格宽 7 + 间距 2），决定窄屏下抽稀成多少列

/* ───── 颜色 ───── */
const COLOR_EMPTY = "#393837";
const COLOR_NEW = "#444341";
export const COLOR_EXISTING = "#f97316";
export const COLOR_NEW_USER_LEGEND = "#49433b";

const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.7 } as const;

export function PixelBarChart({ period }: { period: SalesPeriod }) {
  const uid = useId().replace(/:/g, "");
  const { points, axis } = SALES_DATA[period];
  const reduce = useReducedMotion();

  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(682);
  const [revealed, setRevealed] = useState(false); // 首次滚入视口后点亮
  const [hover, setHover] = useState<number | null>(null);
  const [intro, setIntro] = useState(true); // 首次入场用更慢的「对角波浪」，之后用快的

  /* 容器宽度 → 列数。窄屏时把 57 个数据点均匀抽稀 */
  const cols = Math.max(16, Math.min(SALES_POINT_COUNT, Math.floor((width + GAP) / COL_MIN)));
  const sample = useMemo(
    () => Array.from({ length: cols }, (_, i) => (cols === SALES_POINT_COUNT ? i : Math.round((i * (SALES_POINT_COUNT - 1)) / (cols - 1)))),
    [cols],
  );
  const defaultCol = useMemo(
    () => sample.reduce((best, p, i) => (Math.abs(p - DEFAULT_INDEX_X) < Math.abs(sample[best] - DEFAULT_INDEX_X) ? i : best), 0),
    [sample],
  );
  const active = Math.min(hover ?? defaultCol, cols - 1);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setRevealed(true));
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setIntro(false), 1600);
    return () => clearTimeout(t);
  }, [revealed]);

  const cellW = (width - GAP * (cols - 1)) / cols;
  const colCenter = (i: number) => i * (cellW + GAP) + cellW / 2;

  /* 25 行 × cols 列的格子。亮色规则：自底向上，existing 段橙色 → new 段 #444341 → 其余灰底 */
  const cells = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let row = 0; row < SALES_ROWS; row++) {
      const fromBottom = SALES_ROWS - row; // 1 = 最底行
      for (let c = 0; c < cols; c++) {
        const p = points[sample[c]];
        const newRows = valueToRows(p.newUser);
        const exRows = valueToRows(p.existing);
        const color = revealed ? (fromBottom <= exRows ? COLOR_EXISTING : fromBottom <= newRows ? COLOR_NEW : COLOR_EMPTY) : COLOR_EMPTY;
        // 首次：从左下到右上对角扫过；之后切换周期：更短的波浪
        const delay = reduce ? 0 : intro ? c * 14 + (SALES_ROWS - row) * 22 : c * 9 + (SALES_ROWS - row) * 6;
        out.push(
          <div
            key={`${row}-${c}`}
            data-c={c}
            className="mx-pc rounded-[1px]"
            style={{ backgroundColor: color, ["--d" as string]: `${delay}ms` }}
          />,
        );
      }
    }
    return out;
  }, [points, sample, cols, revealed, reduce, intro]);

  /* 悬停点 / popover 定位 */
  const cur = points[sample[active]];
  const dotY = (SALES_ROWS - Math.max(1, valueToRows(cur.newUser))) * (CELL_H + GAP) + CELL_H / 2 - 0.5;
  const centerX = colCenter(active);
  const popX = centerX + 8 + POPOVER_W > width ? centerX - 8 - POPOVER_W : centerX + 8;
  const popY = Math.min(Math.max(dotY - 19.5, -60), CHART_H - POPOVER_H);
  const axisIndex = Math.min(axis.length - 1, Math.floor((sample[active] * axis.length) / SALES_POINT_COUNT));
  const sparseAxis = width < 440 && axis.length > 7; // 窄屏 X 轴隔一个显示一个

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const idx = Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - rect.left) / (cellW + GAP))));
    if (idx !== hover) setHover(idx);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(cols - 1, (h ?? defaultCol) + d)));
    }
    if (e.key === "Escape") setHover(null);
  };

  return (
    <>
      {/* Y 轴刻度文字 */}
      <div className="pointer-events-none absolute left-[20px] top-[calc(var(--chart-top)-1px)] w-[29px] max-sm:left-[14px]" aria-hidden="true">
        {SALES_Y_LABELS.map((l, i) => (
          <p key={l} className="mx-font-display absolute left-0 text-[12px] leading-[15px] tracking-[0.24px] text-mx-mute" style={{ top: i * 47 }}>
            {l}
          </p>
        ))}
      </div>

      {/* Y 轴刻度线：圆点 + 超细虚线，横向把标签引到图表里 */}
      <svg
        className="pointer-events-none absolute left-[52.9px] top-[calc(var(--chart-top)+5.4px)] max-sm:left-[38.9px]"
        width="22.1"
        height="285.2"
        viewBox="0 0 22.1 285.2"
        aria-hidden="true"
      >
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(0 ${i * 47})`}>
            <circle cx="1.6" cy="1.6" r="1.6" fill="#808080" />
            <line x1="1.6" y1="1.6" x2="22.1" y2="1.6" stroke="#808080" strokeWidth="0.6" strokeDasharray="0.7885 0.7885" strokeDashoffset="0.3945" />
          </g>
        ))}
      </svg>

      {/* 交互层：像素网格 + 竖虚线 + 圆点 + popover */}
      <div
        ref={hostRef}
        role="img"
        tabIndex={0}
        aria-label={`Sales trend ${period}. ${cur.label}: new users ${Math.round(cur.newUser)}k, existing users ${Math.round(cur.existing)}k. Use arrow keys to inspect.`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setHover(null)}
        className="group/chart absolute left-[76px] right-[20px] top-(--chart-top) cursor-crosshair rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-mx-ring focus-visible:ring-offset-4 focus-visible:ring-offset-mx-card max-sm:left-[62px] max-sm:right-[14px]"
        style={{ height: CHART_H }}
      >
        {/* 悬停列高亮、其余列压暗：用动态 <style> 避免给 1400 个格子逐个绑 React 事件 */}
        <style>{hover === null ? "" : `.${uid} .mx-pc:not([data-c="${hover}"]){opacity:.72}.${uid} .mx-pc[data-c="${hover}"]{filter:brightness(1.22)}`}</style>
        <div
          className={cn(uid, "grid h-full w-full")}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${SALES_ROWS}, ${CELL_H}px)`,
            gap: GAP,
          }}
        >
          {cells}
        </div>

        {/* 竖向参考线：顶部渐隐的 0.6px 虚线，跟着列做弹簧位移 */}
        <motion.svg
          className="pointer-events-none absolute top-0"
          width="0.6"
          height={CHART_H}
          viewBox={`0 0 0.6 ${CHART_H}`}
          initial={false}
          animate={{ x: centerX - 0.3, opacity: revealed ? 1 : 0 }}
          transition={SPRING}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-xh`} x1="0.8" y1="0" x2="0.8" y2={CHART_H} gradientUnits="userSpaceOnUse">
              <stop stopColor="white" stopOpacity="0" />
              <stop offset="0.159935" stopColor="white" />
              <stop offset="1" stopColor="white" />
            </linearGradient>
          </defs>
          <path d={`M0.3 ${CHART_H}V0`} stroke={`url(#${uid}-xh)`} strokeWidth="0.6" strokeDasharray="2 4" />
        </motion.svg>

        {/* 落在 new-user 柱顶的圆点 */}
        <motion.span
          className="pointer-events-none absolute left-0 top-0 size-[9px] rounded-[88px] border border-white bg-[#1a1a1a] shadow-[0px_0px_0px_2px_rgba(26,26,26,0.1),0px_2px_4px_0px_rgba(0,0,0,0.25)]"
          initial={false}
          animate={{ x: centerX - 4.5, y: dotY - 4.5, opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.4 }}
          transition={{ ...SPRING, opacity: { delay: revealed && intro ? 1.1 : 0 } }}
          aria-hidden="true"
        />

        {/* popover：同样走 spring 跟随，靠近右缘时翻到左侧 */}
        <motion.div
          className={cn("pointer-events-none absolute left-0 top-0 z-10 flex flex-col overflow-clip", "mx-stroke-inside", POPOVER_SURFACE)}
          style={{ width: POPOVER_W }}
          initial={false}
          animate={{ x: popX, y: popY, opacity: revealed ? 1 : 0 }}
          transition={{ ...SPRING, opacity: { duration: 0.3, delay: revealed && intro ? 1.2 : 0 } }}
          aria-hidden="true"
        >
          <PopoverTitle className="p-[8px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={cur.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="flex-1 whitespace-nowrap text-[14px] leading-[normal] tracking-[-0.14px] text-[#979797]"
              >
                {cur.label}
              </motion.p>
            </AnimatePresence>
          </PopoverTitle>
          <PopoverRow dot={COLOR_NEW_USER_LEGEND} label="New User">
            <RollingValue value={cur.newUser} />
          </PopoverRow>
          <PopoverRow dot={COLOR_EXISTING} label="Existing User">
            <RollingValue value={cur.existing} />
          </PopoverRow>
        </motion.div>
      </div>

      {/* X 轴：被点圆点隔开的标签，当前所在段高亮 */}
      <div
        className="pointer-events-none absolute left-[76px] right-[20px] top-[calc(var(--chart-top)+318px)] flex items-center justify-between max-sm:left-[62px] max-sm:right-[14px]"
        aria-hidden="true"
      >
        {axis.map((t, i) => (
          <span key={`${period}-${t}`} className="contents">
            {i > 0 && !sparseAxis && <span className="size-[3px] shrink-0 rounded-full bg-mx-subtle" />}
            <span
              className={cn(
                "min-w-px flex-1 text-center text-[12px] uppercase leading-[normal] transition-colors duration-200",
                i === (sparseAxis ? axisIndex - (axisIndex % 2) : axisIndex) ? "font-medium text-mx-fg" : "text-mx-subtle",
              )}
            >
              {sparseAxis && i % 2 === 1 ? "" : t}
            </span>
          </span>
        ))}
      </div>
    </>
  );
}

/** 数值变化时旧值上滑淡出、新值从下方淡入 */
function RollingValue({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={rounded}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="whitespace-nowrap text-[14px] font-medium leading-[normal] tracking-[-0.14px] text-mx-fg tabular-nums"
      >
        {rounded}k
      </motion.span>
    </AnimatePresence>
  );
}
