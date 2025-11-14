"use client";

import React, { useLayoutEffect, useState, useEffect } from "react";
// 为了在 React 中使用图标，通常会使用一个库，这里我们用 SVG 模拟图标
// 在实际项目中，可以替换为 `lucide-react` 或其他图标库
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * [社区最佳实践 - 渐进增强版]
 * 这是一个自定义Hook，用于解决移动端100vh的布局问题。
 * 它会先检测浏览器是否支持dvh单位，如果支持，则不执行任何操作，依赖纯CSS方案。
 * 如果不支持，它会通过JS计算实时高度作为兜底方案(Polyfill)。
 */
const useDynamicViewportHeight = () => {
  useLayoutEffect(() => {
    // 1. 特性检测：如果浏览器支持dvh，则不执行JS逻辑，依赖纯CSS。
    if (
      window.CSS &&
      window.CSS.supports &&
      window.CSS.supports("height", "100dvh")
    ) {
      return;
    }

    // 2. 降级方案：对于不支持dvh的旧版浏览器，使用JS计算并设置高度。
    const setAppHeight = () => {
      const appHeight = window.innerHeight + "px";
      document.documentElement.style.setProperty("--app-height", appHeight);
    };

    setAppHeight();
    window.addEventListener("resize", setAppHeight);
    window.addEventListener("orientationchange", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.removeEventListener("orientationchange", setAppHeight);
    };
  }, []);
};

// [新增] 这是一个独立的组件，用于检测并显示当前所采用的布局方案。
// 它的逻辑与核心实现完全解耦。
const StrategyInfo = () => {
  const [strategy, setStrategy] = useState("检测中...");

  useEffect(() => {
    // 此检测逻辑在组件挂载后于客户端执行
    // 与 useDynamicViewportHeight Hook 中的检测逻辑保持一致
    if (
      window.CSS &&
      window.CSS.supports &&
      window.CSS.supports("height", "100dvh")
    ) {
      setStrategy("原生 CSS `dvh` 方案 (性能最佳)");
    } else {
      setStrategy("JavaScript Polyfill `--app-height` 方案 (兼容性最佳)");
    }
  }, []); // 空依赖数组确保此 effect 仅在挂载时运行一次

  return (
    <div className="bg-white p-6 rounded-lg shadow text-gray-600">
      <h3 className="font-bold mb-1">当前布局方案:</h3>
      <p>{strategy}</p>
    </div>
  );
};

// Header Component (Single Responsibility: Displaying the header)
const Header = () => {
  return (
    <header className="bg-white shadow-md w-full p-4 flex items-center justify-center z-10">
      <h1 className="text-xl font-bold text-gray-800">移动应用标题</h1>
    </header>
  );
};

// Footer Component (Single Responsibility: Displaying the footer navigation)
const Footer = () => {
  return (
    <footer className="bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] w-full p-2 z-10">
      <nav className="flex justify-around items-center">
        <a
          href="#home"
          className="flex flex-col items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <HomeIcon />
          <span className="text-xs mt-1">首页</span>
        </a>
        <a
          href="#search"
          className="flex flex-col items-center text-gray-600 hover:text-blue-800 transition-colors"
        >
          <SearchIcon />
          <span className="text-xs mt-1">发现</span>
        </a>
        <a
          href="#profile"
          className="flex flex-col items-center text-gray-600 hover:text-blue-800 transition-colors"
        >
          <UserIcon />
          <span className="text-xs mt-1">我的</span>
        </a>
      </nav>
    </footer>
  );
};

// Main Scrollable Content (Single Responsibility: Displaying page content)
const PageContent = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">欢迎！</h2>
        <p className="text-gray-600">
          向下滚动以查看更多内容。此布局可以完美适配移动设备，并解决了 iOS
          浏览器滚动时底部工具栏高度变化带来的页面跳动问题。
        </p>
      </div>

      {/* 在这里新增了用于展示当前方案的组件 */}
      <StrategyInfo />

      {Array.from({ length: 20 }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
      <div className="bg-white p-6 rounded-lg shadow mt-4 text-center">
        <p className="text-gray-700 font-semibold">内容到底啦！</p>
      </div>
    </div>
  );
};

// Layout Component (Single Responsibility: Defining the page grid structure)
const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  // 调用自定义Hook来激活动态高度计算（如果需要）
  useDynamicViewportHeight();

  return (
    <>
      <style>{`
        .h-dynamic-screen {
          /* 降级方案：由JS Hook提供值。100vh是JS失效时的备用 */
          height: var(--app-height, 100vh);
        }

        @supports (height: 100dvh) {
          /* 现代浏览器优先使用此方案，JS Hook会检测到并自动跳过执行 */
          .h-dynamic-screen {
            height: 100dvh;
          }
        }
      `}</style>

      <div className="h-dynamic-screen bg-gray-100 grid grid-rows-[auto_1fr_auto] font-sans">
        <Header />

        <main className="overflow-y-auto">{children}</main>

        <Footer />
      </div>
    </>
  );
};

// App Component: The entry point that assembles the layout and content.
export default function App() {
  return (
    <MobileLayout>
      <PageContent />
    </MobileLayout>
  );
}
