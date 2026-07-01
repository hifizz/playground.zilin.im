"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * ============================================================================
 * ShaderSection · 单个全屏效果 section 的通用外壳
 * ============================================================================
 * 职责：
 *   ① 全屏布局（h-screen），shader 作背景层绝对定位铺满（inset:0，z-0）。
 *   ② 性能：用 IntersectionObserver 只在 section 进入视口时把 shader 挂载进
 *      DOM、离开视口就卸载。每个 shader 各占一个 WebGL context，浏览器每个
 *      标签页上限约 16 个，卸载能保证同时最多 2~3 个 context 存活。
 *   ③ 左上角标注：序号 + 效果名 + 一句话说明（真实 DOM，z-10 叠在 shader 上）。
 *   ④ 可选前景内容 `foreground`：真实文字/按钮，z-10 更高，用来演示
 *      「DOM 叠在 shader 背景之上」。
 *
 * 注意：`children`（shader 元素）在 active 为 true 时才被真正渲染进 DOM，
 * 因此 WebGL context 只在需要时创建。
 * ============================================================================
 */

/** 供各 section 复用的「铺满背景层」样式。 */
export const shaderFill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

export interface ShaderSectionProps {
  id: string;
  /** 序号，如 "01" */
  index: string;
  name: string;
  description: string;
  /** shader 背景节点（只在进入视口时挂载） */
  children: React.ReactNode;
  /** 可选前景内容：真实文字/按钮，叠在 shader 上层 */
  foreground?: React.ReactNode;
  /** 提前挂载/延迟卸载的余量，默认在视口上下各扩 300px 预加载 */
  preloadMargin?: string;
}

export function ShaderSection({
  id,
  index,
  name,
  description,
  children,
  foreground,
  preloadMargin = "300px 0px",
}: ShaderSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  // active：shader 是否挂载进 DOM（决定 WebGL context 存活）
  const [active, setActive] = useState(false);
  // shown：仅用于挂载后的淡入，避免 shader 首帧硬闪
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { root: null, rootMargin: preloadMargin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [preloadMargin]);

  // 在下一帧同步 shown = active：挂载后淡入、卸载前淡出。
  // 放进 rAF 避免在 effect 内同步 setState 触发级联渲染。
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(active));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <section
      id={id}
      ref={ref}
      className="relative h-screen w-full overflow-hidden bg-[#05060a]"
    >
      {/* —— 背景层：shader，只在 active 时挂载，淡入淡出 —— */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-700 ease-out"
        style={{ opacity: shown ? 1 : 0 }}
        aria-hidden
      >
        {active ? children : null}
      </div>

      {/* —— 顶部暗色渐隐，保证左上角文字始终可读 —— */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-56"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,6,10,0.72), rgba(5,6,10,0))",
        }}
        aria-hidden
      />

      {/* —— 左上角标注：序号 + 名称 + 一句话说明 —— */}
      <div className="absolute left-0 top-0 z-10 p-6 md:p-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tracking-[0.3em] text-cyan-400/80">
            {index}
          </span>
          <span className="h-px w-8 bg-cyan-400/40" />
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          {name}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-cyan-100/70 md:text-base">
          {description}
        </p>
      </div>

      {/* —— 可选前景内容（真实 DOM，最高层级） —— */}
      {foreground ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {foreground}
        </div>
      ) : null}
    </section>
  );
}
