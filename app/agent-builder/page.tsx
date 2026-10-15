import type { Metadata } from "next";
import AgentBuilderDemo from "./demo";

export const metadata: Metadata = {
  title: "Agent Builder · Playground",
  description: "复刻 agent-builder UI：工作区侧边栏、Chat、Agent 运行面板与可缩放节点画布。",
};

export default function AgentBuilderPage() {
  return <AgentBuilderDemo />;
}
