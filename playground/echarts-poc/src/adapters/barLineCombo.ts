import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { BarLineComboSpec } from '../types';
import { SIZES, PAD_X, fmt, headerGraphics } from './common';

/**
 * 柱 + 线组合：圆角顶橙柱标大号白字，趋势线用蓝绿色 + 描边光环标签保证叠在柱上也可读。
 */
export function barLineComboAdapter(spec: BarLineComboSpec): EChartsOption {
  const { w, h } = SIZES.bar_line_combo;
  const { periods, bar, line } = spec.data;
  const maxBar = Math.max(...bar.values);

  return {
    animation: false,
    graphic: headerGraphics(spec.title, undefined, w),
    legend: {
      right: PAD_X,
      top: 46,
      itemGap: 20,
      data: [
        { name: bar.name, icon: 'roundRect' },
        { name: line.name },
      ],
    },
    grid: { left: PAD_X + 8, right: PAD_X + 8, top: 124, bottom: 56 },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { fontSize: 12.5 },
    },
    yAxis: {
      type: 'value',
      max: Math.ceil((maxBar * 1.16) / 10) * 10,
      axisLabel: { show: false },
      splitNumber: 4,
    },
    series: [
      {
        name: bar.name,
        type: 'bar',
        barWidth: 38,
        z: 2,
        itemStyle: { color: TOKENS.brand1, borderRadius: [9, 9, 0, 0] },
        label: {
          show: true,
          position: 'top',
          distance: 9,
          formatter: (p: any) => fmt(p.value),
          color: TOKENS.text1,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: TOKENS.fontFamily,
        },
        data: bar.values,
      },
      {
        name: line.name,
        type: 'line',
        z: 3,
        // 中性白线叠在橙柱上：不引入第二个色相，靠明度差分离
        lineStyle: { color: TOKENS.trend, width: 2.5 },
        itemStyle: { color: TOKENS.trend, borderColor: TOKENS.bg, borderWidth: 2 },
        symbolSize: 8,
        label: {
          show: true,
          position: 'bottom',
          distance: 9,
          formatter: (p: any) => fmt(p.value),
          color: 'rgba(255,255,255,0.82)',
          fontSize: 11.5,
          fontWeight: 600,
          fontFamily: TOKENS.fontFamily,
          textBorderColor: TOKENS.bg,
          textBorderWidth: 3,
        },
        data: line.values,
      },
    ],
  };
}
