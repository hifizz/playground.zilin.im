import { TOKENS } from './tokens';

/**
 * NOVARK 深色橙主题 —— 只管全局默认：背景、字体、调色板、轴、图例。
 * 用法: echarts.registerTheme('novark', novarkTheme)
 */
export const novarkTheme = {
  backgroundColor: TOKENS.bg,
  color: [...TOKENS.categorical],

  textStyle: {
    fontFamily: TOKENS.fontFamily,
    color: TOKENS.text2,
  },

  title: {
    textStyle: { color: TOKENS.text1, fontSize: 21, fontWeight: 700 },
    subtextStyle: { color: TOKENS.text3, fontSize: 12 },
  },

  legend: {
    textStyle: { color: TOKENS.text2, fontSize: 12 },
    itemWidth: 14,
    itemHeight: 8,
    itemGap: 18,
  },

  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: TOKENS.text2, fontSize: 12, margin: 12 },
    splitLine: { show: false },
  },

  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: TOKENS.text3, fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: TOKENS.divider, width: 1 } },
  },

  // 静态出图不用 tooltip，但注册主题时给一套一致的深色样式，避免误用时出现白底
  tooltip: {
    backgroundColor: TOKENS.surface,
    borderColor: TOKENS.divider,
    textStyle: { color: TOKENS.text1 },
  },

  bar: {
    itemStyle: { borderRadius: [6, 6, 0, 0] },
  },

  line: {
    smooth: false,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { width: 2.5 },
  },

  pie: {
    itemStyle: { borderColor: TOKENS.bg, borderWidth: 2 },
    label: { color: TOKENS.text2 },
    labelLine: { lineStyle: { color: 'rgba(255,255,255,0.20)' } },
  },
} as const;
