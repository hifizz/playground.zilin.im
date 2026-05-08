"use client";

import React, { useMemo, useState } from "react";
import {
  ScanLine,
  ShieldAlert,
  Sparkles,
  Leaf,
  Zap,
  Eye,
  Palette,
  Minus,
} from "lucide-react";

/**
 * ============================================================================
 * Scan Border · iOS 18 Siri / Apple Intelligence 风格的边缘光晕
 * ============================================================================
 *
 * 这次的实现完全换思路 —— 之前用 4 条 linear-gradient 从四边向内 fade，
 * 出来的效果"粗犷"、像贴了 4 条灯条。真正的 Siri 边缘光晕是：
 *
 *   ① 一个巨大的 conic-gradient（多色相）旋转 → 颜色绕中心流动
 *   ② 在 conic 上叠一层很大的 filter: blur() → 颜色互相融合，气体感
 *   ③ 用 radial-gradient 当 mask → 从中心向外平滑过渡到 fully opaque，
 *      边缘最亮、向内自然消散，没有"硬描边"的感觉
 *   ④ 整体 opacity 慢慢呼吸 → 节奏感
 *
 * 参考：
 *   - CodePen femanzo/pen/LYKaxgz（iOS 18 同款效果）
 *   - jacobamobin/AppleIntelligenceGlowEffect（SwiftUI 实现）
 *
 * 关键决策：
 *   - 不旋转 rotor 元素本身，而是用 @property 注册 --scan-angle，让
 *     conic-gradient 的起始角度跟着动 —— 视觉上是颜色绕一圈，但元素
 *     本身静止，省一次 transform 重排
 *   - rotor 用 vmax 大小（150vmax）确保任何宽高比下都覆盖整个视口，
 *     不需要根据屏幕调整。inset 模式下用 200% 适配父容器
 *   - mask 用 ellipse closest-side：自动适应容器纵横比，宽屏椭圆扁、
 *     竖屏椭圆高，glow 永远均匀贴 4 条边
 *   - blur 直接给 rotor 加 filter，而不是 wrapper，避免把 mask 边界
 *     也糊掉。wrapper 只负责剪形状
 *   - 单色模式：colors 数组只有 1 个值时，conic 就是一片纯色，自动
 *     "不旋转"（spin 还在跑但视觉上没变化），干净的"警示模式"
 * ============================================================================
 */

type ScanBorderProps = {
  /**
   * 颜色数组。多色 = 彩虹流动（Siri 同款），单色 = 沉稳的单色 glow。
   * 数组首尾自动闭环（最后一个色和第一个色衔接），保证旋转无缝。
   */
  colors?: string[];
  /**
   * 视觉模式：
   *   - "glow"（默认）= Siri / Apple Intelligence 大气感光晕，颜色从边向内淡出。
   *     用 4 条 linear-gradient 叠加做矩形 fade。
   *   - "ring" = CodePen / Magic UI 同款锐利彩虹环，宽度固定，无内 fade。
   *     用 mask-composite: exclude 把容器抠成"只剩 padding"的环，conic 颜色只在环上可见。
   *     在卡片、按钮等小容器上比 glow 模式干净得多。
   */
  mode?: "glow" | "ring";
  /** 每条边向内 fade 的距离，0–1（仅 glow 模式）。0.14 = 每边 14% 边长。 */
  thickness?: number;
  /** 环宽，单位 px（仅 ring 模式）。1.5–3 是 CodePen 同款锐利感。 */
  borderWidth?: number;
  /**
   * 模糊半径（px）。这是"细腻感"的核心 —— 50 以下颜色还能看出条带，
   * 60–100 是 Siri 那种气体融合的甜区，100+ 会糊成一片白光。
   */
  blur?: number;
  /** 颜色绕一圈的时长（秒）。8–14 是耐看区间。0 = 不旋转。 */
  spinDuration?: number;
  /** 一次完整呼吸的时长（秒）。 */
  breathDuration?: number;
  /** 呼吸最低点的不透明度比例（0–1）。越小呼吸感越强。 */
  minOpacity?: number;
  /** 整体最大不透明度（0–1）。配合 minOpacity 决定呼吸的整体深浅。 */
  intensity?: number;
  /** 饱和度倍率。1 = 原色；1.2–1.5 让色相更浓、更"有 AI 感"。 */
  saturation?: number;
  /** false: 浮在视口（fixed）；true: 浮在最近的定位父元素（absolute） */
  inset?: boolean;
  /** 关闭整体效果（淡入淡出）。 */
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** Siri / Apple Intelligence 默认彩虹色板：橙→金→青→蓝→紫，最后回到橙形成无缝循环 */
export const SIRI_RAINBOW = [
  "#FF6B5C",
  "#FF8A3D",
  "#FFB347",
  "#fbbf24",
  "#34d399",
  "#06b6d4",
  "#4F8FFF",
  "#a855f7",
  "#FF6B5C",
];

function ScanBorder({
  colors = SIRI_RAINBOW,
  mode = "glow",
  thickness = 0.14,
  borderWidth = 2,
  blur = 70,
  spinDuration = 9,
  breathDuration = 3.5,
  minOpacity = 0.5,
  intensity = 0.9,
  saturation = 1.2,
  inset = false,
  active = true,
  className,
  style,
}: ScanBorderProps) {
  const positionClass = inset ? "absolute" : "fixed";

  // conic 颜色串。单色时复制一遍保证 conic-gradient 至少 2 个 stop
  const stops = useMemo(() => {
    if (colors.length === 1) return `${colors[0]}, ${colors[0]}`;
    return colors.join(", ");
  }, [colors]);

  const conicBackground = `conic-gradient(from var(--scan-angle, 0deg), ${stops})`;
  const filterStr = `blur(${blur}px) saturate(${saturation})`;
  const spinStyle =
    spinDuration > 0
      ? { animation: `scan-border-spin ${spinDuration}s linear infinite` }
      : {};

  // ===== Ring 模式 ====================================================
  // mask-composite: exclude + padding = "只剩 padding 那一圈" 的环。
  // 两层 mask：内层用 content-box 限定到内部，外层用 border-box 覆盖整个元素，
  // exclude 把内部减掉，剩下 padding 那一圈作为可见区域。
  // rotor 用方形（aspect-ratio:1）保证 conic 比例对称，旋转时颜色匀速流过环。
  if (mode === "ring") {
    const ringMask =
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";
    return (
      <div
        aria-hidden
        className={`${positionClass} inset-0 pointer-events-none transition-opacity duration-500 ${className ?? ""}`}
        style={{
          borderRadius: "inherit",
          padding: borderWidth,
          WebkitMask: ringMask,
          mask: ringMask,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: active ? intensity : 0,
          // 整体呼吸（可选）
          animation: `scan-border-breath ${breathDuration}s ease-in-out infinite`,
          ["--scan-min" as string]: minOpacity,
          ...style,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "200%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: conicBackground,
            filter: filterStr,
            ...spinStyle,
          }}
        />
      </div>
    );
  }

  // ===== Glow 模式（默认）=============================================
  // 4 条 linear-gradient 从每条边向内 fade，依靠 mask-composite: add 叠加。
  // glow 严格沿矩形边走（不是椭圆），corner 因相邻两条 mask 叠加自然变亮 → "corner energy"。
  //
  // 关键：fade 距离用统一长度单位，不能用 `%`。
  // 用 % 的话，gradient 的"轴长度"是它所在方向的尺寸 —— top/bottom mask 用高度的 N%、
  // left/right mask 用宽度的 N%。横长方形容器上左右 fade 会比上下宽好几倍。
  //
  // - fixed 模式（视口）：`vmin` = 视口较短边的 1%，无需任何 setup
  // - inset 模式（容器）：`cqi` = 容器 inline-size 的 1%（横排文档下 = 宽度）。
  //   配合父容器 `container-type: inline-size`，cqi 可解析为本容器的尺寸。
  //   不用 cqmin / size 是因为 size containment 会把容器高度从内容里"切断"，
  //   导致卡片塌成空高度。inline-size 只 contain 横向，高度仍由内容决定。
  const fadeUnit = inset ? "cqi" : "vmin";
  const fadeLength = `${thickness * 100}${fadeUnit}`;
  const sideMask = `linear-gradient(to top,    black, transparent ${fadeLength}),
                    linear-gradient(to bottom, black, transparent ${fadeLength}),
                    linear-gradient(to left,   black, transparent ${fadeLength}),
                    linear-gradient(to right,  black, transparent ${fadeLength})`;

  // rotor 大小：fixed 模式用 vmax 覆盖视口；inset 模式 200%
  const rotorSize = inset ? "200%" : "150vmax";

  return (
    <div
      aria-hidden
      className={`${positionClass} inset-0 pointer-events-none transition-opacity duration-700 ${className ?? ""}`}
      style={{
        borderRadius: "inherit",
        overflow: "hidden",
        opacity: active ? intensity : 0,
        WebkitMask: sideMask,
        mask: sideMask,
        animation: `scan-border-breath ${breathDuration}s ease-in-out infinite`,
        ["--scan-min" as string]: minOpacity,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: rotorSize,
          height: rotorSize,
          transform: "translate(-50%, -50%)",
          background: conicBackground,
          filter: filterStr,
          ...spinStyle,
        }}
      />
    </div>
  );
}

/**
 * ============================================================================
 * 配色预设
 * ============================================================================
 * 单色预设（Threat / Safe）做"沉稳警示色"，多色（Siri / Magic / ...）做流动彩虹。
 */
// Preset 不再控制 thickness：在不同 preset 之间切换时，thickness 保持不变，
// 用户从 slider 设的值（持久化到 localStorage）始终生效。
// 这样切换主题色不会把"光晕宽度"也跟着换，视觉一致性更好。
type Preset = {
  id: string;
  label: string;
  description: string;
  swatch: string; // 用于按钮上的色块
  icon: React.ElementType;
  colors: string[];
  blur: number;
  spinDuration: number;
  breathDuration: number;
  saturation: number;
};

const PRESETS: Preset[] = [
  {
    id: "hairline",
    label: "Hairline",
    description: "细发丝 · CodePen 同款锐利彩虹环",
    swatch:
      "conic-gradient(from 0deg, #FF6B5C, #FFB347, #34d399, #4F8FFF, #a855f7, #FF6B5C)",
    icon: Minus,
    colors: SIRI_RAINBOW,
    blur: 8,
    spinDuration: 4,
    breathDuration: 3,
    saturation: 1.4,
  },
  {
    id: "siri",
    label: "Siri",
    description: "iOS 18 同款 · 彩虹流动",
    swatch:
      "conic-gradient(from 0deg, #FF6B5C, #FFB347, #34d399, #4F8FFF, #a855f7, #FF6B5C)",
    icon: Sparkles,
    colors: SIRI_RAINBOW,
    blur: 70,
    spinDuration: 10,
    breathDuration: 4,
    saturation: 1.0,
  },
  {
    id: "scan",
    label: "Scanning",
    description: "AI 正在分析 · 青蓝双色",
    swatch:
      "conic-gradient(from 0deg, #06b6d4, #38bdf8, #4F8FFF, #06b6d4)",
    icon: ScanLine,
    colors: ["#06b6d4", "#22d3ee", "#38bdf8", "#4F8FFF", "#06b6d4"],
    blur: 60,
    spinDuration: 8,
    breathDuration: 3,
    saturation: 1.2,
  },
  {
    id: "threat",
    label: "Threat",
    description: "检测到风险 · 红橙脉动",
    swatch:
      "conic-gradient(from 0deg, #ef4444, #f97316, #fbbf24, #ef4444)",
    icon: ShieldAlert,
    colors: ["#dc2626", "#ef4444", "#f97316", "#ef4444", "#dc2626"],
    blur: 55,
    spinDuration: 6,
    breathDuration: 1.6,
    saturation: 1.3,
  },
  {
    id: "magic",
    label: "Magic",
    description: "生成中 · 紫粉幻彩",
    swatch:
      "conic-gradient(from 0deg, #a855f7, #ec4899, #d946ef, #a855f7)",
    icon: Palette,
    colors: ["#a855f7", "#ec4899", "#d946ef", "#8b5cf6", "#a855f7"],
    blur: 75,
    spinDuration: 11,
    breathDuration: 4.5,
    saturation: 1.3,
  },
  {
    id: "safe",
    label: "Safe",
    description: "通过验证 · 翠绿沉稳",
    swatch:
      "conic-gradient(from 0deg, #10b981, #34d399, #6ee7b7, #10b981)",
    icon: Leaf,
    colors: ["#059669", "#10b981", "#34d399", "#10b981", "#059669"],
    blur: 60,
    spinDuration: 14,
    breathDuration: 5,
    saturation: 1.15,
  },
  {
    id: "energy",
    label: "Energy",
    description: "能量充能 · 暖橙急促",
    swatch:
      "conic-gradient(from 0deg, #f59e0b, #fbbf24, #fb923c, #f59e0b)",
    icon: Zap,
    colors: ["#f59e0b", "#fbbf24", "#fb923c", "#ea580c", "#f59e0b"],
    blur: 60,
    spinDuration: 5,
    breathDuration: 2,
    saturation: 1.25,
  },
  {
    id: "stealth",
    label: "Stealth",
    description: "深空蓝 · 慢节奏",
    swatch:
      "conic-gradient(from 0deg, #4338ca, #6366f1, #818cf8, #4338ca)",
    icon: Eye,
    colors: ["#312e81", "#4338ca", "#6366f1", "#4338ca", "#312e81"],
    blur: 80,
    spinDuration: 16,
    breathDuration: 6,
    saturation: 1.1,
  },
];

/**
 * ============================================================================
 * Page
 * ============================================================================
 */
const THICKNESS_STORAGE_KEY = "scan-border:thickness";
const DEFAULT_THICKNESS = 0.03;

/** localStorage-backed thickness：mount 后从 storage 读初值，之后每次写入 setThickness 都同步落盘。
 *  用 lazy useState init 直接读 localStorage，避免"先渲染默认值再 useEffect 读 storage"造成的双 effect 链。
 *  SSR 时 typeof window 为 undefined，返回 default，避免 hydration error 时给一个稳定的 fallback。 */
function useThicknessStorage(defaultValue: number): [number, (v: number) => void] {
  const [value, setValueRaw] = useState<number>(() => {
    if (typeof window === "undefined") return defaultValue;
    const saved = window.localStorage.getItem(THICKNESS_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return defaultValue;
  });
  const setValue = (v: number) => {
    setValueRaw(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THICKNESS_STORAGE_KEY, String(v));
    }
  };
  return [value, setValue];
}

export default function ScanBorderPage() {
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [colors, setColors] = useState<string[]>(preset.colors);

  // thickness 完全归 slider —— preset 切换不会改它，跨主题保持一致。3% 为默认。
  const [thickness, setThickness] = useThicknessStorage(DEFAULT_THICKNESS);

  const [blur, setBlur] = useState(preset.blur);
  const [spinDuration, setSpinDuration] = useState(preset.spinDuration);
  const [breathDuration, setBreathDuration] = useState(preset.breathDuration);
  const [saturation, setSaturation] = useState(preset.saturation);
  const [minOpacity, setMinOpacity] = useState(0.55);
  const [intensity, setIntensity] = useState(0.7);
  const [active, setActive] = useState(true);
  const [pageWide, setPageWide] = useState(true);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setColors(p.colors);
    // 注意：不再 setThickness(p.thickness) —— thickness 跨 preset 保持一致
    setBlur(p.blur);
    setSpinDuration(p.spinDuration);
    setBreathDuration(p.breathDuration);
    setSaturation(p.saturation);
  };

  // 单色模式切换：用第一个 stop 的颜色填整个数组
  const toSingleColor = (hex: string) => setColors([hex]);
  const isSingle = colors.length === 1;

  return (
    <div className="relative min-h-screen w-full bg-[#070709] py-12 text-white">
      {/* 全局动画定义。@property 注册让 --scan-angle 能被浏览器在 keyframes 之间作为 <angle> 平滑插值 */}
      <style>{`
        @property --scan-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes scan-border-spin {
          to { --scan-angle: 360deg; }
        }
        @keyframes scan-border-breath {
          0%, 100% { opacity: var(--scan-min, 0.55); }
          50%      { opacity: 1; }
        }
      `}</style>

      {/* ===== 视口范围的扫描描边（fixed） ===== */}
      {pageWide && (
        <ScanBorder
          colors={colors}
          thickness={thickness}
          blur={blur}
          spinDuration={spinDuration}
          breathDuration={breathDuration}
          saturation={saturation}
          minOpacity={minOpacity}
          intensity={intensity}
          active={active}
        />
      )}

      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
            Agent UX · Scan Border
          </div>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            {`iOS 18 Siri 风格 · 边缘光晕`}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/55">
            {`屏幕四周浮一圈彩虹色光晕，颜色绕中心慢慢流动，整体随呼吸节奏明暗摆动。模拟 AI 在分析当前页面时的状态，比 toast 更安静，比 loading bar 更有空间感。技术参考：iOS 18 唤起 Siri / Apple Intelligence 时的全屏边缘 glow。`}
          </p>
        </header>

        {/* ===== Preset ===== */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Presets</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {PRESETS.map((p) => {
              const isActive = p.id === preset.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                    isActive
                      ? "border-white/25 bg-white/5"
                      : "border-white/10 bg-[#101013] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full ring-1 ring-white/15"
                      style={{ background: p.swatch }}
                    />
                    <Icon size={12} className="text-white/55" />
                  </div>
                  <div className="text-[12px] font-semibold text-white/90">
                    {p.label}
                  </div>
                  <div className="text-[10px] leading-tight text-white/40">
                    {p.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== Controls ===== */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Controls</SectionLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ColorRow
              label={isSingle ? "Single color" : "Anchor → single"}
              value={colors[0]}
              onChange={toSingleColor}
            />
            <Slider
              label="Thickness"
              value={thickness}
              min={0.003}
              max={0.5}
              step={0.001}
              onChange={setThickness}
              format={(v) => (v < 0.01 ? `${(v * 100).toFixed(1)}%` : `${Math.round(v * 100)}%`)}
            />
            <Slider
              label="Blur"
              value={blur}
              min={0}
              max={140}
              step={1}
              onChange={setBlur}
              format={(v) => `${v}px`}
            />
            <Slider
              label="Spin duration"
              value={spinDuration}
              min={0}
              max={20}
              step={0.5}
              onChange={setSpinDuration}
              format={(v) => (v === 0 ? "static" : `${v}s`)}
            />
            <Slider
              label="Breath duration"
              value={breathDuration}
              min={0.8}
              max={8}
              step={0.1}
              onChange={setBreathDuration}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <Slider
              label="Saturation"
              value={saturation}
              min={0.6}
              max={2}
              step={0.05}
              onChange={setSaturation}
              format={(v) => `${v.toFixed(2)}×`}
            />
            <Slider
              label="Min opacity"
              value={minOpacity}
              min={0.1}
              max={0.95}
              step={0.05}
              onChange={setMinOpacity}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Intensity"
              value={intensity}
              min={0.2}
              max={1}
              step={0.05}
              onChange={setIntensity}
              format={(v) => v.toFixed(2)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Active" value={active} onChange={setActive} />
              <Toggle
                label="Page-wide"
                value={pageWide}
                onChange={setPageWide}
              />
            </div>
          </div>
        </section>

        {/* ===== Scoped 用法 ===== */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Scoped · 贴在容器内</SectionLabel>
          <p className="max-w-2xl text-[12px] leading-relaxed text-white/45">
            {`同样的组件，inset 打开后浮在最近的定位父元素里 —— 给某个聊天框、面板、卡片打 "正在分析这块区域" 的标记。`}
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ScopedDemo
              title="Reading repository"
              subtitle="indexing 142 files · resolving call graph"
              colors={colors}
              borderWidth={2}
              blur={4}
              spinDuration={4}
              breathDuration={breathDuration}
              saturation={1.4}
            />
            <ScopedDemo
              title="Auditing for security risks"
              subtitle="scanning prompts · checking trust boundaries"
              colors={["#fca5a5", "#ef4444", "#dc2626", "#fb7185", "#f97316", "#ef4444", "#fca5a5"]}
              borderWidth={2}
              blur={4}
              spinDuration={3}
              breathDuration={1.6}
              saturation={1.4}
            />
          </div>
        </section>

        <footer className="pb-6 text-xs leading-relaxed text-white/30">
          实现要点 ——
          <span className="text-white/55"> 旋转的 conic-gradient </span>
          做颜色流动，
          <span className="text-white/55"> filter: blur(70px) </span>
          做气体融合，
          <span className="text-white/55"> radial-gradient mask </span>
          从中心到边缘平滑过渡，
          <span className="text-white/55"> @property --scan-angle </span>
          让浏览器把角度当 <code className="text-white/70">&lt;angle&gt;</code> 平滑插值。
        </footer>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * Scoped 用法：给容器戴一圈呼吸描边
 * ============================================================================
 */
function ScopedDemo({
  title,
  subtitle,
  colors,
  borderWidth,
  blur,
  spinDuration,
  breathDuration,
  saturation,
}: {
  title: string;
  subtitle: string;
  colors: string[];
  borderWidth: number;
  blur: number;
  spinDuration: number;
  breathDuration: number;
  saturation: number;
}) {
  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl bg-[#0c0c12] p-6"
      // container-type: inline-size 让内部子元素的 cqi 解析为本卡片"宽度的 1%"。
      // 没有这一行，cqi 退化为 0 → glow mask 全透明 → glow 不可见。
      // 不用 `size`：那会把高度也 contain 住，卡片会塌成 0 高度。
      style={{ containerType: "inline-size" }}
    >
      {/* 内层 glow：大气感渐变，从环向内 fade。让卡片的 border 不只是描边线，
          而是真的"在发光"——光向内辐射一段距离再消失。
          intensity 压到 0.32：保证内容可读，避免颜色把字盖掉。
          saturation 强制 1.0：内 glow 不需要那么浓，否则会和 ring 抢戏。
          thickness 现在是"卡片较短边的百分比"（cqmin），不再受卡片宽高比影响。 */}
      <ScanBorder
        mode="glow"
        inset
        colors={colors}
        thickness={0.03}
        blur={50}
        spinDuration={spinDuration}
        breathDuration={breathDuration}
        saturation={1.0}
        intensity={0.32}
        minOpacity={0.65}
      />
      {/* 外层 ring：CodePen 同款锐利彩虹环，定义清晰的 border 形状。
          spin 和 breath 与 glow 同步 → 两层颜色变化对得上、不打架。 */}
      <ScanBorder
        mode="ring"
        inset
        colors={colors}
        borderWidth={borderWidth}
        blur={blur}
        spinDuration={spinDuration}
        breathDuration={breathDuration}
        saturation={Math.max(saturation, 1.4)}
        intensity={1}
      />

      <div className="relative flex flex-col gap-1">
        <div className="text-[13px] font-semibold tracking-tight text-white/90">
          {title}
        </div>
        <div className="text-[11px] text-white/45">{subtitle}</div>
      </div>

      <div className="relative mt-5 flex flex-col gap-2">
        {[88, 64, 80, 52, 70].map((w, i) => (
          <div
            key={i}
            className="h-2 rounded-full bg-white/[0.06]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * Controls
 * ============================================================================
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-white/50">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
      />
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-white/50">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-white"
      />
    </label>
  );
}
