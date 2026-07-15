"use client";
/**
 * branching/thread-sheet —— 移动端的 bottom sheet 会话视口（树的第四种视口）。
 *
 * 移动端没有「列」可开（分栏在手机上不成立，调研约束六）：画布是默认纵览，
 * 点节点唤起本 sheet 做深读与对话。数据仍归 store（P1：sheet 只是视口）——
 * 消息渲染 / 流式态 / 重试与其它视口同一条 version 快照管道。
 *
 * 形态：半屏（默认）⇄ 拉满（≈ 全屏单列，即移动端的「升格」语义）；
 * 点背景 scrim / 关闭按钮收起（会话在树里，画布节点随时可再唤起）。
 * 手势拖拽（下滑收起 / 上滑拉满）后置——先用显式按钮把形态跑通。
 */

import React, { useEffect, useRef } from "react";
import { ChevronsDown, ChevronsUp, X } from "lucide-react";
import type { ThreadTreeState } from "../core/types";
import { threadTitle } from "../core/selectors";
import { dc } from "../theme";

export interface ThreadSheetProps {
  state: ThreadTreeState;
  threadId: string;
  /** 拉满（≈ 全屏单列）与否由壳层持有（P10：视口状态不进领域模型） */
  full: boolean;
  onFullChange: (full: boolean) => void;
  onClose: () => void;
  onSend: (text: string) => void;
  onRetry: (msgId: string) => void;
}

export function ThreadSheet({
  state,
  threadId,
  full,
  onFullChange,
  onClose,
  onSend,
  onRetry,
}: ThreadSheetProps) {
  const thread = state.threads[threadId];
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const last = thread?.messages[thread.messages.length - 1];
  const busy =
    last?.role === "assistant" && (last.status === "pending" || last.status === "streaming");

  /* 打开滚到底并聚焦；流式期间贴底跟滚 */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    taRef.current?.focus({ preventScroll: true });
  }, [threadId]);
  useEffect(() => {
    const el = listRef.current;
    if (el && busy) el.scrollTop = el.scrollHeight;
  });

  if (!thread) return null;
  const isMain = thread.id === "main";

  const doSend = () => {
    const ta = taRef.current;
    const v = ta?.value.trim() ?? "";
    if (!v || busy) return;
    if (ta) {
      ta.value = "";
      ta.style.height = "auto";
    }
    onSend(v);
  };

  return (
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className={`sheet fc-${dc(thread.depth)} ${full ? "full" : ""}`} role="dialog" aria-label={`会话 ${thread.title}`}>
        <div className="sheet-head">
          {isMain ? (
            <span className="anchor-tag">锚定</span>
          ) : (
            thread.footnote !== null && <span className="fn">{thread.footnote}</span>
          )}
          <span className="tt">{thread.title}</span>
          <button
            className="sh-act"
            title={full ? "还原为半屏" : "拉满（全屏深读）"}
            aria-label={full ? "还原为半屏" : "拉满为全屏"}
            onClick={() => onFullChange(!full)}
          >
            {full ? <ChevronsDown size={15} /> : <ChevronsUp size={15} />}
          </button>
          <button className="sh-act" title="收起（会话保留在树里）" aria-label="收起" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        {thread.anchorText && (
          <div className="sheet-anchor">
            划选自「{threadTitle(state, thread.parentId ?? "main")}」：<q>{thread.anchorText}</q>
          </div>
        )}
        <div className="sheet-msgs" ref={listRef}>
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
        <div className="sheet-composer">
          <textarea
            ref={taRef}
            rows={1}
            placeholder={isMain ? "继续在主线提问…" : "在这个分支里追问…"}
            aria-label="在 sheet 里发消息"
            onInput={(e) => {
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
          />
          <button className="sh-send" disabled={busy} onClick={doSend}>
            {busy ? "…" : "发送"}
          </button>
        </div>
      </div>
    </>
  );
}
