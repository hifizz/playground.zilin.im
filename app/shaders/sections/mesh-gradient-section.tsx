"use client";

import React from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * MeshGradient · 弥散流动的多色渐变。
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
      index="02"
      name="Mesh Gradient"
      description="弥散流动的多色渐变，色斑沿各自轨迹移动并被有机扰动。"
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
