"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bodyById } from "./planets";
import { InfoPanel } from "./info-panel";
import { GestureLayer } from "./gesture-hud";
import { TourLayer } from "./tour";
import { createSpaceAudio, type SpaceAudio } from "./audio";
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
  const audioRef = useRef<SpaceAudio | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [gestureOn, setGestureOn] = useState(false);
  const [tourOn, setTourOn] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const startTour = () => {
    setSelectedId(null); // 面板让位给字幕
    setTourOn(true);
  };
  const exitTour = () => {
    setTourOn(false);
    handlesRef.current?.focus(null);
  };

  // —— 手势动作映射 ——
  const stepSpeed = (dir: 1 | -1) => {
    const i = SPEEDS.indexOf(speed);
    const next = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, i + dir))];
    setSpeed(next);
    handlesRef.current?.setTimeScale(next);
  };
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    handlesRef.current?.setPaused(next);
  };
  const toggleOverlays = () => {
    const next = !showOrbits;
    setShowOrbits(next);
    setShowLabels(next);
    handlesRef.current?.setShowOrbits(next);
    handlesRef.current?.setShowLabels(next);
  };

  // 程序化太空氛围音：AudioContext 只能由用户手势启动
  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    if (!audioRef.current) audioRef.current = createSpaceAudio();
    if (next) {
      await audioRef.current.start();
      handlesRef.current?.bindAudioLevel(audioRef.current.getLevel);
    } else {
      handlesRef.current?.bindAudioLevel(null);
      await audioRef.current.stop();
    }
  };

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
      audioRef.current?.dispose();
      audioRef.current = null;
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

      {/* 底部控制条（导览时让位给字幕） */}
      {!tourOn && (
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1.5 md:gap-2 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-2.5 py-2 shadow-2xl">
          {/* 播放 / 暂停 */}
          <button
            onClick={togglePause}
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

          {/* 音画联动：太空氛围音驱动太阳脉动 */}
          <button
            onClick={toggleSound}
            className={`px-2.5 h-8 rounded-xl text-[11px] transition-colors ${
              soundOn
                ? "bg-amber-400/25 text-amber-200"
                : "text-white/50 hover:text-white/85"
            }`}
            title="程序化太空氛围音，太阳随声音呼吸"
          >
            声音
          </button>

          {/* 摄像头手势控制 */}
          <button
            onClick={() => setGestureOn(!gestureOn)}
            className={`px-2.5 h-8 rounded-xl text-[11px] transition-colors ${
              gestureOn
                ? "bg-cyan-400/25 text-cyan-200"
                : "text-white/50 hover:text-white/85"
            }`}
            title="摄像头手势控制：捏合转视角、指向选星球"
          >
            手势
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {/* 导览模式 */}
          <button
            onClick={startTour}
            className="px-2.5 h-8 rounded-xl text-[11px] text-white/50 hover:text-white/85 transition-colors"
            title="纪录片式自动巡航讲解"
          >
            导览
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
      )}

      {/* 星球科普面板（导览时由字幕接管） */}
      <InfoPanel body={tourOn ? undefined : body} onClose={closePanel} />

      {/* 导览字幕层 */}
      <TourLayer active={tourOn} apiRef={handlesRef} onExit={exitTour} />

      {/* 摄像头手势控制层 */}
      <GestureLayer
        active={gestureOn}
        apiRef={handlesRef}
        onSelect={setSelectedId}
        onSpeedStep={stepSpeed}
        onPauseToggle={togglePause}
        onReset={closePanel}
        onLove={toggleOverlays}
        loveHint="开关轨道标签"
      />
    </div>
  );
}
