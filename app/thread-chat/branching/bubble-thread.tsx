"use client";
/**
 * branching/bubble-thread —— 气泡内轻量对话：会话树的第三种视口（P1 的兑现）。
 *
 * 数据从不属于这里：首次提交输入那一刻壳层已 store.fork 入树（脚注同步落原文），
 * 本组件只是渲染该 thread 的迷你视口——追问复用同一 store.send、状态同一条
 * version 快照管道。升格 = openBranchUI 换视口不换数据（无损承诺）；收起 = 折叠
 * 成贴边徽标（thread 仍在树里，⌘K / 画布 / 脚注都能找到它）。
 *
 * 锚定跟随：气泡钉在原文锚点（.anchored[data-fork]）上，滚动 / 列宽变化经 rAF
 * 重算位置；锚点滚出视口或所在列关闭时自动折叠成徽标，点徽标滚回原文并展开。
 *
 * 轮次上限（调研 §1.9「轮次信号」）：轻容器按 2 轮问答设计——第 2 轮完成后出现
 * 升格提示，第 3 次提交自动升格并把该输入作为第 3 问在列里发出（不打断）。
 * 气泡内的 assistant 文字不挂 .bubble[data-role]，结构性避免「气泡里套气泡」。
 */

import React, { useEffect, useRef, useState } from "react";
import { Columns3, Minus } from "lucide-react";
import type { ThreadTreeState } from "../core/types";
import { dc } from "../theme";

const POP_W = 340;
const POP_EST_H = 400;

export interface BubbleThreadProps {
  state: ThreadTreeState;
  threadId: string;
  /** 折叠成徽标（Esc / 点外部 / 锚点出视口）；展开与否由壳层持有 */
  collapsed: boolean;
  onCollapsedChange: (c: boolean) => void;
  onSend: (text: string) => void;
  onRetry: (msgId: string) => void;
  /** 升格为分支列：pendingText = 升格时随手带走的输入（作为下一问在列里发出） */
  onUpgrade: (pendingText?: string, keepSource?: boolean) => void;
}

export function BubbleThread({
  state,
  threadId,
  collapsed,
  onCollapsedChange,
  onSend,
  onRetry,
  onUpgrade,
}: BubbleThreadProps) {
  const thread = state.threads[threadId];
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const last = thread?.messages[thread.messages.length - 1];
  const busy = last?.role === "assistant" && (last.status === "pending" || last.status === "streaming");
  const rounds = thread?.messages.filter((m) => m.role === "user").length ?? 0;
  const atLimit = rounds >= 2;

  /* ---------- 锚定跟随：rAF 重算位置；锚点不可见 → 自动折叠成徽标 ---------- */
  useEffect(() => {
    if (collapsed) return;
    let raf = 0;
    const update = () => {
      const el = document.querySelector(`.anchored[data-fork="${threadId}"]`);
      const r = el?.getBoundingClientRect();
      if (!r || r.width === 0 || r.bottom < 46 || r.top > window.innerHeight - 46) {
        onCollapsedChange(true); // 锚点出视口 / 所在列已关：折叠成徽标
        return;
      }
      const x = Math.max(10, Math.min(r.left, window.innerWidth - (POP_W + 14)));
      let y = r.bottom + 8;
      if (y + POP_EST_H > window.innerHeight) y = Math.max(10, r.top - (POP_EST_H + 8));
      setPos({ x, y });
    };
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [collapsed, threadId, onCollapsedChange]);

  /* ---------- 点气泡外部 = 收起成徽标（对话已入树，零丢失） ---------- */
  useEffect(() => {
    if (collapsed) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.(".bt-pop") && !t.closest?.(".bt-badge")) onCollapsedChange(true);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [collapsed, onCollapsedChange]);

  /* ---------- 展开即聚焦 composer；流式期间贴底跟滚 ---------- */
  useEffect(() => {
    if (!collapsed) taRef.current?.focus({ preventScroll: true });
  }, [collapsed]);
  useEffect(() => {
    const el = listRef.current;
    if (el && busy) el.scrollTop = el.scrollHeight;
  });

  if (!thread) return null;
  const depthCls = `fc-${dc(thread.depth)}`;

  /* ---------- 徽标态 ---------- */
  if (collapsed) {
    return (
      <button
        className={`bt-badge ${depthCls}`}
        title={`轻对话「${thread.title}」· 点击回到原文并展开`}
        aria-label={`展开轻对话 ${thread.title}`}
        onClick={() => {
          document
            .querySelector(`.anchored[data-fork="${threadId}"]`)
            ?.scrollIntoView({ block: "center", behavior: "instant" });
          onCollapsedChange(false);
        }}
      >
        <span className="fn">{thread.footnote}</span>
        <span className="tt">{thread.title}</span>
      </button>
    );
  }

  const submit = (meta: boolean) => {
    const ta = taRef.current;
    const v = ta?.value.trim() ?? "";
    if (meta) {
      onUpgrade(v || undefined, true); // ⌘Enter = 立即升格（保留来源列语义），输入带走
      return;
    }
    if (!v || busy) return;
    if (atLimit) {
      onUpgrade(v); // 第 3 次提交：自动升格，该输入作为第 3 问在列里发出
      return;
    }
    if (ta) {
      ta.value = "";
      ta.style.height = "auto";
    }
    onSend(v);
  };

  return (
    <div className={`bt-pop ${depthCls}`} ref={popRef} style={{ left: pos?.x ?? 40, top: pos?.y ?? 80 }}>
      <div className="bt-head">
        <span className="fn">{thread.footnote}</span>
        <span className="tt" title={thread.anchorText ?? undefined}>
          {thread.title}
        </span>
        <button
          className="bt-act"
          title="展开为完整分支列（⌘点击 = 保留来源列）"
          onClick={(e) => onUpgrade(undefined, e.metaKey || e.ctrlKey)}
        >
          <Columns3 size={12} />
          开列
        </button>
        <button className="bt-act" title="收起成徽标（对话保留在树里）" onClick={() => onCollapsedChange(true)}>
          <Minus size={12} />
        </button>
      </div>
      <div className="bt-msgs" ref={listRef}>
        {thread.messages.map((m) => {
          const st = m.role === "assistant" ? (m.status ?? "done") : "done";
          return (
            <div key={m.id} className={`bt-msg ${m.role}`} data-status={st}>
              {st === "pending" ? (
                <span className="typing" role="status" aria-label="正在生成回复">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                m.text
              )}
              {st === "streaming" && <span className="scaret" aria-hidden="true" />}
              {st === "error" && (
                <button className="bt-retry" onClick={() => onRetry(m.id)}>
                  生成失败 · 重试
                </button>
              )}
            </div>
          );
        })}
      </div>
      {atLimit && !busy && (
        <div className="bt-limit">
          继续深入？下次提交将自动<b>展开为分支列</b>（⌘⏎ 立即展开）
        </div>
      )}
      <div className="bt-composer">
        <textarea
          ref={taRef}
          rows={1}
          placeholder={atLimit ? "再问将展开为分支列…" : "就这个点追问…"}
          aria-label="在轻对话里追问"
          onInput={(e) => {
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 68) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e.metaKey || e.ctrlKey);
            }
          }}
        />
        <button className="bt-send" disabled={busy} onClick={() => submit(false)}>
          {busy ? "…" : "发送"}
        </button>
      </div>
    </div>
  );
}
