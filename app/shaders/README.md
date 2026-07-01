# Paper Shaders 效果画廊 (`/shaders`)

用 [`@paper-design/shaders-react`](https://github.com/paper-design/shaders) 搭的冷色系
着色器展示页。5 个效果各占一个全屏 section，上下滚动逐个浏览，左上角标注效果名 + 一句话说明。

## 文件结构

```
app/shaders/
├── page.tsx                  # 页面外壳：按顺序排 5 个 section + 右侧锚点圆点导航
├── shader-section.tsx        # 通用外壳：IntersectionObserver 懒挂载 + 左上角标注 + 前景插槽
└── sections/
    ├── mesh-gradient-section.tsx   # 01 MeshGradient（hero）
    ├── pulsing-border-section.tsx  # 02 PulsingBorder（Siri 式边缘流光）
    ├── metaballs-section.tsx       # 03 Metaballs（融球）
    ├── liquid-metal-section.tsx    # 04 LiquidMetal（液态金属）
    └── neuro-noise-section.tsx     # 05 NeuroNoise（分形神经纹理）
```

## 设计要点

- **版本 pin 死**：`package.json` 里是 `"@paper-design/shaders-react": "0.0.76"`（精确版本，
  无 `^`）。该库处于 `0.0.x`，任何小版本都可能引入 breaking change，务必别改成 range。
- **`'use client'`**：所有用到 shader 的组件文件顶部都加了。shader 依赖 WebGL / rAF，只能在
  客户端跑。
- **shader 作背景层**：每个 shader 通过 `shaderFill`（`position:absolute; inset:0; width/height:100%`）
  铺满 section，`z-0`；真实文字/按钮是正常 DOM，`z-10` 叠在上面。
- **懒挂载 / 卸载（关键性能约束）**：`ShaderSection` 用 `IntersectionObserver` 监听自身，
  只有进入视口（含上下各 300px 预加载余量）时才把 shader 挂进 DOM，离开就卸载。
  每个 shader 各占一个 WebGL context，浏览器每个标签页上限约 16 个——懒挂载保证同一时刻
  最多 2~3 个 context 存活。
- **配色**：统一走青蓝 / teal / cyan 冷色 + 深色背景（`#05060a`），不用粉紫。

## 调参

每个效果的关键参数都抽成了对应 section 组件的 **props** 并给了合理默认值。想改就在
`page.tsx` 里给对应组件传值即可，例如：

```tsx
// 让融球更多更慢
<MetaballsSection count={12} size={0.7} speed={0.6} />

// 换 MeshGradient 的配色 / 扰动
<MeshGradientSection
  colors={["#0b1220", "#0891b2", "#2563eb", "#10b981"]}
  distortion={0.8}
  swirl={0.6}
  speed={0.3}
/>
```

各 section 支持的 props（均可选，含默认值，见各文件顶部注释）：

| Section | 主要 props |
| --- | --- |
| `MeshGradientSection` | `colors` `distortion` `swirl` `speed` |
| `PulsingBorderSection` | `colors` `colorBack` `speed` `thickness` `softness` `intensity` `bloom` `spots` `spotSize` `pulse` `smoke` `roundness` |
| `MetaballsSection` | `colors` `colorBack` `count` `size` `speed` |
| `LiquidMetalSection` | `colorBack` `colorTint` `distortion` `speed` `scale` `shape` `image` |
| `NeuroNoiseSection` | `colorFront` `colorMid` `colorBack` `brightness` `contrast` `speed` `scale` |

## 替换效果

- **换成别的 shader**：`@paper-design/shaders-react` 还导出 `Warp` `GodRays` `Voronoi`
  `DotOrbit` `Spiral` `GrainGradient` 等。照着某个 section 文件复制一份，换掉 import 的组件名
  和 props，再在 `page.tsx` 的 `NAV` 数组和 JSX 里加一条即可。
- **给 LiquidMetal 套自定义 logo**：`LiquidMetalSection` 支持 `image` prop（一张 logo 的
  URL，PNG/SVG 皆可，库会把它当作材质遮罩）。传了 `image` 就忽略内置 `shape`：

  ```tsx
  <LiquidMetalSection image="/my-logo.png" colorTint="#e0f2fe" />
  ```

## 可选：接 Leva 实时调参

想要一个悬浮面板实时拖参数，装 [`leva`](https://github.com/pmndrs/leva) 即可（默认没装，
避免多引一个依赖）：

```bash
npm i leva
```

然后在某个 section 里用 `useControls` 把默认值接上（记得该组件已经是 `'use client'`）：

```tsx
"use client";
import { useControls } from "leva";
import { Metaballs } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

export function MetaballsSection() {
  const { count, size, speed } = useControls("Metaballs", {
    count: { value: 8, min: 1, max: 20, step: 1 },
    size: { value: 0.8, min: 0, max: 1, step: 0.01 },
    speed: { value: 1, min: 0, max: 3, step: 0.1 },
  });
  return (
    <ShaderSection id="metaballs" index="03" name="Metaballs" description="…">
      <Metaballs
        colors={["#22d3ee", "#06b6d4", "#0891b2", "#2563eb", "#10b981"]}
        colorBack="#05060a"
        count={count}
        size={size}
        speed={speed}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
```

`<Leva />` 面板组件建议只在这一个页面挂一次（放 `page.tsx` 顶部），别放进 `layout.tsx`
以免污染其它 demo。
