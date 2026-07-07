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

/** 画布比例 = 宽高的相对分量（w:h）。既是预设，也是自定义的统一表示。 */
export type Ratio = { w: number; h: number };

/**
 * 图片在 frame 内的适配与变换（用户可调）：
 * - fit：cover 裁满填充 / contain 完整显示（截图类素材友好，不放大裁切）。
 * - zoom：相对基准适配的缩放倍率（1 = 恰好 cover/contain）。
 * - offsetX/offsetY：相对 frame 宽高的百分比位移（拖拽平移）。
 */
export type ImageTransform = {
  fit: "cover" | "contain";
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  fit: "cover",
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

/** 用户填的内容 */
export type Content = {
  title: string;
  caption: string;
  image?: string; // dataURL（本地上传后降采样），可空
  imageTransform?: ImageTransform; // 缺省 = DEFAULT_IMAGE_TRANSFORM
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

/** 图片层：按 content.imageTransform 适配 frame，圆角 */
export type ImageLayer = {
  type: "image";
  bind: "image";
  frame: Frame;
  fit: "cover"; // 模板的默认适配（用户的 imageTransform 优先）
  radius?: number; // 设计空间像素（相对 BASE_W=1080）
  /**
   * 锁定 frame 实际像素盒的宽高比（w/h），在 frame 内居中收缩得到。
   * 用途：圆形头像框设 aspect:1，画布换任何比例都保持正圆，不会变胶囊。
   */
  aspect?: number;
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

export type RatioPreset = { id: string; label: string; hint: string; w: number; h: number };

/** 常用比例预设（社交 / 营销）。用户也可在此之外自定义任意 w:h。 */
export const RATIO_PRESETS: RatioPreset[] = [
  { id: "1-1", label: "1:1", hint: "方形", w: 1, h: 1 },
  { id: "4-5", label: "4:5", hint: "竖版", w: 4, h: 5 },
  { id: "3-4", label: "3:4", hint: "竖版", w: 3, h: 4 },
  { id: "2-3", label: "2:3", hint: "竖版", w: 2, h: 3 },
  { id: "9-16", label: "9:16", hint: "竖屏", w: 9, h: 16 },
  { id: "3-2", label: "3:2", hint: "照片", w: 3, h: 2 },
  { id: "16-9", label: "16:9", hint: "宽屏", w: 16, h: 9 },
  { id: "1.91-1", label: "1.91:1", hint: "链接卡", w: 1.91, h: 1 },
];

export const DEFAULT_RATIO: Ratio = { w: 4, h: 5 };

export type Size = { w: number; h: number };

// 相对 BASE_W 的高度上下限，防止极端比例产生超大 / 超小画布。
const MIN_H = 216; // 最扁 ≈ 5:1
const MAX_H = 4320; // 最高 ≈ 1:4

/** 给定比例，算出设计空间画布的像素尺寸（宽恒为 BASE_W，高按比例并夹取） */
export function artboardSize(ratio: Ratio): Size {
  const raw = (BASE_W * ratio.h) / ratio.w;
  const h = Math.round(Math.min(Math.max(raw, MIN_H), MAX_H));
  return { w: BASE_W, h };
}

/** 两个比例是否等价（w/h 近似相等） */
export function aspectsEqual(a: Ratio, b: Ratio): boolean {
  return Math.abs(a.w / a.h - b.w / b.h) < 1e-3;
}

/** 文件名 / 展示用比例串：4x5 / 16x9 / 1.91x1 */
export function formatRatio(r: Ratio): string {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));
  return `${fmt(r.w)}x${fmt(r.h)}`;
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

export type PxBox = ReturnType<typeof frameToPx>;

/** 在盒子内居中收缩到指定宽高比（w/h）。ImageLayer.aspect 用。 */
export function contractToAspect(box: PxBox, aspect: number): PxBox {
  let w = box.width;
  let h = box.height;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  return {
    left: box.left + (box.width - w) / 2,
    top: box.top + (box.height - h) / 2,
    width: w,
    height: h,
  };
}
