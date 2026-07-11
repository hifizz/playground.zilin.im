import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { HorizontalBarSpec } from '../types';
import { SIZES, headerGraphics, fmt } from './common';

const MUTED_BAR = 'rgba(255,255,255,0.15)';

/**
 * 横向条形（同业对比）：highlight 条用 brand1 + 微光晕 + 整行底色，
 * 右侧对齐一列"毛利率"次要指标（小圆点 + 数值），像表格列一样可读。
 */
export function horizontalBarAdapter(spec: HorizontalBarSpec): EChartsOption {
  const { w, h } = SIZES.horizontal_bar;
  const names = spec.data.map((d) => d.name);
  const hlName = spec.data.find((d) => d.highlight)?.name;
  const marginByName = new Map(spec.data.map((d) => [d.name, d.gross_margin]));

  const gridLeft = 150;
  const gridRight = 140;
  const gridTop = 126;
  const gridBottom = 34;
  const maxPe = Math.max(...spec.data.map((d) => d.pe ?? 0));

  // highlight 行的整行圆角底带（跨公司名列 + 条形区 + 毛利率列，像表格选中行）
  const hlIdx = spec.data.findIndex((d) => d.highlight);
  const rowH = (h - gridTop - gridBottom) / spec.data.length;
  const hlBand =
    hlIdx >= 0
      ? [
          {
            type: 'rect',
            silent: true,
            z: -10,
            shape: {
              x: 64,
              y: gridTop + rowH * (hlIdx + 0.5) - 25,
              width: w - 64 - 56,
              height: 50,
              r: 12,
            },
            style: { fill: 'rgba(255,107,26,0.07)' },
          },
        ]
      : [];

  return {
    animation: false,
    graphic: [
      ...headerGraphics(spec.title, 'P/E（倍）', w),
      ...hlBand,
      // 右列表头
      {
        type: 'text',
        x: w - gridRight + 18,
        y: 104,
        style: { text: '毛利率', fill: TOKENS.text3, fontSize: 11.5, fontFamily: TOKENS.fontFamily },
      },
    ],
    grid: { left: gridLeft, right: gridRight, top: gridTop, bottom: gridBottom },
    xAxis: { type: 'value', max: maxPe * 1.14, show: false },
    yAxis: [
      {
        type: 'category',
        data: names,
        inverse: true,
        axisLabel: {
          margin: 16,
          fontSize: 13,
          formatter: (name: string) => (name === hlName ? `{hl|${name}}` : name),
          rich: { hl: { color: TOKENS.text1, fontWeight: 700, fontSize: 13, fontFamily: TOKENS.fontFamily } },
        },
      },
      {
        type: 'category',
        data: names,
        inverse: true,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          margin: 18,
          formatter: (name: string) => {
            const m = marginByName.get(name);
            if (m == null) return '';
            return name === hlName ? `{dot|●} {hlv|${fmt(m)}%}` : `{dot|●} {v|${fmt(m)}%}`;
          },
          rich: {
            dot: { color: TOKENS.brand2, fontSize: 9, fontFamily: TOKENS.fontFamily },
            v: { color: TOKENS.text2, fontSize: 12.5, fontFamily: TOKENS.fontFamily },
            hlv: { color: TOKENS.text1, fontSize: 12.5, fontWeight: 700, fontFamily: TOKENS.fontFamily },
          },
        },
      },
    ],
    series: [
      {
        type: 'bar',
        yAxisIndex: 0,
        barWidth: 16,
        data: spec.data.map((d) => ({
          value: d.pe ?? 0,
          itemStyle: d.highlight
            ? {
                color: TOKENS.brand1,
                borderRadius: [0, 8, 8, 0],
                shadowColor: 'rgba(255,107,26,0.45)',
                shadowBlur: 12,
              }
            : { color: MUTED_BAR, borderRadius: [0, 8, 8, 0] },
          label: {
            show: true,
            position: 'right' as const,
            distance: 8,
            formatter: () => `${fmt(d.pe ?? 0)}x`,
            color: d.highlight ? TOKENS.text1 : TOKENS.text2,
            fontWeight: (d.highlight ? 700 : 500) as any,
            fontSize: d.highlight ? 13.5 : 12.5,
            fontFamily: TOKENS.fontFamily,
          },
        })),
      },
    ],
  };
}
