// Seeded pseudo-random utilities + sample series builders for the reaviz demos.
// Kept in a shared module so demos don't drift in palette / data shape.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TickerSeed = {
  name: string;
  color: string;
  drift: number; // average daily % drift
  vol: number; // daily volatility
  seed: number;
};

export const TICKERS: TickerSeed[] = [
  { name: "NVDA", color: "#76b900", drift: 0.0028, vol: 0.028, seed: 31 },
  { name: "AAPL", color: "#a3a3a3", drift: 0.0009, vol: 0.014, seed: 12 },
  { name: "TSLA", color: "#e31937", drift: 0.0018, vol: 0.034, seed: 47 },
  { name: "META", color: "#1877f2", drift: 0.0014, vol: 0.020, seed: 88 },
  { name: "GOOG", color: "#fbbc04", drift: 0.0011, vol: 0.017, seed: 23 },
];

export type SeriesPoint = { key: Date; data: number };
export type MultiSeries = { key: string; data: SeriesPoint[] };

// Build normalized %-change series for N trading days starting from 0%.
export function buildNormalizedSeries(days: number): MultiSeries[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  // walk back `days` calendar days
  const dates: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    dates.push(d);
  }

  return TICKERS.map((t) => {
    const rng = mulberry32(t.seed + days);
    let price = 100;
    const series: SeriesPoint[] = [];
    dates.forEach((d, i) => {
      if (i === 0) {
        series.push({ key: d, data: 0 });
        return;
      }
      // geometric brownian-ish
      const z = (rng() + rng() + rng() + rng() - 2) / Math.sqrt(2); // approx N(0,1)
      const r = t.drift + t.vol * z;
      price = price * (1 + r);
      series.push({ key: d, data: +((price - 100)).toFixed(3) });
    });
    return { key: t.name, data: series };
  });
}

// ---------- Options payoff ----------

export type Leg = {
  kind: "call" | "put";
  side: "long" | "short";
  strike: number;
  premium: number;
  qty: number;
};

export function payoffAt(S: number, legs: Leg[]) {
  let total = 0;
  for (const leg of legs) {
    const intrinsic =
      leg.kind === "call"
        ? Math.max(S - leg.strike, 0)
        : Math.max(leg.strike - S, 0);
    const sign = leg.side === "long" ? 1 : -1;
    const cashflow = sign * (intrinsic - leg.premium) * leg.qty;
    total += cashflow;
  }
  return total * 100; // standard equity option contract multiplier
}

export type StrategyKey =
  | "long-call"
  | "long-put"
  | "covered-call"
  | "long-straddle"
  | "iron-condor"
  | "bull-call-spread";

export type StrategyDef = {
  key: StrategyKey;
  label: string;
  blurb: string;
  legs: (spot: number) => Leg[];
};

export const STRATEGIES: StrategyDef[] = [
  {
    key: "long-call",
    label: "Long Call",
    blurb: "看涨方向最直接的下注：上涨无限收益，下跌只亏权利金。",
    legs: (s) => [
      { kind: "call", side: "long", strike: Math.round(s * 1.02), premium: s * 0.025, qty: 1 },
    ],
  },
  {
    key: "long-put",
    label: "Long Put",
    blurb: "下跌方向对冲或方向性下注，下跌空间巨大上涨损失有限。",
    legs: (s) => [
      { kind: "put", side: "long", strike: Math.round(s * 0.98), premium: s * 0.022, qty: 1 },
    ],
  },
  {
    key: "covered-call",
    label: "Covered Call",
    blurb: "持有 100 股正股 + 卖出 OTM Call，收权利金，封顶上涨。",
    legs: (s) => [
      // simulate the long stock as a long forward via long call at strike 0
      { kind: "call", side: "long", strike: 0, premium: s, qty: 1 },
      { kind: "call", side: "short", strike: Math.round(s * 1.05), premium: s * 0.018, qty: 1 },
    ],
  },
  {
    key: "long-straddle",
    label: "Long Straddle",
    blurb: "买入同行权价 Call + Put，押注大波动，方向无所谓。",
    legs: (s) => {
      const k = Math.round(s);
      return [
        { kind: "call", side: "long", strike: k, premium: s * 0.022, qty: 1 },
        { kind: "put", side: "long", strike: k, premium: s * 0.022, qty: 1 },
      ];
    },
  },
  {
    key: "iron-condor",
    label: "Iron Condor",
    blurb: "Sell OTM Put Spread + Sell OTM Call Spread，押注盘整。",
    legs: (s) => [
      { kind: "put", side: "long", strike: Math.round(s * 0.90), premium: s * 0.004, qty: 1 },
      { kind: "put", side: "short", strike: Math.round(s * 0.95), premium: s * 0.012, qty: 1 },
      { kind: "call", side: "short", strike: Math.round(s * 1.05), premium: s * 0.012, qty: 1 },
      { kind: "call", side: "long", strike: Math.round(s * 1.10), premium: s * 0.004, qty: 1 },
    ],
  },
  {
    key: "bull-call-spread",
    label: "Bull Call Spread",
    blurb: "Long ATM Call + Short OTM Call，封顶但降低成本，温和看涨。",
    legs: (s) => [
      { kind: "call", side: "long", strike: Math.round(s), premium: s * 0.028, qty: 1 },
      { kind: "call", side: "short", strike: Math.round(s * 1.07), premium: s * 0.010, qty: 1 },
    ],
  },
];

// ---------- SaaS data ----------

export const SAAS_TIERS = [
  { key: "Free Trial", color: "#475569" },
  { key: "Starter", color: "#3b82f6" },
  { key: "Pro", color: "#8b5cf6" },
  { key: "Enterprise", color: "#22c55e" },
];

export function buildMrrStack() {
  // 12 months ending current
  const months: { key: string; data: { key: string; data: number }[] }[] = [];
  const rng = mulberry32(1337);
  let base = { free: 18, starter: 22, pro: 34, ent: 26 };
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const m = d.toLocaleString("en-US", { month: "short" });
    base = {
      free: base.free * (1 + (rng() - 0.4) * 0.06),
      starter: base.starter * (1 + (rng() - 0.3) * 0.05),
      pro: base.pro * (1 + (rng() - 0.2) * 0.08),
      ent: base.ent * (1 + (rng() - 0.15) * 0.07),
    };
    months.push({
      key: m,
      data: [
        { key: "Free Trial", data: Math.round(base.free) },
        { key: "Starter", data: Math.round(base.starter) },
        { key: "Pro", data: Math.round(base.pro) },
        { key: "Enterprise", data: Math.round(base.ent) },
      ],
    });
  }
  return months;
}

export function buildKpiSeries(seed: number, days = 30, start = 100, trend = 0.004, vol = 0.012) {
  const rng = mulberry32(seed);
  let v = start;
  const out: { key: Date; data: number }[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    if (i < days - 1) {
      const z = (rng() + rng() + rng() - 1.5) * 1.4;
      v = Math.max(0, v * (1 + trend + vol * z));
    }
    out.push({ key: d, data: +v.toFixed(2) });
  }
  return out;
}

export function buildFunnelData() {
  return [
    { key: "Website Visit", data: 124_300 },
    { key: "Trial Started", data: 41_200 },
    { key: "Activated", data: 18_700 },
    { key: "Paid Conversion", data: 4_950 },
    { key: "Retained 90d", data: 3_120 },
  ];
}
