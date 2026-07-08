'use client';

/**
 * 实验 Demo（未验收）：移动端全屏高度的「纯 CSS」替代方案。
 *
 * 对照组：/mobile-fullscreen 是已在生产验证过的「混合渐进增强」方案
 * （现代设备 dvh + 旧设备 JS Polyfill 写 --app-height）。
 *
 * 本页不写任何视口相关 JS，纯靠 CSS 视口单位（svh/lvh/dvh/vh），
 * 提供实时切换，方便在真机上肉眼对比四者在「地址栏伸缩 / 滚动」时的差异，
 * 用来验证「固定 app shell 默认 svh、dvh 会滚动 reflow」这个结论到底成不成立。
 */
import React, { useState } from 'react';

type Unit = 'svh' | 'dvh' | 'lvh' | 'vh';

const UNIT_META: Record<Unit, { cls: string; label: string; note: string }> = {
  svh: {
    cls: 'h-svh',
    label: '100svh（Small）',
    note: '地址栏展开时的最小可视高度。首屏就装得下、永不遮挡，滚动时不 reflow（本 Demo 想主推的默认）。代价：地址栏收起后底部会露一点背景。',
  },
  dvh: {
    cls: 'h-dvh',
    label: '100dvh（Dynamic）',
    note: '随工具栏实时变化，视觉最贴合。但滚动时地址栏动画会带着高度每帧重算，可能抖动 / reflow（WebKit #266835）。',
  },
  lvh: {
    cls: 'h-lvh',
    label: '100lvh（Large）',
    note: '地址栏收起时的最大高度。地址栏展开时底部会被工具栏遮挡（和裸 100vh 类似）。',
  },
  vh: {
    cls: 'h-screen',
    label: '100vh（传统）',
    note: '静态，等于地址栏收起时的最大高度。地址栏展开时严重遮挡底部。作为问题的对照基线。',
  },
};

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function MobileFullscreenSvhDemo() {
  const [unit, setUnit] = useState<Unit>('svh');
  const meta = UNIT_META[unit];

  return (
    <div
      className={`${meta.cls} bg-gray-100 dark:bg-black grid grid-rows-[auto_1fr_auto] font-sans`}
      style={{ overscrollBehaviorY: 'none' }}
    >
      {/* Header：safe-area-inset-top 顶开刘海 */}
      <header
        className="bg-white dark:bg-neutral-900 shadow-md w-full flex items-center justify-center z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: '1rem' }}
      >
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-50">纯 CSS 全屏（实验）</h1>
      </header>

      {/* 可滚动主体 */}
      <main className="overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">这是什么</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              这是一个<strong>未验收</strong>的替代方案：完全不写视口相关 JS，纯用 CSS 视口单位。
              切换下面的单位，在真机上滚动、让地址栏收起 / 展开，观察底部 TabBar 与内容高度的变化，
              用来验证「固定 app shell 该用 <code>svh</code> 而非 <code>dvh</code>」这个结论。
              已验证的生产方案在 <code>/mobile-fullscreen</code>。
            </p>
          </div>

          {/* 单位切换 */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow">
            <h3 className="font-bold mb-3">当前高度单位</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(UNIT_META) as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    unit === u
                      ? 'bg-neutral-800 text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {UNIT_META[u].label}
                </button>
              ))}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{meta.note}</p>
          </div>

          {/* 键盘测试 */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow">
            <h3 className="font-bold mb-2">软键盘测试</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
              点这个输入框弹出软键盘，观察布局是否被挤压（本页 viewport 设了{' '}
              <code>interactive-widget=resizes-content</code>）。
            </p>
            <input
              type="text"
              placeholder="点我弹出键盘…"
              className="w-full py-2 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
          </div>

          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
          ))}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow text-center">
            <p className="font-semibold">内容到底啦！底部 TabBar 应始终贴合可视区底部。</p>
          </div>
        </div>
      </main>

      {/* Footer：safe-area-inset-bottom 避开 Home Indicator */}
      <footer
        className="bg-white dark:bg-neutral-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] w-full z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)', paddingTop: '0.5rem' }}
      >
        <nav className="flex justify-around items-center">
          <a href="#home" className="flex flex-col items-center text-neutral-800 dark:text-neutral-100">
            <HomeIcon />
            <span className="text-xs mt-1">首页</span>
          </a>
          <a href="#search" className="flex flex-col items-center text-neutral-500 dark:text-neutral-400">
            <SearchIcon />
            <span className="text-xs mt-1">发现</span>
          </a>
          <a href="#profile" className="flex flex-col items-center text-neutral-500 dark:text-neutral-400">
            <UserIcon />
            <span className="text-xs mt-1">我的</span>
          </a>
        </nav>
      </footer>
    </div>
  );
}
