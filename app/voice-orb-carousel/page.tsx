"use client";

import { useState } from "react";
import Link from "next/link";
import VoiceOrbCarousel, {
  DEFAULT_ORBS,
  type OrbConfig,
} from "./voice-orb-carousel";

/**
 * ============================================================================
 * Voice Orb Carousel · Demo 页
 * ============================================================================
 * 用 @paper-design/shaders-react 复刻 ElevenLabs 的「音色球轮播」：中间激活球用
 * MeshGradient / GrainGradient 真实 WebGL 流动，左右邻居静止占位，最外侧两片用
 * CSS 渐变虚化（省 WebGL context）。整颗圆是 CSS radial-gradient mask 裁出来的。
 *
 * 交互：点左右箭头 / 点邻居球 / 键盘 ← → 切换；点激活球中央的播放键触发 onPlay，
 * 这里用一行「正在播放」状态回显。尊重 prefers-reduced-motion。
 *
 * 组件设计为浅色底（深色文字 + 白色播放键），所以本页用浅色背景承托。
 * ============================================================================
 */
export default function VoiceOrbCarouselPage() {
  const [nowPlaying, setNowPlaying] = useState<OrbConfig | null>(null);

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-neutral-900">
      {/* 返回首页 */}
      <Link
        href="/"
        className="fixed left-6 top-6 z-50 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-neutral-600 backdrop-blur-sm transition hover:bg-white"
      >
        ← 首页
      </Link>

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16">
        <header className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            Explored Demo · paper-shaders
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            Voice Orb Carousel
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
            复刻 ElevenLabs 的音色球轮播。激活球用 MeshGradient / GrainGradient
            实时流动，圆形靠 CSS 遮罩裁出软边；为控制 WebGL context 数量，只有中间
            那颗真正在动，最外侧两片用 CSS 渐变虚化。
          </p>
        </header>

        {/* 轮播主体 */}
        <VoiceOrbCarousel onPlay={setNowPlaying} />

        {/* onPlay 状态回显 */}
        <div className="mt-2 h-6 text-sm text-neutral-500">
          {nowPlaying ? (
            <span>
              ▶ 正在播放
              <span className="mx-1 font-medium text-neutral-800">
                {nowPlaying.label}
              </span>
              示例
            </span>
          ) : (
            <span className="text-neutral-400">
              点中央播放键试听 · 左右箭头 / ← → 切换音色
            </span>
          )}
        </div>

        {/* 提示：三颗音色 */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {DEFAULT_ORBS.map((orb) => (
            <span
              key={orb.id}
              className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs text-neutral-500 shadow-sm"
            >
              {orb.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
