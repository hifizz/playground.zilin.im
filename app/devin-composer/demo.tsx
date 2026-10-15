"use client";

import Link from "next/link";
import { useState } from "react";
import { Cloud, Folder, GitBranch, Laptop, FileSearch, Zap } from "lucide-react";
import {
  ActionButton,
  AgentSelect,
  AttachButton,
  ComposerFrame,
  ComposerInfoBar,
  ComposerInput,
  ComposerRoot,
  ComposerToolbar,
  ContextStrip,
  DiffSummary,
  MicButton,
  ModelSelect,
  PermissionSelect,
  SelectPill,
  SendButton,
  StatusIndicator,
} from "./composer";

export default function DevinComposerDemo() {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    setSent((log) => [text, ...log].slice(0, 3));
    setValue("");
    setListening(false);
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <nav className="text-[13px] text-neutral-500">
          <Link href="/" className="hover:text-neutral-800">← Playground</Link>
        </nav>

        <header className="mt-12">
          <p className="text-xs text-neutral-400">AGENT UX/UI · COMPOSER</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">Devin Prompt Composer</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            面板自上而下：信息区（改动摘要 + 操作按钮）、白色输入卡（输入区 + 工具栏）、上下文条。
            每个 UI 元素都是独立组件，可单独替换。
          </p>
        </header>

        <section aria-label="默认组合" className="mt-10">
          <ComposerFrame>
            <ComposerInfoBar
              left={<DiffSummary files={12} additions={987} />}
              right={
                <>
                  <ActionButton variant="ghost" icon={<FileSearch size={14} strokeWidth={1.8} />}>
                    Quick review
                  </ActionButton>
                  <ActionButton variant="secondary">Reject all</ActionButton>
                  <ActionButton variant="primary">Accept all</ActionButton>
                </>
              }
            />
            <ComposerRoot>
              <ComposerInput
                value={value}
                onValueChange={setValue}
                onSubmit={submit}
                placeholder="Tip: New space (⌘N)"
              />
              <ComposerToolbar
                left={
                  <>
                    <AttachButton onAttach={() => setSent((log) => ["[附件] demo.png", ...log].slice(0, 3))} />
                    <PermissionSelect />
                    <ModelSelect />
                  </>
                }
                right={
                  <>
                    <StatusIndicator />
                    <AgentSelect />
                    <MicButton listening={listening} onToggle={setListening} />
                    <SendButton disabled={!value.trim()} onSend={submit} />
                  </>
                }
              />
            </ComposerRoot>
            <ContextStrip
              items={[
                { icon: <Laptop size={15} strokeWidth={1.8} />, label: "Local" },
                { icon: <Folder size={15} strokeWidth={1.8} />, label: "main" },
              ]}
            />
          </ComposerFrame>
        </section>

        <div aria-live="polite" className="mt-4 space-y-1 text-[13px] text-neutral-400">
          {sent.map((text, i) => (
            <p key={`${i}-${text}`} className="truncate">
              已发送：<span className="text-neutral-700">{text}</span>
            </p>
          ))}
        </div>

        <section aria-label="槽位替换示例" className="mt-14">
          <h2 className="text-sm font-semibold text-neutral-800">替换槽位示例</h2>
          <p className="mt-1.5 text-[13px] leading-6 text-neutral-500">
            同一套 Frame / Root / Toolbar，换掉信息区、工具栏左侧和上下文条的内容。
          </p>
          <div className="mt-4">
            <ComposerFrame>
              <ComposerInfoBar
                left={<span className="px-2 text-[14px] text-neutral-500">Deploy preview ready</span>}
                right={
                  <>
                    <ActionButton variant="ghost">Dismiss</ActionButton>
                    <ActionButton variant="primary">Open preview</ActionButton>
                  </>
                }
              />
              <ComposerRoot>
                <ComposerInput value="" onValueChange={() => {}} placeholder="自定义组合的 composer…" readOnly />
                <ComposerToolbar
                  left={
                    <>
                      <AttachButton />
                      <SelectPill icon={<Zap size={15} className="text-amber-500" />} label="Turbo Mode" />
                    </>
                  }
                  right={<SendButton disabled />}
                />
              </ComposerRoot>
              <ContextStrip
                items={[
                  { icon: <Cloud size={15} strokeWidth={1.8} />, label: "Remote VM" },
                  { icon: <GitBranch size={15} strokeWidth={1.8} />, label: "feat/composer" },
                ]}
              />
            </ComposerFrame>
          </div>
        </section>
      </div>
    </main>
  );
}
