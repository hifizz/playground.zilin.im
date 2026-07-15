import { TOKENS, type Tokens } from './tokens';

/**
 * NOVARK 深色主题 —— 只管全局默认：背景、字体、调色板、轴、图例。
 * 用当前 TOKENS 动态构建（支持 applyPalette 换肤后重建），
 * 用法: echarts.registerTheme('novark', buildTheme())
 */
export function buildTheme(t: Tokens = TOKENS) {
  return {
    backgroundColor: t.bg,
    color: [...t.categorical],

    textStyle: {
      fontFamily: t.fontFamily,
      color: t.text2,
    },

    title: {
      textStyle: { color: t.text1, fontSize: 21, fontWeight: 700 },
      subtextStyle: { color: t.text3, fontSize: 12 },
    },

    legend: {
      textStyle: { color: t.text2, fontSize: 12 },
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 18,
    },

    categoryAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: t.text2, fontSize: 12, margin: 12 },
      splitLine: { show: false },
    },

    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: t.text3, fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: t.divider, width: 1 } },
    },

    // 静态出图不用 tooltip，但注册主题时给一套一致的深色样式，避免误用时出现白底
    tooltip: {
      backgroundColor: t.surface,
      borderColor: t.divider,
      textStyle: { color: t.text1 },
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
      itemStyle: { borderColor: t.bg, borderWidth: 2 },
      label: { color: t.text2 },
      labelLine: { lineStyle: { color: 'rgba(255,255,255,0.20)' } },
    },
  };
}
