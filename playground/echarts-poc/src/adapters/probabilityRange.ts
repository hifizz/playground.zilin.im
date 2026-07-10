import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { ProbabilityRangeSpec } from '../types';
import { SIZES, PAD_X, fmt, headerGraphics } from './common';

function scenarioColor(name: string): string {
  if (/牛|乐观/.test(name)) return TOKENS.bull;
  if (/熊|悲观/.test(name)) return TOKENS.bear;
  return TOKENS.brand1;
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const signed = (p: number) => `${p >= 0 ? '+' : ''}${fmt(p)}%`;

/**
 * 情景区间图：每个情景一条水平色带（low-high），锚点圆点标价格与涨跌幅，
 * 右列标概率；两条竖虚线标现价与概率加权期望价。色带用 custom series 画。
 */
export function probabilityRangeAdapter(spec: ProbabilityRangeSpec): EChartsOption {
  const { w, h } = SIZES.probability_range;
  const { scenarios, current_price, expected_value, expected_upside_pct } = spec.data;
  const colors = scenarios.map((s) => scenarioColor(s.name));

  const gridLeft = 118;
  const gridRight = 150;
  const lo = Math.min(...scenarios.map((s) => s.low), current_price);
  const hi = Math.max(...scenarios.map((s) => s.high), current_price, expected_value);
  const xMin = Math.floor((lo - 25) / 50) * 50;
  const xMax = Math.ceil((hi + 25) / 50) * 50;

  const richDots = Object.fromEntries(
    colors.map((c, i) => [`d${i}`, { color: c, fontSize: 10, fontFamily: TOKENS.fontFamily }]),
  );

  return {
    animation: false,
    graphic: [
      ...headerGraphics(spec.title, '股价 · 港元', w),
      {
        type: 'text',
        x: w - gridRight + 20,
        y: 116,
        style: { text: '概率', fill: TOKENS.text3, fontSize: 11.5, fontFamily: TOKENS.fontFamily },
      },
      {
        type: 'text',
        x: PAD_X,
        y: h - 26,
        style: {
          text: '期望价为三情景锚点价格的概率加权结果',
          fill: TOKENS.text3,
          fontSize: 11.5,
          fontFamily: TOKENS.fontFamily,
        },
      },
    ],
    grid: { left: gridLeft, right: gridRight, top: 152, bottom: 70 },
    xAxis: {
      type: 'value',
      min: xMin,
      max: xMax,
      interval: 50,
      axisLabel: { fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    yAxis: [
      {
        type: 'category',
        data: scenarios.map((s) => s.name),
        inverse: true, // spec 顺序（牛市在前）从上往下排
        axisLabel: {
          margin: 18,
          formatter: (name: string, i: number) => `{d${i}|●} {nm|${name}}`,
          rich: {
            ...richDots,
            nm: { color: TOKENS.text1, fontSize: 14, fontWeight: 600, fontFamily: TOKENS.fontFamily },
          },
        },
      },
      {
        type: 'category',
        data: scenarios.map((s) => `${s.probability}%`),
        inverse: true,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          margin: 20,
          color: TOKENS.text1,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: TOKENS.fontFamily,
        },
      },
    ],
    series: [
      // 区间色带 + 两端 low/high 刻度
      {
        type: 'custom',
        yAxisIndex: 0,
        z: 2,
        renderItem: (params: any, api: any) => {
          const i = params.dataIndex;
          const s = scenarios[i];
          const [x1, y] = api.coord([s.low, i]);
          const x2 = api.coord([s.high, i])[0];
          const bh = 28;
          const textStyle = {
            fill: TOKENS.text3,
            fontSize: 11.5,
            fontFamily: TOKENS.fontFamily,
            textVerticalAlign: 'middle' as const,
          };
          return {
            type: 'group',
            children: [
              {
                type: 'rect',
                shape: { x: x1, y: y - bh / 2, width: x2 - x1, height: bh, r: bh / 2 },
                style: { fill: rgba(colors[i], 0.26) },
              },
              { type: 'text', style: { ...textStyle, text: fmt(s.low), x: x1 - 10, y, textAlign: 'right' } },
              { type: 'text', style: { ...textStyle, text: fmt(s.high), x: x2 + 10, y, textAlign: 'left' } },
            ],
          };
        },
        data: scenarios.map((s, i) => [s.low, i]),
      },
      // 锚点 + 涨跌幅标签 + 现价/期望价参考线
      {
        type: 'scatter',
        yAxisIndex: 0,
        z: 6,
        symbolSize: 11,
        data: scenarios.map((s, i) => ({
          value: [s.anchor, i],
          itemStyle: { color: colors[i], borderColor: TOKENS.bg, borderWidth: 2.5 },
          label: {
            show: true,
            position: 'top' as const,
            distance: 11,
            formatter: () => `{v|${fmt(s.anchor)}}{c|  ${signed(s.anchor_change_pct)}}`,
            rich: {
              v: { color: TOKENS.text1, fontSize: 13.5, fontWeight: 700, fontFamily: TOKENS.fontFamily },
              c: {
                color: s.anchor_change_pct >= 0 ? TOKENS.bull : TOKENS.bear,
                fontSize: 11.5,
                fontWeight: 600,
                fontFamily: TOKENS.fontFamily,
              },
            },
          },
        })),
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          data: [
            {
              xAxis: current_price,
              lineStyle: { color: 'rgba(255,255,255,0.40)', type: [4, 5] as any, width: 1.2 },
              label: {
                position: 'start' as const,
                distance: 10,
                formatter: () => `现价 ${fmt(current_price)}`,
                color: TOKENS.text2,
                fontSize: 12,
                fontFamily: TOKENS.fontFamily,
              },
            },
            {
              xAxis: expected_value,
              lineStyle: { color: TOKENS.brand1, type: [4, 5] as any, width: 1.4 },
              label: {
                position: 'start' as const,
                distance: 10,
                formatter: () => `期望价 ${fmt(expected_value)}（${signed(expected_upside_pct)}）`,
                color: TOKENS.brand1,
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: TOKENS.fontFamily,
              },
            },
          ],
        },
      },
    ],
  };
}
