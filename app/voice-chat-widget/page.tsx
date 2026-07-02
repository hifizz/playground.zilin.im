"use client";

import Link from "next/link";
import VoiceChatWidget from "./voice-chat-widget";

/**
 * ============================================================================
 * Voice Chat Widget · Demo 页
 * ============================================================================
 * 复刻 ElevenLabs 可嵌入式「对话式 AI 语音挂件」：右下角一枚玻璃拟态胶囊，点击
 * 展开为带动效的对话框（语言选择器 + 最小化 + sphere 语音球 + 通话键 + 输入框）。
 *
 * 本页放一段浅色伪落地页内容作为语境，真正的挂件 <VoiceChatWidget /> 固定在视口
 * 右下角浮在内容之上——就是它在真实站点里的样子。
 * ============================================================================
 */
export default function VoiceChatWidgetPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fafafa] text-neutral-900">
      {/* 返回首页 */}
      <Link
        href="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-neutral-600 backdrop-blur-sm transition hover:bg-white"
      >
        ← 首页
      </Link>

      {/* 伪落地页内容（给挂件一个语境） */}
      <main className="mx-auto flex max-w-4xl flex-col items-start px-8 pt-32 pb-40">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          Agent UX/UI · Voice Chat Widget
        </div>
        <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight tracking-tight text-neutral-900">
          让技术更有生命力
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-500">
          复刻 ElevenLabs 首页右下角的对话式 AI 语音挂件。点击右下角的「语音聊天」
          胶囊即可展开对话框：一颗 GrainGradient sphere 语音球 + 通话键，点击通话
          后球体内部流动加速，模拟正在对话的智能体。
        </p>

        <div className="mt-10 flex gap-3">
          <button className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700">
            注册
          </button>
          <button className="rounded-full border border-black/10 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50">
            联系销售
          </button>
        </div>

        {/* 占位卡片，让页面有「落地页」的体量 */}
        <div className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {["对话式智能体", "文本转语音", "语音克隆"].map((t) => (
            <div
              key={t}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 h-9 w-9 rounded-full bg-gradient-to-br from-sky-300 to-emerald-300" />
              <div className="text-sm font-medium text-neutral-800">{t}</div>
              <div className="mt-2 text-xs leading-relaxed text-neutral-400">
                一句话说明这个能力，用作占位，衬托右下角浮动的语音挂件。
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 真正的挂件：固定视口右下角 */}
      <VoiceChatWidget />
    </div>
  );
}
