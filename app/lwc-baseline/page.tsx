"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BaselineSeries,
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
 * Lightweight Charts · Baseline P&L
 * --------------------------------------------------------------
 * Baseline series — the upper half (above cost basis) is filled green,
 * lower half is filled red. Drag the slider to change the cost basis;
 * the baseline crossover updates live without re-creating the chart.
 */
export default function BaselinePage() {
  const candles = useMemo(
    () => generateCandles({ count: 220, seed: 5, drift: -0.04, volatility: 1.5 }),
    [],
  );
  const initial = round2(
    candles.reduce((s, c) => s + c.close, 0) / candles.length,
  );
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const [base, setBase] = useState<number>(initial);

  const last = candles[candles.length - 1];
  const above = last.close >= base;
  const pnl = last.close - base;
  const pnlPct = (pnl / base) * 100;

  return (
    <ChartShell
      title="Baseline · Cost Basis"
      subtitle="BaselineSeries 的典型用法：以 cost basis 为基准线，上方绿色填充，下方红色填充。拖动 slider 实时改变基准线 —— 通过 applyOptions 更新即可，无需重建 chart。"
    >
      <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              UNREALIZED P&L
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className={`font-mono text-3xl font-semibold md:text-4xl ${above ? "text-emerald-400" : "text-rose-400"}`}
              >
                {above ? "+" : ""}
                {pnl.toFixed(2)}
              </span>
              <span
                className={`font-mono text-sm ${above ? "text-emerald-400" : "text-rose-400"}`}
              >
                ({pnlPct >= 0 ? "+" : ""}
                {pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-xs">
            <Stat label="Cost basis" value={`$${base.toFixed(2)}`} />
            <Stat label="Mark" value={`$${last.close.toFixed(2)}`} />
            <Stat label="Days" value={`${candles.length}`} />
          </div>
        </div>
      </div>
      <div className="px-2 py-2 md:px-3 md:py-3">
        <BaselineChart candles={candles} base={base} />
      </div>
      <div className="border-t border-neutral-800/80 px-5 py-4 md:px-6">
        <BasisSlider
          min={Math.floor(min)}
          max={Math.ceil(max)}
          value={base}
          onChange={setBase}
        />
      </div>
    </ChartShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 md:flex-col md:items-start">
      <span className="text-neutral-500">{label}</span>
      <span className="font-mono font-medium text-neutral-200">{value}</span>
    </div>
  );
}

function BaselineChart({
  candles,
  base,
}: {
  candles: Candle[];
  base: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Baseline"> | null>(null);
  const [legend, setLegend] = useState<{ time: string; value: number } | null>(
    null,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily: "ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: { borderColor: "transparent" },
      timeScale: { borderColor: "transparent" },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(255,255,255,0.16)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1f2937",
        },
        horzLine: {
          color: "rgba(255,255,255,0.16)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1f2937",
        },
      },
    });

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: base },
      topLineColor: "rgba(38,166,154,1)",
      topFillColor1: "rgba(38,166,154,0.32)",
      topFillColor2: "rgba(38,166,154,0.02)",
      bottomLineColor: "rgba(239,83,80,1)",
      bottomFillColor1: "rgba(239,83,80,0.02)",
      bottomFillColor2: "rgba(239,83,80,0.32)",
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(candlesToLine(candles));

    chartRef.current = chart;
    seriesRef.current = series;

    const onMove = (param: MouseEventParams<Time>) => {
      if (!param.time || !seriesRef.current) {
        setLegend(null);
        return;
      }
      const d = param.seriesData.get(seriesRef.current) as
        | { value: number }
        | undefined;
      if (d) setLegend({ time: String(param.time), value: d.value });
    };
    chart.subscribeCrosshairMove(onMove);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  useEffect(() => {
    seriesRef.current?.applyOptions({
      baseValue: { type: "price", price: base },
    });
  }, [base]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[460px] w-full" />
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-neutral-800/80 bg-neutral-950/80 px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm">
        <span className="text-neutral-500">Baseline </span>
        <span className="text-neutral-200">${base.toFixed(2)}</span>
      </div>
      {legend && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-neutral-800/80 bg-neutral-950/80 px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm">
          <span className="text-neutral-500">{legend.time} </span>
          <span
            className={
              legend.value >= base ? "text-emerald-400" : "text-rose-400"
            }
          >
            ${legend.value.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function BasisSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-4 text-xs">
      <span className="font-mono text-neutral-500">Cost basis</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-800 accent-emerald-400"
      />
      <span className="w-16 text-right font-mono text-neutral-200">
        ${value.toFixed(2)}
      </span>
    </label>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
