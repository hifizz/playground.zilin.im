"use client";

import React from "react";
import { LiquidMetal } from "@paper-design/shaders-react";
import { ShaderSection, shaderFill } from "../shader-section";

/**
 * LiquidMetal · 液态金属材质，套在内置 shape="metaballs" 上
 * （也可传入 `image`：一张 logo SVG/PNG 的 URL，作为材质遮罩）。
 * colorBack 深色、colorTint 冷白。
 */
export interface LiquidMetalSectionProps {
  colorBack?: string;
  colorTint?: string;
  distortion?: number;
  speed?: number;
  scale?: number;
  /** 内置形状；传 image 时忽略 */
  shape?: "none" | "circle" | "daisy" | "diamond" | "metaballs";
  /** 可选：logo 图片 URL，作为液态金属的遮罩形状 */
  image?: string;
}

export function LiquidMetalSection({
  colorBack = "#05060a",
  colorTint = "#e0f2fe",
  distortion = 0.1,
  speed = 1,
  scale = 0.6,
  shape = "metaballs",
  image,
}: LiquidMetalSectionProps) {
  return (
    <ShaderSection
      id="liquid-metal"
      index="04"
      name="Liquid Metal"
      description="液态金属材质，套在内置融球形状上，可替换为自定义 logo。"
    >
      <LiquidMetal
        colorBack={colorBack}
        colorTint={colorTint}
        distortion={distortion}
        speed={speed}
        scale={scale}
        // 传了 image 就用图片当遮罩，否则用内置 shape
        {...(image ? { image } : { shape })}
        style={shaderFill}
      />
    </ShaderSection>
  );
}
