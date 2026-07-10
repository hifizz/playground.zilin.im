import type { Metadata } from "next";
import { ThreadChatDemo } from "./thread-chat-demo";

export const metadata: Metadata = {
  title: "Thread Chat · 分支对话（方案⑥优化版） · playground",
  description:
    "划选 AI 回复开分支的树状对话：自适应 2–4 列 + 面包屑替换，⌘K 会话树 / 每列会话切换器指定打开任意会话，Artifact 右侧抽屉舞台。",
};

export default function ThreadChatPage() {
  return <ThreadChatDemo />;
}
