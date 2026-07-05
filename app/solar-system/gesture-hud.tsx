"use client";

/**
 * 手势控制层：摄像头预览 HUD + 场景手势光标 + 手势 → 交互映射。
 *
 * 手势表（单手为主，光标 = 掌心位置）：
 * - 🖐 张开手掌 —— 自由光标，掠过星球会有悬停放大
 * - 🤏 捏合拖动 —— 抓住太空转动视角
 * - 🤏🤏 双手捏合开合 —— 缩放（拉近/推远）
 * - ☝️ 指向星球停住 —— 蓄力选中（光标出现进度环），弹出科普面板
 * - ✊ 握拳 —— 暂停 / 播放
 * - 👍 / 👎 —— 时间加速 / 减速
 * - ✌️ 比 V —— 回到全景（关闭面板）
 * - 🤟 —— 页面自定义彩蛋（实体版开关轨道标签，点云版切星系形态）
 *
 * 高频数据（光标位置/进度环）直接操作 DOM ref，不走 React 状态；
 * 只有状态文本与当前手势名用 setState。
 */

import { useEffect, useRef, useState } from "react";
import {
  createGestureController,
  type GestureController,
  type GestureStatus,
  type HandFrame,
} from "./gestures";

export type GestureSceneApi = {
  pickAt(clientX: number, clientY: number): string | null;
  orbitBy(dx: number, dy: number): void;
  dollyBy(factor: number): void;
  hoverBody(id: string | null): void;
  focus(id: string | null): void;
};

type Props = {
  active: boolean;
  apiRef: React.RefObject<GestureSceneApi | null>;
  onSelect(id: string | null): void;
  onSpeedStep(dir: 1 | -1): void;
  onPauseToggle(): void;
  onReset(): void;
  onLove(): void;
  loveHint: string; // 🤟 在当前页面的含义（图例展示）
};

const GESTURE_EMOJI: Record<string, string> = {
  Closed_Fist: "✊",
  Open_Palm: "🖐",
  Pointing_Up: "☝️",
  Thumb_Up: "👍",
  Thumb_Down: "👎",
  Victory: "✌️",
  ILoveYou: "🤟",
};

const DWELL_MS = 900; // 指向蓄力选中时长
const HOLD_FRAMES = 6; // 离散手势需连续帧数
const COOLDOWN_MS = 1100; // 离散手势重复触发间隔

export function GestureLayer({
  active,
  apiRef,
  onSelect,
  onSpeedStep,
  onPauseToggle,
  onReset,
  onLove,
  loveHint,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dwellRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<GestureStatus>("loading");
  const [gestureLabel, setGestureLabel] = useState<string>("");

  // 高频状态全放 ref
  const state = useRef({
    cursor: { x: 0.5, y: 0.5 },
    hasCursor: false,
    lastPinch: null as { x: number; y: number } | null,
    lastSpread: null as number | null,
    dwellId: null as string | null,
    dwellStart: 0,
    hold: { name: "", frames: 0, firedAt: 0 },
  });

  // 回调用 ref 透传，避免 effect 依赖抖动
  const actionsRef = useRef({ onSelect, onSpeedStep, onPauseToggle, onReset, onLove });
  actionsRef.current = { onSelect, onSpeedStep, onPauseToggle, onReset, onLove };

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    let controller: GestureController | null = null;
    let cancelled = false;
    const s = state.current;

    const drawPreview = (hands: HandFrame[]) => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(125, 211, 252, 0.9)";
      for (const hand of hands) {
        for (const p of hand.landmarks) {
          // 预览已用 CSS 镜像，这里画原始坐标即可
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const setCursorVisual = (mode: "palm" | "pinch" | "point" | "hidden", px = 0, py = 0) => {
      const el = cursorRef.current;
      if (!el) return;
      if (mode === "hidden") {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
      el.dataset.mode = mode;
    };

    const setDwellProgress = (t: number) => {
      const el = dwellRef.current;
      if (!el) return;
      el.style.background =
        t <= 0
          ? "none"
          : `conic-gradient(rgba(167,139,250,0.95) ${t * 360}deg, rgba(167,139,250,0.15) 0deg)`;
    };

    const fireDiscrete = (name: string, fn: () => void) => {
      const now = performance.now();
      if (s.hold.name !== name) {
        s.hold = { name, frames: 1, firedAt: s.hold.firedAt };
        return;
      }
      s.hold.frames++;
      if (s.hold.frames >= HOLD_FRAMES && now - s.hold.firedAt > COOLDOWN_MS) {
        s.hold.firedAt = now;
        fn();
      }
    };

    const handleFrame = (hands: HandFrame[]) => {
      const api = apiRef.current;
      drawPreview(hands);
      if (!api) return;
      const acts = actionsRef.current;

      if (!hands.length) {
        setCursorVisual("hidden");
        setDwellProgress(0);
        api.hoverBody(null);
        s.lastPinch = null;
        s.lastSpread = null;
        s.dwellId = null;
        s.hold = { name: "", frames: 0, firedAt: s.hold.firedAt };
        setGestureLabel("");
        return;
      }

      const primary = hands[0];
      // 光标 EMA 平滑
      s.cursor.x += (primary.cursor.x - s.cursor.x) * 0.35;
      s.cursor.y += (primary.cursor.y - s.cursor.y) * 0.35;
      const px = s.cursor.x * window.innerWidth;
      const py = s.cursor.y * window.innerHeight;

      const bothPinch = hands.length === 2 && hands[0].pinch && hands[1].pinch;

      // 手势标签（顶部展示）
      const label = bothPinch
        ? "🤏🤏 缩放"
        : primary.pinch
          ? "🤏 拖动视角"
          : (GESTURE_EMOJI[primary.gesture] ?? "") +
            (primary.gesture === "Pointing_Up" ? " 指向选中" : "");
      setGestureLabel(label);

      // ---- 双手捏合：缩放 ----
      if (bothPinch) {
        const spread = Math.hypot(
          hands[0].cursor.x - hands[1].cursor.x,
          hands[0].cursor.y - hands[1].cursor.y,
        );
        if (s.lastSpread !== null && spread > 0.02) {
          const f = Math.min(1.08, Math.max(0.92, s.lastSpread / spread));
          api.dollyBy(f);
        }
        s.lastSpread = spread;
        s.lastPinch = null;
        s.dwellId = null;
        setCursorVisual("pinch", px, py);
        setDwellProgress(0);
        return;
      }
      s.lastSpread = null;

      // ---- 单手捏合：拖动转视角 ----
      if (primary.pinch) {
        if (s.lastPinch) {
          api.orbitBy(
            (s.cursor.x - s.lastPinch.x) * 4.2,
            (s.cursor.y - s.lastPinch.y) * 3.2,
          );
        }
        s.lastPinch = { x: s.cursor.x, y: s.cursor.y };
        s.dwellId = null;
        setCursorVisual("pinch", px, py);
        setDwellProgress(0);
        api.hoverBody(null);
        return;
      }
      s.lastPinch = null;

      // ---- 悬停（所有非捏合手势共享） ----
      const hoverId = api.pickAt(px, py);
      api.hoverBody(hoverId);

      // ---- 指向蓄力选中 ----
      if (primary.gesture === "Pointing_Up") {
        setCursorVisual("point", px, py);
        const now = performance.now();
        if (hoverId && hoverId === s.dwellId) {
          const t = (now - s.dwellStart) / DWELL_MS;
          setDwellProgress(Math.min(1, t));
          if (t >= 1) {
            api.focus(hoverId);
            acts.onSelect(hoverId);
            s.dwellId = null;
            setDwellProgress(0);
          }
        } else {
          s.dwellId = hoverId;
          s.dwellStart = now;
          setDwellProgress(0);
        }
        return;
      }
      s.dwellId = null;
      setDwellProgress(0);
      setCursorVisual("palm", px, py);

      // ---- 离散手势 ----
      switch (primary.gesture) {
        case "Closed_Fist":
          fireDiscrete("Closed_Fist", acts.onPauseToggle);
          break;
        case "Thumb_Up":
          fireDiscrete("Thumb_Up", () => acts.onSpeedStep(1));
          break;
        case "Thumb_Down":
          fireDiscrete("Thumb_Down", () => acts.onSpeedStep(-1));
          break;
        case "Victory":
          fireDiscrete("Victory", () => {
            acts.onReset();
            acts.onSelect(null);
          });
          break;
        case "ILoveYou":
          fireDiscrete("ILoveYou", acts.onLove);
          break;
        default:
          s.hold = { name: "", frames: 0, firedAt: s.hold.firedAt };
      }
    };

    createGestureController({
      video,
      onFrame: handleFrame,
      onStatus: (st) => {
        if (!cancelled) setStatus(st);
      },
    }).then((c) => {
      if (cancelled) c.dispose();
      else controller = c;
    });

    return () => {
      cancelled = true;
      controller?.dispose();
      setCursorVisual("hidden");
      apiRef.current?.hoverBody(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  const statusText =
    status === "loading"
      ? "加载手势模型…"
      : status === "denied"
        ? "摄像头被拒绝"
        : status === "error"
          ? "模型加载失败"
          : gestureLabel || "未检测到手";

  return (
    <>
      {/* 场景手势光标：外环 + 内点 + 蓄力进度环 */}
      <div
        ref={cursorRef}
        data-mode="palm"
        className="pointer-events-none fixed left-0 top-0 z-30 opacity-0 transition-opacity duration-200"
        style={{ willChange: "transform" }}
      >
        <div ref={dwellRef} className="absolute -inset-3 rounded-full" style={{ mask: "radial-gradient(closest-side, transparent 72%, #000 74%)", WebkitMask: "radial-gradient(closest-side, transparent 72%, #000 74%)" }} />
        <div className="gesture-cursor-ring w-9 h-9 rounded-full border-2" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
        <style>{`
          [data-mode="palm"] .gesture-cursor-ring { border-color: rgba(255,255,255,0.85); box-shadow: 0 0 14px rgba(255,255,255,0.45); }
          [data-mode="pinch"] .gesture-cursor-ring { border-color: rgba(103,232,249,0.95); box-shadow: 0 0 16px rgba(103,232,249,0.6); }
          [data-mode="point"] .gesture-cursor-ring { border-color: rgba(167,139,250,0.95); box-shadow: 0 0 16px rgba(167,139,250,0.6); }
        `}</style>
      </div>

      {/* 摄像头预览 HUD（左下角） */}
      <div className="fixed left-3 bottom-3 z-30 flex flex-col gap-1.5 items-start">
        <div className="rounded-xl border border-white/15 bg-black/50 backdrop-blur-xl px-3 py-2 text-[11px] leading-relaxed text-white/70 max-w-[220px]">
          <div className="text-white/90 mb-1">
            {statusText}
          </div>
          <div>🤏 拖动转视角 · 🤏🤏 开合缩放</div>
          <div>☝️ 指住星球选中 · ✊ 暂停</div>
          <div>👍👎 变速 · ✌️ 全景 · 🤟 {loveHint}</div>
        </div>
        <div
          className={`relative w-[168px] h-[126px] rounded-xl overflow-hidden border transition-colors ${
            gestureLabel ? "border-cyan-300/60" : "border-white/15"
          } bg-black/60`}
        >
          {/* 自拍镜像 */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={previewCanvasRef}
            width={168}
            height={126}
            className="absolute inset-0 w-full h-full"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      </div>
    </>
  );
}
