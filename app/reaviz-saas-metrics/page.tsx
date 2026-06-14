"use client";

import { useMemo } from "react";
import {
  StackedBarChart,
  StackedBarSeries,
  Bar,
  BarLabel,
  GuideBar,
  GridlineSeries,
  Gridline,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearYAxisTickLabel,
  AreaSparklineChart,
  Area,
  AreaSeries,
  Line,
  Gradient,
  GradientStop,
  FunnelChart,
  FunnelSeries,
  FunnelArc,
  FunnelAxis,
  FunnelAxisLabel,
  TooltipArea,
  ChartTooltip,
} from "reaviz";
import { ChartShell } from "../_lwc/chart-shell";
import {
  SAAS_TIERS,
  buildKpiSeries,
  buildMrrStack,
  buildFunnelData,
} from "../_reaviz/data";

const KPIS = [
  {
    label: "MRR",
    color: "#22c55e",
    seed: 3,
    start: 320, trend: 0.006, vol: 0.008,
    fmt: (v: number) => `$${(v / 10).toFixed(1)}k`,
    suffix: " /mo",
  },
  {
    label: "NRR",
    color: "#3b82f6",
    seed: 7,
    start: 108, trend: 0.0008, vol: 0.004,
    fmt: (v: number) => `${v.toFixed(1)}%`,
    suffix: "",
  },
  {
    label: "Logo Churn",
    color: "#f97316",
    seed: 11,
    start: 2.4, trend: -0.003, vol: 0.025,
    fmt: (v: number) => `${v.toFixed(2)}%`,
    suffix: "",
    invert: true,
  },
  {
    label: "MAU",
    color: "#8b5cf6",
    seed: 19,
    start: 48_000, trend: 0.005, vol: 0.012,
    fmt: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0),
    suffix: "",
  },
] as const;

export default function ReavizSaasMetricsPage() {
  const mrrStack = useMemo(() => buildMrrStack(), []);
  const funnelData = useMemo(() => buildFunnelData(), []);

  return (
    <ChartShell
      title="Reaviz · SaaS Metrics Dashboard"
      badge={
        <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-sky-300">
          reaviz · Stacked Bar · Sparkline · Funnel
        </span>
      }
      subtitle="一个典型的 SaaS 增长面板：顶部 4 个 KPI + Sparkline，中间按订阅层堆叠的 MRR，底部转化漏斗。"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-px bg-neutral-800/80 md:grid-cols-4">
        {KPIS.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            color={k.color}
            fmt={k.fmt}
            suffix={k.suffix}
            invert={(k as { invert?: boolean }).invert ?? false}
            data={buildKpiSeries(k.seed, 30, k.start, k.trend, k.vol)}
          />
        ))}
      </div>

      {/* MRR by tier */}
      <div className="border-t border-neutral-800/80 px-3 py-4 md:px-6 md:py-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Monthly Recurring Revenue
            </div>
            <div className="mt-0.5 text-lg text-neutral-100">
              ${formatTotal(mrrStack)}k
              <span className="ml-2 text-xs text-emerald-400">
                ▲ {trailingGrowth(mrrStack).toFixed(1)}% MoM
              </span>
            </div>
          </div>
          <TierLegend />
        </div>
        <div className="h-[280px]">
          <MrrStack data={mrrStack} />
        </div>
      </div>

      {/* Funnel */}
      <div className="border-t border-neutral-800/80 px-3 py-4 md:px-6 md:py-5">
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Activation Funnel · last 30d
          </div>
          <div className="mt-0.5 text-sm text-neutral-300">
            Overall conversion{" "}
            <span className="text-neutral-100">
              {(
                ((funnelData.at(-1)?.data ?? 0) /
                  (funnelData[0]?.data ?? 1)) *
                100
              ).toFixed(2)}
              %
            </span>{" "}
            <span className="text-neutral-500">
              ({funnelData[0].data.toLocaleString()} →{" "}
              {funnelData.at(-1)!.data.toLocaleString()})
            </span>
          </div>
        </div>
        <div className="h-[320px]">
          <FunnelChart
            id="reaviz-saas-funnel"
            data={funnelData}
            series={
              <FunnelSeries
                arc={
                  <FunnelArc
                    variant="layered"
                    colorScheme={["#155e75", "#0e7490", "#22d3ee"]}
                    tooltip={
                      <TooltipArea
                        tooltip={
                          <ChartTooltip
                            content={(d: unknown) => (
                              <FunnelTooltip data={d} />
                            )}
                          />
                        }
                      />
                    }
                  />
                }
                axis={
                  <FunnelAxis
                    label={<FunnelAxisLabel fill="#cbd5f5" fontSize={12} />}
                  />
                }
              />
            }
          />
        </div>
      </div>
    </ChartShell>
  );
}

// ---------- KPI card ----------

function KpiCard({
  label,
  color,
  data,
  fmt,
  suffix,
  invert,
}: {
  label: string;
  color: string;
  data: { key: Date; data: number }[];
  fmt: (v: number) => string;
  suffix: string;
  invert: boolean;
}) {
  const first = data[0]?.data ?? 0;
  const last = data.at(-1)?.data ?? 0;
  const pct = first === 0 ? 0 : ((last - first) / first) * 100;
  const positive = invert ? pct < 0 : pct > 0;
  const arrow = pct === 0 ? "—" : pct > 0 ? "▲" : "▼";

  return (
    <div className="flex flex-col bg-neutral-950/40 p-4">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
        <span>{label}</span>
        <span
          className={
            positive
              ? "text-emerald-400"
              : pct === 0
                ? "text-neutral-500"
                : "text-rose-400"
          }
        >
          {arrow} {Math.abs(pct).toFixed(2)}%
        </span>
      </div>
      <div className="mt-1 text-2xl text-neutral-100 tabular-nums">
        {fmt(last)}
        <span className="text-xs text-neutral-500">{suffix}</span>
      </div>
      <div className="mt-3 h-[44px]">
        <AreaSparklineChart
          id={`spark-${label}`}
          data={data as never}
          series={
            <AreaSeries
              interpolation="smooth"
              colorScheme={[color]}
              area={
                <Area
                  gradient={
                    <Gradient
                      stops={[
                        <GradientStop key="t" offset="0%" stopOpacity={0.55} color={color} />,
                        <GradientStop key="b" offset="100%" stopOpacity={0} color={color} />,
                      ]}
                    />
                  }
                />
              }
              line={<Line strokeWidth={1.5} />}
            />
          }
        />
      </div>
    </div>
  );
}

// ---------- MRR stacked bar ----------

function MrrStack({
  data,
}: {
  data: ReturnType<typeof buildMrrStack>;
}) {
  return (
    <StackedBarChart
      id="reaviz-mrr-stack"
      data={data as never}
      gridlines={
        <GridlineSeries
          line={<Gridline strokeColor="rgba(255,255,255,0.05)" />}
        />
      }
      xAxis={
        <LinearXAxis
          type="category"
          tickSeries={
            <LinearXAxisTickSeries
              label={<LinearXAxisTickLabel padding={8} />}
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
                  format={(v: number) => `$${v}k`}
                />
              }
            />
          }
        />
      }
      series={
        <StackedBarSeries
          colorScheme={SAAS_TIERS.map((t) => t.color)}
          bar={
            <Bar
              rx={2}
              ry={2}
              gradient={null}
              guide={<GuideBar fill="rgba(255,255,255,0.025)" />}
              label={<BarLabel fill="#e5e7eb" fontSize={10} />}
              tooltip={
                <TooltipArea
                  isContinous={false}
                  tooltip={
                    <ChartTooltip
                      content={(d: unknown) => <MrrTooltip data={d} />}
                    />
                  }
                />
              }
            />
          }
        />
      }
    />
  );
}

function MrrTooltip({ data }: { data: unknown }) {
  const d = data as {
    x?: string;
    y?: number;
    data?: { key?: string; value?: number; data?: number }[];
  } | null;
  if (!d) return null;
  const rows = d.data ?? [];
  const total = rows.reduce(
    (s, r) => s + (Number(r.value ?? r.data ?? 0)),
    0,
  );
  return (
    <div
      className="min-w-[200px] rounded-md border px-3 py-2 font-mono text-[11px]"
      style={{
        background: "rgba(13, 14, 19, 0.96)",
        borderColor: "rgba(64, 64, 64, 0.6)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
        {String(d.x ?? "")}
      </div>
      <div className="mt-1 mb-2 text-neutral-100 tabular-nums">
        ${total}k <span className="text-[10px] text-neutral-500">MRR</span>
      </div>
      <div className="space-y-1">
        {rows.map((r) => {
          const name = String(r.key ?? "");
          const v = Number(r.value ?? r.data ?? 0);
          const tier = SAAS_TIERS.find((t) => t.key === name);
          return (
            <div
              key={name}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-1.5 text-neutral-300">
                <span
                  className="inline-block h-1.5 w-3 rounded-sm"
                  style={{ background: tier?.color ?? "#94a3b8" }}
                />
                {name}
              </span>
              <span className="text-neutral-100 tabular-nums">${v}k</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierLegend() {
  return (
    <div className="flex flex-wrap gap-3 font-mono text-[11px]">
      {SAAS_TIERS.map((t) => (
        <span key={t.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2.5 rounded-sm"
            style={{ background: t.color }}
          />
          <span className="text-neutral-400">{t.key}</span>
        </span>
      ))}
    </div>
  );
}

function FunnelTooltip({ data }: { data: unknown }) {
  const d = data as { key?: string; data?: number; y?: number; x?: string } | null;
  if (!d) return null;
  const value = Number(d.data ?? d.y ?? 0);
  const label = String(d.key ?? d.x ?? "");
  return (
    <div
      className="min-w-[150px] rounded-md border px-3 py-2 font-mono text-[11px]"
      style={{
        background: "rgba(13, 14, 19, 0.96)",
        borderColor: "rgba(64, 64, 64, 0.6)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </div>
      <div className="mt-0.5 text-neutral-100 tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ---------- helpers ----------

function formatTotal(stack: ReturnType<typeof buildMrrStack>) {
  const last = stack.at(-1);
  if (!last) return "0";
  return last.data.reduce((s, r) => s + r.data, 0).toFixed(0);
}

function trailingGrowth(stack: ReturnType<typeof buildMrrStack>) {
  if (stack.length < 2) return 0;
  const sum = (m: (typeof stack)[number]) =>
    m.data.reduce((s, r) => s + r.data, 0);
  const last = sum(stack.at(-1)!);
  const prev = sum(stack.at(-2)!);
  if (prev === 0) return 0;
  return ((last - prev) / prev) * 100;
}
