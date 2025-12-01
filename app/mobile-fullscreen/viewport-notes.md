# 移动端全屏视口方案笔记（app/mobile-fullscreen/page.tsx）

- **改动内容**：  
  - 初始状态改为 `supportsDvh: null` + “检测中”标签，不再默认认为不支持 `dvh`。  
  - 在 `useProvideViewportStrategy` 里，用 `useLayoutEffect` + 微任务强制首帧前检测一次 `dvh` 支持，检测函数用 lodash `throttle(…, 200)` 包裹。  
  - `useViewportHeightPolyfill` 只在 `supportsDvh === false` 时设置 `--app-height`，检测中/支持 `dvh` 时不写 CSS 变量。  
  - 新增 `StrategyInfo` 组件展示当前方案标签。

- **改动目的**：首帧就选择正确的布局方案（原生 `dvh` 或 JS polyfill），避免直到触发一次 resize 才从 polyfill 切回 `dvh`。

- **`useProvideViewportStrategy` 职责与时机**：在 `useLayoutEffect` 中、DOM 提交后首帧绘制前运行；同步创建节流的检测函数 `commitStrategy`，用微任务立即调用它。lodash `throttle` 的首次调用是即时的，因此检测与随后的重渲染都在同一事件循环内完成。

- **同步/异步关系**：`useLayoutEffect` 本身是同步执行的，内部可以“安排”异步任务；微任务会在当前事件循环末尾、首帧前跑完。200ms 只用于节流后续的 resize / orientation 事件，并不会让首个检测延迟 200ms。

- **`useViewportHeightPolyfill` 行为**：在 `useLayoutEffect` 中运行；当 `supportsDvh === false` 时设置 `--app-height=innerHeight` 并绑定节流的 resize/orientation 监听；当浏览器支持 `dvh` 时移除该 CSS 变量且不做额外处理。初始“检测中”状态不会写入 CSS 变量。

- **对渲染的影响**：首次检测与可能的 polyfill 写入都发生在首帧前，无可见闪烁。之后仅在 resize/orientation 时更新，且有节流。

- **事件选择**：监听 `window` 的 `resize` / `orientationchange`（或兼容时用 `visualViewport.resize`）最合适，因为高度取自 `window.innerHeight`。用 `ResizeObserver` 观察元素无法可靠反映视觉视口高度变化，且有额外开销。

- **相较改动前**：初始状态从“假定不支持 `dvh`”改为“检测中”；挂载时通过微任务强制跑一次检测；仅在确认 `supportsDvh === false` 时执行 polyfill，避免在支持 `dvh` 的设备上多余写入。
