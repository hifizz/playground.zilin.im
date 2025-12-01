# use-mobile-viewport 使用说明

下面的步骤可直接复制到你的项目，帮助在移动端规避浏览器地址栏导致的 100vh 问题。

## 1. 在根布局包裹 Provider

在 `app/layout.tsx`（或页面组件）中包裹 `ViewportStrategyProvider`。它会检测浏览器是否支持 `dvh`，并在不支持时自动写入 `--app-height` 变量。

```tsx
// app/layout.tsx
import "./globals.css";
import { ViewportStrategyProvider } from "./mobile-fullscreen/hooks/use-mobile-viewport";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <ViewportStrategyProvider>
          {children}
        </ViewportStrategyProvider>
      </body>
    </html>
  );
}
```

## 2. 添加 CSS，优先用原生 dvh，回退到 JS Polyfill

把以下样式放到全局样式（如 `app/globals.css`）。当浏览器支持 `100dvh` 时使用原生；否则使用 `--app-height`（由 Provider 写入）。

```css
:root {
  /* 现代浏览器优先：动态视口高度 */
  min-height: 100dvh;
  height: 100dvh;
}

/* Polyfill 回退方案：Provider 会写入 --app-height */
body {
  min-height: 100vh;
  min-height: var(--app-height, 100vh);
  height: var(--app-height, 100vh);
  margin: 0;
  background: #f8fafc;
}
```

## 3. 在页面中创建可视区域容器

将需要全屏显示的内容放在一个容器里，使其高度跟随上面的变量。示例使用 Tailwind，如果不用 Tailwind，可直接用下方纯 CSS。

```tsx
// 任意页面组件
export default function MobileShell() {
  return (
    <div className="min-h-[100vh] min-h-[var(--app-height)] bg-white flex flex-col">
      <header className="p-4 border-b">顶部导航</header>
      <main className="flex-1 overflow-auto p-4">主体内容</main>
      <footer className="p-4 border-t">底部栏</footer>
    </div>
  );
}
```

纯 CSS 写法：

```css
.app-shell {
  min-height: 100vh;
  min-height: var(--app-height, 100vh);
  display: flex;
  flex-direction: column;
  background: #fff;
}
.app-shell__main {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
```

```html
<div class="app-shell">
  <header>顶部导航</header>
  <main class="app-shell__main">主体内容</main>
  <footer>底部栏</footer>
 </div>
```

## 4. 调试建议

- 旋转设备或拉伸浏览器时观察高度变化，地址栏收起/展开后容器仍应贴合屏幕。
- 如果自定义容器高度，请始终包含 `min-height: var(--app-height, 100vh)` 这一行，确保 Polyfill 生效。
