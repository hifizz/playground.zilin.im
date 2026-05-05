"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  LineChart as LineIcon,
  BarChart3 as BarIcon,
} from "lucide-react";

/**
 * ============================================================================
 * Stock Dashboard · 纯 SVG 实现的股价 dashboard
 * ============================================================================
 * 区域线图（Trend）+ 蜡烛图（Candle）两种图表，可切换。
 * 没有图表库依赖（之前用 recharts，~150kb，对一个 demo 来说太重，
 * 也跟项目"手搓 UI"的调子不一致），全部由 inline SVG + 几行算坐标 hook 组成。
 *
 * 设计要点：
 *   - 用固定 viewBox（600×280），preserveAspectRatio 默认拉伸 → 容器自适应
 *   - 鼠标 hover 时 client→SVG 坐标映射 → 找到最近 data 点 → 显示 HTML tooltip
 *   - 蜡烛图自己画 line + rect，颜色随涨跌
 *   - 区域填充用 linearGradient defs
 * ============================================================================
 */

type DataPoint = {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  value: number;
  isUp: boolean;
};

// --- 1. 模拟数据 ---
function generateData(): DataPoint[] {
  const data: DataPoint[] = [];
  let prevClose = 530;
  const fmt = (n: number) => Number(n.toFixed(2));

  for (let i = 0; i < 50; i++) {
    const timeHour = 9 + Math.floor((i * 10) / 60);
    const timeMinute = (30 + i * 10) % 60;
    const period = timeHour >= 12 ? "PM" : "AM";
    const displayHour = timeHour > 12 ? timeHour - 12 : timeHour;
    const time = `${displayHour}:${timeMinute === 0 ? "00" : timeMinute.toString().padStart(2, "0")} ${period}`;

    const volatility = 2.5;
    const change = (Math.random() - 0.45) * volatility;

    const open = prevClose + (Math.random() - 0.5) * 0.5;
    let close = open + change;
    if (i > 15 && i < 25) close -= 1.5;
    else if (i >= 25) close += 0.8;

    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;

    data.push({
      time,
      open: fmt(open),
      close: fmt(close),
      high: fmt(high),
      low: fmt(low),
      value: fmt(close),
      isUp: close >= open,
    });
    prevClose = close;
  }
  return data;
}

// --- 2. 共用：图表布局常量 + 坐标换算 ---
const CHART_W = 600;
const CHART_H = 280;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function buildScales(data: DataPoint[], useRange: boolean) {
  // useRange=true 用 high/low（蜡烛图需要），false 用 value（线图）
  const ys = useRange
    ? data.flatMap((d) => [d.high, d.low])
    : data.map((d) => d.value);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const padding = (max - min) * 0.05;
  const yMin = min - padding;
  const yMax = max + padding;
  const range = yMax - yMin || 1;

  const xStep = data.length > 1 ? INNER_W / (data.length - 1) : 0;
  const xAt = (i: number) => PAD.left + i * xStep;
  const yAt = (v: number) => PAD.top + INNER_H - ((v - yMin) / range) * INNER_H;

  // 5 个 y 刻度
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (range * i) / 4);

  return { xAt, yAt, yMin, yMax, yTicks };
}

// --- 3. Hover 跟踪 hook（client 坐标 → 最近 data idx） ---
function useNearestIndex(dataLen: number, svgRef: React.RefObject<SVGSVGElement | null>) {
  const [idx, setIdx] = useState<number | null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || dataLen <= 1) return;
    const rect = svg.getBoundingClientRect();
    // SVG 实际宽度 → viewBox 单位换算
    const xInSvg = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const xRel = (xInSvg - PAD.left) / INNER_W;
    const i = Math.max(0, Math.min(dataLen - 1, Math.round(xRel * (dataLen - 1))));
    setIdx(i);
  }
  function onLeave() {
    setIdx(null);
  }

  return { idx, onMove, onLeave };
}

// --- 4. 通用 grid + 轴标签 ---
function ChartAxes({
  yTicks,
  yAt,
  xAt,
  data,
}: {
  yTicks: number[];
  yAt: (v: number) => number;
  xAt: (i: number) => number;
  data: DataPoint[];
}) {
  const xLabelEvery = Math.max(1, Math.floor(data.length / 5));
  return (
    <g>
      {/* 横向 grid 线 + Y 标签 */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={PAD.left + INNER_W}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="#262626"
            strokeOpacity={0.5}
          />
          <text
            x={PAD.left - 6}
            y={yAt(t)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#737373"
            fontSize={11}
          >
            {t.toFixed(0)}
          </text>
        </g>
      ))}
      {/* X 标签 */}
      {data.map((d, i) =>
        i % xLabelEvery === 0 ? (
          <text
            key={i}
            x={xAt(i)}
            y={CHART_H - PAD.bottom + 18}
            textAnchor="middle"
            fill="#737373"
            fontSize={11}
          >
            {d.time}
          </text>
        ) : null,
      )}
    </g>
  );
}

// --- 5. 区域线图 ---
function TrendChart({
  data,
  color = "#22c55e",
}: {
  data: DataPoint[];
  color?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { idx, onMove, onLeave } = useNearestIndex(data.length, svgRef);
  const { xAt, yAt, yTicks } = useMemo(() => buildScales(data, false), [data]);

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(d.value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xAt(data.length - 1)} ${PAD.top + INNER_H} L ${PAD.left} ${PAD.top + INNER_H} Z`;

  const last = data[data.length - 1];
  const hovered = idx != null ? data[idx] : null;
  const gradId = "trendAreaFill";

  return (
    <div className="relative h-[320px] w-full mt-4 select-none animate-in fade-in duration-500">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-full w-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <ChartAxes yTicks={yTicks} yAt={yAt} xAt={xAt} data={data} />

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

        {/* 当前价格点（最后一个） */}
        <circle
          cx={xAt(data.length - 1)}
          cy={yAt(last.value)}
          r={4}
          fill="white"
          stroke={color}
          strokeWidth={2}
        />

        {/* hover 竖线 + 高亮点 */}
        {hovered && idx != null && (
          <g pointerEvents="none">
            <line
              x1={xAt(idx)}
              x2={xAt(idx)}
              y1={PAD.top}
              y2={PAD.top + INNER_H}
              stroke="#525252"
              strokeDasharray="3 3"
            />
            <circle
              cx={xAt(idx)}
              cy={yAt(hovered.value)}
              r={4}
              fill={color}
              stroke="white"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>

      {hovered && idx != null && (
        <FloatingTooltip xRatio={idx / (data.length - 1)}>
          <p className="font-semibold text-neutral-400">{hovered.time}</p>
          <p className="text-green-400 font-mono">Price: ${hovered.value}</p>
        </FloatingTooltip>
      )}
    </div>
  );
}

// --- 6. 蜡烛图 ---
function CandleChart({ data }: { data: DataPoint[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { idx, onMove, onLeave } = useNearestIndex(data.length, svgRef);
  const { xAt, yAt, yTicks } = useMemo(() => buildScales(data, true), [data]);

  // 蜡烛宽 = 步长的 60%
  const xStep = data.length > 1 ? INNER_W / (data.length - 1) : 0;
  const candleW = Math.max(2, xStep * 0.6);

  const hovered = idx != null ? data[idx] : null;
  const openLineY = yAt(data[0].open);

  return (
    <div className="relative h-[320px] w-full mt-4 select-none animate-in fade-in duration-500">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-full w-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <ChartAxes yTicks={yTicks} yAt={yAt} xAt={xAt} data={data} />

        {/* 开盘参考线 */}
        <line
          x1={PAD.left}
          x2={PAD.left + INNER_W}
          y1={openLineY}
          y2={openLineY}
          stroke="#525252"
          strokeDasharray="3 3"
        />

        {/* 蜡烛 */}
        {data.map((d, i) => {
          const cx = xAt(i);
          const color = d.isUp ? "#22c55e" : "#ef4444";
          const bodyTop = yAt(Math.max(d.open, d.close));
          const bodyBottom = yAt(Math.min(d.open, d.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          return (
            <g key={i}>
              {/* 影线 */}
              <line
                x1={cx}
                x2={cx}
                y1={yAt(d.high)}
                y2={yAt(d.low)}
                stroke={color}
                strokeWidth={1}
              />
              {/* 实体 */}
              <rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyHeight}
                fill={color}
              />
            </g>
          );
        })}

        {/* hover 高亮当前蜡烛 */}
        {hovered && idx != null && (
          <rect
            x={xAt(idx) - xStep / 2}
            y={PAD.top}
            width={xStep}
            height={INNER_H}
            fill="rgba(255,255,255,0.05)"
            pointerEvents="none"
          />
        )}
      </svg>

      {hovered && idx != null && (
        <FloatingTooltip xRatio={idx / (data.length - 1)}>
          <p className="font-semibold text-neutral-400 mb-1">{hovered.time}</p>
          <div className="space-y-1 font-mono">
            <Row
              label="Open"
              value={hovered.open}
              tone={hovered.isUp ? "up" : "down"}
            />
            <Row label="High" value={hovered.high} />
            <Row label="Low" value={hovered.low} />
            <Row
              label="Close"
              value={hovered.close}
              tone={hovered.isUp ? "up" : "down"}
            />
          </div>
        </FloatingTooltip>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "up" | "down";
}) {
  const cls =
    tone === "up"
      ? "text-green-500"
      : tone === "down"
        ? "text-red-500"
        : "text-neutral-300";
  return (
    <div className="flex justify-between gap-4">
      <span>{label}:</span>
      <span className={cls}>{value}</span>
    </div>
  );
}

// --- 7. 浮动 tooltip：根据 xRatio 决定贴左/贴右，避免溢出 ---
function FloatingTooltip({
  xRatio,
  children,
}: {
  xRatio: number;
  children: React.ReactNode;
}) {
  // xRatio < 0.6 → tooltip 在 hover 点右侧；否则在左侧
  const onLeft = xRatio >= 0.6;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 rounded border border-neutral-700 bg-neutral-800/95 px-2 py-1 text-xs text-neutral-200 shadow-xl backdrop-blur-sm"
      style={{
        left: onLeft ? "auto" : `calc(${xRatio * 100}% + 12px)`,
        right: onLeft ? `calc(${(1 - xRatio) * 100}% + 12px)` : "auto",
      }}
    >
      {children}
    </div>
  );
}

// --- 8. 控件 ---
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 py-2 last:border-0 md:border-0">
      <span className="text-sm font-medium text-neutral-400">{label}</span>
      <span className="font-mono text-sm font-semibold tracking-wide text-neutral-200">
        {value}
      </span>
    </div>
  );
}

function TimeSelector() {
  const periods = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];
  const [active, setActive] = useState("1D");
  return (
    <div className="no-scrollbar flex space-x-1 overflow-x-auto rounded-lg bg-neutral-800/50 p-1">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => setActive(p)}
          className={`whitespace-nowrap rounded px-3 py-1 text-xs font-medium transition-colors ${
            active === p
              ? "bg-neutral-700 text-white"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

type ChartType = "line" | "candle";

function ChartTypeToggle({
  activeType,
  onChange,
}: {
  activeType: ChartType;
  onChange: (t: ChartType) => void;
}) {
  return (
    <div className="flex space-x-1 rounded-lg bg-neutral-800/50 p-1">
      <ToggleBtn
        active={activeType === "line"}
        onClick={() => onChange("line")}
        icon={<LineIcon size={14} />}
        label="Line"
      />
      <ToggleBtn
        active={activeType === "candle"}
        onClick={() => onChange("candle")}
        icon={<BarIcon size={14} />}
        label="Candle"
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-neutral-700 text-white"
          : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- 9. Page ---
export default function StockDashboardPage() {
  const data = useMemo(() => generateData(), []);
  const [chartType, setChartType] = useState<ChartType>("candle");
  const last = data[data.length - 1];

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 font-sans text-neutral-100 md:p-8">
      <div className="w-full max-w-4xl space-y-4">
        <div className="mb-2 text-sm text-neutral-400 md:text-base">
          Sandisk 股价走势分析：
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl md:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="mb-1 text-lg font-medium text-neutral-400">
                Sandisk Corp (SNDK)
              </h1>
              <div className="mb-2 text-6xl font-bold tracking-tight text-white">
                ${last.close}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center font-bold text-green-500">
                  +$14.05 (+2.66%)
                </span>
                <span className="text-neutral-400">January 29</span>
              </div>
            </div>

            <div className="flex w-full flex-col items-end gap-3 md:w-auto">
              <ChartTypeToggle
                activeType={chartType}
                onChange={setChartType}
              />
              <TimeSelector />
            </div>
          </div>

          {/* Chart */}
          <div className="relative mb-8 border-b border-neutral-800 pb-8">
            <div className="pointer-events-none absolute left-10 top-4 z-10 flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800/80 px-2 py-1 text-xs text-neutral-300 backdrop-blur-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  chartType === "line"
                    ? "animate-pulse bg-green-400"
                    : "bg-green-500"
                }`}
              />
              {chartType === "line" ? "Live Trend" : "OHLC Market Data"}
            </div>

            {chartType === "line" ? (
              <TrendChart data={data} />
            ) : (
              <CandleChart data={data} />
            )}

            <div className="mt-2 flex justify-between border-t border-neutral-800/50 px-2 pt-2 font-mono text-xs text-neutral-500">
              <span>9:30 AM</span>
              <span>11:00 AM</span>
              <span>12:30 PM</span>
              <span>2:00 PM</span>
              <span>3:30 PM</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 md:grid-cols-4">
            <StatItem label="Open" value="535.94" />
            <StatItem label="Day Low" value="507.48" />
            <StatItem label="Year Low" value="27.89" />
            <div className="hidden md:block" />

            <StatItem label="Volume" value="23M" />
            <StatItem label="Day High" value="632.00" />
            <StatItem label="Year High" value="546.75" />
          </div>
        </div>
      </div>
    </div>
  );
}
