"use client";

import { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { MoreHorizontal } from "lucide-react";
import * as D from "./data";

// ---------------------------------------------------------------------------
// shared chrome
// ---------------------------------------------------------------------------

const GRID = "rgba(255,255,255,0.05)";
const TICK = { fill: "#565b68", fontSize: 10 } as const;
const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: TICK,
} as const;

type ChartCategory =
  | "Area"
  | "Bar"
  | "Line"
  | "Donut"
  | "Radial"
  | "Stacked"
  | "Combo"
  | "Spark"
  | "Progress";

export type ChartEntry = {
  /** mebius registry id, e.g. charts-cash-flow-area */
  id: string;
  title: string;
  subtitle: string;
  categories: ChartCategory[];
  accent: string;
  Component: React.FC;
};

function Card({
  id,
  title,
  subtitle,
  accent,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#14151d] to-[#0e0f15] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_48px_-28px_rgba(0,0,0,0.9)] transition-colors duration-200 hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent, boxShadow: `0 0 10px ${accent}80` }}
          />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-100">
              {title}
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">
              {subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="More"
          className="shrink-0 rounded-full border border-white/[0.07] p-1.5 text-neutral-600 transition-colors hover:border-white/20 hover:text-neutral-300"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>

      {children}

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 font-mono text-[9px] tracking-wider text-neutral-600">
        <span>{id}</span>
        <span>recharts · fake data</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

function Delta({ v, suffix = "%" }: { v: number; suffix?: string }) {
  const up = v >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
        up
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-rose-500/10 text-rose-400"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(v).toFixed(1)}
      {suffix}
    </span>
  );
}

function LegendRow({
  items,
}: {
  items: { name: string; color: string; extra?: string }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span
          key={it.name}
          className="flex items-center gap-1.5 text-[11px] text-neutral-400"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: it.color }}
          />
          {it.name}
          {it.extra && (
            <span className="font-mono text-neutral-500 tabular-nums">
              {it.extra}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

type TipPayload = ReadonlyArray<{
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  fill?: string;
  payload?: { fill?: string };
}>;

function Tip({
  active,
  payload,
  label,
  fmt = (v: number) => v.toLocaleString("en-US"),
}: {
  active?: boolean;
  payload?: TipPayload;
  label?: string | number;
  fmt?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[120px] rounded-lg border border-white/10 bg-[#16171f]/95 px-3 py-2 text-[11px] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur">
      {label !== undefined && label !== "" && (
        <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: p.color ?? p.fill ?? p.payload?.fill ?? "#94a3b8",
                }}
              />
              {p.name ?? String(p.dataKey ?? "")}
            </span>
            <span className="font-mono text-neutral-100 tabular-nums">
              {fmt(Number(p.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const usd0 = (v: number) => D.fmtUsd(v, 0);

// ---------------------------------------------------------------------------
// 1. Cash Flow — two area walks, dashed grid, right axis (mirrors preview)
// ---------------------------------------------------------------------------

const cashFlow = D.cashFlowData();

function CashFlowArea() {
  const uid = useId().replace(/:/g, "");
  return (
    <Card
      id="charts-cash-flow-area"
      title="Cash Flow"
      subtitle="Money moving in and out across all accounts"
      accent="#2e7df6"
    >
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">
            Total cash flow
          </div>
          <div className="mt-0.5 text-xl font-semibold text-neutral-50 tabular-nums">
            $14,345.09
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">
            vs last month
          </div>
          <div className="mt-0.5 text-xl font-semibold text-emerald-400 tabular-nums">
            +$2,456.00
          </div>
        </div>
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashFlow} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${uid}-now`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e7df6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2e7df6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} />
            <YAxis
              {...AXIS_PROPS}
              orientation="right"
              tickFormatter={D.fmtK}
              domain={["dataMin - 3000", "dataMax + 3000"]}
              width={44}
            />
            <Tooltip content={<Tip fmt={usd0} />} cursor={{ stroke: "#2e7df6", strokeDasharray: "4 4" }} />
            <Area
              dataKey="prev"
              name="Last year"
              stroke="#5c5f6a"
              strokeWidth={1.5}
              fill="#5c5f6a"
              fillOpacity={0}
              dot={false}
            />
            <Area
              dataKey="now"
              name="This year"
              stroke="#2e7df6"
              strokeWidth={2}
              fill={`url(#${uid}-now)`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Total Value — KPI + sparkline
// ---------------------------------------------------------------------------

const totalValue = D.walk(5, 42, 112000, 0.004, 0.02).map((v, i) => ({ i, v }));

function TotalValue() {
  const uid = useId().replace(/:/g, "");
  const first = totalValue[0].v;
  const last = totalValue.at(-1)!.v;
  return (
    <Card
      id="charts-total-value"
      title="Total Value"
      subtitle="All connected accounts, converted to USD"
      accent="#22c55e"
    >
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-neutral-50 tabular-nums">
          {D.fmtUsd(last, 2)}
        </div>
        <Delta v={((last - first) / first) * 100} />
      </div>
      <div className="mt-3 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={totalValue} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<Tip fmt={usd0} />} cursor={false} />
            <Area
              dataKey="v"
              name="Value"
              type="monotone"
              stroke="#22c55e"
              strokeWidth={1.8}
              fill={`url(#${uid}-g)`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">
        vs {D.fmtUsd(first, 0)} at period start
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Budget — waffle grid of spent/limit cells (mirrors preview)
// ---------------------------------------------------------------------------

function Budget() {
  const SPENT = 1657;
  const LIMIT = 5000;
  const CELLS = 52;
  const filled = Math.round((SPENT / LIMIT) * CELLS);
  return (
    <Card
      id="charts-budget"
      title="Budget"
      subtitle="Monthly spending limit across categories"
      accent="#f97316"
    >
      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-sm text-neutral-400">
          Spent ·{" "}
          <span className="text-base font-semibold text-neutral-100 tabular-nums">
            {D.fmtUsd(SPENT)}
          </span>
        </div>
        <div className="text-sm text-neutral-400">
          Limit ·{" "}
          <span className="text-base font-semibold text-neutral-100 tabular-nums">
            {D.fmtUsd(LIMIT)}
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(26,minmax(0,1fr))] gap-[5px]">
        {Array.from({ length: CELLS }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[3px] transition-colors"
            style={{
              background:
                i < filled ? "#f97316" : "rgba(255,255,255,0.07)",
              boxShadow:
                i < filled ? "0 0 6px rgba(249,115,22,0.35)" : undefined,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-[11px] leading-snug text-neutral-400">
          You&apos;re well within your limit
          <br />
          <span className="text-neutral-200 tabular-nums">
            {D.fmtUsd(LIMIT - SPENT)} left to spend
          </span>
        </div>
        <button
          type="button"
          className="rounded-full bg-gradient-to-b from-[#fb923c] to-[#ea580c] px-4 py-1.5 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-6px_rgba(249,115,22,0.6)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          Details
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Budget Overview — radial progress ring + category bars
// ---------------------------------------------------------------------------

const BUDGET_ROWS = [
  { name: "Housing", pct: 82, color: "#2e7df6" },
  { name: "Food", pct: 61, color: "#a855f7" },
  { name: "Fun", pct: 34, color: "#f59e0b" },
];

function BudgetOverview() {
  const used = 76;
  return (
    <Card
      id="charts-budget-overview"
      title="Budget Overview"
      subtitle="How much of October's budget is used"
      accent="#22d3ee"
    >
      <div className="mt-3 flex items-center gap-5">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={[{ name: "used", v: used, fill: "#22d3ee" }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                dataKey="v"
                cornerRadius={99}
                background={{ fill: "rgba(255,255,255,0.06)" }}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-50 tabular-nums">
              {used}%
            </span>
            <span className="text-[9px] uppercase tracking-widest text-neutral-500">
              used
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {BUDGET_ROWS.map((r) => (
            <div key={r.name}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">{r.name}</span>
                <span className="font-mono text-neutral-300 tabular-nums">
                  {r.pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.pct}%`,
                    background: r.color,
                    boxShadow: `0 0 8px ${r.color}60`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 5. Portfolio Allocation — donut (mirrors preview palette)
// ---------------------------------------------------------------------------

function PortfolioAllocation() {
  return (
    <Card
      id="charts-portfolio-allocation"
      title="Portfolio Allocation"
      subtitle="Track your spending pattern and stay in control"
      accent="#2e7df6"
    >
      <div className="relative mx-auto mt-2 h-52 max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<Tip fmt={(v) => `${v}%`} />} />
            <Pie
              data={D.ALLOCATION}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="94%"
              paddingAngle={3}
              cornerRadius={8}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {D.ALLOCATION.map((a) => (
                <Cell key={a.name} fill={a.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase tracking-widest text-neutral-500">
            Total
          </span>
          <span className="text-xl font-semibold text-neutral-50 tabular-nums">
            $84.2k
          </span>
        </div>
      </div>
      <LegendRow
        items={D.ALLOCATION.map((a) => ({
          name: a.name,
          color: a.color,
          extra: `${a.value}%`,
        }))}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 6. Spending Overview — daily bars w/ average reference
// ---------------------------------------------------------------------------

const spending = D.spendingData();
const spendingAvg = Math.round(
  spending.reduce((s, r) => s + r.v, 0) / spending.length,
);

function SpendingOverview() {
  return (
    <Card
      id="charts-spending-overview-range"
      title="Spending Overview"
      subtitle="Daily outflow for the last two weeks"
      accent="#a855f7"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          {D.fmtUsd(spendingAvg)}
          <span className="ml-1 text-xs font-normal text-neutral-500">
            avg / day
          </span>
        </div>
        <Delta v={-8.2} />
      </div>
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spending} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="d" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis {...AXIS_PROPS} tickFormatter={usd0} width={38} />
            <Tooltip
              content={<Tip fmt={usd0} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <ReferenceLine
              y={spendingAvg}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
            <Bar
              dataKey="v"
              name="Spent"
              radius={[4, 4, 4, 4]}
              background={{ fill: "rgba(255,255,255,0.04)", radius: 4 }}
            >
              {spending.map((r, i) => (
                <Cell
                  key={i}
                  fill={i % 7 === 5 || i % 7 === 6 ? "#a855f7" : "#5b4bb8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">
        Brighter bars are weekends — where overspending happens.
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 7. Sales Target — monthly bars vs target line
// ---------------------------------------------------------------------------

const sales = D.salesData();
const salesTotal = sales.reduce((s, r) => s + r.v, 0);

function SalesTarget() {
  return (
    <Card
      id="charts-sales-target"
      title="Sales Target"
      subtitle="Monthly sales against the $40K target"
      accent="#22c55e"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          ${salesTotal.toFixed(0)}K
          <span className="ml-1 text-xs font-normal text-neutral-500">
            of ${(D.SALES_TARGET * 12).toFixed(0)}K
          </span>
        </div>
        <Delta v={(salesTotal / (D.SALES_TARGET * 12)) * 100 - 100} />
      </div>
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sales} margin={{ top: 12, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis
              {...AXIS_PROPS}
              tickFormatter={(v: number) => `$${v}K`}
              width={36}
            />
            <Tooltip
              content={<Tip fmt={(v) => `$${v}K`} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <ReferenceLine
              y={D.SALES_TARGET}
              stroke="#22c55e"
              strokeDasharray="5 4"
              label={{
                value: "target",
                position: "insideTopRight",
                fill: "#22c55e",
                fontSize: 9,
              }}
            />
            <Bar
              dataKey="v"
              name="Sales"
              radius={[4, 4, 4, 4]}
              background={{ fill: "rgba(255,255,255,0.04)", radius: 4 }}
            >
              {sales.map((r, i) => (
                <Cell
                  key={i}
                  fill={r.v >= D.SALES_TARGET ? "#22c55e" : "#3f4552"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">
        Green months cleared the {D.SALES_TARGET}K target.
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 8. Revenue Growth — two smooth lines YoY
// ---------------------------------------------------------------------------

const revenue = D.revenueGrowthData();

function RevenueGrowth() {
  const last = revenue.at(-1)!;
  const yoy = ((last.y25 - last.y24) / last.y24) * 100;
  return (
    <Card
      id="charts-revenue-growth"
      title="Revenue Growth"
      subtitle="This year vs last year, in $K MRR"
      accent="#22d3ee"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          ${last.y25.toFixed(1)}K
        </div>
        <Delta v={yoy} suffix="% YoY" />
      </div>
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenue} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis
              {...AXIS_PROPS}
              tickFormatter={(v: number) => `$${Math.round(v)}K`}
              tickCount={4}
              width={40}
              domain={["dataMin - 8", "dataMax + 8"]}
            />
            <Tooltip
              content={<Tip fmt={(v) => `$${v.toFixed(1)}K`} />}
              cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "4 4" }}
            />
            <Line
              dataKey="y24"
              name="2024"
              type="monotone"
              stroke="#565b68"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              dataKey="y25"
              name="2025"
              type="monotone"
              stroke="#22d3ee"
              strokeWidth={2.2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { name: "2025", color: "#22d3ee" },
          { name: "2024", color: "#565b68" },
        ]}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 9. Ethereum — dense volatile crypto area
// ---------------------------------------------------------------------------

const eth = D.ethData();

function Ethereum() {
  const uid = useId().replace(/:/g, "");
  const last = eth.at(-1)!.p;
  const first = eth[0].p;
  const hi = Math.max(...eth.map((e) => e.p));
  const lo = Math.min(...eth.map((e) => e.p));
  return (
    <Card
      id="charts-ethereum"
      title="Ethereum"
      subtitle="ETH / USD · 24h rolling window"
      accent="#a78bfa"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-2xl font-semibold text-neutral-50 tabular-nums">
          {D.fmtUsd(last, 2)}
        </div>
        <Delta v={((last - first) / first) * 100} />
      </div>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={eth} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${uid}-eth`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <YAxis
              {...AXIS_PROPS}
              hide
              domain={["dataMin - 60", "dataMax + 60"]}
            />
            <Tooltip
              content={<Tip fmt={(v) => D.fmtUsd(v, 2)} />}
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
            />
            <Area
              dataKey="p"
              name="ETH"
              stroke="#a78bfa"
              strokeWidth={1.8}
              fill={`url(#${uid}-eth)`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3">
        {[
          ["24h High", D.fmtUsd(hi, 0)],
          ["24h Low", D.fmtUsd(lo, 0)],
          ["Volume", "$18.4B"],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-[9px] uppercase tracking-widest text-neutral-500">
              {k}
            </div>
            <div className="mt-0.5 font-mono text-xs text-neutral-200 tabular-nums">
              {v}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 10. Net Worth — assets area vs liabilities line
// ---------------------------------------------------------------------------

const netWorth = D.netWorthData();

function NetWorth() {
  const uid = useId().replace(/:/g, "");
  const last = netWorth.at(-1)!;
  const nw = last.assets - last.liab;
  return (
    <Card
      id="charts-net-worth"
      title="Net Worth"
      subtitle="Assets minus liabilities, trailing 12 months"
      accent="#34d399"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          {D.fmtUsd(nw)}
        </div>
        <Delta v={8.2} />
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={netWorth} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis {...AXIS_PROPS} tickFormatter={D.fmtK} width={40} />
            <Tooltip content={<Tip fmt={usd0} />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
            <Area
              dataKey="assets"
              name="Assets"
              type="monotone"
              stroke="#34d399"
              strokeWidth={2}
              fill={`url(#${uid}-a)`}
              dot={false}
            />
            <Area
              dataKey="liab"
              name="Liabilities"
              type="monotone"
              stroke="#f43f5e"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="#f43f5e"
              fillOpacity={0}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { name: "Assets", color: "#34d399" },
          { name: "Liabilities", color: "#f43f5e" },
        ]}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 11. Finance Overview — stacked revenue bars
// ---------------------------------------------------------------------------

const finStack = D.financeStackData();
const STACK_KEYS = [
  { key: "products", name: "Products", color: "#2e7df6" },
  { key: "services", name: "Services", color: "#a855f7" },
  { key: "subs", name: "Subscriptions", color: "#22c55e" },
] as const;

function FinanceOverviewStacked() {
  const last = finStack.at(-1)!;
  const total = last.products + last.services + last.subs;
  return (
    <Card
      id="charts-finance-overview-stacked-bar"
      title="Finance Overview"
      subtitle="Revenue stacked by product line"
      accent="#2e7df6"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          ${total.toFixed(0)}K
          <span className="ml-1 text-xs font-normal text-neutral-500">
            in December
          </span>
        </div>
        <Delta v={11.4} />
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={finStack} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis
              {...AXIS_PROPS}
              tickFormatter={(v: number) => `$${v}K`}
              width={36}
            />
            <Tooltip
              content={<Tip fmt={(v) => `$${v}K`} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            {STACK_KEYS.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="rev"
                fill={s.color}
                radius={i === STACK_KEYS.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <LegendRow items={STACK_KEYS.map((s) => ({ name: s.name, color: s.color }))} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 12. Finance Overview — diverging income / expense bars
// ---------------------------------------------------------------------------

const diverging = D.divergingData();

function FinanceOverviewDiverging() {
  return (
    <Card
      id="charts-finance-overview-diverging-bar"
      title="Finance Overview · Diverging"
      subtitle="Income up, expenses down — net position per month"
      accent="#f43f5e"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          +$18.2K
          <span className="ml-1 text-xs font-normal text-neutral-500">
            avg net / mo
          </span>
        </div>
        <Delta v={4.6} />
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={diverging} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} stackOffset="sign">
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis
              {...AXIS_PROPS}
              tickFormatter={(v: number) =>
                v < 0 ? `-$${Math.abs(v)}K` : `$${v}K`
              }
              width={40}
            />
            <Tooltip
              content={<Tip fmt={(v) => `$${v}K`} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="income" name="Income" stackId="d" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" stackId="d" fill="#f43f5e" radius={[0, 0, 3, 3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { name: "Income", color: "#22c55e" },
          { name: "Expenses", color: "#f43f5e" },
        ]}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 13. Asset Overview — concentric radial rings
// ---------------------------------------------------------------------------

function AssetOverviewRadial() {
  return (
    <Card
      id="charts-asset-overview-radial"
      title="Asset Overview"
      subtitle="Goal progress per asset class"
      accent="#f59e0b"
    >
      <div className="relative mx-auto mt-1 h-48 max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="30%"
            outerRadius="100%"
            data={D.ASSET_RINGS}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="v"
              cornerRadius={10}
              background={{ fill: "rgba(255,255,255,0.05)" }}
              angleAxisId={0}
            />
            <Tooltip content={<Tip fmt={(v) => `${v}%`} />} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] uppercase tracking-widest text-neutral-500">
            goals
          </span>
        </div>
      </div>
      <LegendRow
        items={D.ASSET_RINGS.map((r) => ({
          name: r.name,
          color: r.fill,
          extra: `${r.v}%`,
        }))}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 14. Global Finance Market — combo volume bars + index line
// ---------------------------------------------------------------------------

const market = D.marketComboData();

function MarketCombo() {
  const last = market.at(-1)!;
  const first = market[0];
  const mtd = ((last.idx - first.idx) / first.idx) * 100;
  return (
    <Card
      id="charts-global-finance-market-combo"
      title="Global Finance Market"
      subtitle="Composite index line over traded volume"
      accent="#2e7df6"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-xl font-semibold text-neutral-50 tabular-nums">
          {last.idx.toLocaleString("en-US")}
        </div>
        <Delta v={mtd} suffix="% YTD" />
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={market} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="m" {...AXIS_PROPS} dy={6} interval={1} />
            <YAxis yAxisId="idx" hide domain={["dataMin - 300", "dataMax + 200"]} />
            <YAxis yAxisId="vol" hide domain={[0, (dataMax: number) => dataMax * 3.2]} />
            <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
            <Bar
              yAxisId="vol"
              dataKey="vol"
              name="Volume"
              fill="#3f4552"
              radius={[3, 3, 0, 0]}
              barSize={10}
            />
            <Line
              yAxisId="idx"
              dataKey="idx"
              name="Index"
              type="monotone"
              stroke="#2e7df6"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <LegendRow
        items={[
          { name: "Index", color: "#2e7df6" },
          { name: "Volume", color: "#3f4552" },
        ]}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 15. Monthly Income — mini bar sparkline
// ---------------------------------------------------------------------------

const income = D.incomeBars();

function MonthlyIncome() {
  const avg = income.reduce((s, r) => s + r.v, 0) / income.length;
  return (
    <Card
      id="charts-monthly-income"
      title="Monthly Income"
      subtitle="Salary + side income per month"
      accent="#22c55e"
    >
      <div className="mt-4 flex items-end justify-between">
        <div className="text-2xl font-semibold text-neutral-50 tabular-nums">
          ${avg.toFixed(1)}K
          <span className="ml-1 text-xs font-normal text-neutral-500">
            avg / mo
          </span>
        </div>
        <Delta v={6.1} />
      </div>
      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={income} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              content={<Tip fmt={(v) => `$${v}K`} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="v" name="Income" radius={[3, 3, 3, 3]}>
              {income.map((_, i) => (
                <Cell key={i} fill={i === income.length - 1 ? "#22c55e" : "#3f4552"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">
        Latest month highlighted — December came in strong.
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// registry
// ---------------------------------------------------------------------------

export const CHARTS: ChartEntry[] = [
  {
    id: "charts-cash-flow-area",
    title: "Cash Flow",
    subtitle: "money in and out across accounts",
    categories: ["Area"],
    accent: "#2e7df6",
    Component: CashFlowArea,
  },
  {
    id: "charts-total-value",
    title: "Total Value",
    subtitle: "kpi + sparkline",
    categories: ["Spark", "Area"],
    accent: "#22c55e",
    Component: TotalValue,
  },
  {
    id: "charts-budget",
    title: "Budget",
    subtitle: "spent vs limit waffle grid",
    categories: ["Progress"],
    accent: "#f97316",
    Component: Budget,
  },
  {
    id: "charts-budget-overview",
    title: "Budget Overview",
    subtitle: "radial usage ring + category bars",
    categories: ["Radial", "Progress"],
    accent: "#22d3ee",
    Component: BudgetOverview,
  },
  {
    id: "charts-portfolio-allocation",
    title: "Portfolio Allocation",
    subtitle: "asset mix donut",
    categories: ["Donut"],
    accent: "#2e7df6",
    Component: PortfolioAllocation,
  },
  {
    id: "charts-spending-overview-range",
    title: "Spending Overview",
    subtitle: "daily bars vs average",
    categories: ["Bar"],
    accent: "#a855f7",
    Component: SpendingOverview,
  },
  {
    id: "charts-sales-target",
    title: "Sales Target",
    subtitle: "monthly bars vs goal line",
    categories: ["Bar"],
    accent: "#22c55e",
    Component: SalesTarget,
  },
  {
    id: "charts-revenue-growth",
    title: "Revenue Growth",
    subtitle: "YoY smooth lines",
    categories: ["Line"],
    accent: "#22d3ee",
    Component: RevenueGrowth,
  },
  {
    id: "charts-ethereum",
    title: "Ethereum",
    subtitle: "dense crypto price area",
    categories: ["Area"],
    accent: "#a78bfa",
    Component: Ethereum,
  },
  {
    id: "charts-net-worth",
    title: "Net Worth",
    subtitle: "assets vs liabilities",
    categories: ["Area"],
    accent: "#34d399",
    Component: NetWorth,
  },
  {
    id: "charts-finance-overview-stacked-bar",
    title: "Finance Overview",
    subtitle: "stacked revenue lines",
    categories: ["Stacked", "Bar"],
    accent: "#2e7df6",
    Component: FinanceOverviewStacked,
  },
  {
    id: "charts-finance-overview-diverging-bar",
    title: "Finance Overview · Diverging",
    subtitle: "diverging income / expense",
    categories: ["Stacked", "Bar"],
    accent: "#f43f5e",
    Component: FinanceOverviewDiverging,
  },
  {
    id: "charts-asset-overview-radial",
    title: "Asset Overview",
    subtitle: "concentric goal rings",
    categories: ["Radial"],
    accent: "#f59e0b",
    Component: AssetOverviewRadial,
  },
  {
    id: "charts-global-finance-market-combo",
    title: "Global Finance Market",
    subtitle: "index line over volume bars",
    categories: ["Combo", "Line", "Bar"],
    accent: "#2e7df6",
    Component: MarketCombo,
  },
  {
    id: "charts-monthly-income",
    title: "Monthly Income",
    subtitle: "mini bar sparkline",
    categories: ["Spark", "Bar"],
    accent: "#22c55e",
    Component: MonthlyIncome,
  },
];

export const CATEGORIES: Array<"All" | ChartCategory> = [
  "All",
  "Area",
  "Bar",
  "Line",
  "Donut",
  "Radial",
  "Stacked",
  "Combo",
  "Spark",
  "Progress",
];
