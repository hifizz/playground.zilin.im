import { TOKENS } from '../tokens';

/** 每种图表的画布尺寸（小红书长图内嵌，统一 880 宽） */
export const SIZES: Record<string, { w: number; h: number }> = {
  donut: { w: 880, h: 640 },
  stacked_bar_h: { w: 880, h: 430 },
  horizontal_bar: { w: 880, h: 600 },
  bar_line_combo: { w: 880, h: 560 },
  dual_axis_bar_line: { w: 880, h: 600 },
  probability_range: { w: 880, h: 560 },
};

/** 页面左右留白 */
export const PAD_X = 48;

/** 数字展示：45.0 -> 45, 83.8 -> 83.8 */
export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/**
 * NOVARK 报告式标题头：左侧橙色竖条 + 粗体大标题，可选右上角灰色小注（如"单位：亿元"）。
 * 返回 graphic elements 数组，adapter 里 concat 进 option.graphic。
 */
export function headerGraphics(title: string, note?: string, width = 880): any[] {
  const els: any[] = [
    {
      type: 'rect',
      shape: { x: PAD_X, y: 40, width: 5, height: 22, r: 2.5 },
      style: { fill: TOKENS.brand1 },
    },
    {
      type: 'text',
      x: PAD_X + 17,
      y: 41,
      style: {
        text: title,
        fill: TOKENS.text1,
        fontSize: 21,
        fontWeight: 700,
        fontFamily: TOKENS.fontFamily,
      },
    },
  ];
  if (note) {
    els.push({
      type: 'text',
      right: PAD_X,
      top: 50,
      style: {
        text: note,
        fill: TOKENS.text3,
        fontSize: 11.5,
        fontFamily: TOKENS.fontFamily,
      },
    });
  }
  return els;
}

/**
 * 底部脚注（如 donut 的 annotation）：细分隔线 + 橙色小方块 + 灰字。
 */
export function footnoteGraphics(text: string, y: number, width = 880): any[] {
  return [
    {
      type: 'line',
      shape: { x1: PAD_X, y1: y, x2: width - PAD_X, y2: y },
      style: { stroke: TOKENS.divider, lineWidth: 1 },
    },
    {
      type: 'rect',
      shape: { x: PAD_X, y: y + 15, width: 3, height: 13, r: 1.5 },
      style: { fill: TOKENS.brand2 },
    },
    {
      type: 'text',
      x: PAD_X + 12,
      y: y + 16,
      style: {
        text,
        fill: TOKENS.text2,
        fontSize: 12.5,
        fontFamily: TOKENS.fontFamily,
        lineHeight: 18,
      },
    },
  ];
}

/** "其他"类固定用调色板末位的灰色 */
export function paletteFor(names: string[]): string[] {
  const gray = TOKENS.categorical[TOKENS.categorical.length - 1];
  let i = 0;
  return names.map((n) => (/其他/.test(n) ? gray : TOKENS.categorical[i++ % (TOKENS.categorical.length - 1)]));
}
