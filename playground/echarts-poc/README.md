# echarts-novark-poc

「简化图表 spec → ECharts SSR → 深色报告风 SVG/PNG」的视觉验证 POC。
纯 TypeScript + Node（无前端框架），`renderToSVGString()` 出 SVG，Playwright 截 2x PNG。

## 运行

```bash
npm install
npm run all          # render（SVG）+ shot（PNG + contact-sheet），产物在 output/
```

单独跑：`npm run render` / `npm run shot`。

## 架构

```
src/
├── tokens.ts        # 设计 token + 配色预设 + applyPalette()
├── theme.ts         # buildTheme(): token -> ECharts 全局主题（registerTheme 用）
├── types.ts         # ChartSpec 六种图表的输入 schema（与文字层约定，勿改字段名）
├── samples.ts       # 样例数据（泡泡玛特报告）
├── adapters/        # 每种图表一个 adapter：(spec) => EChartsOption
│   └── common.ts    # 尺寸表、标题头/脚注 graphic、色彩工具（withAlpha / relLuminance）
├── render.ts        # spec -> SVG 文件
└── screenshot.ts    # SVG -> PNG + contact-sheet 拼图
```

分层约定：**theme 管全局（背景/字体/轴/图例），adapter 只管构图**；颜色一律取
`TOKENS.*`（在函数体内读取，不要模块顶层缓存），保证换肤即生效。

## 定制配色

三种方式，可叠加（预设 → JSON 覆盖 → 代码 patch）：

**1. 内置预设**（`src/tokens.ts` 的 `PRESETS`：`novark` 橙 / `sapphire` 蓝 / `aurum` 金 / `violet` 紫）

```bash
npm run render -- --palette sapphire --out output/palette-sapphire
npm run shot   -- --out output/palette-sapphire
# 也支持环境变量：PALETTE=sapphire OUT=output/x npm run all
```

**2. JSON 覆盖**（部分字段即可，见 `palettes/custom-example.json`）

```bash
npm run render -- --tokens palettes/custom-example.json --out output/custom
npm run shot   -- --out output/custom
```

**3. 代码 patch**（作为库使用时）

```ts
import { applyPalette } from './src/tokens';
applyPalette('aurum', { bear: '#FF4D6D' });   // 预设 + 细调
applyPalette({ brand1: '#0EA5E9', ... });     // 或纯自定义
```

新增一套品牌色的最小字段：`brand1/2/3` + `categorical`（6 档：主色同族渐变 + 末位灰
做"其他"）。深底、文字三档、多空语义色（bull/bear，只用于涨跌语义）默认共享，可覆盖。
段内文字深/白墨按 `relLuminance` 自动切换，浅色系（金/浅蓝）无需额外适配。

效果参考：`output/contact-sheet.png`（默认橙）、`output/palette-sapphire/`、
`output/palette-aurum/`。

## 已知坑（生产化前必读）

- **字体栈必须单引号**：zrender SSR 把 `fontFamily` 原样写进 SVG 的 `style="..."`
  （双引号定界）属性，字体名用双引号会截断属性，数字/英文回退衬线体。
- 无头 Linux 需要 CJK 字体（本 POC 容器装了 Noto Sans CJK，并用 fontconfig 把
  PingFang SC / Microsoft YaHei 别名过去）。
- category 轴 `inverse: true` 会翻转竖直 markLine 的 start/end，标签位置要跟着换。
- 双轴图折线标签与柱顶数值天然易撞，`dualAxisBarLine.ts` 里按两轴像素几何逐点避让
  （top → bottom → right）。
