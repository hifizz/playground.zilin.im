"use client";
/**
 * orchestration/thread-columns —— 列容器与列槽编排。
 *
 * 职责边界：会话树归 core store；「哪些会话摆在哪些列、谁折叠成细条」这类
 * 视口状态归这里的 React state（useColumnSlots）。列内长什么样由上层通过
 * renderThread 渲染插槽决定（本层不认识 chat / 分支装饰）。
 */

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Thread, ThreadTreeState } from "../core/types";
import type { ThreadStore } from "../core/store";
import { accentOf } from "../theme";
import {
  normalizeForReplace,
  place,
  trimSlots,
  type PlaceEffect,
  type PlacementMode,
  type Slot,
} from "./placement";

/** 约每 430px 一列（自适应列数的换算基准） */
export const COL_MIN_W = 430;

/* ---------------- 窗口宽度（外部 store：SSR 快照为 null，避免 hydration mismatch） ---------------- */
const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const getWinW = (): number | null => window.innerWidth;
const getServerWinW = (): number | null => null;

export function useWindowWidth(): number | null {
  return useSyncExternalStore(subscribeResize, getWinW, getServerWinW);
}

/* ---------------- 列槽编排 hook ---------------- */

export interface UseColumnSlotsArgs {
  store: ThreadStore;
  /** 展开列上限（= 总列数 - 主线一列） */
  maxExpanded: number;
  /** 列满策略：替换⑥ / 细条⑤ */
  mode: PlacementMode;
}

export function useColumnSlots({ store, maxExpanded, mode }: UseColumnSlotsArgs) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const flashSeq = useRef(0);
  const colsRef = useRef<HTMLDivElement | null>(null);

  // 窗口变窄 / 强制列数调小时：从左裁掉最早的槽（细条一并参与，见 trimSlots）。
  // 这是 React 官方的「渲染期间调整派生状态」写法：条件自熄，比 effect 少一轮往返。
  const effectiveSlots = trimSlots(slots, maxExpanded);
  if (effectiveSlots.length !== slots.length) setSlots(effectiveSlots);

  /** 闪烁提示某列（并滚动到可视区） */
  const flashThread = (id: string) => setFlash({ id, n: ++flashSeq.current });

  useEffect(() => {
    if (!flash) return;
    const el = colsRef.current?.querySelector(`.column[data-thread-id="${flash.id}"]`);
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => setFlash(null), 950);
    return () => clearTimeout(t);
  }, [flash]);

  /** 统一放置入口：打开（或原地展开）某会话，返回发生的副作用供上层做 toast */
  function openThread(id: string, sourceId: string | null): PlaceEffect {
    store.touch(id);
    const state = store.getState();
    const { slots: next, effect } = place(mode, effectiveSlots, id, {
      sourceId,
      maxExpanded,
      lastActiveOf: (tid) => state.threads[tid]?.lastActive ?? 0,
    });
    setSlots(next);
    flashThread(id);
    return effect;
  }

  /** 列内导航：面包屑 = collapse（目标已在别列时收起本列）；切换器 = swap（交换两列） */
  function navColumn(vpIndex: number, targetId: string, dup: "collapse" | "swap" = "collapse") {
    const next = effectiveSlots.map((s) => ({ ...s }));
    if (targetId === "main") {
      next.splice(vpIndex, 1);
      setSlots(next);
      flashThread("main");
      return;
    }
    store.touch(targetId);
    const other = next.findIndex((s) => s.id === targetId);
    if (other >= 0 && other !== vpIndex) {
      if (dup === "swap") {
        // 交换两列的会话；folded 标记留在原槽位，展开数不变
        const a = next[other].id;
        next[other].id = next[vpIndex].id;
        next[vpIndex].id = a;
      } else {
        // 目标已在别列：收起本列，并确保目标处于展开态
        next[other].folded = false;
        next.splice(vpIndex, 1);
      }
    } else {
      next[vpIndex].id = targetId;
    }
    setSlots(next);
    flashThread(targetId);
  }

  function closeColumn(vpIndex: number) {
    const next = effectiveSlots.map((s) => ({ ...s }));
    next.splice(vpIndex, 1);
    setSlots(next);
  }

  /** 撤销（replace 策略的 toast 用）：整体恢复到替换前的槽位 */
  function restoreSlots(prev: Slot[]) {
    setSlots(prev);
  }

  /** fold → replace 切换：细条全部展开，从左裁掉超限列；返回被裁的会话 id */
  function normalizeToReplace(): string[] {
    const { slots: next, dropped } = normalizeForReplace(effectiveSlots, maxExpanded);
    setSlots(next);
    return dropped;
  }

  return {
    slots: effectiveSlots,
    flashId: flash?.id ?? null,
    colsRef,
    openThread,
    navColumn,
    closeColumn,
    restoreSlots,
    flashThread,
    normalizeToReplace,
  };
}

/* ---------------- 列容器组件 ---------------- */

function ColumnShell({
  thread,
  flashing,
  children,
}: {
  thread: Thread;
  flashing: boolean;
  children: React.ReactNode;
}) {
  const isMain = thread.id === "main";
  return (
    <div
      className={`column ${isMain ? "main" : "branch"} ${flashing ? "flash" : ""}`}
      data-thread-id={thread.id}
      style={{ "--accent": accentOf(thread) } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** 方案⑤的竖直细条：深度色左缘 + 竖排标题 + 脚注号徽章，点击原地展开 */
function FoldedStrip({ thread, onClick }: { thread: Thread; onClick: () => void }) {
  return (
    <button
      className="col-strip"
      data-thread-id={thread.id}
      style={{ "--accent": accentOf(thread) } as React.CSSProperties}
      title={`「${thread.title}」已折叠为细条 · 点击原地展开`}
      onClick={onClick}
    >
      {thread.footnote !== null && <span className="fn">{thread.footnote}</span>}
      <span className="vt">{thread.title}</span>
    </button>
  );
}

export interface ThreadColumnsProps {
  state: ThreadTreeState;
  slots: Slot[];
  flashId: string | null;
  colsRef: React.RefObject<HTMLDivElement | null>;
  /** 渲染一列的内部内容（主线 vpIndex = -1；分支列为槽位下标） */
  renderThread: (threadId: string, vpIndex: number) => React.ReactNode;
  /** 点击细条（上层走统一的 openThread 意图入口） */
  onExpandStrip: (id: string) => void;
}

export function ThreadColumns({
  state,
  slots,
  flashId,
  colsRef,
  renderThread,
  onExpandStrip,
}: ThreadColumnsProps) {
  const main = state.threads["main"];
  return (
    <div className="cols" ref={colsRef}>
      {main && (
        <ColumnShell thread={main} flashing={flashId === "main"}>
          {renderThread("main", -1)}
        </ColumnShell>
      )}
      {slots.map((s, i) => {
        const t = state.threads[s.id];
        if (!t) return null;
        return s.folded ? (
          <FoldedStrip key={s.id} thread={t} onClick={() => onExpandStrip(s.id)} />
        ) : (
          <ColumnShell key={s.id} thread={t} flashing={flashId === s.id}>
            {renderThread(s.id, i)}
          </ColumnShell>
        );
      })}
    </div>
  );
}
