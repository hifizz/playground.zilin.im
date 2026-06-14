"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  AreaSeries,
  Area,
  Line,
  PointSeries,
  Gradient,
  GradientStop,
  GridlineSeries,
  Gridline,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearYAxisTickLabel,
  LinearValueMarker,
  TooltipArea,
  ChartTooltip,
} from "reaviz";
import { ChartShell } from "../_lwc/chart-shell";
import {
  STRATEGIES,
  payoffAt,
  type Leg,
  type StrategyKey,
} from "../_reaviz/data";

const SPOT = 180; // pretend underlying

export default function ReavizOptionsPayoffPage() {
  const [strategyKey, setStrategyKey] = useState<StrategyKey>("long-call");
  const strategy = STRATEGIES.find((s) => s.key === strategyKey)!;
  const baseLegs = useMemo(() => strategy.legs(SPOT), [strategy]);
  const [legs, setLegs] = useState<Leg[]>(baseLegs);

  // reset legs when strategy changes
  const pickStrategy = (k: StrategyKey) => {
    setStrategyKey(k);
    const def = STRATEGIES.find((s) => s.key === k)!;
    setLegs(def.legs(SPOT));
  };

  const { curve, breakevens, minProfit, maxProfit } = useMemo(
    () => computeCurve(legs),
    [legs],
  );

  const strikeMarkers = useMemo(() => {
    const seen = new Set<number>();
    return legs
      .filter((l) => l.strike > 0)
      .filter((l) => {
        if (seen.has(l.strike)) return false;
        seen.add(l.strike);
        return true;
      });
  }, [legs]);

  return (
    <ChartShell
      title="Reaviz · 期权收益曲线"
      badge={
        <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-violet-300">
          reaviz · AreaChart
        </span>
      }
      subtitle="到期日 P&L 曲线：可视化常见策略在不同标的价格下的盈亏。改变行权价 / 权利金，曲线、盈亏平衡点和最大盈亏即时更新。"
    >
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        {/* sidebar */}
        <aside className="border-b border-neutral-800/80 bg-neutral-950/40 p-4 md:border-b-0 md:border-r">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Strategy
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {STRATEGIES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => pickStrategy(s.key)}
                className={
                  "rounded-md border px-2.5 py-2 text-left text-[12px] transition-colors " +
                  (strategyKey === s.key
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                    : "border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">
            {strategy.blurb}
          </p>

          <div className="mt-5 mb-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Legs
          </div>
          <div className="space-y-2">
            {legs.map((leg, i) => (
              <LegEditor
                key={i}
                leg={leg}
                onChange={(patch) =>
                  setLegs((prev) =>
                    prev.map((l, j) => (i === j ? { ...l, ...patch } : l)),
                  )
                }
              />
            ))}
          </div>
        </aside>

        {/* main */}
        <div className="flex flex-col">
          <div className="border-b border-neutral-800/80 px-5 py-4 md:px-6">
            <Summary
              spot={SPOT}
              breakevens={breakevens}
              minProfit={minProfit}
              maxProfit={maxProfit}
            />
          </div>
          <div className="h-[420px] p-3 md:p-5">
            <PayoffChart
              data={curve}
              breakevens={breakevens}
              strikes={strikeMarkers.map((l) => l.strike)}
              spot={SPOT}
            />
          </div>
        </div>
      </div>
    </ChartShell>
  );
}

// ---------- chart ----------

type CurvePoint = { key: number; data: number };

function PayoffChart({
  data,
  breakevens,
  strikes,
  spot,
}: {
  data: CurvePoint[];
  breakevens: number[];
  strikes: number[];
  spot: number;
}) {
  const ymin = Math.min(...data.map((d) => d.data));
  const ymax = Math.max(...data.map((d) => d.data));
  // distance from zero — use a symmetric gradient that visually splits +/-.
  const total = Math.max(Math.abs(ymin), Math.abs(ymax)) * 2;
  const zeroPct = ((ymax / total) * 100).toFixed(1);

  return (
    <AreaChart
      id="reaviz-options-payoff"
      data={data as never}
      gridlines={
        <GridlineSeries
          line={<Gridline strokeColor="rgba(255,255,255,0.05)" />}
        />
      }
      xAxis={
        <LinearXAxis
          type="value"
          tickSeries={
            <LinearXAxisTickSeries
              label={
                <LinearXAxisTickLabel
                  padding={8}
                  format={(v: number) => `$${v.toFixed(0)}`}
                />
              }
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
                  format={(v: number) =>
                    v === 0 ? "$0" : `${v > 0 ? "+" : "−"}$${Math.abs(v).toFixed(0)}`
                  }
                />
              }
            />
          }
        />
      }
      series={
        <AreaSeries
          interpolation="linear"
          colorScheme={["#22c55e"]}
          valueMarkers={[
            <LinearValueMarker
              key="zero"
              value={0}
              color="rgba(255,255,255,0.35)"
            />,
            <LinearValueMarker
              key="spot"
              value={spot}
              direction="vertical"
              color="rgba(148,163,184,0.45)"
            />,
            ...strikes.map((s) => (
              <LinearValueMarker
                key={`k-${s}`}
                value={s}
                direction="vertical"
                color="rgba(139,92,246,0.5)"
              />
            )),
            ...breakevens.map((b) => (
              <LinearValueMarker
                key={`be-${b.toFixed(2)}`}
                value={b}
                direction="vertical"
                color="rgba(250,204,21,0.55)"
              />
            )),
          ]}
          area={
            <Area
              gradient={
                <Gradient
                  stops={[
                    <GradientStop key="t" offset="0%" stopOpacity={0.55} color="#22c55e" />,
                    <GradientStop key={`m1-${zeroPct}`} offset={`${zeroPct}%`} stopOpacity={0.05} color="#22c55e" />,
                    <GradientStop key={`m2-${zeroPct}`} offset={`${zeroPct}%`} stopOpacity={0.05} color="#ef4444" />,
                    <GradientStop key="b" offset="100%" stopOpacity={0.5} color="#ef4444" />,
                  ]}
                />
              }
            />
          }
          line={<Line strokeWidth={2.25} />}
          symbols={<PointSeries show="hover" />}
          tooltip={
            <TooltipArea
              tooltip={
                <ChartTooltip
                  followCursor
                  content={(d: unknown) => <PayoffTooltip data={d} />}
                />
              }
            />
          }
        />
      }
    />
  );
}

function PayoffTooltip({ data }: { data: unknown }) {
  const d = data as { x?: number; y?: number } | null;
  if (!d || d.x == null || d.y == null) return null;
  const profit = d.y;
  return (
    <div
      className="min-w-[160px] rounded-md border px-3 py-2 font-mono text-[11px]"
      style={{
        background: "rgba(13, 14, 19, 0.96)",
        borderColor: "rgba(64, 64, 64, 0.6)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
        Underlying at expiry
      </div>
      <div className="mt-0.5 text-neutral-100">${Number(d.x).toFixed(2)}</div>
      <div className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500">
        P&L
      </div>
      <div
        className={
          "mt-0.5 text-base " +
          (profit >= 0 ? "text-emerald-400" : "text-rose-400")
        }
      >
        {profit >= 0 ? "+" : "−"}${Math.abs(profit).toFixed(0)}
      </div>
    </div>
  );
}

// ---------- sidebar / summary ----------

function LegEditor({
  leg,
  onChange,
}: {
  leg: Leg;
  onChange: (patch: Partial<Leg>) => void;
}) {
  // hide synthetic long-stock leg (strike==0) controls
  if (leg.strike === 0) {
    return (
      <div className="rounded-md border border-neutral-800/60 bg-neutral-950/60 px-2.5 py-2 text-[11px] text-neutral-400">
        <span className="font-mono text-emerald-300">LONG 100 SHARES</span>
        <span className="ml-2 text-neutral-500">@ ${leg.premium.toFixed(2)}</span>
      </div>
    );
  }
  const sideColor =
    leg.side === "long"
      ? "text-emerald-300"
      : "text-rose-300";
  return (
    <div className="rounded-md border border-neutral-800/80 bg-neutral-950/60 px-2.5 py-2">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
        <span className={sideColor}>
          {leg.side.toUpperCase()} {leg.kind.toUpperCase()}
        </span>
        <span className="text-neutral-500">×{leg.qty}</span>
      </div>
      <label className="mt-1.5 block">
        <div className="flex items-center justify-between text-[10px] text-neutral-500">
          <span>Strike</span>
          <span className="font-mono text-neutral-300">
            ${leg.strike.toFixed(0)}
          </span>
        </div>
        <input
          type="range"
          min={Math.round(SPOT * 0.7)}
          max={Math.round(SPOT * 1.3)}
          step={1}
          value={leg.strike}
          onChange={(e) => onChange({ strike: Number(e.target.value) })}
          className="mt-1 w-full accent-violet-500"
        />
      </label>
      <label className="mt-1.5 block">
        <div className="flex items-center justify-between text-[10px] text-neutral-500">
          <span>Premium</span>
          <span className="font-mono text-neutral-300">
            ${leg.premium.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={Math.max(8, leg.premium * 2)}
          step={0.05}
          value={leg.premium}
          onChange={(e) => onChange({ premium: Number(e.target.value) })}
          className="mt-1 w-full accent-violet-500"
        />
      </label>
    </div>
  );
}

function Summary({
  spot,
  breakevens,
  minProfit,
  maxProfit,
}: {
  spot: number;
  breakevens: number[];
  minProfit: number;
  maxProfit: number;
}) {
  const fmt = (n: number) =>
    !isFinite(n)
      ? "∞"
      : (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toFixed(0);

  return (
    <div className="flex flex-wrap items-end gap-x-7 gap-y-3 font-mono">
      <Stat label="Spot" value={`$${spot.toFixed(2)}`} />
      <Stat
        label="Breakeven"
        value={
          breakevens.length
            ? breakevens.map((b) => `$${b.toFixed(2)}`).join(" / ")
            : "—"
        }
      />
      <Stat
        label="Max Profit"
        value={fmt(maxProfit)}
        tone={maxProfit > 0 ? "good" : maxProfit < 0 ? "bad" : "muted"}
      />
      <Stat
        label="Max Loss"
        value={fmt(minProfit)}
        tone={minProfit >= 0 ? "good" : "bad"}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "muted";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "muted"
          ? "text-neutral-500"
          : "text-neutral-100";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </div>
      <div className={"mt-0.5 text-lg tabular-nums " + color}>{value}</div>
    </div>
  );
}

// ---------- compute ----------

function computeCurve(legs: Leg[]) {
  const lo = SPOT * 0.6;
  const hi = SPOT * 1.4;
  const steps = 120;
  const dx = (hi - lo) / steps;
  const curve: CurvePoint[] = [];
  let minProfit = Infinity;
  let maxProfit = -Infinity;
  const breakevens: number[] = [];
  let prev: CurvePoint | null = null;

  for (let i = 0; i <= steps; i++) {
    const S = +(lo + i * dx).toFixed(2);
    const y = +payoffAt(S, legs).toFixed(2);
    const p: CurvePoint = { key: S, data: y };
    curve.push(p);
    if (y < minProfit) minProfit = y;
    if (y > maxProfit) maxProfit = y;
    if (prev && prev.data === 0) {
      // already a breakeven exactly
      breakevens.push(prev.key);
    } else if (prev && prev.data * y < 0) {
      // linear interp to zero
      const t = prev.data / (prev.data - y);
      const x = prev.key + t * (p.key - prev.key);
      breakevens.push(+x.toFixed(2));
    }
    prev = p;
  }

  // dedupe nearby
  const unique = breakevens.filter(
    (b, i, arr) => i === 0 || Math.abs(b - arr[i - 1]) > 0.5,
  );

  return { curve, breakevens: unique, minProfit, maxProfit };
}
