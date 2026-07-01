"use client";

import React from "react";
import { GrainGradient } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * GrainGradient · 带颗粒噪点的流动渐变，做 hero 背景。
 * 参考 https://shaders.paper.design/grain-gradient
 * shape 可选：wave / dots / truchet / corners / ripple / blob / sphere。
 */
export interface GrainGradientSectionProps {
  colors?: string[];
  colorBack?: string;
  softness?: number;
  intensity?: number;
  noise?: number;
  speed?: number;
  shape?: "wave" | "dots" | "truchet" | "corners" | "ripple" | "blob" | "sphere";
}

export function GrainGradientSection({
  colors = ["#0891b2", "#22d3ee", "#2563eb", "#10b981"],
  colorBack = "#05060a",
  softness = 0.6,
  intensity = 0.45,
  noise = 0.3,
  speed = 0.6,
  shape = "corners",
}: GrainGradientSectionProps) {
  return (
    <ShaderSection
      id="grain-gradient"
      index="01"
      name="Grain Gradient"
      description="带颗粒噪点的流动渐变，作为 hero 背景层。"
      foreground={
        <div className="px-6 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan-300/70">
            Paper Shaders · WebGL
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_20px_rgba(8,145,178,0.35)] md:text-6xl">
            冷色系着色器画廊
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-cyan-100/80 md:text-base">
            6 个全屏 shader 效果，向下滚动逐个浏览。真实文字与按钮以 DOM 叠在
            着色器背景之上。
          </p>
          <a
            href="#mesh-gradient"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-2.5 text-sm font-medium text-cyan-100 backdrop-blur-sm transition hover:bg-cyan-400/20"
          >
            向下滚动查看效果
            <span aria-hidden>↓</span>
          </a>
        </div>
      }
    >
      <GrainGradient
        colors={colors}
        colorBack={colorBack}
        softness={softness}
        intensity={intensity}
        noise={noise}
        speed={speed}
        shape={shape}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
