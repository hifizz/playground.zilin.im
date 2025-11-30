
# 移动端全屏布局解决方案调研与最佳实践报告

> **文档摘要**：本文档详细记录了移动端 Web 开发中“视口高度（Viewport Height）”适配问题的调研过程。通过对比原生 CSS 新单位（svh/lvh/dvh）与社区主流 JS 方案（如 `react-viewport-height`），我们最终确定了一套**基于特性检测的渐进增强（Hybrid Progressive Enhancement）策略**。该方案旨在同时实现极致的性能（Modern Devices）和完美的兼容性（Legacy Devices）。

* * *

## 1\. 问题背景：移动端 `100vh` 的“破碎”体验

在桌面端，`height: 100vh` 是实现全屏的标准做法。但在移动端（尤其是 iOS Safari 和 Android Chrome），浏览器的用户界面（Address Bar, Toolbar）是动态伸缩的，导致以下严重问题：

1. **底部遮挡**：当地址栏展开时，`100vh` 计算的是视口最大高度，导致页面底部的按钮或导航栏被浏览器工具栏遮挡。

2. **布局跳动 (Jitter)**：如果强行用 JS 监听 `resize` 来实时改变高度，用户滑动时会导致页面布局疯狂重绘，视觉体验极差。

3. **空间浪费**：如果只适配小屏状态，当地址栏收起时，页面底部会出现空白。

* * *

## 2\. 方案调研与深度对比

在制定方案前，我们深入调研了业界现有的两类主流方向：**CSS 新视口单位**与**社区 JS 库方案**。

### 2.1 方向一：原生 CSS 新视口单位 (`svh`, `lvh`, `dvh`)

W3C 为了解决此问题引入了一系列新单位，但它们各有优劣：

| 单位 | 全称 | 行为特征 | 致命缺陷 |
| --- | --- | --- | --- |
| vh | Viewport Height | 静态，通常等于“地址栏收起”时的高度。 | 严重遮挡。地址栏展开时，内容被盖住。 |
| svh | Small Viewport Height | 总是等于“地址栏展开”时的可视高度（最小高度）。 | 空间浪费。当用户滚动导致地址栏收起时，页面无法填满屏幕，像个“半屏应用”。 |
| lvh | Large Viewport Height | 总是等于“地址栏收起”时的可视高度（最大高度）。 | 同 vh。在地址栏展开时存在遮挡。 |
| dvh | Dynamic Viewport Height | 随 UI 动态变化。浏览器原生处理，无 JS 开销。 | 兼容性断层。仅支持 iOS 15.4+ 和 Chrome 108+。在旧设备（如 iPhone X 时代的系统）上完全失效。 |

**结论**：`dvh` 是理想的终极方案，但直接使用会导致旧设备用户无法正常浏览，无法单独作为生产环境方案。

### 2.2 方向二：社区 JS 库方案 (如 `react-viewport-height`)

社区存在大量类似 `useVH` 或 `react-viewport-height` 的库，其核心逻辑是\*\*“全量 JS 模拟”\*\*。

* **原理**：无论设备新旧，一律监听 `window.resize` 和 `orientationchange`，计算 `window.innerHeight` 并写入 CSS 变量 `--vh`。

* **优点**：兼容性极好，计算精确。

* **缺点**：

  * **性能浪费**：对于 90% 以上支持 `dvh` 的现代手机，JS 监听是多余的。它占用了主线程资源，且在某些安卓低端机上可能引起滚动卡顿。

  * **加载闪烁**：JS 执行通常晚于 CSS 渲染，可能导致首屏高度瞬间跳变。

* * *

## 3\. 最终决策：混合渐进增强策略 (Our Solution)

经过对比，我们拒绝了“纯 CSS（兼容性差）”和“纯 JS（性能浪费）”的极端方案，选择了 **Hybrid Progressive Enhancement（混合渐进增强）** 策略。

### 3.1 核心逻辑图解

我们利用 `window.CSS.supports` 进行特性检测，动态分流：

```Mermaid
graph TD
    A[应用初始化] --> B{浏览器支持 'height: 100dvh' ?}
    B -- Yes (Modern iOS/Android) --> C["✅ CSS Native Mode"]
    C --> D[直接应用 height: 100dvh]
    D --> E["JS 逻辑静默 (无 Resize 监听, 0 开销)"]
    B -- No (Legacy Devices) --> F["⚠️ JS Polyfill Mode"]
    F --> G[启动 Resize/Orientation 监听]
    F --> H[计算 window.innerHeight]
    H --> I[写入 CSS 变量 --app-height]
    I --> J["应用 height: var(--app-height)"]
```

### 3.2 方案全维度对比矩阵

| 维度 | 方案 A: 纯 100dvh | 方案 B: 社区 JS 库 (useVH) | 方案 C: 我们的混合策略 |
| --- | --- | --- | --- |
| 兼容性 | ❌ 差 (放弃旧设备) | ✅ 优 (全覆盖) | ✅ 优 (全覆盖) |
| 运行时性能 | ✅ 最佳 (无 JS) | ❌ 中 (强制 JS 监听) | ✅ 最佳 (按需启动 JS) |
| 代码体积 | ✅ 零 | ⚠️ 小 (需引入库) | ⚠️ 小 (仅几十行代码) |
| SSR 友好度 | ✅ 无跳变 | ⚠️ 必定跳变 (Hydration Mismatch) | ✅ 大部分无跳变 (现代设备走 CSS) |
| 维护成本 | ✅ 低 | ✅ 低 | ⚠️ 中 (需维护检测逻辑) |

**决策依据**： 我们的方案完美结合了 **方案 A 的性能** 和 **方案 B 的兼容性**。在 2025 年的设备环境下，绝大多数用户将享受到原生 CSS 的流畅体验，而旧设备用户依然能获得功能完整的兜底支持。

* * *

## 4\. 实施指南 (Integration Guide)

### 4.1 引入 Provider

在根组件（`layout.tsx` 或 `App.tsx`）中初始化检测逻辑。

```typescript
import { ViewportStrategyProvider } from "@/hooks/use-mobile-viewport";

export default function RootLayout({ children }) {
  return (
    <ViewportStrategyProvider>
      {children}
    </ViewportStrategyProvider>
  );
}
```

### 4.2 配置 CSS / Tailwind

这是本方案的关键。我们需要定义一个**智能 CSS 类**，它能根据环境自动切换取值来源。

**Tailwind CSS 写法 (推荐):**

```css
@layer utilities {
  .h-dynamic-screen {
    /* Level 1: 兜底方案 (JS 未加载或极旧设备) */
    height: 100vh;

    /* Level 2: JS Polyfill 方案 (通过 var 覆盖) */
    height: var(--app-height, 100vh);
  }

  /* Level 3: 现代浏览器原生方案 (优先级最高，覆盖 JS 变量) */
  @supports (height: 100dvh) {
    .h-dynamic-screen {
      height: 100dvh;
    }
  }
}
```

### 4.3 页面应用

在任何需要全屏的容器上使用 `.h-dynamic-screen`。

```typescript
<div className="h-dynamic-screen flex flex-col overflow-hidden">
  <Header />
  <main className="flex-1 overflow-y-auto">
    {/* 滚动内容区 */}
  </main>
  <Footer />
</div>
```

* * *

## 5\. 风险评估与注意事项

尽管本方案已是最优解，但仍需注意以下边缘情况：

1. **SSR Hydration Mismatch (水合不匹配)**：

    * **现象**：服务端无法预知视口高度，初始 HTML 只能给 `100vh`。客户端 JS 加载后可能会微调高度。

    * **优势**：由于现代浏览器（占绝大多数）命中 `@supports (height: 100dvh)`，它们会直接使用 CSS 渲染，**不会**发生因 JS 变量注入导致的视觉跳变。只有旧设备可能会有一次微小的重绘。

2. **软键盘交互**：

    * 无论是 `dvh` 还是 JS Polyfill，在软键盘弹出时，可视区域都会变小。这是符合预期的标准行为。如果需要键盘覆盖在内容之上（而不是挤压内容），请尽量避免在全屏 Flex 布局中使用 Input，或使用 `fixed` 定位处理特定层级。

3. **Safari 的弹性滚动**：

    * 建议在 `body` 或根容器上设置 `overscroll-behavior-y: none;` 以防止全屏应用被整体拖拽。

* * *
