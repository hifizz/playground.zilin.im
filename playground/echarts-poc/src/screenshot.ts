import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TOKENS } from './tokens';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const argIdx = process.argv.indexOf('--out');
const OUT_DIR = path.resolve(ROOT, argIdx >= 0 ? process.argv[argIdx + 1] : (process.env.OUT ?? 'output'));
const SCALE = 2; // 2x 截图，文字更接近真实长图导出质量

function pageHtml(body: string, bg: string = TOKENS.bg): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; }
    html, body { background: ${bg}; }
    svg { display: block; }
  </style></head><body>${body}</body></html>`;
}

async function main() {
  const svgFiles = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.svg'))
    .sort();
  if (svgFiles.length === 0) throw new Error('output/ 里没有 SVG，先跑 npm run render');

  // 容器里预装了 Chromium（/opt/pw-browsers），与 playwright 包版本解耦
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  });
  const ctx = await browser.newContext({ deviceScaleFactor: SCALE });
  const page = await ctx.newPage();

  // —— 单张截图 ——
  for (const f of svgFiles) {
    const svg = fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
    const wm = svg.match(/width="(\d+)"/);
    const hm = svg.match(/height="(\d+)"/);
    const w = wm ? Number(wm[1]) : 880;
    const h = hm ? Number(hm[1]) : 600;
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(pageHtml(svg), { waitUntil: 'networkidle' });
    const png = path.join(OUT_DIR, f.replace(/\.svg$/, '.png'));
    await page.screenshot({ path: png });
    console.log(`✓ ${path.basename(png)}`);
  }

  // —— contact sheet：2 列网格，一次看全 ——
  const GAP = 28;
  const CELL_W = 880;
  const sheetBg = '#070708';
  const cells = svgFiles
    .map((f) => {
      const svg = fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
      return `<div class="cell">${svg}</div>`;
    })
    .join('');
  const sheetW = GAP * 3 + CELL_W * 2;
  let paletteLabel = '';
  try {
    paletteLabel = ` · palette: ${JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'meta.json'), 'utf8')).palette}`;
  } catch {}
  const html = pageHtml(
    `<div class="sheet">
       <div class="head">NOVARK · ECharts SSR POC — 深色主题 6 图（880px 宽 / SVG 渲染 / 2x 截图）${paletteLabel}</div>
       <div class="grid">${cells}</div>
     </div>
     <style>
       .sheet { padding: ${GAP}px; width: ${sheetW - GAP * 2}px; }
       .head { color: rgba(255,255,255,0.45); font: 500 14px ${TOKENS.fontFamily}; margin: 4px 2px 18px; letter-spacing: 0.5px; }
       .grid { display: grid; grid-template-columns: repeat(2, ${CELL_W}px); gap: ${GAP}px; align-items: start; }
       .cell { border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; line-height: 0; }
     </style>`,
    sheetBg,
  );
  await page.setViewportSize({ width: sheetW, height: 1200 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT_DIR, 'contact-sheet.png'), fullPage: true });
  console.log('✓ contact-sheet.png');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
