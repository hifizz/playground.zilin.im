/**
 * 设计 Token —— 可定制配色。
 *
 * 三种定制方式（优先级从低到高）：
 *   1. 内置预设：  applyPalette('sapphire')          // PRESETS 里挑一套
 *   2. JSON 覆盖： applyPalette('novark', jsonPatch)  // 部分字段覆盖，如 CLI --tokens my.json
 *   3. 代码 patch： applyPalette({ brand1: '#...' })  // 直接传 Partial<Tokens>
 *
 * adapter / theme 一律在函数体内读 TOKENS.*（不要在模块顶层解构缓存），
 * 这样 applyPalette 之后重新渲染即可全量换肤。
 */
export interface Tokens {
  // 背景
  bg: string;           // 近黑主背景
  surface: string;      // 卡片/表面
  divider: string;

  // 品牌主色（三档：主/次/浅）
  brand1: string;
  brand2: string;
  brand3: string;

  // 多空语义色（只用于真正的涨跌语义：情景色带、±% 标签）
  bull: string;
  bear: string;
  // 非语义辅助线：中性亮色（v2 起弃用蓝绿趋势线，避免与主色相冲）
  trend: string;

  // 文字三档透明度
  text1: string;
  text2: string;
  text3: string;

  // 甜甜圈/多分类调色板（主色同族渐变 + 灰做"其他"）
  categorical: string[];

  // 字体
  fontFamily: string;
}

// 注意：fontFamily 必须用单引号包字体名。zrender SSR 把它原样写进 SVG 的
// style="..."（双引号定界）属性里，字体名再用双引号会截断属性，
// 导致 font-family 为空、数字/英文回退到衬线体。
const FONT = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', -apple-system, sans-serif";

/** NOVARK 默认：深底 + 橙 */
const NOVARK: Tokens = {
  bg: '#0d0d0f',
  surface: '#18181b',
  divider: 'rgba(255,255,255,0.08)',

  brand1: '#FF6B1A',
  brand2: '#FFB37A',
  brand3: '#FFD9B8',

  // v2 视觉调优：提亮增饱和，避免在近黑底上发灰发脏
  bull: '#4ADE80',
  bear: '#F6465D',
  trend: 'rgba(255,255,255,0.88)',

  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.62)',
  text3: 'rgba(255,255,255,0.38)',

  categorical: ['#FF6B1A', '#FF8C42', '#FFB37A', '#FFD9B8', '#C97B4A', 'rgba(255,255,255,0.22)'],

  fontFamily: FONT,
};

/** 内置预设：只声明与 NOVARK 的差异（品牌三档 + 分类调色板），深底/文字/语义色共享 */
export const PRESETS: Record<string, Partial<Tokens>> = {
  novark: {},

  // 深海蓝
  sapphire: {
    brand1: '#4D8DFF',
    brand2: '#8FB8FF',
    brand3: '#C7DBFF',
    categorical: ['#4D8DFF', '#6FA2FF', '#8FB8FF', '#C7DBFF', '#3E6DC4', 'rgba(255,255,255,0.22)'],
  },

  // 鎏金
  aurum: {
    brand1: '#F0B429',
    brand2: '#F7CE68',
    brand3: '#FBE3A3',
    categorical: ['#F0B429', '#F4C24A', '#F7CE68', '#FBE3A3', '#B08420', 'rgba(255,255,255,0.22)'],
  },

  // 紫罗兰
  violet: {
    brand1: '#9D7BFF',
    brand2: '#BCA3FF',
    brand3: '#DDCFFF',
    categorical: ['#9D7BFF', '#AD8EFF', '#BCA3FF', '#DDCFFF', '#6D4FC4', 'rgba(255,255,255,0.22)'],
  },
};

/** 当前生效的 token（可变对象，applyPalette 原地换值） */
export const TOKENS: Tokens = { ...NOVARK, categorical: [...NOVARK.categorical] };

/**
 * 切换配色：presetOrPatch 可以是预设名或 Partial<Tokens>，patch 再叠加细调。
 * 始终从 NOVARK 基线合成，保证可重复调用、结果确定。
 */
export function applyPalette(presetOrPatch: string | Partial<Tokens> = 'novark', patch?: Partial<Tokens>): Tokens {
  let base: Partial<Tokens>;
  if (typeof presetOrPatch === 'string') {
    const preset = PRESETS[presetOrPatch];
    if (!preset) {
      throw new Error(`未知配色预设 "${presetOrPatch}"，可选：${Object.keys(PRESETS).join(', ')}`);
    }
    base = preset;
  } else {
    base = presetOrPatch;
  }
  const next: Tokens = { ...NOVARK, ...base, ...patch };
  Object.assign(TOKENS, next, { categorical: [...next.categorical] });
  return TOKENS;
}
