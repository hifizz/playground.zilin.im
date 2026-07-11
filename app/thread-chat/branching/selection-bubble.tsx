"use client";
/**
 * branching/selection-bubble —— 划选 assistant 消息文字 → 迷你气泡 → 开分支。
 *
 * document 级监听 + 命令式 DOM Selection 读取（这部分天然绕不开命令式 API）。
 * 气泡的开合状态由上层持有（sel / onSelChange），以便 Esc 逐层关闭链能先关它。
 */

import React, { useEffect } from "react";
import { GitFork } from "lucide-react";
import type { ThreadTreeState } from "../core/types";

export interface SelectionInfo {
  text: string;
  threadId: string;
  msgId: string;
  x: number;
  y: number;
}

export interface SelectionBubbleProps {
  state: ThreadTreeState;
  sel: SelectionInfo | null;
  onSelChange: (s: SelectionInfo | null) => void;
  /** 点「开启分支讨论」：上层负责真正 fork + 放置 */
  onFork: (s: SelectionInfo) => void;
}

export function SelectionBubble({ state, sel, onSelChange, onFork }: SelectionBubbleProps) {
  /* 划选监听：mouseup 结算选区并定位气泡；mousedown / 滚动 / resize 隐藏 */
  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".sel-bubble")) return;
      // 等浏览器把 Selection 结算完再读（与拖选结束存在竞态）
      setTimeout(() => {
        const s = window.getSelection();
        const txt = s?.toString().trim() ?? "";
        if (!s || !txt || txt.length < 2) {
          onSelChange(null);
          return;
        }
        const node = s.anchorNode;
        if (!node) return;
        const base =
          node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement);
        const host = base?.closest?.('.bubble[data-role="assistant"]');
        if (!host) {
          onSelChange(null);
          return;
        }
        const listEl = host.closest(".msg-list") as HTMLElement | null;
        const msgEl = host.closest(".message") as HTMLElement | null;
        const threadId = listEl?.dataset.list;
        const msgId = msgEl?.dataset.msgId;
        if (!threadId || !msgId) return;
        // 校验划选文字确实是这条消息的连续原文（跨消息 / 跨段选择不弹气泡）
        const msg = state.threads[threadId]?.messages.find((m) => m.id === msgId);
        if (!msg || msg.text.indexOf(txt) === -1) {
          onSelChange(null);
          return;
        }
        const rect = s.getRangeAt(0).getBoundingClientRect();
        const left = Math.max(10, Math.min(rect.left, window.innerWidth - 244));
        let top = rect.bottom + 9;
        if (top > window.innerHeight - 150) top = Math.max(10, rect.top - 132);
        onSelChange({ text: txt, threadId, msgId, x: left, y: top });
      }, 10);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.(".sel-bubble")) onSelChange(null);
    };
    const onScroll = () => onSelChange(null);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [state, onSelChange]);

  if (!sel) return null;
  return (
    <div className="sel-bubble" style={{ left: sel.x, top: sel.y }}>
      <div className="lbl">在新分支中讨论这段</div>
      <div className="quote">{sel.text}</div>
      <button
        onClick={() => {
          window.getSelection()?.removeAllRanges();
          onSelChange(null);
          onFork(sel);
        }}
      >
        <GitFork size={14} />
        开启分支讨论
      </button>
    </div>
  );
}
