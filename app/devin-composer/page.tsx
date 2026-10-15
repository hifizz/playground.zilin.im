import type { Metadata } from "next";
import DevinComposerDemo from "./demo";

export const metadata: Metadata = {
  title: "Devin Prompt Composer · Playground",
  description: "复刻 Devin Desktop 输入框：全插槽化组件，每个 UI 元素可独立替换。",
};

export default function DevinComposerPage() {
  return <DevinComposerDemo />;
}
