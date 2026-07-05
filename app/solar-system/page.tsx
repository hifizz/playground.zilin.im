"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { bodyById } from "./planets";
import { createSolarSystem, type SolarSystemHandles } from "./scene";

/**
 * 太阳系 3D 交互科普
 * - Three.js 全屏场景：真实比例的公转/自转快慢、轴倾角、逆行自转
 * - 点击星球：3D 弹性放大 + 相机飞近跟随 + 右侧科普面板
 * - 控制条：暂停 / 变速 / 轨道线 / 标签 / 回到全景
 */

const SPEEDS = [0.25, 1, 3, 10];

export default function SolarSystemPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<SolarSystemHandles | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let handles: SolarSystemHandles | null = null;
    try {
      handles = createSolarSystem(el, (id) => setSelectedId(id));
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
            太阳系 · Solar System
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

          {/* 回到全景 */}
          <button
            onClick={closePanel}
            className="px-2.5 h-8 rounded-xl text-[11px] text-white/50 hover:text-white/85 transition-colors"
          >
            全景
          </button>
        </div>
      </div>

      {/* 星球科普面板：桌面右侧滑入，移动端底部弹出 */}
      <AnimatePresence>
        {body && (
          <motion.aside
            key={body.id}
            initial={{ x: "110%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute z-20 right-3 md:right-5 top-auto bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-[calc(100%-24px)] md:w-[340px] max-h-[62vh] md:max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a14]/80 backdrop-blur-2xl shadow-2xl"
            style={{ boxShadow: `0 0 60px -18px ${body.accent}55` }}
          >
            {/* 头部 */}
            <div
              className="px-5 pt-5 pb-4 border-b border-white/8"
              style={{
                background: `linear-gradient(135deg, ${body.accent}26, transparent 60%)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-semibold">{body.name}</h2>
                    <span className="text-xs tracking-[0.2em] text-white/40 uppercase">
                      {body.enName}
                    </span>
                  </div>
                  <span
                    className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      color: body.accent,
                      borderColor: `${body.accent}66`,
                      background: `${body.accent}14`,
                    }}
                  >
                    {body.type}
                  </span>
                </div>
                <button
                  onClick={closePanel}
                  className="w-7 h-7 grid place-items-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="关闭"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 数据表 */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-[13px]">
              {(
                [
                  ["直径", body.diameter],
                  ["距太阳", body.distance],
                  ["公转周期", body.orbitPeriodText],
                  ["自转周期", body.rotationPeriodText],
                  ["卫星", body.moons],
                  ["温度", body.temperature],
                  ["轴倾角", body.tiltText],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className={k === "直径" || k === "距太阳" ? "col-span-2" : ""}>
                  <dt className="text-[10px] tracking-widest text-white/35 mb-0.5">{k}</dt>
                  <dd className="text-white/85 leading-snug">{v}</dd>
                </div>
              ))}
            </dl>

            {/* 冷知识 */}
            <div className="px-5 pb-5">
              <div
                className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed text-white/75 border"
                style={{ borderColor: `${body.accent}33`, background: `${body.accent}0d` }}
              >
                <span className="mr-1" style={{ color: body.accent }}>
                  ✦
                </span>
                {body.fact}
              </div>
              <p className="mt-3 text-[10px] text-white/25 leading-relaxed">
                * 场景中的星球大小与轨道距离为压缩比例；公转/自转的相对快慢、
                轴倾角与自转方向（金星、天王星逆行）按真实数据呈现。
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
