"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  LineSeries,
  Line,
  PointSeries,
  GridlineSeries,
  Gridline,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearYAxisTickLabel,
  TooltipArea,
  ChartTooltip,
  ChartZoomPan,
} from "reaviz";
import { ChartShell } from "../_lwc/chart-shell";
import { TICKERS, buildNormalizedSeries, type MultiSeries } from "../_reaviz/data";

const RANGE_OPTIONS = [
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "6M", days: 132 },
  { key: "1Y", days: 252 },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

export default function ReavizStockComparePage() {
  const [range, setRange] = useState<RangeKey>("3M");
  const [active, setActive] = useState<Set<string>>(
    () => new Set(TICKERS.map((t) => t.name)),
  );

  const days = RANGE_OPTIONS.find((r) => r.key === range)!.days;
  const allSeries = useMemo(() => buildNormalizedSeries(days), [days]);
  const visible = useMemo(
    () => allSeries.filter((s) => active.has(String(s.key))),
    [allSeries, active],
  );

  return (
    <ChartShell
      title="Reaviz · 多股票涨跌对比"
      badge={
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-emerald-300">
          reaviz · LineChart
        </span>
      }
      subtitle="把每只股票归一化到 0%，对比同一时间段内的相对涨跌。Hover 出现共享 crosshair tooltip，滚轮缩放、拖动平移。"
      side={<RangeTabs range={range} setRange={setRange} />}
    >
      <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
        <Legend
          allSeries={allSeries}
          active={active}
          onToggle={(name) => {
            setActive((prev) => {
              const next = new Set(prev);
              if (next.has(name)) next.delete(name);
              else next.add(name);
              if (next.size === 0) return prev;
              return next;
            });
          }}
        />
      </div>
      <div className="h-[440px] p-3 md:p-5">
        <CompareChart series={visible} />
      </div>
    </ChartShell>
  );
}

function CompareChart({ series }: { series: MultiSeries[] }) {
  const colors = (_d: unknown, i: number) =>
    TICKERS.find((t) => t.name === String(series[i]?.key))?.color ?? "#94a3b8";

  return (
    <LineChart
      id="reaviz-stock-compare"
      data={series as never}
      gridlines={
        <GridlineSeries
          line={<Gridline strokeColor="rgba(255,255,255,0.06)" />}
        />
      }
      xAxis={
        <LinearXAxis
          type="time"
          tickSeries={
            <LinearXAxisTickSeries
              label={<LinearXAxisTickLabel padding={8} />}
            />
          }
        />
      }
      yAxis={
        <LinearYAxis
          type="value"
          axisLine={null}
          tickSeries={
            <LinearYAxisTickSeries
              label={
                <LinearYAxisTickLabel
                  format={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                />
              }
            />
          }
        />
      }
      zoomPan={<ChartZoomPan />}
      series={
        <LineSeries
          type="grouped"
          interpolation="smooth"
          colorScheme={colors}
          line={<Line strokeWidth={2} />}
          symbols={<PointSeries show="hover" />}
          tooltip={
            <TooltipArea
              tooltip={
                <ChartTooltip
                  followCursor
                  content={(d: unknown) => <SeriesTooltip data={d} />}
                />
              }
            />
          }
        />
      }
    />
  );
}

type TooltipDatum = {
  x: Date;
  y: number;
  data?: {
    key?: string;
    value?: number;
    y?: number;
    data?: number;
    metadata?: { color?: string };
  }[];
};

function SeriesTooltip({ data }: { data: unknown }) {
  const d = data as TooltipDatum | null;
  if (!d?.data?.length) return null;
  const dateLabel = d.x instanceof Date
    ? d.x.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : String(d.x ?? "");

  const valueOf = (r: NonNullable<TooltipDatum["data"]>[number]) =>
    Number(r.value ?? r.y ?? r.data ?? 0);
  const sorted = [...d.data].sort((a, b) => valueOf(b) - valueOf(a));

  return (
    <div
      className="min-w-[180px] rounded-md border px-3 py-2 font-mono text-[11px] text-neutral-200"
      style={{
        background: "rgba(13, 14, 19, 0.96)",
        borderColor: "rgba(64, 64, 64, 0.6)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mb-1.5 text-[10px] uppercase tracking-widest text-neutral-500">
        {dateLabel}
      </div>
      <div className="space-y-1">
        {sorted.map((row) => {
          const name = String(row.key ?? "");
          const value = valueOf(row);
          const color =
            TICKERS.find((t) => t.name === name)?.color ?? "#94a3b8";
          return (
            <div
              key={name}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-3 rounded-sm"
                  style={{ background: color }}
                />
                <span className="text-neutral-300">{name}</span>
              </span>
              <span
                className={
                  value >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {value >= 0 ? "+" : ""}
                {value.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RangeTabs({
  range,
  setRange,
}: {
  range: RangeKey;
  setRange: (k: RangeKey) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950/60 p-0.5 font-mono text-[11px]">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => setRange(opt.key)}
          className={
            "rounded-md px-2.5 py-1 transition-colors " +
            (range === opt.key
              ? "bg-neutral-800 text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300")
          }
        >
          {opt.key}
        </button>
      ))}
    </div>
  );
}

function Legend({
  allSeries,
  active,
  onToggle,
}: {
  allSeries: MultiSeries[];
  active: Set<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allSeries.map((s) => {
        const name = String(s.key);
        const last = s.data[s.data.length - 1]?.data ?? 0;
        const color = TICKERS.find((t) => t.name === name)?.color ?? "#94a3b8";
        const on = active.has(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onToggle(name)}
            className={
              "group flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-mono transition-colors " +
              (on
                ? "border-neutral-700 bg-neutral-900/80 text-neutral-100"
                : "border-neutral-800/60 bg-neutral-950 text-neutral-500 line-through")
            }
          >
            <span
              className="inline-block h-1.5 w-4 rounded-sm"
              style={{ background: on ? color : "rgba(255,255,255,0.18)" }}
            />
            <span>{name}</span>
            <span
              className={
                "tabular-nums " +
                (on
                  ? Number(last) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                  : "text-neutral-600")
              }
            >
              {Number(last) >= 0 ? "+" : ""}
              {Number(last).toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
