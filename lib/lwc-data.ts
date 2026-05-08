// Shared mock-data helpers for the lightweight-charts demos.
// All series consumed by lightweight-charts use UTC business-day strings
// (`YYYY-MM-DD`) so they line up cleanly across panes / overlays.

import type { CandlestickData, HistogramData, LineData, Time, UTCTimestamp } from "lightweight-charts";

export type Candle = CandlestickData<Time> & { volume: number };

function toDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Mulberry32 — small deterministic PRNG so charts look identical between
// SSR / CSR and reload to reload (avoids hydration churn).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateCandles({
  count = 220,
  startPrice = 120,
  startDate = "2024-06-01",
  seed = 42,
  drift = 0.06,
  volatility = 1.6,
}: {
  count?: number;
  startPrice?: number;
  startDate?: string;
  seed?: number;
  drift?: number;
  volatility?: number;
} = {}): Candle[] {
  const rand = mulberry32(seed);
  const out: Candle[] = [];
  let close = startPrice;

  const start = new Date(startDate + "T00:00:00Z");
  let cursor = new Date(start);

  for (let i = 0; i < count; i++) {
    // Skip weekends so the time scale looks like a real trading week.
    while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const open = close;
    const change = (rand() - 0.5) * volatility + drift * (rand() - 0.4);
    close = Math.max(1, open + change);
    const high = Math.max(open, close) + rand() * volatility * 0.6;
    const low = Math.min(open, close) - rand() * volatility * 0.6;
    const volume = Math.round(80_000 + rand() * 320_000 + Math.abs(change) * 12_000);

    out.push({
      time: toDateStr(cursor) as Time,
      open: round2(open),
      high: round2(high),
      low: round2(Math.max(0.5, low)),
      close: round2(close),
      volume,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function candlesToVolume(
  candles: Candle[],
  upColor = "rgba(38, 166, 154, 0.55)",
  downColor = "rgba(239, 83, 80, 0.55)",
): HistogramData<Time>[] {
  return candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? upColor : downColor,
  }));
}

export function candlesToLine(candles: Candle[]): LineData<Time>[] {
  return candles.map((c) => ({ time: c.time, value: c.close }));
}

// Intraday tick stream for the live demo. Returns a generator-like helper
// that emits a new tick every call; deterministic so it doesn't lag in dev.
export type Tick = { time: UTCTimestamp; value: number };

export function makeTickStream(seed = 7, startPrice = 248): {
  seed: (count: number, fromMsAgo: number) => Tick[];
  next: (last: Tick) => Tick;
} {
  const rand = mulberry32(seed);

  const next = (last: Tick): Tick => {
    const drift = (rand() - 0.49) * 0.6;
    const value = Math.max(0.5, last.value + drift);
    return {
      time: ((last.time as number) + 1) as UTCTimestamp,
      value: round2(value),
    };
  };

  const seedFn = (count: number, fromMsAgo: number): Tick[] => {
    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = nowSec - Math.floor(fromMsAgo / 1000);
    const ticks: Tick[] = [];
    let value = startPrice;
    for (let i = 0; i < count; i++) {
      value = Math.max(0.5, value + (rand() - 0.49) * 0.6);
      ticks.push({
        time: (startSec + i) as UTCTimestamp,
        value: round2(value),
      });
    }
    return ticks;
  };

  return { seed: seedFn, next };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Bollinger Bands -------------------------------------------------------
// Returns three aligned series (upper / middle / lower). Period < window points
// are dropped so the bands attach where they're meaningful.
export function computeBollingerBands(
  candles: Candle[],
  period = 20,
  k = 2,
): {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
} {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const mean =
      window.reduce((s, c) => s + c.close, 0) / period;
    const variance =
      window.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    middle.push({ time: t, value: round2(mean) });
    upper.push({ time: t, value: round2(mean + k * sd) });
    lower.push({ time: t, value: round2(mean - k * sd) });
  }
  return { upper, middle, lower };
}

// --- MACD -----------------------------------------------------------------
// Standard 12/26/9 setup. Returns macd line, signal line, histogram values.
export function computeMACD(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signal = 9,
): {
  macd: LineData<Time>[];
  signal: LineData<Time>[];
  hist: HistogramData<Time>[];
} {
  const closes = candles.map((c) => c.close);
  const fastEMA = ema(closes, fast);
  const slowEMA = ema(closes, slow);

  const macdRaw: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] == null || slowEMA[i] == null) {
      macdRaw.push(NaN);
    } else {
      macdRaw.push(fastEMA[i]! - slowEMA[i]!);
    }
  }

  const signalEMA = ema(
    macdRaw.map((v) => (Number.isNaN(v) ? 0 : v)),
    signal,
  );

  const macdLine: LineData<Time>[] = [];
  const signalLine: LineData<Time>[] = [];
  const hist: HistogramData<Time>[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (Number.isNaN(macdRaw[i]) || signalEMA[i] == null) continue;
    const t = candles[i].time;
    const m = round2(macdRaw[i]);
    const s = round2(signalEMA[i]!);
    const h = round2(m - s);
    macdLine.push({ time: t, value: m });
    signalLine.push({ time: t, value: s });
    hist.push({
      time: t,
      value: h,
      color:
        h >= 0 ? "rgba(38,166,154,0.7)" : "rgba(239,83,80,0.7)",
    });
  }
  return { macd: macdLine, signal: signalLine, hist };
}

function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev == null) {
      const seed =
        values.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) /
        period;
      prev = seed;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

// --- Order book + trade tape ---------------------------------------------
// Synthetic L2 book around a moving mid price. The shape (size distribution
// across levels) is meant to *look* like a real book rather than be
// statistically faithful — mass concentrates near the spread, drops off
// further out, with random whales scattered at deeper levels.

export type BookLevel = { price: number; size: number };
export type OrderBook = {
  bids: BookLevel[]; // index 0 = best bid (closest to mid)
  asks: BookLevel[]; // index 0 = best ask
  mid: number;
  lastPrice: number;
  lastSide: "buy" | "sell";
};

export type Trade = {
  id: number;
  time: number; // unix seconds
  price: number;
  size: number;
  side: "buy" | "sell";
};

export function makeOrderFlow({
  seed = 91,
  startMid = 248.5,
  tickSize = 0.05,
  levels = 14,
}: {
  seed?: number;
  startMid?: number;
  tickSize?: number;
  levels?: number;
} = {}): {
  initialBook: () => OrderBook;
  step: (prev: OrderBook) => { book: OrderBook; trades: Trade[] };
} {
  const rand = mulberry32(seed);
  let nextTradeId = 1;

  function snapToTick(price: number): number {
    return Math.round(price / tickSize) * tickSize;
  }

  function buildLevels(mid: number, side: "bid" | "ask"): BookLevel[] {
    const out: BookLevel[] = [];
    const dir = side === "bid" ? -1 : 1;
    for (let i = 1; i <= levels; i++) {
      const price = round2(snapToTick(mid + dir * i * tickSize));
      // size shape: heavy near the top, with occasional whales further down
      const baseSize = Math.max(1, 28 - i * 1.4) + rand() * 12;
      const whale = rand() > 0.92 ? 80 + rand() * 200 : 0;
      out.push({ price, size: Math.round(baseSize + whale) });
    }
    return out;
  }

  function initialBook(): OrderBook {
    return {
      bids: buildLevels(startMid, "bid"),
      asks: buildLevels(startMid, "ask"),
      mid: startMid,
      lastPrice: startMid,
      lastSide: rand() > 0.5 ? "buy" : "sell",
    };
  }

  function step(prev: OrderBook): { book: OrderBook; trades: Trade[] } {
    // Random walk on mid (small) — periodically drifts so the book scrolls.
    const drift = (rand() - 0.5) * tickSize * 1.8;
    const newMid = round2(snapToTick(prev.mid + drift));

    // Mutate sizes — bumps at random levels, occasional level wipes (=fills).
    const mutate = (arr: BookLevel[]): BookLevel[] =>
      arr.map((lv) => {
        const r = rand();
        if (r < 0.05) return { ...lv, size: Math.round(2 + rand() * 12) };
        if (r < 0.18) return { ...lv, size: Math.round(lv.size * (0.5 + rand())) };
        return lv;
      });

    let bids = mutate(prev.bids);
    let asks = mutate(prev.asks);

    // Re-anchor levels to the new mid if mid moved by >= 1 tick.
    if (newMid !== prev.mid) {
      bids = buildLevels(newMid, "bid");
      asks = buildLevels(newMid, "ask");
    }

    // Generate 0–4 trades this tick. Each trade hits the inside of one side.
    const tradeCount = Math.floor(rand() * 4);
    const trades: Trade[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    let lastPrice = prev.lastPrice;
    let lastSide: "buy" | "sell" = prev.lastSide;

    for (let i = 0; i < tradeCount; i++) {
      const isBuy = rand() > 0.5;
      const side: "buy" | "sell" = isBuy ? "buy" : "sell";
      const lvl = isBuy ? asks[0] : bids[0];
      if (!lvl) break;
      const fillSize = Math.max(1, Math.round(rand() * 18 + 1));
      const trade: Trade = {
        id: nextTradeId++,
        time: nowSec,
        price: lvl.price,
        size: fillSize,
        side,
      };
      trades.push(trade);
      lastPrice = lvl.price;
      lastSide = side;
    }

    return {
      book: {
        bids,
        asks,
        mid: newMid,
        lastPrice,
        lastSide,
      },
      trades,
    };
  }

  return { initialBook, step };
}
