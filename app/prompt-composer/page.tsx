import type { Metadata } from "next";
import PromptComposerDemo from "./demo";

export const metadata: Metadata = {
  title: "Prompt Composer · Playground",
  description: "Beautiful UI Prompt Bar：@ 数据源、/ 命令、模型选择与语音输入演示。",
};

export default function PromptComposerPage() {
  return <PromptComposerDemo />;
}
