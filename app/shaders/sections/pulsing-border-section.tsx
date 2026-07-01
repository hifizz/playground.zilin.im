"use client";

import React from "react";
import { PulsingBorder } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * PulsingBorder · 脉动边框光，模拟 AI 唤醒时的屏幕边缘流光（Siri 式）。
 * 冷色多色，沿边缘呼吸流动。
 */
export interface PulsingBorderSectionProps {
  colors?: string[];
  colorBack?: string;
  speed?: number;
  thickness?: number;
  softness?: number;
  intensity?: number;
  bloom?: number;
  spots?: number;
  spotSize?: number;
  pulse?: number;
  smoke?: number;
  roundness?: number;
}

export function PulsingBorderSection({
  colors = ["#67e8f9", "#22d3ee", "#0891b2", "#2563eb", "#10b981"],
  colorBack = "#05060a",
  speed = 1.1,
  thickness = 0.08,
  softness = 0.9,
  intensity = 0.3,
  bloom = 0.6,
  spots = 4,
  spotSize = 0.35,
  pulse = 0.5,
  smoke = 0.35,
  roundness = 0.02,
}: PulsingBorderSectionProps) {
  return (
    <ShaderSection
      id="pulsing-border"
      index="04"
      name="Pulsing Border"
      description="脉动边框光，模拟 AI 唤醒时屏幕边缘的 Siri 式流光。"
      foreground={
        <div className="px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/30 px-4 py-2 text-sm text-cyan-100/90 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            正在聆听…
          </div>
        </div>
      }
    >
      <PulsingBorder
        colors={colors}
        colorBack={colorBack}
        speed={speed}
        thickness={thickness}
        softness={softness}
        intensity={intensity}
        bloom={bloom}
        spots={spots}
        spotSize={spotSize}
        pulse={pulse}
        smoke={smoke}
        roundness={roundness}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
