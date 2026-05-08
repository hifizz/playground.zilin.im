"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import {
  candlesToVolume,
  generateCandles,
  type Candle,
} from "@/lib/lwc-data";
import { ChartShell, palette } from "../_lwc/chart-shell";

/**
 * Lightweight Charts · Candle + Volume
 * --------------------------------------------------------------
 * Two stacked panes powered by a single chart instance:
 *   1. Candlestick price (top ~75%)
 *   2. Volume histogram on a secondary price scale ("vol")
 *
 * Highlights how to:
 *   - mount/destroy a chart safely in React 19
 *   - co-locate two series on different price scales
 *   - drive a custom legend off the crosshair `subscribeCrosshairMove` event
 */
export default function CandleVolumePage() {
  const candles = useMemo(() => generateCandles({ count: 240, seed: 11 }), []);
  return (
    <ChartShell
      title="Candle + Volume"
      badge={<TickerBadge />}
      subtitle="经典双 pane 布局：上方蜡烛图，下方共享时间轴的成交量直方图。Crosshair 同步联动一个自定义 OHLC legend。"
    >
      <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
        <Header candles={candles} />
      </div>
      <div className="px-2 py-2 md:px-3 md:py-3">
        <CandleVolumeChart candles={candles} />
      </div>
    </ChartShell>
  );
}

function TickerBadge() {
  return (
    <span className="rounded-md border border-neutral-700/60 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] tracking-widest text-neutral-400">
      ACME · NASDAQ
    </span>
  );
}

function Header({ candles }: { candles: Candle[] }) {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = last.close - prev.close;
  const pct = (change / prev.close) * 100;
  const up = change >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          ACME Industries
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            ${last.close.toFixed(2)}
          </span>
          <span
            className={`font-mono text-sm ${up ? "text-emerald-400" : "text-rose-400"}`}
          >
            {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({pct.toFixed(2)}%)
          </span>
        </div>
      </div>
      <Stats candles={candles} />
    </div>
  );
}

function Stats({ candles }: { candles: Candle[] }) {
  const last = candles[candles.length - 1];
  const high = Math.max(...candles.slice(-22).map((c) => c.high));
  const low = Math.min(...candles.slice(-22).map((c) => c.low));
  const vol = candles.slice(-22).reduce((s, c) => s + c.volume, 0);
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs md:grid-cols-4">
      <Stat label="Open" value={`$${last.open.toFixed(2)}`} />
      <Stat label="22D High" value={`$${high.toFixed(2)}`} />
      <Stat label="22D Low" value={`$${low.toFixed(2)}`} />
      <Stat label="22D Vol" value={`${(vol / 1_000_000).toFixed(2)}M`} />
    </div>
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

function CandleVolumeChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [legend, setLegend] = useState<Candle | null>(
    candles[candles.length - 1] ?? null,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: {
        borderColor: palette.border,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: palette.border,
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1f2937" },
        horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1f2937" },
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: palette.up,
      downColor: palette.down,
      borderVisible: false,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
    });
    candleSeries.setData(candles);

    const volumeSeries: ISeriesApi<"Histogram"> = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      },
    );
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    volumeSeries.setData(candlesToVolume(candles));

    chart.timeScale().fitContent();

    const handleMove = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point) {
        setLegend(candles[candles.length - 1] ?? null);
        return;
      }
      const datum = candles.find((c) => c.time === param.time);
      if (datum) setLegend(datum);
    };
    chart.subscribeCrosshairMove(handleMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleMove);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[460px] w-full" />
      {legend && <Legend datum={legend} />}
    </div>
  );
}

function Legend({ datum }: { datum: Candle }) {
  const up = datum.close >= datum.open;
  return (
    <div className="pointer-events-none absolute left-4 top-3 z-10 flex flex-wrap gap-x-3 gap-y-0.5 rounded-md border border-neutral-800/80 bg-neutral-950/80 px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm">
      <LegendKV label="O" value={datum.open} tone="neutral" />
      <LegendKV label="H" value={datum.high} tone="up" />
      <LegendKV label="L" value={datum.low} tone="down" />
      <LegendKV label="C" value={datum.close} tone={up ? "up" : "down"} />
      <span className="text-neutral-500">
        Vol{" "}
        <span className="text-neutral-300">
          {(datum.volume / 1000).toFixed(0)}K
        </span>
      </span>
    </div>
  );
}

function LegendKV({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "up" | "down" | "neutral";
}) {
  const cls =
    tone === "up"
      ? "text-emerald-400"
      : tone === "down"
        ? "text-rose-400"
        : "text-neutral-300";
  return (
    <span className="text-neutral-500">
      {label} <span className={cls}>{value.toFixed(2)}</span>
    </span>
  );
}
