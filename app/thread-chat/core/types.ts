/**
 * core/types —— 会话树的领域类型（headless，纯 TS，不含任何 React / DOM 概念）。
 *
 * 命名约定：一次「会话」称为 Thread（原型时期叫 Branch），主线也是一个 Thread（id 固定 "main"）。
 * 整棵树 + Artifact 登记表构成 ThreadTreeState，由 core/store.ts 统一变更。
 */

export type Role = "user" | "assistant";
export type ArtifactKind = "code" | "note";

export interface Artifact {
  id: string;
  title: string;
  kind: ArtifactKind;
  lang?: string;
  content: string;
  /** 产生该 artifact 的会话（main 或分支 id） */
  sourceThreadId: string;
}

/** 尚未落库的 artifact 内容（种子），落库时由 store 补全 id / 来源会话 */
export type ArtifactSeed = Omit<Artifact, "id" | "sourceThreadId">;

/** 挂在消息原文上的分支锚点：一段被划选的文字 + 对应脚注号 + 目标会话。
    prefix/suffix 为划选处前后各 ≤32 字的原文上下文（W3C TextQuoteSelector 思路），
    用于同文多次出现时的鲁棒定位；缺省时退回顺延匹配 */
export interface Fork {
  text: string;
  num: number;
  threadId: string;
  depth: number;
  prefix?: string;
  suffix?: string;
}

/** assistant 回复的生成状态；缺省视为 done（种子数据与 user 消息不携带） */
export type MessageStatus = "pending" | "streaming" | "done" | "error";

export interface Message {
  id: string;
  role: Role;
  text: string;
  forks: Fork[];
  artifactIds?: string[];
  status?: MessageStatus;
}

export interface Thread {
  id: string;
  parentId: string | null;
  depth: number;
  title: string;
  /** 开出本会话时被划选的原文（主线为 null） */
  anchorText: string | null;
  /** 从父会话哪条消息分叉出来（决定「继承的上文」截断点） */
  forkFromMsgId: string | null;
  footnote: number | null;
  children: string[];
  messages: Message[];
  /** 单调递增的活跃计数，用于「列满时替换 / 折叠最久未使用列」 */
  lastActive: number;
}

export interface ThreadTreeState {
  threads: Record<string, Thread>;
  artifacts: Record<string, Artifact>;
  artifactOrder: string[];
  /** 最近访问过的会话（不含主线，新→旧，⌘K 面板的 chips 用） */
  recents: string[];
  footnoteCounter: number;
  seq: number;
  tick: number;
}
