"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";

type StepStatus = "done" | "active" | "pending";

type ReasoningStep = {
  label: string;
  detail: string;
  status: StepStatus;
  type: "think" | "search" | "source";
};

const INITIAL_STEPS: ReasoningStep[] = [
  {
    label: "分析问题与约束",
    detail: "识别需要最新资料，并拆分为 3 个可验证子问题",
    status: "done",
    type: "think",
  },
  {
    label: "正在搜索近期资料",
    detail: "Search the web for official documentation and release notes",
    status: "active",
    type: "search",
  },
  {
    label: "交叉核对来源",
    detail: "比较官方公告与独立报道中的时间线",
    status: "pending",
    type: "source",
  },
];

function StatusIcon({ status, type }: Pick<ReasoningStep, "status" | "type">) {
  if (status === "done") {
    return <Check aria-hidden size={14} strokeWidth={3} />;
  }
  if (status === "active") {
    return type === "search" ? (
      <Globe2 aria-hidden size={15} />
    ) : (
      <Brain aria-hidden size={15} />
    );
  }
  return <span aria-hidden className="ars-pending-dot" />;
}

function ReasoningCard({ compact = false }: { compact?: boolean }) {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(() => {
      setSteps((current) =>
        current.map((step, index) => {
          if (index === 1) return { ...step, status: "done" };
          if (index === 2) return { ...step, status: "active" };
          return step;
        }),
      );
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [isPlaying]);

  const replay = () => {
    setSteps(INITIAL_STEPS);
    setIsPlaying(true);
    setExpanded(true);
  };

  return (
    <section className={`ars-card ${compact ? "ars-card--compact" : ""}`} aria-label="Agent 推理过程">
      <div className="ars-card-head">
        <button
          className="ars-summary"
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <span className="ars-orbit"><Sparkles aria-hidden size={14} /></span>
          <span>
            <strong>Agent 正在推理</strong>
            <small>{steps.filter((step) => step.status === "done").length} / {steps.length} 个步骤完成</small>
          </span>
          {expanded ? <ChevronDown aria-hidden size={16} /> : <ChevronRight aria-hidden size={16} />}
        </button>
        {!compact && (
          <button className="ars-replay" type="button" onClick={replay}>
            重新播放
          </button>
        )}
      </div>

      {expanded && (
        <div className="ars-steps">
          {steps.map((step, index) => (
            <div className="ars-step" key={step.label}>
              <div className={`ars-marker ars-marker--${step.status}`}>
                <StatusIcon status={step.status} type={step.type} />
              </div>
              {index < steps.length - 1 && <div className={`ars-line ${step.status === "done" ? "ars-line--done" : ""}`} />}
              <div className="ars-step-content">
                <div className="ars-step-label">
                  {step.status === "active" && <LoaderCircle aria-hidden size={13} className="ars-spinner" />}
                  <span>{step.label}</span>
                  {step.status === "active" && <em>进行中</em>}
                </div>
                <p>{step.detail}</p>
                {step.type === "search" && step.status !== "pending" && (
                  <div className="ars-query"><Search aria-hidden size={13} /> latest AI agent release notes 2025</div>
                )}
                {step.type === "source" && step.status === "active" && (
                  <div className="ars-sources">
                    <span><Globe2 aria-hidden size={12} /> official.example.com</span>
                    <span><ExternalLink aria-hidden size={12} /> 2 个来源已读取</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AgentReasoningStepPage() {
  return (
    <main className="ars-page">
      <div className="ars-shell">
        <Link href="/" className="ars-back">← Playground</Link>
        <div className="ars-intro">
          <span className="ars-kicker">AGENT UX / UI</span>
          <h1>Agent reasoning step</h1>
          <p>一个可折叠的推理过程组件，用清晰、低干扰的步骤反馈展示模型思考与联网检索状态。</p>
        </div>

        <div className="ars-demo-area">
          <div className="ars-message">
            <div className="ars-avatar">AI</div>
            <div className="ars-message-body">
              <p className="ars-message-label">Assistant</p>
              <ReasoningCard />
              <p className="ars-answer-ghost">我正在整理最新信息，并会在回答中标记可核验的来源。</p>
            </div>
          </div>
        </div>

        <div className="ars-notes">
          <div><span>01</span><h2>渐进披露</h2><p>默认显示摘要，用户需要时再展开具体执行过程。</p></div>
          <div><span>02</span><h2>状态可辨识</h2><p>完成、进行中、等待三种状态不只依赖颜色区分。</p></div>
          <div><span>03</span><h2>工具上下文</h2><p>联网时显示检索词与来源数量，不暴露冗长的内部思维链。</p></div>
        </div>

        <div className="ars-compact-preview">
          <p>紧凑模式</p>
          <ReasoningCard compact />
        </div>
      </div>

      <style jsx>{`
        .ars-page { min-height: 100vh; background: #0b0d12; color: #ecedf1; padding: 42px 24px 96px; }
        .ars-shell { max-width: 790px; margin: 0 auto; }
        .ars-back { color: #858b9a; font-size: 13px; text-decoration: none; transition: color .2s; }
        .ars-back:hover { color: #fff; }
        .ars-intro { padding: 58px 0 42px; max-width: 620px; }
        .ars-kicker { color: #8b9dff; letter-spacing: .13em; font-size: 11px; font-weight: 700; }
        h1 { margin: 10px 0 12px; font-size: clamp(32px, 6vw, 52px); letter-spacing: -.055em; line-height: 1; }
        .ars-intro p { color: #969dab; font-size: 16px; line-height: 1.7; margin: 0; }
        .ars-demo-area { border: 1px solid #292d38; border-radius: 22px; background: radial-gradient(circle at 20% 0, #1a2031, #111319 48%); padding: 32px; box-shadow: 0 25px 80px #0005; }
        .ars-message { display: flex; gap: 12px; }
        .ars-avatar { display: grid; place-items: center; flex: 0 0 auto; width: 29px; height: 29px; border-radius: 9px; background: linear-gradient(145deg, #9aa9ff, #6355d8); color: #fff; font-size: 10px; font-weight: 800; }
        .ars-message-body { min-width: 0; flex: 1; }
        .ars-message-label { color: #b4bac7; font-weight: 600; font-size: 13px; margin: 5px 0 11px; }
        .ars-answer-ghost { color: #aeb4c0; font-size: 14px; line-height: 1.6; margin: 17px 2px 0; }
        .ars-card { border: 1px solid #333947; background: #151820d9; border-radius: 14px; overflow: hidden; backdrop-filter: blur(12px); }
        .ars-card-head { min-height: 52px; padding: 0 12px 0 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .ars-summary { display: flex; align-items: center; gap: 10px; border: 0; background: transparent; color: #eef0f6; text-align: left; cursor: pointer; padding: 7px 0; font: inherit; }
        .ars-summary strong { display: block; font-size: 13px; font-weight: 650; }
        .ars-summary small { display: block; margin-top: 2px; color: #818898; font-size: 11px; }
        .ars-summary > svg { color: #8b92a2; margin-left: 4px; }
        .ars-orbit { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid #6474d966; border-radius: 9px; color: #a8b2ff; background: #6877e318; }
        .ars-replay { border: 0; background: transparent; color: #8e9fff; font: inherit; font-size: 11px; cursor: pointer; padding: 6px; }
        .ars-replay:hover { color: #c8d0ff; }
        .ars-steps { border-top: 1px solid #2c313d; padding: 15px 15px 3px; }
        .ars-step { display: grid; grid-template-columns: 25px minmax(0, 1fr); position: relative; min-height: 68px; }
        .ars-marker { z-index: 1; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; margin-top: 1px; }
        .ars-marker--done { color: #82ddb1; background: #1f503d; }
        .ars-marker--active { color: #b8c2ff; background: #303a70; box-shadow: 0 0 0 4px #6e7fe016; }
        .ars-marker--pending { border: 1px solid #4a5160; background: #1b1f28; }
        .ars-pending-dot { width: 5px; height: 5px; border-radius: 50%; background: #697080; }
        .ars-line { position: absolute; left: 9px; top: 23px; height: calc(100% - 20px); width: 1px; background: #373d4a; }
        .ars-line--done { background: #397658; }
        .ars-step-content { padding: 1px 0 16px; min-width: 0; }
        .ars-step-label { display: flex; gap: 6px; align-items: center; color: #dfe2e9; font-size: 13px; font-weight: 550; }
        .ars-step-label em { color: #98a8ff; border: 1px solid #4a5799; border-radius: 99px; font-size: 10px; padding: 1px 6px; font-style: normal; font-weight: 500; }
        .ars-step-content p { margin: 4px 0 0; color: #858c9a; font-size: 12px; line-height: 1.5; }
        .ars-query { margin-top: 9px; max-width: 100%; color: #aeb5c3; border: 1px solid #363d4b; border-radius: 7px; background: #0e1015; padding: 7px 9px; display: flex; gap: 7px; align-items: center; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-x: auto; white-space: nowrap; }
        .ars-query svg { flex: 0 0 auto; color: #93a2fc; }
        .ars-sources { margin-top: 9px; display: flex; flex-wrap: wrap; gap: 6px; }
        .ars-sources span { color: #8cbdff; display: inline-flex; align-items: center; gap: 4px; border-radius: 5px; background: #1e35501f; padding: 4px 6px; font-size: 10px; }
        .ars-spinner { color: #a6b0ff; animation: ars-spin 1.1s linear infinite; }
        .ars-notes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 46px 4px; }
        .ars-notes span { color: #6676cb; font: 11px ui-monospace, monospace; }
        .ars-notes h2 { color: #d6d9e2; font-size: 14px; margin: 8px 0 6px; }
        .ars-notes p { color: #818896; font-size: 12px; line-height: 1.6; margin: 0; }
        .ars-compact-preview { max-width: 460px; margin: 0 auto; }
        .ars-compact-preview > p { color: #747b89; font-size: 12px; text-align: center; margin: 0 0 10px; }
        .ars-card--compact .ars-card-head { min-height: 46px; }
        .ars-card--compact .ars-steps { padding-top: 11px; }
        .ars-card--compact .ars-step { min-height: 57px; }
        .ars-card--compact .ars-step-content { padding-bottom: 11px; }
        @keyframes ars-spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .ars-page { padding: 26px 16px 64px; } .ars-intro { padding: 43px 0 30px; } .ars-demo-area { padding: 18px 14px; } .ars-notes { grid-template-columns: 1fr; padding: 34px 4px; gap: 24px; } }
        @media (prefers-reduced-motion: reduce) { .ars-spinner { animation: none; } }
      `}</style>
    </main>
  );
}
