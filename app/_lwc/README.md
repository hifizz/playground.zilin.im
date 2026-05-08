# Lightweight Charts Demos

基于 [TradingView lightweight-charts v5](https://tradingview.github.io/lightweight-charts/) 实现的 5 个交互式股票/加密图表 demo。每个 demo 单独一个 Next.js 路由（`/lwc-*`），避免一页同时挂多个 chart 实例。

> 同款思路对标 TradingView 官网首页的 [example gallery](https://www.tradingview.com/lightweight-charts/)，但加了一些 React 化的封装、自定义 legend、和实时数据流。

每个 demo 都聚焦一个独特技术点，避免重复演示同一个 API。

---

## 目录速览

| 路由 | 独特技术点 |
|---|---|
| `/lwc-candle-volume` | **`priceScaleId` overlay**：成交量直方图挂在主图同一 pane 的副 priceScale 上（不是多 pane） |
| `/lwc-area-glow` | **样式热切换**：`series.applyOptions` 动态换主题 + `setVisibleRange` 时段 tab |
| `/lwc-baseline` | **`BaselineSeries`**：上下双色填充，slider 拖动实时改 `baseValue` |
| `/lwc-live` | **`series.update()` 增量流式渲染**：可暂停 / 0.5×–5× 调速 |
| `/lwc-terminal` | **多 pane `paneIndex`** + BB 叠加 + MACD + 右侧 L2 订单簿 + 成交流水 |

---

## 文件结构

```
app/
├── _lwc/
│   ├── chart-shell.tsx     # 所有 demo 共用的页面外壳 + 调色盘
│   └── README.md           # 你正在看的这份
├── lwc-candle-volume/page.tsx
├── lwc-area-glow/page.tsx
├── lwc-baseline/page.tsx
├── lwc-live/page.tsx
└── lwc-terminal/page.tsx

lib/
└── lwc-data.ts             # 共用的 mock 数据 + 技术指标 + 订单流生成器

app/_homepage/thumbs/
├── lwc-candle-volume.tsx   # 静态 SVG 缩略图（每个 demo 一份）
├── lwc-area-glow.tsx
├── lwc-baseline.tsx
├── lwc-live.tsx
└── lwc-terminal.tsx
```

---

## 共用基础设施

### 1. `app/_lwc/chart-shell.tsx`

页面外壳。统一处理：返回首页链接、标题/副标题/badge、外层 card 样式。还导出一个 `palette` 常量，把整套 demo 的颜色（背景 / 网格 / 涨跌色 / 主题强调色）集中管理。

```tsx
<ChartShell title="..." subtitle="..." badge={<Pill />} side={<Toggle />}>
  {/* 一个 chart 容器 */}
</ChartShell>
```

### 2. `lib/lwc-data.ts`

所有 demo 共用的数据生成器。设计要点：

- **确定性 PRNG（mulberry32）**：所有随机数走同一颗种子，避免 SSR/CSR hydration 不一致，也保证刷新前后数据一样。
- **`generateCandles({ count, seed, drift, volatility })`**：返回带 OHLC + volume 的日 K 数据，自动跳过周末让时间轴像真实交易日。
- **`candlesToVolume` / `candlesToLine`**：从蜡烛数据派生出成交量直方图和收盘价线。
- **`computeBollingerBands(period=20, k=2)`**：返回 upper / middle / lower 三条对齐的 LineData。
- **`computeMACD(12, 26, 9)`**：返回 macd / signal / histogram，histogram 自带 per-bar 涨跌色。
- **`makeTickStream`**：1 秒级随机游走 tick 流，给 `/lwc-live` 用。
- **`makeOrderFlow`**：合成 L2 订单簿 + 成交流水，给 `/lwc-terminal` 用。

---

## 通用集成模式

所有 demo 都遵循相同的 React 集成模式（v5 lightweight-charts + React 19）：

```tsx
"use client";

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const chart = createChart(container, {
    autoSize: true,                                       // ← 自动跟随容器尺寸
    layout: { background: { type: ColorType.Solid }, ... },
    crosshair: { mode: CrosshairMode.Normal, ... },
  });

  const series = chart.addSeries(CandlestickSeries, { ... });
  series.setData(candles);

  // crosshair 事件 → 驱动自定义 legend
  const onMove = (param: MouseEventParams<Time>) => { ... };
  chart.subscribeCrosshairMove(onMove);

  return () => {
    chart.unsubscribeCrosshairMove(onMove);
    chart.remove();                                       // ← React 19 strict 模式必须卸载
  };
}, [data]);
```

要点：
- 用 `autoSize: true` 让 chart 自己监听容器 ResizeObserver，不用手写 `window.resize` listener。
- `chart.remove()` 必须在 cleanup 里调，不然 React 19 strict 模式 double-mount 会泄漏 canvas。
- 改样式（颜色、范围）走 `series.applyOptions()` 或 `chart.timeScale().setVisibleRange()`，**不要重建 chart**。

---

## 5 个 Demo 实现要点

### 1. Candle + Volume — `/lwc-candle-volume`

经典双 pane 布局。**不**用 v5 的 `paneIndex` 参数，而是把成交量直方图挂到一个**自定义命名的 priceScale**（`"vol"`），通过 `scaleMargins` 把它压到底部 22% 区域：

```tsx
const volume = chart.addSeries(HistogramSeries, {
  priceFormat: { type: "volume" },
  priceScaleId: "vol",
});
chart.priceScale("vol").applyOptions({
  scaleMargins: { top: 0.78, bottom: 0 },
});
```

自定义 OHLC legend 通过 `subscribeCrosshairMove` 拿到当前 hover 的 time，回到原始数据数组里查对应蜡烛。

### 2. Area Glow — `/lwc-area-glow`

仿 TradingView 首页 hero 视觉：单条 area 线 + 渐变填充 + 浮动 tooltip + 4 套主题色 + 5 个时段 tab。

- **主题切换**：`series.applyOptions({ lineColor, topColor, bottomColor })`，不重建 chart。
- **时段切换**：`chart.timeScale().setVisibleRange({ from, to })`，把可视区间映射到 1M / 3M / 6M / 1Y / ALL。
- **浮动 tooltip**：crosshair 事件里同时拿 `param.point` 像素坐标，绝对定位到那个像素点上。

### 3. Baseline P&L — `/lwc-baseline`

`BaselineSeries` 是个特殊系列：会以 `baseValue` 为基准线，上方填一种颜色，下方填另一种颜色。这正是组合 P&L 的天然表达方式。

```tsx
chart.addSeries(BaselineSeries, {
  baseValue: { type: "price", price: costBasis },
  topLineColor: "rgba(38,166,154,1)",
  topFillColor1: "rgba(38,166,154,0.32)",
  topFillColor2: "rgba(38,166,154,0.02)",
  bottomLineColor: "rgba(239,83,80,1)",
  bottomFillColor1: "rgba(239,83,80,0.02)",
  bottomFillColor2: "rgba(239,83,80,0.32)",
});
```

拖动滑杆 → `series.applyOptions({ baseValue: { type: "price", price: newBase } })`，整个填充会重新 split。

### 4. Live Stream — `/lwc-live`

演示 lightweight-charts 的高性能流式更新。**关键是用 `series.update(tick)` 而不是 `series.setData`** —— 前者只重绘最后一个点，后者会重新计算整条时间轴。

```tsx
useEffect(() => {
  const id = setInterval(() => {
    const tick = stream.next(lastTick);
    series.update(tick);                  // 不是 setData！
  }, intervalMs);
  return () => clearInterval(id);
}, [running, intervalMs]);
```

支持暂停 / 0.5×–5× 调速。

### 5. Trading Terminal — `/lwc-terminal`

把多 pane + 指标叠加 + 实时数据流 + 周边 React 面板拼在一起的"集大成"案例：

```
┌─────────────────────────────────────────┬──────────────┐
│  Pane 0 · Candle + Bollinger Bands      │  Order Book  │
│  Pane 1 · Volume                        │  (L2 ladder) │
│  Pane 2 · MACD (line + signal + hist)   ├──────────────┤
└─────────────────────────────────────────┤  Trade Tape  │
                                          └──────────────┘
```

**左侧（lightweight-charts 多 pane）**：
- 用 v5 `paneIndex` 把不同系列挂到不同 pane，所有 pane 共享时间轴 + crosshair：

  ```tsx
  chart.addSeries(CandlestickSeries, { ... }, 0);   // pane 0：蜡烛 + BB 叠加
  chart.addSeries(HistogramSeries,  { ... }, 1);   // pane 1：成交量
  chart.addSeries(HistogramSeries,  { ... }, 2);   // pane 2：MACD histogram
  chart.addSeries(LineSeries,       { ... }, 2);   // pane 2 上叠 MACD line
  chart.addSeries(LineSeries,       { ... }, 2);   // pane 2 上叠 signal line

  const panes = chart.panes();
  panes[0].setHeight(360);
  panes[1].setHeight(110);
  panes[2].setHeight(140);
  ```

- Pane 0 同时挂了 4 个系列：`CandlestickSeries` + 3 条 `LineSeries`（BB upper / middle / lower）。三条 BB 都设了 `lastValueVisible: false` + `crosshairMarkerVisible: false`，避免污染主图的 last-value 标签。
- Pane 2 的 MACD：底层是 `HistogramSeries`（`base: 0`，柱子按值的正负染色），上面叠 `LineSeries` × 2（macd 橙、signal 蓝）。
- crosshair legend 同时显示 OHLC、BB↑/↓、MACD/Signal。
- 需要画水平参考线时（比如固定的支撑位 / RSI 30/70 阈值）用 `series.createPriceLine({ price, lineStyle, axisLabelVisible })`。

**右侧（纯 React，不走 lightweight-charts）**：
- 订单簿用 350 ms 间隔的 `setInterval` 跑：mid 随机游走、各档位 size 随机微调、偶尔出现 whale。每行用 `position: absolute` + 百分比宽度画"深度条"背景。
- 成交流水用一个数组 + 队列裁剪（`MAX_TRADES = 26`），最新一条加 CSS keyframes `tape-flash` 动画一闪而过。
- 暂停按钮直接 toggle `setInterval` 是否跑。

> 为什么订单簿不也用 lightweight-charts？因为它本质是表格不是时间序列。lightweight-charts 擅长的是 K 线/指标，订单簿用普通 React 渲染更直接、调样式也更灵活。

---

## 添加一个新的 LWC demo

1. 在 `lib/lwc-data.ts` 里看看需要的指标/数据是不是已经有了；没有就加（保持纯函数 + 确定性 PRNG）。
2. 复制 `app/lwc-area-glow/page.tsx` 当模板，改路由文件夹名为 `app/lwc-<name>/page.tsx`。
3. 在 `useEffect` 里 `createChart` → `addSeries` → `setData` → `subscribeCrosshairMove`，cleanup 调 `chart.remove()`。
4. 在 `app/_homepage/thumbs/lwc-<name>.tsx` 写一份**纯静态** SVG 缩略图（不依赖 use client，无 state）。
5. 在 `app/_homepage/demos.tsx` 末尾追加一条记录：

```tsx
{
  title: "LWC · <Name>",
  description: "...",
  route: "/lwc-<name>",
  category: "Explored Demo",
  tags: ["lightweight-charts", "Chart"],
  preview: <Lwc<Name>Thumb />,
}
```

---

## 性能笔记

- 所有 demo 都用 `autoSize: true`，单个 demo 内只有 1 个 chart 实例，dev 模式下内存占用稳定。
- `/lwc-terminal` 是 6 个里最重的：3 pane × 6 series + 350 ms 订单簿 tick。在 M 系列 Mac 上 Chrome 主线程稳定 < 5%。
- `/lwc-live` 默认 1 tick/300ms，5× 模式 ~17 tick/s 也无肉眼可见的卡顿——这就是 `series.update()` 增量渲染的力量。
- 如果未来要在同一页同时挂多个 chart（比如做对比）需要注意：lightweight-charts 的 canvas 不共享 GPU 上下文，>3 个实例时考虑切到 IntersectionObserver 懒挂载。

---

## 参考

- [Lightweight Charts™ docs](https://tradingview.github.io/lightweight-charts/docs)
- [Series types reference](https://tradingview.github.io/lightweight-charts/docs/series-types)
- [v5 React tutorial](https://tradingview.github.io/lightweight-charts/tutorials/react/simple)
- [Plugin examples gallery](https://tradingview.github.io/lightweight-charts/plugin-examples/)
