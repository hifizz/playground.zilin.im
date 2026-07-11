/**
 * core/store —— 外部可变 store（zustand vanilla 风格，零依赖，纯 TS）。
 *
 * 模型：会话树对象身份稳定、原地修改；每次 mutate 后 version++ 并通知订阅者，
 * React 侧经 useSyncExternalStore 以 version 为快照触发重渲（见 use-thread-store.ts）。
 * 组件不允许直接改树，所有变更走这里的方法——这也是 demo 能通过
 * react-hooks/immutability 等规则的关键：mutation 全部收敛在非 React 代码里。
 */

import type { ArtifactSeed, Message, ThreadTreeState } from "./types";

export interface ForkInput {
  /** 在哪个会话里划选的 */
  sourceThreadId: string;
  /** 划选的是哪条消息 */
  sourceMsgId: string;
  /** 被划选的原文（同时决定新会话标题与脚注锚点） */
  anchorText: string;
  /** 新分支的首条 assistant 回复（写死内容由调用方提供，core 不认识 demo 数据） */
  introText: string;
  /** 命中话题时随分支一起产出的 artifact */
  artifactSeed?: ArtifactSeed | null;
}

export interface ForkResult {
  threadId: string;
  artifactId: string | null;
  title: string;
}

export type ThreadStore = ReturnType<typeof createThreadStore>;

export function createThreadStore(seed: ThreadTreeState) {
  const state = seed;
  let version = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    version++;
    listeners.forEach((fn) => fn());
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

      const intro: Message = {
        id: "m" + state.seq++,
        role: "assistant",
        text: input.introText,
        forks: [],
        artifactIds: artifactId ? [artifactId] : undefined,
      };
      state.threads[id] = {
        id,
        parentId: input.sourceThreadId,
        depth,
        title,
        anchorText: input.anchorText,
        forkFromMsgId: input.sourceMsgId,
        footnote: state.footnoteCounter,
        children: [],
        messages: [intro],
        lastActive: 0,
      };
      parent.children.push(id);
      srcMsg.forks.push({ text: input.anchorText, num: state.footnoteCounter, threadId: id, depth });

      notify();
      return { threadId: id, artifactId, title };
    },

    /** 在某会话里发一条用户消息，并立刻附上（调用方给的）assistant 回复 */
    send(threadId: string, userText: string, replyText: string): boolean {
      const t = state.threads[threadId];
      if (!t) return false;
      t.messages.push({ id: "m" + state.seq++, role: "user", text: userText, forks: [] });
      t.messages.push({ id: "m" + state.seq++, role: "assistant", text: replyText, forks: [] });
      touchSilently(threadId);
      notify();
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
