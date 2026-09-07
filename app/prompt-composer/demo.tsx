"use client";

import Link from "next/link";
import { useState } from "react";
import PromptBar from "./prompt-bar";

export default function PromptComposerDemo() {
  const [variant, setVariant] = useState("Rounded");
  const [dark, setDark] = useState(false);
  const [tall, setTall] = useState(false);
  const [replay, setReplay] = useState(0);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <main className="prompt-demo min-h-screen bg-[var(--page)] px-5 py-10 sm:px-10" data-theme={dark ? "dark" : "light"}>
      <div className="mx-auto max-w-3xl">
        <nav className="flex items-center justify-between text-[13px] text-[var(--ink-2)]">
          <Link href="/">← Playground</Link>
          <button type="button" aria-pressed={dark} onClick={() => setDark(!dark)} className="rounded-lg border border-[var(--line)] px-3 py-1.5">{dark ? "Light mode" : "Dark mode"}</button>
        </nav>
        <header className="mt-14">
          <p className="text-xs text-[var(--ink-3)]">BEAUTIFUL UI · 08</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Prompt Composer</h1>
          <p className="mt-3 text-sm text-[var(--ink-2)]">@ 数据源、/ 快捷命令、模型选择与语音输入。</p>
        </header>
        <section aria-label="Prompt composer demo" className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--canvas)] px-4 sm:px-8">
          <div className="flex min-h-[420px] items-end justify-center">
            <PromptBar key={replay} variant={variant} tall={tall} onSend={(text) => setSent(text || "（仅附件）")} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--line)] py-5 text-xs text-[var(--ink-2)]">
            {["Rounded", "Pill"].map((item) => <button key={item} type="button" aria-pressed={variant === item} onClick={() => setVariant(item)} className={`rounded-lg px-3 py-2 ${variant === item ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : ""}`}>{item}</button>)}
            <button type="button" aria-pressed={tall} onClick={() => setTall(!tall)} className={`rounded-lg px-3 py-2 ${tall ? "bg-[var(--surface)]" : ""}`}>多行布局</button>
            <button type="button" onClick={() => { setReplay(replay + 1); setSent(null); }} className="rounded-lg px-3 py-2">重播演示 ↻</button>
          </div>
        </section>
        <p className="mt-5 text-xs leading-6 text-[var(--ink-2)]">点击即可接管自动演示。输入 @ 或 / 打开菜单，↑ ↓ 选择，Enter 确认或发送，Shift + Enter 换行，Esc 关闭。选择 Sprinkles 5 可触发彩虹扫光。</p>
        <div role="status" aria-live="polite" className="mt-4 break-words text-sm text-[var(--ink-2)]">{sent !== null && <>已发送（本地演示）：<span className="whitespace-pre-wrap text-[var(--ink)]">{sent}</span></>}</div>
        <footer className="mt-10 border-t border-[var(--line)] pt-5 text-xs leading-6 text-[var(--ink-3)]">
          <p>保留原版模拟行为：附件使用示例文件，语音填入示例转写，数据源连接与模型选择不调用真实服务。</p>
          <p>原作 <a className="underline underline-offset-4" href="https://www.beautifului.dev/#prompt-bar" target="_blank" rel="noreferrer">Beautiful UI · Shane Levine</a> · MIT License · <a className="underline underline-offset-4" href="https://github.com/slev12397/beautiful-ui" target="_blank" rel="noreferrer">源码</a></p>
        </footer>
      </div>
    </main>
  );
}
