"use client";

import React from "react";
import { NeuroNoise } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * NeuroNoise · 分形神经纹理，做暗色科技背景。冷色调、速度慢一点。
 */
export interface NeuroNoiseSectionProps {
  colorFront?: string;
  colorMid?: string;
  colorBack?: string;
  brightness?: number;
  contrast?: number;
  speed?: number;
  scale?: number;
}

export function NeuroNoiseSection({
  colorFront = "#67e8f9",
  colorMid = "#0e7490",
  colorBack = "#04070c",
  brightness = 0.12,
  contrast = 0.4,
  speed = 0.4,
  scale = 1,
}: NeuroNoiseSectionProps) {
  return (
    <ShaderSection
      id="neuro-noise"
      index="07"
      name="Neuro Noise"
      description="分形神经纹理，冷色慢速流动，作为暗色科技背景。"
      foreground={
        <div className="px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-cyan-300/60">
            fin · 全部 7 个效果
          </p>
          <a
            href="#grain-gradient"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-2.5 text-sm font-medium text-cyan-100 backdrop-blur-sm transition hover:bg-cyan-400/20"
          >
            <span aria-hidden>↑</span>
            回到顶部
          </a>
        </div>
      }
    >
      <NeuroNoise
        colorFront={colorFront}
        colorMid={colorMid}
        colorBack={colorBack}
        brightness={brightness}
        contrast={contrast}
        speed={speed}
        scale={scale}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
