"use client";

/**
 * 宣传图工具 · 通用渲染器（Artboard）
 * ============================================================================
 * 概念上是纯函数 render(template, content)：把 template.layers 按顺序映射成
 * 定位好的层组件。几何是百分比 → 设计空间像素的换算（见 frameToPx）。
 *
 * 三种层：
 * - ShaderBg  背景着色器（paper-shaders）。开 preserveDrawingBuffer，导出时
 *             WebGL 画布可被 html-to-image 光栅化（否则截图空白）。
 * - ImageBox  object-fit:cover 填充 frame；无图时渲染中性占位，保证导出可用。
 * - TextBox   绑定文字，自动缩字号适配 frame，最小字号仍放不下则截断加省略号。
 */

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GrainGradient, MeshGradient } from "@paper-design/shaders-react";
import {
  contractToAspect,
  DEFAULT_IMAGE_TRANSFORM,
  frameToPx,
  type Content,
  type ImageLayer,
  type ImageTransform,
  type ShaderLayer,
  type Size,
  type Template,
  type TextLayer,
} from "./types";

// SSR 时 useLayoutEffect 会告警；客户端才需要它做同步量算。
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** 字体（尤其 Geist 这类 web font）加载完成后 bump 一次，触发文字重新适配。 */
function useDocumentFontsReady(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (alive) setTick((t) => t + 1);
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  return tick;
}

/**
 * 从着色器调色板生成一张静态 CSS 渐变，铺在画布最底层。正常情况下不透明的
 * 着色器画布会盖住它；一旦 WebGL context lost / 截图取不到帧，它就是兜底背景。
 */
function underlayBackground(layer?: ShaderLayer): string {
  if (!layer) return "#0a0a14";
  const [c0, c1, c2] = layer.colors;
  const back = layer.colorBack ?? "#0a0a14";
  return [
    `radial-gradient(60% 60% at 24% 18%, ${c0}, transparent 60%)`,
    `radial-gradient(55% 55% at 82% 30%, ${c1 ?? c0}, transparent 60%)`,
    `radial-gradient(65% 65% at 60% 92%, ${c2 ?? c1 ?? c0}, transparent 62%)`,
    back,
  ].join(", ");
}

/* —— 背景着色器层 —— */
function ShaderBg({ layer }: { layer: ShaderLayer }) {
  const fill: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };
  // 关键：开启 preserveDrawingBuffer，导出时 WebGL 画布内容才读得到。
  const webGlContextAttributes = { preserveDrawingBuffer: true } as const;

  if (layer.shader === "mesh") {
    return (
      <MeshGradient
        colors={layer.colors}
        distortion={layer.distortion ?? 0.8}
        swirl={layer.swirl ?? 0.6}
        speed={layer.speed ?? 0.4}
        style={fill}
        webGlContextAttributes={webGlContextAttributes}
      />
    );
  }
  return (
    <GrainGradient
      colors={layer.colors}
      colorBack={layer.colorBack ?? "#0a0a14"}
      shape={layer.shape ?? "corners"}
      softness={layer.softness ?? 0.7}
      intensity={layer.intensity ?? 0.5}
      noise={layer.noise ?? 0.28}
      speed={layer.speed ?? 0.5}
      style={fill}
      webGlContextAttributes={webGlContextAttributes}
    />
  );
}

/* —— 图片层（含无图占位、拖拽平移、手动适配布局） —— */
function ImageBox({
  layer,
  content,
  size,
  interactive,
  onTransform,
}: {
  layer: ImageLayer;
  content: Content;
  size: Size;
  interactive?: boolean;
  onTransform?: (t: ImageTransform) => void;
}) {
  const rawBox = frameToPx(layer.frame, size);
  // aspect 锁：圆形框等在任何画布比例下保持形状（frame 内居中收缩）
  const box = layer.aspect ? contractToAspect(rawBox, layer.aspect) : rawBox;
  const t = content.imageTransform ?? DEFAULT_IMAGE_TRANSFORM;

  const wrapRef = useRef<HTMLDivElement>(null);
  // 自然尺寸按图片 src 记录：换图后旧值自动失效，无需 effect 重置
  const [meta, setMeta] = useState<{ src: string; size: Size } | null>(null);
  const natural = meta && meta.src === content.image ? meta.size : null;
  const [dragging, setDragging] = useState(false);
  // 拖拽起点（屏幕坐标）+ 起始偏移；delta 一律从起点算，避免累积误差
  const dragStart = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const base: React.CSSProperties = {
    position: "absolute",
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    borderRadius: layer.radius ?? 0,
    overflow: "hidden",
  };

  if (content.image) {
    // 手动适配：先算 cover/contain 基准缩放，再乘用户 zoom，最后加百分比位移。
    // 全部落成内联 px 样式，导出克隆 DOM 时布局原样带走。
    let imgStyle: React.CSSProperties;
    if (natural) {
      const coverS = Math.max(box.width / natural.w, box.height / natural.h);
      const containS = Math.min(box.width / natural.w, box.height / natural.h);
      const s = (t.fit === "cover" ? coverS : containS) * t.zoom;
      const w = natural.w * s;
      const h = natural.h * s;
      imgStyle = {
        position: "absolute",
        left: (box.width - w) / 2 + (t.offsetX / 100) * box.width,
        top: (box.height - h) / 2 + (t.offsetY / 100) * box.height,
        width: w,
        height: h,
        maxWidth: "none", // 盖掉 preflight 的 img{max-width:100%}
        display: "block",
      };
    } else {
      // 自然尺寸未知（首帧）：先用 cover 占位，onLoad 后切换成手动布局
      imgStyle = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      };
    }

    const canDrag = Boolean(interactive && onTransform);
    return (
      <div
        ref={wrapRef}
        style={{
          ...base,
          cursor: canDrag ? (dragging ? "grabbing" : "grab") : undefined,
          touchAction: canDrag ? "none" : undefined,
        }}
        onPointerDown={(e) => {
          if (!canDrag) return;
          e.preventDefault();
          wrapRef.current?.setPointerCapture(e.pointerId);
          dragStart.current = { sx: e.clientX, sy: e.clientY, ox: t.offsetX, oy: t.offsetY };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          const d = dragStart.current;
          const rect = wrapRef.current?.getBoundingClientRect();
          if (!d || !rect || !onTransform) return;
          // 屏幕 delta / 屏上盒宽 = 相对 frame 的百分比（预览缩放自动抵消）
          onTransform({
            ...t,
            offsetX: d.ox + ((e.clientX - d.sx) / rect.width) * 100,
            offsetY: d.oy + ((e.clientY - d.sy) / rect.height) * 100,
          });
        }}
        onPointerUp={(e) => {
          wrapRef.current?.releasePointerCapture(e.pointerId);
          dragStart.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          setDragging(false);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.image}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight && content.image) {
              setMeta({
                src: content.image,
                size: { w: img.naturalWidth, h: img.naturalHeight },
              });
            }
          }}
          style={imgStyle}
        />
      </div>
    );
  }

  // 中性占位：磨砂面板 + 图片字形，导出时看起来是刻意留白而非缺失。
  return (
    <div
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.min(box.width, box.height) * 0.26}
        height={Math.min(box.width, box.height) * 0.26}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.6" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

/* —— 文字层（自动缩字号 + 溢出省略） —— */
function TextBox({
  layer,
  content,
  size,
  fontsTick,
}: {
  layer: TextLayer;
  content: Content;
  size: Size;
  fontsTick: number;
}) {
  const box = frameToPx(layer.frame, size);
  const text = content[layer.bind] ?? "";
  const lineHeight = layer.lineHeight ?? 1.15;

  const ref = useRef<HTMLDivElement>(null);
  const [fitted, setFitted] = useState(layer.size);
  const [clampLines, setClampLines] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maxSize = layer.size;
    const minSize = Math.min(layer.size, 14); // 最小字号
    // 量算阶段：用 block 布局（此时 -webkit-line-clamp 自动失效），
    // 让 scrollHeight 反映真实内容高度。
    el.style.display = "block";
    let s = maxSize;
    el.style.fontSize = `${s}px`;
    const overflows = () => el.scrollHeight > el.clientHeight + 1;
    while (s > minSize && overflows()) {
      s -= 1;
      el.style.fontSize = `${s}px`;
    }
    const fits = !overflows();
    const lines = Math.max(1, Math.floor(box.height / (s * lineHeight)));
    setFitted(s);
    setClampLines(fits ? null : lines);
    // 依赖：文字 / 基准字号 / 字体 / 字重 / 盒子尺寸 / 行高 / 字体就绪
  }, [
    text,
    layer.size,
    layer.font,
    layer.weight,
    box.width,
    box.height,
    lineHeight,
    fontsTick,
  ]);

  const clamped = clampLines != null;
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        margin: 0,
        overflow: "hidden",
        fontFamily: layer.font,
        fontWeight: layer.weight,
        fontSize: fitted,
        lineHeight,
        letterSpacing: layer.letterSpacing,
        color: layer.color,
        textAlign: layer.align,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        display: clamped ? "-webkit-box" : "block",
        ...(clamped
          ? { WebkitBoxOrient: "vertical", WebkitLineClamp: String(clampLines) }
          : null),
      }}
    >
      {text}
    </div>
  );
}

export type ArtboardProps = {
  template: Template;
  content: Content;
  size: Size;
  /** 外层用来注入预览缩放 transform；导出时会被覆盖为 none */
  style?: React.CSSProperties;
  /** 预览态开启：图片层可拖拽平移 */
  interactive?: boolean;
  onImageTransform?: (t: ImageTransform) => void;
};

/**
 * Artboard —— 渲染器主体。ref 指向固定尺寸（设计空间像素）的画布根节点，
 * 导出管线直接对它光栅化。
 */
export const Artboard = forwardRef<HTMLDivElement, ArtboardProps>(
  function Artboard(
    { template, content, size, style, interactive, onImageTransform },
    ref,
  ) {
    const fontsTick = useDocumentFontsReady();
    const shaderLayer = template.layers.find(
      (l): l is ShaderLayer => l.type === "shader",
    );

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: size.w,
          height: size.h,
          overflow: "hidden",
          background: underlayBackground(shaderLayer),
          ...style,
        }}
      >
        {template.layers.map((layer, i) => {
          if (layer.type === "shader")
            return <ShaderBg key={i} layer={layer} />;
          if (layer.type === "image")
            return (
              <ImageBox
                key={i}
                layer={layer}
                content={content}
                size={size}
                interactive={interactive}
                onTransform={onImageTransform}
              />
            );
          return (
            <TextBox
              key={i}
              layer={layer}
              content={content}
              size={size}
              fontsTick={fontsTick}
            />
          );
        })}
      </div>
    );
  },
);
