"use client";
/**
 * orchestration/canvas-node —— 画布模式的自定义节点：一个 thread 一张「手稿纸质」卡。
 *
 * 与列模式同一套纸墨视觉语言（复用 .tc 的 CSS 变量 / .anchor-tag）：
 * 深度色左缘 3px + 脚注号徽章 + 衬线标题 + 讨论焦点引文 + 末条消息摘要 + meta 行；
 * 主线卡特殊化为「锚定」tag + 主题副标题。data 全部由 use-canvas-layout 派生成
 * 展示就绪的字段（本组件纯展示、React.memo，skill 契约：custom node 优先 + memo）。
 *
 * Phase 2 节点内对话：选中节点在卡片下方弹出「外挂面板」（绝对定位，不参与
 * dagre 布局——展开不引发全树重排）：真实消息列表 + 内嵌 composer。消息列表
 * 复用列模式的划选 DOM 契约（.msg-list[data-list] / .message[data-msg-id] /
 * .bubble[data-role="assistant"]），document 级划选气泡在画布里原样生效；
 * 面板挂 nodrag/nowheel（面板内滚动与选字不触发节点拖拽/画布缩放），双击
 * 停止冒泡（不误触「回列模式」）。发送/重试经 CanvasActionsContext 直达 store。
 *
 * Handle 仅为边的定位锚点（isConnectable=false，CSS 以 opacity 隐藏——
 * 不能 display:none，会破坏 React Flow 的边坐标计算，skill 契约 #8）。
 */

import React, { createContext, memo, useContext, useEffect, useRef } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Message } from "../core/types";

/** 画布节点可执行的会话动作（由 ThreadCanvas 提供，直达 store） */
export interface CanvasActions {
  send: (threadId: string, text: string) => boolean;
  retry: (threadId: string, msgId: string) => boolean;
}
export const CanvasActionsContext = createContext<CanvasActions | null>(null);

export interface CanvasCardData extends Record<string, unknown> {
  isMain: boolean;
  title: string;
  /** 主线卡的主题副标题（与列模式主线副标题同源，由壳层传入） */
  subtitle: string | null;
  depth: number;
  footnote: number | null;
  /** 讨论焦点（划选原文，已截断；主线为 null） */
  anchor: string | null;
  /** 末条消息摘要（~90 字，已截断） */
  summary: string;
  msgCount: number;
  artifactCount: number;
  /** 深度强调色 / 圆点色（theme.ts 的 accentOf / dotColorOf） */
  accent: string;
  dot: string;
  /** 完整消息列表（外挂面板用；store 原地可变，随 version 重派生保证最新） */
  messages: Message[];
}

export type CanvasCardNode = Node<CanvasCardData, "threadCard">;

/** 选中态的外挂对话面板：消息列表（可划选开分支）+ composer */
function CanvasExpand({ threadId, data }: { threadId: string; data: CanvasCardData }) {
  const actions = useContext(CanvasActionsContext);
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const last = data.messages[data.messages.length - 1];
  const busy =
    last?.role === "assistant" && (last.status === "pending" || last.status === "streaming");

  /* 展开与流式期间贴底（面板自身滚动，nowheel 已把滚轮留给它） */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const doSend = () => {
    const ta = taRef.current;
    const v = ta?.value.trim() ?? "";
    if (!v || busy || !actions) return;
    if (ta) {
      ta.value = "";
      ta.style.height = "auto";
    }
    actions.send(threadId, v);
  };

  return (
    <div className="canvas-expand nodrag nowheel" onDoubleClick={(e) => e.stopPropagation()}>
      <div className="msg-list mini" data-list={threadId} ref={listRef}>
        {data.messages.map((m) => {
          const st = m.role === "assistant" ? (m.status ?? "done") : "done";
          return (
            <div key={m.id} className={`message ${m.role}`} data-msg-id={m.id}>
              {m.role === "user" ? (
                <div className="bubble" data-role="user">
                  {m.text}
                </div>
              ) : (
                <div className="bubble" data-role="assistant" data-status={st}>
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
                  {st === "error" && actions && (
                    <button className="bt-retry" onClick={() => actions.retry(threadId, m.id)}>
                      生成失败 · 重试
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="cv-composer">
        <textarea
          ref={taRef}
          rows={1}
          placeholder="在此会话继续…（划选 AI 文字可开分支）"
          aria-label="在画布节点里继续对话"
          onInput={(e) => {
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 68) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
        />
        <button className="cv-send" disabled={busy} onClick={doSend}>
          {busy ? "…" : "发送"}
        </button>
      </div>
    </div>
  );
}

export const CanvasCard = memo(function CanvasCard({ id, data, selected }: NodeProps<CanvasCardNode>) {
  return (
    <div
      className={`canvas-card${selected ? " expanded" : ""}`}
      style={{ "--accent": data.accent } as React.CSSProperties}
      title={selected ? undefined : "单击：就地展开对话 · 双击：回到列模式打开"}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="chead">
        {data.isMain ? (
          <span className="anchor-tag">锚定</span>
        ) : (
          data.footnote !== null && <span className="fn">{data.footnote}</span>
        )}
        <span className="ttl">{data.title}</span>
      </div>
      {data.subtitle && <div className="sub">{data.subtitle}</div>}
      {data.anchor && <div className="anch">「{data.anchor}」</div>}
      {!selected && data.summary && <div className="sum">{data.summary}</div>}
      <div className="meta">
        <span>{data.msgCount} 条消息</span>
        {data.artifactCount > 0 && (
          <span className="am">
            <span className="dot" style={{ background: data.dot }} />
            {data.artifactCount} Artifact
          </span>
        )}
      </div>
      {selected && <CanvasExpand threadId={id} data={data} />}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
});
