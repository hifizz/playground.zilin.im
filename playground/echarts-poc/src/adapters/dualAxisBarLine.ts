import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { DualAxisBarLineSpec } from '../types';
import { SIZES, PAD_X, fmt, headerGraphics } from './common';

const BAR_COLORS = [TOKENS.brand1, '#C97B4A'];
// 利润率不是多空语义，不用绿/红；浅橙实线 + 中性灰虚线，和橙柱同族不抢戏
const LINE_STYLES = [
  { color: TOKENS.brand3, labelColor: TOKENS.brand3, dashed: false },
  { color: 'rgba(255,255,255,0.60)', labelColor: 'rgba(255,255,255,0.66)', dashed: true },
];

const GRID_TOP = 148;
const GRID_BOTTOM = 56;
const LABEL_H = 14; // 11px 字号标签的占位高度

/**
 * 双轴柱线：左轴双柱（收入/净利润），右轴百分比双线（毛利率实线/净利率虚线）。
 * 左右轴刻度段数一致（4 段），网格线共用不打架。
 *
 * 双轴图的固有难题是折线点会漂到柱顶数值标签附近。两个轴的量程 adapter
 * 都知道，所以逐点用像素几何自动避让：优先 top，撞了换 bottom，再撞甩 right。
 */
export function dualAxisBarLineAdapter(spec: DualAxisBarLineSpec): EChartsOption {
  const { w, h } = SIZES.dual_axis_bar_line;
  const { periods, bars, lines } = spec.data;

  const maxBar = Math.max(...bars.flatMap((b) => b.values));
  const leftMax = Math.ceil((maxBar * 1.05) / 100) * 100;
  const maxLine = Math.max(...lines.flatMap((l) => l.values));
  const rightMax = Math.ceil((maxLine * 1.1) / 20) * 20;

  // —— 逐类目登记"已占用的纵向区间"（自底向上的像素坐标），供折线标签避让 ——
  const plotH = h - GRID_TOP - GRID_BOTTOM;
  const occupied: Array<Array<[number, number]>> = periods.map(() => []);
  bars.forEach((b) =>
    b.values.forEach((v, i) => {
      const top = (v / leftMax) * plotH;
      occupied[i].push([top + 4, top + 6 + LABEL_H]); // 柱顶数值标签区
    }),
  );
  const clear = (i: number, zone: [number, number]) =>
    !occupied[i].some(([a, b]) => zone[0] < b + 3 && zone[1] > a - 3);

  const placeLabel = (v: number, i: number, isLast: boolean): 'top' | 'bottom' | 'right' => {
    const py = (v / rightMax) * plotH;
    if (isLast) return 'right'; // 末点固定甩右侧，右边距足够
    const top: [number, number] = [py + 8, py + 8 + LABEL_H];
    if (clear(i, top)) {
      occupied[i].push(top);
      return 'top';
    }
    const bottom: [number, number] = [py - 8 - LABEL_H, py - 8];
    if (clear(i, bottom)) {
      occupied[i].push(bottom);
      return 'bottom';
    }
    return 'right';
  };

  return {
    animation: false,
    graphic: headerGraphics(spec.title, '左轴：亿元 · 右轴：%', w),
    legend: {
      right: PAD_X,
      top: 78,
      itemGap: 18,
      data: [
        ...bars.map((b) => ({ name: b.name, icon: 'roundRect' })),
        ...lines.map((l) => ({ name: l.name })),
      ],
    },
    grid: { left: PAD_X + 10, right: PAD_X + 18, top: GRID_TOP, bottom: GRID_BOTTOM },
    xAxis: { type: 'category', data: periods, axisLabel: { fontSize: 12.5 } },
    yAxis: [
      {
        type: 'value',
        max: leftMax,
        interval: leftMax / 4,
        axisLabel: { show: false },
        splitLine: { show: true, lineStyle: { color: TOKENS.divider } },
      },
      {
        type: 'value',
        max: rightMax,
        interval: rightMax / 4,
        position: 'right',
        axisLabel: { formatter: '{value}%', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      ...bars.map((b, i) => ({
        name: b.name,
        type: 'bar' as const,
        yAxisIndex: 0,
        barWidth: 20,
        barGap: '30%',
        z: 2,
        itemStyle: { color: BAR_COLORS[i % BAR_COLORS.length], borderRadius: [5, 5, 0, 0] as any },
        label: {
          show: true,
          position: 'top' as const,
          distance: 6,
          formatter: (p: any) => fmt(p.value),
          color: i === 0 ? TOKENS.text1 : TOKENS.text2,
          fontWeight: (i === 0 ? 600 : 400) as any,
          fontSize: 11,
          fontFamily: TOKENS.fontFamily,
          // 折线可能从标签后方穿过，加背景色描边保持可读
          textBorderColor: TOKENS.bg,
          textBorderWidth: 2.5,
        },
        data: b.values,
      })),
      ...lines.map((l, i) => {
        const st = LINE_STYLES[i % LINE_STYLES.length];
        return {
          name: l.name,
          type: 'line' as const,
          yAxisIndex: 1,
          z: 4,
          lineStyle: { color: st.color, width: 2.5, type: (st.dashed ? [6, 5] : 'solid') as any },
          itemStyle: { color: st.color, borderColor: TOKENS.bg, borderWidth: 2 },
          symbolSize: 7,
          label: {
            show: true,
            distance: 8,
            formatter: (p: any) => `${fmt(p.value)}%`,
            color: st.labelColor,
            fontSize: 10.5,
            fontWeight: 600 as any,
            fontFamily: TOKENS.fontFamily,
            textBorderColor: TOKENS.bg,
            textBorderWidth: 3,
          },
          data: l.values.map((v, vi) => ({
            value: v,
            label: {
              position: placeLabel(v, vi, vi === l.values.length - 1),
              offset: (vi === l.values.length - 1 ? [4, 0] : [0, 0]) as any,
            },
          })),
        };
      }),
    ],
  };
}
