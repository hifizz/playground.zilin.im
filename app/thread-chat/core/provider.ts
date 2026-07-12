/**
 * core/provider —— 回复生成器的接口（headless，纯 TS）。
 *
 * store 在 fork / send / retry 时向 provider 要一条流式回复：provider 对 onChunk
 * 逐段推送文本，resolve = 生成完成，reject/throw = 生成失败（store 置 error 态）。
 * 上下文构造是 P3 的兑现：inherited 由 collectInherited 沿 lineage 现查（不复制），
 * anchorText 是本分支的讨论焦点——真实模型实现把它注入 system prompt（README §10.2）。
 *
 * 实现方：demo 期为 mock-provider（canned 内容按节奏流出）；接真实模型时换成
 * 走 API 路由的实现，store 与各视图层零改动。
 */

import type { Message } from "./types";

export interface ReplyRequest {
  threadId: string;
  /** 本分支的讨论焦点（划选原文；主线为 null） */
  anchorText: string | null;
  /** 继承的上文（分叉点之前的父线消息，查询所得，视为只读） */
  inherited: Message[];
  /** 本分支的消息序列（末尾含刚占位的 pending assistant，text 为空，视为只读） */
  messages: Message[];
}

export interface ReplyProvider {
  /** 流式生成一条回复；chunk 为增量文本；signal 供未来取消用（demo 期未接） */
  reply(req: ReplyRequest, onChunk: (chunk: string) => void, signal?: AbortSignal): Promise<void>;
  /** 分支首答完成后生成 4–8 字标题（README §10.5）；返回 null = 保持现有标题。
      可选：不实现则标题维持「锚点截断」的默认值 */
  generateTitle?(req: ReplyRequest): Promise<string | null>;
}
