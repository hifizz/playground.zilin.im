"use client";

import React from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * MeshGradient · 弥散流动的多色渐变，做 hero 背景。
 * 关键参数抽成 props，方便后续微调。
 */
export interface MeshGradientSectionProps {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  speed?: number;
}

export function MeshGradientSection({
  colors = ["#0b1220", "#0891b2", "#2563eb", "#10b981"],
  distortion = 0.8,
  swirl = 0.6,
  speed = 0.3,
}: MeshGradientSectionProps) {
  return (
    <ShaderSection
      id="mesh-gradient"
      index="01"
      name="Mesh Gradient"
      description="弥散流动的多色渐变，作为 hero 背景层。"
      foreground={
        <div className="px-6 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan-300/70">
            Paper Shaders · WebGL
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_20px_rgba(8,145,178,0.35)] md:text-6xl">
            冷色系着色器画廊
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-cyan-100/80 md:text-base">
            5 个全屏 shader 效果，向下滚动逐个浏览。真实文字与按钮以 DOM 叠在
            着色器背景之上。
          </p>
          <a
            href="#pulsing-border"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-2.5 text-sm font-medium text-cyan-100 backdrop-blur-sm transition hover:bg-cyan-400/20"
          >
            向下滚动查看效果
            <span aria-hidden>↓</span>
          </a>
        </div>
      }
    >
      <MeshGradient
        colors={colors}
        distortion={distortion}
        swirl={swirl}
        speed={speed}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
