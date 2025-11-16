"use client";

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { get, throttle } from "lodash";
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

type ViewportStrategy = {
  supportsDvh: boolean;
  label: string;
};

const DEFAULT_POLYFILL_LABEL = "JavaScript Polyfill `--app-height` 方案 (兼容性最佳)";

const ViewportStrategyContext = createContext<ViewportStrategy | null>(null);

const detectViewportStrategy = (): ViewportStrategy => {
  if (typeof window === "undefined") {
    return {
      supportsDvh: false,
      label: DEFAULT_POLYFILL_LABEL,
    };
  }

  const cssSupports = get(
    window,
    ["CSS", "supports"],
    null
  ) as ((property: string, value: string) => boolean) | null;

  const supportsDvh =
    typeof cssSupports === "function" ? cssSupports("height", "100dvh") : false;

  return {
    supportsDvh,
    label: supportsDvh
      ? "原生 CSS `dvh` 方案 (性能最佳)"
      : DEFAULT_POLYFILL_LABEL,
  };
};

const useProvideViewportStrategy = (): ViewportStrategy => {
  const [strategy, setStrategy] = useState<ViewportStrategy>(detectViewportStrategy);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateStrategy = throttle(() => {
      setStrategy(detectViewportStrategy());
    }, 200);

    window.addEventListener("resize", updateStrategy);
    window.addEventListener("orientationchange", updateStrategy);

    return () => {
      window.removeEventListener("resize", updateStrategy);
      window.removeEventListener("orientationchange", updateStrategy);
      updateStrategy.cancel();
    };
  }, []);

  return strategy;
};

const useViewportHeightPolyfill = (shouldApplyPolyfill: boolean) => {
  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    if (!shouldApplyPolyfill) {
      document.documentElement.style.removeProperty("--app-height");
      return;
    }

    const setAppHeight = () => {
      const appHeight = `${window.innerHeight}px`;
      document.documentElement.style.setProperty("--app-height", appHeight);
    };

    const syncAppHeight = throttle(setAppHeight, 100);

    setAppHeight();
    window.addEventListener("resize", syncAppHeight);
    window.addEventListener("orientationchange", syncAppHeight);

    return () => {
      syncAppHeight.cancel();
      window.removeEventListener("resize", syncAppHeight);
      window.removeEventListener("orientationchange", syncAppHeight);
    };
  }, [shouldApplyPolyfill]);
};

const ViewportStrategyProvider = ({ children }: { children: React.ReactNode }) => {
  const strategy = useProvideViewportStrategy();
  useViewportHeightPolyfill(!strategy.supportsDvh);

  return (
    <ViewportStrategyContext.Provider value={strategy}>
      {children}
    </ViewportStrategyContext.Provider>
  );
};

const useViewportStrategy = () => {
  const context = useContext(ViewportStrategyContext);
  if (!context) {
    throw new Error(
      "useViewportStrategy 必须在 ViewportStrategyProvider 中使用"
    );
  }
  return context;
};

// [新增] 这是一个独立的组件，用于检测并显示当前所采用的布局方案。
// 它的逻辑与核心实现完全解耦。
const StrategyInfo = () => {
  const { label } = useViewportStrategy();

  return (
    <div className="bg-white p-6 rounded-lg shadow text-gray-600">
      <h3 className="font-bold mb-1">当前布局方案:</h3>
      <p>{label}</p>
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

type FooterNavItemConfig = {
  href: string;
  label: string;
  Icon: React.ComponentType;
  isActive?: boolean;
};

const footerNavItems: FooterNavItemConfig[] = [
  { href: "#home", label: "首页", Icon: HomeIcon, isActive: true },
  { href: "#search", label: "发现", Icon: SearchIcon },
  { href: "#profile", label: "我的", Icon: UserIcon },
];

const FooterNavItem = ({ href, label, Icon, isActive }: FooterNavItemConfig) => (
  <a
    href={href}
    className={`flex flex-col items-center ${
      isActive ? "text-blue-600" : "text-gray-600"
    } hover:text-blue-800 transition-colors`}
  >
    <Icon />
    <span className="text-xs mt-1">{label}</span>
  </a>
);

const Footer = () => {
  return (
    <footer className="bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] w-full p-2 z-10">
      <nav className="flex justify-around items-center">
        {footerNavItems.map((item) => (
          <FooterNavItem key={item.href} {...item} />
        ))}
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
    <ViewportStrategyProvider>
      <MobileLayout>
        <PageContent />
      </MobileLayout>
    </ViewportStrategyProvider>
  );
}
