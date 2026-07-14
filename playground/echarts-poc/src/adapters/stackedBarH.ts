import type { EChartsOption } from 'echarts';
import { TOKENS } from '../tokens';
import type { StackedBarHSpec } from '../types';
import { SIZES, PAD_X, fmt, headerGraphics, paletteFor, relLuminance } from './common';

/** 估算文本宽度（CJK 全宽、拉丁半宽），用于 graphic 手动排版 */
function measure(text: string, fontSize: number, bold = false): number {
  let wpx = 0;
  for (const ch of text) wpx += ch.charCodeAt(0) > 255 ? fontSize : fontSize * (bold ? 0.62 : 0.56);
  return wpx;
}

/** 段内文字颜色按段色亮度自动选深墨/白墨（配色可定制，不能写死哪档是浅色） */
const DARK_INK = 'rgba(16,10,4,0.92)';
function inkFor(color: string): string {
  return relLuminance(color) > 0.45 ? DARK_INK : 'rgba(255,255,255,0.95)';
}

/**
 * 单行水平堆叠条：一根横条展示营收结构，段内标 pct%，下方三列图例网格标名称/数值。
 */
export function stackedBarHAdapter(spec: StackedBarHSpec): EChartsOption {
  const { w, h } = SIZES.stacked_bar_h;
  const colors = paletteFor(spec.data.map((d) => d.name));
  const last = spec.data.length - 1;
  const R = 15;

  // —— 下方图例网格：3 列 × N 行 ——
  const cols = 3;
  const cellW = (w - PAD_X * 2) / cols;
  const legendTop = 236;
  const rowH = 82;
  const legend: any[] = [];
  spec.data.forEach((d, i) => {
    const x0 = PAD_X + (i % cols) * cellW;
    const y0 = legendTop + Math.floor(i / cols) * rowH;
    legend.push(
      { type: 'rect', shape: { x: x0, y: y0 + 2, width: 10, height: 10, r: 3 }, style: { fill: colors[i] } },
      {
        type: 'text', x: x0 + 18, y: y0,
        style: { text: d.name, fill: TOKENS.text2, fontSize: 12.5, fontFamily: TOKENS.fontFamily },
      },
    );
    const pctText = d.pct != null ? `${d.pct}%` : '';
    if (pctText) {
      legend.push({
        type: 'text', x: x0 + 18, y: y0 + 24,
        style: { text: pctText, fill: TOKENS.text1, fontSize: 18, fontWeight: 700, fontFamily: TOKENS.fontFamily },
      });
    }
    const tail = [
      d.value_yi != null ? `${fmt(d.value_yi)}亿` : '',
      d.yoy ?? '',
    ].filter(Boolean).join('  ');
    if (tail) {
      legend.push({
        type: 'text', x: x0 + 18 + (pctText ? measure(pctText, 18, true) + 8 : 0), y: y0 + 30,
        style: { text: tail, fill: TOKENS.text3, fontSize: 12, fontFamily: TOKENS.fontFamily },
      });
    }
  });

  return {
    animation: false,
    graphic: [...headerGraphics(spec.title, '占营收比重 · 亿元', w), ...legend],
    grid: { left: PAD_X, right: PAD_X, top: 128, height: 66 },
    xAxis: { type: 'value', max: 100, show: false },
    yAxis: { type: 'category', data: [''], show: false },
    series: spec.data.map((d, i) => ({
      type: 'bar' as const,
      name: d.name,
      stack: 'total',
      barWidth: 66,
      data: [d.pct ?? 0],
      itemStyle: {
        color: colors[i],
        borderColor: TOKENS.bg,
        borderWidth: 2,
        borderRadius: i === 0 ? [R, 0, 0, R] : i === last ? [0, R, R, 0] : 0,
      },
      label: {
        show: (d.pct ?? 0) >= 5.5,
        position: 'inside' as const,
        formatter: () => `${d.pct}%`,
        color: inkFor(colors[i]),
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: TOKENS.fontFamily,
      },
    })),
  };
}
