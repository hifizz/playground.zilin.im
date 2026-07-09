"use client";

/**
 * ============================================================================
 * Voice Agent Transcript · Demo 页
 * ============================================================================
 * 复刻 ElevenLabs 对话式 AI 的「对话记录」挂件：一张白色卡片，顶部是 sphere 头像 +
 * 智能体名字，下面是一串聊天气泡——智能体气泡靠左（浅灰），用户气泡靠右（加粗）。
 *
 * 核心交互：每条消息不是一次性铺满，而是逐条登场——出现时带 y 轴向上偏移 + 渐显，
 * 智能体消息前还会先冒一个「正在输入」三点。播放完可点「重播」重新走一遍。
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

type Role = "agent" | "user";
type Message = { role: Role; text: string };

const AGENT_NAME = "语音智能体";

const CONVERSATION: Message[] = [
  { role: "agent", text: "你好，我可以协助销售线索筛选和预约安排。" },
  { role: "user", text: "筛选来电线索，判断意向，安排转接或演示，无需人工等待。" },
  { role: "agent", text: "收到，我会确认细节和下一步。" },
  { role: "agent", text: "我先帮你聚焦销售线索筛选和预约安排。" },
];

// 每条消息登场的节奏（ms）：智能体先显示 typing 再出气泡，用户消息直接出。
const TYPING_MS = 900;
const GAP_MS = 550;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** sphere 头像：纯 CSS 径向渐变小球（蓝绿），与站内 voice-chat-widget 同款调色。 */
function AgentAvatar({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background:
          "radial-gradient(circle at 36% 30%, #a8d9ff 0%, #4a90d9 52%, #2f6fb0 92%), radial-gradient(circle at 72% 78%, #9ad3a4, transparent 55%)",
        boxShadow: "inset -2px -3px 8px rgba(0,0,0,0.22)",
      }}
    />
  );
}

/** 智能体「正在输入」三点。 */
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "13px 16px",
        borderRadius: 20,
        borderBottomLeftRadius: 6,
        background: "#f0f0f2",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#b4b4bb",
          }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1.05,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.16,
          }}
        />
      ))}
    </div>
  );
}

function Bubble({ role, text }: Message) {
  const isAgent = role === "agent";
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      style={{
        alignSelf: isAgent ? "flex-start" : "flex-end",
        maxWidth: "82%",
        padding: "13px 17px",
        borderRadius: 20,
        borderBottomLeftRadius: isAgent ? 6 : 20,
        borderBottomRightRadius: isAgent ? 20 : 6,
        background: isAgent ? "#f0f0f2" : "#ffffff",
        border: isAgent ? "none" : "1px solid rgba(0,0,0,0.05)",
        boxShadow: isAgent ? "none" : "0 8px 22px -10px rgba(0,0,0,0.22)",
        fontSize: 16,
        lineHeight: 1.55,
        color: "#1c1c1e",
        fontWeight: isAgent ? 400 : 600,
      }}
    >
      {text}
    </motion.div>
  );
}

export default function VoiceAgentTranscriptPage() {
  const reduced = usePrefersReducedMotion();
  // 已登场的消息条数
  const [visible, setVisible] = useState(0);
  // 当前是否正在显示智能体的「输入中」
  const [typing, setTyping] = useState(false);
  const [runId, setRunId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // 播放整段对话：逐条排定 typing → bubble 的定时器。
  useEffect(() => {
    clearTimers();
    setVisible(0);
    setTyping(false);

    if (reduced) {
      // 尊重减弱动画：直接全部铺满
      setVisible(CONVERSATION.length);
      return;
    }

    let t = 400;
    CONVERSATION.forEach((msg, i) => {
      if (msg.role === "agent") {
        timers.current.push(setTimeout(() => setTyping(true), t));
        t += TYPING_MS;
        timers.current.push(
          setTimeout(() => {
            setTyping(false);
            setVisible(i + 1);
          }, t),
        );
      } else {
        timers.current.push(setTimeout(() => setVisible(i + 1), t));
      }
      t += GAP_MS;
    });

    return clearTimers;
  }, [runId, reduced, clearTimers]);

  // 新气泡 / typing 出现时滚到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const done = visible >= CONVERSATION.length && !typing;

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-16"
      style={{
        background:
          "radial-gradient(130% 100% at 50% 0%, #ffffff 0%, #ececee 78%)",
      }}
    >
      <Link
        href="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-neutral-600 backdrop-blur-sm transition hover:bg-white"
      >
        ← 首页
      </Link>

      <div className="flex w-full max-w-[420px] flex-col items-stretch gap-5">
        {/* 对话卡片 */}
        <div
          style={{
            borderRadius: 28,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 30px 70px -24px rgba(0,0,0,0.32)",
            padding: "22px 22px 26px",
          }}
        >
          {/* 头部：sphere 头像 + 名字 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingBottom: 20,
            }}
          >
            <AgentAvatar />
            <span
              style={{ fontSize: 19, fontWeight: 600, color: "#1c1c1e" }}
            >
              {AGENT_NAME}
            </span>
          </div>

          {/* 消息流 */}
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 360,
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {CONVERSATION.slice(0, visible).map((m, i) => (
              <Bubble key={`${runId}-${i}`} {...m} />
            ))}

            <AnimatePresence>
              {typing && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  style={{ alignSelf: "flex-start" }}
                >
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 重播 */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            disabled={!done}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.08)",
              background: done ? "#ffffff" : "rgba(255,255,255,0.5)",
              boxShadow: done ? "0 6px 18px -8px rgba(0,0,0,0.25)" : "none",
              cursor: done ? "pointer" : "default",
              fontSize: 14,
              fontWeight: 500,
              color: done ? "#1c1c1e" : "#b0b0b6",
              transition: "background 200ms ease, color 200ms ease",
            }}
          >
            <RotateCcw size={15} />
            重播对话
          </button>
        </div>
      </div>
    </div>
  );
}
