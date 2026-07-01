"use client";

import React from "react";
import { StaticRadialGradient } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * StaticRadialGradient · 静态径向渐变（含可选颗粒）。
 * 参考 https://shaders.paper.design/static-radial-gradient
 * 这是「静态」shader：speed=0 时 rAF 完全停止，没有持续的性能开销，
 * 但仍占用一个 WebGL context，所以照样走懒挂载。
 */
export interface StaticRadialGradientSectionProps {
  colors?: string[];
  colorBack?: string;
  radius?: number;
  focalDistance?: number;
  focalAngle?: number;
  falloff?: number;
  mixing?: number;
  distortion?: number;
  grainMixer?: number;
  grainOverlay?: number;
  speed?: number;
}

export function StaticRadialGradientSection({
  colors = ["#67e8f9", "#22d3ee", "#0891b2"],
  colorBack = "#05060a",
  radius = 0.85,
  focalDistance = 0.6,
  focalAngle = 0,
  falloff = 0.3,
  mixing = 0.5,
  distortion = 0.12,
  grainMixer = 0.2,
  grainOverlay = 0.15,
  speed = 0,
}: StaticRadialGradientSectionProps) {
  return (
    <ShaderSection
      id="static-radial-gradient"
      index="03"
      name="Static Radial Gradient"
      description="静态径向渐变，冷色聚光 + 细颗粒质感，零动画开销。"
    >
      <StaticRadialGradient
        colors={colors}
        colorBack={colorBack}
        radius={radius}
        focalDistance={focalDistance}
        focalAngle={focalAngle}
        falloff={falloff}
        mixing={mixing}
        distortion={distortion}
        grainMixer={grainMixer}
        grainOverlay={grainOverlay}
        speed={speed}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
