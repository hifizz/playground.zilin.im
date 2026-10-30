// Deterministic fake finance data for the mebius-inspired chart gallery.
// Seeded PRNG keeps SSR/CSR output identical — no hydration mismatch.

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

// approx N(0,1) via sum of uniforms
function gauss(rng: () => number) {
  return (rng() + rng() + rng() + rng() - 2) * 1.2;
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const round = (v: number, p = 0) => +v.toFixed(p);

// ---------- random-walk helpers ----------

export function walk(
  seed: number,
  n: number,
  start: number,
  drift: number,
  vol: number,
) {
  const rng = mulberry32(seed);
  let v = start;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) v = Math.max(0, v * (1 + drift + vol * gauss(rng)));
    out.push(round(v, 2));
  }
  return out;
}

/** Weekly points labelled by month, two comparison walks (this year vs last). */
export function cashFlowData() {
  const now = walk(41, 34, 15500, 0.001, 0.055);
  const prev = walk(87, 34, 17500, -0.004, 0.06);
  const labels = ["Jan", "", "", "", "Feb", "", "", "", "Mar", "", "", "", "Apr",
    "", "", "", "May", "", "", "", "Jun", "", "", "", "Jul", "", "", "", "Aug",
    "", "", "", "", ""];
  return now.map((v, i) => ({ m: labels[i] ?? "", now: v, prev: prev[i] }));
}

/** Monthly net worth: assets area + liabilities line. */
export function netWorthData() {
  const rng = mulberry32(97);
  let assets = 208;
  let liab = 74;
  return MONTHS.map((m) => {
    assets *= 1 + 0.014 + gauss(rng) * 0.015;
    liab *= 1 - 0.006 + gauss(rng) * 0.01;
    return { m, assets: round(assets * 1000), liab: round(liab * 1000) };
  });
}

/** Ethereum-style dense volatile price walk. */
export function ethData() {
  const pts = walk(7, 96, 3120, 0.0028, 0.028);
  return pts.map((p, i) => ({ i, p }));
}

/** Portfolio allocation — mirrors the mebius preview palette. */
export const ALLOCATION = [
  { name: "Equities", value: 51, color: "#2e7df6" },
  { name: "Cash", value: 18, color: "#7fb3f9" },
  { name: "Bonds", value: 15, color: "#f97316" },
  { name: "Other", value: 16, color: "#a855f7" },
];

/** Daily spending bars for two weeks. */
export function spendingData() {
  const rng = mulberry32(55);
  return Array.from({ length: 14 }, (_, i) => {
    const weekend = i % 7 === 5 || i % 7 === 6;
    const base = weekend ? 300 : 170;
    return {
      d: WEEKDAYS[i % 7],
      v: round(base + rng() * (weekend ? 180 : 120)),
    };
  });
}

/** Monthly sales vs a fixed target. */
export const SALES_TARGET = 40;
export function salesData() {
  const rng = mulberry32(23);
  return MONTHS.map((m) => ({
    m,
    v: round(26 + rng() * 26 + (m === "Nov" || m === "Dec" ? 8 : 0), 1),
  }));
}

/** Two smoothed revenue lines, this year vs last year. */
export function revenueGrowthData() {
  const a = walk(63, 12, 58, 0.03, 0.05);
  const b = walk(29, 12, 47, 0.018, 0.05);
  return MONTHS.map((m, i) => ({ m, y25: a[i], y24: b[i] }));
}

/** Stacked monthly revenue by product line. */
export function financeStackData() {
  const rng = mulberry32(11);
  return MONTHS.map((m) => ({
    m,
    products: round(14 + rng() * 14),
    services: round(10 + rng() * 10),
    subs: round(7 + rng() * 8),
  }));
}

/** Diverging income / expense bars around zero. */
export function divergingData() {
  const rng = mulberry32(71);
  return MONTHS.map((m) => ({
    m,
    income: round(30 + rng() * 34),
    expense: round(-(18 + rng() * 30)),
  }));
}

/** Concentric radial rings for asset classes. */
export const ASSET_RINGS = [
  { name: "Stocks", v: 82, fill: "#2e7df6" },
  { name: "Crypto", v: 64, fill: "#a855f7" },
  { name: "Cash", v: 45, fill: "#f59e0b" },
];

/** Market combo: volume bars + index line. */
export function marketComboData() {
  const rng = mulberry32(31);
  let idx = 3850;
  return MONTHS.map((m) => {
    idx *= 1 + 0.008 + gauss(rng) * 0.02;
    return { m, idx: round(idx), vol: round(40 + rng() * 60) };
  });
}

/** Monthly income mini bars. */
export function incomeBars() {
  const rng = mulberry32(19);
  return MONTHS.map((m) => ({ m, v: round(6.4 + rng() * 3.4, 1) }));
}

export const fmtUsd = (v: number, p = 0) =>
  `$${v.toLocaleString("en-US", {
    minimumFractionDigits: p,
    maximumFractionDigits: p,
  })}`;

export const fmtK = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : fmtUsd(v);
