"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  LineChart as LineIcon,
  BarChart3 as BarIcon,
} from "lucide-react";

// --- 1. 数据生成器 (共享数据源) ---
const generateData = () => {
  const data = [];
  let prevClose = 530;

  for (let i = 0; i < 50; i++) {
    const timeHour = 9 + Math.floor((i * 10) / 60);
    const timeMinute = (30 + i * 10) % 60;
    const timeStr = `${timeHour}:${timeMinute === 0 ? "00" : timeMinute} ${timeHour >= 12 ? "PM" : "AM"}`;

    // 模拟价格波动
    const volatility = 2.5;
    const change = (Math.random() - 0.45) * volatility;

    let open = prevClose + (Math.random() - 0.5) * 0.5;
    let close = open + change;

    // 强制趋势：中间跌，后涨
    if (i > 15 && i < 25) close -= 1.5;
    else if (i >= 25) close += 0.8;

    let high = Math.max(open, close) + Math.random() * 1.5;
    let low = Math.min(open, close) - Math.random() * 1.5;

    const fmt = (n) => Number(n.toFixed(2));

    data.push({
      time: timeStr,
      open: fmt(open),
      close: fmt(close),
      high: fmt(high),
      low: fmt(low),
      range: [fmt(low), fmt(high)],
      value: fmt(close), // 折线图使用 value 字段
      isUp: close >= open,
    });

    prevClose = close;
  }
  return data;
};

const mockData = generateData();

// --- 2. 折线图组件 (Trend/Line Chart) ---
const TrendChart = ({ data, color = "#22c55e" }) => {
  return (
    <div className="h-[320px] w-full mt-4 select-none animate-in fade-in duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#262626"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            minTickGap={50}
          />
          <YAxis
            domain={["auto", "auto"]}
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            tickCount={6}
          />
          <Tooltip
            content={<CustomLineTooltip />}
            cursor={{ stroke: "#525252", strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
          {/* 当前价格点 */}
          {data.length > 0 && (
            <ReferenceLine x={data[data.length - 1].time} stroke="none">
              <circle
                cx={0}
                cy={0}
                r={4}
                fill="white"
                stroke={color}
                strokeWidth={2}
              />
            </ReferenceLine>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded px-2 py-1 shadow-xl">
        <p className="font-semibold text-neutral-400">{label}</p>
        <p className="text-green-400 font-mono">Price: ${payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// --- 3. 蜡烛图组件 (Candle Chart) ---
const CandlestickShape = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#22c55e" : "#ef4444";
  const range = high - low;
  if (range === 0) return null;

  const ratio = height / range;
  const bodyTop = y + (high - Math.max(open, close)) * ratio;
  const bodyHeight = Math.max(1, Math.abs(open - close) * ratio);
  const wickX = x + width / 2;

  return (
    <g>
      <line
        x1={wickX}
        y1={y}
        x2={wickX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x + 1}
        y={bodyTop}
        width={width - 2}
        height={bodyHeight}
        fill={color}
      />
    </g>
  );
};

const CandleChart = ({ data }) => {
  return (
    <div className="h-[320px] w-full mt-4 select-none animate-in fade-in duration-500">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#262626"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            minTickGap={50}
          />
          <YAxis
            domain={["auto", "auto"]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            tickCount={6}
          />
          <Tooltip
            content={<CustomCandleTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar
            dataKey="range"
            shape={<CandlestickShape />}
            isAnimationActive={false}
          />
          <ReferenceLine
            y={data[0].open}
            stroke="#525252"
            strokeDasharray="3 3"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomCandleTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { open, close, high, low, isUp } = payload[0].payload;
    const colorClass = isUp ? "text-green-500" : "text-red-500";
    return (
      <div className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded p-2 shadow-xl min-w-[120px]">
        <p className="font-semibold text-neutral-400 mb-1">{label}</p>
        <div className="space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Open:</span> <span className={colorClass}>{open}</span>
          </div>
          <div className="flex justify-between">
            <span>High:</span> <span className="text-neutral-300">{high}</span>
          </div>
          <div className="flex justify-between">
            <span>Low:</span> <span className="text-neutral-300">{low}</span>
          </div>
          <div className="flex justify-between">
            <span>Close:</span> <span className={colorClass}>{close}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- 4. 辅助 UI 组件 ---
const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-neutral-800 last:border-0 md:border-0">
    <span className="text-neutral-400 text-sm font-medium">{label}</span>
    <span className="text-neutral-200 text-sm font-semibold font-mono tracking-wide">
      {value}
    </span>
  </div>
);

const TimeSelector = () => {
  const periods = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];
  const [active, setActive] = useState("1D");
  return (
    <div className="flex bg-neutral-800/50 rounded-lg p-1 space-x-1 overflow-x-auto no-scrollbar">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => setActive(p)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            active === p
              ? "bg-neutral-700 text-white"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
};

const ChartTypeToggle = ({ activeType, onChange }) => {
  return (
    <div className="flex bg-neutral-800/50 rounded-lg p-1 space-x-1">
      <button
        onClick={() => onChange("line")}
        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
          activeType === "line"
            ? "bg-neutral-700 text-white"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
        }`}
      >
        <LineIcon size={14} />
        <span>Line</span>
      </button>
      <button
        onClick={() => onChange("candle")}
        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
          activeType === "candle"
            ? "bg-neutral-700 text-white"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
        }`}
      >
        <BarIcon size={14} />
        <span>Candle</span>
      </button>
    </div>
  );
};

// --- 5. 主应用入口 ---
export default function App() {
  const [chartType, setChartType] = useState("candle"); // 默认显示蜡烛图
  const lastData = mockData[mockData.length - 1];

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl space-y-4">
        <div className="text-neutral-400 text-sm md:text-base mb-2">
          Sandisk 股价走势分析：
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h1 className="text-neutral-400 text-lg font-medium mb-1">
                Sandisk Corp (SNDK)
              </h1>
              <div className="text-6xl font-bold text-white tracking-tight mb-2">
                ${lastData.close}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-green-500 font-bold flex items-center">
                  +$14.05 (+2.66%)
                </span>
                <span className="text-neutral-400">January 29</span>
              </div>
            </div>

            {/* Controls Area */}
            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex gap-2">
                <ChartTypeToggle
                  activeType={chartType}
                  onChange={setChartType}
                />
              </div>
              <TimeSelector />
            </div>
          </div>

          {/* Chart Section */}
          <div className="relative border-b border-neutral-800 pb-8 mb-8">
            {/* 浮动标签 */}
            <div className="absolute top-4 left-10 bg-neutral-800/80 px-2 py-1 rounded text-xs text-neutral-300 backdrop-blur-sm border border-neutral-700 pointer-events-none z-10 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${chartType === "line" ? "bg-green-400 animate-pulse" : "bg-green-500"}`}
              ></span>
              {chartType === "line" ? "Live Trend" : "OHLC Market Data"}
            </div>

            {/* 根据状态切换图表 */}
            {chartType === "line" ? (
              <TrendChart data={mockData} />
            ) : (
              <CandleChart data={mockData} />
            )}

            {/* 底部时间轴标签辅助 */}
            <div className="flex justify-between px-2 text-xs text-neutral-500 font-mono mt-2 pt-2 border-t border-neutral-800/50">
              <span>9:30 AM</span>
              <span>11:00 AM</span>
              <span>12:30 PM</span>
              <span>2:00 PM</span>
              <span>3:30 PM</span>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-4">
            <StatItem label="Open" value="535.94" />
            <StatItem label="Day Low" value="507.48" />
            <StatItem label="Year Low" value="27.89" />
            <div className="hidden md:block"></div>

            <StatItem label="Volume" value="23M" />
            <StatItem label="Day High" value="632.00" />
            <StatItem label="Year High" value="546.75" />
          </div>
        </div>
      </div>
    </div>
  );
}
