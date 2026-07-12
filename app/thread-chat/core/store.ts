/**
 * core/store —— 外部可变 store（zustand vanilla 风格，零依赖，纯 TS）。
 *
 * 模型：会话树对象身份稳定、原地修改；每次 mutate 后 version++ 并通知订阅者，
 * React 侧经 useSyncExternalStore 以 version 为快照触发重渲（见 use-thread-store.ts）。
 * 组件不允许直接改树，所有变更走这里的方法——这也是 demo 能通过
 * react-hooks/immutability 等规则的关键：mutation 全部收敛在非 React 代码里。
 */

import type { ArtifactSeed, Message, ThreadTreeState } from "./types";
import type { ReplyProvider } from "./provider";
import { collectInherited } from "./selectors";

export interface ForkInput {
  /** 在哪个会话里划选的 */
  sourceThreadId: string;
  /** 划选的是哪条消息 */
  sourceMsgId: string;
  /** 被划选的原文（同时决定新会话标题与脚注锚点） */
  anchorText: string;
  /** 用户带着问题开分支（可选）：作为新分支的首条 user 消息；留空 = 引导回复开场 */
  firstQuestion?: string;
  /** 命中话题时随分支一起产出的 artifact */
  artifactSeed?: ArtifactSeed | null;
}

export interface ForkResult {
  threadId: string;
  artifactId: string | null;
  title: string;
}

export type ThreadStore = ReturnType<typeof createThreadStore>;

export function createThreadStore(seed: ThreadTreeState, provider: ReplyProvider) {
  const state = seed;
  let version = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    version++;
    listeners.forEach((fn) => fn());
  };

  /* 流式 chunk 的高频通知按帧合并（README §10.1 的 rAF 节流）；
     结构性变更（fork / 发消息 / touch）仍走直接 notify，保证同步反馈 */
  let notifyQueued = false;
  const scheduleNotify = () => {
    if (notifyQueued) return;
    notifyQueued = true;
    const raf: (cb: () => void) => void =
      typeof requestAnimationFrame === "function"
        ? (cb) => requestAnimationFrame(() => cb())
        : (cb) => void setTimeout(cb, 16);
    raf(() => {
      notifyQueued = false;
      notify();
    });
  };

  /** 为一条 pending 的 assistant 消息向 provider 要流式回复（fire-and-forget） */
  const streamReply = async (threadId: string, msgId: string) => {
    const t = state.threads[threadId];
    const msg = t?.messages.find((m) => m.id === msgId);
    if (!t || !msg) return;
    try {
      await provider.reply(
        { threadId, anchorText: t.anchorText, inherited: collectInherited(state, t), messages: t.messages },
        (chunk) => {
          msg.status = "streaming";
          msg.text += chunk;
          scheduleNotify();
        },
      );
      msg.status = "done";
    } catch {
      msg.status = "error";
    }
    scheduleNotify();
  };

  /** 活跃计数 + 最近访问（供 LRU 放置与 ⌘K「最近访问」chips 使用），不发通知 */
  const touchSilently = (id: string) => {
    const t = state.threads[id];
    if (!t) return;
    state.tick++;
    t.lastActive = state.tick;
    if (id !== "main") state.recents = [id, ...state.recents.filter((x) => x !== id)].slice(0, 6);
  };

  /** 登记一个 artifact（含 id 分配与 tab 顺序），不发通知 */
  const registerSilently = (sourceThreadId: string, seed_: ArtifactSeed): string => {
    const id = "a" + state.seq++;
    state.artifacts[id] = { id, sourceThreadId, ...seed_ };
    state.artifactOrder.push(id);
    return id;
  };

  return {
    getState: () => state,
    getVersion: () => version,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },

    /** 标记某会话「刚被用过」：打开、发消息、被切换到时都要调 */
    touch(id: string) {
      touchSilently(id);
      notify();
    },

    /** 从一条消息的划选文字上开出新分支；返回新会话与随带 artifact 的 id */
    fork(input: ForkInput): ForkResult | null {
      const parent = state.threads[input.sourceThreadId];
      if (!parent) return null;
      const srcMsg = parent.messages.find((m) => m.id === input.sourceMsgId);
      if (!srcMsg) return null;

      state.footnoteCounter++;
      const id = "b" + state.seq++;
      const depth = parent.depth + 1;
      const title =
        input.anchorText.length > 13 ? input.anchorText.slice(0, 13) + "…" : input.anchorText;

      const artifactId = input.artifactSeed ? registerSilently(id, input.artifactSeed) : null;

      const messages: Message[] = [];
      if (input.firstQuestion) {
        messages.push({ id: "m" + state.seq++, role: "user", text: input.firstQuestion, forks: [] });
      }
      const pending: Message = {
        id: "m" + state.seq++,
        role: "assistant",
        text: "",
        forks: [],
        artifactIds: artifactId ? [artifactId] : undefined,
        status: "pending",
      };
      messages.push(pending);
      state.threads[id] = {
        id,
        parentId: input.sourceThreadId,
        depth,
        title,
        anchorText: input.anchorText,
        forkFromMsgId: input.sourceMsgId,
        footnote: state.footnoteCounter,
        children: [],
        messages,
        lastActive: 0,
      };
      parent.children.push(id);
      srcMsg.forks.push({ text: input.anchorText, num: state.footnoteCounter, threadId: id, depth });

      notify();
      void streamReply(id, pending.id);
      return { threadId: id, artifactId, title };
    },

    /** 在某会话里发一条用户消息，并占位一条 pending 回复交给 provider 流式生成；
        该会话已有回复在生成中时拒绝（返回 false，composer 应处于禁用态） */
    send(threadId: string, userText: string): boolean {
      const t = state.threads[threadId];
      if (!t) return false;
      const last = t.messages[t.messages.length - 1];
      if (last?.role === "assistant" && (last.status === "pending" || last.status === "streaming"))
        return false;
      t.messages.push({ id: "m" + state.seq++, role: "user", text: userText, forks: [] });
      const pending: Message = {
        id: "m" + state.seq++,
        role: "assistant",
        text: "",
        forks: [],
        status: "pending",
      };
      t.messages.push(pending);
      touchSilently(threadId);
      notify();
      void streamReply(threadId, pending.id);
      return true;
    },

    /** 重试一条 error 态的回复：清空残文重新走一遍 provider */
    retryReply(threadId: string, msgId: string): boolean {
      const t = state.threads[threadId];
      const msg = t?.messages.find((m) => m.id === msgId);
      if (!t || !msg || msg.role !== "assistant" || msg.status !== "error") return false;
      msg.text = "";
      msg.status = "pending";
      notify();
      void streamReply(threadId, msgId);
      return true;
    },

    /** 单独登记一个 artifact（fork 之外的入口，预留） */
    registerArtifact(sourceThreadId: string, seed_: ArtifactSeed): string {
      const id = registerSilently(sourceThreadId, seed_);
      notify();
      return id;
    },
  };
}
