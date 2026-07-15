import type { ChartSpec } from './types';

export const SAMPLES: ChartSpec[] = [
  {
    type: 'donut',
    title: '地区维度（FY2025）',
    center_label: '海外占比',
    center_value: '43.8%',
    data: [
      { name: '中国大陆', pct: 56.2, value_yi: 208.5 },
      { name: '亚太', pct: 21.6, value_yi: 80.1 },
      { name: '美洲', pct: 18.3, value_yi: 68.1 },
      { name: '欧洲及其他', pct: 3.9, value_yi: 14.5 },
    ],
    annotation: '海外占比从 FY2024 的 31.8% 快速提升至 43.8%，是结构性变化。',
  },
  {
    type: 'stacked_bar_h',
    title: 'IP 维度（FY2025）',
    data: [
      { name: 'THE MONSTERS', pct: 38.1, value_yi: 141.6 },
      { name: 'SKULLPANDA', pct: 9.5, value_yi: 35.4 },
      { name: 'CRYBABY', pct: 7.9, value_yi: 29.3 },
      { name: 'MOLLY', pct: 7.8, value_yi: 29.0 },
      { name: 'DIMOO', pct: 7.5, value_yi: 27.8 },
      { name: '其他IP', pct: 29.2, value_yi: 108.1 },
    ],
  },
  {
    type: 'horizontal_bar',
    title: '同业估值倍数对比',
    data: [
      { name: 'Funko', pe: 8, gross_margin: 50 },
      { name: '泡泡玛特', pe: 13.8, gross_margin: 72, highlight: true },
      { name: '开云集团', pe: 15, gross_margin: 73 },
      { name: '万代南梦宫', pe: 18, gross_margin: 35 },
      { name: 'LVMH', pe: 20, gross_margin: 70 },
      { name: '迪士尼', pe: 22, gross_margin: 35 },
      { name: '乐高', pe: 25, gross_margin: 65 },
    ],
  },
  {
    type: 'bar_line_combo',
    title: '分期增速拆解',
    data: {
      periods: ['FY24H1', 'FY24H2', 'FY25H1', 'FY25H2', 'FY25Q4'],
      bar: { name: '收入（亿元）', values: [45.0, 85.4, 138.8, 232.4, 102.0] },
      line: { name: '归母净利润（亿元）', values: [9.0, 22.0, 47.0, 83.8, 35.0] },
    },
  },
  {
    type: 'dual_axis_bar_line',
    title: '年度财务表 FY2021-FY2025',
    data: {
      periods: ['FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025'],
      bars: [
        { name: '收入（亿元）', values: [44.9, 46.2, 63.0, 130.4, 371.2] },
        { name: '归母净利润（亿元）', values: [8.5, 4.8, 11.0, 31.0, 130.4] },
      ],
      lines: [
        { name: '毛利率', values: [61.4, 57.5, 61.3, 66.8, 72.1], axis: 'right_pct' },
        { name: '净利率', values: [18.9, 10.4, 17.5, 23.8, 35.2], axis: 'right_pct' },
      ],
    },
  },
  {
    type: 'probability_range',
    title: '情景分析与期望回报',
    data: {
      current_price: 149.6,
      expected_value: 215,
      expected_upside_pct: 44,
      scenarios: [
        { name: '牛市', low: 290, high: 330, anchor: 320, anchor_change_pct: 114, probability: 25 },
        { name: '基准', low: 180, high: 220, anchor: 200, anchor_change_pct: 34, probability: 45 },
        { name: '熊市', low: 100, high: 140, anchor: 120, anchor_change_pct: -20, probability: 30 },
      ],
    },
  },
];
