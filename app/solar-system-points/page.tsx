"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bodyById } from "../solar-system/planets";
import { InfoPanel } from "../solar-system/info-panel";
import { createSolarPoints, type SolarPointsHandles } from "./scene";

/**
 * 太阳系 · 点云粒子版
 * - 所有天体由粒子云构成，逐点从程序化贴图采样取色，shader 里算昼夜明暗
 * - 开场「星尘汇聚」动画，可随时重放
 * - 交互与实体版一致：点击星球 3D 放大 + 相机跟随 + 科普面板
 */

const SPEEDS = [0.25, 1, 3, 10];

export default function SolarSystemPointsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<SolarPointsHandles | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let handles: SolarPointsHandles | null = null;
    try {
      handles = createSolarPoints(el, (id) => setSelectedId(id));
    } catch (err) {
      console.error("WebGL init failed:", err);
      queueMicrotask(() => setWebglFailed(true));
      return;
    }
    handlesRef.current = handles;
    return () => {
      handlesRef.current = null;
      handles?.dispose();
    };
  }, []);

  const body = bodyById(selectedId);

  const closePanel = () => {
    setSelectedId(null);
    handlesRef.current?.focus(null);
  };

  return (
    <div className="fixed inset-0 bg-[#020208] text-white overflow-hidden select-none">
      {/* 3D 画布 */}
      <div ref={containerRef} className="absolute inset-0" />

      {webglFailed && (
        <div className="absolute inset-0 grid place-items-center text-white/60 text-sm">
          当前环境不支持 WebGL，无法渲染 3D 场景。
        </div>
      )}

      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 right-0 p-5 md:p-7 pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
        <div className="pointer-events-auto inline-flex flex-col gap-1">
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] text-white/50 hover:text-white/90 transition-colors"
          >
            ← PLAYGROUND
          </Link>
          <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
            太阳系 · 点云 Particles
          </h1>
          <p className="text-[11px] md:text-xs text-white/45">
            拖动旋转 · 滚轮缩放 · 点击星球查看科普卡片
          </p>
        </div>
      </div>

      {/* 底部控制条 */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1.5 md:gap-2 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-2.5 py-2 shadow-2xl">
          {/* 播放 / 暂停 */}
          <button
            onClick={() => {
              const next = !paused;
              setPaused(next);
              handlesRef.current?.setPaused(next);
            }}
            className="w-9 h-9 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            title={paused ? "播放" : "暂停"}
          >
            {paused ? (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2.5 1.5l8 4.5-8 4.5z" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2" y="1.5" width="3" height="9" rx="0.8" />
                <rect x="7" y="1.5" width="3" height="9" rx="0.8" />
              </svg>
            )}
          </button>

          {/* 速度档位 */}
          <div className="flex items-center rounded-xl bg-white/5 p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  handlesRef.current?.setTimeScale(s);
                }}
                className={`px-2 md:px-2.5 h-8 rounded-[10px] text-[11px] tabular-nums transition-colors ${
                  speed === s
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/85"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* 轨道 / 标签开关 */}
          <button
            onClick={() => {
              const next = !showOrbits;
              setShowOrbits(next);
              handlesRef.current?.setShowOrbits(next);
            }}
            className={`px-2.5 h-8 rounded-xl text-[11px] transition-colors ${
              showOrbits ? "bg-white/15 text-white" : "text-white/50 hover:text-white/85"
            }`}
          >
            轨道
          </button>
          <button
            onClick={() => {
              const next = !showLabels;
              setShowLabels(next);
              handlesRef.current?.setShowLabels(next);
            }}
            className={`px-2.5 h-8 rounded-xl text-[11px] transition-colors ${
              showLabels ? "bg-white/15 text-white" : "text-white/50 hover:text-white/85"
            }`}
          >
            标签
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* 重放汇聚动画 */}
          <button
            onClick={() => handlesRef.current?.replayAssembly()}
            className="px-2.5 h-8 rounded-xl text-[11px] text-white/50 hover:text-white/85 transition-colors"
            title="粒子重新汇聚成形"
          >
            汇聚
          </button>

          {/* 回到全景 */}
          <button
            onClick={closePanel}
            className="px-2.5 h-8 rounded-xl text-[11px] text-white/50 hover:text-white/85 transition-colors"
          >
            全景
          </button>
        </div>
      </div>

      {/* 星球科普面板（与实体版共用） */}
      <InfoPanel body={body} onClose={closePanel} />
    </div>
  );
}
