/**
 * 宣传图工具 · 数据结构（schema-as-data）
 * ============================================================================
 * 「内容」和「模板」是两份独立数据，一个通用渲染器把它们合成画布：
 *   render(template, content) —— 同一份 content 换 template 即换版式。
 *
 * 刻意的设计决定：
 * - 几何一律用百分比（0–100，相对画布），与分辨率解耦：导出 2x/3x 时布局不动。
 * - 文字 / 图片层用 `bind` 指向 content 字段，不把文字写死进模板 —— 这一个字段
 *   就是「内容 / 版式分离」的全部机关。
 * - 层级 = 数组顺序（从底到顶），不单独引入 z-index。
 */

export type Ratio = "1:1" | "4:5" | "1.91:1";

/** 用户填的内容 */
export type Content = {
  title: string;
  caption: string;
  image?: string; // dataURL（本地上传后降采样），可空
};

/** 画布内定位框，四个值均为 0–100 的百分比 */
export type Frame = { x: number; y: number; w: number; h: number };

export type GrainShape =
  | "wave"
  | "dots"
  | "truchet"
  | "corners"
  | "ripple"
  | "blob"
  | "sphere";

/** 背景着色器层：paper-shaders GrainGradient / MeshGradient */
export type ShaderLayer = {
  type: "shader";
  shader: "grain" | "mesh";
  colors: string[];
  colorBack?: string;
  // 以下均为可选微调项，扩展时新增可选字段即可，不破坏已有模板
  shape?: GrainShape;
  softness?: number;
  intensity?: number;
  noise?: number;
  distortion?: number;
  swirl?: number;
  speed?: number;
};

/** 图片层：object-fit cover 填充 frame，圆角 */
export type ImageLayer = {
  type: "image";
  bind: "image";
  frame: Frame;
  fit: "cover";
  radius?: number; // 设计空间像素（相对 BASE_W=1080）
};

/** 文字层：渲染绑定的文字，自动缩字号适配 frame */
export type TextLayer = {
  type: "text";
  bind: "title" | "caption";
  frame: Frame;
  font: string;
  size: number; // 设计空间像素（相对 BASE_W=1080）
  weight: number;
  color: string;
  align: "left" | "center" | "right";
  // 可选排版微调
  lineHeight?: number;
  letterSpacing?: number;
};

export type Layer = ShaderLayer | ImageLayer | TextLayer;

export type Template = {
  id: string;
  name: string;
  /** 模板默认比例；App 的 ratio 状态可覆盖它（frame 是百分比，随比例自适应） */
  artboard: { ratio: Ratio };
  layers: Layer[]; // 数组顺序 = 叠放层级，从底到顶
};

/**
 * 设计空间：所有几何 / 字号都定义在一个固定分辨率的画布里（宽恒为 1080），
 * 预览时靠 CSS transform 缩放贴合容器，导出时按 scale 光栅化。这样布局与
 * 分辨率彻底解耦，字号在不同比例间也保持一致（以「宽」为参照）。
 */
export const BASE_W = 1080;

/** ratio → 宽高比（w / h） */
export const RATIOS: Record<Ratio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "1.91:1": 1.91,
};

export const RATIO_LABELS: Record<Ratio, string> = {
  "1:1": "1:1 · 方形",
  "4:5": "4:5 · 竖版",
  "1.91:1": "1.91:1 · 横版",
};

export type Size = { w: number; h: number };

/** 给定比例，算出设计空间画布的像素尺寸（宽恒为 BASE_W） */
export function artboardSize(ratio: Ratio): Size {
  return { w: BASE_W, h: Math.round(BASE_W / RATIOS[ratio]) };
}

/** 百分比 frame → 设计空间像素盒子（纯函数，便于单测） */
export function frameToPx(frame: Frame, size: Size) {
  return {
    left: (frame.x / 100) * size.w,
    top: (frame.y / 100) * size.h,
    width: (frame.w / 100) * size.w,
    height: (frame.h / 100) * size.h,
  };
}
