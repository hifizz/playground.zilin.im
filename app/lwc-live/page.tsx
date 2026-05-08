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
  type UTCTimestamp,
} from "lightweight-charts";
import { Pause, Play, Zap } from "lucide-react";
import { makeTickStream, type Tick } from "@/lib/lwc-data";
import { ChartShell, palette } from "../_lwc/chart-shell";

/**
 * Lightweight Charts · Live Stream
 * --------------------------------------------------------------
 * Demonstrates the high-performance update path: emit a fresh tick on
 * a setInterval and call `series.update(...)` — the chart redraws in
 * place without reflowing the time axis. Lots of products get this
 * wrong by re-calling setData on every tick which thrashes layout.
 */

const SPEEDS = [
  { label: "0.5x", ms: 600 },
  { label: "1x", ms: 300 },
  { label: "2x", ms: 150 },
  { label: "5x", ms: 60 },
] as const;

export default function LiveStreamPage() {
  const stream = useMemo(() => makeTickStream(33, 248), []);
  const seedTicks = useMemo(() => stream.seed(180, 180_000), [stream]);

  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(SPEEDS[1]);
  const [last, setLast] = useState<Tick>(seedTicks[seedTicks.length - 1]);
  const [openPrice] = useState<number>(seedTicks[0].value);

  const change = last.value - openPrice;
  const pct = (change / openPrice) * 100;
  const up = change >= 0;

  return (
    <ChartShell
      title="Live Stream"
      subtitle="实时 tick 流：每个 tick 调用 series.update() 增量渲染，不会触发整个时间轴 re-layout。这是 lightweight-charts 高性能流式图表的标准用法。"
      side={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700/80 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:border-neutral-600 hover:bg-neutral-800"
          >
            {running ? <Pause size={12} /> : <Play size={12} />}
            <span>{running ? "Pause" : "Resume"}</span>
          </button>
          <SpeedSelector value={speed} onChange={setSpeed} />
        </div>
      }
    >
      <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-emerald-400" : "bg-neutral-600"}`}
                />
                {running ? "STREAMING" : "PAUSED"}
              </span>
              · BTC-USD · 1s
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
                ${last.value.toFixed(2)}
              </span>
              <span
                className={`font-mono text-sm ${up ? "text-emerald-400" : "text-rose-400"}`}
              >
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({pct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/0 px-3 py-1.5 text-xs text-amber-300">
            <Zap size={12} />
            <span className="font-mono">{speed.label} · {Math.round(1000 / speed.ms)} ticks/s</span>
          </div>
        </div>
      </div>
      <div className="px-2 py-2 md:px-3 md:py-3">
        <LiveChart
          seedTicks={seedTicks}
          stream={stream}
          running={running}
          intervalMs={speed.ms}
          onTick={setLast}
        />
      </div>
    </ChartShell>
  );
}

function SpeedSelector({
  value,
  onChange,
}: {
  value: (typeof SPEEDS)[number];
  onChange: (s: (typeof SPEEDS)[number]) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md border border-neutral-800 bg-neutral-900/40 p-0.5 text-xs">
      {SPEEDS.map((s) => (
        <button
          key={s.label}
          onClick={() => onChange(s)}
          className={`rounded px-2 py-0.5 font-mono transition-colors ${
            value.label === s.label
              ? "bg-neutral-800 text-neutral-100"
              : "text-neutral-500 hover:text-neutral-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function LiveChart({
  seedTicks,
  stream,
  running,
  intervalMs,
  onTick,
}: {
  seedTicks: Tick[];
  stream: ReturnType<typeof makeTickStream>;
  running: boolean;
  intervalMs: number;
  onTick: (t: Tick) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const lastTickRef = useRef<Tick>(seedTicks[seedTicks.length - 1]);

  // Mount once with seed data.
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
      timeScale: {
        borderColor: "transparent",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 6,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(255,255,255,0.16)",
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "rgba(255,255,255,0.16)",
          style: LineStyle.Dashed,
        },
      },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#34d399",
      topColor: "rgba(52,211,153,0.4)",
      bottomColor: "rgba(52,211,153,0.02)",
      lineWidth: 2,
      priceLineColor: "#34d399",
      priceLineStyle: LineStyle.Dashed,
    });
    series.setData(seedTicks);
    chart.timeScale().scrollToRealTime();

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [seedTicks]);

  // Tick loop — uses series.update() so only the last point is recomputed.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const next = stream.next(lastTickRef.current);
      lastTickRef.current = next;
      // Recolor the line if price has rolled below open over the visible window.
      seriesRef.current?.update(next);
      onTick(next);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [running, intervalMs, stream, onTick]);

  return <div ref={containerRef} className="h-[460px] w-full" />;
}
