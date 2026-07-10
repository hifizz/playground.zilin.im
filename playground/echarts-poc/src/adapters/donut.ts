import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { DonutSpec } from '../types';
import { SIZES, fmt, headerGraphics, footnoteGraphics, paletteFor } from './common';

/**
 * 甜甜圈：外侧富文本标签（名称 / pct% · value亿），中心两行大字。
 */
export function donutAdapter(spec: DonutSpec): EChartsOption {
  const { w, h } = SIZES.donut;
  const colors = paletteFor(spec.data.map((d) => d.name));

  // 有 annotation 时底部预留脚注区
  const footnoteY = spec.annotation ? h - 90 : undefined;
  const cx = w / 2;
  const cy = spec.annotation ? 316 : h / 2 + 20;
  // 约等于 ['52%','72%'] 的观感（以标题/脚注之外的有效高度为基准），用 px 保证布局确定性
  const rIn = 150;
  const rOut = 210;

  const graphic: any[] = [
    ...headerGraphics(spec.title, undefined, w),
    // 中心两行：小号灰标签 + 大号白数值
    spec.center_label && {
      type: 'text',
      left: 'center',
      top: cy - 34,
      style: {
        text: spec.center_label,
        fill: TOKENS.text2,
        fontSize: 14,
        fontFamily: TOKENS.fontFamily,
      },
    },
    spec.center_value && {
      type: 'text',
      left: 'center',
      top: cy - 8,
      style: {
        text: spec.center_value,
        fill: TOKENS.text1,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: TOKENS.fontFamily,
      },
    },
    ...(spec.annotation && footnoteY ? footnoteGraphics(spec.annotation, footnoteY, w) : []),
  ].filter(Boolean);

  return {
    animation: false,
    graphic,
    series: [
      {
        type: 'pie',
        center: [cx, cy],
        radius: [rIn, rOut],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: TOKENS.bg,
          borderWidth: 3,
          borderRadius: 6,
        },
        label: {
          formatter: (p: any) =>
            `{nm|${p.name}}\n{val|${p.data.pct}%}${p.data.value_yi != null ? `{yi| · ${fmt(p.data.value_yi)}亿}` : ''}`,
          rich: {
            nm: { color: TOKENS.text2, fontSize: 12, lineHeight: 20, fontFamily: TOKENS.fontFamily },
            val: { color: TOKENS.text1, fontSize: 15, fontWeight: 700, fontFamily: TOKENS.fontFamily },
            yi: { color: TOKENS.text3, fontSize: 11.5, fontFamily: TOKENS.fontFamily },
          },
        },
        labelLine: {
          length: 18,
          length2: 12,
          smooth: 0.4,
          lineStyle: { color: 'rgba(255,255,255,0.22)', width: 1 },
        },
        data: spec.data.map((d, i) => ({
          name: d.name,
          value: d.pct,
          pct: d.pct,
          value_yi: d.value_yi,
          itemStyle: { color: colors[i] },
        })) as any,
      },
    ],
  };
}
