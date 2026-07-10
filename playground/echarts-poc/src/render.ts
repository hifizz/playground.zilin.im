import * as echarts from 'echarts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EChartsOption } from 'echarts';
import { novarkTheme } from './theme';
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

echarts.registerTheme('novark', novarkTheme as any);

const OUT_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../output');
fs.mkdirSync(OUT_DIR, { recursive: true });

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
  const file = path.join(OUT_DIR, `${i + 1}-${spec.type}.svg`);
  fs.writeFileSync(file, svg, 'utf8');
  console.log(`✓ ${path.basename(file)}`);
}
console.log(`\n${SAMPLES.length} SVG -> ${OUT_DIR}`);
