import type { Metadata } from "next";
import AgentStudioDemo from "./demo";

export const metadata: Metadata = {
  title: "Outglow Studio · Playground",
  description:
    "复刻 agent-builder UI：侧边栏工作区 + Agent 会话流 + 可缩放节点画布。",
};

export default function AgentStudioPage() {
  return <AgentStudioDemo />;
}
