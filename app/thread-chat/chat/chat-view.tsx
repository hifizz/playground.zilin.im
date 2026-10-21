"use client";
/**
 * chat/chat-view —— 单会话视图：消息列表 + composer + who 标签。
 *
 * 这一层不知道「树 / 列 / 分支」的存在：锚点高亮、脚注、artifact 卡片等
 * 分支能力全部通过 renderAssistantBody / renderAfterMessage 两个渲染插槽注入，
 * 列头 / focus banner / 继承上文则作为 header / banner ReactNode 传入。
 *
 * .lane 是纯展示的阅读通道包装（max --lane-max、列内居中）：消息流与 composer
 * 的内容收敛在通道里，纸面 / padding / 边框仍随列通栏；本层不感知列宽。
 */

import React, { useEffect, useRef } from "react";
import type { Message } from "../core/types";

/** 把 \n 转成 <br/>（assistant 正文按段落渲染时的行内换行） */
export function withBreaks(s: string, keyBase: string): React.ReactNode[] {
  const lines = s.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyBase}-br${i}`} />);
    if (line) out.push(line);
  });
  return out;
}

/** 默认的 assistant 正文渲染：按空行分段（无任何分支装饰） */
function defaultAssistantBody(msg: Message): React.ReactNode {
  return msg.text.split("\n\n").map((p, i) => <p key={i}>{withBreaks(p, `p${i}`)}</p>);
}

export interface ChatViewProps {
  /** 会话 id：写到 .msg-list 的 data-list 上（划选气泡靠它反查消息） */
  threadId: string;
  messages: Message[];
  isMain?: boolean;
  /** 列头区（面包屑 / 标题行），由上层（branching）组装 */
  header?: React.ReactNode;
  /** 列头之下、消息列表之上的横幅区（focus banner / 继承的上文） */
  banner?: React.ReactNode;
  /** 消息列表顶部的插卡（主线的 hint 提示） */
  intro?: React.ReactNode;
  /** 注入 assistant 正文渲染（锚点高亮 + 脚注上标） */
  renderAssistantBody?: (msg: Message) => React.ReactNode;
  /** 注入 assistant 消息气泡之后的附加内容（artifact 卡片） */
  renderAfterMessage?: (msg: Message) => React.ReactNode;
  onSend: (text: string) => void;
  /** 重试一条 error 态的 assistant 回复 */
  onRetry?: (msgId: string) => void;
}

export function ChatView({
  threadId,
  messages,
  isMain = false,
  header,
  banner,
  intro,
  renderAssistantBody,
  renderAfterMessage,
  onSend,
  onRetry,
}: ChatViewProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  /* 本会话是否有回复正在生成（composer 禁发；store.send 同时兜底拒绝） */
  const last = messages[messages.length - 1];
  const busy = last?.role === "assistant" && (last.status === "pending" || last.status === "streaming");

  /* 流式期间跟底滚动：仅当用户本就贴近底部时（不打断向上翻阅）。
     每次流式 chunk 都会经 version 快照触发重渲，故效果不需要依赖数组 */
  useEffect(() => {
    if (!busy) return;
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  });

  const autoGrow = (ta: HTMLTextAreaElement) => {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const doSend = () => {
    const ta = taRef.current;
    if (!ta || busy) return;
    const v = ta.value.trim();
    if (!v) return;
    ta.value = "";
    ta.style.height = "auto";
    onSend(v);
    ta.focus();
    // 等新消息渲染完成后滚到底
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const renderMessage = (msg: Message) => {
    const st = msg.role === "assistant" ? (msg.status ?? "done") : "done";
    return (
      <div key={msg.id} className={`message ${msg.role}`} data-msg-id={msg.id}>
        <div className="who">{msg.role === "user" ? "你" : "AI"}</div>
        {msg.role === "user" ? (
          <div className="bubble" data-role="user">
            {msg.text}
          </div>
        ) : (
          <>
            <div className="bubble" data-role="assistant" data-status={st}>
              {st === "pending" ? (
                <span className="typing" role="status" aria-label="正在生成回复">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                (renderAssistantBody ?? defaultAssistantBody)(msg)
              )}
              {st === "streaming" && <span className="scaret" aria-hidden="true" />}
            </div>
            {st === "error" && (
              <div className="msg-error" role="alert">
                <span>回复生成失败</span>
                {onRetry && (
                  <button className="retry" onClick={() => onRetry(msg.id)}>
                    重试
                  </button>
                )}
              </div>
            )}
            {renderAfterMessage?.(msg)}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {header}
      {banner}
      <div className="msg-list" data-list={threadId} ref={listRef}>
        <div className="lane">
          {intro}
          {messages.map(renderMessage)}
        </div>
      </div>
      <div className={`composer ${isMain ? "" : "branch"}`}>
        <div className="lane">
          <div className="box">
            <textarea
              rows={1}
              placeholder={isMain ? "继续在主线提问…" : "在这个分支里追问…"}
              ref={taRef}
              onInput={(e) => autoGrow(e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  doSend();
                }
              }}
            />
            <button className="send" onClick={doSend} disabled={busy}>
              {busy ? "生成中…" : "发送"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
