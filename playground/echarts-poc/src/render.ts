import * as echarts from 'echarts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EChartsOption } from 'echarts';
import { buildTheme } from './theme';
import { applyPalette, PRESETS, type Tokens } from './tokens';
import { SAMPLES } from './samples';
import type { ChartSpec } from './types';
import { SIZES } from './adapters/common';
import { donutAdapter } from './adapters/donut';
import { stackedBarHAdapter } from './adapters/stackedBarH';
import { horizontalBarAdapter } from './adapters/horizontalBar';
import { barLineComboAdapter } from './adapters/barLineCombo';
import { dualAxisBarLineAdapter } from './adapters/dualAxisBarLine';
import { probabilityRangeAdapter } from './adapters/probabilityRange';

const ADAPTERS: { [K in ChartSpec['type']]: (spec: any) => EChartsOption } = {
  donut: donutAdapter,
  stacked_bar_h: stackedBarHAdapter,
  horizontal_bar: horizontalBarAdapter,
  bar_line_combo: barLineComboAdapter,
  dual_axis_bar_line: dualAxisBarLineAdapter,
  probability_range: probabilityRangeAdapter,
};

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

/** CLI 参数（--palette / --tokens / --out），环境变量 PALETTE / TOKENS_FILE / OUT 亦可（CLI 优先） */
function cliArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const paletteName = cliArg('palette') ?? process.env.PALETTE ?? 'novark';
const tokensFile = cliArg('tokens') ?? process.env.TOKENS_FILE;
const outDir = path.resolve(ROOT, cliArg('out') ?? process.env.OUT ?? 'output');

// —— 定制配色：先选预设，再叠加 JSON 覆盖（均可选） ——
const patch: Partial<Tokens> | undefined = tokensFile
  ? JSON.parse(fs.readFileSync(path.resolve(tokensFile), 'utf8'))
  : undefined;
applyPalette(paletteName, patch);
echarts.registerTheme('novark', buildTheme() as any);

fs.mkdirSync(outDir, { recursive: true });

export function renderSpecToSVG(spec: ChartSpec): { svg: string; w: number; h: number } {
  const { w, h } = SIZES[spec.type];
  const chart = echarts.init(null, 'novark', { renderer: 'svg', ssr: true, width: w, height: h });
  try {
    chart.setOption(ADAPTERS[spec.type](spec));
    return { svg: chart.renderToSVGString(), w, h };
  } finally {
    chart.dispose();
  }
}

for (const [i, spec] of SAMPLES.entries()) {
  const { svg } = renderSpecToSVG(spec);
  const file = path.join(outDir, `${i + 1}-${spec.type}.svg`);
  fs.writeFileSync(file, svg, 'utf8');
  console.log(`✓ ${path.basename(file)}`);
}

// 给 screenshot.ts 的 contact sheet 标头用
fs.writeFileSync(
  path.join(outDir, 'meta.json'),
  JSON.stringify({ palette: tokensFile ? `${paletteName}+custom` : paletteName, presets: Object.keys(PRESETS) }, null, 2),
);

console.log(`\n${SAMPLES.length} SVG (palette: ${paletteName}${tokensFile ? ' + ' + tokensFile : ''}) -> ${outDir}`);
