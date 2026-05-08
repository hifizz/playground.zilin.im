"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import {
  candlesToLine,
  generateCandles,
  type Candle,
} from "@/lib/lwc-data";
import { ChartShell, palette } from "../_lwc/chart-shell";

/**
 * Lightweight Charts · Area Glow
 * --------------------------------------------------------------
 * The "TradingView homepage hero" look — a single soft-gradient area
 * series with a generous bottom fade, range selector tabs that
 * remap the visible range via `timeScale().setVisibleRange()`,
 * and a floating live tooltip pinned to the crosshair.
 */

const RANGES = [
  { id: "1M", days: 22 },
  { id: "3M", days: 66 },
  { id: "6M", days: 132 },
  { id: "1Y", days: 252 },
  { id: "ALL", days: Infinity },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const PALETTES = [
  {
    id: "blue",
    label: "Cobalt",
    line: "#3b82f6",
    top: "rgba(59,130,246,0.55)",
    bottom: "rgba(59,130,246,0.02)",
    pill: "from-blue-500/20 to-blue-500/5 text-blue-200 border-blue-500/30",
  },
  {
    id: "violet",
    label: "Aurora",
    line: "#a78bfa",
    top: "rgba(167,139,250,0.55)",
    bottom: "rgba(167,139,250,0.02)",
    pill: "from-violet-500/20 to-violet-500/5 text-violet-200 border-violet-500/30",
  },
  {
    id: "emerald",
    label: "Forest",
    line: "#34d399",
    top: "rgba(52,211,153,0.5)",
    bottom: "rgba(52,211,153,0.02)",
    pill: "from-emerald-500/20 to-emerald-500/5 text-emerald-200 border-emerald-500/30",
  },
  {
    id: "amber",
    label: "Sunset",
    line: "#f59e0b",
    top: "rgba(245,158,11,0.5)",
    bottom: "rgba(245,158,11,0.02)",
    pill: "from-amber-500/20 to-amber-500/5 text-amber-200 border-amber-500/30",
  },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

export default function AreaGlowPage() {
  const candles = useMemo(
    () => generateCandles({ count: 260, seed: 99, drift: 0.12, volatility: 1.2 }),
    [],
  );
  const [range, setRange] = useState<RangeId>("3M");
  const [paletteId, setPaletteId] = useState<PaletteId>("blue");
  const palettePreset =
    PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];

  return (
    <ChartShell
      title="Area Glow"
      subtitle="单 series 的渐变面积图，配合 visibleRange + 主题色切换。这套配色与 TradingView 官网首页 hero 演示同款思路。"
      side={
        <div className="flex flex-wrap items-center gap-2">
          <PaletteSelector
            palettes={PALETTES}
            value={paletteId}
            onChange={setPaletteId}
          />
        </div>
      }
    >
      <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
        <Header candles={candles} preset={palettePreset} />
      </div>
      <div className="px-2 py-2 md:px-3 md:py-3">
        <AreaChart candles={candles} range={range} preset={palettePreset} />
      </div>
      <div className="border-t border-neutral-800/80 px-3 py-2 md:px-4">
        <RangeSelector value={range} onChange={setRange} />
      </div>
    </ChartShell>
  );
}

function Header({
  candles,
  preset,
}: {
  candles: Candle[];
  preset: (typeof PALETTES)[number];
}) {
  const last = candles[candles.length - 1];
  const first = candles[0];
  const change = last.close - first.close;
  const pct = (change / first.close) * 100;
  const up = change >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          PORTFOLIO · NAV
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            ${last.close.toFixed(2)}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs bg-gradient-to-r ${preset.pill}`}
          >
            {up ? "▲" : "▼"} {pct.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: preset.line }}
        />
        <span>Real-time · 1D bars</span>
      </div>
    </div>
  );
}

function AreaChart({
  candles,
  range,
  preset,
}: {
  candles: Candle[];
  range: RangeId;
  preset: (typeof PALETTES)[number];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [hover, setHover] = useState<{
    time: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // Mount + initial data — chart instance lives until unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: { borderColor: "transparent" },
      timeScale: { borderColor: "transparent", timeVisible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          width: 1,
          color: "rgba(255,255,255,0.18)",
          style: LineStyle.Solid,
          labelBackgroundColor: "#1f2937",
        },
        horzLine: { visible: false, labelVisible: false },
      },
    });
    const area = chart.addSeries(AreaSeries, {
      lineColor: preset.line,
      topColor: preset.top,
      bottomColor: preset.bottom,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    area.setData(candlesToLine(candles));
    chartRef.current = chart;
    seriesRef.current = area;

    const onMove = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point || !seriesRef.current) {
        setHover(null);
        return;
      }
      const datum = param.seriesData.get(seriesRef.current) as
        | { value: number }
        | undefined;
      if (!datum) {
        setHover(null);
        return;
      }
      setHover({
        time: String(param.time),
        value: datum.value,
        x: param.point.x,
        y: param.point.y,
      });
    };
    chart.subscribeCrosshairMove(onMove);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [candles]);

  // Re-style series when palette switches without rebuilding the chart.
  useEffect(() => {
    seriesRef.current?.applyOptions({
      lineColor: preset.line,
      topColor: preset.top,
      bottomColor: preset.bottom,
    });
  }, [preset]);

  // Range tabs map to a sliding window over the most recent N candles.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const r = RANGES.find((x) => x.id === range);
    if (!r) return;
    if (r.days === Infinity) {
      chart.timeScale().fitContent();
      return;
    }
    const slice = candles.slice(-r.days);
    if (slice.length === 0) return;
    chart.timeScale().setVisibleRange({
      from: slice[0].time,
      to: slice[slice.length - 1].time,
    });
  }, [range, candles]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[440px] w-full" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-neutral-700/70 bg-neutral-950/90 px-2 py-1 font-mono text-[11px] text-neutral-200 shadow-2xl backdrop-blur-sm"
          style={{
            left: clamp(hover.x, 60, 1200),
            top: Math.max(20, hover.y - 14),
          }}
        >
          <div className="text-neutral-500">{hover.time}</div>
          <div style={{ color: preset.line }}>${hover.value.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function RangeSelector({
  value,
  onChange,
}: {
  value: RangeId;
  onChange: (id: RangeId) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md bg-neutral-900/40 p-0.5 text-xs">
      {RANGES.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={`rounded px-3 py-1 font-mono transition-colors ${
            value === r.id
              ? "bg-neutral-800 text-neutral-100"
              : "text-neutral-500 hover:text-neutral-200"
          }`}
        >
          {r.id}
        </button>
      ))}
    </div>
  );
}

function PaletteSelector<T extends { id: string; label: string; line: string }>({
  palettes,
  value,
  onChange,
}: {
  palettes: readonly T[];
  value: string;
  onChange: (id: T["id"]) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/40 px-1 py-1">
      {palettes.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            title={p.label}
            className={`relative h-6 w-6 rounded-md transition-transform ${active ? "scale-110 ring-1 ring-white/40" : "opacity-70 hover:opacity-100"}`}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${p.line}, rgba(0,0,0,0.4))`,
            }}
          />
        );
      })}
    </div>
  );
}
