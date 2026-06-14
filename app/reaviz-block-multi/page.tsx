"use client";

// 1:1 reproduction of the reaviz "Multi Series · Medium" block.
// Source: reaviz/reaviz · blocks/AreaChartBlocksDarkMedium.story.tsx
//   https://github.com/reaviz/reaviz/blob/master/blocks/AreaChartBlocksDarkMedium.story.tsx
// Export name: `MultiSeriesSimple`. Block size: 600 × 714 px.
// Palette kept verbatim: #4C86FF / #40D3F4 / #9152EE / #7E7E8F75 / #9A9AAF /
// #262631 / #E84045 / #F08083 / #40E5D1, on pure black canvas.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  AreaSeries,
  Count,
  Gradient,
  GradientStop,
  Gridline,
  GridlineSeries,
  LinearXAxis,
  LinearXAxisTickLabel,
  LinearXAxisTickSeries,
  LinearYAxis,
  LinearYAxisTickSeries,
} from "reaviz";
import { areaMultiSeriesSimpleData } from "reaviz-data-utils";

export default function ReavizBlockMultiPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to playground</span>
        </Link>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Reaviz · Multi Series Block (Medium)
              </h1>
              <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-sky-300">
                1:1 reproduction
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-neutral-400">
              对应{" "}
              <a
                href="https://reaviz.dev/blocks/charts/area-chart"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
              >
                reaviz.dev/blocks/charts/area-chart
              </a>{" "}
              里的 Multi Series · Medium。源码来自{" "}
              <a
                href="https://github.com/reaviz/reaviz/blob/master/blocks/AreaChartBlocksDarkMedium.story.tsx"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
              >
                AreaChartBlocksDarkMedium.story.tsx
              </a>
              ，导出名{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-[12px] text-neutral-300">
                MultiSeriesSimple
              </code>
              。
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <MultiSeriesBlock />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-neutral-500">
          <span>调色板：</span>
          {[
            "#4C86FF",
            "#40D3F4",
            "#9152EE",
            "#E84045",
            "#F08083",
            "#40E5D1",
            "#9A9AAF",
            "#262631",
            "#7E7E8F",
          ].map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm border border-white/10"
                style={{ background: c }}
              />
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MultiSeriesBlock() {
  return (
    <div className="flex flex-col justify-between pt-4 pb-4 bg-black rounded-3xl shadow-[11px_21px_3px_rgba(0,0,0,0.06),14px_27px_7px_rgba(0,0,0,0.10),19px_38px_14px_rgba(0,0,0,0.13),27px_54px_27px_rgba(0,0,0,0.16),39px_78px_50px_rgba(0,0,0,0.20),55px_110px_86px_rgba(0,0,0,0.26)] w-[600px] h-[714px] overflow-hidden">
      <div className="flex justify-between items-center p-7 pt-6 pb-8">
        <h3 className="text-3xl text-left font-bold text-white">
          Incident Report
        </h3>
        <select className="bg-[#262631] text-white p-3 pt-2 pb-2 rounded-md">
          <option value="last-7-days">Last 7 Days</option>
          <option value="last-30-days">Last 30 Days</option>
          <option value="last-90-days">Last 90 Days</option>
        </select>
      </div>
      <div className="flex gap-8 w-full pl-8 pr-8 mb-4">
        <LegendDot color="#4C86FF" label="DLP" />
        <LegendDot color="#40D3F4" label="Threat Intel" />
        <LegendDot color="#9152EE" label="SysLog" />
      </div>
      <AreaChart
        id="multi-series-simple"
        data={areaMultiSeriesSimpleData as never}
        xAxis={
          <LinearXAxis
            type="time"
            tickSeries={
              <LinearXAxisTickSeries
                label={
                  <LinearXAxisTickLabel
                    format={(v: Date | number | string) =>
                      new Date(v as Date).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                      })
                    }
                    fill="#9A9AAF"
                  />
                }
                tickSize={30}
              />
            }
          />
        }
        yAxis={
          <LinearYAxis
            axisLine={null}
            tickSeries={
              <LinearYAxisTickSeries line={null} label={null} tickSize={20} />
            }
          />
        }
        series={
          <AreaSeries
            type="grouped"
            area={
              <Area
                gradient={
                  <Gradient
                    stops={[
                      <GradientStop key={1} stopOpacity={0} />,
                      <GradientStop key={2} offset="100%" stopOpacity={0.4} />,
                    ]}
                  />
                }
              />
            }
            colorScheme={["#4C86FF", "#40D3F4", "#9152EE"]}
          />
        }
        gridlines={
          <GridlineSeries line={<Gridline strokeColor="#7E7E8F75" />} />
        }
      />
      <div className="flex w-full pl-8 pr-8 justify-between pb-2 pt-8">
        <KpiBlock
          label="Critical Incidents"
          to={321}
          delta="12%"
          deltaColor="#F08083"
          deltaBg="rgb(232,64,69)"
          direction="up"
          subtitle="Compared to 293 last week"
        />
        <KpiBlock
          label="Total Incidents"
          to={1120}
          delta="4%"
          deltaColor="#40E5D1"
          deltaBg="rgb(64,229,209)"
          direction="down"
          subtitle="Compared to 1.06k last week"
        />
      </div>
      <div className="flex flex-col pl-8 pr-8 font-mono divide-y divide-[#262631]">
        <MetricRow
          icon={<DiamondAlertIcon />}
          label="Mean Time to Respond"
          value="6 Hours"
          chipColor="#F08083"
          chipBg="#E84045"
          direction="up"
          delay={0}
        />
        <MetricRow
          icon={<CircleAlertIcon />}
          label="Incident Response Time"
          value="4 Hours"
          chipColor="#F08083"
          chipBg="#E84045"
          direction="up"
          delay={0.05}
        />
        <MetricRow
          icon={<TriangleAlertIcon />}
          label="Incident Escalation Rate"
          value="10%"
          chipColor="#40E5D1"
          chipBg="#40E5D1"
          direction="down"
          delay={0.1}
        />
      </div>
    </div>
  );
}

// ---------- helpers ----------

function rgba(rgbExpr: string, a: number) {
  // accept "rgb(232,64,69)" or "#RRGGBB"
  if (rgbExpr.startsWith("#")) {
    const r = parseInt(rgbExpr.slice(1, 3), 16);
    const g = parseInt(rgbExpr.slice(3, 5), 16);
    const b = parseInt(rgbExpr.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const m = rgbExpr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!m) return rgbExpr;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
}

// ---------- subcomponents ----------

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-4 h-4" style={{ background: color }} />
      <span className="text-[#9A9AAF] text-xs">{label}</span>
    </div>
  );
}

function KpiBlock({
  label,
  to,
  delta,
  deltaColor,
  deltaBg,
  direction,
  subtitle,
}: {
  label: string;
  to: number;
  delta: string;
  deltaColor: string;
  deltaBg: string;
  direction: "up" | "down";
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-1/2">
      <span className="text-xl">{label}</span>
      <div className="flex items-center gap-2">
        <Count className="font-mono text-4xl font-semibold" from={0} to={to} />
        <div
          className="flex p-1 pl-2 pr-2 items-center rounded-full"
          style={{
            background: rgba(deltaBg, 0.4),
            color: deltaColor,
          }}
        >
          <ArrowSvg color={deltaColor} direction={direction} />
          {delta}
        </div>
      </div>
      <span className="text-[#9A9AAF] text-sm">{subtitle}</span>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
  chipColor,
  chipBg,
  direction,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  chipColor: string;
  chipBg: string;
  direction: "up" | "down";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex w-full pb-4 pt-4 items-center gap-2"
    >
      <div className="flex flex-row gap-2 items-center text-base w-1/2 text-[#9A9AAF]">
        {icon}
        <span className="truncate" title={label}>
          {label}
        </span>
      </div>
      <div className="flex gap-2 w-1/2 justify-end">
        <span className="font-semibold text-xl text-white">{value}</span>
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: rgba(chipBg, 0.4),
          }}
        >
          <ArrowSvg color={chipColor} direction={direction} size={20} />
        </div>
      </div>
    </motion.div>
  );
}

function ArrowSvg({
  color,
  direction,
  size = 20,
}: {
  color: string;
  direction: "up" | "down";
  size?: number;
}) {
  const d =
    direction === "up"
      ? "M5.50134 9.11119L10.0013 4.66675M10.0013 4.66675L14.5013 9.11119M10.0013 4.66675L10.0013 16.3334"
      : "M14.4987 11.8888L9.99866 16.3333M9.99866 16.3333L5.49866 11.8888M9.99866 16.3333V4.66658";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 21"
      fill="none"
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}

// Three different incident icons used in the original block.

function DiamondAlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M9.92844 1.25411C9.32947 1.25895 8.73263 1.49041 8.28293 1.94747L1.92062 8.41475C1.02123 9.32885 1.03336 10.8178 1.94748 11.7172L8.41476 18.0795C9.32886 18.9789 10.8178 18.9667 11.7172 18.0526L18.0795 11.5861C18.979 10.6708 18.9667 9.18232 18.0526 8.28291L11.5853 1.92061C11.1283 1.47091 10.5274 1.24926 9.92844 1.25411ZM9.99028 5.40775C9.66711 5.41034 9.37289 5.71583 9.37505 6.04089V11.0409C9.37389 11.5414 9.7787 11.6748 10 11.6748C10.2213 11.6748 10.6262 11.5414 10.625 11.0409V6.04089C10.6261 5.71583 10.3329 5.41034 9.99028 5.40775ZM10 12.9159C9.45 12.9159 9.16672 13.3162 9.16672 13.7492C9.16672 14.1822 9.45 14.5826 10 14.5826C10.55 14.5826 10.8333 14.1822 10.8333 13.7492C10.8333 13.3162 10.55 12.9159 10 12.9159Z"
        fill="#E84045"
      />
    </svg>
  );
}

function CircleAlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.66663C5.40511 1.66663 1.66675 5.40499 1.66675 9.99996C1.66675 14.5949 5.40511 18.3333 10 18.3333C14.5951 18.3333 18.3334 14.5949 18.3334 9.99996C18.3334 5.40499 14.5951 1.66663 10 1.66663ZM10 2.91663C13.9195 2.91663 17.0834 6.08054 17.0834 9.99996C17.0834 13.9194 13.9195 17.0833 10 17.0833C6.08066 17.0833 2.91675 13.9194 2.91675 9.99996C2.91675 6.08054 6.08066 2.91663 10 2.91663ZM9.99032 5.82434C9.66688 5.82693 9.37272 6.13288 9.37508 6.45829V10.625C9.37391 11.1252 9.77874 11.2589 10 11.2589C10.2213 11.2589 10.6262 11.1252 10.6251 10.625V6.45829C10.6263 6.13288 10.3138 5.82693 9.99032 5.82434ZM10 12.5C9.45 12.5 9.16675 12.9003 9.16675 13.3333C9.16675 13.7663 9.45 14.1666 10 14.1666C10.55 14.1666 10.8334 13.7663 10.8334 13.3333C10.8334 12.9003 10.55 12.5 10 12.5Z"
        fill="#E84045"
      />
    </svg>
  );
}

function TriangleAlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.10535C9.35241 2.10535 8.70472 2.42118 8.35459 3.05343L1.9044 14.7063C1.22414 15.9354 2.14514 17.5 3.5499 17.5H16.4511C17.8559 17.5 18.7769 15.9354 18.0966 14.7063L11.6456 3.05343C11.2955 2.42118 10.6478 2.10535 10 2.10535ZM10 3.31222C10.212 3.31222 10.4237 3.42739 10.5519 3.65889L17.0029 15.3117C17.2501 15.7585 16.9605 16.25 16.4511 16.25H3.5499C3.04051 16.25 2.7509 15.7585 2.99815 15.3117L9.44834 3.65889C9.57655 3.42739 9.78821 3.31222 10 3.31222ZM9.99033 6.65776C9.6669 6.66034 9.37272 6.96629 9.3751 7.29171V11.4584C9.37393 11.9586 9.77876 12.0923 10 12.0923C10.2213 12.0923 10.6262 11.9586 10.6251 11.4584V7.29171C10.6263 6.96629 10.3138 6.66034 9.99033 6.65776ZM10 13.3334C9.45 13.3334 9.16677 13.7337 9.16677 14.1667C9.16677 14.5997 9.45 15 10 15C10.55 15 10.8334 14.5997 10.8334 14.1667C10.8334 13.7337 10.55 13.3334 10 13.3334Z"
        fill="#E84045"
      />
    </svg>
  );
}
