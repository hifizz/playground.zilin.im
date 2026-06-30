"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Rocket,
  GraduationCap,
  Wand2,
  Bell,
  ArrowRight,
} from "lucide-react";
import {
  Onboarding,
  OnboardingBanner,
  type OnboardingPosition,
} from "./onboarding";

/**
 * ============================================================================
 * Onboarding 引导卡片 · Demo 页
 * ============================================================================
 * 上半部分：可交互 playground —— 选角落、调间距、看事件回调日志，从视口角落真实弹出。
 * 下半部分：变体画廊 —— 用 strategy="absolute" 把卡片关进预览框，演示「替换内部元素」。
 * ============================================================================
 */

const POSITIONS: { value: OnboardingPosition; label: string }[] = [
  { value: "top-left", label: "左上 top-left" },
  { value: "top-right", label: "右上 top-right" },
  { value: "bottom-left", label: "左下 bottom-left" },
  { value: "bottom-right", label: "右下 bottom-right" },
];

export default function OnboardingPage() {
  // —— 受控的 live 卡片：从浏览器视口角落真实弹出 ——
  const [position, setPosition] = useState<OnboardingPosition>("bottom-left");
  const [offset, setOffset] = useState(24);
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (msg: string) =>
    setLog((prev) => [`${time()} · ${msg}`, ...prev].slice(0, 8));

  return (
    <div className="min-h-screen w-full bg-[#0a0a0d] py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Agent UX/UI · Onboarding
          </div>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            Onboarding 引导卡片
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/50">
            复刻 HeroUI 官网角落那张新功能引导卡片，做成「可换角落 · 可替换内部元素 ·
            可挂事件回调」的复合组件。下方 playground 会从浏览器视口角落真实弹出。
          </p>
        </header>

        {/* ———————————————— Playground ———————————————— */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* 左：控件 */}
          <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#101013] p-6">
            <Field label="弹出位置 position">
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPosition(p.value);
                      pushLog(`position → ${p.value}`);
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors ${
                      position === p.value
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`距角落间距 offset · ${offset}px`}>
              <input
                type="range"
                min={0}
                max={80}
                step={2}
                value={offset}
                onChange={(e) => setOffset(parseInt(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setOpen(true);
                  pushLog("手动重新弹出");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-white/90"
              >
                <Sparkles size={14} /> 弹出引导
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5"
              >
                隐藏
              </button>
            </div>
          </div>

          {/* 右：事件日志 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101013] p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                事件回调日志
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                  open
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {open ? "open" : "closed"}
              </span>
            </div>
            <div className="flex min-h-[160px] flex-col gap-1.5 rounded-lg bg-black/40 p-3 font-mono text-[12px]">
              {log.length === 0 ? (
                <span className="text-white/30">
                  点击卡片上的按钮 / 关闭，回调会打到这里…
                </span>
              ) : (
                log.map((line, i) => (
                  <span
                    key={i}
                    className={i === 0 ? "text-white/85" : "text-white/40"}
                  >
                    {line}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ———————————————— 变体画廊：演示替换内部元素 ———————————————— */}
        <section className="flex flex-col gap-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            可替换内部元素 · 变体画廊
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* ① 默认 Pro banner（用 OnboardingBanner，全 props 驱动） */}
            <Stage
              caption="① 默认实现 · OnboardingBanner"
              corner="bottom-left"
            >
              <OnboardingBanner
                strategy="absolute"
                position="bottom-left"
                offset={16}
                width={300}
                defaultOpen
              />
            </Stage>

            {/* ② 替换 media + 配色：换成「功能上新」教程卡 */}
            <Stage caption="② 替换 media / 背景 / 按钮" corner="top-right">
              <OnboardingBanner
                strategy="absolute"
                position="top-right"
                offset={16}
                width={300}
                defaultOpen
                background={
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg,#f2e9ff 0%,#ffe9f0 50%,#fff4dc 100%)",
                    }}
                  />
                }
                media={
                  <div className="flex flex-col items-center gap-2 text-[#7c3aed]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
                      <GraduationCap size={28} />
                    </div>
                    <span className="text-[15px] font-semibold">新手引导</span>
                  </div>
                }
                eyebrow={null}
                title="3 步上手工作流"
                description="跟着交互式向导走一遍，30 秒了解核心能力。"
                primaryAction={{ label: "开始" }}
                secondaryAction={{ label: "跳过" }}
              />
            </Stage>

            {/* ③ 完全用复合组件手搓结构：无 media、自定义 footer */}
            <Stage caption="③ 复合组件手搓 · 自定义结构" corner="bottom-right">
              <Onboarding.Root
                strategy="absolute"
                position="bottom-right"
                offset={16}
                width={300}
                defaultOpen
              >
                <Onboarding.Close />
                <Onboarding.Body className="gap-3 p-5 pt-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                      <Bell size={18} />
                    </div>
                    <Onboarding.Title className="text-[15px]">
                      有 1 条新通知
                    </Onboarding.Title>
                  </div>
                  <Onboarding.Description className="text-[13px]">
                    你订阅的构建已完成，点开查看详细日志与产物。
                  </Onboarding.Description>
                  <Onboarding.Footer className="mt-1">
                    <Onboarding.Action
                      variant="ghost"
                      closeOnClick
                      className="flex-none px-2"
                    >
                      稍后
                    </Onboarding.Action>
                    <Onboarding.Action variant="solid" closeOnClick>
                      <span className="inline-flex items-center gap-1">
                        查看 <ArrowRight size={14} />
                      </span>
                    </Onboarding.Action>
                  </Onboarding.Footer>
                </Onboarding.Body>
              </Onboarding.Root>
            </Stage>
          </div>
        </section>

        <footer className="pb-6 text-xs leading-relaxed text-white/30">
          复合组件结构 ——
          <Code>Onboarding.Root</Code>（角落定位 + 入场动画 + 受控开关）内放
          <Code>Media</Code> / <Code>Close</Code> / <Code>Body</Code> /
          <Code>Title</Code> / <Code>Description</Code> / <Code>Footer</Code> /
          <Code>Action</Code>，每块都能换。
          <Code>OnboardingBanner</Code> 是基于它们拼好的开箱即用默认款。
        </footer>
      </div>

      {/* ———————————————— Live：从视口角落真实弹出的受控卡片 ———————————————— */}
      <OnboardingBanner
        position={position}
        offset={offset}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          pushLog(`onOpenChange(${next})`);
        }}
        onClose={() => pushLog("onClose · 点了关闭 ✕")}
        primaryAction={{
          label: (
            <span className="inline-flex items-center gap-1.5">
              <Rocket size={14} /> Explore Pro
            </span>
          ),
          onClick: () => pushLog("primaryAction · Explore Pro"),
          closeOnClick: true,
        }}
        secondaryAction={{
          label: "Close",
          onClick: () => pushLog("secondaryAction · Close"),
          closeOnClick: true,
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 小工具组件
// ----------------------------------------------------------------------------
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-medium text-white/60">{label}</span>
      {children}
    </div>
  );
}

/** 预览框：relative 容器 + 角标，里面放 strategy="absolute" 的卡片 */
function Stage({
  caption,
  corner,
  children,
}: {
  caption: string;
  corner: OnboardingPosition;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[12px] text-white/50">
        <Wand2 size={13} className="text-white/40" />
        {caption}
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#08080b]">
        {/* 浅浅的网格底，衬出卡片悬浮在「页面角落」 */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <span className="absolute left-3 top-3 font-mono text-[10px] text-white/25">
          {corner}
        </span>
        {children}
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/70">
      {children}
    </code>
  );
}

function time() {
  // 避免直接 new Date() 在某些环境受限：用本地时间格式
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
