export const TOKENS = {
  // 背景
  bg: '#0d0d0f',           // 近黑主背景
  surface: '#18181b',      // 卡片/表面
  divider: 'rgba(255,255,255,0.08)',

  // 橙色主色（三档）
  brand1: '#FF6B1A',       // 橙主
  brand2: '#FFB37A',       // 橙次
  brand3: '#FFD9B8',       // 橙浅

  // 多空语义色（v2 视觉调优：提亮增饱和，避免在近黑底上发灰发脏；
  // 只用于真正需要涨跌语义的地方——情景色带、±% 涨跌标签）
  bull: '#4ADE80',         // 牛市/看多 绿
  bear: '#F6465D',         // 熊市/看空 红
  // v2：弃用蓝绿趋势线（与橙主色相冲、观感突兀），
  // 非语义辅助线一律走中性亮色或 brand2/brand3 橙系
  trend: 'rgba(255,255,255,0.88)',

  // 文字三档透明度
  text1: 'rgba(255,255,255,0.92)',  // 主文字/大号数据
  text2: 'rgba(255,255,255,0.62)',  // 次要标签
  text3: 'rgba(255,255,255,0.38)',  // 轴/网格弱文字

  // 甜甜圈/多分类调色板(橙色系为主 + 灰做"其他")
  categorical: ['#FF6B1A', '#FF8C42', '#FFB37A', '#FFD9B8', '#C97B4A', 'rgba(255,255,255,0.22)'],

  // 字体
  // 注意：必须用单引号包字体名。zrender SSR 把 fontFamily 原样写进 SVG 的
  // style="..."（双引号定界）属性里，字体名再用双引号会截断属性，
  // 导致 font-family 为空、数字/英文回退到衬线体。
  fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', -apple-system, sans-serif",
} as const;
