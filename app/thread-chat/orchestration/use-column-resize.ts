"use client";
/**
 * orchestration/use-column-resize —— 列间分割线的拖拽 / 键盘 / 双击复位逻辑。
 *
 * 流畅性优先的实现约定：
 * · 拖拽期间绝不 setState —— pointermove 只累计位移，rAF 合帧后每帧至多一次
 *   直接写两列 DOM 的 style.width / style.flex；pointerup 才把末帧宽度 commit
 *   回 React 状态（widths），commit 值与末帧 DOM 严格一致，无跳动。
 * · 零和分配：左 +d 右 -d，位移被截断到两列都落在 [--col-min, --col-max] 内。
 * · 双击恢复自动均分属「程序性变宽」，走 CSS transition（.cols.easing）：先删
 *   状态条目让 React 回到自动布局，再在 rAF 里做 FLIP——量出目标宽、钉回起始宽、
 *   挂 .easing 写目标宽，过渡结束后清掉内联样式交还给自动布局。拖拽期间绝不挂该类。
 */

import { useEffect, useRef } from "react";
import type React from "react";

const FALLBACK_MIN = 340;
const FALLBACK_MAX = 760;
/** 键盘 ←/→ 单次调整步长（px） */
const KEY_STEP = 24;
/** 与 .cols.easing 的 transition 时长对齐（+缓冲），到点清理内联样式 */
const EASE_MS = 320 + 60;

interface DragSession {
  pointerId: number;
  handle: HTMLElement;
  leftEl: HTMLElement;
  rightEl: HTMLElement;
  leftId: string;
  rightId: string;
  leftStart: number;
  rightStart: number;
  startX: number;
  min: number;
  max: number;
  /** 待处理的 rAF id（0 = 无） */
  raf: number;
  /** 最新指针位移（未 clamp），rAF 帧里统一换算 */
  delta: number;
  /** 是否发生过实际拖动（纯点击 / 双击不落状态、不碰 DOM） */
  moved: boolean;
  lastLeft: number;
  lastRight: number;
}

interface EaseSession {
  els: HTMLElement[];
  timer: number;
}

export interface UseColumnResizeArgs {
  colsRef: React.RefObject<HTMLDivElement | null>;
  /** 该列当前是否有显式宽度条目（双击复位的空操作短路） */
  hasWidth: (id: string) => boolean;
  /** 拖拽末帧 / 键盘步进的提交：合并写入两列宽度 */
  onCommit: (patch: Record<string, number>) => void;
  /** 双击复位：删除两列的宽度条目（恢复自动均分） */
  onReset: (ids: string[]) => void;
}

export interface ColumnResizeHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>, leftId: string, rightId: string) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  onDoubleClick: (leftId: string, rightId: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, leftId: string, rightId: string) => void;
}

/** 零和 clamp：把位移 d 截断到「左右两列都落在 [min,max]」的可行区间内 */
function clampDelta(d: number, leftW: number, rightW: number, min: number, max: number): number {
  const lo = Math.max(min - leftW, rightW - max);
  const hi = Math.min(max - leftW, rightW - min);
  if (lo > hi) return 0; // 起始宽已越界（CSS clamp 兜底，理论上到不了）
  return Math.min(hi, Math.max(lo, d));
}

function forceReflow(el: HTMLElement): number {
  return el.offsetWidth;
}

export function useColumnResize({
  colsRef,
  hasWidth,
  onCommit,
  onReset,
}: UseColumnResizeArgs): ColumnResizeHandlers {
  const drag = useRef<DragSession | null>(null);
  const ease = useRef<EaseSession | null>(null);

  // 卸载兜底：拖拽 / 过渡进行中被卸载时，清干净 body 样式、rAF 与定时器
  useEffect(
    () => () => {
      const s = drag.current;
      if (s) {
        drag.current = null;
        if (s.raf) cancelAnimationFrame(s.raf);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      const e = ease.current;
      if (e) {
        ease.current = null;
        window.clearTimeout(e.timer);
      }
    },
    [],
  );

  const colEl = (id: string): HTMLElement | null =>
    colsRef.current?.querySelector<HTMLElement>(`.column[data-thread-id="${CSS.escape(id)}"]`) ??
    null;

  /** min/max 以 CSS 变量为唯一来源（--col-min / --col-max，从 .tc 继承到分割线上） */
  const limitsOf = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    return {
      min: parseFloat(cs.getPropertyValue("--col-min")) || FALLBACK_MIN,
      max: parseFloat(cs.getPropertyValue("--col-max")) || FALLBACK_MAX,
    };
  };

  /** 结束程序性过渡：移除 .easing 并清掉内联样式，交还自动布局（可被拖拽/键盘随时打断） */
  const stopEase = () => {
    const e = ease.current;
    if (!e) return;
    ease.current = null;
    window.clearTimeout(e.timer);
    colsRef.current?.classList.remove("easing");
    e.els.forEach((el) => {
      el.style.width = "";
      el.style.flex = "";
    });
  };

  /** 把当前位移换算成两列宽度并直写 DOM（拖拽期间的唯一写入口，每帧至多一次） */
  const applyDrag = (s: DragSession) => {
    const d = clampDelta(s.delta, s.leftStart, s.rightStart, s.min, s.max);
    s.lastLeft = s.leftStart + d;
    s.lastRight = s.rightStart - d;
    s.leftEl.style.flex = "0 0 auto";
    s.leftEl.style.width = `${s.lastLeft}px`;
    s.rightEl.style.flex = "0 0 auto";
    s.rightEl.style.width = `${s.lastRight}px`;
  };

  const finishDrag = (s: DragSession) => {
    drag.current = null;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.handle.classList.remove("active");
    if (s.handle.hasPointerCapture(s.pointerId)) s.handle.releasePointerCapture(s.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (!s.moved) return; // 纯点击（含双击的两次按放）：不碰状态
    // 末帧对齐：把最后一次位移同步进 DOM，保证 commit 值与视觉严格一致
    applyDrag(s);
    onCommit({ [s.leftId]: s.lastLeft, [s.rightId]: s.lastRight });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, leftId: string, rightId: string) => {
    if (e.button !== 0 || drag.current) return;
    const leftEl = colEl(leftId);
    const rightEl = colEl(rightId);
    if (!leftEl || !rightEl) return;
    stopEase(); // 复位过渡进行中则立刻完成，确保量到的是稳定宽度
    const handle = e.currentTarget;
    const { min, max } = limitsOf(handle);
    drag.current = {
      pointerId: e.pointerId,
      handle,
      leftEl,
      rightEl,
      leftId,
      rightId,
      leftStart: leftEl.getBoundingClientRect().width,
      rightStart: rightEl.getBoundingClientRect().width,
      startX: e.clientX,
      min,
      max,
      raf: 0,
      delta: 0,
      moved: false,
      lastLeft: 0,
      lastRight: 0,
    };
    handle.setPointerCapture(e.pointerId);
    handle.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = drag.current;
    if (!s || e.pointerId !== s.pointerId) return;
    s.delta = e.clientX - s.startX;
    if (!s.moved && Math.abs(s.delta) >= 1) s.moved = true;
    if (s.moved && !s.raf) {
      s.raf = requestAnimationFrame(() => {
        s.raf = 0;
        applyDrag(s);
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const s = drag.current;
    if (s && e.pointerId === s.pointerId) finishDrag(s);
  };

  // 系统抢走指针（如手势）：与 pointerup 同样按当前位置收尾，视觉不回跳
  const onPointerCancel = onPointerUp;

  const onDoubleClick = (leftId: string, rightId: string) => {
    if (drag.current) return;
    if (!hasWidth(leftId) && !hasWidth(rightId)) return; // 本就自动均分
    const leftEl = colEl(leftId);
    const rightEl = colEl(rightId);
    const colsEl = colsRef.current;
    if (!leftEl || !rightEl || !colsEl) return;
    stopEase();
    const firstL = leftEl.getBoundingClientRect().width;
    const firstR = rightEl.getBoundingClientRect().width;
    // 先提交状态：双击是离散事件，React 会在本任务末同步冲刷 DOM（两列回到自动布局）
    onReset([leftId, rightId]);
    // rAF 跑在冲刷之后、绘制之前：量出目标宽（Last）→ 钉回起始宽（First）→
    // 挂 .easing 写目标宽，由 CSS transition 完成动画（FLIP），全程不再碰状态。
    requestAnimationFrame(() => {
      if (drag.current || ease.current) return; // 已有新交互接管，状态本身已是最终值
      if (!leftEl.isConnected || !rightEl.isConnected) return;
      const lastL = leftEl.getBoundingClientRect().width;
      const lastR = rightEl.getBoundingClientRect().width;
      if (Math.abs(lastL - firstL) < 1 && Math.abs(lastR - firstR) < 1) return;
      const pin = (el: HTMLElement, w: number) => {
        el.style.flex = "0 0 auto";
        el.style.width = `${w}px`;
      };
      pin(leftEl, firstL);
      pin(rightEl, firstR);
      forceReflow(colsEl); // 确立过渡起点
      colsEl.classList.add("easing");
      pin(leftEl, lastL);
      pin(rightEl, lastR);
      ease.current = { els: [leftEl, rightEl], timer: window.setTimeout(stopEase, EASE_MS) };
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, leftId: string, rightId: string) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (drag.current) return;
    const leftEl = colEl(leftId);
    const rightEl = colEl(rightId);
    if (!leftEl || !rightEl) return;
    e.preventDefault();
    stopEase();
    const { min, max } = limitsOf(e.currentTarget);
    const lw = leftEl.getBoundingClientRect().width;
    const rw = rightEl.getBoundingClientRect().width;
    const d = clampDelta(e.key === "ArrowRight" ? KEY_STEP : -KEY_STEP, lw, rw, min, max);
    if (d === 0) return;
    onCommit({ [leftId]: lw + d, [rightId]: rw - d });
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onDoubleClick, onKeyDown };
}
