"use client";

import React from "react";
import { Metaballs } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * Metaballs · 融球，营造有机的 AI 生命感。
 * 青蓝绿多色 + 深色背景。
 */
export interface MetaballsSectionProps {
  colors?: string[];
  colorBack?: string;
  count?: number;
  size?: number;
  speed?: number;
}

export function MetaballsSection({
  colors = ["#22d3ee", "#06b6d4", "#0891b2", "#2563eb", "#10b981"],
  colorBack = "#05060a",
  count = 8,
  size = 0.8,
  speed = 1,
}: MetaballsSectionProps) {
  return (
    <ShaderSection
      id="metaballs"
      index="05"
      name="Metaballs"
      description="融球：多个有机色团相互融合，营造 AI 的生命感。"
    >
      <Metaballs
        colors={colors}
        colorBack={colorBack}
        count={count}
        size={size}
        speed={speed}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
