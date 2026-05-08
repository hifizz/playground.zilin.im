"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
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
  candlesToVolume,
  computeBollingerBands,
  computeMACD,
  generateCandles,
  makeOrderFlow,
  type Candle,
  type OrderBook,
  type Trade,
} from "@/lib/lwc-data";
import { ChartShell, palette } from "../_lwc/chart-shell";

/**
 * Lightweight Charts · Trading Terminal
 * --------------------------------------------------------------
 * Pro-style trader layout in one screen:
 *   - Left column: 3-pane chart (Candle + Bollinger Bands → Volume → MACD)
 *   - Right column: live L2 order book ladder + scrolling trade tape
 *
 * The chart and the order-flow stream are independent — the chart shows
 * historical 1D bars while the right column ticks at sub-second cadence,
 * so users can see how lightweight-charts coexists with high-frequency
 * panels driven by plain React state.
 */
export default function TradingTerminalPage() {
  const candles = useMemo(
    () => generateCandles({ count: 240, seed: 23, drift: 0.05, volatility: 1.5 }),
    [],
  );
  return (
    <ChartShell
      title="Trading Terminal"
      subtitle="完整交易终端布局：左边 lightweight-charts 三 pane（蜡烛 + 布林带 / 成交量 / MACD），右边实时 L2 订单簿 + 成交流水。"
      side={
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] tracking-widest text-emerald-300">
          ● LIVE · L2
        </span>
      }
      className="bg-neutral-950/70"
    >
      <Header candles={candles} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="border-b lg:border-b-0 lg:border-r border-neutral-800/80 px-2 py-2 md:px-3">
          <ChartArea candles={candles} />
        </div>
        <OrderFlowPanel />
      </div>
    </ChartShell>
  );
}

function Header({ candles }: { candles: Candle[] }) {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = last.close - prev.close;
  const pct = (change / prev.close) * 100;
  const up = change >= 0;
  return (
    <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            <span className="font-semibold text-neutral-300">SYNTH-PERP</span>
            <span>·</span>
            <span>USDT</span>
            <span>·</span>
            <span>1D</span>
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
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill label="BB(20,2)" tone="violet" />
          <Pill label="VOL" tone="neutral" />
          <Pill label="MACD(12,26,9)" tone="amber" />
        </div>
      </div>
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "violet" | "amber" | "neutral";
}) {
  const cls =
    tone === "violet"
      ? "border-violet-500/40 text-violet-300 bg-violet-500/5"
      : tone === "amber"
        ? "border-amber-500/40 text-amber-300 bg-amber-500/5"
        : "border-neutral-700 text-neutral-300 bg-neutral-800/40";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 font-mono ${cls}`}
    >
      {label}
    </span>
  );
}

// ---------- Chart area (3 panes) -----------------------------------------

function ChartArea({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [legend, setLegend] = useState<{
    candle: Candle;
    bbUpper?: number;
    bbLower?: number;
    macd?: number;
    signal?: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily: "ui-monospace, monospace",
        panes: {
          separatorColor: palette.border,
          separatorHoverColor: "rgba(255,255,255,0.1)",
        },
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: { borderColor: "transparent" },
      timeScale: { borderColor: "transparent" },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.18)" },
        horzLine: { color: "rgba(255,255,255,0.18)" },
      },
    });

    // Pane 0 — candles + Bollinger Bands.
    const priceSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: palette.up,
        downColor: palette.down,
        borderVisible: false,
        wickUpColor: palette.up,
        wickDownColor: palette.down,
      },
      0,
    );
    priceSeries.setData(candles);

    const bb = computeBollingerBands(candles, 20, 2);
    const upperSeries = chart.addSeries(
      LineSeries,
      {
        color: "rgba(167,139,250,0.85)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      },
      0,
    );
    upperSeries.setData(bb.upper);

    const middleSeries = chart.addSeries(
      LineSeries,
      {
        color: "rgba(167,139,250,0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      },
      0,
    );
    middleSeries.setData(bb.middle);

    const lowerSeries = chart.addSeries(
      LineSeries,
      {
        color: "rgba(167,139,250,0.85)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      },
      0,
    );
    lowerSeries.setData(bb.lower);

    // Pane 1 — Volume.
    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceLineVisible: false,
      },
      1,
    );
    volumeSeries.setData(candlesToVolume(candles));

    // Pane 2 — MACD (line + signal + histogram).
    const macd = computeMACD(candles, 12, 26, 9);
    const macdHist = chart.addSeries(
      HistogramSeries,
      { priceLineVisible: false, base: 0 },
      2,
    );
    macdHist.setData(macd.hist);

    const macdLine = chart.addSeries(
      LineSeries,
      {
        color: "#f59e0b",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      },
      2,
    );
    macdLine.setData(macd.macd);

    const macdSignal = chart.addSeries(
      LineSeries,
      {
        color: "#60a5fa",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      },
      2,
    );
    macdSignal.setData(macd.signal);

    // Pane heights — price gets the lion's share.
    const panes = chart.panes();
    if (panes[0]) panes[0].setHeight(360);
    if (panes[1]) panes[1].setHeight(110);
    if (panes[2]) panes[2].setHeight(140);

    chart.timeScale().fitContent();

    const onMove = (param: MouseEventParams<Time>) => {
      if (!param.time) {
        setLegend(null);
        return;
      }
      const c = candles.find((x) => x.time === param.time);
      if (!c) return;
      const upper = bb.upper.find((x) => x.time === param.time)?.value;
      const lower = bb.lower.find((x) => x.time === param.time)?.value;
      const m = macd.macd.find((x) => x.time === param.time)?.value;
      const s = macd.signal.find((x) => x.time === param.time)?.value;
      setLegend({
        candle: c,
        bbUpper: upper,
        bbLower: lower,
        macd: m,
        signal: s,
      });
    };
    chart.subscribeCrosshairMove(onMove);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[640px] w-full" />
      {legend && <ChartLegend legend={legend} />}
    </div>
  );
}

function ChartLegend({
  legend,
}: {
  legend: NonNullable<{
    candle: Candle;
    bbUpper?: number;
    bbLower?: number;
    macd?: number;
    signal?: number;
  }>;
}) {
  const c = legend.candle;
  const up = c.close >= c.open;
  return (
    <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap gap-x-3 gap-y-0.5 rounded-md border border-neutral-800/80 bg-neutral-950/85 px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm">
      <span className="text-neutral-500">
        O <span className="text-neutral-200">{c.open.toFixed(2)}</span>
      </span>
      <span className="text-neutral-500">
        H <span className="text-emerald-300">{c.high.toFixed(2)}</span>
      </span>
      <span className="text-neutral-500">
        L <span className="text-rose-300">{c.low.toFixed(2)}</span>
      </span>
      <span className="text-neutral-500">
        C{" "}
        <span className={up ? "text-emerald-400" : "text-rose-400"}>
          {c.close.toFixed(2)}
        </span>
      </span>
      {legend.bbUpper != null && (
        <span className="text-neutral-500">
          BB↑ <span className="text-violet-300">{legend.bbUpper.toFixed(2)}</span>
        </span>
      )}
      {legend.bbLower != null && (
        <span className="text-neutral-500">
          BB↓ <span className="text-violet-300">{legend.bbLower.toFixed(2)}</span>
        </span>
      )}
      {legend.macd != null && (
        <span className="text-neutral-500">
          MACD <span className="text-amber-300">{legend.macd.toFixed(2)}</span>
        </span>
      )}
      {legend.signal != null && (
        <span className="text-neutral-500">
          SIG <span className="text-blue-300">{legend.signal.toFixed(2)}</span>
        </span>
      )}
    </div>
  );
}

// ---------- Right column: order book + trade tape ------------------------

const TICK_MS = 350;
const MAX_TRADES = 26;

function OrderFlowPanel() {
  const flow = useMemo(() => makeOrderFlow({ seed: 47, startMid: 248.5 }), []);
  const [book, setBook] = useState<OrderBook>(() => flow.initialBook());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setBook((prev) => {
        const stepResult = flow.step(prev);
        if (stepResult.trades.length) {
          setTrades((t) =>
            [...stepResult.trades.reverse(), ...t].slice(0, MAX_TRADES),
          );
        }
        return stepResult.book;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, flow]);

  return (
    <div className="flex flex-col">
      <BookHeader running={running} onToggle={() => setRunning((v) => !v)} />
      <OrderBookView book={book} />
      <TapeHeader />
      <TradeTape trades={trades} />
    </div>
  );
}

function BookHeader({
  running,
  onToggle,
}: {
  running: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800/80 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        <span
          className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-emerald-400" : "bg-neutral-600"}`}
        />
        Order Book · L2
      </div>
      <button
        onClick={onToggle}
        className="rounded border border-neutral-700/80 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-300 transition-colors hover:border-neutral-600"
      >
        {running ? "PAUSE" : "RESUME"}
      </button>
    </div>
  );
}

function OrderBookView({ book }: { book: OrderBook }) {
  // Visible levels: 10 asks (top, reversed so the inside is closest to mid),
  // separator with last price + spread, 10 bids.
  const SHOW = 10;
  const asks = book.asks.slice(0, SHOW).reverse();
  const bids = book.bids.slice(0, SHOW);

  // Normalize sizes against the largest visible level for the depth bar.
  const maxSize = Math.max(
    ...asks.map((a) => a.size),
    ...bids.map((b) => b.size),
    1,
  );

  const spread = round2(book.asks[0].price - book.bids[0].price);
  const lastUp = book.lastSide === "buy";

  return (
    <div className="px-2 py-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-2 pb-1 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="w-14 text-right">Total</span>
      </div>

      {/* Asks (red), reversed so best ask sits just above the mid row */}
      <div>
        {asks.map((lvl, i) => (
          <BookRow
            key={`ask-${lvl.price}-${i}`}
            level={lvl}
            side="ask"
            maxSize={maxSize}
            cumSize={cumulative(asks, i)}
          />
        ))}
      </div>

      {/* Mid row */}
      <div
        className={`my-1 flex items-center justify-between rounded-md border bg-neutral-900/80 px-2 py-1.5 font-mono text-xs ${
          lastUp
            ? "border-emerald-500/30 text-emerald-400"
            : "border-rose-500/30 text-rose-400"
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="text-[10px]">{lastUp ? "▲" : "▼"}</span>
          <span className="font-semibold tabular-nums">
            {book.lastPrice.toFixed(2)}
          </span>
        </span>
        <span className="text-[10px] text-neutral-500">
          spread <span className="tabular-nums text-neutral-300">{spread.toFixed(2)}</span>
        </span>
      </div>

      {/* Bids (green) */}
      <div>
        {bids.map((lvl, i) => (
          <BookRow
            key={`bid-${lvl.price}-${i}`}
            level={lvl}
            side="bid"
            maxSize={maxSize}
            cumSize={cumulative(bids, i)}
          />
        ))}
      </div>
    </div>
  );
}

function cumulative(arr: { size: number }[], idx: number): number {
  let total = 0;
  for (let i = 0; i <= idx; i++) total += arr[i].size;
  return total;
}

function BookRow({
  level,
  side,
  maxSize,
  cumSize,
}: {
  level: { price: number; size: number };
  side: "ask" | "bid";
  maxSize: number;
  cumSize: number;
}) {
  const widthPct = Math.min(100, (level.size / maxSize) * 100);
  const isAsk = side === "ask";
  const fillBg = isAsk ? "rgba(239,83,80,0.16)" : "rgba(38,166,154,0.18)";
  const priceCls = isAsk ? "text-rose-400" : "text-emerald-400";
  return (
    <div className="relative grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-sm px-2 py-[3px] font-mono text-[11px]">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full rounded-sm"
        style={{ width: `${widthPct}%`, background: fillBg }}
      />
      <span className={`relative tabular-nums ${priceCls}`}>
        {level.price.toFixed(2)}
      </span>
      <span className="relative text-right tabular-nums text-neutral-200">
        {level.size}
      </span>
      <span className="relative w-14 text-right tabular-nums text-neutral-500">
        {cumSize}
      </span>
    </div>
  );
}

function TapeHeader() {
  return (
    <div className="border-y border-neutral-800/80 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
      Time · Sales
    </div>
  );
}

function TradeTape({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="px-3 py-6 text-center font-mono text-[10px] text-neutral-600">
        waiting for fills…
      </div>
    );
  }
  return (
    <div className="max-h-[260px] overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
        <span className="w-12">Time</span>
        <span className="text-right">Price</span>
        <span className="w-12 text-right">Size</span>
      </div>
      <ul className="px-2">
        {trades.map((t, i) => (
          <li
            key={t.id}
            className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-sm px-1 py-[2px] font-mono text-[11px] transition-opacity ${
              i === 0 ? "animate-tape-flash" : ""
            }`}
            style={{
              opacity: Math.max(0.35, 1 - i * 0.04),
            }}
          >
            <span className="w-12 tabular-nums text-neutral-500">
              {formatHms(t.time)}
            </span>
            <span
              className={`text-right tabular-nums ${t.side === "buy" ? "text-emerald-400" : "text-rose-400"}`}
            >
              {t.price.toFixed(2)}
            </span>
            <span
              className={`w-12 text-right tabular-nums ${t.side === "buy" ? "text-emerald-300" : "text-rose-300"}`}
            >
              {t.size}
            </span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        @keyframes tape-flash {
          0% {
            background: rgba(255, 255, 255, 0.12);
          }
          100% {
            background: transparent;
          }
        }
        .animate-tape-flash {
          animation: tape-flash 600ms ease-out;
        }
      `}</style>
    </div>
  );
}

function formatHms(ts: number): string {
  const d = new Date(ts * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
